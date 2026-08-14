/* ==========================================================================
   MOTOR DE LA IA LOCAL

   Este archivo y su worker son lo único de Emprendo que se descarga bajo
   demanda: no están en el precache de la PWA y no se tocan hasta que el
   usuario acepta explícitamente instalar la IA local.

   Todo el trabajo ocurre en un Web Worker. No es un detalle de rendimiento:
   generar bloquea el hilo durante segundos, y en el hilo principal eso
   congelaría la interfaz entera, incluida la animación de progreso que le
   está diciendo al usuario que espere.
   ========================================================================== */

const CDN = 'https://esm.run/@mlc-ai/web-llm';

let worker = null;
let motor = null;
let cancelado = false;

function crearWorker() {
  // El worker se genera desde una cadena para no depender de un archivo más:
  // así la IA local añade exactamente dos peticiones de red, no tres.
  const codigo = `
    import * as webllm from '${CDN}';
    self.onmessage = (e) => {
      if (e.data && e.data.tipo === 'init') {
        new webllm.WebWorkerMLCEngineHandler();
        self.postMessage({ tipo: 'listo' });
      }
    };
    new webllm.WebWorkerMLCEngineHandler();
  `;
  const url = URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' }));
  const wk = new Worker(url, { type: 'module' });
  // La URL del blob ya no hace falta en cuanto el worker arranca.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return wk;
}

/** Descarga (si hace falta) y carga el modelo en la GPU. */
export async function cargar(id, onProgreso) {
  cancelado = false;
  const webllm = await import(/* @vite-ignore */ CDN);

  if (motor) await liberar();
  worker = crearWorker();

  const informe = (r) => {
    if (cancelado) return;
    if (onProgreso) {
      onProgreso({
        porcentaje: Math.round((r.progress || 0) * 100),
        texto: r.text || '',
        // WebLLM informa del total descargado dentro del texto; se pasa tal
        // cual para que la interfaz pueda enseñarlo sin volver a calcularlo.
        crudo: r
      });
    }
  };

  motor = await webllm.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: informe });
  if (cancelado) { await liberar(); throw new Error('cancelado'); }
  return id;
}

/** Corta una descarga en curso. */
export async function cancelar() {
  cancelado = true;
  await liberar();
}

/** Suelta la memoria de GPU sin borrar los pesos del disco. */
export async function liberar() {
  try { if (motor && motor.unload) await motor.unload(); } catch (e) {}
  try { if (worker) worker.terminate(); } catch (e) {}
  motor = null;
  worker = null;
}

/** Borra los pesos guardados. Solo las cachés del motor: las de la app llevan
    otro prefijo y no se tocan. */
export async function borrar() {
  await liberar();
  if (!self.caches) return 0;
  const claves = await caches.keys();
  const mias = claves.filter(k => /webllm|mlc/i.test(k));
  await Promise.all(mias.map(k => caches.delete(k)));
  return mias.length;
}

/** Genera texto. Devuelve el resultado y cuánto tardó, para poder enseñarlo. */
export async function generar(prompt, opts = {}) {
  if (!motor) throw new Error('El modelo no está cargado.');
  const t0 = performance.now();
  const r = await motor.chat.completions.create({
    messages: [
      { role: 'system', content: opts.sistema || 'Eres Chispa, mentor de negocios. Responde en español, breve y concreto.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: opts.maxTokens || 300,
    temperature: opts.temperatura == null ? 0.5 : opts.temperatura
  });
  const ms = Math.round(performance.now() - t0);
  const texto = limpiar(r?.choices?.[0]?.message?.content || '');
  const tokens = r?.usage?.completion_tokens || 0;
  return { texto, ms, tokens, tokensPorSegundo: ms ? +(tokens / (ms / 1000)).toFixed(1) : 0 };
}

/** Los modelos abiertos pequeños suelen escupir su razonamiento antes de la
    respuesta. Eso no debe llegar al chat. */
function limpiar(t) {
  return String(t || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();
}
