const { Pool } = require('pg');
const winston = require('winston');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const initDB = async () => {
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  console.log('✅ PostgreSQL connected');
};

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, initDB };
