-- ==========================================================================
-- PLAZA · 0002 — cómo está decorado cada puesto
--
-- Cinco columnas y no una de JSON. Una columna por ranura porque cada ranura
-- ES una lista cerrada, y así la propia base puede decirlo con un CHECK: un
-- valor que no esté en el catálogo no entra, aunque el Worker fallara.
--
-- El valor por defecto de cada una es el puesto de siempre —festón, el color
-- del oficio y nada más—, así que las vitrinas que ya estaban publicadas se
-- siguen viendo exactamente igual después de aplicar esto. Esa es la razón de
-- que la migración sea segura de correr con la Plaza abierta.
--
-- Las listas son las mismas de js/data/puesto-piezas.js y las mismas que
-- repite src/index.js. Que las tres no se separen lo vigila
-- tools/check-puesto.js.
--
--   npx wrangler d1 migrations apply emprendo-plaza --remote
-- ==========================================================================

ALTER TABLE vitrina ADD COLUMN estilo_toldo TEXT NOT NULL DEFAULT 'feston'
  CHECK (estilo_toldo IN ('feston','rayas','picos','ondas','cuadros','lona'));

ALTER TABLE vitrina ADD COLUMN estilo_color TEXT NOT NULL DEFAULT 'oficio'
  CHECK (estilo_color IN ('oficio','mandarina','miel','menta','indigo','oceano','teal','cereza','uva','bosque'));

ALTER TABLE vitrina ADD COLUMN estilo_letrero TEXT NOT NULL DEFAULT 'ninguno'
  CHECK (estilo_letrero IN ('ninguno','tabla','pizarra','placa','cinta'));

ALTER TABLE vitrina ADD COLUMN estilo_adorno TEXT NOT NULL DEFAULT 'ninguno'
  CHECK (estilo_adorno IN ('ninguno','macetas','farol','banderines','cajas','pizarron','girasoles'));

ALTER TABLE vitrina ADD COLUMN estilo_suelo TEXT NOT NULL DEFAULT 'ninguno'
  CHECK (estilo_suelo IN ('ninguno','tarima','tapete','adoquin','pasto'));
