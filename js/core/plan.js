/* ==========================================================================
   EL PLAN DE LA SEMANA — el motor

   Elige tres tareas del catálogo (js/data/plan-semanal.js), las congela
   durante la semana y calcula sola cuáles ya están hechas.

   POR QUÉ SE CONGELA LA ELECCIÓN Y NO EL ESTADO

   Si el plan se recalculara en cada pintado, cambiaría bajo los pies del
   usuario: termina una lección, vuelve a la Ruta y su semana ya es otra. Eso
   convierte un plan en un feed, y un feed no se puede cumplir.

   Así que se guardan solo los TRES IDS, con la semana en la que se
   eligieron. Si algo ya está hecho, eso se calcula en vivo cada vez —nadie
   marca nada a mano— pero cuáles son las tres no cambia hasta el lunes.

   La única excepción es una tarea que dejó de aplicar: si alguien registró
   otra idea o cambió de etapa, una tarea que ya no tiene sentido se sustituye
   en el sitio. Dejarla ahí sería peor que moverla.

   SE VE, PERO SOLO CON IMPULSO

   Es un beneficio de pago. Quien no lo tiene ve la invitación pequeña en su
   sitio, y nada más — no se enseña el plan a medias ni tapado, porque enseñar
   algo tapado es enseñarlo. Lo que sí ve todo el mundo, gratis y como
   siempre, es la Ruta: el plan ordena lo que ya está ahí, no lo sustituye.

   DÓNDE VIVE
   `state.plan = { week, ids: [], generadoAt }`. En el Store y no en el
   emprendimiento porque el ritmo semanal es de la persona, igual que la
   racha: quien cambia de negocio no empieza la semana de cero.
   ========================================================================== */
