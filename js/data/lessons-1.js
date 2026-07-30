/* ==========================================================================
   NIVEL 1 — DESCUBRE · Encuentras problemas y oportunidades reales
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 1.1 */
{
  id: 'n1-01', level: 1, icon: '🌱', title: 'Emprender no es tener una idea', xp: 20, min: 5,
  concept: {
    tag: 'Concepto',
    title: 'Un negocio nace cuando alguien paga',
    body: [
      'Casi todos creen que emprender empieza con una idea brillante. No. Empieza con **un problema que le molesta a alguien lo suficiente como para pagar por resolverlo**.',
      'La idea es solo una hipótesis: una apuesta sobre cómo resolver ese problema. Puedes cambiarla mil veces. Lo que no puede faltar es el problema y la persona que lo sufre.'
    ],
    keys: [
      'Sin problema no hay negocio, solo un pasatiempo caro.',
      'La idea se cambia; el cliente se elige.',
      'Lo primero que se busca no es un producto: es un dolor.'
    ]
  },
  cas: {
    emoji: '🧁', title: 'Dos panaderías, una sobrevive',
    text: 'Ana abrió una pastelería porque le encanta hornear. Beto abrió una porque notó que en su colonia no había dónde comprar un pastel de última hora un domingo. Un año después, Beto vende el triple. Vendía lo mismo. Resolvía algo distinto.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál de estas frases describe mejor el inicio de un negocio?',
      opts: [
        { t: 'Tener una idea original que nadie haya hecho', ok: false, why: 'Casi ningún negocio exitoso es 100% original. Uber no inventó los taxis.' },
        { t: 'Detectar un problema que alguien quiere resolver hoy', ok: true, why: 'Exacto. El problema existe antes que tu idea, y por eso alguien paga.' },
        { t: 'Conseguir dinero para invertir', ok: false, why: 'El dinero sin un problema validado se convierte en inventario que nadie compra.' },
        { t: 'Registrar la marca y hacer el logo', ok: false, why: 'Eso es maquillaje. Sirve después, no antes.' }
      ],
      explain: 'Primero el problema. Luego el cliente. Al final, la solución.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Si a mucha gente le “gusta” tu idea, significa que va a funcionar.',
      ok: false,
      explain: 'Los cumplidos son gratis. Solo el dinero, el tiempo o el compromiso real cuentan como señal.' },

    { type: 'multi', q: '¿Cuáles de estas son señales de un problema real? (elige todas)',
      opts: [
        { t: 'La gente ya gasta dinero en resolverlo, aunque mal', ok: true },
        { t: 'Se quejan de eso sin que tú preguntes', ok: true },
        { t: 'Suena innovador cuando lo cuentas', ok: false },
        { t: 'Han improvisado sus propias soluciones caseras', ok: true },
        { t: 'A tus amigos les parece buena idea', ok: false }
      ],
      explain: 'Gasto actual, queja espontánea y soluciones improvisadas: las tres señales más confiables.' },

    { type: 'sim', q: 'Tienes 8 semanas libres. ¿Qué haces primero?',
      opts: [
        { t: 'Producir 200 unidades para tener inventario', ok: false,
          effects: { dinero: -3, aprendizaje: 0, clientes: 0 },
          why: 'Gastaste tu capital antes de saber si alguien lo quiere. Es el error más caro y más común.' },
        { t: 'Hablar con 15 personas que tienen el problema', ok: true,
          effects: { dinero: 0, aprendizaje: 3, clientes: 2 },
          why: 'Gastaste tiempo, no dinero, y saliste con información y posibles compradores.' },
        { t: 'Diseñar el logo, la marca y las redes', ok: false,
          effects: { dinero: -1, aprendizaje: 0, clientes: 0 },
          why: 'Te sientes productivo, pero no aprendiste nada del mercado.' }
      ],
      explain: 'En la etapa de descubrimiento, tu recurso es el tiempo, no el dinero.' },

    { type: 'write', q: 'Escribe un problema que hayas visto esta semana',
      sub: 'Algo que te molestó a ti o a alguien cerca. No tiene que ser un negocio todavía.',
      ph: 'En mi colonia no hay dónde imprimir documentos un domingo y la gente termina yendo hasta el centro…',
      minWords: 10,
      hints: ['¿A quién le pasa?', '¿Qué hace hoy para arreglárselas?', '¿Cada cuánto le pasa?'] }
  ],
  mission: {
    id: 'm1-01', title: 'El radar de problemas', dossier: null,
    brief: 'Durante hoy, anota 3 quejas que escuches de la gente a tu alrededor. No opines, solo registra sus palabras.',
    fields: [
      { key: 'q1', label: 'Queja 1 (con las palabras de quien la dijo)', type: 'text', ph: '“Siempre se me olvida quién me debe”' },
      { key: 'q2', label: 'Queja 2', type: 'text', ph: '' },
      { key: 'q3', label: 'Queja 3', type: 'text', ph: '' }
    ],
    rubric: [
      { id: 'a', label: 'Anotaste tres quejas distintas', check: 'filled' },
      { id: 'b', label: 'Son quejas concretas, no generalidades', check: 'concrete' }
    ],
    reward: { xp: 30, coins: 15 }
  }
},

