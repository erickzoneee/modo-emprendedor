/* ==========================================================================
   SIMULADOR — administra una empresa virtual durante 12 semanas
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, CFG = w.SIM.CONFIG;

  /* ------------------------- Estado ------------------------- */

  function fresh() {
    return {
      week: 1,
      cash: CFG.startCash,
      startCash: CFG.startCash,
      price: CFG.startPrice,
      unitCost: CFG.unitCost,
      inventory: CFG.startInventory,
      reputation: CFG.startReputation,
      employees: 0,
      debt: 0,
      equity: 100,        // % del negocio que sigue siendo tuyo
      demandMod: 1,
      cumProfit: 0,
      cumRevenue: 0,
      totalSales: 0,
      lostSales: 0,
      pending: [],
      usedEvents: [],
      history: [],
      lastProfit: 0,
      finished: false,
      log: []
    };
  }

  function state() {
    if (!w.Store.state.sim) w.Store.set(function (s) { s.sim = fresh(); }, 'sim');
    return w.Store.state.sim;
  }

  function save(fn) { w.Store.set(function (s) { fn(s.sim); }, 'sim'); }

  /* ------------------------- Modelo ------------------------- */

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function capacity(s) { return 24 + s.employees * 20; }

  function demandFor(s, ad) {
    var priceFactor = clamp(Math.pow(CFG.refPrice / Math.max(25, s.price), 1.45), 0.12, 2.5);
    var repFactor = 0.45 + (s.reputation / 100) * 1.15;
    var adFactor = 1 + Math.sqrt(Math.max(0, ad) / 420) * 0.42;
    var growth = 1 + (s.week - 1) * 0.025;
    var raw = CFG.baseDemand * priceFactor * repFactor * adFactor * growth * (s.demandMod || 1);
    return Math.max(0, Math.round(raw));
  }

  function pickEvent(s) {
    var pool = w.SIM.EVENTS.filter(function (e) {
      return s.week >= e.week[0] && s.week <= e.week[1] && s.usedEvents.indexOf(e.id) < 0;
    });
    if (!pool.length) return null;
    var seed = (s.week * 7919 + s.cash) | 0;
    var rnd = UI.mulberry(Math.abs(seed));
    return pool[Math.floor(rnd() * pool.length)];
  }

  /* ------------------------- Pantalla ------------------------- */

  var phase = 'plan';   // plan | event | result | end
  var plan = null;
  var pendingEvent = null;
  var chosenOption = null;

  function render() {
    var s = state();
    if (s.finished) return endScreen(s);

    if (!plan || plan.week !== s.week) {
      plan = { week: s.week, price: s.price, buy: 0, ad: 0 };
      phase = 'plan';
      pendingEvent = pickEvent(s);
      chosenOption = null;
    }

    var root = el('div', { class: 'screen' });
    root.appendChild(header(s));

    if (phase === 'plan') root.appendChild(planView(s));
    else if (phase === 'event') root.appendChild(eventView(s));
    else if (phase === 'result') root.appendChild(resultView(s));

    return root;
  }

  /* ------------------------- Encabezado ------------------------- */

  function header(s) {
    var box = el('div', { class: 'sim-head' }, [
      el('div', { class: 'sim-head__row' }, [
        el('div', [
          el('div', { class: 'sim-head__week', text: 'Semana ' + s.week + ' de ' + CFG.weeks }),
          el('div', { class: 'sim-head__cash', text: UI.money(s.cash) })
        ]),
        el('div', { style: { textAlign: 'right' } }, [
          el('div', { class: 'sim-head__week', text: 'Utilidad acumulada' }),
          el('div', { class: 'h3', style: { color: s.cumProfit >= 0 ? '#6BE08A' : '#FF8A8A' },
            text: UI.money(s.cumProfit) })
        ])
      ]),
      el('div', { class: 'sim-kpis' }, [
        kpi('Precio', UI.money(s.price)),
        kpi('Inventario', s.inventory + ' u'),
        kpi('Reputación', Math.round(s.reputation) + '%'),
        (s.equity != null && s.equity < 100)
          ? kpi('Tuyo', Math.round(s.equity) + '%')
          : kpi('Equipo', String(s.employees))
      ])
    ]);
    if (s.history.length > 1) box.appendChild(chart(s));
    return box;
  }

  function kpi(l, v) {
    return el('div', { class: 'sim-kpi' }, [
      el('div', { class: 'sim-kpi__l', text: l }),
      el('div', { class: 'sim-kpi__v', text: v })
    ]);
  }

  function chart(s) {
    var cv = el('canvas', { class: 'sim-chart', width: '600', height: '184' });
    setTimeout(function () { drawChart(cv, s.history); }, 40);
    return cv;
  }

  function drawChart(cv, hist) {
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height, pad = 16;
    ctx.clearRect(0, 0, W, H);
    if (hist.length < 2) return;
    var vals = hist.map(function (h) { return h.cash; });
    var profits = hist.map(function (h) { return h.profit; });
    var min = Math.min.apply(null, vals.concat([0]));
    var max = Math.max.apply(null, vals);
    var range = Math.max(1, max - min);

    // línea de efectivo
    ctx.beginPath();
    hist.forEach(function (h, i) {
      var x = pad + (i / (hist.length - 1)) * (W - pad * 2);
      var y = H - pad - ((h.cash - min) / range) * (H - pad * 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#6BE08A';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // relleno
    ctx.lineTo(W - pad, H - pad);
    ctx.lineTo(pad, H - pad);
    ctx.closePath();
    ctx.fillStyle = 'rgba(107,224,138,.16)';
    ctx.fill();

    // barras de utilidad
    var bw = Math.max(4, (W - pad * 2) / hist.length * 0.34);
    profits.forEach(function (p, i) {
      var x = pad + (i / Math.max(1, hist.length - 1)) * (W - pad * 2);
      var h = Math.min(H / 3, Math.abs(p) / 900 * (H / 3));
      ctx.fillStyle = p >= 0 ? 'rgba(255,200,0,.6)' : 'rgba(255,107,107,.7)';
      ctx.fillRect(x - bw / 2, H - pad - h, bw, h);
    });
  }

  /* ------------------------- Fase: planificar ------------------------- */

  function planView(s) {
    var wrap = el('div', { class: 'col stagger', style: { gap: '14px' } });
    var estimate = el('div', { class: 'card card--tight' });

    function refresh() {
      var dem = demandFor(Object.assign({}, s, { price: plan.price }), plan.ad);
      var cap = capacity(s);
      var inv = s.inventory + plan.buy;
      var possible = Math.min(dem, inv, cap);
      var revenue = possible * plan.price;
      var cogs = possible * s.unitCost;
      var fixed = CFG.fixedWeekly + s.employees * CFG.employeeWeekly;
      var profit = revenue - cogs - plan.ad - fixed;
      var cashOut = plan.buy * s.unitCost + plan.ad + fixed;

      UI.clear(estimate);
      estimate.appendChild(el('div', { class: 'tiny', text: 'Proyección de la semana' }));
      estimate.appendChild(el('div', { class: 'col', style: { gap: '4px', marginTop: '8px' } }, [
        kv('Demanda estimada', dem + ' u'),
        kv('Podrás vender', possible + ' u' + (dem > possible ? ' (te limita ' + (inv < cap ? 'el inventario' : 'tu capacidad') + ')' : '')),
        kv('Ingreso estimado', UI.money(revenue)),
        kv('Salida de efectivo hoy', UI.money(cashOut)),
        kv('Utilidad estimada', UI.money(profit))
      ]));
      if (s.cash - cashOut < 0) {
        estimate.appendChild(el('div', { class: 'chip chip--red', style: { marginTop: '8px' },
          text: '🚨 Te quedarías sin efectivo' }));
      }
    }

    wrap.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
      el('div', { class: 'speech' }, [
        el('div', { class: 'small', text: tipFor(s) })
      ])
    ]));

    wrap.appendChild(dial({
      label: 'Precio de venta', step: 10,
      get: function () { return plan.price; },
      set: function (v) { plan.price = clamp(v, 30, 600); },
      fmt: function () { return UI.money(plan.price); },
      hint: function () {
        return 'Costo unitario: ' + UI.money(s.unitCost) + ' · margen ' +
          Math.max(0, Math.round(((plan.price - s.unitCost) / plan.price) * 100)) + '%';
      },
      onChange: refresh
    }));

    wrap.appendChild(dial({
      label: 'Comprar material', step: 5,
      get: function () { return plan.buy; },
      set: function (v) { plan.buy = clamp(v, 0, 200); },
      fmt: function () { return plan.buy + ' u'; },
      hint: function () { return 'Cuesta ' + UI.money(plan.buy * s.unitCost) + ' en total'; },
      onChange: refresh
    }));

    wrap.appendChild(dial({
      label: 'Publicidad', step: 250,
      get: function () { return plan.ad; },
      set: function (v) { plan.ad = clamp(v, 0, 8000); },
      fmt: function () { return UI.money(plan.ad); },
      hint: function () { return 'Sube la demanda y baja tu efectivo'; },
      onChange: refresh
    }));

    wrap.appendChild(estimate);
    refresh();

    wrap.appendChild(UI.btn('Continuar la semana', {
      variant: 'brand', size: 'lg',
      onClick: function () {
        save(function (st) { st.price = plan.price; });
        phase = pendingEvent ? 'event' : 'result';
        if (!pendingEvent) resolve(s);
        UI.Router.refresh();
      }
    }));

    wrap.appendChild(UI.btn('Reiniciar simulador', {
      variant: 'flat',
      onClick: function () {
        UI.confirm({ title: '¿Reiniciar?', text: 'Perderás el avance del simulador.', danger: true, ok: 'Reiniciar' })
          .then(function (yes) {
            if (!yes) return;
            w.Store.set(function (st) { st.sim = fresh(); }, 'sim');
            plan = null; phase = 'plan';
            UI.Router.refresh();
          });
      }
    }));

    return wrap;
  }

  function kv(k, v) {
    return el('div', { class: 'kv' }, [
      el('span', { class: 'kv__k', text: k }),
      el('span', { class: 'kv__v', text: v })
    ]);
  }

  function dial(o) {
    var numEl = el('div', { class: 'dial__n' });
    var hintEl = el('div', { class: 'tiny', style: { textAlign: 'center' } });

    function paint() {
      numEl.textContent = o.fmt();
      hintEl.textContent = o.hint();
    }
    function bump(delta) {
      w.Sound.tap();
      w.Sound.buzz(6);
      o.set(o.get() + delta);
      paint();
      if (o.onChange) o.onChange();
    }

    var box = el('div', { class: 'col', style: { gap: '6px' } }, [
      el('div', { class: 'dial' }, [
        el('button', { class: 'dial__btn', type: 'button', text: '−',
          onclick: function () { bump(-o.step); } }),
        el('div', { class: 'dial__val' }, [
          el('div', { class: 'dial__l', text: o.label }),
          numEl
        ]),
        el('button', { class: 'dial__btn', type: 'button', text: '+',
          onclick: function () { bump(o.step); } })
      ]),
      hintEl
    ]);
    paint();
    return box;
  }

  function tipFor(s) {
    for (var i = 0; i < w.SIM.TIPS.length; i++) {
      if (w.SIM.TIPS[i].when(s)) return w.SIM.TIPS[i].msg;
    }
    if (s.week === 1) return 'Bienvenido. Decide precio, cuánto material compras y cuánto inviertes en publicidad. Cada decisión afecta ventas, reputación y efectivo.';
    return 'Vas bien. Recuerda: el efectivo y la utilidad no son lo mismo. Puedes ganar en papel y quedarte sin dinero.';
  }

  /* ------------------------- Fase: evento ------------------------- */

  function eventView(s) {
    var ev = pendingEvent;
    var wrap = el('div', { class: 'col', style: { gap: '14px' } });

    wrap.appendChild(el('div', { class: 'decision-card card-deal' }, [
      el('div', { class: 'decision-card__tag', text: ev.tag }),
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('span', { style: { fontSize: '32px' }, text: ev.icon }),
        el('div', [
          el('div', { class: 'h3', text: ev.title }),
          el('p', { class: 'p', style: { marginTop: '6px' }, text: ev.text })
        ])
      ])
    ]));

    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });
    ev.options.forEach(function (o, i) {
      var b = el('button', { class: 'opt', type: 'button', onclick: function () {
        w.Sound.select();
        chosenOption = i;
        UI.qsa('.opt', list).forEach(function (n) { n.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        btn.disabled = false;
      } }, [
        el('span', { class: 'opt__key', text: String.fromCharCode(65 + i) }),
        el('span', { class: 'opt__body', text: o.t })
      ]);
      list.appendChild(b);
    });
    wrap.appendChild(list);

    var btn = UI.btn('Decidir', {
      variant: 'brand', size: 'lg', disabled: true,
      onClick: function () {
        var opt = ev.options[chosenOption];
        applyEffects(opt.effects || {});
        save(function (st) { st.usedEvents.push(ev.id); st.lastEventWhy = opt.why; });
        phase = 'result';
        resolve(state());
        UI.Router.refresh();
      }
    });
    wrap.appendChild(btn);
    return wrap;
  }

  function applyEffects(e) {
    save(function (s) {
      if (e.cash) s.cash += e.cash;
      if (e.rep) s.reputation = clamp(s.reputation + e.rep, 3, 100);
      if (e.inv) s.inventory = Math.max(0, s.inventory + e.inv);
      if (e.cost) s.unitCost = Math.max(5, s.unitCost + e.cost);
      if (e.price) s.price = Math.max(20, s.price + e.price);
      if (e.emp) s.employees += e.emp;
      if (e.debt) { s.debt += e.debt; }
      if (e.equity) s.equity = Math.max(1, (s.equity == null ? 100 : s.equity) + e.equity);
      if (e.demand) s.demandMod = e.demand;
      if (e.pending) s.pending.push({ week: s.week + 4, amount: e.pending * s.price * 0.7 });
    });
    if (plan) plan.price = state().price;
  }

  /* ------------------------- Resolver semana ------------------------- */

  var lastResult = null;

  function resolve(s0) {
    var s = state();
    var dem = demandFor(s, plan.ad);
    var cap = capacity(s);

    // compra de material
    var buyCost = plan.buy * s.unitCost;
    var sales = Math.min(dem, s.inventory + plan.buy, cap);
    var lost = Math.max(0, dem - sales);
    var revenue = sales * s.price;
    var cogs = sales * s.unitCost;
    var fixed = CFG.fixedWeekly + s.employees * CFG.employeeWeekly;
    var interest = s.debt > 0 ? Math.round(s.debt * 0.02) : 0;
    var profit = revenue - cogs - plan.ad - fixed - interest;
    var pendingIn = 0;
    s.pending.forEach(function (p) { if (p.week <= s.week) pendingIn += p.amount; });

    var cashDelta = revenue + pendingIn - buyCost - plan.ad - fixed - interest;

    var repDelta = 0;
    if (lost > 0) repDelta -= Math.min(11, 1.5 + lost * 0.7);
    if (sales > 0 && lost === 0) repDelta += 1.6;
    if (s.price > CFG.refPrice * 1.7 && s.reputation < 70) repDelta -= 1.4;
    if (s.price < s.unitCost * 1.25) repDelta -= 0.6;

    save(function (st) {
      st.cash = Math.round(st.cash + cashDelta);
      st.inventory = Math.max(0, st.inventory + plan.buy - sales);
      st.reputation = clamp(st.reputation + repDelta, 3, 100);
      st.cumProfit += profit;
      st.cumRevenue += revenue;
      st.totalSales += sales;
      st.lostSales += lost;
      st.lastProfit = profit;
      st.demandMod = 1;
      st.debt = Math.max(0, st.debt - Math.round(st.debt * 0.08));
      st.pending = st.pending.filter(function (p) { return p.week > st.week; });
      st.history.push({ week: st.week, cash: st.cash, profit: profit, sales: sales, revenue: revenue });
    });

    lastResult = {
      dem: dem, sales: sales, lost: lost, revenue: revenue, cogs: cogs,
      fixed: fixed, ad: plan.ad, buyCost: buyCost, profit: profit,
      cashDelta: cashDelta, repDelta: repDelta, interest: interest, pendingIn: pendingIn
    };

    w.Engine.bumpWeekly('sim', 1);
    if (profit > 0) w.Sound.cash(); else w.Sound.alert();
  }

  /* ------------------------- Fase: resultado ------------------------- */

  function resultView(s) {
    var r = lastResult || {};
    var wrap = el('div', { class: 'col stagger', style: { gap: '12px' } });

    wrap.appendChild(el('div', { class: 'sep', text: 'Resultado de la semana ' + s.week }));

    if (w.Store.state.sim.lastEventWhy) {
      wrap.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(r.profit >= 0 ? 'happy' : 'think') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: w.Store.state.sim.lastEventWhy })
        ])
      ]));
    }

    var rows = [
      ['Demanda', r.dem + ' u', null],
      ['Vendiste', r.sales + ' u', 'up'],
      r.lost > 0 ? ['Ventas perdidas', r.lost + ' u', 'down'] : null,
      ['Ingresos', UI.money(r.revenue), 'up'],
      ['Costo de lo vendido', '-' + UI.money(r.cogs), 'down'],
      ['Publicidad', '-' + UI.money(r.ad), 'down'],
      ['Costos fijos', '-' + UI.money(r.fixed), 'down'],
      r.interest ? ['Intereses', '-' + UI.money(r.interest), 'down'] : null,
      ['Utilidad de la semana', UI.money(r.profit), r.profit >= 0 ? 'up' : 'down'],
      ['Cambio en efectivo', UI.money(r.cashDelta), r.cashDelta >= 0 ? 'up' : 'down'],
      ['Reputación', (r.repDelta >= 0 ? '+' : '') + r.repDelta.toFixed(1) + '%', r.repDelta >= 0 ? 'up' : 'down']
    ].filter(Boolean);

    rows.forEach(function (row, i) {
      wrap.appendChild(el('div', { class: 'sim-result-row', style: { animationDelay: (i * 0.06) + 's' } }, [
        el('span', { text: row[0] }),
        el('b', { style: { color: row[2] === 'down' ? 'var(--red)' : (row[2] === 'up' ? 'var(--green-dark)' : 'var(--ink)') },
          text: row[1] })
      ]));
    });

    if (r.buyCost) {
      wrap.appendChild(el('div', { class: 'tiny t-center',
        text: 'Compraste ' + UI.money(r.buyCost) + ' de material: sale de tu efectivo pero no es gasto hasta que lo vendes.' }));
    }
    if (r.lost > 0) {
      wrap.appendChild(el('div', { class: 'card card--tight', style: { background: 'var(--red-soft)', borderColor: 'var(--red)' } }, [
        el('div', { class: 'small', style: { color: 'var(--red-dark)', fontWeight: '800' },
          text: '⚠️ Perdiste ' + r.lost + ' ventas por falta de inventario o capacidad. Eso también daña tu reputación.' })
      ]));
    }

    wrap.appendChild(UI.btn(s.week >= CFG.weeks ? 'Ver resultado final' : 'Siguiente semana', {
      variant: 'green', size: 'lg',
      onClick: function () {
        if (s.week >= CFG.weeks) {
          save(function (st) { st.finished = true; });
        } else {
          save(function (st) { st.week++; st.lastEventWhy = null; });
        }
        plan = null;
        UI.Router.refresh();
      }
    }));

    return wrap;
  }

  /* ------------------------- Final ------------------------- */

  function endScreen(s) {
    var root = el('div', { class: 'screen screen--center' });
    var equity = s.equity == null ? 100 : s.equity;
    var miParte = Math.round(s.cumProfit * equity / 100);
    var won = miParte >= CFG.goalProfit;
    var survived = s.cash > 0 && miParte > 0;

    if (won) { w.Engine.award('sim-profit'); w.FX.celebrate(); w.Sound.complete(); }
    if (s.cumProfit > 0) w.Engine.award('sim-profit');
    w.Engine.award('sim-master');

    root.appendChild(el('div', { class: 'mascot mascot--xl ' + (won ? 'is-party' : 'is-think'),
      html: w.Mascot.svg(won ? 'money' : (survived ? 'happy' : 'sad')) }));
    root.appendChild(el('div', { class: 'h1', text: won ? '¡Negocio rentable!' : (survived ? 'Sobreviviste' : 'Cerraste en números rojos') }));
    root.appendChild(el('p', { class: 'p', style: { maxWidth: '330px' },
      text: won ? 'Superaste la meta de utilidad acumulada. Estas decisiones son las mismas que tomarás con dinero real.'
                : (survived ? 'Terminaste con utilidad, aunque por debajo de la meta. Revisa qué semanas te costaron más.'
                            : 'Perdiste dinero. Es exactamente para esto que existe el simulador: equivocarte aquí es gratis.') }));

    root.appendChild(el('div', { class: 'grid-2', style: { width: '100%', marginTop: '10px' } }, [
      UI.metric(equity < 100 ? 'Utilidad (tu ' + Math.round(equity) + '%)' : 'Utilidad acumulada',
                UI.money(miParte), equity < 100 ? 'de ' + UI.money(s.cumProfit) : null),
      UI.metric('Ingresos totales', UI.money(s.cumRevenue)),
      UI.metric('Unidades vendidas', String(s.totalSales)),
      UI.metric('Ventas perdidas', String(s.lostSales)),
      UI.metric('Efectivo final', UI.money(s.cash)),
      UI.metric('Reputación final', Math.round(s.reputation) + '%')
    ]));

    root.appendChild(el('div', { class: 'card', style: { width: '100%', textAlign: 'left', marginTop: '12px' } }, [
      el('div', { class: 'tiny', text: 'Lo que enseña tu partida' }),
      el('ul', { style: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' } },
        lessonsFrom(s).map(function (t) { return el('li', { class: 'small', text: '· ' + t }); }))
    ]));

    root.appendChild(el('div', { class: 'col', style: { width: '100%', gap: '10px', marginTop: '14px' } }, [
      UI.btn('Jugar de nuevo', {
        variant: 'brand', size: 'lg',
        onClick: function () {
          w.Store.set(function (st) { st.sim = fresh(); }, 'sim');
          plan = null; phase = 'plan';
          UI.Router.refresh();
        }
      }),
      UI.btn('Volver a la ruta', { variant: 'ghost', onClick: function () { UI.Router.go('home'); } })
    ]));

    return root;
  }

  function lessonsFrom(s) {
    var out = [];
    var eq = s.equity == null ? 100 : s.equity;
    if (eq < 100) {
      out.push('Cediste el ' + Math.round(100 - eq) + '% del negocio: de ' + UI.money(s.cumProfit) +
               ' de utilidad, solo ' + UI.money(s.cumProfit * eq / 100) + ' fue tuyo. El capital de un socio nunca es gratis.');
    }
    if (s.lostSales > 8) out.push('Perdiste ' + s.lostSales + ' ventas por quedarte sin inventario o capacidad: en un negocio real eso también quema reputación.');
    if (s.reputation < 50) out.push('Tu reputación terminó baja. Es la variable más lenta de recuperar y la que más afecta la demanda.');
    var margin = s.price ? ((s.price - s.unitCost) / s.price) * 100 : 0;
    if (margin < 40) out.push('Cerraste con margen de ' + Math.round(margin) + '%. Debajo de 45% cada venta deja muy poco para cubrir fijos.');
    if (s.cash < 3000) out.push('Terminaste con poco efectivo: rentabilidad y liquidez no son lo mismo.');
    if (s.cumProfit > 0 && s.cash < s.cumProfit * 0.4) out.push('Ganaste en papel más de lo que te quedó en efectivo: ahí está la diferencia entre utilidad y flujo.');
    if (!out.length) out.push('Buen equilibrio entre precio, inventario y publicidad. Mantén ese criterio con dinero real.');
    out.push('Utilidad por unidad vendida: ' + UI.money(s.totalSales ? s.cumProfit / s.totalSales : 0) + '.');
    return out;
  }

  UI.Router.register('simulator', render);
})(window, document);
