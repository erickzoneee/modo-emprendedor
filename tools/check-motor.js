/* ==========================================================================
   VERIFICADOR DEL MOTOR DE LA PLAZA

   El motor decide qué emprendimientos se le enseñan a alguien y con qué
   frase. Los dos fallos que puede tener son silenciosos:

     · Una rama que no se dispara nunca. El tipo de conexión existe, la frase
       está escrita, y ningún par de negocios reales llega a cumplir su
       condición. Nadie se entera: simplemente ese motivo no sale jamás.
     · Un motivo que sale siempre. Si "van por donde tú vas" aparece en las
       tres tarjetas, deja de ser un motivo y pasa a ser relleno con formato
       de motivo, que es peor que no decir nada.

   Esto comprueba las dos cosas contra las nueve vitrinas de lab/, más:

     3. Ninguna recomendación sin motivo, y ningún motivo sin frase.
     4. La frase es estable: la misma pareja dice siempre lo mismo. Un motivo
        que cambia al recargar se lee como inventado.
     5. Mismo sector + mismo público NO produce «le habla a la misma gente»:
        eso es competencia, y el piropo sería falso.
     6. Todas las frases están en voz de Chispa: entre 5 y 12 palabras, y
        ninguna afirma nada — todas dicen podría, puede, se parecen.
     7. El primer mensaje solo habla del negocio DE QUIEN LO MANDA. Va
        firmado con su nombre a una persona real: no puede afirmar nada sobre
        el otro que no esté en la vitrina del otro.
     8. Los iconos de los motivos y de las intenciones están dibujados.
     9. Sin vecinos, la lista es vacía. Sin razón, la lista es vacía.

   Uso:
     node tools/check-motor.js

   Sale con código 1 si algo no cuadra.
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];
var notas = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

function cargar() {
  var ventana = {};
  new Function('window', leer('js/core/plaza-motor.js'))(ventana);
  new Function('window', leer('lab/plaza-ejemplos.js'))(ventana);
  if (!ventana.PlazaMotor) throw new Error('js/core/plaza-motor.js no se publicó en window');
  if (!ventana.PLAZA_EJEMPLOS) throw new Error('lab/plaza-ejemplos.js no se publicó en window');
  return ventana;
}

/* Copia profunda: perfilar() cachea la firma dentro de la propia vitrina, y
   una prueba no debe heredar el estado de la anterior. */
function limpio(x) { return JSON.parse(JSON.stringify(x)); }

/* ==================================================================
   1 y 2 — TODOS LOS MOTIVOS SALEN, Y NINGUNO SE COME LA PLAZA
   ================================================================== */

var ETAPAS = ['idea', 'starting', 'operating', 'growing'];
var SECTORES = ['hechoamano', 'comida', 'servicios', 'digital', 'reventa', 'otro'];

function todosLosPares(M, E) {
  /* Cada vitrina mirando a todas las demás, y además la misma vitrina con
     cada etapa y cada sector: así se recorre el espacio de condiciones sin
     escribir a mano un caso por rama. */
  var vistos = {};
  var salidas = [];
  var universo = [limpio(E.yo)].concat(limpio(E.lista));

  universo.forEach(function (base) {
    ETAPAS.forEach(function (etapa) {
      SECTORES.forEach(function (sector) {
        var yo = limpio(base);
        yo.etapa = etapa;
        yo.sector = sector;
        var vecinos = limpio(E.lista).filter(function (v) { return v.id !== base.id; });
        var recs = M.recomendar(yo, vecinos, { max: 3 });
        recs.forEach(function (r) {
          vistos[r.motivo] = (vistos[r.motivo] || 0) + 1;
          salidas.push(r);
        });
      });
    });
  });
  return { vistos: vistos, salidas: salidas };
}

function revisarCobertura(M, E) {
  var r = todosLosPares(M, E);
  var declarados = Object.keys(M.PORQUE);

  declarados.forEach(function (k) {
    if (!r.vistos[k]) {
      fallos.push('el motivo «' + k + '» tiene frase escrita y NO se dispara nunca: ' +
        'o la condición es imposible, o hay que borrar la frase');
    }
  });

  Object.keys(r.vistos).forEach(function (k) {
    if (!M.PORQUE[k]) fallos.push('sale el motivo «' + k + '» y no tiene frase');
  });

  var total = r.salidas.length;
  if (!total) { fallos.push('con nueve vitrinas no salió ni una recomendación'); return; }

  Object.keys(r.vistos).forEach(function (k) {
    var pct = Math.round(r.vistos[k] / total * 100);
    notas.push('  ' + k + ': ' + pct + '% de las tarjetas');
    /* Un motivo que se lleva más de la mitad de las tarjetas ha dejado de
       explicar nada: es lo que salta cuando ninguna otra condición se
       cumple, y entonces el usuario lo lee siempre igual. */
    if (pct > 55) {
      fallos.push('el motivo «' + k + '» sale en el ' + pct + '% de las tarjetas: ' +
        'a esa frecuencia deja de ser un motivo y se lee como relleno');
    }
  });
}

