/* ==========================================================================
   EMPRENDO IMPULSO · el Worker que cobra

   POR QUÉ ESTE WORKER EXISTE Y NO ES UNA OPERACIÓN MÁS DE LA PLAZA

   El Worker de la Plaza comprueba la cabecera `Origin` contra una lista
   blanca ANTES de mirar nada más, y devuelve 403 a todo lo que no venga de
   ahí. Esa comprobación no es un detalle: es el modelo de seguridad entero de
   la Plaza, porque la sesión viaja dentro del cuerpo y no en una cabecera de
   autorización.

   Un aviso de pago no manda `Origin`. Lo manda un servidor de Stripe, no un
   navegador. Meter el webhook en la Plaza obligaría a abrir un agujero en esa
   única comprobación, y ese es el cambio de más riesgo que se le puede hacer
   a este proyecto.

   Así que el dinero vive aparte, con su propia puerta, y la Plaza no se toca.
   Comparten la MISMA base D1 —el plan es una columna de `cuenta`— pero no
   comparten código ni despliegue.

   LAS DOS PUERTAS

     POST /webhook   Lo llama Stripe. No hay Origin ni sesión: se autentica
                     con la firma HMAC del cuerpo. Es la única ruta del
                     proyecto que acepta una petición sin lista blanca de
                     origen, y por eso no toca NADA que no venga firmado.

     POST /          Lo llama la app. Origin en lista blanca + sesión de la
                     Plaza dentro del cuerpo, igual que la Plaza. Cuatro
                     operaciones: pase, checkout, portal y cancelar.

   EL PASE

   La app funciona sin conexión: no puede preguntar «¿este ha pagado?» en cada
   arranque, porque quien la abre en el metro se quedaría sin lo que pagó. Y
   no puede guardar `plan: 'impulso'` a secas, porque el estado de la app es
   un JSON de localStorage que su propio importador bendice sin lista blanca.

   Por eso este Worker firma. Devuelve un pase —cuenta, plan y hasta cuándo—
   con una firma ECDSA P-256 que la app verifica con la clave pública, sin
   red y en un milisegundo. Un pase editado a mano no verifica.

   Lo que esto NO resuelve, y está aceptado: la app es JavaScript que se
   descarga entero, así que quien sepa parchearla se lo salta siempre. Eso no
   tiene solución en una app así, y perseguirlo solo estorba a quien paga. Lo
   que se cierra es el fraude real: cambiar un valor en el almacenamiento.
   ========================================================================== */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

/* Cuánto vale un pase antes de que la app tenga que pedir otro. Corto a
   propósito: es la ventana en la que alguien que dejó de pagar conserva lo
   que dejó de pagar. Se renueva sola en cuanto hay red, así que este número
   solo lo nota quien está sin conexión. */
const VIDA_PASE = 3 * 24 * 60 * 60 * 1000;      // 3 días

/* Margen que se le regala a un pase por encima del fin del periodo. Es lo que
   evita que a alguien se le apague Impulso a mitad de una lección en el metro
   el día que le tocaba renovar. */
const GRACIA = 3 * 24 * 60 * 60 * 1000;         // 3 días

/* Stripe firma con el instante incluido. Más viejo que esto y no se acepta,
   aunque la firma cuadre: si no, un aviso capturado hace un mes se puede
   reenviar tal cual. */
const TOLERANCIA_FIRMA = 5 * 60 * 1000;         // 5 minutos

