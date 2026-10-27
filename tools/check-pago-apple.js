/* ==========================================================================
   PRUEBAS DEL COBRO DE APPLE

   Ejecuta el Worker de pago de verdad —worker-pago/src/index.js— contra una
   base SQLite en memoria con las migraciones reales, y contra un Apple de
   mentira que contesta como la App Store Server API. Lo único simulado es
   Apple; todo lo demás es el código que se despliega.

   El Apple de mentira también COMPRUEBA: cada petición tiene que llegar con
   un JWT bien firmado con la llave de compras, con el emisor, la audiencia y
   el bundle correctos. Si el Worker firma mal, Apple real le contestaría
   401 y nadie podría pagar; aquí eso se pone rojo antes.

   Lo que se prueba es lo que costaría dinero o confianza si fallara:
   que se da Impulso a quien pagó y solo a quien pagó, que se quita a quien
   dejó de pagar, que una compra no se puede pegar a dos cuentas, que no se
   pisa a quien paga en la web y que un aviso inventado no cambia nada.

   Uso:
     node tools/check-pago-apple.js
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const raiz = path.join(__dirname, '..');
const fallos = [];
const hechas = [];
function comprueba(nombre, cond, detalle) {
  if (cond) hechas.push(nombre); else fallos.push(nombre + (detalle ? ' — ' + detalle : ''));
}

/* --------------------------------------------- la base, igual que la Plaza */

function haceD1(db) {
  function prepara(sql) {
    let ligados = [];
    const api = {
      bind(...a) { ligados = a; return api; },
      run() { const r = db.prepare(sql).run(...ligados); return { meta: { changes: Number(r.changes) } }; },
      first() { const r = db.prepare(sql).get(...ligados); return r === undefined ? null : r; },
      all() { return { results: db.prepare(sql).all(...ligados) }; }
    };
    return api;
  }
  return { prepare: prepara };
}

/** Varias sentencias SQL de una vez (las migraciones). */
function sqlVarias(db, texto) { return db['exec'](texto); }

function baseNueva() {
  const db = new DatabaseSync(':memory:');
  sqlVarias(db, 'PRAGMA foreign_keys = ON');
  const dir = path.join(raiz, 'worker-plaza/migrations');
  fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
    .forEach(f => sqlVarias(db, fs.readFileSync(path.join(dir, f), 'utf8')));
  return db;
}

const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const b64u = b => Buffer.from(b).toString('base64url');

/** Una cuenta con sesión, escrita a mano en la base. */
function cuentaCon(db, id, extra) {
  const ahora = Date.now();
  db.prepare(`INSERT INTO cuenta (id, correo_hash, creada, ultima, edad_ok) VALUES (?, ?, ?, ?, 1)`)
    .run(id, 'h-' + id, ahora, ahora);
  if (extra) {
    db.prepare(`UPDATE cuenta SET plan = ?, plan_hasta = ?, pago_cliente = ?, pago_sub = ? WHERE id = ?`)
      .run(extra.plan, extra.plan_hasta, extra.pago_cliente, extra.pago_sub, id);
  }
  const sesion = 's'.repeat(10) + id + 'x'.repeat(20);
  db.prepare(`INSERT INTO sesion (token_hash, cuenta_id, creada, caduca) VALUES (?, ?, ?, ?)`)
    .run(sha(sesion), id, ahora, ahora + 86400000);
  return sesion;
}

/* ---------------------------------------------------- el Apple de mentira */

const llaveCompras = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const llavePase = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const BUNDLE = 'life.emprendo.app';
const PRODUCTO = 'life.emprendo.app.impulso.mensual';

const jwsFalso = obj => b64u('{"alg":"ES256"}') + '.' + b64u(JSON.stringify(obj)) + '.firma';

/* Las compras que conoce Apple, por entorno. La llave es CUALQUIER id de
   transacción de la suscripción, como en la API de verdad. */
const apple = { produccion: {}, pruebas: {} };
let jwtsMalos = 0;
let peticionesApple = 0;
let appleRoto = false;

