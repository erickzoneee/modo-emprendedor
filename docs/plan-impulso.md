# Plan: Emprendo Impulso

**Estado:** **fases 1 y 2 escritas y probadas. Los cinco beneficios están listos.**
Falta que tú consigas las claves de Stripe, la de Anthropic y el identificador de
AdSense, y que despliegues los Workers. Ver la sección 8.
**Maqueta:** [`lab/impulso.html`](../lab/impulso.html) — los seis momentos con la ropa real.
**Base:** 9 lectores sobre el código real + un crítico, commit `3aae621`.

---

## Decisiones tomadas

| Pregunta | Decidido | Consecuencia |
|---|---|---|
| **Con qué se cobra** | **Stripe** | Checkout de suscripción en pestaña nueva, webhook con firma propia, portal de cliente para cancelar. De 99 MXN quedan ~92 netos |
| **La deuda del «no ganarás XP»** | **Media XP sin energía** | La energía regula de verdad, pero castiga la mitad. Hay que reescribir el texto del modal, que hoy promete cero |
| **Anuncios** | **Red publicitaria desde el principio** | Entran en la fase 1, y con ellos la reescritura de los seis textos de la sección 4 **en el mismo cambio**. Ver 4.1 |
| **Orden** | **Cobrar → beneficios → contenido** | Fase 1 A, fase 2 B, fase 3 C. Ver sección 7 |

---

## 0. Lo primero: esto son tres proyectos, no uno

Lo que pediste se ve como una cosa —"monetización"— pero por dentro son tres cuerpos de
trabajo con riesgos, tamaños y tiempos completamente distintos:

| # | Proyecto | Tamaño | Riesgo | Toca |
|---|---|---|---|---|
| **A** | **Cobrar** — cuenta, pase, pantalla, energía ilimitada | ~6 archivos + 1 Worker nuevo | **Alto** (es el primer dinero del proyecto) | `store`, `engine`, `lesson`, `home`, `worker-plaza`, textos legales |
| **B** | **Los cinco beneficios** — Chispa, plan semanal, materiales | ~5 archivos nuevos | Medio | `chispa`, `mentor`, `personalize`, pantallas nuevas |
| **C** | **200 lecciones y 50 retos** | 150 lecciones + 42 retos + rearquitectura de carga | **Muy alto por volumen** | `engine`, `config`, `index.html`, `sw.js`, 8 archivos de datos |

**C es más grande que A y B juntos, por mucho.** Hoy hay 50 lecciones que ocupan 251,7 KB.
Llegar a 200 son ~1,0 MB de lecciones nuevas escritas a mano, más 42 retos reales con sus
campos y sus rúbricas. Eso no es una tarde de código: es un proyecto de contenido con su
propia línea de producción.

**Orden recomendado: A → B → C**, y dentro de C primero la arquitectura y después el
contenido en tandas por nivel.

Por qué A antes que C, aunque C sea lo que más valor da: porque el precio de Impulso se
sostiene igual con 50 lecciones que con 200 —el contenido es gratis en los dos casos— y
porque cada semana que pasa sin cobrar es una semana de Cloudflare pagada de tu bolsillo.
C puede entrar después sin tocar nada de A.

---

## 1. Lo que el código ya te regala

Antes de proponer nada, esto es lo que ya está hecho y no hay que inventar:

