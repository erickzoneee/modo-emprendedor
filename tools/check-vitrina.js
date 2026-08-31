/* ==========================================================================
   VERIFICADOR DE LA VITRINA DE LA PLAZA

   La promesa que la app le hace al usuario antes de abrir su puesto es que
   sus números y su plan no salen nunca. Esa promesa la sostiene una lista
   blanca escrita en js/core/plaza.js, y una lista blanca es exactamente el
   tipo de cosa que alguien amplía sin darse cuenta seis meses después.

   Esto lo comprueba a máquina. No es un test de que la vitrina se vea bien:
   es la única garantía mecánica de que lo que se publica es lo que se dijo.

   Qué comprueba:
     1. La lista blanca no ha crecido. Si aparece un campo nuevo hay que
        venir aquí a declararlo a mano, que es justo el freno que se busca.
     2. Ningún campo prohibido se puede colar. Se arma un perfil de mentira
        con precios, costos, presupuesto, ciudad y una lista de clientes
        dentro, se construye la vitrina, y se mira si algo de eso sale.
     3. Los datos de contacto se frenan. Correo, teléfono, enlace y arroba,
        tanto si vienen del perfil como si el usuario los escribe a mano en
        la pantalla de aprobación.
     4. Los topes de longitud existen para todos los campos de texto.
     5. Todos los emojis que se pintan en la Plaza están dibujados en el
        alfabeto visual. Uno que falte sale con la cara del sistema
        operativo, al lado de dos ilustraciones.
     6. Los seis sectores tienen toldo en css/plaza.css. Uno sin toldo se
        pinta con el color de reserva y dos negocios distintos se ven igual.
     7. Lo que sale en `estilo` son claves del catálogo cerrado y nada más.
        Es el único campo publicable que no es texto, y el único sitio por el
        que podría colarse algo escrito por alguien.

   Uso:
     node tools/check-vitrina.js

   Sale con código 1 si algo no cuadra, para poder encadenarlo antes de un push.
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

/* ==================================================================
   LO DECLARADO

   Escrito aquí a mano y comparado contra el código. Que haya que tocar dos
   sitios es el punto: ampliar la vitrina tiene que ser una decisión, no un
   descuido.
   ================================================================== */

var CAMPOS_ESPERADOS = ['negocio', 'producto', 'idea', 'cliente', 'problema', 'valor', 'sector', 'etapa'];

/* `estilo` sale publicado y NO está en CAMPOS. Declarado aquí a mano, que es
   lo que pide la regla 1 de este script.

   POR QUÉ ES PUBLICABLE
   Son cinco claves de un catálogo cerrado —js/data/puesto-piezas.js— que dicen
   de qué color es su toldo y si tiene macetas. No las escribe nadie: se eligen
   tocando. No hay dentro un dato del negocio ni puede haberlo, porque un valor
   que no esté en el catálogo no se guarda siquiera. El usuario pidió que sus
   vecinos vieran su puesto como él lo dejó, y esto es exactamente eso.

   POR QUÉ NO ESTÁ EN CAMPOS
   CAMPOS es la lista de lo que se recorta, se revisa por si lleva un teléfono
   y se compara letra a letra para saber si el puesto está al día. `estilo` es
   un objeto: metido ahí, `!==` lo compararía por referencia y el aviso de "tu
   puesto no está al día" se quedaría encendido para siempre. */
var CAMPO_ESTILO = 'estilo';
var EDITABLES_ESPERADOS = ['negocio', 'producto', 'cliente', 'problema', 'valor'];
var SECTORES = ['comida', 'hechoamano', 'servicios', 'digital', 'reventa', 'otro'];

/* ==================================================================
   UN PERFIL DE MENTIRA, LLENO DE COSAS QUE NO DEBEN SALIR
   ================================================================== */

var SECRETOS = {
  precio: '450',
  costo: '180',
  ciudad: 'Coyoacán',
  presupuesto: 'menos de $2,000',
  cliente1: 'Mariana Gómez',
  plan: 'Bajar el costo un 30% y subir el precio en marzo',
  canal: 'Vendo por Facebook Marketplace los martes'
};

