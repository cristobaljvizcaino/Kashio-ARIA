/**
 * Database Connection Module - ARIA
 * Connects to Cloud SQL PostgreSQL via Unix socket (Cloud Run)
 * or via TCP for local development
 */

const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.ConnectionString_Karia;

  if (connectionString) {
    console.log('🔌 [DB] Connecting via ConnectionString_Karia');
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  } else {
    console.warn('⚠️ [DB] No ConnectionString_Karia set — database features disabled');
    return null;
  }

  pool.on('connect', () => {
    console.log('✅ [DB] Connected to Cloud SQL PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ [DB] Database pool error:', err.message);
  });

  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');
  const start = Date.now();
  const result = await p.query(text, params);
  const duration = Date.now() - start;
  console.log(`📊 [DB] Query executed in ${duration}ms — rows: ${result.rowCount}`);
  return result;
}

async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ [DB] Connection test passed:', result.rows[0].current_time);
    return { success: true, time: result.rows[0].current_time, version: result.rows[0].pg_version };
  } catch (error) {
    console.error('❌ [DB] Connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { getPool, query, testConnection };
