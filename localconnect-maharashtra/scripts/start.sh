#!/bin/bash
# One-command setup for VM / EC2
set -e

cd "$(dirname "$0")/.."

echo "=== LocalConnect Maharashtra Setup ==="

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env

  if command -v openssl &>/dev/null; then
    JWT1=$(openssl rand -base64 32 | tr -d '\n')
    JWT2=$(openssl rand -base64 32 | tr -d '\n')
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT1|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT2|" .env
    echo "Auto-generated JWT secrets in .env"
  else
    echo "WARNING: Edit .env and set JWT_SECRET and JWT_REFRESH_SECRET manually!"
  fi
fi

echo "Building and starting all containers..."
docker compose up -d --build

echo ""
echo "Waiting for services to start (30 seconds)..."
sleep 30

echo ""
docker compose ps

echo ""
echo "=== DONE ==="
echo "Open in browser: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VM_IP')"
echo ""
echo "Demo login:"
echo "  Email:    rajesh@example.com"
echo "  Password: Password123!"
echo ""
echo "View logs: docker compose logs -f backend"
