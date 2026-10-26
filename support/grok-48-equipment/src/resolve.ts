import { CHARGE_MAX, mustItem } from "./catalog.ts";
import { EFFECTS } from "./effects.ts";
import { lootId } from "./ids.ts";
import { cloneSession, equippedIds } from "./session.ts";
import type { Action, Facts, FactValue, Session } from "./types.ts";

export const SURVEY: Action = {
  kind: "survey",
  counterMs: 40,
  facing: "N",
  projectileTag: "bolt",
  seam: "square",
  submerged: true,
  inCombat: true,
  hitstun: false,
  atRest: false,
  smoke: true,
  rolling: true,
  secondTap: true,
  turnAround: true,
  useCharge: true,
  strikeClapper: true,
  heavyOnThread: false,
  missed: false,
  scoopUsed: true,
  useStaff: true,
  useChannel: true,
  useHorn: true,
  useJar: true,
  useBrand: true,
  removeLantern: false,
};

function num(v: FactValue | undefined): number {
  return typeof v === "number" ? v : 0;
}

function merge(into: Facts, partial: Facts): void {
  for (const [k, v] of Object.entries(partial)) {
    if (k === "slideFromHammer" || k === "slideFromBelt" || k === "hookReach" || k === "billReach" || k === "saberWindowMs" || k === "threadWindowMs") {
      into[k] = Math.max(num(into[k]), num(v));
      continue;
    }
    into[k] = v;
  }
}

export function activeIds(session: Session): string[] {
  const suppressed = new Set(session.suppressed);
  const ids: string[] = [];
  const main = session.slots.mainHand;
  const slung = session.slots.utility === lootId(111) && !!main && mustItem(main).hands === 2;
  for (const id of equippedIds(session)) {
    if (suppressed.has(id)) continue;
    if (slung && id === main) continue;
    ids.push(id);
  }
  return ids;
}

function applyInteractions(facts: Facts, session: Session, action: Action): void {
  const windowMs = Math.max(num(facts.saberWindowMs), num(facts.threadWindowMs));
  if (facts.saberWindowMs !== undefined || facts.threadWindowMs !== undefined) {
    facts.counterWindowMs = windowMs;
  }
  if (facts.saberFaultLength !== undefined) {
    const ms = action.counterMs ?? 40;
    const perfect = ms >= 0 && ms <= windowMs;
    let len = perfect ? num(facts.saberFaultLength) : 0;
    if (len > 0 && facts.faultTape !== undefined) {
      len = Math.min(len, num(facts.faultTape));
      facts.faultTaped = true;
    }
    facts.faultLength = len;
    facts.counterConverted = perfect && len > 0;
    if (len > 0) {
      const remembered = typeof facts.compassDir === "string" ? facts.compassDir : session.compassDir;
      facts.faultDir = remembered || action.facing || "E";
    }
  } else if (facts.faultTape !== undefined) {
    facts.faultWouldCapAt = num(facts.faultTape);
  }

  const slide = Math.max(num(facts.slideFromHammer), num(facts.slideFromBelt));
  if (facts.crateResponseOverride === "stop") {
    facts.crateResponse = "stop";
    facts.slideUnits = 0;
  } else if (slide > 0) {
    facts.crateResponse = "grain";
    facts.slideUnits = slide;
    if (num(facts.slideFromHammer) > 0 && facts.grainSourceBelt === true) facts.grainSource = "hammer+belt";
    else if (num(facts.slideFromHammer) > 0) facts.grainSource = "hammer";
    else facts.grainSource = "belt";
  } else if (facts.shoveWithoutWeapon === true) {
    facts.crateResponse = facts.shoveResult === "grain" ? "grain" : "tumble";
    facts.slideUnits = facts.crateResponse === "grain" ? 2 : 0;
  }

  if (facts.ledgerTrail === true && facts.trailPinned === true) facts.trailFades = "pinned";
}

