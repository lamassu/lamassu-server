with import <nixpkgs> {};

stdenv.mkDerivation {
    name = "node";
        buildInputs = [
        nodejs-8_x
        python2Full
        openssl_1_0_2
        postgresql_9_6
    ];
    shellHook = ''
        export PATH="$HOME/.local:$PWD/node_modules/.bin/:$PATH"
    '';
}
