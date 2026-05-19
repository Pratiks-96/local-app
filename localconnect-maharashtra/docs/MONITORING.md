# Prometheus & Grafana — Azure VM `20.192.29.50`

## Metrics URLs (public)

| Service | Scrape URL | UI URL |
|---------|------------|--------|
| **App (API)** | `http://20.192.29.50:8080/metrics` | — |
| **Health (JSON)** | — | `http://20.192.29.50:8080/api/health` |
| **PostgreSQL** | `http://20.192.29.50:9187/metrics` | — |
| **Redis** | `http://20.192.29.50:9121/metrics` | — |
| **Prometheus** | `http://20.192.29.50:9090/metrics` | `http://20.192.29.50:9090` |
| **Grafana** | — | `http://20.192.29.50:3000` |
| **LocalConnect App** | — | `http://20.192.29.50:8080` |

---

## Azure Network Security Group — open these ports

| Port | Service |
|------|---------|
| 8080 | App (Nginx) + `/metrics` |
| 9090 | Prometheus |
| 3000 | Grafana |
| 9187 | PostgreSQL exporter |
| 9121 | Redis exporter |
| 22 | SSH |

---

## Start app + monitoring on VM

```bash
cd ~/local-app/localconnect-maharashtra
cp .env.azure .env
nano .env   # set JWT_SECRET, JWT_REFRESH_SECRET, GRAFANA_PASSWORD

docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build
```

---

## Verify metrics

```bash
# App metrics via Nginx
curl -s http://20.192.29.50:8080/metrics | head -15

# Postgres exporter
curl -s http://20.192.29.50:9187/metrics | head -5

# Redis exporter
curl -s http://20.192.29.50:9121/metrics | head -5
```

### Prometheus targets

Open: **http://20.192.29.50:9090/targets**

All jobs should show **UP**.

### Grafana

Open: **http://20.192.29.50:3000**  
Login: `admin` / password from `.env` (`GRAFANA_PASSWORD`)

---

## Connect YOUR existing Prometheus server

If Prometheus runs on **another machine**, add the scrape jobs from:

`monitoring/prometheus-external-scrape.yml`

Example:

```yaml
scrape_configs:
  - job_name: 'localconnect-app'
    metrics_path: /metrics
    static_configs:
      - targets: ['20.192.29.50:8080']
```

Reload your Prometheus: `curl -X POST http://localhost:9090/-/reload`

---

## Internal vs public scraping

| Prometheus location | Config file | Targets |
|--------------------|-------------|---------|
| Same VM (Docker) | `monitoring/prometheus.yml` | `backend:4000`, `postgres-exporter:9187`, … |
| Different server | `monitoring/prometheus-external-scrape.yml` | `20.192.29.50:8080`, `20.192.29.50:9187`, … |

---

## Key metrics

```
localconnect_http_requests_total
localconnect_http_request_duration_seconds
localconnect_active_users
localconnect_posts_total
localconnect_db_up
localconnect_redis_up
```

Query in Prometheus: **http://20.192.29.50:9090/graph**
