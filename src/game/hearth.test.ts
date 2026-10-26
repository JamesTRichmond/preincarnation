import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildInterior } from "./interiors.ts";
import { DEFAULT_FLAGS } from "./types.ts";

describe("ferry hearth", () => {
  it("sits in the inn and does not touch the county save", () => {
    const room = buildInterior("int_inn", DEFAULT_FLAGS);
    const hearth = room.props.find((prop) => prop.kind === "hearth");
    assert.ok(hearth);
    assert.equal(hearth?.id, "ferry-hearth");
    assert.equal(room.props.filter((prop) => prop.kind === "hearth").length, 1);
    const other = buildInterior("int_home", DEFAULT_FLAGS);
    assert.equal(other.props.some((prop) => prop.kind === "hearth"), false);
  });
});
