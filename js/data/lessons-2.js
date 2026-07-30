/* ==========================================================================
   NIVEL 2 — VALIDA · Compruebas si alguien de verdad compraría
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 2.1 */
{
  id: 'n2-01', level: 2, icon: '🧪', title: 'Qué significa validar', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Opinión no es evidencia',
    body: [
      'Validar no es que te digan que tu idea está buena. Validar es **conseguir que alguien haga algo que le cueste**: pagar, apartar, comprometerse o dedicarte tiempo.',
      'Existe una escala de evidencia. En la base están los cumplidos (valen cero). Arriba del todo está el dinero recibido. Todo lo demás está en medio.'
    ],
    keys: [
      'Escala: cumplido < intención < compromiso < anticipo < pago completo.',
      'Si nadie ha pagado, tu negocio sigue siendo una teoría.',
      'Valida antes de producir, no después.'
    ]
  },
  cas: {
    emoji: '🧊', title: '400 “me encanta”, 0 ventas',
    text: 'Una emprendedora publicó su idea de bolsas ecológicas. Recibió 400 reacciones y 60 comentarios entusiastas. Produjo 300 piezas. Vendió 11. Los mismos que aplaudieron no compraron: aplaudir es gratis, comprar cuesta.'
  },
  steps: [
    { type: 'order', q: 'Ordena de MENOS a MÁS evidencia',
      items: [
        '“Qué buena idea, deberías hacerlo”',
        '“Sí, yo lo compraría”',
        '“Avísame cuando lo tengas, aquí está mi teléfono”',
        '“Te doy $200 de anticipo para apartar el mío”',
        '“Ya te pagué completo, ¿cuándo llega?”'
      ],
      explain: 'Cada escalón cuesta más. Solo los últimos dos cuentan como validación real.' },

    { type: 'quiz', q: '¿Cuál de estas situaciones valida mejor tu idea?',
      opts: [
        { t: '50 personas te dijeron que les gusta', ok: false, why: 'Cero costo para ellos. Estadísticamente predice casi nada.' },
        { t: '3 personas te dejaron un anticipo', ok: true, why: 'Tres personas que sueltan dinero valen más que 500 que aplauden.' },
        { t: 'Tu publicación tuvo 5,000 vistas', ok: false, why: 'Alcance no es demanda. Mide atención, no disposición a pagar.' },
        { t: 'Tu familia cree que vas a triunfar', ok: false, why: 'Tu familia te quiere. Ese es el sesgo más caro que existe.' }
      ],
      explain: 'La pregunta correcta no es “¿te gusta?”, es “¿me lo compras hoy?”.' },

    { type: 'multi', q: '¿Qué formas de validar puedes hacer esta semana SIN producir nada? (elige todas)',
      opts: [
        { t: 'Preventa con anticipo del 50%', ok: true },
        { t: 'Lista de espera con teléfono y fecha', ok: true },
        { t: 'Fabricar 100 unidades para ver si se venden', ok: false },
        { t: 'Vender un servicio hecho a mano antes de automatizarlo', ok: true },
        { t: 'Anuncio de prueba con presupuesto pequeño', ok: true },
        { t: 'Rentar un local para probar el flujo', ok: false }
      ],
      explain: 'Todo lo que se puede validar sin inventario ni local, se valida así primero.' },

    { type: 'sim', q: 'Tienes $10,000 ahorrados y una idea. ¿Cómo los usas?',
      opts: [
        { t: 'Comprar material para 100 piezas', ok: false,
          effects: { dinero: -3, aprendizaje: 0, clientes: 0 },
          why: 'Convertiste dinero líquido en inventario que quizá nadie quiera. Es el error clásico.' },
        { t: 'Hacer 5 piezas de muestra y salir a preventa', ok: true,
          effects: { dinero: -1, aprendizaje: 3, clientes: 3 },
          why: 'Gastaste poco, aprendiste mucho y te quedaste con $9,000 para reaccionar.' },
        { t: 'Guardarlos hasta estar 100% seguro', ok: false,
          effects: { dinero: 0, aprendizaje: 0, clientes: 0 },
          why: 'La certeza no llega en el escritorio. Llega vendiendo.' }
      ],
      explain: 'Gasta lo mínimo necesario para conseguir la siguiente pieza de evidencia.' },

    { type: 'write', q: '¿Cuál es la parte de tu idea que, si fuera falsa, todo se cae?',
      sub: 'Ese es tu riesgo número uno y es lo primero que hay que probar.',
      ph: 'Que la gente esté dispuesta a esperar 5 días por una pieza en lugar de comprar una genérica hoy…',
      minWords: 10,
      hints: ['¿Que exista el problema?', '¿Que paguen ese precio?', '¿Que te encuentren?'] }
  ],
  mission: {
    id: 'm2-01', title: 'Tu prueba más barata', dossier: null,
    brief: 'Diseña el experimento más barato y rápido que pueda darte una respuesta real en 7 días.',
    fields: [
      { key: 'riesgo', label: 'El supuesto que vas a probar', type: 'text', ph: 'Que pagan $220 por una placa personalizada' },
      { key: 'prueba', label: '¿Cómo lo vas a probar? (sin producir)', type: 'area', ph: 'Ofrecer preventa con anticipo de $100 a 20 personas del grupo…' },
      { key: 'senal', label: '¿Qué resultado te diría que SÍ funciona?', type: 'text', ph: '3 anticipos en 7 días' }
    ],
    rubric: [
      { id: 'a', label: 'Identificaste un supuesto concreto', check: 'filled' },
      { id: 'b', label: 'La prueba no requiere producir antes', check: 'reason' },
      { id: 'c', label: 'Definiste una señal numérica de éxito', check: 'measurable' }
    ],
    reward: { xp: 40, coins: 25 }
  }
},

