const express = require('express');
const router  = express.Router();
const { query } = require('../db/postgres');

// GET /api/trades — active trades
router.get('/', async (req, res) => {
  try {
    const { status, symbol, date_from, date_to, limit = 50, offset = 0 } = req.query;
    let conditions = []; let params = [];

    if (status)    { conditions.push(`status = $${params.length+1}`);      params.push(status); }
    if (symbol)    { conditions.push(`symbol ILIKE $${params.length+1}`);   params.push(`%${symbol}%`); }
    if (date_from) { conditions.push(`entry_time >= $${params.length+1}`);  params.push(date_from); }
    if (date_to)   { conditions.push(`entry_time <= $${params.length+1}`);  params.push(date_to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT * FROM trades ${where} ORDER BY entry_time DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM trades ${where}`, params);
    res.json({ trades: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/active
router.get('/active', async (_req, res) => {
  try {
    const result = await query(`
      SELECT * FROM trades WHERE status IN ('OPEN','TRAILING','TARGET_HIT') ORDER BY entry_time DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/:id — single trade with events
router.get('/:id', async (req, res) => {
  try {
    const trade = await query('SELECT * FROM trades WHERE trade_id=$1 OR id=$1', [req.params.id]);
    if (!trade.rows.length) return res.status(404).json({ error: 'Trade not found' });
    const events = await query('SELECT * FROM trade_events WHERE trade_id=$1 ORDER BY event_time', [trade.rows[0].id]);
    res.json({ ...trade.rows[0], events: events.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
