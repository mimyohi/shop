-- ============================================================================
-- Migration: 상담 필요 상태 테스트 주문 추가
-- 옵션 설정 미완료 상태의 주문을 추가하여 상담 필요 -> 상담 완료 전환 시
-- 옵션 설정 검증 기능 테스트용
-- ============================================================================

DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_addr1_id UUID;
  v_addr2_id UUID;
  v_order9_id UUID;
  v_order10_id UUID;
  v_product_stage1_id UUID;
  v_product_stage2_id UUID;
  v_option_1month_id UUID;
  v_option_2month_id UUID;
BEGIN
  -- 기존 사용자 및 제품 ID 조회
  SELECT id INTO v_user1_id FROM auth.users WHERE email = 'test1@example.com' LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE email = 'test2@example.com' LIMIT 1;

  -- 사용자가 없으면 종료
  IF v_user1_id IS NULL OR v_user2_id IS NULL THEN
    RAISE NOTICE '테스트 사용자가 없습니다. seed_data.sql을 먼저 실행해주세요.';
    RETURN;
  END IF;

  SELECT id INTO v_addr1_id FROM shipping_addresses WHERE user_id = v_user1_id LIMIT 1;
  SELECT id INTO v_addr2_id FROM shipping_addresses WHERE user_id = v_user2_id LIMIT 1;

  SELECT id INTO v_product_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_option_1month_id FROM product_options WHERE name = '1개월 다이어트 패키지' LIMIT 1;
  SELECT id INTO v_option_2month_id FROM product_options WHERE name = '2개월 다이어트 패키지' LIMIT 1;

  -- 중복 방지: 기존 테스트 주문이 있으면 스킵
  IF EXISTS (SELECT 1 FROM orders WHERE order_id LIKE '%-009' OR order_id LIKE '%-010') THEN
    RAISE NOTICE '테스트 주문이 이미 존재합니다.';
    RETURN;
  END IF;

  -- ========================================================================
  -- 주문 9: 옵션 설정 미완료 주문 (paid, consultation_required)
  -- 상담 필요 -> 상담 완료 전환 시 옵션 설정 필요 테스트용
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    450000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-009', 'consultation_required',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '30 minutes'
  ) RETURNING id INTO v_order9_id;

  -- 주문 9 항목: 1개월 패키지 (옵션 설정 없음 - 테스트용)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order9_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    NULL  -- 옵션 설정 미완료
  );

  -- 주문 9 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order9_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 73.0, 55.0, 78.0, 58.0, '2개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:30', '23:30', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage1', '옵션 설정 테스트용 - 상담 후 한약 단계 결정 필요'
  );

  -- ========================================================================
  -- 주문 10: 복수 옵션 중 일부만 설정된 주문 (paid, consultation_required)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1350000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-010', 'consultation_required',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    NOW() - INTERVAL '45 minutes'
  ) RETURNING id INTO v_order10_id;

  -- 주문 10 항목 1: 1개월 패키지 (설정 완료)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order10_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 주문 10 항목 2: 2개월 패키지 (설정 미완료 - 테스트용)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order10_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[]'::jsonb  -- 빈 배열 - 설정 미완료
  );

  -- 주문 10 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order10_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 82.0, 65.0, 90.0, 68.0, '4개월',
    '있음 - 1년 전 복용 경험', '없음', '오메가3',
    '자영업', '10-8시', false, '09:00', '00:00', false,
    '2meals', 'weekly_1_or_less', 'over_1L',
    'fast', 'stage2', '복수 옵션 테스트용 - 2개월차 패키지 상담 필요'
  );

  RAISE NOTICE '상담 필요 테스트 주문 2건이 추가되었습니다. (주문 9: 옵션 미설정, 주문 10: 일부 미설정)';
END $$;
