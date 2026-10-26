import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REFUSED_EFFECTS,
  ReferenceStorageAdapter,
  accessBlock,
  conservationError,
  containerOfLot,
  createEllRoom,
  depositMatching,
  hydrateWorld,
  ownerQuantity,
  packOf,
  placeManual,
  quantityOf,
  serializeWorld,
  setLotMarks,
  setReserve,
  setRuleEnabled,
  signatureMap,
  totalQuantity,
  toggleRuleExclusion,
  uniqueIds,
  moveRule,
} from "./index.ts";
import type { ItemLot, StorageContainer, StorageWorld } from "./types.ts";

function snapshot(world: StorageWorld): string {
  return JSON.stringify(world);
}

function sig(world: StorageWorld): Map<string, number> {
  return signatureMap(world);
}

function conserved(before: StorageWorld, after: StorageWorld): void {
  assert.equal(conservationError(before, after), null);
  assert.equal(totalQuantity(before), totalQuantity(after));
  const entries = (map: Map<string, number>) =>
    [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(entries(ownerQuantity(before)), entries(ownerQuantity(after)));
  assert.deepEqual(uniqueIds(before), uniqueIds(after));
}

function lot(
  id: string,
  definitionId: string,
  quantity: number,
  extra?: Partial<ItemLot>,
): ItemLot {
  return {
    id,
    definitionId,
    name: extra?.name ?? definitionId,
    kind: extra?.kind ?? "stack",
    quantity,
    maxStack: extra?.maxStack ?? 16,
    ownerId: extra?.ownerId ?? "wren",
    favorite: extra?.favorite ?? false,
    equipped: extra?.equipped ?? false,
    tags: extra?.tags ?? [definitionId],
    meta: extra?.meta ?? {},
  };
}

function chest(
  id: string,
  lots: ItemLot[],
  extra?: Partial<StorageContainer>,
): StorageContainer {
  return {
    id,
    name: extra?.name ?? id,
    kind: extra?.kind ?? "physical",
    access: extra?.access ?? {
      nearby: true,
      visited: true,
      owned: true,
      sharedEstablished: false,
      deleted: false,
    },
    slotCapacity: extra?.slotCapacity ?? 4,
    reservedSlots: extra?.reservedSlots ?? 0,
    note: extra?.note ?? "",
    lots,
  };
}

function world(containers: StorageContainer[], profile?: Partial<StorageWorld["profile"]>): StorageWorld {
  return {
    actorId: "wren",
    packId: "pack",
    containers,
    appliedRequestIds: [],
    nextLotSeq: 50,
    profile: {
      categories: profile?.categories ?? [
        { id: "cat", name: "Cat", definitionIds: [], tags: ["potato", "board", "herb"] },
      ],
      rules: profile?.rules ?? [],
      exclusions: profile?.exclusions ?? [],
      reserves: profile?.reserves ?? [],
    },
  };
}

describe("ell room deposit", () => {
  it("routes the carried load without losing counts, owners, or unique instances", () => {
    const before = createEllRoom();
    const frozen = snapshot(before);
    const { world: after, receipt } = depositMatching(before, { requestId: "ell-1" });

    assert.equal(snapshot(before), frozen);
    conserved(before, after);
    assert.equal(receipt.repeated, false);
    assert.equal(receipt.interrupted, false);
    assert.equal(receipt.ownershipUnchanged, true);
    assert.equal(receipt.quantityBefore, receipt.quantityAfter);
    assert.equal(receipt.movedQuantity + receipt.stayedQuantity, packQuantity(before));
    assert.equal(after.containers.filter((c) => c.kind !== "pack").length, 12);
    assert.equal(after.containers.some((c) => c.id === "attic-hatch"), false);

    assert.equal(quantityOf(after, "root-cellar", "potato"), 16 + 16);
    assert.equal(quantityOf(after, "pantry", "potato"), 24);
    assert.equal(quantityOf(after, "pack", "potato"), 0);
    assert.equal(quantityOf(after, "root-cellar", "carrot"), 16 + 16);
    assert.equal(quantityOf(after, "pantry", "carrot"), 1);

    assert.equal(quantityOf(after, "lumber-loft", "pine-board"), 48);
    assert.equal(quantityOf(after, "pack", "pine-board"), 12);
    assert.equal(quantityOf(after, "wagon-bed", "pine-board"), 0);

    assert.equal(quantityOf(after, "smith-chest", "iron-ore"), 32);
    assert.equal(quantityOf(after, "pack", "iron-ore"), 6);
    assert.equal(quantityOf(after, "neighbor-crate", "iron-ore"), 0);
    assert.equal(quantityOf(after, "neighbor-crate", "crabapple", "neighbor"), 4);

    assert.equal(quantityOf(after, "town-grain-ark", "flour", "town"), 16);
    assert.equal(quantityOf(after, "town-grain-ark", "flour", "wren"), 20);
    assert.equal(quantityOf(after, "pantry", "flour"), 0);
    assert.equal(quantityOf(after, "pack", "flour"), 0);

    assert.equal(quantityOf(after, "pack", "bandage"), 4);
    assert.equal(quantityOf(after, "apothecary", "bandage"), 6);
    assert.equal(quantityOf(after, "pack", "mint"), 12);
    assert.equal(quantityOf(after, "apothecary", "yarrow"), 8);

    assert.equal(quantityOf(after, "pantry", "milk"), 4);
    assert.equal(quantityOf(after, "ice-chest", "milk"), 0);
    assert.equal(after.containers.find((c) => c.id === "ice-chest")?.access.deleted, true);

    assert.equal(containerOfLot(after, "pack-coat")?.id, "pack");
    assert.equal(containerOfLot(after, "pack-lantern")?.id, "pack");
    assert.equal(containerOfLot(after, "pack-axe")?.id, "wagon-bed");
    assert.equal(containerOfLot(after, "pack-axe-old")?.id, "wagon-bed");
    const axes = after.containers
      .flatMap((c) => c.lots)
      .filter((item) => item.definitionId === "felling-axe");
    assert.equal(axes.length, 2);
    assert.deepEqual(
      axes.map((item) => item.meta.edge).sort(),
      ["keen", "nicked"],
    );

    const stayed = receipt.lines.filter((line) => line.type === "stayed");
    const reason = (id: string) => stayed.find((line) => line.lotId === id);
    const stayedQty = (definitionId: string, why: string) =>
      stayed
        .filter((line) => line.definitionId === definitionId && line.reason === why)
        .reduce((sum, line) => sum + line.quantity, 0);
    assert.equal(reason("pack-coat")?.reason, "favorite");
    assert.match(reason("pack-coat")?.text ?? "", /favorite/i);
    assert.equal(reason("pack-lantern")?.reason, "equipped");
    assert.equal(stayedQty("bandage", "reserved-supply"), 4);
    assert.match(stayed.find((line) => line.definitionId === "bandage")?.text ?? "", /keeps 4/i);
    assert.equal(stayedQty("pine-board", "destination-full"), 12);
    assert.equal(stayedQty("mint", "no-automation-slot"), 12);
    assert.match(stayed.find((line) => line.definitionId === "mint")?.text ?? "", /reserved/i);
    assert.equal(reason("pack-ore")?.reason, "not-owned");
    assert.match(reason("pack-ore")?.text ?? "", /not yours/i);

    const milk = receipt.lines.find(
      (line) => line.type === "moved" && line.definitionId === "milk",
    );
    assert.equal(milk?.type === "moved" && milk.toId, "pantry");
    assert.match(milk?.text ?? "", /Ice chest is gone/);

    const potatoRoot = receipt.lines.find(
      (line) => line.type === "moved" && line.definitionId === "potato" && line.toId === "root-cellar",
    );
    assert.equal(potatoRoot?.type === "moved" && potatoRoot.quantity, 6);
    assert.equal(quantityOf(after, "smoke-rack", "salt-pork"), 8);
    assert.equal(quantityOf(after, "seed-drawer", "wheat-seed"), 16);
  });

  it("does not move again when the same request is repeated", () => {
    const first = depositMatching(createEllRoom(), { requestId: "same" });
    const frozen = snapshot(first.world);
    const second = depositMatching(first.world, { requestId: "same" });
    assert.equal(second.world, first.world);
    assert.equal(snapshot(second.world), frozen);
    assert.equal(second.receipt.repeated, true);
    assert.equal(second.receipt.movedQuantity, 0);
    assert.equal(second.receipt.lines.length, 0);
  });

  it("a later request does not reshuffle containers or duplicate goods", () => {
    const first = depositMatching(createEllRoom(), { requestId: "one" });
    const second = depositMatching(first.world, { requestId: "two" });
    conserved(first.world, second.world);
    assert.equal(second.receipt.movedQuantity, 0);
    assert.deepEqual(
      second.world.containers.map((c) => [c.id, c.lots.map((l) => [l.id, l.quantity])]),
      first.world.containers.map((c) => [c.id, c.lots.map((l) => [l.id, l.quantity])]),
    );
  });
});

function packQuantity(world: StorageWorld): number {
  return packOf(world).lots.reduce((sum, item) => sum + item.quantity, 0);
}

describe("priorities, access, and splits", () => {
  it("sends goods to the earlier rule when both destinations have room", () => {
    const start = world(
      [
        chest("pack", [lot("p", "potato", 10, { tags: ["potato"], maxStack: 16 })], {
          kind: "pack",
          slotCapacity: 8,
        }),
        chest("root", [], { name: "Root", slotCapacity: 2 }),
        chest("pantry", [], { name: "Pantry", slotCapacity: 2 }),
      ],
      {
        rules: [
          rule("high", 10, ["root"]),
          rule("low", 20, ["pantry"]),
        ],
      },
    );
    const { world: after } = depositMatching(start, { requestId: "prio" });
    assert.equal(quantityOf(after, "root", "potato"), 10);
    assert.equal(quantityOf(after, "pantry", "potato"), 0);
    conserved(start, after);
  });

  it("falls through when the higher destination is full", () => {
    const start = world(
      [
        chest("pack", [lot("p", "potato", 4, { tags: ["potato"], maxStack: 4 })], {
          kind: "pack",
          slotCapacity: 4,
        }),
        chest("root", [lot("full", "potato", 4, { tags: ["potato"], maxStack: 4 })], {
          name: "Root",
          slotCapacity: 1,
        }),
        chest("pantry", [], { name: "Pantry", slotCapacity: 2 }),
      ],
      { rules: [rule("high", 10, ["root"]), rule("low", 20, ["pantry"])] },
    );
    const { world: after, receipt } = depositMatching(start, { requestId: "fall" });
    assert.equal(quantityOf(after, "root", "potato"), 4);
    assert.equal(quantityOf(after, "pantry", "potato"), 4);
    assert.equal(quantityOf(after, "pack", "potato"), 0);
    const move = receipt.lines.find((line) => line.type === "moved");
    assert.match(move?.text ?? "", /full/i);
    conserved(start, after);
  });

  it("splits a stack across a full pile and a new pile without dropping goods", () => {
    const start = world(
      [
        chest(
          "pack",
          [
            lot("boards-a", "board", 16, {
              name: "Pine boards",
              tags: ["board"],
              maxStack: 16,
              meta: { cut: "rough" },
            }),
            lot("boards-b", "board", 2, {
              name: "Pine boards",
              tags: ["board"],
              maxStack: 16,
              meta: { cut: "rough" },
            }),
          ],
          { kind: "pack", slotCapacity: 4 },
        ),
        chest(
          "loft",
          [
            lot("a", "board", 16, { tags: ["board"], maxStack: 16, meta: { cut: "rough" } }),
            lot("b", "board", 10, { tags: ["board"], maxStack: 16, meta: { cut: "rough" } }),
          ],
          { slotCapacity: 2 },
        ),
      ],
      { rules: [rule("wood", 10, ["loft"])] },
    );
    const { world: after, receipt } = depositMatching(start, { requestId: "split" });
    assert.equal(quantityOf(after, "loft", "board"), 32);
    assert.equal(quantityOf(after, "pack", "board"), 12);
    const remainder = packOf(after).lots.find((item) => item.id === "boards-a");
    assert.equal(remainder?.quantity, 10);
    assert.equal(remainder?.meta.cut, "rough");
    assert.equal(remainder?.ownerId, "wren");
    assert.equal(quantityOf(after, "pack", "board"), 12);
    const moved = receipt.lines.find((line) => line.type === "moved");
    assert.equal(moved?.type === "moved" && moved.split, true);
    assert.equal(moved?.type === "moved" && moved.quantity, 6);
    conserved(start, after);
  });

  it("keeps unique instances distinct when they share a definition", () => {
    const start = world(
      [
        chest(
          "pack",
          [
            lot("axe-a", "axe", 1, { kind: "unique", maxStack: 1, tags: ["tool"], meta: { edge: "keen" }, name: "Keen" }),
            lot("axe-b", "axe", 1, { kind: "unique", maxStack: 1, tags: ["tool"], meta: { edge: "nicked" }, name: "Nicked" }),
          ],
          { kind: "pack", slotCapacity: 4 },
        ),
        chest("wagon", [], { slotCapacity: 2 }),
      ],
      {
        categories: [{ id: "cat", name: "Tools", definitionIds: [], tags: ["tool"] }],
        rules: [rule("tools", 10, ["missing-attic", "wagon"])],
      },
    );
    const { world: after } = depositMatching(start, { requestId: "uniq" });
    assert.equal(containerOfLot(after, "axe-a")?.id, "wagon");
    assert.equal(containerOfLot(after, "axe-b")?.id, "wagon");
    assert.equal(after.containers.find((c) => c.id === "wagon")?.lots.length, 2);
    assert.equal(after.containers.some((c) => c.id === "missing-attic"), false);
    conserved(start, after);
  });

  it("refuses unowned, unvisited, distant, deleted, and unestablished shared stores", () => {
    const cases: Array<{ access: StorageContainer["access"]; kind?: StorageContainer["kind"]; reason: string }> = [
      {
        access: { nearby: true, visited: true, owned: false, sharedEstablished: false, deleted: false },
        reason: "not-owned",
      },
      {
        access: { nearby: true, visited: false, owned: true, sharedEstablished: false, deleted: false },
        reason: "not-visited",
      },
      {
        access: { nearby: false, visited: true, owned: true, sharedEstablished: false, deleted: false },
        reason: "not-nearby",
      },
      {
        access: { nearby: true, visited: true, owned: true, sharedEstablished: false, deleted: true },
        reason: "destination-deleted",
      },
    ];
    for (const entry of cases) {
      const start = world(
        [
          chest("pack", [lot("p", "potato", 2, { tags: ["potato"] })], { kind: "pack" }),
          chest("bin", [], { access: entry.access, kind: entry.kind ?? "physical" }),
        ],
        { rules: [rule("go", 10, ["bin", "nowhere"])] },
      );
      const beforeBins = start.containers.length;
      const { world: after, receipt } = depositMatching(start, { requestId: entry.reason });
      assert.equal(quantityOf(after, "pack", "potato"), 2, entry.reason);
      assert.equal(quantityOf(after, "bin", "potato"), 0, entry.reason);
      assert.equal(after.containers.length, beforeBins);
      const stay = receipt.lines.find((line) => line.type === "stayed");
      assert.equal(stay?.type === "stayed" && stay.reason, entry.reason);
      conserved(start, after);
    }

    const shared = world(
      [
        chest("pack", [lot("f", "flour", 3, { tags: ["flour"] })], { kind: "pack" }),
        chest("ark", [], {
          kind: "shared-material",
          access: {
            nearby: false,
            visited: true,
            owned: false,
            sharedEstablished: false,
            deleted: false,
          },
        }),
      ],
      {
        categories: [{ id: "cat", name: "Flour", definitionIds: [], tags: ["flour"] }],
        rules: [rule("grain", 10, ["ark"])],
      },
    );
    const blocked = depositMatching(shared, { requestId: "share-no" });
    assert.equal(quantityOf(blocked.world, "ark", "flour"), 0);
    assert.equal(
      blocked.receipt.lines.find((line) => line.type === "stayed")?.type === "stayed" &&
        blocked.receipt.lines.find((line) => line.type === "stayed") &&
        (blocked.receipt.lines.find((line) => line.type === "stayed") as { reason: string }).reason,
      "shared-not-established",
    );

    const open = world(
      [
        chest("pack", [lot("f", "flour", 3, { tags: ["flour"], ownerId: "wren" })], { kind: "pack" }),
        chest(
          "ark",
          [lot("town", "flour", 4, { tags: ["flour"], ownerId: "town", maxStack: 16 })],
          {
            kind: "shared-material",
            slotCapacity: 3,
            access: {
              nearby: false,
              visited: true,
              owned: false,
              sharedEstablished: true,
              deleted: false,
            },
          },
        ),
      ],
      {
        categories: [{ id: "cat", name: "Flour", definitionIds: [], tags: ["flour"] }],
        rules: [rule("grain", 10, ["ark"])],
      },
    );
    const allowed = depositMatching(open, { requestId: "share-yes" });
    assert.equal(quantityOf(allowed.world, "ark", "flour", "wren"), 3);
    assert.equal(quantityOf(allowed.world, "ark", "flour", "town"), 4);
    assert.equal(accessBlock(allowed.world.containers.find((c) => c.id === "ark")), null);
    conserved(open, allowed.world);
  });

  it("honors an explicit exclusion over a listed destination", () => {
    const start = world(
      [
        chest("pack", [lot("p", "potato", 2, { tags: ["potato"] })], { kind: "pack" }),
        chest("root", []),
        chest("pantry", []),
      ],
      { rules: [{ ...rule("veg", 10, ["root", "pantry"]), excludeDestinationIds: ["root"] }] },
    );
    const { world: after } = depositMatching(start, { requestId: "ex" });
    assert.equal(quantityOf(after, "root", "potato"), 0);
    assert.equal(quantityOf(after, "pantry", "potato"), 2);
  });

  it("keeps favorites, equipped gear, and reserved supplies in the pack", () => {
    const start = world(
      [
        chest(
          "pack",
          [
            lot("fav", "coat", 1, { kind: "unique", maxStack: 1, favorite: true, tags: ["coat"], name: "Coat" }),
            lot("worn", "lantern", 1, { kind: "unique", maxStack: 1, equipped: true, tags: ["coat"], name: "Lantern" }),
            lot("bands-a", "bandage", 8, { tags: ["bandage"], maxStack: 8, name: "Bandages" }),
            lot("bands-b", "bandage", 2, { tags: ["bandage"], maxStack: 8, name: "Bandages" }),
          ],
          { kind: "pack", slotCapacity: 8 },
        ),
        chest("bin", [], { slotCapacity: 4 }),
      ],
      {
        categories: [{ id: "cat", name: "All", definitionIds: [], tags: ["coat", "bandage"] }],
        rules: [rule("all", 10, ["bin"])],
        reserves: [{ definitionId: "bandage", keepInPack: 4 }],
      },
    );
    const { world: after, receipt } = depositMatching(start, { requestId: "keep" });
    assert.equal(containerOfLot(after, "fav")?.id, "pack");
    assert.equal(containerOfLot(after, "worn")?.id, "pack");
    assert.equal(quantityOf(after, "pack", "bandage"), 4);
    assert.equal(quantityOf(after, "bin", "bandage"), 6);
    const reasons = receipt.lines.filter((line) => line.type === "stayed").map((line) => line.reason);
    assert.ok(reasons.includes("favorite"));
    assert.ok(reasons.includes("equipped"));
    assert.ok(reasons.includes("reserved-supply"));
    conserved(start, after);
  });

  it("stops an interrupted transfer without duplicating or losing the rest", () => {
    const start = world(
      [
        chest(
          "pack",
          [
            lot("ore-a", "ore", 4, { tags: ["ore"], maxStack: 4, name: "Ore" }),
            lot("ore-b", "ore", 4, { tags: ["ore"], maxStack: 4, name: "Ore" }),
            lot("ore-c", "ore", 2, { tags: ["ore"], maxStack: 4, name: "Ore" }),
          ],
          { kind: "pack" },
        ),
        chest("bin", [], { slotCapacity: 4 }),
      ],
      {
        categories: [{ id: "cat", name: "Ore", definitionIds: [], tags: ["ore"] }],
        rules: [rule("ore", 10, ["bin"])],
      },
    );
    const stopped = depositMatching(start, { requestId: "stop-0", interruptAfterMoves: 0 });
    assert.equal(stopped.receipt.interrupted, true);
    assert.equal(quantityOf(stopped.world, "pack", "ore"), 10);
    assert.equal(quantityOf(stopped.world, "bin", "ore"), 0);
    assert.equal(
      stopped.receipt.lines.find((line) => line.type === "stayed")?.type === "stayed" &&
        (stopped.receipt.lines.find((line) => line.type === "stayed") as { reason: string }).reason,
      "interrupted",
    );
    conserved(start, stopped.world);

    const stepped = depositMatching(start, { requestId: "step-1", interruptAfterMoves: 1 });
    assert.equal(stepped.receipt.movedQuantity, 4);
    assert.equal(quantityOf(stepped.world, "bin", "ore"), 4);
    assert.equal(quantityOf(stepped.world, "pack", "ore"), 6);
    assert.equal(stepped.receipt.interrupted, true);
    conserved(start, stepped.world);

    const again = depositMatching(stepped.world, { requestId: "step-1" });
    assert.equal(again.receipt.repeated, true);
    assert.equal(quantityOf(again.world, "pack", "ore"), 6);

    const finish = depositMatching(stepped.world, { requestId: "step-2" });
    assert.equal(quantityOf(finish.world, "pack", "ore"), 0);
    assert.equal(quantityOf(finish.world, "bin", "ore"), 10);
    conserved(start, finish.world);
  });

  it("leaves goods in the pack when a destination is deleted mid-transfer", () => {
    const start = world(
      [
        chest("pack", [lot("milk", "milk", 4, { tags: ["milk"], maxStack: 4, name: "Milk" })], {
          kind: "pack",
        }),
        chest("ice", [], {
          name: "Ice chest",
          access: {
            nearby: true,
            visited: true,
            owned: true,
            sharedEstablished: false,
            deleted: true,
          },
        }),
        chest("pantry", [], { name: "Pantry" }),
      ],
      {
        categories: [{ id: "cat", name: "Milk", definitionIds: [], tags: ["milk"] }],
        rules: [rule("dairy", 10, ["ice", "pantry"])],
      },
    );
    const { world: after, receipt } = depositMatching(start, {
      requestId: "delete-mid",
      beforeMove(working, info) {
        if (info.destinationId !== "pantry") return;
        const pantry = working.containers.find((c) => c.id === "pantry");
        if (pantry) pantry.access.deleted = true;
      },
    });
    assert.equal(quantityOf(after, "pack", "milk"), 4);
    assert.equal(quantityOf(after, "pantry", "milk"), 0);
    assert.equal(quantityOf(after, "ice", "milk"), 0);
    const stay = receipt.lines.find((line) => line.type === "stayed");
    assert.equal(stay?.type === "stayed" && stay.reason, "destination-deleted");
    assert.match(stay?.text ?? "", /gone/i);
    conserved(start, after);
    assert.equal(after.containers.length, start.containers.length);
  });
});

describe("manual placement", () => {
  it("is not undone by a later deposit", () => {
    const start = createEllRoom();
    const placed = placeManual(start, {
      lotId: "pack-axe",
      quantity: 1,
      fromId: "pack",
      toId: "wool-bin",
    });
    assert.equal(placed.ok, true);
    assert.equal(containerOfLot(placed.world, "pack-axe")?.id, "wool-bin");
    assert.match(placed.detail, /will not pull it back/i);
    const deposited = depositMatching(placed.world, { requestId: "after-manual" });
    assert.equal(containerOfLot(deposited.world, "pack-axe")?.id, "wool-bin");
    assert.equal(
      deposited.world.containers.find((c) => c.id === "wool-bin")?.lots.find((l) => l.id === "pack-axe")?.meta
        .edge,
      "keen",
    );
    conserved(start, deposited.world);
  });

  it("can use a reserved slot that automation will not", () => {
    const start = world(
      [
        chest("pack", [lot("mint", "mint", 3, { tags: ["herb"], maxStack: 8, name: "Mint" })], {
          kind: "pack",
        }),
        chest("chest", [lot("yarrow", "yarrow", 8, { tags: ["herb"], maxStack: 8 })], {
          slotCapacity: 2,
          reservedSlots: 1,
          name: "Apothecary",
        }),
      ],
      {
        categories: [{ id: "cat", name: "Herbs", definitionIds: [], tags: ["herb"] }],
        rules: [rule("herbs", 10, ["chest"])],
      },
    );
    const auto = depositMatching(start, { requestId: "no-reserve" });
    assert.equal(quantityOf(auto.world, "pack", "mint"), 3);
    assert.equal(auto.receipt.lines.find((l) => l.type === "stayed")?.type === "stayed" &&
      (auto.receipt.lines.find((l) => l.type === "stayed") as { reason: string }).reason, "no-automation-slot");

    const manual = placeManual(start, {
      lotId: "mint",
      quantity: 3,
      fromId: "pack",
      toId: "chest",
    });
    assert.equal(manual.ok, true);
    assert.equal(quantityOf(manual.world, "chest", "mint"), 3);
    assert.equal(quantityOf(manual.world, "pack", "mint"), 0);
    conserved(start, manual.world);
  });

  it("rejects a full destination without changing anything", () => {
    const start = world([
      chest("pack", [lot("p", "potato", 2, { tags: ["potato"], maxStack: 2 })], { kind: "pack" }),
      chest("bin", [lot("full", "nail", 2, { maxStack: 2 })], { slotCapacity: 1 }),
    ]);
    const frozen = snapshot(start);
    const result = placeManual(start, { lotId: "p", quantity: 2, fromId: "pack", toId: "bin" });
    assert.equal(result.ok, false);
    assert.equal(result.world, start);
    assert.equal(snapshot(start), frozen);
  });

  it("does not clear an equipped item and does not change ownership", () => {
    const start = world([
      chest(
        "pack",
        [lot("lamp", "lantern", 1, { kind: "unique", maxStack: 1, equipped: true, name: "Lantern" })],
        { kind: "pack" },
      ),
      chest("bin", []),
    ]);
    const result = placeManual(start, { lotId: "lamp", quantity: 1, fromId: "pack", toId: "bin" });
    assert.equal(result.ok, false);
    assert.match(result.detail, /Unequip/);
    assert.equal(containerOfLot(result.world, "lamp")?.id, "pack");
  });
});

describe("save, load, and configuration", () => {
  it("round-trips every lot id, count, owner, and mark", () => {
    const started = depositMatching(createEllRoom(), { requestId: "save-me" }).world;
    const marked = setLotMarks(started, "pack-coat", { favorite: true });
    const raw = serializeWorld(marked);
    const loaded = hydrateWorld(raw);
    assert.deepEqual(loaded, marked);
    assert.equal(sig(loaded).size, sig(marked).size);
    const again = depositMatching(loaded, { requestId: "save-me" });
    assert.equal(again.receipt.repeated, true);
    assert.throws(() => hydrateWorld("{"), /could not be read/);
    assert.throws(() => hydrateWorld(JSON.stringify({ schema: 2, world: marked })), /version/);
  });

  it("reorders rules and exclusions without moving items until the next deposit", () => {
    const start = createEllRoom();
    const moved = moveRule(start, "r-veg-overflow", -1);
    const veg = moved.profile.rules.find((rule) => rule.id === "r-veg");
    const overflow = moved.profile.rules.find((rule) => rule.id === "r-veg-overflow");
    assert.ok(overflow && veg && overflow.order < veg.order);
    assert.deepEqual(
      start.containers.map((c) => c.lots.map((l) => [l.id, l.quantity])),
      moved.containers.map((c) => c.lots.map((l) => [l.id, l.quantity])),
    );
    const excluded = toggleRuleExclusion(moved, "r-veg", "root-cellar");
    const deposited = depositMatching(excluded, { requestId: "reordered" });
    assert.equal(quantityOf(deposited.world, "root-cellar", "potato"), 16 + 10);
    assert.ok(quantityOf(deposited.world, "pantry", "potato") > 0);
    conserved(start, deposited.world);
  });

  it("disabling the only rule leaves the item, and a reserve edits the keep count", () => {
    const start = world(
      [
        chest("pack", [lot("p", "potato", 5, { tags: ["potato"] })], { kind: "pack" }),
        chest("bin", []),
      ],
      { rules: [rule("veg", 10, ["bin"])], reserves: [] },
    );
    const off = setRuleEnabled(start, "veg", false);
    const stayed = depositMatching(off, { requestId: "off" });
    assert.equal(quantityOf(stayed.world, "bin", "potato"), 0);
    assert.equal(
      stayed.receipt.lines.find((l) => l.type === "stayed")?.type === "stayed" &&
        (stayed.receipt.lines.find((l) => l.type === "stayed") as { reason: string }).reason,
      "no-matching-rule",
    );
    const reserved = setReserve(start, "potato", 5);
    const kept = depositMatching(reserved, { requestId: "keep-all" });
    assert.equal(quantityOf(kept.world, "pack", "potato"), 5);
    assert.equal(kept.receipt.lines.find((l) => l.type === "stayed")?.type === "stayed" &&
      (kept.receipt.lines.find((l) => l.type === "stayed") as { reason: string }).reason, "reserved-supply");
  });
});

describe("reference adapter", () => {
  it("deposits, places, and reloads through the port without refused effects", () => {
    const adapter = new ReferenceStorageAdapter(createEllRoom());
    const receipt = adapter.deposit({ requestId: "port-1" });
    assert.ok(receipt.movedQuantity > 0);
    const saved = adapter.save();
    const placed = adapter.place({
      lotId: "pack-coat",
      quantity: 1,
      fromId: "pack",
      toId: "wool-bin",
    });
    assert.equal(placed.ok, true);
    adapter.load(saved);
    assert.equal(containerOfLot(adapter.world, "pack-coat")?.id, "pack");
    const repeated = adapter.deposit({ requestId: "port-1" });
    assert.equal(repeated.repeated, true);
    assert.deepEqual([...REFUSED_EFFECTS], ["dismantle", "sell", "consume", "donate", "change-ownership"]);
    assert.equal("sell" in adapter, false);
    assert.equal("dismantle" in adapter, false);
    assert.equal("consume" in adapter, false);
    assert.equal("donate" in adapter, false);
  });
});

function rule(id: string, order: number, destinationIds: string[]) {
  return {
    id,
    name: id,
    order,
    enabled: true,
    categoryId: "cat",
    matchAny: false,
    destinationIds,
    excludeDestinationIds: [] as string[],
    onlyWherePresent: false,
  };
}
