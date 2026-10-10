/* ==========================================================================
   LAS IMÁGENES DE LA APP DE IPHONE

   Dos cosas, las dos dentro de ios/App/App/Assets.xcassets:

   · EL ICONO. 1024×1024 y SIN canal alfa: App Store Connect rechaza el
     paquete entero si el icono lo tiene, aunque sea opaco de punta a punta.
     Sale de assets/icons/fuente/chispa-icono.webp, Chispa en 3D, y se pinta
     con el Chrome o el Edge que haya en la máquina (Node no lee WebP).

     Ese archivo viene con las esquinas ya redondeadas y en NEGRO. Apple lo
     quiere cuadrado: el redondeo lo pone el iPhone, con una curva más
     cerrada que la del dibujo. Así que el negro de las esquinas se cambia por
     el naranja que tiene el dibujo justo al lado de cada una, y queda dentro
     de lo que el iPhone recorta: no se ve nunca, y el dibujo no se toca ni se
     escala. Sin esto, la curva del iPhone y la del dibujo no coinciden y
     asoma un filo negro en las cuatro esquinas.

   · EL ARRANQUE. Lo que enseña iOS antes de que cargue la app: naranja liso,
     del mismo color con el que arranca la web, para que el paso de una cosa a
     la otra no se note. Sin dibujo: el dibujo lo pone splash.js un instante
     después, animado.

   Uso:
     node tools/ios-imagenes.js
   ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const png = require('./png.js');

const raiz = path.join(__dirname, '..');
const activos = path.join(raiz, 'ios/App/App/Assets.xcassets');
const NARANJA = [0xFF, 0x6B, 0x1A];   // background_color del manifest

function navegador() {
  const candidatos = [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium'
  ].filter(Boolean);
  const hay = candidatos.find(c => fs.existsSync(c));
  if (!hay) throw new Error('no encuentro Chrome ni Edge; pon su ruta en la variable CHROME');
  return hay;
}

/* ---------------------------------------------------------- el icono -- */
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emprendo-icono-'));
  const fuente = path.join(raiz, 'assets/icons/fuente/chispa-icono.webp').replace(/\\/g, '/');
  const html = path.join(tmp, 'icono.html');
  /* En cada esquina, el color de referencia es el del dibujo un poco hacia
     dentro por el borde de arriba o de abajo, donde ya no hay negro. Cada
     píxel de la esquina se lee como «referencia por una opacidad a» —que es
     lo que es el borde suavizado entre el naranja y el negro— y se completa
     con lo que le falta de referencia. El negro puro queda en naranja, el
     borde suavizado también, y lo que ya era naranja no cambia. */
  fs.writeFileSync(html, `<!doctype html>
<style>html,body{margin:0;background:#000}canvas{display:block}</style>
<canvas id="c" width="1024" height="1024"></canvas>
<script>
  var img = new Image();
  img.onload = function () {
    var c = document.getElementById('c').getContext('2d');
    c.drawImage(img, 0, 0, 1024, 1024);
    var L = 200;   // lado de la zona de cada esquina; el redondeo del dibujo mide ~120
    [[0, 0, 210, 6], [1024 - L, 0, 814, 6], [0, 1024 - L, 210, 1017], [1024 - L, 1024 - L, 814, 1017]].forEach(function (q) {
      var ref = c.getImageData(q[2], q[3], 1, 1).data;
      var sumRef = ref[0] + ref[1] + ref[2];
      var zona = c.getImageData(q[0], q[1], L, L), d = zona.data;
      for (var i = 0; i < d.length; i += 4) {
        var a = Math.min(1, (d[i] + d[i + 1] + d[i + 2]) / sumRef);
        for (var k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.round(d[i + k] + (1 - a) * ref[k]));
        d[i + 3] = 255;
      }
      c.putImageData(zona, q[0], q[1]);
    });
  };
  img.src = 'file:///${fuente}';
</script>`);
  const salida = path.join(tmp, 'icono.png');

  execFileSync(navegador(), [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1024,1024',
    '--allow-file-access-from-files', '--virtual-time-budget=4000',
    '--screenshot=' + salida, 'file:///' + html.replace(/\\/g, '/')
  ], { stdio: 'ignore' });

  const img = png.leer(fs.readFileSync(salida));
  if (img.ancho !== 1024 || img.alto !== 1024) {
    throw new Error('el icono salió de ' + img.ancho + '×' + img.alto + ', no de 1024×1024');
  }
  /* Si la imagen no llegó a cargarse, la captura sale negra. Una esquina
     negra o una del naranja de siempre dicen lo mismo: que algo falló. */
  const centro = (512 * 1024 + 512) * img.canales;
  if (img.px[centro] + img.px[centro + 1] + img.px[centro + 2] < 60) {
    throw new Error('el icono salió negro: Chrome no llegó a pintar la imagen');
  }
  if (img.canales === 4) {
    for (let i = 3; i < img.px.length; i += 4) {
      if (img.px[i] !== 255) throw new Error('al icono le quedó transparencia');
    }
  }
  // El nombre es el que trae la plantilla de Capacitor en Contents.json.
  fs.writeFileSync(path.join(activos, 'AppIcon.appiconset/AppIcon-512@2x.png'), png.escribirRGB(img));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('✓ icono 1024×1024, sin alfa');
}

/* -------------------------------------------------------- el arranque -- */
{
  const liso = png.liso(2732, 2732, NARANJA);
  for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    fs.writeFileSync(path.join(activos, 'Splash.imageset', f), liso);
  }
  console.log('✓ arranque naranja liso, 2732×2732');
}
