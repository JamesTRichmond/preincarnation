window.startAnimPlayer = () => {
const gen = (window.__ANIM_GEN__ = (window.__ANIM_GEN__ || 0) + 1);
window.__ANIM_VERSION__ = 6;
window.__ANIM_BOOT__ = true;
if (window.__ANIM_RAF__) cancelAnimationFrame(window.__ANIM_RAF__);
clearInterval(window.__ANIM_TIMER__);
if (window.__ANIM_ONKEY__) window.removeEventListener("keydown", window.__ANIM_ONKEY__);
if (window.__ANIM_RO__) window.__ANIM_RO__.disconnect();

const selfScript = document.querySelector("script[src*='viewer.js']");
const BASE = window.__ANIM_BASE__
  ? new URL(window.__ANIM_BASE__)
  : selfScript
    ? new URL("../", selfScript.src)
    : new URL("/character-anim/", window.location.origin);

function asset(path) {
  return new URL(String(path).replace(/^\.\.\//, ""), BASE).href;
}
function esc(value) {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const quot = "&" + "quot;";
  const apos = "&" + "#39;";
  return String(value)
    .replaceAll("&", amp)
    .replaceAll("<", lt)
    .replaceAll(">", gt)
    .replaceAll('"', quot)
    .replaceAll("'", apos);
}

const root = document.getElementById("stage");
const oldTabs = document.getElementById("tabs");
const tabs = oldTabs.cloneNode(true);
oldTabs.replaceWith(tabs);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = {
  tab: "forms",
  form: 0,
  action: "walk",
  dir: 0,
  frame: 0,
  playing: !reduce,
  onion: false,
  feet: true,
  collision: false,
  sockets: false,
  silhouette: false,
  rim: true,
  env: "rutland-street",
  zoom: 4,
  rate: 1,
  lineup: false,
  face: 0,
  manifest: null,
  images: new Map(),
  street: [
    { key: "walk-child", label: "child", x: 24, frame: 0, acc: 0, speed: 78 },
    { key: "walk-farmer", label: "farmer", x: 240, frame: 2, acc: 0, speed: 62 },
    { key: "walk-elder", label: "elder", x: 460, frame: 1, acc: 0, speed: 40 },
  ],
};

const ENV = {
  none: null,
  "otter-creek": asset("environments/otter-creek.jpg"),
  "rutland-street": asset("environments/rutland-street.jpg"),
  "void-water": asset("environments/void-water.jpg"),
};

const stamp = document.createElement("canvas");
stamp.width = 96;
stamp.height = 96;
const sctx = stamp.getContext("2d");
let acc = 0;
let last = 0;

function img(src) {
  const url = asset(src);
  if (!state.images.has(url)) {
    const image = new Image();
    image.onload = () => {
      if (gen === window.__ANIM_GEN__) paint();
    };
    image.src = url;
    state.images.set(url, image);
  }
  return state.images.get(url);
}

function currentForm() {
  return state.manifest.forms[state.form];
}
function currentAction() {
  return currentForm().actions[state.action];
}
function spanOf(action) {
  return action.directional ? action.cols : action.frameCount;
}
function localOf(action, frame) {
  const span = spanOf(action);
  return ((frame % span) + span) % span;
}
function frameIndex(action, dir, frame) {
  const local = localOf(action, frame);
  if (!action.directional) return local;
  const facing = Math.min(dir, (action.directions || []).length - 1);
  return facing * action.cols + local;
}
function spriteMode() {
  if (state.silhouette) return "silhouette";
  if (state.rim) return "rim";
  return "plain";
}
function stampSprite(image, mode) {
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.globalAlpha = 1;
  sctx.globalCompositeOperation = "source-over";
  sctx.clearRect(0, 0, 96, 96);
  if (mode === "rim") {
    sctx.drawImage(image, -1, 0);
    sctx.drawImage(image, 1, 0);
    sctx.drawImage(image, 0, -1);
    sctx.drawImage(image, 0, 1);
    sctx.globalCompositeOperation = "source-in";
    sctx.fillStyle = "#f3ead7";
    sctx.fillRect(0, 0, 96, 96);
    sctx.globalCompositeOperation = "source-over";
    sctx.drawImage(image, 0, 0);
  } else if (mode === "silhouette") {
    sctx.drawImage(image, 0, 0);
    sctx.globalCompositeOperation = "source-in";
    sctx.fillStyle = "#0c0a08";
    sctx.fillRect(0, 0, 96, 96);
    sctx.globalCompositeOperation = "source-over";
  } else {
    sctx.drawImage(image, 0, 0);
  }
}
function blit(ctx, image, dx, dy, z, alpha) {
  if (!image || !image.complete || !image.naturalWidth) return;
  stampSprite(image, spriteMode());
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(stamp, dx, dy, 96 * z, 96 * z);
  ctx.restore();
}
function drawPlate(ctx, w, h) {
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(0, 0, w, h);
  const src = ENV[state.env];
  if (!src) return;
  const image = img(src);
  if (!image.complete || !image.naturalWidth) return;
  ctx.imageSmoothingEnabled = true;
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, (w - dw) / 2, h - dh, dw, dh);
}
function shadow(ctx, cx, feetY, z) {
  ctx.save();
  ctx.fillStyle = "rgba(12, 10, 8, 0.42)";
  ctx.beginPath();
  ctx.ellipse(cx, feetY + z * 0.4, 15 * z, 3.5 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function guides(ctx, form, action, dx, dy, z) {
  const anchor = form.anchor;
  if (!anchor) return;
  ctx.save();
  ctx.lineWidth = Math.max(1, Math.round(z / 2));
  if (state.feet) {
    ctx.strokeStyle = "#e0a15a";
    ctx.beginPath();
    const y = dy + anchor.feet[1] * z + 0.5;
    ctx.moveTo(dx + 8 * z, y);
    ctx.lineTo(dx + 88 * z, y);
    ctx.stroke();
  }
  if (state.collision && anchor.collision) {
    const box = anchor.collision;
    ctx.strokeStyle = "#7d9a78";
    ctx.strokeRect(dx + box.x * z + 0.5, dy + box.y * z + 0.5, box.w * z, box.h * z);
  }
  if (state.sockets && anchor.sockets) {
    const dirName = action.directional ? action.directions[Math.min(state.dir, action.directions.length - 1)] : "down";
    const mark = Math.max(3, z + 1);
    ctx.fillStyle = "#e07a62";
    for (const key of ["handMain", "handOff"]) {
      const point = anchor.sockets[key][dirName] || anchor.sockets[key].down;
      if (!point) continue;
      ctx.fillRect(dx + point[0] * z - mark / 2, dy + point[1] * z - mark / 2, mark, mark);
    }
    if (anchor.head) {
      ctx.fillStyle = "#f3ead7";
      ctx.fillRect(dx + anchor.head[0] * z - mark / 2, dy + anchor.head[1] * z - mark / 2, mark, mark);
    }
  }
  ctx.restore();
}
function label(ctx, text, x, y, on) {
  ctx.save();
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(12, 10, 8, 0.75)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = on ? "#e0a15a" : "#f3ead7";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function stageMetrics(plate) {
  const avail = Math.max(1, plate.clientWidth || 1);
  const count = state.lineup ? state.manifest.forms.length : 1;
  let z = state.zoom;
  if (!state.lineup) {
    while (z > 2 && 96 * z + 12 > avail) z -= 1;
  } else {
    while (z > 2 && 96 * z * count + 14 * (count + 1) > avail) z -= 1;
  }
  const sprite = 96 * z;
  const gap = count === 1 ? 0 : Math.max(10, Math.round(sprite * 0.06));
  const row = count * sprite + Math.max(0, count - 1) * gap;
  const side = count === 1 ? Math.round(sprite * 0.16) : Math.max(8, Math.round(gap * 0.5));
  const w = count === 1 ? Math.min(avail, sprite + side * 2) : row + side * 2;
  const headroom = Math.round(sprite * 0.05);
  const footroom = Math.round(sprite * 0.16) + (count > 1 ? 20 : 0);
  return { avail, z, sprite, count, gap, row, w, h: headroom + sprite + footroom, headroom };
}
function placeRow(metrics) {
  const { w, sprite, count, gap, row, headroom } = metrics;
  const x0 = count === 1 ? (w - sprite) / 2 : Math.max(gap / 2, (w - row) / 2);
  const xs = [];
  for (let i = 0; i < count; i += 1) xs.push(x0 + i * (sprite + gap));
  return { xs, dy: headroom };
}
function sizeCanvas(canvas, w, h, fit) {
  const width = Math.round(w);
  const height = Math.round(h);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  if (fit && fit > 0 && fit < width) {
    const scale = fit / width;
    canvas.style.width = Math.round(fit) + "px";
    canvas.style.height = Math.round(height * scale) + "px";
  } else {
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  }
}

function drawActor(ctx, form, dx, dy, z, focused) {
  const action = form.actions[state.action];
  if (!action) return;
  const index = frameIndex(action, state.dir, state.frame);
  const image = img(action.frames[index]);
  const feetY = dy + (form.anchor ? form.anchor.feet[1] : 86) * z;
  shadow(ctx, dx + 48 * z, feetY, z);
  if (focused && state.onion && action.frameCount > 1) {
    const span = spanOf(action);
    const prevLocal = (localOf(action, state.frame) + span - 1) % span;
    const prevIndex = action.directional
      ? Math.min(state.dir, action.directions.length - 1) * action.cols + prevLocal
      : prevLocal;
    blit(ctx, img(action.frames[prevIndex]), dx, dy, z, 0.35);
  }
  blit(ctx, image, dx, dy, z, 1);
  if (focused) guides(ctx, form, action, dx, dy, z);
  const local = localOf(action, state.frame);
  if ((action.hitFrames || []).includes(local)) {
    ctx.save();
    ctx.strokeStyle = "#e07a62";
    ctx.lineWidth = Math.max(1, Math.round(z / 2));
    ctx.strokeRect(dx + 1, dy + 1, 96 * z - 2, 96 * z - 2);
    ctx.restore();
  }
  if (state.lineup) label(ctx, form.display, dx + 48 * z, dy + 96 * z + 16, focused);
}

function syncStrip() {
  const strip = document.getElementById("strip");
  const action = currentAction();
  if (!strip || !action) return;
  const local = localOf(action, state.frame);
  const buttons = strip.querySelectorAll("button");
  buttons.forEach((button, i) => button.classList.toggle("on", i === local));
  const current = buttons[local];
  if (current) {
    const left = current.offsetLeft - strip.clientWidth / 2 + current.clientWidth / 2;
    strip.scrollLeft = Math.max(0, left);
  }
}
function syncHud() {
  const hud = document.getElementById("hud");
  const action = currentAction();
  if (!hud || !action) return;
  const local = localOf(action, state.frame);
  const phaseList = action.phases || [];
  const phase = phaseList[local] || "frame";
  const facing = action.directional ? action.directions[state.dir] : "sequence";
  const hit = (action.hitFrames || []).includes(local);
  const win = (action.hitWindowsMs || []).map((w) => `${w.startMs}–${w.endMs} ms`).join(", ");
  const slide = action.qc ? action.qc.maxCentroidSlidePx : null;
  const slideClass = slide == null ? "" : slide > 10 ? "bad" : slide > 6 ? "warn" : "ok";
  hud.innerHTML = `<span>${esc(facing)} · ${esc(phase)} · ${local + 1}/${spanOf(action)}</span><span class="${hit ? "hit" : ""}">${hit ? "HIT " + esc(win) : action.fps + " fps"} · slide <span class="${slideClass}">${slide ?? "–"}</span></span>`;
}
function paintForms() {
  const canvas = document.getElementById("view");
  const plate = document.getElementById("plate");
  if (!canvas || !plate || !state.manifest || plate.clientWidth < 40) return;
  const ctx = canvas.getContext("2d");
  const metrics = stageMetrics(plate);
  sizeCanvas(canvas, metrics.w, metrics.h, state.lineup ? metrics.avail : 0);
  const { xs, dy } = placeRow(metrics);
  drawPlate(ctx, canvas.width, canvas.height);
  if (state.lineup) {
    for (const entry of state.manifest.forms) preloadAction(entry.actions[state.action]);
    state.manifest.forms.forEach((form, i) => drawActor(ctx, form, xs[i], dy, metrics.z, i === state.form));
  } else {
    preloadAction(currentAction());
    drawActor(ctx, currentForm(), xs[0], dy, metrics.z, true);
  }
  syncStrip();
  syncHud();
  watch(plate);
}
function paintStreet() {
  const canvas = document.getElementById("street");
  const plate = document.getElementById("street-plate");
  if (!canvas || !plate || !state.manifest || plate.clientWidth < 40) return;
  const avail = plate.clientWidth;
  const z = avail < 520 ? 2 : 3;
  const sprite = 96 * z;
  const h = Math.round(sprite * 0.08) + sprite + Math.round(sprite * 0.22);
  sizeCanvas(canvas, avail, h);
  if (!state.streetPlaced) {
    state.street[0].x = avail * 0.06;
    state.street[1].x = avail * 0.36;
    state.street[2].x = avail * 0.66;
    state.streetPlaced = true;
  }
  const ctx = canvas.getContext("2d");
  drawPlate(ctx, canvas.width, canvas.height);
  const dy = Math.round(sprite * 0.08);
  for (const walker of state.street) {
    const walk = state.manifest.npcWalks[walker.key];
    if (!walk) continue;
    const index = 8 + (walker.frame % 4);
    const image = img(walk.frames[index]);
    const feetY = dy + 86 * z;
    shadow(ctx, walker.x + 48 * z, feetY, z);
    blit(ctx, image, walker.x, dy, z, 1);
    label(ctx, walker.label, walker.x + 48 * z, dy + sprite + 16, false);
  }
  const hud = document.getElementById("street-hud");
  if (hud) {
    const bits = state.street.map((walker) => {
      const walk = state.manifest.npcWalks[walker.key];
      return `${walker.label} ${walk ? walk.fps : "?"} fps`;
    }).join(" · ");
    hud.textContent = bits + " · facing right";
  }
  watch(plate);
}
function paint() {
  if (gen !== window.__ANIM_GEN__) return;
  if (state.tab === "forms") paintForms();
  else if (state.tab === "npcs") paintStreet();
}

let seenWidth = 0;
function watch(node) {
  if (!node || !window.__ANIM_RO__) return;
  if (window.__ANIM_WATCH__ === node) return;
  window.__ANIM_RO__.disconnect();
  window.__ANIM_WATCH__ = node;
  seenWidth = node.clientWidth;
  window.__ANIM_RO__.observe(node);
}
function stepStreet(dt) {
  const canvas = document.getElementById("street");
  const width = canvas ? canvas.width : 640;
  const z = width < 520 ? 2 : 3;
  for (const walker of state.street) {
    const walk = state.manifest.npcWalks[walker.key];
    if (!walk) continue;
    walker.x += (walker.speed * z) / 3 * (dt / 1000);
    if (walker.x > width + 8) walker.x = -96 * z;
    walker.acc += dt;
    const ms = 1000 / (walk.fps || 8);
    while (walker.acc >= ms) {
      walker.acc -= ms;
      walker.frame = (walker.frame + 1) % 4;
    }
  }
}
function advance(action) {
  const span = spanOf(action);
  const local = localOf(action, state.frame);
  if (!action.loop && local === span - 1) {
    state.playing = false;
    const play = document.getElementById("play");
    if (play) play.checked = false;
    return;
  }
  state.frame = (local + 1) % span;
}
function loop(now) {
  if (gen !== window.__ANIM_GEN__) return;
  window.__ANIM_RAF__ = requestAnimationFrame(loop);
  if (!last) last = now;
  const dt = Math.min(48, now - last);
  last = now;
  if (!state.playing || !state.manifest) return;
  if (state.tab === "forms") {
    const action = currentAction();
    if (!action) return;
    const frameMs = (action.frameMs || 1000 / (action.fps || 8)) / state.rate;
    acc += dt;
    let stepped = false;
    while (acc >= frameMs) {
      acc -= frameMs;
      advance(action);
      stepped = true;
      if (!state.playing) {
        acc = 0;
        break;
      }
    }
    if (stepped) paintForms();
  } else if (state.tab === "npcs") {
    stepStreet(dt);
    paintStreet();
  }
}

function buildStrip() {
  const strip = document.getElementById("strip");
  const action = currentAction();
  if (!strip || !action) return;
  strip.innerHTML = "";
  const span = spanOf(action);
  const facing = action.directional ? Math.min(state.dir, action.directions.length - 1) : 0;
  for (let i = 0; i < span; i += 1) {
    const index = action.directional ? facing * action.cols + i : i;
    const button = document.createElement("button");
    button.type = "button";
    const phase = (action.phases || [])[i] || "frame " + (i + 1);
    button.title = phase;
    button.className = (action.hitFrames || []).includes(i) ? "hit" : "";
    button.setAttribute("aria-label", phase);
    const image = document.createElement("img");
    image.alt = "";
    image.src = asset(action.frames[index]);
    button.appendChild(image);
    button.onclick = () => {
      state.frame = i;
      state.playing = false;
      acc = 0;
      const play = document.getElementById("play");
      if (play) play.checked = false;
      paintForms();
    };
    strip.appendChild(button);
  }
}
function preloadAction(action) {
  if (!action) return;
  for (const frame of action.frames) img(frame);
}
function wireChecks() {
  for (const id of ["onion", "feet", "collision", "sockets", "silhouette", "rim", "play"]) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.onchange = () => {
      if (id === "play") {
        if (el.checked && state.tab === "forms") {
          const action = currentAction();
          if (action && !action.loop && localOf(action, state.frame) === spanOf(action) - 1) state.frame = 0;
        }
        state.playing = el.checked;
        acc = 0;
      } else {
        state[id] = el.checked;
      }
      paint();
    };
  }
}
function wireChoice(id, read, apply) {
  const host = document.getElementById(id);
  if (!host) return;
  host.onclick = (event) => {
    const button = event.target.closest("button");
    if (!button || !host.contains(button)) return;
    apply(button);
    for (const el of host.querySelectorAll("button")) el.classList.toggle("on", el === button || read(el));
    paintForms();
  };
}
function renderForms() {
  const form = currentForm();
  const actions = Object.keys(form.actions);
  const action = currentAction();
  const qc = action.qc || {};
  const slide = qc.maxCentroidSlidePx;
  const bottom = qc.maxBottomSpreadPx;
  const slideClass = slide == null ? "" : slide > 10 ? "bad" : slide > 6 ? "warn" : "ok";
  const bottomClass = bottom == null ? "" : bottom > 4 ? "warn" : "ok";
  const hits = (action.hitWindowsMs || []).map((w) => `${w.startMs}–${w.endMs} ms`).join(", ") || "none";
  root.innerHTML = `
    <div class="layout">
      <section class="panel">
        <h2>Body</h2>
        <div class="actions" id="forms"></div>
        <h2>Clip</h2>
        <div class="actions" id="actions"></div>
        <h2>Facing</h2>
        <div class="row" id="dirs"></div>
        <h2>Cast</h2>
        <div class="row" id="cast">
          <button type="button" data-lineup="0" class="${state.lineup ? "" : "on"}">this body</button>
          <button type="button" data-lineup="1" class="${state.lineup ? "on" : ""}">lineup</button>
        </div>
        <h2>Scale</h2>
        <div class="row" id="zoom">
          <button type="button" data-zoom="2" class="${state.zoom === 2 ? "on" : ""}">2×</button>
          <button type="button" data-zoom="3" class="${state.zoom === 3 ? "on" : ""}">3×</button>
          <button type="button" data-zoom="4" class="${state.zoom === 4 ? "on" : ""}">4×</button>
        </div>
        <h2>Speed</h2>
        <div class="row" id="rate">
          <button type="button" data-rate="0.5" class="${state.rate === 0.5 ? "on" : ""}">½</button>
          <button type="button" data-rate="1" class="${state.rate === 1 ? "on" : ""}">1×</button>
          <button type="button" data-rate="2" class="${state.rate === 2 ? "on" : ""}">2×</button>
        </div>
        <div class="checks">
          <label><input type="checkbox" id="play" ${state.playing ? "checked" : ""}/> play</label>
          <label><input type="checkbox" id="onion" ${state.onion ? "checked" : ""}/> onion previous</label>
          <label><input type="checkbox" id="feet" ${state.feet ? "checked" : ""}/> foot line</label>
          <label><input type="checkbox" id="collision" ${state.collision ? "checked" : ""}/> collision</label>
          <label><input type="checkbox" id="sockets" ${state.sockets ? "checked" : ""}/> sockets</label>
          <label><input type="checkbox" id="rim" ${state.rim ? "checked" : ""}/> light rim</label>
          <label><input type="checkbox" id="silhouette" ${state.silhouette ? "checked" : ""}/> silhouette</label>
        </div>
        <h2>Ground</h2>
        <div class="row" id="envs"></div>
        <p class="meta">cell ${action.cell}² · ${action.frameMs} ms<br/>slide X <span class="${slideClass}">${slide ?? "–"} px</span> · sole <span class="${bottomClass}">${bottom ?? "–"} px</span><br/>hit ${esc(hits)}${action.locomotion ? " · locomotion " + esc(action.locomotion) : ""}</p>
        <p class="keys">Space play · ← → cell · ↑ ↓ facing · 1–4 body</p>
      </section>
      <section class="stage-card">
        <div class="plate" id="plate"><canvas id="view" class="theater" aria-label="Character clip"></canvas></div>
        <div class="strip" id="strip"></div>
        <div class="hud" id="hud"></div>
      </section>
    </div>`;
  const formHost = document.getElementById("forms");
  state.manifest.forms.forEach((entry, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = entry.display;
    button.className = i === state.form ? "on" : "";
    button.onclick = () => {
      state.form = i;
      if (!currentForm().actions[state.action]) state.action = "walk";
      renderForms();
    };
    formHost.appendChild(button);
  });
  const actionHost = document.getElementById("actions");
  actions.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.className = name === state.action ? "on" : "";
    button.onclick = () => {
      state.action = name;
      state.frame = 0;
      state.playing = !reduce;
      acc = 0;
      renderForms();
    };
    actionHost.appendChild(button);
  });
  const dirHost = document.getElementById("dirs");
  (action.directional ? action.directions : ["sequence"]).forEach((name, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.className = !action.directional || i === state.dir ? "on" : "";
    button.disabled = !action.directional;
    button.onclick = () => {
      state.dir = i;
      buildStrip();
      paintForms();
      for (const el of dirHost.querySelectorAll("button")) el.classList.toggle("on", el === button);
    };
    dirHost.appendChild(button);
  });
  const envHost = document.getElementById("envs");
  Object.keys(ENV).forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.className = state.env === name ? "on" : "";
    button.onclick = () => {
      state.env = name;
      for (const el of envHost.querySelectorAll("button")) el.classList.toggle("on", el === button);
      paintForms();
    };
    envHost.appendChild(button);
  });
  wireChecks();
  wireChoice("cast", (el) => (el.dataset.lineup === "1") === state.lineup, (button) => {
    state.lineup = button.dataset.lineup === "1";
  });
  wireChoice("zoom", (el) => Number(el.dataset.zoom) === state.zoom, (button) => {
    state.zoom = Number(button.dataset.zoom);
  });
  wireChoice("rate", (el) => Number(el.dataset.rate) === state.rate, (button) => {
    state.rate = Number(button.dataset.rate);
    acc = 0;
  });
  buildStrip();
  preloadAction(action);
  if (state.lineup) {
    for (const entry of state.manifest.forms) preloadAction(entry.actions[state.action]);
  }
  if (ENV[state.env]) img(ENV[state.env]);
  paintForms();
}

