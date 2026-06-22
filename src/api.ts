import { 
  Product, Category, User, ShippingMethod, Coupon, 
  Banner, Promotion, Order, CashRegister, FinanceJournal, AuditLog 
} from "./types";

const getHeaders = (user?: { name: string; role: string; id: string }) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  if (user) {
    headers["x-user-id"] = user.id;
    headers["x-user-name"] = user.name;
    headers["x-user-role"] = user.role;
  }
  return headers;
};

// Unified central database fetch
export async function fetchFullDatabase(): Promise<{
  products: Product[];
  categories: Category[];
  customers: any[];
  orders: Order[];
  shippingMethods: ShippingMethod[];
  coupons: Coupon[];
  banners: Banner[];
  promotions: Promotion[];
  cashRegisters: CashRegister[];
  financeLogs: FinanceJournal[];
  userNomina: User[];
  auditLogs: AuditLog[];
}> {
  const res = await fetch("/api/db");
  if (!res.ok) throw new Error("Error fetching DB");
  const raw = await res.json();
  
  // Align server-side names to App.tsx expectations
  return {
    products: raw.products || [],
    categories: raw.categories || [],
    customers: raw.customers || [],
    orders: raw.orders || [],
    shippingMethods: raw.shippingMethods || [],
    coupons: raw.coupons || [],
    banners: raw.banners || [],
    promotions: raw.promotions || [],
    cashRegisters: raw.cashRegisters || [],
    financeLogs: raw.financeTransactions || [],
    userNomina: raw.users || [],
    auditLogs: raw.auditLogs || []
  };
}

// Helper to handle response checking and error extraction
async function handleResponse<T>(res: Response, defaultErrorMsg: string): Promise<T> {
  if (!res.ok) {
    let errorMsg = defaultErrorMsg;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch (e) {
      // Ignore parse failure, use default error message
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

// User Actions
export async function createUser(data: Omit<User, "id">, actor?: any): Promise<User> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<User>(res, "Error creando operario");
}

export async function updateUser(id: string, data: Partial<User>, actor?: any): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<User>(res, "Error editando operario");
}

export async function deleteUser(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar operario");
}

// Category Actions
export async function createCategory(name: string, description: string, actor?: any): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({ name, description })
  });
  return handleResponse<Category>(res, "Error al crear la categoría");
}

export async function updateCategory(id: string, name: string, description: string, actor?: any): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify({ name, description })
  });
  return handleResponse<Category>(res, "Error al actualizar la categoría");
}

export async function deleteCategory(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar la categoría");
}

// Product Actions
export async function createProduct(data: Omit<Product, "id">, actor?: any): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Product>(res, "Error al crear el producto");
}

export async function updateProduct(id: string, data: Partial<Product>, actor?: any): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Product>(res, "Error al actualizar el producto");
}

export async function fixProductPrice(
  id: string, 
  purchasePrice: number, 
  salePrice: number, 
  offerPrice: number, 
  actor?: any
): Promise<Product> {
  const res = await fetch(`/api/products/${id}/fix-price`, {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({ purchasePrice, salePrice, offerPrice })
  });
  return handleResponse<Product>(res, "Error al ajustar precios");
}

export async function updateProductStock(
  id: string, 
  stock: number, 
  reason: string, 
  actor?: any
): Promise<Product> {
  const res = await fetch(`/api/products/${id}/update-stock`, {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({ stock, reason })
  });
  return handleResponse<Product>(res, "Error al actualizar stock");
}

export async function duplicateProduct(id: string, actor?: any): Promise<Product> {
  const res = await fetch(`/api/products/${id}/duplicate`, {
    method: "POST",
    headers: getHeaders(actor)
  });
  return handleResponse<Product>(res, "Error al duplicar el producto");
}

export async function deleteProduct(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar el producto");
}

// Customer Actions
export async function createCustomer(data: any, actor?: any): Promise<any> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<any>(res, "Error al registrar cliente");
}

export async function updateCustomer(id: string, data: any, actor?: any): Promise<any> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<any>(res, "Error al actualizar cliente");
}

export async function deleteCustomer(id: string, actor?: any): Promise<any> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<any>(res, "Error al eliminar cliente");
}

// Checkout Submit Order (Unified POS or Web)
export async function submitOrder(orderData: {
  channel: 'WEB' | 'POS';
  customerId: string;
  customerName: string;
  items: { productId: string; name: string; sku: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingMethodId?: string;
  shippingCarrier?: string;
}, actor?: any): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(orderData)
  });
  if (!res.ok) {
    const errObj = await res.json();
    throw new Error(errObj.error || "Stock insuficiente en almacenes de AndesModa");
  }
  return res.json();
}

