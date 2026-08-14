/* ==========================================================================
   CHISPA ENGINE

   Un despachador, no un chatbot. Recibe lo que escribe el usuario y decide con
   qué responder, en este orden y parándose en el primer nivel que resuelva:

     1  intención     ¿qué quiere hacer?
     2  perfil        ¿qué sé ya de su negocio?
     3  huecos        ¿me falta un dato? → pregunto UNO, no cinco
     4  fórmula       ¿es calculable? → se calcula, sin modelo generativo
     5  conocimiento  fragmentos relevantes de la base, filtrados por sector
     6  plantilla     si con eso alcanza, se responde y se termina aquí
     7  generativo    solo si aporta algo que las plantillas no pueden dar

   El modelo generativo nunca es la fuente de la verdad: cuando se usa, recibe
   los hechos ya resueltos y solo los redacta.
   ========================================================================== */

import { buscar } from './kb.js';

/* ==================================================================
   MEMORIA DEL LABORATORIO

   Deliberadamente separada de Emprendo. Prefijo propio para que ni una
   prueba fallida pueda tocar el progreso real del usuario.
   ================================================================== */

const CLAVE = 'chispa-lab:memoria';

const VACIA = {
  perfil: { negocio: '', producto: '', cliente: '', sector: '', etapa: '', lugar: '' },
  datos: {},        // slot -> valor numérico o texto
  decisiones: {},   // clave -> { valor, fecha, origen }
  historial: []
};

export function cargarMemoria() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return JSON.parse(JSON.stringify(VACIA));
    const m = JSON.parse(raw);
    return {
      perfil: Object.assign({}, VACIA.perfil, m.perfil || {}),
      datos: m.datos || {},
      decisiones: m.decisiones || {},
      historial: m.historial || []
    };
  } catch (e) { return JSON.parse(JSON.stringify(VACIA)); }
}

export function guardarMemoria(m) {
  try { localStorage.setItem(CLAVE, JSON.stringify(m)); } catch (e) {}
  return m;
}

export function borrarMemoria() {
  try { localStorage.removeItem(CLAVE); } catch (e) {}
  return JSON.parse(JSON.stringify(VACIA));
}

export function recordarDecision(m, clave, valor, origen) {
  m.decisiones[clave] = { valor: String(valor), fecha: new Date().toISOString().slice(0, 10), origen: origen || 'chispa' };
  guardarMemoria(m);
  return m;
}

/* ==================================================================
   FÓRMULAS

   Nada de esto pasa por un modelo. Un precio calculado es verificable;
   uno redactado por un LLM es una opinión con formato de número.
   ================================================================== */

