/* ==========================================================================
   Configuración del juego: niveles, insignias, ligas, tienda, retos
   ========================================================================== */
(function (w) {
  'use strict';

  var LEVELS = [
    { n: 1, key: 'descubre',   title: 'Descubre',   icon: '🔎', color: '#43C95E', dark: '#2E9B44',
      outcome: 'Encuentras problemas y oportunidades reales.' },
    { n: 2, key: 'valida',     title: 'Valida',     icon: '🧪', color: '#1CB0F6', dark: '#1189C4',
      outcome: 'Compruebas si alguien de verdad compraría.' },
    { n: 3, key: 'construye',  title: 'Construye',  icon: '🔧', color: '#A855F7', dark: '#7E2FD1',
      outcome: 'Creas tu producto mínimo viable y le pones precio.' },
    { n: 4, key: 'vende',      title: 'Vende',      icon: '🤝', color: '#FF6B1A', dark: '#D14E06',
      outcome: 'Consigues tus primeros clientes de verdad.' },
    { n: 5, key: 'administra', title: 'Administra', icon: '📊', color: '#14B8A6', dark: '#0E8C7E',
      outcome: 'Controlas costos, ingresos e inventario.' },
    { n: 6, key: 'crece',      title: 'Crece',      icon: '📈', color: '#EC4899', dark: '#BE2D74',
      outcome: 'Haces marketing y aumentas tus ventas.' },
    { n: 7, key: 'sistematiza',title: 'Sistematiza',icon: '⚙️', color: '#6366F1', dark: '#4348C7',
      outcome: 'Automatizas, delegas y documentas.' },
    { n: 8, key: 'escala',     title: 'Escala',     icon: '🚀', color: '#FFC800', dark: '#D9A400',
      outcome: 'Contratas, reinviertes y expandes.' }
  ];

  /* ------------------------- Jefes finales (retos reales) ------------------------- */
  var BOSSES = [
    { id: 'boss-1', level: 1, icon: '🎤', title: 'Tu primera entrevista',
      subtitle: 'Habla con un cliente potencial de verdad',
      brief: 'Consigue una conversación de 10 minutos con alguien que tenga el problema que detectaste. No vendas: pregunta.',
      xp: 120, coins: 60, dossier: 'problema',
      fields: [
        { key: 'quien', label: '¿Con quién hablaste?', type: 'text', ph: 'Nombre o descripción: “Laura, dueña de 2 perros”' },
        { key: 'dolor', label: '¿Cuál fue su queja más fuerte, en sus palabras?', type: 'area', ph: '“Odio que los collares se rompan a los dos meses…”' },
        { key: 'gasto', label: '¿Qué gasta hoy para resolverlo? (dinero, tiempo o esfuerzo)', type: 'text', ph: '$300 al mes en collares nuevos' }
      ],
      rubric: [
        { id: 'real', label: 'Hablaste con una persona concreta', check: 'named' },
        { id: 'cita', label: 'Recogiste sus palabras textuales', check: 'quote' },
        { id: 'gasto', label: 'Identificaste qué gasta hoy', check: 'number' },
        { id: 'nopitch', label: 'No caíste en vender tu idea', check: 'nopitch' }
      ] },

    { id: 'boss-2', level: 2, icon: '📣', title: 'Publica tu primera oferta',
      subtitle: 'Ponla frente a gente real y mide',
      brief: 'Publica tu oferta en un grupo, tu estado o marketplace. Meta: 3 respuestas de personas interesadas.',
      xp: 140, coins: 70, dossier: 'oferta',
      fields: [
        { key: 'texto', label: 'Pega aquí el texto que publicaste', type: 'area', ph: 'Para dueños de perros grandes que rompen collares…' },
        { key: 'donde', label: '¿Dónde lo publicaste?', type: 'text', ph: 'Grupo de Facebook “Perros CDMX”' },
        { key: 'respuestas', label: '¿Cuántas respuestas obtuviste?', type: 'text', ph: '4' }
      ],
      rubric: [
        { id: 'aud', label: 'La oferta nombra a un público concreto', check: 'audience' },
        { id: 'prob', label: 'Menciona un problema, no solo el producto', check: 'problem' },
        { id: 'cta', label: 'Tiene una llamada a la acción clara', check: 'cta' },
        { id: 'canal', label: 'Elegiste un canal donde está tu cliente', check: 'filled' }
      ] },

    { id: 'boss-3', level: 3, icon: '🧮', title: 'Calcula tus costos',
      subtitle: 'Costo unitario, precio y punto de equilibrio',
      brief: 'Con números reales: cuánto te cuesta una unidad, a cuánto la vendes y cuántas necesitas para no perder.',
      xp: 150, coins: 80, dossier: 'precio',
      fields: [
        { key: 'costo', label: 'Costo variable por unidad ($)', type: 'num', ph: '45' },
        { key: 'precio', label: 'Precio de venta ($)', type: 'num', ph: '150' },
        { key: 'fijos', label: 'Costos fijos del mes ($)', type: 'num', ph: '1200' },
        { key: 'como', label: '¿Cómo llegaste a ese precio?', type: 'area', ph: 'Comparé 3 competidores y sumé 60% de margen…' }
      ],
      rubric: [
        { id: 'num', label: 'Usaste números reales, no inventados', check: 'numbers' },
        { id: 'margen', label: 'Tu precio deja margen positivo', check: 'margin' },
        { id: 'pe', label: 'Sabes cuántas unidades son tu punto de equilibrio', check: 'auto' },
        { id: 'razon', label: 'Justificaste el precio con un criterio', check: 'reason' }
      ] },

    { id: 'boss-4', level: 4, icon: '💬', title: 'Envía tu primera cotización',
      subtitle: '10 contactos → 1 cotización enviada',
      brief: 'Contacta a 10 personas del público que elegiste y envía al menos una cotización formal.',
      xp: 170, coins: 90, dossier: 'ventas',
      fields: [
        { key: 'mensaje', label: 'El mensaje que enviaste', type: 'area', ph: 'Hola Laura, vi que…' },
        { key: 'contactos', label: '¿A cuántas personas contactaste?', type: 'num', ph: '10' },
        { key: 'respondieron', label: '¿Cuántas respondieron?', type: 'num', ph: '3' },
        { key: 'cotizacion', label: 'Resumen de la cotización enviada', type: 'area', ph: '3 collares personalizados — $450 — entrega 5 días' }
      ],
      rubric: [
        { id: 'perso', label: 'El mensaje es personalizado, no genérico', check: 'personal' },
        { id: 'vol', label: 'Contactaste al menos 10 personas', check: 'ten' },
        { id: 'cot', label: 'La cotización tiene precio y plazo', check: 'quote2' },
        { id: 'seg', label: 'Definiste cómo darás seguimiento', check: 'filled' }
      ] },

    { id: 'boss-5', level: 5, icon: '🧾', title: 'Cierra tu primer mes',
      subtitle: 'Ingresos, gastos y utilidad reales',
      brief: 'Registra todo lo que entró y salió este mes. Sin adornos. El número que salga es tu punto de partida.',
      xp: 180, coins: 100, dossier: 'numeros',
      fields: [
        { key: 'ingresos', label: 'Ingresos del mes ($)', type: 'num', ph: '4800' },
        { key: 'gastos', label: 'Gastos del mes ($)', type: 'num', ph: '3100' },
        { key: 'unidades', label: 'Unidades vendidas', type: 'num', ph: '32' },
        { key: 'aprendizaje', label: '¿Qué gasto te sorprendió?', type: 'area', ph: 'Los envíos me costaron el doble de lo que pensaba' }
      ],
      rubric: [
        { id: 'reg', label: 'Registraste ingresos y gastos', check: 'numbers' },
        { id: 'util', label: 'Calculaste tu utilidad', check: 'auto' },
        { id: 'ticket', label: 'Conoces tu ticket promedio', check: 'auto' },
        { id: 'refl', label: 'Sacaste una conclusión concreta', check: 'reason' }
      ] },

    { id: 'boss-6', level: 6, icon: '🔥', title: 'Tres clientes nuevos',
      subtitle: 'Una semana, tres ventas',
      brief: 'Aplica lo aprendido de marketing y consigue tres clientes nuevos en siete días.',
      xp: 200, coins: 110, dossier: 'clientes',
      fields: [
        { key: 'accion', label: '¿Qué hiciste para conseguirlos?', type: 'area', ph: 'Publiqué 3 videos del proceso y pedí referidos…' },
        { key: 'clientes', label: '¿Cuántos clientes nuevos conseguiste?', type: 'num', ph: '3' },
        { key: 'canal', label: '¿Cuál canal funcionó mejor?', type: 'text', ph: 'Instagram + recomendación de un cliente' }
      ],
      rubric: [
        { id: 'tres', label: 'Conseguiste al menos 3 clientes', check: 'three' },
        { id: 'accion', label: 'Describiste acciones concretas', check: 'reason' },
        { id: 'canal', label: 'Identificaste qué canal funcionó', check: 'filled' },
        { id: 'repetir', label: 'Sabes qué repetir la próxima semana', check: 'filled' }
      ] },

    { id: 'boss-7', level: 7, icon: '📋', title: 'Documenta tu proceso',
      subtitle: 'Escribe cómo se hace, paso a paso',
      brief: 'Elige tu proceso más importante y escríbelo tan claro que otra persona pueda ejecutarlo sin ti.',
      xp: 190, coins: 100, dossier: 'procesos',
      fields: [
        { key: 'proceso', label: '¿Qué proceso documentaste?', type: 'text', ph: 'Desde que llega un pedido hasta que se entrega' },
        { key: 'pasos', label: 'Escribe los pasos (uno por línea)', type: 'area', ph: '1. Confirmar medidas\n2. Cobrar 50%\n3. Imprimir…' },
        { key: 'tiempo', label: '¿Cuánto tiempo toma completo?', type: 'text', ph: '3 horas + 12 h de impresión' }
      ],
      rubric: [
        { id: 'pasos', label: 'Tiene al menos 5 pasos numerados', check: 'steps' },
        { id: 'claro', label: 'Cada paso empieza con un verbo de acción', check: 'verbs' },
        { id: 'tiempo', label: 'Incluye tiempos', check: 'filled' },
        { id: 'deleg', label: 'Se puede delegar tal cual está', check: 'reason' }
      ] },

    { id: 'boss-8', level: 8, icon: '🏆', title: 'Recupera tu inversión',
      subtitle: 'Y define tu plan de 90 días',
      brief: 'El reto final: demuestra que el negocio devolvió lo que metiste y escribe adónde va en los próximos 90 días.',
      xp: 260, coins: 200, dossier: 'plan',
      fields: [
        { key: 'inversion', label: 'Inversión inicial total ($)', type: 'num', ph: '8000' },
        { key: 'recuperado', label: 'Utilidad acumulada hasta hoy ($)', type: 'num', ph: '8600' },
        { key: 'meta', label: 'Tu meta a 90 días (en números)', type: 'text', ph: 'Vender 120 piezas / $30,000 de ingreso' },
        { key: 'plan', label: 'Las 3 acciones que la harán posible', type: 'area', ph: '1. Publicar 3 veces por semana\n2. Cerrar 2 tiendas mayoristas\n3. Subir el precio 15%' }
      ],
      rubric: [
        { id: 'roi', label: 'Recuperaste la inversión inicial', check: 'roi' },
        { id: 'meta', label: 'Tu meta es medible', check: 'measurable' },
        { id: 'acciones', label: 'Definiste 3 acciones concretas', check: 'steps' },
        { id: 'fecha', label: 'Tiene un plazo claro', check: 'filled' }
      ] }
  ];

  /* ------------------------- Secciones del expediente ------------------------- */
  var DOSSIER = [
    { key: 'idea',      icon: '💡', title: 'Tu idea en una frase',   hint: 'Qué haces, para quién y por qué importa.' },
    { key: 'problema',  icon: '🩹', title: 'El problema que resuelves', hint: 'El dolor real, en palabras de tu cliente.' },
    { key: 'cliente',   icon: '🎯', title: 'Tu cliente ideal',       hint: 'A quién le vendes primero. Concreto, no “todos”.' },
    { key: 'oferta',    icon: '🎁', title: 'Tu oferta',              hint: 'Qué entregas, qué incluye y qué promete.' },
    { key: 'precio',    icon: '🏷️', title: 'Costos y precio',        hint: 'Costo unitario, precio, margen, punto de equilibrio.' },
    { key: 'identidad', icon: '🎨', title: 'Identidad básica',       hint: 'Nombre, promesa, tono y cómo te ven.' },
    { key: 'canales',   icon: '📍', title: 'Dónde vendes',           hint: 'Los 2 canales donde sí está tu cliente.' },
    { key: 'ventas',    icon: '🗣️', title: 'Guion de ventas',        hint: 'Cómo contactas, cotizas y cierras.' },
    { key: 'numeros',   icon: '📒', title: 'Tus números',            hint: 'Ingresos, gastos, utilidad y ticket promedio.' },
    { key: 'procesos',  icon: '⚙️', title: 'Tu proceso clave',       hint: 'Cómo se hace, paso a paso, para poder delegar.' },
    { key: 'clientes',  icon: '👥', title: 'Primeros clientes',      hint: 'Quiénes te compraron y qué dijeron.' },
    { key: 'plan',      icon: '🗺️', title: 'Plan de 90 días',        hint: 'Meta medible y las 3 acciones que la logran.' }
  ];

  /* ------------------------- Insignias ------------------------- */
  var BADGES = [
    { id: 'first-step',  icon: '👣', name: 'Primer paso',      desc: 'Completa tu primera lección.' },
    { id: 'streak-3',    icon: '🔥', name: 'Tres seguidos',    desc: 'Racha de 3 días.' },
    { id: 'streak-7',    icon: '⚡', name: 'Semana completa',  desc: 'Racha de 7 días.' },
    { id: 'streak-30',   icon: '🌋', name: 'Imparable',        desc: 'Racha de 30 días.' },
    { id: 'perfect',     icon: '💎', name: 'Sin errores',      desc: 'Termina una lección con 100%.' },
    { id: 'perfect-5',   icon: '🎯', name: 'Puntería',         desc: '5 lecciones perfectas.' },
    { id: 'lv1',         icon: '🔎', name: 'Explorador',       desc: 'Termina el nivel Descubre.' },
    { id: 'lv2',         icon: '🧪', name: 'Validador',        desc: 'Termina el nivel Valida.' },
    { id: 'lv3',         icon: '🔧', name: 'Constructor',      desc: 'Termina el nivel Construye.' },
    { id: 'lv4',         icon: '🤝', name: 'Vendedor',         desc: 'Termina el nivel Vende.' },
    { id: 'lv5',         icon: '📊', name: 'Administrador',    desc: 'Termina el nivel Administra.' },
    { id: 'lv6',         icon: '📈', name: 'Growth',           desc: 'Termina el nivel Crece.' },
    { id: 'lv7',         icon: '⚙️', name: 'Sistematizador',   desc: 'Termina el nivel Sistematiza.' },
    { id: 'lv8',         icon: '🚀', name: 'Escalador',        desc: 'Termina el nivel Escala.' },
    { id: 'first-boss',  icon: '👑', name: 'Cazajefes',        desc: 'Supera tu primer reto real.' },
    { id: 'all-bosses',  icon: '🏆', name: 'Leyenda',          desc: 'Supera los 8 retos reales.' },
    { id: 'sim-profit',  icon: '💰', name: 'Rentable',         desc: 'Cierra el simulador con utilidad.' },
    { id: 'sim-master',  icon: '🏭', name: 'Empresario',       desc: 'Termina las 12 semanas del simulador.' },
    { id: 'mentor-10',   icon: '🧠', name: 'Preguntón',        desc: '10 consultas al mentor.' },
    { id: 'dossier-half',icon: '📂', name: 'Expediente',       desc: 'Llena 6 secciones de Mi Negocio.' },
    { id: 'dossier-full',icon: '📜', name: 'Plan completo',    desc: 'Llena las 12 secciones de Mi Negocio.' },
    { id: 'xp-1000',     icon: '⭐', name: '1000 XP',          desc: 'Acumula 1000 puntos.' },
    { id: 'xp-5000',     icon: '🌟', name: '5000 XP',          desc: 'Acumula 5000 puntos.' },
    { id: 'night',       icon: '🌙', name: 'Nocturno',         desc: 'Estudia después de las 11 pm.' },
    { id: 'early',       icon: '🌅', name: 'Madrugador',       desc: 'Estudia antes de las 7 am.' },
    { id: 'comeback',    icon: '🔄', name: 'Regresaste',       desc: 'Vuelve tras perder una racha.' }
  ];

  /* ------------------------- Ligas ------------------------- */
  var LEAGUES = [
    { key: 'bronce',   name: 'Bronce',   icon: '🥉', min: 0 },
    { key: 'plata',    name: 'Plata',    icon: '🥈', min: 300 },
    { key: 'oro',      name: 'Oro',      icon: '🥇', min: 800 },
    { key: 'zafiro',   name: 'Zafiro',   icon: '🔷', min: 1600 },
    { key: 'rubi',     name: 'Rubí',     icon: '🔴', min: 2800 },
    { key: 'diamante', name: 'Diamante', icon: '💎', min: 4500 },
    { key: 'leyenda',  name: 'Leyenda',  icon: '👑', min: 7000 }
  ];

  var BOT_NAMES = [
    'Valeria R.', 'Diego M.', 'Sofía L.', 'Andrés P.', 'Camila T.', 'Mateo G.',
    'Renata V.', 'Sebastián C.', 'Ximena A.', 'Bruno F.', 'Lucía N.', 'Emiliano S.',
    'Paola D.', 'Iván H.', 'Regina O.', 'Tomás B.', 'Fernanda Q.', 'Joaquín Z.'
  ];

  /* ------------------------- Tienda ------------------------- */
  var SHOP = [
    { id: 'hearts',  icon: '❤️', name: 'Recarga de vidas',   desc: 'Rellena tus 5 vidas al instante.', price: 60 },
    { id: 'freeze',  icon: '🧊', name: 'Congelador de racha', desc: 'Protege tu racha un día que falles.', price: 90, max: 3 },
    { id: 'double',  icon: '⚡', name: 'XP doble (30 min)',  desc: 'Duplica los puntos que ganes.', price: 120 },
    { id: 'hint',    icon: '💡', name: 'Paquete de 3 pistas', desc: 'Descarta una opción incorrecta en las lecciones.', price: 45 },
    { id: 'audit',   icon: '🔬', name: 'Auditoría del negocio', desc: 'Reviso las 12 secciones de Mi Negocio y te doy las 3 prioridades.', price: 150 }
  ];

  /* ------------------------- Retos semanales ------------------------- */
  var WEEKLY = [
    { id: 'w-lessons', icon: '📚', title: 'Completa 10 lecciones', goal: 10, metric: 'lessons', xp: 150, coins: 80 },
    { id: 'w-perfect', icon: '💎', title: '3 lecciones perfectas',  goal: 3,  metric: 'perfect', xp: 120, coins: 60 },
    { id: 'w-mission', icon: '🎯', title: 'Entrega 2 misiones reales', goal: 2, metric: 'missions', xp: 200, coins: 120 },
    { id: 'w-sim',     icon: '🏭', title: 'Juega 4 semanas del simulador', goal: 4, metric: 'sim', xp: 130, coins: 70 },
    { id: 'w-streak',  icon: '🔥', title: 'Practica 5 días', goal: 5, metric: 'days', xp: 180, coins: 100 }
  ];

  /* ------------------------- Onboarding ------------------------- */
  var GOALS = [
    { key: 'zero', emoji: '🌱', title: 'Quiero comenzar desde cero',
      sub: 'Todavía no tengo una idea. Ayúdame a encontrarla.' },
    { key: 'idea', emoji: '💡', title: 'Tengo una idea',
      sub: 'Quiero comprobar si puede funcionar antes de invertir.' },
    { key: 'business', emoji: '🏪', title: 'Ya tengo un negocio',
      sub: 'Quiero vender más y organizarlo mejor.' }
  ];

  /* Etapa real del emprendimiento. Sustituye al antiguo "punto de partida":
     es más precisa y se sigue traduciendo a GOALS para la ruta. */
  var STAGES = [
    { key: 'idea',      emoji: '💡', title: 'Solo la idea',
      sub: 'Todavía no vendo nada.' },
    { key: 'starting',  emoji: '🌱', title: 'Comenzando',
      sub: 'Estoy preparando el arranque o hice mis primeras ventas.' },
    { key: 'operating', emoji: '🏪', title: 'Operando',
      sub: 'Ya vendo con cierta regularidad.' },
    { key: 'growing',   emoji: '📈', title: 'Creciendo',
      sub: 'Ya vendo y quiero escalar.' }
  ];

  var OBJECTIVES = [
    { key: 'validar', emoji: '🧪', title: 'Comprobar si mi idea funciona',
      sub: 'Antes de invertir tiempo o dinero.' },
    { key: 'primera', emoji: '🤝', title: 'Conseguir mi primer cliente',
      sub: 'Que alguien me pague por primera vez.' },
    { key: 'vender',  emoji: '💰', title: 'Vender más y con constancia',
      sub: 'Ya vendo, pero a saltos.' },
    { key: 'ordenar', emoji: '📊', title: 'Ordenar y controlar el negocio',
      sub: 'Números, procesos y precios claros.' },
    { key: 'escalar', emoji: '🚀', title: 'Crecer, delegar y escalar',
      sub: 'Que no dependa solo de mí.' }
  ];

  var SECTORS = [
    { key: 'hechoamano', emoji: '🧵', title: 'Hecho a mano / fabricación', ex: 'impresión 3D, artesanía, resina, carpintería' },
    { key: 'comida',     emoji: '🍰', title: 'Comida y bebida',            ex: 'repostería, comida preparada, café' },
    { key: 'servicios',  emoji: '🛠️', title: 'Servicios',                  ex: 'limpieza, reparación, clases, belleza' },
    { key: 'digital',    emoji: '💻', title: 'Digital',                    ex: 'diseño, marketing, software, cursos' },
    { key: 'reventa',    emoji: '📦', title: 'Compra y reventa',           ex: 'ropa, importación, tienda en línea' },
    { key: 'otro',       emoji: '✨', title: 'Otro / aún no lo sé',        ex: 'te ayudo a decidirlo en el camino' }
  ];

  var KNOWLEDGE = [
    { key: 'none', emoji: '🐣', title: 'Empiezo de cero', sub: 'Nunca he vendido nada.' },
    { key: 'some', emoji: '🐥', title: 'Algo he intentado', sub: 'He vendido, pero sin método.' },
    { key: 'lots', emoji: '🦅', title: 'Ya tengo experiencia', sub: 'Vendo, pero quiero ordenarlo y crecer.' }
  ];

  var TIMES = [
    { key: 10, emoji: '⏱️', title: '10 min al día', sub: 'Ritmo tranquilo.' },
    { key: 20, emoji: '⏰', title: '20 min al día', sub: 'Ritmo recomendado.' },
    { key: 40, emoji: '🚀', title: '40 min al día', sub: 'Modo intenso.' }
  ];

  var BUDGETS = [
    { key: 'none', emoji: '🫙', title: 'Cero pesos',      sub: 'Empezamos con lo que ya tienes.' },
    { key: 'low',  emoji: '💵', title: 'Menos de $2,000', sub: 'Suficiente para validar.' },
    { key: 'mid',  emoji: '💰', title: '$2,000 a $20,000', sub: 'Alcanza para un primer lote.' },
    { key: 'high', emoji: '🏦', title: 'Más de $20,000',  sub: 'Cuidado: invertir antes de validar quema dinero.' }
  ];

  /* ------------------------- Niveles de usuario (rango) ------------------------- */
  function rankFor(xp) {
    var ranks = [
      { min: 0,     name: 'Curioso',     icon: '🐣' },
      { min: 250,   name: 'Explorador',  icon: '🧭' },
      { min: 700,   name: 'Aprendiz',    icon: '🔧' },
      { min: 1400,  name: 'Vendedor',    icon: '🤝' },
      { min: 2400,  name: 'Operador',    icon: '📊' },
      { min: 3800,  name: 'Estratega',   icon: '♟️' },
      { min: 5600,  name: 'Fundador',    icon: '🏗️' },
      { min: 8000,  name: 'Empresario',  icon: '🏢' },
      { min: 11000, name: 'Mentor',      icon: '🧠' },
      { min: 15000, name: 'Leyenda',     icon: '👑' }
    ];
    var cur = ranks[0], next = null;
    for (var i = 0; i < ranks.length; i++) {
      if (xp >= ranks[i].min) { cur = ranks[i]; next = ranks[i + 1] || null; }
    }
    return {
      level: ranks.indexOf(cur) + 1,
      name: cur.name, icon: cur.icon,
      min: cur.min,
      next: next,
      progress: next ? Math.min(100, ((xp - cur.min) / (next.min - cur.min)) * 100) : 100
    };
  }

  w.CONFIG = {
    LEVELS: LEVELS, BOSSES: BOSSES, DOSSIER: DOSSIER, BADGES: BADGES,
    LEAGUES: LEAGUES, BOT_NAMES: BOT_NAMES, SHOP: SHOP, WEEKLY: WEEKLY,
    GOALS: GOALS, SECTORS: SECTORS, KNOWLEDGE: KNOWLEDGE, TIMES: TIMES, BUDGETS: BUDGETS,
    STAGES: STAGES, OBJECTIVES: OBJECTIVES,
    rankFor: rankFor
  };

  // Registro global de lecciones (lo llenan los archivos lessons-*.js)
  w.LESSONS = w.LESSONS || [];
  w.addLessons = function (arr) { w.LESSONS.push.apply(w.LESSONS, arr); };
})(window);
