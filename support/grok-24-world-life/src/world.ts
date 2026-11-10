import { eventsOnTick, ACTIVITIES } from "./activities.ts";
import { CAST, holderFor } from "./cast.ts";
import { HUBS } from "./hubs.ts";
import { cellKey, compileWalk, facingBetween, nearestOpen, pathfind } from "./nav.ts";
import { QUEST_FIXTURES } from "./quests.ts";
import { vacantLine, workLine } from "./talk.ts";
import type {
  ActivityDef,
  ActorBinding,
  ActorState,
  Catalog,
  Cell,
  EphemeralBlock,
  EraHolder,
  EraId,
  HubDef,
  HubId,
  QuestOverride,
  Rejection,
  RoutineDef,
  SaveBlob,
  Station,
  Suppression,
  TalkResult,
  World,
  WorldEvent,
} from "./types.ts";

/** After this many failed steps, the actor goes to the hub fallback. */
export const RECOVER_AFTER = 4;
/** No authored beat may be longer than this. Essential talk does not wait on it. */
export const MAX_STEP_TICKS = 24;
const LOG_CAP = 32;

export function defaultCatalog(): Catalog {
  return {
    hubs: { ...HUBS },
    activities: ACTIVITIES,
    holders: CAST,
    fixtures: QUEST_FIXTURES,
  };
}

export interface CreateInput {
  hub: HubDef;
  eraId: EraId;
  holders: readonly EraHolder[];
  activities: Record<string, ActivityDef>;
  overrides?: readonly QuestOverride[];
  /** Test hooks: replace bindings or routines without editing the plate. */
  bindings?: readonly ActorBinding[];
  routines?: readonly RoutineDef[];
}

export function createWorld(input: CreateInput): World {
  const hub: HubDef = {
    ...input.hub,
    bindings: input.bindings ? [...input.bindings] : input.hub.bindings,
    routines: input.routines ? [...input.routines] : input.hub.routines,
  };
  const walk = compileWalk(hub);
  const stations = stationMap(hub);
  const routines = routineMap(hub);
  const { actors, rejected } = resolveActors(hub, input.eraId, input.holders, stations, routines);
  const world: World = {
    version: 1,
    hubId: hub.id,
    eraId: input.eraId,
    tick: 0,
    w: hub.w,
    h: hub.h,
    walk,
    actors,
    rejected,
    overrides: [],
    suppressed: [],
    ephemeral: [],
    log: [],
    hub,
    activities: input.activities,
  };
  for (const actor of actors) {
    if (actor.mode === "vacant") {
      pushLog(world, {
        tick: 0,
        actorId: actor.actorId,
        kind: "vacant",
        text: vacantLine(actor.roleId),
      });
    }
  }
  setActiveOverrides(world, input.overrides ? [...input.overrides] : []);
  refreshAll(world);
  return world;
}

export function createHubWorld(hubId: HubId, eraId: EraId, overrideIds: readonly string[] = []): World {
  const catalog = defaultCatalog();
  const hub = catalog.hubs[hubId];
  const overrides = catalog.fixtures.filter((q) => overrideIds.includes(q.id));
  return createWorld({
    hub,
    eraId,
    holders: catalog.holders,
    activities: catalog.activities,
    overrides,
  });
}

function stationMap(hub: HubDef): Map<string, Station> {
  return new Map(hub.stations.map((s) => [s.id, s]));
}

function routineMap(hub: HubDef): Map<string, RoutineDef> {
  return new Map(hub.routines.map((r) => [r.id, r]));
}

