/**
 * Life, room reset, and fourteen-year persistence.
 * This is the model the combat records already point at.
 * It is not a save-system implementation.
 */

export function freshWorld(startYear = 1990) {
  return { life: 1, year: startYear, remnants: [], flags: {} };
}

export function roomReset(enemy) {
  if (!enemy.alive || enemy.spared || enemy.resolved) return { ...enemy, reset: false };
  return {
    ...enemy,
    hp: enemy.maxHp,
    state: enemy.initial,
    flags: {},
    reset: true,
  };
}

export function resolveOutcome(world, enemy) {
  const life = enemy.lifecycle;
  if (!enemy.alive) {
    const death = life.on_death;
    world.remnants.push({
      id: death.remnant,
      persist: death.persist,
      drop: death.drop || null,
      forfeit: death.forfeit || null,
      since_life: world.life,
    });
    if (death.forfeit) world.flags[death.forfeit] = true;
    return world;
  }
  if (enemy.spared || enemy.resolved) {
    const spare = life.on_spare;
    world.remnants.push({
      id: spare.remnant,
      persist: spare.persist,
      drop: spare.drop || null,
      flag: spare.flag || null,
      since_life: world.life,
    });
    if (spare.flag) world.flags[spare.flag] = true;
  }
  return world;
}

export function onEllisDeath(world) {
  world.life += 1;
  world.year += 14;
  world.flags.aged = true;
  return world;
}

export function remnantVisible(remnant, world) {
  if (remnant.persist === "permanent") return true;
  if (remnant.persist === "this_life") return remnant.since_life === world.life;
  if (remnant.persist === "fourteen_years") return world.life <= remnant.since_life + 1;
  return false;
}
