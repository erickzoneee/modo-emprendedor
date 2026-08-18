/* ==========================================================================
   MODO EMPRENDEDOR — arranque, barra superior y navegación
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  var TABS = [
    { key: 'home',      icon: '🗺️', label: 'Ruta' },
    { key: 'simulator', icon: '🏭', label: 'Simulador' },
    { key: 'mentor',    icon: '🧠', label: 'Mentor' },
    { key: 'business',  icon: '📂', label: 'Negocio' },
    { key: 'profile',   icon: '👤', label: 'Perfil' }
  ];

  var NO_CHROME = { onboarding: 1, lesson: 1, mission: 1 };

  /* Pantallas que se pueden volver a pintar sin quitarle nada al usuario. Es
     lista blanca y no lista negra a propósito: una pantalla nueva no debería
     heredar el permiso de interrumpir sin que alguien lo decida. Las que
     faltan —lección, reto, registro, simulador, mentor, emprendimiento,
     apariencia— tienen trabajo a medias que no se puede tirar. */
  var REPINTABLE = { home: 1, profile: 1, league: 1, business: 1 };

  /* ------------------------- Barra superior ------------------------- */

  function renderTopbar() {
    var bar = d.getElementById('topbar');
    if (!bar) return;
    var s = w.Store.state;
    UI.clear(bar);

    var rank = C.rankFor(s.xp);

    // Racha
    bar.appendChild(statBtn('stat--streak', s.streak > 0 ? '🔥' : '🕯️', String(s.streak), function () {
      UI.sheet([
        el('div', { class: 'col', style: { alignItems: 'center', gap: '10px' } }, [
          el('div', { class: 'flame', style: { fontSize: '54px' }, text: '🔥' }),
          el('div', { class: 'h1', text: UI.days(s.streak) }),
          el('div', { class: 'small t-center', text: 'Tu mejor racha: ' + UI.days(s.bestStreak) + '.\nCompleta una lección al día para no perderla.' }),
          s.freezes > 0 ? UI.chip(s.freezes + ' congelador' + (s.freezes === 1 ? '' : 'es'), 'blue', '🧊') : null
        ]),
        UI.btn('Entendido', { variant: 'ghost', onClick: UI.closeSheet })
      ]);
    }, s.streak === 0));

    // Monedas
    bar.appendChild(statBtn('stat--gem', '🪙', UI.num(s.coins), function () { w.Shop.open(); }));

    // Vidas
    var eta = w.Engine.heartsETA();
    bar.appendChild(statBtn('stat--heart', s.hearts > 0 ? '❤️' : '💔', String(s.hearts), function () {
      UI.sheet([
        el('div', { class: 'col', style: { alignItems: 'center', gap: '10px' } }, [
          el('div', { style: { fontSize: '48px' }, text: s.hearts > 0 ? '❤️' : '💔' }),
          el('div', { class: 'h2', text: s.hearts + ' de 5 vidas' }),
          el('div', { class: 'small t-center', text: eta
            ? 'Siguiente vida en ' + eta + '. Se recupera una cada 30 minutos.'
            : 'Tienes todas tus vidas. Se pierde una por cada error en las lecciones.' })
        ]),
        s.hearts < 5 ? UI.btn('Recargar por 60 🪙', { variant: 'gold', onClick: function () {
          if (w.Store.state.coins < 60) { UI.toast('No tienes suficientes monedas', 'red', '🪙'); return; }
          w.Engine.addCoins(-60); w.Engine.refillHearts();
          UI.closeSheet(); renderTopbar(); UI.toast('¡Vidas recargadas!', 'green', '❤️');
        } }) : null,
        UI.btn('Cerrar', { variant: 'ghost', onClick: UI.closeSheet })
      ]);
    }, s.hearts === 0));

    // XP doble activo
    if (s.boostUntil && Date.now() < s.boostUntil) {
      bar.appendChild(statBtn('stat--xp', '⚡', 'x2', function () {
        var min = Math.max(1, Math.ceil((s.boostUntil - Date.now()) / 60000));
        UI.toast('XP doble activo ' + min + ' minuto' + (min === 1 ? '' : 's') + ' más', 'gold', '⚡');
      }));
    }

    bar.appendChild(el('div', { class: 'grow' }));

    // XP / rango
    bar.appendChild(statBtn('stat--xp', rank.icon, UI.num(s.xp), function () { UI.Router.go('profile'); }));

    // Liga
    var league = C.LEAGUES[w.Engine.leagueTier()];
    bar.appendChild(statBtn('', league.icon, '', function () { UI.Router.go('league'); }));
  }

  function statBtn(cls, icon, value, onClick, off) {
    return el('button', {
      class: 'stat ' + cls + (off ? ' stat--off' : ''), type: 'button',
      onclick: function () { w.Sound.tap(); onClick(); }
    }, [
      el('span', { class: 'stat__icon' + (cls === 'stat--streak' && !off ? ' flame' : ''), text: icon }),
      value ? el('span', { text: value }) : null
    ]);
  }

  /* ------------------------- Tabbar ------------------------- */

  function renderTabbar(active) {
    var bar = d.getElementById('tabbar');
    if (!bar) return;
    UI.clear(bar);
    var weekly = w.Engine.weeklyList().some(function (x) { return x.complete && !x.claimed; });

    TABS.forEach(function (t) {
      var isActive = t.key === active;
      var btn = el('button', {
        class: 'tab' + (isActive ? ' is-active' : ''), type: 'button',
        'aria-label': t.label,
        onclick: function () {
          if (isActive) return;
          w.Sound.whoosh();
          w.Sound.buzz(10);
          UI.Router.go(t.key);
        }
      }, [
        el('span', { class: 'tab__ico', text: t.icon }),
        el('span', { text: t.label })
      ]);
      if (t.key === 'home' && weekly) btn.appendChild(el('span', { class: 'tab__dot' }));
      bar.appendChild(btn);
    });
  }

  /* ------------------------- Cromo ------------------------- */

  function showChrome(on) {
    d.getElementById('topbar').hidden = !on;
    d.getElementById('tabbar').hidden = !on;
  }

  function onRoute(name) {
    var chrome = !NO_CHROME[name];
    showChrome(chrome);
    if (chrome) {
      renderTopbar();
      renderTabbar(TABS.some(function (t) { return t.key === name; }) ? name : null);
    }
  }

  /* ------------------------- Respaldo ------------------------- */

  var BACKUP_FILE = 'modo-emprendedor-respaldo.json';
  var BACKUP_EVERY_DAYS = 7;

  function exportBackup() {
    UI.download(BACKUP_FILE, w.Store.exportJSON());
    w.Store.markBackup();
    UI.toast('Respaldo descargado', 'green', '⬇️');
  }

  function copyBackup() {
    UI.copy(w.Store.exportJSON());
    w.Store.markBackup();
  }

  /** Cuánto progreso hay realmente en juego: no se molesta a quien acaba de entrar. */
  function backupStake() {
    var s = w.Store.state;
    var secciones = s.dossier ? Object.keys(s.dossier).length : 0;
    return s.stats.lessons + s.stats.missions * 3 + secciones;
  }

  /** Recordatorio automático: la exportación existe, pero nadie la usa a tiempo. */
  function maybeRemindBackup() {
    var s = w.Store.state;
    var b = s.backup;
    if (!b || b.remind === false) return;
    if (backupStake() < 4) return;                    // todavía no hay nada que perder
    var t = w.Store.today();
    if (b.promptedDay === t) return;                  // como mucho, una vez al día
    var since = w.Store.daysSinceBackup();
    if (since != null && since < BACKUP_EVERY_DAYS) return;

    w.Store.set(function (st) { st.backup.promptedDay = t; }, 'backup');
    backupSheet(since);
  }

  function backupSheet(since) {
    var s = w.Store.state;
    UI.sheet([
      el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('h2', { class: 'h4', text: 'Guarda una copia de tu progreso' }),
          el('div', { class: 'small', style: { marginTop: '6px' },
            text: since == null
              ? 'Todo lo que llevas vive solo en este navegador. Si borras los datos del sitio o cambias de teléfono, se pierde. Evitarlo toma cinco segundos.'
              : 'Tu último respaldo fue hace ' + UI.days(since) + '. Todo lo que hiciste desde entonces solo existe en este navegador.' })
        ])
      ]),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        UI.chip(UI.count(s.stats.lessons, 'lección', 'lecciones'), 'green', '📚'),
        UI.chip(UI.count(s.stats.missions, 'misión', 'misiones'), 'purple', '🎯'),
        UI.chip(UI.num(s.xp) + ' XP', 'gold', '⚡'),
        s.streak > 0 ? UI.chip('racha de ' + UI.days(s.streak), 'brand', '🔥') : null
      ]),
      UI.btn('Descargar respaldo', {
        variant: 'brand', size: 'lg',
        onClick: function () { exportBackup(); UI.closeSheet(); }
      }),
      UI.btn('Copiar al portapapeles', {
        variant: 'ghost',
        onClick: function () { copyBackup(); UI.closeSheet(); }
      }),
      el('div', { class: 'tiny t-center', style: { textTransform: 'none', letterSpacing: '0' },
        text: 'Pégalo en tus notas, en un correo o en tu nube: se restaura desde Perfil › Importar.' }),
      UI.btn('Ahora no', { variant: 'flat', onClick: UI.closeSheet }),
      UI.btn('No volver a recordármelo', {
        variant: 'flat',
        onClick: function () {
          w.Store.set(function (st) { st.backup.remind = false; }, 'backup');
          UI.closeSheet();
          UI.toast('Puedes reactivarlo en Perfil › Ajustes', 'blue', '⚙️', 3400);
        }
      })
    ]);
  }

  /* ------------------------- Instalación (PWA) ------------------------- */

  var deferredPrompt = null;

  /** ¿Ya se está usando como app instalada? Entonces no hay nada que ofrecer. */
  function isStandalone() {
    try {
      return (w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) ||
             w.navigator.standalone === true;
    } catch (e) { return false; }
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(w.navigator.userAgent) ||
           // iPad moderno se declara como Mac; se distingue por el táctil.
           (/macintosh/i.test(w.navigator.userAgent) && w.navigator.maxTouchPoints > 1);
  }

  // Chrome lanza esto cuando la app cumple los requisitos de instalación.
  // Hay que guardarlo: solo se puede mostrar el diálogo desde un gesto del usuario.
  w.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  w.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    UI.toast('¡Instalada! Ya puedes abrirla desde tu pantalla de inicio', 'green', '🚀', 4000);
  });

  function canInstall() { return !!deferredPrompt; }

  function promptInstall() {
    if (!deferredPrompt) return Promise.resolve(false);
    var p = deferredPrompt;
    deferredPrompt = null;                 // un evento guardado solo sirve una vez
    p.prompt();
    return p.userChoice.then(function (r) {
      return r && r.outcome === 'accepted';
    }).catch(function () { return false; });
  }

  /* ------------------------- Service worker ------------------------- */

  function registerSW() {
    if (!('serviceWorker' in w.navigator)) return;
    // file:// no admite service workers y https es obligatorio salvo en local.
    var esLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !esLocal) return;
    // Después de la carga: registrar el SW compite con el arranque de la app.
    w.addEventListener('load', function () {
      w.navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('[sw] no se pudo registrar:', e);
      });
    });
  }

  /* ------------------------- Accesos directos ------------------------- */

  /** Los accesos directos del icono instalado abren ./?go=mentor y similares. */
  function shortcutRoute() {
    try {
      var m = /[?&]go=([a-z]+)/i.exec(location.search || '');
      if (!m) return null;
      var destino = m[1].toLowerCase();
      var valida = TABS.some(function (t) { return t.key === destino; });
      // La URL se limpia siempre: si no, recargar repetiría el salto.
      if (w.history && w.history.replaceState) {
        w.history.replaceState(null, '', location.pathname);
      }
      return valida ? destino : null;
    } catch (e) { return null; }
  }

  /* ------------------------- Arranque ------------------------- */

  function boot() {
    w.FX.init();
    var had = w.Store.init();
    // El perfil del emprendimiento se garantiza en el arranque: quien ya venía
    // usando la app lo recibe migrado desde su perfil y su expediente, sin
    // perder XP, racha, lecciones ni insignias.
    try { w.Venture.ensure(); } catch (e) { console.warn('[venture]', e); }
    var s = w.Store.state;

    d.documentElement.setAttribute('data-theme', s.settings.theme || 'light');

    // La apariencia del negocio, antes de pintar la primera pantalla: si se
    // aplicara después, se vería un parpadeo del tema genérico al del usuario.
    // asegurar() es idempotente a propósito — boot() vuelve a ejecutarse al
    // restaurar un respaldo o al reiniciar el progreso.
    try { w.Persona.asegurar(); } catch (e) { console.warn('[persona]', e); }

    if (s.__freezeUsed) {
      w.Store.set(function (st) { delete st.__freezeUsed; }, 'freeze');
      setTimeout(function () {
        UI.toast('Se usó un congelador: tu racha sigue viva', 'blue', '🧊', 3600);
      }, 900);
    }

    UI.Router.stack = [];
    UI.Router.current = null;

    // Se consulta siempre, incluso en el onboarding: así la URL queda limpia.
    var atajo = shortcutRoute();

    if (!had || !s.onboarded) {
      showChrome(false);
      UI.Router.go('onboarding', {}, 'none');
    } else {
      showChrome(true);
      UI.Router.go(atajo || 'home', {}, 'none');
      greet();
      // Después del saludo, para no encimar dos avisos.
      setTimeout(maybeRemindBackup, 5200);
    }

    enlazarUnaVez();
  }

  /* ------------------------- Enlaces de por vida -------------------------

     boot() no se ejecuta una sola vez: vuelve a correr al restaurar un
     respaldo y al reiniciar el progreso. Todo lo que se enganche aquí dentro
     sin protección se duplica en cada pasada — un temporizador más, un
     oyente más, un aviso repetido por cada vez que el usuario restauró algo.
     Esto se engancha una vez y para siempre.
     ------------------------------------------------------------------------ */

  var enlazado = false;

  function enlazarUnaVez() {
    if (enlazado) return;
    enlazado = true;

    // Regeneración de vidas en segundo plano
    setInterval(function () {
      if (w.Store.rollDay()) {
        if (!NO_CHROME[UI.Router.current]) renderTopbar();
      }
    }, 30000);

    // Refresca al volver a la pestaña y asegura el guardado al salir
    d.addEventListener('visibilitychange', function () {
      if (d.hidden) {
        w.Store.save(true);     // el guardado normal está diferido: al ocultar, se fuerza
      } else {
        w.Store.rollDay();
        if (!NO_CHROME[UI.Router.current]) renderTopbar();
      }
    });
    w.addEventListener('pagehide', function () { w.Store.save(true); });
    w.addEventListener('beforeunload', function () { w.Store.save(true); });

    /* Con dos pestañas abiertas cada una tenía su copia del estado en memoria,
       y la que se ocultaba escribía la suya encima de lo que la otra acabara
       de hacer: una lección terminada en una pestaña desaparecía al volver de
       la otra. El evento 'storage' solo llega a las DEMÁS pestañas, que es
       justo lo que hace falta: la que no escribió adopta lo escrito. */
    w.addEventListener('storage', function (e) {
      if (!e || e.key !== w.Store.KEY || !e.newValue) return;
      if (!w.Store.reload()) return;
      try { w.Venture.ensure(); } catch (err) { console.warn('[venture]', err); }
      try { w.Persona.asegurar(); } catch (err) { console.warn('[persona]', err); }
      if (!NO_CHROME[UI.Router.current]) renderTopbar();
      // Los datos se adoptan siempre; la pantalla solo se vuelve a pintar si
      // no hay nada a medias. Redibujar una lección a medio contestar, un
      // reto a medio escribir o el registro a medio llenar por culpa de otra
      // pestaña olvidada sería un remedio peor que la enfermedad.
      if (REPINTABLE[UI.Router.current]) UI.Router.refresh();
    });

    /* Quedarse sin espacio era invisible: la app seguía respondiendo, el
       usuario seguía avanzando y no se guardaba nada. Se avisa una sola vez,
       cuando ocurre. */
    w.Store.subscribe(function (s, motivo) {
      if (motivo !== 'guardado-error') return;
      UI.toast(w.Store.errorGuardado() === 'lleno'
        ? 'No queda espacio en este dispositivo: tu avance no se está guardando'
        : 'No se pudo guardar tu avance en este dispositivo',
        'red', '⚠️', 6000);
    });
  }

  function greet() {
    var s = w.Store.state;
    var t = w.Store.today();
    if (s.lastDay === t) return;
    var gap = s.lastDay ? w.Store.daysBetween(s.lastDay, t) : 0;
    setTimeout(function () {
      if (gap > 1 && s.bestStreak >= 3) {
        UI.toast('Te extrañamos. Hoy retomas donde lo dejaste.', 'blue', '👋', 3600);
      } else if (s.streak > 0) {
        UI.toast('Racha de ' + UI.days(s.streak) + '. ¡No la rompas hoy!', 'gold', '🔥', 3200);
      }
    }, 800);
  }

  /* ------------------------- Errores visibles ------------------------- */

  w.addEventListener('error', function (e) {
    console.error(e.error || e.message);
  });

  /* ------------------------- Restaurar un respaldo -------------------------

     Vive aquí, y no en cada pantalla que lo ofrece, porque el registro y el
     perfil tenían el mismo código copiado y con el mismo agujero: leían el
     archivo entero sin mirar su tamaño y llamaban a importJSON() a ciegas.
     Cualquier .json que parseara —uno vacío, uno de otra app, uno a medio
     descargar— sustituía el progreso y anunciaba «Progreso restaurado».

     Ahora se comprueba el tamaño antes de leer, se valida el contenido antes
     de tocar nada, y se enseña lo que trae para que el usuario confirme.
     ------------------------------------------------------------------------ */

  function restoreFromFile(file, onDone) {
    if (!file) return;

    if (file.size > w.Store.MAX_RESPALDO) {
      UI.toast('Ese archivo es demasiado grande para ser un respaldo', 'red', '⚠️', 4200);
      return;
    }

    var fr = new FileReader();
    fr.onerror = function () { UI.toast('No se pudo leer el archivo', 'red', '⚠️'); };
    fr.onload = function () {
      var info;
      try { info = w.Store.inspectBackup(fr.result); }
      catch (e) { UI.toast((e && e.message) || 'Archivo inválido', 'red', '⚠️', 4600); return; }
      confirmRestore(info, onDone);
    };
    fr.readAsText(file);
  }

  /** Lo que hay dentro del respaldo, y lo que se va a perder al aceptarlo. */
  function confirmRestore(info, onDone) {
    var r = info.resumen;
    var s = w.Store.state;
    var hayAlgo = backupStake() >= 1;

    UI.sheet([
      el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('h2', { class: 'h4', text: 'Esto trae el respaldo' }),
          el('div', { class: 'small', style: { marginTop: '6px' },
            text: r.negocio ? 'Tu emprendimiento: ' + r.negocio : 'Un progreso sin emprendimiento registrado.' })
        ])
      ]),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        UI.chip(UI.count(r.lecciones, 'lección', 'lecciones'), 'green', '📚'),
        UI.chip(UI.count(r.misiones, 'misión', 'misiones'), 'purple', '🎯'),
        UI.chip(UI.num(r.xp) + ' XP', 'gold', '⚡'),
        r.racha > 0 ? UI.chip('racha de ' + UI.days(r.racha), 'brand', '🔥') : null
      ]),
      hayAlgo ? el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: 'Lo que tienes ahora se sustituye' }),
        el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0', lineHeight: '1.6' },
          text: UI.count(s.stats.lessons, 'lección', 'lecciones') + ' · ' +
                UI.count(s.stats.missions, 'misión', 'misiones') + ' · ' +
                UI.num(s.xp) + ' XP. Si esto es lo bueno, descarga una copia antes de continuar.' })
      ]) : null,
      UI.btn('Restaurar este respaldo', {
        variant: 'brand', size: 'lg',
        onClick: function () {
          try { w.Store.importJSON(info); }
          catch (e) { UI.closeSheet(); UI.toast((e && e.message) || 'Archivo inválido', 'red', '⚠️', 4600); return; }
          w.Store.markBackup();   // quien restaura ya tiene una copia: no hay que insistirle
          UI.closeSheet();
          UI.toast('Progreso restaurado', 'green', '✅');
          if (onDone) onDone(); else boot();
        }
      }),
      hayAlgo ? UI.btn('Descargar mi progreso actual primero', {
        variant: 'ghost', onClick: function () { exportBackup(); }
      }) : null,
      UI.btn('Cancelar', { variant: 'flat', onClick: UI.closeSheet })
    ]);
  }

  w.App = {
    boot: boot,
    restoreFromFile: restoreFromFile,
    onRoute: onRoute,
    showChrome: showChrome,
    renderChrome: function () { renderTopbar(); },
    exportBackup: exportBackup,
    copyBackup: copyBackup,
    backupSheet: backupSheet,
    BACKUP_EVERY_DAYS: BACKUP_EVERY_DAYS,
    canInstall: canInstall,
    promptInstall: promptInstall,
    isStandalone: isStandalone,
    isIOS: isIOS
  };

  // Fuera de boot(): boot() puede volver a ejecutarse tras un reinicio, y para
  // entonces el evento 'load' ya pasó y el registro no llegaría a ocurrir.
  registerSW();

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
