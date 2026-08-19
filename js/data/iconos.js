/* ==========================================================================
   ICONOS DE BARRO — el alfabeto visual de EMPRENDO

   Chispa ya tenía cara propia. Todo lo demás en la app —el fuego de la racha,
   la moneda, el cohete del nivel 8, los 183 emojis repartidos por las
   lecciones— lo dibujaba el sistema operativo. Y el emoji del sistema no es
   nuestro: cambia de forma en cada teléfono, no se puede animar, no conoce
   nuestra paleta y en Android se ve plano al lado de una mascota modelada.

   Este archivo es el otro extremo: piezas dibujadas a mano en el mismo
   lenguaje que Chispa. Barro. La regla es corta y no se rompe:

     · Volumen, no contorno. Nada lleva línea alrededor; el bulto lo da la luz.
     · La luz siempre entra por arriba a la izquierda (34% / 26%). Siempre.
     · Formas gordas y redondeadas. Si una punta se puede achatar, se achata.
     · Sombra de apoyo debajo: las cosas pesan y tocan el suelo.
     · Cuatro tonos por color —luz, base, sombra, apoyo— y ni uno más.

   Cada icono cabe en un lienzo de 100×100 y se apoya cerca de y=90, para que
   veinte de ellos en fila se vean alineados aunque tengan alturas distintas.

   Aquí solo vive el dibujo. Quién lo pinta, cuándo y en lugar de qué emoji lo
   decide js/core/iconos.js.
   ========================================================================== */
