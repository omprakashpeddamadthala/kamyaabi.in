-- V15: hero_banners — admin-managed homepage hero/banner images.
-- Seeded with the previously hard-coded homepage slides (local public assets,
-- so public_id is NULL) to keep the homepage visually identical on first deploy.

CREATE TABLE IF NOT EXISTS hero_banners (
    id            BIGSERIAL     PRIMARY KEY,
    image_url     VARCHAR(1024) NOT NULL,
    public_id     VARCHAR(512),
    title         VARCHAR(255),
    subtitle      VARCHAR(1024),
    alt_text      VARCHAR(255),
    link_url      VARCHAR(1024),
    display_order INTEGER       NOT NULL DEFAULT 0,
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_active_order
    ON hero_banners (active, display_order);

INSERT INTO hero_banners (image_url, public_id, title, subtitle, alt_text, link_url, display_order, active, created_at, updated_at)
VALUES
    ('/assets/img/hero/banner2.webp', NULL,
     'Almonds & Cashews: A Perfect Nutty Pair',
     'Our Premium California Almonds are handpicked for superior flavor and packed with healthy fats and protein, making them the perfect nutritious snack or recipe addition.',
     'Premium almonds and cashews', NULL, 0, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('/assets/img/hero/banner1.webp', NULL,
     'The Ultimate Nut Trio: Pistachios, Cashews & Almonds',
     'Our Roasted and Salted Pistachios, Premium Split Cashews, and California Almonds offer a savory, crunchy snack packed with antioxidants and healthy fats.',
     'Pistachios, cashews and almonds', NULL, 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('/assets/img/about/aboutUS.webp', NULL,
     'Wholesome Goodness, Delivered Fresh',
     'From handpicked almonds to crunchy pistachios, every Kamyaabi pack is sourced for purity, sealed for freshness, and delivered straight to your door.',
     'Wholesome dry fruits delivered fresh', NULL, 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
