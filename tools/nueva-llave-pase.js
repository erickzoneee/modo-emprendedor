/* ==========================================================================
   LA LLAVE DEL PASE — genera las dos mitades

   El Worker de pago firma; la app verifica. Este script hace el par y lo
   imprime ya en la forma en la que cada mitad tiene que ir a su sitio:

     · La PRIVADA, a un secreto de Cloudflare. No se guarda en el repo.
     · La PÚBLICA, escrita a mano en js/core/impulso.js.

   ECDSA P-256, que es lo que entienden todos los navegadores que pueden
   ejecutar la app. Ed25519 sería más corto, pero no existe en Safari antiguo
   ni en Chrome anterior al 137.

   Correr:   node tools/nueva-llave-pase.js

   CUIDADO CON ROTARLA. Las dos mitades tienen que ir juntas: con una llave
   nueva en el Worker y la vieja escrita en la app, ningún pase verifica y
   todo el que pagó pierde Impulso a la vez, sin conexión y sin forma de
   arreglarlo desde su lado. Para rotar de verdad: primero se despliega la app
   aceptando las DOS públicas, se espera a que la gente la reciba, y solo
   después se cambia el secreto del Worker.
   ========================================================================== */
'use strict';

const { webcrypto } = require('crypto');

async function main() {
  const par = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const privada = await webcrypto.subtle.exportKey('jwk', par.privateKey);
  const publica = await webcrypto.subtle.exportKey('jwk', par.publicKey);

  /* Se limpian las claves que no hacen falta. `key_ops` y `ext` los vuelve a
     poner quien importa, y dejarlos dentro solo alarga un secreto que hay que
     pegar a mano en una terminal. */
  const soloLoSuyo = (jwk, ops) => ({
    kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y,
    ...(jwk.d ? { d: jwk.d } : {}),
    key_ops: ops, ext: true
  });

  const priv = soloLoSuyo(privada, ['sign']);
  const pub = soloLoSuyo(publica, ['verify']);

  console.log('');
  console.log('  1) LA MITAD PRIVADA — va al Worker, no al repo');
  console.log('');
  console.log('     cd worker-pago');
  console.log('     npx wrangler secret put PASE_JWK');
  console.log('');
  console.log('     y cuando lo pida, pega esta línea entera:');
  console.log('');
  console.log('     ' + JSON.stringify(priv));
  console.log('');
  console.log('  2) LA MITAD PÚBLICA — va escrita en js/core/impulso.js');
  console.log('');
  console.log('     var LLAVE = ' + JSON.stringify(pub) + ';');
  console.log('');
  console.log('  Las dos salen de aquí y tienen que ir juntas. Ver la cabecera');
  console.log('  de este archivo antes de rotarlas.');
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); });
