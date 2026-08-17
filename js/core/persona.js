/* ==========================================================================
   PERSONA — la apariencia que habla del negocio del usuario

   Personalize decide QUÉ DICE la app. Persona decide CÓMO SE VE: el color
   secundario, los accesorios de Chispa, el orden del panel y el espacio de
   trabajo del fondo. Son dos cosas distintas y no se pisan: Persona consume
   Venture.terms() y no reimplementa ni una línea del léxico.

   TRES REGLAS QUE NO SE ROMPEN

   1) AQUÍ NO SE ESCRIBEN COLORES. aplicar() pone atributos en <html> y los
      colores los decide css/temas.css. Un estilo en línea sobre :root ganaría
      a html[data-theme="dark"] y dejaría el modo oscuro congelado en claro; y
      además abriría la puerta a que un valor inventado acabara pintándose.
      Con atributos, una clave que no exista en el CSS simplemente no pinta.

   2) APLICAR SOLO LEE. Venture.set() sube `rev` en cada llamada y cacheGet()
      marca como obsoleto todo lo generado cuando `rev` no cuadra. Si esto
      escribiera en cada render, la app regeneraría su contenido con IA una y
      otra vez y se comería la cuota diaria del usuario. Se escribe en dos
      momentos: al arrancar (una vez, y solo si falta algo) y cuando el usuario
      toca algo a propósito.

   3) LA IDENTIDAD NO SE NEGOCIA. El naranja de marca, la tipografía, la
      estructura, la navegación y el cuerpo de Chispa son iguales para todos.
      Lo que cambia son los secundarios y las capas.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var TEMA_GENERICO = 'generico';

  /* Respaldo si la hoja de estilos aún no ha resuelto: el mismo teal que
     css/temas.css usa como tema genérico. Un único valor de reserva, no una
     copia de la paleta — los siete temas viven solo en el CSS. */
  var COLOR_RESPALDO = {
    acento: '#14807A', acento2: '#1FA59C', acentoDark: '#0C635E', acentoFuerte: '#0B5C57'
  };

  var SIN_CAPAS = { cabeza: '', torso: '', mano: '', fondo: '', distintivo: '' };

  function V() { return w.Venture; }
  function C() { return w.CONFIG || {}; }
  function txt(s) { return String(s == null ? '' : s).trim(); }

  /* ==================================================================
     LISTAS BLANCAS

     Todo lo que entra —de un guardado viejo, de la propuesta de la IA o de un
     .json restaurado a mano— pasa por aquí. Lo que no está en la lista se
     descarta sin ruido y se usa el valor por defecto.
     ================================================================== */

  function temaValido(id) {
    var list = C().TEMAS || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === id) return true;
    return false;
  }

  function temaMeta(id) {
    var list = C().TEMAS || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === id) return list[i];
    return { key: TEMA_GENERICO, title: 'Neutro', capas: {} };
  }

  function sectorValido(key) {
    var list = C().SECTORS || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return true;
    return false;
  }

  function personalidadValida(key) {
    var list = C().PERSONALIDADES || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return true;
    return false;
  }

  var INTENSIDADES = ['sutil', 'media', 'visible'];

  function intensidadValida(x) { return INTENSIDADES.indexOf(x) >= 0; }

  /** Una clave de accesorio solo vale si la ranura existe y la pieza también. */
  function capaValida(ranura, clave) {
    if (!clave) return true;                    // '' = sin accesorio, es válido
    var K = w.MASCOTA_CAPAS;
    if (!K) return false;
    return K.claves(ranura).indexOf(clave) >= 0;
  }

  /* ==================================================================
     RESOLUCIÓN

     Del perfil del emprendimiento a una configuración concreta. Todo esto es
     puro: se puede llamar en cualquier momento y no toca el estado.
     ================================================================== */

  /** ¿Está encendida la personalización? Es una preferencia de la persona, no
      del negocio, así que vive en settings y sobrevive a registrar otra idea. */
  function activa() {
    var s = w.Store && w.Store.state;
    return !!(s && s.settings && s.settings.personalizacion !== false);
  }

  /** El tema que la app propondría para este negocio, sin mirar lo guardado. */
  function temaSugerido() {
    var sector = '';
    try { sector = V().active().core.sector; } catch (e) { sector = ''; }
    var mapa = C().TEMA_POR_SECTOR || {};
    var id = mapa[sector];
    return temaValido(id) ? id : TEMA_GENERICO;
  }

  /** La configuración vigente, ya saneada. Nunca devuelve algo inválido. */
  function actual() {
    var p = null;
    try { p = V().persona(); } catch (e) { p = null; }
    p = p || {};

    var temaId = temaValido(p.temaId) ? p.temaId : temaSugerido();
    var intensidad = intensidadValida(p.intensidad) ? p.intensidad : 'media';
    if (!activa()) { temaId = TEMA_GENERICO; intensidad = 'sutil'; }

    return {
      temaId: temaId,
      tema: temaMeta(temaId),
      intensidad: intensidad,
      fuente: p.temaFuente === 'usuario' ? 'usuario' : 'auto',
      capas: capasElegidas(temaId, p.capas),
      panel: Array.isArray(p.panel) ? p.panel : null,
      propuesta: p.propuesta || null
    };
  }

  /** Los accesorios: los del tema, salvo los que el usuario haya cambiado.
      Un `null` guardado por el usuario significa "quítamelo", y eso es
      distinto de "no lo ha decidido": por eso se comprueba la propiedad. */
  function capasElegidas(temaId, propias) {
    var base = temaMeta(temaId).capas || {};
    var out = {}, ranuras = (w.MASCOTA_CAPAS && w.MASCOTA_CAPAS.RANURAS) || [];
    for (var i = 0; i < ranuras.length; i++) {
      var r = ranuras[i];
      var val = base[r] || '';
      if (propias && Object.prototype.hasOwnProperty.call(propias, r)) {
        val = propias[r] || '';
      }
      out[r] = capaValida(r, val) ? val : '';
    }
    return out;
  }

  /* ==================================================================
     DISTINTIVO — el crecimiento del negocio, hecho visible

     No es decoración: cada escalón corresponde a algo que el usuario logró de
     verdad y que ya está registrado en su perfil. Se deriva en cada lectura en
     vez de guardarse, para que no pueda quedar desincronizado con los hechos.
     ================================================================== */

  function distintivo() {
    var v;
    try { v = V().active(); } catch (e) { return ''; }
    var c = v.core;

    // La etapa la declara el usuario y describe su negocio real: quien ya
    // opera lo hace desde el primer día y su insignia debe decirlo.
    if (c.stage === 'growing') return 'escalando';
    if (c.stage === 'operating') return 'operando';

    // Primeras ventas: o las declaró en el expediente, o hay ingresos.
    if (V().decision('clientes') || v.metrics.ingresos) return 'primera';

    /* "Validado" tiene que costar algo. Antes bastaba con haber rellenado el
       registro —cliente y oferta están en el núcleo desde el minuto uno— y
       entonces todo el mundo estrenaba la insignia sin haber hecho nada.
       Ahora hace falta haber entregado al menos una misión de verdad. */
    var misiones = 0;
    try { misiones = (w.Store.state.stats && w.Store.state.stats.missions) || 0; } catch (e) {}
    if (misiones >= 1 && V().knows('cliente') && V().knows('oferta')) return 'validado';

    if (txt(c.idea)) return 'idea';
    return '';
  }

  /* ==================================================================
     APLICACIÓN — atributos en <html>, y nada más
     ================================================================== */

  function aplicar() {
    if (!d || !d.documentElement) return;
    var raiz = d.documentElement;
    var a = actual();

    if (!activa()) {
      raiz.setAttribute('data-personaliza', 'off');
      raiz.setAttribute('data-negocio', TEMA_GENERICO);
      raiz.setAttribute('data-intensidad', 'sutil');
    } else {
      raiz.removeAttribute('data-personaliza');
      raiz.setAttribute('data-negocio', a.temaId);
      raiz.setAttribute('data-intensidad', a.intensidad);
    }
    invalidar();
  }

  /* ==================================================================
     COLORES Y CAPAS DE LA MASCOTA

     Los colores se leen del CSS ya resuelto: así hay una sola fuente de
     verdad y el modo oscuro entra gratis. getComputedStyle no es barato y
     Mascot.svg() se llama muchas veces por pantalla, así que se memoriza y se
     tira la memoria cuando cambia algo que pueda afectarla.
     ================================================================== */

  var _firma = null, _colores = null, _capas = null;

  function invalidar() { _firma = null; _colores = null; _capas = null; }

  /** Qué combinación está pintada ahora mismo. Si no cambia, no hay nada que
      recalcular. Se construye sin tocar el CSS, que es la parte cara. */
  function firma() {
    var a = actual();
    var tema = d.documentElement.getAttribute('data-theme') || 'light';
    return [a.temaId, a.intensidad, tema, a.capas.cabeza, a.capas.torso,
            a.capas.mano, a.capas.fondo, distintivo(), activa() ? '1' : '0'].join('|');
  }

  function refrescar() {
    var f = firma();
    if (f === _firma && _colores && _capas) return;
    _firma = f;
    _colores = leerColores();
    _capas = construirCapas(_colores);
  }

  function leerColores() {
    try {
      var cs = w.getComputedStyle(d.documentElement);
      var ac = txt(cs.getPropertyValue('--neg-acento'));
      var a2 = txt(cs.getPropertyValue('--neg-acento-2'));
      var ad = txt(cs.getPropertyValue('--neg-acento-dark'));
      var af = txt(cs.getPropertyValue('--neg-acento-fuerte'));
      // Si la hoja aún no ha resuelto, mejor el respaldo que una cadena vacía
      // dentro de un atributo fill: eso pintaría negro.
      return {
        acento: ac || COLOR_RESPALDO.acento,
        acento2: a2 || COLOR_RESPALDO.acento2,
        acentoDark: ad || COLOR_RESPALDO.acentoDark,
        // El relleno de los accesorios. Es un token aparte porque acentoDark se
        // invierte a un tinte claro en modo oscuro —allí hace de texto— y un
        // mandil beige sobre el cuerpo naranja de Chispa no se ve.
        acentoFuerte: af || COLOR_RESPALDO.acentoFuerte
      };
    } catch (e) { return COLOR_RESPALDO; }
  }

  function construirCapas(colores) {
    var K = w.MASCOTA_CAPAS;
    if (!K || !activa()) return SIN_CAPAS;

    var a = actual();
    var out = { cabeza: '', torso: '', mano: '', fondo: '', distintivo: '' };

    out.cabeza = K.pieza('cabeza', a.capas.cabeza, colores);
    out.torso = K.pieza('torso', a.capas.torso, colores);
    out.mano = K.pieza('mano', a.capas.mano, colores);

    // El escenario solo con la personalización al máximo: en los avatares
    // pequeños del chat suma ruido sin aportar nada.
    if (a.intensidad === 'visible') out.fondo = K.pieza('fondo', a.capas.fondo, colores);

    // El distintivo de avance se calla en el modo sutil, que es también el que
    // usa quien apagó la personalización.
    if (a.intensidad !== 'sutil') out.distintivo = K.pieza('distintivo', distintivo(), colores);

    return out;
  }

  /** Lo que consulta Mascot.svg() en cada dibujo. */
  function capasSVG() { refrescar(); return _capas; }

  function colores() { refrescar(); return _colores; }

  /** Opciones sueltas para quien quiera dibujar una mascota concreta: la vista
      previa de la pantalla de personalización, sobre todo. */
  function mascotaOpts(temaId, capas, intensidad) {
    var K = w.MASCOTA_CAPAS;
    // Con la personalización apagada, Chispa va sin nada — también en la vista
    // previa. Si no, la pantalla enseñaría un mandil que la app no pinta y el
    // usuario no entendería qué está apagando.
    if (!activa()) return { capas: { cabeza: '', torso: '', mano: '', fondo: '', distintivo: '' }, colores: colores() };
    var mapa = capas || capasElegidas(temaValido(temaId) ? temaId : TEMA_GENERICO, null);
    var vista = { cabeza: mapa.cabeza || '', torso: mapa.torso || '', mano: mapa.mano || '' };
    vista.fondo = intensidad === 'visible' ? (mapa.fondo || '') : '';
    vista.distintivo = intensidad === 'sutil' ? '' : distintivo();
    return { capas: vista, colores: K ? colores() : COLOR_RESPALDO };
  }

  /* ==================================================================
     ORDEN DE LOS MÓDULOS

     Se reordena, nunca se filtra. Quitar un módulo rompería los contadores y
     las insignias que se calculan sobre el total, y dejaría al usuario sin
     acceso a algo que sí existe.
     ================================================================== */

  /* Quien todavía está definiendo su negocio necesita el perfil delante;
     quien ya vende necesita la tarea del día. Es la etapa la que manda aquí,
     no el sector: un taller que arranca y una pastelería que arranca tienen
     el mismo problema. */
  var PANEL_POR_ETAPA = {
    idea:      ['venture', 'daily', 'weekly'],
    starting:  ['venture', 'daily', 'weekly'],
    operating: ['daily', 'venture', 'weekly'],
    growing:   ['daily', 'weekly', 'venture']
  };

  function ordenPanel(modulos) {
    if (!Array.isArray(modulos) || !modulos.length) return modulos;
    var a = actual();
    var orden = a.panel;
    if (!orden) {
      var etapa = '';
      try { etapa = V().active().core.stage; } catch (e) { etapa = ''; }
      orden = PANEL_POR_ETAPA[etapa] || null;
    }
    if (!orden || !activa()) return modulos;
    return reordenar(modulos, orden, 'id');
  }

  /* Los siete análisis de "Tu plan de negocio". El orden dice qué mirar
     primero, y eso cambia mucho entre quien busca su primer cliente y quien
     ya factura y se le escapan los costos. */
  var ANALISIS_POR_ETAPA = {
    idea:      ['valor', 'cliente', 'mercado', 'modelo', 'ventas', 'costos', 'marca'],
    starting:  ['cliente', 'valor', 'ventas', 'costos', 'modelo', 'mercado', 'marca'],
    operating: ['costos', 'ventas', 'cliente', 'modelo', 'marca', 'valor', 'mercado'],
    growing:   ['ventas', 'costos', 'modelo', 'mercado', 'marca', 'cliente', 'valor']
  };

  /* Empujón por sector: un negocio de comida vive o muere por el costo por
     pedido; uno digital, por conseguir prospectos. Solo sube UNA sección, y
     solo si no estaba ya arriba. */
  var ANALISIS_PRIORITARIO = {
    comida: 'costos', hechoamano: 'costos', reventa: 'costos',
    digital: 'ventas', servicios: 'ventas'
  };

  function ordenAnalisis(kinds) {
    if (!Array.isArray(kinds) || !kinds.length || !activa()) return kinds;
    var etapa = '', sector = '';
    try {
      var c = V().active().core;
      etapa = c.stage; sector = c.sector;
    } catch (e) { return kinds; }

    var orden = (ANALISIS_POR_ETAPA[etapa] || []).slice();
    if (!orden.length) return kinds;

    var sube = ANALISIS_PRIORITARIO[sector];
    if (sube && orden.indexOf(sube) > 1) {
      orden.splice(orden.indexOf(sube), 1);
      orden.unshift(sube);
    }
    return reordenar(kinds, orden, 'key');
  }

  /** Reordena por una lista de claves. Lo que no aparezca en la lista se queda
      al final en su orden original: así, si mañana se añade un módulo y nadie
      actualiza estas tablas, sigue viéndose en vez de desaparecer. */
  function reordenar(items, orden, campo) {
    var out = [], resto = [], i, j;
    for (i = 0; i < orden.length; i++) {
      for (j = 0; j < items.length; j++) {
        if (items[j][campo] === orden[i] && out.indexOf(items[j]) < 0) out.push(items[j]);
      }
    }
    for (j = 0; j < items.length; j++) if (out.indexOf(items[j]) < 0) resto.push(items[j]);
    return out.concat(resto);
  }

  /* ==================================================================
     ESCRITURA — solo desde el arranque o desde un gesto del usuario
     ================================================================== */

  /** Deja el perfil listo para pintarse. Idempotente y silenciosa: se llama en
      cada arranque, y boot() puede volver a ejecutarse tras restaurar un
      respaldo o reiniciar el progreso. */
  function asegurar() {
    if (!w.Venture || !w.Store) return;
    var p;
    try { p = V().persona(); } catch (e) { return; }
    if (!p) return;

    var patch = {};

    // Sector: los perfiles anteriores a este sistema no lo tienen elegido.
    // Se deduce de lo que escribió, y se deja escrito para que no cambie solo
    // más adelante si retoca una palabra de su idea.
    try {
      var v = V().active();
      if (!sectorValido(v.core.sector)) {
        var guess = V().guessSector(v);
        if (guess && guess !== v.core.sector) V().patchCore({ sector: guess });
      }
    } catch (e) {}

    if (!temaValido(p.temaId)) patch.temaId = temaSugerido();
    if (!intensidadValida(p.intensidad)) patch.intensidad = 'media';

    // Solo se escribe si de verdad falta algo: cada set() sube `rev` y eso
    // marca como obsoleto todo el contenido ya generado.
    if (Object.keys(patch).length) V().setPersona(patch);
    aplicar();
  }

  /** Vuelve a derivar el tema del sector, pero SOLO si lo había elegido la app.
      Si el usuario escogió uno a mano, cambiar de sector no se lo pisa: eso es
      justo lo que el requisito pedía que no pasara nunca.
      Devuelve true si el tema cambió de verdad. */
  function sincronizarTema() {
    var p;
    try { p = V().persona(); } catch (e) { return false; }
    if (p.temaFuente === 'usuario') { aplicar(); return false; }
    var sug = temaSugerido();
    if (p.temaId === sug) { aplicar(); return false; }
    /* Solo el tema. `capas` guarda únicamente las ranuras que el usuario tocó a
       mano: borrarlas aquí le quitaría el accesorio que eligió por haber
       corregido su sector. capasElegidas() ya parte de las del tema nuevo. */
    V().setPersona({ temaId: sug });
    aplicar();
    return true;
  }

  function setTema(id, fuente) {
    if (!temaValido(id)) return;
    V().setPersona({ temaId: id, temaFuente: fuente || 'usuario' });
    aplicar();
  }

  function setIntensidad(x) {
    if (!intensidadValida(x)) return;
    V().setPersona({ intensidad: x });
    aplicar();
  }

  /** Cambia un accesorio. `clave` vacía significa "quítamelo". */
  function setCapa(ranura, clave) {
    if (!capaValida(ranura, clave)) return;
    var p = V().persona();
    var propias = {}, k;
    if (p.capas) for (k in p.capas) if (Object.prototype.hasOwnProperty.call(p.capas, k)) propias[k] = p.capas[k];
    propias[ranura] = clave || '';
    V().setPersona({ capas: propias });
    aplicar();
  }

  function setPanel(orden) {
    V().setPersona({ panel: Array.isArray(orden) && orden.length ? orden : null });
  }

  function setActiva(on) {
    w.Store.set(function (s) {
      if (!s.settings) s.settings = {};
      s.settings.personalizacion = !!on;
    }, 'persona');
    aplicar();
  }

  /** Vuelve a la propuesta automática: se olvida todo lo que el usuario tocó,
      pero no se toca ni un dato de su negocio. */
  function restablecer() {
    V().setPersona({
      temaId: temaSugerido(), temaFuente: 'auto',
      intensidad: 'media', capas: null, panel: null, propuesta: null
    });
    aplicar();
  }

  /** Vuelve a proponer a partir del negocio tal como está descrito ahora.
      Es lo que hace el botón "Regenerar la propuesta". */
  function regenerar() {
    var v = V().active();
    var guess = V().guessSector(v);
    /* "otro" no es un sector: es lo que devuelve guessSector cuando no encontró
       ninguna pista. Escribirlo pisaría el sector que el usuario eligió a mano
       —y con él la unidad de venta y las tablas por oficio— con un "no sé".
       La misma guarda está en detectarCambio() y en el registro. */
    if (guess && guess !== 'otro' && sectorValido(guess) && guess !== v.core.sector) {
      V().patchCore({ sector: guess });
    }
    V().setPersona({ temaId: temaSugerido(), temaFuente: 'auto', capas: null });
    aplicar();
    return actual();
  }

  /* ==================================================================
     PROPUESTAS

     La app nunca cambia la apariencia por su cuenta. Cuando detecta que el
     negocio ya no es el que era, deja una propuesta guardada y quien decide
     es el usuario. Guardar la propuesta —en vez de mostrarla y perderla— hace
     que sobreviva a cerrar la app.
     ================================================================== */

  /** ¿La descripción de ahora apunta a otro sector que el guardado? */
  function detectarCambio() {
    var v;
    try { v = V().active(); } catch (e) { return null; }
    var guess = V().guessSector(v);
    if (!guess || guess === 'otro' || !sectorValido(guess)) return null;
    if (guess === v.core.sector) return null;
    return { sector: guess, tema: (C().TEMA_POR_SECTOR || {})[guess] || TEMA_GENERICO, motivo: 'texto' };
  }

  /** Guarda una propuesta ya validada. Devuelve la propuesta o null. */
  function proponer(datos) {
    if (!datos) return null;
    var limpia = {
      sector: sectorValido(datos.sector) ? datos.sector : '',
      brandVoice: personalidadValida(datos.brandVoice) ? datos.brandVoice : '',
      tema: temaValido(datos.tema) ? datos.tema : '',
      subtipo: txt(datos.subtipo).slice(0, 60),
      confianza: Math.max(0, Math.min(1, Number(datos.confianza) || 0)),
      fuente: datos.fuente === 'ia' ? 'ia' : 'reglas',
      at: Date.now()
    };
    if (!limpia.sector && !limpia.brandVoice && !limpia.tema) return null;
    if (!limpia.tema && limpia.sector) {
      limpia.tema = (C().TEMA_POR_SECTOR || {})[limpia.sector] || TEMA_GENERICO;
    }
    V().setPersona({ propuesta: limpia });
    return limpia;
  }

  /** Le pide a la IA una lectura mejor del negocio. Devuelve una promesa que
      resuelve a la propuesta guardada, o a null si no hay IA, si falla o si lo
      que devolvió no pasó la validación. NUNCA aplica nada por su cuenta. */
  function clasificarIA() {
    if (!w.AI || !w.AI.disponible() || typeof w.AI.clasificarNegocio !== 'function') {
      return Promise.resolve(null);
    }
    var core;
    try { core = V().active().core; } catch (e) { return Promise.resolve(null); }
    return w.AI.clasificarNegocio(core).then(function (r) {
      if (!r) return null;
      // Si coincide con lo que ya tiene, no hay nada que proponerle.
      if (r.sector === core.sector && (!r.brandVoice || r.brandVoice === core.brandVoice)) return null;
      return proponer({
        sector: r.sector, brandVoice: r.brandVoice, subtipo: r.subtipo,
        confianza: r.confianza, fuente: 'ia'
      });
    }).catch(function () { return null; });
  }

  /** Lo que se llama después de que el usuario reescriba su idea: mira si el
      negocio parece otro y, si lo parece, deja la propuesta preparada. Con IA
      disponible la afina; sin ella, las palabras clave bastan. */
  function revisar() {
    var cambio = detectarCambio();
    if (cambio) proponer({ sector: cambio.sector, tema: cambio.tema, confianza: 0.6, fuente: 'reglas' });
    return clasificarIA().then(function (mejor) {
      return mejor || (cambio ? V().persona().propuesta : null);
    });
  }

  function aceptarPropuesta() {
    var p = V().persona().propuesta;
    if (!p) return null;
    var patch = {};
    if (p.sector) patch.sector = p.sector;
    if (p.brandVoice) patch.brandVoice = p.brandVoice;
    if (Object.keys(patch).length) V().patchCore(patch);
    if (p.tema) V().setPersona({ temaId: p.tema, temaFuente: 'auto', capas: null });
    V().setPersona({ propuesta: null });
    aplicar();
    return p;
  }

  function descartarPropuesta() {
    V().setPersona({ propuesta: null });
  }

  w.Persona = {
    TEMA_GENERICO: TEMA_GENERICO,
    INTENSIDADES: INTENSIDADES,

    asegurar: asegurar, aplicar: aplicar, actual: actual, activa: activa,
    temaSugerido: temaSugerido, distintivo: distintivo,

    colores: colores, capasSVG: capasSVG, mascotaOpts: mascotaOpts,
    invalidar: invalidar,

    ordenPanel: ordenPanel, ordenAnalisis: ordenAnalisis,

    setTema: setTema, setIntensidad: setIntensidad, setCapa: setCapa,
    sincronizarTema: sincronizarTema,
    setPanel: setPanel, setActiva: setActiva,
    restablecer: restablecer, regenerar: regenerar,

    detectarCambio: detectarCambio, proponer: proponer, revisar: revisar,
    clasificarIA: clasificarIA,
    aceptarPropuesta: aceptarPropuesta, descartarPropuesta: descartarPropuesta,

    valida: {
      tema: temaValido, sector: sectorValido,
      personalidad: personalidadValida, intensidad: intensidadValida, capa: capaValida
    }
  };
})(window, document);
