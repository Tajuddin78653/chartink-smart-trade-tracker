"""
tests/test_bot.py — Unit tests for the Dhan Chartink trading bot.
Run with: pytest tests/ -v
"""

import pytest
from unittest.mock import patch, MagicMock, call
import threading
import time


# ─────────────────────────────────────────────────────────────────
# signal_parser tests
# ─────────────────────────────────────────────────────────────────

def test_parse_signal_simple():
    from signal_parser import parse_signal
    assert parse_signal("RELIANCE") == "RELIANCE"

def test_parse_signal_with_exchange():
    from signal_parser import parse_signal
    assert parse_signal("RELIANCE,NSE") == "RELIANCE"

def test_parse_signal_lowercase():
    from signal_parser import parse_signal
    assert parse_signal("reliance") == "RELIANCE"

def test_parse_signal_empty():
    from signal_parser import parse_signal
    assert parse_signal("") is None

def test_parse_signal_none():
    from signal_parser import parse_signal
    assert parse_signal(None) is None

def test_parse_signal_multiline_uses_first():
    from signal_parser import parse_signal
    assert parse_signal("RELIANCE\nHDFCBANK") == "RELIANCE"

def test_parse_signal_too_long():
    from signal_parser import parse_signal
    assert parse_signal("A" * 21) is None

def test_parse_signal_whitespace():
    from signal_parser import parse_signal
    assert parse_signal("  INFY  ") == "INFY"


# ─────────────────────────────────────────────────────────────────
# scheduler tests
# ─────────────────────────────────────────────────────────────────

from unittest.mock import patch
from datetime import datetime
import pytz

IST = pytz.timezone("Asia/Kolkata")

def _ist(hour, minute, weekday=0):
    """Create a mock IST datetime. weekday: 0=Mon, 5=Sat, 6=Sun"""
    dt = datetime(2024, 1, 1 + weekday, hour, minute, 0, tzinfo=IST)
    return dt

def test_market_open_at_915():
    with patch("scheduler.now_ist", return_value=_ist(9, 15)):
        from scheduler import is_market_open
        assert is_market_open() is True

def test_market_closed_before_915():
    with patch("scheduler.now_ist", return_value=_ist(9, 14)):
        from scheduler import is_market_open
        assert is_market_open() is False

def test_market_closed_after_320():
    with patch("scheduler.now_ist", return_value=_ist(15, 21)):
        from scheduler import is_market_open
        assert is_market_open() is False

def test_market_open_at_320():
    with patch("scheduler.now_ist", return_value=_ist(15, 20)):
        from scheduler import is_market_open
        assert is_market_open() is True

def test_market_closed_saturday():
    with patch("scheduler.now_ist", return_value=_ist(10, 0, weekday=5)):
        from scheduler import is_market_open
        assert is_market_open() is False

def test_market_closed_sunday():
    with patch("scheduler.now_ist", return_value=_ist(10, 0, weekday=6)):
        from scheduler import is_market_open
        assert is_market_open() is False


# ─────────────────────────────────────────────────────────────────
# dhan_trader.calculate_quantity tests
# ─────────────────────────────────────────────────────────────────

def test_calculate_quantity_normal():
    from dhan_trader import calculate_quantity
    # 10000 funds, ltp=100 → int(9900/100) = 99
    assert calculate_quantity(10000, 100) == 99

def test_calculate_quantity_zero_ltp():
    from dhan_trader import calculate_quantity
    assert calculate_quantity(10000, 0) == 0

def test_calculate_quantity_none_ltp():
    from dhan_trader import calculate_quantity
    assert calculate_quantity(10000, None) == 0

def test_calculate_quantity_negative_ltp():
    from dhan_trader import calculate_quantity
    assert calculate_quantity(10000, -50) == 0

def test_calculate_quantity_zero_funds():
    from dhan_trader import calculate_quantity
    assert calculate_quantity(0, 100) == 0

def test_calculate_quantity_not_enough_funds():
    from dhan_trader import calculate_quantity
    # 50 funds, ltp=100 → int(49.5/100) = 0
    assert calculate_quantity(50, 100) == 0


# ─────────────────────────────────────────────────────────────────
# capital_manager tests
# ─────────────────────────────────────────────────────────────────

def _fresh_manager():
    """Return a new CapitalManager instance (not the singleton)."""
    from capital_manager import CapitalManager
    return CapitalManager()

def test_no_position_initially():
    cm = _fresh_manager()
    assert cm.has_open_position() is False
    assert cm.get_position() is None

def test_open_position_success():
    cm = _fresh_manager()
    pos = cm.open_position("RELIANCE", "2885", 10, 2500.0, 1.0, 1.0)
    assert pos is not None
    assert pos.symbol == "RELIANCE"
    assert pos.target_price == round(2500.0 * 1.01, 2)
    assert pos.sl_price == round(2500.0 * 0.99, 2)
    assert cm.has_open_position() is True

def test_open_position_duplicate_rejected():
    cm = _fresh_manager()
    pos1 = cm.open_position("RELIANCE", "2885", 10, 2500.0, 1.0, 1.0)
    pos2 = cm.open_position("HDFCBANK", "1333", 5, 1500.0, 1.0, 1.0)
    assert pos1 is not None
    assert pos2 is None                    # duplicate blocked atomically
    assert cm.get_position().symbol == "RELIANCE"  # original unchanged

def test_close_position():
    cm = _fresh_manager()
    cm.open_position("RELIANCE", "2885", 10, 2500.0, 1.0, 1.0)
    cm.close_position()
    assert cm.has_open_position() is False
    assert cm.get_position() is None

def test_close_position_when_none_is_safe():
    cm = _fresh_manager()
    cm.close_position()   # should not raise
    assert cm.get_position() is None

def test_thread_safety_no_duplicate_open():
    """Two threads racing to open a position — only one should win."""
    cm = _fresh_manager()
    results = []

    def open_it(symbol):
        result = cm.open_position(symbol, "0001", 1, 100.0, 1.0, 1.0)
        results.append(result)

    t1 = threading.Thread(target=open_it, args=("AAA",))
    t2 = threading.Thread(target=open_it, args=("BBB",))
    t1.start(); t2.start()
    t1.join(); t2.join()

    opened = [r for r in results if r is not None]
    assert len(opened) == 1, "Exactly one position should open"


# ─────────────────────────────────────────────────────────────────
# tradedash_client tests
# ─────────────────────────────────────────────────────────────────

def test_notify_signal_no_backend_url(capsys):
    """When BACKEND_URL is not set, should log and return None."""
    with patch.dict("os.environ", {}, clear=True):
        import importlib, tradedash_client
        importlib.reload(tradedash_client)
        result = tradedash_client.notify_signal_received("RELIANCE", 2500.0)
        assert result is None

def test_notify_signal_posts_to_backend():
    """When BACKEND_URL is set, POST is made to /api/webhook/chartink."""
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {"trade_id": "TRD001"}

    with patch.dict("os.environ", {"BACKEND_URL": "https://fake-backend.com"}):
        import importlib, tradedash_client
        importlib.reload(tradedash_client)
        with patch("requests.post", return_value=mock_resp) as mock_post:
            result = tradedash_client.notify_signal_received("RELIANCE", 2500.0)
            assert result == "TRD001"
            mock_post.assert_called_once()
            call_kwargs = mock_post.call_args
            assert "RELIANCE" in str(call_kwargs)
