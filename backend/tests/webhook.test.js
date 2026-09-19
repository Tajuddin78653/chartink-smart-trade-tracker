/**
 * tests/webhook.test.js — API tests for /api/webhook/chartink
 * Run with: npm test
 */

const request = require('supertest');

// Mock dependencies before requiring app
jest.mock('../src/db/postgres', () => ({
  query: jest.fn(),
}));
jest.mock('../src/db/redis', () => ({
  initRedis: jest.fn(),
  setCache: jest.fn(),
  getCache: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/services/tradeEngine', () => ({
  createTrade: jest.fn(),
  getSettings: jest.fn().mockResolvedValue({ target_pct: 1.0, sl_pct: 1.0, trailing_pct: 0.5 }),
  getActiveTrades: jest.fn().mockResolvedValue([]),
  processPriceUpdate: jest.fn(),
}));
jest.mock('../src/services/notificationService', () => ({
  sendNotification: jest.fn().mockResolvedValue(true),
}));
jest.mock('../src/services/keepAlive', () => ({
  startKeepAlive: jest.fn(),
}));
jest.mock('../src/services/priceMonitor', () => ({
  startPriceMonitor: jest.fn().mockResolvedValue(true),
  stopPriceMonitor: jest.fn(),
}));

const { query } = require('../src/db/postgres');
const { createTrade } = require('../src/services/tradeEngine');

let app;
beforeAll(() => {
  const { initDB } = require('../src/db/postgres');
  query.mockResolvedValue({ rows: [] });
  app = require('../src/index').app;
});

afterEach(() => jest.clearAllMocks());

// ── Webhook Tests ──────────────────────────────────────────────

describe('POST /api/webhook/chartink', () => {

  const validPayload = { symbol: 'RELIANCE', ltp: 2500, exchange: 'NSE' };
  const mockAlert    = { id: 'alert-uuid-1', symbol: 'RELIANCE', ltp: 2500 };
  const mockTrade    = { trade_id: 'TRD001', symbol: 'RELIANCE', entry_price: 2500, sl: 2475, current_target: 2525 };

  beforeEach(() => {
    query.mockResolvedValue({ rows: [mockAlert] });
    createTrade.mockResolvedValue(mockTrade);
  });

  test('✅ accepts valid payload without API key when WEBHOOK_API_KEY not set', async () => {
    delete process.env.WEBHOOK_API_KEY;
    const res = await request(app).post('/api/webhook/chartink').send(validPayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.trade_id).toBe('TRD001');
  });

  test('✅ accepts valid payload with correct API key', async () => {
    process.env.WEBHOOK_API_KEY = 'secret123';
    const res = await request(app)
      .post('/api/webhook/chartink')
      .set('x-api-key', 'secret123')
      .send(validPayload);
    expect(res.statusCode).toBe(201);
    delete process.env.WEBHOOK_API_KEY;
  });

  test('❌ rejects request with wrong API key', async () => {
    process.env.WEBHOOK_API_KEY = 'secret123';
    const res = await request(app)
      .post('/api/webhook/chartink')
      .set('x-api-key', 'wrongkey')
      .send(validPayload);
    expect(res.statusCode).toBe(401);
    delete process.env.WEBHOOK_API_KEY;
  });

  test('❌ rejects request with no API key when key is required', async () => {
    process.env.WEBHOOK_API_KEY = 'secret123';
    const res = await request(app).post('/api/webhook/chartink').send(validPayload);
    expect(res.statusCode).toBe(401);
    delete process.env.WEBHOOK_API_KEY;
  });

  test('❌ rejects missing symbol', async () => {
    const res = await request(app).post('/api/webhook/chartink').send({ ltp: 2500 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/symbol/);
  });

  test('❌ rejects missing ltp', async () => {
    const res = await request(app).post('/api/webhook/chartink').send({ symbol: 'RELIANCE' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/ltp/);
  });

  test('✅ symbol is uppercased', async () => {
    delete process.env.WEBHOOK_API_KEY;
    await request(app).post('/api/webhook/chartink').send({ symbol: 'reliance', ltp: 2500 });
    const insertCall = query.mock.calls.find(c => c[0].includes('INSERT INTO alerts'));
    expect(insertCall[1][0]).toBe('RELIANCE');
  });
});


// ── Trades Route Tests ─────────────────────────────────────────

describe('GET /api/trades', () => {

  beforeEach(() => {
    query.mockResolvedValue({ rows: [], count: 0 });
  });

  test('✅ returns trades list', async () => {
    query.mockResolvedValueOnce({ rows: [{ trade_id: 'TRD001' }] })
         .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const res = await request(app).get('/api/trades');
    expect(res.statusCode).toBe(200);
    expect(res.body.trades).toBeDefined();
  });

  test('✅ accepts valid limit', async () => {
    query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/trades?limit=10');
    expect(res.statusCode).toBe(200);
  });

  test('❌ rejects non-integer limit', async () => {
    const res = await request(app).get('/api/trades?limit=abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/integer/);
  });

  test('❌ rejects non-integer offset', async () => {
    const res = await request(app).get('/api/trades?offset=xyz');
    expect(res.statusCode).toBe(400);
  });

  test('✅ clamps limit to max 1000', async () => {
    query.mockResolvedValue({ rows: [] });
    await request(app).get('/api/trades?limit=9999');
    const limitParam = query.mock.calls[0][1].slice(-2)[0];
    expect(limitParam).toBe(1000);
  });

  test('✅ clamps negative offset to 0', async () => {
    query.mockResolvedValue({ rows: [] });
    await request(app).get('/api/trades?offset=-5');
    const offsetParam = query.mock.calls[0][1].slice(-2)[1];
    expect(offsetParam).toBe(0);
  });
});


// ── Health Check ───────────────────────────────────────────────

describe('GET /api/health', () => {
  test('✅ returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