function suscripcion(entorno, ids, { original, estado, expira, producto, bundle, gracia }) {
  const cuerpo = {
    environment: entorno === 'produccion' ? 'Production' : 'Sandbox',
    bundleId: bundle || BUNDLE,
    data: [{
      subscriptionGroupIdentifier: '2100',
      lastTransactions: [{
        originalTransactionId: original, status: estado,
        signedTransactionInfo: jwsFalso({
          transactionId: ids[ids.length - 1], originalTransactionId: original,
          bundleId: bundle || BUNDLE, productId: producto || PRODUCTO, expiresDate: expira
        }),
        signedRenewalInfo: jwsFalso(gracia ? { gracePeriodExpiresDate: gracia } : {})
      }]
    }]
  };
  ids.forEach(id => { apple[entorno][id] = cuerpo; });
}

function jwtBueno(cab) {
  const m = String(cab || '').match(/^Bearer (.+)$/);
  if (!m) return false;
  const [h, p, f] = m[1].split('.');
  try {
    const head = JSON.parse(Buffer.from(h, 'base64url'));
    const pay = JSON.parse(Buffer.from(p, 'base64url'));
    const firma = crypto.verify('sha256', Buffer.from(h + '.' + p),
      { key: llaveCompras.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url'));
    return firma && head.alg === 'ES256' && head.kid === 'LLAVE12345' && head.typ === 'JWT' &&
      pay.iss === 'emisor-uuid' && pay.aud === 'appstoreconnect-v1' && pay.bid === BUNDLE &&
      pay.exp > pay.iat && pay.exp - pay.iat <= 3600;
  } catch (e) { return false; }
}

globalThis.fetch = async function (url, opciones) {
  const u = new URL(url);
  const entorno = u.host === 'api.storekit.apple.com' ? 'produccion'
    : u.host === 'api.storekit-sandbox.apple.com' ? 'pruebas' : null;
  if (!entorno) throw new Error('el Worker llamó a un sitio inesperado: ' + url);
  peticionesApple++;
  if (!jwtBueno(opciones && opciones.headers && opciones.headers.authorization)) {
    jwtsMalos++;
    return new Response('{"errorCode":4010000}', { status: 401 });
  }
  if (appleRoto) return new Response('{}', { status: 500 });
  const m = u.pathname.match(/^\/inApps\/v1\/subscriptions\/(\d+)$/);
  const cuerpo = m && apple[entorno][m[1]];
  if (!cuerpo) return new Response('{"errorCode":4040010}', { status: 404 });
  return new Response(JSON.stringify(cuerpo), { status: 200 });
};

/* ---------------------------------------------------------------- el pase */

function leePase(pase) {
  const [datos, firma] = String(pase || '').split('.');
  if (!datos || !firma) return null;
  const ok = crypto.verify('sha256', Buffer.from(datos),
    { key: llavePase.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(firma, 'base64url'));
  return ok ? JSON.parse(Buffer.from(datos, 'base64url')) : null;
}

/* ----------------------------------------------------------- el entorno */

const NATIVO = 'capacitor://localhost';

function entorno(db) {
  return {
    DB: haceD1(db),
    ORIGENES: 'https://erickzoneee.github.io/modo-emprendedor,' + NATIVO,
    PASE_JWK: JSON.stringify(llavePase.privateKey.export({ format: 'jwk' })),
    APPLE_IAP_KEY: llaveCompras.privateKey.export({ format: 'pem', type: 'pkcs8' }),
    APPLE_IAP_KEY_ID: 'LLAVE12345',
    APPLE_ISSUER_ID: 'emisor-uuid',
    APPLE_BUNDLE: BUNDLE,
    APPLE_PRODUCTO: PRODUCTO
  };
}

async function llama(worker, env, cuerpo, origen) {
  const texto = JSON.stringify(cuerpo);
  const res = await worker.fetch(new Request('https://pago.emprendo.life/', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(texto)),
               Origin: origen === undefined ? NATIVO : origen },
    body: texto
  }), env);
  let j = null; try { j = await res.json(); } catch (e) {}
  return { status: res.status, ...(j || {}) };
}

