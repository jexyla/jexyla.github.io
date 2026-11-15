// Brand spine and cover artwork for the case-study books, drawn on canvases.
// Monese and Moneybox use the supplied logo images (background keyed out);
// the other wordmarks are typographic recreations.
import * as THREE from 'three';

const FONTS = ['64px Anton', 'italic 600 64px Fraunces', '800 64px Poppins', '600 64px Poppins'];
const fontsReady = (document.fonts ? Promise.all(FONTS.map(f => document.fonts.load(f))) : Promise.resolve())
  .catch(() => {});

// Logo crops: [x, y, w, h] in source pixels, measured from the supplied images.
const LOGOS = {
  'monese-mark': { src: 'assets/logos/monese.png', rect: [156, 110, 242, 197] },
  'monese-word': { src: 'assets/logos/monese.png', rect: [24, 363, 506, 81] },
  'moneybox-mark': { src: 'assets/logos/moneybox-mark.png', rect: [55, 49, 284, 295] },
  'moneybox-word': { src: 'assets/logos/moneybox-lockup.png', rect: [78, 245, 229, 45] },
  carwow: { src: 'assets/logos/carwow.png', rect: [34, 148, 479, 68] },
  gousto: { src: 'assets/logos/gousto.png', rect: [113, 166, 429, 136] },
};
const logoCache = {};

// "Colour to alpha": removes a flat background colour while keeping anti-aliased edges clean.
function colorToAlpha(d, bg) {
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    let a = 0;
    for (let c = 0; c < 3; c++) {
      const v = p[i + c], b = bg[c];
      const ac = v > b ? (v - b) / (255 - b || 1) : v < b ? (b - v) / (b || 1) : 0;
      if (ac > a) a = ac;
    }
    if (a < 0.02) { p[i + 3] = 0; continue; }
    for (let c = 0; c < 3; c++) p[i + c] = Math.round(bg[c] + (p[i + c] - bg[c]) / a);
    p[i + 3] = Math.round(a * 255);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

const logosReady = Promise.all(Object.entries(LOGOS).map(async ([key, { src, rect }]) => {
  const img = await loadImage(src);
  const [x, y, w, h] = rect;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h);
  colorToAlpha(d, [d.data[0], d.data[1], d.data[2]]);   // background = the crop's corner pixel
  g.putImageData(d, 0, 0);
  logoCache[key] = c;
})).catch(e => console.warn(e.message));

const assetsReady = Promise.all([fontsReady, logosReady]);

// Draws a logo fitted inside maxW × maxH, centred on (x, y). `vertical` turns it to read down a spine.
// Until the image has loaded (or if it fails), `fallback` draws a stand-in.
function logo(g, key, x, y, maxW, maxH, { vertical = false } = {}, fallback) {
  const img = logoCache[key];
  if (!img) { fallback?.(); return; }
  g.save();
  g.translate(x, y);
  if (vertical) g.rotate(Math.PI / 2);
  const s = Math.min(maxW / img.width, maxH / img.height);
  g.drawImage(img, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
  g.restore();
}

const ANTON = s => `${s}px Anton, Impact, "Arial Narrow", sans-serif`;
const SERIF = s => `italic 600 ${s}px Fraunces, Georgia, serif`;
const SANS = wt => s => `${wt} ${s}px Poppins, "Helvetica Neue", Arial, sans-serif`;

const C = {
  cleoBlue: '#3b22ff', cleoDeep: '#2414b8', mint: '#3ef2a0', lilac: '#efeaff', lilacMid: '#cbbcff', violet: '#6b4bff',
  mbTeal: '#7fe0dc', mbDeep: '#01292b', mbSage: '#4a8f88',
  moneseBlue: '#1d5fd6', moneseGreen: '#19b37f', moneseYellow: '#ffd400', moneseWhite: '#f3f2ee',
  monzoCoral: '#ff4f40', monzoDeep: '#e3382b',
  deelPurple: '#7451c8', deelInk: '#5b3ab8', deelLilac: '#c5b0f8', deelPale: '#f6f0fd', deelCream: '#fff0dc',
};

// "deel." wordmark: lowercase grotesk with a square full stop, centred on (x, y).
function deelMark(g, x, y, { color, maxLen, size, vertical = false }) {
  g.save();
  g.translate(x, y);
  if (vertical) g.rotate(Math.PI / 2);
  const font = SANS(600);
  g.font = font(size);
  let s = size, tw = g.measureText('deel').width;
  const total = tw + s * 0.3;
  if (total > maxLen) { s = size * maxLen / total; g.font = font(s); tw = g.measureText('deel').width; }
  const dot = s * 0.17, left = -(tw + s * 0.06 + dot) / 2;
  g.fillStyle = color;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const base = s * 0.36;   // optical centre of x-height for lowercase text
  g.fillText('deel', left, base);
  g.fillRect(left + tw + s * 0.06, base - dot, dot, dot);
  g.restore();
}

// Rounded four-lobed shape from Deel's illustration set.
function lobes(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.beginPath();
    g.roundRect(cx + (dx < 0 ? -r : 0), cy + (dy < 0 ? -r : 0), r, r, [
      dx < 0 && dy < 0 ? r * 0.6 : 0, dx > 0 && dy < 0 ? r * 0.6 : 0,
      dx > 0 && dy > 0 ? r * 0.6 : 0, dx < 0 && dy > 0 ? r * 0.6 : 0,
    ]);
    g.fill();
  }
}

