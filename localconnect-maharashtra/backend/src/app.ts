import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware } from './middleware/metrics';
import { register, refreshAppMetrics } from './lib/metrics';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import locationsRoutes from './routes/locations.routes';
import postsRoutes from './routes/posts.routes';
import messagesRoutes from './routes/messages.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminRoutes from './routes/admin.routes';
import searchRoutes from './routes/search.routes';
import googleAuthRoutes from './routes/google-auth.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost', 'http://localhost:80'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
// Prometheus metrics (no rate limit, no auth — scrape from internal network only)
app.get('/metrics', async (_req, res) => {
  try {
    await refreshAppMetrics();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(String(err));
  }
});

app.use(metricsMiddleware);
app.use('/api', limiter);

// Local file uploads for development
if (config.useLocalStorage) {
  const uploadDir = path.resolve(config.localUploadDir);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'localconnect-api', timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

app.use(errorHandler);

export default app;
