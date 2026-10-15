/* Re;mind — style variant 02 "Q Psychology" · v1.0 · 15 October 2026
   Motion replicated from the reference: load sequence, line reveals, slide-up reveal,
   scroll-linked parallax on the feature image, custom cursor dot, nav interactions. */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---- load sequence (ref: preloader panel while the hero line and media zoom run behind it; logo in at ≈0.7 s,
          logo out at ≈2.3 s, panel slides up ≈2.4–3.5 s, removed ≈4.2 s) ---- */
  const loader = document.getElementById('loader');
  if (loader && !reduce) document.body.classList.add('is-locked');
  const start = () => {
    requestAnimationFrame(() => {
      root.classList.add('is-loaded');
      const heroLine = document.querySelector('.hero .line');
      if (heroLine) setTimeout(() => heroLine.classList.add('is-in'), reduce ? 0 : 400);
      if (loader) {
        if (reduce) { loader.classList.add('is-done'); document.body.classList.remove('is-locked'); return; }
        setTimeout(() => loader.classList.add('is-leaving'), 2200);
        setTimeout(() => { loader.classList.add('is-done'); document.body.classList.remove('is-locked'); }, 3500);
      }
    });
  };
  /* the preloader covers any font swap, so the sequence starts on DOM-ready like the reference (logo in at ≈0.7 s) */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  /* ---- in-view reveals (rules grow 0 → 100 %) ---- */
  const targets = document.querySelectorAll('.line:not(.hero .line)');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    targets.forEach(el => io.observe(el));
  }

  /* ---- scroll-linked parallax on the feature image (ref: translateY 10rem → -19rem while in view) ---- */
  const media = document.querySelector('.media-wrap');
  const desktop = window.matchMedia('(min-width: 992px)');
  if (media && !reduce) {
    let ticking = false;
    const rem = () => parseFloat(getComputedStyle(root).fontSize) || 16;
    const update = () => {
      if (!desktop.matches) { ticking = false; media.style.transform = ''; return; }
      const r = rem();
      const y = media.getBoundingClientRect().top - media._shift;
      const target = Math.max(-19 * r, Math.min(10 * r, 0.293 * y - 3.9 * r));   /* ref: −0.293 px per px of scroll (160 → −304), re-measured 15.10. */
      const d = target - media._shift;
      media._shift += Math.abs(d) > 0.05 ? d * 0.18 : d;   /* IX2-style smoothing lag, as measured on the reference */
      media.style.transform = 'translate3d(0,' + media._shift.toFixed(2) + 'px,0)';
      if (Math.abs(target - media._shift) > 0.05) requestAnimationFrame(update); else ticking = false;
    };
    media._shift = 10 * rem();   /* the stylesheet starts the element at translateY(10rem) */
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---- hero scroll choreography (ref Webflow IX2 "while scrolling", with smoothing):
     media scale 1.0747 → 1.100 (ease-out quad over ~hero height) and blur 0 → 14px (smoothstep, sy 50–850);
     headline translateY 0 → −34rem (sy 100–500); text block 0 → −17rem (sy 60–760); scroll cue 0 → +6rem (sy 60–360). ---- */
  const hero = document.querySelector('.hero');
  const zoom = document.querySelector('.hero_zoom');
  const headline = document.querySelector('.hero_headline');
  const textBlock = document.querySelector('.hero_text_block');
  const scrollTo = document.querySelector('.scroll-to');
  if (hero && zoom && !reduce) {
    const clamp01 = v => Math.min(1, Math.max(0, v));
    const smooth = p => p * p * (3 - 2 * p);
    const rem = () => parseFloat(getComputedStyle(root).fontSize) || 16;
    /* measured on the reference at 1440×900 and on iPhone 14 Pro: progress p = scrollY / hero height (the IX2 range, so the
       shorter phone hero runs the same curve faster); amplitudes: headline −34rem, scroll cue +6rem, text block −80 % of its own
       height (−271/339 desktop, −302/377 iPhone), blur 0 → 14px */
    const TBP = [[0, 0], [.093, .01], [.186, .115], [.28, .31], [.37, .52], [.46, .70], [.56, .81], [.65, .895], [.74, .95], [.84, .98], [.93, .996], [1.02, 1]];
    const BLP = [[0, 0], [.093, .01], [.186, 1.21], [.28, 3.8], [.37, 6.89], [.46, 9.64], [.56, 11.27], [.65, 12.45], [.74, 13.26], [.84, 13.71], [.93, 13.95], [1.02, 14]];
    const lut = (tab, x) => { if (x <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) { if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } } return tab[tab.length - 1][1]; };
    const cur = { s: 1, b: 0, h: 0, t: 0, c: 0 };
    let settled = false, running = false;
    const frame = () => {
      const r = rem(), sy = window.scrollY;
      const heroH = Math.max(1, hero.offsetHeight);
      const p = sy / heroH;
      const pz = clamp01(sy / Math.max(1, heroH - 27));
      const target = {
        s: 1 + 0.0235 * (1 - (1 - pz) * (1 - pz)),
        b: lut(BLP, p),
        h: -34 * r * clamp01((p - 0.1) / 0.36),
        t: -0.8 * textBlock.offsetHeight * lut(TBP, p),
        c: 6 * r * clamp01((p - 0.07) / 0.21),
      };
      let moving = false;
      for (const k in target) { const d = target[k] - cur[k]; if (Math.abs(d) > (k === 's' ? 0.0002 : 0.05)) { cur[k] += d * 0.18; moving = true; } else cur[k] = target[k]; }
      zoom.style.transform = 'scale(' + cur.s.toFixed(5) + ')';
      zoom.style.filter = cur.b > 0.05 ? 'blur(' + cur.b.toFixed(2) + 'px)' : '';
      if (settled) {
        headline.style.transform = 'translate3d(0,' + cur.h.toFixed(2) + 'px,0)';
        textBlock.style.transform = 'translate3d(0,' + cur.t.toFixed(2) + 'px,0)';
        scrollTo.style.transform = 'translate3d(0,' + cur.c.toFixed(2) + 'px,0)';
      }
      if (moving) requestAnimationFrame(frame); else running = false;
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    /* no entrance to wait for (ref hero text is static behind the preloader): drive the wrappers from the first frame */
    const settle = () => { settled = true; root.classList.add('is-settled'); kick(); };
    settle();
  }

  /* ---- anchor smooth scroll (ref: Webflow/jQuery "swing" ≈ 0.9 s ease-in-out; measured 508 → 883 px in ~0.85 s) ---- */
  if (!reduce) {
    const easeInOut = p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1); const target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const from = window.scrollY, to = target.getBoundingClientRect().top + from, dist = to - from;
        const dur = Math.min(1200, Math.max(500, Math.abs(dist) * 0.8));
        const t0 = performance.now();
        const step = (now) => { const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, from + dist * easeInOut(p)); if (p < 1) requestAnimationFrame(step); else history.replaceState(null, '', '#' + id); };
        requestAnimationFrame(step);
      });
    });
  }

  /* ---- custom cursor dot (ref .cursor-dot, 8px) ---- */
  const cursor = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor-dot');
  if (cursor && dot && fine && !reduce) {
    let x = -100, y = -100, tx = x, ty = y, raf = null;
    const loop = () => {
      x += (tx - x) * 0.35; y += (ty - y) * 0.35;
      dot.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) raf = requestAnimationFrame(loop); else raf = null;
    };
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
  }

  /* ---- nav: mobile menu + dropdown ---- */
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.style.overflow = open && window.innerWidth < 992 ? 'hidden' : '';
    });
  }
  document.querySelectorAll('.has-dd').forEach(dd => {
    const toggle = dd.querySelector('.dd-toggle');
    toggle.addEventListener('click', () => {
      const open = !dd.classList.contains('is-open');
      dd.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-dd.is-open').forEach(dd => { dd.classList.remove('is-open'); dd.querySelector('.dd-toggle').setAttribute('aria-expanded', 'false'); });
    if (menu && menu.classList.contains('is-open')) { menu.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  });
})();
