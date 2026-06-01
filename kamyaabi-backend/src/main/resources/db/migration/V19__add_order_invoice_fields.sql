ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url VARCHAR(1000);

CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders (invoice_number);
