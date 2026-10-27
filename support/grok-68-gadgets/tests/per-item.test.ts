import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { RELICS } from "../../../src/game/items.ts";
import { GADGETS } from "../src/catalog.ts";
import { scanDuplicates } from "../src/duplicates.ts";
import { perform, restoreItem, salvageItem, tradeItem, displayItem } from "../src/handlers.ts";
import { HOST_GAPS } from "../src/gaps.ts";
import { validatePack } from "../src/validate.ts";
import { buildFixture, expectsHold, findKit } from "../src/world.ts";
import type { Gadget, LimitProbe } from "../src/types.ts";

type Row = {
  id: string;
  name: string;
  useA: string;
  useB: string;
  limit: string;
  restore: string;
  salvage: string;
  trade: string;
  display: string;
  damp: string;
  crush: string;
};

const here = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(here, "../results");
const repoRoot = join(here, "../../..");
const rows: Row[] = [];

function probe(g: Gadget, limit: LimitProbe): { code: string; worldAlerts?: string } {
  if (limit.repeat) {
    const first = buildFixture(g, limit.patch);
    const ok = perform(first.world, g.id, limit.use, { ...g.uses.find((u) => u.id === limit.use)?.demoArgs, ...limit.args });
    assert.equal(ok.ok, true, `${g.id} repeat setup failed ${ok.code} ${ok.notes.join(" ")}`);
    const again = perform(ok.world, g.id, limit.use, { ...g.uses.find((u) => u.id === limit.use)?.demoArgs, ...limit.args });
    return { code: again.code };
  }
  const { world } = buildFixture(g, limit.patch);
  const use = g.uses.find((u) => u.id === limit.use)!;
  const result = perform(world, g.id, limit.use, { ...use.demoArgs, ...limit.args });
  if (limit.expect?.length) {
    const self = findKit(result.world, g.id);
    const missed = expectsHold(result.world, self, limit.expect);
    assert.equal(missed.length, 0, `${g.id} committed failure missed ${JSON.stringify(missed)}`);
  }
  return { code: result.code };
}

for (const g of GADGETS) {
  test(`${g.id} ${g.name}`, () => {
    const row: Row = {
      id: g.id,
      name: g.name,
      useA: "",
      useB: "",
      limit: "",
      restore: "n/a",
      salvage: "n/a",
      trade: "",
      display: "",
      damp: g.storage.dampSensitive ? "" : "n/a",
      crush: g.storage.crushSensitive ? "" : "n/a",
    };

    for (const use of g.uses) {
      const { world } = buildFixture(g);
      const result = perform(world, g.id, use.id, use.demoArgs ?? {});
      assert.equal(result.ok, true, `${g.id} ${use.id} ${result.code}: ${result.notes.join(" ")}`);
      assert.ok(result.proofs.includes(use.ops[0]!.op), `${g.id} ${use.id} missing proof`);
      const self = findKit(result.world, g.id);
      const missed = expectsHold(result.world, self, use.expect);
      assert.equal(missed.length, 0, `${g.id} ${use.id} expected ${JSON.stringify(missed)} got world slice`);
      if (use.id === "a") row.useA = "OK " + result.proofs.join(",");
      else row.useB = "OK " + result.proofs.join(",");
    }

    const limit = probe(g, g.limit);
    assert.equal(limit.code, g.limit.code, `${g.id} limit wanted ${g.limit.code} got ${limit.code}`);
    row.limit = g.limit.code;
    for (const extra of g.extraLimits ?? []) {
      const got = probe(g, extra);
      assert.equal(got.code, extra.code, `${g.id} extra ${extra.code} got ${got.code}`);
    }

    if (g.storage.dampSensitive) {
      const { world } = buildFixture(g, { weather: { wet: true }, self: { stored: "pocket", sealed: false } });
      const result = perform(world, g.id, "a", g.uses[0].demoArgs ?? {});
      assert.equal(result.code, "DAMP", `${g.id} damp`);
      row.damp = "DAMP";
    }
    if (g.storage.crushSensitive) {
      const { world } = buildFixture(g, { self: { stored: "pack" }, flags: { packHeavy: true } });
      const result = perform(world, g.id, "a", g.uses[0].demoArgs ?? {});
      assert.equal(result.code, "CRUSH", `${g.id} crush`);
      row.crush = "CRUSH";
    }

    if (g.restore) {
      const { world } = buildFixture(g);
      for (const [mat, n] of Object.entries(g.restore.need ?? {})) world.materials[mat] = (world.materials[mat] ?? 0) + n;
      const self = findKit(world, g.id)!;
      self.condition = 10;
      const ok = restoreItem(world, g.id);
      assert.equal(ok.ok, true, `${g.id} restore ${ok.code} ${ok.notes.join(" ")}`);
      assert.equal(findKit(ok.world, g.id)?.condition, g.restore.to ?? 100);
      row.restore = `OK→${g.restore.to ?? 100}`;

      const dry = buildFixture(g);
      for (const mat of Object.keys(g.restore.need ?? {})) dry.world.materials[mat] = 0;
      if (Object.keys(g.restore.need ?? {}).length) {
        const missing = restoreItem(dry.world, g.id);
        assert.equal(missing.code, "NEED_MATERIAL", `${g.id} restore gate ${missing.code}`);
      }
      if (g.restore.requireFlag) {
        const gated = buildFixture(g);
        delete gated.world.flags[g.restore.requireFlag];
        delete gated.world.places.pot;
        for (const [mat, n] of Object.entries(g.restore.need ?? {})) gated.world.materials[mat] = (gated.world.materials[mat] ?? 0) + n;
        const refused = restoreItem(gated.world, g.id);
        assert.equal(refused.ok, false, `${g.id} restore should refuse without ${g.restore.requireFlag}`);
      }
    }

    if (g.salvage) {
      const ruined = buildFixture(g);
      findKit(ruined.world, g.id)!.condition = 0;
      const ok = salvageItem(ruined.world, g.id);
      assert.equal(ok.ok, true, `${g.id} salvage ${ok.code} ${ok.notes.join(" ")}`);
      assert.equal(findKit(ok.world, g.id), undefined);
      for (const [mat, n] of Object.entries(g.salvage.yield ?? {})) {
        assert.ok((ok.world.materials[mat] ?? 0) >= n, `${g.id} yield ${mat}`);
      }
      row.salvage = "OK";
      const sound = buildFixture(g);
      const refused = salvageItem(sound.world, g.id);
      assert.equal(refused.code, "NOT_SPENT", `${g.id} salvage fresh`);
    }

    const trade = tradeItem(buildFixture(g).world, g.id);
    if (g.tradeRefuse) {
      assert.equal(trade.code, "HEIRLOOM", g.id);
      row.trade = "HEIRLOOM";
    } else {
      assert.equal(trade.ok, true, `${g.id} trade ${trade.code}`);
      assert.equal(trade.world.merchant.credit, g.tradeCredit);
      assert.equal(findKit(trade.world, g.id), undefined);
      row.trade = `sold ${g.tradeCredit}`;
    }

    const shown = displayItem(buildFixture(g).world, g.id);
    assert.equal(shown.ok, true, `${g.id} display ${shown.code} ${shown.notes.join(" ")}`);
    assert.ok(shown.world.shelf.includes(g.id));
    row.display = "shelved";

    rows.push(row);
  });
}

