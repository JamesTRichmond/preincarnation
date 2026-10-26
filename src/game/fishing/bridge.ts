import type { Actions as GameActions } from "../input.ts";
import type { MapId } from "../types.ts";
import { GEAR, GEAR_BY_ID } from "./data/gear.ts";
import { LOCATIONS, LOCATIONS_BY_ID } from "./data/locations.ts";
import { resolveCatch, rewardKey } from "./sim/catch.ts";
import { sanitizeSession } from "./sim/save.ts";
import {
  applyFocusLoss,
  castAgain,
  chooseGear,
  chooseLocation,
  chooseSpot,
  createSession,
  keepFish,
  liftLine,
  openWaters,
  releaseFish,
  resumeSession,
  stepSession,
  swapFish,
} from "./sim/session.ts";
import type { Actions as FishActions, FishingReward, Phase, Session } from "./sim/types.ts";

/** Wrapped inside the life save. Version 1 is the creek trip, not the life. */
export type CreekBlob = { version: 1; session: Session };

const ACTIVE = new Set<Phase>(["charging", "flight", "present", "bite", "fight", "landed"]);

const MAP_WATER: Partial<Record<MapId, string>> = {
  bristol: "new-haven-pocket",
  middlebury: "middlebury-evening",
  vergennes: "vergennes-pool",
  ferrisburgh: "little-otter-mouth",
  addison: "dead-creek-weeds",
  salisbury: "dunmore-cove",
  shelburne: "lemon-fair-dusk",
  burlington: "arnold-bay",
  winooski: "otter-seam",
  essex: "otter-lily",
};

export function waterForMap(mapId: MapId): string {
  return MAP_WATER[mapId] ?? "town-hole";
}

export function readCreek(value: unknown): Session | null {
  return sanitizeSession(value);
}

export function creekBlob(session: Session): CreekBlob {
  return { version: 1, session };
}

/** The body fails. Notes stay. Fish in the creel do not cross the fourteen winters. */
export function spoilCatch(value: unknown): CreekBlob | null {
  const session = sanitizeSession(value);
  if (!session) return null;
  session.save = {
    ...session.save,
    creel: [],
    rewardQueue: session.save.rewardQueue.filter((reward) => reward.kind !== "food"),
  };
  session.phase = "resolved";
  session.fight = null;
  session.bite = null;
  session.pending = null;
  if (session.cast) session.cast = { ...session.cast, phase: "idle", power: 0, flight: 0 };
  session.paused = false;
  session.pauseReason = null;
  session.line = "The water kept the fish. The notes stayed.";
  return creekBlob(session);
}

export function arriveAtWater(session: Session, mapId: MapId, hour: number): void {
  if (ACTIVE.has(session.phase)) {
    session.paused = false;
    session.pauseReason = null;
    return;
  }
  const id = waterForMap(mapId);
  const loc = LOCATIONS_BY_ID[id] ?? LOCATIONS_BY_ID["town-hole"];
  const hourNow = ((Math.round(hour) % 24) + 24) % 24;
  if (GEAR_BY_ID[loc.outfit]) session.gearId = loc.outfit;
  session.paused = false;
  session.pauseReason = null;
  chooseLocation(session, loc.id);
  const sweet = loc.spots.find((spot) => spot.sweet) ?? loc.spots[0];
  chooseSpot(session, sweet.id);
  session.hour = hourNow;
  session.line = `${loc.name}. Hold to cast. Esc leaves. Y is the book.`;
}

export type CreekPanel = "notes" | "waters" | null;

export type CreekCue = "cast" | "hook" | "land" | "lose" | null;

export type CreekStep = {
  cue: CreekCue;
  regard: number;
  line: string | null;
};

type Edges = {
  interact: boolean;
  attack: boolean;
  cycle: boolean;
  item: boolean;
  use: boolean;
  bomb: boolean;
};

const QUIET: Edges = { interact: false, attack: false, cycle: false, item: false, use: false, bomb: false };

