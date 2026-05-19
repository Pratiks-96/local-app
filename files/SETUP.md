# LocalConnect — Complete Setup Guide

## Pipeline Flow

```
git push main
      │
      ▼
① setup-ec2          Install Docker, kubectl, Minikube, Nginx on EC2 via SSH
      │
      ▼
② test-backend       Run pytest (GitHub runner, with postgres service)
      │
      ▼
③ test-compose       SSH into EC2 → docker-compose up → smoke test → down
      │
      ├──────────────────────────┐
      ▼                          ▼
④ build-backend      ⑤ build-frontend
  docker build           docker build
  push → DockerHub       push → DockerHub
  pratik6958/...:sha-xxx pratik6958/...:sha-xxx
      │                          │
      └──────────┬───────────────┘
                 ▼
⑥ deploy         SSH into EC2
                   → docker pull from DockerHub
                   → minikube image load
                   → kubectl apply k8s/
                   → kubectl rollout status
                   → nginx reload
                   → smoke test
                   → ✅ Live!
```

---

## Step 1 — Generate SSH Key (Run on YOUR local machine)

```bash
chmod +x scripts/generate-ssh-key.sh
./scripts/generate-ssh-key.sh <EC2_PUBLIC_IP> ubuntu
```

This will:
- Generate `~/.ssh/localconnect-github-actions` (private key)
- Copy public key to EC2 automatically
- Print the private key to add to GitHub Secrets

---

## Step 2 — Get DockerHub Token

1. Go to https://hub.docker.com
2. Account Settings → Security → New Access Token
3. Name: `github-actions-localconnect`
4. Permissions: Read, Write, Delete
5. Copy the token

---

## Step 3 — Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `DOCKERHUB_USERNAME` | `pratik6958` | Your DockerHub username |
| `DOCKERHUB_TOKEN` | `dckr_pat_xxxxx` | Token from Step 2 |
| `EC2_HOST` | `54.123.45.67` | EC2 public IP from AWS Console |
| `EC2_USER` | `ubuntu` | `ubuntu` for Ubuntu, `ec2-user` for Amazon Linux |
| `EC2_SSH_KEY` | `-----BEGIN OPENSSH...` | Full private key from Step 1 |

---

## Step 4 — Open EC2 Security Group

In AWS Console → EC2 → Security Groups → your EC2 security group → Inbound Rules:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 80 | TCP | 0.0.0.0/0 | Nginx (app entry) |

> **Do NOT open 30300/30800** — these are internal Minikube ports, Nginx handles routing.

---

## Step 5 — Push to main and watch pipeline

```bash
git add .
git commit -m "deploy: initial setup"
git push origin main
```

Go to: GitHub Repo → Actions → watch the pipeline run

---

## Step 6 — After First Deploy: Set Up Persistent Port Forwarding

SSH into EC2 and run:
```bash
sudo bash scripts/setup-port-forward.sh ubuntu
```

This creates systemd services so port-forwarding survives reboots.

---

## Access URLs After Deploy

| Service | URL |
|---------|-----|
| 🌐 Frontend App | `http://<EC2-IP>/` |
| ⚡ Backend API | `http://<EC2-IP>/api/` |
| 📖 API Docs | `http://<EC2-IP>/docs` |
| 📊 Prometheus | `http://<EC2-IP>/prometheus/` |
| 📈 Grafana | `http://<EC2-IP>/grafana/` (admin/admin123) |

---

## Verify Deploy on EC2

```bash
# Check all pods
kubectl get pods -n localconnect

# Check services
kubectl get services -n localconnect

# Test via Nginx
curl http://localhost/health
curl http://localhost/api/posts

# Check port-forward services
systemctl status kube-pf-frontend
systemctl status kube-pf-backend

# View Nginx logs
sudo tail -f /var/log/nginx/localconnect_access.log

# View app logs
kubectl logs -n localconnect deployment/backend  -f
kubectl logs -n localconnect deployment/frontend -f
```

---

## Troubleshooting

**Pipeline fails at setup-ec2:**
```bash
# SSH manually and check
ssh -i ~/.ssh/localconnect-github-actions ubuntu@<EC2-IP>
docker --version
minikube status
```

**Pipeline fails at test-compose:**
```bash
# SSH into EC2, check compose logs
cd ~/localconnect-app
docker-compose logs backend
docker-compose logs frontend
```

**Port forward not working:**
```bash
sudo systemctl restart kube-pf-frontend kube-pf-backend
journalctl -u kube-pf-backend -f
```

**Nginx 502 Bad Gateway:**
```bash
# Port forward not running
kubectl port-forward --address 127.0.0.1 svc/backend-service 30800:8000 -n localconnect &
kubectl port-forward --address 127.0.0.1 svc/frontend-service 30300:80 -n localconnect &
```

**Minikube not starting:**
```bash
minikube delete
minikube start --driver=docker --memory=4096 --cpus=2
```
