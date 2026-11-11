import { CATALOG } from "./catalog/index.ts";
import { overlapReport } from "./overlap.ts";
import { FEATURED_IDS, SCENES } from "./scenes.ts";
import { ERAS, FICTION_NOTE, type EraId, type HistoryObject } from "./types.ts";

export interface Check {
  id: string;
  ok: boolean;
  detail: string;
}

function nonEmpty(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function validatePack(catalog: readonly HistoryObject[] = CATALOG): Check[] {
  const checks: Check[] = [];
  const push = (id: string, ok: boolean, detail: string) => checks.push({ id, ok, detail });

  push("count", catalog.length === 80, `catalog holds ${catalog.length} objects; expected 80.`);

  const expectedIds = Array.from({ length: 80 }, (_, i) => `loot.expansion.history.${String(i + 1).padStart(3, "0")}`);
  const ids = catalog.map((obj) => obj.id);
  push("ids", expectedIds.every((id, index) => ids[index] === id), "ids must be loot.expansion.history.001–080 in order.");

  const evidenceIds = catalog.map((obj) => obj.evidence.evidenceId);
  const expectedEv = expectedIds.map((id) => id.replace("loot.", "ev."));
  push(
    "evidence-ids",
    expectedEv.every((id, index) => evidenceIds[index] === id),
    "evidence ids must be ev.expansion.history.001–080.",
  );

  const required: { id: string; ok: boolean }[] = [];
  for (const obj of catalog) {
    const fields = [
      obj.name,
      obj.site,
      obj.discovery.author,
      obj.discovery.finder,
      obj.discovery.circumstance,
      obj.discovery.authored,
      obj.physical.material,
      obj.physical.dimensions,
      obj.physical.mass,
      obj.physical.condition,
      obj.physical.marks,
      obj.evidence.howRead,
      obj.evidence.readable,
      obj.interaction.verb,
      obj.interaction.outcomeKey,
      obj.interaction.outcome,
      obj.response.who,
      obj.response.text,
      obj.persistence.holds,
      obj.persistence.shift,
    ];
    const presentations = ERAS.every((era) => nonEmpty(obj.persistence.presentation[era]));
    const erasOk =
      obj.persistence.eras.length >= 2 &&
      obj.persistence.eras.every((era) => (ERAS as readonly EraId[]).includes(era));
    const restoreOk = obj.interaction.needsRestore ? obj.restoration?.applies === true : true;
    const kindOk = obj.interaction.kind === "practical" || obj.interaction.kind === "supernatural";
    const authoredOk = obj.discovery.authored.trim().length >= 40;
    required.push({
      id: obj.id,
      ok: fields.every((value) => nonEmpty(value)) && presentations && erasOk && restoreOk && kindOk && authoredOk,
    });
  }
  const bad = required.filter((row) => !row.ok).map((row) => row.id);
  push("fields", bad.length === 0, bad.length ? `incomplete objects: ${bad.join(", ")}` : "every object has discovery, body, evidence, interaction, response, and era persistence.");

  const overlap = overlapReport(catalog);
  push("dedupe", overlap.unresolved.length === 0, overlap.unresolved.length ? `overlaps: ${overlap.unresolved.map((hit) => `${hit.left}=${hit.right}`).join("; ")}` : overlap.note);

  push("scenes", SCENES.length === 12, `scenes: ${SCENES.length}.`);
  const featured = [...FEATURED_IDS];
  push("featured-count", featured.length === 20, `representative objects in scenes: ${featured.length}.`);
  push("featured-unique", new Set(featured).size === featured.length, "a representative object must sit in only one scene.");
  const known = new Set(ids);
  const missing = featured.filter((id) => !known.has(id));
  push("featured-real", missing.length === 0, missing.length ? `unknown scene objects: ${missing.join(", ")}` : "every scene object is in the catalog.");

  const kinds = new Set(catalog.map((obj) => obj.siteKind));
  push(
    "sites",
    ["workshop", "household", "vanished-crossing", "former-orchard", "quarry"].every((kind) => kinds.has(kind as HistoryObject["siteKind"])),
    "all five site kinds are present.",
  );

  push("fiction-note", FICTION_NOTE.includes("not county history"), "fiction boundary is explicit.");

  const bothBindings = catalog.some((obj) => obj.binding === "excavate") && catalog.some((obj) => obj.binding === "recover");
  push("bindings", bothBindings, "excavation and recovery are both bound.");

  const bothKinds =
    catalog.some((obj) => obj.interaction.kind === "practical") &&
    catalog.some((obj) => obj.interaction.kind === "supernatural");
  push("interaction-kinds", bothKinds, "practical and supernatural uses both exist, one per object.");

  return checks;
}

export function packIsValid(catalog?: readonly HistoryObject[]): boolean {
  return validatePack(catalog).every((check) => check.ok);
}
