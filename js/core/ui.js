/* ==========================================================================
   Utilidades de interfaz — DOM, router, toasts, modales, formatos
   ========================================================================== */
(function (w, d) {
  'use strict';

  /* ---------------------------- DOM ---------------------------- */

  function el(tag, attrs, children) {
    var node = d.createElement(tag);
    // Admite también el('div', [hijos]) sin objeto de atributos. Sin esto el
    // array cae en la posición de atributos, el for-in lo recorre por índice
    // y los hijos se pierden en silencio (setAttribute('0', '[object …]')).
    if (attrs && (Array.isArray(attrs) || attrs.nodeType || typeof attrs === 'string')) {
      children = attrs;
      attrs = null;
    }
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') {
          for (var s in v) {
            // Las variables CSS necesitan setProperty; node.style['--x'] no funciona.
            if (s.charAt(0) === '-' && s.charAt(1) === '-') node.style.setProperty(s, v[s]);
            else node.style[s] = v[s];
          }
        }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        }
        else if (k === 'data' && typeof v === 'object') { for (var dk in v) node.dataset[dk] = v[dk]; }
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children == null) return node;
    if (!Array.isArray(children)) children = [children];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'object' && c.nodeType ? c : d.createTextNode(String(c)));
    }
    return node;
  }

  function frag(children) {
    var f = d.createDocumentFragment();
    append(f, children);
    return f;
  }

  function qs(sel, root) { return (root || d).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }

  /* ---------------------------- Formato ---------------------------- */

  function money(n, decimals) {
    var neg = n < 0;
    var v = Math.abs(n);
    var s = decimals ? v.toFixed(2) : Math.round(v).toLocaleString('es-MX');
    if (decimals) s = Number(v.toFixed(2)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (neg ? '-$' : '$') + s;
  }

  function num(n) { return Math.round(n).toLocaleString('es-MX'); }

  function pct(n) { return Math.round(n) + '%'; }

  function plural(n, one, many) { return n === 1 ? one : many; }

  /** "1 día" / "3 días". Evita el clásico "1 días". */
  function days(n) { return n + ' día' + (n === 1 ? '' : 's'); }

  /** Cuenta + sustantivo concordado: count(1,'lección','lecciones') -> "1 lección". */
  function count(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Convierte *negrita* y saltos de línea a HTML seguro. */
  function rich(s) {
    return escapeHTML(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }

  /* ---------------------------- Chispa habla ----------------------------

     Dieciséis sitios repetían a mano la misma fila: la mascota a la izquierda,
     una burbuja a la derecha y un gap de 12px. Copiada, no compartida, así que
     cualquier cambio de tamaño o de composición había que hacerlo dieciséis
     veces y se desincronizaba a la primera.

     `momento` es el estado, no el ánimo: 'celebrando', 'explicando',
     'alertando'… Mascot lo traduce al gesto. Se pasa lo que ocurre y el
     personaje decide la cara.
     ------------------------------------------------------------------------ */

  /**
   * @param momento  estado o ánimo: celebrando, explicando, pensando, alertando…
   * @param cuerpo   nodo o array de nodos que va dentro de la burbuja
   * @param opts     { grande:bool, tono:'green'|'red', entrada:bool, etiqueta:string }
   */
  function chispaDice(momento, cuerpo, opts) {
    opts = opts || {};
    var mood = (w.Mascot && w.Mascot.estado) ? w.Mascot.estado(momento) : 'neutral';
    var tam = opts.grande ? 'md' : 'sm';

    var yo = el('div', {
      class: 'mascot mascot--' + tam + ' is-' + mood + (opts.entrada ? ' is-entrando' : ''),
      html: w.Mascot ? w.Mascot.svg(mood, opts.etiqueta ? { etiqueta: opts.etiqueta } : null) : ''
    });

    return el('div', { class: 'chispa-dice' + (opts.grande ? ' chispa-dice--grande' : '') }, [
      yo,
      el('div', { class: 'speech chispa-dice__voz' + (opts.tono ? ' speech--' + opts.tono : '') }, cuerpo)
    ]);
  }

  /* ---------------------------- Toasts ---------------------------- */

  function toast(msg, kind, icon, ms) {
    var layer = d.getElementById('toast-layer');
    if (!layer) return;
    var t = el('div', { class: 'toast' + (kind ? ' toast--' + kind : '') }, [
      icon ? el('span', { class: 'toast__ico', text: icon }) : null,
      el('span', { text: msg })
    ]);
    layer.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { t.remove(); }, 320);
    }, ms || 2400);
    return t;
  }

  /* ---------------------------- Modal ---------------------------- */

  var modalCloser = null;
  var modalQueue = [];

  /** Muestra un modal ahora, o lo encola si ya hay uno abierto.
      Sin esto, dos recompensas simultáneas (insignia + ascenso) se pisan. */
  function queueModal(fn) {
    var layer = d.getElementById('modal-layer');
    if (layer.hidden) fn();
    else modalQueue.push(fn);
  }

  function modal(content, opts) {
    opts = opts || {};
    var layer = d.getElementById('modal-layer');
    // Si se reemplaza un modal abierto, su onClose no debe quedarse colgado.
    if (!layer.hidden && modalCloser) {
      var anterior = modalCloser;
      modalCloser = null;
      try { anterior(); } catch (e) {}
    }
    clear(layer);
    layer.hidden = false;
    layer.classList.remove('is-closing');

    var scrim = el('div', { class: 'scrim' });
    if (opts.dismissible !== false) scrim.addEventListener('click', closeModal);
    var box = el('div', { class: 'modal' });
    append(box, content);
    layer.appendChild(scrim);
    layer.appendChild(box);

    modalCloser = opts.onClose || null;
    d.addEventListener('keydown', escHandler);
    return { box: box, close: closeModal };
  }

  function escHandler(e) { if (e.key === 'Escape') closeModal(); }

  function closeModal() {
    var layer = d.getElementById('modal-layer');
    if (!layer || layer.hidden) return;
    layer.classList.add('is-closing');
    d.removeEventListener('keydown', escHandler);
    setTimeout(function () {
      layer.hidden = true;
      clear(layer);
      layer.classList.remove('is-closing');
      if (modalCloser) { var f = modalCloser; modalCloser = null; f(); }
      if (modalQueue.length) {
        var siguiente = modalQueue.shift();
        setTimeout(siguiente, 160);
      }
    }, 240);
  }

  /* ---------------------------- Sheet (panel inferior) ---------------------------- */

  var sheetCloser = null;
  var sheetTimer = null;

  function sheet(content, opts) {
    opts = opts || {};
    var layer = d.getElementById('sheet-layer');

    /* Cerrar una hoja no la oculta en el momento: deja programado un borrado a
       280 ms para que se vea la animación de salida. Si en ese hueco se abre
       otra —cerrar una y abrir la siguiente es un patrón normal aquí— ese
       temporizador la vaciaba y el usuario veía la hoja nueva aparecer y
       desvanecerse sola. Se cancela antes de pintar nada. */
    if (sheetTimer) { clearTimeout(sheetTimer); sheetTimer = null; }
    // Y el cierre pendiente se ejecuta ya, para no perder su callback. Con
    // try/catch, igual que modal(): si ese callback lanzara, la hoja nueva se
    // quedaría sin pintar y la capa colgada con el contenido viejo.
    if (sheetCloser) {
      var pendiente = sheetCloser;
      sheetCloser = null;
      try { pendiente(); } catch (e) { console.error(e); }
    }

    clear(layer);
    layer.hidden = false;
    layer.classList.remove('is-closing');

    var scrim = el('div', { class: 'scrim' });
    if (opts.dismissible !== false) scrim.addEventListener('click', closeSheet);
    var box = el('div', { class: 'sheet' }, [el('div', { class: 'sheet__grip' })]);
    append(box, content);
    layer.appendChild(scrim);
    layer.appendChild(box);
    sheetCloser = opts.onClose || null;
    return { box: box, close: closeSheet };
  }

  function closeSheet() {
    var layer = d.getElementById('sheet-layer');
    if (!layer || layer.hidden) return;
    layer.classList.add('is-closing');
    if (sheetTimer) clearTimeout(sheetTimer);
    sheetTimer = setTimeout(function () {
      sheetTimer = null;
      layer.hidden = true;
      clear(layer);
      layer.classList.remove('is-closing');
      if (sheetCloser) { var f = sheetCloser; sheetCloser = null; f(); }
    }, 280);
  }

  /* ---------------------------- Diálogo de confirmación ---------------------------- */

  function confirm(opts) {
    return new Promise(function (resolve) {
      var m = modal([
        el('div', { class: 'mascot mascot--lg', style: { margin: '0 auto' }, html: w.Mascot.svg(opts.mood || 'think') }),
        el('h3', { class: 'h3', text: opts.title || '¿Seguro?' }),
        el('p', { class: 'p', html: rich(opts.text || '') }),
        el('button', {
          class: 'btn btn--block ' + (opts.danger ? 'btn--red' : 'btn--brand'),
          text: opts.ok || 'Sí, continuar',
          onclick: function () { closeModal(); resolve(true); }
        }),
        el('button', {
          class: 'btn btn--flat btn--block',
          text: opts.cancel || 'Cancelar',
          onclick: function () { closeModal(); resolve(false); }
        })
      ], { onClose: function () { resolve(false); } });
      return m;
    });
  }

  /* ---------------------------- Componentes reutilizables ---------------------------- */

  function btn(label, opts) {
    opts = opts || {};
    var classes = ['btn'];
    if (opts.variant) classes.push('btn--' + opts.variant);
    if (opts.block !== false) classes.push('btn--block');
    if (opts.size) classes.push('btn--' + opts.size);
    if (opts.shiny) classes.push('btn--shiny');
    var b = el('button', {
      class: classes.join(' '),
      type: 'button',
      disabled: opts.disabled ? true : null,
      onclick: function (e) {
        if (b.disabled) return;
        if (opts.silent !== true) w.Sound.tap();
        w.Sound.buzz(8);
        if (opts.onClick) opts.onClick(e, b);
      }
    }, [opts.icon ? el('span', { text: opts.icon }) : null, el('span', { text: label })]);
    if (opts.shiny) b.appendChild(el('span', { class: 'btn__shine' }));
    return b;
  }

  function pbar(percent, kind, small) {
    var wrap = el('div', { class: 'pbar' + (kind ? ' pbar--' + kind : '') + (small ? ' pbar--sm' : '') });
    var fill = el('div', { class: 'pbar__fill' });
    wrap.appendChild(fill);
    requestAnimationFrame(function () { fill.style.width = Math.max(0, Math.min(100, percent)) + '%'; });
    wrap.setFill = function (p) { fill.style.width = Math.max(0, Math.min(100, p)) + '%'; };
    return wrap;
  }

  function chip(text, kind, icon) {
    return el('span', { class: 'chip' + (kind ? ' chip--' + kind : '') }, [
      icon ? el('span', { text: icon }) : null, el('span', { text: text })
    ]);
  }

  function metric(label, value, delta) {
    return el('div', { class: 'metric' }, [
      el('div', { class: 'metric__label', text: label }),
      el('div', { class: 'metric__value', text: value }),
      delta ? el('div', { class: 'metric__delta ' + (parseFloat(delta) >= 0 ? 'up' : 'down'), text: delta }) : null
    ]);
  }

  function backBtn(onClick) {
    return el('button', {
      class: 'icon-btn icon-btn--plain', 'aria-label': 'Volver',
      html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>',
      onclick: function () { w.Sound.tap(); onClick(); }
    });
  }

  function closeBtn(onClick) {
    return el('button', {
      class: 'icon-btn icon-btn--plain', 'aria-label': 'Cerrar',
      html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      onclick: function () { w.Sound.tap(); onClick(); }
    });
  }

  /* ---------------------------- Desplazamiento ---------------------------- */

  /** Devuelve al inicio todo lo que pueda haber quedado desplazado.
      No basta con poner #view.scrollTop = 0:
      · .stage y .phone tienen overflow:hidden, pero el navegador SÍ los
        desplaza por su cuenta al enfocar un campo (el textarea del mentor,
        por ejemplo) y esa posición se conserva al cambiar de pantalla;
      · el anclaje de desplazamiento de Chrome puede restaurar la posición
        justo después de repintar.
      Por eso se aplica también en los dos cuadros siguientes. */
  function resetScroll(node) {
    var view = d.getElementById('view');
    var targets = [
      node && node !== view ? node : null,
      view,
      d.getElementById('phone'),
      qs('.stage'),
      d.scrollingElement || d.documentElement
    ];
    function apply() {
      for (var i = 0; i < targets.length; i++) {
        var n = targets[i];
        if (!n) continue;
        if (n.scrollTop) n.scrollTop = 0;
        if (n.scrollLeft) n.scrollLeft = 0;
      }
    }
    apply();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () { apply(); requestAnimationFrame(apply); });
    }
  }

  /* ---------------------------- Router ---------------------------- */

  var Router = {
    current: null,
    params: null,
    routes: {},
    stack: [],

    register: function (name, renderFn) { Router.routes[name] = renderFn; },

    go: function (name, params, dir) {
      var view = d.getElementById('view');
      if (!Router.routes[name]) { console.warn('ruta desconocida:', name); return; }
      if (Router.current && Router.current !== name) {
        Router.stack.push({ name: Router.current, params: Router.params });
        if (Router.stack.length > 20) Router.stack.shift();   // el historial no debe crecer sin fin
      }
      Router.current = name;
      Router.params = params || {};

      var content = Router.routes[name](Router.params);
      clear(view);
      var cls = dir === 'back' ? 'anim-in-left' : (dir === 'none' ? '' : 'anim-in');
      if (content) {
        if (cls && content.classList) content.classList.add(cls);
        view.appendChild(content);
      }
      // Toda pantalla nueva empieza arriba, pase lo que pase con la anterior.
      resetScroll(view);
      if (w.App && w.App.onRoute) w.App.onRoute(name, Router.params);
      return content;
    },

    back: function (fallback) {
      var prev = Router.stack.pop();
      if (prev) {
        Router.current = null;   // evita que go() vuelva a apilar
        Router.go(prev.name, prev.params, 'back');
      } else {
        Router.current = null;
        Router.go(fallback || 'home', {}, 'back');
      }
    },

    /** Vuelve a pintar la ruta actual sin tocar el historial. */
    refresh: function () {
      if (!Router.current) return;
      var c = Router.current, p = Router.params;
      Router.current = null;
      Router.go(c, p, 'none');
    }
  };

  /* ---------------------------- Varios ---------------------------- */

  function shuffle(arr, seed) {
    var a = arr.slice();
    var rnd = seed != null ? mulberry(seed) : Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function copy(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text).then(function () { toast('Copiado', 'green', '📋'); });
    }
    var ta = d.createElement('textarea');
    ta.value = text; d.body.appendChild(ta); ta.select();
    try { d.execCommand('copy'); toast('Copiado', 'green', '📋'); } catch (e) {}
    ta.remove();
    return Promise.resolve();
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = d.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    d.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  w.UI = {
    el: el, append: append, frag: frag, qs: qs, qsa: qsa, clear: clear,
    money: money, num: num, pct: pct, plural: plural, days: days, count: count,
    escapeHTML: escapeHTML, rich: rich, resetScroll: resetScroll,
    toast: toast, modal: modal, queueModal: queueModal, closeModal: closeModal,
    sheet: sheet, closeSheet: closeSheet,
    confirm: confirm, btn: btn, pbar: pbar, chip: chip, metric: metric,
    chispaDice: chispaDice,
    backBtn: backBtn, closeBtn: closeBtn,
    Router: Router, shuffle: shuffle, mulberry: mulberry, delay: delay,
    copy: copy, download: download
  };
})(window, document);
