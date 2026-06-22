-- ===========================================================================
-- ARQUITECTURA DE BASE DE DATOS EMPRESARIAL - ANDESMODA ERP, POS & E-COMMERCE
-- COMPATIBLE CON POSTGRESQL 17, PRISMA ORM Y NEON DATABASE
-- Nivel de Normalización: Tercera Forma Normal (3FN)
-- ===========================================================================

-- Habilitar extensión para generación avanzada de UUIDs v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMERACIONES (DOMINIOS Y SEGURIDAD)
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('ACTIVO', 'DESACTIVADO', 'DISCONTINUADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_channel') THEN
        CREATE TYPE order_channel AS ENUM ('POS_TIENDA', 'E-COMMERCE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDIENTE', 'PAGADO', 'DESPACHADO', 'ENTREGADO', 'CANCELADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_log_type') THEN
        CREATE TYPE inventory_log_type AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE_MERMA', 'VENTA', 'REPOSICIÓN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_type') THEN
        CREATE TYPE finance_type AS ENUM ('INGRESO', 'EGRESO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cash_register_status') THEN
        CREATE TYPE cash_register_status AS ENUM ('ABIERTO', 'CERRADO');
    END IF;
END $$;

-- ==========================================
-- 1. MÓDULO DE SEGURIDAD, ACCESO Y CONTROL DE USUARIOS (UAC)
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    role user_role NOT NULL DEFAULT 'CLIENTE',
    status user_status NOT NULL DEFAULT 'ACTIVO',
    dni VARCHAR(20) UNIQUE,
    phone VARCHAR(25),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    reference TEXT,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. MÓDULO DE CATÁLOGO DE PRODUCTOS (PRENDAS Y CONTROL DE STOCK)
-- ==========================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand VARCHAR(60) DEFAULT 'AndesModa',
    purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (sale_price >= 0),
    offer_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (offer_price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INT NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    status product_status NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. MÓDULO CRM (CLIENTES Y LEALTAD)
-- ==========================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(25),
    address TEXT,
    credit_limit DECIMAL(12, 2) DEFAULT 0.00 CHECK (credit_limit >= 0),
    points INT DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favoritos del cliente (Mapeo N a N entre Users/Customers y Productos)
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- ==========================================
-- 4. MÓDULO MARKETING (CUPONES Y PROMOCIONES)
-- ==========================================

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5, 2) CHECK (discount_percent BETWEEN 0 AND 100),
    discount_amount DECIMAL(12, 2) CHECK (discount_amount >= 0),
    min_purchase DECIMAL(12, 2) DEFAULT 0.00 CHECK (min_purchase >= 0),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    banner_url TEXT,
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. MÓDULO TRANSACCIONAL (PEDIDOS, VENTAS POS Y E-COMMERCE)
-- ==========================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Opcional si es venta POS anónima
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Registrado por (Vendedor o Cliente en Web)
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    payment_method payment_method NOT NULL DEFAULT 'EFECTIVO',
    channel order_channel NOT NULL DEFAULT 'E-COMMERCE',
    status order_status NOT NULL DEFAULT 'PENDIENTE',
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    shipping_address TEXT,
    shipping_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * price) STORED
);

-- Carrito temporal para persistir estados e-commerce
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. MÓDULO LOGÍSTICA & ENVÍO
-- ==========================================

CREATE TABLE IF NOT EXISTS courier_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) UNIQUE NOT NULL,
    contact_phone VARCHAR(25),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES courier_companies(id) ON DELETE SET NULL,
    tracking_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PREPARACION', -- PREPARACION, EN_ALMACEN, EN_RUTA, ENTREGADO, DEVUELTO
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 7. MÓDULO DE CAJA (ARQUEOS Y PUNTO DE VENTA)
-- ==========================================

CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opened_by UUID NOT NULL REFERENCES users(id),
    closed_by UUID REFERENCES users(id),
    status cash_register_status NOT NULL DEFAULT 'ABIERTO',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (initial_amount >= 0),
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    real_cash_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (real_cash_amount >= 0),
    difference_amount DECIMAL(12, 2) DEFAULT 0.00,
    difference_reason TEXT
);

-- ==========================================
-- 8. MÓDULO FINANZAS (FLUJO DE CAJA)
-- ==========================================

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type finance_type NOT NULL,
    category VARCHAR(80) NOT NULL, -- Ej: 'VENTA_POS', 'NÓMINA_EMPLEADOS', 'PAGO_SERVICIOS', 'COMPRA_STOCK'
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    reference_id VARCHAR(100), -- ID del pedido o recibo relacionado
    registered_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. LOGÍSTICA KÁRDEX E HISTORIAL DE MOVIMIENTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type inventory_log_type NOT NULL,
    quantity INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    reason TEXT,
    registered_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 10. AUDIT_LOGS Y SEGURIDAD OPERATIVA
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- CREACIÓN DE ÍNDICES OPTIMIZADOS PARA BÚSQUEDA Y RENDIMIENTO EN NEON / PRISMA
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_finance_type_cat ON financial_transactions(type, category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
