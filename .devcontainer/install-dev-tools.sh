#!/bin/bash

apt-get update
apt-get -y install --no-install-recommends sshfs \
    lftp \

# REMOVE make directory for testing
mkdir /test
mkdir /mnt/remote

# Mount remote directory TODO move to docker env var
sshfs -o allow_other,default_permissions,IdentityFile=/workspaces/untitled-lftp-project/KEYS/cacus ryjo1026@cacus.feralhosting.com:/media/sdl1/ryjo1026 /mnt/remote

pushd ..
npm install
popd