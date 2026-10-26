import type { PlateMotif } from "@/game/knowledge/types.ts";

const ink = "#241c16";
const spruce = "#2f6a4a";
const ember = "#c85a28";
const sugar = "#c4923a";

export function ManualPlate({ motif, title }: { motif: PlateMotif; title: string }) {
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label={title}>
      <rect width="320" height="180" fill="#f3ead7" />
      <rect x="8" y="8" width="304" height="164" fill="none" stroke={ink} strokeWidth="1.25" />
      <rect x="14" y="14" width="292" height="152" fill="none" stroke={ink} strokeWidth="0.4" />
      <Motif motif={motif} />
    </svg>
  );
}

function Motif({ motif }: { motif: PlateMotif }) {
  switch (motif) {
    case "lamp":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M150 48 h20 l8 36 h-36 z" />
          <path d="M160 84 v28 M148 112 h24" />
          <path d="M160 48 v-16" stroke={ember} />
          <circle cx="160" cy="28" r="4" fill={ember} stroke="none" />
        </g>
      );
    case "ink":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <ellipse cx="120" cy="100" rx="36" ry="16" />
          <path d="M84 100 v-20 h72 v20" />
          <circle cx="200" cy="78" r="14" />
          <path d="M190 92 c10 18 20 18 28 6" stroke={spruce} />
        </g>
      );
    case "steam":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M130 120 h60 l-8 24 h-44 z" />
          <path d="M150 120 v-28 h20 v28" />
          <path d="M156 78 c0-16 8-16 8-32 M170 78 c0-16 8-16 8-32" stroke={spruce} />
        </g>
      );
    case "boil":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M96 96 h128 l-10 36 h-108 z" />
          <path d="M120 96 c8-20 20-20 28 0 M168 96 c8-20 16-20 24 0" stroke={sugar} />
          <path d="M110 132 h100" stroke={ember} />
        </g>
      );
    case "print":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <rect x="108" y="48" width="104" height="84" />
          <ellipse cx="160" cy="96" rx="16" ry="22" fill={spruce} stroke={ink} />
          <circle cx="148" cy="70" r="4" />
          <circle cx="172" cy="70" r="4" />
          <circle cx="142" cy="84" r="3" />
          <circle cx="178" cy="84" r="3" />
        </g>
      );
    case "flute":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <rect x="70" y="82" width="180" height="16" rx="8" />
          <circle cx="110" cy="90" r="3" fill={ink} />
          <circle cx="140" cy="90" r="3" fill={ink} />
          <circle cx="170" cy="90" r="3" fill={ink} />
          <circle cx="200" cy="90" r="3" fill={ink} />
          <path d="M250 90 h24" stroke={ember} />
        </g>
      );
    case "braid":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M120 40 c30 30 50 30 80 0" />
          <path d="M120 70 c30 30 50 30 80 0" stroke={spruce} />
          <path d="M120 100 c30 30 50 30 80 0" />
          <path d="M150 130 h20" />
        </g>
      );
    case "wash":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M130 48 h60 v28 l-30 18 l-30-18 z" />
          <path d="M160 94 v24" />
          <path d="M140 132 h40 l-6 16 h-28 z" stroke={spruce} />
        </g>
      );
    case "dip":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M126 70 h68 v50 h-68 z" />
          <path d="M160 40 v40" stroke={ember} />
          <circle cx="160" cy="36" r="4" />
          <path d="M138 96 h44" stroke={sugar} />
        </g>
      );
    case "rub":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <ellipse cx="160" cy="100" rx="46" ry="28" />
          <path d="M130 100 h60" stroke={spruce} />
          <path d="M140 86 c10 8 20 8 30 0" />
        </g>
      );
    case "peel":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M150 36 v100" />
          <path d="M150 50 c40 10 40 30 0 40" stroke={sugar} />
          <path d="M150 78 c-36 8-36 28 0 36" stroke={spruce} />
        </g>
      );
    case "smoke":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M120 120 h80 l-8 24 h-64 z" />
          <path d="M128 120 v-48 h64 v48" />
          <path d="M150 60 c0-20 10-20 10-36 M170 60 c0-20 8-20 8-36" stroke={ember} />
        </g>
      );
    case "drum":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <ellipse cx="160" cy="90" rx="54" ry="22" />
          <path d="M106 90 v28 M214 90 v28" />
          <path d="M120 70 h80" stroke={spruce} />
        </g>
      );
    case "salt":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M126 70 h68 l-10 62 h-48 z" />
          <circle cx="148" cy="100" r="3" fill={ink} />
          <circle cx="168" cy="112" r="3" fill={ink} />
          <circle cx="156" cy="124" r="2.5" fill={ink} />
        </g>
      );
    case "coal":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M100 120 h120 l-16 24 h-88 z" />
          <path d="M120 120 c10-30 30-40 40-20 c8 16 24 18 36 4" stroke={ember} />
          <circle cx="168" cy="100" r="6" fill={ember} stroke="none" />
        </g>
      );
    case "press":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <rect x="120" y="88" width="80" height="36" />
          <path d="M160 88 v-36" />
          <path d="M140 44 h40" />
          <rect x="146" y="100" width="28" height="12" fill={ink} />
        </g>
      );
    case "notch":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M150 36 v110" />
          <path d="M150 56 h16 M150 76 h16 M150 96 h16 M150 116 h16" stroke={ember} />
          <path d="M186 48 v28" stroke={frostLine} />
        </g>
      );
    case "peg":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M90 110 h140" />
          <circle cx="200" cy="110" r="10" />
          <path d="M200 100 v-28" stroke={ember} />
          <path d="M120 110 v-36 M150 110 v-28" />
        </g>
      );
    case "knot":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <circle cx="150" cy="90" r="18" />
          <path d="M132 90 h-28 M168 90 h28" stroke={spruce} />
          <path d="M150 72 v-24 M150 108 v24" />
        </g>
      );
    case "wrap":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <path d="M110 120 l40-70 40 70" />
          <path d="M130 100 h40 M138 84 h28" stroke={sugar} />
          <path d="M150 50 v-16" />
        </g>
      );
    default:
      return null;
  }
}

const frostLine = "#6e8c9c";
