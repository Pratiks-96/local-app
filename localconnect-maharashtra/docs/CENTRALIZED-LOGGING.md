# Centralized logging: Application VM → ELK VM

Send **LocalConnect Docker logs** from your **application machine** to **Logstash** on your **central logging machine**.

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│  APPLICATION VM         │         │  CENTRAL LOGGING VM          │
│  (LocalConnect Docker)  │         │  20.198.104.118              │
│                         │         │                              │
│  backend, frontend,     │ 5044   │  Logstash → Elasticsearch    │
│  nginx, postgres...     │ ──────► │           ↓                  │
│         ↑               │  Beats  │         Kibana (5601)        │
│     Filebeat            │         │  View logs in Discover        │
└─────────────────────────┘         └──────────────────────────────┘
```

## IPs (update if yours differ)

| Machine | Example IP | Role |
|---------|------------|------|
| Application | `20.192.29.50` | LocalConnect + Filebeat |
| Central ELK | `20.198.104.118` | Logstash, Elasticsearch, Kibana |

---

## Part 1 — Central logging VM (`20.198.104.118`)

### 1. Logstash must listen on port 5044

Copy `logging/logstash-central/10-localconnect-beats.conf` to your Logstash pipeline folder, then restart Logstash.

**Docker Logstash example:**

```bash
# On central VM — adjust path to your logstash config volume
sudo cp 10-localconnect-beats.conf /path/to/logstash/pipeline/
docker restart logstash
```

**Test Logstash is listening:**

```bash
sudo ss -tlnp | grep 5044
```

### 2. Azure firewall (NSG) on central VM

Allow **only** the application server IP to port **5044**:

| Priority | Port | Source | Action |
|----------|------|--------|--------|
| ... | 5044 | `20.192.29.50/32` (app VM) | Allow |
| ... | 5044 | Any | **Deny** |

Do **not** open 9200 (Elasticsearch) to the internet.

### 3. Kibana index pattern

1. Open `http://20.198.104.118:5601`
2. **Stack Management** → **Index Patterns** → **Create**
3. Name: `localconnect-*`
4. Time field: `@timestamp`
5. **Discover** → select `localconnect-*` → filter by `container_name` e.g. `localconnect-backend`

---

## Part 2 — Application VM (where Docker runs)

### 1. Add to `.env`

```env
LOGSTASH_HOST=20.198.104.118
LOGSTASH_PORT=5044
```

### 2. Start Filebeat (ships all Docker container logs)

```bash
cd ~/local-app/localconnect-maharashtra

docker compose -f docker-compose.yml -f docker-compose.logging.yml up -d filebeat
```

### 3. Verify Filebeat

```bash
docker logs localconnect-filebeat --tail 30
```

You should see `Connection to logstash established` or similar.

### 4. Test from central VM

```bash
curl -s "http://127.0.0.1:9200/localconnect-*/_search?size=5&pretty" \
  -H 'Content-Type: application/json' \
  -d '{"sort":[{"@timestamp":"desc"}]}'
```

---

## What logs you will see

| Field / filter | Shows |
|----------------|--------|
| `container_name: localconnect-backend` | API logs |
| `container_name: localconnect-nginx` | HTTP access / errors |
| `container_name: localconnect-postgres` | DB logs |
| `container_name: localconnect-frontend` | Nginx static server |

In Kibana Discover, search examples:

```
container_name: "localconnect-backend" AND message: *error*
container_name: "localconnect-nginx" AND message: *502*
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No logs in Kibana | Check Filebeat on app VM: `docker logs localconnect-filebeat` |
| Connection refused | Logstash not on 5044; NSG blocking app → central |
| Filebeat permission error | Filebeat runs as `root` in compose (needed for Docker logs) |
| Wrong index | Confirm Logstash output index `localconnect-%{+YYYY.MM.dd}` |

**From app VM test port:**

```bash
nc -zv 20.198.104.118 5044
```

---

## Security (recommended)

1. Restrict NSG: only app VM IP → 5044.
2. Enable Elasticsearch/Kibana passwords; do not expose 9200 publicly.
3. Later: enable Beats SSL between Filebeat and Logstash.

---

## Stop shipping logs

```bash
docker compose -f docker-compose.yml -f docker-compose.logging.yml stop filebeat
```
