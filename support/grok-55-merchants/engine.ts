import { isEssential, item, knownValue } from "./catalog.ts";
import { stallDef, STALLS } from "./stalls.ts";
import type {
  BarterOffer,
  BuyInterest,
  Condition,
  EraId,
  Fairness,
  Intent,
  ItemInstance,
  Lot,
  MarketState,
  Need,
  OfferView,
  Pick,
  Quote,
  ServiceOffer,
  StallDef,
  StallState,
} from "./types.ts";
import { ERAS } from "./types.ts";

const MARKUP_MIN = 1;
const MARKUP_MAX = 1.4;
const MULT_MIN = 0.4;
const MULT_MAX = 2.2;

export function eraIndex(id: EraId): number {
  return ERAS.findIndex((era) => era.id === id);
}

export function currentEra(state: MarketState) {
  return ERAS[state.eraIndex] ?? ERAS[0];
}

export function isOpen(def: StallDef, index: number): boolean {
  return index >= eraIndex(def.open.from) && index <= eraIndex(def.open.until);
}

export function faceFor(def: StallDef, index: number) {
  let face = def.faces[0];
  if (!face) throw new Error(`Stall ${def.id} has no face`);
  for (const candidate of def.faces) {
    if (eraIndex(candidate.fromEra) <= index) face = candidate;
  }
  return face;
}

export function totalMarks(state: MarketState): number {
  return state.purse + state.stalls.reduce((sum, stall) => sum + stall.purse, 0);
}

export function countItem(state: MarketState, itemId: string): number {
  let n = stackQty(state.pack, itemId);
  for (const stall of state.stalls) {
    n += stackQty(stall.stock, itemId);
    n += stackQty(stall.vault, itemId);
  }
  return n;
}

function stackQty(rows: { itemId: string; qty: number }[], itemId: string): number {
  return rows.filter((row) => row.itemId === itemId).reduce((sum, row) => sum + row.qty, 0);
}

export function matchInterest(def: StallDef, itemId: string, condition: Condition): BuyInterest {
  const defItem = item(itemId);
  let best: BuyInterest | null = null;
  let score = -1;
  for (const interest of def.interests) {
    if (interest.itemId && interest.itemId !== itemId) continue;
    if (interest.tag && !defItem.tags.includes(interest.tag)) continue;
    if (interest.condition && interest.condition !== condition) continue;
    const specificity =
      (interest.itemId ? 4 : 0) + (interest.condition ? 2 : 0) + (interest.tag ? 1 : 0);
    if (specificity > score) {
      score = specificity;
      best = interest;
    }
  }
  if (best) return best;
  return {
    id: "plain",
    multiplier: def.defaultBuy.multiplier,
    reason: def.defaultBuy.reason,
    demandLabel: "Anything else",
  };
}

export function fairnessOfSale(offer: number, known: number): Fairness {
  if (known <= 0) return "fair";
  const ratio = offer / known;
  if (ratio >= 1.1) return "generous";
  if (ratio >= 0.8) return "fair";
  return "steep";
}

export function fairnessOfAsk(ask: number, known: number): Fairness {
  if (known <= 0) return "fair";
  return ask / known <= 1.2 ? "fair" : "steep";
}

export function postedAsk(known: number, markup: number, floor?: number): number {
  return Math.max(Math.round(known * markup), floor ?? 0);
}

function cheapestAsk(state: MarketState, itemId: string, condition: Condition): number | null {
  let min: number | null = null;
  for (const stall of state.stalls) {
    for (const lot of stall.stock) {
      if (lot.itemId !== itemId || lot.condition !== condition || lot.qty <= 0) continue;
      const ask = postedAsk(knownValue(itemId, condition), lot.markup, lot.floorPrice);
      if (min == null || ask < min) min = ask;
    }
  }
  return min;
}

function findPack(state: MarketState, instanceId: string): ItemInstance | undefined {
  return state.pack.find((row) => row.instanceId === instanceId);
}

function findStall(state: MarketState, stallId: string): StallState | undefined {
  return state.stalls.find((stall) => stall.id === stallId);
}

export interface UnitSale {
  offer: number;
  known: number;
  fairness: Fairness;
  reason: string;
  blocked?: string;
  keepsake: boolean;
  interestId: string;
}

