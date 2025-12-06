-- Incremental update script for existing order_items
-- This script updates existing order_items with the option_price field
-- Run this AFTER running add_option_price_to_order_items.sql migration

BEGIN;

-- Update order_items with option prices based on their option_id
-- This will set the option_price for all existing records

UPDATE order_items oi
SET option_price = po.price
FROM product_options po
WHERE oi.option_id = po.id
  AND (oi.option_price = 0 OR oi.option_price IS NULL);

-- Verify the update
SELECT
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE option_price > 0) as items_with_price,
  COUNT(*) FILTER (WHERE option_price = 0 AND option_id IS NOT NULL) as missing_prices
FROM order_items;

COMMIT;
