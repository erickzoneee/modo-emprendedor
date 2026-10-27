/* ==========================================================================
   FIRMA MANUAL PARA SUBIR A LA APP STORE

   Lo corre .github/workflows/ios.yml justo antes de archivar, en la Mac de
   GitHub. No se usa a mano y su cambio no se guarda en el repositorio: en el
   proyecto de Xcode de main la firma sigue en Automatic, que es lo cómodo si
   algún día alguien lo abre en una Mac.

   POR QUÉ NO EN LA LÍNEA DE ÓRDENES

   Lo natural sería pasar CODE_SIGN_STYLE=Manual y PROVISIONING_PROFILE_
   SPECIFIER=… a xcodebuild. Pero lo que va en la línea de órdenes se aplica a
   TODOS los objetivos, también a los paquetes de Swift de Capacitor y sus
   plugins, y esos fallan con «does not support provisioning profiles». Así
   que se escribe en el proyecto, en el Release del objetivo App, y en ningún
   otro sitio.

   Uso:
     node tools/ios-firma.js <ID de equipo> "<nombre del perfil>"
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const [equipo, perfil] = process.argv.slice(2);
if (!/^[A-Z0-9]{10}$/.test(equipo || '') || !perfil) {
  console.error('uso: node tools/ios-firma.js <ID de equipo de 10 caracteres> "<nombre del perfil>"');
  process.exit(1);
}

const p = path.join(__dirname, '../ios/App/App.xcodeproj/project.pbxproj');
let s = fs.readFileSync(p, 'utf8');

/* El Release del objetivo App es el XCBuildConfiguration que lleva
   PRODUCT_BUNDLE_IDENTIFIER: el del proyecto no lo tiene. */
const re = /(\/\* Release \*\/ = \{\s*isa = XCBuildConfiguration;\s*buildSettings = \{)([\s\S]*?)(\};\s*name = Release;)/g;
let tocados = 0;
s = s.replace(re, (todo, ini, ajustes, fin) => {
  if (ajustes.indexOf('PRODUCT_BUNDLE_IDENTIFIER') < 0) return todo;
  tocados++;
  const limpio = ajustes
    .replace(/\n\s*CODE_SIGN_STYLE = [^;]*;/, '')
    .replace(/\n\s*CODE_SIGN_IDENTITY = [^;]*;/, '')
    .replace(/\n\s*DEVELOPMENT_TEAM = [^;]*;/, '')
    .replace(/\n\s*PROVISIONING_PROFILE_SPECIFIER = [^;]*;/, '');
  const comillas = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  return ini +
    '\n\t\t\t\tCODE_SIGN_STYLE = Manual;' +
    '\n\t\t\t\tCODE_SIGN_IDENTITY = "Apple Distribution";' +
    '\n\t\t\t\tDEVELOPMENT_TEAM = ' + equipo + ';' +
    '\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = ' + comillas(perfil) + ';' +
    limpio + fin;
});

if (tocados !== 1) {
  console.error('✗ esperaba un solo Release con PRODUCT_BUNDLE_IDENTIFIER y encontré ' + tocados);
  process.exit(1);
}
fs.writeFileSync(p, s);
console.log('✓ firma manual en el Release de App: equipo ' + equipo + ', perfil «' + perfil + '»');
