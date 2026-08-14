/* ==========================================================================
   MENTOR CON IA — opcional, con la clave del propio usuario

   Modo Emprendedor no tiene servidor. Eso significa que no hay ningún sitio
   donde esconder una clave de API: todo lo que estuviera en este archivo sería
   público. Por eso la IA funciona con la clave de cada usuario, guardada solo
   en su navegador y enviada solo a api.anthropic.com.

   El mentor local (js/core/mentor.js) sigue siendo el que responde por
   defecto. Esto es una capa encima:
     · si no hay clave o está desactivada, no se ejecuta nada de aquí;
     · si la llamada falla por lo que sea, quien contesta es el motor local,
       así que el usuario nunca se queda sin respuesta.

   La clave vive en su propia entrada de localStorage, FUERA de Store.state,
   a propósito: el respaldo de progreso se exporta con Store.exportJSON() y
   ese .json se comparte y se sube a la nube. Una clave de API no puede
   viajar ahí dentro.
   ========================================================================== */
(function (w) {
  'use strict';

  var SKEY = 'modo-emprendedor:ai';
  var ENDPOINT = 'https://api.anthropic.com/v1/messages';
  var API_VERSION = '2023-06-01';
  var TIMEOUT_MS = 45000;
  var MAX_TOKENS = 800;
  var HISTORY_TURNS = 12;

  var MODELS = [
    { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5',
      hint: 'La más rápida y barata. Suficiente para dudas normales.' },
    { id: 'claude-sonnet-5', name: 'Sonnet 5',
      hint: 'El equilibrio recomendado: responde mucho mejor por poco más.' },
    { id: 'claude-opus-5', name: 'Opus 5',
      hint: 'La más capaz y la más cara. Para consejo de negocio complejo.' }
  ];

  /* ---------- almacenamiento tolerante a fallos (file://, modo privado) ---------- */
  var mem = null;
  var safeStorage = (function () {
    try {
      var t = '__me_ai_test__';
      w.localStorage.setItem(t, '1');
      w.localStorage.removeItem(t);
      return w.localStorage;
    } catch (e) {
      return {
        getItem: function () { return mem; },
        setItem: function (k, v) { mem = v; },
        removeItem: function () { mem = null; }
      };
    }
  })();

  function defaults() {
    return { key: '', model: 'claude-sonnet-5', on: false };
  }

  var cfg = (function () {
    try {
      var raw = safeStorage.getItem(SKEY);
      if (!raw) return defaults();
      var p = JSON.parse(raw);
      var d = defaults();
      return {
        key: typeof p.key === 'string' ? p.key : d.key,
        model: modelExists(p.model) ? p.model : d.model,
        on: !!p.on
      };
    } catch (e) { return defaults(); }
  })();

  function modelExists(id) {
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return true;
    return false;
  }

  function persist() {
    try { safeStorage.setItem(SKEY, JSON.stringify(cfg)); }
    catch (e) { console.warn('[ai] no se pudo guardar la configuración:', e); }
  }

  /* ------------------------- Configuración ------------------------- */

  function config() { return { key: cfg.key, model: cfg.model, on: cfg.on }; }

  function setConfig(patch) {
    if (patch.key !== undefined) cfg.key = String(patch.key || '').trim();
    if (patch.model !== undefined && modelExists(patch.model)) cfg.model = patch.model;
    if (patch.on !== undefined) cfg.on = !!patch.on;
    if (!cfg.key) cfg.on = false;          // sin clave no hay nada que encender
    persist();
    return config();
  }

  function forget() {
    cfg = defaults();
    try { safeStorage.removeItem(SKEY); } catch (e) {}
    return config();
  }

  function hasKey() { return !!cfg.key; }
  function isOn() { return !!(cfg.on && cfg.key); }

  /** Las claves de Anthropic empiezan por sk-ant-. Solo es un aviso: si mañana
      cambian el prefijo, esto no debe impedir que nadie use la suya. */
  function looksLikeKey(k) { return /^sk-ant-/.test(String(k || '').trim()); }

  function modelName(id) {
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === (id || cfg.model)) return MODELS[i].name;
    return id || cfg.model;
  }

  /* ------------------------- Contexto del negocio -------------------------

     Una sola fuente para TODAS las funciones de IA, no solo para el chat: el
     perfil del emprendimiento con sus tres niveles (idea, decisiones tomadas,
     plan y avance). Lo arma js/core/venture.js.
     ----------------------------------------------------------------------- */

  function businessContext() {
    var s = w.Store ? w.Store.state : null;
    if (!s) return '';
    var L = [];
    var p = s.profile || {};
    if (p.name && p.name !== 'Emprendedor') L.push('El usuario se llama ' + p.name + '.');

    if (w.Venture) {
      try { L.push(w.Venture.contextText()); }
      catch (e) { console.warn('[ai] no se pudo leer el perfil del emprendimiento:', e); }
    }

    // El expediente sigue entrando aparte: son textos largos que el usuario
    // escribió y el modelo debe poder citar tal cual.
    var D = w.CONFIG && w.CONFIG.DOSSIER ? w.CONFIG.DOSSIER : [];
    var llenas = [], vacias = [];
    for (var i = 0; i < D.length; i++) {
      var sec = D[i];
      var data = s.dossier ? s.dossier[sec.key] : null;
      if (data && data.answers) {
        var vals = [];
        for (var k in data.answers) {
          if (!Object.prototype.hasOwnProperty.call(data.answers, k)) continue;
          if (data.answers[k]) vals.push(String(data.answers[k]));
        }
        if (vals.length) llenas.push('· ' + sec.title + ': ' + vals.join(' | ').slice(0, 320));
        else vacias.push(sec.title);
      } else vacias.push(sec.title);
    }
    if (llenas.length) L.push('\nSU EXPEDIENTE "MI NEGOCIO" (textual, se puede citar)\n' + llenas.join('\n'));
    if (vacias.length) L.push('\nSecciones del expediente aún vacías: ' + vacias.join(', ') + '.');

    return L.join('\n');
  }

  function systemPrompt() {
    return [
      'Eres Chispa, el mentor de negocios de la app "Modo Emprendedor".',
      'Acompañas a emprendedores hispanohablantes principiantes que están montando un',
      'negocio pequeño y real, una misión al día.',
      '',
      'CÓMO HABLAS',
      '· En español neutro latinoamericano y de tú. Cercano, directo, sin solemnidad.',
      '· Breve: 120 palabras como máximo salvo que te pidan desarrollar.',
      '· Concreto. Nada de "depende de tu mercado" o "haz un estudio": di qué hacer',
      '  esta semana, con números y con un ejemplo de su propio sector.',
      '· Si te falta un dato clave para responder bien, pide ese dato y nada más.',
      '· Terminas ofreciendo el siguiente paso, no con un resumen de lo dicho.',
      '',
      'FORMATO — importante, el chat solo entiende esto',
      '· **negrita** para lo que hay que retener.',
      '· Saltos de línea normales y viñetas con "·".',
      '· NADA de títulos con #, tablas, bloques de código ni listas numeradas con',
      '  formato markdown: se verían como texto roto.',
      '',
      'LÍMITES',
      '· Impuestos, facturación y trámites cambian por país: da la idea general y',
      '  dile que lo confirme con un contador o la autoridad fiscal local.',
      '· No inventes datos sobre su negocio. Si no está en el contexto, pregúntalo.',
      '· No prometas resultados ni cifras de ingresos.',
      '',
      businessContext()
    ].join('\n');
  }

  /** Sistema para las tareas de generación (desafíos, ejemplos, análisis).
      No es una conversación: se pide un texto que se va a incrustar en la app. */
  function taskPrompt(instruccion) {
    return [
      'Eres el motor de contenido de "Modo Emprendedor". Escribes material que se',
      'inserta directamente en la pantalla de un emprendedor principiante.',
      '',
      'REGLAS INNEGOCIABLES',
      '· Español neutro latinoamericano, de tú.',
      '· Todo lo que escribas habla del negocio concreto del contexto: su producto,',
      '  sus clientes, su etapa, su presupuesto y su tiempo real. Prohibido el',
      '  consejo genérico de manual.',
      '· No repitas lo que el usuario ya decidió (nivel 2): úsalo. Y no lo',
      '  contradigas sin explicar por qué convendría cambiarlo.',
      '· Concreto y accionable: cantidades, plazos y ejemplos de su propio caso.',
      '· Sin preámbulos, sin presentarte, sin cerrar con un resumen.',
      '· Formato: texto plano, **negrita** y viñetas con "·". Nada de #, tablas,',
      '  bloques de código ni listas numeradas de markdown.',
      '',
      'TAREA',
      instruccion,
      '',
      businessContext()
    ].join('\n');
  }

  /** Generación puntual de contenido personalizado (no es el chat).
      payload: { instruccion, datos, maxTokens } */
  function generate(kind, payload) {
    payload = payload || {};
    var user = ((payload.datos || '') + '\n\nEscribe ahora el texto para: ' + kind + '.').trim();
    var sistema = taskPrompt(payload.instruccion || 'Escribe el contenido solicitado.');
    var tope = payload.maxTokens || 400;

    if (isOn()) {
      return call([{ role: 'user', content: user }], { system: sistema, maxTokens: tope });
    }
    if (hayWorker()) {
      return w.AIWorker.pedir(user, { sistema: sistema, maxTokens: tope });
    }
    return sinIA();
  }

  /** Repreguntas de registro: qué falta saber para personalizar de verdad.
      Devuelve un array de preguntas cortas (0 a 3). */
  function intakeQuestions(core, faltantes) {
    if (!disponible()) return Promise.reject(new Error('La IA no está activa.'));
    var datos = [
      'Idea: ' + (core.idea || '(vacío)'),
      'Producto o servicio: ' + (core.offer || '(vacío)'),
      'Clientes: ' + (core.customer || '(vacío)'),
      'Etapa: ' + (core.stage || '(vacío)'),
      'Objetivo: ' + (core.goalText || core.goalKey || '(vacío)')
    ].join('\n');

    var sistema = [
      'Eres el registro de una app para emprendedores. Acabas de recibir lo que el',
      'usuario escribió sobre su idea. Tu tarea: decidir qué falta saber para poder',
      'personalizar toda la app a su negocio.',
      '',
      'Devuelve como MÁXIMO ' + (faltantes || 2) + ' preguntas, una por línea, sin numerar y sin',
      'ningún otro texto. Cada pregunta debe ser corta (menos de 14 palabras), en',
      'español de tú, y sobre algo que él pueda contestar en una frase.',
      'Si la información ya alcanza para personalizar, devuelve exactamente: OK'
    ].join('\n');

    var peticion = isOn()
      ? call([{ role: 'user', content: datos }], { system: sistema, maxTokens: 160, timeout: 20000 })
      : w.AIWorker.pedir(datos, { sistema: sistema, maxTokens: 160, timeout: 20000 });

    return peticion.then(function (r) {
      if (/^\s*ok\s*$/i.test(r)) return [];
      return r.split('\n')
        .map(function (x) { return x.replace(/^[\s\-\*\d\.\)]+/, '').trim(); })
        .filter(function (x) { return x.length > 6 && x.length < 140; })
        .slice(0, faltantes || 2);
    });
  }

  /* ------------------------- Historial ------------------------- */

  /** La API exige turnos alternos que empiecen por el usuario. El historial
      guardado no cumple eso (hay saludos del bot, mensajes seguidos del mismo
      lado…), así que se normaliza antes de enviarlo. */
  function buildMessages(userText) {
    var hist = (w.Store && w.Store.state.chat) || [];
    var raw = hist.slice(-HISTORY_TURNS).map(function (m) {
      return { role: m.who === 'me' ? 'user' : 'assistant', content: String(m.text || '') };
    });
    raw.push({ role: 'user', content: String(userText) });

    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var m = raw[i];
      if (!m.content.trim()) continue;
      if (!out.length && m.role !== 'user') continue;              // no puede abrir el asistente
      if (out.length && out[out.length - 1].role === m.role) {     // dos seguidos del mismo lado
        out[out.length - 1].content += '\n\n' + m.content;
      } else {
        out.push({ role: m.role, content: m.content });
      }
    }
    if (!out.length) out.push({ role: 'user', content: String(userText) });
    return out;
  }

  /* ------------------------- Llamada ------------------------- */

  function friendlyError(status, body) {
    var msg = body && body.error && body.error.message ? String(body.error.message) : '';
    if (status === 401) return 'Tu clave de API no es válida o fue revocada.';
    if (status === 403) return 'Tu clave no tiene permiso para usar ese modelo.';
    if (status === 404) return 'Ese modelo no está disponible para tu cuenta.';
    if (status === 429) return 'Alcanzaste el límite de tu cuenta de Anthropic. Espera un momento.';
    if (status === 529 || status === 500 || status === 503) return 'La IA está saturada. Inténtalo en un minuto.';
    if (/credit balance/i.test(msg)) return 'Tu cuenta de Anthropic no tiene saldo. Recárgalo en console.anthropic.com.';
    if (status === 400 && msg) return 'La IA rechazó la petición: ' + msg;
    return msg || ('Error ' + status + ' al hablar con la IA.');
  }

  /** Petición cruda. Devuelve el texto de la respuesta. */
  function call(messages, opts) {
    opts = opts || {};
    if (!cfg.key) return Promise.reject(new Error('No has configurado tu clave de API.'));
    if (typeof w.fetch !== 'function') return Promise.reject(new Error('Este navegador no puede conectarse con la IA.'));

    var ctrl = null, timer = null;
    try {
      ctrl = new AbortController();
      timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || TIMEOUT_MS);
    } catch (e) { ctrl = null; }

    return w.fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': API_VERSION,
        // Sin esta cabecera el navegador no puede llamar a la API directamente.
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: opts.model || cfg.model,
        max_tokens: opts.maxTokens || MAX_TOKENS,
        system: opts.system !== undefined ? opts.system : systemPrompt(),
        messages: messages
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (txt) {
        var body = null;
        try { body = JSON.parse(txt); } catch (e) {}
        if (!res.ok) throw new Error(friendlyError(res.status, body));
        var parts = body && body.content ? body.content : [];
        var out = '';
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].type === 'text') out += parts[i].text;
        }
        out = out.trim();
        if (!out) throw new Error('La IA devolvió una respuesta vacía.');
        return out;
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      if (err && err.name === 'AbortError') throw new Error('La IA tardó demasiado en responder.');
      // fetch falla con TypeError cuando no hay red o CORS bloquea la llamada.
      if (err && err.name === 'TypeError') throw new Error('Sin conexión con la IA. Reviso tu duda con el mentor local.');
      throw err;
    });
  }

  /* ------------------------- Elección de proveedor -------------------------

     Dos vías, y el orden importa:

       1. la clave personal del usuario, si la configuró y está encendida;
       2. la IA gratuita de Emprendo (el Worker), para todos los demás.

     La clave personal va primero a propósito, aunque cueste dinero: quien la
     configuró lo hizo para tener un modelo mejor, y usar el gratuito por
     detrás sin avisar sería tomar por él una decisión que ya tomó.
     ------------------------------------------------------------------------ */

  function hayWorker() { return !!(w.AIWorker && w.AIWorker.disponible()); }

  /** ¿Puede responder alguna IA ahora mismo? Es lo que debe preguntar el resto
      de la app: `isOn()` solo habla de la clave personal. */
  function disponible() { return isOn() || hayWorker(); }

  function proveedor() {
    if (isOn()) return 'clave';
    if (hayWorker()) return 'gratuita';
    return null;
  }

  /** Historial reciente en el formato que espera el Worker. */
  function historialReciente() {
    var hist = (w.Store && w.Store.state.chat) || [];
    var out = [];
    hist.slice(-4).forEach(function (m) {
      if (!m || !m.text) return;
      out.push({ role: m.who === 'me' ? 'user' : 'assistant', content: String(m.text) });
    });
    return out;
  }

  function sinIA() {
    return Promise.reject(new Error('No hay ninguna IA configurada.'));
  }

  /** Pregunta del chat, con el contexto del negocio y el historial reciente. */
  function ask(text) {
    if (isOn()) return call(buildMessages(text));
    if (hayWorker()) {
      return w.AIWorker.pedir(text, {
        sistema: systemPrompt(),
        historial: historialReciente(),
        maxTokens: 400
      });
    }
    return sinIA();
  }

  /** Comprobación barata de que la clave y el modelo funcionan. */
  function test(key, model) {
    var previa = cfg.key, previoModelo = cfg.model;
    if (key) cfg.key = String(key).trim();
    if (model) cfg.model = model;
    return call([{ role: 'user', content: 'Responde solo: ok' }], {
      system: 'Responde exactamente "ok".', maxTokens: 12, timeout: 20000
    }).then(function (r) {
      cfg.key = previa; cfg.model = previoModelo;
      return r;
    }).catch(function (e) {
      cfg.key = previa; cfg.model = previoModelo;
      throw e;
    });
  }

  w.AI = {
    MODELS: MODELS,
    config: config, setConfig: setConfig, forget: forget,
    hasKey: hasKey, isOn: isOn, looksLikeKey: looksLikeKey, modelName: modelName,
    disponible: disponible, proveedor: proveedor,
    systemPrompt: systemPrompt, taskPrompt: taskPrompt, businessContext: businessContext,
    ask: ask, test: test, call: call,
    generate: generate, intakeQuestions: intakeQuestions
  };
})(window);
