// Case-study pages: brand colours, logo and cover from the landing page's data, the next-project card, header, reveals.
import { projects } from '../data/projects.js?v=4';
import { brandLogo, assetsReady } from './brandart.js';

// Scroll reveals run first, so content can never be left hidden if something later fails.
// (Until .js-ready is set, case.css shows .reveal content straight away.)
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
document.body.classList.add('js-ready');

const SLUG_TO_PROJECT = {
  'cleo-ai-prompt-engineering-case-study': 'cleo',
  'cleo-ai-chat-case-study': 'ai-chats',
  'moneybox-mortgages-case-study': 'moneybox',
  'monese-credit-case-study': 'monese',
  'monzo-gambling-block-case-study': 'monzo',
};
const byId = id => projects.find(p => p.id === id);
const p = byId(document.body.dataset.project);
const next = byId(SLUG_TO_PROJECT[document.body.dataset.next]);

// Relative luminance, to pick the darker of a theme's colours for marks on white (quote bars, list bullets).
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

if (p) {
  const s = document.body.style;
  s.setProperty('--c-bg', p.theme.bg);
  s.setProperty('--c-ink', p.theme.ink);
  s.setProperty('--c-accent', p.theme.accent);
  s.setProperty('--c-strong', lum(p.theme.bg) < lum(p.theme.accent) ? p.theme.bg : p.theme.accent);

  // Logo in the header's text colour (the header uses the project's landing-page colours).
  const ink = p.theme.ink;
  const logo = document.getElementById('case-logo');
  logo.src = brandLogo(p, ink);
  assetsReady.then(() => { logo.src = brandLogo(p, ink); });

  const cover = document.getElementById('case-cover');
  if (!cover || cover.children.length) {
    // the page supplies its own hero art (e.g. the Deel collage)
  } else if (p.images[0]) {
    cover.classList.toggle('fit-height', p.imageFit === 'height');
    cover.append(Object.assign(document.createElement('img'), { src: p.images[0], alt: `${p.company}: ${p.fullTitle}` }));
  } else {
    cover.remove();
  }
}

if (next) {
  const c = document.getElementById('next-card').style;
  c.setProperty('--n-bg', next.theme.bg);
  c.setProperty('--n-ink', next.theme.ink);
  c.setProperty('--n-accent', next.theme.accent);
}

// Header: a white fade behind the Back pill once past the hero.
const top = document.querySelector('.top');
const hero = document.querySelector('.case-hero');
const setHeader = () => top.classList.toggle('on-dark', hero.getBoundingClientRect().bottom < 60);
addEventListener('scroll', setHeader, { passive: true });
setHeader();