/* ------------------------------------------------------------------ 1.2 */
{
  id: 'n1-02', level: 1, icon: '📡', title: 'Cómo detectar problemas reales', xp: 20, min: 6,
  concept: {
    tag: 'Concepto', title: 'Tres lugares donde viven las oportunidades',
    body: [
      'Los problemas rentables casi nunca están escondidos. Están **a la vista, pero normalizados**: todos se quejan y nadie los arregla.',
      'Búscalos en tres lugares: donde la gente **pierde tiempo**, donde **pierde dinero** y donde **se siente incómoda o insegura**. Si además ya paga algo para aliviarlo, tienes oro.'
    ],
    keys: [
      'Tiempo perdido = trabajo repetido a mano.',
      'Dinero perdido = compras que se repiten porque algo falla.',
      'Incomodidad = pasos innecesarios, esperas, vergüenza o miedo.'
    ]
  },
  cas: {
    emoji: '🖨️', title: 'Bazar 3D: el problema estaba en la queja',
    text: 'Un negocio de impresión 3D vendía figuras decorativas: pocas ventas. Un día un cliente pidió una pieza para reparar su lavadora porque la refacción original ya no se fabricaba. En dos meses, las piezas de repuesto eran el 70% de sus ingresos. El problema (repuestos descontinuados) valía mucho más que la idea (figuras bonitas).'
  },
  steps: [
    { type: 'match', q: 'Empareja la señal con el tipo de problema',
      pairs: [
        ['“Hago la lista de pedidos a mano cada noche”', 'Tiempo perdido'],
        ['“Compro collares nuevos cada 2 meses”', 'Dinero perdido'],
        ['“Me da pena preguntar el precio”', 'Incomodidad']
      ],
      explain: 'Tiempo, dinero e incomodidad: tu radar de tres antenas.' },

    { type: 'quiz', q: '¿Cuál de estos problemas tiene MÁS probabilidad de convertirse en negocio?',
      opts: [
        { t: 'A la gente le gustaría tener un jardín más bonito', ok: false, why: '“Le gustaría” es un deseo tibio. Nadie pierde el sueño por eso.' },
        { t: 'Los dueños de cafeterías recompran vasos cada semana y siempre se les acaban en el peor momento', ok: true, why: 'Recompra frecuente + urgencia + gasto ya existente. Tres señales fuertes juntas.' },
        { t: 'Sería padre que existiera una app para conocer gente', ok: false, why: 'Mercado saturado y sin dolor concreto identificado.' },
        { t: 'Nadie ha hecho una tienda de calcetines morados', ok: false, why: 'Que nadie lo haya hecho suele significar que nadie lo quiere.' }
      ],
      explain: 'Frecuencia + urgencia + gasto actual = problema con dinero detrás.' },

    { type: 'order', q: 'Ordena los pasos del radar de problemas',
      items: [
        'Observa dónde la gente pierde tiempo, dinero o paciencia',
        'Anota la queja con sus palabras exactas',
        'Pregunta qué hace hoy para resolverlo',
        'Averigua cuánto le cuesta ese apaño',
        'Marca los problemas que se repiten en varias personas'
      ],
      explain: 'Observar → registrar → indagar → cuantificar → buscar patrón.' },

    { type: 'multi', q: 'Estás en un taller mecánico y escuchas esto. ¿Qué frases son oportunidades?',
      opts: [
        { t: '“Otra vez perdí la nota del cliente de ayer”', ok: true },
        { t: '“Qué calor hace hoy”', ok: false },
        { t: '“Los proveedores tardan 3 días y pierdo trabajos”', ok: true },
        { t: '“Me gusta este taller”', ok: false },
        { t: '“Cobro barato porque no sé cuánto me cuesta cada reparación”', ok: true }
      ],
      explain: 'Tres oportunidades: control de notas, abasto lento y costeo. Las otras dos son ruido.' },

    { type: 'write', q: 'Aplica el radar a tu propio día',
      sub: '¿Dónde perdiste tú tiempo o dinero esta semana por algo que se repite?',
      ph: 'Cada semana pierdo 2 horas cotizando a mano porque no tengo una plantilla…',
      minWords: 12,
      hints: ['¿Cuántas veces al mes pasa?', '¿Cuánto te cuesta en tiempo o dinero?'] }
  ],
  mission: {
    id: 'm1-02', title: 'Caza 5 problemas', dossier: null,
    brief: 'Hoy vas a observar como detective. Encuentra 5 problemas y clasifícalos: tiempo, dinero o incomodidad.',
    fields: [
      { key: 'lista', label: 'Tus 5 problemas (uno por línea, con su tipo)', type: 'area',
        ph: '1. Las estéticas pierden clientes por no confirmar citas — tiempo\n2. …' },
      { key: 'top', label: '¿Cuál te parece el más doloroso y por qué?', type: 'area', ph: 'El de las citas, porque cada falta les cuesta $250…' }
    ],
    rubric: [
      { id: 'a', label: 'Escribiste 5 problemas', check: 'steps' },
      { id: 'b', label: 'Justificaste cuál duele más', check: 'reason' },
      { id: 'c', label: 'Son observaciones concretas', check: 'concrete' }
    ],
    reward: { xp: 35, coins: 20 }
  }
},