export function unitSale(
  state: MarketState,
  stallId: string,
  inst: ItemInstance,
  qty: number,
): UnitSale {
  const def = stallDef(stallId);
  const known = knownValue(inst.itemId, inst.condition);
  const goods = item(inst.itemId);
  const interest = matchInterest(def, inst.itemId, inst.condition);
  const namedOk = goods.significance !== "named" || interest.itemId === inst.itemId;
  const bellOk = inst.itemId !== "meetinghouse-bell" || interest.itemId === "meetinghouse-bell";

  let offer = Math.round(known * interest.multiplier);
  if (!interest.keepsake) {
    const minAsk = cheapestAsk(state, inst.itemId, inst.condition);
    if (minAsk != null) offer = Math.min(offer, minAsk - 1);
  }
  if (inst.boughtFor != null && !inst.transformed) {
    offer = Math.min(offer, inst.boughtFor - 1);
  }
  offer = Math.max(0, offer);

  const fairness = fairnessOfSale(offer, known);
  let blocked: string | undefined;
  if (!isOpen(def, state.eraIndex)) blocked = "That stall is shut this year.";
  else if (isEssential(inst.itemId))
    blocked = "Protected. It stays with you. No stall can buy it, and the book will not lose it.";
  else if (!namedOk)
    blocked =
      "Named silver is only bought where the board names it. The Button farm and the scrap yard both post a number.";
  else if (!bellOk)
    blocked =
      "The bell is on the musician's board — cracked and restored are two posted rates. This stall will not take it.";
  else if (offer < 1)
    blocked = "No marks in it unless the thing changes. Selling it back would only feed a loop, so the sale stops.";
  else if (!Number.isInteger(qty) || qty < 1) blocked = "Choose a whole amount.";
  else if (qty > inst.qty) blocked = "You don't have that many.";
  else {
    const stall = findStall(state, stallId);
    const used = state.seasonUses[seasonKey(stallId, interest.id)] ?? 0;
    if (interest.seasonLimit != null && used + qty > interest.seasonLimit) {
      blocked = `They have taken enough of this until next season (${interest.seasonLimit}). The rate does not drop; this door is shut for it.`;
    } else if (!stall || stall.purse < offer * qty) {
      blocked = "Their book is short this season. The price stands; they cannot pay it until the book refills.";
    }
  }

  return {
    offer,
    known,
    fairness,
    reason: interest.reason,
    blocked,
    keepsake: Boolean(interest.keepsake),
    interestId: interest.id,
  };
}

function seasonKey(stallId: string, offerId: string): string {
  return `${stallId}:${offerId}`;
}

export function compareOffers(state: MarketState, instanceId: string): OfferView[] {
  const inst = findPack(state, instanceId);
  if (!inst) return [];
  return STALLS.map((def) => {
    const sale = unitSale(state, def.id, inst, 1);
    const face = faceFor(def, state.eraIndex);
    return {
      stallId: def.id,
      stallName: face.name,
      open: isOpen(def, state.eraIndex),
      offer: sale.offer,
      known: sale.known,
      fairness: isEssential(inst.itemId) ? "protected" : sale.fairness,
      reason: sale.reason,
      blocked: sale.blocked,
      keepsake: sale.keepsake,
    };
  }).sort((a, b) => {
    if (Boolean(a.blocked) !== Boolean(b.blocked)) return a.blocked ? 1 : -1;
    return b.offer - a.offer;
  });
}

function quoteShell(partial: Quote): Quote {
  return partial;
}

function bad(title: string, reason: string, warnings: string[] = []): Quote {
  return quoteShell({
    ok: false,
    title,
    reason,
    detail: reason,
    known: null,
    playerDelta: 0,
    fairness: null,
    warnings,
  });
}

export function quote(state: MarketState, intent: Intent): Quote {
  return evaluate(state, intent).quote;
}

interface Evaluation {
  quote: Quote;
  apply?: (draft: MarketState) => void;
}

export function commit(state: MarketState, intent: Intent): { ok: true; state: MarketState; receipt: string } | { ok: false; state: MarketState; reason: string } {
  const evaluation = evaluate(state, intent);
  if (!evaluation.quote.ok || !evaluation.apply) {
    return { ok: false, state, reason: evaluation.quote.reason };
  }
  const draft = structuredClone(state);
  evaluation.apply(draft);
  const problems = invariantProblems(state, draft);
  if (problems.length > 0) {
    return { ok: false, state, reason: problems.join(" ") };
  }
  return { ok: true, state: draft, receipt: evaluation.quote.reason };
}

function evaluate(state: MarketState, intent: Intent): Evaluation {
  switch (intent.kind) {
    case "buy":
      return evalBuy(state, intent.stallId, intent.lotId, intent.qty);
    case "sell":
      return evalSell(state, intent.stallId, intent.instanceId, intent.qty);
    case "barter":
      return evalExchange(state, intent.stallId, "barter", intent.offerId, intent.picks);
    case "service":
      return evalExchange(state, intent.stallId, "service", intent.serviceId, intent.picks, intent.line);
    case "eat":
      return evalEat(state, intent.instanceId);
    case "season":
      return evalSeason(state);
    case "generation":
      return evalGeneration(state);
    default:
      return { quote: bad("No such trade", "That action is not on the book.") };
  }
}