function resolveActors(
  hub: HubDef,
  eraId: EraId,
  holders: readonly EraHolder[],
  stations: Map<string, Station>,
  routines: Map<string, RoutineDef>,
): { actors: ActorState[]; rejected: Rejection[] } {
  const actors: ActorState[] = [];
  const rejected: Rejection[] = [];
  const used = new Map<string, string>();
  const bindings = [...hub.bindings].sort((a, b) => (a.bindingId < b.bindingId ? -1 : a.bindingId > b.bindingId ? 1 : 0));

  for (const binding of bindings) {
    const routine = routines.get(binding.routineId);
    const home = stations.get(binding.homeStationId);
    if (!routine || !home || routine.steps.length === 0) {
      rejected.push({ bindingId: binding.bindingId, roleId: binding.roleId, reason: "missing-routine" });
      continue;
    }
    const holder = holderFor(holders, eraId, binding.roleId);
    if (!holder || holder.actorId == null) {
      rejected.push({
        bindingId: binding.bindingId,
        roleId: binding.roleId,
        reason: "missing-successor",
        actorId: holder?.actorId ?? undefined,
      });
      actors.push(vacantActor(binding, home, holder));
      continue;
    }
    const kept = used.get(holder.actorId);
    if (kept) {
      rejected.push({
        bindingId: binding.bindingId,
        roleId: binding.roleId,
        reason: "duplicate-actor",
        actorId: holder.actorId,
        keptBindingId: kept,
      });
      continue;
    }
    used.set(holder.actorId, binding.bindingId);
    const first = routine.steps[0]!;
    const at = stations.get(first.stationId) ?? home;
    actors.push({
      actorId: holder.actorId,
      bindingId: binding.bindingId,
      roleId: binding.roleId,
      spokenName: holder.spokenName,
      seatLabel: holder.seatLabel,
      memory: holder.memory,
      provisional: true,
      x: at.x,
      y: at.y,
      facing: "s",
      path: [],
      mode: "work",
      routineId: routine.id,
      stepIndex: 0,
      stepTick: 0,
      activityId: first.activityId,
      activityTick: 0,
      goalStationId: at.id,
      arriveMode: "work",
      blockedTicks: 0,
      stranded: false,
      overrideId: null,
      talking: false,
      available: true,
      availability: "at a public post",
    });
  }

  actors.sort((a, b) => (a.actorId < b.actorId ? -1 : a.actorId > b.actorId ? 1 : 0));
  return { actors, rejected };
}

function vacantActor(binding: ActorBinding, home: Station, holder: EraHolder | undefined): ActorState {
  return {
    actorId: `vacant:${binding.bindingId}`,
    bindingId: binding.bindingId,
    roleId: binding.roleId,
    spokenName: "Empty post",
    seatLabel: holder?.seatLabel ?? "no successor in the cast",
    memory: holder?.memory ?? "only the book remembers",
    provisional: true,
    x: home.x,
    y: home.y,
    facing: "s",
    path: [],
    mode: "vacant",
    routineId: binding.routineId,
    stepIndex: 0,
    stepTick: 0,
    activityId: "mind-the-post",
    activityTick: 0,
    goalStationId: home.id,
    arriveMode: "hold",
    blockedTicks: 0,
    stranded: false,
    overrideId: null,
    talking: false,
    available: false,
    availability: "vacant post",
  };
}

export function setActiveOverrides(world: World, overrides: readonly QuestOverride[]): void {
  world.overrides = [...overrides].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.questId < b.questId ? -1 : a.questId > b.questId ? 1 : a.id < b.id ? -1 : 1;
  });
  applyOverrides(world, true);
}

