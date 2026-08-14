/* ==========================================================================
   Laboratorio — cableado de la interfaz
   ========================================================================== */

import { diagnose, probeMemory, isIOS } from './device.js';
import { buscar, META } from './kb.js';
import {
  cargarMemoria, guardarMemoria, borrarMemoria, recordarDecision,
  responder, construirPrompt, META_ENGINE
} from './engine.js';
import * as LM from './local-model.js';
import { CASOS, PERFIL_PRUEBA, DATOS_PRUEBA, evaluar } from './bench.js';

const $ = (s) => document.querySelector(s);
const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; };

let memoria = cargarMemoria();
let pendiente = null;      // { intencion, slot } cuando el motor está preguntando
let diagnostico = null;

/* Negrita **así** y saltos de línea, sin meter HTML del usuario. */
function rich(node, texto) {
  node.textContent = '';
  String(texto).split('\n').forEach((linea, i) => {
    if (i) node.appendChild(document.createElement('br'));
    linea.split(/(\*\*[^*]+\*\*)/).forEach(p => {
      if (/^\*\*[^*]+\*\*$/.test(p)) node.appendChild(el('b', null, p.slice(2, -2)));
      else if (p) node.appendChild(document.createTextNode(p));
    });
  });
}

/* ==================================================================
   1 · DIAGNÓSTICO
   ================================================================== */

function kv(k, v) {
  const r = el('div', 'kv');
  r.appendChild(el('span', 'kv__k', k));
  r.appendChild(el('span', 'kv__v', v == null ? '—' : String(v)));
  return r;
}

async function pintarDiagnostico() {
  const out = $('#device-out');
  diagnostico = await diagnose();
  const d = diagnostico;
  out.textContent = '';

  const v = el('div', 'verdict ' + (d.puedeGenerativo ? 'verdict--go' : 'verdict--stop'));
  rich(v, d.puedeGenerativo
    ? `**Este equipo sí puede ejecutar un modelo local.** Admite hasta unos ${d.modeloMaximoMB} MB de modelo.`
    : '**Este equipo no puede ejecutar un modelo generativo local.**');
  out.appendChild(v);

  d.motivos.forEach(m => {
    const n = el('div', 'verdict verdict--' + (m.nivel === 'stop' ? 'stop' : 'warn'));
    n.textContent = m.texto;
    out.appendChild(n);
  });

  const emb = el('div', 'verdict verdict--go');
  rich(emb, '**La búsqueda semántica local sí funciona aquí.** Un modelo de embeddings pesa unos 25 MB, ' +
    'corre en WASM sin WebGPU y cabe en cualquier equipo, incluido el iPhone.');
  out.appendChild(emb);

  const t = el('div');
  t.appendChild(kv('Sistema', d.os));
  t.appendChild(kv('Navegador', d.navegador));
  t.appendChild(kv('RAM declarada', d.ram ? d.ram + ' GB' : 'no la expone'));
  t.appendChild(kv('Núcleos', d.nucleos));
  t.appendChild(kv('WebGPU', d.gpu.disponible ? 'sí' : 'no'));
  if (d.gpu.disponible) {
    t.appendChild(kv('GPU', [d.gpu.vendor, d.gpu.arquitectura].filter(x => x && x !== '—').join(' · ') || 'sin identificar'));
    t.appendChild(kv('Buffer máximo', d.gpu.maxBufferMB ? d.gpu.maxBufferMB + ' MB' : '—'));
    t.appendChild(kv('Buffer de almacenamiento', d.gpu.maxStorageBufferMB ? d.gpu.maxStorageBufferMB + ' MB' : '—'));
    t.appendChild(kv('shader-f16', d.gpu.f16 ? 'sí' : 'no'));
  } else if (d.gpu.motivo) {
    t.appendChild(kv('Motivo', d.gpu.motivo));
  }
  if (d.almacenamiento) {
    t.appendChild(kv('Almacenamiento usado', d.almacenamiento.usadoMB + ' MB'));
    t.appendChild(kv('Cuota del sitio', d.almacenamiento.cuotaMB + ' MB'));
    t.appendChild(kv('Libre para modelos', d.almacenamiento.libreMB + ' MB'));
  } else {
    t.appendChild(kv('Almacenamiento', 'el navegador no lo informa'));
  }
  out.appendChild(t);
}

