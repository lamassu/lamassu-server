FROM alpine:3.14 as build
RUN apk add --no-cache nodejs npm git curl build-base net-tools python3 postgresql-dev

WORKDIR lamassu-server

COPY ["package.json", "package-lock.json", "./"]
RUN npm version --allow-same-version --git-tag-version false --commit-hooks false 1.0.0
RUN npm install --production

COPY . ./


FROM alpine:3.14
RUN apk add --no-cache nodejs npm git curl bash libpq openssl

COPY --from=build /lamassu-server /lamassu-server

WORKDIR /lamassu-server/

RUN chmod +x bin/lamassu-server-entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "/lamassu-server/bin/lamassu-server-entrypoint.sh" ]
