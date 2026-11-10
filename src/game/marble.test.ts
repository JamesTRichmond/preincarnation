import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLADE_ON_MARBLE,
  BOMB_ON_MARBLE,
  DECOY_ON_MARBLE,
  HAMMER_ON_MARBLE,
  SENTINEL_FPS,
  SENTINEL_GOLD_SEC,
  SENTINEL_LUNGE_SEC,
  crackRole,
  stepSentinel,
  strikeMarble,
  type SentinelBeat,
} from "./marble.ts";

describe("strikeMarble", () => {
  it("lets the orchard blade spark and never open cracked marble", () => {
    for (const role of ["true", "decoy"] as const) {
      const hit = strikeMarble("blade", role);
      assert.equal(hit.open, false);
      assert.equal(hit.line, BLADE_ON_MARBLE);
    }
  });

  it("opens a true plug with the hammer and refuses the decoy face", () => {
    const yes = strikeMarble("hammer", "true");
    assert.equal(yes.open, true);
    assert.equal(yes.line, HAMMER_ON_MARBLE);
    const no = strikeMarble("hammer", "decoy");
    assert.equal(no.open, false);
    assert.equal(no.line, DECOY_ON_MARBLE);
  });

  it("still lets a bomb open true marble, not a decoy", () => {
    assert.equal(strikeMarble("bomb", "true").open, true);
    assert.equal(strikeMarble("bomb", "true").line, BOMB_ON_MARBLE);
    assert.equal(strikeMarble("bomb", "decoy").open, false);
  });
});

describe("crackRole", () => {
  it("marks the lock-line and the hammer face as decoys; the gaps between them are true", () => {
    assert.equal(crackRole("quarry", 16, 5), "decoy");
    assert.equal(crackRole("quarry", 18, 5), "decoy");
    assert.equal(crackRole("quarry", 15, 5), "true");
    assert.equal(crackRole("quarry", 17, 5), "true");
    assert.equal(crackRole("quarry", 19, 5), "true");
    assert.equal(crackRole("middlebury", 16, 5), "true");
  });
});

describe("stepSentinel", () => {
  const frame = 1 / SENTINEL_FPS;

  function tick(beat: SentinelBeat, tell: number, extra: { hp?: number; inRange?: boolean } = {}) {
    return stepSentinel({
      hp: extra.hp ?? 9,
      maxHp: 10,
      inRange: extra.inRange ?? true,
      beat,
      tell,
      dt: frame,
    });
  }

  it("holds still at full health so the fate talk can happen", () => {
    const r = stepSentinel({ hp: 10, maxHp: 10, inRange: true, beat: "lunge", tell: 0.2, dt: frame });
    assert.equal(r.beat, "still");
    assert.equal(r.moves, false);
    assert.equal(r.gold, false);
  });

  it("flashes gold for 36 frames at 60fps before the first lunge", () => {
    assert.equal(SENTINEL_GOLD_SEC * SENTINEL_FPS, 36);
    let r = tick("still", 0);
    assert.equal(r.beat, "gold");
    assert.equal(r.moves, false);
    assert.equal(r.gold, true);
    for (let i = 0; i < 35; i++) {
      r = tick(r.beat, r.tell);
      assert.equal(r.beat, "gold", "frame " + String(i));
      assert.equal(r.moves, false);
    }
    r = tick(r.beat, r.tell);
    assert.equal(r.beat, "lunge");
    assert.equal(r.moves, true);
    assert.equal(r.gold, false);
  });

  it("lunges 27 frames, then gold again", () => {
    assert.equal(SENTINEL_LUNGE_SEC * SENTINEL_FPS, 27);
    let r = tick("gold", frame / 2);
    assert.equal(r.beat, "lunge");
    for (let i = 0; i < 26; i++) {
      r = tick(r.beat, r.tell);
      assert.equal(r.beat, "lunge");
    }
    r = tick(r.beat, r.tell);
    assert.equal(r.beat, "gold");
    assert.equal(r.moves, false);
  });

  it("drops the tell when the player leaves reach", () => {
    const r = tick("gold", 0.4, { inRange: false });
    assert.equal(r.beat, "still");
    assert.equal(r.tell, 0);
  });
});