$('#mem-run').addEventListener('click', async () => {
  const btn = $('#mem-run');
  const out = $('#mem-out');
  const tope = Math.max(64, Math.min(4096, parseInt($('#mem-top').value, 10) || 512));
  btn.disabled = true;
  out.textContent = 'Reservando…';
  const r = await probeMemory(tope, (mb) => { out.textContent = 'Reservados ' + mb + ' MB…'; });
  btn.disabled = false;
  out.textContent = r.corto
    ? `El navegador cortó en ${r.alcanzadoMB} MB. Ese es el techo real de esta pestaña.\nError: ${r.error}`
    : `Llegó a ${r.alcanzadoMB} MB sin romperse (era el tope que pediste).\n` +
      (isIOS() ? 'Ojo: en iOS el límite duro cierra la pestaña sin lanzar error, así que si sigues vivo es que no lo alcanzaste.' : '');
});

/* ==================================================================
   2 · MOTOR
   ================================================================== */

const CAMPOS = { negocio: '#p-negocio', producto: '#p-producto', cliente: '#p-cliente', sector: '#p-sector', etapa: '#p-etapa', lugar: '#p-lugar' };

function perfilAlFormulario() {
  Object.entries(CAMPOS).forEach(([k, sel]) => { $(sel).value = memoria.perfil[k] || ''; });
  pintarMemoria();
}
function formularioAlPerfil() {
  Object.entries(CAMPOS).forEach(([k, sel]) => { memoria.perfil[k] = $(sel).value.trim(); });
  guardarMemoria(memoria);
  pintarMemoria();
}
Object.values(CAMPOS).forEach(sel => $(sel).addEventListener('change', formularioAlPerfil));

function pintarMemoria() {
  const datos = Object.entries(memoria.datos);
  const dec = Object.entries(memoria.decisiones);
  const L = [];
  L.push(`Datos guardados: ${datos.length ? datos.map(([k, v]) => k + '=' + v).join(', ') : 'ninguno'}`);
  L.push(`Decisiones: ${dec.length ? dec.map(([k, v]) => k + '=' + v.valor).join(', ') : 'ninguna'}`);
  $('#p-memoria').textContent = L.join('\n');
}

$('#p-demo').addEventListener('click', () => {
  memoria.perfil = { ...PERFIL_PRUEBA };
  memoria.datos = { ...DATOS_PRUEBA };
  guardarMemoria(memoria);
  perfilAlFormulario();
  push('bot', 'Perfil de prueba cargado: ' + PERFIL_PRUEBA.negocio + '. Pregúntame algo.');
});

$('#p-clear').addEventListener('click', () => {
  memoria = borrarMemoria();
  pendiente = null;
  perfilAlFormulario();
  $('#chat').textContent = '';
  push('bot', 'Memoria del laboratorio borrada. El progreso de Emprendo no se tocó: vive en otra clave.');
});

function push(quien, texto, meta) {
  const m = el('div', 'msg msg--' + quien);
  rich(m, texto);
  if (meta) {
    const s = el('span', 'msg__meta', meta);
    m.appendChild(s);
  }
  $('#chat').appendChild(m);
  $('#chat').scrollTop = $('#chat').scrollHeight;
  return m;
}

function pintarSugerencias(lista) {
  const q = $('#quick');
  q.textContent = '';
  lista.forEach(txt => {
    const b = el('button', null, txt);
    b.addEventListener('click', () => enviar(txt));
    q.appendChild(b);
  });
}

const SUGERENCIAS = ['¿En cuánto debo vender mi producto?', '¿Quién es mi cliente ideal?',
  'Dame un desafío para hoy', 'Necesito un plan', '¿Qué habíamos decidido?', 'Evalúa mi oferta'];

