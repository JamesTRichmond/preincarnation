import { LESSON_IDS, type LessonId } from "./types.ts";

export interface GraphEdge {
  from: LessonId | "impression";
  to: LessonId | "impression";
  kind: "soft";
  because: string;
}

export const HAMMER_RULE =
  "Only a hammer blow on the pale thread opens a marble face. A blade scars the face, and the scar stays through the year-shift. A hammer on the face raises dust and does not open. Hands can feel the thread and nothing more. The opened face in Marble Vein is the way to the impression. Soll's practice block obeys the same rule and opens nothing beyond itself.";

export function dependencyGraph(): { note: string; lessons: readonly LessonId[]; edges: GraphEdge[]; hammerRule: string } {
  const edges: GraphEdge[] = [
    { from: "movement", to: "context", kind: "soft", because: "Most verbs belong to a place you can stand next to. The hands are available without a step." },
    { from: "context", to: "blade", kind: "soft", because: "The blade is a verb on cord, root, cuff, or slab. Refusing all of them still lets the county continue." },
    { from: "context", to: "tool", kind: "soft", because: "Hammer, salve, and cuff are used on something, not selected from a bar." },
    { from: "tool", to: "hammer", kind: "soft", because: "The hammer rule is a particular use. The yard block and the vein seam are alternates." },
    { from: "hammer", to: "impression", kind: "soft", because: "The vein face, once opened, is the way in. Skipping the impression does not block the shore." },
    { from: "impression", to: "recognition", kind: "soft", because: "The coat in the stone is one way to know the later county. The milepost, the ruts, Ione, Hart, the window, and the ledger are others." },
    { from: "context", to: "heal", kind: "soft", because: "Salve, well, cuff, or resting while hurt. None is required before the shore." },
    { from: "context", to: "rest", kind: "soft", because: "Banks, hearth, ledge, river. Rest writes a quiet session notch and does not teach the save verb." },
    { from: "context", to: "save", kind: "soft", because: "The ledger and the wayside stone. A long break still resumes if the session was notched by rest or by leaving." },
    { from: "context", to: "death", kind: "soft", because: "Any lethal place. Dying early does not erase the teachers; it moves the county." },
    { from: "death", to: "permanence", kind: "soft", because: "Release keeps scars, cuts, the open face, the coat, and an aged notch. Resume does not rewind the release." },
    { from: "death", to: "recognition", kind: "soft", because: "The altered county is entered by release. Knowing it is a look or a sentence, not a banner." },
    { from: "save", to: "death", kind: "soft", because: "A notch is continuity across a break. It is not an undo of release." },
  ];
  return {
    note: "No edge is a hard gate. Lessons can be met in either era, in any order, including after an early death and after refusing the vein.",
    lessons: LESSON_IDS,
    edges,
    hammerRule: HAMMER_RULE,
  };
}

export function graphMermaid(): string {
  const g = dependencyGraph();
  const lines = ["flowchart TD"];
  for (const e of g.edges) {
    lines.push(`  ${e.from} -->|soft| ${e.to}`);
  }
  return lines.join("\n");
}
