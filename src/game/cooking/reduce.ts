import { CARE_OPTIONS, SATCHEL_CAP, STATIONS } from "./constants.ts";
import { clampDuration, salvageEffect } from "./effects.ts";
import { ingredientName, isPerishable } from "./ingredients.ts";
import { potRoom, receiveIngredients, returnAll, total, withCount } from "./inventory.ts";
import { currentOffering, offeringReady } from "./offerings.ts";
import { assignPot, durationScale, isCleanShort, isComplete, touchRatio } from "./pot.ts";
import type { Assignment } from "./pot.ts";
import { getRecipe, RECIPES } from "./recipes.ts";
import { nextDishId, say } from "./state.ts";
import type {
  CareAction,
  KitchenState,
  PreparedDish,
  Quality,
  Recipe,
  Station,
} from "./types.ts";

export type KitchenAction =
  | { type: "replace"; state: KitchenState }
  | { type: "pot-add"; id: string }
  | { type: "pot-remove"; id: string }
  | { type: "pot-clear" }
  | { type: "station"; station: Station }
  | { type: "care"; care: CareAction }
  | { type: "intend"; recipeId: string | null }
  | { type: "lay-out"; recipeId: string }
  | { type: "cook" }
  | { type: "experiment" }
  | { type: "eat"; uid: string }
  | { type: "pass"; minutes: number }
  | { type: "offering" }
  | { type: "death" }
  | { type: "stoop-take"; id: string }
  | { type: "ask"; recipeId: string };

function careLabel(care: CareAction): string {
  return CARE_OPTIONS.find((option) => option.id === care)?.label ?? care;
}

function stationLabel(station: Station): string {
  return STATIONS.find((option) => option.id === station)?.label.toLowerCase() ?? station;
}

function spoil(bag: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [id, count] of Object.entries(bag)) {
    const kept = isPerishable(id) ? Math.floor(count / 2) : count;
    if (kept > 0) next[id] = kept;
  }
  return next;
}

function leftoverUnits(assignment: Assignment): number {
  return Object.values(assignment.leftover).reduce((n, count) => n + count, 0);
}

function substituteUnits(assignment: Assignment): number {
  let n = 0;
  for (const line of assignment.lines) {
    for (const take of line.takes) {
      if (take.id !== line.replaces) n += take.count;
    }
  }
  return n;
}

function lineReport(recipe: Recipe, assignment: Assignment): string {
  return assignment.lines
    .filter((line) => line.have < line.need)
    .map((line) => {
      const sub = recipe.substitutions.find(
        (item) => item.replaces === line.replaces && item.durationScale > 0,
      );
      const standIn = sub
        ? ` ${ingredientName(sub.with)} can stand in for it. ${sub.note}`
        : "";
      return `${ingredientName(line.replaces)}: ${line.have} in the pot, the card wants ${line.need}.${standIn}`;
    })
    .join(" ");
}

function bestComplete(pot: Record<string, number>): { recipe: Recipe; assignment: Assignment } | null {
  const hits = RECIPES.map((recipe) => ({ recipe, assignment: assignPot(recipe, pot) })).filter((hit) =>
    isComplete(hit.assignment),
  );
  hits.sort((a, b) => {
    const leftover = leftoverUnits(a.assignment) - leftoverUnits(b.assignment);
    if (leftover !== 0) return leftover;
    const subs = substituteUnits(a.assignment) - substituteUnits(b.assignment);
    if (subs !== 0) return subs;
    if (b.recipe.ingredients.length !== a.recipe.ingredients.length) {
      return b.recipe.ingredients.length - a.recipe.ingredients.length;
    }
    const need = (recipe: Recipe) => recipe.ingredients.reduce((n, item) => n + item.count, 0);
    if (need(b.recipe) !== need(a.recipe)) return need(b.recipe) - need(a.recipe);
    return a.recipe.id < b.recipe.id ? -1 : 1;
  });
  return hits[0] ?? null;
}

function bestNear(
  pot: Record<string, number>,
): { recipe: Recipe; assignment: Assignment; ratio: number } | null {
  let best: { recipe: Recipe; assignment: Assignment; ratio: number } | null = null;
  for (const recipe of RECIPES) {
    const assignment = assignPot(recipe, pot);
    if (isComplete(assignment)) continue;
    const ratio = touchRatio(assignment);
    if (ratio < 0.5) continue;
    if (
      !best ||
      ratio > best.ratio ||
      (ratio === best.ratio && recipe.ingredients.length > best.recipe.ingredients.length) ||
      (ratio === best.ratio &&
        recipe.ingredients.length === best.recipe.ingredients.length &&
        recipe.id < best.recipe.id)
    ) {
      best = { recipe, assignment, ratio };
    }
  }
  return best;
}

