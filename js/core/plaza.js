/* ==========================================================================
   PLAZA — la vitrina del emprendimiento

   Emprendo ya sabe qué vende el usuario, a quién, qué problema resuelve y en
   qué etapa está. La vitrina es ese conocimiento recortado a lo que se puede
   enseñar a un desconocido, y nada más.

   Cuatro reglas que no se saltan:

     · LISTA BLANCA. Los campos publicables son los ocho de CAMPOS y de ahí
       no se sale. Lo que no esté aquí no existe para la vitrina: ni números,
       ni presupuesto, ni experiencia, ni el plan, ni la ciudad, ni el
       expediente, ni las decisiones que no estén declaradas.
     · NO INVENTA. Si falta un dato, se queda vacío y la vitrina no se puede
       abrir. No se rellena con suposiciones y no se le pregunta nada nuevo:
       todo sale de lo que ya escribió.
     · SOLO LEE EL PERFIL. Nunca escribe en el venture. Cualquier escritura
       subiría `rev` y tiraría la caché de desafíos personalizados, que es
       justo lo que js/core/comparte.js se cuidó de no hacer.
     · LA ÚLTIMA PALABRA ES SUYA. Lo que quede aprobado es lo que él aprobó,
       no lo que el perfil diga hoy. Si edita una línea, esa edición manda
       hasta que la borre.

   POR QUÉ NO SALE LA CIUDAD
   `core.place` es la ubicación aproximada de una persona. Los logros
   compartibles ya la excluyen, y ahí el lector es su propia red. Aquí el
   lector es alguien a quien no conoce, así que con más razón. Se lee como
   señal para recomendar el día que haya servidor; no viaja dentro del objeto.

   DÓNDE VIVE LO QUE SE APRUEBA
   En `Store.state.plaza`, que entra en el respaldo. Es correcto porque todo
   lo que hay ahí es suyo. El día que la Plaza tenga vecinos, lo que sea de
   otras personas NO puede vivir aquí: el respaldo se manda por WhatsApp.
   ========================================================================== */
