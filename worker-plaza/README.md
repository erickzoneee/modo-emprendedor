# Worker de la Plaza

El sitio donde viven las vitrinas de otras personas. Es lo único de Emprendo
que guarda datos de alguien fuera de su propio teléfono.

Va **aparte** del Worker de Chispa (`worker/`) a propósito: aquel responde a
cualquiera y no guarda nada; este pide sesión y guarda todo. Si la Plaza se
cae, la IA sigue funcionando.

---

## Estado: desplegado

- **URL:** `https://plaza.emprendo.life`
- **Cuenta:** `Techmarketdigital25@gmail.com` (`740434c6ad262092cf983617356a3a15`), plan Workers Paid
- **Base:** `emprendo-plaza`, región WNAM
- **Correo:** dado de alta en `emprendo.life`, con SPF, DKIM, DMARC y MX de rebote

### Las dos cuentas, y por qué

Emprendo vive repartido en dos cuentas de Cloudflare **a propósito**:

| | Cuenta | Plan |
|---|---|---|
| Worker `chispa` (la IA) | `Villedacaballeroerickjosue@gmail.com` | **Gratuito** |
| Worker `plaza` + base + dominio | `Techmarketdigital25@gmail.com` | **Workers Paid** |

Que Chispa siga en la cuenta gratuita no es un descuido: es lo que mantiene la
promesa de `worker/README.md` de que **la IA no puede generar un cobro**. Al
agotar los 10.000 neurons del día, Workers AI deja de responder en el plan
gratuito y *cobra el exceso* en el de pago. Con la separación, ese freno sigue
puesto solo.

El día que Chispa se mueva a la cuenta de pago, el cortacircuitos de la Fase 2
deja de ser opcional y hay que desplegarlo **antes**.

`account_id` está fijado en `wrangler.jsonc` justamente por esto: sin él,
wrangler despliega en la cuenta que tenga la sesión abierta, y eso ya salió mal
una vez — la base y el Worker acabaron en una cuenta y el dominio en la otra,
con lo que el correo no habría podido salir nunca.

---

## Los comandos, en orden

Desde esta carpeta. En Windows con PowerShell hay dos tropiezos que ya
conocemos de `worker/README.md`:

- Usa **`npx.cmd`**, no `npx`. Con `npx` a secas, PowerShell coge el
  envoltorio `npx.ps1` y lo bloquea la política de ejecución.
- Usa **`;`** y no `&&` para encadenar.

### 1. Crear la base

```
cd worker-plaza; npx.cmd wrangler d1 create emprendo-plaza
```

Imprime un `database_id`. **Pégalo en `wrangler.jsonc`**, donde ahora pone
`"PENDIENTE"`. Con ese valor, `wrangler deploy` aborta por UUID inválido: no
llega a desplegarse nada. El caso al que hay que estar atento es el otro —
base creada pero **migraciones sin aplicar**—, porque entonces sí despliega y
cada operación falla con `no such table`. Se ve en los registros del Worker.

### 2. Crear las tablas

```
npx.cmd wrangler d1 migrations apply emprendo-plaza --remote
```

Sin `--remote` las crea solo en la copia local de tu máquina. Para ver qué
va a hacer antes de hacerlo:

```
npx.cmd wrangler d1 migrations list emprendo-plaza --remote
```

**Este mismo comando es el que aplica las migraciones nuevas.** El orden lo da
el nombre del archivo, y wrangler solo corre las que faltan.

> `0002_estilo.sql` añade cómo está decorado cada puesto: cinco columnas, una
> por ranura, cada una con su `CHECK` contra el catálogo de
> `js/data/puesto-piezas.js`. Las cinco tienen valor por defecto —el puesto de
> siempre—, así que **se puede aplicar con la Plaza abierta**: las vitrinas ya
> publicadas se siguen viendo exactamente igual.
>
> El Worker desplegado **antes** de esta migración no se rompe con un cliente
> nuevo: `vitrinaLimpia()` construye la vitrina campo por campo desde su propia
> lista blanca, así que un `estilo` que no espera simplemente no existe para
> él. Lo que pasa mientras tanto es que la decoración no se guarda y los
> vecinos ven el puesto de siempre. Al revés —Worker nuevo con base vieja— sí
> falla, con `no such column`: por eso la migración va **antes** del despliegue.

### 3. Desplegar

```
npx.cmd wrangler deploy
```

**Esto funciona con el plan gratuito.** El binding `send_email` se acepta al
desplegar; el plan de pago se exige en el momento de *mandar* un correo, no
antes. Así que el Worker puede estar vivo y probado mucho antes de pagar
nada — lo único que no funciona hasta entonces es que el enlace llegue.

Y no se rompe por eso: si el envío falla, `entrar` responde exactamente lo
mismo que siempre. Esa respuesta única es lo que impide usar el servidor para
averiguar qué correos tienen cuenta, así que no podía depender de que el
correo saliera bien.

### 4. La pimienta

Es la sal con la que se deriva la huella de cada correo, y lo que hace que no
se pueda reconstruir el padrón probando una lista de correos filtrados de
otro sitio. Sin ella puesta, el Worker **se niega a arrancar**: responde 503
en vez de seguir funcionando con una huella reversible.

```
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npx.cmd wrangler secret put PIMIENTA
```

**Si se pierde, nadie puede volver a entrar con su correo de siempre**:
cambiar la pimienta equivale a borrar todas las cuentas, porque las huellas
guardadas dejan de coincidir con nada. Guárdala en el gestor de contraseñas,
no solo en Cloudflare.

