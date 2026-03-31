# Deployment Guide - Kamyaabi (nextnotepad.com)

Production deployment on Ubuntu (Oracle Cloud) with Docker Compose, NGINX reverse proxy, and Let's Encrypt SSL.

## Architecture

```
Internet → NGINX (SSL :443/:80)
            ├── /           → Frontend (React SPA via internal Nginx)
            ├── /api/       → Backend (Spring Boot :8080)
            ├── /swagger-ui → Backend
            ├── /api-docs   → Backend
            └── /actuator   → Backend

Services:
  ┌─────────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐
  │  NGINX :80  │  │ Frontend  │  │  Backend  │  │ Certbot │
  │  NGINX :443 │──│  :80      │  │  :8080    │──│ (cron)  │
  └─────────────┘  └───────────┘  └───────────┘  └─────────┘
                                        │
                                  ┌──────────────┐
                                  │ External DB  │
                                  │ (PostgreSQL) │
                                  └──────────────┘
```

## Prerequisites

- Ubuntu server with Docker 20+ and Docker Compose v2+
- Domain (nextnotepad.com) DNS A record pointing to server IP (129.159.227.27)
- Ports 80 and 443 open in Oracle Cloud security list / iptables

## Quick Start

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
- `DATABASE_URL` — JDBC URL for your external PostgreSQL database
- `DATABASE_USERNAME` — database username
- `DATABASE_PASSWORD` — database password
- `JWT_SECRET` — at least 256-bit secret for HS256
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard
- `VITE_GOOGLE_CLIENT_ID` — same as GOOGLE_CLIENT_ID
- `CERTBOT_EMAIL` — email for Let's Encrypt notifications

### 3. Obtain SSL certificate (first time only)

```bash
chmod +x init-letsencrypt.sh
sudo ./init-letsencrypt.sh
```

This script will:
1. Create a temporary self-signed certificate
2. Start NGINX
3. Obtain a real Let's Encrypt certificate
4. Reload NGINX with the real certificate

### 4. Start all services

```bash
docker compose up --build -d
```

### 5. Verify deployment

```bash
# Check all containers are running
docker compose ps

# Check logs
docker compose logs -f

# Check individual service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Test endpoints
curl -I https://nextnotepad.com
curl https://nextnotepad.com/api/products
curl https://nextnotepad.com/actuator/health
```

## Common Operations

### Stop all services
```bash
docker compose down
```

### Rebuild and restart (after code changes)
```bash
docker compose up --build -d
```

### Rebuild a single service
```bash
docker compose up --build -d backend
docker compose up --build -d frontend
```

### View logs
```bash
docker compose logs -f              # All services
docker compose logs -f backend      # Backend only
docker compose logs -f nginx        # NGINX only
```

### Restart a single service
```bash
docker compose restart backend
docker compose restart nginx
```

### Check container status
```bash
docker compose ps
docker stats
```

### Force SSL certificate renewal
```bash
docker compose run --rm certbot certbot renew --force-renewal
docker compose exec nginx nginx -s reload
```

### Clean rebuild (removes volumes)
```bash
docker compose down -v
docker compose up --build -d
```

## Firewall / Security List

Ensure these ports are open on Oracle Cloud:

| Port | Protocol | Purpose |
|------|----------|---------|
| 80   | TCP      | HTTP (redirects to HTTPS) |
| 443  | TCP      | HTTPS |
| 22   | TCP      | SSH (admin access) |

Port 8080 (backend) is internal only — not exposed to the internet. The database is hosted externally.

## SSL Certificate Auto-Renewal

The `certbot` container automatically renews certificates every 12 hours. The `nginx` container reloads its configuration every 6 hours to pick up renewed certificates. No manual intervention needed.

## Troubleshooting

### NGINX won't start (SSL cert missing)
Run `init-letsencrypt.sh` first to obtain certificates.

### Backend can't connect to PostgreSQL
Verify your external database connection settings in `.env`:
```bash
# Check DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD are set correctly
cat .env | grep DATABASE

# Test connectivity to external database
docker compose logs backend | grep -i "database\|postgres\|connection"
```

### CORS errors in browser
Verify `CORS_ALLOWED_ORIGINS` in `.env` includes `https://nextnotepad.com`.

### Frontend shows blank page
Check frontend build logs:
```bash
docker compose logs frontend
```

### Certificate renewal fails
```bash
docker compose logs certbot
docker compose run --rm certbot certbot certificates
```

## Environment Variables Reference

| Variable | Service | Description | Default |
|----------|---------|-------------|---------|
| `DATABASE_URL` | backend | JDBC URL for external PostgreSQL | (required) |
| `DATABASE_USERNAME` | backend | External database username | (required) |
| `DATABASE_PASSWORD` | backend | External database password | (required) |
| `JWT_SECRET` | backend | JWT signing secret (256+ bits) | dev default |
| `CORS_ALLOWED_ORIGINS` | backend | Allowed CORS origins | `https://nextnotepad.com,...` |
| `GOOGLE_CLIENT_ID` | backend | Google OAuth client ID | placeholder |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth client secret | placeholder |
| `RAZORPAY_KEY_ID` | backend | Razorpay key ID | placeholder |
| `RAZORPAY_KEY_SECRET` | backend | Razorpay key secret | placeholder |
| `EMAIL_ENABLED` | backend | Enable email notifications | `true` |
| `SENDGRID_API_KEY` | backend | SendGrid API key | placeholder |
| `VITE_API_BASE_URL` | frontend | API base URL (empty for same-origin) | `` |
| `VITE_GOOGLE_CLIENT_ID` | frontend | Google OAuth client ID | `` |
| `DOMAIN` | init script | Domain for SSL cert | `nextnotepad.com` |
| `CERTBOT_EMAIL` | init script | Email for Let's Encrypt | `admin@nextnotepad.com` |
