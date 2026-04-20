import { useEffect, useState } from "react";
import { api } from "./lib/api";

const cities = ["Bhilai", "Raipur", "Durg", "Bilaspur", "Nagpur"];
const categories = ["Grocery", "Restaurant", "PG", "Bakery", "Pharmacy", "Stationery"];

const initialAuthForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  state: "Chhattisgarh",
  city: "Bhilai"
};

export default function App() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authState, setAuthState] = useState(() => {
    const raw = localStorage.getItem("buzz-auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  const [selectedCity, setSelectedCity] = useState("Bhilai");
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: "",
    category: "Grocery",
    description: "",
    state: "Chhattisgarh",
    city: "Bhilai"
  });
  const [productForm, setProductForm] = useState({
    shopId: "",
    name: "",
    price: "",
    description: "",
    stock: "100",
    image: null
  });
  const [myShops, setMyShops] = useState([]);

  const currentUser = authState.user;
  const isAuthenticated = Boolean(authState.token && currentUser);
  const isShopkeeper = currentUser?.role === "shopkeeper";

  useEffect(() => {
    window.localStorage.setItem("buzz-auth", JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    loadMarketplace(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadOrders();
    if (isShopkeeper) {
      loadMyShops();
    }
  }, [isAuthenticated]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const loadMarketplace = async (city) => {
    try {
      const data = await api.getShops(city);
      setShops(data);
      if (selectedShop && !data.some((shop) => shop._id === selectedShop._id)) {
        setSelectedShop(null);
        setProducts([]);
      }
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const loadProducts = async (shop) => {
    try {
      setSelectedShop(shop);
      const data = await api.getProducts(shop._id);
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
        setProductForm((prev) => ({ ...prev, shopId: data[0]._id }));
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
      setFeedback(`Welcome, ${data.user.name}.`);
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
      setShopForm({
        name: "",
        category: "Grocery",
        description: "",
        state: "Chhattisgarh",
        city: selectedCity
      });
      await loadMyShops();
      await loadMarketplace(selectedCity);
      setFeedback("Shop created.");
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
      setProductForm((prev) => ({
        ...prev,
        name: "",
        price: "",
        description: "",
        stock: "100",
        image: null
      }));
      if (selectedShop && selectedShop._id === productForm.shopId) {
        await loadProducts(selectedShop);
      }
      setFeedback("Product added.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1
        }
      ];
    });
  };

  const placeOrder = async () => {
    if (!selectedShop || cart.length === 0) {
      setFeedback("Select a shop and add products to cart first.");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      await api.placeOrder(
        {
          shopId: selectedShop._id,
          deliveryCity: selectedCity,
          items: cart
        },
        authState.token
      );
      setCart([]);
      await loadOrders();
      setFeedback("Order placed.");
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
      setFeedback(`Order marked as ${status}.`);
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
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="panel overflow-hidden p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div className="space-y-5">
              <span className="chip">AI-powered local marketplace</span>
              <div className="space-y-3">
                <h1 className="font-display text-5xl leading-none text-sand md:text-7xl">
                  Buzz.ai
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-sand/75 md:text-base">
                  Build one city first. Shopkeepers launch mini stores, customers discover nearby
                  inventory, and orders move through a simple local commerce workflow.
                </p>
              </div>
            </div>

            <div className="panel bg-black/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Live scope</p>
              <div className="mt-4 grid gap-3 text-sm text-sand/80">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span>City filter</span>
                  <strong>{selectedCity}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span>Shops visible</span>
                  <strong>{shops.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span>Cart total</span>
                  <strong>Rs. {cartTotal}</strong>
                </div>
              </div>
            </div>
          </div>
        </header>

        {feedback ? (
          <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-sand">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="space-y-6">
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
              <ProfileCard user={currentUser} onLogout={logout} />
            )}

            <LocationCard selectedCity={selectedCity} setSelectedCity={setSelectedCity} />

            {isAuthenticated && currentUser.role === "customer" ? (
              <CartCard cart={cart} cartTotal={cartTotal} placeOrder={placeOrder} />
            ) : null}

            {isAuthenticated && isShopkeeper ? (
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
          </section>

          <section className="space-y-6">
            <MarketplaceCard
              loadProducts={loadProducts}
              selectedCity={selectedCity}
              selectedShop={selectedShop}
              shops={shops}
            />

            {selectedShop ? (
              <ProductsCard
                addToCart={addToCart}
                products={products}
                selectedShop={selectedShop}
                user={currentUser}
              />
            ) : null}

            {isAuthenticated ? (
              <OrdersCard
                isShopkeeper={isShopkeeper}
                orders={orders}
                updateOrderStatus={updateOrderStatus}
              />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function AuthCard({ authForm, mode, setMode, onChange, onSubmit, loading }) {
  return (
    <div className="panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Access</p>
          <h2 className="mt-2 text-2xl font-semibold text-sand">
            {mode === "register" ? "Create account" : "Login"}
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

      <form className="space-y-3" onSubmit={onSubmit}>
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

        <button className="button-primary w-full" disabled={loading} type="submit">
          {loading ? "Please wait..." : mode === "register" ? "Create account" : "Login"}
        </button>
      </form>
    </div>
  );
}

function ProfileCard({ user, onLogout }) {
  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Logged in</p>
          <h2 className="mt-2 text-2xl font-semibold">{user.name}</h2>
          <p className="mt-1 text-sm text-sand/65">
            {user.role} • {user.location?.city || "No city"} • {user.email}
          </p>
        </div>
        <button className="button-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

function LocationCard({ selectedCity, setSelectedCity }) {
  return (
    <div className="panel p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Location filter</p>
      <h2 className="mt-2 text-2xl font-semibold">Choose your city</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {cities.map((city) => (
          <button
            key={city}
            className={city === selectedCity ? "button-primary" : "button-secondary"}
            onClick={() => setSelectedCity(city)}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}

function ShopFormCard({ shopForm, onChange, onSubmit, loading }) {
  return (
    <div className="panel p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Shopkeeper</p>
      <h2 className="mt-2 text-2xl font-semibold">Create your shop</h2>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
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
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <textarea
          className="field min-h-24"
          placeholder="Short shop description"
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
          Launch shop
        </button>
      </form>
    </div>
  );
}

function ProductFormCard({ productForm, onChange, onSubmit, myShops, loading }) {
  return (
    <div className="panel p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Inventory</p>
      <h2 className="mt-2 text-2xl font-semibold">Add products</h2>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <select
          className="field"
          value={productForm.shopId}
          onChange={(event) => onChange({ ...productForm, shopId: event.target.value })}
        >
          <option value="">Select shop</option>
          {myShops.map((shop) => (
            <option key={shop._id} value={shop._id}>
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
          placeholder="Description"
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
          type="file"
          accept="image/*"
          onChange={(event) => onChange({ ...productForm, image: event.target.files?.[0] || null })}
        />
        <button className="button-primary w-full" disabled={loading} type="submit">
          Add product
        </button>
      </form>
    </div>
  );
}

function MarketplaceCard({ shops, selectedCity, loadProducts, selectedShop }) {
  return (
    <div className="panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Marketplace</p>
          <h2 className="mt-2 text-3xl font-semibold">Nearby shops in {selectedCity}</h2>
        </div>
        <span className="chip">{shops.length} shops</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {shops.map((shop) => (
          <button
            key={shop._id}
            className={`panel p-5 text-left transition ${
              selectedShop?._id === shop._id ? "border-coral/70 bg-coral/10" : "hover:bg-white/10"
            }`}
            onClick={() => loadProducts(shop)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{shop.name}</h3>
                <p className="mt-1 text-sm text-sand/60">{shop.category}</p>
              </div>
              <span className="chip">{shop.location.city}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-sand/70">
              {shop.description || "Local inventory for nearby customers."}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductsCard({ selectedShop, products, addToCart, user }) {
  return (
    <div className="panel p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Products</p>
          <h2 className="mt-2 text-3xl font-semibold">{selectedShop.name}</h2>
        </div>
        <span className="chip">{products.length} products</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {products.map((product) => {
          const imageUrl = product.imageUrl
            ? `${api.uploadsBaseUrl}${product.imageUrl}`
            : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='480' viewBox='0 0 800 480'%3E%3Crect width='800' height='480' fill='%23161b24'/%3E%3Ccircle cx='180' cy='100' r='180' fill='%23ef6f5e' fill-opacity='0.18'/%3E%3Ccircle cx='650' cy='120' r='160' fill='%237dd3b0' fill-opacity='0.16'/%3E%3Ctext x='60' y='250' fill='%23f4efe6' font-size='54' font-family='Arial, sans-serif'%3EBuzz.ai Product%3C/text%3E%3Ctext x='60' y='310' fill='%23f5c46b' font-size='24' font-family='Arial, sans-serif'%3ELocal inventory preview%3C/text%3E%3C/svg%3E";

          return (
            <div key={product._id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <img alt={product.name} className="h-40 w-full object-cover" src={imageUrl} />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-sand/60">{product.description || "Fresh local stock"}</p>
                  </div>
                  <span className="text-lg font-semibold text-gold">Rs. {product.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-sand/60">Stock: {product.stock}</span>
                  {user?.role === "customer" ? (
                    <button className="button-primary" onClick={() => addToCart(product)}>
                      Add to cart
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CartCard({ cart, cartTotal, placeOrder }) {
  return (
    <div className="panel p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Cart</p>
          <h2 className="mt-2 text-2xl font-semibold">Ready to order</h2>
        </div>
        <span className="chip">{cart.length} items</span>
      </div>

      <div className="mt-4 space-y-3">
        {cart.map((item) => (
          <div key={item.productId} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
            <span>
              {item.name} x {item.quantity}
            </span>
            <strong>Rs. {item.price * item.quantity}</strong>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
        <span>Total</span>
        <strong>Rs. {cartTotal}</strong>
      </div>

      <button className="button-primary mt-4 w-full" onClick={placeOrder}>
        Place order
      </button>
    </div>
  );
}

function OrdersCard({ orders, isShopkeeper, updateOrderStatus }) {
  return (
    <div className="panel p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sand/50">Orders</p>
          <h2 className="mt-2 text-3xl font-semibold">
            {isShopkeeper ? "Incoming orders" : "Your orders"}
          </h2>
        </div>
        <span className="chip">{orders.length} total</span>
      </div>

      <div className="mt-5 space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {order.shopId?.name || "Shop"} • Rs. {order.totalAmount}
                </h3>
                <p className="mt-1 text-sm text-sand/60">
                  {isShopkeeper
                    ? `Customer: ${order.userId?.name || "Unknown"}`
                    : `Delivery city: ${order.deliveryCity}`}
                </p>
              </div>
              <span className="chip">{order.status}</span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-sand/70">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between">
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
                    className={order.status === status ? "button-primary" : "button-secondary"}
                    onClick={() => updateOrderStatus(order._id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
