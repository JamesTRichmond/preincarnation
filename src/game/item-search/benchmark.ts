import { buildIndex } from "./index.ts";
import { search } from "./query.ts";
import { DEFAULT_FILTERS } from "./types.ts";
import { ledgerNow, withFixtures } from "./world.ts";

export type BenchQuery = {
  query: string;
  hits: number;
  syntheticHits: number;
  stale: boolean;
  p50Ms: number;
  p95Ms: number;
  minMs: number;
};

export type BenchResult = {
  generatedAt: string;
  fixtureCount: number;
  recordCount: number;
  authoredKnown: number;
  indexBuildMs: number;
  queries: BenchQuery[];
  note: string;
};

const NOTE =
  "Measured by the local benchmark harness in src/game/item-search. These are timings, not a claim of instantaneous search.";

function percentile(samples: number[], index: number): number {
  return samples[Math.min(samples.length - 1, index)] ?? 0;
}

/** Time index build and repeated queries over the 10,000-fixture ledger. */
export function runBenchmark(iterations = 30): BenchResult {
  const fixtureCount = 10_000;
  const world = withFixtures(ledgerNow(), fixtureCount);
  const buildStarted = performance.now();
  const index = buildIndex(world);
  const indexBuildMs = performance.now() - buildStarted;
  const include = { ...DEFAULT_FILTERS, fixtures: "include" as const };

  const queries = [
    "things that give light",
    "Short iron",
    "lampe a huile",
    "Maeve",
    "[fixture] Bin slip 05",
    "fixture",
    "where:cellar",
    "",
  ];

  const rows: BenchQuery[] = queries.map((query) => {
    const samples: number[] = [];
    let last = search(index, world, query, { filters: include });
    for (let i = 0; i < iterations; i++) {
      const started = performance.now();
      last = search(index, world, query, { filters: include });
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    return {
      query,
      hits: last.total,
      syntheticHits: last.hits.filter((hit) => hit.record.synthetic).length,
      stale: last.stale,
      p50Ms: percentile(samples, Math.floor(iterations * 0.5)),
      p95Ms: percentile(samples, Math.floor(iterations * 0.95)),
      minMs: samples[0] ?? 0,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    fixtureCount,
    recordCount: index.records.length,
    authoredKnown: index.records.filter((record) => !record.synthetic).length,
    indexBuildMs,
    queries: rows,
    note: NOTE,
  };
}
