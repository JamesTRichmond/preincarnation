import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { Pause, Play, RotateCcw, Save, SkipForward } from "lucide-react";
import { ACTIVITIES } from "../src/activities.ts";
import { ERAS } from "../src/cast.ts";
import { cellAt, drawPlate, layoutFor } from "./draw.ts";
import { createYardEar, type YardEar } from "./yard-audio.ts";
import { pathfind } from "../src/nav.ts";
import { QUEST_FIXTURES } from "../src/quests.ts";
import { roleTitle } from "../src/talk.ts";
import type { Cell, Dir, EraId, HubId, World } from "../src/types.ts";
import {
  addEphemeral,
  clearEphemeral,
  createHubWorld,
  endTalk,
  loadWorld,
  requestTalk,
  saveWorld,
  setActiveOverrides,
  stateHash,
  step,
} from "../src/world.ts";
import "./world-life.css";

declare global {
  interface Window {
    __controlsTest?: {
      getX: () => number;
      getY: () => number;
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}

const SAVE_KEY = "preincarnation-world-life-v1";

const HUBS_UI: { id: HubId; label: string }[] = [
  { id: "hub.middlebury", label: "Working town" },
  { id: "hub.intervale", label: "Intervale" },
  { id: "hub.otter", label: "Otter landing" },
];

const BLOCKS: Record<HubId, { detour: Cell[]; seal: Cell[]; detourLabel: string; sealLabel: string }> = {
  "hub.middlebury": {
    detourLabel: "Park a wagon in the lane",
    sealLabel: "Shut the stave rack",
    detour: [
      { x: 5, y: 7 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
    ],
    seal: [
      { x: 9, y: 10 },
      { x: 9, y: 12 },
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ],
  },
  "hub.intervale": {
    detourLabel: "Drop the pasture gate",
    sealLabel: "Close the yard",
    detour: [
      { x: 17, y: 7 },
      { x: 17, y: 8 },
      { x: 16, y: 8 },
    ],
    seal: [
      { x: 7, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
      { x: 7, y: 9 },
    ],
  },
  "hub.otter": {
    detourLabel: "Tie a skiff at the step",
    sealLabel: "Bar the gangway",
    detour: [
      { x: 8, y: 10 },
      { x: 10, y: 10 },
    ],
    seal: [
      { x: 8, y: 11 },
      { x: 9, y: 11 },
      { x: 10, y: 11 },
      { x: 11, y: 11 },
      { x: 7, y: 11 },
    ],
  },
};

const QUEST_LABEL: Record<string, string> = {
  "fixture.delivery.hold": "Hoop the delivery",
  "fixture.freshet.race": "Sound the freshet",
  "fixture.ledger.green": "Ledger on the green",
};

interface Glide {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t0: number;
  dur: number;
}

interface Mote {
  x: number;
  y: number;
  life: number;
}

interface Player extends Cell {
  path: Cell[];
}

interface Session {
  world: World;
  player: Player;
  facing: Dir;
  selected: string | null;
  line: string | null;
  overrides: string[];
  glides: Map<string, Glide>;
  motes: Mote[];
}

interface Snap {
  tick: number;
  hash: string;
  hubId: HubId;
  eraId: EraId;
  place: string;
  note: string;
  player: Cell;
  selected: string | null;
  line: string | null;
  actors: {
    id: string;
    roleId: string;
    name: string;
    seat: string;
    memory: string;
    activity: string;
    availability: string;
    posture: string;
    talking: boolean;
  }[];
  log: { tick: number; text: string }[];
  suppressed: { questId: string; reason: string; winnerId?: string }[];
}

function boot(hubId: HubId = "hub.middlebury", eraId: EraId = "return.3", overrides: string[] = []): Session {
  const world = createHubWorld(hubId, eraId, overrides);
  const fb = world.hub.stations.find((s) => s.id === world.hub.fallbackId)!;
  return {
    world,
    player: { x: fb.x, y: fb.y, path: [] },
    facing: "s",
    selected: null,
    line: null,
    overrides: [...overrides],
    glides: new Map(),
    motes: [],
  };
}

function posture(actor: World["actors"][number]): string {
  if (actor.mode === "vacant") return "Shuttered post";
  if (actor.talking) return "Speaking";
  if (actor.stranded) return "Keeping the open ground";
  if (actor.mode === "walk") return "Between posts";
  if (actor.mode === "hold") return "Held at a post";
  return "At the work";
}

function takeSnap(session: Session): Snap {
  const { world } = session;
  return {
    tick: world.tick,
    hash: stateHash(world),
    hubId: world.hubId,
    eraId: world.eraId,
    place: world.hub.place,
    note: world.hub.unboundNote,
    player: { x: session.player.x, y: session.player.y },
    selected: session.selected,
    line: session.line,
    actors: world.actors.map((a) => ({
      id: a.actorId,
      roleId: a.roleId,
      name: a.spokenName,
      seat: a.seatLabel,
      memory: a.memory,
      activity: ACTIVITIES[a.activityId]?.label ?? a.activityId,
      availability: a.availability,
      posture: posture(a),
      talking: a.talking,
    })),
    log: world.log.slice(-5).reverse().map((e) => ({ tick: e.tick, text: e.text })),
    suppressed: world.suppressed.map((s) => ({ questId: s.questId, reason: s.reason, winnerId: s.winnerId })),
  };
}

function cellOpen(world: World, cell: Cell): boolean {
  if (cell.x < 0 || cell.y < 0 || cell.x >= world.w || cell.y >= world.h) return false;
  if (!world.walk[cell.y]?.[cell.x]) return false;
  return !world.ephemeral.some((b) => b.cells.some((c) => c.x === cell.x && c.y === cell.y));
}

const KEY_DELTA: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

function faceOf(dx: number, dy: number, prev: Dir): Dir {
  if (dx === 0 && dy === 0) return prev;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "e" : "w";
  return dy > 0 ? "s" : "n";
}

function puff(session: Session, x: number, y: number) {
  if (session.motes.length > 16) session.motes.splice(0, session.motes.length - 16);
  session.motes.push({ x: x + 0.38, y: y + 0.82, life: 0 }, { x: x + 0.66, y: y + 0.88, life: 0.08 });
}

function sampleGlide(glide: Glide, now: number): { x: number; y: number } {
  const u = glide.dur <= 0 ? 1 : Math.min(1, (now - glide.t0) / glide.dur);
  const eased = u * u * (3 - 2 * u);
  return {
    x: glide.fromX + (glide.toX - glide.fromX) * eased,
    y: glide.fromY + (glide.toY - glide.fromY) * eased,
  };
}

function syncGlide(map: Map<string, Glide>, id: string, x: number, y: number, now: number, reduced: boolean) {
  const glide = map.get(id);
  if (!glide) {
    map.set(id, { fromX: x, fromY: y, toX: x, toY: y, t0: now, dur: 0 });
    return;
  }
  if (glide.toX === x && glide.toY === y) return;
  const cur = sampleGlide(glide, now);
  map.set(id, { fromX: cur.x, fromY: cur.y, toX: x, toY: y, t0: now, dur: reduced ? 0 : 150 });
}

function nudge(session: Session, keys: ReadonlySet<string>): boolean {
  const { world, player } = session;
  const order = ["KeyW", "ArrowUp", "KeyS", "ArrowDown", "KeyA", "ArrowLeft", "KeyD", "ArrowRight"];
  const code = order.find((c) => keys.has(c));
  if (code) {
    const [dx, dy] = KEY_DELTA[code]!;
    const next = { x: player.x + dx, y: player.y + dy };
    player.path = [];
    if (!cellOpen(world, next)) return false;
    puff(session, player.x, player.y);
    session.facing = faceOf(dx, dy, session.facing);
    player.x = next.x;
    player.y = next.y;
    return true;
  }
  if (player.path.length) {
    const next = player.path[0]!;
    if (!cellOpen(world, next)) {
      player.path = [];
      return false;
    }
    puff(session, player.x, player.y);
    session.facing = faceOf(next.x - player.x, next.y - player.y, session.facing);
    player.x = next.x;
    player.y = next.y;
    player.path.shift();
    return true;
  }
  return false;
}

export function WorldLifeDemo() {
  const sessionRef = useRef<Session | null>(null);
  if (!sessionRef.current) sessionRef.current = boot();
  const keysRef = useRef(new Set<string>());
  const playingRef = useRef(true);
  const politeRef = useRef(false);
  const speedRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverRef = useRef<Cell | null>(null);
  const spinRef = useRef(0);
  const reducedRef = useRef(false);
  const earRef = useRef<YardEar | null>(null);
  const [snap, setSnap] = useState(() => takeSnap(sessionRef.current!));
  const [playing, setPlaying] = useState(true);
  const [polite, setPolite] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [banner, setBanner] = useState("Tap a person. Ellis walks over, and they answer at once.");

  const publish = () => setSnap(takeSnap(sessionRef.current!));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();
    let simAcc = 0;
    let moveAcc = 0;
    let pubAcc = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const session = sessionRef.current!;
      if (playingRef.current) {
        simAcc += dt;
        while (simAcc >= 0.125) {
          simAcc -= 0.125;
          step(session.world);
        }
        if (!reducedRef.current) spinRef.current += dt;
      }
      moveAcc += dt;
      const moving = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].some((c) =>
        keysRef.current.has(c),
      );
      if (moveAcc >= 0.16) {
        moveAcc = 0;
        const did = nudge(session, keysRef.current);
        speedRef.current = did ? 1 : 0;
      } else if (moving) {
        speedRef.current = 1;
      } else if (!session.player.path.length) {
        speedRef.current = 0;
      }
      const stamp = performance.now();
      for (const actor of session.world.actors) syncGlide(session.glides, actor.actorId, actor.x, actor.y, stamp, reducedRef.current);
      syncGlide(session.glides, "ellis", session.player.x, session.player.y, stamp, reducedRef.current);
      for (const mote of session.motes) mote.life += dt * 2.4;
      if (session.motes.length) session.motes = session.motes.filter((mote) => mote.life < 1);
      const places: Record<string, { x: number; y: number }> = {};
      for (const actor of session.world.actors) {
        const glide = session.glides.get(actor.actorId);
        places[actor.actorId] = glide ? sampleGlide(glide, stamp) : actor;
      }
      const ellisGlide = session.glides.get("ellis");
      const ellis = ellisGlide ? sampleGlide(ellisGlide, stamp) : session.player;
      const era = ERAS.find((item) => item.id === session.world.eraId);
      drawPlate(ctx, canvas.clientWidth, canvas.clientHeight, session.world, {
        spin: spinRef.current,
        wear: era ? (era.ordinal - 1) / 5 : 0,
        reduced: reducedRef.current,
        eraLabel: era?.plate ?? "",
        selectedId: session.selected,
        player: {
          x: ellis.x,
          y: ellis.y,
          path: session.player.path,
          facing: session.facing,
          moving: speedRef.current > 0 || session.player.path.length > 0,
        },
        places,
        speech:
          session.selected && session.line
            ? { actorId: session.selected, text: session.line.split(". ")[0]!.replace(/\.$/, "") + "." }
            : null,
        hover: hoverRef.current,
        motes: session.motes,
      }, ACTIVITIES);
      pubAcc += dt;
      if (pubAcc >= 0.2) {
        pubAcc = 0;
        setSnap(takeSnap(session));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    window.__controlsTest = {
      getX: () => sessionRef.current!.player.x,
      getY: () => sessionRef.current!.player.y,
      getYaw: () => 0,
      getSpeed: () => speedRef.current,
      setKeys: (codes) => {
        keysRef.current = new Set(codes);
      },
    };

    const down = (e: KeyboardEvent) => {
      if (!(e.code in KEY_DELTA)) return;
      keysRef.current.add(e.code);
      if (e.code.startsWith("Arrow")) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      delete window.__controlsTest;
      earRef.current?.dispose();
      earRef.current = null;
    };
  }, []);

  const replace = (next: Session, message?: string) => {
    sessionRef.current = next;
    if (message) setBanner(message);
    publish();
  };

  const retarget = (hubId: HubId, eraId: EraId) => {
    const overrides = sessionRef.current!.overrides;
    replace(boot(hubId, eraId, overrides), "A later seat keeps the same work. The person is substituted. This is not simulated aging.");
    if (hearing) earRef.current?.retune(sessionRef.current!.world.hub.ground);
  };

  const greet = (actorId: string) => {
    const session = sessionRef.current!;
    const actor = session.world.actors.find((item) => item.actorId === actorId);
    session.selected = actorId;
    if (!actor) {
      publish();
      return;
    }
    const result = requestTalk(session.world, actorId, !politeRef.current);
    session.line = result.line;
    if (actor.mode !== "vacant") {
      const dist = Math.abs(session.player.x - actor.x) + Math.abs(session.player.y - actor.y);
      if (dist === 1) {
        session.player.path = [];
        session.facing = faceOf(actor.x - session.player.x, actor.y - session.player.y, session.facing);
      } else {
        const blocked = new Set<string>();
        for (const block of session.world.ephemeral) for (const cell of block.cells) blocked.add(`${cell.x},${cell.y}`);
        let best: Cell[] | null = null;
        for (const delta of [
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
        ]) {
          const spot = { x: actor.x + delta.x, y: actor.y + delta.y };
          if (!cellOpen(session.world, spot)) continue;
          const path = pathfind(session.world.walk, session.world.w, session.world.h, session.player, spot, blocked);
          if (path && (best === null || path.length < best.length)) best = path;
        }
        if (best && best.length) {
          session.player.path = best;
          session.facing = faceOf(best[0]!.x - session.player.x, best[0]!.y - session.player.y, session.facing);
        }
      }
    }
    publish();
  };

  const pointOnPlate = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const session = sessionRef.current!;
    const rect = canvas.getBoundingClientRect();
    const layout = layoutFor(canvas.clientWidth, canvas.clientHeight, session.world);
    return cellAt(layout, session.world, clientX - rect.left, clientY - rect.top);
  };

  const onCanvas = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current!;
    const cell = pointOnPlate(event.currentTarget, event.clientX, event.clientY);
    if (!cell) return;
    const actor = session.world.actors.find((item) => item.x === cell.x && item.y === cell.y);
    if (actor) {
      greet(actor.actorId);
      return;
    }
    const blocked = new Set<string>();
    for (const block of session.world.ephemeral) for (const spot of block.cells) blocked.add(`${spot.x},${spot.y}`);
    const path = pathfind(session.world.walk, session.world.w, session.world.h, session.player, cell, blocked);
    if (path) {
      session.player.path = path;
      if (path[0]) session.facing = faceOf(path[0].x - session.player.x, path[0].y - session.player.y, session.facing);
    }
  };

  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const cell = pointOnPlate(event.currentTarget, event.clientX, event.clientY);
    hoverRef.current = cell;
    const actor = cell && sessionRef.current!.world.actors.some((item) => item.x === cell.x && item.y === cell.y);
    event.currentTarget.style.cursor = actor ? "pointer" : "crosshair";
  };

  const speak = (actorId: string) => greet(actorId);

  const release = () => {
    const session = sessionRef.current!;
    if (session.selected) endTalk(session.world, session.selected);
    publish();
  };

  const togglePlay = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  const stepOnce = () => {
    step(sessionRef.current!.world);
    publish();
  };

  const placeBlock = (kind: "detour" | "seal") => {
    const session = sessionRef.current!;
    const spec = BLOCKS[session.world.hubId];
    clearEphemeral(session.world);
    addEphemeral(session.world, { id: kind, cells: spec[kind] });
    setBanner(kind === "detour" ? "The lane is obstructed. They will take another way if one exists." : "That post is sealed. They should come back to the open ground, not push the wall.");
    publish();
  };

  const clearBlocks = () => {
    clearEphemeral(sessionRef.current!.world);
    setBanner("The way is open again. Anyone keeping the open ground can return to their post.");
    publish();
  };

  const toggleQuest = (id: string) => {
    const session = sessionRef.current!;
    const next = session.overrides.includes(id) ? session.overrides.filter((q) => q !== id) : [...session.overrides, id];
    session.overrides = next;
    setActiveOverrides(session.world, QUEST_FIXTURES.filter((q) => next.includes(q.id)));
    publish();
  };

  const onSave = () => {
    const session = sessionRef.current!;
    const payload = {
      blob: saveWorld(session.world),
      player: session.player,
      facing: session.facing,
      selected: session.selected,
      line: session.line,
      overrides: session.overrides,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    setBanner(`Saved at tick ${session.world.tick}. Load restores the beat they were in.`);
  };

  const onLoad = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      setBanner("Nothing saved on this plate yet.");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        blob: ReturnType<typeof saveWorld>;
        player: Player;
        facing?: Dir;
        selected: string | null;
        line: string | null;
        overrides: string[];
      };
      const world = loadWorld(parsed.blob);
      replace(
        {
          world,
          player: parsed.player,
          facing: parsed.facing ?? "s",
          selected: parsed.selected,
          line: parsed.line,
          overrides: parsed.overrides ?? [],
          glides: new Map(),
          motes: [],
        },
        `Loaded tick ${world.tick}. The beat continues where it stopped.`,
      );
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Could not read that save.");
    }
  };

  const selected = snap.actors.find((a) => a.id === snap.selected) ?? null;
  const conflict = snap.suppressed.find((s) => s.reason === "lower-priority");

  return (
    <main className="plate-app">
      <header className="mast">
        <p className="kicker">Addison County · Plate 24 · World life</p>
        <h1>Preincarnation</h1>
        <p className="deck">
          Ellis is back. Tap a post and the brass collar crosses the plate while they answer — the work does not make you wait.
        </p>
      </header>

      <div className="controls-row" role="tablist" aria-label="Hub">
        {HUBS_UI.map((hub) => (
          <button
            key={hub.id}
            type="button"
            className="hub-btn"
            aria-pressed={snap.hubId === hub.id}
            onClick={() => retarget(hub.id, snap.eraId)}
          >
            {hub.label}
          </button>
        ))}
      </div>
      <div className="era-row" role="group" aria-label="Fourteen-year return">
        {ERAS.map((era) => (
          <button
            key={era.id}
            type="button"
            className="era-btn"
            aria-pressed={snap.eraId === era.id}
            onClick={() => retarget(snap.hubId, era.id)}
            aria-label={era.plate}
            title={era.plate}
          >
            {era.yearsFromAnchor === 0 ? "1st" : era.yearsFromAnchor}
          </button>
        ))}
      </div>

      <div className="stage">
        <div className="map-column">
          <div className="map-frame">
            <canvas
              ref={canvasRef}
              aria-label={`${snap.place}. Ellis walks the plate. Tap a person and they answer.`}
              onPointerDown={onCanvas}
              onPointerMove={onMove}
              onPointerLeave={() => {
                hoverRef.current = null;
              }}
            />
          </div>
          <div className="pad" aria-label="Walk">
            <span className="pad-spacer" />
            <Pad code="KeyW" keysRef={keysRef} label="North" />
            <span className="pad-spacer" />
            <Pad code="KeyA" keysRef={keysRef} label="West" />
            <Pad code="KeyS" keysRef={keysRef} label="South" />
            <Pad code="KeyD" keysRef={keysRef} label="East" />
          </div>
          <div className="tool-row">
            <button type="button" className="tool-btn primary" onClick={togglePlay}>
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? "Pause the plate" : "Run the plate"}
            </button>
            <button type="button" className="tool-btn" onClick={stepOnce}>
              <SkipForward size={16} aria-hidden />
              One beat
            </button>
            <button type="button" className="tool-btn" onClick={() => placeBlock("detour")}>
              {BLOCKS[snap.hubId].detourLabel}
            </button>
            <button type="button" className="tool-btn" onClick={() => placeBlock("seal")}>
              {BLOCKS[snap.hubId].sealLabel}
            </button>
            <button type="button" className="tool-btn" onClick={clearBlocks}>
              Clear the way
            </button>
            <button type="button" className="tool-btn" onClick={onSave}>
              <Save size={16} aria-hidden />
              Save
            </button>
            <button type="button" className="tool-btn" onClick={onLoad}>
              <RotateCcw size={16} aria-hidden />
              Load
            </button>
            <button
              type="button"
              className="tool-btn"
              aria-pressed={hearing}
              onClick={() => {
                if (!earRef.current) earRef.current = createYardEar();
                void earRef.current.toggle(sessionRef.current!.world.hub.ground).then(setHearing);
              }}
            >
              {hearing ? "Quiet the yard" : "Hear the yard"}
            </button>
          </div>
          <p className="ledger">
            Tick {String(snap.tick).padStart(4, "0")} · ledger {snap.hash} · WASD walks Ellis. The brass collar is you.
          </p>
        </div>

        <aside className="side">
          <h2>{selected ? selected.name : snap.place}</h2>
          <p className="seat">
            {selected ? `${roleTitle(selected.roleId)} · ${selected.seat}` : "Choose a post on the plate or in the list."}
          </p>
          {snap.line ? <blockquote className="quote">{snap.line}</blockquote> : null}
          {selected ? (
            <>
              <dl className="meta">
                <div>
                  <dt>Posture</dt>
                  <dd>{selected.posture}</dd>
                </div>
                <div>
                  <dt>Work</dt>
                  <dd>{selected.activity}</dd>
                </div>
                <div>
                  <dt>Ellis</dt>
                  <dd>{selected.memory}</dd>
                </div>
                <div>
                  <dt>Talk</dt>
                  <dd>{selected.availability}</dd>
                </div>
              </dl>
              <div className="tool-row">
                <button type="button" className="tool-btn primary" onClick={() => speak(selected.id)}>
                  Speak
                </button>
                {selected.talking ? (
                  <button type="button" className="tool-btn" onClick={release}>
                    Back to the work
                  </button>
                ) : null}
              </div>
            </>
          ) : null}

          <h3 className="subhead">At their posts</h3>
          <ul className="people">
            {snap.actors.map((actor) => (
              <li key={actor.id}>
                <button
                  type="button"
                  className="person"
                  aria-pressed={actor.id === snap.selected}
                  onClick={() => greet(actor.id)}
                >
                  <b>{actor.name}</b>
                  <span>
                    {actor.posture} — {actor.activity}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <h3 className="subhead">Fixture quests</h3>
          <div className="checks">
            {QUEST_FIXTURES.map((quest) => (
              <label key={quest.id}>
                <input
                  type="checkbox"
                  checked={sessionRef.current!.overrides.includes(quest.id)}
                  onChange={() => toggleQuest(quest.id)}
                />
                <span>
                  {QUEST_LABEL[quest.id] ?? quest.questId} · priority {quest.priority}
                </span>
              </label>
            ))}
            <label>
              <input
                type="checkbox"
                checked={polite}
                onChange={(event) => {
                  politeRef.current = event.target.checked;
                  setPolite(event.target.checked);
                }}
              />
              <span>Polite — do not interrupt a private post. Essential speech stays immediate.</span>
            </label>
          </div>
          {conflict ? (
            <p className="note">
              {conflict.questId} yields. One person, one winning errand — the posts are not duplicated.
            </p>
          ) : null}

          <h3 className="subhead">Just now</h3>
          <ul className="log">
            {snap.log.length === 0 ? <li>The work has not marked an event yet.</li> : snap.log.map((entry, i) => <li key={`${entry.tick}-${i}`}>{entry.text}</li>)}
          </ul>
          <p className="note">{banner}</p>
          <p className="seat">{snap.note}</p>
        </aside>
      </div>

      <details className="deps">
        <summary>What this plate is still waiting on</summary>
        <ul>
          <li>No narrative pack was mounted. Era titles, surnames, and who remembers Ellis are provisional seats, not a family tree.</li>
          <li>Quest ids prefixed fixture are not the county’s real errands. Other sessions own those stages.</li>
          <li>Return 6 leaves the sail loft shuttered on purpose, so a missing successor is a closed post.</li>
          <li>There is no hunger, wage, weather, or job clock. Beats are short so nobody you need makes you wait them out.</li>
        </ul>
      </details>
    </main>
  );
}

function Pad({
  code,
  label,
  keysRef,
}: {
  code: string;
  label: string;
  keysRef: MutableRefObject<Set<string>>;
}) {
  return (
    <button
      type="button"
      className="pad-btn"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        keysRef.current.add(code);
      }}
      onPointerUp={() => keysRef.current.delete(code)}
      onPointerLeave={() => keysRef.current.delete(code)}
      onPointerCancel={() => keysRef.current.delete(code)}
    >
      {label.slice(0, 1)}
    </button>
  );
}
