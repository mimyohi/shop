-- ============================================================================
-- Migration: 상품 옵션의 settings/types 데이터 정규화
--
-- 규칙:
-- - 옵션명에 "1개월"이 포함되면 → 1개월 setting 1개
-- - 옵션명에 "2개월"이 포함되면 → 1개월, 2개월 settings 2개
-- - 옵션명에 "3개월"이 포함되면 → 1개월, 2개월, 3개월 settings 3개
-- - 모든 setting에는 1단계, 2단계, 3단계 types가 포함됨
-- ============================================================================

-- 1. 기존 types 삭제
DELETE FROM product_option_setting_types;

-- 2. 기존 settings 삭제
DELETE FROM product_option_settings;

-- 3. 1개월 옵션에 settings 추가 (이름에 '1개월'이 포함된 옵션)
INSERT INTO product_option_settings (option_id, name, display_order)
SELECT po.id, s.name, s.display_order
FROM product_options po
CROSS JOIN (
  SELECT '1개월' as name, 0 as display_order
) s
WHERE po.name LIKE '%1개월%';

-- 4. 2개월 옵션에 settings 추가 (이름에 '2개월'이 포함된 옵션)
INSERT INTO product_option_settings (option_id, name, display_order)
SELECT po.id, s.name, s.display_order
FROM product_options po
CROSS JOIN (
  SELECT '1개월' as name, 0 as display_order
  UNION ALL SELECT '2개월', 1
) s
WHERE po.name LIKE '%2개월%';

-- 5. 3개월 옵션에 settings 추가 (이름에 '3개월'이 포함된 옵션)
INSERT INTO product_option_settings (option_id, name, display_order)
SELECT po.id, s.name, s.display_order
FROM product_options po
CROSS JOIN (
  SELECT '1개월' as name, 0 as display_order
  UNION ALL SELECT '2개월', 1
  UNION ALL SELECT '3개월', 2
) s
WHERE po.name LIKE '%3개월%';

-- 6. 모든 settings에 1단계, 2단계, 3단계 types 추가
INSERT INTO product_option_setting_types (setting_id, name, display_order)
SELECT pos.id, t.name, t.display_order
FROM product_option_settings pos
CROSS JOIN (
  SELECT '1단계' as name, 0 as display_order
  UNION ALL SELECT '2단계', 1
  UNION ALL SELECT '3단계', 2
) t;

-- 결과 확인
-- SELECT
--   po.name as option_name,
--   COUNT(DISTINCT pos.id) as settings_count,
--   COUNT(DISTINCT post.id) as types_count
-- FROM product_options po
-- LEFT JOIN product_option_settings pos ON pos.option_id = po.id
-- LEFT JOIN product_option_setting_types post ON post.setting_id = pos.id
-- GROUP BY po.id, po.name
-- ORDER BY po.name;
