"""
signal_parser.py — Parses raw Telegram message text into a trade signal.

Chartink sends just the stock name, e.g.:
    "RELIANCE"
    "RELIANCE,NSE"
    "HDFCBANK"

We extract the symbol and return a clean uppercase string.
"""

import re
from logger import log_info


# Match a stock symbol — uppercase letters/digits, optional comma+exchange
_SYMBOL_RE = re.compile(r"^([A-Z0-9&_\-]+)(?:[,\s].*)?$", re.IGNORECASE)


def parse_signal(text: str) -> str | None:
    """
    Parse a Telegram message and extract the stock symbol.

    Returns the symbol string (e.g. "RELIANCE") or None if not a valid signal.
    """
    if not text:
        return None

    text = text.strip()

    # Remove any leading/trailing punctuation or whitespace
    # Take only the first line (in case of multi-line messages)
    first_line = text.splitlines()[0].strip()

    match = _SYMBOL_RE.match(first_line)
    if not match:
        return None

    symbol = match.group(1).upper()

    # Basic sanity — symbols are 1–20 chars
    if len(symbol) < 1 or len(symbol) > 20:
        return None

    log_info(f"🔍 Parsed signal: {symbol}")
    return symbol
