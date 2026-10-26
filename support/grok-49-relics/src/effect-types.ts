import type { EffectResult, Intent, RelicInstance, RelicRecord, World } from "./types.ts";

export type { EffectResult, Intent, RelicInstance, RelicRecord, World };

export interface HandlerCtx {
  world: World;
  intent: Intent;
  relic: RelicRecord;
  instance: RelicInstance | null;
  catalog: RelicRecord[];
}

export interface HandlerResult {
  ok: boolean;
  code: string;
  detail: string;
  lineage?: { person: string; response: string }[];
  lock?: boolean;
  lockTicks?: number;
}

export type Handler = (ctx: HandlerCtx) => HandlerResult;
