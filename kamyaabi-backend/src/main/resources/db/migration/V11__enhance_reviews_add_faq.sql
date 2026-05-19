-- Enhance the reviews table with title, images, and approval flag
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images_json TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE;

-- Unique constraint: one review per user per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product
    ON reviews(user_id, product_id) WHERE user_id IS NOT NULL;

-- FAQ table for product-level and global FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faqs_product_id ON faqs(product_id);
