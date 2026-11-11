import assert from "node:assert/strict";
import test from "node:test";
import {
  EFFECTS_ARE_FICTION,
  INGREDIENTS,
  PANTRY_TOTAL_CAP,
  PER_STACK_CAP,
  RECIPES,
  SALVAGE_EFFECT_ID,
  SAVE_KEY,
  STARTER_RECIPE_IDS,
  STOOP_TOTAL_CAP,
  createKitchen,
  getRecipe,
  hydrateKitchen,
  loadFromStorage,
  receiveIngredients,
  reduceKitchen,
  resolveEffectApplication,
  saveToStorage,
} from "./index.ts";
import type { KitchenState, StorageLike } from "./index.ts";

const CATEGORY_COUNTS = {
  simple: 12,
  travel: 10,
  festival: 10,
  restorative: 8,
  vein: 8,
} as const;

function memory(): StorageLike & { dump: () => Map<string, string> } {
  const bag = new Map<string, string>();
  return {
    getItem: (key) => bag.get(key) ?? null,
    setItem: (key, value) => {
      bag.set(key, value);
    },
    dump: () => bag,
  };
}

function cookCard(state: KitchenState, recipeId: string, care?: KitchenState["care"]): KitchenState {
  const recipe = getRecipe(recipeId);
  assert.ok(recipe);
  let next = reduceKitchen(state, { type: "lay-out", recipeId });
  next = reduceKitchen(next, { type: "station", station: recipe.preparation.station });
  next = reduceKitchen(next, { type: "care", care: care ?? recipe.preparation.care });
  return reduceKitchen(next, { type: "cook" });
}

test("forty-eight recipes are complete, fictional, and non-stacking", () => {
  assert.equal(RECIPES.length, 48);
  assert.equal(new Set(RECIPES.map((recipe) => recipe.id)).size, 48);
  assert.equal(new Set(RECIPES.map((recipe) => recipe.effect.id)).size, 48);
  for (const [category, count] of Object.entries(CATEGORY_COUNTS)) {
    assert.equal(RECIPES.filter((recipe) => recipe.category === category).length, count);
  }
  assert.equal(STARTER_RECIPE_IDS.length, 12);
  const themes = new Set(RECIPES.flatMap((recipe) => recipe.themes));
  for (const theme of ["maple", "orchard", "dairy", "field", "waterside"]) {
    assert.ok(themes.has(theme as "maple"), theme);
  }
  const nutrition = /vitamin|calorie|immune|protein|heals|hit points|\bhp\b|hunger bar/i;
  assert.doesNotMatch(EFFECTS_ARE_FICTION, nutrition);
  for (const recipe of RECIPES) {
    assert.ok(recipe.plate.length > 0);
    assert.equal(recipe.preparation.steps.length, 3);
    assert.ok(recipe.voices.length >= 1);
    assert.ok(recipe.discovery.clue.length > 0);
    assert.ok(recipe.failure.short.length > 0 && recipe.failure.salvageName && recipe.failure.salvageFiction);
    assert.equal(recipe.effect.magnitude, 1);
    assert.ok(recipe.effect.durationMinutes >= 1 && recipe.effect.durationMinutes <= 40);
    assert.equal(recipe.effect.slot, recipe.category === "vein" ? "vein" : "table");
    assert.match(recipe.effect.stacking, /not|never/i);
    assert.ok(recipe.effect.notFor.length > 0);
    assert.equal(recipe.outcome.portions, 1);
    assert.doesNotMatch(recipe.effect.fiction, nutrition);
    assert.doesNotMatch(recipe.effect.notFor, /heals hp/i);
    assert.ok(recipe.substitutions.length >= 1);
    for (const req of recipe.ingredients) {
      assert.ok(INGREDIENTS[req.id], `${recipe.id} missing ${req.id}`);
      assert.ok(req.count >= 1);
    }
    for (const sub of recipe.substitutions) {
      assert.ok(recipe.ingredients.some((req) => req.id === sub.replaces));
      assert.ok(INGREDIENTS[sub.with], sub.with);
      assert.ok(sub.durationScale > 0 && sub.durationScale <= 1);
      assert.ok(sub.note.length > 0);
    }
  }
});

