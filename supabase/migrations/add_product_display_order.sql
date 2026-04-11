-- Migration: add display_order to products
-- 기존 상품에는 created_at DESC 순서로 1부터 초기값 설정
-- 신규 상품은 DEFAULT 0으로 추천순 맨 앞에 노출됨

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

UPDATE products
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM products
  WHERE deleted_at IS NULL
) AS sub
WHERE products.id = sub.id;

CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order ASC);

COMMENT ON COLUMN products.display_order IS '관리자 지정 노출 순서. 0 = 신규 상품 (추천순 맨 앞). 낮을수록 앞에 노출.';
