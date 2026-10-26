import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FIELD_CUES } from "./audio.ts";
import { createPolicyState, gainFromSlider, planPlay } from "./sound/policy.js";

test("field cues are in the published manifest", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../public/sound/manifest/cues.json", import.meta.url), "utf8"),
  ) as { cues: { id: string }[] };
  const ids = new Set(manifest.cues.map((cue) => cue.id));
  for (const id of Object.values(FIELD_CUES)) {
    assert.equal(ids.has(id), true, id);
  }
});

test("gain is squared and a footstep will not stack inside 85 ms", () => {
  assert.equal(gainFromSlider(0), 0);
  assert.equal(gainFromSlider(1), 1);
  assert.equal(gainFromSlider(0.5), 0.25);
  const state = createPolicyState();
  const step = {
    id: "step_stone",
    bus: "effects",
    priority: 2,
    files: [{}, {}, {}],
    variantMode: "round-robin",
    overlap: { mode: "protect", group: "footstep", minIntervalMs: 85, maxVoices: 2 },
    warning: null,
    duck: null,
  };
  assert.equal(planPlay(state, step, 1000).accepted, true);
  assert.equal(planPlay(state, step, 1040).accepted, false);
  assert.equal(planPlay(state, step, 1100).accepted, true);
});

test("the field mixer and the sound desk mixer are the same source", () => {
  const strip = (path: string) =>
    readFileSync(new URL(path, import.meta.url), "utf8").replace(
      /^(?:\/\/ eslint-disable-next-line @typescript-eslint\/ban-ts-comment[^\n]*\n)?(?:\/\/ @ts-nocheck\n)?/,
      "",
    );
  assert.equal(strip("./sound/policy.js"), strip("../../public/sound-desk/mixer/policy.js"));
  assert.equal(strip("./sound/mixer.js"), strip("../../public/sound-desk/mixer/mixer.js"));
});
