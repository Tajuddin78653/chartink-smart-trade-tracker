const express = require('express');
const router  = express.Router();
const { query } = require('../db/postgres');

// GET /api/analytics/summary
router.get('/summary', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('STOP_LOSS_HIT','CLOSED')) AS total_trades,
        COUNT(*) FILTER (WHERE pnl > 0 AND status IN ('STOP_LOSS_HIT','CLOSED')) AS winning_trades,
        COUNT(*) FILTER (WHERE pnl < 0 AND status IN ('STOP_LOSS_HIT','CLOSED')) AS losing_trades,
        COUNT(*) FILTER (WHERE status IN ('OPEN','TRAILING','TARGET_HIT')) AS active_trades,
        ROUND(SUM(pnl) FILTER (WHERE status IN ('STOP_LOSS_HIT','CLOSED'))::NUMERIC, 2) AS total_pnl,
        ROUND(AVG(pnl_pct) FILTER (WHERE pnl > 0 AND status IN ('STOP_LOSS_HIT','CLOSED'))::NUMERIC, 4) AS avg_gain_pct,
        ROUND(AVG(pnl_pct) FILTER (WHERE pnl < 0 AND status IN ('STOP_LOSS_HIT','CLOSED'))::NUMERIC, 4) AS avg_loss_pct,
        MAX(pnl) FILTER (WHERE status IN ('STOP_LOSS_HIT','CLOSED')) AS best_trade,
        MIN(pnl) FILTER (WHERE status IN ('STOP_LOSS_HIT','CLOSED')) AS worst_trade
      FROM trades
    `);

    const r = result.rows[0];
    const total = parseInt(r.total_trades) || 0;
    const wins  = parseInt(r.winning_trades) || 0;
    res.json({
      ...r,
      win_rate: total > 0 ? parseFloat(((wins / total) * 100).toFixed(2)) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/daily
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0,10);
    const result = await query(`
      SELECT symbol, trade_id, entry_price, exit_price, pnl, pnl_pct, status, exit_reason,
             entry_time, exit_time, duration_mins, scan_name
      FROM trades
      WHERE DATE(entry_time AT TIME ZONE 'Asia/Kolkata') = $1
      ORDER BY entry_time DESC`, [targetDate]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
