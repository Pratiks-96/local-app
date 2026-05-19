# LocalConnect Maharashtra

Hyperlocal social networking platform for Maharashtra communities — connect with neighbors by **State → City → Area → Society**.

![Stack](https://img.shields.io/badge/React-Vite-61DAFB)
![Stack](https://img.shields.io/badge/Node-Express-339933)
![Stack](https://img.shields.io/badge/PostgreSQL-4169E1)
![Stack](https://img.shields.io/badge/Docker-2496ED)

## Features

- **Authentication** — Email/phone registration, JWT + refresh tokens, password reset, role-based access (User, Moderator, Admin)
- **Location hierarchy** — Maharashtra → 8 cities → areas → societies
- **Feed** — Locality-scoped posts with categories, likes, comments, bookmarks, polls, reports
- **Marketplace** — Buy/sell with neighbors
- **Messaging** — Real-time chat via Socket.IO
- **Notifications** — In-app notifications
- **Admin panel** — User management, moderation, analytics
- **Search** — Posts, users, locations, marketplace items
- **UI** — Premium responsive design, light/dark mode, infinite scroll

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │
└─────────────┘     └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Frontend │ │ Backend  │ │Socket.IO │
        │  (React) │ │(Express) │ │          │
        └──────────┘ └────┬─────┘ └──────────┘
                            │
                    ┌───────┴───────┐
                    ▼               ▼
              ┌──────────┐   ┌──────────┐
              │PostgreSQL│   │  Redis   │
              └──────────┘   └──────────┘
```

All services run on a **single EC2 instance** via Docker Compose. PostgreSQL and Redis are containerized (no AWS RDS).

## Project Structure

```
localconnect-maharashtra/
├── backend/                 # Express + TypeScript API
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── config/          # App config, Swagger
│   │   ├── middleware/      # Auth, validation, errors
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.IO handlers
│   │   └── lib/             # Prisma, Redis, JWT
│   └── Dockerfile
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand state
│   │   └── lib/             # API client, utils
│   └── Dockerfile
├── nginx/                   # Reverse proxy config
├── .github/workflows/       # CI/CD pipeline
├── docker-compose.yml       # Local/dev deployment
├── docker-compose.prod.yml  # Production deployment
└── docs/                    # Additional documentation
```

## Quick Start (Docker)

```bash
cd localconnect-maharashtra
cp .env.example .env
# Edit JWT secrets in .env

docker compose up -d --build
```

Open **http://localhost** (port 80 via Nginx).

API docs: **http://localhost/api/docs**

### Demo Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@localconnect.in | Password123! | Admin |
| moderator@localconnect.in | Password123! | Moderator |
| rajesh@example.com | Password123! | User (Pune/Wakad) |
| priya@example.com | Password123! | User (Mumbai/Powai) |
| amit@example.com | Password123! | User (Nagpur) |

## Local Development (without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

API runs at http://localhost:4000

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at http://localhost:5173 (proxies `/api` to backend)

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Locations | `/api/locations` |
| Posts | `/api/posts` |
| Messages | `/api/messages` |
| Marketplace | `/api/marketplace` |
| Notifications | `/api/notifications` |
| Admin | `/api/admin` |
| Search | `/api/search` |

Full OpenAPI documentation: `/api/docs`

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default 4000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `FRONTEND_URL` | CORS origin |
| `USE_LOCAL_STORAGE` | Use local uploads vs S3 |
| `GOOGLE_CLIENT_ID` | Google OAuth (optional) |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (default `/api`) |

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for AWS EC2 setup, SSL, and CI/CD configuration.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

1. Lint and run tests
2. Build Docker images
3. Push to Docker Hub
4. SSH to EC2 and deploy with `docker compose`

Required secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

## License

MIT
