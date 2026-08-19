/* ==========================================================================
   ICONOS — quién los pinta, dónde y en lugar de qué

   El dibujo vive en js/data/iconos.js. Este archivo hace tres cosas:

     1. Deja los degradados una sola vez en la página (un <svg> escondido).
     2. Devuelve un icono suelto cuando alguien lo pide por su nombre.
     3. Cambia los emojis por iconos según se van pintando pantallas.

   Lo tercero es lo que evita reescribir cuarenta archivos. El emoji sigue
   escrito en el código de la lección —🔥 se lee mejor que 'fuego' cuando
   estás editando una racha— y aquí, al llegar a la pantalla, se sustituye por
   el dibujo. Con dos cuidados que no son opcionales:

   · El emoji NO se borra: se queda dentro, escondido en un .sr-only. Así el
     textContent del nodo sigue diciendo exactamente lo que decía antes. Hay
     código en la app que lee texto de la pantalla y lo copia al portapapeles
     o lo manda a leer en voz alta; si el emoji desapareciera, esas dos cosas
     empezarían a devolver frases con un hueco. Y el lector de pantalla sigue
     anunciando el emoji, igual que antes; el SVG va aria-hidden para que no
     se lea dos veces.

   · Ni los campos de texto ni lo que el usuario escribe se tocan nunca. Un
     emoji dentro de un <textarea> es SU emoji, no decoración nuestra.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var DATOS = w.ICONOS;
  if (!DATOS) return;

  var CAT = DATOS.catalogo;
  var MAPA = DATOS.emoji;

  /* ------------------------- Los degradados, una vez -------------------------

     Todos los iconos apuntan a url(#b-naranja) y compañía. Ese id tiene que
     existir en el documento, no dentro de cada icono: así el navegador
     resuelve catorce degradados en total y no dos por cada icono en pantalla.

     El <svg> que los guarda mide 0×0 y está fuera del flujo. `hidden` no vale
     aquí: en algunos navegadores un ancestro con display:none deja de
     resolver las referencias a sus degradados y los iconos salen negros.   */

  var ID_DEFS = 'ico-defs';
  var puestos = false;

  function ponDefs(doc) {
    doc = doc || d;
    if (doc === d && puestos) return;
    if (doc.getElementById(ID_DEFS)) { puestos = true; return; }
    var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', ID_DEFS);
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';
    svg.innerHTML = '<defs>' + DATOS.defs() + '</defs>';
    (doc.body || doc.documentElement).appendChild(svg);
    if (doc === d) puestos = true;
  }

  /* ------------------------------ Un icono suelto ------------------------------ */

  function existe(nombre) {
    return !!(nombre && Object.prototype.hasOwnProperty.call(CAT, nombre));
  }

  /** El nombre del icono que le toca a un emoji, o null si no tiene. */
  function deEmoji(car) {
    return Object.prototype.hasOwnProperty.call(MAPA, car) ? MAPA[car] : null;
  }

  /* ------------------------------ Quién se mueve ------------------------------

     Casi todos los iconos tienen una animación propia, pero muy pocos la
     tienen ENCENDIDA. Un engranaje girando sin parar dentro del párrafo de
     una lección no da vida: distrae de la frase que hay que leer, y con
     quince iconos animados a la vez la pantalla no descansa en ningún sitio.

     Así que la animación en bucle es para los seis que viven en la barra
     superior y en las celebraciones —los que el usuario mira de reojo para
     saber cómo va, no para leerlos—. El resto la tiene cargada y quieta, y la
     suelta al pasar el dedo o el cursor por encima. Es la diferencia entre
     una app viva y una app inquieta.                                        */

  var VIVOS = { fuego: 1, chispas: 1, estrella: 1, moneda: 1, corazon: 1, cohete: 1 };

  /**
   * El SVG de un icono. Siempre lleva su clase de animación: la CSS la deja
   * en pausa y solo la echa a andar si el envoltorio tiene data-vivo o si el
   * dedo está encima.
   */
  function svg(nombre) {
    if (!existe(nombre)) return '';
    var i = CAT[nombre];
    return '<svg class="ico__svg' + (i.vivo ? ' es-' + i.vivo : '') + '"' +
           ' viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + i.svg + '</svg>';
  }

  /** El icono envuelto y listo para insertar como HTML. */
  function html(nombre, opts) {
    if (!existe(nombre)) return '';
    opts = opts || {};
    var eco = opts.eco != null ? opts.eco : '';   // el emoji al que sustituye, si sustituye a alguno
    var vivo = opts.vivo != null ? opts.vivo : VIVOS[nombre];
    return '<span class="ico ico--' + nombre + '" data-ico="' + nombre + '"' + (vivo ? ' data-vivo' : '') + '>' +
             svg(nombre) +
             (eco ? '<span class="sr-only">' + eco + '</span>' : '') +
           '</span>';
  }

  /** El icono como nodo del DOM. */
  function nodo(nombre, opts) {
    if (!existe(nombre)) return null;
    opts = opts || {};
    var span = d.createElement('span');
    span.className = 'ico ico--' + nombre;
    span.dataset.ico = nombre;
    if (opts.vivo != null ? opts.vivo : VIVOS[nombre]) span.dataset.vivo = '';
    span.innerHTML = svg(nombre) + (opts.eco ? '<span class="sr-only">' + opts.eco + '</span>' : '');
    return span;
  }

  /* --------------------------- Encontrar los emojis ---------------------------

     Una sola expresión con todas las claves de la tabla, ordenadas de más
     larga a más corta. El orden importa de verdad: '⚙️' es '⚙' seguido del
     selector de variación U+FE0F, así que si la corta fuera primero
     dejaríamos el selector suelto detrás del icono, y se ve.               */

  var RE = (function () {
    var claves = Object.keys(MAPA).sort(function (a, b) { return b.length - a.length; });
    if (!claves.length) return null;
    var partes = claves.map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    return new RegExp('(' + partes.join('|') + ')', 'g');
  })();

  /* Dónde NO se entra jamás. Lo que el usuario escribe es suyo; y dentro de
     un icono ya pintado está el propio emoji escondido, así que volver a
     entrar ahí sería un bucle infinito. */
  var VETADO = 'input, textarea, select, option, [contenteditable], .ico, .sr-only, script, style, svg, .sin-iconos';

  function vetado(nodo) {
    var el = nodo.nodeType === 1 ? nodo : nodo.parentElement;
    return !el || !!el.closest(VETADO);
  }

  /** Cambia los emojis de un trozo de texto por iconos. Devuelve un fragmento
      o null si no había ninguno. */
  function fragmentoDe(texto) {
    RE.lastIndex = 0;
    if (!RE.test(texto)) return null;
    RE.lastIndex = 0;
    var frag = d.createDocumentFragment();
    var ultimo = 0, m;
    while ((m = RE.exec(texto))) {
      if (m.index > ultimo) frag.appendChild(d.createTextNode(texto.slice(ultimo, m.index)));
      var pieza = nodo(MAPA[m[1]], { eco: m[1] });
      frag.appendChild(pieza || d.createTextNode(m[1]));
      ultimo = m.index + m[1].length;
    }
    if (ultimo < texto.length) frag.appendChild(d.createTextNode(texto.slice(ultimo)));
    return frag;
  }

  /** Recorre una rama del DOM y cambia todos sus emojis por iconos. */
  function pinta(raiz) {
    if (!RE || !raiz) return raiz;
    ponDefs();

    if (raiz.nodeType === 3) {
      if (vetado(raiz)) return raiz;
      var f = fragmentoDe(raiz.nodeValue);
      if (f && raiz.parentNode) raiz.parentNode.replaceChild(f, raiz);
      return raiz;
    }
    if (raiz.nodeType !== 1 && raiz.nodeType !== 11) return raiz;
    if (raiz.nodeType === 1 && raiz.closest && raiz.closest(VETADO)) return raiz;

    /* Se recogen primero y se cambian después: sustituir un nodo de texto
       mientras el TreeWalker lo está recorriendo lo deja apuntando a un nodo
       que ya no está en el árbol, y el recorrido se corta a la mitad. */
    var walker = d.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || n.nodeValue.length < 1) return NodeFilter.FILTER_REJECT;
        if (vetado(n)) return NodeFilter.FILTER_REJECT;
        RE.lastIndex = 0;
        return RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var pendientes = [], n;
    while ((n = walker.nextNode())) pendientes.push(n);
    pendientes.forEach(function (t) {
      var frag = fragmentoDe(t.nodeValue);
      if (frag && t.parentNode) t.parentNode.replaceChild(frag, t);
    });
    return raiz;
  }

  /** La versión para cadenas: devuelve HTML, para quien pinta con innerHTML. */
  function pintaTexto(texto) {
    if (!RE || texto == null) return texto;
    return String(texto).replace(RE, function (m) {
      return html(MAPA[m], { eco: m }) || m;
    });
  }

  /* ------------------------------- El vigilante -------------------------------

     Las pantallas se pintan de golpe (Router.go), pero los toasts, las hojas,
     los modales y la barra superior aparecen por su cuenta y en cualquier
     momento. Enganchar el cambio en cada uno de esos sitios eran seis
     enganches que alguien tendría que acordarse de poner en el séptimo.

     Un observador sobre las capas de la app no hay que acordarse de nada: lo
     que se añada, se pinta. Se agrupan las mutaciones en un rAF porque una
     sola pantalla dispara decenas de ellas y no tiene sentido recorrer el
     árbol una vez por cada nodo.                                            */

  var CAPAS = ['#view', '#topbar', '#tabbar', '#toast-layer', '#modal-layer', '#sheet-layer'];
  var cola = [], programado = false, obs = null;

  function procesa() {
    programado = false;
    var lote = cola;
    cola = [];
    for (var i = 0; i < lote.length; i++) {
      if (lote[i].isConnected !== false) pinta(lote[i]);
    }
  }

  function encola(nodo) {
    cola.push(nodo);
    if (programado) return;
    programado = true;
    /* Con la pestaña a la vista se espera al siguiente fotograma: el cambio
       entra en el mismo pintado que la pantalla nueva y no se ve ni un
       parpadeo de emoji.

       Escondida, no. Ahí el navegador deja de llamar a requestAnimationFrame
       —no hay fotogramas que pintar—, así que la cola se quedaba esperando
       para siempre y la pantalla salía con los emojis del sistema. Pasa de
       verdad: una pestaña de fondo, o la app restaurada desde el segundo
       plano del teléfono.

       Y las dos llamadas van con el punto delante. Guardar la función en una
       variable suelta y llamarla después la deja sin `this`, y Chrome tira
       "Illegal invocation" desde dentro del observador, donde nadie lo ve. */
    if (w.requestAnimationFrame && !d.hidden) w.requestAnimationFrame(procesa);
    else w.setTimeout(procesa, 0);
  }

  function vigila() {
    if (obs || typeof MutationObserver !== 'function') return;
    obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var añadidos = muts[i].addedNodes;
        for (var j = 0; j < añadidos.length; j++) {
          var n = añadidos[j];
          if (n.nodeType === 1 || n.nodeType === 3) encola(n);
        }
      }
    });
    CAPAS.forEach(function (sel) {
      var capa = d.querySelector(sel);
      if (capa) obs.observe(capa, { childList: true, subtree: true });
    });
  }

  function enciende() {
    ponDefs();
    pinta(d.body);
    vigila();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', enciende);
  else enciende();

  w.Iconos = {
    svg: svg, html: html, nodo: nodo,
    pinta: pinta, pintaTexto: pintaTexto,
    deEmoji: deEmoji, existe: existe,
    ponDefs: ponDefs, enciende: enciende,
    nombres: DATOS.nombres
  };
})(window, document);
