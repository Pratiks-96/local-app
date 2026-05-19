import client from 'prom-client';

// Default metrics: CPU, memory, event loop, GC
client.collectDefaultMetrics({
  prefix: 'localconnect_',
  labels: { service: 'backend' },
});

export const register = client.register;

// HTTP request metrics
export const httpRequestDuration = new client.Histogram({
  name: 'localconnect_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'localconnect_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// App-specific gauges
export const activeUsersGauge = new client.Gauge({
  name: 'localconnect_active_users',
  help: 'Number of active users in database',
});

export const postsTotalGauge = new client.Gauge({
  name: 'localconnect_posts_total',
  help: 'Total number of posts',
});

export const dbHealthGauge = new client.Gauge({
  name: 'localconnect_db_up',
  help: '1 if database is reachable, 0 otherwise',
});

export const redisHealthGauge = new client.Gauge({
  name: 'localconnect_redis_up',
  help: '1 if Redis is reachable, 0 otherwise',
});

export async function refreshAppMetrics(): Promise<void> {
  try {
    const { prisma } = await import('./prisma');
    const [users, posts] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.post.count({ where: { status: 'ACTIVE' } }),
    ]);
    activeUsersGauge.set(users);
    postsTotalGauge.set(posts);
    dbHealthGauge.set(1);
  } catch {
    dbHealthGauge.set(0);
  }

  try {
    const { getRedis } = await import('./redis');
    const redis = getRedis();
    await redis.ping();
    redisHealthGauge.set(1);
  } catch {
    redisHealthGauge.set(0);
  }
}
