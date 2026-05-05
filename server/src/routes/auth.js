import { Router } from "express";
import { register, login, googleRedirect, googleCallback } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

// GET /api/auth/google  — redirects user to Google consent screen
router.get("/google", googleRedirect);

// GET /api/auth/google/callback  — Google redirects back here with ?code=
router.get("/google/callback", googleCallback);

export default router;
