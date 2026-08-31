/* ==========================================================================
   VERIFICADOR DE LA CAPTURA

   Lo que se captura es lo que la app usa para escribir absolutamente todo.
   Si una pregunta guarda en un sitio que no existe, o si el motor vuelve a
   preguntar algo que ya sabe, no salta ningún error: simplemente la app se
   vuelve un poco más tonta y nadie se entera.

   Esto comprueba las dos familias de fallo silencioso:

   A · EL CATÁLOGO (js/data/preguntas.js)
     1. Ids únicos y campos obligatorios en todas.
     2. `guarda` apunta a un sitio real del perfil.
     3. Cada modo trae los datos que su renderizador necesita.
     4. `opcionesDe` nombra una lista blanca que existe en config.js.
     5. `requiere` y `alt` apuntan a cosas que existen; sin dependencias
        circulares ni cadenas imposibles de satisfacer.
     6. Todas dejan salir salvo la idea. Ninguna pregunta puede atrapar.
     7. La voz de Chispa: frases cortas, en primera persona, sin jerga.

   B · EL MOTOR (js/core/captura.js), ejecutado de verdad
     8. Contestar una pregunta la saca de la cola para siempre.
     9. Saltarla la aparta, y no vuelve antes de una semana.
    10. Nada se pregunta antes que sus requisitos.
    11. Olvidar un dato lo devuelve a la cola.
    12. El "esto entendí" no inventa nada que no esté en el perfil.
    13. El tope de tres preguntas al día se respeta.

   C · LA ROPA (css/captura.css)
    14. Toda clase que el motor escribe está dibujada en el CSS.

   Uso:
     node tools/check-captura.js

   Sale con código 1 si algo no cuadra.
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];
var notas = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }
function mal(m) { fallos.push(m); }

/* ==================================================================
   CARGA — el catálogo y el motor de verdad, sobre una ventana falsa
   ================================================================== */

function ventanaBase() {
  var w = {};
  w.window = w;
  // Sin localStorage, store.js cae solo a memoria: justo lo que queremos.
  w.setTimeout = setTimeout;
  w.clearTimeout = clearTimeout;
  w.navigator = { language: 'es-MX' };
  w.location = { protocol: 'https:', hostname: 'localhost' };
  w.isSecureContext = true;
  /* Los adornos que el motor toca al contestar. Devuelven nodos de mentira
     porque aquí no se pinta nada: lo que se prueba es la lógica. */
  var nodo = function () {
    return { appendChild: function () {}, addEventListener: function () {},
             classList: { add: function () {}, remove: function () {} },
             style: {}, dataset: {}, textContent: '', firstChild: { textContent: '' },
             isConnected: true, disabled: false };
  };
  w.UI = {
    el: nodo, clear: function () {}, qs: function () { return null; },
    qsa: function () { return []; }, btn: nodo, chip: nodo,
    sheet: function () { return { close: function () {} }; },
    closeSheet: function () {}, toast: function () {},
    confirm: function () { return Promise.resolve(false); },
    plural: function (n, a, b) { return n === 1 ? a : b; }
  };
  w.Mascot = { svg: function () { return ''; } };
  w.Sound = { tap: function () {}, select: function () {}, coin: function () {},
              buzz: function () {}, complete: function () {}, cash: function () {} };
  w.FX = { pop: function () {} };
  return w;
}

function cargar() {
  var w = ventanaBase();
  var d = {
    createTextNode: function (t) { return { nodeValue: t }; },
    addEventListener: function () {}, getElementById: function () { return null; }
  };
  w.addEventListener = function () {};
  new Function('window', leer('js/data/brand.js'))(w);
  new Function('window', leer('js/core/store.js'))(w);
  new Function('window', leer('js/data/config.js'))(w);
  new Function('window', leer('js/data/preguntas.js'))(w);
  new Function('window', 'document', leer('js/core/dictado.js'))(w, d);
  new Function('window', leer('js/core/venture.js'))(w);
  new Function('window', 'document', leer('js/core/captura.js'))(w, d);

  if (!w.PREGUNTAS) throw new Error('js/data/preguntas.js no publicó PREGUNTAS');
  if (!w.Captura) throw new Error('js/core/captura.js no publicó Captura');
  if (!w.Venture) throw new Error('js/core/venture.js no publicó Venture');

  w.Store.init();
  return w;
}

var W;
try {
  W = cargar();
} catch (e) {
  console.error('No se pudo cargar la captura:\n  ' + e.message);
  process.exit(1);
}

var P = W.PREGUNTAS;
var CONFIG = W.CONFIG;

/* ==================================================================
   1 — IDS ÚNICOS Y CAMPOS OBLIGATORIOS
   ================================================================== */

