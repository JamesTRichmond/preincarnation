/** Recoverable loot-core failure. Dispatch returns these; it does not throw past `step`. */
export class LootError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "LootError";
    this.code = code;
  }
}

export interface LootErrorBody {
  code: string;
  message: string;
}
