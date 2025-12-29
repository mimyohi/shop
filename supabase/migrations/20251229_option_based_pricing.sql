-- ============================================================================
-- 옵션 기반 가격 구조로 변경
-- - products 테이블에서 price, discount_rate 제거
-- - product_options 테이블에 discount_rate, is_representative 추가
-- - 기존 데이터 마이그레이션
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. product_options에 새 컬럼 추가
-- ----------------------------------------------------------------------------
ALTER TABLE product_options
ADD COLUMN IF NOT EXISTS discount_rate INTEGER DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
ADD COLUMN IF NOT EXISTS is_representative BOOLEAN DEFAULT false;

COMMENT ON COLUMN product_options.discount_rate IS '옵션별 할인률 (0-100%, 0이면 할인 없음)';
COMMENT ON COLUMN product_options.is_representative IS '대표 옵션 여부. 상품 목록에서 이 옵션의 가격/할인율이 표시됨';

-- ----------------------------------------------------------------------------
-- 2. 대표 옵션 고유성을 위한 부분 인덱스 (상품당 1개만 가능)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_options_representative
ON product_options(product_id) WHERE is_representative = true;

-- ----------------------------------------------------------------------------
-- 3. 기존 데이터 마이그레이션
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_product RECORD;
  v_has_options BOOLEAN;
  v_first_option_id UUID;
BEGIN
  -- 활성 상품들을 순회
  FOR v_product IN
    SELECT id, name, price, discount_rate
    FROM products
    WHERE deleted_at IS NULL
  LOOP
    -- 해당 상품에 옵션이 있는지 확인
    SELECT EXISTS(SELECT 1 FROM product_options WHERE product_id = v_product.id) INTO v_has_options;

    IF NOT v_has_options THEN
      -- 옵션이 없는 상품: 기본 옵션 생성 (상품의 기존 가격/할인율 사용)
      INSERT INTO product_options (
        product_id,
        name,
        price,
        discount_rate,
        is_representative,
        display_order,
        use_settings_on_first,
        use_settings_on_revisit_with_consult,
        use_settings_on_revisit_no_consult
      ) VALUES (
        v_product.id,
        '기본',
        v_product.price,
        COALESCE(v_product.discount_rate, 0),
        true,
        0,
        false,
        false,
        false
      );
    ELSE
      -- 옵션이 있는 상품: 첫 번째 옵션을 대표로 설정하고 할인율 적용
      SELECT id INTO v_first_option_id
      FROM product_options
      WHERE product_id = v_product.id
      ORDER BY display_order ASC
      LIMIT 1;

      UPDATE product_options
      SET
        is_representative = true,
        discount_rate = COALESCE(v_product.discount_rate, 0)
      WHERE id = v_first_option_id;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 4. 대표 옵션 자동 관리 트리거 (상품당 1개만 true가 되도록)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_representative_option()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_representative = true THEN
    -- 같은 상품의 다른 옵션들은 is_representative를 false로
    UPDATE product_options
    SET is_representative = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_representative = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_representative_option ON product_options;
CREATE TRIGGER trigger_set_representative_option
  BEFORE INSERT OR UPDATE ON product_options
  FOR EACH ROW
  WHEN (NEW.is_representative = true)
  EXECUTE FUNCTION set_representative_option();

COMMENT ON FUNCTION set_representative_option IS '대표 옵션이 설정되면 같은 상품의 다른 옵션들의 대표 여부를 false로 변경';

-- ----------------------------------------------------------------------------
-- 5. 옵션 할인가 계산 함수 수정
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_option_discounted_price(p_option_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_price INTEGER;
  v_discount_rate INTEGER;
BEGIN
  SELECT price, COALESCE(discount_rate, 0) INTO v_price, v_discount_rate
  FROM product_options
  WHERE id = p_option_id;

  IF v_discount_rate > 0 THEN
    RETURN FLOOR(v_price * (1 - v_discount_rate::NUMERIC / 100));
  END IF;

  RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_option_discounted_price IS '옵션의 할인 적용된 가격을 반환합니다.';

-- ----------------------------------------------------------------------------
-- 6. 대표 옵션 조회 함수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_representative_option(p_product_id UUID)
RETURNS TABLE(
  option_id UUID,
  option_name VARCHAR(255),
  price INTEGER,
  discount_rate INTEGER,
  discounted_price INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    po.id,
    po.name,
    po.price,
    COALESCE(po.discount_rate, 0),
    CASE
      WHEN COALESCE(po.discount_rate, 0) > 0
      THEN FLOOR(po.price * (1 - po.discount_rate::NUMERIC / 100))::INTEGER
      ELSE po.price
    END
  FROM product_options po
  WHERE po.product_id = p_product_id
    AND po.is_representative = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_representative_option IS '상품의 대표 옵션 정보를 반환합니다.';

-- ----------------------------------------------------------------------------
-- 7. coupon_applicable_products 뷰 수정 (products.price 제거로 인해)
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS coupon_applicable_products;

CREATE OR REPLACE VIEW coupon_applicable_products AS
SELECT
  c.id AS coupon_id,
  c.code,
  c.name AS coupon_name,
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(ro.price, 0) AS price,
  p.image_url
FROM coupons c
JOIN coupon_products cp ON c.id = cp.coupon_id
JOIN products p ON cp.product_id = p.id
LEFT JOIN LATERAL (
  SELECT po.price
  FROM product_options po
  WHERE po.product_id = p.id AND po.is_representative = true
  LIMIT 1
) ro ON true
WHERE c.is_active = true;

-- ----------------------------------------------------------------------------
-- 8. products 테이블에서 price, discount_rate 컬럼 제거
-- ----------------------------------------------------------------------------
-- 인덱스 먼저 제거
DROP INDEX IF EXISTS idx_products_price;

-- 컬럼 제거
ALTER TABLE products DROP COLUMN IF EXISTS price;
ALTER TABLE products DROP COLUMN IF EXISTS discount_rate;

COMMIT;
