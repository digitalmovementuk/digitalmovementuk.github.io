/* CEx case study — motion. Version v1.0 — 2026-10-24.
   Dependency-free. Content is fully visible without this file; the
   hide-until-revealed styles apply only under html.js, which index.html sets
   inline and which this script removes again if the page cannot observe. */
(function () {
  'use strict';

  var root = document.documentElement;
  var main = document.querySelector('.dm-case');
  if (!main) { root.classList.remove('js'); return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;

  if (!canObserve) {
    root.classList.remove('js');
    return;
  }

  /* ---- Hero entrance ---- */
  var hero = main.querySelector('.dm-hero');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add('is-in');
        setTimeout(function () { hero.classList.add('is-settled'); }, 1200);
      });
    });
  }

  /* ---- Scroll reveals (≤ .6 s, no scroll-driven animation) ---- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  Array.prototype.forEach.call(main.querySelectorAll('.dm-reveal'), function (el) { revealIO.observe(el); });

  /* ---- Count-up figures ---- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var finalText = el.textContent;
    if (isNaN(target) || reduce) { el.textContent = finalText; return; }
    var useComma = finalText.indexOf(',') !== -1;
    var dur = 600, start = null;
    function fmt(n) {
      var s = String(Math.round(n));
      return useComma ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s;
    }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = finalText;
    }
    requestAnimationFrame(step);
  }
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        countUp(e.target);
        countIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  Array.prototype.forEach.call(main.querySelectorAll('[data-count]'), function (el) { countIO.observe(el); });

  /* ---- Parallax depth between the browser and the phone (pointer devices only) ---- */
  var devices = hero && hero.querySelector('.dm-devices');
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 960px)').matches;
  if (devices && fine && !reduce) {
    var browser = devices.querySelector('.dm-browser');
    var phone = devices.querySelector('.dm-phone');
    var mx = 0, my = 0, sy = 0, ticking = false;

    function apply() {
      ticking = false;
      // pointer: browser drifts a little, phone a little more; scroll: phone rises faster than the browser
      browser.style.setProperty('--px', (mx * -6).toFixed(1) + 'px');
      browser.style.setProperty('--py', (my * -4 + sy * -0.02).toFixed(1) + 'px');
      phone.style.setProperty('--qx', (mx * 12).toFixed(1) + 'px');
      phone.style.setProperty('--qy', (my * 8 + sy * -0.08).toFixed(1) + 'px');
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }

    hero.addEventListener('pointermove', function (ev) {
      var r = hero.getBoundingClientRect();
      mx = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      my = ((ev.clientY - r.top) / r.height - 0.5) * 2;
      request();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mx = 0; my = 0; request(); }, { passive: true });
    window.addEventListener('scroll', function () {
      var r = devices.getBoundingClientRect();
      // only while the devices are on screen; clamp to a gentle range
      var visible = r.bottom > 0 && r.top < window.innerHeight;
      sy = visible ? Math.max(-400, Math.min(400, window.innerHeight - r.top - r.height / 2)) * -0.5 : 0;
      request();
    }, { passive: true });
  }
})();
