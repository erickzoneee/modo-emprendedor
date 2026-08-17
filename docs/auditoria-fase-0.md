# Auditoría Fase 0 — de MVP a EMPRENDO

**Fecha:** 17 de agosto de 2026
**Commit auditado:** `dd665bb`
**Alcance:** repositorio completo, sin modificar código.
**Método:** 7 auditorías paralelas por dimensión + verificación adversarial de los hallazgos
graves + medición directa del árbol de carga y de la accesibilidad.

---

## 1. Resumen ejecutivo

La aplicación está mejor construida de lo que suele estar un MVP. No hay que reconstruir nada
y no hace falta tirar ninguna decisión de arquitectura. El problema no es la calidad del código:
es que **el plan de 10 fases, ejecutado en el orden propuesto, destruiría el progreso de todos
los usuarios actuales en tres puntos distintos**. Ese es el hallazgo central de esta auditoría.

**Tamaño real:** 76 archivos versionados, 21.580 líneas de JavaScript, sin build step, sin
dependencias. Todo el estado del usuario cabe en 3 claves de `localStorage`.

### Lo que está bien y hay que conservar tal cual

| Área | Estado |
|---|---|
| Superficie de XSS | Sana. Solo 7 usos de `innerHTML`; los 14 puntos donde entra texto de IA pasan sin excepción por `UI.rich()`, que escapa **antes** de insertar `<b>`/`<br>`. No encontré ningún XSS explotable. |
| Secretos en el frontend | Ninguno. El Worker usa el binding `env.AI`, que se autentica solo. `git ls-files worker/` no expone nada. |
| CORS del Worker | Ya es una allowlist explícita con comparación estricta, con `Vary: Origin` y sin `Allow-Credentials`. **Falla cerrado** si `ORIGENES` está vacío. |
| Rate limit por IP | Ya existe y es el binding nativo de Cloudflare, evaluado en el borde y con `CF-Connecting-IP`. No es un `Map` en memoria. |
| Techos de salida | Ya los fija el servidor. El cliente no puede subir `max_tokens` por encima de 400 aunque envíe 100.000. |
| Fallback al mentor local | **Ya funciona.** `js/screens/mentor.js:329` cae a `localFallback()` ante cualquier error de IA. El usuario nunca ve una pantalla rota. |
| Precache del service worker | Completo y verificado uno a uno: los 39 scripts, 6 CSS, 2 fuentes e iconos. Rutas relativas, portables a un dominio propio. |
| Motor determinista de Chispa | Sólido en su principio rector: el modelo generativo solo entra en el nivel 7 y nunca es fuente de verdad. |
| Selección de voz | Bien pensada: prioriza español latino, prefiere voces locales, persiste la preferencia, trocea por frases para esquivar el corte de Chrome. |

### Lo que está mal

**84 hallazgos confirmados.** Ocho son bloqueantes. El resto se reparte en 8 altos, ~30 medios
y el resto bajos.

---

## 2. Los ocho bloqueantes

Ninguna fase debería empezar antes de que estos ocho estén cerrados.

### B1 — Subir la versión del esquema borra el progreso de todos

`js/core/store.js:134`

```js
if (!parsed || parsed.v !== 1) return false;
```

Si `load()` devuelve `false`, el estado vuelve a `defaults()`. Y acto seguido `init()` llama a
`rollDay()`, que en su primera ejecución del día siempre marca `changed = true` y llama a
`save()` (`store.js:260`). **El respaldo bueno se sobrescribe con los valores por defecto en el
primer arranque.** Silencioso e irreversible.

No existe ningún mecanismo de migración. Lo único parecido es el `merge(defaults(), parsed)`,
que tolera bien campos *añadidos* — por eso el esquema ha podido crecer sin romperse — pero no
sobrevive a un cambio de `v`.

> Cualquier cosa que las fases 3 o 4 hagan con el esquema pasa por aquí primero.

### B2 — El cambio de dominio borra el progreso, y ninguna migración interna puede evitarlo

`localStorage` está aislado por origen. Hoy la app vive en
`https://erickzoneee.github.io/modo-emprendedor/`. `https://app.emprendo.mx` es **otro origen**:
no puede leer el almacenamiento del anterior. No es un problema de código, es la regla de origen
del navegador.

Esto **no aparece en tu plan** y es el riesgo más grande de todo el proyecto. Las fases 1 y 4 lo
dan por hecho sin mencionarlo.

