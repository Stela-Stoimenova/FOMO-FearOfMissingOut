import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { sanitizeBody } from "./middleware/sanitize.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import studioRoutes from "./routes/studios.js";
import cvRoutes from "./routes/cv.js";
import agencyRoutes from "./routes/agency.js";

const app = express();

app.use(helmet());

// Per-route rate limits: strict on auth, generous on read endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many login attempts, please try again later.", status: 429 } },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests, please try again later.", status: 429 } },
});

app.use(globalLimiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5174",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(sanitizeBody);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/studios", studioRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/agency", agencyRoutes);

// Centralized error handler (must be last)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      status,
    },
  });
});

export default app;
