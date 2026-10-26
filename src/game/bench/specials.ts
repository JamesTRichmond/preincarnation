import type { InputSpec, ModifyChoice, Recipe, StatId } from "./types.ts";
import { SUBSTITUTIONS } from "./substitutions.ts";

function mat(catalogId: string, qty = 1): InputSpec {
  return { catalogId, qty, consume: "all", role: "material" };
}

function tool(catalogId: string, minCondition = 8): InputSpec {
  return { catalogId, qty: 1, consume: "tool", role: "tool", minCondition };
}

function primary(catalogId: string, minCondition = 1): InputSpec {
  return { catalogId, qty: 1, consume: "none", role: "primary", minCondition };
}

function wearPrimary(catalogId: string): InputSpec {
  return { catalogId, qty: 1, consume: "wear", role: "primary", minCondition: 1 };
}

function subsFor(inputs: InputSpec[]) {
  const ids = new Set(inputs.filter((i) => i.role === "material").map((i) => i.catalogId));
  return SUBSTITUTIONS.filter((s) => ids.has(s.forCatalogId));
}

function choice(
  id: string,
  name: string,
  summary: string,
  axis: string,
  stats: Partial<Record<StatId, number>>,
  extra: InputSpec[] = [],
): ModifyChoice {
  return { id, name, summary, axis, stats, extraInputs: extra };
}

const cost = (minutes: number, focus: number, toolWear = 0) => ({ minutes, focus, toolWear });

function restore(p: {
  slug: string;
  name: string;
  summary: string;
  target: string;
  inputs: InputSpec[];
  delta: number;
  history: string;
  success: string;
  partial?: string;
  recovery: string;
  tags: string[];
  minutes?: number;
  focus?: number;
  wear?: number;
  heirloom?: boolean;
}): Recipe {
  const inputs = [primary(p.target), ...p.inputs];
  return {
    id: `op.restore.${p.slug}`,
    kind: "restore",
    name: p.name,
    summary: p.summary,
    inputs,
    outputs: [{ catalogId: p.target, qty: 1, identity: "retain-primary", conditionDelta: p.delta }],
    substitutions: subsFor(inputs),
    cost: cost(p.minutes ?? 35, p.focus ?? 3, p.wear ?? (inputs.some((i) => i.role === "tool") ? 2 : 0)),
    feedback: {
      success: p.success,
      partial: p.partial ?? "The piece was too far gone for a full mend. It is still itself, and only half the gain took.",
      fail: "Nothing was spent. The piece is as it was.",
    },
    failure: { onLowCondition: "partial", recovery: p.recovery },
    historyLine: p.history,
    batchable: !p.heirloom,
    tags: p.tags,
  };
}

function maintain(p: {
  slug: string;
  name: string;
  summary: string;
  target: string;
  inputs?: InputSpec[];
  delta: number;
  success: string;
  recovery: string;
  tags: string[];
  consumePrimary?: boolean;
}): Recipe {
  const inputs = [p.consumePrimary ? wearPrimary(p.target) : primary(p.target), ...(p.inputs ?? [])];
  return {
    id: `op.maintain.${p.slug}`,
    kind: "maintain",
    name: p.name,
    summary: p.summary,
    inputs,
    outputs: [{ catalogId: p.target, qty: 1, identity: "retain-primary", conditionDelta: p.delta }],
    substitutions: subsFor(inputs),
    cost: cost(15, 1, 0),
    feedback: { success: p.success, fail: "Nothing was spent." },
    failure: {
      onLowCondition: "partial",
      recovery: p.recovery,
    },
    historyLine: p.success,
    batchable: true,
    tags: p.tags,
  };
}

function modify(p: {
  slug: string;
  name: string;
  summary: string;
  target: string;
  choices: ModifyChoice[];
  history: string;
  tags: string[];
  heirloom?: boolean;
}): Recipe {
  const inputs = [primary(p.target, 8)];
  return {
    id: `op.modify.${p.slug}`,
    kind: "modify",
    name: p.name,
    summary: p.summary,
    inputs,
    outputs: [{ catalogId: p.target, qty: 1, identity: "retain-primary", conditionDelta: 0 }],
    choices: p.choices,
    substitutions: SUBSTITUTIONS.filter((s) =>
      p.choices.some((c) => c.extraInputs?.some((i) => i.catalogId === s.forCatalogId)),
    ),
    cost: cost(30, 3, 0),
    feedback: {
      success: p.heirloom
        ? "The fitting is seated. The object is still itself — history kept, identity key unchanged."
        : "The change is a direction. It is not a better version of the same thing.",
      fail: "Nothing was changed.",
    },
    failure: {
      onLowCondition: "refuse",
      recovery: p.heirloom
        ? "Restore it first if it is too tired. Do not replace it."
        : "Undo the seated direction on this axis, or restore the piece, then choose again.",
    },
    historyLine: p.history,
    batchable: false,
    tags: p.tags,
  };
}

