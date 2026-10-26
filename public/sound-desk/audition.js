import { createSoundDesk } from "./mixer/mixer.js";

const desk = createSoundDesk({
  baseUrl: new URL("/sound/", location.origin),
  manifestUrl: "manifest/cues.json",
});

const clockEl = document.querySelector("#clock");
const transportEl = document.querySelector("#transport");
const voicesEl = document.querySelector("#voices");
const voicedEl = document.querySelector("#voiced");
const stage = document.querySelector("#stage");
const stageKind = document.querySelector("#stage-kind");
const stageCopy = document.querySelector("#stage-copy");
const yearsEl = document.querySelector("#years");
const listEl = document.querySelector("#list");
const filtersEl = document.querySelector("#filters");
const zonesEl = document.querySelector("#zones");
const scenesEl = document.querySelector("#scenes");
const sceneNote = document.querySelector("#scene-note");
const shownEl = document.querySelector("#shown");
const findEl = document.querySelector("#find");
const playBtn = document.querySelector("#play");
const paceBtn = document.querySelector("#pace");
const spamBtn = document.querySelector("#spam");
const statusEl = document.querySelector("#status");
const logEl = document.querySelector("#log");
const cueIdEl = document.querySelector("#cue-id");
const cueName = document.querySelector("#cue-name");
const cueNotes = document.querySelector("#cue-notes");
const cueMeasure = document.querySelector("#cue-measure");
const wave = document.querySelector("#wave");
const takesEl = document.querySelector("#takes");
const ladderEl = document.querySelector("#ladder");
const ladderCaption = document.querySelector("#ladder-caption");
const panEl = document.querySelector("#pan");
const tempoEl = document.querySelector("#tempo");
const gate = document.querySelector("#gate");
const started = performance.now();

const ZONES = [
  ["amb_town", "Town"],
  ["amb_forest", "Forest"],
  ["amb_water", "Water"],
  ["amb_quarry", "Quarry"],
  ["amb_interior", "Interior"],
  ["amb_afterlife", "Afterlife"],
];

const CATEGORIES = [
  ["movement", "Underfoot"],
  ["combat", "Weapons"],
  ["damage", "Hurt"],
  ["death", "Death"],
  ["tools", "Work"],
  ["puzzles", "Locks"],
  ["ui", "Interface"],
  ["boss", "The thing"],
  ["afterlife", "Afterlife"],
  ["return", "The return"],
  ["ambience", "Places"],
];

const ANCHORS = [
  ["focus", -18],
  ["grass", -10],
  ["hurt", -6],
  ["blast", -4],
];

