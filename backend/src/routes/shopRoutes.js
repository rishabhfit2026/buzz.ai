import express from "express";
import { store } from "../lib/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

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

router.post(
  "/",
  requireAuth,
  requireRole("shopkeeper"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  async (req, res) => {
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
      location: { state, city },
      logoUrl: req.files?.logo?.[0] ? `/uploads/${req.files.logo[0].filename}` : "",
      coverImageUrl: req.files?.coverImage?.[0]
        ? `/uploads/${req.files.coverImage[0].filename}`
        : ""
    });

    return res.status(201).json(shop);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create shop.", error: error.message });
  }
});

router.patch(
  "/:shopId/branding",
  requireAuth,
  requireRole("shopkeeper"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const shop = store.getShopByOwner(req.params.shopId, req.user.id);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found for this owner." });
      }

      const updates = {};

      if (req.body.name !== undefined) {
        updates.name = req.body.name;
      }

      if (req.body.description !== undefined) {
        updates.description = req.body.description;
      }

      if (req.body.category !== undefined) {
        updates.category = req.body.category;
      }

      if (req.files?.logo?.[0]) {
        updates.logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }

      if (req.files?.coverImage?.[0]) {
        updates.coverImageUrl = `/uploads/${req.files.coverImage[0].filename}`;
      }

      const updatedShop = store.updateShop(req.params.shopId, updates);
      return res.json(updatedShop);
    } catch (error) {
      return res.status(500).json({ message: "Unable to update shop branding.", error: error.message });
    }
  }
);

router.get("/:shopId/products", async (req, res) => {
  try {
    const products = store.getProductsByShop(req.params.shopId);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch products.", error: error.message });
  }
});

export default router;
