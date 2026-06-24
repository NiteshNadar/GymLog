import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const redactLog = winston.format((info) => {
  const sensitiveKeys = ['password', 'token', 'authorization', 'email', 'cookie', 'refresh', 'access'];
  if (info.message && typeof info.message === 'object') {
    for (const key of Object.keys(info.message)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        (info.message as any)[key] = '[REDACTED]';
      }
    }
  }
  return info;
});

// Format for development (human-readable, colored)
const devFormat = combine(
  redactLog(),
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || (typeof message === 'object' ? JSON.stringify(message) : message)}`;
  })
);

// Format for production (structured JSON)
const prodFormat = combine(
  redactLog(),
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console()
  ]
});
