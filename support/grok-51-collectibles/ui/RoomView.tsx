import { useState } from "react";
import { laterOpen, placedIds, type Action } from "../archive.ts";
import { getDecoration, ROOM_SLOTS, rotationsFor } from "../decorations.ts";
import type { RoomSlot, Save, SlotKind } from "../types.ts";

const KINDS: { id: SlotKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mantel", label: "Mantel" },
  { id: "wall", label: "Wall" },
  { id: "table", label: "Table" },
  { id: "shelf", label: "Shelf" },
  { id: "floor", label: "Floor" },
];

export function RoomView({
  save,
  dispatch,
  objectId,
  setObjectId,
  when,
  setWhen,
}: {
  save: Save;
  dispatch: (action: Action) => void;
  objectId: string;
  setObjectId: (id: string) => void;
  when: "then" | "later";
  setWhen: (when: "then" | "later") => void;
}) {
  const used = new Set(placedIds(save));
  const closet = save.decorations.filter((id) => !used.has(id));
  const [kind, setKind] = useState<SlotKind | "all">("all");
  const shown = kind === "all" ? closet : closet.filter((id) => getDecoration(id)?.kind === kind);
  const selected = getDecoration(objectId);
  const selectedSlot = ROOM_SLOTS.find((slot) => save.placed[slot.id]?.decorationId === objectId);
  const slotsOf = (slotKind: SlotKind) => ROOM_SLOTS.filter((slot) => slot.kind === slotKind);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
      <div className="min-w-0">
        <section className="rounded-card bg-pine px-4 py-5 text-paper" aria-label="Wall and mantel">
          <h2 className="text-2xl">Wall</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {slotsOf("wall").map((slot) => (
              <Place key={slot.id} slot={slot} save={save} objectId={objectId} onPick={setObjectId} light />
            ))}
          </div>
          <div className="mt-5 border-t-4 border-paper/40 pt-3">
            <h2 className="text-2xl">Mantel</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {slotsOf("mantel").map((slot) => (
                <Place key={slot.id} slot={slot} save={save} objectId={objectId} onPick={setObjectId} light />
              ))}
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-ember" aria-hidden="true" />
        </section>

        <section className="mt-3 rounded-card border border-ink/15 border-b-8 border-b-ink/25 bg-ink/5 px-4 py-5" aria-label="Table">
          <h2 className="text-2xl">Table</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {slotsOf("table").map((slot) => (
              <Place key={slot.id} slot={slot} save={save} objectId={objectId} onPick={setObjectId} />
            ))}
          </div>
        </section>

        <section className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-card border border-ink/15 px-4 py-4">
            <h2 className="text-2xl">Shelf</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {slotsOf("shelf").map((slot) => (
                <Place key={slot.id} slot={slot} save={save} objectId={objectId} onPick={setObjectId} />
              ))}
            </div>
          </div>
          <div className="rounded-card border border-ink/15 px-4 py-4">
            <h2 className="text-2xl">Floor</h2>
            <div className="mt-3">
              {slotsOf("floor").map((slot) => (
                <Place key={slot.id} slot={slot} save={save} objectId={objectId} onPick={setObjectId} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        {selected ? (
          <article className="rounded-card border border-ink/15 bg-paper p-4">
            <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">{selected.material}</p>
            <h2 className="text-3xl">{selected.name}</h2>
            <p className="mt-2 text-pretty">{selected.look}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`press h-11 rounded-full px-4 text-sm font-semibold ${when === "then" ? "bg-ink text-paper" : "bg-ink/5"}`}
                onClick={() => setWhen("then")}
              >
                That winter, {selected.year}
              </button>
              <button
                className={`press h-11 rounded-full px-4 text-sm font-semibold ${when === "later" ? "bg-ember text-paper" : "bg-ink/5"}`}
                onClick={() => setWhen("later")}
                disabled={!laterOpen(save, selected.id)}
              >
                {selected.later.year}
              </button>
            </div>
            <p className="mt-3 text-pretty">
              {when === "later" && laterOpen(save, selected.id)
                ? selected.later.text
                : when === "later"
                  ? "The later reading is still shut. It opens when the object is actually in the house."
                  : selected.then}
            </p>
            {selectedSlot && save.placed[selectedSlot.id]?.rotation === 180 ? (
              <p className="mt-3 border-t border-ink/15 pt-3 text-pretty">
                <span className="font-semibold">Verso. </span>
                {selected.verso}
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink/70">Turn it to 180° to read the back.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSlot ? (
                <>
                  <button
                    className="press h-11 rounded-full bg-pine px-4 text-sm font-semibold text-paper"
                    onClick={() => dispatch({ type: "rotate", slotId: selectedSlot.id })}
                  >
                    Turn
                  </button>
                  <button
                    className="press h-11 rounded-full bg-ink/5 px-4 text-sm font-semibold"
                    onClick={() => dispatch({ type: "clear", slotId: selectedSlot.id })}
                  >
                    Take down
                  </button>
                </>
              ) : (
                ROOM_SLOTS.filter((slot) => selected.fits.includes(slot.kind) && !save.placed[slot.id]).map((slot) => (
                  <button
                    key={slot.id}
                    className="press h-11 rounded-full bg-pine px-4 text-sm font-semibold text-paper"
                    onClick={() => dispatch({ type: "place", decorationId: selected.id, slotId: slot.id })}
                  >
                    Place on {slot.label}
                  </button>
                ))
              )}
            </div>
            {!selectedSlot &&
              ROOM_SLOTS.filter((slot) => selected.fits.includes(slot.kind) && !save.placed[slot.id]).length === 0 && (
                <p className="mt-2 text-sm">Clear a fitting place first. This object is not doubled.</p>
              )}
            <p className="mt-3 text-xs text-ink/60">
              Turns:{" "}
              {selectedSlot ? rotationsFor(selectedSlot.kind).join("°, ") : rotationsFor(selected.kind).join("°, ")}°
              {(save.duplicates[selected.id] ?? 0) > 0
                ? ` · Duplicate recorded ${save.duplicates[selected.id]} time(s), still one object.`
                : ""}
            </p>
          </article>
        ) : null}

        <div>
          <h2 className="text-2xl">Closet</h2>
          <p className="text-sm text-ink/70">{closet.length} not on display. Twelve places in the room.</p>
          <div className="mt-2 flex gap-2 overflow-x-auto" role="group" aria-label="Filter the closet">
            {KINDS.map((item) => (
              <button
                key={item.id}
                className={`press h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${
                  kind === item.id ? "bg-ink text-paper" : "bg-ink/5"
                }`}
                onClick={() => setKind(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <ul className="mt-2 flex max-h-80 flex-col gap-1 overflow-auto">
            {shown.map((id) => {
              const item = getDecoration(id);
              if (!item) return null;
              return (
                <li key={id}>
                  <button
                    className={`press flex min-h-11 w-full items-center justify-between gap-3 rounded-card px-3 text-left ${
                      objectId === id ? "bg-ink text-paper" : "bg-ink/5"
                    }`}
                    onClick={() => {
                      setObjectId(id);
                      setWhen("then");
                    }}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs tracking-widest uppercase">{item.kind}</span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 ? <li className="text-sm text-ink/70">Nothing of that kind is in the closet.</li> : null}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Place({
  slot,
  save,
  objectId,
  onPick,
  light,
}: {
  slot: RoomSlot;
  save: Save;
  objectId: string;
  onPick: (id: string) => void;
  light?: boolean;
}) {
  const placed = save.placed[slot.id];
  const item = placed ? getDecoration(placed.decorationId) : undefined;
  const rotation = placed?.rotation ?? 0;
  const on = item?.id === objectId;
  const verso = rotation === 180;
  const spin = rotation === 90 ? "rotate-90" : rotation === 270 ? "-rotate-90" : "";
  const inverted = Boolean(item && verso);
  return (
    <button
      className={`press flex min-h-28 flex-col rounded-card border px-2 py-3 text-left ${
        inverted
          ? "border-ink bg-ink text-paper"
          : light
            ? "border-paper/30"
            : "border-ink/15 bg-paper"
      } ${on ? "ring-2 ring-ember" : ""}`}
      onClick={() => item && onPick(item.id)}
      disabled={!item}
      aria-label={item ? `${slot.label}, ${item.name}, turned ${rotation} degrees` : `${slot.label}, empty`}
    >
      <span className={`text-xs ${inverted ? "text-paper/70" : light ? "text-paper/70" : "text-ink/60"}`}>
        {slot.label}
      </span>
      {item ? (
        <>
          <span
            className={`turn mt-2 inline-flex h-11 w-11 items-center justify-center border font-display text-sm font-semibold ${spin} ${
              inverted || !light ? "border-current" : "border-paper"
            }`}
          >
            {item.mark}
          </span>
          <span className="mt-2 line-clamp-2 font-display text-base leading-tight">{inverted ? "Verso" : item.name}</span>
        </>
      ) : (
        <span className={`mt-6 text-sm ${light ? "text-paper/70" : "text-ink/60"}`}>Empty</span>
      )}
    </button>
  );
}
