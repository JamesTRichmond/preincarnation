import { DEFINITIONS, isKnownDef, legacyDefId } from "./catalog.ts";
import { InheritanceError } from "./errors.ts";
import { advanceTo, claim, createWorld, draft, ensureSite } from "./engine.ts";
import { legacyInstanceId } from "./eras.ts";
import type { ItemInstance, ItemSaveV2, MigrationReport, Placement, PlayerStorage, WorldState } from "./types.ts";
import { PLAYER_ID, SAVE_CONTRACT, SAVE_VERSION } from "./types.ts";

const KNOWN_INSTANCE_KEYS = new Set([
  "instanceId",
  "defId",
  "qty",
  "worldSource",
  "ownership",
  "storage",
  "placement",
  "condition",
  "status",
  "restoration",
  "era",
  "storyId",
  "questBinding",
  "pendingTxn",
  "extensions",
]);

export function exportSave(world: WorldState, preserved?: Record<string, unknown>): ItemSaveV2 {
  const save: ItemSaveV2 = {
    version: SAVE_VERSION,
    contract: SAVE_CONTRACT,
    world: draft(world),
  };
  if (preserved && Object.keys(preserved).length > 0) save.preserved = draft(preserved);
  return save;
}

export function loadSave(raw: unknown): { save: ItemSaveV2; report: MigrationReport } {
  const rec = asRecord(raw, "Save must be an object. An unreadable save is not opened as an empty world.");
  const version = rec.version;
  if (version === 0) return migrateV0(rec);
  if (version === 1) return migrateV1(rec);
  if (version === 2) return acceptV2(rec);
  throw new InheritanceError(
    "unsupported-save",
    `Save version ${String(version)} is not a known item contract (0, 1, or 2). It was not overwritten.`,
  );
}

function migrateV0(rec: Record<string, unknown>): { save: ItemSaveV2; report: MigrationReport } {
  if (!Array.isArray(rec.inventory)) {
    throw new InheritanceError(
      "invalid-save",
      "Version 0 save has no inventory array. Refusing to replace it with an empty collection.",
    );
  }
  const year = requireYear(rec.year, "version 0");
  let world = advanceTo(createWorld(0), year);
  const notes = [
    "Version 0 rows became instances. None were dropped.",
    "No deaths were invented. The open life still begins at year 0.",
    "Stackable commons stay one stack. They are not split into heirlooms.",
  ];
  rec.inventory.forEach((row, index) => {
    const item = asRecord(row, `Version 0 inventory row ${index} is not an object.`);
    if (typeof item.id !== "string" || item.id.length === 0) {
      throw new InheritanceError("invalid-save", `Version 0 row ${index} has no id and was not skipped.`);
    }
    const qty = item.qty === undefined ? 1 : item.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) {
      throw new InheritanceError("invalid-save", `Version 0 row ${item.id} has a bad quantity.`);
    }
    const defId = legacyDefId(item.id);
    const known = isKnownDef(defId);
    const canonical = known ? DEFINITIONS[defId]?.canonicalSourceKey : undefined;
    const policy = known ? DEFINITIONS[defId]!.renewalPolicy : qty > 1 ? "renewable-common" : "heirloom-lineage";
    const useCanonical = Boolean(canonical) && policy !== "renewable-common";
    const sourceKey = useCanonical ? canonical! : `legacy:v0:${item.id}#${index}`;
    const extensions = extras(item, ["id", "qty"]);
    if (typeof item.name === "string") extensions.legacyName = item.name;
    try {
      world = claim(world, {
        defId,
        qty,
        sourceKey,
        sourceKind: "legacy-import",
        year,
        instanceId: legacyInstanceId(0, `${item.id}#${index}`),
        imported: true,
        extensions,
        storyId: null,
      });
    } catch (error) {
      if (error instanceof InheritanceError && error.code === "source-consumed") {
        throw new InheritanceError(
          "invalid-save",
          `Version 0 holds two rows for unique source ${sourceKey}. The second row was not dropped; the save was refused.`,
        );
      }
      throw error;
    }
  });
  return finish(0, world, rec, ["version", "year", "inventory"], notes);
}

