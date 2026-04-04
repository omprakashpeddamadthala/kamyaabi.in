# Deployment Guide - Kamyaabi (kamyaabi.in)

Production deployment on Ubuntu (Oracle Cloud) with Docker Compose and **VM-level Nginx reverse proxy** with Let's Encrypt SSL.

## Architecture

```
GitHub Actions (CI/CD)
  ├── Build & test code
  ├── Build Docker images
  └── Push to Docker Hub
        ├── omprakashornold/kamyaabi-backend
        └── omprakashornold/kamyaabi-frontend

Production Server (Oracle Cloud VM)
  ├── Nginx (installed on VM) — SSL termination
  │     ├── :80  → redirect to HTTPS
  │     └── :443 → reverse proxy
  │           ├── /           → Frontend container (127.0.0.1:3000)
  │           ├── /api/       → Backend container (127.0.0.1:8080)
  │           ├── /swagger-ui → Backend container
  │           ├── /api-docs   → Backend container
  │           └── /actuator   → Backend container
  │
  └── Docker Compose (docker-compose.prod.yml)
        ├── kamyaabi-backend  → 127.0.0.1:8080 (localhost only)
        └── kamyaabi-frontend → 127.0.0.1:3000 (localhost only)
                                      │
                                ┌──────────────┐
                                │ External DB  │
                                │ (PostgreSQL) │
                                └──────────────┘
```

**Key design decisions:**
- SSL is handled by **Nginx on the VM** (not inside Docker)
- Docker containers expose ports to **localhost only** (not public)
- Certbot runs on the VM with a systemd timer for auto-renewal
- No Docker image rebuilds needed for SSL changes

## Compose Files

| File | Purpose | When to use |
|------|---------|-------------|
| `docker-compose.yml` | Local development — builds images from source | `docker compose up --build` on your dev machine |
| `docker-compose.prod.yml` | Production — pulls prebuilt images from Docker Hub | `./deploy.sh` on the server |

## Prerequisites

- Ubuntu 20.04+ server with Docker 20+ and Docker Compose v2+
- Domain (`kamyaabi.in`) DNS A record pointing to server IP
- Ports 80 and 443 open in Oracle Cloud security list / iptables
- Port 22 open for SSH access

## Production Deployment

### 1. Clone the repository

```bash
git clone https://github.com/omprakashpeddamadthala/kamyaabi.in.git
cd kamyaabi.in
```

### 2. Configure environment variables

```bash
cp .env.example .env
nano .env  # Edit with your actual values
```

**Required values to update:**
- `DOMAIN` — your domain (default: `kamyaabi.in`)
- `CERTBOT_EMAIL` — email for Let's Encrypt notifications
- `DATABASE_URL` — JDBC URL for your external PostgreSQL database
- `DATABASE_USERNAME` / `DATABASE_PASSWORD` — database credentials
- `JWT_SECRET` — at least 256-bit secret for HS256
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard
- `VITE_GOOGLE_CLIENT_ID` — same as `GOOGLE_CLIENT_ID`
- `CORS_ALLOWED_ORIGINS` — set to `https://kamyaabi.in`

### 3. Install Nginx & SSL on the VM (first time only)

```bash
chmod +x setup-vm-ssl.sh
sudo ./setup-vm-ssl.sh
```

