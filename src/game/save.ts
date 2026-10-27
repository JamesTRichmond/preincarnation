import { TILE } from "./snes.ts";
import { starterWeapon } from "./weapons.ts";
import { createKitchen } from "./cooking/state.ts";
import { readKitchen } from "./cooking/save.ts";
import {
  DEFAULT_CHARACTER,
  DEFAULT_FLAGS,
  DEFAULT_UPGRADES,
  SAVE_KEY,
  SAVE_VERSION,
  type SaveData,
} from "./types.ts";

export function defaultSave(): SaveData {
  const iron = starterWeapon();
  return {
    version: SAVE_VERSION,
    cycle: 0,
    karma: 0,
    crowns: 0,
    incarnation: "wanderer",
    upgrades: { ...DEFAULT_UPGRADES },
    flags: {
      ...DEFAULT_FLAGS,
      chests: [],
      bushes: [],
      talked: [],
      townsCleared: [],
      caches: [],
      riflesTaken: [],
      bottles: ["empty", "empty"],
      relics: ["sword"],
      graves: [],
      plots: [],
    },
    maxHp: 3,
    hp: 3,
    maxMp: 8,
    mp: 8,
    mapId: "middlebury",
    x: 12 * TILE + 8,
    y: 12 * TILE + 8,
    inventory: [iron],
    equippedId: iron.id,
    character: { ...DEFAULT_CHARACTER },
    kitchen: createKitchen(),
  };
}

/** Same numbers as skillAwardForDeath. This file is emitted alone; it cannot import rules. */
function awardAlreadyPaid(idealId: string, townsCleared: readonly string[]): number {
  return 2 + (idealId === "the_job" && !townsCleared.includes("quarry") ? 1 : 0);
}

export function migrate(save: SaveData): SaveData {
  const base = defaultSave();
  const s: SaveData = {
    ...base,
    ...save,
    upgrades: { ...base.upgrades, ...save.upgrades },
    flags: { ...base.flags, ...save.flags },
    inventory: save.inventory?.length ? save.inventory : base.inventory,
    equippedId: save.equippedId || base.equippedId,
    character: { ...base.character, ...save.character },
    maxMp: save.maxMp ?? 8,
    mp: save.mp ?? 8,
  };
  if ((save.version ?? 1) < 2) {
    s.x = Math.round((save.x / 32) * TILE);
    s.y = Math.round((save.y / 32) * TILE);
  }
  if ((save.version ?? 1) < 3) {
    if (!s.inventory?.length) {
      s.inventory = [starterWeapon()];
      s.equippedId = s.inventory[0].id;
    }
  }
  if ((save.version ?? 1) < 4) {
    s.maxMp = s.maxMp || 8;
    s.mp = Math.min(s.maxMp, s.mp || s.maxMp);
    s.flags.tropoverse = s.flags.tropoverse ?? false;
    s.flags.riflesTaken = s.flags.riflesTaken ?? [];
    s.flags.bottles = s.flags.bottles?.length ? s.flags.bottles : ["empty", "empty"];
  }
  if ((save.version ?? 1) < 5) {
    s.flags.relics = s.flags.relics?.length ? s.flags.relics : ["sword"];
    s.flags.ySlot = s.flags.ySlot ?? null;
    s.flags.arrows = s.flags.arrows ?? 0;
    s.flags.keys = s.flags.keys ?? 0;
    s.flags.year = s.flags.year ?? 2026;
    s.flags.lifePath = s.flags.lifePath ?? "adventurer";
    s.flags.graves = s.flags.graves ?? [];
    s.flags.plots = s.flags.plots ?? [];
    s.flags.lanternOn = s.flags.lanternOn ?? false;
    s.flags.ipodReady = s.flags.ipodReady ?? false;
    s.flags.homeMap = s.flags.homeMap ?? s.mapId;
    s.flags.tropoverse = false;
  }
  if ((save.version ?? 1) < 6) {
    s.flags.spectrumFate = s.flags.spectrumFate ?? null;
  }
  if ((save.version ?? 1) < 7) {
    s.character = { ...DEFAULT_CHARACTER, ...s.character };
    s.flags.afterlifeHost = s.flags.afterlifeHost ?? null;
    if (!s.character.created && (s.cycle ?? 0) > 0) s.character.created = true;
  }
  if ((save.version ?? 1) < 8) {
    s.flags.lastDeed = s.flags.lastDeed ?? "";
    s.flags.returnedFromDeath = s.flags.returnedFromDeath ?? false;
  }
  if (typeof save.flags?.lastSkillAward === "number") {
    s.flags.lastSkillAward = save.flags.lastSkillAward;
  } else {
    s.flags.lastSkillAward = s.flags.returnedFromDeath
      ? awardAlreadyPaid(s.character.idealId, s.flags.townsCleared ?? [])
      : 0;
  }
  s.flags.deck = s.flags.deck ?? { tracks: [], nowPlayingId: null, position: 0 };
  s.flags.chests = save.flags?.chests ?? [];
  s.flags.bushes = save.flags?.bushes ?? [];
  s.flags.talked = save.flags?.talked ?? [];
  s.flags.townsCleared = save.flags?.townsCleared ?? [];
  s.flags.caches = save.flags?.caches ?? [];
  s.flags.riflesTaken = save.flags?.riflesTaken ?? s.flags.riflesTaken ?? [];
  s.flags.bottles = save.flags?.bottles ?? s.flags.bottles ?? ["empty", "empty"];
  s.kitchen = readKitchen(save.kitchen);
  s.version = SAVE_VERSION;
  return s;
}

