/* ==========================================================================
   MI PUESTO — qué le puso encima el usuario

   La capa fina entre el catálogo cerrado de js/data/puesto-piezas.js y las
   pantallas que pintan un puesto. Guarda lo que eligió, valida todo lo que
   entra y sabe vestir un puesto ya dibujado.

   TRES REGLAS

   1. NADA ENTRA SIN LISTA BLANCA. `limpio()` es la única puerta, y la usan
      por igual lo que elige el usuario, lo que se guarda, lo que se publica y
      lo que llega de otra persona. Una clave que no esté en el catálogo no se
      corrige ni se avisa: se cae al valor de serie.

   2. LO DE SERIE ES EL PUESTO DE ANTES. Quien no toque nada tiene que ver
      exactamente el puesto que ya tenía. Por eso DEFECTO no es "vacío": es
      festón, el color de su oficio y sin nada más.

   3. ES SUYO, ASÍ QUE VIAJA EN SU RESPALDO. Vive en `state.plaza.puesto`,
      dentro de lo que exporta Store, junto a su vitrina. No es un dato de
      otra persona y no tiene por qué quedarse fuera.

   EL INTERRUPTOR DE APARIENCIA
   Cuando está apagado, `estilo()` devuelve el puesto de serie. No es un
   capricho: css/puesto.css apaga la decoración del puesto propio en pantalla,
   y publicar algo que él no puede ver rompería "lo ves entero antes".
   ========================================================================== */
