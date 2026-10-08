/* ==========================================================================
   MATERIAL LISTO PARA USAR — el catálogo

   Ocho textos que Chispa escribe con lo que ya sabe del negocio. No es un
   generador: es una plantilla que se rellena con `Venture.terms()`, la misma
   fuente de la que salen los ejemplos de las lecciones.

   LA REGLA QUE LO HACE SENTIR CARO

   Si falta un dato, NO se abre un formulario. Un formulario aquí sería
   confesar que la app no se acordaba de nada, justo en la pantalla que existe
   para demostrar lo contrario.

   Cada material declara qué necesita en `pide`. Si algo falta, el material no
   se ofrece: sale apagado, diciendo exactamente qué le falta a Chispa y con
   un camino para contárselo. Es la misma decisión que ya toma el catálogo de
   logros compartibles — si falta un dato, el logro no se ofrece.

   POR QUÉ SON DETERMINISTAS

   Porque tienen que funcionar sin conexión, en el mismo teléfono donde la
   persona está a punto de mandar el mensaje. Y porque un texto que sale igual
   dos veces se puede corregir; uno que cambia cada vez, no. Si hay IA
   disponible, reescribe la redacción encima — nunca decide el contenido.

   CÓMO SE ESCRIBEN

   Cada `texto(t)` recibe los ~35 términos y devuelve una cadena con saltos de
   línea. Los corchetes `[así]` son huecos que la persona TIENE que rellenar a
   mano y son deliberados: el nombre de a quién le escribe, la fecha, el
   plazo. Poner ahí un invento sería peor que dejar el hueco, porque se
   mandaría sin revisar.
   ========================================================================== */
