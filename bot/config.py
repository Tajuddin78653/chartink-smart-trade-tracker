"""
config.py — All configuration loaded from environment variables.
Copy .env.example to .env and fill in your credentials.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Dhan API ──────────────────────────────────────────────────────────────────
DHAN_CLIENT_ID     = os.environ["DHAN_CLIENT_ID"]
DHAN_ACCESS_TOKEN  = os.environ["DHAN_ACCESS_TOKEN"]

# ── Telegram ──────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN    = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHANNEL_ID   = int(os.environ["TELEGRAM_CHANNEL_ID"])   # e.g. -1001234567890

# ── Trade Settings ────────────────────────────────────────────────────────────
PRODUCT_TYPE          = os.getenv("PRODUCT_TYPE", "INTRADAY")     # INTRADAY = MIS
TARGET_PCT            = float(os.getenv("TARGET_PCT", "1.0"))     # 1% profit target
SL_PCT                = float(os.getenv("SL_PCT", "1.0"))         # 1% stop loss
MONITOR_INTERVAL_SEC  = int(os.getenv("MONITOR_INTERVAL_SEC", "30"))  # price check every 30s

# ── Market Hours (IST) ────────────────────────────────────────────────────────
MARKET_OPEN_HOUR    = 9
MARKET_OPEN_MINUTE  = 15
MARKET_CLOSE_HOUR   = 15
MARKET_CLOSE_MINUTE = 20   # 3:20 PM — stop new orders before Dhan auto square-off at 3:20

# ── Instrument Master (downloaded from Dhan) ──────────────────────────────────
INSTRUMENT_CSV_URL = "https://images.dhan.co/api-data/api-scrip-master.csv"
INSTRUMENT_CSV_PATH = "instruments.csv"
