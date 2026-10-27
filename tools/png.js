/* ==========================================================================
   PNG, sin dependencias

   Lo justo para lo que necesitan las imágenes de la app de iPhone: leer un
   PNG de 8 bits (RGB o RGBA, sin entrelazar), escribirlo de vuelta en RGB
   y pintar uno de un solo color. Apple rechaza un icono con canal alfa
   aunque sea opaco entero, y las capturas del navegador salen con él.
   ========================================================================== */
'use strict';

const zlib = require('zlib');

const FIRMA = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function leer(buf) {
  if (!buf.subarray(0, 8).equals(FIRMA)) throw new Error('no es un PNG');
  let o = 8, ancho = 0, alto = 0, tipo = 0, prof = 0, entrelazado = 0;
  const idat = [];
  while (o < buf.length) {
    const largo = buf.readUInt32BE(o);
    const nombre = buf.toString('latin1', o + 4, o + 8);
    const datos = buf.subarray(o + 8, o + 8 + largo);
    if (nombre === 'IHDR') {
      ancho = datos.readUInt32BE(0); alto = datos.readUInt32BE(4);
      prof = datos[8]; tipo = datos[9]; entrelazado = datos[12];
    } else if (nombre === 'IDAT') idat.push(datos);
    else if (nombre === 'IEND') break;
    o += 12 + largo;
  }
  if (prof !== 8 || (tipo !== 2 && tipo !== 6) || entrelazado) {
    throw new Error('solo PNG de 8 bits RGB/RGBA sin entrelazar (este: tipo ' + tipo + ', ' + prof + ' bits)');
  }
  const canales = tipo === 6 ? 4 : 3;
  const crudo = zlib.inflateSync(Buffer.concat(idat));
  const fila = ancho * canales;
  const px = Buffer.alloc(alto * fila);
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (fila + 1)];
    const ent = crudo.subarray(y * (fila + 1) + 1, (y + 1) * (fila + 1));
    for (let x = 0; x < fila; x++) {
      const a = x >= canales ? px[y * fila + x - canales] : 0;
      const b = y > 0 ? px[(y - 1) * fila + x] : 0;
      const c = (x >= canales && y > 0) ? px[(y - 1) * fila + x - canales] : 0;
      let v = ent[x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      px[y * fila + x] = v & 255;
    }
  }
  return { ancho, alto, canales, px };
}

function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 255;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function trozo(nombre, datos) {
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(nombre, 'latin1'), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

/** Escribe en RGB, sin alfa. Si la imagen lo traía, se mezcla sobre `fondo`. */
function escribirRGB(img, fondo) {
  const { ancho, alto, canales, px } = img;
  const f = fondo || [255, 255, 255];
  const crudo = Buffer.alloc(alto * (ancho * 3 + 1));
  for (let y = 0; y < alto; y++) {
    crudo[y * (ancho * 3 + 1)] = 0;
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * canales;
      const al = canales === 4 ? px[i + 3] / 255 : 1;
      for (let k = 0; k < 3; k++) {
        crudo[y * (ancho * 3 + 1) + 1 + x * 3 + k] = Math.round(px[i + k] * al + f[k] * (1 - al));
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([FIRMA, trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })), trozo('IEND', Buffer.alloc(0))]);
}

function liso(ancho, alto, rgb) {
  const px = Buffer.alloc(ancho * alto * 3);
  for (let i = 0; i < ancho * alto; i++) { px[i * 3] = rgb[0]; px[i * 3 + 1] = rgb[1]; px[i * 3 + 2] = rgb[2]; }
  return escribirRGB({ ancho, alto, canales: 3, px });
}

module.exports = { leer, escribirRGB, liso };
