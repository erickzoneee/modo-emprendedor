/* ==========================================================================
   TIENDA — se abre como panel inferior desde la barra superior
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  function open() {
    var s = w.Store.state;
    var list = el('div', { class: 'col', style: { gap: '10px' } });

    C.SHOP.forEach(function (item) {
      var afford = s.coins >= item.price;
      var extra = '';
      if (item.id === 'hearts' && s.hearts >= 5) extra = 'Ya tienes todas las vidas';
      if (item.id === 'freeze' && s.freezes >= (item.max || 3)) extra = 'Máximo alcanzado (' + s.freezes + ')';
      if (item.id === 'double' && s.boostUntil && Date.now() < s.boostUntil) extra = 'Activo ahora';
      var blocked = !!extra || !afford;

      var btn = el('button', {
        class: 'shop-item', type: 'button', disabled: blocked ? true : null,
        onclick: function () { buy(item, btn); }
      }, [
        el('span', { class: 'shop-item__ico', text: item.icon }),
        el('span', { class: 'grow' }, [
          el('span', { class: 'small', style: { fontWeight: '900', display: 'block' }, text: item.name }),
          el('span', { class: 'tiny', style: { display: 'block' }, text: extra || item.desc })
        ]),
        el('span', { class: 'shop-item__price' }, [
          el('span', { text: '🪙' }), el('span', { text: String(item.price) })
        ])
      ]);
      list.appendChild(btn);
    });

    UI.sheet([
      el('div', { class: 'row between' }, [
        el('h2', { class: 'h3', text: '🛒 Tienda' }),
        el('div', { class: 'chip chip--gold', text: '🪙 ' + UI.num(s.coins) })
      ]),
      el('div', { class: 'small', text: 'Ganas monedas completando lecciones, misiones y retos semanales.' }),
      list
    ]);
  }

  function buy(item, node) {
    var s = w.Store.state;
    if (s.coins < item.price) { UI.toast('No tienes suficientes monedas', 'red', '🪙'); return; }

    // Validaciones antes de cobrar: nunca se cobra por algo que no se puede entregar.
    if (item.id === 'audit' && w.MentorScreen.seccionesLlenas() < 1) {
      UI.toast('Primero llena alguna sección de Mi Negocio', 'red', '📂', 3200);
      return;
    }

    w.Engine.addCoins(-item.price);

    switch (item.id) {
      case 'hearts':
        w.Engine.refillHearts();
        UI.toast('Vidas al máximo', 'green', '❤️');
        break;
      case 'freeze':
        w.Store.set(function (st) { st.freezes = (st.freezes || 0) + 1; }, 'shop');
        UI.toast('Congelador añadido: ' + w.Store.state.freezes, 'blue', '🧊');
        break;
      case 'double':
        w.Store.set(function (st) { st.boostUntil = Date.now() + 30 * 60 * 1000; }, 'shop');
        UI.toast('XP doble activo por 30 minutos', 'gold', '⚡');
        break;
      case 'hint':
        w.Store.set(function (st) { st.hints = (st.hints || 0) + 3; }, 'shop');
        UI.toast('3 pistas añadidas', 'purple', '💡');
        break;
      case 'audit':
        UI.closeSheet();
        setTimeout(function () { w.MentorScreen.audit(); }, 340);
        w.App.renderChrome();
        return;
    }

    w.Sound.cash();
    w.FX.stars(node, 16);
    w.App.renderChrome();
    UI.closeSheet();
    setTimeout(open, 320);
  }

  w.Shop = { open: open };
})(window, document);
