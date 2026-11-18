const User = require('../models/User');

const toEntity = (u) => u && { id: String(u._id), name: u.name, email: u.email, passwordHash: u.passwordHash };

/**
 * Persistence boundary for users. Services depend on this interface only,
 * so tests can swap in an in-memory implementation (see tests/helpers).
 */
module.exports = {
  async create({ name, email, passwordHash }) {
    return toEntity(await User.create({ name, email, passwordHash }));
  },
  async findByEmail(email, { withPassword = false } = {}) {
    const q = User.findOne({ email: email.toLowerCase() });
    if (withPassword) q.select('+passwordHash');
    return toEntity(await q.lean());
  },
  async findById(id) {
    return toEntity(await User.findById(id).lean());
  },
  async findByIds(ids) {
    return (await User.find({ _id: { $in: ids } }).lean()).map(toEntity);
  },
};
