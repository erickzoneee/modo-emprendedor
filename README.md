# 🚀 Modo Emprendedor

**Aprende. Construye. Vende.**

### 👉 [Abrir la app](https://erickzoneee.github.io/modo-emprendedor/)

Una app tipo Duolingo que no te enseña *sobre* emprender: te lleva de una idea a un negocio real, **una misión al día**.

Al terminar la ruta no te llevas un certificado. Te llevas una idea validada, un cliente ideal definido, una oferta escrita, tus precios calculados, una identidad básica, una estrategia de ventas y tus primeros clientes.

---

## Cómo abrirla

**Opción 1 — doble clic (la más simple)**

Abre `index.html` en Chrome, Edge o Firefox. No necesita instalación, ni internet, ni cuenta.

> Nota: algunos navegadores restringen el guardado local en `file://`. Si tu progreso no se guarda entre sesiones, usa la opción 2.

**Opción 2 — servidor local (recomendada)**

```bash
node serve.js
```

Y abre `http://localhost:4321`.

**Opción 3 — publicarla**

Es un sitio estático puro. Sube la carpeta completa a Netlify, Vercel, GitHub Pages o cualquier hosting y funciona igual.

---

## Qué incluye

| | |
|---|---|
| **50 microlecciones** | de 5 a 10 minutos cada una |
| **248 ejercicios** | 9 tipos distintos de interacción |
| **8 niveles** | Descubre → Valida → Construye → Vende → Administra → Crece → Sistematiza → Escala |
| **8 retos reales** | los "jefes finales": se hacen fuera de la app |
| **58 misiones aplicadas** | cada una a tu negocio de verdad |
| **Simulador de empresa** | 12 semanas, 22 eventos, modelo de demanda real |
| **Mentor con IA** | evalúa tus textos, calcula y practica ventas contigo |
| **Expediente Mi Negocio** | 12 secciones que se llenan solas y se exportan |

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

Funciona **sin conexión y sin claves de API**. Es un motor local de análisis de texto y reglas de negocio, no un modelo de lenguaje. Lo que hace:

- **Evalúa tus misiones** contra rúbricas concretas: detecta si dijiste "todos" en vez de un público, si te falta un número, si prometiste un objeto en vez de un resultado, si tus pasos empiezan con verbos, si tu margen es sano…
- **Calcula**: punto de equilibrio, precio sugerido (piso/mercado/valor), costo real de impresión 3D, CAC contra margen, punto de reorden.
- **Practica contigo**: manejo de objeciones, entrevista de descubrimiento y una venta completa, turno por turno.
- **Te da la misión del día** según dónde estás en la ruta.

> Si algún día quieres conectarle un modelo real, el punto de entrada es `Mentor.reply()` en `js/core/mentor.js`. Todo lo demás seguiría funcionando igual.

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
├── serve.js                 servidor local opcional
├── css/
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

Todo se guarda en `localStorage`, solo en tu dispositivo. No hay servidor, no hay cuentas, no hay telemetría. Desde **Perfil** puedes exportar tu progreso a un `.json` y volver a importarlo en otro dispositivo.

Los rivales de la liga son simulados: existen para dar ritmo, no para compararte con nadie real.

---

## Aviso

El contenido es formación empresarial general. Las secciones de impuestos y formalización varían por país y por nivel de ingresos: confirma siempre con la autoridad fiscal local o un contador antes de decidir.
