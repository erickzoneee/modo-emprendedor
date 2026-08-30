-- ===========================================================================
-- PLAZA · esquema inicial
--
-- Dos decisiones que atraviesan todo lo demás:
--
--   · EL CORREO NO SE GUARDA. Entra, se convierte en huella con una pimienta
--     que vive como secreto del Worker, y se olvida. Ni yo ni nadie con
--     acceso a esta base puede sacar la lista de correos de la gente. El
--     precio es que no se puede mandar un correo a alguien que no acaba de
--     escribirlo, y ese precio se paga con gusto.
--
--   · LA CONVERSACIÓN NO EXISTE HASTA QUE LOS DOS ACEPTAN. No es una fila con
--     una bandera apagada: es que no hay fila. La aceptación mutua queda
--     grabada en la forma de la base, no en una comprobación que alguien
--     pueda olvidar el día que toque este código con prisa.
--
-- Uso:
--   npx wrangler d1 migrations apply emprendo-plaza --remote
-- ===========================================================================

-- ---------------------------------------------------------------- cuenta --
CREATE TABLE cuenta (
  id           TEXT PRIMARY KEY,          -- opaco, generado en el servidor
  correo_hash  TEXT NOT NULL UNIQUE,      -- sha256(correo normalizado + pimienta)
  creada       INTEGER NOT NULL,
  ultima       INTEGER NOT NULL,
  edad_ok      INTEGER NOT NULL DEFAULT 0,
  -- No hay 'borrada': borrar borra de verdad, en cascada, porque una fila
  -- marcada como borrada sigue siendo un dato.
  estado       TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida'))
);

-- ------------------------------------------------------------- vitrina --
-- Un puesto por cuenta. Los seis campos de texto son exactamente los que
-- js/core/plaza.js declara publicables y tools/check-vitrina.js vigila.
CREATE TABLE vitrina (
  cuenta_id  TEXT PRIMARY KEY REFERENCES cuenta(id) ON DELETE CASCADE,
  negocio    TEXT NOT NULL DEFAULT '',
  producto   TEXT NOT NULL DEFAULT '',
  idea       TEXT NOT NULL DEFAULT '',
  cliente    TEXT NOT NULL DEFAULT '',
  problema   TEXT NOT NULL DEFAULT '',
  valor      TEXT NOT NULL DEFAULT '',
  sector     TEXT NOT NULL
             CHECK (sector IN ('hechoamano','comida','servicios','digital','reventa','otro')),
  etapa      TEXT NOT NULL
             CHECK (etapa IN ('idea','starting','operating','growing')),
  -- 'oculta' la pone la moderación; el dueño no puede sacarla de ahí solo,
  -- para que despublicar signifique algo.
  estado     TEXT NOT NULL DEFAULT 'publicada'
             CHECK (estado IN ('publicada','retirada','oculta')),
  publicada  INTEGER NOT NULL
);
CREATE INDEX idx_vitrina_viva ON vitrina(estado, publicada DESC);

-- --------------------------------------------------------------- valor --
-- "Veo valor". Una fila por dirección: A→B y B→A son cosas distintas, y que
-- las dos existan es justo lo que significa aceptación mutua.
CREATE TABLE valor (
  id        TEXT PRIMARY KEY,
  de_id     TEXT NOT NULL REFERENCES cuenta(id) ON DELETE CASCADE,
  para_id   TEXT NOT NULL REFERENCES cuenta(id) ON DELETE CASCADE,
  intencion TEXT NOT NULL
            CHECK (intencion IN ('probar','colaborar','opinar','me-sirve','conocer')),
  motivo    TEXT NOT NULL
            CHECK (motivo IN ('necesita:haciaEllos','necesita:haciaTi','mismoPublico',
                              'complementa','puedeProbarte','mismaEtapa')),
  mensaje   TEXT NOT NULL,
  at        INTEGER NOT NULL,
  estado    TEXT NOT NULL DEFAULT 'enviado'
            CHECK (estado IN ('enviado','aceptado','declinado')),
  -- La vitrina del emisor CONGELADA en el momento de acercarse, como JSON.
  -- Sin esto, quien manda un "veo valor" puede reescribir su vitrina despues
  -- y usarla como un canal de texto libre dirigido hacia alguien que todavia
  -- no ha aceptado nada: exactamente lo que la regla 4 cierra por delante.
  foto      TEXT NOT NULL DEFAULT '',
  UNIQUE (de_id, para_id)
);
CREATE INDEX idx_valor_para ON valor(para_id, estado, at DESC);
CREATE INDEX idx_valor_de   ON valor(de_id, at DESC);

