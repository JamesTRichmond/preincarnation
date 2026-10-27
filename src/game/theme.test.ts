import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RELICS } from "./items.ts";
import { missingThemeLines, THEME_LINES, themeVerbs } from "./theme.ts";

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
});