function renderNpcs() {
  const cards = state.manifest.npcs.map((npc) => `
    <figure>
      <img alt="" src="${esc(asset(npc.file))}" />
      <img alt="" src="${esc(asset(npc.strideFile))}" />
      <figcaption>${esc(npc.id)}<br/>${esc(npc.age)} · stand ${npc.heightPx}px · step ${npc.strideHeightPx}px</figcaption>
    </figure>`).join("");
  const walks = Object.entries(state.manifest.npcWalks).map(([key, walk]) => `
    <p><strong>${esc(key)}</strong> · ${walk.frameCount} frames · ${walk.fps} fps · slide X ${walk.qc.maxCentroidSlidePx}px · foot spread ${walk.qc.maxBottomSpreadPx}px</p>
    <img class="sheet" alt="" src="${esc(asset(walk.sheet))}" />
  `).join("");
  const envs = Object.keys(ENV).map((name) => `<button type="button" data-env="${esc(name)}" class="${state.env === name ? "on" : ""}">${esc(name)}</button>`).join("");
  root.innerHTML = `<section class="panel">
    <h2>Three ages on the street</h2>
    <p class="note">Child, farmer, and cane elder have full cycles and walk facing right. The other nine are a stand and a stride, tagged to those walks.</p>
    <div class="row" id="street-envs">${envs}</div>
    <div class="checks"><label><input type="checkbox" id="play" ${state.playing ? "checked" : ""}/> play</label></div>
    <div class="plate" id="street-plate"><canvas id="street" class="theater" aria-label="Villagers walking"></canvas></div>
    <div class="hud" id="street-hud"></div>
    <h2>Twelve bodies, stand then stride</h2>
    <div class="gallery">${cards}</div>
    <h2>Age walks</h2>
    ${walks}
  </section>`;
  document.getElementById("street-envs").onclick = (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.env = button.dataset.env;
    for (const el of document.querySelectorAll("#street-envs button")) el.classList.toggle("on", el === button);
    paintStreet();
  };
  wireChecks();
  for (const walker of state.street) {
    const walk = state.manifest.npcWalks[walker.key];
    if (walk) for (let i = 8; i < 12; i += 1) img(walk.frames[i]);
  }
  if (ENV[state.env]) img(ENV[state.env]);
  paintStreet();
}

