/* Runs before first paint: marks JS as available so the entrance motion starts
   cleanly. If site.js does not arrive within 3 s, the class is removed again and
   the page shows its complete still state (DEV-1). */
(function () {
  var r = document.documentElement;
  r.classList.add('js');
  try { if (localStorage.getItem('kb-motion') === 'off') r.setAttribute('data-motion', 'off'); } catch (e) {}
  setTimeout(function () { if (!window.__kbReady) r.classList.remove('js'); }, 3000);
})();

/* static copy opened from disk (file://): browsers refuse web fonts there (CORS, origin "null"); the same faces come embedded
   in fonts-file.css. On a web server this does nothing. Added by link-vorschau/build-site-v1.5.mjs. */
(function () {
  if (location.protocol !== 'file:' || !document.currentScript) return;
  try { document.write('<link rel="stylesheet" href="' + new URL('../css/fonts-file.css', document.currentScript.src).href + '">'); } catch (e) {}
})();
