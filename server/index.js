import "dotenv/config";

const required = ["DATABASE_URL", "JWT_SECRET"];
for (const k of required) {
    if (!process.env[k]) {
        console.error(`[startup] Missing required environment variable: ${k}`);
        process.exit(1);
    }
}

import app from "./src/app.js";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
