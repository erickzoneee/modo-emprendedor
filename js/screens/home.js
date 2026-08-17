/* ==========================================================================
   HOME — mapa de la ruta del emprendedor
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;
  var WAVE = [0, 42, 66, 42, 0, -42, -66, -42];

  function render() {
    var root = el('div', { class: 'screen home' });
    var ps = w.Engine.pathState();

    // Encabezado de la pantalla para lectores de pantalla: visualmente el
    // título lo da el mapa, pero la jerarquía tiene que existir igual.
    root.appendChild(el('h1', { class: 'sr-only', text: 'Tu ruta de emprendimiento' }));

    /* El orden de estas tres tarjetas depende del negocio: quien todavía está
       definiendo su idea necesita el perfil delante; quien ya vende necesita
       la tarea del día. Lo decide js/core/persona.js, y si no hay nada que
       decidir devuelve la lista tal cual. Se reordena, nunca se filtra. */
    var MODULOS = [
      { id: 'venture', build: ventureStrip },
      { id: 'daily',   build: dailyCard },
      { id: 'weekly',  build: weeklyStrip }
    ];
    var orden = w.Persona ? w.Persona.ordenPanel(MODULOS) : MODULOS;
    orden.forEach(function (m) { root.appendChild(m.build()); });

    var currentLevel = -1;
    var container = el('div', { class: 'col', style: { gap: '0' } });

    ps.forEach(function (item, i) {
      if (item.node.level !== currentLevel) {
        currentLevel = item.node.level;
        container.appendChild(unitHeader(currentLevel));
      }
      container.appendChild(nodeRow(item, i));
      if (i < ps.length - 1 && ps[i + 1].node.level === currentLevel) {
        container.appendChild(connector(i));
      }
    });

    root.appendChild(container);
    root.appendChild(finale(ps));
    return root;
  }

  /* ------------------------- Encabezado del negocio -------------------------
     La ruta no es un temario: es la ruta de SU negocio. Esta tira lo recuerda
     y da acceso directo al perfil del emprendimiento.
     ------------------------------------------------------------------------ */

  function ventureStrip() {
    var t = w.Venture.terms();
    var comp = w.Venture.completeness();
    var enfoque = w.Personalize.focus();

    return el('button', {
      class: 'card card--tight', type: 'button',
      style: { display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', width: '100%' },
      onclick: function () { w.Sound.tap(); UI.Router.go('venture'); }
    }, [
      el('span', { style: { fontSize: '22px', flex: 'none' }, text: comp.esenciales.length ? '🧭' : '🚀' }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'tiny', style: { display: 'block' },
          text: t.negocio + ' · ' + t.etapaCorta }),
        el('span', { class: 'small', style: { display: 'block', fontWeight: '800', lineHeight: '1.35' },
          text: enfoque || 'Registra tu idea para personalizar la ruta' })
      ]),
      el('span', { style: { flex: 'none', fontSize: '18px' }, text: '›' })
    ]);
  }

  /* ------------------------- Misión del día ------------------------- */

  function dailyCard() {
    var dm = w.Engine.dailyMission();
    var s = w.Store.state;
    var pct = Math.min(100, (s.xpToday / s.dailyGoal) * 100);
    var doneToday = s.xpToday >= s.dailyGoal;

    var card = el('button', { class: 'daily-card', type: 'button', onclick: function () {
      w.Sound.tap();
      if (dm) openNode(dm.id);
    } }, [
      el('span', { class: 'daily-card__ico' + (doneToday ? '' : ' flame'), text: doneToday ? '✅' : (dm ? dm.icon : '🎉') }),
      // Columna propia: si estos tres textos se dejan en flujo en línea,
      // sus cajas de línea se solapan y el rótulo se encima con el título.
      el('span', { class: 'grow daily-card__body' }, [
        el('span', { class: 'daily-card__k',
          text: doneToday ? 'Meta diaria cumplida' : 'Misión del día' }),
        el('span', { class: 'daily-card__t', text: dm ? dm.title : 'Ruta completada' }),
        // El subtítulo describe lo que va a hacer con SU negocio, no el temario.
        el('span', { class: 'daily-card__s',
          text: dm ? w.Personalize.dailyLine(dm, dm.sub) : 'Sigue tu plan de 90 días' })
      ]),
      el('span', { style: { fontSize: '22px' }, text: '›' })
    ]);

    var meta = el('div', { class: 'row', style: { gap: '10px', marginTop: '10px' } }, [
      el('span', { class: 'tiny nowrap', text: s.xpToday + '/' + s.dailyGoal + ' XP' }),
      UI.pbar(pct, 'gold', true)
    ]);

    return el('div', { class: 'col', style: { gap: '0' } }, [card, meta]);
  }

  /* ------------------------- Retos semanales ------------------------- */

  function weeklyStrip() {
    var list = w.Engine.weeklyList();
    var strip = el('div', { class: 'hscroll', style: { marginTop: '4px' } });
    list.forEach(function (item) {
      var done = item.complete && !item.claimed;
      var chip = el('button', {
        class: 'tile', style: { width: '190px', padding: '12px' },
        type: 'button',
        onclick: function () {
          w.Sound.tap();
          if (done) {
            if (w.Engine.claimWeekly(item.ch.id)) {
              w.FX.stars(chip, 22);
              UI.toast('+' + item.ch.xp + ' XP · +' + item.ch.coins + ' monedas', 'gold', '🎁');
              UI.Router.refresh();
            }
          } else {
            UI.toast(item.claimed ? 'Ya reclamado' : 'Progreso: ' + item.progress + '/' + item.ch.goal, 'blue', item.ch.icon);
          }
        }
      }, [
        el('div', { class: 'row', style: { gap: '8px' } }, [
          el('span', { style: { fontSize: '20px' }, text: item.claimed ? '✅' : item.ch.icon }),
          el('span', { class: 'small', style: { fontWeight: '900', lineHeight: '1.15' },
            text: w.Personalize.weeklyTitle(item.ch) })
        ]),
        el('div', { class: 'row', style: { gap: '8px', marginTop: '10px' } }, [
          UI.pbar(item.pct, done ? 'gold' : 'blue', true),
          el('span', { class: 'tiny nowrap', text: item.progress + '/' + item.ch.goal })
        ]),
        done ? el('div', { class: 'chip chip--gold', style: { marginTop: '8px' }, text: '🎁 Reclamar' }) : null
      ]);
      if (done) chip.classList.add('glow-pulse');
      strip.appendChild(chip);
    });
    return el('div', { class: 'col', style: { gap: '6px' } }, [
      el('h2', { class: 'tiny', style: { marginTop: '8px' }, text: 'Retos de la semana' }),
      strip
    ]);
  }

  /* ------------------------- Encabezado de nivel ------------------------- */

  function unitHeader(levelN) {
    var lv = w.Engine.levelInfo(levelN);
    var prog = w.Engine.levelProgress(levelN);
    return el('div', { class: 'unit-head', style: { '--unit-c': lv.color } }, [
      el('div', { class: 'unit-head__meta' }, [
        el('div', { class: 'unit-head__k', text: 'Nivel ' + lv.n + ' · ' + prog.done + '/' + prog.total }),
        el('h2', { class: 'unit-head__t', text: lv.icon + '  ' + lv.title })
      ]),
      el('button', {
        class: 'unit-head__btn', type: 'button', 'aria-label': 'Ver detalles del nivel',
        text: 'ⓘ',
        onclick: function () { w.Sound.tap(); levelSheet(lv, prog); }
      })
    ]);
  }

  function levelSheet(lv, prog) {
    UI.sheet([
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('div', { style: { fontSize: '34px' }, text: lv.icon }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'tiny', text: 'Nivel ' + lv.n }),
          el('h2', { class: 'h3', text: lv.title })
        ])
      ]),
      el('p', { class: 'p', text: lv.outcome }),
      el('div', { class: 'row', style: { gap: '10px' } }, [
        UI.pbar(prog.pct, 'brand'),
        el('span', { class: 'small nowrap', text: prog.done + '/' + prog.total })
      ]),
      UI.btn('Entendido', { variant: 'ghost', onClick: UI.closeSheet })
    ]);
  }

  /* ------------------------- Nodos ------------------------- */

  function connector(i) {
    var dx = WAVE[i % WAVE.length];
    var dx2 = WAVE[(i + 1) % WAVE.length];
    return el('div', { class: 'path-dots', style: { '--dx': ((dx + dx2) / 2) + 'px' } }, [
      el('i'), el('i')
    ]);
  }

  function nodeRow(item, i) {
    var n = item.node;
    var lv = w.Engine.levelInfo(n.level);
    var isBoss = n.kind === 'boss';
    var st = item.state;

    var cls = 'node';
    if (isBoss) cls += ' is-boss';
    if (st === 'done') cls += ' is-done';
    else if (st === 'locked') cls += ' is-locked';
    else if (st === 'active') cls += ' is-active';

    var colorVars = {};
    if (st === 'done') { colorVars['--node-c'] = '#FFC800'; colorVars['--node-sh'] = '#D9A400'; }
    else if (st !== 'locked') { colorVars['--node-c'] = lv.color; colorVars['--node-sh'] = lv.dark; }

    var icon = st === 'locked' ? '🔒' : (st === 'done' ? (isBoss ? '👑' : '✓') : n.data.icon);

    var btn = el('button', {
      class: cls, type: 'button', style: colorVars,
      'aria-label': n.data.title,
      onclick: function () {
        if (st === 'locked') {
          w.Sound.wrong();
          w.FX.shake(btn);
          UI.toast('Completa la misión anterior para desbloquear', 'red', '🔒');
          return;
        }
        w.Sound.tap();
        w.Sound.buzz(12);
        openNode(n.id);
      }
    }, [el('span', { text: icon })]);

    if (st === 'active') btn.appendChild(el('span', { class: 'node__halo' }));
    if (st === 'done' && !isBoss) btn.appendChild(el('span', { class: 'node-crown', text: '⭐' }));

    var wrap = el('div', {
      class: 'path-node-wrap',
      style: { '--dx': WAVE[i % WAVE.length] + 'px', animationDelay: Math.min(i * 0.02, 0.5) + 's' }
    }, [
      st === 'active' ? el('div', { class: 'start-bubble', text: isBoss ? 'Reto real' : 'Empezar' }) : null,
      btn,
      el('div', { class: 'node__label', text: st === 'locked' ? '' : n.data.title })
    ]);

    // La burbuja necesita espacio propio arriba o pisa la etiqueta del nodo anterior.
    if (st === 'active') wrap.classList.add('has-bubble');

    if (item.optional && st !== 'done') {
      wrap.appendChild(el('div', { class: 'node-optional', text: 'opcional' }));
    }
    return wrap;
  }

  function finale(ps) {
    var allDone = ps.every(function (x) { return x.state === 'done'; });
    return el('div', { class: 'card', style: { marginTop: '18px', textAlign: 'center' } }, [
      el('div', { style: { fontSize: '34px' }, text: allDone ? '🏆' : '🏁' }),
      el('h2', { class: 'h4', style: { marginTop: '6px' }, text: allDone ? '¡Ruta completada!' : 'Meta final' }),
      el('p', { class: 'small', style: { marginTop: '6px' },
        text: allDone
          ? 'Tienes idea validada, oferta, precios, identidad, estrategia y primeros clientes. Revisa tu expediente.'
          : 'Al terminar tendrás: idea validada, oferta, precios, identidad básica, estrategia de ventas y tus primeros clientes.' }),
      UI.btn(allDone ? 'Ver mi expediente' : 'Ver mi progreso', {
        variant: allDone ? 'gold' : 'ghost', size: 'sm',
        onClick: function () { UI.Router.go('business'); }
      })
    ]);
  }

  /* ------------------------- Abrir nodo ------------------------- */

  function openNode(id) {
    var lesson = w.Engine.lessonById(id);
    var boss = w.Engine.bossById(id);
    if (lesson) return lessonSheet(lesson);
    if (boss) return bossSheet(boss);
  }

  function lessonSheet(lesson) {
    var lv = w.Engine.levelInfo(lesson.level);
    var done = w.Engine.isDone(lesson.id);
    var rec = w.Store.state.lessons[lesson.id];
    var hearts = w.Store.state.hearts;

    UI.sheet([
      el('div', { class: 'row', style: { gap: '14px' } }, [
        el('div', {
          class: 'node', style: { '--node-c': lv.color, '--node-sh': lv.dark, width: '62px', height: '58px', fontSize: '25px' },
          text: lesson.icon
        }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'tiny', style: { color: lv.color }, text: lv.title }),
          el('h2', { class: 'h3', text: lesson.title })
        ])
      ]),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        UI.chip(lesson.min + ' min', 'blue', '⏱️'),
        UI.chip('+' + lesson.xp + ' XP', 'gold', '⚡'),
        UI.chip(lesson.steps.length + ' ejercicios', null, '🧩'),
        lesson.mission ? UI.chip('Misión real', 'purple', '🎯') : null,
        done ? UI.chip('Completada · ' + (rec ? rec.score : 0) + '%', 'green', '✅') : null
      ]),
      el('p', { class: 'p', text: lesson.concept.title }),
      // Qué va a hacer con SU negocio al terminarla: la lección no es teoría suelta.
      (function () {
        var ej = w.Personalize.example(lesson);
        // El color va por clase y no en línea: es el bloque que habla del
        // negocio del usuario, así que es de los que toma su color.
        return ej ? el('div', { class: 'card card--tight neg-aplica', style: { textAlign: 'left' } }, [
          el('div', { class: 'tiny neg-aplica__k', text: 'Aplicado a tu idea' }),
          el('div', { class: 'small', style: { marginTop: '6px' }, text: ej.text })
        ]) : null;
      })(),
      hearts <= 0 && !done
        ? el('div', { class: 'card card--tight', style: { background: 'var(--red-soft)', borderColor: 'var(--red)' } }, [
            el('div', { class: 'row', style: { gap: '10px' } }, [
              el('span', { style: { fontSize: '24px' }, text: '💔' }),
              el('div', [
                el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--red-dark)' }, text: 'Te quedaste sin vidas' }),
                el('div', { class: 'tiny', text: 'Siguiente vida en ' + (w.Engine.heartsETA() || '—') })
              ])
            ])
          ])
        : null,
      hearts <= 0 && !done
        ? UI.btn('Recargar vidas (60 🪙)', {
            variant: 'gold',
            onClick: function () {
              if (w.Store.state.coins < 60) { UI.toast('No tienes suficientes monedas', 'red', '🪙'); return; }
              w.Engine.addCoins(-60); w.Engine.refillHearts();
              UI.closeSheet(); UI.toast('¡Vidas recargadas!', 'green', '❤️');
              w.App.renderChrome();
            }
          })
        : UI.btn(done ? 'Repasar lección' : 'Empezar lección', {
            variant: done ? 'ghost' : 'brand', size: 'lg', shiny: !done,
            onClick: function () { UI.closeSheet(); UI.Router.go('lesson', { id: lesson.id }); }
          })
    ]);
  }

  function bossSheet(boss) {
    var lv = w.Engine.levelInfo(boss.level);
    var done = w.Engine.isDone(boss.id);
    UI.sheet([
      el('div', { class: 'mission-hero' }, [
        el('div', { class: 'mission-hero__tag', text: 'Reto real · Nivel ' + boss.level }),
        el('div', { class: 'row', style: { gap: '12px' } }, [
          el('span', { style: { fontSize: '38px' }, text: boss.icon }),
          el('div', [
            el('h3', { text: boss.title }),
            el('p', { text: boss.subtitle })
          ])
        ])
      ]),
      el('p', { class: 'p', text: w.Personalize.mission(boss).brief || boss.brief }),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        UI.chip('+' + boss.xp + ' XP', 'gold', '⚡'),
        UI.chip('+' + boss.coins + ' 🪙', 'gold'),
        UI.chip('Fuera de la app', 'purple', '🌎'),
        done ? UI.chip('Superado', 'green', '✅') : null
      ]),
      el('div', { class: 'card card--tight', style: { background: 'var(--gold-soft)', borderColor: 'var(--gold)' } }, [
        el('div', { class: 'small', style: { fontWeight: '800', color: 'var(--gold-dark)' },
          text: '⚠️ Este reto se hace en el mundo real. Vuelve cuando lo hayas hecho y reporta el resultado: el mentor lo revisará.' })
      ]),
      UI.btn(done ? 'Ver mi reporte' : 'Aceptar el reto', {
        variant: 'purple', size: 'lg', shiny: !done,
        onClick: function () { UI.closeSheet(); UI.Router.go('mission', { id: boss.id, boss: true }); }
      }),
      el('div', { class: 'tiny t-center', text: lv.outcome })
    ]);
  }

  UI.Router.register('home', render);
  w.HomeScreen = { openNode: openNode };
})(window, document);