export function specialRecipes(): Recipe[] {
  const restores: Recipe[] = [
    restore({
      slug: "net",
      name: "Mend the river net",
      summary: "Reweave torn mesh with net twine. The needle does the passing. The net stays the net.",
      target: "fix.gear.net",
      inputs: [mat("fix.mat.net-twine", 2), mat("fix.mat.linen-thread"), tool("fix.tool.needle")],
      delta: 35,
      history: "Mesh rewoven. Holes closed. This is the same net.",
      success: "The net is mended. Same mesh, fewer holes. Identity unchanged.",
      recovery: "If the needle is dull, dress it first. The net was not cut up.",
      tags: ["fishing", "gear"],
      minutes: 45,
      focus: 4,
    }),
    restore({
      slug: "rod",
      name: "Rewrap the rod",
      summary: "New thread and resin over a tired wrap. The blank is not replaced.",
      target: "fix.gear.rod",
      inputs: [mat("fix.mat.linen-thread", 2), mat("fix.mat.resin")],
      delta: 30,
      history: "Wraps renewed over the old blank.",
      success: "Wraps renewed. The rod is the same stick you picked up.",
      recovery: "Set it in the rack. A bad wrap was not forced on.",
      tags: ["fishing", "gear"],
    }),
    restore({
      slug: "lantern",
      name: "Reseat the lantern",
      summary: "New wick, a pour of oil, glass eased back into the tin. Not a new lantern.",
      target: "fix.gear.lantern",
      inputs: [mat("fix.mat.wick"), mat("fix.mat.oil"), mat("fix.mat.rag")],
      delta: 40,
      history: "Wick and oil renewed. The body was kept.",
      success: "The lantern burns on a new wick and the old body.",
      recovery: "Leave the glass where it sits. Nothing was stripped.",
      tags: ["lamp", "gear"],
    }),
    restore({
      slug: "boots",
      name: "Oil the boots",
      summary: "Oil and wax worked into the leather. They will still be loud or quiet based on the sole you chose, not on this.",
      target: "fix.gear.boots",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.beeswax")],
      delta: 25,
      history: "Leather fed. Soles left as they were.",
      success: "The boots are fed. The sole choice, if you made one, is still there.",
      recovery: "They can wait dry. They were not pulled apart.",
      tags: ["hunting", "gear"],
    }),
    restore({
      slug: "cloak",
      name: "Patch the cloak",
      summary: "A cloth patch stitched over the tear. The cloak's cut does not change.",
      target: "fix.gear.cloak",
      inputs: [mat("fix.mat.cloth"), mat("fix.mat.linen-thread", 2), tool("fix.tool.needle")],
      delta: 30,
      history: "A patch laid in. The cloak remains.",
      success: "Patched. Same cloak, one more seam.",
      recovery: "Dress the needle if it snags. The cloth was not cut into rags.",
      tags: ["hunting", "gear"],
    }),
    restore({
      slug: "bow",
      name: "Wax the bow",
      summary: "Wax on the string nock and the belly. Draw weight is a different decision.",
      target: "fix.gear.bow",
      inputs: [mat("fix.mat.beeswax"), mat("fix.mat.rag")],
      delta: 22,
      history: "Waxed. Tillering left alone.",
      success: "The bow is waxed. It does not pull harder because of it.",
      recovery: "Hang it up. No wood was removed.",
      tags: ["hunting", "gear"],
    }),
    restore({
      slug: "spear",
      name: "Relash the spear",
      summary: "Fresh twine and resin over the head. Barbed or smooth stays as you set it.",
      target: "fix.gear.spear",
      inputs: [mat("fix.mat.twine"), mat("fix.mat.resin")],
      delta: 28,
      history: "Lashing renewed over the same head.",
      success: "Relashed. The point's character was not edited.",
      recovery: "The old lashing still holds enough. Nothing was cut free.",
      tags: ["hunting", "fishing", "gear"],
    }),
    restore({
      slug: "creel",
      name: "Reseal the creel",
      summary: "Resin and a reed where the weave opened. Initials, if it had any, are not a reed creel's to invent.",
      target: "fix.gear.creel",
      inputs: [mat("fix.mat.resin"), mat("fix.mat.reed")],
      delta: 26,
      history: "Weave closed with a reed and resin.",
      success: "The creel is tight again. Same basket.",
      recovery: "Leave the gap. It was not unwoven.",
      tags: ["fishing", "gear"],
    }),
    restore({
      slug: "belt-knife",
      name: "Hone the belt knife",
      summary: "Stone and oil. This does not pick thin or thick — that is a modification.",
      target: "fix.gear.belt-knife",
      inputs: [mat("fix.mat.oil"), tool("fix.tool.whetstone")],
      delta: 30,
      history: "Edge honed. The grind, if chosen, was respected.",
      success: "Honed. The grind you chose is still the grind.",
      recovery: "Rinse the stone if it is glazed, then return. The knife was not ground away.",
      tags: ["hunting", "gear", "edge"],
    }),
    restore({
      slug: "pack",
      name: "Restitch the pack",
      summary: "Seams walked again with thread. Straps stay wide or slim as you set them.",
      target: "fix.gear.pack",
      inputs: [mat("fix.mat.linen-thread", 3), tool("fix.tool.needle")],
      delta: 28,
      history: "Seams restitched.",
      success: "Seams hold. The pack is not a new pack.",
      recovery: "Dress the needle. The pack was not unpicked.",
      tags: ["ordinary", "gear"],
    }),
    restore({
      slug: "gaff",
      name: "Rebind the gaff",
      summary: "Twine and a leather wrap over the head. Release or hold stays a choice you already made.",
      target: "fix.gear.gaff",
      inputs: [mat("fix.mat.twine"), mat("fix.mat.leather")],
      delta: 24,
      history: "Head rebound.",
      success: "Rebound. The point was not recut.",
      recovery: "The old bind can stay. Leather was not sliced off.",
      tags: ["fishing", "gear"],
    }),
    restore({
      slug: "oilskin",
      name: "Reproof the oilskin",
      summary: "Another pass of oil and wax. It will still wet through at a seam if you made it from burlap.",
      target: "fix.sup.oilskin",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.beeswax")],
      delta: 20,
      history: "Proof renewed.",
      success: "Reproofed. Same scrap.",
      recovery: "It can stay dull. Nothing was boiled out.",
      tags: ["hunting", "lamp"],
    }),
    restore({
      slug: "arrow",
      name: "Refletch the arrow",
      summary: "A new vane and resin. The shaft is the shaft.",
      target: "fix.sup.arrow",
      inputs: [mat("fix.mat.feather"), mat("fix.mat.resin")],
      delta: 25,
      history: "Vane replaced.",
      success: "Refletched. It still flies like the shaft you have, not a better one.",
      recovery: "Leave the crooked vane. The shaft was not snapped.",
      tags: ["hunting"],
    }),
    restore({
      slug: "snare",
      name: "Rebend the snare",
      summary: "Ease the wire back to a circle and renew the anchor twine.",
      target: "fix.sup.snare",
      inputs: [mat("fix.mat.twine")],
      delta: 18,
      history: "Loop rebent and reanchored.",
      success: "The snare holds a set again.",
      recovery: "If the wire is cracked through, do not pretend. This one was only tired.",
      tags: ["hunting"],
    }),
    restore({
      slug: "float-line",
      name: "Retie the float rig",
      summary: "New line on the same float.",
      target: "fix.sup.float-line",
      inputs: [mat("fix.mat.line")],
      delta: 20,
      history: "Rig retied.",
      success: "Retied. Same float.",
      recovery: "The old knot can fish one more evening.",
      tags: ["fishing"],
    }),
    restore({
      slug: "sinker-rig",
      name: "Reset the sinker rig",
      summary: "Crimp and a fresh span of line. Lead stays lead.",
      target: "fix.sup.sinker-rig",
      inputs: [mat("fix.mat.line"), mat("fix.mat.linen-thread")],
      delta: 20,
      history: "Rig reset.",
      success: "Reset. The hook you tied is still that hook.",
      recovery: "Leave it knotted. It was not melted down.",
      tags: ["fishing"],
    }),
  ];

  const heirlooms: Recipe[] = [
    restore({
      slug: "heir.oil-lamp",
      name: "Tend grandmother's lamp",
      summary: "Ease the collar, trim the crust off the wick, wipe the dent without filling it. The dent stays. That is how the lamp is known.",
      target: "fix.heir.oil-lamp",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.rag"), mat("fix.mat.wick")],
      delta: 30,
      history: "Collar eased. Wick trimmed. The dent was kept — it is how the lamp is known.",
      success: "The lamp is tended. Mara Venn's dent is still in the collar. History appended, not rewritten.",
      recovery: "Set it down lit or unlit. The dent was not hammered out, and nothing was replaced.",
      tags: ["heirloom", "lamp"],
      minutes: 40,
      focus: 4,
      heirloom: true,
    }),
    restore({
      slug: "heir.needle",
      name: "Oil father's needle",
      summary: "A drop of oil and a rag. This is not the bench needle, and it does not become one.",
      target: "fix.heir.needle",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.rag")],
      delta: 20,
      history: "Oiled. Still his needle. The bench needle was not substituted in.",
      success: "Oiled. Identity key unchanged. It is still the needle that mended nets before this bench.",
      recovery: "It can stay dry. It was not swapped for the bench needle.",
      tags: ["heirloom", "fishing"],
      heirloom: true,
    }),
    restore({
      slug: "heir.river-knife",
      name: "Bring back the river knife",
      summary: "Stone and oil along the edge. Stop at the nicks. They are a count, not damage to erase.",
      target: "fix.heir.river-knife",
      inputs: [mat("fix.mat.oil"), tool("fix.tool.whetstone", 1)],
      delta: 28,
      history: "Edge brought back. The three nicks were left in the steel.",
      success: "The edge works again. Three nicks remain. The knife's history was not ground off.",
      recovery: "If the stone is glazed, rinse it. The nicks were not taken out either way.",
      tags: ["heirloom", "edge"],
      heirloom: true,
      wear: 1,
    }),
    restore({
      slug: "heir.cedar-creel",
      name: "Settle the cedar creel",
      summary: "A reed and resin at the hinge. The burned initials are not recut and not sanded.",
      target: "fix.heir.cedar-creel",
      inputs: [mat("fix.mat.reed"), mat("fix.mat.resin"), mat("fix.mat.rag")],
      delta: 26,
      history: "Hinge settled. Initials left as burned.",
      success: "The hinge holds. The initials are untouched. Same creel, longer history.",
      recovery: "The initials are not a repair. Leave them. Nothing was planed.",
      tags: ["heirloom", "fishing"],
      heirloom: true,
    }),
    restore({
      slug: "heir.compass",
      name: "Clean the filed compass",
      summary: "Rag and a drop of oil on the case. Do not free the needle here — that is a choice with a cost.",
      target: "fix.heir.compass",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.rag")],
      delta: 15,
      history: "Case cleaned. The filed error was not 'corrected'.",
      success: "The glass is clear. The needle still sits a thumb east of north, on purpose.",
      recovery: "A dirty glass still shows the error you were meant to keep. Nothing was pried.",
      tags: ["heirloom"],
      heirloom: true,
    }),
    restore({
      slug: "heir.wool-cloak",
      name: "Re-stitch the wool cloak",
      summary: "Thread through the winter patch, not over it. The crossing stays visible.",
      target: "fix.heir.wool-cloak",
      inputs: [mat("fix.mat.linen-thread", 2), tool("fix.tool.needle", 1)],
      delta: 24,
      history: "Patch restitched. The winter elbow was not replaced with plain cloth.",
      success: "The patch holds. The winter is still in the elbow. Same cloak.",
      recovery: "Dress the needle. The patch was not cut off.",
      tags: ["heirloom", "hunting"],
      heirloom: true,
    }),
    restore({
      slug: "heir.cane-rod",
      name: "Renew the cane wraps",
      summary: "Thread and a little resin over faded silk. The cane is not a driftwood blank.",
      target: "fix.heir.cane-rod",
      inputs: [mat("fix.mat.linen-thread", 2), mat("fix.mat.resin")],
      delta: 28,
      history: "Silk wraps secured. The cane was not replaced.",
      success: "Wraps hold. Faded silk is still under the new thread. Same rod.",
      recovery: "The loose guide can wait. The cane was not snapped out for scrap.",
      tags: ["heirloom", "fishing"],
      heirloom: true,
    }),
    restore({
      slug: "heir.locket",
      name: "Polish the sealed locket",
      summary: "Rag and oil on the outside only. The resin seal is not a defect.",
      target: "fix.heir.locket",
      inputs: [mat("fix.mat.rag"), mat("fix.mat.oil")],
      delta: 12,
      history: "Outside polished. The ninth-year seal was not opened.",
      success: "The face of the locket is clean. It is still sealed. You do not know more than you did.",
      recovery: "Opening it is a different operation, and it is not free. This one changed nothing inside.",
      tags: ["heirloom"],
      heirloom: true,
    }),
    restore({
      slug: "heir.horn",
      name: "Bind the horn's crack",
      summary: "Thread and resin along the lip crack. The voice stays thin unless you choose a bore — and that choice costs quiet or reach.",
      target: "fix.heir.horn",
      inputs: [mat("fix.mat.linen-thread"), mat("fix.mat.resin")],
      delta: 22,
      history: "Crack bound. The lip was not cut back.",
      success: "The crack is bound. The horn is the same horn, a little less likely to split further.",
      recovery: "An unbound crack is still a horn. It was not sawn shorter.",
      tags: ["heirloom", "hunting"],
      heirloom: true,
    }),
    restore({
      slug: "heir.tackle-roll",
      name: "Reoil the tackle roll",
      summary: "Oil worked into canvas. Pocket labels left readable. Nothing relabeled.",
      target: "fix.heir.tackle-roll",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.rag")],
      delta: 20,
      history: "Canvas reoiled. Labels left in the other hand.",
      success: "The roll is supple. The handwriting is still not yours. History kept.",
      recovery: "Dry canvas still holds hooks. Nothing was emptied.",
      tags: ["heirloom", "fishing"],
      heirloom: true,
    }),
    restore({
      slug: "heir.shears",
      name: "Ease mother's shears",
      summary: "Oil at the pivot, rag on the blades. They are not sharpened into a knife.",
      target: "fix.heir.shears",
      inputs: [mat("fix.mat.oil"), mat("fix.mat.rag")],
      delta: 22,
      history: "Pivot eased. Blades wiped, not re-ground into something else.",
      success: "They open again. Same shears, same pivot, a new line in the history.",
      recovery: "A stiff pivot still cuts rag if you insist. They were not taken apart.",
      tags: ["heirloom"],
      heirloom: true,
    }),
    restore({
      slug: "heir.glass-float",
      name: "Wash the glass float",
      summary: "Water is not on this bench. A rag and care. Do not hitch it to a net unless you accept that it can be lost.",
      target: "fix.heir.glass-float",
      inputs: [mat("fix.mat.rag")],
      delta: 10,
      history: "Washed. Not hitched. The first-year float stays a float with a year on it.",
      success: "Clean. Still the first-year float. Hitching it is a separate choice, and it can lose the thing.",
      recovery: "Dirt does not unmake it. It was not bored for a net line.",
      tags: ["heirloom", "fishing"],
      heirloom: true,
    }),
  ];

  const modifies: Recipe[] = [
    modify({
      slug: "lantern-optics",
      name: "Choose the lantern's eye",
      summary: "A reflector throws light and hates weather. A cowl keeps the flame in rain and keeps it dim. Pick one.",
      target: "fix.gear.lantern",
      tags: ["lamp", "gear"],
      history: "The lantern took an optic. The other direction was refused.",
      choices: [
        choice(
          "reflector",
          "Tin reflector",
          "More light thrown forward. Rain finds the dish. Heavier to carry.",
          "lantern-optics",
          { light: 2, weather: -1, weight: 1 },
          [mat("fix.mat.tin")],
        ),
        choice(
          "cowl",
          "Rain cowl",
          "The flame survives weather. You see less, and you carry the cloth.",
          "lantern-optics",
          { weather: 2, light: -1, weight: 1 },
          [mat("fix.mat.cloth")],
        ),
      ],
    }),
    modify({
      slug: "lantern-burn",
      name: "Choose how the lantern burns",
      summary: "A long wick lasts and sulks. A bright flare spends the oil and the wick.",
      target: "fix.gear.lantern",
      tags: ["lamp", "gear"],
      history: "Burn character set. Not both.",
      choices: [
        choice("long-wick", "Long burn", "It lasts. It is dimmer while it does.", "lantern-burn", { durability: 2, light: -1 }, [
          mat("fix.mat.wick"),
        ]),
        choice(
          "bright-flare",
          "Bright flare",
          "A hard light. The wick crusts and the oil goes.",
          "lantern-burn",
          { light: 2, durability: -2 },
          [mat("fix.mat.oil")],
        ),
      ],
    }),
    modify({
      slug: "net-mesh",
      name: "Choose the mesh",
      summary: "Fine mesh holds small fish and fouls. Reinforced mesh lasts and lets the small ones leave.",
      target: "fix.gear.net",
      tags: ["fishing", "gear"],
      history: "Mesh character chosen.",
      choices: [
        choice("fine-mesh", "Fine mesh", "Holds more. Snags more. A poor release.", "net-mesh", { hold: 2, release: -2 }, [
          mat("fix.mat.net-twine", 2),
        ]),
        choice(
          "reinforced-mesh",
          "Reinforced selvedge",
          "Survives a snag. Misses the small fish.",
          "net-mesh",
          { durability: 2, hold: -1 },
          [mat("fix.mat.sinew")],
        ),
      ],
    }),
    modify({
      slug: "net-line",
      name: "Choose the net's line",
      summary: "Lead sinks the foot and announces you. Cork lifts it and lets fish swim under.",
      target: "fix.gear.net",
      tags: ["fishing", "gear"],
      history: "Foot line chosen.",
      choices: [
        choice("leadline", "Heavy leadline", "The foot stays down. You are louder and heavier.", "net-line", { hold: 2, quiet: -1, weight: 1 }, [
          mat("fix.mat.lead"),
        ]),
        choice(
          "corkline",
          "Corkline",
          "Quieter, lighter. Fish pass under the foot.",
          "net-line",
          { quiet: 2, hold: -1, weight: -1 },
          [mat("fix.mat.cork", 2)],
        ),
      ],
    }),
    modify({
      slug: "rod-length",
      name: "Choose the rod's length",
      summary: "More reach, worse in brush. A short rod is quiet in alders and short on the cast.",
      target: "fix.gear.rod",
      tags: ["fishing", "gear"],
      history: "Length committed. The other reach was not kept in a pocket.",
      choices: [
        choice("long-rod", "Long reach", "Further. Heavier. The brush takes it from you.", "rod-length", { reach: 2, quiet: -1, weight: 1 }, [
          mat("fix.mat.driftwood"),
        ]),
        choice("brush-rod", "Brush rod", "Short and quiet. The far bank is no longer yours.", "rod-length", { quiet: 2, reach: -2 }, [
          mat("fix.mat.twine"),
        ]),
      ],
    }),
    modify({
      slug: "knife-grind",
      name: "Choose the belt knife's grind",
      summary: "A thin edge cuts and chips. A thick spine lasts and pushes.",
      target: "fix.gear.belt-knife",
      tags: ["hunting", "gear", "edge"],
      history: "Grind chosen. The other edge was not saved.",
      choices: [
        choice("thin-edge", "Thin edge", "Keener. It chips on bone.", "knife-grind", { edge: 2, durability: -2 }),
        choice("thick-spine", "Thick spine", "Lasts. A duller push.", "knife-grind", { durability: 2, edge: -1 }),
      ],
    }),
    modify({
      slug: "boot-sole",
      name: "Choose the soles",
      summary: "Quiet soles slip in weather. Spikes grip and announce every step.",
      target: "fix.gear.boots",
      tags: ["hunting", "gear"],
      history: "Soles committed.",
      choices: [
        choice("quiet-sole", "Quiet sole", "You are harder to hear. Wet stone disagrees.", "boot-sole", { quiet: 2, weather: -1 }, [
          mat("fix.mat.cloth"),
        ]),
        choice("spiked-sole", "Spiked sole", "Grip in mud and ice. Everything hears you.", "boot-sole", { weather: 2, quiet: -2 }, [
          mat("fix.mat.nails", 2),
        ]),
      ],
    }),
    modify({
      slug: "cloak-finish",
      name: "Choose the cloak's finish",
      summary: "Oilproofing sheds rain and rustles. Vents breathe and soak.",
      target: "fix.gear.cloak",
      tags: ["hunting", "gear"],
      history: "Finish chosen.",
      choices: [
        choice(
          "oilproof",
          "Oilproof",
          "Rain sheets off. You rustle, and you carry the proof.",
          "cloak-finish",
          { weather: 2, quiet: -1, weight: 1 },
          [mat("fix.mat.oil"), mat("fix.mat.beeswax")],
        ),
        choice("vented", "Vented", "Quieter, cooler. A shower goes through.", "cloak-finish", { quiet: 2, weather: -2 }),
      ],
    }),
    modify({
      slug: "bow-draw",
      name: "Choose the bow's draw",
      summary: "A heavier draw holds a kill and kicks your shoulder. A quiet string loses that hold.",
      target: "fix.gear.bow",
      tags: ["hunting", "gear"],
      history: "Draw character set.",
      choices: [
        choice("heavy-draw", "Heavy draw", "More hold on the shot. Louder, heavier.", "bow-draw", { hold: 2, quiet: -2, weight: 1 }, [
          mat("fix.mat.sinew"),
        ]),
        choice("quiet-string", "Quiet string", "The shot is softer. It holds less.", "bow-draw", { quiet: 2, hold: -1 }, [mat("fix.mat.beeswax")]),
      ],
    }),
    modify({
      slug: "spear-point",
      name: "Choose the spear point",
      summary: "Barbs keep a fish and ruin a clean release. A smooth point lets go.",
      target: "fix.gear.spear",
      tags: ["hunting", "fishing", "gear"],
      history: "Point character set.",
      choices: [
        choice("barbed", "Barbed", "It stays in. You will not shake it free kindly.", "spear-point", { hold: 2, release: -2 }, [
          mat("fix.mat.bone"),
        ]),
        choice("smooth", "Smooth", "A clean release. The fish can leave with it.", "spear-point", { release: 2, hold: -2 }, [
          mat("fix.mat.resin"),
        ]),
      ],
    }),
    modify({
      slug: "pack-carry",
      name: "Choose how the pack carries",
      summary: "Wide straps last and bulk you. A slim pack is quiet and eats the shoulder.",
      target: "fix.gear.pack",
      tags: ["ordinary", "gear"],
      history: "Carry chosen.",
      choices: [
        choice("wide-straps", "Wide straps", "Lasts the day. Louder, heavier.", "pack-carry", { durability: 2, quiet: -1, weight: 1 }, [
          mat("fix.mat.leather"),
        ]),
        choice("slim-pack", "Slim and quiet", "Less to snag. The seam gives up sooner.", "pack-carry", { quiet: 2, durability: -1 }, [
          mat("fix.mat.cloth"),
        ]),
      ],
    }),
    modify({
      slug: "gaff-point",
      name: "Choose the gaff point",
      summary: "A barb lands the fish and injures the release. Blunt is kinder and less sure.",
      target: "fix.gear.gaff",
      tags: ["fishing", "gear"],
      history: "Gaff point chosen.",
      choices: [
        choice("gaff-barb", "Barbed gaff", "Lands it. You owe the fish the hole.", "gaff-point", { hold: 2, release: -2 }),
        choice("gaff-blunt", "Blunt gaff", "You can let it go. You may also drop it.", "gaff-point", { release: 2, hold: -1 }),
      ],
    }),
    modify({
      slug: "creel-seal",
      name: "Choose the creel's seal",
      summary: "Vents keep fish alive and let rain in. A seal keeps water out and the catch still.",
      target: "fix.gear.creel",
      tags: ["fishing", "gear"],
      history: "Seal chosen.",
      choices: [
        choice("vented-creel", "Vented", "Air for the catch. Weather comes in with it.", "creel-seal", { durability: 1, weather: -2 }),
        choice("sealed-creel", "Rain-sealed", "Dry inside. Heavier, and the catch is quieter because it is done.", "creel-seal", { weather: 2, quiet: -1, weight: 1 }, [
          mat("fix.mat.resin"),
        ]),
      ],
    }),
    modify({
      slug: "heir-lamp",
      name: "Fit grandmother's lamp",
      summary: "A clearer chimney, or a soot shield. Either one leaves the dent. Neither replaces the lamp.",
      target: "fix.heir.oil-lamp",
      tags: ["heirloom", "lamp"],
      history: "A fitting was added. The dent and the name on the lamp were not replaced.",
      heirloom: true,
      choices: [
        choice(
          "clear-chimney",
          "Clearer chimney",
          "More light through the old glass. The collar is a little more exposed.",
          "heir-lamp",
          { light: 2, durability: -1 },
          [mat("fix.mat.glass-shard")],
        ),
        choice(
          "soot-shield",
          "Soot shield",
          "The collar survives the kitchen. The room gets less of the flame.",
          "heir-lamp",
          { durability: 2, light: -1 },
          [mat("fix.mat.tin")],
        ),
      ],
    }),
    modify({
      slug: "heir-knife-nicks",
      name: "Decide the river knife's nicks",
      summary: "Grind them out and lose the count. Leave them and keep a worse edge. The knife either way is the same knife.",
      target: "fix.heir.river-knife",
      tags: ["heirloom", "edge"],
      history: "A decision was made about the nicks. The knife was not exchanged.",
      heirloom: true,
      choices: [
        choice("grind-nicks", "Grind the nicks out", "A cleaner edge. The three years leave the steel.", "heir-nicks", { edge: 2, insight: -2 }),
        choice("leave-nicks", "Leave the nicks", "You can still count them. The edge complains.", "heir-nicks", { insight: 1, edge: -1 }),
      ],
    }),
    modify({
      slug: "heir-locket",
      name: "Decide the locket's seal",
      summary: "Open it and know the face, and lose the seal that kept the portrait dry. Leave it and you still do not know.",
      target: "fix.heir.locket",
      tags: ["heirloom"],
      history: "The seal was either broken or deliberately kept. The locket was not replaced with a finding.",
      heirloom: true,
      choices: [
        choice("open-seal", "Ease the hinge", "You see the portrait. The seal that kept it dry is gone.", "locket-seal", { insight: 2, durability: -2 }),
        choice("keep-seal", "Leave the seal", "The portrait stays dry and unknown. You learn nothing.", "locket-seal", { durability: 2, insight: -1 }),
      ],
    }),
    modify({
      slug: "heir-compass",
      name: "Decide the compass error",
      summary: "Free the needle and lose the landmark the error was. Keep the error and you still walk wrong if you trust it like a true north.",
      target: "fix.heir.compass",
      tags: ["heirloom"],
      history: "The filed error was either freed or kept. The case is still that case.",
      heirloom: true,
      choices: [
        choice("free-needle", "Free the needle", "It points true. The case is opened, and the old error is no longer a landmark.", "compass-error", {
          insight: 2,
          reach: 1,
          durability: -2,
        }),
        choice("keep-error", "Keep the known error", "The case stays sealed. You do not get the reach of a true needle.", "compass-error", {
          durability: 1,
          quiet: 1,
          reach: -1,
        }),
      ],
    }),
    modify({
      slug: "heir-horn",
      name: "Choose the horn's voice",
      summary: "Open the bore and be heard farther, including by what you are hunting. Muffle it and the far bank never hears you.",
      target: "fix.heir.horn",
      tags: ["heirloom", "hunting"],
      history: "The voice was chosen. The crack's history remains.",
      heirloom: true,
      choices: [
        choice("wide-bore", "Wider bore", "Farther. Not quiet.", "horn-bore", { reach: 2, quiet: -2 }),
        choice("muffled", "Muffled", "Close and quiet. The valley does not get the call.", "horn-bore", { quiet: 2, reach: -1 }),
      ],
    }),
    modify({
      slug: "heir-float",
      name: "Decide the glass float's work",
      summary: "Hitch it to a net and it can be lost to the river. Leave it on the shelf and it does not fish.",
      target: "fix.heir.glass-float",
      tags: ["heirloom", "fishing"],
      history: "The float was either hitched or left. It was not remade as a cork.",
      heirloom: true,
      choices: [
        choice("hitch-float", "Hitch to the work", "It can hold a net's head. The river can take it.", "float-use", { hold: 2, durability: -2 }, [
          mat("fix.mat.net-twine"),
        ]),
        choice("shelf-float", "Leave it as itself", "Safer. It does not reach the water.", "float-use", { durability: 1, reach: -1 }),
      ],
    }),
    modify({
      slug: "heir-cane",
      name: "Choose the cane's wrap",
      summary: "A tight silk-over helps the cast and stresses old cane. A loose working wrap lasts and shortens the feel.",
      target: "fix.heir.cane-rod",
      tags: ["heirloom", "fishing"],
      history: "Wrap tension chosen. The cane is still that cane.",
      heirloom: true,
      choices: [
        choice("tight-wrap", "Tight wrap", "More reach through the guides. The old cane takes the stress.", "cane-wrap", { reach: 2, durability: -1 }, [
          mat("fix.mat.linen-thread"),
        ]),
        choice("loose-wrap", "Loose working wrap", "The cane lasts. You feel less of the far line.", "cane-wrap", { durability: 2, reach: -1 }),
      ],
    }),
  ];

  const maintains: Recipe[] = [
    maintain({
      slug: "strop-knife",
      name: "Strop the bench knife",
      summary: "Leather on the bench, not from your pack. No material is spent. The knife cannot be consumed by this.",
      target: "fix.tool.bench-knife",
      delta: 14,
      success: "The bench knife is stropped. It is still the bench knife.",
      recovery: "This needs nothing from the piles. If it failed, the knife was not the one on the bench.",
      tags: ["tool", "critical"],
      consumePrimary: true,
    }),
    maintain({
      slug: "dress-needle",
      name: "Dress the bench needle",
      summary: "A pass on the bench leather. No thread is spent. The needle stays.",
      target: "fix.tool.needle",
      delta: 14,
      success: "The needle is dressed and still the bench needle.",
      recovery: "Nothing to gather. It does not depend on the needle being sharp already.",
      tags: ["tool", "critical", "fishing"],
      consumePrimary: true,
    }),
    maintain({
      slug: "dress-awl",
      name: "Dress the awl",
      summary: "The point is trued on the bench. No other tool is required.",
      target: "fix.tool.awl",
      delta: 14,
      success: "The awl is trued. It was not used up.",
      recovery: "No material. No second tool.",
      tags: ["tool", "critical"],
      consumePrimary: true,
    }),
    maintain({
      slug: "rinse-stone",
      name: "Rinse the whetstone",
      summary: "Swill and wipe. The stone does not need the knife it serves.",
      target: "fix.tool.whetstone",
      delta: 16,
      success: "The stone is clean enough to cut steel again.",
      recovery: "This is the recovery. It spends focus, not gear.",
      tags: ["tool", "critical", "edge"],
      consumePrimary: true,
    }),
    maintain({
      slug: "oil-belt-knife",
      name: "Oil the belt knife",
      summary: "A pour of oil so the haft does not swell. This is care, not a new grind.",
      target: "fix.gear.belt-knife",
      inputs: [mat("fix.mat.oil")],
      delta: 12,
      success: "Oiled. Grind unchanged.",
      recovery: "If you are out of oil, stropping will not oil it — and the knife is still in your hand.",
      tags: ["hunting", "gear"],
    }),
    maintain({
      slug: "wax-bowstring",
      name: "Wax a bowstring",
      summary: "Wax into the string you already laid. It does not become a heavier draw by itself.",
      target: "fix.sup.bowstring",
      inputs: [mat("fix.mat.beeswax")],
      delta: 15,
      success: "The string is waxed. Draw weight was not edited.",
      recovery: "A dry string can still be strung once. It was not cut.",
      tags: ["hunting"],
    }),
    maintain({
      slug: "tension-net",
      name: "Tension the net",
      summary: "Walk the selvedge with thread and the bench needle. A small care, not a full reweave.",
      target: "fix.gear.net",
      inputs: [mat("fix.mat.linen-thread"), tool("fix.tool.needle")],
      delta: 12,
      success: "Selvedge tensioned. Mesh choice, if any, remains.",
      recovery: "Dress the needle, then come back. The net was not dismantled.",
      tags: ["fishing", "gear"],
    }),
    maintain({
      slug: "wipe-lantern",
      name: "Wipe the lantern glass",
      summary: "A rag, soot lifted. Optics you chose stay chosen.",
      target: "fix.gear.lantern",
      inputs: [mat("fix.mat.rag")],
      delta: 10,
      success: "Glass wiped. Reflector or cowl, if seated, is still seated.",
      recovery: "Soot can stay. The lantern was not opened into parts.",
      tags: ["lamp", "gear"],
    }),
  ];

  const inspect: Recipe = {
    id: "op.inspect",
    kind: "inspect",
    name: "Inspect",
    summary: "Read condition, identity, provenance, and history. Nothing is spent. Nothing is improved.",
    inputs: [{ catalogId: "*", qty: 1, consume: "none", role: "primary" }],
    outputs: [],
    substitutions: [],
    cost: { minutes: 5, focus: 0, toolWear: 0 },
    feedback: {
      success: "Read, not altered.",
      fail: "Nothing on the bench matched.",
    },
    failure: { onLowCondition: "partial", recovery: "Pick a piece that is actually here." },
    batchable: false,
    tags: ["ordinary"],
  };

  const salvageBreaks: Recipe[] = [
    {
      id: "op.dismantle.bottle",
      kind: "dismantle",
      name: "Knock down cracked bottles",
      summary: "Bottles become shards. Less mass than the glass you broke. Batch them — do not do each one as a ceremony.",
      inputs: [{ catalogId: "fix.salvage.bottle", qty: 1, consume: "all", role: "primary", minCondition: 1 }],
      outputs: [{ catalogId: "fix.mat.glass-shard", qty: 2, identity: "new", condition: 55 }],
      substitutions: [],
      cost: { minutes: 5, focus: 1, toolWear: 0 },
      feedback: {
        success: "Bottles knocked down to shards. The bottles are gone. Some glass dusted out.",
        fail: "No bottle was broken.",
      },
      failure: { onLowCondition: "refuse", recovery: "Leave the pile. It is already only glass-in-waiting." },
      batchable: true,
      tags: ["lamp", "salvage-pile", "ordinary"],
    },
    {
      id: "op.dismantle.tin-can",
      kind: "dismantle",
      name: "Flatten tin cans",
      summary: "Cans become a sheet each, short of the painted scrap you started with. Use the count, not a single can at a time.",
      inputs: [{ catalogId: "fix.salvage.tin-can", qty: 1, consume: "all", role: "primary", minCondition: 1 }],
      outputs: [{ catalogId: "fix.mat.tin", qty: 1, identity: "new", condition: 55 }],
      substitutions: [],
      cost: { minutes: 6, focus: 1, toolWear: 0 },
      feedback: {
        success: "Cans flattened to tin. Paint and folds are the lost mass.",
        fail: "No can was flattened.",
      },
      failure: { onLowCondition: "refuse", recovery: "They can sit. Flattening a powder of rust gains nothing." },
      batchable: true,
      tags: ["lamp", "salvage-pile", "ordinary"],
    },
  ];

  return [inspect, ...restores, ...heirlooms, ...modifies, ...maintains, ...salvageBreaks];
}
