/* ==========================================================================
   IA LOCAL DE CHISPA — descarga opcional

   Un modelo generativo que corre dentro del navegador, sin servidor y sin
   conexión una vez descargado. Es el nivel 7 más privado que existe: nada sale
   del dispositivo.

   Tres decisiones que gobiernan todo este archivo:

   1. NUNCA entra en el precache de la PWA. Se descarga solo si el usuario lo
      pide, viendo antes el peso exacto, el espacio que necesita y qué calidad
      esperar. La app pesa lo mismo para quien no lo quiera.

   2. NUNCA se ofrece a un equipo que probablemente no aguante. Superar el
      límite de memoria de una pestaña no lanza una excepción que se pueda
      atrapar: la pestaña muere. Por eso el diagnóstico va antes que el botón,
      y si el veredicto es que no, se explica el motivo en vez de dejar que el
      usuario lo descubra tumbando su navegador.

   3. NUNCA es obligatorio. Si no está, o falla, o el equipo no puede, Chispa
      responde igual con sus reglas, sus fórmulas y su base de conocimiento,
      que es lo que hace la mayor parte del tiempo de todos modos.

   La biblioteca (WebLLM) tampoco viaja con la app: se importa en el momento en
   que el usuario acepta la descarga, desde js/local/motor.mjs.
   ========================================================================== */
