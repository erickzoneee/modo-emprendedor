/* ==========================================================================
   VERIFICADOR DEL PLAN DE LA SEMANA Y DEL MATERIAL LISTO

   Los dos son catálogos declarativos: una tabla de funciones que alguien lee
   y otra que las ejecuta. Ese arreglo tiene un fallo típico y silencioso —una
   entrada que nunca se cumple, una plantilla que revienta con un dato que
   falta, una tarea que manda a una pantalla que no existe— y ninguno de esos
   tres da error hasta que le pasa a una persona.

   Este script ejecuta las 25 tareas y los 8 materiales contra SIETE perfiles
   falsos que cubren las cuatro etapas, el que acaba de entrar y el que lo
   tiene todo, y comprueba:

   EL PLAN
   1. Ninguna tarea es inalcanzable: cada una aplica en al menos un perfil.
   2. En los siete perfiles salen SIEMPRE tres tareas. Un plan con dos es un
      plan roto, y con cero es una pantalla en blanco para quien pagó.
   3. Ninguna función lanza con datos incompletos, que es el caso normal.
   4. Ninguna deja el título o el porqué vacíos. El porqué es lo que hace que
      esto valga lo que cuesta: una tarea sin él es una tarea de menos.
   5. Todas mandan a una pantalla que existe de verdad en js/screens/.
   6. No hay ids repetidos.
   7. Ninguna tarea promete algo que su `hecho()` no pueda ver nunca — o sea,
      las que devuelven false fijo están declaradas aquí abajo a propósito.

   EL MATERIAL
   8. Las 8 plantillas se pintan con un perfil vacío sin lanzar.
   9. Ninguna deja corchetes de más de 60 caracteres, que es lo que pasa
      cuando una plantilla se queda sin dato y se rellena con la frase entera.
   10. Cada dato que piden existe en la tabla DATOS y lleva a una pantalla real.

   Uso:
     node tools/check-plan.js
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var fallos = [];
var avisos = [];

function leer(rel) { return fs.readFileSync(path.join(raiz, rel), 'utf8'); }

/* Las tareas que a propósito nunca se marcan solas: son cosas que pasan fuera
   de la app y no dejan rastro que la app pueda mirar. Están declaradas aquí
   para que añadir una tercera sea una decisión y no un descuido — el día que
   la mitad del plan no se pueda tachar, esto deja de sentirse como un plan. */
var SIN_RASTRO = ['pide-referido', 'foto-producto', 'revisa-margen', 'repasa', 'mira-numeros', 'pregunta-chispa'];

/* ==========================================================================
   LAS PANTALLAS QUE EXISTEN
   ========================================================================== */