function applyOverrides(world: World, announce: boolean): void {
  const suppressed: Suppression[] = [];
  const winnerByActor = new Map<string, QuestOverride>();

  for (const ov of world.overrides) {
    const candidates = world.actors.filter((a) => a.roleId === ov.roleId && a.mode !== "vacant");
    if (candidates.length === 0) {
      suppressed.push({ overrideId: ov.id, questId: ov.questId, roleId: ov.roleId, reason: "no-occupant" });
      continue;
    }
    for (const actor of candidates) {
      const current = winnerByActor.get(actor.actorId);
      if (!current) {
        winnerByActor.set(actor.actorId, ov);
        continue;
      }
      const better =
        ov.priority > current.priority ||
        (ov.priority === current.priority && (ov.questId < current.questId || (ov.questId === current.questId && ov.id < current.id)));
      if (better) {
        suppressed.push({
          overrideId: current.id,
          questId: current.questId,
          roleId: current.roleId,
          reason: "lower-priority",
          winnerId: ov.id,
        });
        winnerByActor.set(actor.actorId, ov);
      } else {
        suppressed.push({
          overrideId: ov.id,
          questId: ov.questId,
          roleId: ov.roleId,
          reason: "lower-priority",
          winnerId: current.id,
        });
      }
    }
  }

  world.suppressed = suppressed;

  for (const actor of world.actors) {
    if (actor.mode === "vacant") continue;
    const win = winnerByActor.get(actor.actorId) ?? null;
    if (!win) {
      if (actor.overrideId) {
        actor.overrideId = null;
        if (!actor.talking) resumeRoutine(world, actor);
      }
      continue;
    }
    if (actor.overrideId === win.id) {
      if (actor.stranded && win.stationId) {
        const station = stationMap(world.hub).get(win.stationId);
        if (station && pathfind(world.walk, world.w, world.h, actor, station, blockedSet(world))) {
          actor.stranded = false;
          beginTransit(world, actor, station.id, "hold");
        }
      }
      continue;
    }
    actor.overrideId = win.id;
    actor.stranded = false;
    actor.blockedTicks = 0;
    if (announce) {
      pushLog(world, {
        tick: world.tick,
        actorId: actor.actorId,
        kind: "override",
        text: `${win.questId} takes ${actor.spokenName} (${win.mode}, priority ${win.priority}).`,
      });
    }
    if (win.mode === "suspend" || !win.stationId) {
      actor.mode = "hold";
      actor.path = [];
      actor.arriveMode = "hold";
      actor.activityId = win.activityId ?? "mind-the-post";
      actor.activityTick = 0;
      continue;
    }
    const station = stationMap(world.hub).get(win.stationId);
    if (!station) {
      snapFallback(world, actor, `Quest station ${win.stationId} is missing.`);
      continue;
    }
    actor.activityId = win.activityId ?? actor.activityId;
    actor.arriveMode = "hold";
    if (actor.x === station.x && actor.y === station.y) {
      actor.mode = "hold";
      actor.path = [];
      actor.goalStationId = station.id;
      actor.activityTick = 0;
    } else {
      beginTransit(world, actor, station.id, "hold");
    }
  }
}

function resumeRoutine(world: World, actor: ActorState): void {
  const routine = routineMap(world.hub).get(actor.routineId);
  const step = routine?.steps[actor.stepIndex];
  if (!routine || !step) {
    snapFallback(world, actor, "Routine was missing on resume.");
    return;
  }
  actor.activityId = step.activityId;
  actor.arriveMode = "work";
  actor.stranded = false;
  const station = stationMap(world.hub).get(step.stationId);
  if (!station) {
    snapFallback(world, actor, `Station ${step.stationId} is missing.`);
    return;
  }
  if (actor.x === station.x && actor.y === station.y) {
    actor.mode = "work";
    actor.path = [];
    actor.goalStationId = station.id;
    return;
  }
  beginTransit(world, actor, station.id, "work");
}

