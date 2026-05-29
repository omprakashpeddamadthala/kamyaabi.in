-- V14: configurable Amazon store URL — drives the "Also Available on Amazon"
-- banners on product detail pages and the "Find Us on Amazon" homepage section.
-- Seeded with a brand search URL; admins can change it under Admin → Settings.

INSERT INTO settings ("key", "value", updated_at)
VALUES ('amazon_store_url', 'https://www.amazon.in/s?k=kamyaabi+dry+fruits', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
