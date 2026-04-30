import fs from 'fs';
import path from 'path';
import { URL } from 'node:url';
import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

let pool: Pool | null = null;

/** TLS desde env (`DB_SSL_CA`, `DB_SSL_REJECT_UNAUTHORIZED`). */
function sslFromEnv(): PoolConfig['ssl'] | undefined {
  const { sslCaPath, sslRejectUnauthorized } = env.database;

  if (sslCaPath) {
    try {
      const resolved = path.isAbsolute(sslCaPath)
        ? sslCaPath
        : path.resolve(process.cwd(), sslCaPath);
      const ca = fs.readFileSync(resolved, 'utf8');
      const rejectUnauthorized =
        sslRejectUnauthorized !== 'false' && sslRejectUnauthorized !== '0';
      return { ca, rejectUnauthorized };
    } catch {
      // Sin log: el fallo aparecerá al primer query si hace falta.
    }
  }

  if (sslRejectUnauthorized === 'false' || sslRejectUnauthorized === '0') {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

/** Convierte `ConnectionString_Karia` en opciones de `pg.Pool` (sin depender del string crudo en runtime). */
function poolConfigFromUrl(): PoolConfig | null {
  const raw = env.database.connectionString?.trim();
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('ConnectionString_Karia no es una URL válida (postgresql://...)');
  }

  const host = parsed.hostname;
  if (!host) throw new Error('ConnectionString_Karia: falta el host');

  const database = parsed.pathname.replace(/^\//, '') || 'postgres';
  const port = parsed.port ? parseInt(parsed.port, 10) : 5432;
  const user = parsed.username;
  const password = parsed.password;

  const ssl = sslFromEnv();
  const sslmode = parsed.searchParams.get('sslmode')?.toLowerCase();
  const urlWantsTls =
    sslmode === 'require' || sslmode === 'verify-full' || sslmode === 'prefer';

  /** Si la URL pide TLS pero no hay `DB_SSL_CA`, en dev (`NODE_ENV` ≠ production) relajamos la CA para evitar `self-signed certificate in certificate chain`. En producción seguimos estrictos salvo `DB_SSL_REJECT_UNAUTHORIZED=false`. */
  let sslOption: PoolConfig['ssl'] | undefined = ssl;
  if (!sslOption && urlWantsTls) {
    const isProd = process.env.NODE_ENV === 'production';
    sslOption = isProd ? { rejectUnauthorized: true } : { rejectUnauthorized: false };
  }

  const config: PoolConfig = {
    host,
    port,
    user,
    password,
    database,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  if (sslOption) config.ssl = sslOption;

  return config;
}

export function getPool(): Pool | null {
  if (pool) return pool;

  const config = poolConfigFromUrl();
  if (!config) return null;

  pool = new Pool(config);
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>,
): Promise<QueryResult<T>> {
  const p = getPool();
  if (!p) throw new Error('Database not configured');
  return p.query<T>(text, params as unknown[] | undefined);
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

export async function testConnection(): Promise<ConnectionTestResult> {
  try {
    const p = getPool();
    if (!p) return { success: false, error: 'Database not configured' };
    await p.query('SELECT 1 AS ok');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