const SCENES = [
  {
    id: "street",
    title: "Middlebury street",
    place: "amb_town",
    blurb: "Stone under the boots, then the cape.",
    steps: [
      { at: 0, cue: "step_stone", pan: -0.35 },
      { at: 420, cue: "step_stone", pan: 0.35 },
      { at: 840, cue: "step_stone", pan: -0.2 },
      { at: 1260, cue: "step_stone", pan: 0.25 },
      { at: 1700, cue: "cape_snap", pan: 0.1 },
      { at: 2140, cue: "step_stone", pan: -0.3 },
      { at: 2560, cue: "boots_scuff", pan: 0.15 },
    ],
  },
  {
    id: "woods",
    title: "Woods path",
    place: "amb_forest",
    blurb: "Grass, then dirt where the path wears through.",
    steps: [
      { at: 0, cue: "step_grass", pan: -0.4 },
      { at: 480, cue: "step_grass", pan: 0.4 },
      { at: 960, cue: "step_grass", pan: -0.25 },
      { at: 1560, cue: "step_dirt", pan: 0.2 },
      { at: 2040, cue: "step_dirt", pan: -0.3 },
      { at: 2520, cue: "cape_snap", pan: 0 },
    ],
  },
  {
    id: "creek",
    title: "The creek",
    place: "amb_water",
    blurb: "Shallow stones, then the stroke, then air.",
    steps: [
      { at: 0, cue: "step_shallow", pan: -0.3 },
      { at: 500, cue: "step_shallow", pan: 0.3 },
      { at: 1000, cue: "step_shallow", pan: -0.15 },
      { at: 1700, cue: "swim_stroke", pan: -0.2 },
      { at: 2300, cue: "swim_stroke", pan: 0.2 },
      { at: 2900, cue: "swim_surface", pan: 0 },
    ],
  },
  {
    id: "sugar",
    title: "Sugarhouse",
    place: "amb_interior",
    blurb: "The lamp, the tap, then the drip.",
    steps: [
      { at: 0, cue: "lamp_light", pan: 0 },
      { at: 450, cue: "sugar_tap", pan: -0.4 },
      { at: 980, cue: "sugar_tap", pan: 0.35 },
      { at: 1500, cue: "sugar_drip", pan: -0.2 },
      { at: 2200, cue: "sugar_drip", pan: 0.15 },
      { at: 2900, cue: "sugar_drip", pan: 0 },
    ],
  },
  {
    id: "quarry",
    title: "Quarry shift",
    place: "amb_quarry",
    blurb: "Dig, lift, then the hammer.",
    steps: [
      { at: 0, cue: "shovel_dig", pan: -0.2 },
      { at: 720, cue: "shovel_lift", pan: 0.1 },
      { at: 1400, cue: "shovel_dig", pan: 0.25 },
      { at: 2200, cue: "hammer_strike", pan: -0.1 },
      { at: 2680, cue: "hammer_nail", pan: 0.2 },
    ],
  },
  {
    id: "after",
    title: "Afterlife",
    place: "amb_afterlife",
    blurb: "Arrival, then steps with nothing living underfoot.",
    steps: [
      { at: 0, cue: "afterlife_arrive", pan: 0 },
      { at: 1600, cue: "soul_step", pan: -0.45 },
      { at: 2300, cue: "soul_step", pan: 0.45 },
      { at: 3000, cue: "soul_step", pan: -0.2 },
      { at: 3700, cue: "soul_step", pan: 0.2 },
    ],
  },
  {
    id: "strike",
    title: "The strike",
    place: "amb_quarry",
    blurb: "The picture lands, then the hit, about 450 ms later.",
    steps: [
      { at: 0, cue: "boss_stinger", pan: 0 },
      { at: 700, cue: "boss_telegraph", pan: 0 },
      { at: 1150, cue: "boss_hit", pan: 0 },
      { at: 1900, cue: "boss_roar", pan: 0 },
    ],
  },
  {
    id: "years",
    title: "Fourteen years",
    place: "amb_afterlife",
    blurb: "The crossing, then fourteen pulses. Land the world on the last.",
    steps: [
      { at: 0, cue: "death_cross", pan: 0 },
      { at: 1600, cue: "return_years", pan: 0 },
    ],
  },
  {
    id: "cold",
    title: "The cold",
    place: "amb_forest",
    blurb: "Snow, then the frost that means health is next.",
    steps: [
      { at: 0, cue: "step_snow", pan: -0.3 },
      { at: 520, cue: "step_snow", pan: 0.3 },
      { at: 1040, cue: "step_snow", pan: -0.15 },
      { at: 1700, cue: "warn_cold", pan: 0 },
    ],
  },
  {
    id: "keg",
    title: "The keg",
    place: "amb_quarry",
    blurb: "The fuse, then the blast. The flash is not optional.",
    steps: [
      { at: 0, cue: "fuse_hiss", pan: -0.15 },
      { at: 1100, cue: "powder_blast", pan: 0 },
    ],
  },
  {
    id: "fight",
    title: "Blade and bow",
    place: "amb_forest",
    blurb: "A swing that finds stone, then the shot.",
    steps: [
      { at: 0, cue: "blade_swing", pan: -0.4 },
      { at: 320, cue: "blade_stone", pan: -0.1 },
      { at: 800, cue: "bow_draw", pan: 0.3 },
      { at: 1500, cue: "bow_loose", pan: 0.45 },
      { at: 1780, cue: "arrow_hit", pan: -0.5 },
    ],
  },
];

const NS = "http://www.w3.org/2000/svg";
const IDLE_COPY = "Warnings print here as well as sounding. Mute does not clear them.";

let manifest = null;
let category = "all";
let selected = null;
let takeIndex = 0;
let ready = false;
let warningTimer = 0;
let yearTimer = 0;
let busCheckOn = false;
let boot = null;
let wantedZone = null;
let sceneId = null;
let sceneTimers = [];
let paceOn = false;
let paceTimer = 0;
let paceCount = 0;
let paceSide = -1;
let armedAt = 0;
let armedMs = 0;
let armedLoop = false;

