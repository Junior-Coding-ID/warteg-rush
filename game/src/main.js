// Warteg Rush — main.js: boot, game loop, interaction rules, state.
// One file, one job: wire input, orders, stations and rendering together.
import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, CHOP_MAP, WOK_MAP, COOKER_MAP, CHOP_SECONDS, WOK_SECONDS, COOKER_SECONDS, BURN_SECONDS, recipeById } from './config.js';
import { createInput, moveVector, consumePresses } from './input.js';
import { createOrderBook, updateOrders, serveOrder, levelForElapsed, mulberry32 } from './orders.js';
import { createChef, updateChefPosition, setClickTarget, spawnParticles, spawnFloat, updateParticles, updateFloats } from './chef.js';
import { drawKitchen, guessRecipe } from './render.js';
import { nearestStation, stationAtPoint, stationCenter } from './world.js';
import { playChop, playSizzle, playBell, playPickup, playPlace, playError, playBurn, playSuccess, toggleMute } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function createState() {
  return {
    phase: 'title', timeLeft: SHIFT_SECONDS, elapsed: 0, level: 1,
    score: 0, coins: 0, combo: 0, comboTimer: 0, served: 0, failed: 0,
    chef: createChef(), book: createOrderBook(),
    slots: {
      board: { item: null, progress: 0, max: CHOP_SECONDS, state: 'idle' },
      wokA: { item: null, progress: 0, max: WOK_SECONDS, state: 'idle' },
      wokB: { item: null, progress: 0, max: WOK_SECONDS, state: 'idle' },
      cooker: { item: null, progress: 0, max: COOKER_SECONDS, state: 'idle' },
    },
    plate: { components: [], recipeId: null, ready: null },
    particles: [], floats: [], message: '', messageTimer: 0,
    rng: mulberry32((Date.now() % 2147483647) || 7),
    lastTickSecond: -1,
  };
}

let state = createState();
const input = createInput(canvas);
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) applyShot(state, shot);

function say(msg) { state.message = msg; state.messageTimer = 2.5; }

function slotFor(stationId) {
  if (stationId === 'board') return state.slots.board;
  if (stationId === 'wokA') return state.slots.wokA;
  if (stationId === 'wokB') return state.slots.wokB;
  if (stationId === 'cooker') return state.slots.cooker;
  return null;
}
function processMap(stationId) {
  if (stationId === 'board') return CHOP_MAP;
  if (stationId === 'wokA' || stationId === 'wokB') return WOK_MAP;
  if (stationId === 'cooker') return COOKER_MAP;
  return null;
}

export function interactAt(station) {
  const chef = state.chef;
  if (!station) { say('Dekati stasiun dulu!'); return; }
  const c = stationCenter(station);
  if (station.kind === 'bin') {
    if (chef.carrying) { say('Tangan penuh — taruh dulu!'); playError(); return; }
    chef.carrying = station.item; playPickup();
    spawnParticles(state.particles, c.x, c.y, '#ffd54f', 6);
    return;
  }
  if (station.kind === 'trash') {
    if (!chef.carrying) { say('Tidak ada yang dibuang.'); return; }
    chef.carrying = null; playPlace(); say('Dibuang.');
    return;
  }
  if (station.kind === 'window') {
    if (!chef.carrying || !chef.carrying.startsWith('dish:')) { say('Bawa piring siap antar ke sini!'); playError(); return; }
    const recipeId = chef.carrying.slice(5);
    const res = serveOrder(state.book, state, recipeId);
    if (!res) { say('Tidak ada order ' + recipeById(recipeId).name + ' — salah antar!'); playError(); state.combo = 0; chef.carrying = null; return; }
    chef.carrying = null; playBell(); playSuccess();
    spawnFloat(state.floats, c.x, c.y - 20, '+' + res.earned, '#2e7d32');
    spawnParticles(state.particles, c.x, c.y, '#ffd54f', 14);
    say(res.name + ' terantar! +' + res.earned + (res.mult > 1 ? ' (combo x' + res.mult.toFixed(1) + ')' : ''));
    return;
  }
  if (station.kind === 'plating') {
    if (state.plate.ready && !chef.carrying) {
      chef.carrying = 'dish:' + state.plate.ready; state.plate = { components: [], recipeId: null, ready: null };
      playPickup(); say('Piring siap — antar ke jendela!'); return;
    }
    if (!chef.carrying) { say('Bawa bahan olahan ke meja rakit.'); return; }
    if (chef.carrying.startsWith('dish:')) { say('Piring jadi jangan dirakit lagi.'); return; }
    const comp = chef.carrying;
    if (state.plate.components.includes(comp)) { say('Bahan itu sudah ada di piring.'); playError(); return; }
    state.plate.components.push(comp); chef.carrying = null; playPlace();
    spawnParticles(state.particles, c.x, c.y, '#fff', 8);
    const guess = guessRecipe(state.plate.components);
    if (guess) { state.plate.ready = guess.id; state.plate.recipeId = guess.id; playSuccess(); say(guess.name + ' jadi! Ambil piringnya.'); }
    else say('Ditaruh di piring (' + state.plate.components.length + ' bahan).');
    return;
  }
  // Processing stations: board / wokA / wokB / cooker.
  const slot = slotFor(station.id);
  const map = processMap(station.id);
  if (!slot || !map) return;
  if (slot.state === 'done' || slot.state === 'burnt') {
    if (chef.carrying) { say('Tangan penuh — ambil setelah taruh dulu.'); playError(); return; }
    if (slot.state === 'burnt') { chef.carrying = 'gosong'; playBurn(); say('Gosong! Buang ke tong sampah.'); }
    else { chef.carrying = slot.item; playPickup(); }
    slot.item = null; slot.progress = 0; slot.state = 'idle';
    return;
  }
  if (slot.state === 'working') { say('Masih diproses — tunggu sebentar.'); return; }
  if (!chef.carrying) { say('Bawa bahan ke sini dulu.'); return; }
  const out = map[chef.carrying];
  if (!out) { say('Bahan ini tidak diproses di sini.'); playError(); return; }
  slot.item = out; slot.progress = 0;
  slot.max = station.id === 'board' ? CHOP_SECONDS : station.id === 'cooker' ? COOKER_SECONDS : WOK_SECONDS;
  slot.state = 'working'; slot.raw = chef.carrying; chef.carrying = null;
  if (station.id === 'board') playChop(); else playSizzle();
  spawnParticles(state.particles, c.x, c.y, '#ffcc80', 8);
}

