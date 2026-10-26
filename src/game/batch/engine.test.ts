import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acceptConfirm, CONTROLS } from "./actions.ts";
import {
  abort,
  begin,
  buyback,
  commit,
  consumeOneSalvage,
  economySnapshot,
  evaluateUndo,
  preview,
  releaseVendor,
  scavengeVoid,
  settle,
  spendMarks,
  stealBiscuits,
  undo,
} from "./engine.ts";
import { formatSummary, hasKey, t } from "./i18n.ts";
import { selectEligible } from "./protections.ts";
import type { ActionKind, ActionRequest, ConfirmInput, ExtendedAction, World } from "./types.ts";
import { activeQuantity, createWorld, SEED, spawnBodyGear, spawnFillers } from "./world.ts";

function pointer(controlId: string, holdMs = 0): ConfirmInput {
  return { channel: "pointer", controlId, holdMs };
}
function key(chord: string, holdMs = 0): ConfirmInput {
  return { channel: "key", chord, holdMs };
}
function pad(button: string, holdMs = 0): ConfirmInput {
  return { channel: "controller", button, holdMs };
}
function touch(gesture: string, holdMs = 0): ConfirmInput {
  return { channel: "touch", gesture, holdMs };
}

function act(world: World, partial: Partial<ActionRequest> & Pick<ActionRequest, "action" | "lines" | "token">): ActionRequest {
  return {
    locale: "en",
    expectedRevision: world.revision,
    ...partial,
  };
}

function ids(world: World, defId: string): number {
  return Object.values(world.instances).filter((inst) => inst.defId === defId).length;
}

const ACTIONS: ActionKind[] = ["move", "sell", "dismantle", "donate", "discard", "restore"];

describe("distinct controls", () => {
  it("never shares a chord, button, gesture, or pointer id", () => {
    const kinds = Object.keys(CONTROLS) as ExtendedAction[];
    for (const field of ["chord", "controller", "touch", "pointerId"] as const) {
      const values = kinds.map((kind) => CONTROLS[kind][field]);
      assert.equal(new Set(values).size, values.length, field);
    }
    assert.equal(CONTROLS.move.immediate, true);
    for (const kind of kinds) {
      if (kind !== "move") assert.equal(CONTROLS[kind].immediate, false);
      assert.notEqual(CONTROLS[kind].chord, "enter");
      assert.notEqual(CONTROLS[kind].pointerId, "commit-confirm");
    }
    assert.notEqual(CONTROLS.donate.holdMs, CONTROLS.discard.holdMs);
    assert.equal(acceptConfirm("sell", key("Enter"), "en", undefined).reason, "shared-confirm-rejected");
    assert.equal(acceptConfirm("discard", pad("cross"), "en", "DISCARD").reason, "shared-confirm-rejected");
    assert.equal(acceptConfirm("move", pad("b"), "en", undefined).reason, "cancel-is-never-confirm");
    assert.equal(acceptConfirm("dismantle", key("Escape"), "en", undefined).reason, "cancel-is-never-confirm");
  });

  it("a sell chord does not confirm a voiding, and cross does not sell", () => {
    const world = createWorld();
    const discard = commit(
      world,
      act(world, {
        action: "discard",
        token: "wrong",
        lines: [{ instanceId: SEED.wax, quantity: 1 }],
        confirm: key("shift+s"),
        phrase: "DISCARD",
      }),
    );
    assert.equal(discard.receipt.reason, "wrong-action");
    assert.equal(discard.world.instances[SEED.wax].containerId, "stash");
    assert.equal(economySnapshot(discard.world), economySnapshot(world));

    const sold = commit(
      world,
      act(world, {
        action: "sell",
        token: "cross",
        lines: [{ instanceId: SEED.rivet, quantity: 5 }],
        confirm: pad("cross"),
      }),
    );
    assert.equal(sold.receipt.reason, "shared-confirm-rejected");
    assert.equal(sold.world.instances[SEED.rivet].quantity, 40);
    assert.equal(sold.world.currency.gold, 40);
    assert.equal(activeQuantity(sold.world, "rivet"), 40);
  });
});

