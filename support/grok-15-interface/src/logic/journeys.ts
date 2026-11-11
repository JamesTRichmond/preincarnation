import { DEV_CATALOG, DEV_SOURCE_LABEL } from "../catalog.ts";
import { ashBarLife, defaultSettings, fixtureSlots, withCompletion } from "../fixtures.ts";
import type { Action, SessionState } from "./session.ts";
import {
  createSession,
  discoveredPlaces,
  reduce,
  settle,
  topScreen,
  visibleEvidence,
} from "./session.ts";

export interface JourneyBeat {
  id: string;
  prompt: string;
  done: (state: SessionState) => boolean;
}

export interface Journey {
  id: "new-life" | "continue" | "pause" | "county" | "afterward";
  title: string;
  summary: string;
  start: SessionState;
  actions: Action[];
  beats: JourneyBeat[];
}

const base = () =>
  createSession({
    slots: fixtureSlots(),
    settings: defaultSettings(),
    catalog: DEV_CATALOG,
    simulateField: true,
    source: "dev-fixture",
    sourceLabel: DEV_SOURCE_LABEL,
  });

function withField(slotId: string, snapshot = ashBarLife()): SessionState {
  const start = base();
  return {
    ...start,
    stack: ["field"],
    focusId: "",
    gameplay: structuredClone(snapshot),
    activeSlotId: slotId,
    frozen: null,
    slots: start.slots.map((slot) =>
      slot.id === slotId
        ? { id: slotId, occupied: true, damaged: false, snapshot: structuredClone(snapshot) }
        : slot,
    ),
  };
}

function intent(dir: "up" | "down" | "left" | "right" | "confirm" | "cancel" | "pause"): Action {
  if (dir === "confirm" || dir === "cancel" || dir === "pause") return { type: "intent", intent: { type: dir } };
  return { type: "intent", intent: { type: "move", dir } };
}

function point(id: string): Action {
  return { type: "pointer", id, kind: "activate" };
}

/** Keyboard-only path to a focus id, paging through long text on the way. */
function seek(state: SessionState, id: string): { state: SessionState; actions: Action[] } {
  const actions: Action[] = [];
  let current = state;
  for (let step = 0; step < 40 && current.focusId !== id; step += 1) {
    const before = `${current.focusId}:${current.scrolls[current.focusId] ?? 0}`;
    const next = settle(reduce(current, intent("down")));
    actions.push(intent("down"));
    if (`${next.focusId}:${next.scrolls[next.focusId] ?? 0}` === before && next.focusId === current.focusId) {
      break;
    }
    current = next;
  }
  if (current.focusId !== id) {
    throw new Error(`Could not reach ${id} from ${state.focusId}; stopped on ${current.focusId}`);
  }
  return { state: current, actions };
}

export function traceJourney(start: SessionState, actions: Action[]): SessionState[] {
  const states: SessionState[] = [start];
  let state = start;
  for (const action of actions) {
    state = reduce(state, action);
    states.push(state);
    const settled = settle(state);
    if (settled !== state) {
      state = settled;
      states.push(state);
    }
  }
  return states;
}

export function journeyBeatsMet(journey: Journey): { ok: boolean; missing: string[] } {
  const states = traceJourney(journey.start, journey.actions);
  const missing = journey.beats.filter((beat) => !states.some((state) => beat.done(state))).map((beat) => beat.id);
  return { ok: missing.length === 0, missing };
}

function newLife(): Journey {
  const start = base();
  const actions: Action[] = [];
  let state = start;
  const take = (action: Action) => {
    actions.push(action);
    state = settle(reduce(state, action));
  };
  take(intent("confirm"));
  const toEmpty = seek(state, "slot-3");
  actions.push(...toEmpty.actions);
  state = toEmpty.state;
  take(intent("confirm"));
  const toBegin = seek(state, "begin");
  actions.push(...toBegin.actions);
  state = toBegin.state;
  take(intent("confirm"));
  take(intent("pause"));
  take(point("evidence"));
  take(point("back"));
  take(point("bottles"));
  take(point("back"));
  take(point("resume"));

  return {
    id: "new-life",
    title: "New life",
    summary: "Open a blank page, read who you are, and step onto the bank.",
    start,
    actions,
    beats: [
      {
        id: "blank-page",
        prompt: "Choose New life, then the blank page.",
        done: (session) => topScreen(session) === "character" && session.draftSlotId === "slot-3",
      },
      {
        id: "sheet",
        prompt: "Read the background, the bond, the ideal, and the flaw.",
        done: (session) => topScreen(session) === "character" && session.focusId === "flaw",
      },
      {
        id: "begun",
        prompt: "Begin. The life starts at Lark Ferry with the lantern and an empty brace.",
        done: (session) =>
          topScreen(session) === "field" &&
          session.gameplay?.returnIndex === 1 &&
          session.gameplay.placeId === "ferry" &&
          session.gameplay.ownedToolIds.length === 1 &&
          session.gameplay.bottles.length === 0 &&
          session.frozen === null,
      },
      {
        id: "empty-journal",
        prompt: "Open evidence. A new life has no notes yet.",
        done: (session) => topScreen(session) === "journal" && (session.gameplay?.evidence.length ?? 0) === 0,
      },
      {
        id: "empty-bottles",
        prompt: "Open bottles. The brace is empty.",
        done: (session) => topScreen(session) === "bottles" && (session.gameplay?.bottles.length ?? 0) === 0,
      },
      {
        id: "ground-kept",
        prompt: "Resume. The bank has not moved.",
        done: (session) =>
          topScreen(session) === "field" &&
          session.lastResume?.positionHeld === true &&
          session.lastResume.timeHeld === true,
      },
    ],
  };
}

