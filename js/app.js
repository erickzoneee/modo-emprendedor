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

  /* ------------------------- Arranque ------------------------- */

  function boot() {
    w.FX.init();
    var had = w.Store.init();
    var s = w.Store.state;

    d.documentElement.setAttribute('data-theme', s.settings.theme || 'light');

    if (s.__freezeUsed) {
      w.Store.set(function (st) { delete st.__freezeUsed; }, 'freeze');
      setTimeout(function () {
        UI.toast('Se usó un congelador: tu racha sigue viva', 'blue', '🧊', 3600);
      }, 900);
    }

    UI.Router.stack = [];
    UI.Router.current = null;

    if (!had || !s.onboarded) {
      showChrome(false);
      UI.Router.go('onboarding', {}, 'none');
    } else {
      showChrome(true);
      UI.Router.go('home', {}, 'none');
      greet();
      // Después del saludo, para no encimar dos avisos.
      setTimeout(maybeRemindBackup, 5200);
    }

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

  w.App = {
    boot: boot,
    onRoute: onRoute,
    showChrome: showChrome,
    renderChrome: function () { renderTopbar(); },
    exportBackup: exportBackup,
    copyBackup: copyBackup,
    backupSheet: backupSheet,
    BACKUP_EVERY_DAYS: BACKUP_EVERY_DAYS
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
