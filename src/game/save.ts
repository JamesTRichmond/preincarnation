import { TILE } from "./snes.ts";
import { starterWeapon } from "./weapons.ts";
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
  };
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
  s.flags.deck = s.flags.deck ?? { tracks: [], nowPlayingId: null, position: 0 };
  s.flags.chests = save.flags?.chests ?? [];
  s.flags.bushes = save.flags?.bushes ?? [];
  s.flags.talked = save.flags?.talked ?? [];
  s.flags.townsCleared = save.flags?.townsCleared ?? [];
  s.flags.caches = save.flags?.caches ?? [];
  s.flags.riflesTaken = save.flags?.riflesTaken ?? s.flags.riflesTaken ?? [];
  s.flags.bottles = save.flags?.bottles ?? s.flags.bottles ?? ["empty", "empty"];
  s.version = SAVE_VERSION;
  return s;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  try {
    const blob = JSON.stringify({ ...data, version: SAVE_VERSION });
    localStorage.setItem(SAVE_KEY + ".bak", localStorage.getItem(SAVE_KEY) ?? "");
    localStorage.setItem(SAVE_KEY, blob);
  } catch {
    /* private mode */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
