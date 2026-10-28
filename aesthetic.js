(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  document.documentElement.classList.add("aes-js");

  function revealSections() {
    if (!document.body.classList.contains("revolution-home")) return;

    var targets = document.querySelectorAll(
      ".principle, .gateway, .record-section, .director-section, .constitution-section, .manifesto-strip"
    );

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (element) { element.classList.add("aes-in"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("aes-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

    targets.forEach(function (element) {
      element.classList.add("aes-rv");
      observer.observe(element);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", revealSections, { once: true });
  } else {
    revealSections();
  }
})();