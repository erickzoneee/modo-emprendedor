/* ==========================================================================
   BASE DE CONOCIMIENTO DEL MENTOR — intenciones, respuestas y prácticas
   ========================================================================== */
(function (w) {
  'use strict';

  /* ---------------------------------------------------------------
     Intenciones: se buscan por palabras clave en el mensaje del usuario
     --------------------------------------------------------------- */
  var INTENTS = [
    {
      id: 'saludo',
      keys: ['hola', 'buenas', 'que tal', 'qué tal', 'hey', 'saludos', 'buenos dias', 'buenas tardes'],
      title: null,
      answer: '¡Hola! 👋 Dime en qué estás atorado y vamos directo.\n\n' +
        'Lo más útil que puedo hacer por ti ahora mismo:\n' +
        '• **Revisar tu oferta** y decirte qué le falta\n' +
        '• **Calcular** tu precio o tu punto de equilibrio\n' +
        '• **Practicar objeciones** como si fuera un cliente difícil\n' +
        '• Decirte **qué hacer hoy** en 10 minutos',
      follow: ['¿Qué hago hoy?', 'Revisar mi oferta', 'Calcular mi precio', 'Practicar objeciones']
    },
    {
      id: 'precio',
      keys: ['precio', 'cobrar', 'cuanto cobro', 'cuánto cobro', 'tarifa', 'caro', 'barato', 'cuanto vale',
             'poner precio', 'que precio', 'cuanto le pongo', 'cuanto cuesta el mio'],
      title: 'Cómo poner precio',
      answer: 'El precio se arma con tres números, no con intuición:\n\n' +
        '**1. Piso (costo).** Material + energía + tu tiempo + desgaste + empaque. Ese es tu costo unitario. Nunca vendas debajo.\n' +
        '**2. Rango (mercado).** Qué cobran 3 competidores por algo parecido.\n' +
        '**3. Techo (valor).** Cuánto gana o ahorra tu cliente al resolver el problema. Cobra entre el 20% y el 50% de ese valor.\n\n' +
        'Para producto hecho a mano, la regla práctica es **2 a 3 veces tu costo unitario**.',
      follow: ['Calcular mi precio', 'Punto de equilibrio', '¿Y si me dicen que está caro?']
    },
    {
      id: 'equilibrio',
      keys: ['punto de equilibrio', 'equilibrio', 'cuantas unidades', 'cuántas piezas', 'no perder', 'break even'],
      title: 'Punto de equilibrio',
      answer: 'Es cuántas unidades necesitas vender para no perder dinero:\n\n' +
        '**Punto de equilibrio = Costos fijos ÷ (Precio − Costo variable unitario)**\n\n' +
        'Ese paréntesis se llama *margen de contribución*: lo que cada venta aporta para pagar tus fijos.\n\n' +
        'Truco: subir el precio baja tu punto de equilibrio mucho más rápido que recortar costos. Y planea vender entre 1.5 y 2 veces ese número, para tener colchón.',
      follow: ['Calcular punto de equilibrio', 'Bajar mis costos', '¿Subo mi precio?']
    },
    {
      id: 'cliente',
      keys: ['cliente ideal', 'a quien le vendo', 'a quién le vendo', 'nicho', 'publico', 'público', 'segmento', 'buyer'],
      title: 'Tu cliente ideal',
      answer: 'Un cliente ideal no se define por edad ni género, se define por **necesidad**:\n\n' +
        '“Le vendo a **[grupo específico]** que necesita **[X]** porque **[causa]**, y los encuentro en **[lugar real]**.”\n\n' +
        'Los tres filtros que debe pasar:\n' +
        '• ¿Siente el problema con urgencia?\n' +
        '• ¿Puedo encontrarlo? (¿dónde se junta?)\n' +
        '• ¿Puede y quiere pagar?\n\n' +
        'Si tu respuesta incluye “todos” o “cualquiera”, todavía no tienes cliente ideal.',
      follow: ['Revisar mi cliente ideal', '¿Dónde lo encuentro?', 'Mi oferta']
    },
    {
      id: 'validar',
      keys: ['validar', 'validacion', 'validación', 'saber si funciona', 'probar mi idea', 'sirve mi idea',
             'valido', 'valida mi idea', 'como se si funciona', 'preventa', 'anticipo'],
      title: 'Cómo validar',
      answer: 'Validar no es que te digan que les gusta. Es que **alguien haga algo que le cueste**.\n\n' +
        'Escala de evidencia, de menor a mayor:\n' +
        '1. “Qué buena idea” → vale cero\n' +
        '2. “Yo lo compraría” → casi cero\n' +
        '3. Deja su teléfono y fecha → algo\n' +
        '4. Da un anticipo → mucho\n' +
        '5. Paga completo → validado\n\n' +
        'La prueba más rápida es la **preventa**: ofrece con 30-50% de anticipo, fecha de entrega y devolución garantizada. Si nadie paga por adelantado, tampoco iba a pagar después.',
      follow: ['Diseñar mi preventa', '¿Cuántos “no” son normales?', 'Mi hipótesis']
    },
    {
      id: 'objeciones',
      keys: ['objecion', 'objeción', 'me dicen que esta caro', 'está caro', 'lo voy a pensar', 'no me compran', 'excusas'],
      title: 'Manejo de objeciones',
      answer: 'Una objeción es interés con miedo. El que no tiene interés simplemente desaparece.\n\n' +
        'Método: **escucha → valida → pregunta → responde → propón**.\n\n' +
        '• “Está caro” → “Entiendo. ¿Comparado con qué lo estás viendo?”\n' +
        '• “Lo voy a pensar” → “Claro. ¿Qué te genera más duda: el precio, el tiempo o si va a funcionar?”\n' +
        '• “Déjame consultarlo” → “Perfecto. ¿Qué información le sirve a esa persona para decidir?”\n\n' +
        'Nunca contradigas de frente y nunca ofrezcas descuento antes de entender la duda real.',
      follow: ['Practicar objeciones', 'Mi guion de ventas', 'Cerrar la venta']
    },
    {
      id: 'oferta',
      keys: ['oferta', 'propuesta', 'que ofrezco', 'qué ofrezco', 'mi producto', 'promesa'],
      title: 'Tu oferta',
      answer: 'Producto es lo que haces. Oferta es la promesa completa. La fórmula:\n\n' +
        '**Ayudo a [cliente] a [resultado] mediante [producto], en [tiempo], con [garantía], por [precio].**\n\n' +
        'Lo que más sube la conversión no es bajar el precio: es **reducir el riesgo del cliente**. Fecha comprometida, garantía clara y evidencia de trabajos anteriores.',
      follow: ['Revisar mi oferta', 'Mi pitch de 30 segundos', 'Precio']
    },
    {
      id: 'vender',
      keys: ['vender', 'ventas', 'conseguir clientes', 'primeros clientes', 'no vendo', 'como vendo',
             'consigo clientes', 'nadie me compra', 'no me compran', 'primer cliente', 'donde vendo'],
      title: 'Conseguir clientes',
      answer: 'Vender no es convencer: es diagnosticar. Antes de dar un precio, pregunta:\n' +
        '• ¿Para qué lo necesitas?\n' +
        '• ¿Para cuándo?\n' +
        '• ¿Qué has probado antes y qué falló?\n\n' +
        'Y para conseguir los primeros clientes, olvida las redes por un momento: haz **20 contactos directos** a personas del nicho que elegiste. Mensaje de 4 líneas, personalizado, con una sola pregunta fácil al final.\n\n' +
        'La mayoría de las ventas se pierde por falta de seguimiento, no por precio: 4 a 6 contactos útiles es lo normal.',
      follow: ['Escribir mi mensaje en frío', 'Mi guion de seguimiento', 'Practicar una venta']
    },
    {
      id: 'marketing',
      keys: ['marketing', 'redes', 'instagram', 'facebook', 'tiktok', 'contenido', 'publicar', 'seguidores'],
      title: 'Marketing que funciona',
      answer: 'Todo marketing pasa por tres etapas: **atención → confianza → acción**. El error típico es publicar solo promociones (acción) sin haber construido confianza.\n\n' +
        'Reparto recomendado de 10 publicaciones: 3 de atención, 5 de confianza, 2 de venta.\n\n' +
        'Cuatro formatos que siempre funcionan y se graban con el teléfono:\n' +
        '• Antes y después\n' +
        '• El proceso real\n' +
        '• Un cliente contando su experiencia\n' +
        '• Respuesta a una duda frecuente\n\n' +
        'Graba 6 videos en una sola sesión y publícalos durante 6 semanas. La constancia vence a la producción.',
      follow: ['Ideas de contenido', 'Publicidad pagada', 'Conseguir reseñas']
    },
    {
      id: 'publicidad',
      keys: ['publicidad', 'anuncios', 'pagar anuncios', 'ads', 'invertir en publicidad', 'cac'],
      title: 'Publicidad sin quemar dinero',
      answer: 'La publicidad **amplifica** lo que ya funciona. Si tu oferta no vende gratis, pagada venderá igual de mal pero más caro.\n\n' +
        'Dos números obligatorios:\n' +
        '**CAC = inversión ÷ clientes conseguidos**\n' +
        '**Margen por cliente = precio − costo variable**\n\n' +
        'Si el CAC supera tu margen, cada venta te empobrece. Objetivo prudente: CAC menor a la mitad de tu margen.\n\n' +
        'Empieza con $40-$150 diarios durante 5-7 días, probando dos mensajes distintos. Escala solo el ganador.',
      follow: ['Calcular mi CAC', 'Mejorar mi mensaje', 'Marketing gratis']
    },
    {
      id: 'costos',
      keys: ['costo', 'costos', 'cuanto me cuesta', 'gastos', 'margen', 'utilidad', 'ganancia'],
      title: 'Costos y margen',
      answer: '**Fijos**: los pagas vendas o no (renta, internet, suscripciones).\n' +
        '**Variables**: solo existen si produces (material, empaque, envío, comisiones).\n' +
        '**Costo unitario**: material + energía + tu tiempo + desgaste + empaque.\n\n' +
        'Si no incluyes tu tiempo, te estás pagando cero por hora.\n\n' +
        '**Utilidad = ingresos − variables − fijos** (incluido tu sueldo). Para producción propia, apunta a un margen bruto de **45% a 65%**.',
      follow: ['Calcular costo unitario', 'Costo de impresión 3D', 'Punto de equilibrio']
    },
    {
      id: 'flujo',
      keys: ['flujo', 'efectivo', 'liquidez', 'no me alcanza', 'sin dinero', 'me quede sin dinero',
             'me quede sin efectivo', 'no tengo dinero', 'no me pagan', 'deudas'],
      title: 'Flujo de efectivo',
      answer: 'Se puede ser rentable y quebrar igual. La utilidad dice si ganas; el flujo dice si puedes pagar mañana.\n\n' +
        'Cuando falta efectivo, en este orden:\n' +
        '1. **Acelera cobros**: pide anticipos, ofrece descuento por pago inmediato.\n' +
        '2. **Retrasa pagos**: negocia plazo con proveedores.\n' +
        '3. **Libera inventario**: liquida lo que lleva 90 días parado.\n' +
        '4. Solo al final, crédito.\n\n' +
        'Meta: tener siempre 1 a 3 meses de costos fijos en reserva.',
      follow: ['Proyectar mi mes', 'Reducir gastos', 'Cobrar anticipos']
    },
    {
      id: 'inventario',
      keys: ['inventario', 'stock', 'material', 'cuanto compro', 'almacen', 'almacén'],
      title: 'Inventario',
      answer: 'El inventario es dinero dormido. Dos fórmulas te ordenan:\n\n' +
        '**Punto de reorden = (consumo semanal × semanas de espera) + colchón**\n\n' +
        'Y una regla: lo que lleva **más de 90 días** sin moverse, se liquida. No es pérdida: es recuperar efectivo que ya estaba perdido.\n\n' +
        'Cuidado con los descuentos por volumen: un descuento que congela tu efectivo seis meses no es descuento, es un préstamo que le haces al proveedor.',
      follow: ['Calcular mi reorden', 'Flujo de efectivo', 'Liquidar lo estancado']
    },
    {
      id: 'delegar',
      keys: ['delegar', 'delego', 'delegacion', 'contratar', 'contrato a', 'empleado', 'ayudante',
             'equipo', 'personal', 'necesito ayuda', 'no me doy abasto'],
      title: 'Delegar y contratar',
      answer: 'Se delega lo **repetitivo, de bajo riesgo y con estándar claro**. Nunca la estrategia ni los precios.\n\n' +
        'Método de cinco etapas: lo hago yo y observas → lo hacemos juntos → lo haces y reviso todo → lo haces y reviso al azar → lo haces y solo reportas.\n\n' +
        'Antes de contratar de planta, prueba por horas o por proyecto. Y recalcula tu punto de equilibrio: cada sueldo es un costo fijo que sube el número de ventas que necesitas.',
      follow: ['¿Qué delego primero?', 'Documentar un proceso', 'Punto de equilibrio']
    },
    {
      id: 'procesos',
      keys: ['proceso', 'procesos', 'sistematizar', 'documentar', 'organizar', 'plantilla'],
      title: 'Procesos y sistemas',
      answer: 'Lo que solo está en tu cabeza no se puede delegar. Un buen proceso tiene:\n' +
        '• **Disparador**: cuándo empieza\n' +
        '• **Pasos numerados** que empiezan con verbo\n' +
        '• **Tiempos** estimados\n' +
        '• **Qué hacer si algo falla**\n\n' +
        'Documenta primero el que más repites, y hazlo **mientras trabajas**, no de memoria.\n\n' +
        'Y si escribes lo mismo más de 5 veces por semana, conviértelo en plantilla.',
      follow: ['Documentar mi proceso', 'Mis plantillas', 'Delegar']
    },
    {
      id: 'crecer',
      keys: ['crecer', 'escalar', 'expandir', 'crecimiento', 'mas ventas', 'más ventas'],
      title: 'Crecer y escalar',
      answer: 'Antes de escalar necesitas tres cosas: **demanda estable**, **margen sano** y **procesos documentados**. Si falta una, crecer multiplica el problema.\n\n' +
        'Y crece por donde ya tienes tracción, de menor a mayor riesgo:\n' +
        '1. Venderle más a tus clientes actuales\n' +
        '2. Tu producto actual en un mercado nuevo\n' +
        '3. Producto nuevo a tus clientes actuales\n' +
        '4. Producto nuevo en mercado nuevo (empezar de cero otra vez)\n\n' +
        'La pregunta más rentable del mundo: *“¿qué más necesitas que yo pueda darte?”*',
      follow: ['Subir mi ticket promedio', 'Reinvertir', 'Plan de 90 días']
    },
    {
      id: 'ticket',
      keys: ['ticket', 'ticket promedio', 'vender mas a cada cliente', 'complemento', 'paquete', 'upsell'],
      title: 'Subir el ticket promedio',
      answer: 'Conseguir un cliente nuevo cuesta 5 a 7 veces más que venderle a uno existente. Tres palancas:\n\n' +
        '• **Complemento**: algo que se usa junto con lo que compró, por menos del 40% del precio principal.\n' +
        '• **Versión superior**: más valor por más precio (material reforzado, garantía extendida).\n' +
        '• **Paquete**: varios productos con precio conjunto atractivo.\n\n' +
        'Ofrécelo **justo después del sí**, nunca antes. Y máximo dos opciones adicionales: más confunde.',
      follow: ['Diseñar mi complemento', 'Recompra', 'Precio']
    },
    {
      id: 'recompra',
      keys: ['recompra', 'que vuelvan', 'clientes frecuentes', 'fidelizar', 'retencion', 'retención'],
      title: 'Que vuelvan a comprar',
      answer: 'Un cliente que compra una vez es una venta. Uno que compra cinco veces es un negocio.\n\n' +
        'Sistema simple:\n' +
        '1. Guarda datos de cada cliente y qué compró\n' +
        '2. Calcula cada cuánto lo necesita\n' +
        '3. Escríbele **justo antes** de que se le acabe\n' +
        '4. Propón fecha concreta: “¿te lo preparo para el jueves?” en vez de “¿necesitas algo?”\n\n' +
        'Tu lista de clientes anteriores es tu activo más rentable.',
      follow: ['Reactivar mi lista', 'Pedir reseñas', 'Subir mi ticket']
    },
    {
      id: 'resenas',
      keys: ['reseña', 'reseñas', 'testimonio', 'referido', 'referidos', 'recomendacion', 'recomendación'],
      title: 'Reseñas y referidos',
      answer: 'Pide la reseña **el mismo día de la entrega**, cuando la satisfacción está en su punto más alto.\n\n' +
        'Mensaje que funciona: *“¿Me ayudas con una foto y dos líneas de cómo te fue? Con eso ayudo a otros a decidirse.”*\n\n' +
        'Para referidos, nunca digas “si conoces a alguien”. Da un perfil concreto: *“¿conoces a alguien más con una máquina vieja que necesite repuestos?”*. La gente recuerda perfiles, no categorías.',
      follow: ['Mi mensaje de reseña', 'Marketing', 'Recompra']
    },
    {
      id: 'impuestos',
      keys: ['impuesto', 'impuestos', 'sat', 'factura', 'formalizar', 'legal', 'regimen', 'régimen', 'dar de alta'],
      title: 'Formalización',
      answer: 'Formalízate cuando **un cliente te pida comprobante** o cuando tus ingresos sean estables. Antes de eso, valida.\n\n' +
        'Lo que abre la formalización: clientes empresariales, crédito, terminales de pago, licitaciones y contratación de personal.\n\n' +
        'Regla práctica desde el día 1: **aparta 15-25% de cada venta** en cuanto entra, no a fin de año.\n\n' +
        '⚠️ Las reglas cambian por país y por nivel de ingresos: confirma siempre con la autoridad fiscal local o un contador.',
      follow: ['Separar mis cuentas', 'Mis números', 'Flujo de efectivo']
    },
    {
      id: 'competencia',
      keys: ['competencia', 'competidor', 'me copiaron', 'diferenciar', 'diferenciacion', 'diferenciación'],
      title: 'Competencia y diferencia',
      answer: 'Que haya competencia es **buena noticia**: significa que hay dinero moviéndose. El problema es competir sin diferencia, porque entonces solo queda bajar el precio.\n\n' +
        'Diferencias que sí cuentan (todas verificables):\n' +
        '• **Velocidad**: “cotización en 15 minutos, entrega en 48 h”\n' +
        '• **Garantía**: “si se rompe en 6 meses, la repongo”\n' +
        '• **Especialización**: “solo trabajo con clínicas dentales”\n\n' +
        '“Mejor calidad” y “buen servicio” no son diferencias: los dice todo el mundo.',
      follow: ['Definir mi diferencia', 'Precio', 'Mi oferta']
    },
    {
      id: 'idea',
      keys: ['idea', 'no tengo idea', 'que negocio pongo', 'qué negocio', 'emprender', 'empezar', 'no se que hacer'],
      title: 'Encontrar una idea',
      answer: 'Un negocio no nace de una idea brillante: nace de **un problema que le molesta a alguien lo suficiente como para pagar**.\n\n' +
        'Busca en tres lugares donde la gente:\n' +
        '• **Pierde tiempo** (trabajo repetido a mano)\n' +
        '• **Pierde dinero** (compras que se repiten porque algo falla)\n' +
        '• **Se siente incómoda** (esperas, pasos innecesarios, inseguridad)\n\n' +
        'Y crúzalo con tu **ventaja injusta**: lo que a ti te sale fácil o barato y a otros les cuesta caro. Ahí está tu negocio.',
      follow: ['Mi ventaja injusta', 'Radar de problemas', 'Validar una idea']
    },
    {
      id: 'miedo',
      keys: ['me da miedo', 'miedo', 'no puedo', 'me da pena', 'inseguro', 'fracaso', 'fracasar',
             'ansiedad', 'desanimado', 'rendirme', 'quiero rendirme', 'no sirvo', 'me da nervios',
             'no me atrevo', 'estoy bloqueado'],
      title: 'Cuando da miedo',
      answer: 'El miedo no desaparece antes de actuar: **desaparece actuando**. Y casi siempre viene de una de tres cosas:\n\n' +
        '• **Miedo al rechazo** → recuerda: de 20 contactos, 17 “no” es lo normal. Los “no” son parte del precio, no una señal de que vales menos.\n' +
        '• **Miedo a perder dinero** → valida antes de producir. Si no arriesgas capital, el miedo baja solo.\n' +
        '• **Miedo a no saber** → nadie sabe al principio. Se aprende vendiendo, no estudiando.\n\n' +
        'Hoy solo tienes que hacer una cosa pequeña. Solo una. ¿Cuál eliges?',
      follow: ['Dame una misión pequeña', 'Practicar una venta', 'Mi plan de hoy']
    },
    {
      id: 'tiempo',
      keys: ['tiempo', 'no tengo tiempo', 'trabajo', 'ocupado', 'horas', 'organizar mi tiempo'],
      title: 'Emprender con poco tiempo',
      answer: 'Con 30 minutos al día se construye un negocio, si esos 30 minutos van al lugar correcto.\n\n' +
        'Orden de prioridad cuando el tiempo es escaso:\n' +
        '1. **Hablar con clientes** (vender o entrevistar)\n' +
        '2. **Producir lo vendido**\n' +
        '3. Todo lo demás\n\n' +
        'Lo que NO debe ocupar tus primeras horas: logo, página web, nombre perfecto, catálogo completo. Eso se siente productivo y no mueve el negocio.\n\n' +
        'Y agrupa tareas: graba 6 videos en una hora, escribe 20 mensajes seguidos, cotiza todo en un solo bloque.',
      follow: ['Mi misión de hoy', 'Plantillas', 'Delegar']
    },
    {
      id: 'impresion3d',
      keys: ['3d', 'impresion 3d', 'impresión 3d', 'filamento', 'pla', 'petg', 'bazar 3d', 'impresora'],
      title: 'Negocio de impresión 3D',
      answer: 'Tu costo por pieza casi nunca es solo el filamento. La cuenta completa:\n\n' +
        '• **Filamento**: gramos × precio por gramo\n' +
        '• **Energía**: horas × costo por hora de máquina\n' +
        '• **Desgaste y fallos**: suma 10-15% (boquillas, camas, piezas fallidas)\n' +
        '• **Tu tiempo**: preparación, post-proceso y empaque × valor de tu hora\n' +
        '• **Empaque y envío**\n\n' +
        'Dónde está el dinero de verdad en 3D: **piezas de repuesto descontinuadas** y **personalización con nombre**, no en figuras decorativas. Las primeras tienen urgencia; las segundas tienen valor emocional. Ambas pagan mejor que “decoración bonita”.',
      follow: ['Calcular costo de impresión 3D', 'Cliente ideal para 3D', 'Precio']
    },
    {
      id: 'mision',
      keys: ['mision', 'misión', 'que hago hoy', 'qué hago hoy', 'tarea', 'siguiente paso', 'que sigue'],
      title: 'Tu misión de hoy',
      answer: '__MISSION__',
      follow: ['Practicar una venta', 'Mis números', 'Mi expediente']
    }
  ];

  /* ---------------------------------------------------------------
     Prácticas guiadas (simulaciones conversacionales)
     --------------------------------------------------------------- */
  var PRACTICE = {
    objeciones: {
      title: 'Práctica de objeciones',
      intro: 'Voy a hacer de cliente difícil. Respóndeme como si fuera real. Al final te digo qué tal.',
      turns: [
        { client: 'Uy, está caro. Vi otro más barato en línea.',
          good: ['comparado', 'incluye', 'garantía', 'garantia', 'entrega', 'plazo', 'diferencia', 'cuánto', 'cuanto'],
          tip: 'Lo ideal: validar, preguntar “¿comparado con qué?” y comparar lo que incluye cada opción, no el precio suelto.' },
        { client: 'Mmm, déjame pensarlo y te aviso.',
          good: ['duda', 'precio', 'tiempo', 'funcione', 'qué parte', 'que parte', 'ayudo', 'resuelvo'],
          tip: 'Lo ideal: ofrecer opciones de duda concretas — precio, tiempo o resultado — para descubrir la objeción real.' },
        { client: 'Es que no te conozco, ¿cómo sé que cumples?',
          good: ['garantía', 'garantia', 'devuelvo', 'anticipo', 'foto', 'reseña', 'resena', 'cliente', 'trabajos'],
          tip: 'Lo ideal: bajar el riesgo con garantía, evidencia de trabajos anteriores o un anticipo pequeño reembolsable.' },
        { client: 'Bueno... ¿y si lo pruebo con uno solo?',
          good: ['claro', 'perfecto', 'cuando', 'cuándo', 'lunes', 'jueves', 'agendo', 'empiezo', 'preparo'],
          tip: 'Lo ideal: cerrar proponiendo fecha concreta: “te lo preparo para el jueves, ¿va?”.' }
      ]
    },
    entrevista: {
      title: 'Práctica de entrevista con cliente',
      intro: 'Soy un cliente potencial de tu nicho. Hazme preguntas de descubrimiento. Recuerda: hechos del pasado, no opiniones del futuro.',
      turns: [
        { client: 'Hola, sí, claro, tengo cinco minutos. ¿Qué querías preguntarme?',
          good: ['última vez', 'ultima vez', 'cuándo', 'cuando', 'cómo', 'como', 'qué hiciste', 'que hiciste', 'cuéntame', 'cuentame'],
          tip: 'Lo ideal: empezar pidiendo un hecho concreto del pasado, no una opinión.' },
        { client: 'Pues la última vez que me pasó fue el mes pasado. Lo resolví como pude, la verdad.',
          good: ['cuánto', 'cuanto', 'costó', 'costo', 'tiempo', 'qué hiciste', 'que hiciste', 'cómo lo', 'como lo'],
          tip: 'Lo ideal: indagar qué hizo exactamente y cuánto le costó en dinero o tiempo.' },
        { client: 'Me costó como $600 y perdí casi dos días. Fue un fastidio.',
          good: ['frustrante', 'peor', 'molesta', 'seguido', 'frecuencia', 'cuántas veces', 'cuantas veces', 'pasa'],
          tip: 'Lo ideal: preguntar por la frecuencia y por lo más frustrante de esa solución.' },
        { client: 'Me pasa como tres veces al año. Lo peor es que nunca sé a quién llamar.',
          good: ['conoces', 'alguien más', 'alguien mas', 'recomiendas', 'quién más', 'quien mas'],
          tip: 'Lo ideal: cerrar pidiendo un referido: “¿con quién más debería hablar de esto?”.' }
      ]
    },
    venta: {
      title: 'Práctica de venta completa',
      intro: 'Soy un cliente que te escribió preguntando el precio. Véndeme sin darme el precio en el primer mensaje.',
      turns: [
        { client: 'Hola, ¿cuánto cuesta?',
          good: ['para qué', 'para que', 'cuándo', 'cuando', 'necesitas', 'depende', 'cuéntame', 'cuentame', 'qué tipo', 'que tipo'],
          tip: 'Lo ideal: no dar el precio de golpe. Preguntar uso y plazo primero.' },
        { client: 'Lo necesito para la próxima semana, es para mi negocio.',
          good: ['antes', 'probado', 'pasó', 'paso', 'qué falló', 'que fallo', 'cuántos', 'cuantos', 'cada cuánto'],
          tip: 'Lo ideal: entender el contexto y qué ha probado antes.' },
        { client: 'Ya compré uno parecido pero me duró muy poco.',
          good: ['garantía', 'garantia', 'resistente', 'reponer', 'dura', 'meses', 'año', 'ano'],
          tip: 'Lo ideal: conectar tu diferencia con su dolor: si le falló la durabilidad, tu garantía es el argumento.' },
        { client: 'Suena bien. ¿Entonces cuánto sería?',
          good: ['$', 'incluye', 'entrega', 'garantía', 'garantia', 'opción', 'opcion', 'pesos'],
          tip: 'Lo ideal: dar el precio junto con lo que incluye, el plazo y la garantía. Nunca el número solo.' },
        { client: 'Va, me interesa.',
          good: ['jueves', 'lunes', 'agendo', 'anticipo', 'empiezo', 'confirmo', 'preparo', 'mañana', 'manana'],
          tip: 'Lo ideal: cerrar con fecha y siguiente paso concreto, incluyendo anticipo.' }
      ]
    }
  };

  /* ---------------------------------------------------------------
     Sugerencias rápidas del chat
     --------------------------------------------------------------- */
  var QUICK = [
    '¿Qué hago hoy?',
    'Revisar mi oferta',
    'Calcular mi precio',
    'Punto de equilibrio',
    'Practicar objeciones',
    'Simular un cliente',
    'Costo de impresión 3D',
    'No sé qué negocio poner',
    'Me da miedo vender',
    'Cómo consigo clientes'
  ];

  /* ---------------------------------------------------------------
     Respuesta por defecto
     --------------------------------------------------------------- */
  var FALLBACK = [
    'Te leo. Para darte algo útil y no genérico, dime en una frase: **¿qué vendes y a quién?**',
    'Puedo ayudarte mejor si me das un dato concreto: un precio, un número de clientes o lo que te dijo alguien textualmente.',
    'No tengo eso claro todavía. Prueba con algo así: *“cobro $200, me cuesta $90, ¿está bien?”* o *“no sé cómo conseguir clientes”*.'
  ];

  w.MENTOR_KB = { INTENTS: INTENTS, PRACTICE: PRACTICE, QUICK: QUICK, FALLBACK: FALLBACK };
})(window);
