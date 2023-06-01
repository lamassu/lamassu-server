FROM ubuntu:20.04 as base

ARG VERSION
ENV SERVER_VERSION=$VERSION
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

FROM base as l-s-build

WORKDIR /lamassu

RUN git clone https://github.com/lamassu/lamassu-server -b ${SERVER_VERSION}
RUN rm -rf /lamassu/lamassu-server/public/*
RUN cd lamassu-server && npm install --production

RUN cd lamassu-server/new-lamassu-admin && npm install && npm run build
RUN cp -r /lamassu/lamassu-server/new-lamassu-admin/build/* /lamassu/lamassu-server/public
RUN rm -rf /lamassu/lamassu-server/new-lamassu-admin/node_modules

RUN tar -zcvf lamassu-server-ultralight.tar.gz lamassu-server/

ENTRYPOINT [ "/bin/bash" ]
