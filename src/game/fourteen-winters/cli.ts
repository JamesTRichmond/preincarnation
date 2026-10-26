import { PERSONALITIES } from "./decks.ts";
import { fuzzMatch, simulateIdentities, simulateOpponents } from "./simulate.ts";

for (let seed = 1; seed <= 12; seed++) {
  const done = fuzzMatch(seed, 3);
  if (done.phase !== "over") throw new Error(`fuzz ${seed} open`);
}

const report = simulateIdentities([1, 2]);
const personalities = simulateOpponents(PERSONALITIES, [1, 2, 3, 4]);
const wins = new Map<string, { w: number; l: number; d: number }>();
for (const result of personalities.results) {
  const row = wins.get(result.north) ?? { w: 0, l: 0, d: 0 };
  if (result.winner === "draw") row.d += 1;
  else if (result.winner === 1) row.w += 1;
  else row.l += 1;
  wins.set(result.north, row);
}

console.log(JSON.stringify({
  fuzz: 12,
  identities: report,
  opponentInvalid: personalities.invalid,
  opponentGames: personalities.results.length,
  opponents: Object.fromEntries(wins),
}, null, 2));
