import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password, role are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? null,
        role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(500).json({ message: "Register failed", error: String(err) });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };

    return res.json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: String(err) });
  }
});

export default router;
