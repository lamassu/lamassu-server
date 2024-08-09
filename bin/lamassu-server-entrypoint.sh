#!/usr/bin/env bash

FILE_2=/etc/ssl/certs/Lamassu_OP.pem
FILE_3=/etc/ssl/certs/Lamassu_OP_Root_CA.pem
FILE_4=/etc/ssl/certs/Lamassu_OP_Root_CA.srl
FILE_5=/etc/ssl/private/Lamassu_OP.key
FILE_6=/etc/ssl/private/Lamassu_OP_Root_CA.key

echo "Checking for the existence of certificates..."
if [[ ! -f "$FILE_2" || ! -f "$FILE_3" || ! -f "$FILE_4" || ! -f "$FILE_5" || ! -f "$FILE_6" ]]; then
  echo "No Lamassu certificates found. Building them..."
  bash /lamassu-server/tools/build-docker-certs.sh
fi

echo "Executing migrations..."
node /lamassu-server/bin/lamassu-migrate

echo "Starting server..."
node /lamassu-server/bin/lamassu-server
