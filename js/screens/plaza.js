/* ==========================================================================
   PLAZA — la pantalla

   Dos estados, y hoy no hay más:

     · SIN PUESTO   Se le enseña la vitrina que saldría, línea por línea, para
                    que la revise y la corrija. Es la pantalla importante: es
                    donde decide si esto le da confianza.
     · CON PUESTO   La plaza. Hoy está vacía, y lo dice. No hay vecinos
                    inventados y no los va a haber: la Liga puede permitirse
                    rivales simulados porque ahí lo que está en juego son
                    puntos, pero aquí el botón dice "Veo valor" y un vecino
                    que nunca contesta sería una mentira, no un adorno.

   LA SEGUNDA PROMESA
   Vive aquí dentro y no en un archivo propio: son cuarenta líneas y solo la
   llama esta pantalla. Reutiliza el molde de js/core/promesa.js entero —misma
   escena, mismas tres filas, mismo botón— porque quien vio "Tu idea es tuya"
   tiene que reconocer al instante que esto es lo mismo, un escalón más
   arriba. La tercera fila dice que todavía no le ve nadie, y eso es verdad
   hoy: el día que la Plaza abra, esa fila cambia.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  function P() { return w.Plaza; }

  /* ==================================================================
     LA SEGUNDA PROMESA
     ================================================================== */

  var PROMESA_TITULO = 'Tu puesto lo abres tú 🏪';
  var PROMESA_ENTRADA = 'Puedo armarte una vitrina con lo que ya me contaste. Tú decides si la abro.';

  var PROMESA_FILAS = [
    ['🔎', 'Sale solo lo que apruebes', 'Lo ves entero antes, y lo puedes cambiar.'],
    ['🔒', 'No salen tus números',      'Precios, costos y tu plan se quedan aquí.'],
    /* Esta fila dice la verdad de hoy. El día que haya servidor pasa a ser
       "Nadie te escribe primero — Solo si los dos quieren hablar", que es la
       promesa de verdad; escribirla antes sería prometer una garantía que no
       existe en ninguna parte. */
    ['🕯️', 'Todavía no te ve nadie',   'Te aviso el día que la Plaza abra.']
  ];

  var PROMESA_CIERRE = 'Guárdalo tranquilo. Puedes cerrarlo cuando quieras.';

  function promesaVista() {
    var s = w.Store && w.Store.state ? w.Store.state.settings : null;
    return !!(s && s.plazaVista);
  }

  function marcarPromesa() {
    if (!w.Store) return;
    w.Store.set(function (st) { st.settings.plazaVista = true; }, 'plaza');
  }

  function contenidoPromesa(alCerrar) {
    var lista = el('div', { class: 'promesa__lista' });
    PROMESA_FILAS.forEach(function (f) {
      lista.appendChild(el('div', { class: 'promesa__fila' }, [
        el('span', { class: 'promesa__fila__ico', text: f[0] }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'promesa__fila__t', text: f[1] }),
          el('span', { class: 'promesa__fila__p', text: f[2] })
        ])
      ]));
    });

    return [
      el('div', { class: 'promesa__escena' }, [
        el('span', { class: 'promesa__aura' }),
        /* Chispa sin accesorios, por lo mismo que en la primera promesa: aquí
           no habla el negocio del usuario, habla Emprendo. */
        el('div', {
          class: 'mascot mascot--md is-happy promesa__chispa',
          html: w.Mascot.svg('happy', { plano: true, etiqueta: 'Chispa abriendo la Plaza' })
        })
      ]),
      el('h2', { class: 'h3 promesa__titulo', text: PROMESA_TITULO }),
      el('p', { class: 'promesa__texto', text: PROMESA_ENTRADA }),
      lista,
      el('p', { class: 'promesa__cierre', text: PROMESA_CIERRE }),
      UI.btn('Ver mi vitrina', { variant: 'brand', size: 'lg', shiny: true, onClick: alCerrar })
    ];
  }

  /**
   * Enseña la promesa si es la primera vez y luego sigue. `onSeguir` se llama
   * una sola vez salga por donde salga —botón, Esc o toque fuera—, igual que
   * en js/core/promesa.js: un gesto de acompañamiento que atrapa deja de serlo.
   */
  function antesDeAbrir(onSeguir) {
    if (promesaVista()) {
      if (typeof onSeguir === 'function') onSeguir();
      return false;
    }

    var hecho = false;
    function seguir() {
      if (hecho) return;
      hecho = true;
      marcarPromesa();
      if (typeof onSeguir === 'function') onSeguir();
    }

    UI.queueModal(function () {
      var m = UI.modal(contenidoPromesa(function () { UI.closeModal(); }), { onClose: seguir });
      if (m && m.box) m.box.classList.add('promesa');
      if (w.Sound) w.Sound.select();
    });
    return true;
  }

  /* ==================================================================
     EL PUESTO, DIBUJADO
     ================================================================== */

  function puesto(v, opts) {
    opts = opts || {};
    var P2 = P();
    var cuerpo = [
      el('div', { class: 'puesto__nombre', text: P2.titulo(v) || 'Tu negocio' })
    ];
    var linea = P2.resumen(v);
    if (linea) cuerpo.push(el('div', { class: 'puesto__linea', text: linea }));

    var caja = el('article', {
      class: 'puesto' + (opts.mio ? ' puesto--tuyo' : ''),
      data: { toldo: v.sector || 'otro' }
    }, [
      opts.mio ? el('span', { class: 'puesto__mio', text: 'Tu puesto' }) : null,
      el('header', { class: 'puesto__toldo' }, [
        el('span', { class: 'puesto__sector', text: P2.rotulo(v) })
      ]),
      el('div', { class: 'puesto__cuerpo' }, cuerpo)
    ]);

    return el('div', { class: 'pz-hueco' + (opts.aura ? ' pz-aura' : '') }, [caja]);
  }

  /* ==================================================================
     PANTALLA A — REVISAR Y APROBAR
     ================================================================== */

  function pantallaRevisar(p) {
    var P2 = P();
    var root = el('div', { class: 'screen' });

    root.appendChild(el('div', { class: 'row', style: { gap: '12px' } }, [
      UI.backBtn(function () { UI.Router.back('business'); }),
      el('h1', { class: 'h3', text: P2.abierta() ? 'Mi vitrina' : 'Esto es lo que verían' })
    ]));

    root.appendChild(UI.chispaDice('explicando',
      'Lo armé con lo que ya me contaste. Cámbialo hasta que suene a ti.'));

    var v = p.vitrina;
    if (v) root.appendChild(puesto(v, { mio: true }));

    /* Las líneas, una por una. Se tocan para corregirlas: es la misma forma
       que ya tiene Mi Emprendimiento, así que no hay nada nuevo que aprender.

       Están LAS CINCO, incluidas las dos que ya se leen en el puesto de
       arriba. Sí, se repiten — y aun así van: la promesa dice «lo ves entero
       antes, y lo puedes cambiar», y sin estas dos filas el nombre del
       negocio y lo que hace eran justo lo único que no se podía tocar. */
    var lista = el('div', { class: 'card card--tight', style: { paddingTop: '6px', paddingBottom: '6px' } });
    P2.EDITABLES.forEach(function (k) {
      lista.appendChild(filaEditable(k, v ? v[k] : ''));
    });
    lista.appendChild(el('div', { class: 'vit-fila' }, [
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'vit-fila__et', text: P2.ETIQUETAS.etapa }),
        el('div', { class: 'vit-fila__val', text: P2.etapaCorta(v) || 'Sin definir' })
      ])
    ]));
    root.appendChild(lista);

    /* Lo que no sale. Va debajo de la vitrina y no encima a propósito: primero
       ve lo que sí sale —que es lo que le preocupa— y después la lista corta
       de lo que se queda. Al revés se lee como un descargo de responsabilidad. */
    var fuera = el('div', { class: 'pz-fuera' }, [
      el('div', { class: 'tiny', style: { fontWeight: '900', color: 'var(--ink-2)', marginBottom: '6px' },
        text: 'Esto se queda aquí' })
    ]);
    P2.NUNCA.forEach(function (t) {
      fuera.appendChild(el('div', { class: 'pz-fuera__f' }, [
        el('span', { text: '✓' }),
        el('span', { text: t })
      ]));
    });
    root.appendChild(fuera);

    /* --------- Qué falta, si falta --------- */
    if (!p.listo) {
      root.appendChild(el('div', { class: 'card card--accent card--tight' }, [
        el('div', { class: 'small', style: { fontWeight: '900' },
          text: 'Todavía no puedo abrirlo' }),
        el('div', { class: 'tiny', style: { marginTop: '6px', textTransform: 'none', letterSpacing: '0' },
          text: 'Me falta ' + juntar(p.faltan).toLowerCase() + '. Tócalo aquí arriba y lo escribes.' })
      ]));
    }

    if (P2.abierta()) {
      root.appendChild(UI.btn('Guardar los cambios', {
        variant: 'brand', size: 'lg', disabled: !p.listo,
        onClick: function () { abrirPuesto(true); }
      }));
      root.appendChild(UI.btn('Cerrar mi puesto', {
        variant: 'flat',
        onClick: function () {
          UI.confirm({
            title: '¿Cierro tu puesto?',
            text: 'Dejo de enseñarlo. Lo que corregiste se queda guardado por si lo abres otra vez.',
            ok: 'Sí, ciérralo', cancel: 'Mejor no', danger: true, mood: 'sad'
          }).then(function (si) {
            if (!si) return;
            P2.retirar();
            UI.toast('Puesto cerrado', 'blue', '🕯️');
            UI.Router.refresh();
          });
        }
      }));
    } else {
      root.appendChild(UI.btn('Así está bien', {
        variant: 'brand', size: 'lg', shiny: p.listo, disabled: !p.listo,
        onClick: function () { abrirPuesto(false); }
      }));
      root.appendChild(UI.btn('Mejor todavía no', {
        variant: 'flat',
        onClick: function () { UI.Router.back('business'); }
      }));
    }

    return root;
  }

  function juntar(lista) {
    if (!lista.length) return '';
    if (lista.length === 1) return lista[0];
    return lista.slice(0, -1).join(', ') + ' y ' + lista[lista.length - 1];
  }

  function filaEditable(clave, valor) {
    var P2 = P();
    return el('button', { class: 'vit-fila', type: 'button', onclick: function () { editar(clave); } }, [
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'vit-fila__et', text: P2.ETIQUETAS[clave] }),
        el('div', {
          class: 'vit-fila__val' + (valor ? '' : ' is-falta'),
          text: valor || 'Todavía no lo has escrito'
        })
      ]),
      el('span', { class: 'vit-fila__lapiz', text: '✍️' })
    ]);
  }

  var PISTA = {
    negocio:  'Como quieras que lo lean. Si no tienes nombre, déjalo vacío.',
    producto: 'Qué haces o qué vendes, en una frase.',
    cliente:  'A quién le sirve. Sin nombres de personas.',
    problema: 'Qué le resuelves a esa persona.',
    valor:    'Qué gana o qué se ahorra quien te compra.'
  };

  function editar(clave) {
    var P2 = P();
    var p = P2.propuesta();
    var actual = p.vitrina ? p.vitrina[clave] : '';

    var input = el('textarea', { class: 'textarea', rows: '3', maxlength: String(P2.TOPES[clave] || 120) });
    input.value = actual || '';

    var aviso = el('div', { class: 'tiny',
      style: { color: 'var(--red)', display: 'none', textTransform: 'none', letterSpacing: '0' },
      text: 'Aquí no pongas correo ni teléfono. Eso se comparte cuando los dos quieran hablar.' });

    UI.sheet([
      el('h2', { class: 'h3', text: P2.ETIQUETAS[clave] }),
      el('div', { class: 'small', text: PISTA[clave] || '' }),
      input,
      aviso,
      UI.btn('Guardar', { variant: 'green', onClick: function () {
        var val = (input.value || '').trim();
        if (val && P2.tieneContacto(val)) {
          aviso.style.display = '';
          w.Sound.wrong();
          /* El aviso de dentro de la hoja puede quedar por debajo del pliegue
             —más aún con el teclado abierto—, y entonces el botón parecería
             no hacer nada. El toast se ve siempre. */
          UI.toast('Aquí no va tu contacto', 'red', '🔒');
          return;
        }
        P2.editar(clave, val);
        UI.closeSheet();
        w.Sound.coin();
        UI.toast('Actualizado', 'green', '💾');
        UI.Router.refresh();
      } }),
      UI.btn('Volver a lo que yo tenía', { variant: 'flat', onClick: function () {
        P2.editar(clave, '');
        UI.closeSheet();
        UI.Router.refresh();
      } })
    ]);
  }

  function abrirPuesto(yaEstaba) {
    var v = P().aprobar();
    if (!v) { UI.toast('Todavía falta algo', 'red', '✍️'); return; }
    w.Sound.coin();

    if (yaEstaba) {
      UI.toast('Guardado', 'green', '💾');
      UI.Router.refresh();
      return;
    }

    /* La primera vez se ENTRA a la Plaza, no se refresca la vitrina. Con un
       refresh se aprobaba el puesto y la pantalla se quedaba igual, así que
       parecía que el botón no había hecho nada — justo en el momento que más
       tiene que sentirse. */
    w.FX.celebrate();
    UI.toast('Guardé tu puesto', 'gold', '🏪');
    UI.Router.go('plaza');
  }

  /* ==================================================================
     PANTALLA B — LA PLAZA

     Hoy siempre está vacía. Cuando haya vecinos, aquí es donde entran, y el
     estado vacío se queda para el día que no haya ninguna coincidencia de
     verdad — que es el estado que le da carácter a todo lo demás: si la
     Plaza es capaz de decir "hoy no", el día que diga "mira este" se le
     puede creer.
     ================================================================== */

  function pantallaPlaza() {
    var P2 = P();
    var v = P2.vitrina();

    var root = el('div', { class: 'screen plaza' });
    root.appendChild(el('div', { class: 'plaza__sol' }));
    root.appendChild(el('div', { class: 'plaza__bruma' }));
    root.appendChild(el('div', { class: 'plaza__suelo' }));

    var cont = el('div', { class: 'plaza__cont' });

    cont.appendChild(el('div', { class: 'col', style: { alignItems: 'center', gap: '4px', textAlign: 'center' } }, [
      el('h1', { class: 'h2', text: 'Todavía no hay nadie más aquí.' }),
      el('div', { class: 'small', style: { maxWidth: '250px' },
        text: 'No te voy a inventar vecinos falsos.' })
    ]));

    cont.appendChild(el('div', { class: 'grow' }));

    /* El camino que sale de la plaza. Apagado, porque no lleva a nadie
       todavía: lo único que hace es llevar tu puesto a donde ya estás. */
    cont.appendChild(el('div', { class: 'camino camino--largo', style: { marginBottom: '-2px' } }));

    cont.appendChild(el('div', {
      class: 'mascot mascot--md',
      style: { margin: '0 auto -14px', position: 'relative', zIndex: '3' },
      html: w.Mascot.svg('neutral', { etiqueta: 'Chispa en tu puesto' })
    }));

    if (v) cont.appendChild(puesto(v, { mio: true, aura: true }));

    /* .tiny va en mayúsculas por defecto y aquí no debe: es una frase que
       acompaña, no un rótulo. Mismo apaño que usan las demás pantallas. */
    cont.appendChild(el('div', { class: 'tiny t-center',
      style: { marginTop: '2px', textTransform: 'none', letterSpacing: '0' },
      text: 'Cuando alguien llegue, lo verás aquí.' }));

    /* Lo que se enseña no está al día: o avanzó en la app, o corrigió una
       línea y no la volvió a aprobar. La copy vale para los dos casos a
       propósito — decir «avanzaste» cuando en realidad fue él quien editó
       sonaría a que la app no se entera de lo que pasa. */
    if (P2.hayNovedad()) {
      cont.appendChild(el('button', { class: 'card card--accent card--tight', type: 'button',
        style: { textAlign: 'left', width: '100%' },
        onclick: function () { UI.Router.go('plaza-vitrina'); } }, [
        el('div', { class: 'small', style: { fontWeight: '900' }, text: 'Tu puesto no está al día' }),
        el('div', { class: 'tiny', style: { marginTop: '4px', textTransform: 'none', letterSpacing: '0' },
          text: 'Cambió algo desde que lo abriste. Míralo y decides.' })
      ]));
    }

    cont.appendChild(UI.btn('Invitar a alguien que conoces', {
      variant: 'brand', size: 'sm', onClick: invitar
    }));
    cont.appendChild(UI.btn('Revisar mi vitrina', {
      variant: 'flat', onClick: function () { UI.Router.go('plaza-vitrina'); }
    }));

    root.appendChild(cont);
    return root;
  }

  /* La única conexión real que la app puede producir hoy: pasarle el enlace a
     alguien que ya conoce. No promete que esa persona vaya a entrar, y no
     dice que la Plaza esté llena. */
  function invitar() {
    var texto = 'Estoy usando ' + (w.BRAND ? w.BRAND.nombre : 'Modo Emprendedor') +
                ' para armar mi negocio. Te dejo el enlace por si te sirve.';
    var url = (w.BRAND && w.BRAND.dominios.app) || '';

    if (w.navigator && w.navigator.share) {
      w.navigator.share({ text: texto, url: url }).catch(function () { /* canceló */ });
      return;
    }
    // copy() ya avisa por su cuenta al conseguirlo; aquí solo queda el fallo.
    UI.copy(texto + ' ' + url).catch(function () {
      UI.toast('No se pudo copiar aquí', 'red', '📣');
    });
  }

  /* ==================================================================
     RUTAS

     Dos y no una: la plaza y la vitrina son sitios distintos, y con una sola
     ruta el botón de atrás de la vitrina no tendría a dónde volver.
     ================================================================== */

  function renderPlaza() {
    /* Sin puesto abierto no hay plaza que enseñar: se entra por la vitrina.
       Se decide aquí y no en quien llama para que llegar por cualquier
       camino —la puerta de Negocio, un enlace, un refresco— acabe igual. */
    if (!P().abierta()) return pantallaRevisar(P().propuesta());
    return pantallaPlaza();
  }

  function renderVitrina() {
    return pantallaRevisar(P().propuesta());
  }

  UI.Router.register('plaza', renderPlaza);
  UI.Router.register('plaza-vitrina', renderVitrina);

  /* ==================================================================
     LA PUERTA

     La usa js/screens/business.js. Enseña la promesa la primera vez y luego
     entra. `hayAlgo()` decide si la puerta se pinta siquiera: una entrada que
     lleva a "todavía no hay datos" es peor que no tenerla.
     ================================================================== */

  function abrir() {
    antesDeAbrir(function () { UI.Router.go('plaza'); });
  }

  /** ¿Tiene sentido ofrecerle la Plaza?

      Dos casos, y el segundo se me pasó al escribir esto la primera vez:

        · Todavía no tiene puesto. Solo si la vitrina está lista, porque si no
          la puerta llevaría a una lista de huecos.
        · Ya tiene puesto abierto. SIEMPRE, aunque el perfil se haya quedado
          incompleto después. Con la primera regla sola, quien borrara su
          cliente perdía la única puerta que tenía para revisar o cerrar un
          puesto que sigue guardado. */
  function hayAlgo() {
    try {
      if (P().abierta()) return true;
      var p = P().propuesta();
      return !!(p && p.listo);
    } catch (e) { return false; }
  }

  w.PlazaScreen = { open: abrir, hayAlgo: hayAlgo, promesa: antesDeAbrir };
})(window, document);
