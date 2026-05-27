# Distributed tracing with Jaeger (separate VM)

Send **API traces** from your **application VM** to **Jaeger** on a **central tracing VM**.

```
┌─────────────────────────┐         ┌────────────────────────────┐
│  APPLICATION VM         │  OTLP   │  CENTRAL TRACING VM          │
│  LocalConnect backend   │ ──────► │  Jaeger (port 4318)           │
│  auto-instruments:      │  HTTP   │         ↓                    │
│  Express, HTTP, Redis   │         │  Jaeger UI :16686            │
└─────────────────────────┘         └────────────────────────────┘
```

---

## Part 1 — Jaeger VM (central server)

### 1. Copy file to Jaeger VM

`monitoring/docker-compose.jaeger-central.yml`

### 2. Start Jaeger

```bash
docker compose -f docker-compose.jaeger-central.yml up -d
docker ps
```

### 3. Open Jaeger UI

`http://JAEGER_VM_IP:16686`

### 4. Azure NSG (Jaeger VM)

| Port | Who can access |
|------|----------------|
| **4318** | Application VM IP only (OTLP traces) |
| **16686** | Your IP only (UI — do not open to `0.0.0.0/0`) |
| **4317** | Optional gRPC — same as 4318 |

---

## Part 2 — Application VM (LocalConnect)

### 1. Add to `.env`

```env
# Jaeger central VM — OTLP HTTP (no /v1/traces suffix needed)
OTEL_EXPORTER_OTLP_ENDPOINT=http://20.198.104.118:4318
OTEL_SERVICE_NAME=localconnect-backend
OTEL_TRACES_ENABLED=true
```

Replace `20.198.104.118` with your **Jaeger VM public IP**.

### 2. Rebuild backend

```bash
cd ~/local-app/localconnect-maharashtra
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build backend
```

### 3. Verify tracing started

```bash
docker logs localconnect-backend 2>&1 | grep tracing
```

Expected:

```
[tracing] Exporting traces to http://20.198.104.118:4318 (service: localconnect-backend)
```

### 4. Test connectivity from app VM

```bash
nc -zv 20.198.104.118 4318
```

### 5. Generate traffic

Use the app: login, register, create post, search.

---

## Part 3 — View traces in Jaeger UI

1. Open `http://JAEGER_VM_IP:16686`
2. **Service** → `localconnect-backend`
3. Click **Find Traces**

### What you see (for future debugging)

| Trace span | Helps you find |
|------------|----------------|
| `GET /api/posts` | Slow feed, errors |
| `POST /api/auth/register` | Signup failures |
| `POST /api/posts` | Post creation issues |
| Redis spans | Cache problems |
| Long DB time | Need DB indexes / query fix |

### Useful Jaeger features

- **Sort by Duration** — slowest requests first
- **Tags** — filter `http.status_code=500`
- **Trace timeline** — see which step is slow (DB vs Redis vs code)

---

## What is instrumented automatically

- All **Express** HTTP routes (`/api/*`)
- Outgoing **HTTP** calls
- **Redis** (ioredis)
- **DNS**

No code change needed for basic API tracing.

### Optional manual spans (business events)

```typescript
import { withSpan } from '../lib/trace';

await withSpan('user.register', async (span) => {
  span.setAttribute('location.city', 'Pune');
  // ... create user
});
```

---

## Disable tracing

```env
OTEL_TRACES_ENABLED=false
```

Or remove `OTEL_EXPORTER_OTLP_ENDPOINT`.

---

## Together with Grafana + logs

| Tool | VM | Purpose |
|------|-----|---------|
| **Grafana** | App VM :3000 | Users/posts counts, metrics |
| **Jaeger** | Central VM :16686 | Request traces, slowness |
| **Kibana** | Central ELK VM | Raw log lines |

Use **metrics** for totals, **traces** for slow/failed requests, **logs** for exact error messages.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No traces in Jaeger | Check `OTEL_EXPORTER_OTLP_ENDPOINT`, NSG port 4318 |
| `[tracing] Disabled` in logs | Set `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env` and rebuild |
| UI not loading | Open 16686 only from your IP |
| Too many traces | Add sampler later: `OTEL_TRACES_SAMPLER=parentbased_traceidratio` |
