# Mapa de compartir logros — logro · etapa · datos · intención · CTA · Chispa

**Estado:** implementado y verificado en el navegador.
**Sustituye a** la sección 4 de `plan-chispa-logros.md`.

Dos ejes, no uno: **el logro pone el tema del visual; la etapa pone la intención y el cierre.**
El mismo logro «producto definido» pide opiniones si el negocio está en validación y busca
interesados si va más avanzado.

---

## 1. Tabla de etapas

`Comparte.etapa()` en `js/core/comparte.js`, sobre `Venture.knows()`. Acumulativa: si falta un
escalón, no hay siguiente. **No** usa puntos, rachas, lecciones ni tiempo, y **no** usa
`core.stage` —que sí se le pregunta al usuario en el registro— porque la etapa no se pregunta.

Se memoriza contra `venture.rev`, así que solo se recalcula cuando el perfil cambia de verdad.
Vive en memoria y nunca se persiste: escribirla dentro del venture subiría `rev` en cada lectura
y tiraría la caché de contenido generado.

| Etapa | Condición | Intención | Qué hace el visual |
|---|---|---|---|
| **0** | sin `idea` | — | **No se genera nada.** `disponibles()` sale vacío |
| **1** | `idea` | `presentar` | Presenta la idea y pide opinión. Nunca habla como si el producto existiera |
| **2** | `+ cliente + problema` | `mercado` | Pregunta sobre el problema real de esas personas |
| **3** | `+ oferta` | `mercado` | Sigue preguntando, pero ya mide interés en la solución |
| **4** | `+ precio` | `cliente` | Busca a las primeras personas interesadas |
| **5** | `+ (canales \| ventas)` | `cliente` | Igual que la 4 — ver abajo |

### Por qué la etapa 5 no vende

La intención `vender` **no existe en el código, y falta a propósito.** Vender exige afirmar que
el producto está disponible y que hay una forma real de pedirlo. El modelo no tiene ni un campo
de disponibilidad ni uno de contacto: lo único que desbloquea la etapa 5 es haber decidido dónde
publicar (`canales`) o cómo responder objeciones (`ventas`) — y eso también se satisface con una
frase suelta escrita a mano en «Guion de ventas», incluida «todavía no sé cómo vender».

Antes el código emitía «Ya está listo:» y «Ya puedes hacer tu pedido» sobre esa evidencia. Era
lo único que hacía que la app publicara algo falso en la red real del usuario. Ahora la etapa 5
cierra como la 4, buscando interesados. `vender` vuelve el día que exista el dato, y solo entonces.

Por el mismo motivo el logro cambió de nombre: ya no dice «Listo para vender», dice **«Ya sabes
cómo vas a vender»**, que es exactamente lo que la clave acredita.

---

## 2. Tabla maestra

`campos` es la lista blanca: `datosDe()` construye seis candidatos y filtra por ella. Lo que no
esté declarado no llega al generador. `exige` son los que además tienen que traer texto — si
faltan, el logro no se ofrece siquiera.

