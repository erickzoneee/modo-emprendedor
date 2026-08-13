/* ==========================================================================
   LECTURA EN VOZ ALTA

   Usa la síntesis de voz del propio dispositivo (Web Speech API). Es la única
   opción compatible con lo que es Modo Emprendedor: gratuita para siempre, sin
   servidor, sin clave, sin coste por uso y disponible sin conexión en Android,
   Windows, macOS e iOS. Ninguna TTS de pago aportaría lo suficiente como para
   justificar depender de una red y de una factura.

   Lo que hay que domar de esta API, que es vieja y desigual:
     · getVoices() llega vacío al principio en Chrome; hay que esperar el
       evento 'voiceschanged'.
     · Chrome corta las locuciones largas a los ~15 segundos: el texto se trocea
       por frases y se encola.
     · iOS solo permite hablar dentro de un gesto del usuario: la primera vez
       se ceba el motor desde el botón, y solo entonces se permite el modo
       automático.
     · speechSynthesis se queda "pegado" si no se cancela antes de hablar.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var synth = w.speechSynthesis || null;
  var voces = [];
  var vozElegida = null;
  var cola = [];
  var hablando = false;
  var cebado = false;              // ¿ya habló una vez dentro de un gesto?
  var listeners = [];
  var TROZO = 180;                 // caracteres por locución

  /* Orden de preferencia: español latino primero, que es el de la app. */
  var PREFERIDOS = ['es-mx', 'es-us', 'es-419', 'es-co', 'es-ar', 'es-cl', 'es-pe', 'es-es'];

  function supported() {
    return !!(synth && typeof w.SpeechSynthesisUtterance === 'function');
  }

  /* ------------------------- Voces ------------------------- */

  function cargarVoces() {
    if (!supported()) return;
    try { voces = synth.getVoices() || []; } catch (e) { voces = []; }
    if (voces.length) elegirVoz();
  }

  function esEspanol(v) { return /^es(-|_|$)/i.test(v.lang || ''); }

  function elegirVoz() {
    var guardada = ajustes().voice;
    if (guardada) {
      var exacta = voces.filter(function (v) { return v.voiceURI === guardada || v.name === guardada; })[0];
      if (exacta) { vozElegida = exacta; return; }
    }
    var es = voces.filter(esEspanol);
    if (!es.length) { vozElegida = null; return; }

    for (var i = 0; i < PREFERIDOS.length; i++) {
      var m = es.filter(function (v) { return (v.lang || '').toLowerCase().replace('_', '-') === PREFERIDOS[i]; });
      if (m.length) {
        // Entre varias del mismo idioma, la local suena antes y sin conexión.
        var local = m.filter(function (v) { return v.localService; })[0];
        vozElegida = local || m[0];
        return;
      }
    }
    vozElegida = es.filter(function (v) { return v.localService; })[0] || es[0];
  }

  function voicesES() { return voces.filter(esEspanol); }

  if (supported()) {
    cargarVoces();
    // Chrome puebla la lista de forma asíncrona, a veces varias veces.
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', cargarVoces);
    } else {
      synth.onvoiceschanged = cargarVoces;
    }
  }

  /* ------------------------- Ajustes ------------------------- */

  function ajustes() {
    var s = w.Store && w.Store.state ? w.Store.state.settings : null;
    if (!s) return { speech: false, speechRate: 1, voice: '', autoRead: false };
    if (s.speechRate == null) s.speechRate = 1;
    return s;
  }

  function set(patch) {
    w.Store.set(function (st) {
      for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) st.settings[k] = patch[k];
    }, 'speech');
    if (patch.voice !== undefined) elegirVoz();
    return ajustes();
  }

  /* ------------------------- Troceado ------------------------- */

  /** Limpia el texto de la app para que se lea bien: nada de **, ·, emojis. */
  function limpiar(txt) {
    return String(txt || '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^[·•\-–]\s*/gm, '')
      .replace(/[·•]/g, ', ')
      // Los emojis se leen como "cara sonriente": estorban más que aportan.
      // En \u para que el archivo no dependa de cómo se guarde la codificación.
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ')
      .replace(/[←-⇿⌀-⏿①-➿⬀-⯿️‍〰]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')     // quitar emojis deja espacios antes de la coma
      .replace(/([,;:])\1+/g, '$1')
      .trim();
  }

  /** Trocea por frases sin pasar de TROZO caracteres. */
  function trocear(txt) {
    var limpio = limpiar(txt);
    if (!limpio) return [];
    var frases = limpio.match(/[^.!?¿¡\n]+[.!?]*[\n]*/g) || [limpio];
    var out = [], buf = '';
    frases.forEach(function (f) {
      f = f.trim();
      if (!f) return;
      if ((buf + ' ' + f).trim().length > TROZO && buf) { out.push(buf.trim()); buf = f; }
      else buf = (buf + ' ' + f).trim();
    });
    if (buf) out.push(buf.trim());

    // Una frase suelta más larga que el límite se parte por comas.
    var final = [];
    out.forEach(function (t) {
      if (t.length <= TROZO * 1.6) { final.push(t); return; }
      var partes = t.split(/,\s*/), acc = '';
      partes.forEach(function (p) {
        if ((acc + ', ' + p).length > TROZO && acc) { final.push(acc); acc = p; }
        else acc = acc ? acc + ', ' + p : p;
      });
      if (acc) final.push(acc);
    });
    return final;
  }

  /* ------------------------- Reproducción ------------------------- */

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](hablando); } catch (e) {}
    }
  }

  function onChange(fn) {
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function stop() {
    cola = [];
    hablando = false;
    if (supported()) { try { synth.cancel(); } catch (e) {} }
    notify();
  }

  function siguiente() {
    if (!cola.length) { hablando = false; notify(); return; }
    var texto = cola.shift();
    var u = new w.SpeechSynthesisUtterance(texto);
    if (vozElegida) { u.voice = vozElegida; u.lang = vozElegida.lang; }
    else u.lang = 'es-MX';
    var a = ajustes();
    u.rate = Math.max(0.5, Math.min(2, a.speechRate || 1));
    u.pitch = 1;
    u.volume = 1;
    u.onend = function () { siguiente(); };
    u.onerror = function () { siguiente(); };
    try { synth.speak(u); }
    catch (e) { hablando = false; notify(); }
  }

  /** Lee un texto (o una lista de textos, que se leen seguidos). */
  function speak(texto) {
    if (!supported()) return false;
    var partes = Array.isArray(texto) ? texto : [texto];
    var trozos = [];
    partes.forEach(function (p) { trozos = trozos.concat(trocear(p)); });
    if (!trozos.length) return false;

    stop();
    cebado = true;
    cola = trozos;
    hablando = true;
    notify();
    // Chrome necesita un respiro tras cancel() o se traga la primera locución.
    setTimeout(siguiente, 60);
    return true;
  }

  /** Botón de un solo toque: empieza, o corta si ya está leyendo. */
  function toggle(texto) {
    if (hablando) { stop(); return false; }
    return speak(texto);
  }

  function isSpeaking() { return hablando; }

  /** ¿Se puede leer sola una pantalla? Solo si el usuario lo activó y el motor
      ya habló una vez desde un gesto suyo (iOS lo exige). */
  function canAuto() {
    return supported() && !!ajustes().autoRead && cebado;
  }

  function autoSpeak(texto) {
    if (!canAuto()) return false;
    return speak(texto);
  }

  /* ------------------------- Botón reutilizable ------------------------- */

  /** Botón de altavoz que se pinta junto a cualquier bloque legible.
      getText() se evalúa en el momento del clic: así lee lo que hay entonces. */
  function button(getText, opts) {
    opts = opts || {};
    if (!supported()) return null;
    var b = d.createElement('button');
    b.type = 'button';
    b.className = 'speak-btn' + (opts.small ? ' speak-btn--sm' : '');
    b.setAttribute('aria-label', opts.label || 'Escuchar en voz alta');
    b.title = opts.label || 'Escuchar en voz alta';
    b.innerHTML = '<span class="speak-btn__ico">🔊</span>' +
                  (opts.text ? '<span>' + opts.text + '</span>' : '');

    function pintar() {
      var activo = hablando && b.dataset.mine === '1';
      b.classList.toggle('is-on', activo);
      b.querySelector('.speak-btn__ico').textContent = activo ? '⏹️' : '🔊';
    }

    b.addEventListener('click', function () {
      if (w.Sound) w.Sound.tap();
      if (hablando && b.dataset.mine === '1') { stop(); return; }
      var txt = typeof getText === 'function' ? getText() : getText;
      b.dataset.mine = '1';
      speak(txt);
    });

    var off = onChange(function () {
      if (!b.isConnected) { off(); if (!hablando) return; }
      if (!hablando) b.dataset.mine = '';
      pintar();
    });
    pintar();
    return b;
  }

  /* Al salir de la pantalla o cerrar, la voz no debe seguir sola. */
  d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); });
  w.addEventListener('pagehide', stop);

  w.Speech = {
    supported: supported,
    speak: speak, toggle: toggle, stop: stop, isSpeaking: isSpeaking,
    autoSpeak: autoSpeak, canAuto: canAuto,
    button: button, onChange: onChange,
    voices: voicesES, currentVoice: function () { return vozElegida; },
    settings: ajustes, set: set,
    util: { limpiar: limpiar, trocear: trocear }
  };
})(window, document);
