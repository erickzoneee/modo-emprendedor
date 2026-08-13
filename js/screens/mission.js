/* ==========================================================================
   MISIÓN REAL — formulario, evaluación del mentor y recompensa
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  function getMission(params) {
    if (params.boss) {
      var b = w.Engine.bossById(params.id);
      if (!b) return null;
      return {
        id: b.id, boss: true, icon: b.icon, title: b.title, sub: b.subtitle,
        brief: b.brief, fields: b.fields, rubric: b.rubric,
        reward: { xp: b.xp, coins: b.coins }, dossier: b.dossier
      };
    }
    var lesson = w.Engine.lessonById(params.id);
    if (!lesson || !lesson.mission) return null;
    var m = lesson.mission;
    return {
      id: m.id, boss: false, icon: lesson.icon, title: m.title, sub: lesson.title,
      brief: m.brief, fields: m.fields, rubric: m.rubric,
      reward: m.reward, dossier: m.dossier
    };
  }

  function render(params) {
    var m = getMission(params);
    if (!m) return el('div', { class: 'screen', text: 'Misión no encontrada' });

    var saved = w.Store.state.missions[m.id];
    var inputs = {};

    // El desafío se reescribe sobre el negocio del usuario ANTES de pintarlo.
    // Sin esto diría "define a tu cliente ideal"; con esto dice qué tres
    // perfiles concretos podrían comprar lo que él vende.
    var P = w.Personalize.mission(m);
    var campos = P.fields || m.fields;

    var root = el('div', { class: 'col', style: { minHeight: '100%', gap: '0' } });

    root.appendChild(el('div', { class: 'lesson-top' }, [
      UI.backBtn(function () { UI.Router.go('home', {}, 'back'); }),
      el('div', { class: 'grow', style: { minWidth: '0' } }, [
        el('div', { class: 'tiny', text: m.boss ? 'Reto real' : 'Misión aplicada' }),
        el('h1', { class: 'h4', text: m.title })
      ])
    ]));

    var body = el('div', { class: 'screen', style: { paddingTop: '0' } });
    root.appendChild(body);

    var briefEl = el('p', { text: P.brief || m.brief });
    var leerDesafio = function () {
      var partes = [m.title, briefEl.textContent];
      if (P.porque) partes.push('Por qué esto ahora: ' + P.porque);
      campos.forEach(function (f, i) { partes.push('Campo ' + (i + 1) + ': ' + f.label); });
      return partes;
    };
    body.appendChild(el('div', { class: m.boss ? 'mission-hero' : 'mission-hero', style: m.boss ? {} : { background: 'linear-gradient(140deg, var(--brand), var(--brand-2))', boxShadow: '0 6px 0 var(--brand-dark)' } }, [
      el('div', { class: 'mission-hero__tag', text: m.boss ? '👑 Jefe final' : '🎯 Misión del mundo real' }),
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('span', { style: { fontSize: '34px' }, text: m.icon }),
        el('div', [
          el('h2', { text: m.title }),
          briefEl
        ])
      ])
    ]));

    // Con la IA activa, se pide una versión aún más ajustada y se sustituye
    // en caliente. Mientras tanto ya hay un desafío personalizado en pantalla.
    w.Personalize.upgrade(w.Personalize.missionAI(m), function (txt) {
      briefEl.textContent = txt;
    });

    var t = w.Venture.terms();
    body.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
      el('div', { class: 'speech' }, [
        el('div', { class: 'small',
          text: m.boss
            ? 'Hazlo primero en la vida real con ' + t.tuProducto + '. Después regresa y repórtalo aquí con datos concretos: lo reviso y te digo qué falta.'
            : 'Contesta con datos reales de ' + t.negocio + '. Entre más concreto, mejor te puedo ayudar.' }),
        P.porque ? el('div', { class: 'tiny', style: { marginTop: '8px', textTransform: 'none', letterSpacing: '0' },
          text: '¿Por qué esto ahora? ' + P.porque }) : null,
        (w.Speech && w.Speech.supported() && w.Store.state.settings.speech !== false)
          ? el('div', { class: 'row', style: { gap: '8px', marginTop: '10px' } },
              [w.Speech.button(leerDesafio, { text: 'Escuchar el desafío' })])
          : null
      ])
    ]));

    var form = el('div', { class: 'col stagger', style: { gap: '14px' } });
    campos.forEach(function (f) {
      var input;
      if (f.type === 'area') {
        input = el('textarea', { class: 'textarea', placeholder: f.ph || '', rows: '4' });
      } else if (f.type === 'num') {
        input = el('input', { class: 'input', type: 'number', inputmode: 'decimal', placeholder: f.ph || '0' });
      } else {
        input = el('input', { class: 'input', type: 'text', placeholder: f.ph || '' });
      }
      if (saved && saved.answers && saved.answers[f.key]) input.value = saved.answers[f.key];
      inputs[f.key] = input;
      form.appendChild(el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: f.label }),
        input
      ]));
    });
    body.appendChild(form);

    // Los criterios se anuncian ANTES de escribir, con su valor en puntos:
    // así la calificación nunca aparece como una sorpresa.
    var puntos = m.rubric.length ? Math.round(100 / m.rubric.length) : 0;
    var rubricPreview = el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
      el('h2', { class: 'tiny', text: 'El mentor va a revisar ' + m.rubric.length + ' criterios' }),
      el('ul', { style: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' } },
        m.rubric.map(function (r) {
          return el('li', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'flex-start' } }, [
            el('span', { text: '○' }),
            el('span', { class: 'grow', text: r.label }),
            el('span', { class: 'rubric-item__pts', text: '+' + puntos })
          ]);
        })),
      el('div', { class: 'tiny', style: { marginTop: '10px', textTransform: 'none', letterSpacing: '0' },
        text: 'Cada criterio cumplido suma ' + puntos + ' puntos. Necesitas ' +
              w.Mentor.PASS_MARK + ' de 100 para entregarla.' })
    ]);
    body.appendChild(rubricPreview);

    var out = el('div', { class: 'col', style: { gap: '14px' } });
    body.appendChild(out);

    body.appendChild(el('div', { class: 'col', style: { marginTop: 'auto', paddingTop: '10px' } }, [
      UI.btn('Que lo revise el mentor', {
        variant: 'purple', size: 'lg', shiny: true,
        onClick: function () { review(m, inputs, out, rubricPreview); }
      })
    ]));

    if (saved && saved.done) {
      setTimeout(function () { review(m, inputs, out, rubricPreview, true); }, 150);
    }
    return root;
  }

  /* ------------------------- De dónde sale la nota ------------------------- */

  function scoreRow(k, v, hint, strong) {
    return el('div', { class: 'score-row' + (strong ? ' is-total' : '') }, [
      el('span', { class: 'score-row__k' }, [
        el('span', { text: k }),
        hint ? el('span', { class: 'score-row__hint', text: hint }) : null
      ]),
      el('span', { class: 'score-row__v', text: v })
    ]);
  }

  /** Muestra el cálculo completo: la nota nunca debe sentirse arbitraria. */
  function scoreCard(ev) {
    var b = ev.breakdown;
    var card = el('div', { class: 'card card--tight score-card' });

    card.appendChild(el('h3', { class: 'tiny', text: 'Cómo se calcula esta nota' }));

    var rows = el('div', { style: { marginTop: '8px' } });
    rows.appendChild(scoreRow(
      'Criterios cumplidos',
      b.passed + ' de ' + b.total,
      b.total ? 'cada uno vale ' + b.perCriterion + ' puntos' : null
    ));
    if (b.bonus) {
      rows.appendChild(scoreRow('Bono por desarrollo', '+' + b.bonus,
        'escribiste más de ' + b.deepAt + ' palabras'));
    }
    if (b.brevity < 0) {
      rows.appendChild(scoreRow('Penalización por brevedad', String(b.brevity),
        'solo ' + UI.count(b.words, 'palabra', 'palabras') + '; el mínimo son ' + b.shortAt));
    } else if (b.brevity > 0) {
      // El "-15" tiene suelo: aquí no restó, sostuvo la nota en el mínimo.
      rows.appendChild(scoreRow('Nota mínima', String(b.floor),
        'ningún intento baja de ' + b.floor + ' puntos'));
    }
    rows.appendChild(scoreRow('Tu nota', ev.score + ' / 100', null, true));
    card.appendChild(rows);

    // Qué falta exactamente y cuánto sube arreglarlo
    if (ev.score < b.passMark) {
      var faltan = b.passMark - ev.score;
      var criterios = b.perCriterion ? Math.ceil(faltan / b.perCriterion) : 1;
      card.appendChild(el('div', { class: 'score-note score-note--warn' }, [
        el('b', { text: 'Para entregarla necesitas ' + b.passMark + '.' }),
        ' Te faltan ' + faltan + ' puntos: con ' +
        UI.count(Math.min(criterios, b.missing.length || criterios), 'criterio', 'criterios') +
        ' más de los marcados abajo ya la entregas.'
      ]));
    } else if (b.missing.length) {
      card.appendChild(el('div', { class: 'score-note' }, [
        el('b', { text: 'Ya puedes entregarla.' }),
        ' Si arreglas ' + UI.count(b.missing.length, 'criterio pendiente', 'criterios pendientes') +
        ' subes hasta ' + Math.min(100, ev.score + b.missing.length * b.perCriterion) + '.'
      ]));
    } else {
      card.appendChild(el('div', { class: 'score-note score-note--ok' }, [
        el('b', { text: 'Cumpliste todos los criterios.' }),
        ' No hay nada que corregir.'
      ]));
    }

    return card;
  }

  /* ------------------------- Revisión ------------------------- */

  function review(m, inputs, out, rubricPreview, silent) {
    var answers = {};
    var empty = 0;
    Object.keys(inputs).forEach(function (k) {
      answers[k] = (inputs[k].value || '').trim();
      if (!answers[k]) empty++;
    });

    if (empty === Object.keys(inputs).length) {
      UI.toast('Llena al menos un campo para que pueda revisarlo', 'red', '✍️');
      return;
    }

    var evaluation = w.Mentor.evaluate(m, answers);
    rubricPreview.style.display = 'none';
    UI.clear(out);

    var color = evaluation.score >= 70 ? 'var(--green)' : (evaluation.score >= 45 ? 'var(--gold-dark)' : 'var(--red)');

    var ring = el('div', { class: 'score-ring', style: { '--sc-c': color } }, [
      el('div', { class: 'score-ring__in' }, [
        el('div', { class: 'score-ring__n', style: { color: color }, text: '0' }),
        el('div', { class: 'tiny', text: 'de 100' })
      ])
    ]);
    setTimeout(function () {
      ring.style.setProperty('--p', evaluation.score);
      w.FX.count(ring.querySelector('.score-ring__n'), 0, evaluation.score, 900);
    }, 100);

    out.appendChild(el('h2', { class: 'sep', text: 'Evaluación del mentor' }));
    out.appendChild(ring);

    out.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot', html: w.Mascot.svg(evaluation.verdict.mood) }),
      el('div', { class: 'speech' + (evaluation.score >= 70 ? ' speech--green' : '') }, [
        el('div', { class: 'h4', text: evaluation.verdict.emoji + ' ' + evaluation.verdict.title }),
        el('div', { class: 'small', style: { marginTop: '4px' }, text: evaluation.verdict.text })
      ])
    ]));

    out.appendChild(scoreCard(evaluation));

    out.appendChild(el('h3', { class: 'sep', text: 'Criterio por criterio' }));
    var pts = evaluation.breakdown.perCriterion;
    var rub = el('div', { class: 'rubric' });
    evaluation.results.forEach(function (r, i) {
      rub.appendChild(el('div', { class: 'rubric-item ' + (r.ok ? 'ok' : 'no'), style: { animationDelay: (i * 0.09) + 's' } }, [
        el('span', { class: 'rubric-item__ico', text: r.ok ? '✅' : '⚠️' }),
        el('div', { class: 'grow', style: { minWidth: '0' } }, [
          el('div', { class: 'rubric-item__t', text: r.label }),
          el('div', { class: 'rubric-item__p', text: r.note })
        ]),
        el('span', {
          class: 'rubric-item__pts' + (r.ok ? ' is-won' : ''),
          title: r.ok ? 'Criterio cumplido' : 'Arreglarlo suma ' + pts + ' puntos',
          text: (r.ok ? '+' : '+') + pts
        })
      ]));
    });
    out.appendChild(rub);

    if (evaluation.improved && evaluation.improved.template) {
      out.appendChild(el('div', { class: 'card', style: { background: 'var(--brand-soft)', borderColor: 'var(--brand)' } }, [
        el('div', { class: 'tiny', style: { color: 'var(--brand)' }, text: 'Plantilla sugerida' }),
        el('div', { class: 'small', style: { marginTop: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6' },
          text: evaluation.improved.template }),
        el('div', { class: 'row', style: { gap: '8px', marginTop: '12px' } }, [
          UI.btn('Copiar', { variant: 'ghost', size: 'sm', block: false,
            onClick: function () { UI.copy(evaluation.improved.template); } })
        ])
      ]));
    }

    var already = w.Store.state.missions[m.id] && w.Store.state.missions[m.id].done;
    var actions = el('div', { class: 'col', style: { gap: '10px' } });

    if (evaluation.score >= evaluation.breakdown.passMark || already) {
      actions.appendChild(UI.btn(already ? 'Guardar cambios' : 'Entregar misión (+' + m.reward.xp + ' XP)', {
        variant: 'green', size: 'lg', shiny: !already,
        onClick: function () { deliver(m, answers, evaluation, already); }
      }));
      if (!already) actions.appendChild(el('div', { class: 'tiny t-center', text: 'Se guardará en Mi Negocio' }));
    } else {
      actions.appendChild(el('div', { class: 'card card--tight', style: { background: 'var(--gold-soft)', borderColor: 'var(--gold)' } }, [
        el('div', { class: 'small', style: { fontWeight: '800', color: 'var(--gold-dark)' },
          text: '💡 Ajusta los criterios marcados con ⚠️ y vuelve a pedir revisión. Necesitas ' +
                evaluation.breakdown.passMark + ' puntos para entregarla — no por exigencia, sino porque debajo de eso todavía no te sirve para vender.' })
      ]));
      actions.appendChild(UI.btn('Revisar de nuevo', {
        variant: 'purple',
        onClick: function () { review(m, inputs, out, rubricPreview); }
      }));
      actions.appendChild(UI.btn('Entregar de todas formas', {
        variant: 'flat',
        onClick: function () { deliver(m, answers, evaluation, already); }
      }));
    }
    out.appendChild(actions);
    out.classList.add('anim-in');

    if (!silent) {
      if (evaluation.score >= 70) { w.Sound.correct(); w.FX.burst(ring, { count: 22 }); }
      else w.Sound.alert();
    }
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------- Entrega ------------------------- */

  function deliver(m, answers, evaluation, already) {
    var first = w.Engine.completeMission(m.id, answers, evaluation, m.dossier);

    // Lo que acaba de escribir pasa al nivel 2 del perfil: a partir de ahora el
    // mentor lo da por sabido, los desafíos lo usan y el plan se recalcula.
    try {
      w.Venture.absorb(m.boss ? 'reto-real' : 'mision', answers, {
        id: m.id, dossier: m.dossier, title: m.title,
        score: evaluation.score, boss: !!m.boss
      });
    } catch (e) { console.warn('[venture] no se pudo absorber la misión:', e); }

    if (first) {
      w.Engine.addXP(m.reward.xp);
      w.Engine.addCoins(m.reward.coins);
      w.Sound.complete();
      w.FX.celebrate();
      UI.modal([
        el('div', { style: { position: 'relative', display: 'grid', placeItems: 'center' } }, [
          el('div', { class: 'rays' }),
          el('div', { class: 'mascot mascot--lg is-party', html: w.Mascot.svg('party') })
        ]),
        el('div', { class: 'tiny c-brand', text: m.boss ? 'Reto real superado' : 'Misión entregada' }),
        el('h3', { class: 'h2', text: m.title }),
        el('div', { class: 'row center wrap', style: { gap: '8px' } }, [
          UI.chip('+' + m.reward.xp + ' XP', 'gold', '⚡'),
          UI.chip('+' + m.reward.coins, 'gold', '🪙'),
          m.dossier ? UI.chip('Guardado en Mi Negocio', 'green', '📂') : null
        ]),
        el('p', { class: 'p', text: m.boss
          ? 'Acabas de hacer algo que la mayoría nunca hace: llevarlo al mundo real. Eso es lo que separa un curso de un negocio.'
          : 'Ya forma parte de tu expediente. Puedes editarlo cuando quieras.' }),
        UI.btn('Continuar', { variant: 'brand', onClick: function () {
          UI.closeModal();
          UI.Router.go('home', {}, 'back');
        } })
      ], { dismissible: false });
    } else {
      UI.toast('Cambios guardados', 'green', '💾');
      w.Sound.coin();
      if (!already) UI.Router.go('home', {}, 'back');
    }
  }

  UI.Router.register('mission', render);
})(window, document);