export const FORMULAS = {
  precio_sugerido: {
    id: 'precio_sugerido',
    titulo: 'Precio sugerido',
    necesita: ['materiales', 'minutos', 'valorHora', 'empaque', 'comision', 'margen'],
    calcular(d) {
      const materiales = num(d.materiales), empaque = num(d.empaque);
      const minutos = num(d.minutos), valorHora = num(d.valorHora);
      const comision = pct(d.comision), margen = pct(d.margen);

      if (comision + margen >= 0.95) {
        return { error: 'Entre la comisión y el margen te llevas más del 95% del precio. Con esos números no hay precio posible: baja el margen objetivo o busca un canal con menos comisión.' };
      }
      const manoObra = (minutos / 60) * valorHora;
      const costoDirecto = materiales + empaque + manoObra;
      if (costoDirecto <= 0) return { error: 'El costo directo salió en cero. Revisa los materiales y el tiempo.' };

      // Se redondea PRIMERO y todo lo demás se deriva del precio redondeado.
      // Si no, el desglose describe un precio que no es el que se muestra.
      const bruto = costoDirecto / (1 - margen) / (1 - comision);
      const precio = redondear(bruto);
      const comisionMonto = precio * comision;
      const utilidad = precio - costoDirecto - comisionMonto;

      return {
        precio,
        costoDirecto,
        manoObra,
        comisionMonto,
        utilidad,
        margenReal: utilidad / precio,
        desglose: [
          ['Materiales', materiales],
          ['Empaque y envío', empaque],
          ['Tu tiempo (' + minutos + ' min a ' + money(valorHora) + '/h)', manoObra],
          ['Costo directo', costoDirecto],
          ['Comisión de plataforma (' + Math.round(comision * 100) + '%)', comisionMonto],
          ['Utilidad', utilidad]
        ]
      };
    }
  },

  punto_equilibrio: {
    id: 'punto_equilibrio',
    titulo: 'Punto de equilibrio',
    necesita: ['fijos', 'precio', 'costoVariable'],
    calcular(d) {
      const fijos = num(d.fijos), precio = num(d.precio), variable = num(d.costoVariable);
      const mc = precio - variable;
      if (mc <= 0) {
        return { error: 'Tu precio es menor o igual a tu costo variable: pierdes dinero en cada venta, vendas las que vendas. Esto no se arregla con volumen.' };
      }
      const pe = Math.ceil(fijos / mc);
      return {
        contribucion: mc,
        margen: mc / precio,
        unidades: pe,
        conColchon: Math.ceil(pe * 1.6),
        ingresoEquilibrio: pe * precio
      };
    }
  },

  margen: {
    id: 'margen',
    titulo: 'Margen por unidad',
    necesita: ['precio', 'costoVariable'],
    calcular(d) {
      const precio = num(d.precio), costo = num(d.costoVariable);
      if (precio <= 0) return { error: 'El precio tiene que ser mayor que cero.' };
      const m = precio - costo;
      const pct = m / precio;
      return {
        margen: m, pct,
        diagnostico: pct >= 0.45 ? 'Margen saludable para producción propia.'
          : pct >= 0.30 ? 'Ajustado: cualquier imprevisto se come la ganancia.'
            : 'Insuficiente. Sube el precio o baja el costo antes de vender más.'
      };
    }
  }
};

