
module.exports = ({ authService }) => {

  // Register user
  const register = async (req, res) => {
    const result = await authService.register(req.body);

    return res.status(201).json(result);
  };

  // Login user
  const login = async (req, res) => {
    const result = await authService.login(req.body);

    return res.status(200).json(result);
  };

  // Get current user
  const me = async (req, res) => {
    const user = await authService.me(req.userId);

    return res.status(200).json({
      user,
    });
  };

  return {
    register,
    login,
    me,
  };
};
