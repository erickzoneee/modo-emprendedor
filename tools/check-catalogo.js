/* ==========================================================================
   VERIFICADOR DEL CATÁLOGO DE LOGROS COMPARTIBLES

   js/data/logros-compartibles.js es una tabla declarativa: cada logro dice qué
   campos puede publicar, desde qué etapa y con qué cierre. Nada comprueba que
   lo declarado exista de verdad al otro lado, y el fallo es silencioso — un
   campo que el motor no sabe producir sale como cadena vacía, y una entrada de
   cierre que ninguna etapa puede alcanzar se queda ahí para siempre sin que
   nadie la ejecute.

   Los tres defectos que había cuando se escribió este script:
     · `sector` estaba declarado en la lista blanca del logro `idea` y datosDe()
       lo fijaba a '' — campo muerto.
     · `tema` estaba declarado en los seis logros y no lo leía nadie.
     · Ocho de las 24 entradas de CIERRE eran inalcanzables por etapa mínima.

   Comprueba también el contraste de los tres estilos, porque el acento pinta
   la pregunta —lo único que puede devolverle una respuesta al usuario— y ya
   estuvo por debajo del mínimo legible en dos de los tres.

   Uso:
     node tools/check-catalogo.js

   Sale con código 1 si algo no cuadra, para poder encadenarlo antes de un push.
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];
var avisos = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

/* El catálogo es un IIFE que cuelga de window. Se ejecuta con un window de
   mentira: no depende de nada más, así que no hace falta un navegador. */
function catalogo() {
  var src = leer('js/data/logros-compartibles.js');
  var ventana = {};
  new Function('window', src)(ventana);
  if (!ventana.LOGROS_COMPARTIBLES) throw new Error('el catálogo no se publicó en window');
  return ventana.LOGROS_COMPARTIBLES;
}

/* ------------------------------------------------------------------
   Qué campos sabe producir el motor. Se leen del propio comparte.js en
   vez de copiarlos aquí: una lista duplicada se desincroniza igual que
   las dos que este script existe para vigilar.
   ------------------------------------------------------------------ */
function camposProducibles() {
  var src = leer('js/core/comparte.js');
  var m = src.match(/var todo = \{([\s\S]*?)\n    \};/);
  if (!m) {
    fallos.push('no se pudo localizar el objeto `todo` de datosDe() en js/core/comparte.js');
    return null;
  }
  var claves = [];
  m[1].split('\n').forEach(function (linea) {
    var k = linea.match(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/);
    if (k) claves.push(k[1]);
  });
  return claves;
}

/** Qué intenciones puede llegar a tener un logro, dada su etapa mínima. */
function intencionesAlcanzables(C, logro) {
  var out = [];
  Object.keys(C.INTENCION).forEach(function (n) {
    if (Number(n) < logro.etapaMin) return;
    var i = C.INTENCION[n];
    if (out.indexOf(i) < 0) out.push(i);
  });
  return out;
}

/* ------------------------------ Contraste ------------------------------ */

