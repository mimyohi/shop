-- ============================================================================
-- Migration: 복잡한 주문 데이터 추가 (여러 옵션 + 여러 상품)
-- Description: 여러 옵션과 여러 상품을 포함한 주문 추가
-- Date: 2025-11-30
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_product_stage1_id UUID;
  v_product_stage2_id UUID;
  v_product_stage3_id UUID;
  v_product_tea_id UUID;
  v_product_detox_tea_id UUID;
  v_product_patch_id UUID;
  v_option_1month_id UUID;
  v_option_2month_id UUID;
  v_option_3month_id UUID;
  v_addr_id UUID;
BEGIN
  -- 제품 ID 조회
  SELECT id INTO v_product_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_product_stage3_id FROM products WHERE slug = 'diet-stage3';
  SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';
  SELECT id INTO v_product_detox_tea_id FROM products WHERE slug = 'detox-tea';
  SELECT id INTO v_product_patch_id FROM products WHERE slug = 'slim-patch';

  -- 옵션 ID 조회
  SELECT id INTO v_option_1month_id FROM product_options WHERE slug = 'pkg-1m';
  SELECT id INTO v_option_2month_id FROM product_options WHERE slug = 'pkg-2m';
  SELECT id INTO v_option_3month_id FROM product_options WHERE slug = 'pkg-3m';

  -- 기존 사용자 중 첫 번째 사용자 선택
  SELECT id INTO v_user_id FROM auth.users WHERE email LIKE 'test%' LIMIT 1;

  -- 사용자의 배송지 조회
  SELECT id INTO v_addr_id FROM shipping_addresses WHERE user_id = v_user_id LIMIT 1;

  -- ========================================================================
  -- 주문 6: 여러 옵션 패키지 + 일반 상품 (paid, consultation_required)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    2750000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-006', 'consultation_required',
    0, v_addr_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '3 hours'
  ) RETURNING id INTO v_order_id;

  -- 주문 6 항목: 2개월 패키지 + 3개월 패키지 + 한방차 2종 + 패치
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, visit_type, selected_option_settings
  ) VALUES
    -- 2개월 패키지
    (v_order_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계 한약"}, {"setting_name": "2개월차", "type_name": "3단계 한약"}]'::jsonb),
    -- 3개월 패키지
    (v_order_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계 한약"}, {"setting_name": "2개월차", "type_name": "2단계 한약"}, {"setting_name": "3개월차", "type_name": "3단계 한약"}]'::jsonb);

  -- 일반 상품들 (옵션 없음)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order_id, v_product_tea_id, '대사촉진 한방차', 89000, 2),
    (v_order_id, v_product_detox_tea_id, '해독 한방차', 95000, 2),
    (v_order_id, v_product_patch_id, '한방 슬림 패치', 120000, 3);

  -- 주문 6 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order_id, v_user_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 58.0, '6개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage2', '종합 프로그램 희망'
  );

  -- ========================================================================
  -- 주문 7: 같은 제품의 여러 옵션 (paid, consultation_required)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1800000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-007', 'consultation_required',
    0, v_addr_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '5 hours'
  ) RETURNING id INTO v_order_id;

  -- 주문 7 항목: 1개월 패키지 2개 (다른 설정) + 2개월 패키지 1개
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, visit_type, selected_option_settings
  ) VALUES
    -- 1개월 패키지 #1 (1단계)
    (v_order_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계 한약"}]'::jsonb),
    -- 1개월 패키지 #2 (2단계)
    (v_order_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계 한약"}]'::jsonb),
    -- 2개월 패키지
    (v_order_id, v_product_stage3_id, '3단계 다이어트 한약', 480000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계 한약"}, {"setting_name": "2개월차", "type_name": "3단계 한약"}]'::jsonb);

  -- 주문 7 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order_id, v_user_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 55.0, '4개월',
    '있음 - 이전 한방 치료 경험', '있음 - 6개월 전', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'fast', 'stage2', '재구매 고객 - 이전 효과 우수'
  );

  -- ========================================================================
  -- 주문 8: 대량 주문 (shipping, shipping_in_progress)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at,
    assigned_admin_id, handler_admin_id, handled_at,
    created_at
  ) VALUES (
    v_user_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    3500000, 'shipping', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-008', 'shipping_in_progress',
    0, v_addr_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '123456789999', NOW() - INTERVAL '2 days',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_order_id;

  -- 주문 8 항목: 3개월 패키지 2개 + 2개월 패키지 1개 + 한방차 다량 + 패치
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, visit_type, selected_option_settings
  ) VALUES
    -- 3개월 패키지 #1
    (v_order_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계 한약"}, {"setting_name": "2개월차", "type_name": "2단계 한약"}, {"setting_name": "3개월차", "type_name": "2단계 한약"}]'::jsonb),
    -- 3개월 패키지 #2
    (v_order_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 'revisit_with_consult',
     '[{"setting_name": "1개월차", "type_name": "2단계 한약"}, {"setting_name": "2개월차", "type_name": "3단계 한약"}, {"setting_name": "3개월차", "type_name": "3단계 한약"}]'::jsonb),
    -- 2개월 패키지
    (v_order_id, v_product_stage3_id, '3단계 다이어트 한약', 480000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 'first',
     '[{"setting_name": "1개월차", "type_name": "3단계 한약"}, {"setting_name": "2개월차", "type_name": "3단계 한약"}]'::jsonb);

  -- 일반 상품들 (대량)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order_id, v_product_tea_id, '대사촉진 한방차', 89000, 5),
    (v_order_id, v_product_detox_tea_id, '해독 한방차', 95000, 5),
    (v_order_id, v_product_patch_id, '한방 슬림 패치', 120000, 10);

  -- 주문 8 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order_id, v_user_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 52.0, '8개월',
    '있음 - 장기 관리 프로그램', '있음 - 1년 전부터', '비타민, 유산균',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage3', 'VIP 고객 - 장기 관리 프로그램'
  );

  RAISE NOTICE '복잡한 주문 3건 추가 완료 (주문 6, 7, 8)';
END $$;

COMMIT;