// Crown of petals rising from a base, also from Deel's illustration set.
function crown(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x + w * 0.1, y + h);
  g.lineTo(x, y + h * 0.15);
  g.quadraticCurveTo(x + w * 0.18, y + h * 0.1, x + w * 0.25, y + h * 0.5);
  g.quadraticCurveTo(x + w * 0.24, y + h * 0.1, x + w * 0.4, y);
  g.quadraticCurveTo(x + w * 0.52, y + h * 0.2, x + w * 0.55, y + h * 0.45);
  g.quadraticCurveTo(x + w * 0.62, y + h * 0.1, x + w * 0.75, y + h * 0.02);
  g.quadraticCurveTo(x + w * 0.8, y + h * 0.3, x + w * 0.78, y + h * 0.5);
  g.quadraticCurveTo(x + w * 0.85, y + h * 0.18, x + w, y + h * 0.18);
  g.lineTo(x + w * 0.85, y + h);
  g.closePath();
  g.fill();
}

// ---------- drawing helpers ----------

function fitFont(g, str, font, maxLen, size) {
  g.font = font(size);
  const w = g.measureText(str).width;
  if (w > maxLen) g.font = font(size * maxLen / w);
}

// Text whose inked bounds are centred on (x, y). `vertical` reads top-to-bottom, like an English spine.
function text(g, str, x, y, { font, color, maxLen, size, vertical = false }) {
  g.save();
  g.translate(x, y);
  if (vertical) g.rotate(Math.PI / 2);
  fitFont(g, str, font, maxLen, size);
  g.fillStyle = color;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const m = g.measureText(str);
  const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  g.fillText(str, -inkW / 2 + m.actualBoundingBoxLeft, inkH / 2 - m.actualBoundingBoxDescent);
  g.restore();
}

function poly(g, pts, color) {
  g.fillStyle = color;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}

function roundRect(g, x, y, w, h, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function coin(g, cx, cy, r, color, lw) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath(); g.ellipse(cx, cy, r, r * 0.92, -0.4, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.ellipse(cx, cy, r * 0.68, r * 0.62, -0.4, 0, Math.PI * 2); g.stroke();
  text(g, '$', cx, cy, { font: SANS(800), color, maxLen: r, size: r * 0.85 });
}

function squiggle(g, x0, y0, x1, y1, amp, waves, color, lw) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, s = Math.sin(t * waves * Math.PI * 2) * amp;
    const x = x0 + dx * t + nx * s, y = y0 + dy * t + ny * s;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.stroke();
}

