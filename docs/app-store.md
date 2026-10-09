# La app de iPhone: cómo llega a la App Store

La app de la App Store es **esta misma app**, con todos sus archivos metidos en un
paquete de Capacitor. No es una ventana que carga la web: por eso funciona sin
conexión desde el primer arranque, y por eso Apple no la rechaza por «web envuelta»
(regla 4.2).

No hay Mac en este proyecto. La compila y la sube **una Mac de GitHub**
(`.github/workflows/ios.yml`). Lo que se hace a mano es lo que solo puede hacer la
persona dueña de la cuenta de Apple, y está todo aquí abajo, en orden.

> **Lo que no se puede cambiar nunca:** el identificador `life.emprendo.app` y el
> del producto `life.emprendo.app.impulso.mensual`. El nombre de la tienda sí.

---

## Lo que cambia dentro del iPhone

Todo vive en `js/core/nativo.js`, y en ningún otro sitio:

| En la web | En la app de iPhone |
|---|---|
| Se instala desde el navegador | Ya está instalada: no hay tarjeta «Instalar» |
| Service worker para funcionar sin red | Todo viaja dentro del paquete |
| Descargar el respaldo | Hoja de compartir: «Guardar en Archivos», WhatsApp… |
| Enlaces en otra pestaña | Ventanita de Safari encima de la app |
| Impulso con Stripe (cuando se encienda) | Impulso con Apple, sin pedir correo antes |
| Anuncios (cuando se pongan) | Ninguno: Google no permite AdSense en apps |
| IA local de Chispa | No está: baja código de internet y Apple no lo deja |
| `navigator.vibrate` (no existe en iPhone) | El motor de vibración del iPhone |

Y dos cosas que cambian también en la web, porque arreglan algo que ya pasaba:

- **Entrar a la Plaza con un código de seis números.** El enlace del correo abría
  Safari, y la sesión se quedaba allí y no donde estaba la persona.
- **Borrar la cuenta desde Perfil › Ajustes › Tu cuenta.** El aviso de privacidad lo
  prometía y no había botón. Apple lo exige.

---

## Lo que te toca, en orden

Los pasos 1 a 4 son más cómodos **desde la computadora**. El 5 y el 6 se hacen
desde el iPhone.

### 1 · Los Workers (Cloudflare)

Desde la carpeta de cada uno. **La migración siempre antes que el despliegue.**

```bash
cd worker-plaza
npx wrangler d1 migrations apply emprendo-plaza --remote
npx wrangler deploy
```

Eso enciende el código de seis números. **Avísame cuando esté**: hasta entonces
no publico la web, porque la pantalla nueva pide un código que el Worker viejo no
manda.

La cuenta de prueba para el revisor de Apple (al revisor no le llega nuestro
correo, así que su código es fijo). Elige seis números que solo sepas tú:

```bash
npx wrangler secret put REVISION_CORREO
npx wrangler secret put REVISION_CODIGO
```

Y la IA de Impulso, porque se vende como beneficio («Yo, más cerca») y tiene que
funcionar el día que alguien pague:

```bash
npx wrangler secret put IA_CLAVE
```

### 2 · Apple Developer — developer.apple.com

**a. El identificador.** Certificates, IDs & Profiles › Identifiers › **+** ›
App IDs › App. Descripción `Emprendo`, Bundle ID **Explicit**:
`life.emprendo.app`. «In-App Purchase» ya viene marcado. Guardar.

**b. El certificado.** En la terminal, desde la carpeta del proyecto:

```bash
bash tools/ios-certificado.sh solicitud
```

Crea `~/emprendo-firma/distribucion.csr`. En la web: Certificates › **+** ›
**Apple Distribution** › sube ese `.csr` › descarga el `.cer`. Luego:

```bash
bash tools/ios-certificado.sh p12 ~/Downloads/distribution.cer
```

**c. El perfil.** Profiles › **+** › **App Store Connect** › App ID
`life.emprendo.app` › el certificado de recién › nombre `Emprendo App Store` ›
descargar.

### 3 · App Store Connect — appstoreconnect.apple.com

