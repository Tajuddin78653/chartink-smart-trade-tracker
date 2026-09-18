"""
dhan_trader.py — All Dhan API interactions:
  - Get available funds
  - Get LTP (last traded price)
  - Place INTRADAY MARKET BUY order
  - Place INTRADAY MARKET SELL order (exit)
"""

from dhanhq import dhanhq, DhanContext
from config import DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN, PRODUCT_TYPE
from logger import log_info, log_error, log_order
import requests

# Initialise Dhan client (v2 SDK uses DhanContext)
dhan_context = DhanContext(DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN)
dhan = dhanhq(dhan_context)


def get_available_funds() -> float:
    """
    Returns the available cash balance (availabelBalance) from Dhan fund limits.
    Returns 0.0 on error.
    """
    try:
        resp = dhan.get_fund_limits()
        data = resp.get("data", {})
        # Dhan returns 'availabelBalance' (their spelling)
        balance = float(
            data.get("availabelBalance")
            or data.get("availableBalance")
            or data.get("net")
            or 0
        )
        log_info(f"💰 Available funds: ₹{balance:.2f}")
        return balance
    except Exception as e:
        log_error("Failed to fetch fund limits", e)
        return 0.0


def get_ltp(security_id: str) -> float | None:
    """
    Returns the Last Traded Price for the given NSE EQ security_id.
    Returns None on error.
    """
    try:
        resp = dhan.ohlc_data({"NSE_EQ": [int(security_id)]})
        data = resp.get("data", {})
        nse_data = data.get("NSE_EQ", {})
        entry = nse_data.get(str(security_id)) or nse_data.get(int(security_id))
        if entry:
            ltp = float(entry.get("last_price") or entry.get("close") or 0)
            return ltp if ltp > 0 else None
        return None
    except Exception as e:
        log_error(f"Failed to get LTP for security_id={security_id}", e)
        return None


def place_buy_order(symbol: str, security_id: str, quantity: int) -> dict | None:
    """
    Place an INTRADAY MARKET BUY order.
    Returns the order response dict or None on failure.
    """
    try:
        resp = dhan.place_order(
            security_id=str(security_id),
            exchange_segment=dhan.NSE,
            transaction_type=dhan.BUY,
            quantity=quantity,
            order_type=dhan.MARKET,
            product_type=dhan.INTRA,   # INTRADAY / MIS
            price=0,
        )
        order_id = resp.get("data", {}).get("orderId", "N/A")
        log_order(symbol, "BUY", quantity, 0, order_id)
        return resp
    except Exception as e:
        log_error(f"Failed to place BUY order for {symbol}", e)
        return None


def place_sell_order(symbol: str, security_id: str, quantity: int) -> dict | None:
    """
    Place an INTRADAY MARKET SELL order (exit position).
    Returns the order response dict or None on failure.
    """
    try:
        resp = dhan.place_order(
            security_id=str(security_id),
            exchange_segment=dhan.NSE,
            transaction_type=dhan.SELL,
            quantity=quantity,
            order_type=dhan.MARKET,
            product_type=dhan.INTRA,
            price=0,
        )
        order_id = resp.get("data", {}).get("orderId", "N/A")
        log_order(symbol, "SELL", quantity, 0, order_id)
        return resp
    except Exception as e:
        log_error(f"Failed to place SELL order for {symbol}", e)
        return None


def calculate_quantity(funds: float, ltp: float) -> int:
    """
    Calculate how many shares to buy with available funds.
    Leaves a small buffer (99% of funds) to account for slippage.
    Returns 0 if not enough funds for even 1 share.
    """
    if ltp <= 0:
        return 0
    qty = int((funds * 0.99) / ltp)
    return qty