| Logro | Requisitos | Etapa mín. | Datos permitidos | Objetivo | CTA (por intención) | Chispa |
|---|---|---|---|---|---|---|
| **Definiste tu idea** | `idea` | 1 | negocio, idea | Presentar la idea | *presentar:* «¿Qué te parece esta idea?» · *mercado:* «¿Te haría falta algo así?» · *cliente:* «Si te interesa, escríbeme y te cuento.» | bienvenida → happy |
| **Tu emprendimiento ya tiene nombre** | `idea` + `nombre` | 1 | negocio, idea | Estrenar el nombre | *presentar:* «¿Cómo te suena el nombre?» · *mercado:* «¿Qué te transmite este nombre?» · *cliente:* «Escríbeme si quieres conocerlo.» | celebrando → party |
| **Identificaste el problema** | `idea` + `problema` **exige** problema | 2 | negocio, idea, problema, cliente | Enunciar el problema y validar si le pasa a otros | *mercado:* «¿Te pasa lo mismo?» · *cliente:* «Si te pasa, escríbeme y lo vemos.» | pensando → think |
| **Definiste tu cliente ideal** | `idea` + `cliente` | 2 | negocio, idea, cliente | Sondear la necesidad de ese mercado | *mercado:* «¿Qué es lo más difícil de encontrar hoy?» · *cliente:* «¿Te gustaría que te avise cuando esté listo?» | pensando → think |
| **Definiste tu producto** | `idea` + `oferta` | 3 | negocio, producto, cliente | Presentar el producto y medir preferencia | *mercado:* «¿Cuál probarías primero?» · *cliente:* «Si quieres conocerlo, escríbeme.» | celebrando → party |
| **Construiste tu propuesta de valor** | `idea` + `cliente` + `valor` **exige** valor | 3 | negocio, producto, cliente, valor | Decir a quién ayuda y qué consigue | *mercado:* «¿Es eso lo que más te importaría?» · *cliente:* «Si te sirve, escríbeme y te paso los detalles.» | motivando → happy |
| **Preparaste tu oferta** | `idea` + `oferta` + `oferta-decidida` | 3 | negocio, producto, cliente | Presentar la oferta trabajada | *mercado:* «¿Qué te haría decidirte?» · *cliente:* «Si quieres la información, escríbeme.» | motivando → happy |
| **Definiste tu precio** | `idea` + `oferta` + `precio` | 4 | negocio, producto, cliente | Buscar los primeros interesados | *cliente:* «Busco a las primeras personas interesadas. Escríbeme y te paso la información.» | cobrando → money |
| **Ya sabes cómo vas a vender** | + `canales` o `ventas` | 5 | negocio, producto, cliente | Armar la lista de interesados | *cliente:* «Estoy armando la lista de las primeras personas interesadas. Escríbeme y te aviso.» | celebrando → party |

**18 combinaciones logro × intención, todas alcanzables.** `tools/check-catalogo.js` falla si
alguna sobra o falta.

**Nunca entra nada de esto, en ningún logro:** XP, monedas, racha, insignias, nivel, misiones
completadas, `metrics.precio`, `metrics.costo`, `core.stage`, `core.place`, `core.brandVoice`,
objetivo, presupuesto, tiempo, experiencia, y las decisiones `identidad`, `numeros`, `procesos`,
`clientes`, `plan`. `canales` y `ventas` se leen **solo como booleano** de etapa, nunca su texto.

---

## 3. Tres reglas de saneado que no son obvias

**El relleno de `terms()` no puede salir a la calle.** Devuelve «tu negocio», «tu producto o
servicio», «tu cliente», «tu idea» cuando falta el dato. Sirve para hablarle al usuario dentro de
la app y sería absurdo en una publicación, así que cada campo se copia solo si su bandera
`tiene.*` lo respalda. Antes solo `negocio` estaba protegido.

**El problema no siempre se puede publicar.** `decision('problema')` puede ser una frase —escrita
a mano, del registro, del mentor o de Chispa— o el volcado de todos los campos de una misión unidos
por ` · `. En el reto de entrevistas ese volcado empieza por el nombre de la persona entrevistada
y trae su cifra de gasto. Publicarlo sería filtrar a un tercero y afirmar una cantidad. Se exige
origen conocido **y** ausencia del separador; si no, el campo se omite y el logro no se ofrece.

**La insignia de Chispa era gamificación colada en el visual.** La capa `distintivo` se decide
leyendo `stats.missions`, así que entregar una misión cambiaba el símbolo publicado sin que
hubiera cambiado un dato del negocio. `Mascot.svg` acepta ahora `sinDistintivo`, que apaga esa
capa y deja las demás —delantal, herramienta, escenario— porque esas sí describen el negocio.
Verificado: el PNG es byte a byte idéntico con `stats.missions` en 0 y en 5.

---

## 4. Cuándo aparece, y por qué antes no aparecía nunca