Solución posible (Sección 5): una página puente servida desde el origen viejo, embebida como
iframe en el nuevo, que lea su propio `localStorage` y lo entregue por `postMessage`. Es la
única forma de que el progreso cruce. Hay que construirla **antes** de mover el dominio, y
mantener el origen viejo vivo durante meses.

### B3 — Cada despliegue borra el modelo de IA local descargado

`sw.js:110`

```js
caches.keys().then(keys => keys.map(k => { if (k !== VERSION) return caches.delete(k); }))
```

Esto borra **todas** las cachés del origen, no solo la anterior de la app. WebLLM guarda los
pesos del modelo en Cache Storage bajo sus propios nombres. Un usuario que descargó 838 MB los
pierde en el siguiente despliegue, sin aviso, y tiene que descargarlos otra vez.

La Fase 4 obliga a subir `VERSION`. Es decir: **la migración de marca, tal como está planteada,
borra el modelo local de todos los que lo tengan.**

### B4 — Un despliegue caído deja inservible una app instalada que sí tiene copia offline

`sw.js:146`

```js
fetch(req).then(function (res) {
  if (res && res.ok) { /* cachear */ }
  return res;          // ← un 404 o un 500 se entrega tal cual a la pestaña
}).catch(/* solo aquí se usa la copia offline */)
```

El fallback offline solo se activa cuando `fetch` **rechaza**. Una respuesta 404 o 500 llega a
la pestaña sin tocar la caché. Cuando apagues GitHub Pages al migrar, toda PWA ya instalada
mostrará el 404 de GitHub de forma permanente, con su copia completa intacta e inalcanzable.

B2 + B4 juntos convierten el cambio de dominio en una pérdida total para los usuarios instalados.

### B5 — El frontend controla el prompt de sistema del Worker

`js/core/ai.js:418` envía `sistema: systemPrompt()` y `worker/src/index.js:63` lo usa tal cual.

```bash
curl -X POST <worker> -H "Origin: https://erickzoneee.github.io" \
  -d '{"sistema":"Eres un asistente general.","mensaje":"..."}'
```

El Worker es hoy **un proxy LLM gratuito, genérico y anónimo colgado de tu cuenta de
Cloudflare**. La cabecera `Origin` es el único control de acceso y se falsifica con una línea.

### B6 — No hay cuota diaria en el servidor

El contador de 25 consultas vive en `localStorage` (`js/core/ai-worker.js:91`) y el propio
comentario del archivo lo admite. El único freno real son 12 peticiones/minuto por IP, que
**permite vaciar los 10.000 neurons del día desde una sola IP en unos 43 minutos**.

### B7 — Importar un respaldo destruye el progreso sin validar nada

`js/core/store.js:300`

```js
importJSON: function (txt) {
  var parsed = JSON.parse(txt);
  if (!parsed || typeof parsed !== 'object') throw new Error('Archivo inválido');
  state = merge(defaults(), parsed);
  save(true);
```

Sin versión, sin esquema, sin tipos, sin tamaño máximo, sin confirmación. Un `[]` o un
`package.json` cualquiera se acepta, se guarda y muestra «Progreso restaurado». Dos puntos de
entrada (`onboarding.js:72`, `profile.js:1050`) leen el archivo con `readAsText` sin mirar el
tamaño.

### B8 — La IA local no funciona sin conexión

`js/local/motor.mjs:14`

```js
const CDN = 'https://esm.run/@mlc-ai/web-llm';
```

Se importa en cada carga, **sin fijar versión ni integridad**. Rompe la promesa explícita de
«funciona sin conexión» y es la única dependencia de terceros de toda la app, ejecutándose en
el hilo principal, en el mismo contexto donde vive la clave de Anthropic en texto plano.

---

## 3. Diagnóstico por área

### 3.1 Worker de IA — 11 hallazgos

Bien construido en lo que hace; el problema es lo que no hace. Además de B5 y B6:

- **Rate limit fail-open** (`index.js:44`): `if (env.LIMITE_IP)` — si falta el binding, el límite desaparece en silencio.
- **Sin límite de tamaño del cuerpo** (`index.js:57`): se parsea el JSON completo antes de truncar.
- **Excepción no capturada con `null` literal** (`index.js:63`): devuelve un 500 de plataforma **sin cabeceras CORS**.
- **Sin timeout de servidor** para la llamada a Workers AI (`index.js:92`).
- **Sin `Cache-Control: no-store`** ni `X-Content-Type-Options` (`index.js:146`).
- **Sin validación de `Content-Type`** (`index.js:57`).
- El código admite CORS wildcard (`index.js:132`); la única barrera es una advertencia en el README.

