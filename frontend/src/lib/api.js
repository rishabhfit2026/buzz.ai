const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const UPLOADS_BASE_URL = (import.meta.env.VITE_SERVER_URL || "http://localhost:5000").replace(/\/$/, "");

const normalizeEntity = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeEntity);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, normalizeEntity(nested)])
  );

  if (!normalized.id && normalized._id) {
    normalized.id = normalized._id;
  }

  return normalized;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return normalizeEntity(data);
};

export const api = {
  uploadsBaseUrl: UPLOADS_BASE_URL,

  register(payload) {
    return request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  login(payload) {
    return request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  getShops(city) {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return request(`/shops${query}`);
  },

  getMyShops(token) {
    return request("/shops/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createShop(payload, token) {
    return request("/shops", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  },

  getProducts(shopId) {
    return request(`/shops/${shopId}/products`);
  },

  createProduct(formData, token) {
    return request("/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
  },

  getOrders(token) {
    return request("/orders/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  placeOrder(payload, token) {
    return request("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  },

  updateOrderStatus(orderId, status, token) {
    return request(`/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
  }
};
