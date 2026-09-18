"""
tradedash_client.py — Posts trade events to the existing chartink-backend API
so every trade appears live on the dashboard (open positions, P&L, history).

The backend webhook endpoint: POST /api/webhook/chartink
Payload: { symbol, exchange, ltp, signal, scan_name, alert_time }
"""

import requests
import os
from logger import log_info, log_error

# chartink-backend URL — injected by Render as env var
BACKEND_URL = os.getenv("BACKEND_URL", "").rstrip("/")


def _enabled() -> bool:
    return bool(BACKEND_URL)


def notify_signal_received(symbol: str, ltp: float, scan_name: str = "Dhan Bot"):
    """
    POST a new trade signal to the backend webhook.
    This creates an alert + trade record visible on the dashboard.
    """
    if not _enabled():
        log_info("⚠️  BACKEND_URL not set — skipping dashboard sync")
        return None

    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/webhook/chartink",
            json={
                "symbol":     symbol.upper(),
                "exchange":   "NSE",
                "ltp":        ltp,
                "signal":     "BUY",
                "scan_name":  scan_name,
            },
            timeout=10,
        )
        data = resp.json()
        trade_id = data.get("trade_id", "")
        log_info(f"📊 Dashboard synced: {symbol} → trade_id={trade_id} ({resp.status_code})")
        return trade_id
    except Exception as e:
        log_error("Dashboard sync failed", e)
        return None


def notify_trade_closed(symbol: str, exit_price: float, reason: str):
    """
    The backend's priceMonitor handles SL/Target exits automatically
    once the trade is in the DB. This function is a no-op but kept
    for future manual override support.
    """
    log_info(f"📊 Trade exit logged locally: {symbol} @ ₹{exit_price} | {reason}")
