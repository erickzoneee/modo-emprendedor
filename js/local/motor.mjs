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

/* El worker es un archivo real, no un blob: un módulo generado desde
   URL.createObjectURL falla en varios navegadores sin lanzar nada que se pueda
   atrapar, y el síntoma es una carga que no avanza ni da error nunca. */
const URL_WORKER = new URL('./worker.mjs', import.meta.url).href;

/** Arranca el worker y espera a que confirme que su módulo cargó. Si falla
    —CDN caído, red cortada, módulos bloqueados— rechaza con un motivo, en vez
    de dejar al usuario mirando una barra que no se mueve. */
function crearWorker() {
  return new Promise((resolve, reject) => {
    let wk;
    try { wk = new Worker(URL_WORKER, { type: 'module' }); }
    catch (e) { reject(new Error('Este navegador no permite cargar la IA local: ' + e.message)); return; }

    const espera = setTimeout(() => {
      limpiar();
      try { wk.terminate(); } catch (e) {}
      reject(new Error('La biblioteca de la IA local no cargó. Revisa tu conexión e inténtalo otra vez.'));
    }, 30000);

    function limpiar() {
      clearTimeout(espera);
      wk.removeEventListener('message', alMensaje);
      wk.removeEventListener('error', alError);
    }
    function alMensaje(e) {
      if (e.data && e.data.chispa === 'listo') { limpiar(); resolve(wk); }
    }
    function alError(e) {
      limpiar();
      try { wk.terminate(); } catch (err) {}
      reject(new Error('No se pudo iniciar la IA local: ' + (e.message || 'fallo al cargar el módulo')));
    }

    wk.addEventListener('message', alMensaje);
    wk.addEventListener('error', alError);
  });
}

/** Descarga (si hace falta) y carga el modelo en la GPU. */
export async function cargar(id, onProgreso) {
  cancelado = false;
  const webllm = await import(/* @vite-ignore */ CDN);

  if (motor) await liberar();
  worker = await crearWorker();

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
