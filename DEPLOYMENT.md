# Deployment Guide - Kamyaabi (nextnotepad.com)

Production deployment on Ubuntu (Oracle Cloud) with Docker Compose, NGINX reverse proxy, and Let's Encrypt SSL.

## Architecture

```
GitHub Actions (CI/CD)
  ├── Build & test code
  ├── Build Docker images
  └── Push to Docker Hub
        ├── omprakashornold/kamyaabi-backend
        └── omprakashornold/kamyaabi-frontend

Production Server (Oracle Cloud)
  └── docker-compose.prod.yml
        ├── Pull prebuilt images (NO building on server)
        └── Run containers only

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

## Compose Files

| File | Purpose | When to use |
|------|---------|-------------|
| `docker-compose.yml` | Local development — builds images from source | `docker compose up --build` on your dev machine |
| `docker-compose.prod.yml` | Production — pulls prebuilt images from Docker Hub | `./deploy.sh` on the server |

## Prerequisites

- Ubuntu server with Docker 20+ and Docker Compose v2+
- Domain (nextnotepad.com) DNS A record pointing to server IP (129.159.227.27)
- Ports 80 and 443 open in Oracle Cloud security list / iptables

## Production Deployment (Prebuilt Images)

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

### 4. Deploy with prebuilt images

```bash
chmod +x deploy.sh

# Deploy latest images
./deploy.sh

# Or deploy a specific tag (e.g., date-based tag from CI)
./deploy.sh 03312026

# Or deploy specific tags per service
./deploy.sh --backend-tag 03312026 --frontend-tag 03312026
```

The `deploy.sh` script will:
1. Pull prebuilt images from Docker Hub
2. Stop existing containers
3. Start containers using `docker-compose.prod.yml`
4. Clean up unused images

### 5. Verify deployment

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Check individual service logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx

# Test endpoints
curl -I https://nextnotepad.com
curl https://nextnotepad.com/api/products
curl https://nextnotepad.com/actuator/health
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. **Tests** — Runs backend tests (`mvn clean verify`) and frontend build (`npm run build`)
2. **Builds** — Creates Docker images for both services
3. **Pushes** — Pushes images to Docker Hub on merge to `master` with three tags:
   - `latest` — always points to the newest build
   - `<commit-sha>` — for pinning to a specific commit
   - `<date>` (e.g., `03312026`) — for date-based releases

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
```

## Common Operations

### Stop all services
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
./deploy.sh 03312026

# By commit SHA
./deploy.sh abc1234

# Different tags per service
./deploy.sh --backend-tag 03312026 --frontend-tag 03302026
```

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f              # All services
docker compose -f docker-compose.prod.yml logs -f backend      # Backend only
docker compose -f docker-compose.prod.yml logs -f nginx        # NGINX only
```

### Restart a single service
```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

### Check container status
```bash
docker compose -f docker-compose.prod.yml ps
docker stats
```

### Force SSL certificate renewal
```bash
docker compose -f docker-compose.prod.yml run --rm certbot certbot renew --force-renewal
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Rollback to a previous version
```bash
# Deploy a known-good tag
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
docker compose -f docker-compose.prod.yml logs backend | grep -i "database\|postgres\|connection"
```

### CORS errors in browser
Verify `CORS_ALLOWED_ORIGINS` in `.env` includes `https://nextnotepad.com`.

### Frontend shows blank page
Check frontend build logs:
```bash
docker compose -f docker-compose.prod.yml logs frontend
```

### Certificate renewal fails
```bash
docker compose -f docker-compose.prod.yml logs certbot
docker compose -f docker-compose.prod.yml run --rm certbot certbot certificates
```

### Image pull fails
```bash
# Verify image exists on Docker Hub
docker pull omprakashornold/kamyaabi-backend:latest
docker pull omprakashornold/kamyaabi-frontend:latest

# Check available tags
curl -s https://hub.docker.com/v2/repositories/omprakashornold/kamyaabi-backend/tags/ | python3 -m json.tool
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
| `BACKEND_IMAGE_TAG` | deploy | Backend Docker image tag | `latest` |
| `FRONTEND_IMAGE_TAG` | deploy | Frontend Docker image tag | `latest` |
| `DOMAIN` | init script | Domain for SSL cert | `nextnotepad.com` |
| `CERTBOT_EMAIL` | init script | Email for Let's Encrypt | `admin@nextnotepad.com` |
