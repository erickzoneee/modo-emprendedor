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

Y abre `http://localhost:4321`. Por aquí sí se puede **instalar**.

> El **modo sin conexión** no se puede probar en local: el service worker se registra y precarga todo, pero en `localhost` no intercepta ninguna petición a propósito (si lo hiciera, editar un archivo te seguiría enseñando la copia guardada). Para comprobar que la app abre sin red hay que hacerlo sobre la versión publicada.

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
| **Chispa Engine** | reglas, fórmulas y 77 entradas de conocimiento. Calcula tu precio preguntándote solo lo que falta, y recuerda lo que decidiste |
| **Perfil del emprendimiento** | tu idea registrada al entrar: personaliza lecciones, desafíos, planes y recomendaciones |
| **Se contesta hablando o tocando** | 8 formas de responder — nota de voz, tarjetas, botones, escalas, deslizar, completar frases, ejemplos y escribir. Escribir es una opción, no la única |
| **Captura progresiva** | 21 preguntas que Chispa hace de una en una, al terminar una lección. Nunca dos veces lo mismo, y «todavía no lo sé» no penaliza |
| **La app se adapta a tu negocio** | color secundario, ejemplos del oficio, orden del panel y Chispa con delantal, herramienta y su espacio de trabajo |
| **Expediente Mi Negocio** | 12 secciones que se llenan solas y se exportan |
| **Lectura en voz alta** | escucha las lecciones y las respuestas con la voz del dispositivo |
| **La Plaza** | Tu puesto, con lo que ya contaste. Sale solo lo que apruebes, y nunca tus números |
| **Decora tu puesto** | 33 piezas en 5 ranuras: el toldo, su color, el letrero, lo que hay alrededor y sobre qué está montado. Gratis desde el primer día |
| **Iconos propios** | 60 piezas dibujadas a mano en el mismo lenguaje que Chispa. Nada de emoji del sistema: se ven igual en cualquier teléfono y se mueven |

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

`quiz` una respuesta · `multi` varias respuestas · `tf` verdadero o falso · `order` ordenar pasos · `match` emparejar · `fill` completar la frase · `slider` elegir un número con consecuencias · `sim` decisión con impacto animado · `write` escribir —o dictar— y que el mentor lo revise

---

## El simulador

Además de construir tu proyecto, administras una empresa virtual durante 12 semanas. Cada semana decides **precio, cuánto material compras y cuánto inviertes en publicidad**, y enfrentas un evento: un proveedor que sube precios, un cliente molesto, un pedido mayorista con pago a 60 días, una máquina descompuesta, alguien que te copia…

El modelo calcula demanda a partir de tu precio (elasticidad), tu reputación y tu publicidad, y la limita por tu inventario y tu capacidad. Distingue **utilidad de flujo de efectivo**: puedes ser rentable en papel y quedarte sin dinero. Es el error que más negocios pequeños mata, y aquí lo cometes gratis.

---

## Chispa, el mentor

Chispa no busca respuestas: **decide con qué responderte**. Cada mensaje recorre siete niveles y se detiene en el primero que resuelva de verdad.

| | Nivel | Qué hace |
|---|---|---|
| 1 | **Intención** | Qué quieres hacer |
| 2 | **Perfil** | Qué sabe ya de tu negocio |
| 3 | **Huecos** | Qué dato falta → pregunta **uno**, no seis |
| 4 | **Fórmula** | Precio, margen, punto de equilibrio: se calculan, no se opinan |
| 5 | **Conocimiento** | Los fragmentos aplicables de la base, filtrados por tu sector |
| 6 | **Plantilla** | Compone la respuesta con tus datos reales |
| 7 | **Generativo** | Solo si aporta lo que una plantilla no puede |

Los seis primeros niveles no gastan un byte de red y responden en **menos de un milisegundo**.