| Ya existe | Dónde | Qué significa para Impulso |
|---|---|---|
| **Una sola puerta que resta energía** | `Engine.loseHeart()` — `js/core/engine.js:156` | Energía ilimitada son 3 líneas: un `return` temprano. Un solo llamador en toda la app (`lesson.js:443`) |
| **Cuentas de verdad, con correo que no se guarda** | `worker-plaza/src/index.js:428-469` | No hay que inventar identidad. Enlace mágico de 15 min → sesión de 30 días |
| **Un solo punto donde el servidor sabe quién llama** | `quienEs()` — `index.js:257` | Es donde se comprueba el plan y donde caduca solo, sin necesidad de cron |
| **Precedente de migración sobre la base viva** | `migrations/0002_estilo.sql` | Añadir `plan` y `plan_hasta` a `cuenta` con DEFAULT no rompe ninguna cuenta abierta |
| **Un contador atómico por ventana ya probado** | tabla `pedido` — `index.js:388-399` | El molde exacto para contar consultas de IA por cuenta |
| **El mapa de emprendimientos ya es un mapa** | `state.ventures = { activeId, list }` — `store.js:89` | Los 3 y los 5 negocios no necesitan migrar datos, solo abrir la API |
| **Motor de migraciones del estado, escrito y sin estrenar** | `ESQUEMA`/`MIGRACIONES` — `store.js:190` | Mover el progreso dentro del emprendimiento tiene carril |
| **Plantillas deterministas con los datos del negocio** | `Mentor.improve()` (4 salidas) + `venture-templates.js` | Los "materiales listos" son ampliar esto, no empezar de cero |
| **Canvas 2D que ya dibuja con la tipografía y con Chispa** | `js/core/comparte.js:475-560` | Los "documentos profesionales" tienen motor |
| **El modelo de "limitar sin bloquear", ya escrito** | La cascada de IA — `ai.js:477`, `mentor.js:236` | *«Se acabó la IA gratuita por hoy. Chispa sigue funcionando sin ella»*. Ese es el tono de todo Impulso |

Y una propiedad que vale oro y que descubrimos leyendo: **`Store.reset()` no toca la clave
de la Plaza**. Quien borre todo su progreso conserva su cuenta y, por tanto, su
suscripción. Si el plan viviera en el Store, "Reiniciar todo" borraría lo que pagó.

---

## 2. La parte difícil: cómo se sabe que alguien pagó

### 2.1 En el teléfono no se puede saber. Punto.

El estado entero es un JSON en `localStorage`. Y el camino de importación lo bendice:
`limpiar()` copia todas las claves del respaldo salvo tres, e `importJSON()` hace
`merge(defaults(), respaldo)` donde **gana el respaldo** (`store.js:289-304`, `546-552`).
Añadir `plan: 'impulso'` a `defaults()` no protege nada: un `.json` editado a mano con esa
clave entra tal cual.

Ya hay un precedente de campo que nace fuera del esquema y que nadie valida: `state.iaCuota`
no está en `defaults()` ni en las listas de `inspectBackup()`. Su propio autor lo declara
por escrito como *"contador de uso, no barrera de seguridad"* (`ai-worker.js:82-89`). El
plan no puede heredar ese agujero.

### 2.2 La propuesta: un pase firmado

```
El teléfono pide           El servidor devuelve              El teléfono guarda
─────────────────          ────────────────────              ─────────────────
op: 'pase'          →      { cuenta, hasta, plan }     →     el pase entero,
+ token de sesión          + firma ECDSA P-256               tal cual, en su clave
                                                             (fuera del Store)
```

- La **clave privada** vive como secreto del Worker. La **pública** va escrita en el código
  de la app, igual que hoy va la dirección del Worker.
- La app verifica la firma con `crypto.subtle.verify` — sin red, en un milisegundo.
- `hasta` = fin del periodo pagado **+ 3 días de gracia**. Se renueva sola cada vez que la
  app tiene red.
- Un pase editado a mano no verifica. Un pase copiado de otra persona sí funciona, pero
  caduca igual.

**Lo que esto sí resuelve:** que cambiar un valor en `localStorage` te dé Impulso gratis.
Ese es el fraude real, el que hace cualquiera con dos minutos y F12.

**Lo que no resuelve, y hay que decirlo:** la app es JavaScript que se descarga entero. Quien
sepa parchear el código puede saltárselo siempre. En una app así eso no tiene solución, y
perseguirlo solo empeora la experiencia de quien paga. El objetivo es que nadie se lo salte
**sin querer o tocando un valor**, no que sea inviolable.

**Dónde vive el estado de verdad:** dos columnas nuevas en la tabla `cuenta`, con el molde
de la migración `0002`:

```sql
ALTER TABLE cuenta ADD COLUMN plan TEXT NOT NULL DEFAULT 'gratis'
  CHECK (plan IN ('gratis','impulso'));
ALTER TABLE cuenta ADD COLUMN plan_hasta INTEGER NOT NULL DEFAULT 0;
```

