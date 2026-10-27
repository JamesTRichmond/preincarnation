/** Plates of Ashwick. The register lists a place only after you have stood there. */

export const FIGURE = "/ashwick/ivo.png";
export const SURVEY = "/ashwick/survey.jpg";

export const GROUND: Record<string, string> = {
  ferry: "/ashwick/ferry.jpg",
  millrace: "/ashwick/millrace.jpg",
  railcut: "/ashwick/railcut.jpg",
  chapel: "/ashwick/chapel.jpg",
  glassworks: "/ashwick/glassworks.jpg",
  orchard: "/ashwick/orchard.jpg",
  archive: "/ashwick/archive.jpg",
};

/** Where a stood place sits on the blank survey, in percent. */
export const STOOD_AT: Record<string, { x: number; y: number }> = {
  orchard: { x: 18, y: 24 },
  railcut: { x: 63, y: 18 },
  millrace: { x: 34, y: 48 },
  archive: { x: 52, y: 40 },
  glassworks: { x: 78, y: 50 },
  chapel: { x: 26, y: 66 },
  ferry: { x: 49, y: 80 },
};

export function groundFor(placeId: string): string {
  return GROUND[placeId] ?? GROUND.ferry!;
}