(function (w) {
  'use strict';

  /* ------------------------------ La paleta ------------------------------

     Cuatro tonos por color: [luz, base, sombra, apoyo]. La base es el color
     de marca de css/tokens.css; los otros tres son ese mismo color subido y
     bajado de luminosidad, no colores nuevos. Por eso un icono naranja y un
     botón naranja se ven del mismo material.                                */

  var T = {
    naranja: ['#FFB067', '#FF7A29', '#E05A00', '#B84600'],
    oro:     ['#FFE07A', '#FFC61E', '#E09A00', '#B87A00'],
    verde:   ['#86E39A', '#47CC61', '#2A9B45', '#1E7A34'],
    azul:    ['#7FD8FF', '#29B4F7', '#0E85C6', '#0A6799'],
    morado:  ['#D3A6FF', '#A85CF7', '#7B2FD1', '#5F1FA6'],
    rosa:    ['#FF9FCB', '#EE5AA0', '#C42D77', '#99205C'],
    teal:    ['#6FE0D0', '#1FC0AC', '#0D8B7C', '#086A5E'],
    rojo:    ['#FF9B9B', '#FF5C5C', '#D02F2F', '#A32020'],
    indigo:  ['#A9AEFF', '#6E72F0', '#4348C7', '#2F339B'],
    crema:   ['#FFF6E4', '#FFE6C0', '#E9C793', '#C9A46B'],
    hueso:   ['#FFFFFF', '#F4F7FC', '#D8E0EC', '#B8C4D6'],
    tinta:   ['#6C82A6', '#47597A', '#2C3A54', '#1B2537'],
    madera:  ['#E0B37D', '#C88A4B', '#9C6531', '#764A22'],
    piel:    ['#FFD3AC', '#F5B183', '#D08A57', '#A96A3E']
  };

  /** Un tono suelto. t('oro', 2) es la sombra del oro. */
  function t(color, i) { return (T[color] || T.tinta)[i]; }

  /* ------------------------------- Los defs -------------------------------

     Los degradados se declaran UNA vez para toda la página, dentro de un
     <svg> escondido, y cada icono los referencia por id. La alternativa era
     repetirlos dentro de cada icono: con sesenta iconos en pantalla eso son
     ciento veinte degradados idénticos que el navegador vuelve a resolver en
     cada repintado, y decenas de KB de markup que no dicen nada nuevo.

     Dos por color, porque hay dos maneras de que la luz caiga:
       b-<color>  bola   — radial, para lo redondo (una moneda, una cabeza)
       p-<color>  plano  — lineal en diagonal, para lo recto (una caja, papel) */

  function defs() {
    var s = '', k, c;
    for (k in T) {
      if (!Object.prototype.hasOwnProperty.call(T, k)) continue;
      c = T[k];
      s += '<radialGradient id="b-' + k + '" cx="34%" cy="26%" r="84%">' +
             '<stop offset="0%" stop-color="' + c[0] + '"/>' +
             '<stop offset="54%" stop-color="' + c[1] + '"/>' +
             '<stop offset="100%" stop-color="' + c[2] + '"/>' +
           '</radialGradient>' +
           '<linearGradient id="p-' + k + '" x1="10%" y1="0%" x2="90%" y2="100%">' +
             '<stop offset="0%" stop-color="' + c[0] + '"/>' +
             '<stop offset="52%" stop-color="' + c[1] + '"/>' +
             '<stop offset="100%" stop-color="' + c[2] + '"/>' +
           '</linearGradient>';
    }
    /* La sombra de apoyo. Va en marrón muy oscuro y no en negro: el negro
       puro sobre un fondo cálido se ve sucio, gris. */
    s += '<radialGradient id="b-piso">' +
           '<stop offset="0%" stop-color="#2A1503" stop-opacity=".28"/>' +
           '<stop offset="70%" stop-color="#2A1503" stop-opacity=".10"/>' +
           '<stop offset="100%" stop-color="#2A1503" stop-opacity="0"/>' +
         '</radialGradient>';
    /* Vidrio: lo que va delante de otra cosa sin taparla del todo (la lente
       de la lupa, el frasco del matraz). */
    s += '<linearGradient id="p-vidrio" x1="10%" y1="0%" x2="90%" y2="100%">' +
           '<stop offset="0%" stop-color="#FFFFFF" stop-opacity=".72"/>' +
           '<stop offset="55%" stop-color="#DCEEF9" stop-opacity=".34"/>' +
           '<stop offset="100%" stop-color="#8FC7E4" stop-opacity=".42"/>' +
         '</linearGradient>';
    return s;
  }

  /* ------------------------------ Las piezas ------------------------------
     Tres gestos que se repiten en casi todos los iconos. Escritos una vez.  */

  /** La sombra de apoyo en el suelo. */
  function piso(cx, rx, cy, ry) {
    return '<ellipse class="i-piso" cx="' + cx + '" cy="' + (cy || 90) + '" rx="' + rx +
           '" ry="' + (ry || Math.max(3.5, rx * 0.22)) + '" fill="url(#b-piso)"/>';
  }

  /** El reflejo de la luz. Siempre arriba a la izquierda, siempre inclinado. */
  function lustre(cx, cy, rx, ry, rot, op) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
           '" fill="#fff" opacity="' + (op == null ? 0.34 : op) + '"' +
           ' transform="rotate(' + (rot == null ? -24 : rot) + ' ' + cx + ' ' + cy + ')"/>';
  }

  /** La chispa de cuatro puntas. Es literalmente la de la cabeza de Chispa,
      con el mismo trazo: por eso todo lo que brilla en la app brilla igual.

      Dos grupos y no uno, por la misma razón que están dobles en mascot.js:
      el de fuera coloca y el de dentro anima. Con el translate y la animación
      en el MISMO elemento, la propiedad `transform` del CSS no se suma al
      atributo `transform` del SVG: lo sustituye. La chispa se iba a la
      esquina superior izquierda y desaparecía del icono en cuanto se movía. */
  function chispa(cx, cy, tam, fill, cls) {
    var path = '<path d="M0 -12 L4.4 -3.4 L13 0 L4.4 3.4 L0 12 L-4.4 3.4 L-13 0 L-4.4 -3.4 Z"' +
               ' fill="' + (fill || 'url(#b-oro)') + '"/>';
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + (tam / 12) + ')">' +
             (cls ? '<g class="' + cls + '">' + path + '</g>' : path) +
           '</g>';
  }

  /** Los dientes de un engranaje, repartidos en círculo. */
  function dientes(cx, cy, r, n, largo, ancho, fill) {
    var s = '', i, a;
    for (i = 0; i < n; i++) {
      a = (360 / n) * i;
      s += '<rect x="' + (cx - ancho / 2) + '" y="' + (cy - r - largo) + '" width="' + ancho +
           '" height="' + (largo + 10) + '" rx="' + (ancho * 0.34) + '" fill="' + fill +
           '" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')"/>';
    }
    return s;
  }

  /* =========================================================================
     EL CATÁLOGO

     nombre: {
       svg   el dibujo, en un lienzo de 100×100
       et    cómo lo nombra un lector de pantalla
       vivo  animación en bucle. Solo la llevan los que viven en el HUD y se
             miran cien veces al día; el resto se queda quieto a propósito.
     }
     ========================================================================= */

  var I = {};

  /* ---------------------- Los ocho niveles de la ruta ---------------------- */

  I.lupa = { et: 'lupa', svg:
    piso(56, 24) +
    '<rect x="56" y="52" width="14" height="40" rx="7" fill="url(#p-madera)" transform="rotate(-42 63 72)"/>' +
    '<circle cx="44" cy="42" r="27" fill="url(#b-teal)"/>' +
    '<circle cx="44" cy="42" r="19" fill="url(#p-vidrio)"/>' +
    lustre(36, 33, 8, 5, -30, 0.8)
  };

  I.matraz = { et: 'matraz', svg:
    piso(50, 27) +
    '<path d="M40 12 H60 V42 L76 74 C80 82 74 90 65 90 H35 C26 90 20 82 24 74 L40 42 Z" fill="url(#p-vidrio)"/>' +
    '<path d="M31 68 H69 L76 74 C80 82 74 90 65 90 H35 C26 90 20 82 24 74 Z" fill="url(#b-azul)"/>' +
    '<circle cx="43" cy="79" r="4" fill="' + t('azul', 0) + '" opacity=".85"/>' +
    '<circle cx="57" cy="84" r="2.6" fill="' + t('azul', 0) + '" opacity=".7"/>' +
    '<rect x="36" y="8" width="28" height="9" rx="4.5" fill="url(#p-hueso)"/>' +
    lustre(36, 40, 3.5, 16, 8, 0.55)
  };

  I.llave = { et: 'llave', svg:
    piso(50, 26) +
    '<g transform="rotate(38 50 50)">' +
      '<rect x="42" y="30" width="16" height="58" rx="8" fill="url(#p-indigo)"/>' +
      '<path d="M50 8 C62 8 71 17 71 28 C71 35 67 41 61 45 V52 H39 V45 C33 41 29 35 29 28 C29 17 38 8 50 8 Z M50 20 C46 20 42 24 42 28 C42 32 46 35 50 35 C54 35 58 32 58 28 C58 24 54 20 50 20 Z" fill="url(#b-indigo)"/>' +
    '</g>' +
    lustre(38, 30, 4, 11, 32, 0.3)
  };

  I.manos = { et: 'apretón de manos', svg:
    piso(50, 27) +
    '<rect x="6" y="52" width="24" height="20" rx="8" fill="url(#p-azul)"/>' +
    '<rect x="70" y="52" width="24" height="20" rx="8" fill="url(#p-verde)"/>' +
    '<path d="M26 50 H50 C56 50 60 54 60 60 C60 66 56 70 50 70 H26 C20 70 16 66 16 60 C16 54 20 50 26 50 Z" fill="url(#b-piel)"/>' +
    '<path d="M74 48 H52 C46 48 42 52 42 58 C42 64 46 68 52 68 H74 C80 68 84 64 84 58 C84 52 80 48 74 48 Z" fill="' + t('piel', 0) + '"/>' +
    '<path d="M44 50 C50 50 54 54 54 58 C54 63 50 67 44 67" fill="none" stroke="' + t('piel', 2) + '" stroke-width="3" stroke-linecap="round" opacity=".5"/>' +
    lustre(56, 52, 12, 3.5, -6, 0.4)
  };

  I.barras = { et: 'gráfica de barras', svg:
    piso(50, 30) +
    '<rect x="18" y="56" width="17" height="30" rx="7" fill="url(#p-azul)"/>' +
    '<rect x="41" y="38" width="17" height="48" rx="7" fill="url(#p-teal)"/>' +
    '<rect x="64" y="22" width="17" height="64" rx="7" fill="url(#p-verde)"/>' +
    lustre(23, 62, 2.5, 5, 0, 0.4) + lustre(46, 44, 2.5, 5, 0, 0.4) + lustre(69, 28, 2.5, 5, 0, 0.4)
  };

  I.sube = { et: 'gráfica que sube', svg:
    piso(50, 30) +
    '<rect x="14" y="62" width="16" height="24" rx="7" fill="' + t('verde', 2) + '" opacity=".4"/>' +
    '<rect x="36" y="50" width="16" height="36" rx="7" fill="' + t('verde', 2) + '" opacity=".55"/>' +
    '<rect x="58" y="36" width="16" height="50" rx="7" fill="' + t('verde', 2) + '" opacity=".7"/>' +
    '<path d="M18 58 L40 40 L56 50 L82 20" fill="none" stroke="url(#p-verde)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M62 16 H86 V40" fill="none" stroke="url(#p-verde)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
    lustre(30, 50, 3, 9, 42, 0.35)
  };

  I.engrane = { et: 'engranaje', vivo: 'gira', svg:
    piso(50, 26) +
    '<g class="i-rota">' +
      dientes(50, 50, 30, 8, 10, 15, 'url(#p-indigo)') +
      '<circle cx="50" cy="50" r="32" fill="url(#b-indigo)"/>' +
      '<circle cx="50" cy="50" r="12" fill="' + t('indigo', 3) + '"/>' +
      '<circle cx="50" cy="50" r="8" fill="' + t('indigo', 2) + '"/>' +
    '</g>' +
    lustre(38, 36, 9, 5, -28, 0.3)
  };

  I.cohete = { et: 'cohete', vivo: 'despega', svg:
    piso(50, 20, 92) +
    '<g class="i-flota">' +
      '<path class="i-llama" d="M50 66 C58 72 62 80 58 88 C55 94 45 94 42 88 C38 80 42 72 50 66 Z" fill="url(#b-oro)"/>' +
      '<path d="M32 46 C24 54 22 66 24 76 L40 66 Z" fill="url(#p-rojo)"/>' +
      '<path d="M68 46 C76 54 78 66 76 76 L60 66 Z" fill="url(#p-rojo)"/>' +
      '<path d="M50 6 C63 20 70 40 70 58 C70 68 66 74 60 76 H40 C34 74 30 68 30 58 C30 40 37 20 50 6 Z" fill="url(#b-hueso)"/>' +
      '<circle cx="50" cy="38" r="12" fill="' + t('azul', 2) + '"/>' +
      '<circle cx="50" cy="38" r="9" fill="url(#b-azul)"/>' +
      lustre(45, 33, 3.5, 2.4, -30, 0.85) +
      lustre(40, 32, 4, 16, 8, 0.4) +
    '</g>'
  };

  /* ------------------- El HUD: lo que se mira todo el día ------------------- */

  I.fuego = { et: 'racha', vivo: 'flamea', svg:
    piso(50, 22) +
    '<g class="i-flama">' +
      '<path d="M50 8 C58 28 74 36 74 56 C74 75 63 90 50 90 C37 90 26 75 26 56 C26 42 35 33 40 21 C43 33 47 30 50 8 Z" fill="url(#b-naranja)"/>' +
      '<path class="i-nucleo" d="M50 44 C57 53 64 60 64 69 C64 80 58 89 50 89 C42 89 36 80 36 69 C36 60 43 53 50 44 Z" fill="url(#b-oro)"/>' +
    '</g>' +
    lustre(38, 46, 4.5, 11, -14, 0.3)
  };

  I.vela = { et: 'racha apagada', svg:
    piso(50, 20) +
    '<rect x="36" y="30" width="28" height="58" rx="12" fill="url(#p-crema)"/>' +
    '<ellipse cx="50" cy="31" rx="14" ry="5" fill="' + t('crema', 0) + '"/>' +
    '<path d="M50 20 V30" stroke="' + t('tinta', 2) + '" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M46 20 C48 13 52 13 54 20 C56 26 44 26 46 20 Z" fill="' + t('tinta', 1) + '" opacity=".45"/>' +
    lustre(42, 48, 3.5, 14, 0, 0.5)
  };

  I.moneda = { et: 'monedas', vivo: 'tintinea', svg:
    piso(50, 26) +
    '<g class="i-gira">' +
      '<circle cx="50" cy="50" r="36" fill="url(#b-oro)"/>' +
      '<circle cx="50" cy="50" r="28" fill="' + t('oro', 0) + '" opacity=".5"/>' +
      '<path d="M50 28 V72" stroke="' + t('oro', 3) + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M60 38 C60 31 40 31 40 41 C40 50 60 49 60 59 C60 69 40 69 40 62" fill="none" stroke="' + t('oro', 3) + '" stroke-width="6" stroke-linecap="round"/>' +
    '</g>' +
    lustre(38, 36, 10, 6, -28, 0.45)
  };

  I.corazon = { et: 'vidas', vivo: 'late', svg:
    piso(50, 22, 92) +
    '<g class="i-late">' +
      '<path d="M50 88 C20 68 10 52 10 38 C10 25 20 16 32 16 C40 16 46 20 50 27 C54 20 60 16 68 16 C80 16 90 25 90 38 C90 52 80 68 50 88 Z" fill="url(#b-rojo)"/>' +
      lustre(33, 33, 11, 7, -30, 0.45) +
    '</g>'
  };

  I['corazon-roto'] = { et: 'sin vidas', svg:
    piso(50, 22, 92) +
    '<path d="M48 88 C20 68 10 52 10 38 C10 25 20 16 32 16 C40 16 46 20 50 27 L40 42 L52 50 L42 62 L52 70 Z" fill="url(#b-rojo)" transform="rotate(-7 40 52)"/>' +
    '<path d="M52 88 C80 68 90 52 90 38 C90 25 80 16 68 16 C60 16 54 20 50 27 L60 42 L48 50 L58 62 L48 70 Z" fill="' + t('rojo', 2) + '" transform="rotate(7 62 52)"/>'
  };

  I.rayo = { et: 'energía', vivo: 'chisporrotea', svg:
    piso(48, 18) +
    '<path d="M60 6 C63 6 65 9 63 12 L46 40 H62 C66 40 68 45 65 48 L38 92 C35 96 29 93 30 88 L36 58 H24 C20 58 18 54 20 51 L54 9 C55 7 57 6 60 6 Z" fill="url(#p-oro)"/>' +
    lustre(44, 28, 3, 12, 28, 0.5)
  };

  I.gema = { et: 'gema', vivo: 'destella', svg:
    piso(50, 22) +
    '<path d="M26 40 L50 14 L74 40 L50 88 Z" fill="url(#b-azul)"/>' +
    '<path d="M26 40 L50 14 L50 88 Z" fill="' + t('azul', 0) + '" opacity=".5"/>' +
    '<path d="M26 40 H74 L64 29 H36 Z" fill="#fff" opacity=".26"/>' +
    chispa(74, 24, 9, '#fff', 'i-brillo')
  };

  I.corona = { et: 'corona', svg:
    piso(50, 26) +
    '<path d="M16 74 L12 32 C11 26 18 23 22 28 L36 46 L45 22 C47 16 53 16 55 22 L64 46 L78 28 C82 23 89 26 88 32 L84 74 Z" fill="url(#b-oro)"/>' +
    '<rect x="16" y="72" width="68" height="16" rx="8" fill="url(#p-oro)"/>' +
    '<circle cx="50" cy="80" r="5" fill="' + t('rojo', 1) + '"/>' +
    '<circle cx="28" cy="80" r="4" fill="' + t('azul', 1) + '"/>' +
    '<circle cx="72" cy="80" r="4" fill="' + t('verde', 1) + '"/>' +
    lustre(30, 44, 4, 12, 16, 0.4)
  };

  I.estrella = { et: 'estrella', vivo: 'destella', svg:
    piso(50, 22) +
    chispa(50, 50, 42, 'url(#b-oro)', 'i-brillo') +
    lustre(38, 38, 5, 9, -30, 0.5)
  };

  I.chispas = { et: 'brillo', vivo: 'destella', svg:
    chispa(44, 44, 32, 'url(#b-oro)', 'i-brillo') +
    chispa(78, 22, 15, 'url(#b-naranja)', 'i-brillo-2') +
    chispa(74, 74, 19, 'url(#b-oro)', 'i-brillo-3')
  };

  I.trofeo = { et: 'trofeo', svg:
    piso(50, 26) +
    '<path d="M28 22 H72 V44 C72 60 62 70 50 70 C38 70 28 60 28 44 Z" fill="url(#b-oro)"/>' +
    '<path d="M28 28 H16 C16 46 22 52 30 54" fill="none" stroke="' + t('oro', 2) + '" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M72 28 H84 C84 46 78 52 70 54" fill="none" stroke="' + t('oro', 2) + '" stroke-width="8" stroke-linecap="round"/>' +
    '<rect x="42" y="66" width="16" height="14" rx="4" fill="' + t('oro', 2) + '"/>' +
    '<rect x="28" y="78" width="44" height="12" rx="6" fill="url(#p-oro)"/>' +
    lustre(38, 36, 5, 12, 10, 0.45)
  };

  /* --------------------- Estados: sí, no, cuidado, cerrado --------------------- */

  I.check = { et: 'correcto', svg:
    piso(50, 26) +
    '<circle cx="50" cy="48" r="38" fill="url(#b-verde)"/>' +
    '<path d="M32 49 L45 62 L69 36" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
    lustre(36, 32, 10, 6, -28, 0.35)
  };

  I.equis = { et: 'incorrecto', svg:
    piso(50, 26) +
    '<circle cx="50" cy="48" r="38" fill="url(#b-rojo)"/>' +
    '<path d="M36 34 L64 62 M64 34 L36 62" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/>' +
    lustre(36, 32, 10, 6, -28, 0.35)
  };

  I.aviso = { et: 'atención', svg:
    piso(50, 30) +
    '<path d="M50 10 C55 10 59 13 61 17 L89 70 C93 78 88 88 79 88 H21 C12 88 7 78 11 70 L39 17 C41 13 45 10 50 10 Z" fill="url(#b-oro)"/>' +
    '<rect x="44" y="34" width="12" height="30" rx="6" fill="' + t('oro', 3) + '"/>' +
    '<circle cx="50" cy="74" r="6.5" fill="' + t('oro', 3) + '"/>' +
    lustre(38, 44, 3.5, 12, 20, 0.4)
  };

  I.candado = { et: 'bloqueado', svg:
    piso(50, 26) +
    '<path d="M32 46 V34 C32 24 40 16 50 16 C60 16 68 24 68 34 V46" fill="none" stroke="url(#p-tinta)" stroke-width="11" stroke-linecap="round"/>' +
    '<rect x="22" y="44" width="56" height="44" rx="13" fill="url(#b-oro)"/>' +
    '<circle cx="50" cy="62" r="7" fill="' + t('oro', 3) + '"/>' +
    '<rect x="46.5" y="62" width="7" height="14" rx="3.5" fill="' + t('oro', 3) + '"/>' +
    lustre(33, 54, 5, 8, -20, 0.4)
  };

  I.diana = { et: 'objetivo', svg:
    piso(50, 26) +
    '<circle cx="50" cy="50" r="38" fill="url(#b-rojo)"/>' +
    '<circle cx="50" cy="50" r="26" fill="url(#b-hueso)"/>' +
    '<circle cx="50" cy="50" r="14" fill="url(#b-rojo)"/>' +
    '<circle cx="50" cy="50" r="6" fill="' + t('oro', 1) + '"/>' +
    lustre(34, 32, 8, 5, -28, 0.4)
  };

  I.bombilla = { et: 'idea', vivo: 'destella', svg:
    piso(50, 20) +
    '<path d="M50 8 C67 8 80 21 80 38 C80 50 73 56 68 63 C65 67 64 70 64 74 H36 C36 70 35 67 32 63 C27 56 20 50 20 38 C20 21 33 8 50 8 Z" fill="url(#b-oro)"/>' +
    '<rect x="36" y="74" width="28" height="8" rx="4" fill="' + t('tinta', 1) + '"/>' +
    '<rect x="39" y="82" width="22" height="8" rx="4" fill="' + t('tinta', 2) + '"/>' +
    '<path d="M42 60 L46 40 L50 52 L54 40 L58 60" fill="none" stroke="' + t('oro', 3) + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>' +
    lustre(36, 28, 6, 12, -24, 0.5)
  };

  I.cerebro = { et: 'estrategia', svg:
    piso(50, 26) +
    '<path d="M32 18 C20 20 12 30 16 40 C6 48 10 66 24 70 C28 82 46 88 50 76 C54 88 72 82 76 70 C90 66 94 48 84 40 C88 30 80 20 68 18 C60 10 40 10 32 18 Z" fill="url(#b-rosa)"/>' +
    '<path d="M50 24 V78 M32 30 C40 34 40 44 32 48 M68 30 C60 34 60 44 68 48 M26 56 C34 56 38 62 36 68 M74 56 C66 56 62 62 64 68" fill="none" stroke="' + t('rosa', 2) + '" stroke-width="4" stroke-linecap="round" opacity=".5"/>' +
    lustre(32, 32, 8, 5, -28, 0.35)
  };

  I.fiesta = { et: 'celebración', vivo: 'salta', svg:
    piso(46, 24) +
    '<path d="M12 88 L46 26 L74 58 Z" fill="url(#p-naranja)"/>' +
    '<path d="M24 66 L52 42 M18 78 L62 50" stroke="' + t('oro', 1) + '" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="84" cy="20" r="7" fill="' + t('verde', 1) + '"/>' +
    '<circle cx="66" cy="10" r="5" fill="' + t('azul', 1) + '"/>' +
    '<circle cx="90" cy="44" r="5" fill="' + t('rosa', 1) + '"/>' +
    chispa(76, 32, 10, 'url(#b-oro)', 'i-brillo')
  };

  /* ------------------------------- El negocio ------------------------------- */

  I.caja = { et: 'producto', svg:
    piso(50, 28) +
    '<path d="M50 50 L14 34 V66 L50 86 Z" fill="' + t('madera', 2) + '"/>' +
    '<path d="M50 50 L86 34 V66 L50 86 Z" fill="url(#p-madera)"/>' +
    '<path d="M50 14 L86 32 L50 50 L14 32 Z" fill="' + t('madera', 0) + '"/>' +
    '<path d="M32 23 L68 41" stroke="' + t('madera', 3) + '" stroke-width="4" opacity=".3"/>' +
    lustre(30, 28, 9, 4, 26, 0.3)
  };

  I.etiqueta = { et: 'precio', svg:
    piso(50, 26) +
    '<path d="M54 12 H80 C85 12 88 15 88 20 V46 C88 50 87 53 84 56 L54 86 C50 90 44 90 40 86 L14 60 C10 56 10 50 14 46 L44 16 C47 13 50 12 54 12 Z" fill="url(#p-verde)"/>' +
    '<circle cx="72" cy="28" r="8" fill="' + t('verde', 3) + '"/>' +
    '<circle cx="72" cy="28" r="4" fill="' + t('hueso', 1) + '"/>' +
    lustre(42, 34, 5, 16, 44, 0.3)
  };

  I.carpeta = { et: 'carpeta', svg:
    piso(50, 30) +
    '<path d="M10 28 C10 23 13 20 18 20 H38 L48 30 H82 C87 30 90 33 90 38 V76 C90 81 87 84 82 84 H18 C13 84 10 81 10 76 Z" fill="' + t('oro', 2) + '"/>' +
    '<path d="M14 44 H86 C90 44 92 48 91 52 L86 80 C85 83 83 84 80 84 H20 C17 84 15 83 14 80 L9 52 C8 48 10 44 14 44 Z" fill="url(#p-oro)"/>' +
    lustre(30, 52, 12, 3.5, -4, 0.35)
  };

  I.portapapeles = { et: 'lista', svg:
    piso(50, 26) +
    '<rect x="18" y="14" width="64" height="76" rx="12" fill="url(#p-tinta)"/>' +
    '<rect x="26" y="24" width="48" height="58" rx="7" fill="url(#p-hueso)"/>' +
    '<rect x="38" y="8" width="24" height="14" rx="7" fill="' + t('tinta', 0) + '"/>' +
    '<path d="M34 40 H62 M34 52 H62 M34 64 H52" stroke="' + t('tinta', 0) + '" stroke-width="5" stroke-linecap="round" opacity=".5"/>' +
    lustre(30, 26, 4, 9, 12, 0.3)
  };

  I.pin = { et: 'ubicación', svg:
    piso(50, 16, 92, 4) +
    '<path d="M50 92 C50 92 80 58 80 40 C80 23 67 10 50 10 C33 10 20 23 20 40 C20 58 50 92 50 92 Z" fill="url(#b-rojo)"/>' +
    '<circle cx="50" cy="39" r="14" fill="' + t('hueso', 1) + '"/>' +
    lustre(36, 26, 7, 5, -30, 0.45)
  };

  I.brujula = { et: 'rumbo', svg:
    piso(50, 26) +
    '<circle cx="50" cy="50" r="38" fill="url(#b-teal)"/>' +
    '<circle cx="50" cy="50" r="29" fill="url(#p-hueso)"/>' +
    '<path d="M66 34 L54 54 L34 66 L46 46 Z" fill="' + t('rojo', 1) + '"/>' +
    '<path d="M46 46 L54 54 L34 66 Z" fill="' + t('hueso', 2) + '"/>' +
    '<circle cx="50" cy="50" r="4" fill="' + t('tinta', 1) + '"/>' +
    lustre(34, 32, 8, 5, -28, 0.4)
  };

  I.paleta = { et: 'identidad', svg:
    piso(50, 28) +
    '<path d="M50 10 C74 10 90 26 90 48 C90 62 78 64 72 66 C66 68 64 74 66 78 C68 84 62 90 52 90 C28 90 10 72 10 48 C10 26 26 10 50 10 Z" fill="url(#b-crema)"/>' +
    '<circle cx="34" cy="66" r="9" fill="' + t('crema', 3) + '" opacity=".5"/>' +
    '<circle cx="32" cy="38" r="8" fill="' + t('rojo', 1) + '"/>' +
    '<circle cx="52" cy="26" r="8" fill="' + t('azul', 1) + '"/>' +
    '<circle cx="72" cy="36" r="8" fill="' + t('verde', 1) + '"/>' +
    '<circle cx="78" cy="56" r="7" fill="' + t('morado', 1) + '"/>' +
    lustre(26, 30, 8, 5, -30, 0.5)
  };

  I.regalo = { et: 'regalo', svg:
    piso(50, 28) +
    '<rect x="12" y="36" width="76" height="18" rx="8" fill="url(#p-rosa)"/>' +
    '<rect x="18" y="52" width="64" height="38" rx="9" fill="url(#b-rosa)"/>' +
    '<rect x="42" y="36" width="16" height="54" fill="' + t('oro', 1) + '"/>' +
    '<path d="M50 36 C40 36 30 32 30 24 C30 17 40 17 44 24 Z" fill="url(#p-oro)"/>' +
    '<path d="M50 36 C60 36 70 32 70 24 C70 17 60 17 56 24 Z" fill="url(#p-oro)"/>' +
    lustre(28, 42, 10, 3.5, -4, 0.4)
  };

  I.billete = { et: 'dinero', svg:
    piso(50, 30) +
    '<rect x="8" y="26" width="84" height="50" rx="11" fill="url(#p-verde)" transform="rotate(-6 50 51)"/>' +
    '<ellipse cx="50" cy="51" rx="18" ry="16" fill="' + t('verde', 0) + '" opacity=".5" transform="rotate(-6 50 51)"/>' +
    '<path d="M50 40 V62 M57 45 C57 40 43 40 43 47 C43 53 57 52 57 58 C57 64 43 64 43 59" fill="none" stroke="' + t('verde', 3) + '" stroke-width="4.5" stroke-linecap="round" transform="rotate(-6 50 51)"/>' +
    lustre(24, 34, 10, 3.5, -6, 0.4)
  };

  I.calculadora = { et: 'números', svg:
    piso(50, 26) +
    '<rect x="20" y="8" width="60" height="82" rx="13" fill="url(#p-indigo)"/>' +
    '<rect x="28" y="17" width="44" height="20" rx="6" fill="' + t('indigo', 3) + '"/>' +
    '<rect x="33" y="23" width="26" height="7" rx="3.5" fill="' + t('teal', 0) + '" opacity=".9"/>' +
    '<g fill="' + t('indigo', 0) + '">' +
      '<rect x="29" y="45" width="13" height="11" rx="4"/><rect x="44" y="45" width="13" height="11" rx="4"/><rect x="59" y="45" width="13" height="11" rx="4"/>' +
      '<rect x="29" y="61" width="13" height="11" rx="4"/><rect x="44" y="61" width="13" height="11" rx="4"/><rect x="59" y="61" width="13" height="11" rx="4"/>' +
      '<rect x="29" y="77" width="28" height="8" rx="4"/><rect x="59" y="77" width="13" height="8" rx="4"/>' +
    '</g>' +
    lustre(31, 22, 3.5, 8, 10, 0.3)
  };

  I.megafono = { et: 'promoción', vivo: 'vibra', svg:
    piso(46, 24) +
    '<g class="i-vibra">' +
      '<path d="M20 40 L62 16 V84 L20 62 C14 59 12 54 12 51 C12 48 14 43 20 40 Z" fill="url(#p-naranja)"/>' +
      '<rect x="24" y="60" width="16" height="28" rx="8" fill="' + t('naranja', 3) + '"/>' +
      '<ellipse cx="62" cy="50" rx="9" ry="34" fill="' + t('naranja', 0) + '"/>' +
    '</g>' +
    '<path d="M76 34 C84 42 84 58 76 66 M86 24 C97 38 97 62 86 76" fill="none" stroke="' + t('oro', 1) + '" stroke-width="7" stroke-linecap="round"/>' +
    lustre(34, 42, 4, 10, 26, 0.35)
  };

  I.recibo = { et: 'recibo', svg:
    piso(50, 24) +
    '<path d="M22 10 C22 8 24 6 26 8 L34 13 L42 8 L50 13 L58 8 L66 13 L74 8 C76 6 78 8 78 10 V80 L70 74 L62 80 L54 74 L46 80 L38 74 L30 80 L22 74 Z" fill="url(#p-hueso)"/>' +
    '<path d="M34 30 H66 M34 44 H66 M34 58 H54" stroke="' + t('tinta', 0) + '" stroke-width="5" stroke-linecap="round" opacity=".45"/>' +
    lustre(30, 24, 3.5, 10, 8, 0.5)
  };

  I.libreta = { et: 'libreta', svg:
    piso(50, 28) +
    '<path d="M20 14 C20 10 23 8 27 8 H80 C84 8 86 11 86 15 V83 C86 87 84 90 80 90 H27 C23 90 20 87 20 83 Z" fill="url(#p-teal)"/>' +
    '<rect x="30" y="14" width="52" height="70" rx="6" fill="url(#p-hueso)"/>' +
    '<rect x="14" y="8" width="14" height="82" rx="7" fill="' + t('teal', 3) + '"/>' +
    '<path d="M40 32 H72 M40 46 H72 M40 60 H60" stroke="' + t('tinta', 0) + '" stroke-width="5" stroke-linecap="round" opacity=".4"/>' +
    lustre(36, 22, 3.5, 9, 10, 0.4)
  };

  I.calendario = { et: 'calendario', svg:
    piso(50, 28) +
    '<rect x="12" y="18" width="76" height="72" rx="14" fill="url(#p-hueso)"/>' +
    '<path d="M12 32 C12 24 18 18 26 18 H74 C82 18 88 24 88 32 V40 H12 Z" fill="url(#p-rojo)"/>' +
    '<rect x="28" y="6" width="11" height="22" rx="5.5" fill="' + t('tinta', 1) + '"/>' +
    '<rect x="61" y="6" width="11" height="22" rx="5.5" fill="' + t('tinta', 1) + '"/>' +
    '<g fill="' + t('tinta', 0) + '" opacity=".4">' +
      '<circle cx="30" cy="55" r="5"/><circle cx="50" cy="55" r="5"/><circle cx="70" cy="55" r="5"/>' +
      '<circle cx="30" cy="72" r="5"/>' +
    '</g>' +
    '<circle cx="50" cy="72" r="8" fill="' + t('verde', 1) + '"/>' +
    lustre(26, 28, 8, 3.5, -4, 0.35)
  };

  I.mapa = { et: 'plan', svg:
    piso(50, 30) +
    '<path d="M8 26 L36 16 V78 L8 88 Z" fill="url(#p-verde)"/>' +
    '<path d="M36 16 L64 26 V88 L36 78 Z" fill="' + t('crema', 1) + '"/>' +
    '<path d="M64 26 L92 16 V78 L64 88 Z" fill="url(#p-verde)"/>' +
    '<path d="M22 74 C28 60 44 62 46 48 C48 34 62 34 72 28" fill="none" stroke="' + t('rojo', 1) + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 8"/>' +
    '<circle cx="74" cy="27" r="7" fill="' + t('rojo', 1) + '"/>' +
    lustre(20, 34, 4, 12, 12, 0.35)
  };

  I.tienda = { et: 'tu negocio', svg:
    piso(50, 30) +
    '<rect x="16" y="42" width="68" height="48" rx="9" fill="url(#p-crema)"/>' +
    '<path d="M10 24 C10 20 13 18 17 18 H83 C87 18 90 20 90 24 L86 42 H14 Z" fill="url(#p-rojo)"/>' +
    '<path d="M26 42 L28 18 M44 42 V18 M62 42 L60 18 M78 42 L76 18" stroke="' + t('hueso', 0) + '" stroke-width="8" opacity=".85"/>' +
    '<rect x="38" y="60" width="24" height="30" rx="6" fill="' + t('teal', 1) + '"/>' +
    '<rect x="22" y="56" width="12" height="12" rx="4" fill="' + t('azul', 0) + '" opacity=".8"/>' +
    '<rect x="66" y="56" width="12" height="12" rx="4" fill="' + t('azul', 0) + '" opacity=".8"/>' +
    lustre(24, 50, 5, 3, 0, 0.4)
  };

  I.gente = { et: 'clientes', svg:
    piso(50, 30) +
    '<circle cx="70" cy="36" r="14" fill="url(#b-teal)"/>' +
    '<path d="M70 52 C82 52 92 62 92 76 V86 H48 V76 C48 62 58 52 70 52 Z" fill="url(#p-teal)"/>' +
    '<circle cx="36" cy="32" r="16" fill="url(#b-azul)"/>' +
    '<path d="M36 50 C50 50 60 62 60 78 V86 H12 V78 C12 62 22 50 36 50 Z" fill="url(#p-azul)"/>' +
    lustre(30, 26, 5, 3.5, -28, 0.45)
  };

  I.persona = { et: 'persona', svg:
    piso(50, 26) +
    '<circle cx="50" cy="32" r="18" fill="url(#b-azul)"/>' +
    '<path d="M50 54 C66 54 78 66 78 82 V88 H22 V82 C22 66 34 54 50 54 Z" fill="url(#p-azul)"/>' +
    lustre(42, 25, 5, 3.5, -28, 0.45)
  };

  I.chat = { et: 'conversación', vivo: 'vibra', svg:
    piso(48, 24) +
    '<path d="M20 12 H80 C87 12 92 17 92 24 V56 C92 63 87 68 80 68 H44 L26 86 V68 H20 C13 68 8 63 8 56 V24 C8 17 13 12 20 12 Z" fill="url(#p-azul)"/>' +
    '<g fill="#fff" opacity=".85"><circle cx="32" cy="40" r="6"/><circle cx="50" cy="40" r="6"/><circle cx="68" cy="40" r="6"/></g>' +
    lustre(26, 22, 10, 4, -6, 0.35)
  };

  I.lapiz = { et: 'escribir', svg:
    piso(50, 26) +
    '<g transform="rotate(42 50 50)">' +
      '<rect x="38" y="10" width="24" height="58" rx="6" fill="url(#p-oro)"/>' +
      '<rect x="38" y="6" width="24" height="14" rx="6" fill="' + t('rosa', 1) + '"/>' +
      '<path d="M38 68 H62 L50 92 Z" fill="' + t('crema', 1) + '"/>' +
      '<path d="M44 80 H56 L50 92 Z" fill="' + t('tinta', 2) + '"/>' +
    '</g>' +
    lustre(34, 36, 3.5, 14, 42, 0.35)
  };

  I.reloj = { et: 'tiempo', vivo: 'tictac', svg:
    piso(50, 26) +
    '<rect x="41" y="4" width="18" height="12" rx="5" fill="' + t('teal', 2) + '"/>' +
    '<circle cx="50" cy="54" r="38" fill="url(#b-teal)"/>' +
    '<circle cx="50" cy="54" r="29" fill="url(#p-hueso)"/>' +
    '<g class="i-manecilla"><path d="M50 54 V32" stroke="' + t('tinta', 1) + '" stroke-width="6" stroke-linecap="round"/></g>' +
    '<path d="M50 54 L66 60" stroke="' + t('rojo', 1) + '" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="50" cy="54" r="4" fill="' + t('tinta', 2) + '"/>' +
    lustre(34, 38, 7, 4.5, -28, 0.4)
  };

  I.planta = { et: 'crecer', vivo: 'mece', svg:
    piso(50, 26) +
    '<g class="i-mece">' +
      '<path d="M50 76 V38" stroke="' + t('verde', 2) + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M50 52 C36 52 24 42 24 28 C40 26 50 36 50 52 Z" fill="url(#b-verde)"/>' +
      '<path d="M50 62 C64 62 78 54 78 40 C62 36 50 46 50 62 Z" fill="' + t('verde', 0) + '"/>' +
    '</g>' +
    '<path d="M24 70 H76 L70 88 C69 90 67 91 65 91 H35 C33 91 31 90 30 88 Z" fill="url(#p-madera)"/>' +
    '<rect x="20" y="62" width="60" height="12" rx="6" fill="' + t('madera', 0) + '"/>' +
    lustre(34, 34, 5, 8, -30, 0.4)
  };

  I.pieza = { et: 'pieza', svg:
    piso(50, 28) +
    '<path d="M18 18 H40 C40 8 60 8 60 18 H82 V40 C92 40 92 60 82 60 V82 H60 C60 92 40 92 40 82 H18 V60 C8 60 8 40 18 40 Z" fill="url(#b-morado)"/>' +
    lustre(30, 30, 9, 5, -28, 0.35)
  };

  I.bandera = { et: 'meta', vivo: 'ondea', svg:
    piso(30, 18) +
    '<rect x="22" y="8" width="10" height="82" rx="5" fill="url(#p-tinta)"/>' +
    '<path class="i-ondea" d="M32 12 C48 6 62 22 80 14 V50 C62 58 48 42 32 48 Z" fill="url(#p-rojo)"/>' +
    lustre(26, 20, 2.5, 8, 0, 0.35)
  };

  I.herramientas = { et: 'herramientas', svg:
    piso(50, 30) +
    '<path d="M34 30 V24 C34 18 38 14 44 14 H56 C62 14 66 18 66 24 V30" fill="none" stroke="' + t('tinta', 1) + '" stroke-width="9" stroke-linecap="round"/>' +
    '<rect x="10" y="30" width="80" height="56" rx="13" fill="url(#p-rojo)"/>' +
    '<rect x="10" y="46" width="80" height="12" fill="' + t('rojo', 3) + '" opacity=".3"/>' +
    '<rect x="38" y="40" width="24" height="12" rx="6" fill="' + t('oro', 1) + '"/>' +
    lustre(24, 40, 10, 4, -6, 0.35)
  };

  I.papelera = { et: 'borrar', svg:
    piso(50, 24) +
    '<rect x="34" y="8" width="32" height="10" rx="5" fill="' + t('tinta', 2) + '"/>' +
    '<rect x="16" y="18" width="68" height="12" rx="6" fill="url(#p-tinta)"/>' +
    '<path d="M24 32 H76 L70 84 C69 88 66 90 62 90 H38 C34 90 31 88 30 84 Z" fill="url(#b-tinta)"/>' +
    '<path d="M42 44 V78 M58 44 V78" stroke="' + t('tinta', 3) + '" stroke-width="5" stroke-linecap="round" opacity=".55"/>' +
    lustre(34, 44, 4, 12, 4, 0.25)
  };

  I.descarga = { et: 'guardar', svg:
    piso(50, 26) +
    '<circle cx="50" cy="48" r="38" fill="url(#b-teal)"/>' +
    '<path d="M50 26 V58 M36 46 L50 60 L64 46" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M32 70 H68" stroke="#fff" stroke-width="10" stroke-linecap="round"/>' +
    lustre(36, 32, 10, 6, -28, 0.35)
  };

  I.microfono = { et: 'entrevista', svg:
    piso(50, 24) +
    '<rect x="36" y="6" width="28" height="48" rx="14" fill="url(#b-morado)"/>' +
    '<path d="M24 44 C24 62 36 72 50 72 C64 72 76 62 76 44" fill="none" stroke="' + t('morado', 2) + '" stroke-width="8" stroke-linecap="round"/>' +
    '<rect x="44" y="70" width="12" height="16" rx="5" fill="' + t('morado', 2) + '"/>' +
    '<rect x="30" y="84" width="40" height="10" rx="5" fill="url(#p-morado)"/>' +
    lustre(43, 18, 3.5, 8, 0, 0.45)
  };

  I.libros = { et: 'aprender', svg:
    piso(50, 30) +
    '<path d="M50 26 C40 18 24 16 12 20 V78 C24 74 40 76 50 84 Z" fill="url(#p-azul)"/>' +
    '<path d="M50 26 C60 18 76 16 88 20 V78 C76 74 60 76 50 84 Z" fill="url(#p-morado)"/>' +
    '<rect x="46" y="24" width="8" height="60" rx="4" fill="' + t('tinta', 1) + '"/>' +
    lustre(26, 30, 10, 4, 8, 0.35)
  };

  I.saludo = { et: 'hola', vivo: 'saluda', svg:
    piso(50, 24) +
    '<g class="i-saluda">' +
      '<path d="M34 88 V52 C34 46 44 46 44 52 V34 C44 28 54 28 54 34 V50 C54 42 64 42 64 50 V58 C68 52 78 56 74 64 L66 82 C62 88 56 90 50 90 H42 C38 90 34 90 34 88 Z" fill="url(#b-piel)"/>' +
    '</g>' +
    lustre(42, 46, 4, 10, 0, 0.3)
  };

  I.fabrica = { et: 'producción', svg:
    piso(50, 32) +
    '<rect x="10" y="46" width="80" height="44" rx="9" fill="url(#p-tinta)"/>' +
    '<path d="M14 46 V64 L38 50 V64 L62 50 V64 L86 50 V46 Z" fill="' + t('tinta', 0) + '"/>' +
    '<rect x="66" y="14" width="16" height="34" rx="6" fill="' + t('tinta', 2) + '"/>' +
    '<g fill="' + t('oro', 1) + '"><rect x="20" y="70" width="14" height="14" rx="4"/><rect x="43" y="70" width="14" height="14" rx="4"/><rect x="66" y="70" width="14" height="14" rx="4"/></g>' +
    lustre(24, 54, 8, 3, -4, 0.3)
  };

  I.hielo = { et: 'en pausa', svg:
    piso(50, 24) +
    '<path d="M50 8 V92 M14 29 L86 71 M86 29 L14 71" stroke="url(#p-azul)" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M50 8 V92 M14 29 L86 71 M86 29 L14 71" stroke="' + t('azul', 0) + '" stroke-width="5" stroke-linecap="round" opacity=".65"/>' +
    '<circle cx="50" cy="50" r="9" fill="' + t('hueso', 0) + '" opacity=".9"/>'
  };

  I.sirena = { et: 'urgente', vivo: 'alerta', svg:
    piso(50, 26) +
    '<g class="i-pulsa">' +
      '<path d="M50 16 C64 16 76 30 76 48 V62 H24 V48 C24 30 36 16 50 16 Z" fill="url(#b-rojo)"/>' +
      '<rect x="16" y="60" width="68" height="14" rx="7" fill="' + t('tinta', 1) + '"/>' +
      '<rect x="24" y="74" width="52" height="12" rx="6" fill="' + t('tinta', 2) + '"/>' +
    '</g>' +
    lustre(38, 30, 5, 9, -24, 0.45)
  };

  /* =========================================================================
     DE EMOJI A ICONO

     585 emojis repartidos por cuarenta archivos. Reescribirlos a mano era
     tocar los cuarenta, y volver a tocarlos cada vez que se dibuje un icono
     nuevo. Esta tabla evita las dos cosas: el emoji se queda escrito donde
     está —sigue siendo lo más legible dentro del código de una lección— y
     aquí se dice con qué se dibuja.

     Varios emojis caen en el mismo icono a propósito: 🔎 y 🔍 son la misma
     lupa, 💵 💰 💸 son el mismo dinero. Y el emoji que no esté en esta tabla
     se queda tal cual y se sigue viendo: nada desaparece por no estar aún.

     Ojo con las claves: hay emojis que existen con y sin el selector de
     variación (U+FE0F). '⚙' y '⚙️' son cadenas distintas para JavaScript, y
     en los archivos de la app aparecen las dos. Por eso van las dos.
     ========================================================================= */

  var EMOJI = {
    '🔎': 'lupa', '🔍': 'lupa', '🔬': 'lupa', '🔭': 'lupa',
    '🧪': 'matraz',
    '🔧': 'llave', '🛠': 'llave', '🛠️': 'llave',
    '🤝': 'manos',
    '📊': 'barras',
    '📈': 'sube',
    '🌱': 'planta', '🌿': 'planta',
    '⚙': 'engrane', '⚙️': 'engrane', '🔄': 'engrane', '🔁': 'engrane',
    '🚀': 'cohete',
    '🔥': 'fuego', '🌋': 'fuego',
    '🕯': 'vela', '🕯️': 'vela',
    '🪙': 'moneda',
    '❤': 'corazon', '❤️': 'corazon',
    '💔': 'corazon-roto',
    '⚡': 'rayo', '⚡️': 'rayo',
    '💎': 'gema',
    '👑': 'corona',
    '⭐': 'estrella', '🌟': 'estrella', '🥇': 'estrella',
    '✨': 'chispas',
    '🏆': 'trofeo', '🥈': 'trofeo', '🥉': 'trofeo',
    '✅': 'check', '👍': 'check', '👌': 'check', '👏': 'check',
    '❌': 'equis', '🚫': 'equis',
    '⚠': 'aviso', '⚠️': 'aviso',
    '🔒': 'candado',
    '🎯': 'diana',
    '💡': 'bombilla',
    '🧠': 'cerebro',
    '🎉': 'fiesta', '🎊': 'fiesta',
    '📦': 'caja',
    '🏷': 'etiqueta', '🏷️': 'etiqueta',
    '📂': 'carpeta', '📁': 'carpeta',
    '📋': 'portapapeles', '📝': 'portapapeles', '📜': 'portapapeles',
    '📍': 'pin', '📌': 'pin',
    '🧭': 'brujula',
    '🎨': 'paleta',
    '🎁': 'regalo',
    '💵': 'billete', '💰': 'billete', '💸': 'billete', '🏦': 'billete',
    '🧮': 'calculadora',
    '📣': 'megafono', '📢': 'megafono',
    '🧾': 'recibo',
    '📒': 'libreta', '📓': 'libreta',
    '📅': 'calendario', '🗓': 'calendario', '🗓️': 'calendario',
    '🗺': 'mapa', '🗺️': 'mapa',
    '🏪': 'tienda', '🏬': 'tienda', '🏢': 'tienda',
    '👥': 'gente',
    '👤': 'persona', '🧑': 'persona',
    '💬': 'chat', '🗣': 'chat', '🗣️': 'chat',
    '✍': 'lapiz', '✍️': 'lapiz',
    '⏱': 'reloj', '⏱️': 'reloj', '⏰': 'reloj', '⏳': 'reloj',
    '🧩': 'pieza',
    '🚩': 'bandera', '🏁': 'bandera',
    '🧰': 'herramientas',
    '🗑': 'papelera', '🗑️': 'papelera',
    '⬇': 'descarga', '⬇️': 'descarga', '💾': 'descarga',
    '🎤': 'microfono',
    '📚': 'libros', '📖': 'libros',
    '👋': 'saludo',
    '🏭': 'fabrica', '🏗': 'fabrica', '🏗️': 'fabrica',
    '🧊': 'hielo',
    '🚨': 'sirena'
  };

  w.ICONOS = {
    T: T,
    tono: t,
    defs: defs,
    piezas: { piso: piso, lustre: lustre, chispa: chispa, dientes: dientes },
    catalogo: I,
    emoji: EMOJI,
    /** Los nombres, en orden de dibujo, para la hoja de contactos de docs/. */
    nombres: function () { return Object.keys(I); }
  };
})(window);
