import assert from "node:assert/strict";
import { test } from "node:test";
import { compositionChart, emptySlots, paintSlot, quantizeSlot, signatureMotif } from "./arrangement.ts";
import { collapseDoubled, compileChart, stepSeconds } from "./chart.ts";
import { acceptGesture, createInputGate, gestureFromKey, shouldTakeKey } from "./input.ts";
import { browserLatencyNote, freshLineup, measureOffset, noteDeviceChange } from "./latency.ts";
import { midiNoteCount, pieceToMidi } from "./midi.ts";
import { parseLine } from "./notation.ts";
import { renderNotes } from "./offline.ts";
import { PIECES, TAVERN_SET, TAVERN_SET_PLAN } from "./pieces.ts";
import {
  canContinue,
  createPerf,
  deadline,
  expireCues,
  press,
  pullAutos,
  release,
} from "./performance.ts";
import { allowVoice, createCursor, pullDue } from "./scheduler.ts";
import { closeness, gradeHold, judgeDelta, summaryCopy, variantWindowMs } from "./scoring.ts";
import { createSession } from "./session.ts";
import type { AudioHost } from "./session.ts";
import {
  TAVERN_BACKUP_KEY,
  TAVERN_SAVE_KEY,
  loadSave,
  memoryKv,
  migrate,
  writeSave,
} from "./storage.ts";
import { newComposition as composeTune } from "./arrangement.ts";

function aligned(length: number, bar: number): boolean {
  return Math.round(length * 2) % (bar * 2) === 0;
}

test("twelve original pieces, three of them on the stand", () => {
  assert.equal(PIECES.length, 12);
  assert.equal(new Set(PIECES.map((p) => p.id)).size, 12);
  assert.equal(new Set(PIECES.map((p) => p.title)).size, 12);
  assert.deepEqual(TAVERN_SET.map((p) => p.id), ["otter-creek-welcome", "the-hearth-answers", "three-chairs"]);
  assert.equal(TAVERN_SET_PLAN.length, 3);
  assert.equal(TAVERN_SET_PLAN[1]?.mode, "duet");
  for (const piece of PIECES) {
    assert.ok(piece.bpm >= 60 && piece.bpm <= 140);
    assert.ok(piece.lines.length >= 4);
    assert.ok(piece.blurb.length > 10);
    for (const line of piece.lines) {
      const parsed = parseLine(line.notes);
      assert.ok(parsed.length > 0, line.notes);
      assert.ok(aligned(parsed.length, piece.stepsPerBar), `${piece.id} ${line.notes} -> ${parsed.length}`);
    }
  }
});

test("notation parses rests, knocks, chords, and durations", () => {
  const line = parseLine("D4 F#4/2 A4/2 R*2 X*2 D3+A3");
  assert.equal(line.length, 1 + 0.5 + 0.5 + 2 + 2 + 1);
  assert.equal(line.notes.find((n) => n.midi === -1)?.dur, 2);
  const chord = line.notes.filter((n) => n.step === line.length - 1);
  assert.equal(chord.length, 2);
});

test("duet keeps Mira's questions and does not fail the player", () => {
  const piece = PIECES.find((p) => p.id === "the-hearth-answers");
  assert.ok(piece);
  const practice = compileChart(piece, { mode: "practice", variant: "relaxed" });
  const duet = compileChart(piece, { mode: "duet", variant: "relaxed" });
  assert.ok(practice.cues.every((cue) => cue.words !== "Mira asks from the hearth."));
  assert.ok(practice.companions.some((c) => c.name === "Mira"));
  assert.equal(practice.cues.length, 2);
  assert.equal(duet.cues.length, practice.cues.length);
  assert.equal(duet.cues.some((c) => c.words === "And the middle."), false);
  const welcome = compileChart(PIECES[0]!, { mode: "practice", variant: "mastery" });
  assert.ok(welcome.cues.some((c) => c.words === "And the middle."));
  const relaxed = compileChart(PIECES[0]!, { mode: "practice", variant: "relaxed" });
  assert.equal(relaxed.cues.some((c) => c.id.endsWith("-mid")), false);
});