En `cuenta` y no en una tabla aparte, por una razón concreta: `borrarme()` se lleva `cuenta`
en cascada. Las tablas sin clave foránea (`bloqueo`, `denuncia`, `enlace`, `pedido`) hay que
borrarlas a mano en el array `pasos`, y una tabla nueva heredaría esa trampa.

La caducidad no necesita cron: se comprueba `plan_hasta > ahora` dentro de `quienEs()`, que
es el punto por el que ya pasa absolutamente todo.

### 2.3 El webhook no puede entrar por la puerta de la Plaza

El Worker valida el `Origin` contra la lista blanca **antes que nada** y devuelve 403 a
cualquier petición sin esa cabecera (`index.js:98-106`). Una pasarela de pago no manda
`Origin`. Hoy su aviso moriría ahí.

Abrir esa puerta es el cambio de más riesgo de todo el proyecto: esa comprobación **es** el
modelo de seguridad de la Plaza entera.

**Propuesta: un Worker nuevo, `worker-pago/`, con el mismo enlace a la misma base D1.**

- Recibe el webhook de la pasarela y verifica **su firma**, no el origen.
- Escribe `plan` y `plan_hasta` en `cuenta`.
- Sirve `op: 'pase'` y `op: 'portal'` (cancelar) a la app, con su propia lista blanca de
  origen y su propia copia corta de `quienEs()`.
- **`worker-plaza/` no se toca en la fase A.** Solo su base recibe una migración aditiva.

### 2.4 Volver del pago

El router es solo memoria: no hay hash ni History API (`ui.js:387-436`). Recargar siempre
vuelve al arranque, y el botón Atrás del navegador no funciona. Una pantalla de pago que
dependa de "volver de un dominio externo" **no tiene forma de recuperar su sitio hoy**.

Por eso el pago se abre en **pestaña nueva**, y cuando la app recupera el foco
(`visibilitychange`, que ya se escucha en `app.js:433`) pide el pase otra vez. Sin tocar el
router, y funciona igual dentro de la app instalada.

### 2.5 Tres consecuencias que hay que escribir en pantalla

1. **Para pagar hace falta un correo.** Hoy el 100% del progreso es anónimo y la cuenta de
   la Plaza está enterrada dentro de Mi Negocio, detrás de una condición. Suscribirse
   introduce un paso que casi nadie ha dado nunca.
2. **El respaldo `.json` no lleva la suscripción**, y no debe llevarla: la sesión vive fuera
   del estado justo porque ese archivo se comparte por WhatsApp. Cambiar de teléfono
   restaurando el respaldo recupera XP, racha y expediente, **pero no Impulso**. Hay que
   decirlo en la tarjeta de respaldo (`profile.js:233-270`, donde hoy no se dice nada) y en
   la pantalla de Impulso: *«Para recuperarlo, entra con tu correo. El respaldo no lo trae.»*
3. **`borrarme()` borra de verdad**, y se llevaría el plan aunque el cobro siga vivo en la
   pasarela. Hay que decidir política antes de escribirlo: lo sensato es cancelar la
   suscripción en la pasarela **dentro** de `borrarme()`, y avisar antes.

---

## 3. Los cinco beneficios de la primera entrega

### 3.1 Energía ilimitada — y el problema que destapa

Es tres líneas de código. Pero leyendo el código apareció esto:

> El modal de cero vidas dice *«…o seguir practicando sin vidas (no ganarás XP)»*
> (`lesson.js:1266`). **Ningún código lo aplica.** `onPrimary()` acumula XP en cada acierto
> sin mirar las vidas y `finish()` llama a `addXP()` incondicionalmente
> (`lesson.js:429-430`, `1313`).

O sea: **hoy la energía no regula nada**. Quien pulsa "Seguir sin vidas" acaba exactamente
igual que un suscriptor. Si Impulso sale así, su beneficio número uno ya existe gratis
detrás de un botón, y además la app lleva meses prometiendo un castigo que no aplica.

Tú lo dijiste con esta frase: *"la energía solamente regula la velocidad a la que avanza"*.

**Decidido: media XP sin energía.** Sin energía se sigue aprendiendo, la lección cuenta y se
avanza igual por la ruta, pero los puntos valen la mitad hasta que vuelva la energía. Se
sube más despacio de rango y de liga, y nadie se queda encerrado nunca.

