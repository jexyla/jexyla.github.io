// Snap controller: one gesture (wheel, swipe, key, dot) moves exactly one project.
import { projects } from '../data/projects.js';
import { createUI } from './ui.js';
import { createGallery } from './gallery.js?v=2';
import { brandArt, brandLogo, assetsReady } from './brandart.js';
import { openLockDialog } from './lock-dialog.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DURATION = reduceMotion ? 300 : 1450;

// Brand cover art per project: the stand-in image where a project has no image of its own.
const art = projects.map((p, i) => brandArt(p, { w: 0.06, h: 0.34, depth: 0.24, number: String(i + 1).padStart(2, '0') }));

let index = 0, busy = false;
const ui = createUI(projects, {
  reduceMotion,
  coverURL: i => art[i].coverURL(),
  logoURL: i => brandLogo(projects[i], projects[i].theme.ink),
  onDot: i => go(i),
});

let gallery = null;
try {
  if (document.createElement('canvas').getContext('webgl2')) {
    gallery = createGallery(document.getElementById('gallery'), projects, {
      reduceMotion, coverCanvas: i => art[i].coverTex.image, assetsReady,
    });
  }
} catch (e) {
  console.error(e);
}
const fallbackImages = i => (projects[i].images.length ? projects[i].images : [art[i].coverURL()]).slice(0, 2);
if (!gallery) {
  ui.showFallback();
  ui.setFallbackImages(fallbackImages(0));
}

ui.show(0, { instant: true });
assetsReady.then(() => ui.refreshThumb(index));

// Positions 0..n-1 are the projects; position n is "Other projects", which slides up over the last project;
// position n+1 is the footer, which slides up over that.
const OTHERS = projects.length, FOOTER = OTHERS + 1;
let shown = 0;   // the project currently on screen (stays put under the sheets)
const lockDialog = document.getElementById('lock-dialog');
function go(next) {
  if (lockDialog?.open) return;   // the password dialog is up
  if (busy || next === index || next < 0 || next > FOOTER) return;
  busy = true;
  const prev = index;
  index = next;
  ui.showOthers(index >= OTHERS);
  ui.showFooter(index === FOOTER);
  if (index < OTHERS && index !== shown) {
    ui.show(index, { dir: index > shown ? 1 : -1 });
    if (gallery) gallery.goTo(index);
    else setTimeout(() => ui.setFallbackImages(fallbackImages(index)), DURATION / 2);
    shown = index;
  }
  setTimeout(() => { busy = false; }, prev >= OTHERS || index >= OTHERS ? 900 : DURATION);
}

// Wheel: accumulate small deltas; ignore the trackpad's inertia tail until it goes quiet.
let acc = 0, accTimer = 0, quietUntil = 0;
addEventListener('wheel', e => {
  if (e.ctrlKey) return; // trackpad pinch-zoom
  e.preventDefault();
  const now = performance.now();
  if (busy || now < quietUntil) { quietUntil = now + 220; acc = 0; return; }
  acc += e.deltaY;
  clearTimeout(accTimer);
  accTimer = setTimeout(() => { acc = 0; }, 160);
  if (Math.abs(acc) > 40) {
    go(index + Math.sign(acc));
    acc = 0;
    quietUntil = now + DURATION + 220;
  }
}, { passive: false });

// Touch: a vertical swipe longer than 50px.
let touchY = null, maxTouches = 0;
addEventListener('touchstart', e => {
  if (e.touches.length === 1) touchY = e.touches[0].clientY;
  maxTouches = Math.max(maxTouches, e.touches.length);
}, { passive: true });
addEventListener('touchend', e => {
  if (e.touches.length > 0) return; // gesture still in progress
  const y = touchY, single = maxTouches === 1;
  touchY = null; maxTouches = 0;
  if (y === null || !single) return;
  const dy = y - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) go(index + Math.sign(dy));
});
addEventListener('touchcancel', () => { touchY = null; maxTouches = 0; });

// Keyboard.
addEventListener('keydown', e => {
  if (lockDialog?.open || e.target.closest?.('input, textarea')) return;   // typing a password, not moving
  if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button, a')) return; // let the control act
  const next = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (next) { e.preventDefault(); go(index + next); }
  if (e.key === 'Home') go(0);
  if (e.key === 'End') go(FOOTER);
});

// Clicking the current project's image opens its case study; clicking the previous/next image moves there.
const canvas = document.getElementById('gallery');
addEventListener('click', e => {
  if (!gallery || e.target !== canvas) return;
  const hit = gallery.hitProject(e.clientX, e.clientY);
  if (index >= OTHERS) return;
  if (hit === index) openProject(projects[index]);
  else if (hit >= 0) go(hit);
});
addEventListener('pointermove', e => {
  if (!gallery) return;
  const hit = e.target === canvas ? gallery.hitProject(e.clientX, e.clientY) : -1;
  canvas.style.cursor = hit >= 0 && (hit !== index || projects[hit].url) ? 'pointer' : '';
});

// Opening a case study: locked ones ask for the password first.
function openProject(p) {
  if (!p.url) return;
  if (p.locked) openLockDialog(p);
  else location.href = p.url;
}
document.getElementById('p-link').addEventListener('click', e => {
  const p = projects[index];
  if (p && p.locked) { e.preventDefault(); openLockDialog(p); }
});

window.__portfolio = { go, get index() { return index; } };
