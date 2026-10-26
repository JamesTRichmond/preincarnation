import { CATALOG } from "./catalog.ts";
import { analyze } from "./logic.ts";
import type { TrackingContext } from "./types.ts";

export type FieldbookCard = {
  sentence: string;
  netId: string | null;
  glassId: string | null;
};

export function fieldbookCard(ctx: TrackingContext): FieldbookCard {
  const analysis = analyze(CATALOG, ctx);
  const part = analysis.components.find((c) => c.id === "copper-fitting");
  const net = analysis.visibleObjects.find((o) => o.instanceId === "inst-june-net");
  const glass = analysis.visibleObjects.find((o) => o.instanceId === "inst-maeve-glass");
  const netId = net?.instanceId ?? null;
  const glassId = glass?.instanceId ?? null;
  if (!part || part.owned + part.contained.reduce((sum, object) => sum + object.quantity, 0) === 0) {
    return {
      sentence: "The field book is empty. What you have not seen stays off the page.",
      netId,
      glassId,
    };
  }
  const claims = part.neededBy.filter((need) => need.tagged && need.role === "chosen" && need.covered > 0);
  const shorts = part.neededBy.filter((need) => need.tagged && need.role === "chosen" && need.short > 0);
  const keeper = Math.min(part.desiredReserve, part.owned);
  const claimText = claims.map((need) => `${need.covered} for ${need.projectName.toLowerCase()}`).join(", ");
  const shortText = shorts.map((need) => `${need.projectName} still needs ${need.short}`).join(". ");
  const sentence = [
    `${part.owned} ${part.name.toLowerCase()} in the bag.`,
    keeper > 0 ? `${keeper} stayed in the keeper's reserve.` : "",
    claimText ? `${claimText.charAt(0).toUpperCase()}${claimText.slice(1)}.` : "",
    shortText ? `${shortText}. That stock is not counted twice.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return { sentence, netId, glassId };
}
