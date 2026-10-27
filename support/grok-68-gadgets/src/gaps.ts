/** Host systems this pack does not pretend to own. */

export type Gap = { id: string; title: string; detail: string };

export const HOST_GAPS: Gap[] = [
  {
    id: "catalog-768",
    title: "Planned 768-item catalog",
    detail: "No prior PREINCARNATION loot catalog was mounted in this workspace. Duplicate judgment against that catalog is impossible. New ids were not treated as proof of new content.",
  },
  {
    id: "campaign-inventory",
    title: "Campaign inventory",
    detail: "Discovery sites, weights, and storage rules are data. They are not spawned into a county map or a campaign save schema, because neither schema is in this workspace.",
  },
  {
    id: "enemy-ai",
    title: "Enemy AI",
    detail: "narrow, flock, rhythm, burrow, keen-ear, and phototactic change an alert flag on the bench. There is no navigation, animation, or damage model.",
  },
  {
    id: "lamps",
    title: "Lamp props",
    detail: "Approved lamps change a mode string. No scene light, mesh, or moth simulation exists outside the bench.",
  },
  {
    id: "audio",
    title: "Diegetic audio",
    detail: "The wax recorder stores an authored sound id. The bench can hum a stand-in for a named take. It does not capture a microphone or play a field recording of the creek.",
  },
  {
    id: "puzzles",
    title: "Puzzle geometry",
    detail: "Locks, gates, and compartments flip solved, revealed, or unlatched. They are not wired to door meshes or dialogue.",
  },
  {
    id: "trade",
    title: "Trade economy",
    detail: "A sale adds a local credit number or is refused as an heirloom. No merchant wallet or base-game currency id was available.",
  },
  {
    id: "shelf",
    title: "Display furniture",
    detail: "The study shelf is four slots on the bench, not a room in a house map.",
  },
  {
    id: "weather",
    title: "Weather",
    detail: "Wind, wet, dawn, and pressure are scene flags, not a county forecast.",
  },
  {
    id: "npcs",
    title: "NPC schedules",
    detail: "The two-note pipe sets friendApproaching. No character controller exists to walk that person in.",
  },
  {
    id: "physics",
    title: "Physics",
    detail: "Balances, sash lifts, chain lengths, and drifts are numbers, not rigid bodies.",
  },
  {
    id: "base-craft",
    title: "Cross-pack crafting",
    detail: "Restore materials are pack-local names (clock oil, rouge, beeswax). They are not ids from the absent base catalog.",
  },
];

/** Connections the pack does implement, so they are not listed as missing. */
export const PACK_LINKS = [
  "Fork calibrates the resonator; the wrench opens only a revealed compartment; pads keep rhythm-kind asleep.",
  "Prism retunes only an approved lamp; the cider refractor softens a stripe that is already up.",
  "Counterweight needs the jack chain overhead and the penny set to accuse a short weight.",
  "Wax recorder takes one audible or horn-named sound and plays it into an authored lock. Recast needs the boiling cup or a clean pot.",
  "Maintaining spring lends the winding bird one wind.",
  "Collimator bearing lengthens a corridor distraction. Without it, a needs-bearing foe gets half.",
  "Dry compass refuses a bearing when iron shares the pocket.",
  "Hand level's lineLevel is what makes the half-chain willing to measure.",
  "Rain drum plus aneroid confirm weather. Either one refuses to call it a fact.",
  "Offset book on the shelf copies later readings into the notes.",
];
