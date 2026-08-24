# Plan: Chispa, retroalimentación y compartir logros

**Estado:** los cuatro bloques están implementados. El bloque D (compartir logros) se
rehízo después contra una especificación más precisa: **el mapa vigente es
[mapa-compartir-logros.md](mapa-compartir-logros.md)**, y la sección 4 de este documento
queda como registro de cómo se llegó hasta ahí.
**Base:** investigación de 5 exploradores sobre el código real, commit `2aae811`.

---

## 0. Lo primero: esto son cuatro proyectos

Lo que pediste no es una fase, son cuatro cuerpos de trabajo con riesgos muy distintos:

| # | Bloque | Tamaño | Riesgo | Toca |
|---|---|---|---|---|
| A | Bug del arranque en móvil | 1 archivo, ~15 líneas | Bajo | `splash.js` |
| B | Presencia de Chispa | 28 sitios + CSS | **Alto** | `mascot.js`, `components.css`, 14 archivos |
| C | Retroalimentación progresiva | 1 archivo grande | Medio | `lesson.js` (9 tipos de ejercicio) |
| D | Compartir logros | Sistema nuevo completo | **Alto** | 4-5 archivos nuevos |

**Orden recomendado: A → C → B → D.**

El bug primero porque es de una tarde. Luego la retroalimentación, que está acotada a un
archivo. Después Chispa, porque el rediseño de la burbuja afecta a las pantallas que C acaba
de tocar y conviene no pisarlas dos veces. Y compartir al final, porque es lo único que
depende de que Chispa ya tenga su presentación nueva.

---

## 1. Bloque A — El arranque en móvil

### Causa

`js/core/splash.js` fija `montadaEn` al montar, pero el reloj de las animaciones CSS no
arranca hasta el primer fotograma pintado. Comprobado bloqueando el hilo 2 s: las animaciones
se quedan en `currentTime: 0`, no se consumen.

En `appReady()`:

```js
var falta = minimo() - (ahora() - montadaEn);   // MINIMO = 2450 ms
if (falta <= 0) cerrar('app');
```

En escritorio el DOM está listo a los **86 ms**: sobran 2,36 s y la secuencia se ve entera.
En un móvil que tarde más de 2,45 s en arrancar —lo normal con **1.059 KB de JS en 44 scripts
síncronos**— `falta` sale negativo y el arranque se cierra en el instante en que `boot()`
termina, justo cuando las animaciones empezaban a pintarse.

### Arreglo

Medir el mínimo desde el **primer fotograma**, no desde el montaje: fijar `montadaEn` dentro
de un `requestAnimationFrame` doble tras insertar el nodo.

### Segunda causa, acumulativa

`css/tokens.css:127` recorta con `!important` toda `animation-duration` a 0,01 ms bajo
`prefers-reduced-motion`, que en Android e iOS se activa con el **ahorro de batería** sin que
el usuario lo sepa. Si es tu caso, verías el logotipo estático. Se distinguen así: con el bug
arreglado, si sigues sin ver animación, es esto.

---

## 2. Bloque C — Retroalimentación progresiva

### Lo que hay hoy

Todo vive en el pie pegajoso `.lesson-foot`. `onPrimary()` (`lesson.js:286`) llama al `check()`
del ejercicio, que devuelve `{ok, title, explain, details}`. `setFoot('ko', …)`
(`lesson.js:134`) pinta icono + título + `explain`, y si llega `details` añade `whyList()`
(`lesson.js:190`): un `<details open>` con una fila por opción y su razón.

### Hallazgo que cambia tu especificación

Pediste ocultar el desglose de todas las opciones tras «EXPLICAR MI ERROR». **Ese desglose
solo existe en 4 de los 9 tipos de ejercicio**, y en uno de ellos está vacío:

| Tipo | ¿Tiene `details`? | Cobertura de `why` |
|---|---|---|
| `quiz` | Sí | 204/204 — completa |
| `sim` | Sí | 111/111 — completa |
| `multi` | Sí | **0/248 — ninguna razón escrita** |
| `slider` | Sí | parcial |
| `tf`, `order`, `match`, `fill` | No | — |
| `write` | No | nunca falla (`check` devuelve siempre `ok:true`) |

Es decir: en `multi` el panel saldría con las etiquetas y sin ninguna explicación, y en
`tf`/`order`/`match`/`fill` el botón «EXPLICAR MI ERROR» no tendría nada que abrir.

