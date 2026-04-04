#!/bin/bash

# deploy.sh — Pull prebuilt images and (re)start containers
# Usage:
#   ./deploy.sh              # Deploy latest images
#   ./deploy.sh <tag>        # Deploy a specific tag for both images
#   ./deploy.sh --backend-tag <tag> --frontend-tag <tag>  # Per-service tags

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
BACKEND_TAG="latest"
FRONTEND_TAG="latest"

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend-tag)
            BACKEND_TAG="$2"
            shift 2
            ;;
        --frontend-tag)
            FRONTEND_TAG="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options] [tag]"
            echo ""
            echo "Options:"
            echo "  <tag>                   Deploy both images with this tag"
            echo "  --backend-tag <tag>     Backend image tag (default: latest)"
            echo "  --frontend-tag <tag>    Frontend image tag (default: latest)"
            echo "  --help, -h              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                      # Pull and deploy latest"
            echo "  $0 03312026             # Deploy date-tagged build"
            echo "  $0 --backend-tag abc123 --frontend-tag def456"
            exit 0
            ;;
        *)
            # Positional arg = same tag for both
            BACKEND_TAG="$1"
            FRONTEND_TAG="$1"
            shift
            ;;
    esac
done

export BACKEND_IMAGE_TAG="$BACKEND_TAG"
export FRONTEND_IMAGE_TAG="$FRONTEND_TAG"

echo "=== Kamyaabi Production Deployment ==="
echo "Backend image:  omprakashornold/kamyaabi-backend:${BACKEND_IMAGE_TAG}"
echo "Frontend image: omprakashornold/kamyaabi-frontend:${FRONTEND_IMAGE_TAG}"
echo ""

# --- Pre-flight checks ---
if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Copy .env.example and configure it first."
    echo "  cp .env.example .env && nano .env"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: $COMPOSE_FILE not found. Are you in the project root?"
    exit 1
fi

# --- Pull latest images ---
echo "### Pulling images ..."
docker pull "omprakashornold/kamyaabi-backend:${BACKEND_IMAGE_TAG}"
docker pull "omprakashornold/kamyaabi-frontend:${FRONTEND_IMAGE_TAG}"
echo "Done."
echo ""

# --- Stop existing containers ---
echo "### Stopping existing containers ..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
echo "Done."
echo ""

# --- Start containers ---
echo "### Starting containers ..."
docker compose -f "$COMPOSE_FILE" up -d
echo "Done."
echo ""

# --- Verify ---
echo "### Container status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""

# --- Cleanup old images ---
echo "### Cleaning up unused images ..."
docker image prune -f
echo "Done."
echo ""

# --- Verify Nginx is running (VM-level reverse proxy) ---
echo "### Checking host Nginx status ..."
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "  Nginx is running (SSL termination active)."
else
    echo "  WARNING: Nginx is NOT running on the host."
    echo "  SSL termination requires Nginx on the VM. Run: sudo ./setup-vm-ssl.sh"
fi
echo ""

echo "=== Deployment Complete ==="
echo "Backend:  omprakashornold/kamyaabi-backend:${BACKEND_IMAGE_TAG}"
echo "Frontend: omprakashornold/kamyaabi-frontend:${FRONTEND_IMAGE_TAG}"
echo ""
echo "Verify:"
echo "  docker compose -f $COMPOSE_FILE logs -f"
echo "  curl -I https://kamyaabi.in"
