/* ==========================================================================
   PERFIL DEL EMPRENDIMIENTO — la fuente de contexto de toda la app

   Todo lo que la app genera (lecciones, desafíos, misiones, recomendaciones,
   paneles) sale de aquí. El perfil se organiza en tres niveles:

     NIVEL 1  core        La idea registrada al entrar: qué vende, a quién,
                          en qué etapa está, qué quiere lograr y con qué cuenta.
     NIVEL 2  decisions   Lo que el usuario ha decidido después: respuestas de
                          misiones, secciones del expediente, revisiones del
                          mentor. Es lo que impide volver a preguntar de cero.
     NIVEL 3  plan        Objetivos, tareas pendientes y resultados logrados.

   Se guarda como un mapa de emprendimientos desde el primer día aunque solo
   haya uno activo: añadir varios después es cambiar `activeId`, no migrar.

   COMPATIBILIDAD: nunca se sube Store `v`. Los guardados antiguos entran por
   merge(), no traen `ventures`, y se migran desde `profile` + `dossier` sin
   tocar XP, racha, lecciones ni insignias.
   ========================================================================== */
(function (w) {
  'use strict';

  var MAX_CACHE = 40;          // entradas de contenido generado que se guardan
  var DEFAULT_ID = 'v1';

  /* ==================================================================
     TABLAS DE LECTURA
     ================================================================== */

  var STAGE_TEXT = {
    idea:      'solo tiene la idea, todavía no vende',
    starting:  'está comenzando: prepara el arranque o hizo sus primeras ventas',
    operating: 'ya está operando y vende con cierta regularidad',
    growing:   'ya vende y ahora quiere crecer'
  };

  var STAGE_SHORT = {
    idea: 'Solo la idea', starting: 'Comenzando',
    operating: 'Operando', growing: 'Creciendo'
  };

  /* Las tablas de arriba están en tercera persona porque su destino es el
     contexto que lee la IA ("el usuario está comenzando"). Lo que se pinta en
     pantalla necesita segunda persona, así que va aparte: mezclarlas producía
     frases como "Tu objetivo es conseguir su primer cliente". */
  var STAGE_YOU = {
    idea:      'estás con la idea, todavía sin vender',
    starting:  'estás comenzando',
    operating: 'ya estás operando',
    growing:   'ya vendes y quieres crecer'
  };

  var GOAL_TEXT = {
    validar:  'comprobar si su idea funciona antes de invertir',
    primera:  'conseguir su primer cliente que pague',
    vender:   'vender más y con más constancia',
    ordenar:  'ordenar el negocio y controlar sus números',
    escalar:  'crecer, delegar y escalar'
  };

  var GOAL_YOU = {
    validar:  'comprobar si tu idea funciona antes de invertir',
    primera:  'conseguir tu primer cliente que pague',
    vender:   'vender más y con más constancia',
    ordenar:  'ordenar tu negocio y controlar tus números',
    escalar:  'crecer, delegar y escalar'
  };

  var EXP_YOU = {
    none: 'sin haber vendido antes',
    some: 'con algo de experiencia vendiendo',
    lots: 'con experiencia vendiendo'
  };

  var BUDGET_TEXT = {
    none: 'sin presupuesto', low: 'menos de $2,000',
    mid: 'entre $2,000 y $20,000', high: 'más de $20,000'
  };

  /* La misma cifra, redactada para poder ir detrás de "con" o de "un
     presupuesto de": "con sin presupuesto" no se puede escribir. */
  var BUDGET_AMOUNT = {
    none: 'cero pesos', low: 'menos de $2,000',
    mid: 'entre $2,000 y $20,000', high: 'más de $20,000'
  };

  var EXP_TEXT = {
    none: 'nunca ha vendido nada',
    some: 'ha vendido algo, pero sin método',
    lots: 'tiene experiencia vendiendo'
  };

  /* Secciones del expediente que valen como decisión tomada. */
  var DECISION_LABEL = {
    idea:      'Idea en una frase',
    problema:  'Problema que resuelve',
    cliente:   'Cliente ideal',
    oferta:    'Oferta',
    precio:    'Costos y precio',
    identidad: 'Identidad y pitch',
    canales:   'Dónde vende',
    ventas:    'Proceso de ventas',
    numeros:   'Números del negocio',
    procesos:  'Proceso clave',
    clientes:  'Primeros clientes',
    plan:      'Plan de 90 días'
  };

  /* Palabras que delatan el sector cuando no se pregunta explícitamente. */
  var SECTOR_HINTS = {
    hechoamano: ['3d', 'impresion 3d', 'impresión', 'artesan', 'resina', 'madera', 'carpinter',
                 'coser', 'costur', 'tejid', 'bordad', 'joyer', 'vela', 'jabon', 'jabón',
                 'lampara', 'lámpara', 'mueble', 'manualidad', 'fabric', 'taller', 'grabado'],
    comida:     ['pastel', 'reposter', 'panader', 'comida', 'cocina', 'postre', 'galleta',
                 'cafe', 'café', 'bebida', 'jugo', 'catering', 'almuerzo', 'taco', 'pizza',
                 'snack', 'dulce', 'chocolate', 'helado', 'restaurante'],
    servicios:  ['servicio', 'limpieza', 'reparacion', 'reparación', 'clase', 'curso presencial',
                 'belleza', 'uñas', 'unas', 'cabello', 'barber', 'masaje', 'jardiner',
                 'plomer', 'electricista', 'mudanza', 'fotograf', 'evento', 'asesor',
                 'consultor', 'contab', 'entrenador', 'terapia', 'veterinar'],
    digital:    ['app', 'software', 'pagina web', 'página web', 'sitio web', 'diseño grafico',
                 'diseño gráfico', 'marketing', 'redes sociales', 'curso en linea',
                 'curso en línea', 'ebook', 'plantilla digital', 'saas', 'programacion',
                 'programación', 'community manager', 'edicion de video', 'edición de video'],
    reventa:    ['revend', 'reventa', 'importa', 'mayoreo', 'tienda en linea', 'tienda en línea',
                 'dropship', 'catalogo', 'catálogo', 'ropa', 'zapato', 'accesorio', 'abarrote',
                 'distribu', 'compro y vendo']
  };

  /* La unidad de venta se incrusta en frases enteras, así que no basta con la
     palabra: hace falta su plural y su género, o salen cosas como "un pieza",
     "cuántos piezas" o "piezas vendidos". */
  var SECTOR_UNIT = {
    hechoamano: { s: 'pieza',    p: 'piezas',    art: 'una', det: 'la', q: 'cuántas', vend: 'vendidas' },
    comida:     { s: 'pedido',   p: 'pedidos',   art: 'un',  det: 'el', q: 'cuántos', vend: 'vendidos' },
    servicios:  { s: 'servicio', p: 'servicios', art: 'un',  det: 'el', q: 'cuántos', vend: 'vendidos' },
    digital:    { s: 'proyecto', p: 'proyectos', art: 'un',  det: 'el', q: 'cuántos', vend: 'vendidos' },
    reventa:    { s: 'producto', p: 'productos', art: 'un',  det: 'el', q: 'cuántos', vend: 'vendidos' },
    otro:       { s: 'venta',    p: 'ventas',    art: 'una', det: 'la', q: 'cuántas', vend: 'hechas' }
  };

  /* ==================================================================
     UTILIDADES DE TEXTO
     ================================================================== */

  function txt(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }

  /* Palabras con las que una frase no puede terminar: al recortar, "lámparas
     personalizadas con" queda colgando y se lee mal en mitad de una oración. */
  var COLGANTES = ['con', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
                   'y', 'e', 'o', 'u', 'ni', 'en', 'a', 'al', 'para', 'por', 'que', 'como',
                   'sin', 'sobre', 'desde', 'hasta', 'se', 'su', 'sus', 'lo', 'le', 'les',
                   'mi', 'mis', 'tu', 'tus', 'donde', 'cuando'];

  /** Recorta sin partir palabras, sin puntuación colgando y sin dejar la frase
      terminada en una preposición o un artículo. */
  function shorten(s, max) {
    s = txt(s);
    var cut = s;
    if (s.length > max) {
      cut = s.slice(0, max);
      var sp = cut.lastIndexOf(' ');
      if (sp > max * 0.55) cut = cut.slice(0, sp);
    }
    var recortado = cut.length < s.length;
    cut = cut.replace(/[.,;:\-–—]+$/, '').trim();

    var partes = cut.split(' ');
    while (partes.length > 2 &&
           COLGANTES.indexOf(partes[partes.length - 1].toLowerCase()) >= 0) {
      partes.pop();
    }
    cut = partes.join(' ');

    // Al recortar puede quedar una subordinada empezada y sin terminar
    // ("personas de 25 a 40 años que acaban"). Se cierra antes del "que".
    if (recortado) {
      var m = /^(.*)\s(que|donde|porque|cuando)\s(\S+(?:\s\S+)?)$/i.exec(cut);
      if (m && m[1].split(' ').length >= 3) cut = m[1];
    }
    return cut.replace(/[.,;:\-–—]+$/, '').trim();
  }

  /** Quita el arranque en primera persona: "vendo lámparas" -> "lámparas". */
  function stripLead(s) {
    var out = txt(s);
    var patrones = [
      /^(yo\s+)?(quiero\s+)?(vender|vendo|ofrecer|ofrezco|hacer|hago|fabricar|fabrico|crear|creo|producir|produzco|dar|doy|brindar|brindo|montar|poner)\s+/i,
      /^(mi\s+(idea|negocio|producto|servicio)\s+(es|seria|sería)\s*:?\s*)/i,
      /^(se\s+trata\s+de\s+)/i,
      /^(es\s+un[ao]?\s+)/i,
      /^(un[ao]?s?\s+|el\s+|la\s+|los\s+|las\s+)/i
    ];
    for (var i = 0; i < patrones.length; i++) {
      var antes = out;
      out = out.replace(patrones[i], '');
      // Si el recorte deja menos de dos palabras, no valía la pena.
      if (out.split(' ').filter(Boolean).length < 2) { out = antes; break; }
    }
    return out.trim();
  }

  /** Quita el "a quién": "a mamás jóvenes" -> "mamás jóvenes". */
  function stripAudienceLead(s) {
    var out = txt(s);
    out = out.replace(/^(les?\s+vendo\s+a\s+|mis?\s+clientes?\s+(son|es)\s+|se\s+lo\s+vendo\s+a\s+|para\s+|a\s+)/i, '');
    return out.trim();
  }

  /** Minúscula inicial para poder incrustar la frase dentro de otra oración. */
  function lowerFirst(s) {
    s = txt(s);
    if (!s) return s;
    // "SEO" o "3D" al inicio se dejan como están.
    if (/^[A-ZÁÉÍÓÚÑ0-9]{2,}\b/.test(s)) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  function norm(s) {
    return txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function wordCount(s) { return txt(s) ? txt(s).split(' ').length : 0; }

  /* ==================================================================
     MODELO
     ================================================================== */

  function blank(id) {
    return {
      id: id || DEFAULT_ID,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rev: 1,
      core: {
        name: '',            // nombre del negocio (opcional)
        idea: '',            // la idea en sus palabras
        offer: '',           // qué producto o servicio vende
        customer: '',        // a quién se lo vende
        stage: '',           // idea | starting | operating | growing
        goalKey: '',         // validar | primera | vender | ordenar | escalar
        goalText: '',        // el objetivo en sus palabras (opcional)
        sector: '',          // clave de sector (elegida en el registro)
        brandVoice: '',      // clave de CONFIG.PERSONALIDADES (opcional)
        place: '',           // ciudad o zona (opcional)
        resources: { budget: '', time: null, experience: '', assets: '' }
      },
      /* Cómo se ve la app para este emprendimiento. Vive dentro del venture a
         propósito: al registrar una idea nueva, startOver() lo borra con todo
         lo demás y no queda una apariencia hablando del negocio anterior.
         Lo mantiene js/core/persona.js; aquí solo se declara y se persiste. */
      persona: {
        v: 1,
        temaId: null,        // null = derivar del sector. Clave de CONFIG.TEMAS
        temaFuente: 'auto',  // 'auto' | 'usuario'
        intensidad: 'media', // 'sutil' | 'media' | 'visible'
        capas: null,         // null = las del tema. Si el usuario las tocó, su mapa
        panel: null,         // null = orden por defecto. Si no, array de ids
        propuesta: null      // clasificación sugerida pendiente de aceptar
      },
      decisions: {},         // clave -> { key, label, value, from, at, score }
      objectives: [],        // { id, text, metric, due, done, at }
      tasks: [],             // { id, text, from, done, at }
      results: [],           // { id, text, kind, at }
      metrics: {},           // precio, costo, clientes… en números
      generated: {},         // clave -> { text, at, rev, model }
      intake: { done: false, asked: [], skipped: [] }
    };
  }

  function store() { return w.Store.state; }

  function bag() {
    var s = store();
    if (!s.ventures || typeof s.ventures !== 'object') s.ventures = { activeId: null, list: {} };
    if (!s.ventures.list || typeof s.ventures.list !== 'object') s.ventures.list = {};
    return s.ventures;
  }

  /** Rellena huecos de un objeto guardado con la forma actual del modelo. */
  function hydrate(v) {
    var base = blank(v.id || DEFAULT_ID);
    // Las plantillas se guardan antes de copiar: `out` y `base` son el mismo
    // objeto, así que leerlas después devolvería ya los datos del guardado.
    var coreBase = base.core;
    var resBase = base.core.resources;
    var intakeBase = base.intake;
    var personaBase = base.persona;
    var out = base, k;
    for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = v[k];
    out.core = merge(coreBase, v.core || {});
    out.core.resources = merge(resBase, (v.core && v.core.resources) || {});
    /* merge() ignora null y '' del guardado, y `persona` los usa como valores
       legítimos ("todavía sin decidir"). Se copia campo a campo respetándolos,
       y así un campo nuevo del modelo llega igual a los perfiles ya guardados. */
    out.persona = hydratePersona(personaBase, v.persona);
    out.decisions = v.decisions || {};
    out.objectives = v.objectives || [];
    out.tasks = v.tasks || [];
    out.results = v.results || [];
    out.metrics = v.metrics || {};
    out.generated = v.generated || {};
    out.intake = merge(intakeBase, v.intake || {});
    out.intake.done = !!(v.intake && v.intake.done);
    out.rev = v.rev || 1;
    return out;
  }

  function merge(base, over) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) {
      if (!Object.prototype.hasOwnProperty.call(over, k)) continue;
      if (over[k] !== undefined && over[k] !== null && over[k] !== '') out[k] = over[k];
    }
    return out;
  }

  /** Como merge(), pero conservando null y '' cuando el guardado los trae:
      en `persona` significan "sin decidir todavía", no "falta el dato". */
  function hydratePersona(base, saved) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    if (!saved || typeof saved !== 'object') return out;
    for (k in out) {
      if (!Object.prototype.hasOwnProperty.call(out, k)) continue;
      if (Object.prototype.hasOwnProperty.call(saved, k) && saved[k] !== undefined) out[k] = saved[k];
    }
    return out;
  }

  var _cache = null;   // objeto activo ya hidratado

  /** El emprendimiento activo. Siempre devuelve uno: si no hay, lo crea. */
  function active() {
    var b = bag();
    var id = b.activeId;
    if (id && b.list[id]) {
      if (!_cache || _cache.id !== id || _cache !== b.list[id]) {
        b.list[id] = hydrate(b.list[id]);
        _cache = b.list[id];
      }
      return _cache;
    }
    return ensure();
  }

  /** Garantiza que existe un emprendimiento activo, migrando si hace falta. */
  function ensure() {
    var b = bag();
    if (b.activeId && b.list[b.activeId]) {
      b.list[b.activeId] = hydrate(b.list[b.activeId]);
      _cache = b.list[b.activeId];
      return _cache;
    }
    var v = migrateFromProfile();
    b.list[v.id] = v;
    b.activeId = v.id;
    _cache = v;
    w.Store.save();
    return v;
  }

  /** Construye el perfil desde los datos viejos: nadie pierde lo que ya tenía. */
  function migrateFromProfile() {
    var s = store();
    var v = blank(DEFAULT_ID);
    var p = s.profile || {};

    v.core.name = txt(p.businessName);
    v.core.idea = txt(p.idea);
    v.core.sector = txt(p.sector);
    v.core.resources.budget = txt(p.budget);
    v.core.resources.time = p.time || null;
    v.core.resources.experience = txt(p.knowledge);

    // El diagnóstico viejo (goal) es lo más cercano a la etapa.
    if (p.goal === 'business') v.core.stage = 'operating';
    else if (p.goal === 'idea') v.core.stage = 'starting';
    else if (p.goal === 'zero') v.core.stage = 'idea';

    if (p.goal === 'business') v.core.goalKey = 'vender';
    else if (p.goal === 'idea') v.core.goalKey = 'validar';
    else if (p.goal === 'zero') v.core.goalKey = 'primera';

    // Las secciones ya escritas del expediente son decisiones tomadas.
    var d = s.dossier || {}, k;
    for (k in d) {
      if (!Object.prototype.hasOwnProperty.call(d, k) || !d[k]) continue;
      var val = flatten(d[k].answers);
      if (!val) continue;
      v.decisions[k] = {
        key: k, label: DECISION_LABEL[k] || k, value: val,
        from: d[k].from || 'expediente', at: d[k].at || Date.now(),
        score: d[k].score == null ? null : d[k].score
      };
      if (k === 'cliente' && !v.core.customer) v.core.customer = shorten(val, 120);
      if (k === 'oferta' && !v.core.offer) v.core.offer = shorten(val, 120);
      if (k === 'idea' && !v.core.idea) v.core.idea = shorten(val, 160);

      // Las cifras que ya declaró en el expediente se recuperan también: sin
      // ellas el análisis de costos diría "faltan datos" teniéndolos delante.
      var a = d[k].answers;
      if (a && typeof a === 'object') {
        ['precio', 'costo', 'fijos', 'ingresos', 'gastos', 'unidades', 'clientes', 'inversion']
          .forEach(function (campo) {
            if (a[campo] == null || a[campo] === '' || v.metrics[campo] != null) return;
            var n = parseFloat(String(a[campo]).replace(/[^0-9.,-]/g, '').replace(',', '.'));
            if (!isNaN(n)) v.metrics[campo] = n;
          });
      }
    }

    // Ya venía usando la app: no se le trata como usuario nuevo, pero sí se le
    // ofrece completar lo que el perfil nuevo necesita.
    v.intake.done = !!s.onboarded && !!v.core.idea;
    v.migratedFrom = s.onboarded ? 'perfil-anterior' : null;
    return v;
  }

  function flatten(answers) {
    if (!answers) return '';
    if (typeof answers === 'string') return txt(answers);
    var out = [];
    for (var k in answers) {
      if (!Object.prototype.hasOwnProperty.call(answers, k)) continue;
      if (answers[k]) out.push(txt(answers[k]));
    }
    return out.join(' · ');
  }

  /* ==================================================================
     ESCRITURA
     ================================================================== */

  /** Muta el emprendimiento activo, sube la revisión y persiste. */
  function set(fn, reason) {
    var v = active();
    w.Store.set(function () {
      fn(v);
      v.updatedAt = Date.now();
      v.rev = (v.rev || 1) + 1;
      bag().list[v.id] = v;
    }, reason || 'venture');
    mirrorProfile();
    return v;
  }

  /** Cambia campos del núcleo. Acepta rutas planas: {'resources.budget': 'low'} */
  function patchCore(patch) {
    return set(function (v) {
      for (var k in patch) {
        if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
        var val = patch[k];
        if (k.indexOf('resources.') === 0) v.core.resources[k.slice(10)] = val;
        else v.core[k] = val;
      }
      if (!v.core.sector) v.core.sector = guessSector(v);
    }, 'venture-core');
  }

  /* ==================================================================
     APARIENCIA — la lee y la escribe js/core/persona.js
     ================================================================== */

  function persona() { return active().persona; }

  /** Cambia la apariencia guardada. Ojo: `set()` sube `rev` y eso marca como
      obsoleta toda la caché generada, así que solo debe llamarse desde un
      gesto del usuario o del arranque, nunca desde un render. */
  function setPersona(patch) {
    return set(function (v) {
      for (var k in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k)) v.persona[k] = patch[k];
      }
    }, 'venture-persona');
  }

  /** El resto de la app (ruta, liga, barra superior) sigue leyendo `profile`. */
  function mirrorProfile() {
    var v = active();
    var s = store();
    if (!s.profile) return;
    s.profile.idea = v.core.idea || s.profile.idea;
    s.profile.businessName = v.core.name || s.profile.businessName;
    s.profile.sector = v.core.sector || s.profile.sector;
    if (v.core.resources.budget) s.profile.budget = v.core.resources.budget;
    if (v.core.resources.time) s.profile.time = v.core.resources.time;
    if (v.core.resources.experience) s.profile.knowledge = v.core.resources.experience;
    if (v.core.stage) {
      s.profile.goal = (v.core.stage === 'operating' || v.core.stage === 'growing')
        ? 'business'
        : (v.core.stage === 'idea' && !v.core.idea ? 'zero' : 'idea');
    }
    w.Store.save();
  }

  function guessSector(v) {
    var t = norm([v.core.idea, v.core.offer, v.core.customer].join(' '));
    if (!t) return '';
    var best = '', bestScore = 0;
    for (var key in SECTOR_HINTS) {
      if (!Object.prototype.hasOwnProperty.call(SECTOR_HINTS, key)) continue;
      var score = 0;
      SECTOR_HINTS[key].forEach(function (h) { if (t.indexOf(norm(h)) >= 0) score++; });
      if (score > bestScore) { bestScore = score; best = key; }
    }
    return bestScore > 0 ? best : 'otro';
  }

  /* ==================================================================
     NIVEL 2 — DECISIONES
     ================================================================== */

  function recordDecision(key, value, meta) {
    if (!key || !txt(value)) return null;
    meta = meta || {};
    set(function (v) {
      v.decisions[key] = {
        key: key,
        label: meta.label || DECISION_LABEL[key] || key,
        value: shorten(value, 600),
        from: meta.from || 'app',
        at: Date.now(),
        score: meta.score == null ? null : meta.score
      };
    }, 'venture-decision');
    avisarAvance(key);
    return active().decisions[key];
  }

  /* Un avance del negocio —no una lección, ni una racha, ni puntos— puede dar
     pie a una publicación. Se avisa desde aquí porque este es el único sitio
     por el que pasan todas las decisiones, vengan del registro, de una misión,
     del mentor o de Chispa.

     Diferido y encolado: la celebración del logro va primero y no se pisa. Y
     envuelto, porque si compartir fallara no puede llevarse por delante el
     guardado de la decisión, que es lo importante. */
  var avisoPendiente = null;

  function avisarAvance(key) {
    if (!w.CompartirAvance || !w.Comparte || !w.LOGROS_COMPARTIBLES) return;
    // Solo las claves con un visual definido; las sintéticas (mision:*,
    // reflexion:*) no son avances presentables por sí solas.
    var l = (w.LOGROS_COMPARTIBLES.LOGROS || []).filter(function (x) { return x.id === key; })[0];
    if (!l) return;

    /* Agrupado. Terminar el registro o una misión guarda varias decisiones
       seguidas, y una invitación por cada una sería insufrible. Se espera a
       que pare de llegar y se ofrece UNA, la del avance más alto que ya tenga
       todos sus datos. */
    if (avisoPendiente) w.clearTimeout(avisoPendiente);
    avisoPendiente = w.setTimeout(function () {
      avisoPendiente = null;
      try {
        var mejor = w.Comparte.disponibles()[0];   // ya vienen del más avanzado al más básico
        if (mejor) w.CompartirAvance.ofrecer(mejor.id);
      } catch (e) { console.warn('[comparte]', e); }
    }, 1400);
  }

  function decision(key) { return active().decisions[key] || null; }

  function decisionList() {
    var v = active(), out = [];
    for (var k in v.decisions) {
      if (Object.prototype.hasOwnProperty.call(v.decisions, k)) out.push(v.decisions[k]);
    }
    out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return out;
  }

  /** Ha decidido algo sobre este tema: el mentor no debe volver a preguntarlo. */
  function knows(key) {
    var d = decision(key);
    if (d && txt(d.value)) return true;
    if (key === 'cliente') return !!txt(active().core.customer);
    if (key === 'oferta') return !!txt(active().core.offer);
    if (key === 'idea') return !!txt(active().core.idea);
    return false;
  }

  /** Entrada única para todo lo que el usuario responde dentro de la app. */
  function absorb(source, answers, meta) {
    meta = meta || {};
    var value = flatten(answers);
    if (!value) return;

    var key = meta.dossier || meta.key || ('mision:' + (meta.id || source));
    recordDecision(key, value, {
      label: meta.label || DECISION_LABEL[meta.dossier] || meta.title || null,
      from: source, score: meta.score
    });

    // Números sueltos que sirven para calcular después.
    if (answers && typeof answers === 'object') {
      var nums = {};
      ['precio', 'costo', 'fijos', 'ingresos', 'gastos', 'unidades', 'clientes', 'inversion']
        .forEach(function (k) {
          var raw = answers[k];
          if (raw == null || raw === '') return;
          var n = parseFloat(String(raw).replace(/[^0-9.,-]/g, '').replace(',', '.'));
          if (!isNaN(n)) nums[k] = n;
        });
      if (Object.keys(nums).length) {
        set(function (v) {
          for (var k in nums) if (Object.prototype.hasOwnProperty.call(nums, k)) v.metrics[k] = nums[k];
        }, 'venture-metrics');
      }
    }

    // Un reto real completado es un resultado, no solo una respuesta.
    if (meta.boss) addResult((meta.title || 'Reto real') + ' completado', 'reto');

    // Datos del núcleo que estaban vacíos y ahora ya se conocen.
    var patch = {};
    if (meta.dossier === 'cliente' && !txt(active().core.customer)) patch.customer = shorten(value, 140);
    if (meta.dossier === 'oferta' && !txt(active().core.offer)) patch.offer = shorten(value, 140);
    if (meta.dossier === 'idea' && !txt(active().core.idea)) patch.idea = shorten(value, 180);
    if (Object.keys(patch).length) patchCore(patch);
  }

  /* ==================================================================
     NIVEL 3 — OBJETIVOS, TAREAS Y RESULTADOS
     ================================================================== */

  function uid(p) { return p + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

  function addObjective(text, metric, due) {
    if (!txt(text)) return null;
    var o = { id: uid('obj'), text: shorten(text, 200), metric: txt(metric), due: txt(due), done: false, at: Date.now() };
    set(function (v) { v.objectives.push(o); }, 'venture-objective');
    return o;
  }

  function addTask(text, from) {
    if (!txt(text)) return null;
    var v = active();
    // No se duplican tareas idénticas propuestas dos veces por el mentor.
    var yaEsta = v.tasks.filter(function (t) { return norm(t.text) === norm(text) && !t.done; }).length;
    if (yaEsta) return null;
    var t = { id: uid('task'), text: shorten(text, 200), from: from || 'app', done: false, at: Date.now() };
    set(function (vv) { vv.tasks.push(t); }, 'venture-task');
    return t;
  }

  function toggleItem(list, id) {
    set(function (v) {
      (v[list] || []).forEach(function (x) {
        if (x.id === id) { x.done = !x.done; x.doneAt = x.done ? Date.now() : null; }
      });
    }, 'venture-' + list);
  }

  function removeItem(list, id) {
    set(function (v) {
      v[list] = (v[list] || []).filter(function (x) { return x.id !== id; });
    }, 'venture-' + list);
  }

  function addResult(text, kind) {
    if (!txt(text)) return null;
    var r = { id: uid('res'), text: shorten(text, 200), kind: kind || 'hito', at: Date.now() };
    set(function (v) {
      v.results.push(r);
      if (v.results.length > 60) v.results = v.results.slice(-60);
    }, 'venture-result');
    return r;
  }

  function openTasks() {
    return active().tasks.filter(function (t) { return !t.done; });
  }

  /* ==================================================================
     LÉXICO — los términos del usuario que se inyectan en toda la app
     ================================================================== */

  var VAGO = /\b(todos|todo el mundo|cualquiera|la gente|publico en general|publico general)\b/;

  /** ¿El dato del registro se quedó corto o dijo "todos"? */
  function esVago(s) {
    var n = norm(s);
    return !n || wordCount(n) < 4 || VAGO.test(n);
  }

  /* Si el usuario afinó un dato en una misión, ese es el bueno. Sin esto, quien
     escribió "todos los que quieran una lámpara" en el registro seguiría viendo
     esa frase en todos los desafíos aunque después definiera su cliente bien. */
  function mejorDato(coreVal, decisionKey) {
    var d = active().decisions[decisionKey];
    if (!d || !txt(d.value)) return coreVal;
    if (!esVago(coreVal)) return coreVal;
    return txt(d.value).split(' · ')[0];
  }

  /** Qué texto está usando de verdad la app para un campo, y de dónde salió.
      Sirve para que el perfil no mienta cuando una misión mejoró el dato. */
  function effective(field) {
    var c = active().core;
    var mapa = { customer: 'cliente', offer: 'oferta' };
    var clave = mapa[field];
    var original = field === 'customer' ? c.customer : (field === 'offer' ? c.offer : c[field]);
    if (!clave) return { value: original, from: 'registro', overridden: false };
    var usado = mejorDato(original || '', clave);
    return {
      value: usado,
      from: usado === original ? 'registro' : ((active().decisions[clave] || {}).from || 'app'),
      overridden: usado !== original
    };
  }

  /** Busca en un catálogo de CONFIG sin romperse si aún no está cargado:
      venture.js corre antes que algunas pantallas y `terms()` se llama pronto. */
  function catalogo(nombre, key) {
    var list = (w.CONFIG && w.CONFIG[nombre]) || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return {};
  }

  function sectorMeta(key) { return catalogo('SECTORS', key); }
  function personalidadMeta(key) { return catalogo('PERSONALIDADES', key); }

  function terms() {
    var v = active();
    var c = v.core;

    var productoLargo = stripLead(mejorDato(c.offer || c.idea || '', 'oferta'));
    var clienteLargo = stripAudienceLead(mejorDato(c.customer || '', 'cliente'));

    var sector = c.sector || 'otro';
    var U = SECTOR_UNIT[sector] || SECTOR_UNIT.otro;
    // 34 caracteres es el punto donde una descripción típica ("lámparas de mesa
    // impresas en 3D") cabe entera; por debajo se perdía la parte que la
    // distingue de cualquier otro producto.
    var producto = productoLargo ? lowerFirst(shorten(productoLargo, 56)) : 'tu producto o servicio';
    var productoCorto = productoLargo ? lowerFirst(shorten(productoLargo, 34)) : 'lo que vendes';
    var cliente = clienteLargo ? lowerFirst(shorten(clienteLargo, 56)) : 'tus clientes';
    var clienteCorto = clienteLargo ? lowerFirst(shorten(clienteLargo, 34)) : 'tu cliente';

    return {
      tiene: {
        producto: !!productoLargo,
        cliente: !!clienteLargo,
        idea: !!txt(c.idea),
        nombre: !!txt(c.name),
        lugar: !!txt(c.place)
      },
      negocio: txt(c.name) || 'tu negocio',
      idea: txt(c.idea) || 'tu idea',
      ideaCorta: shorten(c.idea || '', 90) || 'tu idea',
      producto: producto,
      productoCorto: productoCorto,
      // "tus lámparas" / "tu servicio de limpieza": sirve para hablar en posesivo.
      tuProducto: productoLargo ? ('tus ' + lowerFirst(shorten(productoLargo, 40))) : 'lo que vendes',
      cliente: cliente,
      clienteCorto: clienteCorto,
      tuCliente: clienteLargo ? lowerFirst(shorten(clienteLargo, 40)) : 'tu cliente ideal',
      unidad: U.s,
      unidades: U.p,
      unaUnidad: U.art + ' ' + U.s,        // "una pieza" / "un pedido"
      laUnidad: U.det + ' ' + U.s,         // "la pieza"  / "el pedido"
      cuantasUnidades: U.q + ' ' + U.p,    // "cuántas piezas" / "cuántos pedidos"
      unidadesVendidas: U.p + ' ' + U.vend,
      sector: sector,
      sectorTitulo: sectorMeta(sector).title,
      sectorEmoji: sectorMeta(sector).emoji,
      // La personalidad de marca: cómo quiere que le suene el negocio.
      personalidad: personalidadMeta(c.brandVoice).title,
      personalidadKey: txt(c.brandVoice),
      tono: personalidadMeta(c.brandVoice).tono,
      lugar: txt(c.place),
      etapa: c.stage || '',
      etapaCorta: STAGE_SHORT[c.stage] || 'Sin definir',
      // En segunda persona: estos términos se pintan en pantalla.
      etapaTexto: STAGE_YOU[c.stage] || '',
      objetivo: txt(c.goalText) || GOAL_YOU[c.goalKey] || '',
      objetivoKey: c.goalKey || '',
      presupuesto: BUDGET_AMOUNT[c.resources.budget] || '',
      presupuestoKey: c.resources.budget || '',
      minutos: c.resources.time || null,
      experiencia: EXP_YOU[c.resources.experience] || '',
      precio: v.metrics.precio || null,
      costo: v.metrics.costo || null
    };
  }

  /* ==================================================================
     COMPLETITUD DEL PERFIL
     ================================================================== */

  var FIELDS = [
    { key: 'idea',       label: '¿Cuál es tu idea de negocio?',   peso: 3, get: function (c) { return c.idea; } },
    { key: 'offer',      label: '¿Qué producto o servicio ofreces?', peso: 3, get: function (c) { return c.offer; } },
    { key: 'customer',   label: '¿A qué clientes quieres venderles?', peso: 3, get: function (c) { return c.customer; } },
    { key: 'sector',     label: '¿A qué se dedica tu negocio?',    peso: 2, get: function (c) { return c.sector; } },
    { key: 'stage',      label: '¿En qué etapa estás?',            peso: 2, get: function (c) { return c.stage; } },
    { key: 'goalKey',    label: '¿Cuál es tu objetivo principal?', peso: 2, get: function (c) { return c.goalKey || c.goalText; } },
    { key: 'budget',     label: '¿Con qué presupuesto cuentas?',   peso: 1, get: function (c) { return c.resources.budget; } },
    { key: 'time',       label: '¿Cuánto tiempo tienes al día?',   peso: 1, get: function (c) { return c.resources.time; } },
    { key: 'experience', label: '¿Cuánta experiencia tienes?',     peso: 1, get: function (c) { return c.resources.experience; } },
    { key: 'name',       label: '¿Cómo se llama tu negocio?',      peso: 1, opcional: true, get: function (c) { return c.name; } },
    { key: 'place',      label: '¿En qué ciudad o zona vendes?',   peso: 1, opcional: true, get: function (c) { return c.place; } },
    { key: 'brandVoice', label: '¿Cómo quieres que suene tu marca?', peso: 1, opcional: true, get: function (c) { return c.brandVoice; } }
  ];

  function completeness() {
    var c = active().core;
    var total = 0, hecho = 0, faltan = [];
    FIELDS.forEach(function (f) {
      total += f.peso;
      var val = f.get(c);
      if (val !== null && val !== undefined && txt(val)) hecho += f.peso;
      else faltan.push(f);
    });
    return {
      pct: total ? Math.round((hecho / total) * 100) : 0,
      missing: faltan,
      // Lo que de verdad hace falta para que la personalización sea buena.
      esenciales: faltan.filter(function (f) { return !f.opcional; })
    };
  }

  function fields() { return FIELDS; }

  /* ==================================================================
     RESUMEN LEGIBLE
     ================================================================== */

  function summary() {
    var t = terms();
    var v = active();
    var partes = [];

    if (t.tiene.producto) {
      partes.push((t.tiene.nombre ? t.negocio + ' vende ' : 'Vendes ') + t.producto);
    } else if (t.tiene.idea) {
      partes.push('Tu idea: ' + t.ideaCorta);
    } else {
      return 'Todavía no has registrado tu idea. Complétala para que todo lo que ves aquí hable de tu negocio.';
    }

    if (t.tiene.cliente) partes.push('a ' + t.cliente);
    if (t.lugar) partes.push('en ' + t.lugar);

    var frase = partes.join(' ') + '.';
    if (t.etapaTexto) frase += ' Ahora mismo ' + t.etapaTexto + '.';
    if (t.objetivo) frase += ' Tu objetivo es ' + t.objetivo + '.';

    var recursos = [];
    if (t.minutos) recursos.push(t.minutos + ' minutos al día');
    if (t.presupuesto) recursos.push('un presupuesto de ' + t.presupuesto);
    if (recursos.length) {
      frase += ' Cuentas con ' + recursos.join(' y ') + (t.experiencia ? ', ' + t.experiencia : '') + '.';
    } else if (t.experiencia) {
      frase += ' Empiezas ' + t.experiencia + '.';
    }

    var d = decisionList().length;
    if (d) frase += ' Llevas ' + d + (d === 1 ? ' decisión tomada' : ' decisiones tomadas') + ' en la app.';
    return frase;
  }

  /* ==================================================================
     CONTEXTO PARA LA IA — los tres niveles, siempre juntos
     ================================================================== */

  function levelOne() {
    var v = active(), c = v.core, L = [];
    L.push('NIVEL 1 — LA IDEA REGISTRADA POR EL USUARIO');
    if (c.name) L.push('Nombre del negocio: ' + c.name);
    L.push('Idea: ' + (c.idea || '(no la ha escrito todavía)'));
    L.push('Producto o servicio: ' + (c.offer || '(sin definir)'));
    L.push('Clientes a los que quiere vender: ' + (c.customer || '(sin definir)'));
    L.push('Etapa: ' + (STAGE_TEXT[c.stage] || '(sin definir)'));
    L.push('Objetivo principal: ' + (c.goalText || GOAL_TEXT[c.goalKey] || '(sin definir)'));
    var r = c.resources;
    L.push('Recursos: presupuesto ' + (BUDGET_TEXT[r.budget] || 'sin definir') +
           '; tiempo ' + (r.time ? r.time + ' min/día' : 'sin definir') +
           '; experiencia: ' + (EXP_TEXT[r.experience] || 'sin definir') +
           (r.assets ? '; con lo que ya cuenta: ' + r.assets : ''));
    if (c.place) L.push('Zona: ' + c.place);
    if (c.sector) L.push('Sector: ' + (sectorMeta(c.sector).title || c.sector));
    if (c.brandVoice) {
      var pm = personalidadMeta(c.brandVoice);
      L.push('Cómo quiere que suene su marca: ' + (pm.title || c.brandVoice) +
             (pm.tono ? ' — escribe en un tono ' + pm.tono + '.' : ''));
    }
    return L.join('\n');
  }

  function levelTwo() {
    var L = ['NIVEL 2 — DECISIONES QUE YA TOMÓ (no volver a preguntarlas desde cero)'];
    var list = decisionList();
    if (!list.length) {
      L.push('Todavía no ha tomado ninguna decisión dentro de la app.');
      return L.join('\n');
    }
    list.slice(0, 18).forEach(function (d) {
      L.push('· ' + (d.label || d.key) + ': ' + shorten(d.value, 300) +
             (d.score != null ? ' [evaluación ' + d.score + '/100]' : ''));
    });
    var v = active();
    var m = [];
    for (var k in v.metrics) {
      if (Object.prototype.hasOwnProperty.call(v.metrics, k)) m.push(k + '=' + v.metrics[k]);
    }
    if (m.length) L.push('Cifras que ya declaró: ' + m.join(', ') + '.');
    return L.join('\n');
  }

  function levelThree() {
    var v = active();
    var L = ['NIVEL 3 — OBJETIVOS, TAREAS Y RESULTADOS'];
    var objs = v.objectives.filter(function (o) { return !o.done; });
    if (objs.length) {
      L.push('Objetivos abiertos:');
      objs.slice(0, 6).forEach(function (o) {
        L.push('· ' + o.text + (o.metric ? ' (medida: ' + o.metric + ')' : '') + (o.due ? ' — para ' + o.due : ''));
      });
    } else L.push('Sin objetivos escritos todavía.');

    var tasks = openTasks();
    if (tasks.length) {
      L.push('Tareas pendientes:');
      tasks.slice(0, 8).forEach(function (t) { L.push('· ' + t.text); });
    }

    var res = v.results.slice(-6).reverse();
    if (res.length) {
      L.push('Resultados logrados:');
      res.forEach(function (r) { L.push('· ' + r.text); });
    }

    try {
      var prog = w.Engine.overallProgress();
      L.push('Progreso de la ruta: ' + prog.done + ' de ' + prog.total + ' paradas.');
      var dm = w.Engine.dailyMission();
      if (dm) L.push('Le toca ahora: ' + dm.title + (dm.sub ? ' (' + dm.sub + ')' : ''));
      var pend = completeness();
      if (pend.esenciales.length) {
        L.push('Datos del perfil que aún faltan: ' +
               pend.esenciales.map(function (f) { return f.label; }).join(' ') );
      }
    } catch (e) {}

    return L.join('\n');
  }

  /** El bloque completo que se antepone a cualquier tarea de IA. */
  function contextText() {
    return [
      levelOne(), '', levelTwo(), '', levelThree(), '',
      'CÓMO USAR ESTE CONTEXTO',
      '· Todo lo que escribas debe hablar de ESTE negocio: nombra su producto, sus',
      '  clientes, su etapa y sus recursos. Nada de consejos genéricos de manual.',
      '· Si algo ya está decidido en el nivel 2, no lo vuelvas a preguntar: úsalo o',
      '  ayúdale a mejorarlo, y nunca lo contradigas sin decir por qué cambiarías.',
      '· Ajusta el esfuerzo a su tiempo y a su presupuesto reales.',
      '· Si falta un dato del nivel 1 para responder bien, pide solo ese dato.'
    ].join('\n');
  }

  /* ==================================================================
     CACHÉ DE CONTENIDO GENERADO
     ================================================================== */

  function cacheGet(key) {
    var v = active();
    var hit = v.generated[key];
    if (!hit) return null;
    // Se devuelve aunque esté vieja: mejor contenido de hace dos revisiones que
    // nada. `stale` le dice a quien la pide si conviene regenerarla.
    return { text: hit.text, at: hit.at, stale: hit.rev !== v.rev, model: hit.model };
  }

  function cacheSet(key, text, model) {
    if (!txt(text)) return;
    set(function (v) {
      v.generated[key] = { text: text, at: Date.now(), rev: v.rev + 1, model: model || null };
      var keys = Object.keys(v.generated);
      if (keys.length > MAX_CACHE) {
        keys.sort(function (a, b) { return (v.generated[a].at || 0) - (v.generated[b].at || 0); });
        for (var i = 0; i < keys.length - MAX_CACHE; i++) delete v.generated[keys[i]];
      }
    }, 'venture-cache');
  }

  function clearCache() {
    set(function (v) { v.generated = {}; }, 'venture-cache');
  }

  /** Tira una entrada concreta para forzar que se vuelva a generar. */
  function cacheInvalidate(key) {
    set(function (v) { delete v.generated[key]; }, 'venture-cache');
  }

  /* ==================================================================
     CAMBIO DE IDEA
     ================================================================== */

  /** Cambia la idea sin borrar el progreso: solo caduca lo generado. */
  function reframe(patch) {
    patchCore(patch);
    clearCache();
    addResult('Actualizaste la idea de tu emprendimiento', 'cambio');
    return active();
  }

  /** Reinicia el emprendimiento activo dejando intacto XP, racha e insignias. */
  function startOver() {
    var b = bag();
    var id = b.activeId || DEFAULT_ID;
    var v = blank(id);
    w.Store.set(function () { b.list[id] = v; b.activeId = id; }, 'venture-reset');
    _cache = v;
    return v;
  }

  /* ==================================================================
     API
     ================================================================== */

  w.Venture = {
    STAGE_TEXT: STAGE_TEXT, STAGE_SHORT: STAGE_SHORT, GOAL_TEXT: GOAL_TEXT,
    DECISION_LABEL: DECISION_LABEL,

    ensure: ensure, active: active, set: set, patchCore: patchCore,
    mirrorProfile: mirrorProfile, guessSector: guessSector,
    persona: persona, setPersona: setPersona,

    terms: terms, summary: summary, completeness: completeness, fields: fields,
    effective: effective,

    recordDecision: recordDecision, decision: decision, decisions: decisionList,
    knows: knows, absorb: absorb,

    addObjective: addObjective, addTask: addTask, addResult: addResult,
    openTasks: openTasks,
    toggle: toggleItem, remove: removeItem,

    levelOne: levelOne, levelTwo: levelTwo, levelThree: levelThree,
    contextText: contextText,

    cacheGet: cacheGet, cacheSet: cacheSet, clearCache: clearCache,
    cacheInvalidate: cacheInvalidate,

    reframe: reframe, startOver: startOver,

    util: { txt: txt, shorten: shorten, stripLead: stripLead, lowerFirst: lowerFirst,
            norm: norm, words: wordCount, flatten: flatten }
  };
})(window);