function updateProcessing(dt) {
  for (const key of ['board', 'wokA', 'wokB', 'cooker']) {
    const slot = state.slots[key];
    if (slot.state === 'working') {
      slot.progress += dt;
      if (slot.progress >= slot.max) {
        slot.progress = slot.max; slot.state = 'done'; slot.burnTimer = 0;
        if (key !== 'board') playBell();
      }
    } else if (slot.state === 'done' && (key === 'wokA' || key === 'wokB')) {
      slot.burnTimer = (slot.burnTimer || 0) + dt;
      if (slot.burnTimer >= BURN_SECONDS) { slot.state = 'burnt'; playBurn(); say('Ada yang gosong di wok!'); }
    }
  }
}

function update(dt) {
  const presses = consumePresses(input);
  if (presses.mute) toggleMute();
  if (presses.restart || (state.phase === 'end' && presses.start)) { state = createState(); state.phase = 'playing'; return; }
  if (state.phase === 'title') {
    if (presses.start || input.clickPending) { state.phase = 'playing'; input.clickPending = false; }
    return;
  }
  if (state.phase === 'end') return;
  // Playing.
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  state.level = levelForElapsed(state.elapsed);
  if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0; }
  if (state.messageTimer > 0) { state.messageTimer -= dt; if (state.messageTimer <= 0) state.message = ''; }
  const sec = Math.ceil(state.timeLeft);
  if (state.timeLeft <= 10 && sec !== state.lastTickSecond && state.timeLeft > 0) { state.lastTickSecond = sec; playTick(); }
  updateOrders(state.book, state, dt, state.rng);
  updateProcessing(dt);
  state.particles = updateParticles(state.particles, dt);
  state.floats = updateFloats(state.floats, dt);
  if (input.clickPending) {
    input.clickPending = false;
    const st = stationAtPoint(input.clickX, input.clickY);
    if (st) {
      const c = stationCenter(st);
      setClickTarget(state.chef, c.x, c.y + 110);
      state.pendingStation = st;
    } else {
      setClickTarget(state.chef, input.clickX, input.clickY);
      state.pendingStation = null;
    }
  }
  const mv = moveVector(input);
  updateChefPosition(state.chef, mv.dx, mv.dy, dt);
  if (state.pendingStation) {
    const pc = stationCenter(state.pendingStation);
    const near = Math.hypot(state.chef.x - pc.x, state.chef.y - pc.y) < 150;
    if (state.chef.tx === null || near) {
      const st = state.pendingStation; state.pendingStation = null;
      interactAt(st);
    }
  }
  if (presses.interact) {
    const st = nearestStation(state.chef.x, state.chef.y, 175);
    interactAt(st);
  }
  if (presses.trash && state.chef.carrying) { state.chef.carrying = null; playPlace(); say('Dibuang.'); }
  if (state.timeLeft <= 0) { state.phase = 'end'; playSuccess(); }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) update(dt);
  else {
    // Staged shots stay frozen except gentle particle drift.
    state.particles = updateParticles(state.particles, dt);
    state.floats = updateFloats(state.floats, dt);
  }
  drawKitchen(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
