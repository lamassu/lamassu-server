DOMAIN=localhost

mkdir -p certs

openssl genrsa \
  -out certs/root-ca.key.pem \
  4096

openssl req \
  -x509 \
  -new \
  -nodes \
  -key certs/root-ca.key.pem \
  -days 3560 \
  -out certs/root-ca.crt.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator CA/CN=lamassu-operator.is"

openssl genrsa \
  -out certs/server.key.pem \
  4096

# Create a request from your Device, which your Root CA will sign
openssl req -new \
  -key certs/server.key.pem \
  -out certs/server.csr.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator/CN=$DOMAIN"

# Sign the request from Device with your Root CA
openssl x509 \
  -req -in certs/server.csr.pem \
  -CA certs/root-ca.crt.pem \
  -CAkey certs/root-ca.key.pem \
  -CAcreateserial \
  -out certs/server.crt.pem \
  -days 3650