var OBLIGATORIOS = ['id', 'guarda', 'modo', 'fase', 'peso', 'q', 'chispa', 'para', 'ico', 'etiqueta'];
var MODOS = ['voz', 'tarjetas', 'rapidas', 'escala', 'desliza', 'completa', 'ejemplos', 'escribe'];
var FASES = ['registro', 'pronto', 'luego'];

(function revisarForma() {
  var vistos = {};
  P.forEach(function (p) {
    var quien = 'pregunta «' + (p.id || '¿sin id?') + '»';
    OBLIGATORIOS.forEach(function (k) {
      if (p[k] === undefined || p[k] === null || p[k] === '') mal(quien + ' no tiene ' + k);
    });
    if (vistos[p.id]) mal('el id «' + p.id + '» está repetido');
    vistos[p.id] = true;
    if (MODOS.indexOf(p.modo) < 0) mal(quien + ' usa un modo que no existe: ' + p.modo);
    if (FASES.indexOf(p.fase) < 0) mal(quien + ' usa una fase que no existe: ' + p.fase);
    if (typeof p.peso !== 'number') mal(quien + ' tiene un peso que no es número');
  });
})();

/* ==================================================================
   2 — `guarda` APUNTA A UN SITIO REAL DEL PERFIL
   ================================================================== */

(function revisarDestinos() {
  var v = W.Venture.active();
  P.concat([]).forEach(function (p) {
    var g = String(p.guarda || '');
    var quien = 'pregunta «' + p.id + '»';

    if (g.indexOf('decision:') === 0) {
      if (!g.slice(9)) mal(quien + ' guarda en una decisión sin nombre');
      return;
    }
    if (g.indexOf('metric:') === 0) {
      if (!g.slice(7)) mal(quien + ' guarda en una métrica sin nombre');
      if (!p.numero) mal(quien + ' guarda un número pero no está marcada con `numero: true`');
      return;
    }
    if (g.indexOf('core.resources.') === 0) {
      var r = g.slice(15);
      if (!(r in v.core.resources)) mal(quien + ' guarda en core.resources.' + r + ', que no existe en el perfil');
      return;
    }
    if (g.indexOf('core.') === 0) {
      var c = g.slice(5);
      if (!(c in v.core)) mal(quien + ' guarda en core.' + c + ', que no existe en el perfil');
      return;
    }
    mal(quien + ' guarda en «' + g + '», que no es un destino conocido');
  });
})();

/* ==================================================================
   3 — CADA MODO TRAE LO QUE SU RENDERIZADOR NECESITA
   ================================================================== */

(function revisarModos() {
  P.forEach(function (p) {
    var quien = 'pregunta «' + p.id + '»';
    var ops = W.Captura.opciones(p);

    if (p.modo === 'tarjetas' || p.modo === 'rapidas') {
      if (!ops.length) mal(quien + ' se pinta con ' + p.modo + ' pero no tiene opciones');
      if (ops.length > 6) mal(quien + ' enseña ' + ops.length + ' opciones a la vez; el tope es 6');
      ops.forEach(function (o) {
        if (!o.key && o.key !== 0) mal(quien + ' tiene una opción sin clave');
        if (!o.title) mal(quien + ' tiene una opción sin título');
      });
    }

    if (p.modo === 'escala') {
      if (!p.escala || !p.escala.pasos || p.escala.pasos.length < 3) {
        mal(quien + ' se pinta con una escala de menos de tres tramos');
      } else {
        if (!p.escala.izq || !p.escala.der) mal(quien + ' tiene una escala sin extremos escritos');
        p.escala.pasos.forEach(function (x, i) {
          if (!x.cara) mal(quien + ' tiene el tramo ' + (i + 1) + ' sin cara');
          if (!x.t) mal(quien + ' tiene el tramo ' + (i + 1) + ' sin nombre corto');
          // Sin esta frase, la escala es un número que se traga un formulario.
          if (!x.dice) mal(quien + ' tiene el tramo ' + (i + 1) + ' sin lo que Chispa deduce de él');
        });
      }
    }

    if (p.modo === 'desliza') {
      if (!p.items || p.items.length < 2) mal(quien + ' se desliza pero tiene menos de dos tarjetas');
      (p.items || []).forEach(function (x, i) {
        if (!x.v) mal(quien + ' tiene la tarjeta ' + (i + 1) + ' sin valor');
        if (!x.t) mal(quien + ' tiene la tarjeta ' + (i + 1) + ' sin título');
      });
    }

    if (p.modo === 'completa') {
      var c = p.completa;
      if (!c || !c.plantilla) { mal(quien + ' completa una frase que no existe'); return; }
      var enPlantilla = (c.plantilla.match(/\{[a-zA-Z0-9_]+\}/g) || [])
        .map(function (x) { return x.slice(1, -1); });
      var enHuecos = Object.keys(c.huecos || {});
      enPlantilla.forEach(function (k) {
        if (enHuecos.indexOf(k) < 0) mal(quien + ' deja el hueco {' + k + '} sin opciones que ofrecer');
      });
      enHuecos.forEach(function (k) {
        if (enPlantilla.indexOf(k) < 0) mal(quien + ' tiene opciones para {' + k + '}, que no está en la frase');
        var h = c.huecos[k];
        if (!h.label) mal(quien + ' no dice qué se elige en el hueco {' + k + '}');
        if (!h.ops || h.ops.length < 2) mal(quien + ' ofrece menos de dos opciones en {' + k + '}');
        if (h.ops && h.ops.length > 6) mal(quien + ' ofrece ' + h.ops.length + ' opciones en {' + k + '}; el tope es 6');
      });
    }

    // Lo que se dicta tiene que poder escribirse, y lo escrito necesita ejemplo.
    if ((p.modo === 'voz' || p.modo === 'escribe') && !p.ph) {
      mal(quien + ' se escribe pero no propone ningún ejemplo en el campo');
    }
    if (p.ejemplos) {
      p.ejemplos.forEach(function (e, i) {
        if (!e.v || !e.t) mal(quien + ' tiene el ejemplo ' + (i + 1) + ' incompleto');
      });
    }
  });
})();

