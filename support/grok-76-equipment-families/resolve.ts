import { FAMILY_BY_ID, ITEM_BY_ID, itemById } from "./catalog.ts";
import type {
  BodyId,
  Discipline,
  EquipSlot,
  FamilyDef,
  Instance,
  ItemDef,
  Loadout,
  ModPhase,
  Rejected,
  Resolution,
  ResolvedMod,
  Stat,
  Stats,
} from "./types.ts";
import {
  BODY_LABEL,
  DISCIPLINES,
  MOD_MODES,
  MOD_PHASES,
  SLOT_LABEL,
  baseStats,
} from "./types.ts";

const SLOT_RANK: Record<string, string> = { hand: "0", y: "1", worn: "2", carried: "3", used: "4" };

export type StepResult = {
  ok: boolean;
  loadout: Loadout;
  feedback: string[];
};

function clone(loadout: Loadout): Loadout {
  return {
    version: 1,
    body: loadout.body,
    instances: loadout.instances.map((instance) => ({ ...instance })),
  };
}

export function emptyLoadout(body: BodyId = "wanderer"): Loadout {
  return { version: 1, body, instances: [] };
}

type Classed = "count" | "own" | "reject";

function classify(def: ItemDef, instance: Instance, body: BodyId): { kind: Classed; reason?: string } {
  if (instance.presence === "equipped") {
    if (def.slot === "pack" || def.countsWhen !== "equipped") {
      return { kind: "reject", reason: `${def.name} is a pack piece. It cannot take ${instance.slot ?? "a slot"}.` };
    }
    if (instance.slot !== def.slot) {
      return {
        kind: "reject",
        reason: `${def.name} belongs in ${def.slot === "y" ? "Y" : SLOT_LABEL[def.slot]}. ${instance.slot ? SLOT_LABEL[instance.slot] : "That"} is the wrong slot.`,
      };
    }
    if (!def.bodies.includes(body)) {
      return { kind: "reject", reason: `${BODY_LABEL[body]} cannot wear ${def.name}.` };
    }
    return { kind: "count" };
  }
  if (instance.presence === "used") {
    if (def.countsWhen !== "used" || def.slot !== "pack") {
      return { kind: "reject", reason: `${def.name} is not spent that way.` };
    }
    if (!def.bodies.includes(body)) {
      return { kind: "reject", reason: `${BODY_LABEL[body]} cannot use ${def.name}.` };
    }
    return { kind: "count" };
  }
  if (instance.presence === "carried") {
    if (def.countsWhen === "carried") return { kind: "count" };
    return { kind: "own" };
  }
  return { kind: "reject", reason: `${def.name} has no presence.` };
}

function sortId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function applyModifiers(base: Stats, mods: ResolvedMod[]): Stats {
  const stats = { ...base };
  for (const phase of MOD_PHASES) {
    const group = mods.filter((mod) => mod.phase === phase).sort((a, b) => {
      const source = sortId(a.source, b.source);
      return source !== 0 ? source : sortId(a.stat, b.stat);
    });
    for (const mode of MOD_MODES) {
      for (const mod of group) {
        if (mod.mode !== mode) continue;
        const stat = mod.stat;
        if (mode === "add") stats[stat] += mod.value;
        else if (mode === "mul") stats[stat] *= mod.value;
        else if (mode === "capMax") stats[stat] = Math.min(stats[stat], mod.value);
        else stats[stat] = Math.max(stats[stat], mod.value);
      }
    }
  }
  return stats;
}

function pieceSource(def: ItemDef, instance: Instance): string {
  const rank = instance.presence === "equipped" && instance.slot ? SLOT_RANK[instance.slot] : SLOT_RANK[instance.presence];
  return `piece/${rank}/${def.id}`;
}

function pushMods(target: ResolvedMod[], drafts: ItemDef["mods"], phase: ModPhase, source: string): void {
  for (const draft of drafts) target.push({ ...draft, phase, source });
}