function migrateV1(rec: Record<string, unknown>): { save: ItemSaveV2; report: MigrationReport } {
  if (!Array.isArray(rec.items)) {
    throw new InheritanceError(
      "invalid-save",
      "Version 1 save has no items array. Refusing to replace it with an empty collection.",
    );
  }
  const year = requireYear(rec.year, "version 1");
  let world = advanceTo(createWorld(0), year);
  const seen = new Set<string>();
  const notes = [
    "Version 1 instance ids were kept when present.",
    "No deaths were invented.",
    "Owners recorded on the row were kept.",
  ];
  rec.items.forEach((row, index) => {
    const item = asRecord(row, `Version 1 item ${index} is not an object.`);
    if (typeof item.defId !== "string" || item.defId.length === 0) {
      throw new InheritanceError("invalid-save", `Version 1 item ${index} has no defId and was not skipped.`);
    }
    const qty = item.qty === undefined ? 1 : item.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) {
      throw new InheritanceError("invalid-save", `Version 1 item ${item.defId} has a bad quantity.`);
    }
    const minted = legacyInstanceId(1, `${item.defId}#${index}`);
    const instanceId = typeof item.instanceId === "string" && item.instanceId.trim() ? item.instanceId : minted;
    if (seen.has(instanceId)) {
      throw new InheritanceError(
        "invalid-save",
        `Version 1 repeats instance id ${instanceId}. Refusing to merge two rows into one.`,
      );
    }
    seen.add(instanceId);
    const ownerId = typeof item.owner === "string" && item.owner.length > 0 ? item.owner : PLAYER_ID;
    const player = ownerId === "player" || ownerId === PLAYER_ID;
    const slot = item.slot === "stored" || item.slot === "displayed" || item.slot === "carried" ? item.slot : "carried";
    let storage: PlayerStorage = { location: "none", containerId: null };
    let placement: Placement = { kind: "none", siteId: null, siteEra: null };
    if (player) {
      if (slot === "displayed") {
        const siteId = typeof item.siteId === "string" && item.siteId ? item.siteId : "site:legacy-display";
        world = ensureSite(world, { siteId, name: siteId, lossPolicy: "recover-to-storage" });
        storage = { location: "displayed", containerId: `display:${siteId}` };
        placement = { kind: "displayed", siteId, siteEra: 0 };
      } else if (slot === "stored") {
        storage = { location: "stored", containerId: "chest:legacy" };
      } else {
        storage = { location: "carried", containerId: "pack" };
      }
    }
    const known = isKnownDef(item.defId);
    const canonical = known ? DEFINITIONS[item.defId]?.canonicalSourceKey : undefined;
    const policy = known ? DEFINITIONS[item.defId]!.renewalPolicy : "heirloom-lineage";
    const sourceKey =
      canonical && policy !== "renewable-common" ? canonical : `legacy:v1:${instanceId}`;
    const extensions = extras(item, ["instanceId", "defId", "qty", "slot", "owner", "siteId"]);
    if (typeof item.name === "string") extensions.legacyName = item.name;
    const resolvedOwner = player ? PLAYER_ID : ownerId;
    world = claim(world, {
      defId: item.defId,
      qty,
      sourceKey,
      sourceKind: "legacy-import",
      year,
      instanceId,
      imported: true,
      extensions,
      owner: player
        ? { ownerKind: "player", ownerId: PLAYER_ID, title: "personal", sinceYear: year }
        : {
            ownerKind: resolvedOwner.startsWith("inst:") ? "institution" : "npc",
            ownerId: resolvedOwner,
            title: "stewardship",
            sinceYear: year,
          },
      storage,
      placement,
    });
  });
  return finish(1, world, rec, ["version", "year", "items"], notes);
}

function acceptV2(rec: Record<string, unknown>): { save: ItemSaveV2; report: MigrationReport } {
  if (rec.contract !== SAVE_CONTRACT) {
    throw new InheritanceError(
      "unsupported-save",
      "Version 2 save uses a different contract. It was left untouched.",
    );
  }
  const world = asRecord(rec.world, "Version 2 save has no world.");
  if (!world.instances || typeof world.instances !== "object" || Array.isArray(world.instances)) {
    throw new InheritanceError("invalid-save", "Version 2 world has no instance map.");
  }
  if (!Array.isArray(world.consumedSources)) {
    throw new InheritanceError("invalid-save", "Version 2 world has no consumed-source ledger.");
  }
  if (typeof world.calendarYear !== "number" || !world.life || typeof world.life !== "object") {
    throw new InheritanceError("invalid-save", "Version 2 world has no calendar or life.");
  }
  const instances = world.instances as Record<string, ItemInstance>;
  for (const [id, inst] of Object.entries(instances)) {
    if (!inst || typeof inst !== "object" || inst.instanceId !== id || !inst.defId || !inst.worldSource || !inst.ownership) {
      throw new InheritanceError("invalid-save", `Version 2 instance ${id} is incomplete and was not dropped.`);
    }
    const extensions = { ...(inst.extensions ?? {}) };
    for (const key of Object.keys(inst)) {
      if (!KNOWN_INSTANCE_KEYS.has(key)) {
        extensions[key] = (inst as unknown as Record<string, unknown>)[key];
        delete (inst as unknown as Record<string, unknown>)[key];
      }
    }
    if (Object.keys(extensions).length > 0) inst.extensions = extensions;
  }
  const preserved = preservedKeys(rec, ["version", "contract", "world", "preserved"]);
  const save: ItemSaveV2 = {
    version: 2,
    contract: SAVE_CONTRACT,
    world: draft(world) as unknown as WorldState,
  };
  if (preserved) save.preserved = preserved;
  return {
    save,
    report: {
      fromVersion: 2,
      toVersion: 2,
      instanceIds: Object.keys(instances).sort(),
      notes: ["Version 2 save loaded without rewriting instance ids."],
      preservedKeys: preserved ? Object.keys(preserved).sort() : [],
    },
  };
}

function finish(
  fromVersion: 0 | 1,
  world: WorldState,
  rec: Record<string, unknown>,
  known: string[],
  notes: string[],
): { save: ItemSaveV2; report: MigrationReport } {
  const preserved = preservedKeys(rec, known);
  const save = exportSave(world, preserved);
  return {
    save,
    report: {
      fromVersion,
      toVersion: 2,
      instanceIds: Object.keys(world.instances).sort(),
      notes,
      preservedKeys: preserved ? Object.keys(preserved).sort() : [],
    },
  };
}

function preservedKeys(rec: Record<string, unknown>, known: string[]): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  const nested = rec.preserved;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    Object.assign(out, nested as Record<string, unknown>);
  }
  for (const [key, value] of Object.entries(rec)) {
    if (!known.includes(key) && key !== "preserved") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function extras(row: Record<string, unknown>, omit: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!omit.includes(key) && key !== "name") out[key] = value;
  }
  return out;
}

function requireYear(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InheritanceError("invalid-save", `${label} save is missing a calendar year. It was not guessed.`);
  }
  return value;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InheritanceError("invalid-save", message);
  }
  return value as Record<string, unknown>;
}
