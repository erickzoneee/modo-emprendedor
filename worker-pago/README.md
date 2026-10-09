# El Worker que cobra

Emprendo Impulso: 99 pesos al mes (MXN), con Stripe. Este Worker hace tres cosas y ninguna
más — manda a la gente a pagar, escucha lo que Stripe le cuenta y firma el pase que
la app comprueba sin conexión.

**No lo puede desplegar Claude.** Necesita `wrangler` autenticado y esa sesión vive
en tu máquina, no aquí. Abajo están los comandos en el orden en que hay que
correrlos.

---

## Por qué existe, en vez de ser una operación más de la Plaza

El Worker de la Plaza comprueba la cabecera `Origin` contra su lista blanca **antes
que nada** y devuelve 403 a todo lo que no venga de ahí. Esa comprobación no es un
detalle: es su modelo de seguridad entero, porque la sesión viaja dentro del cuerpo
y no en una cabecera de autorización.

Un aviso de pago no manda `Origin`. Lo manda un servidor de Stripe, no un navegador.
Meter el webhook en la Plaza obligaría a abrir un agujero justo ahí.

Así que el dinero vive aparte. **Comparten la misma base D1** —el plan son cuatro
columnas de la tabla `cuenta`— pero no comparten código ni despliegue, y la Plaza no
se toca.

---

## El pase, en tres frases

La app funciona sin conexión, así que no puede preguntar «¿este ha pagado?» en cada
arranque. Y no puede guardar un `plan: 'impulso'` a secas, porque el estado de la app
es un JSON de localStorage cuyo propio importador acepta lo que le pongan.

Por eso este Worker **firma**. Devuelve un pase —cuenta, plan y hasta cuándo— con una
firma ECDSA P-256 que la app verifica con la mitad pública, sin red y en un
milisegundo. Un pase editado a mano no verifica.

Lo que esto **no** resuelve, y está aceptado: la app es JavaScript que se descarga
entero, así que quien sepa parchearla se lo salta siempre. Lo que se cierra es el
fraude real —cambiar un valor en el almacenamiento— que puede hacer cualquiera en dos
minutos.

---

## Ponerlo en marcha

### 1 · La migración de la base

Va **antes** que todo lo demás. Un Worker nuevo contra una base vieja falla con
`no such column`; una base nueva con un Worker viejo simplemente tiene columnas que
nadie mira todavía.

Se aplica desde `worker-plaza/`, que es donde vive la carpeta `migrations/`:

```bash
cd worker-plaza && npx wrangler d1 migrations apply emprendo-plaza --remote
```

### 2 · La llave del pase

```bash
node tools/nueva-llave-pase.js
```

Imprime las dos mitades. La **privada** va aquí:

```bash
cd worker-pago && npx wrangler secret put PASE_JWK
```

Y la **pública** se pega a mano en la lista `LLAVES` de `js/core/impulso.js`.

> **Cuidado al rotarla.** Las dos mitades tienen que ir juntas: con una llave nueva
> en el Worker y la vieja en la app, ningún pase verifica y todo el que pagó pierde
> Impulso a la vez, sin conexión y sin poder arreglarlo desde su lado. Para rotar de
> verdad: primero se despliega la app aceptando **las dos** públicas, se espera a que
> la gente la reciba, y solo después se cambia el secreto.

### 3 · Stripe

En el panel de Stripe, con las claves de **prueba** primero:

1. **Products** → un producto «Emprendo Impulso» con un precio **recurrente mensual
   de 99 MXN**. Copia su `price_…`.
2. **Developers › API keys** → copia la clave secreta `sk_test_…`.
3. **Developers › Webhooks** → un punto de entrada a
   `https://pago.emprendo.life/webhook` con estos seis eventos:

   ```
   checkout.session.completed
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.paid
   invoice.payment_failed
   ```

   Copia su secreto de firma `whsec_…`.

Y los tres van como secretos:

```bash
cd worker-pago && npx wrangler secret put STRIPE_SK
```

```bash
cd worker-pago && npx wrangler secret put STRIPE_PRECIO
```

```bash
cd worker-pago && npx wrangler secret put STRIPE_WHSEC
```

### 4 · Desplegar

```bash
cd worker-pago && npx wrangler deploy
```

### 5 · Encender Impulso en la app

Dos líneas, y hasta que no estén las dos, Impulso no existe: la app no enseña la
pantalla de cobro, nadie ve un precio y ninguna otra pantalla pinta su invitación.

- `js/data/brand.js` → `DOMINIOS.pago = 'https://pago.emprendo.life'`
- `js/core/impulso.js` → la llave pública dentro de `LLAVES`

Después, subir `VERSION` en `sw.js` y `git push origin main`.

En la **web**, además, el botón de pagar sigue apagado hasta que
`CONFIG.IMPULSO.cobroWeb` esté en `true` (`js/data/config.js`). Va aparte porque
la app de iPhone cobra con Apple y puede abrir antes que Stripe.

### 6 · Apple (la app de iPhone)