function satchelFull(state: KitchenState): KitchenState | null {
  if (state.satchel.length < SATCHEL_CAP) return null;
  return say(
    state,
    "The satchel holds four plates. Eat one or set one aside in your mind — this pot stays as it is. Nothing was used.",
  );
}

function finishPlate(
  state: KitchenState,
  recipe: Recipe,
  assignment: Assignment,
  mode: "card" | "experiment",
): KitchenState {
  const blocked = satchelFull(state);
  if (blocked) return blocked;
  const wasKnown = state.known.includes(recipe.id);
  let scale = durationScale(assignment);
  let quality: Quality = "proper";
  const asides: string[] = [];
  if (mode === "card" && wasKnown) {
    if (state.care !== recipe.preparation.care) {
      quality = "rustic";
      scale *= 0.8;
      asides.push(`The card wanted “${careLabel(recipe.preparation.care)}”.`);
    }
    if (state.station !== recipe.preparation.station) {
      quality = "rustic";
      scale *= 0.85;
      asides.push(`It wanted the ${stationLabel(recipe.preparation.station)}.`);
    }
  }
  if (!wasKnown) asides.push("The card is written.");
  for (const line of assignment.lines) {
    for (const take of line.takes) {
      if (take.note) asides.push(take.note);
    }
  }
  const duration = clampDuration(Math.round(recipe.effect.durationMinutes * scale));
  const ided = nextDishId(state);
  const voice = recipe.voices[0] ? `${recipe.voices[0].who}: "${recipe.voices[0].line}"` : null;
  const dish: PreparedDish = {
    uid: ided.uid,
    recipeId: recipe.id,
    name: recipe.name,
    quality,
    effect: { ...recipe.effect, durationMinutes: duration, magnitude: 1 },
    voice,
    note: quality === "rustic" ? recipe.feedback.rustic : recipe.feedback.success,
  };
  const returned = returnAll(
    {
      ...ided.state,
      pot: {},
      known: wasKnown ? state.known : [...state.known, recipe.id],
      hints: { ...state.hints, [recipe.id]: recipe.discovery.clue },
      satchel: [...state.satchel, dish],
    },
    assignment.leftover,
  );
  const extraIds = Object.keys(assignment.leftover);
  const extra = extraIds.length ? ` Set back: ${extraIds.map(ingredientName).join(", ")}.` : "";
  const outside = returned.leftOutside
    ? " What would not fit was left outside the pantry, not thrown away."
    : "";
  const lead = quality === "rustic" ? recipe.feedback.rustic : recipe.feedback.success;
  return say(
    returned.state,
    `${lead} ${recipe.name} waits in the satchel: ${duration} minutes of road if eaten, strength 1, and it will not stack.${extra}${outside} ${asides.join(" ")}${voice ? ` ${voice}` : ""}`,
  );
}

function nearMiss(state: KitchenState, recipe: Recipe, assignment: Assignment): KitchenState {
  const blocked = satchelFull(state);
  if (blocked) return blocked;
  let consumed: string | null = null;
  let richest = 0;
  for (const line of assignment.lines) {
    for (const take of line.takes) {
      if (take.count > richest) {
        richest = take.count;
        consumed = take.id;
      }
    }
  }
  if (!consumed || (state.pot[consumed] ?? 0) < 1) {
    return say(state, "The pot is close to something and also confused. Nothing was used.");
  }
  const pot = withCount(state.pot, consumed, (state.pot[consumed] ?? 0) - 1);
  const ided = nextDishId(state);
  const dish: PreparedDish = {
    uid: ided.uid,
    recipeId: recipe.id,
    name: recipe.failure.salvageName,
    quality: "salvage",
    effect: salvageEffect(recipe.failure.salvageFiction),
    voice: null,
    note: recipe.feedback.salvage,
  };
  const knownHint = state.known.includes(recipe.id);
  const returned = returnAll(
    {
      ...ided.state,
      pot: {},
      satchel: [...state.satchel, dish],
      hints: { ...state.hints, [recipe.id]: recipe.discovery.clue },
    },
    pot,
  );
  const clue = knownHint ? "" : ` ${recipe.discovery.clue}`;
  return say(
    returned.state,
    `This leans toward ${recipe.name}. 1 ${ingredientName(consumed)} was tasted; the rest is back. ${recipe.feedback.salvage}${clue}`,
  );
}

