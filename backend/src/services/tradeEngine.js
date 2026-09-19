const { query } = require('../db/postgres');
const { v4: uuidv4 } = require('uuid');

/**
 * Core Trade Engine
 * Handles: position creation, SL/Target calc, trailing logic, P&L
 */

// ── Generate Trade ID ─────────────────────────────────────
const generateTradeId = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(Math.random() * 999).toString().padStart(3,'0');
  return `TRD${datePart}${rand}`;
};

// ── Calculate SL and Target ───────────────────────────────
const calculateLevels = (entryPrice, settings) => {
  const { target_pct, sl_pct } = settings;
  const sl     = parseFloat((entryPrice * (1 - sl_pct / 100)).toFixed(2));
  const target = parseFloat((entryPrice * (1 + target_pct / 100)).toFixed(2));
  return { sl, target };
};

// ── Create new Trade from Alert ───────────────────────────
const createTrade = async (alert, settings) => {
  const { symbol, exchange, ltp, signal, scan_name, alert_time, id: alert_id } = alert;
  const entryPrice = parseFloat(ltp);
  const { sl, target } = calculateLevels(entryPrice, settings);
  const tradeId = generateTradeId();

  const result = await query(`
    INSERT INTO trades 
      (trade_id, alert_id, symbol, exchange, signal, entry_price, entry_time,
       sl, initial_target, current_target, highest_price, scan_name, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$6,$10,'OPEN')
    RETURNING *`,
    [tradeId, alert_id, symbol, exchange, signal, entryPrice,
     alert_time || new Date(), sl, target, scan_name]
  );

  const trade = result.rows[0];

  // Log entry event
  await logTradeEvent(trade.id, 'ENTRY_EXECUTED', entryPrice, null, null, sl, target, 0, 'Position opened');

  return trade;
};

// ── Process price update for a trade ─────────────────────
const processPriceUpdate = async (trade, currentPrice, settings, io) => {
  const price = parseFloat(currentPrice);
  const entry = parseFloat(trade.entry_price);
  const sl    = parseFloat(trade.sl);
  const target = parseFloat(trade.current_target);
  const highest = Math.max(parseFloat(trade.highest_price || entry), price);

  const pnl    = parseFloat((price - entry).toFixed(2));
  const pnlPct = parseFloat(((pnl / entry) * 100).toFixed(4));

  // ── STOP LOSS HIT ──────────────────────────────────────
  if (price <= sl) {
    await closeTrade(trade, price, 'STOP_LOSS_HIT', 'SL Hit', pnl, pnlPct, io);
    return;
  }

  // ── TARGET HIT → AUTO EXIT ────────────────────────────
  if (price >= target) {
    const newCount = trade.target_count + 1;
    await logTradeEvent(trade.id, `TARGET_${newCount}_HIT`, price, sl, null, target, null, pnl, `Target hit at ${price}. Auto-exit.`);
    await closeTrade(trade, price, 'TARGET_HIT', 'TARGET_HIT', pnl, pnlPct, io);
    return;
  }

  // ── Regular update ─────────────────────────────────────
  await query(`
    UPDATE trades SET current_price=$1, highest_price=$2, pnl=$3, pnl_pct=$4, updated_at=NOW()
    WHERE id=$5`,
    [price, highest, pnl, pnlPct, trade.id]
  );

  if (io) io.emit('trade_update', { ...trade, current_price: price, highest_price: highest, pnl, pnl_pct: pnlPct });
};

// ── Close a Trade ─────────────────────────────────────────
const closeTrade = async (trade, exitPrice, exitReason, status, pnl, pnlPct, io) => {
  const entryTime = new Date(trade.entry_time);
  const now = new Date();
  const durationMins = Math.floor((now - entryTime) / 60000);

  await query(`
    UPDATE trades SET
      status=$1, exit_price=$2, exit_time=$3, pnl=$4, pnl_pct=$5,
      exit_reason=$6, duration_mins=$7, updated_at=NOW()
    WHERE id=$8`,
    [status, exitPrice, now, pnl, pnlPct, exitReason, durationMins, trade.id]
  );

  await logTradeEvent(trade.id, status, exitPrice, null, null, null, null, pnl, exitReason);

  if (io) {
    io.emit('trade_closed', { trade_id: trade.trade_id, symbol: trade.symbol, status, pnl, pnl_pct: pnlPct });
    io.emit('notification', { type: status, trade_id: trade.trade_id, symbol: trade.symbol, pnl, pnl_pct: pnlPct });
  }
};

// ── Log Trade Event ───────────────────────────────────────
const logTradeEvent = async (tradeId, eventType, price, oldSl, newSl, oldTarget, newTarget, pnl, notes) => {
  await query(`
    INSERT INTO trade_events (trade_id, event_type, price, old_sl, new_sl, old_target, new_target, pnl, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [tradeId, eventType, price, oldSl, newSl, oldTarget, newTarget, pnl, notes]
  );
};

// ── Get active trades ─────────────────────────────────────
const getActiveTrades = async () => {
  const result = await query(`SELECT * FROM trades WHERE status IN ('OPEN','TRAILING','TARGET_HIT') ORDER BY entry_time DESC`);
  return result.rows;
};

// ── Get Settings ──────────────────────────────────────────
const getSettings = async () => {
  const result = await query('SELECT * FROM settings LIMIT 1');
  return result.rows[0] || { target_pct: 1.0, sl_pct: 1.0, trailing_pct: 0.5 };
};

module.exports = { createTrade, processPriceUpdate, closeTrade, getActiveTrades, getSettings, calculateLevels };
