CREATE TABLE gallery_images (
    id              BIGSERIAL PRIMARY KEY,
    image_url       VARCHAR(500) NOT NULL,
    public_id       VARCHAR(200),
    display_order   INTEGER DEFAULT 0,
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
