import type {
  Anchor,
  FormId,
  HitKind,
  Intent,
  Keg,
  Resources,
  Result,
  RunState,
  ToolId,
} from "./types.ts";

export const LOADOUT_MAX = 3;
export const PANE_RANGE = 30;
export const WORLD_MAX = 58;

export const ZONES = [
  { id: "home", x0: 0, x1: 10, kind: "home" as const },
  { id: "soil", x0: 10, x1: 20, kind: "soil" as const },
  { id: "gap", x0: 20, x1: 28, kind: "gap" as const },
  { id: "bank", x0: 28, x1: 40, kind: "bank" as const },
  { id: "water", x0: 40, x1: 48, kind: "water" as const },
  { id: "void", x0: 48, x1: 54, kind: "void" as const },
  { id: "deep", x0: 54, x1: 58, kind: "deep" as const },
];

const RESIN_X = 16;
const LOCKS: Record<string, number> = { "guest-lock": 34, "ink-lock": 38 };

export interface FormStats {
  mass: number;
  move: number;
  waterAccel: number;
  cutThreshold: number;
  cutDamage: number;
  leap: number;
  stallPoise: number;
  transferCap: number;
  pinStrikes: number;
  fuseDelay: number;
  hem: number;
  hemFog: number;
  breath: number;
  /** Seconds before a channel commits. Smuggler draw is 0. */
  windup: number;
  candyOk: boolean;
  bodyAnchor: boolean;
  voidWalk: boolean;
}

export function formStats(form: FormId): FormStats {
  switch (form) {
    case "wanderer":
      return { mass: 1, move: 4.6, waterAccel: 1.5, cutThreshold: 3, cutDamage: 2, leap: 6, stallPoise: 1, transferCap: 2, pinStrikes: 1, fuseDelay: 3, hem: 3, hemFog: 3, breath: 3, windup: 0.3, candyOk: true, bodyAnchor: false, voidWalk: false };
    case "smuggler":
      return { mass: 0.7, move: 6.4, waterAccel: 3.4, cutThreshold: 2, cutDamage: 1, leap: 9, stallPoise: 2, transferCap: 1, pinStrikes: 2, fuseDelay: 4.2, hem: 3.2, hemFog: 6, breath: 6, windup: 0, candyOk: true, bodyAnchor: false, voidWalk: false };
    case "officer":
      return { mass: 1.8, move: 3.3, waterAccel: 0.75, cutThreshold: 4.5, cutDamage: 3, leap: 4, stallPoise: 1, transferCap: 4, pinStrikes: 1, fuseDelay: 3.4, hem: 2.2, hemFog: 2.2, breath: 2, windup: 0.5, candyOk: false, bodyAnchor: true, voidWalk: false };
    case "god":
      return { mass: 1, move: 4.8, waterAccel: 2.2, cutThreshold: 2.4, cutDamage: 2, leap: 6, stallPoise: 1, transferCap: 2, pinStrikes: 1, fuseDelay: 3, hem: 3, hemFog: 3, breath: 5, windup: 0.25, candyOk: true, bodyAnchor: false, voidWalk: true };
  }
}

export function zoneAt(x: number) {
  const z = ZONES.find((zone) => x >= zone.x0 && x < zone.x1);
  return z ?? ZONES[ZONES.length - 1]!;
}

const ok = (code: string, detail: string): Result => ({ ok: true, code, detail });
const no = (code: string, detail: string): Result => ({ ok: false, code, detail });

function has(s: RunState, tool: ToolId): boolean {
  return s.equipped.includes(tool);
}

function near(a: number, b: number, d = 2): boolean {
  return Math.abs(a - b) <= d;
}

function pushLog(s: RunState, line: string) {
  s.log.push(line);
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60);
}

export function defaultResources(): Resources {
  return { sugar: 6, oil: 4, ash: 4, shards: 3, pins: 3, kegs: 2, netTension: 3, capeFolds: 2, darkCharge: 0 };
}

export function createRun(over: Partial<RunState> = {}): RunState {
  const base: RunState = {
    roomId: "otter-creek",
    time: 0,
    form: "wanderer",
    embryo: false,
    x: 4,
    lastFree: 4,
    medium: "ground",
    facing: 1,
    vx: 0,
    hp: 8,
    maxHp: 8,
    poise: 6,
    waterSpeed: 0,
    breath: 3,
    resources: defaultResources(),
    equipped: ["shovel", "lamp", "boots"],
    shovelPlanted: false,
    shovelAnchorX: 0,
    rodPlanted: false,
    rodAnchorX: 0,
    rodCracked: false,
    lampLit: false,
    carryingKeg: false,
    carriedKegWet: false,
    caught: null,
    duskHeld: null,
    specimen: null,
    channel: null,
    pane: null,
    safeThreshold: null,
    lineCast: false,
    candy: null,
    fracture: null,
    lockbar: null,
    rootsUntil: 0,
    rootX: null,
    soilLoosened: false,
    stakes: [],
    fence: false,
    seams: [{ id: "monument", x: 38, progress: 0, seated: false }],
    anchors: [
      { id: "post", x: 8, weight: 2, nominal: 2, kind: "post", real: true, inVoid: false },
      { id: "piling-a", x: 32, weight: 3, nominal: 3, kind: "piling", real: true, inVoid: false },
      { id: "piling-b", x: 36, weight: 1, nominal: 1, kind: "piling", real: true, inVoid: false },
    ],
    weightMemory: null,
    projectiles: [],
    foes: [
      { id: "crawler", x: 14, hp: 5, maxHp: 5, boss: false, anchored: false, unmoored: true, grounded: true, armored: false, rootedUntil: 0, alive: true },
      { id: "vine", x: 45, hp: 3, maxHp: 3, boss: false, anchored: false, unmoored: true, grounded: false, armored: false, rootedUntil: 0, alive: true },
      { id: "marble-heart", x: 39, hp: 40, maxHp: 40, boss: true, anchored: true, unmoored: false, grounded: true, armored: true, rootedUntil: 0, alive: true },
    ],
    insects: [{ id: "lantern-bug", x: 18, sweet: true, alive: true, caught: false, lantern: true }],
    kegs: [],
    buriedKegs: [],
    blasts: [],
    rewards: {
      "creek-coin": { where: "world", x: 15, civilian: false },
      "homestead-jar": { where: "world", x: 6, civilian: true },
    },
    pickedAfterPane: [],
    piles: {},
    granted: ["creek-coin", "homestead-jar"],
    revealedLocks: [],
    guestMark: false,
    sluiceOpen: false,
    wallOpen: false,
    wallScarred: false,
    resin: true,
    alert: 0,
    netTornRoom: false,
    snare: null,
    divedUntil: 0,
    cachesMarked: false,
    marks: [],
    voidMemory: false,
    godVoidHemUsed: false,
    witnessBlind: false,
    specimenTrickUsed: false,
    deathCount: 0,
    interruptCount: 0,
    collisionRecoveries: 0,
    pinBloom: false,
    trench: false,
    debrisDeflected: false,
    wind: false,
    mirror: null,
    bankSurface: "ground",
    stripPilings: false,
    log: [],
    labCleared: [],
    notes: [],
  };
  const merged = { ...base, ...over };
  merged.resources = { ...base.resources, ...(over.resources ?? {}) };
  merged.breath = formStats(merged.form).breath;
  return merged;
}

export function kegTotal(s: RunState): number {
  const piled = Object.values(s.piles).reduce((n, p) => n + p.kegs, 0);
  return s.resources.kegs + s.kegs.length + s.buriedKegs.length + piled + (s.carryingKeg ? 1 : 0);
}

export function rewardCopies(s: RunState, id: string): number {
  return s.rewards[id] ? 1 : 0;
}

function bossHp(s: RunState): number {
  return s.foes.find((f) => f.boss)?.hp ?? -1;
}

export function bossUntouched(before: number, s: RunState): boolean {
  const boss = s.foes.find((f) => f.boss);
  return !!boss && boss.hp === before && boss.alive && boss.rootedUntil <= s.time;
}

function interrupt(s: RunState, reason: string) {
  if (!s.channel) return;
  s.channel = null;
  s.interruptCount += 1;
  pushLog(s, `interrupt:${reason}`);
}

function busy(s: RunState): Result | null {
  if (!s.channel) return null;
  if (s.form === "smuggler") s.poise = Math.max(0, s.poise - 1);
  return no("channel-busy", "A channel is already open. Wanderers reject cleanly; smugglers spend poise on the double input.");
}

function bridgeKind(s: RunState, x: number): "candy" | "fracture" | "lockbar" | null {
  if (s.candy?.alive && x >= s.candy.x0 && x <= s.candy.x1) return "candy";
  if (s.fracture?.alive && x >= s.fracture.x0 && x <= s.fracture.x1) return "fracture";
  if (s.lockbar && x >= Math.min(s.lockbar.x0, s.lockbar.x1) && x <= Math.max(s.lockbar.x0, s.lockbar.x1)) return "lockbar";
  return null;
}

function crushIfNeeded(s: RunState, x: number): boolean {
  const stats = formStats(s.form);
  if (stats.candyOk) return false;
  if (s.candy?.alive && x >= s.candy.x0 && x <= s.candy.x1) {
    s.candy.alive = false;
    return true;
  }
  if (s.fracture?.alive && x >= s.fracture.x0 && x <= s.fracture.x1 && !s.fracture.onWater) {
    s.fracture.alive = false;
    return true;
  }
  return false;
}

function legalGround(x: number): boolean {
  const z = zoneAt(x);
  return z.kind === "home" || z.kind === "soil" || z.kind === "bank";
}