**Techo económico que hay que conocer ahora:** 10.000 neurons/día ≈ 520 generaciones ≈ **unos
100 usuarios activos al día**. Es el límite duro del nivel gratuito. La Fase 1 pide una
arquitectura «que pueda crecer»; esta es la cifra sobre la que hay que decidir.

### 3.2 Frontend — 7 hallazgos

Sin XSS. **Descarté explícitamente el riesgo de prototype pollution global**: se comprobó que
`__proto__` en `merge()` reemplaza el prototipo del objeto local y `Object.prototype` queda
intacto. Sigue siendo un hallazgo bajo (corrompe el objeto de estado), no crítico.

Lo real:
- **No existe ninguna CSP** ni ningún encabezado de seguridad en todo el repositorio.
- `new Function` en `local-ai.js:251` — es solo un polyfill de `import()` dinámico, trivial de eliminar, pero hoy impediría una CSP estricta sin `unsafe-eval`.
- Clave de Anthropic en `localStorage` en texto plano, enviada directa desde el navegador.
- `normalizarUrl` acepta `http://` para la URL del Worker: enviaría el expediente del negocio en claro.

### 3.3 Service worker y PWA — 10 hallazgos

Además de B3 y B4:
- **Cada despliegue produce una primera carga con HTML nuevo y JS viejo**, sin aviso ni recarga. Nombres de archivo sin huella de contenido, navegación red-primero, subrecursos caché-primero.
- Navegar a cualquier HTML del mismo origen (`docs/`) **sobrescribe la entrada `./index.html`** del precache (`sw.js:149`).
- Red-primero en navegación **sin límite de tiempo**: en red lenta o cautiva la app se cuelga y nunca usa su copia offline.
- El manifest no declara `id` ni `screenshots`.
- Las etiquetas Open Graph y Twitter apuntan en duro a `github.io` (6 URLs absolutas).
- Un precache parcialmente fallido se da por bueno **y borra la caché anterior**.

### 3.4 Persistencia — 13 hallazgos

Tres claves: `modo-emprendedor:v1`, `modo-emprendedor:ai`, `modo-emprendedor:worker`.
Más una cuarta aislada del laboratorio (`chispa-lab:memoria`).

Además de B1 y B7:
- **Dos pestañas se pisan el estado** (`app.js:337`): la que se oculta fuerza `save(true)` y escribe su copia obsoleta encima de lo que guardó la otra.
- **`QuotaExceededError` se traga con un `console.warn`** (`store.js:163`): el usuario sigue jugando y nada se guarda.
- «Reiniciar todo» no borra la clave de API ni la dirección del Worker.
- El respaldo lleva el flag del modelo local, que no es portable y miente en el dispositivo nuevo.
- El respaldo se marca como hecho aunque la descarga o la copia hayan fallado.

Nota positiva: `Venture.migrateFromProfile()` (`venture.js:334`) **sí es una migración real** y
funciona. Es el patrón a seguir.

### 3.5 Arquitectura de IA — 15 hallazgos

Cadena real, descubierta leyendo el código (no es la que sugiere la documentación):

```
Chispa Engine (reglas + 77 entradas de KB + 26 intenciones escritas)  ← niveles 1-6
        └─ nivel 7 → ¿hay IA?
             ├─ clave Anthropic (BYOK)      ─┐
             ├─ modelo local (WebLLM)        ├─ EXCLUYENTE: se elige UNO
             └─ Worker de Cloudflare        ─┘
                    └─ si falla → mentor local escrito  ✅ (ya funciona)
```

- **La selección es excluyente, no encadenada** (`ai.js:414`): si la clave falla, no prueba el Worker. Cae directo a reglas.
- **«La IA gratuita de EMPRENDO» no existe como servicio.** No hay URL por defecto en ninguna parte del código: el usuario final tiene que desplegar su propio Worker con `npx wrangler deploy` y pegar la URL a mano. La interfaz se contradice a sí misma sobre esto.
- **Único texto técnico visible** en toda la UI: `js/screens/profile.js:554` — *«La imprime «npx wrangler deploy» al desplegar la carpeta worker/ del proyecto»*. Es el que la Fase 2 pide eliminar.
- La generación local **no tiene timeout**: el chat puede quedarse en «escribiendo» para siempre.
- El 403 del Worker es inalcanzable desde el navegador (CORS lo bloquea antes) y se muestra como «Sin conexión».