const STRIPE_API = 'https://api.stripe.com/v1/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      const permitido = origenPermitido(request.headers.get('Origin') || '', env);
      return new Response(null, { status: 204, headers: cors(permitido) });
    }
    if (request.method !== 'POST') {
      return new Response('Solo POST.', { status: 405 });
    }
    if (!env.DB) {
      return responder({ error: 'sin-base', mensaje: 'El pago no está disponible ahora mismo.' }, 503, null);
    }

    /* ---------------------------------------------------- el webhook --
       Va antes que el guardia de origen a propósito: esta ruta no tiene
       origen que comprobar. Lo que la protege es la firma, y si falta el
       secreto para comprobarla, no se procesa nada. Un webhook que "se cree"
       lo que le llega porque el secreto no está puesto es peor que no tener
       webhook: cualquiera podría regalarse Impulso con un `curl`. */
    if (url.pathname === '/webhook') {
      if (!env.STRIPE_WHSEC) {
        console.error('pago: falta STRIPE_WHSEC');
        return new Response('sin secreto', { status: 503 });
      }
      return webhook(request, env);
    }

    /* ---------------------------------------------------- la app --- */
    const permitido = origenPermitido(request.headers.get('Origin') || '', env);
    if (!permitido) {
      return responder({ error: 'Origen no permitido.' }, 403, null);
    }
    if (!env.PASE_JWK) {
      console.error('pago: falta PASE_JWK');
      return responder({ error: 'sin-base', mensaje: 'El pago no está disponible ahora mismo.' }, 503, permitido);
    }

    if (env.LIMITE_IP) {
      const ip = request.headers.get('CF-Connecting-IP') || 'sin-ip';
      const { success } = await env.LIMITE_IP.limit({ key: ip });
      if (!success) {
        return responder({ error: 'limite', mensaje: 'Vas muy rápido. Espera un minuto.' }, 429, permitido);
      }
    }

    if (Number(request.headers.get('content-length') || 0) > 8192) {
      return responder({ error: 'grande', mensaje: 'Eso es demasiado largo.' }, 413, permitido);
    }

    let cuerpo;
    try { cuerpo = await request.json(); }
    catch (e) { return responder({ error: 'JSON inválido.' }, 400, permitido); }
    if (!cuerpo || typeof cuerpo !== 'object') {
      return responder({ error: 'JSON inválido.' }, 400, permitido);
    }

    /* hasOwnProperty y no OPS[op] a secas, por lo mismo que en la Plaza:
       op = "constructor" devuelve una función y se cuela por el guardia. */
    const op = String(cuerpo.op || '');
    const fn = Object.prototype.hasOwnProperty.call(OPS, op) ? OPS[op] : null;
    if (typeof fn !== 'function') {
      return responder({ error: 'Operación desconocida.' }, 400, permitido);
    }

    try {
      const salida = await fn(cuerpo, env, request);
      return responder(salida, salida && salida.error ? (salida.status || 400) : 200, permitido);
    } catch (e) {
      /* Al cliente nunca le llega el detalle: los errores de Stripe citan
         identificadores de cliente y de suscripción. Al registro sí, porque
         sin eso un 500 mudo no se diagnostica. */
      console.error('pago:', op, String((e && e.message) || (e && e.name) || 'error'));
      return responder({ error: 'fallo', mensaje: 'Algo salió mal. Inténtalo otra vez.' }, 500, permitido);
    }
  }
};

/* ==========================================================================
   IDENTIDAD

   Copia corta de quienEs() de la Plaza. Es duplicación, sí, y es deliberada:
   son dos Workers que se despliegan por separado, y compartir código entre
   ellos significaría un paso de compilación que este proyecto no tiene.

   Lo que se copia son doce líneas de SELECT. Lo que NO se copia es ninguna
   decisión: aquí no se crean cuentas, no se mandan correos y no se tocan
   sesiones. Solo se pregunta quién llama.
   ========================================================================== */

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** La cuenta detrás de una sesión, con su plan, o null. */
async function quienEs(cuerpo, env) {
  const token = String((cuerpo && cuerpo.sesion) || '');
  if (token.length < 20 || token.length > 100) return null;

  const fila = await env.DB.prepare(
    `SELECT c.id, c.estado, c.plan, c.plan_hasta, c.pago_cliente, c.pago_sub
       FROM sesion s JOIN cuenta c ON c.id = s.cuenta_id
      WHERE s.token_hash = ? AND s.caduca > ?`
  ).bind(await sha256(token), Date.now()).first();

  if (!fila || fila.estado !== 'activa') return null;
  return fila;
}

