/* ==========================================================================
   NIVEL 7 — SISTEMATIZA · Automatizas, delegas y documentas
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 7.1 */
{
  id: 'n7-01', level: 7, icon: '📋', title: 'Escribe cómo se hace', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Lo que solo está en tu cabeza no se puede delegar',
    body: [
      'Un proceso documentado es la diferencia entre tener un negocio y tener un empleo que te pagas tú. Si todo depende de tu memoria, **no puedes enfermarte, viajar ni crecer**.',
      'Un buen proceso tiene: nombre, disparador (cuándo empieza), pasos numerados con verbos de acción, tiempos y qué se hace si algo falla.'
    ],
    keys: [
      'Documenta mientras trabajas: graba o escribe al hacerlo.',
      'Cada paso empieza con un verbo: “confirmar”, “medir”, “cobrar”.',
      'Incluye qué hacer cuando sale mal, no solo cuando sale bien.'
    ]
  },
  cas: {
    emoji: '🗂️', title: 'Las vacaciones imposibles',
    text: 'Llevaba dos años sin descansar porque nadie más sabía cómo cotizar. Dedicó tres sábados a escribir sus cinco procesos clave. Al cuarto mes entrenó a su hermana en dos días con esos documentos y se fue una semana. El negocio facturó igual sin él.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es la mejor forma de documentar un proceso?',
      opts: [
        { t: 'Escribirlo de memoria un domingo', ok: false, why: 'Olvidarás los detalles que causan la mayoría de los errores.' },
        { t: 'Grabarte o anotar mientras lo haces la próxima vez', ok: true, why: 'Capturas los pasos reales, incluidos los que haces en automático sin darte cuenta.' },
        { t: 'Contratar a alguien para que lo escriba', ok: false, why: 'No conoce los detalles críticos ni las excepciones.' },
        { t: 'No documentarlo: cada caso es distinto', ok: false, why: 'El 80% de los casos son iguales. Documenta ese 80%.' }
      ],
      explain: 'Documenta en el momento de hacerlo. Es más rápido y más fiel.' },

    { type: 'multi', q: '¿Qué debe incluir un proceso bien escrito? (elige todas)',
      opts: [
        { t: 'Cuándo empieza (el disparador)', ok: true },
        { t: 'Pasos numerados con verbos', ok: true },
        { t: 'Tiempo estimado de cada paso', ok: true },
        { t: 'Qué hacer si algo falla', ok: true },
        { t: 'La historia de la empresa', ok: false }
      ],
      explain: 'Disparador, pasos, tiempos y excepciones. Cuatro elementos.' },

    { type: 'order', q: 'Ordena cómo documentar tu primer proceso',
      items: [
        'Elige el proceso que más repites',
        'La próxima vez que lo hagas, anota cada paso',
        'Numera y empieza cada paso con un verbo',
        'Agrega tiempos y qué hacer si algo sale mal',
        'Pide a alguien que lo siga y anota dónde se atora'
      ],
      explain: 'El último paso es el más importante: la prueba con otra persona revela lo que olvidaste.' },

    { type: 'sim', q: '¿Cuál proceso documentas primero?',
      opts: [
        { t: 'El más complicado y raro', ok: false,
          effects: { tiempo: -3, aprendizaje: 1, dinero: 0 },
          why: 'Mucho esfuerzo para algo que ocurre pocas veces al año.' },
        { t: 'El que más repites cada semana', ok: true,
          effects: { tiempo: 3, aprendizaje: 3, dinero: 2 },
          why: 'Máximo ahorro: lo que haces 20 veces al mes es donde el proceso rinde más.' },
        { t: 'El que menos te gusta hacer', ok: false,
          effects: { tiempo: 1, aprendizaje: 1, dinero: 0 },
          why: 'Válido si además es frecuente. Si no, es preferencia personal, no impacto.' }
      ],
      explain: 'Documenta primero lo frecuente. La frecuencia multiplica el beneficio.' },

    { type: 'write', q: '¿Qué proceso repites más en tu negocio?',
      sub: 'Ese es el primero que vas a documentar.',
      ph: 'Cotizar: desde que llega el mensaje hasta que mando el precio. Lo hago 15 veces por semana…',
      minWords: 10,
      hints: ['¿Cuál haces más veces por semana?', '¿Cuál te quita más tiempo?'] }
  ],
  mission: {
    id: 'm7-01', title: 'Documenta tu proceso más repetido', dossier: 'procesos',
    brief: 'Escribe paso a paso tu proceso más frecuente. Debe poder ejecutarlo alguien que no eres tú.',
    fields: [
      { key: 'nombre', label: 'Nombre del proceso', type: 'text', ph: 'Cotización de pieza personalizada' },
      { key: 'disparador', label: '¿Cuándo empieza?', type: 'text', ph: 'Cuando llega un mensaje pidiendo precio' },
      { key: 'pasos', label: 'Pasos (uno por línea, empezando con verbo)', type: 'area', ph: '1. Preguntar uso y plazo\n2. Solicitar fotos con medidas\n3. …' },
      { key: 'fallos', label: '¿Qué hacer si algo sale mal?', type: 'text', ph: 'Si no manda medidas, enviar guía de cómo medir' }
    ],
    rubric: [
      { id: 'a', label: 'Tiene al menos 5 pasos', check: 'steps' },
      { id: 'b', label: 'Cada paso empieza con un verbo', check: 'verbs' },
      { id: 'c', label: 'Definiste el disparador', check: 'filled' },
      { id: 'd', label: 'Incluiste qué hacer ante fallos', check: 'filled' }
    ],
    reward: { xp: 65, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 7.2 */
{
  id: 'n7-02', level: 7, icon: '⚡', title: 'Plantillas y automatización', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Nunca escribas lo mismo dos veces',
    body: [
      'Si respondes lo mismo diez veces por semana, no necesitas más disciplina: necesitas **una plantilla**. Y si un proceso siempre sigue el mismo orden, necesitas una automatización simple.',
      'Empieza por lo barato: respuestas guardadas, plantillas de cotización, formularios y recordatorios de calendario. Software complicado, después.'
    ],
    keys: [
      'Automatiza solo lo que ya está documentado.',
      'Plantilla no significa impersonal: deja huecos para personalizar.',
      'Una hora invertida en plantillas ahorra decenas de horas al año.'
    ]
  },
  cas: {
    emoji: '📑', title: 'Las 6 plantillas que devolvieron 5 horas',
    text: 'Creó seis plantillas: primer contacto, cotización, confirmación de pedido, aviso de avance, entrega y solicitud de reseña. Pasó de 8 horas semanales escribiendo mensajes a 3. Cinco horas recuperadas cada semana con una tarde de trabajo.'
  },
  steps: [
    { type: 'multi', q: '¿Qué conviene convertir en plantilla? (elige todas)',
      opts: [
        { t: 'Respuesta a “¿cuánto cuesta?”', ok: true },
        { t: 'Cotización', ok: true },
        { t: 'Confirmación de pedido', ok: true },
        { t: 'Solicitud de reseña', ok: true },
        { t: 'Una conversación difícil con un cliente molesto', ok: false }
      ],
      explain: 'Todo lo repetitivo se plantea. Lo delicado y único se atiende a mano.' },

    { type: 'quiz', q: '¿Cuándo conviene automatizar un proceso?',
      opts: [
        { t: 'Desde el primer día, para ir preparado', ok: false, why: 'Automatizar algo que aún cambia todos los días es tirar el trabajo.' },
        { t: 'Cuando ya está documentado y se repite muchas veces igual', ok: true, why: 'Solo se automatiza bien lo que ya es estable y frecuente.' },
        { t: 'Cuando puedas pagar el software más completo', ok: false, why: 'El precio de la herramienta no es la señal. La repetición sí.' },
        { t: 'Nunca: lo personal vende más', ok: false, why: 'Automatizar lo administrativo te deja más tiempo para lo personal.' }
      ],
      explain: 'Documenta → estabiliza → automatiza. En ese orden.' },

    { type: 'order', q: 'Ordena las etapas de simplificación',
      items: [
        'Detecta la tarea que más repites',
        'Escribe cómo la haces hoy',
        'Elimina los pasos innecesarios',
        'Conviértela en plantilla o formato fijo',
        'Automatiza lo que quede si sigue siendo repetitivo'
      ],
      explain: 'Eliminar antes que automatizar. Automatizar un paso inútil solo lo hace inútil más rápido.' },

    { type: 'sim', q: 'Pasas 6 horas por semana respondiendo las mismas dudas.',
      opts: [
        { t: 'Aguantarse: es parte del trabajo', ok: false,
          effects: { tiempo: -3, dinero: 0, aprendizaje: 0 },
          why: '312 horas al año en lo mismo. Es casi dos meses de trabajo.' },
        { t: 'Crear 6 respuestas guardadas y una sección de dudas frecuentes', ok: true,
          effects: { tiempo: 3, dinero: 2, reputacion: 1 },
          why: 'Dos horas de trabajo hoy que devuelven cientos de horas al año.' },
        { t: 'Dejar de responder', ok: false,
          effects: { clientes: -3, reputacion: -2, tiempo: 1 },
          why: 'Cada duda sin responder es una venta perdida.' }
      ],
      explain: 'Si lo haces más de 5 veces por semana, hazlo plantilla.' },

    { type: 'write', q: 'Lista tus 5 plantillas prioritarias',
      sub: 'Los mensajes que escribes una y otra vez.',
      ph: '1. Respuesta a “¿cuánto cuesta?”\n2. Cotización\n3. Confirmación\n4. Aviso de entrega\n5. Pedir reseña',
      minWords: 10,
      hints: ['Revisa tus últimos 20 mensajes enviados.'] }
  ],
  mission: {
    id: 'm7-02', title: 'Crea 3 plantillas hoy', dossier: 'procesos',
    brief: 'Escribe tres plantillas y guárdalas donde las tengas a mano. Úsalas esta semana.',
    fields: [
      { key: 'p1', label: 'Plantilla 1', type: 'area', ph: 'Respuesta a “¿cuánto cuesta?”…' },
      { key: 'p2', label: 'Plantilla 2', type: 'area', ph: '' },
      { key: 'p3', label: 'Plantilla 3', type: 'area', ph: '' },
      { key: 'donde', label: '¿Dónde las guardaste?', type: 'text', ph: 'Respuestas rápidas de WhatsApp Business' }
    ],
    rubric: [
      { id: 'a', label: 'Escribiste tres plantillas completas', check: 'filled' },
      { id: 'b', label: 'Dejan espacio para personalizar', check: 'concrete' },
      { id: 'c', label: 'Están guardadas en un lugar accesible', check: 'filled' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 7.3 */
{
  id: 'n7-03', level: 7, icon: '🤲', title: 'Delegar sin perder calidad', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Delegar no es soltar: es entrenar y verificar',
    body: [
      'El motivo por el que la mayoría “no puede delegar” es que delega **la tarea sin el criterio**. Entrega instrucciones pero no el estándar ni la forma de verificar.',
      'La secuencia que funciona: lo hago yo y lo ves → lo hacemos juntos → lo haces y reviso → lo haces y me reportas. Nunca saltes pasos.'
    ],
    keys: [
      'Delega primero lo repetitivo y de bajo riesgo.',
      'Entrega proceso escrito + estándar de calidad + forma de revisar.',
      'Cuatro etapas: demostrar, acompañar, supervisar, soltar.'
    ]
  },
  cas: {
    emoji: '👥', title: 'La primera delegación que sí funcionó',
    text: 'Su primer intento fue “encárgate de las entregas” sin más. Fue un desastre. El segundo: le dio el proceso escrito, el checklist de calidad, hizo dos entregas con ella y revisó las siguientes cinco. A la sexta ya no hacía falta revisar. La diferencia fue el método, no la persona.'
  },
  steps: [
    { type: 'order', q: 'Ordena las etapas de una delegación correcta',
      items: [
        'Lo hago yo y tú observas',
        'Lo hacemos juntos',
        'Lo haces tú y yo reviso todo',
        'Lo haces tú y reviso al azar',
        'Lo haces tú y solo me reportas resultados'
      ],
      explain: 'Cinco etapas. Saltarse alguna es la causa número uno de que “nadie lo hace como yo”.' },

    { type: 'quiz', q: '¿Qué tarea conviene delegar primero?',
      opts: [
        { t: 'La venta a tus mejores clientes', ok: false, why: 'Alto riesgo y alto criterio. Es de lo último que se delega.' },
        { t: 'El empaque y envío de pedidos', ok: true, why: 'Repetitivo, con estándar claro y bajo riesgo si algo se corrige a tiempo.' },
        { t: 'Definir precios', ok: false, why: 'Decisión estratégica: requiere entender márgenes y mercado.' },
        { t: 'Nada, nadie lo hace como yo', ok: false, why: 'Esa frase es la que mantiene a los negocios pequeños para siempre.' }
      ],
      explain: 'Delega lo repetitivo, de bajo riesgo y con estándar claro. En ese orden.' },

    { type: 'multi', q: '¿Qué debes entregar al delegar? (elige todas)',
      opts: [
        { t: 'El proceso escrito', ok: true },
        { t: 'El estándar de calidad esperado', ok: true },
        { t: 'Cómo se va a revisar el resultado', ok: true },
        { t: 'Qué hacer ante una excepción', ok: true },
        { t: 'Solo la instrucción verbal', ok: false }
      ],
      explain: 'Proceso, estándar, verificación y excepciones. Sin eso, delegar es abandonar.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Si nadie hace la tarea como tú, el problema suele ser de la persona.',
      ok: false,
      explain: 'Casi siempre el problema es que delegaste la tarea sin el criterio: sin proceso escrito, sin estándar de calidad y sin decir cómo se va a verificar.' },

    { type: 'sim', q: 'La persona a la que delegaste cometió un error.',
      opts: [
        { t: 'Retomar la tarea tú mismo', ok: false,
          effects: { tiempo: -3, reputacion: 0, aprendizaje: -2 },
          why: 'Vuelves al punto de partida y le enseñas que equivocarse significa perder la tarea.' },
        { t: 'Revisar qué parte del proceso no estaba clara y corregir el documento', ok: true,
          effects: { tiempo: 2, aprendizaje: 3, reputacion: 2 },
          why: 'Casi siempre el error revela un hueco en tu proceso, no una falla de la persona.' },
        { t: 'Regañar y seguir igual', ok: false,
          effects: { reputacion: -2, aprendizaje: -1, tiempo: 0 },
          why: 'El mismo error volverá a ocurrir porque la causa sigue ahí.' }
      ],
      explain: 'Cuando alguien falla siguiendo tu proceso, el proceso es lo que falla.' },

    { type: 'write', q: '¿Qué vas a delegar primero y a quién?',
      sub: 'Elige algo repetitivo, con estándar claro y bajo riesgo.',
      ph: 'El empaque y envío, a mi hermano, dándole el checklist de 5 puntos y revisando los primeros 5 pedidos…',
      minWords: 12,
      hints: ['¿Qué haces muchas veces y no requiere criterio experto?'] }
  ],
  mission: {
    id: 'm7-03', title: 'Tu plan de delegación', dossier: 'procesos',
    brief: 'Elige una tarea, prepara el paquete completo y define cómo la vas a supervisar.',
    fields: [
      { key: 'tarea', label: '¿Qué tarea vas a delegar?', type: 'text', ph: 'Empaque y envío' },
      { key: 'quien', label: '¿A quién?', type: 'text', ph: 'Mi hermano / un ayudante por horas' },
      { key: 'estandar', label: '¿Cuál es el estándar de calidad?', type: 'area', ph: 'Empaque sellado, etiqueta legible, foto antes de enviar' },
      { key: 'revision', label: '¿Cómo vas a verificar?', type: 'text', ph: 'Reviso los primeros 5 pedidos, luego 1 de cada 10' }
    ],
    rubric: [
      { id: 'a', label: 'Elegiste una tarea concreta', check: 'filled' },
      { id: 'b', label: 'Definiste el estándar de calidad', check: 'concrete' },
      { id: 'c', label: 'Definiste cómo verificar', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 7.4 */
{
  id: 'n7-04', level: 7, icon: '📊', title: 'Tu tablero semanal', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Cinco números y quince minutos por semana',
    body: [
      'No necesitas cuarenta indicadores. Necesitas cinco que revises **el mismo día cada semana**: ingresos, gastos, pedidos, ticket promedio y clientes nuevos.',
      'La magia no está en medir: está en la conversación que tienes contigo mismo cada semana mirando esos cinco números.'
    ],
    keys: [
      'Mismo día, misma hora, mismos cinco números.',
      'Un indicador sin decisión asociada es decoración.',
      'Compara contra la semana anterior, no contra tus deseos.'
    ]
  },
  cas: {
    emoji: '🗓️', title: 'Los lunes de 15 minutos',
    text: 'Cada lunes a las 8 am anotaba cinco números y respondía una pregunta: “¿qué haré distinto esta semana?”. En cuatro meses detectó que los meses con más publicaciones eran los de más ingresos, y que su ticket bajaba cuando aceptaba pedidos urgentes. Dos decisiones que salieron de mirar números, no de intuición.'
  },
  steps: [
    { type: 'multi', q: '¿Qué cinco indicadores bastan para empezar? (elige todas)',
      opts: [
        { t: 'Ingresos de la semana', ok: true },
        { t: 'Gastos de la semana', ok: true },
        { t: 'Número de pedidos', ok: true },
        { t: 'Ticket promedio', ok: true },
        { t: 'Clientes nuevos', ok: true },
        { t: 'Seguidores en redes', ok: false }
      ],
      explain: 'Los seguidores no pagan. Los otros cinco cuentan la historia completa.' },

    { type: 'quiz', q: 'Tu ticket promedio bajó de $290 a $210 en un mes. ¿Qué revisas primero?',
      opts: [
        { t: 'Nada, es normal que fluctúe', ok: false, why: 'Una caída del 28% no es fluctuación: es una señal.' },
        { t: 'Si dejaste de ofrecer complementos o si diste más descuentos', ok: true, why: 'Las dos causas más comunes de una caída de ticket. Se corrigen rápido.' },
        { t: 'Cambiar de proveedor', ok: false, why: 'El proveedor afecta el costo, no el ticket promedio.' },
        { t: 'Aumentar la publicidad', ok: false, why: 'Traerías más clientes con el mismo ticket bajo. El problema seguiría.' }
      ],
      explain: 'Cada indicador tiene dos o tres causas típicas. Aprende las tuyas.' },

    { type: 'match', q: 'Empareja el indicador con la decisión que dispara',
      pairs: [
        ['Bajan los pedidos', 'Aumentar contacto y seguimiento'],
        ['Baja el ticket promedio', 'Revisar descuentos y complementos'],
        ['Suben los gastos', 'Revisar categorías y recortar la mayor']
      ],
      explain: 'Cada número debe tener una acción asociada. Si no, no lo midas.' },

    { type: 'sim', q: 'Llevas 3 semanas sin revisar tus números.',
      opts: [
        { t: 'Esperar al cierre de mes', ok: false,
          effects: { aprendizaje: -2, dinero: -1, tiempo: 0 },
          why: 'A fin de mes solo confirmas lo que ya pasó. Perdiste tres oportunidades de corregir.' },
        { t: 'Revisar hoy aunque estén incompletos y agendar el día fijo', ok: true,
          effects: { aprendizaje: 3, dinero: 2, tiempo: -1 },
          why: 'Datos imperfectos hoy valen más que datos perfectos dentro de un mes.' },
        { t: 'Contratar un contador para que lo haga', ok: false,
          effects: { dinero: -2, aprendizaje: 0, tiempo: 1 },
          why: 'El contador reporta el pasado. El tablero semanal es para que TÚ decidas.' }
      ],
      explain: 'La frecuencia importa más que la precisión.' },

    { type: 'write', q: 'Define tu ritual de tablero',
      sub: '¿Qué día, a qué hora y qué cinco números?',
      ph: 'Lunes 8 am: ingresos, gastos, pedidos, ticket promedio y clientes nuevos. Y una pregunta: ¿qué cambio esta semana?',
      minWords: 12,
      hints: ['Elige día y hora fijos.', 'Máximo cinco números.'] }
  ],
  mission: {
    id: 'm7-04', title: 'Arma tu tablero', dossier: 'numeros',
    brief: 'Crea tu tablero de 5 indicadores y llénalo con los datos de la semana pasada.',
    fields: [
      { key: 'dia', label: '¿Qué día y hora lo revisarás?', type: 'text', ph: 'Lunes 8 am' },
      { key: 'ingresos', label: 'Ingresos de la semana ($)', type: 'num', ph: '5400' },
      { key: 'gastos', label: 'Gastos de la semana ($)', type: 'num', ph: '3100' },
      { key: 'pedidos', label: 'Número de pedidos', type: 'num', ph: '18' },
      { key: 'nuevos', label: 'Clientes nuevos', type: 'num', ph: '6' }
    ],
    rubric: [
      { id: 'a', label: 'Llenaste los indicadores con números reales', check: 'numbers' },
      { id: 'b', label: 'Definiste día y hora fijos', check: 'filled' },
      { id: 'c', label: 'Puedes calcular tu ticket promedio', check: 'auto' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 7.5 */
{
  id: 'n7-05', level: 7, icon: '🛎️', title: 'Reclamaciones y clientes molestos', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Una queja bien resuelta crea un cliente más leal que uno sin problemas',
    body: [
      'Los clientes no esperan perfección: esperan **respuesta rápida y solución justa**. Un problema resuelto bien genera más lealtad que una entrega perfecta silenciosa.',
      'El método: escucha sin defenderte, reconoce el hecho (no necesariamente la culpa), propone dos soluciones, cumple y da seguimiento.'
    ],
    keys: [
      'Responde rápido aunque no tengas la solución todavía.',
      'Ofrece dos opciones: el cliente recupera el control.',
      'Documenta cada queja: son el mejor mapa de tus fallas.'
    ]
  },
  cas: {
    emoji: '🔧', title: 'La queja que trajo cinco clientes',
    text: 'Una pieza falló a la semana. Respondió en 20 minutos, ofreció reposición o devolución, la repuso al día siguiente y agregó una pieza extra. El cliente publicó la historia en su grupo de 3,000 miembros. Le llegaron cinco clientes nuevos por esa reseña. La falla costó $80; la reseña valió miles.'
  },
  steps: [
    { type: 'order', q: 'Ordena el método de manejo de una queja',
      items: [
        'Responde rápido, aunque solo sea para decir que lo estás viendo',
        'Escucha completa sin justificarte',
        'Reconoce el hecho: “entiendo, no debió pasar”',
        'Ofrece dos soluciones concretas',
        'Cumple y da seguimiento a los días'
      ],
      explain: 'Velocidad, escucha, reconocimiento, opciones y seguimiento.' },

    { type: 'quiz', q: 'Un cliente escribe molesto porque su pedido llegó tarde. ¿Qué haces primero?',
      opts: [
        { t: 'Explicar por qué se retrasó', ok: false, why: 'Las explicaciones antes de la disculpa suenan a excusa y encienden más al cliente.' },
        { t: 'Responder rápido reconociendo el retraso y ofreciendo dos soluciones', ok: true, why: 'Velocidad y reconocimiento bajan la tensión. Las opciones devuelven el control al cliente.' },
        { t: 'Esperar a que se calme', ok: false, why: 'El silencio multiplica el enojo y suele terminar en reseña negativa.' },
        { t: 'Devolver el dinero sin preguntar', ok: false, why: 'A veces el cliente solo quiere el producto. Devolver de inmediato puede perder la venta y el cliente.' }
      ],
      explain: 'Rápido + reconocer + dos opciones. Casi siempre funciona.' },

    { type: 'multi', q: '¿Qué opciones puedes ofrecer ante una falla? (elige todas)',
      opts: [
        { t: 'Reposición sin costo', ok: true },
        { t: 'Devolución del dinero', ok: true },
        { t: 'Descuento en la siguiente compra', ok: true },
        { t: 'Reparación con plazo comprometido', ok: true },
        { t: 'Ignorar el mensaje', ok: false }
      ],
      explain: 'Ofrece dos, no cinco. Demasiadas opciones paralizan.' },

    { type: 'sim', q: 'El cliente exige algo que no está en tu garantía.',
      opts: [
        { t: 'Ceder a todo para evitar conflicto', ok: false,
          effects: { dinero: -3, reputacion: 1, clientes: 1 },
          why: 'Enseñas que exigiendo se consigue todo. Se corre la voz.' },
        { t: 'Explicar con calma qué cubre la garantía y ofrecer una alternativa razonable', ok: true,
          effects: { dinero: 1, reputacion: 2, clientes: 1 },
          why: 'Firme en la política, flexible en la forma. Es lo que respetan los clientes.' },
        { t: 'Negarse citando el reglamento', ok: false,
          effects: { reputacion: -2, clientes: -2, dinero: 1 },
          why: 'Tener razón y perder al cliente es una victoria cara.' }
      ],
      explain: 'Firme en el fondo, generoso en la forma.' },

    { type: 'write', q: 'Escribe tu respuesta modelo ante una queja',
      sub: 'Rápida, reconociendo el hecho y con dos opciones.',
      ph: 'Lamento mucho que llegara tarde, no debió pasar. Te propongo dos opciones: …',
      minWords: 18,
      hints: ['Empieza reconociendo.', 'Ofrece exactamente dos opciones.', 'Pon un plazo.'] }
  ],
  mission: {
    id: 'm7-05', title: 'Tu política de garantía', dossier: 'procesos',
    brief: 'Define por escrito qué cubres, qué no y en cuánto tiempo respondes. Publícalo donde tus clientes lo vean.',
    fields: [
      { key: 'cubre', label: '¿Qué cubre tu garantía?', type: 'area', ph: 'Rotura por defecto de fabricación en los primeros 6 meses' },
      { key: 'nocubre', label: '¿Qué NO cubre?', type: 'text', ph: 'Mal uso, modificaciones, desgaste normal' },
      { key: 'tiempo', label: '¿En cuánto tiempo respondes una queja?', type: 'text', ph: 'Máximo 4 horas hábiles' },
      { key: 'respuesta', label: 'Tu respuesta modelo', type: 'area', ph: '' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste qué cubre y qué no', check: 'filled' },
      { id: 'b', label: 'Comprometiste un tiempo de respuesta', check: 'filled' },
      { id: 'c', label: 'Tu respuesta modelo ofrece opciones', check: 'concrete' }
    ],
    reward: { xp: 60, coins: 45 }
  }
}

]);
