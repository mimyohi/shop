-- ============================================================================
-- Migration: 누락된 Product Options 추가
-- Description: 모든 다이어트 한약 주문에 옵션 추가
-- Date: 2025-11-30
-- ============================================================================

BEGIN;

-- 1개월 단일 패키지 옵션 생성 (없는 경우에만)
DO $$
DECLARE
  v_product_diet_id UUID;
  v_option_1month_id UUID;
  v_setting_1st_id UUID;
BEGIN
  -- 다이어트 한약 Product ID 조회
  SELECT id INTO v_product_diet_id FROM products WHERE slug = 'diet-stage1' LIMIT 1;

  -- 1개월 패키지가 이미 있는지 확인
  SELECT id INTO v_option_1month_id
  FROM product_options
  WHERE slug = 'pkg-1m' AND product_id = v_product_diet_id;

  -- 없으면 생성
  IF v_option_1month_id IS NULL THEN
    -- 1개월 다이어트 패키지 Option 생성
    INSERT INTO product_options (
      product_id, slug, name, category, price,
      use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
      display_order, image_url
    ) VALUES (
      v_product_diet_id, 'pkg-1m', '1개월 다이어트 패키지',
      '다이어트 패키지', 450000,
      true, false, false,
      0, 'https://via.placeholder.com/300'
    ) RETURNING id INTO v_option_1month_id;

    -- 1개월 패키지 - 1개월차 Setting
    INSERT INTO product_option_settings (option_id, name, display_order)
    VALUES (v_option_1month_id, '1개월차', 1)
    RETURNING id INTO v_setting_1st_id;

    -- 1개월차 Setting Types
    INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
    (v_setting_1st_id, '1단계 한약', 1),
    (v_setting_1st_id, '2단계 한약', 2),
    (v_setting_1st_id, '3단계 한약', 3);

    RAISE NOTICE '1개월 패키지 옵션 생성 완료: %', v_option_1month_id;
  ELSE
    RAISE NOTICE '1개월 패키지 옵션이 이미 존재함: %', v_option_1month_id;
  END IF;
END $$;

-- 주문 2번에 옵션 추가 (2단계 한약)
DO $$
DECLARE
  v_order_id UUID;
  v_order_item_id UUID;
  v_product_stage2_id UUID;
  v_option_1month_id UUID;
BEGIN
  -- 주문 2번 찾기
  SELECT id INTO v_order_id
  FROM orders
  WHERE order_id LIKE '%-002'
    AND status = 'shipping'
    AND consultation_status = 'shipping_in_progress'
  LIMIT 1;

  -- 2단계 한약 제품 ID
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';

  -- 1개월 패키지 옵션 ID
  SELECT id INTO v_option_1month_id FROM product_options WHERE slug = 'pkg-1m';

  IF v_order_id IS NOT NULL AND v_option_1month_id IS NOT NULL THEN
    -- 주문 2번의 2단계 한약 항목 찾기
    SELECT id INTO v_order_item_id
    FROM order_items
    WHERE order_id = v_order_id
      AND product_id = v_product_stage2_id
      AND option_id IS NULL
    LIMIT 1;

    IF v_order_item_id IS NOT NULL THEN
      -- 옵션 정보 업데이트
      UPDATE order_items
      SET
        option_id = v_option_1month_id,
        option_name = '1개월 다이어트 패키지',
        visit_type = 'first',
        selected_option_settings = '[{"setting_name": "1개월차", "type_name": "2단계 한약"}]'::jsonb
      WHERE id = v_order_item_id;

      RAISE NOTICE '주문 2번 order_item에 옵션 추가 완료';
    END IF;
  END IF;
END $$;

-- 주문 4번에 옵션 추가 (1단계 한약)
DO $$
DECLARE
  v_order_id UUID;
  v_order_item_id UUID;
  v_product_stage1_id UUID;
  v_option_1month_id UUID;
BEGIN
  -- 주문 4번 찾기
  SELECT id INTO v_order_id
  FROM orders
  WHERE order_id LIKE '%-004'
    AND status = 'pending'
    AND consultation_status = 'chatting_required'
  LIMIT 1;

  -- 1단계 한약 제품 ID
  SELECT id INTO v_product_stage1_id FROM products WHERE slug = 'diet-stage1';

  -- 1개월 패키지 옵션 ID
  SELECT id INTO v_option_1month_id FROM product_options WHERE slug = 'pkg-1m';

  IF v_order_id IS NOT NULL AND v_option_1month_id IS NOT NULL THEN
    -- 주문 4번의 1단계 한약 항목 찾기
    SELECT id INTO v_order_item_id
    FROM order_items
    WHERE order_id = v_order_id
      AND product_id = v_product_stage1_id
      AND option_id IS NULL
    LIMIT 1;

    IF v_order_item_id IS NOT NULL THEN
      -- 옵션 정보 업데이트
      UPDATE order_items
      SET
        option_id = v_option_1month_id,
        option_name = '1개월 다이어트 패키지',
        visit_type = 'first',
        selected_option_settings = '[{"setting_name": "1개월차", "type_name": "1단계 한약"}]'::jsonb
      WHERE id = v_order_item_id;

      RAISE NOTICE '주문 4번 order_item에 옵션 추가 완료';
    END IF;
  END IF;
END $$;

-- 주문 5번에 옵션 추가 (2단계 한약)
DO $$
DECLARE
  v_order_id UUID;
  v_order_item_id UUID;
  v_product_stage2_id UUID;
  v_option_1month_id UUID;
BEGIN
  -- 주문 5번 찾기
  SELECT id INTO v_order_id
  FROM orders
  WHERE order_id LIKE '%-005'
    AND status = 'cancelled'
    AND consultation_status = 'cancelled'
  LIMIT 1;

  -- 2단계 한약 제품 ID
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';

  -- 1개월 패키지 옵션 ID
  SELECT id INTO v_option_1month_id FROM product_options WHERE slug = 'pkg-1m';

  IF v_order_id IS NOT NULL AND v_option_1month_id IS NOT NULL THEN
    -- 주문 5번의 2단계 한약 항목 찾기
    SELECT id INTO v_order_item_id
    FROM order_items
    WHERE order_id = v_order_id
      AND product_id = v_product_stage2_id
      AND option_id IS NULL
    LIMIT 1;

    IF v_order_item_id IS NOT NULL THEN
      -- 옵션 정보 업데이트
      UPDATE order_items
      SET
        option_id = v_option_1month_id,
        option_name = '1개월 다이어트 패키지',
        visit_type = 'first',
        selected_option_settings = '[{"setting_name": "1개월차", "type_name": "2단계 한약"}]'::jsonb
      WHERE id = v_order_item_id;

      RAISE NOTICE '주문 5번 order_item에 옵션 추가 완료';
    END IF;
  END IF;
END $$;

COMMIT;