**Propuesta:** el botón aparece solo cuando hay contenido real que enseñar. Donde no lo haya,
la corrección corta se muestra igual y el botón no se pinta. Escribir las 248 razones de
`multi` es un trabajo de contenido aparte, no de código.

### Diseño

- Pie corto: título «No era esa» + `explain` (1-2 líneas) + opción elegida en rojo + correcta en verde.
- Botón secundario «EXPLICAR MI ERROR» → `UI.sheet()` (ya existe, `ui.js`).
- Botón primario «ENTENDIDO» → `next()`, sin tocar el progreso.
- Dentro de la hoja: qué elegiste · por qué no · por qué sí la correcta · el principio ·
  ejemplo aplicado al negocio del usuario · consejo de Chispa + botón de audio.
- `S.phase = 'feedback'` ya bloquea el ejercicio: abrir la hoja no reinicia nada.

---

## 3. Bloque B — Presencia de Chispa

### Inventario real

28 llamadas a `Mascot.svg()`. Tamaños hoy:

| Clase | Caja | Arte real |
|---|---|---|
| `.mascot--sm` | 52 px | 48,1 px |
| `.mascot` | 78 px | 72,2 px |
| `.mascot--lg` | 130 px | 120,4 px |
| `.mascot--xl` | 170 px | 157,4 px |
| avatar del chat | 30 px | 27,8 px — **no usa `.mascot`** |

El arte sale siempre al 92,6 % de la caja: el `viewBox` es `0 0 100 108` dentro de una caja
cuadrada.

### Tres cosas que hay que saber antes de tocar nada

1. **Hay dos Chispas.** La de `js/core/mascot.js` (`viewBox 100x108`) y la del arranque en
   `js/core/splash.js:104` (`viewBox 100x100`, paleta clara, animaciones propias). Rediseñar
   una sin la otra produce dos personajes distintos en la misma app.
2. **Las animaciones de gesto están muertas.** `jump`, `wowPop`, `waveL/waveR` y `cash` existen
   en CSS pero las clases `is-*` solo se ponen en 6 de los 28 sitios. Y revivirlas tiene efecto
   secundario: las abreviaturas `animation` de `components.css:518` sustituyen al `bob` y las
   de una sola pasada no llevan `fill-mode`, así que la mascota quedaría congelada al terminar.
3. **La capa semántica ya está escrita y nadie la usa.** `Mascot.ESTADOS` mapea
   `bienvenida → happy`, `celebrando → party`, `alertando → wow`… pero `svg()` no llama a
   `estado()`, así que pasar `'celebrando'` devuelve silenciosamente la cara neutral. Es
   exactamente la API contextual que pides, a medio conectar.

### Propuesta

- Conectar `estado()` dentro de `svg()` para que los nombres semánticos funcionen.
- Nueva escala: `--sm` 56 px para mensajes normales, `--md` 64 px, `--lg` 88 px y `--xl` 100 px
  para momentos clave. Ajustada a la caja para que el **arte** caiga en tus 56–64 y 80–100.
- **Un componente `UI.chispaDice(mood, contenido)`** que componga mascota + burbuja. Hoy son
  16 fragmentos que repiten el mismo `row` a mano; sin unificarlos, el rediseño hay que
  hacerlo 16 veces y se desincroniza.
- La mascota sobresale por el costado de la burbuja mediante un margen negativo, no con
  `position:absolute`, para que no tape texto al reflujo en móvil.
- El avatar del chat pasa a usar `.mascot` para dejar de ser un caso aparte.

**Riesgo a vigilar:** el chat instancia un SVG completo con `<defs>` por mensaje, hasta 120
mensajes. Agrandar el dibujo multiplica el coste ahí primero.

---

## 4. Bloque D — Compartir logros

### Qué existe y qué no

| | Estado |
|---|---|
| Logros empresariales | **Ya existen**: 12 decisiones en `Venture.decisions` |
| API para saber si hay dato | **Ya existe**: `Venture.knows(clave)` |
| Datos del negocio | 11 campos en `venture.core` + 12 decisiones + métricas |
| `navigator.share` | **No existe** — hay que construirlo |
| Generar imágenes | **No existe** — no hay `toBlob` ni `toDataURL` en el repo |
| Fuente para el visual | Nunito local en `assets/fonts/`, sin red |
| Colores de marca | `css/tokens.css` + 7 temas por sector en `css/temas.css` |

### Cómo se generará la imagen, gratis y sin conexión

