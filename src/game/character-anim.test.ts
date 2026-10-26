import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DIRECTION_ROWS,
  PACK_CELL_PX,
  PACK_FORM_ID,
  REQUIRED_ACTIONS,
  RUNTIME_ATTACK_LOCK_SEC,
  SNES_CELL_PX,
  attackTimingFlag,
  proposedHitSec,
  spinTimingFlag,
  strikePoseStartsDuringLock,
} from "./character-anim.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../..");
const pack = join(repo, "support/grok-13-character-animation");

type Clip = {
  frameCount: number;
  rows: number;
  cols: number;
  fps: number;
  hitFrames: number[];
  frames: string[];
  sheet: string;
  directional?: boolean;
  directions?: string[];
};

type Form = {
  id: string;
  actions: Record<string, Clip>;
  anchor?: { feet?: number[] };
};

type Manifest = {
  cell: { w: number; h: number };
  directions: string[];
  forms: Form[];
  npcs: unknown[];
  portraits: unknown[];
  missing: string[];
  inspected: { integratedAgainst?: { overwritten?: boolean } };
};

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(join(pack, "manifest.json"), "utf8")) as Manifest;
}

function pngSize(path: string): { w: number; h: number } {
  const buf = readFileSync(path);
  assert.equal(buf.toString("ascii", 1, 4), "PNG");
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe("character animation pack", () => {
  const manifest = loadManifest();

  it("keeps the 16px world sheets and does not claim they were overwritten", () => {
    assert.equal(manifest.inspected.integratedAgainst?.overwritten, false);
    assert.equal(PACK_CELL_PX, 96);
    assert.equal(SNES_CELL_PX, 16);
    for (const id of ["wanderer", "smuggler", "officer", "embryo"] as const) {
      const size = pngSize(join(repo, "public/game", `${id === "embryo" ? "embryo" : id}-walk`, "snes.png"));
      assert.deepEqual(size, { w: 64, h: 64 });
    }
    const attack = pngSize(join(repo, "public/game/wanderer-attack/snes.png"));
    assert.deepEqual(attack, { w: 64, h: 64 });
  });

  it("has four forms, twelve villagers, and twenty-four portraits", () => {
    assert.deepEqual(
      manifest.forms.map((f) => f.id),
      Object.values(PACK_FORM_ID),
    );
    assert.equal(manifest.npcs.length, 12);
    assert.equal(manifest.portraits.length, 24);
    assert.deepEqual(manifest.directions, [...DIRECTION_ROWS]);
    assert.deepEqual(manifest.cell, { w: PACK_CELL_PX, h: PACK_CELL_PX });
  });

  it("ships every required clip with the frame count the sheet claims", () => {
    for (const form of manifest.forms) {
      for (const action of REQUIRED_ACTIONS) {
        const clip = form.actions[action];
        assert.ok(clip, `${form.id} ${action}`);
        assert.equal(clip.frames.length, clip.frameCount, `${form.id} ${action}`);
        assert.ok(clip.frameCount > 0);
        assert.equal(clip.rows * clip.cols, clip.frameCount);
        const sheet = pngSize(join(pack, clip.sheet));
        assert.equal(sheet.w, clip.cols * PACK_CELL_PX);
        assert.equal(sheet.h, clip.rows * PACK_CELL_PX);
        if (clip.directional && clip.rows === 4) {
          assert.deepEqual(clip.directions, [...DIRECTION_ROWS]);
        }
      }
      assert.equal(form.actions.attack.frameCount, 16);
      assert.deepEqual(form.actions.attack.hitFrames, [1]);
      assert.equal(form.actions.reincarnate.frameCount, 8);
      assert.equal(form.actions.spin.frameCount, 4);
      assert.equal(form.actions.walk.frameCount, 16);
      assert.deepEqual(form.anchor?.feet, [48, 86]);
    }
  });

  it("flags attack and spin timing against the live damage windows without changing them", () => {
    assert.equal(RUNTIME_ATTACK_LOCK_SEC.slash, 0.1);
    assert.equal(RUNTIME_ATTACK_LOCK_SEC.spin, 0.18);
    assert.equal(proposedHitSec(10, 1), 0.1);
    assert.equal(strikePoseStartsDuringLock(10, 1, 0.1), false);
    assert.equal(strikePoseStartsDuringLock(14, 1, 0.1), true);

    const flags = manifest.forms.map((form) => attackTimingFlag(form.id, form.actions.attack.fps, 1));
    const smuggler = flags.find((f) => f.form === "otter-creek-smuggler");
    assert.equal(smuggler?.poseStartsDuringLock, true);
    assert.match(smuggler?.note ?? "", /t=0/);
    for (const flag of flags) {
      if (flag.form === "otter-creek-smuggler") continue;
      assert.equal(flag.poseStartsDuringLock, false, flag.form);
      assert.match(flag.note, /Damage stays at t=0/);
    }

    for (const form of manifest.forms) {
      const spin = spinTimingFlag(form.id, form.actions.spin.fps, form.actions.spin.frameCount);
      const length = form.actions.spin.frameCount / form.actions.spin.fps;
      assert.ok(length > RUNTIME_ATTACK_LOCK_SEC.spin);
      assert.match(spin.note, /damages once at t=0/);
    }
  });

  it("still names the assets the pack could not finish", () => {
    const text = manifest.missing.join("\n");
    assert.match(text, /blade-arc/i);
    assert.match(text, /9 of 12 NPCs/);
    assert.match(text, /in-place spin/i);
    assert.match(text, /Damage was not retimed/);
  });
});
