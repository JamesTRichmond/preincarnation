import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  act,
  chestGrant,
  chestOffer,
  compareLines,
  displayMark,
  isSweepEligible,
  liveView,
  moveSelection,
  panelCopy,
  primaryVerb,
  resolveVerbs,
  stableRifleRounds,
  weaponOffer,
  type LootOffer,
  type PackSlot,
} from "./quick-loot.ts";

function supply(partial: Partial<LootOffer> & Pick<LootOffer, "id" | "name">): LootOffer {
  return {
    blurb: partial.name,
    qty: 1,
    stackLimit: 8,
    kind: "supply",
    rarity: "common",
    sealed: false,
    owner: "",
    ordinary: true,
    fresh: false,
    compareGroup: null,
    stats: [],
    ...partial,
  };
}

const iron: PackSlot = {
  id: "starter-iron",
  name: "Short iron",
  qty: 1,
  owner: "",
  compareGroup: "weapon",
  stats: [
    { label: "Edge", value: 10 },
    { label: "Reach", value: 14 },
  ],
};

describe("opening a container", () => {
  it("selects nothing, so the open press cannot take", () => {
    const view = liveView([chestOffer("chest-quarry", true)], [iron]);
    assert.equal(view.selected, null);
    assert.equal(view.collectOrdinary, false);
    assert.equal(primaryVerb(resolveVerbs(view)), null);
    assert.equal(
      resolveVerbs(view).find((verb) => verb.id === "take-one")?.reason,
      "Choose an item",
    );
    const before = structuredClone(view);
    const result = act(view, "take-one");
    assert.equal(result.act.kind, "idle");
    assert.deepEqual(view, before);
    const copy = panelCopy("Chest", view, null);
    assert.equal(copy.line, "Nothing chosen");
    assert.match(copy.foot, /choose/);
    assert.equal(copy.foot.includes("E Take"), false);
  });

  it("arms a choice only after the player moves the cursor", () => {
    const opened = liveView([chestOffer("chest-quarry", true)], [iron]);
    const chosen = moveSelection(opened, 1);
    assert.equal(chosen.selected, 0);
    const result = act(chosen, "take-one");
    assert.equal(result.act.kind, "take");
    if (result.act.kind !== "take") return;
    assert.equal(result.act.equip, false);
    assert.equal(result.act.consume, false);
    assert.equal(result.act.dismantle, false);
    assert.equal(result.act.tone, "celebrate");
    assert.equal(result.act.taken[0]?.kind, "heart");
    assert.equal(opened.offers.length, 1);
  });
});

describe("chest contents stay put until a take", () => {
  it("keeps the quarry heart a heart, and every other id stable", () => {
    assert.equal(chestGrant("chest-quarry"), "heart");
    assert.equal(chestGrant("q-chest-west"), "heart");
    const first = chestGrant("chest-woods");
    assert.equal(chestGrant("chest-woods"), first);
    const grants = ["chest-woods", "chest-farm", "chest-river", "chest-v1", "chest-b1"].map(
      chestGrant,
    );
    assert.equal(grants.includes("heart"), true);
    assert.equal(grants.includes("karma"), true);
  });

  it("leaves the chest untouched", () => {
    const view = liveView([chestOffer("chest-farm", false)], [iron]);
    const chosen = moveSelection(view, 1);
    const left = act(chosen, "leave");
    assert.equal(left.act.kind, "leave");
    assert.equal(left.view.offers.length, 1);
    assert.equal(left.view.offers[0]?.qty, 1);
  });

  it("shows New once, then Rare for a heart and nothing for merit", () => {
    const heart = chestOffer("chest-quarry", true);
    assert.equal(displayMark(heart), "New");
    assert.equal(displayMark({ ...heart, fresh: false }), "Rare");
    const merit = chestOffer(
      ["chest-woods", "chest-farm", "chest-river", "chest-v1", "chest-b1"].find(
        (id) => chestGrant(id) === "karma",
      )!,
      false,
    );
    assert.equal(merit.kind, "karma");
    assert.equal(displayMark(merit), null);
  });
});