**a. Los acuerdos.** Negocios (Business) › **Acuerdo de apps de pago**: firmarlo y
llenar banco e impuestos. Sin esto **no funcionan las compras**, ni siquiera en
pruebas. Después, inscríbete en el **Small Business Program**
(developer.apple.com/app-store/small-business-program): Apple se queda con 15% en
vez de 30%.

**b. La app.** Apps › **+** › Nueva app:

| Campo | Valor |
|---|---|
| Plataforma | iOS |
| Nombre | `Emprendo` · si está ocupado: `Emprendo: de idea a negocio` |
| Idioma principal | Español (México) |
| Bundle ID | `life.emprendo.app` |
| SKU | `emprendo-ios` |

**c. La llave para subir compilaciones.** Usuarios y acceso › Integraciones ›
**App Store Connect API** › Llaves del equipo › **+** › nombre `GitHub`, acceso
**Gestor de apps (App Manager)**. Descarga el `AuthKey_XXXXXXXXXX.p8` —solo se
puede una vez— y apunta el **Issuer ID** que sale arriba de la lista.

**d. Los secretos de GitHub.** Con el perfil y la llave descargados:

```bash
bash tools/ios-certificado.sh secretos ~/Downloads/Emprendo_App_Store.mobileprovision ~/Downloads/AuthKey_XXXXXXXXXX.p8 TU-ISSUER-ID
```

Sube seis secretos al repositorio. Nada de esto entra en el código.

**e. La suscripción.** Tu app › Monetización › **Suscripciones** › crear grupo
`Emprendo Impulso` › **+**:

| Campo | Valor |
|---|---|
| Nombre de referencia | `Impulso mensual` |
| ID de producto | `life.emprendo.app.impulso.mensual` |
| Duración | 1 mes |
| Precio | México, **$99.00 MXN** (Apple calcula los demás países) |
| Nombre visible (es-MX) | `Emprendo Impulso` |
| Descripción (es-MX) | `Energía sin límite y Chispa más cerca.` |
| Captura para revisión | `ios/capturas/revision-impulso.png` |

Y en el grupo, su nombre visible en es-MX: `Emprendo Impulso`.

**f. La llave de compras, para el Worker de pago.** Usuarios y acceso ›
Integraciones › **Compras dentro de la app** › **+** › descarga el `.p8` (otra
llave, distinta de la del punto c):

```bash
cd worker-pago
npx wrangler secret put APPLE_IAP_KEY       # pega el contenido entero del .p8
npx wrangler secret put APPLE_IAP_KEY_ID
npx wrangler secret put APPLE_ISSUER_ID
```

**g. Los avisos de Apple.** Tu app › Información de la app › **Notificaciones del
servidor de App Store**: en producción y en sandbox,
`https://pago.emprendo.life/apple`, **versión 2**.

### 4 · El Worker de pago

La llave que firma los pases (si no la has creado ya):

```bash
node tools/nueva-llave-pase.js
cd worker-pago && npx wrangler secret put PASE_JWK
npx wrangler deploy
```

**Pásame la mitad pública** que imprime el primer comando. Con ella y la
dirección del Worker, enciendo Impulso en la app. Stripe puede esperar: la web
no enseña el botón de pagar hasta que se encienda aparte.

### 5 · Compilar y subir — desde el iPhone

App de GitHub › `erickzoneee/modo-emprendedor` › **Actions** › **App de iPhone** ›
**Run workflow** › rama `main` › «Subir a TestFlight» marcado › **Run**.

Tarda unos 10 minutos. Unos minutos después aparece en App Store Connect ›
TestFlight. Ahí: Pruebas internas › **+** › agrégate a ti mismo. Instala la app
**TestFlight** en el iPhone y acepta la invitación.

### 6 · Probar antes de mandarla

En TestFlight las compras son de prueba y no cobran nada.

