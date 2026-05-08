import path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  quiet: true,
});

/**
 * Configuración centralizada del proceso. Solo lee variables de entorno;
 * el resto del código debe importar desde aquí en lugar de tocar `process.env`.
 */
export const env = {
  /** Local: 3000 por defecto. En Cloud Run/Docker suele inyectarse `PORT=8080`. */
  port: Number(process.env.PORT || 3000),

  database: {
    connectionString: process.env.ConnectionString_Karia || '',
    sslCaPath: process.env.DB_SSL_CA?.trim() || '',
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED,
  },

  storage: {
    bucketName: process.env.GCS_BUCKET_NAME || 'karia-library-files',
  },

  kashios: {
    /** Base URL del API de iniciativas de KashioOS, p.ej. https://kpdlc-svc-app-XXXX.us-east4.run.app */
    baseUrl: (process.env.KASHIOS_API_BASE_URL || '').replace(/\/+$/, ''),
    /** Bearer token con permisos de lectura sobre `/api/v1/initiatives/:id`. */
    token: process.env.KASHIOS_API_TOKEN || '',
    /** Timeout de la llamada saliente (ms). */
    timeoutMs: Number(process.env.KASHIOS_TIMEOUT_MS || 15000),
  },

} as const;

export type AppEnv = typeof env;
