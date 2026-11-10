import { effectsConflict, type Catalog } from "./catalog.ts";
import {
  DUNGEON_IDS,
  ERAS,
  TUNING,
  emptyLoadout,
  fail,
  ok,
  type DeathCause,
  type GameMirror,
  type HostVerb,
  type Intent,
  type JournalEvent,
  type Loadout,
  type MasteryRecord,
  type MasteryState,
  type Result,
} from "./types.ts";

export function freshGame(): GameMirror {
  return {
    name: "Ellis Perch",
    year: 2026,
    lastDeed: "",
    incarnation: "wanderer",
    skillPoints: 3,
    karma: 0,
    host: "god",
    saveVersion: 8,
  };
}

export function freshState(game: GameMirror = freshGame()): MasteryState {
  return {
    version: 1,
    phase: "living",
    cycle: 0,
    lifeId: "life-1",
    lifeSerial: 1,
    witnessBank: 0,
    suicideStreak: 0,
    repeatPaid: {},
    escrow: [],
    claimedCampaign: [],
    claimedThisLife: [],
    meaningfulActs: 0,
    owned: {},
    loadout: emptyLoadout(),
    eraOpened: [],
    dungeonsOpened: [],
    lastDeathSite: null,
    lastDeathCause: null,
    respecsThisVisit: 0,
    journal: [],
    game,
  };
}

