/* ==========================================================================
   COMPARTIR UN AVANCE

   Convierte un logro del negocio en una imagen lista para publicar. Gratis,
   sin conexión y sin ninguna API de generación de imágenes: se dibuja en un
   canvas con la tipografía que la app ya tiene cargada y con el SVG de Chispa
   rasterizado. Nada sale del dispositivo.

   Tres reglas que no se saltan:

     · SOLO LEE. No escribe en el perfil. Cualquier escritura subiría
       venture.rev e invalidaría la caché de desafíos personalizados.
     · LISTA BLANCA. Cada logro declara sus campos en
       js/data/logros-compartibles.js y de ahí no se sale. Nunca XP, racha,
       insignias, nivel, presupuesto ni experiencia.
     · NO INVENTA. Si un dato falta, el logro no se ofrece. No se rellena con
       suposiciones ni se le pregunta nada al usuario.

   Por qué canvas y no SVG rasterizado: la fuente no viaja dentro de un SVG,
   así que al convertirlo saldría con otra tipografía. Dibujando el texto con
   fillText se usa la Nunito que ya está cargada.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var C = w.LOGROS_COMPARTIBLES;

  /* Vertical para historias y estados; 4:5 para publicaciones. */
  var FORMATOS = {
    historia: { w: 1080, h: 1920, nombre: 'Historia' },
    post:     { w: 1080, h: 1350, nombre: 'Publicación' }
  };

  /* ==================================================================
     ETAPA
     ================================================================== */

  function sabe(clave) {
    try { return !!w.Venture.knows(clave); } catch (e) { return false; }
  }

  /** La etapa más avanzada cuyos requisitos estén TODOS cumplidos.
      Acumulativa: si falta un dato, se queda en la anterior. 0 = todavía no
      hay información suficiente y no se genera nada. */
  function etapa() {
    var n = 0;
    for (var i = 0; i < C.ETAPAS.length; i++) {
      var e = C.ETAPAS[i], ok = true;
      for (var j = 0; j < e.todos.length; j++) {
        if (!sabe(e.todos[j])) { ok = false; break; }
      }
      if (ok && e.alguno) {
        ok = e.alguno.some(function (k) { return sabe(k); });
      }
      if (!ok) break;          // acumulativa: sin este escalón no hay siguiente
      n = e.n;
    }
    return n;
  }

  function intencion() { return C.INTENCION[etapa()] || null; }

  /* ==================================================================
     DATOS PERMITIDOS

     Se construye un objeto con SOLO los campos que el logro declara. Lo que
     no esté en su lista blanca no existe para el generador.
     ================================================================== */

  function recorta(s, max) {
    s = String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
    if (s.length <= max) return s;
    var corte = s.slice(0, max);
    var esp = corte.lastIndexOf(' ');
    return (esp > max * 0.6 ? corte.slice(0, esp) : corte).replace(/[,;:.\s]+$/, '') + '…';
  }

  function datosDe(logro) {
    var t;
    try { t = w.Venture.terms(); } catch (e) { return null; }
    var todo = {
      // `negocio` solo si de verdad hay nombre. terms() devuelve "tu negocio"
      // como relleno, y eso en un visual público quedaría absurdo.
      negocio: t.tiene.nombre ? t.negocio : '',
      /* `producto` ya viene saneado por terms(); `ideaCorta` no. Sin quitarle
         el arranque, la idea entra tal cual la escribió el usuario y produce
         frases como "Estoy construyendo quiero vender lámparas". Se prefiere
         el producto, que sí está limpio, y la idea solo como último recurso. */
      idea: recorta(t.tiene.producto ? t.producto : t.ideaCorta, 120),
      producto: recorta(t.producto, 110),
      cliente: recorta(t.clienteCorto, 80),
      sector: '',
      problema: ''
    };
    try {
      var p = w.Venture.decision('problema');
      if (p && p.value) todo.problema = recorta(p.value, 120);
    } catch (e) {}

    var out = {};
    for (var i = 0; i < logro.campos.length; i++) {
      var k = logro.campos[i];
      out[k] = todo[k] || '';
    }
    return out;
  }

  /* ==================================================================
     MENSAJE

     El logro pone el tema; la etapa pone la intención y el cierre. Sin
     nombre de negocio se describe la idea sin nombrarla — nunca se inventa
     un nombre.
     ================================================================== */

  function mayus(s) {
    s = String(s || '');
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function mensaje(logro, datos, cual) {
    var abre = C.APERTURA[cual] || C.APERTURA.presentar;
    var cierra = (C.CIERRE[logro.id] || {})[cual] || '¿Qué te parece?';
    var lineas = [];

    var sujeto = datos.negocio
      ? datos.negocio
      : (datos.producto || datos.idea || '');

    if (!sujeto) return null;

    if (cual === 'vender') {
      lineas.push(abre + ' ' + sujeto + '.');
      // terms() devuelve el producto en minúscula porque casi siempre va
      // dentro de una frase. Aquí abre una, así que le toca mayúscula.
      if (datos.negocio && datos.producto) lineas.push(mayus(datos.producto) + '.');
    } else {
      var frase = abre + ' ' + sujeto;
      if (datos.negocio && (datos.producto || datos.idea)) {
        frase += ': ' + (datos.producto || datos.idea);
      }
      lineas.push(frase + '.');
    }

    if (logro.id === 'problema' && datos.problema) {
      lineas.push('Lo que quiero resolver: ' + datos.problema + '.');
    } else if (datos.cliente && cual !== 'presentar') {
      lineas.push('Para ' + datos.cliente + '.');
    }

    // Sin nombre de negocio la primera frase ya empieza por el producto, que
    // terms() entrega en minúscula. Se arregla aquí y no en terms(), que lo
    // devuelve así a propósito para el resto de la app.
    lineas[0] = mayus(lineas[0]);

    lineas.push(cierra);
    return lineas;
  }

  /* ==================================================================
     QUÉ SE PUEDE COMPARTIR AHORA
     ================================================================== */

  function puede(logro) {
    if (etapa() < logro.etapaMin) return false;
    for (var i = 0; i < logro.requiere.length; i++) {
      if (!sabe(logro.requiere[i])) return false;
    }
    if (logro.requiereAlguno && !logro.requiereAlguno.some(sabe)) return false;
    return true;
  }

  /** Todo lo publicable ahora mismo, del avance más alto al más básico.

      Se ordena por etapa mínima y no por el orden del array: con reverse() a
      secas, 'problema' quedaba siempre detrás de 'cliente' —ambos son etapa 2—
      y como solo se ofrece el primero, no se mostraba nunca. */
  function disponibles() {
    return C.LOGROS.filter(puede).sort(function (a, b) {
      if (b.etapaMin !== a.etapaMin) return b.etapaMin - a.etapaMin;
      return reciente(b.id) - reciente(a.id);
    });
  }

  /** Cuándo se decidió esto por última vez. Desempata entre logros de la misma
      etapa: se ofrece el avance que el usuario acaba de conseguir. */
  function reciente(id) {
    try { var dd = w.Venture.decision(id); return (dd && dd.at) || 0; }
    catch (e) { return 0; }
  }

  /** La propuesta completa de un logro: mensaje, estilos y cara de Chispa.
      null si ese logro todavía no tiene los datos que necesita. */
  function propuesta(id) {
    var logro = C.LOGROS.filter(function (l) { return l.id === id; })[0];
    if (!logro || !puede(logro)) return null;
    var datos = datosDe(logro);
    if (!datos) return null;
    var cual = intencion();
    var texto = mensaje(logro, datos, cual);
    if (!texto) return null;
    return {
      logro: logro, datos: datos, etapa: etapa(),
      intencion: cual, lineas: texto, chispa: logro.chispa,
      estilos: C.ESTILOS
    };
  }

  /* ==================================================================
     DIBUJO

     Canvas 2D. El SVG de Chispa se rasteriza a través de una Image con un
     data: URI; el texto se escribe con la Nunito que la app ya cargó.
     ================================================================== */

  function svgAImagen(svgTexto) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('no se pudo rasterizar a Chispa')); };
      // encodeURIComponent y no btoa: el SVG lleva acentos en su etiqueta y
      // btoa revienta con cualquier carácter fuera de latin1.
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgTexto);
    });
  }

  /** Parte un texto en líneas que quepan, midiendo de verdad con el canvas. */
  function partir(ctx, texto, ancho) {
    var palabras = String(texto).split(' ');
    var lineas = [], actual = '';
    for (var i = 0; i < palabras.length; i++) {
      var prueba = actual ? actual + ' ' + palabras[i] : palabras[i];
      if (ctx.measureText(prueba).width > ancho && actual) {
        lineas.push(actual);
        actual = palabras[i];
      } else { actual = prueba; }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  function fuente(peso, px) {
    return peso + ' ' + px + 'px Nunito, system-ui, -apple-system, sans-serif';
  }

  /**
   * Dibuja el visual y devuelve un canvas.
   * @param prop    lo que devolvió propuesta()
   * @param estilo  id de C.ESTILOS
   * @param formato 'historia' | 'post'
   */
  function dibujar(prop, estiloId, formato) {
    var F = FORMATOS[formato] || FORMATOS.historia;
    var E = C.ESTILOS.filter(function (x) { return x.id === estiloId; })[0] || C.ESTILOS[0];

    var cv = d.createElement('canvas');
    cv.width = F.w; cv.height = F.h;
    var ctx = cv.getContext('2d');

    // Fondo
    var g = ctx.createLinearGradient(0, 0, F.w * 0.4, F.h);
    g.addColorStop(0, E.fondo[0]);
    g.addColorStop(1, E.fondo[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, F.w, F.h);

    var M = 96;                       // margen
    var anchoUtil = F.w - M * 2;

    // Etiqueta del avance, arriba
    ctx.fillStyle = E.acento;
    ctx.font = fuente(900, 34);
    ctx.textBaseline = 'top';
    ctx.fillText(prop.logro.titulo.toUpperCase(), M, M);

    // Cuerpo del mensaje
    var y = M + 92;
    ctx.fillStyle = E.tinta;
    var tamCuerpo = F.h > 1500 ? 62 : 56;

    prop.lineas.forEach(function (linea, i) {
      var esCierre = i === prop.lineas.length - 1;
      ctx.font = fuente(esCierre ? 900 : 800, esCierre ? tamCuerpo - 4 : tamCuerpo);
      if (esCierre) y += 28;
      var trozos = partir(ctx, linea, anchoUtil);
      trozos.forEach(function (t) {
        ctx.fillStyle = esCierre ? E.acento : E.tinta;
        ctx.fillText(t, M, y);
        y += (esCierre ? tamCuerpo - 4 : tamCuerpo) * 1.32;
      });
      y += 18;
    });

    // Firma discreta. Una referencia, no un anuncio.
    ctx.font = fuente(800, 28);
    ctx.fillStyle = E.tinta;
    ctx.globalAlpha = 0.55;
    ctx.fillText('Hecho con ' + ((w.BRAND && w.BRAND.logotipo) || 'EMPRENDO'), M, F.h - M - 28);
    ctx.globalAlpha = 1;

    return { canvas: cv, ctx: ctx, F: F, E: E, M: M };
  }

  /** Dibuja y le pega a Chispa. Devuelve el canvas terminado. */
  function componer(prop, estiloId, formato) {
    var r = dibujar(prop, estiloId, formato);
    var lado = Math.round(r.F.w * 0.34);
    var svgTexto = w.Mascot.svg(prop.chispa, { etiqueta: 'Chispa' });

    return svgAImagen(svgTexto).then(function (img) {
      // Abajo a la derecha: el protagonista es el avance, no la mascota.
      r.ctx.drawImage(img, r.F.w - lado - r.M + 24, r.F.h - lado - r.M - 40, lado, lado);
      return r.canvas;
    }).catch(function () {
      return r.canvas;      // sin Chispa antes que sin visual
    });
  }

  function aBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (!canvas.toBlob) return reject(new Error('este navegador no puede exportar la imagen'));
      canvas.toBlob(function (b) {
        b ? resolve(b) : reject(new Error('no se pudo crear la imagen'));
      }, 'image/png');
    });
  }

  /* ==================================================================
     SALIDA
     ================================================================== */

  function nombreArchivo(prop, formato) {
    var base = (prop.datos.negocio || 'mi-avance').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return (base || 'mi-avance') + '-' + formato + '.png';
  }

  function puedeCompartirArchivos() {
    try {
      return !!(w.navigator && w.navigator.canShare && w.navigator.share &&
        w.navigator.canShare({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] }));
    } catch (e) { return false; }
  }

  /** Comparte con el menú nativo; si no hay, descarga. */
  function salir(blob, prop, formato) {
    var nombre = nombreArchivo(prop, formato);
    if (puedeCompartirArchivos()) {
      var archivo = new File([blob], nombre, { type: 'image/png' });
      return w.navigator.share({ files: [archivo] })
        .then(function () { return 'compartido'; })
        .catch(function (e) {
          // Cancelar no es un fallo: el usuario cambió de idea.
          if (e && e.name === 'AbortError') return 'cancelado';
          descargar(blob, nombre);
          return 'descargado';
        });
    }
    descargar(blob, nombre);
    return Promise.resolve('descargado');
  }

  function descargar(blob, nombre) {
    var url = URL.createObjectURL(blob);
    var a = d.createElement('a');
    a.href = url; a.download = nombre;
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  w.Comparte = {
    etapa: etapa, intencion: intencion,
    disponibles: disponibles, propuesta: propuesta, puede: puede,
    componer: componer, aBlob: aBlob, salir: salir,
    FORMATOS: FORMATOS
  };
})(window, document);