export function cookCard(state: KitchenState): KitchenState {
  if (total(state.pot) === 0) return say(state, "The pot is empty. Nothing was used.");
  const recipe = state.intendedRecipeId ? getRecipe(state.intendedRecipeId) : undefined;
  if (!recipe) return say(state, "Choose a card, or experiment with what is in the pot.");
  if (!state.care) {
    return say(
      state,
      `Choose how to tend it. The card says “${careLabel(recipe.preparation.care)}”. A wrong tend still cooks — it only comes out rustic, and shorter on the road.`,
    );
  }
  const assignment = assignPot(recipe, state.pot);
  if (isComplete(assignment)) return finishPlate(state, recipe, assignment, "card");
  if (isCleanShort(assignment)) {
    const report = lineReport(recipe, assignment);
    if (!state.known.includes(recipe.id)) {
      return say(
        {
          ...state,
          known: [...state.known, recipe.id],
          hints: { ...state.hints, [recipe.id]: recipe.discovery.clue },
        },
        `The right ingredients, not the right amounts. The card for ${recipe.name} is written. ${report} Nothing was used.`,
      );
    }
    return say(state, `${recipe.failure.short} ${report} Nothing was used.`);
  }
  const foreign = assignment.foreign.map(ingredientName);
  const report = lineReport(recipe, assignment);
  if (foreign.length > 0) {
    return say(
      state,
      `${foreign.join(", ")} ${foreign.length === 1 ? "isn't" : "aren't"} in ${recipe.name}. ${report} Nothing was used.`,
    );
  }
  return say(state, `${recipe.failure.short} ${report} Nothing was used.`);
}

export function experiment(state: KitchenState): KitchenState {
  if (total(state.pot) === 0) return say(state, "The pot is empty. Nothing was used.");
  const ready = bestComplete(state.pot);
  if (ready) return finishPlate(state, ready.recipe, ready.assignment, "experiment");
  const near = bestNear(state.pot);
  if (near) return nearMiss(state, near.recipe, near.assignment);
  return say(
    state,
    "The pot doesn't know this combination. Nothing was used. A rumor on the board is a better start than a guess this wide.",
  );
}

export function eatDish(state: KitchenState, uid: string): KitchenState {
  const dish = state.satchel.find((item) => item.uid === uid);
  if (!dish) return say(state, "That plate is already gone.");
  const active = state.effects.find((effect) => effect.slot === dish.effect.slot && effect.expiresAt > state.minute);
  if (active) {
    const left = active.expiresAt - state.minute;
    return say(
      state,
      `${active.name} is still with you (${left} min of road). ${dish.name} stays in the satchel. A second plate in that seat is not eaten — strength does not stack, and time does not add.`,
    );
  }
  const duration = clampDuration(dish.effect.durationMinutes);
  return say(
    {
      ...state,
      satchel: state.satchel.filter((item) => item.uid !== uid),
      effects: [
        ...state.effects.filter((effect) => effect.slot !== dish.effect.slot),
        {
          effectId: dish.effect.id,
          slot: dish.effect.slot,
          name: dish.effect.name,
          fiction: dish.effect.fiction,
          magnitude: 1,
          startedAt: state.minute,
          expiresAt: state.minute + duration,
          sourceDish: dish.name,
          notFor: dish.effect.notFor,
        },
      ],
    },
    `${dish.name}. ${dish.effect.fiction} It holds for ${duration} minutes of road, then leaves. Strength is 1. ${dish.effect.notFor}${dish.voice ? ` ${dish.voice}` : ""}`,
  );
}

export function tickRoad(state: KitchenState, minutes: number): KitchenState {
  const add = Math.max(0, Math.floor(minutes));
  if (add === 0) return state;
  const minute = state.minute + add;
  const gone = state.effects.filter((effect) => effect.expiresAt <= minute);
  const effects = state.effects.filter((effect) => effect.expiresAt > minute);
  const next = { ...state, minute, effects };
  if (gone.length === 0) return say(next, `${add} minutes of road. Nothing you ate is asking to be renewed.`);
  const names = gone.map((effect) => effect.name).join(", ");
  const verb = gone.length > 1 ? "have" : "has";
  return say(next, `${names} ${verb} left you. Nothing is required in its place.`);
}

