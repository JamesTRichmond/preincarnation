import { useCallback, useEffect, useRef, useState } from "react";
import { createGame, type GameHandle } from "@/game/engine";
import {
  afterlifeCopy,
  BACKGROUNDS,
  BONDS,
  FLAWS,
  fillIntroBeat,
  IDEALS,
  INTRO_BEATS,
  LIMBO_UPGRADES,
  OBJECTIVES,
  SKILL_TRAITS,
  traitById,
  ENDING_LINES,
} from "@/game/content";
import type { UiSnapshot } from "@/game/types";
import { DEFAULT_CHARACTER, DEFAULT_FLAGS, DEFAULT_UPGRADES, EMPTY_LEDGER } from "@/game/types";
import {
  LOCALES,
  message,
  readLocale,
  writeLocale,
  type LocaleId,
  type Translate,
} from "@/game/locale";

const EMPTY: UiSnapshot = {
  mode: "title",
  hp: 3,
  maxHp: 3,
  mp: 8,
  maxMp: 8,
  karma: 0,
  crowns: 0,
  cycle: 0,
  incarnation: "wanderer",
  bombs: 0,
  objective: "",
  interactHint: null,
  dialogue: null,
  shake: true,
  reducedMotion: false,
  message: null,
  flags: DEFAULT_FLAGS,
  upgrades: DEFAULT_UPGRADES,
  endingBeat: 0,
  muted: false,
  showHelp: false,
  townName: "Middlebury",
  weatherName: "…",
  tempF: null,
  weaponName: "Short iron",
  weaponTags: "2x",
  geoLine: null,
  bottles: ["empty", "empty"],
  tropoverse: false,
  year: 2026,
  clock: "21:00",
  yName: "—",
  arrows: 0,
  keys: 0,
  zoom: 1,
  lifePath: "adventurer",
  night: false,
  charge: 0,
  showControls: false,
  spectrumReady: false,
  deckTitle: null,
  deckPlaying: false,
  deckHasTrack: false,
  deckPosition: 0,
  deckDuration: 0,
  character: DEFAULT_CHARACTER,
  afterlifeHost: null,
  introBeat: 0,
  job: OBJECTIVES.job,
  lastDeed: "",
  cycleLedger: EMPTY_LEDGER,
};

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [ui, setUi] = useState<UiSnapshot>(EMPTY);
  const [hasSave, setHasSave] = useState(false);
  const [locale, setLocale] = useState<LocaleId>("en");
  const stickRef = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const tr = useCallback<Translate>(
    (id, vars, count) => message(locale, id, vars, count),
    [locale],
  );
  const pickLocale = useCallback((id: LocaleId) => {
    writeLocale(id, window.localStorage);
    setLocale(id);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const g = createGame(el, setUi);
    gameRef.current = g;
    setHasSave(g.hasSave());
    return () => g.dispose();
  }, []);

  useEffect(() => {
    setLocale(readLocale(window.localStorage));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (ui.mode !== "intro") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      gameRef.current?.advanceIntro();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.mode, ui.introBeat]);

  const resetStick = useCallback((pad: HTMLDivElement) => {
    origin.current = null;
    gameRef.current?.setVirtual({ stick: { x: 0, y: 0 } });
    const knob = pad.querySelector("[data-knob]") as HTMLElement | null;
    if (knob) knob.style.transform = "translate(-50%, -50%)";
  }, []);

  const onStick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gameRef.current;
      const pad = stickRef.current;
      if (!g || !pad) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = rect.width / 2;

      if (e.type === "pointerdown") {
        origin.current = { x: cx, y: cy };
      }

      if (
        e.type === "pointerup" ||
        e.type === "pointercancel" ||
        e.type === "pointerleave" ||
        e.type === "lostpointercapture"
      ) {
        resetStick(pad);
        return;
      }

      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist > radius * 0.96) {
        try {
          pad.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        resetStick(pad);
        return;
      }

      let sx = (e.clientX - cx) / (radius * 0.62);
      let sy = (e.clientY - cy) / (radius * 0.62);
      const m = Math.hypot(sx, sy);
      if (m < 0.32) {
        sx = 0;
        sy = 0;
      } else if (m > 1) {
        sx /= m;
        sy /= m;
      }
      g.setVirtual({ stick: { x: sx, y: sy } });
      const knob = pad.querySelector("[data-knob]") as HTMLElement | null;
      if (knob) {
        knob.style.transform = `translate(calc(-50% + ${sx * 26}px), calc(-50% + ${sy * 26}px))`;
      }
    },
    [resetStick],
  );

  const hold = (key: "attack" | "interact" | "release" | "bomb" | "dash" | "use", v: boolean) => {
    gameRef.current?.setVirtual({ [key]: v });
  };

  const playing = ui.mode === "play";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ imageRendering: "pixelated", cursor: "crosshair" }}
        aria-label={tr("canvas.label")}
      />

      {ui.mode === "title" && (
        <Title
          hasSave={hasSave}
          locale={locale}
          tr={tr}
          onPickLocale={pickLocale}
          onNew={() => gameRef.current?.startNew()}
          onContinue={() => gameRef.current?.continueGame()}
        />
      )}

      {ui.mode === "create" && (
        <CreateScreen tr={tr} onCommit={(draft) => gameRef.current?.commitCreate(draft)} />
      )}

      {ui.mode === "intro" && (
        <IntroScreen ui={ui} tr={tr} onNext={() => gameRef.current?.advanceIntro()} />
      )}

      {playing && (
        <div className="pointer-events-none absolute top-[max(2.75rem,env(safe-area-inset-top))] left-1/2 z-10 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 text-center">
          <span className="inline-block rounded-full bg-bg-elevated/90 px-3 py-1 font-mono text-[10px] tracking-widest text-primary uppercase ring-1 ring-border/80">
            {ui.job}
          </span>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-fg-subtle">
            {ui.character.name} · {traitById(BACKGROUNDS, ui.character.backgroundId).name}
          </p>
        </div>
      )}

      {playing && ui.objective && (
        <p className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 text-center font-mono text-[11px] tracking-wide text-fg-subtle">
          {ui.interactHint ?? ui.message ?? ui.objective}
        </p>
      )}

      {ui.mode === "dialogue" && ui.dialogue && (
        <DialoguePanel node={ui.dialogue} tr={tr} onChoose={(i) => gameRef.current?.choose(i)} />
      )}

      {(ui.mode === "pause" || ui.showHelp) &&
        ui.mode !== "title" &&
        ui.mode !== "create" &&
        ui.mode !== "intro" &&
        ui.mode !== "limbo" &&
        ui.mode !== "ending" &&
        ui.mode !== "ipod" && (
          <Pause
            ui={ui}
            locale={locale}
            tr={tr}
            onPickLocale={pickLocale}
            onResume={() => gameRef.current?.resume()}
            onShake={(v) => gameRef.current?.setShake(v)}
            onMute={() => gameRef.current?.toggleMute()}
            onCycle={() => gameRef.current?.cycleWeapon()}
            onControls={(v) => gameRef.current?.setShowControls(v)}
            onReset={() => {
              gameRef.current?.reset();
              setHasSave(false);
            }}
          />
        )}

      {ui.mode === "limbo" && (
        <Afterlife
          ui={ui}
          tr={tr}
          onBuy={(k) => gameRef.current?.spendSkill(k)}
          onBirth={() => gameRef.current?.reincarnate()}
        />
      )}

      {ui.mode === "ipod" && (
        <IpodDeck
          ui={ui}
          tr={tr}
          onClose={() => gameRef.current?.closeIpod()}
          onFeed={(file) => void gameRef.current?.feedDeck(file)}
          onPlay={() => void gameRef.current?.playDeck()}
          onPause={() => gameRef.current?.pauseDeck()}
          onSeek={(t) => gameRef.current?.seekDeck(t)}
        />
      )}

      {ui.mode === "ending" && (
        <Ending beat={ui.endingBeat} tr={tr} onWalk={() => gameRef.current?.reincarnate()} />
      )}

      {playing && ui.deckHasTrack && (
        <DeckChip
          ui={ui}
          tr={tr}
          onPlay={() => void gameRef.current?.playDeck()}
          onPause={() => gameRef.current?.pauseDeck()}
          onLid={() => gameRef.current?.openIpod()}
        />
      )}

      {playing && (
        <>
          <button
            type="button"
            onClick={() => gameRef.current?.pause()}
            className="absolute top-[max(0.4rem,env(safe-area-inset-top))] right-3 z-10 h-8 rounded-full bg-bg-elevated/70 px-3 font-mono text-[10px] tracking-widest text-fg-subtle uppercase ring-1 ring-border/80"
          >
            {tr("menu")}
          </button>
          {ui.showControls && (
            <TouchPad
              stickRef={stickRef}
              tr={tr}
              onStick={onStick}
              hold={hold}
              onPause={() => gameRef.current?.pause()}
              onCycle={() => gameRef.current?.cycleWeapon()}
              onFar={() => gameRef.current?.setZoom(0.55)}
              onNear={() => gameRef.current?.setZoom(1)}
            />
          )}
        </>
      )}
    </main>
  );
}

