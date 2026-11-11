/**
 * Regenerates checked-in bases and case JSON from the reference model.
 * Run before run-tests.js if you change tables or define-cases.js.
 * The test runner does not regenerate fixtures, so a drift fails the suite.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gameplayCases, migrationCases } from "./define-cases.js";
import {
  CONTRACT_ID,
  applyAction,
  clearedCount,
  createSession,
  makeNewGame,
  serialize,
  tables,
  validateV3,
} from "./model.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const basesDir = join(root, "fixtures/bases");
const rawDir = join(root, "fixtures/raw");

function must(session, action) {
  const result = applyAction(session, action);
  if (!result.ok) {
    throw new Error(`${action.op} ${action.dungeonId || action.rewardId || action.quest || ""} -> ${result.error} ${result.detail || ""}`);
  }
  return result;
}

function returns(session, count, prefix) {
  for (let i = 1; i <= count; i += 1) {
    must(session, { op: "combat-death", token: `${prefix}-${i}` });
    must(session, { op: "choose-form", form: "otter" });
  }
}

function advanceQuest(session, quest, steps) {
  for (const step of steps) {
    must(session, { op: "begin-transition", quest, to: step });
    must(session, { op: "commit-quest" });
  }
}

function finish(name, state) {
  const verdict = validateV3(state);
  if (!verdict.ok) throw new Error(`${name} invalid: ${verdict.error} ${verdict.detail || ""}`);
  return state;
}

function year0Dungeon() {
  const state = makeNewGame();
  state.body.map = "snake-mountain-cut";
  state.body.hp = 6;
  state.body.x = 20;
  state.body.y = 6;
  state.life.carriedKeys = ["key-stacks"];
  state.life.dialogueSeenThisLife = ["maeve-ask"];
  state.world.keys["key-stacks"].state = "carried";
  state.world.quests["lantern-debt"].step = "asked";
  state.world.dungeons["snake-mountain-cut"].discovered = true;
  return finish("year0-dungeon", state);
}

function year14() {
  const session = createSession(makeNewGame());
  must(session, { op: "boss-defeat", dungeonId: "snake-mountain-cut" });
  must(session, { op: "begin-reward", rewardId: "reward-snake-heart" });
  must(session, { op: "claim-reward" });
  must(session, { op: "combat-death", token: "ret-1" });
  must(session, { op: "choose-form", form: "otter" });
  return finish("year14-returned", session.live);
}

function year28() {
  const session = createSession(makeNewGame());
  returns(session, 2, "open");
  return finish("year28-open", session.live);
}

function year56() {
  const session = createSession(makeNewGame());
  advanceQuest(session, "mill-gear", ["asked"]);
  returns(session, 4, "mill");
  return finish("year56-mill-asked", session.live);
}

function year70Ready() {
  const session = createSession(makeNewGame());
  advanceQuest(session, "lantern-debt", ["asked", "ledger-found", "repaid"]);
  advanceQuest(session, "mill-gear", ["asked", "gear-cut", "installed"]);
  for (const reward of tables.rewards) {
    if (reward.requires === "boss") {
      must(session, { op: "boss-defeat", dungeonId: reward.dungeon });
      must(session, { op: "begin-reward", rewardId: reward.id });
      must(session, { op: "claim-reward" });
    } else {
      must(session, { op: "clear-dungeon", dungeonId: reward.dungeon });
      must(session, { op: "claim-chest", rewardId: reward.id });
    }
  }
  for (const dungeon of tables.dungeons) {
    if (!session.live.world.dungeons[dungeon.id].cleared) {
      must(session, { op: "clear-dungeon", dungeonId: dungeon.id });
    }
  }
  must(session, { op: "talk-mayor" });
  must(session, { op: "complete-crown", riteId: "crown-east" });
  must(session, { op: "complete-crown", riteId: "crown-west" });
  returns(session, 5, "to70");
  if (clearedCount(session.live) !== 16) throw new Error(`clears ${clearedCount(session.live)}`);
  if (session.live.person.year !== 70) throw new Error(`year ${session.live.person.year}`);
  if (session.live.person.heart !== 3 || session.live.person.stride !== 3 || session.live.person.edge !== 3) {
    throw new Error(`stats ${session.live.person.heart}/${session.live.person.stride}/${session.live.person.edge}`);
  }
  return finish("year70-ready", session.live);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

mkdirSync(basesDir, { recursive: true });
mkdirSync(rawDir, { recursive: true });

const ready = year70Ready();
const ledgerSession = createSession(ready);
must(ledgerSession, { op: "commit-ending", endingId: "ledger" });
const ledger = finish("year70-ledger", ledgerSession.live);

const bases = {
  "new-game": finish("new-game", makeNewGame()),
  "year0-dungeon": year0Dungeon(),
  "year14-returned": year14(),
  "year28-open": year28(),
  "year56-mill-asked": year56(),
  "year70-ready": ready,
  "year70-ledger": ledger,
};

for (const [name, state] of Object.entries(bases)) {
  writeJson(join(basesDir, `${name}.json`), state);
}

writeJson(join(rawDir, "v3-new-game.json"), JSON.parse(serialize(makeNewGame())));

const warning = "Reference-contract fixtures only. No PREINCARNATION save module was present. These records are not captured game saves, and a pass is not a game pass.";

writeJson(join(root, "fixtures/cases.json"), {
  contract: CONTRACT_ID,
  warning,
  generatedFrom: "src/define-cases.js",
  bases: Object.keys(bases),
  cases: gameplayCases(),
});

writeJson(join(root, "migration-cases.json"), {
  contract: CONTRACT_ID,
  warning: `${warning} v1/v2 shapes are defined by this pack because no shipped schema was available to read.`,
  generatedFrom: "src/define-cases.js",
  cases: migrationCases(),
});

console.log(`wrote ${Object.keys(bases).length} bases, ${gameplayCases().length} gameplay cases, ${migrationCases().length} migration cases`);
