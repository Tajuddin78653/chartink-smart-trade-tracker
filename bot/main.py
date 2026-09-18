"""
main.py — Entry point for the Dhan-Chartink Auto Trader.

Startup sequence:
  1. Start health server (required for Render web service)
  2. Load instrument master (Dhan CSV)
  3. Start order monitor thread (watches open positions 24/7)
  4. Start Telegram bot polling (runs forever, processes signals during market hours)
"""

import sys
from health_server import start_health_server
from instrument_master import load_instruments
from order_monitor import start_monitor
from telegram_listener import build_app
from scheduler import log_market_status
from logger import log_info, log_error


def main():
    log_info("=" * 60)
    log_info("  🚀 Dhan Chartink Auto Trader — Starting Up")
    log_info("=" * 60)

    # Step 1: Start health server (Render needs a port to bind)
    start_health_server()

    # Step 2: Load Dhan instrument master (symbol → security_id)
    log_info("Step 1: Loading instrument master...")
    try:
        load_instruments()
    except Exception as e:
        log_error("Cannot start without instrument master", e)
        sys.exit(1)

    # Step 2: Log current market status
    log_market_status()

    # Step 3: Start background order monitor thread
    log_info("Step 2: Starting order monitor...")
    start_monitor()

    # Step 4: Start Telegram polling (blocking — runs forever)
    log_info("Step 3: Starting Telegram listener...")
    log_info("📡 Waiting for Chartink alerts on Telegram...")
    log_info("   (Signals will only execute during market hours 9:15 AM – 3:20 PM IST)")
    log_info("=" * 60)

    app = build_app()
    app.run_polling(
        poll_interval=2,          # check every 2 seconds
        timeout=30,
        drop_pending_updates=True # ignore any alerts received while app was offline
    )


if __name__ == "__main__":
    main()
