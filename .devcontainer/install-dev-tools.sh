#!/bin/bash

apt-get update
apt-get -y install --no-install-recommends sshfs \
    lftp \
    vim \

# Install dotfiles
git clone https://github.com/ryjo1026/.dotfiles.git ~/.dotfiles
pushd ~/.dotfiles
git submodule init
git submodule update
sh install
popd

# REMOVE make directory for testing
mkdir /test
mkdir /mnt/remote

# Mount remote directory TODO move to docker env var
sshfs -o allow_other,default_permissions,IdentityFile=/workspaces/untitled-lftp-project/KEYS/cacus ryjo1026@cacus.feralhosting.com:/media/sdl1/ryjo1026 /mnt/remote

pushd ..
npm install
npm install nodemon -g
popd