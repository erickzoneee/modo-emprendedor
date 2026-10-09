/* ==========================================================================
   LAS IMÁGENES DE LA APP DE IPHONE

   Dos cosas, las dos dentro de ios/App/App/Assets.xcassets:

   · EL ICONO. 1024×1024 y SIN canal alfa: App Store Connect rechaza el
     paquete entero si el icono lo tiene, aunque sea opaco de punta a punta.
     Sale de assets/icons/fuente/icono.svg, el mismo cohete de la web
     redibujado en vectores, y se pinta con el Chrome o el Edge que haya en
     la máquina. Agrandar el PNG de 512 lo dejaría borroso justo en la ficha
     de la tienda, que es donde más grande se ve.

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
  const svg = path.join(raiz, 'assets/icons/fuente/icono.svg').replace(/\\/g, '/');
  const html = path.join(tmp, 'icono.html');
  fs.writeFileSync(html,
    '<!doctype html><style>html,body{margin:0;background:#000}img{display:block;width:1024px;height:1024px}</style>' +
    '<img src="file:///' + svg + '">');
  const salida = path.join(tmp, 'icono.png');

  execFileSync(navegador(), [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1024,1024',
    '--screenshot=' + salida, 'file:///' + html.replace(/\\/g, '/')
  ], { stdio: 'ignore' });

  const img = png.leer(fs.readFileSync(salida));
  if (img.ancho !== 1024 || img.alto !== 1024) {
    throw new Error('el icono salió de ' + img.ancho + '×' + img.alto + ', no de 1024×1024');
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
