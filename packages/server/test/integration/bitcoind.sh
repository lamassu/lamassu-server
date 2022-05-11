#!/bin/bash

 docker run --rm --name bitcoin-server -it ruimarinho/bitcoin-core \
  -regtest=1 \
  -wallet=wallet1.dat \
  -wallet=wallet2.dat

