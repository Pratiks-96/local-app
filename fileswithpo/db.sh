#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  db.sh — PostgreSQL Container Manager
#
#  Usage:
#    ./scripts/db.sh start      → start only postgres container
#    ./scripts/db.sh stop       → stop postgres container
#    ./scripts/db.sh status     → show container + volume info
#    ./scripts/db.sh connect    → open psql shell inside container
#    ./scripts/db.sh backup     → dump database to file
#    ./scripts/db.sh restore    → restore from backup file
#    ./scripts/db.sh reset      → DANGER: delete all data and restart
#    ./scripts/db.sh logs       → show postgres logs
# ═══════════════════════════════════════════════════════════════

DB_CONTAINER="localconnect-db"
DB_USER="localconnect"
DB_NAME="localconnect"
DB_PASSWORD="localconnect123"
BACKUP_DIR="./backups"

case "$1" in

  # ── Start postgres only ──────────────────────────────────────
  start)
    echo ">>> Starting PostgreSQL container..."
    docker-compose up -d postgres
    echo ">>> Waiting for postgres to be ready..."
    until docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME; do
      sleep 2
    done
    echo "✅ PostgreSQL is ready!"
    echo "   Host:     localhost:5432"
    echo "   Database: $DB_NAME"
    echo "   User:     $DB_USER"
    echo "   Password: $DB_PASSWORD"
    ;;

  # ── Stop postgres ────────────────────────────────────────────
  stop)
    echo ">>> Stopping PostgreSQL container..."
    docker-compose stop postgres
    echo "✅ PostgreSQL stopped (data is safe in volume)"
    ;;

  # ── Show status ──────────────────────────────────────────────
  status)
    echo "============================================"
    echo "  PostgreSQL Container Status"
    echo "============================================"
    echo ""
    echo ">>> Container:"
    docker ps --filter "name=$DB_CONTAINER" \
      --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo ">>> Volume:"
    docker volume inspect localconnect_postgres_data \
      --format "Name: {{.Name}}
Driver: {{.Driver}}
Mountpoint: {{.Mountpoint}}
Created: {{.CreatedAt}}"
    echo ""
    echo ">>> Database size:"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c \
      "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) AS size;" 2>/dev/null || \
      echo "Container not running"
    echo ""
    echo ">>> Tables:"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c \
      "\dt" 2>/dev/null || echo "Container not running"
    ;;

  # ── Open psql shell ──────────────────────────────────────────
  connect)
    echo ">>> Connecting to PostgreSQL..."
    echo "    Type \\q to exit"
    docker exec -it $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
    ;;

  # ── Backup database ──────────────────────────────────────────
  backup)
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    echo ">>> Backing up database to $BACKUP_FILE..."
    docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
    echo "✅ Backup saved: $BACKUP_FILE"
    ls -lh $BACKUP_FILE
    ;;

  # ── Restore from backup ──────────────────────────────────────
  restore)
    if [ -z "$2" ]; then
      echo "Usage: ./scripts/db.sh restore <backup_file>"
      echo "Available backups:"
      ls -lh $BACKUP_DIR/*.sql 2>/dev/null || echo "No backups found"
      exit 1
    fi
    echo ">>> Restoring from $2..."
    docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $2
    echo "✅ Database restored from $2"
    ;;

  # ── DANGER: Reset all data ───────────────────────────────────
  reset)
    echo "⚠️  WARNING: This will DELETE ALL DATA!"
    read -p "Type 'yes' to confirm: " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      echo ">>> Stopping containers..."
      docker-compose down
      echo ">>> Deleting postgres volume..."
      docker volume rm localconnect_postgres_data 2>/dev/null || true
      echo ">>> Restarting with fresh database..."
      docker-compose up -d postgres
      echo "✅ Database reset complete — fresh start!"
    else
      echo "❌ Cancelled"
    fi
    ;;

  # ── Show logs ────────────────────────────────────────────────
  logs)
    docker logs $DB_CONTAINER -f --tail=50
    ;;

  # ── Show row counts ──────────────────────────────────────────
  rows)
    echo ">>> Row counts per table:"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
      SELECT
        schemaname,
        relname AS table_name,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    "
    ;;

  *)
    echo "Usage: ./scripts/db.sh {start|stop|status|connect|backup|restore|reset|logs|rows}"
    exit 1
    ;;
esac
