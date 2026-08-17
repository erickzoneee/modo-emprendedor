/* ==========================================================================
   CAPAS DE LA MASCOTA — los accesorios que hablan del negocio del usuario

   Chispa no cambia. Su cuerpo naranja, su cara, sus brazos y su chispa de ocho
   puntas son los mismos para todo el mundo: es la mascota de la app, no un
   personaje distinto por usuario. Lo que cambia son las capas que se le ponen
   encima, y siempre en el mismo sitio.

   CUATRO RANURAS, EN ORDEN DE PINTADO
     fondo    detrás de todo, antes incluso de la sombra. Solo el suelo.
     torso    sobre el cuerpo y bajo la cara. La barriga, de y 78 a y 92.
     cabeza   sobre todo. La franja de y 31 a y 47.
     mano     sobre todo. Alrededor de (19,62) o de (81,62).

   DOS ZONAS PROHIBIDAS, Y NO SON NEGOCIABLES
     · la chispa      x 37..63,  y 0..25   — es el rasgo de marca
     · el tallo       x 48..52,  y 24..30  — la une al cuerpo
   Por eso aquí no hay gorros completos ni cascos: hay bandas bajas, arcos que
   pasan por debajo y bultos que se abren a los lados. Un gorro de cocinero de
   los de verdad taparía justo lo que hace reconocible a Chispa.

   SIN DEGRADADOS, A PROPÓSITO
   El chat del mentor pinta varias mascotas a la vez y los ids de <defs> se
   generan al azar por instancia. Un accesorio con gradiente propio tendría que
   arrastrar ese prefijo hasta el último `url(#…)`; con rellenos planos el
   problema no existe. A este tamaño no se nota la diferencia.

   TAMAÑO MÍNIMO
   La talla más usada es 52px (--m-size de .mascot--sm). Sobre un viewBox de
   100 unidades, eso son 0,52px por unidad: ningún trazo baja de 1,3 unidades
   ni ninguna pieza mide menos de 4.
   ========================================================================== */
