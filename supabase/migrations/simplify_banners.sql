-- Migration: Simplify banner tables
-- Date: 2024-12
-- Description:
--   - main_banners: Remove title, description, link_url, link_target, start_at, end_at (image only)
--   - product_banners: Remove title, description (keep link and period)

-- main_banners에서 title, description, link_url, link_target, start_at, end_at 제거
ALTER TABLE main_banners
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS link_url,
  DROP COLUMN IF EXISTS link_target,
  DROP COLUMN IF EXISTS start_at,
  DROP COLUMN IF EXISTS end_at;

-- 불필요해진 인덱스 삭제
DROP INDEX IF EXISTS idx_main_banners_dates;

-- main_banners 테이블 코멘트 업데이트
COMMENT ON TABLE main_banners IS '메인 페이지 상단 배너 (PC/Mobile) - 이미지 전용';

-- product_banners에서 title, description 제거
ALTER TABLE product_banners
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description;

-- product_banners 테이블 코멘트 업데이트
COMMENT ON TABLE product_banners IS '상품 섹션 배너 (PC/Mobile) - 링크, 기간 포함';
