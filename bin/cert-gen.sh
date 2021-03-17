#!/usr/bin/env bash
# This is for setting up cryptographic certificates for a development environment
set -e

DOMAIN=localhost
[ ! -z "$1" ] && DOMAIN=$1

CONFIG_DIR=$HOME/.lamassu
LOG_FILE=/tmp/cert-gen.log
CERT_DIR=$PWD/certs
KEY_DIR=$PWD/certs
LAMASSU_CA_PATH=$PWD/Lamassu_CA.pem
MIGRATE_STATE_PATH=$CONFIG_DIR/.migrate
POSTGRES_PASS=postgres123
OFAC_DATA_DIR=$CONFIG_DIR/ofac
IDPHOTOCARD_DIR=$CONFIG_DIR/idphotocard
FRONTCAMERA_DIR=$CONFIG_DIR/frontcamera
IDCARDDATA_DIR=$CONFIG_DIR/idcarddata

mkdir -p $CERT_DIR
mkdir -p $CONFIG_DIR >> $LOG_FILE 2>&1

echo "Generating mnemonic..."
MNEMONIC_DIR=$CONFIG_DIR/mnemonics
MNEMONIC_FILE=$MNEMONIC_DIR/mnemonic.txt
mkdir -p $MNEMONIC_DIR >> $LOG_FILE 2>&1
SEED=$(openssl rand -hex 32)
MNEMONIC=$($PWD/bin/bip39 $SEED)
echo "$MNEMONIC" > $MNEMONIC_FILE

echo "Generating SSL certificates..."

CA_KEY_PATH=$KEY_DIR/Lamassu_OP_Root_CA.key
CA_PATH=$CERT_DIR/Lamassu_OP_Root_CA.pem
SERVER_KEY_PATH=$KEY_DIR/Lamassu_OP.key
SERVER_CERT_PATH=$CERT_DIR/Lamassu_OP.pem
red=`tput setaf 1`
reset=`tput sgr0`
OPENSSL_ERROR_HINT="Make sure that you have installed openssl 1.0 version"

print_error () {
  echo "${red}Error: ${reset} $1"
  echo $2 # hint
}

{
  openssl genrsa \
    -out $CA_KEY_PATH \
    4096 >> $LOG_FILE 2>&1
} || { print_error "openssl genrsa to CA_KEY_PATH failed" "$OPENSSL_ERROR_HINT"; exit 1; }

{
  openssl req \
    -x509 \
    -sha256 \
    -new \
    -nodes \
    -key $CA_KEY_PATH \
    -days 3560 \
    -out $CA_PATH \
    -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator CA/CN=lamassu-operator.is" \
    >> $LOG_FILE 2>&1
} || { print_error "openssl req with CA_KEY_PATH failed" "$OPENSSL_ERROR_HINT"; exit 1; }

{
  openssl genrsa \
    -out $SERVER_KEY_PATH \
    4096 >> $LOG_FILE 2>&1
} || { print_error "openssl genrsa SERVER_KEY_PATH failed" "$OPENSSL_ERROR_HINT"; exit 1; }

{
  openssl req -new \
    -key $SERVER_KEY_PATH \
    -out /tmp/Lamassu_OP.csr.pem \
    -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator/CN=$DOMAIN" \
    >> $LOG_FILE 2>&1
} || { print_error "openssl req with SERVER_KEY_PATH failed" "$OPENSSL_ERROR_HINT"; exit 1; }

{
  openssl x509 \
    -req -in /tmp/Lamassu_OP.csr.pem \
    -CA $CA_PATH \
    -CAkey $CA_KEY_PATH \
    -CAcreateserial \
    -out $SERVER_CERT_PATH \
    -days 3650 >> $LOG_FILE 2>&1
} || { print_error "openssl x509 failed" "$OPENSSL_ERROR_HINT"; exit 1; }

rm /tmp/Lamassu_OP.csr.pem

mkdir -p $OFAC_DATA_DIR/sources
touch $OFAC_DATA_DIR/etags.json

cat <<EOF > $CONFIG_DIR/lamassu.json
{
  "postgresql": "psql://postgres:$POSTGRES_PASS@localhost/lamassu",
  "mnemonicPath": "$MNEMONIC_FILE",
  "caPath": "$CA_PATH",
  "certPath": "$SERVER_CERT_PATH",
  "keyPath": "$SERVER_KEY_PATH",
  "hostname": "$DOMAIN",
  "logLevel": "debug",
  "lamassuCaPath": "$LAMASSU_CA_PATH",
  "migrateStatePath": "$MIGRATE_STATE_PATH",
  "ofacDataDir": "$OFAC_DATA_DIR",
  "ofacSources": [
    {
      "name": "sdn_advanced",
      "url": "https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml"
    },
    {
      "name": "cons_advanced",
      "url": "https://www.treasury.gov/ofac/downloads/sanctions/1.0/cons_advanced.xml"
    }
  ],
  "idPhotoCardDir": "$IDPHOTOCARD_DIR",
  "frontCameraDir": "$FRONTCAMERA_DIR",
  "idCardDataDir": "$IDCARDDATA_DIR"
}
EOF

echo "Done."
