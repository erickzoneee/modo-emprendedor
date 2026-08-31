/* ==========================================================================
   CÓMO SE CONTESTA — el motor de la captura

   El usuario habla, toca, elige o desliza; Chispa interpreta, ordena y
   confirma. Este archivo es las cuatro cosas:

     1. PINTA cualquier pregunta de js/data/preguntas.js en el modo que le
        toque, y deja cambiar de modo con un toque.
     2. ELIGE qué preguntar después, sin repetir nunca lo que ya sabe.
     3. ESCRIBE la respuesta en el perfil del emprendimiento (js/core/venture.js),
        que sigue siendo la única fuente de contexto de la app.
     4. DEVUELVE lo entendido para que el usuario lo confirme antes de guardarlo.

   TRES REGLAS QUE NO SE ROMPEN

     · Nada se guarda a ciegas. Lo dictado se enseña escrito antes de guardarlo.
       Lo deducido se enseña en el "esto entendí" antes de darlo por bueno.
     · «Todavía no lo sé» está siempre (salvo en la idea, sin la cual la app no
       puede escribir nada). No penaliza, no bloquea y no vuelve en 7 días.
     · Una pregunta por momento, tres al día como mucho. Esta app es para
       aprender a vender, no para rellenar un perfil.

   POR QUÉ EL MOTOR NO PINTA PANTALLAS
   Devuelve nodos, no rutas. La misma pregunta tiene que poder salir en el
   registro, en una hoja de "Mi emprendimiento" y en la tarjeta de fin de
   lección sin escribirse tres veces.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  var DIAS_SALTO = 7;       // días antes de volver a ofrecer algo que se saltó
  var MAX_DIA = 3;          // preguntas espontáneas por día, como mucho

  function V() { return w.Venture; }
  function txt(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function palabras(s) { return txt(s) ? txt(s).split(' ').length : 0; }
  function hoy() { return w.Store.today(); }

  /* ==================================================================
     EL CATÁLOGO
     ================================================================== */

  function todas() { return w.PREGUNTAS || []; }
  function preg(id) { return (w.PREGUNTA_POR_ID || {})[id] || null; }

  /** Las opciones de una pregunta, vengan escritas en el catálogo o de una
      lista blanca de config.js. Devolverlas normalizadas evita que cada modo
      tenga que saber de dónde salieron. */
  function opciones(p) {
    if (!p) return [];
    var lista = p.opciones;
    if (!lista && p.opcionesDe) lista = (w.CONFIG || {})[p.opcionesDe];
    if (!lista) return [];
    return lista.map(function (o) {
      return {
        key: o.key, emoji: o.emoji || '',
        title: o.title || '', sub: o.sub || o.ex || ''
      };
    });
  }

  /** El título legible de un valor guardado. Sin esto, "Lo que sé de tu
      negocio" enseñaría `hechoamano` en vez de "Hecho a mano". */
  function textoDe(p, valor) {
    if (valor === null || valor === undefined || valor === '') return '';
    if (p.escala) {
      var paso = (p.escala.pasos || []).filter(function (x) { return String(x.v) === String(valor); })[0];
      if (paso) return paso.t || String(valor);
    }
    var ops = opciones(p);
    if (ops.length) {
      var o = ops.filter(function (x) { return String(x.key) === String(valor); })[0];
      if (o) return o.title;
    }
    return String(valor);
  }

  var COMO = {
    voz: 'voz', tarjetas: 'tarjeta', rapidas: 'un toque', escala: 'escala',
    desliza: 'deslizar', completa: 'frase', ejemplos: 'ejemplo', escribe: 'escrito'
  };

  /* ==================================================================
     ESTADO — qué se ha preguntado y qué se sabe
     ================================================================== */

  function intake() {
    var v = V().active();
    if (!v.intake) v.intake = { done: false, asked: [], skipped: [], respuestas: {} };
    if (!Array.isArray(v.intake.asked)) v.intake.asked = [];
    if (!Array.isArray(v.intake.skipped)) v.intake.skipped = [];
    if (!v.intake.respuestas || typeof v.intake.respuestas !== 'object') v.intake.respuestas = {};
    return v.intake;
  }

  function setIntake(fn, razon) {
    return V().set(function (v) {
      if (!v.intake) v.intake = { done: false, asked: [], skipped: [], respuestas: {} };
      if (!Array.isArray(v.intake.asked)) v.intake.asked = [];
      if (!Array.isArray(v.intake.skipped)) v.intake.skipped = [];
      if (!v.intake.respuestas || typeof v.intake.respuestas !== 'object') v.intake.respuestas = {};
      fn(v.intake, v);
    }, razon || 'captura');
  }

  /** Lee del perfil el valor que esta pregunta guarda. La verdad vive en
      Venture, no en `intake.respuestas`: si el usuario corrige el sector desde
      otra pantalla, aquí se ve corregido. */
  function leer(g) {
    if (!g) return '';
    var v = V().active();
    if (g.indexOf('decision:') === 0) {
      var dec = V().decision(g.slice(9));
      return dec ? dec.value : '';
    }
    if (g.indexOf('metric:') === 0) {
      var m = v.metrics[g.slice(7)];
      return (m === 0 || m) ? m : '';
    }
    if (g.indexOf('core.resources.') === 0) return v.core.resources[g.slice(15)] || '';
    if (g.indexOf('core.') === 0) return v.core[g.slice(5)] || '';
    return '';
  }

  function valorDe(p) {
    return p ? leer(p.guarda) : '';
  }

  /** ¿Chispa ya sabe esto? Un valor guardado cuenta aunque nunca se preguntara
      por aquí: puede haber entrado por una misión o por el expediente. */
  function sabe(p) {
    var val = valorDe(p);
    // Un sitio alternativo donde el mismo dato pudo quedar escrito antes.
    if (!txt(val) && val !== 0 && p.alt) val = leer(p.alt);
    if (val === 0) return true;
    if (!txt(val)) return false;
    if (p.min && p.largo) return palabras(val) >= p.min;
    return true;
  }

  function preguntada(id) { return intake().asked.indexOf(id) >= 0; }

  /** ¿Se saltó hace poco? Volver a preguntar al día siguiente lo que alguien
      acaba de decir que no sabe es exactamente lo que esto viene a evitar. */
  function saltadaHacePoco(id) {
    var s = intake().skipped;
    for (var i = 0; i < s.length; i++) {
      var e = s[i];
      var eid = (e && e.id) || e;                 // tolera la forma vieja: solo el id
      if (eid !== id) continue;
      var at = (e && e.at) || 0;
      if (!at) return true;                        // sin fecha: se respeta para siempre
      return (Date.now() - at) < DIAS_SALTO * 86400000;
    }
    return false;
  }

  /* ==================================================================
     LA COLA — qué preguntar después
     ================================================================== */

  function aplica(p) {
    /* Las cuatro del registro tienen su propio guion y no entran aquí mientras
       se está registrando. Pero si al terminar falta alguna —porque se saltó, o
       porque el usuario pidió que Chispa la olvidara— sí vuelven a la cola: son
       lo único sin lo que la app no puede escribir nada suyo. */
    if (p.fase === 'registro' && !intake().done) return false;
    if (sabe(p)) return false;
    if (preguntada(p.id) && sabe(p)) return false;
    if (saltadaHacePoco(p.id)) return false;
    if (p.requiere) {
      for (var i = 0; i < p.requiere.length; i++) {
        var dep = preg(p.requiere[i]);
        if (dep && !sabe(dep)) return false;
      }
    }
    if (p.etapas && p.etapas.length) {
      var etapa = V().active().core.stage;
      if (p.etapas.indexOf(etapa) < 0) return false;
    }
    return true;
  }

  var ORDEN_FASE = { pronto: 0, luego: 1 };

  /** Todo lo que Chispa podría preguntar ahora mismo, en el orden en que le
      sirve. Lo usa la pantalla de "Mi emprendimiento" para enseñar la lista. */
  function pendientes(limite) {
    var out = todas().filter(aplica).sort(function (a, b) {
      var fa = ORDEN_FASE[a.fase] == null ? 9 : ORDEN_FASE[a.fase];
      var fb = ORDEN_FASE[b.fase] == null ? 9 : ORDEN_FASE[b.fase];
      if (fa !== fb) return fa - fb;
      return (a.peso || 0) - (b.peso || 0);
    });
    return limite ? out.slice(0, limite) : out;
  }

  /** La siguiente, o null. */
  function siguiente() {
    var lista = pendientes(1);
    return lista.length ? lista[0] : null;
  }

  /* ¿Es buen momento para preguntar por iniciativa propia? Tres condiciones,
     y las tres son para proteger al usuario, no al dato:
       · Que ya haya terminado el registro.
       · Que no se le hayan hecho ya tres preguntas hoy.
       · Que no haya una hoja o un modal abierto encima. */
  function hayMomento() {
    var v = V().active();
    if (!v.intake || !v.intake.done) return false;
    var c = contadorHoy();
    if (c >= MAX_DIA) return false;
    try {
      var capa = d.getElementById('sheet-layer');
      if (capa && !capa.hidden) return false;
      var mod = d.getElementById('modal-layer');
      if (mod && !mod.hidden) return false;
    } catch (e) { /* sin DOM no hay nada que estorbe */ }
    return true;
  }

  function contadorHoy() {
    var i = intake();
    return (i.hoyDia === hoy()) ? (i.hoyN || 0) : 0;
  }

  function apuntarPreguntaDelDia() {
    setIntake(function (i) {
      if (i.hoyDia !== hoy()) { i.hoyDia = hoy(); i.hoyN = 0; }
      i.hoyN = (i.hoyN || 0) + 1;
      i.ultimaAt = Date.now();
    }, 'captura-ritmo');
  }

  /* ==================================================================
     ESCRIBIR LA RESPUESTA
     ================================================================== */

  /** Guarda una respuesta en el perfil y la apunta como preguntada.
      `valor` ya viene confirmado por el usuario: aquí no se decide nada. */
  function responder(p, valor, modo) {
    if (!p || !p.guarda) return false;
    var g = p.guarda;
    var limpio = (typeof valor === 'string') ? txt(valor) : valor;
    if (limpio === '' || limpio === null || limpio === undefined) return false;

    /* Lo que guarda una pregunta cerrada es una clave de una lista blanca, no
       una frase. Aquí se comprueba, y no solo en la interfaz: el sector, la
       etapa o la personalidad viajan a persona.js y a temas.css, y un valor
       inventado no rompe nada de forma visible — simplemente apaga la mitad de
       la personalización sin que nadie se entere. */
    if (cerrada(p)) {
      var validos = opciones(p).map(function (o) { return String(o.key); });
      if (p.escala) validos = (p.escala.pasos || []).map(function (x) { return String(x.v); });
      if (validos.indexOf(String(limpio)) < 0) {
        console.warn('[captura] «' + limpio + '» no es una respuesta válida de ' + p.id);
        return false;
      }
    }

    if (g.indexOf('decision:') === 0) {
      V().recordDecision(g.slice(9), String(limpio), { label: p.etiqueta, from: 'captura' });

    } else if (g.indexOf('metric:') === 0) {
      var n = parseFloat(String(limpio).replace(/[^0-9.,-]/g, '').replace(',', '.'));
      if (isNaN(n)) return false;
      var clave = g.slice(7);
      V().set(function (v) { v.metrics[clave] = n; }, 'captura-metric');
      limpio = n;

    } else if (g.indexOf('core.') === 0) {
      var campo = g.slice(5);
      var patch = {};
      patch[campo] = limpio;
      /* Cambiar la idea, la oferta o el cliente cuando YA había algo escrito
         invalida los desafíos y análisis generados sobre lo anterior. reframe()
         es quien sabe tirar esa caché; patchCore, no. */
      var anterior = valorDe(p);
      if (p.largo && txt(anterior) && V().util.norm(String(limpio)) !== V().util.norm(String(anterior))) {
        V().reframe(patch);
      } else {
        V().patchCore(patch);
      }
    } else {
      return false;
    }

    setIntake(function (i) {
      if (i.asked.indexOf(p.id) < 0) i.asked.push(p.id);
      i.skipped = i.skipped.filter(function (e) { return ((e && e.id) || e) !== p.id; });
      i.respuestas[p.id] = { v: limpio, modo: modo || p.modo || 'escribe', at: Date.now() };
    }, 'captura-responder');

    despuesDe(p, limpio);
    return true;
  }

  /* Consecuencias de una respuesta concreta. Van aquí y no en la pantalla que
     preguntó, porque la misma pregunta se hace desde cuatro sitios. */
  function despuesDe(p, valor) {
    // El tiempo al día es lo que fija la meta diaria de XP.
    if (p.id === 'tiempo') {
      var min = parseInt(valor, 10) || 20;
      var meta = min <= 10 ? 20 : (min <= 20 ? 40 : 70);
      w.Store.set(function (s) { s.dailyGoal = meta; }, 'captura-meta');
    }
    // El objetivo elegido se convierte en el primer objetivo del plan. Y borra
    // el que estuviera escrito a mano: si no, terms() seguiría prefiriendo el
    // viejo y el usuario vería que su corrección no hizo nada.
    if (p.id === 'objetivo') {
      var o = opciones(p).filter(function (x) { return String(x.key) === String(valor); })[0];
      if (txt(V().active().core.goalText)) V().patchCore({ goalText: '' });
      if (o && !V().active().objectives.length) V().addObjective(o.title, '', '');
    }
    // Si el negocio se describe de otra manera, la apariencia puede haber
    // dejado de cuadrar. Se PROPONE, nunca se aplica sola.
    if ((p.id === 'idea' || p.id === 'oferta') && w.Persona && w.Persona.revisar) {
      try { w.Persona.revisar(); } catch (e) { /* es una mejora, no un requisito */ }
    }
  }

  /** «Todavía no lo sé». No es un fallo: es una respuesta legítima que se
      anota con fecha para no volver a insistir en una semana. */
  function saltar(p) {
    if (!p) return;
    setIntake(function (i) {
      if (i.asked.indexOf(p.id) < 0) i.asked.push(p.id);
      i.skipped = i.skipped.filter(function (e) { return ((e && e.id) || e) !== p.id; });
      i.skipped.push({ id: p.id, at: Date.now() });
    }, 'captura-saltar');
  }

  /** Que Chispa lo olvide. Borra el valor del perfil y la huella de haberlo
      preguntado, para que pueda volver a preguntarse desde cero. */
  function olvidar(id) {
    var p = preg(id);
    if (!p || !p.guarda) return false;
    var g = p.guarda;

    if (g.indexOf('decision:') === 0) {
      var k = g.slice(9);
      V().set(function (v) { delete v.decisions[k]; }, 'captura-olvidar');
    } else if (g.indexOf('metric:') === 0) {
      var m = g.slice(7);
      V().set(function (v) { delete v.metrics[m]; }, 'captura-olvidar');
    } else if (g.indexOf('core.resources.') === 0) {
      var r = g.slice(15);
      V().set(function (v) { v.core.resources[r] = (r === 'time' ? null : ''); }, 'captura-olvidar');
    } else if (g.indexOf('core.') === 0) {
      var c = g.slice(5);
      V().set(function (v) { v.core[c] = ''; }, 'captura-olvidar');
    }

    setIntake(function (i) {
      i.asked = i.asked.filter(function (x) { return x !== id; });
      i.skipped = i.skipped.filter(function (e) { return ((e && e.id) || e) !== id; });
      delete i.respuestas[id];
    }, 'captura-olvidar');

    // Lo generado sobre el dato viejo deja de valer.
    try { V().clearCache(); } catch (e) { /* la caché es una comodidad */ }
    return true;
  }

  /* ==================================================================
     PINTAR UNA PREGUNTA

     bloque(p, opts) devuelve un nodo con la pregunta entera: la burbuja de
     Chispa, el modo de contestar y las dos salidas de siempre. El modo se
     cambia en caliente sin volver a montar la cabecera.

     opts:
       onListo(valor, modo)  respuesta confirmada
       onSaltar()            «todavía no lo sé»
       sinCabecera           sin Chispa ni pregunta (la pone quien llama)
       modo                  fuerza un modo distinto al del catálogo
       valor                 qué hay contestado ya. Se pasa desde fuera porque
                             el registro trabaja sobre un borrador y todavía no
                             ha escrito nada en el perfil.
       compacto              la pregunta va dentro de una tarjeta que ya tiene
                             dueño y no puede ocupar la pantalla entera.
     ================================================================== */

  function bloque(p, opts) {
    opts = opts || {};
    var raiz = el('div', { class: 'cap' + (opts.compacto ? ' cap--compacto' : '') });

    if (!opts.sinCabecera) {
      raiz.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(opts.mood || 'neutral') }),
        el('div', { class: 'speech' }, [el('div', { class: 'small', text: p.chispa || '' })])
      ]));
      raiz.appendChild(el('div', { class: 'cap__q', text: p.q }));
      if (p.para) raiz.appendChild(el('div', { class: 'cap__para', text: p.para }));
    }

    var cuerpo = el('div', { class: 'col', style: { gap: '12px' } });
    raiz.appendChild(cuerpo);

    var pie = el('div', { class: 'cap__pie' });
    raiz.appendChild(pie);

    var modoActual = null;
    var actual = (opts.valor === undefined) ? valorDe(p) : opts.valor;

    function listo(valor, modo) {
      if (typeof opts.onListo === 'function') opts.onListo(valor, modo || modoActual);
    }

    function pintarModo(modo) {
      modoActual = modo;
      UI.clear(cuerpo);
      UI.clear(pie);

      var render = RENDER[modo] || RENDER.escribe;
      cuerpo.appendChild(render(p, listo, pintarModo, actual));

      /* "Prefiero escribirlo" solo donde escribir tenga sentido.

         En una pregunta de respuesta cerrada —el sector, la etapa, el
         objetivo— lo que se guarda no es texto sino una clave de una lista
         blanca. Ofrecer ahí un campo libre dejaba escribir "pastelería" en
         core.sector, que no es ninguna de las seis claves: a partir de ese
         momento la app perdía los ejemplos del oficio, la unidad de venta y
         el tema, sin un solo error en la consola. */
      if (modo !== 'escribe' && !cerrada(p)) {
        pie.appendChild(el('button', {
          class: 'cap__otra', type: 'button', text: 'Prefiero escribirlo',
          onclick: function () { w.Sound.tap(); pintarModo('escribe'); }
        }));
      }
      // Volver a la voz desde el teclado, si se puede dictar.
      if (modo === 'escribe' && (p.modo === 'voz') && puedeDictar()) {
        pie.appendChild(el('button', {
          class: 'cap__otra', type: 'button', text: 'Mejor te lo cuento hablando',
          onclick: function () { w.Sound.tap(); pintarModo('voz'); }
        }));
      }
      /* Reconocer el negocio en un ejemplo es mucho más fácil que describirlo,
         y para mucha gente es la única forma de contestar. Se ofrece siempre
         que la pregunta traiga ejemplos, no solo cuando falla el micrófono. */
      if (modo !== 'ejemplos' && p.ejemplos && p.ejemplos.length) {
        pie.appendChild(el('button', {
          class: 'cap__otra', type: 'button', text: 'Enséñame ejemplos parecidos',
          onclick: function () { w.Sound.tap(); pintarModo('ejemplos'); }
        }));
      }
      if (p.noSe !== false) {
        pie.appendChild(el('button', {
          class: 'cap__otra', type: 'button', text: 'Todavía no lo sé',
          onclick: function () {
            w.Sound.tap();
            if (typeof opts.onSaltar === 'function') opts.onSaltar();
          }
        }));
      }
    }

    var inicial = opts.modo || p.modo || 'escribe';
    // Un teléfono que no puede dictar no debe enseñar un micrófono muerto.
    if (inicial === 'voz' && !puedeDictar()) inicial = p.ejemplos ? 'ejemplos' : 'escribe';
    // Y un modo pedido desde fuera que la pregunta no puede dar, no se fuerza.
    if (inicial === 'rapidas' && !opciones(p).length) inicial = p.modo || 'escribe';
    pintarModo(inicial);

    return raiz;
  }

  function puedeDictar() {
    return !!(w.Dictado && w.Dictado.disponible());
  }

  /** ¿La respuesta es una de una lista, y no texto libre? Estas no se pueden
      escribir a mano ni dictar: lo que guardan es una clave, no una frase. */
  function cerrada(p) {
    return !!(opciones(p).length || p.escala);
  }

  /* ------------------------------------------------------------------
     MODO · NOTA DE VOZ
     ------------------------------------------------------------------ */

  /* El botón grande lleva silueta, no icono dibujado. El alfabeto visual de la
     app (js/data/iconos.js) pinta cada emoji con sus propios colores, y sobre
     el disco naranja del botón un micrófono morado se lee como una pegatina
     pegada encima. Aquí la silueta ES el botón: hereda su color, cambia a
     cuadrado al grabar y se entiende de lejos, que es lo único que importa
     cuando alguien está a punto de hablarle a su teléfono.

     El botón pequeño que se cuela en las misiones y en el mentor sí usa el
     dibujo de la app: allí va sobre blanco y convive con los demás iconos. */
  var SVG_MIC =
    '<svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor" aria-hidden="true" focusable="false">' +
      '<rect x="9" y="2" width="6" height="11" rx="3"/>' +
      '<path d="M5 10.5a1.1 1.1 0 0 1 2.2 0 4.8 4.8 0 0 0 9.6 0 1.1 1.1 0 0 1 2.2 0 7 7 0 0 1-5.9 6.9V20h2.4a1.1 1.1 0 0 1 0 2.2H8.5a1.1 1.1 0 0 1 0-2.2h2.4v-2.6A7 7 0 0 1 5 10.5Z"/>' +
    '</svg>';

  var SVG_STOP =
    '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true" focusable="false">' +
      '<rect x="5" y="5" width="14" height="14" rx="3.4"/>' +
    '</svg>';

  function modoVoz(p, listo, cambiarModo) {
    var caja = el('div', { class: 'voz' });

    var boton = el('button', { class: 'voz__btn', type: 'button',
      'aria-label': 'Grabar tu respuesta hablando', html: SVG_MIC });
    var halo = el('div', { class: 'voz__halo' }, [boton]);
    var ondas = el('div', { class: 'voz__ondas', hidden: true },
      [el('i'), el('i'), el('i'), el('i'), el('i'), el('i')]);
    var estado = el('div', { class: 'voz__estado', text: 'Toca y habla. Se detiene solo.' });
    var salida = el('div', { class: 'voz__texto is-vivo', hidden: true });
    var acciones = el('div', { class: 'col', style: { gap: '8px', width: '100%' }, hidden: true });

    caja.appendChild(halo);
    caja.appendChild(ondas);
    caja.appendChild(estado);
    caja.appendChild(salida);
    caja.appendChild(acciones);

    var escuchando = false;
    var ultimo = '';

    function reposo() {
      escuchando = false;
      halo.classList.remove('is-on');
      boton.classList.remove('is-on');
      boton.innerHTML = SVG_MIC;
      boton.setAttribute('aria-label', 'Grabar tu respuesta hablando');
      ondas.hidden = true;
    }

    function arrancar() {
      UI.clear(acciones);
      acciones.hidden = true;
      salida.hidden = false;
      salida.classList.add('is-vivo');
      salida.textContent = '';
      ultimo = '';

      var ok = w.Dictado.escuchar({
        onParcial: function (t) { salida.textContent = t; ultimo = t; },
        onTexto: function (t) { reposo(); revisar(t || ultimo); },
        onEstado: function (e) {
          if (e === 'escuchando') {
            escuchando = true;
            halo.classList.add('is-on');
            boton.classList.add('is-on');
            boton.innerHTML = SVG_STOP;
            boton.setAttribute('aria-label', 'Terminar la nota de voz');
            ondas.hidden = false;
            estado.textContent = 'Escuchando… toca para terminar';
          } else if (e === 'parando') {
            estado.textContent = 'Un segundo, lo estoy ordenando…';
          }
        },
        onFallo: function (clave) {
          reposo();
          caerAEscribir(clave);
        }
      });

      if (!ok) { reposo(); caerAEscribir('otro'); return; }
      w.Sound.tap();
    }

    /* Si el micrófono no se puede usar, no se dice "error": se cambia de modo
       y se explica en una línea qué pasó. Nadie tiene la culpa de su teléfono. */
    function caerAEscribir(clave) {
      var frase = clave === 'sin-permiso'
        ? 'No me diste permiso para el micrófono, y está bien. Escríbelo y listo.'
        : clave === 'sin-red'
          ? 'El dictado necesita conexión y ahora no hay. Escríbelo y seguimos.'
          : clave === 'sin-microfono'
            ? 'No encuentro el micrófono de este aparato. Escríbelo y seguimos.'
            : 'Aquí no puedo escucharte. Escríbelo y seguimos igual.';
      UI.toast(frase, 'blue', '✍️', 4200);
      cambiarModo('escribe');
    }

    /* Nada se guarda sin que lo vea escrito. Este es el paso que convierte una
       transcripción en una respuesta suya. */
    function revisar(t) {
      estado.textContent = '';
      salida.classList.remove('is-vivo');
      if (!txt(t)) {
        salida.hidden = true;
        estado.textContent = 'No llegué a oír nada. Prueba otra vez.';
        return;
      }
      salida.textContent = t;
      UI.clear(acciones);
      acciones.hidden = false;
      acciones.appendChild(UI.btn('Sí, eso dije', {
        variant: 'green', size: 'lg',
        onClick: function () { listo(t, 'voz'); }
      }));
      acciones.appendChild(el('div', { class: 'row', style: { gap: '8px' } }, [
        UI.btn('Corregir', { variant: 'ghost', onClick: function () { cambiarModo('escribe'); guardarBorrador(t); } }),
        UI.btn('Repetir', { variant: 'ghost', onClick: function () { estado.textContent = ''; arrancar(); } })
      ]));
    }

    boton.addEventListener('click', function () {
      if (escuchando) { w.Dictado.parar(); return; }
      arrancar();
    });

    // Si el bloque desaparece con el micrófono abierto, se cierra.
    var obs = setInterval(function () {
      if (!caja.isConnected) { clearInterval(obs); if (escuchando) w.Dictado.cancelar(); }
    }, 1500);

    return caja;
  }

  /* El texto de la nota que se quiere corregir viaja por aquí: cambiarModo()
     vuelve a montar el cuerpo entero, así que no puede pasarse por argumento. */
  var borrador = '';
  function guardarBorrador(t) { borrador = t || ''; }
  function tomarBorrador() { var b = borrador; borrador = ''; return b; }

  /* ------------------------------------------------------------------
     MODO · TARJETAS y RESPUESTAS RÁPIDAS
     ------------------------------------------------------------------ */

  function modoTarjetas(p, listo, _cambiar, actual) {
    var lista = el('div', { class: 'col stagger', style: { gap: '10px' } });
    opciones(p).forEach(function (o) {
      var b = el('button', {
        class: 'opt opt--card' + (String(actual) === String(o.key) ? ' is-selected' : ''),
        type: 'button',
        onclick: function () {
          w.Sound.select();
          w.Sound.buzz(10);
          UI.qsa('.opt', lista).forEach(function (n) { n.classList.remove('is-selected'); });
          b.classList.add('is-selected');
          w.FX.pop(b);
          setTimeout(function () { listo(o.key, 'tarjetas'); }, 240);
        }
      }, [
        el('span', { class: 'opt__emoji', text: o.emoji }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: o.title }),
          o.sub ? el('span', { class: 'opt__hint', text: o.sub }) : null
        ])
      ]);
      lista.appendChild(b);
    });
    return lista;
  }

  function modoRapidas(p, listo, _cambiar, actual) {
    var fila = el('div', { class: 'cap__chips' });
    opciones(p).forEach(function (o) {
      var b = el('button', {
        class: 'cap__chip' + (String(actual) === String(o.key) ? ' is-selected' : ''),
        type: 'button',
        text: (o.emoji ? o.emoji + ' ' : '') + o.title,
        onclick: function () {
          w.Sound.select();
          w.Sound.buzz(10);
          UI.qsa('.cap__chip', fila).forEach(function (n) { n.classList.remove('is-selected'); });
          b.classList.add('is-selected');
          w.FX.pop(b);
          setTimeout(function () { listo(o.key, 'rapidas'); }, 220);
        }
      });
      fila.appendChild(b);
    });
    return fila;
  }

  /* ------------------------------------------------------------------
     MODO · ESCALA VISUAL
     ------------------------------------------------------------------ */

  function modoEscala(p, listo, _cambiar, actual) {
    var esc = p.escala || { pasos: [] };
    var caja = el('div');
    var fila = el('div', { class: 'escala' });
    var dice = el('div', { class: 'escala__dice', hidden: true });
    var elegido = null;

    (esc.pasos || []).forEach(function (paso, i) {
      var b = el('button', { class: 'escala__paso', type: 'button',
        'aria-label': paso.t || String(i + 1) }, [
        el('span', { class: 'escala__cara', text: paso.cara }),
        el('span', { class: 'escala__n', text: String(i + 1) })
      ]);
      if (actual != null && String(actual) === String(paso.v)) {
        b.classList.add('is-selected');
        elegido = paso;
      }
      b.addEventListener('click', function () {
        w.Sound.select();
        w.Sound.buzz(10);
        UI.qsa('.escala__paso', fila).forEach(function (n) { n.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        elegido = paso;
        // Lo que Chispa deduce del tramo. Es la prueba de que la escala sirvió
        // para algo y no fue un número que se tragó un formulario.
        dice.hidden = false;
        dice.textContent = paso.dice || '';
        confirmar.disabled = false;
      });
      fila.appendChild(b);
    });

    caja.appendChild(fila);
    caja.appendChild(el('div', { class: 'escala__eje' }, [
      el('span', { text: esc.izq || '' }),
      el('span', { text: esc.der || '' })
    ]));
    caja.appendChild(dice);

    var confirmar = UI.btn('Así estoy', {
      variant: 'brand', size: 'lg',
      onClick: function () { if (elegido) listo(elegido.v, 'escala'); }
    });
    confirmar.disabled = !elegido;
    if (elegido) { dice.hidden = false; dice.textContent = elegido.dice || ''; }
    caja.appendChild(el('div', { style: { marginTop: '14px' } }, [confirmar]));

    return caja;
  }

  /* ------------------------------------------------------------------
     MODO · DESLIZAR (sí aplica / tal vez / no aplica)
     ------------------------------------------------------------------ */

  function modoDesliza(p, listo) {
    var items = (p.items || []).slice();
    var i = 0;
    var elegidos = { si: [], tal: [], no: [] };

    var caja = el('div', { class: 'desliza' });
    var cuenta = el('div', { class: 'desliza__cuenta' });
    var pila = el('div', { class: 'desliza__pila' });
    var acciones = el('div', { class: 'desliza__acciones' });
    caja.appendChild(cuenta);
    caja.appendChild(pila);
    caja.appendChild(acciones);

    function pintar() {
      UI.clear(pila);
      if (i >= items.length) return terminar();
      cuenta.textContent = (i + 1) + ' de ' + items.length;
      // Las dos de atrás enseñan que quedan más sin obligar a leer el contador.
      if (items[i + 2]) pila.appendChild(el('div', { class: 'desliza__card desliza__card--atras2' }));
      if (items[i + 1]) pila.appendChild(el('div', { class: 'desliza__card desliza__card--atras' }));
      var it = items[i];
      pila.appendChild(el('div', { class: 'desliza__card' }, [
        el('span', { class: 'desliza__emoji', text: it.emoji || '' }),
        el('span', { class: 'desliza__t', text: it.t }),
        it.sub ? el('span', { class: 'small', text: it.sub }) : null
      ]));
    }

    function elegir(cual) {
      if (i >= items.length) return;
      elegidos[cual].push(items[i].v);
      var carta = UI.qsa('.desliza__card', pila).pop();
      if (carta) carta.classList.add('is-sale-' + cual);
      w.Sound.select();
      w.Sound.buzz(8);
      i++;
      setTimeout(pintar, 200);
    }

    function terminar() {
      cuenta.textContent = '';
      UI.clear(acciones);
      var resumen = elegidos.si.length
        ? elegidos.si.join(' · ')
        : (elegidos.tal.length ? 'Tal vez: ' + elegidos.tal.join(' · ') : '');
      pila.appendChild(el('div', { class: 'desliza__card' }, [
        el('span', { class: 'desliza__emoji', text: elegidos.si.length ? '✅' : '🤔' }),
        el('span', { class: 'desliza__t', text: elegidos.si.length ? 'Ya está' : 'Ninguno todavía' }),
        el('span', { class: 'small', text: resumen || 'No pasa nada: lo vemos más adelante.' })
      ]));
      acciones.appendChild(UI.btn(elegidos.si.length ? 'Guardar' : 'Seguir', {
        variant: 'green', size: 'lg', block: true,
        onClick: function () { listo(resumen || 'Todavía ninguno', 'desliza'); }
      }));
    }

    [['no', '✕', 'No aplica'], ['tal', '🤔', 'Tal vez'], ['si', '✓', 'Sí aplica']]
      .forEach(function (a) {
        acciones.appendChild(el('button', {
          class: 'desliza__b desliza__b--' + a[0], type: 'button',
          onclick: function () { elegir(a[0]); }
        }, [el('span', { text: a[1] }), el('span', { text: a[2] })]));
      });

    pintar();
    return caja;
  }

  /* ------------------------------------------------------------------
     MODO · COMPLETAR LA FRASE
     ------------------------------------------------------------------ */

  function modoCompleta(p, listo) {
    var cfg = p.completa || { plantilla: '', huecos: {} };
    var valores = {};
    var caja = el('div', { class: 'col', style: { gap: '12px' } });
    var frase = el('div', { class: 'completa__frase' });
    var titBanco = el('div', { class: 'cap__banco-t' });
    var banco = el('div', { class: 'cap__chips' });
    var activo = null;
    var botones = {};

    caja.appendChild(frase);
    caja.appendChild(titBanco);
    caja.appendChild(banco);

    // La plantilla se parte por {clave}: el texto va tal cual y cada clave
    // se convierte en un hueco que se puede tocar.
    var trozos = String(cfg.plantilla).split(/(\{[a-zA-Z0-9_]+\})/);
    trozos.forEach(function (tr) {
      var m = /^\{([a-zA-Z0-9_]+)\}$/.exec(tr);
      if (!m) { frase.appendChild(d.createTextNode(tr)); return; }
      var clave = m[1];
      var b = el('button', { class: 'completa__hueco', type: 'button', text: '     ?     ',
        onclick: function () { w.Sound.tap(); abrir(clave); } });
      botones[clave] = b;
      frase.appendChild(b);
    });

    function abrir(clave) {
      activo = clave;
      var h = cfg.huecos[clave] || { ops: [] };
      UI.qsa('.completa__hueco', frase).forEach(function (n) { n.classList.remove('is-activo'); });
      if (botones[clave]) botones[clave].classList.add('is-activo');
      titBanco.textContent = h.label ? h.label + ':' : 'Elige una:';
      UI.clear(banco);
      (h.ops || []).forEach(function (op) {
        banco.appendChild(el('button', {
          class: 'cap__chip' + (valores[clave] === op ? ' is-selected' : ''),
          type: 'button', text: op,
          onclick: function () {
            w.Sound.select();
            valores[clave] = op;
            var bt = botones[clave];
            bt.textContent = op;
            bt.classList.add('is-lleno');
            bt.classList.remove('is-activo');
            w.FX.pop(bt);
            siguienteHueco();
          }
        }));
      });
    }

    function siguienteHueco() {
      var claves = Object.keys(cfg.huecos);
      for (var i = 0; i < claves.length; i++) {
        if (!valores[claves[i]]) { abrir(claves[i]); refrescar(); return; }
      }
      UI.clear(banco);
      titBanco.textContent = '';
      refrescar();
    }

    var guardar = UI.btn('Así lo digo yo', {
      variant: 'green', size: 'lg',
      onClick: function () { listo(componer(), 'completa'); }
    });
    guardar.disabled = true;
    caja.appendChild(guardar);

    function refrescar() {
      guardar.disabled = Object.keys(cfg.huecos).some(function (k) { return !valores[k]; });
    }

    function componer() {
      return String(cfg.plantilla).replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, k) {
        return valores[k] || '';
      });
    }

    siguienteHueco();
    return caja;
  }

  /* ------------------------------------------------------------------
     MODO · EJEMPLOS PARECIDOS
     ------------------------------------------------------------------ */

  function modoEjemplos(p, listo, cambiarModo) {
    var lista = el('div', { class: 'col stagger', style: { gap: '10px' } });
    (p.ejemplos || []).forEach(function (e) {
      var b = el('button', { class: 'opt', type: 'button', style: { alignItems: 'flex-start' },
        onclick: function () {
          w.Sound.select();
          w.FX.pop(b);
          setTimeout(function () { listo(e.v, 'ejemplos'); }, 220);
        }
      }, [
        el('span', { class: 'opt__emoji', text: e.emoji || '✨' }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: e.t }),
          e.cita ? el('span', { class: 'opt__hint', text: e.cita }) : null
        ])
      ]);
      lista.appendChild(b);
    });
    lista.appendChild(el('button', { class: 'opt', type: 'button', style: { alignItems: 'flex-start' },
      onclick: function () { w.Sound.tap(); cambiarModo(puedeDictar() ? 'voz' : 'escribe'); }
    }, [
      el('span', { class: 'opt__emoji', text: '🤷' }),
      el('span', { class: 'opt__body' }, [
        el('span', { text: 'Ninguno se parece' }),
        el('span', { class: 'opt__hint', text: 'Te lo cuento yo con mis palabras' })
      ])
    ]));
    return lista;
  }

  /* ------------------------------------------------------------------
     MODO · ESCRIBIR (el que siempre está)
     ------------------------------------------------------------------ */

  function modoEscribe(p, listo, _cambiar, actual) {
    var caja = el('div', { class: 'col', style: { gap: '12px' } });
    var campo;

    if (p.numero) {
      campo = el('input', { class: 'input', type: 'number', inputmode: 'decimal',
        placeholder: p.ph || '0' });
    } else if (p.largo) {
      campo = el('textarea', { class: 'textarea', rows: '4',
        maxlength: String(p.max || 300), placeholder: p.ph || '' });
    } else {
      campo = el('input', { class: 'input', type: 'text',
        maxlength: String(p.max || 90), placeholder: p.ph || '' });
    }

    // Lo que se dictó y se quiso corregir entra ya escrito, no en blanco.
    var previo = tomarBorrador() || String(actual == null ? '' : actual);
    campo.value = previo;

    var fila = el('div', { class: 'campo-con-voz' }, [campo]);
    var mic = micro(campo);
    if (mic) fila.appendChild(mic);
    caja.appendChild(fila);

    var guardar = UI.btn('Guardar', {
      variant: 'green', size: 'lg',
      onClick: function () { listo(txt(campo.value), 'escribe'); }
    });
    function refrescar() {
      var v = txt(campo.value);
      guardar.disabled = p.numero
        ? !v || isNaN(parseFloat(v.replace(',', '.')))
        : (p.min ? palabras(v) < p.min : !v);
    }
    campo.addEventListener('input', refrescar);
    refrescar();
    caja.appendChild(guardar);

    return caja;
  }

  var RENDER = {
    voz: modoVoz, tarjetas: modoTarjetas, rapidas: modoRapidas,
    escala: modoEscala, desliza: modoDesliza, completa: modoCompleta,
    ejemplos: modoEjemplos, escribe: modoEscribe
  };

  /* ==================================================================
     EL MICRÓFONO SUELTO — para los campos que ya existían

     Las misiones y el mentor tienen sus propios formularios. No hace falta
     rehacerlos: basta con dejar que se conteste hablando.
     ================================================================== */

  function micro(campo, opts) {
    if (!puedeDictar() || !campo) return null;
    opts = opts || {};
    var b = el('button', { class: 'mic', type: 'button', title: 'Contestar hablando',
      'aria-label': 'Contestar hablando' }, [el('span', { text: '🎤' })]);
    var on = false;
    var base = '';

    function apagar() {
      on = false;
      b.classList.remove('is-on');
      b.firstChild.textContent = '🎤';
    }

    b.addEventListener('click', function () {
      if (on) { w.Dictado.parar(); return; }
      base = txt(campo.value);
      var ok = w.Dictado.escuchar({
        onParcial: function (t) {
          campo.value = (base ? base + ' ' : '') + t;
        },
        onTexto: function (t) {
          apagar();
          campo.value = (base ? base + ' ' : '') + (t || '');
          // Los campos con validación escuchan 'input': sin esto el botón de
          // enviar se quedaba apagado con el campo lleno.
          campo.dispatchEvent(new Event('input', { bubbles: true }));
          if (typeof opts.onTexto === 'function') opts.onTexto(campo.value);
        },
        onEstado: function (e) {
          if (e !== 'escuchando') return;
          on = true;
          b.classList.add('is-on');
          b.firstChild.textContent = '⏹';
        },
        onFallo: function () {
          apagar();
          UI.toast('Aquí no puedo escucharte. Escríbelo y seguimos igual.', 'blue', '✍️', 3800);
        }
      });
      if (!ok) { apagar(); UI.toast('Aquí no puedo escucharte. Escríbelo y seguimos igual.', 'blue', '✍️', 3800); }
      else w.Sound.tap();
    });

    return b;
  }

  /** Pega un micrófono a un campo que ya está en el DOM, sin tocar su HTML. */
  function envolver(campo, opts) {
    var b = micro(campo, opts);
    if (!b || !campo.parentNode) return null;
    var fila = el('div', { class: 'campo-con-voz' });
    campo.parentNode.insertBefore(fila, campo);
    fila.appendChild(campo);
    fila.appendChild(b);
    return b;
  }

  /* ==================================================================
     UNA PREGUNTA EN UNA HOJA
     ================================================================== */

  function hoja(p, opts) {
    opts = opts || {};
    if (typeof p === 'string') p = preg(p);
    if (!p) return null;

    var cuerpo = bloque(p, {
      mood: 'think',
      onListo: function (valor, modo) {
        responder(p, valor, modo);
        UI.closeSheet();
        w.Sound.coin();
        UI.toast('Anotado. No te lo vuelvo a preguntar.', 'green', '✅', 2800);
        if (typeof opts.onListo === 'function') opts.onListo(valor, modo);
      },
      onSaltar: function () {
        saltar(p);
        UI.closeSheet();
        UI.toast('Sin problema. Lo vemos más adelante.', 'blue', '🤝', 2800);
        if (typeof opts.onSaltar === 'function') opts.onSaltar();
      }
    });

    /* "Que Chispa lo olvide". Solo cuando ya hay algo guardado, y detrás de una
       confirmación: borrar lo que la app sabe de tu negocio es un derecho, pero
       no puede pasar por rozar la pantalla. */
    if (opts.conOlvidar && txt(valorDe(p))) {
      var pie = UI.qs('.cap__pie', cuerpo);
      if (pie) {
        pie.appendChild(el('button', {
          class: 'cap__otra', type: 'button', style: { color: 'var(--red)' },
          text: 'Que Chispa lo olvide',
          onclick: function () {
            UI.confirm({
              title: '¿Lo borro?',
              text: 'Dejo de saber ' + (p.etiqueta || 'esto').toLowerCase() +
                    '. Podrás contármelo otra vez cuando quieras.',
              ok: 'Sí, olvídalo', cancel: 'Mejor no', danger: true, mood: 'sad'
            }).then(function (si) {
              if (!si) return;
              olvidar(p.id);
              UI.closeSheet();
              UI.toast('Ya no lo sé', 'blue', '🧽', 2600);
              if (typeof opts.onOlvidado === 'function') opts.onOlvidado();
            });
          }
        }));
      }
    }

    return UI.sheet([cuerpo]);
  }

  /* ==================================================================
     "ESTO ENTENDÍ"

     Dos frases con lo que Chispa dedujo. Lo deducido va marcado para que se
     revise en vez de asentir, y cada trozo lleva el id de la pregunta que lo
     escribió: tocarlo abre justo esa pregunta, no un formulario entero.
     ================================================================== */

  function entiendo() {
    var t = V().terms();
    var c = V().active().core;
    var partes = [];

    if (t.tiene.producto || t.tiene.idea) {
      /* terms() rellena el producto con la idea cuando todavía no hay oferta.
         Aquí importa de cuál de las dos salió: corregir esa frase tiene que
         abrir la pregunta que la escribió, no la que la app usó de sustituta.
         Sin esto, la línea decía «Qué entregas» y enseñaba la idea. */
      partes.push({ t: 'Vendes ' });
      partes.push({ t: t.producto, b: true, id: txt(c.offer) ? 'oferta' : 'idea' });
    } else {
      partes.push({ t: 'Todavía no me has contado qué vendes' });
    }

    if (t.tiene.cliente) {
      partes.push({ t: ', sobre todo para ' });
      partes.push({ t: t.cliente, b: true, id: 'cliente' });
    }
    if (t.lugar) {
      partes.push({ t: ', en ' });
      partes.push({ t: t.lugar, b: true, id: 'lugar' });
    }
    partes.push({ t: '. ' });

    if (t.etapaTexto) {
      partes.push({ t: 'Ahora mismo ' });
      partes.push({ t: t.etapaTexto, b: true, id: 'etapa' });
      if (t.objetivo) {
        partes.push({ t: ' y quieres ' });
        partes.push({ t: t.objetivo, b: true, id: 'objetivo' });
      }
      partes.push({ t: '.' });
    } else if (t.objetivo) {
      partes.push({ t: 'Quieres ' });
      partes.push({ t: t.objetivo, b: true, id: 'objetivo' });
      partes.push({ t: '.' });
    }

    var canales = V().decision('canales');
    if (canales && txt(canales.value)) {
      partes.push({ t: ' Lo mueves por ' });
      partes.push({ t: canales.value, b: true, id: 'canales' });
      partes.push({ t: '.' });
    }

    /* Lo que falta también se dice, y se puede tocar. Callarse un hueco no lo
       hace desaparecer: hace que el usuario descubra tres lecciones después
       que la app le hablaba de "tus clientes" porque nunca se lo contó.
       Dicho aquí, se arregla con un toque y sin sonar a reproche. */
    if (!t.tiene.cliente) {
      partes.push({ t: ' Todavía no sé ' });
      partes.push({ t: 'a quién le vendes', b: true, id: 'cliente' });
      partes.push({ t: ', y eso lo vemos juntos.' });
    }

    var plano = partes.map(function (x) { return x.t; }).join('');
    return { partes: partes, texto: txt(plano) };
  }

  /** La tarjeta naranja con lo entendido. Sin botones: los pone quien la usa. */
  function tarjetaEntiendo(res) {
    res = res || entiendo();
    var caja = el('div', { class: 'entiendo' });
    caja.appendChild(el('div', { class: 'entiendo__tag', text: 'Esto entendí de tu emprendimiento' }));
    var linea = el('div', { class: 'entiendo__texto' });
    res.partes.forEach(function (x) {
      if (x.b) linea.appendChild(el('b', { text: x.t }));
      else linea.appendChild(d.createTextNode(x.t));
    });
    caja.appendChild(linea);
    return caja;
  }

  /** Los tres botones. Nada se da por bueno sin pasar por aquí.
      opts: { onSi, onDuda, onCorregido, sinDuda } */
  function accionesEntiendo(opts) {
    opts = opts || {};
    var caja = el('div', { class: 'entiendo__acciones' });

    caja.appendChild(UI.btn('Sí, así es', {
      variant: 'green', size: 'lg', shiny: true,
      onClick: function () {
        setIntake(function (i) { i.confirmadoAt = Date.now(); i.dudaAt = 0; }, 'captura-confirma');
        w.Sound.complete();
        if (typeof opts.onSi === 'function') opts.onSi();
      }
    }));

    caja.appendChild(UI.btn('Quiero corregir algo', {
      variant: 'ghost',
      onClick: function () { hojaCorregir(opts); }
    }));

    if (!opts.sinDuda) {
      caja.appendChild(UI.btn('Todavía no lo tengo claro', {
        variant: 'flat',
        onClick: function () {
          setIntake(function (i) { i.dudaAt = Date.now(); }, 'captura-duda');
          UI.toast('Sin problema. Lo descubrimos juntos por el camino.', 'blue', '🤝', 3600);
          if (typeof opts.onDuda === 'function') opts.onDuda();
          else if (typeof opts.onSi === 'function') opts.onSi();
        }
      }));
    }

    return caja;
  }

  /** "Quiero corregir algo": la lista de lo entendido, y cada línea abre su
      propia pregunta en su propio modo. */
  function hojaCorregir(opts) {
    opts = opts || {};
    var res = entiendo();
    var vistos = {};
    var filas = el('div', { class: 'card', style: { textAlign: 'left' } });

    res.partes.forEach(function (x) {
      if (!x.b || !x.id || vistos[x.id]) return;
      var p = preg(x.id);
      if (!p) return;
      vistos[x.id] = true;
      filas.appendChild(el('button', {
        class: 'sabe__fila', type: 'button',
        style: { width: '100%', background: 'none', border: '0', borderBottom: '2px solid var(--line-2)' },
        onclick: function () {
          w.Sound.tap();
          UI.closeSheet();
          setTimeout(function () {
            hoja(p, { onListo: function () { if (typeof opts.onCorregido === 'function') opts.onCorregido(); } });
          }, 300);
        }
      }, [
        el('span', { class: 'sabe__ico', text: p.ico || '•' }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'sabe__k', text: p.etiqueta }),
          el('div', { class: 'sabe__v', text: x.t })
        ]),
        el('span', { style: { color: 'var(--ink-3)' }, text: '✏️' })
      ]));
    });

    UI.sheet([
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('h2', { class: 'h4', text: '¿Qué no cuadra?' }),
          el('div', { class: 'small', style: { marginTop: '4px' },
            text: 'Toca lo que quieras cambiar. Lo demás se queda como está.' })
        ])
      ]),
      filas
    ]);
  }

  /* ==================================================================
     LO QUE SÉ DE TU NEGOCIO
     ================================================================== */

  /** Todo lo capturado, con cómo se dijo. Lo pinta js/screens/venture.js. */
  function loQueSe() {
    var i = intake();
    var out = [];
    todas().forEach(function (p) {
      var val = valorDe(p);
      if (val === '' || val === null || val === undefined) return;
      var r = i.respuestas[p.id];
      out.push({
        id: p.id,
        ico: p.ico || '•',
        etiqueta: p.etiqueta || p.id,
        valor: textoDe(p, val),
        modo: r ? r.modo : null,
        como: r ? (COMO[r.modo] || r.modo) : null,
        at: r ? r.at : 0
      });
    });
    return out;
  }

  w.Captura = {
    // catálogo
    preg: preg, todas: todas, opciones: opciones, textoDe: textoDe,
    // estado
    sabe: sabe, valorDe: valorDe, preguntada: preguntada,
    pendientes: pendientes, siguiente: siguiente,
    hayMomento: hayMomento, apuntar: apuntarPreguntaDelDia,
    // escritura
    responder: responder, saltar: saltar, olvidar: olvidar,
    // pintar
    bloque: bloque, hoja: hoja, micro: micro, envolver: envolver,
    puedeDictar: puedeDictar, cerrada: cerrada,
    // esto entendí
    entiendo: entiendo, tarjetaEntiendo: tarjetaEntiendo,
    accionesEntiendo: accionesEntiendo, corregir: hojaCorregir,
    // revisión
    loQueSe: loQueSe
  };
})(window, document);
