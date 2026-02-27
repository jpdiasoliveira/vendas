
ALTER TABLE orders ADD COLUMN payment_id TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT;
ALTER TABLE orders ADD COLUMN qr_code_base64 TEXT;
ALTER TABLE orders ADD COLUMN qr_code TEXT;
ALTER TABLE orders ADD COLUMN ticket_url TEXT;

CREATE INDEX idx_orders_payment_id ON orders(payment_id);
