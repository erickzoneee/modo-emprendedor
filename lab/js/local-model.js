/* ==========================================================================
   NIVEL 3 — MODELO ABIERTO LOCAL

   Descarga voluntaria, nunca automática y nunca dentro del precache de la PWA.
   Antes de bajar un solo byte hay que decirle al usuario qué pesa, cuánto
   espacio necesita, si su equipo puede y qué calidad esperar.

   Los tamaños NO están escritos a mano: se leen en vivo de
   `webllm.prebuiltAppConfig.model_list`, que es la fuente oficial. Así el
   laboratorio nunca miente sobre un número que cambió en una versión nueva.

   El motor corre en un Web Worker para que la generación no congele la
   interfaz, y se puede liberar la memoria al terminar.
   ========================================================================== */

const CDN = 'https://esm.run/@mlc-ai/web-llm';

/* Selección curada: familias con buen español y licencia utilizable.
   Todo lo demás (tamaño, VRAM) viene del catálogo oficial en tiempo real. */
export const CANDIDATOS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    familia: 'SmolLM2', parametros: '0,36B', licencia: 'Apache 2.0',
    comercial: true,
    espanol: 'Flojo. Entiende, pero responde con errores y se sale del tono.',
    uso: 'Solo para medir el piso: sirve para comprobar que la tubería funciona.'
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    familia: 'Qwen2.5', parametros: '0,5B', licencia: 'Apache 2.0',
    comercial: true,
    espanol: 'Aceptable para frases cortas. Se pierde en instrucciones largas.',
    uso: 'El más pequeño con español utilizable.'
  },
  {
    id: 'Qwen3-0.6B-q4f16_1-MLC',
    familia: 'Qwen3', parametros: '0,6B', licencia: 'Apache 2.0',
    comercial: true,
    espanol: 'Bueno para su tamaño. Multilingüe de serie.',
    uso: 'Buen candidato mínimo si el equipo lo aguanta.'
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    familia: 'Llama 3.2', parametros: '1B', licencia: 'Llama 3.2 Community',
    comercial: 'condicionado',
    espanol: 'Correcto. Sigue instrucciones simples con fiabilidad.',
    uso: 'Referencia de la categoría 1B.'
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    familia: 'Qwen2.5', parametros: '1,5B', licencia: 'Apache 2.0',
    comercial: true,
    espanol: 'Bueno. Aguanta contexto y formato JSON con reintentos.',
    uso: 'El punto dulce en escritorio de gama media.'
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    familia: 'Gemma 2', parametros: '2B', licencia: 'Gemma Terms',
    comercial: 'condicionado',
    espanol: 'Bueno, redacta natural.',
    uso: 'Alternativa a Qwen 1.5B con mejor prosa.'
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    familia: 'Llama 3.2', parametros: '3B', licencia: 'Llama 3.2 Community',
    comercial: 'condicionado',
    espanol: 'Muy bueno para local.',
    uso: 'Solo escritorio con GPU decente.'
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    familia: 'Qwen2.5', parametros: '3B', licencia: 'Qwen Research/Apache según variante',
    comercial: 'revisar',
    espanol: 'Muy bueno. El mejor de la lista en instrucciones.',
    uso: 'Techo razonable en navegador.'
  }
];

let webllm = null;
let engine = null;
let modeloCargado = null;
let cancelando = false;

/* ------------------------- Catálogo ------------------------- */

async function lib() {
  if (webllm) return webllm;
  webllm = await import(/* @vite-ignore */ CDN);
  return webllm;
}

/** Cruza la lista curada con el catálogo oficial para sacar tamaños reales. */
export async function catalogo() {
  const w = await lib();
  const oficial = new Map((w.prebuiltAppConfig?.model_list || []).map(m => [m.model_id, m]));
  return CANDIDATOS.map(c => {
    const o = oficial.get(c.id);
    return {
      ...c,
      existe: !!o,
      vramMB: o?.vram_required_MB ? Math.round(o.vram_required_MB) : null,
      bajaMemoria: !!o?.low_resource_required,
      contexto: o?.overrides?.context_window_size || o?.context_window_size || null
    };
  });
}

/** Qué modelos se le pueden ofrecer a ESTE equipo, y cuáles no y por qué. */
export function filtrarPorDispositivo(lista, diag) {
  return lista.map(m => {
    if (!m.existe) return { ...m, ofrecible: false, motivo: 'No está en el catálogo de esta versión de WebLLM.' };
    if (!diag.puedeGenerativo) {
      return { ...m, ofrecible: false, motivo: diag.motivos[0]?.texto || 'Este equipo no puede ejecutar modelos locales.' };
    }
    if (m.vramMB && diag.modeloMaximoMB && m.vramMB > diag.modeloMaximoMB) {
      return { ...m, ofrecible: false, motivo: `Necesita ${m.vramMB} MB y este equipo admite hasta ${diag.modeloMaximoMB} MB.` };
    }
    if (!diag.gpu.f16 && /q4f16/.test(m.id)) {
      return { ...m, ofrecible: false, motivo: 'Esta variante necesita shader-f16 y la GPU no lo soporta.' };
    }
    return { ...m, ofrecible: true, motivo: '' };
  });
}