function recover(s: RunState, detail: string): Result {
  s.collisionRecoveries += 1;
  s.x = s.lastFree;
  s.medium = "ground";
  s.vx = 0;
  interrupt(s, "collision");
  return no("collision-recover", detail);
}

function setGround(s: RunState, x: number) {
  s.x = x;
  s.lastFree = x;
  s.medium = "ground";
  s.vx = 0;
}

function refreshMedium(s: RunState) {
  const z = zoneAt(s.x);
  if (z.kind === "gap") s.medium = bridgeKind(s, s.x) ? "ground" : "pit";
  else if (z.kind === "water") s.medium = "water";
  else if (z.kind === "void") s.medium = "void";
  else if (z.kind === "deep") s.medium = "void";
  else s.medium = "ground";
}

function effectiveAnchors(s: RunState): Anchor[] {
  let list = s.anchors.filter((a) => !(s.stripPilings && (a.kind === "piling" || a.id.startsWith("piling"))));
  if (s.shovelPlanted) {
    list = list.concat([{ id: "shovel-plant", x: s.shovelAnchorX, weight: 1, nominal: 1, kind: "shovel", real: true, inVoid: false }]);
  }
  if (s.rodPlanted && !s.rodCracked) {
    list = list.concat([{ id: "rod-brace", x: s.rodAnchorX, weight: 1, nominal: 1, kind: "rod", real: true, inVoid: zoneAt(s.rodAnchorX).kind === "void" }]);
  }
  const stats = formStats(s.form);
  if (stats.bodyAnchor && s.medium === "ground" && !s.channel) {
    const existing = list.find((a) => a.id === "officer-self");
    if (!existing) {
      list = list.concat([{ id: "officer-self", x: s.x, weight: 4, nominal: 4, kind: "officer", real: true, inVoid: false }]);
    }
  }
  return list;
}

function findAnchor(s: RunState, id: string): Anchor | undefined {
  return effectiveAnchors(s).find((a) => a.id === id);
}

function mutateAnchor(s: RunState, id: string): Anchor | undefined {
  if (!findAnchor(s, id)) return undefined;
  const live = s.anchors.find((a) => a.id === id);
  if (live) return live;
  if (id === "officer-self") {
    const row: Anchor = { id, x: s.x, weight: 4, nominal: 4, kind: "officer", real: true, inVoid: false };
    s.anchors.push(row);
    return row;
  }
  return undefined;
}

function checkSluice(s: RunState) {
  const b = s.anchors.find((a) => a.id === "piling-b");
  if (b && b.weight >= 4 && !s.sluiceOpen) {
    s.sluiceOpen = true;
    if (!s.rewards["sluice-token"]) {
      s.rewards["sluice-token"] = { where: "world", x: 36, civilian: false };
      s.granted.push("sluice-token");
    }
  }
}

function foeBy(s: RunState, id: string) {
  return s.foes.find((f) => f.id === id && f.alive);
}

function clearLab(s: RunState, id: string) {
  if (!s.labCleared.includes(id)) s.labCleared.push(id);
}

function canPane(s: RunState, kind: HitKind): boolean {
  const pane = s.pane;
  if (!pane?.alive) return false;
  if (kind === "execute") return false;
  if (Math.abs(s.x - pane.x) > PANE_RANGE && s.medium !== "void") return false;
  if (s.medium === "void" || kind === "void") {
    return s.form === "god" && s.embryo && pane.extraShard && pane.roomId === s.roomId;
  }
  return pane.roomId === s.roomId;
}

function paneReturn(s: RunState): Result {
  const pane = s.pane;
  if (!pane) return no("no-pane", "No pane.");
  const deathX = s.x;
  for (const id of s.pickedAfterPane) {
    const reward = s.rewards[id];
    if (reward && reward.where === "inventory") {
      reward.where = "world";
      reward.x = deathX;
    }
  }
  s.pickedAfterPane = [];
  s.x = pane.x;
  s.lastFree = pane.x;
  s.hp = pane.hp;
  s.medium = "ground";
  s.channel = null;
  pane.alive = false;
  clearLab(s, "glass.pane");
  pushLog(s, "pane-return");
  return ok("pane-return", "The pane breaks and puts you back at the planted threshold. Rewards taken after the plant stay at the hit, once.");
}

function die(s: RunState, kind: HitKind = "physical"): Result {
  s.deathCount += 1;
  s.hp = 0;
  s.channel = null;
  s.vx = 0;
  if (s.caught) {
    s.projectiles.push({ id: s.caught.id, cls: s.caught.cls, x: s.x, vx: 0, alive: true, caught: false });
    s.caught = null;
  }
  const voidPile = kind === "void" || s.medium === "void";
  const pileId = voidPile ? "void-gate" : `corpse-${s.deathCount}`;
  const pile = s.piles[pileId] ?? { id: pileId, x: voidPile ? 48 : s.x, rewardIds: [], kegs: 0 };
  for (const [id, reward] of Object.entries(s.rewards)) {
    if (reward.where === "inventory") {
      reward.where = "pile";
      reward.pileId = pileId;
      reward.x = pile.x;
      if (!pile.rewardIds.includes(id)) pile.rewardIds.push(id);
    }
  }
  if (voidPile) {
    const incoming = s.resources.kegs + (s.carryingKeg ? 1 : 0);
    if (incoming > 0) pile.kegs = incoming;
  } else {
    pile.kegs += s.resources.kegs + (s.carryingKeg ? 1 : 0);
  }
  s.resources.kegs = 0;
  s.carryingKeg = false;
  s.piles[pileId] = pile;
  if (voidPile) s.x = 48;
  pushLog(s, `death:${pileId}`);
  return ok("death", voidPile
    ? "Void death leaves one gate pile. A second death refreshes that pile and does not mint a copy."
    : "Death drops a single corpse pile. Planted world objects stay where they were.");
}

function resolveChannel(s: RunState): Result | null {
  const ch = s.channel;
  if (!ch || s.time < ch.completesAt) return null;
  s.channel = null;
  if (ch.kind === "hem") {
    setGround(s, ch.toX);
    if (zoneAt(ch.toX).kind === "void") s.medium = "void";
    clearLab(s, "cape.hem");
    return ok("hem-commit", "The cape step commits. Until then it can be broken without moving you.");
  }
  if (ch.kind === "leap") {
    if (s.form === "officer" && s.bankSurface === "stone" && zoneAt(ch.toX).kind === "bank") {
      s.rodCracked = true;
      s.rodPlanted = false;
      return recover(s, "Stone refuses the officer's pendulum. The rod cracks and you drop at the last free ground.");
    }
    if (!legalGround(ch.toX)) return recover(s, "The leap meets solid ground and returns you to the last free cell.");
    setGround(s, ch.toX);
    clearLab(s, "boots.leap");
    return ok("leap-commit", "The leap lands. Reach is the form's leap, plus five only while a rod brace holds.");
  }
  if (ch.kind === "brand") {
    return commitBrand(s, ch.targetId ?? "");
  }
  if (ch.kind === "place-keg") {
    return commitKeg(s, ch.toX);
  }
  return null;
}

function commitBrand(s: RunState, targetId: string): Result {
  const keg = s.kegs.find((k) => k.id === targetId) ?? s.buriedKegs.find((k) => k.id === targetId);
  if (!keg) return no("no-target", "Nothing there takes a flame.");
  if (keg.buried || s.buriedKegs.includes(keg)) return no("buried-fuse", "A buried keg cannot be lit. Unearth it first.");
  if (s.resources.oil <= 0) return no("no-oil", "The wick is dry.");
  s.resources.oil -= 1;
  if (s.resources.oil <= 0) s.lampLit = false;
  if (keg.wet) return no("wet-dud", "The powder is wet. Oil is spent and the fuse does not catch.");
  if (s.wind && s.form !== "officer") {
    s.lampLit = false;
    return no("wind", "Wind kills the brand. An officer's heavier grip holds.");
  }
  keg.lit = true;
  keg.fuseAt = s.time + formStats(s.form).fuseDelay;
  clearLab(s, "keg.fuse");
  return ok("fuse-lit", "The fuse is committed. Interrupting you does not unlight it.");
}

function commitKeg(s: RunState, atX: number): Result {
  if (s.resources.kegs <= 0 && !s.carryingKeg) return no("no-keg", "No keg in stock.");
  const z = zoneAt(atX);
  if (z.kind === "deep" || z.kind === "void") {
    return recover(s, "The keg cannot be planted in the void. Stock is unchanged.");
  }
  if (s.lockbar) {
    const a = Math.min(s.lockbar.x0, s.lockbar.x1);
    const b = Math.max(s.lockbar.x0, s.lockbar.x1);
    if (atX > a + 0.2 && atX < b - 0.2 && z.kind === "gap") {
      return no("rolls-off", "A keg rolls off a lockbar. The stock is kept.");
    }
  }
  if (s.medium === "void") return no("mundane-void", "Powder is mundane and does not burn in the void.");
  if (s.carryingKeg) s.carryingKeg = false;
  else s.resources.kegs -= 1;
  const keg = {
    id: `keg-${s.kegs.length + s.buriedKegs.length + 1}`,
    x: atX,
    lit: false,
    wet: s.carriedKegWet || z.kind === "water",
    fuseAt: 0,
    shapedAnchor: null,
    buried: false,
  };
  s.carriedKegWet = false;
  s.kegs.push(keg);
  return ok("keg-placed", `${keg.id} sits at ${atX.toFixed(1)}.`);
}

