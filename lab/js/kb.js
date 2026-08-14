/* ==========================================================================
   BASE DE CONOCIMIENTO

   La fuente de la verdad de Chispa. El modelo generativo, cuando se usa, solo
   redacta: los hechos salen de aquí y del perfil del emprendimiento.

   Cada entrada guarda conocimiento reutilizable, no preguntas y respuestas
   literales. Una misma regla sirve para una repostería y para una imprenta 3D
   porque el ejemplo se elige por sector y el texto se compone con los datos
   reales del usuario.

   Esquema de una entrada
   ----------------------
   id           identificador estable, se usa en `relacionados`
   tipo         concepto | regla | formula | error | ejemplo | diagnostico
                | desafio | plantilla | criterio
   titulo       cómo se anuncia en pantalla
   cuerpo       el conocimiento en sí, en segunda persona
   claves       términos por los que se debe encontrar (índice invertido)
   sectores     '*' o lista de sectores donde aplica
   etapas       '*' o lista de etapas del emprendimiento
   formula      id de la fórmula que resuelve el tema, si existe
   relacionados ids de otras entradas
   fuente       de dónde sale la afirmación
   revisado     fecha de la última revisión humana
   ========================================================================== */

export const ENTRADAS = [
  /* ------------------------------ PRECIO ------------------------------ */
  {
    id: 'precio-tres-numeros', tipo: 'regla',
    titulo: 'Un precio se arma con tres números, no con intuición',
    cuerpo: 'El piso lo pone tu costo real por unidad, incluyendo tu tiempo. El rango lo pone lo que ' +
            'cobran tres competidores por algo parecido. El techo lo pone cuánto gana o ahorra tu cliente ' +
            'al resolver el problema. Tu precio vive entre el piso y el techo, nunca por debajo del piso.',
    claves: ['precio', 'cobrar', 'cuanto cobro', 'tarifa', 'poner precio', 'vender mi producto', 'cuanto vale'],
    sectores: ['*'], etapas: ['*'],
    formula: 'precio_sugerido',
    relacionados: ['precio-olvida-tiempo', 'margen-sano', 'punto-equilibrio'],
    fuente: 'Práctica estándar de costeo por absorción y pricing por valor',
    revisado: '2026-08-13'
  },
  {
    id: 'precio-olvida-tiempo', tipo: 'error',
    titulo: 'El error más caro: no cobrarte tu propio tiempo',
    cuerpo: 'Casi todo el mundo suma materiales y empaque, y olvida las horas que le dedicó. ' +
            'Si no pones tu tiempo en el costo, te estás pagando cero por hora y el negocio parece ' +
            'rentable cuando en realidad te está costando dinero.',
    claves: ['tiempo', 'mano de obra', 'mi trabajo', 'horas', 'no gano nada', 'trabajo gratis'],
    sectores: ['*'], etapas: ['*'],
    relacionados: ['precio-tres-numeros'],
    fuente: 'Error recurrente documentado en costeo de microempresa',
    revisado: '2026-08-13'
  },
  {
    id: 'margen-sano', tipo: 'regla',
    titulo: 'Cuánto margen es suficiente',
    cuerpo: 'Para producción propia, apunta a un precio de 2 a 3 veces tu costo unitario, es decir, ' +
            'un margen del 50% al 65%. Por debajo del 40% cualquier imprevisto se come la ganancia y ' +
            'crecer solo multiplica el cansancio. En reventa el margen sano es menor, del 30% al 45%, ' +
            'porque no pones horas de fabricación.',
    claves: ['margen', 'ganancia', 'utilidad', 'cuanto gano', 'rentable', 'rentabilidad'],
    sectores: ['*'], etapas: ['*'],
    formula: 'margen',
    relacionados: ['precio-tres-numeros', 'punto-equilibrio'],
    fuente: 'Rangos habituales de margen bruto en manufactura artesanal y retail',
    revisado: '2026-08-13'
  },
  {
    id: 'comisiones-plataforma', tipo: 'regla',
    titulo: 'La comisión de la plataforma sale de tu precio, no de tu margen',
    cuerpo: 'Si vendes por una plataforma que se queda un porcentaje, ese porcentaje se calcula sobre ' +
            'el precio final, no sobre tu costo. Hay que dividir, no restar: si quieres que te queden ' +
            '$100 limpios y la comisión es del 15%, el precio no es $115, es $117,65.',
    claves: ['comision', 'comisión', 'plataforma', 'marketplace', 'mercado libre', 'porcentaje', 'me cobran'],
    sectores: ['*'], etapas: ['*'],
    formula: 'precio_sugerido',
    relacionados: ['precio-tres-numeros'],
    fuente: 'Aritmética de precios con comisión sobre venta',
    revisado: '2026-08-13'
  },

  /* --------------------------- EQUILIBRIO --------------------------- */
  {
    id: 'punto-equilibrio', tipo: 'concepto',
    titulo: 'Punto de equilibrio: tu meta mínima del mes',
    cuerpo: 'Es cuántas unidades necesitas vender para no perder dinero. Se calcula dividiendo tus ' +
            'costos fijos entre lo que cada venta aporta después de pagar su propio costo variable. ' +
            'Subir el precio baja ese número mucho más rápido que recortar gastos.',
    claves: ['punto de equilibrio', 'equilibrio', 'cuantas unidades', 'no perder', 'break even', 'cuanto vender'],
    sectores: ['*'], etapas: ['operating', 'growing', 'starting'],
    formula: 'punto_equilibrio',
    relacionados: ['margen-sano', 'flujo-vs-utilidad'],
    fuente: 'Contabilidad de costos, análisis costo-volumen-utilidad',
    revisado: '2026-08-13'
  },
  {
    id: 'flujo-vs-utilidad', tipo: 'concepto',
    titulo: 'Ganar en papel y quedarte sin dinero son cosas distintas',
    cuerpo: 'La utilidad dice si el negocio funciona; el flujo de efectivo dice si sobrevive este mes. ' +
            'Se quiebra por falta de efectivo, no por falta de ventas. Un pedido grande a 30 días puede ' +
            'ser una gran utilidad y una crisis de liquidez al mismo tiempo.',
    claves: ['flujo', 'efectivo', 'liquidez', 'no me alcanza', 'me quede sin dinero', 'cobrar despues'],
    sectores: ['*'], etapas: ['operating', 'growing'],
    relacionados: ['punto-equilibrio'],
    fuente: 'Distinción estándar entre resultado y flujo de caja',
    revisado: '2026-08-13'
  },

  /* ----------------------------- CLIENTE ----------------------------- */
  {
    id: 'cliente-por-necesidad', tipo: 'regla',
    titulo: 'El cliente ideal se define por necesidad, no por edad',
    cuerpo: 'Un cliente ideal no es "mujeres de 25 a 40". Es un grupo con una necesidad concreta, que ' +
            'puedes encontrar en un lugar real, y que puede y quiere pagar. La plantilla que funciona es: ' +
            'le vendo a [grupo] que necesita [X] porque [causa], y los encuentro en [lugar].',
    claves: ['cliente', 'cliente ideal', 'a quien le vendo', 'publico', 'nicho', 'segmento', 'target'],
    sectores: ['*'], etapas: ['*'],
    relacionados: ['cliente-todos', 'validar-pasado'],
    fuente: 'Segmentación por job-to-be-done',
    revisado: '2026-08-13'
  },
  {
    id: 'cliente-todos', tipo: 'error',
    titulo: '"Todos" no es un cliente',
    cuerpo: 'Cuando le hablas a todos no le hablas a nadie, y sobre todo no puedes buscarlos: no hay ' +
            'ningún lugar donde se junten "todos". Elegir un grupo concreto no reduce tu mercado, ' +
            'reduce tu competencia.',
    claves: ['todos', 'cualquiera', 'todo el mundo', 'publico general', 'le sirve a cualquiera'],
    sectores: ['*'], etapas: ['*'],
    relacionados: ['cliente-por-necesidad'],
    fuente: 'Error recurrente en definición de segmento',
    revisado: '2026-08-13'
  },

  /* ---------------------------- VALIDACIÓN ---------------------------- */
  {
    id: 'validar-pasado', tipo: 'regla',
    titulo: 'Pregunta por el pasado, nunca por el futuro',
    cuerpo: '"¿Lo comprarías?" siempre da un sí falso: la gente miente sin querer sobre lo que hará. ' +
            'Pregunta cuándo fue la última vez que tuvo el problema, qué hizo, cuánto le costó y qué ' +
            'ha probado. Eso son hechos, no opiniones.',
    claves: ['validar', 'validacion', 'entrevista', 'preguntar', 'saber si funciona', 'probar mi idea'],
    sectores: ['*'], etapas: ['idea', 'starting'],
    relacionados: ['validar-compromiso', 'cliente-por-necesidad'],
    fuente: 'The Mom Test, Rob Fitzpatrick',
    revisado: '2026-08-13'
  },
  {
    id: 'validar-compromiso', tipo: 'regla',
    titulo: 'Solo cuenta el compromiso que cuesta algo',
    cuerpo: 'Un elogio es gratis y no vale como señal. Lo que valida es un anticipo, una fecha agendada, ' +
            'un apartado o dejar su teléfono. Si nadie está dispuesto a que le cueste algo, todavía no ' +
            'hay demanda comprobada.',
    claves: ['compromiso', 'anticipo', 'apartado', 'me dijeron que si', 'les gusto', 'preventa'],
    sectores: ['*'], etapas: ['idea', 'starting'],
    relacionados: ['validar-pasado'],
    fuente: 'Validación por currency: tiempo, reputación o dinero',
    revisado: '2026-08-13'
  },

  /* ------------------------------ OFERTA ------------------------------ */
  {
    id: 'oferta-resultado', tipo: 'regla',
    titulo: 'No vendes el objeto, vendes el resultado',
    cuerpo: 'Una oferta completa dice para quién es, qué resultado promete, qué incluye exactamente, ' +
            'en cuánto tiempo se entrega, qué garantía tiene y cuánto cuesta. Todo lo que no escribas ' +
            'lo tendrá que preguntar el cliente, y ahí es donde se cae la venta.',
    claves: ['oferta', 'propuesta de valor', 'que vendo', 'mi producto', 'describir'],
    sectores: ['*'], etapas: ['*'],
    relacionados: ['oferta-criterios', 'precio-tres-numeros'],
    fuente: 'Estructura de oferta: público, promesa, alcance, plazo, garantía, precio',
    revisado: '2026-08-13'
  },
  {
    id: 'oferta-criterios', tipo: 'criterio',
    titulo: 'Con qué se evalúa una propuesta de valor',
    cuerpo: 'Nombra a un cliente concreto · promete un resultado y no solo un objeto · incluye precio ' +
            'y plazo · está escrita en términos verificables, sin "calidad" ni "el mejor".',
    claves: ['evaluar oferta', 'revisar mi oferta', 'esta bien mi propuesta'],
    sectores: ['*'], etapas: ['*'],
    relacionados: ['oferta-resultado'],
    fuente: 'Rúbrica usada por el mentor de Emprendo',
    revisado: '2026-08-13'
  },

  /* ------------------------------ CANALES ------------------------------ */
  {
    id: 'canales-dos', tipo: 'regla',
    titulo: 'Dos canales bien hechos ganan a cinco a medias',
    cuerpo: 'Con poco tiempo al día no alcanza para estar en todas partes. Elige los dos lugares donde ' +
            'de verdad se junta tu cliente, define una acción semanal para cada uno y mide si funcionó. ' +
            'El resto se descarta sin culpa.',
    claves: ['canal', 'canales', 'donde vendo', 'redes', 'instagram', 'facebook', 'tiktok', 'marketing'],
    sectores: ['*'], etapas: ['*'],
    relacionados: ['cliente-por-necesidad'],
    fuente: 'Concentración de esfuerzo en canales con presencia comprobada del segmento',
    revisado: '2026-08-13'
  },

  /* ------------------------ EJEMPLOS POR SECTOR ------------------------ */
  {
    id: 'ej-3d-repuestos', tipo: 'ejemplo',
    titulo: 'Impresión 3D: el repuesto vale más que la figura',
    cuerpo: 'Un negocio de impresión 3D vendía figuras decorativas con pocas ventas. Un cliente pidió ' +
            'una pieza para reparar su lavadora porque la refacción original ya no se fabricaba. En dos ' +
            'meses los repuestos eran el 70% de sus ingresos. El problema valía más que la idea.',
    claves: ['3d', 'impresion 3d', 'filamento', 'pla', 'petg', 'impresora'],
    sectores: ['hechoamano'], etapas: ['*'],
    relacionados: ['cliente-por-necesidad'],
    fuente: 'Caso de la base de Emprendo',
    revisado: '2026-08-13'
  },
  {
    id: 'ej-reposteria-urgencia', tipo: 'ejemplo',
    titulo: 'Repostería: la urgencia paga más que el sabor',
    cuerpo: 'Dos pastelerías con el mismo producto. Una abrió por amor a hornear; la otra porque nadie ' +
            'vendía pastel de última hora un domingo. La segunda vende el triple. El sabor era igual: ' +
            'lo que cambiaba era el problema que resolvía.',
    claves: ['pastel', 'reposteria', 'panaderia', 'postre', 'comida', 'galleta'],
    sectores: ['comida'], etapas: ['*'],
    relacionados: ['cliente-por-necesidad'],
    fuente: 'Caso de la base de Emprendo',
    revisado: '2026-08-13'
  },
  {
    id: 'ej-servicios-diagnostico', tipo: 'ejemplo',
    titulo: 'Servicios: diagnosticar antes de cotizar',
    cuerpo: 'En servicios, cotizar sin preguntar es regalar margen. Cuatro preguntas antes del número ' +
            '—qué necesita, para cuándo, qué ha probado, qué presupuesto tiene en mente— cambian tanto ' +
            'el precio que puedes cobrar como la probabilidad de cerrar.',
    claves: ['servicio', 'limpieza', 'reparacion', 'cotizar', 'presupuesto', 'clases'],
    sectores: ['servicios'], etapas: ['*'],
    relacionados: ['precio-tres-numeros'],
    fuente: 'Caso de la base de Emprendo',
    revisado: '2026-08-13'
  },

  /* -------------------------- DIAGNÓSTICO -------------------------- */
  {
    id: 'diag-precio', tipo: 'diagnostico',
    titulo: 'Qué hace falta saber para calcular un precio',
    cuerpo: 'materiales por unidad · minutos de trabajo por unidad · cuánto vale tu hora · empaque y ' +
            'envío · comisión de plataforma si la hay · margen objetivo · costos fijos del mes.',
    claves: ['datos para precio', 'que necesito para calcular'],
    sectores: ['*'], etapas: ['*'],
    formula: 'precio_sugerido',
    relacionados: ['precio-tres-numeros'],
    fuente: 'Campos de entrada de la fórmula de precio de Chispa',
    revisado: '2026-08-13'
  }
];

