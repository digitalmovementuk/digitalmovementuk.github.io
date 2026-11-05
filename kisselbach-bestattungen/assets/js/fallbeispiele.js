/* Kißelbach Bestattungen · page script /fallbeispiele/ · v1.0 (04.11.2026) · examples builder (Claude Opus 5.5)
   One job: land on the case named in the address (/fallbeispiele/#auf-see …) when the browser did not.
   Cause (render QA LST-QA-01, measured 04.11.2026): on a warm visit from another page (the „Ein Fallbeispiel dazu“
   links on /leistungen/), WebKit parses this page before fallbeispiele.css has arrived and then drops its initial
   fragment scroll; the page stays at the top. A 150 ms delay on the stylesheet reproduces it 4 of 4 times, an
   instant stylesheet lands 4 of 4 times; Chrome is not affected.
   Rule: act once after load, only if the page is still at the top, the target lies below the first screen and the
   visitor has not scrolled, tapped or used the keyboard meanwhile. Scrolls without animation (honours scroll-margin
   and the header's scroll-padding). Everything else on the page works without this file. */
(() => {
  'use strict';
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;

  let visitorMoved = false;
  const moved = () => { visitorMoved = true; };
  ['wheel', 'touchstart', 'keydown'].forEach((type) => addEventListener(type, moved, { once: true, passive: true }));

  const land = () => {
    if (visitorMoved || scrollY > 8) return;                                 // the browser (or the visitor) already moved
    if (target.getBoundingClientRect().top < innerHeight * 0.5) return;      // the target is already in view
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';                                       // no long smooth glide from the top
    target.scrollIntoView({ block: 'start' });
    root.style.scrollBehavior = previous;
  };

  if (document.readyState === 'complete') requestAnimationFrame(land);
  else addEventListener('load', () => requestAnimationFrame(land), { once: true });
})();
