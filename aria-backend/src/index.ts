import cors from 'cors';
import express from 'express';

import { testConnection } from './config/database';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Liveness en raíz para probes (sin prefijo de ingress).
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Montaje fijo bajo el prefijo del ingress (debe coincidir con Cloud Run / API Gateway).
app.use('/karia-svc/v2/', routes);

// Errores al final del pipeline.
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Servidor corriendo en el puerto ${env.port}`);
  void logDatabaseStatus();
});

async function logDatabaseStatus(): Promise<void> {
  if (!env.database.connectionString) {
    console.log('Base de datos: no configurada');
    return;
  }
  const status = await testConnection();
  console.log(
    status.success
      ? 'Base de datos: conectada'
      : `Base de datos: no disponible (${status.error})`,
  );
}
