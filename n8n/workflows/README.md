# N8N Workflows — Chartink Smart Trade Tracker

Import these JSON files into N8N to activate all 6 automated workflows.

## How to Import

1. Open N8N at `http://localhost:5678`
2. Go to **Workflows → New → Import from file**
3. Select each JSON file and import
4. Configure credentials (PostgreSQL + Telegram)
5. Activate each workflow

---

## Workflow Overview

| File | Workflow | Trigger | Purpose |
|---|---|---|---|
| `wf1-alert-receiver.json` | **Alert Receiver** | Chartink Webhook POST | Receives + validates Chartink alerts |
| `wf2-position-creator.json` | **Position Creator** | Every 10s | Creates trade from unprocessed alerts |
| `wf3-price-monitor.json` | **Price Monitor** | Every 5s | Fetches LTP, checks SL/Target |
| `wf4-trailing-engine.json` | **Trailing Engine** | Every 5s | Manages trailing SL movement |
| `wf5-notification-engine.json` | **Notification Engine** | Every 15s | Sends Telegram/WhatsApp alerts |
| `wf6-daily-report.json` | **Daily Report** | 3:35 PM IST (weekdays) | Sends EOD performance report |

---

## Required Credentials in N8N

### 1. PostgreSQL (`postgres-creds`)
- Host: `postgres`
- Port: `5432`
- Database: `chartink_tracker`
- User: `cstt_user`
- Password: from `.env`

### 2. Telegram Bot (`telegram-creds`)
- Bot Token: from `.env` → `TELEGRAM_BOT_TOKEN`
- Chat ID: set as N8N variable `TELEGRAM_CHAT_ID`

---

## Workflow Flow Diagram

```
Chartink Scanner
      │ POST
      ▼
 WF1: Alert Receiver ──→ DB (alerts table)
      │
      ▼ (every 10s)
 WF2: Position Creator ──→ DB (trades table)
      │
      ├──→ WF3: Price Monitor (every 5s)
      │         │ SL Hit → Close trade
      │         │ Target Hit → Move SL
      │
      ├──→ WF4: Trailing Engine (every 5s)
      │         │ Updates trailing SL state
      │
      ├──→ WF5: Notification Engine (every 15s)
      │         │ Telegram / WhatsApp
      │
      └──→ WF6: Daily Report (3:35 PM IST)
                │ EOD summary to Telegram
```
