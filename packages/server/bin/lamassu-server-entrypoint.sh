#!/usr/bin/env bash

FILE_1=/etc/ssl/certs/Lamassu_CA.pem
FILE_2=/etc/ssl/certs/Lamassu_OP.pem
FILE_3=/etc/ssl/certs/Lamassu_OP_Root_CA.pem
FILE_4=/etc/ssl/certs/Lamassu_OP_Root_CA.srl
FILE_5=/etc/ssl/private/Lamassu_OP.key
FILE_6=/etc/ssl/private/Lamassu_OP_Root_CA.key

echo "Checking for the existence of certificates..."
if [[ ! -f "$FILE_1" || ! -f "$FILE_2" || ! -f "$FILE_3" || ! -f "$FILE_4" || ! -f "$FILE_5" || ! -f "$FILE_6" ]]; then
  echo "No Lamassu certificates found. Building them..."
  bash /app/packages/lamassu-server/tools/build-docker-certs.sh
fi

echo "Executing migrations..."
node /app/packages/lamassu-server/bin/lamassu-migrate

USER_COUNT=$(node /app/packages/lamassu-server/tools/check-user-count.js)

if [[ $USER_COUNT == '0' ]]; then
  echo "No initial user found. Creating master@lamassu.is..."
  node /app/packages/lamassu-server/bin/lamassu-register master@lamassu.is superuser
fi

echo "Starting server..."
node /app/packages/lamassu-server/bin/lamassu-server