Eso obliga a **reescribir el texto del modal**, que hoy promete cero XP y no lo cumple. La
frase nueva tiene que decir la verdad sin sonar a castigo:

> *«Sigue si quieres. La lección cuenta igual, solo que los puntos valen la mitad hasta que
> vuelva la energía.»*

Y obliga a un sitio nuevo donde aplicarlo: hoy `addXP()` solo mira el multiplicador de XP
doble (`engine.js:130-131`). El factor de media entra ahí, junto al que ya existe, para que
no haya dos caminos que den puntos.

Además hay que limpiar de paso lo que está duplicado, o quedará incoherente: el tope de 5
está escrito a mano en cinco sitios (`store.js:472,476`, `engine.js:160,169,174`), la
cadencia de 30 minutos en dos, y el precio de recarga (60) en cuatro.

**En pantalla:** la pastilla de vidas pasa a `∞`. Y nada más. Ni corona, ni brillo, ni
insignia: quien paga no necesita que se lo recuerden.

### 3.2 Sin anuncios

Ver la sección 4. Es el único punto donde te voy a pedir que frenemos.

### 3.3 Chispa más cerca

Hoy: la clave personal no cuenta nada; el Worker gratuito tiene un tope de **25 al día por
dispositivo** que vive en `localStorage` y se reinicia editándolo; y el único freno real es
que Cloudflare corta a los 10.000 *neurons* del día —un corte **global de la cuenta**, no por
persona, así que un usuario intensivo puede dejar sin IA a todos los demás.

**Propuesta:**

| | Gratis | Impulso |
|---|---|---|
| Niveles 1–6 de Chispa | Ilimitados (no gastan red) | Ilimitados |
| Modelo | Workers AI, cuota compartida de Cloudflare | Un modelo de pago de verdad |
| Consultas | 25/día por dispositivo (como hoy) | ~300 al mes, contadas por cuenta |
| Memoria de la conversación | 4 turnos | 12 turnos |
| Revisión de decisiones | — | Sí |

La consulta de Impulso entra como **una operación más de `worker-plaza`** (`op: 'chispa'`),
porque ese Worker ya tiene sesiones, base y limitador. El Worker de IA no sirve: su
`wrangler.jsonc` no declara ningún almacenamiento y no recibe ninguna identidad.

El contador va con el molde atómico de la tabla `pedido`. Al 80% se avisa; al llegar al
tope, Chispa sigue funcionando con los niveles 1–6 y con la IA gratuita, igual que hoy.

**Nota de coste:** 300 consultas al mes de un modelo pequeño cuestan céntimos por
suscriptor. De 99 MXN, con comisión de pasarela quedan ~92. El margen aguanta de sobra.

### 3.4 Plan semanal personalizado

**Determinista primero, IA encima.** Igual que todo lo demás en esta app.

Las tres tareas de la semana salen de cruzar lo que ya está guardado: dónde está en la ruta
(`pathState()`), qué rúbricas suspendió en sus misiones, qué objetivos y tareas tiene
abiertos en el `venture`, y qué secciones del expediente están vacías. El **porqué** de cada
tarea sale de la misma regla que la eligió — y ese porqué es lo que hace que valga 99 pesos.

Se ancla al campo `weekly.week` que ya existe. Funciona sin conexión. Si hay IA, reescribe
la redacción; nunca decide las tareas.

### 3.5 Materiales listos para usar

Ya existe la semilla: `Mentor.improve()` tiene 4 plantillas de salida (oferta, cliente,
mensaje frío, plan de 90 días) que se pintan con un botón "Copiar", y `Venture.terms()`
devuelve ~35 términos reales del negocio.

**Propuesta:** un catálogo cerrado de materiales —publicación, mensaje de venta, pitch de 30
segundos, cotización, guion de llamada, respuesta a "está caro"— cada uno como función que
recibe `terms()` y devuelve texto. Variantes por sector, como ya hace `EXAMPLE_BY_SECTOR`.

