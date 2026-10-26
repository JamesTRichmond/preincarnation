// @ts-nocheck
import { ASH } from "./ash.js";
import { SUGAR } from "./sugar.js";
import { registerHandlers } from "./state.js";

export const HANDLERS = { ...SUGAR, ...ASH };
registerHandlers(HANDLERS);
