/* ==========================================================================
   EMPRENDO IMPULSO — el pase, y quién lo tiene

   Este archivo contesta a una sola pregunta —`Impulso.activo()`— y todo lo
   demás existe para que esa respuesta sea de fiar y esté disponible sin
   conexión.

   POR QUÉ NO BASTA CON UN `plan: 'impulso'` EN EL ESTADO

   El estado de la app es un JSON en localStorage, y su propio importador lo
   bendice: `limpiar()` copia todas las claves salvo tres, e `importJSON()`
   hace `merge(defaults(), respaldo)` donde en el conflicto GANA el respaldo.
   Un archivo de respaldo editado a mano con `"plan":"impulso"` entra tal cual
   y se guarda. No es un descuido: es que ese objeto está diseñado para que el
   usuario pueda llevárselo, y eso y ser una barrera no caben juntos.

   Así que lo que se guarda no es un valor: es una FIRMA.

   CÓMO FUNCIONA

   El Worker de pago devuelve un pase —`datos.firma`, los dos en base64url—
   firmado con ECDSA P-256. Aquí abajo está la mitad pública de esa llave. La
   app verifica la firma con `crypto.subtle`, sin red, y solo entonces se cree
   lo que dice el pase. Editar el pase lo invalida; escribirse uno hace falta
   la mitad privada, que vive como secreto del Worker.

   LO QUE ESTO NO RESUELVE, Y ESTÁ ACEPTADO

   La app es JavaScript que se descarga entero. Quien sepa parchear
   `activo()` se salta esto siempre, y no hay forma de evitarlo en una app sin
   servidor que además funciona sin conexión. Lo que se cierra es el fraude
   real —cambiar un valor en el almacenamiento, o restaurar un respaldo
   tuneado—, que es lo que puede hacer cualquiera en dos minutos. Perseguir lo
   demás solo estorbaría a quien paga.

   SIN CONEXIÓN

   El pase trae hasta cuándo vale, y el Worker le pone un tope corto: como
   mucho tres días. Se renueva solo cada vez que la app arranca con red. O
   sea: quien está en el metro conserva Impulso, y quien dejó de pagar lo
   pierde como muy tarde tres días después. Ese número es una decisión de
   producto y vive en el Worker, no aquí.

   DÓNDE VIVE

   En su propia clave de localStorage, nunca en Store. Por lo mismo que la
   sesión de la Plaza: `Store.exportJSON()` vuelca el estado entero y ese
   archivo viaja por WhatsApp, y `Store.reset()` lo pisa con los valores por
   defecto —o sea, «Reiniciar todo» le borraría a un suscriptor lo que pagó.
   ========================================================================== */
