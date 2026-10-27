/**
 * Easier execution without deleting narrative content.
 * Assisted keeps every enemy, mercy, line, phase, and death.
 * It changes timing, survivability, and projectile pressure only.
 */
export const PROFILES = {
  standard: {
    id: "standard",
    reaction_frames: 8,
    tell_bonus: 0,
    damage_taken_mult: 1,
    iframe_bonus: 0,
    bonus_hp: 0,
    projectile_cap: 3,
    direction_commit_frames: 4,
    input_buffer_frames: 0,
    assisted_recovery: false,
    narrative: "full",
  },
  assisted: {
    id: "assisted",
    reaction_frames: 4,
    /** Telegraph states hold this many extra frames. Attack anims hold the tell pose. */
    tell_bonus: 8,
    /** Applied only when a blow actually lands. Authored notch values stay in the data. */
    damage_taken_mult: 0.5,
    iframe_bonus: 10,
    bonus_hp: 4,
    projectile_cap: 2,
    direction_commit_frames: 2,
    input_buffer_frames: 6,
    assisted_recovery: true,
    narrative: "full",
    does_not_remove: [
      "enemies",
      "minibosses",
      "mercies",
      "phase_dialogue",
      "persistence",
      "fourteen_year_deaths",
      "forfeits_for_killing_memory",
    ],
  },
};

export function getProfile(id = "standard") {
  const profile = PROFILES[id];
  if (!profile) throw new Error(`Unknown execution profile: ${id}`);
  return profile;
}
