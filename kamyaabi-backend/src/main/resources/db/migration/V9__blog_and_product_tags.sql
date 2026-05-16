-- ============================================================
-- V9: Blog system + Product tags
-- ============================================================

-- 1. Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    slug        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    parent_id   BIGINT,
    created_at  TIMESTAMP    DEFAULT NOW(),
    CONSTRAINT fk_blog_categories_parent FOREIGN KEY (parent_id) REFERENCES blog_categories (id)
);

CREATE INDEX idx_blog_categories_slug ON blog_categories (slug);
CREATE INDEX idx_blog_categories_parent_id ON blog_categories (parent_id);

-- 2. Blog tags
CREATE TABLE IF NOT EXISTS blog_tags (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    slug        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_blog_tags_slug ON blog_tags (slug);

-- 3. Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id                    BIGSERIAL    PRIMARY KEY,
    title                 VARCHAR(500) NOT NULL,
    slug                  VARCHAR(500) NOT NULL UNIQUE,
    excerpt               VARCHAR(300),
    content               TEXT,
    cover_image_url       VARCHAR(1000),
    cover_image_alt       VARCHAR(500),
    author_id             BIGINT       NOT NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    published_at          TIMESTAMP,
    scheduled_at          TIMESTAMP,
    seo_title             VARCHAR(200),
    seo_description       VARCHAR(300),
    seo_keywords          VARCHAR(500),
    og_image_url          VARCHAR(1000),
    canonical_url         VARCHAR(1000),
    reading_time_minutes  INTEGER      DEFAULT 1,
    view_count            INTEGER      DEFAULT 0,
    is_featured           BOOLEAN      DEFAULT FALSE,
    created_at            TIMESTAMP    DEFAULT NOW(),
    updated_at            TIMESTAMP    DEFAULT NOW(),
    CONSTRAINT fk_blog_posts_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT chk_blog_posts_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'SCHEDULED'))
);

CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON blog_posts (status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts (published_at);
CREATE INDEX idx_blog_posts_author_id ON blog_posts (author_id);
CREATE INDEX idx_blog_posts_is_featured ON blog_posts (is_featured);

-- 4. Blog post <-> category join table
CREATE TABLE IF NOT EXISTS blog_post_categories (
    post_id     BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    CONSTRAINT fk_bpc_post     FOREIGN KEY (post_id)     REFERENCES blog_posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_bpc_category FOREIGN KEY (category_id) REFERENCES blog_categories (id) ON DELETE CASCADE
);

-- 5. Blog post <-> tag join table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id BIGINT NOT NULL,
    tag_id  BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    CONSTRAINT fk_bpt_post FOREIGN KEY (post_id) REFERENCES blog_posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_bpt_tag  FOREIGN KEY (tag_id)  REFERENCES blog_tags (id) ON DELETE CASCADE
);

-- 6. Product tags
CREATE TABLE IF NOT EXISTS product_tags (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    slug       VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_product_tags_slug ON product_tags (slug);

-- 7. Product <-> tag join table
CREATE TABLE IF NOT EXISTS product_product_tags (
    product_id BIGINT NOT NULL,
    tag_id     BIGINT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_ppt_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_ppt_tag     FOREIGN KEY (tag_id)     REFERENCES product_tags (id) ON DELETE CASCADE
);

-- 8. Extend categories table for product category enhancements
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description VARCHAR(300);
