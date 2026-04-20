import mongoose from "mongoose";
import { store } from "../lib/store.js";

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
      console.log("MongoDB connected");
      return { mode: "mongo" };
    } catch (error) {
      console.warn(`MongoDB unavailable, falling back to local JSON storage: ${error.message}`);
    }
  }

  const filePath = store.init();
  console.log(`Using local JSON storage at ${filePath}`);
  return { mode: "json" };
};