// Update Order Status
export async function updateOrderStatus(orderId: string, status: string, actor?: any): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: getHeaders(actor),
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const errObj = await res.json();
    throw new Error(errObj.error || "Error al actualizar estado");
  }
  return res.json();
}

// Shipping Methods
export async function createShippingMethod(data: Omit<ShippingMethod, "id">, actor?: any): Promise<ShippingMethod> {
  const res = await fetch("/api/shipping-methods", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<ShippingMethod>(res, "Error al crear método de envío");
}

export async function updateShippingMethod(id: string, data: Partial<ShippingMethod>, actor?: any): Promise<ShippingMethod> {
  const res = await fetch(`/api/shipping-methods/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<ShippingMethod>(res, "Error al actualizar método de envío");
}

export async function deleteShippingMethod(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/shipping-methods/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar método de envío");
}

// Coupons
export async function createCoupon(data: Omit<Coupon, "id">, actor?: any): Promise<Coupon> {
  const res = await fetch("/api/coupons", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Coupon>(res, "Error al crear cupón");
}

export async function updateCoupon(id: string, data: Partial<Coupon>, actor?: any): Promise<Coupon> {
  const res = await fetch(`/api/coupons/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Coupon>(res, "Error al actualizar cupón");
}

export async function deleteCoupon(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/coupons/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar cupón");
}

// Banners
export async function createBanner(data: Omit<Banner, "id">, actor?: any): Promise<Banner> {
  const res = await fetch("/api/banners", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Banner>(res, "Error al crear banner");
}

export async function updateBanner(id: string, data: Partial<Banner>, actor?: any): Promise<Banner> {
  const res = await fetch(`/api/banners/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Banner>(res, "Error al actualizar banner");
}

export async function deleteBanner(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/banners/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar banner");
}

// Promotions
export async function createPromotion(data: Omit<Promotion, "id">, actor?: any): Promise<Promotion> {
  const res = await fetch("/api/promotions", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Promotion>(res, "Error al crear promoción");
}

export async function updatePromotion(id: string, data: Partial<Promotion>, actor?: any): Promise<Promotion> {
  const res = await fetch(`/api/promotions/${id}`, {
    method: "PUT",
    headers: getHeaders(actor),
    body: JSON.stringify(data)
  });
  return handleResponse<Promotion>(res, "Error al actualizar promoción");
}

export async function deletePromotion(id: string, actor?: any): Promise<{ success: boolean }> {
  const res = await fetch(`/api/promotions/${id}`, {
    method: "DELETE",
    headers: getHeaders(actor)
  });
  return handleResponse<{ success: boolean }>(res, "Error al eliminar promoción");
}

// Cash Registers setup
export async function openCashRegister(initialAmount: number, actor?: any): Promise<any> {
  const res = await fetch("/api/cash-registers/open", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({ initialAmount })
  });
  return handleResponse<any>(res, "No se pudo abrir la caja");
}

export async function closeCashRegister(firstArg?: any, secondArg?: any): Promise<any> {
  const isNumber = typeof firstArg === "number";
  const closedAmount = isNumber ? firstArg : 500;
  const actor = isNumber ? secondArg : firstArg;

  const res = await fetch("/api/cash-registers/close", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({ closedAmount })
  });
  return handleResponse<any>(res, "No se pudo cerrar la caja");
}

export async function addCashRegisterTransaction(type: 'INGRESO' | 'EGRESO', amount: number, description: string, actor?: any): Promise<any> {
  const res = await fetch("/api/cash-registers/transaction", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({ type, amount, description })
  });
  return handleResponse<any>(res, "Error al registrar movimiento en caja");
}

// Manual Finance/Journals ledger postings
export async function createFinanceInput(data: {
  type: 'INGRESO' | 'EGRESO';
  category?: string;
  amount: number;
  concept: string;
  reference?: string;
}, actor?: any): Promise<any> {
  const payload = {
    type: data.type,
    category: data.category || "OTROS",
    amount: data.amount,
    description: `${data.concept} [Ref: ${data.reference || ''}]`
  };
  const res = await fetch("/api/finance", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify(payload)
  });
  return handleResponse<any>(res, "Error al registrar asiento contable");
}

// Custom Security Audits logging
export async function writeAuditTrailLog(action: string, details: string, actor?: any): Promise<any> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: getHeaders(actor),
    body: JSON.stringify({
      user: actor?.name || "Anónimo",
      role: actor?.role || "CLIENTE",
      action,
      details
    })
  });
  return handleResponse<any>(res, "Error al generar registro de auditoría");
}
