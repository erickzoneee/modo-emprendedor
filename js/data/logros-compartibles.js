/* ==========================================================================
   LOGROS COMPARTIBLES — el catálogo

   Qué se puede publicar, con qué datos y con qué intención. Es una lista
   blanca, no un volcado del perfil: cada logro declara exactamente qué campos
   del emprendimiento puede usar su visual, y el motor no lee ninguno más.

   Por qué así y no "usa lo que sepas del usuario": porque el perfil guarda
   presupuesto, experiencia, racha, XP, insignias y doce decisiones. Publicar
   cualquiera de esas cosas por accidente es una fuga, no una función.

   ETAPAS. La etapa no la decide el logro ni se le pregunta al usuario: se
   calcula con los datos que ya existen, y es acumulativa. Cada escalón exige
   todos los anteriores, así que un precio sin producto definido no sube a la
   etapa 4. Manda `Venture.knows(clave)`, que responde si ese dato existe.

   DOS EJES, NO UNO. El logro pone el tema del visual; la etapa pone la
   intención y el cierre. El mismo logro «producto definido» pide opiniones si
   el negocio está en validación y busca interesados si va más avanzado.
   ========================================================================== */
(function (w) {
  'use strict';

  /* ------------------------------ Etapas ------------------------------

     1  idea definida          → presentar
     2  mercado y problema     → conocer el mercado
     3  solución o producto    → conocer el mercado (medir interés)
     4  oferta preparada       → acercarse a clientes
     5  cómo va a vender       → acercarse a clientes

     `alguno` es un "o": la etapa 5 la desbloquea haber decidido dónde vende o
     cómo vende, indistintamente.
     -------------------------------------------------------------------- */

  var ETAPAS = [
    { n: 1, todos: ['idea'] },
    { n: 2, todos: ['idea', 'cliente', 'problema'] },
    { n: 3, todos: ['idea', 'cliente', 'problema', 'oferta'] },
    { n: 4, todos: ['idea', 'cliente', 'problema', 'oferta', 'precio'] },
    { n: 5, todos: ['idea', 'cliente', 'problema', 'oferta', 'precio'], alguno: ['canales', 'ventas'] }
  ];

  /* Qué persigue el visual en cada etapa. Agrupadas como se pidió: presentar,
     conocer el mercado, y acercarse a posibles clientes.

     FALTA UNA CUARTA, 'vender', Y FALTA A PROPÓSITO. Vender exige afirmar que
     el producto existe y que hay una forma real de pedirlo, y el modelo no
     tiene ni un campo de disponibilidad ni uno de contacto: lo único que
     desbloquea hoy la etapa 5 es haber decidido dónde publicar o cómo
     responder objeciones. Con eso no se puede escribir "ya puedes pedirlo" sin
     mentir, así que la etapa 5 cierra como la 4 —buscando interesados— hasta
     que exista el dato. Ese día vuelve 'vender' y solo entonces. */
  var INTENCION = {
    1: 'presentar',
    2: 'mercado',
    3: 'mercado',
    4: 'cliente',
    5: 'cliente'
  };

  /* ---------------------------- El catálogo ----------------------------

     `requiere`    claves que tienen que existir para poder publicar este logro.
                   Si falta una, el logro no se ofrece: no se inventa el dato ni
                   se le pregunta nada al usuario.
     `campos`      la lista blanca. El motor solo lee de aquí.
     `exige`       campos de esa lista que además tienen que traer texto. Es
                   para el tema del logro: «Identificaste el problema» sin el
                   problema deja la pregunta —«¿Te pasa lo mismo?»— colgando
                   sobre nada. Si falta, el logro no se ofrece siquiera.
     `disparadores` qué claves, al decidirse, hacen que ESTE logro sea el que se
                   ofrece. Por defecto la propia. `valor` es la excepción: el
                   beneficio se captura dentro de la misión del precio, así que
                   su disparador es `precio`.
     --------------------------------------------------------------------- */

  var LOGROS = [
    {
      id: 'idea',
      titulo: 'Definiste tu idea',
      requiere: ['idea'],
      disparadores: ['idea'],
      etapaMin: 1,
      campos: ['negocio', 'idea'],
      tema: 'la idea',
      chispa: 'bienvenida'
    },
    {
      id: 'nombre',
      titulo: 'Tu emprendimiento ya tiene nombre',
      requiere: ['idea', 'nombre'],
      disparadores: ['nombre'],
      etapaMin: 1,
      campos: ['negocio', 'idea'],
      tema: 'el nombre',
      chispa: 'celebrando'
    },
    {
      id: 'problema',
      titulo: 'Identificaste el problema',
      requiere: ['idea', 'problema'],
      disparadores: ['problema'],
      etapaMin: 2,
      campos: ['negocio', 'idea', 'problema', 'cliente'],
      exige: ['problema'],
      tema: 'el problema que resuelve',
      chispa: 'pensando'
    },
    {
      id: 'cliente',
      titulo: 'Definiste tu cliente ideal',
      requiere: ['idea', 'cliente'],
      disparadores: ['cliente'],
      etapaMin: 2,
      campos: ['negocio', 'idea', 'cliente'],
      tema: 'a quién ayuda',
      chispa: 'pensando'
    },
    {
      id: 'producto',
      titulo: 'Definiste tu producto',
      requiere: ['idea', 'oferta'],
      disparadores: ['oferta'],
      etapaMin: 3,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'el producto',
      chispa: 'celebrando'
    },
    {
      id: 'valor',
      titulo: 'Construiste tu propuesta de valor',
      /* `valor` es el campo "¿Qué gana o ahorra tu cliente?" de la misión del
         precio. Ya estaba capturado y guardado; simplemente no lo leía nadie.
         No se le pregunta nada nuevo al usuario. */
      requiere: ['idea', 'cliente', 'valor'],
      disparadores: ['precio'],
      etapaMin: 3,
      campos: ['negocio', 'producto', 'cliente', 'valor'],
      exige: ['valor'],
      tema: 'a quién ayuda y qué consigue',
      chispa: 'motivando'
    },
    {
      id: 'oferta',
      titulo: 'Preparaste tu oferta',
      /* `oferta-decidida` distingue haber TRABAJADO la oferta en una misión de
         tener texto en el núcleo. Sin esta distinción, el registro —que copia
         la idea en la oferta cuando el usuario no la separa— ya daba el logro
         por hecho, y completar la misión de oferta no producía ningún avance
         nuevo que celebrar. */
      requiere: ['idea', 'oferta', 'oferta-decidida'],
      disparadores: ['oferta'],
      etapaMin: 3,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'la oferta',
      chispa: 'motivando'
    },
    {
      id: 'precio',
      titulo: 'Definiste tu precio',
      requiere: ['idea', 'oferta', 'precio'],
      disparadores: ['precio'],
      etapaMin: 4,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'la oferta completa',
      chispa: 'cobrando'
    },
    {
      id: 'ventas',
      /* No dice "listo para vender". Lo que acredita esta clave es haber
         decidido dónde y cómo va a vender, no que el producto exista ni que
         haya forma de pedirlo. El título dice exactamente eso. */
      titulo: 'Ya sabes cómo vas a vender',
      requiere: ['idea', 'oferta', 'precio'],
      requiereAlguno: ['canales', 'ventas'],
      disparadores: ['canales', 'ventas'],
      etapaMin: 5,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'que ya está tomando forma',
      chispa: 'celebrando'
    }
  ];

  /* ------------------------- Preguntas y llamadas -------------------------

     Una por logro y por intención alcanzable. Se eligen, no se generan: así no
     hay forma de que salga una promesa que el usuario no hizo —disponibilidad,
     plazos, testimonios, cantidades— ni una pregunta genérica cuando había
     datos para una útil.

     Solo se declaran las combinaciones que la etapa mínima del logro permite:
     un logro de etapa 4 nunca puede salir con la intención de la etapa 1.
     `tools/check-catalogo.js` comprueba que no sobre ni falte ninguna.
     ------------------------------------------------------------------------ */

  var CIERRE = {
    idea: {
      presentar: '¿Qué te parece esta idea?',
      mercado:   '¿Te haría falta algo así?',
      cliente:   'Si te interesa, escríbeme y te cuento.'
    },
    nombre: {
      presentar: '¿Cómo te suena el nombre?',
      mercado:   '¿Qué te transmite este nombre?',
      cliente:   'Escríbeme si quieres conocerlo.'
    },
    problema: {
      mercado:   '¿Te pasa lo mismo?',
      cliente:   'Si te pasa, escríbeme y lo vemos.'
    },
    cliente: {
      mercado:   '¿Qué es lo más difícil de encontrar hoy?',
      cliente:   '¿Te gustaría que te avise cuando esté listo?'
    },
    producto: {
      mercado:   '¿Cuál probarías primero?',
      cliente:   'Si quieres conocerlo, escríbeme.'
    },
    valor: {
      mercado:   '¿Es eso lo que más te importaría?',
      cliente:   'Si te sirve, escríbeme y te paso los detalles.'
    },
    oferta: {
      mercado:   '¿Qué te haría decidirte?',
      cliente:   'Si quieres la información, escríbeme.'
    },
    precio: {
      cliente:   'Busco a las primeras personas interesadas. Escríbeme y te paso la información.'
    },
    ventas: {
      cliente:   'Estoy armando la lista de las primeras personas interesadas. Escríbeme y te aviso.'
    }
  };

  /* Cómo abre el mensaje según la intención. El logro pone el tema; esto pone
     el tono. Ninguna de las tres afirma que algo exista o esté a la venta. */
  var APERTURA = {
    presentar: 'Estoy construyendo',
    mercado:   'Estoy desarrollando',
    cliente:   'Estoy preparando'
  };

  /* Los tres estilos. Mismo contenido, distinta piel: no se le pregunta nada
     al usuario, se le enseñan los tres y elige.

     Los colores no son libres. `acento` pinta el rótulo del logro y el cierre
     —la pregunta, que es lo único que puede devolverle una respuesta al
     usuario—, así que tiene que leerse sobre el ARRANQUE del degradado, que es
     el punto más claro y el peor caso. Medido en contraste WCAG sobre
     `fondo[0]`, mínimo 3:1 para texto grande:

       personal     tinta 13,84:1   acento 4,81:1
       profesional  tinta 15,24:1   acento 9,10:1
       celebracion  tinta  4,84:1   acento 4,31:1

     Antes celebración salía a 2,18:1 en el cuerpo y 1,68:1 en el cierre: la
     pregunta era lo menos legible de toda la pieza, justo al revés. */
  var ESTILOS = [
    { id: 'personal',    nombre: 'Personal',    fondo: ['#FFF5EC', '#FFE3CC'], tinta: '#1B2740', acento: '#C2410C' },
    { id: 'profesional', nombre: 'Profesional', fondo: ['#12203A', '#1B3157'], tinta: '#F4F8FF', acento: '#FFB259' },
    { id: 'celebracion', nombre: 'Celebración', fondo: ['#C2410C', '#8A2B06'], tinta: '#FFF6EA', acento: '#FFE9A8' }
  ];

  w.LOGROS_COMPARTIBLES = {
    ETAPAS: ETAPAS, INTENCION: INTENCION, LOGROS: LOGROS,
    CIERRE: CIERRE, APERTURA: APERTURA, ESTILOS: ESTILOS
  };
})(window);
