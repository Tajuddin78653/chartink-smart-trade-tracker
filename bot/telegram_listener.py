"""
telegram_listener.py — Listens to a Telegram channel for Chartink alerts.

Uses python-telegram-bot in polling mode (no public URL needed).
When a message arrives:
  1. Check market is open
  2. Check no position is already open
  3. Parse the stock symbol
  4. Execute the trade
"""

import asyncio
from telegram import Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, TARGET_PCT, SL_PCT
from scheduler import is_market_open
from signal_parser import parse_signal
from instrument_master import get_security_id
from capital_manager import capital_manager
from dhan_trader import get_available_funds, get_ltp, calculate_quantity, place_buy_order
from tradedash_client import notify_signal_received
from logger import log_info, log_ignored, log_error


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Called for every new message in the monitored channel/group."""
    message = update.effective_message
    chat    = update.effective_chat

    if message is None:
        return

    # Only process messages from the configured channel
    if chat and chat.id != TELEGRAM_CHANNEL_ID:
        return

    text = (message.text or message.caption or "").strip()
    if not text:
        return

    log_info(f"📨 Telegram message received: '{text}'")

    # ── 1. Market hours check ──────────────────────────────────────────────────
    if not is_market_open():
        log_ignored(text, "Market is closed")
        return

    # ── 2. One position at a time ──────────────────────────────────────────────
    if capital_manager.has_open_position():
        pos = capital_manager.get_position()
        log_ignored(text, f"Position already open: {pos.symbol}")
        return

    # ── 3. Parse symbol ────────────────────────────────────────────────────────
    symbol = parse_signal(text)
    if not symbol:
        log_ignored(text, "Could not parse a valid stock symbol")
        return

    # ── 4. Lookup Dhan security ID ─────────────────────────────────────────────
    security_id = get_security_id(symbol)
    if not security_id:
        log_ignored(symbol, f"Symbol not found in Dhan instrument master")
        return

    # ── 5. Get available funds ─────────────────────────────────────────────────
    funds = get_available_funds()
    if funds < 100:
        log_ignored(symbol, f"Insufficient funds: ₹{funds:.2f}")
        return

    # ── 6. Get current LTP ─────────────────────────────────────────────────────
    ltp = get_ltp(security_id)
    if not ltp:
        log_ignored(symbol, "Could not fetch LTP")
        return

    # ── 7. Calculate quantity ──────────────────────────────────────────────────
    quantity = calculate_quantity(funds, ltp)
    if quantity < 1:
        log_ignored(symbol, f"Quantity is 0 — funds ₹{funds:.2f} not enough for 1 share at ₹{ltp:.2f}")
        return

    # ── 8. Place BUY order ─────────────────────────────────────────────────────
    resp = place_buy_order(symbol, security_id, quantity)
    if not resp:
        log_error(f"BUY order failed for {symbol}")
        return

    order_id = resp.get("data", {}).get("orderId", "")

    # ── 9. Notify chartink-backend dashboard ──────────────────────────────────
    notify_signal_received(symbol=symbol, ltp=ltp)

    # ── 10. Open position in capital manager ──────────────────────────────────
    capital_manager.open_position(
        symbol=symbol,
        security_id=security_id,
        quantity=quantity,
        buy_price=ltp,
        target_pct=TARGET_PCT,
        sl_pct=SL_PCT,
        order_id=order_id,
    )


def build_app() -> Application:
    """Build the Telegram Application with message handler."""
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Listen to channel posts, supergroups, and regular groups
    app.add_handler(
        MessageHandler(
            filters.ChatType.CHANNEL | filters.ChatType.GROUPS | filters.ChatType.GROUP,
            handle_message,
        )
    )
    return app
