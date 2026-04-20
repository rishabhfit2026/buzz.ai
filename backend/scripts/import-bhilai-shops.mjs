import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.resolve(__dirname, "../data/db.json");

const USER_AGENT = "BuzzAISeeder/1.0";
const SHOP_LIMIT = Number(process.argv[2] || 1000);
const REQUEST_TIMEOUT_MS = 12000;

const categoryMap = {
  supermarket: "Grocery",
  convenience: "Grocery",
  grocery: "Grocery",
  greengrocer: "Grocery",
  bakery: "Bakery",
  pharmacy: "Pharmacy",
  chemist: "Pharmacy",
  restaurant: "Restaurant",
  cafe: "Cafe",
  fast_food: "Restaurant",
  marketplace: "Marketplace",
  mall: "Mall",
  yes: "General",
  clothes: "Fashion",
  mobile_phone: "Electronics",
  electronics: "Electronics",
  hardware: "Hardware",
  stationery: "Stationery",
  books: "Books",
  optician: "Optical",
  cosmetics: "Beauty",
  beauty: "Beauty",
  tea: "Cafe"
};

const productSeeds = {
  Grocery: [
    ["Daily Essentials Combo", 299],
    ["Fresh Fruits Basket", 199],
    ["Household Value Pack", 449]
  ],
  Bakery: [
    ["Fresh Bread Loaf", 60],
    ["Tea Time Cookies", 120],
    ["Celebration Cake", 550]
  ],
  Pharmacy: [
    ["Health Essentials Kit", 249],
    ["Personal Care Bundle", 179],
    ["First Aid Box", 399]
  ],
  Restaurant: [
    ["Chef Special Meal", 249],
    ["Family Combo", 499],
    ["Quick Snack Box", 149]
  ],
  Cafe: [
    ["Signature Coffee", 140],
    ["Cold Brew Bottle", 180],
    ["Cafe Snack Combo", 220]
  ],
  Electronics: [
    ["Mobile Accessory Pack", 399],
    ["Charging Cable", 199],
    ["Bluetooth Earbuds", 999]
  ],
  Fashion: [
    ["Everyday Wear Combo", 799],
    ["Seasonal Picks", 999],
    ["Accessories Bundle", 349]
  ],
  Stationery: [
    ["Student Starter Kit", 249],
    ["Office Essentials Pack", 299],
    ["Notebook Combo", 180]
  ],
  Books: [
    ["Bestseller Bundle", 499],
    ["Exam Prep Set", 399],
    ["Children Story Pack", 299]
  ],
  Marketplace: [
    ["Mixed Local Picks", 299],
    ["Family Shopping Basket", 699],
    ["Weekend Essentials", 399]
  ],
  Hardware: [
    ["Home Repair Kit", 599],
    ["Toolbox Starter Pack", 899],
    ["Electric Fix Combo", 499]
  ],
  Beauty: [
    ["Personal Care Combo", 349],
    ["Glow Essentials Kit", 499],
    ["Salon Basics Pack", 299]
  ],
  default: [
    ["Popular Item", 199],
    ["Best Seller", 299],
    ["Value Combo", 399]
  ]
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url, options = {}, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      clearTimeout(timeout);
      return payload;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) {
        throw error;
      }
      await sleep(1000 * (attempt + 1));
    }
  }
};

const readDb = () => JSON.parse(fs.readFileSync(dataFile, "utf8"));
const writeDb = (db) => fs.writeFileSync(dataFile, `${JSON.stringify(db, null, 2)}\n`);