function num(v) { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
function pct(v) { const n = num(v); return n > 1 ? n / 100 : n; }
function redondear(n) { return Math.ceil(n / 5) * 5; }
export function money(n) {
  return '$' + (Math.round(n * 100) / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

/* ==================================================================
   RANURAS (slots)

   Cada dato que una fórmula necesita, con la pregunta exacta que hay
   que hacer si falta y cómo se valida. Preguntar de uno en uno es
   deliberado: un formulario de siete campos se abandona.
   ================================================================== */

export const SLOTS = {
  materiales:    { pregunta: '¿Cuánto te cuestan los materiales de una sola unidad?', unidad: '$', ph: '45', tipo: 'num' },
  minutos:       { pregunta: '¿Cuántos minutos de trabajo te lleva una unidad?', unidad: 'min', ph: '30', tipo: 'num' },
  valorHora:     { pregunta: '¿Cuánto quieres que valga tu hora de trabajo?', unidad: '$/h', ph: '80', tipo: 'num' },
  empaque:       { pregunta: '¿Cuánto gastas en empaque y envío por unidad?', unidad: '$', ph: '12', tipo: 'num', opcionalCero: true },
  comision:      { pregunta: '¿Qué porcentaje se queda la plataforma donde vendes? Si vendes directo, escribe 0.', unidad: '%', ph: '0', tipo: 'num', opcionalCero: true },
  margen:        { pregunta: '¿Qué margen quieres dejar? Para hecho a mano lo sano es entre 50 y 65.', unidad: '%', ph: '55', tipo: 'num' },
  fijos:         { pregunta: '¿Cuánto pagas al mes pase lo que pase (renta, servicios, suscripciones)?', unidad: '$', ph: '2400', tipo: 'num' },
  precio:        { pregunta: '¿A qué precio vendes hoy una unidad?', unidad: '$', ph: '190', tipo: 'num' },
  costoVariable: { pregunta: '¿Cuánto te cuesta producir una unidad, sin contar los gastos fijos?', unidad: '$', ph: '60', tipo: 'num' },
  producto:      { pregunta: '¿Qué vendes exactamente?', ph: 'Lámparas de mesa impresas en 3D', tipo: 'texto' },
  cliente:       { pregunta: '¿A quién se lo vendes?', ph: 'Personas que están decorando su primer departamento', tipo: 'texto' },
  oferta:        { pregunta: 'Pega aquí tu propuesta de valor tal como se la dirías a un cliente.', ph: 'Ayudo a… a… mediante…', tipo: 'texto' }
};

/* ==================================================================
   INTENCIONES
   ================================================================== */

export const INTENCIONES = [
  {
    id: 'calcular_precio',
    etiqueta: 'Calcular un precio',
    claves: ['precio', 'cobrar', 'cuanto cobro', 'cuanto vendo', 'en cuanto vendo', 'cuanto le pongo',
      'poner precio', 'tarifa', 'cuanto vale', 'que precio', 'cuanto deberia cobrar',
      'en cuanto debo vender', 'cuanto debo vender', 'a cuanto vendo', 'a como lo vendo',
      'cuanto cuesta el mio', 'ponerle precio', 'costo y precio'],
    formula: 'precio_sugerido',
    guarda: 'precio'
  },
  {
    id: 'punto_equilibrio',
    etiqueta: 'Punto de equilibrio',
    claves: ['punto de equilibrio', 'equilibrio', 'cuantas unidades', 'cuantas piezas', 'no perder',
      'break even', 'cuanto tengo que vender'],
    formula: 'punto_equilibrio',
    guarda: 'punto_equilibrio'
  },
  {
    id: 'calcular_margen',
    etiqueta: 'Margen',
    claves: ['margen', 'cuanto gano', 'ganancia por', 'utilidad por unidad', 'me conviene'],
    formula: 'margen'
  },
  {
    id: 'definir_cliente',
    etiqueta: 'Cliente ideal',
    claves: ['cliente ideal', 'a quien le vendo', 'quien me compra', 'mi publico', 'nicho', 'segmento',
      'quien es mi cliente', 'definir cliente'],
    plantilla: 'cliente'
  },
  {
    id: 'evaluar_oferta',
    etiqueta: 'Evaluar propuesta de valor',
    claves: ['evalua mi oferta', 'revisa mi oferta', 'mi propuesta de valor', 'que te parece mi oferta',
      'esta bien mi propuesta', 'califica mi oferta'],
    plantilla: 'evaluar'
  },
  {
    id: 'generar_desafio',
    etiqueta: 'Generar un desafío',
    claves: ['desafio', 'reto', 'que hago hoy', 'dame una tarea', 'siguiente paso', 'que sigue',
      'proponme algo', 'mision'],
    plantilla: 'desafio'
  },
  {
    id: 'plan_inicial',
    etiqueta: 'Plan inicial',
    claves: ['plan', 'plan de negocio', 'como empiezo', 'por donde empiezo', 'plan inicial',
      'crear un plan', 'necesito un plan'],
    plantilla: 'plan'
  },
  {
    id: 'recordar_decision',
    etiqueta: 'Recordar decisiones',
    claves: ['que decidi', 'que habia decidido', 'mis decisiones', 'que dije', 'recuerdas',
      'que quedamos', 'ya lo habiamos visto'],
    plantilla: 'memoria'
  }
];

function normalizar(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VACIAS = new Set(['de','la','el','los','las','un','una','unos','unas','y','o','que','en','a','al',
  'del','mi','mis','tu','tus','su','sus','se','por','para','con','sin','es','son','lo','me','te','le',
  'como','mas','muy','si','no','ya','pero','porque','esto','esta','este','ser','hay','sobre','desde']);

/* Raíz burda de cuatro letras. En español "vender", "vendo", "vendes" y "venta"
   comparten prefijo, y eso basta para reconocer de qué habla la frase sin
   arrastrar un lematizador entero al navegador. */
function raices(texto) {
  return new Set(
    normalizar(texto).split(' ')
      .filter(w => w.length >= 4 && !VACIAS.has(w))
      .map(w => w.slice(0, 4))
  );
}

/* Se precalculan las raíces de cada intención una sola vez. */
const RAICES_INTENCION = new Map();
INTENCIONES.forEach(i => RAICES_INTENCION.set(i.id, raices(i.claves.join(' '))));

/** Detecta la intención combinando dos señales: la frase completa, que es la
    más fiable cuando aparece, y el solape de raíces, que es lo que salva las
    variantes ("¿en cuánto debo vender?" no contiene ninguna clave literal). */
export function detectarIntencion(texto) {
  const t = normalizar(texto);
  const rs = raices(texto);
  let mejor = null, mejorPuntos = 0;

  INTENCIONES.forEach(i => {
    let p = 0;
    i.claves.forEach(k => {
      const kn = normalizar(k);
      if (kn && t.includes(kn)) p += kn.split(' ').length * 2 + kn.length / 10;
    });
    let solape = 0;
    RAICES_INTENCION.get(i.id).forEach(r => { if (rs.has(r)) solape++; });
    p += solape * 1.2;
    if (p > mejorPuntos) { mejorPuntos = p; mejor = i; }
  });

  return { intencion: mejorPuntos >= 2.2 ? mejor : null, confianza: Math.min(1, mejorPuntos / 8) };
}

/** Números sueltos en la frase, para no volver a preguntar lo evidente. */
export function extraerNumeros(texto) {
  const m = String(texto).match(/-?\d+(?:[.,]\d+)?/g);
  return m ? m.map(x => parseFloat(x.replace(',', '.'))) : [];
}

/* ==================================================================
   PLANTILLAS

   Componen la respuesta con los datos reales. Aquí se resuelve la
   mayoría de los casos sin tocar ningún modelo.
   ================================================================== */

function frasePerfil(p) {
  const partes = [];
  if (p.producto) partes.push(p.producto);
  if (p.cliente) partes.push('para ' + p.cliente);
  if (p.lugar) partes.push('en ' + p.lugar);
  return partes.join(' ');
}

const PLANTILLAS = {
  cliente(ctx) {
    const { perfil, fuentes } = ctx;
    const prod = perfil.producto || 'lo que vendes';
    const L = [];
    L.push(`Para ${prod}, un cliente ideal no se define por edad sino por necesidad. Completa esta frase y ya lo tienes:`);
    L.push('');
    L.push(`**Le vendo a [grupo concreto] que necesita [X] porque [causa real], y los encuentro en [lugar donde se juntan].**`);
    L.push('');
    if (perfil.cliente) {
      L.push(`Lo que ya me habías dicho: “${perfil.cliente}”. Eso es un punto de partida; lo que falta es el lugar concreto donde encontrarlos y la causa detrás de su necesidad.`);
    } else {
      L.push('Escribe tres perfiles distintos, no uno. El primero casi nunca es el que compra.');
    }
    const err = fuentes.find(f => f.id === 'cliente-todos');
    if (err) { L.push(''); L.push('⚠️ ' + err.cuerpo); }
    return L.join('\n');
  },

  evaluar(ctx) {
    const texto = ctx.datos.oferta || '';
    const criterios = [
      { id: 'publico', label: 'Nombra a un cliente concreto', ok: /\b(para|a)\s+\w{4,}/i.test(texto) && !/\b(todos|todo el mundo|cualquiera)\b/i.test(texto) },
      { id: 'resultado', label: 'Promete un resultado, no solo un objeto', ok: /(para que|logras|consigues|evitas|ahorras|dejas de|sin tener que|resuelve|recupera)/i.test(texto) },
      { id: 'precio', label: 'Incluye precio', ok: /\$|\bpesos\b|\bmxn\b/i.test(texto) || /\b\d{2,}\b/.test(texto) },
      { id: 'plazo', label: 'Incluye plazo de entrega', ok: /\b(hora|horas|dia|días|dias|semana|semanas|mes|meses|entrega)\b/i.test(texto) },
      { id: 'verificable', label: 'Sin frases vacías', ok: !/(calidad|el mejor|excelente|increible|increíble|unico|único|profesional)/i.test(texto) }
    ];
    const ok = criterios.filter(c => c.ok).length;
    const nota = Math.round((ok / criterios.length) * 100);
    const L = [`**${nota}/100** · cumples ${ok} de ${criterios.length} criterios.`, ''];
    criterios.forEach(c => L.push((c.ok ? '✅ ' : '⚠️ ') + c.label));
    const faltan = criterios.filter(c => !c.ok);
    if (faltan.length) {
      L.push('');
      L.push('Lo que más te sube la nota ahora mismo: **' + faltan[0].label.toLowerCase() + '**.');
    }
    return L.join('\n');
  },

  desafio(ctx) {
    const { perfil } = ctx;
    const prod = perfil.producto || 'tu producto';
    const cli = perfil.cliente || 'tus clientes';
    const etapa = perfil.etapa;
    if (!perfil.producto) {
      return 'Para proponerte un desafío que sirva necesito saber qué vendes. Cuéntamelo en una frase y te lo escribo sobre eso.';
    }
    if (etapa === 'idea' || etapa === 'starting') {
      return `**Hoy:** habla con tres personas de ${cli}. No para venderles ${prod}: para preguntarles cuándo fue la última vez que tuvieron el problema que resuelves, qué hicieron y cuánto les costó.\n\nAnota sus palabras textuales, sin corregirlas. De ahí sale el argumento con el que vas a vender.`;
    }
    return `**Esta semana:** manda diez mensajes personalizados a personas concretas de ${cli} ofreciendo ${prod}. Cada uno con una primera línea distinta sobre esa persona.\n\nAnota cuántos respondieron. Con menos de diez no tienes muestra: un día de silencio es normal.`;
  },

  plan(ctx) {
    const { perfil, fuentes } = ctx;
    if (!perfil.producto) {
      return 'Antes del plan necesito una frase: ¿qué vas a vender y a quién? Con eso te lo armo sobre tu caso y no sobre un ejemplo.';
    }
    const L = [];
    L.push(`**Plan de arranque para ${frasePerfil(perfil)}**`);
    L.push('');
    L.push('**Semana 1 — comprobar que el problema existe.** Habla con cinco personas de tu público. Preguntas sobre el pasado, nunca "¿lo comprarías?".');
    L.push('**Semana 2 — poner precio.** Calcula tu costo por unidad incluyendo tu tiempo y fija el precio. Pregúntame "calcular precio" y lo hacemos con tus números.');
    L.push('**Semana 3 — una oferta escrita.** Para quién es, qué resultado promete, qué incluye, en cuánto tiempo, con qué garantía y a qué precio.');
    L.push('**Semana 4 — venderla.** Publícala donde de verdad esté tu cliente y mide cuántas respuestas obtienes.');
    const ej = fuentes.find(f => f.tipo === 'ejemplo');
    if (ej) { L.push(''); L.push(`**De tu sector:** ${ej.cuerpo}`); }
    return L.join('\n');
  },

  memoria(ctx) {
    const dec = Object.entries(ctx.memoria.decisiones);
    if (!dec.length) return 'Todavía no hemos decidido nada juntos. En cuanto calculemos un precio o definas tu cliente, lo guardo aquí y dejo de preguntártelo.';
    const L = ['Esto es lo que ya decidiste:', ''];
    dec.forEach(([k, v]) => L.push(`· **${k}**: ${v.valor} _(${v.fecha}, ${v.origen})_`));
    L.push('');
    L.push('No lo voy a contradecir. Si quieres cambiarlo, dímelo y lo actualizo.');
    return L.join('\n');
  }
};

/* ==================================================================
   EL DESPACHADOR
   ================================================================== */

/** Resuelve una consulta. `pendiente` es el estado de una conversación de
    llenado de datos que quedó a medias. */
export function responder(texto, memoria, pendiente = null) {
  const t0 = performance.now();
  const perfil = memoria.perfil;
  const filtro = { sector: perfil.sector || null, etapa: perfil.etapa || null };

  /* Si veníamos preguntando un dato, esta respuesta es ese dato. */
  let intencionId = pendiente ? pendiente.intencion : null;
  if (pendiente) {
    const slot = SLOTS[pendiente.slot];
    if (slot.tipo === 'num') {
      const ns = extraerNumeros(texto);
      if (!ns.length) {
        return fin({
          tipo: 'pregunta', intencion: intencionId,
          texto: 'Necesito un número para poder calcularlo. ' + slot.pregunta,
          pregunta: { slot: pendiente.slot, ...slot },
          fuentes: [], nivel: 3
        }, t0);
      }
      memoria.datos[pendiente.slot] = ns[0];
    } else {
      memoria.datos[pendiente.slot] = texto.trim();
    }
    guardarMemoria(memoria);
  }

  /* 1 · Intención */
  let intencion = intencionId ? INTENCIONES.find(i => i.id === intencionId) : null;
  let confianza = intencion ? 1 : 0;
  if (!intencion) {
    const det = detectarIntencion(texto);
    intencion = det.intencion;
    confianza = det.confianza;
  }

  /* 5 · Conocimiento relevante (se recupera siempre: alimenta a todos los niveles) */
  const fuentes = buscar(texto || (intencion ? intencion.etiqueta : ''), filtro, 4).map(r => r.entrada);

  if (!intencion) {
    /* Sin intención clara: se ofrece lo que sí sabe hacer, con el conocimiento
       más cercano. Nunca se inventa una respuesta. */
    const L = ['No estoy seguro de qué necesitas. Puedo ayudarte con esto:', ''];
    INTENCIONES.slice(0, 6).forEach(i => L.push('· ' + i.etiqueta));
    if (fuentes.length) {
      L.push('');
      L.push(`Por lo que escribiste, quizá te sirva esto: **${fuentes[0].titulo}**. ${fuentes[0].cuerpo}`);
    }
    return fin({ tipo: 'plantilla', intencion: null, texto: L.join('\n'), fuentes, nivel: 6 }, t0);
  }

  /* 2+3 · Perfil y huecos: ¿falta algún dato de la fórmula? */
  if (intencion.formula) {
    const f = FORMULAS[intencion.formula];
    // Se pregunta por TODOS los datos de la fórmula. `opcionalCero` solo dice
    // que cero es una respuesta válida, no que se pueda dar por supuesto: dar
    // por hecho que el empaque cuesta cero es inventarle un dato al usuario.
    const falta = f.necesita.find(s => {
      const v = memoria.datos[s];
      return v === undefined || v === null || v === '';
    });

    if (falta) {
      const slot = SLOTS[falta];
      const yaTiene = f.necesita.filter(s => memoria.datos[s] !== undefined && memoria.datos[s] !== '').length;
      const conocimiento = fuentes[0];
      const L = [slot.pregunta];
      if (yaTiene > 0) L.push(`\n_Llevamos ${yaTiene} de ${f.necesita.length} datos._`);
      if (falta === 'valorHora' && conocimiento && conocimiento.id === 'precio-olvida-tiempo') {
        L.push('\n' + conocimiento.cuerpo);
      }
      return fin({
        tipo: 'pregunta', intencion: intencion.id,
        texto: L.join('\n'),
        pregunta: { slot: falta, ...slot },
        fuentes, nivel: 3
      }, t0);
    }

    /* 4 · Fórmula */
    const r = f.calcular(memoria.datos);
    if (r.error) {
      return fin({ tipo: 'calculo', intencion: intencion.id, texto: '⚠️ ' + r.error, calculo: null, fuentes, nivel: 4 }, t0);
    }
    const texto2 = redactarCalculo(intencion, f, r, memoria, fuentes);
    if (intencion.guarda) {
      const valor = r.precio !== undefined ? money(r.precio) : (r.unidades !== undefined ? r.unidades + ' unidades/mes' : '');
      if (valor) recordarDecision(memoria, intencion.guarda, valor, 'fórmula de Chispa');
    }
    return fin({ tipo: 'calculo', intencion: intencion.id, texto: texto2, calculo: r, fuentes, nivel: 4 }, t0);
  }

  /* 6 · Plantilla */
  if (intencion.plantilla) {
    /* Algunas plantillas necesitan un dato de texto. */
    if (intencion.id === 'evaluar_oferta' && !memoria.datos.oferta) {
      return fin({
        tipo: 'pregunta', intencion: intencion.id,
        texto: SLOTS.oferta.pregunta,
        pregunta: { slot: 'oferta', ...SLOTS.oferta },
        fuentes, nivel: 3
      }, t0);
    }
    const ctx = { perfil, datos: memoria.datos, memoria, fuentes };
    const txt = PLANTILLAS[intencion.plantilla](ctx);
    return fin({ tipo: 'plantilla', intencion: intencion.id, texto: txt, fuentes, nivel: 6 }, t0);
  }

  return fin({ tipo: 'plantilla', intencion: intencion.id, texto: 'Todavía no sé resolver eso.', fuentes, nivel: 6 }, t0);
}

function redactarCalculo(intencion, formula, r, memoria, fuentes) {
  const L = [];
  const prod = memoria.perfil.producto || 'tu producto';

  if (formula.id === 'precio_sugerido') {
    L.push(`**Precio sugerido para ${prod}: ${money(r.precio)}**`);
    L.push('');
    r.desglose.forEach(([k, v]) => L.push(`· ${k}: ${money(v)}`));
    L.push('');
    L.push(`Te quedan **${money(r.utilidad)}** limpios por unidad, un margen real del **${Math.round(r.margenReal * 100)}%**.`);
    if (r.margenReal < 0.30) L.push('\n⚠️ Ese margen es bajo. Cualquier imprevisto se lo come.');
  } else if (formula.id === 'punto_equilibrio') {
    L.push(`**Punto de equilibrio: ${r.unidades} unidades al mes.**`);
    L.push('');
    L.push(`· Cada venta aporta ${money(r.contribucion)} (${Math.round(r.margen * 100)}% del precio).`);
    L.push(`· A partir de la unidad ${r.unidades + 1}, cada venta es ganancia.`);
    L.push(`· Con colchón, planea vender ${r.conColchon} al mes.`);
  } else if (formula.id === 'margen') {
    L.push(`**Margen: ${money(r.margen)} por unidad (${Math.round(r.pct * 100)}%).**`);
    L.push('');
    L.push(r.diagnostico);
  }

  const regla = fuentes.find(f => f.tipo === 'regla');
  if (regla) { L.push(''); L.push(`_${regla.titulo}._ ${regla.cuerpo}`); }
  return L.join('\n');
}

function fin(res, t0) {
  res.ms = Math.round(performance.now() - t0);
  res.usoModelo = false;
  return res;
}

/* ==================================================================
   PROMPT PARA EL NIVEL 7

   Cuando se decide llamar a un modelo, no se le manda la pregunta suelta:
   se le manda todo lo ya resuelto y se le prohíbe inventar. El modelo
   redacta; los hechos vienen de aquí.
   ================================================================== */

export function construirPrompt(texto, memoria, fuentes) {
  const p = memoria.perfil;
  const L = [];
  L.push('Eres Chispa, mentor de negocios de la app Emprendo. Español neutro latinoamericano, de tú.');
  L.push('Máximo 120 palabras. Concreto y accionable. Nada de preámbulos ni despedidas.');
  L.push('');
  L.push('NEGOCIO DEL USUARIO');
  L.push('Producto: ' + (p.producto || '(sin definir)'));
  L.push('Cliente: ' + (p.cliente || '(sin definir)'));
  L.push('Etapa: ' + (p.etapa || '(sin definir)'));
  if (p.lugar) L.push('Zona: ' + p.lugar);

  const dec = Object.entries(memoria.decisiones);
  if (dec.length) {
    L.push('');
    L.push('DECISIONES YA TOMADAS (no las contradigas ni las vuelvas a preguntar)');
    dec.forEach(([k, v]) => L.push('· ' + k + ': ' + v.valor));
  }

  if (fuentes.length) {
    L.push('');
    L.push('CONOCIMIENTO APLICABLE (úsalo; no añadas hechos que no estén aquí)');
    fuentes.forEach(f => L.push('· ' + f.titulo + ': ' + f.cuerpo));
  }

  L.push('');
  L.push('REGLAS');
  L.push('· No inventes cifras del negocio. Si falta un dato, pide ese dato y nada más.');
  L.push('· No repitas lo que ya está decidido: úsalo.');
  L.push('· Termina con el siguiente paso concreto.');
  L.push('');
  L.push('PREGUNTA DEL USUARIO: ' + texto);
  return L.join('\n');
}

export const META_ENGINE = {
  intenciones: INTENCIONES.length,
  formulas: Object.keys(FORMULAS).length,
  slots: Object.keys(SLOTS).length
};