function requireStall(state: MarketState, stallId: string): { def: StallDef; stall: StallState } | Quote {
  const def = STALLS.find((row) => row.id === stallId);
  const stall = findStall(state, stallId);
  if (!def || !stall) return bad("No such stall", "That stall is not on the book.");
  if (!isOpen(def, state.eraIndex)) {
    return bad(faceFor(def, state.eraIndex).name, `${faceFor(def, state.eraIndex).name} is not trading in ${currentEra(state).year}.`);
  }
  return { def, stall };
}

function evalBuy(state: MarketState, stallId: string, lotId: string, qty: number): Evaluation {
  const gate = requireStall(state, stallId);
  if (!("stall" in gate)) return { quote: gate };
  const lot = gate.stall.stock.find((row) => row.lotId === lotId);
  if (!lot || lot.qty <= 0) return { quote: bad("Gone", "That is not on the board.") };
  if (!Number.isInteger(qty) || qty < 1) return { quote: bad("Amount", "Choose a whole amount.") };
  if (qty > lot.qty) return { quote: bad("Amount", "They don't have that many.") };
  const goods = item(lot.itemId);
  if (goods.significance === "essential" || goods.unique) {
    if (countItem(state, lot.itemId) > lot.qty) {
      return { quote: bad(goods.name, "That unique piece already exists. It cannot be copied.") };
    }
  }
  const known = knownValue(lot.itemId, lot.condition);
  const ask = postedAsk(known, lot.markup, lot.floorPrice);
  const cost = ask * qty;
  const fairness = fairnessOfAsk(ask, known);
  const raised = lot.floorPrice != null && lot.floorPrice > Math.round(known * lot.markup);
  const warnings = [
    fairness === "steep" ? "Steep: the margin is wider than a grocer's. It is still printed next to county value." : "",
    raised ? "This ask was raised so you cannot buy it back cheaper than they paid." : "",
  ].filter(Boolean);
  if (state.purse < cost) {
    return {
      quote: bad(goods.name, `You are short ${cost - state.purse} ${cost - state.purse === 1 ? "mark" : "marks"}. Nothing was taken.`, warnings),
    };
  }
  const title = `Buy ${qty} ${goods.name}`;
  const reason = `${gate.def ? faceFor(gate.def, state.eraIndex).name : "They"} ask ${cost}. County value ${known * qty}.`;
  return {
    quote: quoteShell({
      ok: true,
      title,
      reason,
      detail: goods.about,
      known: known * qty,
      playerDelta: -cost,
      fairness,
      warnings,
    }),
    apply: (draft) => {
      draft.purse -= cost;
      const stall = findStall(draft, stallId)!;
      stall.purse += cost;
      const live = stall.stock.find((row) => row.lotId === lotId)!;
      live.qty -= qty;
      give(draft, {
        itemId: lot.itemId,
        qty,
        condition: lot.condition,
        boughtFor: ask,
        boughtFrom: stallId,
        transformed: false,
      });
      journal(draft, `Bought ${qty} ${goods.name} for ${cost}. County value ${known * qty}. ${fairnessLabel(fairness)}.`);
    },
  };
}