function renderPortraits() {
  const list = state.manifest.portraits;
  const face = list[Math.min(state.face, list.length - 1)];
  const cards = list.map((portrait, i) => `
    <button type="button" class="face${i === state.face ? " on" : ""}" data-face="${i}">
      <img alt="" src="${esc(asset(portrait.file))}" />
      ${esc(portrait.id)}
    </button>`).join("");
  root.innerHTML = `<section class="panel">
    <h2>Twenty-four faces</h2>
    <p class="note">Older sheet, then younger. The mouth, the brow, and how the head sits change. The hair color does not.</p>
    <figure class="study">
      <img alt="" src="${esc(asset(face.file))}" />
      <figcaption>${esc(face.id)} · ${esc(face.generation)} · ${state.face + 1} / ${list.length}</figcaption>
    </figure>
    <div class="row">
      <button type="button" id="prev-face">previous</button>
      <button type="button" id="next-face">next</button>
    </div>
    <div class="gallery">${cards}</div>
  </section>`;
  const pick = (delta) => {
    const count = state.manifest.portraits.length;
    state.face = (state.face + delta + count) % count;
    renderPortraits();
  };
  document.getElementById("prev-face").onclick = () => pick(-1);
  document.getElementById("next-face").onclick = () => pick(1);
  document.querySelector(".gallery").onclick = (event) => {
    const button = event.target.closest("button[data-face]");
    if (!button) return;
    state.face = Number(button.dataset.face);
    renderPortraits();
  };
}

