import { createServer } from "node:http";
import { randomBytes, pbkdf2Sync, timingSafeEqual, createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_PRODUCTS } from "./store-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "auth-db.json");
const DIST_DIR = path.join(__dirname, "dist");

const OWNER_EMAIL = (process.env.OWNER_EMAIL || "owner@freshmart.in").trim().toLowerCase();
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Owner@123";
const OWNER_NAME = process.env.OWNER_NAME || "FreshMart Owner";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

let razorpayClientPromise = null;

const defaultDb = () => ({
  users: [],
  admins: [],
  sessions: [],
  adminSessions: [],
  orders: [],
  messages: [],
  products: DEFAULT_PRODUCTS,
});

const profileFrom = (data = {}) => ({
  name: data.name || "",
  email: data.email || "",
  phone: data.phone || "",
  address: data.address || "",
  city: data.city || "Chennai",
  pincode: data.pincode || "",
});

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, expectedHash] = String(stored || "").split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
};

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  profile: profileFrom(user.profile || user),
});

const safeAdmin = (admin) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role || "owner",
});

const safeProduct = (product = {}) => ({
  id: product.id,
  name: product.name || "",
  category: product.category || "",
  price: Number(product.price || 0),
  originalPrice: Number(product.originalPrice || 0),
  image: product.image || "🛒",
  rating: Number(product.rating || 0),
  reviews: Number(product.reviews || 0),
  stock: Number(product.stock || 0),
  unit: product.unit || "",
  discount: Number(product.discount || 0),
  isNew: Boolean(product.isNew),
  featured: Boolean(product.featured),
});

const safeOrder = (order) => ({
  id: order.id,
  userId: order.userId,
  customerName: order.customerName || order.deliveryProfile?.name || "",
  customerEmail: order.customerEmail || "",
  items: Array.isArray(order.items) ? order.items : [],
  total: Number(order.total || 0),
  subtotal: Number(order.subtotal || 0),
  shippingFee: Number(order.shippingFee || 0),
  payment: order.payment || "cod",
  paymentStatus: order.paymentStatus || "pending",
  paymentOrderId: order.paymentOrderId || "",
  paymentId: order.paymentId || "",
  delivery: order.delivery || "standard",
  deliveryProfile: profileFrom(order.deliveryProfile),
  status: order.status || "Confirmed",
  createdAt: order.createdAt,
});

const safeMessage = (message = {}) => ({
  id: message.id,
  name: message.name || "",
  email: message.email || "",
  phone: message.phone || "",
  message: message.message || "",
  status: message.status || "New",
  createdAt: message.createdAt,
});

const json = (res, statusCode, payload, extraHeaders = {}) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
};

const sendText = (res, statusCode, body, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(body);
};

const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, decodeURIComponent(rest.join("="))];
      })
  );

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const getRazorpayClient = async () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured on the server.");
  }

  if (!razorpayClientPromise) {
    razorpayClientPromise = import("razorpay").then(({ default: Razorpay }) => new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    }));
  }

  return razorpayClientPromise;
};

const normalizeCartItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item.id,
      name: String(item.name || "").trim(),
      image: item.image || "🛒",
      price: Math.max(0, Number(item.price || 0)),
      qty: Math.max(1, Number(item.qty || 1)),
      unit: item.unit || "",
    }))
    .filter((item) => item.id && item.name && item.qty > 0);

const calculateShippingFee = (subtotal, delivery = "standard") => {
  if (delivery === "express") return 99;
  return subtotal > 500 ? 0 : 49;
};

const calculateOrderSummary = (body = {}) => {
  const items = normalizeCartItems(body.items);
  const delivery = body.delivery === "express" ? "express" : "standard";
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = calculateShippingFee(subtotal, delivery);
  const total = subtotal + shippingFee;

  return { items, delivery, subtotal, shippingFee, total };
};

