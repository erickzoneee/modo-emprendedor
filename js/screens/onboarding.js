/* ==========================================================================
   REGISTRO DEL EMPRENDIMIENTO — bienvenida, idea y ruta personalizada

   No es un diagnóstico: es el registro de la idea del usuario. Todo lo que se
   captura aquí se convierte en el "Perfil del emprendimiento" y pasa a ser el
   contexto de TODA la app (lecciones, desafíos, mentor, planes y paneles).

   Siete preguntas, ninguna pesada: idea, producto, cliente, sector, etapa,
   objetivo y recursos. Si una respuesta se queda corta, se repregunta una o
   dos veces — solo lo que de verdad falte para poder personalizar.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  var draft = {
    name: '', businessName: '', idea: '', offer: '', customer: '',
    sector: '', stage: '', goalKey: '', goalText: '',
    budget: '', time: null, experience: '', place: '',
    extra: {}          // respuestas de las repreguntas
  };

  var followUps = null;   // se calcula al llegar al paso

  /* El sector va justo después del cliente: para entonces el usuario ya
     describió qué vende y a quién, así que la app puede proponerle uno en vez
     de preguntar en frío. */
  var STEPS = ['idea', 'offer', 'customer', 'sector', 'stage', 'goal', 'resources', 'more', 'confirm'];

  function stepIndex(key) { return STEPS.indexOf(key); }

  /* --------------------------- SPLASH --------------------------- */

  function splash() {
    return el('div', { class: 'splash' }, [
      el('div', { class: 'mascot mascot--xl', html: w.Mascot.svg('happy') }),
      el('div', { class: 'col', style: { gap: '6px', alignItems: 'center' } }, [
        el('h1', { class: 'splash__logo', text: 'Modo Emprendedor' }),
        el('div', { class: 'splash__tag', html: 'Aprende. <b>Construye.</b> Vende.' })
      ]),
      el('p', { class: 'p', style: { maxWidth: '330px' },
        html: 'No es un curso. Es una <b>misión al día</b> para pasar de una idea a un negocio real.' }),
      el('div', { class: 'col', style: { width: '100%', maxWidth: '330px', gap: '10px', marginTop: '8px' } }, [
        UI.btn('Registrar mi idea', { variant: 'brand', size: 'lg', shiny: true, onClick: function () { go(0); } }),
        UI.btn('Restaurar un respaldo', { variant: 'ghost', onClick: restore })
      ]),
      el('div', { class: 'tiny', style: { marginTop: '-4px' },
        text: 'Sin cuentas ni contraseñas. Tu progreso se guarda en este dispositivo.' }),
      el('div', { class: 'row', style: { gap: '18px', marginTop: '10px', opacity: '.75' } }, [
        stat(String(w.LESSONS.length), UI.plural(w.LESSONS.length, 'lección', 'lecciones')),
        stat(String(C.BOSSES.length), 'retos reales'),
        stat('1', 'negocio tuyo')
      ]),
      el('div', { class: 'tiny', style: { maxWidth: '330px', textTransform: 'none', letterSpacing: '0', opacity: '.8' },
        text: 'Primero registras tu idea. A partir de ahí, cada lección, cada desafío y cada recomendación hablan de TU negocio, no de un ejemplo cualquiera.' })
    ]);
  }

  function stat(n, l) {
    return el('div', { class: 'col', style: { gap: '0', alignItems: 'center' } }, [
      el('div', { class: 'h3 c-brand', text: n }),
      el('div', { class: 'tiny', text: l })
    ]);
  }

  function restore() {
    var input = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    input.addEventListener('change', function () {
      var f = input.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          w.Store.importJSON(fr.result);
          w.Store.markBackup();   // quien restaura ya tiene una copia: no hay que insistirle
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

  /* --------------------------- NAVEGACIÓN --------------------------- */

  function go(i) {
    UI.Router.go('onboarding', { step: i }, i === 0 ? null : 'fwd');
  }

  function render(params) {
    var i = params.step == null ? -1 : params.step;
    if (i < 0) return splash();
    if (i >= STEPS.length) return generating();

    switch (STEPS[i]) {
      case 'idea':      return askIdea(i);
      case 'offer':     return askOffer(i);
      case 'customer':  return askCustomer(i);
      case 'sector':    return askSector(i);
      case 'stage':     return askChoice(i, 'stage', {
        step: 'Etapa', q: '¿En qué etapa te encuentras?',
        sub: 'No hay respuesta mala: cambia por dónde empieza tu ruta.', opts: C.STAGES });
      case 'goal':      return askGoal(i);
      case 'resources': return askResources(i);
      case 'more':      return askFollowUps(i);
      case 'confirm':   return confirm(i);
    }
    return generating();
  }

  function head(i) {
    return el('div', { class: 'row', style: { gap: '12px', marginBottom: '4px' } }, [
      i > 0 ? UI.backBtn(function () { go(i - 1); }) : el('div', { style: { width: '6px' } }),
      UI.pbar((i / (STEPS.length + 1)) * 100, 'brand')
    ]);
  }

  function ask(step, q, sub, mood) {
    return el('div', { class: 'ob-q' }, [
      el('div', { class: 'ob-q__step', text: step }),
      el('div', { class: 'ob-mascot-row' }, [
        el('div', { class: 'mascot', html: w.Mascot.svg(mood || 'neutral') }),
        el('div', { class: 'speech' }, [
          el('h1', { class: 'h4', text: q }),
          el('div', { class: 'small', style: { marginTop: '4px' }, text: sub })
        ])
      ])
    ]);
  }

  /** Pie fijo con el botón de avanzar, activo solo si hay respuesta. */
  function footer(label, isReady, onNext, extra) {
    var btn = UI.btn(label, { variant: 'brand', size: 'lg', shiny: true, onClick: onNext });
    btn.disabled = !isReady();
    return {
      node: el('div', { class: 'col', style: { marginTop: 'auto', paddingTop: '20px', gap: '8px' } },
        [btn].concat(extra || [])),
      refresh: function () { btn.disabled = !isReady(); }
    };
  }

  function area(value, ph, max, onInput) {
    var ta = el('textarea', { class: 'textarea', maxlength: String(max || 300), placeholder: ph, rows: '4' });
    ta.value = value || '';
    ta.addEventListener('input', function () { onInput(ta.value); });
    return ta;
  }

  /** Sugerencias de un toque: acortan el registro sin volverlo un formulario. */
  function chips(list, onPick) {
    var row = el('div', { class: 'row wrap', style: { gap: '8px', marginTop: '10px' } });
    list.forEach(function (x) {
      row.appendChild(el('button', {
        class: 'chip chip--brand', type: 'button',
        style: { cursor: 'pointer', border: 'none' },
        onclick: function () { w.Sound.tap(); onPick(x); }
      }, [el('span', { text: x })]));
    });
    return row;
  }

  /* --------------------------- 1. LA IDEA --------------------------- */

  function askIdea(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Tu idea', '¿Cuál es tu idea de negocio?',
      'Escríbelo como se lo contarías a un amigo. Con una o dos frases basta.', 'happy'));

    var ta = area(draft.idea, 'Quiero vender lámparas personalizadas hechas con impresión 3D…', 300,
      function (v) { draft.idea = v; f.refresh(); });

    var nombre = el('input', {
      class: 'input', type: 'text', maxlength: '48', placeholder: 'Aún no tiene nombre'
    });
    nombre.value = draft.businessName;
    nombre.addEventListener('input', function () { draft.businessName = nombre.value; });

    var yo = el('input', { class: 'input', type: 'text', maxlength: '24', placeholder: 'Tu nombre' });
    yo.value = draft.name;
    yo.addEventListener('input', function () { draft.name = yo.value; });

    root.appendChild(el('div', { class: 'col stagger', style: { gap: '16px' } }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: 'Tu idea' }), ta,
        el('span', { class: 'field__hint',
          text: 'Todo lo que verás después — lecciones, desafíos, ejemplos y recomendaciones — se va a escribir sobre esto.' })
      ]),
      el('div', { class: 'grid-2', style: { gap: '10px' } }, [
        el('div', { class: 'field' }, [el('label', { class: 'field__label', text: 'Tu nombre' }), yo]),
        el('div', { class: 'field' }, [el('label', { class: 'field__label', text: 'Nombre del negocio' }), nombre])
      ])
    ]));

    var f = footer('Continuar', function () { return palabras(draft.idea) >= 3; }, function () { go(i + 1); });
    root.appendChild(f.node);
    return root;
  }

  /* --------------------------- 2. EL PRODUCTO --------------------------- */

  function askOffer(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Tu oferta', '¿Qué producto o servicio quieres ofrecer?',
      'Lo que el cliente recibe exactamente. Sé concreto: eso define tus costos y tu precio.'));

    var ta = area(draft.offer, 'Lámparas de mesa impresas en 3D, personalizadas con el nombre o la figura que pida el cliente…',
      260, function (v) { draft.offer = v; f.refresh(); });

    var col = el('div', { class: 'col stagger', style: { gap: '12px' } }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: 'Producto o servicio' }), ta
      ])
    ]);

    // Si ya lo explicó al describir la idea, no hay por qué hacérselo repetir.
    if (palabras(draft.idea) >= 6) {
      col.appendChild(chips(['Es lo mismo que ya escribí'], function () {
        ta.value = draft.idea;
        draft.offer = draft.idea;
        f.refresh();
        w.FX.pop(ta);
      }));
    }
    root.appendChild(col);

    var f = footer('Continuar', function () { return palabras(draft.offer) >= 2; }, function () { go(i + 1); });
    root.appendChild(f.node);
    return root;
  }

  /* --------------------------- 3. EL CLIENTE --------------------------- */

  function askCustomer(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Tus clientes', '¿A qué tipo de clientes quieres venderles?',
      'Un grupo concreto vende más que “todo el mundo”. Puedes cambiarlo después.'));

    var ta = area(draft.customer, 'Personas de 25 a 40 años que decoran su departamento y buscan un regalo distinto…',
      260, function (v) { draft.customer = v; f.refresh(); });

    var lugar = el('input', { class: 'input', type: 'text', maxlength: '48', placeholder: 'Ciudad o zona (opcional)' });
    lugar.value = draft.place;
    lugar.addEventListener('input', function () { draft.place = lugar.value; });

    root.appendChild(el('div', { class: 'col stagger', style: { gap: '14px' } }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: 'Tus clientes' }), ta,
        el('span', { class: 'field__hint', text: 'Si aún no lo sabes, escribe a quién te imaginas comprándolo. Lo afinamos en la ruta.' })
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: '¿Dónde vendes?' }), lugar
      ])
    ]));

    var f = footer('Continuar', function () { return palabras(draft.customer) >= 2; }, function () { go(i + 1); });
    root.appendChild(f.node);
    return root;
  }

  /* --------------------------- 4. EL SECTOR ---------------------------

     No se pregunta en frío: para llegar aquí el usuario ya escribió qué vende
     y a quién, así que la app propone un sector y él confirma o lo corrige.
     De esta elección salen los ejemplos, la unidad de venta y la apariencia,
     así que conviene que la decida él y no una lista de palabras clave.
     --------------------------------------------------------------------- */

  function askSector(i) {
    var propuesto = false;

    if (!draft.sector) {
      var guess = '';
      try {
        guess = w.Venture.guessSector({
          core: { idea: draft.idea, offer: draft.offer, customer: draft.customer }
        });
      } catch (e) { guess = ''; }
      // "otro" es el resultado de no haber encontrado nada: preseleccionarlo
      // haría que el usuario lo aceptara sin mirar.
      if (guess && guess !== 'otro') { draft.sector = guess; propuesto = true; }
    }

    return askChoice(i, 'sector', {
      step: 'Tu sector',
      q: '¿A qué se dedica tu negocio?',
      sub: propuesto
        ? 'Lo deduje de lo que escribiste. Si no cuadra, elige el correcto.'
        : 'Con esto elijo los ejemplos, las cuentas y la apariencia que hablan de lo tuyo.',
      opts: C.SECTORS
    });
  }

  /* --------------------------- 5. ETAPA (y otras de un toque) --------------------------- */

  function askChoice(i, key, q) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask(q.step, q.q, q.sub));

    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });
    q.opts.forEach(function (o) {
      var selected = draft[key] === o.key;
      var btn = el('button', {
        class: 'opt opt--card' + (selected ? ' is-selected' : ''), type: 'button',
        onclick: function () {
          w.Sound.select();
          w.Sound.buzz(10);
          draft[key] = o.key;
          UI.qsa('.opt', list).forEach(function (n) { n.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          w.FX.pop(btn);
          setTimeout(function () { go(i + 1); }, 260);
        }
      }, [
        el('span', { class: 'opt__emoji', text: o.emoji }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: o.title }),
          el('span', { class: 'opt__hint', text: o.sub || o.ex || '' })
        ])
      ]);
      list.appendChild(btn);
    });
    root.appendChild(list);
    return root;
  }

  /* --------------------------- 6. OBJETIVO --------------------------- */

  function askGoal(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Tu objetivo', '¿Cuál es tu objetivo principal?',
      'Marca la ruta y el orden de las misiones.'));

    var libre = el('input', {
      class: 'input', type: 'text', maxlength: '90',
      placeholder: 'O escríbelo con tus palabras (opcional)'
    });
    libre.value = draft.goalText;
    libre.addEventListener('input', function () { draft.goalText = libre.value; f.refresh(); });

    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });
    C.OBJECTIVES.forEach(function (o) {
      var btn = el('button', {
        class: 'opt opt--card' + (draft.goalKey === o.key ? ' is-selected' : ''), type: 'button',
        onclick: function () {
          w.Sound.select();
          draft.goalKey = o.key;
          UI.qsa('.opt', list).forEach(function (n) { n.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          w.FX.pop(btn);
          f.refresh();
        }
      }, [
        el('span', { class: 'opt__emoji', text: o.emoji }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: o.title }),
          el('span', { class: 'opt__hint', text: o.sub })
        ])
      ]);
      list.appendChild(btn);
    });
    root.appendChild(list);
    root.appendChild(el('div', { class: 'field', style: { marginTop: '14px' } }, [libre]));

    var f = footer('Continuar',
      function () { return !!draft.goalKey || palabras(draft.goalText) >= 2; },
      function () { go(i + 1); });
    root.appendChild(f.node);
    return root;
  }

  /* --------------------------- 7. RECURSOS --------------------------- */

  function askResources(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Tus recursos', '¿Con qué cuentas hoy?',
      'Con esto ajusto el tamaño de cada misión. Si es poco, empezamos igual.'));

    var f;
    function grupo(titulo, opts, key, label) {
      var row = el('div', { class: 'row wrap', style: { gap: '8px' } });
      opts.forEach(function (o) {
        var btn = el('button', {
          class: 'opt' + (draft[key] === o.key ? ' is-selected' : ''), type: 'button',
          style: { flex: '1 1 46%', minWidth: '140px' },
          onclick: function () {
            w.Sound.select();
            draft[key] = o.key;
            UI.qsa('.opt', row).forEach(function (n) { n.classList.remove('is-selected'); });
            btn.classList.add('is-selected');
            f.refresh();
          }
        }, [
          el('span', { class: 'opt__emoji', text: o.emoji }),
          el('span', { class: 'opt__body' }, [el('span', { text: o.title })])
        ]);
        row.appendChild(btn);
      });
      return el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: label }), row
      ]);
    }

    root.appendChild(el('div', { class: 'col stagger', style: { gap: '16px' } }, [
      grupo('presupuesto', C.BUDGETS, 'budget', '¿Cuánto puedes invertir hoy?'),
      grupo('tiempo', C.TIMES, 'time', '¿Cuánto tiempo tienes al día?'),
      grupo('experiencia', C.KNOWLEDGE, 'experience', '¿Cuánta experiencia vendiendo tienes?')
    ]));

    f = footer('Continuar',
      function () { return !!draft.budget && !!draft.time && !!draft.experience; },
      function () { followUps = null; go(i + 1); });
    root.appendChild(f.node);
    return root;
  }

  /* --------------------------- 8. REPREGUNTAS --------------------------- */

  /** Solo se pregunta lo que de verdad falta, y como mucho dos veces. */
  function neededFollowUps() {
    var out = [];
    var vago = /\b(todos|todo el mundo|cualquiera|la gente|publico en general|público en general)\b/i;

    if (palabras(draft.idea) < 12) {
      out.push({
        key: 'problema',
        q: '¿Qué problema le resuelve a tu cliente?',
        ph: 'Las lámparas que se venden son todas iguales y nadie encuentra un regalo con significado…',
        hint: 'Con esto los desafíos hablan de un dolor real, no de un producto bonito.'
      });
    }
    if (palabras(draft.offer) < 5) {
      out.push({
        key: 'detalle',
        q: '¿Qué incluye exactamente lo que entregas?',
        ph: 'Lámpara de 20 cm, con cable y foco, el diseño que pida el cliente, entrega en 5 días…',
        hint: 'Sirve para calcular tu costo y tu precio más adelante.'
      });
    }
    if (palabras(draft.customer) < 4 || vago.test(draft.customer)) {
      out.push({
        key: 'clienteafina',
        q: '¿Quién sería el primero en comprarte, siendo concreto?',
        ph: 'Alguien que acaba de mudarse y está decorando, o quien busca un regalo de cumpleaños…',
        hint: '"Todos" no se puede buscar ni encontrar. Un grupo concreto sí.'
      });
    }
    if ((draft.stage === 'operating' || draft.stage === 'growing') && !out.length) {
      out.push({
        key: 'precio',
        q: '¿A qué precio vendes hoy, más o menos?',
        ph: '450',
        tipo: 'num',
        hint: 'Con tu precio puedo calcular margen y punto de equilibrio desde el primer día.'
      });
    }
    return out.slice(0, 2);
  }

  function askFollowUps(i) {
    if (!followUps) followUps = neededFollowUps();
    if (!followUps.length) { setTimeout(function () { go(i + 1); }, 0); return el('div', { class: 'screen' }); }

    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Un par de detalles', followUps.length === 1 ? 'Una cosa más' : 'Dos cosas más',
      'Solo lo que me falta para que todo lo que veas hable de tu negocio.', 'think'));

    var col = el('div', { class: 'col stagger', style: { gap: '16px' } });
    followUps.forEach(function (q) {
      var input;
      if (q.tipo === 'num') {
        input = el('input', { class: 'input', type: 'number', inputmode: 'decimal', placeholder: q.ph });
        input.value = draft.extra[q.key] || '';
      } else {
        input = el('textarea', { class: 'textarea', rows: '3', maxlength: '240', placeholder: q.ph });
        input.value = draft.extra[q.key] || '';
      }
      input.addEventListener('input', function () { draft.extra[q.key] = input.value; });
      col.appendChild(el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: q.q }),
        input,
        el('span', { class: 'field__hint', text: q.hint })
      ]));
    });
    root.appendChild(col);

    root.appendChild(el('div', { class: 'col', style: { marginTop: 'auto', paddingTop: '20px', gap: '8px' } }, [
      UI.btn('Continuar', { variant: 'brand', size: 'lg', shiny: true, onClick: function () { go(i + 1); } }),
      UI.btn('Prefiero contestarlo después', { variant: 'flat', onClick: function () { go(i + 1); } })
    ]));

    // Si el usuario ya tiene su IA configurada, las repreguntas las afina ella.
    if (w.AI && w.AI.disponible()) {
      w.AI.intakeQuestions(draftCore(), followUps.length).then(function (qs) {
        if (!qs || !qs.length) return;
        var campos = UI.qsa('.field__label', col);
        qs.slice(0, campos.length).forEach(function (texto, n) {
          if (campos[n]) campos[n].textContent = texto;
          if (followUps[n]) followUps[n].q = texto;
        });
      }).catch(function () { /* se quedan las locales */ });
    }

    return root;
  }

  /* --------------------------- 9. CONFIRMACIÓN --------------------------- */

  function draftCore() {
    return {
      idea: draft.idea, offer: draft.offer, customer: draft.customer,
      stage: draft.stage, goalKey: draft.goalKey, goalText: draft.goalText
    };
  }

  function confirm(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));
    root.appendChild(ask('Confirmación', 'Así entendí tu emprendimiento',
      'Si algo no cuadra, vuelve atrás y cámbialo. También podrás editarlo cuando quieras.', 'happy'));

    var stage = (C.STAGES.filter(function (x) { return x.key === draft.stage; })[0] || {}).title || '—';
    var goal = draft.goalText ||
      (C.OBJECTIVES.filter(function (x) { return x.key === draft.goalKey; })[0] || {}).title || '—';
    var budget = (C.BUDGETS.filter(function (x) { return x.key === draft.budget; })[0] || {}).title || '—';
    var exp = (C.KNOWLEDGE.filter(function (x) { return x.key === draft.experience; })[0] || {}).title || '—';
    var sector = (C.SECTORS.filter(function (x) { return x.key === draft.sector; })[0] || {}).title || '—';

    var filas = [
      ['💡', 'Tu idea', draft.idea],
      ['📦', 'Qué ofreces', draft.offer],
      ['🎯', 'Tus clientes', draft.customer + (draft.place ? ' · ' + draft.place : '')],
      ['🏷️', 'Sector', sector],
      ['📍', 'Etapa', stage],
      ['🚩', 'Objetivo', goal],
      ['🧰', 'Recursos', budget + ' · ' + draft.time + ' min/día · ' + exp]
    ];
    if (draft.extra.problema) filas.push(['🩹', 'Problema que resuelves', draft.extra.problema]);
    if (draft.extra.detalle) filas.push(['📋', 'Qué incluye', draft.extra.detalle]);
    if (draft.extra.clienteafina) filas.push(['👤', 'Primer comprador', draft.extra.clienteafina]);
    if (draft.extra.precio) filas.push(['🏷️', 'Precio actual', '$' + draft.extra.precio]);

    var card = el('div', { class: 'card', style: { textAlign: 'left' } });
    filas.forEach(function (f) {
      card.appendChild(el('div', { class: 'kv', style: { flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'left' } }, [
        el('span', { class: 'kv__k', text: f[0] + ' ' + f[1] }),
        el('span', { class: 'small', style: { fontWeight: '700', color: 'var(--ink)', whiteSpace: 'pre-wrap' },
          text: f[2] || '—' })
      ]));
    });
    root.appendChild(card);

    root.appendChild(el('div', { class: 'tiny t-center', style: { textTransform: 'none', letterSpacing: '0', marginTop: '10px' },
      text: 'Esto se guarda como tu Perfil del emprendimiento y es lo que usa la app para escribir tus lecciones, desafíos y recomendaciones.' }));

    root.appendChild(el('div', { class: 'col', style: { marginTop: 'auto', paddingTop: '20px', gap: '8px' } }, [
      UI.btn('Crear mi ruta', { variant: 'brand', size: 'lg', shiny: true, onClick: function () { go(STEPS.length); } }),
      UI.btn('Corregir algo', { variant: 'flat', onClick: function () { go(0); } })
    ]));
    return root;
  }

  /* --------------------------- GENERANDO --------------------------- */

  function generating() {
    // Se guarda ANTES de la animación: así los textos de esta pantalla ya
    // pueden hablar del negocio del usuario.
    save();

    var t = w.Venture.terms();
    var root = el('div', { class: 'screen screen--center' });
    var mascot = el('div', { class: 'mascot mascot--lg is-think', html: w.Mascot.svg('think') });
    var title = el('h1', { class: 'h3', text: 'Diseñando tu ruta…' });
    var wrap = el('div', { class: 'route-anim', style: { maxWidth: '340px', marginTop: '18px' } });

    root.appendChild(mascot);
    root.appendChild(title);
    root.appendChild(el('p', { class: 'small', style: { maxWidth: '300px' },
      text: 'Cruzando tu idea, tus clientes, tu etapa y tus recursos.' }));
    root.appendChild(wrap);

    var steps = [
      { ico: '💡', t: 'Idea registrada: ' + w.Venture.util.shorten(t.idea, 34) },
      { ico: '🎯', t: 'Clientes: ' + w.Venture.util.shorten(t.cliente, 34) },
      { ico: '📍', t: 'Etapa: ' + t.etapaCorta },
      { ico: '⏱️', t: 'Meta diaria: ' + goalXP(draft.time) + ' XP (' + draft.time + ' min)' },
      { ico: '🗺️', t: 'Ruta de ' + C.LEVELS.length + ' niveles adaptada a tu negocio' },
      { ico: '✍️', t: 'Desafíos escritos sobre ' + w.Venture.util.shorten(t.productoCorto, 26) }
    ];

    steps.forEach(function (s, i) {
      var line = el('div', { class: 'route-line', style: { animationDelay: (i * 0.38 + 0.15) + 's' } }, [
        el('span', { class: 'route-line__ico', text: s.ico }),
        el('span', { class: 'grow', text: s.t }),
        el('span', { class: 'dots' }, [el('i'), el('i'), el('i')])
      ]);
      wrap.appendChild(line);
      setTimeout(function () {
        line.classList.add('is-done');
        var dots = UI.qs('.dots', line);
        if (dots) dots.replaceWith(el('span', { text: '✓' }));
        w.Sound.select();
      }, i * 380 + 800);
    });

    setTimeout(function () {
      w.Mascot.setMood(mascot, 'party');
      title.textContent = '¡Tu ruta está lista!';
      w.Sound.complete();
      w.FX.celebrate();
      root.appendChild(el('div', { class: 'col', style: { width: '100%', maxWidth: '340px', marginTop: '22px', gap: '8px' } }, [
        el('div', { class: 'small t-center', text: w.Venture.summary() }),
        UI.btn('Comenzar mi primera misión', { variant: 'brand', size: 'lg', shiny: true, onClick: finish })
      ]));
    }, steps.length * 380 + 1200);

    return root;
  }

  function goalXP(min) {
    if (min <= 10) return 20;
    if (min <= 20) return 40;
    return 70;
  }

  /* --------------------------- GUARDADO --------------------------- */

  function palabras(s) {
    return String(s || '').trim() ? String(s).trim().split(/\s+/).length : 0;
  }

  /** Escribe el perfil del emprendimiento y espeja el perfil antiguo. */
  function save() {
    var v = w.Venture.startOver();          // perfil limpio para la idea nueva

    w.Venture.patchCore({
      name: (draft.businessName || '').trim(),
      idea: (draft.idea || '').trim(),
      offer: (draft.offer || '').trim() || (draft.idea || '').trim(),
      customer: (draft.customer || '').trim(),
      sector: draft.sector || '',
      stage: draft.stage || 'idea',
      goalKey: draft.goalKey || '',
      goalText: (draft.goalText || '').trim(),
      place: (draft.place || '').trim(),
      'resources.budget': draft.budget || '',
      'resources.time': draft.time || 20,
      'resources.experience': draft.experience || ''
    });

    // Las repreguntas ya son decisiones tomadas: entran al nivel 2.
    if (draft.extra.problema) {
      w.Venture.recordDecision('problema', draft.extra.problema,
        { label: 'Problema que resuelve', from: 'registro' });
    }
    if (draft.extra.detalle) {
      w.Venture.recordDecision('oferta', draft.extra.detalle,
        { label: 'Qué incluye la oferta', from: 'registro' });
    }
    if (draft.extra.clienteafina) {
      w.Venture.recordDecision('cliente', draft.extra.clienteafina,
        { label: 'Primer comprador', from: 'registro' });
    }
    if (draft.extra.precio) {
      var n = parseFloat(String(draft.extra.precio).replace(',', '.'));
      if (!isNaN(n)) w.Venture.set(function (vv) { vv.metrics.precio = n; }, 'venture-metrics');
    }

    // El objetivo se convierte en el primer objetivo del plan (nivel 3).
    var objetivo = (draft.goalText || '').trim() ||
      (C.OBJECTIVES.filter(function (x) { return x.key === draft.goalKey; })[0] || {}).title;
    if (objetivo) w.Venture.addObjective(objetivo, '', '');

    w.Venture.set(function (vv) { vv.intake.done = true; }, 'venture-intake');

    // Perfil antiguo: la ruta, la liga y la barra superior siguen leyéndolo.
    w.Store.set(function (s) {
      s.profile.name = (draft.name || '').trim() || 'Emprendedor';
      s.profile.businessName = (draft.businessName || '').trim();
      s.profile.idea = (draft.idea || '').trim();
      s.profile.time = draft.time;
      s.profile.budget = draft.budget;
      s.profile.knowledge = draft.experience;
      s.dailyGoal = goalXP(draft.time);
      if (draft.idea) {
        s.dossier.idea = { answers: { idea: draft.idea }, score: null, at: Date.now(), from: 'registro' };
      }
    }, 'onboard');

    w.Venture.mirrorProfile();
    w.Store.set(function (s) { s.startIndex = w.Engine.recommendedStart(); }, 'route');

    /* La apariencia se deriva del sector recién elegido, y hasta aquí solo se
       aplicaba al arrancar la app. Sin esta línea, quien acaba de registrar una
       pastelería veía toda la ruta en el color del emprendimiento anterior —o en
       el genérico si era usuario nuevo— hasta la siguiente recarga.
       asegurar() es idempotente: en los arranques siguientes no escribe nada. */
    try { w.Persona.asegurar(); } catch (e) { console.warn('[persona]', e); }

    return v;
  }

  function finish() {
    w.Store.set(function (s) { s.onboarded = true; }, 'onboard');
    w.Engine.touchDay();
    w.App.showChrome(true);
    UI.Router.go('home', {}, 'none');
    setTimeout(function () {
      UI.toast('Tu ruta está escrita sobre tu idea', 'green', '🗺️', 3400);
    }, 500);
  }

  /* --------------------------- Registro desde otro sitio --------------------------- */

  /** Permite relanzar el registro (por ejemplo, al cambiar de idea). */
  function relaunch() {
    draft = {
      name: w.Store.state.profile.name === 'Emprendedor' ? '' : w.Store.state.profile.name,
      businessName: '', idea: '', offer: '', customer: '',
      sector: '', stage: '', goalKey: '', goalText: '',
      budget: '', time: null, experience: '', place: '', extra: {}
    };
    followUps = null;
    w.App.showChrome(false);
    UI.Router.go('onboarding', { step: 0 }, 'fwd');
  }

  UI.Router.register('onboarding', render);
  w.Onboarding = { splash: splash, relaunch: relaunch };
})(window, document);
