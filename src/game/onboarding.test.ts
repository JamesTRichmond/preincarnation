import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { FIRST_LIFE, firstLifeNamesTheJob } from "./onboarding.ts";

describe("first life", () => {
  it("names Maeve, the shovel, the east road, the lantern, and fourteen winters", () => {
    assert.equal(firstLifeNamesTheJob(FIRST_LIFE), true);
    const help = readFileSync(new URL("../components/game-app.tsx", import.meta.url), "utf8");
    assert.equal(help.includes("14–18"), false);
    assert.equal(help.includes("14-18"), false);
  });
});
