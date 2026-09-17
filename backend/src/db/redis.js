const { createClient } = require('redis');

let client;

const initRedis = async () => {
  client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  console.log('✅ Redis connected');
};

const getRedis = () => client;

const setCache = (key, value, ttlSeconds = 60) =>
  client.setEx(key, ttlSeconds, JSON.stringify(value));

const getCache = async (key) => {
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
};

const delCache = (key) => client.del(key);

module.exports = { initRedis, getRedis, setCache, getCache, delCache };
