const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');
const createAuthService = require('./services/authService');
const createDocumentService = require('./services/documentService');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

/**
 * App factory. Repositories are injected so the same app runs against MongoDB
 * in production and an in-memory store in tests.
 */
function createApp({ userRepo, docRepo }) {
  const app = express();
  const authService = createAuthService({ userRepo });
  const documentService = createDocumentService({ docRepo, userRepo });

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '3mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('tiny'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false });
  if (env.nodeEnv !== 'test') app.use('/api/auth', authLimiter);
  app.use('/api/auth', authRoutes({ authService }));
  app.use('/api/documents', documentRoutes({ documentService }));
  app.use('/api', notFound);

  // Optional single-service deploy: serve the built SPA from Express.
  if (env.clientDist && fs.existsSync(env.clientDist)) {
    app.use(express.static(env.clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(env.clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
