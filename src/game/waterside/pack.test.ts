import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RELIC_BY_ID } from "../items.ts";
import { WATERSIDE_OBJECTS, WATERSIDE_SITUATIONS, WATERSIDE_TOOL_RELIC, WATERSIDE_TOOLS, watersideProblems } from "./pack.ts";

describe("waterside recovery finds", () => {
  it("keeps the written finds inside the tools and the two eras", () => {
    assert.deepEqual(watersideProblems(), []);
    assert.equal(WATERSIDE_OBJECTS.length, 5);
    assert.equal(WATERSIDE_SITUATIONS.length, 10);
  });

  it("does not invent a sale, a boat, or a second plot", () => {
    const text = JSON.stringify({ WATERSIDE_OBJECTS, WATERSIDE_SITUATIONS });
    assert.doesNotMatch(text, /\b(sell|coin|shop|sailing)\b/i);
    assert.match(text, /Vein/);
    assert.match(text, /fourteen/i);
  });

  it("points creek fins and the sugar-line at relics already in the county", () => {
    for (const tool of WATERSIDE_TOOLS) {
      const relic = WATERSIDE_TOOL_RELIC[tool];
      if (relic === null) assert.equal(tool, "fishing");
      else assert.equal(RELIC_BY_ID[relic]?.id, relic);
    }
  });
});