async function enviar(texto) {
  const t = (texto ?? $('#chat-in').value).trim();
  if (!t) return;
  $('#chat-in').value = '';
  push('me', t);

  const r = responder(t, memoria, pendiente);
  pendiente = r.pregunta ? { intencion: r.intencion, slot: r.pregunta.slot } : null;
  guardarMemoria(memoria);
  pintarMemoria();

  const meta = `nivel ${r.nivel} · ${r.tipo} · ${r.ms} ms · ` +
    (r.fuentes.length ? 'fuentes: ' + r.fuentes.map(f => f.id).join(', ') : 'sin fuentes') +
    ' · sin modelo';
  const burbuja = push('bot', r.texto, meta);

  /* Nivel 7: solo si el motor no lo resolvió con una fórmula o una pregunta. */
  const quiereModelo = $('#usar-modelo').checked && LM.estaCargado();
  if (quiereModelo && r.nivel >= 6) {
    const m2 = push('bot', '…');
    try {
      const prompt = construirPrompt(t, memoria, r.fuentes);
      let acc = '';
      const g = await LM.generar(prompt, { onToken: (d) => { acc += d; rich(m2, acc); } });
      rich(m2, g.texto || acc);
      m2.appendChild(el('span', 'msg__meta',
        `nivel 7 · modelo local ${LM.modeloActual()} · ${g.ms} ms · ${g.tokensPorSegundo} tok/s`));
    } catch (e) {
      rich(m2, '⚠️ El modelo local falló: ' + e.message + '\nSe queda la respuesta del motor, que ya está arriba.');
    }
  }
}

$('#chat-send').addEventListener('click', () => enviar());
$('#chat-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') enviar(); });

/* ==================================================================
   3 · CONOCIMIENTO
   ================================================================== */

function buscarKB() {
  const q = $('#kb-q').value.trim();
  const out = $('#kb-out');
  out.textContent = '';
  if (!q) return;
  const t0 = performance.now();
  const res = buscar(q, { sector: memoria.perfil.sector || null, etapa: memoria.perfil.etapa || null }, 5);
  const ms = Math.round(performance.now() - t0);
  if (!res.length) { out.appendChild(el('p', 'muted', 'Nada relevante. El motor lo diría así en vez de inventar.')); return; }
  res.forEach(({ entrada, puntos }) => {
    const n = el('div', 'item');
    const t = el('div', 'item__t');
    t.appendChild(el('span', 'tag', entrada.tipo));
    t.appendChild(document.createTextNode(entrada.titulo));
    n.appendChild(t);
    n.appendChild(el('div', 'item__b', entrada.cuerpo));
    n.appendChild(el('div', 'mono small', `id: ${entrada.id} · puntos: ${puntos.toFixed(1)} · revisado: ${entrada.revisado} · fuente: ${entrada.fuente}`));
    out.appendChild(n);
  });
  $('#kb-meta').textContent = `${META.entradas} entradas · ${META.tokens} términos indexados · ${ms} ms · tipos: ${META.tipos.join(', ')}`;
}
$('#kb-go').addEventListener('click', buscarKB);
$('#kb-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') buscarKB(); });

/* ==================================================================
   4 · MODELO LOCAL
   ================================================================== */

$('#cat-load').addEventListener('click', async () => {
  const btn = $('#cat-load');
  const out = $('#cat-out');
  btn.disabled = true;
  out.textContent = '';
  out.appendChild(el('p', 'muted', 'Descargando la biblioteca WebLLM…'));
  try {
    // El diagnóstico es asíncrono: si aún no terminó, se espera en vez de
    // filtrar contra null y reventar.
    if (!diagnostico) diagnostico = await diagnose();
    const lista = LM.filtrarPorDispositivo(await LM.catalogo(), diagnostico);
    out.textContent = '';
    const usado = await LM.espacioUsado();
    if (usado) out.appendChild(el('p', 'muted small', `Ya tienes ${usado} MB de modelos guardados en este dispositivo.`));

    lista.forEach(m => {
      const n = el('div', 'item');
      const t = el('div', 'item__t');
      t.appendChild(el('span', 'tag tag--' + (m.ofrecible ? 'go' : 'stop'), m.ofrecible ? 'disponible' : 'no'));
      t.appendChild(document.createTextNode(`${m.familia} · ${m.parametros}`));
      n.appendChild(t);
      n.appendChild(el('div', 'item__b',
        `${m.vramMB ? m.vramMB + ' MB de memoria de vídeo' : 'tamaño desconocido'}` +
        `${m.contexto ? ' · contexto ' + m.contexto : ''} · licencia ${m.licencia}` +
        `${m.comercial === true ? ' · uso comercial libre' : m.comercial === 'condicionado' ? ' · uso comercial condicionado' : ' · licencia a revisar'}`));
      n.appendChild(el('div', 'item__b', 'Español: ' + m.espanol + ' ' + m.uso));
      if (!m.ofrecible) {
        n.appendChild(el('div', 'mono small', '⛔ ' + m.motivo));
      } else {
        const b = el('button', 'btn', `Descargar ${m.vramMB} MB`);
        b.addEventListener('click', () => descargar(m));
        const w = el('div', 'row'); w.appendChild(b);
        n.appendChild(w);
      }
      out.appendChild(n);
    });
  } catch (e) {
    out.textContent = '';
    const err = el('div', 'verdict verdict--stop');
    err.textContent = 'No se pudo cargar WebLLM: ' + e.message +
      '. Puede ser falta de conexión o que el CDN esté bloqueado.';
    out.appendChild(err);
  }
  btn.disabled = false;
});

