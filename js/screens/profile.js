/* ==========================================================================
   PERFIL — estadísticas, insignias, ajustes
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  function render() {
    var s = w.Store.state;
    var rank = C.rankFor(s.xp);
    var prog = w.Engine.overallProgress();

    var root = el('div', { class: 'screen' });

    /* --------- Cabecera --------- */
    root.appendChild(el('div', { class: 'profile-hero' }, [
      el('div', { class: 'avatar' }, [
        el('div', { class: 'mascot mascot--lg', style: { '--m-size': '86px' }, html: w.Mascot.svg('happy') }),
        el('div', { class: 'avatar__lvl', text: 'Nv ' + rank.level })
      ]),
      el('div', { class: 'h2', text: s.profile.name || 'Emprendedor' }),
      el('div', { class: 'row', style: { gap: '8px' } }, [
        UI.chip(rank.name, 'gold', rank.icon),
        s.profile.businessName ? UI.chip(s.profile.businessName, 'teal', '🏪') : null
      ]),
      el('div', { class: 'col', style: { width: '100%', gap: '6px', marginTop: '8px' } }, [
        UI.pbar(rank.progress, 'gold'),
        el('div', { class: 'tiny t-center',
          text: rank.next ? (UI.num(rank.next.min - s.xp) + ' XP para ' + rank.next.name)
                          : 'Rango máximo alcanzado' })
      ])
    ]));

    /* --------- Estadísticas --------- */
    root.appendChild(el('div', { class: 'grid-2' }, [
      UI.metric('Racha actual', s.streak + ' días'),
      UI.metric('Mejor racha', s.bestStreak + ' días'),
      UI.metric('XP total', UI.num(s.xp)),
      UI.metric('Monedas', UI.num(s.coins)),
      UI.metric('Lecciones', s.stats.lessons + '/' + w.LESSONS.length),
      UI.metric('Misiones reales', String(s.stats.missions)),
      UI.metric('Progreso ruta', Math.round(prog.pct) + '%'),
      UI.metric('Tiempo invertido', Math.round(s.stats.minutes) + ' min')
    ]));

    /* --------- Calendario de racha --------- */
    root.appendChild(el('div', { class: 'sep', text: 'Últimos 28 días' }));
    root.appendChild(streakGrid(s));

    /* --------- Insignias --------- */
    root.appendChild(el('div', { class: 'row between', style: { marginTop: '8px' } }, [
      el('div', { class: 'sep grow', text: 'Insignias (' + s.badges.length + '/' + C.BADGES.length + ')' })
    ]));
    var grid = el('div', { class: 'grid-4', style: { gap: '14px 8px' } });
    C.BADGES.forEach(function (b) {
      var owned = s.badges.indexOf(b.id) >= 0;
      var node = el('button', { class: 'badge' + (owned ? '' : ' is-locked'), type: 'button', onclick: function () {
        w.Sound.tap();
        UI.sheet([
          el('div', { class: 'badge__disc', style: { margin: '0 auto', width: '92px', height: '92px', fontSize: '42px' },
            text: owned ? b.icon : '🔒' }),
          el('div', { class: 'h3 t-center', text: b.name }),
          el('p', { class: 'p t-center', text: b.desc }),
          UI.chip(owned ? 'Desbloqueada' : 'Bloqueada', owned ? 'green' : null, owned ? '✅' : '🔒'),
          UI.btn('Cerrar', { variant: 'ghost', onClick: UI.closeSheet })
        ]);
      } }, [
        el('div', { class: 'badge__disc', text: owned ? b.icon : '🔒' }),
        el('div', { class: 'badge__name', text: b.name })
      ]);
      grid.appendChild(node);
    });
    root.appendChild(grid);

    /* --------- Progreso por nivel --------- */
    root.appendChild(el('div', { class: 'sep', text: 'Niveles' }));
    var levels = el('div', { class: 'col', style: { gap: '10px' } });
    C.LEVELS.forEach(function (lv) {
      var p = w.Engine.levelProgress(lv.n);
      levels.appendChild(el('div', { class: 'card card--tight' }, [
        el('div', { class: 'row', style: { gap: '10px' } }, [
          el('span', { style: { fontSize: '22px' }, text: lv.icon }),
          el('div', { class: 'grow' }, [
            el('div', { class: 'small', style: { fontWeight: '900' }, text: lv.title }),
            el('div', { class: 'tiny', text: lv.outcome })
          ]),
          el('span', { class: 'small', style: { fontWeight: '900', color: lv.color }, text: p.done + '/' + p.total })
        ]),
        el('div', { style: { marginTop: '8px' } }, [UI.pbar(p.pct, null)])
      ]));
    });
    root.appendChild(levels);

    /* --------- Ajustes --------- */
    root.appendChild(el('div', { class: 'sep', text: 'Ajustes' }));
    root.appendChild(settings(s));

    return root;
  }

  function streakGrid(s) {
    var wrap = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '5px' } });
    var today = new Date();
    for (var i = 27; i >= 0; i--) {
      var dt = new Date(today.getTime() - i * 86400000);
      var key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      var active = s.stats.days.indexOf(key) >= 0;
      wrap.appendChild(el('div', {
        title: key,
        style: {
          aspectRatio: '1', borderRadius: '6px',
          background: active ? 'var(--brand)' : 'var(--line)',
          opacity: active ? '1' : '.6'
        }
      }));
    }
    return wrap;
  }

  function toggle(label, hint, value, onChange) {
    var knob = el('div', {
      style: {
        width: '52px', height: '30px', borderRadius: '99px', flex: 'none',
        background: value ? 'var(--green)' : 'var(--line)',
        position: 'relative', transition: 'background .25s'
      }
    }, [
      el('div', {
        style: {
          position: 'absolute', top: '3px', left: value ? '25px' : '3px',
          width: '24px', height: '24px', borderRadius: '50%', background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,.2)', transition: 'left .25s var(--spring)'
        }
      })
    ]);
    var row = el('button', { class: 'card card--tight', type: 'button',
      style: { display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', width: '100%' },
      onclick: function () {
        value = !value;
        knob.style.background = value ? 'var(--green)' : 'var(--line)';
        knob.firstChild.style.left = value ? '25px' : '3px';
        w.Sound.tap();
        onChange(value);
      } }, [
      el('div', { class: 'grow' }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: label }),
        hint ? el('div', { class: 'tiny', text: hint }) : null
      ]),
      knob
    ]);
    return row;
  }

  function settings(s) {
    var col = el('div', { class: 'col', style: { gap: '10px' } });

    col.appendChild(toggle('Sonido', 'Efectos al responder y celebrar', s.settings.sound, function (v) {
      w.Store.set(function (st) { st.settings.sound = v; }, 'settings');
      if (v) w.Sound.correct();
    }));

    col.appendChild(toggle('Vibración', 'Respuesta háptica en móvil', s.settings.haptics, function (v) {
      w.Store.set(function (st) { st.settings.haptics = v; }, 'settings');
      if (v) w.Sound.buzz(30);
    }));

    col.appendChild(toggle('Modo oscuro', 'Para estudiar de noche', s.settings.theme === 'dark', function (v) {
      w.Store.set(function (st) { st.settings.theme = v ? 'dark' : 'light'; }, 'settings');
      d.documentElement.setAttribute('data-theme', v ? 'dark' : 'light');
    }));

    // Meta diaria
    col.appendChild(el('button', { class: 'card card--tight', type: 'button',
      style: { display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', width: '100%' },
      onclick: function () { w.Sound.tap(); goalSheet(); } }, [
      el('div', { class: 'grow' }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: 'Meta diaria' }),
        el('div', { class: 'tiny', text: s.dailyGoal + ' XP al día' })
      ]),
      el('span', { text: '›' })
    ]));

    // Datos
    col.appendChild(el('div', { class: 'grid-2', style: { gap: '10px', marginTop: '4px' } }, [
      UI.btn('Exportar progreso', { variant: 'ghost', size: 'sm', onClick: function () {
        UI.download('modo-emprendedor-respaldo.json', w.Store.exportJSON());
        UI.toast('Respaldo descargado', 'green', '⬇️');
      } }),
      UI.btn('Importar', { variant: 'ghost', size: 'sm', onClick: importData })
    ]));

    col.appendChild(UI.btn('Reiniciar todo', { variant: 'flat', onClick: function () {
      UI.confirm({
        title: '¿Borrar todo tu progreso?',
        text: 'Se perderán tu racha, tus insignias y tu expediente de negocio. **No se puede deshacer.**',
        ok: 'Sí, borrar todo', danger: true, mood: 'sad'
      }).then(function (yes) {
        if (!yes) return;
        w.Store.reset();
        w.App.boot();
      });
    } }));

    col.appendChild(el('div', { class: 'tiny t-center', style: { marginTop: '10px' },
      text: 'Modo Emprendedor · Aprende. Construye. Vende.' }));
    col.appendChild(el('div', { class: 'tiny t-center', style: { opacity: '.7' },
      text: 'Tu progreso se guarda solo en este dispositivo.' }));

    return col;
  }

  function goalSheet() {
    var opts = [
      { xp: 20, label: 'Ligero', sub: '~10 min al día' },
      { xp: 40, label: 'Constante', sub: '~20 min al día' },
      { xp: 70, label: 'Intenso', sub: '~40 min al día' },
      { xp: 120, label: 'Extremo', sub: 'para semanas de empuje' }
    ];
    var list = el('div', { class: 'col', style: { gap: '10px' } });
    opts.forEach(function (o) {
      var sel = w.Store.state.dailyGoal === o.xp;
      list.appendChild(el('button', { class: 'opt' + (sel ? ' is-selected' : ''), type: 'button', onclick: function () {
        w.Store.set(function (s) { s.dailyGoal = o.xp; }, 'settings');
        w.Sound.select();
        UI.closeSheet();
        UI.toast('Meta diaria: ' + o.xp + ' XP', 'green', '🎯');
        UI.Router.refresh();
      } }, [
        el('span', { class: 'opt__key', text: String(o.xp) }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: o.label }),
          el('span', { class: 'opt__hint', text: o.sub })
        ])
      ]));
    });
    UI.sheet([el('div', { class: 'h3', text: 'Meta diaria' }), list]);
  }

  function importData() {
    var input = el('input', { type: 'file', accept: '.json', style: { display: 'none' } });
    input.addEventListener('change', function () {
      var f = input.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          w.Store.importJSON(fr.result);
          UI.toast('Progreso restaurado', 'green', '✅');
          w.App.boot();
        } catch (e) { UI.toast('Archivo inválido', 'red', '⚠️'); }
      };
      fr.readAsText(f);
    });
    d.body.appendChild(input);
    input.click();
    setTimeout(function () { input.remove(); }, 60000);
  }

  UI.Router.register('profile', render);
})(window, document);
