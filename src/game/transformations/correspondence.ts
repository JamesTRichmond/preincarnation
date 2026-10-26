import type { IncarnationId } from "../types.ts";
import type { RelicId } from "../items.ts";
import type { FormId, ToolId } from "./types.ts";

/**
 * Name map only. The creek bench uses its own tool and form ids.
 * The overworld keeps RelicId and IncarnationId. Nothing here calls engine.ts.
 */
export const TOOL_TO_RELIC = {
  shovel: "shovel",
  sugar: "hookshot",
  boots: "boots",
  fins: "flippers",
  lamp: "lantern",
  hammer: "hammer",
  net: "net",
  glass: "mirror",
  cape: "cape",
  rod: "cane",
  bow: "bow",
  keg: "bombs",
} as const satisfies Record<ToolId, RelicId>;

export const FORM_TO_INCARNATION = {
  wanderer: "wanderer",
  smuggler: "smuggler",
  officer: "officer",
  god: "embryo",
} as const satisfies Record<FormId, IncarnationId>;