function evalSell(state: MarketState, stallId: string, instanceId: string, qty: number): Evaluation {
  const inst = findPack(state, instanceId);
  if (!inst) return { quote: bad("Pack", "That is not in your pack.") };
  const gate = requireStall(state, stallId);
  if (!("stall" in gate)) return { quote: gate };
  const sale = unitSale(state, stallId, inst, qty);
  const goods = item(inst.itemId);
  if (sale.blocked) {
    return {
      quote: quoteShell({
        ok: false,
        title: goods.name,
        reason: sale.blocked,
        detail: sale.reason,
        known: sale.known * Math.max(qty, 1),
        playerDelta: 0,
        fairness: isEssential(inst.itemId) ? "protected" : sale.fairness,
        warnings: [sale.reason],
      }),
    };
  }
  const pay = sale.offer * qty;
  const warnings: string[] = [];
  if (sale.fairness === "steep") warnings.push(sale.reason);
  if (goods.significance === "named") {
    warnings.push("Named. Compare every posted offer before you confirm. Cancel leaves the pack untouched.");
  }
  const best = compareOffers(state, instanceId).find((row) => !row.blocked);
  if (best && best.stallId !== stallId && best.offer > sale.offer) {
    warnings.push(`${best.stallName} posts ${best.offer} — more than this stall.`);
  }
  return {
    quote: quoteShell({
      ok: true,
      title: `Sell ${qty} ${goods.name}`,
      reason: `${faceFor(gate.def, state.eraIndex).name} pays ${pay}. County value ${sale.known * qty}. ${sale.reason}`,
      detail: goods.about,
      known: sale.known * qty,
      playerDelta: pay,
      fairness: sale.fairness,
      warnings,
    }),
    apply: (draft) => {
      const live = findPack(draft, instanceId)!;
      live.qty -= qty;
      if (live.qty <= 0) draft.pack = draft.pack.filter((row) => row.instanceId !== instanceId);
      const stall = findStall(draft, stallId)!;
      stall.purse -= pay;
      draft.purse += pay;
      const moved: ItemInstance = {
        instanceId: mint(draft),
        itemId: live.itemId,
        qty,
        condition: live.condition,
        transformed: live.transformed,
        inscription: live.inscription,
      };
      if (sale.keepsake) stall.vault.push(moved);
      else {
        const floor = sale.offer;
        const existing = stall.stock.find(
          (row) => row.acquired && row.itemId === live.itemId && row.condition === live.condition && row.floorPrice === floor,
        );
        if (existing) existing.qty += qty;
        else {
          stall.stock.push({
            lotId: `acq-${moved.instanceId}`,
            itemId: live.itemId,
            condition: live.condition,
            qty,
            markup: 1.25,
            target: 0,
            step: 0,
            floorPrice: floor,
            acquired: true,
          });
        }
      }
      const key = seasonKey(stallId, sale.interestId);
      draft.seasonUses[key] = (draft.seasonUses[key] ?? 0) + qty;
      journal(
        draft,
        `Sold ${qty} ${goods.name} to ${faceFor(gate.def, state.eraIndex).name} for ${pay}. County value ${sale.known * qty}. ${fairnessLabel(sale.fairness)}.`,
      );
    },
  };
}

function evalEat(state: MarketState, instanceId: string): Evaluation {
  const inst = findPack(state, instanceId);
  if (!inst) return { quote: bad("Pack", "That is not in your pack.") };
  const goods = item(inst.itemId);
  if (!goods.tags.includes("food")) return { quote: bad(goods.name, "That is not food. Nothing was eaten.") };
  return {
    quote: quoteShell({
      ok: true,
      title: `Eat ${goods.name}`,
      reason: `You eat one ${goods.name}. It leaves the pack. Marks do not move.`,
      detail: goods.about,
      known: knownValue(inst.itemId, inst.condition),
      playerDelta: 0,
      fairness: "fair",
      warnings: [],
    }),
    apply: (draft) => {
      const live = findPack(draft, instanceId)!;
      live.qty -= 1;
      if (live.qty <= 0) draft.pack = draft.pack.filter((row) => row.instanceId !== instanceId);
      draft.meals += 1;
      journal(draft, `Ate ${goods.name}. Marks were not involved.`);
    },
  };
}

function evalSeason(_state: MarketState): Evaluation {
  return {
    quote: quoteShell({
      ok: true,
      title: "A season turns",
      reason: "Open stalls refill a little of their book and the goods they sell. Rates do not change. Uniques are not copied.",
      detail: "Replenishment is not a faucet. Income is capped. Acquired heirlooms are not reprinted.",
      known: null,
      playerDelta: 0,
      fairness: "fair",
      warnings: [],
    }),
    apply: (draft) => {
      replenish(draft);
      journal(draft, "A season turns. Posted rates hold. Nothing essential was reprinted.");
    },
  };
}

function evalGeneration(state: MarketState): Evaluation {
  if (state.eraIndex >= ERAS.length - 1) {
    return { quote: bad("The living county", "This is the last generation on the book. The stalls stay as they are.") };
  }
  const next = ERAS[state.eraIndex + 1]!;
  return {
    quote: quoteShell({
      ok: true,
      title: `Turn to ${next.year}`,
      reason: `${next.title}. Heirs keep the book, the stock, and anything in their care. Your protected things stay in the pack.`,
      detail: next.blurb,
      known: null,
      playerDelta: 0,
      fairness: "fair",
      warnings: [],
    }),
    apply: (draft) => {
      draft.eraIndex += 1;
      const era = ERAS[draft.eraIndex]!;
      const names = STALLS.filter((def) => isOpen(def, draft.eraIndex))
        .map((def) => faceFor(def, draft.eraIndex).name)
        .join(", ");
      replenish(draft);
      journal(draft, `${era.year}, ${era.title}. At the tables: ${names}.`);
    },
  };
}