Un ejemplo real: a *"¿en cuánto debo vender mi producto?"* detecta la intención, mira qué números ya conoce, pregunta uno a uno los que faltan, calcula, te explica el resultado con tus cifras y **guarda el precio como decisión**. La segunda vez no pregunta nada.

> El modelo generativo nunca es la fuente de la verdad. Cuando se llega al nivel 7, Chispa le entrega los hechos ya resueltos y el modelo solo redacta.

### Las cuatro vías del nivel 7

Ninguna es obligatoria. Si no hay ninguna, Chispa responde igual con los niveles 1 a 6.

**1 · IA gratuita de Emprendo** — un Worker de Cloudflare con Workers AI. No necesitas cuenta ni clave: solo que el dueño de la instancia lo haya desplegado. Es gratis para todos y no puede generar cobros: al agotarse la cuota diaria corta en vez de facturar. Instrucciones en [`worker/README.md`](worker/README.md).

**2 · IA local de Chispa** — un modelo abierto que corre **dentro de tu navegador**: sin conexión, sin costo y sin que nada salga del dispositivo. Es una descarga voluntaria de entre 879 MB y 2,5 GB, nunca automática, y la app comprueba antes si tu equipo puede. En iPhone y iPad no se ofrece: iOS limita la memoria de una página muy por debajo de lo que pide el modelo más pequeño.

**3 · Tu clave personal** — en **Perfil › Mentor con IA** puedes conectar una clave de Anthropic. Tiene prioridad sobre las demás: si la configuraste, es porque quieres ese modelo.

**4 · Las respuestas escritas** — 26 temas con respuesta desarrollada a mano, que se usan cuando no hay ninguna IA disponible.

### Lo que nunca pasa por un modelo

Las calculadoras, las rúbricas de las misiones y las prácticas guiadas son deterministas a propósito. Un precio calculado se puede comprobar con una calculadora; uno redactado por un modelo es una opinión con formato de número.

> Puntos de entrada: `Chispa.responder()` en `js/core/chispa.js`, la base en `js/data/kb.js`, y el enrutado de proveedores en `AI.ask()` dentro de `js/core/ai.js`.

---

## Cuéntale a Chispa como quieras

La app necesita conocer el negocio para poder hablar de él. Lo que cambió no es qué
pregunta, sino **cómo se contesta**.

| Forma | Para qué |
|---|---|
| 🎤 **Nota de voz** | La idea, el problema que resuelve, la competencia: lo que cuesta escribir |
| 🃏 **Tarjetas** | El sector, la etapa, el objetivo: respuestas cerradas, con dibujo y ejemplo |
| ⚡ **Botones rápidos** | Presupuesto, tiempo, frecuencia: rangos que se tocan sin teclado |
| 📊 **Escalas** | Experiencia y avance, sin pedir un número |
| 👉 **Deslizar** | Listas largas —dónde vendes— de una tarjeta en una: *sí · tal vez · no* |
| 🧩 **Completar la frase** | La propuesta de valor, armada eligiendo piezas |
| 🖼️ **Ejemplos parecidos** | Reconocer el negocio en un ejemplo cuando no sale describirlo |
| ✍️ **Escribir** | Siempre disponible, para quien lo prefiera |

Y en todas, salvo la idea: **«Todavía no lo sé»**. No penaliza, no bloquea y no vuelve a
preguntarse en una semana.

### El registro son cuatro preguntas

Idea, sector, cliente y etapa. Nada más. Lo demás —la oferta, el objetivo, el presupuesto,
el tiempo, la experiencia— **lo aprende Chispa después**, una pregunta al terminar cada
lección, con un tope de tres al día. Cada respuesta sale de la cola para siempre.

### «Esto entendí»

Al acabar el registro, Chispa devuelve en dos frases lo que armó, con **lo deducido
subrayado**, y espera:

> **Sí, así es** · **Quiero corregir algo** · **Todavía no lo tengo claro**

