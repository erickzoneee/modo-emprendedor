/* ==========================================================================
   LAS CAPTURAS DE LA APP STORE

   Seis pantallas de la app de verdad, a 1320×2868 —el tamaño de iPhone de
   6,9 pulgadas que App Store Connect pide—, más la de Impulso que Apple
   pide aparte para revisar la suscripción. Salen a ios/capturas/.

   Nada está retocado ni escrito a mano: es la app servida por serve.js,
   abierta en Chrome sin ventana, con un perfil de ejemplo armado con sus
   propias funciones y con la misma bandera que pone la app de iPhone
   (window.Capacitor), así que lo que se ve es lo que se ve en el iPhone:
   sin «Instalar», sin anuncios, con el precio que pone Apple. La respuesta
   de Chispa es una respuesta de verdad del motor que funciona sin conexión.

   Uso:
     node tools/ios-capturas.js

   Hace falta Chrome o Edge (se busca solo; si no, variable CHROME).
   ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const png = require('./png.js');

const raiz = path.join(__dirname, '..');
const salida = path.join(raiz, 'ios/capturas');
const PUERTO = 4391;
const DEPURA = 9339;
// 440×956 a 3x = 1320×2868, el iPhone de 6,9".
const ANCHO = 440, ALTO = 956, ESCALA = 3;

const dormir = ms => new Promise(r => setTimeout(r, ms));

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

/* Lo que la app de iPhone pone antes de que cargue nada. Las compras dan el
   precio de México, como lo daría Apple a quien está allí. */
const IPHONE = `
  window.Capacitor = {
    isNativePlatform: function () { return true; },
    getPlatform: function () { return 'ios'; },
    Plugins: {
      NativePurchases: {
        getProducts: function () { return Promise.resolve({ products: [{ priceString: '$99.00' }] }); },
        getPurchases: function () { return Promise.resolve({ purchases: [] }); },
        addListener: function () { return { remove: function () {} }; }
      },
      Haptics: { impact: function () { return Promise.resolve(); }, notification: function () { return Promise.resolve(); } },
      Browser: { open: function () { return Promise.resolve(); } }
    }
  };`;

/* Un negocio de ejemplo, armado con las funciones de la app y con las
   fechas de hoy: doce días de racha y la primera parte de la ruta hecha. */
const PERFIL = `
  Store.reset();
  Venture.startOver();
  Venture.patchCore({ idea: 'Velas aromáticas hechas a mano con cera de soya',
    customer: 'mujeres de 25 a 40 que regalan detalles y cuidan su casa', sector: 'hechoamano', stage: 'starting' });
  Venture.set(function (vv) { vv.intake.done = true; }, 'venture-intake');
  Store.set(function (s) {
    s.profile.name = 'Ana'; s.profile.idea = 'Velas aromáticas hechas a mano con cera de soya';
    s.onboarded = true; s.xp = 640; s.coins = 340; s.streak = 12; s.bestStreak = 12;
    s.xpToday = 30; s.xpTodayDay = Store.today(); s.lastDay = Store.today();
    ['n1-01','n1-02','n1-03','n1-04','n1-05','n1-06','n1-07'].forEach(function (id, i) {
      s.lessons[id] = { done: true, score: 100, stars: i % 3 === 0 ? 2 : 3, at: Date.now() - (7 - i) * 864e5, attempts: 1 };
    });
  }, 'onboard');
  Venture.mirrorProfile();
  Store.set(function (s) { s.startIndex = Engine.recommendedStart(); }, 'route');
  try { Persona.asegurar(); } catch (e) {}
  Engine.touchDay();
  // Las insignias de la racha, dadas ya: si no, saltan encima de la captura.
  try { Engine.checkBadges(); } catch (e) {}
  Store.save(true);`;