function evalExchange(
  state: MarketState,
  stallId: string,
  kind: "barter" | "service",
  offerId: string,
  picks: Pick[],
  line?: string,
): Evaluation {
  const gate = requireStall(state, stallId);
  if (!("stall" in gate)) return { quote: gate };
  const offer =
    kind === "barter"
      ? gate.def.barters.find((row) => row.id === offerId)
      : gate.def.services.find((row) => row.id === offerId);
  if (!offer) return { quote: bad("Not offered", "That work is not on this stall's card.") };
  const limit = offer.seasonLimit;
  const used = state.seasonUses[seasonKey(stallId, offer.id)] ?? 0;
  if (limit != null && used >= limit) {
    return { quote: bad(offer.name, "Already done this season. The card does not get more expensive. It simply waits.") };
  }
  const service = kind === "service" ? (offer as ServiceOffer) : null;
  const marks = service?.marks ?? 0;
  if (service?.lines && !service.lines.includes(line ?? "")) {
    return { quote: bad(offer.name, "Choose one of the posted sentences. Nothing has been printed.") };
  }
  if (state.purse < marks) {
    return { quote: bad(offer.name, `You are short ${marks - state.purse} marks. Nothing leaves the pack.`) };
  }
  const assigned = assignPicks(state, picks, offer.inputs);
  if (!assigned.ok) return { quote: bad(offer.name, assigned.reason) };
  for (const use of assigned.uses) {
    if (isEssential(use.inst.itemId) && !use.need.hold) {
      return { quote: bad(offer.name, "Protected things cannot be spent. The trade is cancelled whole.") };
    }
  }
  const outputs = "outputs" in offer ? offer.outputs : service?.outputs ?? [];
  for (const output of outputs ?? []) {
    const goods = item(output.itemId);
    if (goods.significance === "essential" || (goods.unique && countItem(state, output.itemId) >= 1)) {
      return { quote: bad(offer.name, `${goods.name} cannot be copied.`) };
    }
  }
  const opportunity = opportunityMarks(state, assigned.uses);
  const outputKnown = (outputs ?? []).reduce((sum, output) => sum + knownValue(output.itemId, output.condition) * output.qty, 0);
  const warnings: string[] = [];
  if (opportunity > outputKnown && (outputs?.length ?? 0) > 0) {
    warnings.push(
      `Selling these pieces instead would clear about ${opportunity} marks. This swap is for the thing itself, not a profit.`,
    );
  }
  if (service?.outputs?.some((output) => output.inscription)) {
    warnings.push("The sheet will sell for less than this fee. Print it to keep it.");
  }
  const face = faceFor(gate.def, state.eraIndex);
  return {
    quote: quoteShell({
      ok: true,
      title: offer.name,
      reason: `${face.name}: ${offer.detail}`,
      detail: offer.detail,
      known: outputKnown || null,
      playerDelta: -marks,
      fairness: marks === 0 ? "fair" : "fair",
      warnings,
      opportunity,
    }),
    apply: (draft) => {
      if (marks > 0) {
        draft.purse -= marks;
        findStall(draft, stallId)!.purse += marks;
      }
      for (const use of assigned.uses) {
        const live = findPack(draft, use.inst.instanceId);
        if (!live) continue;
        if (use.need.hold) continue;
        if (use.need.become) {
          if (use.need.become.itemId) live.itemId = use.need.become.itemId;
          if (use.need.become.condition) live.condition = use.need.become.condition;
          live.transformed = true;
          delete live.boughtFor;
          delete live.boughtFrom;
        } else {
          live.qty -= use.qty;
          if (live.qty <= 0) draft.pack = draft.pack.filter((row) => row.instanceId !== live.instanceId);
        }
      }
      for (const output of outputs ?? []) {
        give(draft, {
          itemId: output.itemId,
          qty: output.qty,
          condition: output.condition,
          transformed: true,
          inscription: kind === "service" && "inscription" in output && output.inscription ? line : undefined,
        });
      }
      if (service?.meal) draft.meals += 1;
      if (service?.shoreCraft) draft.shoreCraft = true;
      if (service?.dryFeet) draft.dryFeet = true;
      if (service?.recital) draft.recitals += 1;
      if (service?.dressing) draft.dressings += 1;
      if (service?.outputs?.some((output) => output.inscription)) draft.broadsides += 1;
      if (kind === "barter" && offer.id === "cobble-food") draft.dryFeet = true;
      draft.seasonUses[seasonKey(stallId, offer.id)] = used + 1;
      const note = service?.journal ?? `${face.name} completed ${offer.name}.`;
      journal(draft, line ? `${note} “${line}”` : note);
    },
  };
}

function opportunityMarks(state: MarketState, uses: Assigned[]): number {
  let total = 0;
  for (const use of uses) {
    if (use.need.hold) continue;
    const sample: ItemInstance = { ...use.inst, qty: use.qty };
    let best = 0;
    for (const def of STALLS) {
      if (!isOpen(def, state.eraIndex)) continue;
      const sale = unitSale(state, def.id, sample, use.qty);
      if (!sale.blocked) best = Math.max(best, sale.offer * use.qty);
    }
    total += best;
  }
  return total;
}

