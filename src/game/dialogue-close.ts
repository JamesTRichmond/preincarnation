import type { SaveData } from "./types.ts";

/**
 * NPC line selection extracted from the engine so save flags, cycle, and
 * dialogue ids stay one contract. Returns null when the caller should use
 * the static NPC_NODE fallback.
 */
export function selectNpcDialogue(npc: string, save: SaveData): string | null {
  const f = save.flags;
  if (npc === "elder") {
    if (f.elderFate) return f.elderFate === "release" ? "elder_release" : "elder_bind";
    if (save.cycle >= 1) return "elder_return";
    if (save.character.bondId === "maeve") return "elder_bond";
    return "elder_1";
  }
  if (npc === "farmer") {
    if (f.farmerHelped) return "farmer_done";
    if (f.sheepFound) return "farmer_sheep";
    if (save.cycle >= 1) return "farmer_return";
    if (save.character.bondId === "perch") return "farmer_bond";
    return "farmer_1";
  }
  if (npc === "mayor") {
    if (f.millFate) return f.millFate === "spare" ? "mayor_spare" : "mayor_condemn";
    if (save.cycle >= 1) return "mayor_return";
    return "mayor_1";
  }
  if (npc === "shop") return f.bombs > 0 ? "shop_buy" : "shop_1";
  if (npc === "sentinel") {
    if (f.sentinelFate) return f.sentinelFate === "release" ? "sentinel_release" : "sentinel_crown";
    return "sentinel_1";
  }
  if (npc === "resident") {
    if (f.residentFate) return f.residentFate === "release" ? "resident_release" : "resident_bind";
    return "resident_1";
  }
  if (npc === "sugar") return f.syrupStash ? "sugar_tin" : "sugar_1";
  if (npc === "heart") {
    if (f.spectrumFate) return f.spectrumFate === "release" ? "heart_release" : "heart_bind";
    return "heart_1";
  }
  return null;
}

/** Credits arm on the fate choice; they fire only when that thread closes. */
export function creditsOnClose(closingNodeId: string, armed: boolean): boolean {
  return armed && (closingNodeId === "heart_release" || closingNodeId === "heart_bind");
}
