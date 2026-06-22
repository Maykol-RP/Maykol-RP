-- ========================================================================================
-- ARQUITECTURA DE BASE DE DATOS EMPRESARIAL PARA ANDESMODA (ERP, POS, CRM & E-COMMERCE)
-- DISEÑO FÍSICO COMUNICANTE: POSTGRESQL 17.x, NEON DB & COMPATIBLE CON PRISMA ORM (3FN)
-- ========================================================================================

-- Habilitar extensión para generación avanzada de UUIDs v4 (Requisito fundamental Neon/Prisma)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================================
-- 0. DROPS PREVENTIVOS DE OBJETOS GENERALES (Mantenimiento de esquema limpio)
-- ========================================================================================
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS employee_attendance CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS shipment_tracking CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS courier_companies CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drops de tipos Enum existentes
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS order_channel CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS inventory_move_type CASCADE;
DROP TYPE IF EXISTS finance_type CASCADE;
DROP TYPE IF EXISTS cash_register_status CASCADE;
DROP TYPE IF EXISTS tracking_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;

-- ========================================================================================
-- 1. DECLARACIONES DE ENUMS (Tipos de datos estrictos para integridad a nivel motor)
-- ========================================================================================
CREATE TYPE user_role AS ENUM ('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE');
CREATE TYPE user_status AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');
CREATE TYPE product_status AS ENUM ('ACTIVO', 'DESACTIVADO', 'DISCONTINUADO');
CREATE TYPE order_channel AS ENUM ('POS_TIENDA', 'E-COMMERCE');
CREATE TYPE order_status AS ENUM ('PENDIENTE', 'PAGADO', 'DESPACHADO', 'ENTREGADO', 'CANCELADO');
CREATE TYPE payment_method AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA');
CREATE TYPE payment_status AS ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO', 'REEMBOLSADO');
CREATE TYPE inventory_move_type AS ENUM ('ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_MERMA', 'TRACE_DEVOLUCION', 'REUBICACION_INTERNA');
CREATE TYPE finance_type AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE cash_register_status AS ENUM ('ABIERTO', 'CERRADO');
CREATE TYPE tracking_status AS ENUM ('INFORMADO', 'PREPARADO', 'EN_TRANSITO', 'EN_REPARTO', 'ENTREGADO', 'EXCEPCION');
CREATE TYPE attendance_status AS ENUM ('PRESENTE', 'TARDANZA', 'AUSENTE', 'JUSTIFICADO');

-- ========================================================================================
-- 2. MÓDULO 1: CONTROL DE ACCESO, SESIONES Y NOTIFICACIONES DE USUARIOS
-- ========================================================================================

