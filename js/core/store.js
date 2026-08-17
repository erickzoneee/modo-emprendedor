/* ==========================================================================
   MODO EMPRENDEDOR — Estado global y persistencia
   ========================================================================== */
(function (w) {
  'use strict';

  var KEY = 'modo-emprendedor:v1';
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
        personalizacion: true
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

  function load() {
    try {
      var raw = safeStorage.getItem(KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1) return false;
      state = merge(defaults(), parsed);
      return true;
    } catch (e) {
      console.warn('[store] no se pudo cargar:', e);
      return false;
    }
  }

  function merge(base, over) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) {
      if (!Object.prototype.hasOwnProperty.call(over, k)) continue;
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

  function save(immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    var doSave = function () {
      try { safeStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { console.warn('[store] no se pudo guardar:', e); }
    };
    if (immediate) doSave(); else saveTimer = setTimeout(doSave, 220);
  }

  function notify(reason) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state, reason); } catch (e) { console.error(e); }
    }
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

    importJSON: function (txt) {
      var parsed = JSON.parse(txt);
      if (!parsed || typeof parsed !== 'object') throw new Error('Archivo inválido');
      state = merge(defaults(), parsed);
      save(true);
      notify('import');
    }
  };

  w.Store = Store;
})(window);
