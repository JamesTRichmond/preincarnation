import { item, knownValue } from "./catalog.ts";
import {
  authoringProblems,
  commit,
  compareOffers,
  countItem,
  createInitialState,
  faceFor,
  quote,
  totalMarks,
  unitSale,
} from "./engine.ts";
import { stallDef, STALLS } from "./stalls.ts";
import type { ItemInstance, MarketState } from "./types.ts";

export interface SimCheck {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
}

function check(id: string, name: string, pass: boolean, detail: string): SimCheck {
  return { id, name, pass, detail };
}

function packItem(state: MarketState, itemId: string): ItemInstance | undefined {
  return state.pack.find((row) => row.itemId === itemId);
}

function until(state: MarketState, eraIndex: number): MarketState {
  let next = state;
  while (next.eraIndex < eraIndex) {
    const stepped = commit(next, { kind: "generation" });
    if (!stepped.ok) return next;
    next = stepped.state;
  }
  return next;
}

export function flipSeries(steps = 12): number[] {
  let state = createInitialState();
  const purses = [state.purse];
  const lot = state.stalls.find((stall) => stall.id === "phelps")?.stock.find((row) => row.itemId === "salt");
  if (!lot) return purses;
  state = until(state, 1);
  purses.push(state.purse);
  for (let i = 0; i < steps; i += 1) {
    const liveLot = state.stalls
      .find((stall) => stall.id === "phelps")!
      .stock.find((row) => row.lotId === lot.lotId && row.qty > 0);
    if (!liveLot) break;
    const bought = commit(state, { kind: "buy", stallId: "phelps", lotId: liveLot.lotId, qty: 1 });
    if (!bought.ok) break;
    const inst = bought.state.pack.find((row) => row.itemId === "salt" && row.boughtFrom === "phelps");
    if (!inst) break;
    const sold = commit(bought.state, { kind: "sell", stallId: "phelps", instanceId: inst.instanceId, qty: 1 });
    state = sold.ok ? sold.state : bought.state;
    purses.push(state.purse);
    if (!sold.ok) break;
  }
  return purses;
}

