import type { Container, World } from "./types.ts";

export type AccessVerdict = "ok" | "no-access" | "unavailable";

export function containerAccess(
  container: Container,
  crafterId: string,
  purpose: "draw" | "deposit",
): AccessVerdict {
  if (
    !container.available ||
    container.kind === "locked" ||
    container.kind === "out-of-range" ||
    container.kind === "unloaded"
  ) {
    return "unavailable";
  }
  if (container.kind === "foreign") return "no-access";
  if (container.kind !== "carried" && container.kind !== "approved") return "no-access";
  if (container.kind === "carried" && container.ownerId !== crafterId) return "no-access";

  const ownerOk = container.ownerId === crafterId || container.ownerId === "shared";
  const grants = purpose === "draw" ? container.accessGrants : container.depositGrants;
  if (!ownerOk && !grants.includes(crafterId)) return "no-access";
  return "ok";
}

/** Empty candidate list is the belt only — never every approved chest. */
export function resolveCandidateIds(world: World, crafterId: string, requested?: string[]): string[] {
  if (!requested || requested.length === 0) {
    return world.containers
      .filter((container) => container.kind === "carried" && container.ownerId === crafterId)
      .map((container) => container.id);
  }
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of requested) {
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function orderedContainers(world: World, candidateIds: string[], crafterId: string): Container[] {
  const carried: Container[] = [];
  const rest: Container[] = [];
  const seen = new Set<string>();
  for (const id of candidateIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const container = world.containers.find((entry) => entry.id === id);
    if (!container) continue;
    if (container.kind === "carried" && container.ownerId === crafterId) carried.push(container);
    else rest.push(container);
  }
  return [...carried, ...rest];
}

export function stalenessToken(world: World, candidateIds: string[]): string {
  const parts: string[] = [`r${world.revision}`];
  const ids = [...candidateIds].sort();
  for (const id of ids) {
    const container = world.containers.find((entry) => entry.id === id);
    if (!container) {
      parts.push(`${id}:missing`);
      continue;
    }
    const stacks = container.stacks
      .map(
        (stack) =>
          `${stack.instanceId}@${stack.qty}:${stack.itemId}:${stack.protection.kind}:${stack.provenance.kind}:${stack.ownerId}:${stack.condition ?? ""}`,
      )
      .join("+");
    parts.push(
      `${id}:${container.available ? 1 : 0}:${container.kind}:${container.capacitySlots}:${stacks}`,
    );
  }
  return parts.join("|");
}
