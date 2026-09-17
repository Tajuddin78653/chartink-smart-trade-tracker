require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const cors      = require('cors');
const helmet    = require('helmet');
const winston   = require('winston');

const webhookRoutes   = require('./routes/webhook');
const tradeRoutes     = require('./routes/trades');
const authRoutes      = require('./routes/auth');
const settingsRoutes  = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');

const { initDB }            = require('./db/postgres');
const { initRedis }         = require('./db/redis');
const { startPriceMonitor } = require('./services/priceMonitor');
const { authenticate, authorize } = require('./middleware/auth');
const { apiLimiter, webhookLimiter, authLimiter } = require('./middleware/rateLimiter');

// ── Logger ────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
});

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST'] }
});

// ── Security Middleware ───────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false, // handled by nginx
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// ── Rate Limiting ─────────────────────────────────────────
app.use('/api/auth',    authLimiter);
app.use('/api/webhook', webhookLimiter);
app.use('/api/',        apiLimiter);

// ── Attach io to request ──────────────────────────────────
app.use((req, _res, next) => { req.io = io; next(); });

// ── Public Routes (no auth) ───────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/webhook', webhookRoutes);          // Chartink posts here — no auth
app.get('/api/health',  (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), time: new Date() }));

// ── Protected Routes (JWT required) ──────────────────────
app.use('/api/trades',    authenticate, tradeRoutes);
app.use('/api/settings',  authenticate, authorize('admin'), settingsRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Socket.IO ─────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`WS client connected: ${socket.id}`);
  socket.on('disconnect', () => logger.info(`WS disconnected: ${socket.id}`));
});

// ── Startup ───────────────────────────────────────────────
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