En el iPhone se cobra con Apple: Apple no deja otro cobro para algo digital. La
app hace la compra con StoreKit y le manda a este Worker el número de compra; el
Worker se lo pregunta a Apple con su propia llave (App Store Server API) y firma
**el mismo pase de siempre**. Sin correo: Apple no deja exigir una cuenta antes
de comprar algo que no vive en la cuenta, así que sin sesión el pase sale a
nombre de la compra, y con sesión la compra se ata a la cuenta.

Tres secretos, que salen de App Store Connect › Usuarios y acceso › Integraciones
› **Compras dentro de la app** (no la llave de la API, que es otra):

```bash
npx wrangler secret put APPLE_IAP_KEY      # el contenido entero del .p8
npx wrangler secret put APPLE_IAP_KEY_ID
npx wrangler secret put APPLE_ISSUER_ID
```

Y los avisos de Apple —renovaciones, cancelaciones, reembolsos— apuntan a
`https://pago.emprendo.life/apple`, versión 2, en producción y en pruebas. El
aviso solo se usa para saber **de qué compra** habla: lo que se escribe en la base
sale siempre de volver a preguntarle a Apple. Un aviso inventado cuesta una
consulta y no cambia nada.

Con TestFlight y durante la revisión de Apple se compra en el entorno de pruebas;
el Worker pregunta primero a producción y, si Apple no conoce la compra, a
pruebas. Se comprueba con `node tools/check-pago-apple.js`, que ejecuta este
Worker contra un Apple de mentira que además verifica cada JWT.

---

## Las dos puertas

| Ruta | Quién llama | Cómo se autentica |
|---|---|---|
| `POST /webhook` | Stripe | Firma HMAC del cuerpo (`Stripe-Signature`), con tolerancia de 5 minutos |
| `POST /apple` | Apple | Nada que comprobar: solo da el número de compra, y se le vuelve a preguntar a Apple |
| `POST /` | La app | `Origin` en lista blanca + sesión de la Plaza dentro del cuerpo |

### Las cinco operaciones

| `op` | Qué hace |
|---|---|
| `pase` | Devuelve el pase firmado. La llama la app sola en cada arranque con red |
| `apple` | La compra del iPhone: pregunta a Apple y firma el pase. La sesión es opcional |
| `checkout` | Devuelve la dirección de Stripe donde se paga |
| `portal` | Devuelve la página de Stripe donde se cancela y se cambia la tarjeta |
| `cancelar` | Cancela de verdad y al momento. Es el paso previo a borrar la cuenta |

`cancelar` no es el botón de cancelar de la pantalla —ese va al portal—. Existe
porque la Plaza borra en cascada y sin marcha atrás: si alguien borra su cuenta con
una suscripción viva, le siguen cobrando cada mes y ya no queda una sola fila que
relacione ese cobro con nadie. Por eso la app lo llama **antes** de borrar, y si
falla, no borra.

---

## Lo que guarda, y lo que no

En la tabla `cuenta`, cuatro columnas (migración `0003_impulso.sql`):

| Columna | Qué es |
|---|---|
| `plan` | `'gratis'` o `'impulso'` |
| `plan_hasta` | Milisegundos. Hasta cuándo está pagado. `0` = nunca pagó |
| `pago_cliente` | El cliente en Stripe. Es lo único que relaciona un aviso con una cuenta |
| `pago_sub` | La suscripción en Stripe |

**No se guarda** el correo (la Plaza tampoco: solo su huella), ni el nombre, ni nada
de la tarjeta. Eso se queda en Stripe, que es la razón de usarlo.

La caducidad no necesita ningún disparador: se compara `plan_hasta` con el reloj
dentro de `quienEs()`, que es el punto por el que ya pasa todo.

---

## Probarlo sin cobrarle a nadie

Con las claves de prueba, Stripe acepta la tarjeta `4242 4242 4242 4242`, cualquier
fecha futura y cualquier CVC.

En local hay un problema conocido y a propósito: `ORIGENES` **no incluye localhost**,
igual que en la Plaza, porque aquí la sesión viaja dentro del cuerpo. Para desarrollo
hay que usar `npx wrangler dev`, que trae su propio origen.

Y lo que sí se puede correr siempre, sin desplegar nada:

```bash
node tools/check-impulso.js
```

Firma pases de verdad con la misma criptografía del Worker y los pasa por la
verificación real de la app: comprueba que uno bueno se acepta, que uno manipulado
se rechaza, que uno caducado se rechaza, que uno firmado con otra llave se rechaza y
que no hay ni un secreto dentro del repositorio.

```bash
node tools/check-gratis.js
```

Comprueba lo otro, que importa igual: que un usuario **sin pagar** siga llegando del
primer nodo de la ruta al último.

---

## Lo que todavía no hay

- **No hay plan anual**, ni descuentos, ni prueba gratuita. Un solo precio.
- **No se avisa antes de renovar.** Stripe manda su propio recibo por correo.
- **No hay reembolsos desde la app.** Se hacen desde el panel de Stripe.
- **No hay cuota de IA por cuenta todavía**: eso es la fase 2, y va en el Worker de
  la Plaza, que es el que tiene sesiones y base.
