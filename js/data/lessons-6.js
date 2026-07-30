/* ==========================================================================
   NIVEL 6 — CRECE · Haces marketing y aumentas tus ventas
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 6.1 */
{
  id: 'n6-01', level: 6, icon: '🧲', title: 'Atención, confianza, acción', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Nadie compra en el primer contacto',
    body: [
      'Todo marketing recorre tres etapas: **atención** (que te vean), **confianza** (que te crean) y **acción** (que te compren). Saltarte la del medio es el error más común.',
      'Si publicas solo promociones, estás pidiendo acción sin haber construido confianza. Por eso “vender” en redes sin contexto casi nunca funciona.'
    ],
    keys: [
      'Atención: algo que detenga el scroll o llame en la calle.',
      'Confianza: pruebas, procesos, clientes reales, respuestas.',
      'Acción: un pedido claro y fácil.'
    ]
  },
  cas: {
    emoji: '🎬', title: 'El video del proceso',
    text: 'Publicaba solo fotos del producto terminado con el precio: poca respuesta. Empezó a publicar videos cortos del proceso: la pieza rota, el modelado, la impresión y el cliente contento. Mismo producto, mismo precio, cinco veces más mensajes. El video generaba confianza, no solo atención.'
  },
  steps: [
    { type: 'match', q: 'Empareja cada contenido con su etapa',
      pairs: [
        ['Video del antes y después de una reparación', 'Atención'],
        ['Reseña de un cliente con foto', 'Confianza'],
        ['“Quedan 3 lugares esta semana, escríbeme”', 'Acción']
      ],
      explain: 'Tu contenido debe cubrir las tres etapas, no solo una.' },

    { type: 'quiz', q: 'Publicas 10 veces al mes. ¿Cómo repartes el contenido?',
      opts: [
        { t: '10 promociones de venta', ok: false, why: 'La audiencia se satura y deja de verte. Pides acción sin dar razones para confiar.' },
        { t: '3 de atención, 5 de confianza, 2 de acción', ok: true, why: 'La mayoría del contenido construye confianza. La venta llega sola cuando ya te creen.' },
        { t: '10 de contenido bonito sin mencionar qué vendes', ok: false, why: 'Ganas seguidores, no clientes. Nadie sabe qué ofreces.' },
        { t: '5 memes y 5 frases motivacionales', ok: false, why: 'Entretiene pero no dice nada de ti ni de lo que resuelves.' }
      ],
      explain: 'Regla práctica 3-5-2: atención, confianza, acción.' },

    { type: 'multi', q: '¿Qué genera confianza de verdad? (elige todas)',
      opts: [
        { t: 'Mostrar tu proceso de trabajo', ok: true },
        { t: 'Reseñas con nombre y foto', ok: true },
        { t: 'Decir “somos los mejores”', ok: false },
        { t: 'Responder dudas públicamente', ok: true },
        { t: 'Mostrar un trabajo que salió mal y cómo lo resolviste', ok: true },
        { t: 'Muchos seguidores', ok: false }
      ],
      explain: 'La confianza se construye con evidencia, no con adjetivos.' },

    { type: 'fill', q: 'Completa la ruta que sigue todo cliente',
      text: 'Primero necesito que ___ , después que ___ , y solo entonces que ___ .',
      bank: ['me vea', 'me crea', 'me compre', 'me siga', 'me felicite', 'me recuerde'],
      answer: ['me vea', 'me crea', 'me compre'],
      explain: 'Atención, confianza y acción. Saltarse la del medio es pedirle a un desconocido que te dé su dinero.' },

    { type: 'sim', q: 'Tienes 3 horas a la semana para marketing. ¿En qué las usas?',
      opts: [
        { t: 'Diseñar publicaciones muy bonitas', ok: false,
          effects: { clientes: 0, tiempo: -3, reputacion: 1 },
          why: 'La estética ayuda poco si el mensaje no muestra evidencia ni pide acción.' },
        { t: 'Grabar 3 videos cortos del proceso real y responder comentarios', ok: true,
          effects: { clientes: 3, tiempo: -1, reputacion: 3 },
          why: 'Contenido de confianza + conversación. Es lo que más convierte con menos esfuerzo.' },
        { t: 'Publicar la misma promoción todos los días', ok: false,
          effects: { clientes: -1, tiempo: -1, reputacion: -2 },
          why: 'Cansas a la audiencia y te vuelves invisible.' }
      ],
      explain: 'Proceso real + conversación vence a diseño perfecto.' },

    { type: 'write', q: 'Diseña tu semana de contenido',
      sub: 'Una publicación de atención, una de confianza y una de acción.',
      ph: 'Lunes: video de una pieza rota siendo reparada. Miércoles: reseña de Luis con foto. Viernes: quedan 3 lugares…',
      minWords: 15,
      hints: ['La de confianza debe tener evidencia.', 'La de acción debe pedir algo concreto.'] }
  ],
  mission: {
    id: 'm6-01', title: 'Publica una de confianza', dossier: null,
    brief: 'Hoy publica algo que genere confianza: tu proceso, una reseña real o un problema resuelto.',
    fields: [
      { key: 'que', label: '¿Qué publicaste?', type: 'text', ph: 'Video del proceso de una reparación' },
      { key: 'donde', label: '¿Dónde?', type: 'text', ph: 'Grupo de FB + estado de WhatsApp' },
      { key: 'resultado', label: '¿Qué respuesta tuvo?', type: 'text', ph: '3 mensajes preguntando precio' }
    ],
    rubric: [
      { id: 'a', label: 'El contenido muestra evidencia', check: 'concrete' },
      { id: 'b', label: 'Lo publicaste en un canal real', check: 'filled' },
      { id: 'c', label: 'Mediste la respuesta', check: 'filled' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 6.2 */
{
  id: 'n6-02', level: 6, icon: '📸', title: 'Contenido que sí vende', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Cuatro formatos que funcionan siempre',
    body: [
      'No necesitas ser creador de contenido. Necesitas repetir cuatro formatos: **antes y después**, **proceso**, **cliente hablando** y **respuesta a una duda frecuente**.',
      'Los cuatro tienen algo en común: muestran realidad, no publicidad. Y todos se pueden grabar con el teléfono en menos de dos minutos.'
    ],
    keys: [
      'Antes y después: el formato que más vende en negocios de producto o servicio.',
      'Cada duda frecuente es un contenido: si te la preguntan, publícala.',
      'Publica el trabajo real, no el ideal.'
    ]
  },
  cas: {
    emoji: '❓', title: 'Las preguntas como contenido',
    text: 'Anotó las 12 preguntas que más le hacían y grabó un video de 30 segundos para cada una. Publicó una por semana durante tres meses. Además de traerle clientes, redujo a la mitad el tiempo que pasaba respondiendo lo mismo por mensaje.'
  },
  steps: [
    { type: 'multi', q: '¿Qué formatos funcionan sin necesidad de producción? (elige todas)',
      opts: [
        { t: 'Antes y después', ok: true },
        { t: 'Proceso paso a paso', ok: true },
        { t: 'Cliente contando su experiencia', ok: true },
        { t: 'Respuesta a una duda frecuente', ok: true },
        { t: 'Frases motivacionales sobre emprender', ok: false }
      ],
      explain: 'Los cuatro primeros muestran tu trabajo. El último no dice nada de ti.' },

    { type: 'quiz', q: '¿Cuál es el mejor primer segundo de un video?',
      opts: [
        { t: '“Hola, bienvenidos a mi canal”', ok: false, why: 'Nadie se queda por una bienvenida. Pierdes al 80% en 2 segundos.' },
        { t: 'Mostrar la pieza rota mientras dices “esto ya no se fabrica”', ok: true, why: 'Empiezas por el problema visual. Genera curiosidad inmediata.' },
        { t: 'Un logo animado de 5 segundos', ok: false, why: 'Cinco segundos de logo son cinco segundos de gente saliéndose.' },
        { t: 'Explicar tu trayectoria', ok: false, why: 'A nadie le importa tu historia antes de que le importes tú.' }
      ],
      explain: 'Empieza por el problema o el resultado. Nunca por la presentación.' },

    { type: 'order', q: 'Ordena la estructura de un video corto que vende',
      items: [
        'Muestra el problema en el primer segundo',
        'Enseña el proceso en pocos cortes',
        'Muestra el resultado final',
        'Di para quién es y cuánto tarda',
        'Cierra con una acción: “escríbeme la palabra X”'
      ],
      explain: 'Problema → proceso → resultado → para quién → acción. Menos de 40 segundos.' },

    { type: 'sim', q: 'No tienes tiempo para grabar contenido nuevo cada semana.',
      opts: [
        { t: 'Dejar de publicar hasta tener tiempo', ok: false,
          effects: { clientes: -2, tiempo: 1, reputacion: -1 },
          why: 'La constancia importa más que la cantidad. Desaparecer te borra de la mente del cliente.' },
        { t: 'Grabar 6 videos en una sola sesión de 1 hora y publicarlos durante 6 semanas', ok: true,
          effects: { clientes: 3, tiempo: 2, reputacion: 2 },
          why: 'Producción por lotes: una hora al mes resuelve seis semanas de contenido.' },
        { t: 'Pagar a alguien para que invente contenido', ok: false,
          effects: { dinero: -2, clientes: 0, reputacion: 0 },
          why: 'El contenido genérico de terceros no muestra tu trabajo real ni genera confianza.' }
      ],
      explain: 'Graba por lotes. Es la única forma de sostenerlo con poco tiempo.' },

    { type: 'write', q: 'Lista las 5 preguntas que más te hacen',
      sub: 'Cada una es un contenido listo para grabar.',
      ph: '1. ¿Cuánto tarda?\n2. ¿Aguanta el agua?\n3. ¿Puedes copiar una pieza rota?…',
      minWords: 10,
      hints: ['Piensa en tus últimos 10 mensajes de clientes.'] }
  ],
  mission: {
    id: 'm6-02', title: 'Graba 3 videos en una sesión', dossier: null,
    brief: 'En una hora, graba tres videos cortos: un antes y después, un proceso y una duda frecuente.',
    fields: [
      { key: 'v1', label: 'Video 1 (antes y después)', type: 'text', ph: 'Engrane roto → engrane nuevo' },
      { key: 'v2', label: 'Video 2 (proceso)', type: 'text', ph: 'Cómo mido una pieza rota' },
      { key: 'v3', label: 'Video 3 (duda frecuente)', type: 'text', ph: '¿Aguanta el calor?' },
      { key: 'calendario', label: '¿Cuándo los vas a publicar?', type: 'text', ph: 'Lunes, miércoles y viernes' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste tres contenidos concretos', check: 'filled' },
      { id: 'b', label: 'Cubren formatos distintos', check: 'concrete' },
      { id: 'c', label: 'Tienen fecha de publicación', check: 'filled' }
    ],
    reward: { xp: 50, coins: 35 }
  }
},

/* ------------------------------------------------------------------ 6.3 */
{
  id: 'n6-03', level: 6, icon: '💸', title: 'Publicidad sin quemar dinero', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'La publicidad amplifica lo que ya funciona',
    body: [
      'La publicidad no arregla una oferta que no vende: **la amplifica**. Si tu mensaje no convierte gratis, pagado convertirá igual de mal, solo que más caro.',
      'Antes de invertir, necesitas dos números: **cuánto te cuesta conseguir un cliente (CAC)** y **cuánto te deja ese cliente (margen)**. Si el CAC es mayor que el margen, cada venta te empobrece.'
    ],
    keys: [
      'CAC = dinero invertido ÷ clientes conseguidos.',
      'Si CAC > margen por cliente, cada venta te cuesta dinero.',
      'Prueba con presupuestos pequeños y mide siempre.'
    ]
  },
  cas: {
    emoji: '📉', title: 'Los $5,000 quemados',
    text: 'Invirtió $5,000 en anuncios y consiguió 10 clientes: CAC de $500. Su margen por cliente era $90. Perdió $4,100 y creyó que “la publicidad no funciona”. El problema no era la publicidad: era anunciar una oferta con margen insuficiente a un público equivocado.'
  },
  steps: [
    { type: 'quiz', q: 'Invertiste $2,000 y conseguiste 8 clientes. Tu margen por cliente es $180. ¿Vale la pena?',
      opts: [
        { t: 'Sí, conseguí 8 clientes', ok: false, why: 'El número de clientes no importa si cada uno te cuesta más de lo que te deja.' },
        { t: 'No: CAC $250 contra margen $180, pierdo $70 por cliente', ok: true, why: '2,000 ÷ 8 = $250 de CAC. Cada venta te cuesta $70. Hay que ajustar antes de escalar.' },
        { t: 'Sí, porque son clientes nuevos', ok: false, why: 'Solo si vuelven a comprar varias veces se justificaría. Hay que medirlo, no suponerlo.' },
        { t: 'Falta información', ok: false, why: 'Con inversión, clientes y margen ya puedes decidir.' }
      ],
      explain: 'CAC = inversión ÷ clientes. Compáralo siempre contra tu margen.' },

    { type: 'order', q: 'Ordena los pasos antes de invertir en publicidad',
      items: [
        'Comprueba que tu oferta ya vende sin pagar',
        'Calcula tu margen por cliente',
        'Define un presupuesto de prueba pequeño',
        'Prueba dos mensajes distintos',
        'Mide el CAC y compáralo con el margen',
        'Escala solo el que funcione'
      ],
      explain: 'Nunca escales algo que no probaste en pequeño.' },

    { type: 'multi', q: '¿Cuándo NO deberías pagar publicidad? (elige todas)',
      opts: [
        { t: 'Cuando tu oferta aún no ha vendido nada de forma orgánica', ok: true },
        { t: 'Cuando no sabes cuál es tu margen', ok: true },
        { t: 'Cuando no puedes atender más pedidos', ok: true },
        { t: 'Cuando tienes un mensaje que ya convierte', ok: false },
        { t: 'Cuando no puedes medir de dónde llegan los clientes', ok: true }
      ],
      explain: 'Publicidad sin oferta probada, sin margen conocido, sin capacidad o sin medición es dinero quemado.' },

    { type: 'slider', q: '¿Con cuánto presupuesto diario empiezas a probar?',
      min: 20, max: 1000, step: 20, value: 500, unit: '$/día',
      best: [40, 150],
      bands: [
        { max: 39, label: 'Muy poco', tone: 'warn', msg: 'Con menos de $40 diarios tardarás semanas en tener datos confiables.' },
        { max: 150, label: 'Correcto para probar', tone: 'ok', msg: '$40-$150 diarios durante 5-7 días te dan datos suficientes sin arriesgar mucho.' },
        { max: 1000, label: 'Demasiado para empezar', tone: 'bad', msg: 'Presupuestos altos sin datos previos es la forma más rápida de perder dinero.' }
      ],
      explain: 'Prueba pequeño, mide, y solo entonces sube el presupuesto.' },

    { type: 'write', q: 'Calcula tu CAC máximo permitido',
      sub: 'Tu margen por cliente dividido entre 2 o 3 es un CAC objetivo prudente.',
      ph: 'Mi margen es $180, así que mi CAC máximo debería ser $60-$90 para que valga la pena…',
      minWords: 10,
      hints: ['¿Cuánto te deja cada cliente?', '¿Compra más de una vez?'] }
  ],
  mission: {
    id: 'm6-03', title: 'Tu prueba de publicidad', dossier: null,
    brief: 'Solo si tu oferta ya vende sin pagar: haz una prueba pequeña de 5 días con dos mensajes distintos.',
    fields: [
      { key: 'margen', label: 'Tu margen por cliente ($)', type: 'num', ph: '180' },
      { key: 'presupuesto', label: 'Presupuesto diario de prueba ($)', type: 'num', ph: '60' },
      { key: 'mensajes', label: 'Los dos mensajes que vas a probar', type: 'area', ph: 'A: enfocado en el producto\nB: enfocado en el problema' },
      { key: 'cac', label: 'CAC máximo que aceptarás ($)', type: 'num', ph: '70' }
    ],
    rubric: [
      { id: 'a', label: 'Conoces tu margen', check: 'number' },
      { id: 'b', label: 'Definiste un presupuesto de prueba prudente', check: 'number' },
      { id: 'c', label: 'Vas a probar dos mensajes', check: 'filled' },
      { id: 'd', label: 'Fijaste un CAC máximo', check: 'number' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 6.4 */
{
  id: 'n6-04', level: 6, icon: '⭐', title: 'Reseñas, referidos y prueba social', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Que otros hablen bien de ti vale más que cualquier anuncio',
    body: [
      'La prueba social es el marketing más barato y más efectivo. Y casi nadie la pide **en el momento correcto**: justo después de entregar, cuando la satisfacción está en su punto más alto.',
      'Un referido cuesta cero, llega predispuesto a confiar y regatea menos. Un cliente contento que no te recomienda es un canal desperdiciado.'
    ],
    keys: [
      'Pide la reseña el mismo día de la entrega.',
      'Facilita el trabajo: da un texto sugerido o preguntas guía.',
      'Premia al que refiere, no solo al referido.'
    ]
  },
  cas: {
    emoji: '🗣️', title: 'El pedido simple que multiplicó ventas',
    text: 'Después de cada entrega mandaba: “¿Me ayudas con una foto y dos líneas de cómo te fue? Con eso ayudo a otros a decidirse.” El 60% respondía. En tres meses acumuló 40 reseñas con foto y su tasa de cierre subió del 20% al 45%.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es el mejor momento para pedir una reseña?',
      opts: [
        { t: 'Un mes después, cuando ya lo usó bastante', ok: false, why: 'Para entonces la emoción bajó y la mayoría lo pospone indefinidamente.' },
        { t: 'El mismo día de la entrega', ok: true, why: 'La satisfacción está en su punto más alto. Es cuando más gente responde.' },
        { t: 'Cuando vuelva a comprar', ok: false, why: 'Muchos no vuelven precisamente porque no mantuviste el contacto.' },
        { t: 'Nunca, es incómodo pedirlo', ok: false, why: 'Es incómodo solo la primera vez. Pedir bien es parte del trabajo.' }
      ],
      explain: 'Momento de máxima satisfacción = momento de pedir.' },

    { type: 'multi', q: '¿Qué hace que una reseña sea creíble? (elige todas)',
      opts: [
        { t: 'Nombre real y foto del producto en uso', ok: true },
        { t: 'Menciona un problema específico que se resolvió', ok: true },
        { t: 'Es genérica: “excelente servicio”', ok: false },
        { t: 'Dice cuánto tiempo tardó', ok: true },
        { t: 'Incluye alguna duda inicial que tuvo', ok: true }
      ],
      explain: 'Las reseñas con detalles y hasta con dudas iniciales son mucho más creíbles que las perfectas.' },

    { type: 'sim', q: '¿Cómo pides un referido?',
      opts: [
        { t: '“Si conoces a alguien, recomiéndame”', ok: false,
          effects: { clientes: 0, reputacion: 0, dinero: 0 },
          why: 'Demasiado vago. Nadie sabe a quién pensar y se olvida en 5 segundos.' },
        { t: '“¿Conoces a alguien más con una máquina vieja que necesite repuestos? Le doy 15% por venir de tu parte”', ok: true,
          effects: { clientes: 3, reputacion: 2, dinero: 1 },
          why: 'Específico (le das un perfil concreto que recordar) y con incentivo para ambos.' },
        { t: 'No pedir nada y esperar', ok: false,
          effects: { clientes: 0, reputacion: 0, dinero: 0 },
          why: 'La mayoría de los clientes felices no recomienda simplemente porque nadie se lo pidió.' }
      ],
      explain: 'Pide referidos con un perfil concreto, no en abstracto.' },

    { type: 'order', q: 'Ordena el proceso de posventa',
      items: [
        'Entrega y confirma que todo está bien',
        'A las 24 h pregunta cómo le fue',
        'Pide reseña con foto y texto sugerido',
        'Pide un referido con perfil concreto',
        'Guarda la reseña en tu carpeta de pruebas'
      ],
      explain: 'La posventa es un proceso, no un impulso.' },

    { type: 'write', q: 'Escribe tu mensaje para pedir reseña',
      sub: 'Corto, agradecido, con instrucciones claras y fácil de responder.',
      ph: '¡Gracias! ¿Me ayudas con una foto y dos líneas de cómo te fue? Así ayudo a otros a decidirse…',
      minWords: 12,
      hints: ['Explica para qué la usarás.', 'Facilita: da preguntas guía.'] }
  ],
  mission: {
    id: 'm6-04', title: 'Consigue 3 reseñas', dossier: 'clientes',
    brief: 'Escribe a tus últimos clientes y pide reseña. Guarda cada una: son tu mejor herramienta de venta.',
    fields: [
      { key: 'mensaje', label: 'El mensaje que enviaste', type: 'area', ph: '' },
      { key: 'resenas', label: 'Las reseñas que recibiste', type: 'area', ph: 'Luis: “Me salvó la lavadora, llegó en 2 días”…' },
      { key: 'referidos', label: '¿Cuántos referidos conseguiste?', type: 'num', ph: '1' }
    ],
    rubric: [
      { id: 'a', label: 'Pediste a clientes reales', check: 'filled' },
      { id: 'b', label: 'Conseguiste al menos una reseña con detalle', check: 'concrete' },
      { id: 'c', label: 'Pediste referidos con perfil concreto', check: 'filled' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 6.5 */
{
  id: 'n6-05', level: 6, icon: '⬆️', title: 'Sube tu ticket promedio', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Vender más a quien ya te compra',
    body: [
      'Conseguir un cliente nuevo cuesta entre 5 y 7 veces más que venderle a uno existente. Por eso la vía más rápida de crecer es **subir cuánto gasta cada cliente en cada compra**.',
      'Tres palancas: **complemento** (algo que va con lo que compró), **versión superior** (más valor por más precio) y **paquete** (varios productos con un precio conjunto atractivo).'
    ],
    keys: [
      'Ofrece el complemento en el momento de la compra, no después.',
      'El paquete debe ahorrar dinero al cliente y darte más margen total.',
      'Nunca ofrezcas más de dos opciones adicionales: confunde.'
    ]
  },
  cas: {
    emoji: '🎒', title: 'De $220 a $390 sin clientes nuevos',
    text: 'Vendía placas a $220. Agregó dos cosas: un llavero a juego por $90 y grabado adicional por $80. Sin conseguir un solo cliente nuevo, su ticket promedio pasó de $220 a $390. Mismo esfuerzo de venta, 77% más ingreso.'
  },
  steps: [
    { type: 'match', q: 'Empareja la palanca con su ejemplo',
      pairs: [
        ['Complemento', 'Llavero a juego con la placa'],
        ['Versión superior', 'Material reforzado con garantía de 2 años'],
        ['Paquete', 'Placa + collar + llavero por un precio conjunto']
      ],
      explain: 'Tres formas de subir el ticket sin buscar más clientes.' },

    { type: 'quiz', q: '¿Cuál es el mejor momento para ofrecer un complemento?',
      opts: [
        { t: 'Una semana después de la compra', ok: false, why: 'El momento de compra ya pasó. La disposición a gastar cae drásticamente.' },
        { t: 'Justo cuando el cliente ya decidió comprar', ok: true, why: 'La decisión difícil ya está tomada. Agregar algo pequeño cuesta poco esfuerzo mental.' },
        { t: 'Al primer contacto, antes de que decida', ok: false, why: 'Complica la decisión inicial y puede espantar la venta principal.' },
        { t: 'Nunca, se ve mal', ok: false, why: 'Ofrecer algo útil no es abusar. Lo mal visto es insistir cuando dicen que no.' }
      ],
      explain: 'Ofrece el complemento después del sí, nunca antes.' },

    { type: 'multi', q: '¿Qué hace bueno a un complemento? (elige todas)',
      opts: [
        { t: 'Cuesta menos del 40% del producto principal', ok: true },
        { t: 'Se usa junto con lo que compró', ok: true },
        { t: 'Tiene buen margen para ti', ok: true },
        { t: 'Es completamente distinto y sin relación', ok: false },
        { t: 'Se decide en 5 segundos', ok: true }
      ],
      explain: 'Barato en comparación, relacionado, rentable y de decisión rápida.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Ofrecer un complemento antes de que el cliente decida comprar aumenta las ventas.',
      ok: false,
      explain: 'Al revés: complica la decisión principal y puede espantar la venta. El complemento se ofrece justo después del sí, cuando la decisión difícil ya está tomada.' },

    { type: 'sim', q: 'Tienes 40 clientes al mes con ticket de $220. Quieres crecer 30%.',
      opts: [
        { t: 'Conseguir 12 clientes nuevos', ok: false,
          effects: { clientes: 2, tiempo: -3, dinero: 1 },
          why: 'Se puede, pero implica más publicidad, más tiempo y más costo de adquisición.' },
        { t: 'Subir el ticket promedio de $220 a $290 con un complemento', ok: true,
          effects: { dinero: 3, tiempo: 1, clientes: 1 },
          why: 'Mismo esfuerzo de venta, mismo número de clientes, 30% más ingreso.' },
        { t: 'Bajar el precio para vender más volumen', ok: false,
          effects: { dinero: -2, tiempo: -2, clientes: 2 },
          why: 'Más trabajo, menos margen. El camino contrario al que quieres.' }
      ],
      explain: 'Antes de buscar clientes nuevos, exprime el valor de los que ya tienes.' },

    { type: 'write', q: 'Diseña tu complemento y tu paquete',
      sub: 'Uno que cueste poco, vaya con tu producto y deje buen margen.',
      ph: 'Complemento: llavero a juego $90 (me cuesta $25). Paquete: placa + llavero + collar por $450 en vez de $520…',
      minWords: 15,
      hints: ['¿Qué usa el cliente junto con tu producto?', '¿Qué te cuesta poco y vale mucho para él?'] }
  ],
  mission: {
    id: 'm6-05', title: 'Lanza tu complemento', dossier: 'oferta',
    brief: 'Crea un complemento y ofrécelo a los próximos 5 clientes. Mide cuántos lo aceptan.',
    fields: [
      { key: 'complemento', label: 'Tu complemento y su precio', type: 'text', ph: 'Llavero a juego — $90' },
      { key: 'costo', label: '¿Cuánto te cuesta producirlo? ($)', type: 'num', ph: '25' },
      { key: 'paquete', label: 'Tu paquete y su precio', type: 'text', ph: 'Placa + llavero + collar — $450' },
      { key: 'aceptacion', label: '¿Cuántos de 5 lo aceptaron?', type: 'num', ph: '3' }
    ],
    rubric: [
      { id: 'a', label: 'El complemento tiene precio y costo', check: 'numbers' },
      { id: 'b', label: 'Su margen es positivo', check: 'margin' },
      { id: 'c', label: 'Lo ofreciste a clientes reales', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 6.6 */
{
  id: 'n6-06', level: 6, icon: '🔁', title: 'Que vuelvan a comprar', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'El negocio real está en la segunda compra',
    body: [
      'Un cliente que compra una vez es una venta. Un cliente que compra cinco veces es un negocio. La diferencia casi nunca es el producto: es **si le diste una razón y un recordatorio para volver**.',
      'Herramientas: recordatorio en el momento justo, programa de recompra, novedades para clientes existentes y contacto humano periódico.'
    ],
    keys: [
      'Calcula cada cuánto necesitan volver y escríbeles justo antes.',
      'Un cliente recurrente vale entre 3 y 10 veces más que uno nuevo.',
      'Guarda la lista de clientes: es tu activo más valioso.'
    ]
  },
  cas: {
    emoji: '📅', title: 'El recordatorio de los 90 días',
    text: 'Los clientes de mantenimiento volvían cada 4 o 5 meses cuando se acordaban. Empezó a escribirles a los 90 días: “Ya toca tu revisión, ¿te agendo el jueves?” La frecuencia pasó de 2.4 a 3.6 veces al año. Con los mismos clientes, 50% más ingresos.'
  },
  steps: [
    { type: 'quiz', q: 'Vendes algo que se consume cada 3 meses. ¿Cuándo escribes al cliente?',
      opts: [
        { t: 'Cuando él se acuerde', ok: false, why: 'Se acordará tarde o le comprará a quien sí le escribió antes.' },
        { t: 'A los 75-80 días, antes de que se le acabe', ok: true, why: 'Llegas justo cuando lo necesita y antes que la competencia.' },
        { t: 'Cada semana para no olvidarme', ok: false, why: 'Contacto excesivo. Te bloquean o te ignoran.' },
        { t: 'Al año, para no molestar', ok: false, why: 'Perdiste tres compras en el camino.' }
      ],
      explain: 'Escribe justo antes de que lo necesite. Ni antes ni después.' },

    { type: 'multi', q: '¿Qué aumenta la recompra? (elige todas)',
      opts: [
        { t: 'Recordatorio en el momento justo', ok: true },
        { t: 'Guardar sus preferencias y datos', ok: true },
        { t: 'Un beneficio por ser cliente frecuente', ok: true },
        { t: 'Desaparecer después de la venta', ok: false },
        { t: 'Avisarle primero de las novedades', ok: true }
      ],
      explain: 'Memoria, oportunidad y trato preferente. Nada de esto cuesta dinero.' },

    { type: 'order', q: 'Ordena el sistema de recompra',
      items: [
        'Guarda los datos de cada cliente y qué compró',
        'Calcula cada cuánto lo necesita',
        'Programa un recordatorio antes de esa fecha',
        'Escríbele con una propuesta concreta, no un “hola”',
        'Registra si compró y ajusta la frecuencia'
      ],
      explain: 'Un sistema simple en una hoja de cálculo hace la mayor parte del trabajo.' },

    { type: 'sim', q: 'Tienes 60 clientes anteriores y ninguna venta esta semana.',
      opts: [
        { t: 'Buscar clientes nuevos en redes', ok: false,
          effects: { clientes: 1, tiempo: -3, dinero: -1 },
          why: 'El camino más caro y lento teniendo 60 personas que ya te compraron.' },
        { t: 'Escribir a los 20 que compraron hace más de 3 meses con una propuesta concreta', ok: true,
          effects: { clientes: 3, tiempo: -1, dinero: 3 },
          why: 'Ya te conocen y confían. La tasa de respuesta es muchísimo mayor.' },
        { t: 'Hacer una promoción general con descuento', ok: false,
          effects: { dinero: -2, clientes: 2, reputacion: 0 },
          why: 'Regalas margen a gente que quizá hubiera comprado a precio completo.' }
      ],
      explain: 'Tu lista de clientes anteriores es la fuente de ventas más rentable que tienes.' },

    { type: 'write', q: 'Diseña tu recordatorio de recompra',
      sub: '¿Cada cuánto lo necesitan y qué les vas a escribir?',
      ph: 'Cada 90 días: “Hola Luis, ya toca cambiar la pieza. ¿Te la preparo para el jueves?”',
      minWords: 12,
      hints: ['¿Cada cuánto se consume o se desgasta?', 'Propón fecha, no preguntes si quiere.'] }
  ],
  mission: {
    id: 'm6-06', title: 'Reactiva tu lista', dossier: 'clientes',
    brief: 'Haz la lista de todos tus clientes anteriores y escribe a los que ya toca. Aquí suele haber dinero olvidado.',
    fields: [
      { key: 'total', label: '¿Cuántos clientes anteriores tienes?', type: 'num', ph: '60' },
      { key: 'frecuencia', label: '¿Cada cuánto necesitan volver?', type: 'text', ph: 'Cada 3 meses' },
      { key: 'mensaje', label: 'Tu mensaje de reactivación', type: 'area', ph: '' },
      { key: 'respuestas', label: '¿Cuántos respondieron?', type: 'num', ph: '7' }
    ],
    rubric: [
      { id: 'a', label: 'Tienes una lista de clientes con número', check: 'number' },
      { id: 'b', label: 'Definiste la frecuencia de recompra', check: 'filled' },
      { id: 'c', label: 'El mensaje propone algo concreto', check: 'concrete' }
    ],
    reward: { xp: 60, coins: 45 }
  }
}

]);