function cargar() {
  var ventana = {};

  /* Venture, Store y CONFIG de mentira: plaza.js solo lee de ellos, así que
     con devolver la forma correcta basta. Se escriben aquí y no se importan
     los de verdad a propósito — este script comprueba la lista blanca, no el
     motor del perfil. */
  ventana.Store = {
    state: {
      plaza: { v: 1, vitrina: null, editada: {}, aprobadaAt: 0, rev: null },
      dossier: {
        precio: { answers: { valor: 'Ahorra dos horas de limpieza a la semana', precio: SECRETOS.precio, costo: SECRETOS.costo } },
        clientes: { answers: { nombre: SECRETOS.cliente1 } },
        plan: { answers: { meta: SECRETOS.plan } },
        canales: { answers: { donde: SECRETOS.canal } }
      }
    },
    set: function (fn) { fn(ventana.Store.state); }
  };

  /* Las mismas piezas de limpieza que exporta el Venture de verdad, para que
     este script recorra el camino real de desdeElPerfil() y no el de reserva. */
  var CRUDO = {
    offer: 'quiero vender lámparas de cerámica hechas a mano para departamentos pequeños',
    customer: 'para gente de 25 a 40 años que renta departamento y quiere que su espacio se sienta suyo',
    idea: 'quiero vender lámparas de cerámica hechas a mano'
  };

  ventana.Venture = {
    active: function () { return { rev: 7 }; },
    effective: function (campo) { return { value: CRUDO[campo] || '', from: 'registro' }; },
    util: {
      txt: function (x) { return String(x == null ? '' : x).trim().replace(/\s+/g, ' '); },
      shorten: function (x, max) { return String(x).length <= max ? String(x) : String(x).slice(0, max); },
      stripLead: function (x) { return String(x).replace(/^(quiero\s+)?vender\s+/i, ''); },
      lowerFirst: function (x) { return String(x).charAt(0).toLowerCase() + String(x).slice(1); }
    },
    decision: function (k) {
      if (k === 'problema') return { value: 'Los departamentos rentados se sienten fríos', from: 'registro' };
      return null;
    },
    terms: function () {
      return {
        tiene: { producto: true, cliente: true, idea: true, nombre: true, lugar: true },
        negocio: 'Luz de Barro',
        idea: 'quiero vender lámparas de cerámica',
        ideaCorta: 'lámparas de cerámica hechas a mano',
        producto: 'lámparas de cerámica hechas a mano',
        clienteCorto: 'gente que renta departamento',
        sector: 'hechoamano',
        etapa: 'starting',
        // Todo lo de abajo existe en terms() de verdad y NO debe salir:
        lugar: SECRETOS.ciudad,
        presupuesto: SECRETOS.presupuesto,
        presupuestoKey: 'low',
        objetivo: 'conseguir tu primer cliente que pague',
        objetivoKey: 'primera',
        experiencia: 'sin haber vendido antes',
        precio: Number(SECRETOS.precio),
        costo: Number(SECRETOS.costo),
        minutos: 30
      };
    }
  };

  /* El catálogo de piezas y su capa de validación SÍ se cargan de verdad: la
     regla 7 comprueba justo que lo que sale por `estilo` viene de ahí. */
  new Function('window', leer('js/data/puesto-piezas.js'))(ventana);
  new Function('window', leer('js/core/puesto.js'))(ventana);
  if (!ventana.Puesto) throw new Error('js/core/puesto.js no se publicó en window');

  new Function('window', leer('js/core/plaza.js'))(ventana);
  if (!ventana.Plaza) throw new Error('js/core/plaza.js no se publicó en window');
  return ventana;
}

/* ==================================================================
   1 y 4 — EL CONTRATO
   ================================================================== */

function revisarContrato(P) {
  var faltan = CAMPOS_ESPERADOS.filter(function (c) { return P.CAMPOS.indexOf(c) < 0; });
  var sobran = P.CAMPOS.filter(function (c) { return CAMPOS_ESPERADOS.indexOf(c) < 0; });

  if (faltan.length) fallos.push('la lista blanca perdió: ' + faltan.join(', '));
  if (sobran.length) {
    fallos.push('la lista blanca CRECIÓ con: ' + sobran.join(', ') +
      '. Si es a propósito, declára(n)lo en CAMPOS_ESPERADOS de este script y explica por qué es publicable.');
  }

  P.EDITABLES.forEach(function (c) {
    if (P.CAMPOS.indexOf(c) < 0) fallos.push('«' + c + '» es editable pero no está en la lista blanca');
    if (EDITABLES_ESPERADOS.indexOf(c) < 0) fallos.push('«' + c + '» se volvió editable sin declararlo aquí');
  });

  P.TEXTOS.forEach(function (c) {
    if (!P.TOPES[c]) fallos.push('«' + c + '» es texto libre y no tiene tope de longitud');
  });

  P.CAMPOS.forEach(function (c) {
    if (!P.ETIQUETAS[c]) fallos.push('«' + c + '» no tiene etiqueta: saldría sin nombre en pantalla');
  });
}

