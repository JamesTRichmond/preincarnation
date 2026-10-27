import { compileRoster } from "./compile.js";
import { RECORDS } from "./records.js";

/** The forty ordinary enemies. Compiled once. Do not concat the scratch roster. */
export const enemies = compileRoster(RECORDS);

export function enemyById(id) {
  const found = enemies.find((enemy) => enemy.id === id);
  if (!found) throw new Error(`No ordinary enemy ${id}`);
  return found;
}

export const ENEMY_INDEX = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy]));