function tick() {
  clockEl.textContent = ((performance.now() - started) / 1000).toFixed(2);
  paintNeedle();
  requestAnimationFrame(tick);
}
tick();

function placeName(id) {
  return ZONES.find((zone) => zone[0] === id)?.[1] || "No place";
}

function currentCue() {
  return manifest?.cues.find((cue) => cue.id === selected) || null;
}

function categoryLabel(name) {
  return CATEGORIES.find((item) => item[0] === name)?.[1] || name;
}

function spoken(id) {
  return id.replaceAll("_", " ");
}

function panLabel(value) {
  const n = Number(value);
  if (Math.abs(n) < 4) return "center";
  return n < 0 ? `left ${Math.abs(n)}` : `right ${n}`;
}

function currentPan() {
  return Number(panEl.value) / 100;
}

function paintTransport() {
  const state = desk.getState();
  const parts = [state.contextState];
  if (state.muted) parts.push("muted");
  if (state.userSuspended) parts.push("suspended");
  transportEl.textContent = parts.join(" · ");
  const names = [...new Set(state.voices.map((voice) => voice.cueId))];
  const place = placeName(state.ambience || wantedZone);
  voicedEl.textContent = names.length ? `${place} · ${names.join(" · ")}` : `${place} · nothing voiced`;
  voicesEl.textContent = `Voices ${state.voices.length} · ambience loops ${state.ambienceVoices} · loaded ${state.loaded}`;
  if (stage.dataset.kind === "idle") stageKind.textContent = `${place} · no warning`;
}

desk.on("state", paintTransport);
desk.on("warning", (visual) => {
  stage.dataset.kind = visual.kind || "banner";
  stageKind.textContent = visual.kind || "warning";
  stageCopy.textContent = visual.copy || "";
  if (visual.kind === "return") armYears();
  else clearYears();
  window.clearTimeout(warningTimer);
  warningTimer = window.setTimeout(() => {
    stage.dataset.kind = "idle";
    stageCopy.textContent = IDLE_COPY;
    clearYears();
    paintTransport();
  }, visual.persistMs || 800);
});

function clearYears() {
  window.clearInterval(yearTimer);
  yearTimer = 0;
  yearsEl.hidden = true;
  yearsEl.textContent = "";
}

function armYears() {
  clearYears();
  yearsEl.hidden = false;
  let n = 0;
  const step = () => {
    n += 1;
    yearsEl.textContent = n >= 14 ? "Year 14. Land the world here." : `Year ${n}`;
    if (n >= 14) window.clearInterval(yearTimer);
  };
  step();
  yearTimer = window.setInterval(step, 150);
}

function cueFilesLabel(cue) {
  const file = cue.files[0];
  const count = cue.files.length > 1 ? ` · ${cue.files.length} takes` : "";
  return `${file.peakDbfs.toFixed(1)} dBFS${count}`;
}

function filtered() {
  const q = findEl.value.trim().toLowerCase();
  return manifest.cues.filter((cue) => {
    if (category !== "all" && cue.category !== category) return false;
    if (!q) return true;
    return `${cue.id} ${cue.event} ${cue.category} ${cue.timingNotes}`.toLowerCase().includes(q);
  });
}

