// County bridge. The Sugar & Ash sim stays the rules. This file only
// mirrors the person already on the map — Ellis, not a second protagonist.
import { HANDLERS } from "./sugar-ash/src/abilities.js";
import { LIMITS } from "./sugar-ash/src/constants.js";
import {
  attune,
  chooseWeave,
  createWorld,
  ellisOf,
  getActor,
  releaseBrace,
  resolveVerb,
  step,
} from "./sugar-ash/src/index.js";
import { endpoint, tryWreath, addActor } from "./sugar-ash/src/state.js";

const FACING = [Math.PI / 2, Math.PI, 0, -Math.PI / 2] as const;

export type WeaveFoe = {
  id: string;
  x: number;
  y: number;
  alive: boolean;
  boss: boolean;
};

export type WeaveRect = { x: number; y: number; w: number; h: number; seal?: boolean };

export type WeaveSync = {
  mapId: string;
  mapW: number;
  mapH: number;
  player: { x: number; y: number; dir: 0 | 1 | 2 | 3; moving: boolean };
  view: { x: number; y: number; w: number; h: number };
  foes: WeaveFoe[];
  solids: WeaveRect[];
  shrines: { id: string; x: number; y: number }[];
  sugar: string | null;
  ash: string | null;
  reduced: boolean;
};

export type WeaveCast = {
  consumed: boolean;
  choice: string[] | null;
  verb: string | null;
  line: string;
};

export type WeaveHit = { id: string; hearts: number };

type World = any;

