import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditPuzzle } from "./audit.ts";
import { applyActions, describeCell, parseBoard } from "./model.ts";
import { PUZZLES } from "./puzzles.ts";
import { writeSave } from "./save.ts";
import { simulate } from "./sim.ts";
import { solve } from "./solver.ts";

let failed = 0;

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name} ${detail}`);
}

check("straight line wins", simulate(parseBoard(["a0.1!", "p0!", "b0.1!"])).status === "win");
const wrong = simulate(parseBoard(["a0.1!", "p1!", "b0.1!"]));
check("sideways line stalls", wrong.status === "stall", wrong.message);

const queue = simulate(parseBoard(["a0.2!", "p0!", "b0.2!"]));
check("queue of two wins", queue.status === "win" && queue.ticks >= 3, `${queue.status} ${queue.ticks}`);

check(
  "elbow path wins",
  simulate(parseBoard(["a0.1! .. ..", "e0! p1! b3.1!"])).status === "win",
);

check("check with the arrow wins", simulate(parseBoard(["a0.1!", "c0!", "b0.1!"])).status === "win");
check("reversed check stalls", simulate(parseBoard(["a0.1!", "c2!", "b0.1!"])).status === "stall");

const burst = simulate(parseBoard(["a0.1! ..", "t0! a1.1!", "p0! ..", "b0.2! .."]));
check("same beat bursts", burst.status === "burst", burst.message);

const stagger = simulate(parseBoard(["a0.1! ..", "p0! ..", "t0! a1.1!", "p0! ..", "b0.2! .."]));
check(
  "stagger wins",
  stagger.status === "win" && stagger.stagger,
  `${stagger.status} ${stagger.message} ticks=${stagger.ticks} stagger=${stagger.stagger}`,
);

check("shut gate stalls", simulate(parseBoard(["a3.1! v1_! p1! b3.1!"])).status === "stall");
check("open gate wins", simulate(parseBoard(["a3.1! v1! p1! b3.1!"])).status === "win");

const cross = simulate(
  parseBoard([".. .. b2.1! .. ..", "a3.1! p1! x! p1! b3.1!", ".. .. p0! .. ..", ".. .. a2.1! .. .."]),
);
check(
  "cross keeps two streams",
  cross.status === "win" && cross.traversed.cross,
  `${cross.status} ${cross.message}`,
);

const tee = simulate(parseBoard([".. b2.1!", "a3.2! t2!", ".. b0.1!"]));
check(
  "tee fork fills two pails",
  tee.status === "win" && tee.fork,
  `${tee.status} ${tee.message} fork=${tee.fork}`,
);

const main = simulate(parseBoard(["a0.1! ..", "t0! a1.1!", "m0! ..", "b0.2! .."]));
check(
  "main catches a double",
  main.status === "win" && main.buffered,
  `${main.status} ${main.message} buf=${main.buffered}`,
);

const messed = parseBoard(["a0.1!", "p1?", "b0.1!"]);
const answer = solve(messed, 4);
check("solver finds one turn", answer?.moves === 1, JSON.stringify(answer));
if (answer) {
  check("solver trace wins", simulate(applyActions(messed, answer.actions)).status === "win");
}

const half = solve(parseBoard(["a0.1! .. ..", "e2? p1! b3.1!"]), 4);
check("elbow half-turn is two clicks", half?.moves === 2, JSON.stringify(half));

check("wrong mouth stalls", simulate(parseBoard(["a3.1! p1! b0.1!"])).status === "stall");
check("right mouth wins", simulate(parseBoard(["a3.1! p1! b3.1!"])).status === "win");

if (failed > 0) {
  throw new Error(`${failed} sugar physics checks failed`);
}

describe("sugar bench", () => {
  it("keeps sixty yards and a one-turn first pull", () => {
    assert.equal(PUZZLES.length, 60);
    const first = PUZZLES.find((puzzle) => puzzle.id === "1-01");
    assert.ok(first);
    const audit = auditPuzzle(first);
    assert.equal(audit.ok, true, audit.reasons.join("; "));
    assert.equal(audit.par, 1);
  });

  it("says which way a thin line is open", () => {
    const cell = parseBoard(["p1!"])[0]?.[0];
    assert.ok(cell);
    assert.match(describeCell(cell), /east and west/);
  });

  it("does not write the county life save", () => {
    const prev = globalThis.localStorage;
    const keys: string[] = [];
    const store = {
      get length() {
        return keys.length;
      },
      clear() {
        keys.length = 0;
      },
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem(key: string) {
        keys.push(key);
      },
    };
    globalThis.localStorage = store as unknown as Storage;
    try {
      writeSave({ version: 1, cleared: {}, hints: {} });
      assert.deepEqual(keys, ["sugar-circuits-save-v1"]);
      assert.equal(keys.includes("preincarnation.save.v1"), false);
    } finally {
      globalThis.localStorage = prev;
    }
  });
});

