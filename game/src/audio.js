// Warteg Rush — audio.js: tiny WebAudio synth, no audio files.
let ctx = null;
let muted = false;
export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }
function audioCtx() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, dur, type, vol, when) {
  if (muted) return;
  const ac = audioCtx(); if (!ac) return;
  try {
    const t = ac.currentTime + (when || 0);
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* audio is garnish, never fatal */ }
}
export function playChop() { tone(180, 0.08, 'square', 0.10); tone(120, 0.06, 'square', 0.08, 0.07); }
export function playSizzle() { tone(900, 0.25, 'sawtooth', 0.03); tone(1400, 0.2, 'sawtooth', 0.02, 0.05); }
export function playBell() { tone(880, 0.18, 'sine', 0.14); tone(1320, 0.3, 'sine', 0.12, 0.08); }
export function playPickup() { tone(520, 0.07, 'triangle', 0.10); }
export function playPlace() { tone(340, 0.09, 'triangle', 0.10); }
export function playError() { tone(160, 0.18, 'sawtooth', 0.09); }
export function playBurn() { tone(110, 0.3, 'sawtooth', 0.10); tone(90, 0.3, 'sawtooth', 0.09, 0.12); }
export function playSuccess() { tone(523, 0.12, 'sine', 0.13); tone(659, 0.12, 'sine', 0.13, 0.1); tone(784, 0.22, 'sine', 0.13, 0.2); }
export function playTick() { tone(1000, 0.05, 'square', 0.05); }
