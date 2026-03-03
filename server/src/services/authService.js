import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function registerUser({ email, password, name, role }) {
  if (!email || !password || !role) {
    const err = new Error("email, password, role are required");
    err.status = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already used");
    err.status = 409;
    throw err;
  }

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
  return { user, token };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error("email and password required");
    err.status = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = signToken(user);
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };

  return { user: safeUser, token };
}