const inferCategory = (tags) => {
  const raw = tags.shop || tags.amenity || "default";
  return categoryMap[raw] || raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const inferDescription = (tags, category) => {
  const parts = [];
  if (tags.brand) {
    parts.push(`Brand: ${tags.brand}`);
  }
  if (tags["addr:street"]) {
    parts.push(`Street: ${tags["addr:street"]}`);
  }
  if (tags.phone) {
    parts.push(`Phone: ${tags.phone}`);
  }
  if (tags.opening_hours) {
    parts.push(`Hours: ${tags.opening_hours}`);
  }
  if (parts.length === 0) {
    parts.push(`Local ${category.toLowerCase()} store discovered from OpenStreetMap data in Bhilai.`);
  }
  return parts.join(" • ");
};

const getBhilaiBoundingBox = async () => {
  const searchUrl =
    "https://nominatim.openstreetmap.org/search?q=Bhilai%2C%20Chhattisgarh%2C%20India&format=jsonv2&limit=1";
  console.log("Resolving Bhilai bounding box from Nominatim...");
  const data = await fetchJson(searchUrl);
  if (!data.length) {
    throw new Error("Could not locate Bhilai via Nominatim.");
  }
  return data[0].boundingbox;
};

const fetchOsmPlaces = async (bbox) => {
  const query = `[out:json][timeout:90];
(
  node["shop"](${bbox});
  way["shop"](${bbox});
  relation["shop"](${bbox});
  node["amenity"~"restaurant|cafe|fast_food|pharmacy|marketplace"](${bbox});
  way["amenity"~"restaurant|cafe|fast_food|pharmacy|marketplace"](${bbox});
  relation["amenity"~"restaurant|cafe|fast_food|pharmacy|marketplace"](${bbox});
);
out center tags;`;

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter"
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Overpass endpoint: ${endpoint}`);
      const data = await fetchJson(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: query
        },
        1
      );
      return data.elements || [];
    } catch (error) {
      console.warn(`Overpass endpoint failed: ${endpoint} -> ${error.message}`);
    }
  }

  throw new Error("All Overpass endpoints failed.");
};

const normalizePlaces = (elements) => {
  const deduped = new Map();

  for (const element of elements) {
    const tags = element.tags || {};
    const name = tags.name?.trim();
    if (!name) {
      continue;
    }

    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    const key = `${name.toLowerCase()}|${(tags["addr:street"] || "").toLowerCase()}`;

    if (!deduped.has(key)) {
      deduped.set(key, {
        name,
        category: inferCategory(tags),
        description: inferDescription(tags, inferCategory(tags)),
        location: {
          state: "Chhattisgarh",
          city: "Bhilai",
          latitude: lat || null,
          longitude: lon || null,
          street: tags["addr:street"] || "",
          postcode: tags["addr:postcode"] || ""
        },
        source: {
          provider: "OpenStreetMap",
          osmType: element.type,
          osmId: element.id
        }
      });
    }
  }

  return Array.from(deduped.values()).slice(0, SHOP_LIMIT);
};

const ensureImporterUser = (db) => {
  let user = db.users.find((entry) => entry.email === "imports@buzz.ai");
  if (!user) {
    const timestamp = new Date().toISOString();
    user = {
      id: randomUUID(),
      name: "Buzz.ai Imports",
      email: "imports@buzz.ai",
      phone: "",
      password: "",
      role: "shopkeeper",
      location: {
        state: "Chhattisgarh",
        city: "Bhilai"
      },
      createdAt: timestamp,
      updatedAt: timestamp
    };
    db.users.push(user);
  }
  return user;
};

const seedProducts = (db, shop) => {
  const timestamp = new Date().toISOString();
  const items = productSeeds[shop.category] || productSeeds.default;

  for (const [name, price] of items) {
    db.products.push({
      id: randomUUID(),
      shopId: shop.id,
      name,
      price,
      description: `${name} from ${shop.name}`,
      imageUrl: "",
      stock: 100,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
};

const main = async () => {
  const boundingbox = await getBhilaiBoundingBox();
  const bbox = [
    boundingbox[0],
    boundingbox[2],
    boundingbox[1],
    boundingbox[3]
  ].join(",");

  const elements = await fetchOsmPlaces(bbox);
  console.log(`Fetched ${elements.length} raw OSM elements.`);
  const places = normalizePlaces(elements);

  const db = readDb();
  const importer = ensureImporterUser(db);
  const existingSourceIds = new Set(
    db.shops
      .map((shop) => shop.source?.osmId)
      .filter(Boolean)
      .map(String)
  );

  let imported = 0;
  for (const place of places) {
    if (existingSourceIds.has(String(place.source.osmId))) {
      continue;
    }

    const timestamp = new Date().toISOString();
    const shop = {
      id: randomUUID(),
      ownerId: importer.id,
      name: place.name,
      category: place.category,
      description: place.description,
      location: place.location,
      isActive: true,
      source: place.source,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.shops.push(shop);
    seedProducts(db, shop);
    imported += 1;
  }

  writeDb(db);
  console.log(
    JSON.stringify(
      {
        discovered: places.length,
        imported,
        totalShops: db.shops.length,
        totalProducts: db.products.length
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