**La regla que lo hace sentir caro:** si falta un dato, no se pregunta en un formulario. Se
usa lo que hay y se marca lo que falta, o el material no se ofrece — que es exactamente lo
que ya hace el catálogo de logros compartibles.

---

## 4. Los anuncios: el único punto donde te digo que frenemos

**Técnicamente no hay ningún freno.** No hay CSP, el service worker no intercepta nada de
otro origen, y un `<script>` de AdSense cargaría sin problema. Ya existe además un precedente
de tercero bajo petición explícita: la IA local importa WebLLM desde `esm.run`.

El freno es lo que la app promete por escrito. Meter una red de anuncios obliga a reescribir
**seis textos**, y no son opcionales:

1. `privacidad.html:145` — *«no hay analítica, ni rastreo, ni publicidad, ni venta de datos a nadie»*
2. `privacidad.html:250` — *«No hay finalidades secundarias… Por eso no hay ningún mecanismo de negativa que ofrecerte: no existe nada a lo que negarse»*
3. `privacidad.html:356` — *«no usa cookies, ni balizas web, ni identificadores de publicidad… ni píxeles, ni SDK de terceros»*
4. `index.html:42` — la descripción al compartir el enlace
5. `manifest.webmanifest` — la descripción de la app instalada
6. **`js/core/promesa.js:52`** — *«No se vende — Emprendo no vive de tus datos. Nunca.»*

La sexta es la cara. Es una de las tres promesas que Chispa le enseña al usuario **justo
antes de pedirle su idea**, sin letra pequeña, y el comentario del archivo dice: *«Ninguna
promete nada que la app no cumpla»*.

Y aquí está la distinción que importa:

> **Cobrar no rompe esa promesa: la refuerza.** Una suscripción es literalmente lo contrario
> de vivir de los datos de la gente. **Los anuncios sí la rompen**, porque una red
> publicitaria perfila para poder segmentar. Eso es vivir de sus datos, aunque el dinero lo
> pague otro.

### 4.1 Decidido: red publicitaria desde el principio

Entran en la fase 1, y con ellos los seis textos **en el mismo cambio**. Lo que eso implica
en concreto:

**Qué red.** Para una PWA servida desde GitHub Pages, **AdSense es la única opción real**.
AdMob es solo para apps nativas y aquí no hay proyecto nativo. AdSense pide dominio propio
revisado y aprobado, y devuelve un identificador de editor (`ca-pub-…`) — eso lo tienes que
conseguir tú, y tarda días. El código no se queda esperando: la red entra por un **adaptador
de una sola pieza** (`js/core/anuncios.js`), así que cambiarla después o apagarla es tocar un
archivo.

**Dónde caben, sin inventar pantalla.** Los tres huecos ya existen:

| Hueco | Dónde | Por qué es natural |
|---|---|---|
| Al terminar una lección | `finish()` — `lesson.js:1303` | Es el único punto donde la app ya interrumpe con celebración y recompensa |
| El modal de cero energía | `noHearts()` — `lesson.js:1262` | Ya tiene tres botones; un cuarto camino encaja sin rediseñar |
| Entre pantallas | `UI.queueModal()` — `ui.js:162` | La cola que ya evita que dos cosas se pisen |

**Las reglas, que van escritas en el código y no en la cabeza de nadie:** nunca dentro de una
lección, de un reto ni de una conversación con Chispa; nunca antes de la primera lección
terminada; nunca dos veces en la misma sesión; y nunca a pantalla completa obligatoria. Con
Impulso, el adaptador ni siquiera carga el script.

**Lo que hay que aceptar por escrito.** Los seis textos de arriba dejan de ser ciertos y se
reescriben en el mismo commit. El más caro es el tercero de `promesa.js`: hay que cambiarlo
por algo que siga siendo verdad con anuncios dentro. Propuesta:

> *«Tu idea no se vende — Los anuncios no saben nada de lo que me cuentas.»*

Eso sí se puede cumplir, y se cumple técnicamente: el adaptador no le pasa a la red ni un
dato del negocio, ni el sector, ni la etapa, ni el texto de ninguna pantalla.

**Y dos cosas más que no son opcionales:**

1. **AdSense pone cookies.** En Europa eso obliga a un consentimiento previo. Entra en el
   mismo cambio: se pregunta una vez al terminar la primera lección, con dos salidas de
   verdad —a mi medida o genéricos—, y se puede cambiar en Perfil.
