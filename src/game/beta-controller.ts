import type { RunnerControls, Snapshot } from './runner-scene';

const host = document.querySelector<HTMLElement>('#runner-canvas')!;
const surface = document.querySelector<HTMLElement>('#play-surface')!;
const overlay = document.querySelector<HTMLElement>('#game-overlay')!;
const primary = document.querySelector<HTMLButtonElement>('#game-primary')!;
const pause = document.querySelector<HTMLButtonElement>('#game-pause')!;
const jump = document.querySelector<HTMLButtonElement>('#game-jump')!;
const duck = document.querySelector<HTMLButtonElement>('#game-duck')!;
const fullscreen = document.querySelector<HTMLButtonElement>('#game-fullscreen')!;
const title = document.querySelector<HTMLElement>('#overlay-title')!;
const message = document.querySelector<HTMLElement>('#overlay-description')!;
const results = document.querySelector<HTMLElement>('#run-results')!;
const announce = document.querySelector<HTMLElement>('#game-announcement')!;
const status = document.querySelector<HTMLElement>('#run-state')!;
const bestDisplay = document.querySelector<HTMLElement>('#game-best')!;
const storageKey = 'ganadazo_beta_best_v1';
let controls: RunnerControls | undefined;
let lastState = 'loading';
let current: Snapshot = { state: 'ready', score: 0, coins: 0, level: 1, seconds: 0 };
let failed = false;
let best = 0;
try { const saved = Number(localStorage.getItem(storageKey)); best = Number.isFinite(saved) ? Math.max(0, Math.min(9999999, Math.floor(saved))) : 0; } catch { /* Storage may be unavailable in private browsers. */ }
bestDisplay.textContent = String(best).padStart(4, '0');

function show(snapshot: Snapshot) {
  current = snapshot;
  document.querySelector('#game-score')!.textContent = String(snapshot.score).padStart(4, '0');
  document.querySelector('#game-coins')!.textContent = String(snapshot.coins).padStart(2, '0');
  document.querySelector('#game-level')!.textContent = `NIVEL ${snapshot.level}`;
  if (snapshot.state === lastState) return;
  lastState = snapshot.state;
  surface.dataset.state = snapshot.state;
  const playing = snapshot.state === 'running';
  overlay.hidden = playing;
  jump.disabled = duck.disabled = !playing;
  pause.disabled = !playing && snapshot.state !== 'paused';
  pause.setAttribute('aria-label', snapshot.state === 'paused' ? 'Continuar partida' : 'Pausar partida');
  pause.textContent = snapshot.state === 'paused' ? '▶' : 'Ⅱ';
  results.hidden = snapshot.state !== 'over';
  if (snapshot.state === 'ready') {
    title.textContent = 'Un pequeño salto. Un gran comienzo.';
    message.textContent = 'Esquiva obstáculos, recoge monedas y supera tu mejor marca.';
    primary.textContent = 'Empezar a practicar →';
    status.textContent = 'LISTO PARA CORRER';
  } else if (snapshot.state === 'running') {
    status.textContent = 'EN CARRERA';
    announce.textContent = 'Partida iniciada. Usa espacio para saltar y flecha abajo para agacharte. P para pausar.';
  } else if (snapshot.state === 'paused') {
    title.textContent = 'Respira. Tu partida te espera.';
    message.textContent = 'La carrera está en pausa. Continúa cuando estés listo.';
    primary.textContent = 'Continuar partida →';
    status.textContent = 'EN PAUSA';
    announce.textContent = 'Partida pausada.';
    primary.focus({ preventScroll: true });
  } else {
    const record = snapshot.score > best;
    if (record) {
      best = snapshot.score;
      bestDisplay.textContent = String(best).padStart(4, '0');
      try { localStorage.setItem(storageKey, String(best)); } catch { /* Gameplay continues without persistence. */ }
    }
    title.textContent = record ? '¡Tu nuevo récord, ganadazo!' : 'Cada intento te lleva más lejos.';
    message.textContent = 'Una partida más. Una nueva oportunidad de superarte.';
    document.querySelector('#result-score')!.textContent = String(snapshot.score);
    document.querySelector('#result-coins')!.textContent = String(snapshot.coins);
    document.querySelector('#result-time')!.textContent = `${snapshot.seconds}s`;
    primary.textContent = 'Volver a intentarlo ↻';
    status.textContent = 'BUENA CARRERA';
    announce.textContent = `Fin de la partida. ${snapshot.score} puntos, ${snapshot.coins} monedas. Tu récord es ${best}.`;
    primary.focus({ preventScroll: true });
  }
}

primary.addEventListener('click', () => {
  if (failed) { location.reload(); return; }
  if (!controls) return;
  if (current.state === 'paused') controls.resume(); else controls.start();
  surface.focus({ preventScroll: true });
});
pause.addEventListener('click', () => {
  if (current.state === 'paused') { controls?.resume(); surface.focus({ preventScroll: true }); }
  else controls?.pause();
});

function bindControl(button: HTMLButtonElement, down: () => void, up = () => {}) {
  button.addEventListener('pointerdown', event => {
    if (button.disabled) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    button.classList.add('is-held');
    down();
  });
  const release = () => { button.classList.remove('is-held'); up(); };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  // Native keyboard button activation has detail 0 and no pointerdown.
  button.addEventListener('click', event => { if (event.detail === 0 && !button.disabled) { down(); up(); } });
}
bindControl(jump, () => controls?.jump());
bindControl(duck, () => controls?.duck(true), () => controls?.duck(false));
host.addEventListener('pointerdown', event => { if (current.state === 'running' && event.isPrimary) { event.preventDefault(); controls?.jump(); } });

document.addEventListener('keydown', event => {
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (current.state === 'running') { event.preventDefault(); controls?.pause(); }
    else if (current.state === 'paused' && event.code === 'KeyP') { controls?.resume(); surface.focus({ preventScroll: true }); }
    return;
  }
  if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
  if (current.state !== 'running') return;
  if (['Space', 'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(event.code)) event.preventDefault();
  if (event.repeat) return;
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) controls?.jump();
  if (['ArrowDown', 'KeyS'].includes(event.code)) { controls?.duck(true); duck.classList.add('is-held'); }
});
document.addEventListener('keyup', event => {
  if (['ArrowDown', 'KeyS'].includes(event.code)) { controls?.duck(false); duck.classList.remove('is-held'); }
});
function autoPause() { jump.classList.remove('is-held'); duck.classList.remove('is-held'); controls?.duck(false); controls?.pause(); }
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
window.addEventListener('pagehide', () => { controls?.destroy(); controls = undefined; });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector<HTMLElement>('#game-console')!.requestFullscreen();
  } catch { announce.textContent = 'La pantalla completa no está disponible en este navegador.'; }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa');
});

try {
  const { createRunner } = await import('./runner-scene');
  controls = await createRunner(host, show);
  primary.disabled = false;
  host.querySelector('canvas')?.setAttribute('aria-hidden', 'true');
} catch (error) {
  console.error('No se pudo iniciar Ganadazo Runner:', error);
  failed = true;
  overlay.hidden = false;
  title.textContent = 'La pista está tomando un respiro.';
  message.textContent = 'No pudimos cargar el juego. Comprueba tu conexión y vuelve a intentarlo.';
  primary.textContent = 'Volver a cargar';
  primary.disabled = false;
  status.textContent = 'CARGA PENDIENTE';
}
