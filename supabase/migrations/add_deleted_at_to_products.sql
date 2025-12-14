-- products 테이블에 soft delete를 위한 deleted_at 컬럼 추가
-- 이 마이그레이션은 기존 데이터베이스에 적용할 수 있습니다.

-- deleted_at 컬럼 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- deleted_at 컬럼에 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- 삭제되지 않은 상품만 조회하는 partial index
CREATE INDEX IF NOT EXISTS idx_products_active ON products(id) WHERE deleted_at IS NULL;

-- 컬럼 설명 추가
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL means the product is active.';
