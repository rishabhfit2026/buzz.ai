import express from "express";
import { store } from "../lib/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("shopkeeper"), upload.single("image"), async (req, res) => {
  try {
    const { shopId, name, price, description, stock } = req.body;

    if (!shopId || !name || !price) {
      return res.status(400).json({ message: "Shop, product name, and price are required." });
    }

    const shop = store.getShopByOwner(shopId, req.user.id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found for this owner." });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const product = store.createProduct({
      shopId,
      name,
      price: Number(price),
      description,
      stock: stock ? Number(stock) : 100,
      imageUrl
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create product.", error: error.message });
  }
});

router.patch("/:productId", requireAuth, requireRole("shopkeeper"), async (req, res) => {
  try {
    const product = store.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const shop = store.getShopByOwner(product.shopId, req.user.id);
    if (!shop) {
      return res.status(403).json({ message: "You cannot edit this product." });
    }

    const updates = {};
    ["name", "description"].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.price !== undefined) {
      updates.price = Number(req.body.price);
    }

    if (req.body.stock !== undefined) {
      updates.stock = Number(req.body.stock);
    }

    const updated = store.updateProduct(req.params.productId, updates);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update product.", error: error.message });
  }
});

export default router;
