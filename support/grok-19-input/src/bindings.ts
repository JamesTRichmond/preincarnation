import { RECOVERY_CODE } from "./timing.ts";
import type {
  ActionId,
  Binding,
  BindingTable,
  ConflictPolicy,
  RebindResult,
} from "./types.ts";
import { ACTIONS } from "./types.ts";

export function sameBinding(a: Binding, b: Binding): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "key" && b.kind === "key") return a.code === b.code;
  if (a.kind === "padButton" && b.kind === "padButton") return a.button === b.button;
  if (a.kind === "padAxis" && b.kind === "padAxis") {
    return a.axis === b.axis && a.sign === b.sign;
  }
  if (a.kind === "padChord" && b.kind === "padChord") {
    return a.buttons.join(",") === b.buttons.join(",");
  }
  if (a.kind === "touch" && b.kind === "touch") return a.control === b.control;
  return false;
}

function cloneTable(table: BindingTable): BindingTable {
  return structuredClone(table);
}

export function keyboardBindings(table: BindingTable, action: ActionId): string[] {
  return table[action].flatMap((binding) => (binding.kind === "key" ? [binding.code] : []));
}

export function pauseHasKeyboard(table: BindingTable): boolean {
  return keyboardBindings(table, "pause").length > 0;
}

function findConflict(
  table: BindingTable,
  action: ActionId,
  slot: number,
  next: Binding,
): { action: ActionId; slot: number } | null {
  for (const other of ACTIONS) {
    for (let index = 0; index < table[other].length; index += 1) {
      if (other === action && index === slot) continue;
      const binding = table[other][index];
      if (binding && sameBinding(binding, next)) return { action: other, slot: index };
    }
  }
  return null;
}

function dedupe(list: Binding[]): Binding[] {
  const out: Binding[] = [];
  for (const binding of list) {
    if (!out.some((existing) => sameBinding(existing, binding))) out.push(binding);
  }
  return out;
}

/**
 * Replace or append one slot.
 * Swap exchanges the previous binding with the owner of `next` so neither
 * action silently loses its only control. Reject leaves the table untouched.
 * Pause must keep at least one keyboard binding. F8 is reserved for recovery.
 */
export function commitRebind(
  table: BindingTable,
  action: ActionId,
  slot: number,
  next: Binding,
  policy: ConflictPolicy,
): { table: BindingTable; result: RebindResult } {
  if (next.kind === "key" && next.code === RECOVERY_CODE) {
    return { table, result: { ok: false, reason: "reserved" } };
  }
  if (!Number.isInteger(slot) || slot < 0 || slot > table[action].length) {
    return { table, result: { ok: false, reason: "invalid" } };
  }
  const adding = slot === table[action].length;
  const previous = adding ? null : (table[action][slot] ?? null);
  const conflict = findConflict(table, action, slot, next);

  if (conflict && policy === "reject") {
    return {
      table,
      result: { ok: false, reason: "conflict", conflictWith: conflict.action },
    };
  }
  if (conflict && policy === "swap" && !previous) {
    return {
      table,
      result: { ok: false, reason: "conflict", conflictWith: conflict.action },
    };
  }

  const nextTable = cloneTable(table);
  if (conflict && previous) {
    nextTable[action][slot] = next;
    nextTable[conflict.action][conflict.slot] = previous;
  } else if (adding) {
    nextTable[action].push(next);
  } else {
    nextTable[action][slot] = next;
  }

  for (const id of ACTIONS) nextTable[id] = dedupe(nextTable[id]);

  if (!pauseHasKeyboard(nextTable)) {
    return { table, result: { ok: false, reason: "pause-required" } };
  }

  return {
    table: nextTable,
    result: {
      ok: true,
      swappedWith: conflict?.action,
    },
  };
}

export function clearSlot(
  table: BindingTable,
  action: ActionId,
  slot: number,
): { table: BindingTable; result: RebindResult } {
  const binding = table[action][slot];
  if (!binding) return { table, result: { ok: false, reason: "invalid" } };
  if (binding.kind === "touch") {
    return { table, result: { ok: false, reason: "invalid" } };
  }
  const nextTable = cloneTable(table);
  nextTable[action] = nextTable[action].filter((_, index) => index !== slot);
  if (!pauseHasKeyboard(nextTable)) {
    return { table, result: { ok: false, reason: "pause-required" } };
  }
  if (nextTable[action].length === 0) {
    return { table, result: { ok: false, reason: "invalid" } };
  }
  return { table: nextTable, result: { ok: true } };
}