function catchTags(facts: Facts, session: Session): void {
  if (!session.tools["tool.creek.net"]) {
    facts.caughtTags = "";
    return;
  }
  let tags: Set<string>;
  if (typeof facts.netProfile === "string") tags = new Set(facts.netProfile.split(",").filter(Boolean));
  else tags = new Set(["bolt", "debris", "mote"]);
  if (typeof facts.netAdd === "string") {
    for (const t of facts.netAdd.split(",")) if (t) tags.add(t);
  }
  if (typeof facts.netRemove === "string") {
    for (const t of facts.netRemove.split(",")) tags.delete(t);
  }
  if (typeof facts.filterRestore === "string" && facts.filterRestore !== "inert") tags.add(facts.filterRestore);
  facts.caughtTags = [...tags].sort().join(",");
}

function enforceGates(facts: Facts, session: Session, action: Action): void {
  const survey = action.kind === "survey";
  facts.doorOpen = false;
  if (survey || action.kind === "door") {
    facts.doorReason = session.hasKey ? "equipment-cannot-turn-key" : "missing-key";
  }

  if (survey || action.kind === "wedge") {
    const seam = action.seam ?? "square";
    if (!session.tools["tool.quarry.wedge"]) {
      facts.seamOpen = false;
      facts.seamReason = "needs-wedge-tool";
    } else if (facts.cheek === true && seam === "square") {
      facts.seamOpen = false;
      facts.seamReason = "cheek-blocks-square";
    } else {
      facts.seamOpen = true;
      facts.seamReason = facts.featherQuiet === true ? "opened-quietly" : "opened";
    }
    facts.crateFitsSeam = facts.seamOpen === true && facts.seamWiden === true;
  }

  let location = session.lanternLocation;
  if (!session.tools["tool.lantern.body"]) location = "absent";
  if (facts.stake === "planted" && session.tools["tool.lantern.body"] && !action.removeLantern) location = "staked";
  if (action.removeLantern) location = "absent";
  if (action.kind === "unstake" && session.tools["tool.lantern.body"]) location = "carried";
  const lit = location === "carried" || location === "staked";
  facts.darknessRevealed = lit;
  facts.lanternLocation = location;
  // A form tag of light-body is intentionally ignored here.
  facts.lightBodyIsNotLantern = true;
  if (!lit) {
    if (facts.revealCorridor || facts.revealLobes || facts.revealFloor || facts.revealSlit) {
      facts.revealDenied = "no-lantern-tool";
    }
    facts.revealMode = "none";
  } else if (facts.revealSlit === true) facts.revealMode = facts.slitLocked === true ? "slit-locked" : "slit";
  else if (facts.revealFloor === true) facts.revealMode = "floor";
  else if (facts.revealLobes === true) facts.revealMode = "lobes";
  else if (facts.revealCorridor === true) facts.revealMode = "corridor";
  else facts.revealMode = location === "staked" ? "staked" : "tool";

  const tryDeep = survey || action.useStaff === true;
  facts.deepCrossing = !!(tryDeep && session.tools["tool.creek.staff"]);
  const trySluice = survey || action.useChannel === true;
  facts.sluiceSet = !!(trySluice && session.tools["tool.creek.channel"]);
  const tryHorn = survey || action.kind === "horn";
  facts.hollowOpen = !!(tryHorn && session.tools["tool.hollow.horn"]);
  const tryVeil = survey || action.kind === "veil";
  facts.thinPassed = !!(tryVeil && session.tools["tool.hollow.veil"]);
  const tryScoop = survey || action.scoopUsed === true;
  facts.ashPileMoved = !!(tryScoop && session.tools["tool.ash.scoop"]);
  const tryJar = survey || action.useJar === true;
  facts.sampleJarred = !!(tryJar && session.tools["tool.sugar.jar"]);
  if (facts.boardRejectsMandatory === true) facts.mandatorySampleOnBoard = false;
  const tryBrand = survey || action.useBrand === true;
  facts.brandWritten = !!(tryBrand && session.tools["tool.ash.brand"]);

  catchTags(facts, session);

  if ((action.smoke ?? false) && facts.cough === undefined) facts.cough = true;
  if ((action.submerged ?? false) && facts.swept === undefined) facts.swept = true;
  if ((action.submerged ?? false) && facts.drawSplash === undefined && (survey || action.kind === "counter")) {
    facts.drawSplash = true;
  }
  if (facts.crateResponse === undefined && (survey || action.kind === "shove")) {
    facts.crateResponse = "tumble";
    facts.slideUnits = 0;
  }
  if (facts.ashTrail === undefined && session.tools["tool.ash.scoop"] && (survey || action.kind === "snuff")) {
    facts.ashTrail = true;
  }
  if (facts.pryChipsGlass === undefined && session.tools["tool.quarry.pry"] && (survey || action.kind === "shove")) {
    facts.pryChipsGlass = true;
  }
  if (
    facts.keysFouled === undefined &&
    session.tools["tool.sugar.brush"] &&
    (survey || action.kind === "explore")
  ) {
    facts.keysFouled = true;
  }
}

