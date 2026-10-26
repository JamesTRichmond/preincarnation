/**
 * Masterwork yard. Discrete enough for effect tests, pixel-moving for play.
 * Does not import src/game. Legacy slash math is the mirror in legacy.ts.
 * No repair function exists in this module.
 */
import { legacySlashDamage } from "./legacy.ts";
import { itemById, lootId, type Slot } from "./items.ts";

export const TILE = 36;
export const WIDTH = 12;
export const HEIGHT = 9;

export type Dir = 0 | 1 | 2 | 3;
export const VEC: { x: number; y: number }[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export type Tile = "open" | "water" | "shoal" | "grave" | "pillar";
export type ObjKind = "pot" | "cane-block" | "stake";
export type HitKind = "line" | "melee" | "burn" | "instant";

export type Ev =
  | { t: "damage"; amount: number; to: string; via: string; mult: number; base: number }
  | { t: "whiff"; via: string; why: string }
  | { t: "self"; amount: number; via: string }
  | { t: "heal"; amount: number; to: string; via: string }
  | { t: "tether"; from: string; to: string; via: string }
  | { t: "dodge"; window: string; via: string }
  | { t: "shape"; shape: string; via: string; stored: number }
  | { t: "release"; shape: string; via: string; hits: number; self: number }
  | { t: "object"; id: string; mode: string; via: string; dist: number }
  | { t: "path"; tiles: number; via: string; revealed: boolean }
  | { t: "binding"; id: string; status: "available" | "unavailable" | "inert" }
  | { t: "interrupt"; via: string }
  | { t: "swap"; from: string; to: string }
  | { t: "form"; id: string; form: string; identity: string }
  | { t: "modify"; identity: string; mod: string }
  | { t: "restore"; identity: string; mods: number; restorations: number }
  | { t: "reset"; identity: string; resource: string; value: number }
  | { t: "identity"; identity: string; lootId: string }
  | { t: "root"; who: string; via: string }
  | { t: "move"; who: string; x: number; y: number; via: string }
  | { t: "compare"; winner: string; iron: number; current: number }
  | { t: "note"; text: string }
  | { t: "verb"; relic: string };

export type Mod = { id: string; tag: string };

export type Instance = {
  identity: string;
  lootId: string;
  form: string;
  mods: Mod[];
  restorations: number;
};

export type Actor = {
  id: string;
  x: number;
  y: number;
  px: number;
  py: number;
  facing: Dir;
  hp: number;
  maxHp: number;
  team: "player" | "foe";
  rooted: number;
  iframe: number;
  stillness: number;
  absence: number;
  lastEmpty: { x: number; y: number } | null;
  approach: -1 | 0 | 1;
  swinging: boolean;
  marked: boolean;
  stuckTo: string | null;
  lastTargetId: string | null;
  attack: null | { lootId: string; phase: "windup" | "recover"; left: number };
  delayed: null | {
    path: { x: number; y: number }[];
    left: number;
    kind: "line" | "melee";
    revealed: boolean;
  };
};

export type Movable = {
  id: string;
  kind: ObjKind;
  x: number;
  y: number;
  mode: "free" | "anchor" | "carried";
  integrity: number;
  cover: boolean;
};

export type LegacyWeapon = {
  id: string;
  name: string;
  dmg: number;
  projectile: boolean;
  ammo: number | null;
  reach: number;
};

export type Sim = {
  w: number;
  h: number;
  tiles: Tile[][];
  player: Actor;
  foes: Actor[];
  movables: Movable[];
  slots: Record<Slot, Instance | null>;
  sheathed: Instance | null;
  relics: string[];
  lanternOn: boolean;
  edge: number;
  incarnationDamage: number;
  tropoverse: boolean;
  flawId: string;
  legacyWeapon: LegacyWeapon;
  resources: Record<string, number>;
  stored: null | { amount: number; shape: string; identity: string };
  log: Ev[];
  serial: number;
  intentX: number;
  intentY: number;
  speed: number;
  lastStep: { x: number; y: number };
  lockout: number;
  weakened: boolean;
  shortRecover: boolean;
  wideDodge: boolean;
  stickyNext: boolean;
  suppressReveal: boolean;
  cowlSpent: boolean;
  marginValid: boolean;
  mp: number;
  breath: number;
  tetherTo: string | null;
  echo: null | { id: string; amount: number; until: number };
  lob: null | { x: number; y: number; left: number; via: string; amount: number };
  backlash: null | { left: number; amount: number; identity: string };
  coinNext: "heads" | "tails" | null;
  perfectDodge: boolean;
  whiffNext: boolean;
  remembered: null | { kind: string; payload: string };
  locket: null | { lootId: string; identity: string; form: string };
  chalk: { x: number; y: number }[];
  breathLine: { x: number; y: number }[];
  marks: { x: number; y: number }[];
  away: number;
  darkStill: number;
  adjacentFor: number;
  sashOn: boolean;
  guard: number;
  carrying: string | null;
  panHeld: { x: number; y: number }[] | null;
  panReady: boolean;
  maskUp: boolean;
  maskStill: number;
  seed: null | { x: number; y: number; left: number };
  now: number;
  arrows: number;
  excavated: string[];
  returned: boolean;
  ipod: boolean;
  swim: boolean;
  cracked: string[];
  moths: number;
  post: { x: number; y: number };
  objSerial: number;
  bindingOnce: Record<string, true>;
  dryAmount: number;
};

const IRON: LegacyWeapon = {
  id: "starter-iron",
  name: "Short iron",
  dmg: 1,
  projectile: false,
  ammo: null,
  reach: 1,
};

function grid(): Tile[][] {
  const g: Tile[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => "open" as Tile));
  for (let y = 1; y <= 6; y++) {
    g[y][0] = "pillar";
    g[y][2] = "pillar";
  }
  for (let x = 0; x < WIDTH; x++) g[8][x] = "water";
  g[2][8] = "grave";
  return g;
}

function actor(id: string, x: number, y: number, team: "player" | "foe", hp: number): Actor {
  return {
    id,
    x,
    y,
    px: x * TILE + TILE / 2,
    py: y * TILE + TILE / 2,
    facing: 1,
    hp,
    maxHp: hp,
    team,
    rooted: 0,
    iframe: 0,
    stillness: 0,
    absence: 0,
    lastEmpty: null,
    approach: 0,
    swinging: false,
    marked: false,
    stuckTo: null,
    lastTargetId: null,
    attack: null,
    delayed: null,
  };
}

export function createSim(opts?: { relics?: string[] }): Sim {
  const sim: Sim = {
    w: WIDTH,
    h: HEIGHT,
    tiles: grid(),
    player: actor("you", 5, 4, "player", 6),
    foes: [actor("foe", 7, 4, "foe", 12)],
    movables: [],
    slots: { weapon: null, wearable: null, trinket: null, utility: null },
    sheathed: null,
    relics: opts?.relics ?? ["sword", "lantern", "boots", "cane", "shovel", "flippers"],
    lanternOn: false,
    edge: 0,
    incarnationDamage: 1,
    tropoverse: false,
    flawId: "",
    legacyWeapon: { ...IRON },
    resources: {},
    stored: null,
    log: [],
    serial: 0,
    intentX: 0,
    intentY: 0,
    speed: 0,
    lastStep: { x: 0, y: 0 },
    lockout: 0,
    weakened: false,
    shortRecover: false,
    wideDodge: false,
    stickyNext: false,
    suppressReveal: false,
    cowlSpent: false,
    marginValid: false,
    mp: 4,
    breath: 0,
    tetherTo: null,
    echo: null,
    lob: null,
    backlash: null,
    coinNext: null,
    perfectDodge: false,
    whiffNext: false,
    remembered: null,
    locket: null,
    chalk: [],
    breathLine: [],
    marks: [],
    away: 0,
    darkStill: 0,
    adjacentFor: 0,
    sashOn: false,
    guard: 0,
    carrying: null,
    panHeld: null,
    panReady: true,
    maskUp: false,
    maskStill: 0,
    seed: null,
    now: 0,
    arrows: 3,
    excavated: [],
    returned: false,
    ipod: false,
    swim: false,
    cracked: [],
    moths: 1,
    post: { x: 10, y: 4 },
    objSerial: 1,
    bindingOnce: {},
    dryAmount: 0,
  };
  placeMovable(sim, "pot", 9, 6);
  refreshEmpty(sim);
  return sim;
}

export const id = lootId;

export function piece(sim: Sim, loot: string): Instance | null {
  for (const slot of ["weapon", "wearable", "trinket", "utility"] as const) {
    if (sim.slots[slot]?.lootId === loot) return sim.slots[slot];
  }
  return null;
}

export function resourceOf(sim: Sim, identity: string, key: string): number {
  return sim.resources[`${identity}:${key}`] ?? 0;
}

export function writeResource(sim: Sim, identity: string, key: string, value: number) {
  sim.resources[`${identity}:${key}`] = value;
}

function push(sim: Sim, ev: Ev) {
  sim.log.push(ev);
}

function remember(sim: Sim, kind: string, payload = "") {
  sim.remembered = { kind, payload };
}

function defaultForm(loot: string): string {
  return itemById(loot).forms[0] ?? "base";
}

function initCharge(sim: Sim, inst: Instance) {
  const n = Number(inst.lootId.slice(-3));
  if (n === 61) writeResource(sim, inst.identity, "oil", 3);
  if (n === 17) writeResource(sim, inst.identity, "ribbon", 1);
  if (n === 79) writeResource(sim, inst.identity, "seal", 1);
  if (n === 29) writeResource(sim, inst.identity, "phase", 1);
  if (n === 71) writeResource(sim, inst.identity, "mask", 1);
  if (n === 58 || n === 57) writeResource(sim, inst.identity, "charge", 1);
  if (n === 39) {
    sim.cowlSpent = false;
    sim.suppressReveal = true;
  }
}

export function equip(sim: Sim, slot: Slot, loot: string | null): Instance | null {
  const prev = sim.slots[slot];
  if (slot === "weapon" && prev) sim.sheathed = prev;
  if (!loot) {
    sim.slots[slot] = null;
    if (slot === "wearable") syncCowl(sim);
    return null;
  }
  sim.serial += 1;
  const inst: Instance = {
    identity: `mw.${loot.slice(-3)}.${sim.serial}`,
    lootId: loot,
    form: defaultForm(loot),
    mods: [],
    restorations: 0,
  };
  sim.slots[slot] = inst;
  initCharge(sim, inst);
  push(sim, { t: "identity", identity: inst.identity, lootId: loot });
  syncCowl(sim);
  return inst;
}

