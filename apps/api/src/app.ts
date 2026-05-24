import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import assignmentsRoutes from './routes/assignments.routes';
import healthRoutes from './routes/health.routes';
import internalRoutes from './routes/internal.routes';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api/health', healthRoutes);
  app.use('/api/assignments', assignmentsRoutes);
  app.use('/internal', internalRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