function renderNotes() {
  const data = state.manifest;
  const rows = [];
  const watch = [];
  for (const form of data.forms) {
    for (const [name, action] of Object.entries(form.actions)) {
      const qc = action.qc || {};
      const slide = qc.maxCentroidSlidePx;
      rows.push(`<tr><td>${esc(form.id)}</td><td>${esc(name)}</td><td>${action.frameCount}</td><td>${action.fps}</td><td class="${slide > 10 ? "bad" : slide > 6 ? "warn" : "ok"}">${slide ?? ""}</td><td>${qc.maxBottomSpreadPx ?? ""}</td><td>${esc((action.hitWindowsMs || []).map((w) => w.startMs + "–" + w.endMs).join(" "))}</td></tr>`);
      if (slide > 6) watch.push(`${form.display} ${name} · ${slide} px`);
    }
  }
  const contrast = Object.entries(data.contrast).map(([form, plates]) => {
    const bits = Object.entries(plates).map(([name, sample]) => `${name} ${sample.meanEdgeContrast ?? "?"} ${sample.readable ? "ok" : "thin"}`).join(" · ");
    return `<li>${esc(form)}: ${esc(bits)}</li>`;
  }).join("");
  const watchList = watch.length
    ? watch.map((line) => `<li>${esc(line)}</li>`).join("")
    : "<li>No clip drifts more than 6 px.</li>";
  root.innerHTML = `<section class="panel">
    <h2>Drift worth a look</h2>
    <ul class="note">${watchList}</ul>
    <p class="note">Slide X is how far the body centroid drifts inside one direction. Foot baseline spread is the lowest opaque pixel. Attack spreads often come from the blade, not the sole. Hit windows are proposals. There was no runtime damage window to match.</p>
    <h2>What was inspected</h2>
    <ul class="note">${data.inspected.notes.map((note) => `<li>${esc(note)}</li>`).join("")}</ul>
    <h2>Not shipped</h2>
    <ul class="note">${data.missing.map((note) => `<li>${esc(note)}</li>`).join("")}</ul>
    <h2>Contrast of idle against plates</h2>
    <ul class="note">${contrast}</ul>
    <table><thead><tr><th>Form</th><th>Clip</th><th>Frames</th><th>fps</th><th>Slide X</th><th>Sole</th><th>Hit ms</th></tr></thead><tbody>${rows}</tbody></table>
    <p><img alt="Four silhouettes" src="${esc(asset("preview/renders/silhouettes.png"))}" class="sheet" style="background:#efe4d0"/></p>
    <p><img alt="Down-facing attacks" src="${esc(asset("preview/renders/attack-down-rows.png"))}" class="sheet" style="background:transparent"/></p>
  </section>`;
}

