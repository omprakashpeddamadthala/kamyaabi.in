-- V7: Add slug column to products for URL-friendly product detail routes
--     (e.g. /products/blue-running-shoes instead of /products/9).

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

-- Backfill existing rows with a URL-safe slug derived from the product name.
-- Rules mirror ProductServiceImpl.slugify: lowercase, ascii-fold (best-effort
-- via regexp_replace), non-alphanumerics collapsed to single hyphens, edge
-- hyphens trimmed, and any row that would collide with another gets a
-- numeric suffix appended based on the row's id (which is guaranteed unique).
UPDATE products
SET slug = CASE
    WHEN regexp_replace(
        regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
    ) = '' THEN 'product-' || id::text
    ELSE regexp_replace(
        regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
    )
END
WHERE slug IS NULL OR slug = '';

-- If the above produced any collisions (two products with the same name),
-- disambiguate by appending the id. This keeps slugs unique without losing
-- the human-readable prefix.
WITH dupes AS (
    SELECT id, slug,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
    FROM products
    WHERE slug IS NOT NULL AND slug <> ''
)
UPDATE products p
SET slug = p.slug || '-' || p.id::text
FROM dupes d
WHERE p.id = d.id AND d.rn > 1;

-- Enforce uniqueness and add an index now that all rows are populated.
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