/* ==================================================================
   4 — LAS LISTAS BLANCAS EXISTEN
   ================================================================== */

(function revisarListas() {
  P.forEach(function (p) {
    if (!p.opcionesDe) return;
    if (!CONFIG[p.opcionesDe]) {
      mal('pregunta «' + p.id + '» toma sus opciones de CONFIG.' + p.opcionesDe + ', que no existe');
    }
    if (p.opciones) {
      mal('pregunta «' + p.id + '» tiene opciones propias Y una lista de config: solo puede ganar una');
    }
  });
})();

/* ==================================================================
   5 — DEPENDENCIAS SANAS
   ================================================================== */

(function revisarDependencias() {
  var ids = {};
  P.forEach(function (p) { ids[p.id] = p; });
  var etapas = (CONFIG.STAGES || []).map(function (s) { return s.key; });

  P.forEach(function (p) {
    (p.requiere || []).forEach(function (r) {
      if (!ids[r]) mal('pregunta «' + p.id + '» exige «' + r + '», que no está en el catálogo');
      if (r === p.id) mal('pregunta «' + p.id + '» se exige a sí misma');
    });
    (p.etapas || []).forEach(function (e) {
      if (etapas.indexOf(e) < 0) mal('pregunta «' + p.id + '» se limita a la etapa «' + e + '», que no existe');
    });
    if (p.alt) {
      var v = W.Venture.active();
      var a = String(p.alt);
      var ok = (a.indexOf('core.resources.') === 0 && (a.slice(15) in v.core.resources)) ||
               (a.indexOf('core.') === 0 && a.indexOf('core.resources.') !== 0 && (a.slice(5) in v.core)) ||
               a.indexOf('decision:') === 0 || a.indexOf('metric:') === 0;
      if (!ok) mal('pregunta «' + p.id + '» tiene un `alt` que no apunta a nada: ' + a);
    }
  });

  /* Cadenas imposibles: una pregunta cuyo requisito es de una fase POSTERIOR
     nunca llegaría a hacerse. Es el fallo que no da error y borra una rama
     entera del catálogo. */
  var ordenFase = { registro: 0, pronto: 1, luego: 2 };
  P.forEach(function (p) {
    (p.requiere || []).forEach(function (r) {
      var dep = ids[r];
      if (!dep) return;
      if (ordenFase[dep.fase] > ordenFase[p.fase]) {
        mal('pregunta «' + p.id + '» (' + p.fase + ') depende de «' + r + '», que se pregunta después (' + dep.fase + ')');
      }
      if (ordenFase[dep.fase] === ordenFase[p.fase] && dep.peso >= p.peso) {
        mal('pregunta «' + p.id + '» depende de «' + r + '», que va detrás en la misma fase');
      }
    });
  });

  // Ciclos.
  P.forEach(function (p) {
    var visto = {};
    (function bajar(x, camino) {
      if (visto[x.id]) return;
      visto[x.id] = true;
      (x.requiere || []).forEach(function (r) {
        if (camino.indexOf(r) >= 0) { mal('dependencia circular: ' + camino.concat(r).join(' → ')); return; }
        if (ids[r]) bajar(ids[r], camino.concat(r));
      });
    })(p, [p.id]);
  });
})();

/* ==================================================================
   6 — NINGUNA PREGUNTA ATRAPA
   ================================================================== */

(function revisarSalidas() {
  P.forEach(function (p) {
    if (p.noSe === false && p.id !== 'idea') {
      mal('pregunta «' + p.id + '» no deja decir «todavía no lo sé». Solo la idea puede.');
    }
  });
  var idea = P.filter(function (p) { return p.id === 'idea'; })[0];
  if (!idea) mal('no hay pregunta «idea», y sin ella la app no puede escribir nada');
})();

