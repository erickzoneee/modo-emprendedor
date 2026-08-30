/* ==========================================================================
   PLAZA · Worker de Cloudflare

   El sitio donde viven las vitrinas de otras personas. Es lo único de
   Emprendo que guarda datos de alguien fuera de su propio teléfono, así que
   es también lo único que puede filtrarlos. De ahí las reglas de abajo.

   VA APARTE DEL WORKER DE CHISPA A PROPÓSITO
   Chispa responde a cualquiera sin identificarse y no guarda nada; esto pide
   sesión y guarda todo. Mezclarlos en un archivo es invitar a que un día una
   ruta nueva herede el permiso equivocado. Además, si la Plaza se cae, la IA
   sigue funcionando.

   LAS SEIS REGLAS

   1. EL CORREO NO SE GUARDA. Entra, se convierte en huella con la pimienta
      del servidor, y se olvida. La base no tiene la lista de correos de
      nadie porque no se puede deshacer un sha256.

   2. UNA SOLA PUERTA. Un POST con `op` dentro del cuerpo, y no una ruta por
      operación. No es pereza: el CORS solo admite la cabecera `content-type`
      —igual que en el Worker de Chispa—, así que la sesión tiene que viajar
      en el JSON. Con una sola puerta, esa regla se cumple sola y no hay
      ninguna ruta que pueda olvidarse de comprobar la sesión.

   3. LA LISTA BLANCA SE VUELVE A APLICAR AQUÍ. La del teléfono protege al
      usuario de sí mismo. Esta protege a los demás de un cliente modificado,
      que es un cliente que existe en cuanto la app es pública.

   4. NADA DE TEXTO LIBRE ANTES DE LA ACEPTACIÓN MUTUA. Quien recibe un "veo
      valor" ve la intención y el motivo —dos claves de una lista cerrada— y
      nada más. El mensaje que el otro escribió no se le entrega hasta que
      acepta. Sin esto, "veo valor" sería un buzón abierto para cualquiera.

   5. EL CUERPO NO SE REGISTRA. Ni en logs, ni en errores, ni al fallar. La
      sesión viaja ahí dentro.

   6. BORRAR BORRA. No hay estado 'borrada'. Una fila marcada como borrada
      sigue siendo un dato de una persona que pidió que no lo fuera.

   Despliegue: ver worker-plaza/README.md
   ========================================================================== */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

/* Cuánto vive cada cosa. En milisegundos. */
const VIDA_ENLACE  = 15 * 60 * 1000;            // el enlace de entrada
const VIDA_SESION  = 30 * 24 * 60 * 60 * 1000;  // la sesión
const VENTANA_MAIL = 60 * 60 * 1000;            // ventana del límite por correo
const MAX_MAIL     = 5;                          // enlaces por correo y hora

/* Los topes de cada campo publicable. Son los mismos de js/core/plaza.js: si
   allí crecen y aquí no, el servidor recorta y el usuario ve su vitrina
   cortada sin saber por qué. Van escritos otra vez, no importados, porque
   este código no puede depender de que nadie afloje los del cliente. */
const TOPES = {
  negocio: 44, producto: 110, idea: 120, cliente: 100, problema: 120, valor: 110
};
const CAMPOS_TEXTO = ['negocio', 'producto', 'idea', 'cliente', 'problema', 'valor'];

const SECTORES = ['hechoamano', 'comida', 'servicios', 'digital', 'reventa', 'otro'];
const ETAPAS   = ['idea', 'starting', 'operating', 'growing'];

const INTENCIONES = ['probar', 'colaborar', 'opinar', 'me-sirve', 'conocer'];
const MOTIVOS = ['necesita:haciaEllos', 'necesita:haciaTi', 'mismoPublico',
                 'complementa', 'puedeProbarte', 'mismaEtapa'];

const MOTIVOS_DENUNCIA = ['suplantacion', 'ofensivo', 'spam', 'estafa', 'otro'];

