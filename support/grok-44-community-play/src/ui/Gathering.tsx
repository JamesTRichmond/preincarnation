import { useState } from "react";
import { FESTIVAL_ART } from "./art.ts";
import { Button, Dialogue, FixtureBanner, Kicker, Sheet } from "./bits.tsx";
import { festivalById } from "../festivals/index.ts";
import { heatsCount, prizesFor, toneOf } from "../hub/engine.ts";
import { rewardById } from "../rewards/catalog.ts";
import { behaviorFor, greetingFor, stanceFor } from "../rivals/progress.ts";
import { rivalById } from "../rivals/roster.ts";
import type { RivalId, SaveData } from "../types.ts";

export function Gathering({
  save,
  onIntro,
  onChoose,
  onWithdraw,
  onFile,
  onAbandon,
  onDecline,
  onPerson,
}: {
  save: SaveData;
  onIntro: () => void;
  onChoose: (decisionId: string, useAccessible: boolean) => void;
  onWithdraw: () => void;
  onFile: () => void;
  onAbandon: () => void;
  onDecline: () => void;
  onPerson: (id: RivalId) => void;
}) {
  const progress = save.inProgress;
  const [accessible, setAccessible] = useState(false);
  if (!progress) return null;
  const festival = festivalById(progress.festivalId);
  const art = FESTIVAL_ART[festival.id];
  const host = rivalById(festival.hostRivalId);
  const activity = festival.activities[progress.activityIndex];
  const prior = progress.results[progress.results.length - 1];
  const tone = progress.phase === "closing" ? toneOf(progress.results) : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-line bg-cream">
        <img src={art.src} alt={art.alt} className="h-52 w-full object-cover sm:h-72" />
        <div className="space-y-3 p-4 sm:p-6">
          <Kicker>
            {festival.seasonLabel} · {host.name}, {festival.hostTitle}
          </Kicker>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{festival.name}</h1>
          <p className="text-sm text-walnut">{festival.place}</p>
          <HeatRail
            titles={festival.activities.map((item) => item.title)}
            index={progress.activityIndex}
            phase={progress.phase}
          />
          <p className="text-sm leading-relaxed text-ink">{festival.eraChanges[progress.eraId]}</p>
        </div>
      </div>

      {progress.phase === "intro" ? (
        <Sheet>
          <Kicker>At the door</Kicker>
          <div className="mt-4">
            <Dialogue lines={festival.intro[progress.eraId]} />
          </div>
          <h2 className="mt-8 font-display text-2xl text-ink">The order</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {festival.activities.map((item, index) => (
              <li key={item.id} className="border border-line bg-paper px-3 py-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-walnut uppercase">
                  {index + 1} · {item.moduleId}
                </p>
                <p className="mt-1 font-medium text-ink">{item.title}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm leading-relaxed text-walnut">
            Each heat offers a seated or shorter way through. Taking it does not shrink the prize, and it does not
            rescue a bad decision.
          </p>
          <h2 className="mt-8 font-display text-2xl text-ink">Who came</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {festival.rivals.map((id) => {
              const rival = rivalById(id);
              const state = save.rivals[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onPerson(id)}
                    className="h-full w-full border border-line bg-paper px-3 py-3 text-left hover:border-maple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maple"
                  >
                    <span className="block font-display text-xl text-ink">{rival.name}</span>
                    <span className="mt-1 block text-sm text-walnut">{rival.epithet}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-ink">
                      {greetingFor(rival, state, progress.eraId)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" onClick={onIntro}>
              Begin the first heat
            </Button>
            <Button onClick={onDecline}>Not this year</Button>
            <Button variant="quiet" onClick={onAbandon}>
              Back to the board
            </Button>
          </div>
        </Sheet>
      ) : null}

      {progress.phase === "activity" && activity ? (
        <Sheet>
          {prior ? (
            <blockquote className="mb-6 border-l-2 border-line pl-4">
              <Kicker>What just happened</Kicker>
              <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-walnut uppercase">
                {prior.outcome.replaceAll("-", " ")}
                {" · "}
                {prior.integration === "live" ? "live module" : "authored fixture"}
              </p>
              <p className="mt-2 font-display text-xl leading-snug text-ink">{prior.narrative}</p>
              <ul className="mt-3 space-y-2">
                {prior.rivalLines.map((line, index) => (
                  <li key={`${line.rivalId}-${index}`} className="text-sm leading-relaxed text-walnut">
                    {line.line}
                  </li>
                ))}
              </ul>
            </blockquote>
          ) : null}
          <Kicker>
            Heat {progress.activityIndex + 1} of {festival.activities.length}
          </Kicker>
          <h2 className="mt-2 font-display text-3xl text-ink">{activity.title}</h2>
          <div className="mt-4">
            <FixtureBanner moduleId={activity.moduleId} label={null} />
          </div>
          <p className="mt-4 font-display text-xl leading-snug text-ink">
            {activity.eraScene?.[progress.eraId] ?? activity.scene}
          </p>
          <label className="mt-4 flex items-start gap-3 border border-line bg-paper p-3">
            <input
              type="checkbox"
              className="mt-1 size-5 accent-maple"
              checked={accessible}
              onChange={(event) => setAccessible(event.target.checked)}
            />
            <span>
              <span className="block font-medium text-ink">{activity.accessible.label}</span>
              <span className="mt-1 block text-sm leading-relaxed text-walnut">{activity.accessible.why}</span>
              {activity.accessible.eraNote?.[progress.eraId] ? (
                <span className="mt-1 block text-sm text-ink">{activity.accessible.eraNote[progress.eraId]}</span>
              ) : null}
            </span>
          </label>
          <div className="mt-4 flex flex-col gap-2">
            {activity.decisions.map((decision) => (
              <button
                key={decision.id}
                type="button"
                onClick={() => {
                  onChoose(decision.id, accessible);
                  setAccessible(false);
                }}
                className="min-h-11 border border-line bg-cream px-4 py-3 text-left hover:border-maple hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maple"
              >
                <span className="block text-xs font-semibold tracking-[0.14em] text-maple uppercase">
                  {decision.approach}
                </span>
                <span className="mt-1 block font-display text-2xl text-ink">{decision.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-walnut">{decision.detail}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="quiet" onClick={onWithdraw}>
              Step back from this heat
            </Button>
            <Button variant="quiet" onClick={onAbandon}>
              Leave without filing
            </Button>
          </div>
        </Sheet>
      ) : null}

      {progress.phase === "closing" && tone ? (
        <Sheet>
          <Kicker>After · {tone}</Kicker>
          {prior ? (
            <blockquote className="mt-4 border-l-2 border-line pl-4">
              <p className="font-display text-xl leading-snug text-ink">{prior.narrative}</p>
              <ul className="mt-3 space-y-2">
                {prior.rivalLines.map((line, index) => (
                  <li key={`${line.rivalId}-c-${index}`} className="text-sm text-walnut">
                    {line.line}
                  </li>
                ))}
              </ul>
            </blockquote>
          ) : null}
          <div className="mt-6">
            <Dialogue lines={festival.closing[progress.eraId][tone]} />
          </div>
          <h2 className="mt-8 font-display text-2xl text-ink">What the record will keep</h2>
          {heatsCount(progress.results) ? (
            <ul className="mt-3 space-y-3">
              {prizesFor(festival.id, progress.eraId, tone, progress.results, save.storyFlags).map((id) => {
                const reward = rewardById(id);
                return (
                  <li key={id} className="border-t border-line pt-3">
                    <p className="font-display text-xl text-ink">{reward?.name ?? id}</p>
                    <p className="mt-1 text-sm leading-relaxed text-walnut">{reward?.blurb}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-walnut">
              Every heat was stepped back from. Nothing will be filed, and the relationships return to the doorway.
            </p>
          )}
          <p className="mt-4 text-sm text-walnut">
            Not a farm, a purse, or a lock on the life. Only what the parlor is allowed to hold.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={onFile}>
              {heatsCount(progress.results) ? "File the gathering" : "Set the heats aside"}
            </Button>
          </div>
          <h2 className="mt-8 font-display text-2xl text-ink">How they stand</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {festival.rivals.map((id) => {
              const rival = rivalById(id);
              const state = save.rivals[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onPerson(id)}
                    className="h-full w-full border border-line bg-paper px-3 py-3 text-left hover:border-maple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maple"
                  >
                    <span className="font-display text-xl text-ink">{rival.short}</span>
                    <span className="mt-1 block text-xs font-semibold tracking-[0.14em] text-maple uppercase">
                      {stanceFor(state.bond)}
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-walnut">
                      {behaviorFor(rival, state, progress.eraId)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      ) : null}
    </div>
  );
}

function HeatRail({
  titles,
  index,
  phase,
}: {
  titles: string[];
  index: number;
  phase: "intro" | "activity" | "closing";
}) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Heats">
      {titles.map((title, itemIndex) => {
        const done = phase === "closing" || (phase === "activity" && itemIndex < index);
        const current = phase === "activity" && itemIndex === index;
        return (
          <li key={title} className="min-w-0">
            <span className={`block h-1 ${done || current ? "bg-maple" : "bg-line"}`} />
            <span className={`mt-1 block text-xs ${current ? "font-medium text-ink" : "text-walnut"}`}>
              <span className="sm:hidden">{itemIndex + 1}</span>
              <span className="hidden truncate sm:block">{title}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