export function createWeave(seed?: { sap?: number; ember?: number }) {
  const world: World = createWorld({
    bounds: { x: 0, y: 0, w: 4096, h: 4096 },
    camera: { x: 0, y: 0, w: 320, h: 240 },
    autoAwareness: true,
    ai: false,
    settings: { ambientRegen: true, reducedEffects: false },
  });
  world.resources.sap = seed?.sap ?? 80;
  world.resources.ember = seed?.ember ?? 76;
  addEllis(world);
  let mapId = "";
  let eventAt = 0;

  function claims(verb: string) {
    const ids = [world.attune.sugar, world.attune.ash].filter(Boolean) as string[];
    return ids.filter((id) => (HANDLERS as Record<string, { claim?: (w: World, v: string) => boolean }>)[id]?.claim?.(world, verb));
  }

  function speak(): WeaveCast {
    const pending = world.pendingChoice;
    return {
      consumed: false,
      choice: pending ? [...pending.ids] : null,
      verb: pending?.verb ?? null,
      line: world.lastLine ?? "",
    };
  }

  return {
    world,
    claims,
    sugarIs(id: string) {
      return world.attune.sugar === id;
    },
    resources() {
      return { sap: world.resources.sap as number, ember: world.resources.ember as number };
    },
    line() {
      return (world.lastLine as string) ?? "";
    },
    active() {
      return !!(
        world.attune.sugar ||
        world.attune.ash ||
        (world.projectiles as unknown[]).length ||
        (world.blossoms as { alive: boolean }[]).some((b) => b.alive) ||
        (world.tethers as { alive: boolean }[]).some((t) => t.alive) ||
        world.channel
      );
    },
    pending() {
      const p = world.pendingChoice;
      if (!p) return null;
      return { verb: p.verb as string, ids: [...(p.ids as string[])] };
    },
    attune(discipline: "sugar" | "ash", id: string | null) {
      attune(world, discipline, id);
    },
    hydrate(mastery: { sugar: string | null; ash: string | null; sap: number; ember: number }) {
      attune(world, "sugar", mastery.sugar);
      attune(world, "ash", mastery.ash);
      world.resources.sap = mastery.sap;
      world.resources.ember = mastery.ember;
    },
    sync(input: WeaveSync) {
      if (input.mapId !== mapId) {
        mapId = input.mapId;
        world.projectiles = [];
        world.blossoms = [];
        world.marks = [];
        world.tethers = [];
        world.zones = [];
        world.actors = world.actors.filter((a: { id: string }) => a.id === "ellis");
        world.channel = null;
        world.pendingChoice = null;
      }
      world.bounds = { x: 0, y: 0, w: input.mapW, h: input.mapH };
      world.camera = { ...input.view };
      world.settings.reducedEffects = input.reduced;
      if (world.attune.sugar !== input.sugar) attune(world, "sugar", input.sugar);
      if (world.attune.ash !== input.ash) attune(world, "ash", input.ash);

      const e = ellisOf(world);
      e.x = input.player.x;
      e.y = input.player.y;
      e.facing = FACING[input.player.dir];
      e.vx = input.player.moving ? LIMITS.cleanSpeed + 8 : 0;
      e.vy = 0;
      e.alive = true;
      e.onScreen = true;
      e.hp = 9999;

      const keep = new Set(input.foes.map((f) => f.id));
      world.actors = world.actors.filter((a: { id: string; team: string }) => a.id === "ellis" || keep.has(a.id));
      for (const foe of input.foes) {
        let actor = getActor(world, foe.id);
        if (!actor) {
          actor = addFoe(world, foe);
        }
        actor.x = foe.x;
        actor.y = foe.y;
        actor.boss = foe.boss;
        actor.kind = foe.boss ? "boss" : "foe";
        actor.damageFactor = foe.boss ? 0.5 : 1;
        actor.immunities = foe.boss ? { displace: true, hardBind: true, stun: true } : {};
        if (foe.alive && !actor.alive) {
          actor.alive = true;
          actor.hp = 500;
        }
        if (!foe.alive) actor.alive = false;
        const v = input.view;
        actor.onScreen =
          actor.alive &&
          actor.x >= v.x - 8 &&
          actor.x <= v.x + v.w + 8 &&
          actor.y >= v.y - 8 &&
          actor.y <= v.y + v.h + 8;
      }

      world.walls = [];
      world.seals = [];
      for (const r of input.solids) {
        if (r.seal) world.seals.push({ ...r, seal: true });
        else world.walls.push({ ...r });
      }
      const shrineIds = new Set(input.shrines.map((s) => s.id));
      world.anchors = world.anchors.filter((a: { id: string }) => shrineIds.has(a.id));
      for (const s of input.shrines) {
        let a = world.anchors.find((n: { id: string }) => n.id === s.id);
        if (!a) {
          a = {
            id: s.id,
            name: "shrine",
            kind: "anchor",
            anchorKind: "stake",
            x: s.x,
            y: s.y,
            r: 8,
            hp: 30,
            alive: true,
            onScreen: true,
            team: "fixture",
          };
          world.anchors.push(a);
        }
        a.x = s.x;
        a.y = s.y;
        a.alive = true;
        const v = input.view;
        a.onScreen = s.x >= v.x && s.x <= v.x + v.w && s.y >= v.y && s.y <= v.y + v.h;
      }
      world.input.aimX = e.x + Math.cos(e.facing) * 96;
      world.input.aimY = e.y + Math.sin(e.facing) * 96;
      world.input.aimActive = true;
    },
    cast(verb: "strike" | "shot" | "step" | "brace"): WeaveCast {
      if (world.pendingChoice) return speak();
      const claimers = claims(verb);
      if (!claimers.length && !(verb === "step" && world.attune.sugar === "wreath-of-debts")) {
        return { consumed: false, choice: null, verb: null, line: world.lastLine ?? "" };
      }
      const e = ellisOf(world);
      const action = {
        verb,
        dirX: Math.cos(e.facing),
        dirY: Math.sin(e.facing),
        aimX: world.input.aimX,
        aimY: world.input.aimY,
        hits: [] as { id: string }[],
        consumed: false,
      };
      resolveVerb(world, action);
      const pending = world.pendingChoice;
      return {
        consumed: !!action.consumed,
        choice: pending ? [...pending.ids] : null,
        verb: pending?.verb ?? null,
        line: world.lastLine ?? "",
      };
    },
    release() {
      releaseBrace(world);
    },
    choose(id: string) {
      const ok = chooseWeave(world, id);
      return { ok: !!ok, line: (world.lastLine as string) ?? "" };
    },
    tick(dt: number) {
      step(world, dt);
    },
    pullHits(): WeaveHit[] {
      const ev = world.events as { type: string; id?: string; amount?: number }[];
      const out: WeaveHit[] = [];
      for (let i = eventAt; i < ev.length; i++) {
        const e = ev[i];
        if (e.type === "damage" && e.id && (e.amount ?? 0) > 0) {
          out.push({ id: e.id, hearts: (e.amount ?? 0) / LIMITS.meleeDamage });
        }
      }
      eventAt = ev.length;
      if (ev.length > 360) {
        world.events = ev.slice(-200);
        eventAt = world.events.length;
      }
      return out;
    },
    noteCut(id: string, moving: boolean) {
      if (world.attune.sugar !== "wreath-of-debts") return;
      const t = getActor(world, id);
      if (!t || !t.alive || !t.onScreen) return;
      tryWreath(world, t, !moving);
    },
    glyphs() {
      const tethers = (world.tethers as { alive: boolean; glazed?: boolean }[])
        .filter((t) => t.alive)
        .map((t) => {
          const a = endpoint(world, t, "a");
          const b = endpoint(world, t, "b");
          if (!a || !b) return null;
          return { x1: a.x as number, y1: a.y as number, x2: b.x as number, y2: b.y as number, glazed: !!t.glazed };
        })
        .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; glazed: boolean }[];
      const blossoms = (world.blossoms as { alive: boolean; x: number; y: number; r: number; armed: boolean }[])
        .filter((b) => b.alive)
        .map((b) => ({ x: b.x, y: b.y, r: b.r, armed: b.armed }));
      const shots = (world.projectiles as { x: number; y: number; kind: string }[]).map((p) => ({
        x: p.x,
        y: p.y,
        kind: p.kind,
      }));
      const marks = (world.marks as { alive: boolean; x: number; y: number }[])
        .filter((m) => m.alive)
        .map((m) => ({ x: m.x, y: m.y }));
      return { tethers, blossoms, shots, marks };
    },
  };
}

function addEllis(world: World) {
  addActor(world, {
    id: "ellis",
    name: "Ellis",
    team: "ellis",
    x: 0,
    y: 0,
    hp: 9999,
    r: 8,
    speed: 0,
  });
}

function addFoe(world: World, foe: WeaveFoe) {
  return addActor(world, {
    id: foe.id,
    name: foe.id,
    team: "foe",
    boss: foe.boss,
    x: foe.x,
    y: foe.y,
    hp: 500,
    r: foe.boss ? 12 : 8,
    speed: 0,
    alive: foe.alive,
    ai: false,
  });
}

export type Weave = ReturnType<typeof createWeave>;
