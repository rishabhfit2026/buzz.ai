import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, "../uploads");

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL
].filter(Boolean));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      try {
        const parsed = new URL(origin);
        const isLocalViteOrigin =
          parsed.protocol === "http:" &&
          parsed.port === "5173" &&
          (parsed.hostname === "localhost" ||
            parsed.hostname === "127.0.0.1" ||
            /^192\.168\.\d+\.\d+$/.test(parsed.hostname) ||
            /^10\.\d+\.\d+\.\d+$/.test(parsed.hostname) ||
            /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(parsed.hostname));

        if (allowedOrigins.has(origin) || isLocalViteOrigin) {
          return callback(null, true);
        }
      } catch {
        return callback(new Error("Invalid CORS origin."));
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsDirectory));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "buzz-ai-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error.", error: err.message });
});

export default app;