### 3.6 Marca — 13 hallazgos

**No existe ninguna configuración central de marca.** `js/data/config.js` contiene solo datos de
juego. El 100% de los nombres está escrito a mano, archivo por archivo.

| Cadena | Ocurrencias | Archivos |
|---|---|---|
| «Modo Emprendedor» | 38 | 18 |
| «Chispa» | 133 | 24 |
| URLs de GitHub Pages | 6 | 2 |
| Emojis de sistema | 517 | — |

El repositorio **ya está medio migrado**: «Emprendo» se usa en `docs/`, `worker/`, `lab/` y en
cadenas visibles de `ai-worker.js` y `profile.js`, mientras «Modo Emprendedor» sigue en toda la
carcasa. Los dos motores de mentor se contradicen sobre el nombre de la app.

Identificadores que **no admiten renombrado sin migración**: las 3 claves de `localStorage`, el
nombre del cache del SW y el nombre del Worker de Cloudflare (cambiarlo cambia su URL pública,
que vive guardada en el dispositivo de cada usuario).

Trampas concretas:
- Un buscar-y-reemplazar de «Emprendedor» **rompe el centinela del nombre de perfil** (`store.js:51`: `name: 'Emprendedor'`).
- La marca está incrustada en los prompts de sistema (`ai.js:159`): cambiar solo la interfaz deja al mentor presentándose con el nombre viejo.
- `assets/og-image.png` lleva el wordmark rasterizado: **ningún grep la encuentra**.
- La procedencia `'chispa'` se guarda dentro de las decisiones del usuario y se muestra en pantalla.
- El handshake entre la IA local y su worker usa la palabra `'chispa'` como clave de mensaje (`motor.mjs:46`): renombrarla a medias cuelga la carga 30 s.

### 3.7 Voz, animaciones y sonido — 15 hallazgos

El diseño del TTS es correcto y los bugs clásicos de la API están contemplados. Dos defectos
funcionales verificados:

- **El botón de altavoz nunca entra en estado «leyendo»** y su segundo toque vuelve a leer en lugar de parar (`speech.js:193`). El `notify()` del `stop()` interno de `speak()` borra el marcador `dataset.mine` que el clic acababa de poner.
- **La lectura automática queda muerta tras cada recarga** (`speech.js:194`): el flag de cebado por gesto vive solo en memoria.
- `trocear()` **elimina los signos `¿` y `¡`** de apertura, que abren el 36% de las 255 preguntas del temario.
- Sin normalización de cifras, moneda, siglas ni símbolos (`≠ − × ÷ $`).
- El orden de preferencia actual es `es-MX > es-US > es-419`. **Tú pides `es-MX > es-419 > es-US`.** Es un cambio de una línea.
- `settings.reduceMotion` **existe en el estado y no se lee en ningún sitio**: no hay control de movimiento dentro de la app (sí se respeta `prefers-reduced-motion` del sistema, de forma global).
- Animaciones: 46 keyframes, 17 infinitas, casi todas de `transform`/`opacity`. Las de ánimo de la mascota están muertas.

### 3.8 Rendimiento y accesibilidad — medido directamente

| Métrica | Valor | Comentario |
|---|---|---|
| `<script>` síncronos | **39** | Cero `defer`, cero `async`, cero `type="module"` |
| JS del camino crítico | **911 KB** | Sin minificar, bloquea el parseo secuencialmente |
| CSS | 79 KB | |
| Fuentes | 72 KB | |
| **Total bloqueante** | **1.064 KB** | En un móvil de gama baja con 3G esto es una espera larga antes del primer pixel |
| Atributos `aria-*` en todo `js/` | **9** | Contra 96 manejadores `onClick` |
| Breakpoints CSS | **1** (`520px`) | No hay diferenciación a 360 / 390 / 430 px |
| `env(safe-area-inset-*)` | **1** (solo `bottom`) | Falta el inset superior para el notch de iOS |
| Foco al cambiar de pantalla | **No existe** | Un lector de pantalla no se entera del cambio |