function Title({
  hasSave,
  locale,
  tr,
  onPickLocale,
  onNew,
  onContinue,
}: {
  hasSave: boolean;
  locale: LocaleId;
  tr: Translate;
  onPickLocale: (id: LocaleId) => void;
  onNew: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 font-mono text-xs tracking-[0.28em] text-primary uppercase">
        {tr("title.kicker")}
      </p>
      <h1 className="font-display text-5xl font-semibold tracking-tight text-fg sm:text-7xl">
        PREINCARNATION
      </h1>
      <p className="mt-4 max-w-md text-lg text-fg-muted">{tr("title.pitch")}</p>
      <p className="mt-2 max-w-sm text-sm text-fg-subtle">{tr("title.steps")}</p>
      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <GoldButton onClick={onNew}>{tr("title.begin")}</GoldButton>
        {hasSave && (
          <button
            type="button"
            onClick={onContinue}
            className="h-12 rounded-[12px] border border-border bg-bg-elevated text-base font-medium text-fg"
          >
            {tr("title.continue")}
          </button>
        )}
      </div>
      <LanguageSwitch locale={locale} tr={tr} onPick={onPickLocale} />
      <p className="mt-8 max-w-md text-sm text-fg-subtle">{tr("title.then")}</p>
    </section>
  );
}

