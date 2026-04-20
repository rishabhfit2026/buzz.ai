import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["customer", "shopkeeper"],
      required: true
    },
    location: {
      state: { type: String, trim: true },
      city: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

