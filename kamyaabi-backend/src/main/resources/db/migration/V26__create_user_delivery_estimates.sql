CREATE TABLE user_delivery_estimates (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    pincode           VARCHAR(6),
    serviceable       BOOLEAN,
    city              VARCHAR(255),
    state             VARCHAR(255),
    estimated_days    INTEGER,
    courier_name      VARCHAR(255),
    cod_available     VARCHAR(10),
    message           TEXT,
    last_refreshed_at TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ude_user_id ON user_delivery_estimates(user_id);
