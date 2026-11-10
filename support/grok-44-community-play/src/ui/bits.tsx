import type { ReactNode } from "react";
import type { Line, ModuleId } from "../types.ts";
import { MODULE_LABEL } from "../adapters/modules.ts";

export function Button({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-maple text-maple-ink hover:bg-maple/90",
    secondary: "bg-cream text-ink border border-line hover:bg-paper",
    quiet: "bg-transparent text-walnut hover:text-ink",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-sm px-4 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maple disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Dialogue({ lines }: { lines: Line[] }) {
  return (
    <ol className="space-y-5">
      {lines.map((line, index) => (
        <li key={`${line.speaker}-${index}`} className="border-l-2 border-maple pl-4">
          <span className="font-sans text-xs font-semibold tracking-[0.14em] text-maple uppercase">
            {line.speaker}
          </span>
          <p className="mt-1 font-display text-xl leading-snug text-ink">{line.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function FixtureBanner({ moduleId, label }: { moduleId: ModuleId; label: string | null }) {
  return (
    <p
      role="status"
      className="border border-line bg-maple-soft px-3 py-3 text-sm leading-relaxed text-ink"
    >
      <span className="font-semibold tracking-wide uppercase">Stand-in · {MODULE_LABEL[moduleId]}</span>
      <span className="mt-1 block">
        {label ??
          `FIXTURE — the ${MODULE_LABEL[moduleId]} minigame is not loaded in this session. This result is authored, not played. Live integration: pending.`}
      </span>
    </p>
  );
}

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`border border-line bg-cream p-4 sm:p-6 ${className}`}>{children}</section>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-xs font-semibold tracking-[0.16em] text-maple uppercase">{children}</p>
  );
}
