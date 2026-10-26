/**
 * Tracking simulation for one pocket.
 * Clock, signs, disturbance, flight, and rewards are deterministic.
 * Presentation (shake, silhouettes) must not call back into this file's outcomes.
 */

import { ENCOUNTERS, ENCOUNTER_BY_ID } from "./encounters.ts";
import {
  GROUND_LABEL,
  GROUND_NOISE,
  PLAYER_START,
  concealedAt,
  groundAt,
  losBlocked,
  movementBlocked,
} from "./habitat.ts";
import { PROFILES } from "./profiles.ts";
import {
  POINTS,
  type AnimalRuntime,
  type ChoiceId,
  type Encounter,
  type FieldPage,
  type LogEntry,
  type Point,
  type Profile,
  type Sense,
  type Session,
  type Stance,
  type Threat,
  type TickEvent,
  type Waypoint,
} from "./types.ts";

export const READ_RANGE = 56;
export const SIGN_NOTICE = 118;
export const WIND_MEMORY = 10;
export const CLOCK_PER_SEC = 0.55;
export const SPEED: Record<Stance, number> = { still: 0, creep: 46, walk: 96, rush: 150 };

const STANCE_SCENT: Record<Stance, number> = { still: 0.62, creep: 0.78, walk: 1, rush: 1.15 };
const STANCE_NOISE: Record<Stance, number> = { still: 0.07, creep: 0.34, walk: 0.86, rush: 1.55 };
const STANCE_MOTION: Record<Stance, number> = { still: 0.2, creep: 0.52, walk: 1, rush: 1.22 };

const DIRS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];

