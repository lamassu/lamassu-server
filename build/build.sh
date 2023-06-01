#!/usr/bin/env bash

if [ $# -eq 0 ]; then
  echo "Error: no arguments specified"
  echo "Usage: ./build.sh <SERVER_VERSION_TAG>"
  exit 1
fi

docker build --rm --build-arg VERSION=$1 --tag l-s-prepackage:ultra-light --file Dockerfile .

id=$(docker create l-s-prepackage:ultra-light)
docker cp $id:/lamassu/lamassu-server-ultralight.tar.gz ./lamassu-server-ultralight.tar.gz
docker rm -v $id