function renderList() {
  if (!manifest) return;
  const top = listEl.scrollTop;
  listEl.replaceChildren();
  const cues = filtered();
  shownEl.textContent = manifest ? `${cues.length} shown` : "";
  if (!cues.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Nothing matches.";
    listEl.append(empty);
    return;
  }
  let last = "";
  for (const cue of cues) {
    if (category === "all" && cue.category !== last) {
      last = cue.category;
      const heading = document.createElement("p");
      heading.className = "group";
      heading.textContent = categoryLabel(cue.category);
      listEl.append(heading);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cues";
    button.setAttribute("aria-current", cue.id === selected ? "true" : "false");
    const name = document.createElement("strong");
    name.textContent = cue.id;
    const meta = document.createElement("span");
    meta.textContent = cueFilesLabel(cue);
    button.append(name, meta);
    if (cue.warning) {
      const badge = document.createElement("em");
      badge.className = "badge";
      badge.textContent = "Shows";
      button.append(badge);
    }
    button.addEventListener("click", () => select(cue.id));
    listEl.append(button);
  }
  listEl.scrollTop = top;
}

function overlapSentence(cue) {
  const overlap = cue.overlap || {};
  if (overlap.mode === "protect" && overlap.minIntervalMs) {
    return `Held if retriggered inside ${overlap.minIntervalMs} ms.`;
  }
  if (overlap.mode === "replace") return "A new play replaces the one still sounding.";
  if (overlap.maxVoices) return `Up to ${overlap.maxVoices} at once.`;
  return "Plays over itself.";
}

function select(id, keepTake = false) {
  selected = id;
  if (!keepTake) takeIndex = 0;
  const cue = currentCue();
  cueIdEl.textContent = cue.id;
  cueName.textContent = spoken(cue.id);
  cueNotes.textContent = cue.timingNotes;
  const file = cue.files[Math.min(takeIndex, cue.files.length - 1)];
  const duck = cue.duck ? "Ducks the bed." : "No duck.";
  cueMeasure.textContent = [
    `Measured peak ${file.peakDbfs} dBFS`,
    `true peak ${file.truePeakDbfs} dBTP`,
    `RMS ${file.rmsDbfs} dBFS`,
    `${file.lufs} LUFS (${file.lufsMode})`,
    `onset ${file.onsetMs} ms`,
    `length ${file.durationMs} ms`,
    `priority ${cue.priority}`,
    overlapSentence(cue),
    duck,
    cue.warning ? `Visual: ${cue.warning.kind}.` : "No separate visual.",
  ].join(" · ");
  drawWave(cue);
  renderTakes(cue);
  renderLadder(file);
  renderList();
  syncActions();
}

function renderTakes(cue) {
  takesEl.replaceChildren();
  if (cue.files.length < 2) {
    takesEl.hidden = true;
    return;
  }
  takesEl.hidden = false;
  cue.files.forEach((file, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = `Take ${index + 1}`;
    button.title = `${file.peakDbfs} dBFS · ${Math.round(file.durationMs)} ms`;
    button.setAttribute("aria-pressed", index === takeIndex ? "true" : "false");
    button.addEventListener("click", () => playTake(index));
    takesEl.append(button);
  });
}

function renderLadder(file) {
  ladderEl.replaceChildren();
  const scale = (db) => `${((Math.min(0, Math.max(-30, db)) + 30) / 30) * 100}%`;
  for (const [label, db] of ANCHORS) {
    const mark = document.createElement("span");
    mark.className = "tick";
    mark.style.left = scale(db);
    mark.textContent = label;
    ladderEl.append(mark);
  }
  const you = document.createElement("span");
  you.className = "you";
  you.style.left = scale(file.peakDbfs);
  you.textContent = `${file.peakDbfs.toFixed(1)}`;
  ladderEl.append(you);
  ladderCaption.textContent = `${file.file} peaks at ${file.peakDbfs} dBFS. Focus sits at −18, grass at −10, a heavy hurt at −6, the blast at −4.`;
}

function drawWave(cue) {
  wave.replaceChildren();
  const index = Math.min(takeIndex, cue.files.length - 1);
  const file = cue.files[index];
  const buffer = desk.getBuffer(cue.id, index);
  if (!buffer) {
    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", "16");
    text.setAttribute("y", "78");
    text.setAttribute("fill", "var(--fg-muted)");
    text.textContent = "Waveform draws after the file is decoded.";
    wave.append(text);
    return;
  }
  const data = buffer.getChannelData(0);
  const width = 640;
  const height = 144;
  const step = Math.max(1, Math.floor(data.length / width));
  const upper = [];
  const lower = [];
  for (let x = 0; x < width; x += 1) {
    let min = 1;
    let max = -1;
    const start = x * step;
    for (let i = 0; i < step; i += 1) {
      const sample = data[start + i] || 0;
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }
    upper.push(`${x},${((1 - max) * 0.5 * height).toFixed(1)}`);
    lower.push(`${x},${((1 - min) * 0.5 * height).toFixed(1)}`);
  }
  const shape = document.createElementNS(NS, "path");
  shape.setAttribute("d", `M${upper.join(" L")} L${lower.reverse().join(" L")} Z`);
  shape.setAttribute("fill", "var(--accent)");
  wave.append(shape);
  if (file.durationMs > 0 && file.onsetMs > 0) {
    const onset = document.createElementNS(NS, "line");
    const x = ((file.onsetMs / file.durationMs) * width).toFixed(1);
    onset.setAttribute("x1", x);
    onset.setAttribute("x2", x);
    onset.setAttribute("y1", "8");
    onset.setAttribute("y2", "136");
    onset.setAttribute("stroke", "var(--fg-subtle)");
    onset.setAttribute("stroke-dasharray", "3 4");
    wave.append(onset);
  }
  const needle = document.createElementNS(NS, "line");
  needle.id = "needle";
  needle.setAttribute("y1", "0");
  needle.setAttribute("y2", "144");
  needle.setAttribute("x1", "0");
  needle.setAttribute("x2", "0");
  needle.setAttribute("stroke", "var(--danger)");
  needle.setAttribute("stroke-width", "2");
  needle.setAttribute("opacity", "0");
  wave.append(needle);
}

function armPlayhead(ms, loop) {
  armedAt = performance.now();
  armedMs = ms || 0;
  armedLoop = Boolean(loop);
}

function paintNeedle() {
  const line = wave.querySelector("#needle");
  if (!line || !armedMs) return;
  let t = (performance.now() - armedAt) / armedMs;
  if (armedLoop) t %= 1;
  if (t < 0 || t > 1) {
    line.setAttribute("opacity", "0");
    return;
  }
  const x = (t * 640).toFixed(1);
  line.setAttribute("x1", x);
  line.setAttribute("x2", x);
  line.setAttribute("opacity", "1");
}

function noteResult(result, label) {
  if (!result) return;
  const cue = currentCue();
  if (cue && Number.isInteger(result.variant)) {
    const changed = result.variant !== takeIndex;
    takeIndex = result.variant % cue.files.length;
    if (changed) {
      drawWave(cue);
      renderTakes(cue);
      renderLadder(cue.files[takeIndex]);
    }
    armPlayhead(cue.files[takeIndex].durationMs, cue.loop);
  }
  if (!result.accepted) {
    logEl.textContent = `${label} held back (${result.reason}).`;
    return;
  }
  const heard = result.audible ? "" : ` Silent (${result.reason}).`;
  const take = Number.isInteger(result.variant) ? ` take ${result.variant + 1}` : "";
  logEl.textContent = `${label}${take}.${heard}`;
}

function renderFilters() {
  const known = new Set(CATEGORIES.map((item) => item[0]));
  const extra = [...new Set(manifest.cues.map((cue) => cue.category))].filter((name) => !known.has(name));
  const names = ["all", ...CATEGORIES.map((item) => item[0]), ...extra];
  filtersEl.replaceChildren();
  for (const name of names) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = name === "all" ? "All" : categoryLabel(name);
    button.setAttribute("aria-pressed", name === category ? "true" : "false");
    button.addEventListener("click", () => {
      category = name;
      renderFilters();
      renderList();
    });
    filtersEl.append(button);
  }
}

