import type { LedgerRecord } from "./types.ts";

export type ItemIndex = {
  revision: number;
  year: number;
  signature: string;
  builtMs: number;
  records: LedgerRecord[];
  postings: Map<string, number[]>;
  byInstanceId: Map<string, number>;
};