/* ------------------------------------------------------------------ 2.2 */
{
  id: 'n2-02', level: 2, icon: '🎤', title: 'La entrevista que sí sirve', xp: 25, min: 7,
  concept: {
    tag: 'Concepto', title: 'Pregunta por el pasado, no por el futuro',
    body: [
      'La gente miente sobre el futuro sin querer. “¿Comprarías esto?” siempre recibe un sí amable. Pero **el pasado no se puede inventar**.',
      'Por eso preguntas: ¿cuándo fue la última vez que te pasó? ¿qué hiciste? ¿cuánto te costó? Ahí aparece la verdad, con fechas y cantidades.'
    ],
    keys: [
      'Nunca menciones tu idea al principio: contamina las respuestas.',
      'Pregunta por hechos ocurridos, no por intenciones.',
      'Si no duele lo suficiente para haber hecho algo, no duele.'
    ]
  },
  cas: {
    emoji: '☕', title: 'Dos preguntas, dos mundos',
    text: '“¿Te gustaría una app para organizar tus pedidos?” — “Claro, súper útil.” \n“¿Cómo organizaste tus pedidos la semana pasada?” — “En una libreta… se me perdió el martes y perdí dos ventas.” La segunda pregunta reveló el problema, la frecuencia y el costo.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es la mejor primera pregunta en una entrevista de descubrimiento?',
      opts: [
        { t: '¿Comprarías mi producto si costara $200?', ok: false, why: 'Pregunta hipotética + tu idea de por medio. Recibirás un sí de cortesía.' },
        { t: 'Cuéntame cómo resolviste esto la última vez que te pasó', ok: true, why: 'Pide un hecho concreto del pasado. Ahí no hay cortesía posible.' },
        { t: '¿Verdad que es un problema horrible?', ok: false, why: 'Pregunta dirigida: le estás dictando la respuesta.' },
        { t: '¿Cuánto pagarías por resolverlo?', ok: false, why: 'La gente es pésima estimando lo que pagaría. Mira lo que ya paga.' }
      ],
      explain: 'Regla de oro: hechos del pasado, nunca promesas del futuro.' },

    { type: 'multi', q: 'Marca las preguntas que SÍ sirven',
      opts: [
        { t: '¿Cuándo fue la última vez que te pasó?', ok: true },
        { t: '¿Te parece buena mi idea?', ok: false },
        { t: '¿Qué hiciste para resolverlo?', ok: true },
        { t: '¿Cuánto te costó en dinero o tiempo?', ok: true },
        { t: '¿Usarías una app que hiciera esto?', ok: false },
        { t: '¿Con quién más debería hablar de esto?', ok: true }
      ],
      explain: 'Las cuatro buenas piden hechos. Las dos malas piden opiniones sobre el futuro.' },

    { type: 'order', q: 'Ordena la estructura de una entrevista de 10 minutos',
      items: [
        'Explica que estás investigando, no vendiendo',
        'Pregunta por la última vez que ocurrió el problema',
        'Indaga qué hizo para resolverlo y cuánto le costó',
        'Pregunta qué es lo más frustrante de esa solución',
        'Pide que te recomiende a alguien más con el mismo problema'
      ],
      explain: 'Contexto → hecho → costo → frustración → referido. Cinco pasos, diez minutos.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Debes explicar tu idea al inicio para que la persona entienda de qué hablas.',
      ok: false,
      explain: 'Al revés: si la explicas primero, la persona intentará ser amable con tu idea y perderás la información real. Menciónala al final, si acaso.' },

    { type: 'write', q: 'Escribe tus 3 preguntas para mañana',
      sub: 'Todas deben pedir hechos del pasado, no opiniones.',
      ph: '1. ¿Cuándo fue la última vez que se te rompió una pieza así?\n2. ¿Qué hiciste?\n3. ¿Cuánto te costó resolverlo?',
      minWords: 12,
      hints: ['Empieza con “cuándo”, “qué hiciste”, “cuánto”.', 'Evita “te gustaría” y “comprarías”.'] }
  ],
  mission: {
    id: 'm2-02', title: 'Tu guion de entrevista', dossier: null,
    brief: 'Prepara el guion y agenda al menos una conversación real para las próximas 48 horas.',
    fields: [
      { key: 'guion', label: 'Tus 5 preguntas', type: 'area', ph: '1. ...\n2. ...' },
      { key: 'quien', label: '¿A quién se lo vas a preguntar? (nombre o descripción)', type: 'text', ph: 'Marisol, dueña de la estética de la esquina' }
    ],
    rubric: [
      { id: 'a', label: 'Tienes al menos 5 preguntas', check: 'steps' },
      { id: 'b', label: 'Las preguntas piden hechos del pasado', check: 'pastq' },
      { id: 'c', label: 'Identificaste a una persona concreta', check: 'named' }
    ],
    reward: { xp: 40, coins: 25 }
  }
},

