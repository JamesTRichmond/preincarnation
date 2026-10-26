import assert from "node:assert/strict";
import test from "node:test";
import { auditCatalog, CREATURES, interactionTags, MEADOW, opportunitySlots } from "../index.ts";

test("catalog is thirty-six distinct authored creatures", () => {
  const problems = auditCatalog();
  assert.deepEqual(problems, [], problems.join("\n"));
  assert.equal(CREATURES.length, 36);
  assert.ok(MEADOW.length >= 8);
});

test("every creature has more than one authored opportunity", () => {
  for (const creature of CREATURES) {
    const slots = opportunitySlots(creature);
    assert.ok(
      slots >= 2 || creature.presence.anyOf.length >= 2,
      `${creature.id} is a single slot`,
    );
  }
});

test("the meadow mixes movement, observation, light, sound, preparation, and tools", () => {
  const tags = new Set(MEADOW.flatMap((creature) => interactionTags(creature)));
  for (const required of ["pace", "still", "observation", "light", "sound", "prep", "tool"]) {
    assert.ok(tags.has(required), required);
  }
});

test("real names are not filed as Vein fiction", () => {
  const real = CREATURES.filter((creature) => !creature.fictional);
  assert.ok(real.length > 20);
  assert.ok(real.every((creature) => creature.tier !== "vein"));
  assert.ok(CREATURES.filter((creature) => creature.tier === "vein").every((creature) => creature.fictional));
});