function Pause({
  ui,
  locale,
  tr,
  onPickLocale,
  onResume,
  onShake,
  onMute,
  onCycle,
  onControls,
  onReset,
}: {
  ui: UiSnapshot;
  locale: LocaleId;
  tr: Translate;
  onPickLocale: (id: LocaleId) => void;
  onResume: () => void;
  onShake: (v: boolean) => void;
  onMute: () => void;
  onCycle: () => void;
  onControls: (v: boolean) => void;
  onReset: () => void;
}) {
  const row = (action: string, key: string, touch: string) => (
    <tr className="border-t border-border">
      <td className="px-3 py-2">{tr(action)}</td>
      <td className="px-3 py-2 font-mono">{tr(key)}</td>
      <td className="px-3 py-2">{tr(touch)}</td>
    </tr>
  );
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/80 p-4">
      <div className="max-h-[min(92dvh,44rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-bg-elevated p-6 ring-1 ring-border">
        <h2 className="font-display text-3xl">
          {ui.showHelp ? tr("pause.help") : tr("pause.paused")}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {tr("pause.who", {
            name: ui.character.name,
            background: traitById(BACKGROUNDS, ui.character.backgroundId).name,
            town: ui.townName,
            cycle: ui.cycle,
          })}
        </p>
        <p className="mt-2 text-sm text-fg">{ui.job}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-fg-subtle">{tr("label.bond")}</dt>
          <dd className="text-fg">{traitById(BONDS, ui.character.bondId).name}</dd>
          <dt className="text-fg-subtle">{tr("label.ideal")}</dt>
          <dd className="text-fg">{traitById(IDEALS, ui.character.idealId).name}</dd>
          <dt className="text-fg-subtle">{tr("label.flaw")}</dt>
          <dd className="text-fg">{traitById(FLAWS, ui.character.flawId).name}</dd>
          <dt className="text-fg-subtle">{tr("label.skill")}</dt>
          <dd className="font-mono text-primary">
            {tr("pause.pts", { count: ui.character.skillPoints }, ui.character.skillPoints)}
          </dd>
        </dl>
        <p className="mt-2 text-sm text-fg">
          {ui.weaponName} <span className="font-mono text-xs text-primary">{ui.weaponTags}</span>
        </p>

        <h3 className="mt-5 font-display text-xl">{tr("heading.move")}</h3>
        <ul className="mt-2 space-y-1 text-sm text-fg-muted">
          <li>{tr("move.keys")}</li>
          <li>{tr("move.pointer")}</li>
          <li>{tr("move.click")}</li>
          <li>{tr("move.pad")}</li>
        </ul>

        <h3 className="mt-4 font-display text-xl">{tr("heading.act")}</h3>
        <div className="mt-2 overflow-hidden rounded-[12px] ring-1 ring-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-fg-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">{tr("table.action")}</th>
                <th className="px-3 py-2 font-medium">{tr("table.key")}</th>
                <th className="px-3 py-2 font-medium">{tr("table.touch")}</th>
              </tr>
            </thead>
            <tbody className="text-fg">
              {row("act.slash", "key.space", "touch.slash")}
              {row("act.y", "key.y", "touch.none")}
              {row("act.talk", "key.talk", "touch.talk")}
              {row("act.sip", "key.v", "touch.sip")}
              {row("act.cycle", "key.q", "touch.arm")}
              {row("act.zoom", "key.zoom", "touch.zoom")}
              {row("act.release", "key.release", "touch.holdRelease")}
              {row("act.bomb", "key.bomb", "touch.bomb")}
              {row("act.dash", "key.shift", "touch.dash")}
              {row("act.pause", "key.pause", "touch.pause")}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-fg-muted">{tr("pause.note")}</p>

        <h3 className="mt-5 font-display text-xl">{tr("heading.settings")}</h3>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={() => onControls(!ui.showControls)}
          >
            {tr(ui.showControls ? "settings.touch.on" : "settings.touch.off")}
          </button>
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={onCycle}
          >
            {tr("settings.weapon")}
          </button>
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={() => onShake(!ui.shake)}
          >
            {tr(ui.shake ? "settings.shake.on" : "settings.shake.off")}
          </button>
          <button type="button" className="h-11 rounded-[12px] ring-1 ring-border" onClick={onMute}>
            {tr(ui.muted ? "settings.sound.muted" : "settings.sound.on")}
          </button>
          <button
            type="button"
            className="h-11 rounded-[12px] text-danger ring-1 ring-border"
            onClick={onReset}
          >
            {tr("settings.forget")}
          </button>
        </div>
        <LanguageSwitch locale={locale} tr={tr} onPick={onPickLocale} review />

        <div className="mt-6">
          <GoldButton onClick={onResume}>
            {ui.showHelp ? tr("pause.walk") : tr("pause.resume")}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}

