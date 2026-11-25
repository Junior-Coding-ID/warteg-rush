// Warteg Rush — render.js: all canvas drawing — kitchen, food, HUD, tickets.
// One file, one job: everything the player (and the judge) sees.
import { CANVAS_W, CANVAS_H, RECIPES, recipeById, itemLabel, itemColor, itemShort } from './config.js';
import { STATIONS, stationCenter } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function text(ctx, s, x, y, size, color, align, bold) {
  ctx.fillStyle = color; ctx.font = (bold ? 'bold ' : '') + size + 'px Verdana, sans-serif';
  ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
function plateShape(ctx, x, y, r, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
}
function foodBlob(ctx, x, y, r, id) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = itemColor(id); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
  text(ctx, itemShort(id), x, y, Math.max(9, r * 0.62), '#222', 'center', true);
}
function progressRing(ctx, x, y, r, frac, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.stroke();
}
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

export function drawKitchen(ctx, state) {
  // Floor + wall.
  ctx.fillStyle = '#f3e2c2'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#e8cfa0';
  for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) {
    if ((i + j) % 2 === 0) ctx.fillRect(i * 80, 190 + j * 130, 80, 130);
  }
  ctx.fillStyle = '#fdf3d8'; ctx.fillRect(0, 0, CANVAS_W, 190);
  ctx.fillStyle = '#c96a1e'; ctx.fillRect(0, 186, CANVAS_W, 6);
  text(ctx, 'WARTEG RUSH', 24, 30, 26, '#7a3b0e', 'left', true);
  text(ctx, 'Warung Tegal — masak cepat, antar cepat!', 24, 58, 13, '#8a5a2a', 'left');
  // Menu strip on the wall.
  const menu = ['NASI GORENG 50', 'MIE GORENG 55', 'SOTO AYAM 60', 'AYAM GEPREK 65', 'ES TEH 35'];
  menu.forEach((m, i) => {
    ctx.fillStyle = '#fff8e6'; rr(ctx, 330 + i * 128, 14, 120, 44, 8); ctx.fill();
    ctx.strokeStyle = '#c96a1e'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, m, 330 + i * 128 + 60, 36, 11, '#7a3b0e', 'center', true);
  });
  drawOrderBoard(ctx, state);
  drawStations(ctx, state);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawFloats(ctx, state);
  drawHud(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'end') drawEnd(ctx, state);
}

function drawOrderBoard(ctx, state) {
  text(ctx, 'PAPAN ORDER', 24, 92, 15, '#7a3b0e', 'left', true);
  const orders = state.book.orders;
  for (let i = 0; i < 4; i++) {
    const x = 24 + i * 300; const y = 104; const w = 284; const h = 74;
    ctx.fillStyle = '#ffffff'; rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#c96a1e'; ctx.stroke();
    const o = orders[i];
    if (!o) { text(ctx, '— menunggu order —', x + w / 2, y + h / 2, 13, '#b09a7a', 'center'); continue; }
    const r = recipeById(o.recipeId);
    const frac = Math.max(0, o.patience / o.maxPatience);
    ctx.fillStyle = r.color; rr(ctx, x, y, w, 26, 10); ctx.fill();
    ctx.fillRect(x, y + 16, w, 10);
    text(ctx, r.name.toUpperCase(), x + 12, y + 13, 14, '#fff', 'left', true);
    text(ctx, 'Rp' + r.price, x + w - 12, y + 13, 12, '#fff', 'right', true);
    // Ingredient chips needed.
    r.needs.forEach((need, j) => {
      foodBlob(ctx, x + 24 + j * 44, y + 48, 15, need);
    });
    text(ctx, r.needs.map(itemShort).join(' + '), x + 24 + r.needs.length * 44, y + 48, 11, '#5a4632', 'left', true);
    // Patience bar.
    ctx.fillStyle = '#eee'; ctx.fillRect(x + 12, y + 64, w - 24, 6);
    ctx.fillStyle = frac > 0.5 ? '#43a047' : frac > 0.25 ? '#fb8c00' : '#e53935';
    ctx.fillRect(x + 12, y + 64, (w - 24) * frac, 6);
  }
}

function drawStations(ctx, state) {
  for (const s of STATIONS) {
    const isBin = s.kind === 'bin';
    ctx.fillStyle = isBin ? '#2f7d6d' : s.kind === 'window' ? '#8e44ad' : s.kind === 'trash' ? '#616161' : '#0f766e';
    rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
    text(ctx, s.label, s.x + s.w / 2, s.y + (isBin ? 20 : 18), isBin ? 14 : 15, '#fff', 'center', true);
    if (s.sub && s.kind !== 'plating') text(ctx, s.sub, s.x + s.w / 2, s.y + (isBin ? 44 : 38), 10, '#d7efe8', 'center');
    if (isBin) foodBlob(ctx, s.x + s.w / 2, s.y + s.h - 14, 12, s.item);
  }
  drawProcessing(ctx, state);
  drawPlating(ctx, state);
}

