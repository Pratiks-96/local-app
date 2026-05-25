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

#### Community dashboard (users & posts by place)

After deploy, open: **Dashboards → LocalConnect → LocalConnect — Users & Posts by Place**

| Panel | What it shows |
|-------|----------------|
| Total registered users | All active accounts |
| Total active posts | All posts in feed |
| Users by place | Bar chart — sorted by count (city / area / society) |
| Posts by place | Bar chart — per society |
| Table | Users & posts per society — **click column headers to sort** |
| Dropdowns **City** / **Area** | Filter charts to one region |

Metrics refresh every **15s** when Prometheus scrapes `/metrics`.

---

## Deploy dashboard updates on VM

```bash
cd ~/local-app/localconnect-maharashtra
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build backend
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml restart grafana prometheus
```

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
localconnect_users_total
localconnect_posts_total
localconnect_users_by_location{city, area, society}
localconnect_posts_by_location{city, area, society}
localconnect_user_registrations_total
localconnect_posts_created_total
localconnect_http_requests_total
localconnect_db_up
localconnect_redis_up
```

Example — users in Pune:

```promql
sum(localconnect_users_by_location{city="Pune"})
```

Example — top societies by posts:

```promql
topk(10, localconnect_posts_by_location)
```

Query in Prometheus: **http://20.192.29.50:9090/graph**