export function equipLegacy(sim: Sim, kind: "iron" | "rifle" | "bow") {
  if (kind === "rifle") {
    sim.legacyWeapon = {
      id: "winchester",
      name: "Kitchen-door Winchester",
      dmg: 2.2,
      projectile: true,
      ammo: 6,
      reach: 4,
    };
  } else if (kind === "bow") {
    sim.legacyWeapon = { id: "ash-bow", name: "Ash bow", dmg: 1.3, projectile: true, ammo: 8, reach: 4 };
  } else {
    sim.legacyWeapon = { ...IRON, ammo: null };
  }
  if (sim.slots.weapon) sim.sheathed = sim.slots.weapon;
  sim.slots.weapon = null;
}

export function setRelics(sim: Sim, relics: string[]) {
  sim.relics = relics.slice();
}

export function setLantern(sim: Sim, on: boolean) {
  sim.lanternOn = on;
  if (on) sim.darkStill = 0;
}

export function exportPiece(inst: Instance) {
  return {
    version: 1 as const,
    identity: inst.identity,
    lootId: inst.lootId,
    form: inst.form,
    mods: inst.mods.map((m) => ({ ...m })),
    restorations: inst.restorations,
  };
}

export function importPiece(saved: ReturnType<typeof exportPiece>): Instance {
  return {
    identity: saved.identity,
    lootId: saved.lootId,
    form: saved.form,
    mods: saved.mods.map((m) => ({ ...m })),
    restorations: saved.restorations,
  };
}

export function graveRecord(inst: Instance) {
  const meta = itemById(inst.lootId);
  return { id: inst.identity, name: meta.name, magic: true as const, kind: meta.slot };
}

export function snapshotLoadout(sim: Sim): string {
  return JSON.stringify({
    slots: sim.slots,
    sheathed: sim.sheathed,
    resources: sim.resources,
    stored: sim.stored,
    legacyWeapon: sim.legacyWeapon,
    relics: sim.relics,
  });
}

export function restoreLoadout(sim: Sim, json: string) {
  const data = JSON.parse(json) as {
    slots: Sim["slots"];
    sheathed: Instance | null;
    resources: Record<string, number>;
    stored: Sim["stored"];
    legacyWeapon: LegacyWeapon;
    relics: string[];
  };
  sim.slots = data.slots;
  sim.sheathed = data.sheathed;
  sim.resources = data.resources;
  sim.stored = data.stored;
  sim.legacyWeapon = data.legacyWeapon;
  sim.relics = data.relics;
}

function inside(sim: Sim, x: number, y: number) {
  return x >= 0 && y >= 0 && x < sim.w && y < sim.h;
}

function pillar(sim: Sim, x: number, y: number) {
  return !inside(sim, x, y) || sim.tiles[y][x] === "pillar";
}

export function placePlayer(sim: Sim, x: number, y: number, facing: Dir = sim.player.facing) {
  sim.player.x = x;
  sim.player.y = y;
  sim.player.facing = facing;
  sim.player.px = x * TILE + TILE / 2;
  sim.player.py = y * TILE + TILE / 2;
  refreshEmpty(sim);
}

export function placeFoe(sim: Sim, foeId: string, x: number, y: number, hp?: number) {
  let foe = sim.foes.find((f) => f.id === foeId);
  if (!foe) {
    foe = actor(foeId, x, y, "foe", hp ?? 12);
    sim.foes.push(foe);
  } else {
    foe.x = x;
    foe.y = y;
    foe.px = x * TILE + TILE / 2;
    foe.py = y * TILE + TILE / 2;
    if (hp != null) {
      foe.hp = hp;
      foe.maxHp = Math.max(foe.maxHp, hp);
    }
  }
  return foe;
}

export function clearFoes(sim: Sim) {
  sim.foes = [];
}

export function foeById(sim: Sim, foeId = "foe") {
  const foe = sim.foes.find((f) => f.id === foeId);
  if (!foe) throw new Error(`missing foe ${foeId}`);
  return foe;
}

export function setApproach(sim: Sim, foeId: string, approach: -1 | 0 | 1) {
  foeById(sim, foeId).approach = approach;
}

export function setSwinging(sim: Sim, foeId: string, swinging: boolean) {
  foeById(sim, foeId).swinging = swinging;
}

export function setHp(sim: Sim, hp: number) {
  sim.player.hp = hp;
}

export function clearMovables(sim: Sim) {
  sim.movables = [];
  sim.carrying = null;
}

export function placeMovable(sim: Sim, kind: ObjKind, x: number, y: number): Movable {
  const obj: Movable = {
    id: kind + "-" + sim.objSerial++,
    kind,
    x,
    y,
    mode: "free",
    integrity: kind === "stake" ? 99 : 2,
    cover: false,
  };
  sim.movables.push(obj);
  return obj;
}

export function setTile(sim: Sim, x: number, y: number, tile: Tile) {
  if (inside(sim, x, y)) sim.tiles[y][x] = tile;
}

function occ(sim: Sim, x: number, y: number, stakesCount: boolean) {
  if (pillar(sim, x, y)) return true;
  for (const o of sim.movables) {
    if (o.integrity <= 0 || o.mode === "carried") continue;
    if (o.x === x && o.y === y) {
      if (o.kind === "stake" && !stakesCount) continue;
      return true;
    }
  }
  if (sim.player.x === x && sim.player.y === y) return true;
  return sim.foes.some((f) => f.hp > 0 && f.x === x && f.y === y);
}

function neighbors(wide: boolean): { x: number; y: number }[] {
  const o = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  if (!wide) return o;
  return o.concat([
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ]);
}

export function emptyAround(sim: Sim, x: number, y: number, wide: boolean) {
  for (const d of neighbors(wide)) {
    if (occ(sim, x + d.x, y + d.y, false)) return false;
  }
  return true;
}

function refreshEmpty(sim: Sim) {
  if (emptyAround(sim, sim.player.x, sim.player.y, false)) {
    sim.player.lastEmpty = { x: sim.player.x, y: sim.player.y };
  }
  const blade = piece(sim, id(1));
  const wide = !!blade?.mods.some((m) => m.tag === "wider-margin");
  const facing = VEC[sim.player.facing];
  const ix = sim.player.x + facing.x;
  const iy = sim.player.y + facing.y;
  sim.marginValid = emptyAround(sim, sim.player.x, sim.player.y, wide) && !occ(sim, ix, iy, true);
}

function wet(sim: Sim, x: number, y: number) {
  const t = inside(sim, x, y) ? sim.tiles[y][x] : "open";
  return t === "water" || t === "shoal";
}

function cramped(sim: Sim, x: number, y: number) {
  return neighbors(false).some((d) => inside(sim, x + d.x, y + d.y) && sim.tiles[y + d.y][x + d.x] === "pillar");
}

function corridor(sim: Sim, x: number, y: number, facing: Dir) {
  const side = VEC[(facing + 1) % 4];
  return (
    pillar(sim, x + side.x, y + side.y) &&
    pillar(sim, x - side.x, y - side.y) &&
    !pillar(sim, x + VEC[facing].x, y + VEC[facing].y)
  );
}

export function currentReach(sim: Sim): number {
  const w = sim.slots.weapon;
  const n = w ? Number(w.lootId.slice(-3)) : 0;
  let reach = sim.legacyWeapon.reach;
  if (w) {
    reach = 1;
    if ([1, 3, 8, 13, 19].includes(n)) reach = 2;
    if (n === 10) reach = 3;
    if (n === 17) reach = 4;
  }
  if (piece(sim, id(36))?.form === "open") reach += 1;
  if (piece(sim, id(40))) reach = Math.min(reach, 1);
  return reach;
}

function windupOf(sim: Sim): number {
  const w = sim.slots.weapon;
  const n = w ? Number(w.lootId.slice(-3)) : 0;
  let wind = 0;
  if (n === 14) wind = 0.48;
  if (n === 10) wind = 0.2;
  if (piece(sim, id(40))) wind = Math.max(wind, 0.2);
  return wind;
}

function recoverOf(sim: Sim): number {
  if (sim.shortRecover) {
    sim.shortRecover = false;
    return 0;
  }
  if (piece(sim, id(32))) return 0.35;
  return 0.12;
}

function slash(sim: Sim, weaponDmg: number) {
  return legacySlashDamage({
    weaponDmg,
    incarnationDamage: sim.incarnationDamage,
    edge: sim.edge,
    tropoverse: sim.tropoverse,
    flawId: sim.flawId,
  });
}

function sealFactor(sim: Sim, consume: boolean): number {
  const seal = piece(sim, id(79));
  if (!seal || piece(sim, id(54))) return 1;
  const armed = resourceOf(sim, seal.identity, "seal") >= 1;
  if (consume && armed) writeResource(sim, seal.identity, "seal", 0);
  return armed ? 1.5 : 0.75;
}

type Plan = {
  targets: { actor: Actor; mult: number; flat: number }[];
  mult: number;
  whiff: string | null;
  self: number;
  noStore: boolean;
  via: string;
};

function rayFoes(sim: Sim, reach: number, stopAtFirst: boolean): Actor[] {
  const f = VEC[sim.player.facing];
  const hits: Actor[] = [];
  for (let i = 1; i <= reach; i++) {
    const x = sim.player.x + f.x * i;
    const y = sim.player.y + f.y * i;
    if (!inside(sim, x, y) || sim.tiles[y][x] === "pillar") break;
    if (sim.movables.some((o) => o.kind === "stake" && o.integrity > 0 && o.x === x && o.y === y && o.mode !== "carried")) break;
    const foe = sim.foes.find((fo) => fo.hp > 0 && fo.x === x && fo.y === y);
    if (foe) {
      hits.push(foe);
      if (stopAtFirst) break;
    }
  }
  return hits;
}

function fanFoes(sim: Sim): Actor[] {
  const f = VEC[sim.player.facing];
  const s = VEC[(sim.player.facing + 1) % 4];
  const cells = [
    [f.x, f.y],
    [f.x * 2, f.y * 2],
    [f.x + s.x, f.y + s.y],
    [f.x - s.x, f.y - s.y],
  ];
  const hits: Actor[] = [];
  for (const [dx, dy] of cells) {
    const x = sim.player.x + dx;
    const y = sim.player.y + dy;
    const foe = sim.foes.find((fo) => fo.hp > 0 && fo.x === x && fo.y === y);
    if (foe && !hits.includes(foe)) hits.push(foe);
  }
  return hits;
}

