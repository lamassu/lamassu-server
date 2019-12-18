with import (fetchTarball {
  url = https://github.com/NixOS/nixpkgs-channels/archive/nixos-19.09.tar.gz;
  sha256 = "1msjm4kx1z73v444i1iybvmc7z0kfkbn9nzr21rn5yc4ql1jwf99";
}) {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
        nodejs-12_x
    ];
    shellHook = ''
        export PATH="$PWD/node_modules/.bin/:$PATH"
    '';
}
