/* ==========================================================================
   LO QUE CHISPA QUIERE SABER — el catálogo de preguntas

   Aquí no hay ni una línea de interfaz: solo QUÉ se pregunta, CÓMO es más
   cómodo contestarlo y DÓNDE se guarda. Quien lo pinta es js/core/captura.js,
   y quien decide cuándo preguntar es el mismo.

   Separarlo así tiene un motivo concreto: añadir una pregunta nueva —o
   cambiarle el modo a una que hoy se escribe— tiene que ser editar un objeto
   de este archivo, sin tocar ninguna pantalla.

   ANATOMÍA DE UNA PREGUNTA
     id        clave única. Es lo que se apunta en intake.asked para no
               volver a preguntarla nunca.
     guarda    dónde acaba la respuesta:
                 'core.idea'            → Venture.patchCore
                 'core.resources.time'  → Venture.patchCore (anidado)
                 'decision:canales'     → Venture.recordDecision (nivel 2)
                 'metric:precio'        → Venture.metrics (número)
     modo      'voz' | 'tarjetas' | 'rapidas' | 'escala' | 'desliza' |
               'completa' | 'ejemplos' | 'escribe'
     fase      'registro' → se pregunta al entrar
               'pronto'   → en las primeras lecciones
               'luego'    → cuando ya hay costumbre
     peso      orden dentro de la fase. Menor = antes.
     requiere  ids que ya deben estar contestados. Sin esto se preguntaría el
               precio a quien todavía no ha dicho qué vende.
     etapas    si está, solo se pregunta a quien esté en una de esas etapas.
     q         la pregunta. Segunda persona, corta.
     chispa    lo que dice Chispa en su burbuja. Primera persona.
     para      la píldora "para qué me sirve saberlo". Nunca falta: es la
               diferencia entre una conversación y un formulario.
     noSe      false quita el «Todavía no lo sé». Solo lo hace la idea, que es
               lo único sin lo cual la app no puede escribir nada.

   REGLA QUE NO SE ROMPE: ninguna pregunta obliga. Salvo la idea, todas se
   pueden saltar, y saltarlas no penaliza ni bloquea nada.
   ========================================================================== */