(function (w) {
  'use strict';

  var CUANTAS = 3;

  function catalogo() {
    return (w.PLAN_SEMANAL && w.PLAN_SEMANAL.TAREAS) || [];
  }

  /* ==================================================================
     EL CONTEXTO

     Todo lo que las tareas pueden preguntar, resuelto UNA vez. Las
     funciones del catálogo no tocan Store ni Venture directamente: reciben
     esto. Así el verificador puede ejecutarlas con un contexto de mentira y
     probar las 25 sin montar la app entera.
     ================================================================== */

  function contexto() {
    var s = w.Store.state;
    var t = w.Venture.terms();
    var v = w.Venture.active();
    var C = w.CONFIG;

    var estados = w.Engine.pathState();
    var siguiente = null;
    for (var i = 0; i < estados.length; i++) {
      if (estados[i].state === 'active' || estados[i].state === 'unlocked') {
        siguiente = estados[i].node;
        break;
      }
    }

    var seccionesVacias = C.DOSSIER.filter(function (sec) { return !s.dossier[sec.key]; });

    /* Cuántas lecciones terminó en los últimos siete días. `stats.days` no
       sirve —cuenta días con actividad, no lecciones—, así que se cuentan
       las marcas de tiempo de las propias lecciones. */
    var hace7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var estaSemana = 0, hechas = 0;
    for (var id in s.lessons) {
      if (!Object.prototype.hasOwnProperty.call(s.lessons, id)) continue;
      if (!s.lessons[id] || !s.lessons[id].done) continue;
      hechas++;
      if ((s.lessons[id].at || 0) >= hace7) estaSemana++;
    }

    var precio = Number(t.precio) || 0;
    var costo = Number(t.costo) || 0;

    return {
      t: t,
      etapa: t.etapa || '',
      sector: t.sector || 'otro',
      minutos: Number(t.minutos) || 15,

      siguiente: siguiente,
      leccionesHechas: hechas,
      leccionesEstaSemana: estaSemana,

      tieneOferta: !!t.tiene.producto,
      tienePrecio: precio > 0,
      tieneCosto: costo > 0,
      /* Menos de 30% de margen sobre el precio. El número no es sagrado: es
         el punto por debajo del cual una subida del proveedor se come la
         utilidad entera, que es lo que la tarea viene a avisar. */
      margenFlojo: precio > 0 && costo > 0 && ((precio - costo) / precio) < 0.3,

      perfilPct: w.Venture.completeness().pct,
      seccionesVacias: seccionesVacias,
      semanasSim: (s.sim && s.sim.week) ? s.sim.week : 0,
      puestoAbierto: !!(w.Plaza && w.Plaza.abierta && w.Plaza.abierta()),
      diasSinRespaldo: w.Store.daysSinceBackup(),

      /* Las tres preguntas que hacen las tareas sobre el estado. */
      hechoNodo: function (id) { return w.Engine.isDone(id); },
      dossier: function (clave) { return !!s.dossier[clave]; },
      decidio: function (clave) {
        return !!(v.decisions && v.decisions[clave] && v.decisions[clave].value);
      }
    };
  }

  /* ==================================================================
     ELEGIR
     ================================================================== */

  /** Las que aplican ahora, ordenadas por peso y sin repetir familia.

      El reparto por familia es lo que evita una semana de tres tareas de
      números. Se hace en dos pasadas: primero una por familia, y solo si con
      eso no salen tres, se rellena con lo que quede. Al revés —tomar las
      tres de más peso y luego mirar— daba semanas enteras de lo mismo,
      porque los pesos altos se agrupan por etapa. */
  function candidatas(ctx) {
    var aplican = catalogo().filter(function (tarea) {
      try { return !!tarea.cuando(ctx); } catch (e) { return false; }
    });

    aplican.sort(function (a, b) { return b.peso - a.peso; });

    var elegidas = [], familias = {};
    aplican.forEach(function (tarea) {
      if (elegidas.length >= CUANTAS) return;
      if (familias[tarea.familia]) return;
      familias[tarea.familia] = true;
      elegidas.push(tarea);
    });

    aplican.forEach(function (tarea) {
      if (elegidas.length >= CUANTAS) return;
      if (elegidas.indexOf(tarea) >= 0) return;
      elegidas.push(tarea);
    });

    return elegidas;
  }

  function porId(id) {
    var lista = catalogo();
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  /* ==================================================================
     LA SEMANA GUARDADA
     ================================================================== */

  function bolsa() {
    var s = w.Store.state;
    if (!s.plan || typeof s.plan !== 'object') s.plan = { week: null, ids: [], generadoAt: 0 };
    if (!Array.isArray(s.plan.ids)) s.plan.ids = [];
    return s.plan;
  }

  /**
   * El plan de esta semana. Devuelve `null` si no hay Impulso: es la única
   * puerta, y está aquí y no en la pantalla para que no haya dos sitios que
   * puedan decir cosas distintas.
   *
   * @returns {{ semana: string, tareas: Array, hechas: number }|null}
   */
  function semana() {
    if (!w.Impulso || !w.Impulso.activo()) return null;
    if (!catalogo().length) return null;

    var ctx = contexto();
    var b = bolsa();
    var wk = w.Store.weekKey();

    var nuevaSemana = b.week !== wk;
    var ids = nuevaSemana ? [] : b.ids.slice();

    /* Se cae una tarea que dejó de aplicar. Pasa cuando alguien registra otra
       idea o cambia de etapa a mitad de semana: la tarea se queda hablando de
       un negocio que ya no existe. */
    ids = ids.filter(function (id) {
      var tarea = porId(id);
      if (!tarea) return false;
      try { return !!tarea.cuando(ctx); } catch (e) { return false; }
    });

    if (ids.length < CUANTAS) {
      candidatas(ctx).forEach(function (tarea) {
        if (ids.length >= CUANTAS) return;
        if (ids.indexOf(tarea.id) >= 0) return;
        ids.push(tarea.id);
      });
    }

    if (nuevaSemana || ids.join(',') !== b.ids.join(',')) {
      w.Store.set(function (st) {
        st.plan = { week: wk, ids: ids, generadoAt: Date.now() };
      }, 'plan');
    }

    var tareas = ids.map(function (id) {
      var tarea = porId(id);
      if (!tarea) return null;
      var hecho = false;
      try { hecho = !!tarea.hecho(ctx); } catch (e) { hecho = false; }
      return {
        id: tarea.id,
        familia: tarea.familia,
        titulo: seguro(tarea.titulo, ctx, ''),
        porque: seguro(tarea.porque, ctx, ''),
        hecho: hecho,
        ir: tarea.ir || { pantalla: 'home' }
      };
    }).filter(Boolean);

    return {
      semana: wk,
      tareas: tareas,
      hechas: tareas.filter(function (x) { return x.hecho; }).length
    };
  }

  /** Ejecuta una función del catálogo sin que un fallo suyo tumbe la
      pantalla. Una plantilla que se pase con un dato que no existe no puede
      dejar a alguien sin su plan. */
  function seguro(fn, ctx, reserva) {
    try {
      var v = fn(ctx);
      return (typeof v === 'string' && v) ? v : reserva;
    } catch (e) {
      console.warn('[plan] tarea rota:', e);
      return reserva;
    }
  }

  /** Cuántas van, para pintar la barra sin volver a calcular el plan. */
  function progreso(p) {
    if (!p || !p.tareas.length) return 0;
    return Math.round((p.hechas / p.tareas.length) * 100);
  }

  w.Plan = {
    semana: semana,
    progreso: progreso,
    // para tools/check-plan.js: el catálogo se ejecuta con un contexto falso
    __contexto: contexto,
    __candidatas: candidatas,
    CUANTAS: CUANTAS
  };
})(window);