export function compass(deg: number): string {
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return DIRS[i];
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function bearing(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

export function angDiff(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

export function pointFrom(origin: Point, deg: number, distance: number): Point {
  const r = (deg * Math.PI) / 180;
  return { x: origin.x + Math.sin(r) * distance, y: origin.y - Math.cos(r) * distance };
}

export function formatClock(minute: number): string {
  const m = ((minute % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  const ap = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${min.toString().padStart(2, "0")} ${ap}`;
}

export function agePhrase(min: number): string {
  if (min < 25) return "fresh — still within the half hour";
  if (min < 120) return "recent — a couple of hours at most";
  if (min < 480) return "hours old, the edges softening";
  return "cold — last night or older";
}

function blankAnimal(enc: Encounter): AnimalRuntime {
  return {
    state: "on-route",
    alert: 0,
    flightT: 0,
    returnT: 0,
    routeOrigin: enc.route[0].atMinute,
    spookedAt: null,
    identified: false,
    signsRead: [],
    madeAt: Object.fromEntries(enc.signs.map((s) => [s.id, s.atMinute])),
    trap: null,
    windowHold: 0,
    glassHold: 0,
    awarded: { observe: false, sketch: false, capture: false, hunt: false },
    discovered: false,
  };
}

export function createSession(): Session {
  return {
    version: 1,
    day: 0,
    minute: 16 * 60 + 10,
    player: { ...PLAYER_START, stance: "still" },
    animals: Object.fromEntries(ENCOUNTERS.map((e) => [e.id, blankAnimal(e)])),
    windReadAt: {},
    log: [
      {
        minute: 16 * 60 + 10,
        text: "Ellis. Late light on the hay. A mark is near your feet. Nothing on this ground will glow.",
        sense: "book",
      },
    ],
    points: 0,
    shots: 0,
    notes: [],
  };
}

export function profileOf(enc: Encounter): Profile {
  const p = PROFILES[enc.profileId];
  if (!p) throw new Error(`missing profile ${enc.profileId}`);
  return p;
}

function relTime(route: Waypoint[], atMinute: number): number {
  return atMinute - route[0].atMinute;
}

export function pointOnSchedule(route: Waypoint[], elapsed: number): { point: Point; activity: string; heading: number } {
  const rel = route.map((w) => ({ ...w, t: relTime(route, w.atMinute) }));
  const head = (i: number) => {
    const a = rel[i];
    const b = rel[Math.min(rel.length - 1, i + 1)];
    return bearing(a, b);
  };
  if (elapsed <= rel[0].t) return { point: rel[0], activity: rel[0].activity, heading: head(0) };
  const last = rel[rel.length - 1];
  if (elapsed >= last.t) return { point: last, activity: last.activity, heading: head(rel.length - 2) };
  for (let i = 0; i < rel.length - 1; i++) {
    const a = rel[i];
    const b = rel[i + 1];
    if (elapsed > b.t) continue;
    const span = b.t - a.t || 1;
    const u = (elapsed - a.t) / span;
    return {
      point: { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u },
      activity: u < 0.5 ? a.activity : b.activity,
      heading: bearing(a, b),
    };
  }
  return { point: last, activity: last.activity, heading: 0 };
}

function along(path: Point[], t: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1 || t <= 0) return path[0];
  if (t >= 1) return path[path.length - 1];
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = dist(path[i], path[i + 1]);
    lengths.push(d);
    total += d;
  }
  let remain = t * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remain <= lengths[i] || i === lengths.length - 1) {
      const u = lengths[i] === 0 ? 0 : remain / lengths[i];
      const a = path[i];
      const b = path[i + 1];
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
    remain -= lengths[i];
  }
  return path[path.length - 1];
}

export type Pose = { point: Point; activity: string; heading: number } | null;

export function animalPose(enc: Encounter, rt: AnimalRuntime, minute: number): Pose {
  if (rt.state === "absent") return null;
  if (rt.state === "flight") {
    const point = along(enc.escape, rt.flightT);
    const heading = bearing(point, enc.escape[enc.escape.length - 1]);
    return { point, activity: "fleeing", heading };
  }
  if (rt.state === "loafing") {
    const point = enc.escape[enc.escape.length - 1];
    return { point, activity: "gone to cover", heading: 0 };
  }
  if (rt.state === "returning") {
    const path = [...enc.escape].reverse();
    const start = enc.route[0];
    if (dist(path[path.length - 1], start) > 8) path.push(start);
    const point = along(path, rt.returnT);
    return { point, activity: "coming back", heading: bearing(point, start) };
  }
  const elapsed = minute - rt.routeOrigin;
  if (elapsed < 0) return null;
  return pointOnSchedule(enc.route, elapsed);
}

export function animalPosition(enc: Encounter, rt: AnimalRuntime, minute: number): Point | null {
  return animalPose(enc, rt, minute)?.point ?? null;
}

export function playerCanSee(from: Point, to: Point, glass: boolean): boolean {
  const range = glass ? 430 : 205;
  if (dist(from, to) > range) return false;
  return !losBlocked(from, to);
}

export function assessThreat(
  enc: Encounter,
  profile: Profile,
  animal: Point,
  player: Point,
  stance: Stance,
): Threat {
  const travel = (enc.wind.fromDeg + 180) % 360;
  const toAnimal = (bearing(player, animal) + 360) % 360;
  const cone = 24 + enc.wind.strength * 16;
  let scent = 0;
  if (profile.scent > 0.08 && Math.abs(angDiff(toAnimal, travel)) <= cone) {
    const reach = profile.scentRadius * (0.62 + enc.wind.strength * 0.5) * STANCE_SCENT[stance];
    const d = dist(player, animal);
    if (d < reach) {
      const alongCone = 1 - Math.abs(angDiff(toAnimal, travel)) / cone;
      scent = profile.scent * alongCone * (1 - d / reach);
    }
  }

  const ground = groundAt(player.x, player.y);
  const noiseReach =
    profile.hearRadius *
    STANCE_NOISE[stance] *
    GROUND_NOISE[ground] *
    (1 - 0.62 * enc.soundFloor);
  let sound = 0;
  const sd = dist(player, animal);
  if (profile.hearing > 0.05 && sd < noiseReach) {
    sound = profile.hearing * (1 - sd / noiseReach);
  }

  const concealed = concealedAt(player);
  const seeReach =
    profile.seeRadius *
    enc.visibility *
    STANCE_MOTION[stance] *
    (concealed ? 0.32 : 1);
  let sight = 0;
  if (!losBlocked(player, animal) && sd < seeReach && profile.sight > 0.05) {
    sight = profile.sight * (1 - sd / seeReach);
  }

  const total = Math.max(scent, sound, sight);
  let primary: Sense | null = null;
  if (total > 0) {
    primary = scent >= sound && scent >= sight ? "scent" : sound >= sight ? "sound" : "sight";
  }
  const name = profile.common;
  let text = "";
  if (primary === "scent") {
    text = `${name} winded you. In this pocket the wind comes from the ${compass(enc.wind.fromDeg)}, and you were upwind. Standing still does not hide scent.`;
  } else if (primary === "sound") {
    const mask =
      enc.soundFloor > 0.45
        ? "The water took some of it. Not enough."
        : "This pocket is quiet, so it carried.";
    text = `${name} heard you ${stancePhrase(stance)} on ${GROUND_LABEL[ground]}. ${mask}`;
  } else if (primary === "sight") {
    const how = concealed
      ? "Cover was not enough once you moved."
      : "You were in the open.";
    const why =
      stance === "walk" || stance === "rush"
        ? "Motion, not a still outline, gave you up."
        : "You were close enough to be sorted from the stems.";
    text = `${name} saw you. ${how} ${why}`;
  }
  return { scent, sound, sight, total, primary, text };
}

function stancePhrase(stance: Stance): string {
  if (stance === "still") return "shifting";
  if (stance === "creep") return "creeping";
  if (stance === "rush") return "rushing";
  return "walking";
}

function readState(rt: AnimalRuntime) {
  return rt.state;
}

function pushLog(session: Session, entry: LogEntry) {
  session.log.unshift(entry);
  if (session.log.length > 48) session.log.length = 48;
}

function beginFlight(
  session: Session,
  enc: Encounter,
  rt: AnimalRuntime,
  text: string,
  sense: Sense,
  events: TickEvent[],
) {
  if (rt.state === "flight" || rt.state === "absent") return;
  rt.state = "flight";
  rt.flightT = 0;
  rt.alert = 1;
  rt.windowHold = 0;
  rt.discovered = true;
  pushLog(session, { minute: session.minute, text, sense, encounterId: enc.id });
  events.push({ type: "feedback", text, sense, encounterId: enc.id });
}

function applyThreat(
  session: Session,
  enc: Encounter,
  rt: AnimalRuntime,
  threat: Threat,
  dtSec: number,
  events: TickEvent[],
) {
  const t = threat.total;
  if (t >= 0.8 && threat.primary) {
    beginFlight(session, enc, rt, threat.text, threat.primary, events);
    return;
  }
  if (t >= 0.56 && threat.primary) {
    if (rt.state === "wary" || rt.state === "alert") {
      beginFlight(session, enc, rt, threat.text, threat.primary, events);
      return;
    }
    if (rt.state === "on-route" || rt.state === "returning") {
      rt.state = "alert";
      rt.alert = t;
      rt.discovered = true;
      const text = `Alert, not yet gone. ${threat.text}`;
      pushLog(session, { minute: session.minute, text, sense: threat.primary, encounterId: enc.id });
      events.push({ type: "feedback", text, sense: threat.primary, encounterId: enc.id });
    }
    return;
  }
  if (t >= 0.34 && threat.primary) {
    if (rt.state === "alert") {
      beginFlight(session, enc, rt, threat.text, threat.primary, events);
      return;
    }
    if (rt.state === "on-route" || rt.state === "returning") {
      rt.state = "wary";
      rt.alert = t;
      const text = `Uneasy. ${threat.text}`;
      pushLog(session, { minute: session.minute, text, sense: threat.primary, encounterId: enc.id });
      events.push({ type: "feedback", text, sense: threat.primary, encounterId: enc.id });
    } else {
      rt.alert = Math.max(rt.alert, t);
    }
    return;
  }
  if (dtSec > 0) {
    rt.alert = Math.max(0, rt.alert - dtSec * 0.22);
    if (rt.alert <= 0.04 && rt.state === "alert") rt.state = "wary";
    if (rt.alert <= 0.04 && rt.state === "wary") rt.state = rt.returnT > 0 && rt.returnT < 1 ? "returning" : "on-route";
  }
}

function refreshFutureSigns(enc: Encounter, rt: AnimalRuntime, minute: number) {
  for (const s of enc.signs) {
    if (s.atMinute >= enc.route[0].atMinute) {
      const rel = s.atMinute - enc.route[0].atMinute;
      rt.madeAt[s.id] = minute + rel;
    }
  }
}

function updateAnimal(session: Session, enc: Encounter, dtSec: number, events: TickEvent[]) {
  const rt = session.animals[enc.id];
  const profile = profileOf(enc);
  if (rt.state === "absent") return;

  if (rt.state === "flight") {
    if (dtSec > 0) rt.flightT = Math.min(1, rt.flightT + dtSec / enc.flightSeconds);
    if (rt.flightT >= 1) {
      rt.state = "loafing";
      rt.spookedAt = session.minute;
    }
    return;
  }

  if (rt.state === "loafing") {
    const pos = animalPosition(enc, rt, session.minute);
    if (
      rt.spookedAt != null &&
      session.minute - rt.spookedAt >= enc.resettleMinutes &&
      (!pos || dist(session.player, pos) > 260)
    ) {
      rt.state = "returning";
      rt.returnT = 0;
      const text = `${profile.common} is walking back onto the circuit. It is not a pop-in — you can watch the return, or ruin it again.`;
      pushLog(session, { minute: session.minute, text, sense: "book", encounterId: enc.id });
      events.push({ type: "feedback", text, sense: "book", encounterId: enc.id });
    }
    return;
  }

  if (rt.state === "returning" && dtSec > 0) {
    rt.returnT = Math.min(1, rt.returnT + dtSec / enc.returnSeconds);
    if (rt.returnT >= 1) {
      rt.state = "on-route";
      rt.routeOrigin = session.minute;
      rt.alert = 0;
      rt.spookedAt = null;
      refreshFutureSigns(enc, rt, session.minute);
      const text = `${profile.common} is back at the start of the circuit. The new marks will be fresh. The old lesson still stands.`;
      pushLog(session, { minute: session.minute, text, sense: "book", encounterId: enc.id });
      events.push({ type: "feedback", text, encounterId: enc.id });
    }
  }

  const pose = animalPose(enc, rt, session.minute);
  if (!pose) return;

  if (rt.trap && !rt.awarded.capture && !rt.awarded.hunt && rt.state === "on-route") {
    if (dist(pose.point, rt.trap) < 36) {
      if (dist(session.player, rt.trap) < 175) {
        if (dist(session.player, pose.point) < 90) {
          beginFlight(
            session,
            enc,
            rt,
            `You stayed on the box. ${profile.common} would not commit, and then noticed you.`,
            "sight",
            events,
          );
          return;
        }
      } else {
        award(session, enc, rt, "capture", events);
        return;
      }
    }
  }

  const threat = assessThreat(enc, profile, pose.point, session.player, session.player.stance);
  applyThreat(session, enc, rt, threat, dtSec, events);
  if (readState(rt) === "flight") {
    if (dtSec > 0) rt.flightT = Math.min(1, rt.flightT + dtSec / enc.flightSeconds);
    return;
  }
  if (readState(rt) === "absent") return;

  const see = playerCanSee(session.player, pose.point, true);
  const eligible =
    (rt.state === "on-route" || rt.state === "wary") &&
    dist(session.player, pose.point) < enc.observeRange &&
    see &&
    rt.identified;
  if (eligible && session.player.stance === "still") rt.windowHold += dtSec;
  else if (dtSec > 0) rt.windowHold = Math.max(0, rt.windowHold - dtSec * (session.player.stance === "creep" ? 0.3 : 1.1));
}

export type Actions = {
  moveX: number;
  moveY: number;
  rush: boolean;
  creep: boolean;
  glass: boolean;
  read: boolean;
  wind: boolean;
  stance?: Stance;
};

export const IDLE_ACTIONS: Actions = {
  moveX: 0,
  moveY: 0,
  rush: false,
  creep: false,
  glass: false,
  read: false,
  wind: false,
};

function movePlayer(session: Session, dtSec: number, actions: Actions) {
  let mx = actions.moveX;
  let my = actions.moveY;
  const mag = Math.hypot(mx, my);
  if (mag > 1) {
    mx /= mag;
    my /= mag;
  }
  const moving = mag > 0.08;
  if (actions.stance) session.player.stance = actions.stance;
  else if (!moving) session.player.stance = "still";
  else if (actions.rush) session.player.stance = "rush";
  else if (actions.creep || actions.glass) session.player.stance = "creep";
  else session.player.stance = "walk";

  const sp = SPEED[session.player.stance];
  if (sp <= 0 || dtSec <= 0) return;
  const nx = session.player.x + mx * sp * dtSec;
  const ny = session.player.y + my * sp * dtSec;
  if (!movementBlocked(nx, ny)) {
    session.player.x = nx;
    session.player.y = ny;
    return;
  }
  if (!movementBlocked(nx, session.player.y)) session.player.x = nx;
  else if (!movementBlocked(session.player.x, ny)) session.player.y = ny;
}

export function tick(session: Session, dtSec: number, actions: Actions = IDLE_ACTIONS): TickEvent[] {
  const dt = Math.max(0, Math.min(0.05, dtSec));
  const events: TickEvent[] = [];
  movePlayer(session, dt, actions);
  session.minute += dt * CLOCK_PER_SEC;
  if (actions.read) events.push(...readNearest(session));
  if (actions.wind) {
    const wind = readWind(session);
    events.push({ type: "feedback", text: wind.text, sense: "wind" });
  }
  events.push(...stepAnimals(session, dt));
  events.push(...glassIdentify(session, dt, actions.glass));
  return events;
}

function stepAnimals(session: Session, dtSec: number): TickEvent[] {
  const events: TickEvent[] = [];
  for (const enc of ENCOUNTERS) updateAnimal(session, enc, dtSec, events);
  return events;
}

/** Sit still and let the clock jump. Cancels if something notices you. */
export function sit(session: Session, minutes = 18): TickEvent[] {
  session.player.stance = "still";
  const events: TickEvent[] = [];
  const steps = Math.max(1, Math.ceil(minutes / 0.25));
  const dm = minutes / steps;
  for (let i = 0; i < steps; i++) {
    session.minute += dm;
    const ev = stepAnimals(session, 0);
    events.push(...ev);
    if (ev.some((e) => e.type === "feedback" && e.sense && e.sense !== "book")) break;
  }
  const text = `You sat. The light moved to ${formatClock(session.minute)}.`;
  pushLog(session, { minute: session.minute, text, sense: "book" });
  events.push({ type: "feedback", text, sense: "book" });
  return events;
}

function glassIdentify(session: Session, dtSec: number, glass: boolean): TickEvent[] {
  const events: TickEvent[] = [];
  if (!glass || session.player.stance !== "still") {
    for (const enc of ENCOUNTERS) session.animals[enc.id].glassHold = 0;
    return events;
  }
  for (const enc of ENCOUNTERS) {
    const rt = session.animals[enc.id];
    const pos = animalPosition(enc, rt, session.minute);
    if (!pos || !playerCanSee(session.player, pos, true) || dist(session.player, pos) > 400) {
      rt.glassHold = 0;
      continue;
    }
    rt.glassHold += dtSec;
    if (rt.glassHold > 1.35 && !rt.identified) {
      rt.identified = true;
      rt.discovered = true;
      const profile = profileOf(enc);
      const pose = animalPose(enc, rt, session.minute);
      const text = `Glass on a still minute: ${profile.common}, ${pose?.activity ?? "holding"}. The glass does not show you a path. It only names what you can already see.`;
      pushLog(session, { minute: session.minute, text, sense: "sight", encounterId: enc.id });
      events.push({ type: "identify", text, sense: "sight", encounterId: enc.id });
    }
  }
  return events;
}

export function laidSigns(enc: Encounter, rt: AnimalRuntime, minute: number) {
  return enc.signs.filter((s) => minute >= (rt.madeAt[s.id] ?? s.atMinute));
}

export function readNearest(session: Session): TickEvent[] {
  let best: { enc: Encounter; signId: string; d: number } | null = null;
  for (const enc of ENCOUNTERS) {
    const rt = session.animals[enc.id];
    for (const s of laidSigns(enc, rt, session.minute)) {
      const d = dist(session.player, s);
      if (d <= READ_RANGE && (!best || d < best.d)) best = { enc, signId: s.id, d };
    }
  }
  if (!best) {
    const text = "Nothing readable in reach. Marks are small. Walk to a scuff — they are not marked for you.";
    pushLog(session, { minute: session.minute, text, sense: "read" });
    return [{ type: "feedback", text, sense: "read" }];
  }
  return [readSign(session, best.enc.id, best.signId)];
}

export function readSign(session: Session, encounterId: string, signId: string): TickEvent {
  const enc = ENCOUNTER_BY_ID[encounterId];
  const rt = session.animals[encounterId];
  const s = enc.signs.find((x) => x.id === signId);
  if (!s || !rt) {
    return { type: "feedback", text: "That mark is not in this pocket.", sense: "read" };
  }
  const made = rt.madeAt[s.id] ?? s.atMinute;
  if (session.minute < made) {
    const text = "Nothing has been laid here yet. You are ahead of the animal, which is a place for a box, not a reading.";
    pushLog(session, { minute: session.minute, text, sense: "read", encounterId });
    return { type: "feedback", text, sense: "read", encounterId };
  }
  if (dist(session.player, s) > READ_RANGE + 2) {
    const text = "Closer. A mark is not a beacon.";
    return { type: "feedback", text, sense: "read", encounterId };
  }
  if (!rt.signsRead.includes(s.id)) rt.signsRead.push(s.id);
  rt.discovered = true;
  if (s.identifies) rt.identified = true;
  const age = session.minute - made;
  const profile = profileOf(enc);
  const who = s.identifies ? profile.common : "an animal you cannot name from this mark alone";
  const text = `${labelKind(s.kind)} — ${who}. ${agePhrase(age)}. Direction of travel: ${compass(s.bearing)}. ${s.hint}`;
  const page: FieldPage = {
    kind: labelKind(s.kind),
    who,
    age: agePhrase(age),
    bearing: s.bearing,
    hint: s.hint,
  };
  pushLog(session, { minute: session.minute, text, sense: "read", encounterId });
  return { type: "feedback", text, sense: "read", encounterId, page };
}

function labelKind(kind: string): string {
  if (kind === "spraint") return "Spraint";
  if (kind === "mound") return "Scent mound";
  if (kind === "form") return "Form";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function nearestPocket(x: number, y: number): Encounter | null {
  let best: Encounter | null = null;
  let bestD = Infinity;
  for (const enc of ENCOUNTERS) {
    const d = dist({ x, y }, enc.pocket);
    if (d <= enc.pocket.r && d < bestD) {
      best = enc;
      bestD = d;
    }
  }
  return best;
}

export function readWind(session: Session): { ok: boolean; text: string; encounterId?: string } {
  const enc = nearestPocket(session.player.x, session.player.y);
  if (!enc) {
    const text = "The thread barely lifts. You are between pockets. This is not a forecast for the county, and it does not point at an animal.";
    pushLog(session, { minute: session.minute, text, sense: "wind" });
    return { ok: false, text };
  }
  session.windReadAt[enc.id] = session.minute;
  const strength = enc.wind.strength > 0.75 ? "steady" : enc.wind.strength > 0.5 ? "enough to matter" : "light";
  const text = `In this pocket the wind comes from the ${compass(enc.wind.fromDeg)}, ${strength}. It tells you how scent will travel. It does not tell you where anything is.`;
  pushLog(session, { minute: session.minute, text, sense: "wind", encounterId: enc.id });
  return { ok: true, text, encounterId: enc.id };
}

export function windKnown(session: Session, enc: Encounter): boolean {
  const at = session.windReadAt[enc.id];
  return at != null && session.minute - at <= WIND_MEMORY && session.minute - at >= 0;
}

export type Footing = {
  ground: string;
  cover: boolean;
  /** 0–1. How this stance carries on this ground. Not a distance to an animal. */
  noise: number;
  noiseWord: "quiet" | "soft" | "carrying" | "loud";
  windFrom: string | null;
  scentTravels: string | null;
  pocketLoud: boolean;
};

/** What your body is doing. Never includes an animal, a bearing to one, or a coordinate. */
export function footing(session: Session): Footing {
  const ground = groundAt(session.player.x, session.player.y);
  const raw = STANCE_NOISE[session.player.stance] * GROUND_NOISE[ground];
  const noiseWord = raw < 0.12 ? "quiet" : raw < 0.42 ? "soft" : raw < 1 ? "carrying" : "loud";
  const enc = nearestPocket(session.player.x, session.player.y);
  const known = !!(enc && windKnown(session, enc));
  return {
    ground: GROUND_LABEL[ground],
    cover: concealedAt(session.player),
    noise: Math.max(0, Math.min(1, raw / 2.2)),
    noiseWord,
    windFrom: known && enc ? compass(enc.wind.fromDeg) : null,
    scentTravels: known && enc ? compass((enc.wind.fromDeg + 180) % 360) : null,
    pocketLoud: !!(enc && enc.soundFloor > 0.55),
  };
}

export function nearbyMark(session: Session): { read: boolean; d: number } | null {
  let best: { read: boolean; d: number } | null = null;
  for (const enc of ENCOUNTERS) {
    const rt = session.animals[enc.id];
    for (const s of laidSigns(enc, rt, session.minute)) {
      const d = dist(session.player, s);
      if (d > SIGN_NOTICE) continue;
      if (!best || d < best.d) best = { read: rt.signsRead.includes(s.id), d };
    }
  }
  return best;
}

export function huntBlockers(session: Session, enc: Encounter): string | null {
  const profile = profileOf(enc);
  const rt = session.animals[enc.id];
  if (!profile.quarry) return `No shot on ${profile.common}. ${profile.seasonNote}`;
  if (rt.awarded.hunt || rt.state === "absent") return "That circuit is already closed.";
  if (rt.awarded.observe || rt.awarded.sketch) return "You already kept the page. A shot now would only spend it.";
  if (!rt.identified) return "You have not named it. A shot at a shape is how the wrong animal dies.";
  if (rt.state !== "on-route") return "It is not calm. That would be a rushed shot, and this pocket will not count it.";
  const pos = animalPosition(enc, rt, session.minute);
  if (!pos) return "There is nothing to shoot.";
  if (dist(session.player, pos) > enc.huntRange) return "Too far for a clean shot.";
  if (!playerCanSee(session.player, pos, false)) return "No clear shot. The glass is not a weapon.";
  if (session.player.stance === "walk" || session.player.stance === "rush") return "You are moving too much.";
  const threat = assessThreat(enc, profile, pos, session.player, session.player.stance);
  if (profile.scent > 0.45 && threat.scent > 0.2) return "Your scent is already on it. Loose now and you will call it a hunt after it has you.";
  if (rt.alert > 0.32) return "It is already uneasy.";
  return null;
}

function award(
  session: Session,
  enc: Encounter,
  rt: AnimalRuntime,
  kind: "observe" | "sketch" | "capture" | "hunt",
  events: TickEvent[],
) {
  if (rt.awarded[kind]) return;
  const profile = profileOf(enc);
  rt.awarded[kind] = true;
  rt.discovered = true;
  rt.identified = true;
  let points = 0;
  let text = "";
  if (kind === "observe") {
    points = POINTS.observe;
    text = `${profile.watchTitle}. ${profile.watchDetail}`;
  } else if (kind === "sketch") {
    points = POINTS.sketch;
    text = `${profile.sketchTitle}. The plate is in the book. The animal is still on the circuit.`;
  } else if (kind === "capture") {
    points = POINTS.capture;
    text = `${profile.captureTitle ?? "Live capture"}. ${profile.captureDetail ?? "Released after the notes."}`;
    rt.trap = null;
  } else {
    points = POINTS.hunt;
    text = `${profile.huntTitle ?? "Taken"}. ${profile.huntDetail ?? ""}`;
    rt.state = "absent";
  }
  if (session.shots > 0 && kind !== "hunt") {
    const dock = Math.min(5, session.shots * 2);
    points = Math.max(kind === "observe" ? 6 : 3, points - dock);
    text += " The earlier shot is still in the pocket, so the page is thinner.";
  }
  session.points += points;
  session.notes.push(text);
  pushLog(session, { minute: session.minute, text, sense: "book", encounterId: enc.id });
  events.push({ type: "resolve", text, encounterId: enc.id, points });
}

export function placeTrap(session: Session, encounterId?: string): TickEvent {
  const enc = encounterId ? ENCOUNTER_BY_ID[encounterId] : encounterNear(session);
  if (!enc) return { type: "feedback", text: "No circuit here to trap.", sense: "book" };
  const profile = profileOf(enc);
  const rt = session.animals[enc.id];
  if (profile.capture !== "box-trap") {
    const text = `${profile.common} is not a box animal in this pocket. Watch it, or leave it.`;
    pushLog(session, { minute: session.minute, text, sense: "book", encounterId: enc.id });
    return { type: "feedback", text, sense: "book", encounterId: enc.id };
  }
  if (!rt.identified) {
    const text = "Name it from a mark or the glass before you set wire.";
    return { type: "feedback", text, sense: "book", encounterId: enc.id };
  }
  if (rt.awarded.hunt || rt.state === "absent") {
    return { type: "feedback", text: "Too late. That animal is gone.", sense: "book", encounterId: enc.id };
  }
  const elapsed = session.minute - rt.routeOrigin;
  const upcoming = enc.route.find((w) => relTime(enc.route, w.atMinute) > elapsed + 0.5 && dist(session.player, w) < 52);
  if (!upcoming) {
    const text = "Set the box on a step they have not walked yet. The old print is the wrong side of the animal.";
    pushLog(session, { minute: session.minute, text, sense: "book", encounterId: enc.id });
    return { type: "feedback", text, sense: "book", encounterId: enc.id };
  }
  rt.trap = { x: session.player.x, y: session.player.y };
  rt.discovered = true;
  const text = `Box set on the ${compass(bearing(animalPosition(enc, rt, session.minute) ?? session.player, upcoming))} line. Leave. If you stand over it, they will not enter.`;
  pushLog(session, { minute: session.minute, text, sense: "book", encounterId: enc.id });
  return { type: "feedback", text, sense: "book", encounterId: enc.id };
}

function encounterNear(session: Session): Encounter | null {
  return nearestPocket(session.player.x, session.player.y);
}

export function resolveChoice(session: Session, encounterId: string, choice: ChoiceId): TickEvent {
  if (choice === "trap") return placeTrap(session, encounterId);
  const enc = ENCOUNTER_BY_ID[encounterId];
  const rt = session.animals[encounterId];
  const profile = profileOf(enc);
  if (!enc || !rt) return { type: "feedback", text: "No such circuit.", sense: "book" };

  if (choice === "hunt") {
    const why = huntBlockers(session, enc);
    if (why && !profile.quarry) {
      rt.discovered = true;
      session.points += POINTS.stain;
      session.shots += 1;
      const text = `${why} Forcing it stains the book (${POINTS.stain}).`;
      beginFlight(session, enc, rt, `${profile.common} is gone. You fired at a closed season.`, "shot", []);
      applyShot(session, session.player, enc.id);
      pushLog(session, { minute: session.minute, text, sense: "shot", encounterId: enc.id });
      session.notes.push(text);
      return { type: "resolve", text, sense: "shot", encounterId: enc.id, points: POINTS.stain };
    }
    if (why) return { type: "feedback", text: why, sense: "book", encounterId: enc.id };
    session.shots += 1;
    const events: TickEvent[] = [];
    award(session, enc, rt, "hunt", events);
    applyShot(session, session.player, enc.id);
    return events[0] ?? { type: "resolve", text: "Taken.", encounterId: enc.id, points: POINTS.hunt };
  }

  if (rt.awarded.hunt || rt.state === "absent") {
    return { type: "feedback", text: "The animal is gone. There is nothing left to watch.", sense: "book", encounterId: enc.id };
  }
  const pos = animalPosition(enc, rt, session.minute);
  if (!pos) return { type: "feedback", text: "Not on the ground yet.", sense: "book", encounterId: enc.id };
  const see = playerCanSee(session.player, pos, true);
  const close = dist(session.player, pos) < enc.closeRange && session.player.stance === "still";
  const inWindow =
    (rt.state === "on-route" || rt.state === "wary") &&
    dist(session.player, pos) < enc.observeRange &&
    (see || close) &&
    rt.identified &&
    rt.alert < 0.45;

  if (choice === "observe") {
    if (rt.awarded.observe) return { type: "feedback", text: "That page is already written.", sense: "book", encounterId: enc.id };
    if (!inWindow) return { type: "feedback", text: windowReason(session, enc, rt), sense: "book", encounterId: enc.id };
    const events: TickEvent[] = [];
    award(session, enc, rt, "observe", events);
    return events[0];
  }
  if (choice === "sketch") {
    if (rt.awarded.sketch) return { type: "feedback", text: "The plate is already in the book.", sense: "book", encounterId: enc.id };
    if (!inWindow) return { type: "feedback", text: windowReason(session, enc, rt), sense: "book", encounterId: enc.id };
    if (rt.windowHold < 6.5) {
      return {
        type: "feedback",
        text: `Hold still. The sketch needs a quiet minute — ${Math.max(0, 7 - Math.floor(rt.windowHold))}s of stillness left.`,
        sense: "book",
        encounterId: enc.id,
      };
    }
    const events: TickEvent[] = [];
    if (!rt.awarded.observe) award(session, enc, rt, "observe", events);
    award(session, enc, rt, "sketch", events);
    const points = events.reduce((n, e) => n + (e.points ?? 0), 0);
    const text = events.map((e) => e.text).join(" ");
    return { type: "resolve", text, encounterId: enc.id, points };
  }
  if (choice === "capture") {
    if (profile.capture !== "box-trap") {
      return { type: "feedback", text: `${profile.common} is not taken alive here. The watch is the reward.`, sense: "book", encounterId: enc.id };
    }
    if (!rt.trap) return placeTrap(session, enc.id);
    return { type: "feedback", text: "The box is set. Leave it, and let the clock bring them.", sense: "book", encounterId: enc.id };
  }
  return { type: "feedback", text: "Nothing to do.", sense: "book" };
}

function windowReason(session: Session, enc: Encounter, rt: AnimalRuntime): string {
  if (!rt.identified) return "You have not named it yet. Read a mark, or hold the glass while you are still.";
  if (rt.state === "flight" || rt.state === "loafing") return "It has already left. Read what disturbed it — the line is in the book.";
  if (rt.state === "alert") return "It is alert. Be still and out of the wind, or you will only see the leaving.";
  const pos = animalPosition(enc, rt, session.minute);
  if (!pos) return "Not emerged.";
  if (dist(session.player, pos) > enc.observeRange) return "Too far to make out the behavior. The glass helps only while you can actually see.";
  if (!playerCanSee(session.player, pos, true)) return "Stems in the way. A glowing line will not be drawn for you. Move until the body is actually visible.";
  if (session.player.stance !== "still") return "Be still. Watching while walking is just following, and following is how they leave.";
  return "Not a clean window.";
}

/** A shot is a local noise event. Creek pockets can swallow it. Neighbors are not omniscient. */
export function applyShot(session: Session, origin: Point, exceptId: string): TickEvent[] {
  const events: TickEvent[] = [];
  for (const enc of ENCOUNTERS) {
    if (enc.id === exceptId) continue;
    const rt = session.animals[enc.id];
    if (rt.state === "absent" || rt.state === "flight" || rt.state === "loafing") continue;
    const pos = animalPosition(enc, rt, session.minute);
    if (!pos) continue;
    const profile = profileOf(enc);
    const d = dist(origin, pos);
    const reach = shotReach(enc, profile, d);
    if (reach === "none") continue;
    if (reach === "flight") {
      beginFlight(
        session,
        enc,
        rt,
        `The shot carried to ${profile.common}. They were not your target. Distance did not make them deaf.`,
        "shot",
        events,
      );
    } else {
      rt.state = rt.state === "returning" ? "wary" : "wary";
      rt.alert = Math.max(rt.alert, 0.5);
      const text =
        enc.soundFloor > 0.5
          ? `${profile.common} lifted its head. The creek muddied the shot, but they know a noise that does not belong.`
          : `${profile.common} is uneasy. The shot reached this pocket. You did not see a trail appear — you heard the field change.`;
      pushLog(session, { minute: session.minute, text, sense: "shot", encounterId: enc.id });
      events.push({ type: "feedback", text, sense: "shot", encounterId: enc.id });
    }
  }
  return events;
}

export function shotReach(enc: Encounter, profile: Profile, d: number): "flight" | "wary" | "none" {
  if (profile.hearing < 0.28) return "none";
  if (enc.soundFloor > 0.65 && d > 340) return "none";
  if (d < 430 && profile.hearing > 0.4) return "flight";
  if (d < 920 && profile.hearing > 0.45 && enc.soundFloor < 0.55) return "wary";
  return "none";
}

/**
 * Rest to the next late afternoon. Living circuits start again from their first mark.
 * A killed animal stays gone. This is a chosen jump, not an instant respawn.
 */
export function restToNextAfternoon(session: Session): TickEvent {
  session.day += 1;
  session.minute = 16 * 60 + 10 + session.day * 1440;
  session.player.x = PLAYER_START.x;
  session.player.y = PLAYER_START.y;
  session.player.stance = "still";
  let revived = 0;
  let stayed = 0;
  for (const enc of ENCOUNTERS) {
    const rt = session.animals[enc.id];
    if (rt.awarded.hunt || rt.state === "absent") {
      rt.state = "absent";
      stayed += 1;
      continue;
    }
    rt.state = "on-route";
    rt.alert = 0;
    rt.flightT = 0;
    rt.returnT = 0;
    rt.spookedAt = null;
    rt.windowHold = 0;
    rt.glassHold = 0;
    rt.routeOrigin = enc.route[0].atMinute + session.day * 1440;
    for (const s of enc.signs) rt.madeAt[s.id] = s.atMinute + session.day * 1440;
    revived += 1;
  }
  const text = `You slept into the next afternoon. ${revived} living circuits will walk again. ${stayed} that you killed stay gone. Nothing respawned under your feet.`;
  pushLog(session, { minute: session.minute, text, sense: "book" });
  session.notes.push(text);
  return { type: "feedback", text, sense: "book" };
}

export type Offer = {
  encounterId: string;
  title: string;
  detail: string;
  /** 0–1 stillness toward a sketch. Your patience, not the animal's position. */
  stillness: number;
  choices: { id: ChoiceId; label: string; hint: string; enabled: boolean }[];
};

export function currentOffer(session: Session, glass: boolean): Offer | null {
  let best: { enc: Encounter; d: number } | null = null;
  for (const enc of ENCOUNTERS) {
    const rt = session.animals[enc.id];
    if (!rt.discovered && !rt.identified) continue;
    const pos = animalPosition(enc, rt, session.minute);
    if (!pos) continue;
    if (rt.state === "absent" || rt.state === "loafing") continue;
    const d = dist(session.player, pos);
    const visible = playerCanSee(session.player, pos, glass) && d < (glass ? 430 : 220);
    if (!visible) continue;
    if (!best || d < best.d) best = { enc, d };
  }
  if (!best) return null;
  const enc = best.enc;
  const rt = session.animals[enc.id];
  const profile = profileOf(enc);
  const pose = animalPose(enc, rt, session.minute);
  const huntWhy = huntBlockers(session, enc);
  const choices: Offer["choices"] = [
    {
      id: "observe",
      label: `Watch · ${POINTS.observe}`,
      hint: rt.awarded.observe ? "Page kept" : "Name it, be still, and see the behavior",
      enabled: !rt.awarded.observe && !rt.awarded.hunt,
    },
    {
      id: "sketch",
      label: `Sketch · ${POINTS.sketch}`,
      hint: rt.awarded.sketch ? "Plate kept" : "A longer stillness. Stacks with the watch.",
      enabled: !rt.awarded.sketch && !rt.awarded.hunt,
    },
  ];
  if (profile.capture === "box-trap") {
    choices.push({
      id: "capture",
      label: rt.trap ? "Box is set" : `Set a box · ${POINTS.capture}`,
      hint: "On the step ahead, then leave",
      enabled: !rt.awarded.capture && !rt.awarded.hunt && rt.state !== "absent",
    });
  }
  if (profile.quarry) {
    choices.push({
      id: "hunt",
      label: `Loose arrow · ${POINTS.hunt}`,
      hint: huntWhy ?? "Closes the circuit. The book keeps less.",
      enabled: !huntWhy,
    });
  }
  return {
    encounterId: enc.id,
    title: rt.identified ? profile.common : "Unnamed animal",
    detail: pose ? pose.activity : "",
    stillness: Math.max(0, Math.min(1, rt.windowHold / 6.5)),
    choices,
  };
}

export function discoveredCount(session: Session): number {
  return ENCOUNTERS.filter((e) => session.animals[e.id].discovered).length;
}

export function nonlethalCeiling(profile: Profile): number {
  let n = POINTS.observe + POINTS.sketch;
  if (profile.capture === "box-trap") n += POINTS.capture;
  return n;
}

export { POINTS };
