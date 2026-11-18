const AppError = require('../utils/AppError');

/** validate(schema, 'body'|'params'|'query') -> replaces req[source] with the parsed value. */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(AppError.badRequest(details[0]?.message || 'Invalid request', details));
  }
  Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
  next();
};

module.exports = validate;
