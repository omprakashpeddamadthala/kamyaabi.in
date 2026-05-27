-- V13: Coupon / promo-code tables and seed coupon-related settings.

-- 1. coupons
CREATE TABLE IF NOT EXISTS coupons (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    discount_type   VARCHAR(20)     NOT NULL,           -- PERCENTAGE or FLAT
    discount_value  NUMERIC(12,2)   NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coupons_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FLAT')),
    CONSTRAINT chk_coupons_discount_value CHECK (discount_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active  ON coupons (is_active);

-- 2. coupon_usages
CREATE TABLE IF NOT EXISTS coupon_usages (
    id          BIGSERIAL   PRIMARY KEY,
    coupon_id   BIGINT      NOT NULL,
    user_id     BIGINT      NOT NULL,
    order_id    BIGINT,
    used_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    CONSTRAINT fk_coupon_usages_user   FOREIGN KEY (user_id)   REFERENCES users (id),
    CONSTRAINT fk_coupon_usages_order  FOREIGN KEY (order_id)  REFERENCES orders (id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id           ON coupon_usages (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id             ON coupon_usages (user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user         ON coupon_usages (coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user_date    ON coupon_usages (coupon_id, user_id, used_at);

-- 3. Add coupon/discount columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id        BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code      VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(12,2) DEFAULT 0;

-- 4. Seed coupon-related settings with defaults
INSERT INTO settings ("key", "value", updated_at)
VALUES
    ('coupon_enabled',                  'true',  CURRENT_TIMESTAMP),
    ('coupon_max_uses_per_user',        '1',     CURRENT_TIMESTAMP),
    ('coupon_max_uses_per_user_per_day','1',     CURRENT_TIMESTAMP),
    ('coupon_max_total_members',        '20',    CURRENT_TIMESTAMP),
    ('coupon_default_expiry_days',      '30',    CURRENT_TIMESTAMP),
    ('coupon_allow_stacking',           'false', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
