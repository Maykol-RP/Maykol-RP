export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CLIENTE' | 'VENDEDOR' | 'ADMINISTRADOR';
  status: 'ACTIVO' | 'BLOQUEADO';
  dni?: string;
  phone?: string;
  address?: string;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  purchasePrice: number;
  salePrice: number;
  offerPrice: number; // 0 means no offer
  stock: number;
  minStock: number;
  images: string[];
  status: 'ACTIVO' | 'INACTIVO';
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  user: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  dni: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  orderCount: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  code: string; // e.g. PED-0001
  channel: 'WEB' | 'POS';
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
  shippingMethodId?: string;
  shippingCarrier?: string;
  status: 'PENDIENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  timestamp: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  cost: number;
  deliveryTime: string; // e.g. "1-2 días"
  status: 'ACTIVO' | 'INACTIVO';
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PORCENTAJE' | 'MONTO' | 'ENVIO';
  value: number; // percentage or fixed amount
  status: 'ACTIVO' | 'INACTIVO';
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  status: 'ACTIVO' | 'INACTIVO';
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  status: 'ACTIVO' | 'INACTIVO';
}

export interface CashRegisterSession {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  closedAmount: number | null;
  transactions: {
    id: string;
    type: 'VENTA' | 'INGRESO' | 'EGRESO';
    amount: number;
    description: string;
    timestamp: string;
  }[];
  status: 'ABIERTA' | 'CERRADA';
}

export interface FinanceTransaction {
  id: string;
  type: 'INGRESO' | 'EGRESO';
  category: 'VENTA' | 'COMPRA_STOCK' | 'GASTO_OPERATIVO' | 'ENVIO' | 'OTROS';
  amount: number;
  description: string;
  timestamp: string;
  refId?: string; // Order ID or refund ID
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export type CashRegister = CashRegisterSession;
export type FinanceJournal = FinanceTransaction;