/* ==================================================================
   7 — LA VOZ DE CHISPA
   ================================================================== */

function palabras(s) { return String(s).trim().split(/\s+/).filter(Boolean).length; }

(function revisarVoz() {
  /* Jerga que convierte una conversación en un formulario. La lista es corta
     a propósito: son las palabras que de verdad aparecen cuando alguien
     escribe copy de producto sin darse cuenta. */
  var JERGA = [
    /\bdatos?\b/i, /\bprocesa/i, /\bsistema\b/i, /\busuario/i, /\boptimiz/i,
    /\bconfigur/i, /\bvalidar? el campo/i, /\bformulario\b/i, /\bregistr(a|o) tus\b/i,
    /\bexperiencia de usuario\b/i, /\balmacen/i, /\bpersonalizar tu experiencia\b/i
  ];

  P.forEach(function (p) {
    var quien = 'pregunta «' + p.id + '»';

    if (palabras(p.q) > 12) mal(quien + ' pregunta con ' + palabras(p.q) + ' palabras; el tope es 12');
    if (!/[?？]$/.test(String(p.q).trim())) {
      // Algunas son una instrucción ("Arma tu frase") y eso vale.
      if (/\b(cu[aá]l|qu[eé]|c[oó]mo|d[oó]nde|cu[aá]nto|qui[eé]n)\b/i.test(p.q)) {
        mal(quien + ' empieza como pregunta y no termina en interrogación');
      }
    }
    if (palabras(p.chispa) > 16) mal(quien + ': Chispa se enrolla (' + palabras(p.chispa) + ' palabras, tope 16)');
    if (palabras(p.para) > 12) mal(quien + ': el "para qué" tiene ' + palabras(p.para) + ' palabras; el tope es 12');

    [['q', p.q], ['chispa', p.chispa], ['para', p.para], ['etiqueta', p.etiqueta]].forEach(function (par) {
      JERGA.forEach(function (re) {
        if (re.test(par[1])) mal(quien + ' suena a formulario en `' + par[0] + '»: «' + par[1] + '» (' + re + ')');
      });
    });

    // El "para qué" tiene que hablar de lo que Chispa HARÁ con ello.
    if (!/\b(con esto|sin esto|decide|cambia|todo lo que|es la|marca)\b/i.test(p.para)) {
      notas.push('pregunta «' + p.id + '»: el "para qué" no dice qué hará Chispa con la respuesta → «' + p.para + '»');
    }
  });
})();

/* ==================================================================
   8 a 13 — EL MOTOR, EJECUTADO
   ================================================================== */

function perfilLimpio() {
  W.Venture.startOver();
  W.Venture.patchCore({
    idea: 'Vendo lámparas impresas en tres dimensiones y personalizadas',
    customer: 'Personas jóvenes que buscan un regalo original',
    sector: 'hechoamano',
    stage: 'operating'
  });
  W.Venture.set(function (v) { v.intake.done = true; }, 'test');
}