function plan(sim: Sim): Plan {
  const w = sim.slots.weapon;
  const n = w ? Number(w.lootId.slice(-3)) : 0;
  const via = w?.lootId ?? sim.legacyWeapon.id;
  const reach = currentReach(sim);
  const out: Plan = {
    targets: rayFoes(sim, reach, true).map((actor) => ({ actor, mult: 1, flat: 0 })),
    mult: 1,
    whiff: null,
    self: 0,
    noStore: false,
    via,
  };
  if (!w && sim.legacyWeapon.projectile) {
    if ((sim.legacyWeapon.ammo ?? 0) <= 0) {
      out.whiff = "ammo";
      out.targets = [];
      return out;
    }
  }
  let breath = 1;
  if (sim.breathLine.length >= 2) {
    const line = sim.breathLine;
    sim.breathLine = [];
    const mids = line.slice(0, -1);
    const blocked = mids.some(
      (c) => sim.foes.some((f) => f.hp > 0 && f.x === c.x && f.y === c.y) || (sim.player.x === c.x && sim.player.y === c.y),
    );
    if (blocked) {
      out.whiff = "chalk-blocked";
      out.targets = [];
      return out;
    }
    const end = line[line.length - 1];
    const foe = sim.foes.find((f) => f.hp > 0 && f.x === end.x && f.y === end.y);
    if (foe) {
      out.targets = [{ actor: foe, mult: 1, flat: 0 }];
      breath = 1.6;
    }
  }
  if (n === 1) applyMargin(sim, out);
  else if (n === 2) applyWindupBrand(sim, out);
  else if (n === 3) applyBackstep(sim, out);
  else if (n === 4) out.mult = sim.player.stillness >= 0.6 ? 1.65 : 0.5;
  else if (n === 5) applyBank(sim, out);
  else if (n === 6) applySplit(sim, out);
  else if (n === 7) out.mult = cramped(sim, sim.player.x, sim.player.y) ? 1.5 : 0.6;
  else if (n === 8) applyCreek(sim, out);
  else if (n === 10) applyLoft(sim, out);
  else if (n === 11) applyPathBrand(sim, out);
  else if (n === 12) {
    if (sim.player.absence >= 1) {
      sim.player.absence -= 1;
      out.mult = 2;
    } else out.mult = 0.35;
  } else if (n === 13) {
    const a = out.targets[0]?.actor.approach ?? 0;
    out.mult = a > 0 ? 1.7 : a < 0 ? 0.25 : 0.8;
  } else if (n === 14) out.mult = 1.9;
  else if (n === 15) applyCourtesy(sim, out);
  else if (n === 16) {
    const foe = out.targets[0]?.actor;
    out.mult = foe && sim.tiles[foe.y][foe.x] === "grave" ? 2 : 0.4;
  } else if (n === 17) applyRibbon(sim, out);
  else if (n === 18) {
    const others = [sim.slots.wearable, sim.slots.trinket, sim.slots.utility].filter(Boolean).length;
    out.mult = others === 0 ? 1.45 : 0.55;
  } else if (n === 19) applyHook(sim, out);
  else if (n === 20) applySickle(sim, out);
  out.mult *= breath;
  if (w?.mods.some((m) => m.tag === "etched") && sim.player.stillness < 0.3) {
    out.whiff = "etched";
    out.targets = [];
  }
  if (sim.darkStill >= 3 && out.targets.length && !out.whiff) {
    for (const t of out.targets) t.actor.rooted = Math.max(t.actor.rooted, 0.8);
    sim.darkStill = 0;
    push(sim, { t: "root", who: out.targets[0].actor.id, via: id(55) });
  }
  if (sim.weakened) {
    out.mult *= 0.5;
    sim.weakened = false;
  }
  const bead = piece(sim, id(58));
  if (bead && out.targets.length > 1 && resourceOf(sim, bead.identity, "charge") >= 1) {
    out.targets = [{ actor: out.targets[0].actor, mult: 1, flat: out.targets[0].flat }];
    writeResource(sim, bead.identity, "charge", 0);
    push(sim, { t: "note", text: "courtesy-bead" });
  }
  return out;
}

function applyMargin(sim: Sim, out: Plan) {
  const inst = piece(sim, id(1));
  const wide = !!inst?.mods.some((m) => m.tag === "wider-margin");
  const form = inst?.form ?? "open";
  const f = VEC[sim.player.facing];
  const blocked = occ(sim, sim.player.x + f.x, sim.player.y + f.y, true);
  if (form === "narrow") out.mult = blocked ? 0.55 : 1.15;
  else out.mult = emptyAround(sim, sim.player.x, sim.player.y, wide) && !blocked ? 1.7 : 0.45;
}

function applyWindupBrand(sim: Sim, out: Plan) {
  const foe = out.targets[0]?.actor;
  if (!foe) return;
  if (foe.delayed && foe.delayed.left > 0) out.mult = 1.8;
  else if (foe.swinging) out.mult = 0.4;
  else out.mult = 0.85;
}

function applyBackstep(sim: Sim, out: Plan) {
  const f = VEC[sim.player.facing];
  const back = sim.lastStep.x === -f.x && sim.lastStep.y === -f.y && (sim.lastStep.x !== 0 || sim.lastStep.y !== 0);
  const forward = sim.lastStep.x === f.x && sim.lastStep.y === f.y && (f.x !== 0 || f.y !== 0);
  out.mult = back ? 1.6 : forward ? 0.3 : 0.7;
}

function applyBank(sim: Sim, out: Plan) {
  const foe = out.targets[0]?.actor;
  if (!foe) return;
  if (sim.echo && sim.echo.id === foe.id && sim.now <= sim.echo.until) {
    out.targets[0].flat = sim.echo.amount;
    out.targets[0].mult = 0;
    out.mult = 0;
    sim.echo = null;
    push(sim, { t: "note", text: "bank-paid" });
  } else {
    out.mult = 0.4;
    const bank = slash(sim, 1) * 0.9;
    sim.echo = { id: foe.id, amount: bank, until: sim.now + 0.4 };
    if (out.targets.length > 1) out.targets = [out.targets[0]];
  }
}

function applySplit(sim: Sim, out: Plan) {
  const foes = fanFoes(sim);
  if (!foes.length) {
    out.whiff = "empty-fan";
    out.targets = [];
    return;
  }
  const m = 1 / foes.length;
  out.targets = foes.map((actor) => ({ actor, mult: m, flat: 0 }));
  out.mult = 1;
}

function applyCreek(sim: Sim, out: Plan) {
  const foe = out.targets[0]?.actor;
  if (!foe) return;
  if (wet(sim, foe.x, foe.y)) out.mult = 1.8;
  else {
    const f = VEC[sim.player.facing];
    const nx = foe.x + f.x;
    const ny = foe.y + f.y;
    if (inside(sim, nx, ny) && !pillar(sim, nx, ny)) {
      foe.x = nx;
      foe.y = ny;
      push(sim, { t: "move", who: foe.id, x: nx, y: ny, via: id(8) });
    }
    out.whiff = "land-shove";
    out.targets = [];
  }
}

function applyLoft(sim: Sim, out: Plan) {
  const f = VEC[sim.player.facing];
  const x = sim.player.x + f.x * 3;
  const y = sim.player.y + f.y * 3;
  out.targets = [];
  out.noStore = true;
  out.whiff = "lofted";
  sim.lob = { x, y, left: 0.45, via: id(10), amount: slash(sim, 1) * 1.4 };
}

function applyPathBrand(sim: Sim, out: Plan) {
  const foe = out.targets[0]?.actor;
  out.targets = [];
  out.noStore = true;
  if (foe?.delayed) {
    foe.delayed.revealed = true;
    out.whiff = "scout";
    push(sim, { t: "path", tiles: foe.delayed.path.length, via: id(11), revealed: true });
  } else {
    out.whiff = "idle-brand";
    sim.player.rooted = Math.max(sim.player.rooted, 0.2);
  }
}

function applyCourtesy(sim: Sim, out: Plan) {
  const foe = out.targets[0]?.actor;
  if (!foe) return;
  if (sim.player.lastTargetId === foe.id) {
    out.whiff = "courtesy";
    out.targets = [];
    return;
  }
  out.mult = 1.15;
  sim.player.lastTargetId = foe.id;
}

function applyRibbon(sim: Sim, out: Plan) {
  const inst = piece(sim, id(17));
  if (!inst || resourceOf(sim, inst.identity, "ribbon") < 1) {
    out.whiff = "ribbon";
    out.targets = [];
    return;
  }
  writeResource(sim, inst.identity, "ribbon", 0);
  out.mult = 1.6;
}

function applyHook(sim: Sim, out: Plan) {
  const foe = out.targets[0]?.actor;
  if (!foe) return;
  const f = VEC[sim.player.facing];
  const dx = foe.x - f.x;
  const dy = foe.y - f.y;
  const free = inside(sim, dx, dy) && !occ(sim, dx, dy, true);
  if (free) {
    foe.x = dx;
    foe.y = dy;
    push(sim, { t: "move", who: foe.id, x: dx, y: dy, via: id(19) });
    out.mult = 1.3;
  } else {
    out.whiff = "hook-back";
    out.targets = [];
    const px = sim.player.x + f.x;
    const py = sim.player.y + f.y;
    if (inside(sim, px, py) && !pillar(sim, px, py) && !(foe.x === px && foe.y === py)) {
      placePlayer(sim, px, py, sim.player.facing);
      push(sim, { t: "move", who: "you", x: px, y: py, via: id(19) });
    } else {
      sim.player.rooted = Math.max(sim.player.rooted, 0.2);
      push(sim, { t: "root", who: "you", via: id(19) });
    }
  }
}

function applySickle(sim: Sim, out: Plan) {
  if (sim.player.hp <= 1) out.mult = 2.4;
  else if (sim.player.hp >= sim.player.maxHp) {
    const foe = out.targets[0]?.actor;
    if (foe) {
      foe.hp += 1;
      push(sim, { t: "heal", amount: 1, to: foe.id, via: id(20) });
    }
    out.whiff = "full-heal";
    out.targets = [];
  } else out.mult = 0.7;
}

function breakSash(sim: Sim) {
  if (!sim.sashOn) return;
  sim.sashOn = false;
  sim.player.rooted = 0;
  sim.player.stuckTo = null;
  for (const f of sim.foes) {
    if (f.stuckTo === "sash" || f.rooted > 2) {
      f.rooted = 0;
      f.stuckTo = null;
    }
  }
}

function hitchBreak(sim: Sim) {
  if (!sim.player.stuckTo) return;
  const foe = sim.foes.find((f) => f.id === sim.player.stuckTo);
  sim.player.stuckTo = null;
  if (foe) {
    foe.stuckTo = null;
    foe.rooted = 0;
  }
  sim.player.rooted = Math.max(sim.player.rooted, 0.4);
  push(sim, { t: "note", text: "hitch-break" });
}