function pantallasRegistradas() {
  var dir = path.join(raiz, 'js/screens');
  var out = {};
  fs.readdirSync(dir).filter(function (f) { return f.endsWith('.js'); }).forEach(function (f) {
    var src = fs.readFileSync(path.join(dir, f), 'utf8');
    var re = /UI\.Router\.register\('([a-z-]+)'/g, m;
    while ((m = re.exec(src))) out[m[1]] = true;
  });
  return out;
}

/* ==========================================================================
   LOS CATÁLOGOS
   ========================================================================== */

function cargar(rel, clave) {
  var ventana = {};
  new Function('window', leer(rel))(ventana);
  if (!ventana[clave]) throw new Error(rel + ' no publicó ' + clave + ' en window');
  return ventana[clave];
}

/* ==========================================================================
   SIETE PERFILES FALSOS

   Se construye el contexto a mano, con la misma forma que arma
   `Plan.__contexto()`. Copiarlo aquí es deliberado: si esa forma cambia y
   este script no se entera, las pruebas dejarían de probar lo que creen.
   ========================================================================== */

function terms(extra) {
  var base = {
    tiene: { producto: true, cliente: true, idea: true, nombre: true, lugar: true },
    negocio: 'Cuero y Colmillo', idea: 'collares de cuero', ideaCorta: 'collares de cuero',
    producto: 'collares de cuero cosidos a mano', productoCorto: 'collares de cuero',
    tuProducto: 'tus collares de cuero', cliente: 'dueños de perros grandes',
    clienteCorto: 'dueños de perros', tuCliente: 'dueños de perros grandes',
    unidad: 'pieza', unidades: 'piezas', unaUnidad: 'una pieza', laUnidad: 'la pieza',
    cuantasUnidades: 'cuántas piezas', unidadesVendidas: 'piezas vendidas',
    sector: 'hechoamano', sectorTitulo: 'Hecho a mano', sectorEmoji: '🧵',
    personalidad: 'Cercana', personalidadKey: 'cercana', tono: 'cercano',
    lugar: 'Toluca', etapa: 'starting', etapaCorta: 'Comenzando', etapaTexto: 'estás comenzando',
    objetivo: 'conseguir tu primer cliente', objetivoKey: 'primera',
    presupuesto: '', presupuestoKey: 'low', minutos: 20, experiencia: '',
    precio: 450, costo: 180
  };
  for (var k in (extra || {})) base[k] = extra[k];
  return base;
}

function ctx(over) {
  var t = terms(over && over.terms);
  var base = {
    t: t,
    etapa: t.etapa,
    sector: t.sector,
    minutos: t.minutos || 15,
    siguiente: { kind: 'lesson', id: 'n1-02', data: { title: 'Encuentra el problema', min: 6 } },
    leccionesHechas: 6,
    leccionesEstaSemana: 1,
    tieneOferta: !!t.tiene.producto,
    tienePrecio: !!t.precio,
    tieneCosto: !!t.costo,
    margenFlojo: false,
    perfilPct: 80,
    seccionesVacias: [{ key: 'canales', title: 'Dónde vendes' }, { key: 'plan', title: 'Plan de 90 días' }],
    semanasSim: 0,
    puestoAbierto: false,
    diasSinRespaldo: 3,
    hechoNodo: function () { return false; },
    dossier: function () { return false; },
    decidio: function () { return false; }
  };
  for (var k in (over || {})) if (k !== 'terms') base[k] = over[k];
  return base;
}

var VACIAS_MUCHAS = [
  { key: 'problema', title: 'El problema que resuelves' }, { key: 'cliente', title: 'Tu cliente ideal' },
  { key: 'oferta', title: 'Tu oferta' }, { key: 'precio', title: 'Costos y precio' },
  { key: 'identidad', title: 'Identidad básica' }, { key: 'canales', title: 'Dónde vendes' },
  { key: 'ventas', title: 'Guion de ventas' }
];

var PERFILES = [
  { nombre: 'recién llegado', c: ctx({
      terms: { etapa: 'idea', precio: 0, costo: 0, tiene: { producto: false, cliente: false, idea: true, nombre: false, lugar: false } },
      leccionesHechas: 0, leccionesEstaSemana: 0, perfilPct: 25, diasSinRespaldo: null,
      seccionesVacias: VACIAS_MUCHAS
    }) },

  /* Ha avanzado en la ruta pero no ha llenado nada del expediente. Es de los
     estados más comunes que hay, y es el único que hace salir la tarea de
     llenar una sección. */
  { nombre: 'avanza sin escribir', c: ctx({
      terms: { etapa: 'idea', precio: 0, costo: 0 },
      leccionesHechas: 5, leccionesEstaSemana: 2, perfilPct: 55,
      seccionesVacias: VACIAS_MUCHAS
    }) },

  /* Sacó su costo unitario y todavía no ha puesto precio. Es el hueco exacto
     entre las dos lecciones de dinero, y dura semanas. */
  { nombre: 'sabe su costo, no su precio', c: ctx({
      terms: { etapa: 'starting', precio: 0, costo: 180 },
      leccionesHechas: 12, leccionesEstaSemana: 2
    }) },

  { nombre: 'comenzando', c: ctx({ terms: { etapa: 'starting' } }) },
  { nombre: 'operando', c: ctx({ terms: { etapa: 'operating' }, leccionesHechas: 24, semanasSim: 6, puestoAbierto: true }) },
  { nombre: 'creciendo', c: ctx({
      terms: { etapa: 'growing', precio: 200, costo: 170 },
      margenFlojo: true, leccionesHechas: 40, leccionesEstaSemana: 5,
      siguiente: { kind: 'boss', id: 'boss-6', data: { title: 'Tres clientes nuevos' } }
    }) },
  { nombre: 'lo tiene todo', c: ctx({
      terms: { etapa: 'growing' },
      leccionesHechas: 50, leccionesEstaSemana: 6, perfilPct: 100, semanasSim: 12,
      puestoAbierto: true, diasSinRespaldo: 0, seccionesVacias: [], siguiente: null,
      dossier: function () { return true; }, decidio: function () { return true; }
    }) }
];

/* Un contexto aparte donde TODO está hecho, para probar los `hecho()`.

   Hace falta uno propio porque `cuando()` y `hecho()` son casi opuestos por
   diseño: una tarea aplica justamente cuando NO está hecha. Evaluando `hecho`
   solo en las tareas que aplican, nunca daría true, y la comprobación de que
   una tarea se puede tachar no probaría nada.

   Lleva `siguiente` y `seccionesVacias` con contenido a propósito, aunque un
   estado real con todo hecho no los tendría: sin ellos, los `hecho()` que los
   leen lanzarían y el fallo parecería del catálogo. */
var TODO_HECHO = ctx({
  terms: { etapa: 'growing', precio: 450, costo: 180 },
  leccionesHechas: 50, leccionesEstaSemana: 7, perfilPct: 100,
  semanasSim: 12, puestoAbierto: true, diasSinRespaldo: 0,
  hechoNodo: function () { return true; },
  dossier: function () { return true; },
  decidio: function () { return true; }
});

/* ==========================================================================
   EL PLAN
   ========================================================================== */

function revisarPlan(pantallas) {
  var P = cargar('js/data/plan-semanal.js', 'PLAN_SEMANAL');
  var tareas = P.TAREAS;

  // 6 · ids únicos
  var vistos = {};
  tareas.forEach(function (t) {
    if (vistos[t.id]) fallos.push('id de tarea repetido: «' + t.id + '»');
    vistos[t.id] = true;
    if (!P.FAMILIAS[t.familia]) fallos.push('la tarea «' + t.id + '» usa la familia «' + t.familia + '», que no existe');
    if (typeof t.peso !== 'number') fallos.push('la tarea «' + t.id + '» no tiene peso');
  });

  // 5 · pantallas de verdad
  tareas.forEach(function (t) {
    var p = t.ir && t.ir.pantalla;
    if (!p) { fallos.push('la tarea «' + t.id + '» no dice a dónde lleva'); return; }
    if (!pantallas[p]) {
      fallos.push('la tarea «' + t.id + '» manda a la pantalla «' + p + '», que no está registrada en js/screens/');
    }
  });

  // 1, 3, 4 · se ejecutan contra los siete perfiles
  var alcanzada = {};
  var seMarca = {};

  PERFILES.forEach(function (perfil) {
    tareas.forEach(function (t) {
      var aplica;
      try { aplica = !!t.cuando(perfil.c); }
      catch (e) { fallos.push('«' + t.id + '».cuando() lanzó con el perfil «' + perfil.nombre + '»: ' + e.message); return; }
      if (!aplica) return;
      alcanzada[t.id] = true;

      var titulo, porque;
      try { titulo = t.titulo(perfil.c); }
      catch (e) { fallos.push('«' + t.id + '».titulo() lanzó con «' + perfil.nombre + '»: ' + e.message); return; }
      try { porque = t.porque(perfil.c); }
      catch (e) { fallos.push('«' + t.id + '».porque() lanzó con «' + perfil.nombre + '»: ' + e.message); return; }

      if (!titulo || String(titulo).trim().length < 8) {
        fallos.push('«' + t.id + '» deja el título vacío o demasiado corto con «' + perfil.nombre + '»');
      }
      if (!porque || String(porque).trim().length < 30) {
        fallos.push('«' + t.id + '» se queda sin porqué con «' + perfil.nombre + '». ' +
                    'El porqué es lo que separa esto de una lista de pendientes.');
      }
      if (/undefined|null|NaN|\[object/.test(String(titulo) + String(porque))) {
        fallos.push('«' + t.id + '» pinta un hueco sin rellenar con «' + perfil.nombre + '»: ' + titulo + ' / ' + porque);
      }

      try { t.hecho(perfil.c); }
      catch (e) { fallos.push('«' + t.id + '».hecho() lanzó con «' + perfil.nombre + '»: ' + e.message); }
    });
  });

  /* 7 · ¿se puede tachar? Se prueba contra el contexto donde todo está hecho
     y para TODAS las tareas, apliquen o no: una tarea aplica justamente
     cuando no está hecha, así que preguntárselo solo a las que aplican no
     probaría nada. */
  tareas.forEach(function (t) {
    try { if (t.hecho(TODO_HECHO)) seMarca[t.id] = true; }
    catch (e) { fallos.push('«' + t.id + '».hecho() lanzó con todo hecho: ' + e.message); }
  });

  tareas.forEach(function (t) {
    if (!alcanzada[t.id]) {
      fallos.push('la tarea «' + t.id + '» no le sale a NADIE: su `cuando` no se cumple en ninguno de los ' +
                  PERFILES.length + ' perfiles. O sobra, o su condición está mal.');
    }
    // 7 · las que nunca se pueden marcar tienen que estar declaradas
    if (!seMarca[t.id] && SIN_RASTRO.indexOf(t.id) < 0) {
      avisos.push('«' + t.id + '» no se marcó como hecha en ninguno de los perfiles. ' +
                  'Si es porque pasa fuera de la app, decláralo en SIN_RASTRO.');
    }
    if (seMarca[t.id] && SIN_RASTRO.indexOf(t.id) >= 0) {
      fallos.push('«' + t.id + '» está en SIN_RASTRO pero sí se marca sola. Sácala de la lista.');
    }
  });

  // 2 · siempre tres
  PERFILES.forEach(function (perfil) {
    var aplican = tareas.filter(function (t) {
      try { return !!t.cuando(perfil.c); } catch (e) { return false; }
    });
    if (aplican.length < 3) {
      fallos.push('al perfil «' + perfil.nombre + '» solo le aplican ' + aplican.length +
                  ' tareas: su plan saldría incompleto.');
    }
  });

  return tareas.length;
}

/* ==========================================================================
   EL MATERIAL
   ========================================================================== */

function revisarMateriales(pantallas) {
  var M = cargar('js/data/materiales.js', 'MATERIALES');
  var lista = M.LISTA, D = M.DATOS;

  var vistos = {};
  lista.forEach(function (m) {
    if (vistos[m.id]) fallos.push('id de material repetido: «' + m.id + '»');
    vistos[m.id] = true;
    if (!m.nombre || !m.para) fallos.push('el material «' + m.id + '» no dice qué es o para qué sirve');

    // 10 · los datos que pide existen y llevan a algún sitio
    (m.pide || []).forEach(function (clave) {
      if (!D[clave]) {
        fallos.push('el material «' + m.id + '» pide «' + clave + '», que no está en la tabla DATOS');
        return;
      }
      if (!pantallas[D[clave].ir]) {
        fallos.push('el dato «' + clave + '» manda a la pantalla «' + D[clave].ir + '», que no existe');
      }
    });
  });

  // 8 y 9 · se pintan con todos los perfiles, incluido el vacío
  PERFILES.forEach(function (perfil) {
    lista.forEach(function (m) {
      var texto;
      try { texto = m.texto(perfil.c.t); }
      catch (e) { fallos.push('el material «' + m.id + '» lanzó con el perfil «' + perfil.nombre + '»: ' + e.message); return; }

      if (!texto || String(texto).trim().length < 40) {
        fallos.push('el material «' + m.id + '» sale casi vacío con «' + perfil.nombre + '»');
      }
      if (/undefined|null|NaN|\[object/.test(String(texto))) {
        fallos.push('el material «' + m.id + '» pinta un hueco sin rellenar con «' + perfil.nombre + '»');
      }
      /* Un corchete largo es una plantilla que se quedó sin dato y metió la
         frase entera dentro. Se lee fatal y delata que la app no sabía nada. */
      var largos = String(texto).match(/\[[^\]]{61,}\]/g);
      if (largos) {
        fallos.push('el material «' + m.id + '» deja un hueco larguísimo con «' + perfil.nombre + '»: ' + largos[0].slice(0, 70));
      }
      // Dos saltos de línea seguidos de más son un renglón perdido.
      if (/\n{3,}/.test(String(texto))) {
        fallos.push('el material «' + m.id + '» deja renglones en blanco de más con «' + perfil.nombre + '»');
      }

      /* Y lo contrario, que es el fallo que de verdad pasó: los ocho
         materiales son de varios párrafos, y la primera versión de `juntar()`
         se comía los renglones en blanco junto con los datos que faltaban.
         Salían como un ladrillo. No fallaba nada — solo se leían mal, que es
         la única forma en que un texto así puede fallar. */
      if (String(texto).indexOf('\n\n') < 0) {
        fallos.push('el material «' + m.id + '» sale sin un solo párrafo con «' + perfil.nombre +
                    '». Un mensaje de venta sin aire no se lee: revisa que juntar() no se esté ' +
                    'comiendo los renglones en blanco.');
      }
    });
  });

  return lista.length;
}

/* ================================= Salida ================================= */

var nTareas = 0, nMateriales = 0;
try {
  var pantallas = pantallasRegistradas();
  nTareas = revisarPlan(pantallas);
  nMateriales = revisarMateriales(pantallas);
} catch (e) {
  console.error('✗ no se pudo comprobar el plan: ' + (e && e.stack || e));
  process.exit(1);
}

avisos.forEach(function (a) { console.warn('  aviso: ' + a); });

if (fallos.length) {
  console.error('✗ plan de la semana y material: ' + fallos.length + ' problema(s)\n');
  fallos.forEach(function (f) { console.error('  · ' + f); });
  process.exit(1);
}

console.log('✓ plan y material correctos: ' + nTareas + ' tareas y ' + nMateriales +
  ' materiales, ejecutados contra ' + PERFILES.length + ' perfiles. Todas alcanzables, ' +
  'ninguna sin porqué y ninguna manda a una pantalla que no existe.');
