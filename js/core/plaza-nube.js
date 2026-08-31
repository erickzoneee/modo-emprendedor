/* ==========================================================================
   PLAZA · LA NUBE

   Lo único de Emprendo que habla con un servidor sobre datos de personas.
   Todo lo demás de la app funciona sin conexión y sin cuenta, y eso no
   cambia: si esto falla, la Plaza se queda vacía y el resto sigue igual.

   TRES REGLAS

   1. NUNCA LANZA. Cada función devuelve `{ ok: true, ... }` o
      `{ error: 'algo' }`. Una pantalla que se cae porque el wifi se fue es
      una pantalla mal escrita, y aquí el wifi se va constantemente: esta app
      se usa en el metro.

   2. LA SESIÓN NO ENTRA EN EL RESPALDO. Vive en la clave propia de la Plaza
      (js/core/plaza.js), no en Store. `Store.exportJSON()` vuelca el estado
      entero y ese archivo el usuario lo manda por WhatsApp para no perder su
      progreso: una sesión ahí dentro es la llave de su cuenta viajando por
      un chat.

   3. LO QUE VUELVE DEL SERVIDOR ES TEXTO DE OTRAS PERSONAS. Se pinta siempre
      con `text:`, nunca con `html:`. El Worker filtra y recorta, pero el
      cliente no puede confiar en eso: son dos programas distintos y uno se
      despliega sin el otro.

   POR QUÉ TODO VA POR UN SOLO `POST` CON `op` DENTRO
   El CORS del Worker solo admite la cabecera `content-type`, así que la
   sesión tiene que viajar en el cuerpo. Con una sola puerta, esa regla se
   cumple sola y no hay ninguna llamada que pueda olvidarse de mandarla.
   ========================================================================== */
