import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Droplets,
  Flame,
  Grid2x2,
  Music,
  PenLine,
  Snowflake,
  Wrench,
} from "lucide-react";
import { CARDS, CARDS_BY_ID } from "@/game/knowledge/cards.ts";
import { runChecks } from "@/game/knowledge/checks.ts";
import {
  absorbUnlocks,
  FEATURED,
  freshDiscovery,
  markHeard,
  markPerformed,
  markRead,
  markSolved,
  nameOf,
} from "@/game/knowledge/collection.ts";
import { createMatch, legalReason, passPhase, playCard } from "@/game/knowledge/fourteen-winters.ts";
import { lootNumber } from "@/game/knowledge/ids.ts";
import { INSTRUMENTS } from "@/game/knowledge/instruments.ts";
import { MANUALS, manualSteps } from "@/game/knowledge/manuals.ts";
import { PIECES } from "@/game/knowledge/music.ts";
import { PUZZLES } from "@/game/knowledge/puzzles.ts";
import { ACTIONS_BY_ID, campBonuses, canRun, freshCamp, ITEM_LABELS } from "@/game/knowledge/recipes.ts";
import { CAPS, frostPressure } from "@/game/knowledge/rules.ts";
import { schedule } from "@/game/knowledge/scheduler.ts";
import { describeEffects } from "@/game/knowledge/speak.ts";
import { validatePath } from "@/game/knowledge/sugar-line.ts";
import type { Board, Camp, Card, Discovery, MatchState, Phase, Suit, SupportedAction } from "@/game/knowledge/types.ts";
import { playScheduled, stopMusic, unlockAudio } from "@/game/knowledge/player.ts";
import { ManualPlate } from "./plate";

type Tab = "winter" | "instrument" | "sugar" | "manual" | "codex";
type Cue = { tab: Tab; id: string; n: number };

const SUIT_ICON = {
  ember: Flame,
  frost: Snowflake,
  sap: Droplets,
  gall: PenLine,
  bone: Wrench,
} as const;

const SUIT_BAR = {
  ember: "bg-heart",
  frost: "bg-fg-subtle",
  sap: "bg-primary",
  gall: "bg-karma-pos",
  bone: "bg-border",
} as const;

const CELL = 44;
const GAP = 4;

