require('dotenv').config({ quiet: true });

const isProd = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab_docs',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024,
  // When set, Express also serves the built React app (single-service deploy).
  clientDist: process.env.CLIENT_DIST || '',
  // Create demo users + a shared doc on boot (handy for reviewer deployments).
  seedDemoData: process.env.SEED_DEMO_DATA === 'true',
};

if (isProd && env.jwtSecret === 'dev-only-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
