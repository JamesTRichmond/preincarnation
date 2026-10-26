import { AFFIXES, CATALOG_BY_ID, PROJECT_BY_ID } from "./catalog.ts";
import { placeById } from "./places.ts";
import { hashString, words } from "./text.ts";
import type { CatalogEntry, KnownWorld, LedgerRecord, WorldInstance } from "./types.ts";

/**
 * Save slice the search is allowed to see. Field names follow the game's
 * SaveData / Flags where they overlap. Coordinates on an unexcavated grave
 * are present so tests can prove they are dropped.
 */
export type SaveGrave = {
  id: string;
  excavated: boolean;
  x?: number;
  y?: number;
  weapons: { id: string; name: string; magic: boolean; kind: string }[];
  relics: string[];
};

export type PreincarnationSaveSlice = {
  version?: number;
  cycle: number;
  inventory: {
    id: string;
    name: string;
    kind: string;
    flavor?: string;
    affixes?: { id: string; name: string; magic?: boolean }[];
  }[];
  equippedId: string;
  character?: { name?: string; bondId?: string };
  flags: PreincarnationFields & {
    graves?: SaveGrave[];
    returnedFromDeath?: boolean;
  };
};

export type PreincarnationFields = {
  relics: string[];
  ySlot: string | null;
  arrows: number;
  bombs: number;
  bottles: string[];
  keys: number;
  /** Opened cache ids only. Contents, if taken, are already in inventory. */
  caches?: string[];
  year: number;
  lifePath?: string;
};

const RELIC_CATALOG: Record<string, string> = {
  sword: "short-iron",
  shovel: "shovel",
  hookshot: "hookshot",
  boots: "boots",
  flippers: "flippers",
  lantern: "lantern",
  hammer: "hammer",
  net: "net",
  mirror: "mirror",
  cape: "cape",
  cane: "cane",
  bow: "bow",
  ipod: "ipod",
  bombs: "bombs",
};

function addToken(bag: Set<string>, token: string) {
  if (token) bag.add(token);
}

function addText(bag: Set<string>, value: string, prefix?: string) {
  for (const word of words(value)) {
    addToken(bag, word);
    if (prefix) addToken(bag, prefix + word);
  }
}

export function worldSignature(world: KnownWorld): string {
  const parts: string[] = [
    String(world.revision),
    String(world.year),
    world.locale,
    world.bearer,
  ];
  for (const instance of world.instances) {
    parts.push(
      [
        instance.instanceId,
        instance.name,
        instance.renamedFrom ?? "",
        instance.quantity,
        instance.kind,
        instance.custody ?? "",
        instance.equipped ? "1" : "0",
        instance.reservedFor ?? "",
        instance.location.placeId,
        instance.location.label,
        instance.location.accessible ? "1" : "0",
        instance.synthetic ? "1" : "0",
        instance.discovered === false ? "hidden" : "known",
      ].join("~"),
    );
  }
  for (const hidden of world.undiscovered) {
    parts.push(`hidden:${hidden.secretId}`);
  }
  parts.sort();
  return hashString(parts.join("|"));
}

function fixtureRecord(instance: WorldInstance): LedgerRecord {
  const bag = new Set<string>();
  addText(bag, instance.name, "name:");
  addText(bag, instance.location.label, "where:");
  addText(bag, instance.location.container, "where:");
  for (const token of ["fixture", "synthetic", "tally", "effect:tally", "kind:fixture", "stored", "custody:stored", "counterfoil", "component:counterfoil"]) {
    addToken(bag, token);
  }
  return {
    instanceId: instance.instanceId,
    catalogId: instance.catalogId,
    synthetic: true,
    kind: "fixture",
    slot: "stack",
    name: instance.name,
    canonicalName: instance.name,
    renamedFrom: undefined,
    localeNames: { en: instance.name },
    quantity: instance.quantity,
    components: ["counterfoil"],
    effects: ["tally"],
    effectText: instance.effectNote ?? "A counted slip used to measure search.",
    tools: [],
    provenance: instance.notes ?? "Synthetic performance fixture. Not an authored item.",
    locationLabel: instance.location.label,
    container: instance.location.container,
    placeId: instance.location.placeId,
    accessible: instance.location.accessible,
    custody: "stored",
    equipped: false,
    reservedFor: null,
    reservedLabel: null,
    projects: [],
    yearConfirmed: instance.confirmedYear,
    notes: instance.notes,
    tokens: [...bag],
  };
}

