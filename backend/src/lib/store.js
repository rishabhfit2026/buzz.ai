import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../../data");
const dataFile = path.join(dataDirectory, "db.json");

const defaultData = {
  users: [],
  shops: [],
  products: [],
  orders: []
};

fs.mkdirSync(dataDirectory, { recursive: true });

const ensureDataFile = () => {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
  }
};

const readData = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
};

const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

const now = () => new Date().toISOString();

const withTimestamps = (doc, existing) => ({
  ...doc,
  createdAt: existing?.createdAt || now(),
  updatedAt: now()
});

export const store = {
  init() {
    ensureDataFile();
    return dataFile;
  },

  createUser(user) {
    const data = readData();
    const record = withTimestamps(
      {
        id: randomUUID(),
        ...user
      },
      null
    );
    data.users.push(record);
    writeData(data);
    return record;
  },

  findUserByEmail(email) {
    const data = readData();
    return data.users.find((user) => user.email === email.toLowerCase()) || null;
  },

  findUserById(id) {
    const data = readData();
    return data.users.find((user) => user.id === id) || null;
  },

  createShop(shop) {
    const data = readData();
    const record = withTimestamps(
      {
        id: randomUUID(),
        isActive: true,
        ...shop
      },
      null
    );
    data.shops.push(record);
    writeData(data);
    return record;
  },

  getShops({ city, category } = {}) {
    const data = readData();
    return data.shops
      .filter((shop) => shop.isActive)
      .filter((shop) =>
        city ? shop.location.city.toLowerCase() === String(city).toLowerCase() : true
      )
      .filter((shop) =>
        category ? shop.category.toLowerCase().includes(String(category).toLowerCase()) : true
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((shop) => {
        const owner = data.users.find((user) => user.id === shop.ownerId);
        return {
          ...shop,
          ownerId: owner
            ? {
                id: owner.id,
                name: owner.name,
                email: owner.email,
                phone: owner.phone
              }
            : null
        };
      });
  },

  getShopsByOwner(ownerId) {
    const data = readData();
    return data.shops
      .filter((shop) => shop.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getShopById(shopId) {
    const data = readData();
    return data.shops.find((shop) => shop.id === shopId) || null;
  },

  getShopByOwner(shopId, ownerId) {
    const data = readData();
    return data.shops.find((shop) => shop.id === shopId && shop.ownerId === ownerId) || null;
  },

  createProduct(product) {
    const data = readData();
    const record = withTimestamps(
      {
        id: randomUUID(),
        stock: 100,
        ...product
      },
      null
    );
    data.products.push(record);
    writeData(data);
    return record;
  },

  getProductsByShop(shopId) {
    const data = readData();
    return data.products
      .filter((product) => product.shopId === shopId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getProductById(productId) {
    const data = readData();
    return data.products.find((product) => product.id === productId) || null;
  },

  updateProduct(productId, updates) {
    const data = readData();
    const index = data.products.findIndex((product) => product.id === productId);
    if (index === -1) {
      return null;
    }

    data.products[index] = withTimestamps(
      {
        ...data.products[index],
        ...updates
      },
      data.products[index]
    );
    writeData(data);
    return data.products[index];
  },

  createOrder(order) {
    const data = readData();
    const record = withTimestamps(
      {
        id: randomUUID(),
        status: "pending",
        ...order
      },
      null
    );
    data.orders.push(record);
    writeData(data);
    return record;
  },

  getOrdersForCustomer(userId) {
    const data = readData();
    return data.orders
      .filter((order) => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((order) => ({
        ...order,
        shopId: data.shops.find((shop) => shop.id === order.shopId) || null
      }));
  },

  getOrdersForShopOwner(ownerId) {
    const data = readData();
    const ownedShops = data.shops.filter((shop) => shop.ownerId === ownerId);
    const shopMap = new Map(ownedShops.map((shop) => [shop.id, shop]));

    return data.orders
      .filter((order) => shopMap.has(order.shopId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((order) => ({
        ...order,
        userId: (() => {
          const user = data.users.find((candidate) => candidate.id === order.userId);
          return user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
              }
            : null;
        })(),
        shopId: shopMap.get(order.shopId) || null
      }));
  },

  getOrderById(orderId) {
    const data = readData();
    return data.orders.find((order) => order.id === orderId) || null;
  },

  updateOrder(orderId, updates) {
    const data = readData();
    const index = data.orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return null;
    }

    data.orders[index] = withTimestamps(
      {
        ...data.orders[index],
        ...updates
      },
      data.orders[index]
    );
    writeData(data);
    return data.orders[index];
  }
};
