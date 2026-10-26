import { GEAR_BY_ID } from "./data/gear.ts";
import { LOCATIONS, LOCATIONS_BY_ID } from "./data/locations.ts";
import { PRESENCE_NOTE, SPECIES_BY_ID } from "./data/species.ts";
import type { CreekPilot } from "./bridge.ts";
import { currentBeat } from "./sim/bite.ts";
import { SNES_H, SNES_W } from "../snes.ts";

const INK = "#1a140c";
const PAPER = "#e7d7b8";
const GOLD = "#e8c36a";
const WATER = "#1a4a5c";
const DEEP = "#0e2c38";
const FOAM = "#d5ebe4";

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line = 9) {
  const words = text.split(" ");
  let row = "";
  let yy = y;
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > max && row) {
      ctx.fillText(row, x, yy);
      row = word;
      yy += line;
    } else row = next;
  }
  if (row) ctx.fillText(row, x, yy);
  return yy;
}

function sky(hour: number): [string, string] {
  if (hour >= 5 && hour < 8) return ["#c47a4a", "#7aa0c4"];
  if (hour >= 8 && hour < 17) return ["#7eb0d8", "#d7e6c8"];
  if (hour >= 17 && hour < 20) return ["#c45a3a", "#3a3058"];
  return ["#14182c", "#2a3350"];
}

