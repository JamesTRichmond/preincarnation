import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { DEV_CATALOG, pageCount } from "../src/catalog.ts";
import { ashBarLife, fixtureSlots, freshLife } from "../src/fixtures.ts";
import { ICON_IDS, PIXELS, assertIconGrid } from "../src/pixels.ts";
import { firstEnabled, moveFocus } from "../src/logic/focus.ts";
import { intentFromGamepad, intentFromKeyboard } from "../src/logic/input.ts";
import { journeyBeatsMet, journeys } from "../src/logic/journeys.ts";
import { retentionReport } from "../src/logic/retention.ts";
import {
  createSession,
  focusItems,
  play,
  topScreen,
} from "../src/logic/session.ts";
import { DEV_SOURCE_LABEL } from "../src/catalog.ts";
import { defaultSettings } from "../src/fixtures.ts";
import { FIGURE, GROUND, STOOD_AT, SURVEY } from "../src/ui/ground.ts";

const root = join(import.meta.dirname, "..");

function session() {
  return createSession({
    slots: fixtureSlots(),
    settings: defaultSettings(),
    catalog: DEV_CATALOG,
    simulateField: true,
    source: "dev-fixture",
    sourceLabel: DEV_SOURCE_LABEL,
  });
}

describe("icons", () => {
  it("draws every tool, bottle, heart, lock, key, and interaction state on one grid", () => {
    const required = [
      ...DEV_CATALOG.tools.map((tool) => tool.icon),
      "bottle",
      "heart",
      "heart-empty",
      "lock",
      "unlocked",
      "key",
      "confirm",
      "cancel",
      "pause",
      "back",
      "inspect",
      "loading",
      "error",
      "empty",
      "focus",
    ];
    assert.equal(DEV_CATALOG.tools.length, 12);
    for (const id of required) assertIconGrid(id);
    assert.equal(new Set(ICON_IDS).size, ICON_IDS.length);
    for (const rows of Object.values(PIXELS)) {
      assert.equal(rows.length, 16);
      assert.ok(rows.every((row) => row.length === 16));
    }
  });
});

describe("focus", () => {
  it("moves in a grid, skips disabled rows, and wraps", () => {
    const items = [
      { id: "a", row: 0, col: 0 },
      { id: "b", row: 0, col: 1 },
      { id: "c", row: 1, col: 0, disabled: true },
      { id: "d", row: 1, col: 1 },
    ];
    assert.equal(moveFocus(items, "a", "right", 0).id, "b");
    assert.equal(moveFocus(items, "a", "down", 0).id, "d");
    assert.equal(moveFocus(items, "b", "down", 0).id, "d");
    assert.equal(moveFocus(items, "d", "down", 0).id, "a");
    assert.equal(firstEnabled(items), "a");
  });

  it("pages long text before leaving the row", () => {
    const items = [
      { id: "flaw", row: 0, col: 0, scrollable: true, scrollKey: "flaw", scrollMax: 2 },
      { id: "begin", row: 1, col: 0 },
    ];
    assert.deepEqual(moveFocus(items, "flaw", "down", 0), { id: "flaw", scroll: 1 });
    assert.deepEqual(moveFocus(items, "flaw", "down", 2), { id: "begin", scroll: 0 });
    assert.deepEqual(moveFocus(items, "flaw", "up", 2), { id: "flaw", scroll: 1 });
  });

  it("keeps left and right on sliders for the caller", () => {
    const state = session();
    const settings = play(state, [
      { type: "pointer", id: "settings", kind: "activate" },
      { type: "intent", intent: { type: "move", dir: "left" } },
      { type: "intent", intent: { type: "move", dir: "left" } },
    ]);
    assert.equal(topScreen(settings), "settings");
    assert.equal(settings.focusId, "music");
    assert.equal(settings.settings.music, 4);
    assert.equal(settings.settings.sfx, 8);
  });
});

