-- ==========================================================================
-- PLAZA · 0005 — Entrar con un código de seis números
--
-- El enlace del correo abre el navegador, y el navegador no es la app. En la
-- app de iPhone, y también en la web instalada en un iPhone —que guarda en
-- un sitio distinto que Safari—, tocar el enlace dejaba la sesión en el
-- lugar equivocado. Con un código que se escribe a mano, la sesión acaba
-- justo donde se pidió.
--
-- Va en la MISMA fila que el enlace, y no en una tabla aparte: un correo
-- trae las dos llaves, y canjear una tiene que gastar la otra. Con dos tablas
-- habría que acordarse de borrar en las dos, y `borrarme()` ya tiene una
-- lista de tablas sueltas que no hace falta alargar.
--
-- `codigo_hash` es sha256(huella del correo + ':' + código). La huella va
-- dentro para que el mismo código en dos correos distintos no dé la misma
-- huella. Seis números se adivinan por fuerza bruta en un millón de
-- intentos; lo que lo impide no es el hash, es `intentos`.
--
-- `intentos` cuenta TODOS los intentos, también el bueno, y se suma antes de
-- comparar. Con cinco por enlace, treinta peticiones a la vez siguen siendo
-- cinco intentos, no treinta.
--
-- Las dos columnas aceptan NULL o llevan DEFAULT: los enlaces que ya existen
-- no tienen código y siguen sirviendo como enlace hasta que caduquen.
--
--   npx wrangler d1 migrations apply emprendo-plaza --remote
-- ==========================================================================

ALTER TABLE enlace ADD COLUMN codigo_hash TEXT;
ALTER TABLE enlace ADD COLUMN intentos INTEGER NOT NULL DEFAULT 0;

-- Por aquí se busca al escribir un código: por el correo, no por el token.
CREATE INDEX idx_enlace_correo ON enlace(correo_hash);
