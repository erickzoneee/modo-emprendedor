/* ==========================================================================
   SIMULADOR EMPRESARIAL — configuración y cartas de evento
   ========================================================================== */
(function (w) {
  'use strict';

  var CONFIG = {
    weeks: 12,
    startCash: 12000,
    startInventory: 20,
    startReputation: 62,
    startPrice: 150,
    unitCost: 62,          // costo variable por unidad
    fixedWeekly: 1100,     // renta, servicios, suscripciones
    employeeWeekly: 2400,  // costo semanal por empleado
    refPrice: 150,         // precio de referencia del mercado
    baseDemand: 18,        // demanda semanal base
    maxRep: 100,
    restockLead: 0,        // el material llega la misma semana
    goalProfit: 15000      // utilidad acumulada objetivo
  };

  /* --------------------------------------------------------------------
     Cartas de evento. effects se aplican tras resolver la semana.
     Claves de efecto: cash, rep, inv, demand (multiplicador temporal),
     cost (delta al costo unitario), price (delta forzado), emp
     -------------------------------------------------------------------- */
  var EVENTS = [
    {
      id: 'ev-proveedor', week: [1, 12], icon: '📦', tag: 'Proveedor',
      title: 'Tu proveedor sube el precio',
      text: 'El material sube 20%. Te ofrece mantener el precio anterior si compras el triple de lo que necesitas.',
      options: [
        { t: 'Aceptar el precio nuevo y comprar lo normal', effects: { cost: 8 },
          why: 'Proteges tu efectivo. Tu margen baja un poco, pero mantienes flexibilidad.' },
        { t: 'Comprar el triple para congelar el precio', effects: { cash: -5200, inv: 40, cost: 0 },
          why: 'Ahorras en costo unitario pero congelas efectivo. Riesgoso si la demanda cae.' },
        { t: 'Buscar otro proveedor esta semana', effects: { cost: 3, rep: -2, demand: 0.85 },
          why: 'Ganas margen a medias, pero pierdes una semana de gestión y algo de ritmo.' }
      ]
    },
    {
      id: 'ev-mayorista', week: [3, 12], icon: '🏬', tag: 'Oportunidad',
      title: 'Pedido mayorista',
      text: 'Una tienda quiere 40 piezas con 30% de descuento, pago a 30 días.',
      options: [
        { t: 'Aceptar tal cual', effects: { inv: -40, cash: 0, pending: 40, rep: 3 },
          why: 'Buen volumen, pero el dinero llega en 30 días: cuidado con tu flujo.' },
        { t: 'Aceptar con 50% de anticipo', effects: { inv: -40, cash: 2100, pending: 20, rep: 2 },
          why: 'Negociaste el anticipo: proteges tu flujo sin perder la venta. La mejor jugada.' },
        { t: 'Rechazar: el descuento mata mi margen', effects: { rep: -1 },
          why: 'Válido si tu margen es apretado, pero dejaste ir volumen y presencia.' }
      ]
    },
    {
      id: 'ev-reclamo', week: [2, 12], icon: '😠', tag: 'Reclamación',
      title: 'Un cliente reclama',
      text: 'Una pieza falló a los tres días. El cliente está molesto y tiene muchos seguidores en el grupo local.',
      options: [
        { t: 'Reponer sin costo y agregar un extra', effects: { cash: -180, rep: 9 },
          why: 'Costó poco y convirtió una queja en una recomendación pública. La mejor inversión de la semana.' },
        { t: 'Ofrecer 30% de descuento en su próxima compra', effects: { rep: 1 },
          why: 'Tibio. El cliente sigue con el problema sin resolver.' },
        { t: 'Explicar que fue mal uso y no cubrir nada', effects: { rep: -12, demand: 0.8 },
          why: 'Tener razón y perder reputación es la peor combinación posible.' }
      ]
    },
    {
      id: 'ev-viral', week: [2, 12], icon: '🚀', tag: 'Marketing',
      title: 'Un video se hizo popular',
      text: 'Un video tuyo tuvo mucho alcance. Llegan muchas preguntas y no das abasto.',
      options: [
        { t: 'Aceptar todos los pedidos posibles', effects: { demand: 1.9, rep: -4 },
          why: 'Vendes más, pero si no alcanzas a entregar, la reputación se paga cara.' },
        { t: 'Aceptar solo lo que puedes producir y agendar el resto', effects: { demand: 1.5, rep: 5 },
          why: 'Aprovechas la ola sin romper promesas. Crecimiento sostenible.' },
        { t: 'Subir el precio 20% mientras dura la ola', effects: { demand: 1.25, price: 25, rep: -1 },
          why: 'Aprovechas la demanda para mejorar margen. Funciona si el producto lo justifica.' }
      ]
    },
    {
      id: 'ev-competencia', week: [3, 12], icon: '⚔️', tag: 'Competencia',
      title: 'La competencia baja precios',
      text: 'Un competidor cercano bajó 25% sus precios y lo está anunciando.',
      options: [
        { t: 'Igualar el precio', effects: { price: -35, rep: -2 },
          why: 'Entras en guerra de precios. Ganas volumen y pierdes margen: rara vez sale bien.' },
        { t: 'Mantener precio y reforzar la garantía', effects: { rep: 7, demand: 0.95 },
          why: 'Compites por valor. Pierdes a los cazadores de ofertas y conservas margen.' },
        { t: 'Crear una versión económica más simple', effects: { cash: -900, demand: 1.2, rep: 2 },
          why: 'Atiendes ambos segmentos sin devaluar tu producto principal.' }
      ]
    },
    {
      id: 'ev-empleado', week: [4, 12], icon: '🧑‍🔧', tag: 'Equipo',
      title: '¿Contratar ayuda?',
      text: 'Estás al límite de tu capacidad. Alguien te ofrece trabajar medio tiempo.',
      options: [
        { t: 'Contratarlo', effects: { emp: 1, rep: 2 },
          why: 'Aumentas capacidad, pero sumas un costo fijo semanal: sube tu punto de equilibrio.' },
        { t: 'Probarlo por proyecto una semana', effects: { cash: -900, demand: 1.15 },
          why: 'Prueba de bajo riesgo antes de comprometer un costo fijo. Muy sensato.' },
        { t: 'Seguir solo y rechazar pedidos', effects: { demand: 0.8, rep: -3 },
          why: 'Ahorras dinero pero frenas el crecimiento y decepcionas clientes.' }
      ]
    },
    {
      id: 'ev-maquina', week: [3, 12], icon: '🔧', tag: 'Operación',
      title: 'Se descompuso el equipo',
      text: 'Tu máquina principal falló. Reparación urgente $2,800 o esperar una semana por el servicio barato de $900.',
      options: [
        { t: 'Reparación urgente hoy', effects: { cash: -2800, rep: 2 },
          why: 'Caro, pero no rompes ninguna promesa de entrega.' },
        { t: 'Servicio barato, produzco la próxima semana', effects: { cash: -900, demand: 0.35, rep: -8 },
          why: 'Ahorras $1,900 y pierdes una semana de ventas más reputación. Casi nunca compensa.' },
        { t: 'Subcontratar la producción esta semana', effects: { cash: -1600, cost: 18, rep: 0 },
          why: 'Mantienes las entregas con menos margen. Solución intermedia razonable.' }
      ]
    },
    {
      id: 'ev-descuento', week: [2, 12], icon: '🎟️', tag: 'Ventas',
      title: 'Un cliente pide descuento',
      text: 'Un cliente frecuente pide 20% de descuento por comprar 5 piezas.',
      options: [
        { t: 'Dárselo sin condiciones', effects: { cash: -450, rep: 2 },
          why: 'A partir de hoy ese es su precio. Y se lo contará a otros.' },
        { t: 'Ofrecer 10% si paga de contado hoy', effects: { cash: 520, rep: 3 },
          why: 'Descuento condicionado: mejoras flujo y mantienes margen. Correcto.' },
        { t: 'Negarse', effects: { rep: -3, demand: 0.95 },
          why: 'Proteges margen pero puedes perder a un buen cliente por no ofrecer alternativa.' }
      ]
    },
    {
      id: 'ev-feria', week: [4, 12], icon: '🎪', tag: 'Oportunidad',
      title: 'Feria local',
      text: 'Hay una feria del gremio este fin de semana. El stand cuesta $3,000.',
      options: [
        { t: 'Participar con stand', effects: { cash: -3000, demand: 1.6, rep: 6 },
          why: 'Contacto directo con muchos clientes potenciales. Suele pagarse solo si vas preparado.' },
        { t: 'Ir solo a conocer, sin stand', effects: { demand: 1.1, rep: 2 },
          why: 'Barato: consigues contactos y aprendes de la competencia.' },
        { t: 'No ir', effects: {},
          why: 'Ahorras dinero pero pierdes la oportunidad de conocer a todo el gremio de golpe.' }
      ]
    },
    {
      id: 'ev-efectivo', week: [3, 12], icon: '🚨', tag: 'Finanzas',
      title: 'Te falta efectivo',
      text: 'Tienes que pagar material esta semana y el dinero está en manos de clientes que aún no pagan.',
      options: [
        { t: 'Pedir anticipo a tus clientes actuales', effects: { cash: 2400, rep: -1 },
          why: 'La opción más barata: negociar antes de endeudarte. Casi siempre funciona.' },
        { t: 'Préstamo rápido con interés alto', effects: { cash: 4000, debt: 4800 },
          why: 'Resuelve hoy y te cuesta mañana. Último recurso.' },
        { t: 'Retrasar el pago al proveedor', effects: { cost: 5, rep: -4 },
          why: 'Ganas tiempo pero dañas la relación y probablemente pierdas tu descuento.' }
      ]
    },
    {
      id: 'ev-referido', week: [2, 12], icon: '🤝', tag: 'Clientes',
      title: 'Cliente satisfecho',
      text: 'Un cliente quedó encantado y te pregunta si puede ayudarte en algo.',
      options: [
        { t: 'Pedir una reseña con foto', effects: { rep: 6 },
          why: 'Prueba social gratis que servirá para cerrar decenas de ventas.' },
        { t: 'Pedir un referido con perfil concreto', effects: { demand: 1.25, rep: 3 },
          why: 'Los referidos llegan predispuestos a confiar y regatean menos.' },
        { t: 'Solo agradecer', effects: { rep: 1 },
          why: 'Amable, pero desperdiciaste el mejor momento para pedir algo valioso.' }
      ]
    },
    {
      id: 'ev-temporada', week: [5, 12], icon: '🎄', tag: 'Mercado',
      title: 'Temporada alta',
      text: 'Se acerca la temporada fuerte de tu giro. La demanda va a subir varias semanas.',
      options: [
        { t: 'Comprar inventario extra ahora', effects: { cash: -4200, inv: 60, demand: 1.35 },
          why: 'Preparado para vender sin quedarte sin material. Riesgo controlado si la temporada es real.' },
        { t: 'Subir precios 15% durante la temporada', effects: { price: 20, demand: 1.15 },
          why: 'Aprovechas la demanda alta para mejorar margen. Válido si tu servicio lo respalda.' },
        { t: 'No cambiar nada', effects: { demand: 1.1 },
          why: 'Aprovechas la ola a medias por falta de preparación.' }
      ]
    },
    {
      id: 'ev-copia', week: [5, 12], icon: '🐍', tag: 'Competencia',
      title: 'Te copiaron',
      text: 'Alguien copió tu producto y tu texto de venta casi palabra por palabra, a menor precio.',
      options: [
        { t: 'Bajar tu precio para competir', effects: { price: -30, rep: -2 },
          why: 'Entras a su juego. Es exactamente lo que le conviene a quien copia.' },
        { t: 'Mostrar tu proceso, garantía y clientes reales', effects: { rep: 8, demand: 1.1 },
          why: 'Lo que no se puede copiar es tu historial. Refuerza lo que te hace verificablemente distinto.' },
        { t: 'Denunciarlo públicamente', effects: { rep: -4, demand: 0.95 },
          why: 'Las peleas públicas rara vez benefician a quien las inicia.' }
      ]
    },
    {
      id: 'ev-inventario', week: [4, 12], icon: '🕸️', tag: 'Inventario',
      title: 'Material estancado',
      text: 'Tienes material que lleva 3 meses sin usarse. Ocupa espacio y dinero.',
      options: [
        { t: 'Liquidarlo con 40% de descuento', effects: { cash: 2600, inv: -12, rep: 1 },
          why: 'Recuperas efectivo de dinero que estaba dormido. Buena decisión de flujo.' },
        { t: 'Guardarlo por si acaso', effects: {},
          why: 'Sigue siendo efectivo congelado. “Por si acaso” es caro.' },
        { t: 'Usarlo en un producto nuevo de prueba', effects: { cash: -600, demand: 1.15, rep: 2 },
          why: 'Conviertes material muerto en un experimento barato. Creativo.' }
      ]
    },
    {
      id: 'ev-precio-alto', week: [4, 12], icon: '💬', tag: 'Ventas',
      title: '“Está caro”',
      text: 'Tres clientes seguidos te dijeron que tu precio es alto.',
      options: [
        { t: 'Bajar el precio 15%', effects: { price: -22, demand: 1.15 },
          why: 'Puede que no fuera el precio: quizá el valor no estaba comunicado.' },
        { t: 'Preguntar “¿comparado con qué?” y reforzar el valor', effects: { rep: 5, demand: 1.05 },
          why: 'Diagnosticas antes de ceder margen. Casi siempre el problema es el mensaje, no el precio.' },
        { t: 'Crear una opción básica más barata', effects: { cash: -700, demand: 1.25 },
          why: 'Atiendes a los sensibles al precio sin devaluar tu producto principal.' }
      ]
    },
    {
      id: 'ev-suscripcion', week: [5, 12], icon: '🔁', tag: 'Modelo',
      title: 'Idea de recurrencia',
      text: 'Un cliente te pregunta si ofreces mantenimiento mensual en vez de compras sueltas.',
      options: [
        { t: 'Diseñar un plan mensual y ofrecerlo a 10 clientes', effects: { cash: -400, demand: 1.3, rep: 5 },
          why: 'Ingresos recurrentes: la mejora más valiosa que puede tener un negocio pequeño.' },
        { t: 'Decir que no, prefieres ventas sueltas', effects: {},
          why: 'Dejas ir estabilidad de ingresos por comodidad.' },
        { t: 'Ofrecerlo solo a ese cliente', effects: { cash: 900, rep: 2 },
          why: 'Prueba mínima. Correcto, aunque podrías validar con más clientes a la vez.' }
      ]
    },
    {
      id: 'ev-envio', week: [2, 12], icon: '🚚', tag: 'Operación',
      title: 'Los envíos te están comiendo',
      text: 'Descubres que los envíos te cuestan más de lo que cobras por ellos.',
      options: [
        { t: 'Cobrar el envío real al cliente', effects: { rep: -2, cash: 1400 },
          why: 'Recuperas margen. Puede reducir algo la conversión, pero es lo honesto y sostenible.' },
        { t: 'Ofrecer envío gratis desde cierto monto', effects: { demand: 1.2, cash: 400 },
          why: 'Sube el ticket promedio y el cliente siente que gana. Excelente jugada.' },
        { t: 'Seguir absorbiéndolo', effects: { cash: -1200 },
          why: 'Cada envío te resta utilidad silenciosamente.' }
      ]
    },
    {
      id: 'ev-tiempo', week: [6, 12], icon: '⏳', tag: 'Personal',
      title: 'Estás agotado',
      text: 'Llevas semanas trabajando 14 horas diarias. Tu calidad empieza a fallar.',
      options: [
        { t: 'Tomarte dos días y reorganizar', effects: { demand: 0.85, rep: 4 },
          why: 'Pierdes algo de venta y recuperas calidad y claridad. El agotamiento cuesta más.' },
        { t: 'Contratar ayuda para lo repetitivo', effects: { emp: 1, rep: 3 },
          why: 'Liberas tu tiempo más valioso. Sube tu costo fijo: recalcula el punto de equilibrio.' },
        { t: 'Aguantar y seguir', effects: { rep: -6, demand: 0.95 },
          why: 'La calidad cae, las quejas suben y el desgaste se acumula.' }
      ]
    },
    {
      id: 'ev-empresa', week: [6, 12], icon: '🏢', tag: 'Oportunidad',
      title: 'Cliente empresarial',
      text: 'Una empresa quiere comprarte de forma recurrente. Pide factura y pago a 45 días.',
      options: [
        { t: 'Aceptar y formalizarte', effects: { cash: -1200, demand: 1.4, rep: 6 },
          why: 'Abre un canal completo de clientes que hoy no puedes atender. Vale la inversión.' },
        { t: 'Rechazar por no tener factura', effects: { rep: -2 },
          why: 'Pierdes un cliente recurrente por un trámite que se resuelve en días.' },
        { t: 'Negociar pago a 15 días y aceptar', effects: { cash: -1200, demand: 1.35, rep: 7 },
          why: 'Aceptas el negocio protegiendo tu flujo. La mejor versión de la jugada.' }
      ]
    },
    {
      id: 'ev-calidad', week: [3, 12], icon: '🔍', tag: 'Calidad',
      title: 'Lote con defectos',
      text: 'Detectas que 8 piezas del lote salieron con un defecto pequeño. Nadie lo notaría a simple vista.',
      options: [
        { t: 'Rehacerlas antes de entregar', effects: { cash: -700, rep: 5 },
          why: 'Cuesta hoy y protege tu reputación, que es lo que sostiene tu precio.' },
        { t: 'Entregarlas: no se nota', effects: { rep: -10, demand: 0.85 },
          why: 'Si alguien lo nota, el daño supera con mucho lo que ahorraste.' },
        { t: 'Venderlas como “segunda calidad” con descuento', effects: { cash: 600, rep: 2 },
          why: 'Honesto y rentable: recuperas material sin engañar a nadie.' }
      ]
    },
    {
      id: 'ev-marketing', week: [2, 12], icon: '📣', tag: 'Marketing',
      title: '¿Cuánto inviertes en publicidad?',
      text: 'Tienes efectivo disponible y podrías invertir en anuncios esta semana.',
      options: [
        { t: 'Invertir fuerte: $4,000', effects: { cash: -4000, demand: 1.7 },
          why: 'Gran alcance, pero verifica que tu margen aguante el costo por cliente.' },
        { t: 'Prueba moderada: $1,200 en dos mensajes', effects: { cash: -1200, demand: 1.3, rep: 2 },
          why: 'Prueba controlada con aprendizaje. La forma correcta de empezar.' },
        { t: 'Nada: enfocarme en referidos', effects: { demand: 1.1, rep: 3 },
          why: 'Gratis y efectivo, aunque más lento. Perfecto si tu efectivo está justo.' }
      ]
    },
    {
      id: 'ev-socio', week: [7, 12], icon: '🤝', tag: 'Estrategia',
      title: 'Te proponen sociedad',
      text: 'Alguien quiere entrar como socio aportando $30,000 por el 40% del negocio.',
      options: [
        { t: 'Aceptar: necesito el capital', effects: { cash: 30000, equity: -40 },
          why: 'Resuelve el efectivo, pero entregas casi la mitad de todo lo que construyas después.' },
        { t: 'Proponer préstamo con interés en vez de sociedad', effects: { cash: 20000, debt: 23000 },
          why: 'Conservas el 100% del negocio. Si el negocio ya funciona, casi siempre es mejor.' },
        { t: 'Rechazar y crecer con lo que genera', effects: { rep: 2 },
          why: 'Crecimiento más lento, control total. Perfectamente válido.' }
      ]
    }
  ];

  /* --------------------------------------------------------------------
     Consejos que Chispa da según el estado del simulador
     -------------------------------------------------------------------- */
  var TIPS = [
    { when: function (s) { return s.cash < 2500; },
      msg: 'Tu efectivo está bajo. Pide anticipos o reduce la compra de material antes de invertir en publicidad.' },
    { when: function (s) { return s.inventory <= 3; },
      msg: 'Casi sin inventario. Si llega demanda y no puedes surtir, pierdes ventas y reputación.' },
    { when: function (s) { return s.reputation < 45; },
      msg: 'Tu reputación está dañada. Resolver bien una queja sube más la demanda que cualquier anuncio.' },
    { when: function (s) { return s.price < 100; },
      msg: 'Tu precio está muy cerca del costo. Con ese margen, vender más solo te cansa más.' },
    { when: function (s) { return s.price > 260; },
      msg: 'Precio alto. Funciona solo si tu garantía y tu rapidez lo respaldan de forma visible.' },
    { when: function (s) { return s.inventory > 90; },
      msg: 'Tienes mucho inventario parado: eso es efectivo dormido. Cuidado con quedarte sin liquidez.' },
    { when: function (s) { return s.employees > 0 && s.lastProfit < 0; },
      msg: 'Con empleado y pérdidas, tu punto de equilibrio subió. Necesitas más ventas o mejor margen, ya.' }
  ];

  w.SIM = { CONFIG: CONFIG, EVENTS: EVENTS, TIPS: TIPS };
})(window);
