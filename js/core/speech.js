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

  /* Cada speak() abre una tanda. Los manejadores de una locución vieja pueden
     llegar después de haberla cancelado —cancel() dispara onerror en todo lo
     que había encolado— y sin este contador acabarían decidiendo por la tanda
     nueva: reencolando texto ya descartado o apagando una lectura en curso. */
  var tanda = 0;

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

  /* ---------------------- ¿Cuál suena a persona? ----------------------

     Aquí se elegía la voz LOCAL, y esa era la causa de que la app sonara a
     robot en todas partes. Las voces locales son las viejas del sistema —la
     de escritorio de SAPI5 en Windows, el motor básico de Android— y son
     exactamente las mecánicas. Las que suenan a persona son las de red:
     Google, las "Natural"/"Neural" de Microsoft, las mejoradas de Apple.

     La API no dice qué motor hay detrás de cada voz, pero el nombre sí: esos
     motores se anuncian en él. Así que se puntúa por nombre, y lo local pasa
     de ser el criterio a ser un desempate.

     Sin conexión no se pierde nada: si la voz de red falla al hablar,
     siguiente() cae sola a la mejor local y sigue leyendo (ver más abajo).
     ------------------------------------------------------------------ */

  var NATURALES = [
    { re: /natural|neural|wavenet/i,          pts: 60 },
    { re: /premium|enhanced|mejorada/i,       pts: 45 },
    { re: /\bgoogle\b/i,                      pts: 40 },
    { re: /siri/i,                            pts: 30 },
    { re: /online/i,                          pts: 22 }
  ];
  var MECANICAS = [
    { re: /espeak|pico|festival|compact/i,    pts: -60 },
    { re: /eloquence/i,                       pts: -50 },
    // "Microsoft Sabina Desktop" es la SAPI5 de toda la vida; la misma Sabina
    // sin "Desktop" es la moderna, y suena bastante mejor.
    { re: /desktop/i,                         pts: -35 }
  ];

  function puntuar(v) {
    var nombre = (v.name || '') + ' ' + (v.voiceURI || '');
    var pts = 0, i;
    for (i = 0; i < NATURALES.length; i++) if (NATURALES[i].re.test(nombre)) pts += NATURALES[i].pts;
    for (i = 0; i < MECANICAS.length; i++) if (MECANICAS[i].re.test(nombre)) pts += MECANICAS[i].pts;

    // El acento importa, pero menos que sonar a persona: un español de España
    // natural se entiende mejor que un mexicano robótico.
    var idx = PREFERIDOS.indexOf((v.lang || '').toLowerCase().replace('_', '-'));
    if (idx >= 0) pts += (PREFERIDOS.length - idx) * 3;

    // Desempates, no criterios.
    if (v.localService) pts += 4;
    if (v['default']) pts += 2;
    return pts;
  }

  /** ¿Esta voz es de las que suenan a persona? Lo usa el perfil para decirlo. */
  function natural(v) { return !!v && puntuar(v) >= 40; }

  /** Las voces en español, de la que mejor suena a la que peor. */
  function voicesES() {
    return voces.filter(esEspanol).map(function (v, i) { return { v: v, i: i, p: puntuar(v) }; })
      // El índice rompe los empates para que el orden no baile entre repintados.
      .sort(function (a, b) { return b.p - a.p || a.i - b.i; })
      .map(function (x) { return x.v; });
  }

  /** La mejor voz que funciona sin conexión. Es la red de seguridad. */
  function mejorLocal() {
    return voicesES().filter(function (v) { return v.localService; })[0] || null;
  }

  function elegirVoz() {
    var guardada = ajustes().voice;
    if (guardada) {
      var exacta = voces.filter(function (v) { return v.voiceURI === guardada || v.name === guardada; })[0];
      if (exacta) { vozElegida = exacta; return; }
    }
    vozElegida = voicesES()[0] || null;
  }

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
    // Elegir voz a mano cancela el respaldo: si antes se cayó a la local por
    // falta de red, esta elección tiene que poder volver a intentarlo.
    if (patch.voice !== undefined) { sinRed = false; elegirVoz(); }
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
      /* Los símbolos hay que decirlos como los dice una persona. Esta app está
         llena de precios y porcentajes, y sin esto sonaba a máquina leyendo
         una hoja de cálculo:
           "$1,200"  se leía "uno coma doscientos"   → "1200 pesos"
           "20%"     se leía "veinte" a secas        → "20 por ciento"
           "7/10"    se leía "siete diez"            → "7 de 10"
         La coma se quita porque en es-MX es el separador de miles, y el motor
         la interpreta como decimal. */
      .replace(/\$\s?(\d[\d.,]*)/g, function (todo, n) {
        return n.replace(/,/g, '') + ' pesos';
      })
      .replace(/(\d)\s?%/g, '$1 por ciento')
      .replace(/(\d)\s?\/\s?(\d)/g, '$1 de $2')
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
    /* La apertura de interrogación y de exclamación NO son separadores: son
       la entonación. Estaban en la clase negada, así que "¿Cuánto cuesta?"
       llegaba al motor como "Cuánto cuesta?" y la pregunta salía plana. Es
       media explicación de por qué esto sonaba a robot leyendo español. */
    var frases = limpio.match(/[^.!?\n]+[.!?]*[\n]*/g) || [limpio];
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
    tanda++;
    cola = [];
    hablando = false;
    if (supported()) { try { synth.cancel(); } catch (e) {} }
    notify();
  }

  /* ---------------------- Respirar entre frases ----------------------

     Nadie encadena frases sin tomar aire. La API sí: en cuanto termina una
     locución arranca la siguiente con cero milisegundos de silencio, y una
     lectura larga sale como una parrafada sin puntos. El hueco se pone a
     mano, en proporción a lo que acaba de decir, y se acorta cuando el
     usuario ha subido la velocidad: si lee rápido, también respira rápido.
     ------------------------------------------------------------------ */
  function pausaTras(txt, rate) {
    var fin = String(txt).slice(-1);
    var ms = 90;
    if (fin === '.' || fin === '!' || fin === '?' || fin === '…') ms = 280;
    else if (fin === ',' || fin === ';' || fin === ':') ms = 130;
    return Math.round(ms / Math.max(0.5, rate || 1));
  }

  var sinRed = false;   // ¿ya se cayó una voz de red por falta de conexión?

  /** La voz que habla ahora. Puede cambiar a media lectura si la de red se
      cae, así que se pregunta trozo a trozo y no una sola vez. */
  function vozAhora() {
    if (sinRed) return mejorLocal() || vozElegida;
    return vozElegida;
  }

  function siguiente() {
    if (!cola.length) { hablando = false; notify(); return; }

    var miTanda = tanda;
    var texto = cola.shift();
    var u = new w.SpeechSynthesisUtterance(texto);
    var voz = vozAhora();
    if (voz) { u.voice = voz; u.lang = voz.lang; }
    else u.lang = 'es-MX';
    var a = ajustes();
    var rate = Math.max(0.5, Math.min(2, a.speechRate || 1));
    u.rate = rate;
    u.pitch = 1;
    u.volume = 1;

    u.onend = function () {
      if (miTanda !== tanda) return;      // esta locución ya no manda
      setTimeout(function () {
        if (miTanda !== tanda) return;
        siguiente();
      }, pausaTras(texto, rate));
    };

    u.onerror = function (e) {
      if (miTanda !== tanda) return;
      // cancel() dispara un error en todo lo encolado: eso no es un fallo.
      var motivo = (e && e.error) || '';
      if (motivo === 'canceled' || motivo === 'interrupted') return;

      /* Una voz de red no habla sin conexión: falla al instante, y antes eso
         se saltaba el trozo en silencio hasta quedarse mudo. Se cae UNA vez a
         la mejor voz local, se devuelve el trozo a la cola y se recuerda para
         el resto de la lectura. El usuario oye una voz peor, no ninguna. */
      var local = mejorLocal();
      if (!sinRed && voz && !voz.localService && local && local !== voz) {
        sinRed = true;
        cola.unshift(texto);
      }
      setTimeout(function () {
        if (miTanda !== tanda) return;
        siguiente();
      }, 60);
    };

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
      /* La marca se pone DESPUÉS de hablar, no antes. speak() empieza
         cancelando lo que hubiera, y ese stop() avisa con hablando=false, que
         es justo lo que el oyente de aquí abajo usa para borrar la marca.
         Puesta antes, se borraba sola en el mismo clic: el botón no llegaba a
         encenderse nunca y no había manera de ver que estaba leyendo ni de
         cortarlo con un segundo toque. */
      if (speak(txt)) b.dataset.mine = '1';
      pintar();
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

  /* Al volver la conexión se vuelve a intentar la voz buena. Sin esto, quien
     leyó un rato en el metro se quedaba con la voz mecánica hasta recargar. */
  w.addEventListener('online', function () { sinRed = false; });

  w.Speech = {
    supported: supported,
    speak: speak, toggle: toggle, stop: stop, isSpeaking: isSpeaking,
    autoSpeak: autoSpeak, canAuto: canAuto,
    button: button, onChange: onChange,
    // La voz ELEGIDA, no la que suena en este instante: si la de red se cayó,
    // el ajuste que el usuario ve marcado tiene que seguir siendo el suyo.
    voices: voicesES, currentVoice: function () { return vozElegida; },
    natural: natural,
    settings: ajustes, set: set,
    util: { limpiar: limpiar, trocear: trocear }
  };
})(window, document);
