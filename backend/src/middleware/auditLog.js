const { query } = require('../db/postgres');

const auditLog = (action, entity) => async (req, res, next) => {
  res.on('finish', async () => {
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, entity, ip_address, details)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          req.user?.id || null,
          action,
          entity,
          req.ip,
          JSON.stringify({ method: req.method, path: req.path, status: res.statusCode })
        ]
      );
    } catch (_) {}
  });
  next();
};

module.exports = { auditLog };