function noAutorizado() {
  return { error: 'sin-sesion', mensaje: 'Vuelve a entrar con tu correo.', status: 401 };
}

/* ==========================================================================
   EL PASE

   Formato: dos trozos separados por un punto, los dos en base64url.

     datos.firma

   `datos` es un JSON con cinco claves cortas —van a viajar y a guardarse en
   un teléfono— y `firma` es ECDSA P-256 sobre el texto de `datos` tal cual
   se transmite, no sobre el objeto: firmar el objeto obligaría a que las dos
   partes serializaran igual, y eso es una fuente de fallos silenciosos.

   ECDSA P-256 y no Ed25519, que sería más corto y más limpio: Ed25519 en
   `crypto.subtle` no existe en Safari antiguo ni en Chrome anterior al 137, y
   esta app se abre en teléfonos viejos. P-256 lo entiende todo lo que puede
   ejecutar la app.
   ========================================================================== */

let clavePrivada = null;

async function claveFirma(env) {
  if (clavePrivada) return clavePrivada;
  const jwk = JSON.parse(env.PASE_JWK);
  clavePrivada = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  return clavePrivada;
}

function b64url(bytes) {
  let s = '';
  const a = new Uint8Array(bytes);
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlTexto(texto) {
  return b64url(new TextEncoder().encode(texto));
}

/**
 * Firma un pase para esta cuenta con lo que diga la base AHORA.
 *
 * `hasta` es el mínimo entre dos cosas: hasta cuándo está pagado (más la
 * gracia) y cuánto vale un pase. Lo primero evita que un pase sobreviva a la
 * suscripción; lo segundo, que un pase sobreviva a la conexión. Sin el
 * mínimo, alguien que paga un año y se queda sin datos llevaría encima un
 * pase de un año que nadie puede revocar.
 */
async function firmarPase(cuenta, env) {
  const ahora = Date.now();
  const pagadoHasta = Number(cuenta.plan_hasta || 0);
  const activo = cuenta.plan === 'impulso' && pagadoHasta + GRACIA > ahora;

  const datos = {
    v: 1,
    c: String(cuenta.id),
    p: activo ? 'impulso' : 'gratis',
    // Hasta cuándo vale ESTE pase.
    h: activo ? Math.min(pagadoHasta + GRACIA, ahora + VIDA_PASE) : ahora,
    // Hasta cuándo está pagado. Es lo que la app enseña; `h` es interno.
    f: pagadoHasta,
    e: ahora
  };

  const texto = b64urlTexto(JSON.stringify(datos));
  const firma = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    await claveFirma(env),
    new TextEncoder().encode(texto)
  );
  return texto + '.' + b64url(firma);
}

/* ==========================================================================
   STRIPE
   ========================================================================== */

/** Un objeto plano a `a[b][c]=v`, que es lo único que come la API de Stripe. */
function aFormulario(obj, prefijo, salida) {
  salida = salida || new URLSearchParams();
  for (const k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    const v = obj[k];
    if (v === undefined || v === null || v === '') continue;
    const clave = prefijo ? prefijo + '[' + k + ']' : k;
    if (typeof v === 'object') aFormulario(v, clave, salida);
    else salida.append(clave, String(v));
  }
  return salida;
}

async function stripe(env, ruta, datos, metodo) {
  const res = await fetch(STRIPE_API + ruta, {
    method: metodo || (datos ? 'POST' : 'GET'),
    headers: {
      'Authorization': 'Bearer ' + env.STRIPE_SK,
      'Content-Type': 'application/x-www-form-urlencoded',
      /* Sin esto, el día que Stripe cambie de versión por defecto cambian las
         formas que se leen abajo y el webhook empieza a guardar fechas
         vacías sin que nada falle. */
      'Stripe-Version': '2024-06-20'
    },
    body: datos ? aFormulario(datos).toString() : undefined
  });
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (j && j.error && j.error.message) || ('HTTP ' + res.status);
    throw new Error('stripe ' + ruta + ': ' + msg);
  }
  return j;
}

