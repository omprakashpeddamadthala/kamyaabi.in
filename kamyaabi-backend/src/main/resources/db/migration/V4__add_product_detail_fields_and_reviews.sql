-- Optional structured detail fields on products. All nullable so existing rows
-- are unaffected and the UI hides each section when its column is null.
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info_json TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_json TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_tips_json TEXT;

-- Real reviews table. No seed data is inserted; the product page hides the
-- reviews section when there are no rows for the product.
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
