import { createSession } from "./session.js";

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "KeyQ",
  "KeyJ",
  "KeyK",
  "KeyC",
  "KeyR",
  "KeyH",
  "KeyU",
  "KeyV",
  "KeyF",
  "Space",
]);

export function mountArena(host, { onSnapshot } = {}) {
  const session = createSession();
  const canvas = document.createElement("canvas");
  canvas.className = "qc-canvas";
  canvas.setAttribute("aria-label", "Quarry and Creek combat cut");
  host.replaceChildren(canvas);
  const ctx = canvas.getContext("2d");
  let raf = 0;
  let last = performance.now();
  let acc = 0;
  let snapAcc = 0;
  let view = { ox: 0, oy: 0, scale: 40, w: 1, h: 1 };
  let alive = true;
  let muted = false;
  let audioCtx = null;
  let master = null;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) session.setA11y({ reducedMotion: true });

  const memory = {
    hp: null,
    foes: new Map(),
    log: "",
    door: false,
    particles: [],
    floats: [],
    pulse: 0,
    swing: 0,
    time: 0,
    dust: Array.from({ length: 16 }, (_, i) => ({
      x: 1.4 + ((i * 3.1) % 13),
      y: 1.3 + ((i * 1.7) % 8),
      phase: i * 0.7,
    })),
  };

  function unlockAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) {
      audioCtx = new Ctx({ latencyHint: "interactive" });
      master = audioCtx.createGain();
      master.gain.value = muted ? 0 : 0.8;
      master.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
  }

  function blip(freq, dur, type, gain) {
    if (muted || !audioCtx || !master || audioCtx.state !== "running") return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * (0.94 + Math.random() * 0.12), now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  }

  function burst(x, y, color, count, speed) {
    const calm = session.state.player.a11y.reducedMotion;
    const n = calm ? Math.min(4, count) : count;
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const v = speed * (0.35 + Math.random() * 0.65);
      memory.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: calm ? 0.18 : 0.28 + Math.random() * 0.28,
        max: 0.5,
        color,
        size: 0.06 + Math.random() * 0.08,
      });
    }
    if (memory.particles.length > 160) memory.particles.splice(0, memory.particles.length - 160);
  }

  function floatAt(x, y, text, color) {
    memory.floats.push({ x, y, text, color, life: 0.75, max: 0.75 });
    if (memory.floats.length > 20) memory.floats.shift();
  }

  function voice(line) {
    if (line.startsWith("Verdict catches")) return blip(523, 0.12, "sine", 0.05);
    if (line.includes("Red iron") || line.includes("will not be caught") || line.startsWith("The Warden")) {
      return blip(98, 0.18, "sawtooth", 0.035);
    }
    if (line.startsWith("The chisel")) return blip(392, 0.16, "triangle", 0.045);
    if (line.startsWith("Gait committed")) return blip(164, 0.1, "square", 0.03);
    if (line.includes("shard")) {
      blip(523, 0.18, "sine", 0.04);
      blip(784, 0.32, "sine", 0.03);
    }
    if (line.startsWith("Death")) return blip(70, 0.28, "triangle", 0.05);
  }

  function tickFx(dt) {
    const state = session.state;
    const player = state.player;
    memory.time += dt;
    memory.pulse = Math.max(0, memory.pulse - dt * 1.8);
    memory.swing = Math.max(0, memory.swing - dt);
    if (memory.hp == null) {
      memory.hp = player.hp;
      for (const enemy of state.enemies) memory.foes.set(enemy.id, enemy.hp);
      memory.log = state.log[0]?.text || "";
      memory.door = !!state.door?.open;
    } else {
      if (player.hp < memory.hp - 0.01) {
        memory.pulse = Math.min(1, memory.pulse + 0.62);
        burst(player.x, player.y, "#c46a5a", 16, 3.4);
        floatAt(player.x, player.y - 0.35, `−${Math.round(memory.hp - player.hp)}`, "#c46a5a");
        blip(92, 0.12, "triangle", 0.05);
      }
      memory.hp = player.hp;
      for (const enemy of state.enemies) {
        const prev = memory.foes.get(enemy.id);
        if (prev != null && enemy.hp < prev - 0.01) {
          const dead = enemy.hp <= 0;
          burst(enemy.x + 0.5, enemy.y + 0.45, "#e7e2d8", dead ? 24 : 12, dead ? 4.2 : 2.6);
          floatAt(enemy.x + 0.5, enemy.y, dead ? "breaks" : `−${Math.round(prev - enemy.hp)}`, "#eceae6");
          blip(dead ? 128 : 210 + Math.random() * 40, dead ? 0.16 : 0.07, "square", 0.04);
          memory.swing = 0.14;
        }
        memory.foes.set(enemy.id, enemy.hp);
      }
      const line = state.log[0]?.text || "";
      if (line && line !== memory.log) {
        memory.log = line;
        voice(line);
        if (line.startsWith("The swing") || line.startsWith("Fault hits") || line.startsWith("Borrowed")) memory.swing = 0.14;
      }
      if (state.door?.open && !memory.door) {
        memory.door = true;
        burst(state.door.x + 0.5, state.door.y + 0.5, "#8ea4b3", 20, 2.2);
        blip(349, 0.14, "sine", 0.04);
        blip(523, 0.24, "sine", 0.03);
      } else memory.door = !!state.door?.open;
    }
    const calm = player.a11y.reducedMotion;
    for (const particle of memory.particles) {
      particle.life -= dt;
      if (!calm) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 0.8 * dt;
      }
    }
    memory.particles = memory.particles.filter((particle) => particle.life > 0);
    for (const item of memory.floats) {
      item.life -= dt;
      if (!calm) item.y -= dt * 0.55;
    }
    memory.floats = memory.floats.filter((item) => item.life > 0);
  }

  function resize() {
    const w = Math.max(280, host.clientWidth || 640);
    const h = Math.max(220, host.clientHeight || 360);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    view.w = w;
    view.h = h;
  }

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    acc += dt;
    while (acc >= 1 / 60) {
      session.step(1 / 60);
      acc -= 1 / 60;
    }
    tickFx(dt);
    draw();
    snapAcc += dt;
    if (snapAcc > 0.1) {
      snapAcc = 0;
      onSnapshot?.(session.snapshot());
    }
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    const state = session.state;
    const player = state.player;
    const { w, h } = view;
    const scale = Math.min(w / state.w, h / state.h);
    const ox = (w - state.w * scale) / 2;
    const oy = (h - state.h * scale) / 2;
    view = { ox, oy, scale, w, h };
    const calm = player.a11y.reducedMotion;
    const hc = player.a11y.highContrast;
    const shakeMag = calm ? 0 : (session.snapshot().shake + memory.pulse * 7) * (0.35 + memory.pulse);
    const shakeX = calm ? 0 : Math.sin(memory.time * 47) * shakeMag;
    const shakeY = calm ? 0 : Math.cos(memory.time * 39) * shakeMag * 0.65;
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.fillStyle = "#0c0d0f";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(ox + shakeX, oy + shakeY);

    for (let y = 0; y < state.h; y++) {
      for (let x = 0; x < state.w; x++) {
        paintTile(ctx, state, x, y, scale, memory.time, calm, hc);
      }
    }

    if (!calm) {
      for (const mote of memory.dust) {
        const dx = mote.x * scale;
        const dy = (mote.y + Math.sin(memory.time * 0.35 + mote.phase) * 0.15) * scale;
        ctx.fillStyle = "rgba(231,226,216,0.14)";
        ctx.fillRect(dx, dy, 1.5, 1.5);
      }
    }

    const pool = ctx.createRadialGradient(
      player.x * scale,
      player.y * scale,
      scale * 0.2,
      player.x * scale,
      player.y * scale,
      scale * 3.4,
    );
    pool.addColorStop(0, "rgba(231,226,216,0.07)");
    pool.addColorStop(1, "rgba(231,226,216,0)");
    ctx.fillStyle = pool;
    ctx.fillRect(0, 0, state.w * scale, state.h * scale);

    if (state.fissure) paintFissure(ctx, state.fissure, player, scale, hc);
    paintTape(ctx, player, scale, !!player.flood);

    for (const movable of state.movables) paintSled(ctx, movable, scale);
    for (const cairn of state.cairns) paintCairn(ctx, cairn, scale, hc);
    if (state.door) paintDoor(ctx, state.door, scale, memory.time, calm);
    if (state.goal) paintShard(ctx, state.goal, scale, memory.time, calm, !!state.door?.open);

    for (const enemy of state.enemies) {
      if (enemy.hp > 0 && enemy.telegraph) paintTell(ctx, enemy, player, scale, hc);
    }
    for (const enemy of state.enemies) paintEnemy(ctx, enemy, scale, hc);
    for (const shot of state.projectiles) paintShot(ctx, shot, scale, hc);

    if (player.windup) {
      const tx = player.windup.x * scale;
      const ty = player.windup.y * scale;
      ctx.strokeStyle = "#cfc6ba";
      ctx.lineWidth = hc ? 3 : 1.5;
      ctx.strokeRect(tx + 5, ty + 5, scale - 10, scale - 10);
    }
    if (player.heartbeat > 0) {
      ctx.strokeStyle = "#8ea4b3";
      ctx.lineWidth = hc ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(player.x * scale, player.y * scale, scale * (0.42 + player.heartbeat * 0.2), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (player.guarding) {
      ctx.strokeStyle = "#e7e2d8";
      ctx.lineWidth = hc ? 4 : 2.5;
      ctx.beginPath();
      ctx.arc(player.x * scale, player.y * scale, scale * 0.46, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    paintEllis(ctx, player, scale, memory.swing);
    paintFx(ctx, memory, scale, calm);

    if (memory.pulse > 0.02) {
      ctx.fillStyle = `rgba(196,106,90,${memory.pulse * 0.18})`;
      ctx.fillRect(-20, -20, state.w * scale + 40, state.h * scale + 40);
    }

    ctx.restore();
  }

  function worldFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x: (x - view.ox) / view.scale,
      y: (y - view.oy) / view.scale,
    };
  }

  function onKeyDown(event) {
    if (!GAME_KEYS.has(event.code)) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    unlockAudio();
    session.handleDown(event.code, event.repeat);
  }
  function onKeyUp(event) {
    if (!GAME_KEYS.has(event.code)) return;
    session.handleUp(event.code);
  }
  function onPointer(event) {
    const world = worldFromEvent(event);
    session.setPointer(world.x, world.y, true);
  }
  function onLeave() {
    session.setPointer(null, null, false);
  }
  function onDown(event) {
    unlockAudio();
    if (!session.isEngaged()) return;
    onPointer(event);
    if (event.button === 2) session.hold("KeyK", true);
    else session.press("KeyJ");
  }
  function onUp(event) {
    if (event.button === 2) session.hold("KeyK", false);
  }
  function onVis() {
    if (document.visibilityState === "visible") unlockAudio();
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerup", onUp);
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("pointermove", onPointer);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  raf = requestAnimationFrame(frame);
  onSnapshot?.(session.snapshot());

  const controls = {
    getYaw: () => session.getYaw(),
    getSpeed: () => session.getSpeed(),
    getX: () => session.getX(),
    getY: () => session.getY(),
    setKeys: (codes) => session.setKeys(codes),
    setSteer: (value) => session.setSteer(value),
  };
  window.__controlsTest = controls;
  window.__arena = {
    press: (code) => session.press(code),
    hold: (code, down) => session.hold(code, down),
    snapshot: () => session.snapshot(),
    state: () => session.state,
  };

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove();
      if (window.__controlsTest === controls) delete window.__controlsTest;
      if (audioCtx) void audioCtx.close();
    },
    setEngaged(value) {
      unlockAudio();
      session.setEngaged(value);
    },
    setA11y(partial) {
      session.setA11y(partial);
    },
    setMuted(value) {
      muted = !!value;
      if (master && audioCtx) master.gain.setTargetAtTime(muted ? 0 : 0.8, audioCtx.currentTime, 0.03);
    },
    press(code) {
      unlockAudio();
      session.press(code);
    },
    hold(code, down) {
      unlockAudio();
      session.hold(code, down);
    },
    resetLoadout() {
      session.resetLoadout();
      onSnapshot?.(session.snapshot());
    },
    snapshot: () => session.snapshot(),
  };
}

