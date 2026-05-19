#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seed skipped or already done"

echo "Starting API server..."
exec node dist/index.js
