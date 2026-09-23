#!/bin/sh
# Write the docs basic-auth file from env. The password never lives in the image.
set -eu

user="${DOCS_BASIC_AUTH_USER:-}"
password="${DOCS_BASIC_AUTH_PASSWORD:-}"

if [ -z "$user" ] || [ -z "$password" ]; then
  echo "DOCS_BASIC_AUTH_USER and DOCS_BASIC_AUTH_PASSWORD must be set" >&2
  exit 1
fi

htpasswd -bc /etc/nginx/auth.htpasswd "$user" "$password"
chmod 644 /etc/nginx/auth.htpasswd
