/* ==========================================================================
   MI NEGOCIO — expediente que se llena con las misiones reales
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;

  function render() {
    var s = w.Store.state;
    var filled = C.DOSSIER.filter(function (sec) { return !!s.dossier[sec.key]; }).length;
    var pct = (filled / C.DOSSIER.length) * 100;

    var root = el('div', { class: 'screen' });

    root.appendChild(el('div', { class: 'dossier-hero' }, [
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('div', { class: 'grow' }, [
          el('div', { class: 'tiny', style: { color: '#fff', opacity: '.85' }, text: 'Mi Negocio' }),
          el('h1', { text: s.profile.businessName || 'Tu expediente' }),
          el('p', { text: filled + ' de ' + C.DOSSIER.length + ' secciones completas' })
        ]),
        el('div', { style: { fontSize: '38px' }, text: filled === C.DOSSIER.length ? '🏆' : '📂' })
      ]),
      el('div', { style: { marginTop: '14px' } }, [UI.pbar(pct, 'gold')])
    ]));

    root.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
      el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg(filled >= 6 ? 'happy' : 'neutral') }),
      el('div', { class: 'speech' }, [
        el('div', { class: 'small', text: filled === 0
          ? 'Aquí se va guardando tu negocio real. Cada misión que entregas llena una sección. Al final tendrás un plan completo, no un certificado.'
          : (filled < 6 ? 'Vas construyendo tu plan. Toca cualquier sección para verla, editarla o pedirme una revisión.'
                        : 'Tu expediente ya tiene forma de negocio de verdad. Puedes exportarlo y usarlo tal cual.') })
      ])
    ]));

    // El expediente es el detalle; el perfil del emprendimiento es el contexto
    // que alimenta al resto de la app. Se enlazan en los dos sentidos.
    root.appendChild(el('button', {
      class: 'card card--tight', type: 'button',
      style: { display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', width: '100%' },
      onclick: function () { w.Sound.tap(); UI.Router.go('venture'); }
    }, [
      el('span', { style: { fontSize: '22px', flex: 'none' }, text: '🧭' }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'small', style: { display: 'block', fontWeight: '900' }, text: 'Mi emprendimiento' }),
        el('span', { class: 'tiny', style: { display: 'block', textTransform: 'none', letterSpacing: '0' },
          text: w.Venture.util.shorten(w.Venture.summary(), 110) })
      ]),
      el('span', { style: { flex: 'none', fontSize: '18px' }, text: '›' })
    ]));

    /* La puerta permanente a compartir un avance. El ofrecimiento automático
       sale una vez y quien dice «ahora no» no debería perder los diseños para
       siempre. Solo se pinta si de verdad hay algo publicable: una entrada que
       lleva a «todavía no hay datos» es peor que no tenerla. */
    if (w.CompartirAvance && w.CompartirAvance.hayAlgo && w.CompartirAvance.hayAlgo()) {
      root.appendChild(el('button', {
        class: 'card card--tight', type: 'button',
        style: { display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', width: '100%' },
        onclick: function () { w.Sound.tap(); w.CompartirAvance.elegir(); }
      }, [
        el('span', { style: { fontSize: '22px', flex: 'none' }, text: '📣' }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'small', style: { display: 'block', fontWeight: '900' }, text: 'Compartir un avance' }),
          el('span', { class: 'tiny', style: { display: 'block', textTransform: 'none', letterSpacing: '0' },
            text: 'Un visual con lo que ya contaste, listo para publicar' })
        ]),
        el('span', { style: { flex: 'none', fontSize: '18px' }, text: '›' })
      ]));
    }

    /* La puerta a la Plaza. Vive aquí y no en la barra de abajo a propósito:
       hasta que haya vecinos de verdad, una pestaña permanente llevaría cada
       día a «todavía no hay nadie», y eso es una promesa incumplida a la vista
       todos los días. Cuando la Plaza abra, sube a pestaña.

       Misma regla que la puerta de arriba: solo se pinta si ya hay una vitrina
       que enseñar. Si le falta lo imprescindible, esto llevaría a una lista de
       huecos, que es justo lo que no queremos que vea primero. */
    if (w.PlazaScreen && w.PlazaScreen.hayAlgo && w.PlazaScreen.hayAlgo()) {
      var puestoAbierto = w.Plaza && w.Plaza.abierta();
      root.appendChild(el('button', {
        class: 'card card--tight', type: 'button',
        style: { display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', width: '100%' },
        onclick: function () { w.Sound.tap(); w.PlazaScreen.open(); }
      }, [
        el('span', { style: { fontSize: '22px', flex: 'none' }, text: '🏪' }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'small', style: { display: 'block', fontWeight: '900' }, text: 'La Plaza' }),
          el('span', { class: 'tiny', style: { display: 'block', textTransform: 'none', letterSpacing: '0' },
            text: puestoAbierto ? 'Tu puesto está guardado. Todavía no lo ve nadie'
                                : 'Arma tu vitrina con lo que ya contaste' })
        ]),
        el('span', { style: { flex: 'none', fontSize: '18px' }, text: '›' })
      ]));
    }

    var list = el('div', { class: 'col stagger', style: { gap: '10px' } });
    C.DOSSIER.forEach(function (sec) {
      var data = s.dossier[sec.key];
      var preview = data ? summarize(data) : w.Personalize.dossierHint(sec);
      var item = el('button', {
        class: 'doss-item' + (data ? ' is-filled' : ''), type: 'button',
        onclick: function () { w.Sound.tap(); openSection(sec, data); }
      }, [
        el('span', { class: 'doss-item__ico', text: sec.icon }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'doss-item__t', text: sec.title }),
          el('span', { class: 'doss-item__p', text: preview })
        ]),
        el('span', { style: { fontSize: '18px', flex: 'none', color: data ? 'var(--teal)' : 'var(--ink-3)' },
          text: data ? '✓' : '›' })
      ]);
      list.appendChild(item);
    });
    root.appendChild(list);

    root.appendChild(el('h2', { class: 'sep', text: 'Exportar' }));
    root.appendChild(el('div', { class: 'grid-2', style: { gap: '10px' } }, [
      UI.btn('Copiar plan', { variant: 'ghost', size: 'sm', onClick: function () { UI.copy(buildPlan()); } }),
      UI.btn('Descargar .txt', { variant: 'ghost', size: 'sm', onClick: function () {
        UI.download('mi-negocio.txt', buildPlan());
        UI.toast('Descargado', 'green', '⬇️');
      } })
    ]));
    root.appendChild(UI.btn('Ver plan completo', { variant: 'brand', onClick: showPlan }));

    return root;
  }

  function summarize(data) {
    if (!data || !data.answers) return '';
    var vals = Object.keys(data.answers).map(function (k) { return data.answers[k]; }).filter(Boolean);
    return vals.join(' · ').slice(0, 160);
  }

  /* ------------------------- Detalle de sección ------------------------- */

  function openSection(sec, data) {
    var content = [
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('span', { style: { fontSize: '30px' }, text: sec.icon }),
        el('div', { class: 'grow' }, [
          el('h2', { class: 'h3', text: sec.title }),
          el('div', { class: 'small', text: w.Personalize.dossierHint(sec) })
        ])
      ])
    ];

    if (data && data.answers) {
      var box = el('div', { class: 'card card--tight' });
      Object.keys(data.answers).forEach(function (k) {
        if (!data.answers[k]) return;
        box.appendChild(el('div', { class: 'kv', style: { flexDirection: 'column', alignItems: 'flex-start', gap: '2px' } }, [
          el('span', { class: 'kv__k', text: labelize(k) }),
          el('span', { class: 'small', style: { fontWeight: '700', color: 'var(--ink)', whiteSpace: 'pre-wrap', textAlign: 'left' },
            text: data.answers[k] })
        ]));
      });
      content.push(box);
      if (data.score != null) {
        content.push(el('div', { class: 'row', style: { gap: '8px' } }, [
          UI.chip('Evaluación: ' + data.score + '/100', data.score >= 70 ? 'green' : 'gold', '🧠'),
          UI.chip(new Date(data.at).toLocaleDateString('es-MX'), null, '📅')
        ]));
      }
      content.push(UI.btn('Editar esta sección', {
        variant: 'ghost',
        onClick: function () { UI.closeSheet(); editSection(sec, data); }
      }));
    } else {
      content.push(el('div', { class: 'empty' }, [
        el('div', { class: 'empty__ico', text: '📝' }),
        el('div', { class: 'small', text: 'Todavía vacío. Se llena cuando completas la misión correspondiente en la ruta, o puedes escribirlo tú ahora.' })
      ]));
      content.push(UI.btn('Escribirlo ahora', {
        variant: 'brand',
        onClick: function () { UI.closeSheet(); editSection(sec, null); }
      }));
    }

    UI.sheet(content);
  }

  function labelize(k) {
    var map = {
      idea: 'Idea', texto: 'Texto', grupo: 'Grupo', necesidad: 'Necesidad', donde: 'Dónde',
      pago: 'Cuánto pagan', oferta: 'Oferta', incluye: 'Incluye', garantia: 'Garantía',
      costo: 'Costo', precio: 'Precio', razon: 'Razón', mercado: 'Mercado', valor: 'Valor',
      meta: 'Meta', a1: 'Acción 1', a2: 'Acción 2', a3: 'Acción 3', indicador: 'Indicador',
      pasos: 'Pasos', nombre: 'Nombre', disparador: 'Disparador', fallos: 'Si algo falla',
      mensaje: 'Mensaje', canal1: 'Canal 1', canal2: 'Canal 2', accion1: 'Acción semanal 1',
      accion2: 'Acción semanal 2', ingresos: 'Ingresos', gastos: 'Gastos', fijos: 'Costos fijos',
      variable: 'Costo variable', pitch: 'Pitch', o1: 'Objeción 1', o2: 'Objeción 2', o3: 'Objeción 3'
    };
    return map[k] || (k.charAt(0).toUpperCase() + k.slice(1));
  }

  function editSection(sec, data) {
    var ta = el('textarea', { class: 'textarea', rows: '7', placeholder: w.Personalize.dossierHint(sec) });
    if (data && data.answers) {
      ta.value = Object.keys(data.answers).map(function (k) {
        return labelize(k) + ': ' + data.answers[k];
      }).join('\n');
    }
    UI.sheet([
      el('h2', { class: 'h3', text: 'Editar · ' + sec.title }),
      el('div', { class: 'small', text: w.Personalize.dossierHint(sec) }),
      ta,
      UI.btn('Guardar', {
        variant: 'green',
        onClick: function () {
          var txt = (ta.value || '').trim();
          if (!txt) { UI.toast('Escribe algo primero', 'red', '✍️'); return; }
          w.Store.set(function (s) {
            s.dossier[sec.key] = { answers: { texto: txt }, score: null, at: Date.now(), from: 'manual' };
          }, 'dossier');
          // Escribirlo a mano cuenta igual: entra al nivel 2 del perfil.
          w.Venture.absorb('expediente', { texto: txt }, { dossier: sec.key, title: sec.title });
          w.Engine.checkBadges();
          UI.closeSheet();
          UI.toast('Guardado', 'green', '💾');
          w.Sound.coin();
          UI.Router.refresh();
        }
      })
    ]);
  }

  /* ------------------------- Plan completo ------------------------- */

  function buildPlan() {
    var s = w.Store.state;
    var v = w.Venture.active();
    var t = w.Venture.terms();
    var out = [];
    out.push('MI NEGOCIO — ' + (s.profile.businessName || 'Plan de emprendimiento'));
    out.push('Generado con Modo Emprendedor · ' + new Date().toLocaleDateString('es-MX'));
    out.push('');

    // El plan exportado empieza por el perfil: sin él, las secciones no se
    // entienden fuera de la app.
    out.push('===================================');
    out.push('PERFIL DEL EMPRENDIMIENTO');
    out.push('===================================');
    out.push(w.Venture.summary());
    out.push('');
    out.push('Idea: ' + (v.core.idea || '(pendiente)'));
    out.push('Producto o servicio: ' + (v.core.offer || '(pendiente)'));
    out.push('Clientes: ' + (v.core.customer || '(pendiente)'));
    out.push('Etapa: ' + t.etapaCorta);
    out.push('Objetivo: ' + (t.objetivo || '(pendiente)'));
    out.push('Recursos: ' + [t.presupuesto, t.minutos ? t.minutos + ' min/día' : '', t.experiencia]
      .filter(Boolean).join(' · '));
    out.push('');

    // Análisis calculados sobre sus datos: valor, cliente, mercado, modelo,
    // ventas, costos y marca.
    w.Personalize.kinds().forEach(function (k) {
      var a = w.Personalize.analysis(k.key);
      out.push('-----------------------------------');
      out.push(a.title.toUpperCase());
      out.push('-----------------------------------');
      if (a.ia) out.push(a.ia);
      else {
        a.lines.forEach(function (l) { out.push('· ' + l); });
        a.gaps.forEach(function (g) { out.push('PENDIENTE: ' + g); });
      }
      out.push('');
    });

    C.DOSSIER.forEach(function (sec) {
      var data = s.dossier[sec.key];
      out.push('===================================');
      out.push(sec.title.toUpperCase());
      out.push('===================================');
      if (data && data.answers) {
        Object.keys(data.answers).forEach(function (k) {
          if (data.answers[k]) out.push(labelize(k) + ': ' + data.answers[k]);
        });
      } else {
        out.push('(pendiente)');
      }
      out.push('');
    });
    out.push('===================================');
    out.push('OBJETIVOS, TAREAS Y RESULTADOS');
    out.push('===================================');
    if (v.objectives.length) {
      v.objectives.forEach(function (o) {
        out.push((o.done ? '[x] ' : '[ ] ') + o.text + (o.metric ? ' — ' + o.metric : ''));
      });
    } else out.push('(sin objetivos escritos)');
    out.push('');
    var abiertas = v.tasks.filter(function (x) { return !x.done; });
    out.push('Tareas pendientes:');
    if (abiertas.length) abiertas.forEach(function (x) { out.push('· ' + x.text); });
    else out.push('(ninguna)');
    out.push('');
    if (v.results.length) {
      out.push('Resultados logrados:');
      v.results.slice(-10).forEach(function (r) {
        out.push('· ' + r.text + ' (' + new Date(r.at).toLocaleDateString('es-MX') + ')');
      });
      out.push('');
    }

    var p = w.Engine.overallProgress();
    out.push('-----------------------------------');
    out.push('Progreso en la ruta: ' + p.done + '/' + p.total + ' paradas completadas');
    out.push('(' + w.LESSONS.length + ' lecciones + ' + C.BOSSES.length + ' retos reales)');
    out.push(UI.num(s.xp) + ' XP · racha de ' + UI.days(s.streak));
    return out.join('\n');
  }

  function showPlan() {
    var s = w.Store.state;
    var wrap = el('div', { class: 'col', style: { gap: '14px', textAlign: 'left' } });
    wrap.appendChild(el('h2', { class: 'h3', text: 'Plan completo' }));
    C.DOSSIER.forEach(function (sec) {
      var data = s.dossier[sec.key];
      wrap.appendChild(el('div', { class: 'card card--tight', style: data ? {} : { opacity: '.5' } }, [
        el('div', { class: 'row', style: { gap: '8px' } }, [
          el('span', { text: sec.icon }),
          el('span', { class: 'small', style: { fontWeight: '900' }, text: sec.title })
        ]),
        el('div', { class: 'small', style: { marginTop: '6px', whiteSpace: 'pre-wrap' },
          text: data ? summarize(data) : 'Pendiente' })
      ]));
    });
    wrap.appendChild(UI.btn('Copiar todo', { variant: 'brand', onClick: function () { UI.copy(buildPlan()); } }));
    UI.sheet(wrap);
  }

  UI.Router.register('business', render);
})(window, document);
