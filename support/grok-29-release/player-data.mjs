#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEngine } from "./lib/engine.mjs";
import { importEnvelope, inspectRawSave } from "./lib/player-data.mjs";
import { memoryDeck, memoryStorage } from "./lib/memory-storage.mjs";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function die(message) {
  console.error(message);
  process.exit(1);
}

const file = arg("--file");
if (!file) die("usage: node player-data.mjs inspect|import --file life.json");
const command = process.argv[2];
const engine = await loadEngine();
const text = readFileSync(resolve(file), "utf8");

if (command === "inspect") {
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch {
    die("damaged: not JSON");
  }
  const raw = envelope?.storage?.[engine.SAVE_KEY] ?? text;
  const report = inspectRawSave(typeof raw === "string" ? raw : JSON.stringify(raw), engine);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
}

if (command === "import") {
  const statePath = resolve(arg("--state") ?? "player-state.json");
  let state = { storage: {}, deck: [] };
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    /* fresh state */
  }
  const storage = memoryStorage(state.storage ?? {});
  const deck = memoryDeck(
    (state.deck ?? []).map((entry) => ({
      key: entry.key,
      mediaType: entry.mediaType,
      bytes: Uint8Array.from(Buffer.from(entry.base64, "base64")),
    })),
  );
  const result = await importEnvelope(text, { storage, deck, engine });
  if (result.ok && result.written) {
    const next = {
      storage: storage.dump(),
      deck: deck.snapshot().map((entry) => ({
        key: entry.key,
        mediaType: entry.mediaType,
        base64: Buffer.from(entry.bytes).toString("base64"),
      })),
    };
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify(next, null, 2) + "\n");
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 2);
}

die(`unknown command ${command}`);
