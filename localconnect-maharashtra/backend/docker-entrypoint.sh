#!/bin/sh
set -e

echo "Setting up database..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if npx prisma db push --accept-data-loss; then
    echo "Database ready."
    break
  fi
  echo "  Waiting for Postgres (attempt $i/10)..."
  sleep 3
done

echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seed skipped (may already exist)"

echo "Starting API server..."
exec node dist/index.js
