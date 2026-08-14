/* ==========================================================================
   CHISPA ENGINE

   Un despachador, no un chatbot. Recibe lo que escribe el usuario y decide con
   qué responder, parándose en el primer nivel que resuelva de verdad:

     1  intención     ¿qué quiere hacer?
     2  perfil        ¿qué sé ya de su negocio? (js/core/venture.js)
     3  huecos        ¿me falta un dato? → pregunto UNO, no seis
     4  fórmula       ¿es calculable? → se calcula, sin modelo generativo
     5  conocimiento  fragmentos relevantes de la base, filtrados por sector
     6  plantilla     si con eso alcanza, se responde y se termina aquí
     7  generativo    solo si aporta lo que una plantilla no puede

   El modelo generativo nunca es la fuente de la verdad. Cuando se llega al
   nivel 7, Chispa entrega los hechos ya resueltos y el modelo solo redacta.

   Medido en el laboratorio (lab/): 20 de 20 criterios en 1 ms, contra 7 de 23
   en 17,5 s del modelo generativo local más pequeño que existe.
   ========================================================================== */
(function (w) {
  'use strict';

  /* ==================================================================
     ESTADO DE LA CONVERSACIÓN

     Vive en Store, junto al resto del progreso, para que una pregunta a
     medias sobreviva a cerrar la app. `datos` guarda lo que el usuario
     va respondiendo; los números que ya están en el perfil no se piden
     otra vez.
     ================================================================== */

  function estado() {
    var s = w.Store.state;
    if (!s.chispa || typeof s.chispa !== 'object') {
      s.chispa = { pendiente: null, datos: {} };
    }
    if (!s.chispa.datos) s.chispa.datos = {};
    return s.chispa;
  }

  function set(fn, motivo) {
    w.Store.set(function (s) {
      if (!s.chispa) s.chispa = { pendiente: null, datos: {} };
      fn(s.chispa);
    }, motivo || 'chispa');
  }

  function pendiente() { return estado().pendiente; }
  function olvidarPendiente() { set(function (c) { c.pendiente = null; }, 'chispa-pendiente'); }

  /** Todo lo que Chispa sabe en números: lo suyo más lo que ya declaró el
      usuario en misiones. Preguntar dos veces el mismo dato es el error que
      más rápido hace que alguien deje de usar un asistente. */
  function datos() {
    var c = estado();
    var out = {}, k;
    for (k in c.datos) if (Object.prototype.hasOwnProperty.call(c.datos, k)) out[k] = c.datos[k];

    try {
      var m = w.Venture.active().metrics || {};
      if (out.precio == null && m.precio != null) out.precio = m.precio;
      if (out.costoVariable == null && m.costo != null) out.costoVariable = m.costo;
      if (out.fijos == null && m.fijos != null) out.fijos = m.fijos;
    } catch (e) {}
    return out;
  }

  function guardarDato(slot, valor) {
    set(function (c) { c.datos[slot] = valor; }, 'chispa-dato');
    // Los tres que el resto de la app también usa se espejan al perfil.
    try {
      var mapa = { precio: 'precio', costoVariable: 'costo', fijos: 'fijos' };
      if (mapa[slot] && typeof valor === 'number') {
        w.Venture.set(function (v) { v.metrics[mapa[slot]] = valor; }, 'venture-metrics');
      }
    } catch (e) {}
  }

  /* ==================================================================
     FÓRMULAS

     Nada de esto pasa por un modelo. Un precio calculado se puede
     comprobar con una calculadora; uno redactado por un LLM es una
     opinión con formato de número.
     ================================================================== */

  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function pctv(v) { var n = num(v); return n > 1 ? n / 100 : n; }
  function redondear(n) { return Math.ceil(n / 5) * 5; }
  function money(n) { return w.UI.money(n); }

  var FORMULAS = {
    precio_sugerido: {
      id: 'precio_sugerido',
      titulo: 'Precio sugerido',
      necesita: ['materiales', 'minutos', 'valorHora', 'empaque', 'comision', 'margen'],
      calcular: function (d) {
        var materiales = num(d.materiales), empaque = num(d.empaque);
        var minutos = num(d.minutos), valorHora = num(d.valorHora);
        var comision = pctv(d.comision), margen = pctv(d.margen);

        if (comision + margen >= 0.95) {
          return { error: 'Entre la comisión y el margen te llevas más del 95% del precio. Con esos ' +
            'números no hay precio posible: baja el margen objetivo o busca un canal con menos comisión.' };
        }
        var manoObra = (minutos / 60) * valorHora;
        var costoDirecto = materiales + empaque + manoObra;
        if (costoDirecto <= 0) return { error: 'El costo directo salió en cero. Revisa los materiales y el tiempo.' };

        // Se redondea PRIMERO y todo lo demás se deriva del precio redondeado.
        // Si no, el desglose describe un precio que no es el que se muestra.
        var bruto = costoDirecto / (1 - margen) / (1 - comision);
        var precio = redondear(bruto);
        var comisionMonto = precio * comision;
        var utilidad = precio - costoDirecto - comisionMonto;

        return {
          precio: precio, costoDirecto: costoDirecto, manoObra: manoObra,
          comisionMonto: comisionMonto, utilidad: utilidad,
          margenReal: utilidad / precio,
          desglose: [
            ['Materiales', materiales],
            ['Empaque y envío', empaque],
            ['Tu tiempo (' + minutos + ' min a ' + money(valorHora) + '/h)', manoObra],
            ['Costo directo', costoDirecto],
            ['Comisión (' + Math.round(comision * 100) + '%)', comisionMonto],
            ['Te queda', utilidad]
          ]
        };
      }
    },

    punto_equilibrio: {
      id: 'punto_equilibrio',
      titulo: 'Punto de equilibrio',
      necesita: ['fijos', 'precio', 'costoVariable'],
      calcular: function (d) {
        var fijos = num(d.fijos), precio = num(d.precio), variable = num(d.costoVariable);
        var mc = precio - variable;
        if (mc <= 0) {
          return { error: 'Tu precio es menor o igual a tu costo por unidad: pierdes dinero en cada venta, ' +
            'vendas las que vendas. Esto no se arregla con volumen, se arregla con el precio.' };
        }
        var pe = Math.ceil(fijos / mc);
        return {
          contribucion: mc, margen: mc / precio, unidades: pe,
          conColchon: Math.ceil(pe * 1.6), ingresoEquilibrio: pe * precio
        };
      }
    },

    margen: {
      id: 'margen',
      titulo: 'Margen por unidad',
      necesita: ['precio', 'costoVariable'],
      calcular: function (d) {
        var precio = num(d.precio), costo = num(d.costoVariable);
        if (precio <= 0) return { error: 'El precio tiene que ser mayor que cero.' };
        var m = precio - costo;
        var p = m / precio;
        return {
          margen: m, pct: p,
          diagnostico: p >= 0.45 ? 'Margen saludable para producción propia.'
            : (p >= 0.30 ? 'Ajustado: cualquier imprevisto se come la ganancia.'
                         : 'Insuficiente. Sube el precio o baja el costo antes de vender más.')
        };
      }
    }
  };

  /* ==================================================================
     RANURAS

     Cada dato que una fórmula necesita, con la pregunta exacta. Se
     pregunta de uno en uno a propósito: un formulario de seis campos
     dentro de un chat se abandona.
     ================================================================== */

  var SLOTS = {
    materiales:    { pregunta: '¿Cuánto te cuestan los materiales de una sola unidad?', ph: '45', tipo: 'num' },
    minutos:       { pregunta: '¿Cuántos minutos de trabajo te lleva una unidad?', ph: '30', tipo: 'num' },
    valorHora:     { pregunta: '¿Cuánto quieres que valga tu hora de trabajo?', ph: '80', tipo: 'num' },
    empaque:       { pregunta: '¿Cuánto gastas en empaque y envío por unidad? Si no gastas nada, escribe 0.', ph: '12', tipo: 'num' },
    comision:      { pregunta: '¿Qué porcentaje se queda la plataforma donde vendes? Si vendes directo, escribe 0.', ph: '0', tipo: 'num' },
    margen:        { pregunta: '¿Qué margen quieres dejar? Para producción propia lo sano es entre 50 y 65.', ph: '55', tipo: 'num' },
    fijos:         { pregunta: '¿Cuánto pagas al mes pase lo que pase (renta, servicios, suscripciones)?', ph: '2400', tipo: 'num' },
    precio:        { pregunta: '¿A qué precio vendes hoy una unidad?', ph: '190', tipo: 'num' },
    costoVariable: { pregunta: '¿Cuánto te cuesta producir una unidad, sin contar los gastos fijos?', ph: '60', tipo: 'num' },
    oferta:        { pregunta: 'Pega aquí tu propuesta de valor, tal como se la dirías a un cliente.', ph: 'Ayudo a… a… mediante…', tipo: 'texto' }
  };

  /* ==================================================================
     INTENCIONES
     ================================================================== */

  var INTENCIONES = [
    { id: 'calcular_precio', etiqueta: 'Calcular un precio', formula: 'precio_sugerido', guarda: 'precio',
      claves: ['precio', 'cobrar', 'cuanto cobro', 'cuanto vendo', 'en cuanto vendo', 'cuanto le pongo',
        'poner precio', 'tarifa', 'cuanto vale', 'que precio', 'cuanto deberia cobrar',
        'en cuanto debo vender', 'cuanto debo vender', 'a cuanto vendo', 'a como lo vendo',
        'ponerle precio', 'calcular mi precio', 'precio sugerido'] },

    { id: 'punto_equilibrio', etiqueta: 'Punto de equilibrio', formula: 'punto_equilibrio', guarda: 'equilibrio',
      claves: ['punto de equilibrio', 'equilibrio', 'cuantas unidades', 'cuantas piezas', 'no perder',
        'break even', 'cuanto tengo que vender'] },

    { id: 'calcular_margen', etiqueta: 'Tu margen', formula: 'margen',
      claves: ['margen', 'cuanto gano', 'ganancia por unidad', 'utilidad por unidad', 'me conviene', 'es rentable'] },

    { id: 'definir_cliente', etiqueta: 'Tu cliente ideal', plantilla: 'cliente',
      claves: ['cliente ideal', 'a quien le vendo', 'quien me compra', 'mi publico', 'nicho', 'segmento',
        'quien es mi cliente', 'definir cliente', 'a quien vendo'] },

    { id: 'evaluar_oferta', etiqueta: 'Revisar tu propuesta', plantilla: 'evaluar',
      claves: ['evalua mi oferta', 'revisa mi oferta', 'mi propuesta de valor', 'que te parece mi oferta',
        'esta bien mi propuesta', 'califica mi oferta', 'revisar mi oferta'] },

    { id: 'generar_desafio', etiqueta: 'Un desafío para hoy', plantilla: 'desafio',
      claves: ['desafio', 'reto', 'que hago hoy', 'dame una tarea', 'siguiente paso', 'que sigue',
        'proponme algo', 'mision', 'que hago ahora'] },

    { id: 'plan_inicial', etiqueta: 'Un plan de arranque', plantilla: 'plan',
      claves: ['plan', 'plan de negocio', 'como empiezo', 'por donde empiezo', 'plan inicial',
        'crear un plan', 'necesito un plan', 'como arranco'] },

    { id: 'recordar_decision', etiqueta: 'Lo que ya decidiste', plantilla: 'memoria',
      claves: ['que decidi', 'que habia decidido', 'mis decisiones', 'que dije', 'recuerdas',
        'que quedamos', 'ya lo habiamos visto', 'que llevamos'] }
  ];

  function normalizar(s) { return w.CHISPA_KB.normalizar(s); }

  /* Raíces precalculadas de cada intención. */
  var RAICES_INT = {};
  (function () {
    for (var i = 0; i < INTENCIONES.length; i++) {
      RAICES_INT[INTENCIONES[i].id] = w.CHISPA_KB.raices(INTENCIONES[i].claves.join(' '));
    }
  })();

  /** Combina dos señales: la frase completa, que es lo más fiable cuando
      aparece, y el solape de raíces, que es lo que salva las variantes.
      "¿En cuánto debo vender?" no contiene ninguna clave literal. */
  function detectarIntencion(texto) {
    var t = normalizar(texto);
    var rs = w.CHISPA_KB.raices(texto);
    var mejor = null, mejorPuntos = 0;

    for (var i = 0; i < INTENCIONES.length; i++) {
      var it = INTENCIONES[i], p = 0;
      for (var j = 0; j < it.claves.length; j++) {
        var kn = normalizar(it.claves[j]);
        if (kn && t.indexOf(kn) >= 0) p += kn.split(' ').length * 2 + kn.length / 10;
      }
      var solape = 0, r;
      for (r in RAICES_INT[it.id]) {
        if (Object.prototype.hasOwnProperty.call(RAICES_INT[it.id], r) && rs[r]) solape++;
      }
      p += solape * 1.2;
      if (p > mejorPuntos) { mejorPuntos = p; mejor = it; }
    }
    return { intencion: mejorPuntos >= 2.2 ? mejor : null, confianza: Math.min(1, mejorPuntos / 8) };
  }

  /** ¿Esto es la respuesta al dato que pedí, o el usuario cambió de tema?
      Se exige una señal clara: otra intención distinta reconocida, y que la
      frase no sea simplemente el número que estaba esperando. */
  function cambioDeTema(texto, pend, numeros) {
    var txt = String(texto).trim();
    if (numeros && numeros.length && txt.length < 24) return null;   // "35 minutos" es la respuesta
    var det = detectarIntencion(txt);
    if (!det.intencion) return null;
    if (det.intencion.id === pend.intencion) return null;
    // Para una ranura de texto libre casi todo vale como respuesta: solo se
    // cambia de tema si además es corto, es decir, claramente una pregunta.
    if (SLOTS[pend.slot].tipo !== 'num' && txt.length > 90) return null;
    return det.intencion;
  }

  function extraerNumeros(texto) {
    var m = String(texto).match(/-?\d+(?:[.,]\d+)?/g);
    if (!m) return [];
    var out = [];
    for (var i = 0; i < m.length; i++) out.push(parseFloat(m[i].replace(',', '.')));
    return out;
  }

  /* ==================================================================
     PLANTILLAS

     Componen la respuesta con los datos reales del usuario. Aquí se
     resuelve la mayoría de los casos sin tocar ningún modelo.
     ================================================================== */

  function T() { return w.Venture.terms(); }

  var PLANTILLAS = {
    cliente: function (ctx) {
      var t = ctx.t, L = [];
      L.push('Para ' + t.tuProducto + ', el cliente no se define por edad sino por necesidad. ' +
             'Completa esta frase y ya lo tienes:');
      L.push('');
      L.push('**Le vendo a [grupo concreto] que necesita [X] porque [causa real], y los encuentro en [lugar donde se juntan].**');
      L.push('');
      if (t.tiene.cliente) {
        L.push('Lo que ya me habías dicho: “' + t.cliente + '”. Es un punto de partida. Lo que falta es ' +
               'el lugar concreto donde encontrarlos y la causa detrás de su necesidad.');
      } else {
        L.push('Escribe tres perfiles distintos, no uno. El primero casi nunca es el que compra.');
      }
      var err = buscarPorId(ctx.fuentes, 'cliente-todos');
      if (err) { L.push(''); L.push('⚠️ ' + err.cuerpo); }
      return L.join('\n');
    },

    evaluar: function (ctx) {
      var texto = ctx.datos.oferta || '';
      var criterios = [
        { label: 'Nombra a un cliente concreto', ok: /\b(para|a)\s+\w{4,}/i.test(texto) && !/\b(todos|todo el mundo|cualquiera)\b/i.test(texto) },
        { label: 'Promete un resultado, no solo un objeto', ok: /(para que|logras|consigues|evitas|ahorras|dejas de|sin tener que|resuelve|recupera)/i.test(texto) },
        { label: 'Incluye precio', ok: /\$|\bpesos\b|\bmxn\b/i.test(texto) || /\b\d{2,}\b/.test(texto) },
        { label: 'Incluye plazo de entrega', ok: /\b(hora|horas|dia|dias|semana|semanas|mes|meses|entrega)\b/i.test(texto) },
        { label: 'Sin frases vacías', ok: !/(calidad|el mejor|excelente|increible|unico|profesional)/i.test(texto) }
      ];
      var ok = 0, i;
      for (i = 0; i < criterios.length; i++) if (criterios[i].ok) ok++;
      var nota = Math.round((ok / criterios.length) * 100);

      var L = ['**' + nota + '/100** · cumples ' + ok + ' de ' + criterios.length + ' criterios.', ''];
      for (i = 0; i < criterios.length; i++) L.push((criterios[i].ok ? '✅ ' : '⚠️ ') + criterios[i].label);
      var faltan = [];
      for (i = 0; i < criterios.length; i++) if (!criterios[i].ok) faltan.push(criterios[i]);
      if (faltan.length) {
        L.push('');
        L.push('Lo que más te sube la nota ahora mismo: **' + faltan[0].label.toLowerCase() + '**.');
      } else {
        L.push('');
        L.push('Está lista para usarse con clientes reales. Guárdala en Mi Negocio.');
      }
      return L.join('\n');
    },

    desafio: function (ctx) {
      var t = ctx.t;
      if (!t.tiene.producto) {
        return 'Para proponerte un desafío que sirva necesito saber qué vendes. Cuéntamelo en una frase ' +
               'y te lo escribo sobre eso, no sobre un ejemplo cualquiera.';
      }
      if (t.etapa === 'idea' || t.etapa === 'starting') {
        return '**Hoy:** habla con tres personas de ' + t.cliente + '. No para venderles ' + t.productoCorto +
               ': para preguntarles cuándo fue la última vez que tuvieron el problema que resuelves, qué ' +
               'hicieron y cuánto les costó.\n\nAnota sus palabras textuales, sin corregirlas. De ahí sale ' +
               'el argumento con el que vas a vender.';
      }
      return '**Esta semana:** manda diez mensajes a personas concretas de ' + t.cliente + ' ofreciendo ' +
             t.tuProducto + '. Cada uno con una primera línea distinta sobre esa persona.\n\n' +
             'Anota cuántos respondieron. Con menos de diez no tienes muestra: un día de silencio es normal.';
    },

    plan: function (ctx) {
      var t = ctx.t;
      if (!t.tiene.producto) {
        return 'Antes del plan necesito una frase: ¿qué vas a vender y a quién? Con eso te lo armo sobre ' +
               'tu caso.';
      }
      var L = [];
      L.push('**Plan de arranque para ' + t.negocio + '**');
      L.push('');
      L.push('**Semana 1 — comprobar que el problema existe.** Habla con cinco personas de ' + t.cliente +
             '. Preguntas sobre el pasado, nunca “¿lo comprarías?”.');
      L.push('**Semana 2 — poner precio.** Escríbeme “calcular precio” y lo hacemos con tus números, ' +
             'incluyendo tu tiempo.');
      L.push('**Semana 3 — una oferta escrita.** Para quién es, qué resultado promete, qué incluye, en ' +
             'cuánto tiempo, con qué garantía y a qué precio.');
      L.push('**Semana 4 — venderla.** Publícala donde de verdad encuentras a ' + t.cliente +
             ' y mide cuántas respuestas obtienes.');
      var ej = buscarPorTipo(ctx.fuentes, 'ejemplo');
      if (ej) { L.push(''); L.push('**De tu sector:** ' + ej.cuerpo); }
      return L.join('\n');
    },

    memoria: function () {
      var dec = w.Venture.decisions();
      if (!dec.length) {
        return 'Todavía no hemos decidido nada juntos. En cuanto calculemos un precio o definas tu ' +
               'cliente, lo guardo y dejo de preguntártelo.';
      }
      var L = ['Esto es lo que ya decidiste:', ''];
      for (var i = 0; i < Math.min(dec.length, 8); i++) {
        var d = dec[i];
        L.push('· **' + (d.label || d.key) + ':** ' + w.Venture.util.shorten(d.value, 140));
      }
      L.push('');
      L.push('No lo voy a contradecir. Si quieres cambiar algo, dímelo y lo actualizo.');
      return L.join('\n');
    }
  };

  function buscarPorId(fuentes, id) {
    for (var i = 0; i < fuentes.length; i++) if (fuentes[i].id === id) return fuentes[i];
    return null;
  }
  function buscarPorTipo(fuentes, tipo) {
    for (var i = 0; i < fuentes.length; i++) if (fuentes[i].tipo === tipo) return fuentes[i];
    return null;
  }

  /* ==================================================================
     EL DESPACHADOR
     ================================================================== */

  function responder(texto) {
    var t0 = (w.performance && w.performance.now) ? w.performance.now() : Date.now();
    var t = T();
    var filtro = { sector: t.sector || null, etapa: t.etapa || null };
    var pend = pendiente();

    /* Si veníamos preguntando un dato, esta respuesta es ese dato… salvo que
       el usuario haya cambiado de tema, que es lo que hace de verdad. Insistir
       con el número cuando alguien acaba de preguntar otra cosa convierte al
       mentor en un formulario del que no se puede salir. */
    var intencionId = pend ? pend.intencion : null;
    var aviso = null;

    /* Punto de salida único: sella el tiempo y antepone el aviso cuando se
       abandonó un cálculo a medias. */
    function salida(res) {
      if (aviso && res.texto) res.texto = aviso + '\n\n' + res.texto;
      if (aviso) res.aviso = aviso;
      return fin(res, t0);
    }

    if (pend) {
      var slot = SLOTS[pend.slot];
      var ns = slot.tipo === 'num' ? extraerNumeros(texto) : null;
      var otra = cambioDeTema(texto, pend, ns);

      if (otra) {
        olvidarPendiente();
        intencionId = null;
        aviso = 'Dejamos el cálculo a medias; lo que ya me dijiste queda guardado.';
      } else if (slot.tipo === 'num') {
        if (!ns.length) {
          return salida({
            tipo: 'pregunta', intencion: intencionId,
            texto: 'Necesito un número para poder calcularlo.\n\n' + slot.pregunta,
            pregunta: { slot: pend.slot, ph: slot.ph, tipo: slot.tipo },
            fuentes: [], nivel: 3
          });
        }
        guardarDato(pend.slot, ns[0]);
        olvidarPendiente();
      } else {
        guardarDato(pend.slot, String(texto).trim());
        olvidarPendiente();
      }
    }

    /* 1 · Intención */
    var intencion = null, i;
    if (intencionId) {
      for (i = 0; i < INTENCIONES.length; i++) if (INTENCIONES[i].id === intencionId) intencion = INTENCIONES[i];
    }
    if (!intencion) intencion = detectarIntencion(texto).intencion;

    /* 5 · Conocimiento relevante: se recupera siempre, alimenta a todos los niveles. */
    var fuentesRaw = w.CHISPA_KB.buscar(texto || (intencion ? intencion.etiqueta : ''), filtro, 4);
    var fuentes = [];
    for (i = 0; i < fuentesRaw.length; i++) fuentes.push(fuentesRaw[i].entrada);

    /* Sin intención clara: el nivel 7 puede aportar algo que las plantillas no.
       Se devuelve todo lo recuperado para que quien llame decida. */
    if (!intencion) {
      return salida({
        tipo: 'abierta', intencion: null, texto: null,
        fuentes: fuentes, nivel: 7,
        prompt: construirPrompt(texto, fuentes),
        sugerencias: sugerencias(fuentes)
      });
    }

    var d = datos();

    /* 2+3 · Perfil y huecos */
    if (intencion.formula) {
      var f = FORMULAS[intencion.formula];
      var falta = null;
      for (i = 0; i < f.necesita.length; i++) {
        var s = f.necesita[i];
        if (d[s] === undefined || d[s] === null || d[s] === '') { falta = s; break; }
      }

      if (falta) {
        var sl = SLOTS[falta];
        var yaTiene = 0;
        for (i = 0; i < f.necesita.length; i++) {
          if (d[f.necesita[i]] !== undefined && d[f.necesita[i]] !== '') yaTiene++;
        }
        var L = [sl.pregunta];
        // Sin guiones bajos: UI.rich() solo entiende **negrita**, así que un
        // _texto_ se vería con los guiones puestos.
        if (yaTiene > 0) L.push('\nLlevamos ' + yaTiene + ' de ' + f.necesita.length + ' datos.');
        // El aviso que más dinero salva, justo cuando toca.
        if (falta === 'valorHora') {
          var av = w.CHISPA_KB.porId('precio-olvida-tiempo');
          if (av) L.push('\n' + av.cuerpo);
        }
        set(function (c) { c.pendiente = { intencion: intencion.id, slot: falta }; }, 'chispa-pendiente');
        return salida({
          tipo: 'pregunta', intencion: intencion.id, texto: L.join('\n'),
          pregunta: { slot: falta, ph: sl.ph, tipo: sl.tipo },
          fuentes: fuentes, nivel: 3
        });
      }

      /* 4 · Fórmula */
      var r = f.calcular(d);
      if (r.error) {
        return salida({ tipo: 'calculo', intencion: intencion.id, texto: '⚠️ ' + r.error,
                     calculo: null, fuentes: fuentes, nivel: 4 });
      }
      var txt = redactarCalculo(f, r, fuentes);
      guardarDecision(intencion, r);
      return salida({ tipo: 'calculo', intencion: intencion.id, texto: txt, calculo: r,
                   fuentes: fuentes, nivel: 4 });
    }

    /* 6 · Plantilla */
    if (intencion.plantilla) {
      if (intencion.id === 'evaluar_oferta' && !d.oferta) {
        set(function (c) { c.pendiente = { intencion: intencion.id, slot: 'oferta' }; }, 'chispa-pendiente');
        return salida({
          tipo: 'pregunta', intencion: intencion.id, texto: SLOTS.oferta.pregunta,
          pregunta: { slot: 'oferta', ph: SLOTS.oferta.ph, tipo: 'texto' },
          fuentes: fuentes, nivel: 3
        });
      }
      var ctx = { t: t, datos: d, fuentes: fuentes };
      var compuesta = PLANTILLAS[intencion.plantilla](ctx);
      if (intencion.id === 'evaluar_oferta') {
        try {
          w.Venture.absorb('chispa', { texto: d.oferta }, { dossier: 'oferta', title: 'Propuesta de valor' });
        } catch (e) {}
        set(function (c) { delete c.datos.oferta; }, 'chispa-dato');
      }
      return salida({ tipo: 'plantilla', intencion: intencion.id, texto: compuesta,
                   fuentes: fuentes, nivel: 6 });
    }

    return salida({ tipo: 'abierta', intencion: intencion.id, texto: null, fuentes: fuentes,
                 nivel: 7, prompt: construirPrompt(texto, fuentes) });
  }

  function guardarDecision(intencion, r) {
    if (!intencion.guarda) return;
    try {
      if (intencion.guarda === 'precio' && r.precio != null) {
        w.Venture.recordDecision('precio', 'Precio de venta ' + money(r.precio) +
          ' · costo directo ' + money(r.costoDirecto) + ' · margen real ' +
          Math.round(r.margenReal * 100) + '%', { label: 'Costos y precio', from: 'chispa' });
        w.Venture.set(function (v) {
          v.metrics.precio = r.precio;
          v.metrics.costo = Math.round(r.costoDirecto * 100) / 100;
        }, 'venture-metrics');
      } else if (intencion.guarda === 'equilibrio' && r.unidades != null) {
        w.Venture.recordDecision('numeros', 'Punto de equilibrio: ' + r.unidades +
          ' unidades al mes (cada venta aporta ' + money(r.contribucion) + ')',
          { label: 'Tus números', from: 'chispa' });
      }
    } catch (e) { console.warn('[chispa] no se pudo guardar la decisión:', e); }
  }

  function redactarCalculo(formula, r, fuentes) {
    var t = T();
    var L = [];

    if (formula.id === 'precio_sugerido') {
      L.push('**Precio sugerido para ' + t.productoCorto + ': ' + money(r.precio) + '**');
      L.push('');
      for (var i = 0; i < r.desglose.length; i++) {
        L.push('· ' + r.desglose[i][0] + ': ' + money(r.desglose[i][1]));
      }
      L.push('');
      L.push('Te quedan **' + money(r.utilidad) + '** limpios por unidad, un margen real del **' +
             Math.round(r.margenReal * 100) + '%**.');
      if (r.margenReal < 0.30) L.push('\n⚠️ Ese margen es bajo. Cualquier imprevisto se lo come.');
      L.push('\nLo guardé en tu emprendimiento: no te lo vuelvo a preguntar.');
    } else if (formula.id === 'punto_equilibrio') {
      L.push('**Punto de equilibrio: ' + r.unidades + ' unidades al mes.**');
      L.push('');
      L.push('· Cada venta aporta ' + money(r.contribucion) + ' (' + Math.round(r.margen * 100) + '% del precio).');
      L.push('· A partir de la unidad ' + (r.unidades + 1) + ', cada venta es ganancia.');
      L.push('· Con colchón, planea vender ' + r.conColchon + ' al mes.');
    } else if (formula.id === 'margen') {
      L.push('**Margen: ' + money(r.margen) + ' por unidad (' + Math.round(r.pct * 100) + '%).**');
      L.push('');
      L.push(r.diagnostico);
    }

    var regla = buscarPorTipo(fuentes, 'regla');
    if (regla) { L.push(''); L.push('**' + regla.titulo + '.** ' + regla.cuerpo); }
    return L.join('\n');
  }

  function sugerencias(fuentes) {
    var out = [];
    for (var i = 0; i < INTENCIONES.length && out.length < 4; i++) out.push(INTENCIONES[i].etiqueta);
    if (fuentes.length) out.push(fuentes[0].titulo);
    return out;
  }

  function fin(res, t0) {
    var ahora = (w.performance && w.performance.now) ? w.performance.now() : Date.now();
    res.ms = Math.round(ahora - t0);
    return res;
  }

  /* ==================================================================
     PROMPT PARA EL NIVEL 7

     Cuando se decide llamar a un modelo, no se le manda la pregunta
     suelta: se le manda todo lo ya resuelto y se le prohíbe inventar.
     El modelo redacta; los hechos vienen de aquí.
     ================================================================== */

  function construirPrompt(texto, fuentes) {
    var L = [];
    if (fuentes && fuentes.length) {
      L.push('CONOCIMIENTO APLICABLE (úsalo; no añadas hechos que no estén aquí ni en el contexto)');
      for (var i = 0; i < fuentes.length; i++) {
        L.push('· ' + fuentes[i].titulo + ': ' + fuentes[i].cuerpo);
      }
      L.push('');
    }
    L.push('PREGUNTA DEL USUARIO: ' + texto);
    return L.join('\n');
  }

  /* ==================================================================
     API
     ================================================================== */

  w.Chispa = {
    responder: responder,
    detectarIntencion: detectarIntencion,
    pendiente: pendiente,
    cancelar: olvidarPendiente,
    datos: datos,
    guardarDato: guardarDato,
    FORMULAS: FORMULAS,
    SLOTS: SLOTS,
    INTENCIONES: INTENCIONES,
    construirPrompt: construirPrompt,
    meta: function () {
      var kb = w.CHISPA_KB.meta();
      return {
        intenciones: INTENCIONES.length,
        formulas: 3,
        slots: 10,
        entradas: kb.entradas,
        terminos: kb.terminos
      };
    }
  };
})(window);
