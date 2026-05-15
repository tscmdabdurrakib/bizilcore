#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy || echo "⚠ Migration warning (may need manual check)"

echo "=== Post-merge setup complete ==="
