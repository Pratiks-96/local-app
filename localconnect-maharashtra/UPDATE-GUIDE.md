# Update Guide — What Changed & What To Do

## Quick steps on VM

```bash
# 1. Stop old containers
cd ~/local-app/localconnect-maharashtra
docker compose down

# 2. (After copying updated files from PC — see below)

# 3. Create .env if missing
cp .env.example .env
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 32   # → JWT_REFRESH_SECRET
nano .env

# 4. Build and start
docker compose up -d --build

# 5. Check
docker compose ps
docker compose logs backend --tail 20
```

Open: **http://YOUR_VM_IP**  
Login: `rajesh@example.com` / `Password123!`

---

## Copy entire project from Windows (easiest)

```powershell
scp -r "C:\Users\HP\Downloads\teleport-v18.7.5-windows-amd64-bin\localconnect-maharashtra" azureuser@YOUR_VM_IP:~/local-app/
```

This replaces everything with the latest version (92 files).

---

## Files that were FIXED (must have latest)

### Critical bug fixes

| File | What was fixed |
|------|----------------|
| `backend/prisma/schema.prisma` | Removed broken `reportedPosts` field (Docker build failed) |
| `frontend/src/components/ProtectedRoute.tsx` | Fixed `isAuthenticated()` TypeScript error |
| `frontend/src/App.tsx` | Removed unused import |
| `backend/src/lib/jwt.ts` | Fixed JWT sign TypeScript errors |
| `backend/src/middleware/auth.ts` | Fixed Express User type conflict |
| `backend/src/types/express.d.ts` | **NEW** — auth types for Express |
| `backend/src/socket/index.ts` | Fixed Socket.IO types |
| `backend/src/routes/posts.routes.ts` | Fixed query params types |

### Docker & deployment improvements

| File | What changed |
|------|----------------|
| `backend/Dockerfile` | OpenSSL for Prisma on Alpine |
| `backend/docker-entrypoint.sh` | Retry DB until Postgres ready |
| `docker-compose.yml` | Network, healthchecks, env vars |
| `backend/.dockerignore` | Faster builds (skip node_modules) |
| `frontend/.dockerignore` | Faster builds |
| `.env.example` | Clear JWT/DB instructions |
| `backend/.env.example` | Docker vs localhost notes |
| `backend/prisma/seed.ts` | Safer location seeding |
| `README.md` | Troubleshooting section |
| `CHANGELOG.md` | Change log |

### New files

| File | Purpose |
|------|---------|
| `docs/VM-SETUP.md` | Simple VM guide |
| `scripts/start.sh` | One-command setup |
| `UPDATE-GUIDE.md` | This file |

---

## Full project file list (92 files)

```
localconnect-maharashtra/
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── UPDATE-GUIDE.md
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── scripts/start.sh
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── VM-SETUP.md
├── nginx/nginx.conf
├── monitoring/prometheus.yml
├── .github/workflows/ci-cd.yml
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── jest.integration.config.js
│   ├── prisma/
│   │   ├── schema.prisma          ★ FIXED
│   │   ├── seed.ts
│   │   └── migrations/migration_lock.toml
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── app.integration.test.ts
│       ├── config/index.ts
│       ├── config/swagger.ts
│       ├── lib/prisma.ts, redis.ts, jwt.ts, jwt.test.ts
│       ├── middleware/auth.ts, validate.ts, errorHandler.ts
│       ├── schemas/auth.schema.ts, post.schema.ts
│       ├── services/location.service.ts
│       ├── routes/*.ts (auth, users, posts, etc.)
│       └── socket/index.ts
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── .dockerignore
    ├── .env.example
    ├── package.json
    ├── tsconfig.json, tsconfig.node.json
    ├── vite.config.ts, tailwind.config.js, postcss.config.js
    ├── index.html
    ├── public/favicon.svg
    └── src/
        ├── main.tsx
        ├── App.tsx                    ★ FIXED
        ├── index.css, vite-env.d.ts
        ├── components/
        │   ├── ProtectedRoute.tsx     ★ FIXED
        │   ├── AdminRoute.tsx
        │   ├── layout/AppLayout.tsx
        │   ├── posts/PostCard.tsx, CreatePostModal.tsx
        │   └── ui/Toaster.tsx, FeedSkeleton.tsx
        ├── pages/ (Landing, Login, Register, Feed, etc.)
        ├── stores/authStore.ts, themeStore.ts
        └── lib/api.ts, utils.ts, utils.test.ts
```

★ = Must update on VM if not copying full folder

---

## JWT setup (.env)

```env
JWT_SECRET=<paste output of: openssl rand -base64 32>
JWT_REFRESH_SECRET=<paste DIFFERENT output>
POSTGRES_PASSWORD=postgres
```

Do NOT put login tokens in .env — only these two secrets.

---

## Git push (optional)

```bash
cd localconnect-maharashtra
git add .
git commit -m "Fix Prisma schema, frontend build, Docker setup"
git push
```

Never commit `.env` file.
