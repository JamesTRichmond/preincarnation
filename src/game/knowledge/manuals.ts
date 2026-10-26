import { lootId } from "./ids.ts";
import { ACTIONS, ITEM_LABELS } from "./recipes.ts";
import type { Manual, PlateMotif, SupportedAction } from "./types.ts";

const ROWS: Array<[string, PlateMotif, string, string, string]> = [
  [
    "Pitch Lamp",
    "lamp",
    "recipe.knowledge.pitch-lamp",
    "Warm the spruce resin until it slumps and shines but does not boil or spit. Seat a dry wick fiber so a thumb's width stands clear of the cup, then spend one heat charge on the lip.",
    "If the flame climbs the resin instead of the wick, pinch it out and trim the wick fiber shorter.",
  ],
  [
    "Iron Gall Ink",
    "ink",
    "recipe.knowledge.iron-gall",
    "Crush the oak gall to grit, wet it with water, and stir in the iron flake a pinch at a time. Stop when the water goes from tea-brown to a blue black that stains the nail.",
    "Pale grey means the iron flake has not bitten yet. Give it time, not more water.",
  ],
  [
    "Cedar Steam",
    "steam",
    "recipe.knowledge.cedar-steam",
    "Bruise the cedar sprig so the oil shows, set it in a cup of water, and spend a heat charge until the steam smells of the wood rather than of wet dust.",
    "A harsh, dry smell means the water is gone and you are scorching the sprig. Add nothing else; start again.",
  ],
  [
    "First Boil",
    "boil",
    "recipe.knowledge.first-boil",
    "Pour two measures of maple sap into a wide pan with one heat charge under it. Keep the boil at the edges, not a rolling middle, until a drop on a cold plate holds a soft bead.",
    "If the bead turns to gravel, you have gone past sugar cake into burnt sugar. The plate is the only honest clock.",
  ],
  [
    "Snow Print",
    "print",
    "interaction.knowledge.snow-print",
    "Cut a square from the snow tray where the track is sharpest, before sun rounds the edges. Read the toes: four, no claw mark, an oval pad — that is the fox, and it belongs in the book.",
    "A melted tray lies. Do not guess a track you cannot still see.",
  ],
  [
    "Flute Tuning",
    "flute",
    "interaction.knowledge.tune-flute",
    "Sound the bone flute against the bench tone and slide the plug until the beats slow and stop ten cents flat. Flat is the winter seat; sharp will fight the lyre later.",
    "If you hear a fast shimmer, you are still far off. Move the plug less than you think.",
  ],
  [
    "Wick Braid",
    "braid",
    "recipe.knowledge.wick-braid",
    "Take three lengths of fiber, knot them, and braid tight enough that light shows through no gap. The finished wick fiber should feel like cord, not like hair.",
    "A loose braid drinks resin too fast and drowns. Unpick it rather than dip it.",
  ],
  [
    "Beech Ash Wash",
    "wash",
    "recipe.knowledge.beech-wash",
    "Set beech ash in a cloth and pour water through once, slowly. The liquor that comes off is the lye wash: slick between the fingers, not gritty.",
    "A second pour is only dirty water. Do not call it wash.",
  ],
  [
    "Deer-Fat Dip",
    "dip",
    "recipe.knowledge.deer-dip",
    "Render the deer fat clear, keep one heat charge under it, and dip the wick fiber, cooling between dips, until the candle stands without a bend.",
    "Cloudy fat smokes and spits. Strain it before the wick fiber goes in.",
  ],
  [
    "Needle Rub",
    "rub",
    "recipe.knowledge.needle-rub",
    "Chop the spruce needle fine and work it into the deer fat until the fat smells of the tree and not of the animal. A small nut of it on the chest is the dose.",
    "Whole needles do not release. If you can still see the shape of the needle, keep chopping.",
  ],
  [
    "Birch Peel",
    "peel",
    "recipe.knowledge.birch-peel",
    "Lift paper bark in curls with the grain, never a full ring around the trunk. The curls are kindling; they take a coal without another stick.",
    "A ringed birch dies. Leave the green underbark alone.",
  ],
  [
    "Hide Smoke",
    "smoke",
    "recipe.knowledge.hide-smoke",
    "Hang the hide where it can take smoke and not flame, and spend a heat charge of punk wood under it until the skin side turns a deep tea color.",
    "A black crust is scorch, not smoke. Lower the hide or you will lose the shelter in it.",
  ],
  [
    "Drum Damp",
    "drum",
    "interaction.knowledge.damp-drum",
    "Wipe the drum head with a barely wet cloth and wait until the ring shortens to a knock. You want the head damp, not soaked, or the frame drum goes mute.",
    "If the knock disappears entirely, warm the head by the hearth from a distance and test again.",
  ],
  [
    "Salt Draw",
    "salt",
    "recipe.knowledge.salt-draw",
    "Bury the berry in salt in a crock, not a heap on a plate. By morning the salt has drawn the water and the preserved berry is smaller and dull-skinned.",
    "A wet pool on top means too little salt. Add salt, do not pour the water off and hope.",
  ],
  [
    "Coal Bank",
    "coal",
    "interaction.knowledge.coal-bank",
    "Bury live coal in a bed of beech ash deep enough that no red shows. The bank holds two heat for the next match if you do not rake it open to look.",
    "Ash that is still black has not covered the coal. Add beech ash until the surface is grey and quiet.",
  ],
  [
    "Ink Press",
    "press",
    "recipe.knowledge.ink-press",
    "Pour the ink vial into a shallow tin, spend a heat charge, and press until the cake lifts clean from the tin with a knife point.",
    "A sticky cake was taken off the heat too soon. It will sour the page.",
  ],
  [
    "Thaw Watch",
    "notch",
    "interaction.knowledge.thaw-watch",
    "At dawn, cut one notch where the icicle ended yesterday. If today's point sits above the notch, the thaw has started and the next match may take a frost ward.",
    "A notch cut at noon lies about the night. Dawn only.",
  ],
  [
    "Lyre Peg",
    "peg",
    "interaction.knowledge.lyre-peg",
    "Turn the lyre peg a quarter turn sharp of the bench tone, eight cents, and pinch the string so the new seat holds. Sharp here is deliberate; the cold will pull it back.",
    "A peg that creeps has no resin on the shaft. A dry peg will not keep the cents you just set.",
  ],
  [
    "Sap Knot",
    "knot",
    "interaction.knowledge.sap-knot",
    "Tie the sap line with a knot that can be undone with one hand in the cold. A true knot marks two sugar cells you may reveal on a board; a jammed knot marks nothing.",
    "If you need a knife to open it, it is the wrong knot for a maple lane.",
  ],
  [
    "Resin Wrap",
    "wrap",
    "recipe.knowledge.resin-wrap",
    "Warm a thread of spruce resin and wind it with sinew around the split, each turn biting the last. The finished mend kit should ring when you tap it, not bend.",
    "A wrap that stays tacky was too thick. Warm it once more and draw off the excess.",
  ],
];