test("a missed breath does not end the tune, and a later breath still counts", () => {
  const chart = compileChart(PIECES[0]!, { mode: "practice", variant: "relaxed" });
  const windowSec = variantWindowMs("relaxed") / 1000;
  let perf = createPerf(chart, 10, windowSec, 0);
  const first = perf.cues[0]!;
  const expired = expireCues(perf, chart, deadline(perf, chart, first) + 0.02);
  perf = expired.perf;
  assert.equal(perf.cues[0]?.grade, "slipped");
  assert.equal(perf.status, "playing");
  assert.equal(canContinue(perf), true);
  assert.equal("failed" in perf, false);
  const second = perf.cues[1]!;
  const at = 10 + second.step * stepSeconds(chart.bpm);
  const hit = press(perf, chart, second.gesture, at);
  assert.equal(hit.consumed, true);
  assert.equal(hit.perf.cues[1]?.grade, "together");
  assert.equal(hit.perf.status, "playing");
  assert.match(summaryCopy(hit.perf.grades).body, /tune|breath|room/i);
});

test("latency offset moves both the grade and the moment a miss is declared", () => {
  const chart = compileChart(PIECES[0]!, { mode: "practice", variant: "relaxed" });
  const windowSec = 0.11;
  const perf = createPerf(chart, 20, windowSec, 0.15);
  const cue = perf.cues[0]!;
  const cueAt = 20 + cue.step * stepSeconds(chart.bpm);
  const onTimeForEars = press(perf, chart, cue.gesture, cueAt + 0.15);
  assert.equal(onTimeForEars.perf.cues[0]?.grade, "together");
  const earlyClock = createPerf(chart, 20, windowSec, 0.15);
  assert.ok(deadline(earlyClock, chart, earlyClock.cues[0]!) > cueAt + windowSec);
  const notYet = expireCues(earlyClock, chart, cueAt + windowSec + 0.05);
  assert.equal(notYet.perf.cues[0]?.resolved, false);
  const gone = expireCues(earlyClock, chart, deadline(earlyClock, chart, earlyClock.cues[0]!) + 0.01);
  assert.equal(gone.perf.cues[0]?.grade, "slipped");
});

test("hold that is let go too soon is not a hard miss", () => {
  const chart = compileChart(PIECES[1]!, { mode: "practice", variant: "relaxed" });
  const hold = chart.cues.find((c) => c.gesture === "hold");
  assert.ok(hold);
  const perf = createPerf(chart, 5, 0.26, 0);
  const at = 5 + hold.step * stepSeconds(chart.bpm);
  const pressed = press(perf, chart, "hold", at);
  assert.equal(pressed.consumed, true);
  assert.equal(pressed.perf.status, "playing");
  const released = release(pressed.perf, chart, at + 0.05);
  assert.equal(released.cues.find((c) => c.id === hold.id)?.grade, "early");
  assert.equal(released.status, "playing");
  const full = gradeHold(0, 2000, 0, 1000, 260);
  assert.equal(full, "together");
});

test("wrong gesture teaches and leaves the breath open", () => {
  const chart = compileChart(PIECES[0]!, { mode: "practice", variant: "relaxed" });
  const perf = createPerf(chart, 0, 0.26, 0);
  const cue = perf.cues[0]!;
  const wrong = cue.gesture === "lift" ? "stamp" : "lift";
  const result = press(perf, chart, wrong, 0);
  assert.equal(result.consumed, false);
  assert.equal(result.perf.cues[0]?.resolved, false);
  assert.match(result.perf.feedback, /words say/i);
});

test("doubled triggers drop, a different gesture does not", () => {
  let gate = createInputGate(90);
  const first = acceptGesture(gate, "stamp", 1000, "touch");
  gate = first.gate;
  assert.equal(first.accepted, true);
  const again = acceptGesture(gate, "stamp", 1040, "key");
  assert.equal(again.accepted, false);
  const other = acceptGesture(gate, "lift", 1040, "key");
  assert.equal(other.accepted, true);
  const later = acceptGesture(gate, "stamp", 1100, "key");
  assert.equal(later.accepted, true);
  assert.equal(shouldTakeKey(true), false);
  assert.equal(gestureFromKey(" "), "hold");
  assert.equal(gestureFromKey("f"), "lift");
});

