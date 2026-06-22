-- ===========================================================================
-- ESQUEMA COMPLETO Y NORMALIZADO DE BASE DE DATOS POSTGRESQL - ANDESMODA ERP + POS + E-COMMERCE
-- Generado para optimizar y asegurar la integridad referencial relacional de nivel empresarial.
-- ===========================================================================

-- 1. Habilitar extensión recomentada para UUIDs si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLA: USERS (Empleados, Nómina y Cuentas)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'u-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    dni VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    password_hash VARCHAR(255) DEFAULT '$2b$10$unify-hash-placeholder-andesmoda',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: CATEGORIES (Colecciones y Líneas)
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'c-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: PRODUCTS (Prendas y Catálogo)
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'p-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(50) DEFAULT 'AndesModa',
    purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    offer_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'DESACTIVADO', 'DISCONTINUADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: CUSTOMERS (Clientes del Sistema)
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'cus-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    name VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    credit_limit DECIMAL(10, 2) DEFAULT 0.00,
    points INT DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    order_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: ORDERS (Ventas de POS y E-Commerce)
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'o-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    code VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA')),
    channel VARCHAR(30) NOT NULL DEFAULT 'E-COMMERCE' CHECK (channel IN ('POS_TIENDA', 'E-COMMERCE')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO')),
    shipping_address TEXT,
    shipping_method VARCHAR(100),
    coupon_applied VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: ORDER_ITEMS (Relación Detalles de Ventas)
-- ==========================================
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'item-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- ==========================================
-- TABLA: INVENTORY_LOGS (Kárdex y Movimientos)
-- ==========================================
CREATE TABLE IF NOT EXISTS inventory_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'log-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ENTRADA', 'SALIDA', 'AJUSTE_MERMA', 'VENTA', 'REPOSICIÓN')),
    quantity INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    reason TEXT,
    registered_by VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: CASH_REGISTERS (Operaciones de Arqueo)
-- ==========================================
CREATE TABLE IF NOT EXISTS cash_registers (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'csh-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ABIERTO', 'CERRADO')),
    opened_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    closed_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    opened_by VARCHAR(100) NOT NULL,
    closed_by VARCHAR(100),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    real_cash_amount DECIMAL(10, 2) DEFAULT 0.00,
    difference_amount DECIMAL(10, 2) DEFAULT 0.00,
    difference_reason TEXT,
    transactions JSONB DEFAULT '[]'::jsonb
);

-- ==========================================
-- TABLA: FINANCE_TRANSACTIONS (Libro Contable)
-- ==========================================
CREATE TABLE IF NOT EXISTS finance_transactions (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'txn-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INGRESO', 'EGRESO')),
    category VARCHAR(50) NOT NULL, -- ej: 'VENTA', 'COMPRA_STOCK', 'GASTO_OPERATIVO', 'ENVIO', 'OTROS'
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reference VARCHAR(150),
    registered_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    refId VARCHAR(50)
);

-- ==========================================
-- TABLA: AUDIT_LOGS (Logs de Seguridad)
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'audit-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- ÍNDICES RECOMENDADOS PARA MAXIMIZAR RENDIMIENTO
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_customers_dni ON customers (dni);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);

-- ===========================================================================
-- SEMILLAS/DATOS INICIALES (Métricas por defecto)
-- ===========================================================================

-- Insertar Cuentas de Prueba por Defecto
INSERT INTO users (id, email, name, role, status, dni, phone, address) VALUES
('u-admin', 'erteanti@gmail.com', 'Administrador Principal', 'ADMINISTRADOR', 'ACTIVO', '12345678', '987654321', 'Avenida Los Incas 405, Cusco'),
('u-vendedor', 'vendedor@andesmoda.pe', 'Elena Ramos Vendedora', 'VENDEDOR', 'ACTIVO', '87654321', '981234567', 'Jr. de la Selva 102, Lima')
ON CONFLICT (email) DO NOTHING;

-- Insertar Categorías Iniciales
INSERT INTO categories (id, name, description) VALUES
('c-1', 'Suéteres de Alpaca', 'Prendas con finas fibras de alpaca cuzqueña y alta retención térmica'),
('c-2', 'Chumpas Navideñas', 'Línea de temporada con diseños andinos para invierno festivo'),
('c-3', 'Bufandas Bordadas', 'Accesorios de telar tradicional hechos por comunidades cusqueñas'),
('c-4', 'Sacos Premium', 'Sacos ejecutivos de alta costura con toques andinos ancestrales')
ON CONFLICT (name) DO NOTHING;

-- Insertar Productos del Catálogo Inicial
INSERT INTO products (id, sku, barcode, name, description, category_id, brand, purchase_price, sale_price, offer_price, stock, min_stock, images) VALUES
('p-1', 'AND-8941', '775893201485', 'Suéter de Alpaca Cusco Imperial', 'Hecho con 100% alpaca tejida a mano con patrones tradicionales ornamentales del valle sagrado.', 'c-1', 'AndesModa', 55.00, 120.00, 110.00, 18, 5, '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400"]'::jsonb),
('p-2', 'AND-3211', '775432109865', 'Chumpa Navideña Rodolfo', 'Fibra abrigadora extra premium con cuello redondo y diseño exclusivo invernal festivo.', 'c-2', 'AndesModa', 40.00, 89.90, 0.00, 4, 5, '["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400"]'::jsonb),
('p-3', 'AND-5541', '775554123451', 'Bufanda de Telar Písac', 'Bufanda artesanal de alpaca hilada y teñida orgánicamente.', 'c-3', 'AndesModa', 20.00, 50.00, 0.00, 12, 3, '["https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"]'::jsonb)
ON CONFLICT (sku) DO NOTHING;

-- Insertar Clientes por defecto
INSERT INTO customers (id, name, dni, email, phone, address, credit_limit, points, total_spent, order_count) VALUES
('cus-1', 'Sofía Ramos', '44321098', 'sofia@gmail.com', '998877665', 'San Blas Alto 41, Cusco', 500.00, 100, 0.00, 0)
ON CONFLICT (dni) DO NOTHING;

-- ===========================================================================
-- DESACTIVACIÓN AUTOMÁTICA DE ROW LEVEL SECURITY (RLS) EN SUPABASE
-- ===========================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- FIN DE LA CONSTRUCCIÓN DEL ESQUEMA RELACIONAL EMPRESARIAL.
-- ===========================================================================
