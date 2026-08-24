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

  var MARGEN = 96;

  /* ==================================================================
     ESTADO CALCULADO

     La etapa y los términos del negocio se calculan una vez y se guardan
     hasta que el perfil cambie. `rev` sube en cada escritura del venture, así
     que sirve de sello exacto: mientras no se complete ni se modifique nada,
     esto no se recalcula. Vive en memoria y nunca se persiste — guardarlo
     dentro del venture subiría `rev` en cada lectura y tiraría la caché de
     contenido generado.
     ================================================================== */

  var memo = { rev: null, etapa: 0, terms: null };

  function rev() {
    try { return w.Venture.active().rev; } catch (e) { return null; }
  }

  function fresco() {
    var r = rev();
    if (memo.rev === r && r !== null) return memo;
    memo = { rev: r, etapa: null, terms: null };
    return memo;
  }

  /* ==================================================================
     ¿EXISTE ESTE DATO?
     ================================================================== */

  function terms() {
    var m = fresco();
    if (m.terms) return m.terms;
    try { m.terms = w.Venture.terms(); } catch (e) { m.terms = null; }
    return m.terms;
  }

  /** El beneficio principal: "¿Qué gana o ahorra tu cliente?", el campo `valor`
      de la misión del precio. Ya estaba capturado y guardado desde siempre;
      simplemente no lo leía nadie. No se le pregunta nada nuevo al usuario. */
  function beneficio() {
    try {
      var s = w.Store.state.dossier;
      var p = s && s.precio;
      var v = p && p.answers && p.answers.valor;
      return String(v == null ? '' : v).trim();
    } catch (e) { return ''; }
  }

  /** El texto del problema, solo si es publicable.

      `decision('problema')` puede venir de dos sitios muy distintos. Escrito a
      mano, del registro, del mentor o de Chispa, es una frase y se publica tal
      cual. Entregado en una misión de varios campos, es el volcado de TODOS
      ellos unido por ' · ': en el reto de entrevistas eso empieza por el
      nombre de la persona entrevistada y trae su cifra de gasto. Publicar eso
      sería filtrar a un tercero y afirmar una cantidad que el usuario no dijo
      sobre su propio negocio. Si tiene esa forma, se omite el campo — el logro
      sigue funcionando con la idea y el cliente. */
  var FUENTES_DE_UNA_FRASE = { registro: 1, expediente: 1, mentor: 1, chispa: 1 };

  function problemaPublicable() {
    var p;
    try { p = w.Venture.decision('problema'); } catch (e) { return ''; }
    if (!p || !p.value) return '';
    var v = String(p.value);
    // Las dos condiciones, no una: el origen dice de qué formulario vino, y el
    // separador delata el volcado aunque el origen fuera de fiar.
    if (!FUENTES_DE_UNA_FRASE[p.from]) return '';
    if (v.indexOf(' · ') >= 0) return '';
    return v;
  }

  function sabe(clave) {
    try {
      /* Tres claves que no son decisiones del expediente y por eso no las
         conoce Venture.knows(). Se resuelven aquí y no allí para no ensanchar
         el modelo de datos por una necesidad de esta pantalla. */
      if (clave === 'nombre') {
        var t = terms();
        return !!(t && t.tiene.nombre);
      }
      if (clave === 'oferta-decidida') {
        var o = w.Venture.decision('oferta');
        return !!(o && String(o.value || '').trim());
      }
      if (clave === 'valor') return !!beneficio();
      return !!w.Venture.knows(clave);
    } catch (e) { return false; }
  }

  /* ==================================================================
     ETAPA
     ================================================================== */

  /** La etapa más avanzada cuyos requisitos estén TODOS cumplidos.
      Acumulativa: si falta un dato, se queda en la anterior. 0 = todavía no
      hay información suficiente y no se genera nada. */
  function etapa() {
    var m = fresco();
    if (m.etapa !== null) return m.etapa;
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
    m.etapa = n;
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

  /* terms() devuelve relleno cuando falta el dato: "tu negocio", "tu producto
     o servicio", "tu cliente", "tu idea". Sirve para hablarle al usuario
     dentro de la app y sería absurdo en una publicación, así que cada campo se
     copia solo si su bandera `tiene.*` lo respalda. */
  function datosDe(logro) {
    var t = terms();
    if (!t) return null;
    var todo = {
      negocio:  t.tiene.nombre ? t.negocio : '',
      /* `producto` ya viene saneado por terms(); `ideaCorta` no. Sin quitarle
         el arranque, la idea entra tal cual la escribió el usuario y produce
         frases como "Estoy construyendo quiero vender lámparas". Se prefiere
         el producto, que sí está limpio, y la idea solo como último recurso. */
      idea:     t.tiene.producto ? recorta(t.producto, 120)
                                 : (t.tiene.idea ? recorta(t.ideaCorta, 120) : ''),
      producto: t.tiene.producto ? recorta(t.producto, 110) : '',
      cliente:  t.tiene.cliente ? recorta(t.clienteCorto, 80) : '',
      problema: recorta(problemaPublicable(), 120),
      valor:    recorta(beneficio(), 110)
    };

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
    var cierra = (C.CIERRE[logro.id] || {})[cual];
    if (!cierra) return null;             // combinación no declarada: no se improvisa

    var sujeto = datos.negocio || datos.producto || datos.idea || '';
    if (!sujeto) return null;

    var lineas = [];
    var frase = abre + ' ' + sujeto;
    if (datos.negocio && (datos.producto || datos.idea)) {
      frase += ': ' + (datos.producto || datos.idea);
    }
    lineas.push(mayus(frase + '.'));

    /* Una sola línea de contexto, la que corresponde al tema del logro. Más
       de una satura el visual y deja de leerse de un vistazo. */
    if (logro.id === 'problema' && datos.problema) {
      lineas.push('Lo que quiero resolver: ' + datos.problema + '.');
    } else if (logro.id === 'valor' && datos.valor) {
      lineas.push('Lo que busco para ' + (datos.cliente || 'quien lo use') + ': ' + datos.valor + '.');
    } else if (datos.cliente && cual !== 'presentar') {
      lineas.push('Para ' + datos.cliente + '.');
    }

    lineas.push(cierra);
    return lineas;
  }

  /* ==================================================================
     QUÉ SE PUEDE COMPARTIR AHORA
     ================================================================== */

  function logroPorId(id) {
    return C.LOGROS.filter(function (l) { return l.id === id; })[0] || null;
  }

  function puede(logro) {
    if (!logro) return false;
    if (etapa() < logro.etapaMin) return false;
    for (var i = 0; i < logro.requiere.length; i++) {
      if (!sabe(logro.requiere[i])) return false;
    }
    if (logro.requiereAlguno && !logro.requiereAlguno.some(sabe)) return false;

    /* El tema del logro tiene que traer texto de verdad. Va aquí y no en
       propuesta() porque `disponibles()` y `paraClaves()` preguntan por aquí:
       con la comprobación más abajo, un problema impublicable seguía saliendo
       en la lista y en el selector, y al elegirlo no había nada que enseñar. */
    if (logro.exige && logro.exige.length) {
      var datos = datosDe(logro);
      if (!datos) return false;
      for (var k = 0; k < logro.exige.length; k++) {
        if (!datos[logro.exige[k]]) return false;
      }
    }

    // Y que la combinación logro × intención esté declarada: si no lo está,
    // no hay cierre que poner y el visual no se puede escribir.
    return !!(C.CIERRE[logro.id] || {})[intencion()];
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

  /** Los logros que corresponden a las claves que se acaban de decidir, del
      más pertinente al menos.

      Importa la distinción: terminar el registro o una misión guarda varias
      decisiones seguidas, y lo que hay que publicar es lo que el usuario
      acaba de conseguir, no el avance más alto que tenga guardado desde hace
      semanas. Sin esto, definir el cliente ideal ofrecía "Definiste tu idea",
      y reeditar el problema en etapa 5 ofrecía el visual más comercial de
      todos.

      Devuelve una LISTA y no uno solo porque quien la recibe puede rechazar
      el primero —ese avance ya se ofreció en esta sesión— y entonces conviene
      probar el siguiente en vez de perder el aviso. La cola de respaldo son
      los demás disponibles, por si ninguna clave nueva da nada publicable. */
  function paraClaves(claves) {
    var lista = [].concat(claves || []);
    function esDeLaTanda(l) {
      var disp = l.disparadores || [l.id];
      return disp.some(function (k) { return lista.indexOf(k) >= 0; });
    }
    var todos = disponibles();          // ya vienen ordenados por etapa y recencia
    var dentro = todos.filter(esDeLaTanda);
    var fuera = todos.filter(function (l) { return !esDeLaTanda(l); });
    return dentro.concat(fuera);
  }

  /** La propuesta completa de un logro: mensaje, estilos y cara de Chispa.
      null si ese logro todavía no tiene los datos que necesita. */
  function propuesta(id) {
    var logro = logroPorId(id);
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
     TIPOGRAFÍA

     Nunito es una fuente local con font-display: swap. Si se compone antes de
     que esté resuelta, measureText mide con la fuente del sistema y el visual
     sale con los saltos de línea calculados sobre otra métrica. Se espera una
     vez, con tope: más vale una tipografía de respaldo que una hoja colgada.
     ================================================================== */

  var fuenteLista = null;

  function esperarFuente() {
    if (fuenteLista) return fuenteLista;
    fuenteLista = new Promise(function (resolve) {
      var reloj = w.setTimeout(resolve, 1500);
      var fin = function () { w.clearTimeout(reloj); resolve(); };
      try {
        if (!d.fonts || !d.fonts.load) return fin();
        d.fonts.load('900 62px Nunito')
          .then(function () { return d.fonts.ready; })
          .then(fin, fin);
      } catch (e) { fin(); }
    });
    return fuenteLista;
  }

  function fuente(peso, px) {
    return peso + ' ' + px + 'px Nunito, system-ui, -apple-system, sans-serif';
  }

  /* ==================================================================
     MAQUETA

     Se calcula antes de pintar, sobre un lienzo de medir. Así se sabe si el
     mensaje cabe ANTES de ofrecer un formato, que es justo lo que se pidió:
     el 4:5 solo si la estructura lo permite.
     ================================================================== */

  var reglaCv = null;
  function regla() {
    if (!reglaCv) { reglaCv = d.createElement('canvas'); reglaCv.width = reglaCv.height = 8; }
    return reglaCv.getContext('2d');
  }

  function cajaChispa(F) {
    var lado = Math.round(F.w * 0.34);
    return {
      lado: lado,
      x: F.w - lado - MARGEN + 24,
      y: F.h - lado - MARGEN - 40
    };
  }

  /** Cuánto ancho hay libre a la altura `y`. Debajo del borde de Chispa el
      texto se estrecha en lugar de pasarle por encima: antes cualquier línea
      de más de 545 px que cayera en esa banda quedaba repintada por la
      mascota. */
  function anchoEn(F, ch, y, alto) {
    if (y + alto > ch.y && y < ch.y + ch.lado) return ch.x - MARGEN - 32;
    return F.w - MARGEN * 2;
  }

  /** Escalones de cuerpo, de mayor a menor. Se prueba el más grande que quepa
      antes de renunciar al formato. */
  function escalones(F) {
    return F.h > 1500 ? [62, 54, 48] : [56, 50, 44];
  }

  /** Reparte el mensaje en líneas físicas con su posición ya resuelta.
      Devuelve null si no cabe ni con el cuerpo más pequeño. */
  function maquetar(prop, F) {
    var ctx = regla();
    var ch = cajaChispa(F);
    // La firma va abajo del todo; el cuerpo tiene que terminar antes.
    var tope = F.h - MARGEN - 28 - 40;
    var pasos = escalones(F);

    for (var p = 0; p < pasos.length; p++) {
      var tam = pasos[p];
      var bloques = [];
      var y = MARGEN + 92;
      var ok = true;

      for (var i = 0; i < prop.lineas.length && ok; i++) {
        var esCierre = i === prop.lineas.length - 1;
        var px = esCierre ? tam - 4 : tam;
        var alto = px * 1.32;
        ctx.font = fuente(esCierre ? 900 : 800, px);
        if (esCierre) y += 28;

        var palabras = String(prop.lineas[i]).split(' ');
        var actual = '', j = 0;
        while (j < palabras.length) {
          var ancho = anchoEn(F, ch, y, alto);
          var prueba = actual ? actual + ' ' + palabras[j] : palabras[j];
          if (ctx.measureText(prueba).width > ancho && actual) {
            bloques.push({ texto: actual, x: MARGEN, y: y, px: px, cierre: esCierre, ancho: ancho });
            y += alto;
            actual = '';
          } else { actual = prueba; j++; }
          if (y > tope) { ok = false; break; }
        }
        if (ok && actual) {
          bloques.push({ texto: actual, x: MARGEN, y: y, px: px, cierre: esCierre,
                        ancho: anchoEn(F, ch, y, alto) });
          y += alto;
        }
        y += 18;
        if (y > tope) ok = false;
      }

      if (ok) return { bloques: bloques, chispa: ch, tam: tam };
    }
    return null;
  }

  /** ¿Cabe el mensaje en este formato? Lo consulta la hoja para no ofrecer el
      4:5 cuando la estructura no lo permite. */
  function cabe(prop, formato) {
    return !!maquetar(prop, FORMATOS[formato] || FORMATOS.historia);
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

  /**
   * Dibuja el visual y devuelve un canvas.
   * @param prop    lo que devolvió propuesta()
   * @param estilo  id de C.ESTILOS
   * @param formato 'historia' | 'post'
   */
  function dibujar(prop, estiloId, formato) {
    var F = FORMATOS[formato] || FORMATOS.historia;
    var E = C.ESTILOS.filter(function (x) { return x.id === estiloId; })[0] || C.ESTILOS[0];
    var m = maquetar(prop, F);
    if (!m) throw new Error('el mensaje no cabe en este formato');

    var cv = d.createElement('canvas');
    cv.width = F.w; cv.height = F.h;
    var ctx = cv.getContext('2d');

    // Fondo
    var g = ctx.createLinearGradient(0, 0, F.w * 0.4, F.h);
    g.addColorStop(0, E.fondo[0]);
    g.addColorStop(1, E.fondo[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, F.w, F.h);

    ctx.textBaseline = 'top';

    // Etiqueta del avance, arriba
    ctx.fillStyle = E.acento;
    ctx.font = fuente(900, 34);
    ctx.fillText(prop.logro.titulo.toUpperCase(), MARGEN, MARGEN, F.w - MARGEN * 2);

    // Cuerpo del mensaje, ya repartido por maquetar()
    m.bloques.forEach(function (b) {
      ctx.font = fuente(b.cierre ? 900 : 800, b.px);
      ctx.fillStyle = b.cierre ? E.acento : E.tinta;
      /* El cuarto argumento es el seguro. maquetar() acepta una palabra suelta
         aunque no quepa —cortarla no es opcion y rechazarla dejaria al usuario
         sin ningun formato—, asi que aqui se condensa para que no se salga del
         lienzo ni acabe debajo de Chispa. Un nombre de negocio largo, que es el
         unico campo que no pasa por recorta(), llegaba a pintarse fuera del PNG. */
      ctx.fillText(b.texto, b.x, b.y, b.ancho);
    });

    // Firma discreta. Una referencia, no un anuncio.
    ctx.font = fuente(800, 28);
    ctx.fillStyle = E.tinta;
    ctx.globalAlpha = 0.55;
    ctx.fillText('Hecho con ' + ((w.BRAND && w.BRAND.logotipo) || 'EMPRENDO'), MARGEN, F.h - MARGEN - 28);
    ctx.globalAlpha = 1;

    return { canvas: cv, ctx: ctx, F: F, E: E, chispa: m.chispa };
  }

  /** Dibuja y le pega a Chispa. Devuelve el canvas terminado. */
  function componer(prop, estiloId, formato) {
    return esperarFuente().then(function () {
      var r = dibujar(prop, estiloId, formato);
      /* `sinDistintivo`: la insignia de avance de Chispa se decide leyendo el
         contador de misiones de la app. Dentro de la app está bien; dentro de
         una imagen que el usuario publica es gamificación colada en un visual
         que promete no llevarla, y cambiaría el símbolo publicado sin que
         hubiera cambiado un solo dato del negocio. */
      var svgTexto = w.Mascot.svg(prop.chispa, { etiqueta: 'Chispa', sinDistintivo: true });

      return svgAImagen(svgTexto).then(function (img) {
        // Abajo a la derecha: el protagonista es el avance, no la mascota.
        r.ctx.drawImage(img, r.chispa.x, r.chispa.y, r.chispa.lado, r.chispa.lado);
        return r.canvas;
      }).catch(function () {
        return r.canvas;      // sin Chispa antes que sin visual
      });
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

  /** Comparte con el menú nativo.

      Recibe el blob ya hecho, no el canvas: en iOS, navigator.share() solo
      funciona mientras dura la activación del gesto del usuario, y codificar
      un PNG de dos megapíxeles en medio la consume. Quien llama tiene que
      traerlo listo.

      Devuelve 'compartido' | 'cancelado' | 'sin-permiso' | 'descargado'. El
      caso 'sin-permiso' es el de la activación perdida: no se finge que se
      descargó algo, se dice que hace falta el botón de descargar. */
  function salir(blob, prop, formato) {
    var nombre = nombreArchivo(prop, formato);
    if (!puedeCompartirArchivos()) {
      descargar(blob, nombre);
      return Promise.resolve('descargado');
    }
    var archivo = new File([blob], nombre, { type: 'image/png' });
    return w.navigator.share({ files: [archivo] })
      .then(function () { return 'compartido'; })
      .catch(function (e) {
        // Cancelar no es un fallo: el usuario cambió de idea.
        if (e && e.name === 'AbortError') return 'cancelado';
        if (e && e.name === 'NotAllowedError') return 'sin-permiso';
        descargar(blob, nombre);
        return 'descargado';
      });
  }

  function descargar(blob, nombreOProp, formato) {
    var nombre = typeof nombreOProp === 'string'
      ? nombreOProp
      : nombreArchivo(nombreOProp, formato);
    var url = URL.createObjectURL(blob);
    var a = d.createElement('a');
    a.href = url; a.download = nombre;
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  w.Comparte = {
    etapa: etapa, intencion: intencion,
    disponibles: disponibles, propuesta: propuesta, puede: puede,
    logro: logroPorId, paraClaves: paraClaves,
    componer: componer, aBlob: aBlob, salir: salir, descargar: descargar,
    cabe: cabe, nombreArchivo: nombreArchivo,
    FORMATOS: FORMATOS
  };
})(window, document);