function sameStringList(a: string[], b: string[]) {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

function repeatTotal(state: MasteryState) {
  return Object.values(state.repeatPaid).reduce((sum, row) => sum + row.total, 0);
}

export function wealth(state: MasteryState) {
  return Object.values(state.owned).reduce((sum, row) => sum + row.costPaid, state.witnessBank);
}

function prereqsMet(state: MasteryState, record: MasteryRecord, catalog: Catalog): string | null {
  for (const id of record.requires) {
    if (!state.owned[id]) return `Requires ${catalog.byId.get(id)?.name ?? id}.`;
  }
  for (const sourceId of record.requiresSources) {
    const source = catalog.sourceById.get(sourceId);
    const paid =
      state.claimedCampaign.includes(sourceId) || (state.repeatPaid[sourceId]?.pays ?? 0) > 0;
    if (!paid) return `Requires ${source?.label ?? sourceId} to have been witnessed.`;
  }
  for (const era of record.requiresEras) {
    if (!state.eraOpened.includes(era)) return `Requires ${era} to be open.`;
  }
  for (const dungeon of record.requiresDungeons) {
    if (!state.dungeonsOpened.includes(dungeon)) return `Requires ${dungeon}.`;
  }
  return null;
}

export function blockCode(state: MasteryState, id: string, catalog: Catalog): string | null {
  const record = catalog.byId.get(id);
  if (!record) return "unknown";
  if (record.status !== "authored") return "unauthored";
  if (state.phase !== "afterlife") return "bad-phase";
  if (state.owned[id]) return "owned";
  if (record.bound) return "bound";
  if (prereqsMet(state, record, catalog)) return "prereq";
  if (state.witnessBank < record.cost) return "broke";
  return null;
}

export function purchaseBlock(state: MasteryState, id: string, catalog: Catalog): string | null {
  const record = catalog.byId.get(id);
  if (!record) return "Unknown record.";
  if (record.status !== "authored") return "Unwritten. This slot has no ability yet.";
  if (state.phase !== "afterlife") return "Spend Witness after death, not during the life.";
  if (state.owned[id]) return "Already owned.";
  if (record.bound) return "Bound records are given, not bought.";
  const pre = prereqsMet(state, record, catalog);
  if (pre) return pre;
  if (state.witnessBank < record.cost) return `Needs ${record.cost} Witness. Bank holds ${state.witnessBank}.`;
  return null;
}

function computeGrant(state: MasteryState, sourceId: string, catalog: Catalog): Result<{ amount: number; via: "bank" | "escrow" }> {
  if (state.phase !== "living") return fail("bad-phase", "Witness is earned in the county, not at the desk.");
  const source = catalog.sourceById.get(sourceId);
  if (!source) return fail("unknown-source", "That is not a registered source. Death is not a source.");
  if (state.claimedThisLife.includes(sourceId) || (source.repeat === "campaign" && state.claimedCampaign.includes(sourceId))) {
    return fail("duplicate", `${source.label} has already paid. It will not pay again.`);
  }
  if (source.repeat === "life") {
    if (state.suicideStreak > 0) {
      return fail("farm-streak", "A hollow streak is open. Repeatable encounters pay nothing until you die in the county.");
    }
    const prev = state.repeatPaid[sourceId] ?? { pays: 0, total: 0 };
    if (prev.pays >= TUNING.maxRepeatPaysPerSource) {
      return fail("repeat-exhausted", `${source.label} has paid its last time.`);
    }
    const decayed = Math.floor(source.amount * TUNING.repeatDecay ** prev.pays);
    const pending = state.escrow.reduce((sum, row) => sum + row.amount, 0);
    const room = TUNING.repeatCampaignCap - repeatTotal(state) - pending;
    if (decayed <= 0 || room <= 0) return fail("repeat-cap", "The repeatable purse is empty.");
    return ok({ amount: Math.min(decayed, room), via: "escrow" });
  }
  return ok({ amount: source.amount, via: "bank" });
}

function isHollow(state: MasteryState, cause: DeathCause) {
  return cause === "release" && state.meaningfulActs < TUNING.minMeaningfulForRelease;
}

function clearRecord(loadout: Loadout, id: string): Loadout {
  return {
    sockets: loadout.sockets.filter((slot) => slot !== id),
    tools: loadout.tools.filter((slot) => slot !== id),
    forms: loadout.forms.filter((slot) => slot !== id),
    vow: loadout.vow === id ? null : loadout.vow,
    capstone: loadout.capstone === id ? null : loadout.capstone,
  };
}

function refundableLeaves(state: MasteryState, catalog: Catalog) {
  const ownedIds = Object.keys(state.owned);
  return ownedIds.filter((id) => {
    const row = state.owned[id];
    if (!row || row.bound) return false;
    return !ownedIds.some((other) => other !== id && catalog.byId.get(other)?.requires.includes(id));
  });
}

function respecRefunds(state: MasteryState, catalog: Catalog) {
  const scratch: MasteryState = { ...state, owned: { ...state.owned } };
  const refunded: { id: string; amount: number }[] = [];
  for (;;) {
    const leaves = refundableLeaves(scratch, catalog).sort();
    if (!leaves.length) break;
    for (const id of leaves) {
      const row = scratch.owned[id];
      if (!row) continue;
      refunded.push({ id, amount: row.costPaid });
      const next = { ...scratch.owned };
      delete next[id];
      scratch.owned = next;
    }
  }
  return refunded;
}

function applyResolved(state: MasteryState, event: JournalEvent, catalog: Catalog): Result<MasteryState> {
  switch (event.t) {
    case "grant": {
      const computed = computeGrant(state, event.sourceId, catalog);
      if (!computed.ok) return computed;
      if (computed.value.amount !== event.amount || computed.value.via !== event.via || event.lifeId !== state.lifeId) {
        return fail("forged-event", "Grant does not match the source rules.");
      }
      const claimedThisLife = [...state.claimedThisLife, event.sourceId];
      if (event.via === "escrow") {
        return ok({
          ...state,
          claimedThisLife,
          escrow: [...state.escrow, { sourceId: event.sourceId, amount: event.amount }],
        });
      }
      return ok({
        ...state,
        claimedThisLife,
        claimedCampaign: [...state.claimedCampaign, event.sourceId],
        meaningfulActs: state.meaningfulActs + 1,
        witnessBank: state.witnessBank + event.amount,
      });
    }
    case "death": {
      if (state.phase !== "living") return fail("already-dead", "This life is already closed.");
      if (event.lifeId !== state.lifeId) return fail("life-mismatch", "Death names a different life.");
      if (event.cycle !== state.cycle + 1) return fail("cycle", "Cycle must advance by one. You cannot replay a death for pay.");
      if (!event.deathSiteKey.trim() || event.deathSiteKey.length > 80) return fail("bad-site", "Death site is missing.");
      const hollow = isHollow(state, event.cause);
      if (event.hollow !== hollow) return fail("forged-event", "Hollow flag does not match the life.");
      const paid = hollow ? 0 : state.escrow.reduce((sum, row) => sum + row.amount, 0);
      const paidSources = hollow ? [] : state.escrow.map((row) => row.sourceId);
      if (event.paid !== paid || !sameStringList(event.paidSources, paidSources)) {
        return fail("forged-event", "Death payout does not match escrow.");
      }
      const repeatPaid = { ...state.repeatPaid };
      if (!hollow) {
        for (const row of state.escrow) {
          const prev = repeatPaid[row.sourceId] ?? { pays: 0, total: 0 };
          repeatPaid[row.sourceId] = { pays: prev.pays + 1, total: prev.total + row.amount };
        }
      }
      const clearsStreak = !hollow && event.cause !== "release" && (state.meaningfulActs >= 1 || event.cause === "scripted");
      return ok({
        ...state,
        phase: "afterlife",
        cycle: event.cycle,
        suicideStreak: hollow ? state.suicideStreak + 1 : clearsStreak ? 0 : state.suicideStreak,
        witnessBank: state.witnessBank + paid,
        escrow: [],
        repeatPaid,
        lastDeathSite: event.deathSiteKey,
        lastDeathCause: event.cause,
        respecsThisVisit: 0,
      });
    }
    case "return": {
      if (state.phase !== "afterlife") return fail("bad-phase", "You are already in the county.");
      const expectedSerial = state.lifeSerial + 1;
      const expectedId = `life-${expectedSerial}`;
      if (event.nextLifeId !== expectedId || event.lifeSerial !== expectedSerial) {
        return fail("forged-event", "Return minted an unexpected life.");
      }
      return ok({
        ...state,
        phase: "living",
        lifeId: expectedId,
        lifeSerial: expectedSerial,
        claimedThisLife: [],
        meaningfulActs: 0,
        escrow: [],
        respecsThisVisit: 0,
      });
    }
    case "purchase": {
      const code = blockCode(state, event.id, catalog);
      if (code) return fail(code, purchaseBlock(state, event.id, catalog) ?? "Cannot buy that.");
      const record = catalog.byId.get(event.id)!;
      if (event.cost !== record.cost) return fail("forged-event", "Purchase cost does not match the record.");
      return ok({
        ...state,
        witnessBank: state.witnessBank - record.cost,
        owned: { ...state.owned, [record.id]: { costPaid: record.cost, bound: false } },
      });
    }
    case "grant-bound": {
      const record = catalog.byId.get(event.id);
      if (!record) return fail("unknown", "Unknown record.");
      if (!record.bound || record.status !== "authored") return fail("not-bound", "That record is not a bound gift.");
      if (state.owned[event.id]) return fail("owned", "Already owned.");
      const pre = prereqsMet(state, record, catalog);
      if (pre) return fail("prereq", pre);
      return ok({
        ...state,
        owned: { ...state.owned, [record.id]: { costPaid: 0, bound: true } },
      });
    }
    case "refund": {
      if (state.phase !== "afterlife") return fail("bad-phase", "Reconfigure after death.");
      const row = state.owned[event.id];
      if (!row) return fail("unowned", "You do not own that.");
      if (row.bound) return fail("bound", "A bound record stays.");
      if (!refundableLeaves(state, catalog).includes(event.id)) {
        return fail("orphan", "Something you still own depends on that.");
      }
      if (event.amount !== row.costPaid) return fail("forged-event", "Refund does not match what was paid.");
      const owned = { ...state.owned };
      delete owned[event.id];
      return ok({ ...state, owned, witnessBank: state.witnessBank + row.costPaid, loadout: clearRecord(state.loadout, event.id) });
    }
    case "respec": {
      if (state.phase !== "afterlife") return fail("bad-phase", "Respec at the desk, after death.");
      const refunded = respecRefunds(state, catalog);
      const got = [...event.refunded].sort((a, b) => a.id.localeCompare(b.id));
      const expect = [...refunded].sort((a, b) => a.id.localeCompare(b.id));
      if (got.length !== expect.length || got.some((row, i) => row.id !== expect[i]!.id || row.amount !== expect[i]!.amount)) {
        return fail("forged-event", "Respec refund does not match what can actually be returned.");
      }
      let next: MasteryState = { ...state, respecsThisVisit: state.respecsThisVisit + 1 };
      for (const row of refunded) {
        const owned = { ...next.owned };
        delete owned[row.id];
        next = {
          ...next,
          owned,
          witnessBank: next.witnessBank + row.amount,
          loadout: clearRecord(next.loadout, row.id),
        };
      }
      return ok(next);
    }
    case "open-era": {
      if (!(ERAS as readonly string[]).includes(event.era)) return fail("bad-era", "Unknown era.");
      if (state.eraOpened.includes(event.era)) return fail("duplicate", `${event.era} is already open.`);
      return ok({ ...state, eraOpened: [...state.eraOpened, event.era] });
    }
    case "open-dungeon": {
      if (!DUNGEON_IDS.includes(event.dungeon)) return fail("bad-dungeon", "Unknown dungeon.");
      if (state.dungeonsOpened.includes(event.dungeon)) return fail("duplicate", `${event.dungeon} is already open.`);
      return ok({ ...state, dungeonsOpened: [...state.dungeonsOpened, event.dungeon] });
    }
    default:
      return fail("unknown-event", "Unknown journal event.");
  }
}

export function commit(state: MasteryState, intent: Intent, catalog: Catalog): Result<MasteryState> {
  const resolved = resolveIntent(state, intent, catalog);
  if (!resolved.ok) return resolved;
  const next = applyResolved(state, resolved.value, catalog);
  if (!next.ok) return next;
  return ok({ ...next.value, journal: [...state.journal, resolved.value] });
}

function resolveIntent(state: MasteryState, intent: Intent, catalog: Catalog): Result<JournalEvent> {
  switch (intent.t) {
    case "grant": {
      const computed = computeGrant(state, intent.sourceId, catalog);
      if (!computed.ok) return computed;
      return ok({ t: "grant", sourceId: intent.sourceId, lifeId: state.lifeId, amount: computed.value.amount, via: computed.value.via });
    }
    case "death": {
      const hollow = isHollow(state, intent.cause);
      const paid = hollow ? 0 : state.escrow.reduce((sum, row) => sum + row.amount, 0);
      const paidSources = hollow ? [] : state.escrow.map((row) => row.sourceId);
      return ok({
        t: "death",
        lifeId: state.lifeId,
        cycle: intent.cycle,
        cause: intent.cause,
        deathSiteKey: intent.deathSiteKey,
        hollow,
        paid,
        paidSources,
      });
    }
    case "return":
      return ok({ t: "return", nextLifeId: `life-${state.lifeSerial + 1}`, lifeSerial: state.lifeSerial + 1 });
    case "purchase": {
      const record = catalog.byId.get(intent.id);
      const code = blockCode(state, intent.id, catalog);
      if (code) return fail(code, purchaseBlock(state, intent.id, catalog) ?? "Cannot buy that.");
      return ok({ t: "purchase", id: intent.id, cost: record!.cost });
    }
    case "respec": {
      if (state.phase !== "afterlife") return fail("bad-phase", "Respec at the desk, after death.");
      return ok({ t: "respec", refunded: respecRefunds(state, catalog) });
    }
    case "refund": {
      const row = state.owned[intent.id];
      if (state.phase !== "afterlife") return fail("bad-phase", "Reconfigure after death.");
      if (!row) return fail("unowned", "You do not own that.");
      if (row.bound) return fail("bound", "A bound record stays.");
      if (!refundableLeaves(state, catalog).includes(intent.id)) return fail("orphan", "Something you still own depends on that.");
      return ok({ t: "refund", id: intent.id, amount: row.costPaid });
    }
    case "open-era":
      return ok({ t: "open-era", era: intent.era });
    case "open-dungeon":
      return ok({ t: "open-dungeon", dungeon: intent.dungeon });
    case "grant-bound":
      return ok({ t: "grant-bound", id: intent.id });
    default:
      return fail("unknown-intent", "Unknown intent.");
  }
}

export function foldJournal(journal: JournalEvent[], catalog: Catalog, game: GameMirror = freshGame()): Result<MasteryState> {
  let state = freshState(game);
  for (const event of journal) {
    const next = applyResolved(state, event, catalog);
    if (!next.ok) return next;
    state = { ...next.value, journal: [...state.journal, event] };
  }
  return ok(state);
}

export function loadoutProblems(state: MasteryState, loadout: Loadout, catalog: Catalog): string | null {
  const ids = [
    ...loadout.sockets,
    ...loadout.tools,
    ...loadout.forms,
    ...(loadout.vow ? [loadout.vow] : []),
    ...(loadout.capstone ? [loadout.capstone] : []),
  ];
  if (new Set(ids).size !== ids.length) return "The same record is equipped twice.";
  if (loadout.sockets.length > TUNING.maxSockets) return `Inscriptions stop at ${TUNING.maxSockets}.`;
  if (loadout.tools.length > TUNING.maxTools) return `Tool transformations stop at ${TUNING.maxTools}.`;
  if (loadout.forms.length > TUNING.maxForms) return `Expressed forms stop at ${TUNING.maxForms}.`;
  const seat: Record<string, string> = {};
  for (const id of loadout.sockets) seat[id] = "socket";
  for (const id of loadout.tools) seat[id] = "tool";
  for (const id of loadout.forms) seat[id] = "form";
  if (loadout.vow) seat[loadout.vow] = "vow";
  if (loadout.capstone) seat[loadout.capstone] = "capstone";
  for (const id of ids) {
    const record = catalog.byId.get(id);
    if (!record) return `${id} is not a record.`;
    if (record.status !== "authored") return `${id} is unwritten and cannot be equipped.`;
    if (!state.owned[id]) return `${record.name ?? id} is not owned.`;
    const expect =
      record.role === "vow" ? "vow" : record.role === "capstone" ? "capstone" : record.kind === "tool" ? "tool" : record.kind === "form" ? "form" : "socket";
    if (seat[id] !== expect) return `${record.name ?? id} does not sit in that seat.`;
  }
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const conflict = effectsConflict(catalog.byId.get(ids[i]!)!, catalog.byId.get(ids[j]!)!);
      if (conflict) return conflict;
    }
  }
  return null;
}

