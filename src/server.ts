import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { TaskModel } from './models/task.model';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  await TaskModel.init();
  const server = createApp().listen(env.PORT, () =>
    logger.info({ port: env.PORT }, 'API listening'),
  );

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Startup failed');
  process.exit(1);
});
