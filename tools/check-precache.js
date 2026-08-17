/* ==========================================================================
   VERIFICADOR DEL PRECACHE

   index.html carga los archivos y sw.js los precarga, y las dos listas se
   escriben a mano. No hay build ni CI que las cuadre, así que se pueden
   desincronizar sin que nada avise.

   Y el fallo es de los caros: sw.js precarga uno por uno con un .catch por
   archivo, así que una ruta que falta o está mal escrita solo deja un aviso en
   la consola. La app se instala igual, y luego no abre sin conexión.

   Además comprueba que exista lo que se referencia y que los archivos que
   están en el precache existan de verdad en el disco.

   Uso:
     node tools/check-precache.js

   Sale con código 1 si algo no cuadra, para poder encadenarlo antes de un push.
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');

function leer(rel) {
  return fs.readFileSync(path.join(raiz, rel), 'utf8');
}

/* ---------- Lo que carga index.html ---------- */

function cargadosPorIndex() {
  var html = leer('index.html');
  var out = [];
  var re = /(?:<script[^>]+src|<link[^>]+href)="([^"]+)"/g;
  var m;
  while ((m = re.exec(html))) {
    var url = m[1];
    // Solo lo local: nada de data:, http: ni el manifest, que ya va aparte.
    if (/^(https?:|data:|\/\/)/.test(url)) continue;
    if (!/\.(js|css)$/.test(url)) continue;
    out.push('./' + url.replace(/^\.\//, ''));
  }
  return out;
}

/* ---------- Lo que precarga el service worker ---------- */

function precache() {
  var sw = leer('sw.js');
  var bloque = /var PRECACHE = \[([\s\S]*?)\];/.exec(sw);
  if (!bloque) {
    console.error('No encontré el array PRECACHE en sw.js.');
    process.exit(1);
  }
  var out = [];
  var re = /'([^']+)'/g, m;
  while ((m = re.exec(bloque[1]))) out.push(m[1]);
  return out;
}

/* ---------- Comprobaciones ---------- */

var enIndex = cargadosPorIndex();
var enSW = precache();
var problemas = [];

// 1) Todo lo que carga index.html tiene que estar precargado, o la app no
//    arranca sin conexión.
enIndex.forEach(function (f) {
  if (enSW.indexOf(f) < 0) problemas.push('FALTA en el PRECACHE de sw.js: ' + f);
});

// 2) Todo lo precargado tiene que existir. Una ruta mal escrita falla en
//    silencio: cache.add() lleva su propio .catch por archivo.
enSW.forEach(function (f) {
  if (f === './') return;                       // la raíz la sirve el servidor
  var abs = path.join(raiz, f.replace(/^\.\//, ''));
  if (!fs.existsSync(abs)) problemas.push('NO EXISTE el archivo precargado: ' + f);
});

// 3) Nada duplicado: precargar dos veces no rompe, pero delata un descuido.
var vistos = {};
enSW.forEach(function (f) {
  if (vistos[f]) problemas.push('DUPLICADO en el PRECACHE: ' + f);
  vistos[f] = true;
});

// 4) Subir VERSION es lo único que hace que quien ya instaló reciba los
//    archivos nuevos. Sin eso se le sirve HTML nuevo con JS viejo.
var version = /var VERSION = '([^']+)'/.exec(leer('sw.js'));
console.log('Versión del service worker: ' + (version ? version[1] : '(no encontrada)'));
console.log('index.html carga ' + enIndex.length + ' archivos · el precache tiene ' + enSW.length + ' rutas');

if (problemas.length) {
  console.error('\n' + problemas.length + ' problema(s):');
  problemas.forEach(function (p) { console.error('  · ' + p); });
  process.exit(1);
}

console.log('\nTodo cuadra. Recuerda subir VERSION en sw.js si cambiaste algún archivo.');
