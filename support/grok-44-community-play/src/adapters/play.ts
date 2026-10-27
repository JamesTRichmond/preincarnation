import { agnesAccessEffect } from "../rivals/progress.ts";
import type {
  ActivityDef,
  ActivityLaunch,
  ActivityResult,
  EraId,
  FestivalDef,
  PlayerChoice,
  RivalEffect,
} from "../types.ts";
import { fixtureLabel } from "./modules.ts";
import { probeModule } from "./registry.ts";

export type PlayContext = {
  festival: FestivalDef;
  activity: ActivityDef;
  era: EraId;
  choice: PlayerChoice | { withdraw: true };
};

function launchFor(ctx: PlayContext, choice: PlayerChoice): ActivityLaunch {
  return {
    moduleId: ctx.activity.moduleId,
    festivalId: ctx.festival.id,
    activityId: ctx.activity.id,
    eraId: ctx.era,
    seed: `${ctx.era}:${ctx.festival.id}:${ctx.activity.id}`,
    prompt: ctx.activity.scene,
    accessibleVariantId: choice.useAccessible ? ctx.activity.accessible.id : undefined,
  };
}

function withAccess(narrative: string, activity: ActivityDef, useAccessible: boolean): string {
  if (!useAccessible) return narrative;
  return `${narrative} You used the accessible alternative: ${activity.accessible.label}`;
}

function effectsFor(
  activity: ActivityDef,
  decisionEffects: RivalEffect[],
  festival: FestivalDef,
  era: EraId,
  useAccessible: boolean,
  withdrew: boolean,
): RivalEffect[] {
  if (withdrew) {
    return [
      {
        rivalId: festival.hostRivalId,
        delta: 0,
        line: `${festival.hostTitle} notes that you stepped back from ${activity.title}. It is not entered as a win or a loss.`,
      },
    ];
  }
  const effects = decisionEffects.slice();
  if (festival.rivals.includes("agnes-crowell")) {
    const agnes = agnesAccessEffect(era, useAccessible);
    if (agnes) effects.push(agnes);
  }
  return effects;
}

export function playActivity(ctx: PlayContext): ActivityResult {
  const { activity, festival, era } = ctx;
  if ("withdraw" in ctx.choice) {
    const effects = effectsFor(activity, [], festival, era, false, true);
    const live = probeModule(activity.moduleId);
    return {
      activityId: activity.id,
      moduleId: activity.moduleId,
      source: live ? "live-module" : "authored-fixture",
      integration: live ? "live" : "fixture-pending",
      fixtureLabel: live ? null : fixtureLabel(activity.moduleId),
      decisionId: null,
      approach: null,
      useAccessible: false,
      outcome: "withdrew",
      narrative: "You step back from the heat. The gathering does not score it.",
      rivalLines: effects.map((effect) => ({
        rivalId: effect.rivalId,
        line: effect.line,
        delta: effect.delta,
        flag: effect.flag,
      })),
      flags: [],
    };
  }

  const choice = ctx.choice;
  const decision = activity.decisions.find((item) => item.id === choice.decisionId);
  if (!decision) throw new Error(`Unknown decision ${choice.decisionId} for ${activity.id}`);

  const live = probeModule(activity.moduleId);
  if (live) {
    try {
      const output = live.play({ launch: launchFor(ctx, choice), choice });
      return {
        activityId: activity.id,
        moduleId: activity.moduleId,
        source: "live-module",
        integration: "live",
        fixtureLabel: null,
        decisionId: decision.id,
        approach: decision.approach,
        useAccessible: choice.useAccessible,
        outcome: output.outcome,
        narrative: output.narrative,
        rivalLines: output.rivalLines,
        flags: output.flags ?? [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown failure";
      return {
        activityId: activity.id,
        moduleId: activity.moduleId,
        source: "live-module",
        integration: "live",
        fixtureLabel: null,
        decisionId: decision.id,
        approach: decision.approach,
        useAccessible: choice.useAccessible,
        outcome: "withdrew",
        narrative: `The live ${activity.moduleId} module failed (${message}). This heat was not replaced with a fixture.`,
        rivalLines: [],
        flags: ["live-module-failed"],
      };
    }
  }

  const baseOutcome = decision.eraOutcome?.[era] ?? decision.outcome;
  const outcome =
    choice.useAccessible && (baseOutcome === "excelled" || baseOutcome === "managed")
      ? "accessible-complete"
      : baseOutcome;
  const narrative = withAccess(decision.eraNarrative?.[era] ?? decision.narrative, activity, choice.useAccessible);
  const decisionEffects = decision.eraEffects?.[era] ?? decision.effects;
  const effects = effectsFor(activity, decisionEffects, festival, era, choice.useAccessible, false);
  const flags = [...(decision.flags ?? []), ...effects.flatMap((effect) => (effect.flag ? [effect.flag] : []))];

  return {
    activityId: activity.id,
    moduleId: activity.moduleId,
    source: "authored-fixture",
    integration: "fixture-pending",
    fixtureLabel: fixtureLabel(activity.moduleId),
    decisionId: decision.id,
    approach: decision.approach,
    useAccessible: choice.useAccessible,
    outcome,
    narrative,
    rivalLines: effects.map((effect) => ({
      rivalId: effect.rivalId,
      line: effect.line,
      delta: effect.delta,
      flag: effect.flag,
    })),
    flags,
  };
}