describe("weapons are carried, not worn", () => {
  it("puts a rifle in the pack as a single item and does not equip it", () => {
    const rounds = stableRifleRounds("rifle-barn", 2);
    assert.equal(stableRifleRounds("rifle-barn", 2), rounds);
    assert.ok(rounds >= 1 && rounds <= 3);
    const offer = weaponOffer({
      id: "rifle-barn",
      name: "Camp .270",
      blurb: "Most houses keep one.",
      dmg: 2.2,
      reach: 48,
      ammo: rounds,
      rare: false,
      fresh: true,
    });
    const chosen = moveSelection(liveView([offer], [iron]), 1);
    assert.equal(
      resolveVerbs(chosen).find((verb) => verb.id === "take-stack")?.reason,
      "Single item",
    );
    const result = act(chosen, "take-one");
    assert.equal(result.act.kind, "take");
    if (result.act.kind !== "take") return;
    assert.equal(result.act.equip, false);
    assert.equal(
      result.view.pack.some((slot) => slot.id === "rifle-barn"),
      true,
    );
    assert.equal(result.view.pack.find((slot) => slot.id === "starter-iron")?.qty, 1);
    assert.equal("equippedId" in result.act, false);
  });

  it("compares against the iron already in hand and removes nothing", () => {
    const offer = weaponOffer({
      id: "cache-barn",
      name: "Splitting maul",
      blurb: "It prefers maple.",
      dmg: 1.8,
      reach: 15,
      rare: true,
      fresh: false,
    });
    const view = moveSelection(liveView([offer], [iron]), -1);
    const lines = compareLines(view, offer);
    assert.match(lines[0]!, /Short iron/);
    assert.match(lines.join(" "), /Edge 10 → 18/);
    const result = act(view, "compare");
    assert.equal(result.act.kind, "compare");
    assert.equal(result.view.offers[0]?.qty, 1);
    assert.equal(result.view.pack.length, 1);
  });
});

describe("what may be swept", () => {
  const nails = supply({ id: "nails", name: "Nails", qty: 4 });
  const sealed = supply({
    id: "letter",
    name: "Letter",
    kind: "evidence",
    sealed: true,
    ordinary: false,
  });
  const owned = supply({ id: "coat", name: "Coat", owner: "Maeve" });
  const bell = supply({
    id: "bell",
    name: "Bell",
    kind: "treasure",
    rarity: "unique",
    ordinary: false,
    stackLimit: 1,
  });

  it("refuses ordinary supplies while the switch is off", () => {
    const view = liveView([nails, sealed, owned, bell], []);
    assert.equal(isSweepEligible(nails, false), false);
    assert.equal(
      resolveVerbs(view).find((verb) => verb.id === "take-eligible")?.reason,
      "Nothing eligible",
    );
    const chosen = { ...view, selected: 0 };
    const result = act(chosen, "take-eligible");
    assert.equal(result.act.kind, "idle");
    assert.equal(view.offers.length, 4);
  });

  it("sweeps only ordinary unowned supplies, and aggregates them", () => {
    const pack: PackSlot[] = [
      { id: "nails", name: "Nails", qty: 2, owner: "", compareGroup: null, stats: [] },
    ];
    const view = {
      ...liveView([nails, sealed, owned, bell], pack),
      collectOrdinary: true,
      capacity: 2,
    };
    assert.equal(isSweepEligible(nails, true), true);
    assert.equal(isSweepEligible(sealed, true), false);
    assert.equal(isSweepEligible(owned, true), false);
    assert.equal(isSweepEligible(bell, true), false);
    const result = act(view, "take-eligible");
    assert.equal(result.act.kind, "take");
    if (result.act.kind !== "take") return;
    assert.equal(result.act.tone, "quiet");
    assert.deepEqual(
      result.act.taken.map((offer) => offer.id),
      ["nails"],
    );
    assert.equal(result.view.pack.find((slot) => slot.id === "nails")?.qty, 6);
    assert.deepEqual(
      result.view.offers.map((offer) => offer.id),
      ["letter", "coat", "bell"],
    );
    assert.equal(result.act.equip, false);
    assert.equal(result.act.consume, false);
    assert.equal(result.act.dismantle, false);
  });

  it("will not take a sealed row, and a full pack refuses the rest", () => {
    const letter = supply({
      id: "proof",
      name: "Proof",
      kind: "evidence",
      sealed: true,
      ordinary: false,
      fresh: true,
    });
    assert.equal(displayMark(letter), "New");
    assert.equal(displayMark({ ...letter, fresh: false }), "Sealed");
    const chosen = { ...liveView([letter], []), selected: 0, capacity: 1 };
    const verbs = resolveVerbs(chosen);
    assert.equal(verbs.find((verb) => verb.id === "take-one")?.reason, "Sealed");
    assert.equal(primaryVerb(verbs)?.id, "inspect");
    const looked = act(chosen, "inspect");
    assert.equal(looked.act.kind, "inspect");
    assert.equal(chosen.offers[0]?.qty, 1);
    const full = {
      ...liveView([nails], [{ ...nails, qty: 8, owner: "", compareGroup: null, stats: [] }]),
      selected: 0,
      capacity: 1,
      collectOrdinary: true,
    };
    assert.equal(resolveVerbs(full).find((verb) => verb.id === "take-one")?.reason, "Pack full");
  });
});
