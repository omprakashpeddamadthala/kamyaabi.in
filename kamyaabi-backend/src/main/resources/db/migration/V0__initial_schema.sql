-- ============================================================
-- V0: Initial schema — creates the base tables that all
--     subsequent migrations (V1-V5) expect to exist.
--
-- Background:
--   The original deployment relied on Hibernate ddl-auto=update
--   to bootstrap the schema.  When the project switched to a
--   new (empty) database, Flyway attempted V1 first and failed
--   because the tables had never been created.
--
-- On an existing database that already has these tables (via
-- ddl-auto), Flyway's baseline-on-migrate + baseline-version=0
-- marks this migration as applied without executing it.
-- ============================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    first_name  VARCHAR(255),
    last_name   VARCHAR(255),
    avatar_url  VARCHAR(255),
    google_id   VARCHAR(255),
    role        VARCHAR(255) NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

-- 2. categories (self-referencing parent)
CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    slug        VARCHAR(160) UNIQUE,
    description VARCHAR(255),
    image_url   VARCHAR(255),
    parent_id   BIGINT,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);

CREATE INDEX IF NOT EXISTS idx_categories_slug      ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);

-- 3. products
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL      PRIMARY KEY,
    name            VARCHAR(255)   NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2)  NOT NULL,
    discount_price  NUMERIC(10,2),
    image_url       VARCHAR(255),
    category_id     BIGINT         NOT NULL,
    stock           INTEGER        NOT NULL DEFAULT 0,
    weight          VARCHAR(255),
    unit            VARCHAR(255),
    active          BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_created_at  ON products (created_at);

-- 4. addresses
CREATE TABLE IF NOT EXISTS addresses (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        BIGINT       NOT NULL,
    full_name      VARCHAR(255) NOT NULL,
    phone          VARCHAR(255) NOT NULL,
    street         VARCHAR(255) NOT NULL,
    address_line2  VARCHAR(255),
    city           VARCHAR(255) NOT NULL,
    state          VARCHAR(255) NOT NULL,
    pincode        VARCHAR(255) NOT NULL,
    is_default     BOOLEAN      DEFAULT FALSE,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);

-- 5. orders
CREATE TABLE IF NOT EXISTS orders (
    id                   BIGSERIAL      PRIMARY KEY,
    user_id              BIGINT         NOT NULL,
    total_amount         NUMERIC(12,2)  NOT NULL,
    status               VARCHAR(255)   NOT NULL DEFAULT 'PENDING',
    shipping_address_id  BIGINT,
    created_at           TIMESTAMP,
    updated_at           TIMESTAMP,
    CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)             REFERENCES users (id),
    CONSTRAINT fk_orders_address FOREIGN KEY (shipping_address_id) REFERENCES addresses (id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- 6. order_items
CREATE TABLE IF NOT EXISTS order_items (
    id          BIGSERIAL      PRIMARY KEY,
    order_id    BIGINT         NOT NULL,
    product_id  BIGINT         NOT NULL,
    quantity    INTEGER        NOT NULL,
    price       NUMERIC(10,2)  NOT NULL,
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id),
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

-- 7. payments
CREATE TABLE IF NOT EXISTS payments (
    id                    BIGSERIAL      PRIMARY KEY,
    order_id              BIGINT         NOT NULL UNIQUE,
    razorpay_order_id     VARCHAR(255),
    razorpay_payment_id   VARCHAR(255),
    razorpay_signature    VARCHAR(255),
    amount                NUMERIC(12,2)  NOT NULL,
    status                VARCHAR(255)   NOT NULL DEFAULT 'PENDING',
    created_at            TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id          ON payments (order_id);

-- 8. carts
CREATE TABLE IF NOT EXISTS carts (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT    NOT NULL UNIQUE,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 9. cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    id          BIGSERIAL PRIMARY KEY,
    cart_id     BIGINT    NOT NULL,
    product_id  BIGINT    NOT NULL,
    quantity    INTEGER   NOT NULL DEFAULT 1,
    CONSTRAINT fk_cart_items_cart    FOREIGN KEY (cart_id)    REFERENCES carts (id),
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id    ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);
