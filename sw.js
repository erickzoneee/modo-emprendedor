/* ==========================================================================
   MODO EMPRENDEDOR — Service worker

   Hace dos cosas:
     · deja instalar la app (Chrome exige un service worker con manejador fetch);
     · la hace funcionar sin conexión de verdad, no solo "abrir".

   Estrategias:
     · navegación  → red primero, caché si falla. Así un despliegue nuevo se ve
                     enseguida y sin conexión la app sigue abriendo.
     · resto       → caché primero y revalidación en segundo plano. Arranque
                     instantáneo, y la copia se refresca sola para la próxima.

   Al publicar una versión nueva hay que subir VERSION: eso crea una caché
   nueva, vuelve a precargar todo y borra la anterior. Sin ese cambio, los
   usuarios que ya instalaron seguirían viendo los archivos viejos.
   ========================================================================== */
'use strict';

/* La marca la manda js/data/brand.js, que está escrito para funcionar también
   aquí dentro: se cuelga de `self`, no de `window`. Si por lo que sea no se
   pudiera traer, el service worker sigue con los valores de siempre en vez de
   quedarse sin caché, que sería mucho peor que estar desactualizado. */
try { importScripts('./js/data/brand.js'); } catch (e) {
  console.warn('[sw] no se pudo cargar la marca, se usan los valores de reserva', e);
}

var MARCA = self.BRAND || {};

var VERSION = (MARCA.cachePrefijos ? MARCA.cachePrefijos[0] : 'modo-emprendedor-') + 'v1.13.0';

/* Los nombres de caché que son nuestros. Todo lo demás que viva en este origen
   —los pesos del modelo de IA local, por ejemplo, que ocupan cientos de megas—
   pertenece a otro y no se toca.

   Es una lista y no una sola cadena porque al cambiar de marca habrá que
   seguir limpiando las cachés viejas: el prefijo nuevo se añade delante y el
   antiguo se queda hasta que ya no quede nadie con él. */
var PREFIJOS = MARCA.cachePrefijos || ['modo-emprendedor-'];

function esNuestra(nombre) {
  for (var i = 0; i < PREFIJOS.length; i++) {
    if (nombre.indexOf(PREFIJOS[i]) === 0) return true;
  }
  return false;
}

/* Dónde vive el caparazón de la app. Sirve para no confundir cualquier HTML
   del origen (los documentos de /docs/, sin ir más lejos) con la portada. */
var BASE = new URL('./', self.location.href).pathname;

function esCaparazon(url) {
  return url.pathname === BASE || url.pathname === BASE + 'index.html';
}

/* Red primero está bien mientras la red conteste. En una red lenta, o en un
   wifi cautivo que se traga la petición sin cerrarla, la navegación se quedaba
   esperando para siempre y la app no llegaba a usar nunca la copia que ya
   tiene guardada. */
function conTiempo(promesa, ms) {
  return new Promise(function (resolve, reject) {
    var hecho = false;
    var t = setTimeout(function () {
      if (hecho) return;
      hecho = true;
      reject(new Error('tiempo agotado'));
    }, ms);
    promesa.then(function (v) {
      if (hecho) return;
      hecho = true; clearTimeout(t); resolve(v);
    }, function (e) {
      if (hecho) return;
      hecho = true; clearTimeout(t); reject(e);
    });
  });
}

/* Todo lo que hace falta para arrancar sin red. Rutas relativas al ámbito del
   service worker: en GitHub Pages la app vive en /modo-emprendedor/, no en la
   raíz, así que cualquier ruta absoluta que empiece por "/" apuntaría fuera. */
var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',

  './css/fonts.css',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  './css/iconos.css',
  './css/temas.css',
  './css/splash.css',

  './assets/fonts/nunito-latin.woff2',
  './assets/fonts/nunito-latin-ext.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon-180.png',

  // La pantalla de arranque tiene que estar guardada sí o sí: es lo primero
  // que se pide al abrir, y sin ella el arranque sin conexión enseñaría el
  // caparazón vacío justo cuando peor se ve.
  './js/core/splash.js',
  './js/core/store.js',
  './js/core/audio.js',
  './js/core/fx.js',
  './js/core/ui.js',
  './js/core/iconos.js',
  './js/core/mascot.js',
  './js/core/speech.js',
  './js/core/venture.js',
  './js/core/ai-worker.js',
  // js/local/motor.mjs NO va aquí a propósito: la IA local se descarga solo si
  // el usuario la pide, y la app debe pesar lo mismo para quien no la quiera.
  './js/core/local-ai.js',
  './js/core/ai.js',
  './js/core/personalize.js',
  './js/core/persona.js',
  './js/core/chispa.js',
  './js/core/engine.js',
  './js/core/mentor.js',
  './js/core/comparte.js',

  './js/data/brand.js',
  './js/data/iconos.js',
  './js/data/config.js',
  './js/data/lessons-1.js',
  './js/data/lessons-2.js',
  './js/data/lessons-3.js',
  './js/data/lessons-4.js',
  './js/data/lessons-5.js',
  './js/data/lessons-6.js',
  './js/data/lessons-7.js',
  './js/data/lessons-8.js',
  './js/data/sim.js',
  './js/data/mentor-kb.js',
  './js/data/venture-templates.js',
  './js/data/mascota-capas.js',
  './js/data/logros-compartibles.js',
  './js/data/kb.js',

  './js/screens/onboarding.js',
  './js/screens/home.js',
  './js/screens/lesson.js',
  './js/screens/mission.js',
  './js/screens/simulator.js',
  './js/screens/mentor.js',
  './js/screens/business.js',
  './js/screens/venture.js',
  './js/screens/personaliza.js',
  './js/screens/comparte.js',
  './js/screens/profile.js',
  './js/screens/league.js',
  './js/screens/shop.js',

  './js/app.js'
];