Un detalle de la plataforma que costó un despliegue descubrir: **Workers no
admite PBKDF2 por encima de 100.000 iteraciones**. Node sí, así que la prueba
local pasaba y producción devolvía `Pbkdf2 failed` tirando `entrar` y
`confirmar` enteros. `tools/check-plaza-worker.js` ahora lo comprueba.

### 5. El correo *(necesita Workers Paid)*

```
npx.cmd wrangler email sending enable emprendo.life
npx.cmd wrangler email sending dns get emprendo.life
```

El primero añade SPF y DKIM solo. El segundo te deja comprobarlos. Suele
propagar en cinco o quince minutos.

### 6. El dominio del Worker

En el panel: **Workers & Pages › plaza › Settings › Domains & Routes › Add ›
Custom domain** → `plaza.emprendo.life`.

Con eso, `ORIGENES` y `APP_URL` de `wrangler.jsonc` ya apuntan a donde deben.

---

## Probarlo sin desplegar nada

```
node tools/check-plaza-worker.js
```

Monta una base SQLite de verdad en memoria, le aplica la migración real y
ejecuta el Worker real contra ella. **58 comprobaciones**, y las seis reglas
se comprueban ejecutando el código, no leyéndolo: que el mensaje de un «veo
valor» no llega antes de aceptar, que borrarse no deja rastro en ninguna de
las diez tablas, que un contacto escrito a mano se cae, que `op:"constructor"`
no se cuela.

Merece la pena correrlo antes de cada despliegue.

---

## Comprobar que responde

```
Invoke-RestMethod -Uri https://plaza.emprendo.life -Method Post -ContentType "application/json" -Headers @{Origin="https://app.emprendo.life"} -Body '{"op":"entrar","correo":"tu@correo.com"}'
```

Debe devolver siempre lo mismo, exista la cuenta o no:

```json
{ "ok": true, "mensaje": "Si ese correo es correcto, te llegará un enlace." }
```

Que responda igual en los dos casos **es la función, no un descuido**: si
dijera «esa cuenta no existe», cualquiera podría usar esto para averiguar
quién está en la Plaza.

Si responde `403 Origen no permitido`, la cabecera `Origin` no coincide con
`ORIGENES`. Eso es la protección haciendo su trabajo.

---

## Las seis reglas del código

Están escritas en la cabecera de `src/index.js` y conviene no aflojarlas sin
pensarlo dos veces:

1. **El correo no se guarda.** Entra, se convierte en huella y se olvida.
2. **Una sola puerta.** Un `POST` con `op` dentro del cuerpo. La sesión viaja
   en el JSON porque el CORS solo admite la cabecera `content-type`.
3. **La lista blanca se reaplica aquí.** La del teléfono protege al usuario de
   sí mismo; esta protege a los demás de un cliente modificado.
4. **Nada de texto libre antes de la aceptación mutua.** Quien recibe un «veo
   valor» ve la intención y el motivo, no el mensaje.
5. **El cuerpo no se registra en ningún log.** La sesión viaja ahí dentro.
6. **Borrar borra.** No hay estado «borrada»: la cascada se lo lleva todo, y
   D1 aplica las claves foráneas por defecto, así que la cascada es de verdad.

---

## Lo que todavía no tiene

Escrito aquí para que no se descubra tarde:

- **No hay panel de denuncias.** Hasta que lo haya, se leen a mano:

  ```
  npx.cmd wrangler d1 execute emprendo-plaza --remote --command "SELECT d.at, d.motivo, d.nota, d.sobre_id, v.negocio, v.producto FROM denuncia d LEFT JOIN vitrina v ON v.cuenta_id = d.sobre_id WHERE d.estado = 'abierta' ORDER BY d.at DESC"
  ```

  Y para ocultar un puesto:

  ```
  npx.cmd wrangler d1 execute emprendo-plaza --remote --command "UPDATE vitrina SET estado = 'oculta' WHERE cuenta_id = 'EL-ID'"
  ```

  Ocultar es distinto de retirar: el dueño no puede sacarlo de ahí volviendo a
  guardar su vitrina. Para suspender la cuenta entera, `UPDATE cuenta SET
  estado = 'suspendida'` — deja de poder entrar en la petición siguiente.
- **No se limpian solos** los enlaces y las sesiones caducados. Hace falta un
  cron cuando haya volumen; con veinte usuarios no.
- **No hay copia de seguridad automática** de la base.
- **Un bloqueo no es para siempre:** quien sea bloqueado puede registrarse con
  otro correo. Lo que sí funciona es que antes de la aceptación mutua no viaja
  ni un carácter de texto libre.
- **No se pueden cerrar las sesiones a distancia.** Si alguien pierde el
  teléfono, la sesión de ese aparato vale 30 días y la única salida es
  borrarse la cuenta. Con pocos usuarios es un riesgo teórico; cuando haya
  más, hace falta una operación `cerrar-sesiones`.
- **`edad_ok` se guarda y no se lee.** Lo declara el cliente al entrar y hoy
  no bloquea nada. O se aplica de verdad o se quita la columna: dejarlo a
  medias da la sensación de una barrera que no existe.
- **`vecinos` devuelve 60 vitrinas por orden de publicación.** Con pocos
  usuarios el catálogo cabe entero. Pasando de 60, quien guarde su vitrina
  ocupa la Plaza de todos y hace falta paginación — es el fin del producto,
  no un fallo de seguridad, pero conviene anotarlo.
