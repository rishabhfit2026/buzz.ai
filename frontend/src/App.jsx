import { useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";

const cities = ["Bhilai", "Durg", "Raipur", "Bilaspur", "Nagpur"];
const localityOptions = [
  "All Bhilai",
  "Risali",
  "Nehru Nagar",
  "Vaishali Nagar",
  "Supela",
  "Smriti Nagar",
  "Kohka",
  "Bhilai Nagar",
  "Hudco",
  "Junwani",
  "Durg"
];
const primaryCategories = [
  "All",
  "Grocery",
  "Restaurant",
  "Pharmacy",
  "Bakery",
  "Electronics",
  "Cafe",
  "Fashion",
  "Stationery",
  "Books"
];

const categoryThemes = {
  Grocery: { label: "Daily needs", accent: "from-[#fff5cc] to-[#ffe088]" },
  Restaurant: { label: "Fast meals", accent: "from-[#ffe2cf] to-[#ffb777]" },
  Pharmacy: { label: "Health stores", accent: "from-[#daf6ea] to-[#8bd4ac]" },
  Bakery: { label: "Fresh baked", accent: "from-[#ffe9d2] to-[#ffcf8b]" },
  Electronics: { label: "Devices and parts", accent: "from-[#dfe9ff] to-[#abc7ff]" },
  Cafe: { label: "Coffee and snacks", accent: "from-[#efe3d8] to-[#d8b18d]" },
  Fashion: { label: "Apparel picks", accent: "from-[#ffe4f0] to-[#ffb4d1]" },
  Stationery: { label: "School and office", accent: "from-[#e6f8ff] to-[#9bdcf7]" },
  Books: { label: "Readers corner", accent: "from-[#f0ecff] to-[#c3b9ff]" },
  General: { label: "Local stores", accent: "from-[#f5f5f5] to-[#dedede]" }
};

const homepageTiles = [
  { title: "Top Offers", subtitle: "Daily deals", category: "All", badge: "TO" },
  { title: "Grocery", subtitle: "Daily essentials", category: "Grocery", badge: "GR" },
  { title: "Restaurants", subtitle: "Meals nearby", category: "Restaurant", badge: "RS" },
  { title: "Pharmacy", subtitle: "Health stores", category: "Pharmacy", badge: "PH" },
  { title: "Electronics", subtitle: "Devices and parts", category: "Electronics", badge: "EL" },
  { title: "Bakery", subtitle: "Fresh baked", category: "Bakery", badge: "BK" },
  { title: "Fashion", subtitle: "Apparel", category: "Fashion", badge: "FS" },
  { title: "Books", subtitle: "Local readers", category: "Books", badge: "BO" }
];

const promoPanels = [
  {
    title: "Bhilai Summer Deals",
    copy: "Browse nearby shops in one marketplace and open seller storefronts instantly.",
    category: "All",
    accent: "from-[#0f4dbb] via-[#2874f0] to-[#6fc1ff]"
  },
  {
    title: "Nehru Nagar Picks",
    copy: "Spot active grocery, pharmacy, and electronics shops from locality-rich address data.",
    category: "Grocery",
    accent: "from-[#fff1bd] via-[#ffe082] to-[#ffcb4c]"
  },
  {
    title: "Seller Growth Zone",
    copy: "Turn local merchants into visible storefronts, not hidden admin records.",
    category: "Electronics",
    accent: "from-[#dbeafe] via-[#a9caff] to-[#7aa2ff]"
  }
];

const demoTrackingOrder = {
  id: "demo-tracking-order",
  status: "confirmed",
  deliveryCity: "Bhilai",
  totalAmount: 289,
  shopId: {
    id: "demo-shop",
    name: "Buzz Express Mart",
    category: "Grocery",
    location: { city: "Bhilai", street: "Civic Center" }
  },
  items: [
    { productId: "demo-item-1", name: "Daily Essentials Combo", price: 289, quantity: 1 }
  ]
};

const initialAuthForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  state: "Chhattisgarh",
  city: "Bhilai"
};

const initialShopForm = {
  name: "",
  category: "Grocery",
  description: "",
  state: "Chhattisgarh",
  city: "Bhilai"
};

const initialProductForm = {
  shopId: "",
  name: "",
  price: "",
  description: "",
  stock: "100",
  image: null
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchQuery(value) {
  const genericTerms = new Set(["seller", "sellers", "shop", "shops", "store", "stores", "market", "marketplace"]);

  return normalizeText(value)
    .split(" ")
    .filter((term) => term && !genericTerms.has(term))
    .join(" ");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getDeliveryProgress(status) {
  const progressMap = {
    pending: 0.22,
    confirmed: 0.62,
    delivered: 1
  };

  return progressMap[status] || 0.12;
}

function getDeliveryEta(status) {
  if (status === "pending") {
    return "Preparing route • rider assignment pending";
  }

  if (status === "confirmed") {
    return "On the way • estimated 12-18 mins";
  }

  return "Delivered • route completed";
}

function getDeliverySteps(status) {
  const steps = [
    { key: "store", label: "Store confirmed", done: true },
    { key: "route", label: "Rider on route", done: status === "confirmed" || status === "delivered" },
    { key: "drop", label: "Delivered", done: status === "delivered" }
  ];

  return steps;
}

function findLocality(shop) {
  const source = normalizeText(
    `${shop.location?.street || ""} ${shop.description || ""} ${shop.name || ""} ${shop.location?.city || ""}`
  );

  const matches = [
    ["Nehru Nagar", ["nehru nagar"]],
    ["Vaishali Nagar", ["vaishali nagar"]],
    ["Risali", ["risali"]],
    ["Supela", ["supela"]],
    ["Smriti Nagar", ["smriti nagar"]],
    ["Kohka", ["kohka"]],
    ["Bhilai Nagar", ["bhilai nagar", "sector", "civic center"]],
    ["Hudco", ["hudco"]],
    ["Junwani", ["junwani"]],
    ["Durg", ["durg"]]
  ];

  for (const [label, keywords] of matches) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return label;
    }
  }

  return shop.location?.city || "Bhilai";
}

