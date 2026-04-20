import express from "express";
import { store } from "../lib/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "customer") {
      const orders = store.getOrdersForCustomer(req.user.id);
      return res.json(orders);
    }

    const orders = store.getOrdersForShopOwner(req.user.id);
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch orders.", error: error.message });
  }
});

router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { shopId, items, deliveryCity, notes } = req.body;

    if (!shopId || !Array.isArray(items) || items.length === 0 || !deliveryCity) {
      return res.status(400).json({ message: "Shop, items, and delivery city are required." });
    }

    const shop = store.getShopById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const productMap = new Map(
      store.getProductsByShop(shopId).map((product) => [product.id, product])
    );

    const normalizedItems = items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new Error(`Invalid product in cart: ${item.productId}`);
      }

      const quantity = Number(item.quantity) || 1;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      };
    });

    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = store.createOrder({
      userId: req.user.id,
      shopId,
      items: normalizedItems,
      deliveryCity,
      notes,
      totalAmount
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Unable to place order.", error: error.message });
  }
});

router.patch("/:orderId/status", requireAuth, requireRole("shopkeeper"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = store.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const shop = store.getShopByOwner(order.shopId, req.user.id);
    if (!shop) {
      return res.status(403).json({ message: "You cannot update this order." });
    }

    const updatedOrder = store.updateOrder(req.params.orderId, { status });
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update order.", error: error.message });
  }
});

export default router;
