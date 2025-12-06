-- Migration: 1단계, 2단계, 3단계를 1, 2, 3으로 변경
-- Date: 2025-11-30

-- 1. order_items 테이블의 product_name 업데이트
UPDATE order_items
SET product_name = REPLACE(REPLACE(REPLACE(product_name, '1단계', '1'), '2단계', '2'), '3단계', '3')
WHERE product_name LIKE '%단계%';

-- 2. order_items 테이블의 selected_option_settings JSONB 업데이트
-- (setting_type_name, type_name, type 필드 모두 처리)
UPDATE order_items
SET selected_option_settings = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'type' IS NOT NULL THEN
        jsonb_set(elem, '{type}', to_jsonb(REPLACE(REPLACE(REPLACE(elem->>'type', '1단계', '1'), '2단계', '2'), '3단계', '3')))
      WHEN elem->>'setting_type_name' IS NOT NULL THEN
        jsonb_set(elem, '{setting_type_name}', to_jsonb(REPLACE(REPLACE(REPLACE(elem->>'setting_type_name', '1단계', '1'), '2단계', '2'), '3단계', '3')))
      WHEN elem->>'type_name' IS NOT NULL THEN
        jsonb_set(elem, '{type_name}', to_jsonb(REPLACE(REPLACE(REPLACE(elem->>'type_name', '1단계', '1'), '2단계', '2'), '3단계', '3')))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(selected_option_settings) AS elem
)
WHERE selected_option_settings IS NOT NULL
  AND selected_option_settings::text LIKE '%단계%';

-- 3. product_option_setting_types 테이블의 name 업데이트
UPDATE product_option_setting_types
SET name = REPLACE(REPLACE(REPLACE(name, '1단계', '1'), '2단계', '2'), '3단계', '3')
WHERE name LIKE '%단계%';

-- 4. 컬럼 코멘트 업데이트
COMMENT ON COLUMN product_option_setting_types.name IS 'Type 이름 (예: 1단계, 2단계)';
