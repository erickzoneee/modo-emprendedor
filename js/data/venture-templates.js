/* ==========================================================================
   PLANTILLAS PERSONALIZADAS

   Cada plantilla recibe `t` (los términos del emprendimiento: su producto, sus
   clientes, su etapa, su presupuesto) y devuelve texto que habla de ESE
   negocio. Es lo que hace que un desafío no diga "define a tu cliente ideal"
   sino "define tres perfiles de personas que podrían comprar tus lámparas
   personalizadas".

   Funciona sin conexión y sin clave de IA: es la base garantizada de la
   personalización. La IA, cuando está activa, la sustituye por algo mejor.
   ========================================================================== */
(function (w) {
  'use strict';

  /* ------------------------------------------------------------------
     Qué tema trata cada misión de la ruta
     ------------------------------------------------------------------ */
  var THEME_BY_ID = {
    'm1-01': 'problemas',   'm1-02': 'problemas',   'm1-03': 'ventajas',
    'm1-04': 'cliente',     'm1-05': 'servilleta',  'm1-06': 'competencia',
    'm1-07': 'idea',

    'm2-01': 'prueba',      'm2-02': 'entrevista',  'm2-03': 'compromiso',
    'm2-04': 'oferta',      'm2-05': 'preventa',    'm2-06': 'publicar',
    'm2-07': 'veredicto',

    'm3-01': 'mvp',         'm3-02': 'alcance',     'm3-03': 'costo',
    'm3-04': 'precio',      'm3-05': 'equilibrio',  'm3-06': 'calidad',

    'm4-01': 'diagnostico', 'm4-02': 'pitch',       'm4-03': 'canales',
    'm4-04': 'mensajes',    'm4-05': 'objeciones',  'm4-06': 'cotizacion',
    'm4-07': 'seguimiento',

    'm5-01': 'separar',     'm5-02': 'registro',    'm5-03': 'flujo',
    'm5-04': 'pruebaprecio','m5-05': 'inventario',  'm5-06': 'descuentos',
    'm5-07': 'formalizar',

    'm6-01': 'confianza',   'm6-02': 'contenido',   'm6-03': 'publicidad',
    'm6-04': 'resenas',     'm6-05': 'complemento', 'm6-06': 'reactivar',

    'm7-01': 'procesos',    'm7-02': 'plantillas',  'm7-03': 'delegar',
    'm7-04': 'tablero',     'm7-05': 'garantia',

    'm8-01': 'escalable',   'm8-02': 'contratar',   'm8-03': 'reinversion',
    'm8-04': 'encuesta',    'm8-05': 'plan90',

    'boss-1': 'entrevista', 'boss-2': 'publicar',   'boss-3': 'costo',
    'boss-4': 'cotizacion', 'boss-5': 'cierremes',  'boss-6': 'tresclientes',
    'boss-7': 'procesos',   'boss-8': 'roi'
  };

  /* ------------------------------------------------------------------
     El desafío, escrito sobre el negocio del usuario
     ------------------------------------------------------------------ */
  var BRIEF = {
    problemas: function (t) {
      return {
        brief: 'Hoy escucha en vez de vender. Anota 3 quejas textuales de gente parecida a ' +
               t.cliente + ': algo que hoy les cuesta tiempo, dinero o paciencia y que ' +
               t.tuProducto + ' podría resolver. Cópialas con sus palabras, sin corregirlas.',
        porque: 'De esas quejas sale el argumento con el que vas a vender ' + t.productoCorto + '.'
      };
    },
    ventajas: function (t) {
      return {
        brief: 'Haz el inventario de lo que ya tienes para arrancar con ' + t.productoCorto +
               ': herramientas o material, habilidades, contactos que te pueden presentar a ' +
               t.cliente + ', y tiempo real disponible (' + (t.minutos || '20') + ' min al día).',
        porque: 'Con ' + (t.presupuesto || 'poco presupuesto') + ', tu ventaja es lo que ya tienes, no lo que comprarías.'
      };
    },
    cliente: function (t) {
      return {
        brief: 'Define tres perfiles distintos de personas que podrían comprar ' + t.tuProducto +
               '. Para cada uno escribe: quién es, qué situación concreta lo lleva a necesitarlo, ' +
               'cuánto pagaría y en qué lugar real (físico o digital) lo puedes encontrar.',
        porque: 'Elegir un perfil concreto cambia por completo cómo describes ' + t.productoCorto + '.'
      };
    },
    servilleta: function (t) {
      return {
        brief: 'Cuentas de servilleta para ' + t.productoCorto + ': cuánto te cuesta cada ' + t.unidad +
               ', a cuánto crees que lo venderías, y cuántos tendrías que vender al mes para que ' +
               'valga la pena tu tiempo. Números aproximados, pero tuyos.',
        porque: 'Si el número no cierra en la servilleta, no cierra tampoco en la realidad.'
      };
    },
    competencia: function (t) {
      return {
        brief: 'Busca 3 negocios que hoy le venden algo parecido a ' + t.productoCorto + ' a ' + t.cliente +
               '. Anota de cada uno: qué cobra, qué promete y qué le reclaman los clientes en sus reseñas o comentarios.',
        porque: 'Los reclamos que ellos ignoran son el hueco por donde entras tú.'
      };
    },
    idea: function (t) {
      return {
        brief: 'Escribe tu idea en una sola frase con esta forma: ayudo a [' + t.tuCliente +
               '] a [resultado concreto] mediante ' + t.productoCorto + '. Sin adjetivos: sin "de calidad" ni "el mejor".',
        porque: 'Esta frase se convierte en tu pitch, tu bio y tu primera línea de venta.'
      };
    },

    prueba: function (t) {
      return {
        brief: 'Diseña la prueba más barata posible para saber si ' + t.cliente +
               ' pagarían por ' + t.productoCorto + ' — sin fabricar inventario. ' +
               'Piensa en una publicación, un preapartado, una lista de espera o un pedido a la medida.',
        porque: 'Con ' + (t.presupuesto || 'presupuesto limitado') + ', validar cuesta tiempo, no dinero.'
      };
    },
    entrevista: function (t) {
      return {
        brief: 'Escribe 5 preguntas para una conversación de 10 minutos con alguien de ' + t.cliente +
               '. Todas sobre el pasado: qué hizo la última vez que tuvo el problema, cuánto le costó, ' +
               'qué probó. Ninguna sobre si compraría ' + t.productoCorto + '.',
        porque: 'Preguntar "¿lo comprarías?" te da un sí falso; preguntar por el pasado te da hechos.'
      };
    },
    compromiso: function (t) {
      return {
        brief: 'Toma un elogio que ya te hayan dicho sobre ' + t.productoCorto +
               ' y convierte esa conversación en un compromiso real: un apartado, un anticipo, ' +
               'una fecha agendada o su teléfono para avisarle cuando esté listo.',
        porque: 'Un "qué bonito" no paga; un anticipo por ' + t.unaUnidad + ' sí.'
      };
    },
    oferta: function (t) {
      return {
        brief: 'Escribe la oferta de ' + t.tuProducto + ' completa: para quién es (' + t.cliente +
               '), qué resultado promete, qué incluye exactamente, en cuánto tiempo lo entregas, ' +
               'qué garantía das y a qué precio.',
        porque: 'Todo lo que no escribas aquí lo tendrá que preguntar el cliente, y ahí se cae la venta.'
      };
    },
    preventa: function (t) {
      return {
        brief: 'Lanza una preventa de ' + t.tuProducto + ': un mensaje con precio, plazo y cupo limitado, ' +
               'enviado a personas concretas de ' + t.cliente + '. Meta: cobrar al menos un anticipo.',
        porque: 'El dinero por adelantado es la única validación que no miente.'
      };
    },
    publicar: function (t) {
      return {
        brief: 'Publica tu oferta de ' + t.tuProducto + ' donde de verdad encuentras a ' + t.cliente +
               (t.lugar ? ' en ' + t.lugar : '') + '. Anota el texto exacto, dónde lo pusiste ' +
               'y cuántas personas respondieron.',
        porque: 'Publicar sin medir no enseña nada. El número de respuestas es el dato.'
      };
    },
    veredicto: function (t) {
      return {
        brief: 'Escribe tu veredicto de validación de ' + t.productoCorto +
               ': qué probaste, qué señales conseguiste (respuestas, apartados, ventas) y ' +
               'qué decides — seguir igual, ajustar la oferta o cambiar de cliente.',
        porque: 'Decidir por escrito evita seguir invirtiendo por inercia.'
      };
    },

    mvp: function (t) {
      return {
        brief: 'Recorta ' + t.productoCorto + ' hasta el hueso: qué es lo mínimo que puedes entregar ' +
               'esta semana para que ' + t.cliente + ' obtengan el resultado. Lista lo que quitas y lo que se queda.',
        porque: 'Lo que quites ahora lo puedes vender como extra después.'
      };
    },
    alcance: function (t) {
      return {
        brief: 'Escribe en una tarjeta el alcance exacto de ' + t.tuProducto + ': qué incluye, ' +
               'qué NO incluye, cuántos cambios acepta y qué pasa si el cliente pide más.',
        porque: 'El alcance escrito es lo que te salva de trabajar gratis.'
      };
    },
    costo: function (t) {
      return {
        brief: 'Calcula el costo real de ' + t.unaUnidad + ' de ' + t.productoCorto +
               ': materiales, energía, empaque, envío, desgaste de herramienta y tu tiempo pagado a una tarifa por hora. ' +
               'Con números reales, no estimados de memoria.',
        porque: 'Casi todo el mundo se olvida de su propio tiempo y termina pagándose cero por hora.'
      };
    },
    precio: function (t) {
      return {
        brief: 'Fija el precio de ' + t.productoCorto + ' con los tres números: tu costo por ' + t.unidad +
               ', lo que cobran 3 competidores, y cuánto vale para ' + t.cliente +
               ' el resultado que les das. Escribe el precio y por qué ese y no otro.',
        porque: 'Un precio que no puedes justificar se cae en la primera objeción.'
      };
    },
    equilibrio: function (t) {
      return {
        brief: 'Calcula ' + t.cuantasUnidades + ' de ' + t.productoCorto + ' necesitas vender al mes para no perder: ' +
               'costos fijos entre (precio menos costo variable). Escribe también cuántos vendes hoy.',
        porque: 'Ese número es tu meta mínima mensual, y hasta hoy probablemente no lo sabías.'
      };
    },
    calidad: function (t) {
      return {
        brief: 'Define tu estándar de calidad para ' + t.tuProducto + ': los 5 puntos que revisas antes de ' +
               'entregar y qué haces si uno falla. Escríbelo como una lista que puedas usar tú mismo cada vez.',
        // "el número 1" concuerda con "número", no con la unidad: sirve igual
        // para "la pieza" que para "el pedido".
        porque: 'Un estándar escrito es lo que hace que ' + t.laUnidad + ' número 50 salga igual que el número 1.'
      };
    },

    diagnostico: function (t) {
      return {
        brief: 'Escribe las 4 preguntas que le harás a ' + t.cliente + ' antes de cotizar ' + t.productoCorto +
               ': qué necesita exactamente, para cuándo, qué ha probado antes y qué presupuesto tiene en mente.',
        porque: 'Cotizar sin diagnosticar es adivinar el precio y regalar margen.'
      };
    },
    pitch: function (t) {
      return {
        brief: 'Prueba tu pitch de ' + t.productoCorto + ' con 3 personas reales. Di la frase, cállate, ' +
               'y anota textualmente qué te preguntaron. Si preguntan "¿y eso qué es?", el pitch aún no sirve.',
        porque: 'Las preguntas que te hacen son los huecos exactos de tu mensaje.'
      };
    },
    canales: function (t) {
      return {
        brief: 'Elige los 2 lugares donde de verdad encuentras a ' + t.cliente +
               (t.lugar ? ' en ' + t.lugar : '') + ' y descarta el resto. Para cada uno escribe qué acción ' +
               'harás cada semana y cómo sabrás si funcionó.',
        porque: 'Con ' + (t.minutos || 20) + ' minutos al día no alcanza para estar en cinco canales a medias.'
      };
    },
    mensajes: function (t) {
      return {
        brief: 'Manda hoy 10 mensajes a personas concretas de ' + t.cliente +
               '. Cada uno con una primera línea distinta sobre esa persona, no una plantilla copiada. ' +
               'Anota cuántos respondieron.',
        porque: 'Con menos de 10 no tienes muestra: un día de silencio es normal.'
      };
    },
    objeciones: function (t) {
      return {
        brief: 'Escribe las 3 objeciones que más vas a oír al vender ' + t.productoCorto +
               ' (probablemente el precio, la desconfianza y el "lo voy a pensar") y tu respuesta a cada una: ' +
               'validar, preguntar y recién entonces responder.',
        porque: 'La objeción llega siempre; improvisarla es lo que tumba la venta.'
      };
    },
    cotizacion: function (t) {
      return {
        brief: 'Envía una cotización real de ' + t.productoCorto + ' a alguien de ' + t.cliente +
               '. Debe llevar precio, qué incluye, plazo de entrega y hasta cuándo es válida.',
        porque: 'Una cotización sin fecha de vencimiento se queda esperando para siempre.'
      };
    },
    seguimiento: function (t) {
      return {
        brief: 'Arma tu sistema de seguimiento: dónde anotas a cada persona de ' + t.cliente +
               ' que preguntó por ' + t.productoCorto + ', en qué estado está y cuándo le vuelves a escribir.',
        porque: 'La mayoría de las ventas perdidas no dijeron que no: se olvidaron.'
      };
    },

    separar: function (t) {
      return {
        brief: 'Separa el dinero de ' + t.negocio + ' del tuyo: una cuenta o sobre aparte, y un sueldo fijo ' +
               'que te pagas cada mes. Escribe cuánto es y qué día te lo pagas.',
        porque: 'Si no te pagas, el negocio parece rentable cuando en realidad te está costando.'
      };
    },
    registro: function (t) {
      return {
        brief: 'Arranca el registro de ' + t.negocio + ': anota cada venta de ' + t.productoCorto +
               ' y cada gasto durante una semana, con fecha y concepto. Da igual el formato: cuaderno u hoja de cálculo.',
        porque: 'Sin registro no puedes saber si el mes cerró bien o solo lo pareció.'
      };
    },
    flujo: function (t) {
      return {
        brief: 'Haz el calendario de efectivo del próximo mes de ' + t.negocio + ': qué entra y cuándo ' +
               '(ventas cobradas, no prometidas) y qué sale y cuándo (material, renta, servicios).',
        porque: 'Se quiebra por falta de efectivo, no por falta de ventas.'
      };
    },
    pruebaprecio: function (t) {
      return {
        brief: 'Sube el precio de ' + t.productoCorto + ' entre 10% y 20% para las próximas 5 personas de ' +
               t.cliente + ' que pregunten. Anota cuántas compraron igual.',
        porque: 'Casi siempre el precio aguanta más de lo que uno cree, y ese margen es tu oxígeno.'
      };
    },
    inventario: function (t) {
      return {
        brief: 'Ordena el inventario de ' + t.negocio + ': qué material tienes, cuánto consumes por semana, ' +
               'cuánto tarda tu proveedor y en qué cantidad debes volver a pedir.',
        porque: 'Quedarte sin material en plena venta cuesta más que el material mismo.'
      };
    },
    descuentos: function (t) {
      return {
        brief: 'Escribe tu política de descuentos para ' + t.productoCorto + ': cuál es el máximo que das, ' +
               'a cambio de qué (volumen, pago anticipado, recomendación) y cuándo no das ninguno.',
        porque: 'Un descuento sin regla se convierte en tu precio real.'
      };
    },
    formalizar: function (t) {
      return {
        brief: 'Escribe tu plan de formalización de ' + t.negocio + ': qué necesitas para facturar, ' +
               'qué te piden tus clientes y qué paso das primero. Confírmalo con un contador local.',
        porque: 'Formalizarse tarde cierra puertas con clientes que sí pagan bien.'
      };
    },

    confianza: function (t) {
      return {
        brief: 'Publica algo que genere confianza en ' + t.productoCorto + ': el proceso por dentro, ' +
               'un antes y después, o un cliente contando su resultado. Sin pedir la venta.',
        porque: 'La gente le compra a quien ya vio trabajar, y en tu caso el proceso es medio espectáculo.'
      };
    },
    contenido: function (t) {
      return {
        brief: 'Graba 3 videos cortos en una sola sesión sobre ' + t.productoCorto +
               ': uno del proceso, uno respondiendo la duda más común de ' + t.cliente + ' y uno mostrando el resultado.',
        porque: 'Grabar en bloque es lo único que sostiene la constancia con ' + (t.minutos || 20) + ' minutos al día.'
      };
    },
    publicidad: function (t) {
      return {
        brief: 'Haz una prueba de publicidad pequeña y medible para ' + t.productoCorto +
               ': define presupuesto tope, a quién se la muestras, qué mensaje usas y cuántas respuestas ' +
               'necesitas para que valga la pena.',
        porque: 'Con ' + (t.presupuesto || 'presupuesto ajustado') + ', pagar por anuncios antes de saber el CAC quema dinero.'
      };
    },
    resenas: function (t) {
      return {
        brief: 'Consigue 3 reseñas de personas que ya compraron ' + t.productoCorto +
               '. Pídelas con una pregunta concreta ("¿qué te resolvió?"), no con un "déjame tu opinión".',
        porque: 'Una reseña específica vende; un "excelente servicio" no convence a nadie.'
      };
    },
    complemento: function (t) {
      return {
        brief: 'Lanza un complemento de ' + t.tuProducto + ': algo que quien ya te compró volvería a pagar ' +
               '(una versión más grande, un mantenimiento, un repuesto, un paquete). Ponle precio y ofrécelo.',
        porque: 'Venderle otra vez a un cliente tuyo cuesta mucho menos que conseguir uno nuevo.'
      };
    },
    reactivar: function (t) {
      return {
        brief: 'Reactiva tu lista: escribe a todas las personas de ' + t.cliente +
               ' que alguna vez preguntaron por ' + t.productoCorto + ' y no compraron. Un mensaje breve, con una novedad concreta.',
        porque: 'Esa lista ya te conoce: es la venta más barata que tienes disponible.'
      };
    },

    procesos: function (t) {
      return {
        brief: 'Documenta el proceso más repetido de ' + t.negocio + ' — desde que llega el pedido de ' +
               t.productoCorto + ' hasta que se entrega — paso a paso, cada uno empezando por un verbo, con tiempos.',
        porque: 'Si no está escrito, no se puede delegar ni sostener cuando lleguen 20 pedidos.'
      };
    },
    plantillas: function (t) {
      return {
        brief: 'Crea 3 plantillas que uses todas las semanas en ' + t.negocio + ': la cotización de ' +
               t.productoCorto + ', el mensaje de primer contacto con ' + t.cliente + ' y el de seguimiento.',
        porque: 'Volver a escribir lo mismo cada vez es donde se va tu tiempo sin darte cuenta.'
      };
    },
    delegar: function (t) {
      return {
        brief: 'Lista todo lo que haces en una semana para ' + t.negocio + ' y marca qué podrías delegar primero ' +
               '(lo repetitivo y de bajo valor), a quién y cuánto costaría.',
        porque: 'Delegar lo que menos vale libera las horas que sí venden ' + t.productoCorto + '.'
      };
    },
    tablero: function (t) {
      return {
        brief: 'Arma el tablero de ' + t.negocio + ' con 5 números que revisarás cada semana: ' +
               t.unidadesVendidas + ', ingresos, gastos, personas nuevas que preguntaron y margen por ' + t.unidad + '.',
        porque: 'Cinco números revisados el mismo día cada semana valen más que un reporte perfecto una vez al año.'
      };
    },
    garantia: function (t) {
      return {
        brief: 'Escribe la política de garantía de ' + t.tuProducto + ': qué cubre, qué no, por cuánto tiempo ' +
               'y qué hace exactamente el cliente para reclamarla.',
        porque: 'La garantía escrita quita el miedo que frena la primera compra.'
      };
    },

    escalable: function (t) {
      return {
        brief: 'Diagnostica qué te impide vender el doble de ' + t.productoCorto +
               ': tus horas, tu capacidad de producción, tu material o tu flujo de clientes. Nombra el cuello de botella real.',
        porque: 'Escalar sin arreglar el cuello de botella solo multiplica el cansancio.'
      };
    },
    contratar: function (t) {
      return {
        brief: 'Define la primera contratación de ' + t.negocio + ': qué tarea concreta de ' + t.productoCorto +
               ' se lleva esa persona, cuántas horas, cuánto cuesta al mes y cuántas ventas extra la pagan.',
        porque: 'Una contratación que no se paga sola en 60 días se convierte en deuda.'
      };
    },
    reinversion: function (t) {
      return {
        brief: 'Decide qué porcentaje de la utilidad de ' + t.negocio + ' reinviertes y en qué exactamente ' +
               '(equipo, material, publicidad o gente), y qué porcentaje te llevas tú.',
        porque: 'Sin una regla escrita, la utilidad se gasta sola y el negocio no crece.'
      };
    },
    encuesta: function (t) {
      return {
        brief: 'Pregunta a 10 personas que ya compraron ' + t.productoCorto + ' tres cosas: por qué te eligieron, ' +
               'qué casi les hace no comprar y qué otra cosa te comprarían.',
        porque: 'La tercera respuesta suele ser tu próximo producto.'
      };
    },
    plan90: function (t) {
      return {
        brief: 'Escribe el plan de 90 días de ' + t.negocio + ': una meta medible para ' + t.productoCorto +
               ' (número de ' + t.unidades + ' o de ingresos con fecha) y las 3 acciones semanales que la hacen posible.',
        porque: 'Una meta sin número ni fecha es un deseo; con ambos, es un plan.'
      };
    },

    cierremes: function (t) {
      return {
        brief: 'Cierra el mes de ' + t.negocio + ' con números reales: cuánto entró, cuánto salió, ' +
               t.cuantasUnidades + ' de ' + t.productoCorto + ' vendiste y qué gasto te sorprendió.',
        porque: 'El primer cierre siempre duele y siempre enseña: ese es el punto de partida real.'
      };
    },
    tresclientes: function (t) {
      return {
        brief: 'Consigue 3 clientes nuevos de ' + t.productoCorto + ' en siete días usando el canal que mejor ' +
               'te funcionó con ' + t.cliente + '. Anota qué hiciste exactamente para cada uno.',
        porque: 'Repetir lo que funcionó es más rentable que inventar algo nuevo cada semana.'
      };
    },
    roi: function (t) {
      return {
        brief: 'Demuestra que ' + t.negocio + ' ya devolvió lo que metiste: inversión inicial total contra ' +
               'utilidad acumulada. Y escribe adónde va en los próximos 90 días.',
        porque: 'Recuperar la inversión es la línea que separa un pasatiempo de un negocio.'
      };
    }
  };

  /* ------------------------------------------------------------------
     Ejemplo aplicado que se muestra dentro de cada lección
     ------------------------------------------------------------------ */
  var EXAMPLE_BY_LEVEL = {
    1: function (t) {
      return 'En tu caso: el problema que persigues no es "que existan ' + t.productoCorto + '", sino lo que ' +
             t.cliente + ' pierden hoy por no tenerlo. Escríbelo con sus palabras antes de seguir.';
    },
    2: function (t) {
      return 'En tu caso: valida ' + t.productoCorto + ' antes de producir. Una publicación o un apartado con ' +
             (t.presupuestoKey === 'none' ? 'cero pesos' : 'lo mínimo') +
             ' te dice más que un mes fabricando inventario.';
    },
    3: function (t) {
      return 'En tu caso: define la versión mínima de ' + t.productoCorto + ' que ya le sirva a ' + t.cliente +
             ', calcula tu costo por ' + t.unidad + ' incluyendo tu tiempo y ponle precio con criterio, no por comparación.';
    },
    4: function (t) {
      return 'En tu caso: aplica esto a los mensajes que le mandas a ' + t.cliente +
             '. Personaliza la primera línea y termina siempre con una pregunta o una acción concreta.';
    },
    5: function (t) {
      return 'En tu caso: llévalo a los números de ' + t.negocio + '. Registra cada ' + t.unidad +
             ' de ' + t.productoCorto + ' que vendes y cada gasto, aunque sea en un cuaderno.';
    },
    6: function (t) {
      return 'En tu caso: aplícalo al canal donde ya encuentras a ' + t.cliente +
             (t.lugar ? ' en ' + t.lugar : '') + ', no a todas las redes a la vez.';
    },
    7: function (t) {
      return 'En tu caso: escribe cómo se hace ' + t.productoCorto + ' de principio a fin. ' +
             'Eso es lo que después permite que otra persona lo haga sin ti.';
    },
    8: function (t) {
      return 'En tu caso: antes de escalar ' + t.productoCorto + ', asegúrate de que cada ' + t.unidad +
             ' te deje margen. Escalar algo que no deja margen solo multiplica el trabajo.';
    }
  };

  /* ------------------------------------------------------------------
     Pregunta de reflexión al terminar la lección
     ------------------------------------------------------------------ */
  var REFLECT_BY_LEVEL = {
    1: function (t) { return '¿Qué te dice esto sobre el problema que de verdad resuelves con ' + t.tuProducto + '?'; },
    2: function (t) { return '¿Cuál es la prueba más barata que podrías hacer esta semana para saber si ' + t.cliente + ' pagarían?'; },
    3: function (t) { return '¿Qué le quitarías hoy a ' + t.productoCorto + ' sin que ' + t.cliente + ' lo noten?'; },
    4: function (t) { return '¿A qué persona concreta de ' + t.cliente + ' le vas a escribir hoy, y con qué primera línea?'; },
    5: function (t) { return '¿Qué número de ' + t.negocio + ' no conoces todavía y te da miedo mirar?'; },
    6: function (t) { return '¿Qué acción de marketing puedes repetir cada semana con ' + (t.minutos || 20) + ' minutos al día?'; },
    7: function (t) { return '¿Qué parte de hacer ' + t.productoCorto + ' solo sabes hacer tú, y por qué?'; },
    8: function (t) { return '¿Qué te impide hoy vender el doble de ' + t.productoCorto + ' sin trabajar el doble?'; }
  };

  /* ------------------------------------------------------------------
     Retos semanales, referidos al negocio
     ------------------------------------------------------------------ */
  var WEEKLY = {
    'w-lessons': function (t) { return 'Completa 10 lecciones y aplícalas a ' + t.productoCorto; },
    'w-perfect': function (t) { return '3 lecciones perfectas'; },
    'w-mission': function (t) { return 'Entrega 2 misiones reales sobre ' + t.negocio; },
    'w-sim':     function (t) { return 'Juega 4 semanas del simulador'; },
    'w-streak':  function (t) { return 'Trabaja en ' + t.negocio + ' 5 días'; }
  };

  /* ------------------------------------------------------------------
     Placeholders de los campos: ejemplos con SU producto, no con collares
     ------------------------------------------------------------------ */
  var PLACEHOLDER = {
    grupo:     function (t) { return t.tuCliente; },
    cliente:   function (t) { return t.tuCliente; },
    quien:     function (t) { return 'Una persona concreta de ' + t.cliente; },
    necesidad: function (t) { return 'Lo que ' + t.cliente + ' necesitan resolver'; },
    donde:     function (t) { return t.lugar ? 'Dónde se juntan en ' + t.lugar : 'El lugar real donde se juntan'; },
    oferta:    function (t) { return 'Ayudo a ' + t.tuCliente + ' a [resultado] con ' + t.productoCorto; },
    incluye:   function (t) { return 'Qué incluye exactamente cada ' + t.unidad; },
    texto:     function (t) { return 'El texto con el que ofreciste ' + t.productoCorto; },
    mensaje:   function (t) { return 'Hola [Nombre], vi que… (sobre ' + t.productoCorto + ')'; },
    canal1:    function (t) { return 'Dónde está ' + t.cliente; },
    canal2:    function (t) { return 'El segundo lugar donde están'; },
    proceso:   function (t) { return 'Desde que piden ' + t.productoCorto + ' hasta que lo entregas'; },
    meta:      function (t) { return 'Vender N ' + t.unidades + ' de ' + t.productoCorto + ' antes del [fecha]'; },
    lista:     function (t) { return 'Uno por línea, pensando en ' + t.cliente; },
    accion:    function (t) { return 'Qué hiciste para vender ' + t.productoCorto; }
  };

  /* ==================================================================
     LO MISMO, PERO POR SECTOR

     Las tablas de arriba ya hablan del negocio del usuario: dicen su producto
     y sus clientes. Estas van un paso más allá y hablan de su OFICIO: una
     pastelería tiene merma y pedidos con anticipo; un taller de impresión 3D
     tiene horas de máquina y filamento; una agencia tiene prospectos y
     entregables. Eso no se consigue sustituyendo palabras.

     Están incompletas a propósito. Lo que no esté aquí cae en la tabla
     genérica por nivel, que sigue siendo específica del negocio. Añadir un
     sector o un nivel nuevo es escribir una función más, sin tocar código.
     ================================================================== */

  var EXAMPLE_BY_SECTOR = {

    /* ---------- Comida y bebida ---------- */
    comida: {
      1: function (t) {
        return 'En tu caso: el problema no es que falte dónde comprar ' + t.productoCorto + '. Es la ocasión — ' +
               'un cumpleaños encima, una reunión sin postre, un antojo a deshoras. Apunta la última vez que ' +
               t.cliente + ' pasaron por eso.';
      },
      2: function (t) {
        return 'En tu caso: valida con pedidos por encargo antes de producir en lote. Si diez personas apartan ' +
               'con anticipo, tienes demanda; si nadie aparta, te ahorraste el desperdicio.';
      },
      3: function (t) {
        return 'En tu caso: pesa los ingredientes de un solo ' + t.unidad + ' y súmale gas, empaque y tu hora de ' +
               'trabajo. Ese es tu costo real. Casi siempre sale al doble de lo que uno calcula "a ojo", ' +
               'y por eso tantos negocios de comida venden mucho y no ganan.';
      },
      4: function (t) {
        return 'En tu caso: manda foto del producto recién hecho a quien ya te compró, no un catálogo. ' +
               'En comida, la recompra es la venta fácil y la foto de hoy vende más que cualquier anuncio.';
      },
      5: function (t) {
        return 'En tu caso: además de ingresos y gastos, anota la MERMA — lo que se echó a perder o se regaló. ' +
               'Es el gasto invisible que se come el margen de ' + t.negocio + ' sin aparecer en ningún recibo.';
      },
      6: function (t) {
        return 'En tu caso: el proceso vende más que el producto terminado. Graba el batido, el horno o el ' +
               'decorado; es el contenido que más comparte ' + t.cliente + '.';
      },
      7: function (t) {
        return 'En tu caso: escribe la receta con gramos y tiempos exactos, no "al gusto". Un proceso de comida ' +
               'sin medidas no se puede delegar ni repetir igual dos veces.';
      },
      8: function (t) {
        return 'En tu caso: antes de aceptar más pedidos, mira cuántos ' + t.unidades + ' caben de verdad en tu ' +
               'horno y en tu día. Aceptar más de lo que puedes producir es la forma más rápida de perder clientes.';
      }
    },

    /* ---------- Hecho a mano y fabricación ---------- */
    hechoamano: {
      1: function (t) {
        return 'En tu caso: lo que persigues no es que falten ' + t.productoCorto + ' en el mercado. Es que lo que ' +
               'hay no encaja — mide mal, se rompe, o no se puede personalizar. Apunta qué le reclaman a lo que ya existe.';
      },
      2: function (t) {
        return 'En tu caso: valida con un prototipo y fotos antes de comprar material en cantidad. Enseñar un ' +
               'diseño y pedir apartado cuesta cero; un lote sin vender es dinero congelado en una caja.';
      },
      3: function (t) {
        return 'En tu caso: tu costo por ' + t.unidad + ' no es solo el material. Súmale las horas de máquina o de ' +
               'banco, la luz, las piezas falladas y tu tiempo de acabado. El acabado suele ser la mitad del trabajo ' +
               'y la primera cosa que nadie cobra.';
      },
      4: function (t) {
        return 'En tu caso: enseña el antes y el después, o la pieza junto a algo de tamaño conocido. En hecho a ' +
               'mano, lo que cierra la venta es que ' + t.cliente + ' entienda el tamaño y el acabado real.';
      },
      5: function (t) {
        return 'En tu caso: lleva control de tu inventario de MATERIA PRIMA, no solo de piezas terminadas. ' +
               'Quedarte sin material a mitad de un pedido cuesta más que tenerlo de más.';
      },
      6: function (t) {
        return 'En tu caso: los encargos personalizados se venden mostrando el proceso. Publica la pieza a medio ' +
               'hacer: es lo que convence a ' + t.cliente + ' de que lo suyo también se puede.';
      },
      7: function (t) {
        return 'En tu caso: documenta las medidas, los tiempos y la configuración exacta de cada pieza. Sin eso, ' +
               'repetir un encargo de hace tres meses significa empezar de cero.';
      },
      8: function (t) {
        return 'En tu caso: para vender más ' + t.unidades + ' sin trabajar más horas, estandariza dos o tres ' +
               'modelos y cobra aparte lo personalizado. Todo a medida no escala nunca.';
      }
    },

    /* ---------- Servicios ---------- */
    servicios: {
      1: function (t) {
        return 'En tu caso: el problema que resuelves no es la falta de ' + t.productoCorto + ', es lo que ' +
               t.cliente + ' aguantan mientras no lo contratan — tiempo perdido, un mal resultado, o el miedo a ' +
               'que les cobren de más.';
      },
      2: function (t) {
        return 'En tu caso: valida vendiendo antes de estar listo. Ofrece las primeras tres citas con agenda ' +
               'concreta; si nadie aparta hora, el problema es la oferta y no la publicidad.';
      },
      3: function (t) {
        return 'En tu caso: tu costo por ' + t.unidad + ' es sobre todo TU HORA, más el traslado y el material que ' +
               'consumes. Ponle precio a tu hora antes de cotizar: sin ese número, cualquier precio es una corazonada.';
      },
      4: function (t) {
        return 'En tu caso: responde rápido y con una hora concreta. En servicios gana quien contesta primero, ' +
               'no quien cobra menos: ' + t.cliente + ' contactan a tres y contratan al que respondió.';
      },
      5: function (t) {
        return 'En tu caso: mide tus horas facturables contra las horas trabajadas. Los traslados, las cotizaciones ' +
               'y los reagendes no se cobran, y son los que deciden si ' + t.negocio + ' es rentable de verdad.';
      },
      6: function (t) {
        return 'En tu caso: pide la recomendación al terminar, con el cliente contento delante. El boca a boca ' +
               'es el canal más barato que tienes y el único que se pide, no se espera.';
      },
      7: function (t) {
        return 'En tu caso: escribe tu protocolo de servicio paso a paso, desde que suena el teléfono hasta que ' +
               'cobras. Eso es lo que permite que otra persona atienda igual que tú.';
      },
      8: function (t) {
        return 'En tu caso: para crecer sin trabajar más horas, sube el precio o vende paquetes recurrentes. ' +
               'Un servicio se topa siempre en las horas que tiene el día.';
      }
    },

    /* ---------- Digital ---------- */
    digital: {
      1: function (t) {
        return 'En tu caso: el problema no es que ' + t.cliente + ' no tengan ' + t.productoCorto + '. Es lo que ' +
               'están haciendo a mano, tarde o mal mientras tanto. Ese es el dolor que se paga.';
      },
      2: function (t) {
        return 'En tu caso: valida con una página simple y un botón, antes de construir nada. Si nadie deja su ' +
               'correo, no hace falta programar tres meses para descubrirlo.';
      },
      3: function (t) {
        return 'En tu caso: define el alcance por escrito y cuántas rondas de cambios incluye. En digital el costo ' +
               'no se dispara por el trabajo, sino por los cambios que nadie acotó al principio.';
      },
      4: function (t) {
        return 'En tu caso: no mandes un portafolio. Manda una observación concreta sobre el negocio de quien te ' +
               'lee — algo que hayas visto en su web o en su cuenta — y una propuesta de una línea.';
      },
      5: function (t) {
        return 'En tu caso: mide tus horas reales por proyecto contra lo que cobraste. Los proyectos digitales ' +
               'suelen ser rentables al cotizar y ruinosos al entregar, y la diferencia son las horas no contadas.';
      },
      6: function (t) {
        return 'En tu caso: publica el resultado que conseguiste para un cliente, con números. En digital, un caso ' +
               'con cifras vale más que diez publicaciones de consejos.';
      },
      7: function (t) {
        return 'En tu caso: documenta tu proceso de entrega y hazte plantillas de lo que repites en cada proyecto. ' +
               'Ahí está la mayor parte del tiempo que hoy regalas.';
      },
      8: function (t) {
        return 'En tu caso: para escalar, convierte lo que ya haces a medida en un paquete cerrado con precio fijo. ' +
               'Vender por horas te pone un techo; vender un resultado, no.';
      }
    },

    /* ---------- Compra y reventa ---------- */
    reventa: {
      1: function (t) {
        return 'En tu caso: no compites por tener ' + t.productoCorto + ' — eso lo tiene cualquiera. Compites por ' +
               'la confianza, el tiempo de entrega y el trato. Apunta qué le falla a ' + t.cliente + ' con quien le vende hoy.';
      },
      2: function (t) {
        return 'En tu caso: valida con pedidos por encargo o con una muestra, antes de comprar inventario. ' +
               'El error clásico de la reventa es traer cien piezas de algo que se vende de a tres.';
      },
      3: function (t) {
        return 'En tu caso: tu costo por ' + t.unidad + ' incluye el envío, la aduana si la hay, el empaque y las ' +
               'devoluciones. Calcular el margen solo sobre el precio de compra es lo que deja negocios sin utilidad.';
      },
      4: function (t) {
        return 'En tu caso: ten lista la respuesta de "¿tienes disponible?" con precio, tiempo de entrega y forma ' +
               'de pago en un solo mensaje. Cada ida y vuelta pierde clientes.';
      },
      5: function (t) {
        return 'En tu caso: lo que hay que vigilar es la ROTACIÓN — cuántos días tarda en venderse cada producto. ' +
               'El inventario parado no es un activo: es dinero tuyo dormido en una caja.';
      },
      6: function (t) {
        return 'En tu caso: enseña el producto en uso y en tamaño real, no la foto del catálogo del proveedor. ' +
               'Es lo único que te distingue de los otros veinte que revenden lo mismo.';
      },
      7: function (t) {
        return 'En tu caso: documenta el circuito completo — pedido, pago, empaque, guía y seguimiento. ' +
               'En reventa, el proceso ES el producto: es lo que el cliente vive.';
      },
      8: function (t) {
        return 'En tu caso: antes de ampliar el catálogo, mira cuáles de tus ' + t.unidades + ' dejan margen de verdad. ' +
               'Casi siempre unos pocos productos sostienen al resto.';
      }
    }
  };

  /* ------------------------------------------------------------------
     Reflexión final, cuando el oficio cambia la pregunta
     ------------------------------------------------------------------ */
  var REFLECT_BY_SECTOR = {
    comida: {
      3: function (t) { return '¿Cuánto te cuesta de verdad un ' + t.unidad + ', contando tu tiempo y lo que se echa a perder?'; },
      5: function (t) { return '¿Cuánto tiraste o regalaste este mes, y cuánto vale eso en dinero?'; },
      8: function (t) { return '¿Cuántos ' + t.unidades + ' puedes producir en un día sin bajar la calidad?'; }
    },
    hechoamano: {
      3: function (t) { return '¿Cuántas horas de trabajo lleva una pieza terminada, con acabado incluido?'; },
      5: function (t) { return '¿Cuánto material tienes parado ahora mismo sin convertirse en venta?'; },
      8: function (t) { return '¿Qué parte de ' + t.productoCorto + ' podrías estandarizar sin que deje de ser tuyo?'; }
    },
    servicios: {
      3: function (t) { return '¿Cuánto vale tu hora, y estás cobrando ese número?'; },
      5: function (t) { return 'De las horas que trabajaste esta semana, ¿cuántas facturaste?'; },
      8: function (t) { return '¿Qué parte de tu servicio podrías vender como plan mensual en vez de por cita?'; }
    },
    digital: {
      3: function (t) { return '¿Cuántas rondas de cambios incluye tu precio, y qué pasa con la cuarta?'; },
      5: function (t) { return '¿Cuál de tus proyectos te salió más caro de lo que cobraste, y por qué?'; },
      8: function (t) { return '¿Qué haces a medida en cada proyecto que podría ser un paquete cerrado?'; }
    },
    reventa: {
      3: function (t) { return 'Con envío, empaque y devoluciones incluidos, ¿cuánto te queda por ' + t.unidad + '?'; },
      5: function (t) { return '¿Cuál de tus productos lleva más tiempo sin venderse?'; },
      8: function (t) { return '¿Qué tres productos te dan la mayor parte de tu utilidad?'; }
    }
  };

  /* ------------------------------------------------------------------
     Placeholders donde el oficio cambia el ejemplo
     ------------------------------------------------------------------ */
  var PLACEHOLDER_BY_SECTOR = {
    comida: {
      incluye: function (t) { return 'Tamaño, porciones, sabores y con cuánta anticipación se pide'; },
      proceso: function (t) { return 'Desde que entra el pedido hasta que se entrega, con tiempos de horno'; },
      accion:  function (t) { return 'Qué publicaste o a quién le mandaste foto de ' + t.productoCorto; }
    },
    hechoamano: {
      incluye: function (t) { return 'Medidas, material, acabado y tiempo de entrega'; },
      proceso: function (t) { return 'Desde el diseño hasta el acabado, con horas de máquina'; },
      accion:  function (t) { return 'Qué pieza mostraste y dónde'; }
    },
    servicios: {
      incluye: function (t) { return 'Qué se hace, cuánto dura la visita y qué material va incluido'; },
      proceso: function (t) { return 'Desde que te contactan hasta que cobras, con tiempos de respuesta'; },
      accion:  function (t) { return 'A quién atendiste y de dónde salió ese cliente'; }
    },
    digital: {
      incluye: function (t) { return 'Entregables, rondas de cambios y plazo'; },
      proceso: function (t) { return 'Desde el brief hasta la entrega final, con puntos de revisión'; },
      accion:  function (t) { return 'Qué resultado publicaste y con qué números'; }
    },
    reventa: {
      incluye: function (t) { return 'Producto, presentación, garantía y tiempo de envío'; },
      proceso: function (t) { return 'Desde el pedido hasta la guía de envío y el seguimiento'; },
      accion:  function (t) { return 'Qué producto moviste y por qué canal'; }
    }
  };

  w.VENTURE_TEMPLATES = {
    THEME_BY_ID: THEME_BY_ID,
    BRIEF: BRIEF,
    EXAMPLE_BY_LEVEL: EXAMPLE_BY_LEVEL,
    REFLECT_BY_LEVEL: REFLECT_BY_LEVEL,
    WEEKLY: WEEKLY,
    PLACEHOLDER: PLACEHOLDER,
    EXAMPLE_BY_SECTOR: EXAMPLE_BY_SECTOR,
    REFLECT_BY_SECTOR: REFLECT_BY_SECTOR,
    PLACEHOLDER_BY_SECTOR: PLACEHOLDER_BY_SECTOR
  };
})(window);
