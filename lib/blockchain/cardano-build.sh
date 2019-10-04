#!/bin/sh

if [ -z "$USER" ]; then
    USER=`whoami`
fi

tmpdir=$(mktemp -d -t nix-XXXXXXXXXX)
cd $tmpdir
wget -q https://nixos.org/nix/install
chmod +x install
OUTPUT=$(./install --no-daemon)

. $HOME/.nix-profile/etc/profile.d/nix.sh

cd $1

#nix-build release.nix -A nix-tools.exes.cardano-wallet.x86_64-linux -o build
nix-build -A connectScripts.testnet.wallet -o cardano-testnet-wallet
