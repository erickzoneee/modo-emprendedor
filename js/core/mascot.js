/* ==========================================================================
   CHISPA — la mascota de Modo Emprendedor (SVG animable)
   ========================================================================== */
(function (w) {
  'use strict';

  var MOUTHS = {
    neutral: '<path d="M42 66 Q50 71 58 66" stroke="#7A3A00" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    happy:   '<path d="M40 63 Q50 76 60 63 Z" fill="#7A3A00"/><path d="M43.5 69 Q50 73.5 56.5 69 Q50 71.5 43.5 69Z" fill="#FF7E92"/>',
    party:   '<ellipse cx="50" cy="68" rx="9" ry="8.5" fill="#7A3A00"/><ellipse cx="50" cy="72.5" rx="5" ry="3.4" fill="#FF7E92"/>',
    sad:     '<path d="M42 70 Q50 63 58 70" stroke="#7A3A00" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    think:   '<path d="M43 68 Q50 66.5 57 69" stroke="#7A3A00" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    wow:     '<ellipse cx="50" cy="69" rx="6" ry="7" fill="#7A3A00"/>',
    money:   '<path d="M40 64 Q50 75 60 64 Z" fill="#7A3A00"/>'
  };

  function eyes(mood) {
    if (mood === 'sad') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="39" cy="53" r="4.6" fill="#20344F"/><circle cx="40.8" cy="51.2" r="1.7" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="61" cy="53" r="4.6" fill="#20344F"/><circle cx="62.8" cy="51.2" r="1.7" fill="#fff"/></g>' +
        '<path d="M31 41 Q39 37 47 41" stroke="#7A3A00" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M53 41 Q61 37 69 41" stroke="#7A3A00" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    if (mood === 'wow' || mood === 'party') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="9.5" ry="10.5" fill="#fff"/>' +
        '<circle cx="39" cy="50.5" r="5.4" fill="#20344F"/><circle cx="41" cy="48" r="2.2" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="9.5" ry="10.5" fill="#fff"/>' +
        '<circle cx="61" cy="50.5" r="5.4" fill="#20344F"/><circle cx="63" cy="48" r="2.2" fill="#fff"/></g>';
    }
    if (mood === 'think') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="41.5" cy="47.5" r="4.6" fill="#20344F"/><circle cx="43" cy="45.8" r="1.7" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="8.5" ry="9" fill="#fff"/>' +
        '<circle cx="63.5" cy="47.5" r="4.6" fill="#20344F"/><circle cx="65" cy="45.8" r="1.7" fill="#fff"/></g>' +
        '<path d="M52 39 Q61 34 70 39" stroke="#7A3A00" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    if (mood === 'money') {
      return '' +
        '<g class="m-eye"><ellipse cx="39" cy="50" rx="9" ry="9.5" fill="#fff"/>' +
        '<text x="39" y="55" font-size="12" font-weight="900" text-anchor="middle" fill="#2E9B44" font-family="Nunito,sans-serif">$</text></g>' +
        '<g class="m-eye"><ellipse cx="61" cy="50" rx="9" ry="9.5" fill="#fff"/>' +
        '<text x="61" y="55" font-size="12" font-weight="900" text-anchor="middle" fill="#2E9B44" font-family="Nunito,sans-serif">$</text></g>';
    }
    // neutral / happy
    return '' +
      '<g class="m-eye"><ellipse cx="39" cy="50" rx="8.5" ry="9.5" fill="#fff"/>' +
      '<circle cx="39.6" cy="51" r="4.8" fill="#20344F"/><circle cx="41.4" cy="48.8" r="1.9" fill="#fff"/></g>' +
      '<g class="m-eye"><ellipse cx="61" cy="50" rx="8.5" ry="9.5" fill="#fff"/>' +
      '<circle cx="61.6" cy="51" r="4.8" fill="#20344F"/><circle cx="63.4" cy="48.8" r="1.9" fill="#fff"/></g>';
  }

  /**
   * Devuelve el SVG de Chispa.
   * mood: neutral | happy | sad | think | party | wow | money
   */
  function svg(mood, opts) {
    mood = mood || 'neutral';
    opts = opts || {};
    var id = 'g' + Math.random().toString(36).slice(2, 8);
    var body1 = opts.color1 || '#FF8A2B';
    var body2 = opts.color2 || '#FF6B1A';

    return '' +
'<svg viewBox="0 0 100 108" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chispa, tu mentor">' +
  '<defs>' +
    '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + body1 + '"/><stop offset="100%" stop-color="' + body2 + '"/>' +
    '</linearGradient>' +
    '<radialGradient id="' + id + 's" cx="50%" cy="30%">' +
      '<stop offset="0%" stop-color="#FFF3C4"/><stop offset="100%" stop-color="#FFC800"/>' +
    '</radialGradient>' +
  '</defs>' +

  // sombra
  '<ellipse cx="50" cy="101" rx="24" ry="4.6" fill="#10203A" opacity=".13"/>' +

  // chispa superior
  '<g class="m-spark" transform="translate(50 12)">' +
    '<path d="M0 -12 L4.4 -3.4 L13 0 L4.4 3.4 L0 12 L-4.4 3.4 L-13 0 L-4.4 -3.4 Z" fill="url(#' + id + 's)"/>' +
  '</g>' +
  '<path d="M50 24 L50 30" stroke="#FFC800" stroke-width="4" stroke-linecap="round"/>' +

  // brazos
  '<g class="m-arm-l"><rect x="18" y="58" width="15" height="8" rx="4" fill="' + body2 + '"/>' +
    '<circle cx="19" cy="62" r="6" fill="' + body1 + '"/></g>' +
  '<g class="m-arm-r"><rect x="67" y="58" width="15" height="8" rx="4" fill="' + body2 + '"/>' +
    '<circle cx="81" cy="62" r="6" fill="' + body1 + '"/></g>' +

  // patas
  '<ellipse cx="39" cy="94" rx="9" ry="6" fill="#E0560A"/>' +
  '<ellipse cx="61" cy="94" rx="9" ry="6" fill="#E0560A"/>' +

  // cuerpo
  '<path d="M50 28 C71 28 84 43 84 62 C84 82 69 93 50 93 C31 93 16 82 16 62 C16 43 29 28 50 28 Z" fill="url(#' + id + 'b)"/>' +
  // brillo
  '<ellipse cx="38" cy="42" rx="13" ry="9" fill="#fff" opacity=".2" transform="rotate(-22 38 42)"/>' +
  // mejillas
  '<ellipse cx="27" cy="62" rx="6" ry="4.2" fill="#FF3E6C" opacity=".26"/>' +
  '<ellipse cx="73" cy="62" rx="6" ry="4.2" fill="#FF3E6C" opacity=".26"/>' +

  eyes(mood) +
  (MOUTHS[mood] || MOUTHS.neutral) +
'</svg>';
  }

  /** Nodo DOM listo para insertar. */
  function node(mood, size, opts) {
    var wrap = document.createElement('div');
    wrap.className = 'mascot' + (size ? ' mascot--' + size : '');
    if (mood === 'happy' || mood === 'party') wrap.classList.add('is-' + mood);
    if (mood === 'sad') wrap.classList.add('is-sad');
    if (mood === 'think') wrap.classList.add('is-think');
    wrap.innerHTML = svg(mood, opts);
    return wrap;
  }

  /** Cambia el ánimo de un nodo existente con una animación. */
  function setMood(wrap, mood, opts) {
    if (!wrap) return;
    wrap.classList.remove('is-happy', 'is-sad', 'is-think', 'is-party');
    wrap.innerHTML = svg(mood, opts);
    void wrap.offsetWidth;
    if (mood === 'happy') wrap.classList.add('is-happy');
    else if (mood === 'party') wrap.classList.add('is-party');
    else if (mood === 'sad') wrap.classList.add('is-sad');
    else if (mood === 'think') wrap.classList.add('is-think');
  }

  w.Mascot = { svg: svg, node: node, setMood: setMood };
})(window);