function detonate(s: RunState, keg: Keg) {
  s.kegs = s.kegs.filter((k) => k !== keg);
  const anchorOk = keg.shapedAnchor ? !!findAnchor(s, keg.shapedAnchor) && !s.rodCracked : false;
  const pinSeated = s.seams.some((seam) => seam.seated);
  const opened = !!keg.shapedAnchor && anchorOk && pinSeated && near(keg.x, 38, 3);
  const misfire = !!keg.shapedAnchor && !anchorOk;
  if (!misfire && near(keg.x, 38, 4)) s.wallScarred = true;
  if (opened) s.wallOpen = true;
  const inSoil = zoneAt(keg.x).kind === "soil" || (keg.x >= 10 && keg.x < 20);
  s.blasts.push({
    id: `blast-${keg.id}`,
    x: keg.x,
    inSoil,
    salvaged: false,
    shaped: !!keg.shapedAnchor && !misfire,
    opened,
  });
  for (const foe of s.foes) {
    if (!foe.alive || foe.boss) continue;
    if (Math.abs(foe.x - keg.x) <= 4 && !foe.armored) foe.hp = Math.max(0, foe.hp - 4);
  }
  if (Math.abs(s.x - keg.x) <= 4 && s.hp > 0) hit(s, 5, "physical");
  pushLog(s, opened ? "breach" : misfire ? "misfire" : "blast");
}

export function tick(s: RunState, dt: number, dir: -1 | 0 | 1): Result {
  const moved = dir === 0 ? null : move(s, dir, dt);
  const stepped = advance(s, dt);
  if (moved && !moved.ok) return moved;
  if (stepped.code !== "advance") return stepped;
  return moved ?? stepped;
}

export function advance(s: RunState, dt: number): Result {
  s.time += dt;
  if (s.medium === "water" || s.medium === "void") {
    s.breath -= dt;
    if (s.breath <= 0) {
      s.x = 39.6;
      s.lastFree = s.x;
      s.medium = "ground";
      s.waterSpeed = 0;
      s.poise = Math.max(0, s.poise - 1);
      s.breath = formStats(s.form).breath;
      pushLog(s, "surface");
    }
  }
  for (const keg of [...s.kegs]) {
    if (keg.lit && !keg.wet && s.time >= keg.fuseAt) detonate(s, keg);
  }
  for (const p of s.projectiles) {
    if (!p.alive || p.caught) continue;
    p.x += p.vx * dt;
  }
  if (s.snare) {
    const hit = s.projectiles.find((p) => p.alive && !p.caught && p.cls === "organic" && near(p.x, s.snare!.x, 1.6));
    if (hit) {
      hit.caught = true;
      hit.alive = false;
      s.snare.holding = hit.id;
      if (s.form === "officer") {
        s.netTornRoom = true;
        s.resources.netTension = 0;
      }
      s.snare = null;
    } else if (s.time >= s.snare.until) s.snare = null;
  }
  const resolved = resolveChannel(s);
  return resolved ?? ok("advance", `t=${s.time.toFixed(2)}`);
}

function guardTool(s: RunState, tool: ToolId, label: string): Result | null {
  if (!has(s, tool)) return no("not-equipped", `${label} is not on the belt.`);
  if (s.hp <= 0) return no("dead", "The body is down.");
  return null;
}

export function dispatch(s: RunState, intent: Intent): Result {
  const result = apply(s, intent);
  pushLog(s, `${result.ok ? "ok" : "no"}:${result.code}`);
  return result;
}

function apply(s: RunState, intent: Intent): Result {
  switch (intent.type) {
    case "equip": {
      if (intent.tools.length > LOADOUT_MAX) return no("loadout-cap", "The belt holds three tools. A fourth would start replacing the room's answers.");
      if (new Set(intent.tools).size !== intent.tools.length) return no("duplicate-tool", "The same tool cannot occupy two slots.");
      if (s.channel) return busy(s) ?? no("channel-busy", "Finish or break the channel before swapping.");
      for (const tool of intent.tools) {
        if (!TOOL_OK(tool)) return no("bad-tool", "Unknown tool.");
      }
      s.equipped = [...intent.tools];
      return ok("equipped", s.equipped.join(", ") || "empty belt");
    }
    case "set-form": {
      if (intent.form === "god" && !s.embryo) return no("embryo-late", "The embryonic god is late. The flag is off, so the form is refused.");
      s.form = intent.form;
      s.breath = formStats(intent.form).breath;
      return ok("form", intent.form);
    }
    case "set-embryo": {
      s.embryo = intent.on;
      if (!intent.on && s.form === "god") s.form = "wanderer";
      return ok("embryo", intent.on ? "The late flag is on. It does not open deep void." : "Embryo flag off.");
    }
    case "set-wind":
      s.wind = intent.on;
      return ok("wind", intent.on ? "Wind is up." : "Wind drops.");
    case "move":
      return move(s, intent.dir, intent.dt);
    case "root":
      return root(s);
    case "release-shovel":
      if (!s.shovelPlanted) return no("not-planted", "The shovel is already in hand.");
      if (!near(s.x, s.shovelAnchorX, 2)) return no("too-far", "Walk back to the plant.");
      s.shovelPlanted = false;
      return ok("shovel-released", "The shovel comes up. Roots already raised stay until they rot.");
    case "bury-reward":
      return buryReward(s, intent.id);
    case "bury-keg":
      return buryKeg(s);
    case "unearth":
      return unearth(s, intent.id);
    case "scoop":
      return scoop(s);
    case "lay-sugar":
      return laySugar(s);
    case "crystallize":
      return crystallize(s, intent.heat);
    case "dust":
      return dust(s);
    case "leap":
      return leap(s, intent.toX);
    case "stall":
      return stall(s);
    case "echo-land":
      return echoLand(s);
    case "current-cut":
      return currentCut(s);
    case "eddy":
      return eddy(s);
    case "undertow":
      return undertow(s);
    case "light-lamp":
      return lightLamp(s);
    case "snuff":
      return snuff(s);
    case "witness":
      return witness(s, intent.lockId);
    case "brand":
      return brand(s, intent.targetId);
    case "pin":
      return pin(s, intent.seamId);
    case "bell":
      return bell(s);
    case "weight-tap":
      return weightTap(s, intent.anchorId);
    case "spawn-projectile":
      s.projectiles.push({ id: intent.id, cls: intent.cls, x: intent.x, vx: intent.vx ?? 0, alive: true, caught: false });
      return ok("spawned", intent.id);
    case "catch":
      return catchProj(s, intent.projectileId);
    case "return-shot":
      return returnShot(s, intent.targetId);
    case "specimen":
      return specimen(s, intent.insectId);
    case "release-specimen":
      return releaseSpecimen(s);
    case "snare":
      return snare(s);
    case "plant-pane":
      return plantPane(s, !!intent.extraShard);
    case "hit":
      return hit(s, intent.amount, intent.kind);
    case "mirror":
      return placeMirror(s, intent.x);
    case "fracture":
      return fracture(s, !!intent.onWater);
    case "hem":
      return hem(s, intent.toX);
    case "fold":
      return fold(s, intent.targetId);
    case "dusk-carry":
      return dusk(s);
    case "transfer":
      return transfer(s, intent.fromId, intent.toId, intent.amount);
    case "brace":
      return brace(s);
    case "retrieve-rod":
      if (!s.rodPlanted) return no("not-planted", "No brace.");
      if (!near(s.x, s.rodAnchorX, 2)) return no("too-far", "The brace is behind you.");
      s.rodPlanted = false;
      return ok("rod-retrieved", "The rod comes free.");
    case "lockbar":
      return lockbar(s, intent.toAnchor);
    case "ash-shot":
      return ashShot(s, intent.targetId);
    case "cinder":
      return cinder(s, intent.targetId);
    case "grave-arc":
      return graveArc(s);
    case "place-keg":
      return placeKeg(s, intent.atX ?? s.x);
    case "light-fuse":
      return lightFuse(s, intent.kegId, intent.how);
    case "shape-keg":
      return shapeKeg(s, intent.kegId, intent.anchorId);
    case "salvage":
      return salvage(s, intent.blastId);
    case "dry-keg":
      return dryKeg(s, intent.kegId);
    case "pickup":
      return pickup(s, intent.id);
    case "grant":
      return grant(s, intent.id, intent.x ?? s.x, !!intent.civilian);
    case "enter-void":
      return enterVoid(s);
    case "advance":
      return advance(s, intent.dt);
    case "die":
      return die(s, intent.kind ?? "physical");
    case "recover-pile":
      return recoverPile(s, intent.pileId);
    case "pass-gate":
      return passGate(s);
    case "kill-specimen-with-hammer":
      return killSpecimen(s);
    case "crack-rod":
      s.rodCracked = true;
      return ok("rod-cracked", "The brace is cracked.");
    default:
      return no("unknown", "Unhandled intent.");
  }
}

const TOOL_SET = new Set(["shovel", "sugar", "boots", "fins", "lamp", "hammer", "net", "glass", "cape", "rod", "bow", "keg"]);
function TOOL_OK(tool: string): tool is ToolId {
  return TOOL_SET.has(tool);
}

function move(s: RunState, dir: -1 | 1, dt: number): Result {
  if (s.hp <= 0) return no("dead", "Down.");
  if (dt <= 0) return no("bad-dt", "No time.");
  const speed = formStats(s.form).move;
  let left = speed * dt;
  let last: Result = ok("move", `x=${s.x.toFixed(2)}`);
  while (left > 0.001) {
    const slice = Math.min(0.3, left);
    left -= slice;
    last = moveStep(s, dir, slice / speed);
    if (!last.ok) return last;
  }
  return last;
}

