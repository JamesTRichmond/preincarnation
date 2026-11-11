import type { Recipe } from "./types.ts";

export type Take = { id: string; count: number; scale: number; note?: string };

export type AssignedLine = {
  replaces: string;
  need: number;
  takes: Take[];
  have: number;
  scale: number;
};

export type Assignment = {
  lines: AssignedLine[];
  leftover: Record<string, number>;
  foreign: string[];
};

function bag(src: Record<string, number>): Map<string, number> {
  const pool = new Map<string, number>();
  for (const [id, count] of Object.entries(src)) {
    if (count > 0) pool.set(id, count);
  }
  return pool;
}

/** Exact counts first, then substitutes. Extras stay in leftover and do not spoil a finished plate. */
export function assignPot(recipe: Recipe, pot: Record<string, number>): Assignment {
  const pool = bag(pot);
  const lines: AssignedLine[] = [];
  for (const req of recipe.ingredients) {
    const takes: Take[] = [];
    let needLeft = req.count;
    const exact = pool.get(req.id) ?? 0;
    if (exact > 0 && needLeft > 0) {
      const take = Math.min(exact, needLeft);
      pool.set(req.id, exact - take);
      if (exact - take <= 0) pool.delete(req.id);
      takes.push({ id: req.id, count: take, scale: 1 });
      needLeft -= take;
    }
    if (needLeft > 0) {
      const subs = recipe.substitutions
        .filter((s) => s.replaces === req.id)
        .slice()
        .sort((a, b) => b.durationScale - a.durationScale);
      for (const sub of subs) {
        if (needLeft <= 0) break;
        const avail = pool.get(sub.with) ?? 0;
        if (avail <= 0) continue;
        const take = Math.min(avail, needLeft);
        pool.set(sub.with, avail - take);
        if (avail - take <= 0) pool.delete(sub.with);
        takes.push({ id: sub.with, count: take, scale: sub.durationScale, note: sub.note });
        needLeft -= take;
      }
    }
    const have = takes.reduce((n, t) => n + t.count, 0);
    const scale = takes.length === 0 ? 1 : Math.min(...takes.map((t) => t.scale));
    lines.push({ replaces: req.id, need: req.count, takes, have, scale });
  }
  const used = new Set(lines.flatMap((line) => line.takes.map((t) => t.id)));
  const leftover: Record<string, number> = {};
  const foreign: string[] = [];
  for (const [id, count] of pool) {
    if (count <= 0) continue;
    leftover[id] = count;
    if (!used.has(id)) foreign.push(id);
  }
  return { lines, leftover, foreign };
}

export function isComplete(assignment: Assignment): boolean {
  return assignment.lines.every((line) => line.have >= line.need);
}

export function isCleanShort(assignment: Assignment): boolean {
  return (
    !isComplete(assignment) &&
    assignment.lines.every((line) => line.have > 0) &&
    assignment.foreign.length === 0
  );
}

export function touchRatio(assignment: Assignment): number {
  if (assignment.lines.length === 0) return 0;
  const touched = assignment.lines.filter((line) => line.have > 0).length;
  return touched / assignment.lines.length;
}

export function durationScale(assignment: Assignment): number {
  return assignment.lines.reduce((scale, line) => scale * line.scale, 1);
}
