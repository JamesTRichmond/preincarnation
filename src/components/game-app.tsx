import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { EMPTY_KIT } from "@/game/kit-compare";
import { DEFAULT_CHARACTER, DEFAULT_FLAGS, DEFAULT_UPGRADES, EMPTY_LEDGER } from "@/game/types";
import {
  defaultA11y,
  picturePixels,
  readA11y,
  subscribeA11y,
  writeA11y,
  type A11ySettings,
  type StickSide,
} from "@/game/a11y";

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
  kit: EMPTY_KIT,
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
  beacon: null,
  lastDeed: "",
  cycleLedger: EMPTY_LEDGER,
};

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [ui, setUi] = useState<UiSnapshot>(EMPTY);
  const [hasSave, setHasSave] = useState(false);
  const [comfort, setComfort] = useState<A11ySettings>(defaultA11y);
  const [frame, setFrame] = useState({ w: 320, h: 240, stageW: 320, stageH: 240 });
  const stickRef = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setComfort(readA11y());
    return subscribeA11y(setComfort);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const apply = () => {
      const stageW = stage.clientWidth;
      const stageH = stage.clientHeight;
      const px = picturePixels(stageW, stageH, comfort.pictureScale);
      setFrame({ w: px.w, h: px.h, stageW, stageH });
    };
    apply();
    const watch = new ResizeObserver(apply);
    watch.observe(stage);
    return () => watch.disconnect();
  }, [comfort.pictureScale]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const g = createGame(el, setUi);
    gameRef.current = g;
    setHasSave(g.hasSave());
    return () => g.dispose();
  }, []);

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
  const fits = frame.w <= frame.stageW && frame.h <= frame.stageH;
  const onComfort = (patch: Partial<A11ySettings>) => {
    setComfort(writeA11y(patch));
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div
        ref={stageRef}
        className={playing ? "absolute inset-0 overflow-auto" : "absolute inset-0 overflow-hidden"}
        data-picture-stage
      >
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{
            width: frame.w,
            height: frame.h,
            marginLeft: fits ? "auto" : 0,
            marginRight: fits ? "auto" : 0,
            marginTop: fits ? Math.max(0, Math.floor((frame.stageH - frame.h) / 2)) : 0,
            imageRendering: "pixelated",
            cursor: "crosshair",
            touchAction: comfort.pictureScale > 1 ? "pan-x pan-y" : "none",
          }}
          aria-label="PREINCARNATION game world"
        />
      </div>

      {ui.mode === "title" && (
        <Title
          hasSave={hasSave}
          onNew={() => gameRef.current?.startNew()}
          onContinue={() => gameRef.current?.continueGame()}
        />
      )}

      {ui.mode === "create" && (
        <CreateScreen onCommit={(draft) => gameRef.current?.commitCreate(draft)} />
      )}

      {ui.mode === "intro" && (
        <IntroScreen
          ui={ui}
          onNext={() => gameRef.current?.advanceIntro()}
        />
      )}

      {playing && (
        <div className="pointer-events-none absolute top-[max(2.75rem,env(safe-area-inset-top))] left-1/2 z-10 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 text-center">
          <span className="inline-block rounded-full bg-bg-elevated/90 px-3 py-1 font-mono text-[10px] tracking-widest text-primary uppercase ring-1 ring-border/80">
            {ui.job}
          </span>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-fg-subtle">
            {ui.character.name} · {traitById(BACKGROUNDS, ui.character.backgroundId).name}
          </p>
          {ui.beacon && (
            <p className="mt-1 font-mono text-[11px] tracking-[0.16em] text-primary uppercase">{ui.beacon}</p>
          )}
        </div>
      )}

      {playing && (ui.objective || ui.interactHint || ui.message) && (
        <div
          className={
            comfort.highContrast
              ? "pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 rounded-[12px] bg-[#120e09] px-3 py-2 text-center text-[#f7f3ea] ring-2 ring-[#f7f3ea]"
              : "pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 text-center"
          }
          style={{ zoom: comfort.textScale }}
        >
          {(ui.message || ui.interactHint) && (
            <p className={comfort.highContrast ? "font-mono text-xs tracking-wide text-[#f7f3ea]" : "font-mono text-xs tracking-wide text-primary"}>
              {ui.message ?? ui.interactHint}
            </p>
          )}
          {ui.objective && (
            <p className={comfort.highContrast ? "font-mono text-xs tracking-wide text-[#f7f3ea]" : "font-mono text-xs tracking-wide text-fg-subtle"}>
              {ui.objective}
            </p>
          )}
        </div>
      )}

      {ui.mode === "dialogue" && ui.dialogue && (
        <DialoguePanel
          node={ui.dialogue}
          comfort={comfort}
          onChoose={(i) => gameRef.current?.choose(i)}
        />
      )}

      {(ui.mode === "pause" || ui.showHelp) && ui.mode !== "title" && ui.mode !== "create" && ui.mode !== "intro" && ui.mode !== "limbo" && ui.mode !== "ending" && ui.mode !== "ipod" && (
        <Pause
          ui={ui}
          comfort={comfort}
          onComfort={onComfort}
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
          onBuy={(k) => gameRef.current?.spendSkill(k)}
          onBirth={() => gameRef.current?.reincarnate()}
        />
      )}

      {ui.mode === "ipod" && (
        <IpodDeck
          ui={ui}
          onClose={() => gameRef.current?.closeIpod()}
          onFeed={(file) => void gameRef.current?.feedDeck(file)}
          onPlay={() => void gameRef.current?.playDeck()}
          onPause={() => gameRef.current?.pauseDeck()}
          onSeek={(t) => gameRef.current?.seekDeck(t)}
        />
      )}

      {ui.mode === "ending" && (
        <Ending beat={ui.endingBeat} onWalk={() => gameRef.current?.reincarnate()} />
      )}

      {playing && ui.deckHasTrack && (
        <DeckChip
          ui={ui}
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
            Menu
          </button>
          {ui.showControls && (
            <TouchPad
              stickSide={comfort.stickSide}
              stickRef={stickRef}
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
  onNew,
  onContinue,
}: {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 font-mono text-xs tracking-[0.28em] text-primary uppercase">Vermont · never ending</p>
      <h1 className="font-display text-5xl font-semibold tracking-tight text-fg sm:text-7xl">PREINCARNATION</h1>
      <p className="mt-4 max-w-md text-lg text-fg-muted">You will die. God, or the other one, will send you back. The Marble Vein is the job.</p>
      <p className="mt-2 max-w-sm text-sm text-fg-subtle">
        Addison County. One life, one name. Speak with Maeve. Take the shovel. Walk east until the temple answers.
      </p>
      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <GoldButton onClick={onNew}>Begin first life</GoldButton>
        {hasSave && (
          <button
            type="button"
            onClick={onContinue}
            className="h-12 rounded-[12px] border border-border bg-bg-elevated text-base font-medium text-fg"
          >
            Continue cycle
          </button>
        )}
      </div>
      <p className="mt-8 max-w-md text-sm text-fg-subtle">First you make the person. Then the county tells you the job.</p>
    </section>
  );
}

function Pause({
  ui,
  comfort,
  onComfort,
  onResume,
  onShake,
  onMute,
  onCycle,
  onControls,
  onReset,
}: {
  ui: UiSnapshot;
  comfort: A11ySettings;
  onComfort: (patch: Partial<A11ySettings>) => void;
  onResume: () => void;
  onShake: (v: boolean) => void;
  onMute: () => void;
  onCycle: () => void;
  onControls: (v: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/80 p-4">
      <div className="max-h-[min(92dvh,44rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-bg-elevated p-6 ring-1 ring-border">
        <h2 className="font-display text-3xl">{ui.showHelp ? "How to play" : "Paused"}</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {ui.character.name} · {traitById(BACKGROUNDS, ui.character.backgroundId).name} · {ui.townName} · Cycle {ui.cycle}
        </p>
        <p className="mt-2 text-sm text-fg">{ui.job}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-fg-subtle">Bond</dt>
          <dd className="text-fg">{traitById(BONDS, ui.character.bondId).name}</dd>
          <dt className="text-fg-subtle">Ideal</dt>
          <dd className="text-fg">{traitById(IDEALS, ui.character.idealId).name}</dd>
          <dt className="text-fg-subtle">Flaw</dt>
          <dd className="text-fg">{traitById(FLAWS, ui.character.flawId).name}</dd>
          <dt className="text-fg-subtle">Skill</dt>
          <dd className="font-mono text-primary">{ui.character.skillPoints} pts</dd>
        </dl>
        <p className="mt-2 text-sm text-fg">
          {ui.weaponName}{" "}
          <span className="font-mono text-xs text-primary">{ui.weaponTags}</span>
        </p>
        <section className="mt-4 text-left" data-testid="kit-compare">
          <h3 className="font-display text-xl">In the bag</h3>
          <p className="mt-1 text-sm text-fg" data-testid="kit-lead">
            {ui.kit.lead}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">In hand</p>
              <p className="text-sm text-fg">{ui.kit.handName}</p>
              <p className="font-mono text-xs text-primary">This swing {ui.kit.strikeHand}</p>
              <p className="text-xs text-fg-muted">Reach {ui.kit.reachHand} · walk {ui.kit.walkHand}</p>
            </article>
            <article>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">Next in the bag</p>
              <p className="text-sm text-fg">{ui.kit.nextName ?? "—"}</p>
              <p className="font-mono text-xs text-fg-muted">This swing {ui.kit.strikeNext ?? "—"}</p>
              <p className="text-xs text-fg-muted">
                Reach {ui.kit.reachNext ?? "—"} · walk {ui.kit.walkNext ?? "—"}
              </p>
            </article>
          </div>
          <p className="mt-2 text-xs text-fg-subtle">This swing is the strike for the body you are. It is not a ranking.</p>
          <p className="mt-2 text-sm text-fg-muted" data-testid="kit-swap">
            {ui.kit.swap}
          </p>
          {ui.kit.missing && <p className="mt-2 text-sm text-fg">{ui.kit.missing}</p>}
          <p className="mt-2 text-sm text-fg-muted">{ui.kit.yLine}</p>
        </section>

        <h3 className="mt-5 font-display text-xl">Move</h3>
        <ul className="mt-2 space-y-1 text-sm text-fg-muted">
          <li>Arrows or WASD. Keyboard always wins — leftover analog is cancelled.</li>
          <li>Mouse / trackpad: click a spot to walk there. Hold to follow the cursor. Let go or leave the map — you stop.</li>
          <li>Right-click slashes. Scroll zooms.</li>
          <li>Gamepad: left stick or D-pad. Switching devices cancels the last one.</li>
        </ul>

        <h3 className="mt-4 font-display text-xl">Act</h3>
        <div className="mt-2 overflow-hidden rounded-[12px] ring-1 ring-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-fg-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Touch</th>
              </tr>
            </thead>
            <tbody className="text-fg">
              <tr className="border-t border-border">
                <td className="px-3 py-2">Slash now / hold spin</td>
                <td className="px-3 py-2 font-mono">Space / Z</td>
                <td className="px-3 py-2">Slash</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Use Y-tool (lamp, hammer, shovel)</td>
                <td className="px-3 py-2 font-mono">Y</td>
                <td className="px-3 py-2">—</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Talk / enter / take</td>
                <td className="px-3 py-2 font-mono">E / Enter / walk in</td>
                <td className="px-3 py-2">Talk</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Drink syrup / creemee</td>
                <td className="px-3 py-2 font-mono">V</td>
                <td className="px-3 py-2">Sip</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Cycle Y-tool</td>
                <td className="px-3 py-2 font-mono">Q</td>
                <td className="px-3 py-2">Arm</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Zoom out / in</td>
                <td className="px-3 py-2 font-mono">- / =</td>
                <td className="px-3 py-2">Far / Near</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Release soul (win the cycle)</td>
                <td className="px-3 py-2 font-mono">hold R</td>
                <td className="px-3 py-2">hold Release</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Bomb</td>
                <td className="px-3 py-2 font-mono">F / X</td>
                <td className="px-3 py-2">Bomb</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Dash</td>
                <td className="px-3 py-2 font-mono">Shift</td>
                <td className="px-3 py-2">—</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Pause / this screen</td>
                <td className="px-3 py-2 font-mono">Esc / P</td>
                <td className="px-3 py-2">Pause</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-fg-muted">
          Space is always the sword — even with the lamp in hand. Y uses the tool in the HUD (shovel, lamp, hammer,
          cape). Q cycles tools. Minus pulls the camera back over the town. Dying leaves a grave — come back with the
          shovel in 14–18 years. The Marble Vein east of Middlebury is the county temple. There is no credits sequence.
        </p>

        <h3 className="mt-5 font-display text-xl">Settings</h3>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={() => onControls(!ui.showControls)}
          >
            On-screen buttons {ui.showControls ? "on" : "off"}
          </button>
          <button type="button" className="h-11 rounded-[12px] ring-1 ring-border" onClick={onCycle}>
            Next weapon
          </button>
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={() => {
              const next = !ui.shake;
              onShake(next);
              if (next && comfort.shakeStrength <= 0) onComfort({ shakeStrength: 1 });
            }}
          >
            Screen shake {ui.shake ? "on" : "off"}
          </button>
          <label className="flex h-11 items-center gap-3 rounded-[12px] px-3 ring-1 ring-border">
            <span className="w-28 shrink-0 text-left text-sm">Kick {Math.round(comfort.shakeStrength * 100)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={25}
              value={Math.round(comfort.shakeStrength * 100)}
              aria-label="Shake strength"
              onChange={(e) => {
                const shakeStrength = Number(e.target.value) / 100;
                onComfort({ shakeStrength });
                onShake(shakeStrength > 0);
              }}
              className="h-11 w-full accent-primary"
            />
          </label>
          <label className="flex h-11 items-center gap-3 rounded-[12px] px-3 ring-1 ring-border">
            <span className="w-28 shrink-0 text-left text-sm">Picture {Math.round(comfort.pictureScale * 100)}%</span>
            <input
              type="range"
              min={100}
              max={200}
              step={25}
              value={Math.round(comfort.pictureScale * 100)}
              aria-label="Picture size"
              onChange={(e) => onComfort({ pictureScale: (Number(e.target.value) / 100) as A11ySettings["pictureScale"] })}
              className="h-11 w-full accent-primary"
            />
          </label>
          <label className="flex h-11 items-center gap-3 rounded-[12px] px-3 ring-1 ring-border">
            <span className="w-28 shrink-0 text-left text-sm">Reading {Math.round(comfort.textScale * 100)}%</span>
            <input
              type="range"
              min={100}
              max={200}
              step={25}
              value={Math.round(comfort.textScale * 100)}
              aria-label="Reading size"
              onChange={(e) => onComfort({ textScale: (Number(e.target.value) / 100) as A11ySettings["textScale"] })}
              className="h-11 w-full accent-primary"
            />
          </label>
          <p className="text-left text-xs text-fg-muted">
            Picture magnifies the 320×240 frame and scrolls if it no longer fits. Minus and Equal still move the camera.
            Neither one marks a door.
          </p>
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={() => onComfort({ highContrast: !comfort.highContrast })}
          >
            High-contrast plates {comfort.highContrast ? "on" : "off"}
          </button>
          <button
            type="button"
            className="h-11 rounded-[12px] ring-1 ring-border"
            onClick={() => onComfort({ reducedFlashing: !comfort.reducedFlashing })}
          >
            Full-screen flashes {comfort.reducedFlashing ? "off" : "on"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={comfort.stickSide === "left"}
              className="h-11 flex-1 rounded-[12px] ring-1 ring-border"
              onClick={() => onComfort({ stickSide: "left" satisfies StickSide })}
            >
              Stick left
            </button>
            <button
              type="button"
              aria-pressed={comfort.stickSide === "right"}
              className="h-11 flex-1 rounded-[12px] ring-1 ring-border"
              onClick={() => onComfort({ stickSide: "right" satisfies StickSide })}
            >
              Stick right
            </button>
          </div>
          <p className="text-left text-xs text-fg-muted">
            The stick moves. Slash takes the other edge. Keys stay put. Forget all lives clears the county and leaves
            these settings.
          </p>
          <button type="button" className="h-11 rounded-[12px] ring-1 ring-border" onClick={onMute}>
            Sound {ui.muted ? "muted" : "on"}
          </button>
          <button type="button" className="h-11 rounded-[12px] text-danger ring-1 ring-border" onClick={onReset}>
            Forget all lives
          </button>
        </div>

        <div className="mt-6">
          <GoldButton onClick={onResume}>{ui.showHelp ? "I understand — walk" : "Resume"}</GoldButton>
        </div>
      </div>
    </div>
  );
}

function DialoguePanel({
  node,
  comfort,
  onChoose,
}: {
  node: NonNullable<UiSnapshot["dialogue"]>;
  comfort: A11ySettings;
  onChoose: (i: number) => void;
}) {
  const choices = node.choices ?? [{ label: "Continue", next: "end" as const }];
  const plate = comfort.highContrast
    ? "mx-auto max-w-2xl rounded-[28px] bg-[#120e09] p-5 text-[#f7f3ea] ring-2 ring-[#f7f3ea]"
    : "mx-auto max-w-2xl rounded-[28px] bg-bg-elevated p-5 ring-1 ring-border";
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className={plate} style={{ zoom: comfort.textScale }}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={comfort.highContrast ? "font-display text-2xl text-[#f7f3ea]" : "font-display text-2xl text-fg"}>
            {node.speaker}
          </h2>
          {node.entropy != null && (
            <p className={comfort.highContrast ? "font-mono text-xs text-[#f7f3ea]" : "font-mono text-xs text-fg-subtle"}>
              Entropy {Math.round(node.entropy * 100)}%
            </p>
          )}
        </div>
        <p className={comfort.highContrast ? "mt-3 text-base leading-relaxed text-[#f7f3ea]" : "mt-3 text-base leading-relaxed text-fg-muted"}>
          {node.text}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {choices.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onChoose(i)}
              className={
                comfort.highContrast
                  ? "min-h-12 rounded-[12px] bg-[#1c1610] px-4 py-3 text-left text-base text-[#f7f3ea] ring-2 ring-[#f7f3ea]"
                  : "min-h-12 rounded-[12px] bg-bg px-4 py-3 text-left text-base text-fg ring-1 ring-border hover:ring-primary"
              }
            >
              {comfort.highContrast ? `${i + 1}. ${c.label}` : c.label}
              {c.note && (
                <span className={comfort.highContrast ? "ml-2 font-mono text-xs text-[#f7f3ea]" : "ml-2 font-mono text-xs text-primary"}>
                  {c.note}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateScreen({
  onCommit,
}: {
  onCommit: (draft: {
    name: string;
    backgroundId: string;
    bondId: string;
    idealId: string;
    flawId: string;
    spends: Partial<Record<"vitality" | "edge" | "stride" | "sight" | "shadowStep" | "wraithBond", number>>;
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
        <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">First life</p>
        <h1 className="mt-2 font-display text-4xl">Make the person</h1>
        <p className="mt-2 max-w-xl text-fg-muted">
          One name. One set of debts. You do not come back as someone else. You come back as this, louder, until the Vein answers.
        </p>

        <label className="mt-8 block">
          <span className="font-mono text-xs tracking-widest text-fg-subtle uppercase">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            className="mt-2 h-12 w-full rounded-md bg-bg-elevated px-4 text-lg text-fg ring-1 ring-border"
            maxLength={24}
            autoComplete="off"
          />
        </label>

        <div className="mt-8 space-y-8">
          {pick("Background", BACKGROUNDS, backgroundId, setBackgroundId)}
          {pick("Bond", BONDS, bondId, setBondId)}
          {pick("Ideal", IDEALS, idealId, setIdealId)}
          {pick("Flaw", FLAWS, flawId, setFlawId)}
        </div>

        <h2 className="mt-8 font-display text-2xl">Skill points</h2>
        <p className="mt-1 font-mono text-sm text-primary">{left} left of 3</p>
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
            {name.trim() || "Ellis Perch"} · {traitById(BACKGROUNDS, backgroundId).name} · Bond:{" "}
            {traitById(BONDS, bondId).name} · Ideal: {traitById(IDEALS, idealId).name} · Flaw:{" "}
            {traitById(FLAWS, flawId).name}
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
            Walk into the story
          </GoldButton>
        </div>
      </div>
    </section>
  );
}

function IntroScreen({ ui, onNext }: { ui: UiSnapshot; onNext: () => void }) {
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
      <h1 className="mt-4 max-w-xl font-display text-3xl leading-snug text-fg sm:text-5xl">{beat.title}</h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted">{beat.body}</p>
      <div className="mt-10 w-full max-w-sm">
        <GoldButton onClick={onNext}>{last ? "Begin the job" : "Continue"}</GoldButton>
      </div>
      <p className="mt-4 font-mono text-xs text-fg-subtle">
        {ui.introBeat + 1} / {INTRO_BEATS.length} · Enter or tap
      </p>
    </section>
  );
}

function Afterlife({
  ui,
  onBuy,
  onBirth,
}: {
  ui: UiSnapshot;
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
        <p className={`font-mono text-xs tracking-[0.28em] uppercase ${devil ? "text-danger" : "text-primary"}`}>
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
          {ui.character.name} · {traitById(BACKGROUNDS, ui.character.backgroundId).name} · Bond:{" "}
          {traitById(BONDS, ui.character.bondId).name} · Flaw: {traitById(FLAWS, ui.character.flawId).name}
        </p>
        <div className="mt-4 flex gap-6 font-mono text-sm">
          <span style={{ color: ui.karma >= 0 ? "var(--color-karma-pos)" : "var(--color-karma-neg)" }}>
            Karma {ui.karma >= 0 ? "+" : ""}
            {ui.karma}
          </span>
          <span className="text-primary">Skill {ui.character.skillPoints}</span>
          <span className="text-fg-muted">Cycle {ui.cycle} · Year {ui.year}</span>
        </div>
        {ui.spectrumReady && (
          <p className="mt-4 rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg ring-1 ring-primary">
            You have died loud enough. The sphere is open after you finish walking back.
          </p>
        )}
        <div className="mt-6 max-w-xl rounded-lg bg-bg-elevated p-4 ring-1 ring-border">
          <p className="font-mono text-xs tracking-[0.28em] text-fg-subtle uppercase">This chapter</p>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="font-mono text-xs tracking-wide text-primary uppercase">This life</dt>
              <dd className="mt-1 text-pretty text-sm text-fg">{ui.cycleLedger.thisLife}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-primary uppercase">You keep</dt>
              <dd className="mt-1 text-pretty text-sm text-fg">{ui.cycleLedger.youKeep}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-primary uppercase">The ground kept</dt>
              <dd className="mt-1 text-pretty text-sm text-fg">{ui.cycleLedger.theGround}</dd>
            </div>
          </dl>
        </div>
        <h2 className="mt-8 font-display text-2xl">Spend what you were given</h2>
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
                  <p className="font-mono text-xs text-primary">1 pt</p>
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

function Ending({ beat, onWalk }: { beat: number; onWalk: () => void }) {
  const line = ENDING_LINES[Math.min(beat, ENDING_LINES.length - 1)];
  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">Vermont · never ending</p>
      <h1 className="mt-4 max-w-xl font-display text-3xl leading-snug text-fg sm:text-5xl">{line}</h1>
      <p className="mt-6 text-sm text-fg-subtle">This is not an ending. It is a door. Power stacks. The county is still under your feet.</p>
      <div className="mt-8 w-full max-w-sm">
        <GoldButton onClick={onWalk}>Keep walking — louder</GoldButton>
      </div>
    </section>
  );
}

function TouchPad({
  stickSide,
  stickRef,
  onStick,
  hold,
  onPause,
  onCycle,
  onFar,
  onNear,
}: {
  stickSide: StickSide;
  stickRef: React.RefObject<HTMLDivElement | null>;
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
        className={
          stickSide === "right"
            ? "absolute right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 h-32 w-32 touch-none rounded-full bg-bg-elevated/40 ring-1 ring-border"
            : "absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-10 h-32 w-32 touch-none rounded-full bg-bg-elevated/40 ring-1 ring-border"
        }
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
      <div
        className={
          stickSide === "right"
            ? "absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-3 z-10 flex max-w-[14rem] flex-wrap justify-start gap-2"
            : "absolute right-3 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex max-w-[14rem] flex-wrap justify-end gap-2"
        }
      >
        {mk("Slash", "attack")}
        {mk("Talk", "interact")}
        {mk("Sip", "use")}
        {mk("Bomb", "bomb")}
        <button
          type="button"
          className="h-14 min-w-16 rounded-full bg-bg-elevated/95 px-4 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
          onClick={onCycle}
        >
          Arm
        </button>
        {mk("Release", "release")}
        <button
          type="button"
          className="h-10 min-w-12 rounded-full bg-bg-elevated/95 px-3 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
          onClick={onFar}
        >
          Far
        </button>
        <button
          type="button"
          className="h-10 min-w-12 rounded-full bg-bg-elevated/95 px-3 font-mono text-[11px] tracking-widest text-fg uppercase ring-1 ring-border"
          onClick={onNear}
        >
          Near
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
  onPlay,
  onPause,
  onLid,
}: {
  ui: UiSnapshot;
  onPlay: () => void;
  onPause: () => void;
  onLid: () => void;
}) {
  return (
    <div className="absolute top-[max(2.75rem,calc(env(safe-area-inset-top)+2.4rem))] right-3 z-10 flex max-w-[min(16rem,calc(100%-1.5rem))] items-center gap-1 rounded-full bg-bg-elevated/90 pl-3 pr-1 ring-1 ring-border">
      <p className="min-w-0 flex-1 truncate font-mono text-[10px] tracking-wide text-fg">
        {ui.deckTitle ?? "Strange device"}
      </p>
      <button
        type="button"
        onClick={ui.deckPlaying ? onPause : onPlay}
        className="h-11 min-w-11 rounded-full px-2 font-mono text-[10px] tracking-widest text-primary uppercase"
      >
        {ui.deckPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={onLid}
        className="h-11 min-w-11 rounded-full px-2 font-mono text-[10px] tracking-widest text-fg-subtle uppercase"
      >
        Lid
      </button>
    </div>
  );
}

function IpodDeck({
  ui,
  onClose,
  onFeed,
  onPlay,
  onPause,
  onSeek,
}: {
  ui: UiSnapshot;
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
        <p className="font-mono text-xs tracking-[0.28em] text-primary uppercase">Strange device</p>
        <h2 className="mt-2 font-display text-3xl">{seated ? ui.deckTitle : "A pocket of other music"}</h2>
        <p className="mt-2 text-sm text-fg-muted">
          {seated
            ? "Pocketing keeps it playing. Pause is a different button. One bay — a new song replaces this one."
            : "Feed it a song from your own library. Towns already hum; this is yours. Pocketing will not empty the bay."}
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
              aria-label="Seek"
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
            {ui.deckPlaying ? "Pause" : "Play"}
          </button>
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-[12px] bg-bg px-4 font-semibold text-fg ring-1 ring-border">
            {seated ? "Replace" : "Feed a song"}
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
          <GoldButton onClick={onClose}>Pocket it</GoldButton>
        </div>
      </div>
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
