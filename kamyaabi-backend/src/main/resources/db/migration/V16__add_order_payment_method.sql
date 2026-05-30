-- V16: Add payment_method column to orders so customers can pay via Razorpay
-- (PREPAID) or Cash on Delivery (COD) via Shiprocket.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) NOT NULL DEFAULT 'PREPAID';

CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders (payment_method);