export function createCreekPilot() {
  let session: Session | null = null;
  let panel: CreekPanel = null;
  let waterIndex = 0;
  let page = 0;
  let prevG = false;
  let scrollWait = 0;
  let bound: GameActions | null = null;
  let used: Edges = { ...QUIET };

  const bind = (actions: GameActions) => {
    if (actions === bound) return;
    bound = actions;
    used = { ...QUIET };
  };

  const once = (actions: GameActions, key: keyof Edges, down: boolean) => {
    bind(actions);
    if (!down || used[key]) return false;
    used[key] = true;
    return true;
  };

  const bankRegard = () => {
    if (!session) return 0;
    let regard = 0;
    const drained = new Set(session.save.drainedIds);
    const queue: FishingReward[] = [];
    for (const reward of session.save.rewardQueue) {
      const key = rewardKey(reward);
      if (drained.has(key)) continue;
      if (reward.kind === "regard") {
        drained.add(key);
        regard += 1;
        continue;
      }
      if (reward.kind === "journal") {
        drained.add(key);
        continue;
      }
      queue.push(reward);
    }
    session.save = { ...session.save, rewardQueue: queue, drainedIds: [...drained] };
    return regard;
  };

  return {
    session: () => session,
    panel: () => panel,
    waterIndex: () => waterIndex,
    page: () => page,
    aimX: () => session?.aimX ?? null,

    load(value: unknown) {
      session = readCreek(value);
      panel = null;
    },

    forget() {
      session = null;
      panel = null;
    },

    blob(): CreekBlob | null {
      return session ? creekBlob(session) : null;
    },

    enter(mapId: MapId, hour: number, reducedMotion: boolean) {
      if (!session) session = createSession(((Date.now() ^ 0x9e3779b9) >>> 0) || 1);
      session.reducedMotion = reducedMotion;
      panel = null;
      arriveAtWater(session, mapId, hour);
      const id = session.locationId;
      const index = LOCATIONS.findIndex((loc) => loc.id === id);
      if (index >= 0) waterIndex = index;
    },

    hide() {
      if (!session) return;
      applyFocusLoss(session);
      if (session.phase === "fight" || session.phase === "bite" || session.phase === "present") {
        session.line = "The creek holds still.";
      }
    },

    /** Esc. Close the book first. A fish still in the net must be kept or put back. */
    onPause(): boolean {
      if (!session) return false;
      if (panel) {
        panel = null;
        return true;
      }
      if (session.phase === "waters") {
        castAgain(session);
        session.line = "Same water.";
        return true;
      }
      if (session.phase === "landed") {
        session.line = "Space keeps it. E puts it back.";
        return true;
      }
      return false;
    },

    abandon() {
      if (!session) return;
      if (
        session.pending &&
        !session.save.resolvedIds.includes(session.pending.id) &&
        (session.phase === "fight" || session.phase === "bite" || session.phase === "flight" || session.phase === "present")
      ) {
        const lost = resolveCatch(session.save, session.pending, "lost");
        if (lost.ok) session.save = lost.save;
      }
      session.pending = null;
      session.fight = null;
      session.bite = null;
      session.phase = "resolved";
      session.paused = false;
      session.line = "You left the bank.";
      panel = null;
    },

    eat(): string | null {
      if (!session) return null;
      const food = session.save.rewardQueue.find(
        (reward) => reward.kind === "food" && !session!.save.drainedIds.includes(rewardKey(reward)),
      );
      if (!food || food.kind !== "food") return null;
      const key = rewardKey(food);
      session.save = {
        ...session.save,
        rewardQueue: session.save.rewardQueue.filter((reward) => rewardKey(reward) !== key),
        drainedIds: [...session.save.drainedIds, key],
        creel: session.save.creel.filter((fish) => fish.id !== food.catchId),
      };
      session.dirty = true;
      return food.meal;
    },

    /** One meal per press. Undefined if this actions object was already handled. */
    tryEat(actions: GameActions): string | null | undefined {
      if (!once(actions, "use", actions.usePressed)) return undefined;
      return this.eat();
    },

    step(dt: number, actions: GameActions, keys: { has(code: string): boolean }, hour: number): CreekStep {
      const empty: CreekStep = { cue: null, regard: 0, line: null };
      if (!session) return empty;
      if (session.paused) {
        if (once(actions, "interact", actions.interactPressed) || once(actions, "attack", actions.attackPressed)) {
          resumeSession(session);
          session.line = "The water moves again.";
        }
        return empty;
      }

      const gDown = keys.has("KeyG");
      const giveEdge = once(actions, "bomb", actions.bombPressed) || (gDown && !prevG);
      prevG = gDown;

      if (once(actions, "item", actions.itemPressed)) {
        panel = panel ? null : "notes";
        return empty;
      }

      if (panel) {
        const dy = actions.moveY;
        scrollWait = Math.max(0, scrollWait - dt);
        let dir = 0;
        if (Math.abs(dy) < 0.4) scrollWait = 0;
        else if (scrollWait <= 0) {
          scrollWait = 0.18;
          dir = dy < 0 ? -1 : 1;
        }
        if (once(actions, "cycle", actions.cyclePressed)) {
          panel = panel === "notes" ? "waters" : "notes";
        }
        if (panel === "waters") {
          if (dir !== 0) waterIndex = (waterIndex + dir + LOCATIONS.length) % LOCATIONS.length;
          if (once(actions, "interact", actions.interactPressed) || once(actions, "attack", actions.attackPressed)) {
            const loc = LOCATIONS[waterIndex];
            chooseLocation(session, loc.id);
            const sweet = loc.spots.find((spot) => spot.sweet) ?? loc.spots[0];
            chooseSpot(session, sweet.id);
            session.hour = ((Math.round(hour) % 24) + 24) % 24;
            session.line = `${loc.name}. ${loc.challenge}`;
            panel = null;
          }
        } else {
          const pages = Math.max(1, Math.ceil(Object.keys(session.save.journal).length / 4));
          if (dir !== 0) page = (page + dir + pages) % pages;
          if (once(actions, "interact", actions.interactPressed)) panel = null;
        }
        return empty;
      }

      if (session.phase === "waters") {
        openWaters(session);
        panel = "waters";
        return empty;
      }

      if (session.phase === "landed") {
        if (once(actions, "attack", actions.attackPressed)) {
          const result = keepFish(session);
          if (!result.ok && result.reason === "creel-full") {
            session.line = "Creel is full. Q sets the oldest back. E puts this one back.";
          }
        } else if (once(actions, "interact", actions.interactPressed)) {
          releaseFish(session);
        } else if (once(actions, "cycle", actions.cyclePressed) && session.pending && session.save.creel[0]) {
          swapFish(session, session.save.creel[0].id);
        }
        const regard = bankRegard();
        return { cue: null, regard, line: null };
      }

      if (session.phase === "resolved") {
        if (once(actions, "attack", actions.attackPressed)) castAgain(session);
        return { cue: null, regard: bankRegard(), line: null };
      }

      const live = session;
      if (
        live &&
        once(actions, "cycle", actions.cyclePressed) &&
        live.phase !== "fight" &&
        live.phase !== "bite" &&
        live.phase !== "flight" &&
        live.phase !== "charging"
      ) {
        const index = GEAR.findIndex((gear) => gear.id === live.gearId);
        const next = GEAR[(index + 1) % GEAR.length];
        chooseGear(live, next.id);
        live.line = `${next.name}. ${next.summary}`;
      }

      if (session.phase === "present" && once(actions, "interact", actions.interactPressed)) {
        liftLine(session);
      }

      const phase = session.phase;
      const fish: FishActions = {
        ax: actions.moveX,
        ay: actions.moveY,
        castHeld: actions.attack && (phase === "aiming" || phase === "charging" || phase === "read"),
        hookHeld: actions.attack && phase === "bite",
        pressureHeld: actions.attack && phase === "fight",
        giveToggle: giveEdge && phase === "fight",
        cancel: once(actions, "interact", actions.interactPressed) && (phase === "charging" || phase === "flight"),
        confirm: false,
      };
      // A is negative moveX and decreases aimX. W is negative moveY and decreases aimY (farther water).
      const before = session.phase;
      stepSession(session, dt, fish);
      const regard = bankRegard();
      const after = session.phase as Phase;
      let cue: CreekCue = null;
      if (before !== after) {
        if (after === "flight") cue = "cast";
        else if (after === "fight") cue = "hook";
        else if (after === "landed") cue = "land";
        else if (after === "resolved" && before === "fight") cue = "lose";
      }
      return { cue, regard, line: null };
    },
  };
}

export type CreekPilot = ReturnType<typeof createCreekPilot>;
