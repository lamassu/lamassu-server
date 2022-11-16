#!/usr/bin/env bash

if [ $# -eq 0 ]; then
  echo "Error: no arguments specified"
  echo "Usage: ./build.sh <SERVER_VERSION_TAG>"
  exit 1
fi

docker build --rm --build-arg VERSION=$1 --tag l-s-prepackage:$1 --file Dockerfile .

id=$(docker create l-s-prepackage:$1)
docker cp $id:/lamassu/lamassu-server-$1.tar.gz ./lamassu-server-$1.tar.gz
docker rm -v $id
