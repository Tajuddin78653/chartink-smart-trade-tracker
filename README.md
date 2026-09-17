# 📈 Chartink Smart Trade Tracker

> N8N-powered automated trading signal monitoring platform — Real-time P&L, Target/SL/Trailing tracking, Live Dashboard

[![GitHub](https://img.shields.io/badge/GitHub-Tajuddin78653-black)](https://github.com/Tajuddin78653/chartink-smart-trade-tracker)

---

## 🎯 What It Does

Every Chartink scanner alert automatically becomes a tracked trade:
- ✅ **0.5% Target** tracking with trailing
- ✅ **1.5% Stop Loss** management  
- ✅ **0.5% Trailing Target** system
- ✅ **Real-time P&L** via live broker prices
- ✅ **Live Dashboard** with WebSocket updates
- ✅ **Telegram/WhatsApp** notifications
- ✅ **N8N** workflow automation engine
- ✅ **Docker** ready deployment

---

## 🏗️ Architecture

```
Chartink → N8N Webhook → PostgreSQL
                ↓
         Trade Engine (SL/Target/Trailing)
                ↓
         Price Monitor (Dhan/Upstox/Zerodha)
                ↓
         Socket.IO → Next.js Dashboard
                ↓
         Telegram/WhatsApp Notifications
```

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- Chartink account with scanner alerts
- Broker API token (Dhan/Upstox/Zerodha)
- Telegram Bot token (optional)

### 1. Clone & Configure
```bash
git clone https://github.com/Tajuddin78653/chartink-smart-trade-tracker.git
cd chartink-smart-trade-tracker
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Everything
```bash
docker compose up -d
```

This starts:
| Service | URL |
|---|---|
| **Frontend Dashboard** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **N8N Workflows** | http://localhost:5678 |
| **PostgreSQL** | localhost:5432 |
| **Redis** | localhost:6379 |

### 3. Configure Chartink Webhook
Set your Chartink scanner alert webhook URL to:
```
http://your-server:4000/api/webhook/chartink
```

Payload format:
```json
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "ltp": 2950,
  "signal": "BUY",
  "scan_name": "Bullish Breakout",
  "alert_time": "2026-09-17 10:15:00"
}
```

---

## 📊 Trading Rules

| Parameter | Default | Description |
|---|---|---|
| Target | **0.5%** | First target above entry |
| Stop Loss | **1.5%** | Fixed SL below entry |
| Trailing | **0.5%** | Each trailing step |

### Trailing Example
```
Entry = ₹100
Target 1 = ₹100.5 (hit) → SL moves to ₹100
Target 2 = ₹101.0 (hit) → SL moves to ₹100.5
Target 3 = ₹101.5 (hit) → SL moves to ₹101.0
... continues until SL hit
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js |
| Workflow | N8N (6 automated workflows) |
| Database | PostgreSQL |
| Cache | Redis |
| Realtime | Socket.IO |
| Deploy | Docker + Nginx |

---

## 📁 Project Structure

```
chartink-smart-trade-tracker/
├── docker-compose.yml
├── .env.example
├── database/
│   └── init.sql              ← All DB tables
├── backend/
│   └── src/
│       ├── index.js           ← Express + Socket.IO
│       ├── routes/            ← webhook, trades, auth, settings
│       ├── services/
│       │   ├── tradeEngine.js ← Core SL/Target/Trailing logic
│       │   ├── priceMonitor.js← Live price polling
│       │   └── notificationService.js
│       └── db/                ← postgres + redis
├── frontend/
│   └── src/
│       ├── app/               ← Next.js pages
│       └── components/        ← Dashboard UI components
├── n8n/workflows/             ← N8N workflow JSON exports
└── nginx/nginx.conf           ← Reverse proxy config
```

---

## 🔔 N8N Workflows

| # | Workflow | Trigger |
|---|---|---|
| 1 | Alert Receiver | Chartink webhook |
| 2 | Position Creator | New alert in DB |
| 3 | Price Monitor | Every 5 seconds |
| 4 | Trailing Engine | Target hit event |
| 5 | Notification Engine | Trade events |
| 6 | Daily Report | 3:35 PM IST |

---

## 🔒 Security
- JWT Authentication
- Role-Based Access (admin/user/viewer)
- Rate limiting on all endpoints
- Helmet.js headers
- Input validation (Joi)

---

*Built with ❤️ by Taz — Powered by IBM Bob*