(function (w) {
  'use strict';

  var VERSION = 1;

  /* Los mismos nombres que usa js/core/comparte.js en datosDe(), a propósito:
     las dos superficies que sacan algo del negocio hacia fuera hablan el mismo
     idioma, y un verificador puede cubrir las dos a la vez. */
  var CAMPOS = ['negocio', 'producto', 'idea', 'cliente', 'problema', 'valor', 'sector', 'etapa'];

  /* Los dos últimos son claves cerradas —sector y etapa— y no texto que haya
     escrito nadie, así que ni se recortan ni se revisan. */
  var TEXTOS = ['negocio', 'producto', 'idea', 'cliente', 'problema', 'valor'];

  /* Lo que se puede corregir a mano. El sector y la etapa se cambian donde
     siempre se han cambiado, en Mi Emprendimiento: tenerlos aquí también
     sería un segundo sitio donde editar lo mismo. */
  var EDITABLES = ['negocio', 'producto', 'cliente', 'problema', 'valor'];

  var TOPES = {
    negocio: 44, producto: 110, idea: 120, cliente: 100, problema: 120, valor: 110
  };

  /* Cómo se le presenta cada línea al usuario cuando revisa su vitrina. En
     segunda persona: esto se pinta en pantalla, no lo lee un modelo. */
  var ETIQUETAS = {
    negocio:  'Cómo se llama',
    producto: 'Qué haces',
    idea:     'Tu idea',
    cliente:  'A quién le sirve',
    problema: 'Qué problema resuelve',
    valor:    'Por qué la tuya',
    sector:   'De qué es',
    etapa:    'En qué andas'
  };

  /* El rótulo del toldo. CONFIG.SECTORS trae títulos pensados para un
     selector —"Hecho a mano / fabricación", "Otro / aún no lo sé"— y en un
     cartel de cincuenta pixeles eso no cabe ni se lee. Aquí van en una o dos
     palabras, y la lista es cerrada: los mismos seis sectores que tienen
     toldo en css/plaza.css, ni uno más. */
  var ROTULO = {
    hechoamano: 'Hecho a mano',
    comida:     'Comida',
    servicios:  'Servicios',
    digital:    'Digital',
    reventa:    'Reventa',
    otro:       'Negocio'
  };

  var ETAPA_CORTA = {
    idea: 'Con la idea', starting: 'Comenzando',
    operating: 'Operando', growing: 'Creciendo'
  };

  /* ==================================================================
     LO QUE NUNCA SALE

     Escrito como lista y no solo como ausencia, para que se pueda enseñar en
     pantalla y para que tools/check-vitrina.js pueda comprobarlo. Si algún
     día alguien añade una clave a la vitrina, el verificador falla antes de
     que llegue a publicarse.
     ================================================================== */

  var NUNCA = [
    'Tus precios y tus costos',
    'Tu plan y tus decisiones',
    'Tu ciudad y tus contactos',
    'Tu presupuesto y tu experiencia',
    'Tu progreso: racha, puntos e insignias'
  ];

  /* ==================================================================
     UTILIDADES
     ================================================================== */

  function txt(s) {
    return String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
  }

  /** El mismo recorte que usa comparte.js: sin partir palabras y sin dejar
      puntuación colgando. */
  function recorta(s, max) {
    s = txt(s);
    if (s.length <= max) return s;
    var corte = s.slice(0, max);
    var esp = corte.lastIndexOf(' ');
    return (esp > max * 0.6 ? corte.slice(0, esp) : corte).replace(/[,;:.\s]+$/, '') + '…';
  }

  /* Un dato de contacto dentro de la vitrina se salta la aceptación mutua
     entera: cualquiera podría escribirle sin que él haya aceptado. Se revisa
     aunque el usuario lo escriba a mano en la pantalla de aprobación, porque
     ahí es donde más fácil es hacerlo sin pensarlo.

     No pretende ser infalible. Detecta lo que la gente escribe de verdad —un
     correo, un teléfono, una arroba, un enlace— y no un intento de esconderlo.
     Contra eso no hay expresión regular que valga; lo que protege de verdad es
     que él ve la línea antes de que salga. */
  var CONTACTO = [
    /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,          // correo
    /https?:\/\//i,                          // enlace
    /\bwww\./i,
    /(^|\s)@[a-z0-9._-]{3,}/i,               // arroba de red social
    /\d[\d\s().-]{7,}\d/,                    // teléfono, con o sin separadores
    /\bwh?ats?app\b/i,
    /\bteleg?ram\b/i
  ];

  function tieneContacto(s) {
    s = String(s || '');
    for (var i = 0; i < CONTACTO.length; i++) {
      if (CONTACTO[i].test(s)) return true;
    }
    return false;
  }

  /** El texto limpio de un campo, o cadena vacía si no se puede publicar. */
  function limpio(clave, valor) {
    var v = txt(valor);
    if (!v) return '';
    if (tieneContacto(v)) return '';
    return recorta(v, TOPES[clave] || 120);
  }

  /* ==================================================================
     DE DÓNDE SALE CADA CAMPO

     Todo viene de Venture.terms() y del expediente, que es lo mismo que ya
     lee comparte.js. Ni una pregunta nueva.
     ================================================================== */

  function terms() {
    try { return w.Venture.terms(); } catch (e) { return null; }
  }

  /** El beneficio principal: "¿Qué gana o ahorra tu cliente?", el campo
      `valor` de la misión del precio. Ya estaba capturado desde siempre. */
  function beneficio() {
    try {
      var p = w.Store.state.dossier && w.Store.state.dossier.precio;
      var v = p && p.answers && p.answers.valor;
      return txt(v);
    } catch (e) { return ''; }
  }

  /* El problema, solo si viene de un sitio donde se escribió como una frase.
     Entregado en una misión de varios campos es el volcado de todos ellos
     unido por ' · ', y en el reto de entrevistas eso empieza por el nombre de
     la persona entrevistada. Publicar eso sería filtrar a un tercero.

     Es la misma regla que js/core/comparte.js:97, y está copiada a propósito
     en vez de importada: si algún día una de las dos superficies afloja la
     condición, la otra no se entera y sigue protegida. */
  var FUENTES_DE_UNA_FRASE = { registro: 1, expediente: 1, mentor: 1, chispa: 1 };

  function problemaPublicable() {
    var p;
    try { p = w.Venture.decision('problema'); } catch (e) { return ''; }
    if (!p || !p.value) return '';
    if (!FUENTES_DE_UNA_FRASE[p.from]) return '';
    if (String(p.value).indexOf(' · ') >= 0) return '';
    return txt(p.value);
  }

  /* Los textos de Venture.terms() vienen recortados a 34 y 56 caracteres,
     porque su destino es incrustarse dentro de una frase ("estás vendiendo
     X a Y"). Aquí no: aquí cada uno es una línea entera de la vitrina, y a 56
     caracteres una oferta normal se corta a media idea —"lámparas de cerámica
     hechas a mano para departamentos"— y pierde justo la palabra que la
     distingue.

     Así que el dato se pide sin recortar con Venture.effective(), que además
     devuelve la versión mejorada por las misiones, y se limpia y se recorta
     aquí con los topes de la vitrina. Las tres funciones de limpieza son las
     de Venture: no hay una segunda forma de escribir una oferta. */
  function crudo(campo, respaldo) {
    try {
      var e = w.Venture.effective(campo);
      var v = txt(e && e.value);
      return v || txt(respaldo);
    } catch (x) { return txt(respaldo); }
  }

  /* La única pieza de limpieza que Venture no exporta. Es la misma expresión
     de js/core/venture.js:207, copiada por lo mismo que problemaPublicable():
     son cuatro arranques de frase y tenerla aquí no ata la vitrina a que
     nadie cambie una función interna del perfil. */
  function sinArranqueDePublico(s) {
    return txt(s).replace(
      /^(les?\s+vendo\s+a\s+|mis?\s+clientes?\s+(son|es)\s+|se\s+lo\s+vendo\s+a\s+|para\s+|a\s+)/i, '');
  }

  /** La vitrina tal y como saldría del perfil, sin las correcciones a mano. */
  function desdeElPerfil() {
    var t = terms();
    if (!t) return null;

    var U = (w.Venture && w.Venture.util) || null;
    function pulir(clave, texto, quitarArranque) {
      var v = txt(texto);
      if (!v) return '';
      if (U) {
        v = quitarArranque ? sinArranqueDePublico(v) : U.stripLead(v);
        /* shorten() de Venture recorta mejor que el de aquí —no deja el texto
           terminado en preposición ni parte una subordinada a medias— pero no
           avisa de que ha cortado. Sin los puntos suspensivos, "quiere que su
           espacio se sienta" parece una frase terminada y no lo está. */
        var corto = U.lowerFirst(U.shorten(v, TOPES[clave] || 120));
        if (corto.length < v.length) corto += '…';
        v = corto;
      }
      return limpio(clave, v);
    }

    var oferta = crudo('offer', '');

    return {
      negocio:  t.tiene.nombre ? limpio('negocio', t.negocio) : '',
      producto: t.tiene.producto ? pulir('producto', oferta || t.producto) : '',
      idea:     t.tiene.idea ? pulir('idea', crudo('idea', '')) : '',
      cliente:  t.tiene.cliente ? pulir('cliente', crudo('customer', ''), true) : '',
      problema: limpio('problema', problemaPublicable()),
      valor:    limpio('valor', beneficio()),
      sector:   t.sector || 'otro',
      etapa:    t.etapa || ''
    };
  }

  /* ==================================================================
     EL ESTADO

     `editada` guarda solo lo que el usuario cambió a mano, no la vitrina
     entera. Así, cuando complete una sección nueva del expediente, las líneas
     que no tocó se ponen al día solas y la que corrigió sigue siendo suya.
     ================================================================== */

  function estado() {
    var s = w.Store.state;
    if (!s.plaza || typeof s.plaza !== 'object') {
      s.plaza = { v: VERSION, vitrina: null, editada: {}, aprobadaAt: 0, rev: null };
    }
    if (!s.plaza.editada || typeof s.plaza.editada !== 'object') s.plaza.editada = {};
    return s.plaza;
  }

  function rev() {
    try { return w.Venture.active().rev; } catch (e) { return null; }
  }

  /* ==================================================================
     LA PROPUESTA

     Lo que se le enseña en la pantalla de aprobación: la vitrina que saldría
     ahora mismo, más qué le falta para poder abrirla.
     ================================================================== */

  /* Sin esto no hay vitrina que enseñar: nadie entiende un puesto que no dice
     qué hace ni para quién. El resto —problema, beneficio, nombre— suma, pero
     no bloquea: obligar a tenerlo todo convertiría Plaza en un formulario, que
     es exactamente lo que no debe ser. */
  var IMPRESCINDIBLES = ['producto', 'cliente'];

  var FALTA = {
    producto: 'Qué vendes o qué haces',
    cliente:  'A quién le sirve',
    problema: 'Qué problema resuelve',
    valor:    'Qué gana quien te compra',
    negocio:  'Cómo se llama tu negocio'
  };

  /**
   * La vitrina de ahora mismo, con las correcciones a mano ya aplicadas.
   * Devuelve { vitrina, faltan, sugeridos, listo }:
   *   faltan     — lo imprescindible que todavía no hay
   *   sugeridos  — lo que la mejoraría, pero no la bloquea
   *   listo      — se puede abrir el puesto
   */
  function propuesta() {
    var base = desdeElPerfil();
    if (!base) return { vitrina: null, faltan: [FALTA.producto], sugeridos: [], listo: false };

    var e = estado();
    var v = {}, i, k;

    for (i = 0; i < CAMPOS.length; i++) {
      k = CAMPOS[i];
      /* La edición manda, pero pasa por el mismo filtro que el perfil: una
         corrección a mano no es una puerta trasera para publicar un teléfono. */
      if (EDITABLES.indexOf(k) >= 0 && typeof e.editada[k] === 'string') {
        v[k] = limpio(k, e.editada[k]);
      } else {
        v[k] = base[k];
      }
    }
    v.v = VERSION;

    var faltan = [], sugeridos = [];
    for (i = 0; i < IMPRESCINDIBLES.length; i++) {
      k = IMPRESCINDIBLES[i];
      if (!v[k]) faltan.push(FALTA[k]);
    }
    ['problema', 'valor', 'negocio'].forEach(function (c) {
      if (!v[c]) sugeridos.push(FALTA[c]);
    });

    return { vitrina: v, faltan: faltan, sugeridos: sugeridos, listo: faltan.length === 0 };
  }

  /* ==================================================================
     APROBAR, CORREGIR Y RETIRAR
     ================================================================== */

  /** ¿Ya tiene un puesto aprobado? */
  function abierta() {
    var e = estado();
    return !!(e.vitrina && e.aprobadaAt);
  }

  /** La vitrina aprobada, o null. Es la que se enseñaría, no la propuesta. */
  function vitrina() {
    var e = estado();
    return e.vitrina ? e.vitrina : null;
  }

  /** Guarda la corrección de una línea. Texto vacío = volver a lo que dice
      el perfil, que es lo que espera quien borra el campo entero. */
  function editar(clave, texto) {
    if (EDITABLES.indexOf(clave) < 0) return false;
    var limpia = txt(texto);
    if (limpia && tieneContacto(limpia)) return false;

    w.Store.set(function (s) {
      var e = s.plaza;
      if (limpia) e.editada[clave] = recorta(limpia, TOPES[clave] || 120);
      else delete e.editada[clave];
    }, 'plaza');
    return true;
  }

  /** Deja aprobada la vitrina de ahora mismo. Devuelve la aprobada, o null si
      todavía le falta algo imprescindible. */
  function aprobar() {
    var p = propuesta();
    if (!p.listo) return null;

    w.Store.set(function (s) {
      s.plaza.vitrina = p.vitrina;
      s.plaza.aprobadaAt = Date.now();
      s.plaza.rev = rev();
    }, 'plaza');
    return p.vitrina;
  }

  /** Cierra el puesto. Se conservan las correcciones a mano: quien lo cierra
      hoy y lo vuelve a abrir en un mes no debería reescribirlas. */
  function retirar() {
    w.Store.set(function (s) {
      s.plaza.vitrina = null;
      s.plaza.aprobadaAt = 0;
      s.plaza.rev = null;
    }, 'plaza');
  }

  /** Lo que se publicaría hoy ya no es lo que está publicado.

      Pasa por dos motivos, y los dos cuentan: porque avanzó en la app y hay
      información nueva, o porque corrigió una línea y todavía no la ha vuelto
      a aprobar. Nada de eso se aplica solo — lo que está abierto es lo que él
      aprobó, y cambiarlo por detrás rompería justo esa promesa.

      Se compara el contenido y no `rev`. Mirar `rev` parecía el atajo obvio,
      pero solo sube cuando cambia el PERFIL: una corrección a mano en la
      vitrina no lo toca, así que con ese atajo sus propios cambios no se
      detectaban nunca. Son ocho comparaciones de cadena; no hace falta atajo. */
  function hayNovedad() {
    var e = estado();
    if (!e.vitrina || !e.aprobadaAt) return false;

    var p = propuesta();
    if (!p.vitrina) return false;
    for (var i = 0; i < CAMPOS.length; i++) {
      if (p.vitrina[CAMPOS[i]] !== e.vitrina[CAMPOS[i]]) return true;
    }
    return false;
  }

  /* ==================================================================
     LOS VECINOS

     Hoy no hay. No existe el sitio donde vivan las vitrinas de otras
     personas, así que esto devuelve una lista vacía, la Plaza se pinta
     vacía y lo dice con todas las letras.

     El día que haya servidor, `vecinos()` pregunta a la nube y ninguna
     pantalla se entera del cambio. Por eso existe esta función hoy, con esta
     forma: para que el sitio por donde entrarán los vecinos esté decidido y
     no haya que rehacer la pantalla.

     `inyectar()` es la única puerta para meter vitrinas a mano, y solo la
     usa lab/plaza.html. La app nunca la llama: si lo hiciera, la Plaza
     tendría vecinos falsos.
     ================================================================== */

  var inyectadas = null;

  /* Lo último que trajo el servidor. Vive en memoria y no se persiste: son
     vitrinas de otras personas, y guardarlas en el teléfono sería quedarse
     con datos ajenos más tiempo del necesario. Al cerrar la app se van. */
  var traidos = null;
  var traidosAt = 0;

  function vecinos() {
    if (inyectadas) return inyectadas;
    return traidos || [];
  }

  function hayVecinos() { return vecinos().length > 0; }

  /** ¿Se ha llegado a preguntar alguna vez? Distinto de «no hay nadie»: sin
      esto, la pantalla no puede separar «la Plaza está vacía» de «todavía no
      he preguntado», y esas dos cosas se le cuentan al usuario distinto. */
  function preguntado() { return traidos !== null; }

  /* Quién vio valor en lo tuyo, y las conversaciones abiertas. Igual que los
     vecinos: en memoria y sin persistir, porque son datos de otras personas
     y el teléfono no tiene por qué quedárselos entre sesiones. */
  var recibidosCache = null;
  var charlasCache = null;

  function recibidos() { return recibidosCache || []; }
  function guardarRecibidos(l) { recibidosCache = Array.isArray(l) ? l : []; }
  function preguntadoRecibidos() { return recibidosCache !== null; }

  function charlas() { return charlasCache || []; }
  function guardarCharlas(l) { charlasCache = Array.isArray(l) ? l : []; }

  function guardarVecinos(lista) {
    traidos = Array.isArray(lista) ? lista : [];
    traidosAt = Date.now();
  }

  function olvidarVecinos() {
    traidos = null; traidosAt = 0;
    recibidosCache = null; charlasCache = null;
  }

  function inyectar(lista) {
    inyectadas = (lista && lista.length) ? lista : null;
  }

  /* ==================================================================
     LO QUE NO ES SUYO

     A quién le dijo "veo valor" y qué le escribió. Vive en su propia clave
     de localStorage y NO en Store, porque Store.exportJSON() vuelca el
     estado entero y ese archivo el usuario lo manda por WhatsApp. Su
     vitrina sí va en el respaldo —es suya—; los identificadores y los
     mensajes hacia otras personas, no.

     Se lee y se escribe con tolerancia a fallos, igual que Store: en modo
     privado o desde file:// el almacenamiento puede lanzar, y perder esto no
     puede tumbar la pantalla.
     ================================================================== */

  var CLAVE_LOCAL = (w.BRAND && w.BRAND.claves && w.BRAND.claves.plaza) || 'modo-emprendedor:plaza';
  var localCache = null;

  function localVacio() { return { v: 1, enviados: {}, sesion: '', id: '' }; }

  function local() {
    if (localCache) return localCache;
    try {
      var crudo = w.localStorage.getItem(CLAVE_LOCAL);
      var p = crudo ? JSON.parse(crudo) : null;
      localCache = (p && typeof p === 'object' && !Array.isArray(p) && p.enviados) ? p : localVacio();
      if (typeof localCache.sesion !== 'string') localCache.sesion = '';
      if (typeof localCache.id !== 'string') localCache.id = '';
    } catch (e) {
      localCache = localVacio();
    }
    return localCache;
  }

  function guardarLocal() {
    try { w.localStorage.setItem(CLAVE_LOCAL, JSON.stringify(local())); } catch (e) { /* sin sitio */ }
  }

  /* ------------------------------ LA SESIÓN ------------------------------

     Vive aquí, en la clave propia de la Plaza, y NO en Store. Es la razón
     por la que esta clave existe: `Store.exportJSON()` vuelca el estado
     entero y ese archivo el usuario lo manda por WhatsApp para no perder su
     progreso. Una sesión ahí dentro es la llave de su cuenta viajando por un
     chat de grupo.

     `id` es su identificador en la Plaza. Se guarda para poder reconocerse a
     sí mismo en una conversación —quién escribió cada mensaje— sin tener que
     preguntarlo cada vez. */

  function sesion() { return local().sesion || ''; }

  function idNube() { return local().id || ''; }

  function conectado() { return !!sesion(); }

  function entrarNube(token, id) {
    var l = local();
    l.sesion = String(token || '');
    l.id = String(id || '');
    guardarLocal();
  }

  /** Cierra la sesión y suelta TODO lo que era de otras personas: a quién
      saludó y las vitrinas que trajo el servidor. Lo suyo —su vitrina— se
      queda, porque es suyo y lo aprobó él. */
  function salirNube() {
    var l = local();
    l.sesion = '';
    l.id = '';
    l.enviados = {};
    guardarLocal();
    olvidarVecinos();
  }

  /** A quién ya le dijo que ve valor: { idVitrina: { intencion, at } }. */
  function enviados() { return local().enviados; }

  function yaEnviado(id) { return !!local().enviados[id]; }

  /**
   * Guarda que vio valor en un emprendimiento, con qué intención y qué le
   * escribió. Hoy solo se guarda aquí: no hay a dónde mandarlo todavía, y la
   * pantalla lo dice así.
   */
  function veoValor(id, intencion, mensaje) {
    if (!id || !intencion) return false;
    var l = local();
    l.enviados[id] = { intencion: intencion, mensaje: String(mensaje || ''), at: Date.now() };
    guardarLocal();
    return true;
  }

  /** Deshacer. Mientras no haya servidor, retirarlo es gratis y sin rastro. */
  function retirarValor(id) {
    var l = local();
    if (!l.enviados[id]) return false;
    delete l.enviados[id];
    guardarLocal();
    return true;
  }

  /** Borra todo lo de la Plaza que no es suyo. Lo llamará el borrado de
      cuenta del tramo del servidor; hoy lo usa lab/plaza.html para reiniciar. */
  function olvidarTodo() {
    localCache = localVacio();
    try { w.localStorage.removeItem(CLAVE_LOCAL); } catch (e) { /* da igual */ }
  }

  /* ==================================================================
     LA LÍNEA DE UNA SOLA FRASE

     Lo que se lee bajo el nombre del puesto. Prefiere el producto porque ya
     viene limpio; la idea es el último recurso.
     ================================================================== */

  function resumen(v) {
    if (!v) return '';
    return v.producto || v.idea || '';
  }

  function titulo(v) {
    if (!v) return '';
    return v.negocio || v.producto || v.idea || '';
  }

  function etapaCorta(v) {
    return (v && ETAPA_CORTA[v.etapa]) || '';
  }

  /** Lo que dice el toldo. Un sector desconocido cae en el de reserva, que es
      el mismo que usa css/plaza.css cuando no reconoce el data-toldo. */
  function rotulo(v) {
    return (v && ROTULO[v.sector]) || ROTULO.otro;
  }

  w.Plaza = {
    // lectura
    propuesta: propuesta,
    vitrina: vitrina,
    abierta: abierta,
    hayNovedad: hayNovedad,
    hayVecinos: hayVecinos,
    vecinos: vecinos,
    preguntado: preguntado,
    recibidos: recibidos,
    preguntadoRecibidos: preguntadoRecibidos,
    charlas: charlas,
    enviados: enviados,
    yaEnviado: yaEnviado,
    sesion: sesion,
    idNube: idNube,
    conectado: conectado,
    // escritura
    aprobar: aprobar,
    editar: editar,
    retirar: retirar,
    veoValor: veoValor,
    retirarValor: retirarValor,
    olvidarTodo: olvidarTodo,
    entrar: entrarNube,
    salir: salirNube,
    guardarVecinos: guardarVecinos,
    guardarRecibidos: guardarRecibidos,
    guardarCharlas: guardarCharlas,
    olvidarVecinos: olvidarVecinos,
    // solo para lab/plaza.html: la app nunca mete vecinos a mano
    __inyectar: inyectar,
    // presentación
    titulo: titulo,
    resumen: resumen,
    etapaCorta: etapaCorta,
    rotulo: rotulo,
    // el contrato, para las pantallas y para tools/check-vitrina.js
    CAMPOS: CAMPOS,
    TEXTOS: TEXTOS,
    EDITABLES: EDITABLES,
    ETIQUETAS: ETIQUETAS,
    ROTULO: ROTULO,
    TOPES: TOPES,
    NUNCA: NUNCA,
    tieneContacto: tieneContacto
  };
})(window);
