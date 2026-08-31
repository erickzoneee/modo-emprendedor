/* ==========================================================================
   PIEZAS DEL PUESTO — con qué se decora un puesto de la Plaza

   El puesto no cambia de forma. Sigue siendo el mismo rectángulo con toldo
   arriba y cuerpo abajo que ya conoce quien abrió el suyo: lo que cambia son
   las piezas que se le ponen, y siempre en el mismo sitio. Es la misma idea
   de js/data/mascota-capas.js, un escalón más arriba.

   CINCO RANURAS, EN ORDEN DE PINTADO
     suelo     debajo de todo. Sobre qué está montado el puesto.
     toldo     la lona de arriba: su tejido y su borde.
     color     de qué color es esa lona. Y solo esa lona.
     letrero   cómo se enmarca el nombre del negocio, dentro del cuerpo.
     adorno    lo que hay alrededor. Va por encima, y nunca sobre el texto.

   POR QUÉ AQUÍ NO HAY UN SOLO COLOR
   Igual que en js/data/config.js con los temas: los hex viven en
   css/puesto.css, que es quien decide qué es un valor válido. Si una clave no
   existe allí, simplemente no pinta. No hay forma de meter un estilo
   arbitrario desde aquí, ni desde el teléfono de otra persona.

   DOS ZONAS PROHIBIDAS PARA LOS ADORNOS
     · el rótulo del sector   arriba a la izquierda del toldo
     · el cuerpo del puesto   donde van el nombre y la frase
   Un adorno que tape cualquiera de las dos deja de ser un adorno: es un
   estorbo. Por eso viven en dos franjas de proporción fija —una al pie y otra
   sobre la cabeza del puesto— y en los márgenes de los lados, y la capa
   entera es `pointer-events: none`.

   SIN DEGRADADOS Y SIN <defs>, A PROPÓSITO
   Por lo mismo que las capas de la mascota: en la Plaza se pintan varios
   puestos a la vez, y un `url(#id)` repetido en la página es una bomba de
   relojería. Con rellenos planos el problema no existe.

   TAMAÑO MÍNIMO
   Las franjas de adornos se dibujan sobre lienzos de 320 unidades de ancho
   que ocupan el ancho del puesto más 24 px por lado —unos 380 px en un
   teléfono—. Es casi 1:1, así que ninguna pieza baja de 5 unidades ni ningún
   trazo de 2.
   ========================================================================== */
