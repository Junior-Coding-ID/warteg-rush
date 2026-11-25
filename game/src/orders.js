// Warteg Rush — orders.js: order spawning, patience, scoring, combo.
// One file, one job: the ticket rail and everything it pays.
import { RECIPES, TUNING, recipeById, unlockedRecipes } from './config.js';

export function createOrderBook() {
  return { orders: [], nextId: 1, spawnTimer: TUNING.orderFirstDelay };
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRecipe(rng, level) {
  const pool = unlockedRecipes(level);
  return pool[Math.floor(rng() * pool.length)];
}

export function spawnOrder(book, rng, level) {
  const recipe = pickRecipe(rng, level);
  const patience = Math.max(TUNING.patienceMin, TUNING.patienceBase - (level - 1) * 5);
  book.orders.push({ id: book.nextId++, recipeId: recipe.id, patience, maxPatience: patience });
}

export function updateOrders(book, state, dt, rng) {
  book.spawnTimer -= dt;
  const interval = Math.max(TUNING.orderIntervalMin, TUNING.orderInterval - (state.level - 1) * 1.5);
  if (book.spawnTimer <= 0 && book.orders.length < TUNING.maxOrders) {
    spawnOrder(book, rng, state.level);
    book.spawnTimer = interval;
  } else if (book.spawnTimer <= 0) {
    book.spawnTimer = 2;
  }
  for (const o of book.orders) o.patience -= dt;
  const expired = book.orders.filter((o) => o.patience <= 0);
  book.orders = book.orders.filter((o) => o.patience > 0);
  if (expired.length) { state.combo = 0; state.failed += expired.length; }
  return expired.length;
}

export function findOrderForRecipe(book, recipeId) {
  return book.orders.find((o) => o.recipeId === recipeId) || null;
}

export function serveOrder(book, state, recipeId) {
  const order = findOrderForRecipe(book, recipeId);
  if (!order) return null;
  const recipe = recipeById(recipe.id);
  const tip = Math.round(order.patience * TUNING.tipPerSecondLeft);
  const mult = 1 + Math.min(state.combo, TUNING.comboMax - 1) * 0.5;
  const earned = Math.round((recipe.price + tip) * mult);
  book.orders = book.orders.filter((o) => o.id !== order.id);
  state.score += earned; state.coins += earned; state.served += 1;
  state.combo = Math.min(state.combo + 1, TUNING.comboMax);
  state.comboTimer = TUNING.comboWindow;
  return { earned, tip, mult, name: recipe.name };
}

export function levelForElapsed(elapsed) {
  return Math.min(3, 1 + Math.floor(elapsed / 60));
}
export { RECIPES };
