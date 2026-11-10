import { ENEMY_INDEX } from "./enemies.js";
import { DEFAULT_ARENA } from "../sim/geometry.js";

/**
 * Encounter composition rules for ordinary rooms.
 * Major dungeon bosses are out of scope and must not appear here.
 */
export const COMPOSITION_RULES = {
  mythology:
    "Every member comes from the Addison Survey / Unrecorded County set: quarry, agricultural, water, memory, surveyor, unrealized, insect, or human.",
  no_dungeon_bosses: true,
  mortal_completable: true,
  fairness_form: "officer",
  fairness_speed_px_per_frame: 0.85,
  overlapping_tell_gap_frames: 10,
  default_conductor: "stagger",
  stagger:
    "While one living enemy is in telegraph or active, another enemy's transition into a telegraph is refused and retried next tick.",
  harmonized:
    "Two tells may share a beat only when a tile exists that is outside every simultaneous hitbox. The model must be able to stand there.",
  projectile_owners:
    "At most one enemy in a room is a projectile owner. Assisted cap is 2, standard cap is 3, oldest fizzles.",
  protection:
    "The intercept tile is reachable without entering the strike. Standing there with the named tool keeps the protected HP intact.",
  mercy_and_forfeit:
    "Memory and unrealized kills set a forfeit flag. A mastery room is complete only on the spare, never on the grave.",
  assisted_profile:
    "Assisted changes reaction, tell length, damage taken, i-frames, bonus HP, and projectile cap. It does not remove a room, a line, a mercy, or a death.",
  reset:
    "A room reset restores living enemies. Spares persist fourteen years. Kills persist this life unless the record says permanent.",
};

const OPEN = DEFAULT_ARENA.ascii;

function taught(spec) {
  const enemy = ENEMY_INDEX[spec.enemy];
  const trial = enemy.trials.find((item) => item.id === (spec.trial || "fair"));
  if (!trial) throw new Error(`No trial ${spec.trial} on ${spec.enemy}`);
  return {
    id: spec.id,
    name: spec.name,
    kind: "teaching",
    lesson: spec.lesson,
    county: spec.county,
    enemy: spec.enemy,
    arena: OPEN,
    conductor: "stagger",
    members: [{ enemy: spec.enemy, at: { x: 120, y: 88 }, facing: "S", delay: 0 }],
    ellis: trial.start || { x: 120, y: 152 },
    sim_mode: trial.mode,
    tool: trial.tool || null,
    bladeOut: !!trial.bladeOut,
    lamp: !!trial.lamp,
    face: !!trial.face,
    form: trial.form || "officer",
    frames: trial.frames,
    anchor: trial.point || null,
    expect: { overlap: 0, ...trial.expect },
  };
}

function mixed(spec) {
  return {
    kind: "mixed",
    arena: OPEN,
    conductor: "stagger",
    ellis: { x: 120, y: 160 },
    sim_mode: "blade",
    bladeOut: true,
    form: "officer",
    frames: 780,
    expect: { maxDamage: 0, overlap: 0 },
    ...spec,
  };
}

function terrain(spec) {
  return {
    kind: "terrain",
    conductor: "stagger",
    members: spec.members || [],
    form: "officer",
    frames: 220,
    sim_mode: "route",
    expect: { maxDamage: 0, overlap: 0 },
    ...spec,
  };
}

function protection(spec) {
  return {
    kind: "protection",
    arena: OPEN,
    conductor: "stagger",
    form: "officer",
    frames: 180,
    sim_mode: "nonlethal",
    tool: "block_rod",
    bladeOut: false,
    ellis: spec.protection.intercept,
    anchor: spec.protection.intercept,
    expect: { maxDamage: 0, overlap: 0, protectorHp: spec.protection.hp },
    ...spec,
  };
}

function mastery(spec) {
  return {
    kind: "mastery",
    arena: OPEN,
    conductor: "stagger",
    form: spec.form || "officer",
    frames: 160,
    sim_mode: "mercy",
    bladeOut: false,
    ellis: { x: 120, y: 140 },
    expect: {
      maxDamage: 0,
      overlap: 0,
      spared: spec.members.map((member) => member.enemy),
      killed: [],
    },
    ...spec,
  };
}

