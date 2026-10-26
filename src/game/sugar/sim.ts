import {
  type Cell,
  type Dir,
  type Token,
  DR,
  DC,
  OPP,
  capOf,
  hasPort,
  otherPort,
  outletOf,
  acceptsStorage,
  isStorage,
  tapOrigins,
  freshRun,
  boardSize,
} from "./model.ts";

export interface Dest {
  r: number;
  c: number;
  type: "storage" | "bucket";
  enter: Dir;
}

export interface Through {
  r: number;
  c: number;
  kind: "tee" | "cross";
  exit: Dir;
}

export interface Found {
  dest: Dest;
  through: Through[];
  dirs: Dir[];
}

export interface Frame {
  counts: number[][];
  got: number[][];
  stock: number[][];
  faults: { r: number; c: number }[];
  note: string;
}

export interface SimResult {
  status: "win" | "stall" | "burst" | "overflow" | "cycle";
  message: string;
  ticks: number;
  frames: Frame[];
  faultCells: { r: number; c: number }[];
  traversed: { tee: boolean; cross: boolean; turned: boolean };
  fork: boolean;
  stagger: boolean;
  buffered: boolean;
  entered: Set<string>;
}

interface Agent {
  r: number;
  c: number;
  kind: "token" | "tap";
  origin: number;
}

function inBounds(board: Cell[][], r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < board.length && c < (board[0]?.length ?? 0);
}

function seek(
  board: Cell[][],
  r: number,
  c: number,
  exitDir: Dir,
  seen: number,
): Found | null {
  const nr = r + DR[exitDir];
  const nc = c + DC[exitDir];
  if (!inBounds(board, nr, nc)) return null;
  const bit = 1 << (nr * 8 + nc);
  if (seen & bit) return null;
  const nextSeen = seen | bit;
  const cell = board[nr]?.[nc];
  if (!cell) return null;
  const enter = OPP[exitDir] as Dir;

  if (cell.kind === "bucket") {
    const mouth = (0 + (cell.rot & 3)) & 3;
    if (enter !== mouth || cell.got >= cell.need) return null;
    return { dest: { r: nr, c: nc, type: "bucket", enter }, through: [], dirs: [exitDir] };
  }

  if (isStorage(cell)) {
    if (!acceptsStorage(cell, enter)) return null;
    if (cell.tokens.length >= capOf(cell)) return null;
    return { dest: { r: nr, c: nc, type: "storage", enter }, through: [], dirs: [exitDir] };
  }

  if (cell.kind === "tee") {
    if (!hasPort(cell, enter)) return null;
    const straight = OPP[enter];
    let chosen: Dir | null = null;
    for (let step = 0; step < 4; step += 1) {
      const dir = ((straight + step * 3) & 3) as Dir;
      if (dir === enter || !hasPort(cell, dir)) continue;
      if (seek(board, nr, nc, dir, nextSeen)) {
        chosen = dir;
        break;
      }
    }
    if (chosen === null) return null;
    const rest = seek(board, nr, nc, chosen, nextSeen);
    if (!rest) return null;
    return {
      dest: rest.dest,
      through: [{ r: nr, c: nc, kind: "tee", exit: chosen }, ...rest.through],
      dirs: [exitDir, ...rest.dirs],
    };
  }

  if (cell.kind === "cross") {
    const rest = seek(board, nr, nc, OPP[enter], nextSeen);
    if (!rest) return null;
    return {
      dest: rest.dest,
      through: [{ r: nr, c: nc, kind: "cross", exit: OPP[enter] }, ...rest.through],
      dirs: [exitDir, ...rest.dirs],
    };
  }

  return null;
}

function findFrom(board: Cell[][], agent: Agent): Found | null {
  const cell = board[agent.r]?.[agent.c];
  if (!cell) return null;
  const seen = 1 << (agent.r * 8 + agent.c);
  if (agent.kind === "tap") {
    return seek(board, agent.r, agent.c, outletOf(cell), seen);
  }
  const token = cell.tokens[0];
  if (!token) return null;
  const exit = otherPort(cell, token.enter);
  if (exit === null) return null;
  return seek(board, agent.r, agent.c, exit, seen);
}

function snapshot(board: Cell[][], faults: { r: number; c: number }[], note: string): Frame {
  return {
    counts: board.map((row) => row.map((cell) => cell.tokens.length)),
    got: board.map((row) => row.map((cell) => cell.got)),
    stock: board.map((row) => row.map((cell) => cell.stock)),
    faults,
    note,
  };
}

function agentsOf(board: Cell[][], origins: Map<string, number>): Agent[] {
  const agents: Agent[] = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (isStorage(cell) && cell.tokens.length > 0 && (cell.kind !== "valve" || cell.open)) {
        const token = cell.tokens[0];
        if (token) agents.push({ r, c, kind: "token", origin: token.origin });
      }
      if (cell.kind === "tap" && cell.stock > 0) {
        agents.push({ r, c, kind: "tap", origin: origins.get(`${r},${c}`) ?? 0 });
      }
    });
  });
  return agents;
}