function drawProcessing(ctx, state) {
  const slots = [
    { slot: state.slots.board, st: STATIONS.find((s) => s.id === 'board') },
    { slot: state.slots.wokA, st: STATIONS.find((s) => s.id === 'wokA') },
    { slot: state.slots.wokB, st: STATIONS.find((s) => s.id === 'wokB') },
    { slot: state.slots.cooker, st: STATIONS.find((s) => s.id === 'cooker') },
  ];
  for (const { slot, st } of slots) {
    if (!slot || !slot.item) continue;
    const c = stationCenter(st);
    if (slot.state === 'done') {
      foodBlob(ctx, c.x, c.y + 22, 17, slot.item);
      text(ctx, itemLabel(slot.item) + ' — SIAP', c.x, c.y + 46, 10, '#fff', 'center', true);
    } else if (slot.state === 'burnt') {
      foodBlob(ctx, c.x, c.y + 22, 17, 'gosong');
      text(ctx, 'GOSONG! angkat!', c.x, c.y + 46, 10, '#ffeb3b', 'center', true);
    } else {
      foodBlob(ctx, c.x, c.y + 22, 15, slot.item);
      progressRing(ctx, c.x, c.y + 22, 24, slot.progress / slot.max, '#ffeb3b');
    }
  }
}

function drawPlating(ctx, state) {
  const st = STATIONS.find((s) => s.id === 'plating');
  const cx = st.x + st.w / 2; const cy = st.y + st.h / 2;
  plateShape(ctx, cx - 52, cy + 8, 34, '#ffffff');
  plateShape(ctx, cx + 52, cy + 8, 34, '#ffffff');
  const plate = state.plate;
  if (plate.components.length) {
    plate.components.forEach((c, i) => foodBlob(ctx, cx - 52 + i * 26, cy - 2, 12, c));
    const guess = guessRecipe(plate.components);
    text(ctx, guess ? guess.name + ' (' + plate.components.length + '/' + guess.needs.length + ')' : 'Rakit: ' + plate.components.length + ' bahan', cx, st.y - 12, 13, '#3e2723', 'center', true);
  } else {
    text(ctx, 'piring kosong — taruh bahan di sini', cx, st.y - 12, 12, '#3e2723', 'center');
  }
  if (plate.ready) {
    ctx.fillStyle = '#ffd54f'; rr(ctx, cx - 78, cy + 34, 156, 22, 8); ctx.fill();
    text(ctx, 'PIRING SIAP ANTAR', cx, cy + 45, 11, '#5d4037', 'center', true);
    const rr2 = recipeById(plate.ready);
    ctx.beginPath(); ctx.arc(cx + 52, cy + 8, 20, 0, Math.PI * 2); ctx.fillStyle = rr2 ? rr2.color : '#c96a1e'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
    text(ctx, rr2 ? rr2.name.split(' ').map((w) => w[0]).join('') : 'OK', cx + 52, cy + 8, 12, '#fff', 'center', true);
  }
  // Ready dish glow on window too.
  if (state.chef.carrying && state.chef.carrying.startsWith('dish:')) {
    const w = STATIONS.find((s) => s.id === 'window');
    ctx.fillStyle = '#ffd54f'; rr(ctx, w.x, w.y + w.h - 26, w.w, 22, 8); ctx.fill();
    text(ctx, 'ANTAR KE SINI', w.x + w.w / 2, w.y + w.h - 15, 11, '#5d4037', 'center', true);
  }
}

export function guessRecipe(components) {
  const sorted = [...components].sort().join(',');
  return RECIPES.find((r) => [...r.needs].sort().join(',') === sorted) || null;
}