test("every recipe cooks when the pot is exact", () => {
  for (const recipe of RECIPES) {
    let state = createKitchen();
    state = { ...state, pantry: {}, pot: {}, satchel: [] };
    for (const req of recipe.ingredients) {
      state = { ...state, pantry: { ...state.pantry, [req.id]: req.count } };
    }
    for (const req of recipe.ingredients) {
      for (let i = 0; i < req.count; i += 1) state = reduceKitchen(state, { type: "pot-add", id: req.id });
    }
    state = reduceKitchen(state, { type: "experiment" });
    assert.equal(state.satchel.length, 1, recipe.id);
    assert.equal(state.satchel[0]?.recipeId, recipe.id, recipe.id);
    assert.equal(state.satchel[0]?.effect.magnitude, 1);
    assert.equal(state.satchel[0]?.effect.slot, recipe.category === "vein" ? "vein" : "table");
    assert.ok(state.known.includes(recipe.id));
    assert.equal(state.effects.length, 0, "cooking does not apply a buff");
  }
});

test("a short known recipe spends nothing", () => {
  let state = createKitchen();
  state = reduceKitchen(state, { type: "lay-out", recipeId: "spooned-oats" });
  state = reduceKitchen(state, { type: "pot-remove", id: "milk" });
  const pantry = { ...state.pantry };
  const pot = { ...state.pot };
  state = reduceKitchen(state, { type: "care", care: "barely-warm" });
  state = reduceKitchen(state, { type: "cook" });
  assert.deepEqual(state.pantry, pantry);
  assert.deepEqual(state.pot, pot);
  assert.equal(state.satchel.length, 0);
  assert.match(state.banner, /milk/i);
  assert.match(state.banner, /Nothing was used/);
});

test("a substitute cooks a shorter plate and does not touch the missing ingredient", () => {
  let state = createKitchen();
  state = reduceKitchen(state, { type: "lay-out", recipeId: "spooned-oats" });
  state = reduceKitchen(state, { type: "pot-remove", id: "milk" });
  state = reduceKitchen(state, { type: "pot-add", id: "buttermilk" });
  const milk = state.pantry.milk;
  state = reduceKitchen(state, { type: "care", care: "barely-warm" });
  state = reduceKitchen(state, { type: "cook" });
  assert.equal(state.satchel[0]?.effect.durationMinutes, 8);
  assert.equal(state.satchel[0]?.effect.magnitude, 1);
  assert.equal(state.pantry.buttermilk, 1);
  assert.equal(state.pantry.milk, milk);
  assert.equal(state.pot.buttermilk, undefined);
});

test("the wrong tend is rustic, not ruined", () => {
  const state = cookCard(createKitchen(), "spooned-oats", "fold");
  assert.equal(state.satchel[0]?.quality, "rustic");
  assert.equal(state.satchel[0]?.effect.durationMinutes, 8);
  assert.equal(state.satchel[0]?.effect.magnitude, 1);
  assert.ok(state.satchel[0]!.effect.durationMinutes < getRecipe("spooned-oats")!.effect.durationMinutes);
});

test("effects expire on the road and do not have to be renewed", () => {
  let state = cookCard(createKitchen(), "cheddar-apple");
  const duration = state.satchel[0]!.effect.durationMinutes;
  const uid = state.satchel[0]!.uid;
  state = reduceKitchen(state, { type: "eat", uid });
  assert.equal(state.effects.length, 1);
  assert.equal(state.effects[0]?.magnitude, 1);
  assert.equal(state.effects[0]?.expiresAt, duration);
  state = reduceKitchen(state, { type: "pass", minutes: duration });
  assert.equal(state.effects.length, 0);
  assert.match(state.banner, /left you|Nothing is required/);
  assert.equal(state.pantry.oats, createKitchen().pantry.oats);
});

test("a second plate in the same seat is not eaten", () => {
  let state = cookCard(createKitchen(), "cheddar-apple");
  state = reduceKitchen(state, { type: "eat", uid: state.satchel[0]!.uid });
  const expires = state.effects[0]!.expiresAt;
  state = cookCard(state, "cheddar-apple");
  const waiting = state.satchel[0]!.uid;
  state = reduceKitchen(state, { type: "eat", uid: waiting });
  assert.equal(state.satchel.length, 1);
  assert.equal(state.satchel[0]?.uid, waiting);
  assert.equal(state.effects.length, 1);
  assert.equal(state.effects[0]?.magnitude, 1);
  assert.equal(state.effects[0]?.expiresAt, expires);
  assert.match(state.banner, /stays in the satchel/);
});