(function (w) {
  'use strict';

  /* Listas que ya viven en config.js. Se referencian por nombre en vez de
     copiarse: si mañana se añade un sector, aparece aquí solo. */
  var PREGUNTAS = [

    /* ==============================================================
       FASE 1 — EL REGISTRO. Cuatro preguntas y un "esto entendí".
       Todo lo demás se aprende después, mientras el usuario avanza.
       ============================================================== */

    { id: 'idea',
      guarda: 'core.idea', modo: 'voz', fase: 'registro', peso: 10,
      ico: '💡', etiqueta: 'Tu idea',
      q: '¿Cuál es tu idea de negocio?',
      chispa: 'Cuéntamelo hablando. Con dos frases me sobra.',
      para: 'Todo lo que veas después se escribe sobre esto',
      ph: 'Quiero vender lámparas personalizadas hechas con impresión 3D…',
      min: 3, largo: true, noSe: false },

    { id: 'sector',
      guarda: 'core.sector', modo: 'tarjetas', fase: 'registro', peso: 20,
      opcionesDe: 'SECTORS', adivina: true,
      ico: '🏷️', etiqueta: 'Sector',
      q: '¿A qué se dedica tu negocio?',
      chispa: 'Con esto te pongo ejemplos de tu oficio, no de otro.',
      para: 'Cambia los ejemplos, las cuentas y hasta cómo se ve la app' },

    { id: 'cliente',
      guarda: 'core.customer', modo: 'voz', fase: 'registro', peso: 30,
      ico: '🎯', etiqueta: 'Tus clientes',
      q: '¿A quién le vendes?',
      chispa: 'Dímelo hablando. Un grupo concreto vende más que "todos".',
      para: 'Con esto sé a quién buscar en tus desafíos',
      ph: 'Personas de 25 a 40 años que decoran su departamento…',
      min: 2, largo: true,
      ejemplos: [
        { v: 'Personas que buscan un regalo original y con significado', emoji: '🎁',
          t: 'Quien busca un regalo', cita: 'Cumpleaños, bodas, detalles con nombre' },
        { v: 'Personas que están decorando o amueblando su casa', emoji: '🛋️',
          t: 'Quien decora su casa', cita: 'Se acaba de mudar o está renovando' },
        { v: 'Otros negocios pequeños que necesitan lo que vendo', emoji: '🏪',
          t: 'Otros negocios', cita: 'Le vendes a quien revende o usa tu producto' },
        { v: 'Vecinos y gente de mi zona que me conoce', emoji: '🏘️',
          t: 'Gente de mi zona', cita: 'Se vende de boca en boca, cerca de casa' }
      ] },

    { id: 'etapa',
      guarda: 'core.stage', modo: 'tarjetas', fase: 'registro', peso: 40,
      opcionesDe: 'STAGES',
      ico: '📍', etiqueta: 'Etapa',
      q: '¿En qué etapa estás?',
      chispa: 'No hay respuesta mala. Solo cambia por dónde empezamos.',
      para: 'Decide por qué lección empieza tu ruta' },

    /* ==============================================================
       FASE 2 — PRONTO. Lo que hace falta para que la ruta apriete.
       Una por lección terminada, nunca dos seguidas.
       ============================================================== */

    { id: 'objetivo',
      guarda: 'core.goalKey', modo: 'tarjetas', fase: 'pronto', peso: 10,
      opcionesDe: 'OBJECTIVES',
      /* Quien venía de la versión anterior pudo escribir su objetivo con sus
         palabras en vez de elegirlo. Eso cuenta como contestado: preguntárselo
         otra vez sería exactamente lo que esto viene a evitar. */
      alt: 'core.goalText',
      ico: '🚩', etiqueta: 'Tu objetivo',
      q: '¿Qué quieres conseguir primero?',
      chispa: 'Lo primero. Lo demás viene después, y sin prisa.',
      para: 'Con esto ordeno tus misiones' },

    { id: 'tiempo',
      guarda: 'core.resources.time', modo: 'rapidas', fase: 'pronto', peso: 20,
      opcionesDe: 'TIMES',
      ico: '⏱️', etiqueta: 'Tiempo al día',
      q: '¿Cuánto tiempo tienes al día?',
      chispa: 'Dime la verdad, no lo que te gustaría. Con diez minutos avanzas.',
      para: 'Con esto pongo tu meta diaria' },

    { id: 'oferta',
      guarda: 'core.offer', modo: 'voz', fase: 'pronto', peso: 30,
      requiere: ['idea'],
      ico: '📦', etiqueta: 'Qué entregas',
      q: '¿Qué recibe exactamente tu cliente?',
      chispa: 'Cuéntame qué se lleva a casa. Cuanto más concreto, mejores cuentas.',
      para: 'Sin esto no puedo calcular tu costo ni tu precio',
      ph: 'Una lámpara de 20 cm, con cable y foco, entrega en 5 días…',
      min: 2, largo: true },

    { id: 'problema',
      guarda: 'decision:problema', modo: 'voz', fase: 'pronto', peso: 40,
      requiere: ['idea'],
      ico: '🩹', etiqueta: 'Problema que resuelves',
      q: '¿Qué problema le quitas a tu cliente?',
      chispa: 'La gente no compra cosas: compra que se le acabe un problema.',
      para: 'Con esto tus mensajes de venta dejan de hablar del producto',
      ph: 'Las lámparas que se venden son todas iguales y nadie encuentra un regalo con significado…',
      min: 3, largo: true },

    { id: 'presupuesto',
      guarda: 'core.resources.budget', modo: 'rapidas', fase: 'pronto', peso: 50,
      opcionesDe: 'BUDGETS',
      ico: '💰', etiqueta: 'Presupuesto',
      q: '¿Cuánto puedes invertir hoy?',
      chispa: 'Con cero también empezamos. De hecho es lo más sano al principio.',
      para: 'Con esto ajusto el tamaño de cada misión' },

    { id: 'experiencia',
      guarda: 'core.resources.experience', modo: 'escala', fase: 'pronto', peso: 60,
      ico: '🐣', etiqueta: 'Experiencia vendiendo',
      q: '¿Cuánto has vendido antes?',
      chispa: 'Sin exagerar ni castigarte. Donde estés está bien.',
      para: 'Con esto elijo cuánto te explico y cuánto doy por sabido',
      escala: {
        izq: 'Nunca he vendido', der: 'Vendo con método',
        pasos: [
          { v: 'none', cara: '🐣', t: 'Empiezo de cero', dice: 'Empezamos por lo básico y sin dar nada por sabido.' },
          { v: 'some', cara: '🐥', t: 'Algo he intentado', dice: 'Ya has vendido: lo que falta es método, no valentía.' },
          { v: 'lots', cara: '🦅', t: 'Ya tengo experiencia', dice: 'Con experiencia. Vamos directo a ordenar y crecer.' }
        ] } },

    { id: 'canales',
      guarda: 'decision:canales', modo: 'desliza', fase: 'pronto', peso: 70,
      ico: '💬', etiqueta: 'Dónde vendes',
      q: '¿Dónde vendes hoy?',
      chispa: 'Te voy pasando sitios. Dime cuáles usas de verdad.',
      para: 'Con esto sé dónde buscar a tus próximos clientes',
      items: [
        { v: 'WhatsApp', emoji: '💬', t: 'Por WhatsApp', sub: 'Le vendes a quien te escribe directo' },
        { v: 'Instagram', emoji: '📸', t: 'Por Instagram', sub: 'Publicas y te llegan mensajes' },
        { v: 'TikTok', emoji: '🎵', t: 'Por TikTok', sub: 'Vídeos cortos de lo que haces' },
        { v: 'Facebook o Marketplace', emoji: '🛒', t: 'Facebook o Marketplace', sub: 'Grupos, página o anuncios de venta' },
        { v: 'En persona', emoji: '🤝', t: 'En persona', sub: 'Tianguis, bazares, puerta con puerta' },
        { v: 'De boca en boca', emoji: '🗣️', t: 'De boca en boca', sub: 'Te recomiendan tus propios clientes' }
      ] },

    { id: 'nombreNegocio',
      guarda: 'core.name', modo: 'escribe', fase: 'pronto', peso: 80,
      ico: '🏪', etiqueta: 'Nombre del negocio',
      q: '¿Cómo se llama tu negocio?',
      chispa: 'Si todavía no tiene nombre, no pasa nada. Se lo ponemos después.',
      para: 'Con esto dejo de decir "tu negocio" y digo el suyo',
      ph: 'Luz de Casa', max: 48 },

    /* ==============================================================
       FASE 3 — LUEGO. Lo que afina de verdad, cuando ya hay confianza.
       ============================================================== */

    { id: 'frecuencia',
      guarda: 'decision:frecuencia', modo: 'rapidas', fase: 'luego', peso: 10,
      requiere: ['cliente'],
      ico: '🔁', etiqueta: 'Cada cuánto te compran',
      q: '¿Cada cuánto te compra un cliente?',
      chispa: 'Es la pregunta que decide si buscar clientes nuevos o cuidar los tuyos.',
      para: 'Con esto sé si tu negocio vive de repetir o de encontrar',
      opciones: [
        { key: 'unica', emoji: '1️⃣', title: 'Una sola vez' },
        { key: 'mes', emoji: '📅', title: 'Cada mes' },
        { key: 'temporada', emoji: '🍂', title: 'Cada temporada' },
        { key: 'semana', emoji: '⚡', title: 'Cada semana' }
      ] },

    { id: 'avanceOferta',
      guarda: 'decision:avanceOferta', modo: 'escala', fase: 'luego', peso: 20,
      requiere: ['oferta'],
      ico: '📦', etiqueta: 'Qué tan lista está tu oferta',
      q: '¿Qué tan lista está tu oferta?',
      chispa: 'Sin exagerar ni castigarte. Donde estés está bien.',
      para: 'Con esto sé cuál es tu siguiente paso de verdad',
      escala: {
        izq: 'Ni la he pensado', der: 'Lista para vender',
        pasos: [
          { v: '1', cara: '😴', t: 'Ni la he pensado', dice: 'Empezamos por lo primero: qué vendes y a quién.' },
          { v: '2', cara: '🙂', t: 'La tengo en la cabeza', dice: 'La tienes en la cabeza. Toca escribirla en una frase.' },
          { v: '3', cara: '😊', t: 'A medias', dice: 'La tienes a medias: sabes qué vendes, falta ponerle precio.' },
          { v: '4', cara: '😎', t: 'Casi lista', dice: 'Casi. Lo que queda es probarla con alguien que pague.' },
          { v: '5', cara: '🚀', t: 'Lista para vender', dice: 'Lista. Ahora el trabajo es venderla, no mejorarla más.' }
        ] } },

    { id: 'precio',
      guarda: 'metric:precio', modo: 'escribe', fase: 'luego', peso: 30,
      requiere: ['oferta'], etapas: ['operating', 'growing'], numero: true,
      ico: '🏷️', etiqueta: 'Precio de venta',
      q: '¿A qué precio vendes hoy?',
      chispa: 'Más o menos. Con eso ya puedo calcularte margen y punto de equilibrio.',
      para: 'Con esto calculo si tu precio te deja ganar',
      ph: '450' },

    { id: 'diferencia',
      guarda: 'decision:diferencia', modo: 'completa', fase: 'luego', peso: 40,
      requiere: ['oferta', 'cliente'],
      ico: '✨', etiqueta: 'Qué te hace distinto',
      q: '¿Qué te hace distinto?',
      chispa: 'Toca los huecos. Yo pongo las opciones y tú eliges.',
      para: 'Con esto escribo tu pitch sin inventarme nada',
      completa: {
        plantilla: 'Lo mío es distinto porque {porque}, y eso al cliente le importa porque {importa}.',
        huecos: {
          porque: { label: 'Qué haces distinto', ops: [
            'lo hago totalmente a la medida',
            'entrego más rápido que nadie',
            'uso mejores materiales',
            'lo explico y acompaño de principio a fin',
            'cuesta menos por lo mismo',
            'lo hago yo, a mano, una por una'
          ] },
          importa: { label: 'Por qué le importa', ops: [
            'se lleva algo que nadie más tiene',
            'no tiene que esperar semanas',
            'le dura de verdad',
            'no se equivoca al comprar',
            'le cuadra el presupuesto',
            'siente que compró algo con historia'
          ] }
        } } },

    { id: 'obstaculo',
      guarda: 'decision:obstaculo', modo: 'tarjetas', fase: 'luego', peso: 50,
      ico: '🧱', etiqueta: 'Lo que más te frena',
      q: '¿Qué es lo que más te frena ahora?',
      chispa: 'Dímelo sin rodeos. Es lo que voy a atacar primero.',
      para: 'Con esto elijo qué desafío ponerte esta semana',
      opciones: [
        { key: 'clientes', emoji: '🔍', title: 'No llegan clientes', sub: 'Publico y no pasa nada.' },
        { key: 'precio', emoji: '🏷️', title: 'No sé qué cobrar', sub: 'Me da miedo pasarme o quedarme corto.' },
        { key: 'tiempo', emoji: '⏰', title: 'No me alcanza el tiempo', sub: 'Entre el trabajo y esto, no llego.' },
        { key: 'dinero', emoji: '💸', title: 'No tengo con qué empezar', sub: 'Necesito material o herramienta.' },
        { key: 'miedo', emoji: '😰', title: 'Me frena vender', sub: 'Me cuesta ofrecer y pedir dinero.' }
      ] },

    { id: 'marca',
      guarda: 'core.brandVoice', modo: 'tarjetas', fase: 'luego', peso: 60,
      opcionesDe: 'PERSONALIDADES',
      ico: '🎨', etiqueta: 'Cómo suena tu marca',
      q: '¿Cómo quieres que suene tu negocio?',
      chispa: 'No cambia lo que vendes. Cambia cómo lo cuentas.',
      para: 'Con esto escribo tus textos con tu tono, no con el mío' },

    { id: 'lugar',
      guarda: 'core.place', modo: 'escribe', fase: 'luego', peso: 70,
      ico: '📌', etiqueta: 'Dónde vendes',
      q: '¿En qué ciudad o zona vendes?',
      chispa: 'Solo la zona. Ni dirección ni nada parecido.',
      para: 'Con esto te propongo sitios reales donde buscar clientes',
      ph: 'Guadalajara, zona centro', max: 48 },

    { id: 'competencia',
      guarda: 'decision:competencia', modo: 'voz', fase: 'luego', peso: 80,
      requiere: ['oferta'],
      ico: '👀', etiqueta: 'Tu competencia',
      q: '¿Quién más vende algo parecido?',
      chispa: 'Cuéntamelo hablando. Que haya competencia es buena señal.',
      para: 'Con esto te digo dónde puedes ganarles sin bajar el precio',
      ph: 'Hay dos tiendas en el centro y varias páginas que venden lo mismo pero sin personalizar…',
      min: 3, largo: true },

    { id: 'costo',
      guarda: 'metric:costoVariable', modo: 'escribe', fase: 'luego', peso: 90,
      requiere: ['oferta'], etapas: ['operating', 'growing'], numero: true,
      ico: '🧾', etiqueta: 'Costo por unidad',
      q: '¿Cuánto te cuesta producir una?',
      chispa: 'Solo materiales y lo que gastas por cada una. Los gastos fijos van aparte.',
      para: 'Con esto y tu precio sé cuánto te queda de verdad',
      ph: '120' }
  ];

  /* Búsqueda por id. La usan captura.js y el verificador. */
  var POR_ID = {};
  PREGUNTAS.forEach(function (p) { POR_ID[p.id] = p; });

  w.PREGUNTAS = PREGUNTAS;
  w.PREGUNTA_POR_ID = POR_ID;

  /* Las cuatro del registro, en orden. onboarding.js las lee de aquí para no
     tener una segunda lista que se desincronice. */
  w.PREGUNTAS_REGISTRO = PREGUNTAS
    .filter(function (p) { return p.fase === 'registro'; })
    .sort(function (a, b) { return a.peso - b.peso; })
    .map(function (p) { return p.id; });
})(window);
