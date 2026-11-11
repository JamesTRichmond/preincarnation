import { choice, ending, line, prereq, say, variant } from "./lib.mjs";

/**
 * Build a standalone quest with a real three-beat scene:
 * opening, a distinct middle for each choice, and an ending that sets world state.
 * Alternate graph if the listed NPC is dead.
 * This is a structuring aid. All spoken lines are authored per quest.
 */
export function standalone(spec) {
  const nodes = {};
  const openingVariants = [];
  const addVar = (v) => {
    if (v?.text) openingVariants.push(variant(v.when || {}, v.text));
  };
  // World-state lines first, so a true flag outranks a temperament gloss.
  for (const v of spec.opening.variants || []) addVar(v);
  if (spec.opening.variant) addVar(spec.opening.variant);
  nodes.n_open = say(
    spec.opening.speakerId,
    spec.opening.text,
    spec.branches.map((b) => choice(b.choiceId, b.choice, `n_mid_${b.id}`, b.choiceSets, b.choiceRequires)),
    openingVariants,
  );
  for (const b of spec.branches) {
    if (b.complication) {
      nodes[`n_mid_${b.id}`] = line(b.middleSpeakerId, b.middle, `n_comp_${b.id}`);
      nodes[`n_comp_${b.id}`] = say(b.complication.speakerId, b.complication.text, [
        choice(`${b.id}_c1`, b.complication.a.text, `n_end_${b.id}`, b.complication.a.sets),
        choice(`${b.id}_c2`, b.complication.b.text, `n_end_${b.id}_b`, b.complication.b.sets),
      ]);
      nodes[`n_end_${b.id}`] = ending(b.endSpeakerId, b.end, b.id, b.flags);
      nodes[`n_end_${b.id}_b`] = ending(
        b.complication.b.speakerId || b.endSpeakerId,
        b.complication.b.end,
        b.complication.b.branchId,
        b.complication.b.flags,
      );
    } else {
      nodes[`n_mid_${b.id}`] = line(b.middleSpeakerId, b.middle, `n_end_${b.id}`);
      nodes[`n_end_${b.id}`] = ending(b.endSpeakerId, b.end, b.id, b.flags);
    }
  }

  const branchMeta = [];
  for (const b of spec.branches) {
    branchMeta.push({ id: b.id, summary: b.summary, worldState: flagOps(b.flags) });
    if (b.complication) {
      branchMeta.push({
        id: b.complication.b.branchId,
        summary: b.complication.b.summary,
        worldState: flagOps(b.complication.b.flags),
      });
    }
  }

  const altGraphs = [spec.alt, ...(spec.extraAlts || [])];
  const ifNpcDead = altGraphs.map((alt) => {
    const altNodes = {};
    altNodes.n_open = say(
      alt.opening.speakerId,
      alt.opening.text,
      alt.branches.map((b) =>
        choice(b.choiceId, b.choice, b.middle ? `n_mid_${b.id}` : `n_end_${b.id}`),
      ),
    );
    for (const b of alt.branches) {
      if (b.middle) {
        altNodes[`n_mid_${b.id}`] = line(
          b.middleSpeakerId || alt.opening.speakerId,
          b.middle,
          `n_end_${b.id}`,
        );
      }
      altNodes[`n_end_${b.id}`] = ending(b.endSpeakerId, b.end, b.id, b.flags);
      branchMeta.push({
        id: b.id,
        summary: b.summary,
        worldState: flagOps(b.flags),
        when: `alternate if ${alt.npcId} is dead`,
      });
    }
    return {
      npcId: alt.npcId,
      surrogateId: alt.surrogateId,
      resolution: alt.resolution,
      dialogue: { start: "n_open", nodes: altNodes },
    };
  });

  const era = spec.eras[0];
  const baseFlags = { [`flags.era.${era}`]: true, ...(spec.caseFlags || {}) };
  const character = spec.character || {
    background: spec.opening.variant?.when?.background || "intervale",
    bond: "unbound",
    ideal: spec.opening.variant?.when?.ideal || "the_living_first",
    flaw: spec.opening.variant?.when?.flaw || "spares_a_kind_lie",
  };
  if (spec.opening.variant?.when?.flaw) character.flaw = spec.opening.variant.when.flaw;
  if (spec.opening.variant?.when?.ideal) character.ideal = spec.opening.variant.when.ideal;
  if (spec.opening.variant?.when?.background) character.background = spec.opening.variant.when.background;
  if (spec.opening.variant?.when?.bond) character.bond = spec.opening.variant.when.bond;

  const cases = spec.branches.map((b) => ({
    id: `case.${spec.id}.${b.id}`,
    era,
    flags: { ...baseFlags, ...(b.caseFlags || {}) },
    character: { ...character },
    npcAlive: spec.characters,
    graph: "main",
    expect: {
      end: b.id,
      flags: expectFlags(b.flags, b.choiceSets),
    },
  }));
  cases.push({
    id: `case.${spec.id}.npcdead`,
    era,
    flags: { ...baseFlags },
    character: { ...character },
    npcAlive: spec.characters.filter((id) => id !== spec.alt.npcId),
    useAlternateFor: spec.alt.npcId,
    graph: "alternate",
    expect: {
      end: spec.alt.branches[0].id,
      flags: expectFlags(spec.alt.branches[0].flags),
    },
  });
  cases.push({
    id: `case.${spec.id}.npcdead_b`,
    era,
    flags: { ...baseFlags },
    character: { ...character },
    npcAlive: spec.characters.filter((id) => id !== spec.alt.npcId),
    useAlternateFor: spec.alt.npcId,
    graph: "alternate",
    expect: {
      end: spec.alt.branches[1].id,
      flags: expectFlags(spec.alt.branches[1].flags),
    },
  });

  const quest = {
    id: spec.id,
    title: spec.title,
    kind: "standalone",
    locationId: spec.locationId,
    eraEligibility: spec.eras,
    characterIds: spec.characters,
    creatureIds: spec.creatures || [],
    summary: spec.summary,
    discovery: spec.discovery,
    prerequisites: spec.prerequisites || prereq({ all: [{ flag: `flags.era.${era}`, eq: true }] }),
    steps: spec.steps.map((playerAction, i) => ({ id: `${spec.id}.step${i + 1}`, playerAction })),
    dialogue: { start: "n_open", nodes },
    branches: branchMeta,
    rewards: spec.rewards,
    deathTransition: spec.death,
    ifNpcDead,
    endingImplications: spec.implications,
    validationCases: cases,
  };

  if (spec.secondLifeFork) quest.secondLifeFork = spec.secondLifeFork;
  return quest;
}

function flagOps(flags = {}) {
  return Object.entries(flags).map(([flag, value]) => ({ flag, op: "set", value }));
}

function expectFlags(flags = {}, prior = {}) {
  return { ...prior, ...flags };
}

export function asStage(quest, nextStageIds) {
  const stage = { ...quest };
  delete stage.kind;
  stage.nextStageIds = nextStageIds;
  return stage;
}

export function handQuest(q) {
  return q;
}
