FROM node:14 as build-admin

WORKDIR /app

# COPY new-lamassu-admin/src packages/lamassu-admin/src
# COPY new-lamassu-admin/patches packages/lamassu-admin/patches
# COPY new-lamassu-admin/public packages/lamassu-admin/public
# COPY new-lamassu-admin/nginx packages/lamassu-admin/nginx
# COPY new-lamassu-admin/.env packages/lamassu-admin/.env
# COPY new-lamassu-admin/.eslintrc.js packages/lamassu-admin/.eslintrc.js
# COPY new-lamassu-admin/jsconfig.json packages/lamassu-admin/jsconfig.json
# COPY new-lamassu-admin/package.json packages/lamassu-admin/package.json

COPY new-lamassu-admin packages/lamassu-admin

WORKDIR /app/packages/lamassu-admin

# RUN npm install

RUN npm run build

FROM nginx:1.21.4-alpine as production-admin

ENV NODE_ENV=production

COPY --from=build-admin /app/packages/lamassu-admin/build /usr/share/nginx/html/
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build-admin /app/packages/lamassu-admin/nginx/nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]