Canvas 2D directo: fondo y formas con la API de canvas, la mascota rasterizada desde su SVG
en línea vía `Image`, y el texto con `fillText` usando la Nunito que ya está cargada. Luego
`toBlob()` → `navigator.share({files})`, con `UI.download()` de reserva.

Se descarta componer todo en SVG y rasterizarlo: la fuente no viaja dentro del SVG y saldría
con una tipografía distinta.

### Cálculo de la etapa

Se calcula con `Venture.knows()`, acumulativo: cada etapa exige todas las anteriores. Nunca se
pregunta al usuario. Se recalcula solo al completar o modificar una decisión.

| Etapa | Condición | Intención |
|---|---|---|
| 0 | `!knows('idea')` | **No se genera visual** |
| 1 | `knows('idea')` | Presentar la idea |
| 2 | 1 + `knows('cliente')` + `knows('problema')` | Conocer el mercado |
| 3 | 2 + `knows('oferta')` | Conocer el mercado (medir interés) |
| 4 | 3 + `knows('precio')` | Acercarse a clientes |
| 5 | 4 + (`knows('canales')` o `knows('ventas')`) | Vender |

Un precio sin producto no sube a etapa 4: `knows('precio')` no basta sin el escalón 3.

### Tabla maestra: logro → etapa → contenido → CTA

| Logro | Requisitos reales | Etapa mín. | Datos permitidos | Objetivo | CTA | Chispa |
|---|---|---|---|---|---|---|
| **Idea definida** | `knows('idea')` | 1 | `name?`, `idea`, `sector` | Presentar | «¿Qué te parece esta idea?» | `bienvenida` |
| **Problema identificado** | + `knows('problema')` | 2 | `name?`, `idea`, `problema`, `customer` | Mercado | «¿Te pasa lo mismo?» | `pensando` |
| **Cliente ideal definido** | + `knows('cliente')` | 2 | `name?`, `idea`, `customer` | Mercado | «¿Qué es lo más difícil de encontrar?» | `pensando` |
| **Producto definido** | + `knows('oferta')` | 3 | `name?`, `offer`, `customer`, beneficio | Mercado | «¿Cuál probarías primero?» | `explicando` |
| **Precio definido** | + `knows('precio')` | 4 | `name?`, `offer`, `customer`, beneficio | Cliente | «Escríbeme si quieres info» | `motivando` |
| **Listo para vender** | + `canales` o `ventas` | 5 | `name?`, `offer`, `customer`, `precio`, canal | Vender | «Reserva / pide tu pedido» | `celebrando` |

`name?` significa opcional: si no hay nombre del negocio, la plantilla describe la idea sin
nombrarla. **Nunca se inventa un nombre.**

Campos **prohibidos** en todos los visuales: XP, racha, insignias, nivel, liga, monedas,
lecciones completadas, presupuesto, experiencia, lugar y cualquier métrica interna del juego.

### Logros que NO se habilitan, y por qué

Tu lista incluía cinco que **no tienen dato garantizado**. Por tu propia regla —«si un logro no
garantiza que existan los datos necesarios, no inventes información»— se quedan fuera:

| Pedido | Por qué no |
|---|---|
| Propuesta de valor | No existe el campo. Es derivado de `oferta` + `cliente` |
| Elegir opción de producto | No hay dato que distinga «opciones» de «producto» |
| Preparar prototipo | No existe ningún campo de prototipo |
| Listo para presentar/probar | Solapa con etapa 4; no hay señal propia |
| Nombre del emprendimiento | `core.name` es **opcional**: puede estar vacío |

---

## 5. Riesgos transversales

- **La caché de IA se invalida al escribir en el perfil.** Cualquier `recordDecision` sube
  `venture.rev` y marca `stale` los desafíos personalizados. Compartir debe **leer**, nunca escribir.
- **Los modales de celebración se pisan.** Ya existe `UI.queueModal` por eso. El ofrecimiento
  de compartir tiene que encolarse, no abrirse encima.
- **Todo archivo nuevo va a `PRECACHE` de `sw.js`** o falla en la PWA instalada.
  `tools/check-precache.js` lo verifica.
- **`prefers-reduced-motion` anula con `!important` sobre el selector universal.** Cualquier
  animación nueva de Chispa queda muerta ahí; hay que darle una alternativa estática.
- **El expediente y el perfil guardan lo mismo por duplicado.** Escribir en uno sin el otro
  los descuadra.
