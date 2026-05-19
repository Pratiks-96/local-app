# Update Guide — Copy This Folder to VM

## Fastest way (recommended)

### 1. Copy entire folder from Windows

```powershell
scp -r "C:\Users\HP\Downloads\teleport-v18.7.5-windows-amd64-bin\localconnect-maharashtra" azureuser@YOUR_VM_IP:~/local-app/
```

### 2. On VM — one command

```bash
cd ~/local-app/localconnect-maharashtra
chmod +x scripts/deploy-vm.sh
./scripts/deploy-vm.sh
```

### 3. Open browser

```
http://YOUR_VM_IP:8080
```

Login: `rajesh@example.com` / `Password123!`

---

## What was fixed (latest)

| Issue | Fix |
|-------|-----|
| Prisma `reportedPosts` error | `backend/prisma/schema.prisma` |
| Frontend build error | `ProtectedRoute.tsx`, `App.tsx` |
| Backend TypeScript build | `jwt.ts`, `express.d.ts`, `auth.ts` |
| `/docker-entrypoint.sh: not found` | Removed — inline CMD in `Dockerfile` |
| nginx `host not found backend` | `nginx/nginx.conf` uses Docker DNS |
| Port 80 already in use | Default `HTTP_PORT=8080` in `.env.example` |

---

## Files you must have (critical)

```
backend/Dockerfile                    ← NO docker-entrypoint.sh
backend/prisma/schema.prisma
backend/src/types/express.d.ts
backend/src/lib/jwt.ts
backend/src/middleware/auth.ts
nginx/nginx.conf
docker-compose.yml
.env.example
scripts/deploy-vm.sh
```

**Note:** `backend/docker-entrypoint.sh` was **deleted** — do not use it.

---

## JWT secrets (.env)

```bash
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 32   # → JWT_REFRESH_SECRET
```

Put in `.env` file. Never commit `.env` to git.

---

## If old containers still fail

```bash
cd ~/local-app/localconnect-maharashtra
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose ps
```

---

See also: `DEPLOY-VM.md`
