-- ==========================================================================
-- PLAZA · 0004 — el contador de consultas a Chispa
--
-- Impulso da acceso a un modelo de pago, y un modelo de pago se puede gastar.
-- Sin un tope por cuenta, un solo suscriptor con un bucle se lleva por delante
-- el margen de todos los demás, y no habría forma de saber quién fue.
--
-- UNA FILA POR CUENTA, no una por consulta. Guardar cada pregunta sería
-- guardar de qué habla la gente de su negocio, y esta base se diseñó para lo
-- contrario: aquí no vive ni el correo. De cada persona se sabe cuántas van
-- hoy y cuántas van este mes. Nada más.
--
-- DOS VENTANAS Y NO UNA:
--   · la del día suaviza los picos y evita que alguien se coma el mes en una
--     tarde;
--   · la del mes es el tope real y es lo que se le promete en la pantalla.
--
-- Las dos se reinician solas comparando su marca de tiempo, sin ningún
-- disparador: es el mismo truco de la tabla `pedido`, que lleva funcionando
-- desde el primer día. Contar y decidir van en UNA sentencia, porque con un
-- SELECT y luego un UPDATE, treinta peticiones a la vez leen todas «cero» y
-- el tope de cuarenta se convierte en setenta.
--
-- La clave foránea NO es decorativa: sin ella, `borrarme()` dejaría atrás el
-- contador de alguien que pidió que le borraran todo, y habría que acordarse
-- de limpiarlo a mano en el array `pasos`. Con la cascada, se va solo.
--
--   npx wrangler d1 migrations apply emprendo-plaza --remote
-- ==========================================================================

CREATE TABLE uso_ia (
  cuenta_id   TEXT PRIMARY KEY REFERENCES cuenta(id) ON DELETE CASCADE,

  -- La ventana del día.
  hoy         INTEGER NOT NULL DEFAULT 0,   -- cuántas van
  hoy_desde   INTEGER NOT NULL DEFAULT 0,   -- cuándo arrancó, en milisegundos

  -- La ventana del mes.
  mes         INTEGER NOT NULL DEFAULT 0,
  mes_desde   INTEGER NOT NULL DEFAULT 0
);
