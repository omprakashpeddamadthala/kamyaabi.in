#!/bin/bash

# init-letsencrypt.sh
# Obtains initial Let's Encrypt SSL certificates for kamyaabi.in
# Usage: sudo ./init-letsencrypt.sh

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DOMAINS="${DOMAIN:-kamyaabi.in}"
EMAIL="${CERTBOT_EMAIL:-admin@kamyaabi.in}"
STAGING="${CERTBOT_STAGING:-0}" # Set to 1 for testing (avoids rate limits)
DATA_PATH="./certbot"
RSA_KEY_SIZE=4096

echo "=== Let's Encrypt SSL Certificate Setup ==="
echo "Domain: $DOMAINS"
echo "Email: $EMAIL"
echo "Staging: $STAGING"
echo ""

# Check if certificates already exist
if [ -d "$DATA_PATH/conf/live/$DOMAINS" ]; then
    read -p "Existing certificates found for $DOMAINS. Replace? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
        echo "Keeping existing certificates."
        exit 0
    fi
fi

# Create required directories
mkdir -p "$DATA_PATH/conf"
mkdir -p "$DATA_PATH/www"

# Download recommended TLS parameters
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
    echo "### Downloading recommended TLS parameters ..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$DATA_PATH/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$DATA_PATH/conf/ssl-dhparams.pem"
    echo "Done."
fi

# Create dummy certificate for nginx to start
echo "### Creating dummy certificate for $DOMAINS ..."
CERT_PATH="/etc/letsencrypt/live/$DOMAINS"
mkdir -p "$DATA_PATH/conf/live/$DOMAINS"
docker compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout '$CERT_PATH/privkey.pem' \
    -out '$CERT_PATH/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo "Done."

# Start nginx with dummy certificate
echo "### Starting nginx ..."
docker compose up --force-recreate -d nginx
echo "Done."

# Wait for nginx to be ready
echo "### Waiting for nginx to be ready ..."
sleep 5

# Delete dummy certificate
echo "### Deleting dummy certificate for $DOMAINS ..."
docker compose run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$DOMAINS && \
    rm -rf /etc/letsencrypt/archive/$DOMAINS && \
    rm -rf /etc/letsencrypt/renewal/$DOMAINS.conf" certbot
echo "Done."

# Request real certificate
echo "### Requesting Let's Encrypt certificate for $DOMAINS ..."

# Select staging or production
if [ "$STAGING" != "0" ]; then
    STAGING_ARG="--staging"
    echo "  (Using staging environment)"
else
    STAGING_ARG=""
fi

docker compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    --rsa-key-size $RSA_KEY_SIZE \
    -d $DOMAINS -d www.$DOMAINS \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot
echo "Done."

# Reload nginx with real certificate
echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload
echo "Done."

echo ""
echo "=== SSL Certificate Setup Complete ==="
echo "Your site should now be accessible at https://$DOMAINS"
echo ""
echo "To start all services: docker compose up -d"
echo "Certificate auto-renewal is handled by the certbot container."
