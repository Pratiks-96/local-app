import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../lib/metrics';

/** Normalize route path for metric labels (avoid high cardinality from IDs) */
function normalizeRoute(req: Request): string {
  if (req.route?.path) {
    return req.baseUrl + req.route.path;
  }
  const path = req.path || req.url.split('?')[0];
  // Replace UUIDs with :id
  return path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ':id',
  );
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics' || req.path === '/api/health') {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestDuration.observe(labels, durationSec);
    httpRequestTotal.inc(labels);
  });

  next();
}