function getShopTheme(category) {
  return categoryThemes[category] || categoryThemes.General;
}

function getShopSummary(shop) {
  const pieces = [];

  if (shop.location?.street) {
    pieces.push(shop.location.street);
  }

  if (shop.ownerId?.name) {
    pieces.push(`Seller: ${shop.ownerId.name}`);
  }

  if (pieces.length === 0) {
    pieces.push("Visible on the Buzz.ai Bhilai marketplace");
  }

  return pieces.join(" • ");
}

function getShopInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "BZ";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function ShopLogo({ shop, size = "md" }) {
  const sizeClass =
    size === "sm"
      ? "h-12 w-12 text-sm"
      : size === "lg"
        ? "h-16 w-16 text-lg"
        : "h-14 w-14 text-base";

  const theme = getShopTheme(shop.category);

  return (
    <div
      className={`flex items-center justify-center rounded-[18px] border border-white/70 bg-gradient-to-r ${theme.accent} ${sizeClass} font-black tracking-[0.08em] text-slate-800 shadow-[0_10px_25px_rgba(15,23,42,0.08)]`}
      aria-label={`${shop.name} logo`}
      title={shop.name}
    >
      {getShopInitials(shop.name)}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authState, setAuthState] = useState(() => {
    const raw = window.localStorage.getItem("buzz-auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  const [selectedCity, setSelectedCity] = useState("Bhilai");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocality, setSelectedLocality] = useState("All Bhilai");
  const [searchQuery, setSearchQuery] = useState("");
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [shopForm, setShopForm] = useState(initialShopForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [myShops, setMyShops] = useState([]);

  const currentUser = authState.user;
  const isAuthenticated = Boolean(authState.token && currentUser);
  const isShopkeeper = currentUser?.role === "shopkeeper";
  const isCustomer = currentUser?.role === "customer";

  useEffect(() => {
    window.localStorage.setItem("buzz-auth", JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    loadMarketplace(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      if (isShopkeeper) {
        loadMyShops();
      }
    }
  }, [isAuthenticated, isShopkeeper]);

  const dynamicCategories = useMemo(() => {
    const discovered = Array.from(
      new Set(shops.map((shop) => shop.category).filter(Boolean).sort((a, b) => a.localeCompare(b)))
    );
    return Array.from(new Set([...primaryCategories, ...discovered]));
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesCategory =
        selectedCategory === "All" ||
        normalizeText(shop.category).includes(normalizeText(selectedCategory));
      const locality = findLocality(shop);
      const matchesLocality =
        selectedLocality === "All Bhilai" ||
        normalizeText(locality) === normalizeText(selectedLocality);
      const needle = normalizeSearchQuery(searchQuery);
      const haystack = normalizeText(
        `${shop.name} ${shop.category} ${shop.description || ""} ${shop.location?.street || ""} ${locality} ${shop.ownerId?.name || ""} seller shop store marketplace`
      );

      return matchesCategory && matchesLocality && (!needle || haystack.includes(needle));
    });
  }, [searchQuery, selectedCategory, selectedLocality, shops]);

  const localityCounts = useMemo(() => {
    const counts = new Map();

    for (const shop of shops) {
      const locality = findLocality(shop);
      counts.set(locality, (counts.get(locality) || 0) + 1);
    }

    return counts;
  }, [shops]);

  const visibleLocalities = useMemo(() => {
    const dynamic = Array.from(localityCounts.keys()).sort((a, b) => {
      return (localityCounts.get(b) || 0) - (localityCounts.get(a) || 0);
    });
    return Array.from(new Set([...localityOptions, ...dynamic]));
  }, [localityCounts]);

  const featuredShops = filteredShops.slice(0, 8);
  const spotlightShops = filteredShops.slice(0, 4);
  const marketplaceProducts = products.slice(0, 12);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const topOfferShops = filteredShops.slice(0, 6);
  const groceryShops = filteredShops.filter((shop) => normalizeText(shop.category).includes("grocery")).slice(0, 6);
  const electronicsShops = filteredShops
    .filter((shop) => normalizeText(shop.category).includes("electronics"))
    .slice(0, 6);
  const foodShops = filteredShops
    .filter((shop) => ["restaurant", "cafe", "bakery"].some((entry) => normalizeText(shop.category).includes(entry)))
    .slice(0, 6);
  const latestCustomerOrder = !isShopkeeper && orders.length ? orders[0] : null;
  const liveTrackingPreview =
    latestCustomerOrder ||
    (selectedShop
      ? {
          id: `preview-${selectedShop.id}`,
          status: cart.length > 0 ? "confirmed" : "pending",
          deliveryCity: selectedCity,
          totalAmount: cartTotal,
          shopId: selectedShop,
          items: cart
        }
      : demoTrackingOrder);

  useEffect(() => {
    if (selectedShop && !filteredShops.some((shop) => shop.id === selectedShop.id)) {
      setSelectedShop(null);
      setProducts([]);
    }
  }, [filteredShops, selectedShop]);

  const loadMarketplace = async (city) => {
    try {
      const data = await api.getShops(city);
      setShops(data);
      setSelectedShop(null);
      setProducts([]);
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const loadProducts = async (shop) => {
    try {
      setSelectedShop(shop);
      const data = await api.getProducts(shop.id);
      setProducts(data);
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const loadMyShops = async () => {
    try {
      const data = await api.getMyShops(authState.token);
      setMyShops(data);
      if (data.length && !productForm.shopId) {
        setProductForm((current) => ({ ...current, shopId: data[0].id }));
      }
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders(authState.token);
      setOrders(data);
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const data =
        mode === "register"
          ? await api.register(authForm)
          : await api.login({ email: authForm.email, password: authForm.password });

      setAuthState(data);
      setSelectedCity(data.user?.location?.city || "Bhilai");
      setFeedback(`Welcome back, ${data.user.name}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      await api.createShop(shopForm, authState.token);
      setShopForm({ ...initialShopForm, city: selectedCity });
      await loadMyShops();
      await loadMarketplace(selectedCity);
      setFeedback("Shop launched successfully.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const formData = new FormData();
      Object.entries(productForm).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      await api.createProduct(formData, authState.token);
      setProductForm((current) => ({
        ...current,
        name: "",
        price: "",
        description: "",
        stock: "100",
        image: null
      }));

      if (selectedShop && selectedShop.id === productForm.shopId) {
        await loadProducts(selectedShop);
      }

      setFeedback("Product added to your catalog.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }
      ];
    });
  };

  const placeOrder = async () => {
    if (!selectedShop || cart.length === 0) {
      setFeedback("Select a shop and add products to the cart first.");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      await api.placeOrder(
        {
          shopId: selectedShop.id,
          deliveryCity: selectedCity,
          items: cart
        },
        authState.token
      );
      setCart([]);
      await loadOrders();
      setFeedback("Order placed successfully.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setLoading(true);
    try {
      await api.updateOrderStatus(orderId, status, authState.token);
      await loadOrders();
      setFeedback(`Order updated to ${status}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthState({ token: "", user: null });
    setCart([]);
    setOrders([]);
    setMyShops([]);
    setSelectedShop(null);
    setProducts([]);
    setFeedback("Logged out.");
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <MarketplaceHeader
        cartCount={cart.length}
        currentUser={currentUser}
        logout={logout}
        searchQuery={searchQuery}
        selectedCity={selectedCity}
        setSearchQuery={setSearchQuery}
      />

      <main className="mx-auto max-w-[1480px] px-4 pb-10 pt-4 md:px-6 xl:px-8">
        <CategoryRail categories={dynamicCategories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

        <HeroSection
          cartTotal={cartTotal}
          featuredCount={filteredShops.length}
          selectedCity={selectedCity}
          selectedLocality={selectedLocality}
          setSelectedCategory={setSelectedCategory}
        />

        <HomepageTiles setSelectedCategory={setSelectedCategory} />

        <PromoStage loadProducts={loadProducts} panels={promoPanels} featuredShops={spotlightShops} />

        {feedback ? (
          <div className="mt-4 rounded-[20px] border border-[#cfd9e8] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        ) : null}

        {filteredShops.length === 0 ? (
          <NoResultsNotice
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedLocality={selectedLocality}
            setSearchQuery={setSearchQuery}
            setSelectedCategory={setSelectedCategory}
            setSelectedLocality={setSelectedLocality}
          />
        ) : null}

        <LocalityRow
          localityCounts={localityCounts}
          selectedLocality={selectedLocality}
          setSelectedLocality={setSelectedLocality}
          visibleLocalities={visibleLocalities}
        />

        <TopDealsSection
          loadProducts={loadProducts}
          sectionTitle="Top offers on Buzz.ai"
          sectionCopy="Merchants that should feel visible on the homepage, not buried in a simple list."
          shops={topOfferShops}
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <ShopShelf
            title="Best of Grocery"
            subtitle="Daily-needs sellers around Bhilai"
            shops={groceryShops}
            loadProducts={loadProducts}
          />
          <ShopShelf
            title="Electronics For You"
            subtitle="Local electronics and accessory shops"
            shops={electronicsShops}
            loadProducts={loadProducts}
          />
          <ShopShelf
            title="Food and Bakery"
            subtitle="Restaurants, cafes, and baked picks"
            shops={foodShops}
            loadProducts={loadProducts}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <section className="space-y-6">
            <MerchantSpotlight featuredShops={spotlightShops} loadProducts={loadProducts} selectedShop={selectedShop} />

            {!isAuthenticated ? (
              <AuthCard
                authForm={authForm}
                loading={loading}
                mode={mode}
                onChange={setAuthForm}
                onSubmit={handleAuthSubmit}
                setMode={setMode}
              />
            ) : (
              <AccountStrip currentUser={currentUser} orders={orders.length} shops={myShops.length} />
            )}

            <MarketplaceControls
              selectedCategory={selectedCategory}
              selectedCity={selectedCity}
              setSelectedCategory={setSelectedCategory}
              setSelectedCity={setSelectedCity}
            />

            <ShopsGrid
              featuredShops={featuredShops}
              loadProducts={loadProducts}
              selectedShop={selectedShop}
            />

            {selectedShop ? (
              <ProductsSection
                addToCart={addToCart}
                products={marketplaceProducts}
                selectedShop={selectedShop}
                user={currentUser}
              />
            ) : (
              <EmptySelection />
            )}

            {!isShopkeeper && liveTrackingPreview ? (
              <DeliveryRouteShowcase
                order={liveTrackingPreview}
                selectedShop={selectedShop}
                hasActiveOrder={Boolean(latestCustomerOrder)}
              />
            ) : null}

            {isAuthenticated ? (
              <OrdersSection
                isShopkeeper={isShopkeeper}
                orders={orders}
                updateOrderStatus={updateOrderStatus}
              />
            ) : null}
          </section>

          <aside className="space-y-6">
            {!isShopkeeper && liveTrackingPreview ? (
              <DeliverySidebarCard
                order={liveTrackingPreview}
                hasActiveOrder={Boolean(latestCustomerOrder)}
              />
            ) : null}

            {isCustomer ? (
              <CartCard cart={cart} cartTotal={cartTotal} loading={loading} placeOrder={placeOrder} />
            ) : null}

            {isShopkeeper ? (
              <>
                <ShopFormCard
                  loading={loading}
                  onChange={setShopForm}
                  onSubmit={handleCreateShop}
                  shopForm={shopForm}
                />
                <ProductFormCard
                  loading={loading}
                  myShops={myShops}
                  onChange={setProductForm}
                  onSubmit={handleCreateProduct}
                  productForm={productForm}
                />
              </>
            ) : null}

            <RoadmapCard />
            <DataSourcingCard />
          </aside>
        </div>
      </main>
    </div>
  );
}

function HomepageTiles({ setSelectedCategory }) {
  return (
    <section className="mt-6 rounded-[28px] border border-[#dbe5f2] bg-white px-4 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {homepageTiles.map((tile) => (
          <button
            key={tile.title}
            className="rounded-[22px] border border-[#e1eaf5] bg-[#fbfdff] px-3 py-4 text-center transition hover:border-[#b7cae5] hover:bg-[#f5f9ff]"
            onClick={() => setSelectedCategory(tile.category)}
            type="button"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#ffe351_0%,#ffd56d_100%)] text-sm font-black text-[#1559d6] shadow-[0_10px_25px_rgba(255,204,0,0.2)]">
              {tile.badge}
            </div>
            <div className="mt-3 text-sm font-black text-slate-900">{tile.title}</div>
            <div className="mt-1 text-xs text-slate-500">{tile.subtitle}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function NoResultsNotice({
  searchQuery,
  selectedCategory,
  selectedLocality,
  setSearchQuery,
  setSelectedCategory,
  setSelectedLocality
}) {
  return (
    <section className="mt-4 rounded-[24px] border border-[#dbe5f2] bg-[#fffdf6] px-5 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            No visible results
          </div>
          <p className="mt-2 text-sm text-slate-700">
            No shops match the current filters.
            {searchQuery ? ` Search is "${searchQuery}".` : ""}
            {selectedCategory !== "All" ? ` Category is ${selectedCategory}.` : ""}
            {selectedLocality !== "All Bhilai" ? ` Locality is ${selectedLocality}.` : ""}
          </p>
        </div>
        <button
          className="button-soft"
          onClick={() => {
            setSearchQuery("");
            setSelectedCategory("All");
            setSelectedLocality("All Bhilai");
          }}
          type="button"
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}

function PromoStage({ panels, featuredShops, loadProducts }) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_0.85fr]">
      <div className={`overflow-hidden rounded-[32px] bg-gradient-to-r ${panels[0].accent} p-7 text-white shadow-[0_30px_80px_rgba(40,116,240,0.28)]`}>
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Marketplace Banner
          </div>
          <h2 className="mt-5 font-display text-4xl leading-tight md:text-5xl">{panels[0].title}</h2>
          <p className="mt-4 text-sm leading-7 text-white/85 md:text-base">{panels[0].copy}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {featuredShops.slice(0, 3).map((shop) => (
              <button
                key={shop.id}
                className="rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-[#1559d6]"
                onClick={() => loadProducts(shop)}
                type="button"
              >
                Open {shop.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {panels.slice(1).map((panel) => (
          <button
            key={panel.title}
            className={`rounded-[28px] bg-gradient-to-r ${panel.accent} p-6 text-left shadow-[0_20px_60px_rgba(15,23,42,0.12)]`}
            onClick={() => {
              const match = featuredShops.find((shop) =>
                normalizeText(shop.category).includes(normalizeText(panel.category))
              );
              if (match) {
                loadProducts(match);
              }
            }}
            type="button"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700/70">
              Promo Panel
            </div>
            <h3 className="mt-2 text-2xl font-black text-slate-900">{panel.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{panel.copy}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function TopDealsSection({ sectionTitle, sectionCopy, shops, loadProducts }) {
  return (
    <section className="mt-6 rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Featured strip
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{sectionTitle}</h2>
          <p className="mt-2 text-sm text-slate-500">{sectionCopy}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {shops.map((shop) => {
          return (
            <button
              key={shop.id}
              className="rounded-[24px] border border-[#e1eaf5] bg-white p-4 text-left transition hover:border-[#bdd0ea] hover:bg-[#f8fbff]"
              onClick={() => loadProducts(shop)}
              type="button"
            >
              <div className="flex h-24 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_100%)]">
                <ShopLogo shop={shop} size="lg" />
              </div>
              <div className="mt-4 text-sm font-black text-slate-900">{shop.name}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1559d6]">
                {findLocality(shop)}
              </div>
              <div className="mt-2 text-xs text-slate-500">{shop.category}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ShopShelf({ title, subtitle, shops, loadProducts }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Shop shelf</div>
      <h3 className="mt-2 text-2xl font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

      <div className="mt-5 space-y-3">
        {shops.length === 0 ? (
          <div className="rounded-[20px] border border-[#e1eaf5] bg-[#f8fbff] px-4 py-6 text-sm text-slate-500">
            No shops visible for this category in the current filter.
          </div>
        ) : null}

        {shops.map((shop) => (
          <button
            key={shop.id}
            className="flex w-full items-center gap-3 rounded-[20px] border border-[#e1eaf5] bg-[#fbfdff] p-3 text-left transition hover:border-[#bdd0ea] hover:bg-[#f4f8ff]"
            onClick={() => loadProducts(shop)}
            type="button"
          >
            <ShopLogo shop={shop} size="md" />
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-slate-900">{shop.name}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1559d6]">
                {findLocality(shop)}
              </div>
              <div className="mt-1 truncate text-xs text-slate-500">{shop.category}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MarketplaceHeader({
  currentUser,
  selectedCity,
  searchQuery,
  setSearchQuery,
  logout,
  cartCount
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#d9e4f2] bg-[#ffffffea] backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-4 md:px-6 xl:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-[22px] bg-[#ffe351] px-4 py-3 shadow-[0_10px_25px_rgba(255,204,0,0.3)]">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                Buzz.ai
              </div>
              <div className="text-lg font-black text-[#0056d2]">Local Market</div>
            </div>
            <div className="hidden min-w-[220px] rounded-[22px] border border-[#dbe5f2] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Serving now
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {selectedCity} marketplace with Bhilai-first merchant coverage
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 lg:max-w-3xl">
            <div className="relative flex-1">
              <input
                className="w-full rounded-[22px] border border-[#c8d7ea] bg-[#f8fbff] px-5 py-4 text-sm text-slate-800 outline-none transition focus:border-[#2874f0] focus:bg-white"
                placeholder="Search sellers, localities, products, and categories"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {currentUser ? (
                <div className="rounded-[18px] border border-[#dbe5f2] bg-white px-4 py-3 text-sm shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
                  <div className="font-semibold text-slate-900">{currentUser.name}</div>
                  <div className="text-xs text-slate-500">
                    {currentUser.role} • {currentUser.location?.city || "Bhilai"}
                  </div>
                </div>
              ) : (
                <div className="rounded-[18px] border border-[#dbe5f2] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
                  Account
                </div>
              )}

              <div className="rounded-[18px] border border-[#dbe5f2] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
                Cart {cartCount}
              </div>

              {currentUser ? (
                <button className="button-soft" onClick={logout} type="button">
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function CategoryRail({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <section className="mt-1 rounded-[28px] border border-[#dbe5f2] bg-white px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => {
          const theme = getShopTheme(category);
          return (
            <button
              key={category}
              className={`min-w-[150px] rounded-[22px] border px-4 py-4 text-left transition ${
                selectedCategory === category
                  ? "border-[#2874f0] bg-[#edf4ff] shadow-[0_10px_30px_rgba(40,116,240,0.16)]"
                  : "border-[#e3ebf5] bg-white hover:border-[#b7cae5] hover:bg-[#f8fbff]"
              }`}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              <div className={`h-10 rounded-2xl bg-gradient-to-r ${theme.accent}`} />
              <div className="mt-3 text-sm font-bold text-slate-900">{category}</div>
              <div className="mt-1 text-xs text-slate-500">{theme.label}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HeroSection({ selectedCity, featuredCount, cartTotal, selectedLocality, setSelectedCategory }) {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
      <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f4dbb_0%,#2874f0_48%,#6fc1ff_100%)] px-6 py-7 text-white shadow-[0_30px_80px_rgba(40,116,240,0.28)] md:px-8 md:py-8">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
          <span className="rounded-full border border-white/20 px-3 py-1">Bhilai first</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Marketplace UI</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Seller discovery</span>
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Browse Bhilai’s shops the way a real marketplace should feel.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
          Buzz.ai is moving from a plain dashboard to a discovery-first shopping surface. Customers
          can browse sellers by locality like Risali, Nehru Nagar, Vaishali Nagar, Supela, and Durg,
          then open each store as a marketplace storefront.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {["Grocery", "Restaurant", "Pharmacy", "Electronics"].map((category) => (
            <button
              key={category}
              className="rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-[#1559d6] shadow-[0_12px_30px_rgba(7,30,78,0.18)]"
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              Shop {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
        <MetricCard label="Serving city" value={selectedCity} note="Current marketplace view" />
        <MetricCard label="Locality focus" value={selectedLocality} note="Live Bhilai cluster filter" />
        <MetricCard label="Visible sellers" value={String(featuredCount)} note={`Cart value ${formatCurrency(cartTotal)}`} />
      </div>
    </section>
  );
}

function MetricCard({ label, value, note }) {
  return (
    <div className="rounded-[28px] border border-[#dbe5f2] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{note}</div>
    </div>
  );
}

function LocalityRow({ visibleLocalities, selectedLocality, setSelectedLocality, localityCounts }) {
  return (
    <section className="mt-6 rounded-[28px] border border-[#dbe5f2] bg-white px-4 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Bhilai localities
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Browse by neighborhood cluster</h2>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {visibleLocalities.map((locality) => (
          <button
            key={locality}
            className={`min-w-fit rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedLocality === locality
                ? "border-[#2874f0] bg-[#edf4ff] text-[#1559d6]"
                : "border-[#dbe5f2] bg-[#f8fbff] text-slate-700 hover:border-[#b8c9e3]"
            }`}
            onClick={() => setSelectedLocality(locality)}
            type="button"
          >
            {locality} {locality === "All Bhilai" ? "" : `(${localityCounts.get(locality) || 0})`}
          </button>
        ))}
      </div>
    </section>
  );
}

function MerchantSpotlight({ featuredShops, selectedShop, loadProducts }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Seller spotlight
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Top local shops on the homepage</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {featuredShops.map((shop) => {
          const theme = getShopTheme(shop.category);
          const locality = findLocality(shop);

          return (
            <button
              key={shop.id}
              className={`rounded-[28px] border p-5 text-left transition ${
                selectedShop?.id === shop.id
                  ? "border-[#2874f0] bg-[#edf4ff] shadow-[0_16px_40px_rgba(40,116,240,0.18)]"
                  : "border-[#e1eaf5] bg-white hover:border-[#bdd0ea] hover:bg-[#f8fbff]"
              }`}
              onClick={() => loadProducts(shop)}
              type="button"
            >
              <div className={`flex h-28 items-center justify-between rounded-[22px] bg-gradient-to-r ${theme.accent} px-5`}>
                <ShopLogo shop={shop} size="lg" />
                <div className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {shop.category}
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="mt-3 text-xl font-black text-slate-900">{shop.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{locality}</p>
                </div>
                <div className="text-sm font-semibold text-[#1559d6]">Open shop</div>
              </div>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">{getShopSummary(shop)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AuthCard({ authForm, mode, setMode, onChange, onSubmit, loading }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Account access
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">
            {mode === "register" ? "Create a customer or seller account" : "Login to the marketplace"}
          </h2>
        </div>
        <button className="button-soft" onClick={() => setMode(mode === "register" ? "login" : "register")} type="button">
          {mode === "register" ? "Use login" : "Create account"}
        </button>
      </div>

      <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        {mode === "register" ? (
          <>
            <input
              className="field-light"
              placeholder="Full name"
              value={authForm.name}
              onChange={(event) => onChange({ ...authForm, name: event.target.value })}
            />
            <input
              className="field-light"
              placeholder="Phone"
              value={authForm.phone}
              onChange={(event) => onChange({ ...authForm, phone: event.target.value })}
            />
            <select
              className="field-light"
              value={authForm.role}
              onChange={(event) => onChange({ ...authForm, role: event.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
            <input
              className="field-light"
              placeholder="State"
              value={authForm.state}
              onChange={(event) => onChange({ ...authForm, state: event.target.value })}
            />
            <select
              className="field-light"
              value={authForm.city}
              onChange={(event) => onChange({ ...authForm, city: event.target.value })}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <input
          className="field-light"
          placeholder="Email"
          type="email"
          value={authForm.email}
          onChange={(event) => onChange({ ...authForm, email: event.target.value })}
        />
        <input
          className="field-light"
          placeholder="Password"
          type="password"
          value={authForm.password}
          onChange={(event) => onChange({ ...authForm, password: event.target.value })}
        />

        <button className="button-brand md:col-span-2" disabled={loading} type="submit">
          {loading ? "Processing..." : mode === "register" ? "Create account" : "Login"}
        </button>
      </form>
    </section>
  );
}

function AccountStrip({ currentUser, orders, shops }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Signed in
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{currentUser.name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {currentUser.role} • {currentUser.location?.city || "Unknown city"} • {currentUser.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
          <MiniStat label="Role" value={currentUser.role} />
          <MiniStat label="City" value={currentUser.location?.city || "Unknown"} />
          <MiniStat label="Orders" value={String(orders)} />
          <MiniStat label="My shops" value={String(shops)} />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[20px] border border-[#e1eaf5] bg-[#f8fbff] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MarketplaceControls({ selectedCity, setSelectedCity, selectedCategory, setSelectedCategory }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Choose city
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {cities.map((city) => (
              <button
                key={city}
                className={city === selectedCity ? "button-brand" : "button-soft"}
                onClick={() => setSelectedCity(city)}
                type="button"
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Category focus
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {primaryCategories.map((category) => (
              <button
                key={category}
                className={category === selectedCategory ? "button-brand" : "button-soft"}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShopsGrid({ featuredShops, selectedShop, loadProducts }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Marketplace sellers
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Open any seller storefront</h2>
        </div>
        <div className="rounded-full bg-[#f2f7ff] px-3 py-2 text-xs font-semibold text-[#1559d6]">
          {featuredShops.length} visible now
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featuredShops.map((shop, index) => {
          const theme = getShopTheme(shop.category);
          const locality = findLocality(shop);

          return (
            <button
              key={shop.id}
              className={`overflow-hidden rounded-[26px] border text-left transition ${
                selectedShop?.id === shop.id
                  ? "border-[#2874f0] bg-[#edf4ff] shadow-[0_16px_40px_rgba(40,116,240,0.18)]"
                  : "border-[#e1eaf5] bg-white hover:border-[#bdd0ea] hover:bg-[#f8fbff]"
              }`}
              onClick={() => loadProducts(shop)}
              type="button"
            >
              <div className={`h-28 bg-gradient-to-r ${theme.accent} p-5`}>
                <div className="flex items-center justify-between">
                  <ShopLogo shop={shop} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <h3 className="text-xl font-black text-slate-900">{shop.name}</h3>
                <p className="text-sm font-semibold text-[#1559d6]">{locality}</p>
                <p className="min-h-[72px] text-sm leading-6 text-slate-600">
                  {shop.description || "Local shop listed on the Buzz.ai city marketplace."}
                </p>
                <div className="text-sm text-slate-500">{getShopSummary(shop)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProductsSection({ selectedShop, products, addToCart, user }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Seller storefront
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{selectedShop.name}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {selectedShop.description || "Browse the active catalog for this Bhilai marketplace seller."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>{findLocality(selectedShop)}</span>
            <span>{selectedShop.location?.street || selectedShop.location?.city || "Bhilai"}</span>
            {selectedShop.ownerId?.name ? <span>Seller {selectedShop.ownerId.name}</span> : null}
          </div>
        </div>

        <div className="rounded-[20px] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#1559d6]">
          {products.length} products loaded
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-[26px] border border-[#e1eaf5] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)]"
          >
            <div className="h-40 bg-[linear-gradient(135deg,#f2f7ff_0%,#d8e6ff_100%)] p-5">
              <div className="flex h-full flex-col justify-between">
                <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  In stock {product.stock}
                </div>
                <div className="text-3xl font-black text-slate-900">{formatCurrency(product.price)}</div>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-black text-slate-900">{product.name}</h3>
              <p className="min-h-[72px] text-sm leading-6 text-slate-600">
                {product.description || "Local fast-moving inventory ready for nearby customers."}
              </p>
              {user?.role === "customer" ? (
                <button className="button-brand w-full" onClick={() => addToCart(product)} type="button">
                  Add to cart
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptySelection() {
  return (
    <section className="rounded-[28px] border border-dashed border-[#c8d7ea] bg-white p-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="mx-auto max-w-2xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Storefront preview
        </div>
        <h2 className="mt-4 text-3xl font-black text-slate-900">Choose a seller to open their shop page</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This section is now designed to behave more like a marketplace storefront. Click any seller
          card above to load products for that merchant.
        </p>
      </div>
    </section>
  );
}

function CartCard({ cart, cartTotal, placeOrder, loading }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Cart</div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Ready to checkout</h2>
        </div>
        <div className="rounded-full bg-[#f2f7ff] px-3 py-2 text-xs font-semibold text-[#1559d6]">
          {cart.length} items
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {cart.length === 0 ? (
          <div className="rounded-[20px] border border-[#e1eaf5] bg-[#f8fbff] px-4 py-6 text-sm text-slate-500">
            Your cart is empty. Open a seller storefront and add products first.
          </div>
        ) : null}

        {cart.map((item) => (
          <div key={item.productId} className="rounded-[20px] border border-[#e1eaf5] bg-[#f8fbff] px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="font-semibold text-slate-800">
                {item.name} x {item.quantity}
              </div>
              <div className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[20px] border border-[#dbe5f2] bg-white px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-600">Total</span>
          <strong className="text-lg text-slate-900">{formatCurrency(cartTotal)}</strong>
        </div>
      </div>

      <button className="button-brand mt-4 w-full" disabled={loading} onClick={placeOrder} type="button">
        {loading ? "Processing..." : "Place order"}
      </button>
    </section>
  );
}

function OrdersSection({ orders, isShopkeeper, updateOrderStatus }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Orders</div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">
            {isShopkeeper ? "Seller order management" : "Your recent orders"}
          </h2>
        </div>
        <div className="rounded-full bg-[#f2f7ff] px-3 py-2 text-xs font-semibold text-[#1559d6]">
          {orders.length} total
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-[20px] border border-[#e1eaf5] bg-[#f8fbff] px-4 py-6 text-sm text-slate-500">
            No orders yet.
          </div>
        ) : null}

        {orders.map((order) => (
          <article key={order.id} className="rounded-[24px] border border-[#e1eaf5] bg-[#f8fbff] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {order.shopId?.name || "Shop"} • {formatCurrency(order.totalAmount)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isShopkeeper
                    ? `Customer: ${order.userId?.name || "Unknown"}`
                    : `Delivery city: ${order.deliveryCity}`}
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1559d6]">
                {order.status}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-3">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {!isShopkeeper ? <DeliveryTrackingCard order={order} /> : null}

            {isShopkeeper ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {["pending", "confirmed", "delivered"].map((status) => (
                  <button
                    key={status}
                    className={status === order.status ? "button-brand" : "button-soft"}
                    onClick={() => updateOrderStatus(order.id, status)}
                    type="button"
                  >
                    {status}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function DeliveryRouteShowcase({ order, selectedShop, hasActiveOrder }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Delivery route
          </div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">
            {hasActiveOrder ? "Live delivery tracking" : "Delivery preview before checkout"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {hasActiveOrder
              ? "This route card is now surfaced in the main shopping flow so delivery progress is visible without opening order history."
              : `Once you place an order from ${selectedShop?.name || "this shop"}, this route becomes your live delivery view.`}
          </p>
        </div>
        <div className="rounded-[18px] bg-[#edf4ff] px-4 py-3 text-sm font-semibold text-[#1559d6]">
          {order.shopId?.name || selectedShop?.name || "Selected shop"} to {order.deliveryCity}
        </div>
      </div>

      <DeliveryTrackingCard order={order} compact={false} />
    </section>
  );
}

function DeliverySidebarCard({ order, hasActiveOrder }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Route status
      </div>
      <h3 className="mt-2 text-2xl font-black text-slate-900">
        {hasActiveOrder ? "Track your order" : "Delivery map preview"}
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        {hasActiveOrder ? getDeliveryEta(order.status) : "Preview how the route card will look after checkout."}
      </p>

      <div className="mt-4">
        <DeliveryTrackingCard order={order} compact />
      </div>
    </section>
  );
}

function DeliveryTrackingCard({ order, compact = false }) {
  const progress = getDeliveryProgress(order.status);
  const steps = getDeliverySteps(order.status);
  const routeX = 48 + progress * 220;
  const routeY = 88 - progress * 18;

  return (
    <div className={`${compact ? "" : "mt-5"} rounded-[22px] border border-[#dbe5f2] bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)]`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {!compact ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Live delivery view
              </div>
              <h4 className="mt-2 text-lg font-black text-slate-900">Route to {order.deliveryCity}</h4>
            </>
          ) : (
            <div className="text-sm font-black text-slate-900">Route to {order.deliveryCity}</div>
          )}
          <p className="mt-1 text-sm text-slate-500">{getDeliveryEta(order.status)}</p>
        </div>
        <div className="rounded-[18px] bg-[#edf4ff] px-4 py-3 text-sm font-semibold text-[#1559d6]">
          {order.shopId?.name || "Store"} to customer drop
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-[#e1eaf5] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-4">
        <svg viewBox="0 0 320 150" className="h-[150px] w-full">
          <defs>
            <linearGradient id={`route-${order.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2874f0" />
              <stop offset="100%" stopColor="#6fc1ff" />
            </linearGradient>
          </defs>

          <path
            d="M48 112 C92 48, 176 48, 272 88"
            fill="none"
            stroke="#d2dff1"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="10 12"
          />
          <path
            d="M48 112 C92 48, 176 48, 272 88"
            fill="none"
            stroke={`url(#route-${order.id})`}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray={`${progress} 1`}
          />

          <circle cx="48" cy="112" r="16" fill="#ffe351" />
          <circle cx="272" cy="88" r="16" fill={order.status === "delivered" ? "#8bd4ac" : "#ffffff"} stroke="#2874f0" strokeWidth="3" />
          <g transform={`translate(${routeX - 18} ${routeY - 11})`} className="delivery-train">
            <rect x="0" y="2" width="36" height="18" rx="9" fill="#2874f0" />
            <path d="M8 6 h14 c4 0 7 3 7 7 v0 H8 z" fill="#dff1ff" />
            <rect x="22" y="7" width="6" height="5" rx="2.5" fill="#2874f0" opacity="0.75" />
            <circle cx="10" cy="22" r="3" fill="#0f172a" />
            <circle cx="26" cy="22" r="3" fill="#0f172a" />
            <path d="M34 11 l6 2 l-6 2 z" fill="#6fc1ff" />
            <path d="M-5 8 h5" stroke="#9ec5ff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M-8 12 h8" stroke="#9ec5ff" strokeWidth="2" strokeLinecap="round" />
            <path d="M-4 16 h4" stroke="#9ec5ff" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          <text x="48" y="116" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">S</text>
          <text x="272" y="92" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">H</text>
          <text x={routeX} y={routeY - 16} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1559d6">LIVE</text>

          <text x="24" y="140" fontSize="12" fontWeight="700" fill="#1e293b">Shop</text>
          <text x="236" y="140" fontSize="12" fontWeight="700" fill="#1e293b">Home</text>
        </svg>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "md:grid-cols-3"}`}>
        {steps.map((step) => (
          <div
            key={step.key}
            className={`rounded-[18px] border px-4 py-3 ${
              step.done
                ? "border-[#bcd6ff] bg-[#edf4ff]"
                : "border-[#e1eaf5] bg-[#f8fbff]"
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {step.key}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900">{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShopFormCard({ shopForm, onChange, onSubmit, loading }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Seller onboarding
      </div>
      <h2 className="mt-2 text-2xl font-black text-slate-900">Launch a new shop page</h2>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <input
          className="field-light"
          placeholder="Shop name"
          value={shopForm.name}
          onChange={(event) => onChange({ ...shopForm, name: event.target.value })}
        />
        <select
          className="field-light"
          value={shopForm.category}
          onChange={(event) => onChange({ ...shopForm, category: event.target.value })}
        >
          {primaryCategories.slice(1).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <textarea
          className="field-light min-h-24"
          placeholder="Describe the store"
          value={shopForm.description}
          onChange={(event) => onChange({ ...shopForm, description: event.target.value })}
        />
        <input
          className="field-light"
          placeholder="State"
          value={shopForm.state}
          onChange={(event) => onChange({ ...shopForm, state: event.target.value })}
        />
        <select
          className="field-light"
          value={shopForm.city}
          onChange={(event) => onChange({ ...shopForm, city: event.target.value })}
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <button className="button-brand w-full" disabled={loading} type="submit">
          Create shop
        </button>
      </form>
    </section>
  );
}

function ProductFormCard({ productForm, onChange, onSubmit, myShops, loading }) {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Seller inventory
      </div>
      <h2 className="mt-2 text-2xl font-black text-slate-900">Add a marketplace product</h2>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <select
          className="field-light"
          value={productForm.shopId}
          onChange={(event) => onChange({ ...productForm, shopId: event.target.value })}
        >
          <option value="">Select shop</option>
          {myShops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
        <input
          className="field-light"
          placeholder="Product name"
          value={productForm.name}
          onChange={(event) => onChange({ ...productForm, name: event.target.value })}
        />
        <input
          className="field-light"
          placeholder="Price"
          type="number"
          value={productForm.price}
          onChange={(event) => onChange({ ...productForm, price: event.target.value })}
        />
        <textarea
          className="field-light min-h-24"
          placeholder="Product description"
          value={productForm.description}
          onChange={(event) => onChange({ ...productForm, description: event.target.value })}
        />
        <input
          className="field-light"
          placeholder="Stock"
          type="number"
          value={productForm.stock}
          onChange={(event) => onChange({ ...productForm, stock: event.target.value })}
        />
        <input
          className="field-light"
          accept="image/*"
          type="file"
          onChange={(event) => onChange({ ...productForm, image: event.target.files?.[0] || null })}
        />
        <button className="button-brand w-full" disabled={loading} type="submit">
          Add product
        </button>
      </form>
    </section>
  );
}

function RoadmapCard() {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Product direction
      </div>
      <h2 className="mt-2 text-2xl font-black text-slate-900">What this UI is moving toward</h2>
      <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
        <p>Discovery-first shopping instead of a generic form dashboard.</p>
        <p>Seller storefronts with locality context so Bhilai merchants feel visible on the homepage.</p>
        <p>Customer flow that can later support boosts, ads, delivery, and payments without redesigning from scratch.</p>
      </div>
    </section>
  );
}

function DataSourcingCard() {
  return (
    <section className="rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Merchant coverage
      </div>
      <h2 className="mt-2 text-2xl font-black text-slate-900">Current Bhilai shop data</h2>
      <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
        <p>The current repo already imports Bhilai-area shops from OpenStreetMap into the local datastore.</p>
        <p>That is enough to power a stronger storefront UI right now and highlight areas like Nehru Nagar, Supela, and Durg when present in addresses.</p>
        <p>For Google business data specifically, the correct next step is a Google Places API importer with your API key, not scraping Google Maps.</p>
      </div>
    </section>
  );
}
