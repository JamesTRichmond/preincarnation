import { adaptWorld, worldSignature } from "./adapter.ts";
import type { ItemIndex } from "./index-types.ts";
import type { KnownWorld } from "./types.ts";

export type { ItemIndex } from "./index-types.ts";

/** Build a fresh index. Undiscovered loot never becomes a record. */
export function buildIndex(world: KnownWorld): ItemIndex {
  const started = performance.now();
  const records = adaptWorld(world);
  const postings = new Map<string, number[]>();
  const byInstanceId = new Map<string, number>();

  records.forEach((record, index) => {
    byInstanceId.set(record.instanceId, index);
    const seen = new Set<string>();
    for (const token of record.tokens) {
      if (seen.has(token)) continue;
      seen.add(token);
      const list = postings.get(token);
      if (list) list.push(index);
      else postings.set(token, [index]);
    }
  });

  return {
    revision: world.revision,
    year: world.year,
    signature: worldSignature(world),
    builtMs: performance.now() - started,
    records,
    postings,
    byInstanceId,
  };
}

export function indexIsStale(index: ItemIndex, world: KnownWorld): string | null {
  if (index.revision !== world.revision) {
    return `Index revision ${index.revision} does not match the world revision ${world.revision}.`;
  }
  const signature = worldSignature(world);
  if (index.signature !== signature) {
    return "Index signature does not match the world. An instance was renamed, moved, or lost without a rebuild.";
  }
  return null;
}
