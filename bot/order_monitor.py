"""
order_monitor.py — Monitors an open position every N seconds.
Exits when price hits 1% target OR 1% stop loss.

Runs in a background thread so Telegram listener stays responsive.
"""

import time
import threading
from config import MONITOR_INTERVAL_SEC, TARGET_PCT, SL_PCT
from capital_manager import capital_manager
from dhan_trader import get_ltp, place_sell_order
from tradedash_client import notify_trade_closed
from logger import log_info, log_exit, log_error


def _monitor_loop():
    """
    Background loop that checks LTP of the open position every
    MONITOR_INTERVAL_SEC seconds and exits on target/SL.
    """
    log_info("🔍 Order monitor started.")
    while True:
        position = capital_manager.get_position()

        if position is None:
            # No open position — check again after interval
            time.sleep(MONITOR_INTERVAL_SEC)
            continue

        try:
            ltp = get_ltp(position.security_id)

            if ltp is None:
                log_info(f"⚠️  Could not fetch LTP for {position.symbol}, retrying...")
                time.sleep(MONITOR_INTERVAL_SEC)
                continue

            log_info(
                f"📈 {position.symbol} | LTP: ₹{ltp:.2f} | "
                f"Target: ₹{position.target_price} | SL: ₹{position.sl_price}"
            )

            reason = None
            if ltp >= position.target_price:
                reason = "TARGET HIT ✅"
            elif ltp <= position.sl_price:
                reason = "SL HIT ❌"

            if reason:
                # Place exit SELL order on Dhan
                place_sell_order(
                    symbol=position.symbol,
                    security_id=position.security_id,
                    quantity=position.quantity,
                )
                pnl = (ltp - position.buy_price) * position.quantity
                log_exit(
                    symbol=position.symbol,
                    action="SELL",
                    qty=position.quantity,
                    price=ltp,
                    reason=reason,
                    pnl=pnl,
                )
                # Log exit to dashboard
                notify_trade_closed(
                    symbol=position.symbol,
                    exit_price=ltp,
                    reason="target-hit" if "TARGET" in reason else "sl-hit",
                )
                # Free capital for the next trade
                capital_manager.close_position()

        except Exception as e:
            log_error("Error in order monitor loop", e)

        time.sleep(MONITOR_INTERVAL_SEC)


def start_monitor():
    """Start the order monitor in a daemon background thread."""
    t = threading.Thread(target=_monitor_loop, daemon=True, name="OrderMonitor")
    t.start()
    return t
