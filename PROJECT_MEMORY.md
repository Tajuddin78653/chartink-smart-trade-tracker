# 📌 DHAN PAPER TRADING — Project Memory
> Saved for Taz Superagent — Last updated: 2026-09-20
> Project codename: **Chartink Smart Trade Tracker**

---

## 🎯 Project Purpose
Automated paper trading system that:
- Receives Chartink scanner BUY alerts via webhook
- Tracks virtual trades with SL/Target logic
- Shows real-time dashboard
- Sends Telegram notifications
- Runs 100% automated, zero manual intervention
- **Currently: Paper Mode** (no real Dhan orders yet)
- **Next step: Live Mode** (wire up Dhan API for real orders)

---

## 🔑 Critical Credentials & IDs (Taz Eyes Only)

### Render
- **API Key:** `rnd_SVkassNcOyD6dii1QGJSqGd2La8D`
- **Owner ID:** `tea-d9mbinh42hec73bm4i3g`

### Services
| Service | Render ID | URL |
|---|---|---|
| chartink-backend | `srv-dam33cgu01pc73ba7m30` | https://chartink-backend.onrender.com |
| chartink-frontend | `srv-dam33d8u01pc73ba7ot0` | https://chartink-frontend.onrender.com |
| chartink-n8n | `srv-dam3lddbedkc73ai9fag` | https://chartink-n8n.onrender.com |
| dhan-bot | `srv-damo914ri2ms73b6rqi0` | https://dhan-bot-chcx.onrender.com |

### Database
- **PostgreSQL ID:** `dpg-dam32mou01pc73ba54t0-a`
- **Connection:** `postgresql://cstt_user:f9pngTKvKjyEXBhYTCJ8Nd4SRdn8LSJ3@dpg-dam32mou01pc73ba54t0-a.singapore-postgres.render.com/chartink_tracker`
- **N8N Schema:** `n8n2` (separate from app schema `public`)

### Redis (Upstash)
- **Host:** `concrete-bream-97276.upstash.io:6379`
- **URL:** `rediss://default:gQAAAAAAAXv8AAIgcDJmMzUxNzU2MGQwYjc0OTllOWZkMDkyYTg1Y2ViM2ZhNA@concrete-bream-97276.upstash.io:6379`

### Telegram
- **Bot:** `@chartink_dhan_bot` | Token: `8854697201:AAGSOC9sX51Ge4fK4Fae_PWEBQOTzLNT708`
- **Taz Chat ID:** `527293574`

