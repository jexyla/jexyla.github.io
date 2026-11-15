// About page: experience timeline (from the CV data), the scrollable talks list, header colour, scroll reveals.
import { experience } from '../data/experience.js';
import { brandLogo, assetsReady } from './brandart.js';

// Experience: logo tile in the company's colours, then dates, role, company/place and a highlight.
const list = document.getElementById('experience');
list.style.setProperty('--rows', Math.ceil(experience.length / 2));   // newest down the left column, older on the right
const tiles = experience.map(x => {
  const li = document.createElement('li');
  const tile = document.createElement('div');
  tile.className = 'x-tile';
  tile.style.background = x.theme.bg;
  const logo = document.createElement('img');
  logo.alt = '';
  logo.src = brandLogo(x, x.theme.ink);
  tile.append(logo);
  const meta = document.createElement('div');
  meta.className = 'x-meta';
  const add = (tag, className, textContent) => {
    if (textContent) meta.append(Object.assign(document.createElement(tag), { className, textContent }));
  };
  add('span', 'x-dates', x.dates);
  add('h3', 'x-company', x.role);
  add('span', 'x-sub', `${x.company} – ${x.place}`);
  add('span', 'x-highlight', x.highlight);
  li.append(tile, meta);
  list.append(li);
  return { x, logo };
});
// Redraw logos once the brand fonts and logo images have loaded.
assetsReady.then(() => tiles.forEach(({ x, logo }) => { logo.src = brandLogo(x, x.theme.ink); }));

// Writing, interviews & talks: horizontal list with previous/next buttons.
const media = document.getElementById('media');
document.querySelectorAll('.media-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = media.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 20 : 320;
    media.scrollBy({ left: Number(btn.dataset.dir) * step, behavior: 'smooth' });
  });
});

// Header: dark text over the cream hero, light text over the dark page.
const top = document.querySelector('.top');
const hero = document.querySelector('.hero');
const setHeader = () => top.classList.toggle('on-dark', hero.getBoundingClientRect().bottom < 60);
addEventListener('scroll', setHeader, { passive: true });
setHeader();

// Scroll reveals.
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
