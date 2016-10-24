# make directories to work from
mkdir -p certs

# Create your very own Root Certificate Authority
openssl genrsa \
  -out certs/root-ca.key.pem \
  4096

# Self-sign your Root Certificate Authority
# Since this is private, the details can be as bogus as you like
openssl req \
  -x509 \
  -new \
  -nodes \
  -key certs/root-ca.key.pem \
  -days 3560 \
  -out certs/root-ca.crt.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator CA/CN=lamassu-operator.is"

# Create a Device Certificate for each domain,
# such as example.com, *.example.com, awesome.example.com
# NOTE: You MUST match CN to the domain name or ip address you want to use
openssl genrsa \
  -out certs/server.key.pem \
  4096

# Create a request from your Device, which your Root CA will sign
openssl req -new \
  -key certs/server.key.pem \
  -out certs/server.csr.pem \
  -subj "/C=IS/ST=/L=Reykjavik/O=Lamassu Operator/CN=localhost"

# Sign the request from Device with your Root CA
openssl x509 \
  -req -in certs/server.csr.pem \
  -CA certs/root-ca.crt.pem \
  -CAkey certs/root-ca.key.pem \
  -CAcreateserial \
  -out certs/server.crt.pem \
  -days 3650
