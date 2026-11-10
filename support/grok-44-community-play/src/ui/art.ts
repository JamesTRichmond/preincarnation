import frost from "../../assets/frost-walk.jpg";
import grange from "../../assets/grange-fair.jpg";
import harvest from "../../assets/harvest-supper.jpg";
import parlor from "../../assets/parlor.jpg";
import river from "../../assets/river-sunday.jpg";
import sap from "../../assets/sap-night.jpg";
import type { FestivalId } from "../types.ts";

export const FESTIVAL_ART: Record<FestivalId, { src: string; alt: string }> = {
  "sap-night": {
    src: sap,
    alt: "A sugarhouse at night, steam over snow, amber light in the doorway.",
  },
  "river-sunday": {
    src: river,
    alt: "A green June backwater with a tied rowboat and an island of trees.",
  },
  "grange-fair": {
    src: grange,
    alt: "An empty grange hall with long tables, pie tins, and a bare stage.",
  },
  "frost-walk": {
    src: frost,
    alt: "A snowy ridge and a lower stone-wall path above a white intervale.",
  },
  "harvest-supper": {
    src: harvest,
    alt: "An October table of beans, apples, and bread beside a soot-scarred kitchen.",
  },
  "solstice-hearth": {
    src: parlor,
    alt: "A dusk parlor with a shelf, pinned sketches, letters, and a music stool.",
  },
};

export const PARLOR_ART = {
  src: parlor,
  alt: "The homestead parlor at dusk, where the record is kept and nothing is farmed.",
};