(function revisarMotor() {
  // 8 · Contestar saca de la cola
  perfilLimpio();
  var antes = W.Captura.pendientes().map(function (p) { return p.id; });
  if (!antes.length) { mal('con un perfil recién registrado no queda nada por preguntar: la cola está vacía'); return; }

  var objetivo = W.Captura.preg('objetivo');
  if (antes.indexOf('objetivo') < 0) mal('«objetivo» debería estar en la cola de un perfil recién registrado');
  W.Captura.responder(objetivo, 'vender', 'tarjetas');
  var despues = W.Captura.pendientes().map(function (p) { return p.id; });
  if (despues.indexOf('objetivo') >= 0) mal('«objetivo» sigue en la cola después de contestarlo');
  if (W.Venture.active().core.goalKey !== 'vender') mal('contestar «objetivo» no escribió core.goalKey');

  // 9 · Saltar aparta, y no vuelve
  var problema = W.Captura.preg('problema');
  W.Captura.saltar(problema);
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('problema') >= 0) {
    mal('«problema» vuelve a la cola justo después de decir «todavía no lo sé»');
  }
  // ...pero sí vuelve pasada la semana
  W.Venture.set(function (v) {
    v.intake.skipped = v.intake.skipped.map(function (e) {
      return (e.id === 'problema') ? { id: 'problema', at: Date.now() - 9 * 86400000 } : e;
    });
  }, 'test');
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('problema') < 0) {
    mal('«problema» no vuelve a la cola ni después de nueve días');
  }

  // 10 · Nada se pregunta antes que sus requisitos
  perfilLimpio();
  W.Venture.set(function (v) { v.core.offer = ''; }, 'test');
  var cola = W.Captura.pendientes().map(function (p) { return p.id; });
  ['precio', 'costo', 'avanceOferta', 'diferencia'].forEach(function (id) {
    var p = W.Captura.preg(id);
    if (!p) return;
    if (cola.indexOf(id) >= 0) mal('«' + id + '» se pregunta sin saber todavía qué ofrece');
  });
  // Y con la oferta puesta, el precio aparece (la etapa es 'operating')
  W.Captura.responder(W.Captura.preg('oferta'), 'Una lámpara de veinte centímetros con cable y foco', 'voz');
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('precio') < 0) {
    mal('con la oferta contestada y el negocio operando, «precio» debería poder preguntarse');
  }

  // 10b · Las preguntas por etapa respetan la etapa
  W.Venture.patchCore({ stage: 'idea' });
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('precio') >= 0) {
    mal('«precio» se le pregunta a quien solo tiene la idea y todavía no vende');
  }

  // 11 · Olvidar devuelve a la cola
  perfilLimpio();
  W.Captura.responder(W.Captura.preg('presupuesto'), 'low', 'rapidas');
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('presupuesto') >= 0) {
    mal('«presupuesto» sigue en la cola después de contestarlo');
  }
  W.Captura.olvidar('presupuesto');
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('presupuesto') < 0) {
    mal('«presupuesto» no vuelve a la cola después de pedirle a Chispa que lo olvide');
  }
  if (W.Venture.active().core.resources.budget) mal('olvidar «presupuesto» no borró el valor del perfil');

  // 11b · Olvidar una decisión y una métrica
  perfilLimpio();
  W.Captura.responder(W.Captura.preg('canales'), 'WhatsApp · TikTok', 'desliza');
  if (!W.Venture.decision('canales')) mal('contestar «canales» no dejó decisión en el perfil');
  W.Captura.olvidar('canales');
  if (W.Venture.decision('canales')) mal('olvidar «canales» no borró la decisión');

  perfilLimpio();
  W.Captura.responder(W.Captura.preg('oferta'), 'Lámparas de mesa con nombre grabado', 'voz');
  W.Captura.responder(W.Captura.preg('precio'), '450', 'escribe');
  if (W.Venture.active().metrics.precio !== 450) mal('contestar «precio» no dejó el número en metrics');
  W.Captura.olvidar('precio');
  if (W.Venture.active().metrics.precio !== undefined) mal('olvidar «precio» no borró la métrica');

  // 12 · El "esto entendí" solo dice lo que hay en el perfil
  perfilLimpio();
  var e = W.Captura.entiendo();
  if (!/l[áa]mparas/i.test(e.texto)) mal('el "esto entendí" no menciona lo que vende: ' + e.texto);
  if (!/regalo/i.test(e.texto)) mal('el "esto entendí" no menciona a sus clientes: ' + e.texto);
  if (!e.partes.filter(function (x) { return x.b; }).length) {
    mal('el "esto entendí" no marca nada como deducido, así que nadie lo revisará');
  }
  e.partes.forEach(function (x) {
    if (x.b && x.id && !W.Captura.preg(x.id)) {
      mal('el "esto entendí" marca «' + x.t + '» con el id «' + x.id + '», que no se puede corregir');
    }
  });

  /* Cada trozo tiene que abrir la pregunta que lo ESCRIBIÓ. Sin oferta, lo que
     se enseña es la idea, y tocarlo debe llevar a la idea: si llevara a "qué
     entregas", el usuario correría a corregir una frase que no puso ahí. */
  function idDelProducto() {
    var partes = W.Captura.entiendo().partes;
    for (var i = 0; i < partes.length; i++) {
      if (partes[i].b && (partes[i].id === 'idea' || partes[i].id === 'oferta')) return partes[i].id;
    }
    return null;
  }
  if (idDelProducto() !== 'idea') {
    mal('sin oferta contestada, el "esto entendí" atribuye lo que vende a «' + idDelProducto() + '» en vez de a la idea');
  }
  W.Captura.responder(W.Captura.preg('oferta'), 'Lámparas de mesa de veinte centímetros con foco', 'voz');
  if (idDelProducto() !== 'oferta') {
    mal('con la oferta contestada, el "esto entendí" sigue atribuyéndola a «' + idDelProducto() + '»');
  }
  /* Lo que falta se dice y se puede tocar: un hueco callado se descubre tres
     lecciones después, cuando la app ya lleva rato diciendo "tus clientes". */
  W.Venture.set(function (vv) { vv.core.customer = ''; }, 'test');
  var sinCliente = W.Captura.entiendo();
  if (!/no s[ée]/i.test(sinCliente.texto)) {
    mal('el "esto entendí" se calla que no sabe a quién le vende: ' + sinCliente.texto);
  }
  if (!sinCliente.partes.some(function (x) { return x.b && x.id === 'cliente'; })) {
    mal('el hueco del cliente en el "esto entendí" no se puede tocar para rellenarlo');
  }

  // Un perfil vacío no puede inventarse un negocio
  W.Venture.startOver();
  var vacio = W.Captura.entiendo();
  if (/l[áa]mparas|regalo/i.test(vacio.texto)) mal('el "esto entendí" arrastra datos del negocio anterior: ' + vacio.texto);

  // 13 · Tres preguntas al día como mucho
  perfilLimpio();
  if (!W.Captura.hayMomento()) mal('con el registro hecho y sin preguntas hoy, debería haber momento');
  W.Captura.apuntar(); W.Captura.apuntar(); W.Captura.apuntar();
  if (W.Captura.hayMomento()) mal('se pueden hacer más de tres preguntas sueltas en el mismo día');

  // 13b · El registro no vuelve a preguntarse mientras esté contestado...
  perfilLimpio();
  W.Captura.pendientes().forEach(function (p) {
    if (p.fase === 'registro') mal('«' + p.id + '» es del registro, ya está contestada, y aun así se vuelve a preguntar');
  });
  // ...pero sí si el usuario pidió que Chispa la olvidara. Lo que la app
  // necesita para hablar de SU negocio no puede quedarse en blanco para siempre.
  W.Captura.olvidar('sector');
  if (W.Captura.pendientes().map(function (p) { return p.id; }).indexOf('sector') < 0) {
    mal('después de olvidar el sector, Chispa no lo vuelve a preguntar nunca');
  }
  // Y durante el registro (intake sin terminar) no se cuela ninguna.
  W.Venture.startOver();
  W.Captura.pendientes().forEach(function (p) {
    if (p.fase === 'registro') mal('«' + p.id + '» aparece en la cola espontánea antes de terminar el registro');
  });
})();

