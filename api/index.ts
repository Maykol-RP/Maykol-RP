import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Connection Validation and Sanitization Helpers
function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  const clean = url.trim();
  if (clean.includes("...") || clean.includes("(") || clean.includes(")") || clean.includes("example") || clean.includes("your-project") || clean.includes("Tu URL")) return false;
  return true;
}

function isValidSupabaseKey(key: string | undefined): boolean {
  if (!key) return false;
  const clean = key.trim();
  if (clean.includes("...") || clean.includes("(") || clean.includes(")") || clean.includes("your-anon-key") || clean.includes("Tu clave")) return false;
  return true;
}

function sanitizeSupabaseEnv(val: string | undefined, isUrl = false): string {
  if (!val) return "";
  let clean = val.trim();
  while ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  
  if (isUrl) {
    if (!isValidSupabaseUrl(clean)) return "";
    while (clean.endsWith("/")) {
      clean = clean.slice(0, -1).trim();
    }
    if (clean.endsWith("/rest/v1")) {
      clean = clean.slice(0, -8).trim();
    }
    while (clean.endsWith("/")) {
      clean = clean.slice(0, -1).trim();
    }
  } else {
    if (!isValidSupabaseKey(clean)) return "";
  }
  return clean;
}

const dbUrlAndKey = {
  get url() {
    const rawUrl = process.env.SUPABASE_URL || "https://hvbqbvorrroyrvlchmvb.supabase.co";
    return sanitizeSupabaseEnv(rawUrl, true) || "https://hvbqbvorrroyrvlchmvb.supabase.co";
  },
  get key() {
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YnFidm9ycnJveXJ2bGNobXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTA4MjAsImV4cCI6MjA5NzYyOTg4NH0.PUJmwam12nMQgBo8jg_lp_pddaf351Igd8I4PAamfOQ";
    return sanitizeSupabaseEnv(rawKey, false) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YnFidm9ycnJveXJ2bGNobXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTA4MjAsImV4cCI6MjA5NzYyOTg4NH0.PUJmwam12nMQgBo8jg_lp_pddaf351Igd8I4PAamfOQ";
  }
};

let activeUrl = "";
let activeKey = "";
let activeClient = createClient(dbUrlAndKey.url, dbUrlAndKey.key, { auth: { persistSession: false } });

const supabase = new Proxy({} as any, {
  get(target, prop) {
    const currentUrl = dbUrlAndKey.url;
    const currentKey = dbUrlAndKey.key;
    if (currentUrl !== activeUrl || currentKey !== activeKey) {
      activeUrl = currentUrl;
      activeKey = currentKey;
      activeClient = createClient(currentUrl, currentKey, { auth: { persistSession: false } });
    }
    const val = activeClient[prop];
    if (typeof val === "function") {
      return val.bind(activeClient);
    }
    return val;
  }
});

function useSupabase(): boolean {
  const envUrl = process.env.SUPABASE_URL || "https://hvbqbvorrroyrvlchmvb.supabase.co";
  const envKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YnFidm9ycnJveXJ2bGNobXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTA4MjAsImV4cCI6MjA5NzYyOTg4NH0.PUJmwam12nMQgBo8jg_lp_pddaf351Igd8I4PAamfOQ";
  if (!envUrl || !envKey) return false;
  
  const sanitizedUrl = sanitizeSupabaseEnv(envUrl, true);
  const sanitizedKey = sanitizeSupabaseEnv(envKey, false);
  
  if (!sanitizedUrl || !sanitizedKey) return false;
  if (sanitizedUrl === "https://jfkfmvbmvhneslrqgcql.supabase.co") return false;
  return true;
}

function logSupabaseError(context: string, error: any) {
  if (!error) return;
  console.error(`${context}:`, {
    message: error.message || error,
    details: error.details || "",
    hint: error.hint || "",
    code: error.code || "",
    fullError: error
  });
}

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Cache variable to keep state in memory for 0ms reads
let memoryDB = readFromFileOnly();

// Helper to load db directly from file system once on server start
function readFromFileOnly() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {
        users: [],
        categories: [],
        products: [],
        customers: [],
        shippingMethods: [],
        coupons: [],
        banners: [],
        promotions: [],
        orders: [],
        inventoryLogs: [],
        cashRegisters: [],
        financeTransactions: [],
        auditLogs: []
      };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file", err);
    return {
      users: [],
      categories: [],
      products: [],
      customers: [],
      shippingMethods: [],
      coupons: [],
      banners: [],
      promotions: [],
      orders: [],
      inventoryLogs: [],
      cashRegisters: [],
      financeTransactions: [],
      auditLogs: []
    };
  }
}

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Helper to read database
function readDB() {
  return memoryDB;
}