function resolveStrike(sim: Sim) {
  if (sim.whiffNext) {
    sim.whiffNext = false;
    push(sim, { t: "whiff", via: id(49), why: "tails" });
    return;
  }
  const w = sim.slots.weapon;
  if (w?.mods.some((m) => m.tag === "etched")) {
    /* stillness checked in plan */
  }
  const planned = plan(sim);
  if (!w && sim.legacyWeapon.projectile && sim.legacyWeapon.ammo != null && planned.whiff !== "ammo") {
    sim.legacyWeapon.ammo -= 1;
  }
  if (planned.whiff) push(sim, { t: "whiff", via: planned.via, why: planned.whiff });
  if (planned.whiff === "lofted") return;
  if (!planned.targets.length) {
    if (sim.stickyNext) {
      sim.player.rooted = Math.max(sim.player.rooted, 0.5);
      sim.stickyNext = false;
    }
    return;
  }
  const nail = !!piece(sim, id(54));
  const stole = !!piece(sim, id(37));
  const charm = piece(sim, id(41));
  const dmgStat = nail || !w ? sim.legacyWeapon.dmg : 1;
  const base = slash(sim, dmgStat);
  let preview = 0;
  for (const t of planned.targets) {
    const situational = nail ? 1 : planned.mult * t.mult;
    preview += base * situational + (nail ? 0 : t.flat);
  }
  if (charm && !stole && !sim.stored && !planned.noStore && preview > 0) {
    const shapes = itemById(charm.lootId).forms;
    const shape = shapes.includes(charm.form) ? charm.form : shapes[0];
    sim.stored = { amount: preview, shape, identity: charm.identity };
    const i = Math.max(0, shapes.indexOf(shape));
    charm.form = shapes[(i + 1) % shapes.length];
    push(sim, { t: "shape", shape, via: charm.lootId, stored: preview });
    push(sim, { t: "whiff", via: charm.lootId, why: "stored" });
    return;
  }
  const seal = sealFactor(sim, true);
  let dealt = 0;
  for (const t of planned.targets) {
    const situational = nail ? 1 : planned.mult * t.mult;
    let amount = (base * situational + (nail ? 0 : t.flat)) * seal;
    if (stole && t.actor.hp - amount <= 0) {
      const leftover = amount - Math.max(0, t.actor.hp - 1);
      amount = Math.max(0, t.actor.hp - 1);
      push(sim, { t: "note", text: `mercy:${leftover}` });
      if (charm && !sim.stored && leftover > 0) {
        sim.stored = { amount: leftover, shape: charm.form, identity: charm.identity };
        push(sim, { t: "shape", shape: charm.form, via: charm.lootId, stored: leftover });
      }
    }
    t.actor.hp -= amount;
    dealt += amount;
    push(sim, { t: "damage", amount, to: t.actor.id, via: planned.via, mult: situational * seal, base });
    remember(sim, "damage", String(amount));
    if (w && Number(w.lootId.slice(-3)) === 9) {
      t.actor.stuckTo = "you";
      sim.player.stuckTo = t.actor.id;
      t.actor.rooted = 999;
      push(sim, { t: "root", who: t.actor.id, via: id(9) });
    }
  }
  breakSash(sim);
  if (planned.self > 0) {
    sim.player.hp -= planned.self;
    push(sim, { t: "self", amount: planned.self, via: planned.via });
  }
  const thimble = piece(sim, id(50));
  if (thimble && sim.stored) {
    sim.stored = null;
    push(sim, { t: "note", text: "thimble-shatter" });
  }
  const debt = piece(sim, id(42));
  if (debt && dealt > 0) sim.backlash = { left: 0.35, amount: dealt, identity: debt.identity };
  if (sim.stickyNext) {
    sim.player.rooted = Math.max(sim.player.rooted, 0.5);
    sim.stickyNext = false;
    push(sim, { t: "root", who: "you", via: id(45) });
  }
  if (w && Number(w.lootId.slice(-3)) === 17) {
    /* ribbon already spent */
  }
}

export function interrupt(sim: Sim, via = "interrupt") {
  const atk = sim.player.attack;
  if (atk) {
    if (atk.lootId === id(14) && atk.phase === "windup") {
      sim.player.hp -= 1;
      push(sim, { t: "self", amount: 1, via: id(14) });
    }
    const thimble = piece(sim, id(50));
    if (thimble && !sim.stored && atk.phase === "windup") {
      const amount = slash(sim, 1);
      sim.stored = { amount, shape: "line", identity: thimble.identity };
      push(sim, { t: "shape", shape: "line", via: thimble.lootId, stored: amount });
    }
    if (piece(sim, id(32))) sim.shortRecover = true;
    sim.player.attack = null;
    push(sim, { t: "interrupt", via });
  }
  if (sim.lob) {
    sim.lob = null;
    push(sim, { t: "note", text: "lob-cancel" });
  }
}

export function beginAttack(sim: Sim) {
  if (sim.lockout > 0) {
    push(sim, { t: "whiff", via: "lockout", why: "whistle" });
    return;
  }
  if (sim.player.rooted > 2 && sim.sashOn) {
    /* still may swing */
  }
  if (sim.player.attack) return;
  const loot = sim.slots.weapon?.lootId ?? "legacy";
  const wind = windupOf(sim);
  sim.player.attack = { lootId: loot, phase: "windup", left: wind };
  if (wind <= 0) {
    resolveStrike(sim);
    sim.player.attack = { lootId: loot, phase: "recover", left: recoverOf(sim) };
  }
}

export function strikeNow(sim: Sim) {
  if (sim.player.attack?.phase === "recover") sim.player.attack = null;
  beginAttack(sim);
  const wind = windupOf(sim);
  if (wind > 0 && sim.player.attack?.phase === "windup") advance(sim, wind + 0.02);
  if (sim.lob) advance(sim, sim.lob.left + 0.02);
}

export function swapWeapon(sim: Sim) {
  interrupt(sim, "swap");
  const a = sim.slots.weapon;
  const b = sim.sheathed;
  if (!a && !b) {
    push(sim, { t: "whiff", via: id(76), why: "nothing-sheathed" });
    return;
  }
  sim.slots.weapon = b;
  sim.sheathed = a;
  if (piece(sim, id(31))) sim.weakened = true;
  if (b?.lootId === id(17)) writeResource(sim, b.identity, "ribbon", 1);
  const lock = piece(sim, id(57));
  if (lock && a) sim.locket = { lootId: a.lootId, identity: a.identity, form: a.form };
  push(sim, { t: "swap", from: a?.lootId ?? sim.legacyWeapon.id, to: b?.lootId ?? sim.legacyWeapon.id });
}

export function cycleForm(sim: Sim, slot: Slot) {
  const inst = sim.slots[slot];
  if (!inst) {
    push(sim, { t: "note", text: "click" });
    return;
  }
  const forms = itemById(inst.lootId).forms;
  if (forms.length < 2) {
    push(sim, { t: "note", text: "click" });
    return;
  }
  interrupt(sim, "form");
  const i = Math.max(0, forms.indexOf(inst.form));
  inst.form = forms[(i + 1) % forms.length];
  push(sim, { t: "form", id: inst.lootId, form: inst.form, identity: inst.identity });
  syncCowl(sim);
}

export function restorePiece(sim: Sim, slot: Slot) {
  const inst = sim.slots[slot];
  if (!inst) return;
  interrupt(sim, "restore");
  const n = inst.mods.length;
  inst.mods = [];
  inst.form = defaultForm(inst.lootId);
  inst.restorations += 1;
  push(sim, { t: "restore", identity: inst.identity, mods: n, restorations: inst.restorations });
}

export function modifyPiece(sim: Sim, slot: Slot, tag: string) {
  const inst = sim.slots[slot];
  if (!inst) return;
  inst.mods.push({ id: `mod-${inst.mods.length + 1}`, tag });
  push(sim, { t: "modify", identity: inst.identity, mod: tag });
}

export function resetResources(sim: Sim) {
  const all = [sim.slots.weapon, sim.slots.wearable, sim.slots.trinket, sim.slots.utility, sim.sheathed].filter(
    (x): x is Instance => !!x,
  );
  for (const inst of all) {
    const n = Number(inst.lootId.slice(-3));
    const set = (key: string, value: number) => {
      writeResource(sim, inst.identity, key, value);
      push(sim, { t: "reset", identity: inst.identity, resource: key, value });
    };
    if (n === 61) set("oil", 3);
    if (n === 17) set("ribbon", 1);
    if (n === 79) set("seal", 1);
    if (n === 29) set("phase", 1);
    if (n === 71) set("mask", 1);
    if (n === 58 || n === 57) set("charge", 1);
  }
}

function nearestDelay(sim: Sim): number | null {
  let best: number | null = null;
  for (const f of sim.foes) {
    if (!f.delayed) continue;
    if (best == null || f.delayed.left < best) best = f.delayed.left;
  }
  return best;
}

function hop(sim: Sim, dist: number) {
  const f = VEC[sim.player.facing];
  let x = sim.player.x;
  let y = sim.player.y;
  for (let i = 0; i < dist; i++) {
    const nx = x + f.x;
    const ny = y + f.y;
    if (pillar(sim, nx, ny)) break;
    x = nx;
    y = ny;
  }
  if (x !== sim.player.x || y !== sim.player.y) {
    onLeave(sim, sim.player.x, sim.player.y);
    placePlayer(sim, x, y, sim.player.facing);
    onEnter(sim);
  }
}

function recordChalk(sim: Sim) {
  const chalk = piece(sim, id(60));
  if (chalk?.form === "drawn") sim.chalk.push({ x: sim.player.x, y: sim.player.y });
}

export function dodge(sim: Sim) {
  recordChalk(sim);
  if (sim.perfectDodge) {
    sim.player.iframe = 0.3;
    sim.perfectDodge = false;
    push(sim, { t: "dodge", window: "perfect", via: id(49) });
    return;
  }
  const coat = piece(sim, id(21));
  const scarf = piece(sim, id(38));
  const incoming = nearestDelay(sim);
  if (coat && coat.form === "loose") {
    hop(sim, 1);
    sim.player.iframe = 0.05;
    push(sim, { t: "dodge", window: "loose", via: coat.lootId });
    return;
  }
  if (coat) {
    const lo = sim.wideDodge ? 0.05 : 0.08;
    const hi = sim.wideDodge ? 0.28 : 0.16;
    sim.wideDodge = false;
    if (incoming == null) {
      sim.player.iframe = 0.05;
      push(sim, { t: "dodge", window: "none", via: coat.lootId });
    } else if (incoming >= lo && incoming <= hi) {
      sim.player.iframe = 0.08;
      const foe = sim.foes.find((f) => f.delayed);
      sim.tetherTo = foe?.id ?? null;
      push(sim, { t: "tether", from: "you", to: foe?.id ?? "foe", via: coat.lootId });
      push(sim, { t: "dodge", window: "narrow", via: coat.lootId });
      remember(sim, "tether", foe?.id ?? "");
    } else if (incoming > hi) {
      sim.player.rooted = Math.max(sim.player.rooted, 0.25);
      push(sim, { t: "dodge", window: "early", via: coat.lootId });
    } else {
      push(sim, { t: "dodge", window: "late", via: coat.lootId });
    }
    return;
  }
  if (scarf) {
    if (wet(sim, sim.player.x, sim.player.y)) {
      hop(sim, 2);
      sim.player.iframe = 0.2;
      push(sim, { t: "dodge", window: "water", via: scarf.lootId });
    } else {
      hop(sim, 1);
      sim.player.iframe = 0;
      push(sim, { t: "dodge", window: "land-hop", via: scarf.lootId });
    }
    return;
  }
  hop(sim, 1);
  sim.player.iframe = 0.06;
  push(sim, { t: "dodge", window: "plain", via: "body" });
}

