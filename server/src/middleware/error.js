const multer = require('multer');
const AppError = require('../utils/AppError');

const notFound = (_req, _res, next) => next(AppError.notFound('Route not found'));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.code === 11000) return res.status(409).json({ error: 'Already exists' });
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

module.exports = { notFound, errorHandler };
