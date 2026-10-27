import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION, SATCHEL_CAP } from "./constants.ts";
import { clampDuration } from "./effects.ts";
import { sanitizeBag } from "./inventory.ts";
import { PANTRY_TOTAL_CAP, POT_CAP, STOOP_TOTAL_CAP } from "./constants.ts";
import { getRecipe } from "./recipes.ts";
import { createKitchen, say } from "./state.ts";
import type {
  ActiveEffect,
  CareAction,
  EffectSlot,
  KitchenState,
  PreparedDish,
  Quality,
  Station,
  StorageLike,
} from "./types.ts";

const STATIONS = new Set<Station>(["board", "hearth", "kettle", "oven", "cold"]);
const CARES = new Set<CareAction>([
  "fold",
  "rest",
  "salt-late",
  "high-heat-short",
  "barely-warm",
  "smoke-light",
]);
const SLOTS = new Set<EffectSlot>(["table", "vein"]);
const QUALITIES = new Set<Quality>(["proper", "rustic", "salvage"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function dishFrom(value: unknown, seqFallback: number): PreparedDish | null {
  if (!isRecord(value)) return null;
  const effect = isRecord(value.effect) ? value.effect : null;
  if (!effect) return null;
  const slot = SLOTS.has(effect.slot as EffectSlot) ? (effect.slot as EffectSlot) : "table";
  const quality = QUALITIES.has(value.quality as Quality) ? (value.quality as Quality) : "proper";
  const recipeId = typeof value.recipeId === "string" && getRecipe(value.recipeId) ? value.recipeId : null;
  return {
    uid: typeof value.uid === "string" ? value.uid : `d${seqFallback}`,
    recipeId,
    name: typeof value.name === "string" ? value.name : "Plate",
    quality,
    effect: {
      id: typeof effect.id === "string" ? effect.id : "unknown",
      slot,
      name: typeof effect.name === "string" ? effect.name : "Effect",
      fiction: typeof effect.fiction === "string" ? effect.fiction : "",
      magnitude: 1,
      durationMinutes: clampDuration(Number(effect.durationMinutes)),
      notFor: typeof effect.notFor === "string" ? effect.notFor : "",
      stacking: typeof effect.stacking === "string" ? effect.stacking : "",
    },
    voice: typeof value.voice === "string" ? value.voice : null,
    note: typeof value.note === "string" ? value.note : "",
  };
}

function effectFrom(value: unknown): ActiveEffect | null {
  if (!isRecord(value)) return null;
  const slot = SLOTS.has(value.slot as EffectSlot) ? (value.slot as EffectSlot) : null;
  if (!slot) return null;
  const startedAt = Math.max(0, Math.floor(Number(value.startedAt)) || 0);
  const expiresAt = Math.floor(Number(value.expiresAt));
  if (!Number.isFinite(expiresAt)) return null;
  return {
    effectId: typeof value.effectId === "string" ? value.effectId : "unknown",
    slot,
    name: typeof value.name === "string" ? value.name : "Effect",
    fiction: typeof value.fiction === "string" ? value.fiction : "",
    magnitude: 1,
    startedAt,
    expiresAt,
    sourceDish: typeof value.sourceDish === "string" ? value.sourceDish : "",
    notFor: typeof value.notFor === "string" ? value.notFor : "",
  };
}

export function migrateKitchen(raw: unknown): KitchenState | null {
  if (!isRecord(raw)) return null;
  const version = raw.version == null ? 1 : Number(raw.version);
  if (!Number.isFinite(version) || version > SAVE_VERSION || version < 0) return null;
  const base = createKitchen();
  const minute = Math.max(0, Math.floor(Number(raw.minute)) || 0);
  const life = Math.max(1, Math.floor(Number(raw.life)) || 1);
  const known = Array.isArray(raw.known)
    ? raw.known.filter((id): id is string => typeof id === "string" && !!getRecipe(id))
    : base.known;
  const hints: Record<string, string> = {};
  if (isRecord(raw.hints)) {
    for (const [id, clue] of Object.entries(raw.hints)) {
      if (getRecipe(id) && typeof clue === "string") hints[id] = clue;
    }
  }
  const reveals: Record<string, string[]> = {};
  if (isRecord(raw.reveals)) {
    for (const [id, list] of Object.entries(raw.reveals)) {
      const recipe = getRecipe(id);
      if (!recipe || !Array.isArray(list)) continue;
      reveals[id] = list.filter(
        (item): item is string => typeof item === "string" && recipe.ingredients.some((req) => req.id === item),
      );
    }
  }
  const satchel = (Array.isArray(raw.satchel) ? raw.satchel : [])
    .map((dish, i) => dishFrom(dish, i + 1))
    .filter((dish): dish is PreparedDish => !!dish)
    .slice(0, SATCHEL_CAP);
  const effects = (Array.isArray(raw.effects) ? raw.effects : [])
    .map(effectFrom)
    .filter((effect): effect is ActiveEffect => !!effect)
    .filter((effect) => effect.expiresAt > minute);
  const station = STATIONS.has(raw.station as Station) ? (raw.station as Station) : base.station;
  const care = CARES.has(raw.care as CareAction) ? (raw.care as CareAction) : null;
  const intended =
    typeof raw.intendedRecipeId === "string" && getRecipe(raw.intendedRecipeId)
      ? raw.intendedRecipeId
      : null;
  const log = Array.isArray(raw.log)
    ? raw.log
        .filter(isRecord)
        .map((line) => ({
          minute: Math.max(0, Math.floor(Number(line.minute)) || 0),
          text: typeof line.text === "string" ? line.text : "",
        }))
        .filter((line) => line.text.length > 0)
        .slice(0, 40)
    : base.log;
  return {
    version: SAVE_VERSION,
    life,
    minute,
    pantry: sanitizeBag(raw.pantry, PANTRY_TOTAL_CAP),
    stoop: sanitizeBag(raw.stoop, STOOP_TOTAL_CAP),
    pot: sanitizeBag(raw.pot, POT_CAP),
    satchel,
    known: known.length > 0 ? known : base.known,
    hints,
    reveals,
    effects,
    station,
    care,
    intendedRecipeId: intended,
    log,
    offeringTakenAt: Number.isFinite(Number(raw.offeringTakenAt))
      ? Math.floor(Number(raw.offeringTakenAt))
      : -1,
    deaths: Math.max(0, Math.floor(Number(raw.deaths)) || 0),
    seq: Math.max(1, Math.floor(Number(raw.seq)) || 1),
    banner: typeof raw.banner === "string" ? raw.banner : base.banner,
  };
}

export function serializeKitchen(state: KitchenState): string {
  return JSON.stringify({ ...state, version: SAVE_VERSION });
}

export function hydrateKitchen(raw: string | null): { state: KitchenState; corrupted: boolean } {
  if (raw == null || raw.trim() === "") return { state: createKitchen(), corrupted: false };
  try {
    const migrated = migrateKitchen(JSON.parse(raw) as unknown);
    if (!migrated) {
      return {
        state: say(createKitchen(), "The saved kitchen could not be read. This one is new."),
        corrupted: true,
      };
    }
    return { state: migrated, corrupted: false };
  } catch {
    return {
      state: say(createKitchen(), "The saved kitchen was torn. A fresh one is set."),
      corrupted: true,
    };
  }
}

export function saveToStorage(state: KitchenState, storage: StorageLike): boolean {
  try {
    const prev = storage.getItem(SAVE_KEY);
    if (prev) storage.setItem(SAVE_BACKUP_KEY, prev);
    storage.setItem(SAVE_KEY, serializeKitchen(state));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage: StorageLike): { state: KitchenState; corrupted: boolean } {
  try {
    return hydrateKitchen(storage.getItem(SAVE_KEY));
  } catch {
    return {
      state: say(createKitchen(), "The kitchen could not be opened from its keeping-place."),
      corrupted: true,
    };
  }
}

/** A kitchen nested in the county save, or a fresh one when the field was never written. */
export function readKitchen(raw: unknown): KitchenState {
  if (raw == null) return createKitchen();
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return hydrateKitchen(text).state;
}