export function step(world: World): void {
  world.tick += 1;
  // Re-check winners without restarting an override already in progress.
  applyOverrides(world, false);

  for (const actor of world.actors) {
    if (actor.mode === "vacant") continue;
    if (actor.talking) {
      actor.activityTick += 1;
      emitActivity(world, actor);
      continue;
    }
    if (actor.stranded) {
      actor.activityTick += 1;
      emitActivity(world, actor);
      tryLeaveFallback(world, actor);
      continue;
    }
    if (actor.mode === "hold") {
      actor.activityTick += 1;
      emitActivity(world, actor);
      continue;
    }
    if (actor.mode === "walk") {
      advanceWalk(world, actor);
      continue;
    }
    // work
    const routine = routineMap(world.hub).get(actor.routineId);
    const beat = routine?.steps[actor.stepIndex];
    if (!routine || !beat) {
      snapFallback(world, actor, "Routine step missing.");
      continue;
    }
    if (actor.overrideId) {
      actor.activityTick += 1;
      emitActivity(world, actor);
      continue;
    }
    actor.stepTick += 1;
    actor.activityTick += 1;
    emitActivity(world, actor);
    if (actor.stepTick >= beat.ticks) {
      actor.stepIndex = (actor.stepIndex + 1) % routine.steps.length;
      actor.stepTick = 0;
      const next = routine.steps[actor.stepIndex]!;
      actor.activityId = next.activityId;
      const station = stationMap(world.hub).get(next.stationId);
      if (!station) {
        snapFallback(world, actor, `Next station ${next.stationId} is missing.`);
      } else {
        beginTransit(world, actor, station.id, "work");
      }
    }
  }
  refreshAll(world);
}

function emitActivity(world: World, actor: ActorState): void {
  const def = world.activities[actor.activityId];
  if (!def) return;
  for (const event of eventsOnTick(def, actor.activityTick)) {
    pushLog(world, { tick: world.tick, actorId: actor.actorId, kind: "activity", text: event.text });
  }
}

function advanceWalk(world: World, actor: ActorState): void {
  if (actor.path.length === 0) {
    const goal = stationMap(world.hub).get(actor.goalStationId);
    if (!goal) {
      snapFallback(world, actor, "Goal station missing while walking.");
      return;
    }
    if (actor.x === goal.x && actor.y === goal.y) {
      arrive(world, actor);
      return;
    }
    const path = pathfind(world.walk, world.w, world.h, actor, goal, blockedSet(world));
    if (!path) {
      actor.blockedTicks += 1;
      if (actor.blockedTicks >= RECOVER_AFTER) {
        snapFallback(world, actor, "No path. They go to the open ground.");
      }
      return;
    }
    if (path.length === 0) {
      arrive(world, actor);
      return;
    }
    actor.path = path;
  }

  const next = actor.path[0]!;
  if (!isOpen(world, next)) {
    actor.path = [];
    actor.blockedTicks += 1;
    const goal = stationMap(world.hub).get(actor.goalStationId);
    const alt = goal ? pathfind(world.walk, world.w, world.h, actor, goal, blockedSet(world)) : null;
    if (alt && alt.length) {
      actor.path = alt;
      actor.blockedTicks = 0;
      return;
    }
    if (actor.blockedTicks >= RECOVER_AFTER) {
      snapFallback(world, actor, "The way is blocked. They keep to the fallback.");
    }
    return;
  }

  actor.facing = facingBetween(actor, next);
  actor.x = next.x;
  actor.y = next.y;
  actor.path.shift();
  actor.blockedTicks = 0;
  if (actor.path.length === 0) arrive(world, actor);
}

function arrive(world: World, actor: ActorState): void {
  const station = stationMap(world.hub).get(actor.goalStationId);
  if (station) {
    actor.x = station.x;
    actor.y = station.y;
  }
  actor.path = [];
  actor.blockedTicks = 0;
  actor.mode = actor.arriveMode;
  if (actor.arriveMode === "work") {
    const beat = routineMap(world.hub).get(actor.routineId)?.steps[actor.stepIndex];
    if (beat) actor.activityId = beat.activityId;
    actor.stepTick = 0;
  }
  actor.activityTick = 0;
}

