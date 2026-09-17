const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    // Run schema migrations — creates tables if they don't exist
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username    VARCHAR(50) UNIQUE NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin','user','viewer')),
        is_active   BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        target_pct      DECIMAL(5,2) DEFAULT 0.5,
        sl_pct          DECIMAL(5,2) DEFAULT 1.5,
        trailing_pct    DECIMAL(5,2) DEFAULT 0.5,
        trading_start   TIME DEFAULT '09:15:00',
        trading_end     TIME DEFAULT '15:30:00',
        broker          VARCHAR(20) DEFAULT 'dhan',
        price_interval  INTEGER DEFAULT 5,
        is_active       BOOLEAN DEFAULT true,
        updated_by      UUID,
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        symbol          VARCHAR(20) NOT NULL,
        exchange        VARCHAR(10) DEFAULT 'NSE',
        ltp             DECIMAL(12,2) NOT NULL,
        signal          VARCHAR(10) DEFAULT 'BUY',
        scan_name       VARCHAR(255),
        alert_time      TIMESTAMPTZ,
        raw_payload     JSONB,
        processed       BOOLEAN DEFAULT false,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trades (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trade_id        VARCHAR(20) UNIQUE NOT NULL,
        alert_id        UUID REFERENCES alerts(id),
        symbol          VARCHAR(20) NOT NULL,
        exchange        VARCHAR(10) DEFAULT 'NSE',
        signal          VARCHAR(10) DEFAULT 'BUY',
        entry_price     DECIMAL(12,2) NOT NULL,
        entry_time      TIMESTAMPTZ NOT NULL,
        exit_price      DECIMAL(12,2),
        exit_time       TIMESTAMPTZ,
        current_price   DECIMAL(12,2),
        sl              DECIMAL(12,2) NOT NULL,
        initial_target  DECIMAL(12,2) NOT NULL,
        current_target  DECIMAL(12,2) NOT NULL,
        highest_price   DECIMAL(12,2),
        target_count    INTEGER DEFAULT 0,
        pnl             DECIMAL(12,2) DEFAULT 0,
        pnl_pct         DECIMAL(8,4) DEFAULT 0,
        scan_name       VARCHAR(255),
        status          VARCHAR(20) DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN','TARGET_HIT','TRAILING','STOP_LOSS_HIT','CLOSED')),
        exit_reason     VARCHAR(50),
        duration_mins   INTEGER,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trade_events (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trade_id    UUID REFERENCES trades(id) ON DELETE CASCADE,
        event_type  VARCHAR(50) NOT NULL,
        event_time  TIMESTAMPTZ DEFAULT NOW(),
        price       DECIMAL(12,2),
        old_sl      DECIMAL(12,2),
        new_sl      DECIMAL(12,2),
        old_target  DECIMAL(12,2),
        new_target  DECIMAL(12,2),
        pnl         DECIMAL(12,2),
        notes       TEXT
      );

      CREATE TABLE IF NOT EXISTS live_prices (
        symbol      VARCHAR(20) PRIMARY KEY,
        exchange    VARCHAR(10) DEFAULT 'NSE',
        ltp         DECIMAL(12,2),
        open        DECIMAL(12,2),
        high        DECIMAL(12,2),
        low         DECIMAL(12,2),
        close       DECIMAL(12,2),
        volume      BIGINT,
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trade_id    UUID REFERENCES trades(id),
        channel     VARCHAR(20) CHECK (channel IN ('telegram','whatsapp','email','push')),
        event_type  VARCHAR(50),
        message     TEXT,
        status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
        sent_at     TIMESTAMPTZ,
        error       TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID,
        action      VARCHAR(100),
        entity      VARCHAR(50),
        entity_id   UUID,
        ip_address  INET,
        details     JSONB,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_trades_symbol      ON trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_trades_status      ON trades(status);
      CREATE INDEX IF NOT EXISTS idx_trades_entry_time  ON trades(entry_time);
      CREATE INDEX IF NOT EXISTS idx_trade_events_trade ON trade_events(trade_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_symbol      ON alerts(symbol);
      CREATE INDEX IF NOT EXISTS idx_alerts_processed   ON alerts(processed);

      INSERT INTO settings (target_pct, sl_pct, trailing_pct, trading_start, trading_end, broker)
      VALUES (0.5, 1.5, 0.5, '09:15:00', '15:30:00', 'dhan')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ PostgreSQL connected & schema ready');
  } finally {
    client.release();
  }
};

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, initDB };