describe("routine move", () => {
  it("moves a partial stack without copying it and undoes while the lot is untouched", () => {
    const world = createWorld();
    const moved = commit(
      world,
      act(world, {
        action: "move",
        token: "m1",
        destinationId: "stash",
        lines: [{ instanceId: SEED.rivet, quantity: 5 }],
        confirm: pointer("commit-move"),
      }),
    );
    assert.equal(moved.receipt.status, "applied");
    assert.equal(moved.world.instances[SEED.rivet].quantity, 35);
    assert.equal(moved.world.instances[SEED.rivet].provenance.originKey, "origin.quarry");
    assert.equal(activeQuantity(moved.world, "rivet"), 40);
    const child = Object.values(moved.world.instances).find((inst) => inst.parentId === SEED.rivet);
    assert.ok(child);
    assert.equal(child.containerId, "stash");
    assert.equal(child.quantity, 5);
    assert.equal(child.provenance.originKey, "origin.quarry");

    const again = commit(moved.world, act(moved.world, { action: "move", token: "m1", destinationId: "stash", lines: [{ instanceId: SEED.rivet, quantity: 5 }], confirm: key("m") }));
    assert.equal(again.receipt.status, "duplicate");
    assert.equal(again.world.revision, moved.world.revision);
    assert.equal(activeQuantity(again.world, "rivet"), 40);

    const journalId = moved.receipt.journalId!;
    assert.equal(evaluateUndo(moved.world, journalId).reason, "available");
    const undone = undo(moved.world, journalId, "u1");
    assert.equal(undone.receipt.status, "applied");
    assert.equal(undone.world.instances[SEED.rivet].quantity, 40);
    assert.equal(undone.world.instances[child.id].archived, true);
    assert.equal(activeQuantity(undone.world, "rivet"), 40);
    assert.equal(ids(undone.world, "rivet"), 2);

    const twice = undo(undone.world, journalId, "u2");
    assert.equal(twice.verdict?.reason, "already-reversed");
    assert.equal(twice.world.instances[SEED.rivet].quantity, 40);
    const stacked = undo(twice.world, undone.receipt.journalId!, "u3");
    assert.equal(stacked.verdict?.reason, "action-not-reversible");
    assert.equal(activeQuantity(stacked.world, "rivet"), 40);
  });

  it("keeps a named serial across move and refuses undo after a later move", () => {
    let world = createWorld();
    const first = commit(
      world,
      act(world, {
        action: "move",
        token: "lens-1",
        destinationId: "stash",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: pad("cross"),
      }),
    );
    world = first.world;
    const lens = world.instances[SEED.lens];
    assert.equal(lens.containerId, "stash");
    assert.equal(lens.provenance.serial, "MR-014");
    assert.equal(lens.provenance.originKey, "origin.mara");
    assert.equal(ids(world, "lens"), 1);

    const second = commit(
      world,
      act(world, {
        action: "move",
        token: "lens-2",
        destinationId: "pack",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: key("M"),
      }),
    );
    const stale = undo(second.world, first.receipt.journalId!, "undo-stale");
    assert.equal(stale.verdict?.reason, "destination-diverged");
    assert.equal(stale.world.instances[SEED.lens].containerId, "pack");
    assert.equal(activeQuantity(stale.world, "lens"), 1);
    assert.equal(stale.world.instances[SEED.lens].provenance.serial, "MR-014");
  });

  it("unequips on move and will not undo into a taken slot or a full pack", () => {
    let world = createWorld();
    const moved = commit(
      world,
      act(world, {
        action: "move",
        token: "coat",
        destinationId: "pack",
        lines: [{ instanceId: SEED.coat, quantity: 1 }],
        confirm: touch("tap"),
      }),
    );
    world = moved.world;
    assert.equal(world.instances[SEED.coat].containerId, "pack");
    assert.equal(world.instances[SEED.coat].equipSlot, null);
    assert.equal(world.instances[SEED.coat].provenance.serial, "WC-2");
    assert.equal(world.instances[SEED.whistle].equipSlot, "tool");

    const blocked = spawnBodyGear(world, "WC-9");
    const slot = undo(blocked, moved.receipt.journalId!, "slot");
    assert.equal(slot.verdict?.reason, "slot-taken");
    assert.equal(slot.world.instances[SEED.coat].containerId, "pack");
    assert.equal(activeQuantity(slot.world, "coat"), 2);

    const oil = commit(
      createWorld(),
      act(createWorld(), {
        action: "move",
        token: "oil",
        destinationId: "stash",
        lines: [{ instanceId: SEED.oil, quantity: 12 }],
        confirm: pointer("commit-move"),
      }),
    );
    const crowded = spawnFillers(oil.world, "pack", 6);
    assert.equal(evaluateUndo(crowded, oil.receipt.journalId!).reason, "origin-full");
    const failed = undo(crowded, oil.receipt.journalId!, "full");
    assert.equal(failed.world.instances[SEED.oil].containerId, "stash");
    assert.equal(activeQuantity(failed.world, "oil"), 12);
  });

  it("refuses to disguise a sale or a voiding as a move", () => {
    const world = createWorld();
    const disguised = commit(
      world,
      act(world, {
        action: "move",
        token: "disguise",
        destinationId: "vendor",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: pointer("commit-move"),
      }),
    );
    assert.equal(disguised.receipt.reason, "wrong-destination");
    assert.equal(disguised.world.instances[SEED.lens].containerId, "pack");
    assert.equal(disguised.world.currency.gold, 40);
  });
});