export function dodgeBoots(sim: Sim) {
  if (!sim.relics.includes("boots")) {
    push(sim, { t: "binding", id: "relic.boots", status: "unavailable" });
    return;
  }
  push(sim, { t: "binding", id: "relic.boots", status: "available" });
  hop(sim, 2);
  sim.player.iframe = 0.28;
  push(sim, { t: "dodge", window: "boots", via: "boots" });
}

function slide(sim: Sim, obj: Movable, facing: Dir, dist: number) {
  const f = VEC[facing];
  let moved = 0;
  for (let i = 0; i < dist; i++) {
    const nx = obj.x + f.x;
    const ny = obj.y + f.y;
    if (!inside(sim, nx, ny) || pillar(sim, nx, ny)) break;
    if (sim.player.x === nx && sim.player.y === ny) break;
    if (sim.foes.some((fo) => fo.hp > 0 && fo.x === nx && fo.y === ny)) break;
    obj.x = nx;
    obj.y = ny;
    moved++;
  }
  return moved;
}

function adjacentObject(sim: Sim): Movable | null {
  const f = VEC[sim.player.facing];
  const x = sim.player.x + f.x;
  const y = sim.player.y + f.y;
  return sim.movables.find((o) => o.integrity > 0 && o.mode !== "carried" && o.x === x && o.y === y) ?? null;
}

export function shove(sim: Sim) {
  const obj = adjacentObject(sim);
  if (!obj) {
    push(sim, { t: "whiff", via: "shove", why: "no-object" });
    return;
  }
  const belt = piece(sim, id(22));
  const wedge = piece(sim, id(77));
  const yoke = piece(sim, id(35));
  if (yoke && obj.kind === "pot" && obj.mode === "free" && !sim.carrying) {
    obj.mode = "carried";
    sim.carrying = obj.id;
    push(sim, { t: "object", id: obj.id, mode: "carried", via: id(35), dist: 0 });
    remember(sim, "shove", "carry");
    return;
  }
  if (belt) {
    if (obj.kind === "cane-block" && !sim.relics.includes("cane")) {
      push(sim, { t: "binding", id: "relic.cane", status: "unavailable" });
      return;
    }
    if (obj.mode === "anchor") {
      obj.mode = "free";
      obj.cover = false;
      push(sim, { t: "object", id: obj.id, mode: "free", via: id(22), dist: 0 });
      return;
    }
    if (sim.movables.some((o) => o.mode === "anchor")) {
      push(sim, { t: "whiff", via: id(22), why: "anchor-held" });
      return;
    }
    obj.mode = "anchor";
    obj.cover = true;
    push(sim, { t: "object", id: obj.id, mode: "anchor", via: id(22), dist: 0 });
    remember(sim, "shove", "anchor");
    return;
  }
  const dist = wedge ? (corridor(sim, obj.x, obj.y, sim.player.facing) ? 3 : 1) : 2;
  const moved = slide(sim, obj, sim.player.facing, dist);
  push(sim, { t: "object", id: obj.id, mode: wedge ? "wedge" : "slide", via: wedge ? id(77) : "hands", dist: moved });
  remember(sim, "shove", String(moved));
}

function releaseShape(sim: Sim) {
  if (!sim.stored) {
    push(sim, { t: "whiff", via: id(41), why: "empty-kiln" });
    return;
  }
  const { shape, amount } = sim.stored;
  sim.stored = null;
  const seal = sealFactor(sim, true);
  const pay = amount * seal;
  let hits = 0;
  let self = 0;
  const f = VEC[sim.player.facing];
  const hitAt = (x: number, y: number, amt: number) => {
    const foe = sim.foes.find((fo) => fo.hp > 0 && fo.x === x && fo.y === y);
    if (!foe) return;
    foe.hp -= amt;
    hits++;
    push(sim, { t: "damage", amount: amt, to: foe.id, via: id(41), mult: seal, base: amount });
  };
  if (shape === "line") {
    for (let i = 1; i <= 3; i++) hitAt(sim.player.x + f.x * i, sim.player.y + f.y * i, pay);
  } else if (shape === "cone") {
    const s = VEC[(sim.player.facing + 1) % 4];
    for (const [dx, dy] of [
      [f.x, f.y],
      [f.x * 2, f.y * 2],
      [f.x + s.x, f.y + s.y],
      [f.x - s.x, f.y - s.y],
    ]) {
      hitAt(sim.player.x + dx, sim.player.y + dy, pay);
    }
  } else if (shape === "ring") {
    for (const d of neighbors(false)) hitAt(sim.player.x + d.x, sim.player.y + d.y, pay);
    self = 1;
    sim.player.hp -= 1;
    push(sim, { t: "self", amount: 1, via: id(41) });
  } else if (shape === "spike") {
    const foe = sim.foes.find((fo) => fo.hp > 0 && fo.x === sim.player.x + f.x && fo.y === sim.player.y + f.y);
    if (foe) hitAt(foe.x, foe.y, pay * 1.5);
    else push(sim, { t: "whiff", via: id(41), why: "spike-miss" });
  }
  push(sim, { t: "release", shape, via: id(41), hits, self });
  remember(sim, "release", shape);
}

export function playTrinket(sim: Sim) {
  const tr = sim.slots.trinket;
  if (!tr) {
    push(sim, { t: "whiff", via: "trinket", why: "empty" });
    return;
  }
  const n = Number(tr.lootId.slice(-3));
  if (n === 41) return releaseShape(sim);
  if (n === 45) {
    sim.player.rooted = 0;
    hitchBreak(sim);
    sim.player.stuckTo = null;
    sim.stickyNext = true;
    push(sim, { t: "note", text: "sugar-cube" });
    return;
  }
  if (n === 46) {
    const f = VEC[sim.player.facing];
    const x = sim.player.x + f.x;
    const y = sim.player.y + f.y;
    if (inside(sim, x, y) && sim.tiles[y][x] === "water") {
      sim.tiles[y][x] = "shoal";
      push(sim, { t: "note", text: "shoal" });
    } else {
      sim.player.rooted = Math.max(sim.player.rooted, 0.3);
      push(sim, { t: "root", who: "you", via: id(46) });
    }
    return;
  }
  if (n === 47) {
    const f = VEC[sim.player.facing];
    sim.seed = { x: sim.player.x + f.x, y: sim.player.y + f.y, left: 0.4 };
    push(sim, { t: "note", text: "seed" });
    return;
  }
  if (n === 48) {
    if (!sim.relics.includes("lantern")) {
      push(sim, { t: "binding", id: "relic.lantern", status: "unavailable" });
      return;
    }
    if (!sim.lanternOn) {
      push(sim, { t: "binding", id: "relic.lantern", status: "inert" });
      return;
    }
    sim.lanternOn = false;
    const foe = sim.foes.filter((f) => f.hp > 0).sort((a, b) => Math.abs(a.x - sim.player.x) + Math.abs(a.y - sim.player.y) - (Math.abs(b.x - sim.player.x) + Math.abs(b.y - sim.player.y)))[0];
    if (foe) foe.marked = true;
    push(sim, { t: "note", text: "moth" });
    return;
  }
  if (n === 49) {
    const result = takeCoin(sim);
    if (result === "heads") sim.perfectDodge = true;
    else sim.whiffNext = true;
    push(sim, { t: "note", text: `coin-${result}` });
    return;
  }
  if (n === 52) {
    cycleForm(sim, "weapon");
    return;
  }
  if (n === 56) {
    const mem = sim.remembered;
    if (!mem || mem.kind === "damage") {
      push(sim, { t: "note", text: "marble-silent" });
      return;
    }
    if (mem.kind === "shove") {
      const pot = sim.movables.find((o) => o.kind === "pot" && o.integrity > 0);
      if (pot) {
        const dist = Math.max(1, Math.floor(Number(mem.payload) / 2) || 1);
        slide(sim, pot, sim.player.facing, dist);
        push(sim, { t: "object", id: pot.id, mode: "echo-slide", via: id(56), dist });
      }
    } else if (mem.kind === "tether") {
      const foe = sim.foes.find((f) => f.hp > 0);
      if (foe) {
        foe.rooted = Math.max(foe.rooted, 0.2);
        push(sim, { t: "tether", from: "you", to: foe.id, via: id(56) });
      }
    } else if (mem.kind === "release" && sim.stored) {
      sim.stored.amount *= 0.5;
      releaseShape(sim);
    } else push(sim, { t: "note", text: "marble-half" });
    return;
  }
  if (n === 57) {
    if (!sim.locket || resourceOf(sim, tr.identity, "charge") < 1) {
      push(sim, { t: "whiff", via: id(57), why: "no-memory" });
      return;
    }
    const w = sim.slots.weapon;
    if (w && w.identity === sim.locket.identity) {
      w.form = sim.locket.form;
      writeResource(sim, tr.identity, "charge", 0);
      push(sim, { t: "form", id: w.lootId, form: w.form, identity: w.identity });
    } else if (sim.sheathed && sim.sheathed.identity === sim.locket.identity) {
      sim.sheathed.form = sim.locket.form;
      writeResource(sim, tr.identity, "charge", 0);
      push(sim, { t: "form", id: sim.sheathed.lootId, form: sim.sheathed.form, identity: sim.sheathed.identity });
    } else push(sim, { t: "whiff", via: id(57), why: "different-piece" });
    return;
  }
  push(sim, { t: "note", text: `trinket-${n}` });
}

function takeCoin(sim: Sim): "heads" | "tails" {
  if (sim.coinNext === "heads" || sim.coinNext === "tails") {
    const v = sim.coinNext;
    sim.coinNext = null;
    return v;
  }
  sim.serial = (Math.imul(sim.serial + 1, 1664525) + 1013904223) >>> 0;
  return sim.serial & 1 ? "heads" : "tails";
}

