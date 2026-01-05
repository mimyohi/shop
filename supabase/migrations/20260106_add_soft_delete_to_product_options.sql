-- ============================================================================
-- product_options에 Soft Delete 추가
-- 생성일: 2026-01-06
-- 목적: 옵션 삭제 시 물리적 삭제 대신 논리적 삭제로 주문 데이터 보존
-- ============================================================================

BEGIN;

-- 1. product_options에 deleted_at 컬럼 추가
ALTER TABLE product_options
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. deleted_at 인덱스 추가 (활성 옵션 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_product_options_deleted_at
ON product_options(deleted_at);

-- 3. 활성 옵션만 조회하는 인덱스
CREATE INDEX IF NOT EXISTS idx_product_options_active
ON product_options(id) WHERE deleted_at IS NULL;

-- 4. 주석 추가
COMMENT ON COLUMN product_options.deleted_at IS 'Soft delete timestamp. NULL means the option is active.';

-- 5. 결과 확인
DO $$
DECLARE
  total_options INTEGER;
  active_options INTEGER;
  deleted_options INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_options FROM product_options;
  SELECT COUNT(*) INTO active_options FROM product_options WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO deleted_options FROM product_options WHERE deleted_at IS NOT NULL;

  RAISE NOTICE '=== Product Options Soft Delete Setup Complete ===';
  RAISE NOTICE 'Total options: %', total_options;
  RAISE NOTICE 'Active options: %', active_options;
  RAISE NOTICE 'Deleted options: %', deleted_options;
END $$;

COMMIT;
