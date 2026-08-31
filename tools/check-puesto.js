/* ==========================================================================
   VERIFICADOR DEL PUESTO DECORADO

   Decorar el puesto añade un catálogo cerrado —js/data/puesto-piezas.js— que
   se escribe TRES veces: en el teléfono, en el Worker y en el esquema de la
   base. Tres copias de una lista blanca son exactamente el tipo de cosa que
   se separa sin que nadie se entere, y separarse aquí no da un error: da un
   puesto que el dueño ve de un color y sus vecinos de otro.

   Qué comprueba:
     1. Las tres listas dicen lo mismo. El catálogo del teléfono, el del
        Worker (worker-plaza/src/index.js) y el de la migración
        (0002_estilo.sql) tienen exactamente las mismas piezas.
     2. Lo de serie es el puesto de antes. Quien no toque nada tiene que ver
        el mismo puesto que ya tenía: festón, el color de su oficio y nada
        más. Se comprueba en el catálogo, en Store y en la migración.
     3. Cada pieza se pinta. Toda clave que no sea la de reserva tiene su
        regla en css/puesto.css. Una sin regla se elige, se guarda, se
        publica y no cambia nada en pantalla.
     4. Cada pieza tiene nombre. Se enseña en la pantalla de decorar.
     5. Ningún adorno se sale de su franja. Las coordenadas del dibujo caben
        en el lienzo de su zona, así que nada queda cortado por el borde de
        la Plaza ni encima del texto del puesto.
     6. Ningún adorno usa degradados ni <defs>. En la Plaza se pintan varios
        puestos a la vez y un `url(#id)` repetido es una bomba de relojería.
        Es la misma regla que ya sigue js/data/mascota-capas.js.
     7. Nada entra sin lista blanca. Se falsifica un estilo con claves
        inventadas y se comprueba que `limpio()` lo devuelve a lo de serie.
     8. El interruptor de apariencia manda. Con la apariencia apagada, lo que
        se publica es el puesto de serie.

   Uso:
     node tools/check-puesto.js

   Sale con código 1 si algo no cuadra, para poder encadenarlo antes de un push.
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

/* ==================================================================
   CARGAR EL CATÁLOGO Y SU CAPA DE VALIDACIÓN
   ================================================================== */

function cargar(conApariencia) {
  var ventana = {
    Store: {
      state: { plaza: { v: 1, vitrina: null, editada: {}, aprobadaAt: 0, rev: null, puesto: null } },
      set: function (fn) { fn(ventana.Store.state); }
    },
    /* La apariencia por emprendimiento, encendida o apagada según el caso que
       se esté probando. Es lo único que Puesto le pregunta a Persona. */
    Persona: { activa: function () { return conApariencia !== false; } }
  };

  new Function('window', leer('js/data/puesto-piezas.js'))(ventana);
  new Function('window', leer('js/core/puesto.js'))(ventana);

  if (!ventana.PUESTO_PIEZAS) throw new Error('js/data/puesto-piezas.js no se publicó en window');
  if (!ventana.Puesto) throw new Error('js/core/puesto.js no se publicó en window');
  return ventana;
}

/* ==================================================================
   1 — LAS TRES LISTAS DICEN LO MISMO
   ================================================================== */

/** Saca `toldo: ['a', 'b']` de un objeto literal escrito en JS. */
function listaJS(fuente, bloque, ranura) {
  var trozo = fuente.slice(fuente.indexOf(bloque));
  var re = new RegExp(ranura + ':\\s*\\[([^\\]]*)\\]');
  var m = re.exec(trozo);
  if (!m) return null;
  return m[1].split(',').map(function (x) { return x.trim().replace(/^'|'$/g, ''); }).filter(Boolean);
}

/** Saca la lista de un CHECK (... IN ('a','b')) del SQL. */
function listaSQL(sql, columna) {
  var re = new RegExp('CHECK \\(' + columna + " IN \\(([^)]*)\\)");
  var m = re.exec(sql);
  if (!m) return null;
  return m[1].split(',').map(function (x) { return x.trim().replace(/^'|'$/g, ''); }).filter(Boolean);
}

