export const CORS_CONFIG = {
  origin: [
    'http://lokal-ai.com:3000',
    'http://localhost:3000',
    'http://localhost:3002',
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Accept, Authorization',
  credentials: true,
};