function renderZones() {
  zonesEl.replaceChildren();
  ZONES.forEach(([id, label], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.zone = id;
    button.textContent = `${index + 1} ${label}`;
    button.addEventListener("click", () => chooseZone(id));
    zonesEl.append(button);
  });
}

function renderScenes() {
  scenesEl.replaceChildren();
  for (const scene of SCENES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = scene.title;
    button.disabled = !ready;
    button.setAttribute("aria-pressed", scene.id === sceneId ? "true" : "false");
    button.addEventListener("click", () => runScene(scene));
    scenesEl.append(button);
  }
}

function chooseZone(id) {
  wantedZone = id;
  const result = desk.setAmbience(id);
  stage.dataset.place = id;
  for (const button of zonesEl.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", button.dataset.zone === id ? "true" : "false");
  }
  paintTransport();
  if (result.reason === "same") statusEl.textContent = "Already in that place.";
  else if (result.reason === "unloaded" || result.reason === "deferred") statusEl.textContent = "Place will start when the loops are decoded.";
  else statusEl.textContent = `Place: ${placeName(id)}.`;
}

function stopScene(quiet) {
  for (const timer of sceneTimers) window.clearTimeout(timer);
  sceneTimers = [];
  const was = sceneId;
  sceneId = null;
  renderScenes();
  if (was && !quiet) {
    statusEl.textContent = "Scene stopped. The place stays.";
    sceneNote.textContent = "A short run of the real cues, in the place they belong. Press the same one to stop.";
  }
}

