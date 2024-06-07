FROM ubuntu:20.04 as base

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Lisbon

RUN apt-get update

RUN apt-get install -y -q curl \
                          sudo \
                          git \
                          python2-minimal \
                          build-essential \
                          libpq-dev \
                          net-tools

RUN curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
RUN apt-get install nodejs -y -q

FROM base as build-l-s

WORKDIR /app

COPY bin/ packages/lamassu-server/bin
COPY lib/ packages/lamassu-server/lib
COPY data/ packages/lamassu-server/data
COPY tools/ packages/lamassu-server/tools
COPY migrations/ packages/lamassu-server/migrations
COPY package.json packages/lamassu-server/package.json
COPY Lamassu_CA.pem packages/lamassu-server/Lamassu_CA.pem

WORKDIR /app/packages/lamassu-server

RUN chmod +x tools/build-docker-certs.sh
RUN chmod +x bin/lamassu-server-entrypoint.sh

RUN npm install