/* ==========================================================================
   EL PLAN DE LA SEMANA — el catálogo de lo que puede tocar

   Tres tareas por semana, y cada una con SU PORQUÉ. El porqué no es adorno:
   es lo único que separa esto de una lista de pendientes cualquiera. Una
   tarea sin motivo se pospone; una tarea que explica qué te estás jugando, no.

   CÓMO SE ELIGE

   Cada entrada declara `cuando(ctx)` —si aplica ahora mismo— y un `peso`. El
   motor (js/core/plan.js) evalúa las 25, se queda con las que aplican, las
   ordena por peso y toma tres. Nada es aleatorio: dos personas en la misma
   situación ven lo mismo, y eso es una propiedad y no una limitación — si
   mañana alguien pregunta «¿por qué me salió esto?», hay una respuesta.

   LAS REGLAS QUE NO SE SALTAN

   1. NADA QUE NO SE PUEDA HACER ESTA SEMANA. Ni «consigue 10 clientes» ni
      «monta tu tienda en línea». Si no cabe en siete días con el tiempo que
      esa persona dijo que tiene, no entra.

   2. `hecho(ctx)` MIRA EL ESTADO REAL, no una casilla. Nadie marca nada a
      mano: la tarea se tacha cuando pasó de verdad. Una lista que se puede
      marcar sin hacer nada es una lista que miente.

   3. NUNCA TRES TAREAS DE LO MISMO. El motor reparte por `familia`.

   4. EL PORQUÉ HABLA DE SU NEGOCIO. Recibe `terms()`, así que dice «tus
      collares» y no «tu producto». Cuando no sabe el dato, la frase sigue
      funcionando con el genérico que pone Venture.

   Se verifica con `node tools/check-plan.js`, que ejecuta las 25 contra
   perfiles falsos y comprueba que siempre salen tres, que ninguna se queda
   sin porqué y que ninguna manda a una pantalla que no existe.
   ========================================================================== */
