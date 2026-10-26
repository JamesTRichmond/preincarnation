import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Container, CraftRequest, ItemStack, World } from "./storage-craft/types.ts";
import {
  CancelledCraftError,
  CraftSession,
  DEMO_CANDIDATES,
  FIXTURE_CATALOG_NOTICE,
  FIXTURE_RECIPES,
  InterruptedSaveError,
  MemorySave,
  bulk,
  cloneWorld,
  commitCraft,
  createDemoWorld,
  findStack,
  makeContainer,
  makeWorld,
  recipeCycle,
  resolveCraft,
  stackQty,
} from "./storage-craft/index.ts";

function snap(world: World): string {
  return JSON.stringify(world);
}

function carried(stacks: ItemStack[], slots = 8): Container {
  return makeContainer({
    id: "belt",
    name: "Belt",
    kind: "carried",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: true,
    capacitySlots: slots,
    stacks,
  });
}

function approved(
  id: string,
  name: string,
  stacks: ItemStack[],
  extra: Partial<Container> = {},
): Container {
  return makeContainer({
    id,
    name,
    kind: "approved",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: true,
    capacitySlots: 8,
    stacks,
    ...extra,
  });
}

function req(partial: Partial<CraftRequest> & Pick<CraftRequest, "recipeId">): CraftRequest {
  return {
    crafterId: "mara",
    quantity: 1,
    candidateContainerIds: ["belt"],
    nested: false,
    ...partial,
  };
}

function total(world: World, itemId: string): number {
  let qty = 0;
  for (const container of world.containers) {
    for (const stack of container.stacks) {
      if (stack.itemId === itemId) qty += stack.qty;
    }
  }
  return qty;
}

function refused(world: World, request: CraftRequest) {
  const before = snap(world);
  const result = commitCraft(world, request);
  assert.equal(result.ok, false);
  assert.equal(result.world, world);
  assert.equal(snap(world), before);
  return result;
}

describe("fixture catalog", () => {
  it("labels every recipe as a reference fixture", () => {
    assert.match(FIXTURE_CATALOG_NOTICE, /Reference fixtures/);
    assert.ok(FIXTURE_RECIPES.length >= 8);
    for (const recipe of FIXTURE_RECIPES) {
      assert.equal(recipe.fixture, true);
      assert.match(recipe.fixtureLabel, /not a live PREINCARNATION recipe id/);
    }
  });
});