describe("sale and buyback", () => {
  it("does not undo a sale, and buyback returns the same piece without minting marks", () => {
    const world = createWorld();
    const sold = commit(
      world,
      act(world, {
        action: "sell",
        token: "sale",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: key("shift+s"),
      }),
    );
    assert.equal(sold.world.currency.gold, 120);
    assert.equal(sold.world.instances[SEED.lens].containerId, "vendor");
    assert.equal(sold.world.instances[SEED.lens].provenance.serial, "MR-014");
    assert.equal(activeQuantity(sold.world, "lens"), 1);
    const report = evaluateUndo(sold.world, sold.receipt.journalId!);
    assert.equal(report.reason, "sell-requires-buyback");
    assert.equal(report.available, false);
    assert.equal(report.buyback?.reason, "buyback-available");
    assert.match(t("en", report.detailKey, report.params), /Buy back is the only return path/);
    assert.match(t("fr", report.detailKey, report.params), /rachat/);

    const undone = undo(sold.world, sold.receipt.journalId!, "not-undo");
    assert.equal(undone.receipt.status, "rejected");
    assert.equal(undone.world.currency.gold, 120);
    assert.equal(undone.world.instances[SEED.lens].containerId, "vendor");
    assert.equal(ids(undone.world, "lens"), 1);

    const bought = buyback(sold.world, {
      journalId: sold.receipt.journalId!,
      token: "bb",
      locale: "en",
      expectedRevision: sold.world.revision,
      confirm: pointer("commit-buyback"),
    });
    assert.equal(bought.receipt.status, "applied");
    assert.equal(bought.world.currency.gold, 40);
    assert.equal(bought.world.instances[SEED.lens].containerId, "pack");
    assert.equal(bought.world.instances[SEED.lens].provenance.serial, "MR-014");
    assert.equal(bought.world.instances[SEED.lens].provenance.originKey, "origin.mara");
    assert.equal(activeQuantity(bought.world, "lens"), 1);

    const replay = buyback(bought.world, {
      journalId: sold.receipt.journalId!,
      token: "bb",
      locale: "en",
      expectedRevision: bought.world.revision,
      confirm: key("shift+y"),
    });
    assert.equal(replay.receipt.status, "duplicate");
    assert.equal(replay.world.currency.gold, 40);

    const restore = commit(
      sold.world,
      act(sold.world, {
        action: "restore",
        token: "no-restore",
        destinationId: "pack",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: key("shift+r"),
      }),
    );
    assert.equal(restore.receipt.reason, "excluded");
    assert.equal(restore.world.instances[SEED.lens].containerId, "vendor");
    assert.equal(restore.world.currency.gold, 120);
  });

  it("buys back a partial stack as the same lot and refuses the trade when marks or the vendor lot are gone", () => {
    const world = createWorld();
    const sold = commit(
      world,
      act(world, {
        action: "sell",
        token: "rivets",
        lines: [{ instanceId: SEED.rivet, quantity: 5 }],
        confirm: pad("square"),
      }),
    );
    assert.equal(sold.world.currency.gold, 50);
    assert.equal(sold.world.instances[SEED.rivet].quantity, 35);
    assert.equal(activeQuantity(sold.world, "rivet"), 40);
    const replay = commit(sold.world, act(sold.world, {
      action: "sell",
      token: "rivets",
      lines: [{ instanceId: SEED.rivet, quantity: 5 }],
      confirm: touch("slide-right"),
    }));
    assert.equal(replay.receipt.status, "duplicate");
    assert.equal(replay.world.currency.gold, 50);

    const poor = spendMarks(spendMarks(sold.world));
    assert.equal(evaluateUndo(poor, sold.receipt.journalId!).buyback?.reason, "buyback-currency-short");
    const denied = buyback(poor, {
      journalId: sold.receipt.journalId!,
      token: "poor",
      locale: "fr",
      expectedRevision: poor.revision,
      confirm: touch("slide-left"),
    });
    assert.equal(denied.verdict?.reason, "buyback-currency-short");
    assert.equal(denied.world.currency.gold, poor.currency.gold);
    assert.equal(activeQuantity(denied.world, "rivet"), 40);

    const released = releaseVendor(sold.world);
    assert.equal(evaluateUndo(released, sold.receipt.journalId!).buyback?.reason, "buyback-vendor-released");
    const resurrect = buyback(released, {
      journalId: sold.receipt.journalId!,
      token: "gone",
      locale: "en",
      expectedRevision: released.revision,
      confirm: key("shift+y"),
    });
    assert.equal(resurrect.receipt.status, "rejected");
    assert.equal(activeQuantity(resurrect.world, "rivet"), 35);
    assert.equal(ids(resurrect.world, "rivet"), ids(released, "rivet"));
  });
});

