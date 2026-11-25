// Warteg Rush — config.js: recipes, tuning and ingredient catalogue.
// One file, one job: every number the game balances lives here.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const SHIFT_SECONDS = 180;
export const LEVEL_SECONDS = 60;

export const INGREDIENTS = {
  nasi:   { label: 'Nasi',   color: '#fff8e6', short: 'NS' },
  ayam:   { label: 'Ayam',   color: '#e8a34c', short: 'AY' },
  telur:  { label: 'Telur',  color: '#ffe9a8', short: 'TL' },
  sayur:  { label: 'Sayur',  color: '#7bc96f', short: 'SY' },
  mie:    { label: 'Mie',    color: '#f2c14e', short: 'MI' },
  sambal: { label: 'Sambal', color: '#d43d2a', short: 'SB' },
  teh:    { label: 'Teh',    color: '#a9713f', short: 'TH' },
  es:     { label: 'Es',     color: '#bfe8f5', short: 'ES' },
};

// Processed items produced by stations.
export const PROCESSED = {
  nasiMasak:  { label: 'Nasi Masak',  color: '#fff8e6', short: 'NM' },
  ayamPotong: { label: 'Ayam Potong', color: '#e8a34c', short: 'AP' },
  ayamGoreng: { label: 'Ayam Goreng', color: '#b5722a', short: 'AG' },
  telurGoreng:{ label: 'Telur Goreng',color: '#f7c948', short: 'TG' },
  sayurPotong:{ label: 'Sayur Potong',color: '#7bc96f', short: 'SP' },
  mieRebus:   { label: 'Mie Rebus',   color: '#f2c14e', short: 'MR' },
  sambalUlek: { label: 'Sambal Ulek', color: '#d43d2a', short: 'SU' },
  tehPanas:   { label: 'Teh Panas',   color: '#a9713f', short: 'TP' },
};

export function itemLabel(id) {
  if (INGREDIENTS[id]) return INGREDIENTS[id].label;
  if (PROCESSED[id]) return PROCESSED[id].label;
  if (id === 'gosong') return 'GOSONG';
  return id;
}
export function itemColor(id) {
  if (INGREDIENTS[id]) return INGREDIENTS[id].color;
  if (PROCESSED[id]) return PROCESSED[id].color;
  if (id === 'gosong') return '#2b2b2b';
  return '#cccccc';
}
export function itemShort(id) {
  if (INGREDIENTS[id]) return INGREDIENTS[id].short;
  if (PROCESSED[id]) return PROCESSED[id].short;
  if (id === 'gosong') return 'GS';
  return '??';
}

// What each station does: input -> output, seconds, station kind.
export const CHOP_MAP = { ayam: 'ayamPotong', sayur: 'sayurPotong', sambal: 'sambalUlek' };
export const WOK_MAP = { ayamPotong: 'ayamGoreng', telur: 'telurGoreng', mie: 'mieRebus' };
export const COOKER_MAP = { nasi: 'nasiMasak', teh: 'tehPanas' };
export const CHOP_SECONDS = 2.0;
export const WOK_SECONDS = 4.0;
export const COOKER_SECONDS = 3.0;
export const BURN_SECONDS = 7.0;

export const RECIPES = [
  { id: 'nasiGoreng', name: 'Nasi Goreng', price: 50, needs: ['nasiMasak', 'telurGoreng', 'ayamGoreng'], unlockLevel: 1, color: '#c96a1e' },
  { id: 'esTeh', name: 'Es Teh Manis', price: 35, needs: ['tehPanas', 'es'], unlockLevel: 1, color: '#a9713f' },
  { id: 'mieGoreng', name: 'Mie Goreng', price: 55, needs: ['mieRebus', 'sayurPotong', 'telurGoreng'], unlockLevel: 2, color: '#e0a030' },
  { id: 'sotoAyam', name: 'Soto Ayam', price: 60, needs: ['ayamGoreng', 'nasiMasak', 'sayurPotong'], unlockLevel: 3, color: '#d8b13c' },
  { id: 'ayamGeprek', name: 'Ayam Geprek', price: 65, needs: ['ayamGoreng', 'sambalUlek'], unlockLevel: 3, color: '#c0392b' },
];

export function recipeById(id) { return RECIPES.find((r) => r.id === id); }
export function unlockedRecipes(level) { return RECIPES.filter((r) => r.unlockLevel <= level); }

export const TUNING = {
  chefSpeed: 265,
  orderFirstDelay: 4,
  orderInterval: 13,
  orderIntervalMin: 8,
  patienceBase: 48,
  patienceMin: 30,
  maxOrders: 4,
  tipPerSecondLeft: 1,
  comboWindow: 12,
  comboMax: 4,
};