export function setLoadout(state: MasteryState, loadout: Loadout, catalog: Catalog): Result<MasteryState> {
  if (state.phase !== "afterlife") return fail("bad-phase", "The loadout locks when you return. Change it after death.");
  const problem = loadoutProblems(state, loadout, catalog);
  if (problem) return fail("incompatible", problem);
  return ok({ ...state, loadout });
}

function seatOf(record: MasteryRecord): keyof Loadout | "socket-list" | "tool-list" | "form-list" {
  if (record.role === "vow") return "vow";
  if (record.role === "capstone") return "capstone";
  if (record.kind === "tool") return "tool-list";
  if (record.kind === "form") return "form-list";
  return "socket-list";
}

export function toggleEquip(state: MasteryState, id: string, catalog: Catalog): Result<MasteryState> {
  const record = catalog.byId.get(id);
  if (!record) return fail("unknown", "Unknown record.");
  const loadout: Loadout = {
    sockets: [...state.loadout.sockets],
    tools: [...state.loadout.tools],
    forms: [...state.loadout.forms],
    vow: state.loadout.vow,
    capstone: state.loadout.capstone,
  };
  const equipped =
    loadout.sockets.includes(id) || loadout.tools.includes(id) || loadout.forms.includes(id) || loadout.vow === id || loadout.capstone === id;
  if (equipped) {
    return setLoadout(state, clearRecord(loadout, id), catalog);
  }
  const seat = seatOf(record);
  if (seat === "socket-list") {
    if (loadout.sockets.length >= TUNING.maxSockets) return fail("cap", `Six inscriptions are already riding your existing actions.`);
    loadout.sockets.push(id);
  } else if (seat === "tool-list") {
    if (loadout.tools.length >= TUNING.maxTools) return fail("cap", "Two tool transformations are already carried.");
    loadout.tools.push(id);
  } else if (seat === "form-list") {
    if (loadout.forms.length >= TUNING.maxForms) return fail("cap", `Only ${TUNING.maxForms} forms can be expressed.`);
    loadout.forms.push(id);
  } else if (seat === "vow") {
    if (loadout.vow) return fail("cap", "A vow is already sworn. Set it down first.");
    loadout.vow = id;
  } else if (loadout.capstone) {
    return fail("cap", "A capstone is already set. Set it down first.");
  } else {
    loadout.capstone = id;
  }
  const problem = loadoutProblems(state, loadout, catalog);
  if (problem) return fail(problem.startsWith("cap") ? "cap" : "incompatible", problem);
  return setLoadout(state, loadout, catalog);
}

