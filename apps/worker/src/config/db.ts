import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  mongoose.connection.on('connected', () => logger.info('Mongo connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'Mongo error'));
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
