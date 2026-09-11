import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/error-handler';
import { metricsMiddleware, registry } from './middlewares/metrics';
import { notFound } from './middlewares/not-found';
import { requestId } from './middlewares/request-id';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId);
  app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: req.id }) }));
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );
  app.get('/metrics', async (_req, res) => {
    res.setHeader('content-type', registry.contentType);
    res.send(await registry.metrics());
  });

  const specPath = path.resolve(process.cwd(), 'openapi.yaml');
  if (fs.existsSync(specPath)) {
    const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }
  app.use('/api/v1', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
