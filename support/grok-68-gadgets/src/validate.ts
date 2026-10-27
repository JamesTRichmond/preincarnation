import { GADGETS, getGadget } from "./catalog.ts";
import { IMPLEMENTED_OPS } from "./effects.ts";
import { IRON_IDS, lootId } from "./ids.ts";
import type { Gadget } from "./types.ts";

export type ValidateIssue = { id: string; code: string; detail: string };

const FORBIDDEN = [
  /\b(rifle|pistol|firearm|shotgun|revolver|cartridge|ammunition|machine\s*gun)\b/i,
  /\b(conveyor|assembly line|industrial robot|\bcnc\b|\bplc\b)\b/i,
  /\b(mana|spell|enchant|fae|fairy|deity|demigod)\b/i,
];

function signature(g: Gadget): string {
  return g.uses
    .map((u) => u.ops.map((op) => `${op.op}:${JSON.stringify({ ...op, op: undefined })}`).join("+"))
    .join(" || ");
}

function opSet(g: Gadget): string {
  return [...new Set(g.uses.flatMap((u) => u.ops.map((op) => op.op)))].sort().join("|");
}

export function validatePack(): { ok: boolean; issues: ValidateIssue[] } {
  const issues: ValidateIssue[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  const sigs = new Map<string, string>();
  const sets = new Map<string, string>();
  const usedOps = new Set<string>();

  if (GADGETS.length !== 80) {
    issues.push({ id: "pack", code: "COUNT", detail: `Expected 80 gadgets, found ${GADGETS.length}.` });
  }

  for (let n = 1; n <= 80; n += 1) {
    const id = lootId(n);
    if (!getGadget(id)) issues.push({ id, code: "GAP", detail: "Missing reserved id." });
  }

  for (const g of GADGETS) {
    if (ids.has(g.id)) issues.push({ id: g.id, code: "DUP_ID", detail: g.id });
    ids.add(g.id);
    const nameKey = g.name.toLowerCase();
    if (names.has(nameKey)) issues.push({ id: g.id, code: "DUP_NAME", detail: g.name });
    names.add(nameKey);

    if (g.uses.length !== 2) issues.push({ id: g.id, code: "USES", detail: "Need exactly two uses." });
    if (g.uses[0]?.title === g.uses[1]?.title) issues.push({ id: g.id, code: "USES", detail: "Use titles match." });
    if (!g.discovery.site || !g.provenance.note || !g.storage.note || g.limits.length < 1) {
      issues.push({ id: g.id, code: "FIELDS", detail: "Discovery, provenance, storage, or limits missing." });
    }
    if (!g.restore && !g.salvage) issues.push({ id: g.id, code: "SERVICE", detail: "Neither restore nor salvage." });
    if (g.storage.stack) issues.push({ id: g.id, code: "STACK", detail: "These curios do not stack." });
    if (g.storage.iron !== IRON_IDS.has(g.id)) {
      issues.push({ id: g.id, code: "IRON", detail: "iron flag does not match the compass deviation set." });
    }

    const blob = JSON.stringify(g);
    for (const re of FORBIDDEN) {
      if (re.test(blob)) issues.push({ id: g.id, code: "FORBIDDEN", detail: re.source });
    }

    for (const use of g.uses) {
      if (!use.summary || use.ops.length < 1 || use.expect.length < 1) {
        issues.push({ id: g.id, code: "USE_EMPTY", detail: use.id });
      }
      for (const op of use.ops) {
        usedOps.add(op.op);
        if (!IMPLEMENTED_OPS.has(op.op)) issues.push({ id: g.id, code: "UNBOUND_OP", detail: op.op });
      }
    }
    for (const b of g.bindings) {
      if (!getGadget(b.id)) issues.push({ id: g.id, code: "BROKEN_LINK", detail: `${b.kind} → ${b.id}` });
    }

    const sig = signature(g);
    const prev = sigs.get(sig);
    if (prev) issues.push({ id: g.id, code: "DUP_EFFECT", detail: `Same effect payload as ${prev}` });
    sigs.set(sig, g.id);
    const set = opSet(g);
    const prevSet = sets.get(set);
    if (prevSet) issues.push({ id: g.id, code: "NEAR_DUP", detail: `Same op set as ${prevSet}: ${set}` });
    sets.set(set, g.id);
  }

  for (const op of IMPLEMENTED_OPS) {
    if (!usedOps.has(op)) issues.push({ id: "pack", code: "UNUSED_OP", detail: op });
  }

  return { ok: issues.length === 0, issues };
}