/* ==================================================================
   13c — LAS PREGUNTAS DE RESPUESTA CERRADA NO ACEPTAN TEXTO LIBRE

   El sector, la etapa o la personalidad no guardan una frase: guardan una
   clave de una lista blanca que después leen persona.js y css/temas.css. Un
   valor inventado no rompe nada visible — apaga media personalización en
   silencio. Se comprueba por los dos lados: que el motor lo rechace, y que la
   interfaz ni siquiera ofrezca escribirlo.
   ================================================================== */

(function revisarCerradas() {
  perfilLimpio();

  /* El motor avisa por consola cuando rechaza un valor inventado. Aquí lo
     rechaza diez veces a propósito, así que se calla: el resultado de esta
     prueba son los fallos de abajo, no diez líneas de aviso esperado. */
  var warn = console.warn;
  console.warn = function () {};

  P.forEach(function (p) {
    var deberia = !!(W.Captura.opciones(p).length || p.escala);
    if (W.Captura.cerrada(p) !== deberia) {
      mal('pregunta «' + p.id + '»: cerrada() dice ' + W.Captura.cerrada(p) + ' y debería decir ' + deberia);
    }
    if (!deberia) return;

    // Un valor inventado no puede entrar nunca.
    var antes = JSON.stringify(W.Venture.active().core) + JSON.stringify(W.Venture.active().decisions);
    var ok = W.Captura.responder(p, 'esto-no-existe-en-ninguna-lista', 'escribe');
    var despues = JSON.stringify(W.Venture.active().core) + JSON.stringify(W.Venture.active().decisions);
    if (ok) mal('pregunta «' + p.id + '» aceptó una respuesta que no está en su lista');
    if (antes !== despues) mal('pregunta «' + p.id + '» escribió en el perfil una respuesta inválida');

    // Y la válida sí.
    var valida = p.escala ? String(p.escala.pasos[0].v) : String(W.Captura.opciones(p)[0].key);
    if (!W.Captura.responder(p, valida, 'tarjetas')) {
      mal('pregunta «' + p.id + '» rechazó «' + valida + '», que sí está en su lista');
    }
    W.Captura.olvidar(p.id);
  });

  console.warn = warn;

  // La interfaz tampoco lo ofrece.
  var js = leer('js/core/captura.js');
  var i = js.indexOf("'Prefiero escribirlo'");
  if (i < 0) mal('desapareció la salida «Prefiero escribirlo»: escribir siempre tiene que ser posible');
  else if (js.lastIndexOf('!cerrada(p)', i) < js.lastIndexOf('function pintarModo', i)) {
    mal('«Prefiero escribirlo» se ofrece sin comprobar antes si la pregunta es de respuesta cerrada');
  }
})();

/* ==================================================================
   13d — LA PREGUNTA DEL FIN DE LECCIÓN CABE EN LA CELEBRACIÓN

   Cinco tarjetas grandes dentro de la tarjeta de "¡lección terminada!"
   empujaban el botón de continuar fuera de la pantalla.
   ================================================================== */

