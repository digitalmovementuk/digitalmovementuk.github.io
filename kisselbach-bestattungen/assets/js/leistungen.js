/* Kißelbach Bestattungen · /leistungen/ · Fassung v1.0 · 04.11.2026 · Builder D1, Claude (Opus 5.5)
   Change log: v1.0 (04.11.2026) first version.
   Signature „Ein Weg, eine Ansprechpartnerin“: in the night section the candle line grows from stage to stage as each
   stage comes into view (time-based, 0.55 s; never tied to the scroll position), the stage numeral warms to candle light
   and its ticks draw themselves. Text is at full contrast from the start.
   Progressive enhancement: without this script, with prefers-reduced-motion or with „Bewegungen reduzieren“ the page
   shows the finished state (CSS: .lst-steps:not(.lst-armed)). Runs after site.js (both deferred). */
(() => {
  const wrap = document.querySelector('[data-lst-steps]');
  if (!wrap || !('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduced.matches || root.getAttribute('data-motion') === 'off';
  if (motionOff()) return;

  const steps = Array.from(wrap.querySelectorAll('.lst-step'));
  const track = wrap.querySelector('.steps-track');
  if (!steps.length || !track) return;

  let lit = -1;
  let io = null;

  // line end = the dot of the stage that is lit last (the last stage fills the whole line)
  const fillTo = (i) => {
    const tr = track.getBoundingClientRect();
    if (!tr.height) return;
    const node = steps[i].getBoundingClientRect();
    const p = i === steps.length - 1 ? 1 : Math.min(1, Math.max(0, (node.top + 24 - tr.top) / tr.height));
    wrap.style.setProperty('--lst-p', p.toFixed(4));
  };

  const light = (i) => {
    if (i <= lit) return;
    for (let k = lit + 1; k <= i; k += 1) {
      const step = steps[k];
      const delay = (k - lit - 1) * 110;            // a stage skipped by a fast scroll follows a beat later
      if (delay) setTimeout(() => step.classList.add('is-lit'), delay); else step.classList.add('is-lit');
    }
    lit = i;
    fillTo(i);
  };

  const finish = () => {
    if (io) io.disconnect();
    steps.forEach((s) => s.classList.add('is-lit'));
    wrap.style.setProperty('--lst-p', '1');
    lit = steps.length - 1;
  };

  wrap.classList.add('lst-armed');
  wrap.style.setProperty('--lst-p', '0');
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      light(steps.indexOf(en.target));
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -22% 0px', threshold: 0 });
  steps.forEach((s) => io.observe(s));

  window.addEventListener('resize', () => { if (lit >= 0) fillTo(lit); }, { passive: true });

  // the visitor switches motion off while reading: show everything finished at once
  new MutationObserver(() => { if (motionOff()) finish(); }).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  if (reduced.addEventListener) reduced.addEventListener('change', () => { if (motionOff()) finish(); });
})();
