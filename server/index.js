import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.js";
import eventRoutes from "./src/routes/events.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/dance", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
