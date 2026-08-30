/* ==========================================================================
   PLAZA — EL MOTOR DE LAS RAZONES

   Plaza no enseña emprendimientos al azar. Cada tarjeta trae escrito por qué
   podría haber algo entre esos dos negocios, y ese porqué sale de aquí.

   La regla que ordena todo lo demás: SI NO HAY RAZÓN, NO HAY TARJETA. Es
   preferible una plaza que dice "hoy no encontré nada" a una que rellena el
   hueco con cualquiera. El día que Plaza sea capaz de decir "hoy no", el día
   que diga "mira este" se le podrá creer.

   NADA DE ESTO LO ESCRIBE UN MODELO
   Las tablas son cerradas y están escritas a mano, y las frases también. Un
   motivo redactado por una IA es una opinión con formato de motivo: suena
   igual de seguro tanto si acertó como si se lo inventó. Aquí, si el motivo
   dice "le habla a la misma gente que tú", es porque dos conjuntos de
   palabras se cruzaron de verdad.

   NINGUNA FRASE PROMETE NADA
   Ni una venta, ni una respuesta, ni un resultado. Todas dicen *podría*,
   *puede*, *se parecen*. Es la misma regla que dejó fuera la intención de
   vender en js/data/logros-compartibles.js.

   CORRE EN EL TELÉFONO
   Sin servidor y sin dependencias: enums contra tablas, bolsas de palabras e
   intersecciones de conjuntos. La firma de cada vitrina se calcula una vez y
   se guarda en la propia vitrina bajo `__f`.

   HOY NO HAY A QUIÉN RECOMENDAR. No existe todavía el sitio donde vivan las
   vitrinas de otras personas, así que Plaza.vecinos() devuelve una lista
   vacía y este motor no llega a pintar nada. Está escrito y probado antes
   porque es lo que decide si Plaza vale la pena, y porque el día que lleguen
   los vecinos no debería estrenarse código sin rodar.
   ========================================================================== */