-- -------------------------------------------------------- conversacion --
-- a_id y b_id se guardan ORDENADOS (el menor primero) para que el UNIQUE
-- impida de verdad que existan dos conversaciones entre las mismas dos
-- personas. Sin ordenar, (A,B) y (B,A) son dos filas distintas y el índice
-- no protege nada.
CREATE TABLE conversacion (
  id      TEXT PRIMARY KEY,
  a_id    TEXT NOT NULL REFERENCES cuenta(id) ON DELETE CASCADE,
  b_id    TEXT NOT NULL REFERENCES cuenta(id) ON DELETE CASCADE,
  abierta INTEGER NOT NULL,
  motivo  TEXT NOT NULL DEFAULT '',
  UNIQUE (a_id, b_id),
  CHECK (a_id < b_id)
);
CREATE INDEX idx_conv_a ON conversacion(a_id, abierta DESC);
CREATE INDEX idx_conv_b ON conversacion(b_id, abierta DESC);

-- ------------------------------------------------------------- mensaje --
CREATE TABLE mensaje (
  id      TEXT PRIMARY KEY,
  conv_id TEXT NOT NULL REFERENCES conversacion(id) ON DELETE CASCADE,
  de_id   TEXT NOT NULL,
  texto   TEXT NOT NULL,
  at      INTEGER NOT NULL
);
CREATE INDEX idx_mensaje_conv ON mensaje(conv_id, at);

-- ------------------------------------------------------------ denuncia --
CREATE TABLE denuncia (
  id       TEXT PRIMARY KEY,
  de_id    TEXT NOT NULL,
  sobre_id TEXT NOT NULL,
  motivo   TEXT NOT NULL
           CHECK (motivo IN ('suplantacion','ofensivo','spam','estafa','otro')),
  nota     TEXT NOT NULL DEFAULT '',
  at       INTEGER NOT NULL,
  estado   TEXT NOT NULL DEFAULT 'abierta'
           CHECK (estado IN ('abierta','revisada','descartada')),
  -- Una denuncia por par. Sin esto, mil denuncias contra la misma persona
  -- envenenan la unica cola de moderacion que hay.
  UNIQUE (de_id, sobre_id)
);
CREATE INDEX idx_denuncia_abiertas ON denuncia(estado, at DESC);

-- ------------------------------------------------------------- bloqueo --
-- El bloqueo se aplica en el servidor. Uno que solo viva en el teléfono no
-- es un bloqueo: el otro sigue viendo tu puesto y sigue pudiendo escribirte.
CREATE TABLE bloqueo (
  de_id    TEXT NOT NULL,
  sobre_id TEXT NOT NULL,
  at       INTEGER NOT NULL,
  PRIMARY KEY (de_id, sobre_id)
);
CREATE INDEX idx_bloqueo_sobre ON bloqueo(sobre_id);

-- -------------------------------------------------------------- enlace --
-- Los enlaces de entrada. Se guarda la huella del token, nunca el token:
-- quien lea esta tabla no puede entrar en la cuenta de nadie.
CREATE TABLE enlace (
  token_hash  TEXT PRIMARY KEY,
  correo_hash TEXT NOT NULL,
  caduca      INTEGER NOT NULL,
  usado       INTEGER
);
CREATE INDEX idx_enlace_caduca ON enlace(caduca);

-- ------------------------------------------------------------- sesion --
CREATE TABLE sesion (
  token_hash TEXT PRIMARY KEY,
  cuenta_id  TEXT NOT NULL REFERENCES cuenta(id) ON DELETE CASCADE,
  creada     INTEGER NOT NULL,
  caduca     INTEGER NOT NULL
);
CREATE INDEX idx_sesion_cuenta ON sesion(cuenta_id);

-- ------------------------------------------------------------- pedido --
-- Cuántos enlaces de entrada se han pedido por huella de correo. Es lo que
-- impide usar el servidor para bombardear el buzón de alguien: el límite por
-- IP no sirve para eso, porque quien lo intente cambia de IP.
CREATE TABLE pedido (
  correo_hash TEXT PRIMARY KEY,
  cuantos     INTEGER NOT NULL DEFAULT 0,
  ventana     INTEGER NOT NULL
);
