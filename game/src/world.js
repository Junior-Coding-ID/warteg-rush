// Warteg Rush — world.js: kitchen layout and station definitions.
// One file, one job: where everything sits in the 1280x720 kitchen.
export const STATIONS = [
  // Ingredient bins along the left wall (x 40..150).
  { id: 'bin-nasi', kind: 'bin', item: 'nasi', label: 'NASI', x: 44, y: 210, w: 104, h: 64 },
  { id: 'bin-ayam', kind: 'bin', item: 'ayam', label: 'AYAM', x: 44, y: 284, w: 104, h: 64 },
  { id: 'bin-telur', kind: 'bin', item: 'telur', label: 'TELUR', x: 44, y: 358, w: 104, h: 64 },
  { id: 'bin-sayur', kind: 'bin', item: 'sayur', label: 'SAYUR', x: 44, y: 432, w: 104, h: 64 },
  { id: 'bin-mie', kind: 'bin', item: 'mie', label: 'MIE', x: 44, y: 506, w: 104, h: 64 },
  { id: 'bin-sambal', kind: 'bin', item: 'sambal', label: 'SAMBAL', x: 44, y: 580, w: 104, h: 64 },
  { id: 'bin-teh', kind: 'bin', item: 'teh', label: 'TEH', x: 168, y: 580, w: 104, h: 64 },
  { id: 'bin-es', kind: 'bin', item: 'es', label: 'ES', x: 292, y: 580, w: 104, h: 64 },
  // Processing stations along the top / right.
  { id: 'board', kind: 'board', label: 'TALENAN', sub: 'potong 2 dtk', x: 330, y: 210, w: 150, h: 84 },
  { id: 'wokA', kind: 'wok', label: 'WOK 1', sub: 'goreng 4 dtk', x: 510, y: 210, w: 150, h: 84 },
  { id: 'wokB', kind: 'wok', label: 'WOK 2', sub: 'goreng 4 dtk', x: 690, y: 210, w: 150, h: 84 },
  { id: 'cooker', kind: 'cooker', label: 'RICE COOKER', sub: 'nasi / teh 3 dtk', x: 870, y: 210, w: 170, h: 84 },
  // Plating table, serving window, trash.
  { id: 'plating', kind: 'plating', label: 'MEJA RAKIT', sub: 'rakit di piring', x: 500, y: 470, w: 260, h: 110 },
  { id: 'window', kind: 'window', label: 'JENDELA SAJIAN', sub: 'antar pesanan', x: 1060, y: 210, w: 180, h: 110 },
  { id: 'trash', kind: 'trash', label: 'TONG SAMPAH', sub: 'buang (Q)', x: 1060, y: 470, w: 180, h: 90 },
];

export function stationById(id) { return STATIONS.find((s) => s.id === id); }
export function stationCenter(s) { return { x: s.x + s.w / 2, y: s.y + s.h / 2 }; }
export function nearestStation(x, y, maxDist) {
  let best = null; let bestD = maxDist;
  for (const s of STATIONS) {
    const c = stationCenter(s);
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
export function stationAtPoint(x, y) {
  return STATIONS.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) || null;
}
export function chefStart() { return { x: 640, y: 400 }; }
