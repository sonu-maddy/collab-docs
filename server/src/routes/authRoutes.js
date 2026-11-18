const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const credentials = {
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
};
const registerSchema = z.object({ name: z.string().trim().min(1, 'Name is required').max(80), ...credentials });
const loginSchema = z.object({ email: credentials.email, password: z.string().min(1, 'Password is required') });

module.exports = ({ authService }) => {
  const r = Router();
  r.post('/register', validate(registerSchema), async (req, res) => res.status(201).json(await authService.register(req.body)));
  r.post('/login', validate(loginSchema), async (req, res) => res.json(await authService.login(req.body)));
  r.get('/me', requireAuth, async (req, res) => res.json({ user: await authService.me(req.userId) }));
  return r;
};
