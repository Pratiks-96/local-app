#!/bin/bash
# Full deploy on Ubuntu/Azure VM — run from project root
set -e

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

echo "=========================================="
echo " LocalConnect Maharashtra - VM Deploy"
echo "=========================================="

# Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  if command -v openssl &>/dev/null; then
    J1=$(openssl rand -base64 32 | tr -d '\n')
    J2=$(openssl rand -base64 32 | tr -d '\n')
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$J1|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$J2|" .env
    echo "Created .env with auto-generated JWT secrets"
  else
    echo "Created .env — please edit JWT_SECRET and JWT_REFRESH_SECRET"
  fi
fi

# Default port 8080 if not set
grep -q '^HTTP_PORT=' .env || echo 'HTTP_PORT=8080' >> .env

echo ""
echo "Stopping old containers..."
docker compose down --remove-orphans 2>/dev/null || true

echo ""
echo "Building images (this may take 5-10 minutes)..."
docker compose build --no-cache

echo ""
echo "Starting services..."
docker compose up -d

echo ""
echo "Waiting for backend to initialize (90 seconds)..."
sleep 90

echo ""
echo "Container status:"
docker compose ps

echo ""
echo "Backend logs (last 15 lines):"
docker compose logs backend --tail 15

HTTP_PORT=$(grep '^HTTP_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 8080)
VM_IP=$(curl -s -4 --max-time 3 ifconfig.me 2>/dev/null || curl -s -4 --max-time 3 icanhazip.com 2>/dev/null || echo "YOUR_VM_IP")

echo ""
echo "=========================================="
echo " DONE"
echo "=========================================="
echo " Open:  http://${VM_IP}:${HTTP_PORT}"
echo ""
echo " Login:"
echo "   Email:    rajesh@example.com"
echo "   Password: Password123!"
echo ""
echo " If backend is not Up, run:"
echo "   docker compose logs backend --tail 50"
echo "=========================================="
