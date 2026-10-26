export function Rules({ onBack }: { onBack: () => void }) {
  return (
    <article className="fw-wrap" style={{ maxWidth: 720 }}>
      <button className="btn" type="button" onClick={onBack}>
        Back
      </button>
      <h1 className="display" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", margin: "16px 0 8px" }}>
        How a winter is played
      </h1>
      <p style={{ color: "var(--color-muted)", marginTop: 0 }}>
        Fourteen Winters is two households on one shared county, not two private rows of fighters. A match is two eras.
        Each household takes seven winters in an era. Between the eras, almost everything weathers, and a few cards are
        inherited or transformed.
      </p>

      <h2>The county</h2>
      <p>
        The board is four by four. North is the top row. Cards sit on plots, one card to a plot. Only orthogonal neighbors
        share a border. Diagonals do not.
      </p>
      <p>
        Bristol Notch and Hogback are mountain. Lincoln Gap is mountain and a spring. Ripton Woods is forest. The whole
        next row is river: New Haven, Bartlett Falls, Middlebury Falls, Otter Creek. Vergennes Wharf and East Middlebury
        are towns that also count as water. Ferrisburgh and Middlebury Green are dry towns. Shoreham, Addison, and
        Cornwall are fields. Salisbury Marsh is marsh, and water.
      </p>

      <h2>The deck</h2>
      <p>
        A deck is 24 cards, at most two copies of any card, and at least 16 cards from one household identity. There are
        six identities and 72 cards. Every card is already in the county archive. Nothing is bought, packed, or withheld
        until you grind for it.
      </p>

      <h2>Opening</h2>
      <p>
        A seed shuffles both decks the same way every time that seed is replayed. The opener starts with 4 warmth. The
        other household starts with 5. Both start with no memory. Each draws five cards. At the start of every winter,
        including the first, that household gains 2 warmth, to a maximum of 8, and draws back to five cards if they hold
        fewer and a card remains.
      </p>

      <h2>A winter</h2>
      <p>Take exactly one action.</p>
      <ul>
        <li>
          <strong>Establish.</strong> Pay the card’s warmth and play it. Places need matching ground, unless the card says
          any ground. A person must be played beside a place you own, or beside your person of the same line. If you own
          no place yet, a person may arrive on an empty town or field. A tool must be played beside a card it fits, unless
          it fits anything and the board is still empty. An institution goes on an empty town, or on any empty plot that
          already has two neighbors. If one of those neighbors is yours, the institution costs 1 less warmth. Events do
          not occupy a plot. They resolve and go to the discard.
        </li>
        <li>
          <strong>Tend.</strong> Spend 1 warmth to put a mark on one of your cards. Two marks is the limit. A mark is worth
          1 point when that card scores.
        </li>
        <li>
          <strong>Remember.</strong> Draw up to two cards, put one card from your hand under the deck, and gain 1 memory.
          Illegal if nothing can be drawn.
        </li>
        <li>
          <strong>Share.</strong> Spend 1 warmth to open a pact on a border between your card and theirs. Each pact scores
          2 for both households. A border can hold one pact.
        </li>
        <li>
          <strong>Pass.</strong> Gain 1 warmth and 1 memory.
        </li>
      </ul>
      <p>
        A hand never keeps more than seven cards. If it would, the extras are set aside by a fixed priority, not by
        chance: base times 10, minus cost, plus 5 for a place, minus 3 for an event, plus 2 if the card has a later face.
        Higher stays. Exact ties keep the smaller card id.
      </p>

      <h2>The threshold</h2>
      <p>
        After both households have taken seven winters, the era seals. Each household banks half their structure, rounded
        down. Structure is foundations, hearths, institutions, water, and lineages. Pacts are not sealed. A card with seal
        favor counts 2 extra only for this banking, not in the final score.
      </p>
      <p>
        The opener then chooses what to carry, up to 2 cards plus one for each memory they still hold. The other household
        chooses second and can see that choice. One carried card may take its later face: marks clear, and it counts as
        inherited. Every other carried card stays as printed, keeps its tend marks, and also counts as inherited.
        Everything else is discarded. A pact breaks if either end is empty. Hands are cut to five by the same priority,
        then drawn back to five. Warmth is set to 4 for the household about to open era II, and 5 for the other.
      </p>
      <p>
        Era II is opened by the household that did not open era I. It is another seven winters each. There is no second
        sealing.
      </p>

      <h2>Scoring</h2>
      <ul>
        <li>
          <strong>Foundations.</strong> Places, people, and fitted tools score base + tend + bonus marks + 1 if inherited.
          A tool that is not beside a fitting card scores 0. Institutions are not foundations.
        </li>
        <li>
          <strong>Hearths.</strong> Each of your places tagged home scores 2, plus 1 for each of your cards beside it.
        </li>
        <li>
          <strong>Institutions.</strong> The owner scores 3 + tend + bonus + 1 if inherited + 1 for every adjacent card.
          The other household scores 1 for each of their own cards beside it.
        </li>
        <li>
          <strong>Water.</strong> A route is a connected group of at least two cards that sit on water plots or carry the
          water tag, and the group must touch a real water plot. A private route scores nothing extra. A shared route
          scores each household 2 for each of their cards in it, plus 1.
        </li>
        <li>
          <strong>Lineages.</strong> For each of your lines with two or more people, score 3 for every person past the
          first. If any of them inherited, score 3 more once.
        </li>
        <li>
          <strong>Pacts.</strong> 2 points to each household, for each pact still on the board.
        </li>
      </ul>
      <p>The total is structure, plus pacts, plus the sealed points from era I. Higher total wins. If tied, more inherited cards on the board wins. If still tied, more memory left wins. If still tied, the match is a draw.</p>

      <h2>A worked fragment</h2>
      <p>
        South has the Cider House on Shoreham with one tend mark, Ada Colby on Addison, Lewis Colby on Cornwall already
        inherited, and a Rope Ferry on the New Haven. North has the Falls Mill on Bartlett Falls and a Ferrisburgh Porch.
        One pact joins the ferry to the mill.
      </p>
      <p>
        South’s foundations are 9: the house is 3 with its mark, Ada is 2, Lewis is 2 with the inherited point, the ferry
        is 2. The house is a home with Ada beside it, so hearths are 3. The mill is North’s, and the ferry helps it, so
        South’s institutions are 1. The ferry and the mill are a shared route: South’s water is 3. Ada and Lewis are a
        remembered Colby line: 6. The pact is 2. Structure 22, and 24 with the pact.
      </p>
      <p>
        North’s porch is foundations 2 and a home beside the mill, so hearths 3. The mill scores 5. Water is 3. No
        lineage. The pact is 2. Structure 13, and 15 with the pact. If this were the sealing, South would bank 11 and
        North 6.
      </p>

      <h2>The lesson</h2>
      <p>
        The lesson is the same rules for four winters an era, and you may carry one card before spending memory. A real
        match is seven, and two free cards. Keys: arrows move on the county, 1 through 9 choose a card in hand, E
        establishes, T tends, S shares, R remembers, P passes, Enter confirms, Esc clears.
      </p>
    </article>
  );
}
