import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(value) => value.length > 0, "At least one product is required."]
    },
    deliveryCity: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

