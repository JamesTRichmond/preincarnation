import { RELIC_BY_ID } from "./items.ts";
import { evaluatePolicy } from "./keep/evaluator.ts";
import { rulesFromPreset } from "./keep/presets.ts";
import type { CategoryRule, Stack } from "./keep/types.ts";
import type { SaveData } from "./types.ts";

/**
 * Reads the pack after a death and says why each unit is still held or listed
 * on the mound. It does not move stock. Gear still falls where you fell.
 * A relic stays because this floor says so, not because a later scene might want it.
 */
export function deathKeepClause(save: SaveData): string {
  const report = explainDeathPack(save);
  const locked = report.locked.length ? `${report.locked.join(", ")} ${report.locked.length === 1 ? "is" : "are"} locked.` : "";
  const floor = report.floor.length ? ` The relic floor holds ${report.floor.join(", ")}.` : "";
  const surplus = report.surplus.length
    ? ` Surplus on the mound, not discarded: ${report.surplus.join(", ")}.`
    : " Nothing was discarded.";
  return (locked + floor + surplus).trim();
}

export function explainDeathPack(save: SaveData): {
  locked: string[];
  floor: string[];
  surplus: string[];
  autoDispose: false;
  quantity: number;
} {
  const bond = save.character.bondId === "maeve" ? "lantern" : null;
  const grave = save.flags.graves.at(-1);
  const eraId = "year-" + (grave?.year ?? save.flags.year);
  const stacks: Stack[] = [];

  for (const weapon of save.inventory) {
    stacks.push(
      gearStack("weapon:" + weapon.id, weapon.id, weapon.name, ["weapon", weapon.kind], 1, eraId, save.cycle, 
        weapon.id === "starter-iron"
          ? { locked: true, reason: "The blade you wake with.", author: "player" as const }
          : null,
      ),
    );
  }

  for (const weapon of grave?.weapons ?? []) {
    stacks.push(gearStack("grave-weapon:" + weapon.id, weapon.id, weapon.name, ["weapon", weapon.kind], 1, eraId, save.cycle, null));
  }

  for (const id of save.flags.relics) {
    const name = RELIC_BY_ID[id]?.name ?? id;
    const gift = bond === id;
    stacks.push({
      id: "relic:" + id,
      itemId: id,
      name,
      category: gift ? "gift" : "gear",
      tags: gift ? ["named-gift", "relic"] : ["relic"],
      quantity: 1,
      eraId,
      acquiredAt: save.cycle,
      unique: true,
      gift: gift ? { from: "Maeve", name } : null,
      protectedMeta:
        gift || id === "sword"
          ? {
              locked: true,
              reason: gift ? "Bonded gift. The record names it. The Vein does not." : "You wake with it.",
              author: gift ? "gift-record" : "player",
            }
          : null,
    });
  }

  if ((grave?.arrows ?? 0) > 0) {
    stacks.push(gearStack("grave:arrows", "arrows", "Arrows", ["ammo"], grave!.arrows, eraId, save.cycle, null));
  }
  if ((grave?.bombs ?? 0) > 0) {
    stacks.push(gearStack("grave:bombs", "bombs", "Powder kegs", ["ammo"], grave!.bombs, eraId, save.cycle, null));
  }

  const rules: CategoryRule[] = [
    ...rulesFromPreset("named-gifts"),
    {
      id: "relic-floor",
      name: "Tools of the same hands",
      enabled: true,
      rank: 20,
      selector: { tag: "relic" },
      keep: "all",
      grouping: "pool",
    },
  ];

  const evaluation = evaluatePolicy({
    eraId,
    eraIndex: Math.max(0, save.cycle),
    stacks,
    instanceDirectives: [],
    categoryRules: rules,
    projects: [],
    offerSurplusForSale: true,
    requestedAutoDispose: false,
  });

  return {
    locked: evaluation.dispositions.filter((row) => row.locked).map((row) => (row.itemId === "sword" ? "Short iron, the sword" : row.name)),
    floor: evaluation.dispositions.filter((row) => row.protected > 0 && !row.locked).map((row) => row.name),
    surplus: evaluation.dispositions.filter((row) => row.surplus > 0).map((row) => row.name),
    autoDispose: evaluation.surplusReview.autoDispose,
    quantity: evaluation.totals.quantity,
  };
}

function gearStack(
  id: string,
  itemId: string,
  name: string,
  tags: string[],
  quantity: number,
  eraId: string,
  acquiredAt: number,
  protectedMeta: Stack["protectedMeta"],
): Stack {
  return {
    id,
    itemId,
    name,
    category: "gear",
    tags,
    quantity,
    eraId,
    acquiredAt,
    protectedMeta,
  };
}
