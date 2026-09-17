require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const webhookRoutes = require('./routes/webhook');
const tradeRoutes   = require('./routes/trades');
const authRoutes    = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');

const { initDB }        = require('./db/postgres');
const { initRedis }     = require('./db/redis');
const { startPriceMonitor } = require('./services/priceMonitor');

// ── Logger ────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

// ── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10kb' }));

// Rate limiter
app.use('/api/', rateLimit({ windowMs: 60000, max: 100, message: 'Too many requests' }));
app.use('/api/webhook', rateLimit({ windowMs: 60000, max: 200 }));

// Attach socket.io to request
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ────────────────────────────────────────────────
app.use('/api/webhook',   webhookRoutes);
app.use('/api/trades',    tradeRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Socket.IO ─────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => logger.info(`Client disconnected: ${socket.id}`));
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await initDB();
    await initRedis();
    await startPriceMonitor(io);
    server.listen(PORT, () => logger.info(`🚀 Backend running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
})();

module.exports = { app, io };
