"""
capital_manager.py — Tracks the single active trade position.

Rules:
  - Only ONE position open at a time.
  - While a position is open, all new signals are ignored.
  - After exit, capital is freed and the next signal can be taken.
"""

from dataclasses import dataclass
from typing import Optional
import threading
from logger import log_info


@dataclass
class Position:
    symbol: str
    security_id: str
    quantity: int
    buy_price: float
    target_price: float
    sl_price: float
    order_id: str = ""


class CapitalManager:
    def __init__(self):
        self._lock = threading.Lock()
        self._position: Optional[Position] = None

    def has_open_position(self) -> bool:
        with self._lock:
            return self._position is not None

    def open_position(
        self,
        symbol: str,
        security_id: str,
        quantity: int,
        buy_price: float,
        target_pct: float,
        sl_pct: float,
        order_id: str = "",
    ) -> Optional[Position]:
        with self._lock:
            # Atomic check-and-set: reject duplicate opens under the same lock
            if self._position is not None:
                log_info(
                    f"⚠️  Position already open ({self._position.symbol}), "
                    f"ignoring new signal for {symbol}"
                )
                return None
            target = round(buy_price * (1 + target_pct / 100), 2)
            sl     = round(buy_price * (1 - sl_pct / 100), 2)
            self._position = Position(
                symbol=symbol,
                security_id=security_id,
                quantity=quantity,
                buy_price=buy_price,
                target_price=target,
                sl_price=sl,
                order_id=order_id,
            )
            log_info(
                f"📂 Position opened | {symbol} x{quantity} | "
                f"Buy: ₹{buy_price} | Target: ₹{target} | SL: ₹{sl}"
            )
            return self._position

    def get_position(self) -> Optional[Position]:
        with self._lock:
            return self._position

    def close_position(self):
        with self._lock:
            if self._position:
                log_info(f"📁 Position closed | {self._position.symbol}")
            self._position = None


# Singleton instance shared across the app
capital_manager = CapitalManager()