const MAX_MENSAJE = 1200;   // lo que cabe en un mensaje de la conversación
const MAX_NOTA    = 500;    // la nota de una denuncia
const MAX_VECINOS = 60;     // cuántas vitrinas se mandan al teléfono de una vez

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';
    const permitido = origenPermitido(origen, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(permitido) });
    }
    if (request.method !== 'POST') {
      return responder({ error: 'Solo POST.' }, 405, permitido);
    }
    if (!permitido) {
      return responder({ error: 'Origen no permitido.' }, 403, null);
    }
    if (!env.DB) {
      return responder({ error: 'sin-base', mensaje: 'La Plaza no está disponible ahora mismo.' }, 503, permitido);
    }
    /* Sin pimienta, la huella del correo es sha256 de un texto conocido y se
       revierte con un diccionario en minutos. Poner el secreto es un paso
       manual aparte del despliegue, así que olvidarlo es fácil — y sin este
       guardia el Worker seguiría respondiendo 200 y nadie se enteraría hasta
       que fuera irreversible: cambiar la pimienta después equivale a borrar
       todas las cuentas. */
    if (!env.PIMIENTA || String(env.PIMIENTA).length < 32) {
      console.error('plaza: falta PIMIENTA o es demasiado corta');
      return responder({ error: 'sin-base', mensaje: 'La Plaza no está disponible ahora mismo.' }, 503, permitido);
    }

    /* Ráfagas por IP. Freno grueso: no identifica a nadie, solo evita que una
       sola máquina raspe el catálogo o pruebe tokens a lo bruto. */
    if (env.LIMITE_IP) {
      const ip = request.headers.get('CF-Connecting-IP') || 'sin-ip';
      const { success } = await env.LIMITE_IP.limit({ key: ip });
      if (!success) {
        return responder({ error: 'limite', mensaje: 'Vas muy rápido. Espera un minuto.' }, 429, permitido);
      }
    }

    /* Sin tope, seis campos de 10 MB son 60 MB de expresión regular por
       petición dentro de texto(). */
    if (Number(request.headers.get('content-length') || 0) > 65536) {
      return responder({ error: 'grande', mensaje: 'Eso es demasiado largo.' }, 413, permitido);
    }

    let cuerpo;
    try { cuerpo = await request.json(); }
    catch (e) { return responder({ error: 'JSON inválido.' }, 400, permitido); }

    if (!cuerpo || typeof cuerpo !== 'object') {
      return responder({ error: 'JSON inválido.' }, 400, permitido);
    }

    /* hasOwnProperty y no OPS[op] a secas. Con la busqueda directa,
       op = "constructor" devuelve el constructor de Object —que ES una
       funcion— y se cuela por el guardia de operacion desconocida:
       Object(cuerpo) devuelve el propio cuerpo, y la respuesta acaba siendo
       un eco del JSON que llegó, sesión incluida. Lo mismo con "toString" y
       "__proto__". */
    const op = String(cuerpo.op || '');
    const fn = Object.prototype.hasOwnProperty.call(OPS, op) ? OPS[op] : null;
    if (typeof fn !== 'function') {
      return responder({ error: 'Operación desconocida.' }, 400, permitido);
    }

    try {
      const salida = await fn(cuerpo, env, request);
      return responder(salida, salida && salida.error ? (salida.status || 400) : 200, permitido);
    } catch (e) {
      /* Al cliente no se le devuelve nunca el detalle. Al log sí va el
         mensaje: los de D1 citan el SQL, que es estático, y el nombre de la
         columna — nunca los parámetros ligados. Sin esto, «no such table»
         llega como un 500 mudo y no hay forma de diagnosticar el despliegue. */
      console.error('plaza:', op, String((e && e.message) || (e && e.name) || 'error'));
      return responder({ error: 'fallo', mensaje: 'Algo salió mal. Inténtalo otra vez.' }, 500, permitido);
    }
  }
};

/* ==========================================================================
   IDENTIDAD
   ========================================================================== */

/** Token opaco de 32 bytes en base64url. Es lo que viaja; su huella es lo
    que se guarda. */
function nuevoToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function nuevoId() {
  return crypto.randomUUID();
}

async function sha256(texto) {
  const datos = new TextEncoder().encode(texto);
  const buf = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** El correo, reducido a la forma que de verdad identifica un buzón.

    Sin esto, "ana+1@gmail.com" y "a.n.a@gmail.com" llegan al MISMO buzón con
    huellas distintas: son cubos de límite separados —o sea, bomba de correo
    ilimitada— y además crean cuentas duplicadas para la misma persona. */
function correoCanonico(correo) {
  const limpio = String(correo || '').trim().toLowerCase();
  const arroba = limpio.lastIndexOf('@');
  if (arroba <= 0) return limpio;

  let local = limpio.slice(0, arroba);
  let dominio = limpio.slice(arroba + 1);

  local = local.split('+')[0];                          // la etiqueta no cambia de buzón
  if (dominio === 'googlemail.com') dominio = 'gmail.com';
  if (dominio === 'gmail.com') local = local.replace(/\./g, '');
  return local + '@' + dominio;
}

/** La huella de un correo.

    PBKDF2 y no un sha256 a secas. El espacio de correos es enumerable: quien
    robe la base y la pimienta —que viven en la misma cuenta de Cloudflare—
    reconstruye el padrón entero probando una lista de correos filtrados de
    otro sitio. Con las iteraciones puestas, eso deja de ser barato.

    100.000 y ni una más: es el TECHO DURO de Workers. Con 150.000 el runtime
    devuelve «Pbkdf2 failed: iteration counts above 100000 are not supported»
    y toda la operación se cae. No es una elección de equilibrio, es el
    máximo que la plataforma permite. Para una contraseña sería poco; para
    frenar la enumeración masiva de correos es lo que hay.

    Se paga una vez por inicio de sesión, no por petición: medido en
    producción, 2 ms de CPU. Y hay que elegirlo AHORA — cambiar la derivación
    después equivale a borrar todas las cuentas, porque las huellas guardadas
    dejan de coincidir con nada. */
const ITERACIONES = 100000;

async function huellaCorreo(correo, env) {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(correoCanonico(correo)), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(env.PIMIENTA),
      iterations: ITERACIONES
    },
    material, 256
  );
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Comprobación de correo deliberadamente laxa: solo lo suficiente para no
    mandar una petición a un buzón inventado. Validar correos con precisión
    es imposible y siempre acaba rechazando direcciones legítimas. */
function pareceCorreo(s) {
  const v = String(s || '').trim();
  return v.length >= 6 && v.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(v);
}

/** La cuenta detrás de una sesión, o null. Toda operación que toque datos
    pasa por aquí; no hay otra forma de saber quién llama. */
