/* ==========================================================================
   NIVEL 5 — ADMINISTRA · Controlas costos, ingresos e inventario
   ========================================================================== */
window.addLessons([

/* ------------------------------------------------------------------ 5.1 */
{
  id: 'n5-01', level: 5, icon: '🏦', title: 'Separa tu dinero del negocio', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Si todo está en la misma bolsa, no sabes nada',
    body: [
      'El error que más negocios pequeños mata no es vender poco: es **mezclar el dinero personal con el del negocio**. Cuando todo sale de la misma cuenta, es imposible saber si ganas o pierdes.',
      'Solución: una cuenta o sobre aparte, y **págate un sueldo fijo**. Aunque sea pequeño. Aunque sea $500 al mes. El negocio te paga a ti, no al revés.'
    ],
    keys: [
      'Cuenta separada desde el primer peso.',
      'Sueldo fijo para ti, aunque sea simbólico.',
      'Lo que queda después de tu sueldo es la utilidad real.'
    ]
  },
  cas: {
    emoji: '👛', title: 'El negocio que “ganaba” y no ganaba',
    text: 'Vendía $18,000 al mes y sentía que le iba bien porque siempre tenía efectivo. Cuando separó las cuentas descubrió que $6,000 eran gastos personales pagados con el dinero del negocio. La utilidad real era $900, no $6,900. Con ese dato cambió sus precios en dos semanas.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es la primera regla de administración de un negocio pequeño?',
      opts: [
        { t: 'Llevar contabilidad profesional desde el día 1', ok: false, why: 'Útil después. Al principio basta con un registro simple y disciplina.' },
        { t: 'Separar el dinero del negocio del dinero personal', ok: true, why: 'Sin separación, todos los demás números están contaminados.' },
        { t: 'Reinvertir todo lo que entre', ok: false, why: 'Reinvertir sin saber cuánto ganas es apostar a ciegas.' },
        { t: 'No gastar nada', ok: false, why: 'Un negocio que no invierte no crece. La clave es saber en qué.' }
      ],
      explain: 'Cuentas separadas + sueldo fijo = visibilidad real.' },

    { type: 'multi', q: '¿Qué gastos SÍ son del negocio? (elige todas)',
      opts: [
        { t: 'Material para producir', ok: true },
        { t: 'La despensa de tu casa', ok: false },
        { t: 'Envíos y empaque', ok: true },
        { t: 'Suscripción a la herramienta de diseño que usas para trabajar', ok: true },
        { t: 'Tu salida del fin de semana', ok: false },
        { t: 'Reparación de la máquina', ok: true }
      ],
      explain: 'Si no produce ingreso ni sostiene la operación, es personal.' },

    { type: 'fill', q: 'Completa la regla de oro',
      text: 'El negocio ___ , y lo que sobra después de eso es ___ . Si mezclo el dinero, ___ .',
      bank: ['me paga un sueldo fijo', 'la utilidad real', 'no sé si gano o pierdo', 'me da todo lo que entra', 'mi ganancia total', 'ahorro comisiones'],
      answer: ['me paga un sueldo fijo', 'la utilidad real', 'no sé si gano o pierdo'],
      explain: 'Tu sueldo es un costo del negocio, no un premio. Lo que queda después de pagarlo es la utilidad real.' },

    { type: 'sim', q: 'Este mes entraron $12,000 y quieres usar $3,000 para algo personal.',
      opts: [
        { t: 'Tomarlos directo de la caja del negocio', ok: false,
          effects: { dinero: -2, aprendizaje: -2, reputacion: 0 },
          why: 'Pierdes el rastro. En tres meses no sabrás si el negocio es rentable.' },
        { t: 'Transferirlos como sueldo, registrado', ok: true,
          effects: { dinero: 1, aprendizaje: 3, reputacion: 1 },
          why: 'El negocio te paga y queda registrado. Sabes exactamente cuánto cuesta tu mano de obra.' },
        { t: 'No tomar nada nunca', ok: false,
          effects: { dinero: 0, aprendizaje: 0, reputacion: 0 },
          why: 'Trabajar gratis indefinidamente esconde el costo real de tu tiempo y termina en abandono.' }
      ],
      explain: 'Págate un sueldo. Es un costo del negocio, no un premio.' },

    { type: 'write', q: '¿Cuánto vale tu hora hoy?',
      sub: 'Divide el sueldo mensual que necesitas entre las horas que trabajas al mes.',
      ph: 'Necesito $8,000 al mes y trabajo 80 horas, así que mi hora vale $100…',
      minWords: 8,
      hints: ['¿Cuántas horas trabajas realmente?', '¿Cuánto necesitas para vivir?'] }
  ],
  mission: {
    id: 'm5-01', title: 'Separa y págate', dossier: null,
    brief: 'Abre una cuenta, sobre o apartado exclusivo del negocio y define tu sueldo mensual.',
    fields: [
      { key: 'donde', label: '¿Dónde vas a guardar el dinero del negocio?', type: 'text', ph: 'Cuenta digital aparte / sobre etiquetado' },
      { key: 'sueldo', label: 'Tu sueldo mensual ($)', type: 'num', ph: '4000' },
      { key: 'hora', label: '¿Cuánto vale tu hora? ($)', type: 'num', ph: '100' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste dónde separas el dinero', check: 'filled' },
      { id: 'b', label: 'Te asignaste un sueldo', check: 'number' },
      { id: 'c', label: 'Calculaste el valor de tu hora', check: 'number' }
    ],
    reward: { xp: 45, coins: 30 }
  }
},

/* ------------------------------------------------------------------ 5.2 */
{
  id: 'n5-02', level: 5, icon: '📒', title: 'Registro simple que sí se mantiene', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'El mejor sistema es el que usas todos los días',
    body: [
      'No necesitas un software contable. Necesitas **cinco columnas**: fecha, concepto, entra, sale y a qué categoría pertenece.',
      'La regla que lo hace funcionar: registra el mismo día. Un registro atrasado es un registro inventado.'
    ],
    keys: [
      'Cinco columnas bastan: fecha, concepto, entra, sale, categoría.',
      'Registra el mismo día, siempre.',
      'Revisa el total cada semana, no cada seis meses.'
    ]
  },
  cas: {
    emoji: '📝', title: 'La libreta de $40',
    text: 'Sin software ni apps: una libreta con cinco columnas y cinco minutos al final del día. En tres meses descubrió que el 22% de sus gastos eran envíos que no cobraba al cliente. Cambió su política de envío y recuperó $1,800 mensuales.'
  },
  steps: [
    { type: 'order', q: 'Ordena el ritual de registro diario',
      items: [
        'Al terminar el día, abre tu registro',
        'Anota cada venta con fecha y monto',
        'Anota cada gasto con su categoría',
        'Guarda o fotografía los comprobantes',
        'Cada domingo, suma la semana'
      ],
      explain: 'Cinco minutos al día evitan una crisis al mes.' },

    { type: 'multi', q: '¿Qué categorías de gasto conviene separar? (elige todas)',
      opts: [
        { t: 'Material / insumos', ok: true },
        { t: 'Envíos y empaque', ok: true },
        { t: 'Publicidad', ok: true },
        { t: 'Herramientas y mantenimiento', ok: true },
        { t: 'Sueldos (incluido el tuyo)', ok: true },
        { t: 'Cosas varias sin clasificar', ok: false }
      ],
      explain: 'Cuando todo cae en “varios”, pierdes la posibilidad de recortar con criterio.' },

    { type: 'quiz', q: 'Tu registro muestra: ventas $14,000, material $5,200, envíos $2,900, publicidad $1,000, tu sueldo $4,000. ¿Cuál es tu utilidad?',
      opts: [
        { t: '$14,000', ok: false, why: 'Eso es el ingreso, no la utilidad. Falta restar todo lo que salió.' },
        { t: '$900', ok: true, why: '14,000 − 5,200 − 2,900 − 1,000 − 4,000 = $900. Esa es la utilidad real del mes.' },
        { t: '$4,900', ok: false, why: 'Ese sería el resultado si no te pagaras sueldo. Tu tiempo es un costo real.' },
        { t: '$8,800', ok: false, why: 'Revisa: hay cuatro gastos, no dos.' }
      ],
      explain: 'Utilidad = ingresos − TODOS los gastos, incluido tu sueldo.' },

    { type: 'sim', q: 'Llevas 6 semanas sin registrar nada. ¿Qué haces?',
      opts: [
        { t: 'Reconstruir todo desde cero antes de seguir', ok: false,
          effects: { tiempo: -3, aprendizaje: 1, dinero: 0 },
          why: 'Reconstruir 6 semanas suele tomar días y desanimarte lo suficiente para abandonar otra vez.' },
        { t: 'Empezar hoy con lo que recuerdes del mes y no perder más días', ok: true,
          effects: { tiempo: -1, aprendizaje: 3, dinero: 1 },
          why: 'Un registro imperfecto que continúa vale infinitamente más que uno perfecto que se abandona.' },
        { t: 'Esperar al próximo mes para empezar limpio', ok: false,
          effects: { aprendizaje: -2, dinero: -1, tiempo: 0 },
          why: '“El próximo mes” es el lugar donde van a morir los hábitos.' }
      ],
      explain: 'Empieza hoy, imperfecto. La continuidad vale más que la exactitud.' },

    { type: 'write', q: '¿Qué gasto crees que se te está escapando?',
      sub: 'Ese que nunca cuentas pero que sí sale de tu bolsa.',
      ph: 'Los envíos y las piezas que salen mal; nunca los sumo pero deben ser $1,000 al mes…',
      minWords: 8,
      hints: ['¿Piezas falladas?', '¿Envíos?', '¿Comisiones de plataforma?'] }
  ],
  mission: {
    id: 'm5-02', title: 'Arranca tu registro', dossier: 'numeros',
    brief: 'Crea tu registro de 5 columnas y llena los últimos 7 días. Hoy, no mañana.',
    fields: [
      { key: 'herramienta', label: '¿Dónde lo llevas?', type: 'text', ph: 'Libreta / hoja de cálculo / app' },
      { key: 'ingresos7', label: 'Ingresos de los últimos 7 días ($)', type: 'num', ph: '3200' },
      { key: 'gastos7', label: 'Gastos de los últimos 7 días ($)', type: 'num', ph: '2100' },
      { key: 'sorpresa', label: '¿Qué te sorprendió al sumar?', type: 'text', ph: 'Gasté $600 en envíos que no cobré' }
    ],
    rubric: [
      { id: 'a', label: 'Registraste ingresos y gastos reales', check: 'numbers' },
      { id: 'b', label: 'Elegiste una herramienta concreta', check: 'filled' },
      { id: 'c', label: 'Sacaste una conclusión', check: 'filled' }
    ],
    reward: { xp: 50, coins: 35 }
  }
},

