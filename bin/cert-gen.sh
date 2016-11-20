#!/usr/bin/env bash
# This is for setting up cryptographic certificates for a development environment
set -e

DOMAIN=localhost

LOG_FILE=/tmp/cert-gen.log
CERT_DIR=$PWD/certs
KEY_DIR=$PWD/certs

CONFIG_DIR=$HOME/.lamassu

mkdir -p $CERT_DIR
mkdir -p $CONFIG_DIR >> $LOG_FILE 2>&1

echo "Generating seed..."
SEEDS_DIR=seeds
SEED_FILE=$SEEDS_DIR/seed.txt
mkdir -p $SEEDS_DIR >> $LOG_FILE 2>&1
SEED=$(openssl rand -hex 32)
echo $SEED > $SEED_FILE

echo "Generating SSL certificates (takes a few seconds)..."

CA_KEY_PATH=$KEY_DIR/Lamassu_OP_Root_CA.key
CA_PATH=$CERT_DIR/Lamassu_OP_Root_CA.pem
SERVER_KEY_PATH=$KEY_DIR/Lamassu_OP.key
SERVER_CERT_PATH=$CERT_DIR/Lamassu_OP.pem

openssl genrsa \
  -out $CA_KEY_PATH \
  4096 >> $LOG_FILE 2>&1

openssl req \
  -x509 \
  -new \
  -nodes \
  -key $CA_KEY_PATH \
  -days 3560 \
  -out $CA_PATH \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator CA/CN=lamassu-operator.is" \
  >> $LOG_FILE 2>&1

openssl genrsa \
  -out $SERVER_KEY_PATH \
  4096 >> $LOG_FILE 2>&1

openssl req -new \
  -key $SERVER_KEY_PATH \
  -out /tmp/Lamassu_OP.csr.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator/CN=$DOMAIN" \
  >> $LOG_FILE 2>&1

openssl x509 \
  -req -in /tmp/Lamassu_OP.csr.pem \
  -CA $CA_PATH \
  -CAkey $CA_KEY_PATH \
  -CAcreateserial \
  -out $SERVER_CERT_PATH \
  -days 3650 >> $LOG_FILE 2>&1

rm /tmp/Lamassu_OP.csr.pem

cat <<EOF > $CONFIG_DIR/lamassu.json
{
  "postgresql": "psql://lamassu:lamassu@localhost/lamassu",
  "seedPath": "$SEED_FILE",
  "caPath": "$CA_PATH",
  "certPath": "$SERVER_CERT_PATH",
  "keyPath": "$SERVER_KEY_PATH",
  "hostname": "$DOMAIN",
  "logLevel": "debug"
}
EOF

echo "Done."