Tocar cualquier trozo subrayado abre justo la pregunta que lo escribió, en el mismo modo
en el que se contestó. Nada se guarda sin pasar por aquí: lo dictado se enseña escrito
antes de guardarlo, y lo deducido se enseña marcado antes de darlo por bueno.

### Revisar, corregir u olvidar

En **Mi emprendimiento** está todo lo capturado, con **cómo se contó** cada cosa (voz,
tarjeta, escala, deslizar). Cualquier línea se toca para cambiarla, y dentro está
**«Que Chispa lo olvide»**: borra el dato del perfil y deja que se pueda volver a
preguntar desde cero.

> Puntos de entrada: el catálogo en [`js/data/preguntas.js`](js/data/preguntas.js), el motor
> en `Captura.bloque()` y `Captura.siguiente()` dentro de [`js/core/captura.js`](js/core/captura.js),
> y el reconocimiento de voz en [`js/core/dictado.js`](js/core/dictado.js).
> Se verifica con `node tools/check-captura.js`.

### Lo que la nota de voz no hace

El audio **no se guarda en ningún sitio** y no llega a ningún servidor de Emprendo: quien
convierte la voz en texto es el reconocimiento del propio navegador, igual que cuando
dictas un mensaje en el teclado del teléfono. Algunos navegadores hacen esa transcripción
en sus servidores, y eso está escrito tal cual en [privacidad.html](privacidad.html): la
app no promete lo que no puede cumplir. Donde no se puede dictar —Firefox de escritorio,
sin permiso de micrófono— el botón sencillamente no aparece y se escribe.

---

## La app se adapta a tu negocio

Al registrar tu idea eliges tu sector, y a partir de ahí la app deja de ser genérica: **no cambia de forma, cambia de tema**.

| Qué se adapta | Qué NO se toca |
|---|---|
| El color secundario y los acentos | El naranja de marca, la tipografía, la estructura y la navegación |
| Los ejemplos de cada lección | Las 50 lecciones, que son las mismas para todos |
| El orden de las tarjetas del panel y de los 7 análisis | El mapa de la ruta |
| Lo que Chispa lleva puesto y su espacio de trabajo | Su cuerpo, su cara y su chispa de ocho puntas |

Una pastelería lee *"pesa los ingredientes de un solo pedido y súmale gas, empaque y tu hora de trabajo"*; un taller de impresión 3D, *"súmale las horas de máquina, la luz, las piezas falladas y tu tiempo de acabado"*. No es la misma frase con otra palabra: son dos oficios distintos.

**Chispa es una sola.** Se le añaden capas —delantal, lentes, herramienta, un banco de trabajo detrás— pero nunca se le cambia el cuerpo ni la cara. Los accesorios están dibujados para rodear su chispa, no para taparla: es lo que la hace reconocible.

Cuando cambias la descripción de tu negocio, la app **pregunta** antes de tocar nada. Y si eliges un color a mano, deja de proponerte otro.

En **Mi emprendimiento › Personalizar mi experiencia** decides el color, los accesorios, cuánto quieres que se note —sutil, media o visible— o lo apagas del todo y la app vuelve a verse igual para todo el mundo.

### Cómo funciona por dentro

La IA puede leer tu descripción y proponer una clasificación, pero **no genera CSS, ni rutas, ni colores**. Devuelve un JSON que se valida clave por clave contra listas cerradas; si algo no está en la lista, la propuesta entera se descarta y manda el clasificador por palabras clave, que funciona sin conexión y sin costo. Y ninguna propuesta se aplica sin que la aceptes.

Los colores viven solo en `css/temas.css`. `js/core/persona.js` no escribe ni un color: escribe atributos en `<html>` y deja que la cascada decida. Eso es lo que hace que el modo oscuro siga funcionando y que un valor inventado simplemente no pinte nada. Las 7 paletas están medidas: texto sobre fondo por encima de 4.5:1 en claro y en oscuro, y ningún tema toca el azul del foco de teclado.

