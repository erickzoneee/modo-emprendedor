/* ==========================================================================
   REGISTRO DEL EMPRENDIMIENTO — bienvenida, idea y ruta personalizada

   No es un diagnóstico: es el registro de la idea del usuario. Todo lo que se
   captura aquí se convierte en el "Perfil del emprendimiento" y pasa a ser el
   contexto de TODA la app (lecciones, desafíos, mentor, planes y paneles).

   CUATRO PREGUNTAS Y UN "ESTO ENTENDÍ"
   Antes eran siete preguntas y dos repreguntas, todas escribiendo. Ahora son
   cuatro —idea, sector, cliente y etapa— y ninguna obliga a teclear: se
   contestan hablando o tocando. Lo demás (la oferta, el objetivo, el
   presupuesto, el tiempo, la experiencia) no ha desaparecido: lo pregunta
   Chispa poco a poco, una por lección, desde js/core/captura.js.

   El motivo no es de diseño, es de producto: quien acaba de descargar la app
   no viene a rellenar un perfil, viene a ver si esto le sirve. Cuanto antes
   llegue a su primera lección, más probable es que llegue a la segunda.

   DÓNDE SE GUARDA
   El perfil se escribe al salir del cuarto paso, ANTES del "esto entendí". Así
   el resumen habla del emprendimiento de verdad y corregir algo desde ahí
   escribe en el sitio definitivo, no en un borrador que todavía puede perderse.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  var draft = {
    name: '',            // cómo se llama la persona (se pide al final, opcional)
    idea: '', customer: '', sector: '', stage: '',
    modos: {},           // id de pregunta -> con qué gesto la contestó
    saltadas: []
  };

  /* El sector va justo después de la idea: para entonces la app ya puede
     proponer uno en vez de preguntar en frío. */
  var STEPS = ['idea', 'sector', 'cliente', 'etapa', 'confirm'];

  /* Qué campo del borrador llena cada pregunta del catálogo. */
  var CAMPO = { idea: 'idea', sector: 'sector', cliente: 'customer', etapa: 'stage' };

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
        // Antes de la primera pregunta, la promesa: lo que va a contar en el
        // paso siguiente es su idea, y merece saber qué pasa con ella antes de
        // soltarla. Se enseña una sola vez en la vida; a partir de entonces
        // antesDeRegistrar() llama a go(0) directamente y no se nota.
        UI.btn('Registrar mi idea', { variant: 'brand', size: 'lg', shiny: true,
          onClick: function () { empezarRegistro(function () { go(0); }); } }),
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
        text: 'Son cuatro preguntas y se contestan hablando o tocando. A partir de ahí, cada lección y cada desafío hablan de TU negocio, no de un ejemplo cualquiera.' })
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
      // Comprueba tamaño, valida el contenido y pide confirmación enseñando
      // lo que trae. Antes se importaba a ciegas cualquier .json que parseara.
      w.App.restoreFromFile(input.files[0]);
    });
    d.body.appendChild(input);
    input.click();
    setTimeout(function () { input.remove(); }, 60000);
  }

  /* --------------------------- NAVEGACIÓN --------------------------- */

  /** Arranca el registro pasando antes por la promesa "Tu idea es tuya".
      Si promesa.js no hubiera cargado, el registro empieza igual: la ventana
      es un acompañamiento, no un requisito para poder emprender. */
  function empezarRegistro(despues) {
    if (w.Promesa) w.Promesa.antesDeRegistrar(despues);
    else despues();
  }

  function go(i) {
    UI.Router.go('onboarding', { step: i }, i === 0 ? null : 'fwd');
  }

  function render(params) {
    var i = params.step == null ? -1 : params.step;
    if (i < 0) return splash();
    if (i >= STEPS.length) return generating();

    if (STEPS[i] === 'confirm') return confirmar(i);
    return pregunta(i, STEPS[i]);
  }

  function head(i) {
    return el('div', { class: 'row', style: { gap: '12px', marginBottom: '4px' } }, [
      i > 0 ? UI.backBtn(function () { go(i - 1); }) : el('div', { style: { width: '6px' } }),
      UI.pbar((i / (STEPS.length + 1)) * 100, 'brand')
    ]);
  }

  /* --------------------------- LAS CUATRO PREGUNTAS ---------------------------

     Las cuatro se pintan con el mismo motor que usa el resto de la app
     (js/core/captura.js). Aquí no se decide cómo se contesta cada una: eso
     vive en js/data/preguntas.js, y cambiarlo es editar un objeto.
     ------------------------------------------------------------------------ */

  var HUMOR = { idea: 'happy', sector: 'neutral', cliente: 'think', etapa: 'neutral' };

  function pregunta(i, id) {
    var p = w.Captura.preg(id);
    if (!p) return el('div', { class: 'screen', text: 'Pregunta no encontrada' });

    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));

    // El sector no se pregunta en frío: con la idea ya escrita se propone uno
    // y el usuario confirma o corrige. "otro" no se preselecciona nunca —
    // es el resultado de no haber encontrado nada, y aceptarlo sin mirar
    // dejaría el negocio sin clasificar para siempre.
    if (id === 'sector' && !draft.sector) {
      var guess = '';
      try {
        guess = w.Venture.guessSector({
          core: { idea: draft.idea, offer: '', customer: draft.customer }
        });
      } catch (e) { guess = ''; }
      if (guess && guess !== 'otro') draft.sector = guess;
    }

    root.appendChild(w.Captura.bloque(p, {
      mood: HUMOR[id] || 'neutral',
      valor: draft[CAMPO[id]] || '',
      onListo: function (valor, modo) {
        draft[CAMPO[id]] = valor;
        draft.modos[id] = modo;
        avanzar(i);
      },
      onSaltar: function () {
        if (draft.saltadas.indexOf(id) < 0) draft.saltadas.push(id);
        avanzar(i);
      }
    }));

    return root;
  }

  /** Al salir de la última pregunta se escribe el perfil, para que el resumen
      de la pantalla siguiente hable del emprendimiento de verdad. */
  function avanzar(i) {
    if (STEPS[i + 1] === 'confirm') save();
    go(i + 1);
  }

  /* --------------------------- ESTO ENTENDÍ --------------------------- */

  function confirmar(i) {
    var root = el('div', { class: 'screen' });
    root.appendChild(head(i));

    root.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('happy') }),
      el('div', { class: 'speech' }, [
        el('div', { class: 'small', text: 'Ya te conozco un poco. A ver si le atiné.' })
      ])
    ]));

    root.appendChild(w.Captura.tarjetaEntiendo());

    /* El nombre de la persona se pide aquí y no en la primera pantalla: al
       principio es una barrera antes de la idea; aquí es el gesto natural de
       presentarse cuando ya os habéis contado algo. */
    var yo = el('input', { class: 'input', type: 'text', maxlength: '24', placeholder: 'Tu nombre (opcional)' });
    yo.value = draft.name;
    yo.addEventListener('input', function () {
      draft.name = yo.value;
      w.Store.set(function (s) {
        s.profile.name = (draft.name || '').trim() || 'Emprendedor';
      }, 'onboard-nombre');
    });
    root.appendChild(el('div', { class: 'field', style: { marginTop: '16px' } }, [
      el('label', { class: 'field__label', text: '¿Cómo te llamo?' }), yo
    ]));

    root.appendChild(w.Captura.accionesEntiendo({
      onSi: function () { go(STEPS.length); },
      onDuda: function () { go(STEPS.length); },
      onCorregido: function () { UI.Router.refresh(); }
    }));

    root.appendChild(el('div', { class: 'tiny t-center', style: { textTransform: 'none', letterSpacing: '0', marginTop: '12px' },
      text: 'Lo que falte lo voy aprendiendo por el camino, una pregunta cada vez. Nunca te preguntaré dos veces lo mismo.' }));

    return root;
  }

  /* --------------------------- GENERANDO --------------------------- */

  function generating() {
    var t = w.Venture.terms();
    var root = el('div', { class: 'screen screen--center' });
    var mascot = el('div', { class: 'mascot mascot--lg is-think', html: w.Mascot.svg('think') });
    var title = el('h1', { class: 'h3', text: 'Diseñando tu ruta…' });
    var wrap = el('div', { class: 'route-anim', style: { maxWidth: '340px', marginTop: '18px' } });

    root.appendChild(mascot);
    root.appendChild(title);
    root.appendChild(el('p', { class: 'small', style: { maxWidth: '300px' },
      text: 'Cruzando tu idea, tus clientes y tu etapa.' }));
    root.appendChild(wrap);

    var steps = [
      { ico: '💡', t: 'Idea registrada: ' + w.Venture.util.shorten(t.idea, 34) },
      { ico: '🎯', t: 'Clientes: ' + w.Venture.util.shorten(t.cliente, 34) },
      { ico: '📍', t: 'Etapa: ' + t.etapaCorta },
      /* Los minutos al día ya no se preguntan al entrar: los aprende Chispa
         después. Anunciar aquí un "20 min" que nadie ha dicho sería inventar
         un dato en la pantalla que presume de estar hecha con los suyos. */
      { ico: '⏱️', t: 'Meta diaria: ' + w.Store.state.dailyGoal + ' XP' +
                      (t.minutos ? ' (' + t.minutos + ' min)' : '') },
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

  /* --------------------------- GUARDADO --------------------------- */

  /** Escribe el perfil del emprendimiento y espeja el perfil antiguo.
      Idempotente a propósito: se llama al entrar en el "esto entendí", y
      volver atrás y avanzar otra vez tiene que dejar lo mismo, no duplicar. */
  var guardado = false;

  function save() {
    if (!guardado) {
      w.Venture.startOver();          // perfil limpio para la idea nueva
      guardado = true;
    }

    w.Venture.patchCore({
      idea: (draft.idea || '').trim(),
      customer: (draft.customer || '').trim(),
      sector: draft.sector || '',
      stage: draft.stage || 'idea'
    });

    /* Se apunta lo que ya se preguntó para que la captura progresiva no
       vuelva a preguntarlo, y lo que el usuario prefirió no contestar para
       que no reaparezca mañana. */
    w.Venture.set(function (vv) {
      if (!vv.intake.respuestas) vv.intake.respuestas = {};
      Object.keys(CAMPO).forEach(function (id) {
        if (vv.intake.asked.indexOf(id) < 0) vv.intake.asked.push(id);
        if (draft.modos[id]) {
          vv.intake.respuestas[id] = { v: draft[CAMPO[id]], modo: draft.modos[id], at: Date.now() };
        }
      });
      vv.intake.skipped = draft.saltadas.map(function (id) { return { id: id, at: Date.now() }; });
      vv.intake.done = true;
    }, 'venture-intake');

    // Perfil antiguo: la ruta, la liga y la barra superior siguen leyéndolo.
    w.Store.set(function (s) {
      s.profile.name = (draft.name || '').trim() || 'Emprendedor';
      s.profile.idea = (draft.idea || '').trim();
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
      idea: '', customer: '', sector: '', stage: '',
      modos: {}, saltadas: []
    };
    guardado = false;
    // La promesa va antes de esconder la barra y de cambiar de pantalla: así
    // se ve sobre el sitio del que viene el usuario y no sobre un hueco.
    empezarRegistro(function () {
      w.App.showChrome(false);
      UI.Router.go('onboarding', { step: 0 }, 'fwd');
    });
  }

  UI.Router.register('onboarding', render);
  w.Onboarding = { splash: splash, relaunch: relaunch };
})(window, document);