describe("dismantle", () => {
  it("restores the same gear only while salvage is intact", () => {
    let world = createWorld();
    world = commit(
      world,
      act(world, {
        action: "move",
        token: "off",
        destinationId: "pack",
        lines: [{ instanceId: SEED.coat, quantity: 1 }],
        confirm: pointer("commit-move"),
      }),
    ).world;
    const broken = commit(
      world,
      act(world, {
        action: "dismantle",
        token: "break",
        lines: [{ instanceId: SEED.coat, quantity: 1 }],
        confirm: key("shift+d"),
      }),
    );
    world = broken.world;
    assert.equal(world.instances[SEED.coat].archived, true);
    assert.equal(world.instances[SEED.coat].provenance.serial, "WC-2");
    assert.equal(activeQuantity(world, "coat"), 0);
    assert.equal(activeQuantity(world, "cloth-scrap"), 3);
    assert.equal(activeQuantity(world, "buckle"), 1);
    const entry = world.journal.find((item) => item.id === broken.receipt.journalId)!;
    assert.equal(evaluateUndo(world, entry.id).reason, "available");

    const used = consumeOneSalvage(world);
    assert.equal(evaluateUndo(used, entry.id).reason, "outputs-consumed");
    const refused = undo(used, entry.id, "no-copy");
    assert.equal(refused.world.instances[SEED.coat].archived, true);
    assert.equal(activeQuantity(refused.world, "coat"), 0);
    assert.equal(ids(refused.world, "coat"), 1);

    const restored = undo(world, entry.id, "back");
    assert.equal(restored.world.instances[SEED.coat].archived, false);
    assert.equal(restored.world.instances[SEED.coat].provenance.serial, "WC-2");
    assert.equal(restored.world.instances[SEED.coat].provenance.originKey, "origin.issued");
    assert.equal(activeQuantity(restored.world, "coat"), 1);
    assert.equal(activeQuantity(restored.world, "cloth-scrap"), 0);
    assert.equal(activeQuantity(restored.world, "buckle"), 0);
  });

  it("undoes a partial break without a second stack of the original", () => {
    const world = createWorld();
    const broken = commit(
      world,
      act(world, {
        action: "dismantle",
        token: "rivet-break",
        lines: [{ instanceId: SEED.rivet, quantity: 4 }],
        confirm: pad("triangle"),
      }),
    );
    assert.equal(broken.world.instances[SEED.rivet].quantity, 36);
    assert.equal(activeQuantity(broken.world, "scrap-iron"), 4);
    const restored = undo(broken.world, broken.receipt.journalId!, "rejoin");
    assert.equal(restored.world.instances[SEED.rivet].quantity, 40);
    assert.equal(restored.world.instances[SEED.rivet].id, SEED.rivet);
    assert.equal(activeQuantity(restored.world, "scrap-iron"), 0);
    assert.equal(activeQuantity(restored.world, "rivet"), 40);
  });

  it("reports moved salvage instead of restoring the original", () => {
    let world = createWorld();
    world = commit(
      world,
      act(world, {
        action: "move",
        token: "off2",
        destinationId: "pack",
        lines: [{ instanceId: SEED.whistle, quantity: 1 }],
        confirm: pointer("commit-move"),
      }),
    ).world;
    const broken = commit(
      world,
      act(world, {
        action: "dismantle",
        token: "whistle",
        lines: [{ instanceId: SEED.whistle, quantity: 1 }],
        confirm: touch("slide-up"),
      }),
    );
    const scrap = broken.world.journal.find((item) => item.id === broken.receipt.journalId)!.outputs[0]!;
    const moved = commit(
      broken.world,
      act(broken.world, {
        action: "move",
        token: "scrap-move",
        destinationId: "stash",
        lines: [{ instanceId: scrap.instanceId, quantity: scrap.quantity }],
        confirm: pointer("commit-move"),
      }),
    );
    assert.equal(evaluateUndo(moved.world, broken.receipt.journalId!).reason, "outputs-moved");
    const refused = undo(moved.world, broken.receipt.journalId!, "no");
    assert.equal(refused.world.instances[SEED.whistle].archived, true);
    assert.equal(activeQuantity(refused.world, "whistle"), 0);
    assert.equal(activeQuantity(refused.world, "brass-scrap"), 1);
  });
});

