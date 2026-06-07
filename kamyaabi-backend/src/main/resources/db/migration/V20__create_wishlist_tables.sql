CREATE TABLE wishlists (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_items (
    id           BIGSERIAL PRIMARY KEY,
    wishlist_id  BIGINT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_product UNIQUE (wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id  ON wishlist_items(product_id);
