#!/bin/bash

# setup-vm-ssl.sh
# Installs Nginx + Certbot on the host VM and configures SSL for kamyaabi.in
# Usage: sudo ./setup-vm-ssl.sh
#
# Prerequisites:
#   - Ubuntu 20.04+ VM
#   - Domain (kamyaabi.in) DNS A record pointing to this server's public IP
#   - Ports 80 and 443 open in firewall / Oracle Cloud security list
#   - Docker containers running (frontend on 127.0.0.1:3000, backend on 127.0.0.1:8080)

set -euo pipefail

# ─── Load .env if present ────────────────────────────────────────────────────
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# ─── Configuration ───────────────────────────────────────────────────────────
DOMAIN="${DOMAIN:-kamyaabi.in}"
EMAIL="${CERTBOT_EMAIL:-admin@kamyaabi.in}"
STAGING="${CERTBOT_STAGING:-0}"  # Set to 1 to use Let's Encrypt staging (avoids rate limits)
NGINX_CONF_SRC="./nginx/vm/kamyaabi.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/kamyaabi.conf"
CERTBOT_WEBROOT="/var/www/certbot"

echo "============================================="
echo "  Kamyaabi VM SSL Setup"
echo "============================================="
echo "Domain:  $DOMAIN"
echo "Email:   $EMAIL"
echo "Staging: $STAGING"
echo ""

# ─── Check root ──────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: This script must be run as root (use sudo)."
    exit 1
fi

# ─── 1. Install Nginx ───────────────────────────────────────────────────────
echo "### Step 1: Installing Nginx ..."
apt-get update -qq
apt-get install -y -qq nginx
systemctl enable nginx
echo "Done."
echo ""

# ─── 2. Install Certbot ─────────────────────────────────────────────────────
echo "### Step 2: Installing Certbot ..."
apt-get install -y -qq certbot python3-certbot-nginx
echo "Done."
echo ""

# ─── 3. Create webroot directory for ACME challenges ────────────────────────
echo "### Step 3: Creating ACME webroot directory ..."
mkdir -p "$CERTBOT_WEBROOT"
echo "Done."
echo ""

# ─── 4. Remove default Nginx site ───────────────────────────────────────────
echo "### Step 4: Removing default Nginx site ..."
rm -f /etc/nginx/sites-enabled/default
echo "Done."
echo ""

# ─── 5. Install temporary HTTP-only config (for initial cert request) ───────
echo "### Step 5: Installing temporary HTTP-only Nginx config ..."
cat > "$NGINX_CONF_DEST" <<EOF
# Temporary HTTP-only config for initial SSL certificate request
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root $CERTBOT_WEBROOT;
    }

    location / {
        return 200 'Kamyaabi SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf "$NGINX_CONF_DEST" /etc/nginx/sites-enabled/kamyaabi.conf
nginx -t && systemctl reload nginx
echo "Done."
echo ""

# ─── 6. Obtain SSL certificate ──────────────────────────────────────────────
echo "### Step 6: Requesting Let's Encrypt SSL certificate ..."

STAGING_FLAG=""
if [ "$STAGING" != "0" ]; then
    STAGING_FLAG="--staging"
    echo "  (Using Let's Encrypt STAGING environment)"
fi

certbot certonly \
    --webroot \
    -w "$CERTBOT_WEBROOT" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    $STAGING_FLAG

echo "Done."
echo ""

# ─── 7. Install full Nginx config with SSL ──────────────────────────────────
echo "### Step 7: Installing production Nginx config with SSL ..."

if [ -f "$NGINX_CONF_SRC" ]; then
    cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
    echo "  Copied from $NGINX_CONF_SRC"
else
    echo "  WARNING: $NGINX_CONF_SRC not found, generating config inline ..."
    cat > "$NGINX_CONF_DEST" <<'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name kamyaabi.in www.kamyaabi.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://kamyaabi.in$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name kamyaabi.in www.kamyaabi.in;

    ssl_certificate /etc/letsencrypt/live/kamyaabi.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kamyaabi.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml
               application/xml application/xml+rss text/javascript image/svg+xml
               application/x-font-ttf font/opentype;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 60s;
    }

    location /swagger-ui/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /swagger-ui.html {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api-docs {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /v3/api-docs {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /actuator/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF
fi

nginx -t && systemctl reload nginx
echo "Done."
echo ""

# ─── 8. Configure auto-renewal (cron + systemd timer) ───────────────────────
echo "### Step 8: Configuring certificate auto-renewal ..."

# Certbot installs a systemd timer by default. Verify it's active.
if systemctl is-enabled certbot.timer &>/dev/null; then
    echo "  certbot.timer already enabled (runs twice daily)."
else
    systemctl enable --now certbot.timer
    echo "  Enabled certbot.timer."
fi

# Add post-renewal hook to reload Nginx
HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/reload-nginx.sh" <<'EOF'
#!/bin/bash
# Reload Nginx after certificate renewal
systemctl reload nginx
EOF
chmod +x "$HOOK_DIR/reload-nginx.sh"
echo "  Installed post-renewal hook: $HOOK_DIR/reload-nginx.sh"
echo "Done."
echo ""

# ─── 9. Test renewal (dry-run) ──────────────────────────────────────────────
echo "### Step 9: Testing certificate renewal (dry-run) ..."
certbot renew --dry-run
echo "Done."
echo ""

# ─── Summary ─────────────────────────────────────────────────────────────────
echo "============================================="
echo "  SSL Setup Complete!"
echo "============================================="
echo ""
echo "Your site is now accessible at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "Verify with:"
echo "  curl -I https://$DOMAIN"
echo "  curl https://$DOMAIN/api/products"
echo "  curl https://$DOMAIN/actuator/health"
echo ""
echo "SSL rating check:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "Certificate auto-renewal is handled by certbot.timer (runs twice daily)."
echo "Post-renewal Nginx reload is handled by $HOOK_DIR/reload-nginx.sh."
echo ""
