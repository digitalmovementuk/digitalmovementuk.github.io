// Re;mind — style variant 03, v1.1 (15 October 2026)
// Replicates the reference's measured behaviours (see NOTES.md, Motion inventory):
// 1. floating pill shown 3 s after window.onload (display flip, no transition);
// 2. desktop dropdowns = SmartMenus timing: open instantly after a 250 ms hover-intent, close after 500 ms with a 200 ms fade, click toggles;
// 3. mobile burger: full-width panel expands/collapses over 0.3 s (ease) with the burger/close icon swap;
// 4. mobile accordion for parent items: 200 ms slide (SmartMenus collapsible slideDown/slideUp).
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Floating "Talk to us" pill
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      var badge = document.getElementById('booking-badge');
      if (badge) badge.hidden = false;
    }, 3000);
  });

  // 2. Desktop dropdowns (hover-intent 250 ms, hide delay 500 ms, fade-out 200 ms, hideOnClick)
  document.querySelectorAll('.nav .has-sub').forEach(function (li) {
    var trigger = li.querySelector(':scope > a');
    var showTimer = null, hideTimer = null, fadeTimer = null;
    var setExpanded = function (v) { trigger.setAttribute('aria-expanded', v ? 'true' : 'false'); };
    var open = function () {
      window.clearTimeout(hideTimer); window.clearTimeout(fadeTimer);
      li.classList.remove('is-closing'); li.classList.add('is-open'); setExpanded(true);
    };
    var close = function (immediate) {
      window.clearTimeout(showTimer);
      if (immediate || reduce) { li.classList.remove('is-open', 'is-closing'); setExpanded(false); return; }
      li.classList.remove('is-open'); li.classList.add('is-closing'); setExpanded(false);
      fadeTimer = window.setTimeout(function () { li.classList.remove('is-closing'); }, 200);
    };
    li.addEventListener('mouseenter', function () {
      window.clearTimeout(hideTimer);
      if (li.classList.contains('is-open')) return;
      showTimer = window.setTimeout(open, 250);
    });
    li.addEventListener('mouseleave', function () {
      window.clearTimeout(showTimer);
      hideTimer = window.setTimeout(function () { close(false); }, 500);
    });
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (li.classList.contains('is-open')) close(true); else open();
    });
    li.addEventListener('focusin', open);
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) close(false); });
    li.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(true); trigger.focus(); } });
    // hideOnClick (SmartMenus): a click anywhere outside the open item fades it out over 200 ms
    document.addEventListener('click', function (e) { if (li.classList.contains('is-open') && !li.contains(e.target)) close(false); });
  });

  // 3. Mobile burger panel
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var openMenu = function () {
      menu.hidden = false;
      menu.style.setProperty('--menu-height', menu.scrollHeight + 'px');
      // next frame so the max-height transition runs from 0
      window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
      toggle.classList.add('is-active');
      toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close');
    };
    var closeMenu = function () {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Menu');
      if (reduce) menu.hidden = true;
    };
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
    });
    menu.addEventListener('transitionend', function (e) {
      if (e.target === menu && !menu.classList.contains('is-open')) menu.hidden = true;
    });

    // 4. Accordion for parent items inside the panel
    menu.querySelectorAll('.has-sub').forEach(function (li) {
      var a = li.querySelector(':scope > .sub-toggle, :scope > a');
      var sub = li.querySelector(':scope > .sub');
      if (!a || !sub) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = li.classList.toggle('is-open');
        a.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        sub.style.setProperty('--sub-height', sub.scrollHeight + 'px');
      });
    });
  }
})();