(function (w) {
  'use strict';

  /* ------------------------------- LA LLAVE -------------------------------

     La mitad PÚBLICA del par que firma los pases. La privada vive como
     secreto del Worker de pago y no está en este repositorio.

     Las dos salen del mismo comando:   node tools/nueva-llave-pase.js

     Vacía significa que Impulso todavía no existe: no se enseña la pantalla
     de cobro, no se enseña un precio y no hay ningún botón que lleve a un
     sitio que no está montado. Es el mismo criterio que `BRAND.dominios.api`.

     CUIDADO AL ROTARLA: si aquí hay una llave y en el Worker otra, ningún
     pase verifica y todo el que pagó pierde Impulso a la vez, sin conexión y
     sin poder arreglarlo desde su lado. Para rotar de verdad hay que aceptar
     las dos durante una temporada. Por eso esto es una LISTA. */
  var LLAVES = [
    // { "kty":"EC","crv":"P-256","x":"…","y":"…","key_ops":["verify"],"ext":true }
  ];

  /* Cada cuánto se pide un pase nuevo teniendo red. Seis horas: lo bastante
     poco para que cancelar tenga efecto pronto, lo bastante mucho para no
     llamar al servidor en cada arranque de quien abre la app diez veces al
     día. */
  var REFRESCO = 6 * 60 * 60 * 1000;

  var ESPERA = 25000;

  var CLAVE = (w.BRAND && w.BRAND.claves && w.BRAND.claves.impulso) || 'modo-emprendedor:impulso';

  /* ------------------------------- ESTADO -------------------------------

     `verificado` es la única fuente de verdad en memoria, y solo lo escribe
     `comprobar()` después de que la firma cuadre. Empieza en null —«todavía
     no lo sé»— y no en false, para poder distinguir «no ha pagado» de «aún no
     he mirado» cuando alguna pantalla lo necesite. */
  var verificado = null;
  var clavesImportadas = null;

  /* ==================================================================
     ALMACENAMIENTO

     Tolerante a fallos, igual que Store: desde file:// o en modo privado
     esto lanza, y perder el pase no puede tumbar la app. Quien no pueda
     guardarlo se queda sin Impulso hasta que vuelva a haber red, que es
     exactamente lo que pasaría de todas formas.
     ================================================================== */

  function leerPase() {
    try { return w.localStorage.getItem(CLAVE) || ''; } catch (e) { return ''; }
  }

  function guardarPase(pase) {
    try {
      if (pase) w.localStorage.setItem(CLAVE, pase);
      else w.localStorage.removeItem(CLAVE);
    } catch (e) { /* sin sitio: se seguirá pidiendo en cada arranque */ }
  }

  /* ==================================================================
     LA FIRMA
     ================================================================== */

  function deB64url(s) {
    var t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    var bruto = w.atob(t);
    var b = new Uint8Array(bruto.length);
    for (var i = 0; i < bruto.length; i++) b[i] = bruto.charCodeAt(i);
    return b;
  }

  function textoDeB64url(s) {
    var b = deB64url(s);
    var out = '';
    for (var i = 0; i < b.length; i++) out += String.fromCharCode(b[i]);
    // El pase es JSON con nombres y fechas: ASCII. decodeURIComponent lo
    // devuelve bien igual si algún día llevara acentos.
    try { return decodeURIComponent(escape(out)); } catch (e) { return out; }
  }

  function cripto() {
    /* `crypto.subtle` no existe en un contexto inseguro, y abrir index.html
       con doble clic (file://) es uno. Ahí no hay red, así que tampoco hay
       forma de haber pagado: se comporta como gratis y ya está. */
    return (w.crypto && w.crypto.subtle) ? w.crypto.subtle : null;
  }

  /* Cuántas llaves había cuando se llenó la caché. Importar una llave cuesta
     lo suyo y se hace una vez, pero la caché no puede sobrevivir a que la
     lista cambie: durante una rotación se despliega la app con dos llaves, y
     una caché hecha cuando solo había una dejaría fuera a media base de
     suscriptores sin que nada fallara. */
  var clavesEnCache = -1;

  function importarLlaves() {
    if (clavesImportadas && clavesEnCache === LLAVES.length) return clavesImportadas;
    clavesEnCache = LLAVES.length;

    var sub = cripto();
    if (!sub || !LLAVES.length) {
      clavesImportadas = Promise.resolve([]);
      return clavesImportadas;
    }
    clavesImportadas = Promise.all(LLAVES.map(function (jwk) {
      return sub.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .catch(function () { return null; });
    })).then(function (l) { return l.filter(Boolean); });
    return clavesImportadas;
  }

  /**
   * Verifica un pase y devuelve sus datos, o null.
   *
   * Se comprueban tres cosas y en este orden: que la firma sea de una de
   * nuestras llaves, que el pase no haya caducado y que diga 'impulso'. La
   * firma primero, siempre: sin ella los otros dos campos son texto que
   * escribió cualquiera.
   */
  function verificar(pase) {
    var trozos = String(pase || '').split('.');
    if (trozos.length !== 2 || !trozos[0] || !trozos[1]) return Promise.resolve(null);

    var sub = cripto();
    if (!sub) return Promise.resolve(null);

    var firma, mensaje;
    try {
      firma = deB64url(trozos[1]);
      mensaje = new TextEncoder().encode(trozos[0]);
    } catch (e) { return Promise.resolve(null); }

    return importarLlaves().then(function (llaves) {
      if (!llaves.length) return null;
      var intentos = llaves.map(function (k) {
        return sub.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, firma, mensaje)
          .catch(function () { return false; });
      });
      return Promise.all(intentos).then(function (res) {
        if (res.indexOf(true) < 0) return null;
        var datos;
        try { datos = JSON.parse(textoDeB64url(trozos[0])); } catch (e) { return null; }
        if (!datos || typeof datos !== 'object') return null;
        if (Number(datos.h || 0) <= Date.now()) return null;   // caducado
        return datos;
      });
    }).catch(function () { return null; });
  }

  /* ==================================================================
     HABLAR CON EL WORKER

     Mismas tres reglas que js/core/plaza-nube.js: nunca lanza, la sesión
     viaja dentro del cuerpo, y lo que vuelve no se pinta como HTML. La
     sesión es la MISMA de la Plaza: no hay dos cuentas, hay una.
     ================================================================== */

  function url() {
    return (w.BRAND && w.BRAND.dominios && w.BRAND.dominios.pago) || '';
  }

  /** ¿Puede existir un pase? Hacen falta las dos mitades: el servidor que
      firma y la llave con la que se comprueba lo que firma. */
  function existe() {
    return !!url() && LLAVES.length > 0;
  }

  /* ==================================================================
     APPLE

     En la app de iPhone se cobra con Apple: Apple no deja otro cobro para
     algo digital. La compra la hace StoreKit; este archivo solo le pasa al
     Worker el número de compra, y el Worker se lo pregunta a Apple y firma el
     MISMO pase de siempre. Lo que viene después —verificar, guardar,
     `activo()`— no sabe de dónde salió el dinero.

     Sin correo: Apple no deja pedir una cuenta antes de comprar algo que no
     vive en la cuenta (regla 5.1.1). Si hay sesión, la compra se ata a ella;
     si no, el pase sale a nombre de la compra.
     ================================================================== */

  function compras() {
    return (w.Nativo && w.Nativo.es) ? w.Nativo.plugin('NativePurchases') : null;
  }

  function producto() {
    return (w.CONFIG && w.CONFIG.IMPULSO && w.CONFIG.IMPULSO.productoApple) || '';
  }

  /** ¿Se puede comprar AQUÍ? En el iPhone, con Apple. En la web, con Stripe,
      y solo cuando Stripe esté montado: hasta entonces no se enseña un precio
      que no lleva a ningún sitio. */
  function disponible() {
    if (!existe()) return false;
    if (compras()) return !!producto();
    return !!(w.CONFIG && w.CONFIG.IMPULSO && w.CONFIG.IMPULSO.cobroWeb);
  }

  var precioApple = '';

  /** El precio tal como lo pone Apple, en la moneda de quien mira: «$99.00».
      Vacío mientras no ha llegado. Apple exige que el precio que se enseña
      sea ese, y no uno escrito a mano. */
  function precio() { return precioApple; }

  function cargarPrecio() {
    var NP = compras();
    if (!NP || !producto()) return Promise.resolve('');
    return NP.getProducts({ productIdentifiers: [producto()], productType: 'subs' }).then(function (r) {
      var p = r && r.products && r.products[0];
      precioApple = (p && p.priceString) || '';
      return precioApple;
    }).catch(function () { return ''; });
  }

  /** La compra viva de Impulso en el Apple ID de este iPhone: su número, null
      si NO hay ninguna, o undefined si no se pudo saber. Las dos últimas no
      son lo mismo: sin saber no se le quita nada a nadie. */
  function compraApple() {
    var NP = compras();
    if (!NP) return Promise.resolve(undefined);
    return NP.getPurchases({ onlyCurrentEntitlements: true }).then(function (r) {
      var l = (r && r.purchases) || [];
      for (var i = 0; i < l.length; i++) {
        if (l[i].productIdentifier === producto() && !l[i].revocationDate) return String(l[i].transactionId);
      }
      return null;
    }).catch(function () { return undefined; });
  }

  function sesion() {
    return (w.Plaza && w.Plaza.sesion) ? (w.Plaza.sesion() || '') : '';
  }

  function pide(op, datos, sesionOpcional) {
    if (!existe()) return Promise.resolve({ error: 'sin-servidor' });

    var s = sesion();
    if (!s && !sesionOpcional) return Promise.resolve({ error: 'sin-sesion' });

    var cuerpo = { op: op };
    if (s) cuerpo.sesion = s;
    for (var k in (datos || {})) {
      if (Object.prototype.hasOwnProperty.call(datos, k)) cuerpo[k] = datos[k];
    }

    var corta = null, avisa = null;
    try {
      corta = new AbortController();
      avisa = setTimeout(function () { corta.abort(); }, ESPERA);
    } catch (e) { corta = null; }

    return w.fetch(url(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: corta ? corta.signal : undefined
    }).then(function (res) {
      if (avisa) clearTimeout(avisa);
      return res.json().then(function (j) {
        /* La sesión caducó. Se cierra en la Plaza, que es de quien es, y el
           pase se tira: sin cuenta no hay a quién pertenezca. */
        if (res.status === 401) {
          if (w.Plaza && w.Plaza.salir) w.Plaza.salir();
          olvidar();
          return { error: 'sin-sesion' };
        }
        return j || { error: 'fallo' };
      }).catch(function () { return { error: 'fallo' }; });
    }).catch(function (e) {
      if (avisa) clearTimeout(avisa);
      var abortado = e && (e.name === 'AbortError' || String(e).indexOf('abort') >= 0);
      return { error: abortado ? 'lento' : 'sin-red' };
    });
  }

  /* ==================================================================
     ARRANCAR Y REFRESCAR
     ================================================================== */

  var cambio = [];

  /** Avisa a quien esté escuchando de que la respuesta de `activo()` cambió.
      Lo usan la barra superior y las pantallas para repintarse sin tener que
      preguntar cada segundo. */
  function alCambiar(fn) { if (typeof fn === 'function') cambio.push(fn); }

  function anunciar(antes) {
    if (antes === activo()) return;
    cambio.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  }

  /** Verifica lo que haya guardado y deja la respuesta en memoria. */
  function comprobar() {
    var antes = activo();
    return verificar(leerPase()).then(function (datos) {
      verificado = (datos && datos.p === 'impulso') ? datos : false;
      anunciar(antes);
      return activo();
    });
  }

  /** Pide un pase nuevo al servidor. Si no hay red, se calla: el que hay
      guardado sigue valiendo hasta su fecha, que es justo para esto. */
  function refrescar(forzar) {
    /* Los tres cortes devuelven `activo()` y no `false`: no poder preguntar
       no es lo mismo que no tener Impulso. Quien está sin conexión sigue
       teniéndolo hasta que su pase caduque, y quien llame a esto esperando un
       sí o un no tiene que recibir el estado de verdad. */
    if (!existe()) return Promise.resolve(activo());

    if (!forzar && verificado && verificado.e && (Date.now() - verificado.e) < REFRESCO) {
      return Promise.resolve(activo());
    }

    /* En el iPhone, lo primero es preguntarle a StoreKit: es quien sabe si
       este Apple ID tiene Impulso, con cuenta o sin ella. */
    if (compras()) {
      return compraApple().then(function (tx) {
        if (tx) return pedirPase('apple', { transaccion: tx }).then(function () { return activo(); });
        /* Ya no hay compra en este Apple ID. Un pase que salió de Apple y no
           de una cuenta no tiene a quién más preguntarle: se acabó. */
        if (tx === null && verificado && verificado.o === 'apple' && !sesion()) olvidar();
        if (!sesion()) return activo();
        return pedirPase('pase', {}).then(function () { return activo(); });
      });
    }

    if (!sesion()) return Promise.resolve(activo());
    return pedirPase('pase', {}).then(function () { return activo(); });
  }

  /** Pide un pase al Worker, lo verifica y lo guarda. Devuelve la respuesta
      del Worker, para quien necesite saber por qué no llegó. */
  function pedirPase(op, datos) {
    return pide(op, datos, op === 'apple').then(function (r) {
      if (!r || !r.ok || !r.pase) return r || { error: 'fallo' };
      /* Se verifica ANTES de guardarlo. Si algún día el servidor devolviera
         algo que no cuadra —una llave rotada a medias, por ejemplo—, es
         mejor quedarse con el pase viejo que sigue siendo válido que
         guardar uno que no verifica y dejar a alguien sin Impulso. */
      return verificar(r.pase).then(function (datos) {
        if (!datos) return { error: 'fallo' };
        var antes = activo();
        guardarPase(r.pase);
        verificado = (datos.p === 'impulso') ? datos : false;
        anunciar(antes);
        return r;
      });
    });
  }

  /** Lo llama js/app.js al arrancar. Verifica lo guardado y, si hay red y
      toca, pide uno nuevo. Las dos cosas son silenciosas: si fallan, la app
      se comporta como gratis, que es el estado seguro. */
  function arrancar() {
    var NP = compras();
    if (NP) {
      cargarPrecio();
      /* Compras que llegan sin pasar por el botón: una renovación, un «pedir
         permiso para comprar» que un padre aprueba horas después, una oferta
         canjeada en la App Store. */
      try { NP.addListener('transactionUpdated', function () { refrescar(true); }); } catch (e) {}
    }
    return comprobar().then(function () {
      return refrescar(false);
    }).catch(function () { return activo(); });
  }

  function olvidar() {
    var antes = activo();
    guardarPase('');
    verificado = false;
    anunciar(antes);
  }

  /* ==================================================================
     LA PREGUNTA

     Síncrona a propósito. La llaman el motor, la barra superior y la
     lección, y ninguno de los tres puede esperar a una promesa: la
     verificación ya se hizo al arrancar, mientras se veía la pantalla de
     inicio, y aquí solo se lee el resultado.
     ================================================================== */

  function activo() {
    return !!(verificado && verificado.p === 'impulso' && Number(verificado.h || 0) > Date.now());
  }

  /** Hasta cuándo está pagado, en milisegundos. 0 si no hay nada.
      Es lo que se le enseña al usuario; `h` —cuánto vale el pase— es un
      detalle interno que no significa nada para él. */
  function hasta() {
    return activo() ? Number(verificado.f || 0) : 0;
  }

  /** ¿Ya se miró? Sirve para no pintar «no tienes Impulso» durante el
      instante en que todavía no se ha verificado nada. */
  function sabido() { return verificado !== null; }

  /** Quién cobra lo que tiene: 'apple', 'web' o ''. De eso depende dónde se
      gestiona y si borrar la cuenta puede cancelarlo. */
  function origen() { return activo() ? String(verificado.o || '') : ''; }

  /* ==================================================================
     COMPRAR, GESTIONAR Y CANCELAR
     ================================================================== */

  /**
   * Devuelve la dirección de Stripe donde se paga.
   *
   * No navega: eso lo decide la pantalla, porque el router de esta app vive
   * solo en memoria —no hay hash ni History API— y salir a otro dominio y
   * volver no tiene forma de recuperar su sitio. La pantalla abre pestaña
   * nueva, y al recuperar el foco se pide el pase otra vez.
   */
  function comprar() { return pide('checkout', {}); }

  /**
   * Compra con Apple, en el iPhone. Devuelve { ok } cuando el pase ya está
   * guardado y dice 'impulso', o { error } con lo que pasó:
   *   'cancelado'  cerró la hoja de Apple. No es un fallo.
   *   'pendiente'  «pedir permiso para comprar»: llega cuando lo aprueben.
   *   'sin-confirmar'  Apple cobró pero no se pudo confirmar aquí todavía.
   *                Se confirma solo en el siguiente arranque con red.
   */
  function comprarApple() {
    var NP = compras();
    if (!NP) return Promise.resolve({ error: 'sin-servidor' });
    return NP.purchaseProduct({ productIdentifier: producto(), productType: 'subs' }).then(function (tx) {
      if (!tx || !tx.transactionId) return { error: 'pendiente' };
      return pedirPase('apple', { transaccion: String(tx.transactionId) }).then(function (r) {
        if (activo()) return { ok: true };
        /* Apple ya cobró. Lo que haya fallado es de este lado —la red, el
           Worker—, así que no se dice «no se pudo»: se dice que llega. */
        return { error: 'sin-confirmar' };
      });
    }, function (e) {
      var m = String((e && (e.message || e.code)) || e || '');
      if (/cancel/i.test(m)) return { error: 'cancelado' };
      if (/pend|defer/i.test(m)) return { error: 'pendiente' };
      return { error: 'apple' };
    });
  }

  /** «Ya lo tenía»: le pide a Apple que sincronice las compras de este Apple
      ID y vuelve a pedir el pase. Apple exige que este botón exista. */
  function restaurar() {
    var NP = compras();
    if (!NP) return Promise.resolve(activo());
    return NP.restorePurchases().catch(function () {}).then(function () { return refrescar(true); });
  }

  /** Donde se cambia o se cancela lo que cobra Apple: su propia hoja dentro
      de la app en el iPhone, su página en cualquier otro sitio. */
  function gestionarApple() {
    var NP = compras();
    if (NP) return NP.manageSubscriptions().catch(function () {
      return w.Nativo.abrir('https://apps.apple.com/account/subscriptions');
    });
    if (w.Nativo) return w.Nativo.abrir('https://apps.apple.com/account/subscriptions');
    w.open('https://apps.apple.com/account/subscriptions', '_blank', 'noopener');
    return Promise.resolve();
  }

  /** La página de Stripe donde se cancela, se cambia la tarjeta y se ven los
      recibos. Escribir eso aquí sería reimplementar una facturación entera
      para no ganar nada. */
  function portal() { return pide('portal', {}); }

  /**
   * Cancela la suscripción de verdad y al momento. NO es el botón de
   * cancelar de la pantalla —ese va al portal—: es el paso previo a borrar
   * la cuenta.
   *
   * La Plaza borra en cascada y sin marcha atrás. Si alguien borra su cuenta
   * con una suscripción viva, le siguen cobrando cada mes y ya no queda una
   * sola fila que relacione ese cobro con nadie. Por eso esto va ANTES, y si
   * falla no se borra nada.
   */
  function cancelarAntesDeBorrar() {
    /* Lo que cobra Apple no se cancela desde aquí. La pantalla de borrar ya
       se lo dijo a la persona y le dio el botón; no hay nada más que hacer. */
    if (origen() === 'apple') return Promise.resolve({ ok: true, apple: true });
    return pide('cancelar', {}).then(function (r) {
      if (r && r.ok) olvidar();
      return r;
    });
  }

  /* ==================================================================
     LO QUE SE LE DICE AL USUARIO CUANDO FALLA

     En voz de Chispa. Ninguna dice «servidor», ni «error», ni un número.
     ================================================================== */

  var EXCUSAS = {
    'sin-red':      'No tengo conexión ahora mismo. Lo intento luego.',
    'lento':        'La conexión va lenta. Vuelve a intentarlo.',
    'sin-servidor': 'Impulso todavía no está abierto.',
    'sin-sesion':   'Tengo que pedirte el correo otra vez.',
    'sin-cobro':    'Impulso todavía no está abierto.',
    'ya-tiene':     'Ya tienes Impulso.',
    'sin-pago':     'Todavía no hay ningún cobro que gestionar.',
    'limite':       'Vas muy rápido. Espera un momento.',
    'sin-base':     'Esto no está disponible ahora mismo.',
    'pendiente':    'Tu compra está esperando permiso. Te aviso en cuanto llegue.',
    'sin-confirmar': 'Ya quedó pagado. En cuanto haya conexión, lo activo.',
    'apple':        'Apple no pudo terminar la compra. No se te cobró nada.'
  };

  function excusa(r) {
    if (!r) return EXCUSAS['sin-red'];
    if (r.mensaje) return String(r.mensaje);
    return EXCUSAS[r.error] || 'Algo no salió bien. Vuelve a intentarlo.';
  }

  w.Impulso = {
    activo: activo,
    hasta: hasta,
    sabido: sabido,
    origen: origen,
    existe: existe,
    disponible: disponible,
    conApple: function () { return !!compras(); },
    precio: precio,
    arrancar: arrancar,
    refrescar: refrescar,
    olvidar: olvidar,
    comprar: comprar,
    comprarApple: comprarApple,
    restaurar: restaurar,
    gestionarApple: gestionarApple,
    portal: portal,
    cancelarAntesDeBorrar: cancelarAntesDeBorrar,
    alCambiar: alCambiar,
    excusa: excusa,
    // Solo para tools/check-impulso.js: verificar un pase suelto.
    __verificar: verificar,
    LLAVES: LLAVES
  };
})(window);