function beginTransit(world: World, actor: ActorState, stationId: string, arriveMode: "work" | "hold"): void {
  const station = stationMap(world.hub).get(stationId);
  actor.goalStationId = stationId;
  actor.arriveMode = arriveMode;
  if (!station) {
    snapFallback(world, actor, `Cannot walk to missing station ${stationId}.`);
    return;
  }
  if (actor.x === station.x && actor.y === station.y) {
    arrive(world, actor);
    return;
  }
  const path = pathfind(world.walk, world.w, world.h, actor, station, blockedSet(world));
  if (!path) {
    actor.mode = "walk";
    actor.path = [];
    return;
  }
  actor.blockedTicks = 0;
  actor.path = path;
  actor.mode = path.length === 0 ? arriveMode : "walk";
  if (path.length === 0) arrive(world, actor);
}

function tryLeaveFallback(world: World, actor: ActorState): void {
  if (actor.overrideId || actor.talking) return;
  const beat = routineMap(world.hub).get(actor.routineId)?.steps[actor.stepIndex];
  if (!beat) return;
  const station = stationMap(world.hub).get(beat.stationId);
  if (!station) return;
  const path = pathfind(world.walk, world.w, world.h, actor, station, blockedSet(world));
  if (!path) return;
  actor.stranded = false;
  actor.activityId = beat.activityId;
  beginTransit(world, actor, station.id, "work");
}

function snapFallback(world: World, actor: ActorState, why: string): void {
  const fb = stationMap(world.hub).get(world.hub.fallbackId);
  const origin = fb ?? { x: actor.x, y: actor.y };
  const taken = new Set(world.actors.filter((a) => a !== actor && a.mode !== "vacant").map((a) => cellKey(a)));
  const cell = nearestOpen(world.walk, world.w, world.h, origin, blockedSet(world), taken) ?? origin;
  actor.x = cell.x;
  actor.y = cell.y;
  actor.path = [];
  actor.mode = "work";
  actor.activityId = "mind-the-post";
  actor.activityTick = 0;
  actor.stepTick = 0;
  actor.blockedTicks = 0;
  actor.stranded = true;
  actor.goalStationId = fb?.id ?? actor.goalStationId;
  actor.arriveMode = "work";
  pushLog(world, { tick: world.tick, actorId: actor.actorId, kind: "recovery", text: why });
}

function blockedSet(world: World): Set<string> {
  const set = new Set<string>();
  for (const block of world.ephemeral) {
    for (const cell of block.cells) set.add(cellKey(cell));
  }
  return set;
}

function isOpen(world: World, cell: Cell): boolean {
  if (cell.x < 0 || cell.y < 0 || cell.y >= world.h || cell.x >= world.w) return false;
  if (!world.walk[cell.y]?.[cell.x]) return false;
  return !blockedSet(world).has(cellKey(cell));
}

function refreshAll(world: World): void {
  for (const actor of world.actors) refreshAvailability(world, actor);
}

function refreshAvailability(world: World, actor: ActorState): void {
  if (actor.mode === "vacant") {
    actor.available = false;
    actor.availability = "vacant post";
    return;
  }
  if (actor.talking) {
    actor.available = true;
    actor.availability = "speaking";
    return;
  }
  const ov = world.overrides.find((o) => o.id === actor.overrideId);
  if (ov?.blocksTalk) {
    actor.available = false;
    actor.availability = "quest holds their attention";
    return;
  }
  const station = world.hub.stations.find((s) => s.x === actor.x && s.y === actor.y);
  if (!station) {
    actor.available = true;
    actor.availability = "between posts — they will stop";
    return;
  }
  if (station.public) {
    actor.available = true;
    actor.availability = `at ${station.name}`;
    return;
  }
  actor.available = false;
  actor.availability = `private — ${station.name}`;
}

