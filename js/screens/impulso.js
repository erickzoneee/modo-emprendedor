/* ==========================================================================
   EMPRENDO IMPULSO — la pantalla donde se cobra

   Es la pantalla más delicada de la app, y no por el código. Es el único
   sitio donde Emprendo le pide dinero a alguien que está empezando un
   negocio y probablemente no tiene mucho. Está escrita con cinco reglas, y
   las cinco son deliberadas:

   1. LO PRIMERO QUE SE LEE es que las lecciones y los retos son gratis y lo
      van a seguir siendo. Va arriba del todo, en verde, antes que el precio y
      antes que la lista. Si algún día eso baja de sitio, esta pantalla se
      convierte en otra cosa.

   2. NO SE PROMETE LO QUE NO ESTÁ HECHO. Cada beneficio lleva su `listo` en
      CONFIG.IMPULSO, y el que no lo está sale apagado con la palabra
      «pronto». Ni candados ni letra pequeña: quien paga hoy ve exactamente
      lo que se lleva hoy.

   3. EL «NO» ES DIGNO. El botón dice «Sigo gratis, está bien» y no «prefiero
      avanzar lento». Nadie tiene que sentirse tonto por no pagar.

   4. NO HAY PRISA. Sin cuenta atrás, sin precio tachado, sin «solo hoy» y
      sin «te quedan 2 horas». Nada de esto aparece porque nada de esto es
      verdad.

   5. SE DICE LO QUE CUESTA DE VERDAD. Que hace falta un correo, que el
      respaldo no se lleva Impulso y que se cancela cuando uno quiera. Las
      tres cosas están escritas en la pantalla, no en un aviso legal.

   POR QUÉ EL PAGO ABRE UNA PESTAÑA NUEVA

   El router de esta app vive solo en memoria: no hay hash ni History API, y
   recargar vuelve siempre al arranque. Salir a Stripe y volver por redirección
   no tendría forma de recuperar su sitio. Con pestaña nueva, esta pantalla se
   queda donde está y se entera al recuperar el foco.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var UI = w.UI, el = UI.el;

  function C() { return w.CONFIG.IMPULSO; }

  /** El precio en una línea, para las invitaciones pequeñas de otras
      pantallas. Sale de CONFIG para que solo haya un sitio donde cambiarlo. */
  function precioCorto() {
    /* En el iPhone, el que pone Apple. Mientras no llega, ninguno: mejor no
       decir precio un segundo que decir uno que no es. */
    if (conApple()) return w.Impulso.precio() ? w.Impulso.precio() + ' al mes' : 'cada mes';
    return C().corto;
  }

  function conApple() { return !!(w.Impulso && w.Impulso.conApple && w.Impulso.conApple()); }

  /* ==================================================================
     ¿SE PUEDE ENSEÑAR ESTA PANTALLA?

     Hacen falta el servidor de pago y la llave con la que se comprueba lo
     que firma. Sin las dos, Impulso no existe: no se enseña un precio, no
     hay un botón que lleve a un sitio que no está montado y ninguna otra
     pantalla pinta su invitación. Es el mismo criterio que la IA gratuita
     cuando no hay Worker configurado.
     ================================================================== */

  /* O que ya lo tenga: quien pagó con el iPhone y abre la web, donde todavía
     no se cobra, tiene que poder ver lo suyo y dónde se gestiona. */
  function hay() { return !!(w.Impulso && (w.Impulso.disponible() || w.Impulso.activo())); }

  /* ==================================================================
     LA PANTALLA
     ================================================================== */

  function render(params) {
    params = params || {};
    var root = el('div', { class: 'screen' });

    root.appendChild(el('div', { class: 'row' }, [
      UI.backBtn(function () { UI.Router.back('home'); }),
      el('div', { class: 'grow' })
    ]));

    if (!hay()) return pantallaNoHay(root);
    if (w.Impulso.activo()) return pantallaActivo(root);
    return pantallaOferta(root, params);
  }

  /* ------------------------- Todavía no está abierto -------------------------

     No debería llegar nadie aquí —las invitaciones no se pintan si no hay
     Impulso—, pero una pantalla registrada se puede alcanzar por otros
     caminos y quedarse en blanco es peor que decir la verdad. */

  function pantallaNoHay(root) {
    root.appendChild(el('div', { class: 'col', style: { alignItems: 'center', gap: '10px', textAlign: 'center' } }, [
      el('div', { class: 'mascot mascot--lg', html: w.Mascot.svg('think') }),
      el('h1', { class: 'h2', text: 'Impulso todavía no está abierto' }),
      el('p', { class: 'p', text: 'Cuando lo esté, te lo cuento. Mientras tanto, la ruta entera es tuya.' })
    ]));
    root.appendChild(UI.btn('Volver a la Ruta', { variant: 'brand', onClick: function () { UI.Router.go('home'); } }));
    return root;
  }

  /* ------------------------- Ya lo tiene ------------------------- */

  function pantallaActivo(root) {
    var hasta = w.Impulso.hasta();

    root.appendChild(el('div', { class: 'col', style: { alignItems: 'center', gap: '12px', textAlign: 'center' } }, [
      el('div', { class: 'imp__sello' }, [
        el('span', { class: 'imp__aura' }),
        el('div', { class: 'mascot mascot--md is-happy imp__chispa', html: w.Mascot.svg('happy', { plano: true }) })
      ]),
      el('h1', { class: 'h2', text: 'Impulso activo' }),
      el('p', { class: 'p', text: hasta
        ? 'Se renueva solo el ' + fecha(hasta) + '.'
        : 'Ya lo tienes.' })
    ]));

    root.appendChild(lista());

    /* Lo que pasa si cambia de teléfono. Va aquí y no en un aviso porque es
       la única cosa de Impulso que puede darle un susto de verdad: el
       respaldo .json NO se lleva la suscripción, y quien lo restaure en un
       teléfono nuevo va a creer que perdió lo que pagó. */
    root.appendChild(el('div', { class: 'card card--tight' }, [
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('span', { style: { fontSize: '20px' }, text: '📱' }),
        el('div', { class: 'grow', style: { minWidth: '0' } }, [
          el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--ink)' }, text: 'Si cambias de teléfono' }),
          el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginTop: '3px' },
            text: (w.Impulso.origen() === 'apple'
              ? 'Con el mismo Apple ID, toca «Ya lo tenía: recuperarlo» y vuelve solo.'
              : 'Entra con tu correo y vuelve solo.') +
              ' El archivo de respaldo guarda tu progreso, pero no Impulso.' })
        ])
      ])
    ]));

    /* Compró en el iPhone sin correo. Todo funciona menos una cosa, que vive
       en la cuenta porque se cuenta por persona: «Yo, más cerca». Se dice,
       y se ofrece; no se exige (Apple no deja exigirlo, y además no hace
       falta para nada más). */
    if (w.PlazaNube && w.PlazaNube.hay() && !(w.Plaza && w.Plaza.conectado())) {
      root.appendChild(el('div', { class: 'card card--tight' }, [
        el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
          el('span', { style: { fontSize: '20px' }, text: '💬' }),
          el('div', { class: 'grow', style: { minWidth: '0' } }, [
            el('div', { class: 'small', style: { fontWeight: '900', color: 'var(--ink)' }, text: 'Para que te acompañe más de cerca' }),
            el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0', marginTop: '3px' },
              text: 'Necesito saber quién eres: así llevo la cuenta de tus preguntas. Con tu correo basta.' })
          ])
        ]),
        UI.btn('Entrar con mi correo', { variant: 'ghost', size: 'sm', onClick: function () {
          w.PlazaScreen.conectar(function () { UI.Router.go('impulso', {}, 'none'); });
        } })
      ]));
    }

    /* Lo que ya puede usar, a un toque. Quien acaba de pagar entra aquí a ver
       qué se llevó, y salir sin nada que tocar es la peor primera impresión
       posible. El plan de la semana no lleva botón porque ya está en la Ruta,
       que es la primera pantalla que ve. */
    if (w.MaterialesScreen && w.MaterialesScreen.hay()) {
      root.appendChild(UI.btn('Ver mi material listo', {
        variant: 'brand', size: 'lg',
        onClick: function () { UI.Router.go('materiales'); }
      }));
    }

    /* Se gestiona donde se cobra. Y una excepción: lo que se pagó en la web
       NO lleva botón dentro de la app de iPhone. Apple no deja que la app
       mande a pagar ni a gestionar pagos fuera de su tienda; decir dónde se
       hace sí se puede, y es lo que se hace. */
    var origen = w.Impulso.origen();
    if (origen === 'web' && conApple()) {
      root.appendChild(el('p', { class: 'imp__cierre', text: 'Lo pagaste en la web: desde ahí se gestiona.' }));
    } else {
      root.appendChild(UI.btn('Gestionar o cancelar', {
        variant: 'ghost',
        onClick: function () {
          if (origen === 'apple') w.Impulso.gestionarApple();
          else abrirPortal();
        }
      }));
    }

    root.appendChild(el('p', { class: 'imp__cierre',
      text: 'Si cancelas, Impulso sigue hasta el día que ya pagaste.' }));

    return root;
  }

  /* ------------------------- La oferta ------------------------- */

  function pantallaOferta(root, params) {
    var c = C();

    root.appendChild(el('div', { class: 'col', style: { alignItems: 'center', gap: '12px', textAlign: 'center' } }, [
      el('div', { class: 'imp__sello' }, [
        el('span', { class: 'imp__aura' }),
        el('div', { class: 'mascot mascot--md is-happy imp__chispa', html: w.Mascot.svg('happy', { plano: true }) })
      ]),
      el('h1', { class: 'h2', style: { margin: '0' }, text: c.nombre })
    ]));

    /* REGLA 1. Arriba del todo, siempre. */
    root.appendChild(el('div', { class: 'imp__libre' }, [
      el('span', { class: 'imp__libre__ico', text: '🎁' }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'imp__libre__t', text: textoLibre() }),
        el('span', { class: 'imp__libre__p', text: 'Y lo van a seguir siendo. No te escondo ninguna.' })
      ])
    ]));

    root.appendChild(el('p', { class: 'p', style: { margin: '0', textAlign: 'center' },
      text: 'Impulso no te da más camino: te quita las pausas y me deja acompañarte más de cerca.' }));

    root.appendChild(lista());

    /* En el iPhone, el número es el de Apple —«$99.00»— y llega un instante
       después de arrancar. Si aún no está, se espera un poco en vez de pintar
       el de config.js: Apple revisa que el precio enseñado sea el que cobra. */
    var numero = el('span', { style: { fontSize: 'inherit', color: 'inherit', fontWeight: 'inherit' },
      text: conApple() ? (w.Impulso.precio() || '…') + ' ' : c.precio + ' ' });
    root.appendChild(el('div', { class: 'imp__precio' }, [
      el('div', { class: 'imp__precio__n' }, [
        numero,
        el('span', { text: conApple() ? 'al mes' : c.unidad })
      ]),
      el('div', { class: 'imp__precio__p', text: 'Cancela cuando quieras. Sin permanencia.' })
    ]));
    if (conApple() && !w.Impulso.precio()) {
      (function espera(n) {
        setTimeout(function () {
          if (w.Impulso.precio()) numero.textContent = w.Impulso.precio() + ' ';
          else if (n > 0 && numero.isConnected) espera(n - 1);
        }, 500);
      })(10);
    }

    root.appendChild(UI.btn('Activar Impulso', {
      variant: 'brand', size: 'lg', shiny: true,
      onClick: function () { activar(); }
    }));

    /* REGLA 3. Con dignidad, y volviendo a donde estaba. */
    root.appendChild(UI.btn('Sigo gratis, está bien', {
      variant: 'ghost',
      onClick: function () {
        UI.Router.back(params.desde === 'energia' ? 'home' : 'home');
      }
    }));

    if (conApple()) root.appendChild(loQueDiceApple());

    root.appendChild(el('p', { class: 'imp__cierre',
      text: 'Sin Impulso llegas al mismo final.\nSolo tardas un poco más.' }));

    return root;
  }

  /** «Las 50 lecciones y los 8 retos son gratis», con los números de verdad.
      Contados y no escritos a mano: el día que haya 200 y 50, esta frase se
      actualiza sola en vez de quedarse mintiendo por lo bajo. */
  function textoLibre() {
    var lecciones = (w.LESSONS && w.LESSONS.length) || 0;
    var retos = (w.CONFIG.BOSSES && w.CONFIG.BOSSES.length) || 0;
    return 'Las ' + UI.num(lecciones) + ' lecciones y los ' + UI.num(retos) + ' retos son gratis';
  }

  /** La lista de beneficios. Lo que no está hecho sale apagado y con
      «pronto» al lado. Ver la regla 2 de la cabecera. */
  function lista() {
    var caja = el('div', { class: 'imp__lista' });

    C().BENEFICIOS.forEach(function (b) {
      /* «Sin anuncios» solo donde hay anuncios que quitar. */
      if (b.si === 'anuncios' && !(w.Anuncios && w.Anuncios.hayRed())) return;
      caja.appendChild(el('div', { class: 'imp__fila' + (b.listo ? '' : ' imp__fila--pronto') }, [
        el('span', { class: 'imp__fila__ico', text: b.icon }),
        el('span', { class: 'grow', style: { minWidth: '0' } }, [
          el('span', { class: 'imp__fila__t', text: b.t }),
          el('span', { class: 'imp__fila__p', text: b.p })
        ]),
        b.listo ? null : el('span', { class: 'chip chip--outline', text: 'pronto' })
      ]));
    });

    return caja;
  }

  function fecha(ms) {
    try {
      return new Date(ms).toLocaleDateString('es', { day: 'numeric', month: 'long' });
    } catch (e) { return ''; }
  }

  /* Lo que Apple exige que se lea antes de pagar: quién cobra, que se
     renueva, cómo se cancela, los términos y la privacidad a un toque, y una
     forma de recuperar lo que ya se pagó. Dicho por Chispa y corto, pero
     entero. Los términos son los de Apple (su licencia estándar). */
  var TERMINOS_APPLE = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

  function loQueDiceApple() {
    return el('div', { class: 'imp-apple' }, [
      el('div', { text: 'Lo cobra Apple, a tu cuenta de siempre. Se renueva solo cada mes hasta que lo canceles, y lo cancelas desde Ajustes cuando quieras.' }),
      el('div', { class: 'imp-apple__links' }, [
        el('button', { type: 'button', text: 'Ya lo tenía: recuperarlo', onclick: recuperar }),
        el('a', { href: TERMINOS_APPLE, target: '_blank', rel: 'noopener', text: 'Términos de uso' }),
        el('a', { href: 'privacidad.html', target: '_blank', rel: 'noopener', text: 'Privacidad' })
      ])
    ]);
  }

  function recuperar() {
    UI.toast('Busco tu compra…', 'blue', '⚡');
    w.Impulso.restaurar().then(function (activo) {
      if (activo) { celebrar(); return; }
      UI.toast('No encuentro Impulso en este Apple ID.', 'blue', '🕯️', 3400);
    });
  }

  /* ==================================================================
     ACTIVARLO

     Dos pasos, y el primero solo la primera vez: hace falta una cuenta.

     Hoy el progreso de esta app es anónimo y local, y la cuenta de la Plaza
     está enterrada detrás de una condición. Pedir un correo aquí es un paso
     que casi nadie ha dado, así que se explica POR QUÉ hace falta antes de
     pedirlo, y la razón que se da es la verdadera: sin él, Impulso no puede
     volver a encontrarte si cambias de teléfono.
     ================================================================== */

  function activar() {
    if (!w.Impulso || !w.Impulso.disponible()) { UI.toast('Impulso todavía no está abierto', 'blue', '⚡'); return; }

    /* En el iPhone, sin correo: la hoja de Apple y listo. Apple no deja
       pedir una cuenta antes de comprar algo que no vive en la cuenta. */
    if (conApple()) {
      w.Impulso.comprarApple().then(function (r) {
        if (r && r.ok) { celebrar(); return; }
        if (r && r.error === 'cancelado') return;     // cambió de idea: nada que decir
        UI.toast(w.Impulso.excusa(r), r && r.error === 'pendiente' ? 'blue' : 'red', '⚡', 4200);
      });
      return;
    }

    if (!w.Plaza || !w.Plaza.conectado()) { pedirCorreo(); return; }

    UI.toast('Abriendo el pago…', 'blue', '⚡');
    w.Impulso.comprar().then(function (r) {
      if (!r || !r.ok || !r.url) {
        UI.toast(w.Impulso.excusa(r), 'red', '🕯️', 3400);
        return;
      }
      abrirFuera(r.url);
      esperandoPago();
    });
  }

  function abrirPortal() {
    UI.toast('Abriendo…', 'blue', '⚙️');
    w.Impulso.portal().then(function (r) {
      if (!r || !r.ok || !r.url) { UI.toast(w.Impulso.excusa(r), 'red', '🕯️', 3400); return; }
      abrirFuera(r.url);
    });
  }

  /**
   * Abre Stripe fuera de la app.
   *
   * `noopener` no es una formalidad: sin él, la página que se abre puede
   * escribir en `window.opener` y llevarse esta pestaña a otro sitio. Es una
   * página de pago; es exactamente donde eso importa.
   *
   * Si el navegador bloquea la ventana emergente —pasa dentro de la app
   * instalada— se enseña el enlace para que lo toque él. Callarse ahí dejaría
   * a alguien mirando una pantalla que no hace nada.
   */
  function abrirFuera(url) {
    var v = null;
    try { v = w.open(url, '_blank', 'noopener'); } catch (e) { v = null; }
    if (v) return;

    UI.modal([
      el('div', { class: 'mascot mascot--lg', style: { margin: '0 auto' }, html: w.Mascot.svg('think') }),
      el('h3', { class: 'h3', text: 'Tu navegador no me dejó abrirlo' }),
      el('p', { class: 'p', text: 'Toca aquí y se abre igual.' }),
      el('a', {
        class: 'btn btn--brand btn--block btn--lg',
        href: url, target: '_blank', rel: 'noopener noreferrer',
        text: 'Ir a pagar'
      }),
      UI.btn('Ahora no', { variant: 'flat', onClick: UI.closeModal })
    ]);
  }

  /** Mientras paga en la otra pestaña. No hay barra de progreso ni espera
      falsa: lo que hay es una frase y un botón para comprobar. La app se
      entera sola al recuperar el foco, pero quien vuelve rápido agradece
      poder empujar. */
  function esperandoPago() {
    UI.queueModal(function () {
      UI.modal([
        el('div', { class: 'mascot mascot--lg', style: { margin: '0 auto' }, html: w.Mascot.svg('happy', { plano: true }) }),
        el('h3', { class: 'h3', text: 'Te dejé el pago en otra pestaña' }),
        el('p', { class: 'p', text: 'Cuando termines, vuelve aquí. Yo me entero solo.' }),
        UI.btn('Ya pagué, compruébalo', {
          variant: 'brand',
          onClick: function () {
            UI.closeModal();
            comprobarAhora();
          }
        }),
        UI.btn('Cerrar', { variant: 'flat', onClick: UI.closeModal })
      ]);
    });
  }

  /** Pide el pase forzando: aquí sí sabemos que puede haber cambiado algo,
      así que no se respeta la ventana de seis horas de `refrescar()`. */
  function comprobarAhora() {
    UI.toast('Miro si ya llegó…', 'blue', '⚡');
    w.Impulso.refrescar(true).then(function (activo) {
      if (activo) { celebrar(); return; }
      UI.toast('Todavía no me llega. Dale un momento.', 'blue', '🕯️', 3400);
    });
  }

  /* ==================================================================
     LA VUELTA

     La llama js/app.js cuando la app arranca en ./?impulso=ok — o sea, en la
     pestaña que abrió Stripe, después de pagar.
     ================================================================== */

  function vuelta(que) {
    if (que !== 'ok') {
      /* Se arrepintió. Ni un reproche, ni un «¿seguro?», ni una oferta con
         descuento: se vuelve a la Ruta y ya está. */
      return;
    }
    if (!w.Impulso) return;

    /* El webhook de Stripe y esta redirección son dos carreras distintas, y
       la redirección suele ganar. Se pide el pase varias veces con un poco de
       paciencia antes de decir nada: enseñar «todavía no» a alguien que acaba
       de pagar sería el peor momento posible para tener razón. */
    var intentos = 0;
    (function mirar() {
      w.Impulso.refrescar(true).then(function (activo) {
        if (activo) { celebrar(); return; }
        if (++intentos >= 5) {
          UI.toast('Tu pago está en camino. En un momento lo tienes.', 'blue', '⚡', 4200);
          return;
        }
        setTimeout(mirar, 1600);
      });
    })();
  }

  function celebrar() {
    if (w.FX && w.FX.celebrate) w.FX.celebrate();
    if (w.Sound && w.Sound.complete) w.Sound.complete();
    UI.queueModal(function () {
      UI.modal([
        el('div', { class: 'mascot mascot--lg is-party', style: { margin: '0 auto' }, html: w.Mascot.svg('party') }),
        el('h3', { class: 'h2', text: 'Ya tienes Impulso' }),
        el('p', { class: 'p', text: 'Se acabaron las esperas. Sigue por donde ibas.' }),
        UI.btn('Seguir', { variant: 'brand', size: 'lg', shiny: true, onClick: function () {
          UI.closeModal();
          UI.Router.go('home');
        } })
      ]);
    });
  }

  /* ==================================================================
     EL CORREO

     Se reutiliza el de la Plaza porque la cuenta es LA MISMA: no hay dos
     identidades, hay una. Lo que cambia es la explicación, y cambia porque
     el motivo es otro: allí es para que te vean; aquí, para que Impulso te
     encuentre.
     ================================================================== */

  function pedirCorreo() {
    UI.sheet([
      el('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, [
        el('div', { class: 'mascot mascot--sm', html: w.Mascot.svg('explicando') }),
        el('div', { class: 'speech' }, [
          el('div', { class: 'small', text: 'Antes necesito un correo tuyo. Es lo único que hace que Impulso te siga si cambias de teléfono.' })
        ])
      ]),
      el('div', { class: 'tiny', style: { textTransform: 'none', letterSpacing: '0' },
        text: 'No lo guardo en claro y no se lo enseño a nadie. Solo sirve para volver a entrar.' }),
      UI.btn('Darle mi correo', {
        variant: 'brand', size: 'lg',
        onClick: function () {
          UI.closeSheet();
          setTimeout(function () {
            /* Con el código del correo, la sesión llega aquí mismo: en
               cuanto entra, se sigue con el pago sin volver a pedírselo. */
            w.PlazaScreen.conectar(function () { activar(); });
          }, 320);
        }
      }),
      UI.btn('Ahora no', { variant: 'flat', onClick: UI.closeSheet })
    ]);
  }

  /* ==================================================================
     LA INVITACIÓN, PARA QUIEN QUIERA PINTARLA

     Un solo sitio construye la invitación pequeña, y por eso todas se ven
     igual y todas respetan las mismas reglas: no se pinta si Impulso no
     existe, no se pinta si ya lo tiene, y nunca es un botón grande.
     ================================================================== */

  function guino(texto, sub, desde) {
    if (!hay() || w.Impulso.activo()) return null;

    return el('button', {
      class: 'imp-guino', type: 'button',
      onclick: function () {
        w.Sound.tap();
        UI.Router.go('impulso', { desde: desde || '' });
      }
    }, [
      el('span', { class: 'imp-guino__ico', text: '⚡' }),
      el('span', { class: 'grow', style: { minWidth: '0' } }, [
        el('span', { class: 'imp-guino__t', text: texto || 'Con Impulso no hay esperas' }),
        el('span', { class: 'imp-guino__p', text: sub || ('Energía sin límite · ' + precioCorto()) })
      ]),
      el('span', { class: 'imp-guino__ir', text: '›' })
    ]);
  }

  /** La marca de quien ya lo tiene, para la barra de otras pantallas. */
  function sello() {
    if (!hay() || !w.Impulso.activo()) return null;
    return el('span', { class: 'imp-sel', text: '⚡ Impulso' });
  }

  UI.Router.register('impulso', render);

  w.ImpulsoScreen = {
    hay: hay,
    guino: guino,
    sello: sello,
    precioCorto: precioCorto,
    activar: activar,
    portal: abrirPortal,
    // lo llama js/app.js cuando se vuelve de Stripe
    vuelta: vuelta
  };
})(window, document);
