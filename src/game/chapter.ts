export type DeathCause = "combat" | "release";

/** A death chapter that has not applied its winters yet. */
export type PendingChapter = {
  kind: "death";
  line: number;
  winters: number;
  cause: DeathCause;
  committed: boolean;
  mapId: string;
  x: number;
  y: number;
};

export type ChapterLine = {
  speaker: string;
  text: string;
  commits: boolean;
};

export function deathScript(firstLife: boolean, cause: DeathCause): ChapterLine[] {
  if (!firstLife) {
    return [{ speaker: "County", text: "You already know the count.", commits: true }];
  }
  const open =
    cause === "release"
      ? "You held Release. The skin is on the ground."
      : "The body fails. The skin is on the ground.";
  return [
    { speaker: "County", text: open, commits: false },
    {
      speaker: "County",
      text: "Fourteen winters pass on the body you leave. We will not say this a second time.",
      commits: true,
    },
  ];
}

export function sanitizePending(value: unknown): PendingChapter | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<PendingChapter>;
  if (v.kind !== "death") return null;
  if (v.cause !== "combat" && v.cause !== "release") return null;
  if (typeof v.winters !== "number" || !Number.isFinite(v.winters) || v.winters < 1) return null;
  if (typeof v.line !== "number" || !Number.isFinite(v.line) || v.line < 0) return null;
  if (typeof v.mapId !== "string" || !v.mapId) return null;
  if (typeof v.x !== "number" || !Number.isFinite(v.x)) return null;
  if (typeof v.y !== "number" || !Number.isFinite(v.y)) return null;
  if (v.committed) return null;
  return {
    kind: "death",
    cause: v.cause,
    winters: Math.floor(v.winters),
    line: Math.floor(v.line),
    committed: false,
    mapId: v.mapId,
    x: v.x,
    y: v.y,
  };
}

export function chapterView(firstLife: boolean, chapter: PendingChapter) {
  const script = deathScript(firstLife, chapter.cause);
  const index = Math.min(chapter.line, Math.max(0, script.length - 1));
  const line = script[index];
  return {
    speaker: line.speaker,
    text: line.text,
    index,
    total: script.length,
  };
}

/**
 * One press. `commitNow` is true only on the step that first owes the winters.
 * Skip and the last advance both finish, and neither can owe the winters twice.
 */
export function stepChapter(
  firstLife: boolean,
  chapter: PendingChapter,
  action: "advance" | "skip",
): { chapter: PendingChapter; commitNow: boolean; finished: boolean } {
  const script = deathScript(firstLife, chapter.cause);
  if (chapter.committed || chapter.line >= script.length || action === "skip") {
    return {
      chapter: { ...chapter, committed: true, line: script.length },
      commitNow: !chapter.committed,
      finished: true,
    };
  }
  const line = script[chapter.line];
  const commitNow = line.commits;
  const nextLine = chapter.line + 1;
  const finished = line.commits || nextLine >= script.length;
  return {
    chapter: {
      ...chapter,
      committed: chapter.committed || commitNow,
      line: finished ? script.length : nextLine,
    },
    commitNow,
    finished,
  };
}