export function forceCoin(sim: Sim, side: "heads" | "tails") {
  sim.coinNext = side;
}

export function playUtility(sim: Sim) {
  const u = sim.slots.utility;
  if (!u) {
    push(sim, { t: "whiff", via: "utility", why: "empty" });
    return;
  }
  const n = Number(u.lootId.slice(-3));
  const f = VEC[sim.player.facing];
  if (n === 62) {
    const pot = nearestPot(sim);
    if (!pot) {
      push(sim, { t: "whiff", via: id(62), why: "no-pot" });
      return;
    }
    const dx = Math.sign(sim.player.x - pot.x);
    const dy = dx === 0 ? Math.sign(sim.player.y - pot.y) : 0;
    let moved = 0;
    for (let i = 0; i < 2; i++) {
      const nx = pot.x + dx;
      const ny = pot.y + dy;
      if (nx === sim.player.x && ny === sim.player.y) break;
      if (pillar(sim, nx, ny)) break;
      pot.x = nx;
      pot.y = ny;
      moved++;
    }
    if (cramped(sim, sim.player.x, sim.player.y) && Math.abs(pot.x - sim.player.x) + Math.abs(pot.y - sim.player.y) === 1) {
      sim.player.rooted = Math.max(sim.player.rooted, 0.2);
      push(sim, { t: "root", who: "you", via: id(62) });
    }
    push(sim, { t: "object", id: pot.id, mode: "bell", via: id(62), dist: moved });
    return;
  }
  if (n === 63) {
    interrupt(sim, "cup");
    const hp = sim.player.hp;
    const stored = sim.stored;
    resetResources(sim);
    sim.player.hp = hp;
    sim.stored = stored;
    push(sim, { t: "note", text: "shrine-cup" });
    return;
  }
  if (n === 64) {
    cycleForm(sim, "wearable");
    return;
  }
  if (n === 65) {
    const x = sim.player.x + f.x;
    const y = sim.player.y + f.y;
    if (!pillar(sim, x, y)) {
      placeMovable(sim, "stake", x, y);
      push(sim, { t: "object", id: "stake", mode: "stake", via: id(65), dist: 0 });
    }
    return;
  }
  if (n === 66) {
    if (sim.tetherTo) {
      const foe = sim.foes.find((fo) => fo.id === sim.tetherTo);
      if (foe) foe.rooted = Math.max(foe.rooted, 0.6);
      sim.tetherTo = null;
      push(sim, { t: "root", who: foe?.id ?? "foe", via: id(66) });
    } else {
      sim.player.rooted = Math.max(sim.player.rooted, 0.4);
      push(sim, { t: "root", who: "you", via: id(66) });
    }
    return;
  }
  if (n === 67) {
    interrupt(sim, "whistle");
    for (const foe of sim.foes) foe.delayed = null;
    sim.lockout = 0.5;
    push(sim, { t: "note", text: "whistle" });
    return;
  }
  if (n === 68) {
    const key = `${u.identity}:water`;
    const have = sim.resources[key] ?? 0;
    if (wet(sim, sim.player.x, sim.player.y) && sim.tiles[sim.player.y][sim.player.x] === "water") {
      sim.resources[key] = have + 1;
      push(sim, { t: "note", text: "scoop" });
    } else if (have > 0 && !wet(sim, sim.player.x, sim.player.y)) {
      sim.resources[key] = have - 1;
      sim.tiles[sim.player.y][sim.player.x] = "water";
      push(sim, { t: "note", text: "dump" });
    } else push(sim, { t: "whiff", via: id(68), why: "bucket-empty" });
    return;
  }
  if (n === 69) {
    if (!sim.panHeld) {
      push(sim, { t: "whiff", via: id(69), why: "empty-pan" });
      return;
    }
    const path = sim.panHeld;
    sim.panHeld = null;
    sim.panReady = true;
    for (const c of path) {
      const foe = sim.foes.find((fo) => fo.hp > 0 && fo.x === c.x && fo.y === c.y);
      if (foe) {
        foe.hp -= 1.2;
        push(sim, { t: "damage", amount: 1.2, to: foe.id, via: id(69), mult: 1, base: 1.2 });
      }
    }
    push(sim, { t: "note", text: "pan-throw" });
    return;
  }
  if (n === 70) {
    sim.player.rooted = 0;
    sim.player.stuckTo = null;
    sim.sashOn = false;
    sim.stickyNext = false;
    for (const foe of sim.foes) {
      foe.rooted = 0;
      foe.stuckTo = null;
    }
    push(sim, { t: "note", text: "rag" });
    return;
  }
  if (n === 71) {
    if (resourceOf(sim, u.identity, "mask") >= 1 && emptyAround(sim, sim.player.x, sim.player.y, false)) {
      writeResource(sim, u.identity, "mask", 0);
      sim.maskUp = true;
      push(sim, { t: "note", text: "masked" });
    } else push(sim, { t: "whiff", via: id(71), why: "mask" });
    return;
  }
  if (n === 72) {
    const relic = sim.relics.find((r) => r !== "sword");
    if (!relic) {
      push(sim, { t: "binding", id: "relic.extra", status: "unavailable" });
      return;
    }
    const before = sim.relics.slice();
    invokeLegacyVerb(sim, relic);
    sim.relics = before;
    push(sim, { t: "note", text: "strap" });
    return;
  }
  if (n === 73) {
    interrupt(sim, "lens");
    const clone = structuredClone(sim);
    clone.log = [];
    clone.slots.utility = null;
    strikeNow(clone);
    const current = clone.log.filter((e) => e.t === "damage").reduce((s, e) => s + (e.t === "damage" ? e.amount : 0), 0);
    const ironSim = structuredClone(sim);
    ironSim.log = [];
    ironSim.slots.weapon = null;
    ironSim.slots.utility = null;
    ironSim.legacyWeapon = { ...IRON, ammo: null };
    strikeNow(ironSim);
    const iron = ironSim.log.filter((e) => e.t === "damage").reduce((s, e) => s + (e.t === "damage" ? e.amount : 0), 0);
    const winner = current > iron + 1e-9 ? itemById(sim.slots.weapon?.lootId ?? id(1)).name : current + 1e-9 < iron ? "Short iron" : "tie";
    push(sim, { t: "compare", winner, iron, current });
    const foe = sim.foes[0];
    if (foe) armTelegraph(sim, foe.id, { delay: 0.6, kind: "line" });
    return;
  }
  if (n === 74) {
    const wpn = sim.slots.weapon;
    if (!wpn) {
      push(sim, { t: "whiff", via: id(74), why: "no-weapon" });
      return;
    }
    modifyPiece(sim, "weapon", wpn.lootId === id(1) ? "wider-margin" : "etched");
    return;
  }
  if (n === 75) {
    if (sim.slots.weapon) restorePiece(sim, "weapon");
    else if (sim.slots.wearable) restorePiece(sim, "wearable");
    return;
  }
  if (n === 76) {
    swapWeapon(sim);
    return;
  }
  if (n === 78) {
    if (!sim.relics.includes("lantern")) {
      push(sim, { t: "binding", id: "relic.lantern", status: "unavailable" });
      return;
    }
    if (!sim.lanternOn) {
      push(sim, { t: "binding", id: "relic.lantern", status: "inert" });
      return;
    }
    sim.lanternOn = false;
    sim.wideDodge = true;
    push(sim, { t: "note", text: "snuff" });
    return;
  }
  if (n === 80) {
    sim.breathLine = [];
    for (let i = 1; i <= 4; i++) sim.breathLine.push({ x: sim.player.x + f.x * i, y: sim.player.y + f.y * i });
    push(sim, { t: "note", text: "breath-line" });
    return;
  }
  if (n === 61) {
    push(sim, { t: "note", text: sim.lanternOn ? "fitting-lit" : "fitting-dark" });
    return;
  }
  if (n === 77) {
    push(sim, { t: "note", text: "wedge-ready" });
    return;
  }
  if (n === 79) {
    push(sim, { t: "note", text: resourceOf(sim, u.identity, "seal") >= 1 ? "seal-armed" : "seal-spent" });
  }
}

function nearestPot(sim: Sim): Movable | null {
  const pots = sim.movables.filter((o) => o.kind === "pot" && o.integrity > 0 && o.mode !== "carried");
  pots.sort((a, b) => Math.abs(a.x - sim.player.x) + Math.abs(a.y - sim.player.y) - (Math.abs(b.x - sim.player.x) + Math.abs(b.y - sim.player.y)));
  return pots[0] ?? null;
}

function inFront(sim: Sim, foe: Actor) {
  const f = VEC[sim.player.facing];
  const dx = foe.x - sim.player.x;
  const dy = foe.y - sim.player.y;
  return dx * f.x + dy * f.y > 0;
}

function fittingWould(sim: Sim) {
  const fitting = piece(sim, id(61));
  if (!fitting || sim.suppressReveal) return false;
  if (!sim.relics.includes("lantern") || !sim.lanternOn) return false;
  return resourceOf(sim, fitting.identity, "oil") > 0;
}

function tryReveal(sim: Sim, foe: Actor) {
  if (!foe.delayed || foe.delayed.revealed) return;
  if (sim.suppressReveal) {
    push(sim, { t: "path", tiles: foe.delayed.path.length, via: id(39), revealed: false });
    return;
  }
  if (foe.marked) {
    foe.delayed.revealed = true;
    push(sim, { t: "path", tiles: foe.delayed.path.length, via: id(48), revealed: true });
    return;
  }
  const collar = piece(sim, id(28));
  if (collar && sim.relics.includes("lantern") && sim.lanternOn && inFront(sim, foe)) {
    foe.delayed.revealed = true;
    push(sim, { t: "path", tiles: foe.delayed.path.length, via: id(28), revealed: true });
    return;
  }
  const fitting = piece(sim, id(61));
  if (fitting && !sim.relics.includes("lantern")) {
    if (!sim.bindingOnce.lantern) {
      sim.bindingOnce.lantern = true;
      push(sim, { t: "binding", id: "relic.lantern", status: "unavailable" });
    }
    return;
  }
  if (fitting && sim.relics.includes("lantern") && !sim.lanternOn) {
    push(sim, { t: "binding", id: "relic.lantern", status: "inert" });
    return;
  }
  if (fitting && sim.lanternOn && resourceOf(sim, fitting.identity, "oil") <= 0) {
    push(sim, { t: "binding", id: "fitting.oil", status: "inert" });
    return;
  }
  if (fitting && sim.lanternOn) {
    writeResource(sim, fitting.identity, "oil", resourceOf(sim, fitting.identity, "oil") - 1);
    foe.delayed.revealed = true;
    push(sim, { t: "path", tiles: foe.delayed.path.length, via: id(61), revealed: true });
    push(sim, { t: "reset", identity: fitting.identity, resource: "oil", value: resourceOf(sim, fitting.identity, "oil") });
  }
}