(function (w) {
  'use strict';

  var VERSION = 1;

  function K() { return w.PUESTO_PIEZAS; }

  /** Una copia nueva del puesto de serie. Nunca se devuelve el objeto del
      catálogo: quien lo reciba podría escribirle encima. */
  function defecto() {
    var K2 = K(), out = {}, i;
    if (!K2) return out;
    for (i = 0; i < K2.RANURAS.length; i++) {
      out[K2.RANURAS[i]] = K2.DEFECTO[K2.RANURAS[i]];
    }
    return out;
  }

  /**
   * La única puerta. Recibe cualquier cosa —lo del usuario, lo del respaldo,
   * lo que llegó por la red— y devuelve un estilo que se puede pintar.
   */
  function limpio(bruto) {
    var K2 = K(), out = defecto(), i, r;
    if (!K2 || !bruto || typeof bruto !== 'object') return out;

    for (i = 0; i < K2.RANURAS.length; i++) {
      r = K2.RANURAS[i];
      if (typeof bruto[r] === 'string' && K2.valida(r, bruto[r])) out[r] = bruto[r];
    }
    return out;
  }

  /** ¿Este estilo es el de serie, sin tocar? Sirve para no ensuciar la red ni
      la pantalla de decorar con un "restablecer" que no restablece nada. */
  function esDefecto(e) {
    var K2 = K(), d = defecto(), i, r;
    if (!K2) return true;
    for (i = 0; i < K2.RANURAS.length; i++) {
      r = K2.RANURAS[i];
      if (e[r] !== d[r]) return false;
    }
    return true;
  }

  /* ==================================================================
     EL ESTADO
     ================================================================== */

  function bolsa() {
    var s = w.Store && w.Store.state;
    if (!s) return null;
    if (!s.plaza || typeof s.plaza !== 'object') {
      s.plaza = { v: 1, vitrina: null, editada: {}, aprobadaAt: 0, rev: null, puesto: defecto() };
    }
    if (!s.plaza.puesto || typeof s.plaza.puesto !== 'object') s.plaza.puesto = defecto();
    return s.plaza;
  }

  /** Lo que eligió, ya validado. Es lo que se enseña en la pantalla de
      decorar y lo que se pinta en su Plaza. */
  function actual() {
    var b = bolsa();
    return limpio(b ? b.puesto : null);
  }

  /** Cambia una pieza. Devuelve false —y no guarda nada— si la ranura o la
      clave no existen: un catálogo cerrado que acepta lo que sea no es un
      catálogo cerrado. */
  function set(ranura, clave) {
    var K2 = K();
    if (!K2 || K2.RANURAS.indexOf(ranura) < 0) return false;
    if (!K2.valida(ranura, clave)) return false;

    w.Store.set(function (s) {
      if (!s.plaza.puesto || typeof s.plaza.puesto !== 'object') s.plaza.puesto = defecto();
      s.plaza.puesto[ranura] = clave;
    }, 'puesto');
    alPuestoAbierto();
    return true;
  }

  function restablecer() {
    w.Store.set(function (s) { s.plaza.puesto = defecto(); }, 'puesto');
    alPuestoAbierto();
  }

  /**
   * Si ya hay un puesto abierto, su vitrina aprobada se pone al día con la
   * decisión que se acaba de tomar.
   *
   * Vive AQUÍ y no en la pantalla de decorar, y eso costó una prueba: cuando
   * solo lo hacía la pantalla, cualquier otra forma de cambiar una pieza
   * dejaba la vitrina aprobada con la decoración vieja, y el aviso de "tu
   * puesto no está al día" se quedaba encendido sin que hubiera nada que
   * arreglar. Una invariante que solo se cumple si entras por la puerta
   * buena no es una invariante.
   *
   * Lo que NO hace es hablar con la red: eso es de la pantalla, que es quien
   * puede esperar a que deje de tocar y avisar si falla.
   */
  function alPuestoAbierto() {
    if (w.Plaza && typeof w.Plaza.sincronizarEstilo === 'function') w.Plaza.sincronizarEstilo();
  }

  /* ==================================================================
     LO QUE SE PUBLICA

     Se llama en dos sitios —al aprobar la vitrina y al cambiar una pieza con
     el puesto ya abierto— y en los dos tiene que dar lo mismo.
     ================================================================== */

  /** ¿Está encendida la apariencia por emprendimiento? Si Persona no está
      cargado —lab, verificadores— se asume que sí. */
  function apariencia() {
    if (!w.Persona || typeof w.Persona.activa !== 'function') return true;
    try { return w.Persona.activa(); } catch (e) { return true; }
  }

  function estilo() {
    return apariencia() ? actual() : defecto();
  }

  /* ==================================================================
     VESTIR UN PUESTO YA DIBUJADO

     Recibe el hueco —el contenedor de css/plaza.css, no el artículo— porque
     el suelo y los adornos son hermanos del puesto y no hijos suyos.
     ================================================================== */

  /**
   * Pone los atributos y añade las piezas sueltas.
   * @param {Element} hueco   el .pz-hueco
   * @param {Object}  bruto   el estilo, de donde sea; se valida aquí dentro
   */
  function decorar(hueco, bruto) {
    var K2 = K(), d = w.document;
    if (!hueco || !K2) return;

    var e = limpio(bruto);
    var i, r;
    for (i = 0; i < K2.RANURAS.length; i++) {
      r = K2.RANURAS[i];
      hueco.setAttribute('data-pz-' + r, e[r]);
    }

    /* El color, además, en el artículo. Ahí es donde css/plaza.css escribe el
       del sector con `[data-toldo]`, y solo desde el mismo elemento se le
       puede ganar. Ver la cabecera de css/puesto.css. */
    var art = hueco.querySelector('.puesto');
    if (art) art.setAttribute('data-pz-color', e.color);

    /* El suelo va DESPUÉS del artículo en el marcado: es lo que hay debajo, y
       el orden del DOM es lo que lo deja debajo sin pelear con z-index. */
    if (e.suelo !== 'ninguno') {
      var suelo = d.createElement('div');
      suelo.className = 'puesto__suelo';
      hueco.appendChild(suelo);
    }

    /* Los adornos van en una capa suelta por encima de todo, anclada al pie o
       a la cabeza del puesto según lo que diga la pieza. El SVG sale del
       catálogo y de ningún otro sitio: es el único `innerHTML` de este
       archivo, y por eso su contenido no puede venir de la red. */
    if (e.adorno !== 'ninguno') hueco.appendChild(capaAdorno(e.adorno));
  }

  /** Las dos franjas y sus lienzos. Cambiar esto sin cambiar la proporción de
      css/puesto.css descoloca todas las piezas de esa zona. */
  var LIENZO = { bajo: '0 0 320 96', alto: '0 0 320 56' };

  function capaAdorno(clave) {
    var K2 = K(), d = w.document;
    var zona = (K2.ADORNO[clave] && K2.ADORNO[clave].zona) || 'bajo';
    var capa = d.createElement('div');
    capa.className = 'puesto__adorno puesto__adorno--' + zona;
    capa.setAttribute('aria-hidden', 'true');
    capa.innerHTML = '<svg viewBox="' + LIENZO[zona] + '" xmlns="http://www.w3.org/2000/svg">' +
                     K2.adornoSVG(clave) + '</svg>';
    return capa;
  }

  /** La muestra de una pieza para la pantalla de decorar. Devuelve un nodo
      listo para meter en un botón. Se dibuja con las piezas de verdad: elegir
      un toldo mirando el dibujo de otro es la sorpresa que hay que evitar. */
  function muestra(ranura, clave, sector) {
    var d = w.document;
    var caja = d.createElement('div');
    var e = actual();
    caja.className = 'dec-m dec-m--' + ranura;

    /* La muestra lleva SUS propios atributos: es un trozo de puesto suelto,
       fuera de cualquier .pz-hueco. `data-toldo` va también porque el color
       `oficio` no pinta nada por sí mismo — deja pasar el del sector. */
    if (ranura === 'toldo' || ranura === 'color' || ranura === 'letrero') {
      caja.setAttribute('data-toldo', sector || 'otro');
      caja.setAttribute('data-pz-color', ranura === 'color' ? clave : e.color);
    }

    if (ranura === 'toldo' || ranura === 'color') {
      caja.setAttribute('data-pz-toldo', ranura === 'toldo' ? clave : e.toldo);
      var toldo = d.createElement('div');
      toldo.className = 'puesto__toldo';
      caja.appendChild(toldo);

    } else if (ranura === 'letrero') {
      caja.setAttribute('data-pz-letrero', clave);
      var n = d.createElement('div');
      n.className = 'puesto__nombre';
      n.textContent = 'Tu negocio';
      caja.appendChild(n);

    } else if (ranura === 'suelo') {
      caja.setAttribute('data-pz-suelo', clave);
      var s = d.createElement('div');
      s.className = 'puesto__suelo';
      caja.appendChild(s);

    } else if (ranura === 'adorno') {
      /* La muestra usa el lienzo de SU zona: enseñar unos banderines dentro
         del lienzo del suelo los dibujaría en el sitio equivocado, que es
         justo la sorpresa que esta pantalla existe para evitar. */
      var zona = (K().ADORNO[clave] && K().ADORNO[clave].zona) || 'bajo';
      caja.classList.add('dec-m--adorno-' + zona);
      caja.innerHTML = '<svg viewBox="' + LIENZO[zona] + '" xmlns="http://www.w3.org/2000/svg">' +
                       K().adornoSVG(clave) + '</svg>';
    }
    return caja;
  }

  w.Puesto = {
    VERSION: VERSION,
    defecto: defecto,
    limpio: limpio,
    esDefecto: esDefecto,
    actual: actual,
    set: set,
    restablecer: restablecer,
    estilo: estilo,
    decorar: decorar,
    capaAdorno: capaAdorno,
    LIENZO: LIENZO,
    muestra: muestra
  };
})(window);
