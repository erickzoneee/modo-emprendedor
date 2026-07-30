/* ==========================================================================
   Sonido sintetizado — sin archivos externos (WebAudio)
   ========================================================================== */
(function (w) {
  'use strict';

  var ctx = null;
  var master = null;

  function ensure() {
    if (ctx) return ctx;
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function on() {
    return !!(w.Store && w.Store.state.settings.sound);
  }

  /** Nota simple con envolvente ADSR corta. */
  function tone(opts) {
    if (!on()) return;
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    var t0 = c.currentTime + (opts.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();

    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t0 + (opts.dur || .18));

    var vol = (opts.vol == null ? .5 : opts.vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (opts.dur || .18));

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + (opts.dur || .18) + 0.03);
  }

  function noise(dur, vol, filterFreq) {
    if (!on()) return;
    var c = ensure();
    if (!c) return;
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 1800;
    var g = c.createGain();
    g.gain.value = vol || .2;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  var Sound = {
    unlock: function () {
      var c = ensure();
      if (c && c.state === 'suspended') c.resume();
    },

    tap: function () { tone({ freq: 520, to: 640, dur: .07, vol: .18, type: 'triangle' }); },

    select: function () { tone({ freq: 700, dur: .06, vol: .2, type: 'sine' }); },

    correct: function () {
      tone({ freq: 660, dur: .1, vol: .34, type: 'triangle' });
      tone({ freq: 880, dur: .12, vol: .3, type: 'triangle', delay: .08 });
      tone({ freq: 1320, dur: .22, vol: .22, type: 'sine', delay: .16 });
    },

    wrong: function () {
      tone({ freq: 240, to: 130, dur: .3, vol: .3, type: 'sawtooth' });
      noise(.16, .1, 700);
    },

    coin: function () {
      tone({ freq: 1180, dur: .06, vol: .26, type: 'square' });
      tone({ freq: 1560, dur: .16, vol: .22, type: 'square', delay: .06 });
    },

    xp: function () {
      tone({ freq: 900, to: 1500, dur: .18, vol: .2, type: 'sine' });
    },

    levelUp: function () {
      var notes = [523, 659, 784, 1047, 1319];
      notes.forEach(function (f, i) {
        tone({ freq: f, dur: .28, vol: .3, type: 'triangle', delay: i * 0.09 });
      });
    },

    complete: function () {
      var notes = [659, 784, 988, 1319];
      notes.forEach(function (f, i) {
        tone({ freq: f, dur: .34, vol: .28, type: 'sine', delay: i * 0.11 });
      });
    },

    streak: function () {
      tone({ freq: 400, to: 1100, dur: .35, vol: .3, type: 'triangle' });
      tone({ freq: 1500, dur: .2, vol: .18, type: 'sine', delay: .3 });
    },

    heartLost: function () {
      tone({ freq: 420, to: 180, dur: .35, vol: .28, type: 'sine' });
    },

    whoosh: function () { noise(.22, .09, 900); },

    cash: function () {
      tone({ freq: 1046, dur: .07, vol: .24, type: 'square' });
      tone({ freq: 1318, dur: .07, vol: .22, type: 'square', delay: .07 });
      tone({ freq: 1568, dur: .2, vol: .2, type: 'square', delay: .14 });
    },

    alert: function () {
      tone({ freq: 700, dur: .1, vol: .24, type: 'square' });
      tone({ freq: 700, dur: .1, vol: .24, type: 'square', delay: .16 });
    },

    type: function () { tone({ freq: 1200 + Math.random() * 300, dur: .03, vol: .07, type: 'sine' }); }
  };

  /** Vibración háptica (móvil). */
  Sound.buzz = function (pattern) {
    if (!w.Store || !w.Store.state.settings.haptics) return;
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  };

  w.Sound = Sound;

  // Desbloquear el audio en la primera interacción
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    w.addEventListener(ev, function once() {
      Sound.unlock();
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (e2) {
        w.removeEventListener(e2, once);
      });
    }, { once: true, passive: true });
  });
})(window);
