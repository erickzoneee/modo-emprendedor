/* ==========================================================================
   NIVEL 3 — CONSTRUYE · Creas tu producto mínimo viable y le pones precio
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 3.1 */
{
  id: 'n3-01', level: 3, icon: '🧱', title: 'Qué es un MVP de verdad', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Mínimo, pero viable',
    body: [
      'Un MVP no es una versión incompleta ni de mala calidad. Es **la forma más pequeña de entregar el resultado completo** que prometiste.',
      'La prueba: si tu cliente lo usa y consigue lo que quería, es un MVP. Si lo usa y queda a medias, es un producto mal hecho con nombre elegante.'
    ],
    keys: [
      'Mínimo en alcance, nunca en resultado.',
      'Puede ser manual, feo o lento: no puede incumplir la promesa.',
      'Sirve para aprender, no para impresionar.'
    ]
  },
  cas: {
    emoji: '🛵', title: 'El MVP hecho a mano',
    text: 'Un servicio de comida a domicilio empezó sin app: un número de WhatsApp, un menú en imagen y el dueño en moto. Entregaba el resultado completo (comida caliente en 30 minutos) con el mínimo montaje. Cuando tuvo 200 pedidos semanales, ahí sí construyó el sistema.'
  },
  steps: [
    { type: 'quiz', q: 'Prometes “placas que no se borran en 1 año”. ¿Cuál es un MVP válido?',
      opts: [
        { t: 'Una placa impresa con grabado real, entregada a mano, sin empaque ni marca', ok: true, why: 'Cumple la promesa completa. Lo que falta (empaque, marca, envío) es adorno.' },
        { t: 'Una placa con el nombre escrito con plumón que se borra en semanas', ok: false, why: 'Incumple la promesa central. Eso no es mínimo, es defectuoso.' },
        { t: 'Un catálogo de 40 modelos sin producir ninguno', ok: false, why: 'No entregas nada. Es un folleto, no un producto.' },
        { t: 'Una tienda en línea completa antes de la primera venta', ok: false, why: 'Máximo esfuerzo, mínimo aprendizaje. Al revés de lo que necesitas.' }
      ],
      explain: 'Recorta el envoltorio, nunca la promesa.' },

    { type: 'multi', q: '¿Qué SÍ puede faltar en un MVP? (elige todas)',
      opts: [
        { t: 'Empaque bonito', ok: true },
        { t: 'Página web', ok: true },
        { t: 'Variedad de modelos', ok: true },
        { t: 'Que el producto funcione', ok: false },
        { t: 'Automatización del proceso', ok: true },
        { t: 'Cumplir la fecha prometida', ok: false }
      ],
      explain: 'Funcionamiento y cumplimiento son intocables. Todo lo demás se puede posponer.' },

    { type: 'order', q: 'Ordena la construcción de un MVP',
      items: [
        'Escribe la promesa exacta que vas a cumplir',
        'Lista todo lo que creías necesario',
        'Tacha lo que no afecta la promesa',
        'Construye solo lo que quedó, aunque sea manual',
        'Entrégalo a un cliente real y observa qué falla'
      ],
      explain: 'Promesa → lista → recorte → construcción → prueba con cliente real.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Un MVP puede ser feo, manual y lento, pero no puede incumplir lo que prometiste.',
      ok: true,
      explain: 'Exacto. Se recorta el envoltorio, nunca la promesa. Un producto que no cumple no es “mínimo”: está mal hecho.' },

    { type: 'sim', q: 'Puedes lanzar en 2 semanas con algo manual o en 4 meses con algo automatizado. ¿Qué eliges?',
      opts: [
        { t: '2 semanas, manual', ok: true,
          effects: { aprendizaje: 3, dinero: 2, clientes: 3 },
          why: 'Aprendes en 14 días lo que el otro camino tarda 120. Y ya estás cobrando.' },
        { t: '4 meses, automatizado', ok: false,
          effects: { aprendizaje: -1, dinero: -3, clientes: 0 },
          why: 'Automatizaste un proceso que todavía no sabes si alguien quiere. Cuatro meses sin ingresos ni datos.' },
        { t: 'Esperar a tener ambos listos', ok: false,
          effects: { aprendizaje: -2, dinero: -2, clientes: -1 },
          why: 'La perfección antes del primer cliente es la forma más elegante de no empezar.' }
      ],
      explain: 'Manual primero. Automatiza solo lo que ya duele por repetirse.' },

    { type: 'write', q: 'Define tu MVP',
      sub: '¿Cuál es la versión más pequeña que ya cumple tu promesa completa?',
      ph: 'Una placa grabada, entregada en mano, sin empaque ni catálogo, en 48 horas…',
      minWords: 10,
      hints: ['¿Qué puedes hacer manual?', '¿Qué puedes quitar sin romper la promesa?'] }
  ],
  mission: {
    id: 'm3-01', title: 'Recorta hasta el hueso', dossier: null,
    brief: 'Haz la lista de todo lo que creías necesario y tacha lo que no afecta tu promesa.',
    fields: [
      { key: 'todo', label: 'Todo lo que creías necesario (uno por línea)', type: 'area', ph: 'Página web\nEmpaque\n20 modelos\nLogo\n…' },
      { key: 'minimo', label: 'Lo que SÍ es imprescindible', type: 'area', ph: 'Impresora, material, grabado, entrega' },
      { key: 'plazo', label: '¿En cuántos días puedes tener listo el mínimo?', type: 'num', ph: '10' }
    ],
    rubric: [
      { id: 'a', label: 'Listaste al menos 5 elementos', check: 'steps' },
      { id: 'b', label: 'Recortaste a lo esencial', check: 'filled' },
      { id: 'c', label: 'Te pusiste un plazo corto', check: 'number' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 3.2 */
{
  id: 'n3-02', level: 3, icon: '✂️', title: 'El alcance: lo que sí y lo que no', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Decir que no también es diseñar',
    body: [
      'El enemigo silencioso de los negocios nuevos es aceptar todo. Cada “sí” fuera de tu alcance te cuesta tiempo, calidad y margen.',
      'Define por escrito **qué haces, qué no haces y qué haces con recargo**. Un alcance claro acelera las ventas: el cliente entiende rápido si eres para él.'
    ],
    keys: [
      'Sin alcance definido, cada cliente rediseña tu negocio.',
      'Los pedidos “especiales” suelen ser los menos rentables.',
      'Un “no” a tiempo protege al cliente que sí es tuyo.'
    ]
  },
  cas: {
    emoji: '🚫', title: 'El pedido que costó el mes',
    text: 'Aceptó un pedido gigante y urgente fuera de su especialidad “para no perder al cliente”. Tardó tres semanas, entregó tarde, quedó mal y perdió a dos clientes habituales que dejó esperando. La ganancia del pedido especial: $400. La pérdida: $6,000.'
  },
  steps: [
    { type: 'quiz', q: 'Un cliente te pide algo fuera de tu especialidad y paga bien. ¿Qué haces?',
      opts: [
        { t: 'Aceptar siempre: es dinero', ok: false, why: 'El dinero que te desvía cuesta más de lo que entra. Es la trampa clásica del negocio joven.' },
        { t: 'Evaluar si me aleja de mi promesa; si sí, recomendar a alguien más', ok: true, why: 'Proteges tu enfoque, ganas reputación y quizá recibes una comisión o un referido de vuelta.' },
        { t: 'Rechazar sin explicar', ok: false, why: 'Perder al cliente sin dejar puerta abierta es desperdiciar una relación.' },
        { t: 'Aceptar y cobrar el doble', ok: false, why: 'A veces funciona, pero si no sabes hacerlo, el doble no cubre el daño a tu reputación.' }
      ],
      explain: 'Cada sí fuera de alcance es un no a tu cliente ideal.' },

    { type: 'match', q: 'Empareja el tipo de pedido con la respuesta correcta',
      pairs: [
        ['Está dentro de lo que haces', 'Sí, con tu proceso normal'],
        ['Es parecido pero más complejo', 'Sí, con recargo y plazo mayor'],
        ['Es de otra categoría', 'No, y te recomiendo a alguien']
      ],
      explain: 'Tres respuestas preparadas evitan improvisar bajo presión.' },

    { type: 'multi', q: '¿Qué debe incluir tu alcance escrito? (elige todas)',
      opts: [
        { t: 'Qué productos o servicios sí ofreces', ok: true },
        { t: 'Qué NO haces', ok: true },
        { t: 'Plazos normales de entrega', ok: true },
        { t: 'Qué tiene recargo y cuánto', ok: true },
        { t: 'Tu color favorito', ok: false }
      ],
      explain: 'Sí, no, plazos y recargos. Cuatro líneas que evitan cien discusiones.' },

    { type: 'sim', q: 'Te llegan 5 pedidos: 3 de tu especialidad y 2 raros y urgentes. Solo alcanzas 3.',
      opts: [
        { t: 'Tomar los 2 raros porque pagan más', ok: false,
          effects: { dinero: 1, reputacion: -2, tiempo: -3 },
          why: 'Ganas hoy y pierdes tu base. Los clientes habituales son los que sostienen el negocio.' },
        { t: 'Tomar los 3 de mi especialidad y referir los otros 2', ok: true,
          effects: { dinero: 2, reputacion: 3, tiempo: 1 },
          why: 'Entregas bien, a tiempo, y quedas como alguien confiable incluso con quienes no atendiste.' },
        { t: 'Aceptar los 5 y entregar tarde', ok: false,
          effects: { dinero: 1, reputacion: -3, tiempo: -3 },
          why: 'Cinco clientes molestos valen menos que tres encantados.' }
      ],
      explain: 'Capacidad real > entusiasmo. Prometer de más es la forma más rápida de perder reputación.' },

    { type: 'write', q: 'Escribe tu “no” más importante',
      sub: 'Algo que vas a dejar de aceptar aunque te lo pidan.',
      ph: 'No hago diseños desde cero sin referencia, porque me toma 4 horas y nadie las paga…',
      minWords: 10,
      hints: ['¿Qué pedido te ha costado más de lo que te dejó?'] }
  ],
  mission: {
    id: 'm3-02', title: 'Tu alcance en una tarjeta', dossier: null,
    brief: 'Escribe tu alcance como si fuera un letrero. Debe caber en una tarjeta y entenderse sin ti.',
    fields: [
      { key: 'si', label: 'Qué SÍ hago', type: 'area', ph: 'Piezas de repuesto de hasta 15 cm, en PLA o PETG…' },
      { key: 'no', label: 'Qué NO hago', type: 'area', ph: 'Diseños desde cero, piezas mayores a 20 cm, urgencias del mismo día' },
      { key: 'recargo', label: 'Qué hago con recargo y cuánto', type: 'text', ph: 'Urgencia 24 h: +40%' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste qué sí haces', check: 'filled' },
      { id: 'b', label: 'Definiste qué no haces', check: 'filled' },
      { id: 'c', label: 'Pusiste un recargo con número', check: 'number' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 3.3 */
{
  id: 'n3-03', level: 3, icon: '🧾', title: 'Costos: fijos, variables y unitarios', xp: 30, min: 8,
  concept: {
    tag: 'Concepto', title: 'Si no conoces tu costo, no tienes precio: tienes una corazonada',
    body: [
      '**Costos fijos**: los que pagas vendas o no (renta, internet, suscripciones). **Costos variables**: los que solo existen si produces (material, empaque, envío, comisiones).',
      'El **costo unitario** es lo que te cuesta una sola unidad: material + energía + desgaste + tu tiempo. Sí, tu tiempo también cuenta, aunque no te lo pagues todavía.'
    ],
    keys: [
      'Fijos = se pagan aunque no vendas nada.',
      'Variables = crecen con cada venta.',
      'Si no incluyes tu tiempo, te estás pagando cero por hora.'
    ]
  },
  cas: {
    emoji: '🖨️', title: 'Bazar 3D: la cuenta real de una pieza',
    text: 'Filamento: 80 g × $0.35/g = $28. Electricidad: 6 h × $0.90 = $5.40. Desgaste de máquina y fallos: $6. Tiempo de preparación y post-proceso: 40 min × $60/h = $40. Empaque: $8. Costo unitario real: $87.40. Vendía a $90 y creía que ganaba bien.'
  },
  steps: [
    { type: 'match', q: 'Clasifica cada costo',
      pairs: [
        ['Renta del local', 'Costo fijo'],
        ['Empaque de cada pedido', 'Costo variable'],
        ['Material + tu tiempo por pieza', 'Costo unitario']
      ],
      explain: 'Pregunta clave: ¿lo pago aunque no venda nada? Si sí, es fijo. Si crece con cada venta, es variable. La suma de todo lo que consume una pieza es el costo unitario.' },

    { type: 'multi', q: '¿Qué debe incluir el costo unitario? (elige todas)',
      opts: [
        { t: 'Material directo', ok: true },
        { t: 'Energía consumida', ok: true },
        { t: 'Tu tiempo de trabajo', ok: true },
        { t: 'Desgaste y piezas falladas', ok: true },
        { t: 'La renta mensual completa', ok: false },
        { t: 'Empaque y envío', ok: true }
      ],
      explain: 'La renta es fija: se reparte entre todas las unidades del mes, no se carga completa a una.' },

    { type: 'quiz', q: 'Gastas $2,400 fijos al mes. Cada pieza cuesta $60 de material y la vendes a $150. Vendes 20 al mes. ¿Ganas o pierdes?',
      opts: [
        { t: 'Gano $1,800', ok: false, why: 'Ese es el margen bruto (20 × $90). Falta restar los fijos.' },
        { t: 'Pierdo $600', ok: true, why: '20 × ($150-$60) = $1,800 de margen. $1,800 - $2,400 = -$600. Pierdes.' },
        { t: 'Gano $3,000', ok: false, why: 'Confundiste ingreso con utilidad. El ingreso es $3,000, no la ganancia.' },
        { t: 'Salgo tablas', ok: false, why: 'Necesitarías vender 27 piezas para salir tablas.' }
      ],
      explain: 'Ingreso ≠ utilidad. Utilidad = ingresos − variables − fijos.' },

    { type: 'slider', q: 'Tu costo unitario es $87. ¿A cuánto vendes?',
      min: 87, max: 400, step: 5, value: 100, unit: '$',
      best: [175, 260],
      bands: [
        { max: 130, label: 'Margen peligroso', tone: 'bad', msg: 'Menos de 1.5× tu costo no deja para fijos, imprevistos ni tu sueldo.' },
        { max: 174, label: 'Justo', tone: 'warn', msg: 'Sobrevives, pero cualquier imprevisto te come la ganancia.' },
        { max: 260, label: 'Sano', tone: 'ok', msg: '2× a 3× el costo unitario es el rango donde un negocio pequeño respira.' },
        { max: 400, label: 'Ambicioso', tone: 'warn', msg: 'Se puede, pero necesitas una diferencia muy clara que lo justifique.' }
      ],
      explain: 'Regla práctica para productos hechos a mano: precio entre 2 y 3 veces el costo unitario.' },

    { type: 'write', q: 'Desglosa el costo de tu producto principal',
      sub: 'Anota cada componente con su cantidad. No redondees hacia abajo por optimismo.',
      ph: 'Material $28, energía $5, desgaste $6, mi tiempo 40 min = $40, empaque $8. Total $87…',
      minWords: 10,
      hints: ['¿Incluiste tu tiempo?', '¿Incluiste las piezas que salen mal?', '¿Incluiste el empaque?'] }
  ],
  mission: {
    id: 'm3-03', title: 'Tu costo unitario real', dossier: null,
    brief: 'Calcula con números reales cuánto te cuesta producir una unidad. Sin adivinar.',
    fields: [
      { key: 'material', label: 'Material ($)', type: 'num', ph: '28' },
      { key: 'energia', label: 'Energía / insumos ($)', type: 'num', ph: '5' },
      { key: 'tiempo', label: 'Tu tiempo ($)', type: 'num', ph: '40' },
      { key: 'otros', label: 'Desgaste, empaque, envío ($)', type: 'num', ph: '14' },
      { key: 'fijos', label: 'Costos fijos del mes ($)', type: 'num', ph: '2400' }
    ],
    rubric: [
      { id: 'a', label: 'Desglosaste todos los componentes', check: 'numbers' },
      { id: 'b', label: 'Incluiste tu tiempo', check: 'time' },
      { id: 'c', label: 'Conoces tus costos fijos', check: 'number' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 3.4 */
{
  id: 'n3-04', level: 3, icon: '🏷️', title: 'Tres formas de poner precio', xp: 30, min: 8,
  concept: {
    tag: 'Concepto', title: 'El precio comunica antes de que hables',
    body: [
      'Hay tres métodos. **Por costo**: costo unitario × margen. **Por mercado**: lo que cobran los demás, ajustado por tu diferencia. **Por valor**: cuánto vale para el cliente el problema resuelto.',
      'Los tres se usan juntos: el costo te da el piso, el mercado te da el rango y el valor te da el techo.'
    ],
    keys: [
      'Costo = piso. Nunca vendas debajo.',
      'Mercado = rango de referencia del cliente.',
      'Valor = cuánto le ahorra o le genera resolverlo.'
    ]
  },
  cas: {
    emoji: '⚙️', title: 'La pieza de $90 que valía $600',
    text: 'Una pieza de repuesto cuesta $87 producirla. En el mercado piezas similares valen $150. Pero sin ella, la máquina del cliente está parada y él pierde $800 al día. Cobrar $450 sigue siendo un negocio excelente para el cliente. El costo no cambió; el valor sí.'
  },
  steps: [
    { type: 'match', q: 'Empareja el método con su pregunta clave',
      pairs: [
        ['Por costo', '¿Cuánto me cuesta y cuánto margen necesito?'],
        ['Por mercado', '¿Cuánto cobran los demás por algo parecido?'],
        ['Por valor', '¿Cuánto gana o ahorra el cliente al resolverlo?']
      ],
      explain: 'Tres preguntas, tres números. El precio final vive entre ellos.' },

    { type: 'quiz', q: 'Tu servicio le ahorra a un taller 10 horas al mes. Su hora vale $250. ¿Cuál es el techo razonable?',
      opts: [
        { t: '$100 al mes', ok: false, why: 'Estás dejando $2,400 de valor sobre la mesa. Ese precio ni siquiera te posiciona bien.' },
        { t: 'Entre $600 y $1,200 al mes', ok: true, why: 'Le ahorras $2,500. Cobrar entre 25% y 50% de ese valor es la zona donde el cliente dice sí rápido y tú ganas bien.' },
        { t: '$2,500 al mes', ok: false, why: 'Cobrar el 100% del valor elimina el beneficio del cliente. No tiene razón para comprar.' },
        { t: '$4,000 al mes', ok: false, why: 'Le sale más caro que el problema. Nadie compra eso.' }
      ],
      explain: 'Cobra entre el 20% y el 50% del valor que generas. Ganan los dos.' },

    { type: 'multi', q: '¿Qué justifica cobrar más que la competencia? (elige todas)',
      opts: [
        { t: 'Entrega más rápida', ok: true },
        { t: 'Garantía más larga', ok: true },
        { t: 'Especialización en el gremio del cliente', ok: true },
        { t: 'Que tú necesitas ganar más', ok: false },
        { t: 'Menos riesgo para el cliente', ok: true }
      ],
      explain: 'El cliente paga más por certeza, velocidad y experiencia específica. Nunca por tus necesidades.' },

    { type: 'sim', q: 'Duda entre $150 (como todos) y $260 (con garantía y entrega en 48 h).',
      opts: [
        { t: '$150, para no espantar clientes', ok: false,
          effects: { dinero: -1, reputacion: 0, clientes: 2 },
          why: 'Consigues más clientes pero cada uno deja muy poco. Trabajas el doble para ganar lo mismo.' },
        { t: '$260 con garantía y plazo comprometido', ok: true,
          effects: { dinero: 3, reputacion: 2, clientes: 1 },
          why: 'Menos clientes, mucho mejor margen, y los que llegan valoran el servicio en vez del descuento.' },
        { t: '$99 para ganar mercado rápido', ok: false,
          effects: { dinero: -3, reputacion: -1, clientes: 3 },
          why: 'Atraes a los peores clientes y te quedas sin margen para mejorar. Difícil subir después.' }
      ],
      explain: 'Un precio bajo atrae al cliente que más exige y menos paga.' },

    { type: 'write', q: 'Justifica tu precio con los tres métodos',
      sub: 'Piso por costo, rango por mercado, techo por valor.',
      ph: 'Mi costo es $87 (piso $175). En el mercado están entre $150 y $300. Al cliente le ahorra $800 de parar su máquina, así que $260 es justo…',
      minWords: 18,
      hints: ['¿Cuál es tu piso?', '¿Qué cobran los otros?', '¿Cuánto vale para el cliente?'] }
  ],
  mission: {
    id: 'm3-04', title: 'Fija tu precio', dossier: 'precio',
    brief: 'Decide tu precio con argumentos, no con miedo. Lo vas a defender en la siguiente venta.',
    fields: [
      { key: 'costo', label: 'Tu costo unitario ($)', type: 'num', ph: '87' },
      { key: 'mercado', label: 'Rango del mercado ($)', type: 'text', ph: '$150 a $300' },
      { key: 'valor', label: '¿Qué gana o ahorra tu cliente?', type: 'text', ph: 'Evita parar su máquina: $800 al día' },
      { key: 'precio', label: 'Tu precio final ($)', type: 'num', ph: '260' },
      { key: 'razon', label: '¿Por qué ese precio?', type: 'area', ph: 'Porque incluye garantía y entrega en 48 h, que nadie más da…' }
    ],
    rubric: [
      { id: 'a', label: 'Conoces tu costo y tu precio', check: 'numbers' },
      { id: 'b', label: 'Tu precio deja margen positivo', check: 'margin' },
      { id: 'c', label: 'Consideraste el mercado', check: 'filled' },
      { id: 'd', label: 'Justificaste el precio con un criterio', check: 'reason' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 3.5 */
{
  id: 'n3-05', level: 3, icon: '⚖️', title: 'Punto de equilibrio', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'El número que te dice si vas ganando o perdiendo',
    body: [
      'El punto de equilibrio es **cuántas unidades necesitas vender para no perder dinero**. A partir de ahí, todo lo que vendes es ganancia.',
      'La fórmula: *Costos fijos ÷ (Precio − Costo variable unitario) = unidades*. Ese denominador se llama **margen de contribución**: lo que cada venta aporta para pagar tus fijos.'
    ],
    keys: [
      'Punto de equilibrio = fijos ÷ margen de contribución.',
      'Subir el precio baja el punto de equilibrio más rápido que bajar costos.',
      'Si tu punto de equilibrio es inalcanzable, el negocio no funciona: cámbialo antes de invertir.'
    ]
  },
  cas: {
    emoji: '📐', title: 'El número que cambió la decisión',
    text: 'Fijos $2,400. Precio $150, costo variable $60. Margen de contribución: $90. Punto de equilibrio: 2,400 ÷ 90 = 27 piezas al mes. Vendía 20. Al subir el precio a $190, el margen subió a $130 y el punto de equilibrio bajó a 19 piezas. Con las mismas 20 ventas, pasó de perder a ganar.'
  },
  steps: [
    { type: 'quiz', q: 'Fijos $3,000. Precio $200. Costo variable $80. ¿Cuál es tu punto de equilibrio?',
      opts: [
        { t: '15 unidades', ok: false, why: 'Eso sería 3,000 ÷ 200. Debes usar el margen de contribución, no el precio.' },
        { t: '25 unidades', ok: true, why: '3,000 ÷ (200 − 80) = 3,000 ÷ 120 = 25 unidades.' },
        { t: '37 unidades', ok: false, why: 'Ese sería el cálculo con un margen de $80. Revisa: el margen es precio menos costo variable.' },
        { t: '38 unidades', ok: false, why: 'Revisa la resta: 200 − 80 = 120, no 80.' }
      ],
      explain: 'Fijos ÷ (precio − variable). Memoriza esta fórmula: la vas a usar toda tu vida.' },

    { type: 'order', q: 'Ordena el cálculo del punto de equilibrio',
      items: [
        'Suma todos tus costos fijos del mes',
        'Calcula tu costo variable por unidad',
        'Resta: precio − costo variable = margen de contribución',
        'Divide los fijos entre el margen de contribución',
        'Compara el resultado con lo que vendes hoy'
      ],
      explain: 'Cinco pasos. Si el resultado supera tu capacidad, hay que cambiar precio, costos o modelo.' },

    { type: 'multi', q: '¿Qué acciones BAJAN tu punto de equilibrio? (elige todas)',
      opts: [
        { t: 'Subir el precio', ok: true },
        { t: 'Reducir el costo del material', ok: true },
        { t: 'Cancelar una suscripción que no usas', ok: true },
        { t: 'Contratar a alguien de planta', ok: false },
        { t: 'Rentar un local más grande', ok: false }
      ],
      explain: 'Todo lo que suba el margen o baje los fijos te acerca al equilibrio.' },

    { type: 'slider', q: 'Tu punto de equilibrio es 27 piezas. ¿Cuántas deberías planear vender para estar tranquilo?',
      min: 20, max: 80, step: 1, value: 27, unit: ' piezas',
      best: [40, 55],
      bands: [
        { max: 32, label: 'Sin colchón', tone: 'bad', msg: 'Al filo del equilibrio, cualquier mes flojo te pone en pérdida.' },
        { max: 39, label: 'Apretado', tone: 'warn', msg: 'Te deja algo de aire, pero no para imprevistos ni para reinvertir.' },
        { max: 55, label: 'Sano', tone: 'ok', msg: '1.5× a 2× tu punto de equilibrio te da colchón para meses malos y para crecer.' },
        { max: 80, label: 'Revisa capacidad', tone: 'warn', msg: 'Meta ambiciosa: asegúrate de poder producir y entregar ese volumen.' }
      ],
      explain: 'Planea vender 1.5 a 2 veces tu punto de equilibrio.' },

    { type: 'write', q: 'Calcula el tuyo y di qué vas a cambiar',
      sub: 'Escribe la operación completa con tus números.',
      ph: 'Fijos $2,400 ÷ ($190 − $60) = 19 piezas. Hoy vendo 20, apenas. Voy a subir el precio a $210…',
      minWords: 12,
      hints: ['Escribe la división completa.', '¿Qué palanca mueves: precio, costo o fijos?'] }
  ],
  mission: {
    id: 'm3-05', title: 'Tu punto de equilibrio', dossier: 'numeros',
    brief: 'Calcula cuántas unidades necesitas al mes para no perder. Y decide qué vas a mover.',
    fields: [
      { key: 'fijos', label: 'Costos fijos del mes ($)', type: 'num', ph: '2400' },
      { key: 'precio', label: 'Precio de venta ($)', type: 'num', ph: '190' },
      { key: 'variable', label: 'Costo variable por unidad ($)', type: 'num', ph: '60' },
      { key: 'actual', label: '¿Cuántas vendes hoy al mes?', type: 'num', ph: '20' },
      { key: 'accion', label: '¿Qué vas a cambiar?', type: 'text', ph: 'Subir el precio a $210 y cancelar una suscripción' }
    ],
    rubric: [
      { id: 'a', label: 'Tienes los tres números base', check: 'numbers' },
      { id: 'b', label: 'Tu margen de contribución es positivo', check: 'margin' },
      { id: 'c', label: 'Definiste una acción concreta', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 3.6 */
{
  id: 'n3-06', level: 3, icon: '🔬', title: 'Prototipo, calidad y primeras entregas', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'La calidad se define, no se improvisa',
    body: [
      'Calidad no significa “lo mejor posible”. Significa **cumplir el estándar que prometiste, siempre**. Un producto consistente y correcto vence a uno excelente pero impredecible.',
      'Define tu estándar mínimo por escrito: medidas, acabado, tiempo, empaque. Y revisa cada pieza contra esa lista antes de entregarla.'
    ],
    keys: [
      'Consistencia > perfección.',
      'Un checklist de 5 puntos evita el 80% de las quejas.',
      'La primera entrega define tu reputación para siempre.'
    ]
  },
  cas: {
    emoji: '✅', title: 'La lista de 5 puntos',
    text: 'Tras tres devoluciones, hizo una lista: medidas correctas, sin hilos ni rebabas, nombre bien escrito, prueba de resistencia, empaque limpio. Revisaba cada pieza contra la lista. Las devoluciones bajaron a cero y pudo subir el precio 30% mostrando ese control.'
  },
  steps: [
    { type: 'quiz', q: '¿Qué define mejor la “calidad” en un negocio pequeño?',
      opts: [
        { t: 'Usar los materiales más caros', ok: false, why: 'El material caro sube tu costo sin garantizar que el cliente note la diferencia.' },
        { t: 'Cumplir siempre el estándar que prometiste', ok: true, why: 'La consistencia es lo que genera confianza y recompra.' },
        { t: 'Que a ti te guste el resultado', ok: false, why: 'Tu gusto no es el criterio: el criterio es la promesa que hiciste.' },
        { t: 'Que sea mejor que el de la competencia en todo', ok: false, why: 'Imposible y carísimo. Basta ser mejor en lo que le importa a tu cliente.' }
      ],
      explain: 'Estándar definido + revisión constante = calidad real.' },

    { type: 'multi', q: '¿Qué debe tener tu checklist de entrega? (elige todas)',
      opts: [
        { t: 'Verificación de medidas o cantidades', ok: true },
        { t: 'Revisión de acabado visible', ok: true },
        { t: 'Confirmar que el nombre o los datos están bien escritos', ok: true },
        { t: 'Foto del producto terminado', ok: true },
        { t: 'Que el cliente sea simpático', ok: false }
      ],
      explain: 'Puntos objetivos y verificables. Si no se puede revisar, no va en la lista.' },

    { type: 'sim', q: 'Detectas un defecto pequeño justo antes de entregar. El cliente probablemente no lo note.',
      opts: [
        { t: 'Entregarlo así: no se nota', ok: false,
          effects: { reputacion: -3, dinero: 1, clientes: -1 },
          why: 'Si lo nota después, pierdes al cliente y su recomendación. El riesgo no compensa.' },
        { t: 'Avisar, ofrecer rehacerlo y dar una fecha nueva', ok: true,
          effects: { reputacion: 3, dinero: -1, clientes: 2 },
          why: 'La honestidad temprana genera más confianza que una entrega perfecta silenciosa.' },
        { t: 'Entregarlo con descuento sin decir por qué', ok: false,
          effects: { reputacion: -1, dinero: -2, clientes: 0 },
          why: 'El descuento sin explicación enseña al cliente a pedir descuentos siempre.' }
      ],
      explain: 'Los clientes perdonan errores avisados. No perdonan errores escondidos.' },

    { type: 'order', q: 'Ordena el flujo de una primera entrega impecable',
      items: [
        'Confirma con el cliente los detalles exactos por escrito',
        'Produce siguiendo tu estándar',
        'Revisa contra tu checklist de calidad',
        'Entrega con una foto o nota de cuidado',
        'Pregunta a las 48 horas cómo le fue'
      ],
      explain: 'El seguimiento posterior es donde nacen las recomendaciones.' },

    { type: 'write', q: 'Escribe tu checklist de 5 puntos',
      sub: 'Cinco cosas que revisarás en cada entrega, sin excepción.',
      ph: '1. Medidas correctas\n2. Sin rebabas\n3. Texto sin errores\n4. Prueba de resistencia\n5. Empaque limpio',
      minWords: 10,
      hints: ['Deben ser verificables.', 'Máximo 5: si son más, no las cumplirás.'] }
  ],
  mission: {
    id: 'm3-06', title: 'Tu estándar de calidad', dossier: 'procesos',
    brief: 'Define tu estándar y aplícalo en la próxima entrega. Guárdalo: será la base para delegar más adelante.',
    fields: [
      { key: 'estandar', label: 'Tu estándar mínimo (qué debe cumplir siempre)', type: 'area', ph: 'Medidas ±0.5 mm, sin rebabas visibles, entrega en 48 h…' },
      { key: 'checklist', label: 'Checklist de 5 puntos', type: 'area', ph: '1. …' },
      { key: 'garantia', label: '¿Qué haces si algo sale mal?', type: 'text', ph: 'Repongo sin costo en 24 h' }
    ],
    rubric: [
      { id: 'a', label: 'Tu checklist tiene al menos 5 puntos', check: 'steps' },
      { id: 'b', label: 'Los puntos son verificables', check: 'concrete' },
      { id: 'c', label: 'Definiste qué haces ante una falla', check: 'filled' }
    ],
    reward: { xp: 50, coins: 35 }
  }
}

]);
