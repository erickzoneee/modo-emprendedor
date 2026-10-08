/* ==========================================================================
   VERIFICADOR DEL PASE DE IMPULSO

   El pase es lo único que separa «pagó» de «dice que pagó». Si su
   comprobación se rompe, no falla nada visible: la app sigue arrancando y
   todo el mundo sigue viendo sus lecciones. Lo que pasa es que Impulso deja
   de valer dinero, o —peor— que a quien pagó se le apaga sin motivo.

   Este script firma pases DE VERDAD con la misma criptografía que usa el
   Worker (`crypto.subtle`, ECDSA P-256, la misma que trae Node) y los pasa
   por la función de verificación real de js/core/impulso.js. No hay dobles:
   lo que se prueba es el código que se despliega.

   LO QUE ATRAPA

   1. Un pase bien firmado y en fecha se acepta.
   2. Un pase MANIPULADO —un byte cambiado en los datos o en la firma— se
      rechaza. Es el fraude que puede hacer cualquiera con las herramientas
      del navegador abiertas.
   3. Un pase CADUCADO se rechaza aunque la firma sea buena. Es lo que hace
      que dejar de pagar tenga efecto sin depender de que haya conexión.
   4. Un pase firmado con OTRA llave se rechaza. Sin esto, cualquiera podría
      montarse su propio par y regalarse Impulso.
   5. Basura —vacío, sin punto, base64 roto— se rechaza sin lanzar. Esta
      función corre en el arranque de la app: si lanza, no arranca nadie.
   6. Un pase que dice 'gratis' no da Impulso, aunque verifique.
   7. El Worker comprueba la fecha en cada petición y no solo la escribe.
      Esta base ya tiene una columna que se guarda y no se lee nunca
      (`edad_ok`) y ese error no se repite.
   8. La llave PRIVADA no está en el repositorio. Es la comprobación más
      tonta de todas y la que más cara saldría.

   Uso:
     node tools/check-impulso.js
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');
var { webcrypto } = require('crypto');

var raiz = path.join(__dirname, '..');
var fallos = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

/* ==========================================================================
   MONTAR js/core/impulso.js EN NODE

   Es un IIFE que se cuelga de window y necesita cuatro cosas del navegador:
   crypto.subtle, atob, btoa y TextEncoder. Node las tiene todas; solo hay
   que ponérselas delante con los nombres que espera.
   ========================================================================== */

function montar(llavesPublicas) {
  var ventana = {
    crypto: webcrypto,
    atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); },
    btoa: function (s) { return Buffer.from(s, 'binary').toString('base64'); },
    TextEncoder: TextEncoder,
    localStorage: {
      _d: {},
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
      setItem: function (k, v) { this._d[k] = String(v); },
      removeItem: function (k) { delete this._d[k]; }
    },
    fetch: function () { return Promise.reject(new Error('sin red en el verificador')); },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    BRAND: { claves: { impulso: 'test:impulso' }, dominios: { pago: 'https://pago.ejemplo' } },
    Plaza: { sesion: function () { return ''; }, salir: function () {} }
  };

  new Function('window', leer('js/core/impulso.js'))(ventana);

  // Las llaves se inyectan ANTES de que nada verifique, que es lo que hace
  // la app de verdad al arrancar: la caché de importación es perezosa.
  llavesPublicas.forEach(function (k) { ventana.Impulso.LLAVES.push(k); });

  return ventana;
}

/* ==========================================================================
   FIRMAR COMO LO HACE EL WORKER

   Copiado a mano de worker-pago/src/index.js, y a propósito: si el formato
   del pase cambia allí y no aquí, este script deja de cuadrar y eso es
   exactamente lo que tiene que pasar.
   ========================================================================== */

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function nuevoPar() {
  var par = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']
  );
  var pub = await webcrypto.subtle.exportKey('jwk', par.publicKey);
  return {
    privada: par.privateKey,
    publica: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y, key_ops: ['verify'], ext: true }
  };
}

