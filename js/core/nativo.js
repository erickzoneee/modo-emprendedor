/* ==========================================================================
   NATIVO — saber si la app vive dentro del iPhone

   La app de la App Store es esta misma app, con todos sus archivos metidos
   dentro de un paquete de Capacitor. Casi todo se comporta igual. Lo que no,
   se decide aquí y en ningún otro sitio, para que el día que haya una cosa
   más que cambie no haya que buscarla por veinte pantallas:

   · NO HAY QUE INSTALARLA. Ya está instalada: la tarjeta de Perfil sobra.
   · NO HAY SERVICE WORKER. Todo viaja dentro del paquete, y la WebView de
     iOS no lo admite con el esquema capacitor:// de todas formas.
   · NO SE DESCARGA. Un <a download> dentro de una app no hace nada, sin
     error y sin aviso. Los archivos salen por la hoja de compartir.
   · NO SE ABRE OTRA PESTAÑA. Lo de fuera se abre en una ventanita de Safari
     encima de la app, y lo de dentro —privacidad.html— se pide a la web,
     porque el archivo empaquetado no existe para Safari.
   · NO SE COBRA CON STRIPE NI HAY ANUNCIOS. Apple no deja otro cobro que el
     suyo para algo digital, y Google no deja AdSense dentro de una app.
   · NO HAY IA LOCAL. Descarga su motor de internet al usarse, y Apple no
     deja que una app baje código que cambie lo que hace.

   `window.Capacitor` lo pone la propia app de iPhone antes de que cargue
   ningún script, así que esto se puede leer de forma síncrona en cualquier
   momento. En la web no existe, y todo lo de aquí cae a lo de siempre.
   ========================================================================== */
(function (w) {
  'use strict';

  var C = w.Capacitor;
  var es = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());

  function plugin(nombre) {
    return es && C.Plugins && C.Plugins[nombre] ? C.Plugins[nombre] : null;
  }

  /** La dirección pública de un archivo de la propia app. En la web es la
      ruta relativa de siempre; en el iPhone, la de la web publicada. */
  function web(ruta) {
    if (!es) return ruta;
    var base = (w.BRAND && w.BRAND.dominios && w.BRAND.dominios.sitio) || '';
    return base.replace(/\/+$/, '') + '/' + String(ruta).replace(/^\.?\//, '');
  }

  /** Abre algo de fuera sin sacar a nadie de la app. */
  function abrir(url) {
    var Browser = plugin('Browser');
    if (Browser) {
      return Browser.open({ url: url }).catch(function () { w.open(url, '_blank'); });
    }
    w.open(url, '_blank', 'noopener');
    return Promise.resolve();
  }

  /**
   * Guarda un archivo con la hoja de compartir del iPhone: «Guardar en
   * Archivos», WhatsApp, correo, lo que tenga.
   *
   * `datos` es texto o un Blob. Se escribe en la caché de la app —el sistema
   * la vacía solo cuando le hace falta sitio— y se comparte desde ahí.
   *
   * Devuelve 'compartido', 'cancelado' o 'fallo'. Cancelar no es un fallo:
   * el usuario cambió de idea.
   */
  function guardar(nombre, datos) {
    var Fs = plugin('Filesystem');
    var Share = plugin('Share');
    if (!Fs || !Share) return Promise.resolve('fallo');

    var escrito = (typeof datos === 'string')
      ? Fs.writeFile({ path: nombre, data: datos, directory: 'CACHE', encoding: 'utf8' })
      : aBase64(datos).then(function (b64) {
          return Fs.writeFile({ path: nombre, data: b64, directory: 'CACHE' });
        });

    return escrito
      .then(function (r) { return Share.share({ title: nombre, files: [r.uri] }); })
      .then(function () { return 'compartido'; })
      .catch(function (e) {
        return /cancel/i.test(String((e && e.message) || e)) ? 'cancelado' : 'fallo';
      });
  }

  function aBase64(blob) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, '')); };
      r.onerror = function () { mal(r.error); };
      r.readAsDataURL(blob);
    });
  }

  /* Los enlaces que abren otra pestaña. En la WebView no hay pestañas, y un
     target="_blank" a un archivo de la propia app no hace nada. Se atrapan
     todos aquí, una vez, en vez de en cada pantalla que los pinta. */
  if (es) {
    w.document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[target="_blank"]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return;
      e.preventDefault();
      abrir(/^https?:/i.test(href) ? href : web(href));
    }, true);
  }

  w.Nativo = {
    es: es,
    plugin: plugin,
    web: web,
    abrir: abrir,
    guardar: guardar
  };
})(window);