function moveStep(s: RunState, dir: -1 | 1, dt: number): Result {
  if (s.hp <= 0) return no("dead", "Down.");
  const stats = formStats(s.form);
  s.facing = dir;
  const step = stats.move * dt * dir;
  let nx = s.x + step;
  if (nx < 0) nx = 0;
  if (nx > WORLD_MAX) nx = WORLD_MAX;
  s.vx = stats.move * dir;

  const from = zoneAt(s.x);
  const to = zoneAt(nx);

  if (to.kind === "deep" || nx >= 54) return recover(s, "Deep void is not a tile you can occupy.");

  if (to.kind === "gap" || from.kind === "gap") {
    if (crushIfNeeded(s, Math.min(28, Math.max(20, nx)))) {
      s.vx = 0;
      return no("crushed-bridge", "Your weight breaks the sugar glass. You stay on the last ground.");
    }
    const bridge = bridgeKind(s, nx) || (from.kind === "gap" ? bridgeKind(s, s.x) : null);
    if (!bridge) {
      s.vx = 0;
      return no("gap", "The gap is open. Leap, candy, or a lockbar — walking does not invent a floor.");
    }
    if (bridge === "lockbar" && stats.mass > 1.2) {
      s.vx = 0;
      return no("lockbar-mass", "The officer's mass will not tightrope a lockbar. Dive it with fins, or pendulum with boots.");
    }
    s.x = nx;
    s.medium = "ground";
    return ok("move", "Along the span.");
  }

  if (to.kind === "water") {
    if (!has(s, "fins")) {
      s.vx = 0;
      s.x = Math.min(s.x, 39.7);
      s.medium = "ground";
      return no("need-fins", "Without creek fins the water pushes you back to the lip.");
    }
    s.x = nx;
    s.medium = "water";
    s.waterSpeed = Math.min(6, s.waterSpeed + stats.waterAccel * dt);
    return ok("swim", `Speed ${s.waterSpeed.toFixed(2)}.`);
  }

  if (from.kind === "water" && (to.kind === "home" || to.kind === "soil" || to.kind === "bank")) {
    s.x = nx;
    s.medium = "ground";
    s.lastFree = nx;
    return ok("shore", "Back on ground. Water speed is still on you until an eddy or a cut.");
  }

  if (to.kind === "void" || from.kind === "void") {
    s.vx = 0;
    return no("void-edge", "The void does not take a walking step. Enter it on purpose, if you even can.");
  }

  s.x = nx;
  s.medium = "ground";
  s.lastFree = nx;
  return ok("move", `x=${s.x.toFixed(2)}`);
}

function root(s: RunState): Result {
  const deny = guardTool(s, "shovel", "Shovel");
  if (deny) return deny;
  if (s.shovelPlanted) return no("planted", "The shovel is already in the ground.");
  if (zoneAt(s.x).kind !== "soil") return no("no-soil", "Roots need soil. Stone, water, and void give none.");
  if (s.channel?.kind === "hem") interrupt(s, "root");
  s.shovelPlanted = true;
  s.shovelAnchorX = s.x;
  s.rootX = s.x;
  s.rootsUntil = s.time + 8;
  if (s.form === "wanderer" && s.safeThreshold === null) s.safeThreshold = s.x;
  let snared = 0;
  for (const foe of s.foes) {
    if (!foe.alive || !foe.grounded || !near(foe.x, s.x, 4)) continue;
    if (foe.boss) continue;
    foe.rootedUntil = s.rootsUntil;
    snared += 1;
  }
  clearLab(s, "shovel.root");
  return ok("roots", snared
    ? `Temporary roots hold ${snared} grounded body. The marble heart does not take them.`
    : "Roots rise. Nothing grounded was in reach. The shovel stays planted.");
}

function buryReward(s: RunState, id: string): Result {
  const deny = guardTool(s, "shovel", "Shovel");
  if (deny) return deny;
  if (s.shovelPlanted) return no("planted", "Free the shovel first.");
  if (zoneAt(s.x).kind !== "soil") return no("no-soil", "Caches go in soil.");
  const reward = s.rewards[id];
  if (!reward || reward.where !== "inventory") return no("not-held", "That reward is not in inventory, so it cannot be buried a second time.");
  reward.where = "buried";
  reward.x = s.x;
  return ok("buried", `${id} is in the ground once.`);
}

function buryKeg(s: RunState): Result {
  const deny = guardTool(s, "shovel", "Shovel");
  if (deny) return deny;
  if (zoneAt(s.x).kind !== "soil") return no("no-soil", "Soil only.");
  if (s.resources.kegs <= 0) return no("no-keg", "No keg in stock.");
  s.resources.kegs -= 1;
  s.buriedKegs.push({
    id: `buried-keg-${s.buriedKegs.length + 1}`,
    x: s.x,
    lit: false,
    wet: false,
    fuseAt: 0,
    shapedAnchor: null,
    buried: true,
  });
  return ok("keg-buried", "The keg is cached unfused. A cinder cannot reach it underground.");
}

function unearth(s: RunState, id: string): Result {
  const deny = guardTool(s, "shovel", "Shovel");
  if (deny) return deny;
  if (s.form !== "smuggler" && (Math.abs(s.vx) > 0.4 || s.waterSpeed > 0.4)) {
    return no("must-stop", "Only the smuggler unearths while still moving.");
  }
  const reward = s.rewards[id];
  if (reward?.where === "buried") {
    reward.where = "world";
    reward.x = s.x;
    return ok("unearthed", id);
  }
  const keg = s.buriedKegs.find((k) => k.id === id);
  if (!keg) return no("nothing-buried", "No such cache.");
  s.buriedKegs = s.buriedKegs.filter((k) => k !== keg);
  s.resources.kegs += 1;
  keg.buried = false;
  return ok("keg-unearthed", "The keg is back in stock. It was not copied.");
}

function scoop(s: RunState): Result {
  const deny = guardTool(s, "shovel", "Shovel");
  if (deny) return deny;
  if (s.shovelPlanted) return no("planted", "The shovel is planted.");
  if (zoneAt(s.x).kind !== "soil") return no("no-soil", "Scoop loose ground, not stone.");
  s.soilLoosened = true;
  s.trench = true;
  const debris = s.projectiles.find((p) => p.alive && p.cls === "debris" && near(p.x, s.x, 2.5));
  if (debris) {
    debris.alive = false;
    s.debrisDeflected = true;
  }
  const bullet = s.projectiles.find((p) => p.alive && (p.cls === "bullet" || p.cls === "void" || p.cls === "slam"));
  return ok("scoop", debris
    ? "The scoop turns one slow debris mass. It does not catch shots."
    : bullet
      ? "Trench cut. The fast shot is still in the air — that is the net's problem, and only if it is organic."
      : "Soil loosened. A trench will bother a charge; it is not a weapon.");
}

function laySugar(s: RunState): Result {
  const deny = guardTool(s, "sugar", "Sugar-line");
  if (deny) return deny;
  if (s.medium === "water") {
    if (!has(s, "sugar")) return no("not-equipped", "Sugar-line is not on the belt.");
    if (s.resources.sugar < 1) return no("no-sugar", "The pouch is empty.");
    s.resources.sugar -= 1;
    if (s.form === "officer") return no("sugar-sinks", "Officer weight sinks the sugar. No current marker remains.");
    if (s.form !== "smuggler") return no("sugar-wash", "Only the smuggler can lay a tide marker. The sugar washes out.");
    if (!s.notes.includes("tide")) s.notes.push("tide");
    return ok("tide-marker", "Sugar floats as a current marker. Crossing it with speed lowers the cut threshold. It is not a bridge.");
  }
  if (s.x < 17 || s.x >= 20) return no("not-at-lip", "Cast the line from the soil lip, not from mid-gap or from the bank you have not reached.");
  if (s.resources.sugar < 1) return no("no-sugar", "The pouch is empty.");
  s.resources.sugar -= 1;
  s.lineCast = true;
  const bug = s.insects.find((i) => i.sweet && i.alive && !i.caught);
  if (bug && bug.x < 19) bug.x = Math.min(19, bug.x + 3);
  return ok("sugar-cast", "A sugar line is thrown across this gap only. A wider void does not accept it.");
}

function crystallize(s: RunState, heat: "lamp" | "shard"): Result {
  const deny = guardTool(s, "sugar", "Sugar-line");
  if (deny) return deny;
  if (!s.lineCast) return no("no-line", "Cast the line before you ask it to harden.");
  if (s.resources.sugar < 1) return no("no-sugar", "Not enough sugar left to seed the crystals.");
  if (heat === "lamp") {
    if (!has(s, "lamp") || !s.lampLit || s.resources.oil < 1) return no("need-heat", "The line needs lamp heat, or a homestead shard.");
    s.resources.oil -= 1;
    if (s.resources.oil <= 0) s.lampLit = false;
  } else {
    if (!has(s, "glass") || s.resources.shards < 1) return no("need-heat", "No shard to spend as heat.");
    s.resources.shards -= 1;
  }
  s.resources.sugar -= 1;
  s.candy = { x0: 20, x1: 28, alive: true };
  clearLab(s, "sugar.candy");
  return ok("candy", "A brittle span covers this gap. Officer weight breaks it. It will not cross the void.");
}

function dust(s: RunState): Result {
  const deny = guardTool(s, "sugar", "Sugar-line");
  if (deny) return deny;
  if (!s.resin || !near(s.x, RESIN_X, 2.5)) return no("no-resin", "Dust only clears a resin hazard. It does not deal damage.");
  if (s.resources.sugar < 1) return no("no-sugar", "No sugar.");
  const before = bossHp(s);
  s.resources.sugar -= 1;
  s.resin = false;
  if (bossHp(s) !== before) return no("invariant", "Dust must not hurt the boss.");
  return ok("dusted", "Resin clears. Nothing took damage.");
}