(function (w) {
  'use strict';

  /* ==================================================================
     TABLAS
     ================================================================== */

  /* Lo que un sector PUEDE dar. Etiquetas cerradas. */
  var CAPACIDAD = {
    hechoamano: ['producto-fisico', 'personalizado', 'regalo', 'empaque'],
    comida:     ['producto-fisico', 'evento', 'regalo', 'cerca'],
    servicios:  ['servicio', 'manos', 'cerca', 'mantenimiento'],
    digital:    ['marca', 'contenido', 'web', 'publicidad', 'sistema'],
    reventa:    ['surtido', 'proveeduria', 'envio', 'producto-fisico'],
    /* 'otro' no tiene tabla a propósito, igual que en venture-templates:
       quien no sabe de qué es su negocio no debería recibir un motivo
       deducido de un sector que no eligió. */
    otro:       []
  };

  /* Lo que un negocio NECESITA de OTRO NEGOCIO según dónde está.

     Solo capacidades concretas. "Una opinión" y "que alguien lo pruebe" NO
     están aquí, aunque sean justo lo que más falta hace al principio: no las
     da un sector, las da cualquier persona, y ningún CAPACIDAD las provee.
     Puestas aquí eran un hueco que no encajaba con nada — y a la vez
     inflaban la señal de necesidad hasta que «podrían necesitar lo que tú
     haces» salía en tres de cada cuatro tarjetas.

     Esas dos necesidades tienen sus propios motivos, que es donde deben
     estar: `puedeProbarte` para quien encaja con tu cliente, y `mismaEtapa`
     para quien está pasando por lo mismo.

     Por eso `idea` no necesita nada de nadie: quien todavía está con la idea
     no necesita un proveedor, necesita que alguien la mire. */
  var NECESIDAD = {
    idea:      [],
    starting:  ['marca', 'web', 'empaque', 'proveeduria'],
    operating: ['publicidad', 'contenido', 'proveeduria', 'envio', 'sistema', 'surtido'],
    growing:   ['sistema', 'publicidad', 'envio', 'proveeduria', 'contenido', 'manos']
  };

  /* Capacidades que el texto libre añade por encima de las del sector. Mismo
     formato que SECTOR_HINTS (js/core/venture.js:111). */
  var CAPACIDAD_HINTS = {
    marca:       ['logo', 'identidad', 'branding', 'marca', 'diseno grafico', 'diseño grafico'],
    web:         ['pagina web', 'página web', 'sitio web', 'tienda en linea', 'landing', 'ecommerce'],
    contenido:   ['contenido', 'fotograf', 'video', 'redes sociales', 'community', 'copy'],
    publicidad:  ['publicidad', 'anuncios', 'ads', 'campana', 'campaña', 'marketing'],
    empaque:     ['empaque', 'etiqueta', 'packaging', 'caja', 'bolsa'],
    envio:       ['envio', 'envío', 'logistica', 'mensajeria', 'reparto', 'entrega'],
    sistema:     ['software', 'app', 'sistema', 'automatiza', 'plantilla', 'inventario'],
    proveeduria: ['mayoreo', 'insumo', 'materia prima', 'proveedor', 'distribu'],
    manos:       ['maquila', 'produccion', 'producción', 'ayudante', 'taller']
  };

  /* Fuerza con que dos sectores se acompañan. 0 = no se declara nada. */
  var COMPLEMENTA = {
    hechoamano: { comida: 0.7, servicios: 0.5, digital: 0.9, reventa: 0.8 },
    comida:     { hechoamano: 0.7, servicios: 0.8, digital: 0.9, reventa: 0.5 },
    servicios:  { hechoamano: 0.5, comida: 0.8, digital: 0.9, reventa: 0.4 },
    digital:    { hechoamano: 0.9, comida: 0.9, servicios: 0.9, reventa: 0.7 },
    reventa:    { hechoamano: 0.8, comida: 0.5, servicios: 0.4, digital: 0.7 },
    otro:       {}
  };

  /* Arquetipo de público: si dos "clientes" son la misma gente aunque no
     compartan ni una palabra. */
  var ARQUETIPO = {
    negocios: ['negocio', 'emprend', 'empresa', 'pyme', 'marca', 'tienda', 'local', 'restaurante'],
    familias: ['familia', 'mama', 'papa', 'hijo', 'nino', 'bebe', 'madre', 'padre'],
    jovenes:  ['joven', 'universitar', 'estudiante', 'adolescen'],
    eventos:  ['boda', 'novia', 'novio', 'cumple', 'fiesta', 'evento', 'graduacion', 'bautizo'],
    oficina:  ['oficina', 'trabaja', 'empleado', 'profesional', 'ejecutiv'],
    hogar:    ['casa', 'hogar', 'departamento', 'decora', 'renta', 'mudanza', 'cocina'],
    mascotas: ['perro', 'gato', 'mascota', 'peludo', 'veterinar'],
    salud:    ['salud', 'fitness', 'dieta', 'gimnasio', 'bienestar', 'terapia']
  };

  var ETAPA_N = { idea: 1, starting: 2, operating: 3, growing: 4 };

  /* Los seis pesos suman 100. Los ajustes posteriores recortan a [0, 100]. */
  var PESO = {
    necesidad: 34, publico: 22, complemento: 16, etapa: 12, problema: 10, probable: 6
  };

  /* El motor recorre estos umbrales hasta juntar tarjetas suficientes. Nunca
     baja del último: por debajo de 28 el motivo deja de ser un motivo y la
     tarjeta pasaría a ser relleno. */
  var MINIMOS = [46, 36, 28];

  /* Palabras que no distinguen a nadie. Las primeras son gramática; las
     últimas son las que el mentor ya trata como huecas ("gente", "personas",
     "todos"), porque un cliente descrito así no se cruza con nada. */
  var STOP = ('de la que el en y a los del se las por un para con no una su al lo como mas ' +
    'pero sus le ya o este si porque esta entre cuando muy sin sobre tambien me hasta hay ' +
    'donde quien desde todo nos durante todos uno les ni contra otros ese eso mi antes ' +
    'algunos tipo tipos gente personas cosas anos años quiere quieren').split(' ');

  var ES_STOP = {};
  for (var _i = 0; _i < STOP.length; _i++) ES_STOP[STOP[_i]] = 1;

  /* ==================================================================
     TEXTO

     norm() sale de Venture cuando está cargado. La copia local existe para
     que tools/check-motor.js pueda ejecutar el motor en node sin arrastrar
     el perfil entero, y para que el motor no se caiga si alguien lo carga
     antes que venture.js.
     ================================================================== */

  function norm(s) {
    if (w.Venture && w.Venture.util && w.Venture.util.norm) {
      try { return w.Venture.util.norm(s); } catch (e) { /* sigue abajo */ }
    }
    return String(s == null ? '' : s).trim().replace(/\s+/g, ' ')
      .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /** Bolsa de palabras útiles: {palabra: 1}. Descarta las vacías y las de
      menos de tres letras, que solo producen cruces por casualidad. */
  function fichas(texto) {
    var out = {};
    var partes = norm(texto).replace(/[^a-z0-9ñ ]/g, ' ').split(' ');
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i];
      if (p.length < 3 || ES_STOP[p]) continue;
      out[p] = 1;
    }
    return out;
  }

  /** Cuántas palabras comparten dos bolsas, sobre la más pequeña. 0 a 1. */
  function cruce(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    if (!ka.length || !kb.length) return 0;
    var corta = ka.length <= kb.length ? ka : kb;
    var larga = ka.length <= kb.length ? b : a;
    var n = 0;
    for (var i = 0; i < corta.length; i++) if (larga[corta[i]]) n++;
    return n / corta.length;
  }

  function contiene(texto, lista) {
    for (var i = 0; i < lista.length; i++) {
      if (texto.indexOf(lista[i]) >= 0) return true;
    }
    return false;
  }

  /* ==================================================================
     LA FIRMA DE UNA VITRINA

     Se calcula una vez y se guarda en la propia vitrina bajo `__f`. Sesenta
     vitrinas se perfilan en una pasada, y a partir de ahí cada recomendación
     es aritmética sobre las firmas.
     ================================================================== */

  function perfilar(v) {
    if (!v) return null;
    if (v.__f) return v.__f;

    var etapa = ETAPA_N[v.etapa] ? v.etapa : 'idea';
    var sector = CAPACIDAD[v.sector] ? v.sector : 'otro';

    var textoTodo = norm([v.producto, v.idea, v.valor, v.problema].join(' '));

    /* Lo que puede dar: lo de su sector, más lo que delate su propio texto. */
    var puede = {};
    var base = CAPACIDAD[sector];
    for (var i = 0; i < base.length; i++) puede[base[i]] = 1;
    for (var etiqueta in CAPACIDAD_HINTS) {
      if (!Object.prototype.hasOwnProperty.call(CAPACIDAD_HINTS, etiqueta)) continue;
      if (contiene(textoTodo, CAPACIDAD_HINTS[etiqueta])) puede[etiqueta] = 1;
    }

    /* Lo que necesita: lo propio de su etapa. Quien está con la idea o
       comenzando necesita además que alguien lo pruebe y le opine, y eso no
       lo da un sector: lo da cualquiera. */
    var necesita = {};
    var n = NECESIDAD[etapa];
    for (var j = 0; j < n.length; j++) necesita[n[j]] = 1;

    var cliente = fichas(v.cliente);
    var arquetipos = {};
    var clienteTexto = norm(v.cliente);
    for (var a in ARQUETIPO) {
      if (!Object.prototype.hasOwnProperty.call(ARQUETIPO, a)) continue;
      if (contiene(clienteTexto, ARQUETIPO[a])) arquetipos[a] = 1;
    }

    v.__f = {
      etapa: etapa,
      etapaN: ETAPA_N[etapa],
      sector: sector,
      puede: puede,
      necesita: necesita,
      cliente: cliente,
      arquetipos: arquetipos,
      problema: fichas([v.problema, v.valor, v.idea].join(' ')),
      producto: fichas([v.producto, v.idea].join(' ')),
      /* Una vitrina a la que le falta la mitad no puede sostener un motivo
         fuerte, por muchas palabras que cruce. */
      completa: (v.producto ? 1 : 0) + (v.cliente ? 1 : 0) +
                (v.problema ? 1 : 0) + (v.valor ? 1 : 0)
    };
    return v.__f;
  }

  /* ==================================================================
     LAS SEIS SEÑALES
     ================================================================== */

  function señales(yo, otro) {
    var A = perfilar(yo), B = perfilar(otro);
    var s = {};

    s.mismoSector = A.sector === B.sector;
    s.mismaEtapa = A.etapa === B.etapa;

    /* 1. Necesidad ↔ capacidad, en las dos direcciones. Guardamos QUÉ encaja,
          no solo cuánto: la dirección decide después qué frase se escribe. */
    s.haciaEllos = [];
    s.haciaTi = [];
    var k;
    for (k in B.necesita) {
      if (Object.prototype.hasOwnProperty.call(B.necesita, k) && A.puede[k]) s.haciaEllos.push(k);
    }
    for (k in A.necesita) {
      if (Object.prototype.hasOwnProperty.call(A.necesita, k) && B.puede[k]) s.haciaTi.push(k);
    }
    /* Dos encajes ya son señal fuerte; a partir de ahí crece poco, porque
       encajar en cinco cosas no significa cinco veces más razón. */
    s.nec = Math.min(1, Math.max(s.haciaEllos.length, s.haciaTi.length) / 2);

    /* 2. Público. Las palabras pesan más que el arquetipo: dos clientes
          descritos igual son la misma gente; dos que solo comparten
          "familias" pueden no serlo. */
    var porPalabra = cruce(A.cliente, B.cliente);
    var porArquetipo = cruce(A.arquetipos, B.arquetipos);
    s.pub = Math.min(1, porPalabra + porArquetipo * 0.5);

    /* 3. Complementariedad de sector. */
    s.comp = (COMPLEMENTA[A.sector] && COMPLEMENTA[A.sector][B.sector]) || 0;

    /* 4. Cercanía de etapa. Alguien tres peldaños por delante no contesta. */
    var dist = Math.abs(A.etapaN - B.etapaN);
    s.eta = dist === 0 ? 1 : (dist === 1 ? 0.6 : 0);

    /* 5. Vocabulario del problema: afinidad real cuando los sectores no se
          parecen en nada. */
    s.pro = cruce(A.problema, B.problema);

    /* 6. Probabilidad de prueba: ¿el otro negocio cabe en la descripción de
          tu cliente? Se mira su producto y su problema contra tu cliente. */
    s.prob = Math.max(cruce(A.cliente, B.producto), cruce(A.cliente, B.problema));
    /* Si tu cliente son negocios y el otro es un negocio, cabe por definición
       aunque no compartan ni una palabra. */
    s.esNegocio = !!A.arquetipos.negocios;

    return s;
  }

  function puntos(s, etapaMia) {
    var p = s.nec * PESO.necesidad +
            s.pub * PESO.publico +
            s.comp * PESO.complemento +
            s.eta * PESO.etapa +
            s.pro * PESO.problema +
            s.prob * PESO.probable;
    return Math.max(0, Math.min(100, Math.round(p)));
  }

  /* ==================================================================
     QUÉ TIPO DE CONEXIÓN ES

     Cinco tipos. `necesita` va en dos direcciones, y por eso "encontrar un
     proveedor" cabe sin inventar un sexto.
     ================================================================== */

  /* Orden de desempate por etapa. Manda sobre la fuerza bruta de la señal:
     quien está con la idea necesita antes una opinión que un proveedor. */
  var PRIORIDAD = {
    idea:      ['mismaEtapa', 'puedeProbarte', 'mismoPublico', 'necesita', 'complementa'],
    starting:  ['puedeProbarte', 'necesita', 'mismoPublico', 'complementa', 'mismaEtapa'],
    operating: ['necesita', 'complementa', 'mismoPublico', 'puedeProbarte', 'mismaEtapa'],
    growing:   ['complementa', 'necesita', 'mismoPublico', 'mismaEtapa', 'puedeProbarte']
  };

  function tipoDe(yo, otro, s) {
    var A = perfilar(yo);
    var cand = [];

    /* Necesita, hacia ellos: tú tienes algo que a ellos les falta. */
    if (s.haciaEllos.length >= 1 && !s.mismoSector) {
      cand.push({ id: 'necesita', dir: 'haciaEllos', fuerza: s.nec * PESO.necesidad });
    }
    /* Necesita, hacia ti: ellos tienen algo que a ti te falta. */
    if (s.haciaTi.length >= 1 && !s.mismoSector) {
      cand.push({ id: 'necesita', dir: 'haciaTi', fuerza: s.nec * PESO.necesidad * 0.9 });
    }

    /* Mismo público, y solo entre sectores distintos. Mismo sector con el
       mismo público no es afinidad: es competencia, y decirle "le habla a la
       misma gente que tú" sería un piropo falso. */
    if (!s.mismoSector && (s.pub >= 0.34 || (s.pub >= 0.2 && s.comp >= 0.5))) {
      cand.push({ id: 'mismoPublico', dir: null, fuerza: s.pub * PESO.publico });
    }

    /* Se complementan: la tabla lo declara Y comparten algo de público. Sin
       lo segundo, "se acompañan bien" sale de una tabla y no de estos dos. */
    if (s.comp >= 0.45 && s.pub >= 0.18) {
      cand.push({ id: 'complementa', dir: null, fuerza: s.comp * PESO.complemento });
    }

    /* Puede probarte: hace falta que tengas algo que probar. */
    if (A.completa >= 3 && (s.prob >= 0.35 || (s.esNegocio && s.prob >= 0.2))) {
      cand.push({ id: 'puedeProbarte', dir: null, fuerza: s.prob * PESO.probable * 2.2 });
    }

    /* Misma etapa: la casilla igual NO basta. Hace falta algo más que los una,
       o "van por donde tú vas" se convierte en el motivo comodín que sale
       siempre y deja de significar nada. */
    if (s.mismaEtapa && (s.mismoSector || s.pub >= 0.2 || s.pro >= 0.2)) {
      cand.push({ id: 'mismaEtapa', dir: null, fuerza: PESO.etapa + s.pro * 8 });
    }

    if (!cand.length) return null;

    var orden = PRIORIDAD[A.etapa] || PRIORIDAD.idea;
    cand.sort(function (x, y) {
      var px = orden.indexOf(x.id), py = orden.indexOf(y.id);
      if (px !== py) return px - py;
      return y.fuerza - x.fuerza;
    });
    return cand[0];
  }

  /* ==================================================================
     LA FRASE

     Tres variantes por tipo, elegidas con un hash de la pareja: la misma
     pareja dice siempre lo mismo, y dos parejas distintas no repiten. Si el
     motivo cambiara al recargar, se notaría que está inventado.
     ================================================================== */

  var PORQUE = {
    'necesita:haciaEllos': [
      'Aquí podrían necesitar lo que tú haces.',
      'Esto que haces les puede hacer falta.',
      'Les falta algo que tú ya sabes hacer.'
    ],
    'necesita:haciaTi': [
      'Aquí puede estar lo que a ti te falta.',
      'Hacen algo que a ti te podría hacer falta.',
      'Esto podría resolverte algo que te falta.'
    ],
    'mismoPublico': [
      'Le habla a la misma gente que tú.',
      'Busca a las mismas personas que tú buscas.',
      'Su cliente y el tuyo se parecen mucho.'
    ],
    'complementa': [
      'Lo tuyo y lo suyo se acompañan bien.',
      'Juntos cubren algo que solos no cubren.',
      'Encajan contigo sin competir por lo mismo.'
    ],
    'puedeProbarte': [
      'Podría ser de los primeros en probarte.',
      'Encaja con la gente para la que trabajas.',
      'Tu producto está pensado para alguien así.'
    ],
    'mismaEtapa': [
      'Va por donde tú vas ahora mismo.',
      'Está en el mismo punto que tú.',
      'Entiende esta etapa porque la está viviendo.'
    ]
  };

  /* Icono de cada motivo. Los seis están dibujados en js/data/iconos.js: uno
     que no lo esté sale con la cara del sistema operativo al lado de dos
     ilustraciones. tools/check-motor.js lo comprueba. */
  var ICONO = {
    'necesita:haciaEllos': '💡',
    'necesita:haciaTi':    '🧩',
    'mismoPublico':        '👥',
    'complementa':         '🧩',
    'puedeProbarte':       '🧪',
    'mismaEtapa':          '🧭'
  };

  /* Hash estable de una cadena. No hace falta que sea bueno, hace falta que
     sea el mismo siempre — Math.random() aquí cambiaría el motivo en cada
     repintado, y un motivo que cambia se lee como inventado. */
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function claveMotivo(tipo) {
    return tipo.dir ? (tipo.id + ':' + tipo.dir) : tipo.id;
  }

  /**
   * La frase del motivo. `desplaza` corre la variante tantos puestos: lo usa
   * recomendar() para que dos tarjetas del mismo motivo en la misma pantalla
   * no digan exactamente lo mismo.
   *
   * Sigue siendo determinista: el desplazamiento sale de la posición de la
   * tarjeta, no del azar, así que la misma plaza se lee siempre igual.
   */
  function porque(tipo, yo, otro, desplaza) {
    var k = claveMotivo(tipo);
    var lista = PORQUE[k];
    if (!lista) return '';
    var semilla = (yo.negocio || yo.producto || '') + '|' + (otro.negocio || otro.producto || '') + '|' + k;
    return lista[(hash(semilla) + (desplaza || 0)) % lista.length];
  }

  /* ==================================================================
     RECOMENDAR
     ================================================================== */

  /**
   * Devuelve las tarjetas ordenadas, con su motivo ya resuelto.
   * opts: { max: 3, excluir: {id:1}, minimo: null }
   *
   * Baja el listón por escalones hasta juntar `max`, pero nunca por debajo
   * del último de MINIMOS. Si con el listón más bajo no sale nada, devuelve
   * una lista vacía y la pantalla dice que hoy no encontró nada — que es la
   * respuesta correcta, no un fallo.
   */
  function recomendar(mia, vecinos, opts) {
    opts = opts || {};
    var max = opts.max || 3;
    var excluir = opts.excluir || {};
    if (!mia || !vecinos || !vecinos.length) return [];

    var evaluadas = [];
    for (var i = 0; i < vecinos.length; i++) {
      var otro = vecinos[i];
      if (!otro || excluir[otro.id]) continue;

      var s = señales(mia, otro);
      var tipo = tipoDe(mia, otro, s);
      if (!tipo) continue;                    // sin tipo no hay razón que contar

      var p = puntos(s, perfilar(mia).etapa);
      /* Una vitrina a medias no puede sostener un motivo fuerte: no se sabe
         lo suficiente de ella como para afirmar nada. */
      if (perfilar(otro).completa <= 2) p = Math.round(p * 0.75);

      evaluadas.push({
        vitrina: otro,
        tipo: tipo.id,
        dir: tipo.dir,
        motivo: claveMotivo(tipo),
        puntos: p,
        __tipo: tipo,
        icono: ICONO[claveMotivo(tipo)] || '💡'
      });
    }

    evaluadas.sort(function (a, b) { return b.puntos - a.puntos; });

    var umbrales = opts.minimo != null ? [opts.minimo] : MINIMOS;
    for (var u = 0; u < umbrales.length; u++) {
      var pasan = evaluadas.filter(function (e) { return e.puntos >= umbrales[u]; });
      if (pasan.length >= max || u === umbrales.length - 1) return redactar(pasan.slice(0, max), mia);
    }
    return [];
  }

  /* La frase se decide al final y no al evaluar, porque hasta que no están
     elegidas las tarjetas no se sabe cuántas comparten motivo.

     Sin esto, tres negocios que de verdad encajan por lo mismo salían con la
     frase idéntica repetida tres veces, y una plaza que dice tres veces
     exactamente lo mismo se lee como una plantilla, no como un motivo. La
     relación es la misma —eso no se toca— pero se cuenta con otras palabras. */
  function redactar(lista, mia) {
    /* Qué variantes se han usado ya, por motivo. Desplazar por la posición
       no bastaba: cada pareja parte de un hash distinto, así que sumarle 1 y
       2 seguía cayendo en la misma casilla. Aquí se lleva la cuenta de
       verdad y se avanza hasta una libre. */
    var usadas = {};

    for (var i = 0; i < lista.length; i++) {
      var k = lista[i].motivo;
      var total = (PORQUE[k] || []).length;
      if (!usadas[k]) usadas[k] = {};

      /* Se arranca donde diría el hash —para que la misma pareja diga
         siempre lo mismo cuando puede— y se avanza solo si está pillada. */
      var base = 0;
      for (var d = 0; d < total; d++) {
        var frase = porque(lista[i].__tipo, mia, lista[i].vitrina, d);
        if (!usadas[k][frase]) { base = d; break; }
        base = d;   // si todas están usadas, se queda con la última
      }

      var texto = porque(lista[i].__tipo, mia, lista[i].vitrina, base);
      usadas[k][texto] = 1;
      lista[i].porque = texto;
      delete lista[i].__tipo;
    }
    return lista;
  }

  /* ==================================================================
     "VEO VALOR": LAS INTENCIONES Y EL PRIMER MENSAJE
     ================================================================== */

  var INTENCIONES = [
    { id: 'probar',    icon: '🧪', label: 'Me gustaría probarlo' },
    { id: 'colaborar', icon: '🤝', label: 'Podríamos colaborar' },
    { id: 'opinar',    icon: '💬', label: 'Quiero darle una opinión' },
    { id: 'me-sirve',  icon: '🌟', label: 'Esto podría servirme' },
    { id: 'conocer',   icon: '👋', label: 'Me interesa conocer más' }
  ];

  /* El mensaje lo firma el usuario, así que ninguna línea puede afirmar algo
     que él no haya dicho. La apertura la elige él —es la intención que
     tocó—, el puente habla solo de SU propio negocio, y el cierre pide sin
     dar nada por hecho.

     Las tres primeras versiones de esta tabla decían cosas como "llevo rato
     buscando a alguien que lo haga" o "soy justo el tipo de persona a la que
     le sirve". Suenan bien y son mentira: eso no está en ningún dato, lo
     dedujo una tabla. Y salía firmado con su nombre hacia una persona real. */
  var APERTURA = {
    probar:     'Hola. Vi lo que estás construyendo y me gustaría probarlo.',
    colaborar:  'Hola. Creo que lo tuyo y lo mío pueden ir juntos.',
    opinar:     'Hola. Vi lo que estás haciendo y tengo una opinión que darte.',
    'me-sirve': 'Hola. Creo que lo que haces me puede servir.',
    conocer:    'Hola. Me llamó la atención lo que estás haciendo.'
  };

  /* El puente dice QUIÉN SOY, nunca qué necesita el otro.

     La primera versión lo hacía al revés: la frase salía del motivo, así que
     una tarjeta de «podría probarte» ponía «creo que podría servirte» — y si
     el usuario había elegido «me gustaría probarlo», el mensaje decía a la
     vez que quiere probar lo del otro y que el otro debería probar lo suyo.
     Dos direcciones opuestas en tres líneas.

     La dirección la pone la intención, que es lo único que el usuario eligió
     de verdad. El motivo solo decide QUÉ dato propio conviene mencionar. Así
     las treinta combinaciones se sostienen. */
  var PUENTE = {
    'necesita:haciaEllos': 'Por mi lado, yo hago {miProducto}.',
    'necesita:haciaTi':    'Por mi lado, yo hago {miProducto}.',
    'mismoPublico':        'Yo le vendo a {miCliente}.',
    'complementa':         'Yo hago {miProducto}, por si encaja con lo tuyo.',
    'puedeProbarte':       'Yo hago {miProducto} para {miCliente}.',
    'mismaEtapa':          'Yo ando con {miProducto}, más o menos por donde tú.'
  };

  var PETICION = {
    probar:     'Si te sirve que alguien lo use y te diga qué tal, aquí estoy.',
    colaborar:  '¿Te late que lo platiquemos sin compromiso?',
    opinar:     'Si te sirve, te la escribo sin filtros.',
    'me-sirve': '¿Me cuentas cómo funciona?',
    conocer:    'Me gustaría saber más antes de proponerte nada.'
  };

  /**
   * El borrador del primer mensaje. Se le entrega al usuario para que lo
   * cambie: Chispa lo escribe y se aparta.
   */
  function primerMensaje(intencion, motivo, mia) {
    /* Recortado: en la vitrina el producto es un renglón que se lee solo,
       pero incrustado dentro de una frase de un mensaje se come la línea. */
    var producto = corto((mia && mia.producto) || (mia && mia.idea) || '', 58);
    var cliente = corto((mia && mia.cliente) || '', 46);

    /* Sin producto o sin cliente, el hueco se rellena con algo que es verdad
       siempre. Nunca con el relleno de Venture.terms() —"tu producto o
       servicio"—, que está escrito en segunda persona y saldría hablándole
       al otro de su propio negocio. */
    var puente = (PUENTE[motivo] || '')
      .replace('{miProducto}', producto || 'lo mío')
      .replace('{miCliente}', cliente || 'gente parecida');

    return [APERTURA[intencion], puente, PETICION[intencion]]
      .filter(Boolean).join('\n');
  }

  /* Recorte sin partir palabras y sin dejar la frase colgando de una
     preposición. Es el mismo criterio que usa la vitrina; aquí se repite en
     corto porque el motor no depende de js/core/plaza.js. */
  var COLGANTES = { de: 1, la: 1, el: 1, para: 1, con: 1, por: 1, y: 1, a: 1, en: 1, que: 1, del: 1 };

  function corto(s, max) {
    s = String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
    if (s.length <= max) return s;
    var cut = s.slice(0, max);
    var sp = cut.lastIndexOf(' ');
    if (sp > max * 0.55) cut = cut.slice(0, sp);

    var partes = cut.split(' ');
    // Terminar en preposición deja la frase colgando: "hechas a mano para".
    while (partes.length > 2 && COLGANTES[partes[partes.length - 1].toLowerCase()]) partes.pop();
    /* Y terminar en "para departamentos" cuando la frase seguía con
       "pequeños" deja un complemento a medias, que se lee peor que no
       ponerlo. Si las dos últimas palabras arrancan con una preposición, se
       van las dos. */
    if (partes.length > 3 && COLGANTES[partes[partes.length - 2].toLowerCase()]) {
      partes.pop(); partes.pop();
    }
    return partes.join(' ').replace(/[.,;:]+$/, '');
  }

  function intencion(id) {
    for (var i = 0; i < INTENCIONES.length; i++) {
      if (INTENCIONES[i].id === id) return INTENCIONES[i];
    }
    return null;
  }

  w.PlazaMotor = {
    recomendar: recomendar,
    perfilar: perfilar,
    porque: porque,
    primerMensaje: primerMensaje,
    intencion: intencion,
    INTENCIONES: INTENCIONES,
    // el contrato, para tools/check-motor.js
    PORQUE: PORQUE,
    ICONO: ICONO,
    APERTURA: APERTURA,
    PUENTE: PUENTE,
    PETICION: PETICION,
    PRIORIDAD: PRIORIDAD,
    MINIMOS: MINIMOS,
    PESO: PESO,
    // solo para las pruebas: deja mirar dentro sin exponer el cálculo
    __senales: señales,
    __tipo: tipoDe,
    __puntos: puntos
  };
})(typeof window !== 'undefined' ? window : this);
