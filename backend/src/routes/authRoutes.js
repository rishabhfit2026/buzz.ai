import express from "express";
import bcrypt from "bcryptjs";
import { store } from "../lib/store.js";
import { createToken } from "../utils/createToken.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role, state, city } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required." });
    }

    if (!["customer", "shopkeeper"].includes(role)) {
      return res.status(400).json({ message: "Role must be either customer or shopkeeper." });
    }

    const existingUser = store.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = store.createUser({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
      location: { state, city }
    });

    const token = createToken(user.id);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to register user.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = store.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = createToken(user.id);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to log in.", error: error.message });
  }
});

export default router;
