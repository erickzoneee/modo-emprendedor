-- ==========================================================================
-- PLAZA · 0003 — Emprendo Impulso
--
-- Cuatro columnas en `cuenta`, y no una tabla aparte. La razón es concreta:
-- `borrarme()` se lleva `cuenta` en cascada, y las tablas que no cuelgan de
-- ella (bloqueo, denuncia, enlace, pedido) hay que borrarlas a mano dentro
-- del array `pasos` de src/index.js. Una tabla nueva de suscripción heredaría
-- esa trampa, y la consecuencia de olvidarla no sería un dato huérfano
-- cualquiera: sería el identificador de pago de alguien que pidió que le
-- borraran todo.
--
-- Las cuatro llevan DEFAULT, así que esta migración es segura de correr con
-- la Plaza abierta: las cuentas que ya existen quedan en 'gratis' sin que
-- nadie note nada. Es el mismo molde de 0002.
--
-- `plan_hasta` es el instante en que se acaba lo pagado, en milisegundos.
-- No hay disparador que lo apague al llegar la fecha, y no hace falta: se
-- compara contra el reloj dentro de quienEs(), que es el punto por el que
-- pasa toda operación autenticada. Una columna que se escribe y nunca se
-- lee ya existe en esta base —`edad_ok`— y no se repite el error.
--
-- `pago_cliente` es el identificador del cliente en la pasarela. Es la única
-- forma de saber a qué cuenta se refiere un aviso de pago: el aviso llega
-- desde fuera, sin sesión y sin correo, y lo único que trae es ese id.
--
--   npx wrangler d1 migrations apply emprendo-plaza --remote
-- ==========================================================================

ALTER TABLE cuenta ADD COLUMN plan TEXT NOT NULL DEFAULT 'gratis'
  CHECK (plan IN ('gratis', 'impulso'));

-- Milisegundos. 0 = nunca ha pagado.
ALTER TABLE cuenta ADD COLUMN plan_hasta INTEGER NOT NULL DEFAULT 0;

-- El cliente y la suscripción en la pasarela. Vacíos mientras no haya pagado.
-- No son datos personales: son referencias opacas. El correo, el nombre y la
-- tarjeta se quedan en la pasarela y no entran aquí, igual que el correo no
-- entra en `cuenta`.
ALTER TABLE cuenta ADD COLUMN pago_cliente TEXT NOT NULL DEFAULT '';
ALTER TABLE cuenta ADD COLUMN pago_sub     TEXT NOT NULL DEFAULT '';

-- Por aquí entra el aviso de la pasarela: trae el id de cliente y hay que
-- llegar a la cuenta. Sin índice, cada aviso recorre la tabla entera.
-- Parcial a propósito: las cuentas que nunca pagaron tienen la cadena vacía
-- y no tienen por qué ocupar sitio en el índice.
CREATE INDEX idx_cuenta_pago ON cuenta(pago_cliente) WHERE pago_cliente <> '';
