/* ==========================================================================
   PANTALLA DE ARRANQUE — el ciclo de vida

   Este archivo se carga como PRIMER script de <body>, antes que el resto de
   la app, y se pinta a sí mismo de forma síncrona. Ese orden es el requisito,
   no un detalle: si esperara a DOMContentLoaded o a `load`, el navegador ya
   habría tenido tiempo de pintar el caparazón vacío, y el destello blanco que
   esto viene a quitar aparecería igual.

   Lo que garantiza que no haya destello son tres cosas, en este orden:
     1. el <style> crítico de index.html pinta el naranja en el primer frame,
        antes incluso de que llegue ninguna hoja externa;
     2. este script inserta a Chispa antes de que se parsee el resto del body;
     3. manifest.webmanifest declara el mismo naranja como background_color,
        así que la pantalla que dibuja el sistema al abrir la PWA instalada ya
        es de este color y enlaza con esta sin corte.

   NUNCA SE QUEDA PEGADA. Hay tres relojes y el que primero llegue, manda:
     · el mínimo de animación (2.45 s) — para que no parpadee y desaparezca;
     · appReady(), que llama js/app.js cuando la primera pantalla ya está
       pintada — para que la transición sea instantánea y no un salto en negro;
     · un guardián de 3 s que la retira pase lo que pase. Se arma ANTES de que
       corra ningún otro script de la app: si el arranque revienta, si un
       archivo no llega o si Store lanza una excepción, la pantalla se va
       igual y el usuario ve lo que haya debajo en lugar de un naranja eterno.

   NO reproduce audio. Deliberado: los navegadores bloquean el sonido sin
   gesto previo del usuario, y un arranque que intenta sonar y falla deja un
   error en consola a cambio de nada.
   ========================================================================== */