test("resolveEffectApplication refreshes without adding time or strength", () => {
  const first = getRecipe("cheddar-apple")!.effect;
  const second = getRecipe("soft-eggs")!.effect;
  const applied = resolveEffectApplication([], first, 0, "first");
  assert.equal(applied.result, "applied");
  assert.equal(applied.effects[0]?.expiresAt, first.durationMinutes);
  const refreshed = resolveEffectApplication(applied.effects, first, 4, "again");
  assert.equal(refreshed.result, "refreshed");
  assert.equal(refreshed.effects[0]?.magnitude, 1);
  assert.equal(refreshed.effects[0]?.expiresAt, 4 + first.durationMinutes);
  assert.notEqual(refreshed.effects[0]?.expiresAt, first.durationMinutes + first.durationMinutes);
  const replaced = resolveEffectApplication(refreshed.effects, second, 5, "other");
  assert.equal(replaced.result, "replaced");
  assert.equal(replaced.effects.length, 1);
  assert.equal(replaced.effects[0]?.effectId, second.id);
  assert.equal(replaced.effects[0]?.magnitude, 1);
});

test("an ordinary plate and a Vein plate may both be with you, then both die", () => {
  let state = createKitchen();
  state = reduceKitchen(state, { type: "pot-add", id: "still-sap" });
  state = reduceKitchen(state, { type: "pot-add", id: "hollow-water" });
  state = reduceKitchen(state, { type: "experiment" });
  assert.equal(state.satchel[0]?.recipeId, "still-sap-tea");
  state = reduceKitchen(state, { type: "eat", uid: state.satchel[0]!.uid });
  state = cookCard(state, "spooned-oats");
  state = reduceKitchen(state, { type: "eat", uid: state.satchel[0]!.uid });
  assert.deepEqual(
    state.effects.map((effect) => effect.slot).sort(),
    ["table", "vein"],
  );
  assert.ok(state.effects.every((effect) => effect.magnitude === 1));
  state = reduceKitchen(state, { type: "pass", minutes: 10 });
  assert.equal(state.effects.length, 1);
  assert.equal(state.effects[0]?.slot, "vein");
  const known = [...state.known];
  state = reduceKitchen(state, { type: "death" });
  assert.equal(state.effects.length, 0);
  assert.equal(state.satchel.length, 0);
  assert.deepEqual(state.known, known);
  assert.equal(state.life, 2);
});

test("death halves fresh food, keeps dry goods and recipe memory", () => {
  const start = createKitchen();
  const state = reduceKitchen(start, { type: "death" });
  assert.equal(state.pantry.milk, Math.floor(start.pantry.milk / 2));
  assert.equal(state.pantry.oats, start.pantry.oats);
  assert.equal(state.pantry.potato, start.pantry.potato);
  assert.equal(state.pantry["night-apple"], undefined);
  assert.deepEqual(state.known, start.known);
  assert.equal(state.effects.length, 0);
  assert.match(state.banner, /permanent power/);
});

test("save and load round-trip a death, and a torn card starts fresh", () => {
  let state = reduceKitchen(createKitchen(), { type: "pass", minutes: 6 });
  state = reduceKitchen(state, { type: "death" });
  const store = memory();
  assert.equal(saveToStorage(state, store), true);
  const loaded = loadFromStorage(store);
  assert.equal(loaded.corrupted, false);
  assert.equal(loaded.state.life, 2);
  assert.equal(loaded.state.minute, 6);
  assert.deepEqual(loaded.state.pantry, state.pantry);
  assert.deepEqual(loaded.state.effects, []);
  assert.deepEqual(loaded.state.known, state.known);
  store.dump().set(SAVE_KEY, "{");
  const torn = loadFromStorage(store);
  assert.equal(torn.corrupted, true);
  assert.equal(torn.state.life, 1);
  assert.ok(torn.state.known.includes("spooned-oats"));
  const future = hydrateKitchen(JSON.stringify({ version: 99 }));
  assert.equal(future.corrupted, true);
});

