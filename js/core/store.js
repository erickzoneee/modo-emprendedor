/* ==========================================================================
   MODO EMPRENDEDOR — Estado global y persistencia
   ========================================================================== */
(function (w) {
  'use strict';

  // La clave la manda js/data/brand.js. La reserva de aquí es literalmente la
  // misma cadena: si brand.js no cargara, el progreso se sigue encontrando.
  var KEY = (w.BRAND && w.BRAND.claves.estado) || 'modo-emprendedor:v1';
  var memoryFallback = null;

  /* ---------- almacenamiento tolerante a fallos (file://, modo privado) ---------- */
  var safeStorage = (function () {
    try {
      var t = '__me_test__';
      w.localStorage.setItem(t, '1');
      w.localStorage.removeItem(t);
      return w.localStorage;
    } catch (e) {
      return {
        getItem: function () { return memoryFallback; },
        setItem: function (k, v) { memoryFallback = v; },
        removeItem: function () { memoryFallback = null; }
      };
    }
  })();

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function shiftDay(iso, delta) {
    var d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function daysBetween(a, b) {
    if (!a || !b) return 999;
    var d1 = new Date(a + 'T00:00:00');
    var d2 = new Date(b + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000);
  }

  function defaults() {
    return {
      v: 1,
      createdAt: Date.now(),
      onboarded: false,

      profile: {
        name: 'Emprendedor',
        emoji: '🚀',
        goal: null,            // 'zero' | 'idea' | 'business'
        knowledge: null,       // 'none' | 'some' | 'lots'
        time: null,            // minutos/día
        budget: null,          // 'none' | 'low' | 'mid' | 'high'
        sector: null,          // clave de sector
        businessName: '',
        idea: ''
      },

      // Economía del juego
      xp: 0,
      coins: 100,
      hearts: 5,
      heartsTs: Date.now(),
      streak: 0,
      bestStreak: 0,
      lastDay: null,
      freezes: 1,
      hints: 0,
      boostUntil: 0,
      dailyGoal: 30,
      xpToday: 0,
      xpTodayDay: null,

      // Progreso
      lessons: {},             // id -> { done, score, stars, at, attempts }
      missions: {},            // id -> { answers, score, at, verified }
      badges: [],
      unlockedLevels: 1,

      // Perfil del emprendimiento: la fuente de contexto de toda la app.
      // Es un mapa desde el principio aunque solo haya uno activo: añadir
      // varios después es cambiar activeId, no migrar datos.
      // Lo construye y lo mantiene js/core/venture.js.
      ventures: { activeId: null, list: {} },

      // Expediente "Mi Negocio"
      dossier: {},

      // Simulador
      sim: null,

      // Liga
      league: { week: null, xp: 0, tier: 0, bots: [] },

      // Historial del mentor
      chat: [],

      // Conversación en curso de Chispa: la pregunta que quedó a medias y los
      // datos que ya respondió. Vive aquí para sobrevivir a cerrar la app.
      chispa: { pendiente: null, datos: {} },

      // Retos semanales
      weekly: { week: null, progress: {}, claimed: [] },

      settings: {
        sound: true, haptics: true, theme: 'light', reduceMotion: false,
        // Lectura en voz alta (js/core/speech.js)
        speech: true,        // muestra los botones de altavoz
        speechRate: 1,       // velocidad de lectura
        voice: '',           // voz elegida; vacío = la mejor en español que haya
        autoRead: false,     // leer solo al abrir cada paso, sin tocar nada
        // Interruptor maestro de la apariencia por emprendimiento
        // (js/core/persona.js). Va aquí y no en el perfil del negocio porque
        // es una preferencia de la persona: debe sobrevivir a registrar otra
        // idea. merge() lo inyecta solo en los guardados que ya existían.
        personalizacion: true,
        // ¿Ya vio la promesa "Tu idea es tuya"? (js/core/promesa.js)
        // Se enseña una sola vez, justo antes de la primera pregunta del
        // registro. Vive aquí y no en el perfil del negocio a propósito: es de
        // la persona, así que sobrevive a registrar otra idea y no se repite.
        // A quien ya venía usando la app merge() le da este valor base, así
        // que la verá una vez si algún día vuelve a registrar una idea.
        promesaVista: false,
        // ¿Los retos de la semana se ven desplegados en la Ruta?
        // Empieza en true a propósito: quien entra por primera vez —y quien ya
        // venía usando la app, porque merge() da el valor base a las claves que
        // no existen en su guardado— tiene que ver la función al menos una vez
        // antes de poder decidir esconderla. A partir del primer toque manda
        // su elección, y sobrevive a cambiar de pantalla y a cerrar la app.
        retosAbiertos: true
      },

      // Respaldo: el progreso vive solo en este dispositivo, así que hay que
      // recordarlo activamente antes de que alguien pierda todo.
      backup: { lastAt: 0, promptedDay: null, remind: true },

      stats: { answers: 0, correct: 0, lessons: 0, missions: 0, days: [], minutes: 0 }
    };
  }

  var state = defaults();
  var listeners = [];
  var saveTimer = null;

  /* ==================================================================
     ESQUEMA Y MIGRACIONES

     ESQUEMA es la forma que entiende esta versión del código. Un guardado
     con una forma anterior se pasa por MIGRACIONES hasta ponerlo al día; uno
     que no se puede leer no se borra, se aparta.

     Antes esto era una línea —`if (parsed.v !== 1) return false`— y costaba
     el progreso entero: load() devolvía false, y rollDay() escribía los
     valores por defecto encima del guardado bueno antes de que nadie se
     enterase. Subir el número de esquema habría vaciado a todos los usuarios.

     Para estrenar un esquema: sube ESQUEMA y añade la función que lleva del
     número anterior al nuevo. Recibe el estado y lo devuelve; de `v` se
     encarga el motor.
     ================================================================== */

  var ESQUEMA = 1;
  var KEY_CUARENTENA = KEY + ':cuarentena';

  var MIGRACIONES = {
    // 1: function (s) { …; return s; }   ← de v1 a v2, cuando haga falta
  };

  /** Cambiar el prototipo del estado o su constructor no es un dato: es un
      ataque. JSON.parse crea esas claves como propiedades propias, así que
      hay que descartarlas a mano. */
  function prohibida(k) {
    return k === '__proto__' || k === 'constructor' || k === 'prototype';
  }

  /** Copia profunda sin las claves prohibidas. El tope de profundidad frena
      un respaldo anidado a mano para agotar la pila. */
  function limpiar(v, prof) {
    prof = prof || 0;
    if (!v || typeof v !== 'object') return v;
    // Pasado el fondo se corta en seco en vez de devolver la rama sin revisar:
    // devolverla tal cual dejaría sin limpiar justo la parte que alguien se
    // molestó en enterrar tan hondo. El estado real no baja de seis niveles.
    if (prof > 12) return Array.isArray(v) ? [] : {};
    if (Array.isArray(v)) {
      var arr = [];
      for (var i = 0; i < v.length; i++) arr.push(limpiar(v[i], prof + 1));
      return arr;
    }
    var out = {};
    for (var k in v) {
      if (!Object.prototype.hasOwnProperty.call(v, k)) continue;
      if (prohibida(k)) continue;
      out[k] = limpiar(v[k], prof + 1);
    }
    return out;
  }

  /** Aparta un guardado ilegible sin destruirlo. No pisa una cuarentena
      anterior: la primera es la que está más cerca de los datos buenos. */
  function cuarentena(raw, motivo) {
    try {
      if (safeStorage.getItem(KEY_CUARENTENA)) return;
      safeStorage.setItem(KEY_CUARENTENA, JSON.stringify({
        at: Date.now(), motivo: motivo, datos: String(raw).slice(0, 1000000)
      }));
      console.warn('[store] guardado apartado en cuarentena:', motivo);
    } catch (e) { console.warn('[store] no se pudo apartar el guardado:', e); }
  }

  /** Lleva un estado desde su esquema hasta el actual. Devuelve null si no
      puede: quien llama decide, pero el original nunca se pierde. */
  function migrar(parsed) {
    var v = parsed.v;
    if (typeof v !== 'number' || !isFinite(v) || v < 1) return null;
    if (v > ESQUEMA) return null;            // viene de una versión más nueva
    var s = parsed, vueltas = 0;
    while (s.v < ESQUEMA) {
      if (++vueltas > 50) return null;
      var paso = MIGRACIONES[s.v];
      if (typeof paso !== 'function') return null;
      var desde = s.v;
      try { s = paso(s); } catch (e) { return null; }
      if (!s || typeof s !== 'object') return null;
      s.v = desde + 1;
    }
    return s;
  }

  function load() {
    var raw = null;
    try { raw = safeStorage.getItem(KEY); }
    catch (e) { console.warn('[store] no se pudo leer:', e); return false; }
    if (!raw) return false;

    var parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { cuarentena(raw, 'json-ilegible'); return false; }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      cuarentena(raw, 'forma-inesperada');
      return false;
    }

    var alDia = migrar(parsed);
    if (!alDia) {
      cuarentena(raw, parsed.v > ESQUEMA ? 'esquema-mas-nuevo' : 'sin-migracion');
      return false;
    }

    try {
      state = merge(defaults(), limpiar(alDia));
      return true;
    } catch (e) {
      cuarentena(raw, 'merge-fallido');
      console.warn('[store] no se pudo cargar:', e);
      return false;
    }
  }

  function merge(base, over) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) {
      if (!Object.prototype.hasOwnProperty.call(over, k)) continue;
      if (prohibida(k)) continue;   // segunda barrera: merge() también recibe respaldos
      var bv = base[k], ov = over[k];
      if (bv && ov && typeof bv === 'object' && typeof ov === 'object' &&
          !Array.isArray(bv) && !Array.isArray(ov)) {
        out[k] = merge(bv, ov);
      } else {
        out[k] = ov;
      }
    }
    return out;
  }

  /* El almacenamiento se puede llenar, y hasta ahora eso se tragaba con un
     console.warn: el usuario seguía jugando durante horas creyendo que se
     guardaba, y no se guardaba nada. Ahora queda constancia y se avisa una
     vez, para que la app pueda decirlo en pantalla. */
  var errorGuardado = null;

  function save(immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    var doSave = function () {
      saveTimer = null;
      try {
        safeStorage.setItem(KEY, JSON.stringify(state));
        if (errorGuardado) { errorGuardado = null; notify('guardado-ok'); }
      } catch (e) {
        var lleno = !!(e && (e.name === 'QuotaExceededError' ||
                             e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22));
        var antes = errorGuardado;
        errorGuardado = lleno ? 'lleno' : 'fallo';
        console.warn('[store] no se pudo guardar:', e);
        if (antes !== errorGuardado) notify('guardado-error');
      }
    };
    if (immediate) doSave(); else saveTimer = setTimeout(doSave, 220);
  }

  function notify(reason) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state, reason); } catch (e) { console.error(e); }
    }
  }

  /* ==================================================================
     RESPALDOS

     Un respaldo llega de fuera: de un archivo que el usuario eligió, que
     pudo editarse, corromperse o venir de otra app. Se valida entero antes
     de tocar nada, y se devuelve un resumen para poder preguntar «esto es
     lo que vas a sobrescribir, ¿seguro?» en vez de restaurar a ciegas.
     ================================================================== */

  var MAX_RESPALDO = 2 * 1024 * 1024;      // 2 MB: un progreso real ronda los 60 KB

  var NO_VALIDO   = 'El archivo no es un respaldo de EMPRENDO.';
  var DANADO      = 'El respaldo tiene datos dañados y no se puede usar.';

  /** Lee un respaldo y dice qué trae, sin tocar el progreso actual. */
  function inspectBackup(txt) {
    var s = String(txt == null ? '' : txt);
    if (!s.trim()) throw new Error('El archivo está vacío.');
    if (s.length > MAX_RESPALDO) {
      throw new Error('El archivo es demasiado grande para ser un respaldo.');
    }

    var parsed;
    try { parsed = JSON.parse(s); } catch (e) { throw new Error(NO_VALIDO); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(NO_VALIDO);
    }
    if (typeof parsed.v !== 'number') throw new Error(NO_VALIDO);
    if (parsed.v > ESQUEMA) {
      throw new Error('Ese respaldo viene de una versión más nueva de la app. Actualízala e inténtalo otra vez.');
    }

    var alDia = migrar(parsed);
    if (!alDia) throw new Error('Ese respaldo tiene un formato que esta versión no sabe leer.');

    var limpio = limpiar(alDia);

    /* Comprobación de tipos. Un respaldo con `xp: "mucho"` o `lessons: []`
       no rompe aquí: rompe mucho después, al pintar, y con un error que no
       señala a la importación. Se rechaza ahora. */
    var numeros = ['xp', 'coins', 'hearts', 'streak', 'unlockedLevels'];
    for (var i = 0; i < numeros.length; i++) {
      var n = limpio[numeros[i]];
      if (n !== undefined && (typeof n !== 'number' || !isFinite(n))) throw new Error(DANADO);
    }
    /* Todos los campos del estado que la app da por objeto. Si uno llega como
       cadena o como array, merge() lo copia tal cual y el fallo aparece luego,
       lejos de aquí: `league: "hola"` revienta en rollDay() al asignarle una
       semana, y el usuario ve una app rota sin relación con lo que hizo. */
    var objetos = ['profile', 'lessons', 'missions', 'dossier', 'settings', 'stats',
                   'ventures', 'league', 'weekly', 'chispa', 'backup'];
    for (var j = 0; j < objetos.length; j++) {
      var o = limpio[objetos[j]];
      if (o !== undefined && (!o || typeof o !== 'object' || Array.isArray(o))) throw new Error(DANADO);
    }
    // El simulador es el único que vale nulo: así empieza, sin partida abierta.
    if (limpio.sim !== undefined && limpio.sim !== null &&
        (typeof limpio.sim !== 'object' || Array.isArray(limpio.sim))) throw new Error(DANADO);
    if (limpio.badges !== undefined && !Array.isArray(limpio.badges)) throw new Error(DANADO);
    if (limpio.chat !== undefined && !Array.isArray(limpio.chat)) throw new Error(DANADO);

    var st = limpio.stats || {};
    var perfil = limpio.profile || {};
    return {
      estado: limpio,
      resumen: {
        lecciones: +st.lessons || 0,
        misiones: +st.missions || 0,
        xp: +limpio.xp || 0,
        racha: +limpio.streak || 0,
        negocio: String(perfil.businessName || perfil.idea || '').slice(0, 80),
        creado: +limpio.createdAt || 0
      }
    };
  }

  var Store = {
    get state() { return state; },

    init: function () {
      var had = load();
      Store.rollDay();
      return had;
    },

    /** Cambia el estado con una función mutadora y persiste. */
    set: function (fn, reason) {
      fn(state);
      save();
      notify(reason || 'set');
      return state;
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },

    save: save,
    today: today,
    daysBetween: daysBetween,

    /** Actualiza racha, vidas regeneradas y contadores diarios. */
    rollDay: function () {
      var t = today();
      var changed = false;

      // Reinicio del XP diario
      if (state.xpTodayDay !== t) {
        state.xpTodayDay = t;
        state.xpToday = 0;
        changed = true;
      }

      // Racha: si pasó más de 1 día sin actividad, se pierde (salvo congelador)
      if (state.lastDay) {
        var gap = daysBetween(state.lastDay, t);
        if (gap > 1) {
          if (state.freezes > 0 && gap === 2) {
            state.freezes--;
            // Se apunta a ayer, no a hoy: así la sesión de hoy sí suma a la racha.
            state.lastDay = shiftDay(t, -1);
            state.__freezeUsed = true;
          } else if (gap > 1) {
            state.streak = 0;
          }
          changed = true;
        }
      }

      // Regeneración de vidas: 1 cada 30 min
      var REGEN = 30 * 60 * 1000;
      if (state.hearts < 5) {
        var elapsed = Date.now() - (state.heartsTs || Date.now());
        var gained = Math.floor(elapsed / REGEN);
        if (gained > 0) {
          state.hearts = Math.min(5, state.hearts + gained);
          state.heartsTs = state.hearts >= 5 ? Date.now() : state.heartsTs + gained * REGEN;
          changed = true;
        }
      } else {
        state.heartsTs = Date.now();
      }

      // Semana de liga / retos
      var wk = Store.weekKey();
      if (state.league.week !== wk) {
        state.league.week = wk;
        state.league.xp = 0;
        state.league.bots = null;   // se regeneran en engine
        changed = true;
      }
      if (state.weekly.week !== wk) {
        state.weekly.week = wk;
        state.weekly.progress = {};
        state.weekly.claimed = [];
        changed = true;
      }

      if (changed) save();
      return changed;
    },

    weekKey: function () {
      var d = new Date();
      var target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      var dayNum = (target.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - dayNum + 3);
      var firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
      var diff = target - firstThursday;
      var week = 1 + Math.round(diff / 604800000);
      return target.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
    },

    reset: function () {
      state = defaults();
      save(true);
      notify('reset');
    },

    exportJSON: function () {
      return JSON.stringify(state, null, 2);
    },

    /** Anota que el usuario acaba de respaldar (para no volver a insistir). */
    markBackup: function () {
      Store.set(function (s) {
        if (!s.backup) s.backup = { lastAt: 0, promptedDay: null, remind: true };
        s.backup.lastAt = Date.now();
        s.backup.promptedDay = today();
      }, 'backup');
    },

    /** Días desde el último respaldo. null si nunca se ha hecho uno. */
    daysSinceBackup: function () {
      if (!state.backup || !state.backup.lastAt) return null;
      return Math.floor((Date.now() - state.backup.lastAt) / 86400000);
    },

    inspectBackup: inspectBackup,
    MAX_RESPALDO: MAX_RESPALDO,

    /** Restaura un respaldo. Acepta el texto o el objeto que ya devolvió
        inspectBackup(), para no validar dos veces. Lanza si no es válido:
        antes cualquier JSON que parseara —un `[]`, un package.json— se
        aceptaba y destruía el progreso mostrando «Progreso restaurado». */
    importJSON: function (txt) {
      var info = (txt && typeof txt === 'object' && txt.estado) ? txt : inspectBackup(txt);
      state = merge(defaults(), info.estado);
      save(true);
      notify('import');
      return info.resumen;
    },

    KEY: KEY,

    /** Vuelve a leer lo guardado y lo adopta. La usa app.js cuando otra
        pestaña escribe: sin esto, la pestaña que se oculta guardaba su copia
        vieja encima de lo que la otra acababa de hacer. */
    reload: function () {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      var had = load();
      if (had) notify('externo');
      return had;
    },

    /** Qué falló al guardar: 'lleno', 'fallo' o null si todo va bien. */
    errorGuardado: function () { return errorGuardado; },

    /** El guardado que no se pudo leer, si lo hubo. Nada lo borra: existe
        para que una pantalla futura pueda ofrecer recuperarlo a mano. */
    cuarentena: function () {
      try {
        var raw = safeStorage.getItem(KEY_CUARENTENA);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
  };

  w.Store = Store;
})(window);
