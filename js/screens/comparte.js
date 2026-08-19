/* ==========================================================================
   COMPARTIR UN AVANCE — la hoja

   Tres diseños ya hechos y una sola decisión: cuál. Sin formulario, sin
   preguntas y sin campos que rellenar — el motor trabaja con lo que el
   usuario ya contó, y si un dato falta ese logro sencillamente no se ofrece.

   Nunca bloquea. Se abre después de la celebración, encolada para no pisarla,
   y "Ahora no" cierra y sigue.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  /* Un canvas por estilo cuesta tres rasterizados del SVG. Se guardan mientras
     la hoja está abierta: deslizar entre estilos no debe volver a dibujar. */
  var cache = {};
  var enCurso = {};

  /* Tres lienzos de 1080x1920 son unos 25 MB de mapa de bits. Se sueltan al
     cerrar la hoja: sin esto quedaban retenidos toda la sesión. */
  function limpiarCache() {
    for (var k in cache) {
      if (!Object.prototype.hasOwnProperty.call(cache, k)) continue;
      try { cache[k].width = cache[k].height = 0; } catch (e) {}
    }
    cache = {};
    enCurso = {};
  }

  /* ------------------------- Ofrecimiento -------------------------

     El mensaje que aparece tras celebrar. No lleva la imagen todavía: es una
     invitación, y generar tres visuales para alguien que va a decir "ahora
     no" es trabajo tirado.
     ---------------------------------------------------------------- */

  /* Un ofrecimiento por avance y por sesión. Volver a proponer lo mismo cada
     vez que se toca ese dato convierte una buena idea en una molestia. Vive en
     memoria y no en Store a propósito: no merece ocupar sitio en el respaldo
     del usuario, y que reaparezca mañana está bien. */
  var yaOfrecidos = {};

  function ofrecer(idLogro) {
    if (yaOfrecidos[idLogro]) return false;
    var prop = w.Comparte.propuesta(idLogro);
    if (!prop) return false;
    yaOfrecidos[idLogro] = true;

    /* queueModal recibe una FUNCIÓN, no contenido: así el modal se construye
       en el momento en que le toca salir y no cuando se encola. Importa aquí,
       porque entre encolar y mostrar puede haberse abierto la celebración del
       logro, que es justo la que no hay que pisar. */
    UI.queueModal(function () {
      UI.modal([
        UI.chispaDice(prop.chispa, [
          el('h2', { class: 'h3', text: 'Este avance también sirve fuera de aquí' }),
          el('div', { class: 'small', style: { marginTop: '6px' },
            text: 'Preparé algo para que presentes tu idea y la impulses. Tú eliges si lo usas.' })
        ], { grande: true, entrada: true }),
        UI.btn('Ver mis diseños', {
          variant: 'brand', size: 'lg',
          onClick: function () { UI.closeModal(); setTimeout(function () { abrir(idLogro); }, 220); }
        }),
        UI.btn('Ahora no', { variant: 'flat', onClick: function () { UI.closeModal(); } })
      ]);
    });
    return true;
  }

  /* ------------------------- La hoja -------------------------- */

  function abrir(idLogro) {
    var prop = w.Comparte.propuesta(idLogro);
    if (!prop) { UI.toast('Todavía no hay datos suficientes', 'blue', '💡'); return; }

    limpiarCache();
    var estiloActual = prop.estilos[0].id;
    var formatoActual = 'historia';

    var lienzo = el('div', { class: 'comparte__lienzo' });
    var pie = el('div', { class: 'col', style: { gap: '10px' } });

    /* Cada pintado lleva número. Deslizar deprisa entre estilos lanzaba varios
       dibujados a la vez y el que terminaba último ganaba la vista previa, que
       podía no ser el elegido: se veía uno y se compartía otro. */
    var generacion = 0;

    function pintar() {
      var mio = ++generacion;
      UI.clear(lienzo);
      lienzo.appendChild(el('div', { class: 'comparte__cargando', text: 'Preparando…' }));
      var clave = estiloActual + ':' + formatoActual;

      var listo = cache[clave]
        ? Promise.resolve(cache[clave])
        : w.Comparte.componer(prop, estiloActual, formatoActual)
            .then(function (cv) { cache[clave] = cv; return cv; });
      enCurso[clave] = listo;

      listo.then(function (cv) {
        if (mio !== generacion) return;      // llegó tarde: manda el último
        UI.clear(lienzo);
        var img = el('img', {
          class: 'comparte__img',
          alt: 'Vista previa de tu publicación: ' + prop.logro.titulo,
          src: cv.toDataURL('image/png')
        });
        lienzo.appendChild(img);
      }).catch(function (e) {
        if (mio !== generacion) return;
        UI.clear(lienzo);
        lienzo.appendChild(el('div', { class: 'comparte__cargando',
          text: 'No se pudo preparar la imagen en este dispositivo.' }));
        console.warn('[comparte]', e);
      });
    }

    /* Selector de estilo. Los tres ya existen: solo se elige. */
    var estilos = el('div', { class: 'comparte__estilos' });
    prop.estilos.forEach(function (s) {
      var b = el('button', {
        class: 'comparte__estilo' + (s.id === estiloActual ? ' is-sel' : ''),
        type: 'button',
        style: { background: 'linear-gradient(135deg,' + s.fondo[0] + ',' + s.fondo[1] + ')' },
        onclick: function () {
          estiloActual = s.id;
          UI.qsa('.comparte__estilo', estilos).forEach(function (n) { n.classList.remove('is-sel'); });
          b.classList.add('is-sel');
          w.Sound.select();
          pintar();
        }
      }, [el('span', { style: { color: s.tinta }, text: s.nombre })]);
      estilos.appendChild(b);
    });

    var formatos = el('div', { class: 'row', style: { gap: '8px', justifyContent: 'center' } });
    ['historia', 'post'].forEach(function (f) {
      var b = UI.btn(w.Comparte.FORMATOS[f].nombre, {
        variant: f === formatoActual ? 'ghost' : 'flat', size: 'sm', block: false,
        onClick: function () {
          formatoActual = f;
          UI.qsa('.btn', formatos).forEach(function (n) {
            n.classList.remove('btn--ghost'); n.classList.add('btn--flat');
          });
          b.classList.remove('btn--flat'); b.classList.add('btn--ghost');
          pintar();
        }
      });
      formatos.appendChild(b);
    });

    pie.appendChild(UI.btn('Compartir', {
      variant: 'brand', size: 'lg',
      onClick: function (e, boton) {
        var clave = estiloActual + ':' + formatoActual;
        // Antes salía en silencio si el lienzo no estaba listo: pulsar durante
        // el "Preparando…" no hacía absolutamente nada y parecía roto. Ahora
        // espera al dibujado en curso.
        var espera = cache[clave] ? Promise.resolve(cache[clave]) : enCurso[clave];
        if (!espera) { UI.toast('La imagen todavía se está preparando', 'blue', '⏳'); return; }
        boton.disabled = true;
        espera.then(function (cv) { return w.Comparte.aBlob(cv); })
          .then(function (blob) { return w.Comparte.salir(blob, prop, formatoActual); })
          .then(function (r) {
            boton.disabled = false;
            if (r === 'descargado') UI.toast('Imagen descargada', 'green', '⬇️');
          })
          .catch(function (err) {
            boton.disabled = false;
            UI.toast((err && err.message) || 'No se pudo compartir', 'red', '⚠️');
          });
      }
    }));
    pie.appendChild(UI.btn('Cerrar', { variant: 'flat', onClick: UI.closeSheet }));

    UI.sheet([
      el('div', { class: 'col', style: { gap: '4px' } }, [
        el('h2', { class: 'h3', text: prop.logro.titulo }),
        el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0' },
          text: 'Con lo que ya contaste. Puedes compartirlo tal cual.' })
      ]),
      estilos,
      lienzo,
      formatos,
      pie
    ], { onClose: limpiarCache });

    pintar();
  }

  w.CompartirAvance = { ofrecer: ofrecer, abrir: abrir };
})(window, document);
