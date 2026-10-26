import type { Handler } from "./effect-types.ts";
import { earlyHandlers } from "./handlers/early.ts";
import { lateHandlers } from "./handlers/late.ts";
import { midHandlers } from "./handlers/mid.ts";

export const handlers: Record<string, Handler> = {
  ...earlyHandlers,
  ...midHandlers,
  ...lateHandlers,
};
