#!/bin/bash

if [ -z "$1" ]; then
    echo "Please call '$0 <buildDirectory>' to run Cardano SL node build!"
    exit 1
fi

if [ ! -d "$1" ]; then
    echo "Provided directory '$1' doesn't exists!"
    exit 1
fi

if [ ! -f "$1/release.nix" ]; then
    echo "Provided directory '$1' doesn't containes Cadano SL source code!"
    exit 1
fi

# $USER variable is needed for running nix.sh
if [ -z "$USER" ]; then
    USER=`whoami`
fi

remove_nix () {
    echo "Remove Nix installation"
    sudo rm -rf /nix
    rm -rf $HOME/.nix-profile
}

if [ ! -f $HOME/.nix-profile/etc/profile.d/nix.sh ] || [ ! -d /nix ]; then
    # https://github.com/TerrorJack/pixie/blob/master/.circleci/debian-bootstrap.sh
    groupadd -g 30000 --system nixbld

    for i in $(seq 1 32); do
    useradd \
        --home-dir /var/empty \
        --gid 30000 \
        --groups nixbld \
        --no-user-group \
        --system \
        --shell /usr/sbin/nologin \
        --uid $((30000 + i)) \
        --password "!" \
        nixbld$i
    done

    NIX_TMPDIR=$(mktemp -d -t nix-XXXXXXXXXX)
    if [ ! -d "$NIX_TMPDIR" ]; then
        echo "Some error occures when creating temp directory for Nix installation download"
        exit 1
    fi
    
    cd $NIX_TMPDIR
    echo "Downloading Nix source codes..."
    wget -q https://nixos.org/nix/install >install-log.txt 2>&1
    if [ ! -f "install" ]; then
        echo "Some error occures when downloading Nix source codes"
        cat install-log.txt
        exit 1
    fi
    
    chmod +x install
    echo "Installing Nix"
    ./install --no-daemon >install-log.txt 2>&1

    if [ $? -ne 0 ]; then
        echo "Some error occures when v Nix"
        cat install-log.txt
        remove_nix
        exit 1
    fi
fi

# prepare and load nix to $PATH
. $HOME/.nix-profile/etc/profile.d/nix.sh

cd $1

echo "Building Cardano SL"
nix-build -A connectScripts.mainnet.wallet -o cardano-node >build-log.txt 2>&1
#nix-build release.nix -A nix-tools.exes.cardano-wallet.x86_64-linux -o build # this build only cardano-node without configs

if [ $? -ne 0 ]; then
    echo "Some error occures when installing Nix"
    cat build-log.txt
    remove_nix
    exit 1
fi

echo "Build success"
exit 0