2. **Los *Auto ads* de la cuenta de AdSense hay que dejarlos APAGADOS.** Con ellos
   encendidos, Google coloca anuncios donde quiere —anclajes, pantallas completas, dentro
   de una lección— y se salta las seis reglas que el código sí respeta. Se comprobó en la
   prueba: su script inyecta por su cuenta un `ins.adsbygoogle-noablate` en el `<body>`
   que nada del código nuestro puso ahí.

---

## 5. Las 200 lecciones y los 50 retos

### 5.1 Lo que aguanta la arquitectura y lo que no

| | Estado |
|---|---|
| Multiplicar por 4 las lecciones dentro de los 8 niveles | ✅ Aguanta. El array global, el progreso por id y los contadores ya son dinámicos |
| Más de un reto por nivel | ❌ **No.** `engine.js:22` hace `C.BOSSES.filter(b => b.level === lv.n)[0]` — solo coge el primero. La ruta tiene sitio para ocho retos y ni uno más |
| Subir de 8 niveles | ❌ Hay ocho cosas cableadas al 8 |
| El peso | ⚠️ 200 lecciones son ~1,0 MB que hoy se bajarían y se parsearían **de golpe y bloqueando** antes de que la app arranque. Ya hay un bug conocido de arranque en móvil por esto mismo |
| Personalizar las misiones | ⚠️ `THEME_BY_ID` mapea **a mano** los 58 ids a 52 plantillas. Con 250 ids son 250 entradas a mano |

### 5.2 Los cuatro cambios de arquitectura, antes del contenido

1. **Romper el `[0]`.** Los retos pasan a ser una lista por nivel. La ruta pasa de
   *nivel → lecciones + 1 reto* a *nivel → bloques*, donde un bloque son ~4 lecciones y su
   reto. 200 lecciones y 50 retos caben así: 25 lecciones y 6–7 retos por nivel.
2. **Partir la carga.** Un índice ligero (`id`, `título`, `icono`, `xp`, `min`, `nivel`) que
   sí va en el arranque —unos 20 KB para 200— y el cuerpo de cada lección en
   `data/lecciones/nivel-N.json`, que se pide al abrirla y lo precarga el service worker.
   Sin conexión sigue funcionando; el arranque deja de crecer.
3. **El tema, dentro de la lección.** Cada lección declara su `theme:` en vez de vivir en un
   mapa externo de 250 entradas.
4. **`tools/check-contenido.js`.** Ids únicos, tipos de paso válidos, `check` de rúbrica que
   exista de verdad en `CHECKS` (hoy un nombre mal escrito cae en silencio a `filled`),
   clave de `dossier` válida, títulos no repetidos, y las cuentas: 200 y 50, repartidas.

### 5.3 El contenido

150 lecciones nuevas, cada una con concepto, caso, ~5 ejercicios de 9 tipos y una misión con
rúbrica. Más 42 retos reales con sus campos y sus rúbricas.

**Esto es lo más grande de todo el encargo.** No se hace de una vez y no se hace sin que lo
mires: la forma sensata es **por nivel**, en tandas, cada tanda pasando por
`check-contenido.js` y por una página de `lab/` donde las leas antes de que entren.

Tu regla —*nada de relleno*— se puede verificar a máquina en parte (títulos y conceptos
repetidos, misiones con la misma rúbrica) pero el resto lo decides leyendo. Por eso van en
tandas.

---

## 6. Los tres beneficios de después

