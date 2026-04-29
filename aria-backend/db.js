/**
 * Database connection — PostgreSQL over TCP/TLS (`ConnectionString_Karia`).
 * TLS opcional: DB_SSL_CA (PEM) o DB_SSL_REJECT_UNAUTHORIZED=false (solo dev).
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let pool = null;

/** Evita el warning de pg-connection-string con sslmode=require|prefer|… */
function withPgSslCompatParam(connectionString) {
  if (!connectionString || /uselibpqcompat\s*=/i.test(connectionString)) return connectionString;
  if (!/sslmode\s*=/i.test(connectionString)) return connectionString;
  const sep = connectionString.includes('?') ? '&' : '?';
  return `${connectionString}${sep}uselibpqcompat=true`;
}

function buildSslConfigFromEnv() {
  const caPath = process.env.DB_SSL_CA && process.env.DB_SSL_CA.trim();
  const rejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED;

  if (caPath) {
    try {
      const resolved = path.isAbsolute(caPath) ? caPath : path.resolve(process.cwd(), caPath);
      const ca = fs.readFileSync(resolved, 'utf8');
      const rejectUnauthorized = rejectUnauthorizedEnv !== 'false' && rejectUnauthorizedEnv !== '0';
      return { ca, rejectUnauthorized };
    } catch {
      // Sin log: el fallo aparecerá al primer query si hace falta
    }
  }

  if (rejectUnauthorizedEnv === 'false' || rejectUnauthorizedEnv === '0') {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

function getPool() {
  if (pool) return pool;

  const raw = process.env.ConnectionString_Karia;
  if (!raw) return null;

  const connectionString = withPgSslCompatParam(raw.trim());
  const ssl = buildSslConfigFromEnv();
  const poolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  if (ssl) poolConfig.ssl = ssl;

  pool = new Pool(poolConfig);
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');
  return p.query(text, params);
}

/** Prueba de conexión sin logs (el caller decide qué imprimir). */
async function testConnection() {
  try {
    const p = getPool();
    if (!p) return { success: false, error: 'Database not configured' };
    await p.query('SELECT 1 AS ok');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { getPool, query, testConnection };