(function (w) {
  'use strict';

  /* Umbrales derivados de los requisitos reales de los modelos. */
  var MIN_BUFFER_MB = 1024;   // lo que pide reservar de una pieza un modelo de 1B
  var MIN_RAM_GB = 6;         // por debajo, carga pero el equipo se arrastra

  /* ==================================================================
     CATÁLOGO

     Curado a mano y a propósito: la lista completa de WebLLM tiene
     decenas de variantes y ofrecerlas todas es empujar al usuario a
     elegir mal. Los pesos salen del catálogo oficial; si cambian, la
     barra de descarga enseña la verdad.
     ================================================================== */

  var MODELOS = [
    {
      id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
      nombre: 'Qwen 2.5 · 1.5B',
      mb: 1630,
      licencia: 'Apache 2.0',
      recomendado: true,
      calidad: 'Buen español y aguanta instrucciones largas. Es el equilibrio entre lo que cabe y lo que sirve.',
      medido: false
    },
    {
      id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      nombre: 'Llama 3.2 · 1B',
      mb: 879,
      licencia: 'Llama Community (con condiciones)',
      calidad: 'El más ligero que da respuestas correctas. Se pierde en instrucciones largas.',
      medido: false
    },
    {
      id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
      nombre: 'Qwen 2.5 · 3B',
      mb: 2504,
      licencia: 'Qwen (revisar variante)',
      calidad: 'El mejor de los que caben en un navegador. Solo para equipos con GPU dedicada.',
      medido: false
    }
  ];

  /* ==================================================================
     DIAGNÓSTICO DEL DISPOSITIVO
     ================================================================== */

  function esIOS() {
    var ua = w.navigator.userAgent;
    if (/iPhone|iPod|iPad/i.test(ua)) return true;
    // El iPad moderno se declara como Mac; se distingue por el táctil.
    return /Macintosh/i.test(ua) && w.navigator.maxTouchPoints > 1;
  }

  function navegador() {
    var ua = w.navigator.userAgent;
    if (/EdgA?\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
    if (/CriOS/.test(ua)) return 'Chrome (en iOS usa el motor de Safari)';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Desconocido';
  }

  function sistema() {
    var ua = w.navigator.userAgent;
    if (esIOS()) return /iPad/i.test(ua) || (/Macintosh/i.test(ua) && w.navigator.maxTouchPoints > 1) ? 'iPadOS' : 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Desconocido';
  }

  function ramGB() {
    return typeof w.navigator.deviceMemory === 'number' ? w.navigator.deviceMemory : null;
  }

  function espacio() {
    if (!w.navigator.storage || !w.navigator.storage.estimate) return Promise.resolve(null);
    return w.navigator.storage.estimate().then(function (e) {
      return {
        usadoMB: Math.round((e.usage || 0) / 1048576),
        libreMB: Math.round(((e.quota || 0) - (e.usage || 0)) / 1048576)
      };
    }).catch(function () { return null; });
  }

  /** Los límites del adaptador son lo que de verdad manda: un modelo de 1B
      necesita reservar buffers de más de 1 GB de una sola pieza, y eso lo
      decide la GPU, no la RAM del equipo. */
  function sondaGPU() {
    if (!('gpu' in w.navigator)) {
      return Promise.resolve({ disponible: false, motivo: 'Este navegador no trae WebGPU.' });
    }
    return w.navigator.gpu.requestAdapter().then(function (ad) {
      if (!ad) return { disponible: false, motivo: 'WebGPU existe pero no hay una GPU utilizable.' };
      var l = ad.limits || {};
      var f16 = false;
      try { f16 = !!(ad.features && ad.features.has('shader-f16')); } catch (e) {}
      return {
        disponible: true, f16: f16,
        maxBufferMB: l.maxStorageBufferBindingSize ? Math.round(l.maxStorageBufferBindingSize / 1048576) : null
      };
    }).catch(function (e) {
      return { disponible: false, motivo: 'No se pudo consultar la GPU: ' + e.message };
    });
  }

  var _diag = null;

  /** Veredicto del equipo. Se cachea: consultar la GPU no es gratis. */
  function diagnosticar(forzar) {
    if (_diag && !forzar) return Promise.resolve(_diag);
    return Promise.all([sondaGPU(), espacio()]).then(function (r) {
      var gpu = r[0], disco = r[1], ram = ramGB();
      var d = {
        os: sistema(), navegador: navegador(), ios: esIOS(),
        ram: ram, nucleos: w.navigator.hardwareConcurrency || null,
        gpu: gpu, disco: disco,
        puede: false, maximoMB: 0, motivo: null, avisos: []
      };

      if (d.ios) {
        d.motivo = 'iOS limita la memoria de una página web y cierra la pestaña sin aviso al pasarse. ' +
          'El modelo más pequeño necesita casi el doble de lo que permite. No se puede, ni en Safari ni ' +
          'en Chrome: en iOS todos los navegadores usan el mismo motor.';
        _diag = d; return d;
      }
      if (!gpu.disponible) {
        d.motivo = 'Sin WebGPU la generación local sería tan lenta que no serviría. ' + gpu.motivo;
        _diag = d; return d;
      }
      if (gpu.maxBufferMB && gpu.maxBufferMB < MIN_BUFFER_MB) {
        d.motivo = 'Tu tarjeta gráfica solo permite reservar ' + gpu.maxBufferMB +
          ' MB de una pieza, y hace falta al menos ' + MIN_BUFFER_MB + ' MB.';
        _diag = d; return d;
      }
      if (ram !== null && ram < MIN_RAM_GB) {
        d.motivo = 'Este equipo declara ' + ram + ' GB de memoria. Por debajo de ' + MIN_RAM_GB +
          ' GB el modelo carga, pero el equipo se arrastra tanto que deja de ser útil.';
        _diag = d; return d;
      }

      var porGPU = gpu.maxBufferMB || 2048;
      var porDisco = disco && disco.libreMB ? Math.floor(disco.libreMB * 0.7) : 4096;
      d.puede = true;
      d.maximoMB = Math.min(porGPU, porDisco);

      if (ram === null) d.avisos.push('Este navegador no dice cuánta memoria tiene el equipo; la estimación sale solo de la GPU.');
      if (!gpu.f16) d.avisos.push('Tu GPU no soporta shader-f16, así que los modelos ocupan bastante más de lo indicado.');
      if (disco && disco.libreMB < 2048) d.avisos.push('Quedan ' + disco.libreMB + ' MB de almacenamiento para este sitio.');

      _diag = d;
      return d;
    });
  }

  /** Los modelos que este equipo puede cargar, con el motivo del descarte. */
  function catalogo() {
    return diagnosticar().then(function (d) {
      return MODELOS.map(function (m) {
        var copia = {}, k;
        for (k in m) if (Object.prototype.hasOwnProperty.call(m, k)) copia[k] = m[k];
        if (!d.puede) { copia.cabe = false; copia.porque = d.motivo; }
        else if (m.mb > d.maximoMB) {
          copia.cabe = false;
          copia.porque = 'Necesita ' + m.mb + ' MB y este equipo aguanta hasta ' + d.maximoMB + ' MB.';
        } else { copia.cabe = true; copia.porque = null; }
        return copia;
      });
    });
  }

  /* ==================================================================
     CARGA DEL MOTOR

     WebLLM se importa en el momento en que el usuario acepta, nunca
     antes. `new Function` evita que un navegador viejo se atragante al
     analizar este archivo por culpa de import(): sin ella, un móvil
     antiguo se quedaría sin app entera por una función que ni va a usar.
     ================================================================== */

  var importar = null;
  try { importar = new Function('u', 'return import(u);'); } catch (e) { importar = null; }

  /* La ruta del motor se resuelve AHORA, mientras este script se ejecuta:
     document.currentScript solo existe en ese instante y vale null después.
     Resolverla más tarde daría /local/motor.mjs en vez de /js/local/motor.mjs,
     y la app está publicada en un subdirectorio. */
  var URL_MOTOR = (function () {
    try {
      var base = (document.currentScript && document.currentScript.src) || location.href;
      return new URL('../local/motor.mjs', base).href;
    } catch (e) {
      return 'js/local/motor.mjs';
    }
  })();

  var motor = null;         // módulo js/local/motor.mjs ya cargado
  var cargado = null;       // id del modelo en memoria

  function soportado() { return !!importar; }

  function abrirMotor() {
    if (motor) return Promise.resolve(motor);
    if (!importar) return Promise.reject(new Error('Este navegador no puede cargar la IA local.'));
    return importar(URL_MOTOR).then(function (m) { motor = m; return m; });
  }

  /** Descarga y carga el modelo. `onProgreso({porcentaje, texto})`. */
  function instalar(id, onProgreso) {
    var elegido = null;
    for (var i = 0; i < MODELOS.length; i++) if (MODELOS[i].id === id) elegido = MODELOS[i];
    if (!elegido) return Promise.reject(new Error('Ese modelo no está en el catálogo.'));

    return diagnosticar().then(function (d) {
      if (!d.puede) throw new Error(d.motivo);
      if (elegido.mb > d.maximoMB) {
        throw new Error('Este equipo no puede con ' + elegido.nombre + '. ' +
          'Necesita ' + elegido.mb + ' MB y aguanta hasta ' + d.maximoMB + ' MB.');
      }
      return abrirMotor();
    }).then(function (m) {
      return m.cargar(id, onProgreso);
    }).then(function () {
      cargado = id;
      w.Store.set(function (s) { s.iaLocal = { modelo: id, at: Date.now() }; }, 'ia-local');
      return id;
    });
  }

  function cancelar() { return motor ? motor.cancelar() : Promise.resolve(); }

  function liberar() {
    cargado = null;
    return motor ? motor.liberar() : Promise.resolve();
  }

  /** Borra los pesos del dispositivo. Solo toca las cachés del motor: las de
      la app tienen otro prefijo y no se rozan. */
  function borrar() {
    cargado = null;
    w.Store.set(function (s) { s.iaLocal = null; }, 'ia-local');
    if (motor) return motor.borrar();
    if (!w.caches) return Promise.resolve(0);
    return w.caches.keys().then(function (ks) {
      var mios = ks.filter(function (k) { return /webllm|mlc/i.test(k); });
      return Promise.all(mios.map(function (k) { return w.caches.delete(k); })).then(function () { return mios.length; });
    });
  }

  function instalado() {
    var s = w.Store.state;
    return s.iaLocal && s.iaLocal.modelo ? s.iaLocal.modelo : null;
  }

  function listo() { return !!cargado; }

  /** ¿Puede responder ahora mismo sin descargar nada? */
  function disponible() { return !!cargado; }

  function generar(prompt, opts) {
    if (!motor || !cargado) return Promise.reject(new Error('La IA local no está cargada.'));
    return motor.generar(prompt, opts || {});
  }

  function modelo(id) {
    for (var i = 0; i < MODELOS.length; i++) if (MODELOS[i].id === (id || cargado)) return MODELOS[i];
    return null;
  }

  w.LocalAI = {
    MODELOS: MODELOS,
    soportado: soportado, diagnosticar: diagnosticar, catalogo: catalogo,
    instalar: instalar, cancelar: cancelar, liberar: liberar, borrar: borrar,
    instalado: instalado, listo: listo, disponible: disponible,
    generar: generar, modelo: modelo,
    urlMotor: function () { return URL_MOTOR; }
  };
})(window);
