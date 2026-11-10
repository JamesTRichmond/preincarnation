/**
 * Reusable deterministic finite-state machine.
 * Domain code (enemies, miniboss phases, traps) supplies states and predicates.
 * The machine itself does not know about combat.
 *
 * Tick contract:
 *   beginTick -> caller runs the state body -> endTick evaluates transitions.
 * A telegraph state's `frames` is extended by ctx.tellBonus.
 */

export function createMachine(def) {
  if (!def?.states?.length) throw new Error("Machine has no states");
  if (!def.states.some((s) => s.id === def.initial)) {
    throw new Error(`Initial state '${def.initial}' missing`);
  }
  const ids = new Set();
  for (const state of def.states) {
    if (ids.has(state.id)) throw new Error(`Duplicate state ${state.id}`);
    ids.add(state.id);
  }
  for (const state of def.states) {
    for (const to of [state.on_done, ...(state.transitions || []).map((t) => t.to)]) {
      if (to && !ids.has(to)) throw new Error(`${state.id} -> unknown state ${to}`);
    }
  }
  return {
    def,
    state: def.initial,
    frame: 0,
    entered: true,
  };
}

export function machineState(machine) {
  return machine.def.states.find((s) => s.id === machine.state);
}

export function effectiveFrames(state, ctx) {
  if (state.frames == null) return null;
  const bonus = state.kind === "telegraph" ? ctx.tellBonus || 0 : 0;
  return state.frames + bonus;
}

export function beginTick(machine) {
  const state = machineState(machine);
  if (!state) throw new Error(`Missing state ${machine.state}`);
  const entered = machine.entered;
  machine.entered = false;
  return { state, entered, frame: machine.frame };
}

export function endTick(machine, ctx, predicates) {
  const state = machineState(machine);
  const frames = effectiveFrames(state, ctx);
  let next = null;
  let because = null;
  for (const transition of state.transitions || []) {
    const pred = predicates[transition.when];
    if (!pred) throw new Error(`No predicate '${transition.when}'`);
    if (pred(ctx, transition, machine)) {
      next = transition.to;
      because = transition.when;
      break;
    }
  }
  if (!next && frames != null && machine.frame + 1 >= frames) {
    next = state.on_done || null;
    because = "timer";
  }
  machine.frame += 1;
  if (next) {
    machine.state = next;
    machine.frame = 0;
    machine.entered = true;
  }
  return { next, because, frame: machine.frame };
}

export function forceState(machine, id) {
  if (!machine.def.states.some((s) => s.id === id)) {
    throw new Error(`Cannot force unknown state ${id}`);
  }
  machine.state = id;
  machine.frame = 0;
  machine.entered = true;
}

export function graphSignature(def) {
  const parts = [def.initial];
  for (const state of def.states) {
    const transitions = (state.transitions || []).map((t) => `${t.when}:${t.to}`).join(",");
    parts.push(
      `${state.id}|${state.kind}|${state.attack || "-"}|${state.move?.type || "-"}|>${state.on_done || "-"}|${transitions}`,
    );
  }
  return parts.join(";");
}
