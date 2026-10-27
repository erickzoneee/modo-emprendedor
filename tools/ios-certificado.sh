#!/usr/bin/env bash
# ==========================================================================
# EL CERTIFICADO DE APPLE, SIN MAC
#
# Para firmar la app hace falta un certificado de distribución de Apple. En
# una Mac lo hace Xcode solo; aquí se hace en tres pasos con OpenSSL, que ya
# viene con Git para Windows. Todo lo secreto se queda en ~/emprendo-firma,
# FUERA del repositorio, y de ahí solo sale hacia los secretos de GitHub.
#
#   bash tools/ios-certificado.sh solicitud
#       Crea la llave privada y la solicitud (CSR) que se sube a Apple.
#
#   bash tools/ios-certificado.sh p12 <ruta al .cer que te dio Apple>
#       Junta el certificado con su llave en un .p12, con una contraseña al
#       azar que se guarda al lado.
#
#   bash tools/ios-certificado.sh secretos <perfil.mobileprovision> <AuthKey_XXXX.p8> <Issuer ID>
#       Sube a GitHub los seis secretos que usa la compilación en la nube.
#
# Ver docs/app-store.md para saber en qué momento va cada uno.
# ==========================================================================
set -euo pipefail

DIR="${EMPRENDO_FIRMA:-$HOME/emprendo-firma}"
REPO="erickzoneee/modo-emprendedor"
mkdir -p "$DIR"
chmod 700 "$DIR" 2>/dev/null || true

case "${1:-}" in

  solicitud)
    if [ -f "$DIR/distribucion.key" ]; then
      echo "Ya hay una llave en $DIR/distribucion.key. No la piso: si la borras,"
      echo "el certificado que Apple ya te dio para ella deja de servir."
    else
      openssl genrsa -out "$DIR/distribucion.key" 2048 2>/dev/null
    fi
    # El correo sale de git y no se escribe aquí: este repositorio es público.
    CORREO="${EMPRENDO_CORREO:-$(git config user.email || true)}"
    # Los datos van en un archivo y no con -subj "/emailAddress=…": Git Bash
    # toma esa barra por una ruta de Windows, y el «+» del correo de GitHub
    # es un separador en ese formato. En el archivo no pasa ninguna de las dos.
    cat > "$DIR/solicitud.cnf" <<CNF
[req]
prompt = no
distinguished_name = dn
[dn]
emailAddress = ${CORREO:-sin-correo@example.com}
CN = Emprendo Distribucion
C = MX
CNF
    openssl req -new -key "$DIR/distribucion.key" -out "$DIR/distribucion.csr" -config "$DIR/solicitud.cnf"
    echo
    echo "✓ Listo. Sube este archivo a Apple:"
    echo "    $DIR/distribucion.csr"
    echo "  developer.apple.com › Certificates › + › Apple Distribution"
    ;;

  p12)
    CER="${2:?Falta la ruta al .cer que descargaste de Apple}"
    [ -f "$DIR/distribucion.key" ] || { echo "No encuentro la llave. Corre primero: solicitud"; exit 1; }
    openssl x509 -inform DER -in "$CER" -out "$DIR/distribucion.pem" 2>/dev/null \
      || openssl x509 -in "$CER" -out "$DIR/distribucion.pem"
    # La llave y el certificado tienen que ser pareja; si no, el .p12 sale
    # bien y la firma falla en la nube con un error que no dice por qué.
    A=$(openssl x509 -noout -modulus -in "$DIR/distribucion.pem" | openssl sha256)
    B=$(openssl rsa -noout -modulus -in "$DIR/distribucion.key" 2>/dev/null | openssl sha256)
    [ "$A" = "$B" ] || { echo "✗ Ese certificado no es de esta llave. ¿Subiste el .csr de $DIR?"; exit 1; }
    openssl rand -hex 16 > "$DIR/p12.clave"
    # La contraseña entra por stdin y no con file:ruta, porque Git Bash no
    # convierte las rutas que van pegadas a un prefijo.
    # -legacy: el llavero de macOS no lee el cifrado que OpenSSL 3 usa por defecto.
    openssl pkcs12 -export -legacy \
      -inkey "$DIR/distribucion.key" -in "$DIR/distribucion.pem" \
      -name "Apple Distribution" -out "$DIR/distribucion.p12" \
      -passout stdin < "$DIR/p12.clave"
    echo "✓ $DIR/distribucion.p12 listo."
    ;;

  secretos)
    PERFIL="${2:?Falta la ruta al .mobileprovision}"
    P8="${3:?Falta la ruta al AuthKey_XXXX.p8}"
    ISSUER="${4:?Falta el Issuer ID (lo ves arriba de la lista de llaves en App Store Connect)}"
    [ -f "$DIR/distribucion.p12" ] || { echo "No encuentro el .p12. Corre primero: p12"; exit 1; }
    KEY_ID=$(basename "$P8" | sed -n 's/^AuthKey_\([A-Z0-9]*\)\.p8$/\1/p')
    [ -n "$KEY_ID" ] || { echo "El archivo de la llave se tiene que llamar AuthKey_XXXXXXXXXX.p8, como lo baja Apple"; exit 1; }

    base64 -w0 "$DIR/distribucion.p12" | gh secret set IOS_P12 -R "$REPO"
    gh secret set IOS_P12_CLAVE -R "$REPO" < "$DIR/p12.clave"
    base64 -w0 "$PERFIL" | gh secret set IOS_PERFIL -R "$REPO"
    gh secret set ASC_KEY -R "$REPO" < "$P8"
    printf '%s' "$KEY_ID" | gh secret set ASC_KEY_ID -R "$REPO"
    printf '%s' "$ISSUER" | gh secret set ASC_ISSUER_ID -R "$REPO"

    # Copia de lo que vino de Apple, junto al resto, por si hay que repetir.
    cp "$PERFIL" "$P8" "$DIR/" 2>/dev/null || true
    echo
    echo "✓ Los seis secretos están en GitHub. Ya se puede lanzar «App de iPhone»"
    echo "  con «Subir a TestFlight» desde Actions, también desde el iPhone."
    ;;

  *)
    sed -n '2,24p' "$0"
    exit 1
    ;;
esac
