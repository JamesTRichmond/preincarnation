import type { EraId } from "./types.ts";

export const ERAS: Record<
  EraId,
  { id: EraId; year: string; name: string; ellis: string; lede: string }
> = {
  "first-turning": {
    id: "first-turning",
    year: "1959",
    name: "First Turning",
    ellis: "Ellis, seventeen",
    lede: "You are Ellis, seventeen, new enough to Harrowford that people still watch how you enter a room. The gatherings are traditions. None of them is a gate. The valley continues if you stay home.",
  },
  "the-return": {
    id: "the-return",
    year: "1973",
    name: "The Return",
    ellis: "Ellis, returned",
    lede: "Fourteen years after the first life ended, you are young in the valley again. Cousins tell you what you did. Some of it happened. The people who were your age are in their thirties, and the ones who were old have changed their minds or refused to.",
  },
};

export const CAMPAIGN_NOTE =
  "Skipping a gathering does not fail the life. Declining files an absence. Attending files a result. The main road through Harrowford stays open either way.";
