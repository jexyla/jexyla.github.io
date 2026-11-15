// Project text (logo and masked letter title), theme colours, pagination dots and fallback stack.
import { gsap } from 'gsap';

export function createUI(projects, { reduceMotion, coverURL, logoURL, onDot }) {
  const $ = id => document.getElementById(id);
  const title = $('p-title'), summary = $('p-summary'), link = $('p-link');
  const logo = $('p-logo');

  const dots = projects.map((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${p.company}: ${p.fullTitle}`);
    b.addEventListener('click', () => onDot(i));
    li.append(b);
    $('dots').append(li);
    return b;
  });

  const list = document.querySelector('#a11y-list ul');
  for (const p of projects) {
    const li = document.createElement('li');
    const a = document.createElement(p.url ? 'a' : 'span');   // no link until a case study exists
    if (p.url) a.href = p.url;
    a.textContent = `${p.company} – ${p.fullTitle}`;
    li.append(a);
    list.append(li);
  }

  // Title as words of letters, each word a masking box so letters slide in and out of view.
  function setTitle(text) {
    title.removeAttribute('aria-label');
    title.replaceChildren();
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = text.replace(/\n/g, ' ');
    title.append(sr);
    title.classList.toggle('is-long', text.length > 20);   // long titles get a smaller size
    for (const word of text.replace(/\n/g, ' \n ').split(/ +/)) {
      if (word === '\n') {   // preferred line break
        title.append(Object.assign(document.createElement('span'), { className: 'br' }));
        continue;
      }
      const w = document.createElement('span');
      w.className = 'word';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const c = document.createElement('span');
        c.className = 'ch';
        c.textContent = ch;
        w.append(c);
      }
      title.append(w);
    }
    return title.querySelectorAll('.ch');
  }

  function fill(p, i) {
    logo.src = logoURL(i);
    logo.alt = p.company;
    summary.textContent = p.summary;
    link.hidden = !p.url;   // projects without a case study yet show no link
    if (p.url) link.href = p.url;
    link.setAttribute('aria-label', `Open case study: ${p.fullTitle}`);
    $('announce').textContent = `${String(i + 1).padStart(2, '0')} of ${String(projects.length).padStart(2, '0')}: ${p.company} – ${p.fullTitle}`;
    const s = document.body.style;
    s.setProperty('--bg', p.theme.bg);
    s.setProperty('--ink', p.theme.ink);
    s.setProperty('--accent', p.theme.accent);
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  }

  let current = -1, tl = null;
  function show(i, { instant = false, dir = 1 } = {}) {
    const p = projects[i];
    tl?.progress(1);
    const rest = [logo, summary, link];
    if (instant || current < 0) {
      fill(p, i);
      setTitle(p.title);
      current = i;
      return;
    }
    current = i;
    if (reduceMotion) {
      tl = gsap.timeline()
        .to([title, ...rest], { opacity: 0, duration: 0.15 })
        .add(() => { fill(p, i); setTitle(p.title); })
        .to([title, ...rest], { opacity: 1, duration: 0.15 });
      return;
    }
    const out = title.querySelectorAll('.ch');
    tl = gsap.timeline()
      .to(out, { yPercent: -110 * dir, duration: 0.5, ease: 'power3.in', stagger: 0.02 }, 0)
      .to(rest, { opacity: 0, y: -20 * dir, duration: 0.35, ease: 'power2.in' }, 0)
      .add(() => fill(p, i), 0.35)   // theme crossfade starts mid-exit
      .add(() => {
        const inn = setTitle(p.title);
        gsap.fromTo(inn, { yPercent: 110 * dir }, { yPercent: 0, duration: 0.7, ease: 'power3.out', stagger: 0.025 });
      }, 0.55)
      .fromTo(rest, { opacity: 0, y: 20 * dir }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05, immediateRender: false }, 0.7);
  }

  function refreshThumb(i) { logo.src = logoURL(i); }   // redraw the logo once brand assets load
  function showFallback() { document.body.classList.add('no-webgl'); }
  function setFallbackImages(srcs) {
    $('fallback-stack').replaceChildren(...srcs.map(src => {
      const im = new Image();
      im.alt = '';
      im.src = src;
      return im;
    }));
  }

  // Footer panel: slides up after the last project; inert (not focusable) while hidden.
  const footer = $('footer');
  footer.inert = true;
  function showFooter(on) {
    document.body.classList.toggle('footer-open', on);
    footer.inert = !on;
    footer.setAttribute('aria-hidden', String(!on));
  }

  const others = document.getElementById('others');
  others.inert = true;
  function showOthers(on) {
    document.body.classList.toggle('others-open', on);
    others.inert = !on;
    others.setAttribute('aria-hidden', String(!on));
    // The Gousto animation only plays while the sheet is open
    others.querySelectorAll('video').forEach(v => { if (on) v.play().catch(() => {}); else v.pause(); });
  }

  return { show, refreshThumb, showFallback, setFallbackImages, showFooter, showOthers };
}
