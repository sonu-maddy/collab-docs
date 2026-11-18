const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const { signToken } = require('../middleware/auth');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

module.exports = function createAuthService({ userRepo }) {
  return {
    async register({ name, email, password }) {
      if (await userRepo.findByEmail(email)) throw AppError.conflict('An account with this email already exists');
      const user = await userRepo.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
      return { user: publicUser(user), token: signToken(user.id) };
    },

    async login({ email, password }) {
      const user = await userRepo.findByEmail(email, { withPassword: true });
      // Same message for unknown email and wrong password: don't reveal which accounts exist.
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw AppError.unauthorized('Invalid email or password');
      }
      return { user: publicUser(user), token: signToken(user.id) };
    },

    async me(userId) {
      const user = await userRepo.findById(userId);
      if (!user) throw AppError.unauthorized('Account no longer exists');
      return publicUser(user);
    },
  };
};
