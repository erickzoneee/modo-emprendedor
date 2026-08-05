# 🚀 Modo Emprendedor

**Aprende. Construye. Vende.**

### 👉 [Abrir la app](https://erickzoneee.github.io/modo-emprendedor/)

Una app tipo Duolingo que no te enseña *sobre* emprender: te lleva de una idea a un negocio real, **una misión al día**.

Al terminar la ruta no te llevas un certificado. Te llevas una idea validada, un cliente ideal definido, una oferta escrita, tus precios calculados, una identidad básica, una estrategia de ventas y tus primeros clientes.

---

## Cómo abrirla

**Opción 1 — instalarla como app (la mejor en móvil)**

Abre [la app](https://erickzoneee.github.io/modo-emprendedor/) y instálala:

- **Android / Chrome / Edge:** aparece "Instalar", o entra a **Perfil › Ajustes › Instalar la app**.
- **iPhone:** botón Compartir → *Añadir a pantalla de inicio*.

Queda con icono propio, a pantalla completa y **funciona sin conexión**: la tipografía, el código y las 50 lecciones se guardan en el dispositivo la primera vez que la abres.

**Opción 2 — doble clic**

Abre `index.html` en Chrome, Edge o Firefox. No necesita instalación, ni internet, ni cuenta.

> Dos avisos sobre `file://`: algunos navegadores restringen ahí el guardado local (si tu progreso no se conserva, usa la opción 3), y los service workers no funcionan, así que por esta vía no se puede instalar.

**Opción 3 — servidor local**

```bash
node serve.js
```

Y abre `http://localhost:4321`. Por aquí sí se puede instalar y probar el modo sin conexión.

**Opción 4 — publicarla**

Es un sitio estático puro. Sube la carpeta completa a Netlify, Vercel, GitHub Pages o cualquier hosting y funciona igual.

> Si la publicas **en una subcarpeta** (como hace GitHub Pages), no hay nada que tocar: el manifest, el service worker y todas las rutas son relativas a propósito.

---

## Qué incluye

| | |
|---|---|
| **50 microlecciones** | de 5 a 10 minutos cada una |
| **248 ejercicios** | 9 tipos distintos de interacción |
| **8 niveles** | Descubre → Valida → Construye → Vende → Administra → Crece → Sistematiza → Escala |
| **8 retos reales** | los "jefes finales": se hacen fuera de la app |
| **58 paradas en la ruta** | las 50 lecciones + los 8 retos reales |
| **50 misiones aplicadas** | una por lección, cada una a tu negocio de verdad |
| **Simulador de empresa** | 12 semanas, 22 eventos, modelo de demanda real |
| **Mentor** | evalúa tus textos, calcula y practica ventas contigo. Local por defecto; con IA real si conectas tu clave |
| **Expediente Mi Negocio** | 12 secciones que se llenan solas y se exportan |

> **Cómo se cuentan:** el mapa tiene **58 paradas** = **50 lecciones** + **8 retos reales**.
> Cada lección cierra con una **misión aplicada** a tu propio negocio (50 en total), y cada nivel
> termina con un **reto real** que haces fuera de la app y luego reportas.

---

## La ruta del emprendedor

| Nivel | Resultado |
|---|---|
| 1. 🔎 **Descubre** | Encuentras problemas y oportunidades reales |
| 2. 🧪 **Valida** | Compruebas si alguien de verdad compraría |
| 3. 🔧 **Construye** | Creas tu producto mínimo viable y le pones precio |
| 4. 🤝 **Vende** | Consigues tus primeros clientes |
| 5. 📊 **Administra** | Controlas costos, ingresos e inventario |
| 6. 📈 **Crece** | Haces marketing y aumentas ventas |
| 7. ⚙️ **Sistematiza** | Automatizas, delegas y documentas |
| 8. 🚀 **Escala** | Contratas, reinviertes y expandes |

### Los jefes finales

No son exámenes. Son cosas que haces en el mundo real y luego reportas:

1. Consigue tu primera entrevista con un cliente
2. Publica tu primera oferta y consigue 3 respuestas
3. Calcula tu costo unitario y define tu precio
4. Envía 10 mensajes y manda una cotización
5. Cierra tu primer mes con números reales
6. Consigue 3 clientes nuevos en una semana
7. Documenta tu proceso clave
8. Recupera tu inversión inicial y define tu plan de 90 días

---

## Cómo es una lección

Cada sesión dura entre 5 y 10 minutos y siempre tiene la misma forma:

1. **Concepto corto** — la idea, en dos párrafos y tres claves
2. **Caso empresarial** — una historia real de negocio pequeño
3. **Ejercicios** — decisiones, no memorización
4. **Simulación de consecuencias** — eliges y ves qué le pasa a tu negocio
5. **Misión aplicada** — algo que haces con tu negocio de verdad
6. **Evaluación del mentor** — revisa lo que escribiste y te dice qué falta

### Los 9 tipos de ejercicio

`quiz` una respuesta · `multi` varias respuestas · `tf` verdadero o falso · `order` ordenar pasos · `match` emparejar · `fill` completar la frase · `slider` elegir un número con consecuencias · `sim` decisión con impacto animado · `write` escribir y que el mentor lo revise

---

## El simulador

Además de construir tu proyecto, administras una empresa virtual durante 12 semanas. Cada semana decides **precio, cuánto material compras y cuánto inviertes en publicidad**, y enfrentas un evento: un proveedor que sube precios, un cliente molesto, un pedido mayorista con pago a 60 días, una máquina descompuesta, alguien que te copia…

El modelo calcula demanda a partir de tu precio (elasticidad), tu reputación y tu publicidad, y la limita por tu inventario y tu capacidad. Distingue **utilidad de flujo de efectivo**: puedes ser rentable en papel y quedarte sin dinero. Es el error que más negocios pequeños mata, y aquí lo cometes gratis.

---

## El mentor

Tiene **dos motores**. El local siempre está; la IA es opcional.

### Motor local (por defecto)

Funciona **sin conexión y sin claves de API**. Es un motor de análisis de texto y reglas de negocio, no un modelo de lenguaje. Lo que hace:

- **Evalúa tus misiones** contra rúbricas concretas: detecta si dijiste "todos" en vez de un público, si te falta un número, si prometiste un objeto en vez de un resultado, si tus pasos empiezan con verbos, si tu margen es sano…
- **Calcula**: punto de equilibrio, precio sugerido (piso/mercado/valor), costo real de impresión 3D, CAC contra margen, punto de reorden.
- **Practica contigo**: manejo de objeciones, entrevista de descubrimiento y una venta completa, turno por turno.
- **Te da la misión del día** según dónde estás en la ruta.

### IA real (opcional, con tu propia clave)

En **Perfil › Ajustes › Mentor con IA** puedes conectar una clave de API de Anthropic y entonces las preguntas abiertas del chat las responde Claude, con el contexto de tu perfil y de tu expediente **Mi Negocio**.

Por qué funciona así y no con una clave nuestra: esto es un sitio estático, no hay servidor donde esconder una clave. Cualquier clave incrustada en el JavaScript sería pública y se agotaría en horas. Así que la clave es tuya, se guarda **solo en tu navegador** y se manda **solo a `api.anthropic.com`**.

Lo que conviene saber antes de activarla:

- Tu clave **nunca sale en el respaldo `.json`** de tu progreso: vive en otra entrada de `localStorage` justamente para eso.
- Con la IA activa, tus mensajes y los datos de tu expediente se envían a Anthropic para poder responder.
- El consumo lo cobra Anthropic a tu cuenta. Puedes elegir modelo (Haiku 4.5, Sonnet 5 u Opus 5) según cuánto quieras gastar.
- No la actives en un dispositivo compartido.
- Si la llamada falla —sin red, clave caducada, sin saldo— **responde el motor local**. Nunca te quedas sin mentor.

Las calculadoras, las prácticas guiadas y la evaluación de misiones siguen siendo locales aunque la IA esté encendida: son deterministas y ahí un modelo daría peores resultados que una rúbrica.

> El punto de entrada de la IA es `AI.ask()` en `js/core/ai.js`; el del motor local, `Mentor.reply()` en `js/core/mentor.js`.

---

## Elementos de juego

Racha diaria con congeladores · XP y 10 rangos · 5 vidas que se regeneran cada 30 min · monedas y tienda · 26 insignias · 7 ligas semanales · 5 retos semanales · mapa visual de progreso · meta diaria ajustable · modo oscuro · sonido sintetizado (sin archivos) · vibración háptica.

**La tienda** (5 artículos, todos con efecto real):

| | |
|---|---|
| ❤️ Recarga de vidas | Rellena las 5 al instante |
| 🧊 Congelador de racha | Salva la racha un día que falles |
| ⚡ XP doble | 30 minutos, con indicador en la barra superior |
| 💡 Pistas | Descartan una opción incorrecta dentro de la lección |
| 🔬 Auditoría del negocio | Evalúa las 12 secciones de Mi Negocio y te da las 3 prioridades |

---

## Estructura

```
EMPRENDO/
├── index.html
├── manifest.webmanifest     nombre, iconos y accesos directos de la app
├── sw.js                    service worker: instalable y sin conexión
├── serve.js                 servidor local opcional
├── assets/
│   ├── fonts/               Nunito (variable, woff2) — no se pide a Google
│   ├── icons/               192, 512, maskable y apple-touch
│   └── og-image.png         portada al compartir el enlace (1200×630)
├── css/
│   ├── fonts.css            @font-face de la tipografía local
│   ├── tokens.css           colores, tipografía, sombras, temas
│   ├── base.css             reset y layout
│   ├── components.css       botones, tarjetas, opciones, fichas…
│   ├── screens.css          cada pantalla
│   └── animations.css       todos los keyframes
└── js/
    ├── core/
    │   ├── store.js         estado + persistencia + rachas
    │   ├── engine.js        ruta, XP, vidas, insignias, ligas
    │   ├── mentor.js        rúbricas, análisis de texto, calculadoras
    │   ├── ai.js            IA opcional con la clave del usuario
    │   ├── ui.js            DOM, router, modales, toasts
    │   ├── fx.js            confeti, partículas, contadores
    │   ├── audio.js         sonido sintetizado con WebAudio
    │   └── mascot.js        Chispa (SVG animable, 7 estados de ánimo)
    ├── data/
    │   ├── config.js        niveles, jefes, insignias, ligas, tienda
    │   ├── lessons-1..8.js  las 50 microlecciones
    │   ├── sim.js           simulador: modelo y 22 eventos
    │   └── mentor-kb.js     intenciones y prácticas del mentor
    ├── screens/             una pantalla por archivo
    └── app.js               arranque y navegación
```

Sin dependencias, sin build, sin framework. Scripts clásicos para que funcione incluso abriendo el archivo directamente.

> **Al publicar una versión nueva**, sube `VERSION` en `sw.js`. Ese cambio es lo que hace que quien ya tenga la app instalada reciba los archivos nuevos en vez de seguir viendo la copia guardada.

---

## Añadir contenido

Una lección nueva es un objeto en cualquier `js/data/lessons-N.js`:

```js
{
  id: 'n1-08', level: 1, icon: '🎯', title: 'Título', xp: 25, min: 6,
  concept: { tag: 'Concepto', title: '…', body: ['…'], keys: ['…','…','…'] },
  cas:     { emoji: '🧁', title: '…', text: '…' },
  steps: [
    { type: 'quiz', q: '…', opts: [{ t:'…', ok:true, why:'…' }], explain: '…' }
  ],
  mission: {
    id: 'm1-08', title: '…', brief: '…', dossier: 'cliente',
    fields: [{ key:'x', label:'…', type:'text', ph:'…' }],
    rubric: [{ id:'a', label:'…', check:'audience' }],
    reward: { xp: 40, coins: 25 }
  }
}
```

Los `check` disponibles están en `CHECKS` dentro de `js/core/mentor.js` (29 comprobaciones: `audience`, `problem`, `margin`, `steps`, `verbs`, `measurable`…). El campo `dossier` decide qué sección de **Mi Negocio** se llena al entregarla.

---

## Datos y privacidad

Todo se guarda en `localStorage`, solo en tu dispositivo. No hay servidor, no hay cuentas, no hay telemetría. La tipografía viaja dentro del proyecto, así que **la app no hace ni una sola petición a terceros** mientras no actives la IA. Desde **Perfil** puedes exportar tu progreso a un `.json` y volver a importarlo en otro dispositivo.

La única excepción es el mentor con IA, y solo si tú lo enciendes: en ese caso tus mensajes van a `api.anthropic.com` con tu propia clave. Esa clave se guarda aparte y **no se incluye en el `.json` de respaldo**, para que puedas compartir o subir a la nube ese archivo sin filtrarla.

Como no hay servidor, ese archivo es el único respaldo posible, así que la app **te lo recuerda sola**: si pasan más de 7 días sin una copia y ya tienes progreso real, aparece un aviso con los botones para descargarla o copiarla al portapapeles. En **Perfil › Ajustes** se ve la fecha del último respaldo y el recordatorio se puede desactivar.

Los rivales de la liga son simulados: existen para dar ritmo, no para compararte con nadie real.

---

## Aviso

El contenido es formación empresarial general. Las secciones de impuestos y formalización varían por país y por nivel de ingresos: confirma siempre con la autoridad fiscal local o un contador antes de decidir.
