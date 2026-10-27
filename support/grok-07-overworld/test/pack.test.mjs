import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the county cartogram validates", () => {
  const out = execFileSync(process.execPath, ["validate.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(out, /ok 192 screens; era0 186; oar70 2/);
  const report = JSON.parse(fs.readFileSync(path.join(root, "output/validation-report.json"), "utf8"));
  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
  assert.equal(report.counts.screens, 192);
  assert.equal(report.counts.hubs, 10);
  assert.equal(report.counts.interiors, 60);
  assert.equal(report.counts.dungeons, 16);
  assert.equal(Object.keys(report.perDistrict).length, 12);
  for (const n of Object.values(report.perDistrict)) assert.equal(n, 16);
  for (const n of Object.values(report.eraChangesByDistrict)) assert.ok(n >= 3);
  assert.equal(report.era0NoTools, 186);
  assert.deepEqual(report.gatedAtEra0NoTools, ["LIN-16", "ORW-12", "RIP-09", "RIP-10", "RIP-13", "RIP-14"]);
  assert.deepEqual(report.voidOarDeltaEra56, ["ORW-12", "SAL-06"]);
  assert.deepEqual(report.voidOarDeltaEra70, ["QRY-15", "SAL-06"]);
  assert.equal(report.warpSample.walking, 12);
  assert.equal(report.warpSample.withKnownWarps, 6);
  assert.ok(fs.existsSync(path.join(root, "output/world-map.svg")));
  const svg = fs.readFileSync(path.join(root, "output/world-map.svg"), "utf8");
  assert.match(svg, /<svg/);
  assert.doesNotMatch(svg, /Chittenden|Warren|New York/);
});
