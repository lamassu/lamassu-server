with import (fetchTarball {
  name = "nixpkgs-19.09";
  url = https://github.com/NixOS/nixpkgs-channels/archive/d5291756487d70bc336e33512a9baf9fa1788faf.tar.gz;
  sha256 = "0mhqhq21y5vrr1f30qd2bvydv4bbbslvyzclhw0kdxmkgg3z4c92";
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