/* Cada captura: un nombre y lo que hay que hacer en la página antes. */
const CAPTURAS = [
  ['01-ruta', `UI.Router.go('home', {}, 'none');`],
  /* Tres pasos adentro está el ejercicio de ordenar evidencias; se colocan
     dos opciones para que se vea a medio resolver, como se usa. */
  ['02-leccion', `UI.Router.go('lesson', { id: 'n2-01' }); await espera(1200);
                  for (var i = 0; i < 3; i++) { document.getElementById('foot-primary').click(); await espera(1100); }
                  await espera(800);
                  ['Qué buena idea', 'Sí, yo lo compraría'].forEach(function (txt) {
                    var b = Array.prototype.find.call(document.querySelectorAll('#view button'),
                      function (x) { return x.textContent.indexOf(txt) >= 0; });
                    if (b) b.click();
                  });`],
  /* Una conversación de verdad con el motor sin conexión: Chispa pide los
     dos datos y hace la cuenta del margen. */
  ['03-chispa', `UI.Router.go('mentor', {}, 'none'); await espera(800);
                 var di = async function (txt) {
                   var t = document.querySelector('.chat-input'); t.value = txt; t.dispatchEvent(new Event('input'));
                   document.querySelector('.chat-send').click(); await espera(3200);
                 };
                 await di('Quiero vender cada vela en 120 pesos y me cuesta 45 hacerla. ¿Me conviene?');
                 await di('120'); await di('45');`],
  ['04-negocio', `UI.Router.go('business', {}, 'none');`],
  ['05-plaza', `UI.Router.go('plaza', {}, 'none');`],
  ['06-simulador', `UI.Router.go('simulator', {}, 'none');`],
  ['revision-impulso', `BRAND.dominios.pago = 'https://pago.emprendo.life';
                        if (!Impulso.LLAVES.length) Impulso.LLAVES.push({ kty: 'EC', crv: 'P-256', x: 'x', y: 'y' });
                        UI.Router.go('impulso', {}, 'none');`]
];

async function main() {
  const servidor = spawn(process.execPath, [path.join(raiz, 'serve.js')],
    { env: Object.assign({}, process.env, { PORT: String(PUERTO) }), stdio: 'ignore' });
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'emprendo-chrome-'));
  const chrome = spawn(navegador(), [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--remote-debugging-port=' + DEPURA, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 60 && !wsUrl; i++) {
      try {
        const l = await (await fetch('http://127.0.0.1:' + DEPURA + '/json/list')).json();
        const p = l.find(t => t.type === 'page');
        if (p) wsUrl = p.webSocketDebuggerUrl;
      } catch (e) { /* todavía arrancando */ }
      if (!wsUrl) await dormir(250);
    }
    if (!wsUrl) throw new Error('Chrome no abrió el puerto de depuración');

    const ws = new WebSocket(wsUrl);
    await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
    let n = 0;
    const pendientes = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && pendientes.has(m.id)) {
        const { ok, mal } = pendientes.get(m.id);
        pendientes.delete(m.id);
        if (m.error) mal(new Error(m.error.message)); else ok(m.result);
      }
    };
    const cdp = (metodo, params) => new Promise((ok, mal) => {
      const id = ++n;
      pendientes.set(id, { ok, mal });
      ws.send(JSON.stringify({ id, method: metodo, params: params || {} }));
    });
    const enPagina = async codigo => {
      const r = await cdp('Runtime.evaluate', {
        expression: '(async function () { var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };\n' + codigo + '\n})()',
        awaitPromise: true, returnByValue: true
      });
      if (r.exceptionDetails) {
        throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      }
      return r.result && r.result.value;
    };

    await cdp('Page.enable');
    await cdp('Runtime.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: ESCALA, mobile: true });
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: IPHONE });

    const url = 'http://localhost:' + PUERTO + '/';
    await cdp('Page.navigate', { url });
    await dormir(4000);
    await enPagina(PERFIL);
    await cdp('Page.navigate', { url });
    await dormir(4500);   // la animación de arranque dura 2,45 s como mínimo

    fs.mkdirSync(salida, { recursive: true });
    for (const [nombre, pasos] of CAPTURAS) {
      /* Antes de cada captura: fuera las ventanitas de logro y los avisos, y
         se deja que el confeti termine. Son de verdad, pero tapan la
         pantalla que se quiere enseñar. */
      await enPagina(pasos + `
        await espera(1100);
        for (var k = 0; k < 5 && document.querySelector('.modal'); k++) { UI.closeModal(); await espera(450); }
        await espera(2600);
        document.querySelectorAll('.toast').forEach(function (t) { t.remove(); });
        var fx = document.getElementById('fx-canvas'); if (fx) fx.style.visibility = 'hidden';
        var v = document.getElementById('view');
        if (v) v.scrollTop = '${nombre}' === '03-chispa' ? v.scrollHeight : 0;`);
      await dormir(400);
      const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const img = png.leer(Buffer.from(shot.data, 'base64'));
      if (img.ancho !== ANCHO * ESCALA || img.alto !== ALTO * ESCALA) {
        throw new Error(nombre + ' salió de ' + img.ancho + '×' + img.alto);
      }
      fs.writeFileSync(path.join(salida, nombre + '.png'), png.escribirRGB(img));
      console.log('✓ ' + nombre + '.png  ' + img.ancho + '×' + img.alto);
    }
    ws.close();
  } finally {
    chrome.kill();
    servidor.kill();
    await dormir(500);
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* Chrome a veces tarda en soltarlo */ }
  }
}

main().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