/* ------------------------------------------------------------------ 5.3 */
{
  id: 'n5-03', level: 5, icon: '💧', title: 'Flujo de efectivo', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Se puede ser rentable y quebrar igual',
    body: [
      'La utilidad dice si ganas. El **flujo de efectivo** dice si puedes pagar mañana. Son cosas distintas y la segunda es la que te mantiene vivo.',
      'Un negocio puede tener $50,000 en ventas facturadas y no tener $2,000 para comprar material, porque el dinero está en manos de clientes que aún no pagan.'
    ],
    keys: [
      'Rentabilidad ≠ liquidez.',
      'Cobra rápido, paga negociado. Ese es todo el juego.',
      'Ten siempre un colchón de al menos un mes de costos fijos.'
    ]
  },
  cas: {
    emoji: '⏳', title: 'Vendió mucho y no pudo producir',
    text: 'Cerró un pedido grande de $40,000 con pago a 60 días. Compró material con sus ahorros y quedó sin efectivo. Durante dos meses rechazó pedidos pequeños que sí pagaban al contado. Fue rentable en papel y estuvo a punto de cerrar. Solución: 50% de anticipo obligatorio.'
  },
  steps: [
    { type: 'quiz', q: 'Tienes $30,000 por cobrar a 60 días y $5,000 en caja. Debes pagar $8,000 de material esta semana. ¿Qué haces?',
      opts: [
        { t: 'Esperar a que te paguen', ok: false, why: 'No llegarás: el pago es a 60 días y la obligación es esta semana.' },
        { t: 'Negociar un anticipo con el cliente o plazo con el proveedor', ok: true, why: 'Las dos palancas correctas: acelerar cobros o retrasar pagos. Siempre en ese orden.' },
        { t: 'Pedir un préstamo con intereses altos', ok: false, why: 'Último recurso. Primero negocia: es gratis.' },
        { t: 'Cancelar el pedido', ok: false, why: 'Perderías al cliente teniendo alternativas más simples.' }
      ],
      explain: 'Ante falta de liquidez: acelera cobros, negocia pagos, y solo al final busca crédito.' },

    { type: 'match', q: 'Empareja la acción con su efecto en el flujo',
      pairs: [
        ['Pedir 50% de anticipo', 'Mejora el flujo de entrada'],
        ['Negociar pago a 30 días con proveedor', 'Retrasa la salida de efectivo'],
        ['Comprar inventario de más', 'Congela efectivo en bodega']
      ],
      explain: 'Todo lo que acelera entradas o retrasa salidas mejora tu flujo.' },

    { type: 'multi', q: '¿Qué mejora tu flujo de efectivo? (elige todas)',
      opts: [
        { t: 'Anticipos del 30-50%', ok: true },
        { t: 'Descuento por pago inmediato', ok: true },
        { t: 'Comprar material para 6 meses', ok: false },
        { t: 'Negociar plazo con proveedores', ok: true },
        { t: 'Vender a crédito a 90 días', ok: false }
      ],
      explain: 'Cobra antes, paga después, y no conviertas efectivo en inventario dormido.' },

    { type: 'tf', q: 'Verdadero o falso',
      statement: 'Un negocio con muchas ventas facturadas nunca puede quedarse sin dinero para operar.',
      ok: false,
      explain: 'Falso, y es la trampa que más negocios cierra. Si tus clientes pagan a 60 días y tus proveedores cobran hoy, puedes tener ventas récord y no poder comprar material.' },

    { type: 'slider', q: '¿Cuántos meses de costos fijos deberías tener siempre en reserva?',
      min: 0, max: 12, step: 1, value: 0, unit: ' meses',
      best: [1, 3],
      bands: [
        { max: 0, label: 'Sin colchón', tone: 'bad', msg: 'Un mes malo o un cliente que no paga te saca del juego.' },
        { max: 3, label: 'Saludable', tone: 'ok', msg: '1 a 3 meses de fijos en reserva es lo que permite decir “no” a malos negocios.' },
        { max: 12, label: 'Muy conservador', tone: 'warn', msg: 'Más de 6 meses parado es capital que podría estar creciendo el negocio.' }
      ],
      explain: 'Uno a tres meses de fijos guardados. Ese colchón te da poder de negociación.' },

    { type: 'write', q: 'Proyecta tu próximo mes',
      sub: '¿Cuánto va a entrar, cuándo, y cuánto tienes que pagar y cuándo?',
      ph: 'Entran $9,000 (5 el día 10, 4 el día 25). Salen $7,200 (material el día 5, renta el día 1)…',
      minWords: 15,
      hints: ['Fíjate en las FECHAS, no solo en los totales.', '¿Hay algún día donde te quedas sin efectivo?'] }
  ],
  mission: {
    id: 'm5-03', title: 'Tu calendario de efectivo', dossier: 'numeros',
    brief: 'Dibuja las próximas 4 semanas: qué entra y qué sale, con fechas. Encuentra el día crítico.',
    fields: [
      { key: 'entradas', label: 'Entradas previstas (monto y fecha)', type: 'area', ph: 'Sem 1: $3,000\nSem 2: $2,500…' },
      { key: 'salidas', label: 'Salidas previstas (monto y fecha)', type: 'area', ph: 'Sem 1: material $2,000, renta $1,500…' },
      { key: 'critico', label: '¿Cuál es tu semana más apretada y qué harás?', type: 'text', ph: 'Semana 2: pediré anticipo al cliente grande' }
    ],
    rubric: [
      { id: 'a', label: 'Proyectaste entradas y salidas con fechas', check: 'numbers' },
      { id: 'b', label: 'Identificaste el momento crítico', check: 'filled' },
      { id: 'c', label: 'Definiste una acción preventiva', check: 'reason' }
    ],
    reward: { xp: 60, coins: 45 }
  }
},

