# Fourteen Winters

Two households share one Addison County board for two eras. This is not a private row of units. Cards are places, people, tools, institutions, and unusual events. A match is fourteen winters for each household: seven in era I, then a threshold, then seven in era II.

## The county

The board is 4×4. North is row 0. One card occupies a plot. Borders are orthogonal. Diagonals do not count.

| | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| 0 | Bristol Notch, mountain | Hogback, mountain | Lincoln Gap, mountain, spring | Ripton Woods, forest |
| 1 | New Haven River | Bartlett Falls | Middlebury Falls | Otter Creek |
| 2 | Vergennes Wharf, town, water | Ferrisburgh, town | Middlebury Green, town | East Middlebury, town, ford |
| 3 | Shoreham Orchard, field | Addison Flats, field | Cornwall Meadow, field | Salisbury Marsh, marsh, water |

Row 1 is entirely river, and water. Lincoln Gap, Vergennes Wharf, East Middlebury, and Salisbury Marsh are the other water plots.

## Cards and decks

There are 72 cards, twelve in each identity: River Keepers, Orchard Houses, Hill Parish, Tool & Timber, Threshold Events, and Commons.

A deck is 24 cards. At most two copies of any card. At least 16 cards share one identity. Every card is in the county archive from the first sitting. Nothing is sold, packed, or locked behind a grind.

## Opening

A seed shuffles both decks with Fisher–Yates. The same seed and the same deck lists replay the same match. The opener starts at 4 warmth. The other household starts at 5. Both start at 0 memory. Each draws 5.

At the start of every winter, including the first, the active household gains 2 warmth, to a maximum of 8, and draws to 5 if they hold fewer and any card remains in deck or discard. An empty deck is reshuffled from that household’s discard.

## A winter

Exactly one action.

**Establish.** Pay the card’s warmth.

- A place needs a plot of its terrain, or any empty plot if it says any ground.
- A person must be beside a place you own, or beside your own person of the same line. If you own no place, a person may arrive on an empty town or field.
- A tool must be beside a card it fits. A tool that fits anything may be set on an empty board.
- An institution goes on an empty town, or on any empty plot with at least two occupied neighbors. If you already have a card beside that plot, the cost is 1 less, to a minimum of 0.
- An event does not take a plot. It resolves, then goes to the discard.

**Tend.** Spend 1 warmth. Put a tend mark on one of your cards. The limit is 2. Each mark is +1 when that card scores.

**Remember.** Draw up to 2. Put one card from the resulting hand under the deck. Gain 1 memory. Illegal if nothing can be drawn.

**Share.** Spend 1 warmth. Open a pact on one border between your card and theirs. One pact per border. Each pact scores 2 for both households.

**Pass.** Gain 1 warmth and 1 memory.

Hands never stay above 7. Overflow is discarded by a fixed priority: `base×10 − cost`, plus 5 if it is a place, minus 3 if it is an event, plus 2 if it has a later face. Higher stays. Ties keep the lexicographically smaller card id.

## The threshold

After both households have taken seven winters:

1. Seal the era. Structure is foundations + hearths + institutions + water + lineages. Pacts are not part of it. Each household banks `floor(structure / 2)`. A card with seal favor counts +2 only for this banking.
2. The era I opener chooses keepers first. The other household chooses second and can see that choice. A household may keep up to `2 + memory` of their own cards. One kept card may take its printed later face: tend and bonus clear. Every kept card counts as inherited. Unkept cards are discarded. A pact breaks if either plot is empty.
3. Hands above 5 are cut by the same priority, then drawn back to 5.
4. Warmth becomes 4 for the household about to open era II, and 5 for the other. The usual thaw still happens on the first winter.
5. Era II is opened by the household that did **not** open era I. Seven winters each. No second seal.

Inherited cards score +1 in their usual category. A later face uses the new name, base, tags, and flavor. Kind, cost, terrain, line, and tool fits stay as printed.

## Scoring

- **Foundations.** Places, people, and fitted tools: base + tend + bonus + 1 if inherited. A tool that is not beside a fitting card scores 0. Institutions are not foundations.
- **Hearths.** Each place you own tagged home scores 2, plus 1 for each of your cards beside it.
- **Institutions.** The owner scores 3 + tend + bonus + 1 if inherited + 1 per adjacent card of either household. The other household scores 1 for each of their cards beside it.
- **Water.** A route is an orthogonally connected group of at least two cards that sit on a water plot or have the water tag, and the group must include a water plot. A private route scores nothing extra. A shared route scores each household `2 × their cards in it + 1`.
- **Lineages.** For a line of yours with `n ≥ 2` people, score `3 × (n − 1)`. If any of those people inherited, score 3 more once.
- **Pacts.** 2 to each household for each pact still on the board.

Total = structure + pacts + sealed points. Higher total wins. Ties break to more inherited cards on the board, then more memory remaining, then a draw.

## Worked fragment

South owns Cider House on Shoreham with one tend mark (base 2), Ada Colby on Addison (base 2), Lewis Colby on Cornwall already inherited (base 1), and Rope Ferry on the New Haven (base 2). North owns Falls Mill on Bartlett Falls and Ferrisburgh Porch (base 2, home). One pact joins the ferry to the mill.

South foundations = 3 + 2 + 2 + 2 = 9. The house is a home with Ada beside it: hearths 3. The ferry helps North’s mill: institutions 1. The ferry and mill are one shared route: water 3. Ada and inherited Lewis are a Colby line: 3 + 3 = 6. The pact is 2. Structure 22. With the pact, 24.

North foundations = 2. The porch is a home beside the mill: hearths 3. The mill scores 3 + 2 adjacent cards = 5. Water 3. No lineage. Pact 2. Structure 13. With the pact, 15.

If this board were the sealing, South would bank 11 and North would bank 6. The engine test `scoring worked example` asserts these numbers.

## Lesson

The lesson uses the same rules for four winters an era, and one free keeper before memory is spent. A full match is seven winters and two free keepers.

## Keys

Arrows move on the county. 1–9 choose a card in hand. E establishes. T tends. S shares. R remembers. P passes. Enter confirms a plot. Esc clears a selection.
