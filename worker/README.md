# Worker de Chispa

Lo que le da IA a **todos** los usuarios de Emprendo sin que ninguno tenga que
conseguir una clave ni pagar nada.

Son cinco minutos y no hace falta tarjeta.

---

## Por qué existe

Emprendo se publica como archivos estáticos en GitHub Pages. Cualquier cosa que
esté en el JavaScript es pública, así que **no hay dónde esconder una clave de
API**. Este Worker resuelve eso de raíz: no tiene ninguna clave. El binding
`env.AI` se autentica contra tu cuenta de Cloudflare desde dentro del propio
Worker, donde nadie puede leerlo.

## Lo que no puede pasar

En el plan gratuito de Cloudflare **es imposible que esto te genere un cobro**.
Al agotarse los 10.000 neurons del día, el servicio deja de responder hasta el
día siguiente. No factura: corta. Pasar a plan de pago es una decisión manual
tuya, nunca automática.

Con Qwen3-30B esa cuota da para unos **104 usuarios activos al día** a cinco
consultas cada uno, y cerca de **275** aprovechando la caché que la app ya tiene.

---

## Desplegarlo

**1. Crea una cuenta de Cloudflare** en [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
Gratuita, sin tarjeta.

**2. Revisa el dominio permitido.** Abre `wrangler.jsonc` y comprueba que
`ORIGENES` tenga el tuyo. Si publicas en otro sitio, cámbialo:

```
"ORIGENES": "https://TU-USUARIO.github.io,http://localhost:4321"
```

Nunca pongas `"*"`: cualquier web podría colgar su chat de tu cuota.

**3. Despliega.** Desde esta carpeta:

```bash
npx wrangler deploy
```

La primera vez abre el navegador para que autorices la cuenta. Al terminar
imprime la URL, algo como `https://chispa.TU-CUENTA.workers.dev`.

**4. Pégala en la app.** En Emprendo: **Perfil › Mentor con IA › Usar la IA
gratuita de Emprendo**, y pega ahí la URL. Se guarda en el dispositivo.

---

## Comprobar que funciona

```bash
curl -X POST https://chispa.TU-CUENTA.workers.dev \
  -H "content-type: application/json" \
  -H "Origin: https://TU-USUARIO.github.io" \
  -d '{"mensaje":"Responde solo: ok"}'
```

Debe devolver `{"texto":"ok","modelo":"@cf/qwen/qwen3-30b-a3b-fp8"}`.

Si responde `403 Origen no permitido`, la cabecera `Origin` no coincide con
`ORIGENES`. Eso es la protección haciendo su trabajo.

## Ver el consumo

En el panel de Cloudflare: **Workers & Pages › tu worker › Metrics**, y para los
neurons, **AI › Workers AI**. Ahí se ve cuánto queda del día.

## Cambiar de modelo

```bash
npx wrangler ai models
```

Edita `MODELO` en `wrangler.jsonc` y vuelve a desplegar. El resto de la app no
se entera: la interfaz es la misma.

---

## Lo que protege y lo que no

| Protección | Qué evita | Qué no evita |
|---|---|---|
| CORS por origen | Que otra web use tu cuota desde el navegador | Peticiones con `curl` y la cabecera puesta |
| Límite por IP (12/min) | Ráfagas y raspado automático | Alguien con muchas IP |
| Techo de entrada y salida | Que una petición enorme se coma la cuota | — |
| Plan gratuito de Cloudflare | **Cualquier cobro inesperado** | — |

La última fila es la que de verdad importa: el peor caso de un abuso es que se
agote la cuota del día y Chispa siga respondiendo con sus reglas y fórmulas,
que es lo que hace el 80% del tiempo de todos modos.