- [ ] Arranca sin conexión (modo avión) después de la primera vez.
- [ ] Registrar una idea y hacer una lección entera.
- [ ] Chispa: preguntarle un precio. El micrófono pide permiso con la frase de Chispa.
- [ ] Impulso: el precio sale como `$99.00`, comprar, ver «Ya tienes Impulso».
- [ ] Borrar la app, instalarla otra vez y tocar «Ya lo tenía: recuperarlo».
- [ ] La Plaza: entrar con el código que llega por correo.
- [ ] Perfil › Ajustes › Tu cuenta › Borrar mi cuenta: avisa que Impulso lo cobra Apple.
- [ ] Respaldo: Perfil › Respaldo › la hoja de compartir › Guardar en Archivos.

Si algo falla, dime qué pantalla y qué pasó.

### 7 · Mandarla a revisión

En la versión 1.0.0: llena la ficha (abajo), sube las capturas, elige la
compilación de TestFlight, **agrega la suscripción** en «Compras dentro de la app
y suscripciones» —la primera tiene que ir con una versión— y **Enviar a revisión**.

Cuando la aprueben: `npx wrangler secret delete REVISION_CODIGO` en `worker-plaza`.

---

## La ficha de la tienda, lista para copiar

**Nombre** (30): `Emprendo`

**Subtítulo** (30): `De una idea a un negocio real`

**Texto promocional** (170):

```
Una misión al día para pasar de una idea a un negocio real. Las 50 lecciones y los 8 retos son gratis, y funcionan sin conexión.
```

**Palabras clave** (100):

```
emprender,negocio,emprendimiento,ventas,clientes,precio,pyme,mentor,lecciones,finanzas,startup
```

**Descripción** (4000):

```
Emprendo no es un curso. Es una misión al día para pasar de una idea a un negocio real.

Le cuentas a Chispa, tu mentor, qué quieres vender y a quién. Desde ese momento, cada lección, cada ejercicio y cada reto hablan de TU negocio, no de un ejemplo cualquiera.

AL TERMINAR LA RUTA TE LLEVAS
• Una idea validada con gente de verdad
• Tu cliente ideal definido
• Una oferta escrita y tus precios calculados
• Una estrategia de ventas y tus primeros clientes

LO QUE HAY DENTRO
• 50 microlecciones de 5 minutos: de encontrar el problema a administrar el dinero
• 8 retos del mundo real: entrevistar, vender, cobrar
• Chispa, tu mentor: calcula tu precio, tu margen y tu punto de equilibrio, y practica contigo lo que te va a decir un cliente
• Un simulador de empresa para equivocarte con dinero de mentira
• Tu expediente: todo lo que decides, en un solo lugar
• La Plaza: tu negocio como un puesto de mercado, para conocer a otras personas que emprenden. Solo se publica lo que tú apruebas

GRATIS DE VERDAD
Las 50 lecciones, los 8 retos, el simulador, Chispa y la Plaza son gratis y lo van a seguir siendo. La ruta entera funciona sin conexión.

EMPRENDO IMPULSO (OPCIONAL)
Una suscripción mensual para avanzar sin pausas: energía sin límite, tu plan de la semana, material listo para usar (tu publicación, tu mensaje de venta, tu cotización) y Chispa más cerca, con más preguntas al día y respuestas más largas. Sin Impulso llegas al mismo final; solo tardas un poco más.

El pago se carga a tu cuenta de Apple al confirmar la compra. La suscripción se renueva automáticamente cada mes, salvo que la canceles al menos 24 horas antes de que termine el periodo. Puedes gestionarla o cancelarla en los ajustes de tu cuenta de Apple.

Términos de uso: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Aviso de privacidad: https://erickzoneee.github.io/modo-emprendedor/privacidad.html

TU IDEA ES TUYA
Tu progreso se guarda en tu teléfono y no necesitas cuenta para aprender. Si entras a la Plaza, solo sale lo que tú apruebas; tus precios, tus números y tus contactos no salen nunca.

El contenido es formación empresarial general. En impuestos y formalización, confirma siempre con tu autoridad fiscal o con un contador.
```

| Campo | Valor |
|---|---|
| URL de soporte | `https://erickzoneee.github.io/modo-emprendedor/privacidad.html` |
| URL de privacidad | `https://erickzoneee.github.io/modo-emprendedor/privacidad.html` |
| Categoría principal | Educación |
| Categoría secundaria | Negocios |
| Copyright | `2026` y tu nombre |

