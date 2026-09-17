const https = require('https');
const http  = require('http');

/**
 * Keep-Alive Ping Service
 * Pings all Render services every 10 minutes during market hours
 * Prevents Render free tier from spinning down (15 min idle timeout)
 * Market hours: Mon-Fri 09:00 - 15:45 IST
 */

const SERVICES = [
  { name: 'Backend',  url: process.env.BACKEND_URL  || 'http://localhost:4000/api/health' },
  { name: 'Frontend', url: process.env.FRONTEND_URL || 'http://localhost:3000' },
  { name: 'N8N',      url: process.env.N8N_URL       || 'http://localhost:5678/healthz' },
];

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// ── IST market hours check ────────────────────────────────
const isMarketHours = () => {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();                              // 0=Sun, 6=Sat
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const open  = 9  * 60 + 0;   // 09:00 IST
  const close = 15 * 60 + 45;  // 15:45 IST

  return day >= 1 && day <= 5 && mins >= open && mins <= close;
};

// ── Ping a single URL ─────────────────────────────────────
const ping = (service) => {
  return new Promise((resolve) => {
    const url    = new URL(service.url);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(service.url, { timeout: 8000 }, (res) => {
      console.log(`✅ [${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST] ${service.name} → ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`⚠️  ${service.name} ping failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏱  ${service.name} ping timed out`);
      req.destroy();
      resolve(false);
    });
  });
};

// ── Main ping loop ────────────────────────────────────────
const startKeepAlive = () => {
  console.log('🏓 Keep-alive service started');
  console.log(`   Pinging every ${PING_INTERVAL_MS / 60000} minutes during market hours`);
  console.log(`   Services: ${SERVICES.map(s => s.name).join(', ')}`);

  const run = async () => {
    if (!isMarketHours()) {
      const now = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      console.log(`💤 [${now} IST] Outside market hours — skipping ping`);
      return;
    }

    console.log(`\n🏓 Pinging ${SERVICES.length} services...`);
    await Promise.all(SERVICES.map(ping));
  };

  // Run immediately on start
  run();

  // Then run every PING_INTERVAL_MS
  setInterval(run, PING_INTERVAL_MS);
};

module.exports = { startKeepAlive };
