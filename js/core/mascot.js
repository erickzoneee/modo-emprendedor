/* ==========================================================================
   CHISPA — la mascota de Modo Emprendedor (SVG animable)

   Chispa es una sola. Su cuerpo naranja, su cara, su chispa de ocho puntas y
   su forma no cambian nunca: por eso se reconoce. Lo que sí se le añade son
   capas — un mandil, una herramienta, un espacio de trabajo detrás — que
   hablan del negocio de quien la está mirando.

   Las capas las decide js/core/persona.js. Aquí solo se pintan, y se
   consultan de forma perezosa (dentro de svg(), no al cargar el archivo)
   porque mascot.js se carga mucho antes que persona.js en index.html.

   Las 26 llamadas que ya existían en la app siguen escribiendo `svg(mood)` a
   secas: reciben los accesorios sin cambiar una línea.
   ========================================================================== */
(function (w) {
  'use strict';

  var MOUTHS = {
    neutral: '<path d="M42 66 Q50 71 58 66" stroke="#7A3A00" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    happy:   '<path d="M40 63 Q50 76 60 63 Z" fill="#7A3A00"/><path d="M43.5 69 Q50 73.5 56.5 69 Q50 71.5 43.5 69Z" fill="#FF7E92"/>',
    party:   '<ellipse cx="50" cy="68" rx="9" ry="8.5" fill="#7A3A00"/><ellipse cx="50" cy="72.5" rx="5" ry="3.4" fill="#FF7E92"/>',
    sad:     '<path d="M42 70 Q50 63 58 70" stroke="#7A3A00" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    think:   '<path d="M43 68 Q50 66.5 57 69" stroke="#7A3A00" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    wow:     '<ellipse cx="50" cy="69" rx="6" ry="7" fill="#7A3A00"/>',
    money:   '<path d="M40 64 Q50 75 60 64 Z" fill="#7A3A00"/>'
  };

  function eyes(mood) {
    if (mood === 'sad') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="39" cy="53" r="4.6" fill="#20344F"/><circle cx="40.8" cy="51.2" r="1.7" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="61" cy="53" r="4.6" fill="#20344F"/><circle cx="62.8" cy="51.2" r="1.7" fill="#fff"/></g>' +
        '<path d="M31 41 Q39 37 47 41" stroke="#7A3A00" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M53 41 Q61 37 69 41" stroke="#7A3A00" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    if (mood === 'wow' || mood === 'party') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="9.5" ry="10.5" fill="#fff"/>' +
        '<circle cx="39" cy="50.5" r="5.4" fill="#20344F"/><circle cx="41" cy="48" r="2.2" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="9.5" ry="10.5" fill="#fff"/>' +
        '<circle cx="61" cy="50.5" r="5.4" fill="#20344F"/><circle cx="63" cy="48" r="2.2" fill="#fff"/></g>';
    }
    if (mood === 'think') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="41.5" cy="47.5" r="4.6" fill="#20344F"/><circle cx="43" cy="45.8" r="1.7" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="63.5" cy="47.5" r="4.6" fill="#20344F"/><circle cx="65" cy="45.8" r="1.7" fill="#fff"/></g>' +
        '<path d="M52 39 Q61 34 70 39" stroke="#7A3A00" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    if (mood === 'money') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="9" ry="9.5" fill="#fff"/>' +
        '<text x="39" y="55" font-size="12" font-weight="900" text-anchor="middle" fill="#2E9B44" font-family="Nunito,sans-serif">$</text></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="9" ry="9.5" fill="#fff"/>' +
        '<text x="61" y="55" font-size="12" font-weight="900" text-anchor="middle" fill="#2E9B44" font-family="Nunito,sans-serif">$</text></g>';
    }
    // neutral / happy
    return '' +
      '<g class="m-eye"><ellipse cx="39" cy="50" rx="8.5" ry="9.5" fill="#fff"/>' +
      '<circle cx="39.6" cy="51" r="4.8" fill="#20344F"/><circle cx="41.4" cy="48.8" r="1.9" fill="#fff"/></g>' +
      '<g class="m-eye"><ellipse cx="61" cy="50" rx="8.5" ry="9.5" fill="#fff"/>' +
      '<circle cx="61.6" cy="51" r="4.8" fill="#20344F"/><circle cx="63.4" cy="48.8" r="1.9" fill="#fff"/></g>';
  }

  /* ==================================================================
     CAPAS DEL NEGOCIO

     Se resuelven aquí dentro y no en el cuerpo del IIFE: index.html carga
     mascot.js en el bloque de núcleo y persona.js mucho después, así que al
     cargar este archivo `w.Persona` todavía no existe.
     ================================================================== */

  var SIN_CAPAS = { cabeza: '', torso: '', mano: '', fondo: '', distintivo: '' };

  /** Las capas que toca pintar ahora mismo, ya convertidas a SVG.
      `opts.capas` permite forzarlas (vista previa); `opts.plano` las apaga. */
  function capasDe(opts) {
    if (opts.plano) return SIN_CAPAS;
    if (opts.capas) return armar(opts.capas, opts.colores);
    if (!w.Persona || typeof w.Persona.capasSVG !== 'function') return SIN_CAPAS;
    try { return w.Persona.capasSVG() || SIN_CAPAS; } catch (e) { return SIN_CAPAS; }
  }

  /** Convierte un mapa {ranura: clave} en un mapa {ranura: svg}. */
  function armar(mapa, colores) {
    var K = w.MASCOTA_CAPAS;
    if (!K) return SIN_CAPAS;
    var out = {}, r;
    for (r in SIN_CAPAS) {
      if (!Object.prototype.hasOwnProperty.call(SIN_CAPAS, r)) continue;
      out[r] = mapa[r] ? K.pieza(r, mapa[r], colores || PALETA_BASE) : '';
    }
    return out;
  }

  /* Si nadie da colores, los accesorios salen en el teal genérico: es el mismo
     respaldo que usa css/temas.css cuando el negocio no está clasificado. */
  var PALETA_BASE = { acento: '#14807A', acento2: '#1FA59C', acentoDark: '#0C635E', acentoFuerte: '#0B5C57' };

  /* La silueta. Es lo único que de verdad define a Chispa: cambian la paleta,
     el encuadre y los accesorios, pero esta curva no.

     Vive aquí y se exporta porque hay un segundo dibujo del personaje —el
     retrato del arranque, en js/core/splash.js— que la usaba copiada. Copiada
     significa que el día que alguien afine la silueta, el arranque se queda
     con la vieja y aparecen dos Chispas parecidas pero distintas. Compartida,
     eso no puede pasar. */
  var CUERPO = 'M50 28 C71 28 84 43 84 62 C84 82 69 93 50 93 C31 93 16 82 16 62 C16 43 29 28 50 28 Z';

  /* Las mejillas y el brillo también se comparten: son parte de la cara, no
     del estilo de cada pantalla. */
  var BRILLO = { cx: 38, cy: 42, rx: 13, ry: 9, rot: -22 };
  var MEJILLAS = [{ cx: 27, cy: 62 }, { cx: 73, cy: 62 }];

  /**
   * Devuelve el SVG de Chispa.
   * mood: neutral | happy | sad | think | party | wow | money
   * opts: { color1, color2, patas, chispa1, chispa2, tallo, mejilla,
   *         capas: {cabeza,torso,mano,fondo,distintivo}, colores, plano, etiqueta }
   */
  function svg(mood, opts) {
    /* Traduce el momento al gesto: svg('celebrando') ya devuelve la cara de
       fiesta. Antes no: la tabla ESTADOS estaba escrita con esmero y no la
       llamaba nadie, así que pasar un nombre de estado caía en silencio en la
       cara neutral. Los 28 llamadores que pasan un ánimo directo siguen igual,
       porque estado() devuelve tal cual lo que ya es un ánimo. */
    mood = estado(mood || 'neutral');
    opts = opts || {};
    var id = 'g' + Math.random().toString(36).slice(2, 8);
    var body1 = opts.color1 || '#FF8A2B';
    var body2 = opts.color2 || '#FF6B1A';
    var patas = opts.patas || '#E0560A';
    var chispa1 = opts.chispa1 || '#FFF3C4';
    var chispa2 = opts.chispa2 || '#FFC800';
    var tallo = opts.tallo || '#FFC800';
    var mejilla = opts.mejilla || '#FF3E6C';
    var capa = capasDe(opts);
    // El texto alternativo se escapa porque puede llevar el nombre del negocio,
    // y todo esto acaba en un innerHTML.
    var etiqueta = esc(opts.etiqueta || 'Chispa, tu mentor');

    return '' +
'<svg viewBox="0 0 100 108" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + etiqueta + '">' +
  '<defs>' +
    '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + body1 + '"/><stop offset="100%" stop-color="' + body2 + '"/>' +
    '</linearGradient>' +
    '<radialGradient id="' + id + 's" cx="50%" cy="30%">' +
      '<stop offset="0%" stop-color="' + chispa1 + '"/><stop offset="100%" stop-color="' + chispa2 + '"/>' +
    '</radialGradient>' +
  '</defs>' +

  // espacio de trabajo: va antes de la sombra para que Chispa se apoye en él
  capa.fondo +

  // sombra
  '<ellipse cx="50" cy="101" rx="24" ry="4.6" fill="#10203A" opacity=".13"/>' +

  // chispa superior
  /* Dos grupos y no uno: el de fuera coloca, el de dentro anima. Con el
     translate y la animación en el MISMO elemento, la propiedad `transform`
     del CSS sustituye al atributo `transform` del SVG —no se suman— y la
     chispa saltaba a la esquina superior izquierda, despegada de su tallo. */
  '<g transform="translate(50 12)"><g class="m-spark">' +
    '<path d="M0 -12 L4.4 -3.4 L13 0 L4.4 3.4 L0 12 L-4.4 3.4 L-13 0 L-4.4 -3.4 Z" fill="url(#' + id + 's)"/>' +
  '</g></g>' +
  '<path d="M50 24 L50 30" stroke="' + tallo + '" stroke-width="4" stroke-linecap="round"/>' +

  // brazos
  '<g class="m-arm-l"><rect x="18" y="58" width="15" height="8" rx="4" fill="' + body2 + '"/>' +
    '<circle cx="19" cy="62" r="6" fill="' + body1 + '"/></g>' +
  '<g class="m-arm-r"><rect x="67" y="58" width="15" height="8" rx="4" fill="' + body2 + '"/>' +
    '<circle cx="81" cy="62" r="6" fill="' + body1 + '"/></g>' +

  // patas
  '<ellipse cx="39" cy="94" rx="9" ry="6" fill="' + patas + '"/>' +
  '<ellipse cx="61" cy="94" rx="9" ry="6" fill="' + patas + '"/>' +

  // cuerpo
  '<path d="' + CUERPO + '" fill="url(#' + id + 'b)"/>' +
  // brillo
  '<ellipse cx="38" cy="42" rx="13" ry="9" fill="#fff" opacity=".2" transform="rotate(-22 38 42)"/>' +
  // mejillas
  '<ellipse cx="27" cy="62" rx="6" ry="4.2" fill="' + mejilla + '" opacity=".26"/>' +
  '<ellipse cx="73" cy="62" rx="6" ry="4.2" fill="' + mejilla + '" opacity=".26"/>' +

  // lo que lleva puesto en el cuerpo: sobre el cuerpo, debajo de la cara
  capa.torso +

  eyes(mood) +
  (MOUTHS[mood] || MOUTHS.neutral) +

  // lo que va por encima de todo
  capa.cabeza +
  capa.mano +
  capa.distintivo +
'</svg>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ==================================================================
     ESTADOS

     La app habla de situaciones ("está celebrando un logro", "avisa de una
     tarea"), no de gestos. Los siete ánimos son la paleta de expresión; esta
     tabla es la que traduce el momento al gesto que le corresponde.
     ================================================================== */

  var ESTADOS = {
    bienvenida:  'happy',    // te saluda al entrar
    pensando:    'think',    // está calculando o consultando
    explicando:  'neutral',  // te está contando algo
    motivando:   'happy',    // te empuja a seguir
    celebrando:  'party',    // acabas de lograr algo
    alertando:   'wow',      // hay una tarea que atender
    acompanando: 'sad',      // llevas días sin volver
    sugiriendo:  'think',    // te propone el siguiente paso
    // El dinero no es un estado del acompañamiento, pero sí un gesto que ya
    // usaba el simulador al cerrar en positivo.
    cobrando:    'money'
  };

  var MOODS = ['neutral', 'happy', 'sad', 'think', 'party', 'wow', 'money'];
  var CLASES = MOODS.map(function (m) { return 'is-' + m; });

  /** El ánimo que corresponde a un estado. Acepta también un ánimo directo,
      para que las llamadas que ya existían sigan valiendo. */
  function estado(nombre) {
    if (ESTADOS[nombre]) return ESTADOS[nombre];
    return MOODS.indexOf(nombre) >= 0 ? nombre : 'neutral';
  }

  function aplicaClase(wrap, mood) {
    if (MOODS.indexOf(mood) >= 0) wrap.classList.add('is-' + mood);
  }

  /** Nodo DOM listo para insertar. */
  function node(mood, size, opts) {
    mood = estado(mood);
    var wrap = document.createElement('div');
    wrap.className = 'mascot' + (size ? ' mascot--' + size : '');
    aplicaClase(wrap, mood);
    wrap.innerHTML = svg(mood, opts);
    return wrap;
  }

  /** Cambia el ánimo de un nodo existente con una animación.
      Ojo: rehace el SVG entero, así que cualquier accesorio inyectado por
      fuera se pierde. Por eso las capas se pintan dentro de svg(). */
  function setMood(wrap, mood, opts) {
    if (!wrap) return;
    mood = estado(mood);
    CLASES.forEach(function (c) { wrap.classList.remove(c); });
    wrap.innerHTML = svg(mood, opts);
    void wrap.offsetWidth;
    aplicaClase(wrap, mood);
  }

  w.Mascot = {
    svg: svg, node: node, setMood: setMood,
    estado: estado, ESTADOS: ESTADOS, MOODS: MOODS,
    // Geometría compartida con el retrato del arranque (js/core/splash.js).
    CUERPO: CUERPO, BRILLO: BRILLO, MEJILLAS: MEJILLAS
  };
})(window);
