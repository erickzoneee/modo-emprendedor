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

  /* La tercera fila cambia sola según exista o no la Plaza, y no es un
     detalle: es una promesa, y una promesa solo se puede hacer cuando se
     puede cumplir.

     Sin servidor, lo único cierto es que nadie ve tu puesto. Con servidor,
     eso deja de serlo — pero entra en vigor otra cosa que sí se cumple, y
     esta vez porque el código lo impide: hasta que los dos aceptan, la
     conversación no existe en la base. No es una comprobación que alguien
     pueda olvidar; es que no hay fila donde escribir. */
  function filasPromesa() {
    var hayPlaza = w.PlazaNube && w.PlazaNube.hay();
    return [
      ['🔎', 'Sale solo lo que apruebes', 'Lo ves entero antes, y lo puedes cambiar.'],
      ['🔒', 'No salen tus números',      'Precios, costos y tu plan se quedan aquí.'],
      hayPlaza
        ? ['🤝', 'Nadie te escribe primero', 'Solo si los dos quieren hablar.']
        : ['🕯️', 'Todavía no te ve nadie',   'Te aviso el día que la Plaza abra.']
    ];
  }

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
    filasPromesa().forEach(function (f) {
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
     ENTRAR A LA PLAZA

     Un correo y nada más. No hay contraseña que recordar ni perfil que
     rellenar: el correo sirve para volver a ser tú en otro teléfono y para
     poder pedir que se borre lo tuyo. Nada más.
     ================================================================== */

  function conectar(alEntrar) {
    var input = el('input', { class: 'input', type: 'email', maxlength: '254',
      placeholder: 'tucorreo@ejemplo.com', autocomplete: 'email' });

    var aviso = el('div', { class: 'tiny',
      style: { color: 'var(--red)', display: 'none', textTransform: 'none', letterSpacing: '0' },
      text: 'Ese correo no parece completo. Míralo otra vez.' });

    UI.sheet([
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('explicando') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: 'Te mando un enlace. Con eso entras, sin contraseñas.' })
        ])
      ]),
      input,
      aviso,
      /* La única línea sobre datos que ve dentro de la app. El aviso completo
         vive en la web, no aquí: esto es una frase de Chispa, no un contrato.
         Y se puede cumplir literalmente — el correo se guarda como huella, no
         en claro, así que ni el servidor tiene la lista. */
      el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0' },
        text: 'Tu correo solo sirve para que puedas volver a entrar. No lo enseño a nadie.' }),
      UI.btn('Mándame el enlace', { variant: 'brand', size: 'lg', onClick: function () {
        var correo = (input.value || '').trim();
        if (correo.indexOf('@') < 1 || correo.indexOf('.') < 0 || correo.length < 6) {
          aviso.style.display = '';
          w.Sound.wrong();
          return;
        }
        UI.closeSheet();
        UI.toast('Mandando…', 'blue', '📣');
        w.PlazaNube.entrar(correo, true).then(function (r) {
          if (r && r.ok) {
            revisaTuCorreo(correo);
            if (typeof alEntrar === 'function') alEntrar();
          } else {
            UI.toast(w.PlazaNube.excusa(r), 'red', '🕯️');
          }
        });
      } }),
      UI.btn('Ahora no', { variant: 'flat', onClick: UI.closeSheet })
    ]);
  }

  function revisaTuCorreo(correo) {
    UI.queueModal(function () {
      UI.modal([
        el('div', { class: 'col', style: { alignItems: 'center', gap: '10px', textAlign: 'center' } }, [
          el('div', { class: 'mascot mascot--lg is-happy', html: w.Mascot.svg('happy', { plano: true }) }),
          el('h2', { class: 'h3', text: 'Te mandé un enlace' }),
          el('div', { class: 'small', text: 'Míralo en ' + correo + '. Con tocarlo, entras.' }),
          /* Se dice lo del spam porque el dominio es nuevo y de verdad pasa.
             Callarlo es dejar a alguien pensando que la app no funciona. */
          el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0' },
            text: 'Si no aparece en unos minutos, mira en spam. El correo caduca en 15 minutos.' })
        ]),
        UI.btn('Entendido', { variant: 'brand', onClick: UI.closeModal })
      ]);
    });
  }

  /**
   * Mira si venimos de un enlace del correo. Lo llama js/app.js al arrancar.
   *
   * El token viaja en el fragmento (#) y no en la query (?) a propósito: así
   * no sale del navegador, no entra en el historial del servidor ni en la
   * cabecera Referer. Se lee, se canjea, y se borra de la barra de
   * direcciones antes de que a nadie le dé tiempo a copiarla.
   */
  function revisarEnlace() {
    var h = String(w.location.hash || '');
    var m = h.match(/[#&]plaza=([^&]+)/);
    if (!m) return false;

    var token = decodeURIComponent(m[1]);
    try {
      w.history.replaceState(null, '', w.location.pathname + w.location.search);
    } catch (e) { w.location.hash = ''; }

    UI.toast('Entrando…', 'blue', '🕯️');
    w.PlazaNube.confirmar(token, true).then(function (r) {
      if (r && r.ok) {
        w.Sound.coin();
        UI.toast('Ya estás dentro', 'green', '🤝');
        /* Si ya tenía puesto aprobado, se publica solo: aprobarlo fue su
           decisión y no hay que volver a pedírsela por haber cambiado de
           teléfono. */
        var v = P().vitrina();
        if (v) w.PlazaNube.publicar(v);
        UI.Router.go('plaza');
      } else {
        UI.toast(w.PlazaNube.excusa(r), 'red', '🕯️');
      }
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
            if (P2.conectado()) w.PlazaNube.retirar();
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

    /* Si ya está conectado, el puesto sale también hacia la Plaza. Si no, se
       queda guardado aquí y saldrá el día que entre con su correo: aprobar y
       publicar son dos cosas distintas, y mezclarlas obligaría a pedirle el
       correo justo cuando está decidiendo si se fía. */
    if (P().conectado()) {
      w.PlazaNube.publicar(v).then(function (r) {
        if (!r || !r.ok) UI.toast(w.PlazaNube.excusa(r), 'red', '🕯️');
        else P().olvidarVecinos();
      });
    }

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

  /* Se pide una vez por visita, no en cada repintado: la pantalla se refresca
     sola al editar, al enviar y al volver, y sin este freno cada gesto sería
     una llamada al servidor. */
  var pidiendo = false;

  function traerVecinos() {
    if (pidiendo || !P().conectado() || P().preguntado()) return;
    pidiendo = true;
    w.PlazaNube.vecinos().then(function (r) {
      pidiendo = false;
      if (r && r.ok) {
        P().guardarVecinos(r.vecinos || []);
        if (UI.Router.current === 'plaza') UI.Router.refresh();
      }
    });
  }

  function pantallaPlaza() {
    var P2 = P();
    var v = P2.vitrina();

    traerVecinos();

    var root = el('div', { class: 'screen plaza' });
    root.appendChild(el('div', { class: 'plaza__sol' }));
    root.appendChild(el('div', { class: 'plaza__bruma' }));
    root.appendChild(el('div', { class: 'plaza__suelo' }));

    var cont = el('div', { class: 'plaza__cont' });

    /* Las recomendaciones, si las hay. Se calculan aquí y no antes porque
       dependen de la vitrina aprobada, que puede haber cambiado. */
    var recs = [];
    if (v && w.PlazaMotor) {
      try {
        recs = w.PlazaMotor.recomendar(v, P2.vecinos(), { max: 3, excluir: P2.enviados() });
      } catch (e) { recs = []; }
    }
    var hayGente = P2.hayVecinos();

    cont.appendChild(cabecera(recs, hayGente));

    if (recs.length) {
      recs.forEach(function (r, i) {
        if (i > 0) cont.appendChild(el('div', { class: 'camino camino--on' }));
        cont.appendChild(tarjeta(r, v));
      });
      /* El camino que baja hasta tu puesto: la luz viene hacia ti. */
      cont.appendChild(el('div', { class: 'camino camino--on camino--baja' }));
    } else {
      cont.appendChild(el('div', { class: 'grow' }));
      /* El camino que sale de la plaza. Apagado, porque no lleva a nadie
         todavía: lo único que hace es llevar tu puesto a donde ya estás. */
      cont.appendChild(el('div', { class: 'camino camino--largo', style: { marginBottom: '-2px' } }));
      cont.appendChild(el('div', {
        class: 'mascot mascot--md',
        style: { margin: '0 auto -14px', position: 'relative', zIndex: '3' },
        html: w.Mascot.svg('neutral', { etiqueta: 'Chispa en tu puesto' })
      }));
    }

    if (v) cont.appendChild(puesto(v, { mio: true, aura: !recs.length }));

    /* Los que ya saludó. Van en su propia sección, debajo de tu puesto, y no
       mezclados con las recomendaciones: los huecos de arriba son para gente
       nueva. Pero tienen que estar en algún sitio — al excluirlos sin más, la
       tarjeta desaparecía al enviar y no quedaba ni rastro de lo que hizo. */
    var esperando = enEspera();
    if (esperando.length) {
      cont.appendChild(el('h2', { class: 'sep', style: { marginTop: '6px' },
        text: UI.count(esperando.length, 'saludo enviado', 'saludos enviados') }));
      esperando.forEach(function (e) { cont.appendChild(tarjeta(e, v)); });
      cont.appendChild(el('div', { class: 'tiny t-center',
        style: { textTransform: 'none', letterSpacing: '0' },
        text: 'Esto tarda. Nunca es por tu idea.' }));
    }

    /* Solo cuando de verdad se ha mirado y no hay nadie. Antes de entrar con
       el correo no se ha preguntado, y decir «cuando alguien llegue lo verás
       aquí» ahí contradice al propio Chispa de arriba, que acaba de pedir el
       correo justo para poder mirar.

       .tiny va en mayúsculas por defecto y aquí no debe: es una frase que
       acompaña, no un rótulo. Mismo apaño que usan las demás pantallas. */
    var yaMire = !w.PlazaNube.hay() || (P2.conectado() && P2.preguntado());
    if (!hayGente && yaMire) {
      cont.appendChild(el('div', { class: 'tiny t-center',
        style: { marginTop: '2px', textTransform: 'none', letterSpacing: '0' },
        text: 'Cuando alguien llegue, lo verás aquí.' }));
    }

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

    if (w.PlazaNube.hay() && !P2.conectado()) {
      cont.appendChild(UI.btn('Entrar con mi correo', {
        variant: 'brand', size: 'lg', shiny: true,
        onClick: function () { conectar(); }
      }));
    } else if (!hayGente) {
      cont.appendChild(UI.btn('Invitar a alguien que conoces', {
        variant: 'brand', size: 'sm', onClick: invitar
      }));
    }
    cont.appendChild(UI.btn('Revisar mi vitrina', {
      variant: 'flat', onClick: function () { UI.Router.go('plaza-vitrina'); }
    }));

    root.appendChild(cont);
    return root;
  }

  /** Los emprendimientos a los que ya les dijo que ve valor, con la forma que
      espera tarjeta(). Se buscan entre los vecinos de ahora: si alguno cerró
      su puesto, simplemente deja de aparecer, que es lo correcto. */
  function enEspera() {
    var P2 = P();
    var enviados = P2.enviados();
    var out = [];
    P2.vecinos().forEach(function (v) {
      if (!enviados[v.id]) return;
      out.push({ vitrina: v, motivo: null, porque: '', icono: '🕯️' });
    });
    return out;
  }

  /* ------------------------- La cabecera -------------------------

     Cuatro estados, y cada uno dice la verdad de su momento. El tercero —hay
     gente pero hoy no encontré razón— es el que le da carácter a todo lo
     demás: si la Plaza es capaz de decir "hoy no", el día que diga "mira
     este" se le puede creer. */

  function cabecera(recs, hayGente) {
    /* Antes de entrar con el correo no se puede decir si hay gente o no: no
       se ha preguntado. Decir «no hay nadie» ahí sería mentir por omisión. */
    if (w.PlazaNube.hay() && !P().conectado()) {
      return UI.chispaDice('sugiriendo',
        'Tu puesto está listo. Dime tu correo y te enseño quién más está aquí.');
    }

    if (P().conectado() && !P().preguntado()) {
      return UI.chispaDice('pensando', 'Estoy mirando quién hay…');
    }

    if (!hayGente) {
      return el('div', { class: 'col', style: { alignItems: 'center', gap: '4px', textAlign: 'center' } }, [
        el('h1', { class: 'h2', text: 'Todavía no hay nadie más aquí.' }),
        el('div', { class: 'small', style: { maxWidth: '250px' },
          text: 'No te voy a inventar vecinos falsos.' })
      ]);
    }

    if (!recs.length) {
      var todosSaludados = P().vecinos().length > 0 &&
        P().vecinos().every(function (x) { return P().yaEnviado(x.id); });
      return UI.chispaDice('explicando', todosSaludados
        ? 'Ya saludaste a todos los que hay. Cuando llegue alguien nuevo, lo verás.'
        : 'Hoy no encontré una razón de verdad. Prefiero no inventarte una.');
    }

    return UI.chispaDice('sugiriendo', recs.length === 1
      ? 'Encontré una razón. No es al azar.'
      : 'Encontré ' + UI.num(recs.length) + ' razones. Ninguna es al azar.');
  }

  /* ------------------------- La tarjeta -------------------------

     Cinco cosas y ni una más: toldo, nombre, qué hace, por qué te lo enseño
     y un botón. El porqué va DENTRO de la tarjeta y no debajo, porque es
     parte de la recomendación, no un pie de página. */

  function tarjeta(rec, mia) {
    var P2 = P();
    var v = rec.vitrina;
    var enviado = P2.enviados()[v.id];

    var cuerpo = [
      el('div', { class: 'puesto__nombre', text: P2.titulo(v) || 'Un emprendimiento' })
    ];
    var linea = P2.resumen(v);
    if (linea) cuerpo.push(el('div', { class: 'puesto__linea', text: linea }));

    /* En la lista de espera no hay porqué que enseñar: el motivo ya cumplió
       su función el día que lo saludó, y repetirlo ahí abajo compite con las
       recomendaciones de arriba, que son las que sí piden una decisión. */
    if (rec.porque) {
      cuerpo.push(el('div', { class: 'puesto__porque' }, [
        el('span', { class: 'puesto__porque__ico', text: rec.icono }),
        el('span', { text: rec.porque })
      ]));
    }

    var pie;
    if (enviado) {
      /* Ya dijo que ve valor. No hay chat: hasta que el otro acepte, esto es
         una espera, y así se llama. Se puede deshacer, y hoy deshacerlo es
         gratis porque todavía no salió de aquí. */
      var it = w.PlazaMotor.intencion(enviado.intencion);
      pie = el('button', { class: 'puesto__espera', type: 'button',
        onclick: function () { deshacerValor(rec.vitrina); } }, [
        el('span', { text: '🕯️' }),
        el('span', { class: 'grow', style: { minWidth: '0', textAlign: 'left' } }, [
          el('span', { style: { display: 'block', fontWeight: '900' }, text: 'Le dijiste que ves valor' }),
          el('span', { style: { display: 'block', opacity: '.8' },
            text: it ? it.label : 'Esperando respuesta' })
        ]),
        el('span', { style: { flex: 'none', color: 'var(--ink-3)' }, text: '›' })
      ]);
    } else {
      pie = UI.btn('Veo valor', {
        variant: 'brand', size: 'sm',
        onClick: function () { elegirIntencion(rec, mia); }
      });
    }

    var caja = el('article', {
      class: 'puesto' + (enviado ? ' puesto--enviado' : ''),
      data: { toldo: v.sector || 'otro' }
    }, [
      el('header', { class: 'puesto__toldo' }, [
        el('span', { class: 'puesto__sector', text: P2.rotulo(v) })
      ]),
      el('div', { class: 'puesto__cuerpo' }, cuerpo),
      el('div', { class: 'puesto__pie' }, [pie])
    ]);

    return el('div', { class: 'pz-hueco' }, [caja]);
  }

  function deshacerValor(v) {
    UI.confirm({
      title: '¿Lo retiro?',
      text: 'Dejo de decirle que ves valor en lo suyo. Puedes volver a hacerlo cuando quieras.',
      ok: 'Sí, retíralo', cancel: 'Déjalo así', mood: 'think'
    }).then(function (si) {
      if (!si) return;
      /* Mismo orden que al enviarlo: si el servidor no lo retira, en el
         teléfono tampoco se retira. Si no, la tarjeta desaparecería de aquí
         y el otro seguiría viendo que alguien vio valor en lo suyo. */
      w.PlazaNube.retirarValor(v.id).then(function (r) {
        if (!r || !r.ok) { UI.toast(w.PlazaNube.excusa(r), 'red', '🕯️'); return; }
        P().retirarValor(v.id);
        UI.toast('Retirado', 'blue', '🕯️');
        UI.Router.refresh();
      });
    });
  }

  /* ------------------------- "Veo valor" -------------------------

     Dos pasos y no uno. Primero para qué —eso es lo que el otro va a leer
     antes de decidir si quiere hablar— y después el mensaje. Juntarlos en una
     sola pantalla convertía la decisión en un formulario. */

  function elegirIntencion(rec, mia) {
    var lista = el('div', { class: 'col', style: { gap: '8px' } });

    w.PlazaMotor.INTENCIONES.forEach(function (it) {
      lista.appendChild(el('button', {
        class: 'card card--tight pz-intencion', type: 'button',
        onclick: function () {
          w.Sound.tap();
          UI.closeSheet();
          redactar(rec, mia, it);
        }
      }, [
        el('span', { class: 'pz-intencion__ico', text: it.icon }),
        el('span', { class: 'grow', style: { minWidth: '0', fontWeight: '900' }, text: it.label }),
        el('span', { style: { flex: 'none', color: 'var(--ink-3)' }, text: '›' })
      ]));
    });

    UI.sheet([
      el('h2', { class: 'h3', text: 'Ves valor en ' + (P().titulo(rec.vitrina) || 'esto') }),
      el('div', { class: 'small', text: 'Dime qué te gustaría hacer. Lo va a leer antes de decidir si quiere hablar.' }),
      lista,
      UI.btn('Mejor no', { variant: 'flat', onClick: UI.closeSheet })
    ]);
  }

  function redactar(rec, mia, it) {
    var borrador = w.PlazaMotor.primerMensaje(it.id, rec.motivo, mia);

    /* Siete filas y no cinco: el borrador son tres frases, y a cinco filas
       aparecía una barra de desplazamiento dentro del cuadro. Lo que va a
       mandar con su nombre tiene que poder leerlo entero de un vistazo. */
    var input = el('textarea', { class: 'textarea', rows: '7', maxlength: '600' });
    input.value = borrador;

    var aviso = el('div', { class: 'tiny',
      style: { color: 'var(--red)', display: 'none', textTransform: 'none', letterSpacing: '0' },
      text: 'Todavía no compartas tu contacto. Eso se hace cuando los dos quieran hablar.' });

    UI.sheet([
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('explicando') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: 'Te lo escribí yo. Cámbialo hasta que suene a ti.' })
        ])
      ]),
      el('div', { class: 'row', style: { gap: '8px' } }, [
        el('span', { class: 'chip chip--brand', text: it.icon + ' ' + it.label })
      ]),
      input,
      aviso,
      UI.btn('Enviar', { variant: 'brand', size: 'lg', onClick: function () {
        var texto = (input.value || '').trim();
        if (!texto) { UI.toast('Escribe algo primero', 'red', '✍️'); return; }
        if (P().tieneContacto(texto)) {
          aviso.style.display = '';
          w.Sound.wrong();
          UI.toast('Todavía no pongas tu contacto', 'red', '🔒');
          return;
        }
        /* PRIMERO EL SERVIDOR, Y SOLO SI ACEPTA SE CELEBRA.

           Al revés estaba mal, y lo estuvo: se guardaba en el teléfono, se
           lanzaba el confeti y se decía «Listo. Lo verá cuando abra la app»
           mientras al servidor no llegaba nada. La tarjeta pasaba a
           «esperando» para siempre por algo que nunca se envió, y la persona
           del otro lado no tenía forma de saber que alguien la había buscado.

           Es exactamente la clase de mentira que esta sección entera existe
           para no contar, así que el orden importa: si el servidor no dice
           que sí, aquí no se guarda nada y se dice lo que pasó. */
        UI.toast('Enviando…', 'blue', '📣');

        w.PlazaNube.veoValor(rec.vitrina.id, it.id, rec.motivo, texto).then(function (r) {
          if (!r || !r.ok) {
            UI.toast(w.PlazaNube.excusa(r), 'red', '🕯️');
            return;
          }
          P().veoValor(rec.vitrina.id, it.id, texto);
          UI.closeSheet();
          w.Sound.coin();
          w.FX.celebrate();
          /* Nada de "ya lo sabe": no hay avisos, así que lo sabrá cuando abra
             la app, y eso puede tardar días. */
          UI.toast('Listo. Lo verá cuando abra la app', 'gold', '🕯️');
          UI.Router.refresh();
        });
      } }),
      UI.btn('Ahora no', { variant: 'flat', onClick: UI.closeSheet })
    ]);
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

  w.PlazaScreen = {
    open: abrir,
    hayAlgo: hayAlgo,
    promesa: antesDeAbrir,
    conectar: conectar,
    // lo llama js/app.js al arrancar, por si venimos del enlace del correo
    revisarEnlace: revisarEnlace
  };
})(window, document);
