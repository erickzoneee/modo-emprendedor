/* ==========================================================================
   NIVEL 8 — ESCALA · Contratas, reinviertes y expandes
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 8.1 */
{
  id: 'n8-01', level: 8, icon: '🧗', title: 'Cuándo escalar (y cuándo no)', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Escalar un negocio roto solo rompe más rápido',
    body: [
      'Escalar significa crecer sin que el esfuerzo crezca igual. Solo funciona si antes tienes tres cosas: **demanda constante**, **margen sano** y **procesos documentados**.',
      'Si te falta una de las tres, crecer multiplica el problema: más ventas con margen bajo es más trabajo por menos dinero; más ventas sin procesos es más errores.'
    ],
    keys: [
      'Tres requisitos: demanda estable, margen sano, procesos escritos.',
      'Si vendes más y ganas igual, tienes un problema de margen, no de volumen.',
      'Crecer sin sistema es multiplicar el caos.'
    ]
  },
  cas: {
    emoji: '🏗️', title: 'Los que crecieron demasiado pronto',
    text: 'Duplicó su publicidad tras un buen mes. Los pedidos se triplicaron, no alcanzó a producir, entregó tarde, recibió reseñas negativas y perdió a sus mejores clientes. Volvió al tamaño anterior con la reputación dañada. El problema no fue crecer: fue crecer sin capacidad ni proceso.'
  },
  steps: [
    { type: 'multi', q: '¿Qué necesitas ANTES de escalar? (elige todas)',
      opts: [
        { t: 'Demanda constante durante varios meses', ok: true },
        { t: 'Margen que aguante costos adicionales', ok: true },
        { t: 'Procesos documentados', ok: true },
        { t: 'Muchos seguidores', ok: false },
        { t: 'Capacidad de producción o de subcontratar', ok: true }
      ],
      explain: 'Demanda, margen, procesos y capacidad. Los seguidores no producen nada.' },

    { type: 'quiz', q: 'Tus ventas subieron 60% pero tu utilidad sigue igual. ¿Qué pasa?',
      opts: [
        { t: 'Es normal al crecer', ok: false, why: 'No es normal: significa que cada venta adicional te deja casi nada.' },
        { t: 'Tu margen es insuficiente o tus costos crecieron con las ventas', ok: true, why: 'Estás trabajando mucho más para ganar lo mismo. Hay que arreglar el margen antes de crecer más.' },
        { t: 'Debo vender aún más', ok: false, why: 'Vender más con margen roto solo te agota más rápido.' },
        { t: 'Debo contratar más gente', ok: false, why: 'Sumarías costo fijo a un negocio que ya no está convirtiendo ventas en utilidad.' }
      ],
      explain: 'Si las ventas suben y la utilidad no, el problema está en el margen o en los costos variables.' },

    { type: 'order', q: 'Ordena la secuencia correcta para escalar',
      items: [
        'Confirma demanda estable por varios meses',
        'Asegura un margen sano por unidad',
        'Documenta tus procesos clave',
        'Amplía capacidad (equipo, proveedores, personal)',
        'Aumenta la inversión en captación',
        'Mide y ajusta cada mes'
      ],
      explain: 'La publicidad va al final, no al principio.' },

    { type: 'fill', q: 'Completa los tres requisitos antes de escalar',
      text: 'Necesito ___ , ___ y ___ . Si me falta uno, crecer multiplica el problema.',
      bank: ['demanda estable varios meses', 'un margen que aguante', 'procesos escritos', 'muchos seguidores', 'un logo nuevo', 'suerte'],
      answer: ['demanda estable varios meses', 'un margen que aguante', 'procesos escritos'],
      explain: 'Demanda, margen y procesos. Escalar sin los tres es acelerar con el volante suelto.' },

    { type: 'sim', q: 'Tienes un mes excelente. ¿Qué haces con la ganancia extra?',
      opts: [
        { t: 'Duplicar la publicidad de inmediato', ok: false,
          effects: { dinero: -2, reputacion: -2, tiempo: -3 },
          why: 'Un mes bueno no es una tendencia. Y si no puedes producir más, generas clientes molestos.' },
        { t: 'Guardar la mitad como colchón y usar la otra en capacidad', ok: true,
          effects: { dinero: 3, reputacion: 2, tiempo: 2 },
          why: 'Colchón para meses malos y capacidad para sostener el crecimiento cuando llegue.' },
        { t: 'Retirarlo todo como sueldo', ok: false,
          effects: { dinero: 1, tiempo: 0, reputacion: 0 },
          why: 'Legítimo, pero el negocio se queda sin combustible para crecer.' }
      ],
      explain: 'Un mes bueno se aprovecha reforzando la base, no acelerando a ciegas.' },

    { type: 'write', q: '¿Cuál de los tres requisitos te falta hoy?',
      sub: 'Demanda constante, margen sano o procesos documentados.',
      ph: 'Tengo demanda y margen, pero todo está en mi cabeza: me faltan procesos escritos…',
      minWords: 10,
      hints: ['Sé honesto: crecer sin uno de los tres sale caro.'] }
  ],
  mission: {
    id: 'm8-01', title: 'Tu diagnóstico de escalabilidad', dossier: null,
    brief: 'Evalúa los tres requisitos con honestidad y define qué vas a reforzar antes de crecer.',
    fields: [
      { key: 'demanda', label: '¿Cuántos meses seguidos con demanda estable llevas?', type: 'num', ph: '4' },
      { key: 'margen', label: 'Tu margen actual (%)', type: 'num', ph: '48' },
      { key: 'procesos', label: '¿Cuántos procesos tienes documentados?', type: 'num', ph: '3' },
      { key: 'refuerzo', label: '¿Qué vas a reforzar primero?', type: 'text', ph: 'Documentar el proceso de producción' }
    ],
    rubric: [
      { id: 'a', label: 'Evaluaste los tres requisitos con números', check: 'numbers' },
      { id: 'b', label: 'Tu margen es sano', check: 'healthy' },
      { id: 'c', label: 'Definiste qué reforzar primero', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 8.2 */
{
  id: 'n8-02', level: 8, icon: '🧑‍🔧', title: 'Tu primera contratación', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Contrata para liberar tu tiempo más caro',
    body: [
      'La primera persona que contratas no debe hacer lo que más te gusta: debe hacer **lo que más tiempo te quita y menos criterio requiere**.',
      'Antes de contratar de planta, prueba con alguien por horas o por proyecto. Un sueldo fijo es un costo fijo, y los costos fijos suben tu punto de equilibrio de golpe.'
    ],
    keys: [
      'Primero por horas o proyecto, después de planta.',
      'Contrata para liberar horas que uses en vender o producir con mejor margen.',
      'Cada contratación sube tu punto de equilibrio: recalcúlalo antes.'
    ]
  },
  cas: {
    emoji: '⏰', title: 'Las 20 horas recuperadas',
    text: 'Pasaba 20 horas semanales empacando y enviando. Contrató a alguien por horas a $80/h: $6,400 al mes. Con esas 20 horas libres vendió $19,000 adicionales. El costo de no contratar era mucho mayor que el de contratar.'
  },
  steps: [
    { type: 'quiz', q: '¿Qué deberías delegar en tu primera contratación?',
      opts: [
        { t: 'Las ventas, porque no te gustan', ok: false, why: 'Las ventas requieren criterio y conocimiento del producto. Es de lo último que se delega bien.' },
        { t: 'Lo repetitivo que te quita más horas y menos criterio requiere', ok: true, why: 'Máximo tiempo liberado, mínimo riesgo. Empaque, envíos, respuestas frecuentes.' },
        { t: 'La estrategia y los precios', ok: false, why: 'Son decisiones del dueño. Delegarlas es abandonar el timón.' },
        { t: 'Todo lo que puedas', ok: false, why: 'Delegar de golpe sin procesos genera caos y costos.' }
      ],
      explain: 'Delega horas, no responsabilidades estratégicas.' },

    { type: 'order', q: 'Ordena los pasos de una primera contratación',
      items: [
        'Calcula cuántas horas te quita la tarea y cuánto valen',
        'Documenta el proceso antes de contratar',
        'Prueba con alguien por horas o por proyecto',
        'Entrena con el método de cinco etapas',
        'Recalcula tu punto de equilibrio con el nuevo costo',
        'Formaliza si el resultado se sostiene 2-3 meses'
      ],
      explain: 'Documenta, prueba, entrena, recalcula. La formalización va al final.' },

    { type: 'quiz', q: 'Tus fijos son $8,000 y tu margen por unidad $130. Contratas a alguien por $6,000 al mes. ¿Cuántas unidades necesitas ahora?',
      opts: [
        { t: '62 unidades', ok: false, why: 'Ese es el punto de equilibrio anterior: 8,000 ÷ 130.' },
        { t: '108 unidades', ok: true, why: '(8,000 + 6,000) ÷ 130 = 107.7, es decir 108 unidades. Casi el doble.' },
        { t: '46 unidades', ok: false, why: 'Sumar un costo fijo nunca baja el punto de equilibrio.' },
        { t: 'Las mismas', ok: false, why: 'Cada peso de costo fijo sube el número de ventas que necesitas.' }
      ],
      explain: 'Antes de contratar, recalcula siempre tu punto de equilibrio.' },

    { type: 'sim', q: 'La persona que contrataste rinde menos de lo esperado al mes.',
      opts: [
        { t: 'Despedirla de inmediato', ok: false,
          effects: { tiempo: -2, dinero: -1, reputacion: -1 },
          why: 'Un mes suele ser poco. Y si el problema es tu proceso, el siguiente fallará igual.' },
        { t: 'Revisar si el proceso y el entrenamiento fueron suficientes, y dar una meta clara', ok: true,
          effects: { tiempo: 2, dinero: 2, aprendizaje: 3 },
          why: 'La mayoría de los bajos rendimientos iniciales vienen de instrucciones incompletas.' },
        { t: 'Hacerlo tú de nuevo y dejarla en otras cosas', ok: false,
          effects: { tiempo: -3, dinero: -2, aprendizaje: -1 },
          why: 'Vuelves a estar saturado y además pagas un sueldo.' }
      ],
      explain: 'Primero revisa tu proceso. Después evalúa a la persona.' },

    { type: 'write', q: '¿Qué contratarías primero y cuánto vale para ti?',
      sub: 'Calcula: horas liberadas × valor de tu hora contra el costo de contratar.',
      ph: 'Empaque y envíos: 20 h/semana. Mi hora vale $150, así que valen $3,000/semana. Contratar cuesta $1,600…',
      minWords: 15,
      hints: ['¿Cuántas horas te quita?', '¿Qué harías con esas horas?'] }
  ],
  mission: {
    id: 'm8-02', title: 'Tu plan de contratación', dossier: 'plan',
    brief: 'Define qué tarea liberarías, cuánto cuesta y cuál sería tu nuevo punto de equilibrio.',
    fields: [
      { key: 'tarea', label: '¿Qué tarea delegarías?', type: 'text', ph: 'Empaque y envíos' },
      { key: 'horas', label: 'Horas semanales que te quita', type: 'num', ph: '20' },
      { key: 'costo', label: 'Costo mensual de contratar ($)', type: 'num', ph: '6000' },
      { key: 'uso', label: '¿En qué usarías esas horas?', type: 'text', ph: 'Visitar 10 talleres por semana' }
    ],
    rubric: [
      { id: 'a', label: 'Cuantificaste horas y costo', check: 'numbers' },
      { id: 'b', label: 'Definiste en qué usarías el tiempo liberado', check: 'reason' },
      { id: 'c', label: 'La tarea es repetitiva y de bajo criterio', check: 'filled' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 8.3 */
{
  id: 'n8-03', level: 8, icon: '🌱', title: 'Reinvertir con cabeza', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Dónde poner cada peso que gana el negocio',
    body: [
      'Un reparto que funciona para negocios pequeños: **50% reinversión, 30% tu sueldo, 20% reserva**. Los porcentajes se ajustan, pero las tres cajas siempre existen.',
      'Y dentro de la reinversión, prioriza en este orden: lo que **quita un cuello de botella**, lo que **sube el margen** y por último lo que **trae más clientes**.'
    ],
    keys: [
      'Tres cajas siempre: reinversión, sueldo, reserva.',
      'Prioriza quitar el cuello de botella antes que traer más demanda.',
      'Toda inversión debe tener un número esperado de retorno.'
    ]
  },
  cas: {
    emoji: '🧰', title: 'La segunda máquina antes que la publicidad',
    text: 'Tenía más pedidos de los que podía producir. En vez de invertir en publicidad, compró una segunda impresora. Su capacidad se duplicó, los plazos bajaron de 7 a 3 días y pudo cobrar 20% más por rapidez. La publicidad hubiera empeorado la situación.'
  },
  steps: [
    { type: 'order', q: 'Ordena las prioridades de reinversión',
      items: [
        'Quitar el cuello de botella que limita tu capacidad',
        'Reducir costos o subir el margen',
        'Mejorar el proceso y la calidad',
        'Aumentar la captación de clientes',
        'Explorar productos o mercados nuevos'
      ],
      explain: 'Capacidad → margen → proceso → captación → exploración.' },

    { type: 'quiz', q: 'Tienes más pedidos de los que puedes producir. ¿En qué inviertes?',
      opts: [
        { t: 'Publicidad para tener aún más pedidos', ok: false, why: 'Aumentar la demanda cuando ya no puedes producir genera retrasos y clientes molestos.' },
        { t: 'Capacidad: equipo, ayuda o subcontratación', ok: true, why: 'El cuello de botella es la producción. Ahí es donde cada peso rinde más.' },
        { t: 'Un rediseño de marca', ok: false, why: 'Bonito, pero no resuelve lo que te está frenando.' },
        { t: 'Ampliar el catálogo', ok: false, why: 'Más productos con la misma capacidad = más retrasos.' }
      ],
      explain: 'Invierte siempre en el punto que limita todo lo demás.' },

    { type: 'multi', q: '¿Qué debe cumplir una buena inversión? (elige todas)',
      opts: [
        { t: 'Tener un retorno estimado en números', ok: true },
        { t: 'Resolver un cuello de botella real', ok: true },
        { t: 'Poder recuperarse en un plazo razonable', ok: true },
        { t: 'Ser lo que hace la competencia', ok: false },
        { t: 'No comprometer tu reserva de emergencia', ok: true }
      ],
      explain: 'Retorno estimado, problema real, plazo de recuperación y reserva intacta.' },

    { type: 'slider', q: '¿Qué porcentaje de tu utilidad reinviertes en el negocio?',
      min: 0, max: 100, step: 10, value: 100, unit: '%',
      best: [40, 60],
      bands: [
        { max: 20, label: 'Muy poco', tone: 'warn', msg: 'Reinvertir poco mantiene el negocio del mismo tamaño para siempre.' },
        { max: 60, label: 'Equilibrado', tone: 'ok', msg: '40-60% permite crecer sin dejarte sin sueldo ni reserva.' },
        { max: 100, label: 'Riesgoso', tone: 'bad', msg: 'Reinvertir todo te deja sin colchón y sin sueldo: la receta del agotamiento.' }
      ],
      explain: 'Reinvierte fuerte, pero nunca al 100%. Tú y la reserva también cuentan.' },

    { type: 'write', q: '¿Cuál es tu cuello de botella hoy?',
      sub: 'Eso que si se resolviera, todo lo demás fluiría.',
      ph: 'Solo tengo una máquina y trabaja 18 h al día. No puedo aceptar más pedidos aunque los tenga…',
      minWords: 10,
      hints: ['¿Qué te impide aceptar más pedidos hoy?', '¿Es capacidad, tiempo o dinero?'] }
  ],
  mission: {
    id: 'm8-03', title: 'Tu plan de reinversión', dossier: 'plan',
    brief: 'Define tus tres cajas y en qué invertirás primero, con retorno esperado.',
    fields: [
      { key: 'reinversion', label: '% de reinversión', type: 'num', ph: '50' },
      { key: 'sueldo', label: '% para tu sueldo', type: 'num', ph: '30' },
      { key: 'reserva', label: '% para reserva', type: 'num', ph: '20' },
      { key: 'cuello', label: 'Tu cuello de botella', type: 'text', ph: 'Capacidad de producción' },
      { key: 'inversion', label: 'Primera inversión y retorno esperado', type: 'area', ph: 'Segunda máquina $18,000, se paga en 4 meses con 12 pedidos más al mes' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste los tres porcentajes', check: 'numbers' },
      { id: 'b', label: 'Identificaste tu cuello de botella', check: 'filled' },
      { id: 'c', label: 'Tu inversión tiene retorno estimado', check: 'measurable' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 8.4 */
{
  id: 'n8-04', level: 8, icon: '🗺️', title: 'Nuevos productos y mercados', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Crece por donde ya tienes tracción',
    body: [
      'Hay cuatro formas de crecer, de menor a mayor riesgo: **vender más a los mismos clientes**, **mismo producto a un mercado nuevo**, **producto nuevo a tus clientes actuales** y **producto nuevo a mercado nuevo** (el más arriesgado, casi un negocio distinto).',
      'La regla: agota las dos primeras antes de intentar la última.'
    ],
    keys: [
      'Lo más barato es venderle más a quien ya confía en ti.',
      'Un producto nuevo para clientes actuales aprovecha la relación existente.',
      'Producto nuevo + mercado nuevo = empezar de cero otra vez.'
    ]
  },
  cas: {
    emoji: '🧭', title: 'El mismo producto, otro gremio',
    text: 'Vendía repuestos a talleres de lavadoras. En vez de inventar productos nuevos, llevó el mismo servicio a talleres de refrigeración: mismo proceso, mismo equipo, cliente distinto. Duplicó ingresos en cinco meses sin aprender nada nuevo.'
  },
  steps: [
    { type: 'order', q: 'Ordena de MENOR a MAYOR riesgo',
      items: [
        'Vender más a tus clientes actuales',
        'Llevar tu producto actual a un mercado nuevo',
        'Ofrecer un producto nuevo a tus clientes actuales',
        'Producto nuevo en un mercado nuevo'
      ],
      explain: 'Cada escalón añade una incógnita. El último añade dos a la vez.' },

    { type: 'quiz', q: 'Tienes 80 clientes fieles y quieres crecer. ¿Qué haces primero?',
      opts: [
        { t: 'Inventar una línea de productos completamente nueva', ok: false, why: 'Producto nuevo implica investigación, inversión y validación desde cero.' },
        { t: 'Preguntar a tus 80 clientes qué más necesitan y venderles eso', ok: true, why: 'Tienes la relación, la confianza y el acceso. Es el camino más rápido y barato.' },
        { t: 'Abrir en otra ciudad', ok: false, why: 'Costoso y sin la ventaja local que te hizo funcionar.' },
        { t: 'Bajar precios para atraer más gente', ok: false, why: 'Crecer por precio destruye margen y atrae al peor cliente.' }
      ],
      explain: 'La pregunta más rentable del mundo: “¿qué más necesitas que yo pueda darte?”.' },

    { type: 'multi', q: '¿Qué señales indican que un producto nuevo vale la pena? (elige todas)',
      opts: [
        { t: 'Tus clientes actuales ya lo piden', ok: true },
        { t: 'Usa tus mismos procesos y equipo', ok: true },
        { t: 'Puedes probarlo sin gran inversión', ok: true },
        { t: 'Te parece interesante', ok: false },
        { t: 'Lo vende bien la competencia con tu mismo cliente', ok: true }
      ],
      explain: 'Demanda comprobada, sinergia operativa y prueba barata.' },

    { type: 'sim', q: 'Un cliente te pide algo que no haces pero podrías aprender.',
      opts: [
        { t: 'Rechazarlo y seguir igual', ok: false,
          effects: { clientes: 0, aprendizaje: 0, dinero: 0 },
          why: 'Podría ser la señal de una línea nueva rentable. Vale la pena investigar.' },
        { t: 'Preguntar a otros 10 clientes si también lo necesitan antes de invertir', ok: true,
          effects: { aprendizaje: 3, dinero: 2, clientes: 2 },
          why: 'Validas la demanda antes de comprometerte. Un pedido no hace una línea de negocio.' },
        { t: 'Invertir de inmediato en equipo para hacerlo', ok: false,
          effects: { dinero: -3, aprendizaje: 0, tiempo: -2 },
          why: 'Invertir por un solo pedido es la forma clásica de comprar equipo que se queda parado.' }
      ],
      explain: 'Un pedido es una anécdota. Diez pedidos son una tendencia.' },

    { type: 'write', q: '¿Cuál es tu siguiente movimiento de crecimiento?',
      sub: 'Elige el de menor riesgo que aún no hayas agotado.',
      ph: 'Llevar el mismo servicio a talleres de refrigeración: mismo proceso, cliente nuevo…',
      minWords: 12,
      hints: ['¿Ya le vendiste todo lo posible a tus clientes actuales?', '¿Hay un gremio parecido al tuyo?'] }
  ],
  mission: {
    id: 'm8-04', title: 'Pregunta a 10 clientes', dossier: 'plan',
    brief: 'Pregunta a diez clientes actuales qué más necesitan que tú podrías ofrecer. Ahí está tu próximo producto.',
    fields: [
      { key: 'preguntados', label: '¿A cuántos preguntaste?', type: 'num', ph: '10' },
      { key: 'respuestas', label: '¿Qué te pidieron? (uno por línea)', type: 'area', ph: 'Reparación urgente\nMantenimiento preventivo\n…' },
      { key: 'oportunidad', label: '¿Cuál se repitió más?', type: 'text', ph: 'Mantenimiento preventivo (6 de 10)' },
      { key: 'prueba', label: '¿Cómo lo vas a probar sin gran inversión?', type: 'text', ph: 'Ofrecerlo manual a 3 clientes antes de comprar equipo' }
    ],
    rubric: [
      { id: 'a', label: 'Preguntaste a al menos 10 clientes', check: 'ten' },
      { id: 'b', label: 'Identificaste un patrón repetido', check: 'number' },
      { id: 'c', label: 'Definiste una prueba barata', check: 'reason' }
    ],
    reward: { xp: 65, coins: 50 }
  }
},

/* ------------------------------------------------------------------ 8.5 */
{
  id: 'n8-05', level: 8, icon: '🎯', title: 'Tu plan de 90 días', xp: 40, min: 8,
  concept: {
    tag: 'Concepto', title: 'Una meta, tres acciones, un número por semana',
    body: [
      'Los planes largos no se cumplen. Los de 90 días sí, porque son suficientemente cortos para mantener la urgencia y suficientemente largos para producir resultados.',
      'La estructura: **una meta medible**, **tres acciones semanales que la producen** y **un número que revisas cada lunes**. Nada más. Todo lo demás es distracción.'
    ],
    keys: [
      'Una sola meta principal. Dos metas es no tener ninguna.',
      'Las acciones deben estar bajo tu control, no depender de la suerte.',
      'Revisión semanal fija: sin ella, el plan muere en tres semanas.'
    ]
  },
  cas: {
    emoji: '📈', title: 'De $12,000 a $31,000 en 90 días',
    text: 'Meta: pasar de $12,000 a $30,000 mensuales. Tres acciones semanales: visitar 6 talleres, publicar 3 videos y escribir a 10 clientes antiguos. Un número: pedidos cerrados por semana. Revisión cada lunes. A los 90 días facturaba $31,400. No hubo secreto: hubo repetición medida.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál de estas es una buena meta de 90 días?',
      opts: [
        { t: 'Crecer mucho', ok: false, why: 'No es medible. No sabrás si la cumpliste.' },
        { t: 'Pasar de $12,000 a $30,000 mensuales de ingreso', ok: true, why: 'Medible, con punto de partida, destino y plazo.' },
        { t: 'Ser el mejor del mercado', ok: false, why: 'No se puede medir ni controlar.' },
        { t: 'Vender más y organizarme mejor y contratar gente', ok: false, why: 'Tres metas a la vez es ninguna meta.' }
      ],
      explain: 'Medible, con número de partida y de llegada, y con fecha.' },

    { type: 'multi', q: '¿Qué acciones sirven para un plan de 90 días? (elige todas)',
      opts: [
        { t: 'Visitar 6 clientes potenciales por semana', ok: true },
        { t: 'Publicar 3 contenidos por semana', ok: true },
        { t: 'Que me recomienden mucho', ok: false },
        { t: 'Escribir a 10 clientes antiguos por semana', ok: true },
        { t: 'Volverme viral', ok: false }
      ],
      explain: 'Las acciones válidas dependen solo de ti y se pueden contar.' },

    { type: 'order', q: 'Ordena la construcción de tu plan de 90 días',
      items: [
        'Define una sola meta medible',
        'Identifica las 3 acciones que más la impulsan',
        'Conviértelas en cantidades semanales',
        'Elige el número que revisarás cada lunes',
        'Agenda la revisión semanal en tu calendario'
      ],
      explain: 'Meta → acciones → cantidades → indicador → revisión agendada.' },

    { type: 'sim', q: 'A la sexta semana vas al 40% de tu meta.',
      opts: [
        { t: 'Cambiar la meta a algo más fácil', ok: false,
          effects: { aprendizaje: -2, dinero: -1, reputacion: 0 },
          why: 'Bajar la meta cada vez que aprieta convierte los planes en deseos.' },
        { t: 'Revisar si estás cumpliendo las 3 acciones y ajustar la que falla', ok: true,
          effects: { aprendizaje: 3, dinero: 2, clientes: 2 },
          why: 'Casi siempre el problema es que una de las acciones no se está ejecutando, no que la meta esté mal.' },
        { t: 'Trabajar más horas sin cambiar nada', ok: false,
          effects: { tiempo: -3, dinero: 0, aprendizaje: -1 },
          why: 'Más esfuerzo en la dirección equivocada solo cansa.' }
      ],
      explain: 'Revisa la ejecución antes que la meta.' },

    { type: 'write', q: 'Escribe tu plan de 90 días',
      sub: 'Una meta medible, tres acciones semanales y el número que revisarás cada lunes.',
      ph: 'Meta: pasar de $12,000 a $30,000 mensuales.\nAcciones: 6 visitas, 3 videos, 10 mensajes por semana.\nNúmero: pedidos cerrados. Reviso los lunes 8 am.',
      minWords: 25,
      hints: ['La meta necesita números y fecha.', 'Las acciones deben ser semanales y contables.'] }
  ],
  mission: {
    id: 'm8-05', title: 'Tu plan de 90 días', dossier: 'plan',
    brief: 'Este es el cierre de la ruta. Escribe el plan que vas a ejecutar a partir de mañana.',
    fields: [
      { key: 'meta', label: 'Tu meta a 90 días (con números)', type: 'text', ph: 'Pasar de $12,000 a $30,000 mensuales' },
      { key: 'a1', label: 'Acción semanal 1 (con cantidad)', type: 'text', ph: 'Visitar 6 talleres por semana' },
      { key: 'a2', label: 'Acción semanal 2', type: 'text', ph: 'Publicar 3 videos por semana' },
      { key: 'a3', label: 'Acción semanal 3', type: 'text', ph: 'Escribir a 10 clientes antiguos' },
      { key: 'indicador', label: '¿Qué número revisas cada lunes?', type: 'text', ph: 'Pedidos cerrados' }
    ],
    rubric: [
      { id: 'a', label: 'Tu meta es medible y tiene plazo', check: 'measurable' },
      { id: 'b', label: 'Definiste tres acciones con cantidad', check: 'steps' },
      { id: 'c', label: 'Las acciones dependen de ti', check: 'controllable' },
      { id: 'd', label: 'Elegiste un indicador de revisión', check: 'filled' }
    ],
    reward: { xp: 90, coins: 70 }
  }
}

]);
