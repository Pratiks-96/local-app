import client from 'prom-client';

import { getLocationLabels, loadPostsByLocation, loadUsersByLocation } from './locationMetrics';



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



// App totals

export const usersTotalGauge = new client.Gauge({

  name: 'localconnect_users_total',

  help: 'Total registered users (active)',

});



export const postsTotalGauge = new client.Gauge({

  name: 'localconnect_posts_total',

  help: 'Total active posts',

});



/** Per place (city / area / society) — refreshed from DB every scrape */

export const usersByLocationGauge = new client.Gauge({

  name: 'localconnect_users_by_location',

  help: 'Active users per city, area, and society',

  labelNames: ['city', 'area', 'society'],

});



export const postsByLocationGauge = new client.Gauge({

  name: 'localconnect_posts_by_location',

  help: 'Active posts per city, area, and society',

  labelNames: ['city', 'area', 'society'],

});



/** Increments on each new registration / post (for growth over time) */

export const userRegistrationsCounter = new client.Counter({

  name: 'localconnect_user_registrations_total',

  help: 'User accounts created since server start',

  labelNames: ['city', 'area', 'society'],

});



export const postsCreatedCounter = new client.Counter({

  name: 'localconnect_posts_created_total',

  help: 'Posts created since server start',

  labelNames: ['city', 'area', 'society'],

});



export const dbHealthGauge = new client.Gauge({

  name: 'localconnect_db_up',

  help: '1 if database is reachable, 0 otherwise',

});



export const redisHealthGauge = new client.Gauge({

  name: 'localconnect_redis_up',

  help: '1 if Redis is reachable, 0 otherwise',

});



// Legacy alias

export const activeUsersGauge = usersTotalGauge;



export async function recordUserRegistration(locationId: string): Promise<void> {

  const labels = await getLocationLabels(locationId);

  userRegistrationsCounter.inc(labels);

}



export async function recordPostCreated(locationId: string): Promise<void> {

  const labels = await getLocationLabels(locationId);

  postsCreatedCounter.inc(labels);

}



export async function refreshAppMetrics(): Promise<void> {

  try {

    const { prisma } = await import('./prisma');

    const [users, posts, usersByLoc, postsByLoc] = await Promise.all([

      prisma.user.count({ where: { isActive: true } }),

      prisma.post.count({ where: { status: 'ACTIVE' } }),

      loadUsersByLocation(),

      loadPostsByLocation(),

    ]);



    usersTotalGauge.set(users);

    postsTotalGauge.set(posts);



    usersByLocationGauge.reset();

    for (const row of usersByLoc) {

      usersByLocationGauge.set(

        { city: row.city, area: row.area, society: row.society },

        row.count,

      );

    }



    postsByLocationGauge.reset();

    for (const row of postsByLoc) {

      postsByLocationGauge.set(

        { city: row.city, area: row.area, society: row.society },

        row.count,

      );

    }



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