export function Satchel({
  stored,
  onStore,
  onClose,
}: {
  stored: Discovery;
  onStore: (next: Discovery) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("winter");
  const [glass, setGlass] = useState(false);
  const [discovery, setDiscoveryState] = useState<Discovery>(stored);
  const [winters, setWinters] = useState<3 | 14>(3);
  const [seed, setSeed] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [cue, setCue] = useState<Cue | null>(null);
  const [match, setMatch] = useState<MatchState>(() =>
    createMatch({ cardIds: FEATURED.cards, winters: 3, seed: 1, shuffle: true }),
  );
  const report = useMemo(() => runChecks(), []);

  function setDiscovery(next: Discovery | ((prev: Discovery) => Discovery)) {
    setDiscoveryState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      onStore(value);
      return value;
    });
  }

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);

  const open = (id: string) => glass || discovery.found.includes(id);

  function openTo(next: Tab, id: string, text?: string) {
    setTab(next);
    setCue({ tab: next, id, n: Date.now() });
    if (text) setNotice(text);
  }

  const waiting =
    discovery.camp.bankedHeat + discovery.camp.frostWard + discovery.camp.mendBonus + discovery.camp.rationBonus > 0;

  function deal(nextWinters = winters) {
    setDiscovery((prev) => {
      const ids = CARDS.filter((card) => glass || prev.found.includes(card.id)).map((card) => card.id);
      const nextSeed = seed + 1;
      setSeed(nextSeed);
      setWinters(nextWinters);
      setMatch(
        createMatch({
          cardIds: ids.length ? ids : FEATURED.cards,
          winters: nextWinters,
          seed: nextSeed,
          shuffle: true,
          bonuses: campBonuses(prev.camp),
        }),
      );
      return {
        ...prev,
        camp: { ...prev.camp, frostWard: 0, bankedHeat: 0, mendBonus: 0, rationBonus: 0 },
      };
    });
    setNotice(null);
  }

  function onPlay(card: Card) {
    const result = playCard(match, card);
    if (!result.ok) return;
    const hints = result.state.hintCharges - match.hintCharges;
    setMatch(result.state);
    const next = absorbUnlocks(discovery, result.state.unlocked);
    if (hints > 0) next.camp.hintCharges += hints;
    const fresh = next.found.find((id) => !discovery.found.includes(id));
    const recipe = next.unlocked.find((id) => !discovery.unlocked.includes(id));
    if (fresh) {
      const n = lootNumber(fresh) ?? 0;
      const dest: Tab = n <= 40 ? "instrument" : n <= 60 ? "sugar" : "manual";
      setNotice(`${nameOf(fresh)} is in the satchel.`);
      setCue({ tab: dest, id: fresh, n: Date.now() });
    } else if (recipe) {
      const manual = MANUALS.find((item) => item.actionId === recipe);
      setNotice(`${nameOf(recipe)} can be performed.`);
      if (manual) setCue({ tab: "manual", id: manual.id, n: Date.now() });
    }
    setDiscovery(next);
  }

  return (
    <div className="absolute inset-0 z-30 overflow-x-hidden overflow-y-auto bg-bg text-fg" onPointerDown={() => unlockAudio()}>
      <header className="border-b border-border bg-bg-elevated">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-sans text-xs tracking-[0.22em] text-primary uppercase">PREINCARNATION</p>
            <h1 className="font-display text-3xl leading-none text-fg sm:text-4xl">Knowledge satchel</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
              {bandLine(discovery)}. Use one and the next in that band unfolds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Stat label="Ledger" value={report.ok ? "80 clear" : `${report.failures.length} faults`} />
            <button
              type="button"
              className="min-h-11 border border-border px-3 text-sm"
              onClick={onClose}
            >
              Back
            </button>
            <button
              type="button"
              className={`min-h-11 border px-3 text-sm ${glass ? "border-primary bg-primary text-primary-fg" : "border-border text-fg"}`}
              onClick={() => setGlass((value) => !value)}
              aria-pressed={glass}
            >
              Archivist glass
            </button>
          </div>
        </div>
        <CampStrip camp={discovery.camp} waiting={waiting} />
        <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-4">
          {(
            [
              ["winter", "Winter"],
              ["instrument", "Instrument"],
              ["sugar", "Sugar-line"],
              ["manual", "Manuals"],
              ["codex", "Codex"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`min-h-11 shrink-0 px-4 text-sm ${tab === id ? "bg-fg text-primary-fg" : "border border-border text-fg"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6">
        {notice && cue && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-primary bg-bg-elevated px-3 py-3">
            <p className="text-sm text-fg">{notice}</p>
            <button
              type="button"
              className="min-h-11 bg-primary px-4 text-sm text-primary-fg"
              onClick={() => {
                setTab(cue.tab);
                setNotice(null);
              }}
            >
              Open it
            </button>
          </div>
        )}
        {tab === "winter" && (
          <Winter
            match={match}
            waiting={waiting}
            winters={winters}
            onPass={() => setMatch(passPhase(match))}
            onPlay={onPlay}
            onDeal={deal}
            survival={report.survival.line}
          />
        )}
        {tab === "instrument" && (
          <Instrument
            open={open}
            camp={discovery.camp}
            heard={discovery.heard}
            cue={cue}
            onHeard={(id) => setDiscovery((prev) => markHeard(prev, id))}
          />
        )}
        {tab === "sugar" && (
          <Sugar
            open={open}
            hints={discovery.camp.hintCharges}
            solved={discovery.solved}
            cue={cue}
            onSpendHint={() =>
              setDiscovery((prev) => ({
                ...prev,
                camp: { ...prev.camp, hintCharges: Math.max(0, prev.camp.hintCharges - 1) },
              }))
            }
            onSolved={(id) => setDiscovery((prev) => markSolved(prev, id))}
            onHear={(id) => openTo("instrument", id)}
          />
        )}
        {tab === "manual" && (
          <ManualDesk
            open={open}
            discovery={discovery}
            glass={glass}
            cue={cue}
            onRead={(id) => setDiscovery((prev) => markRead(prev, id))}
            onPerform={(id) => {
              const action = ACTIONS_BY_ID.get(id);
              if (!action) return;
              setDiscovery((prev) => {
                const camp = action.perform(prev.camp);
                return markPerformed({ ...prev, camp }, id);
              });
            }}
          />
        )}
        {tab === "codex" && (
          <Codex
            discovery={discovery}
            glass={glass}
            reportOk={report.ok}
            failures={report.failures}
            blockers={report.blockers}
            cards={report.cards}
            onOpen={(id) => {
              const n = lootNumber(id) ?? 0;
              if (n >= 21 && n <= 40) openTo("instrument", id);
              else if (n >= 41 && n <= 60) openTo("sugar", id);
              else if (n >= 61) openTo("manual", id);
            }}
            onReset={() => {
              setDiscovery(freshDiscovery());
              setMatch(createMatch({ cardIds: FEATURED.cards, winters: 3, seed: 1, shuffle: true }));
              setSeed(1);
              setWinters(3);
              setNotice(null);
              setCue(null);
              setTab("winter");
            }}
          />
        )}
      </main>
    </div>
  );
}

function bandLine(discovery: Discovery): string {
  const count = (from: number, to: number) =>
    discovery.found.filter((id) => {
      const n = lootNumber(id);
      return n !== null && n >= from && n <= to;
    }).length;
  return `${count(1, 20)}/20 cards, ${count(21, 40)}/20 tunes, ${count(41, 60)}/20 lines, ${count(61, 80)}/20 manuals`;
}

function CampStrip({ camp, waiting }: { camp: Camp; waiting: boolean }) {
  const chips = campChips(camp, waiting);
  if (!chips.length) return null;
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 pb-4">
      {chips.map((chip) => (
        <span key={chip} className="border border-border px-2 py-1 text-xs text-primary">
          {chip}
        </span>
      ))}
    </div>
  );
}

function campChips(camp: Camp, waiting: boolean): string[] {
  const chips: string[] = [];
  if (camp.hintCharges) chips.push(`${camp.hintCharges} sugar hint${camp.hintCharges === 1 ? "" : "s"}`);
  if (camp.shelterToken) chips.push("shelter token");
  if (camp.drumDamp) chips.push("drum head damp");
  for (const [id, cents] of Object.entries(camp.tuningCents)) {
    if (!cents) continue;
    chips.push(`${INSTRUMENTS[id as keyof typeof INSTRUMENTS]?.name ?? id} ${cents > 0 ? "+" : ""}${cents}¢`);
  }
  if (waiting && camp.frostWard) chips.push("frost ward, taken on the next deal");
  if (waiting && camp.bankedHeat) chips.push(`${camp.bankedHeat} heat, taken on the next deal`);
  if (waiting && camp.mendBonus) chips.push("a mend, taken on the next deal");
  if (waiting && camp.rationBonus) chips.push("a ration, taken on the next deal");
  const fresh = freshCamp().pantry;
  for (const [id, n] of Object.entries(camp.pantry)) {
    const made = n - (fresh[id] ?? 0);
    if (made > 0) chips.push(`${ITEM_LABELS[id] ?? id} +${made}`);
  }
  return chips.slice(0, 8);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 border border-border px-3 py-2">
      <div className="text-xs tracking-widest text-fg-muted uppercase">{label}</div>
      <div className="font-display text-lg">{value}</div>
    </div>
  );
}

function Winter({
  match,
  waiting,
  winters,
  onPass,
  onPlay,
  onDeal,
  survival,
}: {
  match: MatchState;
  waiting: boolean;
  winters: 3 | 14;
  onPass: () => void;
  onPlay: (card: Card) => void;
  onDeal: (winters: 3 | 14) => void;
  survival: string[];
}) {
  const pressure = Math.max(0, frostPressure(match.winter) - (match.frostWard > 0 ? 1 : 0));
  const cover = match.shelter + match.shelterToken + match.heat;
  const short = Math.max(0, pressure - (match.shelter + match.shelterToken) - match.heat);
  const legal = match.hand
    .map((id) => CARDS_BY_ID.get(id))
    .filter((card): card is Card => !!card && legalReason(match, card) === null);
  const book = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = book.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [match.log.length]);

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-fg">
              Winter {match.winter} of {match.winters}
            </h2>
            <PhaseRail phase={match.phase} />
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted" aria-live="polite">
              {advice(match, legal)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-11 border border-border px-3 text-sm" onClick={() => onDeal(winters === 3 ? 14 : 3)}>
              Deal {winters === 3 ? "fourteen" : "three"}
            </button>
            <button type="button" className="min-h-11 border border-border px-3 text-sm" onClick={() => onDeal(winters)}>
              Deal again
            </button>
          </div>
        </div>
        {waiting && (
          <p className="mb-3 text-sm text-primary">Banked stores are waiting. Deal again to take them into the match.</p>
        )}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <Meter label="Hearth" value={match.hearth} cap={CAPS.hearth} warn={match.hearth <= 2} />
          <Meter label="Heat" value={match.heat} cap={CAPS.heat} />
          <Meter label="Ration" value={match.ration} cap={CAPS.ration} />
          <Meter label="Ink" value={match.ink} cap={CAPS.ink} />
          <Meter label="Cellar" value={match.cellar} cap={CAPS.cellar} />
          <Meter label="Mend" value={match.mend} cap={CAPS.mend} />
          <Meter label="Shelter" value={match.shelter + match.shelterToken} cap={CAPS.shelter} />
        </div>
        <p className="mb-4 text-sm text-fg-subtle">
          Tonight’s frost is {pressure}
          {match.frostPeek !== null ? ` · scout says the next reads ${match.frostPeek}` : ""}.{" "}
          {match.outcome !== "playing"
            ? "The night is over."
            : short === 0
              ? `Cover is ${cover}. Heat that is not burned carries.`
              : `Still short ${short} before dusk. Shelter first, then heat.`}
        </p>
        {match.outcome !== "playing" && (
          <p className="mb-4 border border-primary bg-bg-elevated px-3 py-3 font-display text-xl">
            {match.outcome === "survived" ? "The hearth held." : `Lost: ${match.lossReason ?? "the winter"}.`}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {match.hand.map((id) => {
            const card = CARDS_BY_ID.get(id);
            if (!card) return null;
            const reason = legalReason(match, card);
            const playable = !reason && match.outcome === "playing";
            return (
              <article key={id} className={`flex flex-col border bg-fg text-primary-fg ${playable ? "border-primary" : "border-border"}`}>
                <div className={`h-1 ${SUIT_BAR[card.suit]}`} />
                <div className="flex flex-1 flex-col p-3">
                  <header className="mb-2 flex items-center justify-between text-xs tracking-widest uppercase">
                    <SuitMark suit={card.suit} />
                    <span>
                      {card.type} · W{card.winterLearned}
                    </span>
                  </header>
                  <h3 className="font-display text-xl leading-tight">{card.name}</h3>
                  <p className="mt-2 font-display text-sm leading-snug italic">{card.flavor}</p>
                  <p className="mt-2 text-xs leading-snug">{describeEffects(card.effects, nameOf)}</p>
                  <p className="mt-2 text-xs text-karma-pos">{costLine(card)}</p>
                  <button
                    type="button"
                    disabled={!playable}
                    className="mt-3 min-h-11 w-full bg-bg px-2 text-sm text-fg disabled:opacity-40"
                    onClick={() => onPlay(card)}
                  >
                    {reason ?? "Play"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <button
          type="button"
          className={`mt-4 min-h-11 px-4 text-sm ${legal.length || match.outcome !== "playing" ? "border border-border" : "bg-primary text-primary-fg"}`}
          disabled={match.outcome !== "playing"}
          onClick={onPass}
        >
          Pass the {match.phase}
        </button>
        <details className="mt-6 text-sm text-fg-muted">
          <summary className="min-h-11 cursor-pointer">A line that keeps a three-night hearth</summary>
          <ol className="mt-2 list-decimal pl-5">
            {survival.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      </div>
      <aside className="border border-border bg-bg-elevated p-4">
        <h3 className="font-display text-lg">Night book</h3>
        <ol ref={book} className="mt-3 max-h-96 space-y-2 overflow-y-auto text-sm">
          {match.log.map((line, index) => (
            <li key={`${index}-${line}`} className={index === match.log.length - 1 ? "text-fg" : "text-fg-muted"}>
              {line}
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

function advice(match: MatchState, legal: Card[]): string {
  if (match.outcome === "survived") return "The hearth held. Deal again, or spend what the nights unlocked.";
  if (match.outcome === "lost") return "The winter took it. Deal again and try the line under the night book.";
  if (!legal.length) return `Nothing in hand plays at ${match.phase}. Pass it.`;
  if (legal.length === 1) return `${legal[0].name} can be played this ${match.phase}.`;
  return `${legal.map((card) => card.name).join(" or ")} can be played this ${match.phase}.`;
}

function costLine(card: Card): string {
  const parts: string[] = [];
  if (card.cost.heat) parts.push(`${card.cost.heat} heat`);
  if (card.cost.ration) parts.push(`${card.cost.ration} ration`);
  if (card.cost.ink) parts.push(`${card.cost.ink} ink`);
  parts.push(card.timing);
  return parts.join(" · ");
}

function PhaseRail({ phase }: { phase: Phase }) {
  const phases: Phase[] = ["dawn", "day", "dusk"];
  return (
    <ol className="mt-2 flex flex-wrap gap-2 text-xs tracking-widest uppercase">
      {phases.map((item) => (
        <li key={item} className={item === phase ? "bg-primary px-2 py-1 text-primary-fg" : "border border-border px-2 py-1 text-fg-muted"}>
          {item}
        </li>
      ))}
    </ol>
  );
}

function Meter({ label, value, cap, warn }: { label: string; value: number; cap: number; warn?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / cap) * 100));
  return (
    <div className="border border-border px-2 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs tracking-widest text-fg-muted uppercase">{label}</div>
        <div className="font-display text-lg leading-none">{value}</div>
      </div>
      <div className="mt-2 h-1 bg-border">
        <div className={`h-1 ${warn ? "bg-primary" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SuitMark({ suit }: { suit: Suit }) {
  const Icon = SUIT_ICON[suit];
  return (
    <span className="inline-flex items-center gap-1">
      <Icon size={14} aria-hidden />
      {suit}
    </span>
  );
}

function Instrument({
  open,
  camp,
  heard,
  cue,
  onHeard,
}: {
  open: (id: string) => boolean;
  camp: Discovery["camp"];
  heard: string[];
  cue: Cue | null;
  onHeard: (id: string) => void;
}) {
  const [active, setActive] = useState(PIECES[0].id);
  const [playing, setPlaying] = useState<{ id: string; n: number; seconds: number } | null>(null);
  const token = useRef(0);
  const piece = PIECES.find((item) => item.id === active) ?? PIECES[0];
  const scheduled = schedule(piece);
  const inst = INSTRUMENTS[piece.instrument];
  const cents = camp.tuningCents[piece.instrument] ?? 0;
  const notes = scheduled.ok ? scheduled.notes : [];
  const seconds = scheduled.ok ? scheduled.seconds : 1;

  useEffect(() => {
    if (cue?.tab === "instrument") setActive(cue.id);
  }, [cue]);

  function play() {
    const mine = ++token.current;
    const length = playScheduled(piece, {
      cents,
      damp: camp.drumDamp,
      onEnded: () => {
        if (token.current !== mine) return;
        setPlaying(null);
        onHeard(piece.id);
      },
    });
    setPlaying({ id: piece.id, n: mine, seconds: length || seconds });
  }

  function halt() {
    token.current += 1;
    stopMusic();
    setPlaying(null);
  }

  const live = playing?.id === piece.id;

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
        {PIECES.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={!open(item.id)}
              className={`min-h-11 w-full border px-3 text-left text-sm disabled:opacity-40 ${item.id === piece.id ? "border-primary bg-fg text-primary-fg" : "border-border"}`}
              onClick={() => setActive(item.id)}
            >
              <span className="text-fg-muted">{String(lootNumber(item.id) ?? index + 1).padStart(2, "0")}</span> {open(item.id) ? item.title : "Still folded"}
              {heard.includes(item.id) ? <span className="text-karma-pos"> · heard</span> : ""}
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 border border-border bg-bg-elevated p-4">
        <p className="text-xs tracking-widest text-primary uppercase">{inst.name}</p>
        <h2 className="font-display text-3xl">{piece.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{piece.note}</p>
        <p className="mt-1 text-sm text-fg-muted">
          {piece.tempoBpm} bpm · {piece.beatsPerBar}/4 feel · {piece.scaleName}
          {cents ? ` · sounding ${cents > 0 ? "+" : ""}${cents} cents from the manual` : ""}
          {camp.drumDamp && piece.instrument === "frame-drum" ? " · head damp" : ""}
        </p>
        <div className="relative mt-4 h-28 overflow-hidden border border-border bg-bg" aria-hidden>
          {notes.map((note, index) => (
            <span
              key={`${note.startSec}-${note.midi}-${index}`}
              className="absolute bg-primary"
              style={{
                left: `${(note.startSec / seconds) * 100}%`,
                width: `${Math.max(0.8, ((note.endSec - note.startSec) / seconds) * 100)}%`,
                bottom: `${8 + ((note.midi % 24) / 24) * 62}%`,
                height: "16%",
              }}
              title={`${note.midi} at ${note.startSec.toFixed(2)}s`}
            />
          ))}
          {live && playing && (
            <span key={playing.n} className="knowledge-playhead" style={{ animationDuration: `${playing.seconds}s` }} />
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="inline-flex min-h-11 items-center gap-2 bg-primary px-4 text-sm text-primary-fg" onClick={play}>
            <Music size={16} aria-hidden /> {live ? "Play again" : "Play"}
          </button>
          <button type="button" className="min-h-11 border border-border px-4 text-sm" onClick={halt}>
            Stop
          </button>
          {heard.includes(piece.id) && <p className="self-center text-sm text-karma-pos">Heard. The next tune is unfolded.</p>}
        </div>
      </div>
    </section>
  );
}

function Sugar({
  open,
  hints,
  solved,
  cue,
  onSpendHint,
  onSolved,
  onHear,
}: {
  open: (id: string) => boolean;
  hints: number;
  solved: string[];
  cue: Cue | null;
  onSpendHint: () => void;
  onSolved: (id: string) => void;
  onHear: (id: string) => void;
}) {
  const visible = PUZZLES.filter((board) => open(board.id));
  const [active, setActive] = useState(visible[0]?.id ?? PUZZLES[0].id);
  const board = PUZZLES.find((item) => item.id === active) ?? PUZZLES[0];
  const [path, setPath] = useState<Array<[number, number]>>([]);
  const [hintCell, setHintCell] = useState<string | null>(null);
  const [message, setMessage] = useState("Start on the tap. Visit every sugar. End on the hearth. Do not cross yourself.");
  const locked = !open(board.id);
  const cols = board.rows[0]?.length ?? 1;
  const stride = CELL + GAP;
  const width = cols * stride - GAP;
  const height = board.rows.length * stride - GAP;
  const sugarTotal = board.rows.join("").split("").filter((cell) => cell === "S").length;
  const sugarHit = path.filter(([r, c]) => board.rows[r]?.[c] === "S").length;

  useEffect(() => {
    if (cue?.tab !== "sugar") return;
    setActive(cue.id);
    setPath([]);
    setHintCell(null);
  }, [cue]);

  function choose(next: Board) {
    setActive(next.id);
    setPath([]);
    setHintCell(null);
    setMessage(next.blurb);
  }

  function tap(r: number, c: number) {
    if (locked) return;
    const cell = board.rows[r][c];
    if (cell === "#") return;
    setHintCell(null);
    if (!path.length) {
      if (cell !== "A") {
        setMessage("Start on the tap.");
        return;
      }
      setPath([[r, c]]);
      return;
    }
    const [lr, lc] = path[path.length - 1];
    if (lr === r && lc === c) {
      setPath(path.slice(0, -1));
      return;
    }
    if (Math.abs(lr - r) + Math.abs(lc - c) !== 1) return;
    if (path.some(([pr, pc]) => pr === r && pc === c)) return;
    setPath([...path, [r, c]]);
  }

  function submit() {
    const reasons = validatePath(board.rows, path, true);
    if (reasons.length) {
      setMessage(reasons[0]);
      return;
    }
    setMessage("The line holds. Its tune is waiting.");
    onSolved(board.id);
  }

  function hint() {
    if (hints <= 0) return;
    const known = new Set(path.map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < board.rows.length; r++) {
      for (let c = 0; c < board.rows[r].length; c++) {
        if (board.rows[r][c] === "S" && !known.has(`${r},${c}`)) {
          setHintCell(`${r},${c}`);
          onSpendHint();
          setMessage("One sugar is marked. The rest of the line is still yours.");
          return;
        }
      }
    }
  }

  const held = solved.includes(board.id);

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
        {PUZZLES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`min-h-11 w-full border px-3 text-left text-sm ${item.id === board.id ? "border-primary bg-fg text-primary-fg" : "border-border"}`}
              onClick={() => choose(item)}
            >
              {open(item.id) ? item.title : "Sealed board"}
              {solved.includes(item.id) ? " · held" : ""}
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0">
        <h2 className="font-display text-3xl">{locked ? "Sealed" : board.title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted" aria-live="polite">
          {locked ? "Solve or scout the board ahead of this one." : message}
        </p>
        {!locked && (
          <p className="mt-1 text-sm text-primary">
            {sugarHit} of {sugarTotal} sugars on the line
          </p>
        )}
        <div className="relative mt-4 max-w-full overflow-x-auto">
          <div className="relative" style={{ width, height }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, ${CELL}px)` }}>
              {board.rows.map((row, r) =>
                [...row].map((cell, c) => {
                  const onPath = path.findIndex(([pr, pc]) => pr === r && pc === c);
                  const hinted = hintCell === `${r},${c}`;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      aria-label={cell === "#" ? "wall" : cell === "A" ? "tap" : cell === "H" ? "hearth" : cell === "S" ? "sugar" : "open"}
                      disabled={locked || cell === "#"}
                      onClick={() => tap(r, c)}
                      className={`h-11 w-11 border text-sm ${
                        cell === "#"
                          ? "border-transparent bg-bg"
                          : onPath >= 0
                            ? "border-primary bg-primary text-primary-fg"
                            : hinted
                              ? "border-primary bg-fg text-primary-fg"
                              : "border-border bg-fg text-primary-fg"
                      }`}
                    >
                      {onPath >= 0 ? onPath + 1 : cell === "A" ? "Tap" : cell === "H" ? "End" : cell === "S" ? "S" : ""}
                    </button>
                  );
                }),
              )}
            </div>
            {path.length > 1 && (
              <svg className="pointer-events-none absolute inset-0 text-primary-fg" width={width} height={height} aria-hidden>
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={path.map(([r, c]) => `${c * stride + CELL / 2},${r * stride + CELL / 2}`).join(" ")}
                />
              </svg>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 bg-primary px-4 text-sm text-primary-fg" disabled={locked} onClick={submit}>
            Try the line
          </button>
          <button type="button" className="min-h-11 border border-border px-4 text-sm" disabled={hints <= 0 || locked} onClick={hint}>
            Spend a hint ({hints})
          </button>
          <button
            type="button"
            className="min-h-11 border border-border px-4 text-sm"
            onClick={() => {
              setPath([]);
              setHintCell(null);
            }}
          >
            Lift the line
          </button>
          {held && !locked && (
            <button type="button" className="min-h-11 border border-primary px-4 text-sm text-primary" onClick={() => onHear(board.bindsMusicId)}>
              Hear {nameOf(board.bindsMusicId)}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ManualDesk({
  open,
  discovery,
  glass,
  cue,
  onRead,
  onPerform,
}: {
  open: (id: string) => boolean;
  discovery: Discovery;
  glass: boolean;
  cue: Cue | null;
  onRead: (id: string) => void;
  onPerform: (id: string) => void;
}) {
  const visible = MANUALS.filter((manual) => open(manual.id));
  const [active, setActive] = useState(visible[0]?.id ?? MANUALS[0].id);
  const manual = MANUALS.find((item) => item.id === active) ?? MANUALS[0];
  const action = ACTIONS_BY_ID.get(manual.actionId);
  const known = glass || discovery.read.includes(manual.id) || discovery.unlocked.includes(manual.actionId);
  const steps = action ? manualSteps(manual, action) : [];
  const [log, setLog] = useState("");
  const missing = action ? shortOf(action, discovery.camp) : null;

  useEffect(() => {
    if (cue?.tab === "manual") {
      setActive(cue.id);
      setLog("");
    }
  }, [cue]);

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
        {MANUALS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`min-h-11 w-full border px-3 text-left text-sm ${item.id === manual.id ? "border-primary bg-fg text-primary-fg" : "border-border"}`}
              onClick={() => {
                setActive(item.id);
                setLog("");
              }}
            >
              <BookOpen size={14} className="mr-2 inline" aria-hidden />
              {open(item.id) ? item.title : "Unread spine"}
              {discovery.read.includes(item.id) ? " · read" : ""}
            </button>
          </li>
        ))}
      </ul>
      <article className="min-w-0 bg-fg p-4 text-primary-fg sm:p-6">
        {!open(manual.id) || !action ? (
          <p>This manual is still in the pack. Read the one before it, or play the card that inscribes it.</p>
        ) : (
          <>
            <ManualPlate motif={manual.motif} title={manual.title} />
            <p className="mt-4 text-xs tracking-widest text-karma-pos uppercase">{action.station}</p>
            <h2 className="font-display text-3xl">{manual.title}</h2>
            <p className="mt-1 text-sm leading-relaxed">
              Unlocks {action.name}. {action.kind === "recipe" ? "A recipe." : "A camp practice."}
            </p>
            <ol className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <li key={step.heading}>
                  <h3 className="font-display text-lg">
                    {index + 1}. {step.heading}
                  </h3>
                  <p className="text-sm leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {action.inputs.map((input) => {
                const have = discovery.camp.pantry[input.id] ?? 0;
                const short = have < input.n;
                return (
                  <span key={input.id} className={`border px-2 py-1 ${short ? "border-primary" : "border-primary-fg"}`}>
                    {ITEM_LABELS[input.id] ?? input.id} {have}/{input.n}
                  </span>
                );
              })}
              {action.tools.map((id) => (
                <span key={id} className="border border-primary-fg px-2 py-1">
                  tool {ITEM_LABELS[id] ?? id}
                </span>
              ))}
              {action.outputs.map((output) => (
                <span key={output.id} className="border border-karma-pos px-2 py-1">
                  makes {ITEM_LABELS[output.id] ?? output.id} ×{output.n}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!known && (
                <button type="button" className="min-h-11 bg-bg px-4 text-sm text-fg" onClick={() => onRead(manual.id)}>
                  Read and unlock
                </button>
              )}
              <button
                type="button"
                className="min-h-11 bg-primary px-4 text-sm text-primary-fg disabled:opacity-40"
                disabled={!known || !canRun(action, discovery.camp)}
                onClick={() => {
                  onPerform(action.id);
                  setLog(action.resultPhrase);
                }}
              >
                {known && missing ? `Short on ${missing}` : "Perform"}
              </button>
            </div>
            {log && <p className="mt-3 text-sm leading-relaxed">{log}</p>}
            {discovery.performed.includes(action.id) && <p className="mt-2 text-sm text-karma-pos">Performed. The camp has changed.</p>}
          </>
        )}
      </article>
    </section>
  );
}

function shortOf(action: SupportedAction, camp: Camp): string | null {
  const needs = [...action.inputs, ...action.tools.map((id) => ({ id, n: 1 }))];
  for (const input of needs) {
    if ((camp.pantry[input.id] ?? 0) < input.n) return ITEM_LABELS[input.id] ?? input.id;
  }
  return null;
}

function Codex({
  discovery,
  glass,
  reportOk,
  failures,
  blockers,
  cards,
  onOpen,
  onReset,
}: {
  discovery: Discovery;
  glass: boolean;
  reportOk: boolean;
  failures: string[];
  blockers: string[];
  cards: Array<{ id: string; name: string; value: number; ratio: number }>;
  onOpen: (id: string) => void;
  onReset: () => void;
}) {
  const [kind, setKind] = useState("All");
  const [query, setQuery] = useState("");
  const rows = [
    ...CARDS.map((card) => ({ id: card.id, kind: "Card", name: card.name, use: describeEffects(card.effects, nameOf) })),
    ...PIECES.map((piece) => ({ id: piece.id, kind: "Music", name: piece.title, use: `${INSTRUMENTS[piece.instrument].name} · ${piece.note}` })),
    ...PUZZLES.map((board) => ({ id: board.id, kind: "Sugar-line", name: board.title, use: board.blurb })),
    ...MANUALS.map((manual) => ({ id: manual.id, kind: "Manual", name: manual.title, use: ACTIONS_BY_ID.get(manual.actionId)?.resultPhrase ?? "" })),
  ];
  const needle = query.trim().toLowerCase();
  const shown = rows.filter((row) => {
    if (kind !== "All" && row.kind !== kind) return false;
    if (!needle) return true;
    return `${row.name} ${row.use} ${row.kind}`.toLowerCase().includes(needle);
  });
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">{reportOk ? "All eighty records hold." : "The ledger found faults."}</h2>
        <button type="button" className="min-h-11 border border-border px-3 text-sm" onClick={onReset}>
          Empty the satchel
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "Card", "Music", "Sugar-line", "Manual"].map((item) => (
          <button
            key={item}
            type="button"
            className={`min-h-11 px-3 text-sm ${kind === item ? "bg-fg text-primary-fg" : "border border-border"}`}
            onClick={() => setKind(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the eighty"
        className="mb-4 min-h-11 w-full border border-border bg-bg-elevated px-3 text-sm text-fg"
        aria-label="Search the eighty"
      />
      {failures.length > 0 && (
        <ul className="mb-4 text-sm text-primary">
          {failures.map((failure) => (
            <li key={failure}>{failure}</li>
          ))}
        </ul>
      )}
      <ul className="divide-y divide-border border border-border">
        {shown.map((row) => {
          const n = lootNumber(row.id);
          const found = glass || discovery.found.includes(row.id);
          const ratio = cards.find((card) => card.id === row.id);
          const jump = row.kind !== "Card";
          return (
            <li key={row.id}>
              <button
                type="button"
                disabled={!found || !jump}
                className="flex w-full flex-col gap-1 px-3 py-3 text-left disabled:opacity-60 sm:flex-row sm:items-baseline sm:gap-4"
                onClick={() => onOpen(row.id)}
              >
                <span className="w-16 shrink-0 text-xs tracking-widest text-fg-muted uppercase">
                  {n !== null ? String(n).padStart(3, "0") : ""} {row.kind}
                </span>
                <span className="min-w-0">
                  <span className="font-display text-lg">{found ? row.name : "Still packed"}</span>
                  <span className="ml-2 text-xs text-primary">{discovery.found.includes(row.id) ? "found" : "packed"}</span>
                  {ratio ? <span className="ml-2 text-xs text-fg-muted">ratio {ratio.ratio.toFixed(2)}</span> : null}
                  <span className="mt-1 block text-sm text-fg-muted">{found ? row.use : "Use the one ahead of it."}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="mt-4 text-sm text-fg-muted">Nothing in the satchel matches.</p>}
      <details className="mt-4 text-sm text-fg-muted">
        <summary className="min-h-11 cursor-pointer">Where this satchel is still waiting on the camp</summary>
        <ul className="mt-2 space-y-2">
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      </details>
      <p className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
        <Grid2x2 size={14} aria-hidden /> A tune, a line, or a manual opens the next one in its band. Cards stay in the winter deal.
      </p>
    </section>
  );
}
