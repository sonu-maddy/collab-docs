const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/error");

// Services
const createAuthService = require("./services/authService");
const createDocumentService = require("./services/documentService");

// Controllers
const createAuthController = require("./controllers/authController");
const createDocumentController = require("./controllers/documentController");

// Routes
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");

/**
 * App factory.
 * Repositories are injected so the same app runs against MongoDB
 * in production and an in-memory store in tests.
 */
function createApp({ userRepo, docRepo }) {
  const app = express();

  // Initialize services
  const authService = createAuthService({ userRepo });

  const documentService = createDocumentService({
    docRepo,
    userRepo,
  });

  // Initialize controllers
  const authController = createAuthController({
    authService,
  });

  const documentController = createDocumentController({
    documentService,
  });

  // Global middleware
  app.use(helmet());

  app.use(
    cors({
      origin: env.clientOrigin,
    }),
  );

  app.use(
    express.json({
      limit: "3mb",
    }),
  );

  if (env.nodeEnv !== "test") {
    app.use(morgan("tiny"));
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Authentication rate limiter
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  if (env.nodeEnv !== "test") {
    app.use("/api/auth", authLimiter);
  }

  // API routes
  app.use("/api/auth", authRoutes({ authController }));

  app.use("/api/documents", documentRoutes({ documentController }));

  // Handle unknown API routes
  app.use("/api", notFound);

  // Serve frontend build in production
  if (env.clientDist && fs.existsSync(env.clientDist)) {
    app.use(express.static(env.clientDist));

    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(env.clientDist, "index.html"));
    });
  }

  // Global error handler
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
