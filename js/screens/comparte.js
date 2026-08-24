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

  /* Un pintado cuesta un rasterizado del SVG y una codificación PNG. Se guarda
     el resultado mientras la hoja está abierta: deslizar entre estilos no debe
     volver a hacer nada de eso.

     El blob va precalculado a propósito. En iOS, navigator.share() solo
     funciona mientras dura la activación del gesto, y codificar dos
     megapíxeles en medio del handler la consume: el menú nativo no llegaba a
     abrirse. Con el blob ya hecho, compartir es una llamada y punto.

     Se guarda el blob y una URL de objeto, NO el lienzo ni un data: URI. Un
     lienzo de 1080x1920 son 8,3 MB de mapa de bits y su base64 varios cientos
     de KB; con seis combinaciones vivas eso pasaba de 50 MB en un móvil de
     gama baja. El mapa de bits se suelta en cuanto existe el PNG, que es lo
     único que se comparte, se descarga y se enseña. */
  var cache = {};
  var enCurso = {};

  /* La sesión de la hoja. Sin esto, un trabajo lanzado por una hoja anterior
     terminaba después de limpiarCache() y escribía su resultado en la caché de
     la hoja NUEVA. Como la clave no llevaba el logro, aterrizaba justo sobre la
     que la hoja nueva iba a usar: el usuario veía un avance y compartía otro.
     Ahora la clave lleva el id del logro y, además, el trabajo comprueba que
     sigue siendo el vigente antes de escribir nada. */
  var sesion = 0;

  function soltar(listo) {
    if (!listo) return;
    try { if (listo.objeto) URL.revokeObjectURL(listo.url); } catch (e) {}
  }

  function limpiarCache() {
    sesion++;
    for (var k in cache) {
      if (!Object.prototype.hasOwnProperty.call(cache, k)) continue;
      soltar(cache[k]);
    }
    cache = {};
    enCurso = {};
  }

  /** Vista previa y blob de una combinación logro × estilo × formato. */
  function preparar(prop, estilo, formato) {
    var clave = prop.logro.id + ':' + estilo + ':' + formato;
    if (cache[clave]) return Promise.resolve(cache[clave]);
    if (enCurso[clave]) return enCurso[clave];

    var mia = sesion;
    var trabajo = w.Comparte.componer(prop, estilo, formato)
      .then(function (cv) {
        return w.Comparte.aBlob(cv).then(function (blob) {
          return { blob: blob, url: URL.createObjectURL(blob), objeto: true };
        }, function () {
          /* Sin canvas.toBlob no hay nada que compartir, pero sí se puede
             enseñar la vista previa. Antes este fallo dejaba la hoja en blanco
             con un «no se pudo preparar la imagen»; ahora se ve el diseño y
             solo se caen compartir y descargar. */
          return { blob: null, url: cv.toDataURL('image/png'), objeto: false };
        }).then(function (listo) {
          // El mapa de bits ya no lo lee nadie: el PNG está hecho.
          try { cv.width = cv.height = 0; } catch (e) {}
          if (mia !== sesion) { soltar(listo); return listo; }
          cache[clave] = listo;
          delete enCurso[clave];
          return listo;
        });
      })
      .catch(function (e) {
        if (mia === sesion) delete enCurso[clave];
        throw e;
      });

    enCurso[clave] = trabajo;
    return trabajo;
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
       logro, que es justo la que no hay que pisar.

       Y por eso hay que volver a preguntar si el momento sigue siendo bueno:
       entre encolar y salir el usuario puede haberse ido a otra pantalla. El
       caso feo era ponerle nombre al negocio y entrar acto seguido a
       «Registrar una idea nueva»: el ofrecimiento del negocio anterior
       aparecía encima del registro. Si ya no toca, se libera la marca para
       que el avance pueda volver a ofrecerse más tarde. */
    UI.queueModal(function () {
      if (w.Venture && w.Venture.momentoBueno && !w.Venture.momentoBueno()) {
        yaOfrecidos[idLogro] = false;
        return;
      }
      UI.modal([
        UI.chispaDice(prop.chispa, [
          el('h2', { class: 'h3', text: 'Este avance también puede ayudarte fuera de Emprendo' }),
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

  /* ------------------------- Elegir avance -------------------------

     La puerta permanente, desde Mi Negocio. Sin ella, decir "ahora no" perdía
     los diseños para siempre: el ofrecimiento automático era la única entrada
     que tenía la función en toda la app.
     ----------------------------------------------------------------- */

  function elegir() {
    var lista = w.Comparte.disponibles().filter(function (l) {
      return !!w.Comparte.propuesta(l.id);
    });
    if (!lista.length) {
      UI.toast('Todavía no hay un avance con datos suficientes', 'blue', '💡');
      return;
    }
    if (lista.length === 1) { abrir(lista[0].id); return; }

    var filas = lista.map(function (l) {
      return el('button', {
        class: 'card card--tight', type: 'button',
        style: { display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', width: '100%' },
        onclick: function () {
          w.Sound.tap();
          UI.closeSheet();
          setTimeout(function () { abrir(l.id); }, 220);
        }
      }, [
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'small', style: { display: 'block', fontWeight: '900' }, text: l.titulo }),
          el('span', { class: 'tiny', style: { display: 'block', textTransform: 'none', letterSpacing: '0' },
            text: 'Sobre ' + l.tema })
        ]),
        el('span', { style: { flex: 'none', fontSize: '18px' }, text: '›' })
      ]);
    });

    UI.sheet([
      el('h2', { class: 'h3', text: '¿Qué avance quieres compartir?' }),
      el('div', { class: 'small', text: 'Todos usan lo que ya contaste. No hay nada que rellenar.' }),
      el('div', { class: 'col', style: { gap: '10px' } }, filas),
      UI.btn('Cerrar', { variant: 'flat', onClick: UI.closeSheet })
    ]);
  }

  /** ¿Hay algo publicable ahora mismo? Lo consulta Mi Negocio para no pintar
      una puerta que no lleva a ningún sitio. */
  function hayAlgo() {
    try {
      return w.Comparte.disponibles().some(function (l) {
        return !!w.Comparte.propuesta(l.id);
      });
    } catch (e) { return false; }
  }

  /* ------------------------- La hoja -------------------------- */

  function abrir(idLogro) {
    var prop = w.Comparte.propuesta(idLogro);
    if (!prop) { UI.toast('Todavía no hay datos suficientes', 'blue', '💡'); return; }

    limpiarCache();
    var estiloActual = prop.estilos[0].id;
    var formatoActual = 'historia';

    /* El 4:5 solo si la estructura lo permite, que es la condición literal del
       encargo. Tiene bastante menos alto útil que la historia, y un mensaje
       largo no le cabe: en vez de recortarlo por abajo, no se ofrece. */
    var formatosOk = ['historia', 'post'].filter(function (f) {
      try { return w.Comparte.cabe(prop, f); } catch (e) { return false; }
    });
    if (formatosOk.indexOf('historia') < 0) {
      UI.toast('No se pudo preparar la imagen con este texto', 'red', '⚠️');
      return;
    }

    var lienzo = el('div', { class: 'comparte__lienzo' });
    var pie = el('div', { class: 'col', style: { gap: '10px' } });
    var btnCompartir, btnDescargar;

    /* Cada pintado lleva número. Deslizar deprisa entre estilos lanzaba varios
       dibujados a la vez y el que terminaba último ganaba la vista previa, que
       podía no ser el elegido: se veía uno y se compartía otro. */
    var generacion = 0;
    var actual = null;              // el {canvas, blob, url} que se está viendo

    function habilitar(on) {
      if (btnCompartir) btnCompartir.disabled = !on;
      if (btnDescargar) btnDescargar.disabled = !on;
    }

    /* Sin blob no hay archivo: el navegador no sabe exportar el lienzo. La
       vista previa sí se ve, así que el usuario puede mirar los diseños; lo
       que no puede es sacarlos, y se le dice en vez de fallar en silencio. */
    function listoParaSalir() {
      if (!actual) { UI.toast('La imagen todavía se está preparando', 'blue', '⏳'); return false; }
      if (!actual.blob) {
        UI.toast('Este navegador no puede exportar la imagen', 'red', '⚠️');
        return false;
      }
      return true;
    }

    function pintar() {
      var mio = ++generacion;
      actual = null;
      habilitar(false);
      UI.clear(lienzo);
      lienzo.appendChild(el('div', { class: 'comparte__cargando', text: 'Preparando…' }));

      preparar(prop, estiloActual, formatoActual).then(function (listo) {
        if (mio !== generacion) return;      // llegó tarde: manda el último
        actual = listo;
        UI.clear(lienzo);
        lienzo.appendChild(el('img', {
          class: 'comparte__img',
          alt: 'Vista previa de tu publicación: ' + prop.logro.titulo,
          src: listo.url
        }));
        habilitar(true);
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
    if (formatosOk.length > 1) {
      formatosOk.forEach(function (f) {
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
    }

    btnCompartir = UI.btn('Compartir', {
      variant: 'brand', size: 'lg',
      onClick: function () {
        if (!listoParaSalir()) return;
        /* Se bloquean los dos botones durante el reparto. En un móvil lento
           pasan hasta medio segundo entre share() y el momento en que el menú
           del sistema tapa la página; un segundo toque en ese hueco —lo normal
           cuando el primero no parece haber hecho nada— entraba otra vez, el
           navegador rechazaba con InvalidStateError y el código lo trataba
           como fallo genérico: descargaba el PNG por detrás del menú. */
        habilitar(false);
        // El blob ya está hecho: share() sale sin trabajo asíncrono de por
        // medio, que es lo único que iOS acepta dentro de un gesto.
        w.Comparte.salir(actual.blob, prop, formatoActual)
          .then(function (r) {
            habilitar(true);
            if (r === 'descargado') UI.toast('Imagen descargada', 'green', '⬇️');
            else if (r === 'sin-permiso') UI.toast('Usa el botón Descargar', 'blue', '⬇️');
          })
          .catch(function (err) {
            habilitar(true);
            UI.toast((err && err.message) || 'No se pudo compartir', 'red', '⚠️');
          });
      }
    });

    btnDescargar = UI.btn('Descargar', {
      variant: 'ghost',
      onClick: function () {
        if (!listoParaSalir()) return;
        habilitar(false);
        try {
          w.Comparte.descargar(actual.blob, prop, formatoActual);
          UI.toast('Imagen descargada', 'green', '⬇️');
        } catch (err) {
          UI.toast('No se pudo descargar', 'red', '⚠️');
        }
        habilitar(true);
      }
    });

    pie.appendChild(btnCompartir);
    pie.appendChild(btnDescargar);
    pie.appendChild(UI.btn('Cerrar', { variant: 'flat', onClick: UI.closeSheet }));
    habilitar(false);

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

  w.CompartirAvance = { ofrecer: ofrecer, abrir: abrir, elegir: elegir, hayAlgo: hayAlgo };
})(window, document);
