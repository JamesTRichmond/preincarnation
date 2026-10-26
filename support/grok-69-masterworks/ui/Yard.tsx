import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { BookOpen, Columns3, Compass, FlaskConical } from "lucide-react";
import { DEMO_IDS, itemById, lootId, MASTERWORKS, type ItemMeta, type Slot } from "../items.ts";
import { runMatrix, type MatrixRow } from "../matrix.ts";
import { runAllProofs, type ProofResult } from "../proofs.ts";
import {
  armTelegraph,
  beginAttack,
  createSim,
  cycleForm,
  dodge,
  dodgeBoots,
  equip,
  equipLegacy,
  HEIGHT,
  placeFoe,
  placeMovable,
  placePlayer,
  restoreLoadout,
  setIntent,
  setLantern,
  setTile,
  shove,
  snapshotLoadout,
  strikeNow,
  swapWeapon,
  tick,
  TILE,
  playTrinket,
  playUtility,
  WIDTH,
  type Dir,
  type Ev,
  type Sim,
} from "../sim.ts";
import { palette } from "./palette.ts";

const SAVE_KEY = "preincarnation-masterworks";
const FACING = ["north", "east", "south", "west"] as const;
const AIM: { x: number; y: number }[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

const TRY: Record<number, string> = {
  1: "Attack from the open. Then step beside the foe and attack again. Iron likes that clinch more than this blade.",
  8: "The foe is standing in the water. Attack. On dry ground the cast only shoves.",
  14: "Attack, then Swap before the maul lands. Interrupting it hurts you.",
  19: "They are two tiles off and the middle is empty. Attack. The hook pulls them onto that tile.",
  21: "Watch Incoming fall. Dodge only while it sits between 0.08 and 0.16. Earlier is a stumble. Boots are still the panic dash.",
  22: "A pot is in front of you. Shove to anchor it. Shove the anchor again to let go. You are slower while it holds.",
  29: "This vest spends its one step the first time a hit would drop you. The next one does not.",
  36: "Form opens it: more reach, and you are easier to hit. Buttoned is the reverse.",
  41: "Attack stores the cut instead of dealing it. Trinket releases the stored shape. Store again to change the shape.",
  49: "Trinket flips the coin. Heads makes the next dodge perfect. Tails spoils the next swing.",
  50: "Ash is in hand and winding. Swap or Form before it lands. The thimble keeps that cut.",
  54: "Attack. Whatever the blade wanted to do, the nail flattens it to ordinary iron.",
  61: "The lamp is lit. When a path is coming, the fitting spends oil and shows the route. Dark, it does nothing.",
  63: "Utility. Charges refill. The piece keeps its name, its form, and anything it had stored.",
  77: "You are in the pillar corridor, pot in front. Shove. Out in the open the same wedge is worse than your hands.",
  79: "Attack once, then again. The second cut is worse than iron.",
};

declare global {
  interface Window {
    __controlsTest?: {
      setKeys: (codes: string[]) => void;
      getPosition: () => { x: number; y: number };
      getTile: () => { x: number; y: number };
    };
  }
}

type Hud = {
  hp: number;
  max: number;
  foeHp: number;
  facing: string;
  weapon: string;
  wearable: string;
  trinket: string;
  utility: string;
  identity: string;
  incoming: string;
  lamp: boolean;
  lines: string[];
};

type Floater = { x: number; y: number; text: string; life: number; bad: boolean };

function pieceName(sim: Sim, slot: Slot) {
  const inst = sim.slots[slot];
  if (!inst) return slot === "weapon" ? sim.legacyWeapon.name : "Empty";
  const meta = itemById(inst.lootId);
  return inst.form && inst.form !== "base" ? `${meta.name} · ${inst.form}` : meta.name;
}

function formatEv(ev: Ev): string {
  switch (ev.t) {
    case "damage":
      return `${ev.amount.toFixed(2)} on ${ev.to}`;
    case "whiff":
      return `Whiff · ${ev.why}`;
    case "self":
      return `You take ${ev.amount.toFixed(2)}`;
    case "tether":
      return `Tether to ${ev.to}`;
    case "dodge":
      return `Dodge · ${ev.window}`;
    case "shape":
      return `Stored ${ev.shape} (${ev.stored.toFixed(2)})`;
    case "release":
      return `Release ${ev.shape}`;
    case "path":
      return ev.revealed ? "Path revealed" : "Path stays dark";
    case "binding":
      return `${ev.id} · ${ev.status}`;
    case "compare":
      return `${ev.winner} leads (${ev.current.toFixed(2)} vs iron ${ev.iron.toFixed(2)})`;
    case "object":
      return `${ev.mode} · ${ev.dist}`;
    case "note":
      return ev.text;
    case "form":
      return `Form ${ev.form}`;
    case "swap":
      return "Swapped hands";
    case "interrupt":
      return "Interrupted";
    case "identity":
      return "";
    default:
      return ev.t;
  }
}

function readHud(sim: Sim): Hud {
  const foe = sim.foes[0];
  return {
    hp: sim.player.hp,
    max: sim.player.maxHp,
    foeHp: foe?.hp ?? 0,
    facing: FACING[sim.player.facing],
    weapon: pieceName(sim, "weapon"),
    wearable: pieceName(sim, "wearable"),
    trinket: pieceName(sim, "trinket"),
    utility: pieceName(sim, "utility"),
    identity: sim.slots.weapon?.identity ?? sim.legacyWeapon.id,
    incoming: foe?.delayed ? foe.delayed.left.toFixed(2) : "",
    lamp: sim.lanternOn,
    lines: sim.log.slice(-8).map(formatEv).filter(Boolean).slice(-4),
  };
}

function turn(sim: Sim, step: number) {
  const facing = ((sim.player.facing + step + 4) % 4) as Dir;
  placePlayer(sim, sim.player.x, sim.player.y, facing);
}

function stage(sim: Sim, n: number) {
  const meta = itemById(lootId(n));
  equip(sim, meta.slot, meta.id);
  if (n === 8) setTile(sim, 7, 4, "water");
  if (n === 21) armTelegraph(sim, "foe", { delay: 1.4, kind: "line" });
  if (n === 22) placeMovable(sim, "pot", 6, 4);
  if (n === 41) equip(sim, "weapon", lootId(1));
  if (n === 61) setLantern(sim, true);
  if (n === 77) {
    placePlayer(sim, 1, 4, 2);
    placeMovable(sim, "pot", 1, 5);
  }
  if (n === 50) equip(sim, "weapon", lootId(10));
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, max: number) {
  const w = 26;
  const ratio = Math.max(0, Math.min(1, hp / Math.max(0.01, max)));
  ctx.fillStyle = palette.bone;
  ctx.fillRect(x - w / 2, y, w, 4);
  ctx.fillStyle = ratio < 0.34 ? palette.amber : palette.ink;
  ctx.fillRect(x - w / 2, y, w * ratio, 4);
}

function draw(canvas: HTMLCanvasElement, sim: Sim, floaters: Floater[], shake: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = WIDTH * TILE;
  const h = HEIGHT * TILE;
  if (canvas.width !== Math.floor(w * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const jx = shake > 0 ? Math.sin(shake * 48) * 3 : 0;
  const jy = shake > 0 ? Math.cos(shake * 36) * 2 : 0;
  ctx.translate(jx, jy);
  ctx.fillStyle = palette.bone;
  ctx.fillRect(-4, -4, w + 8, h + 8);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tile = sim.tiles[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (tile === "water") ctx.fillStyle = palette.slate;
      else if (tile === "shoal") ctx.fillStyle = palette.slate;
      else if (tile === "pillar") ctx.fillStyle = palette.ink;
      else ctx.fillStyle = (x + y) % 2 === 0 ? palette.boneAlt : palette.bone;
      ctx.fillRect(px, py, TILE, TILE);
      if (tile === "water" || tile === "shoal") {
        ctx.strokeStyle = palette.bone;
        ctx.globalAlpha = tile === "shoal" ? 0.85 : 0.45;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 14);
        ctx.lineTo(px + TILE - 4, py + 14);
        ctx.moveTo(px + 8, py + 24);
        ctx.lineTo(px + TILE - 6, py + 24);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (tile === "pillar") {
        ctx.fillStyle = palette.bone;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(px + 15, py + 4, 4, TILE - 8);
        ctx.globalAlpha = 1;
      }
      if (tile === "grave") {
        ctx.fillStyle = palette.ink;
        ctx.fillRect(px + 9, py + 8, 18, 20);
        ctx.fillStyle = palette.amber;
        ctx.fillRect(px + 16, py + 3, 4, 8);
      }
      ctx.strokeStyle = palette.slate;
      ctx.globalAlpha = 0.18;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      ctx.globalAlpha = 1;
    }
  }

  for (const foe of sim.foes) {
    if (!foe.delayed?.revealed) continue;
    ctx.fillStyle = palette.amber;
    ctx.globalAlpha = 0.55;
    for (const step of foe.delayed.path) ctx.fillRect(step.x * TILE, step.y * TILE, TILE, TILE);
    ctx.globalAlpha = 1;
  }

  const aim = AIM[sim.player.facing];
  const ax = sim.player.x + aim.x;
  const ay = sim.player.y + aim.y;
  if (ax >= 0 && ay >= 0 && ax < WIDTH && ay < HEIGHT && sim.tiles[ay][ax] !== "pillar") {
    ctx.strokeStyle = palette.amber;
    ctx.lineWidth = 2;
    ctx.strokeRect(ax * TILE + 8, ay * TILE + 8, TILE - 16, TILE - 16);
  }

  for (const obj of sim.movables) {
    if (obj.integrity <= 0 || obj.mode === "carried") continue;
    const cx = obj.x * TILE + TILE / 2;
    const cy = obj.y * TILE + TILE / 2;
    ctx.beginPath();
    if (obj.kind === "stake") {
      ctx.fillStyle = palette.ink;
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = obj.mode === "anchor" ? palette.amber : palette.ink;
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.bone;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  for (const foe of sim.foes) {
    if (foe.hp <= 0) continue;
    ctx.fillStyle = palette.ink;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(foe.px, foe.py + 12, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.arc(foe.px, foe.py - 1, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.amber;
    ctx.fillRect(foe.px - 6, foe.py - 4, 3, 3);
    ctx.fillRect(foe.px + 3, foe.py - 4, 3, 3);
    if (foe.delayed && !foe.delayed.revealed) {
      const span = Math.max(0.2, Math.min(1, foe.delayed.left / 1.25));
      ctx.strokeStyle = palette.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(foe.px, foe.py - 1, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * span);
      ctx.stroke();
    }
    bar(ctx, foe.px, foe.py - 22, foe.hp, foe.maxHp);
  }

  const p = sim.player;
  ctx.save();
  ctx.translate(p.px, p.py);
  ctx.rotate([-Math.PI / 2, 0, Math.PI / 2, Math.PI][p.facing]);
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(0, 12, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.amber;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(3, -6);
  ctx.lineTo(3, 6);
  ctx.closePath();
  ctx.fill();
  if (p.iframe > 0) {
    ctx.strokeStyle = palette.bone;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  bar(ctx, p.px, p.py - 20, p.hp, p.maxHp);

  ctx.font = "600 13px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  for (const floater of floaters) {
    ctx.strokeStyle = palette.bone;
    ctx.fillStyle = floater.bad ? palette.amber : palette.ink;
    ctx.strokeText(floater.text, floater.x, floater.y);
    ctx.fillText(floater.text, floater.x, floater.y);
  }
}

function noteFloater(sim: Sim, ev: Ev, into: Floater[]) {
  if (ev.t === "damage") {
    const who = sim.foes.find((f) => f.id === ev.to);
    into.push({
      x: who ? who.px : sim.player.px,
      y: (who ? who.py : sim.player.py) - 28,
      text: ev.amount.toFixed(1),
      life: 0.85,
      bad: false,
    });
  } else if (ev.t === "self") {
    into.push({ x: sim.player.px, y: sim.player.py - 28, text: `-${ev.amount.toFixed(1)}`, life: 0.85, bad: true });
  } else if (ev.t === "whiff") {
    into.push({ x: sim.player.px, y: sim.player.py - 26, text: ev.why, life: 0.7, bad: true });
  } else if (ev.t === "tether") {
    into.push({ x: sim.player.px, y: sim.player.py - 30, text: "tether", life: 0.8, bad: false });
  } else if (ev.t === "shape") {
    into.push({ x: sim.player.px, y: sim.player.py - 30, text: ev.shape, life: 0.8, bad: false });
  }
}

export function Yard() {
  const simRef = useRef<Sim | null>(null);
  const keys = useRef(new Set<string>());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floaters = useRef<Floater[]>([]);
  const logCursor = useRef(0);
  const foeClock = useRef(-2);
  const shake = useRef(0);
  const [hud, setHud] = useState<Hud>(() => {
    const sim = createSim();
    stage(sim, 1);
    return readHud(sim);
  });
  const [tab, setTab] = useState<"yard" | "codex" | "matrix" | "proofs">("yard");
  const [focus, setFocus] = useState(1);
  const [query, setQuery] = useState("");
  const [proofs, setProofs] = useState<ProofResult[] | null>(null);
  const [kept, setKept] = useState(false);
  const rows = useMemo(() => runMatrix(), []);
  const focusItem = itemById(lootId(focus));
  const hint = TRY[focus] ?? focusItem.tradeoff;

  useEffect(() => {
    const sim = createSim();
    let restored = false;
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        restoreLoadout(sim, saved);
        restored = true;
      }
    } catch {
      /* a bad save should not blank the yard */
    }
    if (!restored) stage(sim, 1);
    else {
      const worn = sim.slots.weapon ?? sim.slots.wearable ?? sim.slots.trinket ?? sim.slots.utility;
      const n = worn ? Number(worn.lootId.slice(-3)) : 0;
      if (TRY[n]) setFocus(n);
    }
    simRef.current = sim;
    setHud(readHud(sim));
    if (!restored) setFocus(1);
    if (canvasRef.current) draw(canvasRef.current, sim, floaters.current, 0);
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current.add(e.code);
      const live = simRef.current;
      if (!live) return;
      if (["Space", "KeyJ", "KeyK", "KeyU", "KeyI", "KeyH", "KeyF", "KeyQ", "KeyE"].includes(e.code)) e.preventDefault();
      if (e.code === "KeyJ" || e.code === "Space") beginAttack(live);
      if (e.code === "KeyK") dodge(live);
      if (e.code === "KeyU") playTrinket(live);
      if (e.code === "KeyI") playUtility(live);
      if (e.code === "KeyH") shove(live);
      if (e.code === "KeyF") cycleForm(live, live.slots.weapon ? "weapon" : "wearable");
      if (e.code === "KeyQ") turn(live, -1);
      if (e.code === "KeyE") turn(live, 1);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    let raf = 0;
    let last = performance.now();
    let stamp = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const live = simRef.current;
      const canvas = canvasRef.current;
      if (live && canvas) {
        const held = keys.current;
        let ix = 0;
        let iy = 0;
        if (held.has("KeyA") || held.has("ArrowLeft")) ix -= 1;
        if (held.has("KeyD") || held.has("ArrowRight")) ix += 1;
        if (held.has("KeyW") || held.has("ArrowUp")) iy -= 1;
        if (held.has("KeyS") || held.has("ArrowDown")) iy += 1;
        setIntent(live, ix, iy);
        if (dt > 0) tick(live, dt);
        foeClock.current += dt;
        const foe = live.foes[0];
        if (foe && foe.hp <= 0 && foeClock.current > 1.1) {
          const blocked = live.player.x === 7 && live.player.y === 4;
          placeFoe(live, "foe", blocked ? 8 : 7, 4, 12);
          foeClock.current = 0;
        } else if (foe && foe.hp > 0 && !foe.delayed && foeClock.current > 2.8) {
          armTelegraph(live, "foe", { delay: 1.25, kind: "line" });
          foeClock.current = 0;
        }
        if (live.log.length < logCursor.current) logCursor.current = 0;
        if (live.log.length > logCursor.current) {
          for (const ev of live.log.slice(logCursor.current)) {
            noteFloater(live, ev, floaters.current);
            if (ev.t === "self" || (ev.t === "damage" && ev.to === "you")) shake.current = 0.18;
          }
          logCursor.current = live.log.length;
        }
        shake.current = Math.max(0, shake.current - dt);
        for (const floater of floaters.current) {
          floater.life -= dt;
          floater.y -= dt * 22;
        }
        floaters.current = floaters.current.filter((floater) => floater.life > 0);
        draw(canvas, live, floaters.current, shake.current);
        if (now - stamp > 120) {
          stamp = now;
          setHud(readHud(live));
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.__controlsTest = {
      setKeys(codes: string[]) {
        keys.current = new Set(codes);
      },
      getPosition() {
        const p = simRef.current?.player;
        return { x: p?.px ?? 0, y: p?.py ?? 0 };
      },
      getTile() {
        const p = simRef.current?.player;
        return { x: p?.x ?? 0, y: p?.y ?? 0 };
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      delete window.__controlsTest;
    };
  }, []);

  function live() {
    if (!simRef.current) simRef.current = createSim();
    return simRef.current;
  }

  function act(fn: (sim: Sim) => void) {
    const sim = live();
    fn(sim);
    setHud(readHud(sim));
  }

  function equipDemo(n: number) {
    const next = createSim();
    stage(next, n);
    simRef.current = next;
    logCursor.current = next.log.length;
    floaters.current = [];
    foeClock.current = 0;
    setHud(readHud(next));
    setFocus(n);
    setTab("yard");
    setKept(false);
  }

  const shown = MASTERWORKS.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${item.name} ${item.discipline} ${item.slot} ${item.behavior}`.toLowerCase().includes(q);
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 px-4 py-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate/20 pb-4">
        <div>
          <p className="font-display text-3xl leading-none tracking-tight text-ink sm:text-4xl">PREINCARNATION</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate">
            A yard where the new pieces disagree. Step back, step in, and see which one the old iron still beats.
          </p>
        </div>
        <p className="text-sm text-slate">
          {hud.hp.toFixed(1)} / {hud.max} · foe {Math.max(0, hud.foeHp).toFixed(1)} · {hud.facing}
          {hud.lamp ? " · lamp lit" : ""}
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,24rem)]">
        <section className="flex flex-col gap-3">
          <div className="rounded-md bg-slate p-2">
            <canvas ref={canvasRef} className="aspect-4/3 w-full bg-bone touch-none" aria-label="Top-down yard" />
          </div>
          {hud.incoming ? (
            <p className="rounded-md bg-ink px-3 py-2 text-sm text-bone">
              Incoming {hud.incoming}s. The route stays dark unless a fitting or a lit collar shows it. Dodge in the short window only if the coat is clasped.
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-ink">{hint}</p>
          <div className="grid grid-cols-4 gap-2">
            <Ctrl label="Attack" onClick={() => act((s) => beginAttack(s))} accent />
            <Ctrl label="Dodge" onClick={() => act((s) => dodge(s))} />
            <Ctrl label="Trinket" onClick={() => act((s) => playTrinket(s))} />
            <Ctrl label="Utility" onClick={() => act((s) => playUtility(s))} />
            <Ctrl label="Shove" onClick={() => act((s) => shove(s))} />
            <Ctrl label="Boots" onClick={() => act((s) => dodgeBoots(s))} />
            <Ctrl label="Swap" onClick={() => act((s) => swapWeapon(s))} />
            <Ctrl label="Form" onClick={() => act((s) => cycleForm(s, s.slots.weapon ? "weapon" : "wearable"))} />
          </div>
          <div className="mx-auto grid w-56 grid-cols-3 gap-2">
            <span />
            <Pad label="North" code="KeyW" keys={keys} />
            <span />
            <Pad label="West" code="KeyA" keys={keys} />
            <div className="flex min-h-11 items-center justify-center text-xs uppercase tracking-widest text-slate">
              {hud.facing}
            </div>
            <Pad label="East" code="KeyD" keys={keys} />
            <Ctrl label="Turn left" onClick={() => act((s) => turn(s, -1))} />
            <Pad label="South" code="KeyS" keys={keys} />
            <Ctrl label="Turn right" onClick={() => act((s) => turn(s, 1))} />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat k="Weapon" v={hud.weapon} />
            <Stat k="Wear" v={hud.wearable} />
            <Stat k="Trinket" v={hud.trinket} />
            <Stat k="Utility" v={hud.utility} />
          </dl>
          <ul className="min-h-16 rounded-md border border-slate/20 px-3 py-2 text-sm leading-relaxed text-ink">
            {hud.lines.length === 0 ? <li className="text-slate">Swing. The number over the foe is the whole argument.</li> : null}
            {hud.lines.map((line, i) => (
              <li key={`${line}-${i}`}>{line}</li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-slate">
            WASD walks and does not turn. A is left, D is right. Q and E, or the turn buttons, aim the hand. Space attacks.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Tab on={tab === "yard"} icon={<Compass size={16} />} label="Sixteen" onClick={() => setTab("yard")} />
            <Tab on={tab === "codex"} icon={<BookOpen size={16} />} label="Codex" onClick={() => setTab("codex")} />
            <Tab on={tab === "matrix"} icon={<Columns3 size={16} />} label="Matrix" onClick={() => setTab("matrix")} />
            <Tab on={tab === "proofs"} icon={<FlaskConical size={16} />} label="Proofs" onClick={() => setTab("proofs")} />
          </div>

          {tab === "yard" ? (
            <div className="flex flex-col gap-4">
              <article className="rounded-md border border-slate/20 p-4">
                <p className="text-xs uppercase tracking-widest text-slate">{focusItem.discipline}</p>
                <h2 className="font-display text-2xl text-ink">{focusItem.name}</h2>
                <p className="mt-2 text-sm leading-relaxed">{focusItem.behavior}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate">{focusItem.tradeoff}</p>
              </article>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_IDS.map((demoId) => {
                  const item = itemById(demoId);
                  const on = focus === item.n;
                  return (
                    <button
                      key={demoId}
                      type="button"
                      onClick={() => equipDemo(item.n)}
                      className={`min-h-11 rounded-md border px-2 py-2 text-left text-sm ${
                        on ? "border-ink bg-ink text-bone" : "border-slate/30 text-ink"
                      }`}
                    >
                      <span className={`block text-xs uppercase tracking-widest ${on ? "text-bone/80" : "text-slate"}`}>
                        {item.discipline}
                      </span>
                      {item.name}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Ctrl label="Arm a path" onClick={() => act((s) => armTelegraph(s, "foe", { delay: 1.4, kind: "line" }))} />
                <Ctrl label="Resolve swing" onClick={() => act((s) => strikeNow(s))} />
                <Ctrl label="Short iron" onClick={() => act((s) => equipLegacy(s, "iron"))} />
                <Ctrl label="Rifle" onClick={() => act((s) => equipLegacy(s, "rifle"))} />
                <Ctrl label={hud.lamp ? "Snuff lamp" : "Light lamp"} onClick={() => act((s) => setLantern(s, !s.lanternOn))} />
                <Ctrl
                  label={kept ? "Kit kept" : "Keep this kit"}
                  onClick={() =>
                    act((s) => {
                      localStorage.setItem(SAVE_KEY, snapshotLoadout(s));
                      setKept(true);
                    })
                  }
                />
              </div>
              <p className="text-sm leading-relaxed text-slate">Hand identity {hud.identity}. Keeping a kit saves that identity in this browser.</p>
            </div>
          ) : null}

          {tab === "codex" ? (
            <div className="flex flex-col gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the eighty"
                className="min-h-11 rounded-md border border-slate/30 bg-bone px-3 text-ink"
              />
              <ul className="flex max-h-[36rem] flex-col gap-3 overflow-auto pr-1">
                {shown.map((item) => (
                  <CodexCard key={item.id} item={item} />
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-slate">
                Quarry, Creek, Sugar, Ash, Lantern, and Hollow are names on the pieces. Their rank and transform bindings are marked unavailable.
              </p>
            </div>
          ) : null}

          {tab === "matrix" ? (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate/30 text-slate">
                    <th className="py-2 pr-3 font-medium">Situation</th>
                    <th className="py-2 pr-3 font-medium">Leads</th>
                    <th className="py-2 font-medium">Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <MatrixLine key={r.id} row={r} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "proofs" ? (
            <div className="flex flex-col gap-3">
              <button type="button" className="min-h-11 rounded-md bg-ink px-4 text-bone" onClick={() => setProofs(runAllProofs())}>
                Run the eighty
              </button>
              {proofs ? (
                <p className="text-sm text-slate">
                  {proofs.filter((p) => p.ok).length} of {proofs.length} held.
                </p>
              ) : (
                <p className="text-sm text-slate">Each piece has one specific effect check.</p>
              )}
              <ul className="max-h-[32rem] overflow-auto text-sm leading-relaxed">
                {(proofs ?? []).map((p) => (
                  <li key={p.n} className={p.ok ? "text-ink" : "text-amber"}>
                    {String(p.n).padStart(3, "0")} {p.name}
                    {p.ok ? "" : ` — ${p.error}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Ctrl({ label, onClick, accent = false }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-md px-2 text-sm ${accent ? "bg-amber text-ink" : "border border-slate/30 text-ink"}`}
    >
      {label}
    </button>
  );
}

function Pad({ label, code, keys }: { label: string; code: string; keys: RefObject<Set<string>> }) {
  return (
    <button
      type="button"
      className="min-h-11 rounded-md border border-slate/30 text-sm text-ink"
      onPointerDown={(e) => {
        e.preventDefault();
        keys.current?.add(code);
      }}
      onPointerUp={() => keys.current?.delete(code)}
      onPointerCancel={() => keys.current?.delete(code)}
      onPointerLeave={() => keys.current?.delete(code)}
    >
      {label}
    </button>
  );
}

function Tab({
  on,
  icon,
  label,
  onClick,
}: {
  on: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm ${on ? "bg-ink text-bone" : "text-slate"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-slate/15 px-3 py-2">
      <dt className="text-xs uppercase tracking-widest text-slate">{k}</dt>
      <dd className="mt-1 text-ink">{v}</dd>
    </div>
  );
}

function CodexCard({ item }: { item: ItemMeta }) {
  return (
    <li className="rounded-md border border-slate/20 p-3">
      <p className="text-xs uppercase tracking-widest text-slate">
        {item.slot} · {item.discipline}
      </p>
      <h3 className="font-display text-xl text-ink">{item.name}</h3>
      <p className="mt-1 text-sm leading-relaxed">{item.behavior}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate">{item.tradeoff}</p>
    </li>
  );
}

function MatrixLine({ row }: { row: MatrixRow }) {
  return (
    <tr className="border-b border-slate/15 align-top">
      <td className="py-2 pr-3">{row.situation}</td>
      <td className="py-2 pr-3 text-ink">{row.winner}</td>
      <td className="py-2 text-slate">{row.scores.map((s) => `${s.name} ${s.value.toFixed(2)}`).join(" · ")}</td>
    </tr>
  );
}