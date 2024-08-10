FROM alpine:3.14
RUN apk add --no-cache nodejs npm git curl build-base net-tools python3 postgresql-dev

WORKDIR lamassu-server

COPY ["package.json", "package-lock.json", "./"]
RUN npm version --allow-same-version --git-tag-version false --commit-hooks false 1.0.0
RUN npm install --production

COPY . ./

RUN cd new-lamassu-admin && npm install && npm run build
RUN mv new-lamassu-admin/build public/
RUN rm -rf new-lamassu-admin/node_modules

RUN cd .. && tar -zcvf lamassu-server.tar.gz ./lamassu-server