export const MANUALS: Manual[] = ROWS.map((row, i) => ({
  id: lootId(61 + i),
  title: row[0],
  motif: row[1],
  actionId: row[2],
  procedure: row[3],
  caution: row[4],
}));

export const MANUALS_BY_ID = new Map(MANUALS.map((manual) => [manual.id, manual]));

export function manualForAction(actionId: string): Manual | undefined {
  return MANUALS.find((manual) => manual.actionId === actionId);
}

export type ManualStep = { heading: string; body: string };

export function manualSteps(manual: Manual, action: SupportedAction = mustAction(manual.actionId)): ManualStep[] {
  const inputs = action.inputs.map((item) => `${item.n} ${ITEM_LABELS[item.id] ?? item.id}`).join(", ");
  const tools = action.tools.map((id) => ITEM_LABELS[id] ?? id).join(", ");
  const outputs = action.outputs.map((item) => `${item.n} ${ITEM_LABELS[item.id] ?? item.id}`).join(", ");
  const lay = [
    inputs ? `Set out ${inputs}.` : "Nothing is consumed from the pantry.",
    tools ? `Keep the ${tools} at hand; it is not used up.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return [
    { heading: "Lay the bench", body: `Work at the ${action.station}. ${lay}` },
    { heading: "Do the work", body: manual.procedure },
    {
      heading: "Know it worked",
      body: `${manual.caution} When it is right, ${action.resultPhrase}.${outputs ? ` You take ${outputs}.` : ""}`,
    },
  ];
}

function mustAction(id: string): SupportedAction {
  const action = ACTIONS.find((item) => item.id === id);
  if (!action) throw new Error(`missing action ${id}`);
  return action;
}
