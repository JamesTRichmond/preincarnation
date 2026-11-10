export function death({ mid, carry = [], lose = [], unresolved, resolved, sets = {} }) {
  return {
    ifEllisDiesMidQuest: mid,
    flagsCarriedOnDeath: carry,
    flagsLostOnDeath: lose,
    onEraAdvanceIfUnresolved: unresolved,
    onEraAdvanceIfResolved: resolved,
    setsOnDeath: sets,
  };
}

export function reward(kind, id, detail) {
  return { kind, id, detail };
}
