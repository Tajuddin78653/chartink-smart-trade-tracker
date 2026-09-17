const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests — slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook limiter — higher for Chartink
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Webhook rate limit exceeded' },
});

// Auth limiter — strict for login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts — try again later' },
});

module.exports = { apiLimiter, webhookLimiter, authLimiter };
