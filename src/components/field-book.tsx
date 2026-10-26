import { useState } from "react";
import type { FieldbookCard } from "@/game/fieldbook/present";
import type { Action } from "@/game/fieldbook/types";

export function FieldBook({
  read,
  act,
}: {
  read: () => FieldbookCard | null;
  act: (action: Action) => string[];
}) {
  const [rev, setRev] = useState(0);
  const [notes, setNotes] = useState<string[]>([]);
  const card = read();
  void rev;
  if (!card) return null;

  function run(action: Action) {
    setNotes(act(action));
    setRev((n) => n + 1);
  }

  return (
    <section className="mt-5">
      <h3 className="font-display text-xl">Field book</h3>
      <p className="mt-2 text-sm text-fg">{card.sentence}</p>
      <p className="mt-1 text-sm text-fg-muted">
        What sits inside a thing is not in the bag. Heirlooms stay whole. The Marble Vein is still the only job.
      </p>
      {notes.map((note, index) => (
        <p key={`${index}-${note}`} className="mt-2 text-sm text-fg">
          {note}
        </p>
      ))}
      {(card.netId || card.glassId) && (
        <div className="mt-3 flex flex-col gap-2">
          {card.netId && (
            <button
              type="button"
              className="h-11 rounded-[12px] ring-1 ring-border"
              onClick={() => run({ type: "salvage", instanceId: card.netId as string })}
            >
              Break down the spare net
            </button>
          )}
          {card.glassId && (
            <button
              type="button"
              className="h-11 rounded-[12px] ring-1 ring-border"
              onClick={() => run({ type: "salvage", instanceId: card.glassId as string })}
            >
              Try the lantern glass
            </button>
          )}
        </div>
      )}
    </section>
  );
}