| Beneficio | Qué hace falta | Dificultad |
|---|---|---|
| **Documentos profesionales** | El motor ya está: `comparte.js` dibuja en canvas con la tipografía y con Chispa. Hoy la única exportación es texto plano (`buildPlan()` en `business.js`). Un documento presentable es componer las 12 secciones sobre una plantilla de página | Media |
| **Simulador avanzado** | 22 eventos hoy, 3 opciones cada uno. Los escenarios que pides (competencia, subida de costos, reclamaciones, pedido grande, contratación, falta de efectivo) necesitan dos arreglos del modelo antes: `demandMod` se **asigna** en vez de multiplicarse y se borra cada semana, así que hoy no se puede expresar un efecto sostenido; y `pickEvent` es determinista sobre `(semana, efectivo)`, así que dos partidas iguales ven los mismos eventos | Media |
| **Hasta 5 emprendimientos** | El mapa ya existe, pero **lecciones, misiones, expediente, simulador y Plaza cuelgan del usuario, no del negocio**. Separarlos es subir `ESQUEMA` a 2 y escribir la primera migración del estado. Además: `startOver()` hoy **borra** el negocio anterior, el respaldo solo sabe nombrar uno, e `importJSON` reemplaza el estado entero | **Alta** — es lo más delicado de todo |

Sobre los 5 negocios, una decisión de fondo que no es técnica: hoy la app promete en pantalla
*"tu XP no se borra"* (`venture.js:93`). Si el progreso de la ruta se separa por negocio, el
segundo negocio empieza de cero; si se comparte, el segundo negocio empieza con la ruta ya
terminada. Las dos son defendibles y hay que elegir. Lo dejo para cuando lleguemos.

---

## 7. Las fases

**Fase 0 — Decidir.** ✅ Hecho. Ver «Decisiones tomadas».

**Fase 1 — Cobrar** *(A)* — ✅ **escrita**

| | |
|---|---|
| `worker-pago/` con Stripe, el webhook firmado y el portal | ✅ |
| Migración `0003_impulso.sql` (4 columnas en `cuenta`) | ✅ |
| El pase firmado ECDSA P-256, verificado sin conexión | ✅ |
| La pantalla de Impulso, con «pronto» en lo que no está hecho | ✅ |
| Energía ilimitada y media XP sin energía | ✅ |
| El mapa deja de bloquear la lección sin energía | ✅ |
| Los anuncios, por adaptador y apagados hasta que haya editor | ✅ |
| El consentimiento, con las dos salidas de verdad | ✅ |
| Los seis textos reescritos + los procesadores nuevos en privacidad | ✅ |
| `check-gratis.js` y `check-impulso.js` | ✅ |
| Borrar la cuenta cancela el cobro primero | ✅ |
| **Las claves de Stripe y el editor de AdSense** | ⬜ tuyo |
| **Desplegar `worker-pago` y la migración** | ⬜ tuyo |

→ En cuanto estén las dos filas de abajo, se puede cobrar.

**Fase 2 — Los beneficios** *(B)* — ✅ **dos de tres escritas**

| | |
|---|---|
| **Plan semanal** — 25 tareas, elección congelada por semana, `hecho()` que mira el estado real | ✅ |
| **Material listo** — 8 plantillas deterministas con los datos del negocio dentro | ✅ |
| `tools/check-plan.js` — las 25 tareas y los 8 materiales contra 7 perfiles | ✅ |
| **Chispa más cerca** — `op: 'chispa'` en worker-plaza, contador por cuenta, revisión de decisiones | ✅ |
| Migración `0004_ia.sql` y 21 comprobaciones nuevas en `check-plaza-worker.js` | ✅ |

**El modelo elegido: `claude-haiku-4-5-20251001`.** Para lo que hace Chispa —cruzar los
datos que ya tiene delante y explicar una decisión de negocio— la diferencia con uno más
caro no se nota, y en la factura de cada mes sí. Va como variable de `wrangler.jsonc`,
así que cambiarlo no toca código.

**Los topes: 40 al día y 600 al mes por cuenta.** En el peor caso imaginable —alguien que
agota su mes entero— el coste queda muy por debajo de lo que deja una suscripción de 99
pesos, y casi nadie llega ni a la décima parte. Al llegar al tope no se corta nada: la
cascada cae al escalón de abajo y se enseña el motivo.

**Por qué el plan semanal no necesitó IA:** las tres tareas salen de cruzar lo que ya
está guardado —dónde va en la ruta, qué rúbricas suspendió, qué secciones del expediente
están vacías, si tiene precio y costo—, y el porqué sale de la misma regla que eligió la
tarea. Funciona sin conexión y sin gastar un peso, que es exactamente lo que hace falta
en el teléfono donde alguien va a decidir qué hace esta semana.

