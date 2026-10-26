import type { Stats } from "./types.ts";

export const SCENARIO_IDS = [
  "quarry-dark",
  "creek-flood",
  "orchard-beast",
  "taproom-brawl",
  "hearing",
  "long-cold",
] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export type ScenarioDef = {
  id: ScenarioId;
  name: string;
  enemy: string;
  hp: number;
  atk: number;
  blurb: string;
};

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  "quarry-dark": {
    id: "quarry-dark",
    name: "Quarry after dark",
    enemy: "Night seam",
    hp: 130,
    atk: 6,
    blurb: "No light, no honest swing. Oil runs out unless a bargain says otherwise.",
  },
  "creek-flood": {
    id: "creek-flood",
    name: "Otter Creek in flood",
    enemy: "The rise",
    hp: 52,
    atk: 8,
    blurb: "The water does the hitting. Warmth is a budget.",
  },
  "orchard-beast": {
    id: "orchard-beast",
    name: "Orchard at dusk",
    enemy: "Hornet bear",
    hp: 72,
    atk: 7,
    blurb: "It wants the rows. It does not read.",
  },
  "taproom-brawl": {
    id: "taproom-brawl",
    name: "Taproom brawl",
    enemy: "The able-bodied",
    hp: 30,
    atk: 11,
    blurb: "The first swings decide the room. A capped arm arrives late.",
  },
  hearing: {
    id: "hearing",
    name: "Unscheduled hearing",
    enemy: "The rumor",
    hp: 48,
    atk: 13,
    blurb: "It hits harder than it stands. What you send back matters.",
  },
  "long-cold": {
    id: "long-cold",
    name: "The long cold",
    enemy: "The night itself",
    hp: 70,
    atk: 4,
    blurb: "Attrition. Warmth and a little breath, or you finish early.",
  },
};

export type TraceRow = {
  round: number;
  hp: number;
  mp: number;
  oil: number;
  warmth: number;
  out: number;
  incoming: number;
  lit: boolean;
  healed: number;
};

export type FightResult = {
  scenario: ScenarioId;
  rounds: number;
  win: boolean;
  hpLeft: number;
  enemyLeft: number;
  mpLeft: number;
  oilLeft: number;
  warmthLeft: number;
  healed: number;
  mpSpent: number;
  log: string[];
  trace: TraceRow[];
  reason: string;
};

export type FightOverride = {
  enemyHp?: number;
  enemyAtk?: number;
  maxRounds?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fight(stats: Stats, scenario: ScenarioId, override: FightOverride = {}): FightResult {
  const def = SCENARIOS[scenario];
  const maxRounds = override.maxRounds ?? 24;
  let hp = stats.maxHp;
  let mp = stats.maxMp;
  let oil = stats.oilCap;
  let warmth = stats.warmth;
  let ehp = override.enemyHp ?? def.hp;
  const enemyAtk = override.enemyAtk ?? def.atk;
  const trace: TraceRow[] = [];
  const log: string[] = [];
  let healed = 0;
  let mpSpent = 0;
  let rounds = 0;

  for (let round = 1; round <= maxRounds; round += 1) {
    if (hp <= 0 || ehp <= 0) break;
    rounds = round;
    const lit = stats.light > 0 && (stats.oilDrain <= 0 || oil > 0);
    if (stats.oilDrain > 0) oil = Math.max(0, oil - stats.oilDrain);

    let env = 0;
    if (scenario === "creek-flood" || scenario === "long-cold") {
      const bite = scenario === "creek-flood" ? 7 : 5;
      env += Math.max(0, bite - Math.floor(warmth));
      warmth = Math.max(0, warmth - 1);
    }
    if (scenario === "quarry-dark" && !lit) env += 3;

    let out = stats.atk * stats.haste;
    if (scenario === "quarry-dark") out *= lit ? 1.45 : 0.4;
    if (scenario === "quarry-dark") out *= 1 + Math.max(0, stats.chipOut) * 0.12;
    if (scenario === "creek-flood") out *= 1 + Math.max(0, stats.wetOut) + Math.max(0, stats.frostOut) * 0.35;
    if (scenario === "orchard-beast") {
      out *= 1 + Math.max(0, stats.beastOut);
      if (stats.namedOnly > 0) out *= 0.4;
    }
    if (scenario === "taproom-brawl" && round === 1) out *= 1 + Math.max(0, stats.burst) + Math.max(0, stats.opening);
    if (scenario === "hearing") out *= 1 + Math.max(0, stats.hearingOut) * 0.5;
    if (scenario === "long-cold") out *= 1 + Math.max(0, stats.frostOut) * 0.3;
    if (stats.dmgCap < 900) out = Math.min(out, stats.dmgCap);
    out = Math.max(0, out);

    let incoming = enemyAtk;
    if (scenario === "quarry-dark" && lit) incoming *= 0.82;
    const guard = clamp(stats.guard, 0, 0.62);
    incoming *= 1 - guard;
    if (scenario === "creek-flood") incoming *= Math.max(0.2, 1 + stats.soakVuln);
    if (scenario === "long-cold") incoming *= 1 + Math.max(0, stats.burnVuln);
    incoming += env;
    incoming = Math.max(0, incoming);

    const reflectDmg = stats.reflect > 0 ? Math.min(stats.reflect, incoming) : 0;
    let roundHeal = 0;
    if (stats.sustain > 0 && mp >= 0.5) {
      const healAmt = Math.min(stats.sustain, mp * 2);
      const cost = healAmt / 2;
      mp -= cost;
      mpSpent += cost;
      roundHeal = healAmt;
      healed += healAmt;
      hp = Math.min(stats.maxHp, hp + healAmt);
    }

    ehp -= out + reflectDmg;
    hp -= incoming;
    mp = clamp(mp + stats.mpRegen, 0, stats.maxMp);
    oil = clamp(oil, 0, stats.oilCap);

    trace.push({
      round,
      hp,
      mp,
      oil,
      warmth,
      out,
      incoming,
      lit,
      healed: roundHeal,
    });
    log.push(
      `R${round} ${lit ? "lit" : "dark"} out ${out.toFixed(1)} back ${reflectDmg.toFixed(1)} in ${incoming.toFixed(1)} hp ${hp.toFixed(1)} oil ${oil.toFixed(1)}`,
    );
  }

  const win = ehp <= 0 && hp > 0;
  let reason: string;
  if (win) reason = `${def.enemy} breaks in ${rounds} rounds.`;
  else if (hp <= 0 && ehp <= 0) reason = "You trade the last blow and lose the trade.";
  else if (hp <= 0) reason = `${def.enemy} is still standing.`;
  else reason = `The minute ends. ${def.enemy} remains.`;

  return {
    scenario,
    rounds,
    win,
    hpLeft: hp,
    enemyLeft: ehp,
    mpLeft: mp,
    oilLeft: oil,
    warmthLeft: warmth,
    healed,
    mpSpent,
    log,
    trace,
    reason,
  };
}

export function fightScore(result: FightResult): number {
  if (!result.win) return -800 + result.rounds * 25 + result.hpLeft;
  return 1000 + result.hpLeft * 2 - result.rounds;
}
