/* ==========================================================================
   MI EMPRENDIMIENTO — el perfil que da contexto a toda la app

   Aquí el usuario consulta el resumen de su idea, completa lo que falta,
   corrige datos, ve las decisiones que ha tomado, revisa su plan y su avance
   y puede cambiar la idea si el proyecto evoluciona.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  function V() { return w.Venture; }

  function render() {
    var v = V().active();
    var t = V().terms();
    var comp = V().completeness();

    var root = el('div', { class: 'screen' });

    /* ---------------- Cabecera ---------------- */
    root.appendChild(el('div', { class: 'dossier-hero' }, [
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('div', { class: 'grow', style: { minWidth: '0' } }, [
          el('div', { class: 'tiny', style: { color: '#fff', opacity: '.85' }, text: 'Mi emprendimiento' }),
          el('h1', { text: t.negocio }),
          el('p', { text: t.etapaCorta + (t.objetivo ? ' · ' + V().util.shorten(t.objetivo, 44) : '') })
        ]),
        el('div', { style: { fontSize: '38px' }, text: comp.pct >= 90 ? '🏆' : '🧭' })
      ]),
      el('div', { style: { marginTop: '14px' } }, [UI.pbar(comp.pct, 'gold')]),
      el('div', { class: 'tiny', style: { color: '#fff', opacity: '.85', marginTop: '6px' },
        text: 'Perfil ' + comp.pct + '% completo' })
    ]));

    /* ---------------- Resumen ---------------- */
    root.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(comp.esenciales.length ? 'think' : 'happy') }),
      el('div', { class: 'speech' }, [
        el('div', { class: 'small', text: V().summary() })
      ])
    ]));

    /* ---------------- Propuesta pendiente ---------------- */
    // Si quedó una propuesta sin contestar (por ejemplo, porque cerró la app
    // antes de responder), se le vuelve a ofrecer aquí en vez de perderla.
    var prop = w.Persona && w.Persona.actual().propuesta;
    if (prop) root.appendChild(propuestaCard(prop));

    /* ---------------- Personalizar ---------------- */
    root.appendChild(personalizarCard());

    /* ---------------- Lo que falta ---------------- */
    if (comp.esenciales.length) {
      var pend = el('div', { class: 'card', style: { background: 'var(--gold-soft)', borderColor: 'var(--gold)', textAlign: 'left' } }, [
        el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--gold-dark)' },
          text: '⚠️ Te falta información por completar' }),
        el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0' },
          text: 'Cada dato que falta hace que los desafíos y las recomendaciones sean menos precisos.' })
      ]);
      var lista = el('div', { class: 'col', style: { gap: '8px', marginTop: '12px' } });
      comp.esenciales.forEach(function (f) {
        lista.appendChild(UI.btn(f.label, {
          variant: 'ghost', size: 'sm',
          onClick: function () { editField(f.key); }
        }));
      });
      pend.appendChild(lista);
      root.appendChild(pend);
    }

    /* ---------------- Datos de la idea ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Los datos de tu idea' }));
    root.appendChild(datosCard(v));

    /* ---------------- Plan generado ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Tu plan de negocio' }));
    root.appendChild(el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginBottom: '10px' },
      text: 'Calculado con lo que has registrado y decidido. Toca cada sección para verla.' }));
    var plan = el('div', { class: 'col', style: { gap: '10px' } });
    w.Personalize.kinds().forEach(function (k) { plan.appendChild(analysisCard(k)); });
    root.appendChild(plan);

    /* ---------------- Decisiones ---------------- */
    var dec = V().decisions();
    root.appendChild(el('h2', { class: 'sep', text: 'Decisiones que has tomado (' + dec.length + ')' }));
    root.appendChild(decisionesCard(dec));

    /* ---------------- Objetivos, tareas y resultados ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Objetivos y tareas' }));
    root.appendChild(planCard(v));

    /* ---------------- Progreso ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Tu avance' }));
    root.appendChild(progresoCard());

    /* ---------------- Cambiar la idea ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Si tu proyecto cambia' }));
    root.appendChild(el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
      el('div', { class: 'small', style: { fontWeight: '900' }, text: 'Cambiar o actualizar mi idea' }),
      el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0', lineHeight: '1.6' },
        text: 'Puedes ajustar cualquier dato arriba. Si el proyecto cambió de raíz, vuelve a registrarlo: ' +
              'tu XP, tu racha, tus insignias y tus lecciones completadas se quedan intactas.' }),
      el('div', { style: { marginTop: '12px' } }, [
        UI.btn('Registrar una idea nueva', { variant: 'flat', size: 'sm', onClick: reregister })
      ])
    ]));

    return root;
  }

  /* ==================================================================
     TARJETAS
     ================================================================== */

  /** Acceso a la apariencia, junto a los datos de los que sale. */
  function personalizarCard() {
    var a = w.Persona ? w.Persona.actual() : null;
    var resumen = a
      ? (w.Persona.activa()
          ? a.tema.emoji + ' ' + a.tema.title + ' · ' + a.intensidad
          : 'Apagada — la app se ve en su apariencia original')
      : '';

    return el('button', {
      class: 'doss-item is-filled', type: 'button',
      onclick: function () { w.Sound.tap(); UI.Router.go('personaliza'); }
    }, [
      el('span', { class: 'doss-item__ico', text: '🎨' }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'doss-item__t', text: 'Personalizar mi experiencia' }),
        el('span', { class: 'doss-item__p', text: resumen })
      ]),
      el('span', { style: { fontSize: '18px', flex: 'none', color: 'var(--neg-acento)' }, text: '›' })
    ]);
  }

  /** La propuesta que quedó sin responder. */
  function propuestaCard(prop) {
    var sec = (C.SECTORS.filter(function (x) { return x.key === prop.sector; })[0] || {});
    return el('div', { class: 'card card--tight', style: { background: 'var(--purple-soft)', borderColor: 'var(--purple)', textAlign: 'left' } }, [
      el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--purple-dark)' },
        text: '✨ Tengo una propuesta para tu apariencia' }),
      el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0', lineHeight: '1.6' },
        text: 'Por cómo describes tu negocio, lo clasificaría como ' +
              (sec.title || prop.sector) + (prop.subtipo ? ' (' + prop.subtipo + ')' : '') +
              '. Nada cambia hasta que decidas.' }),
      el('div', { class: 'row', style: { gap: '8px', marginTop: '12px' } }, [
        UI.btn('Verla', { variant: 'purple', size: 'sm', block: false,
          onClick: function () { proponerSheet(prop); } }),
        UI.btn('Descartar', { variant: 'flat', size: 'sm', block: false,
          onClick: function () {
            w.Persona.descartarPropuesta();
            UI.toast('Descartada', 'blue', '👌');
            UI.Router.refresh();
          } })
      ])
    ]);
  }

  function datosCard(v) {
    var c = v.core;
    var stage = (C.STAGES.filter(function (x) { return x.key === c.stage; })[0] || {}).title;
    var goal = c.goalText ||
      (C.OBJECTIVES.filter(function (x) { return x.key === c.goalKey; })[0] || {}).title;
    var budget = (C.BUDGETS.filter(function (x) { return x.key === c.resources.budget; })[0] || {}).title;
    var exp = (C.KNOWLEDGE.filter(function (x) { return x.key === c.resources.experience; })[0] || {}).title;
    var sector = (C.SECTORS.filter(function (x) { return x.key === c.sector; })[0] || {}).title;
    var voz = (C.PERSONALIDADES.filter(function (x) { return x.key === c.brandVoice; })[0] || {}).title;

    var filas = [
      { key: 'idea',       ico: '💡', label: 'Tu idea',        value: c.idea },
      { key: 'offer',      ico: '📦', label: 'Qué ofreces',    value: c.offer },
      { key: 'customer',   ico: '🎯', label: 'Tus clientes',   value: c.customer },
      { key: 'sector',     ico: '🏷️', label: 'Sector',         value: sector },
      { key: 'stage',      ico: '📍', label: 'Etapa',          value: stage },
      { key: 'goalKey',    ico: '🚩', label: 'Objetivo',       value: goal },
      { key: 'budget',     ico: '💵', label: 'Presupuesto',    value: budget },
      { key: 'time',       ico: '⏱️', label: 'Tiempo al día',  value: c.resources.time ? c.resources.time + ' min' : '' },
      { key: 'experience', ico: '🎓', label: 'Experiencia',    value: exp },
      { key: 'name',       ico: '🏪', label: 'Nombre',         value: c.name },
      { key: 'place',      ico: '📌', label: 'Dónde vendes',   value: c.place },
      { key: 'brandVoice', ico: '🗣️', label: 'Personalidad',   value: voz }
    ];

    var col = el('div', { class: 'col', style: { gap: '8px' } });
    filas.forEach(function (f) {
      // Si una misión afinó el dato, la app usa esa versión: hay que decirlo
      // aquí o el perfil enseñaría una cosa y los desafíos hablarían de otra.
      var ef = (f.key === 'customer' || f.key === 'offer') ? V().effective(f.key) : null;

      col.appendChild(el('button', {
        class: 'doss-item' + (f.value ? ' is-filled' : ''), type: 'button',
        onclick: function () { w.Sound.tap(); editField(f.key); }
      }, [
        el('span', { class: 'doss-item__ico', text: f.ico }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'doss-item__t', text: f.label }),
          el('span', { class: 'doss-item__p', text: f.value || 'Pendiente — toca para completarlo' }),
          ef && ef.overridden
            ? el('span', { class: 'doss-item__p', style: { color: 'var(--teal)' },
                text: '↳ La app usa la versión que afinaste: ' + V().util.shorten(ef.value, 70) })
            : null
        ]),
        el('span', { style: { fontSize: '18px', flex: 'none', color: f.value ? 'var(--teal)' : 'var(--ink-3)' },
          text: f.value ? '✎' : '›' })
      ]));
    });
    return col;
  }

  function analysisCard(kind) {
    var a = w.Personalize.analysis(kind.key);
    var card = el('button', {
      class: 'doss-item is-filled', type: 'button',
      onclick: function () { w.Sound.tap(); openAnalysis(kind.key); }
    }, [
      el('span', { class: 'doss-item__ico', text: a.icon }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'doss-item__t', text: a.title }),
        el('span', { class: 'doss-item__p',
          text: a.ia ? V().util.shorten(a.ia.replace(/\n/g, ' '), 90)
                     : (a.lines[0] || a.gaps[0] || '') })
      ]),
      el('span', { style: { fontSize: '18px', flex: 'none', color: a.gaps.length ? 'var(--gold-dark)' : 'var(--teal)' },
        text: a.gaps.length ? '!' : '›' })
    ]);
    return card;
  }

  function openAnalysis(key) {
    var a = w.Personalize.analysis(key);
    var cuerpo = el('div', { class: 'col', style: { gap: '10px', textAlign: 'left' } });

    function pintar(texto, fuente) {
      UI.clear(cuerpo);
      if (fuente === 'ia') {
        cuerpo.appendChild(el('div', { class: 'small', style: { whiteSpace: 'pre-wrap', lineHeight: '1.7' },
          html: UI.rich(texto) }));
        cuerpo.appendChild(UI.chip('Generado para tu negocio', 'purple', '✨'));
        return;
      }
      a.lines.forEach(function (l) {
        cuerpo.appendChild(el('div', { class: 'key-row' }, [
          el('span', { class: 'key-row__ico', text: '·' }),
          el('span', { class: 'small', text: l })
        ]));
      });
      if (a.gaps.length) {
        cuerpo.appendChild(el('div', { class: 'card card--tight', style: { background: 'var(--gold-soft)', borderColor: 'var(--gold)' } }, [
          el('div', { class: 'tiny', style: { color: 'var(--gold-dark)', fontWeight: '900' }, text: 'Para completarlo te falta' }),
          el('div', { class: 'col', style: { gap: '4px', marginTop: '6px' } },
            a.gaps.map(function (g) { return el('div', { class: 'small', text: '· ' + g }); }))
        ]));
      }
    }

    if (a.ia) pintar(a.ia, 'ia'); else pintar(null, 'local');

    var acciones = [];
    if (w.Personalize.aiOn()) {
      var b = UI.btn(a.ia ? 'Volver a generarlo con IA' : 'Generarlo con mi IA', {
        variant: 'purple', size: 'sm',
        onClick: function () {
          b.disabled = true;
          b.querySelector('span:last-child').textContent = 'Generando…';
          // Se pide forzando, sin borrar antes lo que ya había: si la IA falla
          // o no hay red, el usuario conserva el análisis que estaba leyendo.
          // Lo sustituye cacheSet, ya con la respuesta buena en la mano.
          var p = w.Personalize.analysisAI(key, true);
          if (!p) { b.disabled = false; return; }
          p.then(function (txt) {
            pintar(txt, 'ia');
            b.disabled = false;
            b.querySelector('span:last-child').textContent = 'Volver a generarlo con IA';
            w.Sound.cash();
          }).catch(function (err) {
            b.disabled = false;
            b.querySelector('span:last-child').textContent = 'Reintentar';
            UI.toast((err && err.message) || 'La IA no respondió', 'red', '⚠️', 3600);
          });
        }
      });
      acciones.push(b);
    }

    UI.sheet([
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('span', { style: { fontSize: '30px' }, text: a.icon }),
        el('div', { class: 'grow' }, [
          el('h2', { class: 'h3', text: a.title }),
          el('div', { class: 'tiny', text: V().terms().negocio })
        ])
      ]),
      cuerpo
    ].concat(acciones).concat([
      UI.btn('Cerrar', { variant: 'ghost', onClick: UI.closeSheet })
    ]));
  }

  function decisionesCard(dec) {
    if (!dec.length) {
      return el('div', { class: 'empty' }, [
        el('div', { class: 'empty__ico', text: '🧠' }),
        el('div', { class: 'small',
          text: 'Todavía no has tomado decisiones dentro de la app. Cada misión que entregas se guarda aquí, ' +
                'y a partir de ese momento el mentor deja de preguntártelo y empieza a usarlo.' })
      ]);
    }
    var col = el('div', { class: 'col', style: { gap: '8px' } });
    dec.forEach(function (x) {
      col.appendChild(el('button', {
        class: 'doss-item is-filled', type: 'button',
        onclick: function () {
          w.Sound.tap();
          UI.sheet([
            el('h2', { class: 'h3', text: x.label || x.key }),
            el('div', { class: 'card card--tight' }, [
              el('div', { class: 'small', style: { whiteSpace: 'pre-wrap', textAlign: 'left' }, text: x.value })
            ]),
            el('div', { class: 'row', style: { gap: '8px' } }, [
              UI.chip(new Date(x.at).toLocaleDateString('es-MX'), null, '📅'),
              x.score != null ? UI.chip(x.score + '/100', x.score >= 70 ? 'green' : 'gold', '🧠') : null,
              UI.chip(x.from || 'app', null, '📍')
            ]),
            UI.btn('Cerrar', { variant: 'ghost', onClick: UI.closeSheet })
          ]);
        }
      }, [
        el('span', { class: 'doss-item__ico', text: '✅' }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'doss-item__t', text: x.label || x.key }),
          el('span', { class: 'doss-item__p', text: x.value })
        ]),
        el('span', { style: { fontSize: '18px', flex: 'none', color: 'var(--ink-3)' }, text: '›' })
      ]));
    });
    return col;
  }

  function planCard(v) {
    var col = el('div', { class: 'col', style: { gap: '10px' } });

    col.appendChild(bloqueLista('Objetivos', v.objectives, 'objectives', 'Ningún objetivo escrito todavía.',
      '🚩', function () { nuevoTexto('objetivo'); }));
    col.appendChild(bloqueLista('Tareas pendientes', v.tasks, 'tasks', 'Sin tareas pendientes.',
      '📋', function () { nuevoTexto('tarea'); }));

    var res = v.results.slice().reverse().slice(0, 8);
    var resBox = el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
      el('div', { class: 'small', style: { fontWeight: '900' }, text: '🏁 Resultados logrados' })
    ]);
    if (!res.length) {
      resBox.appendChild(el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0' },
        text: 'Aquí se anota cada reto real que superas y cada cambio importante de tu negocio.' }));
    } else {
      res.forEach(function (r) {
        resBox.appendChild(el('div', { class: 'small', style: { marginTop: '6px' },
          text: '· ' + r.text + ' (' + new Date(r.at).toLocaleDateString('es-MX') + ')' }));
      });
    }
    col.appendChild(resBox);
    return col;
  }

  function bloqueLista(titulo, items, listKey, vacio, ico, onAdd) {
    var box = el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
      el('div', { class: 'row between' }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: ico + ' ' + titulo }),
        el('button', { class: 'chip chip--brand', type: 'button', style: { border: 'none', cursor: 'pointer' },
          text: '+ Añadir', onclick: function () { w.Sound.tap(); onAdd(); } })
      ])
    ]);
    if (!items.length) {
      box.appendChild(el('div', { class: 'tiny', style: { marginTop: '8px', textTransform: 'none', letterSpacing: '0' }, text: vacio }));
      return box;
    }
    items.forEach(function (x) {
      box.appendChild(el('div', { class: 'row', style: { gap: '10px', marginTop: '10px', alignItems: 'flex-start' } }, [
        el('button', {
          class: 'chip' + (x.done ? ' chip--green' : ''), type: 'button',
          style: { border: 'none', cursor: 'pointer', flex: 'none' },
          text: x.done ? '✅' : '⬜',
          onclick: function () { w.Sound.tap(); V().toggle(listKey, x.id); UI.Router.refresh(); }
        }),
        el('div', { class: 'small grow', style: { textDecoration: x.done ? 'line-through' : 'none', opacity: x.done ? '.6' : '1' },
          text: x.text + (x.metric ? ' · ' + x.metric : '') }),
        el('button', {
          class: 'chip', type: 'button', style: { border: 'none', cursor: 'pointer', flex: 'none' }, text: '🗑️',
          onclick: function () { w.Sound.tap(); V().remove(listKey, x.id); UI.Router.refresh(); }
        })
      ]));
    });
    return box;
  }

  function nuevoTexto(tipo) {
    var t = V().terms();
    var input = el('textarea', { class: 'textarea', rows: '3', maxlength: '200',
      placeholder: tipo === 'objetivo'
        ? 'Vender 20 ' + t.unidades + ' de ' + t.productoCorto + ' antes del 30 de este mes'
        : 'Escribir a 10 personas de ' + t.cliente });
    var medida = tipo === 'objetivo'
      ? el('input', { class: 'input', type: 'text', maxlength: '48', placeholder: 'Cómo lo mides (opcional)' })
      : null;

    UI.sheet([
      el('h2', { class: 'h3', text: tipo === 'objetivo' ? 'Nuevo objetivo' : 'Nueva tarea' }),
      el('div', { class: 'small', text: tipo === 'objetivo'
        ? 'Con número y fecha. Sin eso no es un objetivo, es un deseo.'
        : 'Algo concreto que puedas terminar esta semana.' }),
      input,
      medida,
      UI.btn('Guardar', { variant: 'green', onClick: function () {
        var txt = (input.value || '').trim();
        if (!txt) { UI.toast('Escribe algo primero', 'red', '✍️'); return; }
        if (tipo === 'objetivo') V().addObjective(txt, medida ? medida.value : '', '');
        else V().addTask(txt, 'manual');
        UI.closeSheet();
        w.Sound.coin();
        UI.Router.refresh();
      } })
    ]);
  }

  function progresoCard() {
    var s = w.Store.state;
    var prog = w.Engine.overallProgress();
    var llenas = C.DOSSIER.filter(function (sec) { return !!s.dossier[sec.key]; }).length;

    return el('div', { class: 'col', style: { gap: '10px' } }, [
      el('div', { class: 'grid-2' }, [
        UI.metric('Ruta', Math.round(prog.pct) + '%'),
        UI.metric('Expediente', llenas + '/' + C.DOSSIER.length),
        UI.metric('Decisiones', String(V().decisions().length)),
        UI.metric('Retos reales', s.stats.missions + '/' + C.BOSSES.length)
      ]),
      UI.btn('Ver mi expediente completo', { variant: 'ghost', size: 'sm',
        onClick: function () { UI.Router.go('business'); } })
    ]);
  }

  /* ==================================================================
     EDICIÓN DE UN CAMPO
     ================================================================== */

  var LARGO = { idea: 1, offer: 1, customer: 1 };
  var OPCIONES = {
    sector: { list: 'SECTORS', label: '¿A qué se dedica tu negocio?' },
    brandVoice: { list: 'PERSONALIDADES', label: '¿Cómo quieres que suene tu marca?' },
    stage: { list: 'STAGES', label: '¿En qué etapa estás?' },
    goalKey: { list: 'OBJECTIVES', label: '¿Cuál es tu objetivo principal?' },
    budget: { list: 'BUDGETS', label: '¿Cuánto puedes invertir hoy?', path: 'resources.budget' },
    time: { list: 'TIMES', label: '¿Cuánto tiempo tienes al día?', path: 'resources.time' },
    experience: { list: 'KNOWLEDGE', label: '¿Cuánta experiencia vendiendo tienes?', path: 'resources.experience' }
  };
  var TITULO = {
    idea: 'Tu idea de negocio', offer: 'Qué producto o servicio ofreces',
    customer: 'A qué clientes quieres venderles', name: 'Nombre de tu negocio',
    place: 'Dónde vendes'
  };
  var PISTA = {
    idea: 'Cambiarla no borra tu progreso: solo reescribe los ejemplos y los desafíos que veas a partir de ahora.',
    offer: 'Cuanto más concreto, mejor calculo tus costos y tu precio.',
    customer: 'Un grupo específico. "Todos" no se puede buscar ni encontrar.',
    name: 'Opcional. No lo necesitas para vender, pero sí para que te recomienden.',
    place: 'Ciudad, colonia o "en línea".'
  };

  function editField(key) {
    var v = V().active();
    var c = v.core;

    if (OPCIONES[key]) return editChoice(key);

    var actual = key === 'name' ? c.name : (key === 'place' ? c.place : c[key]);
    var input = LARGO[key]
      ? el('textarea', { class: 'textarea', rows: '4', maxlength: '300' })
      : el('input', { class: 'input', type: 'text', maxlength: '60' });
    input.value = actual || '';

    UI.sheet([
      el('h2', { class: 'h3', text: TITULO[key] || key }),
      el('div', { class: 'small', text: PISTA[key] || '' }),
      input,
      UI.btn('Guardar', { variant: 'green', onClick: function () {
        var val = (input.value || '').trim();
        var patch = {};
        patch[key] = val;
        // Cambiar la idea, la oferta o el cliente invalida lo ya generado.
        var cambioDeFondo = LARGO[key] && V().util.norm(val) !== V().util.norm(actual || '');
        if (cambioDeFondo) V().reframe(patch);
        else V().patchCore(patch);
        UI.closeSheet();
        w.Sound.coin();
        UI.toast('Actualizado', 'green', '💾');
        UI.Router.refresh();
        // Si el negocio ahora parece otro, se PREGUNTA. Nunca se le cambia la
        // apariencia por debajo a alguien que solo corrigió una errata.
        if (cambioDeFondo) revisarApariencia();
      } })
    ]);
  }

  /* ==================================================================
     "TU NEGOCIO CAMBIÓ, ¿ACTUALIZO TAMBIÉN LA APARIENCIA?"
     ================================================================== */

  function revisarApariencia() {
    if (!w.Persona) return;
    w.Persona.revisar().then(function (prop) {
      if (prop) proponerSheet(prop);
    }).catch(function () { /* silencioso: es una mejora, no una función */ });
  }

  function proponerSheet(prop) {
    var C2 = w.CONFIG;
    var sec = (C2.SECTORS.filter(function (x) { return x.key === prop.sector; })[0] || {});
    var voz = (C2.PERSONALIDADES.filter(function (x) { return x.key === prop.brandVoice; })[0] || {});
    var tema = (C2.TEMAS.filter(function (x) { return x.key === prop.tema; })[0] || {});

    var lineas = [];
    if (sec.title) lineas.push('Sector: ' + sec.emoji + ' ' + sec.title);
    if (prop.subtipo) lineas.push('Lo describiría como: ' + prop.subtipo);
    if (voz.title) lineas.push('Personalidad: ' + voz.emoji + ' ' + voz.title);
    if (tema.title) lineas.push('Apariencia: ' + tema.emoji + ' ' + tema.title);

    UI.sheet([
      el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('h2', { class: 'h4', text: 'Tu negocio ya no es el mismo' }),
          el('div', { class: 'small', style: { marginTop: '6px' },
            text: 'Por lo que acabas de escribir, así lo entendería a partir de ahora. ' +
                  'Tú decides: nada cambia hasta que lo aceptes.' })
        ])
      ]),
      // Vista previa teñida con el tema propuesto, sin tocar el resto de la app.
      el('div', { class: 'neg-preview', data: { negocio: prop.tema || 'generico' } }, [
        el('div', { class: 'neg-preview__hero' }, [
          el('h3', { text: V().terms().negocio }),
          el('p', { text: sec.title || 'Sin clasificar' })
        ]),
        el('div', { class: 'col', style: { gap: '4px', marginTop: '12px' } },
          lineas.map(function (l) { return el('div', { class: 'small', text: '· ' + l }); }))
      ]),
      prop.fuente === 'ia'
        ? UI.chip('Propuesto por la IA · confianza ' + Math.round(prop.confianza * 100) + '%', 'purple', '✨')
        : null,
      UI.btn('Sí, actualiza la apariencia', {
        variant: 'brand', size: 'lg',
        onClick: function () {
          w.Persona.aceptarPropuesta();
          UI.closeSheet();
          w.Sound.complete();
          UI.toast('Apariencia actualizada', 'green', '🎨');
          UI.Router.refresh();
        }
      }),
      UI.btn('No, déjala como está', {
        variant: 'ghost',
        onClick: function () {
          w.Persona.descartarPropuesta();
          UI.closeSheet();
          UI.toast('Se quedó como estaba', 'blue', '👌');
        }
      }),
      el('div', { class: 'tiny t-center', style: { textTransform: 'none', letterSpacing: '0' },
        text: 'Puedes cambiarla cuando quieras en Personalizar mi experiencia.' })
    ]);
  }

  function editChoice(key) {
    var conf = OPCIONES[key];
    var opts = C[conf.list];
    var v = V().active();
    var actual = conf.path ? v.core.resources[conf.path.split('.')[1]] : v.core[key];

    var list = el('div', { class: 'col', style: { gap: '10px' } });
    opts.forEach(function (o) {
      list.appendChild(el('button', {
        class: 'opt' + (actual === o.key ? ' is-selected' : ''), type: 'button',
        onclick: function () {
          var patch = {};
          patch[conf.path || key] = o.key;
          V().patchCore(patch);
          // Cambiar de sector arrastra el tema, pero solo si lo había elegido
          // la app. Si el usuario escogió uno a mano, se respeta.
          var cambio = key === 'sector' && w.Persona ? w.Persona.sincronizarTema() : false;
          w.Sound.select();
          UI.closeSheet();
          UI.toast(cambio ? 'Sector y apariencia actualizados' : 'Actualizado', 'green', cambio ? '🎨' : '💾');
          UI.Router.refresh();
        }
      }, [
        el('span', { class: 'opt__emoji', text: o.emoji }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: o.title }),
          el('span', { class: 'opt__hint', text: o.sub || o.ex || '' })
        ])
      ]));
    });
    UI.sheet([el('h2', { class: 'h3', text: conf.label }), list]);
  }

  /* ==================================================================
     REGISTRAR UNA IDEA NUEVA
     ================================================================== */

  function reregister() {
    UI.confirm({
      title: '¿Registrar una idea nueva?',
      text: 'Se reemplaza el perfil de tu emprendimiento actual: idea, clientes, decisiones y plan.\n\n' +
            '**Tu XP, tu racha, tus insignias, tus lecciones y tu expediente NO se borran.**',
      ok: 'Sí, registrar otra idea', cancel: 'Mejor no', mood: 'think'
    }).then(function (yes) {
      if (!yes) return;
      w.Onboarding.relaunch();
    });
  }

  UI.Router.register('venture', render);
  w.VentureScreen = { open: function () { UI.Router.go('venture'); }, editField: editField };
})(window, document);
