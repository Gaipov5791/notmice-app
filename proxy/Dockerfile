FROM nginx:1.27-alpine

RUN apk add --no-cache apache2-utils

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY 40-docs-basic-auth.sh /docker-entrypoint.d/40-docs-basic-auth.sh
RUN chmod 755 /docker-entrypoint.d/40-docs-basic-auth.sh
