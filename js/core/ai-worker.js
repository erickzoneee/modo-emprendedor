/* ==========================================================================
   IA GRATUITA DE EMPRENDO — cliente del Worker

   La capa que da IA a quien no tiene ni quiere tener una clave de API, que son
   casi todos. Habla con el Worker de Cloudflare (ver worker/), no con ningún
   proveedor directamente: por eso aquí no hay ninguna clave que proteger.

   La URL del Worker se guarda en este dispositivo, fuera de Store, igual que la
   clave personal: el respaldo .json del progreso se comparte y se sube a la
   nube, y ahí no debe viajar la configuración del servidor.

   Si el Worker no responde, se agota la cuota del día o no hay conexión, esta
   capa falla en silencio y quien contesta es Chispa con sus reglas. El usuario
   nunca ve una pantalla rota; a lo sumo, un aviso.
   ========================================================================== */
(function (w) {
  'use strict';

  var SKEY = 'modo-emprendedor:worker';
  var TIMEOUT_MS = 40000;

  /* ---------- almacenamiento tolerante a fallos (file://, modo privado) ---------- */
  var mem = null;
  var safeStorage = (function () {
    try {
      var t = '__me_wk_test__';
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

  function defaults() { return { url: '', on: false }; }

  var cfg = (function () {
    try {
      var raw = safeStorage.getItem(SKEY);
      if (!raw) return defaults();
      var p = JSON.parse(raw);
      return { url: typeof p.url === 'string' ? p.url : '', on: !!p.on };
    } catch (e) { return defaults(); }
  })();

  function persist() {
    try { safeStorage.setItem(SKEY, JSON.stringify(cfg)); }
    catch (e) { console.warn('[worker] no se pudo guardar la configuración:', e); }
  }

  function config() { return { url: cfg.url, on: cfg.on }; }

  function setConfig(patch) {
    if (patch.url !== undefined) cfg.url = normalizarUrl(patch.url);
    if (patch.on !== undefined) cfg.on = !!patch.on;
    if (!cfg.url) cfg.on = false;
    persist();
    return config();
  }

  function olvidar() {
    cfg = defaults();
    try { safeStorage.removeItem(SKEY); } catch (e) {}
    return config();
  }

  /** Acepta lo que la gente pega de verdad: con o sin https, con barra final. */
  function normalizarUrl(v) {
    var u = String(v || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u.replace(/\/+$/, '');
  }

  function disponible() { return !!(cfg.on && cfg.url); }

  /* ==================================================================
     CUOTA DEL DÍA

     Es un contador de uso, no una barrera de seguridad: vive en el
     dispositivo y se puede editar. Sirve para dos cosas honestas —
     enseñarle al usuario cuánto lleva y espaciar el consumo— mientras
     que el tope real, el que no se puede saltar, lo impone Cloudflare
     al cortar la cuota gratuita del día.
     ================================================================== */

  var TOPE_DIARIO = 25;

  function cuota() {
    var s = w.Store.state;
    if (!s.iaCuota || s.iaCuota.dia !== w.Store.today()) {
      s.iaCuota = { dia: w.Store.today(), usadas: 0 };
    }
    return s.iaCuota;
  }

  function restante() { return Math.max(0, TOPE_DIARIO - cuota().usadas); }

  function apuntarUso() {
    w.Store.set(function (s) {
      if (!s.iaCuota || s.iaCuota.dia !== w.Store.today()) {
        s.iaCuota = { dia: w.Store.today(), usadas: 0 };
      }
      s.iaCuota.usadas++;
    }, 'ia-cuota');
  }

  /* ==================================================================
     LLAMADA
     ================================================================== */

  /* Los modelos que razonan —Qwen3 entre ellos— escriben primero su
     razonamiento y solo después la respuesta. Ese preámbulo se descarta, así
     que con un tope pequeño se lo gastan pensando y llega una respuesta vacía.
     Medido contra el Worker: con 12 tokens devuelve vacío; con 200, responde.
     De ahí este suelo. */
  var TOPE_MINIMO = 200;

  function topeSano(n) {
    var t = parseInt(n, 10);
    if (isNaN(t) || t <= 0) t = 400;
    return Math.max(TOPE_MINIMO, t);
  }

  function mensajeDeError(status, body) {
    if (body && body.error === 'vacia') {
      return 'El modelo se quedó sin espacio para responder. Vuelve a intentarlo.';
    }
    if (body && body.mensaje) return body.mensaje;
    if (status === 403) return 'Este dispositivo no tiene permiso para usar la IA de Emprendo.';
    if (status === 429) return 'Se acabó la IA gratuita por hoy. Chispa sigue funcionando sin ella.';
    if (status === 404) return 'La dirección de la IA de Emprendo no es correcta.';
    return 'La IA de Emprendo no respondió.';
  }

  /** Petición cruda. `opts`: { sistema, historial, maxTokens }. */
  function pedir(mensaje, opts) {
    opts = opts || {};
    if (!disponible()) return Promise.reject(new Error('La IA de Emprendo no está configurada.'));
    if (typeof w.fetch !== 'function') return Promise.reject(new Error('Este navegador no puede conectarse.'));
    if (restante() <= 0) {
      return Promise.reject(new Error('Ya usaste tus ' + TOPE_DIARIO +
        ' consultas de IA de hoy. Chispa sigue respondiendo con sus reglas y cálculos.'));
    }

    var ctrl = null, timer = null;
    try {
      ctrl = new AbortController();
      timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || TIMEOUT_MS);
    } catch (e) { ctrl = null; }

    return w.fetch(cfg.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mensaje: String(mensaje || ''),
        sistema: opts.sistema || '',
        historial: opts.historial || [],
        maxTokens: topeSano(opts.maxTokens)
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (txt) {
        var body = null;
        try { body = JSON.parse(txt); } catch (e) {}
        if (!res.ok) throw new Error(mensajeDeError(res.status, body));
        var out = body && body.texto ? String(body.texto).trim() : '';
        if (!out) throw new Error('La IA devolvió una respuesta vacía.');
        if (!opts.noContar) apuntarUso();
        return out;
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      if (err && err.name === 'AbortError') throw new Error('La IA tardó demasiado en responder.');
      if (err && err.name === 'TypeError') throw new Error('Sin conexión con la IA de Emprendo.');
      throw err;
    });
  }

  /** Comprobación barata al configurarlo. No consume cuota del usuario. */
  function probar(url) {
    var previa = cfg.url, previoOn = cfg.on;
    cfg.url = normalizarUrl(url) || cfg.url;
    cfg.on = true;
    return pedir('Responde solo: ok', {
      sistema: 'Responde exactamente "ok".', maxTokens: TOPE_MINIMO, timeout: 20000, noContar: true
    })
      .then(function (r) { cfg.url = previa; cfg.on = previoOn; return r; })
      .catch(function (e) { cfg.url = previa; cfg.on = previoOn; throw e; });
  }

  w.AIWorker = {
    config: config, setConfig: setConfig, olvidar: olvidar,
    disponible: disponible, normalizarUrl: normalizarUrl,
    pedir: pedir, probar: probar,
    TOPE_DIARIO: TOPE_DIARIO, restante: restante, usadas: function () { return cuota().usadas; }
  };
})(window);