export function armTelegraph(
  sim: Sim,
  foeId: string,
  opts: { delay: number; kind: HitKind; path?: { x: number; y: number }[] },
) {
  const foe = foeById(sim, foeId);
  const kind = opts.kind === "burn" || opts.kind === "instant" ? "melee" : opts.kind;
  let path = opts.path ?? lineToward(sim, foe);
  const chalk = piece(sim, id(60));
  if (chalk?.form === "drawn" && sim.chalk.length && !fittingWould(sim)) path = sim.chalk.map((c) => ({ ...c }));
  let left = opts.delay;
  if (kind === "line" && piece(sim, id(24))) left += 0.4;
  foe.delayed = { path, left, kind, revealed: false };
  tryReveal(sim, foe);
}

function lineToward(sim: Sim, foe: Actor): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  let x = foe.x;
  let y = foe.y;
  const dx = Math.sign(sim.player.x - foe.x);
  const dy = dx === 0 ? Math.sign(sim.player.y - foe.y) : 0;
  for (let i = 0; i < 6; i++) {
    x += dx;
    y += dy;
    path.push({ x, y });
    if (x === sim.player.x && y === sim.player.y) break;
  }
  return path;
}

function vectorOf(path: { x: number; y: number }[]): "row" | "col" | "none" {
  if (!path.length) return "none";
  const xs = new Set(path.map((p) => p.x));
  const ys = new Set(path.map((p) => p.y));
  if (xs.size === 1) return "col";
  if (ys.size === 1) return "row";
  return "none";
}

export function hurtPlayer(sim: Sim, amount: number, kind: HitKind, via = "hit", pathVector: "row" | "col" | "none" = "none") {
  if (sim.player.iframe > 0) {
    sim.player.absence += 1;
    push(sim, { t: "note", text: "avoided" });
    return;
  }
  if (sim.maskUp && (kind === "line" || kind === "melee")) {
    sim.maskUp = false;
    push(sim, { t: "note", text: "mask-catch" });
    return;
  }
  if (piece(sim, id(39)) && !sim.cowlSpent && (kind === "line" || kind === "melee")) {
    sim.cowlSpent = true;
    sim.suppressReveal = false;
    push(sim, { t: "note", text: "cowl" });
    return;
  }
  if (sim.carrying && (kind === "line" || kind === "melee")) {
    const pot = sim.movables.find((o) => o.id === sim.carrying);
    if (pot) {
      pot.integrity = 0;
      pot.mode = "free";
      sim.carrying = null;
      push(sim, { t: "object", id: pot.id, mode: "broken", via: id(35), dist: 0 });
      return;
    }
  }
  if (kind === "line" && sim.panReady && piece(sim, id(69)) && !sim.panHeld) {
    sim.panReady = false;
    const src = sim.foes.find((f) => f.id === via);
    sim.panHeld = [src ? { x: src.x, y: src.y } : { x: sim.player.x, y: sim.player.y }];
    push(sim, { t: "note", text: "pan-catch" });
    return;
  }
  if (kind === "melee" && piece(sim, id(69)) && sim.panReady) {
    sim.panReady = false;
    push(sim, { t: "note", text: "pan-drop" });
  }
  if ((kind === "melee" || kind === "instant") && piece(sim, id(24))) amount += 1;
  const doublet = piece(sim, id(36));
  if (doublet?.form === "buttoned") amount *= 0.7;
  if (doublet?.form === "open") amount *= 1.15;
  const foe = sim.foes.find((f) => f.delayed) ?? sim.foes[0];
  if (piece(sim, id(28)) && sim.lanternOn && sim.relics.includes("lantern") && foe && !inFront(sim, foe) && (kind === "line" || kind === "melee")) {
    push(sim, { t: "note", text: "collar-back" });
    return;
  }
  let a = amount;
  if (kind === "burn" && piece(sim, id(23))) {
    if (wet(sim, sim.player.x, sim.player.y)) {
      a = 0;
      sim.player.iframe = Math.max(sim.player.iframe, 0.1);
      push(sim, { t: "note", text: "quench" });
    } else a *= 2;
  }
  if (piece(sim, id(25)) && (kind === "line" || kind === "melee")) {
    if (pathVector === "col") a *= 0.6;
    if (pathVector === "row") a *= 1.35;
  }
  if (piece(sim, id(26)) && wet(sim, sim.player.x, sim.player.y)) a *= 0.5;
  if (piece(sim, id(30))) {
    if (sim.player.attack?.phase === "recover") {
      const foeHit = sim.foes.find((f) => f.hp > 0);
      if (foeHit) {
        const ref = a * 0.5;
        foeHit.hp -= ref;
        push(sim, { t: "damage", amount: ref, to: foeHit.id, via: id(30), mult: 0.5, base: a });
      }
    } else if (!sim.player.attack) a *= 1.4;
  }
  if (piece(sim, id(43)) && !sim.slots.utility) a *= 0.75;
  if (piece(sim, id(33))) a = Math.max(0, a - sim.guard);
  const pot = sim.movables.find((o) => o.kind === "pot" && o.integrity > 0 && o.mode !== "carried");
  if (piece(sim, id(51)) && pot) {
    const half = a / 2;
    pot.integrity -= 1;
    slide(sim, pot, sim.player.facing, 1);
    a = half;
    push(sim, { t: "note", text: "thread" });
  }
  if (a <= 0) return;
  const vest = piece(sim, id(29));
  if (vest && a >= sim.player.hp && resourceOf(sim, vest.identity, "phase") >= 1 && sim.player.lastEmpty) {
    writeResource(sim, vest.identity, "phase", 0);
    const spot = sim.player.lastEmpty;
    placePlayer(sim, spot.x, spot.y, sim.player.facing);
    sim.player.hp = 1;
    push(sim, { t: "note", text: "second-step" });
    push(sim, { t: "move", who: "you", x: spot.x, y: spot.y, via: id(29) });
    return;
  }
  sim.player.hp -= a;
  push(sim, { t: "self", amount: a, via });
  breakSash(sim);
}

export function stepTile(sim: Sim, dir: Dir) {
  if (sim.player.rooted > 0) return;
  const v = VEC[dir];
  const nx = sim.player.x + v.x;
  const ny = sim.player.y + v.y;
  if (pillar(sim, nx, ny)) return;
  onLeave(sim, sim.player.x, sim.player.y);
  sim.lastStep = { x: v.x, y: v.y };
  sim.player.stillness = 0;
  placePlayer(sim, nx, ny, dir);
  onEnter(sim);
  if (sim.player.stuckTo) hitchBreak(sim);
}

export function stepFoe(sim: Sim, foeId: string, x: number, y: number) {
  const foe = foeById(sim, foeId);
  const wasEmpty = !sim.foes.some((f) => f !== foe && f.x === x && f.y === y) && !sim.movables.some((o) => o.x === x && o.y === y && o.mode !== "carried");
  foe.x = x;
  foe.y = y;
  const adj = Math.abs(x - sim.player.x) + Math.abs(y - sim.player.y) === 1;
  if (piece(sim, id(44)) && adj && wasEmpty) {
    sim.player.rooted = Math.max(sim.player.rooted, 0.15);
    push(sim, { t: "root", who: "you", via: id(44) });
  }
}

function onLeave(sim: Sim, x: number, y: number) {
  if (piece(sim, id(34))) sim.marks.push({ x, y });
}

function onEnter(sim: Sim) {
  if (!piece(sim, id(34))) return;
  const i = sim.marks.findIndex((m) => m.x === sim.player.x && m.y === sim.player.y);
  if (i >= 0) {
    sim.marks.splice(i, 1);
    const before = sim.player.hp;
    sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + 1);
    if (sim.player.hp > before) push(sim, { t: "heal", amount: 1, to: "you", via: id(34) });
  }
}

function syncCowl(sim: Sim) {
  if (!piece(sim, id(39))) {
    sim.suppressReveal = false;
    return;
  }
  if (!sim.cowlSpent) sim.suppressReveal = true;
}

function speedMult(sim: Sim) {
  let m = 1;
  const onWet = wet(sim, sim.player.x, sim.player.y);
  if (piece(sim, id(26))) m *= onWet ? 1.15 : 0.75;
  else if (sim.tiles[sim.player.y][sim.player.x] === "water" && !sim.swim && !sim.relics.includes("flippers")) m *= 0.55;
  if (piece(sim, id(40))) m *= 0.85;
  if (sim.movables.some((o) => o.mode === "anchor")) m *= 0.7;
  if (sim.carrying) m *= 0.6;
  if (sim.player.rooted > 0) m = 0;
  return m;
}

export function setIntent(sim: Sim, x: number, y: number) {
  sim.intentX = x;
  sim.intentY = y;
}

function burstSeed(sim: Sim) {
  const seed = sim.seed;
  if (!seed) return;
  sim.seed = null;
  if (sim.player.x === seed.x && sim.player.y === seed.y) {
    sim.player.hp -= 1;
    push(sim, { t: "self", amount: 1, via: id(47) });
    if (sim.player.lastEmpty) {
      placePlayer(sim, sim.player.lastEmpty.x, sim.player.lastEmpty.y, sim.player.facing);
      push(sim, { t: "move", who: "you", x: sim.player.x, y: sim.player.y, via: id(47) });
    }
  }
  const foe = sim.foes.find((f) => f.hp > 0 && f.x === seed.x && f.y === seed.y);
  if (foe) {
    const pot = sim.movables.find((o) => o.kind === "pot" && o.integrity > 0);
    foe.hp -= 2;
    push(sim, { t: "damage", amount: 2, to: foe.id, via: id(47), mult: 1, base: 2 });
    if (pot) {
      foe.x = pot.x;
      foe.y = pot.y;
      push(sim, { t: "move", who: foe.id, x: pot.x, y: pot.y, via: id(47) });
    }
  }
}

function landLob(sim: Sim) {
  const lob = sim.lob;
  if (!lob) return;
  sim.lob = null;
  const foe = sim.foes.find((f) => f.hp > 0 && f.x === lob.x && f.y === lob.y);
  if (!foe) {
    push(sim, { t: "whiff", via: lob.via, why: "lob-empty" });
    return;
  }
  const seal = sealFactor(sim, true);
  const amount = lob.amount * seal;
  foe.hp -= amount;
  push(sim, { t: "damage", amount, to: foe.id, via: lob.via, mult: seal, base: lob.amount });
}

