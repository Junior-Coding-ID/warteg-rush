// Warteg Rush — chef.js: chef movement, carrying, particles, floating text.
// One file, one job: the solo cook and what he holds.
import { TUNING } from './config.js';
import { chefStart } from './world.js';

export function createChef() {
  const p = chefStart();
  return { x: p.x, y: p.y, tx: null, ty: null, carrying: null, facing: 1, moving: false, walkPhase: 0 };
}

export function chefCarryingLabel(chef) { return chef.carrying; }

export function updateChefPosition(chef, vx, vy, dt) {
  chef.moving = vx !== 0 || vy !== 0 || chef.tx !== null;
  if (vx !== 0 || vy !== 0) {
    chef.x += vx * TUNING.chefSpeed * dt;
    chef.y += vy * TUNING.chefSpeed * dt;
    if (vx !== 0) chef.facing = vx > 0 ? 1 : -1;
    chef.tx = null; chef.ty = null;
  } else if (chef.tx !== null && chef.ty !== null) {
    const dx = chef.tx - chef.x; const dy = chef.ty - chef.y;
    const d = Math.hypot(dx, dy);
    const step = TUNING.chefSpeed * dt;
    if (d <= step + 4) { chef.x = chef.tx; chef.y = chef.ty; chef.tx = null; chef.ty = null; }
    else { chef.x += (dx / d) * step; chef.y += (dy / d) * step; if (dx !== 0) chef.facing = dx > 0 ? 1 : -1; }
  }
  chef.x = Math.max(170, Math.min(1250, chef.x));
  chef.y = Math.max(320, Math.min(690, chef.y));
  if (chef.moving) chef.walkPhase += dt * 10;
}

export function setClickTarget(chef, x, y) { chef.tx = Math.max(170, Math.min(1250, x)); chef.ty = Math.max(320, Math.min(690, y)); }

export function spawnParticles(list, x, y, color, n) {
  for (let i = 0; i < (n || 10); i++) {
    list.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 140 - 20, life: 0.6 + Math.random() * 0.4, max: 1, color, r: 2 + Math.random() * 3 });
  }
}

export function spawnFloat(list, x, y, text, color) {
  list.push({ x, y, text, color: color || '#2e7d32', life: 1.4, max: 1.4 });
}

export function updateParticles(list, dt) {
  for (const p of list) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; }
  return list.filter((p) => p.life > 0);
}

export function updateFloats(list, dt) {
  for (const f of list) { f.y -= 42 * dt; f.life -= dt; }
  return list.filter((f) => f.life > 0);
}
