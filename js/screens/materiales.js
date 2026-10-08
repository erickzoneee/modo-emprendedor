/* ==========================================================================
   MATERIAL LISTO PARA USAR — la pantalla

   Ocho textos escritos con lo que la app ya sabe del negocio. Un carrusel
   arriba, el texto en medio, copiar y compartir abajo.

   LO QUE ESTA PANTALLA NO HACE, Y ES LO QUE LA DEFINE

   No pregunta nada. Ni un campo, ni un formulario, ni un «para escribirte la
   publicación necesito saber…». Si le falta un dato a Chispa, el material
   sale APAGADO y dice qué le falta, con un camino para contárselo — pero
   nunca se lo pide aquí. Esta es la pantalla que existe para demostrar que la
   app se acordaba; abrir un formulario sería confesar lo contrario.

   TODO PASA SIN CONEXIÓN
   Las plantillas son deterministas y viven en js/data/materiales.js. Si hay
   IA, se puede pedir otra redacción encima, pero el texto de base sale
   siempre, en el metro y sin batería de datos.

   ES DE IMPULSO
   `hay()` es la única puerta. Quien no lo tiene no llega aquí: la pestaña no
   existe y el plan de la semana tampoco le manda.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  /* Cuál se está viendo. Vive fuera de render() para sobrevivir a un
     repintado —cambiar de material NO recarga la pantalla entera, solo el
     cuerpo— y para que volver de otra pantalla te deje donde estabas. */
  var actual = null;
  var reescrito = {};   // id -> texto que devolvió la IA, si se pidió

  function catalogo() { return (w.MATERIALES && w.MATERIALES.LISTA) || []; }
  function datos() { return (w.MATERIALES && w.MATERIALES.DATOS) || {}; }

  function hay() {
    return !!(w.Impulso && w.Impulso.activo() && catalogo().length);
  }

  /* ==================================================================
     QUÉ SABE Y QUÉ LE FALTA
     ================================================================== */

  /** Qué datos de los que pide un material no están todavía. */
  function faltan(mat, t) {
    var out = [];
    (mat.pide || []).forEach(function (clave) {
      var tiene = false;
      if (clave === 'producto') tiene = !!t.tiene.producto;
      else if (clave === 'cliente') tiene = !!t.tiene.cliente;
      else if (clave === 'precio') tiene = !!t.precio;
      else if (clave === 'problema') tiene = !!(w.Store.state.dossier.problema);
      if (!tiene) out.push(clave);
    });
    return out;
  }

  function listo(mat, t) { return faltan(mat, t).length === 0; }

  /* ==================================================================
     LA PANTALLA
     ================================================================== */

  function render(params) {
    params = params || {};
    var root = el('div', { class: 'screen' });

    root.appendChild(el('div', { class: 'row' }, [
      UI.backBtn(function () { UI.Router.back('home'); }),
      el('div', { class: 'grow' }),
      w.ImpulsoScreen ? w.ImpulsoScreen.sello() : null
    ]));

    if (!hay()) {
      root.appendChild(el('div', { class: 'col', style: { alignItems: 'center', gap: '10px', textAlign: 'center' } }, [
        el('div', { class: 'mascot mascot--lg', html: w.Mascot.svg('think') }),
        el('h1', { class: 'h2', text: 'Esto es de Impulso' }),
        el('p', { class: 'p', text: 'Aquí te escribo tu publicación, tu mensaje de venta y tu cotización con lo que ya me contaste.' })
      ]));
      root.appendChild(UI.btn('Ver qué es Impulso', {
        variant: 'brand', onClick: function () { UI.Router.go('impulso', { desde: 'materiales' }); }
      }));
      return root;
    }

    var t = w.Venture.terms();
    var lista = catalogo();

    // Cuál abrir: el que pidieron, el que estaba, o el primero que esté listo.
    var pedido = params.material && porId(params.material);
    actual = pedido || (actual && porId(actual.id)) || primeroListo(lista, t);

    root.appendChild(el('h1', { class: 'h3', style: { margin: '0' }, text: '✍️ Material listo' }));
    root.appendChild(el('div', { class: 'small',
      text: 'Lo escribo con lo que ya me contaste. No te voy a preguntar nada otra vez.' }));

    root.appendChild(carrusel(lista, t, root));

    var cuerpo = el('div', { id: 'mat-cuerpo', class: 'col', style: { gap: 'var(--s4)' } });
    root.appendChild(cuerpo);
    pintarCuerpo(cuerpo, t);

    return root;
  }

  function porId(id) {
    var l = catalogo();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  function primeroListo(lista, t) {
    for (var i = 0; i < lista.length; i++) if (listo(lista[i], t)) return lista[i];
    return lista[0];
  }

  /* ------------------------- El carrusel -------------------------

     Los que no están listos se quedan en la fila y salen apagados, no
     escondidos. Esconderlos haría creer que no existen; enseñarlos apagados
     enseña que hay más y qué falta para llegar. */

  function carrusel(lista, t, root) {
    var fila = el('div', { class: 'row hscroll', style: { gap: '8px' } });

    lista.forEach(function (mat) {
      var ok = listo(mat, t);
      var activo = actual && actual.id === mat.id;
      var chip = el('button', {
        class: 'chip ' + (activo ? 'chip--brand' : 'chip--outline'),
        type: 'button',
        style: ok ? {} : { opacity: '.55' },
        onclick: function () {
          w.Sound.tap();
          actual = mat;
          // Se repinta la fila y el cuerpo, no la pantalla: así no salta el
          // scroll ni se pierde el sitio del carrusel.
          var vieja = root.querySelector('.hscroll');
          if (vieja) vieja.replaceWith(carrusel(lista, t, root));
          pintarCuerpo(d.getElementById('mat-cuerpo'), t);
        }
      }, [
        el('span', { text: mat.icon }),
        el('span', { text: ' ' + mat.nombre })
      ]);
      if (activo) chip.setAttribute('data-activo', '1');
      fila.appendChild(chip);
    });

    /* Traer a la vista el que está abierto.

       Hace falta cuando se llega desde fuera —una tarea del plan manda a
       `materiales` con su material— y el elegido está a media fila de
       distancia. Sin esto se abría la cotización con el carrusel enseñando
       la publicación, y parecía que el botón no había hecho nada.

       En el siguiente fotograma porque la fila todavía no está en el
       documento: antes de eso no tiene ancho y `scrollIntoView` no mueve nada. */
    w.requestAnimationFrame(function () {
      var abierto = fila.querySelector('[data-activo]');
      if (!abierto || !abierto.scrollIntoView) return;
      try { abierto.scrollIntoView({ block: 'nearest', inline: 'center' }); }
      catch (e) { /* navegador viejo: se queda donde estaba, y no pasa nada */ }
    });

    return fila;
  }

  /* ------------------------- El cuerpo ------------------------- */

  function pintarCuerpo(cuerpo, t) {
    if (!cuerpo) return;
    UI.clear(cuerpo);
    var mat = actual;
    if (!mat) return;

    var pendientes = faltan(mat, t);
    if (pendientes.length) {
      cuerpo.appendChild(bloqueFalta(mat, pendientes));
      return;
    }

    var texto = reescrito[mat.id] || mat.texto(t);

    var card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'tiny', text: mat.nombre + ' · ' + mat.para }));
    var caja = el('div', { class: 'imp-mat', style: { marginTop: '10px' }, text: texto });
    card.appendChild(caja);

    card.appendChild(el('div', { class: 'row', style: { gap: '8px', marginTop: '12px' } }, [
      UI.btn('Copiar', { variant: 'brand', block: false, onClick: function () {
        UI.copy(caja.textContent);
      } }),
      UI.btn('Compartir', { variant: 'ghost', block: false, onClick: function () {
        compartir(caja.textContent, mat);
      } })
    ]));

    /* Otra redacción, solo si hay IA. No es un botón que siempre está y a
       veces falla: si no hay proveedor, no se pinta.

       `disponible()` y no `isOn()`: el segundo solo habla de la clave
       personal, y aquí sirve igual el modelo local o el Worker gratuito. */
    if (w.AI && w.AI.disponible && w.AI.disponible()) {
      card.appendChild(UI.btn('Escríbeme otra distinta', {
        variant: 'flat', size: 'sm',
        onClick: function (e, boton) { otraRedaccion(mat, t, caja, boton); }
      }));
    }

    cuerpo.appendChild(card);

    if (mat.nota) {
      cuerpo.appendChild(el('div', { class: 'card card--tight' }, [
        el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
          el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('explicando') }),
          el('div', { class: 'speech' }, [
            el('div', { class: 'small', text: mat.nota })
          ])
        ])
      ]));
    } else {
      cuerpo.appendChild(el('div', { class: 'card card--tight' }, [
        el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
          el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('happy') }),
          el('div', { class: 'speech' }, [
            el('div', { class: 'small', text: 'Salió de tu oferta, tu cliente y tu precio. Si cambias alguno, lo reescribo.' })
          ])
        ])
      ]));
    }
  }

  /** Lo que se ve cuando falta un dato. Dice QUÉ falta y lleva a contarlo.
      Nunca abre un formulario aquí: esta pantalla no pregunta. */
  function bloqueFalta(mat, pendientes) {
    var D = datos();
    var nombres = pendientes.map(function (k) { return (D[k] && D[k].label) || k; });
    var destino = (D[pendientes[0]] && D[pendientes[0]].ir) || 'venture';

    var frase = nombres.length === 1
      ? 'Para escribirte esto me falta saber ' + nombres[0] + '.'
      : 'Para escribirte esto me faltan dos cosas: ' + nombres.join(' y ') + '.';

    return el('div', { class: 'card' }, [
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('think') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: frase })
        ])
      ]),
      el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginTop: '10px' },
        text: 'No te lo pregunto aquí. Cuéntamelo donde se cuenta y esto se escribe solo.' }),
      UI.btn('Contárselo a Chispa', {
        variant: 'brand', onClick: function () { UI.Router.go(destino); }
      })
    ]);
  }

  /* ------------------------- Compartir ------------------------- */

  function compartir(texto, mat) {
    if (w.navigator && w.navigator.share) {
      w.navigator.share({ text: texto }).catch(function () { /* canceló */ });
      return;
    }
    UI.copy(texto);
    UI.toast('Copiado. Pégalo donde lo necesites.', 'green', '📋', 3000);
  }

  /* ------------------------- Otra redacción -------------------------

     La IA reescribe, nunca decide. Se le manda el texto determinista ya
     hecho y se le pide otra forma de decir lo mismo: si devuelve algo raro o
     no devuelve nada, se queda el de siempre, que ya estaba bien.
     ------------------------------------------------------------------------ */

  function otraRedaccion(mat, t, caja, boton) {
    if (boton) { boton.disabled = true; }
    UI.toast('Le doy otra vuelta…', 'blue', '✍️');

    var base = mat.texto(t);
    var prompt = 'Reescribe este texto con otras palabras, en español de México, ' +
      'directo y sin adornos. Mantén exactamente la misma estructura, la misma ' +
      'longitud y TODOS los huecos entre corchetes tal cual están. No inventes ' +
      'datos que no aparezcan.\n\n' + base;

    w.AI.ask(prompt).then(function (r) {
      if (boton) boton.disabled = false;
      /* Las tres vías de AI.ask() —clave personal, modelo local y Worker—
         resuelven con una CADENA, no con un objeto. Se acepta también la
         forma con `.texto` por si algún día alguna cambia: costar dos líneas
         es más barato que un botón que deja de funcionar en silencio. */
      var texto = (typeof r === 'string') ? r : (r && (r.texto || r.text));
      if (!texto || String(texto).length < 20) {
        UI.toast('No me salió mejor que la que ya tenías.', 'blue', '🕯️', 3000);
        return;
      }
      reescrito[mat.id] = String(texto).trim();
      caja.textContent = reescrito[mat.id];
      w.Sound.coin();
    }).catch(function () {
      if (boton) boton.disabled = false;
      UI.toast('No pude ahora mismo. El de siempre sigue ahí.', 'blue', '🕯️', 3000);
    });
  }

  UI.Router.register('materiales', render);

  w.MaterialesScreen = { hay: hay, abrir: function (id) { UI.Router.go('materiales', { material: id }); } };
})(window, document);