/* ==================================================================
   3 y 4 — MOTIVO SIEMPRE, Y ESTABLE
   ================================================================== */

function revisarEstabilidad(M, E) {
  var yo = limpio(E.yo);
  var vecinos = limpio(E.lista);

  var a = M.recomendar(limpio(E.yo), limpio(E.lista), { max: 3 });
  var b = M.recomendar(limpio(E.yo), limpio(E.lista), { max: 3 });

  if (a.length !== b.length) { fallos.push('dos llamadas iguales devolvieron distinto número de tarjetas'); return; }
  for (var i = 0; i < a.length; i++) {
    if (a[i].vitrina.id !== b[i].vitrina.id) {
      fallos.push('el orden de las tarjetas cambia entre llamadas iguales');
    }
    if (a[i].porque !== b[i].porque) {
      fallos.push('la frase de «' + a[i].vitrina.id + '» cambia entre llamadas: se leería como inventada');
    }
    if (!a[i].porque) fallos.push('la tarjeta de «' + a[i].vitrina.id + '» salió sin frase');
    if (!a[i].motivo) fallos.push('la tarjeta de «' + a[i].vitrina.id + '» salió sin motivo');
  }

  /* Dentro de una misma pantalla no puede haber dos tarjetas con la frase
     literal repetida. Tres tarjetas que dicen exactamente lo mismo se leen
     como una plantilla y hunden la credibilidad de las otras. */
  var universo = [limpio(E.yo)].concat(limpio(E.lista));
  universo.forEach(function (base) {
    var vecinos = limpio(E.lista).filter(function (v) { return v.id !== base.id; });
    var recs = M.recomendar(limpio(base), vecinos, { max: 3 });
    var vistas = {};
    recs.forEach(function (r) {
      if (vistas[r.porque]) {
        fallos.push('a «' + (base.negocio || base.id) + '» le salen dos tarjetas con la ' +
          'frase idéntica: «' + r.porque + '»');
      }
      vistas[r.porque] = 1;
    });
  });

  /* Y dos parejas distintas no deberían decir siempre exactamente lo mismo:
     las tres variantes existen para eso. */
  var frases = {};
  limpio(E.lista).forEach(function (v) {
    var r = M.recomendar(limpio(E.yo), [limpio(v)], { max: 1, minimo: 0 });
    if (r.length) frases[r[0].porque] = 1;
  });
  if (Object.keys(frases).length < 3) {
    fallos.push('con nueve vecinos solo salieron ' + Object.keys(frases).length +
      ' frases distintas: las variantes no se están usando');
  }
}

/* ==================================================================
   5 — MISMO SECTOR + MISMO PÚBLICO NO ES AFINIDAD, ES COMPETENCIA
   ================================================================== */

function revisarCompetencia(M, E) {
  var yo = limpio(E.yo);
  var gemelo = limpio(E.yo);
  gemelo.id = 'ej-gemelo';
  gemelo.negocio = 'Barro y Luz';

  var r = M.recomendar(yo, [gemelo], { max: 1, minimo: 0 });
  if (r.length && r[0].motivo === 'mismoPublico') {
    fallos.push('a dos negocios del mismo sector con el mismo público les dice ' +
      '«le habla a la misma gente que tú»: eso es competencia, no afinidad');
  }
}

/* ==================================================================
   6 — LA VOZ DE CHISPA
   ================================================================== */

/* Verbos y giros que afirman un hecho sobre el otro negocio o sobre lo que
   va a pasar. Ninguna frase de motivo puede llevarlos. */
var AFIRMA = [
  /\b(va|vas|van|voy|vamos) a\b/i,  // "vas a necesitar" es una predicción, no un motivo
  /\bnecesita\b(?!n)/i,             // "necesita" afirma; "podrían necesitar" no
  /\bes justo\b/i,                  // "es justo quien debería" decide por el otro
  /\bseguro\b/i, /\bgarantiz/i, /\bsiempre\b/i, /\bnunca\b/i, /\bsin duda\b/i
];