function continueLife(): Journey {
  const start = base();
  const actions: Action[] = [];
  let state = start;
  const take = (action: Action) => {
    actions.push(action);
    state = settle(reduce(state, action));
  };
  const toContinue = seek(state, "continue");
  actions.push(...toContinue.actions);
  state = toContinue.state;
  take(intent("confirm"));
  const toTorn = seek(state, "slot-2");
  actions.push(...toTorn.actions);
  state = toTorn.state;
  take(intent("confirm"));
  take(intent("cancel"));
  const toGood = seek(state, "slot-1");
  actions.push(...toGood.actions);
  state = toGood.state;
  take(intent("confirm"));
  take(intent("pause"));
  take(point("returns"));

  return {
    id: "continue",
    title: "Continue",
    summary: "A torn page fails honestly. The intact life resumes with its years intact.",
    start,
    actions,
    beats: [
      {
        id: "torn",
        prompt: "Continue, and try the torn page.",
        done: (session) => topScreen(session) === "error" && (session.loadError ?? "").includes("ink"),
      },
      {
        id: "loading",
        prompt: "The page is turning before it can be read.",
        done: (session) => topScreen(session) === "loading" && session.pending !== null,
      },
      {
        id: "resumed",
        prompt: "Leave the torn page and continue Ash Bar.",
        done: (session) =>
          topScreen(session) === "field" &&
          session.gameplay?.returnIndex === 4 &&
          session.gameplay.eraId === "quiet" &&
          session.gameplay.hearts.current === 4 &&
          session.gameplay.position.x === 48,
      },
      {
        id: "history",
        prompt: "Open returns and see the lives already closed.",
        done: (session) => topScreen(session) === "history" && (session.gameplay?.history.length ?? 0) === 4,
      },
    ],
  };
}

function pauseLife(): Journey {
  const start = withField("slot-1");
  const actions: Action[] = [];
  let state = start;
  const take = (action: Action) => {
    actions.push(action);
    state = settle(reduce(state, action));
  };
  take(intent("pause"));
  take(point("tools"));
  take(point("tool-hook"));
  take(point("back"));
  take(point("quick"));
  take(point("qslot-2"));
  take(point("qtool-lens"));
  take(point("back"));
  take(point("bottles"));
  take(point("bottle-b-spring"));
  take(point("modal-yes"));
  take(point("back"));
  take(point("kept"));
  take(point("back"));
  take(point("settings"));
  take(intent("left"));
  take(point("back"));
  take(point("resume"));

  return {
    id: "pause",
    title: "Pause and keep your ground",
    summary: "Change a tool, a belt loop, a sip, and the music. The place you stood does not move.",
    start,
    actions,
    beats: [
      {
        id: "frozen",
        prompt: "Pause. The life clock and the ground are held.",
        done: (session) =>
          session.frozen !== null &&
          session.frozen.position.x === 48 &&
          session.frozen.position.y === 22 &&
          session.frozen.playSeconds === 4820 &&
          topScreen(session) === "pause",
      },
      {
        id: "armed",
        prompt: "Put the grapple hook in hand and the lens on belt 3.",
        done: (session) =>
          session.gameplay?.activeToolId === "lens" && session.gameplay.quickSlots[2] === "lens",
      },
      {
        id: "sipped",
        prompt: "Drink one sip of spring water.",
        done: (session) => session.gameplay?.hearts.current === 5 && session.gameplay.bottles[0]?.sips === 1,
      },
      {
        id: "kept-upgrades",
        prompt: "Look at what already came back with you. Nothing is for sale.",
        done: (session) => topScreen(session) === "upgrades" && (session.gameplay?.upgradeIds.length ?? 0) > 0,
      },
      {
        id: "resumed",
        prompt: "Resume. Position, era, and the life clock match the moment you paused.",
        done: (session) =>
          topScreen(session) === "field" &&
          session.frozen === null &&
          session.lastResume?.positionHeld === true &&
          session.lastResume.timeHeld === true &&
          session.lastResume.eraHeld === true &&
          session.lastResume.placeHeld === true &&
          session.gameplay?.position.x === 48 &&
          session.gameplay.position.y === 22 &&
          session.gameplay.playSeconds === 4820 &&
          session.settings.music === 5,
      },
    ],
  };
}

