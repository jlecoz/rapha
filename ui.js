/* ============================================================
   Raphaëlle Constant — Shared UI behaviours
   ------------------------------------------------------------
   Loaded (synchronously, in <head>) by every page so animation +
   loading behave identically site-wide. Styling lives in tokens.css
   (.skel / .rc-img / .rc-rise / .rc-in). Keep behaviour here — do
   not re-implement per page.
     • Image skeleton: <img class="rc-img"> inside a .skel wrapper
       fades in on load; the shimmer clears on load OR error, so a
       failed/slow image never shimmers forever.
     • window.rcStagger(items): staggered rise-in on scroll for any
       group of cards (timing from the motion tokens).
   ============================================================ */
(function () {
  "use strict";

  function clear(img, ok) {
    var s = img.closest(".skel");
    if (s) s.classList.remove("skel");
    if (ok) img.classList.add("is-loaded");
    else img.remove(); // broken image → drop it, let the card's fallback show
  }
  // load/error don't bubble — listen in the capture phase so one handler covers all.
  document.addEventListener("load", function (e) {
    var t = e.target;
    if (t.tagName === "IMG" && t.classList.contains("rc-img")) clear(t, true);
  }, true);
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t.tagName === "IMG" && t.classList.contains("rc-img")) clear(t, false);
  }, true);
  // Safety net for images already cached/complete before their handler ran.
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      [].forEach.call(document.querySelectorAll("img.rc-img:not(.is-loaded)"), function (img) {
        if (img.complete && img.naturalWidth > 0) clear(img, true);
      });
    }, 60);
  });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.rcStagger = function (items) {
    items = [].slice.call(items);
    items.forEach(function (el, i) {
      el.classList.add("rc-rise");
      el.style.setProperty("--i", Math.min(i, 9));
    });
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("rc-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("rc-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  };
})();
