-- V29: Create package_dimension_settings table for dynamic packaging configuration
CREATE TABLE package_dimension_settings (
    id BIGSERIAL PRIMARY KEY,
    package_weight_gram INT NOT NULL UNIQUE,
    length INT NOT NULL,
    breadth INT NOT NULL,
    height INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_package_dimension_settings_active ON package_dimension_settings(active);
CREATE INDEX idx_package_dimension_settings_weight ON package_dimension_settings(package_weight_gram);

-- Seeding initial slabs
INSERT INTO package_dimension_settings (package_weight_gram, length, breadth, height, active)
VALUES 
(100, 10, 10, 10, TRUE),
(250, 12, 12, 12, TRUE),
(500, 15, 15, 15, TRUE);
