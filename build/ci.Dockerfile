FROM ubuntu:20.04 as base

ARG VERSION
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Lisbon

RUN apt-get update

RUN apt-get install -y -q curl \
                          sudo \
                          git \
                          python2-minimal \
                          build-essential \
                          libpq-dev \
                          net-tools \
                          tar

RUN curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
RUN apt-get install nodejs -y -q

WORKDIR lamassu-server

COPY ["package.json", "package-lock.json", "./"]
RUN npm version --allow-same-version --git-tag-version false --commit-hooks false 1.0.0
RUN npm install --production

COPY . ./

RUN cd new-lamassu-admin && npm install && npm run build
RUN mv new-lamassu-admin/build public/
RUN rm -rf new-lamassu-admin/node_modules

RUN cd .. && tar -zcvf lamassu-server.tar.gz ./lamassu-server