Positivo: `UI.btn` genera un `<button type="button">` real, los bucles `requestAnimationFrame`
de `fx.js` sí paran solos, y el modo oscuro está implementado con `html[data-theme="dark"]`
(aunque solo manual, sin detección de `prefers-color-scheme`).

---

## 4. Contradicciones en el plan de 10 fases

Esto es lo que pediste explícitamente. Son las nueve que encontré.

### C1 — La Fase 4 borra usuarios, y la Fase 3 llega demasiado tarde para salvarlos

El plan pone las cuentas (Fase 3) antes del cambio de dominio (Fase 4), lo cual es correcto,
pero **ninguna de las dos contempla B2**. Sin la página puente entre orígenes, la sincronización
en la nube solo protege a quien haya creado cuenta *antes* de la migración. Todos los demás
pierden todo.

### C2 — «Límite por usuario o instalación» sin cuentas obligatorias es un tope blando

La Fase 2 pide cuota por instalación en el servidor; la Fase 3 insiste, con razón, en no obligar
a registrarse. Sin cuenta no hay identidad fiable: cualquier identificador que genere el cliente
se regenera borrando el almacenamiento, o simplemente enviando otro UUID.

**Es un freno útil contra el abuso accidental, no contra el deliberado.** Lo que de verdad
protege la cuenta es la combinación de: límite por IP + cuota diaria por instalación + **un
cortacircuitos global** que corte el servicio del día al llegar a un techo. Conviene decidirlo
sabiéndolo, no descubrirlo con la factura.

### C3 — «El servidor define el prompt» contra la personalización según la idea del usuario

El prompt de sistema actual **incrusta todo el contexto del negocio** (`businessContext()`). Si
el servidor es el único dueño del prompt, el cliente sigue teniendo que enviar ese contexto.

Salida limpia: el servidor es dueño de la **plantilla**; el cliente envía **campos
estructurados** con tope de longitud (`idea`, `sector`, `etapa`, `objetivo`, `pregunta`) que se
insertan en huecos concretos. Nunca texto libre de prompt. Así se conserva la personalización y
desaparece el proxy genérico.

### C4 — «Eliminar las llamadas directas desde el navegador» hace imposible BYOK en la web

Si se prohíben las llamadas directas a `api.anthropic.com`, la única alternativa es enrutar la
clave del usuario por nuestro servidor — **y entonces nosotros vemos su clave**, que es peor.

En una PWA pura, BYOK **solo puede existir como llamada directa desde el navegador.** Mi
recomendación: conservarlo detrás de un ajuste «avanzado», con advertencia honesta, y mover el
almacenamiento seguro real a la Fase 10 con Capacitor Secure Storage. Es lo que tu propio plan
insinúa; solo hay que decir en voz alta que en web no hay opción mejor.

### C5 — CSP estricta contra la IA local

La Fase 2 pide CSP estricta y refactorizar `new Function`. El `new Function` es fácil (es solo
un polyfill de `import()`). **Pero WebLLM necesita `wasm-unsafe-eval`** para compilar su WASM, y
hoy además se importa desde `esm.run`.

Una CSP verdaderamente estricta mata la IA local. Para conservarla hay que: auto-hospedar
WebLLM con versión fija (que además arregla B8) y permitir `wasm-unsafe-eval` explícitamente.
Es un compromiso consciente, no un descuido.

### C6 — La Fase 4 obliga a subir `VERSION`, y eso dispara B3

Migrar la marca implica tocar el service worker. Tocar el service worker implica subir
`VERSION`. Subir `VERSION` borra hoy el modelo local de todos los que lo tengan (B3).

**B3 tiene que estar arreglado antes de empezar la Fase 4**, no durante.

### C7 — «Conservar el funcionamiento offline» ya está incumplido

La Fase 0 pide conservar el offline y la Fase 5 lo asume. Pero la IA local, que se presenta como
la opción que funciona sin internet, importa su librería de un CDN en cada carga (B8). La
promesa ya está rota hoy.

### C8 — La prueba de carga de la Fase 9 quemaría la cuota real

«Prueba de carga del endpoint» contra el Worker de producción consume neurons reales y agotaría
el día. Hay que hacerla contra un Worker de staging con la llamada al modelo simulada, midiendo
el límite y la validación, no la generación.

### C9 — Detalles menores del plan que ya no aplican tal cual