describe("input parity", () => {
  it("maps keyboard and gamepad onto the same intents", () => {
    assert.deepEqual(intentFromKeyboard({ key: "ArrowLeft", code: "ArrowLeft" }), {
      type: "move",
      dir: "left",
    });
    assert.deepEqual(intentFromKeyboard({ key: "a", code: "KeyA" }), { type: "move", dir: "left" });
    assert.deepEqual(intentFromKeyboard({ key: "d", code: "KeyD" }), { type: "move", dir: "right" });
    assert.deepEqual(intentFromKeyboard({ key: "Escape", code: "Escape" }), { type: "pause" });
    assert.deepEqual(intentFromKeyboard({ key: "Backspace", code: "Backspace" }), { type: "cancel" });
    assert.deepEqual(intentFromKeyboard({ key: "Enter", code: "Enter" }), { type: "confirm" });
    assert.deepEqual(intentFromKeyboard({ key: "1", code: "Digit1" }), { type: "quick-slot", index: 0 });
    const prev = Array(16).fill(false);
    const next = Array(16).fill(false);
    next[14] = true;
    assert.deepEqual(intentFromGamepad(prev, next), { type: "move", dir: "left" });
    next[14] = false;
    next[1] = true;
    assert.deepEqual(intentFromGamepad(prev, next), { type: "cancel" });
    assert.equal(intentFromGamepad(next, next), null);
  });
});

describe("navigation", () => {
  it("backs out one screen and does not leave the title", () => {
    let state = session();
    state = play(state, [{ type: "intent", intent: { type: "confirm" } }]);
    assert.equal(topScreen(state), "slots");
    state = play(state, [{ type: "intent", intent: { type: "cancel" } }]);
    assert.equal(topScreen(state), "title");
    const stuck = play(state, [{ type: "intent", intent: { type: "cancel" } }]);
    assert.equal(topScreen(stuck), "title");
  });

  it("asks before erasing a written page and keeps it when refused", () => {
    let state = play(session(), [{ type: "pointer", id: "new-game", kind: "activate" }]);
    const kept = state.slots[0]?.snapshot?.playSeconds;
    state = play(state, [{ type: "pointer", id: "slot-1", kind: "activate" }]);
    assert.equal(state.modal?.kind, "overwrite");
    state = play(state, [{ type: "pointer", id: "modal-no", kind: "activate" }]);
    assert.equal(state.modal, null);
    assert.equal(state.slots[0]?.snapshot?.playSeconds, kept);
    assert.equal(topScreen(state), "slots");
  });

  it("repairs a torn page on retry and will not open a blank page with continue", () => {
    let state = play(session(), [
      { type: "pointer", id: "continue", kind: "activate" },
      { type: "pointer", id: "slot-2", kind: "activate" },
    ]);
    assert.equal(topScreen(state), "error");
    state = play(state, [{ type: "pointer", id: "retry", kind: "activate" }]);
    assert.equal(topScreen(state), "field");
    assert.equal(state.slots[1]?.damaged, false);
    assert.equal(state.gameplay?.placeId, "ferry");
    const cont = play(session(), [{ type: "pointer", id: "continue", kind: "activate" }]);
    const empty = focusItems(cont).find((item) => item.id === "slot-3");
    assert.equal(empty?.disabled, true);
  });

  it("remembers focus when a menu is reopened", () => {
    const paused = play(sessionInField(), [{ type: "intent", intent: { type: "pause" } }]);
    const inTools = play(paused, [
      { type: "pointer", id: "tools", kind: "activate" },
      { type: "intent", intent: { type: "cancel" } },
    ]);
    assert.equal(topScreen(inTools), "pause");
    assert.equal(inTools.focusId, "tools");
  });
});

