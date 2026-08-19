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
   ========================================================================== */
(function (w) {
  'use strict';

  /* ------------------------------ Etapas ------------------------------

     1  idea definida          → presentar
     2  mercado y problema     → conocer el mercado
     3  solución o producto    → conocer el mercado (medir interés)
     4  oferta preparada       → acercarse a clientes
     5  listo para vender      → vender

     `alguno` es un "o": para vender hace falta una forma real de contacto,
     y eso vive en canales o en el proceso de ventas, indistintamente.
     -------------------------------------------------------------------- */

  var ETAPAS = [
    { n: 1, todos: ['idea'] },
    { n: 2, todos: ['idea', 'cliente', 'problema'] },
    { n: 3, todos: ['idea', 'cliente', 'problema', 'oferta'] },
    { n: 4, todos: ['idea', 'cliente', 'problema', 'oferta', 'precio'] },
    { n: 5, todos: ['idea', 'cliente', 'problema', 'oferta', 'precio'], alguno: ['canales', 'ventas'] }
  ];

  /* Qué persigue el visual en cada etapa. Agrupadas como se pidió: presentar,
     conocer el mercado, y acercarse a clientes o vender. */
  var INTENCION = {
    1: 'presentar',
    2: 'mercado',
    3: 'mercado',
    4: 'cliente',
    5: 'vender'
  };

  /* ---------------------------- El catálogo ----------------------------

     `requiere` son las claves que tienen que existir para que este logro se
     pueda publicar. Si falta una, el logro no se ofrece: no se inventa el
     dato ni se le pregunta nada al usuario.

     `campos` es la lista blanca. El motor solo lee de aquí.
     --------------------------------------------------------------------- */

  var LOGROS = [
    {
      id: 'idea',
      titulo: 'Definiste tu idea',
      requiere: ['idea'],
      etapaMin: 1,
      campos: ['negocio', 'idea', 'sector'],
      tema: 'la idea',
      chispa: 'bienvenida'
    },
    {
      id: 'problema',
      titulo: 'Identificaste el problema',
      requiere: ['idea', 'problema'],
      etapaMin: 2,
      campos: ['negocio', 'idea', 'problema', 'cliente'],
      tema: 'el problema que resuelve',
      chispa: 'pensando'
    },
    {
      id: 'cliente',
      titulo: 'Definiste tu cliente ideal',
      requiere: ['idea', 'cliente'],
      etapaMin: 2,
      campos: ['negocio', 'idea', 'cliente'],
      tema: 'a quién ayuda',
      chispa: 'pensando'
    },
    {
      id: 'oferta',
      titulo: 'Definiste tu producto',
      requiere: ['idea', 'oferta'],
      etapaMin: 3,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'el producto',
      chispa: 'explicando'
    },
    {
      id: 'precio',
      titulo: 'Preparaste tu oferta',
      requiere: ['idea', 'oferta', 'precio'],
      etapaMin: 4,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'la oferta',
      chispa: 'motivando'
    },
    {
      id: 'ventas',
      titulo: 'Listo para vender',
      requiere: ['idea', 'oferta', 'precio'],
      requiereAlguno: ['canales', 'ventas'],
      etapaMin: 5,
      campos: ['negocio', 'producto', 'cliente'],
      tema: 'que ya se puede pedir',
      chispa: 'celebrando'
    }
  ];

  /* ------------------------- Preguntas y llamadas -------------------------

     Una por logro y por intención. Se eligen, no se generan: así no hay forma
     de que salga una promesa que el usuario no hizo —disponibilidad, plazos,
     testimonios— ni una pregunta genérica cuando había datos para una útil.
     ------------------------------------------------------------------------ */

  var CIERRE = {
    idea: {
      presentar: '¿Qué te parece esta idea?',
      mercado:   '¿Te suena útil algo así?',
      cliente:   'Si te interesa, escríbeme.',
      vender:    'Escríbeme y te cuento.'
    },
    problema: {
      mercado:   '¿Te pasa lo mismo?',
      presentar: '¿Te pasa lo mismo?',
      cliente:   'Si te pasa, escríbeme y lo vemos.',
      vender:    'Si te pasa, escríbeme y lo resolvemos.'
    },
    cliente: {
      mercado:   '¿Qué es lo más difícil de encontrar hoy?',
      presentar: '¿Qué te haría falta a ti?',
      cliente:   '¿Te gustaría que te avise cuando esté?',
      vender:    'Escríbeme y te paso los detalles.'
    },
    oferta: {
      mercado:   '¿Cuál probarías primero?',
      presentar: '¿Cuál te llama más la atención?',
      cliente:   'Si quieres conocerlo, escríbeme.',
      vender:    'Escríbeme para pedirlo.'
    },
    precio: {
      cliente:   'Busco a las primeras personas interesadas. Escríbeme y te paso la información.',
      vender:    'Ya puedes pedirlo. Escríbeme y lo vemos.',
      mercado:   '¿Pagarías por algo así?',
      presentar: '¿Qué te parece?'
    },
    ventas: {
      vender:    'Ya puedes hacer tu pedido. Escríbeme.',
      cliente:   'Escríbeme y te paso los detalles.',
      mercado:   '¿Te interesaría probarlo?',
      presentar: '¿Qué te parece?'
    }
  };

  /* Cómo abre el mensaje según la intención. El logro pone el tema; esto pone
     el tono. */
  var APERTURA = {
    presentar: 'Estoy construyendo',
    mercado:   'Estoy desarrollando',
    cliente:   'Estoy preparando',
    vender:    'Ya está listo:'
  };

  /* Los tres estilos. Mismo contenido, distinta piel: no se le pregunta nada
     al usuario, se le enseñan los tres y elige. */
  var ESTILOS = [
    { id: 'personal',     nombre: 'Personal',   fondo: ['#FFF5EC', '#FFE3CC'], tinta: '#1B2740', acento: '#FF6B1A' },
    { id: 'profesional',  nombre: 'Profesional', fondo: ['#12203A', '#1B3157'], tinta: '#F4F8FF', acento: '#FFB259' },
    { id: 'celebracion',  nombre: 'Celebración', fondo: ['#FF8B3A', '#EC5D0C'], tinta: '#FFF6EA', acento: '#FFD766' }
  ];

  w.LOGROS_COMPARTIBLES = {
    ETAPAS: ETAPAS, INTENCION: INTENCION, LOGROS: LOGROS,
    CIERRE: CIERRE, APERTURA: APERTURA, ESTILOS: ESTILOS
  };
})(window);