function recordFrom(instance: WorldInstance, catalog: CatalogEntry | undefined): LedgerRecord | null {
  if (instance.discovered === false) return null;
  if (instance.synthetic || instance.kind === "fixture") return fixtureRecord(instance);

  const effects = [...(catalog?.effects ?? [])];
  const components = [...(catalog?.components ?? [])];
  const effectNotes: string[] = [];
  if (catalog?.effectText) effectNotes.push(catalog.effectText);

  for (const affixId of instance.components ?? []) {
    const affix = AFFIXES[affixId];
    if (!affix) {
      if (!components.includes(affixId)) components.push(affixId);
      continue;
    }
    if (!components.includes(affix.name)) components.push(affix.name);
    for (const effect of affix.effects) {
      if (!effects.includes(effect)) effects.push(effect);
    }
    effectNotes.push(affix.effectText);
  }
  for (const effect of instance.effects ?? []) {
    if (!effects.includes(effect)) effects.push(effect);
  }
  if (instance.effectNote) effectNotes.push(instance.effectNote);

  const projects = catalog?.projects ?? [];
  const reservedLabel = instance.reservedFor ? PROJECT_BY_ID[instance.reservedFor]?.name ?? instance.reservedFor : null;
  const localeNames = catalog?.names ?? { en: instance.name };
  const provenance = catalog?.provenance ?? instance.notes ?? "Known to you.";

  const record: LedgerRecord = {
    instanceId: instance.instanceId,
    catalogId: instance.catalogId,
    synthetic: false,
    kind: instance.kind,
    slot: catalog?.slot ?? "hand",
    name: instance.name,
    canonicalName: catalog?.canonicalName ?? instance.name,
    renamedFrom: instance.renamedFrom,
    localeNames,
    quantity: instance.quantity,
    components,
    effects,
    effectText: effectNotes.join(" "),
    tools: catalog?.tools ?? [],
    provenance,
    locationLabel: instance.location.label,
    container: instance.location.container,
    placeId: instance.location.placeId,
    accessible: instance.location.accessible,
    custody: instance.custody,
    equipped: instance.equipped,
    reservedFor: instance.reservedFor,
    reservedLabel,
    projects,
    yearConfirmed: instance.confirmedYear,
    notes: instance.notes,
    tokens: [],
  };

  const bag = new Set<string>();
  addText(bag, record.name, "name:");
  addText(bag, record.canonicalName, "name:");
  if (record.renamedFrom) addText(bag, record.renamedFrom, "name:");
  for (const localeName of Object.values(record.localeNames)) addText(bag, localeName, "name:");
  for (const component of record.components) addText(bag, component, "component:");
  for (const effect of record.effects) {
    addToken(bag, effect);
    addToken(bag, `effect:${effect}`);
  }
  addText(bag, record.effectText);
  for (const tool of record.tools) addText(bag, tool, "tool:");
  addText(bag, record.provenance, "provenance:");
  addText(bag, record.locationLabel, "where:");
  addText(bag, record.container, "where:");
  addText(bag, record.placeId, "where:");
  for (const project of record.projects) {
    addToken(bag, `project:${project.id}`);
    addText(bag, project.name, "project:");
    addText(bag, project.relevance);
  }
  if (record.reservedFor) {
    addToken(bag, `project:${record.reservedFor}`);
    addToken(bag, "reserved");
    if (record.reservedLabel) addText(bag, record.reservedLabel, "project:");
  }
  addToken(bag, `kind:${record.kind}`);
  addText(bag, record.kind);
  if (record.custody) {
    addToken(bag, `custody:${record.custody}`);
    addToken(bag, record.custody);
  }
  if (record.equipped) addToken(bag, "equipped");
  if (!record.accessible) {
    addToken(bag, "barred");
    addToken(bag, "inaccessible");
  }
  if (record.synthetic) {
    addToken(bag, "fixture");
    addToken(bag, "synthetic");
  }
  record.tokens = [...bag];
  return record;
}

/** Known instances in, undiscovered loot out. Catalog definitions without an instance stay out. */
export function adaptWorld(world: KnownWorld): LedgerRecord[] {
  const records: LedgerRecord[] = [];
  const hiddenIds = new Set(world.undiscovered.map((entry) => entry.secretId));
  const hiddenNames = new Set(world.undiscovered.map((entry) => entry.name.toLowerCase()));

  for (const instance of world.instances) {
    if (instance.discovered === false) continue;
    if (hiddenIds.has(instance.instanceId)) continue;
    if (hiddenNames.has(instance.name.toLowerCase()) && instance.catalogId === "sunstone") continue;
    const catalog = CATALOG_BY_ID[instance.catalogId];
    const record = recordFrom(instance, catalog);
    if (record) records.push(record);
  }
  return records;
}

function owned(partial: Omit<WorldInstance, "discovered" | "exposure" | "confirmedYear" | "quantity" | "equipped" | "reservedFor" | "custody" | "kind"> & Partial<WorldInstance>): WorldInstance {
  return {
    quantity: 1,
    kind: "owned",
    custody: "carried",
    equipped: false,
    reservedFor: null,
    exposure: "indoor",
    confirmedYear: 0,
    discovered: true,
    ...partial,
  };
}

/**
 * Adapt a PREINCARNATION save into a known world.
 * Unexcavated graves are omitted, coordinates included.
 * Opened cache ids are not turned into locations.
 * `knownStorage` is optional gear the caller already has a place for.
 */