describe("retention", () => {
  it("does not move the life while a menu is open, and does move it on the field", () => {
    let state = sessionInField();
    state = play(state, [{ type: "intent", intent: { type: "move", dir: "right" } }]);
    assert.equal(state.gameplay?.position.x, 49);
    state = play(state, [{ type: "intent", intent: { type: "pause" } }]);
    const frozen = state.frozen;
    assert.ok(frozen);
    state = play(state, [
      { type: "intent", intent: { type: "move", dir: "left" } },
      { type: "intent", intent: { type: "move", dir: "left" } },
      { type: "pointer", id: "tools", kind: "activate" },
      { type: "intent", intent: { type: "move", dir: "right" } },
      { type: "pointer", id: "back", kind: "activate" },
      { type: "pointer", id: "settings", kind: "activate" },
      { type: "intent", intent: { type: "cancel" } },
    ]);
    assert.equal(state.gameplay?.position.x, 49);
    assert.equal(state.gameplay?.position.y, frozen?.position.y);
    assert.equal(state.gameplay?.playSeconds, frozen?.playSeconds);
    assert.equal(state.frozen?.position.x, 49);
    state = play(state, [{ type: "pointer", id: "resume", kind: "activate" }]);
    assert.equal(state.frozen, null);
    assert.equal(state.lastResume?.positionHeld, true);
    assert.equal(state.lastResume?.timeHeld, true);
    assert.equal(state.lastResume?.discoveriesHeld, true);
    state = play(state, [{ type: "tick", seconds: 1 }]);
    assert.equal(state.gameplay?.playSeconds, (frozen?.playSeconds ?? 0) + 0.25);
  });

  it("keeps ground fields when a sip and a tool change on purpose", () => {
    const before = ashBarLife();
    let state = sessionInField();
    state = play(state, [
      { type: "intent", intent: { type: "pause" } },
      { type: "pointer", id: "bottles", kind: "activate" },
      { type: "pointer", id: "bottle-b-spring", kind: "activate" },
      { type: "pointer", id: "modal-yes", kind: "activate" },
      { type: "pointer", id: "back", kind: "activate" },
      { type: "pointer", id: "resume", kind: "activate" },
    ]);
    const report = retentionReport(before, state.gameplay!);
    assert.equal(report.positionHeld, true);
    assert.equal(report.timeHeld, true);
    assert.equal(report.eraHeld, true);
    assert.equal(report.placeHeld, true);
    assert.equal(state.gameplay?.hearts.current, before.hearts.current + 1);
  });

  it("does not simulate field steps when the engine owns movement", () => {
    let state = sessionInField();
    state = { ...state, simulateField: false };
    state = play(state, [{ type: "intent", intent: { type: "move", dir: "left" } }]);
    assert.equal(state.gameplay?.position.x, 48);
  });
});

describe("journeys", () => {
  it("walks five complete journeys", () => {
    const all = journeys();
    assert.equal(all.length, 5);
    for (const journey of all) {
      const result = journeyBeatsMet(journey);
      assert.deepEqual(result.missing, [], journey.title);
      assert.equal(journey.actions.length > 0, true);
    }
  });
});

describe("plates", () => {
  it("keeps a plate and a seat for every place in the register", () => {
    const dir = join(root, "../../public/ashwick");
    for (const place of DEV_CATALOG.places) {
      const file = GROUND[place.id];
      assert.ok(file, place.id);
      assert.ok(STOOD_AT[place.id], place.id);
      assert.equal(existsSync(join(dir, file.slice("/ashwick/".length))), true, place.id);
    }
    assert.equal(existsSync(join(dir, FIGURE.slice("/ashwick/".length))), true);
    assert.equal(existsSync(join(dir, SURVEY.slice("/ashwick/".length))), true);
    assert.equal(Object.keys(STOOD_AT).includes("glassworks"), true);
  });
});

describe("register copy", () => {
  it("does not add a quest compass, an objective marker, or a currency", () => {
    const files = walk(join(root, "src")).filter((file) => /\.(ts|tsx|css)$/.test(file));
    const banned =
      /\b(quests?|objectives?|waypoints?|compass(?:es)?|currenc(?:y|ies)|experience points|\bxp\b|gold coins?|quest marker|objective marker)\b/i;
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const hit = banned.exec(text);
      assert.equal(hit, null, `${file} contains ${hit?.[0]}`);
    }
    assert.equal(pageCount(DEV_CATALOG.character.flaw) > 1, true);
    assert.equal(freshLife().discoveredPlaceIds.includes("glassworks"), false);
    const late = ashBarLife();
    assert.equal(late.discoveredPlaceIds.includes("glassworks"), false);
    assert.equal(DEV_CATALOG.places.some((place) => place.id === "glassworks"), true);
  });
});

function sessionInField() {
  const start = session();
  const life = ashBarLife();
  return {
    ...start,
    stack: ["field" as const],
    focusId: "",
    gameplay: structuredClone(life),
    activeSlotId: "slot-1",
    slots: start.slots.map((slot) =>
      slot.id === "slot-1" ? { ...slot, snapshot: structuredClone(life) } : slot,
    ),
  };
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}