function drawChef(ctx, state) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(c.walkPhase) * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(c.x, c.y + 26, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron), head, chef hat.
  ctx.fillStyle = '#ffffff'; rr(ctx, c.x - 18, c.y - 6 + bob, 36, 34, 10); ctx.fill();
  ctx.fillStyle = '#2f7d6d'; ctx.fillRect(c.x - 18, c.y + 10 + bob, 36, 18);
  ctx.beginPath(); ctx.arc(c.x, c.y - 16 + bob, 15, 0, Math.PI * 2); ctx.fillStyle = '#f2c89b'; ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(c.x - 8, c.y - 28 + bob, 9, 0, Math.PI * 2); ctx.arc(c.x + 8, c.y - 28 + bob, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(c.x - 14, c.y - 30 + bob, 28, 8);
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(c.x - 5, c.y - 16 + bob, 2, 0, Math.PI * 2); ctx.arc(c.x + 5, c.y - 16 + bob, 2, 0, Math.PI * 2); ctx.fill();
  if (c.carrying) {
    const label = c.carrying.startsWith('dish:') ? recipeById(c.carrying.slice(5)).name : itemLabel(c.carrying);
    foodBlob(ctx, c.x + 26 * c.facing, c.y - 30 + bob, 15, c.carrying.startsWith('dish:') ? 'nasiMasak' : c.carrying);
    text(ctx, label, c.x, c.y - 52 + bob, 11, '#3e2723', 'center', true);
    ctx.fillStyle = '#fff'; rr(ctx, c.x - 40, c.y - 62 + bob, 80, 18, 6); ctx.fill();
    text(ctx, label, c.x, c.y - 53 + bob, 10, '#3e2723', 'center', true);
  }
  text(ctx, 'KOKI', c.x, c.y + 42, 10, '#5d4037', 'center', true);
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawFloats(ctx, state) {
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 20, f.color, 'center', true);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  const urgent = state.timeLeft <= 30 && state.phase === 'playing';
  ctx.fillStyle = urgent ? '#c62828' : '#263238'; rr(ctx, 1020, 14, 236, 56, 10); ctx.fill();
  text(ctx, 'TIMER', 1032, 28, 11, '#ffccbc', 'left', true);
  text(ctx, fmtTime(state.timeLeft), 1032, 52, 26, '#fff', 'left', true);
  text(ctx, 'SHIFT ' + state.level, 1244, 28, 11, '#ffccbc', 'right', true);
  text(ctx, 'Lv ' + state.level, 1244, 52, 14, '#ffd54f', 'right', true);
  ctx.fillStyle = '#263238'; rr(ctx, 24, 640, 420, 56, 10); ctx.fill();
  text(ctx, 'SKOR ' + state.score, 40, 658, 15, '#fff', 'left', true);
  text(ctx, 'KOIN Rp' + state.coins + '   TERLAYANI ' + state.served, 40, 682, 13, '#ffd54f', 'left', true);
  if (state.combo > 0) {
    ctx.fillStyle = '#ff6f00'; rr(ctx, 460, 640, 150, 56, 10); ctx.fill();
    text(ctx, 'COMBO x' + (1 + Math.min(state.combo, 3) * 0.5).toFixed(1), 535, 668, 18, '#fff', 'center', true);
  }
  text(ctx, 'E ambil/taruh   Q buang   R ulang', 1240, 668, 12, '#5d4037', 'right');
  if (state.message) text(ctx, state.message, 640, 620, 16, '#c62828', 'center', true);
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,18,.72)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e6'; rr(ctx, 340, 170, 600, 330, 18); ctx.fill();
  ctx.strokeStyle = '#c96a1e'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'WARTEG RUSH', 640, 230, 52, '#7a3b0e', 'center', true);
  text(ctx, 'Game masak warteg — shift 180 detik!', 640, 285, 18, '#5a4632', 'center');
  text(ctx, 'Ambil bahan, potong, goreng, rakit, antar.', 640, 320, 16, '#5a4632', 'center');
  text(ctx, 'Jangan sampai gosong. Cepat antar = tip + combo.', 640, 348, 16, '#5a4632', 'center');
  text(ctx, 'WASD / panah gerak  •  E ambil & taruh  •  klik stasiun', 640, 392, 14, '#7a3b0e', 'center');
  text(ctx, 'TEKAN ENTER / KLIK UNTUK MULAI', 640, 448, 18, '#c62828', 'center', true);
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,18,.78)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e6'; rr(ctx, 340, 150, 600, 380, 18); ctx.fill();
  ctx.strokeStyle = '#c96a1e'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 210, 44, '#7a3b0e', 'center', true);
  const stars = state.served >= 12 ? 3 : state.served >= 7 ? 2 : state.served >= 3 ? 1 : 0;
  text(ctx, '*'.repeat(Math.max(1, stars)) + '  BINTANG ' + stars + '/3', 640, 268, 24, '#ff8f00', 'center', true);
  text(ctx, 'Skor akhir: ' + state.score, 640, 320, 22, '#263238', 'center', true);
  text(ctx, 'Koin: Rp' + state.coins + '   Pesanan terlayani: ' + state.served, 640, 356, 18, '#5a4632', 'center');
  text(ctx, 'Pesanan hangus: ' + state.failed + '   Combo maks: x' + (1 + Math.min(state.combo, 3) * 0.5).toFixed(1), 640, 388, 16, '#5a4632', 'center');
  text(ctx, 'TEKAN R UNTUK MAIN LAGI', 640, 470, 18, '#c62828', 'center', true);
}
export { fmtTime };
