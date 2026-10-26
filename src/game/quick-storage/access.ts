import type { StayReason, StorageContainer } from "./types.ts";

/** Why automation and manual placement must refuse this container. Pack is never a deposit destination. */
export function accessBlock(container: StorageContainer | undefined): StayReason | null {
  if (!container) return "destination-missing";
  if (container.kind === "pack") return "destination-excluded";
  if (container.access.deleted) return "destination-deleted";
  if (container.kind === "shared-material") {
    if (!container.access.sharedEstablished) return "shared-not-established";
    return null;
  }
  if (!container.access.visited) return "not-visited";
  if (!container.access.owned) return "not-owned";
  if (!container.access.nearby) return "not-nearby";
  return null;
}
