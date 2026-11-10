import { lootId } from "./ids.ts";
import type {
  Binding,
  Family,
  Gadget,
  LimitProbe,
  Patch,
  ServiceDef,
  Store,
  UseDef,
} from "./types.ts";

type UseIn = Omit<UseDef, "id">;

export type PieceIn = {
  n: number;
  name: string;
  family: Family;
  maker: string;
  place: string;
  year: number;
  provenance: string;
  site: string;
  when: string;
  found: string;
  clue: string;
  oz: number;
  bulk: "pocket" | "belt" | "pack";
  hands?: 1 | 2;
  damp?: boolean;
  crush?: boolean;
  iron?: boolean;
  tin?: boolean;
  store?: Store;
  display: string;
  storageNote: string;
  limits: string[];
  wear?: number;
  a: UseIn;
  b: UseIn;
  restore?: ServiceDef;
  salvage?: ServiceDef;
  bindings?: Binding[];
  bench?: boolean;
  scenes?: string[];
  credit: number;
  refuse?: string;
  fixture: Patch;
  limit: LimitProbe;
  extraLimits?: LimitProbe[];
};

export function piece(p: PieceIn): Gadget {
  const id = lootId(p.n);
  return {
    id,
    n: p.n,
    name: p.name,
    family: p.family,
    hands: p.hands ?? 1,
    weightOz: p.oz,
    bulk: p.bulk,
    provenance: { maker: p.maker, place: p.place, year: p.year, note: p.provenance },
    discovery: { site: p.site, when: p.when, condition: p.found, clue: p.clue },
    storage: {
      preferred: p.store ?? (p.bulk === "pack" ? "pack" : p.bulk === "belt" ? "belt" : "pocket"),
      dampSensitive: p.damp ?? false,
      crushSensitive: p.crush ?? false,
      iron: p.iron ?? false,
      stack: false,
      canTin: p.tin ?? false,
      display: p.display,
      note: p.storageNote,
    },
    limits: p.limits,
    wear: p.wear ?? 2,
    uses: [
      { ...p.a, id: "a" },
      { ...p.b, id: "b" },
    ],
    restore: p.restore,
    salvage: p.salvage,
    bindings: p.bindings ?? [],
    bench: p.bench ?? false,
    scenes: p.scenes ?? [],
    tradeCredit: p.credit,
    tradeRefuse: p.refuse,
    fixture: p.fixture,
    limit: p.limit,
    extraLimits: p.extraLimits,
  };
}