> Puntos de entrada: `Persona.actual()` en `js/core/persona.js`, las listas blancas en `js/data/config.js` (`TEMAS`, `PERSONALIDADES`), los accesorios en `js/data/mascota-capas.js` y los ejemplos por oficio en `EXAMPLE_BY_SECTOR` dentro de `js/data/venture-templates.js`.

---

## La Plaza y tu puesto

La Plaza es el único sitio de la app donde hay alguien más. Tu emprendimiento se enseña
como un **puesto de mercado**: un toldo con tu oficio y, debajo, el nombre y una frase.

### Sale solo lo que apruebes

La vitrina se arma sola con lo que ya le contaste a Chispa. Antes de abrir el puesto se
ve **entera, línea por línea**, y cada línea se puede corregir a mano. Lo que nunca sale
está escrito y verificado a máquina: tus precios y costos, tu plan y tus decisiones, tu
ciudad y tus contactos, tu presupuesto y tu experiencia, y tu progreso.

`tools/check-vitrina.js` arma un perfil de mentira lleno de datos privados, construye la
vitrina y comprueba que ninguno sale. Si alguien amplía la lista de lo publicable sin
declararlo, el verificador falla antes de que llegue a publicarse.

### La Plaza es un lugar, no una lista

Detrás del puesto hay una plaza de verdad: cielo, horizonte con más puestos al fondo,
faroles, una guirnalda cruzando, empedrado que se aleja y motas de luz. Todo se mueve a
distinta velocidad al hacer scroll, así que se lee como profundidad. De noche no cierra:
se enciende.

Está hecho **sin librerías, sin `perspective` y sin una sola imagen**: gradientes, máscaras
y una variable —`--pz-scroll`— que la pantalla escribe al desplazarse y de la que salen
los diez planos. Quien pidió menos movimiento ve el mundo entero, quieto.

**No hay vecinos inventados, y no los va a haber.** La Liga puede permitirse rivales
simulados porque ahí lo que está en juego son puntos; aquí el botón dice "Veo valor" y un
vecino que nunca contesta sería una mentira. Lo que sí hay son **sitios libres**: la plaza
tiene espacio, y eso es verdad. Tocar uno invita a alguien que conoces.

### Decorar tu puesto

**Mi negocio › La Plaza › Decorar mi puesto.** Cinco ranuras y 33 piezas, todas
disponibles desde el primer día:

| Ranura | Piezas |
|---|---|
| **El toldo** | Festón, rayas, picos, ondas, cuadros, lona |
| **De qué color** | El de tu oficio y 9 colores más |
| **El letrero** | Sin marco, tabla de madera, pizarra, placa esmaltada, cinta pintada |
| **Lo que hay alrededor** | Nada, macetas, farol, banderines, cajas, pizarrón, girasoles |
| **Sobre qué está** | Nada, tarima, tapete, adoquín, pasto |

La vista previa de arriba **es el puesto de verdad**, con los mismos componentes y las
mismas piezas que la Plaza. No hay maquetas: si algo se ve mal ahí, se ve mal allí.

Cada toque se guarda solo y, si tu puesto ya está abierto, sale hacia la Plaza sin
preguntar nada. El texto sí pasa por «Así está bien», porque lo escribió la app y hay que
revisarlo; la decoración no, porque la elegiste tú mirando el puesto entero mientras la
elegías.

### Cómo funciona por dentro

Es la misma idea que las capas de Chispa, un escalón más arriba. `js/data/puesto-piezas.js`
es un **catálogo cerrado**: los colores no viven ahí, viven en `css/puesto.css`, así que
una clave que no exista simplemente no pinta. `js/core/puesto.js` tiene una sola puerta
—`limpio()`— por la que pasa todo: lo que elige el usuario, lo que se guarda, lo que se
publica y lo que llega de otra persona.