async function firmar(privada, datos) {
  var texto = b64url(Buffer.from(JSON.stringify(datos), 'utf8'));
  var firma = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, privada,
    new TextEncoder().encode(texto)
  );
  return texto + '.' + b64url(new Uint8Array(firma));
}

/* ==========================================================================
   LAS PRUEBAS
   ========================================================================== */

async function pases() {
  var par = await nuevoPar();
  var otro = await nuevoPar();
  var W = montar([par.publica]);
  var V = W.Impulso.__verificar;

  var ahora = Date.now();
  var dia = 24 * 60 * 60 * 1000;

  function base(extra) {
    var d = { v: 1, c: 'cuenta-de-prueba', p: 'impulso', h: ahora + 3 * dia, f: ahora + 27 * dia, e: ahora };
    for (var k in (extra || {})) d[k] = extra[k];
    return d;
  }

  // 1 · el bueno
  var bueno = await firmar(par.privada, base());
  var r = await V(bueno);
  if (!r) fallos.push('un pase bien firmado y en fecha NO se acepta');
  else if (r.p !== 'impulso') fallos.push('el pase bueno se leyó mal: p = ' + r.p);

  // 2 · manipulado: la firma
  var firmaRota = bueno.slice(0, -6) + 'AAAAAA';
  if (await V(firmaRota)) fallos.push('un pase con la FIRMA cambiada se acepta');

  // 2b · manipulado: los datos. Se cambia el plan y se deja la firma buena,
  // que es exactamente lo que haría alguien editando el almacenamiento.
  var trozos = bueno.split('.');
  var datosFalsos = b64url(Buffer.from(JSON.stringify(base({ h: ahora + 3650 * dia })), 'utf8'));
  if (await V(datosFalsos + '.' + trozos[1])) {
    fallos.push('un pase con los DATOS cambiados y la firma original se acepta');
  }

  // 3 · caducado
  var caducado = await firmar(par.privada, base({ h: ahora - 1000 }));
  if (await V(caducado)) fallos.push('un pase caducado se acepta');

  // 3b · justo en el filo. `h` igual a ahora tiene que caducar: el corte es
  // estricto para que un pase no pueda quedarse vivo por un milisegundo.
  var alFilo = await firmar(par.privada, base({ h: Date.now() }));
  if (await V(alFilo)) fallos.push('un pase que caduca exactamente ahora se acepta');

  // 4 · otra llave
  var ajeno = await firmar(otro.privada, base());
  if (await V(ajeno)) fallos.push('un pase firmado con OTRA llave se acepta');

  // 5 · basura, sin lanzar
  var basuras = ['', '.', 'hola', 'hola.mundo', 'a.b.c', '...', null, undefined, '%%%.%%%'];
  for (var i = 0; i < basuras.length; i++) {
    var res;
    try { res = await V(basuras[i]); }
    catch (e) { fallos.push('verificar(' + JSON.stringify(basuras[i]) + ') LANZÓ: ' + e.message); continue; }
    if (res) fallos.push('verificar(' + JSON.stringify(basuras[i]) + ') devolvió algo');
  }

  // 6 · un pase 'gratis' verifica pero no da Impulso
  var gratis = await firmar(par.privada, base({ p: 'gratis' }));
  var rg = await V(gratis);
  if (!rg) fallos.push('un pase «gratis» bien firmado no verifica: el servidor no podría apagar Impulso');
  W.localStorage.setItem('test:impulso', gratis);
  await W.Impulso.arrancar();
  if (W.Impulso.activo()) fallos.push('un pase que dice «gratis» enciende Impulso');

  // 6b · y el bueno sí lo enciende, entrando por donde entra en la app
  W.localStorage.setItem('test:impulso', bueno);
  await W.Impulso.arrancar();
  if (!W.Impulso.activo()) fallos.push('un pase bueno guardado no enciende Impulso al arrancar');
  if (W.Impulso.hasta() !== ahora + 27 * dia) {
    fallos.push('hasta() no devuelve la fecha pagada sino ' + W.Impulso.hasta());
  }

  // 6c · sin llaves configuradas, Impulso no existe. Es el estado de hoy.
  var Vacio = montar([]);
  if (Vacio.Impulso.disponible()) {
    fallos.push('sin ninguna llave pública, disponible() dice que sí');
  }

  return true;
}

