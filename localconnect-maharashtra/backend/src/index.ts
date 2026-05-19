import http from 'http';
import app from './app';
import { config } from './config';
import { initSocket } from './socket';
import { getRedis } from './lib/redis';

const server = http.createServer(app);
initSocket(server);

async function start() {
  try {
    await getRedis().connect();
    console.log('Redis connected');
  } catch {
    console.warn('Redis unavailable - caching disabled');
  }

  server.listen(config.port, () => {
    console.log(`LocalConnect API running on port ${config.port}`);
    console.log(`Swagger docs: http://localhost:${config.port}/api/docs`);
  });
}

start();
