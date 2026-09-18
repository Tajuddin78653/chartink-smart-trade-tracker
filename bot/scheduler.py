"""
scheduler.py — Market hours check.
Indian stock market: Monday–Friday, 9:15 AM – 3:20 PM IST.
(Stopping at 3:20 to avoid Dhan auto square-off window at 3:20 PM)
"""

from datetime import datetime
import pytz
from logger import log_info

IST = pytz.timezone("Asia/Kolkata")


def now_ist() -> datetime:
    """Return current datetime in IST."""
    return datetime.now(IST)


def is_market_open() -> bool:
    """
    Returns True if current IST time is within market hours:
    Monday–Friday, 9:15 AM – 3:20 PM IST.
    """
    now = now_ist()

    # Weekend check (Monday=0 ... Sunday=6)
    if now.weekday() >= 5:
        return False

    market_open  = now.replace(hour=9,  minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=20, second=0, microsecond=0)

    return market_open <= now <= market_close


def log_market_status():
    """Log current market open/closed status."""
    status = "OPEN 🟢" if is_market_open() else "CLOSED 🔴"
    log_info(f"Market is {status} | IST time: {now_ist().strftime('%Y-%m-%d %H:%M:%S')}")