function paintTile(ctx, state, x, y, scale, time, calm, hc) {
  const px = x * scale;
  const py = y * scale;
  const key = `${x},${y}`;
  if (state.walls.has(key)) {
    ctx.fillStyle = "#141311";
    ctx.fillRect(px, py, scale + 0.6, scale + 0.6);
    ctx.fillStyle = "#3a342e";
    ctx.fillRect(px + 1, py + 1, scale - 2, scale * 0.42);
    ctx.fillStyle = "#241f1c";
    ctx.fillRect(px + 1, py + scale * 0.42, scale - 2, scale * 0.58 - 1);
    ctx.fillStyle = "rgba(231,226,216,0.16)";
    ctx.fillRect(px + 2, py + 2, scale * 0.46, Math.max(1, scale * 0.06));
    return;
  }
  const n = Math.abs((x * 17 + y * 31) ^ (x * y)) % 7;
  ctx.fillStyle = n > 4 ? "#17191c" : n > 2 ? "#1c1f23" : "#20242a";
  ctx.fillRect(px, py, scale + 0.6, scale + 0.6);
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, scale - 1, scale - 1);
  if (n === 1 || n === 6) {
    ctx.strokeStyle = "rgba(231,226,216,0.08)";
    ctx.beginPath();
    ctx.moveTo(px + scale * 0.2, py + scale * 0.72);
    ctx.lineTo(px + scale * 0.78, py + scale * 0.28);
    ctx.stroke();
  }
  if (state.hazards.has(key)) {
    ctx.fillStyle = "#142026";
    ctx.fillRect(px + 1, py + 1, scale - 2, scale - 2);
    ctx.strokeStyle = hc ? "#c46a5a" : "rgba(142,164,179,0.7)";
    ctx.lineWidth = hc ? 2 : 1.25;
    for (let i = 0; i < 3; i++) {
      const wobble = calm ? 0 : Math.sin(time * 2.2 + x * 0.8 + i) * scale * 0.06;
      const yy = py + scale * (0.28 + i * 0.22) + wobble;
      ctx.beginPath();
      ctx.moveTo(px + 4, yy);
      ctx.quadraticCurveTo(px + scale * 0.5, yy + scale * 0.08, px + scale - 4, yy);
      ctx.stroke();
    }
    ctx.strokeStyle = "#c46a5a";
    ctx.lineWidth = hc ? 2.5 : 1.5;
    ctx.strokeRect(px + 3, py + 3, scale - 6, scale - 6);
  }
}

