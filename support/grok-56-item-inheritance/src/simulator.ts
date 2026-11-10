import legacyV0 from "../fixtures/legacy-v0.json" with { type: "json" };
import legacyV1 from "../fixtures/legacy-v1.json" with { type: "json" };
import { InheritanceError } from "./errors.ts";
import {
  advanceTo,
  beginTransaction,
  claim,
  commitTransaction,
  createWorld,
  donate,
  ensureNpc,
  ensureSite,
  inheritItem,
  killNpc,
  markHistorical,
  recognize,
  reincarnate,
  resolveSuccessions,
  restoreItem,
  stackCommons,
  vanishSite,
} from "./engine.ts";
import { exportSave, loadSave } from "./migrate.ts";
import { audit, countDispositions, labelOf } from "./read.ts";
import type { ItemSaveV2, ReturnReport, WorldState } from "./types.ts";
import { PLAYER_ID } from "./types.ts";

export interface DemoStepResult {
  world: WorldState;
  lines: string[];
  report?: ReturnReport;
}

export interface DemoStep {
  id: string;
  title: string;
  detail: string;
  run: (world: WorldState) => DemoStepResult;
}

const pack = { location: "carried" as const, containerId: "pack" };
const nonePlace = { kind: "none" as const, siteId: null, siteEra: null };

function at(world: WorldState, year: number): WorldState {
  return year > world.calendarYear ? advanceTo(world, year) : world;
}

function caught(run: () => void): string {
  try {
    run();
    return "Expected a refusal and did not get one.";
  } catch (error) {
    return error instanceof InheritanceError ? error.message : String(error);
  }
}

