import { crossings } from "./crossings.ts";
import { households } from "./households.ts";
import { orchards } from "./orchards.ts";
import { quarries } from "./quarries.ts";
import { workshops } from "./workshops.ts";
import type { HistoryObject } from "../types.ts";

export const CATALOG: readonly HistoryObject[] = Object.freeze([
  ...workshops,
  ...households,
  ...crossings,
  ...orchards,
  ...quarries,
]);

export const CATALOG_BY_ID: ReadonlyMap<string, HistoryObject> = new Map(
  CATALOG.map((obj) => [obj.id, obj]),
);