async function aviso(worker, env, payload) {
  const res = await worker.fetch(new Request('https://pago.emprendo.life/apple', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ signedPayload: jwsFalso(payload) })
  }), env);
  return res.status;
}

const avisoDe = (original, bundle) => ({
  notificationType: 'DID_RENEW',
  data: { bundleId: bundle || BUNDLE, signedTransactionInfo: jwsFalso({ originalTransactionId: original }) }
});

/* ============================================================ las pruebas */

async function correr() {
  const worker = (await import('file://' + path.join(raiz, 'worker-pago/src/index.js').replace(/\\/g, '/'))).default;
  const DIA = 86400000;
  const ahora = Date.now();

  suscripcion('produccion', ['1001', '1002'], { original: '1001', estado: 1, expira: ahora + 20 * DIA });
  suscripcion('produccion', ['2001'], { original: '2001', estado: 2, expira: ahora - 2 * DIA });
  suscripcion('pruebas', ['3001'], { original: '3001', estado: 1, expira: ahora + 5 * 60000 });
  suscripcion('produccion', ['4001'], { original: '4001', estado: 1, expira: ahora + 9 * DIA, bundle: 'otra.app' });
  suscripcion('produccion', ['5001'], { original: '5001', estado: 1, expira: ahora + 9 * DIA, producto: 'otra.cosa' });
  suscripcion('produccion', ['6001'], { original: '6001', estado: 4, expira: ahora - DIA, gracia: ahora + 5 * DIA });
  suscripcion('produccion', ['7001'], { original: '7001', estado: 3, expira: ahora - DIA });

  /* --------------------------------------------------- sin cuenta -- */
  {
    const env = entorno(baseNueva());
    const r = await llama(worker, env, { op: 'apple', transaccion: '1002' });
    const p = leePase(r.pase);
    comprueba('una compra viva da Impulso sin cuenta', r.ok && r.vinculada === false && p && p.p === 'impulso', JSON.stringify(r));
    comprueba('el pase sale a nombre de la compra ORIGINAL, no de la renovación', p && p.c === 'apple:1001', p && p.c);
    comprueba('el pase dice que lo cobra Apple', p && p.o === 'apple', p && p.o);
    comprueba('el pase no vive más de tres días', p && p.h <= Date.now() + 3 * DIA + 1000, p && new Date(p.h).toISOString());
    comprueba('el pase dice hasta cuándo está pagado', p && Math.abs(p.f - (ahora + 20 * DIA)) < 1000);

    const vieja = await llama(worker, env, { op: 'apple', transaccion: '2001' });
    comprueba('una suscripción vencida no da Impulso', vieja.ok && leePase(vieja.pase).p === 'gratis', JSON.stringify(vieja));

    const pruebas = await llama(worker, env, { op: 'apple', transaccion: '3001' });
    comprueba('una compra de TestFlight o de la revisión se encuentra en pruebas',
      pruebas.ok && leePase(pruebas.pase).p === 'impulso', JSON.stringify(pruebas));

    const gracia = await llama(worker, env, { op: 'apple', transaccion: '6001' });
    const pg = leePase(gracia.pase);
    comprueba('en periodo de gracia sigue con Impulso hasta que acabe la gracia',
      pg && pg.p === 'impulso' && pg.f >= ahora + 4 * DIA, JSON.stringify(pg));

    const reintento = await llama(worker, env, { op: 'apple', transaccion: '7001' });
    comprueba('en reintento de cobro sin gracia, no (Apple ya le quitó el acceso)',
      leePase(reintento.pase).p === 'gratis');

    const ajena = await llama(worker, env, { op: 'apple', transaccion: '4001' });
    comprueba('una compra de otra app no sirve', !ajena.ok && ajena.status === 400, JSON.stringify(ajena));

    const otroProd = await llama(worker, env, { op: 'apple', transaccion: '5001' });
    comprueba('una compra de otro producto no sirve', !otroProd.ok, JSON.stringify(otroProd));

    const nadie = await llama(worker, env, { op: 'apple', transaccion: '999999' });
    comprueba('una compra que Apple no conoce no sirve', !nadie.ok && nadie.status === 404, JSON.stringify(nadie));

    for (const raro of [null, '', 'abc', '12 34', '1'.repeat(40), { a: 1 }, [1]]) {
      const r2 = await llama(worker, env, { op: 'apple', transaccion: raro });
      comprueba('rechaza un número de compra raro (' + JSON.stringify(raro) + ')', !r2.ok && r2.status === 400);
    }

    const web = await llama(worker, env, { op: 'apple', transaccion: '1001' }, 'https://erickzoneee.github.io');
    comprueba('la web también puede preguntar (mismo Worker, misma lista)', web.ok, JSON.stringify(web));
    const fuera = await llama(worker, env, { op: 'apple', transaccion: '1001' }, 'https://malo.example');
    comprueba('un origen de fuera no', fuera.status === 403);
  }

  /* --------------------------------------------------- con cuenta -- */
  {
    const db = baseNueva();
    const env = entorno(db);
    const ana = cuentaCon(db, 'ana');
    const beto = cuentaCon(db, 'beto');

    const r = await llama(worker, env, { op: 'apple', transaccion: '1002', sesion: ana });
    const fila = db.prepare(`SELECT plan, plan_hasta, pago_cliente, pago_sub FROM cuenta WHERE id = 'ana'`).get();
    comprueba('con sesión, la compra se ata a la cuenta',
      r.ok && r.vinculada === true && fila.plan === 'impulso' && fila.pago_cliente === 'apple:1001' && fila.pago_sub === '1001',
      JSON.stringify(fila));
    comprueba('y el pase sale a nombre de la cuenta', leePase(r.pase).c === 'ana');

    await llama(worker, env, { op: 'apple', transaccion: '1001', sesion: beto });
    const a2 = db.prepare(`SELECT plan, pago_cliente FROM cuenta WHERE id = 'ana'`).get();
    const b2 = db.prepare(`SELECT plan, pago_cliente FROM cuenta WHERE id = 'beto'`).get();
    comprueba('una compra no puede estar en dos cuentas: pasa a la de quien la usa ahora',
      a2.plan === 'gratis' && a2.pago_cliente === '' && b2.plan === 'impulso' && b2.pago_cliente === 'apple:1001',
      JSON.stringify({ a2, b2 }));

    const can = await llama(worker, env, { op: 'cancelar', sesion: beto });
    const b3 = db.prepare(`SELECT plan FROM cuenta WHERE id = 'beto'`).get();
    comprueba('cancelar antes de borrar no finge cancelar lo que cobra Apple',
      can.ok && can.apple === true && b3.plan === 'impulso', JSON.stringify(can));

    /* Quien ya paga en la web no se pisa. */
    const caro = cuentaCon(db, 'caro', { plan: 'impulso', plan_hasta: ahora + 10 * DIA, pago_cliente: 'cus_123', pago_sub: 'sub_123' });
    const rc = await llama(worker, env, { op: 'apple', transaccion: '3001', sesion: caro });
    const c2 = db.prepare(`SELECT pago_cliente, pago_sub FROM cuenta WHERE id = 'caro'`).get();
    comprueba('a quien paga en la web no se le pisa el cobro de Stripe',
      rc.ok && c2.pago_cliente === 'cus_123' && c2.pago_sub === 'sub_123', JSON.stringify(c2));
    comprueba('y su pase dice que lo cobra la web', leePase(rc.pase).o === 'web');
  }

  /* ------------------------------------------------- `pase` y Apple -- */
  {
    const db = baseNueva();
    const env = entorno(db);
    const dani = cuentaCon(db, 'dani', { plan: 'impulso', plan_hasta: ahora - 1000, pago_cliente: 'apple:1001', pago_sub: '1001' });
    const r = await llama(worker, env, { op: 'pase', sesion: dani }, 'https://erickzoneee.github.io');
    comprueba('`pase` le pregunta a Apple si la fecha guardada ya pasó (renovación sin aviso)',
      r.ok && leePase(r.pase).p === 'impulso', JSON.stringify(leePase(r.pase)));

    const antes = peticionesApple;
    await llama(worker, env, { op: 'pase', sesion: dani }, 'https://erickzoneee.github.io');
    comprueba('y con la fecha al día no le vuelve a preguntar', peticionesApple === antes,
      (peticionesApple - antes) + ' peticiones de más');
  }

  /* ------------------------------------------------ los avisos de Apple -- */
  {
    const db = baseNueva();
    const env = entorno(db);
    cuentaCon(db, 'eva', { plan: 'impulso', plan_hasta: ahora + 20 * DIA, pago_cliente: 'apple:2001', pago_sub: '2001' });

    const otraApp = await aviso(worker, env, avisoDe('2001', 'otra.app'));
    const e1 = db.prepare(`SELECT plan FROM cuenta WHERE id = 'eva'`).get();
    comprueba('un aviso de otra app no cambia nada', otraApp === 200 && e1.plan === 'impulso');

    const antes = peticionesApple;
    const sinCuenta = await aviso(worker, env, avisoDe('1001'));
    comprueba('un aviso de una compra sin cuenta se acepta sin preguntar a Apple',
      sinCuenta === 200 && peticionesApple === antes);

    const basura = await worker.fetch(new Request('https://pago.emprendo.life/apple', {
      method: 'POST', body: 'esto no es json' }), env);
    comprueba('un aviso que no se entiende devuelve 200 (si no, Apple reintenta días)', basura.status === 200);

    const st = await aviso(worker, env, avisoDe('2001'));
    const e2 = db.prepare(`SELECT plan, plan_hasta FROM cuenta WHERE id = 'eva'`).get();
    comprueba('el aviso hace que se le pregunte a Apple, y manda lo que dice Apple',
      st === 200 && e2.plan === 'gratis' && e2.plan_hasta === 0, JSON.stringify(e2));

    appleRoto = true;
    const roto = await aviso(worker, env, avisoDe('2001'));
    appleRoto = false;
    comprueba('si Apple no contesta, se pide que reintente', roto === 503, 'devolvió ' + roto);

    const sinLlave = await worker.fetch(new Request('https://pago.emprendo.life/apple', {
      method: 'POST', body: JSON.stringify({ signedPayload: jwsFalso(avisoDe('2001')) })
    }), Object.assign(entorno(baseNueva()), { APPLE_IAP_KEY: '' }));
    comprueba('sin la llave de Apple, /apple no hace nada', sinLlave.status === 503);
  }

  {
    const env = Object.assign(entorno(baseNueva()), { APPLE_IAP_KEY_ID: '' });
    const r = await llama(worker, env, { op: 'apple', transaccion: '1001' });
    comprueba('sin las llaves de Apple, la compra dice que todavía no está abierto',
      !r.ok && r.error === 'sin-cobro', JSON.stringify(r));
  }

  comprueba('todas las peticiones a Apple llevaron un JWT bien firmado', jwtsMalos === 0, jwtsMalos + ' mal firmadas');

  /* -------------------------------------- nada secreto en el repositorio -- */
  {
    const w = fs.readFileSync(path.join(raiz, 'worker-pago/wrangler.jsonc'), 'utf8');
    comprueba('la llave de Apple no está en wrangler.jsonc', !/BEGIN PRIVATE KEY|"APPLE_IAP_KEY"\s*:/.test(w));
  }
}

correr().then(() => {
  if (fallos.length) {
    console.error('\n✗ Cobro de Apple: ' + fallos.length + ' problema(s) de ' + (fallos.length + hechas.length) + ' comprobaciones\n');
    fallos.forEach(f => console.error('  · ' + f));
    process.exit(1);
  }
  console.log('✓ Cobro de Apple: ' + hechas.length + ' comprobaciones, todas en verde.');
}).catch(e => {
  console.error('✗ las pruebas no llegaron a terminar: ' + e.message);
  console.error(e.stack);
  process.exit(1);
});
