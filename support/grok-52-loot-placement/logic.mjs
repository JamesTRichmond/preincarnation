/** Shared placement rules. The demo and the validator both call these. No second loot ruleset. */

export function createState(era) {
  return {
    version: 1,
    era,
    flags: {},
    satchel: [],
    owned: {},
    taken: {},
    eraRead: {},
    refusals: {},
    hinted: {},
    journal: [],
    discovered: {},
    chapel: null,
    gates: {},
  };
}

export function gateSet(state) {
  return new Set(Object.keys(state.gates).filter((id) => state.gates[id]));
}

export function wasRead(state, id) {
  if (state.taken[id]) return true;
  const eras = state.eraRead[id];
  return !!(eras && (eras.before || eras.return));
}

export function ownerBlocks(sit, state) {
  if (!sit.ownership || sit.ownership.posture !== "refuses") return false;
  return (sit.ownership.presentIn || []).includes(state.era);
}

export function questLocked(sit, state) {
  if (!sit.persistence?.questLock) return false;
  const rel = sit.quest?.release;
  if (!rel) return true;
  if (rel.era && state.era !== rel.era) return true;
  if (rel.flag && !state.flags[rel.flag]) return true;
  return false;
}

export function isResolved(sit, state) {
  if (sit.special === "chapel-offering") {
    if (state.chapel === "done") return true;
    if (state.era === "before") return state.chapel === "took" || state.chapel === "left";
    return false;
  }
  if (sit.persistence?.fixture) return !!(state.eraRead[sit.id] && state.eraRead[sit.id][state.era]);
  return !!state.taken[sit.id];
}

function failPrereq(sit, state) {
  for (const p of sit.prerequisites || []) {
    if (!p || p.type === "none") continue;
    let ok = true;
    if (p.type === "era") ok = state.era === p.id;
    else if (p.type === "flag") ok = !!state.flags[p.id];
    else if (p.type === "clue-read") ok = wasRead(state, p.id);
    else if (p.type === "tool") ok = !!state.flags[`tool:${p.id}`];
    else if (p.type === "item") ok = !!state.owned[p.id];
    else if (p.type === "gate") ok = !!state.gates[p.id];
    else if (p.type === "quest-stage") ok = !!state.flags[p.id];
    else ok = false;
    if (!ok) return p;
  }
  return null;
}

function applyGrants(sit, state) {
  const g = sit.grants || {};
  for (const f of g.both || []) state.flags[f] = true;
  for (const f of g[state.era] || []) state.flags[f] = true;
}

function give(state, content, fromId) {
  if (!content || state.owned[content.itemId]) return null;
  state.owned[content.itemId] = true;
  const entry = {
    itemId: content.itemId,
    name: content.name,
    kind: content.kind,
    blurb: content.blurb,
    fromId,
    spoilsOnReturn: content.spoilsOnReturn || null,
    onEnterReturnGrant: content.onEnterReturnGrant || null,
    onEnterReturnNote: content.onEnterReturnNote || null,
    spoiled: false,
  };
  state.satchel.push(entry);
  if (content.tool) state.flags[`tool:${content.tool}`] = true;
  for (const id of content.opens || []) state.gates[id] = true;
  return entry;
}

export function yieldContents(sit, state) {
  return (sit.contents || []).filter((c) => {
    if (!c.obtainable) return false;
    if (c.requiresPrior) return false;
    if (!(c.eraAvailable || []).includes(state.era)) return false;
    return true;
  });
}

function markRead(state, sit) {
  state.discovered[sit.id] = true;
  if (sit.persistence?.fixture) {
    state.eraRead[sit.id] = state.eraRead[sit.id] || {};
    state.eraRead[sit.id][state.era] = true;
  } else {
    state.taken[sit.id] = true;
  }
}

function journal(state, line) {
  if (line) state.journal.push(line);
}

export function resolveAction(state, sit, action) {
  const next = structuredClone(state);
  next.discovered[sit.id] = true;

  if (!sit.era?.[next.era]?.available) {
    return {
      ok: false,
      state,
      mode: "blocked",
      message: sit.interaction.blockedCopy,
      journal: false,
    };
  }

  if (sit.special === "chapel-offering") {
    return resolveChapel(state, next, sit, action);
  }

  if (isResolved(sit, next)) {
    const text = sit.examinedByEra?.[next.era] || sit.interaction.examinedCopy;
    return { ok: false, state, mode: "done", message: text, journal: false };
  }

  const missed = failPrereq(sit, next);
  if (missed) {
    const message = missed.failCopy || sit.interaction.blockedCopy;
    const first = !next.hinted[sit.id];
    if (first) {
      next.hinted[sit.id] = true;
      journal(next, message);
      return { ok: false, state: next, mode: "blocked", message, journal: true };
    }
    return { ok: false, state, mode: "blocked", message, journal: false };
  }

  if (questLocked(sit, next)) {
    const message = sit.interaction.heldCopy || sit.interaction.blockedCopy;
    const first = !next.hinted[`quest:${sit.id}`];
    if (first) {
      next.hinted[`quest:${sit.id}`] = true;
      journal(next, message);
      return { ok: false, state: next, mode: "held", message, journal: true };
    }
    return { ok: false, state, mode: "held", message, journal: false };
  }

  if (ownerBlocks(sit, next)) {
    const first = !next.refusals[sit.id];
    const message = first
      ? sit.interaction.ownedRefusalCopy
      : sit.interaction.refusalRepeatCopy || sit.interaction.ownedRefusalCopy;
    if (first) {
      next.refusals[sit.id] = true;
      if (sit.ownership.consequenceFlag) next.flags[sit.ownership.consequenceFlag] = true;
      journal(next, message);
      return { ok: false, state: next, mode: "refused", message, journal: true };
    }
    return { ok: false, state, mode: "refused", message, journal: false };
  }

  const reread = sit.persistence?.fixture && wasRead(next, sit.id);
  const gained = [];
  for (const c of yieldContents(sit, next)) {
    const entry = give(next, c, sit.id);
    if (entry) gained.push(entry);
  }
  if (gained.length === 0 && !sit.persistence?.fixture) {
    return {
      ok: false,
      state,
      mode: "blocked",
      message: sit.interaction.blockedCopy,
      journal: false,
    };
  }
  applyGrants(sit, next);
  markRead(next, sit);
  const message = reread && sit.interaction.rereadCopy ? sit.interaction.rereadCopy : sit.interaction.successCopy;
  journal(next, message);
  return { ok: true, state: next, mode: "taken", message, journal: true, items: gained };
}

