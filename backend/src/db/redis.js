const { createClient } = require('redis');

let client = null;

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set — running without Redis cache (in-memory fallback)');
    return;
  }
  try {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.warn('⚠️  Redis connection failed — running without cache:', err.message);
    client = null;
  }
};

const getRedis = () => client;

const setCache = async (key, value, ttlSeconds = 60) => {
  if (!client) return;
  try { await client.setEx(key, ttlSeconds, JSON.stringify(value)); } catch (_) {}
};

const getCache = async (key) => {
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (_) { return null; }
};

const delCache = async (key) => {
  if (!client) return;
  try { await client.del(key); } catch (_) {}
};

module.exports = { initRedis, getRedis, setCache, getCache, delCache };