/* ==================================================================
   2 — QUE NO SE COLE NADA
   ================================================================== */

function revisarFuga(P) {
  var p = P.propuesta();
  if (!p.vitrina) { fallos.push('con un perfil completo, propuesta() no devolvió vitrina'); return; }
  if (!p.listo) { fallos.push('con un perfil completo, la vitrina no quedó lista para abrir'); return; }

  var claves = Object.keys(p.vitrina).filter(function (k) { return k !== 'v'; });
  claves.forEach(function (k) {
    if (k === CAMPO_ESTILO) return;   // declarado arriba, y lo revisa revisarEstilo()
    if (P.CAMPOS.indexOf(k) < 0) fallos.push('la vitrina lleva un campo fuera de la lista blanca: ' + k);
  });

  /* El estilo entra en el barrido de secretos igual que los demás, aplanado:
     si algún día alguien mete ahí una cadena libre, se ve aquí. */
  var texto = claves.map(function (k) {
    var v = p.vitrina[k];
    return v && typeof v === 'object' ? Object.keys(v).map(function (x) { return v[x]; }).join(' ') : String(v);
  }).join(' | ').toLowerCase();
  Object.keys(SECRETOS).forEach(function (nombre) {
    var secreto = String(SECRETOS[nombre]).toLowerCase();
    if (texto.indexOf(secreto) >= 0) {
      fallos.push('la vitrina publica algo privado (' + nombre + '): «' + SECRETOS[nombre] + '»');
    }
  });
}

function revisarVolcado() {
  /* Se recarga el módulo con un `problema` que viene de una misión: es el
     volcado de todos los campos unidos por ' · ' y empieza por el nombre de
     la persona entrevistada. No se puede publicar. */
  var ventana = cargar();
  ventana.Venture.decision = function (k) {
    if (k === 'problema') {
      return { value: 'Mariana Gómez · gasta $800 al mes · quiere algo más barato', from: 'mision' };
    }
    return null;
  };
  var p = ventana.Plaza.propuesta();
  if (p.vitrina && p.vitrina.problema) {
    fallos.push('un problema entregado en una misión (volcado con « · ») llegó a la vitrina: «' +
      p.vitrina.problema + '»');
  }
}

/* ==================================================================
   3 — CONTACTO
   ================================================================== */

var CONTACTOS = [
  'escríbeme a hola@luzdebarro.mx',
  'mi whatsapp es 55 1234 5678',
  'búscame en https://instagram.com/luzdebarro',
  'soy @luzdebarro en todas partes',
  'llámame al 5512345678'
];

function revisarContacto(P) {
  CONTACTOS.forEach(function (t) {
    if (!P.tieneContacto(t)) fallos.push('no detecta un dato de contacto: «' + t + '»');
  });

  /* Ni por la puerta de atrás: una corrección a mano pasa por el mismo filtro. */
  var ventana = cargar();
  var ok = ventana.Plaza.editar('cliente', 'gente que renta, escríbeme a hola@luzdebarro.mx');
  if (ok) fallos.push('editar() aceptó una corrección con un correo dentro');
  var p = ventana.Plaza.propuesta();
  if (p.vitrina && String(p.vitrina.cliente).indexOf('@') >= 0) {
    fallos.push('un correo escrito a mano llegó a la vitrina');
  }

  /* Y una corrección normal sí tiene que entrar. Un filtro que lo bloquea
     todo protege igual de bien y hace la función inservible. */
  var ventana2 = cargar();
  if (!ventana2.Plaza.editar('cliente', 'gente de 25 a 40 que renta departamento')) {
    fallos.push('editar() rechazó una corrección legítima');
  }
  if (ventana2.Plaza.propuesta().vitrina.cliente.indexOf('25 a 40') < 0) {
    fallos.push('la corrección legítima no se aplicó a la vitrina');
  }
}

/* ==================================================================
   5 — EL ALFABETO VISUAL
   ================================================================== */

function revisarEmojis() {
  var ventana = {};
  new Function('window', leer('js/data/iconos.js'))(ventana);
  var mapa = ventana.ICONOS.emoji;
  var re = /\p{Extended_Pictographic}️?/gu;

  ['js/screens/plaza.js', 'js/core/plaza.js'].forEach(function (rel) {
    var usados = leer(rel).match(re) || [];
    usados.filter(function (e, i, a) { return a.indexOf(e) === i; }).forEach(function (e) {
      if (!mapa[e] && !mapa[e.replace('️', '')]) {
        fallos.push(rel + ' usa ' + e + ', que no está dibujado: saldría con la cara del sistema');
      }
    });
  });
}