### N8N
- **URL:** https://chartink-n8n.onrender.com
- **Login:** admin / `Uj6M3OppZxrXSDACcSXSede1PhMt6EqxWF/PrUDzo9E=`
- **API Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1OWFmY2MxYS0wYzllLTQwYTgtYThjMS0wZDU0N2RmNzFjMjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMTcxMzUyMzYtZmExZi00YmY1LTk3YTAtZDU1ODgwOTdkZTBkIiwiaWF0IjoxNzg5ODkyNTQ2LCJleHAiOjE3OTI0Njg4MDB9.F0xDhHhXoD_ixxeX1iG044Z_20Dfm7Kwm80P599rg1I`

### Workflow IDs
| Workflow | N8N ID |
|---|---|
| WF1 - Alert Receiver | `vyXAZre4cvxNQb1U` |
| WF2 - Position Creator | `ccUKthNnpxFzR90W` |
| WF3 - Price Monitor | `YGLR8wNLsJvI3vO7` |
| WF4 - Trailing Engine | `0tRy0mGnpnfL6rWM` |
| WF5 - Notification Engine | `i3YxzZLKSEl7MtVv` |
| WF6 - Daily Report | `qAkAsMefjhBB4Gkg` |

### Security
- **WEBHOOK_API_KEY:** `4d85595d38e6f15a9e81268c2691be7c6d7aff56c06d8c69e1002e3d0b0a3292`
- **JWT_SECRET:** `UjoBioHeEoj/3cVIyEQwbhVjV0UcZlQvfv+JVBpxJpY=`
- **N8N_ENCRYPTION_KEY:** `dOmUBVDqEvVQruVm5Cf1XI3O0OQti2YIs1kH5DltqPM=`
- **N8N_RUNNERS_AUTH_TOKEN:** `33BEA65771C50419FDDF5DC4A42D93C1F9F30701FF31BE4261282EDCB8F19109`

---

## 📐 Current Trading Rules
| Rule | Value |
|---|---|
| Target | +1.0% above entry price |
| Stop Loss | -1.0% below entry price |
| Target Hit | AUTO EXIT immediately |
| SL Hit | AUTO EXIT immediately |
| Trailing | DISABLED (clean auto-exit) |
| Market Hours | 09:15 – 15:30 IST |
| Price Check | Every 5 seconds (N8N WF3) |
| Mode | PAPER (no real Dhan orders) |

---

## 🏗️ Tech Stack

### Backend (`/backend`)
- **Runtime:** Node.js 24 + Express 4
- **Key files:**
  - `src/index.js` — Express server + Socket.IO
  - `src/routes/webhook.js` — POST /api/webhook/chartink
  - `src/routes/trades.js` — GET /api/trades/active
  - `src/routes/analytics.js` — GET /api/analytics/summary
  - `src/services/tradeEngine.js` — SL/Target/Auto-exit logic
  - `src/services/priceMonitor.js` — Live price polling
  - `src/services/notificationService.js` — Telegram alerts
  - `src/db/postgres.js` — PostgreSQL connection
  - `src/db/redis.js` — Upstash Redis (optional cache)

### Frontend (`/frontend`)
- **Runtime:** Next.js 15 + TypeScript + Tailwind CSS
- **Pages:** Dashboard, Active Trades, History, Analytics, Admin
- **Real-time:** Socket.IO client
- **Key files:**
  - `src/app/page.tsx` — Main dashboard
  - `src/components/TradeCard.tsx` — Trade cards with EXIT button
  - `next.config.js` — API URL config

### N8N (`/n8n`)
- **Image:** `docker.io/n8nio/n8n:latest`
- **DB:** PostgreSQL schema `n8n2` (within chartink_tracker DB)
- **6 Workflows:** Alert → Position → Price → Trailing → Notify → Report

### Database (PostgreSQL)
- **7 Tables:** users, settings, alerts, trades, trade_events, live_prices, notifications, audit_logs

---

## 🚦 Morning Startup Commands (via Taz Superagent)

Just say **"start"** — I will run:
1. Resume N8N service → `POST /api/render.com/v1/services/srv-dam3lddbedkc73ai9fag/resume`
2. Resume dhan-bot → `POST /api/render.com/v1/services/srv-damo914ri2ms73b6rqi0/resume`
3. Activate 6 N8N workflows via API key
4. Health check all services
5. Send "System Ready" Telegram message

---

## ⏳ Pending Tasks
- [ ] Set Chartink webhook URL: `https://chartink-n8n.onrender.com/webhook/chartink-alert`
- [ ] Get Dhan Access Token → wire up real order placement
- [ ] Run paper mode 1-2 days → verify signal quality
- [ ] Go LIVE with real Dhan orders

---

## 🔧 Common Fix Commands (Taz Superagent can run these)

### Redeploy backend
```
POST https://api.render.com/v1/services/srv-dam33cgu01pc73ba7m30/deploys
```

### Redeploy frontend
```
POST https://api.render.com/v1/services/srv-dam33d8u01pc73ba7ot0/deploys
```

### Activate all N8N workflows
```
POST https://chartink-n8n.onrender.com/api/v1/workflows/{id}/activate
IDs: vyXAZre4cvxNQb1U, ccUKthNnpxFzR90W, YGLR8wNLsJvI3vO7, 0tRy0mGnpnfL6rWM, i3YxzZLKSEl7MtVv, qAkAsMefjhBB4Gkg
```

### Test webhook
```
POST https://chartink-backend.onrender.com/api/webhook/chartink
Header: x-api-key: 4d85595d38e6f15a9e81268c2691be7c6d7aff56c06d8c69e1002e3d0b0a3292
Body: {"symbol":"RELIANCE","exchange":"NSE","ltp":2845,"signal":"BUY","scan_name":"Test"}
```

---

## 📝 Change Log
| Date | Change |
|---|---|
| 2026-09-17 | Project scaffolded — backend, frontend, N8N, Docker |
| 2026-09-18 | Deployed to Render.com — 4 services |
| 2026-09-19 | Fixed 502, env vars set, Telegram connected |
| 2026-09-19 | Trading rules updated: Target=1%, SL=1%, Auto-exit |
| 2026-09-19 | N8N fixed (PostgreSQL schema, memory limits) |
| 2026-09-20 | All 6 workflows imported + activated |
| 2026-09-20 | Full system test passed — all layers verified |
| 2026-09-20 | System parked overnight — workflows paused |