export function runSimulations(state = createInitialState()): SimCheck[] {
  const checks: SimCheck[] = [];
  const authored = authoringProblems();
  checks.push(
    check(
      "authoring",
      "Posted prices stay inside the band and cannot be flipped",
      authored.length === 0,
      authored.length ? authored.join(" | ") : "Twelve stalls, four open in 1774, no buy price meets a board ask.",
    ),
  );

  const flax = packItem(state, "flax-tow")!;
  const quill = unitSale(state, "quill", flax, 1);
  checks.push(
    check(
      "fiber",
      "The netmaker pays a posted premium for fiber",
      quill.offer > quill.known && quill.fairness === "generous" && !quill.blocked,
      `Flax county ${quill.known}, Hester pays ${quill.offer}. ${quill.reason}`,
    ),
  );

  const spoon = packItem(state, "button-spoon")!;
  const offers = compareOffers(state, spoon.instanceId).filter((row) => row.open && !row.blocked);
  const family = offers.find((row) => row.stallId === "button");
  const scrap = offers.find((row) => row.stallId === "wicker");
  checks.push(
    check(
      "heirloom",
      "The family pays more than the scrap yard, and both say why",
      Boolean(family && scrap && family.offer > scrap.offer && family.keepsake && !scrap.keepsake),
      `Buttons ${family?.offer ?? "—"} (${family?.reason ?? ""}). Wicker ${scrap?.offer ?? "—"} (${scrap?.reason ?? ""}).`,
    ),
  );

  const deed = packItem(state, "button-deed")!;
  const deedOffers = compareOffers(state, deed.instanceId);
  checks.push(
    check(
      "deed-surfaced",
      "The deed is protected on every board",
      deedOffers.every((row) => row.blocked) && countItem(state, "button-deed") === 1,
      "Essential paper shows as protected. It is not given a fake sale price.",
    ),
  );

  const cracked = packItem(state, "meetinghouse-bell")!;
  const crackedSale = unitSale(until(state, 1), "fenn", cracked, 1);
  const restoredInst: ItemInstance = { ...cracked, condition: "restored", transformed: true };
  const restoredSale = unitSale(until(state, 1), "fenn", restoredInst, 1);
  checks.push(
    check(
      "bell",
      "A musician tells cracked weight from a restored note",
      restoredSale.offer > crackedSale.offer &&
        restoredSale.fairness === "generous" &&
        crackedSale.fairness === "steep" &&
        restoredSale.reason.toLowerCase().includes("restored") &&
        crackedSale.reason.toLowerCase().includes("cracked"),
      `Cracked ${crackedSale.offer} (county ${crackedSale.known}). Restored ${restoredSale.offer} (county ${restoredSale.known}).`,
    ),
  );

  const later = until(state, 1);
  const apple = packItem(later, "dried-apple")!;
  const maple = packItem(later, "maple-sugar")!;
  const pie = commit(later, {
    kind: "barter",
    stallId: "hale",
    offerId: "pie",
    picks: [
      { instanceId: maple.instanceId, qty: 1 },
      { instanceId: apple.instanceId, qty: 1 },
    ],
  });
  const caneState = structuredClone(later);
  const mapleRow = caneState.pack.find((row) => row.itemId === "maple-sugar");
  if (mapleRow) mapleRow.itemId = "cane-sugar";
  const pieCane = commit(caneState, {
    kind: "barter",
    stallId: "hale",
    offerId: "pie",
    picks: [
      { instanceId: maple.instanceId, qty: 1 },
      { instanceId: apple.instanceId, qty: 1 },
    ],
  });
  const partial = commit(later, {
    kind: "barter",
    stallId: "hale",
    offerId: "pie",
    picks: [{ instanceId: maple.instanceId, qty: 1 }],
  });
  const doubled = commit(later, {
    kind: "barter",
    stallId: "hale",
    offerId: "pie",
    picks: [
      { instanceId: maple.instanceId, qty: 1 },
      { instanceId: maple.instanceId, qty: 1 },
    ],
  });
  checks.push(
    check(
      "cook",
      "The cook accepts a posted substitute and rejects a partial basket",
      pie.ok &&
        pieCane.ok &&
        Boolean(pie.state.pack.find((row) => row.itemId === "inn-pie")) &&
        Boolean(pieCane.state.pack.find((row) => row.itemId === "inn-pie")) &&
        !partial.ok &&
        partial.state === later &&
        !doubled.ok &&
        doubled.state === later,
      partial.ok ? "partial should have failed" : partial.reason,
    ),
  );

  const beforeQuote = JSON.stringify(state);
  quote(state, { kind: "sell", stallId: "quill", instanceId: flax.instanceId, qty: 1 });
  checks.push(
    check(
      "cancel",
      "A quote does not touch the book",
      JSON.stringify(state) === beforeQuote,
      "Cancel is refusing to commit. The quote itself changes nothing.",
    ),
  );

  const poor = { ...state, purse: 0, stalls: state.stalls };
  const loaf = state.stalls.find((stall) => stall.id === "button")!.stock[0]!;
  const brokeBuy = commit(poor, { kind: "buy", stallId: "button", lotId: loaf.lotId, qty: 1 });
  checks.push(
    check(
      "purse",
      "A short purse cancels the whole purchase",
      !brokeBuy.ok && brokeBuy.state === poor && poor.purse === 0,
      brokeBuy.ok ? "bought with nothing" : brokeBuy.reason,
    ),
  );

  const dry = structuredClone(state);
  dry.stalls = dry.stalls.map((stall) => (stall.id === "quill" ? { ...stall, purse: 0 } : stall));
  const brokeSell = commit(dry, { kind: "sell", stallId: "quill", instanceId: flax.instanceId, qty: 1 });
  checks.push(
    check(
      "their-book",
      "A short stall book refuses the sale instead of going negative",
      !brokeSell.ok && brokeSell.state === dry && countItem(brokeSell.state, "flax-tow") === 2,
      brokeSell.ok ? "sold into an empty book" : brokeSell.reason,
    ),
  );

  const deedTry = commit(state, { kind: "sell", stallId: "button", instanceId: deed.instanceId, qty: 1 });
  checks.push(
    check(
      "essential",
      "The deed cannot be sold",
      !deedTry.ok && deedTry.state === state && countItem(state, "button-deed") === 1,
      deedTry.ok ? "deed sold" : deedTry.reason,
    ),
  );

  const bellTry = commit({ ...state, purse: 0 }, { kind: "service", stallId: "fenn", serviceId: "restore-bell", picks: [] });
  checks.push(
    check(
      "partial-service",
      "A restoration without the fee or the bell changes nothing",
      !bellTry.ok && bellTry.state.purse === 0 && packItem(bellTry.state, "meetinghouse-bell")?.condition === "cracked",
      bellTry.ok ? "restored for free" : bellTry.reason,
    ),
  );

  let flipPass = true;
  let flipDetail = "No unmodified good paid the player to go around the board.";
  const eraStates = [0, 1, 2, 3, 4, 5].map((index) => until(createInitialState(), index));
  for (const eraState of eraStates) {
    for (const stall of eraState.stalls) {
      const def = stallDef(stall.id);
      if (def.open.from > ["1774", "1828", "1891", "1934", "1976", "2026"][eraState.eraIndex]!) continue;
      for (const lot of stall.stock) {
        if (lot.qty <= 0 || lot.acquired) continue;
        const startPurse = eraState.purse;
        const bought = commit(eraState, { kind: "buy", stallId: stall.id, lotId: lot.lotId, qty: 1 });
        if (!bought.ok) continue;
        const inst = bought.state.pack.find((row) => row.boughtFrom === stall.id && row.itemId === lot.itemId);
        if (!inst) {
          flipPass = false;
          flipDetail = `Buy of ${lot.itemId} did not land in the pack.`;
          break;
        }
        for (const buyer of STALLS) {
          const sold = commit(bought.state, {
            kind: "sell",
            stallId: buyer.id,
            instanceId: inst.instanceId,
            qty: 1,
          });
          if (!sold.ok) continue;
          if (sold.state.purse >= startPurse) {
            flipPass = false;
            flipDetail = `${item(lot.itemId).name} bought at ${stall.id} and sold to ${buyer.id} raised marks from ${startPurse} to ${sold.state.purse}.`;
          }
        }
      }
    }
  }
  checks.push(check("flip", "Unmodified goods cannot be bought and resold at a profit", flipPass, flipDetail));

  const series = flipSeries(8);
  const rising = series.some((value, index) => index > 1 && value > series[index - 1]!);
  checks.push(
    check(
      "salt-loop",
      "Repeated salt buybacks never raise the purse",
      series.length > 2 && !rising,
      `Purse trace ${series.join(" → ")}.`,
    ),
  );

  const kept = commit(state, { kind: "sell", stallId: "button", instanceId: spoon.instanceId, qty: 1 });
  const spoonStock = kept.ok
    ? kept.state.stalls.find((stall) => stall.id === "button")!.stock.some((lot) => lot.itemId === "button-spoon" && lot.qty > 0)
    : true;
  const spoonVault = kept.ok
    ? kept.state.stalls.find((stall) => stall.id === "button")!.vault.some((row) => row.itemId === "button-spoon")
    : false;
  checks.push(
    check(
      "keepsake",
      "The family keeps the spoon off the board",
      kept.ok && spoonVault && !spoonStock && countItem(kept.state, "button-spoon") === 1,
      kept.ok ? "In the house, not back on a peg." : kept.reason,
    ),
  );

  const scrapSale = commit(state, { kind: "sell", stallId: "wicker", instanceId: spoon.instanceId, qty: 1 });
  let revived = false;
  if (scrapSale.ok) {
    const boughtBack = scrapSale.state.stalls
      .find((stall) => stall.id === "wicker")!
      .stock.find((lot) => lot.itemId === "button-spoon");
    const afterBuy = boughtBack
      ? commit(scrapSale.state, { kind: "buy", stallId: "wicker", lotId: boughtBack.lotId, qty: 1 })
      : scrapSale;
    const season = commit(afterBuy.ok ? afterBuy.state : scrapSale.state, { kind: "season" });
    if (season.ok) {
      const again = season.state.stalls
        .find((stall) => stall.id === "wicker")!
        .stock.find((lot) => lot.itemId === "button-spoon" && lot.qty > 0);
      revived = Boolean(again);
    }
  }
  checks.push(
    check(
      "no-reprint",
      "A named spoon sold as scrap is not reprinted next season",
      scrapSale.ok && !revived && countItem(scrapSale.state, "button-spoon") === 1,
      revived ? "The yard minted another spoon." : "Season turned. Still one spoon in the world.",
    ),
  );

  const heir = until(state, 1);
  checks.push(
    check(
      "succession",
      "The loft passes to Ada without losing the deed",
      faceFor(stallDef("quill"), heir.eraIndex).name === "Ada Quill" &&
        countItem(heir, "button-deed") === 1 &&
        Boolean(packItem(heir, "button-deed")) &&
        (heir.stalls.find((stall) => stall.id === "quill")?.purse ?? 0) >
          (state.stalls.find((stall) => stall.id === "quill")?.purse ?? 0),
      `${faceFor(stallDef("quill"), heir.eraIndex).name} keeps the book. Deed still in the pack.`,
    ),
  );

  const marksBefore = totalMarks(state);
  const soldFiber = commit(state, { kind: "sell", stallId: "quill", instanceId: flax.instanceId, qty: 1 });
  checks.push(
    check(
      "conserved",
      "A sale moves marks; it does not create them",
      soldFiber.ok && totalMarks(soldFiber.state) === marksBefore && soldFiber.state.purse > state.purse,
      soldFiber.ok ? `Book total ${marksBefore} before and after.` : soldFiber.reason,
    ),
  );

  const bellState = until(createInitialState(), 1);
  const poorBell = { ...bellState, purse: 3 };
  const noFee = commit(poorBell, {
    kind: "service",
    stallId: "fenn",
    serviceId: "restore-bell",
    picks: [{ instanceId: "p-bell", qty: 1 }],
  });
  const rich = commit(bellState, {
    kind: "service",
    stallId: "fenn",
    serviceId: "restore-bell",
    picks: [{ instanceId: "p-bell", qty: 1 }],
  });
  const heard = rich.ok
    ? unitSale(rich.state, "fenn", rich.state.pack.find((row) => row.itemId === "meetinghouse-bell")!, 1)
    : null;
  checks.push(
    check(
      "restore",
      "Restoration is atomic, then the posted note price appears",
      !noFee.ok &&
        noFee.state === poorBell &&
        packItem(noFee.state, "meetinghouse-bell")?.condition === "cracked" &&
        rich.ok &&
        packItem(rich.state, "meetinghouse-bell")?.condition === "restored" &&
        countItem(rich.state, "meetinghouse-bell") === 1 &&
        Boolean(heard && heard.offer > knownValue("meetinghouse-bell", "cracked") && !heard.blocked),
      heard ? `Restored offer ${heard.offer}, county ${heard.known}.` : "The fee did not move the bell.",
    ),
  );

  const dairy = until(createInitialState(), 2);
  const withVinegar = structuredClone(dairy);
  withVinegar.pack.push({ instanceId: "p-salt", itemId: "salt", qty: 1, condition: "sound" });
  withVinegar.pack.push({ instanceId: "p-vin", itemId: "cider-vinegar", qty: 1, condition: "sound" });
  const pressed = commit(withVinegar, {
    kind: "barter",
    stallId: "otis",
    offerId: "press",
    picks: [
      { instanceId: "p-milk", qty: 1 },
      { instanceId: "p-salt", qty: 1 },
      { instanceId: "p-vin", qty: 1 },
    ],
  });
  checks.push(
    check(
      "vinegar",
      "Vinegar stands in for rennet at the posted wheel",
      pressed.ok && Boolean(pressed.state.pack.find((row) => row.itemId === "cheddar")),
      pressed.ok ? "Same wheel." : pressed.reason,
    ),
  );

  return checks;
}
