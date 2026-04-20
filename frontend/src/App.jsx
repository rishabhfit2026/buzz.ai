import { useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";

const cities = ["Bhilai", "Raipur", "Durg", "Bilaspur", "Nagpur"];
const categories = ["All", "Grocery", "Restaurant", "Pharmacy", "Bakery", "PG", "Electronics"];

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

export default function App() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authState, setAuthState] = useState(() => {
    const raw = window.localStorage.getItem("buzz-auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  const [selectedCity, setSelectedCity] = useState("Bhilai");
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesCategory =
        selectedCategory === "All" ||
        String(shop.category || "").toLowerCase() === selectedCategory.toLowerCase();
      const needle = searchQuery.trim().toLowerCase();
      const haystack = `${shop.name} ${shop.category} ${shop.description || ""}`.toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [shops, selectedCategory, searchQuery]);

  const featuredShops = filteredShops.slice(0, 6);
  const featuredProducts = products.slice(0, 8);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const loadMarketplace = async (city) => {
    try {
      const data = await api.getShops(city);
      setShops(data);

      if (selectedShop) {
        const nextSelectedShop = data.find((shop) => shop.id === selectedShop.id) || null;
        setSelectedShop(nextSelectedShop);
        if (!nextSelectedShop) {
          setProducts([]);
        }
      }
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
    <div className="min-h-screen bg-aura">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-8">
        <TopBar
          currentUser={currentUser}
          logout={logout}
          searchQuery={searchQuery}
          selectedCity={selectedCity}
          setSearchQuery={setSearchQuery}
        />

        <HeroPanel
          cartTotal={cartTotal}
          selectedCity={selectedCity}
          setSelectedCategory={setSelectedCategory}
          shopsCount={filteredShops.length}
        />

        {feedback ? (
          <div className="mt-5 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-sand">
            {feedback}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <main className="space-y-6">
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
              <AccountStrip currentUser={currentUser} />
            )}

            <MarketplaceControls
              selectedCategory={selectedCategory}
              selectedCity={selectedCity}
              setSelectedCategory={setSelectedCategory}
              setSelectedCity={setSelectedCity}
            />

            <ShopsGrid featuredShops={featuredShops} loadProducts={loadProducts} selectedShop={selectedShop} />

            {selectedShop ? (
              <ProductsSection
                addToCart={addToCart}
                products={featuredProducts}
                selectedShop={selectedShop}
                user={currentUser}
              />
            ) : (
              <EmptySelection />
            )}

            {isAuthenticated ? (
              <OrdersSection
                isShopkeeper={isShopkeeper}
                orders={orders}
                updateOrderStatus={updateOrderStatus}
              />
            ) : null}
          </main>

          <aside className="space-y-6">
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

            <GrowthIdeas />
          </aside>
        </div>
      </div>
    </div>
  );
}

function TopBar({ currentUser, selectedCity, searchQuery, setSearchQuery, logout }) {
  return (
    <div className="panel flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-sand/45">Buzz.ai</div>
          <div className="font-display text-4xl leading-none text-sand">market</div>
        </div>
        <div className="hidden h-10 w-px bg-white/10 md:block" />
        <div className="hidden md:block">
          <div className="text-xs uppercase tracking-[0.25em] text-sand/45">Serving</div>
          <div className="text-sm text-sand/75">{selectedCity}, local commerce network</div>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-3 md:max-w-xl">
        <input
          className="field"
          placeholder="Search shops, products, categories"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        {currentUser ? (
          <button className="button-secondary whitespace-nowrap" onClick={logout} type="button">
            Logout
          </button>
        ) : null}
      </div>
    </div>
  );
}

function HeroPanel({ selectedCity, shopsCount, cartTotal, setSelectedCategory }) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="panel overflow-hidden p-7 md:p-10">
        <div className="flex flex-wrap gap-2">
          <span className="chip">Hyperlocal commerce</span>
          <span className="chip">Bhilai-first rollout</span>
          <span className="chip">Merchant marketplace</span>
        </div>
        <h1 className="mt-6 max-w-3xl font-display text-5xl leading-none text-sand md:text-7xl">
          Your city’s inventory, delivered through one marketplace.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-sand/72">
          Buzz.ai turns neighborhood shops into digital storefronts. Customers browse nearby stock,
          compare merchants, place orders, and keep local commerce moving faster.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.slice(1, 6).map((category) => (
            <button
              key={category}
              className="button-secondary"
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              Explore {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
        <StatCard label="Live city" value={selectedCity} />
        <StatCard label="Visible shops" value={String(shopsCount)} />
        <StatCard label="Cart value" value={`Rs. ${cartTotal}`} />
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-sand/45">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-sand">{value}</div>
    </div>
  );
}

function AuthCard({ authForm, mode, setMode, onChange, onSubmit, loading }) {
  return (
    <div className="panel p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-sand/45">Account access</p>
          <h2 className="mt-2 text-3xl font-semibold text-sand">
            {mode === "register" ? "Create your marketplace account" : "Sign in to Buzz.ai"}
          </h2>
        </div>
        <button
          className="button-secondary"
          onClick={() => setMode(mode === "register" ? "login" : "register")}
          type="button"
        >
          {mode === "register" ? "Use login" : "Create account"}
        </button>
      </div>

      <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        {mode === "register" ? (
          <>
            <input
              className="field"
              placeholder="Full name"
              value={authForm.name}
              onChange={(event) => onChange({ ...authForm, name: event.target.value })}
            />
            <input
              className="field"
              placeholder="Phone"
              value={authForm.phone}
              onChange={(event) => onChange({ ...authForm, phone: event.target.value })}
            />
            <select
              className="field"
              value={authForm.role}
              onChange={(event) => onChange({ ...authForm, role: event.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
            <input
              className="field"
              placeholder="State"
              value={authForm.state}
              onChange={(event) => onChange({ ...authForm, state: event.target.value })}
            />
            <select
              className="field"
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
          className="field"
          placeholder="Email"
          type="email"
          value={authForm.email}
          onChange={(event) => onChange({ ...authForm, email: event.target.value })}
        />
        <input
          className="field"
          placeholder="Password"
          type="password"
          value={authForm.password}
          onChange={(event) => onChange({ ...authForm, password: event.target.value })}
        />

        <button className="button-primary md:col-span-2" disabled={loading} type="submit">
          {loading ? "Processing..." : mode === "register" ? "Create account" : "Login"}
        </button>
      </form>
    </div>
  );
}

function AccountStrip({ currentUser }) {
  return (
    <div className="panel flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Signed in</div>
        <h2 className="mt-2 text-3xl font-semibold text-sand">{currentUser.name}</h2>
        <p className="mt-1 text-sm text-sand/65">
          {currentUser.role} • {currentUser.location?.city || "No city"} • {currentUser.email}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:w-72">
        <QuickMetric label="Role" value={currentUser.role} />
        <QuickMetric label="City" value={currentUser.location?.city || "Unknown"} />
      </div>
    </div>
  );
}

function QuickMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-sand/45">{label}</div>
      <div className="mt-2 text-sm font-semibold text-sand">{value}</div>
    </div>
  );
}

function MarketplaceControls({ selectedCity, setSelectedCity, selectedCategory, setSelectedCategory }) {
  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Browse by city</div>
          <div className="mt-3 flex flex-wrap gap-3">
            {cities.map((city) => (
              <button
                key={city}
                className={city === selectedCity ? "button-primary" : "button-secondary"}
                onClick={() => setSelectedCity(city)}
                type="button"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Popular categories</div>
          <div className="mt-3 flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                className={category === selectedCategory ? "button-primary" : "button-secondary"}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopsGrid({ featuredShops, selectedShop, loadProducts }) {
  return (
    <section className="panel p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Featured local shops</div>
          <h2 className="mt-2 text-3xl font-semibold text-sand">Discover stores around you</h2>
        </div>
        <div className="chip">{featuredShops.length} visible</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featuredShops.map((shop, index) => (
          <button
            key={shop.id}
            className={`overflow-hidden rounded-3xl border text-left transition ${
              selectedShop?.id === shop.id
                ? "border-coral/70 bg-coral/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            onClick={() => loadProducts(shop)}
            type="button"
          >
            <div className="h-28 bg-[linear-gradient(135deg,rgba(239,111,94,0.35),rgba(125,211,176,0.10))] px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="chip">{shop.category}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-sand/55">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-semibold text-sand">{shop.name}</h3>
              <p className="min-h-16 text-sm leading-6 text-sand/65">
                {shop.description || "Neighborhood merchant on the Buzz.ai network."}
              </p>
              <div className="flex items-center justify-between text-sm text-sand/55">
                <span>{shop.location?.street || shop.location?.city || "Bhilai"}</span>
                <span>View products</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductsSection({ selectedShop, products, addToCart, user }) {
  return (
    <section className="panel p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Shop catalog</div>
          <h2 className="mt-2 text-3xl font-semibold text-sand">{selectedShop.name}</h2>
          <p className="mt-2 text-sm text-sand/65">
            {selectedShop.description || "Browse the current catalog for this merchant."}
          </p>
        </div>
        <div className="chip">{products.length} products</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="h-40 bg-[linear-gradient(135deg,rgba(245,196,107,0.35),rgba(239,111,94,0.12))] p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="chip">In stock {product.stock}</span>
                <span className="text-2xl font-semibold text-gold">Rs. {product.price}</span>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-semibold text-sand">{product.name}</h3>
              <p className="text-sm leading-6 text-sand/65">
                {product.description || "Local fast-moving inventory for nearby customers."}
              </p>
              {user?.role === "customer" ? (
                <button className="button-primary w-full" onClick={() => addToCart(product)} type="button">
                  Add to cart
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptySelection() {
  return (
    <div className="panel p-10 text-center">
      <div className="mx-auto max-w-lg">
        <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Catalog preview</div>
        <h2 className="mt-4 text-3xl font-semibold text-sand">Pick a local shop to view live products</h2>
        <p className="mt-3 text-sm leading-7 text-sand/65">
          The importer and the merchant tools populate real catalog cards here. Click any shop above
          to open its storefront.
        </p>
      </div>
    </div>
  );
}

function CartCard({ cart, cartTotal, placeOrder, loading }) {
  return (
    <div className="panel p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Cart</div>
          <h2 className="mt-2 text-2xl font-semibold text-sand">Ready to checkout</h2>
        </div>
        <div className="chip">{cart.length} items</div>
      </div>

      <div className="mt-4 space-y-3">
        {cart.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-sand/55">
            Your cart is empty. Add products from a selected shop.
          </div>
        ) : null}
        {cart.map((item) => (
          <div key={item.productId} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between text-sm text-sand">
              <span>
                {item.name} x {item.quantity}
              </span>
              <strong>Rs. {item.price * item.quantity}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 px-4 py-3 text-sm text-sand">
        <div className="flex items-center justify-between">
          <span>Total</span>
          <strong>Rs. {cartTotal}</strong>
        </div>
      </div>

      <button className="button-primary mt-4 w-full" disabled={loading} onClick={placeOrder} type="button">
        {loading ? "Processing..." : "Place order"}
      </button>
    </div>
  );
}

function OrdersSection({ orders, isShopkeeper, updateOrderStatus }) {
  return (
    <section className="panel p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Orders</div>
          <h2 className="mt-2 text-3xl font-semibold text-sand">
            {isShopkeeper ? "Incoming merchant orders" : "Your purchase history"}
          </h2>
        </div>
        <div className="chip">{orders.length} total</div>
      </div>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-sand/55">
            No orders yet.
          </div>
        ) : null}
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-sand">
                  {order.shopId?.name || "Shop"} • Rs. {order.totalAmount}
                </h3>
                <p className="mt-1 text-sm text-sand/60">
                  {isShopkeeper
                    ? `Customer: ${order.userId?.name || "Unknown"}`
                    : `Delivery city: ${order.deliveryCity}`}
                </p>
              </div>
              <div className="chip">{order.status}</div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-sand/70">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {isShopkeeper ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {["pending", "confirmed", "delivered"].map((status) => (
                  <button
                    key={status}
                    className={status === order.status ? "button-primary" : "button-secondary"}
                    onClick={() => updateOrderStatus(order.id, status)}
                    type="button"
                  >
                    {status}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ShopFormCard({ shopForm, onChange, onSubmit, loading }) {
  return (
    <div className="panel p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Merchant onboarding</div>
      <h2 className="mt-2 text-2xl font-semibold text-sand">Launch a new shop</h2>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <input
          className="field"
          placeholder="Shop name"
          value={shopForm.name}
          onChange={(event) => onChange({ ...shopForm, name: event.target.value })}
        />
        <select
          className="field"
          value={shopForm.category}
          onChange={(event) => onChange({ ...shopForm, category: event.target.value })}
        >
          {categories.slice(1).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <textarea
          className="field min-h-24"
          placeholder="Describe the store"
          value={shopForm.description}
          onChange={(event) => onChange({ ...shopForm, description: event.target.value })}
        />
        <input
          className="field"
          placeholder="State"
          value={shopForm.state}
          onChange={(event) => onChange({ ...shopForm, state: event.target.value })}
        />
        <select
          className="field"
          value={shopForm.city}
          onChange={(event) => onChange({ ...shopForm, city: event.target.value })}
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <button className="button-primary w-full" disabled={loading} type="submit">
          Create shop
        </button>
      </form>
    </div>
  );
}

function ProductFormCard({ productForm, onChange, onSubmit, myShops, loading }) {
  return (
    <div className="panel p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Merchant inventory</div>
      <h2 className="mt-2 text-2xl font-semibold text-sand">Add a product</h2>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <select
          className="field"
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
          className="field"
          placeholder="Product name"
          value={productForm.name}
          onChange={(event) => onChange({ ...productForm, name: event.target.value })}
        />
        <input
          className="field"
          placeholder="Price"
          type="number"
          value={productForm.price}
          onChange={(event) => onChange({ ...productForm, price: event.target.value })}
        />
        <textarea
          className="field min-h-24"
          placeholder="Product description"
          value={productForm.description}
          onChange={(event) => onChange({ ...productForm, description: event.target.value })}
        />
        <input
          className="field"
          placeholder="Stock"
          type="number"
          value={productForm.stock}
          onChange={(event) => onChange({ ...productForm, stock: event.target.value })}
        />
        <input
          className="field"
          accept="image/*"
          type="file"
          onChange={(event) => onChange({ ...productForm, image: event.target.files?.[0] || null })}
        />
        <button className="button-primary w-full" disabled={loading} type="submit">
          Add product
        </button>
      </form>
    </div>
  );
}

function GrowthIdeas() {
  return (
    <div className="panel p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-sand/45">Business roadmap</div>
      <h2 className="mt-2 text-2xl font-semibold text-sand">What makes this stronger</h2>
      <div className="mt-5 space-y-3 text-sm leading-6 text-sand/68">
        <p>Start with one city and own trust, inventory freshness, and repeat ordering.</p>
        <p>Add merchant analytics, paid storefront boosts, and payments after merchant retention is real.</p>
        <p>Use local importer data for discovery, then replace with verified merchant onboarding over time.</p>
      </div>
    </div>
  );
}