This script will:
1. Install Nginx on the VM
2. Install Certbot (Let's Encrypt client)
3. Create a temporary HTTP config for ACME challenge
4. Obtain a real SSL certificate from Let's Encrypt
5. Install the full Nginx config with SSL termination
6. Configure automatic certificate renewal (systemd timer)
7. Run a dry-run renewal test

**Note:** If you want to test with Let's Encrypt staging first (to avoid rate limits), set `CERTBOT_STAGING=1` in `.env` before running the script.

### 4. Deploy application containers

```bash
chmod +x deploy.sh

# Deploy latest images
./deploy.sh

# Or deploy a specific tag (e.g., date-based tag from CI)
./deploy.sh 04042026

# Or deploy specific tags per service
./deploy.sh --backend-tag 04042026 --frontend-tag 04042026
```

The `deploy.sh` script will:
1. Pull prebuilt images from Docker Hub
2. Stop existing containers
3. Start containers (ports bound to 127.0.0.1 only)
4. Verify Nginx is running
5. Clean up unused images

### 5. Verify deployment

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check container logs
docker compose -f docker-compose.prod.yml logs -f

# Check Nginx status
sudo systemctl status nginx

# Test endpoints
curl -I https://kamyaabi.in
curl https://kamyaabi.in/api/products
curl https://kamyaabi.in/actuator/health

# Check SSL certificate
echo | openssl s_client -servername kamyaabi.in -connect kamyaabi.in:443 2>/dev/null | openssl x509 -noout -dates

# Check SSL rating (expect A grade)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=kamyaabi.in
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. **Tests** — Runs backend tests (`mvn clean verify`) and frontend build (`npm run build`)
2. **Builds** — Creates Docker images for both services
3. **Pushes** — Pushes images to Docker Hub on merge to `master` with three tags:
   - `latest` — always points to the newest build
   - `<commit-sha>` — for pinning to a specific commit
   - `<date>` (e.g., `04042026`) — for date-based releases

**Images on Docker Hub:**
- `omprakashornold/kamyaabi-backend`
- `omprakashornold/kamyaabi-frontend`

## Deployment Workflow

```
Developer pushes to master
        │
        ▼
GitHub Actions CI/CD
  ├── Run tests
  ├── Build Docker images
  └── Push to Docker Hub
        │
        ▼
SSH into production server
        │
        ▼
./deploy.sh [tag]
  ├── docker pull (backend + frontend)
  ├── docker compose down
  └── docker compose up -d
        │
        ▼
Nginx on VM serves traffic
  ├── :80  → 301 redirect to HTTPS
  └── :443 → proxy to containers
```

## SSL Certificate Management

### Auto-Renewal

Certbot's systemd timer (`certbot.timer`) runs twice daily and automatically renews certificates when they are within 30 days of expiry. A post-renewal hook at `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` reloads Nginx after renewal.

```bash
# Check timer status
sudo systemctl status certbot.timer

# Check when the timer last ran
sudo systemctl list-timers certbot.timer

# View certificate details
sudo certbot certificates
```

### Manual Renewal

```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

## Nginx Configuration

The VM-level Nginx config is at:
- **Source:** `nginx/vm/kamyaabi.conf` (in this repo)
- **Installed at:** `/etc/nginx/sites-available/kamyaabi.conf`
- **Symlinked to:** `/etc/nginx/sites-enabled/kamyaabi.conf`

### Features

| Feature | Details |
|---------|---------|
| HTTP to HTTPS redirect | All port 80 traffic redirected to 443 |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | `SAMEORIGIN` |
| X-Content-Type-Options | `nosniff` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | Camera, microphone, geolocation disabled |
| Gzip | Enabled for text, JSON, JS, CSS, SVG, XML |
| TLS protocols | TLSv1.2 + TLSv1.3 |
| Max upload size | 20 MB |

### Update Nginx Config

```bash
# After editing nginx/vm/kamyaabi.conf
sudo cp nginx/vm/kamyaabi.conf /etc/nginx/sites-available/kamyaabi.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Common Operations

### Stop all containers
```bash
docker compose -f docker-compose.prod.yml down
```

### Update to latest images
```bash
./deploy.sh
```

### Deploy a specific version
```bash
# By date tag
./deploy.sh 04042026

# By commit SHA
./deploy.sh abc1234

# Different tags per service
./deploy.sh --backend-tag 04042026 --frontend-tag 04032026
```

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f              # All services
docker compose -f docker-compose.prod.yml logs -f backend      # Backend only
docker compose -f docker-compose.prod.yml logs -f frontend     # Frontend only
sudo tail -f /var/log/nginx/access.log                         # Nginx access log
sudo tail -f /var/log/nginx/error.log                          # Nginx error log
```

### Restart a single service
```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
sudo systemctl restart nginx
```

### Check container status
```bash
docker compose -f docker-compose.prod.yml ps
docker stats
```

### Force SSL certificate renewal
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Rollback to a previous version
```bash
./deploy.sh --backend-tag <previous-tag> --frontend-tag <previous-tag>
```

## Local Development (Build from Source)

For local development, use the standard `docker-compose.yml` which builds from source:

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up --build -d

# Stop all services
docker compose down
```

## Firewall / Security List

Ensure these ports are open on Oracle Cloud:

| Port | Protocol | Purpose |
|------|----------|---------|
| 80   | TCP      | HTTP (redirects to HTTPS) |
| 443  | TCP      | HTTPS |
| 22   | TCP      | SSH (admin access) |

Ports 8080 (backend) and 3000 (frontend) are bound to `127.0.0.1` only — **not exposed to the internet**. The database is hosted externally.

## Troubleshooting

### Nginx won't start (SSL cert missing)

```bash
# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# If certs don't exist, run the SSL setup script
sudo ./setup-vm-ssl.sh
```

### Nginx 502 Bad Gateway

The containers are not running or not bound to the expected ports.

```bash
# Check containers
docker compose -f docker-compose.prod.yml ps

# Verify ports are bound to localhost
ss -tlnp | grep -E ':(3000|8080)'

# Restart containers if needed
docker compose -f docker-compose.prod.yml restart
```

### Backend can't connect to PostgreSQL

```bash
# Check DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD in .env
grep DATABASE .env

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend | grep -i "database\|postgres\|connection"
```

### CORS errors in browser

Verify `CORS_ALLOWED_ORIGINS` in `.env` includes `https://kamyaabi.in`:
```bash
grep CORS .env
```

### Frontend shows blank page

```bash
docker compose -f docker-compose.prod.yml logs frontend
curl -I http://127.0.0.1:3000  # Should return 200 from frontend container
```

### SSL certificate renewal fails

```bash
# Check Certbot logs
sudo journalctl -u certbot.timer
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Ensure port 80 is accessible (needed for ACME challenge)
sudo ufw status
curl -I http://kamyaabi.in/.well-known/acme-challenge/test
```

### Mixed content warnings

If the browser shows mixed content errors, verify:
1. `CORS_ALLOWED_ORIGINS` uses `https://` (not `http://`)
2. `VITE_API_BASE_URL` is empty (uses same-origin) or starts with `https://`
3. Backend's `forward-headers-strategy: framework` is set in `application-prod.yml`

### Check SSL rating

Visit [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=kamyaabi.in) — expect an **A** grade with the current TLS configuration.

### Image pull fails

```bash
# Verify images exist on Docker Hub
docker pull omprakashornold/kamyaabi-backend:latest
docker pull omprakashornold/kamyaabi-frontend:latest

# Check available tags
curl -s https://hub.docker.com/v2/repositories/omprakashornold/kamyaabi-backend/tags/ | python3 -m json.tool
```

## Environment Variables Reference

| Variable | Service | Description | Default |
|----------|---------|-------------|---------|
| `DOMAIN` | SSL setup | Domain for SSL certificate | `kamyaabi.in` |
| `CERTBOT_EMAIL` | SSL setup | Email for Let's Encrypt | `admin@kamyaabi.in` |
| `CERTBOT_STAGING` | SSL setup | Use LE staging (1=yes) | `0` |
| `DATABASE_URL` | backend | JDBC URL for external PostgreSQL | (required) |
| `DATABASE_USERNAME` | backend | External database username | (required) |
| `DATABASE_PASSWORD` | backend | External database password | (required) |
| `JWT_SECRET` | backend | JWT signing secret (256+ bits) | dev default |
| `CORS_ALLOWED_ORIGINS` | backend | Allowed CORS origins | `https://kamyaabi.in` |
| `GOOGLE_CLIENT_ID` | backend | Google OAuth client ID | placeholder |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth client secret | placeholder |
| `RAZORPAY_KEY_ID` | backend | Razorpay key ID | placeholder |
| `RAZORPAY_KEY_SECRET` | backend | Razorpay key secret | placeholder |
| `EMAIL_ENABLED` | backend | Enable email notifications | `true` |
| `SENDGRID_API_KEY` | backend | SendGrid API key | placeholder |
| `VITE_API_BASE_URL` | frontend | API base URL (empty = same-origin) | `` |
| `VITE_GOOGLE_CLIENT_ID` | frontend | Google OAuth client ID | `` |
| `BACKEND_IMAGE_TAG` | deploy | Backend Docker image tag | `latest` |
| `FRONTEND_IMAGE_TAG` | deploy | Frontend Docker image tag | `latest` |

## Migration from Docker-based Nginx

If you previously ran Nginx inside Docker (the old architecture), follow these steps:

1. **Stop old containers** (including nginx and certbot):
   ```bash
   docker compose down
   ```

2. **Run the VM SSL setup**:
   ```bash
   sudo ./setup-vm-ssl.sh
   ```

3. **Deploy with the new compose file**:
   ```bash
   ./deploy.sh
   ```

4. **Verify** the old nginx/certbot containers are gone:
   ```bash
   docker ps  # Should only show kamyaabi-backend and kamyaabi-frontend
   ```
