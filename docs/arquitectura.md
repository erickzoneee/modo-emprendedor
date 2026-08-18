# Arquitectura de producción de EMPRENDO

**Fase 1.** Decide dónde vive cada cosa y deja los nombres en un solo archivo hasta que
el dominio esté comprado.

---

## 1. La recomendación, en una frase

**Todo en Cloudflare: Pages para las dos webs, Workers para la API, KV para los contadores.
Supabase entra solo cuando lleguen las cuentas, en la Fase 3.** Sin VPS, sin contenedores y
sin nada que actualizar por las noches.

No es la respuesta de moda: es que esta app ya está construida como archivos estáticos y un
único endpoint. Meterla en un servidor tradicional sería pagar por un ordenador encendido las
24 horas para servir seis megas de JavaScript que no cambian.

---

## 2. Los tres dominios

| Dominio | Qué es | Dónde vive | Coste |
|---|---|---|---|
| `emprendo.mx` | Página pública: qué es, privacidad, soporte, enlaces de descarga | Cloudflare Pages (proyecto 1) | 0 |
| `app.emprendo.mx` | La aplicación: esta PWA | Cloudflare Pages (proyecto 2) | 0 |
| `api.emprendo.mx` | El Worker de IA | Cloudflare Workers, ruta personalizada | 0 hasta el techo |

Dos proyectos de Pages y no uno con subcarpeta, por una razón concreta: **la app y la web
pública no deben compartir origen.** Si comparten origen comparten `localStorage`, service
worker y ámbito de cookies, y un despliegue de la web de marketing podría interferir con el
service worker de la app. Separarlas cuesta lo mismo (cero) y elimina la clase entera de
problema.

El dominio se compra donde sea, pero los **nameservers** apuntan a Cloudflare. A partir de ahí
los tres registros son de un clic y el certificado TLS es automático.

---

## 3. Por qué no un VPS

No es ideología, son cuatro cuentas concretas:

| | VPS tradicional | Esta arquitectura |
|---|---|---|
| Coste en reposo | 5–20 USD/mes, encendido siempre | 0 |
| Escala a 10.000 usuarios | Cambiar de plan, medir, ajustar | Automática, sin tocar nada |
| Parches de seguridad del sistema | Tuyos | No hay sistema que parchear |
| Latencia desde México | Un solo centro de datos | Se sirve desde el borde más cercano |

El único caso en el que un VPS ganaría es si necesitaras un proceso de larga duración o una
base de datos que no encaje en el modelo. Nada de lo que pide el plan de diez fases lo
necesita.

---

## 4. Qué hace cada pieza, y dónde está el techo

Los números del nivel gratuito hay que **confirmarlos al dar de alta la cuenta** —cambian—,
pero el orden de magnitud es el que decide la arquitectura:

| Servicio | Nivel gratuito | Para qué lo usamos | ¿Nos aprieta? |
|---|---|---|---|
| Pages | Ancho de banda y peticiones sin límite | Servir las dos webs | No |
| Workers | ~100.000 peticiones/día | El endpoint de IA | No |
| **Workers AI** | **~10.000 neurons/día** | Generar las respuestas | **Sí. Es el techo real.** |
| KV | ~1.000 escrituras/día | Cuota diaria y cortacircuitos | No, porque la IA se agota antes |
| Supabase (Fase 3) | 500 MB, ~50.000 usuarios activos/mes | Cuentas y sincronización | No a corto plazo |

### El techo que importa

10.000 neurons/día ≈ **520 generaciones al día** ≈ **unos 100 usuarios activos**, contando
cinco consultas por usuario.

Eso no es un problema hoy y es una decisión de negocio mañana. Lo que sí es un problema es
descubrirlo por sorpresa, así que la Fase 2 monta dos frenos:

1. **Cuota diaria por instalación** en KV. Frena el uso accidental.
2. **Cortacircuitos global.** Al llegar al techo del día, el Worker deja de llamar al modelo y
   responde que no hay IA. Chispa sigue contestando con sus reglas, que es lo que hace la mayor
   parte del tiempo de todos modos.

