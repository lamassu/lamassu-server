with import (fetchTarball {
  url = https://github.com/NixOS/nixpkgs-channels/archive/nixos-19.03.tar.gz;
  sha256 = "1niknqpb6yrlcvv28cylklf7kgkjslx87jqjcnbsnr89bsq618gn";
}) {};

stdenv.mkDerivation {
    name = "node";
        buildInputs = [
        nodejs-8_x
        python2Full
        openssl_1_0_2
        postgresql_9_6
    ];
    shellHook = ''
        export PATH="$PWD/node_modules/.bin/:$PATH"
    '';
}
