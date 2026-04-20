import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    stock: {
      type: Number,
      default: 100,
      min: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

