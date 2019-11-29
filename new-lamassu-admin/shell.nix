with import <nixpkgs> {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
	nodejs-10_x
    ];
    shellHook = ''
        export PATH="$PWD/node_modules/.bin/:$PATH"
    '';
}
