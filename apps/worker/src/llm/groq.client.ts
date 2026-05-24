import OpenAI from 'openai';
import { env } from '../config/env';

export const deepseek = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
  timeout: env.DEEPSEEK_TIMEOUT_MS,
});

export const DEEPSEEK_MODEL = env.DEEPSEEK_MODEL;
