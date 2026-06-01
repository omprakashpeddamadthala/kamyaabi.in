-- V18: Add per-line-item weight (in kg) to order_items for shipping calculations and display.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8, 3);
