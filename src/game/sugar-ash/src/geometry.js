// @ts-nocheck
export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function hypot(x, y) {
  return Math.hypot(x, y);
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function norm(x, y) {
  const l = Math.hypot(x, y);
  if (l < 1e-6) return { x: 0, y: 0 };
  return { x: x / l, y: y / l };
}

export function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

export function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

export function angOf(x, y) {
  return Math.atan2(y, x);
}

export function wrapPi(a) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

export function pointInRect(x, y, r) {
  return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function segSeg(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-8) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function segHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const x = rect.x;
  const y = rect.y;
  const r = rect.x + rect.w;
  const b = rect.y + rect.h;
  return (
    segSeg(x1, y1, x2, y2, x, y, r, y) ||
    segSeg(x1, y1, x2, y2, r, y, r, b) ||
    segSeg(x1, y1, x2, y2, r, b, x, b) ||
    segSeg(x1, y1, x2, y2, x, b, x, y)
  );
}

export function distPointSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = clamp(t, 0, 1);
  const x = x1 + t * dx;
  const y = y1 + t * dy;
  return { dist: Math.hypot(px - x, py - y), x, y, t };
}

export function circleHitsRect(x, y, rad, rect) {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < rad * rad;
}

export function rot(vx, vy, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: vx * c - vy * s, y: vx * s + vy * c };
}

/** First blocking kind along a segment: 'seal' | 'wall' | null. Seals win ties. */
export function lineBlocked(world, a, b) {
  let wall = false;
  for (const s of world.seals) {
    if (segHitsRect(a.x, a.y, b.x, b.y, s)) return "seal";
  }
  for (const w of world.walls) {
    if (segHitsRect(a.x, a.y, b.x, b.y, w)) wall = true;
  }
  for (const c of world.blockers) {
    const hit = distPointSeg(c.x, c.y, a.x, a.y, b.x, b.y);
    if (hit.dist < c.r) wall = true;
  }
  return wall ? "wall" : null;
}

export function blockedAt(world, x, y, rad) {
  const b = world.bounds;
  if (x - rad < b.x || y - rad < b.y || x + rad > b.x + b.w || y + rad > b.y + b.h) return true;
  for (const w of world.walls) if (circleHitsRect(x, y, rad, w)) return true;
  for (const s of world.seals) if (circleHitsRect(x, y, rad, s)) return true;
  for (const c of world.blockers) {
    if (Math.hypot(x - c.x, y - c.y) < rad + c.r) return true;
  }
  return false;
}

export function moveBody(world, actor, dx, dy) {
  const r = actor.r;
  const nx = actor.x + dx;
  const ny = actor.y + dy;
  if (!blockedAt(world, nx, ny, r)) {
    actor.x = nx;
    actor.y = ny;
    return;
  }
  if (!blockedAt(world, nx, actor.y, r)) {
    actor.x = nx;
    return;
  }
  if (!blockedAt(world, actor.x, ny, r)) {
    actor.y = ny;
  }
}
