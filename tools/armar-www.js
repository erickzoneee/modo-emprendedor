/* ==========================================================================
   ARMAR www/ — lo que va dentro de la app de iPhone

   La app de la App Store es esta misma web con sus archivos metidos en el
   paquete, no una ventana que la carga de internet. Eso es lo que hace que
   funcione sin conexión desde el primer arranque, y lo que Apple pide para no
   rechazarla por ser «una web envuelta» (regla 4.2).

   QUÉ ARCHIVOS

   Los del PRECACHE de sw.js, y ni uno más. Esa lista ya es, por definición,
   todo lo que la app necesita para arrancar sin red, y tools/check-precache.js
   ya falla si index.html carga algo que no esté en ella. Una segunda lista
   aquí sería una segunda cosa que mantener y que un día se separaría de la
   primera sin que nada avisara.

   Así se quedan fuera, sin tener que nombrarlos: lab/, docs/, tools/, los
   Workers, el propio sw.js —en el iPhone no se registra— y js/local/, el
   motor de la IA local, que Apple no dejaría pasar porque se descarga código
   de internet al usarse.

   Uso:
     node tools/armar-www.js        (o npm run www)

   Sale con código 1 si falta algún archivo de la lista.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'www');

const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
const bloque = sw.match(/var PRECACHE = \[([\s\S]*?)\];/);
if (!bloque) {
  console.error('✗ no encuentro la lista PRECACHE en sw.js');
  process.exit(1);
}

const rutas = [...bloque[1].matchAll(/'([^']+)'/g)]
  .map(m => m[1].replace(/^\.\//, ''))
  .filter(r => r && r !== '' && !r.endsWith('/'));

fs.rmSync(destino, { recursive: true, force: true });

const faltan = [];
let bytes = 0;
for (const r of rutas) {
  const origen = path.join(raiz, r);
  if (!fs.existsSync(origen)) { faltan.push(r); continue; }
  const fin = path.join(destino, r);
  fs.mkdirSync(path.dirname(fin), { recursive: true });
  fs.copyFileSync(origen, fin);
  bytes += fs.statSync(origen).size;
}

if (faltan.length) {
  console.error('✗ el PRECACHE nombra archivos que no existen:\n  · ' + faltan.join('\n  · '));
  process.exit(1);
}

/* Lo que index.html carga con <script src> o <link href> tiene que haber
   llegado. Es lo mismo que comprueba check-precache, repetido aquí porque
   un fallo en el paquete del iPhone no se ve hasta que alguien lo abre. */
const html = fs.readFileSync(path.join(destino, 'index.html'), 'utf8');
const pedidos = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
const huecos = pedidos.filter(p => !fs.existsSync(path.join(destino, p)));
if (huecos.length) {
  console.error('✗ index.html pide archivos que no van en el paquete:\n  · ' + huecos.join('\n  · '));
  process.exit(1);
}

console.log('✓ www/ armado: ' + rutas.length + ' archivos, ' + (bytes / 1024 / 1024).toFixed(1) + ' MB.');