function paintFissure(ctx, fissure, player, scale, hc) {
  ctx.strokeStyle = "#e7e2d8";
  ctx.lineWidth = hc ? 4 : 2.5;
  ctx.beginPath();
  ctx.moveTo(player.x * scale, player.y * scale);
  for (const tile of fissure.tiles) ctx.lineTo(tile.x * scale + scale * 0.5, tile.y * scale + scale * 0.5);
  ctx.stroke();
  ctx.fillStyle = "#cfc6ba";
  for (const tile of fissure.tiles) {
    ctx.save();
    ctx.translate(tile.x * scale + scale * 0.5, tile.y * scale + scale * 0.5);
    ctx.rotate(0.4);
    ctx.fillRect(-scale * 0.08, -scale * 0.08, scale * 0.16, scale * 0.16);
    ctx.restore();
  }
}

function paintTape(ctx, player, scale, flooding) {
  ctx.fillStyle = flooding ? "#8ea4b3" : "rgba(142,164,179,0.75)";
  for (const step of player.pathTape) {
    ctx.beginPath();
    ctx.arc(step.x * scale + scale * 0.5, step.y * scale + scale * 0.72, Math.max(2, scale * 0.07), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintSled(ctx, movable, scale) {
  const x = movable.x * scale + scale * 0.16;
  const y = movable.y * scale + scale * 0.28;
  const w = scale * 0.68;
  const h = scale * 0.42;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x + 3, y + h, w, 4);
  ctx.fillStyle = "#6e6860";
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.fillStyle = "#8d867d";
  ctx.fillRect(x + 3, y + 3, w - 6, 4);
  ctx.strokeStyle = "#2a2623";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 4);
  ctx.lineTo(x + w - 6, y + h - 4);
  ctx.moveTo(x + w - 6, y + 4);
  ctx.lineTo(x + 6, y + h - 4);
  ctx.stroke();
}

function paintCairn(ctx, cairn, scale, hc) {
  const cx = cairn.x * scale + scale * 0.5;
  const base = cairn.y * scale + scale * 0.78;
  ctx.fillStyle = "#b7aea3";
  ctx.beginPath();
  ctx.moveTo(cx - scale * 0.32, base);
  ctx.lineTo(cx + scale * 0.32, base);
  ctx.lineTo(cx + scale * 0.2, base - scale * 0.16);
  ctx.lineTo(cx - scale * 0.2, base - scale * 0.16);
  ctx.fill();
  ctx.fillStyle = "#d5cfc6";
  ctx.fillRect(cx - scale * 0.14, base - scale * 0.36, scale * 0.28, scale * 0.2);
  ctx.fillStyle = "#eceae6";
  ctx.beginPath();
  ctx.moveTo(cx, base - scale * 0.52);
  ctx.lineTo(cx + scale * 0.1, base - scale * 0.36);
  ctx.lineTo(cx - scale * 0.1, base - scale * 0.36);
  ctx.fill();
  if (hc) {
    ctx.strokeStyle = "#e7e2d8";
    ctx.strokeRect(cairn.x * scale + 4, cairn.y * scale + 4, scale - 8, scale - 8);
  }
}

function paintDoor(ctx, door, scale, time, calm) {
  const dx = door.x * scale;
  const dy = door.y * scale;
  ctx.fillStyle = door.open ? "#17211c" : "#101214";
  ctx.fillRect(dx + scale * 0.12, dy + scale * 0.06, scale * 0.76, scale * 0.88);
  ctx.strokeStyle = "#3a3632";
  ctx.lineWidth = 2;
  ctx.strokeRect(dx + scale * 0.12, dy + scale * 0.06, scale * 0.76, scale * 0.88);
  const pulse = calm ? 0.75 : 0.55 + Math.sin(time * 3) * 0.25;
  ctx.globalAlpha = door.open ? 0.95 : pulse;
  ctx.fillStyle = door.open ? "#8ea4b3" : "#e7e2d8";
  const seam = door.open ? scale * 0.28 : Math.max(2, scale * 0.07);
  ctx.fillRect(dx + (scale - seam) / 2, dy + scale * 0.14, seam, scale * 0.7);
  ctx.globalAlpha = 1;
}

function paintShard(ctx, goal, scale, time, calm, open) {
  const gx = goal.x * scale + scale * 0.5;
  const gy = goal.y * scale + scale * 0.48;
  const bob = calm ? 0 : Math.sin(time * 2) * scale * 0.04;
  ctx.save();
  ctx.translate(gx, gy + bob);
  ctx.globalAlpha = open ? 1 : 0.72;
  ctx.fillStyle = "rgba(142,164,179,0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, scale * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d7e0e6";
  ctx.beginPath();
  ctx.moveTo(0, -scale * 0.22);
  ctx.lineTo(scale * 0.12, 0);
  ctx.lineTo(0, scale * 0.2);
  ctx.lineTo(-scale * 0.12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function paintTell(ctx, enemy, player, scale, hc) {
  const tel = enemy.telegraph;
  const ex = enemy.x * scale + scale * 0.5;
  const ey = enemy.y * scale + scale * 0.5;
  const max = tel.kind === "ring" ? 0.7 : tel.kind === "slam" ? 0.48 : tel.kind === "shot" ? 0.32 : 0.28;
  const left = Math.max(0, Math.min(1, tel.t / max));
  const red = tel.tier === "red" || tel.unstoppable;
  const color = red ? "#c46a5a" : "#e7e2d8";
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = red ? "rgba(196,106,90,0.16)" : "rgba(231,226,216,0.1)";
  ctx.lineWidth = hc ? 3 : 2;
  if (tel.kind === "ring") {
    const radius = scale * 2.25 * (0.55 + (1 - left) * 0.45);
    ctx.beginPath();
    ctx.arc(ex, ey, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (tel.kind === "shot") {
    const dx = player.x - (enemy.x + 0.5);
    const dy = player.y - (enemy.y + 0.5);
    const mag = Math.hypot(dx, dy) || 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + (dx / mag) * scale * 4.2, ey + (dy / mag) * scale * 4.2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    const reach = (tel.kind === "slam" ? 1.7 : 1.15) * scale;
    ctx.beginPath();
    ctx.arc(ex, ey, reach, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.max(10, scale * 0.22)}px Outfit, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(red ? "RED" : "OPEN", ex, ey - scale * 0.55);
  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.arc(ex, ey, scale * 0.22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - left));
  ctx.stroke();
}

function paintEnemy(ctx, enemy, scale, hc) {
  const ex = enemy.x * scale + scale * 0.5;
  const ey = enemy.y * scale + scale * 0.5;
  if (enemy.hp <= 0) {
    ctx.fillStyle = "#3a3632";
    ctx.beginPath();
    ctx.ellipse(ex, ey + scale * 0.12, scale * 0.18, scale * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(ex, ey + scale * 0.28, scale * 0.26, scale * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  const flash = enemy.flash > 0;
  if (enemy.kind === "warden") {
    ctx.fillStyle = flash ? "#e7e2d8" : "#2c3330";
    roundRect(ctx, ex - scale * 0.34, ey - scale * 0.36, scale * 0.68, scale * 0.66, 5);
    ctx.fill();
    ctx.fillStyle = flash ? "#101113" : "#8d867d";
    ctx.fillRect(ex - scale * 0.28, ey - scale * 0.08, scale * 0.56, scale * 0.12);
    ctx.fillStyle = "#c46a5a";
    ctx.fillRect(ex - scale * 0.12, ey - scale * 0.22, scale * 0.06, scale * 0.05);
    ctx.fillRect(ex + scale * 0.06, ey - scale * 0.22, scale * 0.06, scale * 0.05);
  } else if (enemy.kind === "archer") {
    ctx.strokeStyle = flash ? "#e7e2d8" : "#8ea4b3";
    ctx.lineWidth = hc ? 3 : 2;
    ctx.beginPath();
    ctx.arc(ex + scale * 0.12, ey, scale * 0.2, -1.2, 1.2);
    ctx.stroke();
    ctx.fillStyle = flash ? "#e7e2d8" : "#6a645e";
    ctx.beginPath();
    ctx.moveTo(ex, ey - scale * 0.32);
    ctx.lineTo(ex + scale * 0.12, ey + scale * 0.22);
    ctx.lineTo(ex - scale * 0.12, ey + scale * 0.22);
    ctx.fill();
    ctx.fillStyle = "#eceae6";
    ctx.fillRect(ex - 2, ey - scale * 0.08, 4, scale * 0.16);
  } else {
    ctx.fillStyle = flash ? "#e7e2d8" : "#8a847c";
    ctx.beginPath();
    ctx.ellipse(ex, ey + scale * 0.04, scale * 0.24, scale * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? "#101113" : "#4a453f";
    ctx.beginPath();
    ctx.arc(ex - scale * 0.08, ey, scale * 0.035, 0, Math.PI * 2);
    ctx.arc(ex + scale * 0.08, ey, scale * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  const bw = scale * 0.5;
  ctx.fillStyle = "#101113";
  ctx.fillRect(ex - bw / 2, ey - scale * 0.48, bw, hc ? 5 : 3);
  ctx.fillStyle = enemy.boss ? "#c46a5a" : "#d7d2c8";
  ctx.fillRect(ex - bw / 2, ey - scale * 0.48, bw * ratio, hc ? 5 : 3);
  ctx.fillStyle = "rgba(236,234,230,0.8)";
  ctx.font = `500 ${Math.max(9, scale * 0.18)}px Outfit, sans-serif`;
  ctx.textAlign = "center";
  const name = enemy.kind === "warden" ? "Warden" : enemy.kind === "archer" ? "Archer" : "Mite";
  ctx.fillText(name, ex, ey - scale * 0.54);
}

function paintShot(ctx, shot, scale, hc) {
  ctx.strokeStyle = shot.unstoppable ? "rgba(196,106,90,0.45)" : "rgba(142,164,179,0.55)";
  ctx.lineWidth = hc ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(shot.x * scale, shot.y * scale);
  ctx.lineTo((shot.x - shot.vx * 0.08) * scale, (shot.y - shot.vy * 0.08) * scale);
  ctx.stroke();
  ctx.fillStyle = shot.unstoppable ? "#c46a5a" : "#d5e0e6";
  ctx.beginPath();
  ctx.arc(shot.x * scale, shot.y * scale, shot.unstoppable ? 5 : 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function paintEllis(ctx, player, scale, swing) {
  const face = player.facing || { x: 0, y: -1 };
  const x = player.x * scale;
  const y = player.y * scale;
  const hc = player.a11y.highContrast;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, scale * 0.18, scale * 0.22, scale * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  if (player.evadeArmed) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#8ea4b3";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-face.x * scale * 0.22, -face.y * scale * 0.22, scale * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (player.borrow) {
    ctx.strokeStyle = "#8ea4b3";
    ctx.lineWidth = hc ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, scale * 0.36, 0.2, Math.PI * 1.5);
    ctx.stroke();
  }
  const fx = face.x;
  const fy = face.y;
  const px = -fy;
  const py = fx;
  ctx.fillStyle = player.committed ? "#cfc6ba" : "#f4f1ea";
  ctx.strokeStyle = "#101113";
  ctx.lineWidth = Math.max(2.5, scale * 0.055);
  ctx.beginPath();
  ctx.moveTo(fx * scale * 0.4, fy * scale * 0.4);
  ctx.lineTo(px * scale * 0.22 - fx * scale * 0.04, py * scale * 0.22 - fy * scale * 0.04);
  ctx.lineTo(-fx * scale * 0.26, -fy * scale * 0.26);
  ctx.lineTo(-px * scale * 0.22 - fx * scale * 0.04, -py * scale * 0.22 - fy * scale * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#101113";
  ctx.beginPath();
  ctx.arc(fx * scale * 0.1, fy * scale * 0.1, scale * (hc ? 0.09 : 0.07), 0, Math.PI * 2);
  ctx.fill();
  if (player.alive === false) {
    ctx.strokeStyle = "#c46a5a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-scale * 0.12, -scale * 0.12);
    ctx.lineTo(scale * 0.12, scale * 0.12);
    ctx.moveTo(scale * 0.12, -scale * 0.12);
    ctx.lineTo(-scale * 0.12, scale * 0.12);
    ctx.stroke();
  }
  ctx.restore();
  if (swing > 0) {
    const angle = Math.atan2(fy, fx);
    ctx.strokeStyle = `rgba(231,226,216,${Math.min(1, swing / 0.14)})`;
    ctx.lineWidth = hc ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.48, angle - 1, angle + 1);
    ctx.stroke();
  }
}

function paintFx(ctx, memory, scale, calm) {
  for (const particle of memory.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.max);
    ctx.fillStyle = particle.color;
    const s = Math.max(2, particle.size * scale);
    ctx.fillRect(particle.x * scale - s / 2, particle.y * scale - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = `600 ${Math.max(12, scale * 0.28)}px Outfit, sans-serif`;
  for (const item of memory.floats) {
    ctx.globalAlpha = calm ? 1 : Math.max(0, item.life / item.max);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x * scale, item.y * scale);
  }
  ctx.globalAlpha = 1;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
