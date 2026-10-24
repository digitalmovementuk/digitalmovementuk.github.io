/* CEx case study — chart kit motion. Version v1.0 — 2026-10-24.
   Dependency-free. The charts are complete without this file: the CSS draws
   every bar, unit and cell at full data size. Under html.js the stylesheet
   holds them at zero until this script sets .is-in on first view, so the only
   job here is to add that class at the right moment. One global:
   window.dmCaseCharts.init(root) for charts inserted after load. */
(function () {
  'use strict';

  var SELECTOR = '.dm-chart';
  var FLAG = 'data-dmc-observed';

  function reveal(el) {
    el.classList.add('is-in');
  }

  function collect(root) {
    var list = [];
    if (root && root.nodeType === 1 && root.matches && root.matches(SELECTOR)) list.push(root);
    var found = root && root.querySelectorAll ? root.querySelectorAll(SELECTOR) : [];
    for (var i = 0; i < found.length; i++) list.push(found[i]);
    return list.filter(function (el) {
      return !el.classList.contains('is-in') && !el.hasAttribute(FLAG);
    });
  }

  function init(root) {
    var charts = collect(root || document);
    if (!charts.length) return;

    var js = document.documentElement.classList.contains('js');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canObserve = 'IntersectionObserver' in window;

    // No html.js: the CSS already shows everything, so the class is only bookkeeping.
    // Reduced motion or no observer: show at once, no grow-in.
    if (!js || reduce || !canObserve) {
      charts.forEach(reveal);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.2 });

    charts.forEach(function (el) {
      el.setAttribute(FLAG, '');
      io.observe(el);
    });
  }

  window.dmCaseCharts = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }
})();
