/* Runs before first paint: marks JS as available so the entrance motion starts
   cleanly. If site.js does not arrive within 3 s, the class is removed again and
   the page shows its complete still state (DEV-1). */
(function () {
  var r = document.documentElement;
  r.classList.add('js');
  try { if (localStorage.getItem('kb-motion') === 'off') r.setAttribute('data-motion', 'off'); } catch (e) {}
  setTimeout(function () { if (!window.__kbReady) r.classList.remove('js'); }, 3000);
})();
