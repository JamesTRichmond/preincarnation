import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runBenchmark } from "./benchmark.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const result = runBenchmark();
const outDir = join(dir, "bench");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "results.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
