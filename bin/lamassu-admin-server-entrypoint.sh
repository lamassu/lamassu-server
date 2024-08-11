#!/usr/bin/env bash
set -e

CERT_FILES=(
  /lamassu-data/certs/{Lamassu_CA,Lamassu_OP,Lamassu_OP_Root_CA}.pem
  /lamassu-data/certs/Lamassu_OP_Root_CA.srl
  /lamassu-data/private/{Lamassu_OP,Lamassu_OP_Root_CA}.key
)

if ! (( ${#CERT_FILES[@]} == $(ls "${CERT_FILES[@]}" 2>/dev/null | wc -l) )); then
    echo "Some certificates are missing. Retrying in 5 seconds"
    sleep 5
    exit 1
fi

echo "Update certs on alpine"
cp /lamassu-data/certs/Lamassu_CA.pem /usr/local/share/ca-certificates
cp /lamassu-data/certs/Lamassu_OP_Root_CA.pem /usr/local/share/ca-certificates
update-ca-certificates

if [ "${LAMASSU_DEV_MODE}" = "true" ]; then
    echo "Starting in dev mode"
    node /lamassu-server/bin/lamassu-admin-server --lamassuDev
else
    node /lamassu-server/bin/lamassu-admin-server
fi