function DialoguePanel({
  node,
  tr,
  onChoose,
}: {
  node: NonNullable<UiSnapshot["dialogue"]>;
  tr: Translate;
  onChoose: (i: number) => void;
}) {
  const choices = node.choices ?? [{ label: tr("dialogue.continue"), next: "end" as const }];
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-2xl rounded-[28px] bg-bg-elevated p-5 ring-1 ring-border">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-fg">{node.speaker}</h2>
          {node.entropy != null && (
            <p className="font-mono text-xs text-fg-subtle">
              {tr("dialogue.entropy", { percent: Math.round(node.entropy * 100) })}
            </p>
          )}
        </div>
        <p className="mt-3 text-base leading-relaxed text-fg-muted">{node.text}</p>
        <div className="mt-4 flex flex-col gap-2">
          {choices.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onChoose(choices.indexOf(c))}
              className="min-h-12 rounded-[12px] bg-bg px-4 py-3 text-left text-base text-fg ring-1 ring-border hover:ring-primary"
            >
              {c.label}
              {c.note && <span className="ml-2 font-mono text-xs text-primary">{c.note}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateScreen({
  tr,
  onCommit,
}: {
  tr: Translate;
  onCommit: (draft: {
    name: string;
    backgroundId: string;
    bondId: string;
    idealId: string;
    flawId: string;
    spends: Partial<
      Record<"vitality" | "edge" | "stride" | "sight" | "shadowStep" | "wraithBond", number>
    >;
  }) => void;
}) {
  const [name, setName] = useState(DEFAULT_CHARACTER.name);
  const [backgroundId, setBackgroundId] = useState(DEFAULT_CHARACTER.backgroundId);
  const [bondId, setBondId] = useState(DEFAULT_CHARACTER.bondId);
  const [idealId, setIdealId] = useState(DEFAULT_CHARACTER.idealId);
  const [flawId, setFlawId] = useState(DEFAULT_CHARACTER.flawId);
  const [spends, setSpends] = useState<Record<string, number>>({});
  const used = Object.values(spends).reduce((a, n) => a + n, 0);
  const left = Math.max(0, 3 - used);

  const bump = (key: string, dir: 1 | -1) => {
    setSpends((prev) => {
      const cur = prev[key] ?? 0;
      const def = SKILL_TRAITS.find((s) => s.key === key);
      const max = def?.max ?? 1;
      const next = Math.max(0, Math.min(max, cur + dir));
      if (dir > 0 && left <= 0) return prev;
      return { ...prev, [key]: next };
    });
  };

  const pick = (
    title: string,
    list: typeof BACKGROUNDS,
    value: string,
    set: (id: string) => void,
  ) => (
    <div>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((t) => {
          const on = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => set(t.id)}
              className={
                on
                  ? "min-h-11 rounded-md bg-bg-subtle p-4 text-left ring-1 ring-primary"
                  : "min-h-11 rounded-md bg-bg-elevated p-4 text-left ring-1 ring-border"
              }
            >
              <p className="font-display text-xl">{t.name}</p>
              <p className="mt-1 text-sm text-fg-muted">{t.blurb}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="absolute inset-0 z-20 overflow-y-auto bg-bg/95 px-4 py-8">
      <div className="mx-auto max-w-3xl pb-10">
        <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">
          {tr("create.kicker")}
        </p>
        <h1 className="mt-2 font-display text-4xl">{tr("create.title")}</h1>
        <p className="mt-2 max-w-xl text-fg-muted">{tr("create.lead")}</p>

        <label className="mt-8 block">
          <span className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
            {tr("create.name")}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            className="mt-2 h-12 w-full rounded-md bg-bg-elevated px-4 text-lg text-fg ring-1 ring-border"
            maxLength={24}
            autoComplete="off"
          />
        </label>

        <div className="mt-8 space-y-8">
          {pick(tr("create.background"), BACKGROUNDS, backgroundId, setBackgroundId)}
          {pick(tr("label.bond"), BONDS, bondId, setBondId)}
          {pick(tr("label.ideal"), IDEALS, idealId, setIdealId)}
          {pick(tr("label.flaw"), FLAWS, flawId, setFlawId)}
        </div>

        <h2 className="mt-8 font-display text-2xl">{tr("create.skills")}</h2>
        <p className="mt-1 font-mono text-sm text-primary">
          {tr("create.left", { count: left, max: 3 }, left)}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SKILL_TRAITS.map((u) => {
            const n = spends[u.key] ?? 0;
            return (
              <div key={u.key} className="rounded-lg bg-bg-elevated p-4 ring-1 ring-border">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-xl">{u.name}</p>
                  <p className="font-mono text-sm text-fg-subtle">
                    {n}/{u.max}
                  </p>
                </div>
                <p className="mt-1 text-sm text-fg-muted">{u.blurb}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="h-11 min-w-11 rounded-sm ring-1 ring-border"
                    onClick={() => bump(u.key, -1)}
                    disabled={n <= 0}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="h-11 min-w-11 rounded-sm ring-1 ring-border"
                    onClick={() => bump(u.key, 1)}
                    disabled={left <= 0 || n >= u.max}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm text-fg-muted">
            {name.trim() || "Ellis Perch"} · {traitById(BACKGROUNDS, backgroundId).name} ·{" "}
            {tr("label.bond")}: {traitById(BONDS, bondId).name} · {tr("label.ideal")}:{" "}
            {traitById(IDEALS, idealId).name} · {tr("label.flaw")}: {traitById(FLAWS, flawId).name}
          </p>
          <GoldButton
            onClick={() =>
              onCommit({
                name,
                backgroundId,
                bondId,
                idealId,
                flawId,
                spends,
              })
            }
          >
            {tr("create.walk")}
          </GoldButton>
        </div>
      </div>
    </section>
  );
}

function IntroScreen({ ui, tr, onNext }: { ui: UiSnapshot; tr: Translate; onNext: () => void }) {
  const raw = INTRO_BEATS[Math.min(ui.introBeat, INTRO_BEATS.length - 1)];
  const beat = fillIntroBeat(
    raw,
    ui.character.name,
    traitById(BACKGROUNDS, ui.character.backgroundId),
    traitById(BONDS, ui.character.bondId),
    traitById(IDEALS, ui.character.idealId),
    traitById(FLAWS, ui.character.flawId),
  );
  const last = ui.introBeat >= INTRO_BEATS.length - 1;
  return (
    <section className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg/95 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">{beat.kicker}</p>
      <h1 className="mt-4 max-w-xl font-display text-3xl leading-snug text-fg sm:text-5xl">
        {beat.title}
      </h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted">{beat.body}</p>
      <div className="mt-10 w-full max-w-sm">
        <GoldButton onClick={onNext}>
          {last ? tr("intro.begin") : tr("dialogue.continue")}
        </GoldButton>
      </div>
      <p className="mt-4 font-mono text-xs text-fg-subtle">
        {tr("intro.progress", { beat: ui.introBeat + 1, total: INTRO_BEATS.length })}
      </p>
    </section>
  );
}

function Afterlife({
  ui,
  tr,
  onBuy,
  onBirth,
}: {
  ui: UiSnapshot;
  tr: Translate;
  onBuy: (k: (typeof LIMBO_UPGRADES)[number]["key"]) => void;
  onBirth: () => void;
}) {
  const host = ui.afterlifeHost === "devil" ? "devil" : "god";
  const copy = afterlifeCopy(
    host,
    ui.character.name,
    ui.year,
    ui.lastDeed,
    traitById(FLAWS, ui.character.flawId).name,
  );
  const devil = host === "devil";
  return (
    <section className="absolute inset-0 z-20 overflow-y-auto bg-bg px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <p
          className={`font-mono text-xs tracking-[0.28em] uppercase ${devil ? "text-danger" : "text-primary"}`}
        >
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-4xl">{copy.title}</h1>
        <div
          className={
            devil
              ? "mt-4 max-w-xl rounded-md bg-bg-elevated p-4 ring-1 ring-danger"
              : "mt-4 max-w-xl rounded-md bg-bg-elevated p-4 ring-1 ring-border"
          }
        >
          <p className="text-fg-muted">{copy.body}</p>
        </div>
        <p className="mt-4 text-sm text-fg">
          {ui.character.name} · {traitById(BACKGROUNDS, ui.character.backgroundId).name} ·{" "}
          {tr("label.bond")}: {traitById(BONDS, ui.character.bondId).name} · {tr("label.flaw")}:{" "}
          {traitById(FLAWS, ui.character.flawId).name}
        </p>
        <div className="mt-4 flex gap-6 font-mono text-sm">
          <span
            style={{ color: ui.karma >= 0 ? "var(--color-karma-pos)" : "var(--color-karma-neg)" }}
          >
            {tr("limbo.karma")} {ui.karma >= 0 ? "+" : ""}
            {ui.karma}
          </span>
          <span className="text-primary">
            {tr("label.skill")} {ui.character.skillPoints}
          </span>
          <span className="text-fg-muted">
            {tr("limbo.cycleYear", { cycle: ui.cycle, year: ui.year })}
          </span>
        </div>
        {ui.spectrumReady && (
          <p className="mt-4 rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg ring-1 ring-primary">
            {tr("limbo.spectrum")}
          </p>
        )}
        <div className="mt-6 max-w-xl rounded-lg bg-bg-elevated p-4 ring-1 ring-border">
          <p className="font-mono text-xs tracking-[0.28em] text-fg-subtle uppercase">
            {tr("limbo.chapter")}
          </p>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="font-mono text-xs tracking-wide text-primary uppercase">
                {tr("limbo.life")}
              </dt>
              <dd className="mt-1 text-pretty text-sm text-fg">{ui.cycleLedger.thisLife}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-primary uppercase">
                {tr("limbo.keep")}
              </dt>
              <dd className="mt-1 text-pretty text-sm text-fg">{ui.cycleLedger.youKeep}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-primary uppercase">
                {tr("limbo.ground")}
              </dt>
              <dd className="mt-1 text-pretty text-sm text-fg">{ui.cycleLedger.theGround}</dd>
            </div>
          </dl>
        </div>
        <h2 className="mt-8 font-display text-2xl">{tr("limbo.spend")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SKILL_TRAITS.map((u) => {
            const val = ui.upgrades[u.key];
            const owned = typeof val === "boolean" ? (val ? 1 : 0) : (val as number);
            const maxed = owned >= u.max || ui.character.skillPoints <= 0;
            return (
              <button
                key={u.key}
                type="button"
                disabled={maxed}
                onClick={() => onBuy(u.key)}
                className="rounded-lg bg-bg-elevated p-4 text-left ring-1 ring-border disabled:opacity-50"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-xl">{u.name}</p>
                  <p className="font-mono text-xs text-primary">
                    {tr("pause.pts", { count: 1 }, 1)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-fg-muted">{u.blurb}</p>
                <p className="mt-2 font-mono text-xs text-fg-subtle">
                  {owned}/{u.max}
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-8 pb-10">
          <GoldButton onClick={onBirth}>{copy.action}</GoldButton>
        </div>
      </div>
    </section>
  );
}

function Ending({ beat, tr, onWalk }: { beat: number; tr: Translate; onWalk: () => void }) {
  const line = ENDING_LINES[Math.min(beat, ENDING_LINES.length - 1)];
  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">
        {tr("title.kicker")}
      </p>
      <h1 className="mt-4 max-w-xl font-display text-3xl leading-snug text-fg sm:text-5xl">
        {line}
      </h1>
      <p className="mt-6 text-sm text-fg-subtle">{tr("ending.door")}</p>
      <div className="mt-8 w-full max-w-sm">
        <GoldButton onClick={onWalk}>{tr("ending.walk")}</GoldButton>
      </div>
    </section>
  );
}

function TouchPad({
  stickRef,
  tr,
  onStick,
  hold,
  onPause: _onPause,
  onCycle,
  onFar,
  onNear,
}: {
  stickRef: React.RefObject<HTMLDivElement | null>;
  tr: Translate;
  onStick: (e: React.PointerEvent<HTMLDivElement>) => void;
  hold: (key: "attack" | "interact" | "release" | "bomb" | "dash" | "use", v: boolean) => void;
  onPause: () => void;
  onCycle: () => void;
  onFar: () => void;
  onNear: () => void;
}) {
  const mk = (label: string, key: "attack" | "interact" | "release" | "bomb" | "dash" | "use") => (
    <button
      type="button"
      className="h-14 min-w-16 rounded-full bg-bg-elevated/95 px-4 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
      onPointerDown={(e) => {
        e.preventDefault();
        hold(key, true);
      }}
      onPointerUp={() => hold(key, false)}
      onPointerCancel={() => hold(key, false)}
      onPointerLeave={() => hold(key, false)}
    >
      {label}
    </button>
  );
  return (
    <>
      <div
        ref={stickRef}
        className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-10 h-32 w-32 touch-none rounded-full bg-bg-elevated/40 ring-1 ring-border"
        onPointerDown={onStick}
        onPointerMove={onStick}
        onPointerUp={onStick}
        onPointerCancel={onStick}
        onPointerLeave={onStick}
        onLostPointerCapture={onStick}
      >
        <div className="pointer-events-none absolute inset-4 rounded-full ring-1 ring-primary/40" />
        <div
          data-knob
          className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
        />
      </div>
      <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3 z-10 flex max-w-[14rem] flex-wrap justify-end gap-2">
        {mk(tr("touch.slash"), "attack")}
        {mk(tr("touch.talk"), "interact")}
        {mk(tr("touch.sip"), "use")}
        {mk(tr("touch.bomb"), "bomb")}
        <button
          type="button"
          className="h-14 min-w-16 rounded-full bg-bg-elevated/95 px-4 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
          onClick={onCycle}
        >
          {tr("touch.arm")}
        </button>
        {mk(tr("touch.release"), "release")}
        <button
          type="button"
          className="h-10 min-w-12 rounded-full bg-bg-elevated/95 px-3 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
          onClick={onFar}
        >
          {tr("touch.far")}
        </button>
        <button
          type="button"
          className="h-10 min-w-12 rounded-full bg-bg-elevated/95 px-3 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
          onClick={onNear}
        >
          {tr("touch.near")}
        </button>
      </div>
    </>
  );
}

function fmtClock(t: number) {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const s = Math.floor(t);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function DeckChip({
  ui,
  tr,
  onPlay,
  onPause,
  onLid,
}: {
  ui: UiSnapshot;
  tr: Translate;
  onPlay: () => void;
  onPause: () => void;
  onLid: () => void;
}) {
  return (
    <div className="absolute top-[max(2.75rem,calc(env(safe-area-inset-top)+2.4rem))] right-3 z-10 flex max-w-[min(16rem,calc(100%-1.5rem))] items-center gap-1 rounded-full bg-bg-elevated/90 pl-3 pr-1 ring-1 ring-border">
      <p className="min-w-0 flex-1 truncate font-mono text-[10px] tracking-wide text-fg">
        {ui.deckTitle ?? tr("deck.device")}
      </p>
      <button
        type="button"
        onClick={ui.deckPlaying ? onPause : onPlay}
        className="h-11 min-w-11 rounded-full px-2 font-mono text-[10px] tracking-widest text-primary uppercase"
      >
        {ui.deckPlaying ? tr("deck.pause") : tr("deck.play")}
      </button>
      <button
        type="button"
        onClick={onLid}
        className="h-11 min-w-11 rounded-full px-2 font-mono text-[10px] tracking-widest text-fg-subtle uppercase"
      >
        {tr("deck.lid")}
      </button>
    </div>
  );
}

function IpodDeck({
  ui,
  tr,
  onClose,
  onFeed,
  onPlay,
  onPause,
  onSeek,
}: {
  ui: UiSnapshot;
  tr: Translate;
  onClose: () => void;
  onFeed: (file: File) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
}) {
  const seated = ui.deckHasTrack;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/80 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-bg-elevated p-6 ring-1 ring-border">
        <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">
          {tr("deck.device")}
        </p>
        <h2 className="mt-2 font-display text-3xl">
          {seated ? ui.deckTitle : tr("deck.emptyTitle")}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          {seated ? tr("deck.seated") : tr("deck.empty")}
        </p>
        {seated && (
          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={Math.max(ui.deckDuration, 0.01)}
              step={0.25}
              value={Math.min(ui.deckPosition, ui.deckDuration || 0)}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="h-3 w-full accent-primary"
              aria-label={tr("deck.seek")}
            />
            <p className="mt-1 flex justify-between font-mono text-[10px] tracking-wide text-fg-subtle">
              <span>{fmtClock(ui.deckPosition)}</span>
              <span>{fmtClock(ui.deckDuration)}</span>
            </p>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={ui.deckPlaying ? onPause : onPlay}
            disabled={!seated}
            className="h-12 rounded-[12px] bg-bg px-4 font-semibold text-fg ring-1 ring-border disabled:opacity-40"
          >
            {ui.deckPlaying ? tr("deck.pause") : tr("deck.play")}
          </button>
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-[12px] bg-bg px-4 font-semibold text-fg ring-1 ring-border">
            {seated ? tr("deck.replace") : tr("deck.feed")}
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFeed(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        <div className="mt-6">
          <GoldButton onClick={onClose}>{tr("deck.pocket")}</GoldButton>
        </div>
      </div>
    </div>
  );
}

function LanguageSwitch({
  locale,
  tr,
  onPick,
  review = false,
}: {
  locale: LocaleId;
  tr: Translate;
  onPick: (id: LocaleId) => void;
  review?: boolean;
}) {
  return (
    <div className="mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        role="group"
        aria-label={tr("lang.group")}
      >
        {LOCALES.map((id) => {
          const on = id === locale;
          const label = id === "en" ? "lang.en" : id === "fr" ? "lang.fr" : "lang.es";
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(id)}
              className={
                on
                  ? "h-11 rounded-full bg-primary px-4 font-mono text-xs tracking-widest text-primary-fg"
                  : "h-11 rounded-full bg-bg-elevated px-4 font-mono text-xs tracking-widest text-fg ring-1 ring-border"
              }
            >
              {tr(label)}
            </button>
          );
        })}
      </div>
      {review ? (
        <p className="mt-2 text-center text-xs text-fg-subtle">{tr("lang.review")}</p>
      ) : null}
    </div>
  );
}

function GoldButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-full rounded-[12px] bg-primary text-base font-semibold text-primary-fg"
    >
      {children}
    </button>
  );
}
