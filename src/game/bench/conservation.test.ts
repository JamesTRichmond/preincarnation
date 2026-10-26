import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalog, CONSERVATION, recipes } from "./index.ts";
import { validateConservation } from "./conservation.ts";
import type { CatalogEntry, Recipe } from "./types.ts";

describe("live book", () => {
  it("publishes at least 120 operations on labeled fixtures", () => {
    assert.ok(recipes.length >= 120, `only ${recipes.length} operations`);
    assert.ok(catalog.length >= 40);
    assert.ok(catalog.every((item) => item.fixture && item.id.startsWith("fix.")));
    assert.ok(recipes.every((recipe) => recipe.id.startsWith("op.")));
  });

  it("passes the conservation book", () => {
    assert.equal(
      CONSERVATION.ok,
      true,
      CONSERVATION.violations.map((item) => `${item.code} ${item.recipeId ?? ""} ${item.detail}`).join("\n"),
    );
  });

  it("covers fishing, hunting, lamps, and heirlooms", () => {
    const tags = new Set(recipes.flatMap((recipe) => recipe.tags));
    for (const tag of ["fishing", "hunting", "lamp", "heirloom"]) {
      assert.ok(tags.has(tag), tag);
    }
    assert.ok(recipes.some((recipe) => recipe.kind === "restore" && recipe.id.includes("heir")));
    assert.ok(recipes.some((recipe) => recipe.kind === "modify"));
    assert.ok(recipes.some((recipe) => recipe.kind === "dismantle"));
    assert.ok(recipes.some((recipe) => recipe.kind === "combine"));
  });
});

function fixture(partial: Partial<CatalogEntry> & Pick<CatalogEntry, "id" | "mass" | "kind">): CatalogEntry {
  return {
    fixture: true,
    intendedCatalog: "test",
    name: partial.id,
    tags: [],
    blurb: "test",
    ...partial,
  };
}

function op(partial: Partial<Recipe> & Pick<Recipe, "id" | "kind">): Recipe {
  return {
    name: partial.id,
    summary: "test",
    inputs: [],
    outputs: [],
    substitutions: [],
    cost: { minutes: 1, focus: 0, toolWear: 0 },
    feedback: { success: "ok", fail: "no" },
    failure: { onLowCondition: "refuse", recovery: "stop" },
    batchable: false,
    tags: [],
    ...partial,
  };
}

describe("hostile books", () => {
  const iron = fixture({ id: "fix.test.iron", mass: 1, kind: "material" });
  const blade = fixture({ id: "fix.test.blade", mass: 4, kind: "gear" });
  const token = fixture({ id: "fix.test.token", mass: 1, kind: "quest", quest: true });
  const knife = fixture({ id: "fix.test.knife", mass: 2, kind: "tool", critical: true });
  const lamp = fixture({ id: "fix.test.lamp", mass: 3, kind: "heirloom" });
  const items = [iron, blade, token, knife, lamp];

  it("flags mass creation, duplication, and a profitable dismantle loop", () => {
    const report = validateConservation(
      [
        op({
          id: "op.test.break",
          kind: "dismantle",
          inputs: [{ catalogId: blade.id, qty: 1, consume: "all", role: "primary" }],
          outputs: [{ catalogId: iron.id, qty: 12, identity: "new" }],
        }),
        op({
          id: "op.test.make",
          kind: "combine",
          inputs: [{ catalogId: iron.id, qty: 3, consume: "all", role: "material" }],
          outputs: [{ catalogId: blade.id, qty: 1, identity: "new" }],
        }),
      ],
      items,
    );
    const codes = new Set(report.violations.map((item) => item.code));
    assert.ok(codes.has("mass-creation"));
    assert.ok(codes.has("profitable-loop"));
  });

  it("flags negative quantities and a lighter substitute", () => {
    const report = validateConservation(
      [
        op({
          id: "op.test.neg",
          kind: "combine",
          inputs: [{ catalogId: iron.id, qty: 0, consume: "all", role: "material" }],
          outputs: [{ catalogId: iron.id, qty: -2, identity: "new" }],
          substitutions: [
            {
              forCatalogId: iron.id,
              withCatalogId: blade.id,
              qtyMultiplier: 0,
              qualityDelta: 0,
              note: "no",
            },
          ],
        }),
      ],
      items,
    );
    const codes = new Set(report.violations.map((item) => item.code));
    assert.ok(codes.has("negative-qty"));
    assert.ok(codes.has("substitution") || codes.has("mass-creation"));
  });

  it("flags quest destruction, heirloom dismantle, and critical consumption", () => {
    const report = validateConservation(
      [
        op({
          id: "op.test.quest",
          kind: "dismantle",
          inputs: [{ catalogId: token.id, qty: 1, consume: "all", role: "primary" }],
          outputs: [{ catalogId: iron.id, qty: 1, identity: "new" }],
        }),
        op({
          id: "op.test.heir",
          kind: "dismantle",
          inputs: [{ catalogId: lamp.id, qty: 1, consume: "all", role: "primary" }],
          outputs: [{ catalogId: iron.id, qty: 1, identity: "new" }],
        }),
        op({
          id: "op.test.tool",
          kind: "combine",
          inputs: [{ catalogId: knife.id, qty: 1, consume: "all", role: "material" }],
          outputs: [{ catalogId: iron.id, qty: 1, identity: "new" }],
        }),
      ],
      items,
    );
    const codes = new Set(report.violations.map((item) => item.code));
    assert.ok(codes.has("quest-destroy"));
    assert.ok(codes.has("heirloom-destroy"));
    assert.ok(codes.has("critical-consume"));
  });

  it("flags a strictly better modification and a softlock", () => {
    const report = validateConservation(
      [
        op({
          id: "op.test.mod",
          kind: "modify",
          inputs: [{ catalogId: blade.id, qty: 1, consume: "none", role: "primary" }],
          outputs: [{ catalogId: blade.id, qty: 1, identity: "retain-primary", conditionDelta: 0 }],
          choices: [
            { id: "better", name: "Better", summary: "only up", axis: "edge", stats: { edge: 2, durability: 1 } },
            { id: "also", name: "Also", summary: "less up", axis: "edge", stats: { edge: 1, durability: -1 } },
          ],
        }),
      ],
      items,
    );
    const codes = new Set(report.violations.map((item) => item.code));
    assert.ok(codes.has("no-tradeoff") || codes.has("dominating-mod"));
    assert.ok(codes.has("softlock"));
  });
});
