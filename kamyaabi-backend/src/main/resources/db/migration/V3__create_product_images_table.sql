-- Create product_images table for storing multiple Cloudinary-hosted images per product.
-- Each product can have many images; at most one is flagged as the main image and
-- display_order controls the gallery ordering on the frontend.
CREATE TABLE IF NOT EXISTS product_images (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT       NOT NULL,
    image_url       VARCHAR(1024) NOT NULL,
    public_id       VARCHAR(512) NOT NULL,
    is_main         BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order   INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_main ON product_images (product_id, is_main);
