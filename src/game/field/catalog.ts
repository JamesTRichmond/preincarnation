import { CREATURES, opportunitySlots } from "./engine.ts";
import type { Creature, EncounterAction } from "./types.ts";

export function interactionTags(creature: Creature): string[] {
  const tags = new Set<string>();
  for (const step of creature.steps) {
    if (step.kind === "sketch") {
      tags.add("observation");
      continue;
    }
    for (const choice of step.choices) {
      tags.add(choice.action.type);
      if (choice.action.type === "tool") tags.add(`tool:${choice.action.tool}`);
      if (choice.outcome === "miss") tags.add("missable");
    }
  }
  for (const clause of creature.presence.anyOf) {
    if (clause.preps?.length) tags.add("prep");
    if (clause.lights?.length) tags.add("light-gate");
    if (clause.sounds?.length) tags.add("sound-gate");
    if ((clause.weathers?.length ?? 0) > 0) tags.add("weather");
  }
  return [...tags];
}

function succeedActions(creature: Creature): string[] {
  const actions: string[] = [];
  for (const step of creature.steps) {
    if (step.kind === "sketch") {
      actions.push("sketch");
      continue;
    }
    for (const choice of step.choices) {
      if (choice.outcome === "succeed") actions.push(actionKey(choice.action));
    }
  }
  return actions;
}

function actionKey(action: EncounterAction): string {
  switch (action.type) {
    case "tool":
      return `tool:${action.tool}:${action.timing}`;
    case "marks":
      return "marks";
    case "pace":
      return `pace:${action.pace}`;
    case "light":
      return `light:${action.light}`;
    case "sound":
      return `sound:${action.sound}`;
    case "prep":
      return `prep:${action.prep}`;
    case "still":
      return "still";
    default:
      return "other";
  }
}

export function footprint(creature: Creature): string {
  const marks = creature.sketchMarks
    .filter((mark) => mark.correct)
    .map((mark) => mark.label)
    .join("~");
  return [
    creature.habitatId,
    creature.station ?? "-",
    creature.tier,
    succeedActions(creature).join(";"),
    marks,
    String(creature.canKeep),
    creature.links.map((link) => `${link.channel}:${link.who ?? ""}`).join(","),
    creature.fictional ? "fiction" : "real",
  ].join("|");
}

export function auditCatalog(creatures: Creature[] = CREATURES): string[] {
  const problems: string[] = [];
  if (creatures.length !== 36) problems.push(`expected 36 creatures, found ${creatures.length}`);
  const seen = {
    id: new Set<string>(),
    common: new Set<string>(),
    scientific: new Set<string>(),
    clue: new Set<string>(),
    entry: new Set<string>(),
    behavior: new Set<string>(),
    signature: new Set<string>(),
    footprint: new Set<string>(),
  };
  const rewardIds = new Set<string>();
  const tagUnion = new Set<string>();
  let meadow = 0;
  let cooking = 0;
  let infirmary = 0;
  let character = 0;
  for (const creature of creatures) {
    const claim = (set: Set<string>, value: string, label: string) => {
      if (set.has(value)) problems.push(`duplicate ${label}: ${value}`);
      set.add(value);
    };
    claim(seen.id, creature.id, "id");
    claim(seen.common, creature.commonName, "common name");
    claim(seen.scientific, `${creature.scientificName}:${creature.nameRank}`, "scientific name");
    claim(seen.clue, creature.discoveryClue, "clue");
    claim(seen.entry, creature.notebookEntry, "notebook entry");
    claim(seen.behavior, creature.behavior, "behavior");
    claim(seen.signature, creature.signature, "signature");
    claim(seen.footprint, footprint(creature), "footprint");
    if (creature.hints[0] !== creature.discoveryClue) problems.push(`${creature.id} hint 0 is not the discovery clue`);
    if (creature.hints.length !== 3) problems.push(`${creature.id} needs three hints`);
    if (creature.tier === "vein" && !creature.fictional) problems.push(`${creature.id} is Vein but not fictional`);
    if (creature.tier !== "vein" && creature.fictional) problems.push(`${creature.id} is fictional but not Vein`);
    if (creature.naturalHistory.length < 40) problems.push(`${creature.id} natural history is too thin`);
    if (!creature.fictional && creature.naturalHistory.toLowerCase().includes("fictional")) {
      problems.push(`${creature.id} real entry calls itself fictional`);
    }
    if (creature.fictional && !/fictional/i.test(creature.naturalHistory)) {
      problems.push(`${creature.id} fiction is not labeled`);
    }
    if (creature.steps.length < 2) problems.push(`${creature.id} needs an approach and a sketch`);
    if (!creature.steps.some((step) => step.kind === "sketch")) problems.push(`${creature.id} has no sketch`);
    const correct = creature.sketchMarks.filter((mark) => mark.correct).length;
    const wrong = creature.sketchMarks.filter((mark) => !mark.correct).length;
    if (correct < 1 || wrong < 1) problems.push(`${creature.id} sketch needs a true and a false mark`);
    for (const step of creature.steps) {
      if (step.kind !== "choice") continue;
      if (!step.choices.some((choice) => choice.outcome === "succeed")) problems.push(`${creature.id} ${step.id} cannot succeed`);
      if (!step.choices.some((choice) => choice.outcome === "miss")) problems.push(`${creature.id} ${step.id} cannot miss`);
    }
    if (opportunitySlots(creature) < 2 && creature.presence.anyOf.length < 2) {
      problems.push(`${creature.id} has a single authored slot`);
    }
    if (!creature.canKeep && !creature.keepRefusal) problems.push(`${creature.id} refuses keep without a reason`);
    if (creature.habitatId === "lantern-meadow") {
      meadow += 1;
      if (!creature.station) problems.push(`${creature.id} is in the meadow without a station`);
    }
    for (const reward of creature.rewards) {
      if (rewardIds.has(reward.id)) problems.push(`duplicate reward ${reward.id}`);
      rewardIds.add(reward.id);
    }
    for (const link of creature.links) {
      if (link.channel === "cooking") cooking += 1;
      if (link.channel === "infirmary") infirmary += 1;
      if (link.channel === "character") character += 1;
    }
    if (creature.habitatId === "lantern-meadow") {
      for (const tag of interactionTags(creature)) tagUnion.add(tag);
    }
  }
  if (meadow < 8) problems.push(`meadow has only ${meadow} encounters`);
  for (const required of ["pace", "still", "observation", "light", "sound", "prep", "tool"]) {
    if (!tagUnion.has(required)) problems.push(`meadow mix missing ${required}`);
  }
  if (cooking < 1 || infirmary < 1 || character < 1) {
    problems.push("catalog is missing a cooking, infirmary, or character link");
  }
  return problems;
}
