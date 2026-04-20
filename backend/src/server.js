import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Buzz.ai API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