export function requestTalk(world: World, actorId: string, essential: boolean): TalkResult {
  const actor = world.actors.find((a) => a.actorId === actorId);
  if (!actor) {
    return { ok: false, waitTicks: 0, vacant: false, line: "No one is bound to that id.", reason: "missing" };
  }
  if (actor.mode === "vacant") {
    return { ok: true, waitTicks: 0, vacant: true, line: vacantLine(actor.roleId), reason: "vacant post" };
  }
  const station = world.hub.stations.find((s) => s.x === actor.x && s.y === actor.y);
  const ov = world.overrides.find((o) => o.id === actor.overrideId);
  const activity = world.activities[actor.activityId];
  const label = activity?.label ?? actor.activityId;

  if (!essential && ov?.blocksTalk) {
    return {
      ok: false,
      waitTicks: 0,
      vacant: false,
      line: `${actor.spokenName} is held by ${ov.questId}. A polite interruption waits on the quest, not on the clock.`,
      reason: "quest-held",
    };
  }
  if (!essential && station && !station.public) {
    const routine = routineMap(world.hub).get(actor.routineId);
    const beat = routine?.steps[actor.stepIndex];
    const remain = beat ? Math.max(0, beat.ticks - actor.stepTick) : 0;
    return {
      ok: false,
      waitTicks: remain,
      vacant: false,
      line: `${actor.spokenName} is at ${station.name}, a private post. The beat has ${remain} tick${remain === 1 ? "" : "s"} left — not a long wait, and an essential word does not wait at all.`,
      reason: "private post",
    };
  }

  actor.talking = true;
  actor.available = true;
  actor.availability = "speaking";
  pushLog(world, {
    tick: world.tick,
    actorId: actor.actorId,
    kind: "talk",
    text: essential ? `${actor.spokenName} answers at once.` : `${actor.spokenName} looks up from ${label}.`,
  });
  return {
    ok: true,
    waitTicks: 0,
    vacant: false,
    line: workLine(actor, label),
    reason: essential ? "essential" : "available",
  };
}

export function endTalk(world: World, actorId: string): void {
  const actor = world.actors.find((a) => a.actorId === actorId);
  if (!actor) return;
  actor.talking = false;
  refreshAvailability(world, actor);
}

export function addEphemeral(world: World, block: EphemeralBlock): void {
  world.ephemeral = world.ephemeral.filter((b) => b.id !== block.id).concat(block);
  const set = blockedSet(world);
  for (const actor of world.actors) {
    if (actor.mode === "vacant") continue;
    const standingBlocked = set.has(cellKey(actor));
    const pathHits = actor.path.some((c) => set.has(cellKey(c)));
    if (standingBlocked) {
      snapFallback(world, actor, "They were standing where the way closed.");
      continue;
    }
    if (pathHits) actor.path = [];
  }
  refreshAll(world);
}

export function clearEphemeral(world: World, id?: string): void {
  world.ephemeral = id ? world.ephemeral.filter((b) => b.id !== id) : [];
}

export function saveWorld(world: World): SaveBlob {
  return {
    version: 1,
    hubId: world.hubId,
    eraId: world.eraId,
    tick: world.tick,
    actors: structuredClone(world.actors),
    rejected: structuredClone(world.rejected),
    overrides: structuredClone(world.overrides),
    suppressed: structuredClone(world.suppressed),
    ephemeral: structuredClone(world.ephemeral),
    log: structuredClone(world.log),
  };
}

export function loadWorld(blob: SaveBlob, catalog: Catalog = defaultCatalog()): World {
  const hub = catalog.hubs[blob.hubId];
  if (!hub) {
    throw new Error(`Unknown hub ${blob.hubId}`);
  }
  const world: World = {
    version: 1,
    hubId: blob.hubId,
    eraId: blob.eraId,
    tick: blob.tick,
    w: hub.w,
    h: hub.h,
    walk: compileWalk(hub),
    actors: structuredClone(blob.actors),
    rejected: structuredClone(blob.rejected),
    overrides: structuredClone(blob.overrides),
    suppressed: structuredClone(blob.suppressed),
    ephemeral: structuredClone(blob.ephemeral),
    log: structuredClone(blob.log),
    hub,
    activities: catalog.activities,
  };
  for (const actor of world.actors) {
    if (actor.mode === "vacant") continue;
    const onBlocked = !isOpen(world, actor);
    const goal = stationMap(hub).get(actor.goalStationId);
    if (onBlocked || (actor.goalStationId && !goal && !actor.stranded)) {
      snapFallback(world, actor, "Loaded off a closed cell or a missing station.");
    }
  }
  refreshAll(world);
  return world;
}