function render() {
  if (state.tab === "forms") renderForms();
  else if (state.tab === "npcs") renderNpcs();
  else if (state.tab === "portraits") renderPortraits();
  else renderNotes();
}

function stepFrame(delta) {
  const action = currentAction();
  if (!action) return;
  state.playing = false;
  acc = 0;
  const play = document.getElementById("play");
  if (play) play.checked = false;
  const span = spanOf(action);
  state.frame = (localOf(action, state.frame) + delta + span) % span;
  paintForms();
}
function stepDir(delta) {
  const action = currentAction();
  if (!action || !action.directional) return;
  state.dir = (state.dir + delta + action.directions.length) % action.directions.length;
  const dirHost = document.getElementById("dirs");
  if (dirHost) {
    [...dirHost.children].forEach((button, i) => button.classList.toggle("on", i === state.dir));
  }
  buildStrip();
  paintForms();
}
function onKey(event) {
  if (gen !== window.__ANIM_GEN__) return;
  const tag = event.target && event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.code === "Space" && tag === "BUTTON") return;
  if (!state.manifest) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (state.tab === "forms" && !state.playing) {
      const action = currentAction();
      if (action && !action.loop && localOf(action, state.frame) === spanOf(action) - 1) state.frame = 0;
    }
    state.playing = !state.playing;
    acc = 0;
    const play = document.getElementById("play");
    if (play) play.checked = state.playing;
    return;
  }
  if (state.tab === "portraits") {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const count = state.manifest.portraits.length;
      state.face = (state.face + (event.key === "ArrowRight" ? 1 : -1) + count) % count;
      renderPortraits();
    }
    return;
  }
  if (state.tab !== "forms") return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepFrame(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepFrame(-1);
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    stepDir(event.key === "ArrowDown" ? 1 : -1);
  } else if (event.key >= "1" && event.key <= "4") {
    const index = Number(event.key) - 1;
    if (state.manifest.forms[index]) {
      state.form = index;
      renderForms();
    }
  }
}

tabs.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  state.tab = button.dataset.tab;
  for (const el of tabs.querySelectorAll("button")) el.classList.toggle("on", el === button);
  render();
});

window.__ANIM_ONKEY__ = onKey;
window.addEventListener("keydown", onKey);
window.__ANIM_RO__ = new ResizeObserver((entries) => {
  if (gen !== window.__ANIM_GEN__) return;
  const width = entries[0] ? entries[0].contentRect.width : 0;
  if (Math.abs(width - seenWidth) < 1) return;
  seenWidth = width;
  paint();
});

fetch(asset("manifest.json"))
  .then((response) => response.json())
  .then((data) => {
    if (gen !== window.__ANIM_GEN__) return;
    state.manifest = data;
    render();
    last = 0;
    requestAnimationFrame(loop);
  })
  .catch((error) => {
    if (gen !== window.__ANIM_GEN__) return;
    root.textContent = "Manifest missing. " + error;
  });
};
