import type { Action } from "../archive.ts";
import { getDocument } from "../documents.ts";
import { HUNTS, getHunt, huntNode } from "../hunts.ts";
import type { HuntDef, HuntNode, Save } from "../types.ts";

export function GroundsView({
  save,
  dispatch,
  docId,
  openDoc,
}: {
  save: Save;
  dispatch: (action: Action) => void;
  docId: string;
  openDoc: (id: string) => void;
}) {
  const excursion = save.excursion;
  const hunt = excursion ? getHunt(excursion.huntId) : undefined;
  const here = hunt && excursion ? huntNode(hunt, excursion.nodeId) : undefined;
  const map = excursion ? getDocument(excursion.mapId) : getDocument(docId);

  if (!excursion || !hunt || !here) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {HUNTS.map((item) => {
          const open = item.maps.some((entry) => save.read.includes(entry.docId));
          const found = save.huntsFound.includes(item.id);
          return (
            <article
              key={item.id}
              className={`rounded-card border p-4 ${open && !found ? "border-pine" : "border-ink/15"}`}
            >
              <h2 className="text-2xl">{item.title}</h2>
              <p className="mt-1 text-sm text-ink/70">
                {found ? "The cache has been opened." : open ? "A map is read. The ground is not." : "Read a map before you set out."}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {item.maps.map((entry) => {
                  const paper = getDocument(entry.docId);
                  const read = save.read.includes(entry.docId);
                  const have = save.documents.includes(entry.docId);
                  return (
                    <li key={entry.docId} className="flex flex-col gap-1">
                      <p className="font-semibold">{paper?.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="press h-11 rounded-full bg-ink/5 px-4 text-sm font-semibold"
                          onClick={() => openDoc(entry.docId)}
                          disabled={!have}
                        >
                          {read ? "Read again" : "Read at the desk"}
                        </button>
                        <button
                          className="press h-11 rounded-full bg-pine px-4 text-sm font-semibold text-paper disabled:opacity-40"
                          disabled={!read}
                          onClick={() => dispatch({ type: "setOut", mapId: entry.docId })}
                        >
                          Set out
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    );
  }

  const columns = seenColumns(hunt, excursion.visited, excursion.nodeId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
      <section className="min-w-0">
        <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">{hunt.title}</p>
        <h2 className="text-4xl">You are at the {here.name}</h2>
        <p className="mt-3 max-w-prose text-pretty text-lg">{here.look}</p>
        <h3 className="mt-5 text-xl">Where you have stood</h3>
        <p className="mt-1 text-sm text-ink/70">Places you have not reached stay off this walk. A path only opens from where you are.</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2" aria-label="Walk so far">
          {columns.map((column, index) => (
            <ul key={index} className="flex min-w-40 flex-1 flex-col gap-2">
              {column.map((node) => {
                const isHere = node.id === here.id;
                const stood = excursion.visited.includes(node.id);
                const canWalk = here.neighbors.includes(node.id);
                return (
                  <li key={node.id}>
                    <button
                      className={`press min-h-16 w-full rounded-card px-3 py-2 text-left ${
                        isHere ? "bg-pine text-paper" : stood ? "bg-ink/10" : "border border-ink/15 bg-paper"
                      }`}
                      disabled={!canWalk}
                      onClick={() => dispatch({ type: "walk", to: node.id })}
                    >
                      <span className="block font-semibold">{node.name}</span>
                      <span className={`text-xs ${isHere ? "text-paper/80" : "text-ink/60"}`}>
                        {isHere ? "You are here" : stood ? "Stood here" : "Open path"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
        <button
          className="press mt-4 h-11 rounded-full bg-ember px-4 font-semibold text-paper"
          onClick={() => dispatch({ type: "searchGround" })}
        >
          Search this ground
        </button>
        <button
          className="press mt-2 ml-2 h-11 rounded-full bg-ink/5 px-4 font-semibold"
          onClick={() => dispatch({ type: "leaveGround" })}
        >
          Go back inside
        </button>
      </section>
      <aside className="rounded-card border border-ink/15 p-4">
        <h3 className="text-xl">{map?.title}</h3>
        <p className="mt-2 text-pretty">{map?.body}</p>
        <p className="mt-4 text-sm text-ink/70">The map names places. Nothing on the ground is marked for you.</p>
      </aside>
    </div>
  );
}

/** Visited places, plus the doors from where you stand. Depth is walked distance, not a treasure pin. */
function seenColumns(hunt: HuntDef, visited: readonly string[], current: string): HuntNode[][] {
  const revealed = new Set(visited);
  const here = huntNode(hunt, current);
  for (const id of here?.neighbors ?? []) revealed.add(id);
  const depth = new Map<string, number>();
  const queue: string[] = [];
  if (revealed.has(hunt.start)) {
    depth.set(hunt.start, 0);
    queue.push(hunt.start);
  }
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) break;
    const node = huntNode(hunt, id);
    const at = depth.get(id) ?? 0;
    for (const next of node?.neighbors ?? []) {
      if (!revealed.has(next) || depth.has(next)) continue;
      depth.set(next, at + 1);
      queue.push(next);
    }
  }
  for (const id of revealed) {
    if (!depth.has(id)) depth.set(id, 0);
  }
  const max = Math.max(0, ...depth.values());
  const columns: HuntNode[][] = Array.from({ length: max + 1 }, () => []);
  for (const [id, at] of depth) {
    const node = huntNode(hunt, id);
    if (node) columns[at]?.push(node);
  }
  return columns.filter((column) => column.length > 0);
}