/** Comparación en tiempo constante. Con `===` sobre cadenas, el tiempo que
    tarda en fallar dice cuántos caracteres acertó quien lo intenta. */
function igualLento(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

async function firmaValida(cuerpoTexto, cabecera, secreto) {
  const partes = String(cabecera || '').split(',');
  let t = '', v1 = [];
  for (const p of partes) {
    const i = p.indexOf('=');
    if (i < 0) continue;
    const k = p.slice(0, i).trim(), v = p.slice(i + 1).trim();
    if (k === 't') t = v;
    if (k === 'v1') v1.push(v);
  }
  if (!t || !v1.length) return false;

  const cuando = Number(t) * 1000;
  if (!isFinite(cuando) || Math.abs(Date.now() - cuando) > TOLERANCIA_FIRMA) return false;

  const clave = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(t + '.' + cuerpoTexto));
  const esperado = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');

  /* Stripe manda varias v1 mientras se rota el secreto. Basta con que una
     cuadre, y se comprueban TODAS aunque la primera acierte: salir antes
     vuelve a filtrar tiempo. */
  let vale = false;
  for (const f of v1) if (igualLento(f, esperado)) vale = true;
  return vale;
}

/** Lee el fin del periodo de una suscripción, mire donde mire Stripe.
    Cambió de sitio entre versiones de la API: antes colgaba de la
    suscripción, ahora de cada línea. Se leen las dos y gana la que exista. */
function finDePeriodo(sub) {
  if (!sub) return 0;
  if (sub.current_period_end) return Number(sub.current_period_end) * 1000;
  const linea = sub.items && sub.items.data && sub.items.data[0];
  if (linea && linea.current_period_end) return Number(linea.current_period_end) * 1000;
  return 0;
}

const VIVAS = ['active', 'trialing', 'past_due'];

/** Escribe en la base lo que diga Stripe de esta suscripción. Es el único
    sitio que decide si alguien tiene Impulso, y por eso lo llaman todos los
    caminos: el webhook, el checkout y la cancelación. */
async function anotar(env, cuentaId, sub) {
  const fin = finDePeriodo(sub);
  const viva = sub && VIVAS.indexOf(sub.status) >= 0;

  /* `past_due` cuenta como viva a propósito: a quien le falló la tarjeta,
     Stripe le reintenta varios días. Quitarle Impulso el primer día es
     castigar un banco que se puso tonto. Si acaba cancelándose, llega
     `customer.subscription.deleted` y entonces sí. */
  await env.DB.prepare(
    `UPDATE cuenta SET plan = ?, plan_hasta = ?, pago_cliente = ?, pago_sub = ? WHERE id = ?`
  ).bind(
    viva ? 'impulso' : 'gratis',
    viva ? fin : 0,
    String((sub && sub.customer) || ''),
    String((sub && sub.id) || ''),
    cuentaId
  ).run();
}

/* ==========================================================================
   EL WEBHOOK

   Devuelve 200 en cuanto la firma cuadra, incluso para eventos que no
   interesan. Un 4xx hace que Stripe reintente el mismo aviso durante días y
   acabe desactivando el punto de entrada.
   ========================================================================== */

