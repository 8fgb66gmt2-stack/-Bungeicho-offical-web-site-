(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  root.classList.add("aes-js");

  /* 現れ：各章を、視界に入ったときにゆるやかに浮かび上がらせる */
  function reveal() {
    var targets = document.querySelectorAll(
      ".principle, .gateway, .record-section, .director-section, .constitution-section, .manifesto-strip"
    );
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("aes-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("aes-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(function (el) {
      el.classList.add("aes-rv");
      io.observe(el);
    });
  }

  /* 花弁 */
  function petals() {
    if (document.getElementById("aes-petals")) return;
    var c = document.createElement("canvas");
    c.id = "aes-petals";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    var x = c.getContext("2d");
    if (!x) { c.remove(); return; }
    var W, H, P = [];
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      c.width = Math.floor(W * dpr); c.height = Math.floor(H * dpr);
      c.style.width = W + "px"; c.style.height = H + "px";
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener("resize", function () {
      size();
      P.forEach(function (p) { if (p.x > W) p.x = Math.random() * W; });
    }, { passive: true });
    var n = innerWidth < 700 ? 16 : 30;
    for (var i = 0; i < n; i++) {
      P.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 3 + Math.random() * 4.5, s: 0.25 + Math.random() * 0.55,
        d: Math.random() * 6.28, v: 0.004 + Math.random() * 0.01,
        a: 0.2 + Math.random() * 0.35
      });
    }
    var running = true, raf = 0;
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) frame();
      else cancelAnimationFrame(raf);
    });
    function frame() {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      x.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        p.y += p.s; p.d += p.v * 3; p.x += Math.sin(p.d) * 0.6;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.d);
        x.globalAlpha = p.a;
        x.fillStyle = "#e3a7b4";
        x.beginPath();
        x.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.28);
        x.fill();
        x.restore();
      });
    }
    frame();
  }

  function init() {
    if (!document.body.classList.contains("revolution-home")) return;
    reveal();
    petals();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();