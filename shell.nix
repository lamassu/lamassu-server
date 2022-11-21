with import (fetchTarball {
  name = "nixpkgs-21.11";
  url = https://github.com/NixOS/nixpkgs/archive/a7ecde854aee5c4c7cd6177f54a99d2c1ff28a31.tar.gz;
  sha256 = "162dywda2dvfj1248afxc45kcrg83appjd0nmdb541hl7rnncf02";
}) {};

stdenv.mkDerivation {
    name = "node";
        buildInputs = [
        nodejs-14_x
        python2Full
        openssl
        postgresql_14
    ];
    shellHook = ''
        export PATH="$PWD/node_modules/.bin/:$PATH"
    '';
}