function palabras(s) { return String(s).trim().split(/\s+/).filter(Boolean).length; }

function revisarVoz(M) {
  Object.keys(M.PORQUE).forEach(function (k) {
    var lista = M.PORQUE[k];
    if (lista.length < 3) {
      fallos.push('el motivo «' + k + '» tiene ' + lista.length + ' variante(s): hacen falta 3');
    }
    lista.forEach(function (f) {
      var n = palabras(f);
      if (n < 5 || n > 12) {
        fallos.push('«' + f + '» tiene ' + n + ' palabras: fuera del rango de Chispa (5-12)');
      }
      AFIRMA.forEach(function (re) {
        if (re.test(f)) fallos.push('«' + f + '» afirma algo que la app no sabe (' + re + ')');
      });
    });
  });

  /* Las peticiones y aperturas del primer mensaje son del usuario, no de
     Chispa, así que pueden ser algo más largas — pero no un párrafo. */
  [['APERTURA', M.APERTURA], ['PETICION', M.PETICION], ['PUENTE', M.PUENTE]].forEach(function (par) {
    Object.keys(par[1]).forEach(function (k) {
      var n = palabras(par[1][k]);
      if (n > 16) fallos.push(par[0] + '.' + k + ' tiene ' + n + ' palabras: demasiado para un primer mensaje');
    });
  });
}

/* ==================================================================
   7 — EL PRIMER MENSAJE SOLO HABLA DE QUIEN LO MANDA
   ================================================================== */

function revisarMensaje(M, E) {
  var yo = limpio(E.yo);
  var motivos = Object.keys(M.PORQUE);

  M.INTENCIONES.forEach(function (it) {
    if (!M.APERTURA[it.id]) fallos.push('la intención «' + it.id + '» no tiene apertura');
    if (!M.PETICION[it.id]) fallos.push('la intención «' + it.id + '» no tiene cierre');

    motivos.forEach(function (mo) {
      if (!M.PUENTE[mo]) { fallos.push('el motivo «' + mo + '» no tiene puente'); return; }
      var msg = M.primerMensaje(it.id, mo, yo);

      if (msg.indexOf('{') >= 0) {
        fallos.push('el mensaje ' + it.id + '/' + mo + ' dejó un hueco sin rellenar: ' + msg);
      }
      if (msg.split('\n').length !== 3) {
        fallos.push('el mensaje ' + it.id + '/' + mo + ' no tiene tres líneas');
      }
      /* Lo único que se interpola es SU producto y SU cliente. Si alguna vez
         alguien mete un campo del otro negocio en la plantilla, esto lo caza. */
      E.lista.forEach(function (otro) {
        if (otro.negocio && msg.indexOf(otro.negocio) >= 0) {
          fallos.push('el mensaje ' + it.id + '/' + mo + ' nombra al otro negocio');
        }
      });
    });
  });

  /* El puente habla de QUIEN MANDA, nunca de lo que el otro necesita.

     Esta regla nació de un fallo real: el puente salía del motivo y la
     apertura de la intención, así que una tarjeta de «podría probarte» con
     la intención «me gustaría probarlo» producía un mensaje que decía a la
     vez «quiero probar lo tuyo» y «creo que lo mío podría servirte». Dos
     direcciones opuestas en tres líneas, firmadas por el usuario. */
  var DIRIGIDO = [
    /\bte hace falta\b/i, /\bpodr[ií]a servirte\b/i, /\bnecesitas\b/i,
    /\bbuscas\b/i, /\bte sirve\b/i, /\bte falta\b/i
  ];
  Object.keys(M.PUENTE).forEach(function (k) {
    DIRIGIDO.forEach(function (re) {
      if (re.test(M.PUENTE[k])) {
        fallos.push('el puente de «' + k + '» afirma algo sobre el otro (' + re + '): ' +
          'el puente solo puede hablar de quien manda el mensaje');
      }
    });
  });

  /* Y el recorte no puede dejar la frase colgando de una preposición. */
  var largo = { id: 'x', negocio: 'X',
    producto: 'lámparas de cerámica hechas a mano para departamentos pequeños',
    idea: '', cliente: 'gente de 25 a 40 años que renta departamento y quiere su espacio',
    problema: '', valor: '', sector: 'hechoamano', etapa: 'starting' };
  Object.keys(M.PUENTE).forEach(function (k) {
    var linea = M.primerMensaje('conocer', k, largo).split('\n')[1];
    if (/\b(de|la|el|para|con|por|y|a|en|que|del)[.,]?$/i.test(linea.replace(/[.]$/, ''))) {
      fallos.push('el puente de «' + k + '» queda colgando de una preposición: ' + linea);
    }
  });

  /* Sin producto ni cliente, el relleno tiene que seguir siendo verdad y
     seguir hablando en primera persona. */
  var vacio = { id: 'x', negocio: '', producto: '', idea: '', cliente: '', problema: '', valor: '', sector: 'otro', etapa: 'idea' };
  var m = M.primerMensaje('conocer', 'mismaEtapa', vacio);
  if (/tu producto|tu cliente|tu negocio/i.test(m)) {
    fallos.push('con la vitrina vacía el mensaje habla en segunda persona del propio negocio: ' + m);
  }
}

