import express from "express";
import { store } from "../lib/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { city, category } = req.query;
    const shops = store.getShops({ city, category });
    return res.json(shops);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch shops.", error: error.message });
  }
});

router.get("/mine", requireAuth, requireRole("shopkeeper"), async (req, res) => {
  try {
    const shops = store.getShopsByOwner(req.user.id);
    return res.json(shops);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch your shops.", error: error.message });
  }
});

router.post("/", requireAuth, requireRole("shopkeeper"), async (req, res) => {
  try {
    const { name, category, description, state, city } = req.body;

    if (!name || !category || !state || !city) {
      return res.status(400).json({ message: "Shop name, category, state, and city are required." });
    }

    const shop = store.createShop({
      ownerId: req.user.id,
      name,
      category,
      description,
      location: { state, city }
    });

    return res.status(201).json(shop);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create shop.", error: error.message });
  }
});

router.get("/:shopId/products", async (req, res) => {
  try {
    const products = store.getProductsByShop(req.params.shopId);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch products.", error: error.message });
  }
});

export default router;