function countyLife(): Journey {
  const start = withField("slot-1");
  const actions: Action[] = [];
  let state = start;
  const take = (action: Action) => {
    actions.push(action);
    state = settle(reduce(state, action));
  };
  take(intent("pause"));
  take(point("county"));
  take(point("place-archive"));
  take(point("back"));
  take(point("back"));
  take(point("evidence"));
  take(point("filter-loose"));
  take(point("entry-shelf"));
  take(point("back"));
  take(point("filter-all"));
  take(point("entry-coat-thread"));
  take(intent("down"));

  return {
    id: "county",
    title: "County and evidence",
    summary: "The book shows where you have stood, and the notes you actually hold.",
    start,
    actions,
    beats: [
      {
        id: "only-walked",
        prompt: "Open the county. Only places you have stood in are listed.",
        done: (session) => {
          if (topScreen(session) !== "map") return false;
          const ids = discoveredPlaces(session).map((place) => place.id);
          return ids.length === 6 && !ids.includes("glassworks");
        },
      },
      {
        id: "place",
        prompt: "Read a place you have already entered.",
        done: (session) => topScreen(session) === "place" && session.selectedPlaceId === "archive",
      },
      {
        id: "loose",
        prompt: "Filter the journal to notes not yet inked.",
        done: (session) =>
          topScreen(session) === "journal" &&
          session.journalFilter === "loose" &&
          visibleEvidence(session).some((entry) => entry.id === "shelf"),
      },
      {
        id: "long-note",
        prompt: "Open the long note and move through its pages.",
        done: (session) =>
          topScreen(session) === "entry" &&
          session.selectedEntryId === "coat-thread" &&
          (session.scrolls.entry ?? 0) > 0,
      },
    ],
  };
}

function afterward(): Journey {
  const slots = fixtureSlots();
  const finished = withCompletion(ashBarLife(), "kept-name");
  slots[0] = { id: "slot-1", occupied: true, damaged: false, snapshot: finished };
  const start = createSession({
    slots,
    settings: defaultSettings(),
    catalog: DEV_CATALOG,
    simulateField: true,
    source: "dev-fixture",
    sourceLabel: DEV_SOURCE_LABEL,
  });
  const actions: Action[] = [];
  let state = start;
  const take = (action: Action) => {
    actions.push(action);
    state = settle(reduce(state, action));
  };
  const toAfter = seek(state, "afterward");
  actions.push(...toAfter.actions);
  state = toAfter.state;
  take(intent("confirm"));
  take(point("ending-kept-name"));
  take(point("back"));
  take(point("ending-open-gate"));
  take(point("to-credits"));
  take(intent("down"));
  take(point("back"));
  take(point("to-county"));
  take(point("back"));
  take(point("to-title"));

  return {
    id: "afterward",
    title: "After the last return",
    summary: "Read the life you set down, the names, and the county — then leave the page where it was.",
    start,
    actions,
    beats: [
      {
        id: "menu",
        prompt: "Open Afterward from the title.",
        done: (session) => topScreen(session) === "ending" && session.gameplay?.completion?.endingId === "kept-name",
      },
      {
        id: "epitaph",
        prompt: "Read The Kept Name.",
        done: (session) => topScreen(session) === "epitaph" && session.selectedEndingId === "kept-name",
      },
      {
        id: "sealed",
        prompt: "Another ending stays shut.",
        done: (session) => (session.notice ?? "").includes("stay shut"),
      },
      {
        id: "credits",
        prompt: "Read the names and turn the page.",
        done: (session) => topScreen(session) === "credits" && (session.scrolls.credits ?? 0) > 0,
      },
      {
        id: "county-review",
        prompt: "Review the county you already walked. Nothing new is marked.",
        done: (session) => {
          if (topScreen(session) !== "map") return false;
          const ids = discoveredPlaces(session).map((place) => place.id);
          return !ids.includes("glassworks") && ids.includes("archive");
        },
      },
      {
        id: "title-kept",
        prompt: "Return to the title. The finished page is still in the book.",
        done: (session) =>
          topScreen(session) === "title" &&
          session.slots[0]?.snapshot?.completion?.endingId === "kept-name" &&
          session.slots[0]?.snapshot?.position.x === 48 &&
          session.slots[0]?.snapshot?.playSeconds === 4820,
      },
    ],
  };
}

let cached: Journey[] | null = null;

export function journeys(): Journey[] {
  if (!cached) cached = [newLife(), continueLife(), pauseLife(), countyLife(), afterward()];
  return cached;
}

export function journeyById(id: Journey["id"]): Journey {
  const found = journeys().find((journey) => journey.id === id);
  if (!found) throw new Error(`Unknown journey ${id}`);
  return found;
}