(function revisarTarjetaDeLeccion() {
  var js = leer('js/screens/lesson.js');
  if (!/capturaCard/.test(js)) { mal('la lección ya no ofrece la pregunta de Chispa al terminar'); return; }
  var trozo = js.slice(js.indexOf('function capturaCard'), js.indexOf('function reflectionCard'));
  if (!/modo:/.test(trozo) || !/rapidas/.test(trozo)) {
    mal('la pregunta del fin de lección no compacta las tarjetas: volverá a tapar el botón de continuar');
  }
  if (!/hayMomento\(\)/.test(js)) {
    mal('la lección pregunta sin comprobar si es buen momento: puede encadenar preguntas');
  }
  // Y nunca las dos cosas a la vez.
  var fin = js.slice(js.indexOf('var deChispa'), js.indexOf('var actions'));
  if (!/} else {/.test(fin) || !/reflectionCard/.test(fin)) {
    mal('al terminar la lección pueden salir la pregunta de Chispa y la reflexión a la vez');
  }
})();

/* ==================================================================
   13e — QUIEN YA VENÍA USANDO LA APP

   El caso que se rompe en silencio: alguien con un guardado anterior, sin
   `ventures`, que se migra desde `profile` + `dossier`. Si la captura no
   reconociera lo que ya sabe, le preguntaría de cero su propio negocio.
   ================================================================== */

(function revisarMigracion() {
  // Un guardado como los de antes: perfil viejo, expediente con dos secciones
  // y ni rastro del modelo nuevo.
  W.Store.set(function (st) {
    delete st.ventures;
    st.onboarded = true;
    st.profile = {
      name: 'Ana', businessName: 'Luz de Casa',
      idea: 'Vendo lámparas impresas en 3D personalizadas',
      goal: 'business', knowledge: 'some', budget: 'low', time: 20, sector: ''
    };
    st.dossier = {
      cliente: { answers: { texto: 'Personas que buscan un regalo original' }, at: Date.now(), from: 'mision' },
      oferta:  { answers: { texto: 'Lámpara de veinte centímetros con foco y cable' }, at: Date.now(), from: 'mision' }
    };
  }, 'test-legacy');

  var v = W.Venture.ensure();
  if (!v.intake.done) mal('a quien ya venía usando la app se le vuelve a tratar como usuario nuevo');
  if (!v.core.idea) mal('la migración perdió la idea del guardado anterior');

  var cola = W.Captura.pendientes().map(function (p) { return p.id; });
  [['idea', 'su idea'], ['cliente', 'sus clientes'], ['oferta', 'su oferta'],
   ['presupuesto', 'su presupuesto'], ['tiempo', 'su tiempo'],
   ['experiencia', 'su experiencia'], ['etapa', 'su etapa'],
   ['objetivo', 'su objetivo'], ['nombreNegocio', 'el nombre de su negocio']].forEach(function (par) {
    if (cola.indexOf(par[0]) >= 0) {
      mal('a quien migra desde un guardado anterior se le vuelve a preguntar ' + par[1] + ', que ya estaba escrito');
    }
  });
  // Y sí se le ofrece lo que de verdad no sabía nadie.
  if (!cola.length) mal('a quien migra no se le ofrece ninguna pregunta nueva: la captura progresiva no arranca');

  // El sector estaba vacío en el guardado viejo: se dedujo de la idea, no se
  // dejó en blanco ni se le preguntó como si fuera nuevo.
  if (!v.core.sector) mal('la migración dejó el sector en blanco en vez de deducirlo de la idea');
})();

/* ==================================================================
   14 — TODA CLASE QUE EL MOTOR ESCRIBE ESTÁ DIBUJADA
   ================================================================== */

