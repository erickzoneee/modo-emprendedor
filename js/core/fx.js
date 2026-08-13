/* ==========================================================================
   Efectos visuales — confeti, partículas, números flotantes, contadores
   ========================================================================== */
(function (w, d) {
  'use strict';

  var canvas, ctx, parts = [], raf = null, dpr = 1;

  var hooked = false;

  function initCanvas() {
    canvas = d.getElementById('fx-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    show(false);
    // boot() puede repetirse (reinicio, importación): un solo enganche basta.
    if (!hooked) {
      hooked = true;
      w.addEventListener('resize', resize, { passive: true });
    }
  }

  /** El canvas ocupa toda la ventana con z-index 9000. Dejarlo compuesto de
      forma permanente cuesta memoria y, en algunos equipos, tiñe o ensucia lo
      que hay debajo. Solo existe mientras haya partículas vivas. */
  function show(on) {
    if (!canvas) return;
    canvas.classList.toggle('is-on', !!on);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(w.devicePixelRatio || 1, 2);
    canvas.width = w.innerWidth * dpr;
    canvas.height = w.innerHeight * dpr;
    canvas.style.width = w.innerWidth + 'px';
    canvas.style.height = w.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function reduced() {
    return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** El canvas debe cubrir la ventana aunque no haya llegado el evento resize. */
  function ensureSize() {
    if (!canvas) return;
    if (canvas.style.width !== w.innerWidth + 'px' || canvas.style.height !== w.innerHeight + 'px') resize();
  }

  var PALETTE = ['#FF6B1A', '#FFC800', '#43C95E', '#1CB0F6', '#A855F7', '#EC4899', '#14B8A6'];

  function spawn(n, x, y, opts) {
    opts = opts || {};
    var colors = opts.colors || PALETTE;
    for (var i = 0; i < n; i++) {
      var ang = opts.angle != null
        ? opts.angle + (Math.random() - .5) * (opts.spread || 1.2)
        : Math.random() * Math.PI * 2;
      var sp = (opts.speed || 6) * (0.45 + Math.random() * 0.85);
      parts.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - (opts.lift || 2),
        g: opts.gravity == null ? 0.26 : opts.gravity,
        size: (opts.size || 8) * (0.55 + Math.random() * 0.9),
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * 0.34,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        shape: opts.shape || (Math.random() < .5 ? 'rect' : 'circle'),
        drag: opts.drag || 0.988
      });
    }
    start();
  }

  function start() {
    if (raf) return;
    show(true);
    var loop = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += p.g;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > w.innerHeight + 60) { parts.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, p.size / 1.6);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5);
        }
        ctx.restore();
      }
      if (parts.length) { raf = requestAnimationFrame(loop); }
      else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); show(false); }
    };
    raf = requestAnimationFrame(loop);
  }

  function drawStar(c, r) {
    c.beginPath();
    for (var i = 0; i < 5; i++) {
      c.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * r, -Math.sin((18 + i * 72) / 180 * Math.PI) * r);
      c.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * r * .5, -Math.sin((54 + i * 72) / 180 * Math.PI) * r * .5);
    }
    c.closePath();
    c.fill();
  }

  var FX = {
    init: initCanvas,

    /** Ráfaga desde un elemento (o centro de la pantalla). */
    burst: function (el, opts) {
      if (reduced() || !ctx) return;
      ensureSize();
      var x = w.innerWidth / 2, y = w.innerHeight / 2;
      if (el && el.getBoundingClientRect) {
        var r = el.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      spawn((opts && opts.count) || 26, x, y, opts);
    },

    /** Confeti que cae desde arriba. */
    confetti: function (count) {
      if (reduced() || !ctx) return;
      ensureSize();
      count = count || 90;
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * w.innerWidth,
          y: -20 - Math.random() * 200,
          vx: (Math.random() - .5) * 3,
          vy: 2 + Math.random() * 4,
          g: 0.08,
          size: 7 + Math.random() * 9,
          color: PALETTE[(Math.random() * PALETTE.length) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - .5) * 0.3,
          life: 1,
          decay: 0.0038,
          shape: Math.random() < .3 ? 'circle' : 'rect',
          drag: 0.996
        });
      }
      start();
    },

    /** Explosión celebratoria doble desde los lados. */
    celebrate: function () {
      if (reduced() || !ctx) return;
      ensureSize();
      var h = w.innerHeight * 0.72;
      spawn(46, 10, h, { angle: -Math.PI / 3.4, spread: 1.0, speed: 15, gravity: .3, size: 11 });
      spawn(46, w.innerWidth - 10, h, { angle: -Math.PI + Math.PI / 3.4, spread: 1.0, speed: 15, gravity: .3, size: 11 });
      FX.confetti(70);
    },

    /** Estrellas doradas (monedas, insignias). */
    stars: function (el, count) {
      FX.burst(el, {
        count: count || 18,
        shape: 'star',
        colors: ['#FFC800', '#FFD84D', '#FF9A3C', '#FFF3C4'],
        speed: 7, gravity: .2, size: 13
      });
    },

    /** Número flotante «+20 XP» sobre un elemento. */
    gain: function (el, text, color) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      var n = d.createElement('div');
      n.className = 'float-gain';
      n.textContent = text;
      n.style.left = (r.left + r.width / 2) + 'px';
      n.style.top = (r.top - 4) + 'px';
      n.style.color = color || '#FFC800';
      d.body.appendChild(n);
      setTimeout(function () { n.remove(); }, 1150);
    },

    /** Animación de conteo numérico. */
    count: function (el, from, to, dur, fmt) {
      if (!el) return;
      dur = dur || 700;
      var t0 = performance.now();
      var step = function (t) {
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        var val = Math.round(from + (to - from) * e);
        el.textContent = fmt ? fmt(val) : val;
        if (k < 1) requestAnimationFrame(step);
        else {
          el.classList.remove('count-pop');
          void el.offsetWidth;
          el.classList.add('count-pop');
        }
      };
      requestAnimationFrame(step);
    },

    /** Sacude un elemento. */
    shake: function (el) {
      if (!el) return;
      el.classList.remove('shake-now');
      void el.offsetWidth;
      el.style.animation = 'shake .42s var(--ease-out)';
      setTimeout(function () { el.style.animation = ''; }, 460);
    },

    /** Rebote de un elemento. */
    pop: function (el) {
      if (!el) return;
      el.style.animation = '';
      void el.offsetWidth;
      el.style.animation = 'pop .4s var(--spring)';
      setTimeout(function () { el.style.animation = ''; }, 420);
    }
  };

  w.FX = FX;
})(window, document);
