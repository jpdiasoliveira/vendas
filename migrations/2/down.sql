
DROP INDEX idx_orders_payment_id;
ALTER TABLE orders DROP COLUMN ticket_url;
ALTER TABLE orders DROP COLUMN qr_code;
ALTER TABLE orders DROP COLUMN qr_code_base64;
ALTER TABLE orders DROP COLUMN payment_status;
ALTER TABLE orders DROP COLUMN payment_id;