function leap(s: RunState, toX: number): Result {
  const deny = guardTool(s, "boots", "Gap boots");
  if (deny) return deny;
  const blocked = busy(s);
  if (blocked) return blocked;
  const stats = formStats(s.form);
  const reach = stats.leap + (s.rodPlanted && !s.rodCracked ? 5 : 0);
  const wetOpening = s.medium === "water" && has(s, "fins") && s.waterSpeed + 0.001 >= stats.cutThreshold;
  if (Math.abs(toX - s.x) > reach + 0.05) {
    return no("leap-short", `Reach is ${reach}. This gap is not a hop.`);
  }
  const z = zoneAt(toX);
  if (s.medium === "water" && !wetOpening) return no("not-a-swim", "Boots do not leap out of dead water. Fins have to give you a current first.");
  if (z.kind === "water") return no("not-a-swim", "Boots do not cross water. That is the fins.");
  if (z.kind === "void" || z.kind === "deep") return recover(s, "You cannot leap into the void. The body returns to the last free cell.");
  if (!legalGround(toX)) return recover(s, "The landing is not ground.");
  const wind = stats.windup;
  if (wind <= 0) {
    s.channel = { kind: "leap", toX, completesAt: s.time };
    return advance(s, 0);
  }
  s.channel = { kind: "leap", toX, completesAt: s.time + wind };
  return ok("leap-channel", "The leap is committed and can still be broken before it lands.");
}

function stall(s: RunState): Result {
  const deny = guardTool(s, "boots", "Gap boots");
  if (deny) return deny;
  if (s.medium !== "pit" && s.channel?.kind !== "leap") return no("not-airborne", "Stall only answers air, and it does not forgive a pit.");
  const stats = formStats(s.form);
  s.poise = Math.max(0, s.poise - stats.stallPoise);
  return ok("stall", "You hang for a beat. Position is unchanged. A pit is still a pit.");
}

function echoLand(s: RunState): Result {
  const deny = guardTool(s, "boots", "Gap boots");
  if (deny) return deny;
  const marked = s.lineCast || s.safeThreshold !== null || !!s.candy;
  const overPit = s.medium === "pit" || zoneAt(s.x).kind === "gap";
  if (!overPit) return no("not-falling", "Echo landing is for a marked fall, not a flat walk.");
  if (!marked) return hit(s, 999, "fall");
  const lip = s.x >= 24 ? 28.2 : 19.5;
  setGround(s, lip);
  return ok("echo", "A previous sugar or grave mark takes the landing. This is not a teleport across an unmarked pit.");
}

function currentCut(s: RunState): Result {
  const deny = guardTool(s, "fins", "Creek fins");
  if (deny) return deny;
  const stats = formStats(s.form);
  const inVoid = s.medium === "void";
  let threshold = stats.cutThreshold;
  if (s.form === "smuggler" && s.notes.includes("tide")) threshold = Math.max(0.6, threshold - 1);
  if (s.medium !== "water" && !(inVoid && s.form === "god" && s.embryo)) {
    return no("not-water", "Current cut only spends water speed you already have. Dry ground does nothing.");
  }
  if (s.waterSpeed + 0.001 < threshold) {
    return no("no-current", `Need water speed ${threshold}. You have ${s.waterSpeed.toFixed(2)}.`);
  }
  const foe = [...s.foes].filter((f) => f.alive && Math.abs(f.x - s.x) <= 3.6).sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
  let dealt = 0;
  if (foe) {
    const voidOk = !inVoid || (foe.unmoored && !foe.anchored && !foe.boss);
    const mundaneOk = !foe.boss && !foe.armored;
    if (voidOk && mundaneOk) {
      foe.hp = Math.max(0, foe.hp - stats.cutDamage);
      dealt = stats.cutDamage;
    }
  }
  s.waterSpeed *= 0.35;
  const lunge = s.facing * 2;
  const nx = Math.min(53.5, Math.max(0, s.x + lunge));
  if (zoneAt(nx).kind !== "deep") s.x = nx;
  refreshMedium(s);
  if (dealt > 0) clearLab(s, "fins.cut");
  if (foe?.boss) return ok("cut-resisted", "The cut spends your current. An anchored boss, including the marble heart, takes none of it.");
  if (!foe) return ok("cut-whiff", "The speed becomes a lunge. Nothing was in the opening.");
  return ok(dealt ? "cut" : "cut-glanced", dealt ? `Opening hit for ${dealt}. A poke, not a standing attack.` : "The target does not take this cut.");
}

function eddy(s: RunState): Result {
  const deny = guardTool(s, "fins", "Creek fins");
  if (deny) return deny;
  if (s.medium !== "water") return no("not-water", "Eddy brake is a water stop.");
  if (s.waterSpeed <= 0) return no("no-speed", "No current to dump.");
  const range = s.form === "officer" ? 6 : 3;
  s.waterSpeed = 0;
  s.lampLit = false;
  s.carriedKegWet = true;
  for (const keg of s.kegs) if (Math.abs(keg.x - s.x) <= range) keg.wet = true;
  return ok("eddy", "You stop. The lamp dies and nearby powder is wet. Dry it with the lamp later or it is a dud.");
}

function undertow(s: RunState): Result {
  const deny = guardTool(s, "fins", "Creek fins");
  if (deny) return deny;
  if (s.medium === "water") {
    s.divedUntil = s.time + 2;
    return ok("dive", "Under the surface hazard for two seconds. Not a void tunnel.");
  }
  if (s.medium === "void" && s.form === "god" && s.embryo && zoneAt(s.x).kind === "void") {
    s.divedUntil = s.time + 2;
    return ok("void-dive", "A short undertow in void-water. Deep void still refuses you.");
  }
  if (s.lockbar) {
    const far = Math.max(s.lockbar.x0, s.lockbar.x1);
    if (legalGround(far)) {
      setGround(s, far);
      return ok("dive-line", "The lockbar is a dive line, not a footbridge. Mass does not apply under it.");
    }
  }
  return no("no-dive", "Undertow needs water, void-water you are allowed to touch, or a lockbar dive line.");
}

function lightLamp(s: RunState): Result {
  const deny = guardTool(s, "lamp", "Lamp");
  if (deny) return deny;
  if (s.resources.oil <= 0) return no("no-oil", "No oil.");
  if (s.channel?.kind === "hem") interrupt(s, "lamp");
  s.lampLit = true;
  if (s.medium !== "void") s.witnessBlind = false;
  return ok("lit", "The lamp is up. It reveals nothing until you spend oil on a witness or a brand.");
}

function snuff(s: RunState): Result {
  const deny = guardTool(s, "lamp", "Lamp");
  if (deny) return deny;
  if (!s.lampLit) return no("already-dark", "The lamp is already out.");
  s.lampLit = false;
  s.resources.darkCharge = Math.min(2, s.resources.darkCharge + 1);
  return ok("snuffed", "Dark charge banked for the cape. Witness secrets stay hidden until you relight.");
}

function witness(s: RunState, lockId: string): Result {
  const lockX = LOCKS[lockId];
  if (lockX === undefined) return no("no-lock", "That lock is not in this room.");
  if (s.witnessBlind) return no("blind", "You banked the dark. Relight on real ground before witness will answer.");
  const trick = s.resources.oil <= 0 && !!s.specimen?.alive && !s.specimenTrickUsed;
  if (!trick) {
    const deny = guardTool(s, "lamp", "Lamp");
    if (deny) return deny;
    if (!s.lampLit) return no("dark", "Witness needs a flame, or one living lantern bug in the net.");
  }
  let origin = s.x;
  if (s.mirror?.alive && near(s.x, s.mirror.x, 2)) origin = s.mirror.x;
  const range = s.mirror?.alive && near(s.x, s.mirror.x, 2) ? 12 : 8;
  if (Math.abs(origin - lockX) > range) return no("out-of-range", "The flame does not reach. A mirror can bounce it; your feet cannot.");
  if (s.wind && s.form !== "officer" && !trick) {
    s.lampLit = false;
    return no("wind", "Wind takes the witness flame.");
  }
  const cost = s.form === "god" && s.medium === "void" ? 2 : 1;
  if (trick) {
    s.specimenTrickUsed = true;
  } else {
    if (s.resources.oil < cost) return no("no-oil", "Not enough oil for this witness.");
    s.resources.oil -= cost;
    if (s.resources.oil <= 0) s.lampLit = false;
  }
  if (!s.revealedLocks.includes(lockId)) s.revealedLocks.push(lockId);
  s.guestMark = true;
  clearLab(s, "lamp.witness");
  return ok("witness", trick
    ? "The lantern bug spends itself as one flame. It will not do this again in the room."
    : "The lock is visible. Oil is spent.");
}

function lightFuse(s: RunState, kegId: string, how: "brand" | "cinder"): Result {
  const keg = s.kegs.find((k) => k.id === kegId);
  const trio = !!keg
    && !keg.buried
    && !!keg.shapedAnchor
    && !keg.wet
    && has(s, "hammer")
    && has(s, "rod")
    && has(s, "keg")
    && s.seams.some((seam) => seam.seated);
  if (how === "brand" && trio && keg) {
    keg.lit = true;
    keg.fuseAt = s.time + formStats(s.form).fuseDelay;
    return ok("wedge-spark", "Hammer, rod, and a shaped keg spark without the lamp. An unshaped keg still needs a flame.");
  }
  return how === "brand" ? brand(s, kegId) : cinder(s, kegId);
}

