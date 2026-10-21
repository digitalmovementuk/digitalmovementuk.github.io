/* Kißelbach Bestattungen · Prototyp v1.2
   Progressive enhancement only: the page is complete without this file.
   Motion follows native scrolling (no scroll-jacking), runs once per element,
   and switches off for prefers-reduced-motion or the visitor's own toggle. */
(() => {
  'use strict';

  window.__kbReady = true;
  const d = document;
  const root = d.documentElement;
  const $ = (sel, ctx = d) => ctx.querySelector(sel);
  const $$ = (sel, ctx = d) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get: (k, s = localStorage) => { try { return s.getItem(k); } catch { return null; } },
    set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch { /* private mode */ } },
  };

  /* ---------- motion preference ---------- */
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  if (store.get('kb-motion') === 'off') root.dataset.motion = 'off';
  const motionOff = () => reduceMQ.matches || root.dataset.motion === 'off';

  /* ---------- privacy-friendly event hooks (DEV-17) ---------- */
  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => window.dataLayer.push({ event, ...params });
  d.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) track(el.dataset.track, { location: el.dataset.loc || '' });
  });

  /* ---------- split headings into masked words (visual copy only) ----------
     Screen readers get one sr-only copy of the full heading; the animated copy is
     aria-hidden. Inline markup such as the italic <em> accent is kept intact. */
  $$('[data-split]').forEach((h) => {
    const full = h.textContent.replace(/\s+/g, ' ').trim();
    const vis = d.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    let i = 0;
    const words = (text, parent) => {
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { parent.appendChild(d.createTextNode(' ')); return; }
        const outer = d.createElement('span');
        outer.className = 'w';
        const inner = d.createElement('span');
        inner.className = 'wi';
        inner.style.setProperty('--i', i++);
        inner.textContent = part;
        outer.appendChild(inner);
        parent.appendChild(outer);
      });
    };
    const walk = (node, parent) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) words(n.textContent, parent);
        else if (n.nodeType === Node.ELEMENT_NODE) {
          const copy = n.cloneNode(false);
          copy.removeAttribute('id');
          parent.appendChild(copy);
          walk(n, copy);
        }
      });
    };
    walk(h, vis);
    const isBlank = (n) => n && n.nodeType === Node.TEXT_NODE && !n.textContent.trim();
    while (isBlank(vis.firstChild)) vis.firstChild.remove();
    while (isBlank(vis.lastChild)) vis.lastChild.remove();
    const sr = d.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = full;
    h.replaceChildren(sr, vis);
  });

  /* ---------- reveal once on entering the viewport ---------- */
  const revealEls = $$('.reveal, .reveal-media, .reveal-ring, [data-split]');
  $$('.voices-grid, .service-cards').forEach((group) => {
    $$('.reveal, .reveal-media', group).forEach((el, i) => el.style.setProperty('--d', `${i * 110}ms`));
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- night section: the visitor's own local time ---------- */
  const nowWrap = $('[data-now]');
  if (nowWrap) {
    const t = $('[data-now-time]', nowWrap);
    const fallback = $('[data-now-fallback]');
    const setNow = () => {
      const n = new Date();
      const hm = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
      t.textContent = hm;
      t.dateTime = hm;
    };
    setNow();
    nowWrap.hidden = false;
    if (fallback) fallback.hidden = true;
    setInterval(setNow, 20000);
  }

  /* ---------- one scroll loop for all scroll-linked effects ---------- */
  const header = $('[data-header]');
  const hero = $('[data-hero]');
  const steps = $('[data-steps]');
  const stepItems = steps ? $$('.step', steps) : [];
  const film = $('[data-film]');
  const filmLines = film ? $$('.film-line', film) : [];
  const parallax = $$('[data-parallax]');
  let ticking = false;
  let vh = innerHeight;

  // progress of an element through the viewport: 0 = top edge at viewport bottom, 1 = bottom edge at viewport top
  const through = (r) => clamp((vh - r.top) / (vh + r.height));

  function frame() {
    ticking = false;
    const y = scrollY;
    const max = d.documentElement.scrollHeight - vh;
    root.style.setProperty('--page-p', max > 0 ? (y / max).toFixed(4) : 0);
    header && header.classList.toggle('is-scrolled', y > 8);

    if (motionOff()) return;

    if (hero) {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--hero-p', clamp(-r.top / r.height).toFixed(4));
    }

    // light line: fills as the steps pass the reading line (60 % of the viewport)
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = clamp((vh * 0.6 - r.top) / r.height);
      steps.style.setProperty('--p', p.toFixed(4));
      steps.style.setProperty('--spark-o', p > 0.01 && p < 0.995 ? 1 : 0);
      const top = r.top;
      stepItems.forEach((li) => {
        const lr = li.getBoundingClientRect();
        li.classList.toggle('is-lit', (lr.top - top + 24) / r.height <= p + 0.001);
      });
    }

    // film: the frame opens from an inset card to full bleed; the quote follows line by line (once)
    if (film) {
      const r = film.getBoundingClientRect();
      const enter = clamp((vh - r.top) / (vh * 0.85));
      const inset = (1 - enter) * Math.min(64, innerWidth * 0.05);
      film.style.setProperty('--film-inset', `${inset.toFixed(1)}px`);
      film.style.setProperty('--film-radius', `${((1 - enter) * 32).toFixed(1)}px`);
      film.style.setProperty('--film-p', enter.toFixed(4));
      filmLines.forEach((ln, i) => { if (enter > 0.42 + i * 0.16) ln.classList.add('is-in'); });
    }

    // image parallax (images only, never text)
    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const strength = parseFloat(el.dataset.parallax) || 0.06;
      const shift = (through(r) - 0.5) * -2 * strength * r.height;
      el.style.setProperty('--py', `${shift.toFixed(1)}px`);
    });
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; request(); }, { passive: true });

  function applyStill() {
    if (steps) { steps.style.setProperty('--p', 1); steps.style.setProperty('--spark-o', 0); stepItems.forEach((li) => li.classList.add('is-lit')); }
    if (film) { film.style.setProperty('--film-inset', '0px'); film.style.setProperty('--film-radius', '0px'); film.style.setProperty('--film-p', 1); }
    filmLines.forEach((ln) => ln.classList.add('is-in'));
    parallax.forEach((el) => el.style.setProperty('--py', '0px'));
    if (hero) hero.style.setProperty('--hero-p', 0);
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- scrollspy: nav indicator ---------- */
  const navLinks = $$('.nav-desktop a');
  const indicator = $('.nav-indicator');
  const navTargets = navLinks.map((a) => d.getElementById(a.hash.slice(1))).filter(Boolean);
  function moveIndicator(link) {
    if (!indicator) return;
    if (!link) { indicator.style.setProperty('--ni-o', 0); return; }
    const navBox = link.closest('nav').getBoundingClientRect();
    const box = link.getBoundingClientRect();
    indicator.style.setProperty('--ni-x', `${box.left - navBox.left}px`);
    indicator.style.setProperty('--ni-w', `${box.width}px`);
    indicator.style.setProperty('--ni-o', 1);
  }
  if ('IntersectionObserver' in window && navTargets.length) {
    const visible = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => visible.set(en.target.id, en.isIntersecting));
      const current = navTargets.find((t) => visible.get(t.id));
      navLinks.forEach((a) => {
        const on = current && a.hash === `#${current.id}`;
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      moveIndicator(current ? navLinks.find((a) => a.hash === `#${current.id}`) : null);
    }, { rootMargin: '-45% 0px -50% 0px' });
    navTargets.forEach((t) => spy.observe(t));
  }

  /* ---------- burial-form chapters: still image, caption and ground tone follow the text ---------- */
  const chapters = $('[data-chapters]');
  const toneSection = $('[data-tones]');
  if (chapters && 'IntersectionObserver' in window) {
    const frames = $$('[data-frame]', chapters);
    const ticks = $$('[data-tick]', chapters);
    const items = $$('[data-chapter]', chapters);
    const capNum = $('[data-caption-num]', chapters);
    const capText = $('[data-caption-text]', chapters);
    const activate = (n) => {
      frames.forEach((f) => f.classList.toggle('is-active', f.dataset.frame === n));
      ticks.forEach((t) => t.classList.toggle('is-active', t.dataset.tick === n));
      items.forEach((c) => c.classList.toggle('is-active', c.dataset.chapter === n));
      const item = items.find((c) => c.dataset.chapter === n);
      if (!item) return;
      if (toneSection) toneSection.dataset.tone = item.dataset.tone;
      if (capNum && capText) { capNum.textContent = String(Number(n) + 1).padStart(2, '0'); capText.textContent = item.dataset.caption; }
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) activate(en.target.dataset.chapter); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    items.forEach((c) => cio.observe(c));
    activate('0');
  }

  /* ---------- film: muted ambient loop, pausable, poster when motion is off ---------- */
  const video = $('[data-film-video]');
  const toggle = $('[data-film-toggle]');
  const motes = createMotes($('[data-motes]'));
  let filmInView = false;
  let userPaused = store.get('kb-film', sessionStorage) === 'paused';
  const setToggle = (paused) => {
    toggle.setAttribute('aria-pressed', String(paused));
    $('.film-toggle-label', toggle).textContent = paused ? 'Video abspielen' : 'Video anhalten';
  };
  function syncFilm() {
    if (!video) return;
    const shouldPlay = filmInView && !userPaused && !motionOff();
    if (shouldPlay) {
      if (video.preload !== 'auto') video.preload = 'auto';
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
      motes.start();
    } else {
      video.pause();
      motes.stop();
    }
    setToggle(userPaused || motionOff());
  }
  if (video && film) {
    new IntersectionObserver(([en]) => { filmInView = en.isIntersecting; syncFilm(); }, { threshold: 0.2 }).observe(film);
    toggle.addEventListener('click', () => {
      const paused = toggle.getAttribute('aria-pressed') === 'true';
      if (paused && motionOff()) {
        // voluntary playback is allowed even when motion is reduced (DEV-2)
        userPaused = false; store.set('kb-film', 'playing', sessionStorage);
        video.preload = 'auto'; video.play().catch(() => {});
        setToggle(false);
        return;
      }
      userPaused = !paused;
      store.set('kb-film', userPaused ? 'paused' : 'playing', sessionStorage);
      if (userPaused) video.pause();
      syncFilm();
    });
  }

  // a few slow points of light drifting through the canopy (canvas, paused off-screen)
  function createMotes(canvas) {
    const noop = { start() {}, stop() {} };
    if (!canvas || !canvas.getContext) return noop;
    const ctx = canvas.getContext('2d');
    let raf = 0; let parts = []; let w = 0; let h = 0; let dpr = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(clamp(w / 40, 14, 34));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8,
        vy: -(0.06 + Math.random() * 0.16), vx: (Math.random() - 0.5) * 0.08,
        a: 0.15 + Math.random() * 0.45, t: Math.random() * Math.PI * 2,
      }));
    };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.t += 0.006; p.x += p.vx + Math.sin(p.t) * 0.05; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(255, 228, 170, ${p.a * (0.7 + 0.3 * Math.sin(p.t * 3))})`);
        g.addColorStop(1, 'rgba(255, 228, 170, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    addEventListener('resize', () => { if (raf) resize(); }, { passive: true });
    return {
      start() { if (raf) return; resize(); raf = requestAnimationFrame(tick); },
      stop() { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, w, h); },
    };
  }

  /* ---------- floating call dock (UX-12, DEV-15) ---------- */
  const dock = $('[data-dock]');
  const wa = $('[data-whatsapp]');
  if (dock && 'IntersectionObserver' in window) {
    const state = { hero: true, contact: false, footer: false, formFocus: false, dismissed: store.get('kb-dock', sessionStorage) === 'closed' };
    const render = () => {
      const show = !state.hero && !state.contact && !state.footer && !state.formFocus && !state.dismissed;
      dock.classList.toggle('is-visible', show);
      dock.setAttribute('aria-hidden', String(!show));
      dock.inert = !show;
      root.classList.toggle('dock-on', show);
      if (wa) wa.classList.toggle('is-hidden', state.formFocus);   // never under a hand that is typing
    };
    const watch = (el, key) => el && new IntersectionObserver(([en]) => { state[key] = en.isIntersecting; render(); }, { threshold: 0 }).observe(el);
    watch(hero, 'hero');
    watch($('[data-contact]'), 'contact');
    watch($('[data-footer]'), 'footer');
    d.addEventListener('focusin', (e) => { if (e.target.closest('form, .nav-mobile')) { state.formFocus = true; render(); } });
    d.addEventListener('focusout', (e) => { if (e.target.closest('form, .nav-mobile')) { state.formFocus = false; setTimeout(render, 60); } });
    $('[data-dock-close]', dock).addEventListener('click', () => {
      state.dismissed = true; store.set('kb-dock', 'closed', sessionStorage); render();
      const main = $('#inhalt'); if (main) main.focus?.({ preventScroll: true });
    });
    render();
  }

  /* ---------- mobile menu: close after choosing ---------- */
  const menu = $('[data-menu]');
  if (menu) {
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.removeAttribute('open'); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.removeAttribute('open'); $('summary', menu).focus(); } });
    d.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.removeAttribute('open'); });
  }

  /* ---------- hero callback on mobile: one tap opens the form inline ---------- */
  const panel = $('[data-callback-panel]');
  const panelToggle = $('[data-callback-toggle]');
  if (panel && panelToggle) {
    panelToggle.setAttribute('aria-expanded', String(!panel.classList.contains('is-collapsed')));
    panelToggle.addEventListener('click', () => {
      const open = panel.classList.toggle('is-collapsed') === false;
      panelToggle.setAttribute('aria-expanded', String(open));
      if (open) {
        track('callback_start', { location: 'hero-toggle' });
        panel.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => $('input[name="name"]', panel)?.focus({ preventScroll: true }), motionOff() ? 0 : 450);
      }
    });
  }

  /* ---------- topic hand-over: "Rückruf für die Vorsorge" pre-selects the topic ---------- */
  $$('[data-topic]').forEach((a) => a.addEventListener('click', () => {
    const radio = d.getElementById(`contact-anliegen-${a.dataset.topic.toLowerCase()}`);
    if (radio) radio.checked = true;
    setTimeout(() => $('#contact-name')?.focus({ preventScroll: true }), motionOff() ? 0 : 700);
  }));

  /* ---------- callback forms ---------- */
  const PHONE = ($('.header-call-number')?.textContent || '').trim();
  const telHref = () => esc(PHONE.replace(/[^\d+]/g, '').replace(/^0/, '+49'));
  const FAILED = 'Ihre Rückrufbitte konnte leider nicht gesendet werden.';
  const messages = {
    name: 'Bitte geben Sie Ihren Namen an.',
    telefon: 'Bitte geben Sie eine Telefonnummer an, unter der ich Sie erreiche.',
    einwilligung: 'Bitte stimmen Sie zu, damit ich Sie zurückrufen darf.',
  };
  function setError(form, field, msg) {
    const input = form.elements[field];
    if (!input) return;
    const err = d.getElementById(input.getAttribute('aria-describedby'));
    if (msg) { input.setAttribute('aria-invalid', 'true'); if (err) { err.textContent = msg; err.hidden = false; } }
    else { input.removeAttribute('aria-invalid'); if (err) { err.textContent = ''; err.hidden = true; } }
  }
  function validate(form) {
    const f = form.elements;
    const errors = {};
    const name = f.name.value.trim();
    const digits = f.telefon.value.replace(/\D/g, '');
    if (name.length < 2) errors.name = messages.name;
    if (!/^[0-9+()/.\s-]+$/.test(f.telefon.value.trim()) || digits.length < 6 || digits.length > 20) errors.telefon = messages.telefon;
    if (!f.einwilligung.checked) errors.einwilligung = messages.einwilligung;
    ['name', 'telefon', 'einwilligung'].forEach((k) => setError(form, k, errors[k]));
    return errors;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  $$('[data-callback-form]').forEach((form) => {
    const status = $('.form-status', form);
    let started = false;
    form.addEventListener('focusin', () => { if (!started) { started = true; track('callback_start', { location: form.dataset.loc }); } });
    const recheck = (e) => {
      if (e.target.getAttribute('aria-invalid') !== 'true' && !form.querySelector('[aria-invalid="true"]')) return;
      if (!Object.keys(validate(form)).length) status.textContent = ''; // everything corrected: the notice goes too
    };
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errors = validate(form);
      if (Object.keys(errors).length) {
        status.innerHTML = '<span class="notice notice-error">Bitte prüfen Sie die markierten Angaben.</span>';
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      if (d.documentElement.dataset.preview === 'static') {
        // static preview (GitHub Pages): no server receives the request, so never show a success state
        status.innerHTML = `<span class="notice notice-ok">Dies ist eine Vorschau der neuen Website. Rückrufbitten werden hier noch nicht übermittelt. Bitte rufen Sie mich direkt an, rund um die Uhr: <a href="tel:${telHref()}" data-track="tel_click" data-loc="preview">${esc(PHONE)}</a></span>`;
        return;
      }
      form.classList.add('is-loading');
      $('.btn-submit-label', form).textContent = 'Wird gesendet …';
      status.textContent = '';
      const data = Object.fromEntries(new FormData(form));
      data.einwilligung = form.elements.einwilligung.checked;

      let ok = false; let message = ''; let fieldErrors = null;
      try {
        if (location.protocol === 'file:') {
          // opened straight from disk: the server is not running — show the designed success state
          await new Promise((r) => setTimeout(r, 900));
          ok = true;
        } else {
          const res = await fetch(form.action, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data),
          });
          const body = await res.json().catch(() => ({}));
          ok = res.ok && body.ok; message = body.message || ''; fieldErrors = body.errors || null;
        }
      } catch {
        message = '';
      }
      form.classList.remove('is-loading');
      $('.btn-submit-label', form).textContent = 'Rückruf anfordern';

      if (ok) {
        track('callback_success', { location: form.dataset.loc, topic: data.anliegen || '' });
        const when = data.zeit ? ` ${esc(data.zeit.toLowerCase())}` : ' so bald wie möglich';
        const card = form.closest('.callback-card');
        const box = d.createElement('div');
        box.className = 'callback-success';
        box.tabIndex = -1;
        box.innerHTML = `<div class="success-mark"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></div>
          <h3>Vielen Dank.</h3>
          <p>Ihre Rückrufbitte ist angekommen. Ich rufe Sie${when} unter <strong>${esc(data.telefon.trim())}</strong> zurück.</p>
          <p>Ist es dringend? Dann rufen Sie mich direkt an: <a href="tel:${telHref()}" data-track="tel_click" data-loc="success">${esc(PHONE)}</a></p>`;
        $$(':scope > :not(.callback-success)', card).forEach((el) => { el.hidden = true; });
        card.appendChild(box);
        box.focus({ preventScroll: true });
        return;
      }
      if (fieldErrors) Object.entries(fieldErrors).forEach(([k, v]) => setError(form, k, v));
      status.innerHTML = `<span class="notice notice-error">${esc(message || FAILED)} Sie erreichen mich jederzeit telefonisch: <a href="tel:${telHref()}">${esc(PHONE)}</a></span>`;
      (form.querySelector('[aria-invalid="true"]') || status).focus?.();
    });
  });

  /* ---------- "Bewegungen reduzieren" ---------- */
  const motionBtn = $('[data-motion-toggle]');
  const syncMotion = () => {
    const off = motionOff();
    if (motionBtn) motionBtn.setAttribute('aria-pressed', String(off));
    if (off) applyStill(); else request();
    syncFilm();
  };
  motionBtn?.addEventListener('click', () => {
    if (root.dataset.motion === 'off') { delete root.dataset.motion; store.set('kb-motion', 'on'); }
    else { root.dataset.motion = 'off'; store.set('kb-motion', 'off'); }
    syncMotion();
  });
  reduceMQ.addEventListener?.('change', syncMotion);

  root.classList.add('js');
  syncMotion();
  frame();
})();
