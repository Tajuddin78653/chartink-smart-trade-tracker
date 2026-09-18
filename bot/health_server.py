"""
health_server.py — Minimal HTTP server that runs alongside the bot.
Render requires a web service to bind to a PORT — this satisfies that
requirement while the actual trading bot runs in a background thread.
"""

import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from capital_manager import capital_manager
from scheduler import is_market_open, now_ist


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        pos = capital_manager.get_position()
        market = is_market_open()
        ist = now_ist().strftime("%Y-%m-%d %H:%M:%S IST")

        if self.path == "/health":
            body = f"ok — market={'open' if market else 'closed'} | position={pos.symbol if pos else 'none'} | {ist}"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(body.encode())
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Dhan Chartink Bot is running")

    def log_message(self, format, *args):
        pass  # suppress noisy HTTP logs


def start_health_server():
    """Start health server in a daemon thread on Render's PORT."""
    port = int(os.getenv("PORT", "10000"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True, name="HealthServer")
    t.start()
    from logger import log_info
    log_info(f"🌐 Health server started on port {port} — GET /health")
    return t