Con esos dos, el peor día posible es «hoy no hay IA», nunca «hoy llegó una factura». Cuando
100 usuarios al día se queden cortos, subir de plan es una decisión consciente con un número
delante, no un accidente.

> El límite por instalación es un freno, no una barrera: sin cuentas obligatorias no hay
> identidad fiable, y cualquier identificador que genere el cliente se regenera borrando el
> almacenamiento. El que de verdad protege la cuenta es el cortacircuitos global.

---

## 5. Lo que hay que hacer cuando el dominio esté comprado

Los nombres viven en **[`js/data/brand.js`](../js/data/brand.js)** y en ningún otro sitio
ejecutable. Cambiar de dominio es editar `DOMINIOS`:

```js
var DOMINIOS = {
  sitio: 'https://emprendo.mx',
  app:   'https://app.emprendo.mx',
  api:   'https://api.emprendo.mx'
};
```

Lo que **no** lee de ahí, a propósito:

- Las etiquetas `<meta>` de `index.html`. Las lee el robot de WhatsApp o de Facebook, que
  nunca ejecuta JavaScript. Se cambian a mano en la Fase 4.
- `assets/og-image.png`, que lleva el nombre dibujado dentro.

---

## 6. El traslado desde GitHub Pages

**Esta es la parte delicada de todo el proyecto.** Mover la app de
`erickzoneee.github.io/modo-emprendedor/` a `app.emprendo.mx` es un **cambio de origen**, y el
navegador no permite que el origen nuevo lea lo que guardó el viejo. El progreso de los
usuarios actuales no cruza solo.

La solución acordada es una **página puente**, y tiene tres partes:

1. En el origen viejo se publica una página mínima —`puente.html`— que lee su propio
   `localStorage` y lo entrega por `postMessage`.
2. `app.emprendo.mx` la carga en un iframe oculto la primera vez que arranca sin datos, pide
   el progreso y lo importa por el mismo camino validado que usan los respaldos.
3. El origen viejo se mantiene vivo **varios meses**, redirigiendo al nuevo y sirviendo el
   puente.

Requisitos que no se pueden saltar:

- El puente valida el `origin` del mensaje en los dos sentidos. Sin eso, cualquier web podría
  pedirle el progreso a un usuario.
- El progreso entra por `Store.inspectBackup()`, que ya valida versión, forma, tipos y claves
  peligrosas desde la Fase 0.5. No se importa nada a ciegas.
- Antes de apagar el origen viejo, el service worker de ahí tiene que dejar de servir la app
  y empezar a servir la redirección. Con el `sw.js` anterior a la Fase 0.5 esto era imposible;
  ahora una respuesta que no sirve ya cuenta como fallo y la copia offline no secuestra al
  usuario para siempre.

Se construye en la **Fase 3**, junto con las cuentas: quien tenga cuenta cruza por la nube y
quien no, por el puente.

---

## 7. Orden de ejecución

| Fase | Qué se monta |
|---|---|
| 1 *(esta)* | `brand.js` como fuente única. Nada cambia de nombre todavía. |
| 2 | Worker en `api.emprendo.mx`, cuota en KV, cortacircuitos, CSP y cabeceras. |
| 3 | Supabase con enlace mágico y RLS. Cola de sincronización. **Página puente.** |
| 4 | Cambio de marca y de dominio, ya con el puente probado. |

El dominio se puede comprar en cualquier momento; nada de las fases 1 a 3 depende de que
exista. Lo que sí conviene es comprarlo **antes de la Fase 4**, porque esa fase es la que
mueve a los usuarios.

---

## 8. Lo que esta arquitectura no resuelve

Para que quede escrito y no se descubra tarde:

- **Sin cuentas, el progreso vive en un solo navegador.** El respaldo manual lo mitiga; la
  sincronización de la Fase 3 lo resuelve.
- **La IA gratuita depende de una cuenta de Cloudflare.** Si esa cuenta se suspende, la IA
  desaparece para todos a la vez. El mentor local sigue funcionando, que es exactamente por
  qué se diseñó así.
- **La IA local descarga su librería de un CDN** (`esm.run`), así que hoy no funciona sin
  conexión pese a lo que promete. Se arregla auto-hospedándola en la Fase 2.
