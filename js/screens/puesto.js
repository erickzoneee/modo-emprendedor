/* ==========================================================================
   DECORAR MI PUESTO

   La pantalla donde el usuario manda sobre su puesto. La app propone un
   puesto de serie —festón y el color de su oficio— y aquí él lo cambia.

   LA VISTA PREVIA ES EL PUESTO DE VERDAD
   Se pinta con `PlazaScreen.dibujar()`, la misma función que dibuja el puesto
   en la Plaza, con los mismos tokens y las mismas piezas. Es la misma regla
   que ya sigue Personalizar mi experiencia: si algo se ve mal aquí, se ve mal
   allí, y esa es justo la idea.

   NADA SE APRUEBA DOS VECES
   El texto de la vitrina pasa por «Así está bien» porque lo escribió la app y
   él tiene que revisarlo. La decoración no: la eligió él, mirando el puesto
   entero mientras la elegía. Por eso cada toque se guarda solo, y si su
   puesto ya está abierto, sale hacia la Plaza sin preguntar nada.

   POR QUÉ EL ENVÍO ESPERA
   Elegir cinco piezas son cinco toques en veinte segundos. Publicar en cada
   uno serían cinco viajes a la red para dejar el mismo resultado que uno
   solo, así que el envío espera a que deje de tocar. Lo que NO espera es el
   guardado: eso es suyo y es inmediato.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  function P() { return w.Plaza; }
  function PU() { return w.Puesto; }
  function K() { return w.PUESTO_PIEZAS; }

  var ESPERA_ENVIO = 1400;
  var temporizador = null;

  /* ==================================================================
     GUARDAR Y PUBLICAR
     ================================================================== */

  /**
   * Manda el puesto decorado a la Plaza, si hay puesto abierto y sesión.
   *
   * Poner al día la vitrina aprobada NO se hace aquí: lo hace js/core/puesto.js
   * en cuanto se toca una pieza, venga el toque de donde venga. Aquí solo
   * queda el viaje a la red, que es lo único que sí es de la pantalla — es la
   * que puede esperar a que deje de tocar y avisar si falla.
   *
   * Nunca lanza: si no hay servidor o no hay sesión, el puesto se queda
   * decorado aquí y saldrá el día que entre con su correo, igual que pasa al
   * abrirlo por primera vez.
   */
  function sincronizar() {
    var v = P().vitrina();
    if (!v || !P().conectado() || !w.PlazaNube) return;

    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      temporizador = null;
      /* Se vuelve a pedir la vitrina aquí dentro y no se usa la de arriba:
         entre el toque y este momento pudo cambiar tres piezas más, y mandar
         la de hace un segundo publicaría un puesto que ya no existe. */
      var ahora = P().vitrina();
      if (!ahora) return;
      w.PlazaNube.publicar(ahora).then(function (r) {
        if (!r || !r.ok) UI.toast(w.PlazaNube.excusa(r), 'red', '🕯️');
      });
    }, ESPERA_ENVIO);
  }

  /* ==================================================================
     LA PANTALLA
     ================================================================== */

  function sector() {
    var v = P().vitrina() || (P().propuesta() || {}).vitrina;
    return (v && v.sector) || 'otro';
  }

  /** El puesto de la vista previa. Si todavía no hay uno aprobado se usa la
      propuesta: decorar antes de abrir tiene que poder verse. */
  function vitrinaPreview() {
    var v = P().vitrina();
    if (v) return v;
    var p = P().propuesta();
    return (p && p.vitrina) || null;
  }

  function pintarPreview(caja) {
    UI.clear(caja);
    caja.appendChild(el('div', { class: 'dec-previa__sol', 'aria-hidden': 'true' }));

    var v = vitrinaPreview();
    if (!v) {
      caja.appendChild(el('div', { class: 'small t-center',
        text: 'Cuéntame un poco más de tu negocio y aquí verás tu puesto.' }));
      return;
    }
    caja.appendChild(w.PlazaScreen.dibujar(v, { mio: true }));
  }

  function render() {
    var K2 = K();
    var root = el('div', { class: 'screen' });

    root.appendChild(el('div', { class: 'row', style: { gap: '12px', marginBottom: '2px' } }, [
      /* Se entra desde la Plaza, así que volver por el historial deja al
         usuario donde estaba. Si la pila está vacía —tras recargar— cae en la
         Plaza, que es de donde debería haber venido. */
      UI.backBtn(function () { UI.Router.back('plaza'); }),
      el('h1', { class: 'h3', text: 'Decorar mi puesto' })
    ]));

    root.appendChild(UI.chispaDice('explicando',
      'Tu puesto se ve como tú quieras. Nada de esto cambia lo que dice: solo cómo se ve.'));

    /* ---------------- Vista previa ---------------- */
    var previa = el('div', { class: 'dec-previa' });
    root.appendChild(previa);
    pintarPreview(previa);

    /* ---------------- Las cinco ranuras ---------------- */
    K2.RANURAS.forEach(function (ranura) {
      root.appendChild(grupo(ranura, previa));
    });

    /* ---------------- Volver a lo de serie ---------------- */
    root.appendChild(el('div', { class: 'tiny t-center',
      style: { marginTop: '10px', textTransform: 'none', letterSpacing: '0' },
      text: PU().esDefecto(PU().actual())
        ? 'Tu puesto está tal y como venía.'
        : 'Se guarda solo. Si tu puesto ya está abierto, tus vecinos lo verán así.' }));

    root.appendChild(UI.btn('Dejarlo como venía', {
      variant: 'flat',
      disabled: PU().esDefecto(PU().actual()),
      onClick: function () {
        UI.confirm({
          title: '¿Le quito la decoración?',
          text: 'Tu puesto vuelve al toldo de siempre y al color de tu oficio. Lo que dice no cambia.',
          ok: 'Sí, quítala', cancel: 'Mejor no', mood: 'sad'
        }).then(function (si) {
          if (!si) return;
          PU().restablecer();
          sincronizar();
          UI.toast('Como venía', 'blue', '🧹');
          UI.Router.refresh();
        });
      }
    }));

    return root;
  }

  /* ==================================================================
     UN GRUPO DE OPCIONES
     ================================================================== */

  function grupo(ranura, previa) {
    var K2 = K();
    var caja = el('div', { class: 'dec-grupo' }, [
      el('div', { class: 'dec-grupo__t', text: K2.TITULO[ranura] }),
      el('div', { class: 'dec-grupo__p', text: K2.PISTA[ranura] })
    ]);

    var rejilla = el('div', { class: 'dec-rejilla' });
    var elegido = PU().actual()[ranura];

    K2.claves(ranura).forEach(function (clave) {
      var pieza = K2.CATALOGO[ranura][clave];
      var boton = el('button', {
        class: 'dec-op' + (clave === elegido ? ' is-on' : ''),
        type: 'button',
        'aria-pressed': clave === elegido ? 'true' : 'false',
        'aria-label': K2.TITULO[ranura] + ': ' + pieza.nombre,
        onclick: function () { elegir(ranura, clave, rejilla, boton, previa); }
      }, [
        PU().muestra(ranura, clave, sector()),
        el('span', { class: 'dec-op__n', text: pieza.nombre })
      ]);
      rejilla.appendChild(boton);
    });

    caja.appendChild(rejilla);
    return caja;
  }

  function elegir(ranura, clave, rejilla, boton, previa) {
    if (!PU().set(ranura, clave)) return;
    w.Sound.tap();

    /* Se repinta la rejilla de ESTA ranura y la vista previa, no la pantalla
       entera: un refresh devolvería el scroll arriba y quien está eligiendo
       adornos —el último grupo— acabaría cada toque mirando la cabecera. */
    Array.prototype.forEach.call(rejilla.children, function (b) {
      b.classList.remove('is-on');
      b.setAttribute('aria-pressed', 'false');
    });
    boton.classList.add('is-on');
    boton.setAttribute('aria-pressed', 'true');

    /* Las muestras de las otras ranuras enseñan el puesto tal y como está: al
       cambiar el color, la muestra del letrero tiene que cambiar con él. Se
       repintan las que dependen de lo que se acaba de tocar. */
    if (ranura === 'color' || ranura === 'toldo') refrescarMuestras(previa);

    pintarPreview(previa);
    sincronizar();
  }

  /** Vuelve a dibujar las muestras que dependen del color o del toldo. Se
      buscan por el atributo y no por una referencia guardada: la pantalla se
      puede haber repintado entera por otra razón entremedias. */
  function refrescarMuestras(previa) {
    var e = PU().actual();
    var raiz = previa && previa.parentNode;
    if (!raiz) return;

    Array.prototype.forEach.call(raiz.querySelectorAll('.dec-m--letrero'), function (m) {
      m.setAttribute('data-pz-color', e.color);
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.dec-m--color'), function (m) {
      m.setAttribute('data-pz-toldo', e.toldo);
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.dec-m--toldo'), function (m) {
      m.setAttribute('data-pz-color', e.color);
    });
  }

  UI.Router.register('puesto', render);

  w.PuestoScreen = { open: function () { UI.Router.go('puesto'); } };
})(window, document);