const TEACHING = [
  taught({
    id: "teach_tap_the_stuck_claw",
    name: "Tap the Stuck Claw",
    enemy: "slate_fissure_crab",
    county: "Leicester river-cut",
    lesson:
      "The claw's tell is long. The punish is the recovery, not the windup. Officer speed is enough.",
  }),
  taught({
    id: "teach_the_cone_does_not_chase",
    name: "The Cone Does Not Chase",
    enemy: "marble_dust_lung",
    county: "Middlebury marble works",
    lesson: "A still enemy owns a cone. Leaving the cone is the whole defense.",
  }),
  taught({
    id: "teach_leave_the_ring",
    name: "Leave the Ring",
    enemy: "calcite_vein_leech",
    county: "Bristol ledge road",
    lesson: "The ring locks where you stood when the tell began. It does not follow after that.",
  }),
  taught({
    id: "teach_hammer_off_the_rail",
    name: "Hammer Off the Rail",
    enemy: "bench_saw_remnant",
    county: "Leicester bench line",
    lesson:
      "The sled owns a painted rail. The hammer socket is off the rail. Standing on the paint is the mistake.",
  }),
  taught({
    id: "teach_rod_against_the_ram",
    name: "Rod Against the Ram",
    enemy: "butter_churn_ram",
    county: "Cornwall creamery lane",
    lesson:
      "A blockable charge can be caught. The rod is the lesson. The recovery is the other lesson, for another day.",
  }),
  taught({
    id: "teach_glass_before_the_bell",
    name: "Glass Before the Bell",
    enemy: "cow_of_the_fourteen_year_field",
    county: "Cornwall meadow",
    lesson:
      "The homestead glass is a conversation. The swing is what happens if you walk up holding a blade instead.",
  }),
  taught({
    id: "teach_stow_the_lamp",
    name: "Stow the Lamp",
    enemy: "ripton_fire_warden",
    county: "Ripton burn scar",
    lesson:
      "Holt's cousin on the ordinary trail smothers a shown flame. A dark lamp is the whole solve. The smother still exists.",
  }),
  taught({
    id: "teach_net_on_the_rafter",
    name: "Net on the Rafter",
    enemy: "barn_swallow_duelist",
    county: "Weybridge rafter",
    lesson:
      "The shadow is a marked tile. The net is the mercy. Killing the swallow empties the rafter.",
  }),
  taught({
    id: "teach_the_front_of_the_quill",
    name: "The Front of the Quill",
    enemy: "porcupine_of_lost_gloves",
    county: "Ripton path",
    lesson:
      "Quills face backward. Approach from the south, blade down, and the glove is left behind.",
  }),
  taught({
    id: "teach_the_officer_halt",
    name: "The Officer's Halt",
    enemy: "ferrisburgh_ice_cutter",
    county: "Button Bay ice",
    trial: "halt",
    lesson:
      "The Rutland Officer can halt the cutter if the saw stays sheathed. Other forms still have the long recovery. The scene is not deleted for them.",
  }),
];