/* ------------------------------------------------------------------ 2.3 */
{
  id: 'n2-03', level: 2, icon: '🙈', title: 'Preguntas que mienten', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Cómo la gente te dice sí sin querer decirlo',
    body: [
      'Nadie quiere lastimarte. Por eso, cuando preguntas mal, recibes respuestas amables que te llevan directo a producir algo que nadie compra.',
      'Existen tres trampas: la **pregunta hipotética** (“¿usarías…?”), la **pregunta dirigida** (“¿verdad que sería útil?”) y el **elogio genérico** (“me encanta tu idea”). Tu trabajo es convertir cada elogio en un compromiso.'
    ],
    keys: [
      'Un cumplido es una alarma, no un premio.',
      'Convierte todo “sí” en un paso concreto: fecha, anticipo o dato de contacto.',
      'Si esquivan el compromiso, ya tienes tu respuesta.'
    ]
  },
  cas: {
    emoji: '🧯', title: 'El sí que no era sí',
    text: 'Un emprendedor recibió 12 “sí, yo te compro” en una feria. Al lanzar, todos se esfumaron. Repitió el ejercicio pidiendo $50 de anticipo reembolsable: de 12 personas, 2 pagaron. Esas 2 eran su mercado real. Con ese dato ajustó precio y producto en vez de fabricar para 12 fantasmas.'
  },
  steps: [
    { type: 'match', q: 'Empareja la trampa con su antídoto',
      pairs: [
        ['“¿Usarías algo así?”', 'Pregunta qué usó la última vez'],
        ['“Me encanta tu idea”', 'Pide un anticipo o una fecha'],
        ['“¿Verdad que es útil?”', 'Deja de opinar y pide un hecho']
      ],
      explain: 'Cada respuesta amable se convierte en información solo si pides un compromiso.' },

    { type: 'quiz', q: 'Alguien te dice: “Está increíble, avísame cuando lo lances”. ¿Qué respondes?',
      opts: [
        { t: '“¡Gracias! Te aviso”', ok: false, why: 'Perdiste la oportunidad. Ese contacto se va a evaporar.' },
        { t: '“¿Te aparto uno con $100 de anticipo, reembolsable si no te convence?”', ok: true, why: 'Conviertes el entusiasmo en una prueba real. Su respuesta te dice la verdad.' },
        { t: '“¿De verdad te gusta?”', ok: false, why: 'Estás pidiendo otro cumplido. Los cumplidos no pagan renta.' },
        { t: '“Es que va a costar $200, ¿está bien?”', ok: false, why: 'Preguntas por el precio en abstracto en vez de pedir la acción.' }
      ],
      explain: 'La frase mágica: “¿te lo aparto?”. Separa a los curiosos de los compradores.' },

    { type: 'multi', q: '¿Qué señales indican que el “sí” es falso? (elige todas)',
      opts: [
        { t: 'Elogia mucho pero cambia de tema al hablar de precio', ok: true },
        { t: 'Pregunta cuándo puede recogerlo', ok: false },
        { t: 'Dice “cualquier cosa me avisas” sin dejar contacto', ok: true },
        { t: 'Pide ver más fotos y opciones de pago', ok: false },
        { t: 'Habla en condicional: “si algún día…”', ok: true }
      ],
      explain: 'Los compradores reales preguntan por logística: cuándo, cómo pago, cuánto tarda.' },

    { type: 'sim', q: 'De 20 conversaciones, 18 fueron elogios y 2 anticipos. ¿Qué haces?',
      opts: [
        { t: 'Celebrar: 18 de 20 les gustó', ok: false,
          effects: { aprendizaje: -2, dinero: 0, clientes: 0 },
          why: 'Ese 90% es humo. Te llevará a producir de más.' },
        { t: 'Entrevistar a los 2 que pagaron para entender qué los movió', ok: true,
          effects: { aprendizaje: 3, clientes: 2, dinero: 1 },
          why: 'Los que pagan te dicen la verdad sobre tu oferta, tu precio y tu cliente ideal.' },
        { t: 'Bajar el precio para convencer a los otros 18', ok: false,
          effects: { dinero: -2, aprendizaje: 0, clientes: 1 },
          why: 'El precio rara vez es la razón. Casi siempre es que no tienen el problema.' }
      ],
      explain: 'Estudia a quien paga, no a quien aplaude.' },

    { type: 'write', q: 'Reescribe esta pregunta para que no mienta',
      sub: '“¿Te gustaría comprar mi producto?” → tu versión',
      ph: '¿Cuándo fue la última vez que compraste algo parecido y cuánto pagaste?',
      minWords: 8,
      hints: ['Cambia el futuro por el pasado.', 'Pide un dato, no una opinión.'] }
  ],
  mission: {
    id: 'm2-03', title: 'Convierte un elogio en compromiso', dossier: null,
    brief: 'Busca a alguien que ya te haya dicho “qué buena idea” y pídele un paso concreto: anticipo, fecha o dato de contacto.',
    fields: [
      { key: 'persona', label: '¿A quién se lo pediste?', type: 'text', ph: 'Marisol, la de la estética' },
      { key: 'peticion', label: '¿Qué compromiso le pediste exactamente?', type: 'text', ph: '$100 de anticipo reembolsable para apartar' },
      { key: 'resultado', label: '¿Qué pasó?', type: 'area', ph: 'Dijo que lo pensaba. No dejó anticipo pero sí dio su teléfono…' }
    ],
    rubric: [
      { id: 'a', label: 'Se lo pediste a una persona concreta', check: 'named' },
      { id: 'b', label: 'El compromiso tenía un costo real', check: 'commit' },
      { id: 'c', label: 'Registraste el resultado sin adornarlo', check: 'filled' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 2.4 */
{
  id: 'n2-04', level: 2, icon: '🎁', title: 'Tu oferta en una frase', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Producto ≠ oferta',
    body: [
      'El producto es lo que haces. La **oferta** es la promesa completa: para quién es, qué resultado entrega, qué incluye, cuánto cuesta, en cuánto tiempo y qué pasa si algo sale mal.',
      'La fórmula que funciona: *Ayudo a [cliente] a [resultado] mediante [producto], en [tiempo], con [garantía], por [precio]*.'
    ],
    keys: [
      'El cliente no compra el objeto: compra el resultado.',
      'Una oferta sin plazo y sin garantía obliga al cliente a asumir todo el riesgo.',
      'Si tu oferta necesita explicación de 5 minutos, todavía no está lista.'
    ]
  },
  cas: {
    emoji: '🏷️', title: 'La misma pieza, dos ofertas',
    text: 'Oferta A: “Vendo piezas impresas en 3D, precio según diseño.” \nOferta B: “Reemplazo la pieza rota de tu electrodoméstico descontinuado en 48 horas, desde $180, y si no embona te devuelvo tu dinero.” El producto es idéntico. La segunda vende cinco veces más porque elimina las dudas del cliente.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál de estas es una oferta completa?',
      opts: [
        { t: 'Vendo pasteles caseros', ok: false, why: 'Es un producto, no una oferta: no dice para quién, cuándo ni cuánto.' },
        { t: 'Pasteles personalizados de la mejor calidad', ok: false, why: '“Mejor calidad” no significa nada. Sigue sin haber promesa concreta.' },
        { t: 'Pastel personalizado para cumpleaños infantiles, entregado en tu casa el mismo día, desde $650, y si no le gusta al festejado no lo cobro', ok: true, why: 'Cliente, resultado, formato, tiempo, precio y garantía. Todo resuelto en una frase.' },
        { t: 'Los mejores pasteles de la ciudad, pregunta por tu cotización', ok: false, why: '“Pregunta por tu cotización” es fricción: el cliente tiene que trabajar para saber si le sirve.' }
      ],
      explain: 'Cliente + resultado + qué incluye + tiempo + precio + garantía.' },

    { type: 'order', q: 'Ordena los elementos de la fórmula de oferta',
      items: [
        'A quién va dirigida',
        'Qué resultado consigue',
        'Qué incluye exactamente',
        'En cuánto tiempo lo entregas',
        'Cuánto cuesta',
        'Qué pasa si algo sale mal'
      ],
      explain: 'Cuando este orden está claro, la venta deja de ser una discusión.' },

    { type: 'multi', q: '¿Qué elementos reducen el riesgo percibido por el cliente? (elige todas)',
      opts: [
        { t: 'Garantía de devolución', ok: true },
        { t: 'Fecha de entrega comprometida', ok: true },
        { t: 'Frases como “calidad premium”', ok: false },
        { t: 'Fotos de trabajos anteriores reales', ok: true },
        { t: 'Opción de pagar la mitad al recibir', ok: true },
        { t: 'Un logo bonito', ok: false }
      ],
      explain: 'El cliente compra cuando siente que no puede salir perdiendo.' },

    { type: 'sim', q: 'Tu producto cuesta lo mismo que el de tu competencia. ¿Qué agregas?',
      opts: [
        { t: 'Un descuento del 20%', ok: false,
          effects: { dinero: -3, reputacion: 0, clientes: 1 },
          why: 'Regalaste margen. Y el cliente que llega por descuento se va con el siguiente descuento.' },
        { t: 'Garantía de reposición y entrega en 48 h', ok: true,
          effects: { dinero: 0, reputacion: 3, clientes: 2 },
          why: 'Aumentas el valor percibido sin tocar tu margen. Cuesta poco y vende mucho.' },
        { t: 'Más variedad de colores', ok: false,
          effects: { dinero: -1, reputacion: 1, clientes: 0 },
          why: 'Más opciones = más inventario y más dudas para el cliente.' }
      ],
      explain: 'Antes de bajar el precio, sube la certeza.' },

    { type: 'write', q: 'Escribe tu oferta con la fórmula',
      sub: 'Ayudo a [cliente] a [resultado] mediante [producto], en [tiempo], con [garantía], por [precio].',
      ph: 'Ayudo a dueños de perros grandes a que su perro nunca se pierda mediante placas grabadas irrompibles, en 48 horas, con garantía de 1 año, por $220…',
      minWords: 18,
      hints: ['Incluye un plazo.', 'Incluye un precio.', 'Incluye qué pasa si falla.'] }
  ],
  mission: {
    id: 'm2-04', title: 'Tu oferta escrita', dossier: 'oferta',
    brief: 'Redáctala para publicarla tal cual. Debe entenderse en 10 segundos sin que tú expliques nada.',
    fields: [
      { key: 'oferta', label: 'Tu oferta completa', type: 'area',
        ph: 'Ayudo a [cliente] a [resultado] mediante [producto], en [tiempo], con [garantía], por [precio].' },
      { key: 'incluye', label: '¿Qué incluye exactamente?', type: 'text', ph: 'Placa + grabado + argolla + envío' },
      { key: 'garantia', label: 'Tu garantía', type: 'text', ph: 'Si se borra en 1 año, la repongo gratis' }
    ],
    rubric: [
      { id: 'a', label: 'Nombra a un cliente concreto', check: 'audience' },
      { id: 'b', label: 'Promete un resultado, no solo un objeto', check: 'outcome' },
      { id: 'c', label: 'Incluye precio y plazo', check: 'quote2' },
      { id: 'd', label: 'Ofrece una garantía clara', check: 'filled' }
    ],
    reward: { xp: 60, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 2.5 */
{
  id: 'n2-05', level: 2, icon: '💵', title: 'Preventa: el único voto real', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Vende antes de producir',
    body: [
      'La preventa parece atrevida, pero es la forma más honesta de validar: **si nadie paga por adelantado, tampoco iba a pagar después**.',
      'Además resuelve dos problemas de golpe: te dice la verdad sobre la demanda y te financia el primer lote sin deuda.'
    ],
    keys: [
      'Anticipo del 30-50% es lo normal en productos personalizados.',
      'Ofrece devolución total si no cumples: elimina el miedo del cliente.',
      'Pon fecha límite y cupo: sin escasez, la gente pospone.'
    ]
  },
  cas: {
    emoji: '📦', title: 'El lote financiado por los clientes',
    text: 'Antes de comprar material, ofreció 15 piezas de un diseño nuevo con 40% de anticipo y entrega en 3 semanas. Vendió 9. Con ese dinero compró el material exacto. Cero inventario muerto, cero deuda, y supo qué diseño repetir.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es el mayor beneficio de la preventa?',
      opts: [
        { t: 'Cobras más caro', ok: false, why: 'Normalmente cobras igual o incluso con descuento por ser primeros.' },
        { t: 'Sabes exactamente cuánto producir y no arriesgas capital', ok: true, why: 'Produces contra pedidos reales: cero inventario muerto y cero deuda.' },
        { t: 'Evitas dar garantía', ok: false, why: 'Al contrario: en preventa la garantía es más importante que nunca.' },
        { t: 'No necesitas hablar con clientes', ok: false, why: 'La preventa exige más conversación, no menos.' }
      ],
      explain: 'Preventa = demanda comprobada + capital de trabajo, al mismo tiempo.' },

    { type: 'multi', q: '¿Qué debe incluir una preventa honesta? (elige todas)',
      opts: [
        { t: 'Fecha de entrega clara', ok: true },
        { t: 'Política de devolución del anticipo', ok: true },
        { t: 'Prometer que llegará “pronto”', ok: false },
        { t: 'Cupo limitado y fecha de cierre', ok: true },
        { t: 'Fotos o muestra de lo que van a recibir', ok: true },
        { t: 'Cobrar el 100% sin fecha', ok: false }
      ],
      explain: 'Fecha, devolución, cupo y muestra. Sin esos cuatro, la preventa daña tu reputación.' },

    { type: 'slider', q: '¿Qué anticipo pides en una preventa de producto personalizado?',
      min: 0, max: 100, step: 10, value: 0, unit: '%',
      best: [30, 50],
      bands: [
        { max: 20, label: 'Muy bajo', tone: 'warn', msg: 'Menos del 30% no compromete al cliente y tú financias el material.' },
        { max: 50, label: 'Punto justo', tone: 'ok', msg: '30-50% cubre tu material y filtra a los indecisos sin espantar a nadie.' },
        { max: 100, label: 'Demasiado', tone: 'bad', msg: 'Pedir más del 50% por adelantado a un cliente que no te conoce genera desconfianza.' }
      ],
      explain: 'El anticipo debe cubrir tu material, no tu utilidad.' },

    { type: 'sim', q: 'Ofreces preventa a 30 personas. Nadie paga. ¿Qué concluyes?',
      opts: [
        { t: 'Que necesito más publicidad', ok: false,
          effects: { dinero: -2, aprendizaje: 0, clientes: 0 },
          why: 'Amplificar una oferta que no convence solo hace que más gente la rechace.' },
        { t: 'Que algo falla: el público, el problema, la oferta o el precio. Toca preguntar', ok: true,
          effects: { aprendizaje: 3, dinero: 0, clientes: 1 },
          why: 'Un cero es información valiosa y barata. Pregunta a los que dijeron no.' },
        { t: 'Que la gente no entiende mi producto', ok: false,
          effects: { aprendizaje: -1, dinero: 0, clientes: 0 },
          why: 'Si no lo entienden, el problema es tuyo, no de ellos. Pero rara vez es lo único.' }
      ],
      explain: 'Un rechazo temprano cuesta una semana. Un rechazo tardío cuesta tu inventario.' },

    { type: 'write', q: 'Redacta tu mensaje de preventa',
      sub: 'Debe incluir: qué es, para quién, precio, anticipo, fecha de entrega y garantía.',
      ph: 'Abro 10 lugares de la primera tanda de placas grabadas. Anticipo $100, entrega el 15, y si no te gusta te devuelvo todo…',
      minWords: 25,
      hints: ['Pon un cupo.', 'Pon una fecha.', 'Di qué pasa si no le gusta.'] }
  ],
  mission: {
    id: 'm2-05', title: 'Lanza tu preventa', dossier: null,
    brief: 'Ofrece tu producto a 10 personas con anticipo. Aunque sea incómodo, este es el paso que separa una idea de un negocio.',
    fields: [
      { key: 'mensaje', label: 'El mensaje que enviaste', type: 'area', ph: '' },
      { key: 'enviados', label: '¿A cuántas personas se lo enviaste?', type: 'num', ph: '10' },
      { key: 'anticipos', label: '¿Cuántos anticipos conseguiste?', type: 'num', ph: '2' },
      { key: 'objecion', label: '¿Cuál fue la objeción más repetida?', type: 'text', ph: '“Está caro” / “Déjame pensarlo”' }
    ],
    rubric: [
      { id: 'a', label: 'Enviaste la oferta a 10 personas', check: 'ten' },
      { id: 'b', label: 'El mensaje incluye precio y fecha', check: 'quote2' },
      { id: 'c', label: 'Registraste la objeción principal', check: 'filled' }
    ],
    reward: { xp: 70, coins: 50 }
  }
},

/* ------------------------------------------------------------------ 2.6 */
{
  id: 'n2-06', level: 2, icon: '📣', title: 'La prueba pública', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Un anuncio también es un experimento',
    body: [
      'Antes de invertir en producción, puedes publicar tu oferta y medir qué pasa. No buscas ventas todavía: buscas **saber si la gente reacciona**.',
      'Con $200 de publicidad o una publicación en el grupo correcto puedes descubrir en 48 horas lo que tardarías tres meses en aprender fabricando.'
    ],
    keys: [
      'Mide reacciones que cuestan algo: mensajes, clics, apartados.',
      'Prueba dos versiones del mismo mensaje, no una.',
      'El titular importa más que la foto.'
    ]
  },
  cas: {
    emoji: '🅰️', title: 'Dos textos, un ganador',
    text: 'Publicó el mismo producto con dos titulares. A: “Placas personalizadas para tu mascota”. B: “Tu perro se pierde y nadie sabe a quién llamar. Esto lo evita.” El B recibió 6 veces más mensajes. Mismo producto, mismo precio: cambió el problema que nombraba.'
  },
  steps: [
    { type: 'quiz', q: 'Publicas tu oferta y obtienes 800 vistas y 0 mensajes. ¿Qué significa?',
      opts: [
        { t: 'Que el algoritmo no me favorece', ok: false, why: 'Con 800 vistas hubo alcance suficiente. El problema es el mensaje.' },
        { t: 'Que el mensaje no conecta con un problema que la gente sienta', ok: true, why: 'Alcance sin reacción = oferta que no toca un dolor real o no se entiende.' },
        { t: 'Que debo publicar más veces lo mismo', ok: false, why: 'Repetir un mensaje que no funciona multiplica el fracaso, no lo corrige.' },
        { t: 'Que el producto está mal hecho', ok: false, why: 'Nadie lo ha visto en persona. Lo que falló fue la promesa, no el producto.' }
      ],
      explain: 'Vistas altas + reacciones cero = el problema está en el titular o en el público.' },

    { type: 'order', q: 'Ordena las partes de una publicación que sí funciona',
      items: [
        'Nombra el problema en la primera línea',
        'Di para quién es exactamente',
        'Muestra el resultado, no las características',
        'Da precio o rango de precio',
        'Termina con una acción simple: “escríbeme la palabra PLACA”'
      ],
      explain: 'Problema → público → resultado → precio → acción. Sin acción clara, no hay medición.' },

    { type: 'multi', q: '¿Qué métricas indican interés REAL? (elige todas)',
      opts: [
        { t: 'Mensajes preguntando precio o disponibilidad', ok: true },
        { t: 'Reacciones y likes', ok: false },
        { t: 'Personas que dejan su teléfono', ok: true },
        { t: 'Compartidos con comentario “esto te sirve, @Ana”', ok: true },
        { t: 'Alcance total', ok: false }
      ],
      explain: 'Toda métrica que implique escribir, dejar datos o etiquetar a alguien vale. Las pasivas no.' },

    { type: 'slider', q: 'De 100 personas que ven tu publicación, ¿cuántos mensajes serían buena señal?',
      min: 0, max: 20, step: 1, value: 10, unit: ' mensajes',
      best: [2, 6],
      bands: [
        { max: 1, label: 'Señal débil', tone: 'warn', msg: 'Menos de 2 de cada 100 suele indicar que el mensaje no conecta.' },
        { max: 6, label: 'Buena señal', tone: 'ok', msg: '2-6 mensajes por cada 100 vistas es una respuesta sana para una oferta nueva.' },
        { max: 20, label: 'Sospechoso', tone: 'bad', msg: 'Más de 10 de cada 100 casi siempre significa que estás regalando algo o el precio es muy bajo.' }
      ],
      explain: 'Entre 2% y 6% de respuesta es un termómetro realista.' },

    { type: 'write', q: 'Escribe dos titulares distintos para la misma oferta',
      sub: 'Uno enfocado en el producto y otro en el problema. Después compáralos en la vida real.',
      ph: 'A: Placas grabadas para mascotas desde $220.\nB: Si tu perro se pierde, ¿quién sabe a quién llamar?',
      minWords: 12,
      hints: ['Uno debe empezar nombrando el dolor.', 'Ambos deben ser cortos.'] }
  ],
  mission: {
    id: 'm2-06', title: 'Publica y mide', dossier: null,
    brief: 'Publica tu oferta en el lugar donde está tu cliente. Anota vistas, mensajes y qué preguntaron.',
    fields: [
      { key: 'texto', label: 'Texto publicado', type: 'area', ph: '' },
      { key: 'donde', label: '¿Dónde lo publicaste?', type: 'text', ph: 'Grupo de FB “Perros CDMX”' },
      { key: 'vistas', label: 'Vistas aproximadas', type: 'num', ph: '400' },
      { key: 'mensajes', label: 'Mensajes recibidos', type: 'num', ph: '7' },
      { key: 'preguntas', label: '¿Qué preguntaron más?', type: 'text', ph: 'Cuánto tarda y si aguanta el agua' }
    ],
    rubric: [
      { id: 'a', label: 'Publicaste en un canal donde está tu cliente', check: 'filled' },
      { id: 'b', label: 'Mediste vistas y mensajes', check: 'numbers' },
      { id: 'c', label: 'Registraste las dudas más frecuentes', check: 'filled' }
    ],
    reward: { xp: 50, coins: 35 }
  }
},

/* ------------------------------------------------------------------ 2.7 */
{
  id: 'n2-07', level: 2, icon: '🚦', title: 'Señales de avanzar o parar', xp: 30, min: 6,
  concept: {
    tag: 'Concepto', title: 'Cuándo seguir, cuándo ajustar, cuándo soltar',
    body: [
      'Validar no siempre da un sí. A veces da un “sí, pero”. Saber leer la señal evita dos errores caros: **abandonar algo que sí funcionaba** y **insistir en algo que ya dijo que no**.',
      'Verde: alguien pagó y volvería a pagar. Amarillo: hay interés pero el precio, el formato o el público están mal. Rojo: nadie mueve un dedo aunque el mensaje sea claro.'
    ],
    keys: [
      'Verde = pagos repetidos o referidos espontáneos.',
      'Amarillo = interés sin pago: ajusta oferta, precio o público.',
      'Rojo = indiferencia con mensaje claro: cambia el problema, no el logo.'
    ]
  },
  cas: {
    emoji: '🔀', title: 'El pivote correcto',
    text: 'Vendía organizadores impresos en 3D a estudiantes: mucho interés, cero compras (no tenían dinero). Cambió el mismo producto a consultorios dentales, que sí pagaban y compraban por docenas. No cambió el producto: cambió al cliente. Eso también es pivotar.'
  },
  steps: [
    { type: 'match', q: 'Empareja la señal con la decisión correcta',
      pairs: [
        ['3 clientes pagaron y 1 recomendó', 'Avanza: sigue vendiendo así'],
        ['Muchos preguntan pero nadie paga', 'Ajusta: precio, formato o público'],
        ['Nadie responde ni pregunta', 'Cambia: el problema no duele lo suficiente']
      ],
      explain: 'Interpretar bien la señal te ahorra meses.' },

    { type: 'quiz', q: '10 personas dicen que les encanta pero todas dicen “está caro”. ¿Qué haces primero?',
      opts: [
        { t: 'Bajar el precio a la mitad', ok: false, why: 'Antes de tocar el precio hay que revisar si el valor está bien comunicado. Muchas veces “caro” significa “no entiendo qué recibo”.' },
        { t: 'Preguntar “¿comparado con qué?” y revisar si estoy hablando con el público correcto', ok: true, why: '“Caro” es relativo. La respuesta revela si el problema es el precio, el valor comunicado o el cliente.' },
        { t: 'Abandonar la idea', ok: false, why: 'Interés alto con objeción de precio es una señal amarilla, no roja.' },
        { t: 'Insistir con el mismo mensaje', ok: false, why: 'Repetir sin ajustar es la definición de terquedad, no de perseverancia.' }
      ],
      explain: '“Está caro” casi siempre significa: valor poco claro o cliente equivocado.' },

    { type: 'multi', q: '¿Qué cosas puedes cambiar sin abandonar la idea? (elige todas)',
      opts: [
        { t: 'El cliente al que le vendes', ok: true },
        { t: 'El precio y la forma de pago', ok: true },
        { t: 'El formato de entrega (servicio, suscripción, paquete)', ok: true },
        { t: 'El canal donde lo ofreces', ok: true },
        { t: 'Tu nivel de esfuerzo', ok: false }
      ],
      explain: 'Cliente, precio, formato y canal: cuatro palancas antes de tirar la toalla.' },

    { type: 'sim', q: 'Llevas 6 semanas validando. 2 ventas, ambas a familiares. ¿Qué haces?',
      opts: [
        { t: 'Seguir igual: ya hay ventas', ok: false,
          effects: { aprendizaje: -1, dinero: 0, clientes: 0 },
          why: 'Las ventas a familiares no validan nada: compran por cariño, no por necesidad.' },
        { t: 'Salir a vender a desconocidos del nicho elegido', ok: true,
          effects: { aprendizaje: 3, clientes: 2, dinero: 1 },
          why: 'La única prueba real es un extraño que paga. Ahí sabrás si el negocio existe.' },
        { t: 'Rendirme', ok: false,
          effects: { aprendizaje: 0, clientes: -2, dinero: 0 },
          why: 'Todavía no has probado con el público correcto. Rendirse ahora es rendirse sin datos.' }
      ],
      explain: 'Cliente desconocido que paga = la señal verde definitiva.' },

    { type: 'write', q: '¿En qué semáforo estás hoy?',
      sub: 'Sé honesto. La honestidad aquí te ahorra dinero después.',
      ph: 'Amarillo: 12 personas preguntaron, 1 pagó. Creo que el precio está bien pero el público no es el correcto…',
      minWords: 12,
      hints: ['¿Alguien que no conoces te ha pagado?', '¿Qué palanca vas a mover primero?'] }
  ],
  mission: {
    id: 'm2-07', title: 'Tu veredicto de validación', dossier: 'problema',
    brief: 'Cierra el nivel con una decisión escrita: avanzas, ajustas o cambias. Con evidencia, no con corazonadas.',
    fields: [
      { key: 'evidencia', label: '¿Qué evidencia real tienes? (pagos, anticipos, compromisos)', type: 'area', ph: '2 anticipos de personas que no conozco, 7 mensajes preguntando precio…' },
      { key: 'semaforo', label: '¿Verde, amarillo o rojo? ¿Por qué?', type: 'area', ph: 'Amarillo, porque hay interés pero solo 1 de 10 paga…' },
      { key: 'ajuste', label: '¿Qué palanca vas a mover?', type: 'text', ph: 'Cambiar de estudiantes a consultorios' }
    ],
    rubric: [
      { id: 'a', label: 'Describiste evidencia concreta', check: 'numbers' },
      { id: 'b', label: 'Justificaste tu veredicto', check: 'reason' },
      { id: 'c', label: 'Elegiste una acción siguiente', check: 'filled' }
    ],
    reward: { xp: 65, coins: 45 }
  }
}

]);
