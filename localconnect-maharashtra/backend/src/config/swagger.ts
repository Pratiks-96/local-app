import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LocalConnect Maharashtra API',
      version: '1.0.0',
      description: 'Hyperlocal social networking API for Maharashtra communities',
    },
    servers: [
      { url: `http://localhost:${config.port}`, description: 'Development' },
      { url: '/api', description: 'Production (via Nginx)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Locations' },
      { name: 'Posts' },
      { name: 'Messages' },
      { name: 'Marketplace' },
      { name: 'Notifications' },
      { name: 'Admin' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