const MIXED = [
  mixed({
    id: "mixed_keystone_and_dust",
    name: "Keystone and Dust",
    county: "Leicester cut beside a marble floor",
    lesson:
      "A chasing claw and a cone that stays put. Stagger: the dust does not cough on the claw's tell.",
    members: [
      { enemy: "slate_fissure_crab", at: { x: 96, y: 72 }, facing: "S", delay: 0 },
      { enemy: "marble_dust_lung", at: { x: 152, y: 64 }, facing: "S", delay: 12 },
    ],
  }),
  mixed({
    id: "mixed_tap_and_ladder",
    name: "Tap and Ladder",
    county: "Lincoln bush opening on a Shoreham row",
    lesson:
      "Two seekers. Only one may show a tell at a time. The officer walks out of whichever one spoke.",
    members: [
      { enemy: "sap_tapwalker", at: { x: 88, y: 64 }, facing: "S", delay: 0 },
      { enemy: "orchard_ladder_stilt", at: { x: 152, y: 64 }, facing: "S", delay: 18 },
    ],
  }),
  mixed({
    id: "mixed_snag_and_chain",
    name: "Snag and Chain",
    county: "Otter Creek bank where a baseline was abandoned",
    lesson: "Water-thing and survey tool in one room. They do not harmonize. The chain waits.",
    members: [
      { enemy: "otter_creek_snag", at: { x: 104, y: 72 }, facing: "S", delay: 0 },
      { enemy: "gunters_chain_serpent", at: { x: 160, y: 56 }, facing: "W", delay: 24 },
    ],
  }),
  mixed({
    id: "mixed_rod_and_roller",
    name: "Rod and Roller",
    county: "Chimney Point lane under a Bristol block",
    lesson:
      "A pole that extends and a charge that commits. The charge is the one you read. The pole holds its tell.",
    members: [
      { enemy: "rodman_pole", at: { x: 120, y: 56 }, facing: "S", delay: 0 },
      { enemy: "keyblock_roller", at: { x: 72, y: 88 }, facing: "E", delay: 10 },
    ],
  }),
  mixed({
    id: "mixed_ring_and_cough",
    name: "Ring and Cough",
    county: "Bristol ledge with mill dust in the seams",
    lesson:
      "A locked ring plus a short cone. Leave the ring first. The cough cannot start until the ring has spoken.",
    members: [
      { enemy: "calcite_vein_leech", at: { x: 120, y: 48 }, facing: "S", delay: 0 },
      { enemy: "marble_dust_lung", at: { x: 168, y: 80 }, facing: "W", delay: 8 },
    ],
  }),
  mixed({
    id: "mixed_saw_and_tap",
    name: "Saw and Tap",
    county: "Button Bay road up toward Lincoln",
    lesson:
      "The ice saw and a sap-tap share a room. Both stand north. Stagger keeps the tap from stabbing during the drag.",
    members: [
      { enemy: "ferrisburgh_ice_cutter", at: { x: 88, y: 64 }, facing: "S", delay: 0 },
      { enemy: "sap_tapwalker", at: { x: 152, y: 64 }, facing: "S", delay: 18 },
    ],
  }),
  mixed({
    id: "mixed_two_throws",
    name: "Two Throws",
    county: "Otter footbridge beside a Shoreham row",
    lesson:
      "Two slow projectiles, one owner at a time. The cap still applies. Neither throw is a reason to kill the thrower.",
    sim_mode: "dodge",
    bladeOut: true,
    ellis: { x: 120, y: 150 },
    members: [
      { enemy: "creek_toll_youth", at: { x: 88, y: 96 }, facing: "S", delay: 0 },
      { enemy: "orchard_night_picker", at: { x: 168, y: 96 }, facing: "S", delay: 40 },
    ],
  }),
  mixed({
    id: "mixed_heir_and_pole",
    name: "Heir and Pole",
    county: "Vergennes green running out to Chimney Point",
    lesson:
      "A person with a lash and a rod that extends. The lash is the tell you answer by leaving. The pole waits its beat.",
    members: [
      { enemy: "survey_heir", at: { x: 88, y: 64 }, facing: "S", delay: 0 },
      { enemy: "rodman_pole", at: { x: 152, y: 64 }, facing: "S", delay: 18 },
    ],
  }),
];