La lista blanca está escrita **tres veces** a propósito: en el teléfono, en el Worker y en
el `CHECK` de la base. El Worker no puede fiarse del cliente, porque un cliente modificado
existe en cuanto la app es pública. Que las tres no se separen lo comprueba
`tools/check-puesto.js`, que además mide cada dibujo para que ninguna pieza se salga de su
franja ni acabe encima del texto del puesto.

El interruptor de **Personalizar mi experiencia** manda también aquí: apagado, tu puesto
se ve —y se publica— tal y como venía. Lo que elegiste no se borra; solo deja de
enseñarse.

> Puntos de entrada: `js/data/puesto-piezas.js` (el catálogo), `js/core/puesto.js`
> (validación y estado), `js/screens/puesto.js` (la pantalla), `css/puesto.css` (las
> piezas) y `css/plaza.css` (el lugar). La maqueta viva está en `lab/plaza-mundo.html`.

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
│   ├── captura.css          las 8 formas de contestar
│   ├── screens.css          cada pantalla
│   ├── animations.css       todos los keyframes
│   ├── iconos.css           el alfabeto visual dibujado a mano
│   ├── plaza.css            el lugar: cielo, horizonte, faroles y puestos
│   ├── puesto.css           lo que el usuario le pone encima a su puesto
│   ├── temas.css            el color secundario por tipo de negocio
│   └── splash.css           la pantalla de arranque
├── worker/                  IA gratuita: Worker de Cloudflare (se despliega aparte)
├── worker-plaza/            la Plaza: cuentas, vitrinas y conversaciones (aparte también)
├── docs/                    investigación de proveedores y de Chispa Engine
├── lab/                     laboratorio aislado: modelos locales, captura y la Plaza
├── tools/
│   ├── check-precache.js    cuadra index.html con el precache del sw
│   ├── check-captura.js     ejecuta el motor de la captura y lo verifica
│   ├── check-catalogo.js    que todos los logros compartibles sean alcanzables
│   ├── check-motor.js       las razones para acercarse a un vecino
│   ├── check-vitrina.js     que de la vitrina no salga nada que no se dijo
│   ├── check-puesto.js      que las tres listas de piezas no se separen
│   └── check-plaza-worker.js  ejecuta el Worker de la Plaza contra sus reglas
└── js/
    ├── core/
    │   ├── store.js         estado + persistencia + rachas
    │   ├── venture.js       perfil del emprendimiento: los 3 niveles de contexto
    │   ├── chispa.js        el motor: intención, huecos, fórmulas, plantillas
    │   ├── personalize.js   reescribe lecciones y desafíos sobre tu idea
    │   ├── persona.js       la apariencia: tema, accesorios y orden del panel
    │   ├── engine.js        ruta, XP, vidas, insignias, ligas
    │   ├── mentor.js        rúbricas, análisis de texto, calculadoras
    │   ├── ai.js            elige proveedor de IA y arma el contexto
    │   ├── ai-worker.js     cliente de la IA gratuita de Emprendo
    │   ├── local-ai.js      diagnóstico del equipo y descarga opcional
    │   ├── speech.js        lectura en voz alta con la voz del dispositivo
    │   ├── dictado.js       la nota de voz: reconocimiento del aparato → texto
    │   ├── captura.js       las 8 formas de contestar y qué preguntar después
    │   ├── ui.js            DOM, router, modales, toasts
    │   ├── fx.js            confeti, partículas, contadores
    │   ├── audio.js         sonido sintetizado con WebAudio
    │   ├── plaza.js         la vitrina: qué se puede enseñar y qué nunca
    │   ├── plaza-motor.js   por qué te conviene acercarte a un vecino
    │   ├── plaza-nube.js    lo único que habla con un servidor sobre personas
    │   ├── puesto.js        cómo decoró su puesto, y la lista blanca que lo guarda
    │   └── mascot.js        Chispa (SVG animable, 7 estados de ánimo)
    ├── data/
    │   ├── config.js        niveles, jefes, insignias, ligas, tienda
    │   ├── preguntas.js     lo que Chispa quiere saber y cómo se contesta
    │   ├── lessons-1..8.js  las 50 microlecciones
    │   ├── kb.js            base de conocimiento de Chispa (77 entradas)
    │   ├── venture-templates.js  plantillas de desafío por tema y por oficio
    │   ├── mascota-capas.js  accesorios de Chispa, por capas
    │   ├── puesto-piezas.js  las 33 piezas con las que se decora un puesto
    │   ├── sim.js           simulador: modelo y 22 eventos
    │   └── mentor-kb.js     las 26 respuestas escritas del mentor
    ├── local/               motor de la IA local — NO va en el precache
    ├── screens/             una pantalla por archivo
    │   ├── personaliza.js   "Personalizar mi experiencia": vista previa y controles
    │   ├── plaza.js         la Plaza, la vitrina y las conversaciones
    │   └── puesto.js        "Decorar mi puesto": vista previa y las 5 ranuras
    └── app.js               arranque y navegación