export function applyDeath(state: KitchenState): KitchenState {
  return say(
    {
      ...state,
      life: state.life + 1,
      deaths: state.deaths + 1,
      effects: [],
      satchel: [],
      pantry: spoil(state.pantry),
      stoop: spoil(state.stoop),
      pot: spoil(state.pot),
      care: null,
    },
    "This life ends. The recipes stay. Plates and road-effects do not. Fresh food is halved; dry goods remain. Nothing you ate becomes a permanent power.",
  );
}

function returnPot(state: KitchenState): KitchenState {
  const pot = state.pot;
  return returnAll({ ...state, pot: {} }, pot).state;
}

export function layOut(state: KitchenState, recipeId: string): KitchenState {
  const recipe = getRecipe(recipeId);
  if (!recipe) return say(state, "No such card.");
  let next = returnPot(state);
  next = {
    ...next,
    intendedRecipeId: recipeId,
    station: recipe.preparation.station,
    care: null,
  };
  const missing: string[] = [];
  const hints: string[] = [];
  for (const req of recipe.ingredients) {
    const have = next.pantry[req.id] ?? 0;
    const take = Math.min(have, req.count, potRoom(next));
    if (take > 0) {
      next = {
        ...next,
        pantry: withCount(next.pantry, req.id, have - take),
        pot: withCount(next.pot, req.id, (next.pot[req.id] ?? 0) + take),
      };
    }
    if (take < req.count) {
      missing.push(`${ingredientName(req.id)} (${take}/${req.count})`);
      const sub = recipe.substitutions.find(
        (item) => item.replaces === req.id && (next.pantry[item.with] ?? 0) > 0,
      );
      if (sub) hints.push(`${ingredientName(sub.with)} can stand in for ${ingredientName(req.id)}. ${sub.note}`);
    }
  }
  if (missing.length === 0) {
    return say(
      next,
      `${recipe.name} is in the pot. ${recipe.preparation.verb} Choose a tend — the card says “${careLabel(recipe.preparation.care)}”.`,
    );
  }
  return say(
    next,
    `Laid out what you have for ${recipe.name}. Short: ${missing.join(", ")}. ${hints.join(" ")} Nothing was lost.`,
  );
}

export function askAbout(state: KitchenState, recipeId: string): KitchenState {
  const recipe = getRecipe(recipeId);
  if (!recipe) return say(state, "No such rumor.");
  if (state.known.includes(recipeId)) return say(state, "That card is already written.");
  const revealed = state.reveals[recipeId] ?? [];
  const next = recipe.ingredients.find((req) => !revealed.includes(req.id));
  if (!next) {
    return say(
      state,
      "You know every ingredient. Amounts are learned by cooking. A short pot writes the card and spends nothing.",
    );
  }
  const who = recipe.voices[0]?.who ?? "Someone in the county";
  return say(
    {
      ...state,
      reveals: { ...state.reveals, [recipeId]: [...revealed, next.id] },
      hints: { ...state.hints, [recipeId]: recipe.discovery.clue },
    },
    `${who} names ${ingredientName(next.id)}, but not how much.`,
  );
}

export function takeOffering(state: KitchenState): KitchenState {
  if (!offeringReady(state)) {
    const wait = Math.max(0, 20 - (state.minute - state.offeringTakenAt));
    return say(state, `Someone already stopped by. Another gift is ${wait} minutes of road away. You don't need it before then.`);
  }
  const gift = currentOffering(state);
  let next: KitchenState = { ...state };
  let taken = 0;
  let toStoop = 0;
  let left = 0;
  const names: string[] = [];
  for (const item of gift.items) {
    const rec = receiveIngredients(next, item.id, item.count);
    next = rec.state;
    taken += rec.accepted + rec.toStoop;
    toStoop += rec.toStoop;
    left += rec.leftOutside;
    if (rec.accepted + rec.toStoop > 0) names.push(ingredientName(item.id));
  }
  if (taken === 0) {
    return say(state, `${gift.place} left ${gift.line} The pantry and the stoop are full, so you leave the gift where it is.`);
  }
  next = { ...next, offeringTakenAt: state.minute };
  const stoopNote = toStoop ? " Some of it waits on the stoop until you make room." : "";
  const leftNote = left ? " What would not fit was left outside, not discarded." : "";
  return say(next, `${gift.place}. ${gift.line} You take in ${names.join(", ")}.${stoopNote}${leftNote}`);
}