export function resolve(loadout: Loadout): Resolution {
  const rejected: Rejected[] = [];
  const duplicates: string[] = [];
  const recognized: Instance[] = [];
  const heldIds: string[] = [];
  const grouped = new Map<string, Instance[]>();
  for (const instance of loadout.instances) {
    const list = grouped.get(instance.defId) ?? [];
    list.push(instance);
    grouped.set(instance.defId, list);
  }

  for (const [defId, instances] of [...grouped.entries()].sort((a, b) => sortId(a[0], b[0]))) {
    const def = ITEM_BY_ID.get(defId);
    const ordered = [...instances].sort((a, b) => sortId(a.instanceId, b.instanceId));
    if (!def) {
      for (const instance of ordered) {
        rejected.push({ instanceId: instance.instanceId, defId, reason: "Unknown piece." });
      }
      continue;
    }
    const counts: Instance[] = [];
    const owns: Instance[] = [];
    for (const instance of ordered) {
      const result = classify(def, instance, loadout.body);
      if (result.kind === "count") counts.push(instance);
      else if (result.kind === "own") owns.push(instance);
      else rejected.push({ instanceId: instance.instanceId, defId, reason: result.reason ?? "Rejected." });
    }
    if (counts.length) {
      recognized.push(counts[0]);
      for (const extra of counts.slice(1)) duplicates.push(extra.instanceId);
      for (const extra of owns) duplicates.push(extra.instanceId);
    } else if (owns.length) {
      heldIds.push(def.id);
      for (const extra of owns.slice(1)) duplicates.push(extra.instanceId);
    }
  }

  const slotTaken = new Map<EquipSlot, Instance>();
  const counting: Instance[] = [];
  for (const instance of [...recognized].sort((a, b) => sortId(a.instanceId, b.instanceId))) {
    if (instance.presence === "equipped" && instance.slot) {
      const prior = slotTaken.get(instance.slot);
      if (prior) {
        const def = itemById(instance.defId);
        rejected.push({
          instanceId: instance.instanceId,
          defId: instance.defId,
          reason: `${SLOT_LABEL[instance.slot]} is already ${itemById(prior.defId).name}. ${def.name} does not fit.`,
        });
        continue;
      }
      slotTaken.set(instance.slot, instance);
    }
    counting.push(instance);
  }

  const recognizedIds = counting.map((instance) => instance.defId);
  const recognizedSet = new Set(recognizedIds);
  const modifiers: ResolvedMod[] = [];
  const families: Resolution["families"] = [];
  const pairs: string[] = [];
  const counts: string[] = [];
  const sidegrades: string[] = [];
  const leans = Object.fromEntries(DISCIPLINES.map((discipline) => [discipline, 0])) as Record<Discipline, number>;

  for (const instance of counting) {
    const def = itemById(instance.defId);
    leans[def.discipline] += 1;
    pushMods(modifiers, def.mods, "piece", pieceSource(def, instance));
  }

  for (const family of FAMILY_BY_ID.values()) {
    const pieceIds = family.pieceIds.filter((id) => recognizedSet.has(id));
    if (!pieceIds.length) continue;
    families.push({ id: family.id, name: family.name, count: pieceIds.length, pieceIds });
    if (family.pair.pieceIds.every((id) => recognizedSet.has(id))) {
      pairs.push(family.pair.name);
      pushMods(modifiers, family.pair.mods, "pair", `pair/${family.pair.id}`);
    }
    for (const bonus of family.counts) {
      if (pieceIds.length >= bonus.at) {
        counts.push(bonus.name);
        pushMods(modifiers, bonus.mods, "count", `count/${family.id}/${bonus.at}`);
      }
    }
    if (pieceIds.length >= family.pieceIds.length) {
      sidegrades.push(family.sidegrade.name);
      pushMods(modifiers, family.sidegrade.mods, "sidegrade", `side/${family.id}`);
    }
  }

  families.sort((a, b) => sortId(a.id, b.id));
  const stats = applyModifiers(baseStats(loadout.body), modifiers);
  const lines = describe(loadout.body, families, pairs, counts, sidegrades, rejected, duplicates, heldIds);
  return {
    body: loadout.body,
    families,
    pairs,
    counts,
    sidegrades,
    recognizedIds,
    heldIds,
    duplicates,
    rejected,
    modifiers,
    stats,
    leans,
    lines,
  };
}

function describe(
  body: BodyId,
  families: Resolution["families"],
  pairs: string[],
  counts: string[],
  sidegrades: string[],
  rejected: Rejected[],
  duplicates: string[],
  heldIds: string[],
): string[] {
  const lines = [`${BODY_LABEL[body]}. Three slots: Hand, Y, Worn.`];
  if (!families.length && !rejected.length && !heldIds.length) {
    lines.push("Nothing on the body is recognized yet.");
    return lines;
  }
  for (const family of families) {
    const full = family.count >= 5 ? " Full bargain." : "";
    lines.push(`${family.name} ${family.count}/5.${full}`);
  }
  for (const name of pairs) lines.push(`Partial: ${name}.`);
  for (const name of counts) lines.push(`Partial: ${name}.`);
  for (const name of sidegrades) {
    const family = [...FAMILY_BY_ID.values()].find((entry) => entry.sidegrade.name === name);
    lines.push(family ? `${name}. ${family.sidegrade.gives} ${family.sidegrade.costs}` : name);
  }
  for (const id of heldIds) {
    const def = ITEM_BY_ID.get(id);
    if (!def || def.slot === "pack") continue;
    lines.push(`${def.name} is in the pack and does not count until it is in ${def.slot === "y" ? "Y" : SLOT_LABEL[def.slot]}.`);
  }
  for (const id of duplicates) lines.push(`Duplicate ${id} does not count twice.`);
  for (const fail of rejected) lines.push(fail.reason);
  return lines;
}