export function createDemonstrationWorld(): WorldState {
  let world = createWorld(0);
  world = ensureSite(world, { siteId: "site:cottage", name: "Ellis's cottage", lossPolicy: "recover-to-storage" });
  world = ensureSite(world, { siteId: "site:hall", name: "Weavers' hall", lossPolicy: "recover-to-storage" });
  world = ensureSite(world, { siteId: "site:mill", name: "Old mill", lossPolicy: "displace-to-cache" });
  world = ensureSite(world, { siteId: "site:shop", name: "Mara's shop", lossPolicy: "recover-to-storage" });
  world = ensureNpc(world, { npcId: "npc:mara", name: "Mara", lineageId: "line:mara", generation: 1, successorId: "npc:lina" });
  world = ensureNpc(world, { npcId: "npc:lina", name: "Lina", lineageId: "line:mara", generation: 2, successorId: null });
  world = ensureNpc(world, { npcId: "npc:sela", name: "Sela", lineageId: "line:kin", generation: 2, successorId: null });
  world = ensureNpc(world, { npcId: "npc:pawn", name: "Bridie", lineageId: "line:pawn", generation: 1, successorId: null });
  world = ensureNpc(world, { npcId: "npc:tess", name: "Tess", lineageId: "line:neighbors", generation: 1, successorId: null });

  world = claim(world, {
    defId: "def:inherited.father-compass",
    sourceKey: "heirloom:family:compass",
    sourceKind: "inheritance",
    year: 0,
    instanceId: "inst:demo:compass",
    storage: pack,
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:inherited.mother-thimble",
    sourceKey: "heirloom:family:thimble",
    sourceKind: "inheritance",
    year: 0,
    instanceId: "inst:demo:thimble",
    storage: { location: "stored", containerId: "chest:hall" },
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:inherited.aunt-shawl",
    sourceKey: "heirloom:family:shawl",
    sourceKind: "inheritance",
    year: 0,
    instanceId: "inst:demo:shawl",
    storage: { location: "displayed", containerId: "display:site:cottage" },
    placement: { kind: "displayed", siteId: "site:cottage", siteEra: 0 },
  });
  world = claim(world, {
    defId: "def:inherited.sister-ribbon",
    sourceKey: "heirloom:family:ribbon",
    sourceKind: "inheritance",
    year: 0,
    instanceId: "inst:demo:ribbon",
    storage: { location: "displayed", containerId: "display:site:hall" },
    placement: { kind: "displayed", siteId: "site:hall", siteEra: 0 },
  });
  world = claim(world, {
    defId: "def:equipment.watch-lantern",
    sourceKey: "quest:flood-watch:lantern",
    sourceKind: "quest-reward",
    year: 0,
    instanceId: "inst:demo:lantern",
    storage: pack,
    placement: nonePlace,
    questBinding: { questId: "quest:flood-watch", state: "bound" },
  });
  world = claim(world, {
    defId: "def:food.travel-bread",
    sourceKey: "common:purchase:bread:life0",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:demo:bread",
    qty: 3,
    storage: pack,
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:card.market-token",
    sourceKey: "heirloom:card:famine-token",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:demo:token",
    storage: { location: "stored", containerId: "chest:hall" },
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:tool.common-chisel",
    sourceKey: "common:purchase:chisel:1",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:demo:chisel",
    storage: pack,
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:tool.common-cup",
    sourceKey: "common:purchase:cup:1",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:demo:cup",
    storage: pack,
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:material.oak-plank",
    sourceKey: "common:purchase:oak:life0",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:demo:oak",
    qty: 4,
    storage: { location: "stored", containerId: "chest:hall" },
    placement: nonePlace,
  });
  world = claim(world, {
    defId: "def:inherited.nail-pouch",
    sourceKey: "heirloom:inherited:raising-pouch",
    sourceKind: "found",
    year: 0,
    instanceId: "inst:demo:pouch",
    storage: { location: "displayed", containerId: "display:site:mill" },
    placement: { kind: "displayed", siteId: "site:mill", siteEra: 0 },
  });
  return world;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "open",
    title: "The life opens",
    detail: "Property is already sorted into carried, stored, displayed, and quest-bound. Nothing has aged out.",
    run: (world) => {
      const counts = countDispositions(world);
      return {
        world,
        lines: [
          `Year ${world.calendarYear}. Carried ${counts.carried}, stored ${counts.stored}, displayed ${counts.displayed}, quest-bound ${counts["quest-bound"]}.`,
          "Bread is still bread. The compass is still the compass. No corpse is waiting.",
        ],
      };
    },
  },
  {
    id: "coin",
    title: "The sun coin, once",
    detail: "A unique barrow cache is claimed into the pack. The source is consumed for every later life.",
    run: (world) => {
      const next = claim(at(world, 2), {
        defId: "def:relic.sun-coin",
        sourceKey: "unique:barrow:sun-coin",
        sourceKind: "cache",
        year: 2,
        instanceId: "inst:demo:coin",
        storage: pack,
        placement: nonePlace,
      });
      return { world: next, lines: ["Year 2. The sun coin is in the pack. The barrow source is consumed."] };
    },
  },
  {
    id: "plane",
    title: "The smoothing plane",
    detail: "Ellis takes up one heirloom plane. Its instance id will survive donation and succession.",
    run: (world) => {
      const next = claim(at(world, 3), {
        defId: "def:tool.smoothing-plane",
        sourceKey: "heirloom:tool:smoothing-plane",
        sourceKind: "gift",
        year: 3,
        instanceId: "inst:demo:plane",
        storage: pack,
        placement: nonePlace,
      });
      return { world: next, lines: ["Year 3. inst:demo:plane is carried."] };
    },
  },
  {
    id: "donate",
    title: "Given to Mara",
    detail: "A committed donation. The plane leaves Ellis's storage and stays one object in Mara's shop.",
    run: (world) => {
      const next = donate(at(world, 6), "inst:demo:plane", "npc:mara", 6, "site:shop");
      const plane = next.instances["inst:demo:plane"]!;
      return {
        world: next,
        lines: [`Year 6. ${labelOf(plane)} is ${plane.ownership.title} to ${plane.ownership.ownerId}. Same id.`],
      };
    },
  },
  {
    id: "sale-open",
    title: "A sale that does not finish",
    detail: "The common chisel is reserved for Bridie. Until commit, it is still Ellis's.",
    run: (world) => {
      const next = beginTransaction(at(world, 8), "inst:demo:chisel", "sell", "npc:pawn", 8);
      const chisel = next.instances["inst:demo:chisel"]!;
      return {
        world: next,
        lines: [
          `Year 8. Sale ${chisel.pendingTxn?.txnId ?? ""} is open.`,
          "The chisel is still carried. An unfinished sale is not a sale.",
        ],
      };
    },
  },
  {
    id: "death-one",
    title: "Death with the sale unfinished",
    detail: "Ellis dies in year 9 and returns in year 23. The sale aborts. Nothing is left on a body.",
    run: (world) => {
      const { world: next, report } = reincarnate(world, 9);
      return {
        world: next,
        report,
        lines: [
          `Died ${report.deathYear}. Returned ${report.returnYear}, life ${report.toLife}, ${report.principalEra ? "a principal era" : "not a principal boundary"}.`,
          `Aborted ${report.aborted.length} transaction. Erased ${report.erasedInstanceIds.length}. Corpse recovery: no.`,
          `Ellis still holds ${report.keptPlayerInstanceIds.length} active pieces of property.`,
        ],
      };
    },
  },
  {
    id: "refarm",
    title: "The barrow does not pay twice",
    detail: "Dying did not restore the unique source. A second claim is refused.",
    run: (world) => {
      const message = caught(() => {
        claim(world, {
          defId: "def:relic.sun-coin",
          sourceKey: "unique:barrow:sun-coin",
          sourceKind: "cache",
          year: world.calendarYear,
        });
      });
      return { world, lines: [message] };
    },
  },
  {
    id: "oak",
    title: "The oak stand, this era",
    detail: "A renewable node mints a new common plank. It is not the heirloom and not the planks already in the chest.",
    run: (world) => {
      const next = claim(world, {
        defId: "def:material.oak-plank",
        sourceKey: "node:oak-stand:plank",
        sourceKind: "renewable-node",
        year: world.calendarYear,
        instanceId: "inst:demo:oak-era1",
      });
      return {
        world: next,
        lines: ["A new plank inst:demo:oak-era1 enters the pack. inst:demo:oak in the chest is untouched."],
      };
    },
  },
  {
    id: "mara-dies",
    title: "Mara dies",
    detail: "The plane's owner is dead. The plane is not deleted and not returned to Ellis.",
    run: (world) => {
      const next = killNpc(at(world, 24), "npc:mara", 24);
      return { world: next, lines: ["Year 24. Mara is dead. inst:demo:plane still exists."] };
    },
  },
  {
    id: "succession",
    title: "Lina keeps the plane",
    detail: "Succession moves stewardship to the living apprentice. The instance id does not change.",
    run: (world) => {
      const { world: next, transfers } = resolveSuccessions(world, world.calendarYear);
      const plane = next.instances["inst:demo:plane"]!;
      return {
        world: next,
        lines: [
          `Transfers: ${transfers.map((row) => `${row.instanceId} ${row.fromId} → ${row.toId}`).join("; ") || "none"}.`,
          `The plane's owner is now ${plane.ownership.ownerId}.`,
        ],
      };
    },
  },
  {
    id: "cottage",
    title: "The cottage is gone",
    detail: "Default site policy puts Ellis's displayed shawl back into storage. It is not a scavenger hunt.",
    run: (world) => {
      const { world: next, recoveries } = vanishSite(at(world, 26), "site:cottage", 26);
      const shawl = next.instances["inst:demo:shawl"]!;
      return {
        world: next,
        lines: [
          `Recoveries: ${recoveries.map((row) => `${row.instanceId} (${row.policy})`).join(", ")}.`,
          `The shawl is ${shawl.storage.location} in ${shawl.storage.containerId}.`,
        ],
      };
    },
  },
  {
    id: "mill",
    title: "The mill falls — an authored cache",
    detail: "The mill's policy is a cache, so the pouch is displaced and not deleted. This is a written consequence, not the default.",
    run: (world) => {
      const { world: next } = vanishSite(at(world, 27), "site:mill", 27);
      const pouch = next.instances["inst:demo:pouch"]!;
      return {
        world: next,
        lines: [
          `The pouch is ${pouch.ownership.ownerKind}, placed at ${pouch.placement.siteId}.`,
          "Same instance. It can be taken up later. It was not replaced.",
        ],
      };
    },
  },
  {
    id: "fiddle-found",
    title: "A broken ash fiddle",
    detail: "The fiddle enters the record cracked. Restoration will not mint a second one.",
    run: (world) => {
      const next = claim(at(world, 28), {
        defId: "def:instrument.ash-fiddle",
        sourceKey: "heirloom:instrument:ash-fiddle",
        sourceKind: "found",
        year: 28,
        instanceId: "inst:demo:fiddle",
        condition: "broken",
        storage: pack,
        placement: nonePlace,
      });
      return { world: next, lines: ["Year 28. inst:demo:fiddle is broken and carried."] };
    },
  },
  {
    id: "fiddle-restored",
    title: "The same fiddle, restored",
    detail: "Repair appends history. The instance id stays.",
    run: (world) => {
      const next = restoreItem(world, "inst:demo:fiddle", world.calendarYear, PLAYER_ID, "Soundpost reset. Same ash body.");
      const fiddle = next.instances["inst:demo:fiddle"]!;
      return { world: next, lines: [`Condition is ${fiddle.condition}. History entries: ${fiddle.restoration.length}.`] };
    },
  },
  {
    id: "fiddle-inherit",
    title: "Sela inherits the fiddle",
    detail: "Inheritance transfers that restored instrument. Ellis does not keep a copy.",
    run: (world) => {
      const next = inheritItem(
        at(world, 29),
        "inst:demo:fiddle",
        "npc:sela",
        "npc",
        29,
        "Sela inherits the restored fiddle.",
        null,
      );
      const fiddle = next.instances["inst:demo:fiddle"]!;
      return { world: next, lines: [`inst:demo:fiddle is now ${fiddle.ownership.title} under ${fiddle.ownership.ownerId}.`] };
    },
  },
  {
    id: "dismantle",
    title: "The chisel is dismantled",
    detail: "A committed dismantle closes the chisel and yields a new common shard. The chisel id is not reused.",
    run: (world) => {
      let next = beginTransaction(world, "inst:demo:chisel", "dismantle", PLAYER_ID, world.calendarYear);
      next = commitTransaction(next, "inst:demo:chisel", next.calendarYear);
      const chisel = next.instances["inst:demo:chisel"]!;
      const shard = Object.values(next.instances).find((inst) => inst.defId === "def:material.iron-shard");
      return {
        world: next,
        lines: [
          `Chisel status ${chisel.status}.`,
          shard ? `Shard ${shard.instanceId} is stored, quantity ${shard.qty}.` : "No shard was created.",
        ],
      };
    },
  },
  {
    id: "sold",
    title: "The cup is sold",
    detail: "A committed sale. A later death will not put the cup back in the pack.",
    run: (world) => {
      let next = at(world, 30);
      next = beginTransaction(next, "inst:demo:cup", "sell", "npc:pawn", 30);
      next = commitTransaction(next, "inst:demo:cup", 30);
      const cup = next.instances["inst:demo:cup"]!;
      return { world: next, lines: [`Year 30. The cup is ${cup.ownership.title} to ${cup.ownership.ownerId}.`] };
    },
  },
  {
    id: "meaning",
    title: "Recognition and a historical mark",
    detail: "The thimble is recognized. The famine token becomes historical. A fresh day-token is a different instance and will not stack into it.",
    run: (world) => {
      let next = at(world, 42);
      next = recognize(next, "inst:demo:thimble", 42, "npc:tess", "Tess reads the hallmark. It was Ellis's mother's.");
      next = markHistorical(next, "inst:demo:token", 42, "npc:tess", "Entered in the famine ledger. Same disc.");
      next = claim(next, {
        defId: "def:card.market-token",
        sourceKey: "node:market:day-token",
        sourceKind: "renewable-node",
        year: 42,
        instanceId: "inst:demo:day-token",
      });
      const refusal = caught(() => {
        stackCommons(next, "inst:demo:token", "inst:demo:day-token", 42);
      });
      const token = next.instances["inst:demo:token"]!;
      return {
        world: next,
        lines: [
          `Thimble recognized in eras ${token ? next.instances["inst:demo:thimble"]!.era.recognizedInEras.join(", ") : ""}.`,
          `Token condition ${token.condition}, historical ${String(token.era.historical)}.`,
          refusal,
        ],
      };
    },
  },
  {
    id: "death-two",
    title: "Another death, property still here",
    detail: "Year 48 to year 62. Stored, displayed, donated, sold, dismantled, and quest-bound outcomes all remain what they were.",
    run: (world) => {
      const { world: next, report } = reincarnate(world, 48);
      return {
        world: next,
        report,
        lines: [
          `Returned ${report.returnYear}. Erased ${report.erasedInstanceIds.length}. Aborted ${report.aborted.length}.`,
          "The sold cup stays sold. The quest lantern stays bound. The bread is not spoiled by the calendar.",
        ],
      };
    },
  },
  {
    id: "past-seventy",
    title: "Past the sixth era",
    detail: "A death at 71 returns in 85. The next death returns in 104. Later returns continue, and so does the property.",
    run: (world) => {
      const first = reincarnate(world, 71);
      const second = reincarnate(first.world, 90);
      return {
        world: second.world,
        report: second.report,
        lines: [
          `Return ${first.report.returnYear} (era ${first.report.eraIndex}, principal ${String(first.report.principalEra)}).`,
          `Return ${second.report.returnYear} (era ${second.report.eraIndex}, principal ${String(second.report.principalEra)}).`,
          `Ellis holds ${second.report.keptPlayerInstanceIds.length} pieces. Erased across this death: ${second.report.erasedInstanceIds.length}.`,
        ],
      };
    },
  },
  {
    id: "oak-again",
    title: "The stand yields in a new era",
    detail: "Renewable commons reset by era, not by death, and never copy an heirloom.",
    run: (world) => {
      const next = claim(world, {
        defId: "def:material.oak-plank",
        sourceKey: "node:oak-stand:plank",
        sourceKind: "renewable-node",
        year: world.calendarYear,
        instanceId: "inst:demo:oak-late",
      });
      return { world: next, lines: [`Year ${next.calendarYear}. inst:demo:oak-late is a new common plank.`] };
    },
  },
  {
    id: "oak-capped",
    title: "Not twice in the same era",
    detail: "The node has already yielded. Dying would not lift the cap, and this era is not over.",
    run: (world) => {
      const message = caught(() => {
        claim(world, {
          defId: "def:material.oak-plank",
          sourceKey: "node:oak-stand:plank",
          sourceKind: "renewable-node",
          year: world.calendarYear,
        });
      });
      return { world, lines: [message] };
    },
  },
];

