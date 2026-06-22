-- ========================================================================================
-- ARQUITECTURA DE BASE DE DATOS EMPRESARIAL OPTIMIZADA PARA MVP - ANDESMODA
-- MOTOR DE BASE DE DATOS: POSTGRESQL 17.x, NEON DB & COMPATIBLE CON PRISMA ORM
-- DISEÑO LIGERO IMPULSADO POR REQUISITOS DE PRENDAS, TALLAS Y COLORES
-- PROPIETARIO: AndesModa Inc. (ERP + POS + E-COMMERCE)
-- ========================================================================================

-- Habilitar extensión estándar para generación de identificadores (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================================
-- 0. ELIMINACIÓN DE OBJETOS PREVIOS (Despliegue limpio e idempotente)
-- ========================================================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS finance_transactions CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drops de tipos Enum existentes
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS order_channel CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS finance_type CASCADE;
DROP TYPE IF EXISTS finance_category CASCADE;
DROP TYPE IF EXISTS cash_register_status CASCADE;

-- ========================================================================================
-- 1. TIPOS ENUMERADOS DE DOMINIO OPERATIVO (Integridad Fuerte)
-- ========================================================================================
CREATE TYPE user_role AS ENUM ('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE');
CREATE TYPE user_status AS ENUM ('ACTIVO', 'BLOQUEADO');
CREATE TYPE product_status AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE order_channel AS ENUM ('WEB', 'POS');
CREATE TYPE order_status AS ENUM ('PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');
CREATE TYPE payment_method AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA');
CREATE TYPE finance_type AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE finance_category AS ENUM ('VENTA', 'COMPRA_STOCK', 'GASTO_OPERATIVO', 'ENVIO', 'OTROS');
CREATE TYPE cash_register_status AS ENUM ('ABIERTA', 'CERRADA');

-- ========================================================================================
-- 2. TABLAS MAESTRAS Y OPERACIONALES (Normalización Tercera Forma Normal - 3FN)
-- ========================================================================================

-- Tabla maestra de Usuarios (Administrativos, Vendedores, Clientes)
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    role user_role NOT NULL DEFAULT 'CLIENTE',
    status user_status NOT NULL DEFAULT 'ACTIVO',
    dni VARCHAR(20) UNIQUE,
    phone VARCHAR(25),
    address TEXT,
    password_hash VARCHAR(255) NOT NULL DEFAULT '$2b$10$unify-hash-placeholder-andesmoda',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorías de prendas organizativas del catálogo
CREATE TABLE categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL
);

