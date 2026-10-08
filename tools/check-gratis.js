/* ==========================================================================
   VERIFICADOR DE LO GRATUITO — que Impulso no cierre nada

   Este es el verificador que sostiene la promesa de la pantalla de cobro:
   «Las lecciones y los retos son gratis, y lo van a seguir siendo».

   Una promesa así no se puede confiar a que nadie se despiste. El día que
   alguien quiera subir la conversión, cerrar el último nivel detrás del pago
   son tres líneas, y no fallaría nada: la app seguiría arrancando, los tests
   que no existen seguirían sin correr y el texto de la pantalla seguiría
   diciendo que todo es gratis. Este script es lo único que lo notaría.

   CINCO COMPROBACIONES

   1. Un usuario SIN Impulso llega del primer nodo de la ruta al último. Se
      ejecuta `Engine.pathState()` de verdad, con un Store de mentira, y se
      recorre la ruta completando cada nodo. Si alguno no se puede alcanzar
      sin pagar, falla.

   2. `Engine.loseHeart()` no bloquea: con cero vidas se puede seguir. Lo que
      cambia es el multiplicador, no el acceso.

   3. Sin energía se sigue ganando XP, aunque sea menos. Un multiplicador de
      cero convertiría la energía en una barrera con otro nombre.

   4. La lista blanca de sitios donde puede aparecer un anuncio no crece sin
      que alguien lo decida. Está escrita a mano aquí abajo, igual que en
      check-vitrina.js y por la misma razón: ampliarla tiene que ser una
      edición deliberada que se vea en el diff.

   5. Ninguna pantalla de contenido pregunta por Impulso. Si `lesson.js`,
      `mission.js` o `simulator.js` empiezan a consultar el plan para decidir
      qué enseñar, es que algo de la ruta dejó de ser gratis.

   Uso:
     node tools/check-gratis.js
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

/* ==========================================================================
   LA LISTA BLANCA — escrita a mano, igual que en check-vitrina.js

   Estos son los DOS únicos huecos donde este proyecto acepta publicidad, y
   los dos son sitios donde el usuario ya terminó algo. Si alguien añade un
   tercero en js/core/anuncios.js sin tocar esta lista, el script falla.
   ========================================================================== */
var HUECOS_PERMITIDOS = ['leccion', 'ruta'];

/* Las pantallas por las que pasa el contenido gratuito. Ninguna puede
   consultar el plan: si lo hace, es que enseña cosas distintas según quién
   pague, y eso es exactamente lo que este proyecto dijo que no iba a hacer.

   lesson.js es la excepción declarada: enseña la INVITACIÓN a Impulso en el
   modal de cero energía, y para eso tiene que preguntar si ya lo tiene. Por
   eso se le permite `ImpulsoScreen.guino` y `energiaIlimitada`, y nada más. */
var PANTALLAS_DE_CONTENIDO = {
  'js/screens/mission.js': [],
  'js/screens/simulator.js': [],
  'js/screens/business.js': [],
  'js/screens/lesson.js': ['ImpulsoScreen', 'guinoImpulso', 'energiaIlimitada']
};

/* ==========================================================================
   UN WINDOW DE MENTIRA

   La app son scripts clásicos que se cuelgan de `window`. Se ejecutan aquí
   con un window falso que trae lo mínimo: Store, Sound y los datos. Es el
   mismo truco de check-captura.js y check-motor.js.
   ========================================================================== */