/* ==================================================================
   ÍNDICE INVERTIDO

   Búsqueda por palabra clave, sin dependencias y sin descarga. Es el
   suelo garantizado: la búsqueda semántica se suma encima cuando el
   usuario la activa, nunca la sustituye.
   ================================================================== */

function normalizar(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Palabras que aparecen en todas partes y no discriminan nada. */
const VACIAS = new Set(['de','la','el','los','las','un','una','y','o','que','en','a','al','del','mi','mis',
  'tu','tus','se','su','sus','por','para','con','sin','es','son','lo','me','te','le','como','mas','muy',
  'cual','cuales','cuanto','cuanta','como','donde','si','no','ya','pero','porque','esto','esta','este']);

function tokens(s) {
  return normalizar(s).split(' ').filter(t => t.length > 2 && !VACIAS.has(t));
}

const INDICE = new Map();     // token -> Set(id)
const POR_ID = new Map();

ENTRADAS.forEach(e => {
  POR_ID.set(e.id, e);
  const campo = [e.titulo, e.cuerpo, ...(e.claves || [])].join(' ');
  new Set(tokens(campo)).forEach(t => {
    if (!INDICE.has(t)) INDICE.set(t, new Set());
    INDICE.get(t).add(e.id);
  });
  // Las claves pesan más: se indexan también como frase completa.
  (e.claves || []).forEach(k => {
    const n = normalizar(k);
    if (!INDICE.has(n)) INDICE.set(n, new Set());
    INDICE.get(n).add(e.id);
  });
});

export function porId(id) { return POR_ID.get(id) || null; }

/** Recupera las entradas relevantes para una consulta.
    filtro: { sector, etapa } para descartar lo que no aplica a este negocio. */
export function buscar(consulta, filtro = {}, limite = 4) {
  const q = normalizar(consulta);
  const ts = tokens(consulta);
  const puntos = new Map();

  const sumar = (id, p) => puntos.set(id, (puntos.get(id) || 0) + p);

  // Coincidencia de frase completa en una clave: la señal más fuerte.
  INDICE.forEach((ids, termino) => {
    if (termino.includes(' ') && q.includes(termino)) ids.forEach(id => sumar(id, 6));
  });
  // Coincidencia por token.
  ts.forEach(t => {
    const ids = INDICE.get(t);
    if (ids) {
      // Un token que aparece en pocas entradas discrimina más.
      const peso = 1 + 2 / Math.max(1, ids.size);
      ids.forEach(id => sumar(id, peso));
    }
  });

  const out = [];
  puntos.forEach((p, id) => {
    const e = POR_ID.get(id);
    if (!e) return;
    // Filtro por sector y etapa: un ejemplo de repostería no ayuda a una imprenta.
    if (filtro.sector && !e.sectores.includes('*') && !e.sectores.includes(filtro.sector)) return;
    if (filtro.etapa && !e.etapas.includes('*') && !e.etapas.includes(filtro.etapa)) return;
    // El ejemplo del propio sector sube: es lo que hace que suene a su negocio.
    const bono = (filtro.sector && e.sectores.includes(filtro.sector)) ? 3 : 0;
    out.push({ entrada: e, puntos: p + bono });
  });

  out.sort((a, b) => b.puntos - a.puntos);
  return out.slice(0, limite);
}

export const META = {
  entradas: ENTRADAS.length,
  tokens: INDICE.size,
  tipos: [...new Set(ENTRADAS.map(e => e.tipo))]
};