describe("donate, discard, restore", () => {
  it("seals a gift and will not undo it", () => {
    const world = createWorld();
    const gifted = commit(
      world,
      act(world, {
        action: "donate",
        token: "gift",
        lines: [{ instanceId: SEED.resin, quantity: 2 }],
        phrase: "GIFT",
        confirm: pointer("commit-donate", 700),
      }),
    );
    assert.equal(gifted.receipt.status, "applied");
    assert.equal(gifted.world.currency.reputation, 2);
    assert.equal(gifted.world.instances[SEED.resin].quantity, 4);
    assert.equal(gifted.world.seals.length, 1);
    const report = evaluateUndo(gifted.world, gifted.receipt.journalId!);
    assert.equal(report.reason, "external-seal");
    assert.match(String(report.params.seal), /^seal-/);
    const refused = undo(gifted.world, gifted.receipt.journalId!, "recall");
    assert.equal(refused.world.currency.reputation, 2);
    assert.equal(activeQuantity(refused.world, "resin"), 4);
    assert.equal(ids(refused.world, "resin"), 2);
  });

  it("holds a discard in the void under the same id until the hold is disturbed", () => {
    const world = createWorld();
    const voided = commit(
      world,
      act(world, {
        action: "discard",
        token: "void",
        lines: [{ instanceId: SEED.wax, quantity: 1 }],
        phrase: "DISCARD",
        confirm: pointer("commit-discard", 900),
      }),
    );
    assert.equal(voided.world.instances[SEED.wax].containerId, "void");
    assert.equal(voided.world.instances[SEED.wax].provenance.serial, "QM-7");
    assert.equal(evaluateUndo(voided.world, voided.receipt.journalId!).reason, "available");

    const back = undo(voided.world, voided.receipt.journalId!, "back");
    assert.equal(back.world.instances[SEED.wax].containerId, "stash");
    assert.equal(back.world.instances[SEED.wax].provenance.serial, "QM-7");
    assert.equal(ids(back.world, "wax"), 1);

    const scavenged = scavengeVoid(voided.world);
    assert.equal(evaluateUndo(scavenged, voided.receipt.journalId!).reason, "void-released");
    const copied = undo(scavenged, voided.receipt.journalId!, "copy");
    assert.equal(copied.world.instances[SEED.wax].archived, true);
    assert.equal(activeQuantity(copied.world, "wax"), 0);
    assert.equal(ids(copied.world, "wax"), 1);
  });

  it("restore is not discard-undo and does not copy the piece", () => {
    const world = createWorld();
    const voided = commit(
      world,
      act(world, {
        action: "discard",
        token: "void2",
        lines: [{ instanceId: SEED.wax, quantity: 1 }],
        phrase: "discard",
        confirm: pad("r1", 900),
      }),
    );
    const returned = commit(
      voided.world,
      act(voided.world, {
        action: "restore",
        token: "ret",
        destinationId: "pack",
        lines: [{ instanceId: SEED.wax, quantity: 1 }],
        confirm: touch("slide-down"),
      }),
    );
    assert.equal(returned.world.instances[SEED.wax].containerId, "pack");
    assert.equal(returned.world.instances[SEED.wax].provenance.serial, "QM-7");
    assert.equal(evaluateUndo(returned.world, voided.receipt.journalId!).reason, "void-released");
    assert.equal(activeQuantity(returned.world, "wax"), 1);
    const undone = undo(returned.world, returned.receipt.journalId!, "undo-ret");
    assert.equal(undone.world.instances[SEED.wax].containerId, "void");
    assert.equal(ids(undone.world, "wax"), 1);
  });
});

