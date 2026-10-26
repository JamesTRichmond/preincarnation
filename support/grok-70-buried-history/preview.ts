import { CATALOG, CATALOG_BY_ID } from "./catalog/index.ts";
import { SCENES } from "./scenes.ts";
import { FICTION_NOTE, type DiscoveryScene, type HistoryObject } from "./types.ts";

export interface PreviewSheet {
  id: string;
  kind: "object" | "scene";
  title: string;
  body: string;
}

export function renderObjectPreview(obj: HistoryObject): PreviewSheet {
  const body = [
    FICTION_NOTE,
    `${obj.id} · ${obj.siteKind} · ${obj.binding}`,
    obj.site,
    `Discovery by ${obj.discovery.finder}, authored by ${obj.discovery.author}. ${obj.discovery.circumstance}`,
    obj.discovery.authored,
    `Physical: ${obj.physical.material}; ${obj.physical.dimensions}; ${obj.physical.mass}; ${obj.physical.condition}; ${obj.physical.marks}.`,
    `Evidence ${obj.evidence.evidenceId}, read by ${obj.evidence.howRead}: ${obj.evidence.readable}`,
    `Use (${obj.interaction.kind}): ${obj.interaction.verb}. ${obj.interaction.outcome}`,
    obj.restoration
      ? `Restore: ${obj.restoration.method} ${obj.restoration.result}`
      : "Restore: not needed.",
    `${obj.response.kind === "institution" ? "Institution" : "Character"} — ${obj.response.who}: ${obj.response.text}`,
    `Holds: ${obj.persistence.holds}`,
    `Shift: ${obj.persistence.shift}`,
    ...obj.persistence.eras.map((era) => `${era}: ${obj.persistence.presentation[era]}`),
  ].join("\n");
  return { id: obj.id, kind: "object", title: obj.name, body };
}

export function renderScenePreview(scene: DiscoveryScene): PreviewSheet {
  const lines = scene.objectIds.map((id) => {
    const obj = CATALOG_BY_ID.get(id);
    return obj ? `${obj.id} ${obj.name} — ${obj.interaction.verb}` : `${id} MISSING`;
  });
  const body = [FICTION_NOTE, scene.place, scene.prose, ...lines].join("\n");
  return { id: scene.id, kind: "scene", title: scene.title, body };
}

export function allPreviews(): PreviewSheet[] {
  return [
    ...SCENES.map((scene) => renderScenePreview(scene)),
    ...CATALOG.map((obj) => renderObjectPreview(obj)),
  ];
}
