/* ==========================================================================
   TU IDEA ES TUYA — la promesa que se hace antes de pedir la idea

   Justo antes de la primera pregunta del registro, el usuario está a punto de
   escribir lo único que de verdad le importa: su idea. Este es el momento en
   el que decide si se fía o si escribe algo genérico "por si acaso". Una idea
   escrita a medias envenena todo lo que viene después, porque la ruta, los
   desafíos y el mentor se escriben sobre ella.

   Por eso esto no es un aviso legal ni una pantalla de permisos: es un gesto.
   Habla Chispa, en primera persona, con tres frases cortas y un botón. No hay
   enlaces, no hay "leer más", no hay letra pequeña y no hay nada que aceptar:
   la ventana no pide permiso, tranquiliza.

   SE VE UNA VEZ EN LA VIDA
   La marca vive en settings (js/core/store.js) y no en el perfil del negocio,
   a propósito: es de la persona, así que sobrevive a registrar otra idea y no
   vuelve a aparecer nunca. Cerrarla con Esc o tocando fuera cuenta igual que
   pulsar el botón —sigue adelante y queda marcada— porque un gesto de
   acompañamiento que atrapa deja de serlo.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  /* El escudo. Va escrito en el viewBox de Chispa (0 0 100 108) y se inyecta
     dentro de su propio <svg>, no encima: colgado de .m-hold-r se mueve con el
     brazo derecho, que es justo el que saluda cuando entra con el ánimo
     'happy'. Sin relleno degradado, por lo mismo que las capas de la mascota:
     los ids de <defs> se generan al azar por instancia. */
  var ESCUDO =
    '<g class="m-hold-r"><g class="promesa__escudo">' +
      '<path d="M81 47.5 L91 51.6 V62.4 C91 69 86 72.8 81 74.9 C76 72.8 71 69 71 62.4 V51.6 Z" ' +
            'fill="#FFF6EE" stroke="#E0560A" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M78.9 61.2 v-2.4 a2.1 2.1 0 0 1 4.2 0 v2.4" fill="none" ' +
            'stroke="#E0560A" stroke-width="1.9" stroke-linecap="round"/>' +
      '<rect x="77.2" y="60.8" width="7.6" height="6.6" rx="1.7" fill="#FF6B1A"/>' +
    '</g></g>';

  /* Tres promesas, ni una más. Cada una dice algo distinto: para qué sirve,
     qué no pasa con ella y de qué vive la app. Ninguna promete nada que la
     app no cumpla.

     Los tres emojis están en la tabla de js/data/iconos.js a propósito: el
     alfabeto visual los sustituye por su dibujo, y si uno no estuviera se
     quedaría en emoji del sistema al lado de dos ilustraciones. La primera
     versión llevaba 🙌 y 💛, que no están, y la fila se veía descosida. */
  var FILAS = [
    ['✨',  'Solo la uso para ayudarte', 'Con ella escribo tu ruta y tus desafíos.'],
    ['🤝',  'No se publica',             'Nada sale de aquí hasta que tú lo decidas.'],
    ['❤️', 'No se vende',               'Emprendo no vive de tus datos. Nunca.']
  ];

  var TITULO = 'Tu idea es tuya 🔒';
  var ENTRADA = 'Lo que me cuentes lo uso solo para acompañarte y para que la app hable de TU negocio.';
  var CIERRE = 'Aquí puedes construir con tranquilidad. Tú mantienes el control.';

  /* ------------------------- La marca ------------------------- */

  function vista() {
    var s = w.Store && w.Store.state ? w.Store.state.settings : null;
    return !!(s && s.promesaVista);
  }

  function marcar() {
    if (!w.Store) return;
    w.Store.set(function (st) { st.settings.promesaVista = true; }, 'promesa');
  }

  /* ------------------------- La escena ------------------------- */

  function chispaConEscudo() {
    /* Chispa sin accesorios, y por dos razones.

       La primera es de dibujo: la ranura de la mano derecha ya la ocupa la
       herramienta del negocio —una cuchara, una llave, una libreta— y está en
       las mismas coordenadas que el escudo, así que se pisarían. Se ve al
       registrar una idea nueva, que es cuando el usuario ya tiene un negocio
       encima. El distintivo de avance cae justo debajo y añade ruido.

       La segunda es de fondo: aquí no habla el negocio del usuario, habla
       Emprendo. Es la misma razón por la que la pantalla de arranque tampoco
       hereda los colores del emprendimiento. */
    var m = el('div', {
      class: 'mascot mascot--md is-happy promesa__chispa',
      html: w.Mascot.svg('happy', { plano: true, etiqueta: 'Chispa protegiendo tu idea' })
    });
    // Se inyecta en el DOM y no concatenando cadenas: así el escudo entra
    // dentro del mismo viewBox y queda el último de todo, sobre el brazo.
    var svg = m.querySelector('svg');
    if (svg) svg.insertAdjacentHTML('beforeend', ESCUDO);
    return m;
  }

  function contenido(alCerrar) {
    var lista = el('div', { class: 'promesa__lista' });
    FILAS.forEach(function (f) {
      lista.appendChild(el('div', { class: 'promesa__fila' }, [
        el('span', { class: 'promesa__fila__ico', text: f[0] }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'promesa__fila__t', text: f[1] }),
          el('span', { class: 'promesa__fila__p', text: f[2] })
        ])
      ]));
    });

    return [
      el('div', { class: 'promesa__escena' }, [
        el('span', { class: 'promesa__aura' }),
        chispaConEscudo()
      ]),
      el('h2', { class: 'h3 promesa__titulo', text: TITULO }),
      el('p', { class: 'promesa__texto', text: ENTRADA }),
      lista,
      el('p', { class: 'promesa__cierre', text: CIERRE }),
      UI.btn('Entendido, continuar', {
        variant: 'brand', size: 'lg', shiny: true,
        onClick: alCerrar
      })
    ];
  }

  /* ------------------------- Mostrarla ------------------------- */

  /**
   * Abre la ventana. `onSeguir` se llama una sola vez, salga por donde salga:
   * botón, Esc o toque fuera. Nunca deja al usuario encerrado ni bloqueado.
   */
  function abrir(onSeguir) {
    var hecho = false;
    function seguir() {
      if (hecho) return;
      hecho = true;
      marcar();
      if (typeof onSeguir === 'function') onSeguir();
    }

    /* queueModal y no modal a secas: se llega aquí desde "Registrar una idea
       nueva", que viene de un UI.confirm recién cerrado. closeModal() vacía su
       capa 240 ms después y se llevaría por delante esta ventana si se pintara
       en ese hueco. La cola espera a que la capa esté libre de verdad. */
    UI.queueModal(function () {
      var m = UI.modal(contenido(function () { UI.closeModal(); }), { onClose: seguir });
      // modal() pinta siempre una caja `.modal` a secas: la clase propia se
      // añade aquí, y de ella cuelga todo el bloque de css/components.css.
      if (m && m.box) m.box.classList.add('promesa');
      if (w.Sound) w.Sound.select();
    });
  }

  /**
   * El único punto de entrada que deberían usar las pantallas: enseña la
   * promesa si es la primera vez y, si no, sigue de largo sin estorbar.
   * Devuelve true si llegó a enseñarse.
   */
  function antesDeRegistrar(onSeguir) {
    if (vista()) {
      if (typeof onSeguir === 'function') onSeguir();
      return false;
    }
    abrir(onSeguir);
    return true;
  }

  w.Promesa = {
    antesDeRegistrar: antesDeRegistrar,
    abrir: abrir,
    vista: vista,
    texto: { titulo: TITULO, entrada: ENTRADA, filas: FILAS, cierre: CIERRE }
  };
})(window, document);
