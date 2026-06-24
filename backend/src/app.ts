import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sanitize } from 'express-mongo-sanitize';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/users/user.routes.js';
import workoutRouter from './modules/workouts/workout.routes.js';
import exerciseRouter from './modules/exercises/exercise.routes.js';

const app = express();

// Initialize Sentry
Sentry.init({
  dsn: env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  beforeSend(event) {
    if (event.request?.data) {
      const sensitiveKeys = ['password', 'token', 'authorization', 'email', 'cookie', 'refresh', 'access'];
      try {
        let data = typeof event.request.data === 'string' ? JSON.parse(event.request.data) : event.request.data;
        for (const key of Object.keys(data)) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            data[key] = '[REDACTED]';
          }
        }
        event.request.data = typeof event.request.data === 'string' ? JSON.stringify(data) : data;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    if (event.request?.headers) {
      if (event.request.headers['authorization']) event.request.headers['authorization'] = '[REDACTED]';
      if (event.request.headers['cookie']) event.request.headers['cookie'] = '[REDACTED]';
    }
    return event;
  }
});

// Sentry v8 automatically instruments Express when initialized.
// No manual request/tracing handlers are needed here.

// 2. Trust proxy (essential for rate limiting behind reverse proxies like Heroku/Render)
app.set('trust proxy', 1);

// 3. Security headers
app.use(helmet());

// 3. CORS — explicit origin list only, never '*' with credentials
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 4. Cookie parser for JID refresh token
app.use(cookieParser());

// 5. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 6. NoSQL injection prevention — strips $ and . from keys
app.use((req, _res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);
  next();
});

// 8. HTTP request logging (Winston)
app.use((req, _res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});


app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/ready', async (_req, res) => {
  const isReady = mongooseConnectionReadyState();
  if (isReady) {
    res.status(200).send('READY');
  } else {
    res.status(503).send('NOT READY');
  }
});

// Helper for check readiness
import mongoose from 'mongoose';
function mongooseConnectionReadyState() {
  return mongoose.connection.readyState === 1;
}

// 9. Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
  },
});
app.use('/api', globalLimiter);

// 10. Strict auth-route rate limit
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please wait.' },
  },
});
app.use('/api/v1/auth', authLimiter);

// 11. Route mounts
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/workouts', workoutRouter);
app.use('/api/v1/exercises', exerciseRouter);

// 12. Fallback route
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// 14. Sentry error handler (before your custom error handler)
Sentry.setupExpressErrorHandler(app);

// 15. Central error handler (always last)
app.use(errorHandler);

export default app;
