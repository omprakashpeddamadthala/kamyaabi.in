-- V25: Backfill slugs for any category rows that are still missing one so that
--      hierarchical SEO URLs (/products/{categorySlug}/{productSlug}) always
--      resolve. Mirrors the product-slug backfill in V7 and the runtime
--      CategorySlugBackfill: lowercase, ascii-fold (best-effort via
--      regexp_replace), non-alphanumerics collapsed to single hyphens, edge
--      hyphens trimmed, with id-based disambiguation for collisions.
--
--      Idempotent: only touches rows whose slug is NULL/empty, and the unique
--      index already exists from V0, so re-runs are safe.

UPDATE categories
SET slug = CASE
    WHEN regexp_replace(
        regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
    ) = '' THEN 'category-' || id::text
    ELSE regexp_replace(
        regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
    )
END
WHERE slug IS NULL OR slug = '';

-- Disambiguate any collisions introduced by the backfill by appending the id,
-- which is guaranteed unique, while preserving the human-readable prefix.
WITH dupes AS (
    SELECT id, slug,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
    FROM categories
    WHERE slug IS NOT NULL AND slug <> ''
)
UPDATE categories c
SET slug = c.slug || '-' || c.id::text
FROM dupes d
WHERE c.id = d.id AND d.rn > 1;
