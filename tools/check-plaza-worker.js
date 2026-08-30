/* ==========================================================================
   PRUEBAS DEL WORKER DE LA PLAZA

   El Worker es el único trozo de Emprendo que puede filtrar los datos de una
   persona a otra. No basta con leerlo: hay que ejecutarlo.

   Esto monta una base SQLite de verdad en memoria con `node:sqlite`, le pone
   encima un adaptador que imita la interfaz de D1, aplica la migración real y
   ejecuta el Worker real contra ella. No hay mentiras salvo el transporte.

   Comprueba las seis reglas declaradas en la cabecera de src/index.js, y
   además cada uno de los fallos que encontró la auditoría — para que ninguno
   pueda volver sin que esto se ponga rojo.

   Uso:
     node tools/check-plaza-worker.js

   Sale con código 1 si algo no cuadra.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const raiz = path.join(__dirname, '..');
const fallos = [];
const hechas = [];

function ok(nombre) { hechas.push(nombre); }
function mal(nombre, detalle) { fallos.push(nombre + (detalle ? ' — ' + detalle : '')); }

function comprueba(nombre, condicion, detalle) {
  if (condicion) ok(nombre); else mal(nombre, detalle);
}

/* ==================================================================
   EL ADAPTADOR DE D1

   D1 expone prepare().bind().run()/first()/all() y batch(). node:sqlite
   expone prepare().run()/get()/all(). Esto traduce lo uno en lo otro, y
   nada más: si algún día el Worker usa algo de D1 que no esté aquí,
   revienta en la prueba, que es donde tiene que reventar.
   ================================================================== */

function haceD1(db) {
  function prepara(sql) {
    let ligados = [];
    const api = {
      bind(...args) { ligados = args; return api; },
      run() {
        const r = db.prepare(sql).run(...ligados);
        return { meta: { changes: Number(r.changes), last_row_id: r.lastInsertRowid } };
      },
      first() {
        const r = db.prepare(sql).get(...ligados);
        return r === undefined ? null : r;
      },
      all() { return { results: db.prepare(sql).all(...ligados) }; },
      __sql: sql, __args: () => ligados
    };
    return api;
  }

  return {
    prepare: prepara,
    /* D1 revierte el lote entero si una sentencia falla. Es justo de lo que
       depende `denunciar` y `borrarme`, así que la prueba tiene que
       comportarse igual o no probaría nada. */
    batch(stmts) {
      db.exec('BEGIN');
      try {
        const out = stmts.map(s => s.run());
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }
  };
}

function baseNueva() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');   // D1 lo hace por defecto
  const sql = fs.readFileSync(path.join(raiz, 'worker-plaza/migrations/0001_inicial.sql'), 'utf8');
  db.exec(sql);
  return db;
}

/* ==================================================================
   EL ENTORNO
   ================================================================== */

const ORIGEN = 'https://app.emprendo.life';
const PIMIENTA = 'x'.repeat(48);

const correosMandados = [];

function entornoNuevo(db, extra) {
  return Object.assign({
    DB: haceD1(db),
    PIMIENTA,
    ORIGENES: ORIGEN + ',https://erickzoneee.github.io',
    APP_URL: ORIGEN,
    CORREO_DESDE: 'hola@emprendo.life',
    EMAIL: {
      send(m) { correosMandados.push(m); return Promise.resolve(); }
    }
  }, extra || {});
}

function peticion(cuerpo, origen) {
  const texto = JSON.stringify(cuerpo);
  return new Request('https://plaza.emprendo.life/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(texto)),
      'Origin': origen === undefined ? ORIGEN : origen
    },
    body: texto
  });
}

/* ==================================================================
   AYUDAS PARA MONTAR ESCENARIOS
   ================================================================== */

async function llama(worker, env, cuerpo, origen) {
  const res = await worker.fetch(peticion(cuerpo, origen), env);
  let json = null;
  try { json = await res.json(); } catch (e) { json = null; }
  return { status: res.status, ...(json || {}) };
}