interface Assigned {
  inst: ItemInstance;
  qty: number;
  need: Need;
}

function assignPicks(
  state: MarketState,
  picks: Pick[],
  needs: Need[],
): { ok: true; uses: Assigned[] } | { ok: false; reason: string } {
  if (picks.some((pick) => !Number.isInteger(pick.qty) || pick.qty < 1)) {
    return { ok: false, reason: "Amounts have to be whole. Nothing was taken." };
  }
  const seen = new Set<string>();
  for (const pick of picks) {
    if (seen.has(pick.instanceId)) {
      return { ok: false, reason: "That same piece was offered twice. The trade stops so nothing is counted twice." };
    }
    seen.add(pick.instanceId);
  }
  const remaining = needs.map((need) => ({ need, left: need.qty }));
  const uses: Assigned[] = [];
  for (const pick of picks) {
    const inst = findPack(state, pick.instanceId);
    if (!inst) return { ok: false, reason: "Something in the offer is not in your pack. Nothing was taken." };
    if (pick.qty > inst.qty) return { ok: false, reason: `Not enough ${item(inst.itemId).name}. Nothing was taken.` };
    const slot = remaining.find(
      (row) =>
        row.left > 0 &&
        covers(row.need, inst) &&
        row.left >= pick.qty,
    );
    if (!slot) {
      return {
        ok: false,
        reason: `${item(inst.itemId).name} does not fill an open place on this card, or it was more than the card asks. Nothing was taken.`,
      };
    }
    slot.left -= pick.qty;
    uses.push({ inst, qty: pick.qty, need: slot.need });
  }
  const unmet = remaining.filter((row) => row.left > 0);
  if (unmet.length > 0) {
    const names = unmet
      .map((row) => {
        const alt = row.need.altLabel ? ` (or ${row.need.altLabel})` : "";
        const cond = row.need.condition ? `, ${row.need.condition}` : "";
        return `${item(row.need.itemId).name}${alt}${cond}`;
      })
      .join("; ");
    return { ok: false, reason: `Still needed: ${names}. Nothing was taken.` };
  }
  return { ok: true, uses };
}

function covers(need: Need, inst: ItemInstance): boolean {
  if (need.condition && inst.condition !== need.condition) return false;
  if (need.itemId === inst.itemId) return true;
  return need.alternatives?.includes(inst.itemId) ?? false;
}

export function autoPicks(state: MarketState, needs: Need[]): { picks: Pick[]; missing: string[] } {
  const used = new Set<string>();
  const picks: Pick[] = [];
  const missing: string[] = [];
  for (const need of needs) {
    let left = need.qty;
    for (const inst of state.pack) {
      if (left <= 0) break;
      if (used.has(inst.instanceId)) continue;
      if (!covers(need, inst)) continue;
      const qty = Math.min(left, inst.qty);
      picks.push({ instanceId: inst.instanceId, qty });
      used.add(inst.instanceId);
      left -= qty;
    }
    if (left > 0) {
      const alt = need.altLabel ? ` or ${need.altLabel}` : "";
      const cond = need.condition ? ` (${need.condition})` : "";
      missing.push(`${item(need.itemId).name}${alt}${cond}`);
    }
  }
  return { picks, missing };
}

function give(
  draft: MarketState,
  spec: {
    itemId: string;
    qty: number;
    condition: Condition;
    boughtFor?: number;
    boughtFrom?: string;
    transformed?: boolean;
    inscription?: string;
  },
): void {
  const goods = item(spec.itemId);
  if (goods.stackable && !spec.inscription) {
    const match = draft.pack.find(
      (row) =>
        row.itemId === spec.itemId &&
        row.condition === spec.condition &&
        row.boughtFor === spec.boughtFor &&
        row.boughtFrom === spec.boughtFrom &&
        Boolean(row.transformed) === Boolean(spec.transformed) &&
        !row.inscription,
    );
    if (match) {
      match.qty += spec.qty;
      return;
    }
  }
  draft.pack.push({
    instanceId: mint(draft),
    itemId: spec.itemId,
    qty: spec.qty,
    condition: spec.condition,
    boughtFor: spec.boughtFor,
    boughtFrom: spec.boughtFrom,
    transformed: spec.transformed,
    inscription: spec.inscription,
  });
}

function mint(draft: MarketState): string {
  const id = `n${draft.nextId}`;
  draft.nextId += 1;
  return id;
}

function journal(draft: MarketState, text: string): void {
  draft.journal.unshift({ id: mint(draft), era: currentEra(draft).id, text });
  draft.journal = draft.journal.slice(0, 40);
}

