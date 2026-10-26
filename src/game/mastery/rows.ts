/** Generated catalog rows. Provenance is flavor; effect ids are the binding. */
export const ROWS = [
  {
    "n": 1,
    "discipline": "quarry",
    "kind": "fitting",
    "name": "Plug Wedge",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "pattern",
        "mode": "set",
        "value": "single"
      },
      {
        "effect": "action.smash",
        "channel": "reach",
        "mode": "add",
        "value": 4
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "pattern-smash",
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Under a cracked plug in the quarry, after the hammer is already yours.",
    "provenance": "Cut by a quarryman who was tired of opening the whole vein at once.",
    "clause": "The plus of cracked marble becomes the single aimed tile. Neighbors stay plugged."
  },
  {
    "n": 2,
    "discipline": "quarry",
    "kind": "implement",
    "name": "Vein Spoon",
    "effect": "action.bomb",
    "ops": [
      {
        "effect": "action.bomb",
        "channel": "radius",
        "mode": "add",
        "value": 8
      },
      {
        "effect": "action.bomb",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.4
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Beside the powder cache in the quarry approach, once kegs are in the pack.",
    "provenance": "A spoon hammered flat by someone who measured blast rings in the gravel.",
    "clause": "The keg's blast reaches farther and the next keg is slower to set."
  },
  {
    "n": 3,
    "discipline": "quarry",
    "kind": "implement",
    "name": "Grave Bit",
    "effect": "action.dig",
    "ops": [
      {
        "effect": "action.dig",
        "channel": "radius",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.dig",
        "channel": "windup",
        "mode": "add",
        "value": 0.3
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "shovel",
    "anyRelic": [
      "shovel"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Stuck in a mound on the edge of Middlebury, fourteen winters on.",
    "provenance": "Ground from a bit that outlasted the farmhand who dropped it.",
    "clause": "The shovel searches a wider circle and bites later. Erosion still runs."
  },
  {
    "n": 4,
    "discipline": "quarry",
    "kind": "inscribed",
    "name": "Peen Collar",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "knockback",
        "mode": "add",
        "value": 8
      },
      {
        "effect": "action.smash",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.85
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Scratched into a collar in the Rutland yard, where the civic hammer hangs.",
    "provenance": "Inscribed by a smith who wanted bodies moved, not opened.",
    "clause": "The follow-up slash inside smash shoves harder and cuts softer."
  },
  {
    "n": 5,
    "discipline": "quarry",
    "kind": "modifier",
    "name": "Night Plug",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "cooldown",
        "mode": "add",
        "value": -0.04
      },
      {
        "effect": "action.smash",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.15
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Nailed into a night wall of the quarry, lamp or no lamp.",
    "provenance": "A plug turned modifier by someone who worked the vein after dark.",
    "clause": "The hammer recovers a little sooner and your own step drags after the blow."
  },
  {
    "n": 6,
    "discipline": "quarry",
    "kind": "fitting",
    "name": "Charge Crimp",
    "effect": "action.bomb",
    "ops": [
      {
        "effect": "action.bomb",
        "channel": "damageMul",
        "mode": "mul",
        "value": 1.25
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "hp",
      "amount": 1
    },
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Crimped onto a keg strap in the Bristol barn cache.",
    "provenance": "A powder hand's crimp. It never gives the keg back.",
    "clause": "The same keg hits harder because the crimp takes a bite of your own hp on the press."
  },
  {
    "n": 7,
    "discipline": "quarry",
    "kind": "modifier",
    "name": "Spall Screen",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "radius",
        "mode": "add",
        "value": 4
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "mp",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Leaning on the marble stair inside the quarry.",
    "provenance": "Woven from spall by a cutter who spent mana like water.",
    "clause": "Chips fly farther. The screen draws 1 mp when the hammer comes down."
  },
  {
    "n": 8,
    "discipline": "quarry",
    "kind": "inscribed",
    "name": "Lodestone Chip",
    "effect": "action.dig",
    "ops": [
      {
        "effect": "action.dig",
        "channel": "radius",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.dig",
        "channel": "windup",
        "mode": "add",
        "value": 0.15
      },
      {
        "effect": "action.dig",
        "channel": "targetFilter",
        "mode": "set",
        "value": "fresh-mound"
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "dig-mark",
    "anchor": "y-relic",
    "ySlot": "shovel",
    "anyRelic": [
      "shovel"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Lodged in the dirt of your own last grave, once the shovel is back.",
    "provenance": "A chip that remembers the last body and no one else's.",
    "clause": "The search prefers a fresh mound and still runs erodeGrave. It does not open marble."
  },
  {
    "n": 9,
    "discipline": "quarry",
    "kind": "implement",
    "name": "Rim Mallet",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "knockback",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.smash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.25
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "On the rim of the quarry mouth, not inside the dark.",
    "provenance": "Turned from a broken mallet head after a shift that ran long.",
    "clause": "The rim adds knockback to the follow-up slash and makes the next smash wait."
  },
  {
    "n": 10,
    "discipline": "quarry",
    "kind": "modifier",
    "name": "Dust Veil",
    "effect": "action.bomb",
    "ops": [
      {
        "effect": "action.bomb",
        "channel": "radius",
        "mode": "add",
        "value": -6
      },
      {
        "effect": "action.bomb",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.7
      },
      {
        "effect": "action.bomb",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Folded into a niche above the vein, dusty, not magical.",
    "provenance": "A veil worn by a blaster who wanted to stay in the hole.",
    "clause": "The blast is smaller and weaker, and you are briefly harder to hit after it."
  },
  {
    "n": 11,
    "discipline": "quarry",
    "kind": "implement",
    "name": "Seam Chisel",
    "effect": "action.dig",
    "ops": [
      {
        "effect": "action.dig",
        "channel": "surveyRadius",
        "mode": "add",
        "value": 3
      },
      {
        "effect": "action.dig",
        "channel": "windup",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "shovel",
    "anyRelic": [
      "shovel"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Left on a seam the hammer had not opened yet.",
    "provenance": "A chisel that looks and does not strike.",
    "clause": "Digging also surveys nearby cracked seams. It does not convert them. Smash or a keg still must."
  },
  {
    "n": 12,
    "discipline": "quarry",
    "kind": "fitting",
    "name": "Keyway Nail",
    "effect": "action.bomb",
    "ops": [
      {
        "effect": "action.bomb",
        "channel": "radius",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.bomb",
        "channel": "windup",
        "mode": "add",
        "value": 0.35
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 1,
    "magic": false,
    "discovery": "Driven into a keyway stone beside a cracked tile.",
    "provenance": "A nail from the lock side of the vein. Removal mid-wait drops the extra radius; the keg stays spent.",
    "clause": "The keg waits, then blooms wider. If you are still inside, the nail bites you when it resolves."
  },
  {
    "n": 13,
    "discipline": "quarry",
    "kind": "modifier",
    "name": "Marble Thread",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "reach",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.smash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.06
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Threaded through a hairline in the temple marble.",
    "provenance": "Spun from marble dust and wire by a cutter on a second life.",
    "clause": "The slash that smash already calls reaches farther and recovers slower."
  },
  {
    "n": 14,
    "discipline": "quarry",
    "kind": "inscribed",
    "name": "Witness Chisel",
    "effect": "action.smash",
    "ops": [
      {
        "effect": "action.smash",
        "channel": "pattern",
        "mode": "set",
        "value": "line3"
      },
      {
        "effect": "action.smash",
        "channel": "knockback",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.smash",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.8
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "pattern-smash",
    "anchor": "y-relic",
    "ySlot": "hammer",
    "anyRelic": [
      "hammer"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Witness marks on the quarry's north plug.",
    "provenance": "Inscribed by someone who wanted a corridor, not a room.",
    "clause": "The plus becomes a line of three. The follow-up slash hits softer and shoves harder."
  },
  {
    "n": 15,
    "discipline": "creek",
    "kind": "fitting",
    "name": "Otter Cuff",
    "effect": "action.swim",
    "ops": [
      {
        "effect": "action.swim",
        "channel": "duration",
        "mode": "add",
        "value": 0.4
      },
      {
        "effect": "action.swim",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": [
      "flippers"
    ],
    "dashGate": false,
    "flippers": true,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Snagged on a root in Otter Creek, west of the Green.",
    "provenance": "An otter-cuff the fishers at the creek already knew by sight.",
    "clause": "The water step glides longer. Landing drags. Fins are still required."
  },
  {
    "n": 16,
    "discipline": "creek",
    "kind": "inscribed",
    "name": "Current Vane",
    "effect": "action.swim",
    "ops": [
      {
        "effect": "action.swim",
        "channel": "speedMul",
        "mode": "mul",
        "value": 1.15
      },
      {
        "effect": "action.swim",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.12
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": [
      "flippers"
    ],
    "dashGate": false,
    "flippers": true,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Nailed to a piling at the Vergennes landing.",
    "provenance": "Inscribed with a current-mark that never learned to walk.",
    "clause": "You swim faster and settle slower when the stroke ends."
  },
  {
    "n": 17,
    "discipline": "creek",
    "kind": "fitting",
    "name": "Hook Sleeve",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "duration",
        "mode": "add",
        "value": 0.15
      },
      {
        "effect": "action.hook",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.15
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Slid over a mooring hook on the creek wall.",
    "provenance": "A sleeve stitched for the chain, not a new chain.",
    "clause": "The Sugar-line lives longer in the air and is slower to throw again."
  },
  {
    "n": 18,
    "discipline": "creek",
    "kind": "implement",
    "name": "Latch Bell",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "radius",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.hook",
        "channel": "windup",
        "mode": "add",
        "value": 0.08
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Hung on a post the line already loves.",
    "provenance": "A bell from a ferry latch, retimed, not reborn.",
    "clause": "The latch forgives a wider miss and leaves the hand a beat later."
  },
  {
    "n": 19,
    "discipline": "creek",
    "kind": "fitting",
    "name": "Floe Nail",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.dash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.12
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Frozen into creek ice near the Salisbury bank.",
    "provenance": "A nail pulled from a floe by someone who already owned the boots.",
    "clause": "An open dash covers more ground and waits longer. It does not open the dash gate."
  },
  {
    "n": 20,
    "discipline": "creek",
    "kind": "modifier",
    "name": "Creek Weight",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "speedMul",
        "mode": "mul",
        "value": 0.85
      },
      {
        "effect": "action.hook",
        "channel": "knockback",
        "mode": "add",
        "value": 6
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Tied to a sinker at the Ferrisburgh landing.",
    "provenance": "A weight the creek used on trotlines.",
    "clause": "The chain flies slower and the latch shoves harder."
  },
  {
    "n": 21,
    "discipline": "creek",
    "kind": "implement",
    "name": "Eddy Pin",
    "effect": "action.swim",
    "ops": [
      {
        "effect": "action.swim",
        "channel": "distance",
        "mode": "add",
        "value": 2
      },
      {
        "effect": "action.swim",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.18
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": [
      "flippers"
    ],
    "dashGate": false,
    "flippers": true,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Pinned in an eddy behind a Middlebury bridge stone.",
    "provenance": "A pin that only matters once the fins are on.",
    "clause": "Each legal water step is longer, and you are slow after it."
  },
  {
    "n": 22,
    "discipline": "creek",
    "kind": "fitting",
    "name": "Reed Wrap",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "duration",
        "mode": "add",
        "value": 0.12
      },
      {
        "effect": "action.hook",
        "channel": "targetFilter",
        "mode": "set",
        "value": "posts-only"
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Wrapped on reeds at the creek mouth.",
    "provenance": "A wrap that narrowed the Sugar-line's manners.",
    "clause": "The line reaches a little longer and will only latch posts, not pots or beasts."
  },
  {
    "n": 23,
    "discipline": "creek",
    "kind": "modifier",
    "name": "Ice Buckle",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.1
      },
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": -4
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Buckled to a boot already allowed to dash, found on the ice.",
    "provenance": "A buckle from a creek skater who never owned a new verb.",
    "clause": "The dash gains a short untouchable beat and covers less ground. The gate stays as it was."
  },
  {
    "n": 24,
    "discipline": "creek",
    "kind": "implement",
    "name": "Otter Line",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "speedMul",
        "mode": "mul",
        "value": 1.1
      },
      {
        "effect": "action.hook",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.1
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Coiled where otters slide, north of the landing.",
    "provenance": "Braided from an otter-line the fishers retired.",
    "clause": "The chain is quicker and the hand is slower to recast."
  },
  {
    "n": 25,
    "discipline": "creek",
    "kind": "fitting",
    "name": "Wet Boot Spike",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.dash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": -4
      },
      {
        "effect": "action.dash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.2
      }
    ],
    "when": {
      "inWater": true
    },
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Spiked into a boot-sole at the creek ford.",
    "provenance": "A spike for someone who already dashed, wet or dry.",
    "clause": "In the water the open dash is longer. On land it is shorter. The wait grows either way."
  },
  {
    "n": 26,
    "discipline": "creek",
    "kind": "modifier",
    "name": "Current Hook",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "speedMul",
        "mode": "mul",
        "value": 1.2
      },
      {
        "effect": "action.hook",
        "channel": "duration",
        "mode": "add",
        "value": -0.1
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Hooked on a current-vane the landing already used.",
    "provenance": "A head rebent by the creek, not a second relic.",
    "clause": "The head flies faster and dies sooner."
  },
  {
    "n": 27,
    "discipline": "creek",
    "kind": "implement",
    "name": "Bank Nail",
    "effect": "action.swim",
    "ops": [
      {
        "effect": "action.swim",
        "channel": "speedMul",
        "mode": "mul",
        "value": 1.1
      },
      {
        "effect": "action.swim",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.15
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": [
      "flippers"
    ],
    "dashGate": false,
    "flippers": true,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Hammered into the bank path, useless without fins.",
    "provenance": "A nail the bank gave up after a flood.",
    "clause": "Legal swimming is quicker. The bank makes you heavy when the stroke ends."
  },
  {
    "n": 28,
    "discipline": "creek",
    "kind": "fitting",
    "name": "Spill Collar",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "radius",
        "mode": "add",
        "value": 6
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "mp",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Collar found in the spill below the Vergennes falls.",
    "provenance": "A collar that spends mana the chain never asked for.",
    "clause": "The latch is wider. The collar takes 1 mp on the throw."
  },
  {
    "n": 29,
    "discipline": "sugar",
    "kind": "fitting",
    "name": "Ladle Ferrule",
    "effect": "action.slash",
    "ops": [
      {
        "effect": "action.slash",
        "channel": "statusSlow",
        "mode": "add",
        "value": 0.35
      },
      {
        "effect": "action.slash",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.88
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Ferrule off a ladle in the sugarhouse.",
    "provenance": "Fitted by a boiler who liked a sticky blade more than a deep one.",
    "clause": "The slash leaves slow, the way a sugared affix already can, and the cut is softer."
  },
  {
    "n": 30,
    "discipline": "sugar",
    "kind": "inscribed",
    "name": "Sap Weight",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "statusSlow",
        "mode": "add",
        "value": 0.4
      },
      {
        "effect": "action.hook",
        "channel": "speedMul",
        "mode": "mul",
        "value": 0.8
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Hung in the sugarhouse rafters above the pan.",
    "provenance": "Inscribed on a sap-weight. Magic enough that weather keeps it in the grave.",
    "clause": "A latched body slows. The Sugar-line itself is heavier in the air."
  },
  {
    "n": 31,
    "discipline": "sugar",
    "kind": "implement",
    "name": "Tin Spoon",
    "effect": "action.sip",
    "ops": [
      {
        "effect": "action.sip",
        "channel": "heal",
        "mode": "add",
        "value": 1
      },
      {
        "effect": "action.sip",
        "channel": "windup",
        "mode": "add",
        "value": 0.25
      },
      {
        "effect": "action.sip",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.3
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": true,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "In the tin beside the sugarhouse bottle rack.",
    "provenance": "A spoon that never refills what sip already spent.",
    "clause": "Syrup heals one more heart and you drink slower. The bottle is still emptied on the press."
  },
  {
    "n": 32,
    "discipline": "sugar",
    "kind": "fitting",
    "name": "Sugar-line Braid",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "duration",
        "mode": "add",
        "value": 0.1
      },
      {
        "effect": "action.hook",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Braided onto the hookshot's own line, not a replacement line.",
    "provenance": "A braid from the sugarhouse that the relic was already named for.",
    "clause": "The chain's life grows by a tenth and the recast waits longer."
  },
  {
    "n": 33,
    "discipline": "sugar",
    "kind": "modifier",
    "name": "Grade Nail",
    "effect": "action.slash",
    "ops": [
      {
        "effect": "action.slash",
        "channel": "statusSlow",
        "mode": "add",
        "value": 0.2
      },
      {
        "effect": "action.slash",
        "channel": "reach",
        "mode": "add",
        "value": -2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Nailed into a grade-stake behind the sugarhouse.",
    "provenance": "A nail from the grading shed, mean and short.",
    "clause": "The cut slows a body and your reach shortens."
  },
  {
    "n": 34,
    "discipline": "sugar",
    "kind": "inscribed",
    "name": "Dark Thread",
    "effect": "action.sip",
    "ops": [
      {
        "effect": "action.sip",
        "channel": "heal",
        "mode": "add",
        "value": -1
      },
      {
        "effect": "action.slash",
        "channel": "statusSlow",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": true,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Wound on a dark-syrup thread in the sugarhouse loft.",
    "provenance": "Inscribed by a boiler on a bitter year. Weather keeps the thread.",
    "clause": "This sip heals less. The next slash carries a little slow. The bottle is not returned."
  },
  {
    "n": 35,
    "discipline": "sugar",
    "kind": "fitting",
    "name": "Crystal Bead",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "radius",
        "mode": "add",
        "value": 3
      },
      {
        "effect": "action.hook",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.1
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A bead cooled on the sugarhouse windowsill.",
    "provenance": "Sugar that set around a bit of twine.",
    "clause": "The latch is a little wider and you are slow after the throw."
  },
  {
    "n": 36,
    "discipline": "sugar",
    "kind": "modifier",
    "name": "Boil Collar",
    "effect": "action.slash",
    "ops": [
      {
        "effect": "action.slash",
        "channel": "damageMul",
        "mode": "mul",
        "value": 1.1
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "hp",
      "amount": 0.5
    },
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Buckled near the boil pan.",
    "provenance": "A collar from a night boil. It spends blood, not a new coin.",
    "clause": "The slash cuts harder. The collar takes half a heart on the press and does not give it back."
  },
  {
    "n": 37,
    "discipline": "sugar",
    "kind": "implement",
    "name": "Stick Ferrule",
    "effect": "action.cut",
    "ops": [
      {
        "effect": "action.cut",
        "channel": "radius",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.cut",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.05
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Ferrule off a stir-stick by the evaporator.",
    "provenance": "A ferrule for the cut you already make, not a new tool.",
    "clause": "The grass cut that already follows a slash reaches farther and recovers slower."
  },
  {
    "n": 38,
    "discipline": "sugar",
    "kind": "fitting",
    "name": "Pan Nail",
    "effect": "action.sip",
    "ops": [
      {
        "effect": "action.sip",
        "channel": "heal",
        "mode": "add",
        "value": 2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "karma",
      "amount": 1
    },
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": true,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Worked loose from the sugarhouse pan rim.",
    "provenance": "A nail that sweetens the sip and dirties the ledger.",
    "clause": "Syrup heals two more. The nail takes 1 karma on the press. The bottle stays empty."
  },
  {
    "n": 39,
    "discipline": "sugar",
    "kind": "implement",
    "name": "Seed Hook",
    "effect": "action.hook",
    "ops": [
      {
        "effect": "action.hook",
        "channel": "targetFilter",
        "mode": "set",
        "value": "post-pot-beast"
      },
      {
        "effect": "action.hook",
        "channel": "duration",
        "mode": "add",
        "value": -0.08
      },
      {
        "effect": "action.hook",
        "channel": "radius",
        "mode": "add",
        "value": 3
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "hookshot",
    "anyRelic": [
      "hookshot"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Hooked in a seed sack in the sugarhouse shed.",
    "provenance": "A hook that did not invent a new latch, only a wider one. Duration is the cost.",
    "clause": "The legal targets stay the ones the line already has. The latch is wider and the flight is shorter."
  },
  {
    "n": 40,
    "discipline": "sugar",
    "kind": "modifier",
    "name": "Comb Ferrule",
    "effect": "action.slash",
    "ops": [
      {
        "effect": "action.slash",
        "channel": "radius",
        "mode": "add",
        "value": 3
      },
      {
        "effect": "action.slash",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.9
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Ferrule from a honey-comb frame kept in the sugarhouse, not a new weapon.",
    "provenance": "Fitted by someone who wanted a wide sticky cut.",
    "clause": "The slash's hit circle grows and the damage shrinks."
  },
  {
    "n": 41,
    "discipline": "sugar",
    "kind": "implement",
    "name": "House Spoon",
    "effect": "action.sip",
    "ops": [
      {
        "effect": "action.sip",
        "channel": "heal",
        "mode": "add",
        "value": 2
      },
      {
        "effect": "action.sip",
        "channel": "windup",
        "mode": "add",
        "value": 0.4
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": false,
    "flippers": false,
    "bottle": true,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "In the house spoon jar at the sugarhouse door.",
    "provenance": "A spoon for the pause after the swallow, not a second bottle.",
    "clause": "The sip heals more if the spoon stays through the windup. Pull it early and the heal is ordinary. The bottle was already spent."
  },
  {
    "n": 42,
    "discipline": "ash",
    "kind": "fitting",
    "name": "Nock Chip",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "chargeThreshold",
        "mode": "set",
        "value": 0.08
      },
      {
        "effect": "action.bow",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.85
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "charge-threshold",
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Chipped from a nock in the woods cache where ash bows already turn up.",
    "provenance": "A chip that retimes the draw the engine already charges at 1.6.",
    "clause": "The ash bow may release earlier than 0.12 and the shot is weaker. The arrow is still one."
  },
  {
    "n": 43,
    "discipline": "ash",
    "kind": "modifier",
    "name": "Ember Wrap",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "statusBurn",
        "mode": "add",
        "value": 0.4
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "hp",
      "amount": 0.35
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Wrapped on a spent shaft behind the ash lot.",
    "provenance": "A wrap that writes into hitEnemy's burn, the same field as the ember affix.",
    "clause": "The shot's existing burn channel gains heat. The wrap takes hp on the press and never refunds an arrow."
  },
  {
    "n": 44,
    "discipline": "ash",
    "kind": "fitting",
    "name": "Quiet String",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "speedMul",
        "mode": "mul",
        "value": 0.8
      },
      {
        "effect": "action.bow",
        "channel": "duration",
        "mode": "add",
        "value": 0.15
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Strung as a spare beside the bowyer's stump.",
    "provenance": "A string for the shot you already fire.",
    "clause": "The arrow is slower and lives longer in the air."
  },
  {
    "n": 45,
    "discipline": "ash",
    "kind": "inscribed",
    "name": "Ash Serving",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "damageMul",
        "mode": "mul",
        "value": 1.15
      },
      {
        "effect": "action.bow",
        "channel": "chargeThreshold",
        "mode": "set",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "charge-threshold",
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Served into the grip of a woods-cache bow.",
    "provenance": "Inscribed on ash. Weather keeps it in the grave like other magic.",
    "clause": "A full draw hits harder. You may not release at the old 0.12."
  },
  {
    "n": 46,
    "discipline": "ash",
    "kind": "modifier",
    "name": "Spine Pin",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "knockback",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.bow",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.06
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Pinned through a spine of scrap ash.",
    "provenance": "A pin for the knockback hitEnemy already does.",
    "clause": "The hitEnemy knock the shot already applies is stronger, and the next draw waits."
  },
  {
    "n": 47,
    "discipline": "ash",
    "kind": "fitting",
    "name": "Soot Nail",
    "effect": "action.slash",
    "ops": [
      {
        "effect": "action.slash",
        "channel": "statusBurn",
        "mode": "add",
        "value": 0.3
      },
      {
        "effect": "action.slash",
        "channel": "reach",
        "mode": "add",
        "value": -2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Sooted nail from the camp beside the ash lot.",
    "provenance": "A nail that shares the burn stack with weapons.ts ember instead of adding a second full burn.",
    "clause": "The slash's burn channel rises and your reach falls. It stacks with ember under the diminishing rule."
  },
  {
    "n": 48,
    "discipline": "ash",
    "kind": "implement",
    "name": "Coal Thumb",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "radius",
        "mode": "add",
        "value": 8
      },
      {
        "effect": "action.bow",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.75
      },
      {
        "effect": "action.bow",
        "channel": "pattern",
        "mode": "set",
        "value": "splash"
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "pattern-bow",
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A coal-stained thumb stall in the woods cache.",
    "provenance": "A stall that changes the shot's shape, not its ammunition.",
    "clause": "The impact grows a splash and each hit is weaker. One arrow, still."
  },
  {
    "n": 49,
    "discipline": "ash",
    "kind": "modifier",
    "name": "Winter Nock",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "speedMul",
        "mode": "mul",
        "value": 1.25
      },
      {
        "effect": "action.bow",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.8
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Nock cut in winter from a downed ash.",
    "provenance": "A nock for speed, paid in damage.",
    "clause": "The arrow is faster and hits softer."
  },
  {
    "n": 50,
    "discipline": "ash",
    "kind": "fitting",
    "name": "Pitch Wrap",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "statusSlow",
        "mode": "add",
        "value": 0.25
      },
      {
        "effect": "action.bow",
        "channel": "chargeRate",
        "mode": "mul",
        "value": 0.8
      },
      {
        "effect": "action.bow",
        "channel": "windup",
        "mode": "add",
        "value": 0.12
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Pitch-wrapped where the bowyers warm their hands.",
    "provenance": "A wrap that delays the draw the engine already charges continuously.",
    "clause": "The shot can slow. The draw is lazier, and a short windup sits in front of it. Pull the wrap off during the wait and the slow does not ride."
  },
  {
    "n": 51,
    "discipline": "ash",
    "kind": "implement",
    "name": "Fletching Bead",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "duration",
        "mode": "add",
        "value": 0.2
      },
      {
        "effect": "action.bow",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.92
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Bead tied into fletching at the woods cache.",
    "provenance": "A bead for flight time, not a free arrow.",
    "clause": "The shot lives longer and hits a little softer."
  },
  {
    "n": 52,
    "discipline": "ash",
    "kind": "modifier",
    "name": "Camp Nail",
    "effect": "action.slash",
    "ops": [
      {
        "effect": "action.slash",
        "channel": "statusBurn",
        "mode": "add",
        "value": 0.45
      },
      {
        "effect": "action.slash",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.12
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "weapon",
    "ySlot": null,
    "anyRelic": [
      "sword"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "In the ash of a camp fire, not a new currency.",
    "provenance": "A camp nail that shares the burn stack.",
    "clause": "Slash burn rises, and you are slow after. A second burn fitting does not add its full number on top."
  },
  {
    "n": 53,
    "discipline": "ash",
    "kind": "fitting",
    "name": "Long Ash",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "duration",
        "mode": "add",
        "value": 0.25
      },
      {
        "effect": "action.bow",
        "channel": "chargeRate",
        "mode": "mul",
        "value": 0.75
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A long offcut of ash beside the bowyer stump.",
    "provenance": "An offcut that taxes the charge rate of 1.6.",
    "clause": "The arrow lives longer. The same hold draws less power, so the hit is weaker."
  },
  {
    "n": 54,
    "discipline": "ash",
    "kind": "inscribed",
    "name": "Split Serving",
    "effect": "action.bow",
    "ops": [
      {
        "effect": "action.bow",
        "channel": "pattern",
        "mode": "set",
        "value": "split2"
      },
      {
        "effect": "action.bow",
        "channel": "damageMul",
        "mode": "mul",
        "value": 0.45
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "pattern-bow",
    "anchor": "y-relic",
    "ySlot": "bow",
    "anyRelic": [
      "bow"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Split mark on a serving in the woods cache.",
    "provenance": "Inscribed to spread a shot, not to mint arrows.",
    "clause": "The release becomes two weaker shots. The press still spends one arrow, never zero and never two."
  },
  {
    "n": 55,
    "discipline": "lantern",
    "kind": "fitting",
    "name": "Quarry Hood",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightShape",
        "mode": "set",
        "value": "cone"
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 14
      },
      {
        "effect": "action.lantern",
        "channel": "lightInner",
        "mode": "add",
        "value": -16
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "light-shape",
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Hung on a peg inside the quarry, useless until the lamp is yours and readied.",
    "provenance": "A hood cut for the vein's dark. It does not turn the lamp on by itself.",
    "clause": "The lamp's radial pool becomes a cone: farther forward, darker at your feet. The relic is still required."
  },
  {
    "n": 56,
    "discipline": "lantern",
    "kind": "inscribed",
    "name": "Wick Collar",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 16
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "mp",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Collared around a cold wick in Middlebury, not Maeve's keepsake.",
    "provenance": "Inscribed by a neighbor of the Green. Weather keeps it. It is not the bond lantern.",
    "clause": "The open lamp throws farther. The collar takes 1 mp when you start the toggle and does not give it back."
  },
  {
    "n": 57,
    "discipline": "lantern",
    "kind": "implement",
    "name": "Shutter Plate",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "windup",
        "mode": "add",
        "value": 0.25
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 24
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A shutter screwed off a farmhouse lamp, fitted to the relic you already carry.",
    "provenance": "A plate that delays lanternOn. It never sets that flag without the oil lamp.",
    "clause": "The lamp waits, then throws farther. Remove the plate during the wait and the light is the ordinary 28/96."
  },
  {
    "n": 58,
    "discipline": "lantern",
    "kind": "fitting",
    "name": "Side Glass",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightShape",
        "mode": "set",
        "value": "wide"
      },
      {
        "effect": "action.lantern",
        "channel": "lightInner",
        "mode": "add",
        "value": 8
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": -10
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "light-shape",
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Side glass from a barn lantern in the Addison lot.",
    "provenance": "Glass that widens the pool the quarry shader already draws.",
    "clause": "A wide pool, clear at the center, short ahead. It will not share the lamp with another shape."
  },
  {
    "n": 59,
    "discipline": "lantern",
    "kind": "modifier",
    "name": "Soot Chimney",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 20
      },
      {
        "effect": "action.lantern",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.08
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A chimney cap sooted in the inn's lamp closet.",
    "provenance": "A cap that lengthens the outer radius and taxes the walk.",
    "clause": "The throw is longer and your step is heavier while you work the lamp."
  },
  {
    "n": 60,
    "discipline": "lantern",
    "kind": "inscribed",
    "name": "Green Glass",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightShape",
        "mode": "set",
        "value": "low"
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 6
      },
      {
        "effect": "action.lantern",
        "channel": "lightInner",
        "mode": "add",
        "value": -10
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "light-shape",
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Green glass in the college stair, a lamp fitting, not a secret sense.",
    "provenance": "Inscribed glass. It does not claim the sight upgrade. Weather keeps it.",
    "clause": "A low beam: a little farther, less light at the feet. It does not read the Open Sight upgrade."
  },
  {
    "n": 61,
    "discipline": "lantern",
    "kind": "fitting",
    "name": "Neighbor Collar",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 12
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "karma",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "On a neighbor's step off the Middlebury Green.",
    "provenance": "A collar from the street, not from Maeve Holloway's bond.",
    "clause": "A modest longer throw. Toggling spends 1 karma. This is not Maeve's lantern and does not copy the keepsake."
  },
  {
    "n": 62,
    "discipline": "lantern",
    "kind": "modifier",
    "name": "Reservoir Nail",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 8
      },
      {
        "effect": "action.lantern",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.05
      }
    ],
    "elseOps": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": -12
      },
      {
        "effect": "action.lantern",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.05
      }
    ],
    "when": {
      "minHp": 2
    },
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Nailed into a lamp reservoir that this pack refuses to turn into upkeep.",
    "provenance": "A nail for a health condition, not a reservoir to refill.",
    "clause": "Above two hearts the lamp throws a little farther. At one heart the throw shrinks. Nothing about it asks to be refilled."
  },
  {
    "n": 63,
    "discipline": "lantern",
    "kind": "implement",
    "name": "Quarry Nail",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 18
      },
      {
        "effect": "action.lantern",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.1
      }
    ],
    "elseOps": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": -6
      }
    ],
    "when": {
      "mapId": "quarry"
    },
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Driven into the quarry wall where the radial darkness already lives.",
    "provenance": "A nail that only helps on mapId quarry, and never without the lamp.",
    "clause": "Inside the quarry the outer light grows and you slow. Anywhere else the throw shrinks. The dark gate stays."
  },
  {
    "n": 64,
    "discipline": "lantern",
    "kind": "fitting",
    "name": "Hood Pin",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightShape",
        "mode": "set",
        "value": "narrow-cone"
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 28
      },
      {
        "effect": "action.lantern",
        "channel": "lightInner",
        "mode": "add",
        "value": -18
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "light-shape",
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Pinned through the quarry hood's spare seam.",
    "provenance": "A pin that narrows the same lamp, exclusive with other shapes.",
    "clause": "A narrow cone, long ahead and blind beside you."
  },
  {
    "n": 65,
    "discipline": "lantern",
    "kind": "modifier",
    "name": "Flicker Weight",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.lantern",
        "channel": "lightInner",
        "mode": "add",
        "value": -10
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A weight in the lamp's bail, found in the inn.",
    "provenance": "A weight that flickers the existing gradient, not a new light source.",
    "clause": "The average throw is a little farther and the trough at your feet is darker."
  },
  {
    "n": 66,
    "discipline": "lantern",
    "kind": "inscribed",
    "name": "Back Glass",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "lightShape",
        "mode": "set",
        "value": "rear-cone"
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": -20
      },
      {
        "effect": "action.lantern",
        "channel": "lightRear",
        "mode": "add",
        "value": 70
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "light-shape",
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Back glass from a wagon lamp in the Rutland yard.",
    "provenance": "Inscribed to look behind. It does not call warpHome.",
    "clause": "The forward throw shortens. A rear cone appears for a retreat. Not the Homestead glass relic."
  },
  {
    "n": 67,
    "discipline": "lantern",
    "kind": "implement",
    "name": "Palm Shutter",
    "effect": "action.lantern",
    "ops": [
      {
        "effect": "action.lantern",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.15
      },
      {
        "effect": "action.lantern",
        "channel": "lightOuter",
        "mode": "add",
        "value": -14
      },
      {
        "effect": "action.lantern",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.8
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "lantern",
    "anyRelic": [
      "lantern"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A palm-worn shutter from the farmhouse lamp shelf.",
    "provenance": "A shutter for timing, paid in radius and a long toggle wait.",
    "clause": "Working the lamp grants a brief untouchable beat, shortens the throw, and will not strobe."
  },
  {
    "n": 68,
    "discipline": "hollow",
    "kind": "inscribed",
    "name": "Seam Thread",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "distance",
        "mode": "add",
        "value": 8
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "mp",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Threaded in a seam of shadow off the quarry, after the cape has already dropped.",
    "provenance": "Inscribed thread. It lengthens the 28-step the cape already takes. Weather keeps it.",
    "clause": "The phase step is longer. The thread takes 1 extra mp on the press, on top of the cape's own mp, and does not refund either."
  },
  {
    "n": 69,
    "discipline": "hollow",
    "kind": "fitting",
    "name": "Hollow Nail",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": 8
      },
      {
        "effect": "action.dash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.18
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "In the hollow below the Green, beside a bootprint.",
    "provenance": "A nail for the dash engine.ts already gates. Not a new Shadow Step.",
    "clause": "An already-legal dash goes farther and waits longer. The nail does not open the gate."
  },
  {
    "n": 70,
    "discipline": "hollow",
    "kind": "modifier",
    "name": "Seam Pin",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.15
      },
      {
        "effect": "action.cape",
        "channel": "distance",
        "mode": "add",
        "value": -6
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Pinned in a seam the cape already passes.",
    "provenance": "A pin that retimes the 0.45 invuln.",
    "clause": "The phase's invuln lasts longer and the step is shorter."
  },
  {
    "n": 71,
    "discipline": "hollow",
    "kind": "fitting",
    "name": "Shadow Bead",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "windup",
        "mode": "add",
        "value": 0.12
      },
      {
        "effect": "action.cape",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "mp",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A bead in the cape's hem, found after the Sentinel's drop, not instead of it.",
    "provenance": "A bead that delays phase. The press still spends the cape's mp plus one.",
    "clause": "The phase waits, then the invuln is longer. Remove the bead during the wait and the invuln is 0.45 again. The extra mp stays spent."
  },
  {
    "n": 72,
    "discipline": "hollow",
    "kind": "implement",
    "name": "Phase Collar",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "pattern",
        "mode": "set",
        "value": "sidestep"
      },
      {
        "effect": "action.cape",
        "channel": "distance",
        "mode": "set",
        "value": 20
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": "pattern-cape",
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A collar from the hollow path east of the pines.",
    "provenance": "A collar that changes the direction of the step the cape already takes.",
    "clause": "The phase leaves sideways instead of forward, and the step is shorter than 28."
  },
  {
    "n": 73,
    "discipline": "hollow",
    "kind": "fitting",
    "name": "Quiet Step",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "cooldown",
        "mode": "add",
        "value": -0.06
      },
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": -6
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A quiet plate under a step in the hollow.",
    "provenance": "A plate for the boots cooldown of 0.28, not a way around it.",
    "clause": "The open dash recovers sooner and covers less ground."
  },
  {
    "n": 74,
    "discipline": "hollow",
    "kind": "modifier",
    "name": "Vein Thread",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "distance",
        "mode": "add",
        "value": 4
      },
      {
        "effect": "action.cape",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Thread caught on the vein side of the quarry dark.",
    "provenance": "A thread that spends no new resource and still taxes the walk.",
    "clause": "The step is slightly longer and you are heavy after it."
  },
  {
    "n": 75,
    "discipline": "hollow",
    "kind": "inscribed",
    "name": "Mourning Pin",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.05
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "karma",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "Pinned in the chapel grass, not a fate dialogue.",
    "provenance": "A mourning pin. Karma moves. The cape's mp cost remains.",
    "clause": "A small extra beat of invuln. The pin takes 1 karma on the press."
  },
  {
    "n": 76,
    "discipline": "hollow",
    "kind": "inscribed",
    "name": "Second Seam",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "pattern",
        "mode": "set",
        "value": "blink"
      },
      {
        "effect": "action.cape",
        "channel": "distance",
        "mode": "add",
        "value": 2
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "mp",
      "amount": 1
    },
    "group": "pattern-cape",
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": true,
    "discovery": "A second seam opened in a cape you already earned.",
    "provenance": "Inscribed as a blink shape. It does not refund mp.",
    "clause": "The step blinks along its path and is only a little longer. It costs 1 extra mp."
  },
  {
    "n": 77,
    "discipline": "hollow",
    "kind": "fitting",
    "name": "Low Nail",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.1
      },
      {
        "effect": "action.dash",
        "channel": "cooldown",
        "mode": "add",
        "value": 0.14
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Low in the hollow, where dashes already scuff the ground.",
    "provenance": "A nail that adds i-frames the dash does not have, and does not grant the dash.",
    "clause": "The dash, which grants no invuln in the engine, gains a short one and a longer wait."
  },
  {
    "n": 78,
    "discipline": "hollow",
    "kind": "modifier",
    "name": "Hollow Buckle",
    "effect": "action.dash",
    "ops": [
      {
        "effect": "action.dash",
        "channel": "distance",
        "mode": "add",
        "value": 10
      },
      {
        "effect": "action.dash",
        "channel": "selfSlow",
        "mode": "add",
        "value": 0.25
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "passive",
    "ySlot": null,
    "anyRelic": null,
    "dashGate": true,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "Buckled in the hollow below the pines.",
    "provenance": "A buckle for distance, paid in self slow.",
    "clause": "A long dash, then a heavy step. The gate is untouched."
  },
  {
    "n": 79,
    "discipline": "hollow",
    "kind": "fitting",
    "name": "Seam Weight",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.08
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": {
      "id": "hp",
      "amount": 1
    },
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "A weight sewn into the cape's seam.",
    "provenance": "A weight that spends hp the phase did not spend.",
    "clause": "A little more invuln. The weight takes 1 hp on the press."
  },
  {
    "n": 80,
    "discipline": "hollow",
    "kind": "implement",
    "name": "Last Stitch",
    "effect": "action.cape",
    "ops": [
      {
        "effect": "action.cape",
        "channel": "iFrames",
        "mode": "add",
        "value": 0.25
      },
      {
        "effect": "action.cape",
        "channel": "distance",
        "mode": "set",
        "value": 16
      }
    ],
    "elseOps": [],
    "when": null,
    "extraCost": null,
    "group": null,
    "anchor": "y-relic",
    "ySlot": "cape",
    "anyRelic": [
      "cape"
    ],
    "dashGate": false,
    "flippers": false,
    "bottle": false,
    "selfHarmIfInside": 0,
    "magic": false,
    "discovery": "The last stitch in a cape already on your shoulder.",
    "provenance": "A stitch that trades the 28-step for time.",
    "clause": "The invuln runs long and the step shrinks to 16."
  }
] as const;