async function webhook(request, env) {
  const texto = await request.text();
  if (texto.length > 262144) return new Response('grande', { status: 413 });

  if (!await firmaValida(texto, request.headers.get('Stripe-Signature'), env.STRIPE_WHSEC)) {
    /* 400 y no 403: para Stripe significa "no lo entendí", y es lo que hay
       que devolver cuando la firma no cuadra. */
    return new Response('firma', { status: 400 });
  }

  let evento;
  try { evento = JSON.parse(texto); } catch (e) { return new Response('json', { status: 400 }); }

  const tipo = String(evento.type || '');
  const obj = (evento.data && evento.data.object) || {};

  try {
    /* De qué cuenta habla este aviso. Tres caminos, del más fiable al menos:
       lo que pusimos nosotros al crear el pago, lo que Stripe copió a la
       suscripción, y el cliente ya guardado en la base. */
    let cuentaId =
      String(obj.client_reference_id || '') ||
      String((obj.metadata && obj.metadata.cuenta) || '');

    let subId = String(obj.subscription || (obj.object === 'subscription' ? obj.id : '') || '');

    if (!cuentaId) {
      const cliente = String(obj.customer || '');
      if (cliente) {
        const fila = await env.DB.prepare(
          `SELECT id FROM cuenta WHERE pago_cliente = ?`
        ).bind(cliente).first();
        if (fila) cuentaId = fila.id;
      }
    }

    if (!cuentaId || !subId) {
      /* No es un error: la mayoría de los avisos de Stripe no van con
         nosotros. Se acepta y se calla. */
      return new Response('ok', { status: 200 });
    }

    /* Se vuelve a pedir la suscripción a Stripe en vez de leerla del aviso.
       Cuesta una llamada y quita de encima todo el adivinar formas: los
       avisos llegan desordenados y uno viejo puede pisar a uno nuevo. Lo que
       diga Stripe AHORA es lo que se guarda. */
    const sub = await stripe(env, 'subscriptions/' + encodeURIComponent(subId));
    await anotar(env, cuentaId, sub);

    console.log('pago: ' + tipo + ' -> ' + (sub.status || '?'));
  } catch (e) {
    /* Se registra y se devuelve 200 igual. Si esto se cae por un fallo
       nuestro, que Stripe reintente no lo arregla: repetiría el mismo error
       durante tres días. El estado se recompone solo en el aviso siguiente,
       porque `anotar()` siempre escribe lo que Stripe dice ahora. */
    console.error('pago: webhook ' + tipo + ': ' + String((e && e.message) || e));
  }

  return new Response('ok', { status: 200 });
}

/* ==========================================================================
   LAS OPERACIONES DE LA APP
   ========================================================================== */

