#!/bin/bash
# ============================================================
# Chartink Smart Trade Tracker — Production Deploy Script
# Ubuntu Server
# Usage: chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║   Chartink Smart Trade Tracker — Deploy          ║"
echo "╚══════════════════════════════════════════════════╝"

# ── 1. Check .env exists ─────────────────────────────────
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi
echo "✅ .env found"

# ── 2. Check Docker ───────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
fi
echo "✅ Docker ready: $(docker --version)"

# ── 3. Create required directories ───────────────────────
mkdir -p nginx/ssl backend/logs
echo "✅ Directories created"

# ── 4. Pull latest code ───────────────────────────────────
if [ -d ".git" ]; then
  echo "📥 Pulling latest from GitHub..."
  git pull origin main
fi

# ── 5. Build & start containers ──────────────────────────
echo "🐳 Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# ── 6. Wait for health ───────────────────────────────────
echo "⏳ Waiting for services to be healthy..."
sleep 15

# ── 7. Verify ────────────────────────────────────────────
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🏥 Health Check:"
curl -s http://localhost:4000/api/health || echo "Backend not responding yet"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Deployment Complete!                         ║"
echo "║                                                  ║"
echo "║  Frontend:  http://localhost:3000                ║"
echo "║  Backend:   http://localhost:4000                ║"
echo "║  N8N:       http://localhost:5678                ║"
echo "║                                                  ║"
echo "║  Webhook URL for Chartink:                       ║"
echo "║  http://YOUR_SERVER_IP/api/webhook/chartink      ║"
echo "╚══════════════════════════════════════════════════╝"
