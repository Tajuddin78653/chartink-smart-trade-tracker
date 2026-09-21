const express = require('express');
const router  = express.Router();
const { query } = require('../db/postgres');
const { createTrade, getSettings } = require('../services/tradeEngine');
const { sendNotification } = require('../services/notificationService');

/**
 * POST /api/webhook/chartink
 * Open endpoint — no API key required (Chartink does not support custom headers).
 *
 * Supports TWO payload formats:
 *
 * 1. Chartink native format:
 *    { stocks: "RELIANCE:NSE,TCS:NSE", scan_name: "...", alert_name: "...",
 *      trigger_prices: "2845,3500", triggered_at: "..." }
 *
 * 2. Direct format (for testing):
 *    { symbol: "RELIANCE", exchange: "NSE", ltp: 2845, scan_name: "..." }
 */
router.post('/chartink', async (req, res) => {
  try {
    const body = req.body;
    const settings = await getSettings();
    const trades   = [];

    // ── Parse Chartink native format ──────────────────────
    if (body.stocks) {
      const stockList     = body.stocks.split(',').map(s => s.trim()).filter(Boolean);
      const priceList     = body.trigger_prices
        ? body.trigger_prices.toString().split(',').map(p => parseFloat(p.trim()))
        : [];
      const scanName      = body.scan_name || body.alert_name || 'Chartink Scanner';
      const alertTime     = body.triggered_at || new Date();

      for (let i = 0; i < stockList.length; i++) {
        const parts    = stockList[i].split(':');
        const symbol   = parts[0].trim().toUpperCase();
        const exchange = parts[1] ? parts[1].trim().toUpperCase() : 'NSE';
        const ltp      = priceList[i] || priceList[0] || 0;

        if (!symbol) continue;

        const alertResult = await query(`
          INSERT INTO alerts (symbol, exchange, ltp, signal, scan_name, alert_time, raw_payload)
          VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [symbol, exchange, ltp, 'BUY', scanName, alertTime, JSON.stringify(body)]
        );
        const alert = alertResult.rows[0];
        const trade = await createTrade(alert, settings);
        await query('UPDATE alerts SET processed=true WHERE id=$1', [alert.id]);

        if (req.io) {
          req.io.emit('new_trade', trade);
          req.io.emit('notification', {
            type: 'ENTRY_CREATED', symbol: trade.symbol,
            entry_price: trade.entry_price, sl: trade.sl,
            target: trade.current_target, scan_name: trade.scan_name
          });
        }
        await sendNotification('ENTRY_CREATED', trade);
        trades.push({ trade_id: trade.trade_id, symbol: trade.symbol, entry: trade.entry_price, sl: trade.sl, target: trade.current_target });
      }

      return res.status(201).json({ success: true, trades_created: trades.length, trades });
    }

    // ── Direct / test format ───────────────────────────────
    const { symbol, exchange = 'NSE', ltp, signal = 'BUY', scan_name, alert_time } = body;

    if (!symbol || !ltp) {
      return res.status(400).json({ error: 'Provide either "stocks" (Chartink format) or "symbol"+"ltp"' });
    }

    const alertResult = await query(`
      INSERT INTO alerts (symbol, exchange, ltp, signal, scan_name, alert_time, raw_payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [symbol.toUpperCase(), exchange, parseFloat(ltp), signal, scan_name, alert_time || new Date(), JSON.stringify(body)]
    );
    const alert = alertResult.rows[0];
    const trade = await createTrade(alert, settings);
    await query('UPDATE alerts SET processed=true WHERE id=$1', [alert.id]);

    if (req.io) {
      req.io.emit('new_trade', trade);
      req.io.emit('notification', {
        type: 'ENTRY_CREATED', symbol: trade.symbol,
        entry_price: trade.entry_price, sl: trade.sl,
        target: trade.current_target, scan_name: trade.scan_name
      });
    }
    await sendNotification('ENTRY_CREATED', trade);

    return res.status(201).json({ success: true, trade_id: trade.trade_id, trade });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check for webhook
router.get('/health', (_req, res) => res.json({ status: 'webhook ready' }));

module.exports = router;
