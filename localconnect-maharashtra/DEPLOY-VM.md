# Deploy on Azure / Ubuntu VM (Simple Guide)

## One-time: copy project to VM

**From Windows PowerShell:**

```powershell
scp -r "C:\Users\HP\Downloads\teleport-v18.7.5-windows-amd64-bin\localconnect-maharashtra" azureuser@YOUR_VM_IP:~/local-app/
```

## On VM: one command deploy

```bash
cd ~/local-app/localconnect-maharashtra
chmod +x scripts/deploy-vm.sh
./scripts/deploy-vm.sh
```

## Open app

Default port is **8080** (avoids conflict with system nginx on port 80):

```
http://YOUR_VM_IP:8080
```

**Login:** `rajesh@example.com` / `Password123!`

---

## Manual steps (if you prefer)

```bash
cd ~/local-app/localconnect-maharashtra
cp .env.example .env
nano .env          # set JWT secrets (openssl rand -base64 32)

docker compose down
docker compose build --no-cache
docker compose up -d

docker compose ps
docker compose logs backend --tail 20
```

---

## Azure: open port in firewall

In Azure Portal → VM → Networking → Add inbound rule:

- Port: **8080**
- Protocol: TCP
- Source: Any (or your IP)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/docker-entrypoint.sh: not found` | Run `docker compose build --no-cache backend` (old image) |
| Port 80 in use | Use `HTTP_PORT=8080` in `.env` |
| nginx `host not found backend` | Backend not running — fix backend first |
| backend Restarting | `docker compose logs backend --tail 50` |

```bash
# Full reset rebuild
docker compose down -v   # WARNING: deletes database data
docker compose build --no-cache
docker compose up -d
```

---

## All fixes included in this version

- Prisma schema (`reportedPosts` removed)
- Frontend TypeScript (`ProtectedRoute`)
- Backend TypeScript (JWT, Express types)
- Backend Dockerfile (inline CMD, no entrypoint.sh)
- Nginx Docker DNS resolver
- Default port 8080