Todas las claves que mueven etapa se graban al entregar una misión, con la ruta en `mission`.
`momentoBueno()` rechaza esa ruta —con razón, ahí no se interrumpe— y el modal de celebración
lleva `dismissible:false`, así que retiene al usuario bastante más que los 1400 ms del agrupado.
Cuando el temporizador saltaba, el aviso se tiraba con un `return` seco y sin reintento.

**El único momento en que el usuario acaba de lograr algo era justo el que nunca lo ofrecía.**
Un usuario que solo hiciera lecciones y misiones —el bucle principal— completaba el recorrido
entero sin ver la función.

Ahora el aviso se aparca y lo recoge `App.onRoute` al aterrizar en una pantalla donde sí se
puede, con caducidad de cuatro rutas para que no aparezca descontextualizado. Vive en memoria y
jamás se persiste.

Y se ofrece **el logro que se acaba de conseguir**, no el más avanzado que haya guardado.
`avisarAvance` recibía la clave y la descartaba: definir el cliente ideal ofrecía «Definiste tu
idea», y reeditar el problema en etapa 5 ofrecía el visual más comercial de todos.

Además hay una **puerta permanente en Mi Negocio**. Antes «Ahora no» perdía los diseños para
siempre: el ofrecimiento automático era la única entrada que la función tenía en toda la app.

---

## 5. El visual

Vertical 1080×1920 por defecto (historias de Instagram, estados de WhatsApp) y 4:5 1080×1350
para publicaciones — **este solo si la estructura lo permite**, que es la condición literal del
encargo: el 4:5 tiene 8,9 líneas de presupuesto frente a 15 del vertical, y si el mensaje no
cabe, el botón no se ofrece en vez de recortar el texto.

**Chispa:** 367 px, el 34 % del ancho, abajo a la derecha. Tiene presencia, pero el protagonista
es el avance. El texto se estrecha al llegar a su banda en lugar de pasarle por encima.
Verificado sin colisiones en las 54 combinaciones de logro × formato × estilo.

**Contraste**, medido sobre el arranque del degradado, que es el punto más claro y el peor caso.
El acento pinta el rótulo y el cierre —la pregunta, lo único que puede devolverle una respuesta
al usuario— así que es el que más importa:

| Estilo | Tinta | Acento | Antes (acento) |
|---|---|---|---|
| Personal | 13,84 : 1 | **4,81 : 1** | 2,65 : 1 |
| Profesional | 15,24 : 1 | **9,10 : 1** | 9,10 : 1 |
| Celebración | **4,84 : 1** | **4,31 : 1** | 1,68 : 1 |

El mínimo AA para texto grande es 3:1. Antes, en dos de los tres estilos, la pregunta era lo
menos legible de toda la pieza. `check-catalogo.js` falla si algún estilo baja de 3:1.

**Tipografía:** se espera a `document.fonts.ready` con tope de 1,5 s antes del primer trazo.
Nunito es local con `font-display: swap`, y sin esperarla `measureText` medía con la fuente del
sistema y el PNG salía con los saltos de línea calculados sobre otra métrica.

**Salida:** «Compartir» usa el menú nativo con el blob ya precalculado —en iOS `share()` solo
funciona dentro del gesto, y codificar dos megapíxeles en medio lo consume— y **«Descargar» es
ahora un botón propio.** Antes descargar solo ocurría como respaldo: en un Android con menú
nativo funcionando no existía ninguna forma de guardar el PNG.

---

## 6. Cobertura de los once disparadores

| # | Pedido | Estado |
|---|---|---|
| 1 | Definir su idea | ✅ |
| 2 | Elegir el nombre | ✅ nuevo — `patchCore` avisa al pasar de vacío a lleno, no en cada guardado |
| 3 | Identificar el problema | ✅ con el saneado del punto 3 |
| 4 | Definir cliente ideal | ✅ |
| 5 | Construir propuesta de valor | ✅ nuevo — lee el campo `valor` de la misión del precio, que ya estaba capturado y no leía nadie. Cero preguntas nuevas |
| 6 | Definir producto o servicio | ✅ separado de la oferta |
| 7 | Elegir una opción de producto | ❌ **no existe el dato.** Fuera por tu propia regla |
| 8 | Preparar un prototipo | ❌ **no existe el dato.** Fuera por tu propia regla |
| 9 | Establecer una oferta | ✅ nuevo — `oferta-decidida` distingue la misión trabajada del texto del registro |
| 10 | Definir un precio | ✅ |
| 11 | Listo para presentar, probar o vender | ⚠️ parcial. «Presentar» es la intención de la etapa 1. «Probar» no tiene señal. «Vender» está degradado a buscar interesados hasta que exista el dato de disponibilidad y contacto |