**Capturas** (iPhone 6,9"): `ios/capturas/01-ruta.png` a `06-simulador.png`. Se
rehacen con `node tools/ios-capturas.js`. La de `revision-impulso.png` no va en la
ficha: va en la suscripción (paso 3e).

**Clasificación por edad:** contesta con la verdad el cuestionario. Hay contenido
de otras personas (la Plaza) y conversación entre usuarios (después de que los
dos dicen «Veo valor»); lo demás, no.

### La privacidad de la app (las «etiquetas»)

No hay rastreo, ni publicidad, ni analítica. Lo que sí sale del teléfono, y solo si
la persona entra a la Plaza o compra Impulso:

| Dato | Uso | ¿Ligado a la persona? |
|---|---|---|
| Contacto › Correo electrónico | Funcionalidad de la app (entrar) | Sí |
| Contenido del usuario › Otro contenido (el puesto y los mensajes de la Plaza) | Funcionalidad de la app | Sí |
| Identificadores › ID de usuario (la cuenta) | Funcionalidad de la app | Sí |
| Compras › Historial de compras (si tiene Impulso) | Funcionalidad de la app | Sí |

A todo lo demás: **no se recopila**. Lo que se le pregunta a la IA se procesa al
momento y no se guarda; de Impulso solo se guarda cuántas preguntas van.

### Notas para el revisor (en inglés)

Cambia el correo y el código por los que pusiste en el paso 1.

```
Emprendo is a free business-learning app in Spanish. All lessons, challenges, the simulator and the mentor ("Chispa") work without an account and offline. On first launch, tap "Registrar mi idea" and answer four short questions.

OPTIONAL ACCOUNT — only for "La Plaza", a space where small businesses show a market stall. To sign in: Negocio tab > "La Plaza" > "Ver mi vitrina" > "Así está bien" > "Entrar con mi correo".
Email: REVISION_EMAIL_HERE
Code: REVISION_CODE_HERE
(No email is sent to this address; its code is fixed for review.)

ACCOUNT DELETION: Perfil tab > Ajustes > "Tu cuenta" > "Borrar mi cuenta".

USER-GENERATED CONTENT: in La Plaza every stall can be reported ("Denunciar") and its owner blocked ("Bloquear"). Only text approved by its owner is published; contact details cannot be published, and free text between two people is only delivered after both accept.

IN-APP PURCHASE: "Emprendo Impulso", monthly auto-renewable subscription (life.emprendo.app.impulso.mensual). Perfil tab > "Emprendo Impulso". No account is required to buy. "Ya lo tenía: recuperarlo" restores purchases; "Gestionar o cancelar" opens Apple's subscription management.

MICROPHONE / SPEECH RECOGNITION: optional, to dictate answers to Chispa instead of typing.

All app code ships inside the bundle; nothing executable is downloaded.
```

---

## Cómo está armado, para quien lo toque después

| Archivo | Qué es |
|---|---|
| `capacitor.config.json` | Nombre, identificador y la carpeta `www/` |
| `tools/armar-www.js` | Arma `www/` con la lista del PRECACHE de `sw.js`, ni un archivo más |
| `ios/` | El proyecto de Xcode. Se genera en Windows y se compila en la nube |
| `ios/App/App/Info.plist` | Español, solo vertical, permisos con voz de Chispa, sin cifrado propio |
| `ios/App/App/PrivacyInfo.xcprivacy` | Por qué se leen fechas de archivos (lo pide Apple) |
| `tools/ios-imagenes.js` | El icono de 1024 sin alfa y el arranque naranja |
| `tools/ios-capturas.js` | Las capturas de la tienda, de la app de verdad |
| `tools/ios-certificado.sh` | Certificado, `.p12` y secretos de GitHub, sin Mac |
| `tools/ios-firma.js` | En la nube: firma manual solo en el objetivo App |
| `.github/workflows/ios.yml` | Compila en cada cambio; sube a TestFlight a mano |
| `js/core/nativo.js` | Todo lo que cambia dentro del iPhone |

Para subir una versión nueva: cambia `"version"` en `package.json` (por ejemplo
`1.0.1`) y lanza el workflow. El número de compilación sale solo.
