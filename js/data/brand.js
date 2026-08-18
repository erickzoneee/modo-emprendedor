/* ==========================================================================
   MARCA Y ENTORNO — la única fuente de los nombres

   Hasta ahora el nombre de la app vivía escrito a mano en dieciocho archivos y
   el de la mascota en veinticuatro. Cambiar de marca era un reemplazo global a
   ciegas, y entre esas ocurrencias hay cuatro que NO son texto: son claves de
   almacenamiento y nombres de caché. Reemplazarlas junto con las demás borra
   el progreso de todo el mundo.

   Este archivo separa las dos cosas:

     · IDENTIDAD  — lo que el usuario lee. Cambiarlo es seguro.
     · CLAVES     — lo que el navegador guarda. Cambiarlo exige migración.

   Se carga el primero de todos, antes que Store, porque Store lee de aquí.
   Y funciona igual dentro del service worker, que lo trae con importScripts:
   por eso se cuelga de `self` y no de `window`.

   Lo que TODAVÍA no lee de aquí, a propósito:
     · Las etiquetas <meta> de index.html. Las lee un robot de WhatsApp o de
       Facebook que nunca ejecuta JavaScript, así que tienen que estar escritas
       en el HTML. Se cambian a mano en la Fase 4.
     · assets/og-image.png, que lleva el nombre dibujado dentro.
   ========================================================================== */
(function (raiz) {
  'use strict';

  /* ------------------------------ Identidad ------------------------------
     Esto es texto para leer. Cambiarlo no rompe nada guardado.
     En la Fase 4 pasa a ser 'EMPRENDO'. */

  var IDENTIDAD = {
    nombre: 'Modo Emprendedor',
    nombreCorto: 'Emprendedor',
    mascota: 'Chispa',
    eslogan: 'Aprende. Construye. Vende.',

    /* El logotipo va aparte del nombre, y a propósito dice ya la marca nueva.

       La pantalla de arranque es lo único que lo usa. Es el sitio donde el
       cambio de marca no cuesta nada: no hay texto alrededor con el que
       chocar, no hay nada guardado que dependa de él y es la primera imagen
       que ve el usuario, que es justo la que interesa mover primero.

       Hasta la Fase 4 habrá una incoherencia visible —el arranque dice
       EMPRENDO y el resto de la app sigue diciendo Modo Emprendedor—. Está
       aceptada: la alternativa era renombrar treinta y ocho cadenas repartidas
       por dieciocho archivos dentro de un cambio que solo iba de animar una
       pantalla. En la Fase 4, `nombre` alcanza a `logotipo` y esto sobra. */
    logotipo: 'EMPRENDO'
  };

  /* ------------------------------- Claves -------------------------------

     CUIDADO. Estas cadenas no son nombres: son direcciones. El navegador
     guarda el progreso bajo ellas y no entiende de marcas. Cambiar una sin
     migrarla equivale a borrar el progreso de todos los que ya la tenían,
     porque el estado sigue ahí pero nadie vuelve a preguntar por él.

     La Fase 4 las cambia, y por eso la Fase 4 necesita antes una migración
     que copie de la clave vieja a la nueva. El motor que lo permite está en
     js/core/store.js desde la fase anterior.
     ---------------------------------------------------------------------- */

  var CLAVES = {
    estado: 'modo-emprendedor:v1',
    ia: 'modo-emprendedor:ai',
    worker: 'modo-emprendedor:worker'
  };

  /* Prefijo de las cachés de la PWA. El service worker borra las que empiezan
     así y respeta las demás —las del modelo de IA local, que pesan cientos de
     megas—. Al renombrar, el prefijo nuevo se añade DELANTE y el viejo se
     queda en la lista hasta que ya no quede nadie con cachés antiguas. */
  var CACHE_PREFIJOS = ['modo-emprendedor-'];

  var ARCHIVO_RESPALDO = 'modo-emprendedor-respaldo.json';

  /* ------------------------------ Dominios ------------------------------

     Hoy los tres apuntan a GitHub Pages porque emprendo.mx todavía no está
     comprado. Cuando lo esté, se cambian aquí y en ningún otro sitio.

     `api` vacío significa que la IA gratuita no tiene servidor asignado y el
     usuario tiene que pegar la dirección a mano. Eso se arregla en la Fase 2,
     que es también donde esta cadena deja de estar vacía.

     Ojo con `app`: mover la app a otro dominio es cambiar de origen, y el
     navegador no deja que el origen nuevo lea lo que guardó el viejo. Ese
     traslado necesita un puente aparte, no basta con cambiar esta línea.
     Está documentado en docs/arquitectura.md.
     ---------------------------------------------------------------------- */

  var DOMINIOS = {
    sitio: 'https://erickzoneee.github.io/modo-emprendedor',
    app: 'https://erickzoneee.github.io/modo-emprendedor',
    api: ''
  };

  raiz.BRAND = {
    nombre: IDENTIDAD.nombre,
    nombreCorto: IDENTIDAD.nombreCorto,
    mascota: IDENTIDAD.mascota,
    eslogan: IDENTIDAD.eslogan,
    logotipo: IDENTIDAD.logotipo,
    claves: CLAVES,
    cachePrefijos: CACHE_PREFIJOS,
    archivoRespaldo: ARCHIVO_RESPALDO,
    dominios: DOMINIOS,

    /** ¿Hay servidor de IA gratuita configurado de fábrica? Hasta la Fase 2, no. */
    hayApi: function () { return !!DOMINIOS.api; }
  };
})(typeof self !== 'undefined' ? self : window);
