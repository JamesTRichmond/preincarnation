import assert from "node:assert/strict";
import { test } from "node:test";
import type { RelicId } from "../items.ts";
import type { PropSpec } from "../maps.ts";
import { TRAIL_PRESET, QUIET_PRESET } from "./presets.ts";
import { lensActions, lensView, paintIds } from "./ground.ts";
import { FILTER_STORAGE_KEY } from "./types.ts";

const flags = { relics: ["sword"] as RelicId[] };

const props: PropSpec[] = [
  { kind: "grave", x: 1, y: 1, id: "grave-1" },
  { kind: "relic", x: 2, y: 2, id: "relic-shovel", relic: "shovel" },
  { kind: "pot", x: 3, y: 3, id: "pot-1" },
  { kind: "key", x: 4, y: 4, id: "q-key" },
  { kind: "cache", x: 5, y: 5, id: "cache-a", cache: "woods" },
  { kind: "cache", x: 6, y: 6, id: "cache-b", cache: "woods" },
  { kind: "npc", x: 7, y: 7, id: "elder", npc: "elder" },
];

test("quiet ground hides a useless pot and keeps the grave, the key, and the shovel", () => {
  const ids = props.map((prop) => prop.id);
  const actions = lensActions(props, QUIET_PRESET.document, flags);
  assert.equal(actions.get("pot-1"), "hide");
  assert.notEqual(actions.get("grave-1"), "hide");
  assert.notEqual(actions.get("q-key"), "hide");
  assert.equal(actions.get("relic-shovel"), "emphasize");
  assert.equal(actions.has("elder"), false);
  assert.deepEqual(
    props.map((prop) => prop.id),
    ids,
  );
  const paint = paintIds(props, actions);
  assert.equal(paint.has("pot-1"), false);
  assert.equal(paint.has("grave-1"), true);
  assert.equal(paint.has("relic-shovel"), true);
  assert.equal(paint.has("q-key"), true);
  assert.equal(paint.has("elder"), true);
});

test("trail stacks matching caches onto one mark and leaves every prop in the world", () => {
  const actions = lensActions(props, TRAIL_PRESET.document, flags);
  assert.equal(actions.get("cache-a"), "collapse");
  assert.equal(actions.get("cache-b"), "collapse");
  const paint = paintIds(props, actions);
  const painted = ["cache-a", "cache-b"].filter((id) => paint.has(id));
  assert.equal(painted.length, 1);
  assert.equal(props.length, 7);
});

test("a faced label carries a word and a rule name, and the life save is a different key", () => {
  const view = lensView(props, TRAIL_PRESET.document, flags);
  const shovel = view.notes.get("relic-shovel") ?? "";
  assert.match(shovel, /^MARK/);
  assert.match(shovel, /First look/);
  const key = view.notes.get("q-key") ?? "";
  assert.match(key, /MARK/);
  assert.match(key, /vein/);
  const pot = lensView(props, QUIET_PRESET.document, flags).notes.get("pot-1") ?? "";
  assert.match(pot, /HIDE/);
  assert.equal(FILTER_STORAGE_KEY, "preincarnation.ground-lens.v1");
  assert.equal(view.actions.get("grave-1") === "hide", false);
});