/* ------------------------------------------------------------------ 5.4 */
{
  id: 'n5-04', level: 5, icon: '⚖️', title: 'Margen contra volumen', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Vender más no siempre es ganar más',
    body: [
      'Hay dos formas de ganar: **muchas ventas con poco margen** o **pocas ventas con buen margen**. La primera exige volumen, sistemas y capital. La segunda exige diferenciación y confianza.',
      'Un negocio pequeño casi siempre pierde jugando a volumen. Tu ventaja es el trato, la especialización y la rapidez: todas cosas que justifican mejor margen.'
    ],
    keys: [
      'Margen bajo exige volumen alto y operación impecable.',
      'Subir el precio 10% suele aumentar la utilidad más que vender 10% más.',
      'Calcula siempre la utilidad, no el ingreso.'
    ]
  },
  cas: {
    emoji: '🧮', title: 'El 10% que valía por tres',
    text: 'Vendía 100 piezas a $150 con costo de $100: utilidad $5,000. Opción A: vender 10% más (110 piezas) = $5,500. Opción B: subir 10% el precio ($165) con las mismas 100 = $6,500. Menos trabajo, más ganancia. Y perdió solo 3 clientes.'
  },
  steps: [
    { type: 'quiz', q: 'Vendes 100 unidades a $150, costo $100. ¿Qué te deja MÁS utilidad?',
      opts: [
        { t: 'Vender 20% más unidades al mismo precio', ok: false, why: '120 × $50 = $6,000. Bien, pero requiere 20% más trabajo, material y entregas.' },
        { t: 'Subir el precio 20% vendiendo lo mismo', ok: true, why: '100 × ($180 − $100) = $8,000. Más utilidad y el mismo esfuerzo operativo.' },
        { t: 'Bajar 20% el precio para vender el doble', ok: false, why: '200 × ($120 − $100) = $4,000. El doble de trabajo por menos dinero.' },
        { t: 'Todas dan lo mismo', ok: false, why: 'La diferencia es enorme: de $4,000 a $8,000.' }
      ],
      explain: 'El precio es la palanca más poderosa que tienes. Y la más barata de mover.' },

    { type: 'multi', q: '¿Cuándo SÍ conviene jugar a volumen? (elige todas)',
      opts: [
        { t: 'Cuando tu proceso está automatizado', ok: true },
        { t: 'Cuando compras materia prima con descuento por cantidad', ok: true },
        { t: 'Cuando produces todo a mano tú solo', ok: false },
        { t: 'Cuando tienes capital para financiar inventario', ok: true },
        { t: 'Cuando quieres sentirte ocupado', ok: false }
      ],
      explain: 'Volumen requiere sistema y capital. Sin ellos, solo multiplicas el cansancio.' },

    { type: 'sim', q: 'Un cliente te ofrece un pedido de 200 piezas pero al 40% de descuento.',
      opts: [
        { t: 'Aceptar: es mucho volumen', ok: false,
          effects: { dinero: -2, tiempo: -3, reputacion: 0 },
          why: 'Si tu margen es 50%, un descuento de 40% te deja casi sin nada y te ocupa un mes completo.' },
        { t: 'Calcular si el margen sobrante cubre costos y tiempo, y proponer 15%', ok: true,
          effects: { dinero: 2, tiempo: -1, reputacion: 2 },
          why: 'Negocias con números en la mano. Un descuento por volumen es válido si el margen sigue sano.' },
        { t: 'Rechazar sin calcular', ok: false,
          effects: { dinero: 0, tiempo: 0, reputacion: -1 },
          why: 'Podrías estar rechazando un buen negocio. Siempre calcula antes de decidir.' }
      ],
      explain: 'Descuento por volumen sí, pero solo si el margen unitario sigue cubriendo tus costos y tu tiempo.' },

    { type: 'slider', q: '¿Qué margen bruto mínimo necesita un negocio pequeño hecho a mano?',
      min: 10, max: 80, step: 5, value: 20, unit: '%',
      best: [45, 65],
      bands: [
        { max: 30, label: 'Insostenible', tone: 'bad', msg: 'Con menos de 30% de margen, un negocio artesanal no cubre imprevistos ni crecimiento.' },
        { max: 44, label: 'Ajustado', tone: 'warn', msg: 'Se puede vivir, pero cualquier error te come la ganancia.' },
        { max: 65, label: 'Saludable', tone: 'ok', msg: '45-65% es el rango donde un negocio pequeño puede reinvertir y aguantar meses flojos.' },
        { max: 80, label: 'Excelente', tone: 'ok', msg: 'Si el mercado lo acepta, mantenlo. Asegúrate de sostener la calidad.' }
      ],
      explain: 'Margen bruto de 45% a 65% es el objetivo para producción propia.' },

    { type: 'write', q: '¿Subirías tu precio 10%? ¿Qué pasaría?',
      sub: 'Calcula cuántos clientes podrías perder y si aun así ganarías más.',
      ph: 'Si subo de $150 a $165 y pierdo 5 de 50 clientes, ganaría $2,925 en vez de $2,500…',
      minWords: 12,
      hints: ['Haz la cuenta con números.', '¿Cuántos clientes puedes perder y seguir ganando igual?'] }
  ],
  mission: {
    id: 'm5-04', title: 'Prueba de precio', dossier: null,
    brief: 'Sube el precio a los próximos 5 clientes nuevos. Solo a los nuevos. Y mide qué pasa.',
    fields: [
      { key: 'actual', label: 'Precio actual ($)', type: 'num', ph: '150' },
      { key: 'nuevo', label: 'Precio de prueba ($)', type: 'num', ph: '175' },
      { key: 'margen', label: 'Tu margen actual (%)', type: 'num', ph: '40' },
      { key: 'resultado', label: '¿Qué pasó con los 5 clientes nuevos?', type: 'area', ph: '4 aceptaron sin comentar, 1 pidió descuento…' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste un precio de prueba mayor', check: 'numbers' },
      { id: 'b', label: 'Conoces tu margen', check: 'number' },
      { id: 'c', label: 'Registraste el resultado real', check: 'filled' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 5.5 */
{
  id: 'n5-05', level: 5, icon: '📦', title: 'Inventario: cuánto y cuándo', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'El inventario es dinero dormido',
    body: [
      'Cada pieza guardada es efectivo congelado. Demasiado inventario te deja sin liquidez; muy poco te hace perder ventas.',
      'Tres números te ordenan: **cuánto vendes por semana**, **cuánto tarda tu proveedor** y **cuánto colchón necesitas**. Con eso calculas tu punto de reorden: *(venta semanal × semanas de espera) + colchón*.'
    ],
    keys: [
      'Punto de reorden = consumo durante la espera + colchón.',
      'Rotación baja = dinero atrapado.',
      'Lo que no se vende en 90 días, se liquida o se descarta.'
    ]
  },
  cas: {
    emoji: '🏬', title: 'Los $22,000 en la bodega',
    text: 'Compró filamento de 14 colores porque salía más barato por volumen. Nueve colores no se vendieron en un año. Tenía $22,000 en material dormido mientras pedía prestado para comprar el color que sí vendía. Ahora compra 3 colores y repone cada 2 semanas.'
  },
  steps: [
    { type: 'quiz', q: 'Vendes 20 piezas por semana, tu proveedor tarda 2 semanas y quieres 1 semana de colchón. ¿Cuándo pides más?',
      opts: [
        { t: 'Cuando te quedan 20 piezas', ok: false, why: 'Te quedarías sin material una semana antes de que llegue el pedido.' },
        { t: 'Cuando te quedan 60 piezas', ok: true, why: '(20 × 2 semanas) + 20 de colchón = 60. Ese es tu punto de reorden.' },
        { t: 'Cuando se te acaba', ok: false, why: 'Garantiza dos semanas sin poder producir. Pierdes ventas y clientes.' },
        { t: 'Cada primer día del mes', ok: false, why: 'Comprar por calendario en vez de por consumo genera faltantes y excesos.' }
      ],
      explain: 'Punto de reorden = (consumo semanal × semanas de espera) + colchón.' },

    { type: 'multi', q: '¿Qué señales indican exceso de inventario? (elige todas)',
      opts: [
        { t: 'Material que lleva más de 3 meses sin usarse', ok: true },
        { t: 'No tienes efectivo pero la bodega está llena', ok: true },
        { t: 'Compras por descuento aunque no lo necesites', ok: true },
        { t: 'Repones cada dos semanas lo que vendes', ok: false },
        { t: 'Tienes variedad que nadie pide', ok: true }
      ],
      explain: 'Si tu bodega vale más que tu cuenta, tienes un problema de flujo.' },

    { type: 'sim', q: 'Te ofrecen 30% de descuento por comprar material para 6 meses.',
      opts: [
        { t: 'Aceptar: es un ahorro grande', ok: false,
          effects: { dinero: -3, tiempo: 0, aprendizaje: 0 },
          why: 'Congelas efectivo por seis meses. Si tu demanda cambia, ese “ahorro” se vuelve pérdida total.' },
        { t: 'Comprar para 6 semanas y negociar el mismo precio con compras recurrentes', ok: true,
          effects: { dinero: 2, tiempo: 1, aprendizaje: 2 },
          why: 'Muchos proveedores dan buen precio por recurrencia, no solo por volumen. Preguntar es gratis.' },
        { t: 'No comprar nada', ok: false,
          effects: { dinero: 0, tiempo: -2, aprendizaje: 0 },
          why: 'Quedarte sin material también cuesta: pierdes ventas.' }
      ],
      explain: 'Un descuento que congela tu efectivo no es un descuento: es un préstamo que le haces al proveedor.' },

    { type: 'order', q: 'Ordena la gestión mensual de inventario',
      items: [
        'Cuenta lo que tienes hoy',
        'Calcula tu consumo semanal promedio',
        'Define tu punto de reorden por producto',
        'Marca lo que lleva más de 90 días sin moverse',
        'Liquida o descarta lo estancado'
      ],
      explain: 'Contar, medir, definir, detectar y limpiar. Una vez al mes.' },

    { type: 'write', q: 'Calcula tu punto de reorden',
      sub: 'Con tus números reales de consumo y tiempo de entrega.',
      ph: 'Consumo 3 kg por semana, el proveedor tarda 10 días, colchón 1 semana = pido cuando tenga 7 kg…',
      minWords: 10,
      hints: ['¿Cuánto consumes por semana?', '¿Cuánto tarda tu proveedor?'] }
  ],
  mission: {
    id: 'm5-05', title: 'Ordena tu inventario', dossier: null,
    brief: 'Cuenta lo que tienes, define puntos de reorden y detecta lo que lleva más de 90 días parado.',
    fields: [
      { key: 'consumo', label: 'Consumo semanal de tu insumo principal', type: 'text', ph: '3 kg de filamento' },
      { key: 'espera', label: 'Tiempo de entrega del proveedor (días)', type: 'num', ph: '10' },
      { key: 'reorden', label: 'Tu punto de reorden', type: 'text', ph: 'Pedir cuando queden 7 kg' },
      { key: 'estancado', label: '¿Qué tienes parado hace más de 90 días?', type: 'text', ph: '4 colores de filamento, ~$5,000' }
    ],
    rubric: [
      { id: 'a', label: 'Conoces tu consumo y tiempo de espera', check: 'numbers' },
      { id: 'b', label: 'Definiste un punto de reorden', check: 'filled' },
      { id: 'c', label: 'Identificaste inventario estancado', check: 'filled' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 5.6 */
{
  id: 'n5-06', level: 5, icon: '🎟️', title: 'Descuentos sin quebrar', xp: 30, min: 7,
  concept: {
    tag: 'Concepto', title: 'Un descuento cuesta más de lo que parece',
    body: [
      'Si tu margen es 40% y das 20% de descuento, no perdiste el 20%: **perdiste la mitad de tu ganancia**. Para compensar tendrías que vender el doble.',
      'Antes de descontar, prueba con: dar más valor (garantía, extra), condicionar el descuento (por volumen, por pago inmediato) o crear una versión más económica sin tocar el precio principal.'
    ],
    keys: [
      'Descuento de 20% con margen de 40% = pierdes la mitad de tu utilidad.',
      'Nunca descuentes sin pedir algo a cambio.',
      'Mejor agregar valor que restar precio.'
    ]
  },
  cas: {
    emoji: '🩸', title: 'La promoción que costó el mes',
    text: 'Ofreció 25% de descuento toda la semana. Vendió 60% más unidades y terminó el mes con menos utilidad que el mes anterior, agotado y con los clientes esperando el siguiente descuento para volver a comprar.'
  },
  steps: [
    { type: 'quiz', q: 'Vendes a $200 con costo $120 (margen 40%). Das 20% de descuento. ¿Cuánto pierdes de utilidad?',
      opts: [
        { t: '20% de mi utilidad', ok: false, why: 'El descuento se resta del precio, no de la utilidad. El golpe es mucho mayor.' },
        { t: '50% de mi utilidad', ok: true, why: 'Precio baja a $160. Utilidad pasa de $80 a $40: la mitad exacta.' },
        { t: 'Nada, vendo más', ok: false, why: 'Necesitarías vender el doble solo para quedar igual.' },
        { t: '10%', ok: false, why: 'Haz la cuenta: $160 − $120 = $40 contra los $80 originales.' }
      ],
      explain: 'Cada punto de descuento sale directo de tu utilidad, no de tu precio.' },

    { type: 'multi', q: '¿Qué alternativas hay antes de descontar? (elige todas)',
      opts: [
        { t: 'Agregar garantía extendida', ok: true },
        { t: 'Regalar un extra de bajo costo y alto valor percibido', ok: true },
        { t: 'Ofrecer una versión más sencilla y económica', ok: true },
        { t: 'Bajar el precio a todos permanentemente', ok: false },
        { t: 'Descuento condicionado a pago inmediato', ok: true }
      ],
      explain: 'Suma valor o condiciona el descuento. Nunca lo regales.' },

    { type: 'sim', q: 'Un cliente frecuente pide 15% de descuento.',
      opts: [
        { t: 'Dárselo sin condiciones', ok: false,
          effects: { dinero: -2, reputacion: 0, clientes: 1 },
          why: 'A partir de hoy, ese es su precio. Y se lo contará a otros.' },
        { t: 'Ofrecerlo si compra 3 piezas o paga de contado hoy', ok: true,
          effects: { dinero: 2, reputacion: 2, clientes: 2 },
          why: 'El descuento se gana con algo que te beneficia: volumen o liquidez.' },
        { t: 'Negarse en seco', ok: false,
          effects: { dinero: 0, reputacion: -1, clientes: -1 },
          why: 'Puedes perder a un buen cliente por no ofrecer una alternativa.' }
      ],
      explain: 'Todo descuento debe tener una condición: cantidad, plazo de pago o compromiso.' },

    { type: 'slider', q: '¿Cuál es el descuento máximo prudente si tu margen es 45%?',
      min: 0, max: 45, step: 5, value: 25, unit: '%',
      best: [5, 15],
      bands: [
        { max: 15, label: 'Prudente', tone: 'ok', msg: 'Hasta 15% conservas la mayor parte de tu utilidad y sigue siendo atractivo.' },
        { max: 25, label: 'Riesgoso', tone: 'warn', msg: 'Estás regalando la mitad de tu ganancia. Solo con volumen grande se justifica.' },
        { max: 45, label: 'Peligroso', tone: 'bad', msg: 'Con más del 25% te quedas casi sin utilidad y devalúas tu producto.' }
      ],
      explain: 'Regla práctica: nunca descuentes más de un tercio de tu margen.' },

    { type: 'write', q: 'Diseña una promoción que no destruya tu margen',
      sub: 'Con condición clara y fecha de término.',
      ph: '2x1 en el segundo producto de menor valor, solo esta semana, pagando de contado…',
      minWords: 12,
      hints: ['¿Qué pides a cambio?', '¿Cuándo termina?', '¿Cuánto margen te queda?'] }
  ],
  mission: {
    id: 'm5-06', title: 'Tu política de descuentos', dossier: null,
    brief: 'Define por escrito hasta cuánto descuentas y bajo qué condiciones. Así dejas de improvisar bajo presión.',
    fields: [
      { key: 'maximo', label: 'Descuento máximo que darás (%)', type: 'num', ph: '15' },
      { key: 'condiciones', label: '¿Bajo qué condiciones?', type: 'area', ph: '10% desde 3 piezas, 15% pago de contado el mismo día' },
      { key: 'nunca', label: '¿En qué casos NUNCA descuentas?', type: 'text', ph: 'Piezas urgentes o personalizadas' }
    ],
    rubric: [
      { id: 'a', label: 'Definiste un máximo con número', check: 'number' },
      { id: 'b', label: 'Cada descuento tiene condición', check: 'reason' },
      { id: 'c', label: 'Definiste dónde no cedes', check: 'filled' }
    ],
    reward: { xp: 55, coins: 40 }
  }
},

/* ------------------------------------------------------------------ 5.7 */
{
  id: 'n5-07', level: 5, icon: '🏛️', title: 'Formalizarse sin miedo', xp: 25, min: 6,
  concept: {
    tag: 'Concepto', title: 'Formalizarse abre puertas que la informalidad cierra',
    body: [
      'Muchos negocios pequeños evitan formalizarse por miedo a impuestos. El costo real de no hacerlo suele ser mayor: **no puedes venderle a empresas, no accedes a crédito y no puedes crecer sin esconderte**.',
      'La regla práctica: formalízate cuando tus ingresos sean estables o cuando un cliente te pida comprobante. Antes de eso, valida.'
    ],
    keys: [
      'Sin comprobante fiscal, los clientes empresariales no te compran.',
      'Aparta un porcentaje de cada venta para impuestos desde el día 1.',
      'Las reglas cambian por país: verifica siempre con la autoridad local.'
    ]
  },
  cas: {
    emoji: '🧾', title: 'El cliente que se fue por una factura',
    text: 'Un taller le ofreció un contrato mensual de $18,000. Pidió factura. No estaba dado de alta y perdió el contrato. Se registró esa semana; el mes siguiente cerró dos clientes empresariales más. La formalización le costó unas horas y le abrió un canal completo.'
  },
  steps: [
    { type: 'quiz', q: '¿Cuál es una buena señal de que ya conviene formalizarse?',
      opts: [
        { t: 'Cuando tengas la idea perfecta', ok: false, why: 'Formalizar una idea no validada es gastar antes de saber si funciona.' },
        { t: 'Cuando un cliente te pida comprobante o tus ingresos sean constantes', ok: true, why: 'Ahí el beneficio ya supera el costo: te abre clientes y ordena tus finanzas.' },
        { t: 'Nunca, es mejor evitar impuestos', ok: false, why: 'La informalidad limita tu techo y genera riesgos crecientes.' },
        { t: 'Antes de la primera venta', ok: false, why: 'Salvo que tu giro lo exija, primero valida y luego formaliza.' }
      ],
      explain: 'Formaliza cuando la demanda ya existe, no antes.' },

    { type: 'multi', q: '¿Qué te permite estar formalizado? (elige todas)',
      opts: [
        { t: 'Venderle a empresas que exigen factura', ok: true },
        { t: 'Acceder a créditos y terminales de pago', ok: true },
        { t: 'Participar en licitaciones y ferias formales', ok: true },
        { t: 'Evitar por completo pagar impuestos', ok: false },
        { t: 'Contratar personal en regla', ok: true }
      ],
      explain: 'Formalizarse es acceso: a clientes, a crédito y a crecimiento.' },

    { type: 'slider', q: '¿Qué porcentaje de cada venta conviene apartar para impuestos y obligaciones?',
      min: 0, max: 40, step: 5, value: 0, unit: '%',
      best: [15, 25],
      bands: [
        { max: 10, label: 'Insuficiente', tone: 'bad', msg: 'Te va a alcanzar el pago sin dinero apartado. Es la sorpresa más común.' },
        { max: 25, label: 'Prudente', tone: 'ok', msg: 'Apartar 15-25% de cada venta te deja tranquilo casi en cualquier régimen.' },
        { max: 40, label: 'Muy conservador', tone: 'warn', msg: 'Puede ser más de lo necesario. Consulta tu régimen específico.' }
      ],
      explain: 'Aparta un porcentaje de CADA venta en cuanto entra, no a fin de año.' },

    { type: 'order', q: 'Ordena los pasos de formalización básica',
      items: [
        'Verifica el régimen que aplica a tu actividad y tus ingresos',
        'Regístrate ante la autoridad fiscal de tu país',
        'Abre una cuenta bancaria del negocio',
        'Aparta un porcentaje de cada venta para impuestos',
        'Emite comprobantes desde la primera venta formal'
      ],
      explain: 'Cada país tiene sus reglas: confirma siempre con la autoridad local o un contador.' },

    { type: 'write', q: '¿Qué te ha detenido para formalizarte?',
      sub: 'Y qué es lo primero que averiguarás esta semana.',
      ph: 'Creo que voy a pagar mucho impuesto, pero no sé cuál es mi régimen. Voy a consultar…',
      minWords: 10,
      hints: ['¿Qué información te falta?', '¿A quién puedes preguntarle?'] }
  ],
  mission: {
    id: 'm5-07', title: 'Tu plan de formalización', dossier: null,
    brief: 'Averigua qué régimen aplica en tu país para tu nivel de ingresos y define cuándo darás el paso.',
    fields: [
      { key: 'pais', label: 'Tu país o estado', type: 'text', ph: 'México' },
      { key: 'regimen', label: '¿Qué régimen te corresponde?', type: 'text', ph: 'Por confirmar con contador / RESICO' },
      { key: 'aparta', label: '¿Qué % de cada venta vas a apartar?', type: 'num', ph: '20' },
      { key: 'cuando', label: '¿Cuándo darás el paso?', type: 'text', ph: 'Cuando llegue a $15,000 mensuales estables' }
    ],
    rubric: [
      { id: 'a', label: 'Investigaste tu régimen', check: 'filled' },
      { id: 'b', label: 'Definiste un porcentaje a apartar', check: 'number' },
      { id: 'c', label: 'Pusiste una condición o fecha concreta', check: 'filled' }
    ],
    reward: { xp: 50, coins: 35 }
  }
}

]);