(function (w) {
  'use strict';

  /* 25 segundos. El Worker responde en decenas de milisegundos; si tarda
     más, es la red. Más allá de esto la gente ya cerró la app. */
  var ESPERA = 25000;

  function url() {
    return (w.BRAND && w.BRAND.dominios && w.BRAND.dominios.plaza) || '';
  }

  /** ¿Hay servidor al que llamar? Si no, la Plaza se comporta como hasta
      ahora: tu puesto existe, no lo ve nadie, y la app lo dice. */
  function hay() { return !!url(); }

  /* ==================================================================
     LA LLAMADA
     ================================================================== */

  function pide(op, datos, conSesion) {
    if (!hay()) return Promise.resolve({ error: 'sin-servidor' });

    var cuerpo = { op: op };
    for (var k in (datos || {})) {
      if (Object.prototype.hasOwnProperty.call(datos, k)) cuerpo[k] = datos[k];
    }

    if (conSesion !== false) {
      var s = w.Plaza && w.Plaza.sesion ? w.Plaza.sesion() : '';
      if (!s) return Promise.resolve({ error: 'sin-sesion' });
      cuerpo.sesion = s;
    }

    var corta = null, avisa = null;
    try {
      corta = new AbortController();
      avisa = setTimeout(function () { corta.abort(); }, ESPERA);
    } catch (e) { corta = null; }

    return w.fetch(url(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: corta ? corta.signal : undefined
    }).then(function (res) {
      if (avisa) clearTimeout(avisa);
      return res.json().then(function (j) {
        /* La sesión caducó o se la cargaron desde otro sitio. Se borra aquí
           y no en cada pantalla: si no, cada una tendría que acordarse. */
        if (res.status === 401) {
          if (w.Plaza && w.Plaza.salir) w.Plaza.salir();
          return { error: 'sin-sesion' };
        }
        return j || { error: 'fallo' };
      }).catch(function () { return { error: 'fallo' }; });
    }).catch(function (e) {
      if (avisa) clearTimeout(avisa);
      var abortado = e && (e.name === 'AbortError' || String(e).indexOf('abort') >= 0);

      /* Desde JavaScript, un bloqueo por CORS y un wifi caído son el mismo
         TypeError: el navegador no deja leer la respuesta, así que no hay
         forma de distinguirlos en el cliente.

         Al usuario se le dice lo mismo en los dos casos, porque desde su
         lado es lo mismo: la app no llega al servidor. Pero al registro va
         una pista, porque el día que alguien sirva la app desde un origen
         que no esté en la lista blanca del Worker, TODOS verán «no tengo
         conexión» para siempre y nadie sabrá por qué. */
      if (!abortado) {
        console.warn('[plaza] no se pudo llamar a ' + url() +
          '. Si la red va bien, revisa que este origen (' + w.location.origin +
          ') esté en ORIGENES de worker-plaza/wrangler.jsonc.');
      }
      return { error: abortado ? 'lento' : 'sin-red' };
    });
  }

  /* ==================================================================
     ENTRAR

     Dos pasos y un correo por medio. `entrar` responde lo mismo exista la
     cuenta o no —eso lo decide el servidor, y es a propósito—, así que la
     pantalla no puede decir «ya tienes cuenta» ni «te acabas de registrar».
     Dice lo único que es verdad: mira tu correo.
     ================================================================== */

  function entrar(correo, edadOk) {
    return pide('entrar', { correo: String(correo || '').trim(), edadOk: !!edadOk }, false);
  }

  /** Canjea el enlace del correo por una sesión. La guarda si sale bien. */
  function confirmar(token, edadOk) {
    return pide('confirmar', { token: token, edadOk: !!edadOk }, false).then(function (r) {
      if (r && r.ok && r.sesion) w.Plaza.entrar(r.sesion, r.id);
      return r;
    });
  }

  function salir() {
    /* Se avisa al servidor para que borre la sesión de verdad, pero no se
       espera: el usuario ya pulsó salir y su llave local se va igual. */
    var s = w.Plaza && w.Plaza.sesion ? w.Plaza.sesion() : '';
    if (s) pide('salir', {}, true);
    w.Plaza.salir();
    return Promise.resolve({ ok: true });
  }

  /* ==================================================================
     EL PUESTO
     ================================================================== */

  function publicar(vitrina) {
    /* Se manda solo la lista blanca, campo por campo. El servidor la vuelve a
       aplicar —tiene que hacerlo, porque un cliente modificado existe en
       cuanto la app es pública—, pero mandar de más sería ensuciar la red con
       datos que no deberían salir del teléfono ni de camino. */
    var v = {};
    (w.Plaza.CAMPOS || []).forEach(function (c) { v[c] = vitrina ? (vitrina[c] || '') : ''; });
    return pide('publicar', { vitrina: v });
  }

  function retirar() { return pide('retirar', {}); }

  /* ==================================================================
     LOS VECINOS Y LO QUE PASA ENTRE PERSONAS
     ================================================================== */

  function vecinos() { return pide('vecinos', {}); }

  function veoValor(para, intencion, motivo, mensaje) {
    return pide('veo-valor', {
      para: para, intencion: intencion, motivo: motivo, mensaje: mensaje
    });
  }

  function retirarValor(para) { return pide('retirar-valor', { para: para }); }

  /** Quién vio valor en lo tuyo. No trae el mensaje que escribieron: eso
      llega al aceptar, y es la regla que sostiene toda la sección. */
  function recibidos() { return pide('recibidos', {}); }

  function responder(de, acepto) { return pide('responder', { de: de, acepto: !!acepto }); }

  function conversaciones() { return pide('conversaciones', {}); }

  /** Lee y, si se le pasa `texto`, escribe en la misma llamada. */
  function mensajes(conversacion, texto) {
    var d = { conversacion: conversacion };
    if (texto) d.texto = texto;
    return pide('mensajes', d);
  }

  function denunciar(sobre, motivo, nota) {
    return pide('denunciar', { sobre: sobre, motivo: motivo, nota: nota || '' });
  }

  function bloquear(sobre) { return pide('bloquear', { sobre: sobre }); }

  function borrarme() {
    return pide('borrarme', {}).then(function (r) {
      if (r && r.ok) w.Plaza.salir();
      return r;
    });
  }

  /* ==================================================================
     QUÉ DECIRLE AL USUARIO CUANDO ALGO FALLA

     En voz de Chispa, y sin culpar a nadie. Ninguna menciona un código, un
     estado HTTP ni la palabra «servidor»: no le dicen nada a quien las lee y
     le hacen sentir que se rompió por su culpa.
     ================================================================== */

  var EXCUSAS = {
    'sin-red':      'No tengo conexión ahora mismo. Lo intento luego.',
    'lento':        'La conexión va lenta. Vuelve a intentarlo.',
    'sin-servidor': 'La Plaza todavía no está abierta.',
    'sin-sesion':   'Tengo que pedirte el correo otra vez.',
    'limite':       'Vas muy rápido. Espera un momento.',
    'sin-base':     'La Plaza no está disponible ahora mismo.',
    'sin-puesto':   'Abre tu puesto antes de acercarte.',
    'contacto':     'Todavía no pongas tu contacto.',
    'no-existe':    'Ese puesto ya no está.',
    'incompleta':   'Falta qué haces o para quién.',
    'grande':       'Eso es demasiado largo.'
  };

  /** El texto que se le enseña a una persona por una respuesta con error.
      Si el servidor mandó su propio mensaje, ese gana: lo escribió alguien
      que sabía qué había pasado. */
  function excusa(r) {
    if (!r) return EXCUSAS['sin-red'];
    if (r.mensaje) return String(r.mensaje);
    return EXCUSAS[r.error] || 'Algo no salió bien. Vuelve a intentarlo.';
  }

  w.PlazaNube = {
    hay: hay,
    entrar: entrar,
    confirmar: confirmar,
    salir: salir,
    publicar: publicar,
    retirar: retirar,
    vecinos: vecinos,
    veoValor: veoValor,
    retirarValor: retirarValor,
    recibidos: recibidos,
    responder: responder,
    conversaciones: conversaciones,
    mensajes: mensajes,
    denunciar: denunciar,
    bloquear: bloquear,
    borrarme: borrarme,
    excusa: excusa,
    EXCUSAS: EXCUSAS
  };
})(window);