/* ==================================================================
   6 — LOS TOLDOS
   ================================================================== */

function revisarToldos(P) {
  var css = leer('css/plaza.css');

  /* Cada sector necesita las dos cosas: un rótulo corto que quepa en el
     cartel y un toldo con su color. Con una sola, o el cartel desborda o dos
     negocios distintos se ven exactamente igual. */
  SECTORES.forEach(function (s) {
    if (!P.ROTULO[s]) fallos.push('el sector «' + s + '» no tiene rótulo de toldo en plaza.js');
    else if (P.ROTULO[s].length > 14) {
      fallos.push('el rótulo de «' + s + '» («' + P.ROTULO[s] + '») no cabe en el toldo');
    }
  });

  SECTORES.forEach(function (s) {
    if (s === 'otro') return;   // usa el toldo de reserva de [data-toldo] a propósito
    if (css.indexOf('[data-toldo="' + s + '"]') < 0) {
      fallos.push('el sector «' + s + '» no tiene toldo en css/plaza.css');
    }
  });
  if (css.indexOf('.puesto:not(.puesto--tuyo)') < 0) {
    fallos.push('falta el cortafuegos que apaga --neg-* dentro de un puesto ajeno');
  }
}

/* ==================================================================
   7 — QUE POR EL ESTILO NO ENTRE NADA ESCRITO

   `estilo` es el único campo publicable que no es texto, y por eso es el
   único sitio de la vitrina por el que alguien podría intentar sacar una
   cadena libre. Se comprueba de dos maneras: que lo que sale de verdad son
   claves del catálogo, y que un estilo falsificado —el que mandaría un
   cliente modificado— no consigue sacar nada.
   ================================================================== */

function revisarEstilo(ventana) {
  var P2 = ventana.Plaza, PU = ventana.Puesto, K = ventana.PUESTO_PIEZAS;
  var v = P2.propuesta().vitrina;

  if (!v || !v.estilo) { fallos.push('la vitrina no lleva estilo: los vecinos verían el puesto de serie'); return; }

  K.RANURAS.forEach(function (r) {
    if (!Object.prototype.hasOwnProperty.call(v.estilo, r)) {
      fallos.push('el estilo publicado no trae la ranura «' + r + '»');
    } else if (!K.valida(r, v.estilo[r])) {
      fallos.push('el estilo publica «' + v.estilo[r] + '» en «' + r + '», que no está en el catálogo');
    }
  });

  Object.keys(v.estilo).forEach(function (k) {
    if (K.RANURAS.indexOf(k) < 0) fallos.push('el estilo lleva una ranura que no existe: ' + k);
  });

  /* Lo que mandaría un cliente modificado: una ranura inventada, un valor
     inventado y una cadena con un teléfono dentro. Nada de eso puede
     sobrevivir a limpio(). */
  var sucio = PU.limpio({
    toldo: 'rayas', color: '<script>', letrero: 'llámame al 55 1234 5678',
    adorno: 'macetas', suelo: 'ninguno', __proto__: 'x', extra: 'fuga'
  });
  if (sucio.color !== 'oficio') fallos.push('un color inventado sobrevivió a limpio(): ' + sucio.color);
  if (sucio.letrero !== 'ninguno') fallos.push('un letrero escrito a mano sobrevivió a limpio(): ' + sucio.letrero);
  if (sucio.extra !== undefined) fallos.push('limpio() dejó pasar una ranura que no existe');
  if (sucio.toldo !== 'rayas' || sucio.adorno !== 'macetas') {
    fallos.push('limpio() tiró piezas válidas: el usuario perdería su decoración');
  }
}

/* ==================================================================
   EJECUCIÓN
   ================================================================== */

var P;
try {
  var ventana = cargar();
  P = ventana.Plaza;
  revisarContrato(P);
  revisarFuga(P);
  revisarVolcado();
  revisarContacto(P);
  revisarEmojis();
  revisarToldos(P);
  revisarEstilo(ventana);
} catch (e) {
  console.error('✗ no se pudo revisar la vitrina: ' + e.message);
  process.exit(1);
}

if (fallos.length) {
  console.error('✗ vitrina de la Plaza: ' + fallos.length + ' problema(s)\n');
  fallos.forEach(function (f) { console.error('  · ' + f); });
  process.exit(1);
}

console.log('✓ vitrina correcta: ' + P.CAMPOS.length + ' campos publicables, ' +
  P.EDITABLES.length + ' editables, ' + P.NUNCA.length + ' familias de datos que nunca salen.');
