/* ==========================================================================
   CHISPA · Worker de Cloudflare

   El único trozo de Emprendo que no vive en GitHub Pages, y existe por una
   razón concreta: en una app estática cualquier clave es pública. Aquí no hay
   ninguna que esconder — el binding `env.AI` se autentica contra la cuenta de
   Cloudflare desde dentro del propio Worker.

   Lo que hace:
     · comprueba que la petición venga del dominio de Emprendo;
     · limita por IP para que nadie raspe el endpoint;
     · recorta la entrada y fija el techo de salida en el servidor, no en el
       cliente, que es donde el usuario podría cambiarlo;
     · llama a Workers AI y devuelve texto plano.

   Por qué no puede generar una factura sorpresa: en el plan gratuito de
   Cloudflare, al agotarse los 10.000 neurons del día el servicio corta. No
   cobra: deja de responder. Subir de plan es una decisión manual.

   Despliegue: ver worker/README.md
   ========================================================================== */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

export default {
  async fetch(request, env, ctx) {
    const origen = request.headers.get('Origin') || '';
    const permitido = origenPermitido(origen, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(permitido) });
    }
    if (request.method !== 'POST') {
      return responder({ error: 'Solo POST.' }, 405, permitido);
    }
    // Sin origen permitido no se responde. No frena a quien use curl con la
    // cabecera puesta —eso no lo frena nada— pero sí evita que otra web cuelgue
    // su chat de esta cuota.
    if (!permitido) {
      return responder({ error: 'Origen no permitido.' }, 403, null);
    }

    /* --------- Límite por IP: ventana corta contra ráfagas y raspado --------- */
    if (env.LIMITE_IP) {
      const ip = request.headers.get('CF-Connecting-IP') || 'sin-ip';
      const { success } = await env.LIMITE_IP.limit({ key: ip });
      if (!success) {
        return responder({
          error: 'limite',
          mensaje: 'Vas muy rápido. Espera un minuto y vuelve a intentarlo.'
        }, 429, permitido);
      }
    }

    /* --------- Entrada --------- */
    let cuerpo;
    try { cuerpo = await request.json(); }
    catch (e) { return responder({ error: 'JSON inválido.' }, 400, permitido); }

    const maxEntrada = int(env.MAX_ENTRADA, 6000);
    const maxSalida = int(env.MAX_SALIDA, 400);

    const sistema = recortar(cuerpo.sistema, maxEntrada);
    const mensaje = recortar(cuerpo.mensaje, maxEntrada);

    if (!mensaje) {
      return responder({ error: 'Falta el mensaje.' }, 400, permitido);
    }

    const mensajes = [];
    if (sistema) mensajes.push({ role: 'system', content: sistema });
    // El historial es opcional y se recorta duro: es lo que más infla la
    // entrada y lo que menos aporta a partir de un par de turnos.
    if (Array.isArray(cuerpo.historial)) {
      for (const m of cuerpo.historial.slice(-4)) {
        if (!m || !m.content) continue;
        mensajes.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: recortar(m.content, 1200)
        });
      }
    }
    mensajes.push({ role: 'user', content: mensaje });

    /* --------- Generación --------- */
    const modelo = env.MODELO || '@cf/qwen/qwen3-30b-a3b-fp8';
    try {
      // Suelo de 200: los modelos que razonan gastan los primeros tokens
      // pensando, y ese preámbulo se descarta. Con un tope menor devuelven
      // vacío. Medido: con 12 tokens no responde nada; con 200, sí.
      const tope = Math.max(200, Math.min(int(cuerpo.maxTokens, maxSalida), maxSalida));
      const salida = await env.AI.run(modelo, {
        messages: mensajes,
        max_tokens: tope,
        temperature: 0.5
      });

      const bruto = (salida && (salida.response || salida.result || '')) || '';
      const texto = limpiar(bruto);
      if (!texto) {
        return responder({
          error: 'vacia',
          mensaje: bruto
            ? 'El modelo se quedó sin espacio para responder: gastó el margen razonando.'
            : 'La IA devolvió una respuesta vacía.'
        }, 502, permitido);
      }
      return responder({ texto, modelo }, 200, permitido);

    } catch (e) {
      const msg = String((e && e.message) || e);
      // Al agotarse la cuota diaria, Cloudflare responde con un error propio.
      // Se traduce a algo que el usuario pueda entender y que la app pueda
      // distinguir para caer al mentor local sin ruido.
      const sinCuota = /neuron|quota|limit|exceed|capacity/i.test(msg);
      return responder({
        error: sinCuota ? 'cuota' : 'fallo',
        mensaje: sinCuota
          ? 'Se acabó la IA gratuita por hoy. Chispa sigue funcionando con sus reglas y cálculos, y mañana vuelve.'
          : 'La IA no pudo responder ahora mismo.'
      }, sinCuota ? 429 : 502, permitido);
    }
  }
};

/* ------------------------------ utilidades ------------------------------ */

function origenPermitido(origen, env) {
  const lista = String(env.ORIGENES || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (!lista.length) return null;
  if (lista.includes('*')) return origen || '*';
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
    headers: { ...JSON_HEADERS, ...cors(origen) }
  });
}

function recortar(v, max) {
  return String(v == null ? '' : v).slice(0, max).trim();
}

function int(v, porDefecto) {
  const n = parseInt(v, 10);
  return isNaN(n) || n <= 0 ? porDefecto : n;
}

/** Algunos modelos abiertos devuelven su razonamiento entre etiquetas antes de
    la respuesta. Eso no debe llegar al chat. */
function limpiar(texto) {
  return String(texto || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();
}