/** Crea una cuenta con su puesto abierto y devuelve { sesion, id }. */
async function alta(worker, env, correo, vitrina) {
  correosMandados.length = 0;
  await llama(worker, env, { op: 'entrar', correo });
  const ultimo = correosMandados[correosMandados.length - 1];
  const token = decodeURIComponent(String(ultimo.text).match(/#plaza=([^\s]+)/)[1]);
  const c = await llama(worker, env, { op: 'confirmar', token, edadOk: true });
  if (vitrina) await llama(worker, env, { op: 'publicar', sesion: c.sesion, vitrina });
  return c;
}

const VIT = (n, extra) => Object.assign({
  negocio: n,
  producto: 'lo que hace ' + n,
  idea: 'la idea de ' + n,
  cliente: 'gente que renta departamento',
  problema: 'un problema de ' + n,
  valor: 'lo que gana quien compra a ' + n,
  sector: 'hechoamano',
  etapa: 'starting'
}, extra || {});

/* ==================================================================
   LAS PRUEBAS
   ================================================================== */

async function correr() {
  const mod = await import('file://' + path.join(raiz, 'worker-plaza/src/index.js').replace(/\\/g, '/'));
  const worker = mod.default;

  /* ------------------------------- los topes de la plataforma --

     Node no tiene los límites del runtime de Workers, así que hay cosas que
     pasan aquí y revientan allí. Esta comprobación nació de una: PBKDF2 con
     150.000 iteraciones funcionaba en estas pruebas y en producción devolvía
     «iteration counts above 100000 are not supported», tirando `entrar` y
     `confirmar` enteros — o sea, nadie podía entrar. */
  {
    const fuente = fs.readFileSync(path.join(raiz, 'worker-plaza/src/index.js'), 'utf8');
    const m = fuente.match(/const ITERACIONES\s*=\s*(\d+)/);
    comprueba('las iteraciones de PBKDF2 están declaradas', !!m);
    if (m) {
      comprueba('PBKDF2 no pasa del techo de Workers (100.000)', Number(m[1]) <= 100000,
        'pide ' + m[1] + ', y el runtime lo rechaza por encima de 100000');
      comprueba('PBKDF2 no baja de 50.000', Number(m[1]) >= 50000, 'pide ' + m[1]);
    }
  }

  /* ---------------------------------------------- puerta y origen -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);

    const malOrigen = await llama(worker, env, { op: 'entrar', correo: 'a@b.com' }, 'https://malo.example');
    comprueba('rechaza un origen que no está en la lista', malOrigen.status === 403);

    const desconocida = await llama(worker, env, { op: 'inventada' });
    comprueba('rechaza una operación desconocida', desconocida.status === 400);

    /* El fallo que encontré antes de la auditoría: OPS['constructor'] es una
       función, y Object(cuerpo) devuelve el propio cuerpo — la respuesta era
       un eco del JSON recibido, con la sesión dentro. */
    for (const veneno of ['constructor', '__proto__', 'toString', 'valueOf']) {
      const r = await llama(worker, env, { op: veneno, sesion: 'secreto-de-prueba' });
      comprueba('rechaza op = "' + veneno + '"',
        r.status === 400 && JSON.stringify(r).indexOf('secreto-de-prueba') < 0,
        'devolvió ' + r.status + ': ' + JSON.stringify(r).slice(0, 90));
    }

    const enorme = await worker.fetch(new Request('https://plaza.emprendo.life/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': '900000', 'Origin': ORIGEN },
      body: JSON.stringify({ op: 'entrar', correo: 'a@b.com' })
    }), env);
    comprueba('rechaza un cuerpo demasiado grande', enorme.status === 413);
  }

  /* ------------------------------------- REGLA 1 · el correo no se guarda -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    await alta(worker, env, 'Ana.Perez@Gmail.com', VIT('Ana'));

    const filas = db.prepare('SELECT correo_hash FROM cuenta').all();
    const todo = JSON.stringify(db.prepare('SELECT * FROM cuenta').all()) +
                 JSON.stringify(db.prepare('SELECT * FROM enlace').all()) +
                 JSON.stringify(db.prepare('SELECT * FROM pedido').all());

    comprueba('regla 1 · el correo no aparece en claro en ninguna tabla',
      todo.toLowerCase().indexOf('ana.perez') < 0 && todo.toLowerCase().indexOf('@gmail') < 0);
    comprueba('regla 1 · la huella no es el correo', filas[0].correo_hash.length === 64);

    /* Sin pimienta el Worker tiene que negarse a funcionar, no seguir con una
       huella reversible con un diccionario. */
    const sinP = await llama(worker, entornoNuevo(baseNueva(), { PIMIENTA: '' }),
      { op: 'entrar', correo: 'a@b.com' });
    comprueba('regla 1 · sin PIMIENTA se niega a arrancar', sinP.status === 503,
      'devolvió ' + sinP.status);

    const cortita = await llama(worker, entornoNuevo(baseNueva(), { PIMIENTA: 'corta' }),
      { op: 'entrar', correo: 'a@b.com' });
    comprueba('regla 1 · rechaza una PIMIENTA demasiado corta', cortita.status === 503);
  }

  /* -------------------------------- alias del mismo buzón = misma huella -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    for (const c of ['ana@gmail.com', 'a.n.a@gmail.com', 'ana+plaza@gmail.com', 'ANA@googlemail.com']) {
      correosMandados.length = 0;
      await llama(worker, env, { op: 'entrar', correo: c });
    }
    const cubos = db.prepare('SELECT COUNT(*) AS n FROM pedido').get().n;
    comprueba('las variantes del mismo buzón comparten cubo de límite', cubos === 1,
      'salieron ' + cubos + ' cubos, así que el límite de correos se multiplica por ahí');
  }

  /* ------------------------------------ límite de correos por buzón y hora -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    correosMandados.length = 0;
    for (let i = 0; i < 9; i++) await llama(worker, env, { op: 'entrar', correo: 'v@b.com' });
    comprueba('corta la bomba de correo a los 5 por hora', correosMandados.length === 5,
      'mandó ' + correosMandados.length);
  }

  /* --------------------------------- el enlace va en el fragmento, no en ? -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    correosMandados.length = 0;
    await llama(worker, env, { op: 'entrar', correo: 'f@b.com' });
    const cuerpo = correosMandados[0].text;
    comprueba('el token viaja en el fragmento, no en la query',
      cuerpo.indexOf('/#plaza=') >= 0 && cuerpo.indexOf('?plaza=') < 0, cuerpo.slice(0, 90));
  }

  /* ---------------------- el enlace vuelve al origen desde el que se pidió -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    correosMandados.length = 0;
    await llama(worker, env, { op: 'entrar', correo: 'g@b.com' }, 'https://erickzoneee.github.io');
    comprueba('el enlace vuelve al origen que lo pidió',
      correosMandados[0].text.indexOf('https://erickzoneee.github.io/#plaza=') >= 0,
      correosMandados[0].text.slice(0, 100));
  }

  /* ------------------------------- entrar responde igual pase lo que pase -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db, {
      EMAIL: { send() { return Promise.reject(new Error('E_RECIPIENT_SUPPRESSED')); } }
    });
    const r = await llama(worker, env, { op: 'entrar', correo: 'rebota@b.com' });
    comprueba('si el envío falla, entrar sigue respondiendo lo mismo',
      r.status === 200 && r.ok === true,
      'devolvió ' + r.status + ' — eso es un detector de direcciones válidas');

    const inventado = await llama(worker, entornoNuevo(baseNueva()), { op: 'entrar', correo: 'no-existe@b.com' });
    comprueba('entrar no revela si la cuenta existe', inventado.status === 200 && inventado.ok === true);
  }

  /* ------------------------ el enlace se canjea una sola vez y caduca -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    correosMandados.length = 0;
    await llama(worker, env, { op: 'entrar', correo: 'h@b.com' });
    const token = decodeURIComponent(correosMandados[0].text.match(/#plaza=([^\s]+)/)[1]);

    const una = await llama(worker, env, { op: 'confirmar', token });
    const dos = await llama(worker, env, { op: 'confirmar', token });
    comprueba('el enlace sirve una vez', una.ok === true && !dos.ok, JSON.stringify(dos));

    for (const raro of [null, 123, [], {}, 'x', 'y'.repeat(5000)]) {
      const r = await llama(worker, env, { op: 'vecinos', sesion: raro });
      comprueba('rechaza una sesión con tipo raro (' + typeof raro + ')', r.status === 401,
        'devolvió ' + r.status);
    }
  }

  /* ------------------------------- REGLA 3 · lista blanca en el servidor -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const a = await alta(worker, env, 'lista@b.com');

    /* Campos de más, sector y etapa inventados, y un contacto colado en un
       campo que NO es imprescindible: así se comprueba el filtro sin que la
       vitrina se quede incompleta y no llegue a guardarse. */
    await llama(worker, env, {
      op: 'publicar', sesion: a.sesion,
      vitrina: Object.assign(VIT('Trampa'), {
        precio: 450, costo: 180, lugar: 'Coyoacán', plan: 'mi plan secreto',
        estado: 'oculta', cuenta_id: 'otro-id',
        problema: 'lo que sea, escríbeme a hola@trampa.com',
        sector: 'inventado', etapa: 'inventada'
      })
    });

    const v = db.prepare('SELECT * FROM vitrina').get();
    const dump = JSON.stringify(v || {});
    comprueba('regla 3 · la vitrina se guardó', !!v, 'no se guardó ninguna fila');
    comprueba('regla 3 · los campos de más no se guardan',
      dump.indexOf('450') < 0 && dump.indexOf('Coyoacán') < 0 && dump.indexOf('plan secreto') < 0, dump);
    comprueba('regla 3 · el contacto escrito a mano se cae', v && v.problema === '', v && v.problema);
    comprueba('regla 3 · un sector inventado cae en "otro"', v && v.sector === 'otro', v && v.sector);
    comprueba('regla 3 · una etapa inventada cae en "idea"', v && v.etapa === 'idea', v && v.etapa);
    comprueba('regla 3 · no se puede fijar el estado desde el cliente', v && v.estado === 'publicada');

    /* Y si el contacto va en un campo imprescindible, la vitrina entera se
       queda sin publicar: mejor no abrir el puesto que abrirlo con el
       teléfono de alguien dentro. */
    const b = await alta(worker, env, 'lista2@b.com');
    const r = await llama(worker, env, {
      op: 'publicar', sesion: b.sesion,
      vitrina: VIT('Otra', { cliente: 'gente normal, escríbeme a hola@trampa.com' })
    });
    comprueba('regla 3 · un contacto en un campo obligatorio impide publicar',
      r.status === 400, JSON.stringify(r));
  }

  /* ============================================================
     REGLA 4 · nada de texto libre antes de la aceptación mutua
     La prueba más importante de todas.
     ============================================================ */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana@b.com', VIT('Ana'));
    const beto = await alta(worker, env, 'beto@b.com', VIT('Beto', { sector: 'digital' }));

    const SECRETO = 'ESTO-LO-ESCRIBIO-ANA-Y-NADIE-DEBE-VERLO-TODAVIA';
    await llama(worker, env, {
      op: 'veo-valor', sesion: ana.sesion, para: beto.id,
      intencion: 'probar', motivo: 'puedeProbarte', mensaje: SECRETO
    });

    const recibidos = await llama(worker, env, { op: 'recibidos', sesion: beto.sesion });
    comprueba('regla 4 · llega el aviso', (recibidos.recibidos || []).length === 1);
    comprueba('regla 4 · NO llega el mensaje antes de aceptar',
      JSON.stringify(recibidos).indexOf(SECRETO) < 0,
      'el mensaje se filtró en recibidos');
    comprueba('regla 4 · sí llega la intención y el motivo',
      recibidos.recibidos[0].intencion === 'probar' && recibidos.recibidos[0].motivo === 'puedeProbarte');

    /* Y no hay ninguna otra puerta por la que salga. */
    const convAntes = await llama(worker, env, { op: 'conversaciones', sesion: beto.sesion });
    comprueba('regla 4 · no hay conversación antes de aceptar',
      (convAntes.conversaciones || []).length === 0);

    /* La vitrina que ve el receptor está CONGELADA: si Ana la reescribe
       después, Beto sigue viendo la del momento en que se acercó. */
    await llama(worker, env, {
      op: 'publicar', sesion: ana.sesion,
      vitrina: VIT('Ana', { negocio: 'INSULTO-REESCRITO-DESPUES' })
    });
    const tras = await llama(worker, env, { op: 'recibidos', sesion: beto.sesion });
    comprueba('regla 4 · la vitrina del emisor va congelada',
      JSON.stringify(tras).indexOf('INSULTO-REESCRITO-DESPUES') < 0,
      'la vitrina en vivo es un canal de texto libre dirigido');

    /* Al aceptar, y solo entonces, aparece el mensaje. */
    const resp = await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: ana.id, acepto: true });
    comprueba('al aceptar se abre la conversación', resp.aceptado === true && !!resp.conversacion);

    const msgs = await llama(worker, env, { op: 'mensajes', sesion: beto.sesion, conversacion: resp.conversacion });
    comprueba('regla 4 · el mensaje aparece al aceptar',
      JSON.stringify(msgs).indexOf(SECRETO) >= 0);
    comprueba('el primer mensaje se inserta una sola vez',
      (msgs.mensajes || []).filter(m => m.texto === SECRETO).length === 1,
      'salieron ' + (msgs.mensajes || []).length + ' mensajes');
  }

  /* ------------------------- bloquear retira el consentimiento vigente -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana2@b.com', VIT('Ana'));
    const beto = await alta(worker, env, 'beto2@b.com', VIT('Beto', { sector: 'digital' }));

    const SECRETO = 'MENSAJE-QUE-YA-NO-QUIERO-QUE-LLEGUE';
    await llama(worker, env, {
      op: 'veo-valor', sesion: ana.sesion, para: beto.id,
      intencion: 'probar', motivo: 'puedeProbarte', mensaje: SECRETO
    });
    await llama(worker, env, { op: 'bloquear', sesion: ana.sesion, sobre: beto.id });

    const resp = await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: ana.id, acepto: true });
    comprueba('tras bloquear, el otro ya no puede aceptar', resp.status === 404,
      'devolvió ' + JSON.stringify(resp) + ' — el texto libre cruzó sin consentimiento vigente');

    const quedan = db.prepare("SELECT COUNT(*) AS n FROM valor WHERE estado = 'enviado'").get().n;
    comprueba('bloquear retira lo que estaba pendiente', quedan === 0, 'quedan ' + quedan);
  }

  /* ------------------------------------ reenviar no resucita lo aceptado -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana3@b.com', VIT('Ana'));
    const beto = await alta(worker, env, 'beto3@b.com', VIT('Beto', { sector: 'digital' }));

    const base = { op: 'veo-valor', sesion: ana.sesion, para: beto.id, intencion: 'probar', motivo: 'puedeProbarte' };
    await llama(worker, env, Object.assign({}, base, { mensaje: 'primero' }));
    await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: ana.id, acepto: true });
    await llama(worker, env, Object.assign({}, base, { mensaje: 'INSISTIENDO-OTRA-VEZ' }));

    const rec = await llama(worker, env, { op: 'recibidos', sesion: beto.sesion });
    comprueba('reenviar tras aceptar no vuelve a la bandeja del otro',
      (rec.recibidos || []).length === 0, 'vector de insistencia abierto');

    /* Y tampoco tras declinar. */
    const cris = await alta(worker, env, 'cris3@b.com', VIT('Cris', { sector: 'comida' }));
    await llama(worker, env, { op: 'veo-valor', sesion: cris.sesion, para: beto.id, intencion: 'probar', motivo: 'puedeProbarte', mensaje: 'hola' });
    await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: cris.id, acepto: false });
    await llama(worker, env, { op: 'veo-valor', sesion: cris.sesion, para: beto.id, intencion: 'probar', motivo: 'puedeProbarte', mensaje: 'otra vez' });
    const rec2 = await llama(worker, env, { op: 'recibidos', sesion: beto.sesion });
    comprueba('reenviar tras declinar tampoco vuelve', (rec2.recibidos || []).length === 0);
  }

  /* --------------------- conversaciones no enseña vitrinas que ya no están -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana4@b.com', VIT('AnaVisible'));
    const beto = await alta(worker, env, 'beto4@b.com', VIT('Beto', { sector: 'digital' }));
    await llama(worker, env, { op: 'veo-valor', sesion: ana.sesion, para: beto.id, intencion: 'probar', motivo: 'puedeProbarte', mensaje: 'hola' });
    await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: ana.id, acepto: true });

    const antes = await llama(worker, env, { op: 'conversaciones', sesion: beto.sesion });
    comprueba('la conversación enseña la vitrina mientras está publicada',
      JSON.stringify(antes).indexOf('AnaVisible') >= 0);

    await llama(worker, env, { op: 'retirar', sesion: ana.sesion });
    const tras = await llama(worker, env, { op: 'conversaciones', sesion: beto.sesion });
    comprueba('al retirar el puesto, deja de enseñarse en la conversación',
      JSON.stringify(tras).indexOf('AnaVisible') < 0,
      'la vitrina retirada se sigue sirviendo');
    comprueba('pero la conversación no desaparece', (tras.conversaciones || []).length === 1);
  }

  /* ------------------------------- vecinos respeta bloqueos y estados -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana5@b.com', VIT('Ana'));
    const beto = await alta(worker, env, 'beto5@b.com', VIT('BetoVecino', { sector: 'digital' }));

    const v1 = await llama(worker, env, { op: 'vecinos', sesion: ana.sesion });
    comprueba('vecinos devuelve al otro', JSON.stringify(v1).indexOf('BetoVecino') >= 0);
    comprueba('vecinos nunca se devuelve a uno mismo',
      (v1.vecinos || []).every(v => v.id !== ana.id));

    await llama(worker, env, { op: 'bloquear', sesion: beto.sesion, sobre: ana.id });
    const v2 = await llama(worker, env, { op: 'vecinos', sesion: ana.sesion });
    comprueba('el bloqueo es simétrico en vecinos',
      JSON.stringify(v2).indexOf('BetoVecino') < 0,
      'quien te bloqueó sigue apareciéndote');
  }

  /* ---------------------------- hace falta puesto propio para acercarse -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const sinPuesto = await alta(worker, env, 'mudo@b.com');
    const beto = await alta(worker, env, 'beto6@b.com', VIT('Beto', { sector: 'digital' }));
    const r = await llama(worker, env, {
      op: 'veo-valor', sesion: sinPuesto.sesion, para: beto.id,
      intencion: 'probar', motivo: 'puedeProbarte', mensaje: 'hola'
    });
    comprueba('sin puesto propio no se puede acercar a nadie', r.status === 400, JSON.stringify(r));
  }

  /* ------------------------- no se puede leer una conversación ajena -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana7@b.com', VIT('Ana'));
    const beto = await alta(worker, env, 'beto7@b.com', VIT('Beto', { sector: 'digital' }));
    const cris = await alta(worker, env, 'cris7@b.com', VIT('Cris', { sector: 'comida' }));

    await llama(worker, env, { op: 'veo-valor', sesion: ana.sesion, para: beto.id, intencion: 'probar', motivo: 'puedeProbarte', mensaje: 'privado entre ana y beto' });
    const r = await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: ana.id, acepto: true });

    const fisgon = await llama(worker, env, { op: 'mensajes', sesion: cris.sesion, conversacion: r.conversacion });
    comprueba('un tercero no puede leer una conversación pasando su id',
      fisgon.status === 404, JSON.stringify(fisgon).slice(0, 120));
  }

  /* ============================================================
     REGLA 6 · borrar borra
     ============================================================ */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana8@b.com', VIT('AnaBorrable'));
    const beto = await alta(worker, env, 'beto8@b.com', VIT('Beto', { sector: 'digital' }));

    await llama(worker, env, { op: 'veo-valor', sesion: ana.sesion, para: beto.id, intencion: 'probar', motivo: 'puedeProbarte', mensaje: 'HUELLA-DE-ANA' });
    const r = await llama(worker, env, { op: 'responder', sesion: beto.sesion, de: ana.id, acepto: true });
    await llama(worker, env, { op: 'mensajes', sesion: ana.sesion, conversacion: r.conversacion, texto: 'OTRA-HUELLA-DE-ANA' });
    await llama(worker, env, { op: 'denunciar', sesion: ana.sesion, sobre: beto.id, motivo: 'spam', nota: 'NOTA-QUE-ESCRIBIO-ANA' });

    const huella = db.prepare('SELECT correo_hash FROM cuenta WHERE id = ?').get(ana.id).correo_hash;

    await llama(worker, env, { op: 'borrarme', sesion: ana.sesion });

    const tablas = ['cuenta', 'vitrina', 'valor', 'conversacion', 'mensaje', 'denuncia', 'bloqueo', 'enlace', 'sesion', 'pedido'];
    const restos = [];
    for (const t of tablas) {
      const filas = db.prepare('SELECT * FROM ' + t).all();
      const dump = JSON.stringify(filas);
      if (dump.indexOf(ana.id) >= 0) restos.push(t + ' (su id)');
      if (dump.indexOf(huella) >= 0) restos.push(t + ' (la huella de su correo)');
      if (dump.indexOf('AnaBorrable') >= 0) restos.push(t + ' (su vitrina)');
      if (dump.indexOf('HUELLA-DE-ANA') >= 0) restos.push(t + ' (su mensaje)');
      if (dump.indexOf('NOTA-QUE-ESCRIBIO-ANA') >= 0) restos.push(t + ' (su denuncia)');
    }
    comprueba('regla 6 · no queda ni un rastro de quien se borra',
      restos.length === 0, 'quedó en: ' + restos.join(', '));

    const sesionMuerta = await llama(worker, env, { op: 'vecinos', sesion: ana.sesion });
    comprueba('regla 6 · su sesión deja de valer', sesionMuerta.status === 401);
  }

  /* ------------------------------------------- cuenta suspendida -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana9@b.com', VIT('Ana'));
    db.prepare("UPDATE cuenta SET estado = 'suspendida' WHERE id = ?").run(ana.id);
    const r = await llama(worker, env, { op: 'vecinos', sesion: ana.sesion });
    comprueba('una cuenta suspendida no puede seguir usando su sesión', r.status === 401);
  }

  /* --------------------------- la denuncia no se puede repetir mil veces -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana10@b.com', VIT('Ana'));
    const beto = await alta(worker, env, 'beto10@b.com', VIT('Beto', { sector: 'digital' }));
    for (let i = 0; i < 20; i++) {
      await llama(worker, env, { op: 'denunciar', sesion: ana.sesion, sobre: beto.id, motivo: 'spam', nota: 'x' + i });
    }
    const n = db.prepare('SELECT COUNT(*) AS n FROM denuncia').get().n;
    comprueba('veinte denuncias sobre la misma persona son una fila', n === 1, 'salieron ' + n);

    const bloq = db.prepare('SELECT COUNT(*) AS n FROM bloqueo').get().n;
    comprueba('y el bloqueo se aplicó igual', bloq === 1, 'salieron ' + bloq);

    await llama(worker, env, { op: 'denunciar', sesion: ana.sesion, sobre: beto.id, motivo: 'spam', nota: 'llámame al 55 1234 5678' });
    const nota = db.prepare('SELECT nota FROM denuncia').get().nota;
    comprueba('la nota de una denuncia también filtra el contacto', nota === '', nota);
  }

  /* --------------------------------- el campo `sobre` tiene tope -- */
  {
    const db = baseNueva();
    const env = entornoNuevo(db);
    const ana = await alta(worker, env, 'ana11@b.com', VIT('Ana'));
    await llama(worker, env, { op: 'bloquear', sesion: ana.sesion, sobre: 'z'.repeat(500000) });
    const fila = db.prepare('SELECT sobre_id FROM bloqueo').get();
    comprueba('el campo `sobre` está recortado', !fila || fila.sobre_id.length <= 64,
      'longitud ' + (fila ? fila.sobre_id.length : 0));
  }
}

/* ==================================================================
   EJECUCIÓN
   ================================================================== */

correr().then(() => {
  if (fallos.length) {
    console.error('\n✗ Worker de la Plaza: ' + fallos.length + ' problema(s) de ' +
      (fallos.length + hechas.length) + ' comprobaciones\n');
    fallos.forEach(f => console.error('  · ' + f));
    process.exit(1);
  }
  console.log('✓ Worker de la Plaza: ' + hechas.length + ' comprobaciones, todas en verde.');
  console.log('  Las seis reglas se cumplen ejecutando el código, no leyéndolo.');
}).catch(e => {
  console.error('✗ las pruebas no llegaron a terminar: ' + e.message);
  console.error(e.stack);
  process.exit(1);
});
