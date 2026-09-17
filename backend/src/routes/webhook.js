const express = require('express');
const router  = express.Router();
const { query } = require('../db/postgres');
const { createTrade, getSettings } = require('../services/tradeEngine');
const { sendNotification } = require('../services/notificationService');

/**
 * POST /api/webhook/chartink
 * Public endpoint — receives Chartink scanner alerts
 * Payload: { symbol, exchange, ltp, signal, scan_name, alert_time }
 */
router.post('/chartink', async (req, res) => {
  try {
    const { symbol, exchange = 'NSE', ltp, signal = 'BUY', scan_name, alert_time } = req.body;

    // Basic validation
    if (!symbol || !ltp) {
      return res.status(400).json({ error: 'symbol and ltp are required' });
    }

    // Store raw alert
    const alertResult = await query(`
      INSERT INTO alerts (symbol, exchange, ltp, signal, scan_name, alert_time, raw_payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [symbol.toUpperCase(), exchange, parseFloat(ltp), signal, scan_name, alert_time || new Date(), JSON.stringify(req.body)]
    );
    const alert = alertResult.rows[0];

    // Get current settings
    const settings = await getSettings();

    // Create trade position
    const trade = await createTrade(alert, settings);

    // Mark alert as processed
    await query('UPDATE alerts SET processed=true WHERE id=$1', [alert.id]);

    // Emit real-time event
    if (req.io) {
      req.io.emit('new_trade', trade);
      req.io.emit('notification', {
        type: 'ENTRY_CREATED',
        symbol: trade.symbol,
        entry_price: trade.entry_price,
        sl: trade.sl,
        target: trade.current_target,
        scan_name: trade.scan_name
      });
    }

    // Send notifications
    await sendNotification('ENTRY_CREATED', trade);

    res.status(201).json({ success: true, trade_id: trade.trade_id, trade });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check for webhook
router.get('/health', (_req, res) => res.json({ status: 'webhook ready' }));

module.exports = router;