(function (w) {
  'use strict';

  /* Materiales que tienen que leerse como el material que son. No siguen al
     tema: una llave de color lavanda deja de parecer una llave. */
  var MADERA = '#B07A45';
  var METAL  = '#9AA7B8';
  var CARTON = '#C9A171';
  var TELA   = '#FBFCFE';

  /* ==================================================================
     CABEZA — franja de y 31 a y 47, rodeando siempre el tallo
     ================================================================== */

  var CABEZA = {

    /* Gorro de cocina. Los dos bultos se abren a x 26..40 y x 60..74: entre
       ellos queda el pasillo libre por el que sale el tallo. */
    gorro: function (c) {
      return '' +
        '<circle cx="33" cy="32" r="7.5" fill="#FCFCFD"/>' +
        '<circle cx="67" cy="32" r="7.5" fill="#FCFCFD"/>' +
        '<path d="M26 44 Q27 34 50 33 Q73 34 74 44 Q50 48 26 44 Z" fill="#FCFCFD"/>' +
        '<path d="M26 44 Q50 48 74 44 L74 40.4 Q50 44.4 26 40.4 Z" fill="' + c.acento + '"/>';
    },

    /* Lentes de seguridad. Translúcidos a propósito: el requisito era que la
       cara siguiera siendo la misma, y unos lentes opacos la taparían. */
    lentes: function (c) {
      return '' +
        '<path d="M22 50 L28 50" stroke="' + c.acentoFuerte + '" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M78 50 L72 50" stroke="' + c.acentoFuerte + '" stroke-width="2.6" stroke-linecap="round"/>' +
        '<rect x="27" y="41" width="46" height="18" rx="8" fill="' + c.acento + '" opacity=".2"/>' +
        '<rect x="27" y="41" width="46" height="18" rx="8" fill="none" stroke="' + c.acentoFuerte + '" stroke-width="2.4"/>' +
        '<path d="M32 45 L38 45" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>';
    },

    /* Diadema de audífonos. El arco culmina en (50,34) — cuatro unidades por
       debajo del final del tallo, que es donde acaba en y 30. */
    audifonos: function (c) {
      return '' +
        '<path d="M26 46 Q50 22 74 46" fill="none" stroke="' + c.acentoFuerte + '" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="19" y="44" width="10" height="16" rx="5" fill="' + c.acentoFuerte + '"/>' +
        '<rect x="71" y="44" width="10" height="16" rx="5" fill="' + c.acentoFuerte + '"/>' +
        '<rect x="21.4" y="47" width="5.2" height="10" rx="2.6" fill="' + c.acento2 + '"/>' +
        '<rect x="73.4" y="47" width="5.2" height="10" rx="2.6" fill="' + c.acento2 + '"/>';
    },

    /* Banda de trabajo, la más discreta de todas. */
    banda: function (c) {
      return '' +
        '<path d="M26 45 Q28 37 50 36 Q72 37 74 45 Q50 48 26 45 Z" fill="' + c.acentoFuerte + '"/>' +
        '<circle cx="70" cy="41.5" r="3.4" fill="' + c.acento2 + '"/>';
    }
  };

  /* ==================================================================
     TORSO — de y 78 a y 92: por debajo de la boca (que llega a y 77 en el
     ánimo "party") y por encima de los pies.
     ================================================================== */

  var TORSO = {

    mandil: function (c) {
      return '' +
        '<path d="M32 78 L68 78 Q70 88 50 91.5 Q30 88 32 78 Z" fill="' + c.acentoFuerte + '"/>' +
        '<rect x="43" y="81.5" width="14" height="7" rx="1.6" fill="#000" opacity=".16"/>';
    },

    cinturon: function (c) {
      return '' +
        '<path d="M28 79 Q50 83.5 72 79 L72 84.5 Q50 89 28 84.5 Z" fill="' + c.acentoFuerte + '"/>' +
        '<rect x="34" y="82" width="10" height="8.5" rx="2" fill="' + c.acento + '"/>' +
        '<rect x="56" y="82" width="10" height="8.5" rx="2" fill="' + c.acento + '"/>';
    },

    etiqueta: function (c) {
      return '' +
        '<g transform="rotate(-16 64 83)">' +
          '<path d="M57 76 L72 76 L72 87 L64.5 92.5 L57 87 Z" fill="' + c.acentoFuerte + '"/>' +
          '<circle cx="64.5" cy="80" r="2.3" fill="#fff" opacity=".8"/>' +
        '</g>';
    },

    bata: function (c) {
      return '' +
        '<path d="M32 78 L68 78 Q70 88 50 91.5 Q30 88 32 78 Z" fill="' + TELA + '"/>' +
        '<path d="M50 78 L50 91" stroke="' + c.acento + '" stroke-width="1.8" opacity=".55"/>' +
        '<circle cx="44" cy="84" r="1.9" fill="' + c.acento + '"/>';
    }
  };

  /* ==================================================================
     MANO — la izquierda cae en (19,62); la derecha, en (81,62)

     Cada pieza va en DOS grupos anidados y eso no es un descuido:
       · el exterior lleva la clase m-hold-l / m-hold-r y no tiene transform,
         porque es el que anima el CSS cuando Chispa saluda (.is-happy);
       · el interior lleva la inclinación fija de la herramienta.
     Si la inclinación estuviera en el grupo exterior, la animación de CSS la
     pisaría —transform de CSS gana al atributo— y la herramienta pegaría un
     salto al empezar el saludo.
     ================================================================== */

  function enMano(lado, inclinacion, cuerpo) {
    return '<g class="m-hold-' + lado + '"><g transform="' + inclinacion + '">' + cuerpo + '</g></g>';
  }

  var MANO = {

    cuchara: function (c) {
      return enMano('r', 'rotate(22 81 62)',
        '<rect x="78.8" y="42" width="4.6" height="22" rx="2.3" fill="' + MADERA + '"/>' +
        '<ellipse cx="81.1" cy="39.5" rx="5.6" ry="7" fill="' + MADERA + '"/>' +
        '<ellipse cx="81.1" cy="39.5" rx="3.3" ry="4.4" fill="#000" opacity=".13"/>');
    },

    llave: function (c) {
      return enMano('r', 'rotate(28 81 62)',
        '<rect x="79" y="44" width="4.2" height="20" rx="2.1" fill="' + METAL + '"/>' +
        '<path d="M76 45 L76 38.5 L79 38.5 L79 41.6 L83.2 41.6 L83.2 38.5 L86.2 38.5 L86.2 45 Q81.1 48.4 76 45 Z" fill="' + METAL + '"/>');
    },

    libreta: function (c) {
      return enMano('r', 'rotate(-9 88 62)',
        '<rect x="82" y="52" width="15" height="19.5" rx="2" fill="' + TELA + '"/>' +
        '<rect x="82" y="52" width="15" height="19.5" rx="2" fill="none" stroke="' + c.acentoFuerte + '" stroke-width="1.6"/>' +
        '<path d="M85 57.5 H94 M85 61.5 H94 M85 65.5 H91" stroke="' + c.acentoFuerte + '" stroke-width="1.4" stroke-linecap="round" opacity=".65"/>');
    },

    tableta: function (c) {
      return enMano('l', 'rotate(-12 12 62)',
        '<rect x="3" y="51" width="17" height="22" rx="2.6" fill="' + c.acentoFuerte + '"/>' +
        '<rect x="5.2" y="53.4" width="12.6" height="17.2" rx="1.4" fill="' + c.acento2 + '"/>' +
        '<path d="M7.6 58 H15.4 M7.6 62 H15.4 M7.6 66 H12.2" stroke="#fff" stroke-width="1.35" stroke-linecap="round" opacity=".85"/>');
    },

    caja: function (c) {
      return enMano('l', 'rotate(-7 12 62)',
        '<rect x="2" y="52" width="19" height="17.5" rx="1.8" fill="' + CARTON + '"/>' +
        '<path d="M2 58.4 H21" stroke="#000" stroke-width="1.4" opacity=".14"/>' +
        '<rect x="9.4" y="52" width="4.2" height="17.5" fill="' + c.acentoFuerte + '" opacity=".9"/>');
    }
  };

  /* ==================================================================
     FONDO — el espacio de trabajo. Va antes de la sombra para que la
     sombra caiga encima y la mascota se apoye en algo, no flote sobre ello.
     Opacidades bajas: es contexto, no un dibujo que compita con la mascota.
     ================================================================== */

  var FONDO = {

    banco: function (c) {
      return '' +
        '<rect x="8" y="95" width="84" height="5" rx="2" fill="' + c.acento + '" opacity=".26"/>' +
        '<rect x="16" y="99" width="4" height="6" rx="1.6" fill="' + c.acento + '" opacity=".19"/>' +
        '<rect x="80" y="99" width="4" height="6" rx="1.6" fill="' + c.acento + '" opacity=".19"/>';
    },

    mostrador: function (c) {
      return '' +
        '<rect x="5" y="94" width="90" height="7" rx="3" fill="' + c.acento + '" opacity=".24"/>' +
        '<path d="M6 98 H94" stroke="' + c.acentoFuerte + '" stroke-width="1.2" opacity=".26"/>';
    },

    escritorio: function (c) {
      return '' +
        '<rect x="60" y="72" width="30" height="21" rx="2.6" fill="' + c.acento + '" opacity=".15"/>' +
        '<rect x="70" y="93" width="10" height="3" rx="1.4" fill="' + c.acento + '" opacity=".15"/>' +
        '<rect x="10" y="95" width="80" height="5.6" rx="2.6" fill="' + c.acento + '" opacity=".24"/>';
    }
  };

  /* ==================================================================
     DISTINTIVO — la única capa que no depende del sector sino del avance.
     Es la representación visual de que el negocio creció, no un adorno:
     aparece cuando el usuario alcanza la etapa, y no antes.
     ================================================================== */

  var DISTINTIVO = {
    idea:      function (c) { return insignia(c, '💡'); },
    validado:  function (c) { return insignia(c, '✓'); },
    primera:   function (c) { return insignia(c, '🪙'); },
    operando:  function (c) { return insignia(c, '📈'); },
    escalando: function (c) { return insignia(c, '🚀'); }
  };

  /* El texto va desde una tabla fija de este archivo, nunca desde datos del
     usuario: esto se monta con innerHTML y aquí no hay escapado posible. */
  function insignia(c, glifo) {
    return '' +
      '<circle cx="72" cy="80" r="9" fill="#fff"/>' +
      '<circle cx="72" cy="80" r="9" fill="none" stroke="' + c.acentoFuerte + '" stroke-width="2"/>' +
      '<text x="72" y="84.5" font-size="10" text-anchor="middle" font-family="Nunito,sans-serif">' + glifo + '</text>';
  }

  /* ==================================================================
     COMPOSICIÓN
     ================================================================== */

  var RANURAS = { fondo: FONDO, torso: TORSO, cabeza: CABEZA, mano: MANO, distintivo: DISTINTIVO };

  /**
   * Devuelve el SVG de una capa, o '' si la ranura o la pieza no existen.
   * Que devuelva cadena vacía en vez de fallar es deliberado: una clave vieja
   * en un guardado antiguo tiene que dejar a Chispa sin accesorio, nunca rota.
   */
  function pieza(ranura, clave, colores) {
    var grupo = RANURAS[ranura];
    if (!grupo || !clave) return '';
    var fn = grupo[clave];
    if (typeof fn !== 'function') return '';
    try { return fn(colores) || ''; } catch (e) { return ''; }
  }

  /** Todas las claves válidas de una ranura. Lo usa la pantalla de
      personalización para ofrecer solo accesorios que existen de verdad. */
  function claves(ranura) {
    var grupo = RANURAS[ranura];
    if (!grupo) return [];
    var out = [];
    for (var k in grupo) if (Object.prototype.hasOwnProperty.call(grupo, k)) out.push(k);
    return out;
  }

  /* Nombres legibles para la pantalla de personalización. */
  var NOMBRE = {
    gorro: 'Gorro de cocina', lentes: 'Lentes de seguridad',
    audifonos: 'Audífonos', banda: 'Banda de trabajo',
    mandil: 'Mandil', cinturon: 'Cinturón de herramientas',
    etiqueta: 'Etiqueta de precio', bata: 'Bata limpia',
    cuchara: 'Cuchara de madera', llave: 'Llave inglesa',
    libreta: 'Libreta', tableta: 'Tableta', caja: 'Caja de envío',
    banco: 'Banco de trabajo', mostrador: 'Mostrador', escritorio: 'Escritorio'
  };

  var RANURA_NOMBRE = {
    cabeza: 'En la cabeza', torso: 'En el cuerpo',
    mano: 'En las manos', fondo: 'Espacio de trabajo'
  };

  w.MASCOTA_CAPAS = {
    pieza: pieza, claves: claves,
    NOMBRE: NOMBRE, RANURA_NOMBRE: RANURA_NOMBRE,
    RANURAS: ['cabeza', 'torso', 'mano', 'fondo']
  };
})(window);
