/* ==========================================================================
   PERSONALIZACIÓN GLOBAL

   Regla de la app: NADA de lo que se genera puede ser genérico. Todo pasa por
   aquí antes de pintarse — desafíos, ejemplos, preguntas de reflexión, retos
   semanales, planes, análisis y recomendaciones.

   Dos capas, en este orden:
     1) DETERMINISTA (siempre): plantillas de js/data/venture-templates.js
        rellenadas con los términos reales del emprendimiento. Sin conexión,
        sin clave de API y sin coste.
     2) IA (opcional): si el usuario activó su clave, se pide una versión mejor
        y se guarda en la caché del perfil. La capa 1 se muestra mientras tanto,
        así que nunca hay pantallas vacías ni esperas.
   ========================================================================== */
(function (w) {
  'use strict';

  var T = w.VENTURE_TEMPLATES;

  function V() { return w.Venture; }
  function terms() { return V().terms(); }

  /** ¿Hay perfil suficiente para que personalizar tenga sentido? */
  function ready() {
    var t = terms();
    return !!(t.tiene.producto || t.tiene.idea || t.tiene.cliente);
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ==================================================================
     SUSTITUCIÓN DE FICHAS EN TEXTO LIBRE
     ================================================================== */

  var TOKENS = ['negocio', 'producto', 'productoCorto', 'tuProducto', 'cliente',
                'tuCliente', 'clienteCorto', 'unidad', 'idea', 'ideaCorta', 'lugar'];

  /** Reemplaza {producto}, {cliente}, {negocio}… en cualquier cadena. */
  function text(str) {
    if (!str) return str;
    var t = terms();
    var out = String(str);
    TOKENS.forEach(function (k) {
      out = out.split('{' + k + '}').join(t[k] || '');
      out = out.split('{' + cap(k) + '}').join(cap(t[k] || ''));
    });
    return out.replace(/\s{2,}/g, ' ').trim();
  }

  /* ==================================================================
     DESAFÍOS Y MISIONES
     ================================================================== */

  function themeFor(mission) {
    if (!mission) return null;
    return T.THEME_BY_ID[mission.id] || mission.dossier || null;
  }

  /** El desafío reescrito sobre el negocio del usuario. */
  function mission(m) {
    var base = { brief: m && m.brief, porque: null, tema: null, fields: m && m.fields, ia: false };
    if (!m || !ready()) return base;

    var tema = themeFor(m);
    var fn = tema && T.BRIEF[tema];
    var t = terms();
    var out = { tema: tema, ia: false };

    if (fn) {
      var r = fn(t);
      out.brief = r.brief;
      out.porque = r.porque;
    } else {
      // Sin plantilla específica: sigue nombrando su negocio, nunca genérico.
      out.brief = m.brief + ' Hazlo pensando en ' + t.tuProducto + ' y en ' + t.cliente + '.';
      out.porque = 'Aplicado a ' + t.negocio + ', en etapa "' + t.etapaCorta.toLowerCase() + '".';
    }
    out.fields = personalizeFields(m.fields, t);

    // Si hay una versión generada por IA guardada, gana.
    var hit = V().cacheGet('mission:' + m.id);
    if (hit && hit.text) { out.brief = hit.text; out.ia = true; out.stale = hit.stale; }
    return out;
  }

  function personalizeFields(fields, t) {
    if (!fields || !fields.length) return fields;
    if (!t.tiene.producto && !t.tiene.cliente) return fields;
    return fields.map(function (f) {
      var maker = T.PLACEHOLDER[f.key];
      if (!maker) return f;
      var copia = {}, k;
      for (k in f) if (Object.prototype.hasOwnProperty.call(f, k)) copia[k] = f[k];
      try { copia.ph = maker(t); } catch (e) {}
      return copia;
    });
  }

  /** Pide a la IA el desafío personalizado. Devuelve promesa o null. */
  function missionAI(m) {
    if (!m || !aiOn()) return null;
    var key = 'mission:' + m.id;
    var hit = V().cacheGet(key);
    if (hit && !hit.stale) return null;                 // ya está y sigue vigente
    var t = terms();
    return w.AI.generate('desafio', {
      instruccion: 'Reescribe este desafío para que hable exclusivamente del negocio del usuario. ' +
        'Debe ser una instrucción accionable de 2 a 3 frases, con una cantidad concreta, ' +
        'mencionando su producto y sus clientes reales. Nada de teoría ni de preámbulos. ' +
        'Responde solo con el texto del desafío.',
      datos: 'Desafío original: "' + (m.brief || m.title) + '"\nTema: ' + (themeFor(m) || 'general') +
             '\nUnidad de venta: ' + t.unidad
    }).then(function (txt) {
      V().cacheSet(key, txt, 'ia');
      return txt;
    });
  }

  /* ==================================================================
     LECCIONES
     ================================================================== */

  /** Bloque "Aplicado a tu idea" que se inserta en cada lección. */
  function example(lesson) {
    if (!lesson || !ready()) return null;
    var key = 'ejemplo:' + lesson.id;
    var hit = V().cacheGet(key);
    if (hit && hit.text) return { text: hit.text, ia: true, stale: hit.stale };
    var fn = T.EXAMPLE_BY_LEVEL[lesson.level];
    if (!fn) return null;
    try { return { text: fn(terms()), ia: false }; } catch (e) { return null; }
  }

  function exampleAI(lesson) {
    if (!lesson || !aiOn()) return null;
    var key = 'ejemplo:' + lesson.id;
    var hit = V().cacheGet(key);
    if (hit && !hit.stale) return null;
    return w.AI.generate('ejemplo', {
      instruccion: 'Escribe un ejemplo de 2 o 3 frases que aplique este concepto al negocio concreto del ' +
        'usuario, con nombres, cantidades o situaciones plausibles de SU caso. Empieza directo, ' +
        'sin "por ejemplo". Responde solo con el ejemplo.',
      datos: 'Lección: ' + lesson.title + '\nConcepto: ' + lesson.concept.title + '\n' +
             (lesson.concept.body || []).join(' ').slice(0, 700)
    }).then(function (txt) {
      V().cacheSet(key, txt, 'ia');
      return txt;
    });
  }

  /** Pregunta de reflexión al cerrar la lección. */
  function reflection(lesson) {
    if (!lesson || !ready()) return null;
    var fn = T.REFLECT_BY_LEVEL[lesson.level];
    if (!fn) return null;
    try { return fn(terms()); } catch (e) { return null; }
  }

  /* ==================================================================
     RUTA, RETOS Y ENFOQUE DEL DÍA
     ================================================================== */

  function weeklyTitle(ch) {
    if (!ready()) return ch.title;
    var fn = T.WEEKLY[ch.id];
    if (!fn) return ch.title;
    try { return fn(terms()); } catch (e) { return ch.title; }
  }

  /** Una línea que enmarca el día entero en el negocio del usuario. */
  function focus() {
    if (!ready()) return null;
    var t = terms();
    var pend = V().completeness();
    if (pend.esenciales.length) {
      return 'Completa tu perfil para que todo se ajuste mejor a ' + t.negocio + '.';
    }
    var tareas = V().openTasks();
    if (tareas.length) return 'Pendiente de tu plan: ' + tareas[0].text;
    if (t.objetivo) return 'Tu objetivo: ' + t.objetivo + '.';
    return 'Todo lo de hoy aplica a ' + t.tuProducto + '.';
  }

  /** El subtítulo de la misión del día, referido al negocio. */
  function dailyLine(dm, fallback) {
    if (!dm || !ready()) return fallback;
    var t = terms();
    var m = w.Engine.lessonById(dm.id);
    var tema = m && m.mission ? T.THEME_BY_ID[m.mission.id] : T.THEME_BY_ID[dm.id];
    if (tema && T.BRIEF[tema]) {
      try {
        var brief = T.BRIEF[tema](t).brief;
        var corto = w.Venture.util.shorten(brief, 96);
        return corto.length < brief.length ? corto + '…' : corto;
      } catch (e) {}
    }
    return 'Aplicado a ' + t.tuProducto;
  }

  /* ==================================================================
     EXPEDIENTE
     ================================================================== */

  var DOSSIER_HINT = {
    idea:      function (t) { return 'Qué es ' + t.productoCorto + ', para quién y por qué importa.'; },
    problema:  function (t) { return 'El dolor real de ' + t.cliente + ', en sus palabras.'; },
    cliente:   function (t) { return 'A quién le vendes ' + t.productoCorto + ' primero. Concreto, no "todos".'; },
    oferta:    function (t) { return 'Qué incluye cada ' + t.unidad + ', qué promete y en cuánto tiempo.'; },
    precio:    function (t) { return 'Costo por ' + t.unidad + ', precio, margen y punto de equilibrio.'; },
    identidad: function (t) { return 'Cómo se presenta ' + t.negocio + ' y qué promete.'; },
    canales:   function (t) { return 'Los 2 lugares donde sí encuentras a ' + t.cliente + '.'; },
    ventas:    function (t) { return 'Cómo contactas a ' + t.cliente + ', cotizas y cierras.'; },
    numeros:   function (t) { return 'Ingresos, gastos, utilidad y ticket promedio de ' + t.negocio + '.'; },
    procesos:  function (t) { return 'Cómo se hace ' + t.productoCorto + ', paso a paso.'; },
    clientes:  function (t) { return 'Quiénes compraron ' + t.productoCorto + ' y qué dijeron.'; },
    plan:      function (t) { return 'Meta medible para ' + t.negocio + ' y las 3 acciones que la logran.'; }
  };

  function dossierHint(sec) {
    if (!ready()) return sec.hint;
    var fn = DOSSIER_HINT[sec.key];
    if (!fn) return sec.hint;
    try { return fn(terms()); } catch (e) { return sec.hint; }
  }

  /* ==================================================================
     ANÁLISIS Y PLAN — cliente, mercado, valor, modelo, ventas, costos, marca
     Se calculan con lo que el usuario ya declaró. Cuando falta un dato,
     se dice exactamente cuál y dónde conseguirlo, en vez de inventarlo.
     ================================================================== */

  var KINDS = [
    { key: 'valor',   icon: '💎', title: 'Tu propuesta de valor' },
    { key: 'cliente', icon: '🎯', title: 'Análisis de tu cliente' },
    { key: 'mercado', icon: '🔭', title: 'Tu mercado y competencia' },
    { key: 'modelo',  icon: '🧩', title: 'Tu modelo de negocio' },
    { key: 'ventas',  icon: '📣', title: 'Ventas y marketing' },
    { key: 'costos',  icon: '🧮', title: 'Costos, precio y proyección' },
    { key: 'marca',   icon: '🎨', title: 'Tu marca' }
  ];

  function dec(k) { var d = V().decision(k); return d ? d.value : null; }

  function analysis(kind) {
    var t = terms();
    var v = V().active();
    var lines = [], gaps = [];

    if (kind === 'valor') {
      lines.push('Ayudas a ' + t.cliente + ' con ' + t.producto + '.');
      var of = dec('oferta');
      if (of) lines.push('Tu oferta declarada: ' + w.Venture.util.shorten(of, 220));
      else gaps.push('Escribe tu oferta completa (misión "Tu oferta escrita", nivel 2).');
      var pr = dec('problema');
      if (pr) lines.push('El problema que resuelves: ' + w.Venture.util.shorten(pr, 200));
      else gaps.push('Define el problema en palabras de tu cliente (nivel 1 y 2).');
      if (t.objetivo) lines.push('Todo esto apunta a ' + t.objetivo + '.');

    } else if (kind === 'cliente') {
      // Redactado sin verbos que concuerden con el cliente: puede ser singular
      // ("una mamá joven") o plural ("dueños de taller") según lo que escriba.
      lines.push('Tu punto de partida es ' + t.tuCliente + '.');
      var cl = dec('cliente');
      if (cl) lines.push('Perfil definido: ' + w.Venture.util.shorten(cl, 240));
      else gaps.push('Todavía no has definido a tu cliente ideal con detalle.');
      var ca = dec('canales');
      if (ca) lines.push('Dónde los encuentras: ' + w.Venture.util.shorten(ca, 180));
      else gaps.push('Falta decidir los 2 canales donde de verdad están.');
      var cs = dec('clientes');
      if (cs) lines.push('Ya te compraron: ' + w.Venture.util.shorten(cs, 180));
      else if (t.etapa === 'idea' || t.etapa === 'starting') {
        lines.push('Aún sin clientes registrados: el siguiente paso es hablar con 5 personas de ' + t.cliente + '.');
      }

    } else if (kind === 'mercado') {
      lines.push('Compites por la atención de ' + t.cliente +
                 (t.lugar ? ' en ' + t.lugar : '') + ' en el sector ' + (t.sector || 'general') + '.');
      lines.push('Tu ventaja no puede ser el precio: con ' + (t.presupuesto || 'presupuesto limitado') +
                 ' no puedes ganar una guerra de precios. Tiene que ser el resultado que entregas o la cercanía.');
      gaps.push('Compara 3 negocios que ya venden algo parecido a ' + t.productoCorto + ' y anota qué les reclaman.');

    } else if (kind === 'modelo') {
      lines.push('Vendes ' + t.producto + ' por ' + t.unidad + ' a ' + t.cliente + '.');
      if (v.metrics.precio) lines.push('Precio declarado: ' + w.UI.money(v.metrics.precio) + ' por ' + t.unidad + '.');
      else gaps.push('Falta fijar el precio por ' + t.unidad + '.');
      var pro = dec('procesos');
      if (pro) lines.push('Tu proceso clave ya está documentado.');
      else gaps.push('Documenta cómo produces o entregas ' + t.productoCorto + '.');
      lines.push('Ingreso recurrente posible: un complemento o mantenimiento para quien ya compró.');

    } else if (kind === 'ventas') {
      var canales = dec('canales');
      lines.push(canales ? 'Tus canales: ' + w.Venture.util.shorten(canales, 160)
                         : 'Aún sin canales elegidos: empieza por el lugar donde ya encuentras a ' + t.cliente + '.');
      lines.push('Con ' + (t.minutos || 20) + ' minutos al día, una sola acción repetida cada semana ' +
                 'rinde más que estar en cinco redes a medias.');
      var vt = dec('ventas');
      if (vt) lines.push('Tu proceso de venta: ' + w.Venture.util.shorten(vt, 180));
      else gaps.push('Falta tu guion: cómo contactas, cotizas y das seguimiento.');

    } else if (kind === 'costos') {
      var precio = v.metrics.precio, costo = v.metrics.costo, fijos = v.metrics.fijos;
      if (precio && costo) {
        var margen = precio - costo;
        var pct = Math.round((margen / precio) * 100);
        lines.push('Margen por ' + t.unidad + ': ' + w.UI.money(margen) + ' (' + pct + '%).');
        if (fijos && margen > 0) {
          var pe = Math.ceil(fijos / margen);
          lines.push('Punto de equilibrio: ' + pe + ' ' + t.unidades + ' al mes solo para no perder.');
          lines.push('Con colchón, apunta a ' + Math.ceil(pe * 1.6) + ' al mes.');
        } else if (!fijos) {
          gaps.push('Falta cuánto te cuestan los costos fijos del mes para calcular el punto de equilibrio.');
        }
        if (pct < 40) lines.push('Ese margen es bajo para ' + t.productoCorto + ': vender más solo multiplicaría el cansancio.');
      } else {
        gaps.push('Faltan tu costo por ' + t.unidad + ' y tu precio para poder calcular margen y equilibrio.');
      }
      if (v.metrics.ingresos != null && v.metrics.gastos != null) {
        lines.push('Último cierre declarado: ' + w.UI.money(v.metrics.ingresos) + ' de ingresos y ' +
                   w.UI.money(v.metrics.gastos) + ' de gastos → utilidad ' +
                   w.UI.money(v.metrics.ingresos - v.metrics.gastos) + '.');
      }

    } else if (kind === 'marca') {
      lines.push(t.tiene.nombre ? 'Tu negocio se llama ' + t.negocio + '.'
                                : 'Todavía no tiene nombre: no lo necesitas para vender, pero sí para que te recomienden.');
      var id = dec('identidad');
      if (id) lines.push('Tu identidad declarada: ' + w.Venture.util.shorten(id, 200));
      else gaps.push('Falta tu pitch: qué promete ' + t.negocio + ' en una frase.');
      lines.push('Lo que más construye marca en tu etapa es mostrar el proceso de ' + t.productoCorto +
                 ' y las palabras de quien ya te compró.');
    }

    var meta = KINDS.filter(function (x) { return x.key === kind; })[0] || { icon: '📌', title: kind };
    var cached = V().cacheGet('analisis:' + kind);
    return {
      key: kind, icon: meta.icon, title: meta.title,
      lines: lines, gaps: gaps,
      ia: cached ? cached.text : null,
      stale: cached ? cached.stale : false
    };
  }

  function analysisAI(kind) {
    if (!aiOn()) return null;
    var key = 'analisis:' + kind;
    var hit = V().cacheGet(key);
    if (hit && !hit.stale) return null;
    var meta = KINDS.filter(function (x) { return x.key === kind; })[0];
    var pide = {
      valor:   'Escribe la propuesta de valor de este negocio y qué le falta para ser irresistible.',
      cliente: 'Analiza al cliente de este negocio: quién es exactamente, qué lo mueve a comprar, qué lo frena y dónde encontrarlo.',
      mercado: 'Analiza el mercado y la competencia de este negocio y dónde está su hueco real.',
      modelo:  'Describe el modelo de negocio actual y la forma más realista de sumarle un ingreso recurrente.',
      ventas:  'Propón la estrategia de ventas y marketing más realista para su tiempo y presupuesto.',
      costos:  'Analiza sus costos, su precio y proyecta lo que puede facturar en 90 días con supuestos claros.',
      marca:   'Propón cómo debe construir su marca en su etapa, con acciones concretas de esta semana.'
    }[kind];

    return w.AI.generate('analisis-' + kind, {
      instruccion: pide + ' Máximo 130 palabras. Usa viñetas con "·". Habla de SU producto y SUS clientes ' +
        'por su nombre. No repitas datos que ya tiene: aporta la lectura y el siguiente paso. ' +
        'Si falta un dato, dilo en una línea al final.',
      datos: 'Sección solicitada: ' + (meta ? meta.title : kind)
    }).then(function (txt) {
      V().cacheSet(key, txt, 'ia');
      return txt;
    });
  }

  /* ==================================================================
     RECOMENDACIÓN DEL DÍA
     ================================================================== */

  /** Qué haría el mentor hoy con este negocio, sin necesidad de IA. */
  function recommendation() {
    var t = terms();
    var pend = V().completeness();
    if (pend.esenciales.length) {
      return 'Completa "' + pend.esenciales[0].label + '" en Mi emprendimiento: sin ese dato, todo lo que te propongo es menos preciso.';
    }
    var tareas = V().openTasks();
    if (tareas.length) return 'Cierra esta pendiente antes que nada: ' + tareas[0].text;

    if (!V().knows('cliente')) {
      return 'Hoy define a quién le vendes ' + t.productoCorto + ' primero. Tres perfiles concretos, con dónde encontrarlos.';
    }
    if (!V().knows('oferta')) {
      return 'Hoy escribe la oferta de ' + t.tuProducto + ': qué incluye, qué promete, en cuánto tiempo y a qué precio.';
    }
    if (!V().knows('precio')) {
      return 'Hoy calcula tu costo por ' + t.unidad + ' incluyendo tu tiempo, y fija el precio de ' + t.productoCorto + '.';
    }
    if (!V().knows('canales')) {
      return 'Hoy elige los 2 lugares donde encuentras a ' + t.cliente + ' y descarta el resto.';
    }
    if (t.etapa === 'idea' || t.etapa === 'starting') {
      return 'Hoy habla con una persona de ' + t.cliente + '. No para venderle: para preguntarle cuándo fue la última vez que tuvo el problema.';
    }
    return 'Hoy manda 10 mensajes personalizados a personas de ' + t.cliente + ' ofreciendo ' + t.productoCorto + '.';
  }

  /* ==================================================================
     PUENTE CON LA IA
     ================================================================== */

  function aiOn() { return !!(w.AI && w.AI.isOn() && w.AI.generate); }

  /** Pinta el texto determinista y lo sustituye si la IA devuelve algo mejor.
      `apply(text, fuente)` se llama una o dos veces; nunca deja hueco vacío. */
  function upgrade(promise, apply) {
    if (!promise || !promise.then) return;
    promise.then(function (txt) {
      if (txt) apply(txt, 'ia');
    }).catch(function () { /* silencioso: ya hay contenido en pantalla */ });
  }

  w.Personalize = {
    ready: ready, terms: terms, text: text,
    mission: mission, missionAI: missionAI, themeFor: themeFor,
    example: example, exampleAI: exampleAI, reflection: reflection,
    weeklyTitle: weeklyTitle, focus: focus, dailyLine: dailyLine,
    dossierHint: dossierHint,
    KINDS: KINDS, analysis: analysis, analysisAI: analysisAI,
    recommendation: recommendation,
    aiOn: aiOn, upgrade: upgrade
  };
})(window);
