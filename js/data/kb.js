/* ==========================================================================
   BASE DE CONOCIMIENTO DE CHISPA

   La fuente de la verdad del motor. Cuando se usa un modelo generativo, el
   modelo solo redacta: los hechos salen de aquí y del perfil del usuario.

   Se guarda conocimiento reutilizable, no preguntas y respuestas literales.
   La misma regla sirve para una repostería y para una imprenta 3D porque el
   ejemplo se elige por sector y el texto se compone con datos reales.

   Esquema
   -------
   id            estable, se usa en `relacionados`
   tipo          regla | error | concepto | ejemplo | diagnostico | criterio
   titulo        cómo se anuncia en pantalla
   cuerpo        el conocimiento, en segunda persona y con cifras cuando las hay
   claves        términos por los que debe encontrarse
   sectores      '*' o lista: hechoamano | comida | servicios | digital | reventa
   etapas        '*' o lista: idea | starting | operating | growing
   formula       id de la fórmula que resuelve el tema, si existe
   relacionados  ids de otras entradas
   fuente        de dónde sale la afirmación
   revisado      fecha de la última revisión humana

   Al escribir una entrada nueva: si la frase serviría igual para cualquier
   negocio del mundo, todavía no es conocimiento útil. Tiene que llevar un
   número, un plazo, un umbral o una consecuencia concreta.
   ========================================================================== */
