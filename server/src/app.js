import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";

import { sanitizeBody } from "./middleware/sanitize.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import studioRoutes from "./routes/studios.js";
import cvRoutes from "./routes/cv.js";

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests, please try again later.", status: 429 } },
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(sanitizeBody);



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/studios", studioRoutes);
app.use("/api/cv", cvRoutes);

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
