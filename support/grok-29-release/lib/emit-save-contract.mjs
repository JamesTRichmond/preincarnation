import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { workspaceTypeScript } from "./engine.mjs";

const ORDER = [
  "src/game/snes.ts",
  "src/game/weapons.ts",
  "src/game/cooking/types.ts",
  "src/game/cooking/constants.ts",
  "src/game/cooking/ingredients.ts",
  "src/game/cooking/effects.ts",
  "src/game/cooking/recipes.ts",
  "src/game/cooking/inventory.ts",
  "src/game/cooking/state.ts",
  "src/game/cooking/save.ts",
  "src/game/types.ts",
  "src/game/save.ts",
];

/** Emit the engine save modules as browser ESM. Imports stay the engine's; types are erased, not rewritten. */
export function emitSaveContract(engineRoot, outDir) {
  const ts = workspaceTypeScript();
  mkdirSync(outDir, { recursive: true });
  const emitted = [];
  for (const rel of ORDER) {
    const source = readFileSync(join(engineRoot, rel), "utf8");
    const result = ts.transpileModule(source, {
      fileName: rel,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    });
    const js = result.outputText.replaceAll(".ts", ".js");
    const dest = join(outDir, relative("src/game", rel).replace(/\.ts$/, ".js"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, js);
    emitted.push(dest);
  }
  return emitted;
}
