/* ==========================================================================
   ONBOARDING — bienvenida, diagnóstico y generación de la ruta
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  var draft = {};
  var STEPS = ['goal', 'knowledge', 'time', 'budget', 'sector', 'name'];

  /* --------------------------- SPLASH --------------------------- */

  function splash() {
    var root = el('div', { class: 'splash' }, [
      el('div', { class: 'mascot mascot--xl', html: w.Mascot.svg('happy') }),
      el('div', { class: 'col', style: { gap: '6px', alignItems: 'center' } }, [
        el('h1', { class: 'splash__logo', text: 'Modo Emprendedor' }),
        el('div', { class: 'splash__tag', html: 'Aprende. <b>Construye.</b> Vende.' })
      ]),
      el('p', { class: 'p', style: { maxWidth: '330px' },
        html: 'No es un curso. Es una <b>misión al día</b> para pasar de una idea a un negocio real.' }),
      el('div', { class: 'col', style: { width: '100%', maxWidth: '330px', gap: '10px', marginTop: '8px' } }, [
        UI.btn('Empezar', { variant: 'brand', size: 'lg', shiny: true, onClick: function () { go(0); } }),
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
        text: 'Cada lección termina en una misión que aplicas a tu negocio, y cada nivel cierra con un reto que haces en el mundo real.' })
    ]);
    return root;
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

  /* --------------------------- PREGUNTAS --------------------------- */

  var QUESTIONS = {
    goal: {
      step: 'Punto de partida',
      q: '¿Dónde estás hoy?',
      sub: 'No hay respuesta mala. Solo cambia por dónde empiezas.',
      opts: C.GOALS
    },
    knowledge: {
      step: 'Experiencia',
      q: '¿Cuánto has vendido antes?',
      sub: 'Con esto ajusto la profundidad de las lecciones.',
      opts: C.KNOWLEDGE
    },
    time: {
      step: 'Tiempo',
      q: '¿Cuánto tiempo tienes al día?',
      sub: 'Define tu meta diaria de XP. Puedes cambiarla después.',
      opts: C.TIMES
    },
    budget: {
      step: 'Presupuesto',
      q: '¿Cuánto puedes invertir hoy?',
      sub: 'Sin trampa: si es cero, empezamos igual. Validar cuesta tiempo, no dinero.',
      opts: C.BUDGETS
    },
    sector: {
      step: 'Sector',
      q: '¿Qué tipo de negocio te interesa?',
      sub: 'Los ejemplos y las misiones se adaptarán a esto.',
      opts: C.SECTORS
    }
  };

  function go(i) {
    UI.Router.go('onboarding', { step: i }, i === 0 ? null : 'fwd');
  }

  function render(params) {
    var i = params.step == null ? -1 : params.step;
    if (i < 0) return splash();
    if (i >= STEPS.length) return generating();

    var key = STEPS[i];
    if (key === 'name') return nameStep(i);

    var q = QUESTIONS[key];
    var root = el('div', { class: 'screen' });

    root.appendChild(head(i));
    root.appendChild(el('div', { class: 'ob-q' }, [
      el('div', { class: 'ob-q__step', text: q.step }),
      el('div', { class: 'ob-mascot-row' }, [
        el('div', { class: 'mascot', html: w.Mascot.svg(i === 0 ? 'happy' : 'neutral') }),
        el('div', { class: 'speech' }, [
          el('h1', { class: 'h4', text: q.q }),
          el('div', { class: 'small', style: { marginTop: '4px' }, text: q.sub })
        ])
      ])
    ]));

    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });
    q.opts.forEach(function (o) {
      var selected = draft[key] === o.key;
      var btn = el('button', {
        class: 'opt opt--card' + (selected ? ' is-selected' : ''),
        type: 'button',
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

  function head(i) {
    var bar = UI.pbar((i / (STEPS.length + 1)) * 100, 'brand');
    return el('div', { class: 'row', style: { gap: '12px', marginBottom: '4px' } }, [
      i > 0 ? UI.backBtn(function () { go(i - 1); }) : el('div', { style: { width: '6px' } }),
      bar
    ]);
  }

  function nameStep(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));

    var isBiz = draft.goal === 'business';
    var input = el('input', {
      class: 'input', type: 'text', maxlength: '48',
      placeholder: isBiz ? 'Bazar 3D' : 'Aún no tiene nombre',
      value: w.Store.state.profile.businessName || ''
    });
    var idea = el('textarea', {
      class: 'textarea', maxlength: '260',
      placeholder: draft.goal === 'zero'
        ? 'Todavía no tengo idea. Me interesa algo relacionado con…'
        : 'Vendo piezas de repuesto impresas en 3D para electrodomésticos descontinuados…'
    });
    idea.value = w.Store.state.profile.idea || '';

    var nameField = el('input', {
      class: 'input', type: 'text', maxlength: '24',
      placeholder: 'Tu nombre',
      value: w.Store.state.profile.name === 'Emprendedor' ? '' : w.Store.state.profile.name
    });

    root.appendChild(el('div', { class: 'ob-q' }, [
      el('div', { class: 'ob-q__step', text: 'Último paso' }),
      el('div', { class: 'ob-mascot-row' }, [
        el('div', { class: 'mascot', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('h1', { class: 'h4', text: 'Cuéntame de ti' }),
          el('div', { class: 'small', style: { marginTop: '4px' },
            text: 'Con esto personalizo los ejemplos y las misiones.' })
        ])
      ])
    ]));

    root.appendChild(el('div', { class: 'col stagger', style: { gap: '16px' } }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: '¿Cómo te llamas?' }), nameField
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: isBiz ? '¿Cómo se llama tu negocio?' : 'Nombre de tu proyecto (si ya tienes uno)' }),
        input
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: draft.goal === 'zero' ? '¿Qué te llama la atención?' : 'Describe tu idea o negocio en una frase' }),
        idea,
        el('span', { class: 'field__hint', text: 'Puedes cambiarlo cuando quieras desde Mi Negocio.' })
      ])
    ]));

    root.appendChild(el('div', { class: 'col', style: { marginTop: 'auto', paddingTop: '20px' } }, [
      UI.btn('Crear mi ruta', {
        variant: 'brand', size: 'lg', shiny: true,
        onClick: function () {
          draft.name = (nameField.value || '').trim() || 'Emprendedor';
          draft.businessName = (input.value || '').trim();
          draft.idea = (idea.value || '').trim();
          go(STEPS.length);
        }
      })
    ]));
    return root;
  }

  /* --------------------------- GENERANDO --------------------------- */

  function generating() {
    var root = el('div', { class: 'screen screen--center' });
    var mascot = el('div', { class: 'mascot mascot--lg is-think', html: w.Mascot.svg('think') });
    var title = el('h1', { class: 'h3', text: 'Diseñando tu ruta…' });
    var wrap = el('div', { class: 'route-anim', style: { maxWidth: '340px', marginTop: '18px' } });

    root.appendChild(mascot);
    root.appendChild(title);
    root.appendChild(el('p', { class: 'small', style: { maxWidth: '300px' },
      text: 'Cruzando tu punto de partida, tu experiencia, tu tiempo y tu presupuesto.' }));
    root.appendChild(wrap);

    var goalLabel = (C.GOALS.filter(function (g) { return g.key === draft.goal; })[0] || {}).title || '';
    var sectorLabel = (C.SECTORS.filter(function (s) { return s.key === draft.sector; })[0] || {}).title || '';
    var steps = [
      { ico: '🎯', t: 'Punto de partida: ' + goalLabel },
      { ico: '🧰', t: 'Sector: ' + sectorLabel },
      { ico: '⏱️', t: 'Meta diaria: ' + goalXP(draft.time) + ' XP (' + draft.time + ' min)' },
      { ico: '🗺️', t: 'Ruta de ' + C.LEVELS.length + ' niveles: ' + w.LESSONS.length +
                       ' lecciones + ' + C.BOSSES.length + ' retos reales' },
      { ico: '🚀', t: 'Primera lección seleccionada' }
    ];

    steps.forEach(function (s, i) {
      var line = el('div', { class: 'route-line', style: { animationDelay: (i * 0.42 + 0.15) + 's' } }, [
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
      }, i * 420 + 900);
    });

    setTimeout(function () {
      w.Mascot.setMood(mascot, 'party');
      title.textContent = '¡Tu ruta está lista!';
      w.Sound.complete();
      w.FX.celebrate();
      root.appendChild(el('div', { class: 'col', style: { width: '100%', maxWidth: '340px', marginTop: '22px' } }, [
        UI.btn('Comenzar mi primera misión', {
          variant: 'brand', size: 'lg', shiny: true, onClick: finish
        })
      ]));
    }, steps.length * 420 + 1300);

    return root;
  }

  function goalXP(min) {
    if (min <= 10) return 20;
    if (min <= 20) return 40;
    return 70;
  }

  function finish() {
    w.Store.set(function (s) {
      s.onboarded = true;
      s.profile.goal = draft.goal;
      s.profile.knowledge = draft.knowledge;
      s.profile.time = draft.time;
      s.profile.budget = draft.budget;
      s.profile.sector = draft.sector;
      s.profile.name = draft.name || 'Emprendedor';
      s.profile.businessName = draft.businessName || '';
      s.profile.idea = draft.idea || '';
      s.dailyGoal = goalXP(draft.time);
      if (draft.idea) {
        s.dossier.idea = { answers: { idea: draft.idea }, score: 40, at: Date.now(), from: 'onboarding' };
      }
    }, 'onboard');

    w.Store.set(function (s) { s.startIndex = w.Engine.recommendedStart(); }, 'route');
    w.Engine.touchDay();
    w.App.showChrome(true);
    UI.Router.go('home', {}, 'none');
    setTimeout(function () {
      UI.toast('Tu ruta personalizada está lista', 'green', '🗺️', 3200);
    }, 500);
  }

  UI.Router.register('onboarding', render);
  w.Onboarding = { splash: splash };
})(window, document);