describe("cross-storage crafting", () => {
  it("1. cooks from the belt alone", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth" }));
    assert.equal(result.ok, true);
    assert.equal(total(result.world, "meal.broth.onion"), 1);
    assert.equal(stackQty(result.world, "w"), 0);
    assert.equal(stackQty(result.world, "pot"), 1);
  });

  it("2. does not mutate the snapshot it was given", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 2 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
    ]);
    const before = snap(world);
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth" }));
    assert.equal(result.ok, true);
    assert.equal(snap(world), before);
    assert.notEqual(result.world, world);
  });

  it("3. draws a split pile from belt and an opened chest", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "o", itemId: "component.onion", qty: 1 })]),
    ]);
    const preview = resolveCraft(
      world,
      req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "pantry"] }),
    );
    assert.equal(preview.ok, true);
    const water = preview.slots.find((slot) => slot.chosenItemId === "component.water");
    const onion = preview.slots.find((slot) => slot.chosenItemId === "component.onion");
    assert.equal(water?.sources[0]?.containerName, "Belt");
    assert.equal(onion?.sources[0]?.containerName, "Camp pantry");
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "pantry"] }));
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "w"), 0);
    assert.equal(stackQty(result.world, "o"), 0);
  });

  it("4. splits one input across two approved chests after the belt runs dry", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "o1", itemId: "component.onion", qty: 1 })]),
      approved("rack", "Drying rack", [bulk({ instanceId: "o2", itemId: "component.onion", qty: 1 })]),
      approved("cistern", "Cistern", [bulk({ instanceId: "w", itemId: "component.water", qty: 2 })]),
    ]);
    const result = commitCraft(
      world,
      req({
        recipeId: "cook.onion-broth",
        quantity: 2,
        candidateContainerIds: ["belt", "pantry", "rack", "cistern"],
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(total(result.world, "meal.broth.onion"), 2);
    assert.equal(stackQty(result.world, "o1"), 0);
    assert.equal(stackQty(result.world, "o2"), 0);
    assert.equal(stackQty(result.world, "w"), 0);
  });

  it("5. scales every input and the output for quantity 3", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 6 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 3 }),
      ]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust", quantity: 3 }));
    assert.equal(result.ok, true);
    assert.equal(total(result.world, "meal.salt.crust"), 6);
    assert.equal(stackQty(result.world, "salt"), 0);
    assert.equal(stackQty(result.world, "oil"), 0);
    assert.equal(result.world.revision, 2);
  });

  it("6. uses only part of a larger stack", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 5 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 4 }),
      ]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust", quantity: 1 }));
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "salt"), 3);
    assert.equal(stackQty(result.world, "oil"), 3);
    assert.equal(total(result.world, "meal.salt.crust"), 2);
  });

  it("7. refuses when the belt is short and leaves every stack", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 1 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "INSUFFICIENT");
    assert.equal(world.revision, 1);
  });

  it("8. skips a favorited stack and uses the plain one", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "fav",
          itemId: "component.salt.sea",
          qty: 4,
          protection: { kind: "favorite" },
        }),
        bulk({ instanceId: "plain", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const preview = resolveCraft(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(preview.ok, true);
    assert.ok(preview.slots.some((slot) => slot.blocked.some((line) => line.instanceId === "fav" && line.reason === "favorite")));
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "fav"), 4);
    assert.equal(stackQty(result.world, "plain"), 0);
  });

  it("9. refuses when the only pile is a favorite", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "fav",
          itemId: "component.salt.sea",
          qty: 5,
          protection: { kind: "favorite" },
        }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "PROTECTED");
    assert.match(result.error?.message ?? "", /favorited/);
    assert.equal(stackQty(world, "fav"), 5);
  });

  it("10. skips a reserved pile", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "held",
          itemId: "component.oil",
          qty: 2,
          protection: { kind: "reserved", reservationId: "job.supper" },
        }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
      ]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "held"), 2);
    assert.equal(stackQty(result.world, "oil"), 0);
  });

  it("11. refuses when the only pile is reserved", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "held",
          itemId: "component.oil",
          qty: 2,
          protection: { kind: "reserved", reservationId: "job.supper" },
        }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "PROTECTED");
    assert.match(result.error?.message ?? "", /reserved/);
  });

  it("12. skips a quest-protected pile", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "quest-salt",
          itemId: "component.salt.sea",
          qty: 4,
          protection: { kind: "quest", questId: "quest.ossuary" },
        }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "quest-salt"), 4);
  });

  it("13. refuses when the only pile is quest-protected", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "quest-salt",
          itemId: "component.salt.sea",
          qty: 4,
          protection: { kind: "quest", questId: "quest.ossuary" },
        }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "PROTECTED");
    assert.match(result.error?.message ?? "", /quest/);
  });

  it("14. does not break a named heirloom that merely contains the component", () => {
    const world = makeWorld([
      carried([]),
      approved("reliquary", "Reliquary", [
        {
          instanceId: "ladle",
          itemId: "unique.ladle.grandmother",
          qty: 1,
          ownerId: "mara",
          protection: { kind: "none" },
          provenance: {
            kind: "unique",
            displayName: "Grandmother's ladle",
            containedComponents: [{ itemId: "component.copper.scrap", qty: 3 }],
          },
        },
        bulk({ instanceId: "scrap", itemId: "component.copper.scrap", qty: 2 }),
      ]),
    ]);
    const preview = resolveCraft(
      world,
      req({ recipeId: "modify.scrap-rivet", candidateContainerIds: ["belt", "reliquary"] }),
    );
    assert.equal(preview.ok, true);
    const slot = preview.slots[0];
    assert.ok(slot?.blocked.some((line) => line.instanceId === "ladle" && line.reason === "heirloom"));
    assert.ok(slot?.sources.every((source) => source.instanceId !== "ladle"));
    const result = commitCraft(
      world,
      req({ recipeId: "modify.scrap-rivet", candidateContainerIds: ["belt", "reliquary"] }),
    );
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "ladle"), 1);
    assert.equal(findStack(result.world, "ladle")?.provenance.displayName, "Grandmother's ladle");
    assert.equal(stackQty(result.world, "scrap"), 0);
  });

  it("15. refuses rather than sacrifice the heirloom when it is the only source", () => {
    const world = makeWorld([
      carried([]),
      approved("reliquary", "Reliquary", [
        {
          instanceId: "ladle",
          itemId: "unique.ladle.grandmother",
          qty: 1,
          ownerId: "mara",
          protection: { kind: "none" },
          provenance: {
            kind: "unique",
            displayName: "Grandmother's ladle",
            containedComponents: [{ itemId: "component.copper.scrap", qty: 4 }],
          },
        },
      ]),
    ]);
    const result = refused(
      world,
      req({ recipeId: "modify.scrap-rivet", candidateContainerIds: ["belt", "reliquary"] }),
    );
    assert.equal(result.error?.code, "PROTECTED_PROVENANCE");
    assert.equal(stackQty(world, "ladle"), 1);
  });

  it("16. does not treat a named stack with a component id as bulk scrap", () => {
    const world = makeWorld([
      carried([
        {
          instanceId: "named-scrap",
          itemId: "component.copper.scrap",
          qty: 2,
          ownerId: "mara",
          protection: { kind: "none" },
          provenance: { kind: "unique", displayName: "Father's offcut" },
        },
      ]),
    ]);
    const result = refused(world, req({ recipeId: "modify.scrap-rivet" }));
    assert.equal(result.error?.code, "PROTECTED_PROVENANCE");
    assert.equal(stackQty(world, "named-scrap"), 2);
  });

  it("17. rejects an explicit selection of the heirloom instance", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "scrap", itemId: "component.copper.scrap", qty: 1 })]),
      approved("reliquary", "Reliquary", [
        {
          instanceId: "ladle",
          itemId: "unique.ladle.grandmother",
          qty: 1,
          ownerId: "mara",
          protection: { kind: "none" },
          provenance: {
            kind: "unique",
            displayName: "Grandmother's ladle",
            containedComponents: [{ itemId: "component.copper.scrap", qty: 3 }],
          },
        },
      ]),
    ]);
    const result = refused(
      world,
      req({
        recipeId: "modify.scrap-rivet",
        candidateContainerIds: ["belt", "reliquary"],
        choices: [{ recipeId: "modify.scrap-rivet", slotIndex: 0, itemId: "component.copper.scrap", preferInstanceIds: ["ladle"] }],
      }),
    );
    assert.equal(result.error?.code, "PROTECTED_PROVENANCE");
    assert.equal(stackQty(world, "ladle"), 1);
    assert.equal(stackQty(world, "scrap"), 1);
  });

  it("18. honors a declared substitute and leaves the primary pile", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "sea", itemId: "component.salt.sea", qty: 4 }),
        bulk({ instanceId: "rock", itemId: "component.salt.rock", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = commitCraft(
      world,
      req({
        recipeId: "cook.salt-crust",
        choices: [{ recipeId: "cook.salt-crust", slotIndex: 0, itemId: "component.salt.rock" }],
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "sea"), 4);
    assert.equal(stackQty(result.world, "rock"), 0);
  });

  it("19. does not silently switch to a substitute", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "rock", itemId: "component.salt.rock", qty: 5 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "INSUFFICIENT");
    assert.match(result.error?.message ?? "", /Rock salt/);
    assert.equal(stackQty(world, "rock"), 5);
  });

  it("20. rejects an item that the recipe did not list as a substitute", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "bone", itemId: "component.bone", qty: 4 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = refused(
      world,
      req({
        recipeId: "cook.salt-crust",
        choices: [{ recipeId: "cook.salt-crust", slotIndex: 0, itemId: "component.bone" }],
      }),
    );
    assert.equal(result.error?.code, "INVALID_SUBSTITUTE");
    assert.equal(stackQty(world, "bone"), 4);
  });

  it("21. follows an explicit instance preference across chests", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "belt-onion", itemId: "component.onion", qty: 1 }), bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }), bulk({ instanceId: "w", itemId: "component.water", qty: 1 })]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "pantry-onion", itemId: "component.onion", qty: 1 })]),
    ]);
    const result = commitCraft(
      world,
      req({
        recipeId: "cook.onion-broth",
        candidateContainerIds: ["belt", "pantry"],
        choices: [{ recipeId: "cook.onion-broth", slotIndex: 1, itemId: "component.onion", preferInstanceIds: ["pantry-onion"] }],
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "belt-onion"), 1);
    assert.equal(stackQty(result.world, "pantry-onion"), 0);
  });

  it("22. ignores a foreign pack even when it is named as a candidate", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
      makeContainer({
        id: "jonah-pack",
        name: "Jonah's pack",
        kind: "foreign",
        ownerId: "jonah",
        accessGrants: [],
        depositGrants: [],
        available: true,
        capacitySlots: 4,
        stacks: [
          bulk({ instanceId: "j-onion", itemId: "component.onion", qty: 5, ownerId: "jonah" }),
          bulk({ instanceId: "j-water", itemId: "component.water", qty: 5, ownerId: "jonah" }),
        ],
      }),
    ]);
    const result = refused(
      world,
      req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "jonah-pack"] }),
    );
    assert.equal(result.error?.code, "NO_ACCESS");
    assert.equal(stackQty(world, "j-onion"), 5);
  });

  it("23. does not take someone else's stack out of a shared chest", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved(
        "wagon",
        "Shared wagon",
        [bulk({ instanceId: "jonah-onion", itemId: "component.onion", qty: 4, ownerId: "jonah" })],
        { ownerId: "company", accessGrants: ["mara"], depositGrants: ["mara"] },
      ),
    ]);
    const result = refused(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "wagon"] }));
    assert.equal(result.error?.code, "NO_ACCESS");
    assert.equal(stackQty(world, "jonah-onion"), 4);
  });

  it("24. does take a communal stack from a chest the crafter may open", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved(
        "wagon",
        "Shared wagon",
        [bulk({ instanceId: "shared-water", itemId: "component.water", qty: 1, ownerId: "shared" })],
        { ownerId: "company", accessGrants: ["mara"], depositGrants: ["mara"] },
      ),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "wagon"] }));
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "shared-water"), 0);
  });

  it("25. treats a locked chest as unavailable", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
      makeContainer({
        id: "strongroom",
        name: "Chapel strongroom",
        kind: "locked",
        ownerId: "mara",
        accessGrants: [],
        depositGrants: [],
        available: false,
        capacitySlots: 4,
        stacks: [
          bulk({ instanceId: "hidden-water", itemId: "component.water", qty: 3 }),
          bulk({ instanceId: "hidden-onion", itemId: "component.onion", qty: 3 }),
        ],
      }),
    ]);
    const result = refused(
      world,
      req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "strongroom"] }),
    );
    assert.equal(result.error?.code, "UNAVAILABLE_CONTAINER");
    assert.equal(stackQty(world, "hidden-onion"), 3);
  });

  it("26. treats an out-of-range cache as unavailable", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }), bulk({ instanceId: "w", itemId: "component.water", qty: 1 })]),
      makeContainer({
        id: "river",
        name: "River cache",
        kind: "out-of-range",
        ownerId: "mara",
        accessGrants: [],
        depositGrants: [],
        available: false,
        capacitySlots: 2,
        stacks: [bulk({ instanceId: "river-onion", itemId: "component.onion", qty: 2 })],
      }),
    ]);
    const result = refused(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "river"] }));
    assert.equal(result.error?.code, "UNAVAILABLE_CONTAINER");
    assert.equal(stackQty(world, "river-onion"), 2);
  });

  it("27. treats an unloaded container as unavailable", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "lantern", itemId: "item.lantern.field", qty: 1 })]),
      makeContainer({
        id: "tarp",
        name: "Cart under the tarp",
        kind: "unloaded",
        ownerId: "mara",
        accessGrants: [],
        depositGrants: [],
        available: false,
        capacitySlots: 4,
        stacks: [
          bulk({ instanceId: "tarp-leather", itemId: "component.leather.strip", qty: 5 }),
          bulk({ instanceId: "tarp-buckle", itemId: "component.buckle", qty: 2 }),
        ],
      }),
    ]);
    const result = refused(world, req({ recipeId: "modify.strap-lantern", candidateContainerIds: ["belt", "tarp"] }));
    assert.equal(result.error?.code, "UNAVAILABLE_CONTAINER");
    assert.equal(stackQty(world, "tarp-leather"), 5);
    assert.equal(stackQty(world, "lantern"), 1);
  });

  it("28. treats an approved chest marked unavailable as closed", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "o", itemId: "component.onion", qty: 2 }), bulk({ instanceId: "w", itemId: "component.water", qty: 2 })], {
        available: false,
      }),
    ]);
    const result = refused(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "pantry"] }));
    assert.equal(result.error?.code, "UNAVAILABLE_CONTAINER");
    assert.equal(stackQty(world, "o"), 2);
  });

  it("29. deposits the output on the belt by default", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", []),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "pantry"] }));
    assert.equal(result.ok, true);
    assert.equal(result.preview.output.containerId, "belt");
    const belt = result.world.containers.find((container) => container.id === "belt");
    assert.ok(belt?.stacks.some((stack) => stack.itemId === "meal.broth.onion"));
  });

  it("30. deposits into an opened chest when asked", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("rack", "Cooling rack", []),
    ]);
    const result = commitCraft(
      world,
      req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "rack"], outputContainerId: "rack" }),
    );
    assert.equal(result.ok, true);
    const rack = result.world.containers.find((container) => container.id === "rack");
    assert.equal(rack?.stacks[0]?.itemId, "meal.broth.onion");
    assert.equal(total(result.world, "meal.broth.onion"), 1);
  });

  it("31. merges output into an existing bulk stack under the limit", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
      approved("pantry", "Camp pantry", [
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "broth", itemId: "meal.broth.onion", qty: 2 }),
      ]),
    ]);
    const result = commitCraft(
      world,
      req({
        recipeId: "cook.onion-broth",
        candidateContainerIds: ["belt", "pantry"],
        outputContainerId: "pantry",
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "broth"), 3);
  });

  it("32. refuses when the output chest has no free slot", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "junk-a", itemId: "component.fiber", qty: 1 }),
        bulk({ instanceId: "junk-b", itemId: "component.bone", qty: 1 }),
      ], 2),
      approved("pantry", "Camp pantry", [
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
    ]);
    const result = refused(
      world,
      req({
        recipeId: "cook.onion-broth",
        candidateContainerIds: ["belt", "pantry"],
        outputContainerId: "belt",
      }),
    );
    assert.equal(result.error?.code, "FULL_OUTPUT");
    assert.equal(stackQty(world, "w"), 1);
    assert.equal(stackQty(world, "o"), 1);
  });

  it("33. refuses when the only stack is already at its limit and no slot remains", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "broth", itemId: "meal.broth.onion", qty: 10 })], {
        capacitySlots: 1,
      }),
    ]);
    const result = refused(
      world,
      req({
        recipeId: "cook.onion-broth",
        candidateContainerIds: ["belt", "pantry"],
        outputContainerId: "pantry",
      }),
    );
    assert.equal(result.error?.code, "FULL_OUTPUT");
    assert.equal(stackQty(world, "broth"), 10);
  });

  it("34. frees a slot by consuming inputs before placing the output", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
      ], 2),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "pantry"] }));
    assert.equal(result.ok, true);
    assert.equal(total(result.world, "meal.broth.onion"), 1);
  });

  it("35. does not deposit into a chest the crafter cannot fill", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("jonah-chest", "Jonah's chest", [], {
        ownerId: "jonah",
        accessGrants: [],
        depositGrants: [],
      }),
    ]);
    const result = refused(
      world,
      req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt"], outputContainerId: "jonah-chest" }),
    );
    assert.equal(result.error?.code, "NO_ACCESS");
    assert.equal(stackQty(world, "w"), 1);
  });

  it("36. rejects a stale preview token instead of replanning onto another pile", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "belt-onion", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "pantry-onion", itemId: "component.onion", qty: 5 })]),
    ]);
    const request = req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt", "pantry"] });
    const preview = resolveCraft(world, request);
    assert.equal(preview.ok, true);
    const onion = preview.slots.find((slot) => slot.chosenItemId === "component.onion");
    assert.equal(onion?.sources[0]?.instanceId, "belt-onion");
    const beltOnion = findStack(world, "belt-onion");
    assert.ok(beltOnion);
    beltOnion.qty = 0;
    const result = commitCraft(world, { ...request, expectedToken: preview.stalenessToken });
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "STALE_QUANTITY");
    assert.equal(stackQty(world, "pantry-onion"), 5);
    assert.equal(stackQty(world, "w"), 1);
  });

  it("37. rejects a stale revision even when the new world could still craft", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 8 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 4 }),
      ]),
    ]);
    const session = new CraftSession(world, new MemorySave());
    const first = session.commit(req({ recipeId: "cook.salt-crust", expectedRevision: 1 }));
    assert.equal(first.ok, true);
    const second = session.commit(req({ recipeId: "cook.salt-crust", expectedRevision: 1 }));
    assert.equal(second.ok, false);
    assert.equal(second.error?.code, "STALE_QUANTITY");
    assert.equal(total(session.world, "meal.salt.crust"), 2);
  });

  it("38. cancel before commit leaves the world and the save untouched", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const save = new MemorySave();
    const session = new CraftSession(world, save);
    const before = snap(session.world);
    session.requestCancel();
    const result = session.commit(req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "CANCELLED");
    assert.equal(save.persistCalls, 0);
    assert.equal(save.published, null);
    assert.equal(snap(session.world), before);
  });

  it("39. cancel during save drops staging and does not publish", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const save = new MemorySave(null);
    const session = new CraftSession(world, save);
    const before = snap(session.world);
    save.onStage = () => session.requestCancel();
    const result = session.commit(req({ recipeId: "cook.salt-crust" }));
    assert.equal(result.error?.code, "CANCELLED");
    assert.equal(save.published, null);
    assert.equal(save.staging, null);
    assert.equal(snap(session.world), before);
  });

  it("40. an interrupted save before publish changes nothing", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const prior = cloneWorld(world);
    prior.revision = 0;
    const save = new MemorySave(prior, { interrupt: "before" });
    const before = snap(world);
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }), save);
    assert.equal(result.error?.code, "INTERRUPTED_SAVE");
    assert.equal(result.world, world);
    assert.equal(snap(world), before);
    assert.equal(save.published?.revision, 0);
    assert.equal(save.staging, null);
  });

  it("41. an interrupted save after staging does not replace the published snapshot", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const save = new MemorySave(cloneWorld(world), { interrupt: "after-stage" });
    const publishedBefore = snap(save.published as World);
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }), save);
    assert.equal(result.error?.code, "INTERRUPTED_SAVE");
    assert.equal(snap(save.published as World), publishedBefore);
    assert.equal(save.staging, null);
    assert.equal(stackQty(world, "salt"), 2);
  });

  it("42. a second press during save is refused and consumes once", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const save = new MemorySave();
    const session = new CraftSession(world, save);
    let innerCode = "";
    save.onStage = () => {
      const inner = session.commit(req({ recipeId: "cook.salt-crust" }));
      innerCode = inner.error?.code ?? "ok";
    };
    const result = session.commit(req({ recipeId: "cook.salt-crust" }));
    assert.equal(innerCode, "CONCURRENT_PRESS");
    assert.equal(result.ok, true);
    assert.equal(total(session.world, "meal.salt.crust"), 2);
    assert.equal(save.persistCalls, 1);
  });

  it("43. the same idempotency key does not consume twice", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 4 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 2 }),
      ]),
    ]);
    const session = new CraftSession(world, new MemorySave());
    const first = session.commit(req({ recipeId: "cook.salt-crust", idempotencyKey: "press-1" }));
    assert.equal(first.ok, true);
    const mid = total(session.world, "meal.salt.crust");
    const second = session.commit(req({ recipeId: "cook.salt-crust", idempotencyKey: "press-1" }));
    assert.equal(second.replayed, true);
    assert.equal(second.receipt?.id, first.receipt?.id);
    assert.equal(total(session.world, "meal.salt.crust"), mid);
  });

  it("44. two pure commits from one snapshot are alternate futures, not a double spend", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const a = commitCraft(world, req({ recipeId: "cook.salt-crust" }));
    const b = commitCraft(world, req({ recipeId: "cook.salt-crust" }));
    assert.equal(a.ok && b.ok, true);
    assert.equal(stackQty(world, "salt"), 2);
    assert.equal(total(a.world, "meal.salt.crust"), 2);
    assert.equal(total(b.world, "meal.salt.crust"), 2);
  });

  it("45. prepares a nested broth in the same transaction and leaves no leftover broth", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "root", itemId: "component.root", qty: 2 })]),
    ]);
    const preview = resolveCraft(
      world,
      req({ recipeId: "cook.field-stew", nested: true, candidateContainerIds: ["belt", "pantry"] }),
    );
    assert.equal(preview.ok, true);
    assert.ok(preview.nestedRecipeIds.includes("cook.onion-broth"));
    assert.equal(preview.fixture, true);
    const result = commitCraft(
      world,
      req({ recipeId: "cook.field-stew", nested: true, candidateContainerIds: ["belt", "pantry"] }),
    );
    assert.equal(result.ok, true);
    assert.equal(total(result.world, "meal.stew.field"), 1);
    assert.equal(total(result.world, "meal.broth.onion"), 0);
    assert.equal(stackQty(result.world, "root"), 0);
    assert.equal(stackQty(result.world, "pot"), 1);
  });

  it("46. uses stock broth before preparing more, then prepares only the shortfall", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "broth", itemId: "meal.broth.onion", qty: 1 }),
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "root", itemId: "component.root", qty: 4 })]),
    ]);
    const result = commitCraft(
      world,
      req({ recipeId: "cook.field-stew", quantity: 2, nested: true, candidateContainerIds: ["belt", "pantry"] }),
    );
    assert.equal(result.ok, true);
    assert.equal(stackQty(result.world, "broth"), 0);
    assert.equal(stackQty(result.world, "w"), 0);
    assert.equal(total(result.world, "meal.stew.field"), 2);
    assert.equal(total(result.world, "meal.broth.onion"), 0);
  });

  it("47. a failed nested prep consumes nothing", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "root", itemId: "component.root", qty: 2 })]),
    ]);
    const result = refused(
      world,
      req({ recipeId: "cook.field-stew", nested: true, candidateContainerIds: ["belt", "pantry"] }),
    );
    assert.equal(result.error?.code, "INSUFFICIENT");
    assert.equal(stackQty(world, "w"), 1);
    assert.equal(stackQty(world, "root"), 2);
  });

  it("48. does not prepare an intermediate the recipe did not opt into", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "root", itemId: "component.root", qty: 2 })]),
    ]);
    const result = refused(
      world,
      req({ recipeId: "cook.field-stew", nested: false, candidateContainerIds: ["belt", "pantry"] }),
    );
    assert.equal(result.error?.code, "INSUFFICIENT");
    assert.equal(stackQty(world, "w"), 1);
    assert.equal(total(world, "meal.stew.field"), 0);
  });

  it("49. rejects a cyclic pair even when both inputs are on the belt", () => {
    assert.equal(recipeCycle("cook.cycle-broth"), true);
    assert.equal(recipeCycle("cook.cycle-stock"), true);
    const world = makeWorld([
      carried([
        bulk({ instanceId: "a", itemId: "component.cycle.a", qty: 2 }),
        bulk({ instanceId: "b", itemId: "component.cycle.b", qty: 2 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.cycle-broth", nested: true }));
    assert.equal(result.error?.code, "CYCLIC_RECIPE");
    assert.equal(stackQty(world, "a"), 2);
    assert.equal(stackQty(world, "b"), 2);
  });

  it("50. rejects a self-cyclic recipe", () => {
    assert.equal(recipeCycle("cook.self-cycle"), true);
    const world = makeWorld([
      carried([bulk({ instanceId: "self", itemId: "component.cycle.self", qty: 3 })]),
    ]);
    const result = refused(world, req({ recipeId: "cook.self-cycle", nested: false }));
    assert.equal(result.error?.code, "CYCLIC_RECIPE");
    assert.equal(stackQty(world, "self"), 3);
  });

  it("51. field stew itself is not cyclic", () => {
    assert.equal(recipeCycle("cook.field-stew"), false);
    assert.equal(recipeCycle("cook.onion-broth"), false);
  });

  it("52. refuses the wrong station", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "coil", itemId: "salvage.coil.burnt", qty: 1 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "salvage.burnt-coil", station: "cooking" }));
    assert.equal(result.error?.code, "WRONG_STATION");
    assert.equal(stackQty(world, "coil"), 1);
  });

  it("53. refuses an unknown recipe id", () => {
    const world = createDemoWorld();
    const result = refused(world, req({ recipeId: "cook.does-not-exist" }));
    assert.equal(result.error?.code, "UNKNOWN_RECIPE");
  });

  it("54. refuses quantity zero, fractions, and oversized batches", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    assert.equal(refused(world, req({ recipeId: "cook.salt-crust", quantity: 0 })).error?.code, "INVALID_QUANTITY");
    assert.equal(refused(world, req({ recipeId: "cook.salt-crust", quantity: -2 })).error?.code, "INVALID_QUANTITY");
    assert.equal(refused(world, req({ recipeId: "cook.salt-crust", quantity: 1.5 })).error?.code, "INVALID_QUANTITY");
    assert.equal(refused(world, req({ recipeId: "cook.salt-crust", quantity: 100 })).error?.code, "INVALID_QUANTITY");
    assert.equal(stackQty(world, "salt"), 2);
  });

  it("55. an empty candidate list reads the belt and not the pantry", () => {
    const world = makeWorld([
      carried([bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 })]),
      approved("pantry", "Camp pantry", [
        bulk({ instanceId: "w", itemId: "component.water", qty: 2 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 2 }),
      ]),
    ]);
    const result = refused(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: [] }));
    assert.equal(result.error?.code, "INSUFFICIENT");
    assert.equal(stackQty(world, "w"), 2);
    assert.equal(stackQty(world, "o"), 2);
  });

  it("56. a chest that was not opened is invisible even if it would finish the craft", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "o", itemId: "component.onion", qty: 4 })]),
    ]);
    const result = refused(world, req({ recipeId: "cook.onion-broth", candidateContainerIds: ["belt"] }));
    assert.equal(result.error?.code, "INSUFFICIENT");
    assert.equal(stackQty(world, "o"), 4);
  });

  it("57. missing tool blocks the craft and is not consumed when present", () => {
    const bare = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
      ]),
    ]);
    const missing = refused(bare, req({ recipeId: "cook.onion-broth" }));
    assert.equal(missing.error?.code, "MISSING_TOOL");
    const world = makeWorld([
      carried([
        bulk({ instanceId: "w", itemId: "component.water", qty: 1 }),
        bulk({ instanceId: "o", itemId: "component.onion", qty: 1 }),
        bulk({ instanceId: "pot", itemId: "tool.pot", qty: 1 }),
      ]),
    ]);
    const result = commitCraft(world, req({ recipeId: "cook.onion-broth" }));
    assert.equal(stackQty(result.world, "pot"), 1);
  });

  it("58. restoration returns the same knife and does not touch the ladle", () => {
    const world = createDemoWorld();
    const result = commitCraft(world, {
      crafterId: "mara",
      recipeId: "restore.family-knife",
      quantity: 1,
      station: "restoration",
      nested: false,
      candidateContainerIds: [...DEMO_CANDIDATES],
    });
    assert.equal(result.ok, true, result.error?.message);
    const knife = findStack(result.world, "belt-knife");
    assert.equal(knife?.condition, "restored");
    assert.equal(knife?.provenance.displayName, "Mara's road knife");
    assert.equal(knife?.qty, 1);
    assert.equal(stackQty(result.world, "reliquary-ladle"), 1);
    assert.equal(stackQty(result.world, "belt-oil"), 0);
    assert.equal(stackQty(result.world, "pantry-grit"), 1);
    assert.equal(stackQty(result.world, "reliquary-oil-reserved"), 2);
    assert.equal(stackQty(result.world, "belt-kit"), 1);
  });

  it("59. a quest-marked knife is not restored", () => {
    const world = makeWorld([
      carried([
        {
          instanceId: "knife",
          itemId: "unique.knife.family",
          qty: 1,
          ownerId: "mara",
          protection: { kind: "quest", questId: "quest.heir" },
          provenance: { kind: "unique", displayName: "Evidence knife" },
          condition: "damaged",
        },
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
        bulk({ instanceId: "kit", itemId: "tool.kit.restore", qty: 1 }),
      ]),
      approved("pantry", "Camp pantry", [bulk({ instanceId: "grit", itemId: "component.whetstone.grit", qty: 1 })]),
    ]);
    const result = refused(
      world,
      req({
        recipeId: "restore.family-knife",
        station: "restoration",
        candidateContainerIds: ["belt", "pantry"],
      }),
    );
    assert.equal(result.error?.code, "PROTECTED");
    assert.equal(findStack(world, "knife")?.condition, "damaged");
  });

  it("60. salvage and strap pull from different opened chests in one commit", () => {
    const world = createDemoWorld();
    const salvage = commitCraft(world, {
      crafterId: "mara",
      recipeId: "salvage.burnt-coil",
      quantity: 1,
      station: "salvage",
      candidateContainerIds: [...DEMO_CANDIDATES],
      outputContainerId: "wagon",
    });
    assert.equal(salvage.ok, true, salvage.error?.message);
    assert.equal(stackQty(salvage.world, "wagon-coil"), 1);
    assert.equal(stackQty(salvage.world, "wagon-scrap"), 6);
    const strapped = commitCraft(salvage.world, {
      crafterId: "mara",
      recipeId: "modify.strap-lantern",
      quantity: 1,
      station: "modification",
      candidateContainerIds: [...DEMO_CANDIDATES],
    });
    assert.equal(strapped.ok, true, strapped.error?.message);
    assert.equal(stackQty(strapped.world, "belt-lantern"), 0);
    assert.equal(total(strapped.world, "item.lantern.field.strapped"), 1);
    assert.equal(stackQty(strapped.world, "pantry-leather"), 1);
    assert.equal(stackQty(strapped.world, "pantry-buckle"), 1);
    assert.equal(stackQty(strapped.world, "tarp-leather"), 10);
  });

  it("61. a protected substitute cannot fill a selected slot", () => {
    const world = makeWorld([
      carried([
        bulk({
          instanceId: "fav-rock",
          itemId: "component.salt.rock",
          qty: 6,
          protection: { kind: "favorite" },
        }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const result = refused(
      world,
      req({
        recipeId: "cook.salt-crust",
        choices: [{ recipeId: "cook.salt-crust", slotIndex: 0, itemId: "component.salt.rock" }],
      }),
    );
    assert.equal(result.error?.code, "PROTECTED");
    assert.equal(stackQty(world, "fav-rock"), 6);
  });

  it("62. a failed save port is not asked to persist when the plan is already illegal", () => {
    const world = makeWorld([carried([])]);
    const save = new MemorySave();
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }), save);
    assert.equal(result.ok, false);
    assert.equal(save.persistCalls, 0);
  });

  it("63. successful save publishes the next revision exactly once", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const save = new MemorySave();
    const result = commitCraft(world, req({ recipeId: "cook.salt-crust" }), save);
    assert.equal(result.ok, true);
    assert.equal(save.persistCalls, 1);
    assert.equal(save.published?.revision, 2);
    assert.equal(save.staging, null);
    assert.equal(total(save.published as World, "meal.salt.crust"), 2);
  });

  it("64. demo stew names every source and keeps heirlooms, quest piles, and Jonah's onions", () => {
    const world = createDemoWorld();
    const request: CraftRequest = {
      crafterId: "mara",
      recipeId: "cook.field-stew",
      quantity: 1,
      nested: true,
      station: "cooking",
      candidateContainerIds: [...DEMO_CANDIDATES, "jonah-pack", "strongroom", "river-cache"],
    };
    const preview = resolveCraft(world, request);
    assert.equal(preview.ok, true, preview.errors.map((entry) => entry.message).join("; "));
    const containers = new Set(preview.draws.map((draw) => draw.containerId));
    assert.ok(containers.has("belt"));
    assert.ok(containers.has("pantry"));
    assert.equal(preview.draws.some((draw) => draw.instanceId === "wagon-onion-jonah"), false);
    assert.equal(preview.draws.some((draw) => draw.instanceId === "pantry-onion-quest"), false);
    assert.equal(preview.draws.some((draw) => draw.instanceId === "reliquary-ladle"), false);
    const result = commitCraft(world, { ...request, expectedToken: preview.stalenessToken });
    assert.equal(result.ok, true, result.error?.message);
    assert.equal(total(result.world, "meal.stew.field"), 1);
    assert.equal(stackQty(result.world, "wagon-onion-jonah"), 9);
    assert.equal(stackQty(result.world, "pantry-onion-quest"), 3);
    assert.equal(stackQty(result.world, "reliquary-ladle"), 1);
    assert.equal(stackQty(result.world, "strongroom-salt"), 20);
    assert.equal(stackQty(result.world, "jonah-root"), 12);
  });

  it("65. rivets from the demo larder skip the ladle and use bulk scrap", () => {
    const world = createDemoWorld();
    const result = commitCraft(world, {
      crafterId: "mara",
      recipeId: "modify.scrap-rivet",
      quantity: 1,
      station: "modification",
      candidateContainerIds: ["belt", "reliquary", "wagon"],
    });
    assert.equal(result.ok, true, result.error?.message);
    assert.equal(stackQty(result.world, "reliquary-ladle"), 1);
    assert.equal(stackQty(result.world, "reliquary-scrap"), 0);
    assert.equal(stackQty(result.world, "wagon-scrap"), 3);
    assert.equal(total(result.world, "component.rivet"), 1);
  });

  it("66. a thrown non-save error still does not publish", () => {
    const world = makeWorld([
      carried([
        bulk({ instanceId: "salt", itemId: "component.salt.sea", qty: 2 }),
        bulk({ instanceId: "oil", itemId: "component.oil", qty: 1 }),
      ]),
    ]);
    const save: MemorySave = new MemorySave();
    save.persist = () => {
      throw new Error("disk fell off");
    };
    assert.throws(() => commitCraft(world, req({ recipeId: "cook.salt-crust" }), save), /disk fell off/);
    assert.equal(stackQty(world, "salt"), 2);
    assert.equal(save.published, null);
  });

  it("67. CancelledCraftError and InterruptedSaveError stay distinct", () => {
    assert.equal(new CancelledCraftError().name, "CancelledCraftError");
    assert.equal(new InterruptedSaveError().name, "InterruptedSaveError");
  });
});
