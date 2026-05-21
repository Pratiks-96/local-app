# Changelog

## 2026-05-19 (latest — npm ci fix)

### Fixed
- **Dockerfiles**: Changed `npm ci` → `npm install` (no package-lock.json required)

## 2026-05-19 (VM deploy fix)

### Fixed
- **Backend Docker**: Removed `docker-entrypoint.sh` — uses inline `CMD` (fixes exit 127 / not found)
- **Backend Docker**: Run `prisma generate` in production image
- **Nginx**: Docker DNS resolver — starts even if backend is briefly down
- **Default port**: `HTTP_PORT=8080` in `.env.example` (avoids port 80 conflict)
- **Deploy script**: `scripts/deploy-vm.sh` — full one-command VM setup

### Previously fixed
- Prisma schema `reportedPosts` removed
- Frontend `ProtectedRoute` TypeScript
- Backend JWT + Express `User` types
- OpenSSL on Alpine for Prisma

### Added
- `DEPLOY-VM.md` — simple VM deployment guide
- `scripts/deploy-vm.sh` — automated deploy
- `.gitattributes` — LF line endings for shell scripts

### Removed
- `backend/docker-entrypoint.sh` (caused VM deploy failures)