function blob(g, cx, cy, r, color, seed = 3) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = 7, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r * (0.75 + rnd() * 0.4);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  g.fillStyle = color;
  g.beginPath();
  const m = mid(pts[n - 1], pts[0]);
  g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = mid(p, pts[(i + 1) % n]);
    g.quadraticCurveTo(p[0], p[1], q[0], q[1]);
  }
  g.closePath();
  g.fill();
}

function leaf(g, x, y, len, angle, color, lw) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  g.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  g.moveTo(0, 0);
  g.lineTo(len * 0.85, 0);
  g.stroke();
  g.restore();
}

function sprig(g, x, y, len, angle, color, lw) {
  // A stem with alternating leaves, drawn along `angle`.
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.5, len * 0.08, len, 0);
  g.stroke();
  for (let i = 1; i <= 4; i++) {
    const t = i / 5, side = i % 2 ? -1 : 1;
    leaf(g, len * t, len * 0.03, len * 0.3, side * 0.9, color, lw * 0.8);
  }
  g.restore();
}

// Badge whose two long sides pinch in at the middle, like Moneybox's label.
function bowtie(g, cx, cy, w, h, notch, color, vertical = false) {
  g.save();
  g.translate(cx, cy);
  if (vertical) g.rotate(Math.PI / 2);
  const x = -w / 2, y = -h / 2, r = Math.min(h * 0.22, 40);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(0, y + notch);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(0, y + h - notch);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
  g.fill();
  g.restore();
}

function moneyboxMark(g, cx, cy, s, rot = 0) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.translate(-s / 2, -s / 2);
  g.fillStyle = C.mbTeal;
  g.beginPath(); g.arc(s * 0.25, s * 0.16, s * 0.15, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.mbSage;
  g.beginPath();
  g.moveTo(0, s * 0.45);
  g.quadraticCurveTo(s * 0.25, s * 0.38, s * 0.5, s * 0.5);
  g.lineTo(s * 0.5, s * 0.85);
  g.lineTo(s * 0.15, s * 0.95);
  g.quadraticCurveTo(0, s * 0.9, 0, s * 0.75);
  g.closePath();
  g.fill();
  g.fillStyle = C.mbDeep;
  g.beginPath();
  g.moveTo(s * 0.18, s * 0.96);
  g.quadraticCurveTo(s * 0.55, s * 0.78, s * 0.6, s * 0.45);
  g.quadraticCurveTo(s * 0.78, s * 0.3, s, s * 0.32);
  g.lineTo(s, s * 0.6);
  g.quadraticCurveTo(s * 0.86, s * 0.96, s * 0.42, s);
  g.closePath();
  g.fill();
  g.restore();
}

function moneseMark(g, cx, cy, s, color, lw) {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const w = s, h = s * 0.62;
  g.beginPath();
  g.moveTo(-w / 2, h / 2);
  g.bezierCurveTo(-w / 2, -h * 0.9, -w * 0.05, -h * 0.9, 0, h * 0.1);
  g.bezierCurveTo(w * 0.05, -h * 0.9, w / 2, -h * 0.9, w / 2, h / 2);
  g.moveTo(-w / 2, -h * 0.15);
  g.bezierCurveTo(-w * 0.2, h * 0.95, w * 0.2, h * 0.95, w / 2, -h * 0.15);
  g.stroke();
  g.restore();
}

function cardShape(g, cx, cy, w, h, rot, color, lw) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  g.roundRect(-w / 2, -h / 2, w, h, w * 0.08);
  g.stroke();
  g.strokeRect(-w * 0.36, -h * 0.12, w * 0.16, h * 0.24);
  g.restore();
}

function typingDots(g, cx, cy, gap, r, color) {
  g.fillStyle = color;
  for (const k of [-1, 0, 1]) { g.beginPath(); g.arc(cx + k * gap, cy, r, 0, Math.PI * 2); g.fill(); }
}

function spineShade(g, w, h) {
  const s = g.createLinearGradient(0, 0, w, 0);
  s.addColorStop(0, 'rgba(0,0,0,0.22)');
  s.addColorStop(0.12, 'rgba(255,255,255,0.07)');
  s.addColorStop(0.88, 'rgba(0,0,0,0)');
  s.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = s;
  g.fillRect(0, 0, w, h);
}