function resolveChapel(original, next, sit, action) {
  const b = sit.branches;
  if (isResolved(sit, next)) {
    return { ok: false, state: original, mode: "done", message: sit.interaction.examinedCopy, journal: false };
  }
  if (next.era === "before") {
    if (action === "leave") {
      next.chapel = "left";
      next.flags["chapel.left"] = true;
      next.discovered[sit.id] = true;
      journal(next, b.leaveBefore.copy);
      return { ok: true, state: next, mode: "left", message: b.leaveBefore.copy, journal: true, items: [] };
    }
    next.chapel = "took";
    next.flags["chapel.unwelcome"] = true;
    const gained = [];
    for (const id of b.takeBefore.items) {
      const c = sit.contents.find((x) => x.itemId === id);
      const entry = give(next, { ...c, obtainable: true }, sit.id);
      if (entry) gained.push(entry);
    }
    next.discovered[sit.id] = true;
    journal(next, b.takeBefore.copy);
    return { ok: true, state: next, mode: "taken", message: b.takeBefore.copy, journal: true, items: gained };
  }
  // return
  let branch;
  if (next.chapel === "left") branch = b.returnAfterLeft;
  else if (next.chapel === "took") branch = b.returnAfterTook;
  else branch = b.returnFresh;
  const gained = [];
  for (const id of branch.items) {
    const c = sit.contents.find((x) => x.itemId === id);
    const entry = give(next, { ...c, obtainable: true, requiresPrior: false }, sit.id);
    if (entry) gained.push(entry);
  }
  next.chapel = "done";
  next.taken[sit.id] = true;
  next.discovered[sit.id] = true;
  journal(next, branch.copy);
  return { ok: true, state: next, mode: "taken", message: branch.copy, journal: true, items: gained };
}

export function shiftEra(state, era) {
  if (state.era === era) return { state, messages: [] };
  const next = structuredClone(state);
  const messages = [];
  next.era = era;
  if (era === "return") {
    for (const item of next.satchel) {
      if (item.spoilsOnReturn && !item.spoiled) {
        const spoil = item.spoilsOnReturn;
        messages.push(spoil.note);
        next.owned[item.itemId] = true;
        item.itemId = spoil.itemId;
        item.name = spoil.name;
        item.kind = spoil.kind || item.kind;
        item.blurb = spoil.blurb || item.blurb;
        item.spoiled = true;
        item.spoilsOnReturn = null;
        next.owned[item.itemId] = true;
      }
      if (item.onEnterReturnGrant && !next.flags[item.onEnterReturnGrant]) {
        next.flags[item.onEnterReturnGrant] = true;
        if (item.onEnterReturnNote) messages.push(item.onEnterReturnNote);
      }
    }
    messages.unshift("Fourteen years come forward. The bend is the same ground, and the hands are gone.");
  } else {
    messages.unshift("You step back into the first life. People are in the rooms. What you take, they can notice.");
  }
  for (const line of messages) next.journal.push(line);
  return { state: next, messages };
}

export function noteRoomEntry(state, room) {
  if (
    room === "hale-kitchen" &&
    state.era === "before" &&
    state.owned["childs-marble"] &&
    !state.flags["hale.wary"]
  ) {
    const next = structuredClone(state);
    next.flags["hale.wary"] = true;
    const line =
      "Ruth sees the marble in your pocket. She does not raise her voice. She turns the kettle and will not look at you.";
    next.journal.push(line);
    return { state: next, message: line };
  }
  return { state, message: null };
}

export function simulate(era, situations, map, mode) {
  let state = createState(era);
  const set = situations.filter((s) => (mode === "fragment" ? s.playableInFragment : !s.playableInFragment));
  let guard = 0;
  let progress = true;
  while (progress && guard++ < 400) {
    progress = false;
    const reach = mode === "fragment" ? map.flood(gateSet(state)) : null;
    for (const sit of set) {
      if (isResolved(sit, state)) continue;
      if (mode === "fragment") {
        const a = map.anchors[sit.id];
        if (!a || !reach.has(`${a.x},${a.y}`)) continue;
      }
      const result = resolveAction(state, sit, "take");
      if (result.ok) {
        state = result.state;
        progress = true;
      }
    }
  }
  return state;
}
