/* ==========================================================================
   LIGA — clasificación semanal entre emprendedores
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  function render() {
    var tier = w.Engine.leagueTier();
    var league = C.LEAGUES[tier];
    var board = w.Engine.leagueBoard();
    var myPos = board.findIndex(function (r) { return r.me; }) + 1;

    var root = el('div', { class: 'screen' });

    /* Cinturón de ligas */
    var belt = el('div', { class: 'league-belt' });
    C.LEAGUES.forEach(function (l, i) {
      belt.appendChild(el('button', {
        class: 'league-pin' + (i <= tier ? ' is-on' : ''), type: 'button',
        title: l.name, text: l.icon,
        onclick: function () {
          w.Sound.tap();
          UI.toast(l.name + ' · desde ' + UI.num(l.min) + ' XP', i <= tier ? 'gold' : 'blue', l.icon);
        }
      }));
    });

    root.appendChild(el('div', { class: 'col', style: { alignItems: 'center', gap: '8px' } }, [
      el('div', { style: { fontSize: '56px' }, text: league.icon }),
      el('div', { class: 'h2', text: 'Liga ' + league.name }),
      el('div', { class: 'small t-center',
        text: myPos <= 3 ? '¡Estás en el podio! Los 3 primeros suben de liga el domingo.'
                         : 'Puesto #' + myPos + ' · los 3 primeros suben de liga' }),
      belt
    ]));

    /* Tabla */
    root.appendChild(el('div', { class: 'sep', text: 'Esta semana' }));
    var list = el('div', { class: 'col stagger', style: { gap: '8px' } });
    board.forEach(function (row, i) {
      var pos = i + 1;
      var cls = 'lb-row' + (row.me ? ' is-me' : '');
      list.appendChild(el('div', { class: cls }, [
        el('div', { class: 'lb-row__pos' + (pos <= 3 ? ' p' + pos : ''), text: String(pos) }),
        el('div', { class: 'lb-row__name', text: row.me ? (row.name + ' (tú)') : row.name }),
        el('div', { class: 'lb-row__xp', text: UI.num(row.xp) + ' XP' })
      ]));
    });
    root.appendChild(list);

    root.appendChild(el('div', { class: 'card card--tight', style: { marginTop: '10px' } }, [
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(myPos <= 3 ? 'party' : 'think') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: myPos <= 3
            ? 'Vas en el podio. Una lección más al día lo asegura.'
            : 'Te faltan ' + UI.num(Math.max(0, board[2].xp - board[myPos - 1].xp) + 1) + ' XP para entrar al podio. Eso son unas ' +
              Math.ceil(Math.max(0, board[2].xp - board[myPos - 1].xp) / 40) + ' lecciones.' })
        ])
      ])
    ]));

    /* Retos semanales */
    root.appendChild(el('div', { class: 'sep', text: 'Retos de la semana' }));
    var weekly = w.Engine.weeklyList();
    var wl = el('div', { class: 'col', style: { gap: '10px' } });
    weekly.forEach(function (item) {
      var claimable = item.complete && !item.claimed;
      var card = el('button', { class: 'card card--tight', type: 'button',
        style: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', width: '100%' },
        onclick: function () {
          w.Sound.tap();
          if (claimable && w.Engine.claimWeekly(item.ch.id)) {
            w.FX.stars(card, 24);
            UI.toast('+' + item.ch.xp + ' XP · +' + item.ch.coins + ' monedas', 'gold', '🎁');
            UI.Router.refresh();
          }
        } }, [
        el('div', { class: 'row', style: { gap: '10px' } }, [
          el('span', { style: { fontSize: '22px' }, text: item.claimed ? '✅' : item.ch.icon }),
          el('div', { class: 'grow' }, [
            el('div', { class: 'small', style: { fontWeight: '900' }, text: item.ch.title }),
            el('div', { class: 'tiny', text: '+' + item.ch.xp + ' XP · +' + item.ch.coins + ' 🪙' })
          ]),
          claimable ? UI.chip('Reclamar', 'gold', '🎁') : el('span', { class: 'small', text: item.progress + '/' + item.ch.goal })
        ]),
        UI.pbar(item.pct, item.claimed ? 'green' : 'gold', true)
      ]);
      if (claimable) card.classList.add('glow-pulse');
      wl.appendChild(card);
    });
    root.appendChild(wl);

    root.appendChild(el('div', { class: 'tiny t-center', style: { marginTop: '12px' },
      text: 'Los demás participantes son simulados: la liga existe para darte ritmo, no para compararte con nadie real.' }));

    return root;
  }

  UI.Router.register('league', render);
})(window, document);