export function paintCreek(ctx: CanvasRenderingContext2D, pilot: CreekPilot, t: number) {
  const session = pilot.session();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, SNES_W, SNES_H);
  if (!session) {
    ctx.fillStyle = PAPER;
    ctx.font = "8px monospace";
    ctx.fillText("The creek is quiet.", 8, 20);
    return;
  }

  const [top, mid] = sky(session.hour);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 78);
  skyGrad.addColorStop(0, top);
  skyGrad.addColorStop(1, mid);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, SNES_W, 78);
  if (session.hour >= 20 || session.hour < 5) {
    ctx.fillStyle = PAPER;
    for (let i = 0; i < 18; i++) ctx.fillRect((i * 47) % SNES_W, 6 + ((i * 13) % 48), 1, 1);
  } else {
    ctx.fillStyle = session.hour >= 17 ? "#f0d2a0" : "#f4e2a0";
    ctx.beginPath();
    ctx.arc(session.hour >= 17 ? 40 : 250, 18, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#3d5a34";
  ctx.fillRect(0, 62, SNES_W, 16);
  ctx.fillStyle = "#2a4630";
  ctx.fillRect(0, 70, 90, 10);
  ctx.fillRect(200, 66, 120, 12);

  const water = ctx.createLinearGradient(0, 78, 0, 188);
  water.addColorStop(0, WATER);
  water.addColorStop(1, DEEP);
  ctx.fillStyle = water;
  ctx.fillRect(0, 78, SNES_W, 110);

  const loc = LOCATIONS_BY_ID[session.locationId];
  if (loc) {
    for (const spot of loc.spots) {
      const x = Math.round(spot.x * SNES_W);
      const y = Math.round(78 + spot.y * 90);
      ctx.strokeStyle = spot.sweet ? GOLD : "rgba(213,235,228,0.45)";
      ctx.strokeRect(x - 6, y - 3, 12, 6);
    }
    if (loc.conditions.cover === "wood" || loc.conditions.cover === "shade") {
      ctx.fillStyle = "#3a2a18";
      ctx.fillRect(18, 84, 4, 28);
      ctx.fillRect(14, 84, 16, 3);
    }
  }

  const bob = session.reducedMotion ? 0 : Math.sin(t * 2) * 1;
  const lureX = session.cast.phase === "settled" || session.cast.phase === "flight" ? session.cast.landX || session.aimX : session.aimX;
  const lureY = session.cast.phase === "settled" || session.cast.phase === "flight" ? session.cast.landY || session.aimY : session.aimY;
  const lx = Math.round((session.cast.phase === "flight" ? session.aimX : lureX) * SNES_W);
  const ly = Math.round(78 + (session.cast.phase === "flight" ? session.aimY : lureY) * 90 + bob);

  ctx.strokeStyle = "rgba(213,235,228,0.25)";
  ctx.beginPath();
  ctx.moveTo(0, 150 + bob);
  ctx.bezierCurveTo(80, 146, 200, 156, 320, 148);
  ctx.stroke();

  const anglerX = Math.round(session.anglerX * SNES_W);
  const anglerY = 196;
  ctx.fillStyle = "#6b4a2e";
  ctx.fillRect(0, 188, SNES_W, 52);
  ctx.fillStyle = "#8a6240";
  ctx.fillRect(0, 188, SNES_W, 4);

  const gear = GEAR_BY_ID[session.gearId];
  const hot = session.fight ? session.fight.tension / Math.max(0.2, gear?.ceiling ?? 0.5) > 0.82 : false;
  ctx.strokeStyle = hot ? "#c45c4a" : "#d9d0c0";
  ctx.beginPath();
  ctx.moveTo(anglerX, anglerY - 10);
  ctx.quadraticCurveTo((anglerX + lx) / 2, 120, lx, ly);
  ctx.stroke();

  ctx.fillStyle = "#c4b08a";
  ctx.fillRect(anglerX - 3, anglerY - 14, 6, 8);
  ctx.fillStyle = "#3d3428";
  ctx.fillRect(anglerX - 4, anglerY - 6, 8, 8);
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(anglerX + 2, anglerY - 16, 2, 12);

  if (session.phase === "charging") {
    ctx.fillStyle = GOLD;
    ctx.fillRect(anglerX - 10, anglerY - 22, Math.round(20 * session.cast.power), 2);
  }

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx - 1, ly - 1, 3, 3);

  if ((session.phase === "fight" || session.phase === "landed") && session.fight) {
    const species = SPECIES_BY_ID[session.fight.speciesId];
    const color = species?.color ?? GOLD;
    const wide = species?.id === "northern-pike" || species?.id === "chain-pickerel" ? 18 : 12;
    ctx.fillStyle = color;
    ctx.fillRect(lx - wide / 2, ly - 3, wide, 5);
    ctx.fillRect(lx + wide / 2 - 2, ly - 5, 4, 4);
    if (species?.id === "yellow-perch") {
      ctx.fillStyle = INK;
      ctx.fillRect(lx - 2, ly - 3, 1, 5);
      ctx.fillRect(lx + 2, ly - 3, 1, 5);
    }
    ctx.fillStyle = PAPER;
    ctx.font = "8px monospace";
    ctx.fillText((species?.commonName ?? "Fish").slice(0, 18), Math.min(SNES_W - 90, lx + 8), ly - 6);
  }

  if (session.phase === "bite" && session.bite) {
    const beat = currentBeat(session.bite);
    ctx.font = "8px monospace";
    let x = 8;
    for (const item of session.bite.beats) {
      ctx.fillStyle = item.commit ? "#c45c4a" : FOAM;
      ctx.fillRect(x, 96, 8, 4);
      x += 12;
    }
    if (beat?.commit) {
      ctx.fillStyle = GOLD;
      ctx.fillText("SET", lx - 8, ly - 8);
    }
  }

  if (session.fight && session.phase === "fight") {
    const ceiling = Math.max(0.2, gear?.ceiling ?? 0.5);
    ctx.fillStyle = INK;
    ctx.fillRect(8, 8, 84, 5);
    ctx.fillStyle = session.fight.tension > ceiling ? "#c45c4a" : GOLD;
    ctx.fillRect(8, 8, Math.max(0, Math.min(84, (session.fight.tension / 1.25) * 84)), 5);
    if (session.giveLatched) {
      ctx.fillStyle = FOAM;
      ctx.font = "8px monospace";
      ctx.fillText("EASE", 96, 13);
    }
  }

  ctx.fillStyle = PAPER;
  ctx.font = "8px monospace";
  const title = loc ? `${loc.name}` : "Water";
  ctx.fillText(title.slice(0, 28), 8, 206);
  ctx.fillStyle = GOLD;
  const outfit = gear?.name ?? "Outfit";
  const creel = session.save.creel.length;
  ctx.fillText(`${outfit.slice(0, 22)}  creel ${creel}/4`, 8, 216);
  ctx.fillStyle = PAPER;
  wrap(ctx, session.line, 8, 228, SNES_W - 16, 8);

  const panel = pilot.panel();
  if (!panel) return;
  ctx.fillStyle = "rgba(12,10,8,0.92)";
  ctx.fillRect(8, 24, SNES_W - 16, 168);
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(8, 24, SNES_W - 16, 168);
  ctx.fillStyle = GOLD;
  ctx.font = "8px monospace";
  if (panel === "waters") {
    ctx.fillText("WATERS  Q notes  E fish", 14, 36);
    const start = Math.max(0, Math.min(pilot.waterIndex() - 4, LOCATIONS.length - 8));
    for (let i = 0; i < 8; i++) {
      const locRow = LOCATIONS[start + i];
      if (!locRow) break;
      const on = start + i === pilot.waterIndex();
      ctx.fillStyle = on ? GOLD : PAPER;
      ctx.fillText(`${on ? ">" : " "}${locRow.name}`.slice(0, 36), 14, 50 + i * 12);
    }
    return;
  }
  ctx.fillText("NOTES  Q waters  E close", 14, 36);
  const rows = Object.values(session.save.journal);
  const page = pilot.page();
  const slice = rows.slice(page * 4, page * 4 + 4);
  if (!slice.length) {
    ctx.fillStyle = PAPER;
    wrap(ctx, "Nothing written yet. The fish are still in the water.", 14, 52, SNES_W - 36);
  } else {
    slice.forEach((entry, i) => {
      const species = SPECIES_BY_ID[entry.speciesId];
      ctx.fillStyle = PAPER;
      ctx.fillText(`${species?.commonName ?? entry.speciesId}  ${entry.stage}/4`.slice(0, 36), 14, 50 + i * 22);
      ctx.fillStyle = "#c4b08a";
      const learn = species?.learn[Math.max(0, entry.stage - 1)] ?? "";
      ctx.fillText(learn.slice(0, 40), 14, 60 + i * 22);
    });
  }
  ctx.fillStyle = "#8a7a62";
  ctx.fillText(PRESENCE_NOTE.slice(0, 42), 14, 182);
}
