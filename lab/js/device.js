/* ==========================================================================
   DIAGNÓSTICO DEL DISPOSITIVO

   Decide si este equipo puede con un modelo generativo local ANTES de ofrecer
   una descarga de cientos de megabytes. La regla es no ofrecer nunca algo que
   probablemente tumbe la pestaña.

   El caso duro es iOS. Safari limita la memoria de una página a un rango de
   100 a 450 MB según el equipo, y al pasarse la pestaña muere sin lanzar
   ninguna excepción que se pueda atrapar. El modelo más pequeño de WebLLM pide
   719 MB. Por eso en iOS no se ofrece modelo local, tenga WebGPU o no.

   Y no, abrirlo en Chrome no cambia nada: en iOS todos los navegadores usan
   WebKit por obligación de la App Store, y el límite lo impone el sistema al
   proceso, no el motor.
   ========================================================================== */

/* Umbrales derivados de los requisitos reales de WebLLM (vram_required_MB). */
export const MIN_BUFFER_MB = 1024;   // buffer de almacenamiento que pide un 1B
export const MIN_RAM_GB    = 6;      // por debajo, ni el más pequeño va fino

export function isIOS() {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/i.test(ua)) return true;
  // El iPad moderno se declara como Mac. Se distingue por el táctil.
  if (/iPad/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}

export function browserName() {
  const ua = navigator.userAgent;
  if (/EdgA?\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
  if (/CriOS/.test(ua)) return 'Chrome (iOS · motor WebKit)';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Desconocido';
}

export function osName() {
  const ua = navigator.userAgent;
  if (isIOS()) return /iPad/i.test(ua) || navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua) ? 'iPadOS' : 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desconocido';
}

/** Memoria del dispositivo. Solo Chromium la expone, y redondeada hacia abajo. */
export function deviceMemoryGB() {
  return typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;
}

export async function storageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) return null;
  try {
    const e = await navigator.storage.estimate();
    return {
      usadoMB: Math.round((e.usage || 0) / 1048576),
      cuotaMB: Math.round((e.quota || 0) / 1048576),
      libreMB: Math.round(((e.quota || 0) - (e.usage || 0)) / 1048576)
    };
  } catch (e) { return null; }
}

/** Sonda de WebGPU. Los límites del adaptador son lo que de verdad manda:
    un modelo de 1B necesita reservar buffers de más de 1 GB de una pieza. */
export async function probeWebGPU() {
  if (!('gpu' in navigator)) {
    return { disponible: false, motivo: 'Este navegador no expone WebGPU.' };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { disponible: false, motivo: 'WebGPU existe pero no hay adaptador utilizable (sin GPU compatible o bloqueada por el sistema).' };
    }
    const l = adapter.limits || {};
    const info = adapter.info || {};
    let f16 = false;
    try { f16 = adapter.features && adapter.features.has('shader-f16'); } catch (e) {}

    return {
      disponible: true,
      f16,
      maxBufferMB: l.maxBufferSize ? Math.round(l.maxBufferSize / 1048576) : null,
      maxStorageBufferMB: l.maxStorageBufferBindingSize ? Math.round(l.maxStorageBufferBindingSize / 1048576) : null,
      vendor: info.vendor || '—',
      arquitectura: info.architecture || '—',
      descripcion: info.description || ''
    };
  } catch (e) {
    return { disponible: false, motivo: 'Falló al pedir el adaptador: ' + e.message };
  }
}

/** Mide de verdad cuánta memoria aguanta la pestaña, en pasos pequeños.

    Es una prueba destructiva por naturaleza: si el equipo no aguanta, la
    pestaña muere. Por eso es un botón aparte, avisado, y nunca automático.
    Se reserva en trozos de 32 MB y se sueltan enseguida. */
export async function probeMemory(topeMB = 512, onPaso = null) {
  const trozos = [];
  const PASO = 32;
  let alcanzado = 0;
  try {
    for (let mb = PASO; mb <= topeMB; mb += PASO) {
      trozos.push(new Uint8Array(PASO * 1048576).fill(1));
      alcanzado = mb;
      if (onPaso) onPaso(mb);
      // Cede el hilo para que el navegador pueda recolectar y repintar.
      await new Promise(r => setTimeout(r, 30));
    }
  } catch (e) {
    return { alcanzadoMB: alcanzado, corto: true, error: e.message };
  } finally {
    trozos.length = 0;
  }
  return { alcanzadoMB: alcanzado, corto: false };
}

/** El veredicto: qué puede hacer este equipo y qué no. */
export async function diagnose() {
  const gpu = await probeWebGPU();
  const almacenamiento = await storageEstimate();
  const ram = deviceMemoryGB();
  const ios = isIOS();

  const d = {
    os: osName(),
    navegador: browserName(),
    ios,
    ram,
    nucleos: navigator.hardwareConcurrency || null,
    gpu,
    almacenamiento,
    // Lo que se puede ofrecer:
    puedeEmbeddings: true,          // WASM, ~25 MB: prácticamente cualquier equipo
    puedeGenerativo: false,
    modeloMaximoMB: 0,
    motivos: []
  };

  if (ios) {
    d.motivos.push({
      nivel: 'stop',
      texto: 'iOS limita la memoria de una página web a entre 100 y 450 MB y cierra la pestaña sin aviso al pasarse. ' +
             'El modelo generativo más pequeño necesita 719 MB. No se puede, ni en Safari ni en Chrome: en iOS ' +
             'todos los navegadores usan el mismo motor y el límite lo pone el sistema operativo.'
    });
    return d;
  }

  if (!gpu.disponible) {
    d.motivos.push({ nivel: 'stop', texto: 'Sin WebGPU no hay generación local a una velocidad usable. ' + gpu.motivo });
    return d;
  }

  if (gpu.maxStorageBufferMB && gpu.maxStorageBufferMB < MIN_BUFFER_MB) {
    d.motivos.push({
      nivel: 'stop',
      texto: `La GPU solo permite reservar ${gpu.maxStorageBufferMB} MB de una pieza y hace falta al menos ${MIN_BUFFER_MB} MB.`
    });
    return d;
  }

  if (ram !== null && ram < MIN_RAM_GB) {
    d.motivos.push({
      nivel: 'stop',
      texto: `Este equipo declara ${ram} GB de RAM. Por debajo de ${MIN_RAM_GB} GB el modelo se carga pero el equipo se arrastra.`
    });
    return d;
  }

  // A partir de aquí sí se puede. Cuánto, depende del buffer y del disco.
  const porGPU = gpu.maxStorageBufferMB || 2048;
  const porDisco = almacenamiento && almacenamiento.libreMB
    ? Math.floor(almacenamiento.libreMB * 0.7)
    : 4096;
  d.puedeGenerativo = true;
  d.modeloMaximoMB = Math.min(porGPU, porDisco);

  if (ram === null) {
    d.motivos.push({
      nivel: 'warn',
      texto: 'Este navegador no dice cuánta RAM tiene el equipo. La estimación se hace solo con los límites de la GPU.'
    });
  }
  if (!gpu.f16) {
    d.motivos.push({
      nivel: 'warn',
      texto: 'La GPU no soporta shader-f16: solo se pueden usar variantes q4f32, que ocupan bastante más.'
    });
  }
  if (almacenamiento && almacenamiento.libreMB < 2048) {
    d.motivos.push({
      nivel: 'warn',
      texto: `Quedan ${almacenamiento.libreMB} MB de almacenamiento para el sitio. Puede no alcanzar para los modelos grandes.`
    });
  }
  return d;
}