function delayedImpact(sim: Sim, foe: Actor) {
  const delayed = foe.delayed;
  if (!delayed) return;
  foe.delayed = null;
  const onPath = delayed.path.some((p) => p.x === sim.player.x && p.y === sim.player.y);
  if (!onPath) {
    push(sim, { t: "whiff", via: foe.id, why: "path-miss" });
    return;
  }
  for (const o of sim.movables) {
    if (!o.cover) continue;
    const oi = delayed.path.findIndex((p) => p.x === o.x && p.y === o.y);
    const pi = delayed.path.findIndex((p) => p.x === sim.player.x && p.y === sim.player.y);
    if (oi >= 0 && pi >= 0 && oi < pi) {
      push(sim, { t: "note", text: "cover" });
      return;
    }
  }
  hurtPlayer(sim, delayed.kind === "melee" ? 2 : 1.5, delayed.kind, foe.id, vectorOf(delayed.path));
}

export function tick(sim: Sim, dt: number) {
  dt = Math.min(0.05, Math.max(0, dt));
  if (dt === 0) return;
  const m = speedMult(sim);
  const vx = sim.intentX * 110 * m;
  const vy = sim.intentY * 110 * m;
  sim.speed = Math.hypot(vx, vy);
  if (sim.player.rooted <= 0) movePixels(sim, vx * dt, vy * dt);
  if (sim.intentX === 0 && sim.intentY === 0) sim.player.stillness += dt;
  else {
    sim.player.stillness = 0;
    sim.lastStep = {
      x: Math.sign(sim.intentX),
      y: Math.abs(sim.intentX) >= Math.abs(sim.intentY) ? 0 : Math.sign(sim.intentY),
    };
  }
  // Strafe does not yaw. Facing stays until a turn. Last step lingers briefly so a backstep can be struck.

  const atk = sim.player.attack;
  if (atk?.phase === "windup") {
    atk.left -= dt;
    if (atk.left <= 0) {
      resolveStrike(sim);
      atk.phase = "recover";
      atk.left = recoverOf(sim);
      atk.lootId = sim.slots.weapon?.lootId ?? "legacy";
    }
  } else if (atk?.phase === "recover") {
    atk.left -= dt;
    if (atk.left <= 0) sim.player.attack = null;
  }
  sim.lockout = Math.max(0, sim.lockout - dt);
  sim.player.iframe = Math.max(0, sim.player.iframe - dt);
  if (sim.player.rooted > 0 && sim.player.rooted < 50) sim.player.rooted = Math.max(0, sim.player.rooted - dt);
  for (const f of sim.foes) if (f.rooted > 0 && f.rooted < 50) f.rooted = Math.max(0, f.rooted - dt);

  if (sim.lob) {
    sim.lob.left -= dt;
    if (sim.lob.left <= 0) landLob(sim);
  }
  if (sim.backlash) {
    const bead = piece(sim, id(42));
    if (!bead || bead.identity !== sim.backlash.identity) sim.backlash = null;
    else {
      sim.backlash.left -= dt;
      if (sim.backlash.left <= 0) {
        const amount = sim.backlash.amount;
        sim.backlash = null;
        sim.player.hp -= amount;
        push(sim, { t: "self", amount, via: id(42) });
      }
    }
  }
  if (sim.seed) {
    sim.seed.left -= dt;
    if (sim.seed.left <= 0) burstSeed(sim);
  }
  for (const f of sim.foes) {
    if (!f.delayed) continue;
    f.delayed.left -= dt;
    if (f.delayed.left <= 0) delayedImpact(sim, f);
  }
  if (piece(sim, id(27))) {
    const adj = sim.foes.some((f) => f.hp > 0 && Math.abs(f.x - sim.player.x) + Math.abs(f.y - sim.player.y) === 1);
    sim.adjacentFor = adj ? sim.adjacentFor + dt : 0;
    if (adj && sim.adjacentFor >= 0.8 && !sim.sashOn) {
      sim.sashOn = true;
      sim.player.rooted = 999;
      for (const f of sim.foes) {
        if (Math.abs(f.x - sim.player.x) + Math.abs(f.y - sim.player.y) === 1) {
          f.rooted = 999;
          f.stuckTo = "sash";
        }
      }
      push(sim, { t: "root", who: "both", via: id(27) });
    }
  }
  if ((sim.lastStep.x !== 0 || sim.lastStep.y !== 0) && sim.intentX === 0 && sim.intentY === 0 && sim.player.stuckTo) {
    /* stepTile handles hitch; pixel move too */
  }
  if ((sim.intentX !== 0 || sim.intentY !== 0) && sim.player.stuckTo) hitchBreak(sim);

  if (piece(sim, id(55))) {
    if (sim.lanternOn) sim.darkStill = 0;
    else if (sim.intentX === 0 && sim.intentY === 0) sim.darkStill += dt;
  }
  if (piece(sim, id(59))) {
    if (sim.intentX === 0 && sim.intentY === 0) sim.breath = Math.min(5, sim.breath + 2 * dt);
  } else sim.breath = Math.min(5, sim.breath + 0.5 * dt);

  if (piece(sim, id(71))) {
    if (emptyAround(sim, sim.player.x, sim.player.y, false) && sim.intentX === 0 && sim.intentY === 0) {
      sim.maskStill += dt;
      const mask = piece(sim, id(71));
      if (mask && sim.maskStill >= 1 && resourceOf(sim, mask.identity, "mask") < 1) {
        writeResource(sim, mask.identity, "mask", 1);
        sim.maskStill = 0;
        push(sim, { t: "note", text: "mask-refilled" });
      }
    } else sim.maskStill = 0;
  }
  if (piece(sim, id(34)) && sim.marks.length) {
    const on = sim.marks.some((m) => m.x === sim.player.x && m.y === sim.player.y);
    if (!on) {
      sim.away += dt;
      if (sim.away >= 1) {
        sim.away = 0;
        sim.player.hp -= 1;
        push(sim, { t: "self", amount: 1, via: id(34) });
      }
    } else sim.away = 0;
  }
  if (piece(sim, id(33))) sim.guard = Math.min(3, sim.player.stillness);
  else sim.guard = 0;
  if (piece(sim, id(53))) refreshEmpty(sim);
  if (sim.carrying) {
    const pot = sim.movables.find((o) => o.id === sim.carrying);
    if (pot) {
      pot.x = sim.player.x;
      pot.y = sim.player.y;
    }
  }
  if (sim.echo && sim.now > sim.echo.until) sim.echo = null;
  sim.now += dt;
  if (sim.intentX === 0 && sim.intentY === 0 && sim.player.stillness > 0.25) sim.lastStep = { x: 0, y: 0 };
}

function movePixels(sim: Sim, dx: number, dy: number) {
  const p = sim.player;
  const tryX = p.px + dx;
  const tx = Math.floor(tryX / TILE);
  if (!pillar(sim, tx, p.y)) p.px = Math.max(TILE / 2, Math.min(sim.w * TILE - TILE / 2, tryX));
  const tryY = p.py + dy;
  const ty = Math.floor(tryY / TILE);
  const cx = Math.floor(p.px / TILE);
  if (!pillar(sim, cx, ty)) p.py = Math.max(TILE / 2, Math.min(sim.h * TILE - TILE / 2, tryY));
  const nx = Math.floor(p.px / TILE);
  const ny = Math.floor(p.py / TILE);
  if (nx !== p.x || ny !== p.y) {
    onLeave(sim, p.x, p.y);
    p.x = nx;
    p.y = ny;
    onEnter(sim);
    refreshEmpty(sim);
  }
}

export function advance(sim: Sim, seconds: number) {
  let left = seconds;
  while (left > 1e-6) {
    const dt = Math.min(0.05, left);
    tick(sim, dt);
    left -= dt;
  }
}

export function invokeLegacyVerb(sim: Sim, relic: string) {
  if (!sim.relics.includes(relic)) {
    push(sim, { t: "binding", id: `relic.${relic}`, status: "unavailable" });
    return;
  }
  push(sim, { t: "binding", id: `relic.${relic}`, status: "available" });
  push(sim, { t: "verb", relic });
  const f = VEC[sim.player.facing];
  switch (relic) {
    case "shovel":
      sim.excavated.push(`${sim.player.x},${sim.player.y}`);
      break;
    case "hookshot":
      if (sim.post.x === sim.player.x || sim.post.y === sim.player.y) {
        const tx = sim.post.x === sim.player.x ? sim.post.x : sim.post.x - Math.sign(sim.post.x - sim.player.x);
        const ty = sim.post.y === sim.player.y ? sim.post.y : sim.post.y - Math.sign(sim.post.y - sim.player.y);
        if (!pillar(sim, tx, ty)) placePlayer(sim, tx, ty, sim.player.facing);
      }
      break;
    case "boots":
      hop(sim, 2);
      sim.player.iframe = 0.28;
      push(sim, { t: "dodge", window: "boots", via: "boots" });
      break;
    case "flippers":
      sim.swim = true;
      break;
    case "lantern":
      sim.lanternOn = !sim.lanternOn;
      break;
    case "hammer":
    case "bombs": {
      const x = sim.player.x + f.x;
      const y = sim.player.y + f.y;
      if (inside(sim, x, y) && sim.tiles[y][x] === "pillar") {
        sim.tiles[y][x] = "open";
        sim.cracked.push(`${x},${y}`);
      }
      break;
    }
    case "net":
      sim.moths = Math.max(0, sim.moths - 1);
      break;
    case "mirror":
      sim.returned = true;
      break;
    case "cape": {
      const x = sim.player.x + f.x;
      const y = sim.player.y + f.y;
      if (inside(sim, x, y) && sim.tiles[y][x] === "pillar") {
        const x2 = x + f.x;
        const y2 = y + f.y;
        if (inside(sim, x2, y2) && sim.tiles[y2][x2] !== "pillar") placePlayer(sim, x2, y2, sim.player.facing);
      }
      break;
    }
    case "cane":
      if (sim.mp > 0) {
        sim.mp -= 1;
        placeMovable(sim, "cane-block", sim.player.x + f.x, sim.player.y + f.y);
      }
      break;
    case "bow":
      if (sim.arrows <= 0) push(sim, { t: "whiff", via: "bow", why: "ammo" });
      else {
        sim.arrows -= 1;
        const foe = rayFoes(sim, 4, true)[0];
        if (foe) {
          foe.hp -= 1;
          push(sim, { t: "damage", amount: 1, to: foe.id, via: "bow", mult: 1, base: 1 });
        }
      }
      break;
    case "ipod":
      sim.ipod = true;
      break;
    default:
      break;
  }
}

export function peekLog(sim: Sim, t: Ev["t"]) {
  return sim.log.filter((e) => e.t === t);
}
