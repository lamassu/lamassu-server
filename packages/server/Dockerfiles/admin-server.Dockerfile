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

FROM base as build-l-a-s

WORKDIR /app

COPY bin/ packages/lamassu-admin-server/bin
COPY lib/ packages/lamassu-admin-server/lib
COPY data/ packages/lamassu-admin-server/data
COPY tools/ packages/lamassu-admin-server/tools
COPY package.json packages/lamassu-admin-server/package.json
COPY Lamassu_CA.pem packages/lamassu-admin-server/Lamassu_CA.pem

WORKDIR /app/packages/lamassu-admin-server

RUN npm install

FROM node:14 as build-admin

WORKDIR /app

COPY new-lamassu-admin/ packages/lamassu-admin

WORKDIR /app/packages/lamassu-admin

RUN npm install

RUN npm run build

FROM ubuntu:20.04 as production-l-a-s

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

COPY --from=build-l-a-s /app/packages/lamassu-admin-server /app/packages/lamassu-admin-server
COPY --from=build-admin /app/packages/lamassu-admin/build /app/packages/lamassu-admin-server/public

WORKDIR /app/packages/lamassu-admin-server

EXPOSE 443

ENTRYPOINT [ "node" ]
CMD [ "bin/lamassu-admin-server" ]