function mismas(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function revisarParidad(K) {
  var worker = leer('worker-plaza/src/index.js');
  var sql = leer('worker-plaza/migrations/0002_estilo.sql');

  K.RANURAS.forEach(function (r) {
    var aqui = K.claves(r);

    var alla = listaJS(worker, 'const PIEZAS = {', r);
    if (!alla) {
      fallos.push('el Worker no declara la ranura «' + r + '» en PIEZAS');
    } else if (!mismas(aqui, alla)) {
      fallos.push('«' + r + '» se separó entre el catálogo y el Worker:\n' +
        '      teléfono: ' + aqui.join(', ') + '\n' +
        '      Worker:   ' + alla.join(', '));
    }

    var enSQL = listaSQL(sql, 'estilo_' + r);
    if (!enSQL) {
      fallos.push('la migración no tiene CHECK para estilo_' + r);
    } else if (!mismas(aqui, enSQL)) {
      fallos.push('«' + r + '» se separó entre el catálogo y la base:\n' +
        '      teléfono: ' + aqui.join(', ') + '\n' +
        '      base:     ' + enSQL.join(', '));
    }
  });

  /* Las columnas tienen que existir en el SELECT de vecinos y en el INSERT de
     publicar: sin eso, la decoración se guarda y no la ve nadie, o se ve y no
     se guarda. Los dos fallos son silenciosos. */
  K.RANURAS.forEach(function (r) {
    if (worker.indexOf('estilo_' + r) < 0) {
      fallos.push('el Worker no toca la columna estilo_' + r + ' en ninguna consulta');
    }
  });
  if (worker.indexOf('conEstilo') < 0) {
    fallos.push('el Worker no anida el estilo al responder: el teléfono recibiría columnas planas');
  }
}

/* ==================================================================
   2 — LO DE SERIE ES EL PUESTO DE ANTES
   ================================================================== */

var SERIE = { toldo: 'feston', color: 'oficio', letrero: 'ninguno', adorno: 'ninguno', suelo: 'ninguno' };

function revisarSerie(K, PU) {
  K.RANURAS.forEach(function (r) {
    if (K.DEFECTO[r] !== SERIE[r]) {
      fallos.push('lo de serie cambió en «' + r + '»: era «' + SERIE[r] + '» y ahora es «' + K.DEFECTO[r] +
        '». Quien no toque nada vería su puesto distinto de un día para otro.');
    }
  });

  var d = PU.defecto();
  if (!PU.esDefecto(d)) fallos.push('esDefecto() no reconoce el propio defecto()');

  /* Store tiene que traer las mismas cinco piezas: merge() da el valor base a
     las claves que faltan en un guardado viejo, y si aquí falta una, a quien
     ya venía usando la app le llegaría sin ella. */
  var store = leer('js/core/store.js');
  K.RANURAS.forEach(function (r) {
    if (!new RegExp(r + ":\\s*'" + SERIE[r] + "'").test(store)) {
      fallos.push('js/core/store.js no declara «' + r + ": '" + SERIE[r] + "'» en state.plaza.puesto");
    }
  });

  var sql = leer('worker-plaza/migrations/0002_estilo.sql');
  K.RANURAS.forEach(function (r) {
    if (sql.indexOf("estilo_" + r + " TEXT NOT NULL DEFAULT '" + SERIE[r] + "'") < 0) {
      fallos.push('la migración no pone «' + SERIE[r] + '» por defecto en estilo_' + r +
        ': los puestos ya publicados cambiarían de aspecto al migrar');
    }
  });
}

/* ==================================================================
   3 y 4 — CADA PIEZA SE PINTA Y TIENE NOMBRE
   ================================================================== */

/* Las que a propósito no tienen regla: son la ausencia de pieza o el valor de
   reserva que deja pasar lo que ya venía. */
var SIN_REGLA = {
  color: ['oficio'],
  letrero: ['ninguno'],
  adorno: ['ninguno', 'macetas', 'farol', 'banderines', 'cajas', 'pizarron', 'girasoles'],
  suelo: ['ninguno']
};

function revisarPintado(K) {
  var css = leer('css/puesto.css');

  K.RANURAS.forEach(function (r) {
    K.claves(r).forEach(function (clave) {
      var pieza = K.CATALOGO[r][clave];

      if (!pieza.nombre) {
        fallos.push('la pieza «' + r + '/' + clave + '» no tiene nombre: saldría sin etiqueta en pantalla');
      }

      /* Los adornos se dibujan en SVG y no en CSS: su "regla" es tener dibujo
         y declarar zona. */
      if (r === 'adorno') {
        if (clave !== 'ninguno' && !K.adornoSVG(clave)) {
          fallos.push('el adorno «' + clave + '» no dibuja nada');
        }
        if (pieza.zona !== 'alto' && pieza.zona !== 'bajo') {
          fallos.push('el adorno «' + clave + '» no declara una zona válida (alto o bajo)');
        }
        return;
      }

      if ((SIN_REGLA[r] || []).indexOf(clave) >= 0) return;
      if (css.indexOf('[data-pz-' + r + '="' + clave + '"]') < 0) {
        fallos.push('la pieza «' + r + '/' + clave + '» no tiene regla en css/puesto.css: se puede elegir y no cambia nada');
      }
    });
  });

  /* Las dos franjas de adornos tienen que existir con su proporción: es lo
     que ancla cada dibujo a su borde. */
  ['bajo', 'alto'].forEach(function (z) {
    if (css.indexOf('.puesto__adorno--' + z) < 0) {
      fallos.push('css/puesto.css no define la franja de adornos «' + z + '»');
    }
  });
  if (css.indexOf('pointer-events: none') < 0) {
    fallos.push('la capa de adornos no está declarada como intocable: se comería los toques del puesto');
  }
}

/* ==================================================================
   5 — NINGÚN ADORNO SE SALE DE SU FRANJA

   Se leen las coordenadas del dibujo y se compara con el lienzo. El margen
   útil no es el lienzo entero: la franja sobresale 24 px por cada lado del
   puesto y el puesto ya está a 20 px del borde de la pantalla, así que lo que
   se dibuje pasado x 316 —o antes de x 4— lo recorta el borde de la Plaza.
   ================================================================== */

var LIMITE = { xMin: 2, xMax: 318 };
var ALTO = { bajo: 96, alto: 56 };

/** Los pares (x, y) de un `d` con comandos absolutos, que son los únicos que
    usa el catálogo. Un comando relativo aquí sería un fallo por sí mismo. */
function puntosDePath(d) {
  if (/[a-z]/.test(d.replace(/[a-z]*$/i, '').replace(/[MLCQHVZAST]/g, ''))) {
    /* Hay letras minúsculas: comandos relativos. No se sabe medir, y no debe
       haberlos. */
    return null;
  }
  var puntos = [];
  var tokens = d.match(/[MLCQSTAHVZ]|-?\d*\.?\d+/gi) || [];
  var cmd = 'M', nums = [], i, t;

  function volcar() {
    if (cmd === 'H') { nums.forEach(function (n) { puntos.push([n, null]); }); }
    else if (cmd === 'V') { nums.forEach(function (n) { puntos.push([null, n]); }); }
    else { for (var k = 0; k + 1 < nums.length; k += 2) puntos.push([nums[k], nums[k + 1]]); }
    nums = [];
  }

  for (i = 0; i < tokens.length; i++) {
    t = tokens[i];
    if (/[A-Za-z]/.test(t)) { volcar(); cmd = t.toUpperCase(); }
    else nums.push(parseFloat(t));
  }
  volcar();
  return puntos;
}

/** Los extremos en x y en y de un dibujo. Devuelve null si no sabe medirlo,
    que es distinto de "cabe": un dibujo que no se sabe medir es un fallo. */
function extremos(svg) {
  var x = [], y = [], m, re;

  /* rect */
  re = /<rect[^>]*>/g;
  while ((m = re.exec(svg))) {
    var rx = parseFloat(/\sx="(-?[\d.]+)"/.exec(m[0])[1]);
    var ry = parseFloat(/\sy="(-?[\d.]+)"/.exec(m[0])[1]);
    var rw = parseFloat(/width="(-?[\d.]+)"/.exec(m[0])[1]);
    var rh = parseFloat(/height="(-?[\d.]+)"/.exec(m[0])[1]);
    x.push(rx, rx + rw); y.push(ry, ry + rh);
  }

  /* circle */
  re = /<circle[^>]*>/g;
  while ((m = re.exec(svg))) {
    var cx = parseFloat(/cx="(-?[\d.]+)"/.exec(m[0])[1]);
    var cy = parseFloat(/cy="(-?[\d.]+)"/.exec(m[0])[1]);
    var r = parseFloat(/\sr="(-?[\d.]+)"/.exec(m[0])[1]);
    x.push(cx - r, cx + r); y.push(cy - r, cy + r);
  }

  /* ellipse — puede venir girada alrededor de un punto. Girada, su punto más
     lejano nunca pasa de la distancia al centro de giro más su semieje mayor:
     con eso se acota sin tener que resolver la rotación. */
  re = /<ellipse[^>]*>/g;
  while ((m = re.exec(svg))) {
    var ex = parseFloat(/cx="(-?[\d.]+)"/.exec(m[0])[1]);
    var ey = parseFloat(/cy="(-?[\d.]+)"/.exec(m[0])[1]);
    var erx = parseFloat(/rx="(-?[\d.]+)"/.exec(m[0])[1]);
    var ery = parseFloat(/ry="(-?[\d.]+)"/.exec(m[0])[1]);
    var rot = /rotate\(\s*-?[\d.]+\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\)/.exec(m[0]);
    if (rot) {
      var gx = parseFloat(rot[1]), gy = parseFloat(rot[2]);
      var dist = Math.sqrt((ex - gx) * (ex - gx) + (ey - gy) * (ey - gy));
      var alcance = dist + Math.max(erx, ery);
      x.push(gx - alcance, gx + alcance); y.push(gy - alcance, gy + alcance);
    } else {
      x.push(ex - erx, ex + erx); y.push(ey - ery, ey + ery);
    }
  }

  /* path — se le suma el grosor del trazo, que sobresale a los dos lados. */
  re = /<path[^>]*>/g;
  while ((m = re.exec(svg))) {
    var d = /\sd="([^"]+)"/.exec(m[0]);
    if (!d) return null;
    var pts = puntosDePath(d[1]);
    if (!pts) return null;
    var gw = /stroke-width="([\d.]+)"/.exec(m[0]);
    var medio = gw ? parseFloat(gw[1]) / 2 : 0;
    pts.forEach(function (p) {
      if (p[0] !== null) x.push(p[0] - medio, p[0] + medio);
      if (p[1] !== null) y.push(p[1] - medio, p[1] + medio);
    });
  }

  if (!x.length) return null;
  return { xMin: Math.min.apply(null, x), xMax: Math.max.apply(null, x),
           yMin: Math.min.apply(null, y), yMax: Math.max.apply(null, y) };
}

