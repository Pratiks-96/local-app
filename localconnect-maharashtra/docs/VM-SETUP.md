# Simple VM Setup Guide

Use this guide on your Ubuntu/Azure/AWS VM.

## Step 1: Install Docker (one time)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## Step 2: Copy project to VM

From your Windows PC:

```powershell
scp -r "C:\Users\HP\Downloads\teleport-v18.7.5-windows-amd64-bin\localconnect-maharashtra" azureuser@YOUR_VM_IP:~/local-app/
```

## Step 3: Start the app (on VM)

```bash
cd ~/local-app/localconnect-maharashtra
chmod +x scripts/start.sh
./scripts/start.sh
```

**OR manually:**

```bash
cd ~/local-app/localconnect-maharashtra
cp .env.example .env

# Generate JWT secrets
openssl rand -base64 32   # copy → JWT_SECRET in .env
openssl rand -base64 32   # copy → JWT_REFRESH_SECRET in .env

nano .env   # paste secrets, save

docker compose up -d --build
```

## Step 4: Open in browser

```
http://YOUR_VM_IP
```

Login: `rajesh@example.com` / `Password123!`

---

## What is JWT_SECRET? (simple)

You do **NOT** create login tokens yourself.

| Variable | What you do |
|----------|-------------|
| `JWT_SECRET` | Paste a long random password (32+ chars) |
| `JWT_REFRESH_SECRET` | Paste a **different** long random password |

The app creates user login tokens automatically when someone signs in.

Generate on VM:
```bash
openssl rand -base64 32
```

---

## Common errors

### `reportedPosts` Prisma error
**Fixed** in latest code. Update your files or pull latest git, then:
```bash
docker compose up -d --build
```

### `Can't reach database at localhost:5432`
You ran `npm run dev` without Postgres. **Use Docker instead:**
```bash
docker compose up -d --build
```

### `cd backend: No such file`
You are already inside `backend/`. Go to project root:
```bash
cd ~/local-app/localconnect-maharashtra
```

### Build failed
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Check if running
```bash
docker compose ps
docker compose logs backend --tail 30
```

---

## Push to GitHub

```bash
cd ~/local-app/localconnect-maharashtra
git init
git add .
git commit -m "LocalConnect Maharashtra"
git remote add origin https://github.com/YOUR_USER/localconnect-maharashtra.git
git push -u origin main
```

**Never commit `.env`** — only `.env.example`.

---

## Do NOT use npm manually (unless you know how)

| Wrong | Right |
|-------|-------|
| `cd backend && npm run dev` | `docker compose up -d --build` |
| Postgres on localhost | Postgres runs inside Docker automatically |