export type RuntimeProjection = {
  module: "reference";
  libraryComplete: false;
  inspectedGameSaveVersion: 8;
  attachments: { verb: HostVerb; recordId: string; name: string | null; channel: string | null; modifiers: MasteryRecord["modifiers"] }[];
  forms: { recordId: string; name: string | null; modifiers: MasteryRecord["modifiers"] }[];
  vow: string | null;
  capstone: string | null;
  tools: string[];
  note: string;
};

export function projectRuntime(state: MasteryState, catalog: Catalog): RuntimeProjection {
  const equipped = [...state.loadout.sockets, ...state.loadout.tools, ...(state.loadout.vow ? [state.loadout.vow] : []), ...(state.loadout.capstone ? [state.loadout.capstone] : [])];
  const attachments = equipped.flatMap((id) => {
    const record = catalog.byId.get(id);
    if (!record) return [];
    return record.hosts.map((verb) => ({
      verb,
      recordId: id,
      name: record.name,
      channel: record.channel,
      modifiers: record.modifiers,
    }));
  });
  return {
    module: "reference",
    libraryComplete: false,
    inspectedGameSaveVersion: 8,
    attachments,
    forms: state.loadout.forms.map((id) => {
      const record = catalog.byId.get(id);
      return { recordId: id, name: record?.name ?? null, modifiers: record?.modifiers ?? [] };
    }),
    vow: state.loadout.vow,
    capstone: state.loadout.capstone,
    tools: [...state.loadout.tools],
    note: "Attachments ride slash, spin, walk, dash, swim, and the tool already in hand. No new combat buttons.",
  };
}

export function setGameMirror(state: MasteryState, game: Partial<GameMirror>): MasteryState {
  return { ...state, game: { ...state.game, ...game } };
}
