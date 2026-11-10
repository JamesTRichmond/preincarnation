/** Builds a partitioned second-life scene. Proposed data, not a runtime. */

function ops(flags = {}) {
  return Object.entries(flags).map(([flag, value]) => ({ flag, op: "set", value }));
}

function reqFlag(flag) {
  return { all: [{ flag, eq: true }], any: [], none: [] };
}

function reqNone(flags) {
  return { all: [], any: [], none: flags.map((flag) => ({ flag, eq: true })) };
}

function altBundle(alt) {
  const altNodes = {
    n_open: { speakerId: alt.opening.speakerId, text: alt.opening.text, choices: [] },
  };
  const branches = [];
  for (const b of alt.branches) {
    altNodes.n_open.choices.push({ id: b.choiceId, text: b.choice, next: `n_end_${b.choiceId}` });
    altNodes[`n_end_${b.choiceId}`] = {
      speakerId: b.endSpeakerId,
      text: b.end,
      end: { branchId: b.id, status: "completed", setsFlags: b.flags || {} },
    };
    branches.push({
      id: b.id,
      summary: b.summary,
      worldState: ops(b.flags),
      when: `alternate if ${alt.npcId} is dead`,
    });
  }
  return {
    branches,
    entry: {
      npcId: alt.npcId,
      surrogateId: alt.surrogateId,
      resolution: alt.resolution,
      dialogue: { start: "n_open", nodes: altNodes },
    },
  };
}

export function forkStage(spec) {
  const nodeId = spec.forkNodeId || "n_fork";
  const nodes = {};
  const choices = spec.variants.map((v) => ({
    id: `enter_${v.id}`,
    text: v.door,
    next: `${v.id}_b0`,
    requires: v.noneOf ? reqNone(v.noneOf) : reqFlag(v.flag),
  }));
  nodes[nodeId] = {
    speakerId: spec.forkSpeakerId || "speaker.narration",
    text: spec.forkText,
    partition: { mode: spec.mode, flags: spec.partitionFlags },
    choices,
  };
  if (spec.forkVariant) nodes[nodeId].textVariants = [spec.forkVariant];

  const branches = [];
  for (const v of spec.variants) {
    nodes[`${v.id}_b0`] = { speakerId: v.beats[0].speakerId, text: v.beats[0].text, next: `${v.id}_b1` };
    nodes[`${v.id}_b1`] = { speakerId: v.beats[1].speakerId, text: v.beats[1].text, next: `${v.id}_b2` };
    nodes[`${v.id}_b2`] = {
      speakerId: v.beats[2].speakerId,
      text: v.beats[2].text,
      choices: v.endings.map((e) => ({
        id: e.choiceId,
        text: e.choice,
        next: `${v.id}_${e.choiceId}`,
      })),
    };
    for (const e of v.endings) {
      nodes[`${v.id}_${e.choiceId}`] = {
        speakerId: e.speakerId,
        text: e.text,
        end: { branchId: e.branchId, status: "completed", setsFlags: e.flags },
      };
      branches.push({ id: e.branchId, summary: e.summary, worldState: ops(e.flags) });
    }
  }

  const alts = [spec.alt, ...(spec.extraAlts || [])].map(altBundle);
  for (const a of alts) branches.push(...a.branches);

  const character = spec.character || {
    background: "intervale",
    bond: "unbound",
    ideal: "the_living_first",
    flaw: "cannot_leave_a_gate",
  };
  const era = spec.eras[0];
  const cases = [];
  for (const v of spec.variants) {
    for (const e of v.endings) {
      const flags = { [`flags.era.${era}`]: true };
      if (v.flag) {
        for (const f of spec.partitionFlags) flags[f] = f === v.flag;
      } else {
        for (const f of spec.partitionFlags) flags[f] = false;
      }
      const not = [];
      for (const other of spec.variants) {
        if (other.id === v.id) continue;
        for (const oe of other.endings) not.push(oe.branchId);
      }
      cases.push({
        id: `case.${spec.id}.${e.branchId}`,
        era,
        flags,
        character,
        npcAlive: spec.characters,
        graph: "main",
        expect: { end: e.branchId, flags: e.flags, not },
      });
    }
  }
  cases.push({
    id: `case.${spec.id}.dead`,
    era,
    flags: { [`flags.era.${era}`]: true },
    character,
    npcAlive: spec.characters.filter((id) => id !== spec.alt.npcId),
    useAlternateFor: spec.alt.npcId,
    graph: "alternate",
    expect: { end: spec.alt.branches[0].id, flags: spec.alt.branches[0].flags || {} },
  });

  return {
    id: spec.id,
    title: spec.title,
    locationId: spec.locationId,
    eraEligibility: spec.eras,
    characterIds: spec.characters,
    creatureIds: spec.creatures || [],
    summary: spec.summary,
    discovery: spec.discovery,
    prerequisites: spec.prerequisites,
    steps: spec.steps.map((playerAction, i) => ({ id: `${spec.id}.step${i + 1}`, playerAction })),
    dialogue: { start: nodeId, nodes },
    branches,
    rewards: spec.rewards,
    deathTransition: spec.death,
    ifNpcDead: alts.map((a) => a.entry),
    endingImplications: spec.implications,
    validationCases: cases,
    nextStageIds: spec.nextStageIds || [],
    secondLifeFork: spec.secondLife
      ? {
          npcId: spec.secondLife.npcId,
          era: spec.secondLife.era,
          nodeId,
          variants: spec.variants.map((v) => ({ id: v.id, entry: `${v.id}_b0`, flag: v.flag || null })),
        }
      : undefined,
  };
}