export function replenish(draft: MarketState): void {
  draft.season += 1;
  draft.seasonUses = {};
  for (const stall of draft.stalls) {
    const def = stallDef(stall.id);
    if (isOpen(def, draft.eraIndex)) {
      stall.purse = Math.min(def.purseCap, stall.purse + def.income);
    }
    for (const lot of stall.stock) {
      if (lot.acquired) continue;
      if (lot.qty >= lot.target) continue;
      const goods = item(lot.itemId);
      if (goods.unique || goods.significance === "essential" || goods.significance === "named") {
        if (countItem(draft, lot.itemId) >= 1) continue;
      }
      const room = lot.target - lot.qty;
      lot.qty += Math.min(lot.step, room);
    }
  }
}

function fairnessLabel(fairness: Fairness): string {
  if (fairness === "generous") return "Generous against county value";
  if (fairness === "steep") return "Steep against county value";
  if (fairness === "protected") return "Protected";
  return "Fair against county value";
}

export function invariantProblems(before: MarketState, after: MarketState): string[] {
  const problems: string[] = [];
  if (!Number.isInteger(after.purse) || after.purse < 0) problems.push("Player marks went negative.");
  for (const stall of after.stalls) {
    if (!Number.isInteger(stall.purse) || stall.purse < 0) problems.push(`${stall.id} marks went negative.`);
    for (const lot of stall.stock) {
      if (!Number.isInteger(lot.qty) || lot.qty < 0) problems.push(`${stall.id} stock went negative.`);
    }
  }
  const ids = new Set<string>();
  const every: ItemInstance[] = [...after.pack];
  for (const stall of after.stalls) every.push(...stall.vault);
  for (const inst of every) {
    if (ids.has(inst.instanceId)) problems.push(`Duplicated holding ${inst.instanceId}.`);
    ids.add(inst.instanceId);
    if (!Number.isInteger(inst.qty) || inst.qty < 1) problems.push(`Bad quantity on ${inst.instanceId}.`);
  }
  for (const goods of Object.values(uniqueIds())) {
    const afterCount = countItem(after, goods);
    const beforeCount = countItem(before, goods);
    if (afterCount > 1) problems.push(`Unique ${goods} was copied.`);
    if (item(goods).significance === "essential" && afterCount < beforeCount) {
      problems.push(`Essential ${goods} was lost.`);
    }
    if (item(goods).significance === "essential" && afterCount > beforeCount) {
      problems.push(`Essential ${goods} was copied.`);
    }
  }
  return problems;
}

function uniqueIds(): Record<string, string> {
  const ids: Record<string, string> = {};
  for (const def of Object.values(itemLookup())) {
    if (def.unique || def.significance === "essential") ids[def.id] = def.id;
  }
  return ids;
}

function itemLookup(): Record<string, { id: string; unique?: boolean; significance: string }> {
  const bag: Record<string, { id: string; unique?: boolean; significance: string }> = {};
  for (const id of ["button-deed", "button-spoon", "meetinghouse-bell"]) {
    const goods = item(id);
    bag[id] = goods;
  }
  return bag;
}

export function authoringProblems(): string[] {
  const problems: string[] = [];
  if (STALLS.length !== 12) problems.push(`Expected 12 stalls, found ${STALLS.length}.`);
  const ids = new Set<string>();
  const open1774 = STALLS.filter((def) => isOpen(def, 0));
  if (open1774.length !== 4) problems.push(`1774 should open four stalls, found ${open1774.length}.`);
  const state = createInitialState();
  for (const def of STALLS) {
    if (ids.has(def.id)) problems.push(`Duplicate stall ${def.id}.`);
    ids.add(def.id);
    if (!def.place || def.faces.length < 2) problems.push(`${def.id} needs a place and a successor.`);
    if (def.barters.length < 1 || def.services.length < 1) problems.push(`${def.id} needs a barter and a service.`);
    if (def.stock.length < 1) problems.push(`${def.id} needs stock.`);
    if (def.interests.length + 1 < 1) problems.push(`${def.id} needs a buying interest.`);
    if (def.defaultBuy.multiplier < MULT_MIN || def.defaultBuy.multiplier > MULT_MAX) {
      problems.push(`${def.id} plain rate is outside the posted band.`);
    }
    for (const interest of def.interests) {
      if (interest.multiplier < MULT_MIN || interest.multiplier > MULT_MAX) {
        problems.push(`${def.id} ${interest.id} multiplier is outside 0.4–2.2.`);
      }
    }
    for (const lot of def.stock) {
      if (lot.markup < MARKUP_MIN || lot.markup > MARKUP_MAX) problems.push(`${def.id} markup on ${lot.itemId} is outside 1–1.4.`);
      const goods = item(lot.itemId);
      if (goods.significance === "essential" || goods.significance === "named") {
        problems.push(`${def.id} stocks protected ${lot.itemId}.`);
      }
    }
    for (const offer of [...def.barters, ...def.services]) {
      for (const input of offer.inputs) {
        if (isEssential(input.itemId)) problems.push(`${def.id} spends an essential.`);
        for (const alt of input.alternatives ?? []) if (isEssential(alt)) problems.push(`${def.id} alt is essential.`);
      }
      const outputs = "outputs" in offer ? offer.outputs ?? [] : [];
      for (const output of outputs) {
        if (isEssential(output.itemId)) problems.push(`${def.id} mints an essential.`);
      }
    }
    for (const sample of sampleInstances()) {
      const interest = matchInterest(def, sample.itemId, sample.condition);
      if (interest.keepsake) continue;
      const sale = unitSale(state, def.id, sample, 1);
      if (sale.blocked && sale.blocked.includes("shut")) continue;
      if (sale.blocked && (sample.itemId === "button-spoon" || sample.itemId === "meetinghouse-bell" || sample.itemId === "button-deed")) {
        continue;
      }
      const minAsk = cheapestAsk(state, sample.itemId, sample.condition);
      if (minAsk != null && sale.offer >= minAsk && !sale.blocked) {
        problems.push(`${def.id} pays ${sale.offer} for ${sample.itemId}/${sample.condition}, ask is ${minAsk}.`);
      }
    }
  }
  for (const id of ["button-deed", "button-spoon", "meetinghouse-bell"]) {
    if (countItem(state, id) !== 1) problems.push(`${id} should exist once at the start.`);
  }
  return problems;
}