function runScene(scene) {
  if (!ready) {
    statusEl.textContent = "Still decoding.";
    return;
  }
  if (sceneId === scene.id) {
    stopScene();
    return;
  }
  stopScene(true);
  stopPace(true);
  sceneId = scene.id;
  chooseZone(scene.place);
  renderScenes();
  sceneNote.textContent = scene.blurb;
  statusEl.textContent = scene.title;
  for (const step of scene.steps) {
    sceneTimers.push(window.setTimeout(() => {
      if (sceneId !== scene.id) return;
      const result = desk.play(step.cue, { pan: step.pan || 0 });
      if (selected === step.cue) noteResult(result, scene.title);
      else if (!result.accepted) statusEl.textContent = `${scene.title}: ${step.cue} held (${result.reason}).`;
    }, step.at));
  }
  const end = scene.steps.reduce((max, step) => Math.max(max, step.at), 0) + 700;
  sceneTimers.push(window.setTimeout(() => {
    if (sceneId !== scene.id) return;
    sceneId = null;
    renderScenes();
    statusEl.textContent = `${scene.title} finished.`;
    sceneNote.textContent = "A short run of the real cues, in the place they belong. Press the same one to stop.";
  }, end));
}

function stopPace(quiet) {
  paceOn = false;
  window.clearTimeout(paceTimer);
  syncActions();
  if (!quiet) statusEl.textContent = "Pace stopped.";
}

function togglePace() {
  if (paceOn) {
    stopPace();
    return;
  }
  const cue = currentCue();
  if (!cue || cue.bus === "ambience" || !ready) return;
  stopScene(true);
  paceOn = true;
  paceCount = 0;
  syncActions();
  const step = () => {
    if (!paceOn) return;
    const live = currentCue();
    if (!live || live.bus === "ambience") {
      stopPace();
      return;
    }
    paceSide *= -1;
    paceCount += 1;
    const result = desk.play(live.id, { pan: paceSide * 0.45 });
    noteResult(result, "Pace");
    statusEl.textContent = `Pacing ${live.id} every ${tempoEl.value} ms. Step ${paceCount}.`;
    paceTimer = window.setTimeout(step, Number(tempoEl.value));
  };
  step();
}

function syncActions() {
  const cue = currentCue();
  const oneShot = Boolean(cue && cue.bus !== "ambience");
  playBtn.disabled = !cue;
  paceBtn.disabled = !oneShot || !ready;
  spamBtn.disabled = !oneShot || !ready;
  paceBtn.textContent = paceOn ? "Stop pace" : "Pace";
  paceBtn.setAttribute("aria-pressed", paceOn ? "true" : "false");
}

function playTake(index) {
  const cue = currentCue();
  if (!cue || !ready) return;
  takeIndex = index;
  drawWave(cue);
  renderTakes(cue);
  renderLadder(cue.files[index]);
  noteResult(desk.play(cue.id, { variant: index, pan: currentPan() }), `Take ${index + 1}`);
}

function moveSelection(delta) {
  const cues = filtered();
  if (!cues.length) return;
  const index = Math.max(0, cues.findIndex((cue) => cue.id === selected));
  const next = cues[Math.min(cues.length - 1, Math.max(0, index + delta))];
  if (!next || next.id === selected) return;
  select(next.id);
  listEl.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
}