const OPS = {

  /* ------------------------------------------------------------ pase --
     La única que la app llama sola, en silencio, cada vez que arranca con
     red. Devuelve el pase firmado y nada más: ni correo, ni tarjeta, ni
     identificadores de Stripe. */
  async pase(cuerpo, env) {
    const cuenta = await quienEs(cuerpo, env);
    if (!cuenta) return noAutorizado();
    return { ok: true, pase: await firmarPase(cuenta, env) };
  },

  /* -------------------------------------------------------- checkout --
     Devuelve la dirección de Stripe donde se paga. No cobra nada: cobrar es
     de Stripe, y esa es justamente la razón de usarlo — así por aquí no pasa
     jamás un número de tarjeta. */
  async checkout(cuerpo, env, peticion) {
    const cuenta = await quienEs(cuerpo, env);
    if (!cuenta) return noAutorizado();

    if (!env.STRIPE_SK || !env.STRIPE_PRECIO) {
      console.error('pago: falta STRIPE_SK o STRIPE_PRECIO');
      return { error: 'sin-cobro', mensaje: 'El pago todavía no está abierto.', status: 503 };
    }

    /* Ya lo tiene. No se le manda a pagar otra vez: se le manda al portal,
       que es donde se cambia o se cancela. */
    if (cuenta.plan === 'impulso' && Number(cuenta.plan_hasta || 0) > Date.now()) {
      return { error: 'ya-tiene', mensaje: 'Ya tienes Impulso.', status: 409 };
    }

    const base = baseDelOrigen(peticion.headers.get('Origin') || '', env);
    if (!base) return { error: 'origen', status: 403 };

    const sesion = await stripe(env, 'checkout/sessions', {
      mode: 'subscription',
      'line_items': { 0: { price: env.STRIPE_PRECIO, quantity: 1 } },
      success_url: base + '/?impulso=ok',
      cancel_url: base + '/?impulso=no',
      /* Los dos, y no uno: `client_reference_id` viaja en el aviso del
         checkout, y la copia en metadata viaja en los de la suscripción, que
         son los que llegan cada mes. Con solo el primero, la renovación del
         mes que viene no sabría de quién es. */
      client_reference_id: cuenta.id,
      'subscription_data': { metadata: { cuenta: cuenta.id } },
      /* Si ya fue cliente alguna vez, se reutiliza: si no, Stripe crea uno
         nuevo cada vez que alguien se lo piensa dos veces, y la base acaba
         con clientes huérfanos que nadie puede juntar. */
      customer: cuenta.pago_cliente || undefined,
      allow_promotion_codes: true,
      locale: 'es'
    });

    return { ok: true, url: sesion.url };
  },

  /* ---------------------------------------------------------- portal --
     Cancelar, cambiar la tarjeta y ver los recibos. Todo eso lo hace Stripe
     en su propia página: escribirlo aquí sería reimplementar una pantalla de
     facturación para no ganar nada. */
  async portal(cuerpo, env, peticion) {
    const cuenta = await quienEs(cuerpo, env);
    if (!cuenta) return noAutorizado();
    if (!cuenta.pago_cliente) {
      return { error: 'sin-pago', mensaje: 'Todavía no tienes ningún cobro.', status: 409 };
    }

    const base = baseDelOrigen(peticion.headers.get('Origin') || '', env);
    const s = await stripe(env, 'billing_portal/sessions', {
      customer: cuenta.pago_cliente,
      return_url: (base || '') + '/?impulso=vuelta',
      locale: 'es'
    });
    return { ok: true, url: s.url };
  },

  /* -------------------------------------------------------- cancelar --
     No es el botón de cancelar de la pantalla —ese va al portal—: es el paso
     previo a borrar la cuenta.

     La Plaza borra de verdad y en cascada. Si alguien borra su cuenta con una
     suscripción viva, Stripe le sigue cobrando cada mes y ya no queda ni una
     fila que relacione ese cobro con nadie. Por eso la app llama a esto
     ANTES de borrar, y si esto falla, no borra. */
  async cancelar(cuerpo, env) {
    const cuenta = await quienEs(cuerpo, env);
    if (!cuenta) return noAutorizado();

    if (cuenta.pago_sub) {
      try {
        await stripe(env, 'subscriptions/' + encodeURIComponent(cuenta.pago_sub), null, 'DELETE');
      } catch (e) {
        /* Que ya no exista no es un fallo: es el estado que se buscaba. */
        const msg = String((e && e.message) || '');
        if (!/No such subscription|resource_missing/i.test(msg)) throw e;
      }
    }

    await env.DB.prepare(
      `UPDATE cuenta SET plan = 'gratis', plan_hasta = 0, pago_sub = '' WHERE id = ?`
    ).bind(cuenta.id).run();

    return { ok: true };
  }
};

/* ==========================================================================
   ORIGEN Y RESPUESTA

   Mismo criterio que la Plaza, y a propósito misma forma: la lista lleva la
   dirección COMPLETA con su carpeta, porque la cabecera `Origin` nunca lleva
   ruta y de esa lista sale también la dirección a la que vuelve Stripe. En
   GitHub Pages, volver a la raíz del dominio es un 404.
   ========================================================================== */

function baseDelOrigen(origen, env) {
  if (!origen) return null;
  const lista = String(env.ORIGENES || '').split(',').map(s => s.trim()).filter(Boolean);
  for (let i = 0; i < lista.length; i++) {
    try {
      if (new URL(lista[i]).origin === origen) return lista[i].replace(/\/+$/, '');
    } catch (e) { /* una entrada mal escrita no puede tumbar la comprobación */ }
  }
  return null;
}

function origenPermitido(origen, env) {
  const base = baseDelOrigen(origen, env);
  if (!base) return null;
  try { return new URL(base).origin; } catch (e) { return null; }
}

function cors(origen) {
  return {
    'Access-Control-Allow-Origin': origen || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function responder(datos, status, origen) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { ...JSON_HEADERS, ...cors(origen), 'Cache-Control': 'no-store' }
  });
}