// Helper to write database
function writeDB(data: any) {
  try {
    memoryDB = data;
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");

    // Database modifications are successfully written locally to JSON database
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

// Helper code log helper
function addAuditLog(db: any, user: string, role: string, action: string, details: string) {
  const newLog = {
    id: "a-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    user,
    role,
    action,
    details
  };
  db.auditLogs = [newLog, ...db.auditLogs];
}

async function syncAndGetDB() {
  if (!useSupabase()) {
    return memoryDB;
  }
  try {
    const [
      { data: users, error: uErr },
      { data: categories, error: cErr },
      { data: products, error: pErr },
      { data: customers, error: cusErr },
      { data: orders, error: oErr },
      { data: orderItems, error: oiErr },
      { data: inventoryLogs, error: lErr },
      { data: cashRegisters, error: crErr },
      { data: financeTransactions, error: txnErr },
      { data: auditLogs, error: aErr }
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("products").select("*"),
      supabase.from("customers").select("*"),
      supabase.from("orders").select("*"),
      supabase.from("order_items").select("*"),
      supabase.from("inventory_logs").select("*"),
      supabase.from("cash_registers").select("*"),
      supabase.from("finance_transactions").select("*"),
      supabase.from("audit_logs").select("*")
    ]);

    // Check if there is a general authentication or client failure (e.g. invalid API key/URL, or completely offline)
    const isAuthError = (uErr && (uErr.message.includes("API key") || uErr.message.includes("JWT") || uErr.message.includes("Invalid key") || uErr.message.includes("Failed to fetch"))) ||
                        (pErr && (pErr.message.includes("API key") || pErr.message.includes("JWT") || pErr.message.includes("Invalid key") || pErr.message.includes("Failed to fetch")));

    if (isAuthError) {
      console.warn("Supabase authentication or connection error. Operating in standalone local mode.");
      return memoryDB;
    }

    // Individual descriptive warnings for each table connection to make configuration crystal clear
    if (uErr) logSupabaseError("Users query issue (using local memory for this table)", uErr);
    if (cErr) logSupabaseError("Categories query issue (using local memory for this table)", cErr);
    if (pErr) logSupabaseError("Products query issue (using local memory for this table)", pErr);
    if (cusErr) logSupabaseError("Customers query issue (using local memory for this table)", cusErr);
    if (oErr) logSupabaseError("Orders query issue (using local memory for this table)", oErr);
    if (oiErr) logSupabaseError("Order Items query issue (using local memory for this table)", oiErr);
    if (lErr) logSupabaseError("Inventory Logs query issue (using local memory for this table)", lErr);
    if (crErr) logSupabaseError("Cash Registers query issue (using local memory for this table)", crErr);
    if (txnErr) logSupabaseError("Finance Transactions query issue (using local memory for this table)", txnErr);
    if (aErr) logSupabaseError("Audit Logs query issue (using local memory for this table)", aErr);

    const categoriesSource = (cErr || !categories) ? (memoryDB.categories || []) : categories;
    const productsSource = (pErr || !products) ? (memoryDB.products || []) : products;
    const customersSource = (cusErr || !customers) ? (memoryDB.customers || []) : customers;
    const ordersSource = (oErr || !orders) ? (memoryDB.orders || []) : orders;
    const orderItemsSource = (oiErr || !orderItems) ? [] : orderItems;
    const inventoryLogsSource = (lErr || !inventoryLogs) ? (memoryDB.inventoryLogs || []) : inventoryLogs;
    const cashRegistersSource = (crErr || !cashRegisters) ? (memoryDB.cashRegisters || []) : cashRegisters;
    const financeTransactionsSource = (txnErr || !financeTransactions) ? (memoryDB.financeTransactions || []) : financeTransactions;
    const usersSource = (uErr || !users) ? (memoryDB.users || []) : users;
    const auditLogsSource = (aErr || !auditLogs) ? (memoryDB.auditLogs || []) : auditLogs;

    const mappedCategories = categoriesSource.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      slug: (c.slug || c.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    }));

    const mappedProducts = productsSource.map((p: any) => {
      const parentCat = mappedCategories.find((c: any) => c.id === p.category_id || c.name === p.category);
      return {
        id: p.id,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        description: p.description || "",
        category: parentCat ? parentCat.name : (p.category || "Suéteres de Alpaca"),
        category_id: p.category_id || p.category || null,
        brand: p.brand || "AndesModa",
        purchasePrice: p.purchase_price !== undefined ? Number(p.purchase_price) : (p.purchasePrice || 0),
        salePrice: p.sale_price !== undefined ? Number(p.sale_price) : (p.salePrice || 0),
        offerPrice: p.offer_price !== undefined ? Number(p.offer_price) : (p.offerPrice || 0),
        stock: p.stock !== undefined ? p.stock : (p.stock || 0),
        minStock: p.min_stock !== undefined ? p.min_stock : (p.minStock || 5),
        images: Array.isArray(p.images) ? p.images : [],
        status: p.status || "ACTIVO"
      };
    });

    const mappedCustomers = customersSource.map((c: any) => {
      const first = c.name ? (c.name.split(" ")[0] || c.name) : (c.firstName || "");
      const last = c.name ? (c.name.split(" ").slice(1).join(" ") || "") : (c.lastName || "");
      return {
        id: c.id,
        dni: c.dni || "",
        name: c.firstName || first,
        lastName: c.lastName || last,
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        totalSpent: c.total_spent !== undefined ? Number(c.total_spent) : (c.totalSpent || 0),
        orderCount: c.order_count !== undefined ? c.order_count : (c.orderCount || 0)
      };
    });

    const mappedOrders = ordersSource.map((o: any) => {
      const parentCustomer = mappedCustomers.find((c: any) => c.id === o.customer_id || c.id === o.customerId);
      
      const resolvedItems = orderItemsSource.filter((item: any) => item.order_id === o.id).map((item: any) => {
        const prod = mappedProducts.find((p: any) => p.id === item.product_id);
        return {
          productId: item.product_id,
          name: prod ? prod.name : "Producto",
          sku: prod ? prod.sku : "",
          quantity: item.quantity,
          price: Number(item.unit_price),
          total: Number(item.subtotal)
        };
      });

      const items = resolvedItems.length > 0 ? resolvedItems : (Array.isArray(o.items) ? o.items : []);

      return {
        id: o.id,
        code: o.code || o.id,
        channel: o.channel === "POS_TIENDA" || o.channel === "POS" ? "POS" : "WEB",
        customerId: o.customer_id || o.customerId,
        customerName: parentCustomer ? `${parentCustomer.name} ${parentCustomer.lastName}`.trim() : (o.customer_name || o.customerName || "Cliente"),
        items,
        subtotal: o.subtotal !== undefined ? Number(o.subtotal) : (o.subtotal || 0),
        discount: o.discount !== undefined ? Number(o.discount) : (o.discount || 0),
        shippingCost: o.shipping_cost !== undefined ? Number(o.shipping_cost) : (o.shippingCost || 0),
        total: o.total !== undefined ? Number(o.total) : (o.total || 0),
        paymentMethod: o.payment_method || o.paymentMethod || "EFECTIVO",
        shippingMethodId: o.shipping_method || o.shippingMethodId || undefined,
        shippingCarrier: o.shipping_carrier || o.shippingCarrier || undefined,
        status: o.status || "CONFIRMADO",
        timestamp: o.timestamp
      };
    });

    const mappedInventoryLogs = inventoryLogsSource.map((l: any) => {
      const prod = mappedProducts.find((p: any) => p.id === l.product_id || p.id === l.productId);
      return {
        id: l.id,
        productId: l.product_id || l.productId,
        productName: prod ? prod.name : (l.product_name || l.productName || "Producto"),
        sku: prod ? prod.sku : (l.sku || ""),
        type: l.type === "AJUSTE_MERMA" || l.type === "AJUSTE" ? "AJUSTE" : l.type,
        quantity: l.quantity,
        previousStock: l.stock_before !== undefined ? l.stock_before : (l.previousStock || 0),
        newStock: l.stock_after !== undefined ? l.stock_after : (l.newStock || 0),
        reason: l.reason,
        user: l.registered_by || l.user || "Sistema",
        timestamp: l.timestamp
      };
    });

    const mappedCashRegisters = cashRegistersSource.map((cr: any) => {
      return {
        id: cr.id,
        userId: cr.opened_by_user_id || cr.userId || "u-admin",
        userName: cr.opened_by || cr.userName,
        openedAt: cr.opened_at || cr.openedAt,
        closedAt: cr.closed_at || cr.closedAt,
        initialAmount: cr.initial_amount !== undefined ? Number(cr.initial_amount) : (cr.initialAmount || 0),
        closedAmount: cr.closed_at !== undefined || cr.closedAt ? Number(cr.real_cash_amount || cr.closedAmount) : null,
        transactions: Array.isArray(cr.transactions) ? cr.transactions : [],
        status: cr.status === "ABIERTO" || cr.status === "ABIERTA" ? "ABIERTA" : "CERRADA"
      };
    });

    const mappedFinanceTransactions = financeTransactionsSource.map((t: any) => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount !== undefined ? Number(t.amount) : (t.amount || 0),
      description: t.reference || t.description || "",
      timestamp: t.timestamp,
      refId: t.refId || undefined
    }));

    const mappedUsers = usersSource.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status === "ACTIVO" ? "ACTIVO" : "BLOQUEADO",
      dni: u.dni || "",
      phone: u.phone || "",
      address: u.address || ""
    }));

    const mappedAuditLogs = auditLogsSource.map((a: any) => ({
      id: a.id,
      timestamp: a.timestamp,
      user: a.user_name || a.user || "Sistema",
      role: a.user_role || a.role || "ADMINISTRADOR",
      action: a.action,
      details: a.details || ""
    }));

    // Merge any locally-created entries from memoryDB that are not present in the fetched list from Supabase
    const finalUsers = [...mappedUsers, ...(memoryDB.users || []).filter((local: any) => !mappedUsers.some((m: any) => m.id === local.id))];
    const finalCategories = [...mappedCategories, ...(memoryDB.categories || []).filter((local: any) => !mappedCategories.some((m: any) => m.id === local.id))];
    const finalProducts = [...mappedProducts, ...(memoryDB.products || []).filter((local: any) => !mappedProducts.some((m: any) => m.id === local.id))];
    const finalCustomers = [...mappedCustomers, ...(memoryDB.customers || []).filter((local: any) => !mappedCustomers.some((m: any) => m.id === local.id))];
    const finalOrders = [...mappedOrders, ...(memoryDB.orders || []).filter((local: any) => !mappedOrders.some((m: any) => m.id === local.id))];
    const finalInventoryLogs = [...mappedInventoryLogs, ...(memoryDB.inventoryLogs || []).filter((local: any) => !mappedInventoryLogs.some((m: any) => m.id === local.id))];
    const finalCashRegisters = [...mappedCashRegisters, ...(memoryDB.cashRegisters || []).filter((local: any) => !mappedCashRegisters.some((m: any) => m.id === local.id))];
    const finalFinanceTransactions = [...mappedFinanceTransactions, ...(memoryDB.financeTransactions || []).filter((local: any) => !mappedFinanceTransactions.some((m: any) => m.id === local.id))];
    const finalAuditLogs = [...mappedAuditLogs, ...(memoryDB.auditLogs || []).filter((local: any) => !mappedAuditLogs.some((m: any) => m.id === local.id))];

    const updatedDB = {
      users: finalUsers,
      categories: finalCategories,
      products: finalProducts,
      customers: finalCustomers,
      orders: finalOrders,
      inventoryLogs: finalInventoryLogs,
      cashRegisters: finalCashRegisters,
      financeTransactions: finalFinanceTransactions,
      auditLogs: finalAuditLogs,
      shippingMethods: memoryDB.shippingMethods || [],
      coupons: memoryDB.coupons || [],
      banners: memoryDB.banners || [],
      promotions: memoryDB.promotions || []
    };

    memoryDB = updatedDB;
    writeDB(updatedDB);
    return updatedDB;
  } catch (err) {
    console.warn("Supabase querying error, falling back to local database copy:", err);
    return memoryDB;
  }
}

// API Routes

app.post("/api/upload", (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: "Falta el nombre de archivo o contenido base64" });
    }
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const ext = path.extname(filename) || ".png";
    const nameOnly = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFilename = `${nameOnly}_${Date.now()}${ext}`;
    
    fs.writeFileSync(path.join(uploadsDir, uniqueFilename), buffer);
    
    const imageUrl = `/uploads/${uniqueFilename}`;
    res.json({ url: imageUrl });
  } catch (err: any) {
    console.error("Error al subir archivo:", err);
    res.status(500).json({ error: err.message });
  }
});

// Consolidated Database State
app.get("/api/db", async (req, res) => {
  const db = await syncAndGetDB();
  res.json(db);
});

