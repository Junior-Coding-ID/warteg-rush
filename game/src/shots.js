// Warteg Rush — shots.js: deterministic screenshot staging via ?shot=.
// One file, one job: put the game in a photogenic state for each shot name.
import { mulberry32, spawnOrder } from './orders.js';
import { recipeById } from './config.js';

export function shotNames() { return ['start', 'mid', 'rush', 'end']; }

export function applyShot(state, name) {
  const rng = mulberry32(name === 'mid' ? 101 : name === 'rush' ? 202 : name === 'end' ? 303 : 404);
  state.phase = name === 'start' ? 'title' : name === 'end' ? 'end' : 'playing';
  state.timeLeft = name === 'mid' ? 132 : name === 'rush' ? 28 : name === 'end' ? 0 : 180;
  state.elapsed = name === 'mid' ? 48 : name === 'rush' ? 152 : name === 'end' ? 180 : 0;
  state.level = name === 'rush' || name === 'end' ? 3 : name === 'mid' ? 1 : 1;
  state.score = name === 'mid' ? 420 : name === 'rush' ? 1890 : name === 'end' ? 2140 : 0;
  state.coins = state.score;
  state.served = name === 'mid' ? 6 : name === 'rush' ? 21 : name === 'end' ? 24 : 0;
  state.failed = name === 'end' ? 2 : name === 'rush' ? 2 : 0;
  state.combo = name === 'mid' ? 2 : name === 'rush' ? 4 : name === 'end' ? 3 : 0;
  state.comboTimer = 8;
  state.book.orders = [];
  state.book.nextId = 1;
  const want = name === 'start' ? 1 : name === 'mid' ? 3 : 4;
  const picks = name === 'mid' ? ['nasiGoreng', 'mieGoreng', 'esTeh'] : name === 'rush' ? ['nasiGoreng', 'sotoAyam', 'ayamGeprek', 'mieGoreng'] : name === 'end' ? ['sotoAyam', 'ayamGeprek'] : ['nasiGoreng'];
  for (let i = 0; i < want; i++) {
    const recipe = recipeById(picks[i % picks.length]);
    const patience = name === 'rush' ? 12 + i * 6 : 34 - i * 6;
    state.book.orders.push({ id: state.book.nextId++, recipeId: recipe.id, patience, maxPatience: 48 });
  }
  // Busy kitchen: a wok cooking, the board chopping, the cooker running.
  state.slots.board = name === 'start' ? { item: null, progress: 0, max: 2, state: 'idle' } : { item: 'ayam', progress: 1.2, max: 2, state: 'working' };
  state.slots.wokA = name === 'start' ? { item: null, progress: 0, max: 4, state: 'idle' } : { item: 'telur', progress: 2.6, max: 4, state: 'working' };
  state.slots.wokB = name === 'rush' ? { item: 'ayamPotong', progress: 3.4, max: 4, state: 'working' } : { item: null, progress: 0, max: 4, state: 'idle' };
  state.slots.cooker = name === 'start' ? { item: null, progress: 0, max: 3, state: 'idle' } : { item: 'nasi', progress: 1.8, max: 3, state: 'working' };
  // Mid-assembly plate + one ready plate (the cover must show both).
  if (name === 'mid' || name === 'rush') {
    state.plate = { components: ['nasiMasak', 'telurGoreng'], recipeId: 'nasiGoreng', ready: 'nasiGoreng' };
    state.chef.carrying = 'ayamGoreng';
    state.chef.x = 830; state.chef.y = 430;
  } else if (name === 'end') {
    state.plate = { components: ['nasiMasak', 'telurGoreng', 'ayamGoreng'], recipeId: 'nasiGoreng', ready: 'nasiGoreng' };
    state.chef.carrying = null;
  } else {
    state.plate = { components: [], recipeId: null, ready: null };
    state.chef.carrying = null;
    state.chef.x = 640; state.chef.y = 400;
  }
  state.particles = [];
  state.floats = (name === 'mid' || name === 'rush') ? [{ x: 900, y: 380, text: '+50', color: '#2e7d32', life: 1.2, max: 1.4 }] : [];
  state.message = '';
  return state;
}
export { spawnOrder };
