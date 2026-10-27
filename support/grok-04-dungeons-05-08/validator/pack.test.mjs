/**
 * Design checks for DG05–DG08. These are graph proofs, not a play of the county.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validatePack } from "./validate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

test("DG05 through DG08 have no missing refs, dead ends, or broken keys", () => {
  const pack = JSON.parse(readFileSync(join(HERE, "../content/pack.json"), "utf8"));
  const result = validatePack(pack);
  assert.equal(result.errors.length, 0, JSON.stringify(result.errors.slice(0, 12), null, 2));
  assert.equal(result.ok, true);
  assert.equal(pack.dungeons.length, 4);
  assert.equal(result.stats.rooms, 65);
  for (const stat of result.stats.dungeons) {
    assert.ok(stat.rooms >= 15, `${stat.id} has ${stat.rooms} rooms`);
    const finsOnly = stat.finsOnlyRooms?.length ?? 0;
    assert.ok(
      stat.reachableRequired >= stat.rooms - finsOnly,
      `${stat.id} reached ${stat.reachableRequired} of ${stat.rooms}`,
    );
  }
});

test("a broken miniature pack fails closed", () => {
  const run = spawnSync(process.execPath, [join(HERE, "self-test.mjs")], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /"selfTest": "passed"/);
});