export function pantryCovers(state: KitchenState, recipeId: string): boolean {
  const recipe = getRecipe(recipeId);
  if (!recipe) return false;
  const pool = { ...state.pantry };
  for (const req of recipe.ingredients) {
    if ((pool[req.id] ?? 0) < req.count) return false;
    pool[req.id] -= req.count;
  }
  return true;
}

export function describePot(state: KitchenState, mode: "card" | "experiment"): string {
  if (total(state.pot) === 0) return "The pot is empty.";
  if (mode === "card") {
    const recipe = state.intendedRecipeId ? getRecipe(state.intendedRecipeId) : undefined;
    if (!recipe) return "Choose a card, or experiment.";
    const assignment = assignPot(recipe, state.pot);
    if (isComplete(assignment)) return recipe.feedback.working;
    if (assignment.foreign.length > 0) {
      return `${assignment.foreign.map(ingredientName).join(", ")} doesn't belong on this card. Cooking it now will not spend the pot.`;
    }
    if (isCleanShort(assignment) || touchRatio(assignment) > 0) {
      return `${lineReport(recipe, assignment)} Nothing will be spent.`;
    }
    return `This isn't ${recipe.name}. Cooking the card will not spend the pot.`;
  }
  const ready = bestComplete(state.pot);
  if (ready) {
    const known = state.known.includes(ready.recipe.id) ? "You already have the card." : "Cooking will write the card.";
    return `This pot matches ${ready.recipe.name}. ${known}`;
  }
  const near = bestNear(state.pot);
  if (near) return `This leans toward ${near.recipe.name}. A near miss tastes one piece and puts the rest back.`;
  return "No card is close. Experimenting will not spend the pot.";
}

export function reduceKitchen(state: KitchenState, action: KitchenAction): KitchenState {
  switch (action.type) {
    case "replace":
      return action.state;
    case "pot-add": {
      if ((state.pantry[action.id] ?? 0) < 1) return say(state, `No ${ingredientName(action.id)} in the pantry.`);
      if (potRoom(state) < 1) return say(state, "The pot is full. Put something back before adding more.");
      return {
        ...state,
        pantry: withCount(state.pantry, action.id, state.pantry[action.id] - 1),
        pot: withCount(state.pot, action.id, (state.pot[action.id] ?? 0) + 1),
      };
    }
    case "pot-remove": {
      if ((state.pot[action.id] ?? 0) < 1) return state;
      const pot = withCount(state.pot, action.id, state.pot[action.id] - 1);
      const rec = receiveIngredients({ ...state, pot }, action.id, 1);
      if (rec.accepted + rec.toStoop < 1) {
        return say(state, `The pantry and the stoop can't take ${ingredientName(action.id)}. It stays in the pot.`);
      }
      return rec.state;
    }
    case "pot-clear":
      return say(returnPot(state), "The pot goes back. Nothing was cooked away.");
    case "station":
      return { ...state, station: action.station };
    case "care":
      return { ...state, care: action.care };
    case "intend": {
      if (!action.recipeId) return { ...state, intendedRecipeId: null };
      const recipe = getRecipe(action.recipeId);
      if (!recipe) return state;
      return { ...state, intendedRecipeId: action.recipeId, station: recipe.preparation.station, care: null };
    }
    case "lay-out":
      return layOut(state, action.recipeId);
    case "cook":
      return cookCard(state);
    case "experiment":
      return experiment(state);
    case "eat":
      return eatDish(state, action.uid);
    case "pass":
      return tickRoad(state, action.minutes);
    case "offering":
      return takeOffering(state);
    case "death":
      return applyDeath(state);
    case "stoop-take": {
      if ((state.stoop[action.id] ?? 0) < 1) return say(state, "That isn't on the stoop.");
      const stoop = withCount(state.stoop, action.id, state.stoop[action.id] - 1);
      const rec = receiveIngredients({ ...state, stoop }, action.id, 1);
      if (rec.accepted < 1) return say(state, `The pantry can't take more ${ingredientName(action.id)}. It stays on the stoop.`);
      return say(rec.state, `${ingredientName(action.id)} comes in off the stoop.`);
    }
    case "ask":
      return askAbout(state, action.recipeId);
    default:
      return state;
  }
}
