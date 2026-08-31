/* ==========================================================================
   LECCIÓN — reproductor con 9 tipos de ejercicio + resultados
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  var S = null; // estado de la sesión

  /* ==================================================================
     ARRANQUE
     ================================================================== */

  function render(params) {
    var lesson = w.Engine.lessonById(params.id);
    if (!lesson) return el('div', { class: 'screen', text: 'Lección no encontrada' });

    S = {
      lesson: lesson,
      seq: buildSequence(lesson),
      i: 0,
      errors: 0,
      correct: 0,
      answered: 0,
      xp: 0,
      startedAt: Date.now(),
      current: null,
      phase: 'answer'
    };

    var root = el('div', { class: 'col', style: { minHeight: '100%', position: 'relative', gap: '0' } });
    root.appendChild(el('h1', { class: 'sr-only', text: 'Lección: ' + lesson.title }));
    root.appendChild(topBar());
    var body = el('div', { class: 'lesson-body', id: 'lesson-body' });
    root.appendChild(body);
    root.appendChild(footer());
    setTimeout(function () { paint(); }, 30);
    return root;
  }

  function buildSequence(lesson) {
    var seq = [{ type: 'concept' }];
    if (lesson.cas) seq.push({ type: 'case' });
    // El caso de ejemplo es de otro negocio; este paso lo traduce al del usuario
    // antes de que empiecen los ejercicios.
    if (w.Personalize.example(lesson)) seq.push({ type: 'apply' });
    lesson.steps.forEach(function (st) { seq.push(st); });
    seq.push({ type: 'done' });
    return seq;
  }

  /* ==================================================================
     CROMO SUPERIOR / INFERIOR
     ================================================================== */

  function topBar() {
    var bar = UI.pbar(0, 'green');
    bar.id = 'lesson-bar';
    var hearts = el('div', { class: 'stat stat--heart', id: 'lesson-hearts' }, [
      el('span', { class: 'stat__icon', text: '❤️' }),
      el('span', { text: String(w.Store.state.hearts) })
    ]);
    return el('div', { class: 'lesson-top' }, [
      UI.closeBtn(confirmExit),
      bar,
      hearts
    ]);
  }

  function footer() {
    var f = el('div', { class: 'lesson-foot', id: 'lesson-foot' });
    f.appendChild(el('div', { id: 'foot-msg' }));
    /* El botón principal lleva id propio y se busca por él. Antes se cogía
       "el primer .btn del pie", que funcionó mientras fue el único: al añadir
       "Explicar mi error" dentro de #foot-msg —que va delante en el DOM— la
       búsqueda empezó a devolver ESE, y el pie del ejercicio siguiente
       arrancaba en rojo, habilitado y avanzando al pulsarlo. */
    f.appendChild(el('div', { class: 'row', style: { gap: '10px' } }, [
      el('button', {
        class: 'icon-btn', id: 'hint-btn', type: 'button', hidden: true,
        'aria-label': 'Usar una pista para descartar una opción incorrecta',
        style: { width: 'auto', minWidth: '52px', padding: '0 14px', height: '58px', borderRadius: 'var(--r-lg)',
                 fontSize: 'var(--fs-md)', fontWeight: '900', gap: '5px', flex: 'none',
                 display: 'flex', alignItems: 'center', justifyContent: 'center' },
        onclick: useHint
      }, [el('span', { text: '💡' }), el('span', { id: 'hint-count' })]),
      UI.btn('Continuar', { variant: 'green', size: 'lg', block: true, onClick: onPrimary, id: 'foot-primary' })
    ]));
    return f;
  }

  /* ---------- Pistas ---------- */

  function updateHintBtn() {
    var hb = d.getElementById('hint-btn');
    if (!hb) return;
    var disponible = !!(S.current && S.current.hint) && S.phase === 'answer' && w.Store.state.hints > 0;
    hb.hidden = !disponible;
    var c = d.getElementById('hint-count');
    if (c) c.textContent = String(w.Store.state.hints);
  }

  function useHint() {
    if (!S.current || !S.current.hint) return;
    if (w.Store.state.hints <= 0) {
      UI.toast('No te quedan pistas. Consigue más en la tienda.', 'gold', '💡');
      return;
    }
    var descartada = S.current.hint();
    if (!descartada) {
      UI.toast('Aquí ya no puedo descartar más opciones', 'blue', '💡');
      return;
    }
    w.Store.set(function (s) { s.hints = Math.max(0, s.hints - 1); }, 'hint');
    w.Sound.select();
    w.Sound.buzz(14);
    updateHintBtn();
  }

  /** Descarta visualmente una opción incorrecta que siga activa. */
  function descartarIncorrecta(list, esCorrecta, alDeseleccionar) {
    var botones = UI.qsa('.opt', list);
    for (var i = 0; i < botones.length; i++) {
      if (esCorrecta(i)) continue;
      if (botones[i].classList.contains('is-dim')) continue;
      botones[i].classList.add('is-dim');
      botones[i].classList.remove('is-selected');
      botones[i].disabled = true;
      botones[i].style.pointerEvents = 'none';
      if (alDeseleccionar) alDeseleccionar(i);
      return true;
    }
    return false;
  }

  function setFoot(state, opts) {
    var f = d.getElementById('lesson-foot');
    var msg = d.getElementById('foot-msg');
    var btn = d.getElementById('foot-primary');
    f.classList.remove('is-ok', 'is-ko');
    UI.clear(msg);

    if (state === 'ok' || state === 'ko') {
      f.classList.add(state === 'ok' ? 'is-ok' : 'is-ko');
      var leerFeedback = function () {
        var partes = [opts.title];
        if (opts.text) partes.push(opts.text);
        // Solo se lee lo que está a la vista. Al fallar, el desglose vive
        // ahora detrás de «Explicar mi error»: leerlo en alto sin que nadie lo
        // haya pedido devolvería por el oído la avalancha que se quitó de la
        // pantalla, y encima sin poder mirarla mientras suena.
        if (state === 'ok') {
          (opts.details || []).forEach(function (x) {
            partes.push((x.ok ? 'Correcta: ' : 'Incorrecta: ') + x.t + (x.why ? '. ' + x.why : ''));
          });
        }
        return partes;
      };

      msg.appendChild(el('div', { class: 'lesson-foot__msg' }, [
        el('span', { class: 'lesson-foot__ico', text: opts.icon || (state === 'ok' ? '🎉' : '💡') }),
        el('div', { class: 'grow', style: { minWidth: '0' } }, [
          el('div', { class: 'lesson-foot__t', text: opts.title }),
          opts.text ? el('div', { class: 'lesson-foot__p', html: UI.rich(opts.text) }) : null
        ]),
        speakBtn(leerFeedback, { small: true })
      ]));
      /* Al acertar, el desglose completo se queda a la vista: no hay error que
         procesar y saber por qué las otras no valían es la mitad del aprendizaje.

         Al fallar es distinto. Volcar aquí las cuatro opciones con su razón
         llenaba la pantalla justo en el momento de más carga mental, obligaba a
         desplazarse y rompía el ritmo. Ahora se ofrece, no se impone — y solo
         si de verdad hay algo que contar: de los 248 ejercicios de tipo `multi`
         ninguno tiene razones escritas, y en tf, order, match y fill no existe
         el desglose. Un botón que abre un panel vacío es peor que no tenerlo. */
      if (opts.details && opts.details.length) {
        if (state === 'ok') msg.appendChild(whyList(opts.details));
        else if (hayPorQue(opts.details)) msg.appendChild(botonExplicar(opts));
      }
      if (w.Speech && w.Speech.canAuto()) w.Speech.autoSpeak(leerFeedback());
    }
    btn.className = 'btn btn--block btn--lg ' + (state === 'ko' ? 'btn--red' : 'btn--green');
    btn.querySelector('span:last-child').textContent = opts && opts.label ? opts.label : 'Continuar';
    btn.disabled = !!(opts && opts.disabled);

    reserveFootSpace();
  }

  /** El pie es sticky: al crecer con la retroalimentación, el contenido de
      arriba se desplaza por debajo y la última opción quedaba tapada sin forma
      de verla. Se le reserva al cuerpo tanto espacio como ocupe el pie. */
  function reserveFootSpace() {
    aplicarReserva();
    // Segunda pasada por si el alto cambia al asentarse la tipografía o al
    // abrirse el desglose. Con timeout, no con rAF: en una pestaña que no está
    // componiendo (segundo plano) los rAF no llegan y el hueco no se aplicaría.
    setTimeout(aplicarReserva, 60);
  }

  function aplicarReserva() {
    var foot = d.getElementById('lesson-foot');
    var body = d.getElementById('lesson-body');
    if (!foot || !body || !foot.isConnected || !body.isConnected) return;
    body.style.paddingBottom = (foot.offsetHeight + 16) + 'px';
  }

  /* ==================================================================
     EXPLICACIÓN PROGRESIVA DEL ERROR

     La corrección breve va en el pie y se entiende en dos segundos. Lo hondo
     —qué elegiste, por qué no encaja, por qué la otra sí, qué principio hay
     detrás y cómo se aplica a tu negocio— espera detrás de un botón.

     Nada de esto se pierde: es el mismo `details` que antes se volcaba entero
     en el pie. Solo cambió el momento en que aparece.
     ================================================================== */

  /** ¿Hay razones escritas de verdad, o solo etiquetas de opción? */
  function hayPorQue(details) {
    for (var i = 0; i < details.length; i++) {
      if (details[i].why && String(details[i].why).trim()) return true;
    }
    return false;
  }

  function botonExplicar(opts) {
    return el('div', { class: 'lesson-foot__mas' }, [
      UI.btn('Explicar mi error', {
        variant: 'ghost', size: 'sm', block: false, silent: true,
        onClick: function () { explicarError(opts); }
      })
    ]);
  }

  /** Panel hondo. No toca S.phase ni el progreso: el ejercicio sigue donde
      estaba y «Entendido» continúa igual al cerrar. */
  function explicarError(opts) {
    var det = opts.details || [];
    /* `pick` y `ok` NO son excluyentes. En los sliders el usuario cae dentro de
       una banda que puede estar marcada como correcta a medias, y filtrar por
       `pick && !ok` dejaba el panel sin «Elegiste» y llamaba «También era
       correcta» a la banda que acababa de fallar. Se toma lo elegido tal cual
       y se decide el tono comparándolo con la correcta. */
    var elegida = det.filter(function (x) { return x.pick; })[0];
    var correcta = det.filter(function (x) { return x.ok; })[0];
    var elegidaEsCorrecta = !!(elegida && elegida.ok);
    var otrasOk = det.filter(function (x) { return x.ok && x !== correcta; });
    // Las incorrectas que el usuario NO eligió: su razón también estaba escrita
    // y antes se mostraba. Va al final del panel para no competir con lo suyo.
    var otrasKo = det.filter(function (x) {
      return !x.ok && x !== elegida && x.why && String(x.why).trim();
    });

    var partes = [];                       // lo que se leerá en voz alta
    var col = [];

    /* Chispa a 88 px y con cara de estar explicando, no de regañar. Es el
       momento en el que más falta hace que se note que hay alguien al lado. */
    col.push(el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--lg', style: { '--m-size': '88px' },
        html: w.Mascot.svg('think') }),
      el('div', { class: 'speech grow' }, [
        el('h2', { class: 'h4', text: 'Vamos a verlo' }),
        opts.text ? el('div', { class: 'small', style: { marginTop: '6px' }, html: UI.rich(opts.text) }) : null
      ])
    ]));
    partes.push('Vamos a verlo.');
    if (opts.text) partes.push(opts.text);

    function bloque(titulo, texto, tono) {
      if (!texto) return;
      partes.push(titulo + '. ' + texto);
      col.push(el('div', { class: 'exp' + (tono ? ' exp--' + tono : '') }, [
        el('div', { class: 'exp__t', text: titulo }),
        el('div', { class: 'exp__p', html: UI.rich(texto) })
      ]));
    }

    if (elegida) {
      var tono = elegidaEsCorrecta ? 'ok' : 'ko';
      bloque('Elegiste', elegida.t, tono);
      bloque(elegidaEsCorrecta ? 'Por qué no bastaba' : 'Por qué no encaja', elegida.why, tono);
    }
    if (correcta && correcta !== elegida) {
      bloque('La correcta era', correcta.t, 'ok');
      bloque('Por qué sí funciona', correcta.why, 'ok');
    }
    otrasOk.forEach(function (x) { bloque('También era correcta', x.t + (x.why ? ' — ' + x.why : ''), 'ok'); });

    /* El resto de opciones descartadas, con su razón. Estaban escritas y se
       veían antes en el desglose del pie; sin esto se perderían 139 de las 315
       explicaciones del temario, que es justo lo que este panel viene a
       conservar. */
    otrasKo.forEach(function (x) { bloque('Tampoco era', x.t + ' — ' + x.why, 'ko'); });

    /* Aplicado a SU negocio, con sus palabras. terms() ya trae los datos con
       banderas de existencia y con relleno neutro si faltan, así que aquí no
       se inventa nada: si no hay negocio registrado, este bloque no sale. */
    try {
      var t = w.Venture.terms();
      if (t.tiene.producto || t.tiene.cliente) {
        var linea = 'Piensa en ' + t.productoCorto +
          (t.tiene.cliente ? ' y en ' + t.clienteCorto : '') + ': lo mismo aplica ahí.';
        bloque('En ' + t.negocio, linea, null);
      }
    } catch (e) {}

    col.push(el('div', { class: 'row', style: { gap: '8px', justifyContent: 'center' } }, [
      speakBtn(function () { return partes; }, {})
    ]));

    col.push(UI.btn('Entendido', {
      variant: 'brand', size: 'lg',
      onClick: function () { UI.closeSheet(); }
    }));

    UI.sheet(col);
  }

  /** Desglose "por qué esta sí y las otras no".
      details: [{ ok:bool, t:'texto de la opción', why:'razón', pick:bool }] */
  function whyList(details) {
    var box = el('details', { class: 'why', open: true });
    var correctas = details.filter(function (x) { return x.ok; }).length;
    box.appendChild(el('summary', { class: 'why__sum',
      text: correctas > 1 ? 'Por qué esas son las correctas' : 'Por qué esa es la correcta' }));

    var list = el('ul', { class: 'why__list' });
    details.forEach(function (x) {
      list.appendChild(el('li', { class: 'why__item' + (x.ok ? ' is-ok' : ' is-ko') + (x.pick ? ' is-pick' : '') }, [
        el('span', { class: 'why__ico', text: x.ok ? '✅' : '✕' }),
        el('span', { class: 'why__body' }, [
          el('span', { class: 'why__t' }, [
            x.t,
            x.pick ? el('span', { class: 'why__tag', text: 'tu respuesta' }) : null
          ]),
          x.why ? el('span', { class: 'why__p', html: UI.rich(x.why) }) : null
        ])
      ]));
    });
    box.appendChild(list);
    return box;
  }

  function updateBar() {
    var bar = d.getElementById('lesson-bar');
    if (bar && bar.setFill) bar.setFill((S.i / (S.seq.length - 1)) * 100);
    var h = d.getElementById('lesson-hearts');
    if (h) {
      var span = h.querySelector('span:last-child');
      if (span && span.textContent !== String(w.Store.state.hearts)) {
        span.textContent = String(w.Store.state.hearts);
        h.classList.add('heart-break');
        setTimeout(function () { h.classList.remove('heart-break'); }, 620);
      }
    }
  }

  /* ==================================================================
     PINTAR PASO
     ================================================================== */

  function paint() {
    var body = d.getElementById('lesson-body');
    if (!body) return;
    UI.clear(body);
    body.style.paddingBottom = '';     // se recalcula al pintar el pie del paso nuevo
    updateBar();
    var step = S.seq[S.i];
    S.phase = 'answer';

    var built;
    switch (step.type) {
      case 'concept': built = viewConcept(); break;
      case 'case':    built = viewCase(); break;
      case 'apply':   built = viewApply(); break;
      case 'quiz':    built = exQuiz(step); break;
      case 'tf':      built = exTF(step); break;
      case 'multi':   built = exMulti(step); break;
      case 'order':   built = exOrder(step); break;
      case 'match':   built = exMatch(step); break;
      case 'fill':    built = exFill(step); break;
      case 'slider':  built = exSlider(step); break;
      case 'sim':     built = exSim(step); break;
      case 'write':   built = exWrite(step); break;
      case 'done':    return finish();
      default:        built = { node: el('div', { text: '…' }), check: null };
    }

    S.current = built;
    built.node.classList.add('anim-in');
    body.appendChild(built.node);
    // Cada paso empieza arriba: el pie es sticky y el contenido cambia de
    // altura, así que hay que insistir en los cuadros siguientes.
    UI.resetScroll();

    if (built.check) setFoot('idle', { label: built.label || 'Comprobar', disabled: !built.startEnabled });
    else setFoot('idle', { label: 'Continuar' });
    updateHintBtn();

    // Cambiar de paso corta la lectura anterior; luego, si procede, lee el nuevo.
    if (w.Speech && w.Speech.supported()) w.Speech.stop();
    autoRead(step);
  }

  function next() {
    S.i++;
    paint();
  }

  function enablePrimary(on, label) {
    var f = d.getElementById('lesson-foot');
    var btn = d.getElementById('foot-primary');
    btn.disabled = !on;
    if (label) btn.querySelector('span:last-child').textContent = label;
  }

  function onPrimary() {
    if (S.phase === 'answer' && S.current && S.current.check) {
      var res = S.current.check();
      if (res == null) return;
      S.phase = 'feedback';
      S.answered++;
      updateHintBtn();
      if (res.ok) {
        S.correct++;
        var gain = Math.max(4, Math.round(S.lesson.xp / S.lesson.steps.length));
        S.xp += gain;
        w.Sound.correct();
        w.Sound.buzz(20);
        w.FX.burst(d.getElementById('lesson-foot'), { count: 20, speed: 8, lift: 3 });
        setFoot('ok', {
          icon: pickPraise(),
          title: res.title || '¡Correcto!',
          text: res.explain,
          details: res.details,
          label: 'Continuar'
        });
      } else {
        S.errors++;
        var left = w.Engine.loseHeart();
        updateBar();
        setFoot('ko', {
          icon: '💡',
          title: res.title || 'Casi',
          text: res.explain,
          details: res.details,
          label: 'Entendido'
        });
        if (left <= 0) { setTimeout(noHearts, 900); }
      }
    } else {
      next();
    }
  }

  var PRAISE = ['🎉', '🔥', '💪', '⭐', '👏', '🚀', '💎'];
  function pickPraise() { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; }

  /* ==================================================================
     VISTAS DE CONTENIDO
     ================================================================== */

  function viewConcept() {
    var l = S.lesson;
    var escuchar = speakBtn(function () {
      return [l.concept.title].concat(l.concept.body || []).concat(l.concept.keys || []);
    }, { text: 'Escuchar' });

    var node = el('div', { class: 'col stagger' }, [
      el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot', html: w.Mascot.svg('happy') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'h4', text: l.title })
        ])
      ]),
      escuchar ? el('div', { class: 'row', style: { gap: '8px' } }, [escuchar]) : null,
      el('div', { class: 'concept-card' }, [
        el('div', { class: 'concept-card__tag', text: l.concept.tag || 'Concepto' }),
        el('h2', { class: 'h3', text: l.concept.title }),
        UI.frag(l.concept.body.map(function (p) { return el('p', { html: UI.rich(p) }); })),
        el('div', { class: 'keys' }, l.concept.keys.map(function (k) {
          return el('div', { class: 'key-row' }, [
            el('span', { class: 'key-row__ico', text: '✅' }),
            el('span', { html: UI.rich(k) })
          ]);
        }))
      ])
    ]);
    return { node: node, check: null };
  }

  /** "Aplicado a tu idea": el concepto llevado al negocio real del usuario. */
  function viewApply() {
    var lesson = S.lesson;
    var ej = w.Personalize.example(lesson);
    var t = w.Venture.terms();

    var texto = el('p', { style: { marginTop: '8px' }, html: UI.rich(ej ? ej.text : '') });
    // El color por clase, no en línea: así el tema del negocio puede alcanzarlo.
    var tag = el('div', { class: 'tiny neg-aplica__k',
      text: ej && ej.ia ? 'Aplicado a tu idea ✨' : 'Aplicado a tu idea' });

    var node = el('div', { class: 'col stagger' }, [
      el('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: 'Esto es lo que significa para ' + t.negocio + '.' })
        ])
      ]),
      el('div', { class: 'concept-card neg-aplica' }, [
        tag,
        el('h2', { class: 'h4', style: { marginTop: '4px' }, text: t.tiene.producto ? t.negocio : 'Tu negocio' }),
        texto
      ]),
      (function () {
        var b = speakBtn(function () { return texto.textContent; }, { text: 'Escuchar' });
        return b ? el('div', { class: 'row', style: { gap: '8px' } }, [b]) : null;
      })()
    ]);

    w.Personalize.upgrade(w.Personalize.exampleAI(lesson), function (txt) {
      texto.innerHTML = UI.rich(txt);
      tag.textContent = 'Aplicado a tu idea ✨';
    });

    return { node: node, check: null };
  }

  function viewCase() {
    var c = S.lesson.cas;
    var escuchar = speakBtn(function () { return [c.title, c.text]; }, { text: 'Escuchar' });
    var node = el('div', { class: 'col stagger' }, [
      el('div', { class: 'case-card' }, [
        el('div', { class: 'case-card__head' }, [
          el('span', { class: 'case-card__emoji', text: c.emoji }),
          el('div', [
            el('div', { class: 'tiny', style: { color: 'var(--blue-dark)' }, text: 'Caso real' }),
            el('h2', { class: 'case-card__t', text: c.title })
          ])
        ]),
        el('p', { html: UI.rich(c.text) })
      ]),
      escuchar ? el('div', { class: 'row', style: { gap: '8px' } }, [escuchar]) : null
    ]);
    return { node: node, check: null };
  }

  /* ==================================================================
     EJERCICIOS
     ================================================================== */

  function qHead(step, sub) {
    var texto = el('div', { class: 'col grow', style: { gap: '6px' } }, [
      el('h2', { class: 'q-title', text: step.q }),
      (step.sub || sub) ? el('div', { class: 'q-sub', text: step.sub || sub }) : null
    ]);
    // Botón de escucha: lee la pregunta y todas sus opciones, numeradas.
    var boton = speakBtn(function () { return readableStep(step, sub); });
    if (!boton) return texto;
    return el('div', { class: 'q-head-row' }, [texto, boton]);
  }

  /* ==================================================================
     LECTURA EN VOZ ALTA
     ================================================================== */

  function speakBtn(getText, opts) {
    if (!w.Speech || !w.Speech.supported()) return null;
    if (w.Store.state.settings.speech === false) return null;
    return w.Speech.button(getText, opts || {});
  }

  /** Qué se lee de un ejercicio: el enunciado y, numeradas, las respuestas.
      Sin numerar no hay forma de seguirlas escuchando. */
  function readableStep(step, sub) {
    var partes = [step.q];
    if (step.sub || sub) partes.push(step.sub || sub);

    if (step.type === 'tf') {
      partes.push('Afirmación: ' + step.statement);
      partes.push('Responde verdadero o falso.');
    }
    if (step.opts && step.opts.length) {
      partes.push(step.opts.length + ' opciones.');
      step.opts.forEach(function (o, i) { partes.push('Opción ' + (i + 1) + '. ' + (o.t || o)); });
    }
    if (step.items && step.items.length) {
      partes.push(step.items.length + ' elementos para ordenar.');
      step.items.forEach(function (x, i) { partes.push((i + 1) + '. ' + x); });
    }
    if (step.pairs && step.pairs.length) {
      step.pairs.forEach(function (p, i) { partes.push('Pareja ' + (i + 1) + '. ' + p[0] + '. Se une con: ' + p[1]); });
    }
    if (step.words && step.words.length) {
      partes.push('Palabras disponibles: ' + step.words.join(', ') + '.');
    }
    if (step.ph && step.type === 'write') partes.push('Por ejemplo: ' + step.ph);
    return partes;
  }

  /** Lectura automática del paso, si el usuario la dejó activada. */
  function autoRead(step) {
    if (!w.Speech || !w.Speech.canAuto()) return;
    if (step.type === 'concept') {
      var l = S.lesson;
      w.Speech.autoSpeak([l.concept.title].concat(l.concept.body || []));
    } else if (step.type === 'case' && S.lesson.cas) {
      w.Speech.autoSpeak([S.lesson.cas.title, S.lesson.cas.text]);
    } else if (step.type === 'apply') {
      var ej = w.Personalize.example(S.lesson);
      if (ej) w.Speech.autoSpeak(ej.text);
    } else if (step.q) {
      w.Speech.autoSpeak(readableStep(step));
    }
  }

  /* ---------- quiz (una respuesta) ---------- */
  function exQuiz(step) {
    var chosen = -1;
    var opts = UI.shuffle(step.opts.map(function (o, i) { return { o: o, i: i }; }), hash(step.q));
    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });

    opts.forEach(function (item, idx) {
      var b = el('button', { class: 'opt', type: 'button', onclick: function () {
        if (S.phase !== 'answer') return;
        w.Sound.select();
        chosen = idx;
        UI.qsa('.opt', list).forEach(function (n) { n.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        enablePrimary(true, 'Comprobar');
      } }, [
        el('span', { class: 'opt__key', text: String.fromCharCode(65 + idx) }),
        el('span', { class: 'opt__body', text: item.o.t }),
        el('span', { class: 'opt__mark' })
      ]);
      list.appendChild(b);
    });

    var node = el('div', { class: 'col' }, [qHead(step), list]);

    return {
      node: node,
      hint: function () {
        return descartarIncorrecta(list,
          function (i) { return !!opts[i].o.ok; },
          function (i) {
            if (chosen === i) { chosen = -1; enablePrimary(false, 'Comprobar'); }
          });
      },
      check: function () {
        if (chosen < 0) return null;
        var picked = opts[chosen].o;
        var btns = UI.qsa('.opt', list);
        btns.forEach(function (b, i) {
          b.classList.add('is-locked');
          b.classList.remove('is-selected');
          if (opts[i].o.ok) {
            b.classList.add('is-correct');
            b.querySelector('.opt__mark').textContent = '✓';
          } else if (i === chosen) {
            b.classList.add('is-wrong');
            b.querySelector('.opt__mark').textContent = '✕';
          } else {
            b.classList.add('is-dim');
          }
        });
        return {
          ok: !!picked.ok,
          title: picked.ok ? '¡Correcto!' : 'No era esa',
          explain: step.explain || '',
          // Se muestran TODAS las opciones: por qué la correcta lo es y por
          // qué cada una de las otras no. Es la mitad del aprendizaje.
          details: byCorrectFirst(opts.map(function (item, i) {
            return { ok: !!item.o.ok, t: item.o.t, why: item.o.why, pick: i === chosen };
          }))
        };
      }
    };
  }

  /** Ordena las opciones para el desglose: primero las correctas. */
  function byCorrectFirst(list) {
    return list.slice().sort(function (a, b) { return (b.ok ? 1 : 0) - (a.ok ? 1 : 0); });
  }

  /* ---------- verdadero / falso ---------- */
  function exTF(step) {
    var chosen = null;
    var box = el('div', { class: 'card', style: { textAlign: 'center' } }, [
      el('div', { class: 'h4', html: UI.rich(step.statement) })
    ]);
    var row = el('div', { class: 'grid-2', style: { gap: '12px' } });
    [['Verdadero', true, '✅'], ['Falso', false, '❌']].forEach(function (pair) {
      var b = el('button', { class: 'opt', style: { justifyContent: 'center' }, type: 'button', onclick: function () {
        if (S.phase !== 'answer') return;
        w.Sound.select();
        chosen = pair[1];
        UI.qsa('.opt', row).forEach(function (n) { n.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        enablePrimary(true, 'Comprobar');
      } }, [
        el('span', { style: { fontSize: '20px' }, text: pair[2] }),
        el('span', { text: pair[0] })
      ]);
      row.appendChild(b);
    });

    var node = el('div', { class: 'col stagger' }, [qHead(step), box, row]);

    return {
      node: node,
      check: function () {
        if (chosen === null) return null;
        var ok = chosen === step.ok;
        UI.qsa('.opt', row).forEach(function (b, i) {
          var val = i === 0;
          b.classList.add('is-locked');
          b.classList.remove('is-selected');
          if (val === step.ok) b.classList.add('is-correct');
          else if (val === chosen) b.classList.add('is-wrong');
        });
        return {
          ok: ok,
          title: ok ? '¡Correcto!' : 'No es así',
          explain: (step.ok ? 'La afirmación **sí** es verdadera. ' : 'La afirmación es **falsa**. ') +
                   (step.explain || '')
        };
      }
    };
  }

  /* ---------- selección múltiple ---------- */
  function exMulti(step) {
    var picked = {};
    var opts = UI.shuffle(step.opts.map(function (o, i) { return o; }), hash(step.q));
    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });

    opts.forEach(function (o, idx) {
      var b = el('button', { class: 'opt', type: 'button', onclick: function () {
        if (S.phase !== 'answer') return;
        w.Sound.select();
        picked[idx] = !picked[idx];
        b.classList.toggle('is-selected', !!picked[idx]);
        var any = Object.keys(picked).some(function (k) { return picked[k]; });
        enablePrimary(any, 'Comprobar');
      } }, [
        el('span', { class: 'opt__key', text: '○' }),
        el('span', { class: 'opt__body', text: o.t }),
        el('span', { class: 'opt__mark' })
      ]);
      list.appendChild(b);
    });

    var node = el('div', { class: 'col' }, [qHead(step, 'Puede haber más de una respuesta correcta.'), list]);

    return {
      node: node,
      hint: function () {
        return descartarIncorrecta(list,
          function (i) { return !!opts[i].ok; },
          function (i) {
            if (picked[i]) {
              picked[i] = false;
              var alguna = Object.keys(picked).some(function (k) { return picked[k]; });
              enablePrimary(alguna, 'Comprobar');
            }
          });
      },
      check: function () {
        var ok = true, faltaron = 0, sobraron = 0;
        UI.qsa('.opt', list).forEach(function (b, i) {
          var sel = !!picked[i], right = !!opts[i].ok;
          b.classList.add('is-locked');
          b.classList.remove('is-selected');
          if (right) { b.classList.add('is-correct'); b.querySelector('.opt__mark').textContent = '✓'; }
          if (sel && !right) { b.classList.add('is-wrong'); b.querySelector('.opt__mark').textContent = '✕'; }
          if (sel !== right) {
            ok = false;
            if (right) faltaron++; else sobraron++;
          }
        });

        var resumen = [];
        if (faltaron) resumen.push('te ' + (faltaron === 1 ? 'faltó 1 correcta' : 'faltaron ' + faltaron + ' correctas'));
        if (sobraron) resumen.push((sobraron === 1 ? 'marcaste 1 que no lo era' : 'marcaste ' + sobraron + ' que no lo eran'));

        return {
          ok: ok,
          title: ok ? '¡Todas correctas!' : 'Casi: ' + resumen.join(' y '),
          explain: step.explain,
          details: byCorrectFirst(opts.map(function (o, i) {
            return { ok: !!o.ok, t: o.t, why: o.why, pick: !!picked[i] };
          }))
        };
      }
    };
  }

  /* ---------- ordenar (banco de fichas) ---------- */
  function exOrder(step) {
    var answer = [];
    var bank = el('div', { class: 'row wrap', style: { gap: '9px' } });
    var slots = el('div', { class: 'col', style: { gap: '9px' } });

    function repaint() {
      UI.clear(slots);
      step.items.forEach(function (_, i) {
        var val = answer[i];
        var s = el('div', {
          class: 'order-item' + (val == null ? '' : ''),
          style: val == null ? { borderStyle: 'dashed', background: 'var(--line-2)' } : {},
          onclick: function () {
            if (S.phase !== 'answer' || val == null) return;
            w.Sound.tap();
            answer.splice(i, 1);
            repaint();
          }
        }, [
          el('span', { class: 'order-item__num', text: String(i + 1) }),
          el('span', { class: 'grow', text: val == null ? '—' : val, style: val == null ? { color: 'var(--ink-3)' } : {} })
        ]);
        slots.appendChild(s);
      });
      UI.qsa('.token', bank).forEach(function (t) {
        t.classList.toggle('is-used', answer.indexOf(t.dataset.val) >= 0);
      });
      enablePrimary(answer.length === step.items.length, 'Comprobar');
    }

    UI.shuffle(step.items, hash(step.q)).forEach(function (it) {
      var t = el('button', { class: 'token', type: 'button', data: { val: it }, onclick: function () {
        if (S.phase !== 'answer') return;
        if (answer.indexOf(it) >= 0) return;
        w.Sound.select();
        answer.push(it);
        repaint();
      } }, [el('span', { text: it })]);
      bank.appendChild(t);
    });

    var node = el('div', { class: 'col stagger' }, [
      qHead(step, 'Toca las opciones en el orden correcto.'),
      slots,
      el('div', { class: 'sep', text: 'Opciones' }),
      bank
    ]);
    repaint();

    return {
      node: node,
      check: function () {
        if (answer.length !== step.items.length) return null;
        var ok = true;
        UI.qsa('.order-item', slots).forEach(function (row, i) {
          var right = answer[i] === step.items[i];
          row.classList.add(right ? 'is-ok' : 'is-ko');
          if (!right) ok = false;
        });
        if (!ok) {
          UI.clear(slots);
          step.items.forEach(function (it, i) {
            slots.appendChild(el('div', { class: 'order-item is-ok' }, [
              el('span', { class: 'order-item__num', text: String(i + 1) }),
              el('span', { class: 'grow', text: it })
            ]));
          });
        }
        return { ok: ok, explain: step.explain, title: ok ? '¡Orden perfecto!' : 'Este es el orden correcto' };
      }
    };
  }

  /* ---------- emparejar ---------- */
  function exMatch(step) {
    var left = step.pairs.map(function (p) { return p[0]; });
    var right = UI.shuffle(step.pairs.map(function (p) { return p[1]; }), hash(step.q) + 7);
    var selL = null, selR = null, done = {}, wrongCount = 0;

    var grid = el('div', { class: 'match-row', style: { alignItems: 'start' } });
    var colL = el('div', { class: 'col', style: { gap: '10px' } });
    var colR = el('div', { class: 'col', style: { gap: '10px' } });

    function tryMatch() {
      if (selL == null || selR == null) return;
      var lVal = left[selL], rVal = right[selR];
      var correct = step.pairs.some(function (p) { return p[0] === lVal && p[1] === rVal; });
      var lEl = colL.children[selL], rEl = colR.children[selR];
      if (correct) {
        w.Sound.correct();
        lEl.classList.remove('is-sel'); rEl.classList.remove('is-sel');
        lEl.classList.add('is-ok'); rEl.classList.add('is-ok');
        done[lVal] = true;
        selL = selR = null;
        if (Object.keys(done).length === left.length) enablePrimary(true, 'Continuar');
      } else {
        wrongCount++;
        w.Sound.wrong();
        lEl.classList.add('is-ko'); rEl.classList.add('is-ko');
        var a = lEl, b = rEl;
        setTimeout(function () {
          a.classList.remove('is-ko', 'is-sel'); b.classList.remove('is-ko', 'is-sel');
        }, 450);
        selL = selR = null;
      }
    }

    left.forEach(function (t, i) {
      colL.appendChild(el('button', { class: 'match-cell', type: 'button', onclick: function (e) {
        if (S.phase !== 'answer' || done[t]) return;
        w.Sound.select();
        UI.qsa('.match-cell', colL).forEach(function (n) { if (!n.classList.contains('is-ok')) n.classList.remove('is-sel'); });
        e.currentTarget.classList.add('is-sel');
        selL = i; tryMatch();
      }, text: t }));
    });
    right.forEach(function (t, i) {
      colR.appendChild(el('button', { class: 'match-cell', type: 'button', onclick: function (e) {
        if (S.phase !== 'answer') return;
        if (e.currentTarget.classList.contains('is-ok')) return;
        w.Sound.select();
        UI.qsa('.match-cell', colR).forEach(function (n) { if (!n.classList.contains('is-ok')) n.classList.remove('is-sel'); });
        e.currentTarget.classList.add('is-sel');
        selR = i; tryMatch();
      }, text: t }));
    });

    grid.appendChild(colL); grid.appendChild(colR);
    var node = el('div', { class: 'col stagger' }, [
      qHead(step, 'Toca un elemento de cada columna para emparejarlos.'),
      grid
    ]);

    return {
      node: node,
      check: function () {
        if (Object.keys(done).length !== left.length) return null;
        return {
          ok: wrongCount === 0,
          explain: step.explain,
          title: wrongCount === 0
            ? '¡Todo emparejado!'
            : 'Emparejado con ' + UI.count(wrongCount, 'intento extra', 'intentos extra')
        };
      }
    };
  }

  /* ---------- completar huecos ---------- */
  function exFill(step) {
    var parts = step.text.split('___');
    var filled = [];
    var textWrap = el('div', { class: 'card', style: { lineHeight: '2.4', fontSize: 'var(--fs-md)', fontWeight: '700' } });
    var bank = el('div', { class: 'row wrap', style: { gap: '9px' } });

    function repaint() {
      UI.clear(textWrap);
      parts.forEach(function (p, i) {
        textWrap.appendChild(d.createTextNode(p));
        if (i < parts.length - 1) {
          var val = filled[i];
          textWrap.appendChild(el('span', {
            class: 'chip ' + (val ? 'chip--blue' : 'chip--outline'),
            style: { margin: '0 4px', cursor: 'pointer', minWidth: '70px', justifyContent: 'center' },
            text: val || '______',
            onclick: function () {
              if (S.phase !== 'answer' || !val) return;
              w.Sound.tap();
              filled[i] = null;
              repaint();
            }
          }));
        }
      });
      UI.qsa('.token', bank).forEach(function (t) {
        t.classList.toggle('is-used', filled.indexOf(t.dataset.val) >= 0);
      });
      var complete = step.answer.every(function (_, i) { return !!filled[i]; });
      enablePrimary(complete, 'Comprobar');
    }

    UI.shuffle(step.bank, hash(step.text)).forEach(function (word) {
      bank.appendChild(el('button', { class: 'token', type: 'button', data: { val: word }, onclick: function () {
        if (S.phase !== 'answer') return;
        if (filled.indexOf(word) >= 0) return;
        var slot = -1;
        for (var i = 0; i < parts.length - 1; i++) if (!filled[i]) { slot = i; break; }
        if (slot < 0) return;
        w.Sound.select();
        filled[slot] = word;
        repaint();
      } }, [el('span', { text: word })]));
    });

    var node = el('div', { class: 'col stagger' }, [
      qHead(step, 'Toca las palabras para llenar los espacios.'),
      textWrap,
      el('div', { class: 'sep', text: 'Palabras' }),
      bank
    ]);
    repaint();

    return {
      node: node,
      check: function () {
        var ok = step.answer.every(function (a, i) { return filled[i] === a; });
        if (!ok) {
          filled = step.answer.slice();
          repaint();
          UI.qsa('.chip', textWrap).forEach(function (c) {
            c.classList.remove('chip--outline', 'chip--blue');
            c.classList.add('chip--green');
          });
        } else {
          UI.qsa('.chip', textWrap).forEach(function (c) {
            c.classList.remove('chip--blue'); c.classList.add('chip--green');
          });
        }
        return { ok: ok, explain: step.explain, title: ok ? '¡Frase completa!' : 'Así queda la frase' };
      }
    };
  }

  /* ---------- deslizador con bandas ---------- */
  function exSlider(step) {
    var val = step.value;
    var valueEl = el('div', { class: 'slider-box__val', text: fmtVal(val, step.unit) });
    var bandEl = el('div', { class: 'small t-center', text: '' });
    var input = el('input', {
      class: 'range', type: 'range',
      min: step.min, max: step.max, step: step.step, value: val
    });

    input.addEventListener('input', function () {
      val = parseFloat(input.value);
      valueEl.textContent = fmtVal(val, step.unit);
      var b = bandFor(step, val);
      bandEl.textContent = b ? b.label : '';
      bandEl.style.color = b ? toneColor(b.tone) : 'var(--ink-3)';
      if (Math.abs(val - (input.__last == null ? val : input.__last)) >= step.step) w.Sound.tap();
      input.__last = val;
    });

    var node = el('div', { class: 'col stagger' }, [
      qHead(step),
      el('div', { class: 'slider-box' }, [
        valueEl,
        bandEl,
        input,
        el('div', { class: 'slider-box__scale' }, [
          el('span', { text: fmtVal(step.min, step.unit) }),
          el('span', { text: fmtVal(step.max, step.unit) })
        ])
      ])
    ]);

    return {
      node: node,
      startEnabled: true,     // el valor por defecto ya es una respuesta válida
      check: function () {
        var b = bandFor(step, val);
        var ok = val >= step.best[0] && val <= step.best[1];
        valueEl.style.color = ok ? 'var(--green-dark)' : 'var(--red)';
        bandEl.textContent = (b ? b.label : '') + (ok ? '' : ' · Rango ideal: ' + fmtVal(step.best[0], step.unit) + ' a ' + fmtVal(step.best[1], step.unit));
        return {
          ok: ok,
          explain: 'Rango ideal: **' + fmtVal(step.best[0], step.unit) + ' a ' +
                   fmtVal(step.best[1], step.unit) + '**. ' + (step.explain || ''),
          title: ok ? '¡Buen criterio!' : 'Ajusta tu criterio',
          details: bandDetails(step, b)
        };
      }
    };
  }

  function fmtVal(v, unit) {
    if (unit === '$') return UI.money(v);
    if (unit === '$/día') return UI.money(v) + '/día';
    return v + (unit || '');
  }
  function bandFor(step, v) {
    for (var i = 0; i < step.bands.length; i++) if (v <= step.bands[i].max) return step.bands[i];
    return step.bands[step.bands.length - 1];
  }

  /** Todas las bandas del deslizador con su rango: así se ve por qué la
      elegida no es la buena y qué pasa en cada tramo. */
  function bandDetails(step, actual) {
    var low = step.min;
    return step.bands.map(function (b) {
      var rango = fmtVal(low, step.unit) + ' – ' + fmtVal(b.max, step.unit);
      var ideal = low <= step.best[1] && b.max >= step.best[0];
      low = b.max;
      return { ok: ideal, t: b.label + ' (' + rango + ')', why: b.msg, pick: b === actual };
    });
  }
  function toneColor(t) {
    return t === 'ok' ? 'var(--green-dark)' : (t === 'bad' ? 'var(--red)' : 'var(--gold-dark)');
  }

  /* ---------- simulación de consecuencias ---------- */
  var EFFECT_LABELS = {
    dinero: 'Dinero', clientes: 'Clientes', reputacion: 'Reputación',
    aprendizaje: 'Aprendizaje', tiempo: 'Tiempo', ventaja: 'Ventaja'
  };

  function exSim(step) {
    var chosen = -1;
    var opts = UI.shuffle(step.opts, hash(step.q));
    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });
    var outWrap = el('div', { class: 'col', style: { gap: '10px' } });

    opts.forEach(function (o, idx) {
      var b = el('button', { class: 'opt', type: 'button', onclick: function () {
        if (S.phase !== 'answer') return;
        w.Sound.select();
        chosen = idx;
        UI.qsa('.opt', list).forEach(function (n) { n.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        enablePrimary(true, 'Ver consecuencias');
      } }, [
        el('span', { class: 'opt__key', text: String.fromCharCode(65 + idx) }),
        el('span', { class: 'opt__body', text: o.t }),
        el('span', { class: 'opt__mark' })
      ]);
      list.appendChild(b);
    });

    var node = el('div', { class: 'col' }, [
      el('div', { class: 'row', style: { gap: '10px', marginBottom: '4px' } }, [
        UI.chip('Simulación', 'purple', '🎮')
      ]),
      qHead(step, 'Elige y verás qué le pasa a tu negocio.'),
      list,
      outWrap
    ]);

    return {
      node: node,
      check: function () {
        if (chosen < 0) return null;
        var picked = opts[chosen];
        UI.qsa('.opt', list).forEach(function (b, i) {
          b.classList.add('is-locked');
          b.classList.remove('is-selected');
          if (i === chosen) b.classList.add(picked.ok ? 'is-correct' : 'is-wrong');
          else if (opts[i].ok) { b.classList.add('is-correct'); b.classList.add('is-dim'); }
          else b.classList.add('is-dim');
        });

        UI.clear(outWrap);
        outWrap.appendChild(el('div', { class: 'sep', text: 'Consecuencias' }));
        var eff = picked.effects || {};
        var box = el('div', { class: 'sim-out card card--tight' });
        Object.keys(eff).forEach(function (k, idx) {
          var v = eff[k];
          if (!EFFECT_LABELS[k]) return;
          var row = el('div', { class: 'sim-bar' }, [
            el('div', { class: 'sim-bar__label', text: EFFECT_LABELS[k] }),
            el('div', { class: 'sim-bar__track' }, [el('div', { class: 'sim-bar__fill' + (v < 0 ? ' neg' : '') })]),
            el('div', { class: 'sim-bar__val', style: { color: v < 0 ? 'var(--red)' : 'var(--green-dark)' },
              text: (v > 0 ? '+' : '') + v })
          ]);
          box.appendChild(row);
          setTimeout(function () {
            var fill = row.querySelector('.sim-bar__fill');
            var pct = Math.min(50, Math.abs(v) * 16);
            if (v < 0) { fill.style.left = (50 - pct) + '%'; fill.style.width = pct + '%'; }
            else { fill.style.left = '50%'; fill.style.width = pct + '%'; }
          }, 60 + idx * 110);
        });
        outWrap.appendChild(box);
        outWrap.classList.add('anim-in');

        return {
          ok: !!picked.ok,
          explain: step.explain || '',
          title: picked.ok ? '¡Buena decisión!' : 'Esa decisión cuesta',
          details: byCorrectFirst(opts.map(function (o, i) {
            return { ok: !!o.ok, t: o.t, why: o.why, pick: i === chosen };
          }))
        };
      }
    };
  }

  /* ---------- escribir (evaluado por el mentor) ---------- */
  function exWrite(step) {
    var ta = el('textarea', { class: 'textarea', placeholder: step.ph || 'Escribe aquí…', rows: '5' });
    var counter = el('div', { class: 'write-count', text: '0 palabras' });
    var fb = el('div', { class: 'col', style: { gap: '8px' } });

    ta.addEventListener('input', function () {
      var n = w.Mentor.util.words(ta.value).length;
      counter.textContent = n + ' palabra' + (n === 1 ? '' : 's');
      counter.style.color = n >= (step.minWords || 8) ? 'var(--green-dark)' : 'var(--ink-3)';
      enablePrimary(n >= 3, 'Que lo revise el mentor');
    });

    var hints = step.hints && step.hints.length
      ? el('div', { class: 'card card--tight', style: { background: 'var(--brand-soft)', borderColor: 'var(--brand)' } }, [
          el('div', { class: 'tiny', style: { color: 'var(--brand)' }, text: 'Pistas' }),
          el('ul', { style: { marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' } },
            step.hints.map(function (h) { return el('li', { class: 'small', text: '· ' + h }); }))
        ])
      : null;

    /* Contestar hablando. Es el ejercicio que más gente abandona a media
       frase, y el único de los nueve que exige teclado. */
    var mic = (w.Captura && w.Captura.micro) ? w.Captura.micro(ta) : null;

    var node = el('div', { class: 'col stagger' }, [
      el('div', { class: 'row', style: { gap: '10px' } }, [UI.chip('Tu turno', 'brand', '✍️')]),
      qHead(step),
      el('div', { class: 'write-box' }, [
        mic ? el('div', { class: 'campo-con-voz' }, [ta, mic]) : ta,
        counter
      ]),
      hints,
      fb
    ]);

    return {
      node: node,
      check: function () {
        var txt = ta.value.trim();
        if (w.Mentor.util.words(txt).length < 3) return null;
        var r = w.Mentor.quickFeedback(txt, step);
        ta.disabled = true;

        UI.clear(fb);
        fb.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start', marginTop: '6px' } }, [
          el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(r.mood) }),
          el('div', { class: 'speech' + (r.score >= 70 ? ' speech--green' : '') }, [
            el('div', { class: 'small', style: { fontWeight: '900' }, text: 'Revisión del mentor · ' + r.score + '/100' }),
            el('ul', { style: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' } },
              r.good.map(function (g) { return el('li', { class: 'small', text: '✅ ' + g }); })
                .concat(r.notes.map(function (n) { return el('li', { class: 'small', text: '💡 ' + n }); }))
            ),
            el('div', { class: 'tiny', style: { marginTop: '8px', textTransform: 'none', letterSpacing: '0' },
              text: 'Aquí no hay respuesta única y la nota no bloquea nada: mide qué tan concreto y verificable es lo que escribiste (cifras, público definido, plazos).' })
          ])
        ]));
        fb.classList.add('anim-in');
        return { ok: true, explain: step.explain || 'No hay una única respuesta correcta aquí. Lo importante es que sea concreto y verificable.', title: 'Registrado' };
      }
    };
  }

  function hash(s) {
    var h = 0;
    for (var i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /* ==================================================================
     SIN VIDAS
     ================================================================== */

  function noHearts() {
    UI.modal([
      el('div', { class: 'mascot mascot--lg is-sad', style: { margin: '0 auto' }, html: w.Mascot.svg('sad') }),
      el('h3', { class: 'h2', text: 'Te quedaste sin vidas' }),
      el('p', { class: 'p', text: 'Puedes recargar con monedas, esperar a que se regeneren o seguir practicando sin vidas (no ganarás XP).' }),
      el('div', { class: 'small', text: 'Siguiente vida en ' + (w.Engine.heartsETA() || '—') }),
      UI.btn('Recargar por 60 🪙', {
        variant: 'gold',
        onClick: function () {
          if (w.Store.state.coins < 60) { UI.toast('No tienes suficientes monedas', 'red', '🪙'); return; }
          w.Engine.addCoins(-60);
          w.Engine.refillHearts();
          updateBar();
          UI.closeModal();
          UI.toast('¡Vidas recargadas!', 'green', '❤️');
        }
      }),
      UI.btn('Seguir sin vidas', { variant: 'ghost', onClick: UI.closeModal }),
      UI.btn('Salir de la lección', { variant: 'flat', onClick: function () { UI.closeModal(); exit(); } })
    ], { dismissible: false });
  }

  function confirmExit() {
    if (S.i <= 1) return exit();
    UI.confirm({
      title: '¿Salir de la lección?',
      text: 'Perderás el avance de esta sesión.',
      ok: 'Sí, salir', cancel: 'Seguir aprendiendo', danger: true, mood: 'sad'
    }).then(function (yes) { if (yes) exit(); });
  }

  function exit() {
    if (w.Speech) w.Speech.stop();
    w.App.showChrome(true);
    UI.Router.go('home', {}, 'back');
  }

  /* ==================================================================
     RESULTADOS
     ================================================================== */

  function finish() {
    var lesson = S.lesson;
    var total = Math.max(1, S.answered);
    var acc = Math.round((S.correct / total) * 100);
    var mins = Math.max(1, Math.round((Date.now() - S.startedAt) / 60000));
    var res = w.Engine.completeLesson(lesson.id, { score: acc, errors: S.errors });
    var day = w.Engine.touchDay();

    var bonus = S.errors === 0 ? 15 : 0;
    var totalXP = S.xp + lesson.xp + bonus;
    var gained = w.Engine.addXP(totalXP, true);
    w.Engine.addCoins(res.first ? 12 : 4);

    var body = d.getElementById('lesson-body');
    var foot = d.getElementById('lesson-foot');
    var bar = d.getElementById('lesson-bar');
    if (bar && bar.setFill) bar.setFill(100);
    if (foot) foot.remove();
    UI.clear(body);
    body.style.paddingBottom = '40px';

    w.Sound.complete();
    w.FX.celebrate();

    var wrap = el('div', { class: 'finish anim-in' }, [
      el('div', { style: { position: 'relative', display: 'grid', placeItems: 'center' } }, [
        el('div', { class: 'rays' }),
        el('div', { class: 'mascot mascot--xl is-party', html: w.Mascot.svg('party') })
      ]),
      el('h2', { class: 'h1', text: S.errors === 0 ? '¡Perfecto!' : '¡Lección completada!' }),
      el('p', { class: 'p', text: lesson.title }),
      el('div', { class: 'finish__stats' }, [
        statBox('XP ganado', '+' + gained, '#FFC800', '#D9A400'),
        statBox('Aciertos', acc + '%', '#43C95E', '#2E9B44'),
        statBox('Tiempo', mins + ' min', '#1CB0F6', '#1189C4')
      ])
    ]);

    if (bonus) wrap.appendChild(UI.chip('Bono sin errores +15 XP', 'gold', '💎'));
    if (day.changed) {
      wrap.appendChild(el('div', { class: 'card', style: { width: '100%', background: 'var(--brand-soft)', borderColor: 'var(--brand)' } }, [
        el('div', { class: 'row', style: { gap: '12px' } }, [
          el('span', { class: 'flame', style: { fontSize: '30px' }, text: '🔥' }),
          el('div', [
            el('div', { class: 'h4 c-brand', text: 'Racha de ' + UI.days(day.streak) }),
            el('div', { class: 'small', text: 'Vuelve mañana para no perderla.' })
          ])
        ])
      ]));
      w.Sound.streak();
    }

    /* UNA sola pregunta al terminar, nunca dos.

       Si Chispa todavía no sabe algo del negocio —la oferta, el objetivo, cada
       cuánto le compran— lo pregunta aquí, en el modo que sea más cómodo: este
       es el momento en que el usuario está contento y con la guardia baja, y
       es lo que hace que el perfil se llene solo sin un cuestionario.

       Si ya lo sabe todo, o si hoy ya se le preguntaron tres cosas, vuelve la
       reflexión de siempre sobre la lección recién hecha. */
    var deChispa = (w.Captura && w.Captura.hayMomento()) ? w.Captura.siguiente() : null;
    if (deChispa) {
      wrap.appendChild(capturaCard(deChispa));
    } else {
      var pregunta = w.Personalize.reflection(lesson);
      if (pregunta) wrap.appendChild(reflectionCard(lesson, pregunta));
    }

    var actions = el('div', { class: 'col', style: { width: '100%', gap: '10px', marginTop: '10px' } });
    if (lesson.mission) {
      actions.appendChild(UI.btn('Ir a la misión real', {
        variant: 'purple', size: 'lg', shiny: true,
        onClick: function () { UI.Router.go('mission', { id: lesson.id }); }
      }));
      actions.appendChild(UI.btn('Ahora no', { variant: 'flat', onClick: exit }));
    } else {
      actions.appendChild(UI.btn('Continuar', { variant: 'green', size: 'lg', onClick: exit }));
    }
    wrap.appendChild(actions);
    body.appendChild(wrap);
  }

  /* La pregunta del día de Chispa, dentro de la celebración. Cabe en la misma
     tarjeta que la reflexión y se contesta con el modo que le toque a cada
     pregunta: tocando, hablando o deslizando. */
  function capturaCard(p) {
    var box = el('div', { class: 'card card--accent', style: { width: '100%', textAlign: 'left' } });

    box.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
      el('div', { style: { minWidth: '0' } }, [
        el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', color: 'var(--brand-dark)', fontWeight: '900' },
          text: 'Ya que estamos aquí…' }),
        el('div', { class: 'h4', style: { marginTop: '4px' }, text: p.q })
      ])
    ]));

    function cerrar(titulo, detalle) {
      UI.clear(box);
      box.appendChild(el('div', { class: 'small', style: { fontWeight: '900' }, text: titulo }));
      if (detalle) box.appendChild(el('div', { class: 'small', style: { marginTop: '6px' }, text: detalle }));
    }

    /* Dentro de la celebración no caben cinco tarjetas grandes: empujaban el
       botón de continuar fuera de la pantalla y la lección parecía trabada.
       Las mismas opciones, en fila y del ancho de su texto, caben en tres
       líneas. La pregunta es la misma; solo cambia el tamaño del gesto. */
    var modo = (p.modo === 'tarjetas' && w.Captura.opciones(p).length) ? 'rapidas' : null;

    box.appendChild(el('div', { style: { marginTop: '12px' } }, [
      w.Captura.bloque(p, {
        sinCabecera: true,
        compacto: true,
        modo: modo,
        onListo: function (valor, modo) {
          w.Captura.responder(p, valor, modo);
          w.Sound.coin();
          cerrar('✅ Anotado en tu emprendimiento', w.Captura.textoDe(p, valor));
        },
        onSaltar: function () {
          w.Captura.saltar(p);
          cerrar('🤝 Sin problema', 'Lo vemos más adelante. No te lo vuelvo a preguntar por ahora.');
        }
      })
    ]));

    box.appendChild(el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginTop: '12px', opacity: '.8' },
      text: 'Es la única pregunta de hoy. ' + (p.para || '') }));

    // Se apunta al pintarla, no al contestarla: enseñar tres preguntas y que
    // se salten las tres cuenta igual de cansado que contestarlas.
    w.Captura.apuntar();
    return box;
  }

  function reflectionCard(lesson, pregunta) {
    var ta = el('textarea', { class: 'textarea', rows: '3', maxlength: '300', placeholder: 'Escríbelo o cuéntamelo hablando…' });
    // El micrófono solo aparece donde de verdad se puede dictar; si no, el
    // campo se queda como estaba y nadie ve un botón que no hace nada.
    var mic = (w.Captura && w.Captura.micro) ? w.Captura.micro(ta) : null;
    var campo = mic ? el('div', { class: 'campo-con-voz' }, [ta, mic]) : ta;
    var box = el('div', { class: 'card', style: { width: '100%', textAlign: 'left' } }, [
      el('div', { class: 'tiny', style: { color: 'var(--brand)' }, text: 'Para pensar sobre tu negocio' }),
      el('div', { class: 'small', style: { fontWeight: '900', marginTop: '6px' }, text: pregunta }),
      campo
    ]);
    box.appendChild(UI.btn('Guardar en mi emprendimiento', {
      variant: 'ghost', size: 'sm',
      onClick: function () {
        var txt = (ta.value || '').trim();
        if (!txt) { UI.toast('Escribe algo primero', 'red', '✍️'); return; }
        w.Venture.recordDecision('reflexion:' + lesson.id, pregunta + ' → ' + txt, {
          label: 'Reflexión · ' + lesson.title, from: 'leccion'
        });
        UI.toast('Guardado en tu perfil', 'green', '🧠');
        w.Sound.coin();
        UI.clear(box);
        box.appendChild(el('div', { class: 'small', style: { fontWeight: '900' }, text: '🧠 Anotado en tu emprendimiento' }));
        box.appendChild(el('div', { class: 'small', style: { marginTop: '6px' }, text: txt }));
      }
    }));
    return box;
  }

  function statBox(label, value, color, shadow) {
    return el('div', { class: 'finish__stat', style: { '--st-c': color, '--st-sh': shadow } }, [
      el('b', { text: label }),
      el('span', { text: value })
    ]);
  }

  UI.Router.register('lesson', render);
})(window, document);
