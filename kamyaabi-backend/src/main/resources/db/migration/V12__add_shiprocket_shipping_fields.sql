-- V12: Add Shiprocket shipping integration fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id   VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_number            VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name          VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status       VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_scheduled_at   TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at          TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_synced     BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_synced ON orders (shiprocket_synced);
CREATE INDEX IF NOT EXISTS idx_orders_awb_number        ON orders (awb_number);