test("pack validation, chains, and reports", () => {
  const validation = validatePack();
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));

  const fork = GADGETS.find((g) => g.n === 42)!;
  const horn = GADGETS.find((g) => g.n === 33)!;
  const wrench = GADGETS.find((g) => g.n === 52)!;
  let world = buildFixture(horn, { self: { mods: [] }, kitExtra: [{ lootId: fork.id }, { lootId: wrench.id }] }).world;
  let step = perform(world, fork.id, "a");
  assert.equal(step.ok, true, step.notes.join(" "));
  step = perform(step.world, horn.id, "a", { hz: 440 });
  assert.equal(step.ok, true, step.notes.join(" "));
  assert.equal(step.world.compartments[0]?.revealed, true);
  step = perform(step.world, wrench.id, "b");
  assert.equal(step.world.compartments[0]?.unlatched, true);

  const bird = GADGETS.find((g) => g.n === 1)!;
  const spring = GADGETS.find((g) => g.n === 16)!;
  world = buildFixture(spring, {
    enemies: [{ id: "porch-dog", kind: "narrow", alert: "idle", rangeYd: 4, timer: 0 }],
  }).world;
  const loan = perform(world, spring.id, "b");
  assert.equal(loan.ok, true, loan.notes.join(" "));
  const loose = perform(loan.world, bird.id, "a");
  assert.equal(loose.ok, true, loose.notes.join(" "));
  assert.equal(loose.world.enemies[0]?.alert, "distracted");

  const chain = GADGETS.find((g) => g.n === 62)!;
  const weight = GADGETS.find((g) => g.n === 49)!;
  world = buildFixture(weight, {
    balances: [{ id: "sash", currentOz: 10, targetOz: 18, tolerance: 0.5, overhead: true, hanger: false, held: false, released: false }],
    kitExtra: [{ lootId: chain.id }],
  }).world;
  const hung = perform(world, chain.id, "b");
  assert.equal(hung.ok, true, hung.notes.join(" "));
  const seated = perform(hung.world, weight.id, "a", { ounces: 8 });
  assert.equal(seated.ok, true, seated.notes.join(" "));
  assert.equal(seated.world.balances[0]?.held, true);

  const prism = GADGETS.find((g) => g.n === 17)!;
  const glass = GADGETS.find((g) => g.n === 78)!;
  world = buildFixture(prism).world;
  const stripe = perform(world, prism.id, "a");
  assert.equal(stripe.ok, true, stripe.notes.join(" "));
  const withGlass = buildFixture(glass, { kitExtra: [{ lootId: prism.id }] }).world;
  withGlass.lamps = stripe.world.lamps;
  const soft = perform(withGlass, glass.id, "b");
  assert.equal(soft.ok, true, soft.notes.join(" "));
  assert.equal(soft.world.lamps[0]?.mode, "diffused-stripe");

  const relicNames = new Set(RELICS.map((relic) => relic.name.toLowerCase()));
  const relicIds = new Set<string>(RELICS.map((relic) => relic.id));
  for (const g of GADGETS) {
    assert.equal(relicNames.has(g.name.toLowerCase()), false, `${g.name} repeats a county relic`);
    assert.equal(relicIds.has(g.id), false, `${g.id} repeats a county relic id`);
  }

  const report = scanDuplicates([join(repoRoot, "support"), join(repoRoot, "src/game")]);
  const countyHits = report.nameCollisionsWithExternal.filter((hit) => hit.file.includes(`${join("src", "game")}`));
  assert.equal(countyHits.length, 0, `county files name a gadget: ${JSON.stringify(countyHits)}`);
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(resultsDir, "validation.json"), JSON.stringify(validation, null, 2));
  writeFileSync(
    join(resultsDir, "duplicate-report.json"),
    JSON.stringify({ ...report, internal: { ok: report.internal.ok, issueCount: report.internal.issues.length } }, null, 2),
  );
  writeFileSync(join(resultsDir, "missing-runtime.json"), JSON.stringify({ gaps: HOST_GAPS }, null, 2));
});

after(() => {
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(resultsDir, "action-results.json"), JSON.stringify({ count: rows.length, rows }, null, 2));
});
