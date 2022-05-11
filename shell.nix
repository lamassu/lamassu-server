with import (fetchTarball {
  name = "nixpkgs-21.9-unstable";
  url = https://github.com/NixOS/nixpkgs/archive/45fc7d4a35c5343e58541a7847f6415654ccbb37.tar.gz;
  sha256 = "1z2afrpdpyk9p120xc9vx79xz61lviz2csalzvikypq85drs1hgd";
}) {};

stdenv.mkDerivation {
  name = "node";
  buildInputs = [
    nodePackages.pnpm
    nodejs-14_x
    python2Full
    openssl
    postgresql_9_6
  ];
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}
