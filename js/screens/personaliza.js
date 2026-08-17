/* ==========================================================================
   PERSONALIZAR MI EXPERIENCIA

   El sitio donde el usuario manda sobre la apariencia. La app propone; aquí
   él acepta, corrige o lo apaga todo.

   La vista previa de arriba es en vivo y de verdad: se pinta con los mismos
   componentes y los mismos tokens que la app real, dentro de un contenedor con
   su propio data-negocio. Nada de maquetas: si algo se ve mal aquí, se ve mal
   en la app, y esa es la idea.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  function P() { return w.Persona; }
  function C() { return w.CONFIG; }
  function V() { return w.Venture; }

  /* Lo que se está editando ahora mismo. Vive fuera del render para que
     cambiar una opción no pierda las demás mientras se repinta la vista. */
  var borrador = null;

  function abrirBorrador() {
    var a = P().actual();
    return {
      temaId: a.temaId,
      intensidad: a.intensidad,
      capas: { cabeza: a.capas.cabeza, torso: a.capas.torso, mano: a.capas.mano, fondo: a.capas.fondo }
    };
  }

  /* ==================================================================
     PANTALLA
     ================================================================== */

  function render() {
    borrador = abrirBorrador();
    var encendida = P().activa();

    var root = el('div', { class: 'screen' });

    root.appendChild(el('div', { class: 'row', style: { gap: '12px', marginBottom: '4px' } }, [
      // Se entra aquí desde Mi emprendimiento y también desde Perfil: volver
      // por el historial deja al usuario donde estaba. Si la pila está vacía
      // (por ejemplo tras recargar), back() cae en el destino de reserva.
      UI.backBtn(function () { UI.Router.back('venture'); }),
      el('h1', { class: 'h3', text: 'Personalizar mi experiencia' })
    ]));

    root.appendChild(el('div', { class: 'small', style: { marginBottom: '4px' },
      text: 'Modo Emprendedor sigue siendo la misma app: la tipografía, la navegación y el naranja ' +
            'no cambian. Lo que se adapta son los acentos, los ejemplos y lo que Chispa lleva puesto.' }));

    /* ---------------- Vista previa ---------------- */
    var preview = el('div');
    root.appendChild(preview);
    pintarPreview(preview);

    if (!encendida) {
      root.appendChild(el('div', { class: 'card card--tight', style: { background: 'var(--gold-soft)', borderColor: 'var(--gold)', textAlign: 'left' } }, [
        el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--gold-dark)' },
          text: '⏸️ La personalización está apagada' }),
        el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0' },
          text: 'La app se ve en su apariencia original. Enciéndela abajo para volver a adaptarla a tu negocio.' })
      ]));
    }

    /* ---------------- Cuánto se nota ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Cuánto quiero que se note' }));
    root.appendChild(intensidadCard(preview));

    /* ---------------- Color ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'El color de mi negocio' }));
    root.appendChild(el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginBottom: '10px' },
      text: 'Solo cambia el color secundario. El naranja de Modo Emprendedor se queda donde está.' }));
    root.appendChild(temasCard(preview));

    /* ---------------- Accesorios ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Qué lleva Chispa' }));
    root.appendChild(el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginBottom: '10px' },
      text: 'Su cara, su cuerpo y su chispa no cambian nunca. Lo que se le pone encima, sí.' }));
    root.appendChild(accesoriosCard(preview));

    /* ---------------- Acciones ---------------- */
    root.appendChild(el('h2', { class: 'sep', text: 'Volver a empezar' }));
    root.appendChild(accionesCard());

    root.appendChild(el('h2', { class: 'sep', text: 'Apagarlo todo' }));
    root.appendChild(interruptorCard());

    return root;
  }

  /* ==================================================================
     VISTA PREVIA

     Se repinta entera en cada cambio. Es barato —son tres nodos— y evita el
     clásico error de actualizar la mascota y olvidarse de la tarjeta.
     ================================================================== */

  function pintarPreview(host) {
    UI.clear(host);
    var t = V().terms();
    var opts = P().mascotaOpts(borrador.temaId, borrador.capas, borrador.intensidad);
    var ej = ejemploDeMuestra(t);

    host.appendChild(el('div', {
      class: 'neg-preview',
      // El tema se aplica por atributo también aquí: las reglas de css/temas.css
      // son de atributo pelado justamente para que funcionen anidadas.
      data: { negocio: P().activa() ? borrador.temaId : 'generico' }
    }, [
      el('div', { class: 'neg-preview__hero' }, [
        el('h3', { text: t.negocio }),
        el('p', { text: t.sectorTitulo || 'Sin clasificar' })
      ]),
      el('div', { class: 'row', style: { gap: '12px', marginTop: '14px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--lg', style: { '--m-size': '92px' },
          html: w.Mascot.svg('happy', opts) }),
        el('div', { class: 'grow', style: { minWidth: '0' } }, [
          el('div', { class: 'card card--tight neg-aplica', style: { textAlign: 'left' } }, [
            el('div', { class: 'tiny neg-aplica__k', text: 'Aplicado a tu idea' }),
            el('div', { class: 'small', style: { marginTop: '6px' }, text: ej })
          ])
        ])
      ]),
      el('div', { class: 'row wrap', style: { gap: '8px', marginTop: '12px' } }, [
        UI.chip(t.sectorEmoji + ' ' + (t.sectorTitulo || 'Sin clasificar'), 'neg'),
        UI.chip(t.etapaCorta, 'neg'),
        t.personalidad ? UI.chip(t.personalidad, 'neg') : null
      ])
    ]));
  }

  /** Un ejemplo real de la app, no un texto de relleno: así el usuario ve de
      verdad cómo le van a hablar las lecciones. */
  function ejemploDeMuestra(t) {
    try {
      var nivel = w.LESSONS.filter(function (x) { return x.level === 3; })[0];
      var ej = nivel && w.Personalize.example(nivel);
      if (ej && ej.text) return V().util.shorten(ej.text, 190) + '…';
    } catch (e) {}
    return 'Aquí verás los ejemplos escritos sobre ' + t.tuProducto + '.';
  }

  /* ==================================================================
     CONTROLES
     ================================================================== */

  var INTENSIDAD_TXT = {
    sutil:   { emoji: '🌫️', title: 'Sutil',   sub: 'Solo detalles de color. Casi no se nota.' },
    media:   { emoji: '🎨', title: 'Media',   sub: 'Acentos, cabeceras y Chispa con sus accesorios.' },
    visible: { emoji: '🖼️', title: 'Visible', sub: 'Además, su espacio de trabajo y el fondo de la app.' }
  };

  function intensidadCard(preview) {
    var col = el('div', { class: 'col', style: { gap: '10px' } });
    P().INTENSIDADES.forEach(function (key) {
      var meta = INTENSIDAD_TXT[key];
      var btn = el('button', {
        class: 'opt' + (borrador.intensidad === key ? ' is-selected' : ''), type: 'button',
        onclick: function () {
          w.Sound.select();
          borrador.intensidad = key;
          P().setIntensidad(key);
          /* Repintar la pantalla entera y no solo la vista previa: la tarjeta
             de accesorios muestra u oculta el aviso de "el espacio de trabajo
             solo se ve en Visible", y ese texto se evalúa al construirla. */
          UI.Router.refresh();
        }
      }, [
        el('span', { class: 'opt__emoji', text: meta.emoji }),
        el('span', { class: 'opt__body' }, [
          el('span', { text: meta.title }),
          el('span', { class: 'opt__hint', text: meta.sub })
        ])
      ]);
      col.appendChild(btn);
    });
    return col;
  }

  function temasCard(preview) {
    var col = el('div', { class: 'col', style: { gap: '8px' } });
    var sugerido = P().temaSugerido();

    C().TEMAS.forEach(function (tm) {
      var btn = el('button', {
        class: 'neg-swatch' + (borrador.temaId === tm.key ? ' is-selected' : ''),
        type: 'button', data: { negocio: tm.key },
        onclick: function () {
          w.Sound.select();
          borrador.temaId = tm.key;
          // Elegirlo a mano es una decisión: a partir de aquí, cambiar de
          // sector ya no se lo pisa.
          P().setTema(tm.key, 'usuario');
          // Los accesorios vuelven a los del tema nuevo, salvo que los haya
          // tocado; setTema no los borra, así que se releen de Persona.
          borrador.capas = P().actual().capas;
          UI.qsa('.neg-swatch', col).forEach(function (n) { n.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          UI.Router.refresh();
        }
      }, [
        el('span', { class: 'neg-swatch__dot' }),
        el('span', { class: 'neg-swatch__body grow' }, [
          el('span', { class: 'neg-swatch__t', text: tm.emoji + '  ' + tm.title }),
          el('span', { class: 'neg-swatch__s', text: tm.sub })
        ]),
        tm.key === sugerido
          ? el('span', { class: 'chip chip--neg', style: { flex: 'none' }, text: 'Sugerido' })
          : null
      ]);
      col.appendChild(btn);
    });
    return col;
  }

  function accesoriosCard(preview) {
    var K = w.MASCOTA_CAPAS;
    var col = el('div', { class: 'col', style: { gap: '14px' } });

    K.RANURAS.forEach(function (ranura) {
      var opciones = [''].concat(K.claves(ranura));
      var fila = el('div', { class: 'hscroll', style: { gap: '8px' } });

      opciones.forEach(function (clave) {
        var activo = (borrador.capas[ranura] || '') === clave;
        var chip = el('button', {
          class: 'chip' + (activo ? ' chip--neg' : ''), type: 'button',
          style: { border: activo ? '2px solid var(--neg-acento)' : '2px solid transparent', cursor: 'pointer' },
          onclick: function () {
            w.Sound.tap();
            borrador.capas[ranura] = clave;
            P().setCapa(ranura, clave);
            UI.qsa('.chip', fila).forEach(function (n) {
              n.classList.remove('chip--neg');
              n.style.border = '2px solid transparent';
            });
            chip.classList.add('chip--neg');
            chip.style.border = '2px solid var(--neg-acento)';
            pintarPreview(preview);
          }
        }, [el('span', { text: clave ? (K.NOMBRE[clave] || clave) : 'Ninguno' })]);
        fila.appendChild(chip);
      });

      col.appendChild(el('div', { class: 'col', style: { gap: '6px' } }, [
        el('div', { class: 'tiny', text: K.RANURA_NOMBRE[ranura] || ranura }),
        fila,
        ranura === 'fondo' && borrador.intensidad !== 'visible'
          ? el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', opacity: '.75' },
              text: 'El espacio de trabajo solo se ve con la personalización en "Visible".' })
          : null
      ]));
    });

    return col;
  }

  function accionesCard() {
    return el('div', { class: 'col', style: { gap: '10px' } }, [
      el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: '🔄 Volver a proponer' }),
        el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0', lineHeight: '1.6' },
          text: 'Vuelve a leer la descripción de tu negocio y propone el sector, el color y los ' +
                'accesorios que le corresponden ahora. Tus datos no se tocan.' }),
        el('div', { style: { marginTop: '12px' } }, [
          UI.btn('Regenerar la propuesta', { variant: 'ghost', size: 'sm', onClick: regenerar })
        ])
      ]),
      el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: '↩️ Restablecer la apariencia' }),
        el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0', lineHeight: '1.6' },
          text: 'Descarta el color y los accesorios que hayas elegido a mano y vuelve a la ' +
                'propuesta automática. No borra nada de tu emprendimiento.' }),
        el('div', { style: { marginTop: '12px' } }, [
          UI.btn('Restablecer', { variant: 'flat', size: 'sm', onClick: restablecer })
        ])
      ])
    ]);
  }

  function regenerar() {
    var boton = null;
    P().regenerar();
    UI.Router.refresh();
    UI.toast('Propuesta actualizada', 'green', '🔄');

    // Con IA disponible se pide una lectura mejor, pero no se aplica sola:
    // aparece como propuesta, igual que cuando cambia la idea.
    if (w.AI && w.AI.disponible()) {
      UI.toast('Consultando a la IA…', 'purple', '✨', 1800);
      P().clasificarIA().then(function (prop) {
        if (!prop) return;
        UI.toast('La IA propone un ajuste. Míralo en Mi emprendimiento.', 'purple', '✨', 4200);
      }).catch(function () {});
    }
    return boton;
  }

  function restablecer() {
    UI.confirm({
      title: '¿Restablecer la apariencia?',
      text: 'Se descarta el color y los accesorios que elegiste a mano y vuelve la propuesta ' +
            'automática.\n\n**Tu idea, tus datos, tu progreso y tus decisiones no se tocan.**',
      ok: 'Sí, restablecer', cancel: 'Mejor no', mood: 'think'
    }).then(function (si) {
      if (!si) return;
      P().restablecer();
      UI.Router.refresh();
      w.Sound.coin();
      UI.toast('Apariencia restablecida', 'green', '↩️');
    });
  }

  function interruptorCard() {
    var on = P().activa();
    return el('div', { class: 'card card--tight', style: { textAlign: 'left' } }, [
      el('div', { class: 'row between' }, [
        el('div', { class: 'grow' }, [
          el('div', { class: 'small', style: { fontWeight: '900' }, text: 'Adaptar la app a mi negocio' }),
          el('div', { class: 'tiny', style: { marginTop: '4px', textTransform: 'none', letterSpacing: '0', lineHeight: '1.6' },
            text: on
              ? 'Está encendida. Si la apagas, la app vuelve a su apariencia original y Chispa se queda sin accesorios.'
              : 'Está apagada. La app se ve igual para todo el mundo.' })
        ]),
        el('button', {
          class: 'chip' + (on ? ' chip--green' : ''), type: 'button',
          style: { border: 'none', cursor: 'pointer', flex: 'none' },
          text: on ? 'Encendida' : 'Apagada',
          onclick: function () {
            w.Sound.tap();
            P().setActiva(!on);
            UI.Router.refresh();
            UI.toast(!on ? 'Personalización encendida' : 'Personalización apagada', 'blue', !on ? '🎨' : '⏸️');
          }
        })
      ]),
      el('div', { class: 'tiny', style: { marginTop: '10px', textTransform: 'none', letterSpacing: '0', opacity: '.8' },
        text: 'Esto solo cambia cómo se ve la app. Los ejemplos y los desafíos siguen escritos ' +
              'sobre tu negocio en cualquier caso.' })
    ]);
  }

  UI.Router.register('personaliza', render);
  w.PersonalizaScreen = { open: function () { UI.Router.go('personaliza'); } };
})(window, document);
