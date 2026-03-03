import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/dance", (req, res) => {
    res.json({ ok: true, message: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

export default app;
