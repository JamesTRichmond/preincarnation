import { lootId } from "./ids.ts";

export interface Preset {
  id: string;
  label: string;
  scene: "counter" | "coat" | "crate" | "charm" | "net" | "gates";
  equip: number[];
  blurb: string;
}

/** Sixteen live demonstrations, spanning every equipment category. */
export const PRESETS: Preset[] = [
  { id: "fault", label: "Fault line", scene: "counter", equip: [1], blurb: "Time a counter. Only the true window opens stone." },
  { id: "coat", label: "Stored shot", scene: "coat", equip: [25, 97, 36], blurb: "Block once, refuse a second, release along the flow." },
  { id: "belt", label: "Quarry belt", scene: "crate", equip: [26, 106], blurb: "The same shove slides on grain instead of tumbling." },
  { id: "charm", label: "Glass charm", scene: "charm", equip: [49, 118], blurb: "Mark a flagged tile. Hitstun and locked doors stay honest." },
  { id: "net", label: "Net mouth", scene: "net", equip: [73], blurb: "Barbed heads stay in. Plain bolts fall through." },
  { id: "cheek", label: "Wedge cheek", scene: "gates", equip: [75], blurb: "A slanted seam opens. The square seam will not, until the cheek comes off." },
  { id: "stake", label: "Lantern stake", scene: "gates", equip: [115, 5], blurb: "Light stays where the lantern tool is planted, and nowhere the tool is not." },
  { id: "reserve", label: "Hand reserve", scene: "counter", equip: [119], blurb: "The off-hand is kept for the pry. A two-handed bill will not equip." },
  { id: "buckle", label: "Form buckle", scene: "gates", equip: [112, 30], blurb: "A burrow form stows the collar into the pack instead of deleting it." },
  { id: "packet", label: "Death packet", scene: "counter", equip: [120, 1], blurb: "Die with the packet and the saber stays in hand. Without it, the saber is only set down." },
  { id: "nodouble", label: "No double slide", scene: "crate", equip: [7, 26], blurb: "Hammer and belt share one grain slide. The distance does not add." },
  { id: "fork", label: "Tide fork", scene: "net", equip: [14], blurb: "Flowing debris can be set downstream. Bolts glance off." },
  { id: "keybell", label: "Keybell", scene: "gates", equip: [56], blurb: "The bell names a missing key. The lock does not care." },
  { id: "cradle", label: "Rest cradle", scene: "counter", equip: [110, 13], blurb: "The spike spends its warmth. A rest fills it. Nothing breaks." },
  { id: "sling", label: "Two-hand sling", scene: "crate", equip: [111, 7], blurb: "The hammer rides the back and does not strike until you take the sling off." },
  { id: "thread", label: "Counter thread", scene: "counter", equip: [1, 62], blurb: "The thread widens the saber window once. It does not stack into a bigger window." },
];

export function presetIds(preset: Preset): string[] {
  return preset.equip.map((n) => lootId(n));
}