function brand(s: RunState, targetId: string): Result {
  const deny = guardTool(s, "lamp", "Lamp");
  if (deny) return deny;
  if (!s.lampLit) return no("dark", "Brand needs a living flame.");
  if (s.channel?.kind === "hem") interrupt(s, "lamp");
  const blocked = busy(s);
  if (blocked) return blocked;
  const keg = [...s.kegs, ...s.buriedKegs].find((k) => k.id === targetId);
  if (!keg) return no("no-target", "No fuse in reach.");
  if (!near(s.x, keg.x, 1.8)) return no("too-far", "Brand is a touch. Use a cinder arrow for range.");
  const wind = s.form === "officer" ? formStats(s.form).windup : 0;
  if (wind > 0) {
    s.channel = { kind: "brand", toX: s.x, completesAt: s.time + wind, targetId };
    return ok("brand-channel", "The officer sets the brand slowly. It holds in wind once it commits.");
  }
  return commitBrand(s, targetId);
}

function pin(s: RunState, seamId: string): Result {
  const deny = guardTool(s, "hammer", "Hammer");
  if (deny) return deny;
  const seam = s.seams.find((row) => row.id === seamId);
  if (!seam) return no("no-seam", "No seam.");
  if (!near(s.x, seam.x, 2.2)) return no("too-far", "Step up to the seam.");
  if (seam.seated) return no("seated", "The pin is already seated.");
  const need = formStats(s.form).pinStrikes;
  if (seam.progress === 0) {
    if (s.resources.pins <= 0) return no("no-pin", "No pins.");
    s.resources.pins -= 1;
  }
  seam.progress += 1;
  if (seam.progress < need) return ok("pin-loose", `Seated ${seam.progress}/${need}. A smuggler needs the second strike.`);
  seam.seated = true;
  s.anchors.push({ id: `pin-${seam.id}`, x: seam.x, weight: 0, nominal: 0, kind: "pin", real: true, inVoid: false });
  clearLab(s, "hammer.pin");
  return ok("pin-seated", "The pin is a seat for the rod. It does not open the heart and it does not pin flesh.");
}

function bell(s: RunState): Result {
  const deny = guardTool(s, "hammer", "Hammer");
  if (deny) return deny;
  if (zoneAt(s.x).kind !== "bank" && !near(s.x, 38, 3)) return no("no-marble", "The bell note needs resonant marble.");
  if (s.pane?.alive) {
    s.pane.alive = false;
    s.fracture = { x0: 20, x1: 28, alive: true, onWater: false };
  }
  if (s.mirror?.alive) s.mirror.alive = false;
  s.cachesMarked = true;
  s.alert += s.form === "smuggler" ? 2 : 1;
  if (s.channel?.kind === "hem") interrupt(s, "bell");
  const before = bossHp(s);
  if (bossHp(s) !== before) return no("invariant", "Bell must not damage.");
  return ok("bell", "Glass in the room shatters, buried caches are marked, and a hem step breaks. No body takes damage.");
}

function weightTap(s: RunState, anchorId: string): Result {
  const deny = guardTool(s, "hammer", "Hammer");
  if (deny) return deny;
  if (!has(s, "rod")) return no("need-rod", "The tap only stores a reading on the block rod.");
  const anchor = findAnchor(s, anchorId);
  if (!anchor) return no("no-anchor", "That seat is not real.");
  s.weightMemory = { anchorId, weight: anchor.weight };
  return ok("tapped", `Reading ${anchor.weight} stored. This does not move the weight.`);
}

function catchProj(s: RunState, id: string): Result {
  const deny = guardTool(s, "net", "Bug net");
  if (deny) return deny;
  if (s.resources.netTension <= 0 || s.netTornRoom) return no("no-tension", "The net is slack or torn for this room.");
  if (s.caught && !s.duskHeld) return no("hands-full", "The net already holds a catch. Return it or fold it into the cape.");
  const proj = s.projectiles.find((p) => p.id === id);
  if (!proj || !proj.alive || proj.caught) return no("no-shot", "Nothing to catch.");
  if (!near(s.x, proj.x, 1.8)) return no("out-of-reach", "The catch is an arm's length, not a vacuum.");
  if (proj.cls !== "organic") {
    return no("wrong-class", "The net takes a slow organic throw only. Mineral arrows, bullets, slams, debris, and void spears pass through.");
  }
  s.resources.netTension -= 1;
  proj.caught = true;
  proj.alive = false;
  s.caught = { id: proj.id, cls: proj.cls };
  return ok("caught", "Held. A return shot is deliberate and spends the catch.");
}

function returnShot(s: RunState, targetId: string): Result {
  const deny = guardTool(s, "net", "Bug net");
  if (deny) return deny;
  if (!s.caught) return no("empty-net", "Nothing held.");
  const foe = foeBy(s, targetId);
  const cls = s.caught.cls;
  s.caught = null;
  if (!foe) return no("no-target", "The catch is thrown and gone.");
  if (foe.boss) return no("boss-immune", "You threw it. The marble heart does not catch a cold from a seed.");
  if (foe.rootedUntil > s.time && cls === "organic") {
    s.pinBloom = true;
    foe.hp = Math.max(0, foe.hp - 3);
    foe.rootedUntil = s.time + 8;
    clearLab(s, "net.return");
    return ok("pin-bloom", "Root and return together bloom the seed. Neither tool does this alone.");
  }
  if (foe.armored) return ok("glanced", "The return glances off armor.");
  foe.hp = Math.max(0, foe.hp - 2);
  clearLab(s, "net.return");
  return ok("returned", "The caught organic comes back as one shot.");
}

function specimen(s: RunState, insectId: string): Result {
  const deny = guardTool(s, "net", "Bug net");
  if (deny) return deny;
  const bug = s.insects.find((i) => i.id === insectId);
  if (!bug || !bug.alive || bug.caught) return no("no-bug", "No living insect.");
  if (!near(s.x, bug.x, 1.6)) return no("out-of-reach", "Too far.");
  if (bug.sweet && s.lineCast && Math.abs(bug.x - 19) > 1.2) {
    return no("mid-trail", "Sweet insects are taken at the end bowl of the sugar line, not skimmed off the middle.");
  }
  if (s.caught) return no("hands-full", "The net is full.");
  bug.caught = true;
  s.specimen = { id: bug.id, alive: true };
  return ok("specimen", "Alive in the net. The hammer will ruin it.");
}

function releaseSpecimen(s: RunState): Result {
  if (!s.specimen) return no("empty", "No specimen.");
  const bug = s.insects.find((i) => i.id === s.specimen!.id);
  if (bug) {
    bug.caught = false;
    bug.x = s.x;
  }
  s.specimen = null;
  return ok("released", "Released alive. A spent lantern trick stays spent.");
}

function snare(s: RunState): Result {
  const deny = guardTool(s, "net", "Bug net");
  if (deny) return deny;
  if (s.resources.netTension <= 0) return no("no-tension", "No tension.");
  s.resources.netTension -= 1;
  const hold = s.form === "officer" ? 3.2 : 2;
  s.snare = { x: s.x, until: s.time + hold, holding: null };
  return ok("snare", "The veil waits for one small organic body. An officer hold tears the net for the rest of the room.");
}

function plantPane(s: RunState, extra: boolean): Result {
  const deny = guardTool(s, "glass", "Homestead glass");
  if (deny) return deny;
  if (s.pane?.alive) return no("pane-exists", "One living pane. Shatter it before you plant another.");
  if (s.medium !== "ground" || !legalGround(s.x)) return no("bad-ground", "Plant on honest ground. Not water, pit, or void.");
  const cost = extra ? 2 : 1;
  if (s.resources.shards < cost) return no("no-shard", "Not enough glass.");
  s.resources.shards -= cost;
  let x = s.x;
  if (s.form === "wanderer" && s.safeThreshold !== null && Math.abs(s.x - s.safeThreshold) <= 4) x = s.safeThreshold;
  s.pane = {
    x,
    hp: s.hp,
    roomId: s.roomId,
    extraShard: extra,
    hiddenFromPlayer: false,
    hiddenFromPatrol: false,
    alive: true,
  };
  return ok("pane-planted", extra
    ? "Pane planted with the extra shard a void return would demand."
    : "Pane planted. A later lethal, non-execute, non-void hit inside range can break it once.");
}

function hit(s: RunState, amount: number, kind: HitKind): Result {
  if (s.hp <= 0) return no("dead", "Already down.");
  if (s.channel) interrupt(s, "hit");
  if (s.hp - amount <= 0 && canPane(s, kind)) return paneReturn(s);
  s.hp -= amount;
  if (s.hp <= 0) return die(s, kind);
  return ok("hit", `hp ${s.hp}`);
}

function placeMirror(s: RunState, x: number): Result {
  const deny = guardTool(s, "glass", "Homestead glass");
  if (deny) return deny;
  if (s.resources.shards < 1) return no("no-shard", "No shard.");
  if (!legalGround(x)) return no("bad-ground", "The mirror wants a sill.");
  s.resources.shards -= 1;
  s.mirror = { x, alive: true };
  return ok("mirror", "A shard is angled. Lamp light can bounce from here. A bell note will break it.");
}

function fracture(s: RunState, onWater: boolean): Result {
  const deny = guardTool(s, "glass", "Homestead glass");
  if (deny) return deny;
  if (s.medium === "void") return no("void-lay", "You cannot lay a fracture inside the void. Lay it on water first.");
  if (!s.pane?.alive) return no("no-pane", "Fracture spends a living pane. There is no silent spare.");
  s.pane.alive = false;
  if (onWater) {
    if (!near(s.x, 40, 3) && zoneAt(s.x).kind !== "water") return no("not-water", "Stand at the creek to lay a water memory.");
    s.fracture = { x0: 40, x1: 48, alive: true, onWater: true };
    s.voidMemory = true;
    return ok("water-memory", "The shard path remembers the creek. A god can later wade the shallow void from that memory. Officer weight is irrelevant here until someone tries to walk void-glass.");
  }
  s.fracture = { x0: 20, x1: 28, alive: true, onWater: false };
  return ok("fracture-gap", "The pane is gone, and so is its return. A shard bridge covers the gap until something heavy steps on it.");
}

