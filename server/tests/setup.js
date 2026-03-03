// Loads .env.test before any tests run
import { config } from "dotenv";

export default async function globalSetup() {
	config({ path: ".env.test" });
}
