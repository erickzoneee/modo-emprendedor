/* ==========================================================================
   BANCO DE PRUEBAS

   Los ocho casos, siempre con el mismo perfil de emprendimiento, para que la
   comparación entre motores sea justa. Cada caso trae la forma de revisar el
   resultado de manera automática cuando se puede — sobre todo el caso 8, que
   o devuelve JSON válido o no lo devuelve, sin lugar a opinión.
   ========================================================================== */

export const PERFIL_PRUEBA = {
  negocio: 'Lumina 3D',
  producto: 'lámparas de mesa impresas en 3D personalizadas con el nombre del cliente',
  cliente: 'personas que acaban de mudarse y están decorando su primer departamento',
  sector: 'hechoamano',
  etapa: 'starting',
  lugar: 'Guadalajara'
};

/* Datos que el perfil de prueba ya "sabe": sirve para comprobar que el motor
   no vuelve a preguntar lo que ya está decidido. */
export const DATOS_PRUEBA = {
  materiales: 48,
  minutos: 35,
  valorHora: 90,
  empaque: 15,
  comision: 0,
  margen: 55
};

export const CASOS = [
  {
    id: 1,
    titulo: 'Plan inicial para impresión 3D',
    entrada: 'Necesito un plan para empezar con mi negocio',
    mide: 'Si estructura un arranque real sin inventar cifras',
    revisar(r) {
      return [
        ['Nombra el producto del usuario', /l[áa]mpara/i.test(r)],
        ['Propone pasos con orden', /(semana|paso|primero)/i.test(r)],
        ['No inventa cifras de ventas', !/(vender[aá]s|ganar[aá]s|facturar[aá]s)\s+\$?\d/i.test(r)]
      ];
    }
  },
  {
    id: 2,
    titulo: 'Precio con datos incompletos',
    entrada: '¿En cuánto debo vender mi producto?',
    limpiarDatos: ['valorHora'],
    mide: 'Si detecta el hueco y pregunta UNO solo',
    revisar(r) {
      const preguntas = (r.match(/\?/g) || []).length;
      return [
        ['Hace una pregunta', preguntas >= 1],
        ['No hace un interrogatorio', preguntas <= 2],
        ['Pregunta por el dato que falta', /hora|tiempo|trabajo/i.test(r)]
      ];
    }
  },
  {
    id: 3,
    titulo: 'Cliente ideal',
    entrada: '¿Quién es mi cliente ideal?',
    mide: 'Si concreta o se va a generalidades',
    revisar(r) {
      return [
        // Se premia que ADVIERTA contra "todos", no que evite la palabra:
        // la respuesta correcta menciona el error para desmontarlo.
        ['Empuja hacia un grupo concreto', /(grupo concreto|no le hablas a nadie|espec[íi]fic|concreto)/i.test(r)],
        ['Da una estructura utilizable', /(le vendo a|grupo|necesita)/i.test(r)],
        ['Menciona dónde encontrarlos', /(encuentr|lugar|d[óo]nde)/i.test(r)]
      ];
    }
  },
  {
    id: 4,
    titulo: 'Desafío sobre la idea del usuario',
    entrada: 'Dame un desafío para hoy',
    mide: 'Si el reto habla de SU producto y es accionable',
    revisar(r) {
      return [
        ['Cita el producto real', /l[áa]mpara/i.test(r)],
        ['Tiene una cantidad concreta', /\b(uno|dos|tres|cinco|diez|\d+)\b/i.test(r)],
        ['Es accionable hoy', /(habla|manda|publica|pregunta|escribe|anota)/i.test(r)]
      ];
    }
  },
  {
    id: 5,
    titulo: 'Evaluar propuesta de valor',
    entrada: 'Evalúa mi oferta',
    respuestaSlot: { slot: 'oferta', valor: 'Vendo lámparas bonitas de la mejor calidad para todos' },
    mide: 'Si detecta los huecos reales de una oferta mala',
    revisar(r) {
      return [
        ['Detecta que dice "todos"', /todos|concreto|espec[íi]fic/i.test(r)],
        ['Detecta que falta precio o plazo', /(precio|plazo|entrega)/i.test(r)],
        ['Da una nota o un veredicto', /\d{1,3}\s*\/\s*100|criterio/i.test(r)]
      ];
    }
  },
  {
    id: 6,
    titulo: 'Recordar una decisión anterior',
    entrada: '¿Qué habíamos decidido?',
    requiereDecision: true,
    mide: 'Si usa la memoria en vez de empezar de cero',
    revisar(r) {
      return [
        ['Cita una decisión guardada', /precio|\$/i.test(r)],
        ['No vuelve a preguntar lo mismo', !/¿cu[áa]nto (te )?cuesta/i.test(r)],
        ['Ofrece continuidad', /(cambiar|actualiz|contradec)/i.test(r)]
      ];
    }
  },
  {
    id: 7,
    titulo: 'No inventar lo que falta',
    entrada: '¿Cuántos clientes voy a tener el mes que viene?',
    mide: 'Si admite que no lo sabe en vez de inventar un número',
    revisar(r) {
      const inventa = /(tendr[áa]s|vas a tener|conseguir[áa]s)\s+(unos\s+)?\d+/i.test(r);
      return [
        ['No promete un número', !inventa],
        ['Explica qué haría falta para estimarlo', /(dato|hist[óo]rico|depende|necesit)/i.test(r)]
      ];
    }
  },
  {
    id: 8,
    titulo: 'Respuesta en JSON válido',
    entrada: 'Devuélveme un JSON con las claves producto, cliente y precio_sugerido. Solo el JSON, sin texto alrededor.',
    soloModelo: true,
    mide: 'Si respeta un formato estricto, que es lo que permite automatizar',
    revisar(r) {
      const limpio = r.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      let ok = false, claves = false;
      try {
        const o = JSON.parse(limpio);
        ok = true;
        claves = 'producto' in o && 'cliente' in o && 'precio_sugerido' in o;
      } catch (e) {}
      return [
        ['Es JSON parseable', ok],
        ['Trae las tres claves pedidas', claves],
        ['No lleva texto alrededor', !/^[^{[]/.test(limpio)]
      ];
    }
  }
];

/** Puntúa un resultado: devuelve { pasa, total, detalle }. */
export function evaluar(caso, texto) {
  const detalle = caso.revisar(texto || '');
  return {
    pasa: detalle.filter(d => d[1]).length,
    total: detalle.length,
    detalle
  };
}