function montarApp(conImpulso) {
  var ventana = {
    Sound: { xp: nada, coin: nada, tap: nada, heartLost: nada, buzz: nada, complete: nada, streak: nada, cash: nada, wrong: nada, select: nada },
    setTimeout: function () {},
    Impulso: { activo: function () { return !!conImpulso; } }
  };
  function nada() {}

  ['js/data/config.js',
   'js/data/lessons-1.js', 'js/data/lessons-2.js', 'js/data/lessons-3.js',
   'js/data/lessons-4.js', 'js/data/lessons-5.js', 'js/data/lessons-6.js',
   'js/data/lessons-7.js', 'js/data/lessons-8.js'
  ].forEach(function (f) { new Function('window', leer(f))(ventana); });

  /* El estado. No se carga store.js entero —arrastra localStorage y
     temporizadores— sino que se le da al motor la forma que espera. Es la
     misma forma que devuelve `defaults()`, recortada a lo que toca. */
  var estado = {
    xp: 0, coins: 0, hearts: 5, heartsTs: Date.now(), boostUntil: 0,
    streak: 0, bestStreak: 0, lastDay: null, freezes: 0,
    xpToday: 0, xpTodayDay: null, dailyGoal: 30,
    lessons: {}, missions: {}, badges: [], unlockedLevels: 1, startIndex: 0,
    profile: { goal: 'zero', knowledge: 'none' },
    league: { week: null, xp: 0, tier: 0, bots: [] },
    weekly: { week: null, progress: {}, claimed: [] },
    stats: { answers: 0, correct: 0, lessons: 0, missions: 0, days: [], minutes: 0 },
    settings: {}
  };

  ventana.Store = {
    state: estado,
    set: function (fn) { fn(estado); return estado; },
    today: function () { return '2026-01-01'; },
    daysBetween: function () { return 0; },
    weekKey: function () { return '2026-W01'; },
    save: function () {}
  };

  new Function('window', leer('js/core/engine.js'))(ventana);
  return ventana;
}

/* ==========================================================================
   1 · LA RUTA ENTERA, SIN PAGAR
   ========================================================================== */

function recorrerSinPagar() {
  var W = montarApp(false);
  var ruta = W.Engine.buildPath();

  if (!ruta.length) { fallos.push('la ruta salió vacía: el motor no cargó bien'); return 0; }

  /* Se recorre completando cada nodo, igual que lo haría una persona. En cada
     vuelta se comprueba que el nodo que toca esté alcanzable —no 'locked'—
     antes de darlo por hecho. */
  var alcanzados = 0;

  for (var i = 0; i < ruta.length; i++) {
    var estados = W.Engine.pathState();
    var actual = estados[i];

    if (!actual) { fallos.push('pathState() devolvió menos nodos que buildPath()'); break; }

    if (actual.state === 'locked') {
      fallos.push('sin pagar no se llega al nodo ' + (i + 1) + ' de ' + ruta.length +
                  ' («' + ruta[i].id + '», nivel ' + ruta[i].level + '): quedó cerrado');
      break;
    }

    alcanzados++;

    // Se completa y se sigue. Es lo que hace completeLesson/completeMission.
    var id = ruta[i].id;
    if (ruta[i].kind === 'lesson') W.Store.state.lessons[id] = { done: true, score: 100 };
    else W.Store.state.missions[id] = { done: true, score: 100 };
    W.Store.state.unlockedLevels = 8;
  }

  if (alcanzados === ruta.length) return ruta.length;
  return alcanzados;
}

/* ==========================================================================
   2 y 3 · LA ENERGÍA MARCA EL RITMO, NO EL ACCESO
   ========================================================================== */

function energiaNoBloquea() {
  var W = montarApp(false);

  // Con cero vidas, loseHeart() no revienta y devuelve cero.
  W.Store.state.hearts = 0;
  var quedan = W.Engine.loseHeart();
  if (quedan !== 0) fallos.push('loseHeart() con cero vidas devolvió ' + quedan + ' en vez de 0');

  if (!W.Engine.sinEnergia()) {
    fallos.push('con cero vidas y sin Impulso, sinEnergia() dice que sí hay energía');
  }

  // El multiplicador baja, pero NUNCA a cero: eso sería una barrera.
  var mult = W.Engine.xpMultiplier();
  if (!(mult > 0)) {
    fallos.push('sin energía el multiplicador de XP es ' + mult + ': eso convierte la energía en un muro');
  }
  if (!(mult < 1)) {
    fallos.push('sin energía el multiplicador de XP es ' + mult + ': la energía no regula nada');
  }

  // Y se siguen ganando puntos de verdad.
  var antes = W.Store.state.xp;
  W.Engine.addXP(20, true);
  if (!(W.Store.state.xp > antes)) {
    fallos.push('sin energía no se gana ni un punto: la lección deja de contar');
  }

  // Con Impulso, la energía no baja y el multiplicador vuelve a 1.
  var P = montarApp(true);
  P.Store.state.hearts = 3;
  P.Engine.loseHeart();
  if (P.Store.state.hearts !== 3) {
    fallos.push('con Impulso, loseHeart() gastó una vida (' + P.Store.state.hearts + ')');
  }
  P.Store.state.hearts = 0;
  if (P.Engine.sinEnergia()) fallos.push('con Impulso, sinEnergia() dice que se quedó sin energía');
  if (P.Engine.xpMultiplier() !== 1) {
    fallos.push('con Impulso y cero vidas, el multiplicador es ' + P.Engine.xpMultiplier() + ' en vez de 1');
  }

  return true;
}

