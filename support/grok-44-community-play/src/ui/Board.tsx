import { FESTIVAL_ART } from "./art.ts";
import { Button, Kicker, Sheet } from "./bits.tsx";
import type { BoardModel } from "../hub/engine.ts";
import type { FestivalId } from "../types.ts";

const STATE_LABEL = {
  posted: "Posted",
  "still-open": "Still open",
  "not-yet": "Not yet",
  attended: "Filed",
  declined: "Absent",
  "in-progress": "Underway",
} as const;

export function Board({
  model,
  onOpen,
  onTurn,
  onJump,
  onPass,
  onParlor,
  onPeople,
  onDecline,
}: {
  model: BoardModel;
  onOpen: (id: FestivalId) => void;
  onTurn: () => void;
  onJump: () => void;
  onPass: () => void;
  onParlor: () => void;
  onPeople: () => void;
  onDecline: (id: FestivalId) => void;
}) {
  return (
    <div className="space-y-6">
      <Sheet>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>
              {model.eraYear} · {model.eraName}
            </Kicker>
            <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">The year</h1>
            <p className="mt-2 text-sm text-walnut">
              {model.ellis} · {model.weekLabel}
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-walnut">
            {model.jumpLabel ? `Next posting: ${model.jumpLabel}.` : "No further posting this year."}
          </p>
        </div>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink">{model.lede}</p>
        {model.inProgressName ? (
          <p className="mt-4 border-l-2 border-maple pl-4 text-sm text-ink">
            {model.inProgressName} is still underway. Leaving it unfiled puts every bond back to the doorway.
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="primary" onClick={onJump} disabled={!model.jumpLabel}>
            The town is ready
          </Button>
          <Button onClick={onTurn} disabled={!model.canTurnWeek}>
            Turn one week
          </Button>
          <Button onClick={onParlor}>Open the parlor</Button>
          <Button onClick={onPeople}>The twelve</Button>
          {model.canPassYears ? (
            <Button variant="quiet" onClick={onPass}>
              Let fourteen years pass
            </Button>
          ) : null}
        </div>
      </Sheet>

      <div className="grid gap-4 sm:grid-cols-2">
        {model.cards.map((card) => {
          const art = FESTIVAL_ART[card.id];
          const enterable = card.state === "posted" || card.state === "still-open" || card.state === "in-progress";
          const quiet = card.state === "declined" || card.state === "not-yet";
          return (
            <article
              key={card.id}
              className={`flex flex-col overflow-hidden border bg-cream ${
                enterable ? "border-maple" : "border-line"
              } ${quiet ? "opacity-80" : ""}`}
            >
              <img src={art.src} alt={art.alt} className="h-40 w-full object-cover sm:h-48" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <Kicker>
                  {card.seasonLabel} · {STATE_LABEL[card.state]}
                  {card.tone ? ` · ${card.tone}` : ""}
                </Kicker>
                <h2 className="font-display text-3xl text-ink">{card.name}</h2>
                <p className="text-sm text-walnut">
                  {card.place}
                  <span className="text-line"> · </span>
                  {card.hostName}
                </p>
                <p className="line-clamp-3 text-sm leading-relaxed text-ink">{card.eraNote}</p>
                <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row">
                  {enterable ? (
                    <Button variant="primary" onClick={() => onOpen(card.id)}>
                      {card.state === "in-progress" ? `Return to ${card.name}` : `Enter ${card.name}`}
                    </Button>
                  ) : null}
                  {card.state === "posted" || card.state === "still-open" ? (
                    <Button variant="quiet" onClick={() => onDecline(card.id)}>
                      Not this year
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <details className="border border-line bg-cream px-4 py-3">
        <summary className="flex min-h-11 items-center justify-between gap-3 font-medium text-ink">
          Stand-ins, until the other nights arrive
          <span className="text-sm font-normal text-walnut">Not live yet</span>
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-walnut">
          Cards, cooking, fishing, tracking, music, and traversal belong to other sessions. This board does not
          rebuild them. A heat says so until that session registers.
        </p>
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {model.modules.map((module) => (
            <li key={module.moduleId} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <span className="font-medium text-ink capitalize">{module.label}</span>
              <span className="text-sm text-walnut">{module.detail}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