-- Catálogo de productos base (Ficha Técnica y Atributos Generales de la Prenda)
CREATE TABLE products (
    id VARCHAR(100) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand VARCHAR(60) NOT NULL DEFAULT 'AndesModa',
    purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (sale_price >= 0),
    offer_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (offer_price >= 0),
    min_stock INT NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    images TEXT[] NOT NULL DEFAULT '{}', -- URLs vectorizadas
    status product_status NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Variantes de productos por Tallas y Colores con control de stock propio
CREATE TABLE product_variants (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL, -- SKU compuesto (Ej: AND-SU-001-M-AZ)
    barcode VARCHAR(100) UNIQUE NOT NULL, -- Código de barras único por SKU
    size VARCHAR(25) NOT NULL, -- Ej: "S", "M", "L", "XL", "Unisex"
    color VARCHAR(50) NOT NULL, -- Ej: "Azul", "Rojo", "Blanco", "Natural"
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT, -- Opcional, para prendas de colores diferentes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clientes registrados y recurrentes del sistema (CRM)
CREATE TABLE customers (
    id VARCHAR(100) PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(25) NOT NULL,
    address TEXT NOT NULL,
    total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
    order_count INT NOT NULL DEFAULT 0 CHECK (order_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Métodos de envío y transportistas
CREATE TABLE shipping_methods (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    delivery_time VARCHAR(50) NOT NULL, -- Ej: "24h - 48h", "3 días"
    status user_status NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cupones promocionales
CREATE TABLE coupons (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(30) NOT NULL, -- "PORCENTAJE", "MONTO", "ENVIO"
    value DECIMAL(12, 2) NOT NULL CHECK (value >= 0),
    status user_status NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos / Ventas del sistema (Unificado: Web - POS)
CREATE TABLE orders (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Ej: PED-0001, COMP-1200
    channel order_channel NOT NULL DEFAULT 'WEB',
    customer_id VARCHAR(100) REFERENCES customers(id) ON DELETE SET NULL, -- Nullable en caso de boletas anónimas de POS
    customer_name VARCHAR(150) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    shipping_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
    payment_method payment_method NOT NULL DEFAULT 'EFECTIVO',
    shipping_method_id VARCHAR(100) REFERENCES shipping_methods(id) ON DELETE SET NULL,
    shipping_carrier VARCHAR(100),
    status order_status NOT NULL DEFAULT 'PENDIENTE',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Detalle pormenorizado del carrito de compra / Pedidos
CREATE TABLE order_items (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id VARCHAR(100) REFERENCES product_variants(id) ON DELETE SET NULL, -- Variante comprada
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    total DECIMAL(12, 2) NOT NULL CHECK (total >= 0)
);

-- Sesiones de arqueos y flujos diarios de Caja Chica (POS Punto de Venta)
CREATE TABLE cash_registers (
    id VARCHAR(100) PRIMARY KEY,
    opened_by_id VARCHAR(100) NOT NULL REFERENCES users(id),
    closed_by_id VARCHAR(100) REFERENCES users(id),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (initial_amount >= 0),
    closed_amount DECIMAL(12, 2) CHECK (closed_amount >= 0),
    status cash_register_status NOT NULL DEFAULT 'ABIERTA'
);

-- Libro de transacciones financieras y egresos/ingresos directos
CREATE TABLE finance_transactions (
    id VARCHAR(100) PRIMARY KEY,
    type finance_type NOT NULL,
    category finance_category NOT NULL DEFAULT 'OTROS',
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ref_id VARCHAR(100) -- ID externo representativo (Ej: ID de Pedido)
);

-- Registros de auditoría / Trazabilidad de seguridad (Cumplimiento GDPR/Normativa)
CREATE TABLE audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100) NOT NULL, -- "user" es palabra reservada en SQL, se prefiere username
    role VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL
);

-- Parametrización y Variables de configuración global del ERP
CREATE TABLE system_settings (
    id VARCHAR(100) PRIMARY KEY,
    key VARCHAR(80) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 3. PLANIFICACIÓN DE ÍNDICES OPTIMIZADOS PARA VELOCIDAD Y RENDIMIENTO OPERACIONAL
-- ========================================================================================
CREATE INDEX idx_users_email_role ON users(email, role);
CREATE INDEX idx_products_sku_barcode ON products(sku, barcode);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cash_registers_status ON cash_registers(status);
CREATE INDEX idx_finance_tx_type ON finance_transactions(type, category);

-- ========================================================================================
-- 4. CONJUNTO DE DATOS SEMILLA INTEGRADOS (AndesModa Alta Fidelidad)
-- ========================================================================================

-- A. Usuarios principales de AndesModa
INSERT INTO users (id, email, name, role, status, dni, phone, address) VALUES
('b3c8f8e4-e038-4e1a-85b3-fcbe9d17d001', 'admin@andesmoda.com', 'Administrador General AndesModa', 'ADMINISTRADOR', 'ACTIVO', '45892015', '+51 984 512 854', 'Av. El Sol 110, Cusco'),
('b3c8f8e4-e038-4e1a-85b3-fcbe9d17d002', 'vendedor@andesmoda.com', 'Carlos Mendoza', 'VENDEDOR', 'ACTIVO', '71029148', '+51 987 654 321', 'Calle Ruinas 415, Cusco'),
('b3c8f8e4-e038-4e1a-85b3-fcbe9d17d003', 'cliente@andesmoda.com', 'Sofía Ramos', 'CLIENTE', 'ACTIVO', '72648591', '+51 912 345 678', 'Av. Larco 456, Miraflores, Lima');

-- B. Categorías de Ropa con slug
INSERT INTO categories (id, name, description, slug) VALUES
('c0c0c0c0-1111-1111-1111-111111111111', 'Suéteres de Alpaca', 'Prendas hechas con finas fibras de alpaca selecta.', 'sueteres-alpaca'),
('c0c0c0c0-2222-2222-2222-222222222222', 'Abrigos & Ponchos', 'Prendas elegantes con toques andinos ancestrales.', 'abrigos-ponchos'),
('c0c0c0c0-3333-3333-3333-333333333333', 'Bufandas & Chales', 'Accesorios de telar tradicional tejidos finamente.', 'bufandas-chales'),
('c0c0c0c0-4444-4444-4444-444444444444', 'Vestidos Étnicos', 'Diseños que fusionan la costura moderna con telares.', 'vestidos-etnicos'),
('c0c0c0c0-5555-5555-5555-555555555555', 'Polos & Camisas', 'Prendas de suave Algodón Pima de alta calidad.', 'polos-camisas');

-- C. Productos principales (Parent)
INSERT INTO products (id, sku, barcode, name, description, category_id, brand, purchase_price, sale_price, offer_price, min_stock, images, status) VALUES
('a0a0a0a0-0001-0000-0000-000000000001', 'AND-SU-001', '7751234560012', 'Suéter Cusco Premium Alpaca', 'Suéter tejido a mano con detalles andinos, 100% fibra de alpaca natural.', 'c0c0c0c0-1111-1111-1111-111111111111', 'AndesModa', 75.00, 159.90, 139.90, 8, '{ "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400" }', 'ACTIVO'),
('a0a0a0a0-0002-0000-0000-000000000002', 'AND-AB-002', '7751234560029', 'Saco Tradicional Arequipa', 'Saco elegante de paño de alpaca gruesa con forro de jacquard premium.', 'c0c0c0c0-2222-2222-2222-222222222222', 'AndesModa', 140.00, 289.00, 0.00, 5, '{ "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400" }', 'ACTIVO'),
('a0a0a0a0-0003-0000-0000-000000000003', 'AND-BU-003', '7751234560036', 'Bufanda Telar Colca Unisex', 'Bufanda artesanal súper suave confeccionada en el cañón del Colca.', 'c0c0c0c0-3333-3333-3333-333333333333', 'Kantu', 15.00, 45.00, 39.90, 15, '{ "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400" }', 'ACTIVO');

-- D. Variantes de los productos de catálogo (Tallas, Colores y Stock específico)
INSERT INTO product_variants (id, product_id, sku, barcode, size, color, stock, image_url) VALUES
('f1f1f1f1-0001-0001-0000-000000000001', 'a0a0a0a0-0001-0000-0000-000000000001', 'AND-SU-001-S-AZ', '77512345600121', 'S', 'Azul', 15, NULL),
('f1f1f1f1-0001-0002-0000-000000000002', 'a0a0a0a0-0001-0000-0000-000000000001', 'AND-SU-001-M-AZ', '77512345600122', 'M', 'Azul', 12, NULL),
('f1f1f1f1-0001-0003-0000-000000000003', 'a0a0a0a0-0001-0000-0000-000000000001', 'AND-SU-001-L-RJ', '77512345600123', 'L', 'Rojo', 10, NULL),
('f1f1f1f1-0001-0004-0000-000000000004', 'a0a0a0a0-0001-0000-0000-000000000001', 'AND-SU-001-M-BL', '77512345600124', 'M', 'Blanco', 5, NULL),
('f1f1f1f1-0002-0001-0000-000000000005', 'a0a0a0a0-0002-0000-0000-000000000002', 'AND-AB-002-M', '77512345600291', 'M', 'Natural', 8, NULL),
('f1f1f1f1-0002-0002-0000-000000000006', 'a0a0a0a0-0002-0000-0000-000000000002', 'AND-AB-002-L', '77512345600292', 'L', 'Natural', 6, NULL),
('f1f1f1f1-0003-0001-0000-000000000007', 'a0a0a0a0-0003-0000-0000-000000000003', 'AND-BU-003-U-RJ', '77512345600361', 'Unisex', 'Rojo', 60, NULL),
('f1f1f1f1-0003-0002-0000-000000000008', 'a0a0a0a0-0003-0000-0000-000000000003', 'AND-BU-003-U-NZ', '77512345600362', 'Unisex', 'Natural', 55, NULL);

-- E. Clientes del CRM
INSERT INTO customers (id, dni, name, last_name, email, phone, address, total_spent, order_count) VALUES
('c1c1c1c1-1111-1111-1111-111111111111', '72648591', 'Sofía', 'Ramos', 'cliente@andesmoda.com', '987654321', 'Av. Larco 456, Miraflores, Lima', 299.80, 2),
('c1c1c1c1-2222-2222-2222-222222222222', '10452389', 'Dante', 'Solórzano', 'dante.solorzano@outlook.com', '984100200', 'Av. Garcilaso 300, Cusco', 0.00, 0);

-- F. Métodos de Envío
INSERT INTO shipping_methods (id, name, cost, delivery_time, status) VALUES
('e1e1e1e1-1111-1111-1111-111111111111', 'Envío Regular Terrestre', 15.00, '2-4 días hábiles', 'ACTIVO'),
('e1e1e1e1-2222-2222-2222-222222222222', 'Envío Express Aéreo', 35.00, '24h - 48h', 'ACTIVO');

-- G. Cupones de descuento
INSERT INTO coupons (id, code, discount_type, value, status) VALUES
('d1d1d1d1-1111-1111-1111-111111111111', 'ANDESPIMA20', 'PORCENTAJE', 20.00, 'ACTIVO'),
('d1d1d1d1-2222-2222-2222-222222222222', 'CUSCOVIP', 'MONTO', 30.00, 'ACTIVO');

-- H. Configuraciones maestras del ERP
INSERT INTO system_settings (id, key, value, description) VALUES
('b2b2b2b2-1111-1111-1111-111111111111', 'IGV_PERU', '18.00', 'Tasa impositiva IGV nacional de Perú en decimal'),
('b2b2b2b2-2222-2222-2222-222222222222', 'MONEDA_DEFECTO', 'PEN', 'Moneda principal de operaciones del POS e E-commerce'),
('b2b2b2b2-3333-3333-3333-333333333333', 'PIE_TICKET_POS', '¡Gracias por su compra en AndesModa! Apoyando el comercio hilandero de Cusco.', 'Texto impreso en tickets térmicos');

-- I. Sesión de Caja Activa para el POS
INSERT INTO cash_registers (id, opened_by_id, initial_amount, status) VALUES
('a1a1a1a1-1111-1111-1111-111111111111', 'b3c8f8e4-e038-4e1a-85b3-fcbe9d17d002', 300.00, 'ABIERTA');

-- ========================================================================================
-- FIN DE ARQUITECTURA DE DATOS MVP ANDESMODA
-- ========================================================================================
