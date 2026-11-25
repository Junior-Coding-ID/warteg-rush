// Warteg Rush — input.js: keyboard and mouse input, nothing else.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    clickX: null, clickY: null, clickPending: false,
    interactPressed: false, trashPressed: false, restartPressed: false, mutePressed: false,
    startPressed: false,
  };
  const keyMap = { KeyE: 'interact', Space: 'interact', KeyQ: 'trash', KeyR: 'restart', KeyM: 'mute', Enter: 'start' };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    input.keys.add(e.code);
    const action = keyMap[e.code];
    if (action === 'interact') input.interactPressed = true;
    if (action === 'trash') input.trashPressed = true;
    if (action === 'restart') input.restartPressed = true;
    if (action === 'mute') input.mutePressed = true;
    if (action === 'start') input.startPressed = true;
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.clickY = ((e.clientY - r.top) / r.height) * canvas.height;
    input.clickPending = true;
  });
  return input;
}

export function moveVector(input) {
  let dx = 0; let dy = 0;
  const k = input.keys;
  if (k.has('KeyA') || k.has('ArrowLeft')) dx -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) dx += 1;
  if (k.has('KeyW') || k.has('ArrowUp')) dy -= 1;
  if (k.has('KeyS') || k.has('ArrowDown')) dy += 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
  return { dx, dy };
}

export function consumePresses(input) {
  const out = {
    interact: input.interactPressed, trash: input.trashPressed,
    restart: input.restartPressed, mute: input.mutePressed, start: input.startPressed,
  };
  input.interactPressed = false; input.trashPressed = false;
  input.restartPressed = false; input.mutePressed = false; input.startPressed = false;
  return out;
}
