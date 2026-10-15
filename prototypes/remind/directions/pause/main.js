/* Re;mind — style variant 05 "here. psychology" — v1.0, 15 October 2026
   Reference behaviour (behere.co script.js): the toggler opens/closes the mobile overlay menu and
   turns the two lines into a cross. Everything else (logo collapse, hovers) is CSS. */
(function () {
  'use strict';
  var toggler = document.getElementById('navbar-toggler');
  var menu = document.getElementById('mobile-nav');
  if (!toggler || !menu) { return; }

  function setOpen(open) {
    toggler.classList.toggle('open', open);
    menu.classList.toggle('show', open);
    toggler.setAttribute('aria-expanded', open ? 'true' : 'false');
    // the reference does not lock page scrolling behind the overlay
  }

  toggler.addEventListener('click', function () {
    setOpen(!menu.classList.contains('show'));
  });

  // close on Escape and when a menu link is chosen
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('show')) { setOpen(false); toggler.focus(); }
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { setOpen(false); }
  });

  // close the overlay if the viewport grows past the mobile breakpoint
  var mq = window.matchMedia('(min-width: 768px)');
  (mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange));
  function onChange(ev) { if (ev.matches) { setOpen(false); } }
})();

/* On-page anchors: the reference animates scrollTop over 1500 ms with jQuery's "swing" easing and then
   focuses the target (script.js). Rebuilt in vanilla JS; reduced motion jumps instead. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var swing = function (t) { return 0.5 - Math.cos(Math.PI * t) / 2; };
  var raf = null;

  function scrollToY(targetY, duration, done) {
    if (raf) { cancelAnimationFrame(raf); }
    var startY = window.pageYOffset, delta = targetY - startY, t0 = null;
    if (reduced.matches || duration === 0 || Math.abs(delta) < 1) { window.scrollTo(0, targetY); if (done) { done(); } return; }
    function step(ts) {
      if (t0 === null) { t0 = ts; }
      var p = Math.min(1, (ts - t0) / duration);
      window.scrollTo(0, startY + delta * swing(p));
      if (p < 1) { raf = requestAnimationFrame(step); } else { raf = null; if (done) { done(); } }
    }
    raf = requestAnimationFrame(step);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#' || a.classList.contains('smooth-page')) { return; }
    var target = document.querySelector(a.getAttribute('href'));
    if (!target) { return; }
    e.preventDefault();
    var y = target.getBoundingClientRect().top + window.pageYOffset;
    scrollToY(y, 1500, function () {
      if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); }
      target.focus({ preventScroll: true });
      if (history.replaceState) { history.replaceState(null, '', a.getAttribute('href')); }
    });
  });

  window.remindScrollToY = scrollToY;
})();

/* Lazy-load fade (reference: WP Smush adds .lazyloaded when an image has loaded; CSS fades opacity 0 → 1 in 0.4 s). */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('img.lazyload'), function (img) {
    var done = function () { img.classList.add('lazyloaded'); };
    if (img.complete && img.naturalWidth) { requestAnimationFrame(done); } else { img.addEventListener('load', done); img.addEventListener('error', done); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('.wrapper-image-overflow.lazyload'), function (el) {
    var src = el.getAttribute('data-bg');
    if (!src) { var mm = /url\(["']?([^"')]+)["']?\)/.exec(el.style.backgroundImage || getComputedStyle(el).backgroundImage); src = mm ? mm[1] : null; }
    if (!src) { el.classList.add('lazyloaded'); return; }
    var probe = new Image();
    probe.onload = probe.onerror = function () { el.classList.add('lazyloaded'); };
    probe.src = src;
  });
})();

/* smoothState emulation (reference main.js: onStart 250 ms adds .is-exiting to #main and restarts the CSS
   animations; onReady swaps the content and scrolls to the top). This prototype has one page, so a page link
   holds for the same 250 ms with the same exit classes, then jumps to its section as the "new page" would. */
(function () {
  'use strict';
  var main = document.getElementById('main');
  if (!main) { return; }
  var busy = false;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.smooth-page');
    if (!a || busy) { return; }
    var href = a.getAttribute('href');
    var target = href === '#' ? document.body : document.querySelector(href);
    if (!target) { return; }
    e.preventDefault();
    busy = true;
    main.classList.remove('is-exiting'); void main.offsetWidth;      // restartCSSAnimations
    main.classList.add('is-exiting');
    setTimeout(function () {
      main.classList.remove('is-exiting');
      var y = href === '#' ? 0 : target.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo(0, y);
      if (history.replaceState) { history.replaceState(null, '', href === '#' ? location.pathname : href); }
      busy = false;
    }, 250);
  });
})();

/* Side menu over images: toggle .is-over-image on .wrapper-menu-side while its fixed list overlaps the hero image or a
   section image (rAF-throttled scroll/resize check). Links then read white over the photo, green over the flat colour. */
(function () {
  'use strict';
  var side = document.querySelector('.wrapper-menu-side');
  var list = side && side.querySelector('.nav-list');
  if (!side || !list) { return; }
  var images = Array.prototype.slice.call(document.querySelectorAll('.wrapper-image-overflow, .section__banner figure img'));
  var ticking = false;
  function check() {
    ticking = false;
    if (getComputedStyle(side).display === 'none') { side.classList.remove('is-over-image'); return; }
    var r = list.getBoundingClientRect();
    var over = images.some(function (img) {
      var b = img.getBoundingClientRect();
      return b.width > 0 && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
    });
    side.classList.toggle('is-over-image', over);
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  request();
})();
