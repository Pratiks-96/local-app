# Changelog

## 2026-05-19

### Fixed
- **Prisma schema**: Removed invalid `reportedPosts` relation on `User` model (caused Docker build failure)
- **Dockerfile**: Added OpenSSL on Alpine builder stage for Prisma
- **docker-entrypoint**: Retries database setup until Postgres is ready
- **docker-compose**: Shared network, healthchecks, env-based DB password
- Added `.dockerignore` to speed up builds (excludes `node_modules`)

### Added
- `scripts/start.sh` — one-command VM setup with auto JWT generation
- `docs/VM-SETUP.md` — simple deployment guide for Azure/EC2
- Improved `.env.example` with comments