test("inventory overflow waits on the stoop and can be taken back", () => {
  const rec = receiveIngredients(createKitchen(), "salt", 20);
  assert.equal(rec.accepted, 2);
  assert.equal(rec.toStoop, PER_STACK_CAP);
  assert.equal(rec.leftOutside, 10);
  assert.equal(rec.state.pantry.salt, PER_STACK_CAP);
  assert.equal(rec.state.stoop.salt, PER_STACK_CAP);
  assert.ok(totalOf(rec.state.pantry) <= PANTRY_TOTAL_CAP);
  assert.ok(totalOf(rec.state.stoop) <= STOOP_TOTAL_CAP);
  let state = rec.state;
  state = reduceKitchen(state, { type: "pot-add", id: "salt" });
  state = reduceKitchen(state, { type: "pot-add", id: "salt" });
  state = reduceKitchen(state, { type: "stoop-take", id: "salt" });
  assert.equal(state.pantry.salt, PER_STACK_CAP - 1);
  assert.equal(state.stoop.salt, PER_STACK_CAP - 1);
  const refused = receiveIngredients(state, "not-a-food", 4);
  assert.equal(refused.accepted, 0);
  assert.equal(refused.leftOutside, 4);
});

test("a near miss tastes one piece and a wide miss tastes none", () => {
  let state = receiveIngredients(createKitchen(), "sugar-snow", 2).state;
  state = reduceKitchen(state, { type: "pot-add", id: "sugar-snow" });
  state = reduceKitchen(state, { type: "pot-add", id: "sugar-snow" });
  state = reduceKitchen(state, { type: "experiment" });
  assert.equal(state.satchel[0]?.quality, "salvage");
  assert.equal(state.satchel[0]?.effect.id, SALVAGE_EFFECT_ID);
  assert.equal(state.satchel[0]?.effect.magnitude, 1);
  assert.equal(state.satchel[0]?.effect.durationMinutes, 4);
  assert.equal(state.pantry["sugar-snow"], 1);
  assert.equal(state.known.includes("sugar-snow-tin"), false);
  assert.ok(state.hints["sugar-snow-tin"]);
  state = receiveIngredients(createKitchen(), "beet", 1).state;
  state = reduceKitchen(state, { type: "pot-add", id: "beet" });
  state = reduceKitchen(state, { type: "experiment" });
  assert.equal(state.satchel.length, 0);
  assert.equal(state.pot.beet, 1);
  assert.match(state.banner, /Nothing was used/);
});

test("the right ingredients in the wrong amounts write the card and spend nothing", () => {
  let state = receiveIngredients(createKitchen(), "sugar-snow", 1).state;
  state = receiveIngredients(state, "maple-syrup", 1).state;
  state = reduceKitchen(state, { type: "intend", recipeId: "sugar-snow-tin" });
  state = reduceKitchen(state, { type: "pot-add", id: "sugar-snow" });
  state = reduceKitchen(state, { type: "pot-add", id: "maple-syrup" });
  const pot = { ...state.pot };
  state = reduceKitchen(state, { type: "care", care: "rest" });
  state = reduceKitchen(state, { type: "cook" });
  assert.ok(state.known.includes("sugar-snow-tin"));
  assert.equal(state.satchel.length, 0);
  assert.deepEqual(state.pot, pot);
  assert.match(state.banner, /Nothing was used/);
});

test("a full satchel refuses the next plate before anything is spent", () => {
  let state = createKitchen();
  for (let i = 0; i < 4; i += 1) state = cookCard(state, "cheddar-apple");
  assert.equal(state.satchel.length, 4);
  state = receiveIngredients(state, "cheddar", 1).state;
  state = receiveIngredients(state, "apple", 1).state;
  state = reduceKitchen(state, { type: "lay-out", recipeId: "cheddar-apple" });
  const pot = { ...state.pot };
  const pantry = { ...state.pantry };
  state = reduceKitchen(state, { type: "care", care: "rest" });
  state = reduceKitchen(state, { type: "cook" });
  assert.equal(state.satchel.length, 4);
  assert.deepEqual(state.pot, pot);
  assert.deepEqual(state.pantry, pantry);
  assert.match(state.banner, /satchel/i);
});

test("the kitchen state has no combat or hunger fields", () => {
  assert.deepEqual(Object.keys(createKitchen()).sort(), [
    "banner",
    "care",
    "deaths",
    "effects",
    "hints",
    "intendedRecipeId",
    "known",
    "life",
    "log",
    "minute",
    "offeringTakenAt",
    "pantry",
    "pot",
    "reveals",
    "satchel",
    "seq",
    "station",
    "stoop",
    "version",
  ]);
});

function totalOf(bag: Record<string, number>): number {
  return Object.values(bag).reduce((n, count) => n + count, 0);
}