export function simulate(source: Cell[][]): SimResult {
  const board = freshRun(source);
  const origins = tapOrigins(board);
  const { rows, cols } = boardSize(board);
  let sap = 0;
  for (const row of board) for (const cell of row) sap += cell.stock;
  const maxTicks = rows * cols * (sap + 2) + 4;
  const frames: Frame[] = [snapshot(board, [], "The yard is set.")];
  const entered = new Set<string>();
  const arrivals = new Map<string, { tick: number; origin: number }[]>();
  const teeExits = new Map<string, Set<number>>();
  let traversedTee = false;
  let traversedCross = false;
  let turned = false;
  let buffered = false;
  let ticks = 0;

  const finish = (
    status: SimResult["status"],
    message: string,
    faultCells: { r: number; c: number }[],
  ): SimResult => {
    let stagger = false;
    for (const events of arrivals.values()) {
      const ticksSeen = new Set(events.map((event) => event.tick));
      const originsSeen = new Set(events.map((event) => event.origin));
      if (ticksSeen.size >= 2 && originsSeen.size >= 2) stagger = true;
    }
    let fork = false;
    for (const exits of teeExits.values()) if (exits.size >= 2) fork = true;
    return {
      status,
      message,
      ticks,
      frames,
      faultCells,
      traversed: { tee: traversedTee, cross: traversedCross, turned },
      fork,
      stagger,
      buffered,
      entered,
    };
  };

  while (ticks < maxTicks) {
    const agents = agentsOf(board, origins);
    const claims: { agent: Agent; found: Found }[] = [];
    for (const agent of agents) {
      const found = findFrom(board, agent);
      if (found) claims.push({ agent, found });
    }

    const groups = new Map<string, { agent: Agent; found: Found }[]>();
    for (const claim of claims) {
      const key = `${claim.found.dest.r},${claim.found.dest.c}`;
      const list = groups.get(key);
      if (list) list.push(claim);
      else groups.set(key, [claim]);
    }

    const faults: { r: number; c: number; kind: "burst" | "overflow" }[] = [];
    for (const [key, group] of groups) {
      const dest = group[0]?.found.dest;
      if (!dest) continue;
      const cell = board[dest.r]?.[dest.c];
      if (!cell) continue;
      if (dest.type === "bucket") {
        if (group.length > cell.need - cell.got) faults.push({ r: dest.r, c: dest.c, kind: "overflow" });
      } else if (group.length > capOf(cell) - cell.tokens.length) {
        faults.push({ r: dest.r, c: dest.c, kind: "burst" });
      }
      void key;
    }

    if (faults.length > 0) {
      const kind = faults.some((fault) => fault.kind === "burst") ? "burst" : "overflow";
      const message =
        kind === "burst"
          ? "Two saps hit one thin line on the same pull. The grade blew."
          : "A pail was asked to take more than its mark.";
      const faultCells = faults.map(({ r, c }) => ({ r, c }));
      frames.push(snapshot(board, faultCells, message));
      return finish(kind, message, faultCells);
    }

    if (claims.length === 0) {
      const stuckTap = board.some((row) => row.some((cell) => cell.kind === "tap" && cell.stock > 0));
      const stuckLine = board.some((row) => row.some((cell) => cell.tokens.length > 0));
      const short = board.some((row) => row.some((cell) => cell.kind === "bucket" && cell.got !== cell.need));
      if (!stuckTap && !stuckLine && !short) {
        frames.push(snapshot(board, [], "Every pail is at its mark."));
        return finish("win", "Every pail is at its mark.", []);
      }
      const message = stuckLine
        ? "Sap is still sitting on the line."
        : stuckTap
          ? "A tap still holds sap, and nothing can move."
          : "A pail is short.";
      frames.push(snapshot(board, [], message));
      return finish("stall", message, []);
    }

    ticks += 1;
    const depart = new Set<string>();
    for (const claim of claims) {
      if (claim.agent.kind === "token") depart.add(`${claim.agent.r},${claim.agent.c}`);
      entered.add(`${claim.agent.r},${claim.agent.c}`);
      entered.add(`${claim.found.dest.r},${claim.found.dest.c}`);
      for (const step of claim.found.through) {
        entered.add(`${step.r},${step.c}`);
        if (step.kind === "tee") {
          traversedTee = true;
          const id = `${step.r},${step.c}`;
          const exits = teeExits.get(id) ?? new Set<number>();
          exits.add(step.exit);
          teeExits.set(id, exits);
        }
        if (step.kind === "cross") traversedCross = true;
      }
      if (claim.agent.kind === "token") {
        const home = board[claim.agent.r]?.[claim.agent.c];
        const riding = home?.tokens[0];
        if (riding) {
          const exit = otherPort(home, riding.enter);
          if (exit !== null && exit !== OPP[riding.enter]) turned = true;
        }
      }
      if (new Set(claim.found.dirs).size > 1) turned = true;
    }

    const incoming = new Map<string, Token[]>();
    for (const claim of claims) {
      const dest = claim.found.dest;
      const key = `${dest.r},${dest.c}`;
      if (claim.agent.kind === "tap") {
        const tap = board[claim.agent.r]?.[claim.agent.c];
        if (tap) tap.stock -= 1;
      }
      if (dest.type === "bucket") {
        const pail = board[dest.r]?.[dest.c];
        if (pail) pail.got += 1;
      } else {
        const list = incoming.get(key) ?? [];
        list.push({ enter: dest.enter, origin: claim.agent.origin });
        incoming.set(key, list);
        const events = arrivals.get(key) ?? [];
        events.push({ tick: ticks, origin: claim.agent.origin });
        arrivals.set(key, events);
      }
    }

    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        const key = `${r},${c}`;
        if (depart.has(key) && cell.tokens.length > 0) cell.tokens = cell.tokens.slice(1);
        const extra = incoming.get(key);
        if (extra) cell.tokens = [...cell.tokens, ...extra];
        if (cell.kind === "main" && cell.tokens.length >= 2) buffered = true;
      });
    });

    frames.push(snapshot(board, [], ticks === 1 ? "First pull." : `Pull ${ticks}.`));
  }

  const message = "These fittings feed each other. The draw never settles.";
  frames.push(snapshot(board, [], message));
  return finish("cycle", message, []);
}

export function won(board: Cell[][]): boolean {
  return simulate(board).status === "win";
}
