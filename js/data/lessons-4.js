/* ==========================================================================
   NIVEL 4 — VENDE · Consigues tus primeros clientes de verdad
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 4.1 */
{
  id: 'n4-01', level: 4, icon: '🩺', title: 'Vender es diagnosticar', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'El vendedor que más habla es el que menos vende',
    body: [
      'Vender no es convencer a alguien de algo que no necesita. Es **entender qué le duele y decirle honestamente si puedes ayudarlo**.',
      'Un buen médico no receta antes de preguntar. Un buen vendedor tampoco. Regla práctica: el cliente habla el 70% del tiempo.'
    ],
    keys: [
      'Pregunta primero, propone después.',
      'Si no puedes ayudarlo, dilo: ganas reputación y referidos.',
      'La objeción aparece cuando propusiste antes de entender.'
    ]
  },
  cas: {
    emoji: '👂', title: 'Tres preguntas, una venta',
    text: 'Un cliente pidió cotización de 50 piezas. En vez de mandar el precio, preguntó para qué eran, cuándo las necesitaba y qué había fallado antes. Descubrió que necesitaba 20 piezas urgentes y 30 después. Vendió las 20 ese mismo día con recargo por urgencia y dejó agendadas las otras 30. Ingresó más preguntando que cotizando.'
  },
  steps: [
    { type: 'quiz', q: 'Un cliente escribe: “¿Cuánto cuesta?” ¿Cuál es la mejor respuesta?',
      opts: [
        { t: '“$250 por pieza”', ok: false, why: 'Sin contexto, el precio siempre suena caro y la conversación se acaba.' },
        { t: '“Depende, ¿para qué lo necesitas y para cuándo?”', ok: true, why: 'Abres la conversación, entiendes la urgencia y puedes proponer lo correcto.' },
        { t: '“Es barato, no te preocupes”', ok: false, why: 'Devalúas tu trabajo antes de empezar.' },
        { t: '“Te paso el catálogo completo”', ok: false, why: 'Le das trabajo al cliente. La mayoría no lo abre.' }
      ],
      explain: 'Antes del precio: uso, plazo y contexto.' },

    { type: 'order', q: 'Ordena las etapas de una venta consultiva',
      items: [
        'Entender la situación actual del cliente',
        'Identificar qué le duele y qué le cuesta',
        'Confirmar si puedes resolverlo',
        'Presentar la solución con precio y plazo',
        'Cerrar con un siguiente paso concreto'
      ],
      explain: 'Situación → dolor → viabilidad → propuesta → siguiente paso.' },

    { type: 'multi', q: '¿Qué preguntas ayudan a diagnosticar? (elige todas)',
      opts: [
        { t: '¿Para cuándo lo necesitas?', ok: true },
        { t: '¿Qué has probado antes y qué falló?', ok: true },
        { t: '¿Verdad que es un buen precio?', ok: false },
        { t: '¿Qué pasa si no lo resuelves?', ok: true },
        { t: '¿Quién más decide junto contigo?', ok: true }
      ],
      explain: 'Plazo, historia, consecuencia y decisor: las cuatro preguntas que más ventas cierran.' },

    { type: 'sim', q: 'El cliente te cuenta su problema y no encaja con lo que haces.',
      opts: [
        { t: 'Venderle igual: ya es hora de facturar', ok: false,
          effects: { dinero: 1, reputacion: -3, clientes: -2 },
          why: 'Cobras una vez y pierdes su confianza, sus referidos y probablemente el dinero en garantías.' },
        { t: 'Decirle que no es para ti y recomendarle a alguien', ok: true,
          effects: { dinero: 0, reputacion: 3, clientes: 2 },
          why: 'Ganas credibilidad. Ese cliente vuelve cuando sí lo necesita y te recomienda mientras tanto.' },
        { t: 'Cambiar tu producto para encajar', ok: false,
          effects: { dinero: -2, reputacion: 0, clientes: 0 },
          why: 'Rediseñar el negocio por un cliente es cómo se pierde el enfoque.' }
      ],
      explain: 'El “no” honesto es la mejor herramienta de reputación que tienes.' },

    { type: 'write', q: 'Escribe tus 3 preguntas de diagnóstico',
      sub: 'Las que harás antes de dar cualquier precio.',
      ph: '1. ¿Para qué la vas a usar?\n2. ¿Para cuándo la necesitas?\n3. ¿Qué has intentado antes?',
      minWords: 10,
      hints: ['Una sobre el uso.', 'Una sobre el plazo.', 'Una sobre el costo de no resolverlo.'] }
  ],
  mission: {
    id: 'm4-01', title: 'Diagnostica antes de cotizar', dossier: null,
    brief: 'La próxima vez que alguien pregunte el precio, haz primero tus tres preguntas. Registra qué descubriste.',
    fields: [
      { key: 'cliente', label: '¿Con quién lo hiciste?', type: 'text', ph: 'Un cliente del grupo de FB' },
      { key: 'descubrimiento', label: '¿Qué descubriste que no sabías?', type: 'area', ph: 'Que su urgencia era mucho mayor de lo que parecía…' },
      { key: 'resultado', label: '¿Cómo cambió tu propuesta?', type: 'text', ph: 'Le ofrecí servicio exprés con recargo' }
    ],
    rubric: [
      { id: 'a', label: 'Lo aplicaste con una persona real', check: 'named' },
      { id: 'b', label: 'Descubriste algo nuevo', check: 'reason' },
      { id: 'c', label: 'Ajustaste tu propuesta', check: 'filled' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 4.2 */
{
  id: 'n4-02', level: 4, icon: '🎙️', title: 'Tu pitch de 30 segundos', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Que te entiendan en el tiempo de un semáforo',
    body: [
      'Si tardas más de 30 segundos en explicar qué haces, pierdes al cliente. La fórmula: **“Ayudo a [quién] a [resultado] sin [molestia principal]”**.',
      'No empieces por ti ni por tu técnica. Empieza por el problema de la otra persona. Tu proceso solo importa si primero entendió por qué le conviene.'
    ],
    keys: [
      'Empieza por el cliente, no por tu producto.',
      'Menciona el resultado, no el método.',
      'Termina con una pregunta para abrir conversación.'
    ]
  },
  cas: {
    emoji: '🗣️', title: 'Antes y después',
    text: 'Antes: “Tengo un negocio de impresión 3D, trabajo con PLA y PETG a 0.2 mm de capa.” Nadie preguntaba nada. \nDespués: “Ayudo a talleres a no parar su maquinaria cuando se rompe una pieza que ya no se fabrica. La reproduzco en 48 horas. ¿Te ha pasado?” Empezó a recibir preguntas en cada conversación.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál pitch funciona mejor en una reunión?',
      opts: [
        { t: '“Hago impresión 3D con tecnología FDM y materiales de alta resistencia”', ok: false, why: 'Habla de técnica. La mayoría no sabe qué significa ni por qué debería importarle.' },
        { t: '“Ayudo a talleres a no parar su máquina cuando se rompe una pieza descontinuada: la reproduzco en 48 horas”', ok: true, why: 'Cliente, resultado y plazo. Se entiende sin saber nada de impresión 3D.' },
        { t: '“Vendo productos personalizados de calidad”', ok: false, why: 'Genérico. No genera ninguna imagen mental ni pregunta.' },
        { t: '“Soy emprendedor y tengo un proyecto innovador”', ok: false, why: 'No dice absolutamente nada.' }
      ],
      explain: 'Quién + resultado + diferencia concreta. En una frase.' },

    { type: 'fill', q: 'Arma tu pitch con la fórmula',
      text: 'Ayudo a ___ a ___ sin ___ .',
      bank: ['dueños de estéticas', 'llenar su agenda cada semana', 'tener que perseguir clientes por WhatsApp', 'la gente', 'ser mejores', 'problemas'],
      answer: ['dueños de estéticas', 'llenar su agenda cada semana', 'tener que perseguir clientes por WhatsApp'],
      explain: 'Quién, qué resultado, y de qué molestia lo libras.' },

    { type: 'multi', q: '¿Qué errores matan un pitch? (elige todos)',
      opts: [
        { t: 'Empezar con tu historia personal', ok: true },
        { t: 'Usar jerga técnica', ok: true },
        { t: 'Nombrar un resultado concreto', ok: false },
        { t: 'Hablar más de 60 segundos', ok: true },
        { t: 'Terminar con una pregunta', ok: false }
      ],
      explain: 'Historia larga, jerga y duración son los tres asesinos del pitch.' },

    { type: 'sim', q: 'Estás en una feria. Alguien pregunta “¿y tú a qué te dedicas?”',
      opts: [
        { t: 'Explicar tu proceso técnico en detalle', ok: false,
          effects: { clientes: -1, reputacion: 0, aprendizaje: 0 },
          why: 'La persona asiente y busca cómo salir de la conversación.' },
        { t: 'Dar tu pitch de 15 segundos y devolver una pregunta', ok: true,
          effects: { clientes: 3, reputacion: 2, aprendizaje: 2 },
          why: 'Se entiende rápido y la conversación sigue. Además aprendes de su situación.' },
        { t: 'Darle tu tarjeta sin explicar', ok: false,
          effects: { clientes: 0, reputacion: 0, aprendizaje: 0 },
          why: 'Las tarjetas sin contexto van directo a la basura.' }
      ],
      explain: 'Pitch corto + pregunta = conversación. Monólogo = despedida.' },

    { type: 'write', q: 'Escribe tu pitch de 30 segundos',
      sub: 'Ayudo a [quién] a [resultado] sin [molestia]. ¿Te ha pasado que…?',
      ph: 'Ayudo a talleres a no parar su maquinaria cuando se rompe una pieza descontinuada, sin esperar semanas por una refacción. ¿Te ha pasado?',
      minWords: 15,
      hints: ['Sin jerga técnica.', 'Termina con una pregunta.'] }
  ],
  mission: {
    id: 'm4-02', title: 'Prueba tu pitch con 3 personas', dossier: 'identidad',
    brief: 'Dilo en voz alta a tres personas hoy. Anota si preguntaron algo. Si no preguntan, el pitch todavía no sirve.',
    fields: [
      { key: 'pitch', label: 'Tu pitch final', type: 'area', ph: 'Ayudo a…' },
      { key: 'reaccion', label: '¿Qué preguntaron las tres personas?', type: 'area', ph: 'Dos preguntaron cuánto tardo, una preguntó el precio…' }
    ],
    rubric: [
      { id: 'a', label: 'El pitch nombra a un cliente concreto', check: 'audience' },
      { id: 'b', label: 'Promete un resultado', check: 'outcome' },
      { id: 'c', label: 'Lo probaste con personas reales', check: 'filled' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 4.3 */
{
  id: 'n4-03', level: 4, icon: '📍', title: 'Dónde está tu cliente', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Dos canales bien hechos vencen a seis a medias',
    body: [
      'No necesitas estar en todas partes. Necesitas estar **donde tu cliente ya se junta**, con constancia.',
      'Evalúa cada canal con tres preguntas: ¿está mi cliente ahí?, ¿puedo hablarle sin pagar?, ¿puedo sostenerlo cada semana? Elige dos. Solo dos.'
    ],
    keys: [
      'Presencia constante en 2 canales > presencia ocasional en 6.',
      'Los canales offline (gremios, ferias, referidos) suelen convertir mejor al inicio.',
      'Un canal sirve si puedes medir cuántos contactos te trae.'
    ]
  },
  cas: {
    emoji: '🧭', title: 'El canal que nadie miraba',
    text: 'Intentó Instagram, TikTok, Facebook y una tienda en línea a la vez. Cero ventas en tres meses. Cerró todo menos un grupo de WhatsApp de técnicos de refrigeración donde participaba respondiendo dudas gratis. En seis semanas llevaba 14 clientes. El canal más pequeño era el correcto.'
  },
  steps: [
    { type: 'quiz', q: 'Vendes a talleres mecánicos. ¿Qué canal probarías PRIMERO?',
      opts: [
        { t: 'TikTok con videos de tendencia', ok: false, why: 'Puede funcionar a largo plazo, pero tarda y no está segmentado a tu cliente.' },
        { t: 'Visitar 10 talleres de tu zona con muestras', ok: true, why: 'Contacto directo con el decisor, cero costo de publicidad y respuesta el mismo día.' },
        { t: 'Publicidad pagada a todo el país', ok: false, why: 'Caro y disperso. Sin datos previos, quemarás presupuesto.' },
        { t: 'Abrir un blog', ok: false, why: 'Tarda meses en generar tráfico y tu cliente no busca así.' }
      ],
      explain: 'Al inicio, el canal más directo casi siempre gana: tocar puertas donde ya está tu cliente.' },

    { type: 'match', q: 'Empareja el cliente con su canal más probable',
      pairs: [
        ['Dueños de mascotas', 'Grupos y parques caninos'],
        ['Restaurantes', 'Visita directa y proveedores en común'],
        ['Novias y organizadores de bodas', 'Instagram y ferias de novios']
      ],
      explain: 'El canal se deduce del cliente, no de tus gustos.' },

    { type: 'multi', q: '¿Qué hace bueno a un canal? (elige todas)',
      opts: [
        { t: 'Tu cliente ya está ahí', ok: true },
        { t: 'Puedes medir cuántos contactos genera', ok: true },
        { t: 'Puedes sostenerlo cada semana', ok: true },
        { t: 'Es el canal de moda', ok: false },
        { t: 'Puedes hablar directo con quien decide', ok: true }
      ],
      explain: 'Presencia del cliente, medición, sostenibilidad y acceso al decisor.' },

    { type: 'sim', q: 'Tienes 6 horas a la semana para vender. ¿Cómo las repartes?',
      opts: [
        { t: '1 hora en cada una de 6 redes', ok: false,
          effects: { clientes: 0, tiempo: -3, aprendizaje: 0 },
          why: 'Nadie te recuerda en ninguna. El esfuerzo se diluye por completo.' },
        { t: '3 horas visitando clientes y 3 en el grupo donde ya participan', ok: true,
          effects: { clientes: 3, tiempo: -1, aprendizaje: 3 },
          why: 'Concentras el esfuerzo, te vuelves conocido y aprendes de conversaciones reales.' },
        { t: '6 horas haciendo contenido para el futuro', ok: false,
          effects: { clientes: 0, tiempo: -3, aprendizaje: 1 },
          why: 'El contenido ayuda, pero no reemplaza el contacto directo cuando aún no tienes clientes.' }
      ],
      explain: 'Cuando no tienes clientes, prioriza el contacto directo sobre la audiencia.' },

    { type: 'write', q: 'Elige tus dos canales',
      sub: 'Justifica cada uno con las tres preguntas: ¿está mi cliente?, ¿puedo hablarle?, ¿lo sostengo semanal?',
      ph: '1. Grupo de FB de dueños de perros: están ahí, puedo participar gratis, entro todos los días.\n2. Veterinarias de mi colonia: visito 3 por semana…',
      minWords: 18,
      hints: ['Uno directo (visitas, referidos).', 'Uno digital donde ya se juntan.'] }
  ],
  mission: {
    id: 'm4-03', title: 'Tus dos canales', dossier: 'canales',
    brief: 'Elige dos canales y define qué harás en cada uno cada semana. Esto se convierte en tu rutina de ventas.',
    fields: [
      { key: 'canal1', label: 'Canal 1 y por qué', type: 'text', ph: 'Grupo de FB “Perros CDMX” — 12,000 miembros, participo gratis' },
      { key: 'accion1', label: '¿Qué harás ahí cada semana?', type: 'text', ph: 'Responder 5 dudas y publicar 1 caso real' },
      { key: 'canal2', label: 'Canal 2 y por qué', type: 'text', ph: 'Veterinarias de la colonia — el dueño decide y está ahí' },
      { key: 'accion2', label: '¿Qué harás ahí cada semana?', type: 'text', ph: 'Visitar 3 con muestras' }
    ],
    rubric: [
      { id: 'a', label: 'Elegiste exactamente dos canales', check: 'filled' },
      { id: 'b', label: 'Justificaste por qué está tu cliente ahí', check: 'reason' },
      { id: 'c', label: 'Definiste una acción semanal medible', check: 'measurable' }
    ],
    reward: { xp: 50, coins: 35 }
  }
},

/* ------------------------------------------------------------------ 4.4 */
{
  id: 'n4-04', level: 4, icon: '✉️', title: 'El mensaje que sí responden', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Corto, personal y con un solo pedido',
    body: [
      'Un mensaje en frío funciona cuando cumple tres reglas: **demuestra que investigaste**, **habla de un problema concreto** y **pide una sola cosa fácil**.',
      'Estructura: una línea que demuestra que sabes quién es, una línea con el problema, una línea con lo que ofreces y una pregunta cerrada de sí o no.'
    ],
    keys: [
      'Menciona algo específico de esa persona o negocio.',
      'Nada de párrafos: 4 líneas máximo.',
      'Un solo pedido: “¿te mando una foto?” o “¿te sirve el jueves?”.'
    ]
  },
  cas: {
    emoji: '📲', title: 'Dos mensajes, dos resultados',
    text: 'A: “Hola, vendo piezas impresas en 3D de excelente calidad, cualquier cosa me avisas.” 0 de 20 respondieron. \nB: “Hola Luis, vi que reparan lavadoras Whirlpool viejitas. Reproduzco engranes descontinuados en 48 h. ¿Te mando una foto de uno que hice la semana pasada?” 7 de 20 respondieron.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es el mejor cierre para un mensaje en frío?',
      opts: [
        { t: '“Cualquier cosa me avisas”', ok: false, why: 'No pide nada. El cliente no tiene ninguna acción que tomar.' },
        { t: '“¿Te mando una foto del que hice la semana pasada?”', ok: true, why: 'Pedido pequeño, fácil de aceptar y abre conversación sin comprometer a nada.' },
        { t: '“¿Quieres comprar?”', ok: false, why: 'Demasiado pronto. Sin contexto, el reflejo es decir que no.' },
        { t: '“Te dejo mi catálogo de 40 productos”', ok: false, why: 'Le das trabajo. Casi nadie abre catálogos de desconocidos.' }
      ],
      explain: 'El primer pedido debe costar 2 segundos responderlo.' },

    { type: 'order', q: 'Ordena la estructura del mensaje en frío',
      items: [
        'Línea 1: algo específico de esa persona o negocio',
        'Línea 2: el problema que sabes que tiene',
        'Línea 3: qué haces, en una frase con plazo',
        'Línea 4: una pregunta de sí o no'
      ],
      explain: 'Cuatro líneas. Ni una más.' },

    { type: 'multi', q: '¿Qué hace que un mensaje se sienta personal? (elige todas)',
      opts: [
        { t: 'Mencionar el nombre del negocio', ok: true },
        { t: 'Referirte a algo que publicaron o hacen', ok: true },
        { t: 'Copiar y pegar el mismo texto a todos', ok: false },
        { t: 'Nombrar un problema típico de su giro', ok: true },
        { t: 'Escribir tres párrafos explicando tu historia', ok: false }
      ],
      explain: 'Personal = específico. Dos datos concretos bastan.' },

    { type: 'slider', q: '¿Cuántos mensajes en frío mandas antes de concluir que no funciona?',
      min: 3, max: 100, step: 1, value: 5, unit: ' mensajes',
      best: [20, 40],
      bands: [
        { max: 19, label: 'Muy pocos', tone: 'bad', msg: 'Con menos de 20 no tienes datos: una racha de silencio es normal.' },
        { max: 40, label: 'Muestra válida', tone: 'ok', msg: '20-40 mensajes te dan una tasa de respuesta confiable para decidir.' },
        { max: 100, label: 'Demasiados sin ajustar', tone: 'warn', msg: 'Si mandaste 60 iguales sin cambiar nada, desperdiciaste 40 oportunidades de mejorar.' }
      ],
      explain: 'Manda 20, mide, ajusta el texto, manda otros 20.' },

    { type: 'write', q: 'Escribe tu mensaje en frío de 4 líneas',
      sub: 'Específico, con problema, con plazo y con una pregunta simple.',
      ph: 'Hola [nombre], vi que…\nSé que cuando pasa X pierden…\nYo hago Y en 48 horas.\n¿Te mando una foto?',
      minWords: 25,
      hints: ['Personaliza la primera línea.', 'Termina con una pregunta de sí o no.'] }
  ],
  mission: {
    id: 'm4-04', title: 'Manda 10 mensajes hoy', dossier: null,
    brief: 'Escribe tu mensaje, personalízalo para 10 personas reales y mándalo. Anota cuántos responden.',
    fields: [
      { key: 'mensaje', label: 'Tu mensaje base', type: 'area', ph: '' },
      { key: 'enviados', label: '¿Cuántos enviaste?', type: 'num', ph: '10' },
      { key: 'respuestas', label: '¿Cuántos respondieron?', type: 'num', ph: '3' },
      { key: 'ajuste', label: '¿Qué cambiarías del mensaje?', type: 'text', ph: 'Poner el precio desde el inicio' }
    ],
    rubric: [
      { id: 'a', label: 'Enviaste al menos 10', check: 'ten' },
      { id: 'b', label: 'El mensaje es personalizado', check: 'personal' },
      { id: 'c', label: 'Mediste la tasa de respuesta', check: 'numbers' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 4.5 */
{
  id: 'n4-05', level: 4, icon: '🛡️', title: 'Manejo de objeciones', xp: 30, min: 8,
  concept: {
    tag: 'Concepto', title: 'Una objeción es interés con miedo',
    body: [
      'Cuando alguien objeta, todavía está en la conversación. El que no tiene interés simplemente desaparece.',
      'El método en tres pasos: **escucha completa**, **valida sin discutir**, **pregunta para entender qué hay detrás**. Recién entonces respondes. Nunca contradigas de frente.'
    ],
    keys: [
      '“Está caro” casi nunca es sobre el precio.',
      '“Lo voy a pensar” significa que falta información o confianza.',
      'Pregunta “¿comparado con qué?” antes de defenderte.'
    ]
  },
  cas: {
    emoji: '💬', title: 'El “está caro” que no era caro',
    text: '“Está caro.” — “Entiendo. ¿Comparado con qué lo estás viendo?” — “Con uno que vi en línea a $90.” — “Ese tarda 3 semanas y viene de otro país. El mío llega en 48 horas con garantía. ¿Qué te urge más: el precio o el tiempo?” — “La verdad, el tiempo.” Venta cerrada al precio original.'
  },
  steps: [
    { type: 'match', q: 'Empareja la objeción con lo que realmente significa',
      pairs: [
        ['“Está caro”', 'No veo suficiente valor todavía'],
        ['“Lo voy a pensar”', 'Falta información o confianza'],
        ['“Déjame consultarlo”', 'No es quien decide, o no quiere decir que no']
      ],
      explain: 'Detrás de cada objeción hay una duda concreta. Encuéntrala.' },

    { type: 'order', q: 'Ordena el método de manejo de objeciones',
      items: [
        'Escucha completa sin interrumpir',
        'Valida: “entiendo, tiene sentido”',
        'Pregunta para entender qué hay detrás',
        'Responde solo la duda real',
        'Propón el siguiente paso concreto'
      ],
      explain: 'Escuchar → validar → preguntar → responder → avanzar.' },

    { type: 'quiz', q: 'Cliente: “Lo voy a pensar”. ¿Cuál es la mejor respuesta?',
      opts: [
        { t: '“Está bien, cualquier cosa me avisas”', ok: false, why: 'La conversación muere ahí. El 90% no vuelve.' },
        { t: '“Claro. ¿Qué parte te genera más duda: el precio, el tiempo o si va a funcionar?”', ok: true, why: 'Le das opciones concretas y descubres la objeción real, que casi nunca es la que dijo.' },
        { t: '“Te doy 20% de descuento si decides hoy”', ok: false, why: 'Asumes que es precio sin preguntar y regalas margen.' },
        { t: '“¿Por qué? Es una buena oferta”', ok: false, why: 'Suena defensivo y pone al cliente a justificarse.' }
      ],
      explain: 'Ofrece opciones de duda: precio, tiempo o resultado. Casi siempre es una de las tres.' },

    { type: 'sim', q: 'Cliente: “Vi uno más barato en línea”.',
      opts: [
        { t: 'Igualar el precio de inmediato', ok: false,
          effects: { dinero: -3, reputacion: -1, clientes: 1 },
          why: 'Aceptaste competir en el único terreno donde no puedes ganar. Y le enseñaste a regatear.' },
        { t: 'Preguntar qué incluye ese y comparar plazo, garantía y soporte', ok: true,
          effects: { dinero: 2, reputacion: 3, clientes: 2 },
          why: 'Cambias la conversación de precio a valor total. Muchas veces el barato no incluye lo esencial.' },
        { t: 'Decir que el otro es de mala calidad', ok: false,
          effects: { reputacion: -2, clientes: -1, dinero: 0 },
          why: 'Hablar mal de la competencia te hace ver inseguro y desprestigia tu propuesta.' }
      ],
      explain: 'Nunca compares precios: compara lo que incluye cada opción.' },

    { type: 'write', q: 'Prepara tu respuesta a la objeción que más te dicen',
      sub: 'Escríbela con el método: valida, pregunta, responde, propón.',
      ph: 'Cuando me dicen “está caro” respondo: entiendo, ¿comparado con qué? … y luego explico que incluye garantía y entrega en 48 h…',
      minWords: 20,
      hints: ['Empieza validando.', 'Incluye una pregunta.', 'Termina proponiendo un paso.'] }
  ],
  mission: {
    id: 'm4-05', title: 'Tu guion de objeciones', dossier: 'ventas',
    brief: 'Escribe la respuesta preparada a tus tres objeciones más frecuentes. Tenerlas listas cambia el resultado.',
    fields: [
      { key: 'o1', label: 'Objeción 1 y tu respuesta', type: 'area', ph: '“Está caro” → Entiendo, ¿comparado con qué?…' },
      { key: 'o2', label: 'Objeción 2 y tu respuesta', type: 'area', ph: '' },
      { key: 'o3', label: 'Objeción 3 y tu respuesta', type: 'area', ph: '' }
    ],
    rubric: [
      { id: 'a', label: 'Preparaste tres objeciones', check: 'filled' },
      { id: 'b', label: 'Tus respuestas incluyen una pregunta', check: 'question' },
      { id: 'c', label: 'No discutes de frente con el cliente', check: 'nofight' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 4.6 */
{
  id: 'n4-06', level: 4, icon: '📄', title: 'La cotización que cierra', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Una cotización es una propuesta, no una lista de precios',
    body: [
      'La mayoría manda un número suelto y se pregunta por qué no responden. Una cotización que cierra **recuerda el problema del cliente**, describe qué recibe, cuándo lo recibe, cuánto cuesta y qué pasa si algo falla.',
      'Y siempre termina con una fecha de vigencia y un siguiente paso concreto.'
    ],
    keys: [
      'Repite el problema del cliente en sus palabras: demuestra que entendiste.',
      'Ofrece 2 o 3 opciones, no una sola: el cliente elige en vez de decidir sí o no.',
      'Fecha de vigencia: sin ella, la cotización se pospone para siempre.'
    ]
  },
  cas: {
    emoji: '🧩', title: 'Tres opciones, mejor promedio',
    text: 'Antes mandaba una sola opción a $250 y cerraba 2 de cada 10. Empezó a mandar tres: básica $180, recomendada $290 (con garantía extendida) y completa $450. Cerró 5 de cada 10 y el ticket promedio subió a $310. La mayoría elegía la de en medio.'
  },
  steps: [
    { type: 'order', q: 'Ordena las partes de una cotización que cierra',
      items: [
        'Resumen del problema con las palabras del cliente',
        'Qué incluye exactamente la propuesta',
        'Plazo de entrega comprometido',
        'Precio y formas de pago',
        'Garantía y qué pasa si algo falla',
        'Vigencia y siguiente paso'
      ],
      explain: 'Problema → alcance → plazo → precio → garantía → vigencia. Seis bloques cortos.' },

    { type: 'quiz', q: '¿Por qué conviene ofrecer 3 opciones en vez de una?',
      opts: [
        { t: 'Porque el cliente elige la más barata', ok: false, why: 'La mayoría elige la de en medio, no la barata. Ese es justamente el efecto.' },
        { t: 'Porque cambia la pregunta de “¿sí o no?” a “¿cuál?”', ok: true, why: 'Psicológicamente el cliente pasa de decidir si compra a decidir qué compra.' },
        { t: 'Porque parece más profesional', ok: false, why: 'Se ve mejor, sí, pero la razón real es que cambia la decisión.' },
        { t: 'Para confundir al cliente', ok: false, why: 'Más de 3 opciones sí confunde y paraliza. Tres es el límite.' }
      ],
      explain: 'Tres opciones: básica, recomendada y premium. La de en medio es la que quieres vender.' },

    { type: 'multi', q: '¿Qué elementos aumentan la tasa de cierre? (elige todas)',
      opts: [
        { t: 'Fecha de vigencia de la cotización', ok: true },
        { t: 'Fotos de trabajos similares', ok: true },
        { t: 'Un archivo de 12 páginas', ok: false },
        { t: 'Formas de pago claras', ok: true },
        { t: 'Un siguiente paso concreto', ok: true },
        { t: 'Lenguaje técnico complicado', ok: false }
      ],
      explain: 'Claridad, evidencia y urgencia razonable. Nada de documentos largos.' },

    { type: 'sim', q: 'Mandas la cotización y no responden en 3 días.',
      opts: [
        { t: 'Esperar a que ellos escriban', ok: false,
          effects: { clientes: -2, dinero: -1, reputacion: 0 },
          why: 'La mayoría de las ventas se pierden por falta de seguimiento, no por precio.' },
        { t: 'Escribir: “¿Pudiste revisarla? ¿Te resuelvo alguna duda del plazo o del precio?”', ok: true,
          effects: { clientes: 3, dinero: 2, reputacion: 1 },
          why: 'Seguimiento útil, sin presión, que reabre la conversación con una pregunta concreta.' },
        { t: 'Mandar un descuento sin que lo pidan', ok: false,
          effects: { dinero: -3, clientes: 1, reputacion: -1 },
          why: 'Enseñas al cliente que si no responde, le bajas el precio.' }
      ],
      explain: 'Seguimiento a las 48-72 horas, siempre con una pregunta, nunca con un descuento.' },

    { type: 'write', q: 'Escribe tu plantilla de cotización',
      sub: 'Con los seis bloques. La vas a reutilizar decenas de veces.',
      ph: 'Entiendo que necesitas… / Incluye… / Entrega el… / Inversión: $… / Garantía… / Vigencia 7 días. ¿Confirmamos?',
      minWords: 25,
      hints: ['Repite el problema del cliente.', 'Incluye vigencia.', 'Termina con una pregunta.'] }
  ],
  mission: {
    id: 'm4-06', title: 'Envía una cotización real', dossier: 'ventas',
    brief: 'Prepara tu plantilla con 3 opciones y envíala a un cliente potencial de verdad.',
    fields: [
      { key: 'plantilla', label: 'Tu plantilla de cotización', type: 'area', ph: '' },
      { key: 'op1', label: 'Opción básica y precio', type: 'text', ph: 'Placa simple — $180' },
      { key: 'op2', label: 'Opción recomendada y precio', type: 'text', ph: 'Placa + garantía 1 año — $290' },
      { key: 'op3', label: 'Opción completa y precio', type: 'text', ph: 'Placa + collar + reposición — $450' }
    ],
    rubric: [
      { id: 'a', label: 'Tienes tres opciones con precio', check: 'numbers' },
      { id: 'b', label: 'Incluye plazo de entrega', check: 'quote2' },
      { id: 'c', label: 'Incluye vigencia o siguiente paso', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 4.7 */
{
  id: 'n4-07', level: 4, icon: '🤝', title: 'Cerrar y dar seguimiento', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'El cierre es una pregunta, no un empujón',
    body: [
      'Cerrar es simplemente **proponer el siguiente paso con claridad**. “¿Lo empezamos el lunes?” cierra más que cualquier técnica de presión.',
      'Y la mayor parte del dinero está en el seguimiento: el 80% de las ventas necesita entre 2 y 5 contactos. Casi nadie hace más de uno.'
    ],
    keys: [
      'Cierra proponiendo fecha, no pidiendo permiso.',
      'Seguimiento: 48 h, 1 semana, 3 semanas. Después, cada mes.',
      'Cada seguimiento debe aportar algo, no solo “¿ya decidiste?”.'
    ]
  },
  cas: {
    emoji: '📆', title: 'La venta del cuarto mensaje',
    text: 'Un cliente pidió cotización y desapareció. Le escribió a los 3 días con una foto de un trabajo similar, a la semana con un caso de uso, y a las tres semanas avisando que subiría precios el mes siguiente. Compró en el cuarto contacto. Tres de cada diez de sus ventas llegan así.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es la mejor frase de cierre?',
      opts: [
        { t: '“¿Qué te parece?”', ok: false, why: 'Invita a opinar, no a decidir. La respuesta típica es “déjame pensarlo”.' },
        { t: '“Si te parece, lo empiezo el lunes y lo tienes el jueves. ¿Va?”', ok: true, why: 'Propone fechas concretas y pide una confirmación simple.' },
        { t: '“Es la última oportunidad, decide ya”', ok: false, why: 'La presión falsa quema la confianza y suele espantar.' },
        { t: '“Cuando quieras me dices”', ok: false, why: 'Deja la responsabilidad en el cliente. Casi nunca vuelve.' }
      ],
      explain: 'Fecha + acción + pregunta corta. Ese es el cierre natural.' },

    { type: 'order', q: 'Ordena la secuencia de seguimiento',
      items: [
        'A las 48 h: “¿Pudiste revisarla? ¿Alguna duda de plazo o precio?”',
        'A la semana: envía una foto o caso similar',
        'A las 3 semanas: avisa de un cambio (agenda, precio, disponibilidad)',
        'Cada mes: comparte algo útil sin pedir nada',
        'Cuando compre: pide una reseña y un referido'
      ],
      explain: 'Cada contacto aporta algo. Así el seguimiento no se siente como acoso.' },

    { type: 'multi', q: '¿Qué hacer después de cerrar una venta? (elige todas)',
      opts: [
        { t: 'Confirmar por escrito qué incluye y cuándo llega', ok: true },
        { t: 'Pedir el anticipo acordado', ok: true },
        { t: 'Desaparecer hasta la entrega', ok: false },
        { t: 'Avisar del avance a mitad del proceso', ok: true },
        { t: 'Pedir reseña y referido al entregar', ok: true }
      ],
      explain: 'La posventa es donde se fabrican los clientes que repiten y recomiendan.' },

    { type: 'slider', q: '¿Cuántos contactos de seguimiento haces antes de dar por perdida una venta?',
      min: 1, max: 12, step: 1, value: 1, unit: ' contactos',
      best: [4, 6],
      bands: [
        { max: 2, label: 'Te rindes pronto', tone: 'bad', msg: 'La mayoría de las ventas ocurre entre el contacto 2 y el 5. Rendirse en el 1 deja dinero en la mesa.' },
        { max: 6, label: 'Correcto', tone: 'ok', msg: '4 a 6 contactos espaciados y útiles es el punto donde más se cierra sin incomodar.' },
        { max: 12, label: 'Excesivo', tone: 'warn', msg: 'Más de 8 sin ninguna señal empieza a dañar la relación. Pasa a modo “una vez al mes”.' }
      ],
      explain: 'Persistencia útil, no insistencia molesta.' },

    { type: 'write', q: 'Escribe tus 3 mensajes de seguimiento',
      sub: 'Cada uno debe aportar algo distinto, no solo preguntar si ya decidió.',
      ph: '48 h: ¿pudiste revisarla?…\n1 semana: te mando una foto de uno igual…\n3 semanas: aviso que subo precios…',
      minWords: 22,
      hints: ['Ninguno debe decir solo “¿ya decidiste?”.', 'Uno debe incluir evidencia.'] }
  ],
  mission: {
    id: 'm4-07', title: 'Tu sistema de seguimiento', dossier: 'ventas',
    brief: 'Haz una lista de todos los interesados que no han comprado y programa su seguimiento. Ahí hay dinero esperando.',
    fields: [
      { key: 'lista', label: 'Interesados pendientes (nombre + fecha del último contacto)', type: 'area', ph: 'Luis — hace 8 días\nMarisol — hace 3 días' },
      { key: 'mensajes', label: 'Tus 3 mensajes de seguimiento', type: 'area', ph: '' },
      { key: 'cuando', label: '¿Qué día de la semana harás el seguimiento?', type: 'text', ph: 'Todos los martes a las 10 am' }
    ],
    rubric: [
      { id: 'a', label: 'Listaste a los interesados pendientes', check: 'filled' },
      { id: 'b', label: 'Cada mensaje aporta algo distinto', check: 'steps' },
      { id: 'c', label: 'Definiste un día fijo para hacerlo', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
}

]);
