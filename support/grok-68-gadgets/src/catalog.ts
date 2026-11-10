import { field } from "./items-field.ts";
import { fittings } from "./items-fittings.ts";
import { clockwork } from "./items-clock.ts";
import { optical } from "./items-optical.ts";
import { sonic } from "./items-sonic.ts";
import type { Gadget } from "./types.ts";

export const GADGETS: Gadget[] = [...clockwork, ...optical, ...sonic, ...fittings, ...field];

const byId = new Map(GADGETS.map((g) => [g.id, g]));

export function getGadget(id: string): Gadget | undefined {
  return byId.get(id);
}

export const BENCH_IDS = GADGETS.filter((g) => g.bench).map((g) => g.id);