const fileExists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const ensureOwner = (db) => {
  const existing = db.admins.find((admin) => admin.email === OWNER_EMAIL);
  if (existing) return db;

  db.admins.push({
    id: `admin_${randomBytes(8).toString("hex")}`,
    name: OWNER_NAME,
    email: OWNER_EMAIL,
    role: "owner",
    passwordHash: hashPassword(OWNER_PASSWORD),
    createdAt: new Date().toISOString(),
  });
  return db;
};

const normalizeDb = (parsed = {}) => {
  const db = {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    admins: Array.isArray(parsed.admins) ? parsed.admins : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    adminSessions: Array.isArray(parsed.adminSessions) ? parsed.adminSessions : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products.map(safeProduct) : DEFAULT_PRODUCTS.map(safeProduct),
  };
  return ensureOwner(db);
};

const readDb = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (!(await fileExists(DB_FILE))) {
    const initial = ensureOwner(defaultDb());
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const contents = await fs.readFile(DB_FILE, "utf8");
    const parsed = normalizeDb(JSON.parse(contents));
    await fs.writeFile(DB_FILE, JSON.stringify(parsed, null, 2));
    return parsed;
  } catch {
    const reset = ensureOwner(defaultDb());
    await fs.writeFile(DB_FILE, JSON.stringify(reset, null, 2));
    return reset;
  }
};

const writeDb = async (db) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(ensureOwner(db), null, 2));
};

const getSessionUser = async (req) => {
  const db = await readDb();
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.freshmart_session;
  if (!sessionToken) return { db, session: null, user: null };

  const session = db.sessions.find((entry) => entry.token === sessionToken);
  if (!session) return { db, session: null, user: null };

  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) return { db, session: null, user: null };

  return { db, session, user };
};

const getSessionAdmin = async (req) => {
  const db = await readDb();
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.freshmart_admin_session;
  if (!sessionToken) return { db, session: null, admin: null };

  const session = db.adminSessions.find((entry) => entry.token === sessionToken);
  if (!session) return { db, session: null, admin: null };

  const admin = db.admins.find((entry) => entry.id === session.adminId);
  if (!admin) return { db, session: null, admin: null };

  return { db, session, admin };
};

const setCookie = (res, name, token) => {
  res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
};

