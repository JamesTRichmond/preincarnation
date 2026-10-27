import { useEffect, useRef, useState } from "react";
import { PARLOR_ART } from "./art.ts";
import { Button, Kicker, Sheet } from "./bits.tsx";
import { captionFor, earnedIds, tuneAllowed, untoldNotes } from "../hub/engine.ts";
import { letterIsOpen, notYetLine, SLOT_COUNTS, type SlotKey } from "../memory/room.ts";
import { rewardById, REWARDS } from "../rewards/catalog.ts";
import { tuneById } from "../rewards/tunes.ts";
import { behaviorFor, greetingFor, stanceFor } from "../rivals/progress.ts";
import { RIVALS, rivalById } from "../rivals/roster.ts";
import { playTune } from "./play-tune.ts";
import type { Amendment, RivalId, SaveData } from "../types.ts";

const SLOT_META: Record<SlotKey, { title: string; empty: string }> = {
  trophies: { title: "Nails", empty: "An empty nail" },
  objects: { title: "Shelf", empty: "A bare space on the shelf" },
  sketches: { title: "Sketch board", empty: "A blank pin" },
};

export function Parlor({
  save,
  onPlace,
  onPin,
  onTune,
  onAmend,
  onRead,
  onPerson,
  onLetter,
}: {
  save: SaveData;
  onPlace: (kind: SlotKey, index: number, rewardId: string | null) => void;
  onPin: (rewardId: string | null) => void;
  onTune: (rewardId: string | null) => void;
  onAmend: (rewardId: string, amendment: Amendment) => void;
  onRead: (rewardId: string) => void;
  onPerson: (id: RivalId) => void;
  onLetter: (rewardId: string) => void;
}) {
  const earned = earnedIds(save);
  const stopRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => stopRef.current?.(), []);

  const tunes = REWARDS.filter((reward) => reward.kind === "tune" && earned.has(reward.id));
  const letters = REWARDS.filter((reward) => reward.kind === "letter" && earned.has(reward.id));
  const relationships = REWARDS.filter((reward) => reward.kind === "relationship" && earned.has(reward.id));
  const stool = save.memory.stoolTuneId ? rewardById(save.memory.stoolTuneId) : undefined;
  const untold = untoldNotes(save);

  function hear(rewardId: string) {
    if (!tuneAllowed(save, rewardId)) return;
    const reward = rewardById(rewardId);
    const tune = reward?.tuneId ? tuneById(reward.tuneId) : undefined;
    if (!tune) return;
    stopRef.current?.();
    onTune(rewardId);
    const stop = playTune(tune);
    stopRef.current = stop;
    setPlaying(rewardId);
  }

  return (
    <div className="space-y-4">
      <img src={PARLOR_ART.src} alt={PARLOR_ART.alt} className="aspect-[16/7] w-full border border-line object-cover" />
      <Sheet>
        <Kicker>Homestead</Kicker>
        <h1 className="mt-2 font-display text-5xl text-ink">The parlor</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink">
          Trophies, objects, sketches, letters, and the music Sable wrote. Nothing planted, nothing taxed. The
          cousins argue with the captions. They do not inherit a farm from this wall.
        </p>
        {earned.size === 0 ? (
          <p className="mt-4 text-sm text-walnut">
            The nails are empty. The gatherings are optional. The room will wait without punishing the life.
          </p>
        ) : null}
      </Sheet>

      {(Object.keys(SLOT_COUNTS) as SlotKey[]).map((kind) => {
        const options = REWARDS.filter((reward) => {
          if (!earned.has(reward.id)) return false;
          if (kind === "trophies") return reward.kind === "trophy";
          if (kind === "objects") return reward.kind === "object";
          return reward.kind === "sketch";
        });
        return (
          <Sheet key={kind}>
            <Kicker>{SLOT_META[kind].title}</Kicker>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {save.memory[kind].map((rewardId, index) => {
                const reward = rewardId ? rewardById(rewardId) : undefined;
                return (
                  <div key={`${kind}-${index}`} className="flex min-h-40 flex-col border border-line bg-paper p-3">
                    <span className="size-2 rounded-full bg-maple" aria-hidden="true" />
                    <p className="mt-3 font-display text-xl text-ink">
                      {reward ? reward.name : SLOT_META[kind].empty}
                    </p>
                    {reward?.kind === "sketch" && reward.sketch ? (
                      <div className="mt-3 border border-line bg-cream p-3">
                        <p className="font-display text-xl text-ink">{reward.sketch.creature}</p>
                        <p className="mt-2 text-sm leading-relaxed text-ink">{reward.sketch.ellisNote}</p>
                        <p className="mt-2 text-sm leading-relaxed text-walnut">{reward.sketch.willaDispute}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-ink">{reward?.blurb ?? "Choose something the gatherings gave you."}</p>
                    )}
                    <label className="mt-auto block pt-3 text-xs text-walnut" htmlFor={`${kind}-${index}`}>
                      {earned.size === 0 ? "Nothing earned to hang" : "Hang here"}
                      <select
                        id={`${kind}-${index}`}
                        disabled={earned.size === 0}
                        className="mt-1 min-h-11 w-full border border-line bg-cream px-2 text-sm text-ink disabled:opacity-60"
                        value={rewardId ?? ""}
                        onChange={(event) => onPlace(kind, index, event.target.value || null)}
                      >
                        <option value="">Leave empty</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>
          </Sheet>
        );
      })}

      <Sheet>
        <Kicker>Stool</Kicker>
        <h2 className="mt-2 font-display text-2xl text-ink">{stool?.name ?? "No piece on the stool"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-walnut">
          {stool?.tuneId ? tuneById(stool.tuneId)?.attribution : "Acquired music only. Nothing here is a borrowed song."}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {tunes.length === 0 ? <p className="text-sm text-walnut">No tunes kept yet.</p> : null}
          {tunes.map((reward) => (
            <Button key={reward.id} variant={playing === reward.id ? "primary" : "secondary"} onClick={() => hear(reward.id)}>
              Play {reward.name}
            </Button>
          ))}
        </div>
      </Sheet>

      <Sheet>
        <Kicker>Drawer</Kicker>
        <div className="mt-3 space-y-3">
          {letters.length === 0 ? <p className="text-sm text-walnut">No letters yet.</p> : null}
          {letters.map((reward) => {
            const open = reward.letter ? letterIsOpen(reward, save.eraId) : false;
            return (
              <div key={reward.id} className="border border-line bg-paper p-3">
                <p className="font-medium text-ink">{reward.name}</p>
                <p className="mt-1 text-sm text-walnut">{open ? reward.blurb : "Folded shut until the return."}</p>
                {open ? (
                  <div className="mt-3">
                    <Button
                      onClick={() => {
                        onRead(reward.id);
                        onPin(reward.id);
                        onLetter(reward.id);
                      }}
                    >
                      Read {reward.letter?.from}
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Sheet>

      <Sheet>
        <Kicker>What the cousins say</Kicker>
        {save.eraId === "first-turning" ? (
          <p className="mt-3 text-sm leading-relaxed text-ink">{notYetLine()}</p>
        ) : (
          <div className="mt-3 space-y-4">
            {untold.map((note) => (
              <p key={note} className="text-sm leading-relaxed text-walnut">
                {note}
              </p>
            ))}
            {[...earned].map((id) => {
              const reward = rewardById(id);
              if (!reward) return null;
              const spoken = captionFor(save, id);
              const amendment = save.memory.amendments[id] ?? "leave";
              return (
                <article key={id} className="border-t border-line pt-3">
                  <h3 className="font-medium text-ink">{reward.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink">
                    {spoken ?? "The card is down. The object can stay. The caption does not."}
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    {(["leave", "amend", "take-down"] as Amendment[]).map((choice) => (
                      <Button key={choice} variant={amendment === choice ? "primary" : "secondary"} onClick={() => onAmend(id, choice)}>
                        {choice === "leave" ? "Leave their version" : choice === "amend" ? "Amend to the fair card" : "Take the card down"}
                      </Button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Sheet>

      <Sheet>
        <Kicker>Who has moved</Kicker>
        <ul className="mt-3 space-y-3">
          {relationships.map((reward) => (
            <li key={reward.id} className="text-sm leading-relaxed text-ink">
              <span className="font-medium">{reward.name}.</span> {reward.blurb}
            </li>
          ))}
          {RIVALS.filter((rival) => {
            const state = save.rivals[rival.id];
            return state.bond !== 0 || state.lastLine.length > 0 || state.flags.length > 0;
          }).map((rival) => {
            const state = save.rivals[rival.id];
            return (
              <li key={rival.id}>
                <button
                  type="button"
                  onClick={() => onPerson(rival.id)}
                  className="w-full border border-line bg-paper px-3 py-3 text-left hover:border-maple"
                >
                  <span className="font-display text-xl text-ink">{rival.name}</span>
                  <span className="mt-1 block text-xs font-semibold tracking-[0.14em] text-maple uppercase">
                    {stanceFor(state.bond)}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-walnut">
                    {state.lastLine || greetingFor(rival, state, save.eraId)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {relationships.length === 0 &&
        RIVALS.every((rival) => {
          const state = save.rivals[rival.id];
          return state.bond === 0 && !state.lastLine && state.flags.length === 0;
        }) ? (
          <p className="mt-3 text-sm leading-relaxed text-walnut">
            No one has shifted yet. The twelve are on their own page, still untested.
          </p>
        ) : null}
      </Sheet>
    </div>
  );
}

export function Person({ save, rivalId }: { save: SaveData; rivalId: RivalId }) {
  const rival = rivalById(rivalId);
  const state = save.rivals[rivalId];
  const era = rival.eras[save.eraId];
  return (
    <div className="space-y-4">
      <Sheet>
        <Kicker>
          {era.age} · {era.role}
        </Kicker>
        <h1 className="mt-2 font-display text-5xl text-ink">{rival.name}</h1>
        <p className="mt-2 font-display text-xl text-walnut">{rival.epithet}</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-maple uppercase">{stanceFor(state.bond)}</p>
        {state.lastLine ? (
          <blockquote className="mt-4 border-l-2 border-maple pl-4 font-display text-2xl leading-snug text-ink">
            {state.lastLine}
          </blockquote>
        ) : (
          <p className="mt-4 leading-relaxed text-ink">{greetingFor(rival, state, save.eraId)}</p>
        )}
        <p className="mt-4 leading-relaxed text-ink">{rival.wants}</p>
        <p className="mt-3 text-sm leading-relaxed text-walnut">{rival.voice}</p>
        <p className="mt-4 text-sm leading-relaxed text-ink">{behaviorFor(rival, state, save.eraId)}</p>
      </Sheet>
      <div className="grid gap-4 sm:grid-cols-2">
        <Sheet>
          <Kicker>1959</Kicker>
          <p className="mt-3 text-sm leading-relaxed text-ink">{rival.eras["first-turning"].behavior}</p>
        </Sheet>
        <Sheet>
          <Kicker>1973</Kicker>
          <p className="mt-3 text-sm leading-relaxed text-ink">{rival.eras["the-return"].behavior}</p>
        </Sheet>
      </div>
      <Sheet>
        <Kicker>Tied to</Kicker>
        <ul className="mt-3 space-y-3">
          {rival.ties.map((tie) => (
            <li key={tie.rivalId} className="text-sm leading-relaxed text-ink">
              <span className="font-medium">{rivalById(tie.rivalId).name}.</span> {tie.nature}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-sm text-walnut">Contends over {rival.competesOver}.</p>
      </Sheet>
    </div>
  );
}

export function LetterView({ save, rewardId }: { save: SaveData; rewardId: string }) {
  const reward = rewardById(rewardId);
  if (!reward?.letter) return null;
  const open = letterIsOpen(reward, save.eraId);
  return (
    <Sheet className="mx-auto max-w-xl">
      <Kicker>{open ? reward.letter.from : "Folded"}</Kicker>
      <h1 className="mt-2 font-display text-4xl text-ink">{reward.name}</h1>
      {open ? (
        <>
          <p className="mt-6 font-display text-2xl leading-snug text-ink">{reward.letter.body}</p>
          <p className="mt-8 text-sm text-walnut">— {reward.letter.from}</p>
        </>
      ) : (
        <p className="mt-6 font-display text-2xl leading-snug text-ink">
          June folded this shut. The return is when it opens.
        </p>
      )}
    </Sheet>
  );
}

export function People({ save, onPerson }: { save: SaveData; onPerson: (id: RivalId) => void }) {
  return (
    <div className="space-y-4">
      <Sheet>
        <Kicker>Twelve, not a ladder</Kicker>
        <h1 className="mt-2 font-display text-5xl text-ink">The people who recur</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-walnut">
          Not a leaderboard with costumes. Each one wants something a score cannot hold, and the fourteen years
          change how the want is said.
        </p>
      </Sheet>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RIVALS.map((rival) => {
          const state = save.rivals[rival.id];
          const era = rival.eras[save.eraId];
          return (
            <button
              key={rival.id}
              type="button"
              onClick={() => onPerson(rival.id)}
              className="flex h-full flex-col border border-line bg-cream p-4 text-left hover:border-maple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maple"
            >
              <span className="text-xs font-semibold tracking-[0.14em] text-maple uppercase">
                {era.age} · {stanceFor(state.bond)}
              </span>
              <span className="mt-2 font-display text-2xl text-ink">{rival.name}</span>
              <span className="mt-1 text-sm text-ink">{rival.epithet}</span>
              <span className="mt-2 text-sm leading-relaxed text-walnut">{rival.wants}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
