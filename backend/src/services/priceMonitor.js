const axios = require('axios');
const { getActiveTrades, processPriceUpdate, getSettings } = require('./tradeEngine');
const { setCache, getCache } = require('../db/redis');

let monitorInterval = null;

/**
 * Fetch live price from configured broker
 */
const fetchLivePrice = async (symbol, exchange = 'NSE') => {
  const broker = process.env.BROKER || 'dhan';

  try {
    switch (broker) {
      case 'dhan':
        return await fetchFromDhan(symbol, exchange);
      case 'upstox':
        return await fetchFromUpstox(symbol, exchange);
      default:
        return await fetchFromDhan(symbol, exchange);
    }
  } catch (err) {
    console.error(`Price fetch error for ${symbol}:`, err.message);
    return null;
  }
};

// ── Dhan API ──────────────────────────────────────────────
const fetchFromDhan = async (symbol, exchange) => {
  const cacheKey = `price:${symbol}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached.ltp;

  const response = await axios.get(`https://api.dhan.co/v2/marketfeed/ltp`, {
    headers: { 'access-token': process.env.DHAN_ACCESS_TOKEN },
    params: { 'NSE_EQ': symbol }
  });

  const ltp = response.data?.data?.[`NSE_EQ:${symbol}`]?.ltp;
  if (ltp) await setCache(cacheKey, { ltp }, 4); // cache 4 seconds
  return ltp;
};

// ── Upstox API ────────────────────────────────────────────
const fetchFromUpstox = async (symbol, exchange) => {
  const response = await axios.get(`https://api.upstox.com/v2/market-quote/ltp`, {
    headers: { Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}` },
    params: { instrument_key: `${exchange}_EQ|${symbol}` }
  });
  return response.data?.data?.[`${exchange}_EQ:${symbol}`]?.last_price;
};

/**
 * Start the price monitoring loop
 * Checks every 5 seconds (configurable)
 */
const startPriceMonitor = async (io) => {
  const settings = await getSettings();
  const interval = (settings.price_interval || 5) * 1000;

  console.log(`✅ Price monitor started (every ${interval/1000}s)`);

  monitorInterval = setInterval(async () => {
    try {
      // Check if within trading hours
      if (!isWithinTradingHours(settings)) return;

      const activeTrades = await getActiveTrades();
      if (activeTrades.length === 0) return;

      // Fetch prices for all active symbols in parallel
      const symbols = [...new Set(activeTrades.map(t => t.symbol))];
      const prices = await Promise.all(symbols.map(s => fetchLivePrice(s)));
      const priceMap = Object.fromEntries(symbols.map((s, i) => [s, prices[i]]));

      // Process each trade
      for (const trade of activeTrades) {
        const price = priceMap[trade.symbol];
        if (price) await processPriceUpdate(trade, price, settings, io);
      }
    } catch (err) {
      console.error('Price monitor error:', err.message);
    }
  }, interval);
};

const stopPriceMonitor = () => {
  if (monitorInterval) clearInterval(monitorInterval);
};

const isWithinTradingHours = (settings) => {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = ist.getHours();
  const mins  = ist.getMinutes();
  const current = hours * 60 + mins;
  const [startH, startM] = (settings.trading_start || '09:15').split(':').map(Number);
  const [endH,   endM]   = (settings.trading_end   || '15:30').split(':').map(Number);
  return current >= startH * 60 + startM && current <= endH * 60 + endM;
};

module.exports = { startPriceMonitor, stopPriceMonitor, fetchLivePrice };