(function (w) {
  'use strict';

  var HOY = '2026-08-14';

  var ENTRADAS = [

  /* ==================================================================
     PRECIO Y COSTOS
     ================================================================== */
  { id: 'precio-tres-numeros', tipo: 'regla',
    titulo: 'Un precio se arma con tres números, no con intuición',
    cuerpo: 'El piso lo pone tu costo real por unidad, con tu tiempo dentro. El rango lo pone lo que ' +
      'cobran tres competidores por algo parecido. El techo lo pone cuánto gana o se ahorra tu cliente ' +
      'al resolverlo. Tu precio vive entre el piso y el techo, y nunca por debajo del piso.',
    claves: ['precio', 'cobrar', 'cuanto cobro', 'tarifa', 'poner precio', 'cuanto vale', 'en cuanto vendo'],
    sectores: ['*'], etapas: ['*'], formula: 'precio_sugerido',
    relacionados: ['precio-olvida-tiempo', 'margen-sano'], fuente: 'Costeo por absorción y pricing por valor', revisado: HOY },

  { id: 'precio-olvida-tiempo', tipo: 'error',
    titulo: 'El error más caro: no cobrarte tu tiempo',
    cuerpo: 'Casi todo el mundo suma materiales y empaque, y olvida las horas. Si tu tiempo no está en ' +
      'el costo, te pagas cero por hora: el negocio parece rentable mientras te cuesta dinero. Ponle ' +
      'precio a tu hora aunque nadie te la pague todavía, y respétalo cuando cotices.',
    claves: ['tiempo', 'mano de obra', 'mi trabajo', 'horas', 'no gano nada', 'trabajo gratis', 'me pago'],
    sectores: ['*'], etapas: ['*'], relacionados: ['precio-tres-numeros', 'sueldo-propio'],
    fuente: 'Error recurrente en costeo de microempresa', revisado: HOY },

  { id: 'margen-sano', tipo: 'regla',
    titulo: 'Cuánto margen es suficiente',
    cuerpo: 'En producción propia apunta a 2 o 3 veces tu costo unitario: un margen del 50% al 65%. ' +
      'Por debajo del 40%, cualquier imprevisto se come la ganancia y crecer solo multiplica el cansancio. ' +
      'En reventa lo sano es 30% a 45%, porque no pones horas de fabricación. En servicios, más del 65% ' +
      'es normal: tu costo principal es tu tiempo.',
    claves: ['margen', 'ganancia', 'utilidad', 'cuanto gano', 'rentable', 'rentabilidad', 'me conviene'],
    sectores: ['*'], etapas: ['*'], formula: 'margen',
    relacionados: ['precio-tres-numeros', 'punto-equilibrio'], fuente: 'Rangos de margen bruto en manufactura artesanal, retail y servicios', revisado: HOY },

  { id: 'comisiones-plataforma', tipo: 'regla',
    titulo: 'La comisión se divide, no se suma',
    cuerpo: 'Si la plataforma se queda un porcentaje, ese porcentaje sale del precio final, no de tu costo. ' +
      'Para que te queden $100 limpios con 15% de comisión, el precio no es $115: es $117,65. Suena a ' +
      'detalle y es la diferencia entre ganar y empatar.',
    claves: ['comision', 'plataforma', 'marketplace', 'mercado libre', 'porcentaje', 'me cobran', 'app de entrega'],
    sectores: ['*'], etapas: ['*'], formula: 'precio_sugerido',
    relacionados: ['precio-tres-numeros'], fuente: 'Aritmética de precio con comisión sobre venta', revisado: HOY },

  { id: 'punto-equilibrio', tipo: 'concepto',
    titulo: 'Tu punto de equilibrio es tu meta mínima',
    cuerpo: 'Es cuántas unidades necesitas vender al mes para no perder: gastos fijos entre lo que aporta ' +
      'cada venta. Ese número es tu meta mínima, no tu objetivo. Planea vender 1,6 veces esa cantidad ' +
      'para tener colchón; con justo el equilibrio, un mes flojo te deja en rojo.',
    claves: ['punto de equilibrio', 'equilibrio', 'cuantas unidades', 'cuantas piezas', 'no perder', 'cuanto tengo que vender'],
    sectores: ['*'], etapas: ['*'], formula: 'punto_equilibrio',
    relacionados: ['margen-sano', 'fijos-vs-variables'], fuente: 'Análisis costo-volumen-utilidad', revisado: HOY },

  { id: 'fijos-vs-variables', tipo: 'concepto',
    titulo: 'Fijo es lo que pagas aunque no vendas nada',
    cuerpo: 'Variable es lo que solo existe cuando hay una venta: material, empaque, comisión. Fijo es lo ' +
      'que se paga igual: renta, internet, suscripciones, un sueldo. Subir el precio baja tu punto de ' +
      'equilibrio mucho más rápido que recortar gastos fijos, y suele doler menos.',
    claves: ['costos fijos', 'costo variable', 'gastos', 'renta', 'que es fijo'],
    sectores: ['*'], etapas: ['*'], relacionados: ['punto-equilibrio'], fuente: 'Clasificación estándar de costos', revisado: HOY },

  { id: 'subir-precio', tipo: 'regla',
    titulo: 'El precio aguanta más de lo que crees',
    cuerpo: 'Sube entre 10% y 20% para las próximas cinco personas que pregunten y cuenta cuántas compran ' +
      'igual. Casi siempre compran las mismas. Subir 10% el precio suele aumentar la utilidad mucho más ' +
      'que vender 10% más unidades, y no te cuesta ni una hora extra de trabajo.',
    claves: ['subir precio', 'esta caro', 'me dicen caro', 'aumentar precio', 'subir mis precios'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['objecion-precio', 'margen-sano'],
    fuente: 'Elasticidad observada en pruebas de precio de microempresa', revisado: HOY },

  { id: 'descuentos-regla', tipo: 'regla',
    titulo: 'Un descuento sin regla se convierte en tu precio',
    cuerpo: 'Si das descuento cada vez que te lo piden, ese es tu precio real y el otro es decoración. ' +
      'Escribe tu política: cuál es el máximo, a cambio de qué (volumen, pago anticipado, un referido) ' +
      'y cuándo no das ninguno. Un descuento debe comprarte algo: nunca lo regales por pedirlo.',
    claves: ['descuento', 'rebaja', 'promocion', 'oferta especial', 'me piden descuento'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['objecion-precio'], fuente: 'Política de descuentos en venta consultiva', revisado: HOY },

  { id: 'precio-barato-senal', tipo: 'error',
    titulo: 'Ser el más barato es una promesa que no puedes cumplir',
    cuerpo: 'Con poco presupuesto no puedes ganar una guerra de precios: siempre habrá alguien con más ' +
      'volumen. Además, un precio muy bajo se lee como poca calidad y atrae al cliente que más regatea y ' +
      'menos vuelve. Compite por resultado, por rapidez o por cercanía.',
    claves: ['barato', 'competir por precio', 'el mas barato', 'precio bajo', 'competencia barata'],
    sectores: ['*'], etapas: ['*'], relacionados: ['propuesta-formula'], fuente: 'Posicionamiento por diferenciación frente a liderazgo en costos', revisado: HOY },

  { id: 'merma-15', tipo: 'regla',
    titulo: 'Presupuesta los fallos: no son excepciones',
    cuerpo: 'Las piezas que salen mal, el material que se echa a perder y los reenvíos son parte del costo. ' +
      'Añade entre 10% y 15% al costo directo para cubrirlos. Si no lo haces, cada error se descuenta de ' +
      'tu utilidad y parece mala suerte cuando en realidad es un costo que no presupuestaste.',
    claves: ['merma', 'desperdicio', 'se echo a perder', 'fallo', 'error de produccion', 'se rompio'],
    sectores: ['hechoamano', 'comida', 'reventa'], etapas: ['*'], relacionados: ['precio-tres-numeros'],
    fuente: 'Provisión por merma en costeo de producción', revisado: HOY },

  /* ==================================================================
     CLIENTE
     ================================================================== */
  { id: 'cliente-necesidad', tipo: 'regla',
    titulo: 'El cliente se define por necesidad, no por edad',
    cuerpo: 'Completa esta frase y ya lo tienes: le vendo a [grupo concreto] que necesita [X] porque ' +
      '[causa real], y los encuentro en [lugar donde se juntan]. Si no puedes nombrar el lugar, todavía ' +
      'no tienes cliente: tienes una descripción.',
    claves: ['cliente ideal', 'a quien le vendo', 'quien me compra', 'publico', 'nicho', 'segmento', 'buyer'],
    sectores: ['*'], etapas: ['*'], relacionados: ['cliente-todos', 'cliente-tres-perfiles'],
    fuente: 'Segmentación por necesidad y accesibilidad', revisado: HOY },

  { id: 'cliente-todos', tipo: 'error',
    titulo: '“Todos” no es un cliente',
    cuerpo: 'Cuando le hablas a todos no le hablas a nadie: no sabes dónde buscarlos, ni qué decirles, ni ' +
      'qué les duele. Elegir un grupo no reduce tu mercado, reduce tu competencia. Es más fácil ser el ' +
      'favorito de 500 personas que el número 40 de un millón.',
    claves: ['todos', 'todo el mundo', 'cualquiera', 'publico en general', 'le vendo a todos'],
    sectores: ['*'], etapas: ['*'], relacionados: ['cliente-necesidad'], fuente: 'Principio de segmentación', revisado: HOY },

  { id: 'cliente-tres-perfiles', tipo: 'regla',
    titulo: 'Escribe tres perfiles, no uno',
    cuerpo: 'El primero que se te ocurre casi nunca es el que compra. Escribe tres personas distintas que ' +
      'podrían pagarte, con la situación concreta que las lleva a necesitarte, cuánto pagarían y dónde ' +
      'están. Después habla con las tres: una se caerá sola y otra te sorprenderá.',
    claves: ['perfiles', 'tres clientes', 'tipos de cliente', 'varios clientes'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['cliente-necesidad'], fuente: 'Exploración de segmentos en descubrimiento de clientes', revisado: HOY },

  { id: 'cliente-tres-filtros', tipo: 'criterio',
    titulo: 'Los tres filtros de un cliente que sirve',
    cuerpo: 'Uno: ¿siente el problema con urgencia o solo le parece simpático? Dos: ¿puedes encontrarlo, ' +
      'hay un lugar donde se junta? Tres: ¿puede y quiere pagar? Si falla cualquiera de los tres, no es ' +
      'tu primer cliente, aunque sea el que más te gustaría tener.',
    claves: ['filtros', 'buen cliente', 'sirve mi cliente', 'validar cliente'],
    sectores: ['*'], etapas: ['*'], relacionados: ['cliente-necesidad'], fuente: 'Criterios de atractivo de segmento', revisado: HOY },

  { id: 'cliente-vs-usuario', tipo: 'concepto',
    titulo: 'Quien usa no siempre es quien paga',
    cuerpo: 'En regalos, en productos para niños y en ventas a negocios, el que decide y el que disfruta ' +
      'son personas distintas. Tu mensaje tiene que convencer al que paga y emocionar al que lo usa. ' +
      'Si solo hablas del que lo usa, el que paga no encuentra su razón.',
    claves: ['regalo', 'quien paga', 'quien decide', 'usuario', 'comprador'],
    sectores: ['*'], etapas: ['*'], relacionados: ['cliente-necesidad'], fuente: 'Distinción comprador-usuario en decisión de compra', revisado: HOY },

  { id: 'cliente-donde', tipo: 'regla',
    titulo: 'Busca dónde ya se juntan, no dónde te gustaría',
    cuerpo: 'Grupos, ferias, talleres, salas de espera, comentarios de una publicación de otro. El lugar ' +
      'correcto es aquel donde puedes escuchar a diez personas de tu público en una hora sin conocer a ' +
      'nadie. Si tienes que rogar por atención, es el lugar equivocado.',
    claves: ['donde encuentro', 'donde estan', 'donde buscar clientes', 'conseguir clientes', 'lugar'],
    sectores: ['*'], etapas: ['*'], relacionados: ['canales-dos'], fuente: 'Acceso a segmentos en validación temprana', revisado: HOY },

  /* ==================================================================
     VALIDACIÓN
     ================================================================== */
  { id: 'validar-pasado', tipo: 'regla',
    titulo: 'Pregunta por el pasado, nunca por el futuro',
    cuerpo: '“¿Lo comprarías?” siempre da que sí, y ese sí no vale nada: la gente miente sin querer sobre ' +
      'lo que hará. Pregunta “¿cuándo fue la última vez que te pasó?”, “¿qué hiciste?”, “¿cuánto te ' +
      'costó?”. Los hechos del pasado son el único dato fiable que consigues gratis.',
    claves: ['validar', 'validacion', 'entrevista', 'preguntar', 'saber si funciona', 'probar mi idea'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['validar-compromiso', 'validar-elogio'],
    fuente: 'Entrevistas de descubrimiento orientadas a hechos', revisado: HOY },

  { id: 'validar-elogio', tipo: 'error',
    titulo: 'Un elogio no es una venta',
    cuerpo: '“Qué bonito”, “deberías venderlo”, “yo te compro uno” son gratis y por eso abundan. La única ' +
      'señal que cuenta es la que le cuesta algo a la otra persona: un anticipo, una fecha agendada, su ' +
      'teléfono para avisarle, un formulario lleno. Todo lo demás es ruido amable.',
    claves: ['me dijeron que si', 'les gusto', 'elogio', 'dicen que esta bonito', 'me felicitan'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['validar-compromiso'], fuente: 'Señales de compromiso frente a cumplidos', revisado: HOY },

  { id: 'validar-compromiso', tipo: 'regla',
    titulo: 'Pide algo que cueste',
    cuerpo: 'Convierte cada conversación buena en un compromiso pequeño: un apartado del 20%, una fecha en ' +
      'el calendario, su número para avisarle cuando esté. Si nadie te da nada de eso, no tienes clientes: ' +
      'tienes admiradores. Y los admiradores no pagan la renta.',
    claves: ['compromiso', 'anticipo', 'apartado', 'deposito', 'cerrar', 'que se comprometan'],
    sectores: ['*'], etapas: ['idea', 'starting', 'operating'], relacionados: ['validar-elogio', 'preventa'], fuente: 'Escala de compromiso en validación', revisado: HOY },

  { id: 'preventa', tipo: 'regla',
    titulo: 'Cobra antes de producir',
    cuerpo: 'La preventa es la validación que no miente: precio, plazo y cupo limitado, enviado a personas ' +
      'concretas. Si consigues tres anticipos, tienes negocio y dinero para el material. Si no consigues ' +
      'ninguno, acabas de ahorrarte semanas de producción y todo tu capital.',
    claves: ['preventa', 'vender antes', 'cobrar antes', 'sin inventario', 'pedido anticipado'],
    sectores: ['hechoamano', 'comida', 'digital'], etapas: ['idea', 'starting'], relacionados: ['validar-compromiso', 'inventario-error'],
    fuente: 'Validación por preventa', revisado: HOY },

  { id: 'muestra-diez', tipo: 'regla',
    titulo: 'Con menos de diez no hay dato',
    cuerpo: 'Si escribes a tres personas y nadie contesta, eso no significa nada: es lo normal. Necesitas ' +
      'al menos diez contactos para saber si el problema es el mensaje, el precio o el público. Antes de ' +
      'diez, cualquier conclusión es una corazonada disfrazada de aprendizaje.',
    claves: ['nadie responde', 'no me contestan', 'cuantas personas', 'muestra', 'no funciona'],
    sectores: ['*'], etapas: ['*'], relacionados: ['mensajes-personalizados'], fuente: 'Tamaño mínimo de muestra en pruebas cualitativas', revisado: HOY },

  { id: 'prueba-mas-barata', tipo: 'regla',
    titulo: 'Diseña la prueba más barata que te dé la respuesta',
    cuerpo: 'Antes de fabricar, pregúntate qué es lo mínimo que te diría si alguien pagaría: una ' +
      'publicación con precio, una lista de espera, un pedido a la medida, tres fotos de una muestra. ' +
      'Validar cuesta tiempo, no dinero. Producir para averiguarlo es la forma más cara de preguntar.',
    claves: ['prueba', 'experimento', 'mvp', 'minimo viable', 'como pruebo'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['preventa', 'inventario-error'], fuente: 'Diseño de experimentos de bajo costo', revisado: HOY },

  { id: 'pivote-cuando', tipo: 'criterio',
    titulo: 'Cuándo cambiar de idea y cuándo insistir',
    cuerpo: 'Cambia el mensaje si te entienden pero no les interesa. Cambia el público si les interesa ' +
      'pero no pueden pagar. Cambia la idea solo si tras hablar con veinte personas nadie ha gastado ' +
      'nunca nada en resolver ese problema. Insistir sin ninguna señal no es constancia: es terquedad cara.',
    claves: ['cambiar idea', 'pivote', 'no funciona', 'dejar', 'insistir', 'rendirme'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['validar-pasado'], fuente: 'Criterios de pivote en validación', revisado: HOY },

  /* ==================================================================
     OFERTA Y PROPUESTA DE VALOR
     ================================================================== */
  { id: 'propuesta-formula', tipo: 'regla',
    titulo: 'La fórmula de una propuesta que se entiende',
    cuerpo: 'Ayudo a [cliente concreto] a [resultado medible] mediante [lo que entregas], en [plazo], ' +
      'con [garantía], por [precio]. Si falta el plazo o el precio, el cliente tiene que preguntar, y en ' +
      'esa pregunta se cae la mitad de las ventas.',
    claves: ['propuesta de valor', 'oferta', 'mi oferta', 'como lo describo', 'que digo'],
    sectores: ['*'], etapas: ['*'], relacionados: ['oferta-resultado', 'oferta-garantia'], fuente: 'Estructura de oferta con elementos de decisión', revisado: HOY },

  { id: 'oferta-resultado', tipo: 'regla',
    titulo: 'No vendes el objeto: vendes lo que pasa después',
    cuerpo: 'Nadie compra una lámpara: compra que su sala se vea como quiere. Nadie compra un pastel: ' +
      'compra que la fiesta salga bien. Escribe qué consigue tu cliente, qué deja de sufrir o qué se ' +
      'ahorra. El producto es el medio; el resultado es lo que paga.',
    claves: ['beneficio', 'resultado', 'que vendo', 'caracteristicas', 'como lo explico'],
    sectores: ['*'], etapas: ['*'], relacionados: ['propuesta-formula'], fuente: 'Beneficios frente a características', revisado: HOY },

  { id: 'oferta-garantia', tipo: 'regla',
    titulo: 'La garantía quita el miedo que frena la primera compra',
    cuerpo: 'Quien no te conoce arriesga su dinero. Una garantía escrita —qué cubre, qué no, por cuánto ' +
      'tiempo y qué hace exactamente para reclamarla— convierte esa duda en una decisión fácil. Cuesta ' +
      'poco: casi nadie la usa, y quien la usa suele volver.',
    claves: ['garantia', 'devolucion', 'y si no le gusta', 'confianza', 'riesgo'],
    sectores: ['*'], etapas: ['*'], relacionados: ['propuesta-formula', 'confianza-proceso'], fuente: 'Reducción de riesgo percibido', revisado: HOY },

  { id: 'oferta-alcance', tipo: 'regla',
    titulo: 'El alcance escrito es lo que te salva de trabajar gratis',
    cuerpo: 'Escribe qué incluye, qué no incluye, cuántos cambios acepta y qué pasa si pide más. Sin eso, ' +
      'cada “¿y me puedes hacer también…?” sale de tu utilidad. Lo que quitas del alcance no se pierde: ' +
      'se vende aparte.',
    claves: ['alcance', 'que incluye', 'cambios', 'me pide mas', 'trabajo extra'],
    sectores: ['servicios', 'digital', 'hechoamano'], etapas: ['*'], relacionados: ['propuesta-formula'], fuente: 'Gestión de alcance en trabajo por encargo', revisado: HOY },

  { id: 'oferta-paquetes', tipo: 'regla',
    titulo: 'Tres opciones venden más que una',
    cuerpo: 'Con una sola opción, el cliente decide entre sí y no. Con tres, decide cuál. Arma una básica, ' +
      'una recomendada y una completa: la mayoría elige la de en medio, y la cara hace que la de en medio ' +
      'parezca razonable.',
    claves: ['paquetes', 'opciones', 'planes', 'tres precios', 'combos'],
    sectores: ['servicios', 'digital', 'hechoamano'], etapas: ['operating', 'growing'], relacionados: ['propuesta-formula'], fuente: 'Efecto de anclaje y decoy en menús de precio', revisado: HOY },

  /* ==================================================================
     VENTAS
     ================================================================== */
  { id: 'mensajes-personalizados', tipo: 'regla',
    titulo: 'La primera línea decide si te leen',
    cuerpo: 'Un mensaje que empieza hablando de ti se borra. Empieza con algo específico de esa persona: ' +
      'lo que publicó, lo que vende, lo que te contó alguien. Diez mensajes personalizados rinden más que ' +
      'cien copiados, y te llevan el mismo rato.',
    claves: ['mensaje', 'escribir a clientes', 'primer contacto', 'como contacto', 'whatsapp', 'dm'],
    sectores: ['*'], etapas: ['*'], relacionados: ['muestra-diez', 'seguimiento'], fuente: 'Tasa de respuesta en prospección personalizada', revisado: HOY },

  { id: 'diagnostico-antes', tipo: 'regla',
    titulo: 'Pregunta antes de cotizar',
    cuerpo: 'Cotizar sin preguntar es adivinar el precio y regalar margen. Cuatro preguntas bastan: qué ' +
      'necesita exactamente, para cuándo, qué ha probado antes y qué presupuesto tiene en mente. La ' +
      'última incomoda y es la que más tiempo te ahorra.',
    claves: ['cotizar', 'cotizacion', 'presupuesto', 'me piden precio', 'antes de vender'],
    sectores: ['servicios', 'digital', 'hechoamano'], etapas: ['*'], relacionados: ['cotizacion-plazo'], fuente: 'Venta consultiva: diagnóstico previo', revisado: HOY },

  { id: 'cotizacion-plazo', tipo: 'regla',
    titulo: 'Una cotización sin fecha espera para siempre',
    cuerpo: 'Toda cotización lleva precio, qué incluye, plazo de entrega y hasta cuándo es válida. La ' +
      'fecha de vencimiento no es agresiva: es lo que convierte un “lo voy a pensar” en una decisión. ' +
      'Sin ella, tu cotización vive para siempre en un chat sin respuesta.',
    claves: ['cotizacion', 'presupuesto escrito', 'vigencia', 'validez', 'mandar precio'],
    sectores: ['*'], etapas: ['*'], relacionados: ['diagnostico-antes', 'seguimiento'], fuente: 'Elementos de una cotización que cierra', revisado: HOY },

  { id: 'objecion-precio', tipo: 'regla',
    titulo: '“Está caro” casi nunca es sobre el precio',
    cuerpo: 'Significa que todavía no ve por qué vale eso. No bajes: pregunta “¿comparado con qué?”. La ' +
      'respuesta te dice si compite contigo otro proveedor, una solución casera o no hacer nada. Cada una ' +
      'se responde distinto, y ninguna se responde con un descuento.',
    claves: ['esta caro', 'objecion', 'muy caro', 'no tengo dinero', 'me regatean'],
    sectores: ['*'], etapas: ['*'], relacionados: ['descuentos-regla', 'subir-precio'], fuente: 'Manejo de objeciones por valor percibido', revisado: HOY },

  { id: 'objecion-pensarlo', tipo: 'regla',
    titulo: '“Lo voy a pensar” es una duda sin nombre',
    cuerpo: 'Casi nadie lo piensa: lo olvida. Responde “claro, ¿qué parte te genera más duda: el precio, ' +
      'el tiempo o si va a quedar como lo imaginas?”. Nombrar la duda la vuelve resoluble. Y si de verdad ' +
      'quiere pensarlo, acuerda cuándo le escribes.',
    claves: ['lo voy a pensar', 'me dijo que despues', 'no me contesto', 'lo pienso'],
    sectores: ['*'], etapas: ['*'], relacionados: ['seguimiento'], fuente: 'Manejo de aplazamiento en cierre', revisado: HOY },

  { id: 'seguimiento', tipo: 'error',
    titulo: 'Las ventas perdidas casi nunca dijeron que no',
    cuerpo: 'Se olvidaron, y tú también. Anota a cada persona que preguntó, en qué estado quedó y cuándo ' +
      'le vuelves a escribir. Un cuaderno basta. El segundo mensaje, tres días después, cierra más ventas ' +
      'que cualquier técnica de cierre.',
    claves: ['seguimiento', 'no me compraron', 'se enfriaron', 'perdi la venta', 'volver a escribir'],
    sectores: ['*'], etapas: ['*'], relacionados: ['objecion-pensarlo'], fuente: 'Impacto del seguimiento en tasa de cierre', revisado: HOY },

  { id: 'referidos-pedir', tipo: 'regla',
    titulo: 'Pide el referido en el momento de la alegría',
    cuerpo: 'Justo cuando el cliente recibe lo que pidió y está contento es cuando pedir funciona. Y ' +
      'píde­lo concreto: “¿conoces a alguien más que esté decorando ahorita?” consigue nombres; ' +
      '“recomiéndame” no consigue nada.',
    claves: ['referidos', 'recomendacion', 'boca a boca', 'que me recomienden'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['resenas-especificas'], fuente: 'Momento óptimo de solicitud de referidos', revisado: HOY },

  /* ==================================================================
     MARKETING Y CANALES
     ================================================================== */
  { id: 'canales-dos', tipo: 'regla',
    titulo: 'Dos canales bien, no cinco a medias',
    cuerpo: 'Con veinte minutos al día no alcanza para estar en todas partes. Elige los dos lugares donde ' +
      'de verdad encuentras a tu cliente, define una acción semanal para cada uno y descarta el resto sin ' +
      'culpa. Estar en cinco redes con una publicación al mes es no estar en ninguna.',
    claves: ['canales', 'redes sociales', 'donde publico', 'instagram', 'facebook', 'tiktok', 'marketing'],
    sectores: ['*'], etapas: ['*'], relacionados: ['cliente-donde', 'contenido-bloque'], fuente: 'Concentración de esfuerzo en canales', revisado: HOY },

  { id: 'contenido-bloque', tipo: 'regla',
    titulo: 'Graba en bloque o no vas a sostenerlo',
    cuerpo: 'La constancia no se consigue con disciplina diaria, se consigue con una sesión de dos horas ' +
      'que produce el contenido de tres semanas. Uno del proceso, uno respondiendo la duda más común, uno ' +
      'mostrando el resultado. Publicar poco pero siempre gana a publicar mucho y desaparecer.',
    claves: ['contenido', 'videos', 'publicar', 'constancia', 'no tengo tiempo de publicar'],
    sectores: ['*'], etapas: ['*'], relacionados: ['canales-dos'], fuente: 'Producción por lotes de contenido', revisado: HOY },

  { id: 'confianza-proceso', tipo: 'regla',
    titulo: 'Mostrar cómo lo haces vende más que decir que es bueno',
    cuerpo: 'La gente compra a quien ya vio trabajar. El proceso por dentro, el antes y el después, el ' +
      'error que corregiste: todo eso construye confianza sin pedir nada. Vender es la consecuencia, no ' +
      'el mensaje.',
    claves: ['confianza', 'no me conocen', 'como genero confianza', 'proceso', 'detras de camaras'],
    sectores: ['hechoamano', 'comida', 'servicios'], etapas: ['*'], relacionados: ['resenas-especificas'], fuente: 'Prueba de proceso como señal de calidad', revisado: HOY },

  { id: 'resenas-especificas', tipo: 'regla',
    titulo: 'Una reseña específica vende; “excelente servicio” no',
    cuerpo: 'Pídelas con una pregunta concreta: “¿qué te resolvió?” o “¿qué casi te hace no comprarlo?”. ' +
      'Esa segunda pregunta te da la objeción real de tus futuros clientes, y la respuesta suele ser el ' +
      'mejor texto de venta que vas a escribir.',
    claves: ['resenas', 'opiniones', 'testimonios', 'valoraciones', 'comentarios'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['referidos-pedir', 'confianza-proceso'], fuente: 'Especificidad en prueba social', revisado: HOY },

  { id: 'publicidad-despues', tipo: 'error',
    titulo: 'Pagar anuncios antes de saber vender quema dinero',
    cuerpo: 'La publicidad multiplica lo que ya funciona; si nada funciona, multiplica cero. Antes de ' +
      'pagar, comprueba que puedes vender a mano: si de diez mensajes personales no cierras ninguno, el ' +
      'anuncio no va a arreglarlo, solo va a hacerlo más caro.',
    claves: ['publicidad', 'anuncios', 'pagar publicidad', 'ads', 'promocionar', 'invertir en marketing'],
    sectores: ['*'], etapas: ['*'], relacionados: ['cac-regla', 'muestra-diez'], fuente: 'Precondiciones para inversión en adquisición', revisado: HOY },

  { id: 'cac-regla', tipo: 'regla',
    titulo: 'Lo que te cuesta un cliente contra lo que te deja',
    cuerpo: 'Divide lo que invertiste entre los clientes que conseguiste: ese es tu costo por cliente. Es ' +
      'sano si es menos de la mitad de lo que te deja ese cliente. Si te cuesta más de lo que te deja, ' +
      'cada venta te está costando dinero y vender más solo acelera el problema.',
    claves: ['cac', 'costo por cliente', 'cuanto invierto', 'rentabilidad publicidad'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['publicidad-despues', 'margen-sano'], fuente: 'Relación CAC frente a margen de contribución', revisado: HOY },

  { id: 'recompra', tipo: 'regla',
    titulo: 'Venderle otra vez a quien ya te compró es lo más barato que hay',
    cuerpo: 'Ya te conoce, ya confió y ya sabe que cumples. Un complemento, un mantenimiento, una versión ' +
      'más grande o simplemente escribirle a los tres meses cuesta una fracción de conseguir a alguien ' +
      'nuevo. Casi nadie lo hace, y es la venta más fácil del mes.',
    claves: ['recompra', 'volver a vender', 'clientes anteriores', 'reactivar', 'complemento'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['referidos-pedir'], fuente: 'Costo relativo de retención frente a adquisición', revisado: HOY },

  /* ==================================================================
     NÚMEROS Y ADMINISTRACIÓN
     ================================================================== */
  { id: 'separar-dinero', tipo: 'regla',
    titulo: 'Separa el dinero del negocio del tuyo',
    cuerpo: 'Mientras estén juntos no sabes si ganas o pierdes: parece que hay dinero y en realidad es el ' +
      'de la renta. Una cuenta aparte, o un sobre, basta para empezar. Es el cambio más pequeño que más ' +
      'claridad da.',
    claves: ['separar', 'cuenta', 'mezclo el dinero', 'dinero personal', 'no se cuanto gano'],
    sectores: ['*'], etapas: ['*'], relacionados: ['sueldo-propio', 'registro-simple'], fuente: 'Separación patrimonial en microempresa', revisado: HOY },

  { id: 'sueldo-propio', tipo: 'regla',
    titulo: 'Págate un sueldo, aunque sea pequeño',
    cuerpo: 'Si no te pagas, el negocio parece rentable porque estás subsidiándolo con tu trabajo gratis. ' +
      'Define cuánto y qué día, y trátalo como un gasto fijo más. El día que no alcance, te enteras a ' +
      'tiempo en vez de descubrirlo un año después.',
    claves: ['sueldo', 'pagarme', 'cuanto me llevo', 'retiro', 'mi salario'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['separar-dinero', 'precio-olvida-tiempo'], fuente: 'Costo de oportunidad del trabajo del dueño', revisado: HOY },

  { id: 'flujo-vs-utilidad', tipo: 'concepto',
    titulo: 'Ganar y tener dinero no son lo mismo',
    cuerpo: 'Puedes cerrar el mes con utilidad y no tener con qué comprar material, porque te pagan a 30 ' +
      'días y el proveedor cobra hoy. Los negocios pequeños quiebran por falta de efectivo, no por falta ' +
      'de ventas. Haz un calendario de qué entra y qué sale, con fechas.',
    claves: ['flujo', 'efectivo', 'no tengo dinero', 'me pagan despues', 'liquidez', 'credito'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['registro-simple'], fuente: 'Distinción utilidad contable frente a flujo de caja', revisado: HOY },

  { id: 'registro-simple', tipo: 'regla',
    titulo: 'Un cuaderno bien llevado gana a un sistema abandonado',
    cuerpo: 'Anota cada venta y cada gasto con fecha y concepto. Nada más. En treinta días sabrás tu ' +
      'ticket promedio, tu mes real y qué gasto se te estaba escapando. El formato da igual; lo que ' +
      'importa es que no falte ningún día.',
    claves: ['registro', 'contabilidad', 'anotar', 'llevar cuentas', 'excel', 'control'],
    sectores: ['*'], etapas: ['*'], relacionados: ['flujo-vs-utilidad', 'tablero-cinco'], fuente: 'Registro mínimo viable de operaciones', revisado: HOY },

  { id: 'ticket-promedio', tipo: 'concepto',
    titulo: 'Subir el ticket es más fácil que conseguir más clientes',
    cuerpo: 'Tu ticket promedio son tus ingresos entre el número de ventas. Subirlo un 20% con un ' +
      'complemento, un paquete o una versión mejor no requiere ni un cliente nuevo ni un peso de ' +
      'publicidad. Conseguir 20% más clientes sí.',
    claves: ['ticket', 'venta promedio', 'vender mas caro', 'aumentar ingresos'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['oferta-paquetes', 'recompra'], fuente: 'Palancas de crecimiento de ingreso', revisado: HOY },

  { id: 'inventario-error', tipo: 'error',
    titulo: 'El inventario es dinero congelado',
    cuerpo: 'Producir de más para “estar listo” convierte tu efectivo en cajas. Calcula tu punto de ' +
      'reorden: lo que consumes por semana por las semanas que tarda tu proveedor, más una semana de ' +
      'colchón. Pide cuando llegues a ese número, ni antes ni después.',
    claves: ['inventario', 'stock', 'material', 'cuanto compro', 'reorden', 'proveedor'],
    sectores: ['hechoamano', 'comida', 'reventa'], etapas: ['operating', 'growing'], relacionados: ['flujo-vs-utilidad', 'prueba-mas-barata'], fuente: 'Punto de reorden con tiempo de entrega', revisado: HOY },

  { id: 'tablero-cinco', tipo: 'regla',
    titulo: 'Cinco números, el mismo día de cada semana',
    cuerpo: 'Unidades vendidas, ingresos, gastos, personas nuevas que preguntaron y margen por unidad. ' +
      'Revisados cada lunes valen más que un reporte perfecto una vez al año. Lo que se mide seguido es ' +
      'lo único que se corrige a tiempo.',
    claves: ['indicadores', 'metricas', 'tablero', 'que mido', 'kpi', 'seguimiento de numeros'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['registro-simple'], fuente: 'Cuadro de mando mínimo', revisado: HOY },

  /* ==================================================================
     PROCESOS Y CRECIMIENTO
     ================================================================== */
  { id: 'documentar-proceso', tipo: 'regla',
    titulo: 'Si no está escrito, no se puede delegar',
    cuerpo: 'Escribe tu proceso más repetido paso a paso, cada uno empezando por un verbo y con su tiempo. ' +
      'No es burocracia: es lo que permite que el pedido cincuenta salga igual que el primero, y lo que ' +
      'hace posible que otra persona lo haga sin ti al lado.',
    claves: ['proceso', 'documentar', 'como lo hago', 'pasos', 'manual', 'sistematizar'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['delegar-primero', 'plantillas-tres'], fuente: 'Documentación de procedimientos operativos', revisado: HOY },

  { id: 'plantillas-tres', tipo: 'regla',
    titulo: 'Tres plantillas te devuelven horas cada semana',
    cuerpo: 'La cotización, el mensaje de primer contacto y el de seguimiento. Escribirlos de cero cada ' +
      'vez es donde se va tu tiempo sin que lo notes. Escríbelos una vez, guárdalos y personaliza solo ' +
      'la primera línea.',
    claves: ['plantillas', 'formatos', 'repetir', 'automatizar', 'ahorrar tiempo'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['documentar-proceso', 'mensajes-personalizados'], fuente: 'Estandarización de comunicaciones frecuentes', revisado: HOY },

  { id: 'delegar-primero', tipo: 'regla',
    titulo: 'Delega lo repetitivo, no lo que más te cuesta',
    cuerpo: 'Lo primero que se delega es lo que se repite y vale poco por hora: empacar, agendar, ' +
      'contestar lo mismo. Eso libera las horas que sí venden. Delegar primero lo difícil sale mal casi ' +
      'siempre, porque ni tú lo tienes escrito.',
    claves: ['delegar', 'contratar', 'ayudante', 'no me da la vida', 'solo no puedo'],
    sectores: ['*'], etapas: ['growing'], relacionados: ['documentar-proceso', 'contratar-paga'], fuente: 'Criterio de priorización en delegación', revisado: HOY },

  { id: 'contratar-paga', tipo: 'criterio',
    titulo: 'Una contratación que no se paga sola en 60 días es deuda',
    cuerpo: 'Antes de contratar, calcula cuántas ventas extra al mes cubren ese costo y si de verdad esa ' +
      'persona las hace posibles. Si el número no sale con supuestos conservadores, todavía no es el ' +
      'momento: es una apuesta, no una inversión.',
    claves: ['contratar', 'empleado', 'sueldo empleado', 'cuando contratar', 'equipo'],
    sectores: ['*'], etapas: ['growing'], relacionados: ['delegar-primero', 'punto-equilibrio'], fuente: 'Retorno de la primera contratación', revisado: HOY },

  { id: 'cuello-botella', tipo: 'diagnostico',
    titulo: 'Antes de escalar, encuentra qué te frena',
    cuerpo: 'Pregúntate qué pasaría mañana si te llegaran el doble de pedidos. Lo primero que se rompe es ' +
      'tu cuello de botella: tus horas, tu capacidad de producción, tu material o tu flujo de clientes. ' +
      'Escalar sin arreglarlo solo multiplica el cansancio.',
    claves: ['escalar', 'crecer', 'el doble', 'no doy abasto', 'saturado', 'cuello de botella'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['delegar-primero', 'margen-sano'], fuente: 'Identificación de restricción del sistema', revisado: HOY },

  { id: 'reinversion-regla', tipo: 'regla',
    titulo: 'Decide de antemano qué porcentaje reinviertes',
    cuerpo: 'Sin una regla escrita, la utilidad se gasta sola y el negocio no crece. Define el porcentaje ' +
      'que vuelve al negocio y el que te llevas tú, y respétalo los meses buenos, que es cuando cuesta.',
    claves: ['reinvertir', 'que hago con las ganancias', 'crecer con lo que gano', 'reinversion'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['sueldo-propio'], fuente: 'Política de reinversión', revisado: HOY },

  /* ==================================================================
     ERRORES DE ARRANQUE
     ================================================================== */
  { id: 'producir-antes', tipo: 'error',
    titulo: 'Producir antes de validar es el error más caro y más común',
    cuerpo: 'Fabricar doscientas unidades para “estar listo” gasta todo tu capital antes de saber si ' +
      'alguien lo quiere, y encima te obliga a defender esa decisión. En descubrimiento tu recurso es el ' +
      'tiempo, no el dinero.',
    claves: ['producir', 'inventario inicial', 'cuanto hago', 'primer lote', 'invertir al inicio'],
    sectores: ['hechoamano', 'comida', 'reventa'], etapas: ['idea', 'starting'], relacionados: ['prueba-mas-barata', 'preventa'], fuente: 'Error de sobreinversión temprana', revisado: HOY },

  { id: 'marca-despues', tipo: 'error',
    titulo: 'El logo no es el principio',
    cuerpo: 'Nombre, logo y tarjetas se sienten productivos y no enseñan nada del mercado. Puedes vender ' +
      'perfectamente sin logo; no puedes vender sin saber a quién y por qué. La identidad se construye ' +
      'mejor cuando ya tienes tres clientes que te expliquen qué valoran.',
    claves: ['logo', 'marca', 'nombre', 'identidad', 'diseño', 'redes primero'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['producir-antes'], fuente: 'Secuencia de prioridades en arranque', revisado: HOY },

  { id: 'gastar-utilidad', tipo: 'error',
    titulo: 'La utilidad del mes no es tu dinero disponible',
    cuerpo: 'Antes de gastarla hay que reponer material, cubrir los fijos del mes siguiente y guardar para ' +
      'lo que se descomponga. Lo que quede después es lo tuyo. Confundirlos es el motivo más común de ' +
      'quedarse sin efectivo con las ventas subiendo.',
    claves: ['ganancias', 'gastar', 'ya gane', 'utilidad del mes'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['flujo-vs-utilidad', 'reinversion-regla'], fuente: 'Gestión de capital de trabajo', revisado: HOY },

  { id: 'formalizar-cuando', tipo: 'concepto',
    titulo: 'Formalizarse tarde cierra puertas',
    cuerpo: 'Los clientes que mejor pagan suelen necesitar factura. No hace falta hacerlo el primer día, ' +
      'pero sí antes de que un buen cliente se caiga por eso. Los trámites cambian por país: confirma el ' +
      'tuyo con un contador local antes de decidir.',
    claves: ['facturar', 'formalizar', 'sat', 'impuestos', 'legal', 'registrar negocio', 'rfc'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: [], fuente: 'Requisitos de facturación varían por jurisdicción', revisado: HOY },

  /* ==================================================================
     EJEMPLOS POR SECTOR
     ================================================================== */
  { id: 'ej-3d-repuestos', tipo: 'ejemplo',
    titulo: 'De figuras decorativas a repuestos',
    cuerpo: 'Un taller de impresión 3D vendía figuras y casi no vendía. Un cliente pidió una pieza para su ' +
      'lavadora porque el repuesto ya no se fabricaba. En dos meses, las piezas descontinuadas eran el 70% ' +
      'de sus ingresos: el problema valía mucho más que la idea bonita.',
    claves: ['3d', 'impresion', 'figuras', 'repuestos', 'piezas'],
    sectores: ['hechoamano'], etapas: ['*'], relacionados: ['cliente-necesidad'], fuente: 'Caso de reposicionamiento por demanda observada', revisado: HOY },

  { id: 'ej-3d-costo', tipo: 'ejemplo',
    titulo: 'Lo que de verdad cuesta una pieza impresa',
    cuerpo: 'Filamento, energía de las horas de impresión, un 15% por fallos y recalibraciones, tus ' +
      'minutos de preparación y post-proceso, y el empaque. La mayoría cuenta solo el filamento y se ' +
      'sorprende de no ganar: el filamento suele ser menos de un tercio del costo real.',
    claves: ['3d', 'filamento', 'costo impresion', 'cuanto cuesta imprimir'],
    sectores: ['hechoamano'], etapas: ['*'], relacionados: ['precio-olvida-tiempo', 'merma-15'], fuente: 'Estructura de costos en impresión 3D de escritorio', revisado: HOY },

  { id: 'ej-reposteria-domingo', tipo: 'ejemplo',
    titulo: 'Dos panaderías, una sobrevive',
    cuerpo: 'Ana abrió porque le encanta hornear. Beto abrió porque notó que en su colonia no había dónde ' +
      'comprar un pastel de última hora un domingo. Un año después Beto vende el triple vendiendo lo ' +
      'mismo: resolvía algo distinto.',
    claves: ['pastel', 'reposteria', 'panaderia', 'postres'],
    sectores: ['comida'], etapas: ['*'], relacionados: ['cliente-necesidad'], fuente: 'Caso ilustrativo de problema frente a producto', revisado: HOY },

  { id: 'ej-comida-merma', tipo: 'ejemplo',
    titulo: 'En comida, la merma decide el margen',
    cuerpo: 'Lo que no se vende hoy a veces no se puede vender mañana. Por eso los pedidos por encargo ' +
      'ganan a la producción por si acaso: cobras antes, compras justo y tu merma tiende a cero. Empieza ' +
      'por encargo y pasa a mostrador cuando ya conozcas la demanda de cada día.',
    claves: ['comida', 'caduca', 'se echa a perder', 'sobra', 'por encargo'],
    sectores: ['comida'], etapas: ['*'], relacionados: ['merma-15', 'preventa'], fuente: 'Gestión de perecederos en microempresa alimentaria', revisado: HOY },

  { id: 'ej-servicios-hora', tipo: 'ejemplo',
    titulo: 'En servicios no vendes horas: vendes un resultado',
    cuerpo: 'Cobrar por hora castiga tu experiencia: mientras más rápido resuelves, menos cobras. Cobra ' +
      'por el trabajo completo con alcance escrito. El cliente compra la casa limpia o el equipo ' +
      'funcionando, no el tiempo que te llevó.',
    claves: ['servicios', 'por hora', 'cobrar servicio', 'limpieza', 'reparacion'],
    sectores: ['servicios'], etapas: ['*'], relacionados: ['oferta-alcance', 'oferta-resultado'], fuente: 'Precio por valor frente a precio por tiempo', revisado: HOY },

  { id: 'ej-servicios-agenda', tipo: 'ejemplo',
    titulo: 'Tu inventario es tu agenda',
    cuerpo: 'Una hora vacía no se guarda para mañana: se pierde. Por eso confirmar la cita el día antes ' +
      'y cobrar un anticipo por reservar valen más que cualquier campaña. Cada falta sin avisar es una ' +
      'hora de ingreso que no vuelve.',
    claves: ['citas', 'agenda', 'no llego', 'cancelacion', 'reserva'],
    sectores: ['servicios'], etapas: ['*'], relacionados: ['validar-compromiso'], fuente: 'Gestión de capacidad en servicios por cita', revisado: HOY },

  { id: 'ej-digital-alcance', tipo: 'ejemplo',
    titulo: 'En digital, el alcance sin límite se come el proyecto',
    cuerpo: 'Sin número de revisiones escrito, un trabajo de dos semanas se vuelve de dos meses por ' +
      '“cambios pequeños”. Define cuántas rondas incluye y qué cuesta una extra. No es rigidez: es lo ' +
      'que hace que puedas cotizar el siguiente proyecto con confianza.',
    claves: ['digital', 'diseño', 'revisiones', 'cambios', 'proyecto', 'freelance'],
    sectores: ['digital'], etapas: ['*'], relacionados: ['oferta-alcance'], fuente: 'Control de alcance en proyectos creativos', revisado: HOY },

  { id: 'ej-digital-recurrente', tipo: 'ejemplo',
    titulo: 'Un cliente al mes vale más que diez de una vez',
    cuerpo: 'Lo digital permite algo que casi ningún oficio permite: cobrar todos los meses por mantener ' +
      'lo que ya construiste. Convierte cada entrega en un servicio continuo, aunque sea pequeño. Tres ' +
      'clientes recurrentes dan más tranquilidad que quince proyectos sueltos.',
    claves: ['digital', 'mensualidad', 'recurrente', 'suscripcion', 'mantenimiento'],
    sectores: ['digital'], etapas: ['operating', 'growing'], relacionados: ['recompra'], fuente: 'Ingreso recurrente en servicios profesionales', revisado: HOY },

  { id: 'ej-reventa-rotacion', tipo: 'ejemplo',
    titulo: 'En reventa manda la rotación, no el margen',
    cuerpo: 'Un producto con 30% de margen que se vende cada semana deja más al año que uno con 60% que ' +
      'sale una vez al mes. Mide cuántas veces al mes se vende cada cosa y deja de comprar lo que lleva ' +
      'noventa días parado, aunque te encante.',
    claves: ['reventa', 'rotacion', 'que compro', 'no se vende', 'stock parado'],
    sectores: ['reventa'], etapas: ['*'], relacionados: ['inventario-error', 'margen-sano'], fuente: 'Rotación de inventario frente a margen unitario', revisado: HOY },

  { id: 'ej-reventa-diferencia', tipo: 'ejemplo',
    titulo: 'Si vendes lo mismo que todos, tu única arma es el servicio',
    cuerpo: 'En reventa el producto no te diferencia: cualquiera consigue el mismo. Lo que te diferencia ' +
      'es entregar más rápido, asesorar mejor o resolver una devolución sin pelear. Ahí es donde puedes ' +
      'cobrar un poco más y que te lo paguen.',
    claves: ['reventa', 'igual que otros', 'competencia', 'diferenciarme'],
    sectores: ['reventa'], etapas: ['*'], relacionados: ['precio-barato-senal'], fuente: 'Diferenciación en categorías no diferenciadas', revisado: HOY },

  /* ==================================================================
     DIAGNÓSTICOS
     ================================================================== */
  { id: 'diag-no-vendo', tipo: 'diagnostico',
    titulo: 'Si no vendes, el problema está en uno de tres sitios',
    cuerpo: 'Uno: no llegas a suficiente gente, y se arregla con volumen de contactos. Dos: llegas pero no ' +
      'te entienden, y se arregla con el mensaje. Tres: te entienden pero no les urge, y se arregla ' +
      'cambiando de público. Cuenta cuántos contactaste y cuántos respondieron: el número te dice cuál es.',
    claves: ['no vendo', 'no me compran', 'sin ventas', 'que hago mal', 'no funciona mi negocio'],
    sectores: ['*'], etapas: ['*'], relacionados: ['muestra-diez', 'cliente-necesidad'], fuente: 'Diagnóstico por embudo', revisado: HOY },

  { id: 'diag-vendo-no-gano', tipo: 'diagnostico',
    titulo: 'Si vendes y no ganas, es el precio o el costo',
    cuerpo: 'Calcula tu margen por unidad. Si es menor al 40%, el precio está bajo o el costo está mal ' +
      'medido, casi siempre por no contar tu tiempo. Vender más con margen malo solo multiplica el ' +
      'cansancio. Arregla el número antes de buscar un cliente más.',
    claves: ['vendo pero no gano', 'trabajo mucho', 'no me alcanza', 'gano poco'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['margen-sano', 'precio-olvida-tiempo'], fuente: 'Diagnóstico de rentabilidad unitaria', revisado: HOY },

  { id: 'diag-no-tiempo', tipo: 'diagnostico',
    titulo: 'Si no te da la vida, mira qué hora vale menos',
    cuerpo: 'Anota una semana en qué se te va el tiempo y separa lo que produce ingresos de lo que solo ' +
      'mantiene la operación. Lo segundo es lo que se delega, se automatiza con plantillas o simplemente ' +
      'se deja de hacer. La mayoría descubre que vende dos horas al día y administra seis.',
    claves: ['no tengo tiempo', 'saturado', 'hago todo', 'no me alcanza el dia'],
    sectores: ['*'], etapas: ['operating', 'growing'], relacionados: ['delegar-primero', 'plantillas-tres'], fuente: 'Auditoría de uso del tiempo', revisado: HOY },

  { id: 'diag-empezar', tipo: 'diagnostico',
    titulo: 'Si no sabes por dónde empezar, empieza por escuchar',
    cuerpo: 'No hace falta idea para arrancar: hace falta un problema. Durante una semana anota tres ' +
      'quejas al día de la gente a tu alrededor, con sus palabras. Al séptimo día tendrás veintiuna, y ' +
      'dos o tres se repetirán. Ahí está tu punto de partida.',
    claves: ['no se que negocio', 'no tengo idea', 'por donde empiezo', 'quiero emprender'],
    sectores: ['*'], etapas: ['idea'], relacionados: ['validar-pasado', 'cliente-necesidad'], fuente: 'Descubrimiento de oportunidades por observación', revisado: HOY },

  { id: 'diag-miedo', tipo: 'diagnostico',
    titulo: 'El miedo a vender se cura vendiendo barato el riesgo',
    cuerpo: 'Casi siempre es miedo al rechazo, no a vender. Baja la apuesta: en vez de ofrecer, pregunta. ' +
      '“¿Te ha pasado que…?” no se puede rechazar. Después de diez conversaciones así, ofrecer deja de ' +
      'dar miedo porque ya sabes que a la gente le interesa el tema.',
    claves: ['miedo', 'pena', 'vergüenza', 'no me atrevo', 'me da nervios vender'],
    sectores: ['*'], etapas: ['idea', 'starting'], relacionados: ['validar-pasado'], fuente: 'Exposición gradual en desarrollo de habilidad comercial', revisado: HOY },

  /* ==================================================================
     CRITERIOS DE EVALUACIÓN
     ================================================================== */
  { id: 'crit-oferta', tipo: 'criterio',
    titulo: 'Cómo se revisa una propuesta de valor',
    cuerpo: 'Cinco cosas: nombra a un cliente concreto y no a “todos”; promete un resultado y no un ' +
      'objeto; incluye precio; incluye plazo; y no usa palabras vacías como calidad, excelente o el ' +
      'mejor. Cumplir cuatro de cinco ya la hace utilizable con clientes reales.',
    claves: ['evaluar oferta', 'revisar propuesta', 'esta bien mi oferta', 'califica'],
    sectores: ['*'], etapas: ['*'], relacionados: ['propuesta-formula'], fuente: 'Rúbrica de propuesta de valor', revisado: HOY },

  { id: 'crit-meta', tipo: 'criterio',
    titulo: 'Una meta sin número ni fecha es un deseo',
    cuerpo: '“Crecer” no se puede medir; “treinta pedidos antes del 30 de noviembre” sí. Y las acciones ' +
      'que la sostienen tienen que depender de ti: “publicar tres veces por semana” depende de ti, ' +
      '“volverme viral” no.',
    claves: ['meta', 'objetivo', 'plan de 90 dias', 'como me pongo metas'],
    sectores: ['*'], etapas: ['*'], relacionados: ['tablero-cinco'], fuente: 'Criterios de meta medible y accionable', revisado: HOY },

  { id: 'crit-desafio', tipo: 'criterio',
    titulo: 'Un buen desafío se hace hoy y tiene un número',
    cuerpo: 'Si no se puede empezar en las próximas dos horas, no es un desafío: es un proyecto. Si no ' +
      'lleva una cantidad —tres personas, diez mensajes, cinco quejas— no se puede saber si se cumplió. ' +
      'Concreto, contable y de hoy.',
    claves: ['desafio', 'reto', 'tarea', 'que hago hoy'],
    sectores: ['*'], etapas: ['*'], relacionados: ['crit-meta'], fuente: 'Diseño de tareas accionables', revisado: HOY }
  ];

  /* ==================================================================
     ÍNDICE INVERTIDO

     Se construye una vez al cargar. Con este tamaño de base, buscar es
     instantáneo y no hace falta ni IndexedDB ni embeddings: eso solo se
     justifica cuando el usuario pregunte con palabras que no están en
     ninguna clave.
     ================================================================== */

  var VACIAS = ('de la el los las un una unos unas y o que en a al del mi mis tu tus su sus se por para ' +
    'con sin es son lo me te le como mas muy si no ya pero porque esto esta este ser hay sobre desde ' +
    'cuando donde cual quien tiene tengo hacer').split(' ');

  function normalizar(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[¿?¡!.,;:()"'“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function esVacia(w2) { return VACIAS.indexOf(w2) >= 0; }

  /** Raíz burda de cuatro letras: "vender", "vendo", "vendes" y "venta"
      comparten prefijo, y eso basta sin arrastrar un lematizador. */
  function raices(texto) {
    var out = {}, ws = normalizar(texto).split(' ');
    for (var i = 0; i < ws.length; i++) {
      if (ws[i].length >= 4 && !esVacia(ws[i])) out[ws[i].slice(0, 4)] = true;
    }
    return out;
  }

  var INDICE = {};   // raíz -> [ids]  (título y cuerpo)
  var CLAVES = {};   // raíz -> [ids]  (solo `claves`)

  /* Se indexa dos veces a propósito. Las `claves` son las palabras con las que
     alguien preguntaría por el tema; el cuerpo es donde el tema se explica.
     Pesarlos igual hacía que una entrada sobre el logo ganara a una sobre
     canales solo porque mencionaba "redes" de pasada. */
  (function construir() {
    function meter(mapa, raiz, id) {
      if (!mapa[raiz]) mapa[raiz] = [];
      if (mapa[raiz].indexOf(id) < 0) mapa[raiz].push(id);
    }
    for (var i = 0; i < ENTRADAS.length; i++) {
      var e = ENTRADAS[i], r;
      var rsCuerpo = raices(e.titulo + ' ' + e.cuerpo);
      for (r in rsCuerpo) if (Object.prototype.hasOwnProperty.call(rsCuerpo, r)) meter(INDICE, r, e.id);
      var rsClaves = raices(e.claves.join(' '));
      for (r in rsClaves) if (Object.prototype.hasOwnProperty.call(rsClaves, r)) meter(CLAVES, r, e.id);
    }
  })();

  function porId(id) {
    for (var i = 0; i < ENTRADAS.length; i++) if (ENTRADAS[i].id === id) return ENTRADAS[i];
    return null;
  }

  function coincide(lista, valor) {
    if (!lista || !lista.length) return true;
    if (lista.indexOf('*') >= 0) return true;
    if (!valor) return true;             // sin dato del usuario, no se filtra
    return lista.indexOf(valor) >= 0;
  }

  /** Devuelve las entradas más relevantes para un texto, filtradas por el
      sector y la etapa del usuario. Nunca devuelve la base entera. */
  function buscar(texto, filtro, limite) {
    filtro = filtro || {};
    limite = limite || 4;

    var rs = raices(texto);
    var puntos = {};

    function sumar(mapa, factor) {
      for (var r in rs) {
        if (!Object.prototype.hasOwnProperty.call(rs, r)) continue;
        var ids = mapa[r];
        if (!ids) continue;
        // Una raíz que aparece en media base no distingue nada: pesa menos.
        var peso = factor / Math.log(2 + ids.length);
        for (var i = 0; i < ids.length; i++) {
          puntos[ids[i]] = (puntos[ids[i]] || 0) + peso;
        }
      }
    }
    sumar(CLAVES, 3);    // coincidir con una clave es una señal fuerte
    sumar(INDICE, 1);    // aparecer en el texto, una señal débil

    /* Una clave de varias palabras que aparece entera en la frase es la señal
       más fiable que existe: "no sé qué negocio poner" contiene literalmente
       "no se que negocio". Por raíces sueltas eso se perdía, porque "negocio"
       aparece en media base y por eso pesa poco. */
    var q = ' ' + normalizar(texto) + ' ';
    for (var e = 0; e < ENTRADAS.length; e++) {
      var ent = ENTRADAS[e];
      for (var c = 0; c < ent.claves.length; c++) {
        var kn = normalizar(ent.claves[c]);
        if (kn.indexOf(' ') < 0) continue;                 // solo frases
        if (q.indexOf(' ' + kn) >= 0 || q.indexOf(kn + ' ') >= 0) {
          puntos[ent.id] = (puntos[ent.id] || 0) + 4 + kn.split(' ').length;
        }
      }
    }

    var out = [];
    for (var id in puntos) {
      if (!Object.prototype.hasOwnProperty.call(puntos, id)) continue;
      var e = porId(id);
      if (!e) continue;

      var sectorOk = coincide(e.sectores, filtro.sector);
      var etapaOk = coincide(e.etapas, filtro.etapa);

      // Un ejemplo de otro sector confunde más de lo que aporta: a quien vende
      // lámparas no le sirve un caso de repostería. Se descarta.
      if (e.tipo === 'ejemplo' && !sectorOk) continue;

      // La etapa, en cambio, nunca se usa como filtro duro. Si alguien
      // pregunta por algo que "todavía no le toca", es porque le importa hoy;
      // esconderlo sería peor que responderlo. Solo pesa menos.
      var p = puntos[id];
      if (filtro.sector && e.sectores.indexOf(filtro.sector) >= 0) p *= 1.6;
      else if (!sectorOk) p *= 0.5;
      if (filtro.etapa && e.etapas.indexOf(filtro.etapa) >= 0) p *= 1.25;
      else if (!etapaOk) p *= 0.6;

      out.push({ entrada: e, puntos: p });
    }

    out.sort(function (a, b) { return b.puntos - a.puntos; });
    return out.slice(0, limite);
  }

  w.CHISPA_KB = {
    ENTRADAS: ENTRADAS,
    buscar: buscar,
    porId: porId,
    normalizar: normalizar,
    raices: raices,
    meta: function () {
      var tipos = {};
      for (var i = 0; i < ENTRADAS.length; i++) {
        tipos[ENTRADAS[i].tipo] = (tipos[ENTRADAS[i].tipo] || 0) + 1;
      }
      var terminos = 0;
      for (var k in INDICE) if (Object.prototype.hasOwnProperty.call(INDICE, k)) terminos++;
      return { entradas: ENTRADAS.length, terminos: terminos, tipos: tipos };
    }
  };
})(window);
