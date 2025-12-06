-- Migration: Add option_price to order_items for accurate sales tracking
-- Created: 2025-11-30
-- Purpose: Store option price snapshot at order time for accurate revenue tracking

BEGIN;

-- Add option_price column (nullable for backward compatibility)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS option_price INTEGER DEFAULT 0;

COMMENT ON COLUMN order_items.option_price IS 'Option price snapshot at order time (for accurate revenue tracking)';

-- Backfill existing data from product_options (best effort)
UPDATE order_items oi
SET option_price = po.price
FROM product_options po
WHERE oi.option_id = po.id
  AND oi.option_price = 0;

-- Set to NOT NULL after backfill
ALTER TABLE order_items
ALTER COLUMN option_price SET NOT NULL;

COMMIT;
