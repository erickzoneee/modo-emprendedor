/* ==========================================================================
   HOME — mapa de la ruta del emprendedor
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el, C = w.CONFIG;
  var WAVE = [0, 42, 66, 42, 0, -42, -66, -42];

  function render() {
    var root = el('div', { class: 'screen home' });
    var ps = w.Engine.pathState();

    // Encabezado de la pantalla para lectores de pantalla: visualmente el
    // título lo da el mapa, pero la jerarquía tiene que existir igual.
    root.appendChild(el('h1', { class: 'sr-only', text: 'Tu ruta de emprendimiento' }));

    /* El orden de estas tres tarjetas depende del negocio: quien todavía está
       definiendo su idea necesita el perfil delante; quien ya vende necesita
       la tarea del día. Lo decide js/core/persona.js, y si no hay nada que
       decidir devuelve la lista tal cual. Se reordena, nunca se filtra. */
    var MODULOS = [
      { id: 'venture', build: ventureStrip },
      { id: 'daily',   build: dailyCard },
      { id: 'weekly',  build: weeklyStrip }
    ];
    var orden = w.Persona ? w.Persona.ordenPanel(MODULOS) : MODULOS;
    orden.forEach(function (m) { root.appendChild(m.build()); });

    var currentLevel = -1;
    var container = el('div', { class: 'col', style: { gap: '0' } });

    ps.forEach(function (item, i) {
      if (item.node.level !== currentLevel) {
        currentLevel = item.node.level;
        container.appendChild(unitHeader(currentLevel));
      }
      container.appendChild(nodeRow(item, i));
      if (i < ps.length - 1 && ps[i + 1].node.level === currentLevel) {
        // El tramo sabe qué une: por eso puede pintarse como recorrido o
        // como camino por recorrer en vez de como dos puntos grises.
        container.appendChild(connector(i, item, ps[i + 1]));
      }
    });

    root.appendChild(container);
    root.appendChild(finale(ps));
    return root;
  }

  /* ------------------------- Encabezado del negocio -------------------------
     La ruta no es un temario: es la ruta de SU negocio. Esta tira lo recuerda
     y da acceso directo al perfil del emprendimiento.
     ------------------------------------------------------------------------ */

  function ventureStrip() {
    var t = w.Venture.terms();
    var comp = w.Venture.completeness();
    var enfoque = w.Personalize.focus();

    return el('button', {
      class: 'card card--tight', type: 'button',
      style: { display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', width: '100%' },
      onclick: function () { w.Sound.tap(); UI.Router.go('venture'); }
    }, [
      el('span', { style: { fontSize: '22px', flex: 'none' }, text: comp.esenciales.length ? '🧭' : '🚀' }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'tiny', style: { display: 'block' },
          text: t.negocio + ' · ' + t.etapaCorta }),
        el('span', { class: 'small', style: { display: 'block', fontWeight: '800', lineHeight: '1.35' },
          text: enfoque || 'Registra tu idea para personalizar la ruta' })
      ]),
      el('span', { style: { flex: 'none', fontSize: '18px' }, text: '›' })
    ]);
  }

  /* ------------------------- Misión del día ------------------------- */

  function dailyCard() {
    var dm = w.Engine.dailyMission();
    var s = w.Store.state;
    var pct = Math.min(100, (s.xpToday / s.dailyGoal) * 100);
    var doneToday = s.xpToday >= s.dailyGoal;

    var card = el('button', { class: 'daily-card', type: 'button', onclick: function () {
      w.Sound.tap();
      if (dm) openNode(dm.id);
    } }, [
      el('span', { class: 'daily-card__ico' + (doneToday ? '' : ' flame'), text: doneToday ? '✅' : (dm ? dm.icon : '🎉') }),
      // Columna propia: si estos tres textos se dejan en flujo en línea,
      // sus cajas de línea se solapan y el rótulo se encima con el título.
      el('span', { class: 'grow daily-card__body' }, [
        el('span', { class: 'daily-card__k',
          text: doneToday ? 'Meta diaria cumplida' : 'Misión del día' }),
        el('span', { class: 'daily-card__t', text: dm ? dm.title : 'Ruta completada' }),
        // El subtítulo describe lo que va a hacer con SU negocio, no el temario.
        el('span', { class: 'daily-card__s',
          text: dm ? w.Personalize.dailyLine(dm, dm.sub) : 'Sigue tu plan de 90 días' })
      ]),
      el('span', { style: { fontSize: '22px' }, text: '›' })
    ]);

    // Esta fila no tiene tarjeta debajo: se apoya en el telón de la Ruta. Por
    // eso el contador lleva clase propia y no el gris de --ink-3.
    var meta = el('div', { class: 'row', style: { gap: '10px', marginTop: '10px' } }, [
      el('span', { class: 'tiny nowrap daily-xp', text: s.xpToday + '/' + s.dailyGoal + ' XP' }),
      UI.pbar(pct, 'gold', true)
    ]);

    return el('div', { class: 'col', style: { gap: '0' } }, [card, meta]);
  }

  /* ------------------------- Retos semanales -------------------------

     La sección se pliega. Cerrada deja solo una barra: título, cuántos retos
     van y —si hay un premio ganado— una ficha dorada, porque esconder los
     retos no puede significar esconder una recompensa que el usuario ya se
     ganó y todavía no ha recogido.

     POR QUÉ LA ALTURA SE ANIMA EN PÍXELES MEDIDOS
     `max-height` con un número inventado hace que el cierre empiece tarde y la
     apertura acabe pronto; el truco de grid `0fr → 1fr` obliga a dejar el
     cuerpo recortado también cuando está abierto. Aquí se mide la altura real,
     se interpola, y al terminar de abrir se devuelve a `auto` con el recorte
     quitado: así el carrusel recupera su sangrado hasta el borde de la
     pantalla y la sombra de las tarjetas no queda cortada.

     Y mientras se mueve, el recorte no se nota porque el cuerpo ocupa el ancho
     completo del teléfono (margen negativo), que es justo donde el carrusel ya
     se cortaba antes.

     EL DESPLAZAMIENTO HORIZONTAL SOBREVIVE
     Abrir y cerrar no vuelve a pintar la pantalla: se guarda la preferencia
     con Store.set —que no redibuja— y se mueve el nodo que ya existe. Las
     tarjetas son las mismas de siempre, con su scroll donde el usuario lo
     dejó.
     ------------------------------------------------------------------ */

  /* Tiene pareja: la transición de .acc__body en css/screens.css. Es el plazo
     tras el que la altura vuelve a `auto`; si se cambia aquí hay que cambiarla
     allí, o el cuerpo se soltaría antes de terminar de crecer. */
  var RETOS_MS = 260;
  var CHEVRON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="3.2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M6 9l6 6 6-6"/></svg>';

  /** ¿El usuario pidió menos movimiento? Se consulta en cada toque y no una
      vez al cargar: la preferencia del sistema se puede cambiar con la app
      abierta. */
  function quieto() {
    try { return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }

  /** El estado de reposo del cuerpo, sin animación de por medio.

      `visibility: hidden` y no solo `height: 0`: un bloque recortado sigue
      siendo alcanzable con el tabulador y sigue existiendo para el lector de
      pantalla. Sin esto, cerrar los retos los escondía de los ojos y los
      dejaba en el camino del teclado —cinco tarjetas invisibles entre la
      misión del día y la primera parada de la Ruta. */
  function reposo(cuerpo, abierto) {
    if (abierto) {
      cuerpo.style.visibility = '';
      cuerpo.style.overflow = '';
      cuerpo.style.height = 'auto';
    } else {
      cuerpo.style.visibility = 'hidden';
      cuerpo.style.overflow = 'hidden';
      cuerpo.style.height = '0px';
    }
  }

  /** Lleva el cuerpo del acordeón de su altura actual a la que toca. */
  function animarPliegue(cuerpo, abre) {
    if (cuerpo.__plegando) { clearTimeout(cuerpo.__plegando); cuerpo.__plegando = null; }

    // Al abrir se hace visible ya: lo que se anima es la altura, no la
    // aparición. Al cerrar se esconde al final, o el contenido desaparecería
    // de golpe mientras la caja todavía se está encogiendo.
    if (abre) cuerpo.style.visibility = '';

    if (quieto()) { reposo(cuerpo, abre); return; }

    // El punto de partida tiene que ser un número: desde `auto` no hay nada
    // que interpolar y el cambio saldría de golpe. Se mide antes de recortar.
    var desde = cuerpo.getBoundingClientRect().height;
    cuerpo.style.overflow = 'hidden';
    cuerpo.style.height = desde + 'px';
    void cuerpo.offsetHeight;                 // fuerza el reflujo: sin esto los dos valores se funden en uno
    cuerpo.style.height = (abre ? cuerpo.scrollHeight : 0) + 'px';

    // Un temporizador y no `transitionend`: el evento no llega si la
    // transición no llega a correr —altura idéntica, pestaña en segundo
    // plano—, y el cuerpo se quedaría clavado en píxeles para siempre.
    cuerpo.__plegando = setTimeout(function () {
      cuerpo.__plegando = null;
      reposo(cuerpo, abre);
    }, RETOS_MS + 60);
  }

  function weeklyStrip() {
    var list = w.Engine.weeklyList();
    var strip = el('div', { class: 'hscroll' });
    list.forEach(function (item) {
      var done = item.complete && !item.claimed;
      var chip = el('button', {
        class: 'tile', style: { width: '190px', padding: '12px' },
        type: 'button',
        onclick: function () {
          w.Sound.tap();
          if (done) {
            if (w.Engine.claimWeekly(item.ch.id)) {
              w.FX.stars(chip, 22);
              UI.toast('+' + item.ch.xp + ' XP · +' + item.ch.coins + ' monedas', 'gold', '🎁');
              UI.Router.refresh();
            }
          } else {
            UI.toast(item.claimed ? 'Ya reclamado' : 'Progreso: ' + item.progress + '/' + item.ch.goal, 'blue', item.ch.icon);
          }
        }
      }, [
        el('div', { class: 'row', style: { gap: '8px' } }, [
          el('span', { style: { fontSize: '20px' }, text: item.claimed ? '✅' : item.ch.icon }),
          el('span', { class: 'small', style: { fontWeight: '900', lineHeight: '1.15' },
            text: w.Personalize.weeklyTitle(item.ch) })
        ]),
        el('div', { class: 'row', style: { gap: '8px', marginTop: '10px' } }, [
          UI.pbar(item.pct, done ? 'gold' : 'blue', true),
          el('span', { class: 'tiny nowrap', text: item.progress + '/' + item.ch.goal })
        ]),
        done ? el('div', { class: 'chip chip--gold', style: { marginTop: '8px' }, text: '🎁 Reclamar' }) : null
      ]);
      if (done) chip.classList.add('glow-pulse');
      strip.appendChild(chip);
    });

    var hechos = list.filter(function (x) { return x.complete; }).length;
    var premios = list.filter(function (x) { return x.complete && !x.claimed; }).length;
    var abierto = w.Store.state.settings.retosAbiertos !== false;

    var cuerpo = el('div', { class: 'acc__body', id: 'retos-cuerpo' }, [strip]);
    // Abierto no lleva estilo en línea ninguno: manda la hoja de estilos y la
    // altura queda en `auto`, que es lo que deja crecer al carrusel si un
    // título ocupa dos líneas.
    if (!abierto) reposo(cuerpo, false);

    var head = el('button', {
      class: 'acc__head', type: 'button',
      'aria-expanded': abierto ? 'true' : 'false',
      'aria-controls': 'retos-cuerpo'
    }, [
      el('span', { class: 'acc__meta' }, [
        el('h2', { class: 'acc__t', text: 'Retos de la semana' }),
        el('span', { class: 'acc__s', text: hechos + ' de ' + list.length + ' completados' })
      ]),
      // El número y el gorro dorado caben siempre; las palabras se esconden por
      // CSS en pantallas estrechas para que el título nunca parta en dos líneas
      // y la barra cerrada mida siempre lo mismo. La etiqueta accesible lleva
      // la frase entera pase lo que pase.
      premios
        ? el('span', {
            class: 'chip chip--gold acc__premio',
            'aria-label': premios + (premios === 1 ? ' reto por reclamar' : ' retos por reclamar')
          }, [
            el('span', { text: '🎁 ' + premios }),
            el('span', { class: 'acc__premio-txt', text: ' por reclamar' })
          ])
        : null,
      el('span', { class: 'acc__arrow', html: CHEVRON })
    ]);

    var sec = el('section', { class: 'acc' + (abierto ? ' is-open' : '') }, [head, cuerpo]);

    head.addEventListener('click', function () {
      w.Sound.tap();
      var abre = !sec.classList.contains('is-open');
      w.Store.set(function (s) { s.settings.retosAbiertos = abre; }, 'ui');
      sec.classList.toggle('is-open', abre);
      head.setAttribute('aria-expanded', abre ? 'true' : 'false');
      animarPliegue(cuerpo, abre);
    });

    return sec;
  }

  /* ------------------------- Encabezado de nivel ------------------------- */

  function unitHeader(levelN) {
    var lv = w.Engine.levelInfo(levelN);
    var prog = w.Engine.levelProgress(levelN);
    return el('div', { class: 'unit-head', style: { '--unit-c': lv.color } }, [
      el('div', { class: 'unit-head__meta' }, [
        el('div', { class: 'unit-head__k', text: 'Nivel ' + lv.n + ' · ' + prog.done + '/' + prog.total }),
        el('h2', { class: 'unit-head__t', text: lv.icon + '  ' + lv.title })
      ]),
      el('button', {
        class: 'unit-head__btn', type: 'button', 'aria-label': 'Ver detalles del nivel',
        text: 'ⓘ',
        onclick: function () { w.Sound.tap(); levelSheet(lv, prog); }
      })
    ]);
  }

  function levelSheet(lv, prog) {
    UI.sheet([
      el('div', { class: 'row', style: { gap: '12px' } }, [
        el('div', { style: { fontSize: '34px' }, text: lv.icon }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'tiny', text: 'Nivel ' + lv.n }),
          el('h2', { class: 'h3', text: lv.title })
        ])
      ]),
      el('p', { class: 'p', text: lv.outcome }),
      el('div', { class: 'row', style: { gap: '10px' } }, [
        UI.pbar(prog.pct, 'brand'),
        el('span', { class: 'small nowrap', text: prog.done + '/' + prog.total })
      ]),
      UI.btn('Entendido', { variant: 'ghost', onClick: UI.closeSheet })
    ]);
  }

  /* ------------------------- Nodos ------------------------- */

  /* El tramo entre dos paradas.

     Antes eran dos puntos del color de una línea divisoria: sobre el telón de
     la Ruta no se veían, y el recorrido —que es de lo que va la pantalla—
     quedaba sin dibujar. Ahora el tramo dice por dónde va el usuario: dorado
     por donde ya pasó, del color del nivel en el tramo que lleva a la parada
     de hoy, y apagado en lo que todavía está cerrado.

     La caja mide exactamente lo que medía: el color va en una variable y la
     estela es una capa absoluta. El mapa no se mueve ni un píxel. */
  function connector(i, desde, hasta) {
    var dx = WAVE[i % WAVE.length];
    var dx2 = WAVE[(i + 1) % WAVE.length];

    var color = null;
    if (desde.state === 'done' && hasta.state === 'done') color = 'var(--gold)';
    else if (desde.state === 'done') color = w.Engine.levelInfo(hasta.node.level).color;

    var st = { '--dx': ((dx + dx2) / 2) + 'px' };
    if (color) st['--trail'] = color;

    return el('div', { class: 'path-dots', style: st }, [
      el('i'), el('i')
    ]);
  }

  function nodeRow(item, i) {
    var n = item.node;
    var lv = w.Engine.levelInfo(n.level);
    var isBoss = n.kind === 'boss';
    var st = item.state;

    var cls = 'node';
    if (isBoss) cls += ' is-boss';
    if (st === 'done') cls += ' is-done';
    else if (st === 'locked') cls += ' is-locked';
    else if (st === 'active') cls += ' is-active';

    var colorVars = {};
    if (st === 'done') { colorVars['--node-c'] = '#FFC800'; colorVars['--node-sh'] = '#D9A400'; }
    else if (st !== 'locked') { colorVars['--node-c'] = lv.color; colorVars['--node-sh'] = lv.dark; }

    var icon = st === 'locked' ? '🔒' : (st === 'done' ? (isBoss ? '👑' : '✓') : n.data.icon);

    var btn = el('button', {
      class: cls, type: 'button', style: colorVars,
      'aria-label': n.data.title,
      onclick: function () {
        if (st === 'locked') {
          w.Sound.wrong();
          w.FX.shake(btn);
          UI.toast('Completa la misión anterior para desbloquear', 'red', '🔒');
          return;
        }
        w.Sound.tap();
        w.Sound.buzz(12);
        openNode(n.id);
      }
    }, [el('span', { text: icon })]);

    if (st === 'active') btn.appendChild(el('span', { class: 'node__halo' }));
    if (st === 'done' && !isBoss) btn.appendChild(el('span', { class: 'node-crown', text: '⭐' }));

    var wrap = el('div', {
      class: 'path-node-wrap',
      style: { '--dx': WAVE[i % WAVE.length] + 'px', animationDelay: Math.min(i * 0.02, 0.5) + 's' }
    }, [
      // El aura va la primera del todo para que se pinte DEBAJO del nodo: dos
      // elementos posicionados sin z-index se ordenan por orden de documento.
      // Es luz de ambiente, no un adorno del botón: no se anima ni recibe
      // clics, solo marca dónde está la parada de hoy.
      st === 'active' ? el('span', { class: 'node__aura', 'aria-hidden': 'true' }) : null,
      st === 'active' ? el('div', { class: 'start-bubble', text: isBoss ? 'Reto real' : 'Empezar' }) : null,
      btn,
      el('div', { class: 'node__label', text: st === 'locked' ? '' : n.data.title })
    ]);

    // La burbuja necesita espacio propio arriba o pisa la etiqueta del nodo anterior.
    if (st === 'active') wrap.classList.add('has-bubble');

    if (item.optional && st !== 'done') {
      wrap.appendChild(el('div', { class: 'node-optional', text: 'opcional' }));
    }
    return wrap;
  }

  function finale(ps) {
    var allDone = ps.every(function (x) { return x.state === 'done'; });
    return el('div', { class: 'card', style: { marginTop: '18px', textAlign: 'center' } }, [
      el('div', { style: { fontSize: '34px' }, text: allDone ? '🏆' : '🏁' }),
      el('h2', { class: 'h4', style: { marginTop: '6px' }, text: allDone ? '¡Ruta completada!' : 'Meta final' }),
      el('p', { class: 'small', style: { marginTop: '6px' },
        text: allDone
          ? 'Tienes idea validada, oferta, precios, identidad, estrategia y primeros clientes. Revisa tu expediente.'
          : 'Al terminar tendrás: idea validada, oferta, precios, identidad básica, estrategia de ventas y tus primeros clientes.' }),
      UI.btn(allDone ? 'Ver mi expediente' : 'Ver mi progreso', {
        variant: allDone ? 'gold' : 'ghost', size: 'sm',
        onClick: function () { UI.Router.go('business'); }
      })
    ]);
  }

  /* ------------------------- Abrir nodo ------------------------- */

  function openNode(id) {
    var lesson = w.Engine.lessonById(id);
    var boss = w.Engine.bossById(id);
    if (lesson) return lessonSheet(lesson);
    if (boss) return bossSheet(boss);
  }

  function lessonSheet(lesson) {
    var lv = w.Engine.levelInfo(lesson.level);
    var done = w.Engine.isDone(lesson.id);
    var rec = w.Store.state.lessons[lesson.id];
    var hearts = w.Store.state.hearts;

    UI.sheet([
      el('div', { class: 'row', style: { gap: '14px' } }, [
        el('div', {
          class: 'node', style: { '--node-c': lv.color, '--node-sh': lv.dark, width: '62px', height: '58px', fontSize: '25px' },
          text: lesson.icon
        }),
        el('div', { class: 'grow' }, [
          el('div', { class: 'tiny', style: { color: lv.color }, text: lv.title }),
          el('h2', { class: 'h3', text: lesson.title })
        ])
      ]),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        UI.chip(lesson.min + ' min', 'blue', '⏱️'),
        UI.chip('+' + lesson.xp + ' XP', 'gold', '⚡'),
        UI.chip(lesson.steps.length + ' ejercicios', null, '🧩'),
        lesson.mission ? UI.chip('Misión real', 'purple', '🎯') : null,
        done ? UI.chip('Completada · ' + (rec ? rec.score : 0) + '%', 'green', '✅') : null
      ]),
      el('p', { class: 'p', text: lesson.concept.title }),
      // Qué va a hacer con SU negocio al terminarla: la lección no es teoría suelta.
      (function () {
        var ej = w.Personalize.example(lesson);
        // El color va por clase y no en línea: es el bloque que habla del
        // negocio del usuario, así que es de los que toma su color.
        return ej ? el('div', { class: 'card card--tight neg-aplica', style: { textAlign: 'left' } }, [
          el('div', { class: 'tiny neg-aplica__k', text: 'Aplicado a tu idea' }),
          el('div', { class: 'small', style: { marginTop: '6px' }, text: ej.text })
        ]) : null;
      })(),
      hearts <= 0 && !done
        ? el('div', { class: 'card card--tight', style: { background: 'var(--red-soft)', borderColor: 'var(--red)' } }, [
            el('div', { class: 'row', style: { gap: '10px' } }, [
              el('span', { style: { fontSize: '24px' }, text: '💔' }),
              el('div', [
                el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--red-dark)' }, text: 'Te quedaste sin vidas' }),
                el('div', { class: 'tiny', text: 'Siguiente vida en ' + (w.Engine.heartsETA() || '—') })
              ])
            ])
          ])
        : null,
      hearts <= 0 && !done
        ? UI.btn('Recargar vidas (60 🪙)', {
            variant: 'gold',
            onClick: function () {
              if (w.Store.state.coins < 60) { UI.toast('No tienes suficientes monedas', 'red', '🪙'); return; }
              w.Engine.addCoins(-60); w.Engine.refillHearts();
              UI.closeSheet(); UI.toast('¡Vidas recargadas!', 'green', '❤️');
              w.App.renderChrome();
            }
          })
        : UI.btn(done ? 'Repasar lección' : 'Empezar lección', {
            variant: done ? 'ghost' : 'brand', size: 'lg', shiny: !done,
            onClick: function () { UI.closeSheet(); UI.Router.go('lesson', { id: lesson.id }); }
          })
    ]);
  }

  function bossSheet(boss) {
    var lv = w.Engine.levelInfo(boss.level);
    var done = w.Engine.isDone(boss.id);
    UI.sheet([
      el('div', { class: 'mission-hero' }, [
        el('div', { class: 'mission-hero__tag', text: 'Reto real · Nivel ' + boss.level }),
        el('div', { class: 'row', style: { gap: '12px' } }, [
          el('span', { style: { fontSize: '38px' }, text: boss.icon }),
          el('div', [
            el('h3', { text: boss.title }),
            el('p', { text: boss.subtitle })
          ])
        ])
      ]),
      el('p', { class: 'p', text: w.Personalize.mission(boss).brief || boss.brief }),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, [
        UI.chip('+' + boss.xp + ' XP', 'gold', '⚡'),
        UI.chip('+' + boss.coins + ' 🪙', 'gold'),
        UI.chip('Fuera de la app', 'purple', '🌎'),
        done ? UI.chip('Superado', 'green', '✅') : null
      ]),
      el('div', { class: 'card card--tight', style: { background: 'var(--gold-soft)', borderColor: 'var(--gold)' } }, [
        el('div', { class: 'small', style: { fontWeight: '800', color: 'var(--gold-dark)' },
          text: '⚠️ Este reto se hace en el mundo real. Vuelve cuando lo hayas hecho y reporta el resultado: el mentor lo revisará.' })
      ]),
      UI.btn(done ? 'Ver mi reporte' : 'Aceptar el reto', {
        variant: 'purple', size: 'lg', shiny: !done,
        onClick: function () { UI.closeSheet(); UI.Router.go('mission', { id: boss.id, boss: true }); }
      }),
      el('div', { class: 'tiny t-center', text: lv.outcome })
    ]);
  }

  UI.Router.register('home', render);
  w.HomeScreen = { openNode: openNode };
})(window, document);