**Fase 3 — Contenido** *(C)*
Primero los cuatro cambios de arquitectura de 5.2. Después las tandas por nivel.

**Fase 4 — El resto**
Documentos · simulador avanzado · varios emprendimientos.

---

## 8. Lo que necesito de ti para que la fase 1 sea real

El código se puede escribir entero sin esperar a nada de esto; lo que no se puede es cobrar
de verdad. Cuando los tengas, entran como secretos del Worker y una constante en la app.

| Qué | Dónde se consigue | Para qué |
|---|---|---|
| **Clave secreta de Stripe** (`sk_…`) | Panel de Stripe → Developers → API keys. Empieza por la de **prueba** | Crear la sesión de pago y el portal de cancelación |
| **Id del precio** (`price_…`) | Stripe → Products → un producto «Emprendo Impulso», precio recurrente mensual de 99 MXN | Es lo que se cobra |
| **Secreto del webhook** (`whsec_…`) | Stripe → Developers → Webhooks, apuntando a la URL del Worker nuevo | Verificar que el aviso de pago viene de Stripe y no de cualquiera |
| **Id de editor de AdSense** (`ca-pub-…`) | Google AdSense, con el dominio revisado y aprobado | El único dato que necesita el adaptador de anuncios |

Dos avisos de calendario: la aprobación de AdSense **tarda días o semanas** y puede
denegarse, así que el adaptador arranca apagado y se enciende con una constante. Y el Worker
de pago **lo tienes que desplegar tú** (`wrangler`), igual que el de la Plaza: aquí no hay
sesión autenticada.

**Decisiones ya cerradas por defecto**, dímelo si prefieres otra cosa:

- **Sin conexión, un suscriptor conserva Impulso 3 días** pasado el fin del periodo pagado.
- **Si alguien paga y luego usa «borrarme»**, se cancela la suscripción en Stripe dentro de
  la propia operación, avisando antes de borrar.
- **Google Play / App Store**: el diseño asume que no. Si algún día se envuelve la app, las
  dos obligan a usar su facturación para contenido digital (15–30%) y prohíben enlazar a un
  cobro externo, y esto habría que rehacerlo.

---

## 9. Verificadores nuevos

Este repo tiene siete verificadores y ninguna CI: se corren a mano y su única constancia es
la lista del README. Los nuevos hay que añadirlos ahí o no los correrá nadie.

| Verificador | Qué atrapa |
|---|---|
| **`tools/check-gratis.js`** | Que un usuario **sin pagar** llegue del primer nodo de la ruta al último. Con el molde de lista blanca a mano de `check-vitrina.js`: cerrar algo tiene que ser una edición deliberada, no un descuido. Se prueba sobre `pathState()` (`engine.js:56-86`), que es el único sitio donde hoy se decide qué está cerrado |
| **`tools/check-impulso.js`** | Que un pase manipulado no verifique. Que un pase caducado no dé beneficios. Que `plan_hasta` se compruebe en `quienEs()` y no solo se escriba — el repo ya tiene una columna que se guarda y no se lee nunca (`edad_ok`), y ese error no se repite |
| **`tools/check-contenido.js`** | Ver 5.2 |
| **`check-plaza-worker.js`** (ampliar) | Ya monta SQLite en memoria y ejecuta el Worker de verdad contra 70 comprobaciones. La migración `0003` y las operaciones de plan entran ahí |
| **`check-precache.js`** | Ya existe. Los archivos nuevos tienen que entrar en `index.html` **y** en `PRECACHE`, y hay que subir `VERSION` en `sw.js` |

---

## 10. Dos avisos sueltos que aparecieron leyendo

- **`privacidad.html` ya está incompleto, antes de tocar nada.** La IA local descarga WebLLM
  desde `esm.run`, y la sección 9 dice que no hay SDK de terceros. Conviene arreglarlo en el
  mismo cambio que toque esos textos.
- **`index.html:42` y el manifest dicen "Gratis y sin cuentas"**, y la Plaza tiene cuentas
  desde hace tiempo. `privacidad.html:140` lo matiza; los dos textos de marketing no. Con
  Impulso dejan de ser defendibles, y además hay que actualizarlos a 200 lecciones y 50
  retos.
