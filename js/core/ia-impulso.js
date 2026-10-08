/* ==========================================================================
   CHISPA CON IMPULSO — la vía de pago

   Lo mismo que hace js/core/ai-worker.js con la IA gratuita, pero contra el
   Worker de la Plaza y con la sesión dentro: un modelo de pago, respuestas
   más largas y memoria de la conversación.

   POR QUÉ CONTRA EL WORKER DE LA PLAZA Y NO CONTRA EL DE LA IA

   Porque hace falta contar por PERSONA, y para eso hace falta saber quién
   llama. El Worker de la IA gratuita no declara ningún almacenamiento y no
   recibe ninguna identidad: solo mira el origen y la IP. El de la Plaza ya
   tiene sesiones, base y limitador, así que la operación vive ahí.

   QUÉ CAMBIA RESPECTO A LA GRATUITA

     · El modelo lo paga Emprendo, así que no compite con nadie. La IA
       gratuita vive de una cuota compartida de Cloudflare que se agota a
       media tarde para todos a la vez; esto no.
     · 40 consultas al día y 600 al mes, y son suyas.
     · 900 tokens en vez de 400: las respuestas se pueden desarrollar.
     · 12 turnos de conversación en vez de 4, que es lo que permite que
       Chispa se acuerde de lo que se dijo hace un rato.

   LO QUE NO CAMBIA

   Que los niveles 1 a 6 de Chispa siguen resolviendo casi todo sin tocar la
   red, y que cuando esto no está —sin Impulso, sin sesión, sin conexión o
   con el cupo agotado— la app cae sola al camino de siempre. Limitar sin
   bloquear: la misma regla que ya tenía la IA gratuita.

   TRES REGLAS, LAS MISMAS DE plaza-nube.js
   1. Nunca lanza sin motivo: los errores previsibles vuelven como rechazo
      con un mensaje que se puede enseñar.
   2. La sesión viaja dentro del cuerpo, nunca en una cabecera.
   3. Lo que vuelve es texto de un modelo: se pinta con `text:`, jamás con
      `html:`.
   ========================================================================== */
(function (w) {
  'use strict';

  var ESPERA = 45000;   // el modelo tarda más que la Plaza; 25 s se quedaban cortos

  /* Cuánto se recuerda del cupo entre pantallas. Es solo para pintar: el tope
     de verdad lo lleva el servidor, y este número puede estar desfasado sin
     que pase nada. Se refresca al abrir el mentor. */
  var cupo = null;

  function url() {
    return (w.BRAND && w.BRAND.dominios && w.BRAND.dominios.plaza) || '';
  }

  /** ¿Puede responder esta vía ahora mismo?

      Tres cosas y las tres son necesarias: que haya servidor, que la persona
      tenga Impulso y que haya sesión. Sin cualquiera de ellas, `AI.ask()`
      sigue de largo hacia el camino de siempre. */
  function disponible() {
    if (!url()) return false;
    if (!w.Impulso || !w.Impulso.activo()) return false;
    return !!(w.Plaza && w.Plaza.sesion && w.Plaza.sesion());
  }

  function pide(op, datos) {
    if (!disponible()) return Promise.reject(new Error('Impulso no está disponible ahora mismo.'));

    var cuerpo = { op: op, sesion: w.Plaza.sesion() };
    for (var k in (datos || {})) {
      if (Object.prototype.hasOwnProperty.call(datos, k)) cuerpo[k] = datos[k];
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
        if (res.status === 401) {
          if (w.Plaza && w.Plaza.salir) w.Plaza.salir();
          if (w.Impulso) w.Impulso.olvidar();
          throw new Error('Tengo que pedirte el correo otra vez.');
        }
        if (!res.ok || !j || j.error) {
          /* El cupo agotado no es un fallo: es una respuesta. Se marca para
             que quien llama pueda decidir caer al camino gratuito en vez de
             enseñar un error. */
          var e = new Error((j && j.mensaje) || 'No pude preguntarle al modelo.');
          e.motivo = (j && j.error) || 'fallo';
          throw e;
        }
        return j;
      });
    }).catch(function (err) {
      if (avisa) clearTimeout(avisa);
      if (err && err.name === 'AbortError') throw new Error('El modelo tardó demasiado. Vuelve a intentarlo.');
      if (err && err.name === 'TypeError') throw new Error('Sin conexión. Sigo con lo que sé de memoria.');
      throw err;
    });
  }

  /**
   * Una consulta. Devuelve el texto, como todas las vías de `AI.ask()`.
   *
   * @param {string} texto      la pregunta
   * @param {object} opts       { sistema, historial }
   */
  function pedir(texto, opts) {
    opts = opts || {};
    return pide('chispa', {
      texto: String(texto || ''),
      sistema: opts.sistema || '',
      historial: opts.historial || []
    }).then(function (j) {
      /* El servidor manda lo que queda en cada respuesta, así que el número
         de la pantalla se mantiene solo sin una petición aparte. */
      if (typeof j.quedanHoy === 'number') {
        cupo = cupo || {};
        cupo.quedanHoy = j.quedanHoy;
        cupo.quedanMes = j.quedanMes;
        cupo.impulso = true;
      }
      return j.texto;
    });
  }

  /** Cuántas le quedan, sin gastar ninguna. */
  function pedirCupo() {
    if (!disponible()) return Promise.resolve(null);
    return pide('cupo', {}).then(function (j) {
      cupo = j;
      return j;
    }).catch(function () { return null; });
  }

  /** Lo último que dijo el servidor, para pintar sin esperar. Puede estar
      desfasado: el tope de verdad lo lleva el servidor. */
  function cupoConocido() { return cupo; }

  w.IAImpulso = {
    disponible: disponible,
    pedir: pedir,
    cupo: pedirCupo,
    cupoConocido: cupoConocido
  };
})(window);