```

Sin dependencias, sin build, sin framework. Scripts clásicos para que funcione incluso abriendo el archivo directamente.

> **Al publicar una versión nueva**, sube `VERSION` en `sw.js`. Ese cambio es lo que hace que quien ya tenga la app instalada reciba los archivos nuevos en vez de seguir viendo la copia guardada. Si no lo subes, a quien ya la instaló le llega el HTML nuevo con el JavaScript viejo.

Antes de publicar, comprueba que el precache siga cuadrando:

```bash
node tools/check-precache.js
```

Y que lo demás siga cuadrando:

```bash
node tools/check-captura.js
```

```bash
node tools/check-vitrina.js
```

```bash
node tools/check-puesto.js
```

```bash
node tools/check-plaza-worker.js
```

Ese carga el catálogo y el motor de verdad, y comprueba lo que no da error cuando se
rompe: que ninguna pregunta guarde en un sitio que no existe, que contestarla la saque de
la cola para siempre, que saltarla no la traiga de vuelta al día siguiente, que las
respuestas cerradas no acepten texto inventado y que el «esto entendí» no diga nada que
no esté en el perfil.

Compara los archivos que carga `index.html` con la lista `PRECACHE` de `sw.js`. Las dos se escriben a mano y el service worker precarga uno por uno con su propio `catch`: una ruta que falte solo deja un aviso en la consola y la app deja de abrir sin conexión sin que nadie se entere.

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

Las excepciones son las vías de IA, y solo si tú las enciendes:

| Vía | A dónde van tus datos |
|---|---|
| **IA local de Chispa** | A ningún sitio. El modelo corre en tu dispositivo |
| **IA gratuita de Emprendo** | Al Worker de quien publicó la app, que los pasa a Workers AI. Cloudflare declara que no entrena con ellos |
| **Tu clave personal** | A `api.anthropic.com`, con tu propia clave |

Ni la clave de API ni la dirección del Worker se incluyen en el `.json` de respaldo: viven en otras entradas de `localStorage` justamente para que puedas compartir o subir ese archivo sin filtrarlas.

Como no hay servidor, ese archivo es el único respaldo posible, así que la app **te lo recuerda sola**: si pasan más de 7 días sin una copia y ya tienes progreso real, aparece un aviso con los botones para descargarla o copiarla al portapapeles. En **Perfil › Ajustes** se ve la fecha del último respaldo y el recordatorio se puede desactivar.

Los rivales de la liga son simulados: existen para dar ritmo, no para compararte con nadie real.

---

## Aviso

El contenido es formación empresarial general. Las secciones de impuestos y formalización varían por país y por nivel de ingresos: confirma siempre con la autoridad fiscal local o un contador antes de decidir.
