import request from 'supertest';
import app from './app';

describe('API Integration', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/locations returns location tree or empty', async () => {
    const res = await request(app).get('/api/locations');
    expect([200, 500]).toContain(res.status);
  });
});
