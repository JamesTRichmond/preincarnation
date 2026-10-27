import type { Dir, FocusItem } from "../types.ts";

export function enabledItems(items: FocusItem[]): FocusItem[] {
  return items.filter((item) => !item.disabled);
}

export function firstEnabled(items: FocusItem[]): string {
  return enabledItems(items)[0]?.id ?? items[0]?.id ?? "";
}

export function moveFocus(
  items: FocusItem[],
  currentId: string,
  dir: Dir,
  scroll: number,
): { id: string; scroll: number } {
  const enabled = enabledItems(items);
  const current = items.find((item) => item.id === currentId) ?? enabled[0];
  if (!current) return { id: currentId, scroll };

  if ((dir === "up" || dir === "down") && current.scrollable) {
    const max = current.scrollMax ?? 0;
    if (dir === "down" && scroll < max) return { id: current.id, scroll: scroll + 1 };
    if (dir === "up" && scroll > 0) return { id: current.id, scroll: scroll - 1 };
  }

  const inDir = enabled.filter((item) => {
    if (item.id === current.id) return false;
    if (dir === "left") return item.col < current.col;
    if (dir === "right") return item.col > current.col;
    if (dir === "up") return item.row < current.row;
    return item.row > current.row;
  });

  if (inDir.length === 0) {
    const wrapped = enabled
      .filter((item) => item.id !== current.id)
      .sort((a, b) => {
        if (dir === "down") return a.row - b.row || a.col - b.col;
        if (dir === "up") return b.row - a.row || a.col - b.col;
        if (dir === "right") return a.col - b.col || a.row - b.row;
        return b.col - a.col || a.row - b.row;
      });
    const next = wrapped[0];
    return next ? { id: next.id, scroll: 0 } : { id: current.id, scroll };
  }

  const best = inDir.slice().sort((a, b) => {
    const aSecondary = dir === "left" || dir === "right" ? a.col - current.col : a.row - current.row;
    const bSecondary = dir === "left" || dir === "right" ? b.col - current.col : b.row - current.row;
    const aPrimary =
      dir === "left" || dir === "right" ? Math.abs(a.row - current.row) : Math.abs(a.col - current.col);
    const bPrimary =
      dir === "left" || dir === "right" ? Math.abs(b.row - current.row) : Math.abs(b.col - current.col);
    const aSigned = dir === "left" || dir === "up" ? -aSecondary : aSecondary;
    const bSigned = dir === "left" || dir === "up" ? -bSecondary : bSecondary;
    return aSigned - bSigned || aPrimary - bPrimary;
  })[0];

  return best ? { id: best.id, scroll: 0 } : { id: current.id, scroll };
}