/** A life the game writes names its version, its town, and where it stands. */
function stands(parsed: unknown): parsed is SaveData {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  const rec = parsed as Record<string, unknown>;
  return (
    typeof rec.version === "number" &&
    Number.isFinite(rec.version) &&
    typeof rec.mapId === "string" &&
    rec.mapId.length > 0 &&
    typeof rec.x === "number" &&
    Number.isFinite(rec.x) &&
    typeof rec.y === "number" &&
    Number.isFinite(rec.y)
  );
}

function readLife(raw: string): SaveData | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!stands(parsed)) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return defaultSave();
  }
  // A missing key is a new life, or Forget. Do not resurrect the backup.
  if (!raw) return defaultSave();
  const primary = readLife(raw);
  if (primary) return primary;
  try {
    const bak = localStorage.getItem(SAVE_KEY + ".bak");
    return (bak && readLife(bak)) || defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  try {
    const blob = JSON.stringify({ ...data, version: SAVE_VERSION });
    const current = localStorage.getItem(SAVE_KEY);
    // A stub in the lock must not be copied over the last good life.
    if (current) {
      try {
        const parsed: unknown = JSON.parse(current);
        if (stands(parsed)) localStorage.setItem(SAVE_KEY + ".bak", current);
      } catch {
        /* keep the existing backup */
      }
    }
    localStorage.setItem(SAVE_KEY, blob);
  } catch {
    /* private mode */
  }
}

export function exportLifeBlob(data: SaveData): string {
  return JSON.stringify({ ...data, version: SAVE_VERSION });
}

/** A file the player keeps. Garbage is refused. Nothing is uploaded. */
export function importLifeBlob(raw: string): SaveData | null {
  return readLife(raw);
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/** Put the previous life back. Forget still does not call this. */
export function undoLastSave(): SaveData | null {
  try {
    const bak = localStorage.getItem(SAVE_KEY + ".bak");
    const current = localStorage.getItem(SAVE_KEY);
    if (!bak || !current) return null;
    const restored = readLife(bak);
    const live = readLife(current);
    if (!restored || !live) return null;
    if (
      restored.character.skillPoints === live.character.skillPoints &&
      restored.cycle === live.cycle &&
      restored.equippedId === live.equippedId &&
      restored.hp === live.hp
    ) {
      return null;
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...restored, version: SAVE_VERSION }));
    localStorage.setItem(SAVE_KEY + ".bak", current);
    return loadSave();
  } catch {
    return null;
  }
}
