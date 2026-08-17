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

var VERSION = 'modo-emprendedor-v1.7.0';

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
  './css/temas.css',

  './assets/fonts/nunito-latin.woff2',
  './assets/fonts/nunito-latin-ext.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon-180.png',

  './js/core/store.js',
  './js/core/audio.js',
  './js/core/fx.js',
  './js/core/ui.js',
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
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
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
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put('./index.html', copy); });
        }
        return res;
      }).catch(function () {
        // ignoreSearch: los accesos directos abren ./?go=mentor y ese parámetro
        // no debe impedir que se encuentre la copia guardada.
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          // Ojo: caches.match() devuelve una promesa, que siempre es "verdadera".
          // Encadenar estas alternativas con || dejaría la última sin usarse nunca.
          return caches.match('./index.html').then(function (idx) {
            return idx || caches.match('./');
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
