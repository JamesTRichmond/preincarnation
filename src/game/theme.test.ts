import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { DIALOGUE, OBJECTIVES } from "./content.ts";
import { RELICS } from "./items.ts";
import { missingThemeLines, THEME_DISSONANCE, THEME_LINES, themeVerbs } from "./theme.ts";

describe("theme map", () => {
  it("gives every core verb a line", () => {
    assert.deepEqual(missingThemeLines(), []);
    for (const relic of RELICS) {
      assert.ok(THEME_LINES[relic.id].length >= 20, relic.id);
    }
  });

  it("the ledger repeats those lines and no verb is missing from it", () => {
    const md = readFileSync(new URL("../../ops/THEME.md", import.meta.url), "utf8");
    const missing = themeVerbs().filter((verb) => !md.includes(THEME_LINES[verb]));
    assert.deepEqual(missing, []);
  });

  it("the four rooms are the folded county, and the Crown is not the job", () => {
    assert.match(OBJECTIVES.job, /Marble Vein/);
    assert.match(OBJECTIVES.spectrum, /Heart/);
    assert.match(DIALOGUE.heart_how.text, /seam/i);
    assert.match(DIALOGUE.heart_bind.text, /empire/);
    const note = THEME_DISSONANCE.find((row) => row.id === "heart-fate");
    assert.ok(note);
    const md = readFileSync(new URL("../../ops/THEME.md", import.meta.url), "utf8");
    assert.ok(md.includes(note.line));
    assert.ok(md.includes(THEME_LINES.fold));
  });
});
