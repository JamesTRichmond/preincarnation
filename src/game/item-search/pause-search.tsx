import { useMemo, useState } from "react";
import { adaptSave, type PreincarnationSaveSlice } from "./adapter.ts";
import { buildIndex } from "./index.ts";
import { search } from "./query.ts";

/** Pause-menu search over a save slice. Unexcavated graves never become rows. */
export function PauseSearch({ slice }: { slice: PreincarnationSaveSlice }) {
  const [query, setQuery] = useState("");
  const result = useMemo(() => {
    const world = adaptSave(slice);
    return search(buildIndex(world), world, query);
  }, [slice, query]);

  return (
    <section className="mt-5">
      <h3 className="font-display text-xl">What you can name</h3>
      <p className="mt-1 text-sm text-fg-muted">
        Carried, equipped, and already dug up. An unopened grave is not in this list.
      </p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        placeholder="things that give light"
        aria-label="Search what you carry"
        className="mt-2 h-11 w-full rounded-[12px] bg-bg px-3 text-sm text-fg ring-1 ring-border"
      />
      <ul className="mt-2 max-h-48 overflow-y-auto text-sm">
        {result.hits.length === 0 ? (
          <li className="py-2 text-fg-muted">Nothing you can name matches that.</li>
        ) : (
          result.hits.map((hit) => (
            <li key={hit.record.instanceId} className="border-t border-border py-2">
              <span className="text-fg">{hit.record.name}</span>
              <span className="ml-2 font-mono text-xs text-primary">×{hit.record.quantity}</span>
              <span className="mt-0.5 block text-fg-muted">
                {hit.record.locationLabel}
                {hit.record.equipped ? " · equipped" : ""}
                {!hit.record.accessible ? " · barred" : ""}
                {hit.record.kind !== "owned" ? ` · ${hit.record.kind}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
      <p className="mt-1 font-mono text-[10px] text-fg-subtle">
        {result.total} matches · {result.tookMs.toFixed(result.tookMs >= 10 ? 1 : 2)} ms
      </p>
    </section>
  );
}
