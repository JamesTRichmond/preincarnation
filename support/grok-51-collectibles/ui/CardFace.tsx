import type { Affinity, CardDef, Effect } from "../types.ts";
import { typeLabel } from "../rules.ts";

function faceClass(affinity: Affinity): string {
  if (affinity === "night") return "border border-ink bg-ink text-paper";
  if (affinity === "hearth") return "border-2 border-ember bg-paper text-ink";
  if (affinity === "trail") return "border-2 border-pine bg-paper text-ink";
  if (affinity === "river") return "border-2 border-dashed border-ink bg-paper text-ink";
  if (affinity === "chapel") return "border-4 border-ink bg-paper text-ink";
  return "border-2 border-ember bg-paper text-ink";
}

function chip(effect: Effect): string {
  switch (effect.op) {
    case "draw":
      return `Draw ${effect.n}`;
    case "mend":
      return `Mend ${effect.n}`;
    case "ease":
      return `Ease ${effect.n}`;
    case "stores":
      return `Stores +${effect.n}`;
    case "well":
      return `Well +${effect.n}`;
    case "search":
      return `Search ${effect.n}`;
    case "shield":
      return "Shield";
    case "tax":
      return `Tax ${effect.n}`;
    case "bond":
      return `Bond +${effect.n}`;
    case "recall":
      return "Recall";
    default:
      return "";
  }
}

/** The printed face. Margin notes (then / later) stay off the card. */
export function CardFace({ card }: { card: CardDef }) {
  const night = card.affinity === "night";
  const chips = card.effects.map(chip).filter(Boolean);
  return (
    <div className={`flex h-full flex-col rounded-card p-3 ${faceClass(card.affinity)}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-3xl leading-none tabular-nums">{card.cost}</span>
        <span className="text-right text-xs font-semibold tracking-widest uppercase">
          {card.affinity}
          <span className={`mt-1 block font-normal tracking-normal normal-case ${night ? "text-paper/70" : "text-ink/60"}`}>
            {typeLabel(card.type)} · {card.rarity}
          </span>
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl leading-tight">{card.name}</h3>
      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1">
          {chips.map((label) => (
            <li
              key={label}
              className={`rounded-full px-2 py-1 text-xs font-semibold ${night ? "bg-paper/15" : "bg-ink/5"}`}
            >
              {label}
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-3 text-xs ${night ? "text-paper/70" : "text-ink/60"}`}>No extra effect.</p>
      )}
      <p className={`mt-auto flex items-end justify-between pt-3 text-xs font-semibold tracking-wide uppercase ${night ? "text-paper/80" : "text-ink/70"}`}>
        <span>{card.kindling > 0 ? `Stokes ${card.kindling}` : "No stoke of its own"}</span>
        <span className="font-normal tracking-normal normal-case">{card.year}</span>
      </p>
      {card.affinity === "generation" ? (
        <p className="mt-1 text-xs">Counts toward whichever bond the deck declared.</p>
      ) : null}
    </div>
  );
}
