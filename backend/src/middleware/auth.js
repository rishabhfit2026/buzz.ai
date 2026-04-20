import jwt from "jsonwebtoken";
import { store } from "../lib/store.js";

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = store.findUserById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You are not allowed to perform this action." });
  }

  next();
};
