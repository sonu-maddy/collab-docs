const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const signToken = (userId) => jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

/** Verifies the Bearer token and sets req.userId. */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(AppError.unauthorized());
  try {
    req.userId = jwt.verify(token, env.jwtSecret).sub;
    next();
  } catch {
    next(AppError.unauthorized('Session expired, please log in again'));
  }
}

module.exports = { requireAuth, signToken };