function revisarEncaje(K) {
  Object.keys(K.ADORNO).forEach(function (clave) {
    var svg = K.adornoSVG(clave);
    if (!svg) return;                        // «ninguno» no dibuja, y está bien

    var zona = K.ADORNO[clave].zona;
    var e = extremos(svg);
    if (!e) {
      fallos.push('no se pudo medir el adorno «' + clave + '»: puede llevar comandos de path relativos');
      return;
    }

    if (e.xMin < LIMITE.xMin) {
      fallos.push('el adorno «' + clave + '» se sale por la izquierda (x ' + e.xMin.toFixed(1) +
        ', el mínimo es ' + LIMITE.xMin + '): el borde de la Plaza lo cortaría');
    }
    if (e.xMax > LIMITE.xMax) {
      fallos.push('el adorno «' + clave + '» se sale por la derecha (x ' + e.xMax.toFixed(1) +
        ', el máximo es ' + LIMITE.xMax + '): el borde de la Plaza lo cortaría');
    }
    if (e.yMin < -1) {
      fallos.push('el adorno «' + clave + '» se sale por arriba (y ' + e.yMin.toFixed(1) + ')');
    }
    if (e.yMax > ALTO[zona] + 1) {
      fallos.push('el adorno «' + clave + '» se sale por abajo (y ' + e.yMax.toFixed(1) +
        ', su franja «' + zona + '» mide ' + ALTO[zona] + ')');
    }
  });

  /* Los lienzos declarados en js/core/puesto.js tienen que ser los mismos que
     dan por hecho los dibujos y la proporción de css/puesto.css. */
  var ventana = cargar();
  var css = leer('css/puesto.css');
  Object.keys(ALTO).forEach(function (z) {
    if (ventana.Puesto.LIENZO[z] !== '0 0 320 ' + ALTO[z]) {
      fallos.push('el lienzo de la franja «' + z + '» cambió: ' + ventana.Puesto.LIENZO[z]);
    }
    if (css.indexOf('aspect-ratio: 320 / ' + ALTO[z]) < 0) {
      fallos.push('css/puesto.css no da a la franja «' + z + '» la proporción 320 / ' + ALTO[z] +
        ': los dibujos de esa zona quedarían descolocados');
    }
  });
}

