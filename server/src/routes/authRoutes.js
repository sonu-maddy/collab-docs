const { Router } = require("express");
const { z } = require("zod");

const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name cannot exceed 80 characters"),

  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),

  password: z.string().min(1, "Password is required"),
});

module.exports = ({ authController }) => {
  const router = Router();

  // Register user
  router.post("/register", validate(registerSchema), authController.register);

  // Login user
  router.post("/login", validate(loginSchema), authController.login);

  // Get logged-in user
  router.get("/me", requireAuth, authController.me);

  return router;
};