const TERRAIN = [
  terrain({
    id: "terrain_leicester_lip",
    name: "Leicester Lip",
    county: "Leicester river-cut",
    lesson:
      "The lip's tell is a band. The south step is off it. Pits are not used to force a plunge.",
    arena: OPEN,
    ellis: { x: 120, y: 152 },
    checkpoints: [{ x: 120, y: 168 }],
    extra_dangers: [
      { id: "lip", t: 90, tell: 48, active: 16, damage: 2, rect: { x: 16, y: 144, w: 208, h: 16 } },
    ],
    members: [{ enemy: "slate_fissure_crab", at: { x: 40, y: 40 }, facing: "E", delay: 400 }],
  }),
  terrain({
    id: "terrain_button_lee",
    name: "Button Lee",
    county: "Button Bay ice",
    lesson:
      "A skate column owns the center. The east lee is the walk. Ice does not add a second tell.",
    arena: OPEN,
    ellis: { x: 120, y: 152 },
    checkpoints: [{ x: 168, y: 152 }],
    extra_dangers: [
      {
        id: "skate",
        t: 90,
        tell: 48,
        active: 16,
        damage: 2,
        rect: { x: 112, y: 136, w: 16, h: 24 },
      },
    ],
  }),
  terrain({
    id: "terrain_dead_creek_pocket",
    name: "Dead Creek Pocket",
    county: "Dead Creek",
    lesson:
      "The bite is a pocket in the west reeds. The legal walk never enters it. Fins are for the mistake.",
    arena: OPEN,
    ellis: { x: 120, y: 152 },
    checkpoints: [{ x: 168, y: 120 }],
    extra_dangers: [
      {
        id: "reed_pocket",
        t: 80,
        tell: 48,
        active: 20,
        damage: 1,
        rect: { x: 24, y: 72, w: 40, h: 32 },
      },
    ],
  }),
  terrain({
    id: "terrain_snake_exhale",
    name: "Snake Mountain Exhale",
    county: "Snake Mountain switchback",
    lesson:
      "The column is vertical. Step east and the exhale misses. The mountain does not add a diagonal.",
    arena: OPEN,
    ellis: { x: 120, y: 152 },
    checkpoints: [{ x: 176, y: 152 }],
    extra_dangers: [
      {
        id: "exhale",
        t: 100,
        tell: 56,
        active: 14,
        damage: 1,
        rect: { x: 112, y: 136, w: 16, h: 24 },
      },
    ],
  }),
  terrain({
    id: "terrain_harbor_sag",
    name: "Harbor Sag",
    county: "Basin Harbor",
    lesson:
      "The snap is a band above the south plank. Stand on the plank. The cable is the only hit.",
    arena: OPEN,
    ellis: { x: 120, y: 152 },
    checkpoints: [{ x: 120, y: 176 }],
    extra_dangers: [
      { id: "sag", t: 84, tell: 48, active: 16, damage: 2, rect: { x: 16, y: 136, w: 208, h: 16 } },
    ],
  }),
  terrain({
    id: "terrain_ripton_ash",
    name: "Ripton Ash",
    county: "Ripton burn scar",
    lesson:
      "Ash falls in a band. The south step is clear. A lamp is not required and is not a solve here.",
    arena: OPEN,
    ellis: { x: 120, y: 152 },
    checkpoints: [{ x: 96, y: 176 }],
    extra_dangers: [
      { id: "ash", t: 96, tell: 48, active: 16, damage: 1, rect: { x: 16, y: 144, w: 208, h: 16 } },
    ],
  }),
  terrain({
    id: "terrain_shared_safe",
    name: "Shared Safe on the Green",
    county: "Vergennes green",
    lesson:
      "Two tells on one beat, harmonized, because the southeast step is outside both. This is the only legal overlap.",
    arena: OPEN,
    conductor: "harmonized",
    ellis: { x: 176, y: 168 },
    checkpoints: [{ x: 176, y: 168 }],
    extra_dangers: [
      {
        id: "west_line",
        t: 80,
        tell: 48,
        active: 18,
        damage: 2,
        rect: { x: 16, y: 48, w: 80, h: 24 },
      },
      {
        id: "north_line",
        t: 80,
        tell: 48,
        active: 18,
        damage: 2,
        rect: { x: 16, y: 96, w: 24, h: 64 },
      },
    ],
  }),
];

const PROTECTION = [
  protection({
    id: "protect_the_calf",
    name: "Protect the Calf",
    county: "Weybridge barn",
    lesson:
      "The timber's strike is aimed at the calf. The intercept is a tile. The rod, or simply standing the tile, keeps the calf's HP.",
    members: [{ enemy: "butter_churn_ram", at: { x: 40, y: 40 }, facing: "S", delay: 5000 }],
    protection: {
      name: "calf",
      hp: 6,
      intercept: { x: 120, y: 152 },
      strikes: [{ t: 90, damage: 4 }],
    },
  }),
  protection({
    id: "protect_the_nest",
    name: "Protect the Nest",
    county: "Weybridge rafter",
    lesson:
      "A marked dive is aimed at the nest, not at you, if you take the intercept under the rafter.",
    members: [{ enemy: "barn_swallow_duelist", at: { x: 48, y: 48 }, facing: "S", delay: 5000 }],
    protection: {
      name: "nest",
      hp: 3,
      intercept: { x: 96, y: 120 },
      strikes: [{ t: 110, damage: 2 }],
    },
  }),
  protection({
    id: "protect_the_mute_bell",
    name: "Protect the Mute Bell",
    county: "Shoreham schoolyard",
    lesson: "The ring would crack the mute bell. Stand the step. The bell is not a combatant.",
    members: [{ enemy: "mayfly_lantern", at: { x: 40, y: 64 }, facing: "S", delay: 5000 }],
    protection: {
      name: "bell",
      hp: 4,
      intercept: { x: 152, y: 152 },
      strikes: [{ t: 70, damage: 3 }],
    },
  }),
  protection({
    id: "protect_the_yearling",
    name: "Protect the Yearling",
    county: "Addison road verge",
    lesson:
      "The bolt is aimed down the road at the yearling's shadow. The verge intercept is off the lane.",
    members: [{ enemy: "yearling_of_the_road", at: { x: 120, y: 48 }, facing: "S", delay: 5000 }],
    protection: {
      name: "yearling",
      hp: 5,
      intercept: { x: 64, y: 152 },
      strikes: [{ t: 120, damage: 3 }],
    },
  }),
];