(function (w) {
  'use strict';

  /* Qué puede pedir un material, y cómo se le explica a alguien que le falta.
     El `ir` lleva al sitio donde se cuenta ese dato, que casi siempre es el
     perfil del emprendimiento. */
  var DATOS = {
    producto: { label: 'qué vendes',        ir: 'venture' },
    cliente:  { label: 'a quién le vendes', ir: 'venture' },
    precio:   { label: 'tu precio',         ir: 'mentor' },
    problema: { label: 'qué problema resuelves', ir: 'business' }
  };

  /* Los remates por oficio. Sin esto, los ocho materiales suenan igual para
     una pastelería que para un taller de impresión 3D, que es justo lo que
     esta app lleva evitando desde el principio. */
  var CIERRE_SECTOR = {
    hechoamano: 'Cada pieza la hago yo.',
    comida:     'Se hace el mismo día.',
    servicios:  'Lo dejo funcionando y te explico cómo quedó.',
    digital:    'Te lo entrego listo para usar.',
    reventa:    'Lo tengo aquí, sin espera.',
    otro:       ''
  };

  function cierre(t) { return CIERRE_SECTOR[t.sector] || ''; }

  /**
   * Une las líneas de una plantilla.
   *
   * DOS COSAS QUE PARECEN LA MISMA Y NO LO SON:
   *
   *   `null`  una línea que NO va porque falta el dato (el precio, la ciudad).
   *           Desaparece y no deja hueco.
   *   `''`    un renglón en blanco a propósito, para separar párrafos.
   *           Se queda, porque un mensaje de venta sin aire no se lee.
   *
   * La primera versión filtraba las dos por igual —`filter(l => l && ...)`— y
   * los ocho materiales salían como un ladrillo de texto sin un solo párrafo.
   * No fallaba nada; solo se leían mal, que es la única forma en que un
   * material así puede fallar.
   *
   * Al final se colapsan los saltos triples: cuando una línea opcional cae
   * entre dos blancos, se quedaban dos renglones vacíos seguidos.
   */
  function juntar(lineas) {
    return lineas
      .filter(function (l) { return l !== null && l !== undefined && l !== false; })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function conPrecio(t) {
    return t.precio ? ('$' + t.precio) : '[tu precio]';
  }

  var MATERIALES = [

    /* ------------------------------------------------ publicación -- */
    {
      id: 'publicacion',
      icon: '📣',
      nombre: 'Publicación',
      para: 'Para tu grupo, tu estado o marketplace',
      pide: ['producto', 'cliente'],
      texto: function (t) {
        return juntar([
          preguntaGancho(t),
          '',
          capital(t.producto) + '. Para ' + t.cliente + '.',
          cierre(t) || null,
          '',
          t.precio ? ('Desde ' + conPrecio(t) + '.') : null,
          t.lugar ? ('Estoy en ' + t.lugar + '.') : null,
          '',
          'Escríbeme y te paso fotos de lo último que hice.'
        ]);
      }
    },

    /* --------------------------------------------- mensaje de venta -- */
    {
      id: 'mensaje',
      icon: '💬',
      nombre: 'Mensaje de venta',
      para: 'Para escribirle a alguien que todavía no te conoce',
      pide: ['producto', 'cliente'],
      texto: function (t) {
        return juntar([
          'Hola [nombre], vi [algo concreto de su negocio o su situación].',
          '',
          'Trabajo con ' + t.cliente + ': ' + t.producto + '.',
          cierre(t) || null,
          '',
          '¿Te sirve que te mande [una foto / un ejemplo / los precios]?'
        ]);
      },
      nota: 'Los corchetes déjalos para el final y llénalos uno por uno. Un mensaje con el nombre bien puesto se responde; uno copiado, no.'
    },

    /* ------------------------------------------------------- pitch -- */
    {
      id: 'pitch',
      icon: '🎤',
      nombre: 'Tu pitch de 30 segundos',
      para: 'Para cuando te preguntan a qué te dedicas',
      pide: ['producto', 'cliente'],
      texto: function (t) {
        return juntar([
          'Ayudo a ' + t.cliente + ' con ' + t.producto + '.',
          '',
          'La mayoría [lo que hacen hoy y les falla]. Yo ' + verboSector(t) + ' ' +
            t.tuProducto + ' para que no les pase.',
          '',
          t.negocio !== 'tu negocio' ? ('Se llama ' + t.negocio + '.') : null,
          '¿Conoces a alguien a quien le sirva?'
        ]);
      },
      nota: 'Dilo en voz alta dos veces antes de usarlo. Lo que no se puede decir sin leer, no es un pitch.'
    },

    /* -------------------------------------------------- cotización -- */
    {
      id: 'cotizacion',
      icon: '🧾',
      nombre: 'Cotización',
      para: 'Para mandar por escrito y que quede claro',
      pide: ['producto', 'precio'],
      texto: function (t) {
        return juntar([
          'COTIZACIÓN — ' + (t.negocio !== 'tu negocio' ? t.negocio : '[tu negocio]'),
          'Para: [nombre del cliente]',
          'Fecha: [hoy]',
          '',
          'Qué incluye:',
          '· ' + capital(t.producto),
          '· [lo que va incluido]',
          '· [lo que NO va incluido]',
          '',
          'Cantidad: [' + t.cuantasUnidades + ']',
          'Precio por ' + t.unidad + ': ' + conPrecio(t),
          'Total: [cantidad × precio]',
          '',
          'Tiempo de entrega: [días]',
          'Forma de pago: [anticipo y resto / al entregar]',
          'Esta cotización vale hasta el [fecha].'
        ]);
      },
      nota: 'La fecha de caducidad no es un adorno: es lo que hace que te contesten.'
    },

    /* ------------------------------------------------------- guion -- */
    {
      id: 'guion',
      icon: '📞',
      nombre: 'Guion para una llamada',
      para: 'Para no quedarte en blanco',
      pide: ['producto', 'cliente'],
      texto: function (t) {
        return juntar([
          '1 · Abrir',
          '«Hola [nombre], soy [tú]. Te escribo por [motivo concreto]. ¿Tienes dos minutos?»',
          '',
          '2 · Preguntar antes de vender',
          '«¿Cómo lo resuelves hoy?»',
          '«¿Qué es lo que más te cuesta de eso?»',
          '',
          '3 · Contar, ya sabiendo',
          '«Justo eso es lo que hago: ' + t.producto + '.»',
          cierre(t) ? ('«' + cierre(t) + '»') : null,
          '',
          '4 · Cerrar con algo concreto',
          '«¿Te mando [una muestra / la cotización / los precios] hoy mismo?»'
        ]);
      },
      nota: 'El paso 2 es el que casi nadie hace. Sin él, el paso 3 es un anuncio.'
    },

    /* ---------------------------------------------------- objeción -- */
    {
      id: 'objecion',
      icon: '🛡️',
      nombre: 'Respuesta a «está caro»',
      para: 'Para tenerla lista antes de que pase',
      pide: ['producto', 'precio'],
      texto: function (t) {
        return juntar([
          'No bajes el precio en la primera frase. Primero entiende de qué habla:',
          '',
          '«¿Caro comparado con qué?»',
          '',
          'Si compara con algo más barato:',
          '«Ese sale a [precio del otro]. La diferencia es que ' + cierre(t).toLowerCase().replace(/\.$/, '') +
            ' y [lo que tú das y el otro no]. Si te sirve el otro, adelante.»',
          '',
          'Si es que no le alcanza ahora:',
          '«Te entiendo. ¿Te sirve [una versión más chica / la mitad ahora y la mitad después]?»',
          '',
          'Si es que no ve el valor:',
          '«¿Cuánto te cuesta hoy [el problema]? Eso es lo que estás pagando ya.»'
        ]);
      },
      nota: 'Bajar el precio para cerrar la primera venta enseña al cliente que tu precio no era verdad.'
    },

    /* -------------------------------------------------- seguimiento -- */
    {
      id: 'seguimiento',
      icon: '🔁',
      nombre: 'Mensaje de seguimiento',
      para: 'Para el que te dijo «déjame ver» y no volvió',
      pide: ['producto'],
      texto: function (t) {
        return juntar([
          'Hola [nombre], te escribo rápido por lo de [lo que hablaron].',
          '',
          'No es para presionarte. Solo por si se te pasó, o si prefieres que lo dejemos para más adelante.',
          '',
          'Si sigue en pie, [lo que falta para arrancar]. Y si no, también me sirve saberlo.'
        ]);
      },
      nota: 'Dar permiso para decir que no es lo que hace que contesten. La mayoría de las ventas se caen por no volver a preguntar.'
    },

    /* ----------------------------------------------------- gracias -- */
    {
      id: 'gracias',
      icon: '🙏',
      nombre: 'Después de vender',
      para: 'Para pedir opinión y referidos sin sonar pesado',
      pide: ['producto'],
      texto: function (t) {
        return juntar([
          'Hola [nombre], gracias por [lo que te compró].',
          '',
          'Dos cosas cortas:',
          '',
          '1 · ¿Qué tal salió? Si algo no quedó bien, prefiero saberlo yo antes que nadie.',
          '',
          '2 · Si te gustó y conoces a alguien a quien le sirva, pásale mi contacto. Así es como me llega casi todo el trabajo.'
        ]);
      },
      nota: 'Este es el mensaje más rentable de los ocho, y el que menos gente manda.'
    }
  ];

  /* ==================================================================
     PIEZAS DE REDACCIÓN
     ================================================================== */

  function capital(s) {
    s = String(s || '');
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  /** La primera línea de la publicación: una pregunta que le duela a quien
      la lea. Es un HUECO a propósito y no una frase inventada.

      Podría rellenarse con lo que haya en el expediente, pero eso es texto
      libre que la persona escribió para otra cosa, y pegarlo aquí saldría
      torcido la mitad de las veces. Un hueco corto y con su nombre dentro
      —«¿[Qué le molesta a dueños de perros]?»— se rellena en diez segundos y
      no se manda sin mirar, que es justo lo que tiene que pasar con la
      primera línea de una publicación. */
  function preguntaGancho(t) {
    return '¿[Qué le molesta a ' + t.clienteCorto + ']?';
  }

  var VERBO_SECTOR = {
    hechoamano: 'hago',
    comida:     'preparo',
    servicios:  'me encargo de',
    digital:    'armo',
    reventa:    'consigo',
    otro:       'hago'
  };

  function verboSector(t) { return VERBO_SECTOR[t.sector] || 'hago'; }

  w.MATERIALES = { LISTA: MATERIALES, DATOS: DATOS };
})(window);