/* ------------------------------------------------------------------ 1.3 */
{
  id: 'n1-03', level: 1, icon: '🃏', title: 'Tu ventaja injusta', xp: 20, min: 5,
  concept: {
    tag: 'Concepto', title: 'Empieza por lo que ya tienes',
    body: [
      'No compitas donde todos son iguales. Tu **ventaja injusta** es aquello que a ti te sale barato o fácil y a otros les cuesta caro o difícil.',
      'Puede ser una habilidad, una máquina, un contacto, conocer a fondo un gremio, tener tiempo libre, hablar otro idioma o simplemente vivir en el lugar correcto.'
    ],
    keys: [
      'Ventaja injusta = lo que a ti te cuesta poco y a otros mucho.',
      'Se apila: habilidad + acceso + reputación es casi imposible de copiar.',
      'Si no la nombras, la desperdicias.'
    ]
  },
  cas: {
    emoji: '🧰', title: 'La ferretería del papá',
    text: 'Karla quería vender productos de limpieza. Su papá tiene una ferretería con 200 clientes fijos que van cada semana. Ella no necesitaba conseguir clientes: ya estaban ahí. Su ventaja injusta no era el producto, era el acceso.'
  },
  steps: [
    { type: 'quiz', q: 'Diego es maestro de secundaria y quiere emprender. ¿Cuál es su ventaja injusta más aprovechable?',
      opts: [
        { t: 'Le gusta el café', ok: false, why: 'Un gusto no es una ventaja: a millones les gusta el café.' },
        { t: 'Entiende cómo aprenden los adolescentes y tiene acceso a 400 familias', ok: true, why: 'Conocimiento profundo de un grupo + acceso directo. Difícil de copiar.' },
        { t: 'Tiene una laptop', ok: false, why: 'Casi todos tienen una. No te diferencia.' },
        { t: 'Tiene tiempo libre en verano', ok: false, why: 'Ayuda, pero por sí solo no crea diferencia frente a competidores.' }
      ],
      explain: 'Las ventajas fuertes casi siempre son: conocimiento de un gremio, acceso a un grupo, o una habilidad poco común.' },

    { type: 'multi', q: '¿Cuáles cuentan como ventaja injusta? (elige todas)',
      opts: [
        { t: 'Trabajaste 6 años en el gremio al que quieres venderle', ok: true },
        { t: 'Tienes una impresora 3D que ya pagaste', ok: true },
        { t: 'Eres muy trabajador', ok: false },
        { t: 'Tu tía dirige la asociación de restauranteros de la ciudad', ok: true },
        { t: 'Quieres mucho tu proyecto', ok: false }
      ],
      explain: 'Las ganas no son ventaja: todos las tienen. Experiencia, activos y acceso sí lo son.' },

    { type: 'sim', q: 'Tienes una máquina de coser y 15 años cosiendo. ¿Qué camino eliges?',
      opts: [
        { t: 'Abrir una tienda de ropa importada', ok: false,
          effects: { dinero: -3, ventaja: -2, clientes: 0 },
          why: 'Tiraste tu ventaja a la basura y entraste a competir por precio contra importadores.' },
        { t: 'Arreglos y ajustes exprés para tiendas de ropa de tu zona', ok: true,
          effects: { dinero: 1, ventaja: 3, clientes: 2 },
          why: 'Usas la habilidad que ya dominas y le vendes a quien ya tiene el problema.' },
        { t: 'Un curso en línea de costura para principiantes', ok: false,
          effects: { dinero: -1, ventaja: 1, clientes: 0 },
          why: 'Usa tu habilidad, pero requiere audiencia y marketing que aún no tienes.' }
      ],
      explain: 'Primero monetiza la ventaja de la forma más directa. Lo demás viene después.' },

    { type: 'write', q: 'Nombra tu ventaja injusta',
      sub: 'Completa: “A mí me resulta fácil ______ , mientras que a la mayoría le cuesta ______.”',
      ph: 'A mí me resulta fácil modelar piezas en 3D y entender planos, mientras que a la mayoría le cuesta hasta medir una pieza rota…',
      minWords: 12,
      hints: ['¿Qué te piden de favor tus conocidos?', '¿Qué sabes hacer que aprendiste trabajando?', '¿A qué grupo tienes acceso que otros no?'] }
  ],
  mission: {
    id: 'm1-03', title: 'Inventario de ventajas', dossier: null,
    brief: 'Haz la lista honesta de lo que ya tienes. Es tu capital inicial y casi nadie lo escribe.',
    fields: [
      { key: 'habilidades', label: 'Habilidades que dominas', type: 'text', ph: 'Modelado 3D, soldadura, redacción…' },
      { key: 'activos', label: 'Herramientas, máquinas o espacio que ya tienes', type: 'text', ph: 'Impresora 3D, camioneta, bodega chica' },
      { key: 'acceso', label: 'Grupos o personas a los que tienes acceso', type: 'text', ph: 'Grupo de 300 makers, clientes de la ferretería de mi papá' }
    ],
    rubric: [
      { id: 'a', label: 'Llenaste las tres categorías', check: 'filled' },
      { id: 'b', label: 'Son cosas concretas, no cualidades genéricas', check: 'concrete' }
    ],
    reward: { xp: 30, coins: 20 }
  }
},