test("scheduler offers each event once and collapses a doubled note", () => {
  let cursor = createCursor();
  const events = [{ at: 1, id: "a" }, { at: 1.2, id: "b" }, { at: 2, id: "c" }];
  const first = pullDue(events, cursor, 1, 0.3);
  cursor = first.cursor;
  assert.deepEqual(first.due.map((e) => e.id), ["a", "b"]);
  const second = pullDue(events, cursor, 1.1, 0.3);
  assert.deepEqual(second.due.map((e) => e.id), []);
  const doubled = collapseDoubled([
    { id: "1", step: 0, midi: 60, dur: 1, velocity: 0.5, instrument: "fiddle", detuneCents: 0 },
    { id: "2", step: 0, midi: 60, dur: 1, velocity: 0.5, instrument: "fiddle", detuneCents: 0 },
    { id: "3", step: 0, midi: 62, dur: 1, velocity: 0.5, instrument: "fiddle", detuneCents: 0 },
  ]);
  assert.equal(doubled.length, 2);
  const recent = new Map<string, number>();
  assert.equal(allowVoice(recent, "fiddle:60", 1), true);
  assert.equal(allowVoice(recent, "fiddle:60", 1.01), false);
  assert.equal(allowVoice(recent, "fiddle:62", 1.01), true);
});

test("autos are pulled once and a quiet ghost still leaves the tune playing", () => {
  const chart = compileChart(PIECES[2]!, { mode: "duet", variant: "relaxed" });
  let perf = createPerf(chart, 0, 0.26, 0);
  const first = pullAutos(perf, chart, 0, 2);
  const second = pullAutos(first.perf, chart, 0, 2);
  assert.ok(first.notes.length > 0);
  assert.equal(second.notes.length, 0);
  perf = first.perf;
  assert.equal(perf.status, "playing");
});

test("calibration uses the median, drops the practice tap and wild misses", () => {
  const result = measureOffset([
    { knockMs: 0, tapMs: 400 },
    { knockMs: 1000, tapMs: 180 },
    { knockMs: 2000, tapMs: 2080 },
    { knockMs: 3000, tapMs: 3090 },
    { knockMs: 4000, tapMs: 4070 },
    { knockMs: 5000, tapMs: 5100 },
    { knockMs: 6000, tapMs: 9000 },
  ]);
  assert.equal(result.dropped, 2);
  assert.ok(result.offsetMs != null);
  assert.ok(Math.abs((result.offsetMs ?? 0) - 85) < 20);
  const thin = measureOffset([
    { knockMs: 0, tapMs: 10 },
    { knockMs: 1, tapMs: 2 },
  ]);
  assert.equal(thin.offsetMs, null);
  assert.equal(noteDeviceChange(freshLineup(40)).stale, true);
  assert.match(browserLatencyNote(0.01, 0.02) ?? "", /not auditioned/i);
  assert.equal(browserLatencyNote(undefined, undefined), null);
});

test("audio unlock calls resume synchronously, mute is not a stopped clock, hide suspends", () => {
  const calls: string[] = [];
  const host: AudioHost = {
    state: "suspended",
    currentTime: 3,
    resume() {
      calls.push("resume");
      return Promise.resolve();
    },
    suspend() {
      calls.push("suspend");
      return Promise.resolve();
    },
  };
  const session = createSession(host);
  const unlock = session.unlock as () => void;
  unlock();
  assert.equal(calls[0], "resume");
  assert.equal(session.unlocked, true);
  session.setMuted(true);
  assert.equal(session.musicGain(), 0);
  assert.equal(session.muted, true);
  assert.equal(host.currentTime, 3);
  host.state = "running";
  session.onVisibility(true);
  assert.equal(calls.at(-1), "suspend");
  assert.equal(session.holding, true);
  host.state = "suspended";
  session.onVisibility(false);
  assert.equal(session.holding, false);
  assert.equal(calls.at(-1), "resume");
});

