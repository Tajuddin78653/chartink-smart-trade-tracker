"""
logger.py — Centralised logging for every signal, order, and exit.
Logs to both console and trades.log file.
"""

import logging
import os
from datetime import datetime

LOG_FILE = "trades.log"

# Create logger
logger = logging.getLogger("trader")
logger.setLevel(logging.DEBUG)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_fmt = logging.Formatter("[%(asctime)s] %(levelname)s — %(message)s", "%H:%M:%S")
console_handler.setFormatter(console_fmt)

# File handler
file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_fmt = logging.Formatter("[%(asctime)s] %(levelname)s — %(message)s", "%Y-%m-%d %H:%M:%S")
file_handler.setFormatter(file_fmt)

logger.addHandler(console_handler)
logger.addHandler(file_handler)


def log_signal(symbol: str, source: str = "Telegram"):
    logger.info(f"📡 SIGNAL received | Symbol: {symbol} | Source: {source}")


def log_order(symbol: str, action: str, qty: int, price: float, order_id: str):
    logger.info(
        f"📋 ORDER PLACED | {action} {qty} x {symbol} @ ₹{price:.2f} | OrderID: {order_id}"
    )


def log_exit(symbol: str, action: str, qty: int, price: float, reason: str, pnl: float):
    emoji = "✅" if pnl >= 0 else "❌"
    logger.info(
        f"{emoji} EXIT | {action} {qty} x {symbol} @ ₹{price:.2f} | "
        f"Reason: {reason} | PnL: ₹{pnl:.2f}"
    )


def log_ignored(symbol: str, reason: str):
    logger.warning(f"⏭️  IGNORED signal | Symbol: {symbol} | Reason: {reason}")


def log_error(msg: str, exc: Exception = None):
    if exc:
        logger.error(f"🔴 ERROR — {msg}: {exc}", exc_info=True)
    else:
        logger.error(f"🔴 ERROR — {msg}")


def log_info(msg: str):
    logger.info(msg)
