import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPack } from "./index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "content");
const integrationDir = join(root, "integration");

const pack = buildPack();
mkdirSync(integrationDir, { recursive: true });
writeFileSync(join(contentDir, "pack.json"), JSON.stringify(pack));
writeFileSync(join(integrationDir, "second-crown.event.json"), JSON.stringify(pack.integrationEvents[0], null, 2));
for (const d of pack.dungeons) {
  writeFileSync(join(contentDir, `${d.id}.json`), JSON.stringify(d));
}
const counts = pack.dungeons.map((d) => `${d.id}:${d.rooms.length}`).join(" ");
console.log(`emitted ${counts}`);
