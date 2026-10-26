// @ts-nocheck
/** Shared numbers for records, simulation, and tests. Change them here only. */

export const LIMITS = {
  multCap: 2.5,
  multCapReduced: 1.5,
  maxProjectiles: 12,
  maxProjectilesReduced: 6,
  maxBlossoms: 8,
  maxBlossomsReduced: 4,
  maxMarks: 6,
  maxTethers: 6,
  maxStakes: 3,
  wreathMax: 4,
  wreathBossMax: 2,
  wreathPerLoop: 0.25,
  wreathDecay: 4,
  chainMax: 4,
  chainMaxReduced: 2,
  chainGap: 68,
  offscreenGrace: 1,
  needlePerp: 56,
  needlePairAlong: 96,
  sapReach: 96,
  meleeRange: 54,
  meleeArc: 1.05,
  cleanSpeed: 44,
  cleanAngle: 0.24,
  arrowSpeed: 460,
  arrowLife: 0.9,
  arrowDamage: 12,
  meleeDamage: 10,
  ellisSpeed: 178,
  foeSpeed: 64,
  bossSpeed: 44,
  dash: 92,
  iframe: 0.18,
  blossomArm: 0.8,
  blossomLife: 5.2,
  blossomR: 32,
  fanAngles: [-28, -14, 0, 14, 28],
  fanAnglesReduced: [-20, 0, 20],
  fanSpeed: 390,
  fanDamage: 5,
  fanLife: 0.4,
  pressureDrain: 12,
  pressureTension: 48,
  pressureMax: 3,
  pressureReach: 96,
  kilnCost: 30,
  kilnTime: 0.7,
  canopyTime: 1.1,
  canopyCost: 40,
  sugarhouseTime: 1.4,
  sugarhouseSap: 50,
  sugarhouseDur: 2.2,
  sugarhouseDurReduced: 1.4,
  titheDur: 10,
  quenchCd: 6,
  quenchRadius: 80,
  wintersPierceReduced: 4,
  markLife: 8,
  tetherDuration: 8,
  leaseDuration: 7,
  glassArm: 0.45,
  stakeChannel: 0.25,
  glassChannel: 0.35,
  prepareDelay: 0.45,
  wintersHold: 0.3,
  bloomBase: 11,
  glassBurst: 14,
  kindlingFlat: 8,
  wickMul: 1.4,
  lanternMul: 1.2,
  bossBloom: 0.5,
  bossSeparate: 0.4,
  bossSugarhouseIgnored: true,
};

export const COSTS = {
  thread: 18,
  threadRefund: 8,
  wreathOpen: 10,
  wreathLoop: 4,
  commonEcho: 10,
  stake: 14,
  stakeRefund: 7,
  secondTap: 8,
  slack: 12,
  glass: 16,
  tithe: 8,
  lease: 15,
  canopy: 40,
  canopyRefundHit: 15,
  canopyRefundWhiff: 30,
  sugarhouseForfeit: 10,
  orchard: 12,
  handful: 16,
  lastArrow: 10,
  lastArrowRefund: 4,
  kiln: 30,
  letter: 8,
  bank: 6,
  ashStep: 5,
  ashStepPromote: 15,
  split: 14,
  lantern: 11,
  winters: 25,
  wintersRefund: 8,
  soot: 9,
  titheGainMax: 12,
};

export function isReduced(world) {
  return !!world.settings?.reducedEffects;
}

export function multCapOf(world) {
  return isReduced(world) ? LIMITS.multCapReduced : LIMITS.multCap;
}

export function projectileCapOf(world) {
  return isReduced(world) ? LIMITS.maxProjectilesReduced : LIMITS.maxProjectiles;
}

export function blossomCapOf(world) {
  return isReduced(world) ? LIMITS.maxBlossomsReduced : LIMITS.maxBlossoms;
}

export function chainMaxOf(world) {
  return isReduced(world) ? LIMITS.chainMaxReduced : LIMITS.chainMax;
}
