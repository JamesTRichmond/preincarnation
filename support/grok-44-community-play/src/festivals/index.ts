import type { FestivalDef, FestivalId } from "../types.ts";
import { frostWalk } from "./frost-walk.ts";
import { grangeFair } from "./grange-fair.ts";
import { harvestSupper } from "./harvest-supper.ts";
import { riverSunday } from "./river-sunday.ts";
import { sapNight } from "./sap-night.ts";
import { solsticeHearth } from "./solstice-hearth.ts";

export const FESTIVALS: FestivalDef[] = [
  sapNight,
  riverSunday,
  grangeFair,
  harvestSupper,
  solsticeHearth,
  frostWalk,
];

const BY_ID = new Map(FESTIVALS.map((festival) => [festival.id, festival]));

export function festivalById(id: FestivalId): FestivalDef {
  const festival = BY_ID.get(id);
  if (!festival) throw new Error(`Unknown gathering: ${id}`);
  return festival;
}

export {
  frostWalk,
  grangeFair,
  harvestSupper,
  riverSunday,
  sapNight,
  solsticeHearth,
};
