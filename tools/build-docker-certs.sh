#!/usr/bin/env bash
set -e

export LOG_FILE=/tmp/install.log

CONFIG_DIR=/lamassu-data

# certs
CERT_DIR=$CONFIG_DIR/certs
KEY_DIR=$CONFIG_DIR/private
LAMASSU_CA_PATH=$CERT_DIR/Lamassu_CA.pem
CA_KEY_PATH=$KEY_DIR/Lamassu_OP_Root_CA.key
CA_PATH=$CERT_DIR/Lamassu_OP_Root_CA.pem
SERVER_KEY_PATH=$KEY_DIR/Lamassu_OP.key
SERVER_CERT_PATH=$CERT_DIR/Lamassu_OP.pem

# other
MNEMONIC_DIR=$CONFIG_DIR/mnemonics
MNEMONIC_FILE=$MNEMONIC_DIR/mnemonic.txt
OFAC_DATA_DIR=$CONFIG_DIR/ofac

decho () {
  echo `date +"%H:%M:%S"` $1
}

IP=$HOSTNAME
NODE_MODULES=$(npm -g root)
NPM_BIN=$(npm -g bin)

decho "Generating mnemonic..."
mkdir -p $MNEMONIC_DIR
SEED=$(openssl rand -hex 32)
MNEMONIC=$(/lamassu-server/bin/bip39 $SEED)
echo "$MNEMONIC" > $MNEMONIC_FILE

mkdir -p $CERT_DIR
mkdir -p $KEY_DIR

decho "Generating SSL certificates..."

sed -i '/RANDFILE/d' /etc/ssl/openssl.cnf

openssl genrsa \
  -out $CA_KEY_PATH \
  4096

openssl req \
  -x509 \
  -sha256 \
  -new \
  -nodes \
  -key $CA_KEY_PATH \
  -days 3650 \
  -out $CA_PATH \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator CA/CN=operator.lamassu.is"

openssl genrsa \
  -out $SERVER_KEY_PATH \
  4096

openssl req -new \
  -key $SERVER_KEY_PATH \
  -out /tmp/Lamassu_OP.csr.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator/CN=$IP" \
  -reqexts SAN \
  -sha256 \
  -config <(cat /etc/ssl/openssl.cnf \
      <(printf "[SAN]\nsubjectAltName=IP.1:$IP"))

openssl x509 \
  -req -in /tmp/Lamassu_OP.csr.pem \
  -CA $CA_PATH \
  -CAkey $CA_KEY_PATH \
  -CAcreateserial \
  -out $SERVER_CERT_PATH \
  -extfile <(cat /etc/ssl/openssl.cnf \
      <(printf "[SAN]\nsubjectAltName=IP.1:$IP")) \
  -extensions SAN \
  -days 3650

rm /tmp/Lamassu_OP.csr.pem

mkdir -p $OFAC_DATA_DIR

decho "Copying Lamassu certificate authority..."
LAMASSU_CA_FILE=/lamassu-server/Lamassu_CA.pem
cp $LAMASSU_CA_FILE $LAMASSU_CA_PATH