const DISPLAY_STATS: Stat[] = [
  "maxHp",
  "atk",
  "haste",
  "guard",
  "light",
  "oilDrain",
  "warmth",
  "wetOut",
  "soakVuln",
  "beastOut",
  "burst",
  "opening",
  "sustain",
  "reflect",
  "dmgCap",
  "frostOut",
  "burnVuln",
  "chipOut",
  "hearingOut",
  "maxMp",
  "mpRegen",
];

function formatStat(stat: Stat, value: number): string {
  if (stat === "dmgCap" && value >= 900) return "none";
  if (stat === "guard" || stat === "soakVuln" || stat === "haste" || stat === "burst") return value.toFixed(2);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function compareResolutions(before: Resolution, after: Resolution): string[] {
  const lines: string[] = [];
  if (before.body !== after.body) lines.push(`Body ${BODY_LABEL[before.body]} → ${BODY_LABEL[after.body]}.`);
  const ids = new Set<string>([...before.families.map((family) => family.id), ...after.families.map((family) => family.id)]);
  for (const id of [...ids].sort(sortId)) {
    const left = before.families.find((family) => family.id === id)?.count ?? 0;
    const right = after.families.find((family) => family.id === id)?.count ?? 0;
    if (left !== right) lines.push(`${FAMILY_BY_ID.get(id)?.name ?? id} ${left} → ${right}.`);
  }
  for (const name of before.sidegrades) {
    if (!after.sidegrades.includes(name)) lines.push(`${name} ends. The tax lifts with the bargain.`);
  }
  for (const name of after.sidegrades) {
    if (!before.sidegrades.includes(name)) {
      const family = [...FAMILY_BY_ID.values()].find((entry) => entry.sidegrade.name === name);
      lines.push(family ? `${name} begins. ${family.sidegrade.gives} ${family.sidegrade.costs}` : `${name} begins.`);
    }
  }
  for (const name of before.pairs) if (!after.pairs.includes(name)) lines.push(`${name} ends.`);
  for (const name of after.pairs) if (!before.pairs.includes(name)) lines.push(`${name} begins.`);
  for (const name of before.counts) if (!after.counts.includes(name)) lines.push(`${name} ends.`);
  for (const name of after.counts) if (!before.counts.includes(name)) lines.push(`${name} begins.`);
  for (const stat of DISPLAY_STATS) {
    const left = before.stats[stat];
    const right = after.stats[stat];
    if (Math.abs(left - right) > 1e-6) lines.push(`${stat} ${formatStat(stat, left)} → ${formatStat(stat, right)}.`);
  }
  if (!lines.length) lines.push("No change in what the body recognizes.");
  return lines;
}

function nextInstanceId(loadout: Loadout, defId: string): string {
  const taken = new Set(loadout.instances.map((instance) => instance.instanceId));
  let n = 1;
  while (taken.has(`${defId}#${n}`)) n += 1;
  return `${defId}#${n}`;
}

export function grantPiece(loadout: Loadout, defId: string): StepResult {
  const def = ITEM_BY_ID.get(defId);
  if (!def) return { ok: false, loadout, feedback: ["Unknown piece."] };
  const next = clone(loadout);
  const instanceId = nextInstanceId(next, defId);
  const feedback: string[] = [];
  if (def.countsWhen === "equipped") {
    const slot = def.slot as EquipSlot;
    const filled = next.instances.some((instance) => instance.presence === "equipped" && instance.slot === slot);
    if (!def.bodies.includes(next.body)) {
      next.instances.push({ instanceId, defId, presence: "carried" });
      feedback.push(`${BODY_LABEL[next.body]} cannot wear ${def.name}. It stays in the pack and does not count.`);
    } else if (filled) {
      next.instances.push({ instanceId, defId, presence: "carried" });
      feedback.push(`${SLOT_LABEL[slot]} is full. ${def.name} stays in the pack and does not count.`);
    } else {
      next.instances.push({ instanceId, defId, presence: "equipped", slot });
      feedback.push(`${def.name} takes ${SLOT_LABEL[slot]}.`);
    }
  } else if (def.countsWhen === "used") {
    if (!def.bodies.includes(next.body)) {
      next.instances.push({ instanceId, defId, presence: "carried" });
      feedback.push(`${BODY_LABEL[next.body]} cannot use ${def.name}. It stays in the pack and does not count.`);
    } else {
      next.instances.push({ instanceId, defId, presence: "used" });
      feedback.push(`${def.name} is spent. It counts without a slot.`);
    }
  } else {
    next.instances.push({ instanceId, defId, presence: "carried" });
    feedback.push(`${def.name} is carried. It counts from the pack, not from a slot.`);
  }
  const before = resolve(loadout);
  const after = resolve(next);
  const already = before.recognizedIds.includes(defId);
  if (already) feedback.push(`${def.name} is already recognized. The second instance does not count.`);
  return { ok: true, loadout: next, feedback: [...feedback, ...compareResolutions(before, after)] };
}

export function removeInstance(loadout: Loadout, instanceId: string): StepResult {
  if (!loadout.instances.some((instance) => instance.instanceId === instanceId)) {
    return { ok: false, loadout, feedback: ["That piece is not on the body."] };
  }
  const next = clone(loadout);
  next.instances = next.instances.filter((instance) => instance.instanceId !== instanceId);
  return { ok: true, loadout: next, feedback: compareResolutions(resolve(loadout), resolve(next)) };
}

export function tryEquip(loadout: Loadout, instanceId: string, slot: EquipSlot): StepResult {
  const instance = loadout.instances.find((entry) => entry.instanceId === instanceId);
  if (!instance) return { ok: false, loadout, feedback: ["That piece is not on the body."] };
  const def = ITEM_BY_ID.get(instance.defId);
  if (!def) return { ok: false, loadout, feedback: ["Unknown piece."] };
  if (def.slot === "pack" || def.countsWhen !== "equipped") {
    return { ok: false, loadout, feedback: [`${def.name} does not take a slot. Invalid slot.`] };
  }
  if (def.slot !== slot) {
    return { ok: false, loadout, feedback: [`${def.name} does not go in ${SLOT_LABEL[slot]}. Invalid slot.`] };
  }
  if (!def.bodies.includes(loadout.body)) {
    return { ok: false, loadout, feedback: [`${BODY_LABEL[loadout.body]} cannot wear ${def.name}.`] };
  }
  const blocked = loadout.instances.some(
    (entry) => entry.instanceId !== instanceId && entry.presence === "equipped" && entry.slot === slot,
  );
  if (blocked) return { ok: false, loadout, feedback: [`${SLOT_LABEL[slot]} is already filled. Nothing was moved.`] };
  if (instance.presence === "equipped" && instance.slot === slot) {
    return { ok: true, loadout, feedback: [`${def.name} is already in ${SLOT_LABEL[slot]}.`] };
  }
  const next = clone(loadout);
  const target = next.instances.find((entry) => entry.instanceId === instanceId);
  if (!target) return { ok: false, loadout, feedback: ["That piece is not on the body."] };
  target.presence = "equipped";
  target.slot = slot;
  return { ok: true, loadout: next, feedback: compareResolutions(resolve(loadout), resolve(next)) };
}

export function changeBody(loadout: Loadout, body: BodyId): StepResult {
  if (loadout.body === body) return { ok: true, loadout, feedback: [`Already ${BODY_LABEL[body]}.`] };
  const next = clone(loadout);
  next.body = body;
  const notes: string[] = [];
  for (const instance of next.instances) {
    const def = ITEM_BY_ID.get(instance.defId);
    if (!def) continue;
    const illegalEquip = instance.presence === "equipped" && !def.bodies.includes(body);
    const illegalUse = instance.presence === "used" && !def.bodies.includes(body);
    if (illegalEquip || illegalUse) {
      instance.presence = "carried";
      delete instance.slot;
      notes.push(`${def.name} leaves the ${illegalEquip ? "slot" : "use"} on ${BODY_LABEL[body]}. It is carried and does not count.`);
    }
  }
  const feedback = [...notes, ...compareResolutions(resolve(loadout), resolve(next))];
  return { ok: true, loadout: next, feedback };
}

export function familyDef(id: string): FamilyDef {
  const found = FAMILY_BY_ID.get(id);
  if (!found) throw new Error(`unknown family ${id}`);
  return found;
}

export function slotOf(defId: string): ItemDef["slot"] {
  return itemById(defId).slot;
}