async function descargar(m) {
  const card = $('#dl-card');
  card.hidden = false;
  $('#dl-name').textContent = `${m.familia} ${m.parametros} · ${m.vramMB} MB`;
  $('#dl-fill').style.width = '0%';
  $('#dl-text').textContent = 'Preparando…';
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });

  try {
    await LM.cargar(m.id, (p) => {
      if (p.porcentaje != null) $('#dl-fill').style.width = p.porcentaje + '%';
      $('#dl-text').textContent = p.texto;
    });
    $('#dl-fill').style.width = '100%';
    $('#dl-text').textContent = 'Listo. El modelo está cargado en memoria.';
    $('#usar-modelo').checked = true;
  } catch (e) {
    $('#dl-text').textContent = e.message === 'cancelado'
      ? 'Cancelado. Lo que ya se bajó queda guardado; puedes borrarlo abajo.'
      : 'Falló: ' + e.message;
  }
}

$('#dl-cancel').addEventListener('click', () => { LM.cancelarCarga(); LM.interrumpir(); });
$('#dl-free').addEventListener('click', async () => {
  await LM.liberar();
  $('#dl-text').textContent = 'Memoria liberada. Los pesos siguen en el disco.';
  $('#usar-modelo').checked = false;
});
$('#dl-delete').addEventListener('click', async () => {
  const n = await LM.borrarTodo();
  $('#dl-text').textContent = `Borrado. Se eliminaron ${n} almacenes. La caché de Emprendo no se tocó.`;
  $('#dl-fill').style.width = '0%';
  $('#usar-modelo').checked = false;
});

/* ==================================================================
   5 · BANCO DE PRUEBAS
   ================================================================== */

