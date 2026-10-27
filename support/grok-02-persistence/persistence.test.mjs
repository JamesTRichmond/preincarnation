import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("grok-02 persistence pack", () => {
  it("keeps the reference model consistent and refuses to bind the live save", () => {
    const run = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "support/grok-02-persistence/src/run-tests.js"],
      { cwd: repo, encoding: "utf8" },
    );
    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
    assert.match(run.stdout, /MODE reference-model/);
    assert.match(run.stdout, /GAME_MODULE no-module/);
    assert.match(run.stdout, /LIVE no-save-api/);
    assert.match(run.stdout, /PASS reference-model/);
    const summary = JSON.parse(
      spawnSync(process.execPath, ["-e", "process.stdout.write(require('fs').readFileSync('support/grok-02-persistence/out/last-run.json','utf8'))"], {
        cwd: repo,
        encoding: "utf8",
      }).stdout,
    );
    assert.equal(summary.engine, "reference-model");
    assert.equal(summary.failed, 0);
    assert.ok(summary.cases >= 72);
    assert.ok(summary.crossSystem >= 12);
    assert.equal(summary.liveSave.bound, false);
    assert.equal(summary.liveSave.imported, true);
    const seen = summary.liveSave.observations;
    assert.equal(seen.saveVersion, 9);
    assert.equal(seen.defaultName, "Ellis Perch");
    assert.equal(seen.defaultCycle, 0);
    assert.equal(seen.defaultYear, 2026);
    assert.equal(seen.defaultMap, "middlebury");
    assert.equal(seen.hasChecksumField, false);
    assert.equal(seen.roundTripName, "Ira Fenn");
    assert.equal(seen.roundTripCycle, 2);
    assert.equal(seen.backupWritten, true);
    assert.equal(seen.corruptFallsToBackupName, "Ira Fenn");
    assert.equal(seen.garbageWithoutBackupName, "Ellis Perch");
    assert.equal(seen.forgetName, "Ellis Perch");
    assert.equal(seen.forgetCycle, 0);
    assert.equal(seen.forgetLeavesBackup, true);
    assert.equal(seen.v7MigratedVersion, 9);
    assert.equal(seen.v7MigratedName, "Ira Fenn");
    assert.equal(seen.v7Talked, "elder");
    assert.equal(seen.winters, 14);
    assert.equal(seen.oneDeathCycle, 1);
    assert.equal(seen.oneDeathYear, 2040);
    assert.equal(seen.oneDeathReturned, true);
    assert.equal(seen.oneDeathInventory[0], "starter-iron");
    assert.equal(seen.secondDeathCycle, 2);
    assert.equal(seen.secondDeathYear, 2054);
    assert.equal(seen.deathIsIdempotent, false);
    assert.equal(seen.maeveLanternAfterReturn, true);
  });
});
