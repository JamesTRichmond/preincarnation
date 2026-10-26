import { swatch } from "../src/ids.ts";
import type { Silhouette } from "../src/types.ts";

export function Glyph({
  index,
  silhouette,
  mark,
  label,
}: {
  index: number;
  silhouette: Silhouette;
  mark: string;
  label: string;
}) {
  const ink = swatch(index);
  return (
    <svg viewBox="0 0 40 40" className="glyph" role="img" aria-label={label}>
      <rect x="1" y="1" width="38" height="38" rx="7" className="glyph-plate" />
      <Shape kind={silhouette} ink={ink} />
      <text x="20" y="37" textAnchor="middle" className="glyph-mark">
        {mark}
      </text>
    </svg>
  );
}

function Shape({ kind, ink }: { kind: Silhouette; ink: string }) {
  switch (kind) {
    case "blade":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 28 L26 8" />
          <path d="M14 16 H22" />
        </g>
      );
    case "long":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round">
          <path d="M20 7 V30" />
          <path d="M14 12 H26" />
        </g>
      );
    case "blunt":
      return (
        <g stroke={ink} strokeWidth="1.6" fill="none">
          <rect x="12" y="8" width="16" height="8" rx="1.5" />
          <path d="M20 16 V30" />
        </g>
      );
    case "fan":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.4">
          <path d="M10 28 Q20 8 30 28" />
          <path d="M14 28 Q20 14 26 28" />
        </g>
      );
    case "cloth":
      return <path d="M10 10 H30 L27 30 H13 Z" fill={ink} opacity="0.9" />;
    case "band":
      return <rect x="8" y="16" width="24" height="8" rx="4" fill={ink} />;
    case "foot":
      return <path d="M12 14 H22 L24 28 H10 Z" fill={ink} />;
    case "hand":
      return (
        <g fill={ink}>
          <circle cx="16" cy="16" r="3" />
          <circle cx="22" cy="14" r="2.2" />
          <rect x="12" y="18" width="14" height="10" rx="3" />
        </g>
      );
    case "head":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.7">
          <path d="M12 28 V16 Q20 6 28 16 V28" />
          <path d="M16 18 H24" />
        </g>
      );
    case "charm":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.7">
          <circle cx="20" cy="18" r="8" />
          <circle cx="20" cy="18" r="2" fill={ink} stroke="none" />
        </g>
      );
    case "mesh":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.2">
          <path d="M10 12 H30 M10 18 H30 M10 24 H30 M14 8 V28 M20 8 V28 M26 8 V28" />
        </g>
      );
    case "hook":
      return <path d="M26 8 V18 Q26 28 16 28" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />;
    case "kit":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.6">
          <rect x="10" y="14" width="20" height="14" rx="2" />
          <path d="M16 14 V11 H24 V14" />
        </g>
      );
    case "stake":
      return (
        <g fill={ink}>
          <path d="M20 8 L26 18 H14 Z" />
          <rect x="18.5" y="18" width="3" height="12" />
        </g>
      );
    case "board":
      return <rect x="8" y="12" width="24" height="16" rx="2" fill={ink} />;
    default:
      return null;
  }
}
