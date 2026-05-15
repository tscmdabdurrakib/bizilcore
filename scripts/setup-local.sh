#!/bin/bash
# ============================================================
# BizilCore Local Setup Script
# Run this once when you clone the project locally:
#   chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh
# ============================================================

echo "=== BizilCore Local Setup ==="

# 1. Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Created .env from .env.example"
  echo "  → Now fill in your values in .env file"
else
  echo "✓ .env already exists — skipping copy"
fi

# 2. Install dependencies
echo "Installing npm packages..."
npm install --legacy-peer-deps
echo "✓ Packages installed"

# 3. Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"

# 4. Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy
echo "✓ Database migrations applied"

echo ""
echo "=== Setup Complete ==="
echo "Run: npm run dev"
echo ""
echo "IMPORTANT: Make sure your .env file has DATABASE_URL set!"