function hem(s: RunState, toX: number): Result {
  const deny = guardTool(s, "cape", "Shadow cape");
  if (deny) return deny;
  const blocked = busy(s);
  if (blocked) return blocked;
  const stats = formStats(s.form);
  const inShadow = zoneAt(s.x).kind === "home";
  const godVoid = s.form === "god" && s.embryo && s.medium === "void" && zoneAt(s.x).kind === "void";
  if (godVoid) {
    if (s.godVoidHemUsed) return no("hem-spent", "The void has already taken the one dark step.");
    if (s.resources.darkCharge <= 0) return no("no-dark", "Snuff the lamp on real ground before you ask the cape to move in the void.");
    if (zoneAt(toX).kind !== "void") return no("deep-refuse", "The step stays in the shallow void.");
    s.resources.darkCharge -= 1;
    s.godVoidHemUsed = true;
    s.witnessBlind = true;
    s.channel = { kind: "hem", toX, completesAt: s.time + 0.35 };
    return ok("void-hem", "One shallow step. Witness is blind until you surface and relight.");
  }
  if (!inShadow && s.lampLit) return no("need-dark", "Snuff the lamp or stand in homestead shadow.");
  if (s.lampLit && !inShadow) return no("need-dark", "The lamp outlines you.");
  const fog = zoneAt(s.x).kind === "bank";
  const reach = fog ? stats.hemFog : stats.hem;
  if (Math.abs(toX - s.x) > reach + 0.05) return no("hem-short", `The hem reaches ${reach}.`);
  const a = Math.min(s.x, toX);
  const b = Math.max(s.x, toX);
  for (const z of ZONES) {
    if (z.x1 <= a || z.x0 >= b) continue;
    if (z.kind === "gap" || z.kind === "water" || z.kind === "void" || z.kind === "deep") {
      return no("hem-blocked", "The cape does not cross a gap, water, or void.");
    }
  }
  const wind = Math.max(0.25, stats.windup);
  s.channel = { kind: "hem", toX, completesAt: s.time + wind };
  return ok("hem-channel", "The step is not real until it commits. A bell, a lamp, a root, or a hit breaks it.");
}

function fold(s: RunState, targetId: string): Result {
  const deny = guardTool(s, "cape", "Shadow cape");
  if (deny) return deny;
  if (s.resources.capeFolds <= 0) return no("no-fold", "The cape is already committed.");
  if (targetId === "pane") {
    if (!s.pane?.alive) return no("no-pane", "No pane to hide.");
    s.resources.capeFolds -= 1;
    s.pane.hiddenFromPatrol = true;
    s.pane.hiddenFromPlayer = true;
    return ok("pane-folded", "The return point is hidden from patrols and from you. The return itself still happens.");
  }
  const reward = s.rewards[targetId];
  if (reward?.where !== "buried") return no("no-cache", "Fold hides a buried cache or a pane, not a lit keg and not a loose coin.");
  s.resources.capeFolds -= 1;
  return ok("cache-folded", "Patrols lose the cache. A bell note will mark it again.");
}

function dusk(s: RunState): Result {
  const deny = guardTool(s, "cape", "Shadow cape");
  if (deny) return deny;
  if (s.duskHeld) return no("dusk-full", "The hem already carries one small thing.");
  if (s.caught) {
    s.duskHeld = { id: s.caught.id, kind: "projectile" };
    s.caught = null;
    return ok("dusk", "The catch rides the cape. The net can take another organic.");
  }
  if (s.specimen) {
    s.duskHeld = { id: s.specimen.id, kind: "specimen" };
    s.specimen = null;
    return ok("dusk", "The specimen rides the cape.");
  }
  return no("nothing-small", "Dusk carry takes a catch or a specimen, never a keg.");
}

function transfer(s: RunState, fromId: string, toId: string, amount: number): Result {
  const deny = guardTool(s, "rod", "Block rod");
  if (deny) return deny;
  if (fromId === toId) return no("same-seat", "Pick two seats.");
  const from = mutateAnchor(s, fromId);
  const to = mutateAnchor(s, toId);
  if (!from || !to || !findAnchor(s, fromId) || !findAnchor(s, toId)) return no("need-two-anchors", "Weight moves only between two real seats. One pin is not a system. Bodies are not seats.");
  if (amount <= 0) return no("bad-amount", "Move a real amount.");
  const cap = formStats(s.form).transferCap;
  if (amount > cap) return no("over-cap", `This form moves at most ${cap} in one action.`);
  if (s.form === "god" && s.embryo && s.medium === "void") {
    if (from.nominal < amount) return no("not-enough", "Not enough nominal weight.");
    from.nominal -= amount;
    to.nominal += amount;
    return ok("nominal-transfer", "In the void the rod moves names of weight. Real sluices and real bridges do not feel it.");
  }
  if (from.weight < amount) return no("not-enough", "That seat is lighter than the request.");
  from.weight -= amount;
  to.weight += amount;
  from.nominal = from.weight;
  to.nominal = to.weight;
  checkSluice(s);
  if (s.sluiceOpen) clearLab(s, "rod.transfer");
  return ok("transferred", `Moved ${amount}. Total real weight is conserved.`);
}

function brace(s: RunState): Result {
  const deny = guardTool(s, "rod", "Block rod");
  if (deny) return deny;
  if (s.rodCracked) return no("cracked", "The rod is cracked.");
  if (s.medium !== "ground" || !legalGround(s.x)) return no("bad-ground", "Brace on ground.");
  s.rodPlanted = true;
  s.rodAnchorX = s.x;
  return ok("braced", "The rod is a personal anchor and extends a boot leap by five. It stays here.");
}

function lockbar(s: RunState, toAnchor: string): Result {
  const deny = guardTool(s, "rod", "Block rod");
  if (deny) return deny;
  if (s.rodCracked) return no("cracked", "Cracked rod.");
  const dest = findAnchor(s, toAnchor);
  if (!dest) return no("no-anchor", "The far seat is not an anchor.");
  const originX = s.rodPlanted ? s.rodAnchorX : s.shovelPlanted ? s.shovelAnchorX : s.x;
  if (Math.abs(dest.x - originX) > 14) return no("too-long", "A lockbar reaches at most 14.");
  const stone = dest.real && !dest.inVoid && (dest.kind === "piling" || dest.kind === "post" || dest.kind === "pin" || dest.kind === "shovel");
  s.lockbar = { x0: originX, x1: dest.x, stoneAnchored: stone };
  return ok("lockbar", stone
    ? "Lockbar set on a real seat. Kegs roll off the span. Heavy bodies do not walk it."
    : "Lockbar set, but it is not a stone memory for the void.");
}

function ashShot(s: RunState, targetId: string): Result {
  const deny = guardTool(s, "bow", "Ash bow");
  if (deny) return deny;
  if (s.form === "officer" && s.carryingKeg) return no("hands-full", "An officer cannot nock while a keg is in the arms.");
  if (s.resources.ash < 1) return no("no-ash", "No ash.");
  s.resources.ash -= 1;
  s.projectiles.push({ id: `ash-${s.time.toFixed(2)}-${targetId}`, cls: "mineral", x: s.x, vx: s.facing * 18, alive: true, caught: false });
  if ((targetId === "marble-heart" || zoneAt(s.foes.find((f) => f.id === targetId)?.x ?? 99).kind === "void") && !(s.form === "god" && s.medium === "void")) {
    return ok("shattered", "Ash shatters on marble and on void. No damage.");
  }
  if (s.form === "god" && s.medium === "void") return ok("cold-ash", "The arrow survives the void and carries no heat.");
  s.marks.push(targetId);
  clearLab(s, "bow.thread");
  return ok("marked", "The ash thread marks or pins a line. It is not a bullet, and the net will not catch it.");
}

function cinder(s: RunState, targetId: string): Result {
  const deny = guardTool(s, "bow", "Ash bow");
  if (deny) return deny;
  if (!has(s, "lamp") || !s.lampLit) return no("need-lamp", "Cinder draw takes the lamp's flame at the moment you loose.");
  if (s.resources.ash < 1 || s.resources.oil < 1) return no("no-fuel", "Cinder spends one ash and one oil.");
  const keg = s.kegs.find((k) => k.id === targetId) ?? s.buriedKegs.find((k) => k.id === targetId);
  if (!keg) return no("no-target", "No fuse.");
  s.resources.ash -= 1;
  s.resources.oil -= 1;
  if (s.resources.oil <= 0) s.lampLit = false;
  s.projectiles.push({ id: `cinder-${keg.id}`, cls: "mineral", x: s.x, vx: s.facing * 16, alive: true, caught: false });
  if (keg.buried) return no("buried-fuse", "The arrow wastes itself. Underground fuses do not catch.");
  if (s.medium === "void" || zoneAt(keg.x).kind === "void") return no("cinder-void", "A cinder dies at the void boundary.");
  if (s.wind) return no("wind", "Wind eats the cinder in flight. Ash and oil are already gone.");
  if (keg.wet) return no("wet-dud", "Wet powder refuses the cinder.");
  keg.lit = true;
  keg.fuseAt = s.time + formStats(s.form).fuseDelay;
  return ok("cinder-lit", "The fuse catches at range. The arrow is gone.");
}