function canal(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminancia(hex) {
  var h = String(hex).replace('#', '');
  var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a, b) {
  var l1 = luminancia(a), l2 = luminancia(b);
  var alto = Math.max(l1, l2), bajo = Math.min(l1, l2);
  return (alto + 0.05) / (bajo + 0.05);
}

/* ================================ Revisión ================================ */

function revisar() {
  var C = catalogo();
  var producibles = camposProducibles();
  var idsVistos = {};

  // --- Logros -------------------------------------------------------------
  C.LOGROS.forEach(function (l) {
    var donde = 'logro «' + l.id + '»';

    if (idsVistos[l.id]) fallos.push(donde + ': id repetido');
    idsVistos[l.id] = true;

    if (!l.titulo) fallos.push(donde + ': sin título');
    if (!l.tema) fallos.push(donde + ': sin tema (lo lee el selector de avances)');
    if (!l.chispa) fallos.push(donde + ': sin expresión de Chispa');
    if (!l.etapaMin || !C.INTENCION[l.etapaMin]) {
      fallos.push(donde + ': etapaMin ' + l.etapaMin + ' no es una etapa con intención declarada');
    }

    if (!l.campos || !l.campos.length) fallos.push(donde + ': lista blanca vacía');
    if (producibles) {
      (l.campos || []).forEach(function (k) {
        if (producibles.indexOf(k) < 0) {
          fallos.push(donde + ': declara el campo «' + k + '», que datosDe() no sabe producir');
        }
      });
    }

    if (!l.requiere || !l.requiere.length) fallos.push(donde + ': no exige ningún dato');

    // `exige` solo puede hablar de campos que el logro tiene permitido leer.
    (l.exige || []).forEach(function (k) {
      if ((l.campos || []).indexOf(k) < 0) {
        fallos.push(donde + ': exige «' + k + '», que no está en su lista blanca');
      }
    });

    var disp = l.disparadores || [l.id];
    if (!disp.length) fallos.push(donde + ': sin disparadores, no se ofrecerá nunca solo');

    // --- Cierres ----------------------------------------------------------
    var esperadas = intencionesAlcanzables(C, l);
    var declaradas = Object.keys(C.CIERRE[l.id] || {});

    esperadas.forEach(function (i) {
      if (declaradas.indexOf(i) < 0) {
        fallos.push(donde + ': le falta el cierre de la intención «' + i +
          '», que sí puede alcanzar desde la etapa ' + l.etapaMin);
      }
    });
    declaradas.forEach(function (i) {
      if (esperadas.indexOf(i) < 0) {
        fallos.push(donde + ': declara el cierre «' + i +
          '», inalcanzable con etapaMin ' + l.etapaMin + ' — código muerto');
      }
    });
  });

  // Cierres de logros que ya no existen.
  Object.keys(C.CIERRE).forEach(function (id) {
    if (!idsVistos[id]) fallos.push('CIERRE tiene «' + id + '», que no es ningún logro');
  });

  // --- Etapas e intenciones ----------------------------------------------
  var etapasDeclaradas = C.ETAPAS.map(function (e) { return e.n; });
  Object.keys(C.INTENCION).forEach(function (n) {
    if (etapasDeclaradas.indexOf(Number(n)) < 0) {
      fallos.push('INTENCION define la etapa ' + n + ', que ETAPAS no declara');
    }
    if (!C.APERTURA[C.INTENCION[n]]) {
      fallos.push('la intención «' + C.INTENCION[n] + '» (etapa ' + n + ') no tiene apertura');
    }
  });
  etapasDeclaradas.forEach(function (n) {
    if (!C.INTENCION[n]) fallos.push('la etapa ' + n + ' no tiene intención declarada');
  });

  // Acumulativas: cada escalón tiene que contener al anterior.
  for (var i = 1; i < C.ETAPAS.length; i++) {
    var prev = C.ETAPAS[i - 1].todos, act = C.ETAPAS[i].todos;
    prev.forEach(function (k) {
      if (act.indexOf(k) < 0) {
        fallos.push('la etapa ' + C.ETAPAS[i].n + ' no exige «' + k +
          '», que sí exigía la anterior: deja de ser acumulativa');
      }
    });
  }

  // Aperturas sin usar.
  Object.keys(C.APERTURA).forEach(function (i) {
    var usada = Object.keys(C.INTENCION).some(function (n) { return C.INTENCION[n] === i; });
    if (!usada) avisos.push('la apertura «' + i + '» no la usa ninguna etapa');
  });

  // --- Nada que huela a gamificación en la lista blanca -------------------
  var PROHIBIDOS = ['xp', 'racha', 'nivel', 'monedas', 'insignia', 'liga', 'lecciones',
                    'misiones', 'presupuesto', 'experiencia'];
  C.LOGROS.forEach(function (l) {
    (l.campos || []).forEach(function (k) {
      if (PROHIBIDOS.indexOf(String(k).toLowerCase()) >= 0) {
        fallos.push('logro «' + l.id + '»: el campo «' + k + '» es progreso dentro de la app, no del negocio');
      }
    });
  });

  // --- Contraste de los estilos ------------------------------------------
  /* Sobre fondo[0], que es el arranque del degradado y el punto más claro: el
     rótulo del logro y el cierre caen justo ahí. 3:1 es el mínimo AA para
     texto grande, y todo lo que se pinta en el visual lo es. */
  C.ESTILOS.forEach(function (e) {
    var t = contraste(e.tinta, e.fondo[0]);
    var a = contraste(e.acento, e.fondo[0]);
    if (t < 3) fallos.push('estilo «' + e.id + '»: tinta a ' + t.toFixed(2) + ':1 sobre el arranque del degradado (mínimo 3:1)');
    if (a < 3) fallos.push('estilo «' + e.id + '»: acento a ' + a.toFixed(2) + ':1 — es el color de la pregunta (mínimo 3:1)');
  });

  return C;
}

/* ================================= Salida ================================= */

var C;
try {
  C = revisar();
} catch (e) {
  console.error('✗ no se pudo leer el catálogo: ' + e.message);
  process.exit(1);
}

avisos.forEach(function (a) { console.warn('  aviso: ' + a); });

if (fallos.length) {
  console.error('✗ catálogo de logros compartibles: ' + fallos.length + ' problema(s)\n');
  fallos.forEach(function (f) { console.error('  · ' + f); });
  process.exit(1);
}

var combinaciones = C.LOGROS.reduce(function (n, l) {
  return n + Object.keys(C.CIERRE[l.id] || {}).length;
}, 0);

console.log('✓ catálogo correcto: ' + C.LOGROS.length + ' logros, ' +
  C.ETAPAS.length + ' etapas, ' + combinaciones + ' cierres, todos alcanzables.');
