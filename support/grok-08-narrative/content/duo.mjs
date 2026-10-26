import { standalone, asStage } from "./questkit.mjs";
import { death, reward } from "./death.mjs";

export function duo(spec) {
  const stepFlags = (extra) => ({ [`flags.stage.${spec.id}.done`]: true, ...(extra || {}) });
  const quest = standalone({
    id: spec.id,
    title: spec.title,
    locationId: spec.locationId,
    eras: [spec.era],
    characters: spec.characters,
    creatureIds: spec.creatures,
    summary: spec.summary,
    discovery: spec.discovery,
    implications: spec.implications,
    prerequisites: spec.prerequisites || { all: [{ flag: `flags.era.${spec.era}`, eq: true }], any: [], none: [] },
    steps: spec.steps,
    opening: spec.opening,
    branches: spec.branches.map((b) => ({
      ...b,
      flags: stepFlags(b.flags),
    })),
    rewards: spec.rewards || [
      reward("knowledge", `reward.${spec.id}.k`, spec.rewardK),
      reward("record", `reward.${spec.id}.r`, spec.rewardR),
    ],
    death: death({
      mid: spec.deathMid,
      unresolved: spec.deathOpen,
      resolved: spec.deathShut,
      sets: { [`flags.stage.${spec.id}.interrupted`]: true, ...(spec.deathSets || {}) },
    }),
    alt: {
      npcId: spec.alt.npcId,
      surrogateId: spec.alt.surrogateId,
      resolution: spec.alt.resolution,
      opening: spec.alt.opening,
      branches: spec.alt.branches.map((b) => ({ ...b, flags: stepFlags(b.flags) })),
    },
    extraAlts: spec.extraAlts,
  });
  return asStage(quest, spec.next || []);
}

export function chain(partial, stages) {
  return { ...partial, kind: "chain", chainStages: stages };
}
