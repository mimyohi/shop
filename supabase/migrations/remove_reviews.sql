-- ============================================================================
-- Migration: Remove Reviews Feature
-- Description: 리뷰 관련 테이블, 트리거, 함수, 정책 및 products 테이블의 리뷰 관련 컬럼 제거
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. 트리거 제거
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_product_rating_trigger ON reviews;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;

-- ----------------------------------------------------------------------------
-- 2. 함수 제거
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS update_product_rating();

-- ----------------------------------------------------------------------------
-- 3. RLS 정책 제거
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
DROP POLICY IF EXISTS "reviews_service_role_all" ON reviews;

-- ----------------------------------------------------------------------------
-- 4. 인덱스 제거
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_reviews_product_id;
DROP INDEX IF EXISTS idx_reviews_user_email;

-- ----------------------------------------------------------------------------
-- 5. reviews 테이블 제거
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS reviews;

-- ----------------------------------------------------------------------------
-- 6. products 테이블에서 리뷰 관련 컬럼 제거
-- ----------------------------------------------------------------------------
ALTER TABLE products DROP COLUMN IF EXISTS average_rating;
ALTER TABLE products DROP COLUMN IF EXISTS review_count;

COMMIT;
