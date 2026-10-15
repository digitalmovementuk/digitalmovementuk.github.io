/* Re;mind × Twofold variant — motion layer v2.0 (15.10.2026)
   Rebuilt on the reference's own stack: GSAP 3.13 + ScrollTrigger (cdnjs) and Lenis (jsDelivr).
   Every value below was measured on twofoldny.com with Playwright; see NOTES.md §4 (motion inventory).
   Falls back to final states without GSAP, and honours prefers-reduced-motion. */
(() => {
  const d = document, w = window;
  const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => w.matchMedia('(max-width: 1000px)').matches;
  const hasGsap = typeof w.gsap !== 'undefined';
  const ST = hasGsap && w.ScrollTrigger ? w.ScrollTrigger : null;
  if (hasGsap && ST) w.gsap.registerPlugin(ST);
  const motion = hasGsap && !reduce;
  if (!motion) d.documentElement.classList.add('no-motion');
  const vh = () => w.innerHeight;

  const header = d.getElementById('header');
  const hero = d.querySelector('.content-hero');
  const heroVideo = d.querySelector('.content-hero_video');
  const heroTitle = d.querySelector('.content-hero_title');
  const wm = d.querySelector('.wordmark');
  const wmText = d.querySelector('.wordmark-text');
  const wmSup = d.querySelector('.wordmark-sup');
  const wmLine = d.querySelector('.wordmark-line');
  const statement = d.getElementById('description');
  const words = Array.from(d.querySelectorAll('#description .w'));
  const paras = Array.from(d.querySelectorAll('.para'));

  /* 1. Wordmark: the reference's Lottie SVG is width:100% of the padded hero; scale the type to that inner width. */
  function fitWordmark() {
    if (!wm || !heroTitle) return;
    const cs = getComputedStyle(heroTitle);
    const avail = heroTitle.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    wm.style.fontSize = '100px';
    const measured = wm.getBoundingClientRect().width;
    if (measured > 0) wm.style.fontSize = (Math.floor((100 * avail / measured) * 100) / 100) + 'px';
  }

  /* 2. Lenis smooth scroll driven by the GSAP ticker (reference: html.lenis + GSAP ScrollTrigger). */
  let lenis = null;
  if (!reduce && typeof w.Lenis === 'function') {
    try {
      lenis = new w.Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
      if (motion) {
        lenis.on('scroll', () => ST && ST.update());
        w.gsap.ticker.add((t) => lenis.raf(t * 1000));
        w.gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (err) { lenis = null; }
  }

  /* 3. Scroll-driven (measured on the reference at 1440×900 and 393×660):
        hero title  y = −55.6 % of vh per viewport scrolled (linear scrub, stops at one viewport)
        hero image  y = −11.1 % of vh (same scrub)
        header      opacity scrubbed 0→1 between 0.755 vh and 1.0 vh (desktop: 0 @ 600, 0.317 @ 750, 1 @ 900 px), ≈ 0.97–1.36 vh on the phone
        photos      translateY = 80 px × (frame centre − viewport centre) / vh, linear, both frames
        statement   words from yPercent 100 / opacity 0 when the block's top reaches 40 % of the viewport, once */
  if (motion && ST) {
    w.gsap.to(heroTitle, { y: () => -vh() * 0.5556, ease: 'none', scrollTrigger: { start: 0, end: () => vh(), scrub: true, invalidateOnRefresh: true } });
    w.gsap.to(heroVideo, { y: () => -vh() * 0.1111, ease: 'none', scrollTrigger: { start: 0, end: () => vh(), scrub: true, invalidateOnRefresh: true } });
    w.gsap.fromTo(header, { opacity: 0 }, {
      opacity: 1, ease: 'none',
      scrollTrigger: {
        start: () => vh() * (mobile() ? 0.97 : 0.755), end: () => vh() * (mobile() ? 1.36 : 1.0), scrub: 0.1, invalidateOnRefresh: true,
        onEnter: () => header.classList.add('is-visible'), onLeaveBack: () => header.classList.remove('is-visible'),
      },
    });
    for (const el of paras) {
      const frame = el.parentElement;
      const travel = () => 80 * ((vh() + frame.offsetHeight) / 2) / vh();
      w.gsap.fromTo(el, { y: () => travel() }, { y: () => -travel(), ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    }
    if (words.length) {
      w.gsap.set(words, { yPercent: 100, opacity: 0 });
      ST.create({ trigger: statement, start: 'top 40%', once: true, onEnter: () => w.gsap.to(words, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power4.out', stagger: 0.06 }) });   /* measured fit: 0.5 s power4.out, ≈ 60 ms per word */
    }
  } else {
    words.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    const onScroll = () => { const on = w.scrollY > vh() * 0.73; header.classList.toggle('is-visible', on); header.style.opacity = on ? '1' : '0'; };
    w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* 4. Hover underlines (measured: in 0.35 s expo.out from the left, out 0.3 s expo.out towards the right). */
  function underline(linkSel, ulSel) {
    d.querySelectorAll(linkSel).forEach((a) => {
      const u = a.querySelector(ulSel); if (!u) return;
      const on = () => { if (hasGsap) w.gsap.to(u, { scaleX: 1, duration: reduce ? 0 : 0.35, ease: 'expo.out', transformOrigin: '0% 50%', overwrite: true }); else { u.style.transformOrigin = '0% 50%'; u.style.transform = 'scaleX(1)'; } };
      const off = () => { if (hasGsap) w.gsap.to(u, { scaleX: 0, duration: reduce ? 0 : 0.3, ease: 'expo.out', transformOrigin: '100% 50%', overwrite: true }); else { u.style.transformOrigin = '100% 50%'; u.style.transform = 'scaleX(0)'; } };
      a.addEventListener('mouseenter', on); a.addEventListener('mouseleave', off);
      a.addEventListener('focus', on); a.addEventListener('blur', off);
    });
  }
  underline('.menu-link', '.menu-link-underline');
  underline('.menu-link-services', '.menu-link-services-line-underline');

  /* 5. Hover image on the service rows (measured: fixed, left = cursor − 25 % of its width, top = cursor − 31 px with translateY(−100 %),
        opacity 0.2 s, gone when the cursor leaves the row). Desktop pointers only; the phone shows the image inline. */
  const hover = d.querySelector('.hover-image');
  const hImg = hover ? hover.querySelector('img') : null;
  if (hover && hImg && w.matchMedia('(hover: hover)').matches) {
    const place = (x, y) => { const wd = hover.offsetWidth || 279; hover.style.left = Math.round(x - wd * 0.25) + 'px'; hover.style.top = Math.round(y - 31) + 'px'; };
    d.querySelectorAll('.content-01__service').forEach((row) => {
      row.addEventListener('mouseenter', (e) => {
        if (mobile()) return;
        const src = row.getAttribute('data-image');
        if (src && hImg.getAttribute('src') !== src) hImg.setAttribute('src', src);
        place(e.clientX, e.clientY); hover.style.opacity = '1';
      });
      row.addEventListener('mousemove', (e) => place(e.clientX, e.clientY));
      row.addEventListener('mouseleave', () => { hover.style.opacity = '0'; });
    });
  }

  /* 6. Phone popup menu (reference: opacity 0.5 s ease-in-out, CSS). */
  const btn = d.querySelector('.menu-button');
  const popup = d.getElementById('popup-menu');
  if (btn && popup) {
    const label = btn.querySelector('.menu-link-text');
    const setOpen = (open) => { popup.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (label) label.textContent = open ? 'Close' : 'Menu'; };
    btn.addEventListener('click', () => setOpen(!popup.classList.contains('is-open')));
    popup.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* 7. Load sequence (measured: page-enter 1.5 s CSS; hero opacity 0 → 1 over ≈ 0.5 s once the video can play (≈ 1.2 s after navigation), here once fonts are ready;
        Lottie wordmark draws left → right in ≈ 1 s with a baseline stroke running ahead and the superscript last; photos fade in 0.6 s on load). */
  function start() {
    fitWordmark();
    d.documentElement.classList.add('is-loaded');
    if (motion) {
      /* Reference frames (120 ms steps): hero grey fades in 1.2–1.4 s; baseline stroke runs left → right from 1.5 s with the letters
         drawing behind it to 2.1 s; the stroke retracts into the right end 2.2–2.5 s and the superscript appears 2.5–2.7 s. */
      const tl = w.gsap.timeline({ delay: 0.45 });
      tl.to(hero, { opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 0);   /* measured: 0.0031 → 0.98 in ≈ 0.42 s, S-curve */
      if (wmLine) tl.fromTo(wmLine, { scaleX: 0, opacity: 1, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.75, ease: 'power2.inOut' }, 0.4);
      if (wmText) tl.fromTo(wmText, { clipPath: 'inset(-5% 100% -10% 0)' }, { clipPath: 'inset(-5% 0% -10% 0)', duration: 0.85, ease: 'power2.inOut' }, 0.6);
      if (wmLine) tl.set(wmLine, { transformOrigin: '100% 50%' }, 1.5).to(wmLine, { scaleX: 0, duration: 0.4, ease: 'power2.inOut' }, 1.5);
      if (wmSup) tl.fromTo(wmSup, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 1.8);
    } else if (hero) {
      hero.style.opacity = '1';
    }
    d.querySelectorAll('.dx-set').forEach((set) => {
      const img = set.querySelector('img');
      const done = () => set.classList.add('loaded');
      if (!img || img.complete) done(); else img.addEventListener('load', done, { once: true });
    });
    if (ST) ST.refresh();
    setTimeout(() => { fitWordmark(); if (ST) ST.refresh(); }, 350);
  }
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(start, start);
  w.addEventListener('resize', () => { fitWordmark(); if (ST) ST.refresh(); });
})();
