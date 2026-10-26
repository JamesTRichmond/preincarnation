import { EFFECT_SOURCE } from "./effects.ts";
import { ROWS } from "./rows.ts";
import type { Cost, Discipline, EffectId, MasteryObject, ObjectKind, Op, RelicId, When } from "./types.ts";

export type Row = {
  n: number;
  discipline: Discipline;
  kind: ObjectKind;
  name: string;
  effect: EffectId;
  ops: Op[];
  elseOps?: Op[];
  when?: When | null;
  extraCost?: Cost | null;
  group?: string | null;
  anchor: "weapon" | "y-relic" | "passive";
  ySlot?: RelicId;
  anyRelic?: RelicId[];
  dashGate?: boolean;
  flippers?: boolean;
  bottle?: boolean;
  selfHarmIfInside?: number;
  magic?: boolean;
  discovery: string;
  provenance: string;
  clause: string;
};

function idOf(n: number): string {
  return `loot.expansion.mastery.${String(n).padStart(3, "0")}`;
}

function effectName(effect: EffectId): string {
  return `${effect} (${EFFECT_SOURCE[effect]})`;
}

function opPhrase(op: Op): string {
  const value = typeof op.value === "number" ? op.value : `"${op.value}"`;
  return `${op.mode} ${op.channel} ${value} on ${op.effect}`;
}

export function buildObject(row: Row): MasteryObject {
  const ops = row.ops;
  const elseOps = row.elseOps ?? [];
  const effects = [...new Set([...ops, ...elseOps].map((op) => op.effect))];
  const gates: string[] = [];
  if (row.ySlot) gates.push(`off-hand is the existing ${row.ySlot} relic`);
  if (row.anyRelic?.length) gates.push(`you already carry ${row.anyRelic.join(" or ")}`);
  if (row.dashGate) gates.push("the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin)");
  if (row.flippers) gates.push("Creek fins are already owned and you are in the water");
  if (row.bottle) gates.push("a filled bottle is already in hand");
  if (!gates.length) gates.push("the tool action's own gate, unchanged, is open");
  const windup = [...ops, ...elseOps].some((op) => op.channel === "windup" && op.mode === "add" && Number(op.value) > 0);
  const erosion = row.magic ? "magic-kept" : "mundane";
  return {
    id: idOf(row.n),
    name: row.name,
    discipline: row.discipline,
    kind: row.kind,
    disciplineAbilityId: null,
    bindingStatus: "existing-effect-only",
    compatibleEffects: effects,
    ops,
    elseOps,
    when: row.when ?? null,
    tradeoff: tradeoffText(row),
    changedBehavior: `${row.name} may alter only ${effects.map(effectName).join("; ")}. ${[...ops, ...elseOps].map(opPhrase).join("; ")}. ${row.clause}`,
    equipRestrictions: `Binds as a ${row.kind} on the existing ${row.anchor} anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. ${row.group ? `Exclusive with other ${row.group} objects.` : "No exclusivity group."}`,
    useRestrictions: `Applies only while ${gates.join(", and ")}. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.`,
    removal: windup
      ? "Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed."
      : "Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.",
    discovery: row.discovery,
    provenance: row.provenance,
    save: {
      onDeath: "drops-to-grave",
      erosion,
      note: erosion === "magic-kept"
        ? "Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts."
        : "Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.",
    },
    exclusivityGroup: row.group ?? null,
    anchor: row.anchor,
    requires: {
      ySlot: row.ySlot ?? undefined,
      anyRelic: row.anyRelic ?? undefined,
      dashGate: row.dashGate,
      flippers: row.flippers,
      bottle: row.bottle,
    },
    extraCost: row.extraCost ?? null,
    grants: [],
    selfHarmIfInside: row.selfHarmIfInside ?? 0,
    clause: row.clause,
  };
}

function tradeoffText(row: Row): string {
  const bits: string[] = [];
  if (row.extraCost) bits.push(`spends ${row.extraCost.amount} ${row.extraCost.id} on the press, with no refund`);
  if (row.selfHarmIfInside) bits.push(`if you are still inside the blast when it resolves, you take ${row.selfHarmIfInside} hp`);
  for (const op of row.ops) {
    if (op.mode === "mul" && Number(op.value) < 1) bits.push(`${op.channel} × ${op.value}`);
    if (op.mode === "add" && typeof op.value === "number" && op.value < 0) bits.push(`${op.channel} ${op.value}`);
    if (op.channel === "windup" && op.mode === "add" && Number(op.value) > 0) bits.push(`windup +${op.value}s`);
    if (op.channel === "cooldown" && op.mode === "add" && Number(op.value) > 0) bits.push(`cooldown +${op.value}s`);
    if (op.channel === "selfSlow" && op.mode === "add" && Number(op.value) > 0) bits.push(`self slow +${op.value}`);
    if (op.channel === "chargeThreshold" && op.mode === "set" && Number(op.value) > 0.12) bits.push(`must draw to ${op.value} before release`);
  }
  if (row.elseOps?.length) bits.push("outside its condition the numbers worsen");
  if (!bits.length) bits.push("a narrower shape or a slower recovery than the bare tool");
  return `Unmodified ${row.effect} stays available if you leave this off. While worn: ${bits.join("; ")}.`;
}

export const MASTERY_OBJECTS: MasteryObject[] = (ROWS as unknown as Row[]).map(buildObject);

export function objectById(id: string): MasteryObject | undefined {
  return MASTERY_OBJECTS.find((item) => item.id === id);
}