/* ==========================================================================
   7 · EL WORKER COMPRUEBA LA FECHA, NO SOLO LA ESCRIBE
   ========================================================================== */

function workerComprueba() {
  var src = leer('worker-pago/src/index.js');

  if (!/plan_hasta/.test(src)) {
    fallos.push('worker-pago no menciona plan_hasta por ningún lado');
    return;
  }
  /* La comprobación de verdad: que en algún sitio se compare la fecha contra
     el reloj antes de firmar. Sin esto, el pase se emitiría igual para quien
     dejó de pagar hace un año. */
  if (!/plan_hasta[\s\S]{0,200}Date\.now\(\)|activo\s*=[\s\S]{0,160}ahora/.test(src)) {
    fallos.push('worker-pago escribe plan_hasta pero no se ve dónde lo compara con el reloj');
  }
  if (!/GRACIA/.test(src)) {
    fallos.push('worker-pago no define ningún margen de gracia: a alguien se le apagará Impulso a mitad de una lección');
  }
  /* El tope de vida del pase. Sin él, un pase emitido a alguien que paga un
     año dura un año y no hay forma de revocarlo. */
  if (!/Math\.min\(/.test(src)) {
    fallos.push('worker-pago no acota la vida del pase: un pase largo no se puede revocar');
  }
  if (!/firmaValida/.test(src) || !/Stripe-Signature/.test(src)) {
    fallos.push('worker-pago no comprueba la firma del webhook: cualquiera podría regalarse Impulso con un curl');
  }
  /* El webhook es la única ruta sin lista blanca de origen. Que no se le
     cuele nada más por ahí. */
  var m = src.match(/pathname === '\/webhook'/);
  if (!m) fallos.push('worker-pago ya no tiene una ruta /webhook separada');
}

/* ==========================================================================
   8 · LA LLAVE PRIVADA NO ESTÁ EN EL REPOSITORIO
   ========================================================================== */

function nadaDeSecretos() {
  var sospechosos = [
    'js/core/impulso.js', 'js/data/brand.js', 'js/data/config.js',
    'worker-pago/wrangler.jsonc', 'worker-pago/src/index.js'
  ];
  sospechosos.forEach(function (rel) {
    var src = leer(rel);
    /* `"d":` dentro de un JWK es la mitad privada. Es lo único que distingue
       una llave pública de una que firma. */
    if (/"kty"\s*:\s*"EC"[\s\S]{0,300}"d"\s*:/.test(src)) {
      fallos.push(rel + ' parece llevar una llave PRIVADA dentro. Sácala y rótala.');
    }
    if (/\bsk_(test|live)_[A-Za-z0-9]/.test(src)) {
      fallos.push(rel + ' lleva una clave secreta de Stripe. Sácala y rótala.');
    }
    if (/\bwhsec_[A-Za-z0-9]/.test(src)) {
      fallos.push(rel + ' lleva el secreto del webhook de Stripe. Sácalo y rótalo.');
    }
  });
}

/* ================================= Salida ================================= */

(async function () {
  try {
    await pases();
    workerComprueba();
    nadaDeSecretos();
  } catch (e) {
    console.error('✗ no se pudo comprobar el pase: ' + (e && e.stack || e));
    process.exit(1);
  }

  if (fallos.length) {
    console.error('✗ el pase de Impulso: ' + fallos.length + ' problema(s)\n');
    fallos.forEach(function (f) { console.error('  · ' + f); });
    process.exit(1);
  }

  console.log('✓ el pase de Impulso aguanta: firma buena acepta, manipulada rechaza, ' +
    'caducada rechaza, llave ajena rechaza, y ningún secreto vive en el repositorio.');
})();