async function quienEs(cuerpo, env) {
  const token = String((cuerpo && cuerpo.sesion) || '');
  if (token.length < 20 || token.length > 100) return null;

  const fila = await env.DB.prepare(
    `SELECT c.id, c.estado, c.edad_ok
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
   LIMPIEZA DE LO QUE SE PUBLICA
   ========================================================================== */

/* Recorta ANTES de normalizar. Al revés, el regex recorría la cadena entera
   —10 MB si el cliente quiere— para tirar el 99% justo después. El x4 deja
   margen para que el colapso de espacios no acorte de más. */
function texto(v, max) {
  return String(v == null ? '' : v).slice(0, max * 4).replace(/\s+/g, ' ').trim().slice(0, max);
}

/* Los mismos patrones que js/core/plaza.js. Repetidos aquí a propósito: si
   algún día el cliente afloja el suyo, este sigue puesto. */
const CONTACTO = [
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
  /https?:\/\//i,
  /\bwww\./i,
  /(^|\s)@[a-z0-9._-]{3,}/i,
  /\d[\d\s().-]{7,}\d/,
  /\bwh?ats?app\b/i,
  /\bteleg?ram\b/i
];

function tieneContacto(s) {
  const v = String(s || '');
  return CONTACTO.some(re => re.test(v));
}

/** La nota de una denuncia era el único texto libre del Worker que se
    saltaba el filtro de contacto. La lee una persona —quien modera—, pero no
    hay razón para dejar que alguien meta ahí un teléfono. */
function notaLimpia(v) {
  const t = texto(v, MAX_NOTA);
  return tieneContacto(t) ? '' : t;
}

/**
 * La vitrina que de verdad se guarda. Se construye campo a campo desde una
 * lista blanca: lo que el cliente mande de más no existe para esta función.
 * Devuelve null si le falta lo imprescindible.
 */
function vitrinaLimpia(entrada) {
  if (!entrada || typeof entrada !== 'object') return null;

  const v = {};
  for (const k of CAMPOS_TEXTO) {
    const t = texto(entrada[k], TOPES[k]);
    v[k] = tieneContacto(t) ? '' : t;
  }
  v.sector = SECTORES.includes(entrada.sector) ? entrada.sector : 'otro';
  v.etapa  = ETAPAS.includes(entrada.etapa) ? entrada.etapa : 'idea';

  // Sin qué haces y para quién, no hay puesto que enseñar.
  if (!v.producto && !v.idea) return null;
  if (!v.cliente) return null;
  return v;
}

/* ==========================================================================
   LAS OPERACIONES
   ========================================================================== */

const OPS = {

  /* ---------------------------------------------------------- entrar --
     Manda el enlace de acceso. Responde SIEMPRE lo mismo, exista la cuenta o
     no: si dijera "esa cuenta no existe", cualquiera podría usar esto para
     averiguar quién está en la Plaza. */
  async entrar(cuerpo, env, peticion) {
    const correo = String(cuerpo.correo || '').trim();
    const respuestaUnica = { ok: true, mensaje: 'Si ese correo es correcto, te llegará un enlace.' };

    if (!pareceCorreo(correo)) return respuestaUnica;

    const hash = await huellaCorreo(correo, env);
    const ahora = Date.now();

    /* Freno por correo, no por IP: lo que se está evitando aquí es que
       alguien use este servidor para llenarle el buzón a otra persona, y
       para eso el atacante cambia de IP sin despeinarse. */
    /* Contar y decidir en UNA sentencia. Con un SELECT y luego un UPDATE,
       treinta peticiones simultáneas leen todas «cuantos = 0», todas pasan el
       límite y todas mandan un correo: el tope de 5 se convierte en 30. */
    const p = await env.DB.prepare(
      `INSERT INTO pedido (correo_hash, cuantos, ventana) VALUES (?1, 1, ?2)
       ON CONFLICT(correo_hash) DO UPDATE SET
         cuantos = CASE WHEN pedido.ventana > ?3 THEN pedido.cuantos + 1 ELSE 1 END,
         ventana = CASE WHEN pedido.ventana > ?3 THEN pedido.ventana ELSE ?2 END
       RETURNING cuantos`
    ).bind(hash, ahora, ahora - VENTANA_MAIL).first();

    if (!p || p.cuantos > MAX_MAIL) return respuestaUnica;   // se calla y no manda nada

    const token = nuevoToken();
    await env.DB.prepare(
      `INSERT INTO enlace (token_hash, correo_hash, caduca, usado) VALUES (?, ?, ?, NULL)`
    ).bind(await sha256(token), hash, ahora + VIDA_ENLACE).run();

    /* El enlace vuelve al origen DESDE EL QUE SE PIDIÓ. Con APP_URL fijo,
       quien usa la app en GitHub Pages recibía un enlace a app.emprendo.life:
       otro origen, otro almacenamiento, otra instalación. El origen ya pasó
       por la lista blanca, así que esto no abre una redirección libre. */
    const base = origenPermitido(peticion.headers.get('Origin') || '', env);

    /* Si el envío falla, `entrar` TIENE que seguir respondiendo lo mismo. Sin
       este try, un correo rebotado devuelve 500 y uno bueno 200: eso es un
       detector de direcciones válidas montado sobre este servidor, que es
       justo lo que la respuesta única viene a evitar. */
    try {
      await mandarEnlace(correo, token, env, base);
    } catch (e) {
      console.error('plaza: correo no enviado', String((e && e.code) || (e && e.name) || 'error'));
    }
    return respuestaUnica;
  },

  /* -------------------------------------------------------- confirmar --
     Canjea el enlace por una sesión. El enlace se marca usado en la misma
     sentencia que lo lee, para que dos peticiones a la vez no puedan
     canjearlo dos veces. */
  async confirmar(cuerpo, env) {
    const token = String(cuerpo.token || '');
    if (token.length < 20 || token.length > 100) {
      return { error: 'enlace', mensaje: 'Ese enlace ya no sirve. Pide otro.', status: 400 };
    }

    const hash = await sha256(token);
    const ahora = Date.now();

    const marcado = await env.DB.prepare(
      `UPDATE enlace SET usado = ?
        WHERE token_hash = ? AND usado IS NULL AND caduca > ?`
    ).bind(ahora, hash, ahora).run();

    if (!marcado.meta || marcado.meta.changes !== 1) {
      return { error: 'enlace', mensaje: 'Ese enlace ya se usó o caducó. Pide otro.', status: 400 };
    }

    const enlace = await env.DB.prepare(
      `SELECT correo_hash FROM enlace WHERE token_hash = ?`
    ).bind(hash).first();

    /* Un solo INSERT con ON CONFLICT, no comprobar-y-luego-insertar. Abrir el
       correo casi a la vez en el móvil y en el portátil bastaba para que los
       dos vieran «no existe» y el segundo reventara contra el UNIQUE: la
       persona que estrena la app se quedaba fuera en su primer intento. */
    const cuenta = await env.DB.prepare(
      `INSERT INTO cuenta (id, correo_hash, creada, ultima, edad_ok) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(correo_hash) DO UPDATE SET ultima = excluded.ultima
       RETURNING id, estado`
    ).bind(nuevoId(), enlace.correo_hash, ahora, ahora, cuerpo.edadOk ? 1 : 0).first();

    if (!cuenta || cuenta.estado !== 'activa') {
      return { error: 'suspendida', mensaje: 'Esta cuenta está suspendida.', status: 403 };
    }

    const sesion = nuevoToken();
    await env.DB.prepare(
      `INSERT INTO sesion (token_hash, cuenta_id, creada, caduca) VALUES (?, ?, ?, ?)`
    ).bind(await sha256(sesion), cuenta.id, ahora, ahora + VIDA_SESION).run();

    return { ok: true, sesion, id: cuenta.id };
  },

  /* --------------------------------------------------------- publicar -- */
  async publicar(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    const v = vitrinaLimpia(cuerpo.vitrina);
    if (!v) {
      return { error: 'incompleta', mensaje: 'Falta qué haces o para quién.', status: 400 };
    }

    const ahora = Date.now();
    await env.DB.prepare(
      `INSERT INTO vitrina
         (cuenta_id, negocio, producto, idea, cliente, problema, valor, sector, etapa, estado, publicada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'publicada', ?)
       ON CONFLICT(cuenta_id) DO UPDATE SET
         negocio=excluded.negocio, producto=excluded.producto, idea=excluded.idea,
         cliente=excluded.cliente, problema=excluded.problema, valor=excluded.valor,
         sector=excluded.sector, etapa=excluded.etapa,
         publicada=excluded.publicada,
         -- Una vitrina que la moderación ocultó no se reabre sola al
         -- guardarla otra vez: eso convertiría el ocultar en un botón de
         -- "espera un minuto".
         estado = CASE WHEN vitrina.estado = 'oculta' THEN 'oculta' ELSE 'publicada' END`
    ).bind(yo.id, v.negocio, v.producto, v.idea, v.cliente, v.problema, v.valor,
           v.sector, v.etapa, ahora).run();

    return { ok: true };
  },

  /* ---------------------------------------------------------- retirar -- */
  async retirar(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();
    await env.DB.prepare(
      `UPDATE vitrina SET estado = 'retirada' WHERE cuenta_id = ? AND estado <> 'oculta'`
    ).bind(yo.id).run();
    return { ok: true };
  },

  /* ---------------------------------------------------------- vecinos --
     Devuelve vitrinas candidatas y el motor las ordena en el teléfono. Se
     hace así por dos razones: el servidor no necesita saber a quién le
     interesa quién, y el motor puede cambiar sin desplegar nada.

     No se devuelve nunca: la tuya, las de quien te bloqueó, las de quien
     bloqueaste, ni las de las cuentas suspendidas. */
  async vecinos(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    const filas = await env.DB.prepare(
      `SELECT v.cuenta_id AS id, v.negocio, v.producto, v.idea, v.cliente,
              v.problema, v.valor, v.sector, v.etapa
         FROM vitrina v
         JOIN cuenta c ON c.id = v.cuenta_id
        WHERE v.estado = 'publicada'
          AND c.estado = 'activa'
          AND v.cuenta_id <> ?
          AND NOT EXISTS (SELECT 1 FROM bloqueo b
                           WHERE (b.de_id = ? AND b.sobre_id = v.cuenta_id)
                              OR (b.sobre_id = ? AND b.de_id = v.cuenta_id))
        ORDER BY v.publicada DESC
        LIMIT ?`
    ).bind(yo.id, yo.id, yo.id, MAX_VECINOS).all();

    return { ok: true, vecinos: filas.results || [] };
  },

  /* -------------------------------------------------------- veo-valor --
     Guarda la intención y el mensaje. El mensaje NO se le entrega al otro
     todavía: hasta que acepte, solo ve la intención y el motivo. */
  async 'veo-valor'(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    const para = String(cuerpo.para || '');
    const intencion = String(cuerpo.intencion || '');
    const motivo = String(cuerpo.motivo || '');
    const mensaje = texto(cuerpo.mensaje, MAX_MENSAJE);

    if (para === yo.id) return { error: 'a-ti-mismo', status: 400 };
    if (!INTENCIONES.includes(intencion)) return { error: 'intencion', status: 400 };
    if (!MOTIVOS.includes(motivo)) return { error: 'motivo', status: 400 };
    if (!mensaje) return { error: 'vacio', mensaje: 'Escribe algo primero.', status: 400 };
    if (tieneContacto(mensaje)) {
      return { error: 'contacto', mensaje: 'Todavía no pongas tu contacto.', status: 400 };
    }

    /* El destino tiene que existir, estar activo y tener el puesto abierto.
       Sin esto se podría escribir a una cuenta cerrada o a un id inventado. */
    const destino = await env.DB.prepare(
      `SELECT v.cuenta_id FROM vitrina v JOIN cuenta c ON c.id = v.cuenta_id
        WHERE v.cuenta_id = ? AND v.estado = 'publicada' AND c.estado = 'activa'`
    ).bind(para).first();
    if (!destino) return { error: 'no-existe', status: 404 };

    const bloqueado = await env.DB.prepare(
      `SELECT 1 FROM bloqueo WHERE (de_id = ? AND sobre_id = ?) OR (de_id = ? AND sobre_id = ?)`
    ).bind(yo.id, para, para, yo.id).first();
    if (bloqueado) return { error: 'no-existe', status: 404 };

    /* Hace falta tener puesto propio para acercarse a nadie, y se guarda una
       FOTO de él. Sin la foto, quien manda un "veo valor" podía reescribir su
       vitrina después y usarla como canal de texto libre dirigido hacia
       alguien que todavía no ha aceptado nada — reescribiéndola las veces que
       quisiera. La regla 4 se cierra por delante, no solo por detrás. */
    const mia = await env.DB.prepare(
      `SELECT negocio, producto, idea, cliente, problema, valor, sector, etapa
         FROM vitrina WHERE cuenta_id = ? AND estado = 'publicada'`
    ).bind(yo.id).first();
    if (!mia) {
      return { error: 'sin-puesto', mensaje: 'Abre tu puesto antes de acercarte.', status: 400 };
    }

    const ahora = Date.now();
    await env.DB.prepare(
      `INSERT INTO valor (id, de_id, para_id, intencion, motivo, mensaje, at, estado, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'enviado', ?)
       ON CONFLICT(de_id, para_id) DO UPDATE SET
         intencion = CASE WHEN valor.estado = 'aceptado' THEN valor.intencion ELSE excluded.intencion END,
         motivo    = CASE WHEN valor.estado = 'aceptado' THEN valor.motivo    ELSE excluded.motivo END,
         mensaje   = CASE WHEN valor.estado = 'aceptado' THEN valor.mensaje   ELSE excluded.mensaje END,
         foto      = CASE WHEN valor.estado = 'aceptado' THEN valor.foto      ELSE excluded.foto END,
         at        = CASE WHEN valor.estado = 'aceptado' THEN valor.at        ELSE excluded.at END,
         -- Reenviar no reabre algo que el otro ya declinó, y tampoco resucita
         -- algo ya aceptado: eso devolvía al emisor a la bandeja del otro una
         -- y otra vez, que es un vector de insistencia con otro nombre.
         estado = CASE WHEN valor.estado IN ('declinado','aceptado') THEN valor.estado ELSE 'enviado' END`
    ).bind(nuevoId(), yo.id, para, intencion, motivo, mensaje, ahora, JSON.stringify(mia)).run();

    return { ok: true };
  },

  /* ------------------------------------------------------ retirar-valor -- */
  async 'retirar-valor'(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();
    await env.DB.prepare(
      `DELETE FROM valor WHERE de_id = ? AND para_id = ? AND estado = 'enviado'`
    ).bind(yo.id, String(cuerpo.para || '')).run();
    return { ok: true };
  },

  /* --------------------------------------------------------- recibidos --
     Quién vio valor en lo tuyo. Aquí está la regla 4 en código: se devuelve
     la intención y el motivo, y la vitrina del otro —que ya es pública—,
     pero NO el mensaje que escribió. Ese llega cuando aceptas. */
  async recibidos(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    /* Se sirve `foto` —la vitrina congelada al acercarse— y no la vitrina en
       vivo. Ver el comentario de veo-valor: en vivo era un canal reescribible
       hacia alguien que no ha aceptado nada. */
    const filas = await env.DB.prepare(
      `SELECT val.de_id AS id, val.intencion, val.motivo, val.at, val.foto
         FROM valor val
         JOIN vitrina v ON v.cuenta_id = val.de_id
         JOIN cuenta  c ON c.id = val.de_id
        WHERE val.para_id = ? AND val.estado = 'enviado'
          AND v.estado = 'publicada' AND c.estado = 'activa'
          AND NOT EXISTS (SELECT 1 FROM bloqueo b
                           WHERE (b.de_id = ? AND b.sobre_id = val.de_id)
                              OR (b.sobre_id = ? AND b.de_id = val.de_id))
        ORDER BY val.at DESC
        LIMIT 50`
    ).bind(yo.id, yo.id, yo.id).all();

    const recibidos = (filas.results || []).map(function (f) {
      let vit = {};
      try { vit = JSON.parse(f.foto || '{}'); } catch (e) { vit = {}; }
      return { id: f.id, intencion: f.intencion, motivo: f.motivo, at: f.at, ...vit };
    });

    return { ok: true, recibidos };
  },

  /* --------------------------------------------------------- responder --
     Acepta o declina. Al aceptar se crea la conversación, y solo entonces
     existe un sitio donde escribirse. */
  async responder(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    const de = String(cuerpo.de || '');
    const acepto = cuerpo.acepto === true;
    /* Sin esto, una fila con de_id = para_id reventaría el CHECK (a_id < b_id)
       dejando el valor en 'aceptado' y sin conversación: inalcanzable. */
    if (!de || de === yo.id) return { error: 'no-existe', status: 404 };

    const val = await env.DB.prepare(
      `SELECT id, mensaje, motivo FROM valor
        WHERE de_id = ? AND para_id = ? AND estado = 'enviado'`
    ).bind(de, yo.id).first();
    if (!val) return { error: 'no-existe', status: 404 };

    /* El único camino por el que el texto libre cruzaba sin consentimiento
       vigente: A se acerca, A bloquea a B al darse cuenta de que es una
       estafa, y B acepta después. `bloquear` no tocaba la fila, así que el
       mensaje de A llegaba igual. Ahora se comprueba aquí, y además se retira
       lo pendiente al bloquear. */
    const bloqueado = await env.DB.prepare(
      `SELECT 1 FROM bloqueo WHERE (de_id = ? AND sobre_id = ?) OR (de_id = ? AND sobre_id = ?)`
    ).bind(yo.id, de, de, yo.id).first();
    if (bloqueado) return { error: 'no-existe', status: 404 };

    if (!acepto) {
      await env.DB.prepare(`UPDATE valor SET estado = 'declinado' WHERE id = ?`).bind(val.id).run();
      return { ok: true, aceptado: false };
    }

    /* Reclamar y comprobar, como en confirmar(). Sin el `changes !== 1`, dos
       peticiones a la vez insertaban dos veces el primer mensaje. */
    const reclamado = await env.DB.prepare(
      `UPDATE valor SET estado = 'aceptado' WHERE id = ? AND estado = 'enviado'`
    ).bind(val.id).run();
    if (!reclamado.meta || reclamado.meta.changes !== 1) {
      return { error: 'no-existe', status: 404 };
    }

    /* a_id < b_id siempre: es lo que hace que el UNIQUE de la tabla impida
       de verdad dos conversaciones entre las mismas dos personas. */
    const [a, b] = de < yo.id ? [de, yo.id] : [yo.id, de];
    const ahora = Date.now();

    /* Las dos sentencias en un batch: si la conversación no llegara a
       crearse, el valor no puede quedarse en 'aceptado' — esa fila sería
       inalcanzable para siempre, porque recibidos() solo lista 'enviado'. */
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO conversacion (id, a_id, b_id, abierta, motivo) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(a_id, b_id) DO NOTHING`
      ).bind(nuevoId(), a, b, ahora, val.motivo),
      /* El primer mensaje es el que escribió quien se acercó. Hasta este
         momento no lo había visto nadie más que él. El SELECT de dentro lo
         ata a la conversación recién creada sin un viaje extra. */
      env.DB.prepare(
        `INSERT INTO mensaje (id, conv_id, de_id, texto, at)
         SELECT ?, id, ?, ?, ? FROM conversacion WHERE a_id = ? AND b_id = ?`
      ).bind(nuevoId(), de, val.mensaje, ahora, a, b)
    ]);

    const conv = await env.DB.prepare(
      `SELECT id FROM conversacion WHERE a_id = ? AND b_id = ?`
    ).bind(a, b).first();

    return { ok: true, aceptado: true, conversacion: conv ? conv.id : null };
  },

  /* ----------------------------------------------------- conversaciones -- */
  async conversaciones(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    /* El LEFT JOIN filtra por estado, por cuenta activa y por bloqueo. Era la
       ÚNICA consulta del Worker donde el filtro de bloqueo faltaba entero: sin
       él, quien retiraba su puesto —o a quien la moderación se lo ocultaba, o
       a quien había bloqueado al otro— seguía enseñando su negocio ahí dentro
       indefinidamente.

       Sigue siendo LEFT a propósito: la conversación tiene que seguir
       apareciendo aunque su vitrina ya no esté. Lo que desaparece es el
       negocio, no el hilo. */
    const filas = await env.DB.prepare(
      `SELECT cv.id, cv.abierta, cv.motivo,
              CASE WHEN cv.a_id = ? THEN cv.b_id ELSE cv.a_id END AS otro_id,
              v.negocio, v.producto, v.idea, v.sector, v.etapa
         FROM conversacion cv
         LEFT JOIN vitrina v
                ON v.cuenta_id = CASE WHEN cv.a_id = ? THEN cv.b_id ELSE cv.a_id END
               AND v.estado = 'publicada'
               AND EXISTS (SELECT 1 FROM cuenta c
                            WHERE c.id = v.cuenta_id AND c.estado = 'activa')
               AND NOT EXISTS (SELECT 1 FROM bloqueo b
                                WHERE (b.de_id = ? AND b.sobre_id = v.cuenta_id)
                                   OR (b.sobre_id = ? AND b.de_id = v.cuenta_id))
        WHERE cv.a_id = ? OR cv.b_id = ?
        ORDER BY cv.abierta DESC
        LIMIT 50`
    ).bind(yo.id, yo.id, yo.id, yo.id, yo.id, yo.id).all();

    return { ok: true, conversaciones: filas.results || [] };
  },

  /* --------------------------------------------------------- mensajes --
     Leer y escribir dentro de una conversación. La pertenencia se comprueba
     en el WHERE, no en un if: así no hay forma de leer una conversación
     ajena pasando su id. */
  async mensajes(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    const convId = String(cuerpo.conversacion || '');
    const conv = await env.DB.prepare(
      `SELECT id, a_id, b_id FROM conversacion WHERE id = ? AND (a_id = ? OR b_id = ?)`
    ).bind(convId, yo.id, yo.id).first();
    if (!conv) return { error: 'no-existe', status: 404 };

    const otro = conv.a_id === yo.id ? conv.b_id : conv.a_id;
    const bloqueado = await env.DB.prepare(
      `SELECT 1 FROM bloqueo WHERE (de_id = ? AND sobre_id = ?) OR (de_id = ? AND sobre_id = ?)`
    ).bind(yo.id, otro, otro, yo.id).first();

    const nuevo = texto(cuerpo.texto, MAX_MENSAJE);
    if (nuevo) {
      if (bloqueado) return { error: 'bloqueada', mensaje: 'Esta conversación está cerrada.', status: 403 };
      await env.DB.prepare(
        `INSERT INTO mensaje (id, conv_id, de_id, texto, at) VALUES (?, ?, ?, ?, ?)`
      ).bind(nuevoId(), conv.id, yo.id, nuevo, Date.now()).run();
    }

    /* DESC y no ASC: con ASC, del mensaje 201 en adelante se guardaba todo y
       no se veía nada — la conversación parecía congelada justo con quien más
       hablas. Se le da la vuelta aquí para que el cliente los reciba en el
       orden en que se leen. */
    const filas = await env.DB.prepare(
      `SELECT id, de_id, texto, at FROM mensaje WHERE conv_id = ? ORDER BY at DESC LIMIT 200`
    ).bind(conv.id).all();

    return { ok: true, mensajes: (filas.results || []).reverse(), bloqueada: !!bloqueado };
  },

  /* -------------------------------------------------------- denunciar --
     Denunciar bloquea de inmediato, sin esperar a que nadie revise. Quien
     denuncia no debería seguir viendo a quien denunció mientras espera. */
  async denunciar(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    /* texto() y no String(): era el único campo del Worker sin tope, y cada
       denuncia lo escribe tres veces (fila de denuncia, fila de bloqueo donde
       es parte de la clave, e índice). Con un megabyte por petición eran
       gigabytes por hora. */
    const sobre = texto(cuerpo.sobre, 64);
    const motivo = String(cuerpo.motivo || '');
    if (!sobre || sobre === yo.id) return { error: 'a-ti-mismo', status: 400 };
    if (!MOTIVOS_DENUNCIA.includes(motivo)) return { error: 'motivo', status: 400 };

    const ahora = Date.now();
    await env.DB.batch([
      /* Una denuncia por par: la tabla tiene UNIQUE(de_id, sobre_id) y aquí va
         el DO UPDATE que le corresponde. Sin él, la segunda denuncia sobre la
         misma persona reventaría el batch entero y se llevaría por delante el
         bloqueo de abajo — el usuario creería haber bloqueado y no. */
      env.DB.prepare(
        `INSERT INTO denuncia (id, de_id, sobre_id, motivo, nota, at) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(de_id, sobre_id) DO UPDATE SET
           motivo = excluded.motivo, nota = excluded.nota,
           at = excluded.at, estado = 'abierta'`
      ).bind(nuevoId(), yo.id, sobre, motivo, notaLimpia(cuerpo.nota), ahora),
      env.DB.prepare(
        `INSERT INTO bloqueo (de_id, sobre_id, at) VALUES (?, ?, ?)
         ON CONFLICT(de_id, sobre_id) DO NOTHING`
      ).bind(yo.id, sobre, ahora),
      /* Denunciar retira lo que estuviera pendiente en los dos sentidos. Sin
         esto, el mensaje de un "veo valor" ya enviado seguía pudiendo cruzar
         después de denunciar a esa persona. */
      env.DB.prepare(
        `DELETE FROM valor WHERE estado = 'enviado'
           AND ((de_id = ? AND para_id = ?) OR (de_id = ? AND para_id = ?))`
      ).bind(yo.id, sobre, sobre, yo.id)
    ]);

    return { ok: true };
  },

  /* --------------------------------------------------------- bloquear -- */
  async bloquear(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();
    const sobre = texto(cuerpo.sobre, 64);
    if (!sobre || sobre === yo.id) return { error: 'a-ti-mismo', status: 400 };

    const ahora = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO bloqueo (de_id, sobre_id, at) VALUES (?, ?, ?)
         ON CONFLICT(de_id, sobre_id) DO NOTHING`
      ).bind(yo.id, sobre, ahora),
      /* Bloquear retira el consentimiento, así que retira también lo que
         estuviera pendiente de aceptar en cualquiera de los dos sentidos. Sin
         esto, el mensaje que ya escribí seguía llegándole a quien acabo de
         bloquear en cuanto le diera a aceptar. */
      env.DB.prepare(
        `DELETE FROM valor WHERE estado = 'enviado'
           AND ((de_id = ? AND para_id = ?) OR (de_id = ? AND para_id = ?))`
      ).bind(yo.id, sobre, sobre, yo.id)
    ]);
    return { ok: true };
  },

  /* --------------------------------------------------------- borrarme --
     Borra de verdad, y no queda nada.

     El comentario que había aquí decía que sobrevivían las denuncias de
     otros «para que no bastara con borrarse y volver a limpiar el historial».
     Era falso por partida doble: el código tampoco las conservaba a
     propósito, y al volver `confirmar` genera un id nuevo, así que esas
     denuncias quedaban huérfanas y no protegían de nada. Se pagaba el coste
     en privacidad sin cobrar el beneficio.

     Lo que se borra: la cuenta y, por cascada, vitrina, "veo valor" en los
     dos sentidos, conversaciones, mensajes y sesiones. Y a mano, porque no
     hay clave foránea que las alcance: los bloqueos, las denuncias en los dos
     sentidos, y las filas de `enlace` y `pedido` que llevaban la huella del
     correo — que era un identificador estable de la persona. */
  async borrarme(cuerpo, env) {
    const yo = await quienEs(cuerpo, env);
    if (!yo) return noAutorizado();

    /* La huella se lee ANTES de borrar la cuenta: es la única llave hacia
       `pedido` y `enlace`, y desaparece con la fila. */
    const fila = await env.DB.prepare(
      `SELECT correo_hash FROM cuenta WHERE id = ?`
    ).bind(yo.id).first();
    const h = fila ? fila.correo_hash : null;

    const pasos = [
      env.DB.prepare(`DELETE FROM bloqueo WHERE de_id = ? OR sobre_id = ?`).bind(yo.id, yo.id),
      /* Las denuncias que ESCRIBIÓ: llevan su nota, hasta 500 caracteres de
         texto suyo. Sin esto, "borrar" dejaba dentro justo lo único que había
         escrito a mano fuera de su vitrina. */
      env.DB.prepare(`DELETE FROM denuncia WHERE de_id = ?`).bind(yo.id),
      /* Y las que otros pusieron SOBRE ella. Conservarlas no protege nada: al
         volver, `confirmar` genera un id nuevo, así que quedarían huérfanas
         apuntando a una cuenta que ya no existe. Se pagaría el coste en
         privacidad sin obtener el beneficio en moderación. */
      env.DB.prepare(`DELETE FROM denuncia WHERE sobre_id = ?`).bind(yo.id)
    ];

    /* `enlace` y `pedido` no tienen clave foránea —su llave es la huella del
       correo, no el id— así que la cascada no las alcanza. Son las dos tablas
       donde sobrevivía un identificador estable de la persona, incluso de
       quien nunca llegó a tener cuenta. */
    if (h) {
      pasos.push(env.DB.prepare(`DELETE FROM enlace WHERE correo_hash = ?`).bind(h));
      pasos.push(env.DB.prepare(`DELETE FROM pedido WHERE correo_hash = ?`).bind(h));
    }

    /* Lo último: la cascada se lleva vitrina, valor, conversación, mensajes y
       sesiones. El `DELETE FROM mensaje WHERE de_id` que había aquí sobraba
       —esos mensajes solo viven en conversaciones que ya caen— y además
       `mensaje.de_id` no tiene índice, así que era un recorrido completo. */
    pasos.push(env.DB.prepare(`DELETE FROM cuenta WHERE id = ?`).bind(yo.id));

    await env.DB.batch(pasos);
    return { ok: true };
  },

  /* ------------------------------------------------------------ salir -- */
  async salir(cuerpo, env) {
    const token = String(cuerpo.sesion || '');
    if (token.length >= 20 && token.length <= 100) {
      await env.DB.prepare(`DELETE FROM sesion WHERE token_hash = ?`).bind(await sha256(token)).run();
    }
    return { ok: true };
  }
};

/* ==========================================================================
   EL CORREO

   Dos caminos, y el Worker elige solo el que esté configurado. Con el
   binding de Cloudflare (plan de pago) no hay ninguna clave que guardar;
   con un servicio externo, la clave es un secreto del Worker.
   ========================================================================== */

async function mandarEnlace(correo, token, env, origen) {
  const base = origen || env.APP_URL || 'https://app.emprendo.life';
  /* En el fragmento (#) y no en la query (?). El token es acceso completo a
     la cuenta durante quince minutos, y una query string acaba en el
     historial del navegador, en los registros de acceso del servidor que
     sirve la app, y en la cabecera Referer de cualquier recurso externo que
     cargue la página. El fragmento no sale nunca del navegador.
     El cliente lo lee y llama enseguida a history.replaceState. */
  const enlace = `${base}/#plaza=${encodeURIComponent(token)}`;
  const desde = env.CORREO_DESDE || 'hola@emprendo.life';

  const asunto = 'Tu entrada a la Plaza';
  const plano =
    'Hola.\n\n' +
    'Toca este enlace para entrar a la Plaza:\n' + enlace + '\n\n' +
    'Sirve una sola vez y caduca en 15 minutos.\n' +
    'Si no lo pediste tú, no hace falta que hagas nada.\n';

  const html =
    '<p>Hola.</p>' +
    '<p><a href="' + enlace + '">Toca aquí para entrar a la Plaza</a></p>' +
    '<p>Sirve una sola vez y caduca en 15 minutos.<br>' +
    'Si no lo pediste tú, no hace falta que hagas nada.</p>';

  if (env.EMAIL && typeof env.EMAIL.send === 'function') {
    await env.EMAIL.send({
      to: correo,
      from: { email: desde, name: 'Emprendo' },
      subject: asunto,
      text: plano,
      html
    });
    return;
  }

  if (env.CORREO_API_KEY && env.CORREO_API_URL) {
    const res = await fetch(env.CORREO_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + env.CORREO_API_KEY
      },
      body: JSON.stringify({ from: desde, to: [correo], subject: asunto, text: plano, html })
    });
    // Sin esto, una clave caducada es indistinguible de un envío correcto.
    if (!res.ok) throw new Error('correo-externo-' + res.status);
    return;
  }

  /* Sin correo configurado no se revienta la petición: `entrar` ya respondió
     lo mismo que responde siempre. Queda constancia en el log, sin el correo
     de nadie dentro. */
  console.error('plaza: no hay forma de mandar correo configurada');
}

/* ==========================================================================
   UTILIDADES DE RESPUESTA
   Mismas que el Worker de Chispa, a propósito: dos formas distintas de
   contestar en el mismo dominio son dos sitios donde equivocarse.
   ========================================================================== */

function origenPermitido(origen, env) {
  const lista = String(env.ORIGENES || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!lista.length) return null;
  return lista.includes(origen) ? origen : null;
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
    headers: {
      ...JSON_HEADERS,
      ...cors(origen),
      // Aquí viajan datos de personas: no se guarda copia en ninguna caché.
      'Cache-Control': 'no-store'
    }
  });
}
