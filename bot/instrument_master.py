"""
instrument_master.py — Downloads Dhan's instrument master CSV and
provides a fast symbol → security_id lookup for NSE EQ segment.

The CSV is downloaded once at startup and cached in instruments.csv.
"""

import csv
import os
import requests
from logger import log_info, log_error
from config import INSTRUMENT_CSV_URL, INSTRUMENT_CSV_PATH

# In-memory lookup: "RELIANCE" → "2885"
_symbol_to_id: dict[str, str] = {}


def download_instruments():
    """Download the Dhan instrument master CSV if not already present."""
    if os.path.exists(INSTRUMENT_CSV_PATH):
        log_info("📄 Instrument master already exists, skipping download.")
        return
    log_info("⬇️  Downloading Dhan instrument master CSV...")
    try:
        resp = requests.get(INSTRUMENT_CSV_URL, timeout=30)
        resp.raise_for_status()
        with open(INSTRUMENT_CSV_PATH, "wb") as f:
            f.write(resp.content)
        log_info("✅ Instrument master downloaded.")
    except Exception as e:
        log_error("Failed to download instrument master", e)
        raise


def load_instruments():
    """
    Load the CSV into memory.
    Dhan CSV columns (relevant ones):
      SEM_EXM_EXCH_ID, SEM_SEGMENT, SEM_SMST_SECURITY_ID, SEM_TRADING_SYMBOL
    We only load NSE_EQ segment entries.
    """
    global _symbol_to_id
    if _symbol_to_id:
        return  # already loaded

    download_instruments()

    count = 0
    try:
        with open(INSTRUMENT_CSV_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # NSE Equity: exchange=NSE, segment=E (Equity), series=EQ
                exchange = row.get("SEM_EXM_EXCH_ID", "").strip().upper()
                segment  = row.get("SEM_SEGMENT", "").strip().upper()
                series   = row.get("SEM_SERIES", "").strip().upper()
                if exchange != "NSE" or segment != "E":
                    continue
                # Only normal EQ series (skip SM, BE, etc.) — but also allow blank series
                if series and series not in ("EQ", ""):
                    continue
                symbol = row.get("SEM_TRADING_SYMBOL", "").strip().upper()
                sec_id = row.get("SEM_SMST_SECURITY_ID", "").strip()
                if symbol and sec_id:
                    _symbol_to_id[symbol] = sec_id
                    count += 1
        log_info(f"✅ Loaded {count} NSE_EQ instruments into memory.")
    except Exception as e:
        log_error("Failed to load instrument master", e)
        raise


def get_security_id(symbol: str) -> str | None:
    """
    Return the Dhan security_id for a given NSE symbol.
    Returns None if not found.
    """
    if not _symbol_to_id:
        load_instruments()
    return _symbol_to_id.get(symbol.upper())
