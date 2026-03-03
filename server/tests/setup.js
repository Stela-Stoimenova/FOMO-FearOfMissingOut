// Loads .env.test before any tests run
import { config } from "dotenv";
config({ path: ".env.test" });
