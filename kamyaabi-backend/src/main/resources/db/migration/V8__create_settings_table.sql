-- V8: settings table — runtime-tunable platform settings (low stock threshold,
-- products-per-page, optional UI badges). Seeded with the prior hard-coded
-- defaults so behavior is unchanged on first deploy.

CREATE TABLE IF NOT EXISTS settings (
    "key"      VARCHAR(64)   PRIMARY KEY,
    "value"    VARCHAR(2048) NOT NULL,
    updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings ("key", "value", updated_at)
VALUES
    ('low_stock_threshold',          '10',   CURRENT_TIMESTAMP),
    ('show_bought_recently_badge',   'true', CURRENT_TIMESTAMP),
    ('products_per_page',            '8',    CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
