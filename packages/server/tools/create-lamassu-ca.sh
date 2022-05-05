#!/usr/bin/env bash
# This is for setting up cryptographic certificates for a development environment
set -e

LOG_FILE=/tmp/cert-gen.log
CERT_DIR=$PWD/certs
KEY_DIR=$PWD/certs

mkdir -p $CERT_DIR

echo "Generating Lamassu SSL certificates..."

CA_KEY_PATH=$KEY_DIR/Lamassu_CA.key
CA_PATH=$CERT_DIR/Lamassu_CA.pem
SERVER_KEY_PATH=$KEY_DIR/Lamassu.key
SERVER_CERT_PATH=$CERT_DIR/Lamassu.pem

openssl genrsa \
  -out $CA_KEY_PATH \
  4096 >> $LOG_FILE 2>&1

openssl req \
  -x509 \
  -sha256 \
  -new \
  -nodes \
  -key $CA_KEY_PATH \
  -days 3560 \
  -out $CA_PATH \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu CA/CN=lamassu.is" \
  >> $LOG_FILE 2>&1

openssl genrsa \
  -out $SERVER_KEY_PATH \
  4096 >> $LOG_FILE 2>&1

openssl req -new \
  -key $SERVER_KEY_PATH \
  -out /tmp/Lamassu.csr.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu support client/CN=support@lamassu.is" \
  -sha256 \
  >> $LOG_FILE 2>&1

openssl x509 \
  -req -in /tmp/Lamassu.csr.pem \
  -CA $CA_PATH \
  -CAkey $CA_KEY_PATH \
  -CAcreateserial \
  -out $SERVER_CERT_PATH \
  -days 3650 >> $LOG_FILE 2>&1

rm /tmp/Lamassu.csr.pem

echo "Done."