const clearCookie = (res, name) => {
  res.setHeader("Set-Cookie", `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
};

const serveStatic = async (req, res) => {
  const requestedPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(DIST_DIR, requestedPath === "/" ? "index.html" : requestedPath);
  const safePath = path.normalize(filePath);

  if (!safePath.startsWith(DIST_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let target = safePath;
  if (!(await fileExists(target))) {
    target = path.join(DIST_DIR, "index.html");
  }

  try {
    const ext = path.extname(target);
    const contentType =
      ext === ".html" ? "text/html; charset=utf-8" :
      ext === ".js" ? "application/javascript; charset=utf-8" :
      ext === ".css" ? "text/css; charset=utf-8" :
      ext === ".json" ? "application/json; charset=utf-8" :
      ext === ".svg" ? "image/svg+xml" :
      ext === ".png" ? "image/png" :
      "application/octet-stream";
    const data = await fs.readFile(target);
    sendText(res, 200, data, contentType);
  } catch {
    sendText(res, 404, "Not Found");
  }
};

const parseIdFromPath = (pathname, prefix) => decodeURIComponent(pathname.slice(prefix.length + 1));

const summarizeSales = (orders) => {
  const deliveredRevenue = orders
    .filter((order) => order.status === "Delivered")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7)
    .map((order) => ({
      id: order.id,
      customerName: order.customerName || order.deliveryProfile?.name || "Customer",
      total: Number(order.total || 0),
      status: order.status || "Confirmed",
      createdAt: order.createdAt,
    }));

  return {
    totalRevenue,
    deliveredRevenue,
    totalOrders: orders.length,
    averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
    recentOrders,
  };
};

const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      json(res, 400, { error: "Invalid request" });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/api/catalog") {
      const db = await readDb();
      json(res, 200, { products: db.products.map(safeProduct) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/contact-messages") {
      const db = await readDb();
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const email = normalizeEmail(body.email);
      const phone = String(body.phone || "").trim();
      const messageText = String(body.message || "").trim();

      if (!name || !email || !messageText) {
        json(res, 400, { error: "Name, email, and message are required." });
        return;
      }

      const message = {
        id: `msg_${randomBytes(6).toString("hex")}`,
        name,
        email,
        phone,
        message: messageText,
        status: "New",
        createdAt: new Date().toISOString(),
      };

      db.messages.push(message);
      await writeDb(db);
      json(res, 201, { message: safeMessage(message) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/signup") {
      const db = await readDb();
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");

      if (!name || !email || !password) {
        json(res, 400, { error: "Name, email, and password are required." });
        return;
      }
      if (password.length < 6) {
        json(res, 400, { error: "Password must be at least 6 characters." });
        return;
      }
      if (db.users.some((user) => user.email === email)) {
        json(res, 409, { error: "An account with this email already exists." });
        return;
      }

      const user = {
        id: `user_${randomBytes(8).toString("hex")}`,
        name,
        email,
        passwordHash: hashPassword(password),
        profile: profileFrom({ name, email }),
        createdAt: new Date().toISOString(),
      };

      const session = {
        token: randomBytes(32).toString("hex"),
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      db.users.push(user);
      db.sessions = db.sessions.filter((entry) => entry.userId !== user.id);
      db.sessions.push(session);
      await writeDb(db);
      setCookie(res, "freshmart_session", session.token);
      json(res, 201, { user: safeUser(user) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const db = await readDb();
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const user = db.users.find((entry) => entry.email === email);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        json(res, 401, { error: "Invalid email or password." });
        return;
      }

      const session = {
        token: randomBytes(32).toString("hex"),
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      db.sessions = db.sessions.filter((entry) => entry.userId !== user.id);
      db.sessions.push(session);
      await writeDb(db);
      setCookie(res, "freshmart_session", session.token);
      json(res, 200, { user: safeUser(user) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const { db, session } = await getSessionUser(req);
      if (session) {
        db.sessions = db.sessions.filter((entry) => entry.token !== session.token);
        await writeDb(db);
      }
      clearCookie(res, "freshmart_session");
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const { user } = await getSessionUser(req);
      if (!user) {
        json(res, 401, { error: "Not authenticated." });
        return;
      }
      json(res, 200, { user: safeUser(user) });
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/profile") {
      const { db, user } = await getSessionUser(req);
      if (!user) {
        json(res, 401, { error: "Please sign in first." });
        return;
      }

      const body = await readBody(req);
      const profile = profileFrom(body);
      if (!profile.name || !profile.email) {
        json(res, 400, { error: "Name and email are required." });
        return;
      }

      const duplicate = db.users.find((entry) => entry.email === profile.email && entry.id !== user.id);
      if (duplicate) {
        json(res, 409, { error: "That email is already used by another account." });
        return;
      }

      const updatedUser = {
        ...user,
        name: profile.name,
        email: profile.email,
        profile,
      };

      db.users = db.users.map((entry) => (entry.id === user.id ? updatedUser : entry));
      await writeDb(db);
      json(res, 200, { user: safeUser(updatedUser) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/orders") {
      const { db, user } = await getSessionUser(req);
      if (!user) {
        json(res, 401, { error: "Please sign in first." });
        return;
      }

      const orders = db.orders
        .filter((entry) => entry.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(safeOrder);

      json(res, 200, { orders });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/payments/create-order") {
      const { user } = await getSessionUser(req);
      if (!user) {
        json(res, 401, { error: "Please sign in first." });
        return;
      }

      try {
        const body = await readBody(req);
        const { items, delivery, subtotal, shippingFee, total } = calculateOrderSummary(body);

        if (!items.length) {
          json(res, 400, { error: "Your cart is empty." });
          return;
        }

        const razorpay = await getRazorpayClient();
        const order = await razorpay.orders.create({
          amount: Math.round(total * 100),
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            userId: user.id,
            delivery,
            subtotal: String(subtotal),
            shippingFee: String(shippingFee),
            total: String(total),
          },
        });

        json(res, 200, {
          keyId: RAZORPAY_KEY_ID,
          orderId: order.id,
          currency: order.currency,
          amount: total,
        });
      } catch (error) {
        json(res, 400, { error: error.message || "Unable to start the payment." });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/orders") {
      const { db, user } = await getSessionUser(req);
      if (!user) {
        json(res, 401, { error: "Please sign in first." });
        return;
      }

      const body = await readBody(req);
      const { items, delivery, subtotal, shippingFee, total } = calculateOrderSummary(body);
      if (!items.length) {
        json(res, 400, { error: "Your cart is empty." });
        return;
      }

      const payment = body.payment === "razorpay" ? "razorpay" : "cod";
      let paymentStatus = payment === "razorpay" ? "pending" : "pending";
      let paymentOrderId = "";
      let paymentId = "";

      if (payment === "razorpay") {
        paymentOrderId = String(body.paymentOrderId || "").trim();
        paymentId = String(body.paymentId || "").trim();
        const paymentSignature = String(body.paymentSignature || "").trim();

        if (!paymentOrderId || !paymentId || !paymentSignature) {
          json(res, 400, { error: "Missing Razorpay payment details." });
          return;
        }

        try {
          const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(`${paymentOrderId}|${paymentId}`)
            .digest("hex");

          if (expectedSignature !== paymentSignature) {
            json(res, 400, { error: "Payment signature verification failed." });
            return;
          }

          const razorpay = await getRazorpayClient();
          const fetchedOrder = await razorpay.orders.fetch(paymentOrderId);

          if (String(fetchedOrder.amount) !== String(Math.round(total * 100)) || String(fetchedOrder.currency).toUpperCase() !== "INR") {
            json(res, 400, { error: "Payment amount does not match the order total." });
            return;
          }

          paymentStatus = "paid";
        } catch (error) {
          json(res, 400, { error: error.message || "Unable to verify the Razorpay payment." });
          return;
        }
      }

      const order = {
        id: `#ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
        userId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        items,
        subtotal,
        shippingFee,
        total,
        payment,
        paymentStatus,
        paymentOrderId,
        paymentId,
        delivery,
        deliveryProfile: profileFrom(body.deliveryProfile),
        status: "Confirmed",
        createdAt: new Date().toISOString(),
      };

      db.orders.push(order);
      await writeDb(db);
      json(res, 201, { order: safeOrder(order) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/auth/login") {
      const db = await readDb();
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const admin = db.admins.find((entry) => entry.email === email);

      if (!admin || !verifyPassword(password, admin.passwordHash)) {
        json(res, 401, { error: "Invalid owner email or password." });
        return;
      }

      const session = {
        token: randomBytes(32).toString("hex"),
        adminId: admin.id,
        createdAt: new Date().toISOString(),
      };

      db.adminSessions = db.adminSessions.filter((entry) => entry.adminId !== admin.id);
      db.adminSessions.push(session);
      await writeDb(db);
      setCookie(res, "freshmart_admin_session", session.token);
      json(res, 200, { admin: safeAdmin(admin) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/auth/logout") {
      const { db, session } = await getSessionAdmin(req);
      if (session) {
        db.adminSessions = db.adminSessions.filter((entry) => entry.token !== session.token);
        await writeDb(db);
      }
      clearCookie(res, "freshmart_admin_session");
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/auth/me") {
      const { admin } = await getSessionAdmin(req);
      if (!admin) {
        json(res, 401, { error: "Owner login required." });
        return;
      }
      json(res, 200, { admin: safeAdmin(admin) });
      return;
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const { db, admin } = await getSessionAdmin(req);
      if (!admin) {
        json(res, 401, { error: "Owner login required." });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/admin/dashboard") {
        const sales = summarizeSales(db.orders);
        json(res, 200, {
          admin: safeAdmin(admin),
          products: db.products.map(safeProduct),
          orders: db.orders
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(safeOrder),
          messages: db.messages
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(safeMessage),
          sales,
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/admin/products") {
        json(res, 200, { products: db.products.map(safeProduct) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/admin/products") {
        const body = await readBody(req);
        if (!String(body.name || "").trim()) {
          json(res, 400, { error: "Product name is required." });
          return;
        }

        const product = safeProduct({
          ...body,
          id: `prod_${randomBytes(6).toString("hex")}`,
          rating: Number(body.rating || 4.5),
          reviews: Number(body.reviews || 0),
        });

        db.products.push(product);
        await writeDb(db);
        json(res, 201, { product });
        return;
      }

      if (req.method === "PUT" && url.pathname.startsWith("/api/admin/products/")) {
        const productId = parseIdFromPath(url.pathname, "/api/admin/products");
        const body = await readBody(req);
        const current = db.products.find((product) => String(product.id) === productId);
        if (!current) {
          json(res, 404, { error: "Product not found." });
          return;
        }

        const updated = safeProduct({ ...current, ...body, id: current.id });
        db.products = db.products.map((product) => (String(product.id) === productId ? updated : product));
        await writeDb(db);
        json(res, 200, { product: updated });
        return;
      }

      if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/products/")) {
        const productId = parseIdFromPath(url.pathname, "/api/admin/products");
        db.products = db.products.filter((product) => String(product.id) !== productId);
        await writeDb(db);
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/admin/orders") {
        json(res, 200, {
          orders: db.orders
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(safeOrder),
        });
        return;
      }

      if (req.method === "PUT" && url.pathname.startsWith("/api/admin/orders/")) {
        const orderId = parseIdFromPath(url.pathname, "/api/admin/orders");
        const body = await readBody(req);
        const current = db.orders.find((order) => String(order.id) === orderId);
        if (!current) {
          json(res, 404, { error: "Order not found." });
          return;
        }

        const updated = {
          ...current,
          status: String(body.status || current.status || "Confirmed"),
        };
        db.orders = db.orders.map((order) => (String(order.id) === orderId ? updated : order));
        await writeDb(db);
        json(res, 200, { order: safeOrder(updated) });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/admin/messages") {
        json(res, 200, {
          messages: db.messages
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(safeMessage),
        });
        return;
      }

      if (req.method === "PUT" && url.pathname.startsWith("/api/admin/messages/")) {
        const messageId = parseIdFromPath(url.pathname, "/api/admin/messages");
        const body = await readBody(req);
        const current = db.messages.find((message) => String(message.id) === messageId);
        if (!current) {
          json(res, 404, { error: "Message not found." });
          return;
        }

        const updated = {
          ...current,
          status: String(body.status || current.status || "New"),
        };
        db.messages = db.messages.map((message) => (String(message.id) === messageId ? updated : message));
        await writeDb(db);
        json(res, 200, { message: safeMessage(updated) });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/admin/sales-report") {
        json(res, 200, { sales: summarizeSales(db.orders) });
        return;
      }
    }

    if (url.pathname.startsWith("/api/")) {
      json(res, 404, { error: "API route not found." });
      return;
    }

    if (await fileExists(DIST_DIR)) {
      await serveStatic(req, res);
      return;
    }

    sendText(res, 200, "FreshMart auth server is running.");
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : "Unexpected server error." });
  }
});

server.listen(PORT, () => {
  console.log(`FreshMart server listening on http://localhost:${PORT}`);
  console.log(`Owner login: ${OWNER_EMAIL}`);
});