/* ==================================================================
   6 — SIN DEGRADADOS NI <defs>
   ================================================================== */

function revisarPlano(K) {
  Object.keys(K.ADORNO).forEach(function (clave) {
    var svg = K.adornoSVG(clave);
    if (/url\(#/.test(svg)) {
      fallos.push('el adorno «' + clave + '» usa url(#…): con varios puestos en pantalla los ids chocan');
    }
    if (/<defs|Gradient/.test(svg)) {
      fallos.push('el adorno «' + clave + '» trae <defs> o un degradado, y en esta capa no puede haberlos');
    }
  });
}

/* ==================================================================
   7 y 8 — LA LISTA BLANCA Y EL INTERRUPTOR
   ================================================================== */

function revisarPuerta(K, PU) {
  var basura = PU.limpio({ toldo: 'no-existe', color: 42, letrero: null, adorno: {}, suelo: 'tarima' });
  if (basura.toldo !== 'feston') fallos.push('limpio() dejó pasar un toldo inventado');
  if (basura.color !== 'oficio') fallos.push('limpio() dejó pasar un color que no es texto');
  if (basura.suelo !== 'tarima') fallos.push('limpio() tiró un suelo válido');

  if (PU.set('toldo', 'no-existe')) fallos.push('set() aceptó una pieza que no existe');
  if (PU.set('inventada', 'feston')) fallos.push('set() aceptó una ranura que no existe');
  if (!PU.set('toldo', 'rayas')) fallos.push('set() rechazó una pieza válida');
  if (PU.actual().toldo !== 'rayas') fallos.push('set() no guardó la pieza');

  /* Con la apariencia apagada, lo que se publica es el puesto de serie: la
     pantalla lo apaga, y publicar algo que él no puede ver rompería "lo ves
     entero antes". */
  var apagada = cargar(false);
  apagada.Puesto.set('toldo', 'rayas');
  apagada.Puesto.set('adorno', 'macetas');
  var e = apagada.Puesto.estilo();
  if (e.toldo !== 'feston' || e.adorno !== 'ninguno') {
    fallos.push('con la apariencia apagada se sigue publicando la decoración: ' + JSON.stringify(e));
  }
  if (apagada.Puesto.actual().toldo !== 'rayas') {
    fallos.push('apagar la apariencia borró lo que había elegido, en vez de solo dejar de enseñarlo');
  }
}

/* ==================================================================
   EJECUCIÓN
   ================================================================== */

var K, PU;
try {
  var v = cargar();
  K = v.PUESTO_PIEZAS;
  PU = v.Puesto;

  revisarParidad(K);
  revisarSerie(K, PU);
  revisarPintado(K);
  revisarEncaje(K);
  revisarPlano(K);
  revisarPuerta(K, PU);
} catch (e) {
  console.error('✗ no se pudo revisar el puesto: ' + e.message);
  process.exit(1);
}

if (fallos.length) {
  console.error('✗ puesto decorado: ' + fallos.length + ' problema(s)\n');
  fallos.forEach(function (f) { console.error('  · ' + f); });
  process.exit(1);
}

var total = K.RANURAS.reduce(function (n, r) { return n + K.claves(r).length; }, 0);
console.log('✓ puesto correcto: ' + K.RANURAS.length + ' ranuras, ' + total +
  ' piezas, las tres listas blancas dicen lo mismo y ningún adorno se sale de su franja.');
