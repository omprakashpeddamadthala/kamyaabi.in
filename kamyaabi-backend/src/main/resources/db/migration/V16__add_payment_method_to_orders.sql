-- Add payment_method column to orders table (ONLINE = default for backward compat, COD = Cash on Delivery)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'ONLINE';

-- Update the status check constraint to include COD_PENDING
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING','PAID','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','PAYMENT_FAILED'));