- El orden de voces que pides (`es-MX > es-419 > es-US`) difiere en una posición del actual.
- «Eliminar las instrucciones de Wrangler de la interfaz» es **un solo texto** (`profile.js:554`), no un trabajo grande.
- La Fase 6 dice «primero navegación, progreso y niveles»: correcto. Los emojis de las 50 lecciones viven dentro de 8 archivos de datos grandes; dejarlos para el final es la decisión acertada.

---

## 5. Plan técnico revisado

El cambio de fondo es **añadir una fase 0.5 y mover la centralización de marca a la Fase 1**.
Todo lo demás conserva tu orden.

### Fase 0.5 (NUEVA) — Blindaje de datos · sin cambios visibles

Sin esto, cualquier fase posterior que toque almacenamiento o service worker pierde datos.

1. `store.js`: motor de migraciones por versión (`v1 → v2 → …`), con el patrón de `Venture.migrateFromProfile()` que ya funciona. Nunca descartar estado desconocido: conservarlo bajo una clave de cuarentena.
2. `store.js`: `importJSON` con validación de esquema, versión, tipos, tope de tamaño (p. ej. 2 MB), bloqueo de `__proto__`/`constructor`/`prototype` y confirmación previa mostrando qué se va a sobrescribir.
3. `sw.js`: borrar **solo** las cachés con nuestro prefijo. Deja de destruir el modelo local.
4. `sw.js`: tratar 4xx/5xx como fallo y servir la copia offline. Timeout en la navegación red-primero.
5. `store.js`: manejar `QuotaExceededError` visiblemente.
6. `app.js`: coordinar pestañas con el evento `storage` para que no se pisen.

**Prueba de aceptación:** un `localStorage` con `v:1` sobrevive intacto a un arranque con `v:2`;
el modelo local sobrevive a un cambio de `VERSION`; un respaldo corrupto se rechaza sin tocar el
progreso.

### Fase 1 — Arquitectura y marca centralizada

Recomendación sobre la pregunta que haces: **Cloudflare Pages + Workers + KV**, y Supabase solo
cuando llegue la Fase 3.

- `emprendo.mx` y `app.emprendo.mx` → Cloudflare Pages (dos proyectos, o uno con dominio y subdominio).
- `api.emprendo.mx` → el Worker que ya existe, con una ruta personalizada.
- Cuota diaria → **KV**, no D1: es un contador con TTL de 24 h, y KV entra de sobra en el nivel gratuito.
- Base de datos de cuentas → **Supabase** en la Fase 3, por el enlace mágico y las políticas RLS ya resueltas.

Nada de VPS. Con este reparto no administras ningún servidor y los tres nombres quedan en un
solo archivo de configuración.

Además, aquí y no en la Fase 4: **`js/data/brand.js`** con `appName`, `mascotName`, `domains`,
`storagePrefix`, `workerUrl`. Si no se hace ahora, las fases 2 y 3 escriben más nombres a mano.
Se crea el archivo y se consume; **no se cambia todavía ningún nombre visible**.

### Fase 2 — Seguridad y servidor de IA

Es más corta de lo que crees, porque CORS, rate limit por IP y techos de salida ya existen.
Queda:
- Cuota diaria en KV + cortacircuitos global (B6, C2).
- El servidor pasa a ser dueño de la plantilla del prompt; el cliente envía campos estructurados (B5, C3).
- `Cache-Control: no-store`, validación de `Content-Type` y de tamaño, `null` literal, timeout de servidor, rate limit fail-closed.
- URL del Worker en `brand.js`, fuera de la UI. Borrar el texto de Wrangler.
- Encadenar proveedores en vez de elegir uno (C-3.5).
- CSP + encabezados de seguridad, con `wasm-unsafe-eval` y WebLLM auto-hospedado (C5, B8).

### Fases 3 a 10

Como las planteaste, con dos añadidos:
- **Fase 3** incorpora la página puente entre orígenes (B2) como entregable.
- **Fase 4** no puede empezar sin B3 y B4 cerrados (C6).

---

## 6. Lo que necesito decidir contigo

Antes de tocar nada, cuatro decisiones que cambian el trabajo de forma material. Van en el
mensaje que acompaña a este documento.

---

*Auditoría generada sin modificar código. 84 hallazgos; los graves verificados de forma
adversarial contra el código real.*