(function (w, d) {
  'use strict';

  /* ------------------------------ Ajustes ------------------------------ */

  /* Cuánto dura la secuencia antes de empezar a irse. Tiene que cuadrar con
     los retardos de css/splash.css: el chispazo termina sobre los 2.4 s. */
  var MINIMO = 2450;

  /* Con `prefers-reduced-motion` no hay secuencia que respetar —todo salta a
     su fotograma final—, así que solo queda el tiempo de leer el logotipo. */
  var MINIMO_REDUCIDO = 1100;

  /* Lo que tarda el fundido de salida. Debe coincidir con .arranque.is-out. */
  var SALIDA = 340;

  /* El tope absoluto. Aunque la app no conteste nunca, a los 3 s esto se va. */
  var GUARDIAN = 3000;

  /* ------------------------------ Estado ------------------------------ */

  var nodo = null;          // el elemento en el DOM, o null si ya no está
  var montadaEn = 0;        // cuándo se PINTÓ el primer fotograma (no el montaje)
  var pintado = false;      // ¿ha llegado ya ese primer fotograma?
  var listo = false;        // ¿ya avisó la app de que terminó de arrancar?
  var cerrando = false;     // guarda contra un segundo cierre
  var relojes = [];         // todos los setTimeout vivos, para poder limpiarlos
  var metaOscuro = null;    // el <meta theme-color> oscuro, mientras está anulado
  var metaOscuroMedia = ''; // su atributo media original

  function reloj(fn, ms) {
    var id = w.setTimeout(fn, ms);
    relojes.push(id);
    return id;
  }

  function pararRelojes() {
    for (var i = 0; i < relojes.length; i++) w.clearTimeout(relojes[i]);
    relojes = [];
  }

  function ahora() {
    // Date.now() y no performance.now(): esto se compara con milisegundos de
    // setTimeout y no necesita precisión de submilisegundo.
    return new Date().getTime();
  }

  function reducido() {
    try {
      return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  /** El mínimo que toca según la preferencia de movimiento del sistema. */
  function minimo() {
    return reducido() ? MINIMO_REDUCIDO : MINIMO;
  }

  /* ------------------------------ El dibujo ------------------------------

     Chispa es naranja y el fondo también, así que aquí no puede salir con los
     colores de siempre o desaparecería contra su propia pantalla. Lleva un
     cuerpo más claro y un contorno crema que la separan del fondo. Todo lo
     demás —la silueta, la chispa de ocho puntas, los ojos, las mejillas, la
     sonrisa— es la Chispa de js/core/mascot.js, para que sea la misma de
     siempre y no un personaje parecido.

     El SVG solo contiene TRASLACIONES animadas (párpados y pupilas). Lo que
     escala —la chispa y los anillos— vive en capas HTML, porque escalar un
     <g> depende de `transform-box: fill-box` y no todos los navegadores lo
     resuelven igual. Trasladar, en cambio, no depende del origen en ninguno.
     ---------------------------------------------------------------------- */

  /* Geometría compartida con la mascota de la app. */
  var CUERPO = (w.Mascot && w.Mascot.CUERPO) ||
    'M50 28 C71 28 84 43 84 62 C84 82 69 93 50 93 C31 93 16 82 16 62 C16 43 29 28 50 28 Z';

  var CARA =
'<svg class="arranque__cara" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
  '<defs>' +
    '<linearGradient id="spCuerpo" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#FFC489"/><stop offset="100%" stop-color="#FF8A2B"/>' +
    '</linearGradient>' +
    // Un recorte por ojo: el párpado es un rectángulo que baja, y esto es lo
    // que hace que solo se vea dentro del ojo y no como una mancha suelta.
    '<clipPath id="spOjoI"><ellipse cx="39" cy="50" rx="8.6" ry="9.6"/></clipPath>' +
    '<clipPath id="spOjoD"><ellipse cx="61" cy="50" rx="8.6" ry="9.6"/></clipPath>' +
  '</defs>' +

  // tallo de la chispa
  '<path d="M50 23 L50 32" stroke="#FFD766" stroke-width="4.4" stroke-linecap="round"/>' +

  // cuerpo, con el contorno crema que lo despega del fondo naranja
  // La silueta la manda js/core/mascot.js, no una copia. Es lo único que
  // define al personaje, y tenerla en dos sitios era garantizar que algún día
  // dejaran de ser el mismo. Con reserva, por si mascot.js no hubiera cargado.
  '<path d="' + CUERPO + '" ' +
    'fill="url(#spCuerpo)" stroke="#FFF3E2" stroke-width="2.6" stroke-opacity=".85"/>' +
  '<ellipse cx="38" cy="42" rx="13" ry="9" fill="#fff" opacity=".22" transform="rotate(-22 38 42)"/>' +
  '<ellipse cx="27" cy="63" rx="6.2" ry="4.3" fill="#FF3E6C" opacity=".3"/>' +
  '<ellipse cx="73" cy="63" rx="6.2" ry="4.3" fill="#FF3E6C" opacity=".3"/>' +

  // ojos
  '<ellipse cx="39" cy="50" rx="8.6" ry="9.6" fill="#FFFDF8"/>' +
  '<ellipse cx="61" cy="50" rx="8.6" ry="9.6" fill="#FFFDF8"/>' +
  '<g class="sp-mirada">' +
    '<circle cx="39.6" cy="51" r="4.8" fill="#20344F"/><circle cx="41.4" cy="48.8" r="1.9" fill="#fff"/>' +
    '<circle cx="61.6" cy="51" r="4.8" fill="#20344F"/><circle cx="63.4" cy="48.8" r="1.9" fill="#fff"/>' +
  '</g>' +
  // párpados: en reposo quedan justo por encima del ojo (16→40) y al bajar 22
  // lo tapan entero (38→62). La franja oscura de abajo es la pestaña.
  '<g clip-path="url(#spOjoI)"><g class="sp-parpado">' +
    '<rect x="28" y="16" width="22" height="24" fill="#FFA95E"/>' +
    '<rect x="28" y="38" width="22" height="2" fill="#E0560A" opacity=".5"/>' +
  '</g></g>' +
  '<g clip-path="url(#spOjoD)"><g class="sp-parpado">' +
    '<rect x="50" y="16" width="22" height="24" fill="#FFA95E"/>' +
    '<rect x="50" y="38" width="22" height="2" fill="#E0560A" opacity=".5"/>' +
  '</g></g>' +

  // sonrisa
  '<path d="M40 63 Q50 76 60 63 Z" fill="#7A3A00"/>' +
  '<path d="M43.5 69 Q50 73.5 56.5 69 Q50 71.5 43.5 69Z" fill="#FF7E92"/>' +
'</svg>';

  /* La chispa de ocho puntas, en su propio SVG para poder escalarla desde el
     centro sin depender de transform-box. El viewBox está centrado en 0,0 y
     mide 32 unidades: dentro de una caja del 32% del cuadrado de Chispa, sus
     unidades coinciden con las del dibujo de la cara. */
  var SPARK =
'<svg viewBox="-16 -16 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
  '<defs><radialGradient id="spBrillo" cx="50%" cy="34%">' +
    '<stop offset="0%" stop-color="#FFF7D6"/><stop offset="100%" stop-color="#FFC400"/>' +
  '</radialGradient></defs>' +
  '<path d="M0 -14 L4.6 -4 L14 0 L4.6 4 L0 14 L-4.6 4 L-14 0 L-4.6 -4 Z" fill="url(#spBrillo)"/>' +
'</svg>';

  function plantilla(palabra) {
    return '' +
      '<div class="arranque__glow"></div>' +
      '<div class="arranque__chispa">' +
        '<div class="arranque__hop">' +
          CARA +
          '<span class="arranque__ring"></span>' +
          '<span class="arranque__ring arranque__ring--b"></span>' +
          '<div class="arranque__spark">' + SPARK + '</div>' +
          '<div class="arranque__motas">' +
            '<i class="arranque__mota arranque__mota--1"></i>' +
            '<i class="arranque__mota arranque__mota--2"></i>' +
            '<i class="arranque__mota arranque__mota--3"></i>' +
            '<i class="arranque__mota arranque__mota--4"></i>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="arranque__logo">' +
        '<span class="arranque__word">' + esc(palabra) + '</span>' +
        '<span class="arranque__bar"></span>' +
      '</div>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* --------------------------- Color del sistema ---------------------------

     index.html declara dos <meta theme-color>: el naranja de marca y uno
     oscuro para quien tiene el sistema en modo oscuro. Ese segundo gana por
     media query, y entonces la barra de estado sale azul marino alrededor de
     una pantalla naranja: exactamente el borde de otro color que hay que
     evitar.

     Se anula mientras dura el arranque y se devuelve tal cual al terminar.
     Se guarda el valor original en vez de darlo por conocido, por si algún
     día esa etiqueta cambia en el HTML.
     ---------------------------------------------------------------------- */

  function tomarBarra() {
    try {
      var m = d.querySelector('meta[name="theme-color"][media]');
      if (!m) return;
      metaOscuro = m;
      metaOscuroMedia = m.getAttribute('media') || '';
      m.setAttribute('media', 'not all');
    } catch (e) { /* sin barra que ajustar: no es motivo para no arrancar */ }
  }

  function soltarBarra() {
    if (!metaOscuro) return;
    try { metaOscuro.setAttribute('media', metaOscuroMedia); } catch (e) {}
    metaOscuro = null;
  }

  /* ------------------------------ Montaje ------------------------------ */

  /**
   * Pinta la pantalla de arranque y arranca los relojes.
   * @param {Element} [anfitrion] dónde insertarla. Por defecto, justo después
   *        de este script — es decir, arriba del todo del <body>.
   * @return {Element|null} el nodo insertado, o null si no procedía.
   */
  function montar(anfitrion) {
    if (nodo) return nodo;

    // Escotilla para desarrollo: ?nosplash=1 se salta el arranque entero.
    try {
      if (/[?&]nosplash=1/.test(w.location.search || '')) { terminar(); return null; }
    } catch (e) {}

    var marca = (w.BRAND && w.BRAND.logotipo) || 'EMPRENDO';

    nodo = d.createElement('div');
    nodo.id = 'arranque';
    nodo.className = 'arranque';
    // Decorativa de principio a fin: quien usa lector de pantalla no gana nada
    // con que se le lea, y sí pierde si le roba el foco a la app de debajo.
    nodo.setAttribute('role', 'presentation');
    nodo.setAttribute('aria-hidden', 'true');
    nodo.innerHTML = plantilla(marca);

    if (anfitrion && anfitrion.appendChild) {
      anfitrion.appendChild(nodo);
    } else {
      /* d.currentScript apunta a la etiqueta <script> que está ejecutándose.
         Insertar justo detrás la deja como primer elemento del body, que es
         donde tiene que estar para pintarse antes que nada. */
      var yo = d.currentScript;
      if (yo && yo.parentNode) yo.parentNode.insertBefore(nodo, yo.nextSibling);
      else if (d.body) d.body.appendChild(nodo);
      else { nodo = null; return null; }   // sin body no hay nada que hacer
    }

    /* Provisional: si rAF no llegara nunca —pestaña oculta al abrir, por
       ejemplo— el guardián cierra igual y esto evita una marca en cero. El
       valor bueno lo pone el doble rAF de abajo. */
    montadaEn = ahora();
    pintado = false;

    /* Dos fotogramas: el primero se encola antes de pintar, el segundo ya
       corre con el arranque en pantalla. Ese es el instante en el que las
       animaciones CSS empiezan a contar, así que es el que hay que medir. */
    try {
      w.requestAnimationFrame(function () {
        w.requestAnimationFrame(function () {
          montadaEn = ahora();
          pintado = true;
          /* El guardián se rearma desde aquí. Se armó al montar, pero el
             mínimo ahora se mide desde este instante: si el primer fotograma
             tarda, los 3 s del guardián vencían antes que el mínimo y cortaban
             la animación justo lo que se quería evitar. */
          reloj(function () { cerrar('guardian'); }, GUARDIAN + minimo());
        });
      });
    } catch (e) { pintado = true; }

    tomarBarra();

    /* El guardián se arma AQUÍ, antes de que exista ningún otro módulo de la
       app. Es lo único que hace que un fallo de arranque no deje la pantalla
       naranja para siempre.

       Pero cuenta desde que se parsea este archivo, y detrás quedan cincuenta
       scripts por bajar. En una primera visita sin caché y con mala red, los
       3 s se cumplen mientras la app todavía está cargando: el guardián
       destapaba el caparazón vacío justo en el momento en que peor se ve. Por
       eso se vuelve a armar cuando la página termina de cargar — ahí los 3 s
       ya significan «la app tuvo todo lo que necesitaba y aun así no
       contestó», que es lo que el guardián quería medir desde el principio. */
    reloj(function () { cerrar('guardian'); }, GUARDIAN);

    if (d.readyState !== 'complete') {
      w.addEventListener('load', function () {
        if (!nodo || listo) return;     // ya se fue, o la app ya confirmó
        pararRelojes();
        reloj(function () { cerrar('guardian'); }, GUARDIAN);
      }, { once: true });
    }

    // El teclado atraviesa lo que el ratón no: sin esto se puede tabular hasta
    // un botón de la app tapada y activarlo a ciegas.
    taparDebajo(true);

    return nodo;
  }

  /** Marca (o desmarca) como inalcanzable todo lo que el arranque tapa. */
  function taparDebajo(tapar) {
    var zonas = d.querySelectorAll('.stage, #toast-layer, #modal-layer, #sheet-layer');
    for (var i = 0; i < zonas.length; i++) {
      try {
        if (tapar) {
          zonas[i].setAttribute('inert', '');
          zonas[i].setAttribute('aria-hidden', 'true');   // respaldo para navegadores sin inert
        } else {
          zonas[i].removeAttribute('inert');
          zonas[i].removeAttribute('aria-hidden');
        }
      } catch (e) {}
    }
  }

  /* ------------------------------ Cierre ------------------------------ */

  /**
   * La app avisa de que su primera pantalla ya está pintada. Es idempotente:
   * js/app.js vuelve a llamar a boot() al restaurar un respaldo o al reiniciar
   * el progreso, y ninguna de esas dos cosas debe volver a mostrar el arranque.
   */
  function appReady() {
    if (listo) return;
    listo = true;
    if (!nodo) return;
    cerrarTrasElMinimo();
  }

  /* El mínimo en pantalla se cuenta desde el primer fotograma pintado, y por eso
     hay que esperar a que llegue.

     Aquí estaba el fallo que hacía que la animación solo se viera en escritorio.
     `montadaEn` se fijaba al montar, pero el reloj de las animaciones CSS no
     arranca hasta que el navegador pinta. En un escritorio el DOM está listo a
     los 86 ms y sobraban dos segundos largos; en un móvil, con el megabyte de
     scripts que carga esta app, boot() confirma pasados los 2450 ms del mínimo,
     `falta` salía negativo y el arranque se cerraba en ese mismo instante —justo
     cuando las animaciones acababan de empezar a verse—. El usuario veía un
     destello naranja y nada más. */
  function cerrarTrasElMinimo() {
    if (!nodo || cerrando) return;
    if (!pintado) { reloj(cerrarTrasElMinimo, 60); return; }   // el guardián acota la espera
    var falta = minimo() - (ahora() - montadaEn);
    if (falta <= 0) cerrar('app');
    else reloj(function () { cerrar('app'); }, falta);
  }

  /** Retira la pantalla con su fundido. `motivo` solo sirve para depurar. */
  function cerrar(motivo) {
    if (cerrando || !nodo) return;
    cerrando = true;
    pararRelojes();

    var quien = nodo;
    quien.className = 'arranque is-out';
    if (motivo === 'guardian') {
      // Merece constar: significa que boot() no llegó a terminar.
      console.warn('[splash] cerrado por el guardián: el arranque no confirmó');
    }
    w.setTimeout(function () {
      if (quien.parentNode) quien.parentNode.removeChild(quien);
      terminar();
    }, SALIDA);
  }

  /* Lo que hay que deshacer siempre, se haya llegado a montar o no: devolver
     el color de la barra y quitarle al <html> el naranja de arranque, para que
     vuelva a mandar el fondo normal de la app. */
  function terminar() {
    nodo = null;
    /* El estado del ciclo de vida vuelve atrás con el nodo. Si no, un segundo
       montar() —que hoy nadie hace, pero mañana sí— pasaría la guarda de
       arriba y dejaría el arranque puesto para siempre: cerrar() saldría en su
       primera línea sin hacer nada y ningún reloj quedaría vivo para
       insistir. */
    cerrando = false;
    listo = false;
    pararRelojes();
    taparDebajo(false);
    soltarBarra();
    try { d.documentElement.classList.add('app-lista'); } catch (e) {}
  }

  w.Splash = {
    montar: montar,
    appReady: appReady,
    cerrar: cerrar,
    /** ¿Sigue en pantalla? Útil para no encimar avisos sobre el arranque. */
    activa: function () { return !!nodo; }
  };

  // Se monta sola al cargarse: es una pantalla de arranque, no hay nada que
  // decidir después. Quien quiera colocarla en otro sitio llama a montar(otro)
  // con ?nosplash=1 en la URL, o la cierra y la vuelve a montar.
  montar();
})(window, document);