export interface PlayLogEntry {
  id: string;
  title: string;
  lines: string[];
}

export function playSteps(count: number, world: WorldState = createDemonstrationWorld()): {
  world: WorldState;
  log: PlayLogEntry[];
  reports: ReturnReport[];
} {
  const log: PlayLogEntry[] = [];
  const reports: ReturnReport[] = [];
  let current = world;
  for (const step of DEMO_STEPS.slice(0, count)) {
    const result = step.run(current);
    current = result.world;
    log.push({ id: step.id, title: step.title, lines: result.lines });
    if (result.report) reports.push(result.report);
  }
  return { world: current, log, reports };
}

export function playThrough(): { world: WorldState; log: PlayLogEntry[]; reports: ReturnReport[] } {
  const played = playSteps(DEMO_STEPS.length);
  const checked = audit(played.world);
  if (!checked.ok) {
    throw new InheritanceError("audit", checked.errors.join("\n"));
  }
  return played;
}

export function runRepeatedDeaths(): { world: WorldState; reports: ReturnReport[] } {
  let world = claim(createWorld(0), {
    defId: "def:inherited.father-compass",
    sourceKey: "heirloom:family:compass",
    sourceKind: "inheritance",
    year: 0,
    instanceId: "inst:repeat:compass",
  });
  const reports: ReturnReport[] = [];
  for (const death of [10, 30, 50, 71, 90]) {
    const turned = reincarnate(world, death);
    world = turned.world;
    reports.push(turned.report);
  }
  return { world, reports };
}