async function correrCasos(conModelo) {
  const out = $('#bench-out');
  out.textContent = '';
  // El banco pisa la memoria con el perfil de prueba: se guarda la del usuario
  // para devolvérsela intacta al terminar.
  const respaldo = JSON.parse(JSON.stringify(memoria));
  const tabla = el('table');
  const thead = el('thead');
  thead.innerHTML = '<tr><th>#</th><th>Caso</th><th>Resultado</th><th>ms</th></tr>';
  tabla.appendChild(thead);
  const tbody = el('tbody');
  tabla.appendChild(tbody);
  const wrap = el('div', 'scroller'); wrap.appendChild(tabla);
  out.appendChild(wrap);

  let totalPasa = 0, totalCrit = 0, totalMs = 0;

  for (const caso of CASOS) {
    if (caso.soloModelo && !conModelo) {
      const tr = el('tr');
      tr.innerHTML = `<td>${caso.id}</td><td>${caso.titulo}</td><td class="muted">No aplica sin modelo generativo</td><td>—</td>`;
      tbody.appendChild(tr);
      continue;
    }

    /* Estado limpio y reproducible para cada caso. */
    memoria.perfil = { ...PERFIL_PRUEBA };
    memoria.datos = { ...DATOS_PRUEBA };
    memoria.decisiones = {};
    if (caso.limpiarDatos) caso.limpiarDatos.forEach(s => { delete memoria.datos[s]; });
    if (caso.requiereDecision) recordarDecision(memoria, 'precio', '$385', 'fórmula de Chispa');
    if (caso.respuestaSlot) delete memoria.datos[caso.respuestaSlot.slot];
    guardarMemoria(memoria);

    let texto = '', ms = 0;
    const t0 = performance.now();

    if (conModelo && caso.soloModelo) {
      // Los casos de formato van directos al modelo: pasarlos por el motor los
      // desviaría a una fórmula (pedir un JSON "con el precio" activa el
      // cálculo) y nunca se probaría lo que se quiere probar.
      try {
        const g = await LM.generar(caso.entrada, { maxTokens: 200 });
        texto = g.texto;
      } catch (e) { texto = 'ERROR: ' + e.message; }
    } else if (conModelo) {
      let r0 = responder(caso.entrada, memoria, null);
      // Si el caso trae la respuesta al dato que falta, se entrega antes de
      // juzgar: si no, el modelo nunca llega a ver el caso 5.
      if (caso.respuestaSlot && r0.pregunta && r0.pregunta.slot === caso.respuestaSlot.slot) {
        r0 = responder(caso.respuestaSlot.valor, memoria, { intencion: r0.intencion, slot: r0.pregunta.slot });
      }
      if (r0.nivel <= 4) {
        texto = r0.texto;                       // fórmula o pregunta: el modelo no aporta
      } else {
        try {
          const g = await LM.generar(construirPrompt(caso.entrada, memoria, r0.fuentes), { maxTokens: 300 });
          texto = g.texto;
        } catch (e) { texto = 'ERROR: ' + e.message; }
      }
    } else {
      let r = responder(caso.entrada, memoria, null);
      if (caso.respuestaSlot && r.pregunta && r.pregunta.slot === caso.respuestaSlot.slot) {
        r = responder(caso.respuestaSlot.valor, memoria, { intencion: r.intencion, slot: r.pregunta.slot });
      }
      texto = r.texto;
    }
    ms = Math.round(performance.now() - t0);
    totalMs += ms;

    const ev = evaluar(caso, texto);
    totalPasa += ev.pasa; totalCrit += ev.total;

    const tr = el('tr');
    const td1 = el('td', null, String(caso.id));
    const td2 = el('td');
    td2.appendChild(el('div', 'item__t', caso.titulo));
    td2.appendChild(el('div', 'mono small', caso.mide));
    const td3 = el('td');
    const marca = el('div', 'item__t', `${ev.pasa}/${ev.total}`);
    marca.style.color = ev.pasa === ev.total ? 'var(--accent)' : ev.pasa ? 'var(--warn)' : 'var(--stop)';
    td3.appendChild(marca);
    ev.detalle.forEach(([label, ok]) => {
      td3.appendChild(el('div', 'mono small', (ok ? '✅ ' : '❌ ') + label));
    });
    const det = el('details');
    det.appendChild(el('summary', 'muted small', 'ver respuesta'));
    const pre = el('div', 'mono small'); pre.textContent = texto;
    det.appendChild(pre);
    td3.appendChild(det);
    const td4 = el('td', 'mono', String(ms));
    tr.append(td1, td2, td3, td4);
    tbody.appendChild(tr);
  }

  const res = el('div', 'verdict verdict--' + (totalPasa / Math.max(1, totalCrit) > 0.7 ? 'go' : 'warn'));
  rich(res, `**${totalPasa} de ${totalCrit} criterios** · ${totalMs} ms en total · motor: ` +
    (conModelo ? 'modelo local ' + (LM.modeloActual() || '—') : 'Chispa Engine sin modelo'));
  out.insertBefore(res, wrap);

  memoria = respaldo;
  guardarMemoria(memoria);
  perfilAlFormulario();
}

$('#bench-engine').addEventListener('click', () => correrCasos(false));
$('#bench-model').addEventListener('click', () => {
  if (!LM.estaCargado()) {
    alert('Primero descarga y carga un modelo en la sección 4.');
    return;
  }
  correrCasos(true);
});

/* ==================================================================
   ARRANQUE
   ================================================================== */

perfilAlFormulario();
pintarSugerencias(SUGERENCIAS);
push('bot', 'Soy el motor sin modelo generativo. Carga el perfil de prueba y pregúntame ' +
  '"¿en cuánto debo vender mi producto?" para ver cómo pregunta solo lo que falta.');
pintarDiagnostico();

console.log('[lab] motor:', META_ENGINE, '· base:', META);
