/**
 * REFERENCE COMBAT UNITS — not taken from a shipping engine.
 * No PREINCARNATION combat module exists in this workspace.
 * Every simulator result is a model result until a real engine
 * converts these units (see INTEGRATION.md).
 */
export const UNIT_SOURCE = "reference_contract_not_engine";

export const REFERENCE_UNITS = {
  source: UNIT_SOURCE,
  tick_hz: 60,
  tile_px: 16,
  /** 4 notches display as one heart in UI. Damage numbers in data are notches. */
  notches_per_heart: 4,
  coordinate: {
    origin: "top_left",
    y: "down",
    facing: ["N", "E", "S", "W"],
    diagonal_movement: false,
  },
  ellis: {
    hurtbox: { w: 10, h: 10 },
    collision: { w: 12, h: 12 },
    hp: { mortal: 12, smuggler: 10, officer: 16, god: 24 },
    walk_px_per_frame: { mortal: 1, smuggler: 1.15, officer: 0.85, god: 1.2 },
    iframes_on_hit: { mortal: 24, smuggler: 20, officer: 28, god: 36 },
    hitstun_frames: 10,
    /** Fairness escape tests use the slowest walk. */
    fairness_form: "officer",
    blade_tap: {
      startup: 3,
      active: 4,
      recovery: 9,
      total: 16,
      hitstun_dealt: 8,
      damage: { mortal: 2, smuggler: 2, officer: 3, god: 4 },
      /** Center of the blade rect is 12px along facing. Rect is 14×12. */
      reach_center_px: 12,
      hitbox: { w: 14, h: 12 },
    },
    blade_spin: {
      startup: 10,
      active: 14,
      recovery: 16,
      total: 40,
      hitstun_dealt: 10,
      locks_movement: true,
      radius_px: 18,
      damage: { mortal: 3, smuggler: 2, officer: 4, god: 6 },
    },
    reaction_frames: { standard: 8, assisted: 4 },
    direction_commit_frames: { standard: 4, assisted: 2 },
  },
  tools: [
    "shovel",
    "sugar_line",
    "boots",
    "fins",
    "lamp",
    "hammer",
    "net",
    "homestead_glass",
    "cape",
    "block_rod",
    "ash_bow",
    "powder_keg",
  ],
  forms: ["mortal", "smuggler", "officer", "god"],
  families: [
    "quarry",
    "agricultural",
    "water",
    "memory",
    "surveyor",
    "unrealized",
    "insect",
    "human",
  ],
  global_rules: {
    hyperarmor_after_hits: 2,
    hyperarmor_frames: 24,
    hyperarmor_hitstun: 0,
    hyperarmor_damage: "half_round_down_minimum_0_for_chip",
    enemy_iframes: 0,
    knockback_stops_at_walls_and_hazard_edges: true,
    projectile_cap: { standard: 3, assisted: 2 },
    overlapping_tell_gap_frames: 10,
    visible_body_reaction_frames: 0,
    sudden_attack_uses_profile_reaction: true,
    god_damage_multiplier_vs: { memory: 0.5, unrealized: 0.5 },
    god_multiplier_rounding: "floor_minimum_1_if_base_positive",
    contact_damage_default: 0,
  },
  /**
   * Movement assumptions the unavoidable-damage test actually uses.
   * These are model assumptions, not measured player data.
   */
  movement_assumptions: {
    directions: 4,
    diagonals: false,
    fairness_speed_px_per_frame: 0.85,
    reaction_frames_standard: 8,
    reaction_applies_to: "onset of a telegraph the body did not already occupy",
    visible_hazards_reaction_frames: 0,
    self_commitment_tap_frames: 16,
    self_commitment_spin_frames: 40,
    competent_policy:
      "Will not start a tap while a reacted telegraph is on screen. Approaches only when no telegraph is active. Retreats for the whole active window. Uses blade taps, not spins.",
    greedy_spin_policy:
      "Separate. May be punished. A hit against greedy spin is not counted as unavoidable.",
    no_precognition_of_untelegraphed_attacks: true,
  },
};

export const CONVERSION = {
  time(frames, engineHz = 60) {
    return frames * (engineHz / REFERENCE_UNITS.tick_hz);
  },
  distance(px, enginePxPerTile = 16) {
    return px * (enginePxPerTile / REFERENCE_UNITS.tile_px);
  },
  hearts(notches) {
    return notches / REFERENCE_UNITS.notches_per_heart;
  },
};