(function revisarCSS() {
  var css = leer('css/captura.css');
  var js = leer('js/core/captura.js') + leer('js/screens/venture.js') +
           leer('js/screens/lesson.js') + leer('js/screens/onboarding.js');

  /* Las clases propias de la captura que aparecen en el código. Las del resto
     de la app (opt, card, btn…) las cubre components.css y no se miran aquí. */
  var propias = {};
  var re = /['"]([a-z0-9_ -]*\b(?:cap__|cap\b|voz__|voz\b|escala__|escala\b|desliza__|desliza\b|completa__|entiendo__|entiendo\b|sabe__|mic\b|campo-con-voz)[a-z0-9_ -]*)['"]/g;
  var m;
  while ((m = re.exec(js))) {
    m[1].split(/\s+/).forEach(function (c) {
      if (/^(cap|voz|escala|desliza|completa|entiendo|sabe|mic|campo-con-voz)/.test(c)) propias[c] = true;
    });
  }
  Object.keys(propias).forEach(function (c) {
    if (css.indexOf('.' + c) < 0) mal('la clase «' + c + '» se escribe en el código y no está dibujada en css/captura.css');
  });

  // El movimiento reducido no es opcional: hay un halo latiendo y barras saltando.
  if (css.indexOf('prefers-reduced-motion') < 0) {
    mal('css/captura.css anima sin respetar prefers-reduced-motion');
  }
  // Todo lo que se toca, del tamaño de un pulgar.
  ['voz__btn', 'escala__paso', 'desliza__b', 'cap__chip', 'mic', 'cap__otra'].forEach(function (c) {
    var bloque = new RegExp('\\.' + c + '\\s*\\{[^}]*\\}', 'g');
    var t = (css.match(bloque) || []).join(' ');
    if (!t) { mal('css/captura.css no define .' + c); return; }
    if (!/(min-height|height)\s*:\s*(4[4-9]|[5-9]\d|\d{3})px/.test(t)) {
      mal('.' + c + ' se toca con el dedo y mide menos de 44px de alto');
    }
  });
})();

/* ==================================================================
   15 — EL REGISTRO Y EL CATÁLOGO CUENTAN LO MISMO
   ================================================================== */

(function revisarRegistro() {
  var ob = leer('js/screens/onboarding.js');
  var m = /var STEPS = \[([^\]]+)\]/.exec(ob);
  if (!m) { mal('no encuentro los pasos del registro en js/screens/onboarding.js'); return; }
  var pasos = m[1].split(',').map(function (s) { return s.trim().replace(/^'|'$/g, ''); })
    .filter(function (s) { return s && s !== 'confirm'; });

  var delCatalogo = W.PREGUNTAS_REGISTRO || [];
  if (pasos.join('|') !== delCatalogo.join('|')) {
    mal('el registro pregunta [' + pasos.join(', ') + '] y el catálogo dice [' + delCatalogo.join(', ') + ']');
  }

  var m2 = /var CAMPO = \{([^}]+)\}/.exec(ob);
  if (m2) {
    pasos.forEach(function (id) {
      if (m2[1].indexOf(id + ':') < 0) mal('el paso «' + id + '» del registro no sabe en qué campo del borrador escribe');
    });
  } else {
    mal('no encuentro el mapa de campos del registro');
  }
})();

/* ==================================================================
   16 — LO QUE LAS PANTALLAS LLAMAN, EL MOTOR LO PUBLICA
   ================================================================== */

(function revisarAPI() {
  var usos = {};
  ['js/screens/venture.js', 'js/screens/lesson.js', 'js/screens/onboarding.js',
   'js/screens/mission.js', 'js/screens/mentor.js'].forEach(function (f) {
    var t = leer(f);
    var re = /w\.Captura\.([a-zA-Z]+)/g, m;
    while ((m = re.exec(t))) usos[m[1]] = (usos[m[1]] || []).concat(f);
  });
  Object.keys(usos).forEach(function (k) {
    if (typeof W.Captura[k] !== 'function') {
      mal('las pantallas llaman a Captura.' + k + '() y el motor no lo publica (' + usos[k][0] + ')');
    }
  });

  var dictado = leer('js/core/captura.js').match(/w\.Dictado\.([a-zA-Z]+)/g) || [];
  dictado.forEach(function (x) {
    var k = x.split('.')[2];
    if (typeof W.Dictado[k] !== 'function') mal('captura.js llama a Dictado.' + k + '(), que no existe');
  });
})();

/* ==================================================================
   RESULTADO
   ================================================================== */

var total = P.length;
console.log('Catálogo: ' + total + ' preguntas · ' +
  P.filter(function (p) { return p.fase === 'registro'; }).length + ' en el registro · ' +
  P.filter(function (p) { return p.fase === 'pronto'; }).length + ' pronto · ' +
  P.filter(function (p) { return p.fase === 'luego'; }).length + ' luego');

var porModo = {};
P.forEach(function (p) { porModo[p.modo] = (porModo[p.modo] || 0) + 1; });
console.log('Modos usados: ' + Object.keys(porModo).map(function (k) {
  return k + '×' + porModo[k];
}).join(', '));

/* Un modo se cuenta como usado también si se llega a él desde otro: los
   ejemplos parecidos son la alternativa que ofrece cualquier pregunta que los
   traiga, sin ser el modo con el que empieza ninguna. */
var alcanzables = {};
Object.keys(porModo).forEach(function (k) { alcanzables[k] = true; });
if (P.some(function (p) { return p.ejemplos && p.ejemplos.length; })) alcanzables.ejemplos = true;
if (P.some(function (p) { return p.modo !== 'escribe'; })) alcanzables.escribe = true;

MODOS.forEach(function (m) {
  if (!alcanzables[m]) notas.push('el modo «' + m + '» está construido y no lo usa ninguna pregunta');
});

if (notas.length) {
  console.log('\nAvisos (no rompen nada):');
  notas.forEach(function (n) { console.log('  · ' + n); });
}

if (fallos.length) {
  console.log('\n' + fallos.length + ' problema(s):');
  fallos.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(1);
}

console.log('\nTodo cuadra.');