test("saved tunes survive a corrupt write by restoring the backup", () => {
  const kv = memoryKv();
  const tune = composeTune({
    id: "keep-1",
    title: "Spoons for June",
    instrument: "spoons",
    home: 62,
    bpm: 96,
    slots: paintSlot(emptySlots(), 0, "stamp"),
  });
  assert.equal(writeSave(kv, { version: 1, settings: migrate({}).settings, compositions: [tune] }).ok, true);
  const second = composeTune({
    id: "keep-2",
    title: "Second",
    instrument: "guitar",
    home: 60,
    bpm: 80,
    slots: emptySlots(),
  });
  writeSave(kv, { version: 1, settings: migrate({}).settings, compositions: [tune, second] });
  kv.setItem(TAVERN_SAVE_KEY, "{not json");
  const recovered = loadSave(kv);
  assert.equal(recovered.recoveredFrom, "backup");
  assert.equal(recovered.save.compositions.length, 1);
  assert.equal(recovered.save.compositions[0]?.title, "Spoons for June");
  writeSave(kv, recovered.save);
  kv.setItem(TAVERN_SAVE_KEY, "{not json");
  const again = loadSave(kv);
  assert.equal(again.recoveredFrom, "backup");
  assert.equal(again.save.compositions[0]?.title, "Spoons for June");
  kv.setItem(TAVERN_BACKUP_KEY, "[]");
  const empty = loadSave(memoryKv({ [TAVERN_SAVE_KEY]: "nope", [TAVERN_BACKUP_KEY]: "also nope" }));
  assert.equal(empty.recoveredFrom, "empty");
  assert.equal(empty.save.compositions.length, 0);
  const legacy = migrate({ settings: { instrument: "guitar", muted: true }, compositions: [] });
  assert.equal(legacy.version, 1);
  assert.equal(legacy.settings.instrument, "guitar");
  const throwing = memoryKv();
  throwing.setItem = () => {
    throw new Error("quota");
  };
  const failed = writeSave(throwing, legacy);
  assert.equal(failed.ok, false);
  assert.match(failed.warning ?? "", /shelf/i);
});

test("arrangement quantizes into the loop and replays as sound, not a test", () => {
  assert.equal(quantizeSlot(4.2, 0, 0.5), Math.floor(Math.round(4.2 / 0.5) / 4) % 8);
  const motif = signatureMotif("lift", 67);
  assert.ok(motif.every((n) => n.midi === -1 || n.midi > 62));
  const chart = compositionChart(
    composeTune({
      id: "arr",
      title: "Table",
      instrument: "fiddle",
      home: 62,
      bpm: 100,
      slots: paintSlot(emptySlots(), 3, "hold"),
    }),
  );
  assert.equal(chart.cues.length, 0);
  assert.ok(chart.auto.some((n) => n.instrument === "fiddle"));
  assert.equal(chart.totalSteps, 32);
});

test("midi files are real and the reference render is a finite signal", () => {
  for (const piece of PIECES) {
    const bytes = pieceToMidi(piece);
    assert.equal(String.fromCharCode(...bytes.slice(0, 4)), "MThd");
    assert.ok(midiNoteCount(bytes) > 8, piece.id);
  }
  const spoon = pieceToMidi(PIECES.find((p) => p.id === "three-chairs")!);
  assert.ok(spoon.includes(37));
  const line = parseLine("D4 F#4 A4 B4");
  const rendered = renderNotes(
    line.notes.map((n) => ({
      at: n.step * 0.4,
      midi: n.midi,
      durSec: n.dur * 0.4,
      velocity: n.velocity,
      instrument: "fiddle",
    })),
    8000,
  );
  assert.ok(Number.isFinite(rendered.rms));
  assert.ok(rendered.rms > 0.01);
  assert.ok(rendered.peak <= 1);
  assert.ok(rendered.peakBefore > 0);
  const score = closeness(["together", "together", "slipped", "late"]);
  assert.ok(score > 0 && score < 100);
});

test("judge boundaries stay inside the breath", () => {
  assert.equal(judgeDelta(0, 200), "together");
  assert.equal(judgeDelta(-200, 200), "early");
  assert.equal(judgeDelta(200, 200), "late");
  assert.equal(judgeDelta(201, 200), "slipped");
});
