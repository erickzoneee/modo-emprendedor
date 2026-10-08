/* ==========================================================================
   ANUNCIOS — el primer tercero de este proyecto

   Hasta hoy esta app no hacía UNA SOLA petición a nadie mientras el usuario
   no encendiera la IA. Eso se acaba aquí, y por eso este archivo es el único
   sitio por el que puede entrar una red publicitaria: una sola puerta, con
   las reglas escritas dentro y no repartidas por las pantallas.

   LAS SEIS REGLAS

   1. NUNCA dentro de una lección, de un reto ni de una conversación con
      Chispa. Solo hay dos huecos y están declarados abajo: el final de una
      lección y la Ruta. Los dos son sitios donde el usuario ya terminó algo.

   2. NUNCA antes de que alguien haya terminado su primera lección. Quien
      abre la app por primera vez no ve publicidad.

   3. NUNCA a pantalla completa ni con algo que haya que cerrar para seguir.
      Es un bloque en la página, no una interrupción.

   4. NUNCA con Impulso. El adaptador ni siquiera carga el script.

   5. NUNCA sin haber preguntado. La red pone cookies, y la app lleva desde
      el primer día diciendo que no usa ninguna. Se pregunta una vez, se
      respeta para siempre y se puede cambiar en Perfil.

   6. NUNCA se le manda a la red un dato del negocio. Ni el sector, ni la
      etapa, ni el texto de ninguna pantalla, ni el correo. Se carga un
      bloque y ya está. Esa es la única forma de que la promesa de
      js/core/promesa.js siga siendo verdad.

   APAGADO HASTA QUE HAYA IDENTIFICADOR

   Sin `CONFIG.ANUNCIOS.editor` no pasa nada de nada: no se carga script, no
   se pregunta y no se pinta ningún hueco. La aprobación de AdSense tarda
   días y puede denegarse, así que la app tiene que funcionar exactamente
   igual mientras tanto — y funciona, porque hoy ya lo hace.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var SCRIPT = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

  /* Los dos únicos huecos que existen. Es lista blanca y no lista negra a
     propósito: una pantalla nueva no hereda el permiso de enseñar publicidad
     porque a nadie se le ocurriera prohibirlo. */
  var HUECOS = {
    leccion: 1,   // el final de una lección, debajo del resultado
    ruta:    1    // la Ruta, después del mapa
  };

  var cargado = false;
  var fallo = false;

  function C() { return (w.CONFIG && w.CONFIG.ANUNCIOS) || {}; }

  /* ==================================================================
     ¿HAY ANUNCIOS?
     ================================================================== */

  /** ¿Está montada la red? Sin identificador de editor, no. */
  function hayRed() {
    var c = C();
    return !!(c.editor && String(c.editor).indexOf('ca-pub-') === 0);
  }

  /** ¿Se le puede enseñar publicidad a esta persona, ahora mismo?

      Las cuatro condiciones en una sola función para que ninguna pantalla
      pueda comprobar tres y olvidarse de la cuarta. */
  function permitido() {
    if (!hayRed() || fallo) return false;
    // Regla 4: con Impulso, nunca.
    if (w.Impulso && w.Impulso.activo()) return false;
    // Regla 5: sin respuesta, nunca.
    if (consentimiento() === null) return false;
    // Regla 2: no antes de la primera lección terminada.
    var s = w.Store && w.Store.state;
    if (!s || !s.stats || (s.stats.lessons || 0) < 1) return false;
    return true;
  }

  /* ==================================================================
     EL CONSENTIMIENTO

     Vive en `settings` y no en el perfil del negocio: es de la persona, así
     que sobrevive a registrar otra idea. `merge()` le da el valor base a
     quien ya venía usando la app, y ese valor base es null —«no he
     preguntado»—, que es distinto de false —«dijo que no»—.
     ================================================================== */

  /** true = a la medida · false = genéricos · null = todavía no ha dicho. */
  function consentimiento() {
    var s = w.Store && w.Store.state;
    if (!s || !s.settings) return null;
    var v = s.settings.anunciosPersonalizados;
    return (v === true || v === false) ? v : null;
  }

  function guardar(personalizados) {
    w.Store.set(function (st) {
      st.settings.anunciosPersonalizados = !!personalizados;
    }, 'anuncios');
  }

  /**
   * Pregunta una vez. En voz de Chispa y sin una sola palabra de contrato.
   *
   * Las dos salidas son de verdad distintas y las dos son aceptables: no hay
   * un botón grande que diga que sí y un enlace pequeño que diga que no. Y
   * ninguna de las dos apaga la app: quien dice «los genéricos» sigue viendo
   * anuncios, solo que la red no lo perfila.
   */
  function preguntar(alTerminar) {
    if (!hayRed() || consentimiento() !== null) {
      if (typeof alTerminar === 'function') alTerminar();
      return false;
    }

    var UI = w.UI, el = UI.el;
    var hecho = false;
    function cerrar(personalizados) {
      if (hecho) return;
      hecho = true;
      guardar(personalizados);
      UI.closeSheet();
      if (typeof alTerminar === 'function') alTerminar();
    }

    UI.sheet([
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('explicando') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: 'Emprendo se paga con anuncios. Son de Google y aparecen al terminar una lección, nunca dentro.' })
        ])
      ]),
      el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0' },
        text: 'Google puede usar lo que ves para enseñarte anuncios a tu medida. Tú decides. Lo que me cuentas de tu negocio no sale de aquí en ningún caso.' }),
      el('a', {
        class: 'tiny',
        style: { textTransform: 'none', letterSpacing: '0', color: 'var(--brand)', display: 'block' },
        href: 'privacidad.html', target: '_blank', rel: 'noopener',
        text: 'Ver el aviso de privacidad'
      }),
      UI.btn('Vale, a mi medida', { variant: 'brand', onClick: function () { cerrar(true); } }),
      UI.btn('Prefiero genéricos', { variant: 'ghost', onClick: function () { cerrar(false); } })
    ], { onClose: function () {
      /* Cerrar sin elegir NO es un sí. Se queda sin respuesta y se vuelve a
         preguntar otro día: `permitido()` devuelve false mientras tanto. */
      if (typeof alTerminar === 'function') alTerminar();
    } });

    return true;
  }

  /* ==================================================================
     LA RED

     El script se carga una sola vez y solo cuando de verdad va a pintarse un
     bloque. Antes de eso no se pide nada a nadie: cargar el script "por si
     acaso" en el arranque sería el tercero entrando por la puerta de atrás.
     ================================================================== */

  function cargar() {
    if (cargado || fallo || !permitido()) return cargado;
    cargado = true;

    /* LA SEÑAL DE «NO ME PERFILES» VA PRIMERO, ANTES DEL SCRIPT.

       Y no es un detalle de orden: en cuanto el script de Google carga,
       SUSTITUYE `window.adsbygoogle` por su propio objeto, y una bandera
       puesta después se pierde sin dejar rastro. Se comprobó: con la
       asignación detrás del `appendChild`, `requestNonPersonalizedAds` salía
       `undefined` y a quien había pedido anuncios genéricos se le habrían
       servido personalizados sin que nada fallara. */
    try {
      w.adsbygoogle = w.adsbygoogle || [];
      if (consentimiento() === false) {
        w.adsbygoogle.requestNonPersonalizedAds = 1;
      }
    } catch (e) { fallo = true; return cargado; }

    var s = d.createElement('script');
    s.async = true;
    s.src = SCRIPT + '?client=' + encodeURIComponent(C().editor);
    s.crossOrigin = 'anonymous';
    s.onerror = function () {
      /* Sin conexión, con un bloqueador o con la red caída. No es un error
         que haya que enseñar: la app funciona igual y el hueco se queda
         vacío. Se marca para no volver a intentarlo en cada pintado. */
      fallo = true;
    };
    d.head.appendChild(s);

    return cargado;
  }

  /* ==================================================================
     EL HUECO

     Devuelve un nodo o null. Null significa «aquí no va nada», y quien llama
     tiene que poder pintarlo sin comprobar nada: `append` ignora los nulos.
     ================================================================== */

  var vistosEstaSesion = {};

  /**
   * Un bloque de anuncio para uno de los dos huecos declarados.
   *
   * @param {string} hueco  'leccion' | 'ruta'
   * @returns {Node|null}
   */
  function bloque(hueco) {
    if (!HUECOS[hueco]) return null;          // regla 1
    if (!permitido()) return null;            // reglas 2, 4 y 5
    if (vistosEstaSesion[hueco]) return null; // uno por hueco y por sesión

    var c = C();
    var slot = c.slots && c.slots[hueco];
    if (!slot) return null;

    if (!cargar()) return null;

    vistosEstaSesion[hueco] = true;

    var el = w.UI.el;

    /* La etiqueta va SIEMPRE y por encima. No es un requisito legal que se
       cumple a regañadientes: es la diferencia entre un anuncio y un engaño.
       Esta app pone tarjetas naranjas con recomendaciones de Chispa, y un
       anuncio sin etiquetar al lado se leería como una de ellas. */
    var caja = el('div', { class: 'card card--tight', style: { padding: '10px' } }, [
      el('div', { class: 'tiny', style: { marginBottom: '8px' }, text: 'Publicidad' })
    ]);

    var ins = d.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', c.editor);
    ins.setAttribute('data-ad-slot', String(slot));
    ins.setAttribute('data-ad-format', 'fluid');
    ins.setAttribute('data-full-width-responsive', 'true');
    /* La misma señal, otra vez y por bloque. La bandera global se pone antes
       de cargar el script, pero este atributo viaja con el hueco y sobrevive
       a que la red reordene lo suyo. Dos cinturones para lo mismo, porque el
       coste de equivocarse aquí no lo paga quien programa. */
    if (consentimiento() === false) ins.setAttribute('data-npa', '1');
    caja.appendChild(ins);

    /* El empujón que le dice a la red que hay un hueco nuevo. Va en el
       siguiente fotograma: si se hace ahora, el <ins> todavía no está en el
       documento y la red lo mide con ancho cero. */
    w.requestAnimationFrame(function () {
      try { (w.adsbygoogle = w.adsbygoogle || []).push({}); }
      catch (e) { fallo = true; }
    });

    return caja;
  }

  /** Para el interruptor de Perfil: volver a preguntar desde cero. */
  function olvidarRespuesta() {
    w.Store.set(function (st) { delete st.settings.anunciosPersonalizados; }, 'anuncios');
  }

  w.Anuncios = {
    hayRed: hayRed,
    permitido: permitido,
    consentimiento: consentimiento,
    guardar: guardar,
    preguntar: preguntar,
    bloque: bloque,
    olvidarRespuesta: olvidarRespuesta,
    HUECOS: HUECOS
  };
})(window, document);
