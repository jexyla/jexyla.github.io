// Author page: scroll reveals (the same as the About page).
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