export function openLegacyV0(): ReturnType<typeof loadSave> {
  return loadSave(legacyV0);
}

export function openLegacyV1(): ReturnType<typeof loadSave> {
  return loadSave(legacyV1);
}

export function buildInterruptedSave(): ItemSaveV2 {
  let world = ensureNpc(createWorld(0), {
    npcId: "npc:pawn",
    name: "Bridie",
    lineageId: "line:pawn",
    generation: 1,
    successorId: null,
  });
  world = claim(world, {
    defId: "def:tool.common-chisel",
    sourceKey: "common:purchase:chisel:fixture",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:fixture:chisel",
  });
  world = advanceTo(world, 4);
  world = beginTransaction(world, "inst:fixture:chisel", "sell", "npc:pawn", 4);
  return exportSave(world, { gold: 12, chapter: "unfinished-stall" });
}

export function buildVanishedSave(): ItemSaveV2 {
  let world = ensureSite(createWorld(0), {
    siteId: "site:cottage",
    name: "Ellis's cottage",
    lossPolicy: "recover-to-storage",
  });
  world = claim(world, {
    defId: "def:inherited.aunt-shawl",
    sourceKey: "heirloom:family:shawl-fixture",
    sourceKind: "inheritance",
    year: 0,
    instanceId: "inst:fixture:shawl",
    storage: { location: "displayed", containerId: "display:site:cottage" },
    placement: { kind: "displayed", siteId: "site:cottage", siteEra: 0 },
  });
  world = claim(world, {
    defId: "def:food.travel-bread",
    sourceKey: "common:purchase:bread:fixture",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:fixture:bread",
    qty: 2,
  });
  const vanished = vanishSite(advanceTo(world, 30), "site:cottage", 30).world;
  return exportSave(vanished, { gold: 4 });
}
