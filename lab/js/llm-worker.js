/* ==========================================================================
   Worker del modelo local

   Aísla la inferencia del hilo de la interfaz. Sin esto, generar un párrafo
   congela la pantalla varios segundos y en móvil parece que la app se colgó.

   También aísla el fallo: si el modelo revienta por memoria, muere el worker
   y no la pestaña entera.
   ========================================================================== */
import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
