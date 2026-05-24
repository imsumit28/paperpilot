import { Router } from 'express';
import mongoose from 'mongoose';
import { redisQueue } from '../config/redis';

const router = Router();

router.get('/', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let redisOk = false;
  try {
    const pong = await redisQueue.ping();
    redisOk = pong === 'PONG';
  } catch {
    redisOk = false;
  }
  res.status(mongoOk && redisOk ? 200 : 503).json({
    ok: mongoOk && redisOk,
    services: { mongo: mongoOk, redis: redisOk },
    at: new Date().toISOString(),
  });
});

export default router;