function sampleInstances(): ItemInstance[] {
  const conditions: Condition[] = ["sound", "worn", "cracked", "restored"];
  const rows: ItemInstance[] = [];
  const ids = [
    "flax-tow",
    "cane-sugar",
    "raisin",
    "inn-pie",
    "cheddar",
    "rennet",
    "farm-loaf",
    "fiddle-string",
    "ballad-sheet",
    "salve",
    "beeswax",
    "mended-hoe",
    "basket",
    "seed-packet",
    "salt",
    "rag-paper",
    "boot-sole",
    "button-spoon",
    "meetinghouse-bell",
    "yarrow",
    "milk",
    "broadside",
  ];
  for (const itemId of ids) {
    for (const condition of conditions) {
      rows.push({ instanceId: `sample-${itemId}-${condition}`, itemId, qty: 1, condition });
    }
  }
  return rows;
}

let cached: MarketState | null = null;

export function createInitialState(): MarketState {
  const pack: ItemInstance[] = [
    { instanceId: "p-flax", itemId: "flax-tow", qty: 2, condition: "sound" },
    { instanceId: "p-nettle", itemId: "nettle-bast", qty: 1, condition: "sound" },
    { instanceId: "p-ash", itemId: "ash-splints", qty: 1, condition: "sound" },
    { instanceId: "p-grass", itemId: "sweetgrass", qty: 1, condition: "sound" },
    { instanceId: "p-spoon", itemId: "button-spoon", qty: 1, condition: "sound" },
    { instanceId: "p-deed", itemId: "button-deed", qty: 1, condition: "sound" },
    { instanceId: "p-bell", itemId: "meetinghouse-bell", qty: 1, condition: "cracked" },
    { instanceId: "p-maple", itemId: "maple-sugar", qty: 1, condition: "sound" },
    { instanceId: "p-apple", itemId: "dried-apple", qty: 1, condition: "sound" },
    { instanceId: "p-hoe", itemId: "broken-hoe", qty: 1, condition: "sound" },
    { instanceId: "p-milk", itemId: "milk", qty: 1, condition: "sound" },
    { instanceId: "p-yarrow", itemId: "yarrow", qty: 1, condition: "sound" },
  ];
  const stalls: StallState[] = STALLS.map((def) => ({
    id: def.id,
    purse: def.purse,
    vault: [],
    stock: def.stock.map((lot, index) => ({
      lotId: `lot-${def.id}-${index}`,
      itemId: lot.itemId,
      condition: lot.condition,
      qty: lot.qty,
      markup: lot.markup,
      target: lot.target,
      step: lot.step,
    })),
  }));
  return {
    v: 1,
    eraIndex: 0,
    season: 0,
    purse: 16,
    pack,
    meals: 0,
    shoreCraft: false,
    dryFeet: false,
    recitals: 0,
    dressings: 0,
    broadsides: 0,
    stalls,
    nextId: 1,
    seasonUses: {},
    journal: [
      {
        id: "j0",
        era: "1774",
        text: "The book is open. Marks spend the same in every year. Every price sits next to county value.",
      },
    ],
  };
}

export function freshState(): MarketState {
  cached = null;
  return createInitialState();
}

void cached;

export type { BarterOffer, Lot, ServiceOffer };