const MASTERY = [
  mastery({
    id: "mastery_map_scrap",
    name: "The Map Scrap",
    county: "Middlebury covered bridge",
    lesson:
      "Do not swing at the ledger fox. God-damage would forfeit the scrap. The room is won by leaving the blade down.",
    members: [{ enemy: "ledger_fox", at: { x: 120, y: 88 }, facing: "S", delay: 0 }],
  }),
  mastery({
    id: "mastery_field_glass",
    name: "Field Glass",
    county: "Cornwall meadow",
    lesson:
      "Late-game the cow is still a mercy. The glass is the talk. A grave empties the field for this life.",
    tool: "homestead_glass",
    members: [
      { enemy: "cow_of_the_fourteen_year_field", at: { x: 120, y: 88 }, facing: "S", delay: 0 },
    ],
  }),
  mastery({
    id: "mastery_do_not_answer",
    name: "Do Not Answer",
    county: "Cornwall creek font",
    lesson:
      "The second draft attacks a drawn blade. Sheathe, and the copy has nothing to play. Killing it loses the font.",
    members: [{ enemy: "second_ellis_draft", at: { x: 120, y: 88 }, facing: "S", delay: 0 }],
  }),
  mastery({
    id: "mastery_sign_and_wait",
    name: "Sign and Wait",
    county: "Otter Creek footbridge",
    lesson:
      "The toll youth is a person. Waiting with the blade down is the contract. A rock is the fool's version of this room.",
    members: [{ enemy: "creek_toll_youth", at: { x: 120, y: 72 }, facing: "S", delay: 0 }],
  }),
  mastery({
    id: "mastery_two_mercies",
    name: "Two Mercies",
    county: "Bridge shadow over a Cornwall wall",
    lesson:
      "Fox and cow together. Glass satisfies the cow. An undrawn blade satisfies the fox. Neither grave is progress.",
    tool: "homestead_glass",
    members: [
      { enemy: "ledger_fox", at: { x: 88, y: 80 }, facing: "S", delay: 0 },
      { enemy: "cow_of_the_fourteen_year_field", at: { x: 152, y: 80 }, facing: "S", delay: 0 },
    ],
  }),
  mastery({
    id: "mastery_net_and_scrap",
    name: "Net and Scrap",
    county: "Weybridge rafter by the covered bridge",
    lesson: "Net the swallow. Leave the fox. One tool, two mercies, no kill.",
    tool: "net",
    members: [
      { enemy: "barn_swallow_duelist", at: { x: 96, y: 64 }, facing: "S", delay: 0 },
      { enemy: "ledger_fox", at: { x: 152, y: 96 }, facing: "W", delay: 0 },
    ],
  }),
  mastery({
    id: "mastery_dark_lamp_on_the_scar",
    name: "Dark Lamp on the Scar",
    county: "Ripton burn scar",
    lesson:
      "Even with a god's lamp available, the mastery is to keep it dark. Holt walks you through. The smother is still in the state graph.",
    lamp: false,
    members: [{ enemy: "ripton_fire_warden", at: { x: 120, y: 88 }, facing: "S", delay: 0 }],
  }),
];

export const encounters = [...TEACHING, ...MIXED, ...TERRAIN, ...PROTECTION, ...MASTERY];

export const ENCOUNTER_COUNTS = encounters.reduce((counts, encounter) => {
  counts[encounter.kind] = (counts[encounter.kind] || 0) + 1;
  counts.total = (counts.total || 0) + 1;
  return counts;
}, {});
