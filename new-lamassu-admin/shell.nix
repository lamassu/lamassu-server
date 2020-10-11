with import (fetchTarball {
  name = "nixpkgs-20.09";
  url = https://github.com/NixOS/nixpkgs/archive/0b8799ecaaf0dc6b4c11583a3c96ca5b40fcfdfb.tar.gz;
  sha256 = "11m4aig6cv0zi3gbq2xn9by29cfvnsxgzf9qsvz67qr0yq29ryyz";
}) {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
        nodejs-14_x
    ];
    shellHook = ''
        export PATH="$PWD/node_modules/.bin/:$PATH"
    '';
}
