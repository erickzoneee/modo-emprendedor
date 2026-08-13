/* ==========================================================================
   MENTOR — evaluación de misiones, análisis de texto y conversación
   Motor local: no requiere conexión ni claves de API.
   ========================================================================== */
(function (w) {
  'use strict';

  var KB = w.MENTOR_KB;

  /* ==================================================================
     UTILIDADES DE TEXTO
     ================================================================== */

  var DIACRITICS = /[̀-ͯ]/g;

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(DIACRITICS, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function words(s) {
    return norm(s).split(/[^a-z0-9$%]+/).filter(Boolean);
  }

  function lines(s) {
    return String(s || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function numbersIn(s) {
    var m = String(s || '').match(/-?\d+(?:[.,]\d+)?/g);
    return m ? m.map(function (x) { return parseFloat(x.replace(',', '.')); }) : [];
  }

  function hasAny(s, arr) {
    var n = norm(s);
    for (var i = 0; i < arr.length; i++) if (n.indexOf(norm(arr[i])) >= 0) return true;
    return false;
  }

  var VAGUE = ['calidad', 'buen servicio', 'excelente', 'lo mejor', 'increible', 'unico',
               'innovador', 'de primera', 'profesional', 'todo tipo', 'cualquier cosa', 'variedad'];
  var EVERYONE = ['todos', 'todo el mundo', 'cualquiera', 'toda la gente', 'la gente en general', 'publico en general'];
  var GROUPS = ['dueño', 'dueno', 'dueñas', 'duenas', 'taller', 'tienda', 'restaurante', 'cafeteria',
                'estetica', 'clinica', 'consultorio', 'mama', 'papa', 'estudiante', 'maestro',
                'negocio', 'empresa', 'vecino', 'novia', 'novio', 'cliente de', 'personas que',
                'gente que', 'quienes', 'emprendedor', 'artesano', 'mecanico', 'veterinar',
                'panader', 'costurer', 'fotograf', 'entrenador', 'medico', 'abogado', 'contador',
                'agricultor', 'ganader', 'chofer', 'repartidor', 'barber', 'salon', 'gimnasio',
                'escuela', 'oficina', 'hotel', 'ferreteria', 'farmacia', 'papeleria', 'floreria'];
  var PROBLEM_WORDS = ['problema', 'no puede', 'no pueden', 'pierde', 'pierden', 'tarda', 'tardan',
                       'se rompe', 'se rompen', 'falla', 'fallan', 'no encuentra', 'no consigue',
                       'gasta', 'gastan', 'sufre', 'molesta', 'cuesta', 'dificil', 'complicado',
                       'se le olvida', 'no sabe', 'no tiene', 'urgente', 'evita', 'sin tener que',
                       'deja de', 'se queda', 'se acaba', 'se borra', 'descontinuad'];
  var CTA_WORDS = ['escribeme', 'escribe', 'manda', 'mandame', 'contactame', 'aparta', 'reserva',
                   'agenda', 'pide', 'pidelo', 'llama', 'whatsapp', 'comenta', 'responde',
                   'da clic', 'link', 'enlace', 'cotiza', 'pregunta por', 'aprovecha', 'separa el tuyo'];
  var PITCH_WORDS = ['compra', 'compre', 'te vendo', 'mi producto es', 'oferta especial',
                     'promocion', 'aprovecha', 'el mejor precio', 'te lo dejo en'];
  var VERBS = ['confirmar', 'medir', 'cobrar', 'enviar', 'imprimir', 'revisar', 'preguntar',
               'anotar', 'llamar', 'entregar', 'empacar', 'cotizar', 'comprar', 'agendar',
               'verificar', 'limpiar', 'preparar', 'diseñar', 'disenar', 'grabar', 'publicar',
               'contactar', 'responder', 'calcular', 'registrar', 'solicitar', 'pedir', 'armar',
               'validar', 'ajustar', 'probar', 'revisar', 'archivar', 'facturar', 'visitar'];
  var PAST_Q = ['cuando fue', 'ultima vez', 'que hiciste', 'como lo resolviste', 'como resolviste',
                'cuanto te costo', 'que has probado', 'que paso', 'cada cuanto', 'como le haces',
                'que usas', 'quien mas', 'cuantas veces'];
  var FUTURE_Q = ['comprarias', 'usarias', 'te gustaria', 'pagarias', 'te interesaria', 'crees que'];
  var COMMIT_WORDS = ['anticipo', 'apartado', 'aparto', 'deposito', 'pago', 'pagó', 'pago', 'transferencia',
                      'telefono', 'whatsapp', 'fecha', 'agendo', 'agenda', 'firmo', 'compromiso', 'aparta'];
  var TIME_WORDS = ['hora', 'horas', 'min', 'minuto', 'minutos', 'dia', 'dias', 'semana', 'semanas', 'mes', 'meses'];
  var GUARANTEE = ['garantia', 'devuelvo', 'devolucion', 'repongo', 'reposicion', 'sin costo', 'gratis si'];
  var OUTCOME = ['para que', 'logras', 'consigues', 'evitas', 'ahorras', 'ganas', 'dejas de',
                 'sin tener que', 'nunca mas', 'resuelve', 'recupera', 'aumenta', 'reduce',
                 'no vuelvas', 'no se pierda', 'no pare', 'no tengas que'];

  /* ==================================================================
     COMPROBACIONES DE RÚBRICA
     Cada función recibe (ctx) y devuelve { ok, note }
     ctx = { text, answers, mission, fields }
     ================================================================== */

  var CHECKS = {
    filled: function (c) {
      var ok = words(c.text).length >= 6;
      return { ok: ok, note: ok ? 'Está completo.' : 'Falta desarrollarlo un poco más: escribe al menos una frase completa por campo.' };
    },

    concrete: function (c) {
      var vague = VAGUE.filter(function (v) { return hasAny(c.text, [v]); });
      var hasDetail = numbersIn(c.text).length > 0 || words(c.text).length >= 14 || hasAny(c.text, GROUPS);
      var ok = vague.length === 0 && hasDetail;
      return {
        ok: ok,
        note: vague.length
          ? 'Cambia “' + vague[0] + '” por algo verificable. Frases como esa las usa todo el mundo y no dicen nada.'
          : (hasDetail ? 'Es concreto y se puede comprobar.' : 'Agrega un detalle verificable: un número, un nombre o un plazo.')
      };
    },

    number: function (c) {
      var ok = numbersIn(c.text).length >= 1;
      return { ok: ok, note: ok ? 'Incluye un dato numérico.' : 'Falta un número. Sin cifras no se puede medir ni decidir.' };
    },

    numbers: function (c) {
      var ok = numbersIn(c.text).length >= 2;
      return { ok: ok, note: ok ? 'Tienes los datos numéricos necesarios.' : 'Faltan cifras. Necesitas al menos dos números reales para trabajar con esto.' };
    },

    audience: function (c) {
      var everyone = hasAny(c.text, EVERYONE);
      var group = hasAny(c.text, GROUPS);
      var ok = !everyone && (group || words(c.text).length >= 5);
      return {
        ok: ok,
        note: everyone
          ? 'Dice “todos” o “cualquiera”. Cuando le hablas a todos, no le hablas a nadie: elige un grupo con una necesidad concreta.'
          : (group ? 'El público está bien delimitado.' : 'Define mejor el grupo: ¿qué hacen, dónde están, qué los une?')
      };
    },

    problem: function (c) {
      var ok = hasAny(c.text, PROBLEM_WORDS);
      return { ok: ok, note: ok ? 'Se entiende qué problema resuelves.' : 'No aparece el problema. Describe qué pierde, qué falla o qué le cuesta hoy a tu cliente.' };
    },

    outcome: function (c) {
      var ok = hasAny(c.text, OUTCOME) || hasAny(c.text, PROBLEM_WORDS);
      return { ok: ok, note: ok ? 'Promete un resultado, no solo un objeto.' : 'Falta el resultado. No vendes el producto: vendes lo que el cliente consigue con él.' };
    },

    cta: function (c) {
      var ok = hasAny(c.text, CTA_WORDS) || /\?/.test(c.text);
      return { ok: ok, note: ok ? 'Tiene una acción clara al final.' : 'Falta la llamada a la acción. Termina con algo concreto: “escríbeme la palabra X” o “¿te lo aparto?”.' };
    },

    question: function (c) {
      var ok = (c.text.match(/\?/g) || []).length >= 1;
      return { ok: ok, note: ok ? 'Incluye preguntas.' : 'Agrega al menos una pregunta: sin ella la conversación se cierra.' };
    },

    reason: function (c) {
      var ok = hasAny(c.text, ['porque', 'ya que', 'por eso', 'debido', 'asi que', 'por lo tanto', 'gracias a', 'para que']) &&
               words(c.text).length >= 12;
      return { ok: ok, note: ok ? 'Está justificado.' : 'Falta el porqué. Explica la razón detrás de tu decisión, no solo la decisión.' };
    },

    steps: function (c) {
      var ls = lines(c.text);
      var numbered = (c.text.match(/(^|\n)\s*\d+[\.\)\-]/g) || []).length;
      var n = Math.max(ls.length, numbered);
      var ok = n >= 5 || (numbered >= 3 && ls.length >= 3);
      return { ok: ok, note: ok ? 'Está desglosado en pasos.' : 'Desglósalo: escribe cada punto en su propia línea, al menos 5.' };
    },

    verbs: function (c) {
      var ls = lines(c.text);
      if (!ls.length) return { ok: false, note: 'Escribe los pasos, uno por línea.' };
      var good = ls.filter(function (l) {
        var clean = norm(l).replace(/^\d+[\.\)\-]?\s*/, '');
        var first = clean.split(' ')[0] || '';
        return VERBS.indexOf(first) >= 0 || /ar$|er$|ir$/.test(first);
      }).length;
      var ok = good >= Math.ceil(ls.length * 0.6);
      return { ok: ok, note: ok ? 'Los pasos son accionables.' : 'Empieza cada paso con un verbo en infinitivo: “confirmar”, “medir”, “cobrar”. Así se pueden ejecutar sin interpretarlos.' };
    },

    named: function (c) {
      var raw = String(c.text || '');
      var proper = /(^|[\s"“(])[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}/.test(raw);
      var ok = proper || hasAny(c.text, GROUPS) || words(c.text).length >= 6;
      return { ok: ok, note: ok ? 'Es una persona o perfil identificable.' : 'Sé específico: un nombre o una descripción concreta (“Marisol, de la estética de la esquina”).' };
    },

    quote: function (c) {
      var ok = /["“”']/.test(c.text) || words(c.text).length >= 14;
      return { ok: ok, note: ok ? 'Recogiste sus palabras.' : 'Anota lo que dijo textualmente, entre comillas. Sus palabras valen más que tu resumen.' };
    },

    nopitch: function (c) {
      var ok = !hasAny(c.text, PITCH_WORDS);
      return { ok: ok, note: ok ? 'No caíste en vender: escuchaste.' : 'Cuidado: hay lenguaje de venta. En una entrevista de descubrimiento no se vende, se pregunta.' };
    },

    pastq: function (c) {
      var past = hasAny(c.text, PAST_Q);
      var future = hasAny(c.text, FUTURE_Q);
      var ok = past && !future;
      return {
        ok: ok,
        note: future
          ? 'Hay preguntas hipotéticas (“¿comprarías…?”). La gente miente sin querer sobre el futuro. Pregunta por el pasado.'
          : (past ? 'Preguntas por hechos del pasado. Correcto.' : 'Reformula: “¿cuándo fue la última vez?”, “¿qué hiciste?”, “¿cuánto te costó?”.')
      };
    },

    personal: function (c) {
      var ok = /\[nombre\]|hola\s+[A-ZÁÉÍÓÚ]/i.test(c.text) ||
               hasAny(c.text, ['vi que', 'me di cuenta', 'note que', 'note tu', 'su negocio', 'tu taller', 'ustedes']) ||
               /(^|[\s])[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}/.test(String(c.text));
      return { ok: ok, note: ok ? 'El mensaje se siente personal.' : 'Personalízalo: menciona algo específico de esa persona o negocio en la primera línea.' };
    },

    ten: function (c) {
      var ns = numbersIn(c.text);
      var ok = ns.some(function (n) { return n >= 10; });
      return { ok: ok, note: ok ? 'Volumen suficiente para tener datos.' : 'Con menos de 10 contactos no tienes muestra: una racha de silencio es normal. Llega a 10.' };
    },

    three: function (c) {
      var ns = numbersIn(c.text);
      var ok = ns.some(function (n) { return n >= 3; });
      return { ok: ok, note: ok ? 'Meta alcanzada.' : 'Todavía no llegas a tres. Sigue: te falta poco.' };
    },

    commit: function (c) {
      var ok = hasAny(c.text, COMMIT_WORDS);
      return { ok: ok, note: ok ? 'Pediste un compromiso real.' : 'El compromiso debe costar algo: un anticipo, una fecha o dejar su contacto. Un “sí” gratis no vale.' };
    },

    quote2: function (c) {
      var hasPrice = /\$|\bpesos\b|\bmxn\b|\busd\b/i.test(c.text) || numbersIn(c.text).length >= 1;
      var hasTime = hasAny(c.text, TIME_WORDS);
      var ok = hasPrice && hasTime;
      return {
        ok: ok,
        note: ok ? 'Incluye precio y plazo.' :
          (!hasPrice ? 'Falta el precio. Una cotización sin número obliga al cliente a preguntar otra vez.'
                     : 'Falta el plazo. Comprometer una fecha es lo que más sube la tasa de cierre.')
      };
    },

    measurable: function (c) {
      var ok = numbersIn(c.text).length >= 1 && (hasAny(c.text, TIME_WORDS) || /%|\$/.test(c.text));
      return { ok: ok, note: ok ? 'Es medible y tiene plazo.' : 'Hazlo medible: agrega un número y una fecha o plazo. “Crecer” no se puede medir; “30 pedidos en 90 días” sí.' };
    },

    time: function (c) {
      var v = c.answers && (c.answers.tiempo || c.answers.hora);
      var ok = v ? parseFloat(v) > 0 : hasAny(c.text, TIME_WORDS);
      return { ok: ok, note: ok ? 'Incluiste tu tiempo en el costo.' : 'Falta tu tiempo. Si no lo cuentas, te estás pagando cero por hora.' };
    },

    margin: function (c) {
      var a = c.answers || {};
      var precio = parseFloat(a.precio || a.nuevo || a.complemento || 0);
      var costo = parseFloat(a.costo || a.variable || a.material || 0);
      if (!precio || !costo) {
        var ns = numbersIn(c.text);
        if (ns.length >= 2) { precio = Math.max.apply(null, ns); costo = Math.min.apply(null, ns.filter(function (x) { return x > 0; })); }
      }
      var ok = precio > costo * 1.4;
      return {
        ok: ok,
        note: ok ? 'Tu margen es sano (' + Math.round(((precio - costo) / precio) * 100) + '%).'
                 : 'El margen es muy bajo. Para producción propia apunta a un precio de 2 a 3 veces tu costo unitario.'
      };
    },

    healthy: function (c) {
      var m = parseFloat((c.answers && c.answers.margen) || 0);
      var ok = m >= 40;
      return { ok: ok, note: ok ? 'Margen saludable.' : 'Con menos de 40% de margen, crecer solo multiplica el cansancio. Arregla el margen antes de escalar.' };
    },

    roi: function (c) {
      var a = c.answers || {};
      var inv = parseFloat(a.inversion || 0);
      var rec = parseFloat(a.recuperado || 0);
      var ok = rec >= inv && inv > 0;
      return {
        ok: ok,
        note: ok ? '¡Recuperaste la inversión! Todo lo que venga ahora es ganancia neta sobre el capital.'
                 : (inv > 0 ? 'Aún te faltan ' + w.UI.money(inv - rec) + ' para recuperar. Ya sabes exactamente cuánto: eso es media batalla.'
                            : 'Pon la inversión inicial y lo acumulado para poder calcularlo.')
      };
    },

    controllable: function (c) {
      var bad = hasAny(c.text, ['que me recomienden', 'volverme viral', 'que me encuentren', 'suerte', 'ojala', 'espero que']);
      var ok = !bad;
      return { ok: ok, note: ok ? 'Las acciones dependen de ti.' : 'Hay acciones que no controlas. Cámbialas por cosas que puedas hacer y contar tú mismo.' };
    },

    nofight: function (c) {
      var ok = !hasAny(c.text, ['estas equivocado', 'no tienes razon', 'te equivocas', 'eso es falso', 'mentira']);
      return { ok: ok, note: ok ? 'No confrontas al cliente.' : 'Evita contradecir de frente. Valida primero (“entiendo, tiene sentido”) y luego pregunta.' };
    },

    auto: function () { return { ok: true, note: 'Cálculo verificado.' }; }
  };

  /* ==================================================================
     EVALUACIÓN DE UNA MISIÓN
     ================================================================== */

  /** Nota mínima para poder entregar una misión. */
  var PASS_MARK = 60;

  function evaluate(mission, answers) {
    var text = Object.keys(answers).map(function (k) { return answers[k]; }).join('\n');
    var ctx = { text: text, answers: answers, mission: mission };
    var rubric = mission.rubric || [];
    var results = rubric.map(function (r) {
      var fn = CHECKS[r.check] || CHECKS.filled;
      var out;
      try { out = fn(ctx); } catch (e) { out = { ok: false, note: 'No pude verificarlo.' }; }
      return { id: r.id, label: r.label, ok: out.ok, note: out.note };
    });

    var passed = results.filter(function (r) { return r.ok; }).length;
    var base = rubric.length ? Math.round((passed / rubric.length) * 100) : 100;
    var score = base;

    // Refuerzo por profundidad. Se guardan los ajustes ya aplicados (con signo)
    // para poder enseñarlos: el "-15" por brevedad tiene un suelo de 20 puntos,
    // así que a veces el ajuste real es menor, o incluso sube la nota.
    var wc = words(text).length;
    var bonus = 0, brevity = 0;
    if (wc > 45 && score < 100) { bonus = Math.min(100, score + 5) - score; score += bonus; }
    if (wc < 12) { brevity = Math.max(20, score - 15) - score; score += brevity; }

    // Cuánto sube la nota arreglar un criterio pendiente (para poder decirlo).
    var porCriterio = rubric.length ? Math.round(100 / rubric.length) : 0;

    return {
      score: score,
      passed: passed,
      total: rubric.length,
      results: results,
      verdict: verdictFor(score),
      improved: improve(mission, answers, results),
      wordCount: wc,
      // Desglose para poder mostrar de dónde sale el número, no solo el número.
      breakdown: {
        base: base,
        passed: passed,
        total: rubric.length,
        perCriterion: porCriterio,
        bonus: bonus,             // +5 por desarrollar (más de 45 palabras)
        brevity: brevity,         // ajuste por respuesta corta, con signo
        words: wc,
        deepAt: 45,
        shortAt: 12,
        floor: 20,                // ninguna respuesta baja de aquí
        passMark: PASS_MARK,
        missing: results.filter(function (r) { return !r.ok; })
      }
    };
  }

  function verdictFor(score) {
    if (score >= 90) return { emoji: '🏆', mood: 'party', title: 'Excelente trabajo', text: 'Esto ya está listo para usarse con clientes reales.' };
    if (score >= 70) return { emoji: '💪', mood: 'happy', title: 'Vas muy bien', text: 'Con un par de ajustes queda impecable.' };
    if (score >= 45) return { emoji: '🔧', mood: 'think', title: 'Buen inicio', text: 'Tienes la base. Faltan detalles que hacen la diferencia al vender.' };
    return { emoji: '🌱', mood: 'neutral', title: 'Empecemos por aquí', text: 'Todavía está muy general. Concretar es lo que lo convierte en algo usable.' };
  }

  /** Sugerencia de versión mejorada usando las propias palabras del usuario. */
  function improve(mission, answers, results) {
    var failing = results.filter(function (r) { return !r.ok; });
    if (!failing.length) return null;

    var tips = failing.map(function (f) { return f.note; });
    var template = null;
    var a = answers;

    if (mission.dossier === 'oferta' || mission.id === 'm2-04') {
      template = 'Ayudo a ' + (pick(a, ['grupo', 'cliente']) || '[tu cliente]') +
        ' a ' + (pick(a, ['resultado']) || '[resultado concreto]') +
        ' mediante ' + (pick(a, ['incluye', 'oferta']) || '[tu producto]') +
        ', en [plazo], con ' + (pick(a, ['garantia']) || '[tu garantía]') + ', por $[precio].';
    } else if (mission.dossier === 'cliente' || mission.id === 'm1-04') {
      template = 'Le vendo a ' + (a.grupo || '[grupo específico]') +
        ' que necesita ' + (a.necesidad || '[necesidad concreta]') +
        ' porque [causa real], y los encuentro en ' + (a.donde || '[lugar donde se juntan]') + '.';
    } else if (mission.id === 'm4-04') {
      template = 'Hola [Nombre], vi que [algo específico de su negocio].\n' +
        'Sé que cuando [problema concreto] se pierde [tiempo o dinero].\n' +
        'Yo [lo que haces] en [plazo], con [garantía].\n' +
        '¿Te mando una foto de uno que hice la semana pasada?';
    } else if (mission.id === 'm8-05') {
      template = 'Meta: pasar de [número actual] a [número meta] antes del [fecha].\n' +
        'Cada semana: [acción 1 con cantidad], [acción 2], [acción 3].\n' +
        'Reviso los [día] a las [hora]: [indicador].';
    }

    return { tips: tips, template: template };
  }

  function pick(obj, keys) {
    for (var i = 0; i < keys.length; i++) if (obj[keys[i]]) return obj[keys[i]];
    return null;
  }

  /* ==================================================================
     ANÁLISIS RÁPIDO DE TEXTO LIBRE (ejercicios tipo "escribe")
     ================================================================== */

  function quickFeedback(text, step) {
    var wc = words(text).length;
    var min = step.minWords || 8;
    var notes = [];
    var good = [];

    if (wc >= min) good.push('Tiene el desarrollo suficiente');
    else notes.push('Desarróllalo un poco más (al menos ' + min + ' palabras)');

    if (numbersIn(text).length) good.push('Incluye datos numéricos');
    else notes.push('Un número lo haría verificable: precio, cantidad, plazo');

    if (hasAny(text, EVERYONE)) notes.push('Evita “todos” o “cualquiera”: elige un grupo concreto');
    var vague = VAGUE.filter(function (v) { return hasAny(text, [v]); });
    if (vague.length) notes.push('“' + vague[0] + '” no dice nada: cámbialo por algo comprobable');
    else if (wc >= min) good.push('Está escrito en términos concretos');

    if (hasAny(text, GROUPS)) good.push('Nombras a un público identificable');
    if (hasAny(text, TIME_WORDS)) good.push('Incluye un plazo');

    var score = Math.min(100, 40 + good.length * 18 - notes.length * 8);
    return {
      score: Math.max(25, score),
      good: good.slice(0, 3),
      notes: notes.slice(0, 2),
      mood: score >= 75 ? 'happy' : (score >= 50 ? 'neutral' : 'think')
    };
  }

  /* ==================================================================
     CALCULADORAS
     ================================================================== */

  var CALC = {
    equilibrio: function (fijos, precio, variable) {
      var mc = precio - variable;
      if (mc <= 0) return { error: 'Tu precio es menor o igual a tu costo variable. Con ese precio pierdes en cada venta, sin importar el volumen.' };
      var pe = Math.ceil(fijos / mc);
      return {
        mc: mc,
        pe: pe,
        margen: Math.round((mc / precio) * 100),
        objetivo: Math.ceil(pe * 1.6),
        text: 'Margen de contribución: ' + w.UI.money(mc) + ' por unidad (' + Math.round((mc / precio) * 100) + '%).\n' +
          '**Punto de equilibrio: ' + pe + ' unidades al mes.**\n' +
          'A partir de la unidad ' + (pe + 1) + ', cada venta te deja ' + w.UI.money(mc) + ' limpios.\n' +
          'Planea vender ~' + Math.ceil(pe * 1.6) + ' para tener colchón.'
      };
    },

    precio: function (costo, mercadoMin, mercadoMax, valor) {
      var piso = Math.ceil(costo * 2);
      var techo = valor ? Math.round(valor * 0.4) : null;
      var sug = piso;
      if (mercadoMax && mercadoMax > piso) sug = Math.round((piso + mercadoMax) / 2);
      if (techo && techo > sug) sug = Math.round((sug + techo) / 2);
      return {
        piso: piso, sugerido: sug, techo: techo,
        text: '**Piso (2× tu costo): ' + w.UI.money(piso) + '**\n' +
          (mercadoMin ? 'Mercado: ' + w.UI.money(mercadoMin) + ' a ' + w.UI.money(mercadoMax) + '\n' : '') +
          (techo ? 'Techo por valor (40% de lo que le generas): ' + w.UI.money(techo) + '\n' : '') +
          '**Precio sugerido: ' + w.UI.money(sug) + '**\n' +
          'Margen resultante: ' + Math.round(((sug - costo) / sug) * 100) + '%.'
      };
    },

    impresion3d: function (gramos, precioKg, horas, costoHoraLuz, minTrabajo, valorHora, empaque) {
      var filamento = (gramos / 1000) * precioKg;
      var luz = horas * costoHoraLuz;
      var desgaste = (filamento + luz) * 0.15;
      var trabajo = (minTrabajo / 60) * valorHora;
      var total = filamento + luz + desgaste + trabajo + empaque;
      return {
        filamento: filamento, luz: luz, desgaste: desgaste, trabajo: trabajo,
        empaque: empaque, total: total,
        sugerido: Math.ceil(total * 2.4 / 5) * 5,
        text: 'Filamento: ' + w.UI.money(filamento, 1) + '\n' +
          'Energía: ' + w.UI.money(luz, 1) + '\n' +
          'Desgaste y fallos (15%): ' + w.UI.money(desgaste, 1) + '\n' +
          'Tu tiempo: ' + w.UI.money(trabajo, 1) + '\n' +
          'Empaque: ' + w.UI.money(empaque, 1) + '\n' +
          '**Costo unitario real: ' + w.UI.money(total, 1) + '**\n' +
          '**Precio sugerido (2.4×): ' + w.UI.money(Math.ceil(total * 2.4 / 5) * 5) + '**'
      };
    },

    cac: function (inversion, clientes, margen) {
      if (!clientes) return { error: 'Sin clientes conseguidos, tu CAC es infinito: toda la inversión se perdió. Cambia el mensaje o el público antes de invertir más.' };
      var cac = inversion / clientes;
      var ok = cac < margen * 0.5;
      return {
        cac: cac, ok: ok,
        text: '**CAC: ' + w.UI.money(cac) + ' por cliente.**\n' +
          'Margen por cliente: ' + w.UI.money(margen) + '\n' +
          (ok ? '✅ Sano: tu CAC es menos de la mitad de tu margen. Puedes escalar con cuidado.'
              : (cac >= margen ? '🚨 Cada venta te cuesta dinero. Detén la inversión y arregla el mensaje, el público o el precio.'
                               : '⚠️ Ajustado. Funciona, pero cualquier variación te deja en cero. Mejora la conversión antes de subir presupuesto.'))
      };
    },

    reorden: function (consumoSemanal, semanasEspera, colchonSemanas) {
      var punto = consumoSemanal * semanasEspera + consumoSemanal * colchonSemanas;
      return {
        punto: punto,
        text: '**Punto de reorden: ' + Math.ceil(punto) + ' unidades.**\n' +
          'Cuando tu inventario llegue a ese número, haz el pedido.\n' +
          'Así nunca te quedas sin material ni congelas efectivo de más.'
      };
    },

    margen: function (precio, costo) {
      var m = precio - costo;
      var pct = precio ? (m / precio) * 100 : 0;
      var diag = pct >= 45 ? '✅ Margen saludable para producción propia.'
        : (pct >= 30 ? '⚠️ Ajustado: cualquier imprevisto se come la ganancia.'
                     : '🚨 Insuficiente. Sube el precio o baja el costo antes de vender más.');
      return { margen: m, pct: pct, text: 'Margen: ' + w.UI.money(m) + ' por unidad (' + Math.round(pct) + '%).\n' + diag };
    }
  };

  /* ==================================================================
     CONVERSACIÓN
     ================================================================== */

  function matchIntent(msg) {
    var n = norm(msg);
    var best = null, bestScore = 0;
    KB.INTENTS.forEach(function (intent) {
      var score = 0;
      intent.keys.forEach(function (k) {
        var kn = norm(k);
        if (n.indexOf(kn) >= 0) score += kn.split(' ').length * 2 + kn.length / 8;
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    return bestScore >= 1.4 ? best : null;
  }

  function personalize(answer) {
    var s = w.Store.state;
    var name = (w.Venture ? w.Venture.terms().negocio : null) || s.profile.businessName;
    if (name && name !== 'tu negocio' && answer.indexOf('__BIZ__') >= 0) {
      answer = answer.replace(/__BIZ__/g, name);
    }
    answer = answer.replace(/__BIZ__/g, 'tu negocio');
    if (answer.indexOf('__MISSION__') >= 0) {
      var dm = w.Engine.dailyMission();
      var hoy = w.Personalize ? w.Personalize.recommendation() : null;
      var txt = dm
        ? 'Tu siguiente paso en la ruta es **' + dm.title + '**.\n\n' +
          (hoy ? 'Y si solo tienes 10 minutos hoy: **' + hoy + '**\n\n' : '') +
          'Todo lo demás puede esperar.'
        : (hoy || 'Ya completaste la ruta. Hoy toca ejecutar tu plan de 90 días: revisa tu indicador y haz las tres acciones de la semana.');
      answer = answer.replace(/__MISSION__/g, txt);
    }
    return answer;
  }

  /* Qué decisión del perfil corresponde a cada tema del mentor. Sirve para dos
     cosas: no volver a preguntar lo que ya está decidido, y aterrizar la
     respuesta de manual en el negocio concreto del usuario. */
  var INTENT_DECISION = {
    cliente: 'cliente', oferta: 'oferta', precio: 'precio', costos: 'precio',
    equilibrio: 'numeros', marketing: 'canales', publicidad: 'canales',
    vender: 'ventas', objeciones: 'ventas', procesos: 'procesos',
    delegar: 'procesos', idea: 'idea', validar: 'problema',
    resenas: 'clientes', recompra: 'clientes', crecer: 'plan',
    flujo: 'numeros', ticket: 'numeros', inventario: 'procesos'
  };

  /** El cierre "en tu caso": nunca se devuelve una respuesta de manual sola. */
  function applied(intentId) {
    if (!w.Venture || !w.Personalize || !w.Personalize.ready()) return '';
    var t = w.Personalize.terms();
    var clave = INTENT_DECISION[intentId];
    var dec = clave ? w.Venture.decision(clave) : null;

    if (dec && dec.value) {
      return '\n\n**En tu caso:** ya tienes esto decidido — “' +
        w.Venture.util.shorten(dec.value, 150) + '”. No empieces de cero: ' +
        'compáralo con lo de arriba y dime qué parte quieres afinar.';
    }
    if (clave) {
      return '\n\n**En tu caso:** aplícalo a ' + t.tuProducto + ' y a ' + t.cliente +
        '. Cuando lo tengas, guárdalo en Mi Negocio y dejo de preguntártelo.';
    }
    return '\n\n**En tu caso:** ' + w.Personalize.recommendation();
  }

  function reply(msg) {
    var intent = matchIntent(msg);
    if (intent) {
      return {
        type: 'answer',
        title: intent.title,
        text: personalize(intent.answer) + (intent.id === 'mision' ? '' : applied(intent.id)),
        follow: intent.follow || []
      };
    }
    // ¿Trae números? Intenta ayudar con un cálculo
    var ns = numbersIn(msg);
    if (ns.length >= 2 && hasAny(msg, ['cuesta', 'costo', 'vendo', 'precio', 'cobro'])) {
      var precio = Math.max.apply(null, ns);
      var costo = Math.min.apply(null, ns.filter(function (x) { return x > 0; }));
      var r = CALC.margen(precio, costo);
      return {
        type: 'answer', title: 'Tu margen',
        text: 'Con precio ' + w.UI.money(precio) + ' y costo ' + w.UI.money(costo) + ':\n\n' + r.text +
              '\n\n¿Quieres que calculemos tu punto de equilibrio?',
        follow: ['Punto de equilibrio', 'Subir mi precio', 'Bajar costos']
      };
    }
    var i = Math.floor(Math.random() * KB.FALLBACK.length);
    return { type: 'answer', title: null, text: personalize(KB.FALLBACK[i]) + applied(null),
             follow: KB.QUICK.slice(0, 4) };
  }

  /* ==================================================================
     PRÁCTICA GUIADA
     ================================================================== */

  function scorePracticeTurn(turn, answer) {
    var n = norm(answer);
    var hits = turn.good.filter(function (g) { return n.indexOf(norm(g)) >= 0; }).length;
    var wc = words(answer).length;
    var ok = hits >= 1 && wc >= 4;
    return {
      ok: ok,
      hits: hits,
      feedback: ok
        ? (hits >= 2 ? '👏 Muy bien. Cubriste lo importante.' : '👍 Buen camino.')
        : '🔍 ' + turn.tip
    };
  }

  w.Mentor = {
    PASS_MARK: PASS_MARK,
    evaluate: evaluate,
    quickFeedback: quickFeedback,
    reply: reply,
    applied: applied,
    scorePracticeTurn: scorePracticeTurn,
    CALC: CALC,
    CHECKS: CHECKS,
    util: { norm: norm, words: words, lines: lines, numbersIn: numbersIn, hasAny: hasAny }
  };
})(window);
