-- Create stores table
CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_slug ON stores(slug);

-- Add store_id to existing tables
ALTER TABLE orders ADD COLUMN store_id TEXT;
ALTER TABLE order_items ADD COLUMN store_id TEXT;

-- Index for multitenant queries
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_order_items_store_id ON order_items(store_id);