-- Tabla maestra de Usuarios (Administrativos, Vendedores, Clientes E-commerce)
CREATE TABLE users (
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

-- Direcciones múltiples para Checkout E-commerce y envíos empresariales
CREATE TABLE user_addresses (
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

-- Sesiones activas de usuarios (Seguridad de tokens y trazabilidad de accesos)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alertas y notificaciones del sistema
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Control de asistencia laboral para personal (Nómina y control de Vendedores)
CREATE TABLE employee_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clock_out TIMESTAMP WITH TIME ZONE,
    status attendance_status NOT NULL DEFAULT 'PRESENTE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 3. MÓDULO 2: INFRAESTRUCTURA DE ALMACENAMIENTO Y LOGÍSTICA DE INVENTARIO
-- ========================================================================================

-- Almacenes de la empresa (Ejemplo: Tienda Principal Cusco, Almacén Central Lima, etc.)
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(15) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(25),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorías de los productos para organización mercadológica
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Productos base (Catálogo Maestro)
CREATE TABLE products (
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
    min_stock INT NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    status product_status NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventario físico consolidado por producto y almacén (Soporta múltiples locales físicamente)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_warehouse UNIQUE (product_id, warehouse_id)
);

-- Galería de fotos adjuntas para exhibición web del catálogo
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kardex de movimientos de inventario detallado para auditoría en tiempo real
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    type inventory_move_type NOT NULL,
    quantity INT NOT NULL CHECK (quantity != 0),
    stock_before INT NOT NULL CHECK (stock_before >= 0),
    stock_after INT NOT NULL CHECK (stock_after >= 0),
    reason VARCHAR(255),
    registered_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 4. MÓDULO 3: GESTIÓN DE CLIENTES DE NEGOCIOS (CRM & LEALTAD)
-- ========================================================================================

-- Tabla maestra de Clientes (POS Físico y cuentas fidelizadas DNI/RUC)
CREATE TABLE customers (
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

-- Favoritos del cliente
CREATE TABLE user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- Valoraciones y reseñas de productos por parte de clientes registrados
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 5. MÓDULO 4: MARKETING, CAMPAÑAS Y CUPONES DE DESCUENTO
-- ========================================================================================

-- Cupones de descuento comercializables o promocionales
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5, 2) CHECK (discount_percent BETWEEN 0 AND 100),
    discount_amount DECIMAL(12, 2) CHECK (discount_amount >= 0),
    min_purchase DECIMAL(12, 2) DEFAULT 0.00 CHECK (min_purchase >= 0),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campañas publicitarias
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Banners publicitarios interactivos de la tienda del cliente
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(120) NOT NULL,
    subtitle VARCHAR(250),
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 6. MÓDULO 5: TRANSACCIONES, VENTAS POS Y CONTROL DE CAJA CHICA (FINANZAS)
-- ========================================================================================

-- Gestión de Arqueos de Caja en Punto de Venta (POS Físico diario)
CREATE TABLE cash_registers (
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

-- Pedidos / Ordenes Generales
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Opcional para POS rápido
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Quien lo genera / compra
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

-- Detalle de los productos de un pedido (Items del carrito convertidos en compra)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * price) STORED
);

-- Historial cronológico de cambios de estado del pedido para seguimiento
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carrito de compras virtual para persistencia de sesión e-commerce
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gestión de Pagos Realizados
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    method payment_method NOT NULL DEFAULT 'EFECTIVO',
    status payment_status NOT NULL DEFAULT 'PENDIENTE',
    transaction_reference VARCHAR(150), -- Código hash Pasarela de Pagos (Stripe, Culqi, etc)
    raw_response JSONB, -- Backup del JSON devuelto por la pasarela
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 7. MÓDULO 6: LOGÍSTICA COMPLETA DE DESPACHO Y COURIER (DELIVERY & TRACKING)
-- ========================================================================================

-- Empresas courier aliadas (Ejemplo Olva Courier, DHL Peru, etc.)
CREATE TABLE courier_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) UNIQUE NOT NULL,
    contact_phone VARCHAR(25),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Información del envío principal del pedido
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES courier_companies(id) ON DELETE SET NULL,
    tracking_number VARCHAR(100) UNIQUE,
    status tracking_status NOT NULL DEFAULT 'INFORMADO',
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Historial paso a paso / milestones del trayecto del envío físico
CREATE TABLE shipment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status tracking_status NOT NULL,
    location VARCHAR(200) NOT NULL, -- Ej: "Centro de Clasificación Cusco", "En ruta de reparto"
    description VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 8. MÓDULO 7: FINANZAS CORPORATIVAS (LIBRO LEDGER)
-- ========================================================================================

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type finance_type NOT NULL,
    category VARCHAR(80) NOT NULL, -- Ej: 'VENTA_POS', 'NÓMINA_EMPLEADOS', 'PAGO_ALQUILER', 'COMPRA_STOCK'
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    reference_id VARCHAR(100), -- ID referencial del pedido o comprobante físico
    registered_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 9. MÓDULO 8: CONFIGURACIÓN GLOBAL Y AUDITORÍA
-- ========================================================================================