function hingeShade(g, w, h) {
  const s = g.createLinearGradient(0, 0, w * 0.08, 0);
  s.addColorStop(0, 'rgba(0,0,0,0.28)');
  s.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = s;
  g.fillRect(0, 0, w * 0.08, h);
}

function spineNumber(g, n, w, color) {
  text(g, n, w / 2, w * 0.3, { font: SANS(800), color, maxLen: w * 0.6, size: w * 0.2 });
}

// ---------- designs ----------
// Each design draws a spine (portrait, w ≈ 192) and a front cover (portrait, w = 600).

const DESIGNS = {
  cleo: {
    spine(g, w, h, n) {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, C.cleoBlue);
      bg.addColorStop(1, C.cleoDeep);
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      spineNumber(g, n, w, C.mint);
      coin(g, w * 0.6, h * 0.16, w * 0.22, C.mint, w * 0.035);
      const bw = w * 0.8, bh = h * 0.42, bx = (w - bw) / 2, by = h * 0.24;
      roundRect(g, bx, by, bw, bh, w * 0.22, '#fff');
      poly(g, [[bx + bw * 0.2, by + bh - 2], [bx + bw * 0.08, by + bh + w * 0.16], [bx + bw * 0.55, by + bh - 2]], '#fff');
      text(g, 'CLEO', w / 2, by + bh / 2, { font: ANTON, color: C.cleoBlue, maxLen: bh * 0.84, size: bw * 0.8, vertical: true });
      text(g, 'PROMPT ENGINEERING', w / 2, h * 0.83, { font: SANS(600), color: '#fff', maxLen: h * 0.2, size: w * 0.15, vertical: true });
      squiggle(g, w * 0.18, h * 0.965, w * 0.82, h * 0.965, w * 0.05, 2, C.mint, w * 0.03);
      spineShade(g, w, h);
    },
    cover(g, w, h) {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, C.cleoBlue);
      bg.addColorStop(1, C.cleoDeep);
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      coin(g, w * 0.82, h * 0.14, 62, C.mint, 9);
      coin(g, w * 0.16, h * 0.86, 46, C.mint, 8);
      squiggle(g, w * 0.1, h * 0.18, w * 0.5, h * 0.1, 16, 2.5, C.mint, 8);
      const bw = w * 0.74, bh = h * 0.26, bx = (w - bw) / 2, by = h * 0.35;
      roundRect(g, bx, by, bw, bh, 70, '#fff');
      poly(g, [[bx + bw * 0.16, by + bh - 2], [bx + bw * 0.06, by + bh + 60], [bx + bw * 0.4, by + bh - 2]], '#fff');
      text(g, 'CLEO', w / 2, by + bh / 2, { font: ANTON, color: C.cleoBlue, maxLen: bw * 0.8, size: bh * 0.82 });
      text(g, 'Prompt Engineering', w / 2, h * 0.76, { font: SANS(600), color: '#fff', maxLen: w * 0.8, size: 42 });
      hingeShade(g, w, h);
    },
  },

  'cleo-chat': {
    spine(g, w, h, n) {
      g.fillStyle = C.lilac;
      g.fillRect(0, 0, w, h);
      spineNumber(g, n, w, C.cleoBlue);
      const bx = w * 0.12, by = h * 0.09, bw = w * 0.76, bh = h * 0.11;
      roundRect(g, bx, by, bw, bh, w * 0.2, C.cleoBlue);
      poly(g, [[bx + bw * 0.6, by + bh - 2], [bx + bw * 0.92, by + bh + w * 0.14], [bx + bw * 0.9, by + bh - 2]], C.cleoBlue);
      typingDots(g, w / 2, by + bh / 2, w * 0.17, w * 0.055, '#fff');
      text(g, 'Designing for', w / 2, h * 0.335, { font: SERIF, color: C.violet, maxLen: h * 0.17, size: w * 0.3, vertical: true });
      blob(g, w * 0.3, h * 0.63, w * 0.5, C.lilacMid, 11);
      text(g, 'AI CHATS', w / 2, h * 0.65, { font: ANTON, color: C.cleoBlue, maxLen: h * 0.42, size: w * 0.62, vertical: true });
      g.fillStyle = C.mint;
      g.beginPath(); g.arc(w * 0.75, h * 0.96, w * 0.07, 0, Math.PI * 2); g.fill();
      spineShade(g, w, h);
    },
    cover(g, w, h) {
      g.fillStyle = C.lilac;
      g.fillRect(0, 0, w, h);
      blob(g, w * 0.88, h * 0.08, 100, C.lilacMid, 5);
      // "Designing for" bubble first, then the big "AI CHATS" bubble, so it reads as one phrase.
      const cx = w * 0.1, cy = h * 0.14, cw = w * 0.6, ch = h * 0.13;
      roundRect(g, cx, cy, cw, ch, 50, C.lilacMid);
      poly(g, [[cx + cw * 0.1, cy + ch - 2], [cx + cw * 0.04, cy + ch + 40], [cx + cw * 0.3, cy + ch - 2]], C.lilacMid);
      text(g, 'Designing for', cx + cw / 2, cy + ch / 2, { font: SERIF, color: C.cleoBlue, maxLen: cw * 0.84, size: 54 });
      const bx = w * 0.1, by = h * 0.37, bw = w * 0.8, bh = h * 0.27;
      roundRect(g, bx, by, bw, bh, 60, C.cleoBlue);
      poly(g, [[bx + bw * 0.7, by + bh - 2], [bx + bw * 0.95, by + bh + 56], [bx + bw * 0.9, by + bh - 2]], C.cleoBlue);
      text(g, 'AI CHATS', w / 2, by + bh / 2, { font: ANTON, color: '#fff', maxLen: bw * 0.84, size: bh * 0.72 });
      roundRect(g, w * 0.1, h * 0.82, w * 0.26, h * 0.08, 40, '#fff');
      typingDots(g, w * 0.23, h * 0.86, 28, 9, C.cleoBlue);
      hingeShade(g, w, h);
    },
  },

  moneybox: {
    spine(g, w, h, n) {
      g.fillStyle = C.mbTeal;
      g.fillRect(0, 0, w, h);
      spineNumber(g, n, w, C.mbDeep);
      sprig(g, w * 0.15, h * 0.2, h * 0.11, -1.2, C.mbDeep, w * 0.025);
      sprig(g, w * 0.85, h * 0.8, h * 0.13, 1.9, C.mbDeep, w * 0.025);
      sprig(g, w * 0.2, h * 0.97, h * 0.1, -1.5, C.mbSage, w * 0.025);
      bowtie(g, w / 2, h * 0.5, h * 0.54, w * 0.78, w * 0.09, '#fff', true);
      logo(g, 'moneybox-mark', w / 2, h * 0.3, w * 0.4, w * 0.4, { vertical: true },
        () => moneyboxMark(g, w / 2, h * 0.3, w * 0.34, Math.PI / 2));
      logo(g, 'moneybox-word', w / 2, h * 0.56, h * 0.34, w * 0.42, { vertical: true },
        () => text(g, 'Moneybox', w / 2, h * 0.56, { font: SANS(600), color: C.mbDeep, maxLen: h * 0.36, size: w * 0.36, vertical: true }));
      spineShade(g, w, h);
    },
    cover(g, w, h) {
      g.fillStyle = C.mbTeal;
      g.fillRect(0, 0, w, h);
      sprig(g, w * 0.05, h * 0.12, 220, -0.3, C.mbDeep, 6);
      sprig(g, w * 0.95, h * 0.25, 200, 3.6, C.mbSage, 6);
      sprig(g, w * 0.04, h * 0.96, 220, -0.25, C.mbSage, 6);
      sprig(g, w * 0.96, h * 0.9, 200, -2.9, C.mbDeep, 6);
      bowtie(g, w / 2, h * 0.46, w * 0.86, h * 0.26, 24, '#fff');
      logo(g, 'moneybox-mark', w * 0.22, h * 0.46, 100, 100, {}, () => moneyboxMark(g, w * 0.22, h * 0.46, 96));
      logo(g, 'moneybox-word', w * 0.6, h * 0.465, w * 0.5, 70, {},
        () => text(g, 'Moneybox', w * 0.6, h * 0.465, { font: SANS(600), color: C.mbDeep, maxLen: w * 0.52, size: 72 }));
      text(g, 'Mortgage Advice', w / 2, h * 0.7, { font: SERIF, color: C.mbDeep, maxLen: w * 0.8, size: 50 });
      hingeShade(g, w, h);
    },
  },

  monese: {
    spine(g, w, h, n) {
      g.fillStyle = C.moneseWhite;
      g.fillRect(0, 0, w, h);
      g.fillStyle = C.moneseGreen;
      g.beginPath(); g.arc(0, 0, w * 0.95, 0, Math.PI / 2); g.lineTo(0, 0); g.fill();
      g.fillStyle = C.moneseYellow;
      g.beginPath(); g.arc(w * 0.75, h * 0.66, w * 0.62, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.moneseBlue;
      g.beginPath();
      g.moveTo(0, h * 0.84);
      g.bezierCurveTo(w * 0.35, h * 0.76, w * 0.7, h * 0.86, w, h * 0.78);
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.closePath();
      g.fill();
      spineNumber(g, n, w, '#fff');
      logo(g, 'monese-mark', w / 2, h * 0.26, w * 0.6, w * 0.5, {},
        () => moneseMark(g, w / 2, h * 0.26, w * 0.5, C.moneseGreen, w * 0.05));
      logo(g, 'monese-word', w / 2, h * 0.52, h * 0.36, w * 0.4, { vertical: true },
        () => text(g, 'monese', w / 2, h * 0.52, { font: SANS(800), color: C.moneseBlue, maxLen: h * 0.34, size: w * 0.42, vertical: true }));
      text(g, 'credit tools', w / 2, h * 0.92, { font: SERIF, color: '#fff', maxLen: h * 0.12, size: w * 0.2, vertical: true });
      spineShade(g, w, h);
    },
    cover(g, w, h) {
      g.fillStyle = C.moneseWhite;
      g.fillRect(0, 0, w, h);
      g.fillStyle = C.moneseGreen;
      g.beginPath(); g.arc(0, 0, w * 0.5, 0, Math.PI / 2); g.lineTo(0, 0); g.fill();
      g.fillStyle = C.moneseYellow;
      g.beginPath(); g.arc(w * 0.82, h * 0.6, w * 0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.moneseBlue;
      g.beginPath();
      g.moveTo(0, h * 0.82);
      g.bezierCurveTo(w * 0.35, h * 0.72, w * 0.7, h * 0.86, w, h * 0.74);
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.closePath();
      g.fill();
      logo(g, 'monese-mark', w / 2, h * 0.29, 180, 145, {}, () => moneseMark(g, w / 2, h * 0.3, 140, C.moneseGreen, 14));
      logo(g, 'monese-word', w / 2, h * 0.47, w * 0.7, 110, {},
        () => text(g, 'monese', w / 2, h * 0.47, { font: SANS(800), color: C.moneseBlue, maxLen: w * 0.7, size: 100 }));
      text(g, 'Credit tools', w / 2, h * 0.9, { font: SERIF, color: '#fff', maxLen: w * 0.7, size: 50 });
      hingeShade(g, w, h);
    },
  },

  monzo: {
    spine(g, w, h, n) {
      g.fillStyle = C.monzoCoral;
      g.fillRect(0, 0, w, h);
      g.fillStyle = C.monzoDeep;
      g.fillRect(0, h * 0.86, w, h * 0.14);
      spineNumber(g, n, w, '#fff');
      squiggle(g, w * 0.2, h * 0.11, w * 0.8, h * 0.2, w * 0.08, 2, '#fff', w * 0.035);
      text(g, 'monzo', w / 2, h * 0.43, { font: SANS(800), color: '#fff', maxLen: h * 0.36, size: w * 0.5, vertical: true });
      text(g, 'Gambling Block', w / 2, h * 0.72, { font: SERIF, color: '#fff', maxLen: h * 0.2, size: w * 0.24, vertical: true });
      cardShape(g, w / 2, h * 0.93, w * 0.56, w * 0.36, -0.15, '#fff', w * 0.03);
      spineShade(g, w, h);
    },
    cover(g, w, h) {
      g.fillStyle = C.monzoCoral;
      g.fillRect(0, 0, w, h);
      squiggle(g, w * 0.1, h * 0.14, w * 0.62, h * 0.1, 18, 2.5, '#fff', 9);
      text(g, 'monzo', w / 2, h * 0.42, { font: SANS(800), color: '#fff', maxLen: w * 0.8, size: 160 });
      text(g, 'Gambling Block', w / 2, h * 0.56, { font: SERIF, color: '#fff', maxLen: w * 0.8, size: 56 });
      cardShape(g, w * 0.68, h * 0.8, 230, 145, -0.2, '#fff', 9);
      hingeShade(g, w, h);
    },
  },

  deel: {
    spine(g, w, h, n) {
      g.fillStyle = C.deelPale;
      g.fillRect(0, 0, w, h);
      g.fillStyle = C.deelLilac;
      g.fillRect(0, 0, w, h * 0.17);
      g.fillStyle = C.deelPurple;
      g.beginPath(); g.ellipse(w * 0.15, h * 0.07, w * 0.55, h * 0.09, 0, 0, Math.PI * 2); g.fill();
      poly(g, [[0, h * 0.2], [w, h * 0.2], [w, h * 0.27], [w * 0.5, h * 0.33], [0, h * 0.27]], C.deelPurple);
      spineNumber(g, n, w, '#fff');
      deelMark(g, w / 2, h * 0.5, { color: C.deelInk, maxLen: h * 0.3, size: w * 0.5, vertical: true });
      g.fillStyle = C.deelLilac;
      g.fillRect(0, h * 0.68, w, h * 0.32);
      crown(g, w * 0.12, h * 0.72, w * 0.76, h * 0.12, C.deelPale);
      text(g, 'Course Builder', w / 2, h * 0.92, { font: SERIF, color: C.deelInk, maxLen: h * 0.13, size: w * 0.22, vertical: true });
      spineShade(g, w, h);
    },
    cover(g, w, h) {
      const mx = w * 0.42, my = h * 0.45;
      g.fillStyle = C.deelLilac; g.fillRect(0, 0, mx, my);
      g.fillStyle = C.deelPurple;
      g.beginPath(); g.ellipse(mx * 0.1, my * 0.2, mx * 0.75, my * 0.6, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.deelPurple; g.fillRect(mx, 0, w - mx, my);
      poly(g, [[mx, my * 0.38], [mx + (w - mx) * 0.38, my * 0.85], [w, my * 0.1], [w, my * 0.4], [mx + (w - mx) * 0.4, my], [mx, my]], C.deelPale);
      g.fillStyle = C.deelPale; g.fillRect(0, my, mx, h - my);
      lobes(g, mx * 0.6, my + (h - my) * 0.42, mx * 0.38, C.deelPurple);
      g.fillStyle = C.deelLilac; g.fillRect(mx, my, w - mx, h - my);
      crown(g, mx + (w - mx) * 0.2, my + (h - my) * 0.25, (w - mx) * 0.62, (h - my) * 0.75, C.deelPale);
      roundRect(g, w * 0.12, h * 0.34, w * 0.76, h * 0.27, 28, C.deelCream);
      deelMark(g, w / 2, h * 0.43, { color: C.deelInk, maxLen: w * 0.5, size: 110 });
      text(g, 'Course Builder', w / 2, h * 0.545, { font: SERIF, color: C.deelInk, maxLen: w * 0.6, size: 42 });
      hingeShade(g, w, h);
    },
  },
};

function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Spine and cover textures for one case-study book.
 * `w`, `h`, `depth` are the book's size in metres, so the canvases match its proportions.
 * Textures draw immediately with fallback fonts, then redraw once the display fonts load.
 */
export function brandArt(cs, { w, h, depth, number }) {
  const design = DESIGNS[cs.brand] ?? DESIGNS.cleo;
  const spineCanvas = document.createElement('canvas');
  spineCanvas.width = 192;
  spineCanvas.height = Math.round(192 * (h / w));
  const coverCanvas = document.createElement('canvas');
  coverCanvas.width = 600;
  coverCanvas.height = Math.round(600 * (h / depth));
  const spineTex = canvasTexture(spineCanvas);
  const coverTex = canvasTexture(coverCanvas);

  const draw = () => {
    design.spine(spineCanvas.getContext('2d'), spineCanvas.width, spineCanvas.height, number);
    design.cover(coverCanvas.getContext('2d'), coverCanvas.width, coverCanvas.height);
    spineTex.needsUpdate = true;
    coverTex.needsUpdate = true;
  };
  draw();
  assetsReady.then(draw);

  return { spineTex, coverTex, coverURL: () => coverCanvas.toDataURL('image/png') };
}

// Crop a canvas to its non-transparent pixels.
function trimCanvas(c) {
  const { data, width, height } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return c;
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(c, -x0, -y0);
  return out;
}

/**
 * Company logo for the project header, on a transparent background, trimmed to its edges (data URL).
 * Monese and Moneybox use the supplied logo images; Cleo, Monzo and Deel are typographic, as on the spines.
 * `ink` is the theme's text colour, used where a logo is drawn in a single colour.
 */
export function brandLogo(cs, ink = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 240;
  const g = c.getContext('2d');
  const cy = 120;
  switch (cs.brand) {
    case 'cleo':
    case 'cleo-chat': {
      const fill = cs.brand === 'cleo' ? '#ffffff' : C.cleoBlue;
      const bx = 20, bw = 330, bh = 150, by = cy - bh / 2;
      roundRect(g, bx, by, bw, bh, 56, fill);
      poly(g, [[bx + 40, by + bh - 2], [bx + 22, by + bh + 40], [bx + 110, by + bh - 2]], fill);
      text(g, 'CLEO', bx + bw / 2, cy, { font: ANTON, color: cs.brand === 'cleo' ? C.cleoBlue : '#ffffff', maxLen: bw * 0.8, size: 120 });
      break;
    }
    case 'moneybox':
      logo(g, 'moneybox-mark', 85, cy, 150, 150, {}, () => moneyboxMark(g, 85, cy, 140));
      logo(g, 'moneybox-word', 465, cy, 600, 110, {},
        () => text(g, 'Moneybox', 465, cy, { font: SANS(600), color: C.mbDeep, maxLen: 600, size: 110 }));
      break;
    case 'monese':
      logo(g, 'monese-mark', 90, cy, 175, 140, {}, () => moneseMark(g, 90, cy, 150, C.moneseGreen, 14));
      logo(g, 'monese-word', 500, cy, 620, 110, {},
        () => text(g, 'monese', 500, cy, { font: SANS(800), color: C.moneseBlue, maxLen: 600, size: 110 }));
      break;
    case 'monzo':
      text(g, 'monzo', 300, cy, { font: SANS(800), color: ink, maxLen: 600, size: 170 });
      break;
    case 'deel':
      deelMark(g, 300, cy, { color: C.deelInk, maxLen: 600, size: 180 });
      break;
    case 'carwow':
      logo(g, 'carwow', 450, cy, 860, 150, {},
        () => text(g, 'carwow', 300, cy, { font: SANS(800), color: ink, maxLen: 600, size: 140 }));
      break;
    case 'gousto':
      logo(g, 'gousto', 450, cy, 860, 190, {},
        () => text(g, 'gousto', 300, cy, { font: SANS(600), color: ink, maxLen: 600, size: 140 }));
      break;
    default:
      text(g, cs.company || '', 300, cy, { font: SANS(800), color: ink, maxLen: 600, size: 120 });
  }
  return trimCanvas(c).toDataURL('image/png');
}

export { assetsReady };