/* ==================================================================
   8 — LOS ICONOS ESTÁN DIBUJADOS
   ================================================================== */

function revisarIconos(M) {
  var ventana = {};
  new Function('window', leer('js/data/iconos.js'))(ventana);
  var mapa = ventana.ICONOS.emoji;

  function comprobar(e, donde) {
    if (!mapa[e] && !mapa[e.replace('️', '')]) {
      fallos.push(donde + ' usa ' + e + ', que no está dibujado en el alfabeto visual');
    }
  }
  Object.keys(M.ICONO).forEach(function (k) { comprobar(M.ICONO[k], 'el motivo «' + k + '»'); });
  M.INTENCIONES.forEach(function (it) { comprobar(it.icon, 'la intención «' + it.id + '»'); });

  Object.keys(M.PORQUE).forEach(function (k) {
    if (!M.ICONO[k]) fallos.push('el motivo «' + k + '» no tiene icono');
  });
}

/* ==================================================================
   9 — SIN VECINOS Y SIN RAZÓN, LISTA VACÍA
   ================================================================== */

function revisarVacio(M, E) {
  if (M.recomendar(limpio(E.yo), [], { max: 3 }).length) {
    fallos.push('sin vecinos devolvió tarjetas');
  }
  if (M.recomendar(null, limpio(E.lista), { max: 3 }).length) {
    fallos.push('sin vitrina propia devolvió tarjetas');
  }

  /* Un negocio que no se parece a nada del catálogo no debe producir
     tarjetas de relleno. Si esta comprobación empieza a fallar, es que el
     umbral más bajo se aflojó demasiado. */
  var raro = {
    id: 'ej-raro', negocio: 'Herrería Industrial',
    producto: 'estructuras metálicas para naves industriales',
    idea: 'estructuras metálicas a medida',
    cliente: 'constructoras y plantas industriales',
    problema: 'Las estructuras estándar no sirven para una nave grande',
    valor: 'Aguantan más y se instalan en menos días',
    sector: 'otro', etapa: 'growing'
  };
  var r = M.recomendar(raro, limpio(E.lista), { max: 3 });
  if (r.length) {
    notas.push('  (un negocio ajeno al catálogo produjo ' + r.length +
      ' tarjeta(s): ' + r.map(function (x) { return x.motivo + ' ' + x.puntos; }).join(', ') + ')');
  }
  r.forEach(function (x) {
    if (x.puntos < M.MINIMOS[M.MINIMOS.length - 1]) {
      fallos.push('salió una tarjeta con ' + x.puntos + ' puntos, por debajo del suelo');
    }
  });
}

/* ==================================================================
   EJECUCIÓN
   ================================================================== */

var M, E;
try {
  var ventana = cargar();
  M = ventana.PlazaMotor;
  E = ventana.PLAZA_EJEMPLOS;

  revisarCobertura(M, E);
  revisarEstabilidad(M, E);
  revisarCompetencia(M, E);
  revisarVoz(M);
  revisarMensaje(M, E);
  revisarIconos(M);
  revisarVacio(M, E);
} catch (e) {
  console.error('✗ no se pudo revisar el motor: ' + e.message);
  console.error(e.stack);
  process.exit(1);
}

notas.forEach(function (n) { console.log(n); });

if (fallos.length) {
  console.error('\n✗ motor de la Plaza: ' + fallos.length + ' problema(s)\n');
  fallos.forEach(function (f) { console.error('  · ' + f); });
  process.exit(1);
}

console.log('\n✓ motor correcto: ' + Object.keys(M.PORQUE).length + ' motivos, todos alcanzables, ' +
  M.INTENCIONES.length + ' intenciones, ' +
  (Object.keys(M.PORQUE).length * M.INTENCIONES.length) + ' primeros mensajes posibles.');
