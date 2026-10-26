import type { HandlerResult, RelicInstance } from "../effect-types.ts";
import type { RelicId } from "../ids.ts";
import type { World } from "../types.ts";

export function ok(
  code: string,
  detail: string,
  lineage?: { person: string; response: string }[],
  lock = false,
  lockTicks?: number,
): HandlerResult {
  return { ok: true, code, detail, lineage, lock, lockTicks };
}

export function no(code: string, detail: string): HandlerResult {
  return { ok: false, code, detail };
}

export function carried(instance: RelicInstance | null, name: string): RelicInstance | HandlerResult {
  if (!instance) return no("not-carried", `${name} is not in Ellis's keeping.`);
  return instance;
}

export function isResult(value: RelicInstance | HandlerResult): value is HandlerResult {
  return "ok" in value && "code" in value && !("relicId" in value);
}

export function str(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing string param ${key}`);
  }
  return value;
}

export function strs(params: Record<string, unknown>, key: string): string[] {
  const value = params[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Missing string list param ${key}`);
  }
  return value as string[];
}

export function num(params: Record<string, unknown>, key: string): number {
  const value = params[key];
  if (typeof value !== "number") throw new Error(`Missing number param ${key}`);
  return value;
}

export function owns(world: World, id: RelicId): boolean {
  return world.inventory.some((item) => item.relicId === id) || world.placed.some((place) => place.instance.relicId === id);
}

export function take(world: World, instance: RelicInstance, where: string): void {
  world.inventory = world.inventory.filter((item) => item.instanceId !== instance.instanceId);
  const already = world.placed.find((place) => place.instance.instanceId === instance.instanceId);
  if (!already) world.placed.push({ where, instance });
}

export function nightLocked(world: World): boolean {
  return world.flags["sound.nightLock"] === true && flagNum(world, "sound.nightUntilTick") > world.tick;
}

function flagNum(world: World, key: string): number {
  const value = world.flags[key];
  return typeof value === "number" ? value : 0;
}

export function debtBlocksRestore(world: World): HandlerResult | null {
  if (world.flags["vein.debt"] === true) {
    return no("vein-debt", "The handkerchief's debt is unpaid. Sleep at Silt Lane before any restoration will take.");
  }
  return null;
}
