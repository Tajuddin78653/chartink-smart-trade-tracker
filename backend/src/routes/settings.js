const express = require('express');
const router  = express.Router();
const { query } = require('../db/postgres');

router.get('/', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM settings LIMIT 1');
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const { target_pct, sl_pct, trailing_pct, trading_start, trading_end, broker, price_interval } = req.body;
    const result = await query(`
      UPDATE settings SET
        target_pct=$1, sl_pct=$2, trailing_pct=$3,
        trading_start=$4, trading_end=$5, broker=$6,
        price_interval=$7, updated_at=NOW()
      RETURNING *`,
      [target_pct, sl_pct, trailing_pct, trading_start, trading_end, broker, price_interval]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
