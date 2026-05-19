# Deployment Guide — AWS EC2 (Single Instance)

This guide deploys LocalConnect Maharashtra on one Ubuntu EC2 server with all services in Docker Compose.

## Architecture on EC2

```
Internet → EC2 (Ubuntu)
              └── Docker Compose
                    ├── nginx (port 80/443)
                    ├── frontend
                    ├── backend
                    ├── postgres (volume: postgres_data)
                    └── redis (volume: redis_data)
```

**No AWS RDS** — PostgreSQL runs as a Docker container with persistent volumes.

## 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. **AMI:** Ubuntu Server 22.04 LTS
3. **Instance type:** t3.small or larger (2GB+ RAM recommended)
4. **Security Group:** Allow inbound:
   - SSH (22) — your IP only
   - HTTP (80) — 0.0.0.0/0
   - HTTPS (443) — 0.0.0.0/0
5. Create/download a key pair (.pem)
6. Launch and note the **Public IP**

## 2. Connect and Install Docker

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin
docker compose version
```

## 3. Clone and Configure

```bash
git clone https://github.com/YOUR_ORG/localconnect-maharashtra.git
cd localconnect-maharashtra

cp .env.example .env
nano .env
```

Set in `.env`:

```env
JWT_SECRET=<generate-32+-char-random-string>
JWT_REFRESH_SECRET=<generate-32+-char-random-string>
POSTGRES_PASSWORD=<strong-password>
DOCKERHUB_USERNAME=yourusername
```

## 4. Deploy with Docker Compose

### Option A: Build on server

```bash
docker compose up -d --build
```

### Option B: Pull pre-built images (CI/CD)

```bash
export DOCKERHUB_USERNAME=yourusername
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Access: **http://<EC2_PUBLIC_IP>**

## 5. Database Connection

Internal Docker network (used by backend):

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/localconnect
```

Data persists in Docker volume `postgres_data` across restarts.

## 6. Domain and SSL (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot

# Stop nginx temporarily for standalone cert
docker compose stop nginx

sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certs for nginx container
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

Uncomment SSL lines in `nginx/nginx.conf`, then:

```bash
docker compose up -d nginx
```

Auto-renewal cron:

```bash
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && docker compose -f /home/ubuntu/localconnect-maharashtra/docker-compose.yml restart nginx
```

## 7. GitHub Actions CI/CD Setup

### Repository Secrets

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `EC2_HOST` | EC2 public IP or domain |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Full private key content |
| `JWT_SECRET` | Production JWT secret |
| `JWT_REFRESH_SECRET` | Production refresh secret |

### Pipeline Flow

1. Push to `main` triggers workflow
2. Tests run against PostgreSQL + Redis services
3. Docker images built and pushed to Docker Hub
4. SSH deploys to EC2:
   - `git pull`
   - `docker compose pull`
   - `docker compose up -d`
   - `prisma migrate deploy` + seed

## 8. Useful Commands

```bash
# View logs
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Run seed manually
docker compose exec backend npx tsx prisma/seed.ts

# Database shell
docker compose exec postgres psql -U postgres -d localconnect

# Backup database
docker compose exec postgres pg_dump -U postgres localconnect > backup.sql
```

## 9. Monitoring (Optional)

Prometheus config is in `monitoring/prometheus.yml`. To enable, add Prometheus + Grafana services to docker-compose.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check `docker compose ps`, ensure backend is healthy |
| DB connection refused | Wait for postgres healthcheck, check `DATABASE_URL` uses `postgres` hostname |
| Empty feed | Run seed: `docker compose exec backend npx tsx prisma/seed.ts` |
| WebSocket fails | Ensure nginx proxies `/socket.io` with upgrade headers |
