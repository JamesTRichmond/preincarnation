// @ts-nocheck
import assert from "node:assert/strict";
import test from "node:test";
import { playDrill } from "../src/drills.js";

test("four drills resolve through the real verbs", () => {
  const wick = playDrill("sap-lit-wick");
  assert.ok(wick.events.some((e) => e.type === "combo" && e.id === "sap-lit-wick"));
  const neighbor = wick.blossoms.find((b) => b.id === "wick-neighbor");
  assert.equal(neighbor?.alive, true);
  assert.ok(wick.counters.blooms >= 1);

  const kindle = playDrill("debt-kindling");
  assert.ok(kindle.events.some((e) => e.type === "combo" && e.id === "debt-kindling"));

  const glass = playDrill("glass-orchard");
  assert.ok(glass.events.some((e) => e.type === "combo" && e.id === "glass-orchard"));
  assert.equal(glass.counters.blooms, 0);
  assert.equal(
    glass.blossoms.some((b) => b.id === "glass-bud" && b.alive),
    false,
  );
  assert.ok(glass.events.some((e) => e.type === "snuff" && e.reason === "glass"));

  const needle = playDrill("needle-through-coals");
  assert.ok(needle.events.some((e) => e.type === "combo" && e.id === "needle-through-coals"));
  const tether = needle.tethers.find((t) => t.alive);
  assert.ok(tether);
  assert.equal(tether.tension, 45);
});