/* ------------------------------------------------------------------ 1.4 */
{
  id: 'n1-04', level: 1, icon: '🎯', title: 'Encontrar a tu cliente ideal', xp: 25, min: 7,
  concept: {
    tag: 'Concepto', title: 'No se vende para todo el mundo',
    body: [
      'Cuando le hablas a todos, no le hablas a nadie. Un **cliente ideal** es un grupo específico con una necesidad concreta, al que puedes encontrar y que puede pagar.',
      'Elegir un nicho no reduce tu mercado: reduce tu competencia y multiplica tu claridad. Es más fácil ser el favorito de 500 personas que el número 40 de un millón.'
    ],
    keys: [
      'Un nicho se define por necesidad, no por edad o género.',
      'Debes poder encontrarlos: ¿dónde se juntan?',
      'Deben poder y querer pagar.'
    ]
  },
  cas: {
    emoji: '🐕', title: 'Impresión 3D: ¿a quién le vendes primero?',
    text: 'Fabricas productos en impresión 3D. Podrías venderle a cualquiera que quiera decoración. Pero los dueños de mascotas que quieren placas y accesorios personalizados con el nombre de su perro pagan más, deciden rápido, presumen la compra y vuelven. El mismo producto, un cliente distinto, otro negocio.'
  },
  steps: [
    { type: 'quiz', q: 'Fabricas productos en impresión 3D. ¿A quién conviene venderle primero?',
      opts: [
        { t: 'Personas que buscan cualquier decoración', ok: false, why: 'Compran una vez, comparan precio y no tienen urgencia. Difíciles de encontrar.' },
        { t: 'Dueños de mascotas que quieren productos personalizados', ok: true, why: 'Necesidad concreta, alto valor emocional, se juntan en grupos y comunidades, y repiten.' },
        { t: 'Todas las personas que usan redes sociales', ok: false, why: 'Eso no es un cliente: es una lista de correos del mundo.' },
        { t: 'Empresas grandes que necesitan prototipos', ok: false, why: 'Buen mercado, pero con ciclos de venta largos y requisitos técnicos. No es un primer cliente.' }
      ],
      explain: 'Primer cliente ideal = decide rápido, siente el problema y ya está agrupado en algún lugar.' },

    { type: 'multi', q: '¿Qué elementos SÍ definen un cliente ideal? (elige todos)',
      opts: [
        { t: 'La necesidad concreta que tiene', ok: true },
        { t: 'Dónde puedo encontrarlo', ok: true },
        { t: 'Su signo zodiacal', ok: false },
        { t: 'Cuánto puede y quiere pagar', ok: true },
        { t: 'Que me caiga bien', ok: false },
        { t: 'Cada cuánto necesita lo que vendo', ok: true }
      ],
      explain: 'Necesidad, ubicación, capacidad de pago y frecuencia. Lo demás es relleno.' },

    { type: 'fill', q: 'Completa la definición de cliente ideal',
      text: 'Le vendo a ___ que necesitan ___ porque ___ , y los encuentro en ___ .',
      bank: ['dueños de perros grandes', 'placas resistentes que no se borren', 'las de metal se oxidan en 3 meses', 'grupos de adiestramiento canino', 'todos', 'algo bonito'],
      answer: ['dueños de perros grandes', 'placas resistentes que no se borren', 'las de metal se oxidan en 3 meses', 'grupos de adiestramiento canino'],
      explain: 'Grupo + necesidad + causa + lugar. Con esas cuatro piezas ya puedes salir a buscar clientes hoy mismo.' },

    { type: 'sim', q: 'Tienes 20 horas al mes para conseguir clientes. ¿Dónde las inviertes?',
      opts: [
        { t: 'Publicar en todas las redes por si alguien cae', ok: false,
          effects: { clientes: 0, tiempo: -3, aprendizaje: 0 },
          why: 'Esfuerzo repartido, ningún público te reconoce. Es el camino más lento.' },
        { t: 'Meterte en 3 grupos de dueños de perros y participar todos los días', ok: true,
          effects: { clientes: 3, tiempo: -2, aprendizaje: 3 },
          why: 'Concentras el esfuerzo donde ya está tu cliente. Te vuelves conocido en un lugar chico.' },
        { t: 'Pagar publicidad a todo el país', ok: false,
          effects: { clientes: 1, dinero: -3, aprendizaje: 1 },
          why: 'Sin saber a quién le hablas, la publicidad es una fuga de dinero.' }
      ],
      explain: 'Domina un estanque pequeño antes de saltar al océano.' },

    { type: 'write', q: 'Define tu cliente ideal en una frase',
      sub: 'Usa la fórmula: “Le vendo a [grupo] que necesita [X] porque [causa], y los encuentro en [lugar]”.',
      ph: 'Le vendo a dueños de perros grandes que necesitan placas resistentes porque las de metal se borran en meses, y los encuentro en grupos de adiestramiento…',
      minWords: 15,
      hints: ['Evita “todos” y “cualquiera”.', 'Di un lugar real donde se juntan.'] }
  ],
  mission: {
    id: 'm1-04', title: 'Tu cliente ideal', dossier: 'cliente',
    brief: 'Define por escrito a quién le vas a vender primero. Esta decisión ordena todo lo que sigue.',
    fields: [
      { key: 'grupo', label: 'Grupo específico', type: 'text', ph: 'Dueños de perros grandes en mi ciudad' },
      { key: 'necesidad', label: 'Su necesidad concreta', type: 'text', ph: 'Placas de identificación que no se borren' },
      { key: 'donde', label: '¿Dónde se juntan? (lugar real, grupo, evento)', type: 'text', ph: 'Grupo de FB “Perros CDMX”, parque canino los domingos' },
      { key: 'pago', label: '¿Cuánto pagan hoy por algo parecido?', type: 'text', ph: 'Entre $80 y $200 por placa' }
    ],
    rubric: [
      { id: 'a', label: 'El grupo es específico, no “todos”', check: 'audience' },
      { id: 'b', label: 'La necesidad está clara', check: 'problem' },
      { id: 'c', label: 'Nombraste un lugar real donde encontrarlos', check: 'filled' },
      { id: 'd', label: 'Sabes cuánto pagan hoy', check: 'number' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 1.5 */
{
  id: 'n1-05', level: 1, icon: '📏', title: '¿Hay suficientes clientes?', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'El mercado se estima, no se adivina',
    body: [
      'No necesitas un estudio de mercado de $50,000. Necesitas una **cuenta servilleta**: cuántos son, cada cuánto compran y cuánto gastan.',
      'La fórmula: *personas alcanzables × frecuencia de compra al año × ticket promedio = mercado que puedes tocar*. Si el resultado no llega a tu meta de ingresos, el nicho es demasiado pequeño o el precio demasiado bajo.'
    ],
    keys: [
      'Alcanzables, no teóricos: los que realmente puedes contactar.',
      'Frecuencia manda: mejor 100 clientes que compran 12 veces que 1000 que compran una.',
      'Si necesitas el 30% del mercado para vivir, el nicho es muy chico.'
    ]
  },
  cas: {
    emoji: '🧮', title: 'La cuenta servilleta',
    text: 'En su ciudad hay 3 grupos de dueños de perros con 12,000 miembros en total. Estima que puede alcanzar realmente al 5% (600 personas). De esas, quizá el 10% compra (60 clientes). Compran 2 veces al año a $180 = $21,600 anuales. Suficiente para empezar como ingreso extra; insuficiente para dejar el empleo. Ese dato cambia sus decisiones desde el día uno.'
  },
  steps: [
    { type: 'quiz', q: 'Vendes servicio de mantenimiento a cafeterías. Hay 120 cafeterías en tu ciudad, contratan 4 veces al año y pagan $1,500. ¿Cuál es el mercado anual total?',
      opts: [
        { t: '$180,000', ok: false, why: 'Eso sería 120 × $1,500 × 1 vez. Olvidaste la frecuencia.' },
        { t: '$720,000', ok: true, why: '120 × 4 × $1,500 = $720,000 al año. Ese es el pastel completo.' },
        { t: '$7,200', ok: false, why: 'Revisa la multiplicación: son 480 servicios al año.' },
        { t: 'No se puede saber sin un estudio', ok: false, why: 'Sí se puede estimar, y una estimación imperfecta es infinitamente mejor que ninguna.' }
      ],
      explain: 'Clientes × frecuencia × ticket. Tres números y tienes una brújula.' },

    { type: 'slider', q: 'De ese mercado de $720,000, ¿qué porcentaje es realista capturar en tu primer año?',
      min: 0, max: 60, step: 5, value: 30, unit: '%',
      best: [5, 15],
      bands: [
        { max: 4, label: 'Demasiado conservador', tone: 'warn', msg: 'Con menos del 5% quizá no valga el esfuerzo. Revisa si puedes subir precio o frecuencia.' },
        { max: 15, label: 'Realista', tone: 'ok', msg: 'Entre 5% y 15% es lo que logra un negocio nuevo bien enfocado. Eso son $36,000 a $108,000.' },
        { max: 60, label: 'Optimismo peligroso', tone: 'bad', msg: 'Más del 15% en el año uno casi nunca pasa. Los planes basados en eso quiebran.' }
      ],
      explain: 'Planea con 5-15%. Si el negocio solo funciona capturando el 40%, no funciona.' },

    { type: 'order', q: 'Ordena los pasos de la cuenta servilleta',
      items: [
        'Cuenta cuántos clientes potenciales puedes alcanzar de verdad',
        'Estima qué porcentaje llegaría a comprarte',
        'Calcula cuántas veces compran al año',
        'Multiplica por tu ticket promedio',
        'Compara el resultado con el ingreso que necesitas'
      ],
      explain: 'Alcance → conversión → frecuencia → ticket → comparación con tu meta.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Un mercado pequeño siempre es mala señal.',
      ok: false,
      explain: 'Un mercado pequeño con ticket alto y recompra frecuente puede ser mejor que uno enorme y saturado. 50 clientes que pagan $5,000 al año son $250,000.' },

    { type: 'write', q: 'Haz tu cuenta servilleta',
      sub: 'Escribe tus números aunque sean estimaciones. Después los ajustas.',
      ph: 'Puedo alcanzar a 600 personas, quizá me compren 60, dos veces al año, a $180 = $21,600…',
      minWords: 12,
      hints: ['¿Cuántos puedes contactar realmente?', '¿Cada cuánto compran?', '¿Cuánto pagarías tú?'] }
  ],
  mission: {
    id: 'm1-05', title: 'Tu cuenta servilleta', dossier: null,
    brief: 'Con números aproximados, calcula el tamaño de tu oportunidad. Vale más una estimación imperfecta que ninguna.',
    fields: [
      { key: 'alcance', label: 'Personas que puedes alcanzar', type: 'num', ph: '600' },
      { key: 'conv', label: '% que crees que compraría', type: 'num', ph: '10' },
      { key: 'freq', label: 'Compras por año de cada cliente', type: 'num', ph: '2' },
      { key: 'ticket', label: 'Ticket promedio ($)', type: 'num', ph: '180' }
    ],
    rubric: [
      { id: 'a', label: 'Pusiste los cuatro números', check: 'numbers' },
      { id: 'b', label: 'El resultado es coherente con tu meta', check: 'auto' }
    ],
    reward: { xp: 35, coins: 20 }
  }
},

/* ------------------------------------------------------------------ 1.6 */
{
  id: 'n1-06', level: 1, icon: '⚔️', title: 'Competencia y diferenciación', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Si no hay competencia, desconfía',
    body: [
      'Que existan competidores es **buena noticia**: significa que hay dinero moviéndose. El problema no es competir, es competir sin diferencia, porque entonces solo queda bajar el precio.',
      'Diferenciarse no es ser mejor en todo. Es ser **claramente distinto en algo que a tu cliente le importa**: rapidez, garantía, especialización, trato, formato o dónde te encuentra.'
    ],
    keys: [
      'Sin competencia = probablemente sin mercado.',
      'Diferencia real = la que el cliente puede notar y nombrar.',
      '“Mejor calidad” no es diferencia: todos lo dicen.'
    ]
  },
  cas: {
    emoji: '🚚', title: 'Igual producto, otra promesa',
    text: 'Dos talleres imprimen las mismas piezas al mismo precio. Uno dice “calidad garantizada”. El otro dice “si tu pieza rota llega antes de las 10 am, la tienes lista hoy a las 6 pm”. El segundo cobra 40% más y tiene lista de espera. No cambió el producto: cambió la promesa.'
  },
  steps: [
    { type: 'quiz', q: 'Investigas y descubres 8 competidores en tu ciudad. ¿Qué significa?',
      opts: [
        { t: 'Que el mercado está saturado y debo buscar otra cosa', ok: false, why: 'Ocho competidores viviendo de eso significa que hay demanda constante.' },
        { t: 'Que hay demanda comprobada y necesito una diferencia clara', ok: true, why: 'Correcto. La competencia valida el mercado; tu trabajo es encontrar el hueco.' },
        { t: 'Que debo cobrar más barato que todos', ok: false, why: 'La guerra de precios la gana quien tenga más dinero para aguantar pérdidas. No serás tú.' },
        { t: 'Que necesito un producto totalmente nuevo', ok: false, why: 'Innovar en todo es caro y riesgoso. Basta con una diferencia relevante.' }
      ],
      explain: 'Competencia = demanda comprobada. Sin diferencia = guerra de precios.' },

    { type: 'multi', q: '¿Cuáles son diferencias REALES? (elige todas)',
      opts: [
        { t: 'Entrega en 24 horas cuando todos tardan una semana', ok: true },
        { t: 'Somos apasionados por lo que hacemos', ok: false },
        { t: 'Garantía de reposición sin preguntas por 6 meses', ok: true },
        { t: 'Excelente calidad y buen servicio', ok: false },
        { t: 'Solo trabajamos con clínicas dentales y conocemos sus normas', ok: true },
        { t: 'Precios competitivos', ok: false }
      ],
      explain: 'Rapidez, garantía y especialización son verificables. “Calidad”, “pasión” y “buen servicio” los dice todo el mundo.' },

    { type: 'match', q: 'Empareja el tipo de diferencia con su ejemplo',
      pairs: [
        ['Especialización', 'Solo hacemos piezas para máquinas de coser antiguas'],
        ['Velocidad', 'Cotización en 15 minutos, siempre'],
        ['Garantía', 'Si se rompe en 6 meses, la repongo gratis']
      ],
      explain: 'Elige una y hazla verificable. Una diferencia clara vale más que cinco vagas.' },

    { type: 'sim', q: 'Un competidor baja su precio 25%. ¿Qué haces?',
      opts: [
        { t: 'Bajar el mío 30% para ganarle', ok: false,
          effects: { dinero: -3, reputacion: -1, clientes: 1 },
          why: 'Entras en una carrera hacia el fondo. Ganas volumen y pierdes margen: el camino más rápido a cerrar.' },
        { t: 'Mantener precio y reforzar mi diferencia con una garantía visible', ok: true,
          effects: { dinero: 1, reputacion: 2, clientes: 1 },
          why: 'Compites por valor, no por precio. Pierdes a los cazadores de ofertas y te quedas con los que pagan bien.' },
        { t: 'No hacer nada y esperar', ok: false,
          effects: { dinero: -1, reputacion: 0, clientes: -2 },
          why: 'El silencio hace que el cliente decida solo con el precio.' }
      ],
      explain: 'Cuando alguien baja el precio, tú sube el valor percibido.' },

    { type: 'write', q: 'Escribe tu diferencia en una frase verificable',
      sub: 'Debe poder comprobarse. Si no se puede medir, no es diferencia.',
      ph: 'Soy el único que entrega piezas de repuesto impresas en 48 horas con garantía de 6 meses…',
      minWords: 10,
      hints: ['¿Qué puedes prometer que otros no?', '¿Se puede medir en horas, meses o dinero?'] }
  ],
  mission: {
    id: 'm1-06', title: 'Radiografía de la competencia', dossier: null,
    brief: 'Investiga 3 competidores reales. Anota qué prometen, qué cobran y qué NO están haciendo.',
    fields: [
      { key: 'c1', label: 'Competidor 1 — qué promete y qué cobra', type: 'text', ph: 'Taller X — “calidad”, $200 la pieza, 7 días' },
      { key: 'c2', label: 'Competidor 2', type: 'text', ph: '' },
      { key: 'c3', label: 'Competidor 3', type: 'text', ph: '' },
      { key: 'hueco', label: '¿Qué hueco ves que nadie está cubriendo?', type: 'area', ph: 'Ninguno da garantía ni fecha exacta de entrega…' }
    ],
    rubric: [
      { id: 'a', label: 'Investigaste tres competidores reales', check: 'filled' },
      { id: 'b', label: 'Anotaste precios concretos', check: 'number' },
      { id: 'c', label: 'Identificaste un hueco específico', check: 'reason' }
    ],
    reward: { xp: 40, coins: 25 }
  }
},

/* ------------------------------------------------------------------ 1.7 */
{
  id: 'n1-07', level: 1, icon: '🧭', title: 'De problema a hipótesis', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Convierte tu idea en una apuesta comprobable',
    body: [
      'Una idea vaga no se puede probar. Una **hipótesis** sí, porque dice exactamente qué crees y cómo sabrás si te equivocaste.',
      'La fórmula: *Creo que [cliente] con [problema] pagará [precio] por [solución], y lo sabré cuando [señal medible]*.'
    ],
    keys: [
      'Toda idea es una apuesta hasta que alguien paga.',
      'Escribe de antemano qué señal te haría cambiar de rumbo.',
      'Una hipótesis sin número no se puede probar.'
    ]
  },
  cas: {
    emoji: '📝', title: 'La apuesta escrita',
    text: '“Creo que los dueños de perros grandes pagarán $220 por una placa personalizada con garantía de 1 año, y lo sabré cuando 5 personas me hagan un anticipo en las próximas 2 semanas.” Con esa frase ya sabe qué hacer mañana y cuándo se equivocó.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál de estas SÍ es una hipótesis comprobable?',
      opts: [
        { t: 'Creo que mi producto le va a gustar a mucha gente', ok: false, why: 'No dice quién, ni cuánto, ni cómo lo comprobarás.' },
        { t: 'Voy a hacer el mejor producto del mercado', ok: false, why: 'Es un deseo, no una apuesta medible.' },
        { t: 'Creo que las cafeterías pagarán $1,500 por mantenimiento trimestral, y lo sabré si 3 firman en 3 semanas', ok: true, why: 'Cliente, precio, solución y señal medible con plazo. Se puede probar.' },
        { t: 'Este negocio tiene mucho potencial', ok: false, why: '“Potencial” es la palabra favorita de las ideas que nunca se prueban.' }
      ],
      explain: 'Cliente + problema + precio + señal + plazo. Sin esos cinco, no es hipótesis.' },

    { type: 'fill', q: 'Arma la hipótesis con las piezas correctas',
      text: 'Creo que ___ pagarán ___ por ___ , y lo sabré cuando ___ .',
      bank: ['las estéticas de mi zona', '$450 al mes', 'un sistema de recordatorio de citas', '4 acepten una prueba pagada en 15 días', 'la gente', 'algo útil'],
      answer: ['las estéticas de mi zona', '$450 al mes', 'un sistema de recordatorio de citas', '4 acepten una prueba pagada en 15 días'],
      explain: 'Cuando tienes la frase completa, ya sabes exactamente qué hacer mañana.' },

    { type: 'multi', q: '¿Qué señales sirven para comprobar una hipótesis? (elige todas)',
      opts: [
        { t: 'Alguien te da un anticipo', ok: true },
        { t: 'Alguien dice “qué buena idea”', ok: false },
        { t: 'Alguien aparta fecha y deja su teléfono', ok: true },
        { t: 'Te dan muchos likes', ok: false },
        { t: 'Alguien te pregunta cuánto cuesta y cómo pagar', ok: true }
      ],
      explain: 'Señal válida = cuesta algo (dinero, tiempo o compromiso). Los likes son gratis.' },

    { type: 'slider', q: '¿Cuánto tiempo te das para comprobar tu primera hipótesis?',
      min: 1, max: 24, step: 1, value: 12, unit: ' semanas',
      best: [2, 4],
      bands: [
        { max: 1, label: 'Muy corto', tone: 'warn', msg: 'Una semana puede no alcanzar para contactar suficientes personas.' },
        { max: 4, label: 'Ideal', tone: 'ok', msg: 'De 2 a 4 semanas: suficiente para conseguir señales, corto para no enamorarte de la idea.' },
        { max: 24, label: 'Demasiado', tone: 'bad', msg: 'Más de un mes sin señales claras significa que estás evitando el veredicto.' }
      ],
      explain: 'Plazos cortos: obligan a salir a la calle en vez de perfeccionar en el escritorio.' },

    { type: 'write', q: 'Escribe tu hipótesis completa',
      sub: 'Creo que [cliente] pagará [precio] por [solución], y lo sabré cuando [señal] antes de [fecha].',
      ph: 'Creo que los dueños de perros grandes pagarán $220 por una placa con garantía, y lo sabré cuando 5 me den anticipo antes del 30 de este mes…',
      minWords: 18,
      hints: ['Incluye un precio.', 'Incluye un número de personas.', 'Incluye una fecha.'] }
  ],
  mission: {
    id: 'm1-07', title: 'Tu idea en una frase', dossier: 'idea',
    brief: 'Esta frase va a encabezar tu expediente de negocio. Escríbela como si tuvieras que defenderla mañana.',
    fields: [
      { key: 'idea', label: 'Tu hipótesis de negocio', type: 'area',
        ph: 'Creo que [cliente] pagará [precio] por [solución], y lo sabré cuando [señal] antes de [fecha].' },
      { key: 'riesgo', label: '¿Cuál es la parte más frágil de tu apuesta?', type: 'text', ph: 'Que digan que sí pero no paguen' }
    ],
    rubric: [
      { id: 'a', label: 'Nombra un cliente específico', check: 'audience' },
      { id: 'b', label: 'Incluye un precio', check: 'number' },
      { id: 'c', label: 'Define una señal medible con plazo', check: 'measurable' },
      { id: 'd', label: 'Reconoces el riesgo principal', check: 'filled' }
    ],
    reward: { xp: 60, coins: 40 }
  }
}

]);