---

## 7. Lo que queda fuera, y por qué

**Alcance de pago, sin excepción:** ninguna API de generación de imágenes, ni calendario, ni
vídeo, ni carrusel, ni kit de marca, ni programación en redes, ni analítica. Todo se dibuja en
canvas, con la fuente local y el SVG de Chispa; nada sale del dispositivo salvo por el menú
nativo, con un gesto explícito.

**Editar el texto** sigue sin existir. Lo pediste como opcional y no bloquea nada, pero es la
única de las cuatro capacidades enumeradas que no está.

**El dato que falta para cerrar E3, E4 y E5 de verdad.** «Beneficio concreto», «producto
disponible» y «forma real de contacto» no existen en el modelo. Capturarlos es cambio de
currículo —dentro de una misión existente, nunca en la hoja ni al llegar al logro— y hasta
entonces no se aproximan con heurística ni con la IA. Que `knows('oferta')` y `knows('cliente')`
sean ambos true no es una relación verificada: son dos textos independientes.

---

## 8. Lo que destapó la revisión previa a publicar

Nueve defectos confirmados sobre el propio cambio, todos corregidos antes del primer despliegue.
Los dos que importaban:

**Se podía publicar la imagen del logro equivocado.** `cache` y `enCurso` son variables de módulo
y `limpiarCache()` las reasigna, pero un trabajo ya en vuelo resuelve el identificador al terminar
y escribía en el objeto *nuevo*. Como la clave era `estilo:formato`, sin el id del logro, el
resultado viejo aterrizaba justo sobre la clave que la hoja nueva iba a usar. En un móvil lento
—donde componer y codificar tarda entre uno y tres segundos— abrir un avance, cerrarlo antes de
que termine y abrir otro enseñaba el segundo y compartía el primero. Corregido con la clave por
logro y un contador de sesión que descarta el trabajo caducado.

**El registro terminaba con el ofrecimiento encima de la primera pantalla.** El nombre del negocio
está en el primer paso, así que `patchCore` disparaba el aviso mientras corría la animación de
«tu ruta está lista». Aparcarlo no bastaba: había que distinguir «todavía no» de «esto no cuenta».
Un avance decidido dentro del registro se descarta.

Los otros siete: el modal encolado se reevalúa al mostrarse (antes sobrevivía a un cambio de ruta
y aparecía dentro de un registro nuevo), `startOver()` limpia el aviso del negocio borrado,
`Router.refresh()` ya no gasta la caducidad de cuatro rutas, un aviso rechazado prueba el
siguiente candidato en vez de perderse, la caché guarda el PNG y una URL de objeto en lugar de
lienzo más base64 (de ~50 MB a unos pocos), el botón Compartir se bloquea durante el reparto
—un doble toque descargaba el archivo por detrás del menú nativo— y el cuerpo del texto se dibuja
con `maxWidth`, porque un nombre de negocio largo se pintaba fuera del lienzo.

Refutados y no tocados: seis, entre ellos que `cabe()` mida antes de que Nunito esté resuelta
(la fuente es local y del mismo origen; la ventana no es alcanzable).

---

## 9. Verificación

```bash
node tools/check-catalogo.js && node tools/check-precache.js
```

El primero comprueba que cada campo declarado sea producible, que cada logro tenga cierre para
todas sus intenciones alcanzables y solo para esas, que las etapas sean acumulativas, que ningún
campo de gamificación entre en una lista blanca y que los tres estilos pasen 3:1.
