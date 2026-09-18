# Dhan Chartink Auto Trader

Automatically executes INTRADAY BUY orders on your **Dhan** account when **Chartink** scanner alerts arrive on **Telegram**.

## Features
- ✅ Receives Chartink alerts via Telegram (no public URL needed)
- ✅ Only trades during market hours (9:15 AM – 3:20 PM IST, Mon–Fri)
- ✅ One position at a time — ignores new signals until current trade exits
- ✅ Uses 100% available funds for each trade
- ✅ Auto-exit at **+1% profit** (target) or **-1% loss** (stop loss)
- ✅ Capital auto-freed after exit — ready for next signal
- ✅ Full trade logging to `trades.log`

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/dhan-chartink-trader.git
cd dhan-chartink-trader
pip install -r requirements.txt
```

### 2. Configure Credentials
```bash
cp .env.example .env
# Edit .env and fill in all values
```

### 3. Get Dhan API Credentials
1. Login to [dhan.co](https://dhan.co)
2. Go to **Profile → DhanHQ Trading APIs**
3. Click **Generate Access Token**
4. Copy your **Client ID** and **Access Token** into `.env`

> ⚠️ Access tokens expire — regenerate when needed

### 4. Create Telegram Bot
1. Open Telegram → search **@BotFather**
2. Send `/newbot` → follow prompts → copy the **bot token** into `.env`
3. Create a **private Telegram channel**
4. Add your bot as **Admin** to the channel
5. Get your channel ID (see below)

#### How to get your Telegram Channel ID
1. Forward any message from your channel to [@userinfobot](https://t.me/userinfobot)
2. It will show the channel ID (starts with `-100...`)
3. Copy that into `.env` as `TELEGRAM_CHANNEL_ID`

### 5. Set Up Chartink Alerts
1. Go to your scanner on [chartink.com](https://chartink.com)
2. Click **Create Alert**
3. Under **Notification**, select **Telegram**
4. Connect Chartink to your Telegram account
5. Set message format to just the stock name: `{{security_name}}`

### 6. Run Locally
```bash
python main.py
```

---

## Deploy to Render.com (Free, Always-On)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dhan-chartink-trader.git
git push -u origin main
```

### Step 2: Create Render Background Worker
1. Go to [render.com](https://render.com) → **New → Background Worker**
2. Connect your GitHub repo
3. Set:
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
4. Under **Environment Variables**, add all values from `.env`
5. Click **Deploy**

> The service runs 24/7 for free. Signals outside market hours are automatically ignored.

---

## Project Structure
```
dhan-chartink-trader/
├── main.py                  # Entry point
├── config.py                # Settings from .env
├── scheduler.py             # Market hours check
├── telegram_listener.py     # Telegram polling + signal handling
├── signal_parser.py         # Parses stock symbol from message
├── instrument_master.py     # Dhan symbol → security_id lookup
├── dhan_trader.py           # Dhan API: funds, LTP, buy, sell
├── order_monitor.py         # Background thread: watches target/SL
├── capital_manager.py       # Tracks single open position
├── logger.py                # Logs to console + trades.log
├── requirements.txt
├── .env.example             # Template for your credentials
└── .gitignore
```

---

## Trade Flow
```
Chartink Scanner Triggers
        ↓
Telegram Alert: "RELIANCE"
        ↓
Is market open? (9:15–3:20 IST) → No = Ignore
        ↓
Is a position already open? → Yes = Ignore
        ↓
Lookup RELIANCE security_id from Dhan instrument master
        ↓
Get available funds from Dhan account
        ↓
Get LTP of RELIANCE
        ↓
quantity = int(funds × 0.99 / ltp)
        ↓
Place INTRADAY MARKET BUY order
        ↓
Monitor every 30 seconds:
  LTP ≥ buy × 1.01 → SELL (Target Hit ✅)
  LTP ≤ buy × 0.99 → SELL (SL Hit ❌)
        ↓
Capital freed → Ready for next signal
```

---

## ⚠️ Disclaimer
This software is for educational purposes. Trading involves financial risk.
Always test with small amounts before using real capital.
