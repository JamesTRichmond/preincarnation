#!/usr/bin/env node
/**
 * Assemble the optional-story pack into data/*.json.
 * Authoring sources live in content/*.mjs. This script does not run a game.
 *
 *   node support/grok-08-narrative/tools/build.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { quests as standA } from "../content/standalones_a.mjs";
import { quests as standB } from "../content/standalones_b.mjs";
import { quests as standC } from "../content/standalones_c.mjs";
import { quests as standD } from "../content/standalones_d.mjs";
import { secondGate } from "../content/second_gate.mjs";
import { bridgeChain } from "../content/chain_bridge.mjs";
import { orchardChain } from "../content/chain_orchard.mjs";
import { lettersChain } from "../content/chain_letters.mjs";
import { creemeeChain } from "../content/chain_creemee.mjs";
import { quarryChain, animalChain, floodChain } from "../content/chain_rest.mjs";
import { householdChain } from "../content/chain_household.mjs";
import {
  eras,
  towns,
  locations,
  creatures,
  characterCreation,
  speakers,
  mutexGroups,
  flagDescriptions,
  initialFlags,
} from "../content/world.mjs";
import { lineages } from "../content/lineages.mjs";
import { people } from "../content/people.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");

const quests = [
  bridgeChain,
  orchardChain,
  lettersChain,
  creemeeChain,
  quarryChain,
  animalChain,
  floodChain,
  householdChain,
  secondGate,
  ...standA,
  ...standB,
  ...standC,
  ...standD,
].map((q) => (q.kind ? q : { ...q, kind: "standalone" }));

const integration = {
  status: "PROPOSED_CONTRACT_NOT_AN_EXISTING_RUNTIME",
  warning:
    "This map is not an existing runtime. Nothing in the pack is a callable engine, and nothing here was found as a live API. A future game could read these files. The validator only simulates the seams below.",
  readOrder: [
    "Load data/people.json, data/flags.json, data/quests.json.",
    "Inject flags.era.<id> for the season being played. Do not store that injection as a quest reward.",
    "Offer a quest only when its prerequisites pass and the player has encountered its discovery in the place.",
    "Discoveries are diegetic. There is no compass, marker, or log-pin in this proposal.",
  ],
  seams: [
    {
      id: "seam.era",
      proposed: true,
      notAnExistingRuntime: true,
      input: "The season id E0 through E5, years 1952, 1966, 1980, 1994, 2008, 2022.",
      effect: "flags.era.<id> is true for that season and false for the others. People speak only if presentInEra would allow it.",
    },
    {
      id: "seam.dialogue",
      proposed: true,
      notAnExistingRuntime: true,
      input: "A quest or stage dialogue graph: start node, nodes with exactly one of choices, next, or end.",
      effect:
        "Choices may set flags and may require flags or a character-creation tuple. End nodes set a branchId, a status, and flags. Mutex groups clear sibling flags when one is set true.",
    },
    {
      id: "seam.creation",
      proposed: true,
      notAnExistingRuntime: true,
      input: "background, bond, ideal, flaw from data/character_creation.json.",
      effect:
        "The first matching textVariant replaces the node's base line. A variant matches when every character field in when equals the created tuple and every id in when.flags is true. World-state variants are listed before temperament variants, so a lived fact outranks a gloss. Variants do not change the graph. No combat class, no meter, no romance value.",
    },
    {
      id: "seam.death",
      proposed: true,
      notAnExistingRuntime: true,
      input: "Ellis dies mid-quest, or the season advances with the quest unresolved or resolved.",
      effect:
        "Apply deathTransition.setsOnDeath. Carry flagsCarriedOnDeath. Drop flagsLostOnDeath. Use the alternate dialogue bundle if a listed NPC is dead.",
    },
    {
      id: "seam.npc_alive",
      proposed: true,
      notAnExistingRuntime: true,
      input: "A set of living person ids, defaulting to birth and death years against the era clock, with optional deathOverrides.",
      effect: "If a characterIds member is dead, play that NPC's ifNpcDead bundle instead of the main graph.",
    },
  ],
  nonGoals: [
    "No romance meter.",
    "No party.",
    "No crafting economy.",
    "No procedural dialogue.",
    "No quest compass.",
    "No invented save API, network client, or engine object.",
  ],
};

const pack = {
  eras,
  towns,
  locations,
  creatures,
  characterCreation,
  speakers,
  lineages,
  people,
  flags: flagDescriptions,
  mutexGroups,
  initialFlags,
  quests,
  integration,
};

mkdirSync(dataDir, { recursive: true });

function write(name, value) {
  writeFileSync(join(dataDir, name), JSON.stringify(value, null, 2) + "\n");
}

write("eras.json", eras);
write("towns.json", towns);
write("locations.json", locations);
write("creatures.json", creatures);
write("character_creation.json", characterCreation);
write("speakers.json", speakers);
write("lineages.json", lineages);
write("people.json", people);
write("flags.json", flagDescriptions);
write("mutex_groups.json", mutexGroups);
write("initial_flags.json", initialFlags);
write("quests.json", quests);
write("integration_map.json", integration);
writeFileSync(join(dataDir, "pack.json"), JSON.stringify(pack));

const stages = quests.filter((q) => q.kind === "chain").reduce((n, q) => n + q.chainStages.length, 0);
console.log(
  `built ${quests.length} quests (${quests.filter((q) => q.kind === "chain").length} chains, ${stages} stages), ${people.length} people`,
);
