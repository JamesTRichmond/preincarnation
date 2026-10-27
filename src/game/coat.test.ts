import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { T } from "./tile-ids.ts";

describe("coat", () => {
  it("paints every live tile instead of falling through to meadow", () => {
    const src = readFileSync(new URL("./pix.ts", import.meta.url), "utf8");
    const missing = Object.keys(T).filter((name) => !src.includes(`T.${name}`));
    assert.deepEqual(missing, []);
  });
});