-- Configuración general personalizable del ERP
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(80) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Log de actividad operacional / Auditoría del ERP
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- 10. GENERACIÓN DE ÍNDICES DE PRESTACIÓN (Mejora radical para queries y Neon DB)
-- ========================================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipment_tracking_shipment ON shipment_tracking(shipment_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_finance_type_category ON financial_transactions(type, category);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_employee_attendance_user ON employee_attendance(user_id);

-- ========================================================================================
-- 11. DATOS SEMILLA EMPRESARIALES (Escenario Operativo de Alta Fidelidad en AndesModa)
-- ========================================================================================

-- A. Usuarios de Prueba
INSERT INTO users (id, email, name, role, status, dni, phone, password_hash) VALUES
('b3c8f8e4-e038-4e1a-85b3-fcbe9d17d001', 'erteanti@gmail.com', 'Administrador Principal AndesModa', 'ADMINISTRADOR', 'ACTIVO', '45892015', '+51 984 512 854', '$2b$10$unify-hash-placeholder-andesmoda'),
('b3c8f8e4-e038-4e1a-85b3-fcbe9d17d002', 'vendedor@andesmoda.pe', 'Elena Ramos Palomino', 'VENDEDOR', 'ACTIVO', '71029148', '+51 987 654 321', '$2b$10$unify-hash-placeholder-andesmoda'),
('b3c8f8e4-e038-4e1a-85b3-fcbe9d17d003', 'cliente_demo@correo.pe', 'Carlos Huamán Quispe', 'CLIENTE', 'ACTIVO', '40592812', '+51 912 345 678', '$2b$10$unify-hash-placeholder-andesmoda');

-- B. Almacenes Físicos
INSERT INTO warehouses (id, name, code, address, phone) VALUES
('a0a0a0a0-0000-0000-0000-000000000001', 'Almacén Central Cusco Principal', 'ALM-CUS-01', 'Av. De la Cultura 1405, Wanchaq, Cusco', '+51 084 256874'),
('a0a0a0a0-0000-0000-0000-000000000002', 'Tienda Retail San Blas Cusco', 'TDA-SBLAS', 'Calle Tandapata 320, San Blas, Cusco', '+51 084 785641'),
('a0a0a0a0-0000-0000-0000-000000000003', 'Almacén de Distribución Lima Norte', 'ALM-LIM-02', 'Av. Alfredo Mendiola 4200, Los Olivos, Lima', '+51 01 4256321');

-- C. Categorías
INSERT INTO categories (id, name, description) VALUES
('c0c0c0c0-1111-1111-1111-111111111111', 'Suéteres de Alpaca', 'Prendas con finas selectas fibras de alpaca cuzqueña y alta capacidad térmica decorativa.'),
('c0c0c0c0-2222-2222-2222-222222222222', 'Chumpas Navideñas', 'Línea estacional invernal con diseños tradicionales navideños andinos.'),
('c0c0c0c0-3333-3333-3333-333333333333', 'Bufandas Bordadas', 'Accesorios únicos de telar tradicional tejidos por comunidades de Písac y Chinchero.'),
('c0c0c0c0-4444-4444-4444-444444444444', 'Sacos Premium', 'Alta sastrería fina con aplicaciones bordadas andinas ejecutivas auténticas.');

-- D. Productos
INSERT INTO products (id, sku, barcode, name, description, category_id, purchase_price, sale_price, offer_price, min_stock, status) VALUES
('p0p0p0p0-0001-0000-0000-000000000001', 'AND-8941', '775893201485', 'Suéter de Alpaca Cusco Imperial', 'Hecho con 100% fibra de alpaca seleccionada por artesanos de las comunidades del Valle de Cusco.', 'c0c0c0c0-1111-1111-1111-111111111111', 55.00, 120.00, 110.00, 5, 'ACTIVO'),
('p0p0p0p0-0002-0000-0000-000000000002', 'AND-3211', '775432109865', 'Chumpa Navideña Rodolfo', 'Chumpa temática hilada con hilos acrílicos térmicos y lana de ovino, de cuello redondo.', 'c0c0c0c0-2222-2222-2222-222222222222', 40.00, 89.90, 0.00, 4, 'ACTIVO'),
('p0p0p0p0-0003-0000-0000-000000000003', 'AND-5541', '775554123451', 'Bufanda de Telar Písac', 'Bufanda artesanal de alpaca hilada y teñida orgánicamente con raíces naturales.', 'c0c0c0c0-3333-3333-3333-333333333333', 20.00, 50.00, 0.00, 3, 'ACTIVO');

-- E. Inventario Inicial Distribución
INSERT INTO inventory (product_id, warehouse_id, stock) VALUES
('p0p0p0p0-0001-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 35), -- Suéter Imperial en Almacén Central
('p0p0p0p0-0001-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000002', 12), -- Suéter Imperial en San Blas
('p0p0p0p0-0002-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 50), -- Chumpas Rodolfo en Almacén Central
('p0p0p0p0-0003-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000002', 20); -- Bufandas en San Blas

-- F. Imágenes de Productos
INSERT INTO product_images (product_id, image_url, is_primary) VALUES
('p0p0p0p0-0001-0000-0000-000000000001', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400', TRUE),
('p0p0p0p0-0002-0000-0000-000000000002', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400', TRUE),
('p0p0p0p0-0003-0000-0000-000000000003', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', TRUE);

-- G. Cupones de Campaña
INSERT INTO coupons (code, discount_percent, expires_at, is_active) VALUES
('BIENVENIDA20', 20.00, NOW() + INTERVAL '30 days', TRUE),
('CUSCOALPA', 15.00, NOW() + INTERVAL '90 days', TRUE),
('INTIRAYMI', 25.00, NOW() + INTERVAL '10 days', TRUE);

-- H. Configuración del Sistema
INSERT INTO system_settings (key, value, description) VALUES
('IGV_PORCENTAJE', '18.00', 'Porcentaje de Impuesto del Perú (IGV)'),
('MONEDA_DEFECTO', 'Soles PEN', 'Moneda corporativa de devaluación y visualización'),
('TICKET_PIE_PAG', '¡Gracias por comprar en AndesModa! Apoyando al artesano andino.', 'Mensaje inferior en tickets térmicos de POS'),
('DIRECCION_CORPORATIVA', 'Av. El Sol 110, Cusco, Cusco, Perú', 'Dirección fiscal de la empresa multinacional');

-- I. Clientes del Sistema POS/CRM
INSERT INTO customers (id, name, dni, email, phone, address, credit_limit, points) VALUES
('c1c1c1c1-0000-0000-0000-000000000001', 'Dante Solórzano Meléndez', '10452389', 'dante.solorzano@outlook.com', '+51 984 100 200', 'Av. Garcilaso 300, Wanchaq, Cusco', 1500.00, 120),
('c1c1c1c1-0000-0000-0000-000000000002', 'Marcela Alvizuri Valenzuela', '08459218', 'marcela@gmail.com', '+51 982 458 124', 'Urb. Progreso C-12, Cusco', 0.00, 350);

-- J. Banners del E-Commerce
INSERT INTO banners (title, subtitle, image_url, link_url, display_order) VALUES
('Colección Otoño-Invierno', 'Prendas 100% de Alpaca de Edición de Lujo Limitada', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800', '/category/alpaca', 1);

-- K. Empresas Couriers Aliadas
INSERT INTO courier_companies (id, name, contact_phone, is_active) VALUES
('d0d0d0d0-0000-0000-0000-000000000001', 'Olva Courier Cusco', '+51 984 555 111', TRUE),
('d0d0d0d0-0000-0000-0000-000000000002', 'Scharff Distribuciones', '+51 981 111 222', TRUE);

-- ========================================================================================
-- FIN DE ARQUITECTURA DE DATOS CORPORATIVA ANDESMODA
-- ========================================================================================