/* ==========================================================================
   4 · LOS HUECOS DE ANUNCIOS NO CRECEN SOLOS
   ========================================================================== */

function huecosDeclarados() {
  var src = leer('js/core/anuncios.js');
  var m = src.match(/var HUECOS = \{([\s\S]*?)\};/);
  if (!m) { fallos.push('no se pudo leer la tabla HUECOS de js/core/anuncios.js'); return; }

  var encontrados = [];
  m[1].split('\n').forEach(function (linea) {
    var k = linea.match(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/);
    if (k) encontrados.push(k[1]);
  });

  encontrados.forEach(function (h) {
    if (HUECOS_PERMITIDOS.indexOf(h) < 0) {
      fallos.push('hueco de anuncios nuevo sin declarar: «' + h + '». ' +
                  'Si de verdad va ahí, añádelo a HUECOS_PERMITIDOS de este script y explica por qué.');
    }
  });
  HUECOS_PERMITIDOS.forEach(function (h) {
    if (encontrados.indexOf(h) < 0) {
      fallos.push('el hueco «' + h + '» está declarado aquí pero ya no existe en anuncios.js');
    }
  });

  /* Y la regla que no se puede leer de una tabla: con Impulso no se carga ni
     el script. Se comprueba que la comprobación siga escrita. */
  if (!/Impulso[\s\S]{0,60}activo\(\)/.test(src)) {
    fallos.push('js/core/anuncios.js ya no comprueba si la persona tiene Impulso antes de enseñar publicidad');
  }
  if (!/stats\.lessons/.test(src)) {
    fallos.push('js/core/anuncios.js ya no comprueba que haya terminado su primera lección');
  }
}

/* ==========================================================================
   5 · LAS PANTALLAS DE CONTENIDO NO PREGUNTAN QUIÉN PAGA
   ========================================================================== */

/** Vacía los comentarios dejando los saltos de línea en su sitio, para que
    los números de línea del archivo original sigan valiendo.

    Hace falta hacerlo sobre el archivo ENTERO y no línea a línea: los
    comentarios de este repositorio son párrafos de diez líneas, y uno que
    mencione «Impulso» al explicar por qué algo NO depende de Impulso es
    exactamente el falso positivo que este script no puede permitirse. */
function sinComentarios(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, function (bloque) {
      return bloque.replace(/[^\n]/g, ' ');
    })
    .replace(/(^|[^:])\/\/[^\n]*/g, function (m, antes) {
      return antes + m.slice(antes.length).replace(/./g, ' ');
    });
}

function pantallasLimpias() {
  Object.keys(PANTALLAS_DE_CONTENIDO).forEach(function (rel) {
    var permitidas = PANTALLAS_DE_CONTENIDO[rel];
    var lineas = sinComentarios(leer(rel)).split('\n');

    lineas.forEach(function (linea, i) {
      if (!/Impulso/.test(linea)) return;

      var permitida = permitidas.some(function (p) { return linea.indexOf(p) >= 0; });
      if (!permitida) {
        fallos.push(rel + ':' + (i + 1) + ' consulta Impulso para decidir algo. ' +
                    'El contenido es igual para todos: si esto es a propósito, ' +
                    'declara la excepción en PANTALLAS_DE_CONTENIDO de este script.');
      }
    });
  });
}

/* ================================= Salida ================================= */

var nodos = 0;
try {
  nodos = recorrerSinPagar();
  energiaNoBloquea();
  huecosDeclarados();
  pantallasLimpias();
} catch (e) {
  console.error('✗ no se pudo comprobar lo gratuito: ' + e.message);
  process.exit(1);
}

if (fallos.length) {
  console.error('✗ lo gratuito: ' + fallos.length + ' problema(s)\n');
  fallos.forEach(function (f) { console.error('  · ' + f); });
  process.exit(1);
}

console.log('✓ lo gratuito sigue completo: ' + nodos + ' paradas alcanzables sin pagar, ' +
  'la energía no bloquea ninguna y los anuncios solo caben en ' + HUECOS_PERMITIDOS.length + ' huecos.');
