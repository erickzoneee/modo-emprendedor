/* ==========================================================================
   WORKER DE LA IA LOCAL

   Aquí ocurre toda la carga y la generación. Está en su propio hilo porque
   generar bloquea durante segundos: en el hilo principal congelaría la
   interfaz entera, incluida la barra de progreso que le está pidiendo al
   usuario que espere.

   No entra en el precache de la PWA: se descarga solo cuando el usuario acepta
   instalar la IA local.
   ========================================================================== */

import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm';

/* El handler NO se engancha solo al crearlo: hay que reenviarle cada mensaje
   a mano. Sin esta línea el hilo principal se queda esperando una respuesta
   que nunca llega, sin error y sin progreso — que es exactamente el síntoma
   más difícil de diagnosticar. */
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };

// Señal propia, aparte del protocolo de WebLLM: le dice al hilo principal que
// el módulo cargó de verdad. Sin ella, un fallo al importar desde el CDN deja
// la promesa colgada para siempre en vez de dar un error que se pueda enseñar.
self.postMessage({ chispa: 'listo' });