// USERS CRUD
app.get("/api/users", (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.post("/api/users", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";
  
  const newUser = {
    id: "u-" + Date.now(),
    email: req.body.email,
    name: req.body.name,
    role: req.body.role || "CLIENTE",
    status: req.body.status || "ACTIVO",
    dni: req.body.dni,
    phone: req.body.phone,
    address: req.body.address
  };

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("users").insert({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        dni: newUser.dni || null,
        phone: newUser.phone || null,
        address: newUser.address || null
      });
      if (error) {
        logSupabaseError("Error creating user in Supabase", error);
        res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception creating user:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.users.push(newUser);
  addAuditLog(db, userName, userRole, "Crear Usuario", `Se creó el usuario ${newUser.name} (${newUser.email}) - Rol: ${newUser.role}`);
  writeDB(db);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", async (req, res) => {
  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const updatedUser = {
    ...db.users[index],
    email: req.body.email ?? db.users[index].email,
    name: req.body.name ?? db.users[index].name,
    role: req.body.role ?? db.users[index].role,
    status: req.body.status ?? db.users[index].status,
    dni: req.body.dni ?? db.users[index].dni,
    phone: req.body.phone ?? db.users[index].phone,
    address: req.body.address ?? db.users[index].address
  };

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("users").update({
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
        dni: updatedUser.dni || null,
        phone: updatedUser.phone || null,
        address: updatedUser.address || null
      }).eq("id", req.params.id);
      if (error) {
        logSupabaseError("Error updating user in Supabase", error);
        res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception updating user:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.users[index] = updatedUser;
  addAuditLog(db, userName, userRole, "Editar Usuario", `Se editó el usuario ${updatedUser.name} (${updatedUser.email})`);
  writeDB(db);
  res.json(updatedUser);
});

app.delete("/api/users/:id", async (req, res) => {
  const db = readDB();
  const user = db.users.find((u: any) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("users").delete().eq("id", req.params.id);
      if (error) {
        logSupabaseError("Error deleting user in Supabase", error);
        res.status(500).json({ error: "No se puede eliminar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception deleting user:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.users = db.users.filter((u: any) => u.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Usuario", `Se eliminó al usuario ${user.name} (${user.email})`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// CATEGORIES CRUD
app.get("/api/categories", (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.post("/api/categories", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newCategory = {
    id: "cat-" + Date.now(),
    name: req.body.name,
    description: req.body.description || "",
    slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  };

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("categories").insert({
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description || "",
        status: "ACTIVO"
      });
      if (error) {
        logSupabaseError("Error creating category in Supabase", error);
        res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception creating category:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.categories.push(newCategory);
  addAuditLog(db, userName, userRole, "Crear Categoría", `Surgió la categoría ${newCategory.name}`);
  writeDB(db);
  res.status(201).json(newCategory);
});

app.put("/api/categories/:id", async (req, res) => {
  const db = readDB();
  const index = db.categories.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const updatedCategory = {
    ...db.categories[index],
    name: req.body.name ?? db.categories[index].name,
    description: req.body.description ?? db.categories[index].description,
    slug: (req.body.name ?? db.categories[index].name).toLowerCase().replace(/[^a-z0-9]+/g, "-")
  };

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("categories").update({
        name: updatedCategory.name,
        description: updatedCategory.description || ""
      }).eq("id", req.params.id);
      if (error) {
        logSupabaseError("Error updating category in Supabase", error);
        res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception updating category:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.categories[index] = updatedCategory;
  addAuditLog(db, userName, userRole, "Editar Categoría", `Se actualizó la categoría a ${updatedCategory.name}`);
  writeDB(db);
  res.json(updatedCategory);
});

app.delete("/api/categories/:id", async (req, res) => {
  const db = readDB();
  const category = db.categories.find((c: any) => c.id === req.params.id);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", req.params.id);
      if (error) {
        logSupabaseError("Error deleting category in Supabase", error);
        res.status(500).json({ error: "No se puede eliminar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception deleting category:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.categories = db.categories.filter((c: any) => c.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Categoría", `Se eliminó la categoría ${category.name}`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// PRODUCTS CRUD
app.get("/api/products", (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.post("/api/products", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const catFind = db.categories.find((c: any) => c.name === req.body.category || c.id === req.body.category || c.id === req.body.category_id);
  const catId = catFind ? catFind.id : null;

  const newProduct = {
    id: "p-" + Date.now(),
    sku: req.body.sku || "AND-" + Math.floor(Math.random() * 9000 + 1000),
    barcode: req.body.barcode || "" + Math.floor(Math.random() * 8999999999999 + 1000000000000),
    name: req.body.name,
    description: req.body.description || "",
    category: catFind ? catFind.name : (req.body.category || "Suéteres de Alpaca"),
    brand: req.body.brand || "AndesModa",
    purchasePrice: Number(req.body.purchasePrice) || 0,
    salePrice: Number(req.body.salePrice) || 0,
    offerPrice: Number(req.body.offerPrice) || 0,
    stock: Number(req.body.stock) || 0,
    minStock: Number(req.body.minStock) || 0,
    images: req.body.images && req.body.images.length > 0 ? req.body.images : ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400"],
    status: req.body.status || "ACTIVO"
  };

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("products").insert({
        id: newProduct.id,
        sku: newProduct.sku,
        barcode: newProduct.barcode,
        name: newProduct.name,
        description: newProduct.description,
        category_id: catId,
        brand: newProduct.brand,
        purchase_price: newProduct.purchasePrice,
        sale_price: newProduct.salePrice,
        offer_price: newProduct.offerPrice,
        stock: newProduct.stock,
        min_stock: newProduct.minStock,
        images: newProduct.images,
        status: newProduct.status
      });
      if (error) {
        logSupabaseError("Error creating product in Supabase", error);
        res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception creating product:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  // Inventario log for initial stock
  if (newProduct.stock > 0) {
    const newLog = {
      id: "l-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: "ENTRADA" as const,
      quantity: newProduct.stock,
      previousStock: 0,
      newStock: newProduct.stock,
      reason: "Carga inicial de producto nuevo",
      user: userName,
      timestamp: new Date().toISOString()
    };

    if (useSupabase()) {
      try {
        const { error: lErr } = await supabase.from("inventory_logs").insert({
          id: newLog.id,
          product_id: newLog.productId,
          type: "ENTRADA",
          quantity: newLog.quantity,
          stock_before: 0,
          stock_after: newLog.newStock,
          reason: newLog.reason,
          registered_by: newLog.user
        });
        if (lErr) {
           console.error("Error creating initial stock log on Supabase:", lErr);
        } else {
           db.inventoryLogs.push(newLog);
        }
      } catch (lErr) {
        console.error("Error writing initial product log stock:", lErr);
      }
    } else {
      db.inventoryLogs.push(newLog);
    }
  }

  db.products.push(newProduct);
  addAuditLog(db, userName, userRole, "Crear Producto", `Se creó el producto ${newProduct.name} (SKU: ${newProduct.sku}) con stock ${newProduct.stock}`);
  writeDB(db);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", async (req, res) => {
  const db = readDB();
  const index = db.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const originalProduct = db.products[index];
  const catFind = db.categories.find((c: any) => c.name === req.body.category || c.id === req.body.category || c.id === req.body.category_id);
  const catId = catFind ? catFind.id : (originalProduct.category_id || null);

  const updatedProduct = {
    ...originalProduct,
    sku: req.body.sku ?? originalProduct.sku,
    barcode: req.body.barcode ?? originalProduct.barcode,
    name: req.body.name ?? originalProduct.name,
    description: req.body.description ?? originalProduct.description,
    category: catFind ? catFind.name : (req.body.category ?? originalProduct.category),
    brand: req.body.brand ?? originalProduct.brand,
    purchasePrice: req.body.purchasePrice !== undefined ? Number(req.body.purchasePrice) : originalProduct.purchasePrice,
    salePrice: req.body.salePrice !== undefined ? Number(req.body.salePrice) : originalProduct.salePrice,
    offerPrice: req.body.offerPrice !== undefined ? Number(req.body.offerPrice) : originalProduct.offerPrice,
    minStock: req.body.minStock !== undefined ? Number(req.body.minStock) : originalProduct.minStock,
    images: req.body.images ?? originalProduct.images,
    status: req.body.status ?? originalProduct.status
  };

  if (useSupabase()) {
    try {
      const { error } = await supabase.from("products").update({
        sku: updatedProduct.sku,
        barcode: updatedProduct.barcode,
        name: updatedProduct.name,
        description: updatedProduct.description,
        category_id: catId,
        brand: updatedProduct.brand,
        purchase_price: updatedProduct.purchasePrice,
        sale_price: updatedProduct.salePrice,
        offer_price: updatedProduct.offerPrice,
        min_stock: updatedProduct.minStock,
        images: updatedProduct.images,
        status: updatedProduct.status
      }).eq("id", req.params.id);
      if (error) {
        logSupabaseError("Error updating product in Supabase", error);
        res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
        return;
      }
    } catch (err: any) {
      console.error("Exception updating product:", err);
      res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
      return;
    }
  }

  db.products[index] = updatedProduct;
  addAuditLog(db, userName, userRole, "Editar Producto", `Se editó el producto ${updatedProduct.name} - SKU: ${updatedProduct.sku}`);
  writeDB(db);
  res.json(updatedProduct);
});

// Fix Price (Fijar Precio)
app.post("/api/products/:id/fix-price", async (req, res) => {
  const db = readDB();
  const index = db.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const p = db.products[index];
  const oldPrices = `Compra: ${p.purchasePrice}, Venta: ${p.salePrice}, Oferta: ${p.offerPrice}`;
  
  const purchasePrice = Number(req.body.purchasePrice) || p.purchasePrice;
  const salePrice = Number(req.body.salePrice) || p.salePrice;
  const offerPrice = Number(req.body.offerPrice) ?? p.offerPrice;

  try {
    const { error } = await supabase.from("products").update({
      purchase_price: purchasePrice,
      sale_price: salePrice,
      offer_price: offerPrice
    }).eq("id", req.params.id);
    if (error) {
      logSupabaseError("Error fixing price in Supabase", error);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception fixing price:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  p.purchasePrice = purchasePrice;
  p.salePrice = salePrice;
  p.offerPrice = offerPrice;

  addAuditLog(db, userName, userRole, "Fijar Precio", `Precios reajustados para ${p.name}. Antes: (${oldPrices}) -> Ahora: (Compra: ${p.purchasePrice}, Venta: ${p.salePrice}, Oferta: ${p.offerPrice})`);
  writeDB(db);
  res.json(p);
});

// Update stock (Actualizar Stock) / Ajustes
app.post("/api/products/:id/update-stock", async (req, res) => {
  const db = readDB();
  const index = db.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const p = db.products[index];
  const previousStock = p.stock;
  const newStock = Number(req.body.stock);
  const diff = newStock - previousStock;
  
  if (diff === 0) {
    res.json(p);
    return;
  }

  const type = diff > 0 ? "ENTRADA" : "SALIDA";
  const quantity = Math.abs(diff);

  const newLog = {
    id: "l-" + Date.now() + "-" + Math.floor(Math.random() * 100),
    productId: p.id,
    productName: p.name,
    sku: p.sku,
    type: type as any,
    quantity: quantity,
    previousStock: previousStock,
    newStock: newStock,
    reason: req.body.reason || "Ajuste manual de inventario",
    user: userName,
    timestamp: new Date().toISOString()
  };

  try {
    const { error: pErr } = await supabase.from("products").update({ stock: newStock }).eq("id", req.params.id);
    if (pErr) {
      logSupabaseError("Error updating stock in Supabase", pErr);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error al actualizar Stock: " + pErr.message });
      return;
    }

    const { error: lErr } = await supabase.from("inventory_logs").insert({
      id: newLog.id,
      product_id: newLog.productId,
      type: newLog.type === "AJUSTE" ? "AJUSTE_MERMA" : newLog.type,
      quantity: newLog.quantity,
      stock_before: newLog.previousStock,
      stock_after: newLog.newStock,
      reason: newLog.reason,
      registered_by: newLog.user
    });

    if (lErr) {
      console.error("Error writing product inventory log in Supabase:", lErr);
    } else {
      db.inventoryLogs.push(newLog);
    }
  } catch (err: any) {
    console.error("Exception tracking stock modification:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  p.stock = newStock;
  addAuditLog(db, userName, userRole, "Actualizar Stock", `Se ajustó inventario de '${p.name}'. Anterior: ${previousStock}, Nuevo: ${newStock}. Razón: ${req.body.reason}`);
  writeDB(db);
  res.json(p);
});

// Duplicate Product
app.post("/api/products/:id/duplicate", async (req, res) => {
  const db = readDB();
  const p = db.products.find((prod: any) => prod.id === req.params.id);
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const duplicated = {
    ...p,
    id: "p-" + Date.now(),
    sku: p.sku + "-COPIA",
    barcode: "" + (Number(p.barcode) + Math.floor(Math.random() * 100) || Math.floor(Math.random() * 1000000)),
    name: p.name + " (Copia)",
    stock: 0 // New duplicate starts at zero stock
  };

  const catFind = db.categories.find((c: any) => c.name === duplicated.category);
  const catId = catFind ? catFind.id : null;

  try {
    const { error } = await supabase.from("products").insert({
      id: duplicated.id,
      sku: duplicated.sku,
      barcode: duplicated.barcode,
      name: duplicated.name,
      description: duplicated.description,
      category_id: catId,
      brand: duplicated.brand,
      purchase_price: duplicated.purchasePrice,
      sale_price: duplicated.salePrice,
      offer_price: duplicated.offerPrice,
      stock: 0,
      min_stock: duplicated.minStock,
      images: duplicated.images,
      status: duplicated.status
    });
    if (error) {
      logSupabaseError("Error duplicating product on Supabase", error);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception duplicating product:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.products.push(duplicated);
  addAuditLog(db, userName, userRole, "Duplicar Producto", `Se duplicó el producto ${p.name} a copia de SKU ${duplicated.sku}`);
  writeDB(db);
  res.status(201).json(duplicated);
});

app.delete("/api/products/:id", async (req, res) => {
  const db = readDB();
  const p = db.products.find((prod: any) => prod.id === req.params.id);
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  try {
    const { error } = await supabase.from("products").delete().eq("id", req.params.id);
    if (error) {
      logSupabaseError("Error deleting product in Supabase", error);
      res.status(500).json({ error: "No se puede eliminar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception deleting product:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.products = db.products.filter((prod: any) => prod.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Producto", `Se eliminó el producto ${p.name} (SKU: ${p.sku})`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// CUSTOMERS CRUD
app.get("/api/customers", (req, res) => {
  const db = readDB();
  res.json(db.customers);
});

app.post("/api/customers", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newCustomer = {
    id: "c-" + Date.now(),
    dni: req.body.dni || "",
    name: req.body.name,
    lastName: req.body.lastName || "",
    email: req.body.email || "",
    phone: req.body.phone || "",
    address: req.body.address || "",
    totalSpent: 0,
    orderCount: 0
  };

  const fullName = `${newCustomer.name} ${newCustomer.lastName}`.trim();

  try {
    const { error } = await supabase.from("customers").insert({
      id: newCustomer.id,
      name: fullName,
      dni: newCustomer.dni || null,
      email: newCustomer.email || null,
      phone: newCustomer.phone || null,
      address: newCustomer.address || null,
      total_spent: 0,
      order_count: 0
    });
    if (error) {
      logSupabaseError("Error creating customer in Supabase", error);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception creating customer:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.customers.push(newCustomer);
  addAuditLog(db, userName, userRole, "Crear Cliente", `Se registró al cliente ${newCustomer.name} ${newCustomer.lastName}`);
  writeDB(db);
  res.status(201).json(newCustomer);
});

app.put("/api/customers/:id", async (req, res) => {
  const db = readDB();
  const index = db.customers.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const original = db.customers[index];
  const updated = {
    ...original,
    dni: req.body.dni ?? original.dni,
    name: req.body.name ?? original.name,
    lastName: req.body.lastName ?? original.lastName,
    email: req.body.email ?? original.email,
    phone: req.body.phone ?? original.phone,
    address: req.body.address ?? original.address
  };

  const fullName = `${updated.name} ${updated.lastName}`.trim();

  try {
    const { error } = await supabase.from("customers").update({
      name: fullName,
      dni: updated.dni || null,
      email: updated.email || null,
      phone: updated.phone || null,
      address: updated.address || null
    }).eq("id", req.params.id);
    if (error) {
      logSupabaseError("Error updating customer in Supabase", error);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception updating customer:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.customers[index] = updated;
  addAuditLog(db, userName, userRole, "Editar Cliente", `Se editó datos del cliente ${updated.name} ${updated.lastName}`);
  writeDB(db);
  res.json(updated);
});

app.delete("/api/customers/:id", async (req, res) => {
  const db = readDB();
  const c = db.customers.find((cust: any) => cust.id === req.params.id);
  if (!c) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  try {
    const { error } = await supabase.from("customers").delete().eq("id", req.params.id);
    if (error) {
      logSupabaseError("Error deleting customer in Supabase", error);
      res.status(500).json({ error: "No se puede eliminar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception deleting customer:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.customers = db.customers.filter((cust: any) => cust.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Cliente", `Se borró al cliente ${c.name} ${c.lastName}`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// ORDERS & CHECKOUT (CRITICAL UNIFIED CHANNELL)
app.get("/api/orders", (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.post("/api/orders", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Sistema";
  const userRole = req.headers["x-user-role"] as string || "CLIENTE";

  const {
    channel, // 'WEB' or 'POS'
    customerId,
    customerName,
    items, // array of items: id, quantity, price
    subtotal,
    discount,
    shippingCost,
    total,
    paymentMethod,
    shippingMethodId,
    shippingCarrier
  } = req.body;

  // 1. Direct validation against latest Supabase stock to assure enterprise limits
  let dbProducts;
  try {
    const { data, error: pErr } = await supabase.from("products").select("id, name, stock, sku");
    if (pErr) {
       throw new Error(pErr.message);
    }
    dbProducts = data;
  } catch (err: any) {
    console.error("Error fetching products for stock validation:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }
  const productsList = dbProducts || [];

  for (const item of items) {
    const prod = productsList.find((p: any) => p.id === item.productId);
    if (!prod) {
      return res.status(400).json({ error: `Product id ${item.productId} not found` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ error: `Stock insuficiente para ${prod.name}. Disponible: ${prod.stock}` });
    }
  }

  // 2. Begin central transaction state emulation
  const orderId = "o-" + Date.now();
  const orderCode = `PED-${db.orders.length + 1001}`;
  
  // Create Main Order matching the database schema
  const newOrderPg = {
    id: orderId,
    code: orderCode,
    customer_id: customerId || "c-1", // default Sofía
    subtotal: Number(subtotal),
    discount: Number(discount) || 0,
    shipping_cost: Number(shippingCost) || 0,
    total: Number(total),
    payment_method: (paymentMethod || "EFECTIVO").toUpperCase(),
    channel: channel === "POS" ? "POS_TIENDA" : "E-COMMERCE",
    status: channel === "POS" ? "ENTREGADO" : "PENDIENTE",
    shipping_address: req.body.shippingAddress || null,
    shipping_method: shippingMethodId || null,
    coupon_applied: req.body.couponApplied || null
  };

  try {
    // Write primary Order row
    const { error: oErr } = await supabase.from("orders").insert(newOrderPg);
    if (oErr) {
      logSupabaseError("Error inserting order into Supabase", oErr);
      res.status(500).json({ error: "No se pudo guardar localmente. Supabase devolvió un error al crear la orden: " + oErr.message });
      return;
    }

    // Write normalized Order Items to order_items table
    const orderItemsPg = items.map((item: any) => ({
      id: "item-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      order_id: orderId,
      product_id: item.productId,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      subtotal: Number(item.total || (item.quantity * item.price))
    }));

    const { error: oiErr } = await supabase.from("order_items").insert(orderItemsPg);
    if (oiErr) {
      logSupabaseError("Error inserting order_items into Supabase", oiErr);
      res.status(500).json({ error: "No se pudo guardar localmente. Supabase devolvió un error al crear ítems de orden: " + oiErr.message });
      return;
    }

    // Deduct stock and write Inventory logs on Supabase
    for (const item of items) {
      const prod = productsList.find((p: any) => p.id === item.productId);
      const prevStock = prod ? prod.stock : 0;
      const newStock = prevStock - item.quantity;

      const { error: updErr } = await supabase.from("products").update({ stock: newStock }).eq("id", item.productId);
      if (updErr) {
        logSupabaseError("Error updating product stock in Supabase", updErr);
        res.status(500).json({ error: "No se pudo guardar localmente. Supabase devolvió un error al actualizar Stock de prendas: " + updErr.message });
        return;
      }

      const { error: invErr } = await supabase.from("inventory_logs").insert({
        id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        product_id: item.productId,
        type: "SALIDA",
        quantity: item.quantity,
        stock_before: prevStock,
        stock_after: newStock,
        reason: `Venta ${channel} ${orderCode}`,
        registered_by: userName
      });
      if (invErr) {
         console.error("Error generating inventory log in Supabase:", invErr);
      }
    }

    // Accumulate customer stats directly inside Supabase
    const userCustId = customerId || "c-1";
    const { data: customerEntry } = await supabase.from("customers").select("total_spent, order_count").eq("id", userCustId).single();
    if (customerEntry) {
      const currentSpent = Number(customerEntry.total_spent || 0);
      const currentCount = Number(customerEntry.order_count || 0);
      const { error: custErr } = await supabase.from("customers").update({
        total_spent: Number((currentSpent + Number(total)).toFixed(2)),
        order_count: currentCount + 1
      }).eq("id", userCustId);
      if (custErr) console.error("Error updating customer total_spent on Supabase:", custErr);
    }

    // Update opened cash drawer session on Supabase if POS Channel
    if (channel === "POS") {
      const { data: openSessions } = await supabase.from("cash_registers").select("*").eq("status", "ABIERTO");
      const activeSession = openSessions && openSessions[0];
      if (activeSession) {
        const trxList = Array.isArray(activeSession.transactions) ? activeSession.transactions : [];
        const newPOSTrx = {
          id: "crt-" + Date.now(),
          type: "VENTA",
          amount: Number(total),
          description: `Cobro en POS de orden ${orderCode}`,
          timestamp: new Date().toISOString()
        };
        const updatedTrxList = [...trxList, newPOSTrx];
        const newCurrentAmount = Number(activeSession.current_amount || 0) + Number(total);

        const { error: crErr } = await supabase.from("cash_registers").update({
          transactions: updatedTrxList,
          current_amount: newCurrentAmount
        }).eq("id", activeSession.id);
        if (crErr) console.error("Error updating active cash register on Supabase:", crErr);
      }
    }

    // Log accounting ledger of income to finance_transactions table
    const { error: finErr } = await supabase.from("finance_transactions").insert({
      id: "txn-" + Date.now(),
      type: "INGRESO",
      category: "VENTA",
      amount: Number(total),
      reference: `Cobro canal ${channel} - ${orderCode}`,
      registered_by: userName,
      refId: orderId
    });
    if (finErr) console.error("Error logging finance_transaction on Supabase:", finErr);

  } catch (err: any) {
    console.error("Critical server checkout transaction error:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  // Update memory state cache for instantaneous local performance (ONLY runs on Supabase success)
  const newOrder = {
    id: orderId,
    code: orderCode,
    channel,
    customerId: customerId || "c-1",
    customerName: customerName || "Sofía Ramos",
    items,
    subtotal: Number(subtotal),
    discount: Number(discount) || 0,
    shippingCost: Number(shippingCost) || 0,
    total: Number(total),
    paymentMethod,
    shippingMethodId,
    shippingCarrier,
    status: channel === "POS" ? "ENTREGADO" : "PENDIENTE",
    timestamp: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // Sync memory cache lists
  for (const item of items) {
    const prod = db.products.find((p: any) => p.id === item.productId);
    if (prod) {
      const prevStock = prod.stock;
      prod.stock -= item.quantity;
      db.inventoryLogs.push({
        id: "l-" + Date.now() + "-" + Math.floor(Math.random() * 100),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: "SALIDA",
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: prod.stock,
        reason: `Venta ${channel} #${orderCode}`,
        user: userName,
        timestamp: new Date().toISOString()
      });
    }
  }

  const custIndex = db.customers.findIndex((c: any) => c.id === newOrder.customerId);
  if (custIndex !== -1) {
    db.customers[custIndex].totalSpent = Number((db.customers[custIndex].totalSpent + newOrder.total).toFixed(2));
    db.customers[custIndex].orderCount += 1;
  }

  if (channel === "POS") {
    const activeSessionIndex = db.cashRegisters.findIndex((cr: any) => cr.status === "ABIERTA" || cr.status === "ABIERTO");
    if (activeSessionIndex !== -1) {
      db.cashRegisters[activeSessionIndex].transactions.push({
        id: "crt-" + Date.now(),
        type: "VENTA",
        amount: newOrder.total,
        description: `Cobro en POS de orden ${orderCode}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  db.financeTransactions.push({
    id: "f-" + Date.now(),
    type: "INGRESO",
    category: "VENTA",
    amount: newOrder.total,
    description: `Cobro canal ${channel} - ${orderCode}`,
    timestamp: new Date().toISOString(),
    refId: newOrder.id
  });

  addAuditLog(db, userName, userRole, `Pedido ${channel}`, `Venta concretada ${orderCode} por total de S/. ${newOrder.total}`);
  writeDB(db);
  res.status(201).json(newOrder);
});

// Update Order status
app.patch("/api/orders/:id/status", async (req, res) => {
  const db = readDB();
  const orderIndex = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (orderIndex === -1) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const originalStatus = db.orders[orderIndex].status;
  const newStatus = req.body.status;

  try {
    // 1. Update status on Supabase FIRST
    const { error: sErr } = await supabase.from("orders").update({ status: newStatus }).eq("id", req.params.id);
    if (sErr) {
      logSupabaseError("Error updating order status on Supabase", sErr);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + sErr.message });
      return;
    }

    // 2. Handle cancellation return stock
    if (newStatus === "CANCELADO" && originalStatus !== "CANCELADO") {
      for (const item of db.orders[orderIndex].items) {
        const prod = db.products.find((p: any) => p.id === item.productId);
        if (prod) {
          const prevStock = prod.stock;
          const newStock = prevStock + item.quantity;

          const { error: updErr } = await supabase.from("products").update({ stock: newStock }).eq("id", prod.id);
          if (updErr) {
             console.error("Error returning cancelled product stock on Supabase:", updErr);
          }

          const nLog = {
            id: "l-" + Date.now() + "-" + Math.floor(Math.random() * 100),
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: "ENTRADA" as const,
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            reason: `Retorno por cancelación #${db.orders[orderIndex].code}`,
            user: userName,
            timestamp: new Date().toISOString()
          };

          const { error: logErr } = await supabase.from("inventory_logs").insert({
            id: nLog.id,
            product_id: nLog.productId,
            type: "ENTRADA",
            quantity: nLog.quantity,
            stock_before: prevStock,
            stock_after: newStock,
            reason: nLog.reason,
            registered_by: userName
          });

          if (!logErr) {
            db.inventoryLogs.push(nLog);
          }
          prod.stock = newStock;
        }
      }

      // Record refund transaction as EGRESO
      const refTrx = {
        id: "f-" + Date.now(),
        type: "EGRESO",
        category: "OTROS",
        amount: db.orders[orderIndex].total,
        description: `Reembolso por cancelación de orden ${db.orders[orderIndex].code}`,
        timestamp: new Date().toISOString(),
        refId: db.orders[orderIndex].id
      };

      const { error: finErr } = await supabase.from("finance_transactions").insert({
        id: refTrx.id,
        type: "EGRESO",
        category: "OTROS",
        amount: refTrx.amount,
        reference: refTrx.description,
        registered_by: userName,
        refId: refTrx.refId
      });

      if (!finErr) {
        db.financeTransactions.push(refTrx);
      }
    }
  } catch (err: any) {
    console.error("Exception processing order status patch:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.orders[orderIndex].status = newStatus;
  addAuditLog(db, userName, userRole, "Cambio Estado Pedido", `Pedido ${db.orders[orderIndex].code} cambió de ${originalStatus} a ${newStatus}`);
  writeDB(db);
  res.json(db.orders[orderIndex]);
});

// SHIPPING METHODS CRUD
app.get("/api/shipping-methods", (req, res) => {
  const db = readDB();
  res.json(db.shippingMethods);
});

app.post("/api/shipping-methods", (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newSM = {
    id: "sm-" + Date.now(),
    name: req.body.name,
    cost: Number(req.body.cost) || 0,
    deliveryTime: req.body.deliveryTime || "Mismo día",
    status: req.body.status || "ACTIVO"
  };
  db.shippingMethods.push(newSM);
  addAuditLog(db, userName, userRole, "Crear Transportista", `Se creó el método de envío ${newSM.name} con costo S/. ${newSM.cost}`);
  writeDB(db);
  res.status(201).json(newSM);
});

app.put("/api/shipping-methods/:id", (req, res) => {
  const db = readDB();
  const index = db.shippingMethods.findIndex((s: any) => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Shipping method not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const original = db.shippingMethods[index];
  const updated = {
    ...original,
    name: req.body.name ?? original.name,
    cost: req.body.cost !== undefined ? Number(req.body.cost) : original.cost,
    deliveryTime: req.body.deliveryTime ?? original.deliveryTime,
    status: req.body.status ?? original.status
  };

  db.shippingMethods[index] = updated;
  addAuditLog(db, userName, userRole, "Editar Transportista", `Se editó el método de envío ${updated.name}`);
  writeDB(db);
  res.json(updated);
});

app.delete("/api/shipping-methods/:id", (req, res) => {
  const db = readDB();
  const c = db.shippingMethods.find((sm: any) => sm.id === req.params.id);
  if (!c) {
    res.status(404).json({ error: "Shipping method not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  db.shippingMethods = db.shippingMethods.filter((sm: any) => sm.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Transportista", `Se eliminó el método de de envío ${c.name}`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// MARKETING: COUPONS CRUD
app.get("/api/coupons", (req, res) => {
  const db = readDB();
  res.json(db.coupons);
});

app.post("/api/coupons", (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newC = {
    id: "cp-" + Date.now(),
    code: req.body.code.toUpperCase().replace(/\s+/g, ""),
    discountType: req.body.discountType || "PORCENTAJE",
    value: Number(req.body.value) || 0,
    status: req.body.status || "ACTIVO"
  };
  db.coupons.push(newC);
  addAuditLog(db, userName, userRole, "Crear Cupón", `Cupón creado: ${newC.code} (${newC.value})`);
  writeDB(db);
  res.status(201).json(newC);
});

app.put("/api/coupons/:id", (req, res) => {
  const db = readDB();
  const index = db.coupons.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const origin = db.coupons[index];
  const updated = {
    ...origin,
    code: (req.body.code ?? origin.code).toUpperCase().replace(/\s+/g, ""),
    discountType: req.body.discountType ?? origin.discountType,
    value: req.body.value !== undefined ? Number(req.body.value) : origin.value,
    status: req.body.status ?? origin.status
  };

  db.coupons[index] = updated;
  addAuditLog(db, userName, userRole, "Editar Cupón", `Se modificó el cupón ${updated.code}`);
  writeDB(db);
  res.json(updated);
});

app.delete("/api/coupons/:id", (req, res) => {
  const db = readDB();
  const c = db.coupons.find((cp: any) => cp.id === req.params.id);
  if (!c) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  db.coupons = db.coupons.filter((cp: any) => cp.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Cupón", `Se eliminó el cupón ${c.code}`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// MARKETING: BANNERS CRUD
app.get("/api/banners", (req, res) => {
  const db = readDB();
  res.json(db.banners);
});

app.post("/api/banners", (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newB = {
    id: "bn-" + Date.now(),
    title: req.body.title,
    imageUrl: req.body.imageUrl || "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=800",
    link: req.body.link || "#",
    status: req.body.status || "ACTIVO"
  };
  db.banners.push(newB);
  addAuditLog(db, userName, userRole, "Crear Banner", `Se añadió el banner publicitario: ${newB.title}`);
  writeDB(db);
  res.status(201).json(newB);
});

app.put("/api/banners/:id", (req, res) => {
  const db = readDB();
  const index = db.banners.findIndex((b: any) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const origin = db.banners[index];
  const updated = {
    ...origin,
    title: req.body.title ?? origin.title,
    imageUrl: req.body.imageUrl ?? origin.imageUrl,
    link: req.body.link ?? origin.link,
    status: req.body.status ?? origin.status
  };
  db.banners[index] = updated;
  addAuditLog(db, userName, userRole, "Editar Banner", `Se actualizó el banner ${updated.title}`);
  writeDB(db);
  res.json(updated);
});

app.delete("/api/banners/:id", (req, res) => {
  const db = readDB();
  const b = db.banners.find((ban: any) => ban.id === req.params.id);
  if (!b) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  db.banners = db.banners.filter((ban: any) => ban.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Banner", `Se eliminó el banner publicitario ${b.title}`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// MARKETING: PROMOTIONS CRUD
app.get("/api/promotions", (req, res) => {
  const db = readDB();
  res.json(db.promotions);
});

app.post("/api/promotions", (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newP = {
    id: "pr-" + Date.now(),
    title: req.body.title,
    description: req.body.description || "",
    discount: Number(req.body.discount) || 0,
    status: req.body.status || "ACTIVO"
  };
  db.promotions.push(newP);
  addAuditLog(db, userName, userRole, "Crear Promoción", `Se lanzó campaña de promoción: ${newP.title}`);
  writeDB(db);
  res.status(201).json(newP);
});

app.put("/api/promotions/:id", (req, res) => {
  const db = readDB();
  const index = db.promotions.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Promotion not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const origin = db.promotions[index];
  const updated = {
    ...origin,
    title: req.body.title ?? origin.title,
    description: req.body.description ?? origin.description,
    discount: req.body.discount !== undefined ? Number(req.body.discount) : origin.discount,
    status: req.body.status ?? origin.status
  };
  db.promotions[index] = updated;
  addAuditLog(db, userName, userRole, "Editar Promoción", `Se modificaron los datos de la promoción ${updated.title}`);
  writeDB(db);
  res.json(updated);
});

app.delete("/api/promotions/:id", (req, res) => {
  const db = readDB();
  const p = db.promotions.find((pr: any) => pr.id === req.params.id);
  if (!p) {
    res.status(404).json({ error: "Promotion not found" });
    return;
  }
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  db.promotions = db.promotions.filter((pr: any) => pr.id !== req.params.id);
  addAuditLog(db, userName, userRole, "Eliminar Promoción", `Se eliminó la promoción ${p.title}`);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// CASH REGISTERS SESSION (ABERTURA, CIERRE, CONTROL DE TRANSACCIONES)
app.get("/api/cash-registers", (req, res) => {
  const db = readDB();
  res.json(db.cashRegisters);
});

app.post("/api/cash-registers/open", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Carlos Mendoza";
  const userId = req.headers["x-user-id"] as string || "u-vendor";
  const userRole = req.headers["x-user-role"] as string || "VENDEDOR";

  const active = db.cashRegisters.find((cr: any) => cr.status === "ABIERTA" || cr.status === "ABIERTO");
  if (active) {
    res.status(400).json({ error: "Ya existe una caja abierta en uso." });
    return;
  }

  const newSession = {
    id: "cr-" + Date.now(),
    userId,
    userName,
    openedAt: new Date().toISOString(),
    closedAt: null,
    initialAmount: Number(req.body.initialAmount) || 0,
    closedAmount: null,
    transactions: [],
    status: "ABIERTA"
  };

  try {
    const { error } = await supabase.from("cash_registers").insert({
      id: newSession.id,
      opened_at: newSession.openedAt,
      opened_by: newSession.userName,
      initial_amount: newSession.initialAmount,
      current_amount: newSession.initialAmount,
      status: "ABIERTO",
      transactions: [],
      opened_by_user_id: newSession.userId
    });
    if (error) {
      logSupabaseError("Error opening cash register in Supabase", error);
      res.status(500).json({ error: "No se puede abrir caja localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception opening cash register:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.cashRegisters.push(newSession);
  addAuditLog(db, userName, userRole, "Apertura de Caja", `Abrió caja con saldo base de S/. ${newSession.initialAmount}`);
  writeDB(db);
  res.json(newSession);
});

app.post("/api/cash-registers/close", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Carlos Mendoza";
  const userRole = req.headers["x-user-role"] as string || "VENDEDOR";

  const sessionIndex = db.cashRegisters.findIndex((cr: any) => cr.status === "ABIERTA" || cr.status === "ABIERTO");
  if (sessionIndex === -1) {
    res.status(404).json({ error: "No hay ninguna caja abierta para cerrar." });
    return;
  }

  const session = db.cashRegisters[sessionIndex];
  const closedAt = new Date().toISOString();
  const closedAmount = Number(req.body.closedAmount) || 0;

  try {
    const { error } = await supabase.from("cash_registers").update({
      closed_at: closedAt,
      real_cash_amount: closedAmount,
      status: "CERRADO",
      closed_by_user_id: session.userId || "u-admin"
    }).eq("id", session.id);
    if (error) {
      logSupabaseError("Error closing cash register in Supabase", error);
      res.status(500).json({ error: "No se puede cerrar caja localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception closing cash register:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  session.status = "CERRADA";
  session.closedAt = closedAt;
  session.closedAmount = closedAmount;

  addAuditLog(db, userName, userRole, "Cierre de Caja", `Cerró caja con arqueo acumulado de S/. ${session.closedAmount}`);
  writeDB(db);
  res.json(session);
});

app.post("/api/cash-registers/transaction", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Carlos Mendoza";
  const userRole = req.headers["x-user-role"] as string || "VENDEDOR";

  const sessionIndex = db.cashRegisters.findIndex((cr: any) => cr.status === "ABIERTA" || cr.status === "ABIERTO");
  if (sessionIndex === -1) {
    res.status(404).json({ error: "No hay ninguna caja abierta activa." });
    return;
  }

  const session = db.cashRegisters[sessionIndex];
  const { type, amount, description } = req.body;

  const trx = {
    id: "crt-" + Date.now(),
    type, // 'INGRESO' | 'EGRESO'
    amount: Number(amount),
    description,
    timestamp: new Date().toISOString()
  };

  try {
    // Read previous transactions from DB
    const { data: dbRegister, error: gsErr } = await supabase.from("cash_registers").select("transactions, current_amount").eq("id", session.id).single();
    if (gsErr) {
       throw new Error(gsErr.message);
    }
    if (!dbRegister) {
       throw new Error("No cash register document found in database.");
    }
    
    const prevTransactions = Array.isArray(dbRegister.transactions) ? dbRegister.transactions : [];
    const updatedTrxs = [...prevTransactions, trx];
    const prevAmount = Number(dbRegister.current_amount || 0);
    const newAmount = type === "INGRESO" ? prevAmount + Number(amount) : prevAmount - Number(amount);

    const { error: updErr } = await supabase.from("cash_registers").update({
      transactions: updatedTrxs,
      current_amount: newAmount
    }).eq("id", session.id);
    
    if (updErr) {
       throw new Error(updErr.message);
    }

    // Insert sync into finance_transactions table
    const { error: finErr } = await supabase.from("finance_transactions").insert({
      id: "f-" + Date.now(),
      type: type,
      category: type === "INGRESO" ? "VENTA" : "GASTO_OPERATIVO",
      amount: Number(amount),
      reference: `Caja POS: ${description}`,
      registered_by: userName
    });
    if (finErr) {
       console.error("Error logging manual cash ledger to Supabase:", finErr);
    }
  } catch (err: any) {
    console.error("Exception in cash register manual transaction sync:", err);
    res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error de transacción de caja: " + err.message });
    return;
  }

  session.transactions.push(trx);

  // Sync to general Finance Ledger
  db.financeTransactions.push({
    id: "f-" + Date.now(),
    type: type, // 'INGRESO' or 'EGRESO'
    category: type === "INGRESO" ? "VENTA" : "GASTO_OPERATIVO",
    amount: Number(amount),
    description: `Caja POS: ${description}`,
    timestamp: new Date().toISOString()
  });

  addAuditLog(db, userName, userRole, `Transacción de Caja (${type})`, `Registro de S/. ${amount} por '${description}'`);
  writeDB(db);
  res.json(session);
});

// FINANCE LEDGER
app.get("/api/finance", (req, res) => {
  const db = readDB();
  res.json(db.financeTransactions);
});

app.post("/api/finance", async (req, res) => {
  const db = readDB();
  const userName = req.headers["x-user-name"] as string || "Admin";
  const userRole = req.headers["x-user-role"] as string || "ADMINISTRADOR";

  const newTrx = {
    id: "f-" + Date.now(),
    type: req.body.type, // INGRESO or EGRESO
    category: req.body.category || "OTROS",
    amount: Number(req.body.amount) || 0,
    description: req.body.description,
    timestamp: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from("finance_transactions").insert({
      id: newTrx.id,
      type: newTrx.type,
      category: newTrx.category,
      amount: newTrx.amount,
      reference: newTrx.description,
      registered_by: userName
    });
    if (error) {
      logSupabaseError("Error creating finance transaction in Supabase", error);
      res.status(500).json({ error: "No se puede guardar localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception recording finance transaction:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  db.financeTransactions.push(newTrx);
  addAuditLog(db, userName, userRole, `Registro Financiero (${newTrx.type})`, `Movimiento de S/. ${newTrx.amount} en ${newTrx.category} - ${newTrx.description}`);
  writeDB(db);
  res.status(201).json(newTrx);
});

// AUDIT LOGS
app.get("/api/audit", (req, res) => {
  const db = readDB();
  res.json(db.auditLogs);
});

app.post("/api/audit", async (req, res) => {
  const db = readDB();
  const user = req.body.user || "Anónimo";
  const role = req.body.role || "CLIENTE";
  const action = req.body.action || "Acción";
  const details = req.body.details || "";

  const newLogId = "a-" + Date.now();

  try {
    const { error } = await supabase.from("audit_logs").insert({
      id: newLogId,
      user_name: user,
      user_role: role,
      action: action,
      details: details
    });
    if (error) {
      logSupabaseError("Error adding audit log to Supabase", error);
      res.status(500).json({ error: "No se puede registrar auditoría localmente. Supabase devolvió un error: " + error.message });
      return;
    }
  } catch (err: any) {
    console.error("Exception adding audit log:", err);
    res.status(500).json({ error: "Fallo de conexión crítico con Supabase: " + err.message });
    return;
  }

  addAuditLog(db, user, role, action, details);
  writeDB(db);
  res.status(201).json({ success: true });
});

// ============================================
// SUPABASE BACKEND INTEGRATION ENDPOINTS
// ============================================

app.get("/api/supabase/status", async (req, res) => {
  const rawUrl = process.env.SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_ANON_KEY || "";
  
  const url = sanitizeSupabaseEnv(rawUrl, true) || "https://hvbqbvorrroyrvlchmvb.supabase.co";
  const key = sanitizeSupabaseEnv(rawKey, false) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YnFidm9ycnJveXJ2bGNobXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTA4MjAsImV4cCI6MjA5NzYyOTg4NH0.PUJmwam12nMQgBo8jg_lp_pddaf351Igd8I4PAamfOQ";
  
  if (!url || !key) {
    return res.json({
      configured: false,
      status: "DISCONNECTED",
      url: "",
      message: "Las variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY no están configuradas en los Secrets de Google AI Studio."
    });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    
    // Probar select simple en categories para verificar conectividad
    const { data, error } = await supabase.from("categories").select("id").limit(1);
    
    if (error) {
      return res.json({
        configured: true,
        status: "ERROR",
        url: url,
        message: `Error al conectar a Supabase: ${error.message}. Asegúrate de haber ejecutado todo el script de creación de tablas en el panel de SQL Editor de tu proyecto de Supabase.`
      });
    }

    // Calcular la cantidad de registros por tabla para reportar
    const counts: any = {};
    const tables = ["users", "categories", "products", "customers", "orders", "inventory_logs", "cash_registers", "finance_transactions", "audit_logs"];
    
    for (const t of tables) {
      try {
        const { count, error: countErr } = await supabase.from(t).select("id", { count: "exact", head: true });
        if (!countErr) {
          counts[t] = count || 0;
        } else {
          counts[t] = "No existe tabla";
        }
      } catch {
        counts[t] = "Error";
      }
    }

    res.json({
      configured: true,
      status: "CONNECTED",
      url: url,
      counts,
      message: "¡Conectado exitosamente! El servidor de AndesModa tiene un enlace bidireccional estable con tu base de datos de Supabase."
    });

  } catch (err: any) {
    res.json({
      configured: true,
      status: "ERROR",
      url: url,
      message: `Error al establecer contacto con la red de Supabase: ${err.message}`
    });
  }
});

app.post("/api/supabase/migrate", (req, res) => {
  res.status(400).json({
    success: false,
    message: "La función de migración manual ha sido deshabilitada de forma permanente. Todos los registros se guardan automática e inmediatamente en Supabase al confirmarlos."
  });
});

// ============================================
// GEMINI CONTEXT-AWARE CHATBOT ENDPOINT
// ============================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let aiClient: any = null;

function getAiClient() {
  if (!aiClient) {
    if (!GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY environment variable is not defined.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, user } = req.body;
    if (!message) {
      return res.status(400).json({ error: "El campo 'message' es requerido." });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Servicio de IA no disponible. Por favor, asegúrate de que GEMINI_API_KEY esté configurado en el panel de Settings > Secrets."
      });
    }

    // Identify user role and sanitize inputs
    const clientUser = user || { id: "anon", name: "Cliente Invitado", role: "CLIENTE" };
    const userRole = (clientUser.role || "CLIENTE").toUpperCase();
    const userName = clientUser.name || "Invitado";

    // Load actual DB state to build context dynamically!
    const db = readDB();

    let systemPrompt = "";
    
    if (userRole === "CLIENTE") {
      // ----------------------------------------
      // CLIENT ROLE: PERSONAL SHOPPING ASSISTANT
      // ----------------------------------------
      // Hide all administrative and sensitive business/financial context entirely to prevent data leakage.
      const publicProducts = (db.products || [])
        .filter((p: any) => p.status === "ACTIVO")
        .map((p: any) => ({
          name: p.name,
          description: p.description,
          category: p.category,
          salePrice: p.salePrice,
          offerPrice: p.offerPrice || 0,
          inStock: p.stock > 0
        }));

      const publicCategories = (db.categories || []).map((c: any) => ({
        name: c.name,
        description: c.description
      }));

      const activePromotions = (db.promotions || [])
        .filter((p: any) => p.status === "ACTIVO")
        .map((p: any) => ({
          title: p.title,
          description: p.description,
          discount: p.discountValue
        }));

      systemPrompt = `Eres AndesModa AI, un amigable, refinado y experto asesor de compras de prendas de alta costura, moda andina tradicional y tendencias contemporáneas.
Estás hablando con el cliente ${userName}. Tu meta es brindarle una experiencia de atención al cliente de primer nivel.

Tus funciones para el cliente son:
1. Recomendar y guiar en la compra de prendas seleccionadas basándote en lo solicitado.
2. Resolver dudas sobre materiales, colecciones o disponibilidad.
3. Mostrar las promociones vigentes de forma atractiva.
4. Ayudar en el seguimiento conceptual del pedido.
5. Sugerir prendas complementarias para armar un outfit increíble.
6. Responder con amabilidad sobre opciones de pagos, envíos rápidos o devoluciones.

REGLAS CRÍTICAS DE SEGURIDAD (CERO FILTRACIONES):
- No reveles bajo ninguna circunstancia información administrativa o de costos de adquisición.
- Absolutamente PROHIBIDO mencionar o mostrar ingresos brutos, números de stock exactos del inventario técnico, informes de ventas generales de la empresa o datos transaccionales de otros clientes.
- Si el usuario cliente te pregunta de manera insistente sobre finanzas internas, ganancias, stocks generales o márgenes, responde amigable pero firmemente que no posees acceso a esa información gerencial.
- Responde siempre en español fluido. Utiliza Markdown elegante con un tono cálido y servicial.

Catálogo autorizado de colección actual para este cliente:
- Productos disponibles: ${JSON.stringify(publicProducts)}
- Categorías: ${JSON.stringify(publicCategories)}
- Promociones vigentes: ${JSON.stringify(activePromotions)}`;

    } else if (userRole === "VENDEDOR") {
      // ----------------------------------------
      // VENDOR ROLE: SALES FLOOR IN-STORE ASSISTANT
      // ----------------------------------------
      // Provide operational stock checks and cross-selling, but hide executive macro-finances.
      const vendorProducts = (db.products || [])
        .map((p: any) => ({
          name: p.name,
          sku: p.sku,
          category: p.category,
          salePrice: p.salePrice,
          stock: p.stock,
          status: p.status
        }));

      systemPrompt = `Eres AndesModa AI, el asistente comercial experto para el equipo de ventas de AndesModa.
Estás ayudando al vendedor ${userName} en el piso de venta o el Punto de Venta (POS).

Tus funciones como asistente comercial son:
1. Responder rápidamente consultas sobre stock disponible y ubicación por categorías.
2. Ayudar en ventas cruzadas sugeridas (sugerir productos que complementen lo que lleva el cliente).
3. Analizar rápidamente nombres o códigos SKU para verificar stock y precios de venta al público.
4. Identificar qué productos recomendar si un artículo no tiene suficiente stock.
5. Apoyar en argumentos de ventas basados en los beneficios tradicionales (lana de alpaca premium, confección artesanal, etc.).

REGLAS CRÍTICAS DE SEGURIDAD:
- No reveles reportes gerenciales financieros del balance general a los vendedores (métricas de costos de adquisición, ganancias fiscales totales, sueldos o auditorías).
- Enfócate estrictamente en promover ventas operativas e inventariado ágil.
- Responde siempre en español. Usa un tono ágil, eficiente, corporativo y profesional en Markdown con cuadros limpios.

Inventario operativo para el vendedor:
- Productos: ${JSON.stringify(vendorProducts)}`;

    } else {
      // ----------------------------------------
      // ADMIN ROLE: STRATEGIC ENTERPRISE ANALYST
      // ----------------------------------------
      // Fully-featured macro analyses, low-stock warnings, trends, custom recommendations.
      const totalProducts = db.products?.length || 0;
      const totalCustomers = db.customers?.length || 0;
      const totalSales = db.orders?.length || 0;
      
      const lowStockProducts = (db.products || [])
        .filter((p: any) => p.stock <= (p.minStock || 5) && p.status === "ACTIVO")
        .map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice
        }));

      const productSalesMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
      (db.orders || []).forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          const prodId = item.productId || item.id;
          const qty = Number(item.quantity) || 0;
          const itemTotal = Number(item.total || (qty * (item.price || 0))) || 0;
          
          if (prodId) {
            if (!productSalesMap[prodId]) {
              productSalesMap[prodId] = {
                name: item.name || '',
                sku: item.sku || '',
                qty: 0,
                revenue: 0
              };
            }
            productSalesMap[prodId].qty += qty;
            productSalesMap[prodId].revenue += itemTotal;
          }
        });
      });

      const topSellingProducts = Object.values(productSalesMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      const totalRevenue = (db.orders || [])
        .reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0);

      const recentSales = (db.orders || [])
        .slice(-5)
        .reverse()
        .map((o: any) => ({
          code: o.code,
          customerName: o.customerName,
          total: o.total,
          channel: o.channel,
          status: o.status,
          timestamp: o.timestamp
        }));

      const salesByChannel = (db.orders || []).reduce((acc: Record<string, number>, o: any) => {
        const chan = o.channel || "POS";
        acc[chan] = (acc[chan] || 0) + (Number(o.total) || 0);
        return acc;
      }, {});

      const topCustomers = (db.customers || [])
        .sort((a: any, b: any) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 5)
        .map((c: any) => ({
          name: c.name,
          email: c.email,
          totalSpent: c.totalSpent,
          orderCount: c.orderCount
        }));

      systemPrompt = `Eres AndesModa AI, un consultor estratégico de negocios y administrador analítico inteligente de AndesModa actualizados en tiempo real.
Estás hablando con el administrador general del ERP, ${userName}.

Tus funciones como analista estratégico son:
1. Analizar ventas, ingresos consolidados y flujo del Punto de Venta (POS) frente a Web/E-commerce.
2. Identificar y sugerir alertas importantes por bajo stock que requieran reabastecimiento rápido.
3. Generar resúmenes ejecutivos detallados con cuadros informativos y porcentajes del desempeño comercial.
4. Recomendar reposiciones basándote en la velocidad de venta e ingresos cruzados.
5. Recomendar promociones, descuentos u ofertas de productos con alto sobrestock o baja rotación.
6. Evaluar el desempeño comercial de nuestros clientes estrella y canales.

Entrega reportes sumamente profesionales. Utiliza Markdown para construir tablas elegantes y estructuras HTML de alto impacto visual que respondan de forma interactiva y ejecutiva.

Métricas de rendimiento gerencial:
- Total de productos registrados: ${totalProducts}
- Total de clientes en base: ${totalCustomers}
- Pedidos totales: ${totalSales}
- Ingresos brutos recaudados: S/.${totalRevenue.toFixed(2)}
- Desglose por canales: ${JSON.stringify(salesByChannel)}
- Productos con bajo stock crítico: ${JSON.stringify(lowStockProducts, null, 2)}
- Top 5 Productos más vendidos: ${JSON.stringify(topSellingProducts, null, 2)}
- Historial de últimas transacciones: ${JSON.stringify(recentSales, null, 2)}
- Clientes Prime con más gasto: ${JSON.stringify(topCustomers, null, 2)}`;
    }

    // Prepare contents array with history
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const aiText = response.text || "Lo siento, no pude procesar la respuesta voluntaria.";
    res.json({ text: aiText });

  } catch (err: any) {
    console.error("Error en /api/gemini/chat:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor al procesar la IA." });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AndesModa ERP Server] Running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
