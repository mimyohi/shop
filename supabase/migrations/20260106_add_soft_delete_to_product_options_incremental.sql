-- ============================================================================
-- 기존 프로젝트에 적용할 증분 마이그레이션
-- product_options에 Soft Delete 추가
-- ============================================================================

BEGIN;

ALTER TABLE product_options
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_product_options_deleted_at
ON product_options(deleted_at);

CREATE INDEX IF NOT EXISTS idx_product_options_active
ON product_options(id) WHERE deleted_at IS NULL;

COMMENT ON COLUMN product_options.deleted_at IS 'Soft delete timestamp. NULL means the option is active.';

COMMIT;