export function stateHash(world: World): string {
  const body = [
    String(world.tick),
    world.eraId,
    world.hubId,
    ...world.actors.map((a) =>
      [
        a.actorId,
        a.x,
        a.y,
        a.mode,
        a.stepIndex,
        a.stepTick,
        a.activityId,
        a.activityTick,
        a.overrideId ?? "",
        a.talking ? 1 : 0,
        a.stranded ? 1 : 0,
        a.facing,
        a.goalStationId,
        a.path.map((p) => `${p.x}.${p.y}`).join(">"),
      ].join(","),
    ),
    ...world.suppressed.map((s) => `${s.overrideId}:${s.reason}:${s.winnerId ?? ""}`),
    ...world.rejected.map((r) => `${r.bindingId}:${r.reason}`),
  ].join("|");
  return fnv1a(body);
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function pushLog(world: World, event: WorldEvent): void {
  world.log.push(event);
  if (world.log.length > LOG_CAP) world.log.splice(0, world.log.length - LOG_CAP);
}

export function stationOf(world: World, id: string) {
  return world.hub.stations.find((s) => s.id === id) ?? null;
}

export function actorCells(world: World): Cell[] {
  return world.actors.map((a) => ({ x: a.x, y: a.y }));
}

/** Map + routine integrity for the three plates. */
export function validateHub(hub: HubDef, activities: Record<string, ActivityDef>): string[] {
  const errors: string[] = [];
  const walk = compileWalk(hub);
  const stations = stationMap(hub);
  const fb = stations.get(hub.fallbackId);
  if (!fb) errors.push(`${hub.id}: missing fallback ${hub.fallbackId}`);
  for (const station of hub.stations) {
    if (!walk[station.y]?.[station.x]) errors.push(`${hub.id}: station ${station.id} is not walkable`);
  }
  const ids = new Set<string>();
  for (const station of hub.stations) {
    if (ids.has(station.id)) errors.push(`${hub.id}: duplicate station ${station.id}`);
    ids.add(station.id);
  }
  for (const routine of hub.routines) {
    if (routine.steps.length === 0) errors.push(`${hub.id}: empty routine ${routine.id}`);
    for (const beat of routine.steps) {
      if (beat.ticks > MAX_STEP_TICKS) errors.push(`${hub.id}: ${routine.id} beat longer than ${MAX_STEP_TICKS}`);
      if (beat.ticks < 1) errors.push(`${hub.id}: ${routine.id} beat has no ticks`);
      if (!activities[beat.activityId]) errors.push(`${hub.id}: unknown activity ${beat.activityId}`);
      const station = stations.get(beat.stationId);
      if (!station) {
        errors.push(`${hub.id}: ${routine.id} missing station ${beat.stationId}`);
        continue;
      }
      if (fb) {
        const path = pathfind(walk, hub.w, hub.h, station, fb, new Set());
        if (!path) errors.push(`${hub.id}: no path from ${beat.stationId} to fallback`);
      }
    }
  }
  for (const binding of hub.bindings) {
    if (!hub.routines.some((r) => r.id === binding.routineId)) {
      errors.push(`${hub.id}: binding ${binding.bindingId} missing routine`);
    }
    if (!stations.has(binding.homeStationId)) {
      errors.push(`${hub.id}: binding ${binding.bindingId} missing home`);
    }
  }
  return errors;
}