/* ---------------------------- Instalación ---------------------------- */

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // Uno por uno a propósito: cache.addAll() aborta el precargado entero si
      // un solo archivo falla, y entonces la app se queda sin caché sin avisar.
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(new Request(url, { cache: 'reload' })).catch(function (err) {
          console.warn('[sw] no se pudo precargar', url, err);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* ---------------------------- Activación ---------------------------- */

self.addEventListener('activate', function (e) {
  e.waitUntil(
    /* Solo las nuestras y solo las viejas. Antes esto borraba TODAS las cachés
       del origen, y entre ellas están las del modelo de IA local: cada
       despliegue le costaba al usuario volver a descargar cientos de megas
       que ya tenía, sin avisar y sin motivo. */
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION && esNuestra(k)) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* ---------------------------- Peticiones ---------------------------- */

/* En local no se intercepta nada. El service worker sirve la copia guardada al
   editar un archivo, así que en desarrollo lo único que hace es enseñar
   versiones viejas. Se sigue registrando —para poder probar la instalación—
   pero no toca las peticiones. */
var EN_LOCAL = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('fetch', function (e) {
  if (EN_LOCAL) return;
  var req = e.request;

  // Solo GET. Y solo del mismo origen: las llamadas a la API de Anthropic
  // (mentor con IA) no deben pasar por aquí ni acabar en ninguna caché.
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  // El laboratorio (/lab/) queda fuera por completo: no se precarga, no se
  // guarda y no se sirve desde aquí. Así sus pruebas no ensucian la caché de
  // la app ni reciben versiones viejas de sus propios archivos.
  if (url.pathname.indexOf('/lab/') >= 0) return;

  // Navegación: red primero para que un despliegue nuevo se note al momento.
  if (req.mode === 'navigate') {
    // Una sola petición: la carrera contra el reloj y el rescate final
    // comparten esta misma, para no pedir la página dos veces.
    var red = fetch(req);
    e.respondWith(
      conTiempo(red, 6000).then(function (res) {
        /* Un 404 o un 500 no es una respuesta: es un despliegue caído o un
           dominio apagado. Antes se entregaba tal cual, y una app instalada
           acababa mostrando para siempre el error del servidor con su copia
           offline completa e intacta al lado, sin usarla. */
        if (!res || !res.ok) {
          var err = new Error('respuesta no utilizable');
          err.respuesta = res;
          throw err;
        }
        /* Solo el caparazón se guarda como portada. Navegar a un documento de
           /docs/ guardaba ESA página como './index.html', y sin conexión la
           app abría el documento en lugar de sí misma. */
        if (esCaparazon(url)) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put('./index.html', copy); });
        }
        return res;
      }).catch(function (err) {
        // ignoreSearch: los accesos directos abren ./?go=mentor y ese parámetro
        // no debe impedir que se encuentre la copia guardada.
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          // Ojo: caches.match() devuelve una promesa, que siempre es "verdadera".
          // Encadenar estas alternativas con || dejaría la última sin usarse nunca.
          return caches.match('./index.html').then(function (idx) {
            if (idx) return idx;
            return caches.match('./').then(function (raiz) {
              if (raiz) return raiz;
              // Sin ninguna copia guardada no hay nada mejor que la red, por
              // lenta que vaya: cortar aquí dejaría la pantalla en blanco justo
              // a quien todavía no tiene la app guardada —primera visita, o un
              // precargado que falló entero—. El tiempo máximo está para
              // rescatar al que sí tiene copia, no para castigar al que no.
              // Y si la respuesta era un 404 de verdad, se ve como el 404 que es.
              return (err && err.respuesta) || red;
            });
          });
        });
      })
    );
    return;
  }

  // Resto: caché primero, y se revalida por detrás para la siguiente visita.
  e.respondWith(
    caches.match(req).then(function (hit) {
      var red = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || red;
    })
  );
});
