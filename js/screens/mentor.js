/* ==========================================================================
   MENTOR — chat, calculadoras y práctica guiada
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, KB = w.MENTOR_KB;
  var chatEl = null;
  var practice = null;   // { key, turn, score }

  /* ================================================================== */

  function render() {
    var root = el('div', { class: 'col', style: { minHeight: '100%', position: 'relative', gap: '0' } });
    root.appendChild(el('h1', { class: 'sr-only', text: 'Chispa, tu mentor' }));
    chatEl = el('div', { class: 'chat', id: 'chat' });
    root.appendChild(chatEl);
    root.appendChild(dock());

    var hist = w.Store.state.chat || [];
    if (!hist.length) {
      pushBot(greeting(), true);
    } else {
      hist.slice(-40).forEach(function (m) {
        chatEl.appendChild(bubble(m.who, m.text, true));
      });
      setTimeout(scrollDown, 60);
    }
    return root;
  }

  /** El saludo ya parte de lo que el mentor sabe: no arranca de cero nunca. */
  function greeting() {
    var s = w.Store.state;
    var name = s.profile.name && s.profile.name !== 'Emprendedor' ? s.profile.name : null;
    var t = w.Venture.terms();
    var dec = w.Venture.decisions().length;
    var dm = w.Engine.dailyMission();

    var L = ['Hola' + (name ? ' ' + name : '') + ' 👋 Soy **Chispa**, tu mentor.'];
    L.push('');
    if (w.Personalize.ready()) {
      L.push('Trabajamos sobre **' + t.negocio + '**: ' + t.producto +
             (t.tiene.cliente ? ' para ' + t.cliente : '') + '.');
      if (dec) L.push('Ya tengo anotadas **' + dec + '** decisiones tuyas, así que no te voy a preguntar lo mismo dos veces.');
    } else {
      L.push('Todavía no me has contado tu idea. Regístrala en **Mi emprendimiento** y todo lo que te diga hablará de tu negocio.');
    }
    L.push('');
    L.push('Puedo revisar tu oferta, calcular tu precio y tu punto de equilibrio, practicar objeciones contigo o decirte qué hacer hoy.');
    if (dm) { L.push(''); L.push('Ahora mismo te toca: **' + dm.title + '**.'); }
    L.push('');
    L.push('¿Por dónde empezamos?');
    return L.join('\n');
  }

  /* ------------------------- Burbujas ------------------------- */

  function bubble(who, text, instant) {
    var isMe = who === 'me';
    var burbuja = el('div', { class: 'msg__bub', html: UI.rich(text) });
    // Solo las respuestas del mentor se leen: lo que escribió el usuario ya lo sabe.
    var escuchar = (!isMe && w.Speech && w.Speech.supported() && w.Store.state.settings.speech !== false)
      ? w.Speech.button(function () { return text; }, { small: true })
      : null;

    return el('div', { class: 'msg msg--' + (isMe ? 'me' : 'bot') + (instant ? '' : ' msg-in') }, [
      isMe ? null : el('div', { class: 'msg__av', html: w.Mascot.svg('happy') }),
      escuchar
        ? el('div', { class: 'col', style: { gap: '6px', alignItems: 'flex-start', minWidth: '0' } }, [burbuja, escuchar])
        : burbuja
    ]);
  }

  function pushBot(text, instant, save) {
    var b = bubble('bot', text, instant);
    chatEl.appendChild(b);
    scrollDown();
    if (save !== false) remember('bot', text);
    return b;
  }

  function pushMe(text) {
    chatEl.appendChild(bubble('me', text));
    scrollDown();
    remember('me', text);
  }

  function remember(who, text) {
    w.Store.set(function (s) {
      s.chat = s.chat || [];
      s.chat.push({ who: who, text: text, at: Date.now() });
      if (s.chat.length > 120) s.chat = s.chat.slice(-120);
      if (who === 'me') s.chatCount = (s.chatCount || 0) + 1;
    }, 'chat');
    if (who === 'me') w.Engine.checkBadges();
  }

  function typing() {
    var t = el('div', { class: 'msg msg--bot msg-in' }, [
      el('div', { class: 'msg__av', html: w.Mascot.svg('think') }),
      el('div', { class: 'msg__bub' }, [el('span', { class: 'dots' }, [el('i'), el('i'), el('i')])])
    ]);
    chatEl.appendChild(t);
    scrollDown();
    return t;
  }

  function scrollDown() {
    var vp = d.getElementById('view');
    setTimeout(function () { if (vp) vp.scrollTop = vp.scrollHeight; }, 40);
  }

  /* ------------------------- Dock ------------------------- */

  var quickRow = null;

  function dock() {
    var input = el('textarea', {
      class: 'chat-input', rows: '1', placeholder: 'Escribe tu duda…',
      onkeydown: function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
      },
      oninput: function () {
        input.style.height = 'auto';
        input.style.height = Math.min(110, input.scrollHeight) + 'px';
      }
    });

    var sendBtn = el('button', {
      class: 'chat-send', type: 'button', 'aria-label': 'Enviar',
      html: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3.4 20.4l17.5-8.4c.8-.4.8-1.5 0-1.9L3.4 1.7c-.7-.4-1.5.2-1.3 1L4 10.5l9.5 1.5L4 13.5l-1.9 7.8c-.2.8.6 1.4 1.3 1.1z"/></svg>',
      onclick: send
    });

    function send() {
      var txt = (input.value || '').trim();
      if (!txt) return;
      input.value = '';
      input.style.height = 'auto';
      w.Sound.tap();
      handle(txt);
    }

    quickRow = el('div', { class: 'chat-quick' });
    // Las sugerencias iniciales son lo que Chispa resuelve de verdad, no una
    // lista de temas: cada una lleva a un cálculo o a una plantilla concreta.
    paintQuick(w.Chispa ? sugerenciasChispa() : KB.QUICK.slice(0, 6));

    return el('div', { class: 'chat-dock' }, [
      quickRow,
      el('div', { class: 'chat-input-row' }, [input, sendBtn])
    ]);
  }

  function paintQuick(list) {
    if (!quickRow) return;
    UI.clear(quickRow);
    list.forEach(function (q) {
      quickRow.appendChild(el('button', { type: 'button', text: q, onclick: function () {
        w.Sound.tap();
        handle(q);
      } }));
    });
  }

  /* ------------------------- Enrutado de mensajes ------------------------- */

  function handle(text) {
    pushMe(text);
    if (practice) return practiceTurn(text);

    var t = w.Mentor.util.norm(text);

    // Cancelar una serie de preguntas a medias.
    if (w.Chispa && w.Chispa.pendiente() && /^(cancelar|olvidalo|dejalo|ya no|salir|cancela)/.test(t)) {
      w.Chispa.cancelar();
      pushBot('Listo, lo dejamos. Lo que ya me habías dicho queda guardado por si lo retomamos.');
      paintQuick(KB.QUICK.slice(0, 6));
      return;
    }

    // Acciones explícitas: no son preguntas, son atajos a una pantalla.
    if (/practicar objeciones|objeciones.*practic/.test(t)) return startPractice('objeciones');
    if (/simular un cliente|simula un cliente|practicar entrevista/.test(t)) return startPractice('entrevista');
    if (/practicar una venta|simular una venta|practicar venta/.test(t)) return startPractice('venta');
    if (/mi emprendimiento|mi perfil|mi idea registrada/.test(t)) { UI.Router.go('venture'); return; }
    if (/mi expediente|mi negocio/.test(t)) { UI.Router.go('business'); return; }
    if (/mis numeros|mis números/.test(t)) { UI.Router.go('business'); return; }

    // Calculadoras de formulario que Chispa no cubre todavía.
    if (/costo de impresion 3d|costo de impresión 3d/.test(t)) return openCalc('3d');
    if (/cac|costo de adquisicion|calcular mi cac/.test(t)) return openCalc('cac');
    if (/reorden|cuanto material compro|calcular mi reorden/.test(t)) return openCalc('reorden');

    return chispa(text);
  }

  /* ------------------------- Chispa Engine -------------------------
     Reglas, fórmulas y conocimiento antes que cualquier modelo. Si el motor
     resuelve, se termina ahí: es instantáneo, gratis y verificable. Solo lo
     que ninguna plantilla puede resolver llega al nivel 7.
     ---------------------------------------------------------------- */

  function chispa(text) {
    var r = null;
    try { r = w.Chispa.responder(text); }
    catch (e) { console.warn('[chispa]', e); }

    if (!r) return respuestaLocal(text);

    // Niveles 1 a 6: responde el motor.
    if (r.nivel <= 6 && r.texto) {
      var think = typing();
      setTimeout(function () {
        think.remove();
        pushBot(r.texto);
        if (r.pregunta) {
          paintQuick(['Cancelar']);
          enfocarEntrada(r.pregunta);
        } else {
          paintQuick(seguimiento(r));
        }
        w.Sound.select();
      }, 240);
      return;
    }

    // Nivel 7: el motor no tiene plantilla, pero sí los hechos.
    if (w.AI && w.AI.disponible()) return askAI(text, r.prompt);
    return respuestaLocal(text, r);
  }

  /** Sin IA disponible hay dos cosas que sí existen, y en este orden:

      1. una respuesta escrita a mano para ese tema, de las 26 del mentor. Están
         desarrolladas y explican el porqué; un fragmento suelto de la base no
         se les acerca.
      2. si no hay ninguna, el conocimiento recuperado, que al menos es del tema.

      Lo que nunca se usa mientras haya algo mejor es el comodín genérico. */
  function respuestaLocal(text, r) {
    var think = typing();
    setTimeout(function () {
      think.remove();

      var escrita = w.Mentor.matchIntent ? w.Mentor.matchIntent(text) : null;
      if (escrita) {
        var loc = w.Mentor.reply(text);
        pushBot(loc.text);
        // El conocimiento recuperado se ofrece como complemento, no lo pisa.
        var extra = complemento(r, escrita);
        if (extra) setTimeout(function () { pushBot(extra); }, 500);
        paintQuick(loc.follow && loc.follow.length ? loc.follow.slice(0, 3).concat(sugerenciasChispa().slice(0, 2))
                                                  : sugerenciasChispa());
        w.Sound.select();
        return;
      }

      if (r && r.fuentes && r.fuentes.length) {
        var f = r.fuentes[0];
        pushBot('**' + f.titulo + '**\n\n' + f.cuerpo +
          '\n\nSi quieres, dime “calcular un precio”, “tu cliente ideal” o “un desafío para hoy” y lo trabajamos con tus números.');
        paintQuick(sugerenciasChispa());
        w.Sound.select();
        return;
      }

      var fb = w.Mentor.reply(text);
      pushBot(fb.text);
      paintQuick(sugerenciasChispa());
      w.Sound.select();
    }, 380);
  }

  /** Una segunda entrada de la base, solo si aporta algo distinto de lo ya
      dicho. Repetir el mismo consejo con otras palabras cansa. */
  function complemento(r, intencionEscrita) {
    if (!r || !r.fuentes || !r.fuentes.length) return null;
    var f = r.fuentes[0];
    // Los ejemplos y los errores concretos son lo que más suma a una
    // explicación general; las reglas suelen decir lo mismo otra vez.
    if (f.tipo !== 'ejemplo' && f.tipo !== 'error' && f.tipo !== 'diagnostico') return null;
    var titulo = w.Mentor.util.norm(f.titulo);
    if (titulo && w.Mentor.util.norm(intencionEscrita.title || '').indexOf(titulo) >= 0) return null;
    return '**' + f.titulo + '**\n\n' + f.cuerpo;
  }

  function sugerenciasChispa() {
    var out = [];
    w.Chispa.INTENCIONES.forEach(function (i) { if (out.length < 5) out.push(i.etiqueta); });
    return out;
  }

  function seguimiento(r) {
    if (r.intencion === 'calcular_precio') return ['Punto de equilibrio', 'Tu margen', 'Un desafío para hoy'];
    if (r.intencion === 'definir_cliente') return ['Revisar tu propuesta', 'Un desafío para hoy'];
    if (r.intencion === 'evaluar_oferta') return ['Calcular un precio', 'Un desafío para hoy'];
    return sugerenciasChispa();
  }

  /** Cuando Chispa pide un número, el teclado debe abrirse listo para eso. */
  function enfocarEntrada(pregunta) {
    var input = UI.qs('.chat-input');
    if (!input) return;
    input.setAttribute('inputmode', pregunta.tipo === 'num' ? 'decimal' : 'text');
    input.placeholder = pregunta.ph ? 'Por ejemplo: ' + pregunta.ph : 'Escribe tu respuesta…';
    try { input.focus({ preventScroll: true }); } catch (e) {}
  }

  function localFallback(text, aviso) {
    var r = w.Mentor.reply(text);
    pushBot(r.text);
    if (r.follow && r.follow.length) paintQuick(r.follow.concat(KB.QUICK.slice(0, 3)));
    else paintQuick(KB.QUICK.slice(0, 6));
    w.Sound.select();
    if (aviso) UI.toast(aviso, 'red', '⚠️', 4200);
  }

  /** El modelo recibe los hechos que Chispa ya resolvió, no la pregunta suelta:
      el conocimiento aplicable va delante y con la orden de no inventar. */
  function askAI(text, contexto) {
    var think = typing();
    w.AI.ask(contexto || text).then(function (answer) {
      think.remove();
      pushBot(answer);
      paintQuick(sugerenciasChispa());
      w.Sound.select();
    }).catch(function (err) {
      think.remove();
      localFallback(text, (err && err.message) || 'La IA no respondió.');
    });
  }

  /* ------------------------- Práctica guiada ------------------------- */

  function startPractice(key) {
    var p = KB.PRACTICE[key];
    if (!p) return;
    practice = { key: key, turn: 0, score: 0, total: p.turns.length };
    var think = typing();
    setTimeout(function () {
      think.remove();
      pushBot('🎭 **' + p.title + '**\n\n' + p.intro);
      setTimeout(function () {
        pushBot('👤 “' + p.turns[0].client + '”');
        paintQuick(['Terminar práctica']);
      }, 700);
    }, 500);
  }

  function practiceTurn(answer) {
    var p = KB.PRACTICE[practice.key];
    if (/terminar/i.test(answer)) return endPractice();

    var turn = p.turns[practice.turn];
    var r = w.Mentor.scorePracticeTurn(turn, answer);
    if (r.ok) { practice.score++; w.Sound.correct(); }
    else w.Sound.alert();

    var think = typing();
    setTimeout(function () {
      think.remove();
      pushBot(r.feedback);
      practice.turn++;
      if (practice.turn >= p.turns.length) {
        setTimeout(endPractice, 700);
      } else {
        setTimeout(function () {
          pushBot('👤 “' + p.turns[practice.turn].client + '”');
        }, 650);
      }
    }, 450);
  }

  function endPractice() {
    var p = KB.PRACTICE[practice.key];
    var pct = Math.round((practice.score / practice.total) * 100);
    var xp = 15 + practice.score * 8;
    practice = null;
    var msg = '🏁 **Práctica terminada.**\n\nAcertaste ' + pct + '% de los momentos clave.\n\n' +
      (pct >= 75 ? 'Muy bien: ya tienes el reflejo correcto. Ahora hazlo con una persona real.'
        : (pct >= 40 ? 'Vas bien. Lo que más te falta es preguntar antes de responder.'
                     : 'Repítela un par de veces. La clave siempre es la misma: valida, pregunta, y solo entonces responde.'));
    pushBot(msg);
    w.Engine.addXP(xp);
    UI.toast('+' + xp + ' XP por practicar', 'gold', '⚡');
    paintQuick(KB.QUICK.slice(0, 6));
  }

  /* ------------------------- Calculadoras ------------------------- */

  function numField(label, ph, val) {
    var input = el('input', { class: 'input', type: 'number', inputmode: 'decimal', placeholder: ph });
    if (val != null) input.value = val;
    return { node: el('div', { class: 'field' }, [el('label', { class: 'field__label', text: label }), input]), input: input };
  }

  function openCalc(kind) {
    var fields = [], title = '', run;

    if (kind === 'equilibrio') {
      title = '⚖️ Punto de equilibrio';
      var f1 = numField('Costos fijos del mes ($)', '2400');
      var f2 = numField('Precio de venta ($)', '190');
      var f3 = numField('Costo variable por unidad ($)', '60');
      fields = [f1, f2, f3];
      run = function () { return w.Mentor.CALC.equilibrio(+f1.input.value, +f2.input.value, +f3.input.value); };
    } else if (kind === 'precio') {
      title = '🏷️ Precio sugerido';
      var p1 = numField('Tu costo unitario ($)', '87');
      var p2 = numField('Precio más bajo del mercado ($)', '150');
      var p3 = numField('Precio más alto del mercado ($)', '300');
      var p4 = numField('¿Cuánto gana o ahorra tu cliente? ($, opcional)', '800');
      fields = [p1, p2, p3, p4];
      run = function () { return w.Mentor.CALC.precio(+p1.input.value, +p2.input.value, +p3.input.value, +p4.input.value); };
    } else if (kind === '3d') {
      title = '🖨️ Costo de impresión 3D';
      var t1 = numField('Gramos de filamento', '80');
      var t2 = numField('Precio del kilo ($)', '350');
      var t3 = numField('Horas de impresión', '6');
      var t4 = numField('Costo de energía por hora ($)', '0.9');
      var t5 = numField('Minutos de tu trabajo', '40');
      var t6 = numField('Valor de tu hora ($)', '60');
      var t7 = numField('Empaque y envío ($)', '8');
      fields = [t1, t2, t3, t4, t5, t6, t7];
      run = function () {
        return w.Mentor.CALC.impresion3d(+t1.input.value, +t2.input.value, +t3.input.value,
          +t4.input.value, +t5.input.value, +t6.input.value, +t7.input.value);
      };
    } else if (kind === 'cac') {
      title = '💸 Costo por cliente (CAC)';
      var c1 = numField('Inversión en publicidad ($)', '2000');
      var c2 = numField('Clientes conseguidos', '8');
      var c3 = numField('Margen por cliente ($)', '180');
      fields = [c1, c2, c3];
      run = function () { return w.Mentor.CALC.cac(+c1.input.value, +c2.input.value, +c3.input.value); };
    } else if (kind === 'reorden') {
      title = '📦 Punto de reorden';
      var r1 = numField('Consumo por semana (unidades)', '20');
      var r2 = numField('Semanas que tarda tu proveedor', '2');
      var r3 = numField('Semanas de colchón', '1');
      fields = [r1, r2, r3];
      run = function () { return w.Mentor.CALC.reorden(+r1.input.value, +r2.input.value, +r3.input.value); };
    }

    var out = el('div', { class: 'col', style: { gap: '10px' } });

    UI.sheet([
      el('h2', { class: 'h3', text: title }),
      el('div', { class: 'col', style: { gap: '12px' } }, fields.map(function (f) { return f.node; })),
      UI.btn('Calcular', {
        variant: 'brand',
        onClick: function () {
          var r;
          try { r = run(); } catch (e) { r = { error: 'Revisa los datos.' }; }
          UI.clear(out);
          if (r.error) {
            out.appendChild(el('div', { class: 'card card--tight', style: { background: 'var(--red-soft)', borderColor: 'var(--red)' } }, [
              el('div', { class: 'small', style: { color: 'var(--red-dark)', fontWeight: '800' }, text: r.error })
            ]));
            w.Sound.wrong();
          } else {
            out.appendChild(el('div', { class: 'calc-out', html: UI.rich(r.text) }));
            w.Sound.cash();
            w.FX.burst(out, { count: 14, colors: ['#43C95E', '#FFC800'] });
            out.appendChild(UI.btn('Mandarlo al chat', {
              variant: 'ghost', size: 'sm',
              onClick: function () {
                UI.closeSheet();
                pushBot('**' + title + '**\n\n' + r.text);
              }
            }));
          }
        }
      }),
      out
    ]);
  }

  /* ------------------------- Revisión de textos ------------------------- */

  var REVIEW_MISSIONS = {
    oferta: {
      id: 'rev-oferta', title: 'Revisión de tu oferta', dossier: 'oferta',
      label: 'Pega aquí tu oferta completa',
      ph: 'Ayudo a dueños de perros grandes a que su perro nunca se pierda, con placas grabadas irrompibles, en 48 h, con garantía de 1 año, por $220.',
      rubric: [
        { id: 'a', label: 'Nombra a un cliente concreto', check: 'audience' },
        { id: 'b', label: 'Promete un resultado, no solo un objeto', check: 'outcome' },
        { id: 'c', label: 'Incluye precio y plazo', check: 'quote2' },
        { id: 'd', label: 'Está escrita en términos verificables', check: 'concrete' }
      ]
    },
    cliente: {
      id: 'rev-cliente', title: 'Revisión de tu cliente ideal', dossier: 'cliente',
      label: 'Describe a tu cliente ideal',
      ph: 'Le vendo a dueños de perros grandes que necesitan placas resistentes porque las de metal se borran, y los encuentro en grupos de adiestramiento.',
      rubric: [
        { id: 'a', label: 'El grupo es específico', check: 'audience' },
        { id: 'b', label: 'Menciona una necesidad real', check: 'problem' },
        { id: 'c', label: 'Dice dónde encontrarlos', check: 'filled' },
        { id: 'd', label: 'Evita generalidades', check: 'concrete' }
      ]
    }
  };

  function openReview(kind) {
    var m = REVIEW_MISSIONS[kind];
    var saved = w.Store.state.dossier[m.dossier];
    var t = w.Venture.terms();
    // El ejemplo del campo se escribe con SU producto, no con el de la demo.
    var ejemplo = w.Personalize.ready()
      ? (kind === 'oferta'
          ? 'Ayudo a ' + t.tuCliente + ' a [resultado] con ' + t.producto + ', en [plazo], con [garantía], por $[precio].'
          : 'Le vendo a ' + t.tuCliente + ' que necesita [X] porque [causa], y los encuentro en [lugar real].')
      : m.ph;
    var ta = el('textarea', { class: 'textarea', rows: '5', placeholder: ejemplo });
    if (saved && saved.answers) {
      ta.value = Object.keys(saved.answers).map(function (k) { return saved.answers[k]; }).join(' ');
    }
    var out = el('div', { class: 'col', style: { gap: '10px' } });

    UI.sheet([
      el('h2', { class: 'h3', text: m.title }),
      el('div', { class: 'field' }, [el('label', { class: 'field__label', text: m.label }), ta]),
      UI.btn('Revisar', {
        variant: 'purple',
        onClick: function () {
          var txt = (ta.value || '').trim();
          if (w.Mentor.util.words(txt).length < 4) { UI.toast('Escribe un poco más', 'red', '✍️'); return; }
          var ev = w.Mentor.evaluate(m, { texto: txt });
          UI.clear(out);
          out.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
            el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(ev.verdict.mood) }),
            el('div', { class: 'speech' + (ev.score >= 70 ? ' speech--green' : '') }, [
              el('div', { class: 'small', style: { fontWeight: '900' }, text: ev.verdict.emoji + ' ' + ev.score + '/100 · ' + ev.verdict.title }),
              el('div', { class: 'tiny', style: { marginTop: '4px', textTransform: 'none', letterSpacing: '0' },
                text: 'Cumples ' + ev.breakdown.passed + ' de ' + ev.breakdown.total +
                      ' criterios · cada uno vale ' + ev.breakdown.perCriterion + ' puntos' })
            ])
          ]));
          var pts = ev.breakdown.perCriterion;
          var rub = el('div', { class: 'rubric' });
          ev.results.forEach(function (r, i) {
            rub.appendChild(el('div', { class: 'rubric-item ' + (r.ok ? 'ok' : 'no'), style: { animationDelay: (i * .08) + 's' } }, [
              el('span', { class: 'rubric-item__ico', text: r.ok ? '✅' : '⚠️' }),
              el('div', { class: 'grow', style: { minWidth: '0' } }, [
                el('div', { class: 'rubric-item__t', text: r.label }),
                el('div', { class: 'rubric-item__p', text: r.note })
              ]),
              el('span', { class: 'rubric-item__pts' + (r.ok ? ' is-won' : ''), text: '+' + pts })
            ]));
          });
          out.appendChild(rub);
          if (ev.improved && ev.improved.template) {
            out.appendChild(el('div', { class: 'card card--tight', style: { background: 'var(--brand-soft)', borderColor: 'var(--brand)' } }, [
              el('div', { class: 'tiny', style: { color: 'var(--brand)' }, text: 'Plantilla sugerida' }),
              el('div', { class: 'small', style: { marginTop: '6px', whiteSpace: 'pre-wrap' }, text: ev.improved.template })
            ]));
          }
          out.appendChild(UI.btn('Guardar en Mi Negocio', {
            variant: 'green', size: 'sm',
            onClick: function () {
              w.Store.set(function (s) {
                s.dossier[m.dossier] = { answers: { texto: txt }, score: ev.score, at: Date.now(), from: 'mentor' };
              }, 'dossier');
              // También al perfil: es una decisión tomada, no solo una nota.
              w.Venture.absorb('mentor', { texto: txt }, { dossier: m.dossier, score: ev.score, title: m.title });
              w.Engine.checkBadges();
              UI.closeSheet();
              UI.toast('Guardado en Mi Negocio', 'green', '📂');
            }
          }));
          ev.score >= 70 ? w.Sound.correct() : w.Sound.alert();
        }
      }),
      out
    ]);
  }

  /* ------------------------- Auditoría completa del expediente ------------------------- */

  var AUDIT_RUBRICS = {
    idea:      [{ id:'a', label:'Nombra a un cliente específico', check:'audience' },
                { id:'b', label:'Incluye una cifra o un plazo', check:'number' },
                { id:'c', label:'Está escrita en términos verificables', check:'concrete' }],
    problema:  [{ id:'a', label:'Describe un problema real', check:'problem' },
                { id:'b', label:'Recoge datos o palabras del cliente', check:'quote' },
                { id:'c', label:'Es concreto, no una generalidad', check:'concrete' }],
    cliente:   [{ id:'a', label:'El grupo es específico', check:'audience' },
                { id:'b', label:'Menciona una necesidad real', check:'problem' },
                { id:'c', label:'Dice dónde encontrarlos', check:'filled' }],
    oferta:    [{ id:'a', label:'Nombra al cliente', check:'audience' },
                { id:'b', label:'Promete un resultado, no un objeto', check:'outcome' },
                { id:'c', label:'Incluye precio y plazo', check:'quote2' }],
    precio:    [{ id:'a', label:'Tiene costo y precio', check:'numbers' },
                { id:'b', label:'El margen es sano', check:'margin' },
                { id:'c', label:'El precio está justificado', check:'reason' }],
    identidad: [{ id:'a', label:'Nombra a un cliente', check:'audience' },
                { id:'b', label:'Promete un resultado', check:'outcome' },
                { id:'c', label:'Evita frases genéricas', check:'concrete' }],
    canales:   [{ id:'a', label:'Los canales son concretos', check:'concrete' },
                { id:'b', label:'Justificas por qué está ahí tu cliente', check:'reason' },
                { id:'c', label:'Hay una acción semanal medible', check:'measurable' }],
    ventas:    [{ id:'a', label:'El mensaje es personalizado', check:'personal' },
                { id:'b', label:'Incluye precio y plazo', check:'quote2' },
                { id:'c', label:'Hace preguntas, no solo afirma', check:'question' }],
    numeros:   [{ id:'a', label:'Hay cifras reales', check:'numbers' },
                { id:'b', label:'Se puede calcular la utilidad', check:'number' },
                { id:'c', label:'Sacaste una conclusión', check:'reason' }],
    procesos:  [{ id:'a', label:'Tiene al menos 5 pasos', check:'steps' },
                { id:'b', label:'Los pasos empiezan con verbo', check:'verbs' },
                { id:'c', label:'Se puede delegar tal cual está', check:'concrete' }],
    clientes:  [{ id:'a', label:'Hay clientes concretos', check:'concrete' },
                { id:'b', label:'Hay números', check:'number' },
                { id:'c', label:'Identificas qué funcionó', check:'reason' }],
    plan:      [{ id:'a', label:'La meta es medible', check:'measurable' },
                { id:'b', label:'Hay tres acciones con cantidad', check:'steps' },
                { id:'c', label:'Las acciones dependen de ti', check:'controllable' }]
  };

  /** Cuántas secciones del expediente están llenas. */
  function seccionesLlenas() {
    var s = w.Store.state;
    return w.CONFIG.DOSSIER.filter(function (sec) { return !!s.dossier[sec.key]; }).length;
  }

  function fullAudit() {
    var s = w.Store.state;
    var resultados = [];

    w.CONFIG.DOSSIER.forEach(function (sec) {
      var data = s.dossier[sec.key];
      if (!data || !data.answers) return;
      var rubric = AUDIT_RUBRICS[sec.key] || [
        { id: 'a', label: 'Está desarrollado', check: 'filled' },
        { id: 'b', label: 'Es concreto', check: 'concrete' }
      ];
      var ev = w.Mentor.evaluate({ id: 'audit-' + sec.key, rubric: rubric, dossier: sec.key }, data.answers);
      resultados.push({ sec: sec, ev: ev });
    });

    if (!resultados.length) return null;

    var global = Math.round(resultados.reduce(function (a, r) { return a + r.ev.score; }, 0) / resultados.length);
    var fallos = [];
    resultados.forEach(function (r) {
      r.ev.results.forEach(function (x) {
        if (!x.ok) fallos.push({ seccion: r.sec, score: r.ev.score, label: x.label, note: x.note });
      });
    });
    fallos.sort(function (a, b) { return a.score - b.score; });

    return { resultados: resultados, global: global, prioridades: fallos.slice(0, 3),
             pendientes: w.CONFIG.DOSSIER.length - resultados.length };
  }

  function openFullAudit() {
    var a = fullAudit();
    if (!a) {
      UI.toast('Todavía no hay nada que auditar en Mi Negocio', 'red', '📂');
      return false;
    }
    var color = a.global >= 70 ? 'var(--green)' : (a.global >= 45 ? 'var(--gold-dark)' : 'var(--red)');

    var ring = el('div', { class: 'score-ring', style: { '--sc-c': color } }, [
      el('div', { class: 'score-ring__in' }, [
        el('div', { class: 'score-ring__n', style: { color: color }, text: '0' }),
        el('div', { class: 'tiny', text: 'de 100' })
      ])
    ]);
    setTimeout(function () {
      ring.style.setProperty('--p', a.global);
      w.FX.count(ring.querySelector('.score-ring__n'), 0, a.global, 900);
    }, 100);

    var lista = el('div', { class: 'col', style: { gap: '8px' } });
    a.resultados.slice().sort(function (x, y) { return x.ev.score - y.ev.score; }).forEach(function (r) {
      var c = r.ev.score >= 70 ? 'green' : (r.ev.score >= 45 ? 'gold' : 'red');
      lista.appendChild(el('div', { class: 'card card--tight' }, [
        el('div', { class: 'row', style: { gap: '10px' } }, [
          el('span', { style: { fontSize: '20px' }, text: r.sec.icon }),
          el('span', { class: 'small grow', style: { fontWeight: '900' }, text: r.sec.title }),
          el('span', { class: 'small', style: { fontWeight: '900', color: 'var(--' + (c === 'gold' ? 'gold-dark' : c === 'green' ? 'green-dark' : 'red') + ')' },
            text: r.ev.score + '/100' })
        ]),
        el('div', { style: { marginTop: '8px' } }, [UI.pbar(r.ev.score, c, true)])
      ]));
    });

    UI.sheet([
      el('h2', { class: 'h3', text: '🔬 Auditoría de tu negocio' }),
      el('div', { class: 'small', text: a.pendientes
        ? 'Revisé las ' + a.resultados.length + ' secciones que tienes escritas. Faltan ' + a.pendientes + ' por llenar.'
        : 'Revisé las 12 secciones de tu expediente.' }),
      ring,
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(a.global >= 70 ? 'happy' : 'think') }),
        el('div', { class: 'speech' + (a.global >= 70 ? ' speech--green' : '') }, [
          el('div', { class: 'small', text: a.global >= 70
            ? 'Tu negocio está bien definido. Lo que sigue es ejecutar, no seguir puliendo el papel.'
            : (a.global >= 45
              ? 'Tienes la base. Lo que te frena al vender son los tres puntos de abajo.'
              : 'Todavía está muy general. Concretar estas tres cosas cambia por completo tus conversaciones de venta.') })
        ])
      ]),
      a.prioridades.length ? el('h3', { class: 'sep', text: 'Arregla esto primero' }) : null,
      el('div', { class: 'rubric' }, a.prioridades.map(function (p, i) {
        return el('div', { class: 'rubric-item no', style: { animationDelay: (i * 0.1) + 's' } }, [
          el('span', { class: 'rubric-item__ico', text: ['1️⃣', '2️⃣', '3️⃣'][i] }),
          el('div', [
            el('div', { class: 'rubric-item__t', text: p.seccion.icon + ' ' + p.seccion.title + ' — ' + p.label }),
            el('div', { class: 'rubric-item__p', text: p.note })
          ])
        ]);
      })),
      el('h3', { class: 'sep', text: 'Todas las secciones' }),
      lista,
      UI.btn('Ir a Mi Negocio', { variant: 'brand', onClick: function () { UI.closeSheet(); UI.Router.go('business'); } })
    ]);
    w.Sound.cash();
    return true;
  }

  UI.Router.register('mentor', render);
  w.MentorScreen = { audit: openFullAudit, seccionesLlenas: seccionesLlenas };
})(window, document);
