import type {
  Expect,
  Gadget,
  KitItem,
  Patch,
  Store,
  World,
} from "./types.ts";
import { IRON_IDS } from "./ids.ts";

export function emptyWorld(): World {
  return {
    scene: "rig",
    weather: {
      wind: "calm",
      wet: false,
      dawn: false,
      day: true,
      overcast: false,
      rainComing: false,
      pressure: "steady",
      tempF: 62,
    },
    hour: 15,
    quarter: 2,
    enemies: [],
    lamps: [],
    compartments: [],
    balances: [],
    puzzles: {},
    sounds: [],
    hiddenSounds: [],
    identifiedSound: null,
    merchant: {
      markedOz: 8,
      actualOz: 8,
      shortFlagged: false,
      ledgerRead: false,
      credit: 0,
    },
    documents: {},
    places: {},
    notes: [],
    readings: [],
    materials: {},
    flags: {},
    shelf: [],
    log: [],
    kit: [],
  };
}

export function makeKit(g: Pick<Gadget, "id">, over: Partial<KitItem> = {}): KitItem {
  return {
    uid: over.uid ?? g.id,
    lootId: g.id,
    condition: over.condition ?? 100,
    stored: over.stored ?? "pocket",
    winds: over.winds ?? 0,
    mods: over.mods ? [...over.mods] : [],
    recorded: over.recorded ?? null,
    plays: over.plays ?? 0,
    massOz: over.massOz ?? 0,
    sealed: over.sealed ?? false,
  };
}

export function applyPatch(world: World, patch: Patch | undefined): void {
  if (!patch) return;
  if (patch.scene) world.scene = patch.scene;
  if (patch.weather) world.weather = { ...world.weather, ...patch.weather };
  if (patch.hour !== undefined) world.hour = patch.hour;
  if (patch.quarter !== undefined) world.quarter = patch.quarter;
  if (patch.enemies) world.enemies = structuredClone(patch.enemies);
  if (patch.lamps) world.lamps = structuredClone(patch.lamps);
  if (patch.compartments) world.compartments = structuredClone(patch.compartments);
  if (patch.balances) world.balances = structuredClone(patch.balances);
  if (patch.puzzles) world.puzzles = { ...world.puzzles, ...structuredClone(patch.puzzles) };
  if (patch.sounds) world.sounds = structuredClone(patch.sounds);
  if (patch.hiddenSounds) world.hiddenSounds = structuredClone(patch.hiddenSounds);
  if (patch.identifiedSound !== undefined) world.identifiedSound = patch.identifiedSound;
  if (patch.merchant) world.merchant = { ...world.merchant, ...patch.merchant };
  if (patch.documents) world.documents = { ...world.documents, ...structuredClone(patch.documents) };
  if (patch.places) {
    for (const [id, fields] of Object.entries(patch.places)) {
      world.places[id] = { ...(world.places[id] ?? {}), ...fields };
    }
  }
  if (patch.notes) world.notes = [...world.notes, ...patch.notes];
  if (patch.materials) {
    for (const [k, v] of Object.entries(patch.materials)) {
      world.materials[k] = (world.materials[k] ?? 0) + v;
    }
  }
  if (patch.flags) world.flags = { ...world.flags, ...patch.flags };
  if (patch.shelf) world.shelf = [...patch.shelf];
  if (patch.omitLoot?.length) {
    const drop = new Set(patch.omitLoot);
    world.kit = world.kit.filter((k) => !drop.has(k.lootId));
  }
  if (patch.kitExtra) {
    for (const extra of patch.kitExtra) {
      const existing = world.kit.find((k) => k.lootId === extra.lootId);
      if (existing) {
        Object.assign(existing, {
          ...extra,
          mods: extra.mods ? [...extra.mods] : existing.mods,
        });
      } else {
        world.kit.push(
          makeKit({ id: extra.lootId }, extra),
        );
      }
    }
  }
}

export function buildFixture(g: Gadget, extra?: Patch): { world: World; self: KitItem } {
  const world = emptyWorld();
  world.scene = "rig";
  applyPatch(world, g.fixture);
  applyPatch(world, extra);
  let self = world.kit.find((k) => k.lootId === g.id);
  if (!self) {
    self = makeKit(g, {
      stored: g.storage.preferred,
      winds: g.fixture.self?.winds ?? 0,
      massOz: g.fixture.self?.massOz ?? 0,
      recorded: g.fixture.self?.recorded ?? null,
      plays: g.fixture.self?.plays ?? 0,
      mods: g.fixture.self?.mods ?? [],
      sealed: g.fixture.self?.sealed ?? false,
      condition: g.fixture.self?.condition ?? 100,
    });
    world.kit.unshift(self);
  }
  if (g.fixture.self) Object.assign(self, { ...g.fixture.self, mods: g.fixture.self.mods ? [...g.fixture.self.mods] : self.mods });
  if (extra?.self) {
    Object.assign(self, {
      ...extra.self,
      mods: extra.self.mods ? [...extra.self.mods] : self.mods,
    });
  }
  for (const k of world.kit) {
    if (IRON_IDS.has(k.lootId) && !k.mods.includes("iron")) k.mods.push("iron");
  }
  return { world, self };
}

export function readExpect(world: World, self: KitItem | undefined, e: Expect): unknown {
  switch (e.sel) {
    case "enemy":
      return world.enemies.find((x) => x.id === e.id)?.[e.field as keyof (typeof world.enemies)[0]];
    case "lamp":
      return world.lamps.find((x) => x.id === e.id)?.[e.field as keyof (typeof world.lamps)[0]];
    case "comp":
      return world.compartments.find((x) => x.id === e.id)?.[e.field as keyof (typeof world.compartments)[0]];
    case "balance":
      return world.balances.find((x) => x.id === e.id)?.[e.field as keyof (typeof world.balances)[0]];
    case "puzzle": {
      const p = world.puzzles[e.id ?? ""];
      if (!p || !e.field) return undefined;
      return p[e.field as keyof typeof p];
    }
    case "place":
      return world.places[e.id ?? ""]?.[e.field ?? ""];
    case "flag":
      return world.flags[e.id ?? ""];
    case "doc": {
      const d = world.documents[e.id ?? ""];
      if (!d || !e.field) return undefined;
      return d[e.field as keyof typeof d];
    }
    case "mat":
      return world.materials[e.id ?? ""] ?? 0;
    case "self": {
      if (!self) return undefined;
      if (e.field === "mod") return self.mods.includes(e.id ?? "");
      return self[e.field as keyof KitItem];
    }
    case "kit": {
      const k = world.kit.find((x) => x.lootId === e.id);
      if (!k) return undefined;
      if (e.field?.startsWith("mod:")) return k.mods.includes(e.field.slice(4));
      return k[e.field as keyof KitItem];
    }
    case "sound":
      return world.identifiedSound;
    case "merchant":
      return world.merchant[e.field as keyof World["merchant"]];
    case "shelf":
      return world.shelf.includes(e.id ?? "");
    case "reading":
      return world.readings.find((r) => r.tool === e.id)?.value;
    default:
      return undefined;
  }
}

export function expectsHold(world: World, self: KitItem | undefined, list: Expect[]): Expect[] {
  return list.filter((e) => readExpect(world, self, e) !== e.eq);
}

export function findKit(world: World, lootId: string): KitItem | undefined {
  return world.kit.find((k) => k.lootId === lootId);
}

export function ironInPocket(world: World, ironIds: Set<string>): boolean {
  return world.kit.some((k) => k.stored === "pocket" && ironIds.has(k.lootId));
}

export function preferredStore(g: Gadget): Store {
  return g.storage.preferred;
}
