import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DIALOGUE } from "./content.ts";
import { firstLifeSteps, liveObjective } from "./quest.ts";

const FATE = /Release the universe|Bind it as a Crown/;

describe("the one job", () => {
  it("walks Maeve, the shovel, east, the lamp, then the marble", () => {
    const steps = firstLifeSteps();
    assert.match(steps[0], /Maeve/);
    assert.match(steps[1], /shovel/i);
    assert.match(steps[2], /east/i);
    assert.match(steps[3], /lamp/i);
    assert.match(steps[4], /Sentinel/);
    assert.equal(steps.some((line) => FATE.test(line)), false);
  });

  it("does not offer a second plot at the Heart", () => {
    const labels = [...(DIALOGUE.heart_1.choices ?? []), ...(DIALOGUE.heart_second.choices ?? [])].map((c) => c.label);
    assert.equal(labels.some((label) => FATE.test(label)), false);
    assert.ok(labels.includes("Just walk."));
  });

  it("sends a quiet Vein back to the county, not to an empire", () => {
    const line = liveObjective({
      mode: "play",
      mapId: "middlebury",
      talkedElder: true,
      hasShovel: true,
      hasLantern: true,
      lanternOn: true,
      hasKey: true,
      lockOpen: true,
      hasHammer: true,
      quarryQuiet: true,
      sentinelFaced: true,
      cycle: 1,
      seamThin: false,
      graveWaiting: false,
    });
    assert.match(line, /Vein is quiet/);
    assert.equal(FATE.test(line), false);
  });
});
