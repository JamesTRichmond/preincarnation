import { relicById } from "../../support/grok-49-relics/src/catalog.ts";
import { parseRelicId, relicId } from "../../support/grok-49-relics/src/ids.ts";
import type { SaveData } from "./types.ts";

/** Maeve's Spare Key. Stays. It is not a Q-slot tool. */
export const MAEVE_SPARE_KEY = relicId(1);

export type VeinTakeReason = "duplicate" | "unknown" | "consumed";

export type VeinTake = { ok: true } | { ok: false; reason: VeinTakeReason };

/**
 * One source, one object. A second id or a source already consumed is refused.
 * Does not touch tool relics (sword, shovel, lantern, …).
 */
export function takeVeinRelic(save: SaveData, id: string): VeinTake {
  let parsed: ReturnType<typeof parseRelicId>;
  try {
    parsed = parseRelicId(id);
  } catch {
    return { ok: false, reason: "unknown" };
  }
  const record = relicById(parsed);
  const held = save.flags.veinHeld ?? [];
  const sources = save.flags.veinSources ?? [];
  if (held.some((item) => item.id === parsed)) return { ok: false, reason: "duplicate" };
  if (sources.includes(record.uniqueness.sourceId)) return { ok: false, reason: "consumed" };
  save.flags.veinHeld = [...held, { id: parsed, state: "intact" }];
  save.flags.veinSources = [...sources, record.uniqueness.sourceId];
  return { ok: true };
}

/**
 * Canvas death does not drop vein objects on the grass. The shovel cannot dig them yet,
 * and a drop with no recovery would lose an authored unique.
 * remains / returns-home / banks-in-vein stay carried.
 * drops-fractured stays carried and becomes fractured (spent stays spent).
 * lost-if-fractured leaves only when it is already fractured or spent. The source stays consumed.
 */
export function veinAfterDeath(save: SaveData): void {
  const held = save.flags.veinHeld ?? [];
  const next: SaveData["flags"]["veinHeld"] = [];
  for (const item of held) {
    let rule: string = "remains";
    try {
      rule = relicById(parseRelicId(item.id)).persistence.onDeath;
    } catch {
      next.push(item);
      continue;
    }
    if (rule === "lost-if-fractured" && (item.state === "fractured" || item.state === "spent")) continue;
    if (rule === "drops-fractured" && item.state !== "spent") {
      next.push({ id: item.id, state: "fractured" });
      continue;
    }
    next.push(item);
  }
  save.flags.veinHeld = next;
}

export function maeveKeyLine(save: SaveData): string | null {
  if (save.character.bondId !== "maeve" || save.cycle < 1) return null;
  return relicById(MAEVE_SPARE_KEY).name + " stays with you.";
}

/** Names carried vein objects other than the Maeve promise, so the key is not listed twice. */
export function veinKeptLine(save: SaveData): string | null {
  const skipKey = save.character.bondId === "maeve" && save.cycle >= 1;
  const held = (save.flags.veinHeld ?? []).filter((item) => !(skipKey && item.id === MAEVE_SPARE_KEY));
  if (!held.length) return null;
  const bits = held.map((item) => {
    let name = item.id;
    try {
      name = relicById(parseRelicId(item.id)).name;
    } catch {
      /* corrupt id: show what was saved */
    }
    if (item.state === "intact") return name;
    return name + " (" + item.state + ")";
  });
  return "The vein keeps " + bits.join(", ") + ".";
}
