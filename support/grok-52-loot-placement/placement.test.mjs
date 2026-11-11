import assert from "node:assert/strict";
import test from "node:test";
import { createState, noteRoomEntry, resolveAction, shiftEra } from "./logic.mjs";
import { situations } from "./situations.mjs";
import { validateReport } from "./validate.mjs";

const byId = new Map(situations.map((s) => [s.id, s]));

function sit(id) {
  const found = byId.get(id);
  assert.ok(found, `missing situation ${id}`);
  return found;
}

test("authored placement seals: twelve districts, sixteen dungeons, no duplicate uniques", () => {
  const report = validateReport();
  assert.equal(report.ok, true, report.errors.slice(0, 15).join("\n"));
  assert.ok(report.counts.situations >= 120);
  assert.ok(report.counts.fragment >= 31);
  assert.equal(report.counts.districts, 12);
  assert.equal(report.counts.dungeons, 16);
  for (const venue of ["home", "workshop", "boat", "orchard", "farm", "ruin", "quarry", "dungeon", "cache"]) {
    assert.ok(report.counts.venues[venue] > 0, venue);
  }
});

test("windfalls spoil into leather when fourteen years pass in the pocket", () => {
  const take = resolveAction(createState("before"), sit("lfb-orchard-windfalls"), "take");
  assert.equal(take.ok, true);
  assert.equal(take.state.owned["fair-windfalls"], true);
  const aged = shiftEra(take.state, "return");
  assert.equal(
    aged.state.satchel.some((item) => item.itemId === "fair-windfalls"),
    false,
  );
  assert.equal(
    aged.state.satchel.some((item) => item.itemId === "fair-windfalls-leather"),
    true,
  );
});

test("Ruth refuses the crock; the winter apples are never loot", () => {
  const crock = sit("lfb-kitchen-crock");
  const refused = resolveAction(createState("before"), crock, "take");
  assert.equal(refused.ok, false);
  assert.equal(refused.mode, "refused");
  assert.equal(refused.state.flags["hale.stores"], true);
  assert.equal(refused.state.owned["hale-winter-apples"], undefined);
  assert.equal(refused.state.taken[crock.id], undefined);

  const repeat = resolveAction(refused.state, crock, "take");
  assert.equal(repeat.ok, false);
  assert.equal(repeat.journal, false);

  const later = resolveAction(createState("return"), crock, "take");
  assert.equal(later.ok, true);
  assert.equal(later.state.owned["hale-recipe-card"], true);
  assert.equal(later.state.owned["hale-winter-apples"], undefined);
});

test("the ferry token waits for the chart and is not a first-life yield", () => {
  const boot = sit("lfb-snag-boot");
  const unread = resolveAction(createState("return"), boot, "take");
  assert.equal(unread.ok, false);
  assert.equal(unread.mode, "blocked");
  assert.equal(unread.state.taken[boot.id], undefined);

  const early = createState("before");
  early.taken["lfb-skiff-satchel"] = true;
  const beforeYield = resolveAction(early, boot, "take");
  assert.equal(beforeYield.ok, false);
  assert.equal(beforeYield.state.taken[boot.id], undefined);
  assert.equal(beforeYield.state.owned["ferry-token"], undefined);

  const chart = resolveAction(createState("return"), sit("lfb-skiff-satchel"), "take");
  assert.equal(chart.ok, true);
  const found = resolveAction(chart.state, boot, "take");
  assert.equal(found.ok, true);
  assert.equal(found.state.owned["ferry-token"], true);
});

test("leaving the chapel coin and taking it are different returns", () => {
  const niche = sit("lfb-chapel-niche");

  let left = resolveAction(createState("before"), niche, "leave").state;
  left = shiftEra(left, "return").state;
  const gift = resolveAction(left, niche, "take");
  assert.equal(gift.ok, true);
  assert.equal(gift.state.owned["chapel-token"], true);
  assert.equal(gift.state.owned["chapel-second-coin"], true);
  assert.equal(gift.state.owned["chapel-note"], undefined);

  let took = resolveAction(createState("before"), niche, "take").state;
  assert.equal(took.owned["chapel-coin"], true);
  assert.equal(took.owned["chapel-token"], undefined);
  took = shiftEra(took, "return").state;
  const rebuke = resolveAction(took, niche, "take");
  assert.equal(rebuke.ok, true);
  assert.equal(rebuke.state.owned["chapel-note"], true);
  assert.equal(rebuke.state.owned["chapel-token"], undefined);
});

test("an empty yield does not close the situation", () => {
  const hollow = {
    id: "test-empty-yield",
    era: { before: { available: true }, return: { available: true } },
    interaction: {
      blockedCopy: "Nothing in this hollow is yours to take.",
      successCopy: "This copy should not land.",
      examinedCopy: "Already handled.",
    },
    contents: [
      {
        itemId: "nothing-yet",
        obtainable: false,
        eraAvailable: ["before"],
        unique: true,
      },
    ],
    persistence: { fixture: false },
    prerequisites: [],
    ownership: { posture: "none" },
  };
  const start = createState("before");
  const result = resolveAction(start, hollow, "take");
  assert.equal(result.ok, false);
  assert.equal(result.state, start);
  assert.equal(result.state.taken[hollow.id], undefined);
  assert.equal(result.state.journal.length, 0);
});

test("the brand stays held until the invoice ages into a closed order", () => {
  const brand = sit("lfb-cooper-brand");
  const held = resolveAction(createState("return"), brand, "take");
  assert.equal(held.ok, false);
  assert.equal(held.mode, "held");
  assert.equal(held.state.owned["cooper-brand-iron"], undefined);

  const rubbing = resolveAction(createState("before"), sit("lfb-cooper-invoice"), "take");
  assert.equal(rubbing.ok, true);
  assert.equal(rubbing.state.flags["cooper.order-closed"], undefined);
  const aged = shiftEra(rubbing.state, "return");
  assert.equal(aged.state.flags["cooper.order-closed"], true);
  const released = resolveAction(aged.state, brand, "take");
  assert.equal(released.ok, true);
  assert.equal(released.state.owned["cooper-brand-iron"], true);
});

test("Ruth notices the marble once, and only in the kitchen of the first life", () => {
  const carrying = createState("before");
  carrying.owned["childs-marble"] = true;
  const seen = noteRoomEntry(carrying, "hale-kitchen");
  assert.equal(seen.state.flags["hale.wary"], true);
  assert.match(seen.message, /marble/);
  const again = noteRoomEntry(seen.state, "hale-kitchen");
  assert.equal(again.message, null);
  const later = noteRoomEntry({ ...carrying, era: "return" }, "hale-kitchen");
  assert.equal(later.message, null);
});

test("no situation places powder", () => {
  const names = situations.flatMap((s) => (s.contents || []).map((c) => `${c.itemId} ${c.name}`.toLowerCase()));
  assert.equal(
    names.some((name) => /black powder|powder keg|keg of powder|gunpowder/.test(name)),
    false,
  );
  const niche = sit("lfb-powder-niche");
  assert.deepEqual(
    niche.contents.map((c) => c.itemId).sort(),
    ["slow-match", "tally-stone"],
  );
});