(function (w) {
  'use strict';

  /* Materiales que tienen que leerse como el material que son, de día y de
     noche. No siguen al tema ni al color del toldo: una maceta de barro
     pintada de índigo deja de parecer una maceta de barro. */
  var MADERA      = '#B07A45';
  var MADERA_OSC  = '#8A5C31';
  var METAL       = '#8E9BAC';
  var METAL_OSC   = '#63707F';
  var BARRO       = '#C86B45';
  var BARRO_OSC   = '#A2512F';
  var HOJA        = '#3E8E44';
  var HOJA_OSC    = '#2C6B31';
  var PETALO      = '#F2B33D';
  var CARTON      = '#C9A171';
  var CARTON_OSC  = '#A97F4F';
  var PIZARRA     = '#2E3440';
  var TIZA        = '#F3F6FA';
  var LUZ         = '#FFD79A';
  var CUERDA      = '#9A8468';

  /* ==================================================================
     SUELO — sobre qué está montado el puesto

     Solo nombres: lo pinta css/puesto.css con [data-pz-suelo]. Aquí vive la
     lista cerrada y cómo se llama cada uno en pantalla.
     ================================================================== */

  var SUELO = {
    ninguno: { nombre: 'Sin nada',  sub: 'El puesto, apoyado en la plaza.' },
    tarima:  { nombre: 'Tarima',    sub: 'Tablones de madera, como los de un mercado.' },
    tapete:  { nombre: 'Tapete',    sub: 'Tejido, con fleco en las orillas.' },
    adoquin: { nombre: 'Adoquín',   sub: 'La piedra de la plaza, bien puesta.' },
    pasto:   { nombre: 'Pasto',     sub: 'Como si el puesto fuera de fin de semana.' }
  };

  /* ==================================================================
     TOLDO — el tejido de la lona y el borde de abajo

     Cada clave es un look entero: tejido más borde. Se eligen juntos porque
     se ven juntos, y separarlos en dos ranuras obligaría a acertar dos veces
     para que quedara bien una.
     ================================================================== */

  var TOLDO = {
    feston:  { nombre: 'Festón',  sub: 'El clásico de mercado, con el borde mordido.' },
    rayas:   { nombre: 'Rayas',   sub: 'Franjas verticales de dos tonos.' },
    picos:   { nombre: 'Picos',   sub: 'Borde de triángulos, como un banderín largo.' },
    ondas:   { nombre: 'Ondas',   sub: 'Franjas en diagonal y borde de ola.' },
    cuadros: { nombre: 'Cuadros', sub: 'De mantel de día de campo.' },
    lona:    { nombre: 'Lona',    sub: 'Lisa y con costura. Sobria.' }
  };

  /* ==================================================================
     COLOR — de qué color es la lona

     `oficio` es el de reserva y el que trae puesto todo el mundo: el color
     que ya salía de su sector. Los nueve siguientes son elección suya.

     Los hex viven en css/puesto.css. Los seis primeros son exactamente los
     --neg-acento de css/temas.css que ya usaban los toldos por sector, así
     que su contraste sobre blanco ya estaba medido; los tres últimos se
     midieron igual antes de entrar aquí.
     ================================================================== */

  var COLOR = {
    oficio:    { nombre: 'El de mi oficio' },
    mandarina: { nombre: 'Mandarina' },
    miel:      { nombre: 'Miel' },
    menta:     { nombre: 'Menta' },
    indigo:    { nombre: 'Índigo' },
    oceano:    { nombre: 'Océano' },
    teal:      { nombre: 'Verde azulado' },
    cereza:    { nombre: 'Cereza' },
    uva:       { nombre: 'Uva' },
    bosque:    { nombre: 'Bosque' }
  };

  /* ==================================================================
     LETRERO — cómo se enmarca el nombre del negocio

     No cambia el nombre ni lo recorta: solo el marco donde se lee. Si no hay
     nombre, la ranura no pinta nada, y eso lo decide js/core/puesto.js.
     ================================================================== */

  var LETRERO = {
    ninguno: { nombre: 'Sin marco',  sub: 'El nombre, a secas.' },
    tabla:   { nombre: 'Tabla',      sub: 'Madera con dos clavos.' },
    pizarra: { nombre: 'Pizarra',    sub: 'Escrito con tiza.' },
    placa:   { nombre: 'Placa',      sub: 'Esmaltada, con filo blanco.' },
    cinta:   { nombre: 'Cinta',      sub: 'Pintada a mano, un poco torcida.' }
  };

  /* ==================================================================
     ADORNO — lo que hay alrededor del puesto

     DOS FRANJAS, Y LA RAZÓN ES UN FALLO QUE SE VIO EN LA MAQUETA
     La primera versión usaba un solo lienzo estirado sobre el puesto entero.
     El puesto no mide siempre lo mismo —una frase de dos líneas y otra de
     tres ya cambian su alto—, así que el dibujo se estiraba con él y las
     macetas acababan a media altura, encima del texto. Un adorno que tapa lo
     que dice tu puesto no es un adorno.

     Ahora cada pieza declara en qué franja vive, y cada franja tiene una
     proporción fija —`aspect-ratio` en css/puesto.css— anclada a un borde:

       bajo   lienzo 320×96, pegado al PIE del puesto. El suelo está en y 88 y
              el borde inferior del puesto cae justo ahí. Todo lo que se apoya
              en el suelo va aquí.
       alto   lienzo 320×56, pegado a la CABEZA del puesto. El borde superior
              del puesto está en y 34, así que de y 0 a y 34 hay cielo libre.
              Lo que cuelga va aquí.

     DÓNDE NO SE PUEDE DIBUJAR
     La franja sobresale 24 px por cada lado del puesto, que en unidades del
     lienzo son unas 20: el puesto ocupa de x 20 a x 300. Una pieza lateral
     tiene que estar CENTRADA fuera de ese margen, no solo pegada a él — el
     texto del cuerpo empieza a 16 px del borde, y una maceta que entre más
     que eso se lo come.
     ================================================================== */

  var ADORNO = {

    ninguno: {
      nombre: 'Nada', sub: 'El puesto solo, sin adornos.',
      zona: 'bajo', svg: function () { return ''; }
    },

    /* Dos macetas de barro, una a cada lado, apoyadas en el suelo. */
    macetas: {
      nombre: 'Macetas', sub: 'Dos de barro, una a cada lado.',
      zona: 'bajo',
      svg: function () {
        function maceta(x) {
          return '' +
            '<path d="M' + (x - 11) + ' 62 L' + (x + 11) + ' 62 L' + (x + 8) + ' 88 L' + (x - 8) + ' 88 Z" fill="' + BARRO + '"/>' +
            '<rect x="' + (x - 13) + '" y="57" width="26" height="7" rx="3.5" fill="' + BARRO_OSC + '"/>' +
            '<path d="M' + x + ' 58 C' + (x - 11) + ' 52 ' + (x - 13) + ' 40 ' + (x - 5) + ' 36 C' + (x - 2) + ' 44 ' + (x - 1) + ' 51 ' + x + ' 58 Z" fill="' + HOJA + '"/>' +
            '<path d="M' + x + ' 58 C' + (x + 11) + ' 51 ' + (x + 12) + ' 39 ' + (x + 4) + ' 35 C' + (x + 1) + ' 43 ' + (x + 1) + ' 51 ' + x + ' 58 Z" fill="' + HOJA_OSC + '"/>' +
            '<path d="M' + x + ' 58 C' + (x - 3) + ' 48 ' + (x - 2) + ' 38 ' + x + ' 30 C' + (x + 2) + ' 38 ' + (x + 3) + ' 48 ' + x + ' 58 Z" fill="' + HOJA + '"/>';
        }
        return maceta(15) + maceta(305);
      }
    },

    /* Un farol plantado al lado del puesto. Antes colgaba del toldo, y ahí
       chocaba con el rótulo del sector y con la etiqueta "Tu puesto": los dos
       viven en esa esquina y llegaron antes. De pie en el suelo es además el
       mismo farol que ya alumbra la plaza. */
    farol: {
      nombre: 'Farol', sub: 'De pie al lado, encendido.',
      zona: 'bajo',
      svg: function () {
        var x = 306;
        return '' +
          '<rect x="' + (x - 12) + '" y="84" width="24" height="5" rx="2.5" fill="' + METAL_OSC + '"/>' +
          '<rect x="' + (x - 3) + '" y="46" width="6" height="40" rx="3" fill="' + METAL + '"/>' +
          '<path d="M' + (x - 11) + ' 46 L' + (x + 11) + ' 46 L' + (x + 8) + ' 20 L' + (x - 8) + ' 20 Z" fill="' + METAL + '"/>' +
          '<path d="M' + (x - 8) + ' 43 L' + (x + 8) + ' 43 L' + (x + 6) + ' 24 L' + (x - 6) + ' 24 Z" class="pz-llama" fill="' + LUZ + '"/>' +
          '<circle cx="' + x + '" cy="33" r="4.2" fill="#FFF3D6"/>' +
          '<rect x="' + (x - 10) + '" y="15" width="20" height="5" rx="2.5" fill="' + METAL_OSC + '"/>';
      }
    },

    /* Guirnalda de banderines colgando por encima del toldo. Cinco, y los de
       en medio más bajos: una cuerda tensa no cuelga, se ve tiesa. */
    banderines: {
      nombre: 'Banderines', sub: 'Una guirnalda cruzando por encima.',
      zona: 'alto',
      svg: function () {
        var colores = ['#E0703C', '#2FA67B', '#3E9AD4', '#C08B33', '#CE4C6C'];
        var s = '<path d="M12 8 Q160 26 308 8" fill="none" stroke="' + CUERDA + '" stroke-width="2.4"/>';
        var xs = [48, 106, 160, 214, 272];
        var ys = [13, 19, 21, 19, 13];
        for (var i = 0; i < xs.length; i++) {
          s += '<path d="M' + (xs[i] - 10) + ' ' + ys[i] + ' L' + (xs[i] + 10) + ' ' + ys[i] +
               ' L' + xs[i] + ' ' + (ys[i] + 19) + ' Z" fill="' + colores[i] + '"/>';
        }
        return s;
      }
    },

    /* Cajas apiladas a la izquierda. Producto listo para salir. */
    cajas: {
      nombre: 'Cajas', sub: 'Apiladas a un lado, listas para salir.',
      zona: 'bajo',
      svg: function () {
        return '' +
          '<rect x="3" y="63" width="30" height="25" rx="4" fill="' + CARTON + '"/>' +
          '<path d="M4 72 H32" stroke="' + CARTON_OSC + '" stroke-width="2.6"/>' +
          '<rect x="7" y="42" width="25" height="21" rx="4" fill="' + CARTON + '"/>' +
          '<path d="M9 51 H30" stroke="' + CARTON_OSC + '" stroke-width="2.4"/>' +
          '<rect x="15" y="35" width="11" height="8" rx="2" fill="' + CARTON_OSC + '"/>';
      }
    },

    /* Pizarrón de ofertas a la derecha, apoyado en el suelo. Las rayas de
       tiza no dicen nada: un pizarrón con texto de verdad sería un segundo
       sitio donde escribir, y ese sitio ya existe. */
    pizarron: {
      nombre: 'Pizarrón', sub: 'De los que se ponen fuera, con su trazo de tiza.',
      zona: 'bajo',
      svg: function () {
        return '' +
          /* Cabe entero de x 286 a x 316: la franja sobresale 24 px del puesto
             y el puesto ya está a 20 px del borde de la pantalla, así que lo
             que se dibuje pasado x 316 lo recorta el borde de la Plaza. */
          '<path d="M290 88 L296 58" stroke="' + MADERA_OSC + '" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M314 88 L308 58" stroke="' + MADERA_OSC + '" stroke-width="4" stroke-linecap="round"/>' +
          '<rect x="286" y="34" width="30" height="28" rx="4" fill="' + MADERA + '"/>' +
          '<rect x="290" y="38" width="22" height="20" rx="2.5" fill="' + PIZARRA + '"/>' +
          '<path d="M294 45 H308" stroke="' + TIZA + '" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>' +
          '<path d="M294 52 H304" stroke="' + TIZA + '" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>';
      }
    },

    /* Girasoles a los lados, más altos que las macetas: los de quien quiere
       que su puesto se vea desde lejos. */
    girasoles: {
      nombre: 'Girasoles', sub: 'Altos, para que se vea desde lejos.',
      zona: 'bajo',
      svg: function () {
        function flor(x, y) {
          var s = '<path d="M' + x + ' 88 C' + (x - 3) + ' 70 ' + (x - 2) + ' ' + (y + 20) + ' ' + x + ' ' + (y + 11) +
                  '" fill="none" stroke="' + HOJA_OSC + '" stroke-width="4" stroke-linecap="round"/>';
          s += '<path d="M' + x + ' 72 C' + (x - 12) + ' 68 ' + (x - 13) + ' 59 ' + (x - 5) + ' 58 C' + (x - 2) + ' 64 ' + (x - 1) + ' 68 ' + x + ' 72 Z" fill="' + HOJA + '"/>';
          for (var i = 0; i < 8; i++) {
            var a = (360 / 8) * i;
            s += '<ellipse cx="' + x + '" cy="' + (y - 8) + '" rx="4.2" ry="8" fill="' + PETALO +
                 '" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>';
          }
          s += '<circle cx="' + x + '" cy="' + y + '" r="5.8" fill="' + MADERA_OSC + '"/>';
          return s;
        }
        return flor(19, 36) + flor(301, 44);
      }
    }
  };

  /* ==================================================================
     EL CATÁLOGO, JUNTO

     RANURAS manda el orden en el que se enseñan en la pantalla de decorar y
     el orden en el que se pintan. DEFECTO es el puesto tal y como se veía
     antes de que existiera nada de esto: quien no toque nada no ve ningún
     cambio, y eso es a propósito.
     ================================================================== */

  var RANURAS = ['toldo', 'color', 'letrero', 'adorno', 'suelo'];

  var DEFECTO = {
    toldo: 'feston', color: 'oficio', letrero: 'ninguno',
    adorno: 'ninguno', suelo: 'ninguno'
  };

  var CATALOGO = {
    toldo: TOLDO, color: COLOR, letrero: LETRERO, adorno: ADORNO, suelo: SUELO
  };

  /* Cómo se llama cada ranura cuando se le pregunta al usuario. En su idioma,
     no en el del código. */
  var TITULO = {
    toldo:   'El toldo',
    color:   'De qué color',
    letrero: 'El letrero',
    adorno:  'Lo que hay alrededor',
    suelo:   'Sobre qué está'
  };

  var PISTA = {
    toldo:   'La lona de arriba. Es lo primero que se ve de un puesto.',
    color:   'Solo pinta el toldo. El resto del puesto sigue siendo de la casa.',
    letrero: 'El marco donde se lee el nombre de tu negocio.',
    adorno:  'Lo que pones a los lados. Nunca tapa lo que dice tu puesto.',
    suelo:   'Sobre qué lo montas.'
  };

  w.PUESTO_PIEZAS = {
    RANURAS: RANURAS,
    DEFECTO: DEFECTO,
    CATALOGO: CATALOGO,
    TITULO: TITULO,
    PISTA: PISTA,

    TOLDO: TOLDO, COLOR: COLOR, LETRERO: LETRERO, ADORNO: ADORNO, SUELO: SUELO,

    /** Las claves de una ranura, en orden. */
    claves: function (ranura) {
      var c = CATALOGO[ranura];
      return c ? Object.keys(c) : [];
    },

    /** ¿Existe esta pieza en esta ranura? La única puerta de entrada. */
    valida: function (ranura, clave) {
      var c = CATALOGO[ranura];
      return !!(c && Object.prototype.hasOwnProperty.call(c, clave));
    },

    /** El dibujo de un adorno, o cadena vacía si no lo hay. */
    adornoSVG: function (clave) {
      var a = ADORNO[clave];
      return a && typeof a.svg === 'function' ? a.svg() : '';
    }
  };
})(window);
