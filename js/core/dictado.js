/* ==========================================================================
   LA NOTA DE VOZ — hablar en vez de escribir

   Hermano de speech.js: aquel LEE con la voz del dispositivo, este ESCUCHA
   con el reconocimiento del dispositivo. Los dos usan la Web Speech API, los
   dos son gratis para siempre y ninguno necesita servidor ni clave.

   POR QUÉ ESTA API Y NO GRABAR AUDIO
   Grabar la nota y mandarla a transcribir costaría dinero por minuto, exigiría
   red y convertiría a Emprendo en algo que recibe voz de personas. Esto no:
   el teléfono devuelve TEXTO y el audio nunca sale de la API del navegador.
   No se guarda ni un byte de sonido en ningún sitio.

   LO QUE HAY QUE DOMAR, QUE ES BASTANTE
     · No existe en Firefox de escritorio. Ahí el botón no se dibuja siquiera:
       una función que no está no debe aparecer rota, debe no aparecer.
     · Chrome corta solo cada pocos segundos y dispara onend aunque el usuario
       siga hablando. Se reanuda mientras `deseado` siga en pie.
     · iOS solo arranca dentro de un gesto del usuario, igual que la síntesis.
     · onerror 'no-speech' llega cuando alguien abre el micro y no dice nada:
       eso no es un fallo, es un silencio, y no puede pintarse en rojo.
     · Los resultados llegan en dos sabores: `isFinal` (ya no cambia) e
       interino (lo que cree que oyó y todavía puede corregir). Los dos se
       enseñan, pero solo el final se guarda.

   NADA DE LO QUE PASA AQUÍ SE GUARDA SOLO. Quien llama recibe el texto y es
   su responsabilidad enseñárselo al usuario antes de escribirlo en el perfil.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var API = w.SpeechRecognition || w.webkitSpeechRecognition || null;

  var rec = null;              // la instancia viva, si la hay
  var deseado = false;         // ¿el usuario quiere seguir escuchando?
  var cbs = null;              // los avisos de la tanda en curso
  var finalTxt = '';           // lo que ya no va a cambiar
  var parcialTxt = '';         // lo que todavía puede cambiar
  var silencio = null;         // temporizador de "lleva un rato callado"
  var tope = null;             // temporizador del máximo absoluto
  var negado = false;          // el usuario dijo que no al micrófono

  var PAUSA = 2600;            // ms de silencio tras hablar → se cierra sola
  var MAX = 60000;             // ms máximos de una nota, pase lo que pase

  /* La app es de español latino. Si el sistema ya está en un español
     cualquiera se respeta el suyo, que reconoce mejor su acento. */
  function idioma() {
    var l = String(w.navigator && w.navigator.language || '');
    return /^es(-|_)/i.test(l) ? l.replace('_', '-') : 'es-MX';
  }

  function supported() { return !!API; }

  /** Por qué no se puede dictar. Se usa para el texto de la alternativa, no
      para un mensaje de error: nadie tiene la culpa de su navegador. */
  function motivo() {
    if (!API) return 'sin-api';
    if (negado) return 'sin-permiso';
    return null;
  }

  /* La API necesita origen seguro. En file:// y en http:// que no sea
     localhost, existir existe, pero al arrancar falla con 'not-allowed' y el
     usuario ve un botón que no hace nada. Mejor no ofrecerlo. */
  function contextoSeguro() {
    if (w.isSecureContext !== undefined) return !!w.isSecureContext;
    var p = w.location && w.location.protocol;
    return p === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(w.location.hostname || '');
  }

  /** ¿Se le puede ofrecer una nota de voz a esta persona, aquí y ahora? */
  function disponible() { return supported() && contextoSeguro() && !negado; }

  function activo() { return !!rec && deseado; }

  function limpiarRelojes() {
    if (silencio) { clearTimeout(silencio); silencio = null; }
    if (tope) { clearTimeout(tope); tope = null; }
  }

  function armarSilencio() {
    if (silencio) clearTimeout(silencio);
    silencio = setTimeout(function () { parar(); }, PAUSA);
  }

  function avisar(nombre, dato) {
    if (!cbs || typeof cbs[nombre] !== 'function') return;
    try { cbs[nombre](dato); } catch (e) { console.warn('[dictado]', e); }
  }

  /** Junta lo cerrado con lo que todavía se está oyendo. */
  function texto() {
    return (finalTxt + ' ' + parcialTxt).replace(/\s+/g, ' ').trim();
  }

  /* --------------------------------------------------------------
     ARRANCAR
     -------------------------------------------------------------- */

  /** Abre el micrófono. Devuelve false si no se pudo ni empezar, para que
      quien llama enseñe la alternativa en el mismo toque y no después.

      opts:
        onParcial(texto)  lo que va oyendo, incluido lo que aún puede cambiar
        onTexto(texto)    el resultado final, ya cerrado
        onEstado(estado)  'escuchando' | 'parando' | 'listo'
        onFallo(clave)    'sin-permiso' | 'sin-red' | 'sin-microfono' | 'otro'
  */
  function escuchar(opts) {
    if (!disponible()) return false;
    if (rec) parar();

    cbs = opts || {};
    finalTxt = '';
    parcialTxt = '';
    deseado = true;

    try { rec = new API(); } catch (e) { rec = null; }
    if (!rec) { deseado = false; return false; }

    rec.lang = idioma();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = function (ev) {
      parcialTxt = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        var t = (r[0] && r[0].transcript) || '';
        if (r.isFinal) finalTxt += ' ' + t;
        else parcialTxt += ' ' + t;
      }
      finalTxt = finalTxt.replace(/\s+/g, ' ').trim();
      parcialTxt = parcialTxt.replace(/\s+/g, ' ').trim();
      avisar('onParcial', texto());
      armarSilencio();
    };

    rec.onspeechstart = function () { armarSilencio(); };

    rec.onerror = function (ev) {
      var e = (ev && ev.error) || 'otro';
      // Silencio no es error: alguien abrió el micro y se lo pensó mejor.
      if (e === 'no-speech' || e === 'aborted') return;
      if (e === 'not-allowed' || e === 'service-not-allowed') {
        negado = true;
        deseado = false;
        avisar('onFallo', 'sin-permiso');
        return;
      }
      deseado = false;
      avisar('onFallo', e === 'network' ? 'sin-red'
                      : e === 'audio-capture' ? 'sin-microfono' : 'otro');
    };

    /* Chrome cierra la sesión cada pocos segundos por su cuenta. Mientras el
       usuario no haya tocado "terminar", se vuelve a abrir: para él es una
       sola nota, aunque por debajo sean cinco. */
    rec.onend = function () {
      if (deseado) {
        try { rec.start(); return; } catch (e) { /* ya no se pudo: se cierra */ }
      }
      cerrar();
    };

    try {
      rec.start();
    } catch (e) {
      deseado = false;
      rec = null;
      return false;
    }

    tope = setTimeout(function () { parar(); }, MAX);
    avisar('onEstado', 'escuchando');
    return true;
  }

  /** Cierra la nota y entrega lo que se entendió. */
  function parar() {
    if (!rec) return;
    deseado = false;
    limpiarRelojes();
    avisar('onEstado', 'parando');
    try { rec.stop(); } catch (e) { cerrar(); }
  }

  /** Cierra sin entregar nada: el usuario se arrepintió o cambió de pantalla. */
  function cancelar() {
    if (!rec) return;
    deseado = false;
    limpiarRelojes();
    var r = rec;
    rec = null;
    cbs = null;
    finalTxt = '';
    parcialTxt = '';
    try { r.abort(); } catch (e) { /* ya estaba muerta */ }
  }

  function cerrar() {
    limpiarRelojes();
    var t = texto();
    rec = null;
    deseado = false;
    avisar('onEstado', 'listo');
    avisar('onTexto', limpiar(t));
    cbs = null;
    finalTxt = '';
    parcialTxt = '';
  }

  /* --------------------------------------------------------------
     LIMPIEZA DEL TEXTO

     El reconocimiento devuelve una parrafada en minúscula y sin punto final.
     Escrita así en el perfil se lee como un mensaje mal enviado, y lo que el
     usuario acaba de decir merece verse como una frase.
     -------------------------------------------------------------- */

  function limpiar(s) {
    var t = String(s || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    // Muletillas de arranque: casi todo el mundo empieza igual al dictar.
    t = t.replace(/^(este|eh+|pues|bueno|a ver|mira|o sea)[,\s]+/i, '');
    t = t.charAt(0).toUpperCase() + t.slice(1);
    if (!/[.!?…]$/.test(t)) t += '.';
    return t;
  }

  /* Si la pantalla se va —el usuario cambia de pestaña, cierra la app o la
     pantalla se bloquea— el micrófono no puede quedarse abierto. */
  d.addEventListener('visibilitychange', function () { if (d.hidden) cancelar(); });
  w.addEventListener('pagehide', cancelar);

  w.Dictado = {
    supported: supported,
    disponible: disponible,
    motivo: motivo,
    activo: activo,
    escuchar: escuchar,
    parar: parar,
    cancelar: cancelar,
    util: { limpiar: limpiar, idioma: idioma }
  };
})(window, document);