function graveArc(s: RunState): Result {
  const deny = guardTool(s, "bow", "Ash bow");
  if (deny) return deny;
  if (!s.soilLoosened || zoneAt(s.x).kind !== "soil") return no("no-loose-soil", "Grave arc wants shovel-loosened soil, not a stone heart.");
  if (s.resources.ash < 1) return no("no-ash", "No ash.");
  s.resources.ash -= 1;
  s.stakes.push(s.x);
  if (s.stakes.length >= 3) s.fence = true;
  for (const foe of s.foes) {
    if (foe.boss) continue;
    if (foe.grounded && foe.alive && zoneAt(foe.x).kind === "soil") foe.rootedUntil = Math.max(foe.rootedUntil, s.time + 2);
  }
  return ok(s.fence ? "fence" : "stake", s.fence
    ? "Three stakes make a short fence. It is weaker than shovel roots and it ignores the boss."
    : `Stake ${s.stakes.length}/3.`);
}

function placeKeg(s: RunState, atX: number): Result {
  const deny = guardTool(s, "keg", "Powder keg");
  if (deny) return deny;
  if (s.form === "wanderer" && s.specimen && !s.duskHeld) {
    return no("bulk", "A wanderer carries one bulk thing. The specimen is already in the net. Dusk-carry it or set the keg down later.");
  }
  if (s.medium === "void" || zoneAt(s.x).kind === "void") return no("mundane-void", "Powder stays mundane. The void does not take a keg.");
  const blocked = busy(s);
  if (blocked) return blocked;
  if (s.resources.kegs <= 0) return no("no-keg", "No keg in stock.");
  const wind = s.form === "officer" ? 0.5 : 0;
  if (wind > 0) {
    s.channel = { kind: "place-keg", toX: atX, completesAt: s.time + wind };
    return ok("place-channel", "The officer sets powder down slowly and exactly.");
  }
  return commitKeg(s, atX);
}

function shapeKeg(s: RunState, kegId: string, anchorId: string): Result {
  const deny = guardTool(s, "keg", "Powder keg");
  if (deny) return deny;
  if (!has(s, "rod")) return no("need-rod", "Shaping wants the rod's seat.");
  const keg = s.kegs.find((k) => k.id === kegId);
  if (!keg || keg.buried) return no("no-keg", "No placed keg.");
  const anchor = findAnchor(s, anchorId);
  if (!anchor || !near(keg.x, anchor.x, 1.8)) return no("not-against-anchor", "Wedged means touching a seat, not aimed from across the creek.");
  keg.shapedAnchor = anchorId;
  return ok("shaped", "The blast will favor that seat. If the seat breaks first, the shot misfires.");
}

function salvage(s: RunState, blastId: string): Result {
  const deny = guardTool(s, "shovel", "Shovel");
  if (deny) return deny;
  const blast = s.blasts.find((b) => b.id === blastId);
  if (!blast) return no("no-blast", "No blast.");
  if (!blast.inSoil) return no("not-soil", "Ash salvage is a soil scrape, not a refund.");
  if (blast.salvaged) return no("already-salvaged", "That ash is already taken.");
  if (!near(s.x, blast.x, 2.5)) return no("too-far", "Stand in the scar.");
  blast.salvaged = true;
  s.resources.ash += 1;
  return ok("salvaged", "One ash comes out of the scar. The keg does not.");
}

function dryKeg(s: RunState, kegId: string): Result {
  const deny = guardTool(s, "lamp", "Lamp");
  if (deny) return deny;
  if (!s.lampLit || s.resources.oil < 1) return no("no-flame", "Drying spends a lit lamp's oil.");
  const keg = s.kegs.find((k) => k.id === kegId);
  if (!keg) return no("no-keg", "No keg.");
  if (!near(s.x, keg.x, 1.8)) return no("too-far", "Hold the lamp to the powder.");
  s.resources.oil -= 1;
  keg.wet = false;
  s.carriedKegWet = false;
  return ok("dried", "The powder is dry. It is not a new keg.");
}

function pickup(s: RunState, id: string): Result {
  const reward = s.rewards[id];
  if (!reward || reward.where !== "world") return no("not-there", "No world copy to take.");
  if (!near(s.x, reward.x, 1.8)) return no("too-far", "Step onto it.");
  if (reward.civilian && s.form === "officer" && !s.guestMark) {
    return no("civilian-cache", "Rutland hands are refused until a witness sets the guest mark.");
  }
  reward.where = "inventory";
  if (s.pane?.alive) s.pickedAfterPane.push(id);
  return ok("picked", id);
}

function grant(s: RunState, id: string, x: number, civilian: boolean): Result {
  if (s.rewards[id] || s.granted.includes(id)) return no("duplicate-reward", "That reward id already exists. The room will not mint another.");
  s.rewards[id] = { where: "world", x, civilian };
  s.granted.push(id);
  return ok("granted", id);
}

function enterVoid(s: RunState): Result {
  if (zoneAt(s.x).kind === "deep" || s.x >= 54) return recover(s, "Deep void rejects every form, including the embryo.");
  if (s.form === "officer") return no("void-refusal", "The officer sinks. Embryo or not, this body does not enter the void.");
  if (s.form !== "god" || !s.embryo) return no("not-god", "Only the embryonic god attempts the shallow void, and only after the late flag.");
  if (!has(s, "fins")) return no("need-fins", "Void-water still wants the fins.");
  const memory = s.voidMemory || !!s.fracture?.onWater;
  const bar = !!s.lockbar?.stoneAnchored;
  if (!memory && !bar) return no("no-memory", "Lay glass on real water first, or set a lockbar into real stone. The void does not accept a fresh path.");
  if (s.x < 39) return no("too-far", "Reach the creek edge before the void will meet you.");
  s.x = 49;
  s.medium = "void";
  return ok("void-wade", "Shallow void. Deep void is still a wall. Powder will not follow.");
}

function recoverPile(s: RunState, pileId: string): Result {
  const pile = s.piles[pileId];
  if (!pile) return no("no-pile", "No such pile.");
  if (!near(s.x, pile.x, 2.5) && !(pileId === "void-gate" && near(s.x, 48, 2))) return no("too-far", "Stand at the pile.");
  for (const id of pile.rewardIds) {
    const reward = s.rewards[id];
    if (reward && reward.where === "pile") reward.where = "inventory";
  }
  s.resources.kegs += pile.kegs;
  pile.rewardIds = [];
  pile.kegs = 0;
  return ok("recovered", "The pile moves into inventory once. Recovering it again adds nothing.");
}

function passGate(s: RunState): Result {
  if (s.form === "officer") return ok("gate-open", "Rutland iron knows this weight.");
  const bypass = s.seams.some((seam) => seam.seated) && (!!s.lockbar || s.rodPlanted);
  if (bypass) return ok("gate-bypass", "Pin and rod together convince the gate. It is slower than wearing the coat.");
  if (s.form === "smuggler") return no("gate-hostile", "The gate treats a smuggler as already wanted. A bell only makes that louder.");
  return no("gate-shut", "A wanderer is a civilian here. The gate stays shut without a pin and a rod.");
}

function killSpecimen(s: RunState): Result {
  const deny = guardTool(s, "hammer", "Hammer");
  if (deny) return deny;
  if (!s.specimen) return no("empty", "No specimen in the net.");
  s.specimen.alive = false;
  const bug = s.insects.find((i) => i.id === s.specimen!.id);
  if (bug) bug.alive = false;
  return ok("specimen-killed", "The bug is dead. It will not light a witness and it will not be caught again.");
}

export function realWeightSum(s: RunState): number {
  return s.anchors.filter((a) => a.kind !== "officer").reduce((n, a) => n + a.weight, 0);
}

export function validateLoadout(form: FormId, tools: ToolId[], embryo: boolean): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (tools.length > LOADOUT_MAX) errors.push("loadout-cap");
  if (new Set(tools).size !== tools.length) errors.push("duplicate-tool");
  if (form === "god" && !embryo) errors.push("embryo-late");
  if (form === "officer" && tools.includes("sugar")) warnings.push("officer-crush: candy and fracture spans break under this mass");
  if (tools.includes("fins") && tools.includes("keg") && !tools.includes("lamp")) warnings.push("wet-dud: an eddy wets powder and this belt cannot dry it");
  if (tools.length === 1) warnings.push("thin-belt: one tool cannot cover the creek");
  return { ok: errors.length === 0, errors, warnings };
}

/** Puzzle each tool cannot solve alone. Used to prove no transformation replaces the set. */
export const SOLO_GAPS: Record<ToolId, string> = {
  shovel: "witness-lock",
  sugar: "weight-transfer",
  boots: "organic-return",
  fins: "last-return",
  lamp: "gap-cross",
  hammer: "water-opening",
  net: "demolish-crack",
  glass: "snare-roots",
  cape: "pin-seat",
  rod: "witness-lock",
  bow: "void-wade",
  keg: "silent-step",
};

export const PUZZLE_TOOLS: Record<string, ToolId[]> = {
  "witness-lock": ["lamp"],
  "weight-transfer": ["rod"],
  "organic-return": ["net"],
  "last-return": ["glass"],
  "gap-cross": ["boots", "sugar", "rod"],
  "water-opening": ["fins"],
  "demolish-crack": ["keg", "rod", "hammer"],
  "snare-roots": ["shovel"],
  "pin-seat": ["hammer"],
  "void-wade": ["fins", "glass"],
  "silent-step": ["cape"],
};

export function coverageGap(tool: ToolId): string | null {
  const gap = SOLO_GAPS[tool];
  const solvers = PUZZLE_TOOLS[gap] ?? [];
  if (solvers.includes(tool)) return null;
  return gap;
}
