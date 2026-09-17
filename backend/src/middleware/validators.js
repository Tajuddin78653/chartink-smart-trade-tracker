const Joi = require('joi');

const validateWebhook = (req, res, next) => {
  const schema = Joi.object({
    symbol:     Joi.string().alphanum().max(20).required(),
    exchange:   Joi.string().valid('NSE','BSE').default('NSE'),
    ltp:        Joi.number().positive().required(),
    signal:     Joi.string().valid('BUY','SELL').default('BUY'),
    scan_name:  Joi.string().max(255).optional(),
    alert_time: Joi.string().optional(),
  }).options({ allowUnknown: true });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

const validateSettings = (req, res, next) => {
  const schema = Joi.object({
    target_pct:     Joi.number().min(0.1).max(10).required(),
    sl_pct:         Joi.number().min(0.1).max(10).required(),
    trailing_pct:   Joi.number().min(0.1).max(10).required(),
    trading_start:  Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    trading_end:    Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    broker:         Joi.string().valid('dhan','upstox','zerodha','angel','fyers').required(),
    price_interval: Joi.number().integer().min(1).max(60).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { validateWebhook, validateSettings };