function applySession(session: Session, facts: Facts, action: Action, spends: string[]): Session {
  const next = cloneSession(session);
  for (const id of spends) {
    next.charges[id] = Math.max(0, (next.charges[id] ?? 1) - 1);
  }
  if ((action.kind === "block" || action.kind === "survey") && typeof facts.stored === "string" && facts.storeRefused === undefined && !session.storedProjectile) {
    next.storedProjectile = { tag: String(facts.stored) };
  }
  if (action.kind === "release" && facts.released === true) {
    if (facts.rewindReady === true && action.missed && (next.charges[lootId(72)] ?? 0) > 0) {
      next.charges[lootId(72)] -= 1;
      facts.rewound = true;
    } else {
      next.storedProjectile = null;
    }
  }
  if (facts.markLegal === true && (action.kind === "mark" || action.kind === "survey")) {
    next.safeMark = { x: next.x, y: next.y, frozen: false };
  }
  if (typeof facts.safeFlag === "string") {
    next.flagX = next.x;
    next.flagY = next.y;
  }
  if (next.slots.trinket === lootId(66) && next.tools["tool.lantern.body"]) next.warmthCharged = true;
  if (facts.stake === "planted") next.lanternLocation = "staked";
  if (facts.stake === "removed" || action.kind === "unstake") {
    next.lanternLocation = next.tools["tool.lantern.body"] ? "carried" : "absent";
  }
  if (typeof facts.grainPin === "string" && next.slots.utility === lootId(98)) {
    next.grainPin = typeof facts.grainAxis === "string" ? facts.grainAxis : facts.grainPin;
  }
  if (facts.chargesRestored === true) {
    for (const [id, max] of Object.entries(CHARGE_MAX)) {
      if (owns(next, id)) next.charges[id] = max;
    }
  }
  if (typeof facts.compassDir === "string") next.compassDir = facts.compassDir;
  if (action.removeLantern) {
    next.tools = { ...next.tools, "tool.lantern.body": false };
    next.lanternLocation = "absent";
    facts.darknessRevealed = false;
    facts.lanternLocation = "absent";
    facts.revealMode = "none";
  }
  return next;
}

function owns(session: Session, id: string): boolean {
  return session.inventory.includes(id) || equippedIds(session).includes(id) || session.lostAndFound.includes(id);
}

export interface Beat {
  session: Session;
  facts: Facts;
  log: string[];
}

export function runBeat(session: Session, action: Action): Beat {
  const facts: Facts = {};
  const log: string[] = [];
  const spends: string[] = [];
  for (const id of activeIds(session)) {
    const effect = EFFECTS[id];
    if (!effect) continue;
    const result = effect(session, action);
    if (result.tell) log.push(result.tell);
    if (result.spend && action.useCharge !== false) spends.push(id);
    if (result.facts) merge(facts, result.facts);
  }
  applyInteractions(facts, session, action);
  enforceGates(facts, session, action);
  const next = applySession(session, facts, action, spends);
  return { session: next, facts, log };
}

export function signature(facts: Facts): string {
  return Object.keys(facts)
    .sort()
    .map((k) => `${k}=${String(facts[k])}`)
    .join("|");
}

export function factDelta(next: Facts, base: Facts): Facts {
  const out: Facts = {};
  const keys = new Set([...Object.keys(next), ...Object.keys(base)]);
  for (const k of keys) {
    if (next[k] !== base[k]) out[k] = next[k] ?? "absent";
  }
  return out;
}
