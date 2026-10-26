import type { StayReason } from "./types.ts";

export function stayHeadline(reason: StayReason): string {
  switch (reason) {
    case "favorite":
      return "Stays in the pack because it is a favorite.";
    case "equipped":
      return "Stays in the pack because it is equipped.";
    case "reserved-supply":
      return "Stays in the pack because you reserved it.";
    case "no-matching-rule":
      return "Stays in the pack because nothing claims it.";
    case "destination-full":
      return "Stays in the pack because the destination is full.";
    case "no-automation-slot":
      return "Stays in the pack because only reserved slots are left.";
    case "destination-excluded":
      return "Stays in the pack because the destination is excluded.";
    case "destination-deleted":
      return "Stays in the pack because the destination is gone.";
    case "destination-missing":
      return "Stays in the pack because that container has not been visited.";
    case "not-visited":
      return "Stays in the pack because you have not visited the destination.";
    case "not-owned":
      return "Stays in the pack because the destination is not yours.";
    case "not-nearby":
      return "Stays in the pack because the destination is not nearby.";
    case "shared-not-established":
      return "Stays in the pack because shared storage is not established.";
    case "interrupted":
      return "Stays in the pack because the transfer was interrupted.";
  }
}

export function blockPhrase(containerName: string, reason: StayReason): string {
  switch (reason) {
    case "destination-full":
      return `${containerName} is full.`;
    case "no-automation-slot":
      return `${containerName} is holding the open slots in reserve.`;
    case "destination-excluded":
      return `${containerName} is excluded.`;
    case "destination-deleted":
      return `${containerName} is gone.`;
    case "destination-missing":
      return `${containerName} is not a container you have visited.`;
    case "not-visited":
      return `You have not visited ${containerName}.`;
    case "not-owned":
      return `${containerName} is not yours.`;
    case "not-nearby":
      return `${containerName} is not nearby.`;
    case "shared-not-established":
      return `${containerName} is not shared with you.`;
    case "interrupted":
      return "The transfer stopped.";
    default:
      return `${containerName} cannot take it.`;
  }
}

export function describeMove(
  quantity: number,
  name: string,
  destName: string,
  ruleName: string | null,
  priorBlocks: string[],
): string {
  const via = ruleName ? ` (${ruleName})` : "";
  const skipped = priorBlocks.length > 0 ? ` Skipped: ${priorBlocks.join(" ")}` : "";
  return `${quantity} ${name} → ${destName}${via}.${skipped}`;
}