export function adaptSave(save: PreincarnationSaveSlice, knownStorage: WorldInstance[] = []): KnownWorld {
  const year = save.flags.year;
  const instances: WorldInstance[] = [];
  const seen = new Set<string>();

  const push = (instance: WorldInstance) => {
    if (seen.has(instance.instanceId)) return;
    seen.add(instance.instanceId);
    instances.push({ ...instance, confirmedYear: instance.confirmedYear || year });
  };

  for (const weapon of save.inventory) {
    const equipped = weapon.id === save.equippedId;
    const place = equipped ? placeById("in-hand") : placeById("pack");
    push(
      owned({
        instanceId: `weapon:${weapon.id}`,
        catalogId: "short-iron",
        name: weapon.name,
        quantity: 1,
        kind: "owned",
        custody: equipped ? "equipped" : "carried",
        equipped,
        location: {
          placeId: place.placeId,
          label: place.label,
          container: place.container,
          accessible: true,
        },
        exposure: "indoor",
        persists: equipped && /short iron/i.test(weapon.name),
        components: weapon.affixes?.map((affix) => affix.id),
        notes: weapon.flavor,
      }),
    );
  }

  for (const relicId of save.flags.relics) {
    const catalogId = RELIC_CATALOG[relicId] ?? relicId;
    if (relicId === "sword" && save.inventory.some((weapon) => /short iron/i.test(weapon.name))) {
      continue;
    }
    const catalog = CATALOG_BY_ID[catalogId];
    const equipped = save.flags.ySlot === relicId;
    const place = equipped ? placeById("in-hand") : placeById("pack");
    push(
      owned({
        instanceId: `relic:${relicId}`,
        catalogId,
        name: catalog?.canonicalName ?? relicId,
        custody: equipped ? "equipped" : "carried",
        equipped,
        bonded: relicId === "lantern" && save.character?.bondId === "maeve",
        magic: relicId === "hammer" || relicId === "cape" || relicId === "cane" || relicId === "mirror",
        location: {
          placeId: place.placeId,
          label: place.label,
          container: place.container,
          accessible: true,
        },
      }),
    );
  }

  if (save.flags.arrows > 0) {
    const place = placeById("quiver");
    push(
      owned({
        instanceId: "stack:arrows",
        catalogId: "arrows",
        name: "Arrows",
        quantity: save.flags.arrows,
        location: { placeId: place.placeId, label: place.label, container: place.container, accessible: true },
      }),
    );
  }
  if (save.flags.bombs > 0) {
    const place = placeById("pack");
    push(
      owned({
        instanceId: "stack:bombs",
        catalogId: "bombs",
        name: "Powder kegs",
        quantity: save.flags.bombs,
        location: { placeId: place.placeId, label: place.label, container: place.container, accessible: true },
      }),
    );
  }
  if (save.flags.keys > 0) {
    const place = placeById("pack");
    push(
      owned({
        instanceId: "stack:keys",
        catalogId: "keys",
        name: "Keys",
        quantity: save.flags.keys,
        location: { placeId: place.placeId, label: place.label, container: place.container, accessible: true },
      }),
    );
  }

  const bottleCatalog: Record<string, string> = {
    empty: "bottle-empty",
    syrup: "syrup",
    creemee: "creemee",
    deluxe: "deluxe",
  };
  const bottleCounts = new Map<string, number>();
  for (const bottle of save.flags.bottles) {
    bottleCounts.set(bottle, (bottleCounts.get(bottle) ?? 0) + 1);
  }
  for (const [bottle, quantity] of bottleCounts) {
    const catalogId = bottleCatalog[bottle] ?? "bottle-empty";
    const catalog = CATALOG_BY_ID[catalogId];
    const place = placeById("pack");
    push(
      owned({
        instanceId: `bottle:${bottle}`,
        catalogId,
        name: catalog?.canonicalName ?? bottle,
        quantity,
        location: { placeId: place.placeId, label: place.label, container: place.container, accessible: true },
      }),
    );
  }

  for (const grave of save.flags.graves ?? []) {
    if (!grave.excavated) continue;
    const place = placeById("green-grave");
    for (const weapon of grave.weapons) {
      push(
        owned({
          instanceId: `grave:${grave.id}:${weapon.id}`,
          catalogId: "mill-blade",
          name: weapon.name,
          magic: weapon.magic,
          custody: "stored",
          location: {
            placeId: place.placeId,
            label: `Excavated grave ${grave.id}`,
            container: "excavated grave",
            accessible: true,
          },
          exposure: "open",
        }),
      );
    }
  }

  for (const extra of knownStorage) {
    if (extra.discovered === false) continue;
    push(extra);
  }

  return {
    revision: save.version ?? 1,
    year,
    yearsAway: save.flags.returnedFromDeath ? 14 : 0,
    locale: "en",
    cycle: save.cycle,
    bearer: save.character?.name ?? "Ellis Perch",
    instances,
    undiscovered: [],
  };
}