describe("protections, quantity, interruption, locale", () => {
  it("keeps equipped gear, reservations, and evidence out of destructive batches", () => {
    const world = createWorld();
    const equipped = selectEligible(world, "equipped", "dismantle", "all");
    assert.equal(equipped.lines.length, 0);
    assert.equal(equipped.exclusions.length, 2);

    const pack = selectEligible(world, "pack", "sell", "materials");
    assert.deepEqual(pack.lines.map((line) => line.instanceId), [SEED.rivet]);
    const named = selectEligible(world, "pack", "sell", "named");
    assert.deepEqual(named.lines.map((line) => line.instanceId), [SEED.lens]);

    const reserved = selectEligible(world, "project-lantern", "move", "all", "stash");
    assert.equal(reserved.lines.length, 0);
    assert.ok(reserved.exclusions.every((item) => item.code === "reserved"));

    const evidence = selectEligible(world, "quest-satchel", "donate", "evidence");
    assert.equal(evidence.lines.length, 0);
    assert.ok(evidence.exclusions.every((item) => item.code === "evidence"));

    const mixed = commit(
      world,
      act(world, {
        action: "sell",
        token: "mixed",
        lines: [
          { instanceId: SEED.rivet, quantity: 2 },
          { instanceId: SEED.coat, quantity: 1 },
        ],
        confirm: key("shift+s"),
      }),
    );
    assert.equal(mixed.receipt.reason, "excluded");
    assert.equal(mixed.world.instances[SEED.rivet].quantity, 40);
    assert.equal(mixed.world.instances[SEED.coat].containerId, "equipped");
    assert.equal(mixed.world.currency.gold, 40);

    const view = preview(
      world,
      act(world, {
        action: "sell",
        token: "preview",
        lines: [
          { instanceId: SEED.waybill, quantity: 1 },
          { instanceId: SEED.gears, quantity: 6 },
        ],
      }),
    );
    assert.equal(view.ok, false);
    assert.ok(view.exclusions.some((item) => item.code === "evidence"));
    assert.ok(view.exclusions.some((item) => item.code === "reserved"));
  });

  it("rejects a stale preview, a short hold, a bad quantity, and an in-flight repeat", () => {
    const world = createWorld();
    const seen = world.revision;
    const disturbed = stealBiscuits(world);
    assert.equal(disturbed.instances[SEED.biscuit].quantity, 5);
    const stale = commit(
      disturbed,
      act(disturbed, {
        action: "sell",
        token: "stale",
        expectedRevision: seen,
        lines: [{ instanceId: SEED.oil, quantity: 2 }],
        confirm: key("shift+s"),
      }),
    );
    assert.equal(stale.receipt.reason, "inventory-changed");
    assert.equal(stale.world.currency.gold, 40);
    assert.equal(stale.world.instances[SEED.oil].quantity, 12);

    const tooMany = commit(
      world,
      act(world, {
        action: "sell",
        token: "many",
        lines: [{ instanceId: SEED.rivet, quantity: 100 }],
        confirm: pointer("commit-sell"),
      }),
    );
    assert.equal(tooMany.receipt.reason, "insufficient-quantity");
    assert.equal(tooMany.world.instances[SEED.rivet].quantity, 40);

    const unique = cloneQty(world);
    const partial = commit(
      unique,
      act(unique, {
        action: "sell",
        token: "partial-unique",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: pointer("commit-sell"),
      }),
    );
    assert.equal(partial.receipt.reason, "quantity-not-partial");
    assert.equal(partial.world.instances[SEED.lens].quantity, 2);

    const short = commit(
      world,
      act(world, {
        action: "donate",
        token: "short",
        lines: [{ instanceId: SEED.oil, quantity: 1 }],
        phrase: "GIFT",
        confirm: pointer("commit-donate", 699),
      }),
    );
    assert.equal(short.receipt.reason, "hold-too-short");
    assert.equal(short.world.currency.reputation, 0);

    const request = act(world, {
      action: "sell",
      token: "flight",
      lines: [{ instanceId: SEED.oil, quantity: 1 }],
      confirm: key("shift+s"),
    });
    const pending = begin(world, request);
    assert.equal(pending.receipt.status, "pending");
    assert.equal(pending.world.currency.gold, 40);
    const repeat = commit(pending.world, request);
    assert.equal(repeat.receipt.reason, "already-in-flight");
    assert.equal(repeat.world.currency.gold, 40);
    const changed = stealBiscuits(pending.world);
    const settled = settle(changed, "flight");
    assert.equal(settled.receipt.reason, "inventory-changed");
    assert.equal(settled.world.instances[SEED.oil].quantity, 12);
    assert.equal(settled.world.currency.gold, 40);

    const clean = begin(world, { ...request, token: "flight-2" });
    const done = settle(clean.world, "flight-2");
    assert.equal(done.receipt.status, "applied");
    assert.equal(done.world.currency.gold, 45);
    const doneAgain = settle(done.world, "flight-2");
    assert.equal(doneAgain.receipt.status, "duplicate");
    assert.equal(doneAgain.world.currency.gold, 45);

    const dropped = begin(world, { ...request, token: "flight-3" });
    const aborted = abort(dropped.world, "flight-3");
    assert.equal(aborted.receipt.status, "aborted");
    assert.equal(aborted.world.currency.gold, 40);
    const late = settle(aborted.world, "flight-3");
    assert.equal(late.receipt.status, "duplicate");
    assert.equal(late.world.instances[SEED.oil].quantity, 12);
  });

  it("localizes phrases and journal lines", () => {
    const world = createWorld();
    const french = commit(
      world,
      act(world, {
        action: "discard",
        token: "fr",
        locale: "fr",
        lines: [{ instanceId: SEED.oil, quantity: 1 }],
        phrase: "JETER",
        confirm: pad("r1", 900),
      }),
    );
    assert.equal(french.receipt.status, "applied");
    const wrong = commit(
      world,
      act(world, {
        action: "discard",
        token: "fr-bad",
        locale: "fr",
        lines: [{ instanceId: SEED.oil, quantity: 1 }],
        phrase: "DISCARD",
        confirm: key("shift+x"),
      }),
    );
    assert.equal(wrong.receipt.reason, "phrase-mismatch");
    const english = commit(
      world,
      act(world, {
        action: "donate",
        token: "en-bad",
        lines: [{ instanceId: SEED.oil, quantity: 1 }],
        phrase: "DON",
        confirm: key("shift+g"),
      }),
    );
    assert.equal(english.receipt.reason, "phrase-mismatch");

    const moved = commit(
      world,
      act(world, {
        action: "move",
        token: "loc",
        destinationId: "stash",
        lines: [{ instanceId: SEED.oil, quantity: 12 }],
        confirm: pointer("commit-move"),
      }),
    );
    const entry = moved.world.journal[0]!;
    assert.equal(formatSummary("en", entry.summaryKey, entry.summaryParams), "Move 12 to Stash.");
    assert.equal(formatSummary("fr", entry.summaryKey, entry.summaryParams), "Déplacer 12 vers Réserve.");
    for (const keyName of Object.keys(CONTROLS)) {
      assert.equal(typeof keyName, "string");
    }
    for (const code of [
      "available",
      "sell-requires-buyback",
      "buyback-currency-short",
      "buyback-vendor-released",
      "external-seal",
      "outputs-consumed",
      "outputs-moved",
      "dependency-changed",
      "void-released",
      "destination-diverged",
      "origin-full",
      "slot-taken",
      "already-reversed",
      "identity-mismatch",
      "no-such-entry",
      "action-not-reversible",
    ]) {
      assert.equal(hasKey("en", `reason.${code}`), true);
      assert.equal(hasKey("fr", `reason.${code}`), true);
      assert.notEqual(t("en", `reason.${code}`), t("fr", `reason.${code}`));
    }
  });

  it("reports a serial mismatch instead of moving a different piece", () => {
    const world = createWorld();
    const moved = commit(
      world,
      act(world, {
        action: "move",
        token: "serial",
        destinationId: "stash",
        lines: [{ instanceId: SEED.lens, quantity: 1 }],
        confirm: pointer("commit-move"),
      }),
    );
    const tampered = structuredClone(moved.world);
    tampered.instances[SEED.lens]!.provenance.serial = "OTHER";
    assert.equal(evaluateUndo(tampered, moved.receipt.journalId!).reason, "identity-mismatch");
    const refused = undo(tampered, moved.receipt.journalId!, "serial-undo");
    assert.equal(refused.world.instances[SEED.lens].containerId, "stash");
    assert.equal(activeQuantity(refused.world, "lens"), 1);
  });
});

function cloneQty(world: World): World {
  const next = structuredClone(world);
  next.instances[SEED.lens]!.quantity = 2;
  return next;
}

void ACTIONS;