(function (w) {
  'use strict';

  /* Las familias existen para que la semana no sea tres veces lo mismo.
     Como mucho una tarea por familia, salvo que no haya de dónde sacar. */
  var FAMILIAS = {
    ruta:     'Avanzar en la ruta',
    cliente:  'Hablar con gente',
    dinero:   'Los números',
    oferta:   'Lo que vendes',
    orden:    'Poner en orden',
    marca:    'Que te encuentren'
  };

  /* Etapas, para que `cuando` se lea. Vienen de CONFIG.STAGES. */
  var IDEA = 'idea', ARRANQUE = 'starting', OPERANDO = 'operating', CRECIENDO = 'growing';

  var TAREAS = [

    /* ==================================================================
       LA RUTA — siempre hay una, y por eso es la red de seguridad
       ================================================================== */

    {
      id: 'sigue-leccion',
      familia: 'ruta',
      peso: 40,
      cuando: function (c) { return !!c.siguiente && c.siguiente.kind === 'lesson'; },
      titulo: function (c) { return 'Termina «' + c.siguiente.data.title + '»'; },
      porque: function (c) {
        return 'Es la parada que te toca, y son ' + c.siguiente.data.min +
               ' minutos. Lo que aprendas ahí lo vas a usar esta misma semana.';
      },
      hecho: function (c) { return c.hechoNodo(c.siguiente.id); },
      ir: { pantalla: 'home' }
    },

    {
      id: 'sigue-reto',
      familia: 'ruta',
      peso: 92,
      cuando: function (c) { return !!c.siguiente && c.siguiente.kind === 'boss'; },
      titulo: function (c) { return 'Haz el reto: ' + c.siguiente.data.title; },
      porque: function () {
        return 'Este no se hace en la app: se hace afuera. Es donde el nivel entero deja de ser teoría.';
      },
      hecho: function (c) { return c.hechoNodo(c.siguiente.id); },
      ir: { pantalla: 'home' }
    },

    {
      id: 'tres-lecciones',
      familia: 'ruta',
      peso: 30,
      cuando: function (c) { return c.leccionesEstaSemana < 3 && c.minutos >= 15; },
      titulo: function () { return 'Haz tres lecciones esta semana'; },
      porque: function (c) {
        return 'Llevas ' + c.leccionesEstaSemana + '. Con ' + c.minutos +
               ' minutos al día te sobra, y tres seguidas es lo que hace que se te quede.';
      },
      hecho: function (c) { return c.leccionesEstaSemana >= 3; },
      ir: { pantalla: 'home' }
    },

    /* ==================================================================
       HABLAR CON GENTE — lo que más cuesta y más mueve
       ================================================================== */

    {
      id: 'habla-tres',
      familia: 'cliente',
      peso: 95,
      cuando: function (c) { return c.etapa === IDEA || c.etapa === ARRANQUE; },
      titulo: function (c) { return 'Habla con 3 personas de ' + c.t.tuCliente; },
      porque: function (c) {
        return c.t.tiene.producto
          ? 'Todavía nadie te ha dicho que sí a ' + c.t.tuProducto +
            '. Hasta que no lo escuches de una persona, es una suposición tuya.'
          : 'Nadie ha confirmado todavía que este problema le duela lo suficiente como para pagar.';
      },
      hecho: function (c) { return c.decidio('cliente') || c.dossier('problema'); },
      ir: { pantalla: 'mentor' }
    },

    {
      id: 'pide-opinion',
      familia: 'cliente',
      peso: 70,
      cuando: function (c) { return c.etapa === OPERANDO || c.etapa === CRECIENDO; },
      titulo: function () { return 'Pregúntale a un cliente por qué te compró'; },
      porque: function () {
        return 'La razón por la que te compran casi nunca es la que tú crees. Cuando la sepas, la puedes repetir a propósito.';
      },
      hecho: function (c) { return c.dossier('clientes'); },
      ir: { pantalla: 'business', params: { seccion: 'clientes' } }
    },

    {
      id: 'pide-referido',
      familia: 'cliente',
      peso: 66,
      cuando: function (c) { return (c.etapa === OPERANDO || c.etapa === CRECIENDO) && c.dossier('clientes'); },
      titulo: function () { return 'Pídele a un cliente contento que te recomiende'; },
      porque: function () {
        return 'Es la venta más barata que existe y la única que casi nadie pide. Un mensaje, hoy.';
      },
      hecho: function () { return false; },
      ir: { pantalla: 'mentor' }
    },

    {
      id: 'manda-mensajes',
      familia: 'cliente',
      peso: 88,
      cuando: function (c) { return c.tieneOferta && c.etapa !== IDEA; },
      titulo: function () { return 'Manda 10 mensajes a gente que podría comprarte'; },
      porque: function (c) {
        return 'Ya tienes qué ofrecer y a quién. Diez mensajes personalizados dan más que un mes de publicaciones al aire.';
      },
      hecho: function (c) { return c.dossier('ventas'); },
      ir: { pantalla: 'materiales', params: { material: 'mensaje' } }
    },

    /* ==================================================================
       LO QUE VENDES
       ================================================================== */

    {
      id: 'define-oferta',
      familia: 'oferta',
      peso: 93,
      cuando: function (c) { return !c.tieneOferta; },
      titulo: function () { return 'Escribe tu oferta en una sola frase'; },
      porque: function () {
        return 'Sin esto no puedo escribirte una publicación, ni un mensaje, ni una cotización. Es la pieza de la que cuelga todo lo demás.';
      },
      hecho: function (c) { return c.tieneOferta; },
      ir: { pantalla: 'venture' }
    },

    {
      id: 'publica-oferta',
      familia: 'marca',
      peso: 80,
      cuando: function (c) { return c.tieneOferta && !c.dossier('canales'); },
      titulo: function () { return 'Publica tu oferta donde esté tu cliente'; },
      porque: function (c) {
        return 'Ya la tienes escrita. Te dejo la publicación lista; solo falta elegir dónde y pegarla.';
      },
      hecho: function (c) { return c.dossier('canales'); },
      ir: { pantalla: 'materiales', params: { material: 'publicacion' } }
    },

    {
      id: 'prueba-objecion',
      familia: 'oferta',
      peso: 62,
      cuando: function (c) { return c.tienePrecio && c.etapa !== IDEA; },
      titulo: function () { return 'Prepara tu respuesta a «está caro»'; },
      porque: function () {
        return 'Te va a pasar en la primera llamada. Improvisarlo ahí es donde se pierden las ventas que ya estaban hechas.';
      },
      hecho: function (c) { return c.dossier('ventas'); },
      ir: { pantalla: 'materiales', params: { material: 'objecion' } }
    },

    {
      id: 'foto-producto',
      familia: 'marca',
      peso: 45,
      cuando: function (c) { return c.tieneOferta && c.sector !== 'digital' && c.sector !== 'servicios'; },
      titulo: function (c) { return 'Haz 5 fotos de ' + c.t.tuProducto; },
      porque: function () {
        return 'Con el teléfono y luz de día basta. Sin una foto decente, el mejor texto del mundo no vende nada.';
      },
      hecho: function () { return false; },
      ir: { pantalla: 'business', params: { seccion: 'identidad' } }
    },

    /* ==================================================================
       LOS NÚMEROS
       ================================================================== */

    {
      id: 'calcula-costo',
      familia: 'dinero',
      peso: 90,
      cuando: function (c) { return !c.tieneCosto; },
      titulo: function (c) { return 'Calcula cuánto te cuesta ' + c.t.unaUnidad; },
      porque: function () {
        return 'Sin este número, cualquier precio que pongas es una corazonada. Es la cuenta que más negocios pequeños se saltan.';
      },
      hecho: function (c) { return c.tieneCosto; },
      ir: { pantalla: 'mentor' }
    },

    {
      id: 'pon-precio',
      familia: 'dinero',
      peso: 89,
      cuando: function (c) { return c.tieneCosto && !c.tienePrecio; },
      titulo: function () { return 'Decide tu precio'; },
      porque: function (c) {
        return 'Ya sabes que ' + c.t.laUnidad + ' te cuesta $' + c.t.costo +
               '. Ahora falta el número que decide si esto es un negocio o un pasatiempo caro.';
      },
      hecho: function (c) { return c.tienePrecio; },
      ir: { pantalla: 'mentor' }
    },

    {
      id: 'apunta-semana',
      familia: 'dinero',
      peso: 72,
      cuando: function (c) { return c.etapa === OPERANDO || c.etapa === CRECIENDO; },
      titulo: function () { return 'Apunta lo que entró y lo que salió esta semana'; },
      porque: function () {
        return 'Siete días, dos columnas, una hoja. Se puede ser rentable en papel y quedarse sin efectivo: esto es lo único que lo avisa a tiempo.';
      },
      hecho: function (c) { return c.dossier('numeros'); },
      ir: { pantalla: 'business', params: { seccion: 'numeros' } }
    },

    {
      id: 'revisa-margen',
      familia: 'dinero',
      peso: 68,
      cuando: function (c) { return c.tienePrecio && c.tieneCosto && c.margenFlojo; },
      titulo: function () { return 'Revisa tu margen: está muy justo'; },
      porque: function (c) {
        return 'Te queda menos del 30% sobre ' + c.t.laUnidad +
               '. Con eso, un proveedor que suba precios te deja trabajando gratis.';
      },
      hecho: function () { return false; },
      ir: { pantalla: 'mentor' }
    },

    /* ==================================================================
       PONER EN ORDEN
       ================================================================== */

    {
      id: 'llena-expediente',
      familia: 'orden',
      peso: 55,
      cuando: function (c) { return c.seccionesVacias.length >= 6 && c.leccionesHechas >= 3; },
      titulo: function (c) { return 'Llena «' + c.seccionesVacias[0].title + '» en Mi Negocio'; },
      porque: function (c) {
        return 'Te faltan ' + c.seccionesVacias.length +
               ' de 12 secciones. Cada una que llenas hace que todo lo que te escribo sea más tuyo y menos genérico.';
      },
      hecho: function (c) { return c.dossier(c.seccionesVacias[0].key); },
      ir: { pantalla: 'business' }
    },

    {
      id: 'contesta-chispa',
      familia: 'orden',
      peso: 50,
      cuando: function (c) { return c.perfilPct < 70; },
      titulo: function () { return 'Cuéntame tres cosas más de tu negocio'; },
      porque: function (c) {
        return 'Conozco tu negocio al ' + c.perfilPct +
               '%. Con lo que falta puedo dejar de hablarte en general y empezar a hablarte de lo tuyo.';
      },
      hecho: function (c) { return c.perfilPct >= 70; },
      ir: { pantalla: 'venture' }
    },

    {
      id: 'documenta-proceso',
      familia: 'orden',
      peso: 58,
      cuando: function (c) { return c.etapa === CRECIENDO && !c.dossier('procesos'); },
      titulo: function () { return 'Escribe paso a paso cómo haces lo que haces'; },
      porque: function () {
        return 'Es lo que separa un negocio de un empleo que te pagas tú. Sin esto escrito, no puedes delegar ni un día libre.';
      },
      hecho: function (c) { return c.dossier('procesos'); },
      ir: { pantalla: 'business', params: { seccion: 'procesos' } }
    },

    {
      id: 'respalda',
      familia: 'orden',
      peso: 35,
      cuando: function (c) { return c.diasSinRespaldo == null || c.diasSinRespaldo >= 14; },
      titulo: function () { return 'Guarda una copia de tu progreso'; },
      porque: function (c) {
        return c.diasSinRespaldo == null
          ? 'Nunca has hecho una. Todo lo que llevas vive solo en este teléfono.'
          : 'Hace ' + c.diasSinRespaldo + ' días de la última. Un teléfono perdido se lleva todo.';
      },
      hecho: function (c) { return c.diasSinRespaldo != null && c.diasSinRespaldo < 7; },
      ir: { pantalla: 'profile' }
    },

    /* ==================================================================
       QUE TE ENCUENTREN
       ================================================================== */

    {
      id: 'abre-puesto',
      familia: 'marca',
      peso: 48,
      cuando: function (c) { return c.tieneOferta && !c.puestoAbierto && c.leccionesHechas >= 5; },
      titulo: function () { return 'Abre tu puesto en la Plaza'; },
      porque: function () {
        return 'Sale solo lo que apruebes, línea por línea, y nunca tus números. Es donde otra gente que está en esto puede verte.';
      },
      hecho: function (c) { return c.puestoAbierto; },
      ir: { pantalla: 'plaza' }
    },

    {
      id: 'juega-simulador',
      familia: 'orden',
      peso: 42,
      cuando: function (c) { return c.semanasSim < 4 && c.leccionesHechas >= 4; },
      titulo: function () { return 'Juega cuatro semanas del simulador'; },
      porque: function () {
        return 'Ahí puedes quebrar gratis. Las decisiones de precio e inventario cuestan lo mismo aprenderlas ahí que en tu negocio, menos el dinero.';
      },
      hecho: function (c) { return c.semanasSim >= 4; },
      ir: { pantalla: 'simulator' }
    },

    {
      id: 'plan-90',
      familia: 'orden',
      peso: 60,
      cuando: function (c) { return c.leccionesHechas >= 20 && !c.dossier('plan'); },
      titulo: function () { return 'Escribe tu plan de 90 días'; },
      porque: function () {
        return 'Ya sabes lo suficiente para poner una meta con número y fecha. Sin eso, los próximos tres meses los decide lo urgente.';
      },
      hecho: function (c) { return c.dossier('plan'); },
      ir: { pantalla: 'business', params: { seccion: 'plan' } }
    },

    /* ==================================================================
       LA RED DE SEGURIDAD

       Peso 1 y `cuando` siempre verdadero: existe para que el plan NUNCA
       salga con menos de tres tareas, pase lo que pase. Si esta aparece
       arriba en la lista de alguien, es que el catálogo se quedó corto para
       su caso y hay que mirarlo.
       ================================================================== */

    {
      id: 'repasa',
      familia: 'ruta',
      peso: 1,
      cuando: function () { return true; },
      titulo: function () { return 'Repasa una lección que ya hiciste'; },
      porque: function () {
        return 'Lo que se repasa una segunda vez a los pocos días es lo que se queda. Elige la que más te costó.';
      },
      hecho: function () { return false; },
      ir: { pantalla: 'home' }
    },

    {
      id: 'mira-numeros',
      familia: 'dinero',
      peso: 2,
      cuando: function () { return true; },
      titulo: function () { return 'Mira tus números en Mi Negocio'; },
      porque: function () {
        return 'Cinco minutos mirando lo que ya escribiste. Casi siempre aparece algo que no habías visto.';
      },
      hecho: function () { return false; },
      ir: { pantalla: 'business' }
    },

    {
      id: 'pregunta-chispa',
      familia: 'cliente',
      peso: 3,
      cuando: function () { return true; },
      titulo: function () { return 'Pregúntame lo que traes atorado'; },
      porque: function () {
        return 'Lo que llevas dando vueltas sin resolver. Si sé la respuesta te la doy, y si no, te digo qué falta para saberla.';
      },
      hecho: function () { return false; },
      ir: { pantalla: 'mentor' }
    }
  ];

  w.PLAN_SEMANAL = { TAREAS: TAREAS, FAMILIAS: FAMILIAS };
})(window);