/* ------------------------- Descarga y carga ------------------------- */

/** Carga el modelo. onProgress recibe { texto, porcentaje }.
    Devuelve el motor listo, o lanza si se canceló. */
export async function cargar(modelId, onProgress) {
  const w = await lib();
  cancelando = false;

  if (engine && modeloCargado === modelId) return engine;
  if (engine) await liberar();

  const worker = new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' });
  // Un worker que muere lanza un ErrorEvent, no un Error: sin esto el fallo
  // llegaba a la pantalla como "Falló: undefined", que no ayuda a nadie.
  let fallo = null;
  worker.addEventListener('error', (e) => {
    fallo = new Error('El worker del modelo falló: ' + (e.message || 'sin mensaje') +
      (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : ''));
  });

  try {
    engine = await w.CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (r) => {
        if (cancelando) throw new Error('cancelado');
        onProgress && onProgress({
          texto: r.text || '',
          porcentaje: typeof r.progress === 'number' ? Math.round(r.progress * 100) : null
        });
      }
    });
  } catch (e) {
    try { worker.terminate(); } catch (_) {}
    engine = null;
    throw fallo || normalizarError(e);
  }
  modeloCargado = modelId;
  return engine;
}

/** WebLLM y los workers rechazan con cosas que no siempre son Error. */
function normalizarError(e) {
  if (e instanceof Error) return e;
  if (typeof e === 'string') return new Error(e);
  if (e && e.message) return new Error(String(e.message));
  return new Error('Falló sin dar un motivo. Suele ser memoria de GPU insuficiente o una descarga interrumpida.');
}

export function cancelarCarga() { cancelando = true; }

export function estaCargado() { return !!engine; }
export function modeloActual() { return modeloCargado; }

/** Generación con corte. onToken se llama por fragmento. */
export async function generar(prompt, { onToken, maxTokens = 300, temperatura = 0.6 } = {}) {
  if (!engine) throw new Error('No hay ningún modelo cargado.');
  const t0 = performance.now();
  let salida = '';
  let tokens = 0;

  const chunks = await engine.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    max_tokens: maxTokens,
    temperature: temperatura
  });

  for await (const c of chunks) {
    const d = c.choices?.[0]?.delta?.content || '';
    if (d) { salida += d; tokens++; onToken && onToken(d); }
  }
  const ms = Math.round(performance.now() - t0);
  return { texto: salida.trim(), ms, tokens, tokensPorSegundo: tokens ? +(tokens / (ms / 1000)).toFixed(1) : 0 };
}

export async function interrumpir() {
  try { await engine?.interruptGenerate(); } catch (e) {}
}

/** Suelta la memoria de la GPU sin borrar la descarga. */
export async function liberar() {
  try { await engine?.unload(); } catch (e) {}
  engine = null;
  modeloCargado = null;
}

/* ------------------------- Borrado ------------------------- */

/** Borra de verdad los pesos del disco. Es un requisito, no una cortesía:
    si el usuario baja 2 GB, tiene derecho a recuperarlos con un botón. */
export async function borrarTodo() {
  await liberar();
  let borradas = 0;
  try {
    const nombres = await caches.keys();
    for (const n of nombres) {
      // Las cachés de WebLLM usan estos prefijos; jamás se toca la de Emprendo.
      if (/webllm|mlc/i.test(n)) { await caches.delete(n); borradas++; }
    }
  } catch (e) {}
  try {
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name && /webllm|mlc|tvmjs/i.test(db.name)) { indexedDB.deleteDatabase(db.name); borradas++; }
      }
    }
  } catch (e) {}
  return borradas;
}

/** Cuánto ocupan ahora mismo los modelos guardados. */
export async function espacioUsado() {
  try {
    const nombres = await caches.keys();
    let total = 0;
    for (const n of nombres) {
      if (!/webllm|mlc/i.test(n)) continue;
      const c = await caches.open(n);
      const keys = await c.keys();
      for (const k of keys) {
        const r = await c.match(k);
        if (!r) continue;
        const len = r.headers.get('content-length');
        if (len) total += parseInt(len, 10);
      }
    }
    return Math.round(total / 1048576);
  } catch (e) { return null; }
}
