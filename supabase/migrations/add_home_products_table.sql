-- 홈 상품 설정 테이블 추가 마이그레이션
-- 이 마이그레이션은 기존 DB에 home_products 테이블만 추가할 때 사용합니다.

-- ----------------------------------------------------------------------------
-- Home Products (홈 화면 상품 설정)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS home_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(product_id)
);

COMMENT ON TABLE home_products IS '홈 화면에 표시할 상품 설정 (최대 6개)';
COMMENT ON COLUMN home_products.product_id IS '홈에 표시할 상품 ID';
COMMENT ON COLUMN home_products.display_order IS '표시 순서 (0부터 시작)';

CREATE INDEX IF NOT EXISTS idx_home_products_product_id ON home_products(product_id);
CREATE INDEX IF NOT EXISTS idx_home_products_display_order ON home_products(display_order);

DROP TRIGGER IF EXISTS trigger_update_home_products_updated_at ON home_products;
CREATE TRIGGER trigger_update_home_products_updated_at
  BEFORE UPDATE ON home_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE home_products ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 조회 가능
CREATE POLICY "home_products_select_all"
  ON home_products FOR SELECT
  USING (true);

-- Service Role 전체 접근
CREATE POLICY "home_products_service_role_all"
  ON home_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