function startFromGesture() {
  const opened = desk.unlock();
  if (!opened.ok) {
    statusEl.textContent = "This browser has no audio device.";
    return;
  }
  if (boot) return;
  gate.hidden = true;
  statusEl.textContent = "Decoding cues.";
  boot = (async () => {
    manifest = await desk.loadManifest();
    renderFilters();
    renderZones();
    renderScenes();
    renderList();
    select(manifest.cues[0].id);
    await desk.load((progress) => {
      transportEl.textContent = `decoding ${progress.done} of ${progress.total}`;
      statusEl.textContent = `Decoding ${progress.done} of ${progress.total}.`;
    });
    ready = true;
    renderScenes();
    syncActions();
    if (wantedZone) desk.setAmbience(wantedZone);
    drawWave(currentCue());
    const files = manifest.cues.reduce((sum, cue) => sum + cue.files.length, 0);
    statusEl.textContent = `${manifest.cueCount} cues, ${files} files.`;
    window.__desk = desk;
    window.__soundReady = true;
    paintTransport();
  })().catch((error) => {
    statusEl.textContent = error instanceof Error ? error.message : "Could not load cues.";
  });
}

document.querySelector("#unlock").addEventListener("pointerdown", startFromGesture);
document.querySelector("#unlock").addEventListener("click", startFromGesture);

window.addEventListener("keydown", (event) => {
  if (!desk.getState().unlocked && event.key !== "Tab") startFromGesture();
});

for (const name of ["master", "music", "ambience", "effects", "ui"]) {
  const input = document.querySelector(`#vol-${name}`);
  const read = document.querySelector(`#read-${name}`);
  input.addEventListener("input", () => {
    read.textContent = input.value;
    desk.setBusVolume(name, Number(input.value) / 100);
  });
}

panEl.addEventListener("input", () => {
  document.querySelector("#read-pan").textContent = panLabel(panEl.value);
});
tempoEl.addEventListener("input", () => {
  document.querySelector("#read-tempo").textContent = `${tempoEl.value} ms`;
});

document.querySelector("#mute").addEventListener("click", () => {
  const next = !desk.getState().muted;
  desk.setMuted(next);
  const button = document.querySelector("#mute");
  button.setAttribute("aria-pressed", next ? "true" : "false");
  button.textContent = next ? "Unmute" : "Mute";
});

document.querySelector("#suspend").addEventListener("click", () => {
  const button = document.querySelector("#suspend");
  const suspended = button.getAttribute("aria-pressed") === "true";
  if (suspended) {
    desk.resume();
    button.setAttribute("aria-pressed", "false");
    button.textContent = "Suspend engine";
  } else {
    stopPace(true);
    desk.suspend();
    button.setAttribute("aria-pressed", "true");
    button.textContent = "Resume engine";
  }
});

document.querySelector("#bus-check").addEventListener("click", () => {
  busCheckOn = !busCheckOn;
  const button = document.querySelector("#bus-check");
  if (busCheckOn) desk.startBusCheck("music");
  else desk.stopBusCheck();
  button.setAttribute("aria-pressed", busCheckOn ? "true" : "false");
  button.textContent = busCheckOn ? "Stop music check" : "Music bus check";
});

playBtn.addEventListener("click", () => {
  const cue = currentCue();
  if (!cue) return;
  if (cue.bus === "ambience") {
    chooseZone(cue.id);
    logEl.textContent = "Place loop, not a one-shot.";
    return;
  }
  noteResult(desk.play(cue.id, { pan: currentPan() }), "Game");
});

paceBtn.addEventListener("click", togglePace);

spamBtn.addEventListener("click", async () => {
  const cue = currentCue();
  if (!cue || cue.bus === "ambience") return;
  stopPace(true);
  let voiced = 0;
  let held = 0;
  let last = null;
  for (let i = 0; i < 8; i += 1) {
    last = desk.play(cue.id, { pan: currentPan() });
    if (last.accepted) voiced += 1;
    else held += 1;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  if (last) noteResult(last, "Stress");
  logEl.textContent = `Eight tries, 50 ms apart: ${voiced} voiced, ${held} held back.`;
});

findEl.addEventListener("input", renderList);

window.addEventListener("keydown", (event) => {
  if (event.target.closest("input, textarea")) return;
  const zone = ZONES[Number(event.key) - 1];
  if (zone && desk.getState().unlocked) chooseZone(zone[0]);
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveSelection(event.key === "ArrowDown" ? 1 : -1);
  }
  if (event.key === " " && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    playBtn.click();
  }
  if ((event.key === "p" || event.key === "P") && !paceBtn.disabled) togglePace();
  if (event.key === "Escape") {
    stopScene();
    stopPace(true);
  }
});

paintTransport();
renderScenes();
