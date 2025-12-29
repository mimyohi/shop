-- ----------------------------------------------------------------------------

-- 한방 다이어트 제품 (가격은 옵션에서 관리)
INSERT INTO products (slug, name, description, image_url, category, is_visible_on_main, detail_images)
VALUES
  ('diet-stage1', '1단계 다이어트 한약', '체질 개선 및 기초 대사 향상을 위한 1단계 맞춤 한약. 건강한 체중 감량의 첫 걸음을 시작하세요.', 'https://via.placeholder.com/300', '다이어트 한약', true, '[]'::jsonb),
  ('diet-stage2', '2단계 다이어트 한약', '본격적인 체중 감량을 위한 2단계 맞춤 한약. 지방 분해와 식욕 조절에 효과적입니다.', 'https://via.placeholder.com/300', '다이어트 한약', true, '[]'::jsonb),
  ('diet-stage3', '3단계 다이어트 한약', '목표 체중 달성 및 유지를 위한 3단계 맞춤 한약. 요요 방지와 건강한 체형 유지를 돕습니다.', 'https://via.placeholder.com/300', '다이어트 한약', true, '[]'::jsonb),
  ('metabolism-tea', '대사촉진 한방차', '신진대사를 촉진하고 체내 노폐물 배출을 돕는 한방차. 하루 2-3회 드시면 좋습니다.', 'https://via.placeholder.com/300', '한방차', true, '[]'::jsonb),
  ('detox-tea', '해독 한방차', '체내 독소 배출과 부종 완화에 도움을 주는 해독 한방차. 다이어트와 병행하면 효과적입니다.', 'https://via.placeholder.com/300', '한방차', true, '[]'::jsonb),
  ('slim-patch', '한방 슬림 패치', '국소 부위 지방 분해를 돕는 한방 패치. 복부, 허벅지 등에 부착하여 사용합니다.', 'https://via.placeholder.com/300', '부가 제품', true, '[]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 한방 다이어트 쿠폰
INSERT INTO coupons (code, name, description, discount_type, discount_value, min_purchase, valid_until, usage_limit)
VALUES
  ('FIRSTDIET10', '첫 다이어트 10% 할인', '첫 한약 구매 시 10% 할인 혜택', 'percentage', 10, 0, NOW() + INTERVAL '90 days', 200),
  ('DIET50000', '5만원 할인 쿠폰', '40만원 이상 한약 구매 시 5만원 할인', 'fixed', 50000, 400000, NOW() + INTERVAL '60 days', 150),
  ('PREMIUM15', '프리미엄 15% 할인', '2단계 이상 한약 구매 시 15% 할인', 'percentage', 15, 500000, NOW() + INTERVAL '90 days', 100),
  ('TEA20000', '한방차 2만원 할인', '한방차 3개 이상 구매 시', 'fixed', 20000, 250000, NOW() + INTERVAL '30 days', 100)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_purchase = EXCLUDED.min_purchase,
  valid_until = EXCLUDED.valid_until,
  usage_limit = EXCLUDED.usage_limit,
  is_active = true;

-- 배송비 설정
INSERT INTO shipping_settings (
  base_shipping_fee,
  free_shipping_threshold,
  jeju_additional_fee,
  mountain_additional_fee,
  is_active
) VALUES (
  3500,
  250000,
  3000,
  5000,
  true
) ON CONFLICT DO NOTHING;

-- 제주 우편번호
INSERT INTO mountain_zipcodes (zipcode, region_name, region_type, additional_fee) VALUES
('63000', '제주시', 'jeju', 3000),
('63001', '제주시', 'jeju', 3000),
('63002', '제주시', 'jeju', 3000),
('63100', '제주시 애월읍', 'jeju', 3000),
('63200', '제주시 한림읍', 'jeju', 3000),
('63300', '제주시 추자면', 'jeju', 3000),
('63357', '제주시 우도면', 'jeju', 3000),
('63500', '서귀포시', 'jeju', 3000),
('63501', '서귀포시', 'jeju', 3000),
('63600', '서귀포시 성산읍', 'jeju', 3000),
('63601', '서귀포시 남원읍', 'jeju', 3000),
('63602', '서귀포시 안덕면', 'jeju', 3000),
('63603', '서귀포시 대정읍', 'jeju', 3000),
('63604', '서귀포시 표선면', 'jeju', 3000)
ON CONFLICT (zipcode) DO NOTHING;

-- 도서산간 우편번호
INSERT INTO mountain_zipcodes (zipcode, region_name, region_type, additional_fee) VALUES
('40200', '울릉군', 'mountain', 5000),
('40205', '울릉군 울릉읍', 'mountain', 5000),
('40240', '울릉군 서면', 'mountain', 5000),
('40260', '울릉군 북면', 'mountain', 5000),
('23100', '옹진군 백령면', 'mountain', 5000),
('23124', '옹진군 대청면', 'mountain', 5000),
('23125', '옹진군 소청면', 'mountain', 5000),
('23116', '옹진군 연평면', 'mountain', 5000),
('53331', '거제시 동부면', 'mountain', 5000),
('58900', '진도군', 'mountain', 5000),
('59100', '완도군', 'mountain', 5000),
('52400', '남해군', 'mountain', 5000),
('59500', '고흥군', 'mountain', 5000)
ON CONFLICT (zipcode) DO NOTHING;

-- 제품 옵션 및 부가상품 (REMOVED)
-- 기존 옵션 구조는 제거되었습니다. Product Options 구조를 사용하세요.

-- ----------------------------------------------------------------------------
-- Product Addons (추가상품) 샘플 데이터
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_stage1_id UUID;
  v_stage2_id UUID;
  v_stage3_id UUID;
  v_tea_id UUID;
BEGIN
  SELECT id INTO v_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_stage3_id FROM products WHERE slug = 'diet-stage3';
  SELECT id INTO v_tea_id FROM products WHERE slug = 'metabolism-tea';

  -- 1단계 한약 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_stage1_id, '대사촉진 한방차 (1박스)', '1단계 한약과 함께 복용하면 효과가 좋습니다', 89000, 'https://via.placeholder.com/200', 1),
  (v_stage1_id, '해독 한방차 (1박스)', '체내 독소 배출에 도움', 95000, 'https://via.placeholder.com/200', 2),
  (v_stage1_id, '한방 슬림 패치 (10매)', '복부 집중 관리', 120000, 'https://via.placeholder.com/200', 3),
  (v_stage1_id, '건강 보조제 세트', '비타민 & 미네랄 복합', 55000, 'https://via.placeholder.com/200', 4)
  ON CONFLICT DO NOTHING;

  -- 2단계 한약 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_stage2_id, '대사촉진 한방차 (2박스)', '2단계 한약 2개월분과 함께', 170000, 'https://via.placeholder.com/200', 1),
  (v_stage2_id, '해독 한방차 (2박스)', '장기 복용 추천', 180000, 'https://via.placeholder.com/200', 2),
  (v_stage2_id, '한방 슬림 패치 (20매)', '집중 관리 패키지', 220000, 'https://via.placeholder.com/200', 3),
  (v_stage2_id, '프리미엄 다이어트 북', '식단 & 운동 가이드', 30000, 'https://via.placeholder.com/200', 4)
  ON CONFLICT DO NOTHING;

  -- 3단계 한약 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_stage3_id, '유지 관리 한방차', '체중 유지에 특화된 한방차', 95000, 'https://via.placeholder.com/200', 1),
  (v_stage3_id, '한방 슬림 패치 (30매)', '3개월 집중 관리', 300000, 'https://via.placeholder.com/200', 2),
  (v_stage3_id, '요요 방지 가이드북', '평생 관리 노하우', 25000, 'https://via.placeholder.com/200', 3)
  ON CONFLICT DO NOTHING;

  -- 한방차 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_tea_id, '휴대용 티백 케이스', '외출 시 편리한 보관', 15000, 'https://via.placeholder.com/200', 1),
  (v_tea_id, '프리미엄 텀블러', '한방차 전용 보온병', 35000, 'https://via.placeholder.com/200', 2)
  ON CONFLICT DO NOTHING;
END $$;

-- ----------------------------------------------------------------------------
-- Product Options 샘플 데이터
-- 옵션명에 따라 개월수가 결정됨 (1개월 옵션 → settings 1개, 2개월 옵션 → settings 2개, 3개월 옵션 → settings 3개)
-- 모든 setting에는 1단계, 2단계, 3단계 types가 포함됨
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_product_diet UUID;
  v_group_1month UUID;
  v_group_2month UUID;
  v_group_3month UUID;
  v_setting_1st UUID;
  v_setting_2nd UUID;
  v_setting_3rd UUID;
BEGIN
  -- 다이어트 한약 Product ID 조회
  SELECT id INTO v_product_diet FROM products WHERE slug = 'diet-stage1';

  -- 1개월 다이어트 패키지 옵션 생성 (대표 옵션)
  INSERT INTO product_options (
    product_id, slug, name, category, price, discount_rate, is_representative,
    use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
    display_order, image_url
  ) VALUES (
    v_product_diet, 'pkg-1m', '1개월',
    '다이어트 패키지', 450000, 0, true,
    false, true, true,
    0, 'https://via.placeholder.com/300'
  ) RETURNING id INTO v_group_1month;

  -- 1개월 옵션 - 1개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_1month, '1개월', 0)
  RETURNING id INTO v_setting_1st;

  -- 1개월 setting - 1단계, 2단계, 3단계 types
  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_setting_1st, '1단계', 0),
  (v_setting_1st, '2단계', 1),
  (v_setting_1st, '3단계', 2);

  -- 2개월 다이어트 패키지 옵션 생성
  INSERT INTO product_options (
    product_id, slug, name, category, price, discount_rate, is_representative,
    use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
    display_order, image_url
  ) VALUES (
    v_product_diet, 'pkg-2m', '2개월',
    '다이어트 패키지', 900000, 10, false,
    false, true, true,
    1, 'https://via.placeholder.com/300'
  ) RETURNING id INTO v_group_2month;

  -- 2개월 옵션 - 1개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_2month, '1개월', 0)
  RETURNING id INTO v_setting_1st;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_setting_1st, '1단계', 0),
  (v_setting_1st, '2단계', 1),
  (v_setting_1st, '3단계', 2);

  -- 2개월 옵션 - 2개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_2month, '2개월', 1)
  RETURNING id INTO v_setting_2nd;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_setting_2nd, '1단계', 0),
  (v_setting_2nd, '2단계', 1),
  (v_setting_2nd, '3단계', 2);

  -- 3개월 다이어트 패키지 옵션 생성
  INSERT INTO product_options (
    product_id, slug, name, category, price, discount_rate, is_representative,
    use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
    display_order, image_url
  ) VALUES (
    v_product_diet, 'pkg-3m', '3개월',
    '다이어트 패키지', 1200000, 15, false,
    false, true, true,
    2, 'https://via.placeholder.com/300'
  ) RETURNING id INTO v_group_3month;

  -- 3개월 옵션 - 1개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_3month, '1개월', 0)
  RETURNING id INTO v_setting_1st;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_setting_1st, '1단계', 0),
  (v_setting_1st, '2단계', 1),
  (v_setting_1st, '3단계', 2);

  -- 3개월 옵션 - 2개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_3month, '2개월', 1)
  RETURNING id INTO v_setting_2nd;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_setting_2nd, '1단계', 0),
  (v_setting_2nd, '2단계', 1),
  (v_setting_2nd, '3단계', 2);

  -- 3개월 옵션 - 3개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_3month, '3개월', 2)
  RETURNING id INTO v_setting_3rd;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_setting_3rd, '1단계', 0),
  (v_setting_3rd, '2단계', 1),
  (v_setting_3rd, '3단계', 2);

END $$;

-- ----------------------------------------------------------------------------
-- 옵션이 없는 상품들에 기본 옵션 생성 (모든 상품에 최소 1개 옵션 필수)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_product RECORD;
BEGIN
  -- diet-stage2, diet-stage3, metabolism-tea, detox-tea, slim-patch에 기본 옵션 생성
  FOR v_product IN
    SELECT id, slug, name FROM products
    WHERE slug IN ('diet-stage2', 'diet-stage3', 'metabolism-tea', 'detox-tea', 'slim-patch')
  LOOP
    INSERT INTO product_options (
      product_id, name, price, discount_rate, is_representative,
      use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
      display_order
    ) VALUES (
      v_product.id,
      '기본',
      CASE v_product.slug
        WHEN 'diet-stage2' THEN 520000
        WHEN 'diet-stage3' THEN 480000
        WHEN 'metabolism-tea' THEN 89000
        WHEN 'detox-tea' THEN 95000
        WHEN 'slim-patch' THEN 120000
        ELSE 0
      END,
      0,
      true,
      false, false, false,
      0
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 샘플 사용자 및 주문 데이터
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user1_id UUID := gen_random_uuid();
  v_user2_id UUID := gen_random_uuid();
  v_user3_id UUID := gen_random_uuid();
  v_addr1_id UUID;
  v_addr2_id UUID;
  v_addr3_id UUID;
  v_order1_id UUID;
  v_order2_id UUID;
  v_order3_id UUID;
  v_order4_id UUID;
  v_order5_id UUID;
  v_order6_id UUID;
  v_order7_id UUID;
  v_order8_id UUID;
  v_order9_id UUID;
  v_order10_id UUID;
  v_product_stage1_id UUID;
  v_product_stage2_id UUID;
  v_product_tea_id UUID;
  v_option_1month_id UUID;
  v_option_2month_id UUID;
  v_option_3month_id UUID;
BEGIN
  -- 제품 ID 조회
  SELECT id INTO v_product_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';
  SELECT id INTO v_option_1month_id FROM product_options WHERE name = '1개월' LIMIT 1;
  SELECT id INTO v_option_2month_id FROM product_options WHERE name = '2개월' LIMIT 1;
  SELECT id INTO v_option_3month_id FROM product_options WHERE name = '3개월' LIMIT 1;

  -- auth.users에 테스트 사용자 생성
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data,
    raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
  ) VALUES
    (v_user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test1@example.com', crypt('password123', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"김다이어트"}'::jsonb,
     false, '', ''),
    (v_user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test2@example.com', crypt('password123', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"이건강"}'::jsonb,
     false, '', ''),
    (v_user3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test3@example.com', crypt('password123', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"박체중"}'::jsonb,
     false, '', '')
  ON CONFLICT (id) DO NOTHING;

  -- auth.identities에 identity 생성
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES
    (gen_random_uuid(), v_user1_id::text, v_user1_id,
     format('{"sub":"%s","email":"test1@example.com"}', v_user1_id)::jsonb,
     'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_user2_id::text, v_user2_id,
     format('{"sub":"%s","email":"test2@example.com"}', v_user2_id)::jsonb,
     'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_user3_id::text, v_user3_id,
     format('{"sub":"%s","email":"test3@example.com"}', v_user3_id)::jsonb,
     'email', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- 샘플 사용자 프로필 생성 (auth.users의 trigger가 자동으로 생성하지만 명시적으로 추가)
  INSERT INTO user_profiles (id, user_id, email, display_name, phone, phone_verified, phone_verified_at)
  VALUES
    (gen_random_uuid(), v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678', true, NOW()),
    (gen_random_uuid(), v_user2_id, 'test2@example.com', '이건강', '010-2345-6789', true, NOW()),
    (gen_random_uuid(), v_user3_id, 'test3@example.com', '박체중', '010-3456-7890', true, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- 사용자별 포인트 초기화 (트리거가 이미 생성했으므로 UPDATE)
  UPDATE user_points SET points = 5000, total_earned = 10000, total_used = 5000
  WHERE user_id = v_user1_id;

  UPDATE user_points SET points = 3000, total_earned = 3000, total_used = 0
  WHERE user_id = v_user2_id;

  UPDATE user_points SET points = 0, total_earned = 15000, total_used = 15000
  WHERE user_id = v_user3_id;

  -- 배송지 주소 생성
  INSERT INTO shipping_addresses (user_id, name, recipient, phone, postal_code, address, address_detail, is_default)
  VALUES
    (v_user1_id, '우리집', '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층', true)
    RETURNING id INTO v_addr1_id;

  INSERT INTO shipping_addresses (user_id, name, recipient, phone, postal_code, address, address_detail, is_default)
  VALUES
    (v_user2_id, '회사', '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층', true)
    RETURNING id INTO v_addr2_id;

  INSERT INTO shipping_addresses (user_id, name, recipient, phone, postal_code, address, address_detail, is_default)
  VALUES
    (v_user3_id, '본가', '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층', true)
    RETURNING id INTO v_addr3_id;

  -- 주문 1: 결제 완료 (paid) - 상담 필요 (consultation_required)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1109000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-001', 'consultation_required',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '2 days'
  ) RETURNING id INTO v_order1_id;

  -- 주문 1 항목: 2개월 패키지 (추가상품 포함)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    v_order1_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}]'::jsonb,
    '[
      {"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1},
      {"addon_id": null, "name": "한방 슬림 패치 (10매)", "price": 120000, "quantity": 1}
    ]'::jsonb
  );

  -- 주문 1 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order1_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 60.0, '3개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage1', '특이사항 없음'
  );

  -- 주문 2: 배송처리 (shipped)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at,
    assigned_admin_id, handler_admin_id, handled_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    897000, 'shipping', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-002', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '123456789012', NOW() - INTERVAL '1 day',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_order2_id;

  -- 주문 2 항목: 2단계 한약 + 한방차 2종 + 패치 (추가상품 포함)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES
    (v_order2_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb,
     '[
       {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}
     ]'::jsonb);

  -- 한방차 및 패치는 옵션 없이 추가
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order2_id, v_product_tea_id, '대사촉진 한방차', 89000, 2),
    (v_order2_id, (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 1),
    (v_order2_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 1);

  -- 주문 2 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order2_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 85.0, 65.0, 90.0, 70.0, '6개월',
    '있음 - 다이어트 약 복용 경험', '없음', '건강기능식품',
    '자영업', '불규칙', true, '08:00', '01:00', true,
    'irregular', 'weekly_2_or_more', '1L_or_less',
    'fast', 'stage2', '고혈압 약 복용 중'
  );

  -- 주문 3: 배송처리 (shipped)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    assigned_admin_id, handler_admin_id, handled_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    1294000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-003', 'shipped',
    15000, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '987654321098', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '10 days'
  ) RETURNING id INTO v_order3_id;

  -- 주문 3 항목: 3개월 패키지 + 한방차
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order3_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 추가 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order3_id, v_product_tea_id, '대사촉진 한방차', 89000, 1);

  -- 주문 3 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order3_id, v_user3_id, '박체중', '880523-1******', '010-3456-7890',
    175.0, 95.0, 70.0, 100.0, 75.0, '6개월',
    '있음', '있음', '헬스보충제',
    '교대근무', '3교대', true, '06:00', '22:00', true,
    '2meals', 'weekly_2_or_more', '1L_or_less',
    'sustainable', 'stage3', '당뇨 전단계, 지방간'
  );

  -- 주문 4: 결제 대기 (pending) - 채팅 필요 (chatting_required)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    539000, 'pending', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-004', 'chatting_required',
    0,
    NOW() - INTERVAL '1 hour'
  ) RETURNING id INTO v_order4_id;

  -- 주문 4 항목: 1단계 한약 + 한방차
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order4_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  );

  -- 추가 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order4_id, v_product_tea_id, '대사촉진 한방차', 89000, 1);

  -- 주문 4 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order4_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 60.0, '3개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage1', '특이사항 없음'
  );

  -- 주문 5: 취소됨 (cancelled) - 취소됨 (cancelled)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, admin_memo,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    760000, 'cancelled', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-005', 'cancelled',
    0, '고객 요청으로 취소 처리',
    NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_order5_id;

  -- 주문 5 항목: 2단계 한약 + 패치
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order5_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 추가 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order5_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 2);

  -- 주문 5 문진 정보 (취소되었지만 문진은 이미 작성된 상태)
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order5_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 85.0, 65.0, 90.0, 70.0, '6개월',
    '있음 - 다이어트 약 복용 경험', '없음', '건강기능식품',
    '자영업', '불규칙', true, '08:00', '01:00', true,
    'irregular', 'weekly_2_or_more', '1L_or_less',
    'fast', 'stage2', '고객 요청으로 취소 - 개인 사정'
  );

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
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    3110000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-006', 'consultation_required',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '3 hours'
  ) RETURNING id INTO v_order6_id;

  -- 주문 6 항목: 2개월 패키지 + 3개월 패키지 + 한방차 2종 + 패치 (추가상품 포함)
  -- 첫 번째 패키지 (2개월) - 추가상품 포함
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES
    (v_order6_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
     '[
       {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 2}
     ]'::jsonb);

  -- 두 번째 패키지 (3개월) - 추가상품 포함
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES
    (v_order6_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
     '[
       {"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1},
       {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}
     ]'::jsonb);

  -- 일반 상품들
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order6_id, v_product_tea_id, '대사촉진 한방차', 89000, 2),
    (v_order6_id, (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 2),
    (v_order6_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 3);

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
    v_order6_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
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
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1800000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-007', 'consultation_required',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    NOW() - INTERVAL '5 hours'
  ) RETURNING id INTO v_order7_id;

  -- 주문 7 항목: 1개월 패키지 2개 + 2개월 패키지 1개
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES
    (v_order7_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb),
    (v_order7_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb),
    (v_order7_id, (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb);

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
    v_order7_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 85.0, 65.0, 90.0, 68.0, '4개월',
    '있음 - 이전 한방 치료 경험', '있음 - 6개월 전', '없음',
    '자영업', '불규칙', true, '08:00', '01:00', true,
    'irregular', 'weekly_2_or_more', '1L_or_less',
    'fast', 'stage2', '재구매 고객 - 이전 효과 우수'
  );

  -- ========================================================================
  -- 주문 8: 대량 주문 (shipped)
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
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    3500000, 'shipping', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-008', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    'CJ대한통운', '123456789999', NOW() - INTERVAL '2 days',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_order8_id;

  -- 주문 8 항목: 3개월 패키지 2개 + 2개월 패키지 1개 + 한방차 다량
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES
    (v_order8_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "2단계"}]'::jsonb),
    (v_order8_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'revisit_with_consult',
     '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb),
    (v_order8_id, (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
     '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb);

  -- 일반 상품들 (대량)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order8_id, v_product_tea_id, '대사촉진 한방차', 89000, 5),
    (v_order8_id, (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 5),
    (v_order8_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 10);

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
    v_order8_id, v_user3_id, '박체중', '880523-1******', '010-3456-7890',
    175.0, 95.0, 70.0, 100.0, 72.0, '8개월',
    '있음 - 장기 관리 프로그램', '있음 - 1년 전부터', '비타민, 유산균',
    '교대근무', '3교대', true, '06:00', '22:00', true,
    '2meals', 'weekly_2_or_more', '1L_or_less',
    'sustainable', 'stage3', 'VIP 고객 - 장기 관리 프로그램'
  );

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

  -- ========================================================================
  -- 추가 주문 11-25: 옵션별 매출 분석을 위한 다양한 주문 데이터
  -- ========================================================================

  -- 주문 11: 1개월 1단계 패키지
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-011', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111011', NOW() - INTERVAL '20 days', NOW() - INTERVAL '17 days',
    NOW() - INTERVAL '25 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%011'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  );

  -- 주문 12: 1개월 2단계 패키지
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-012', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111012', NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '22 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%012'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 주문 13: 1개월 3단계 패키지
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-013', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111013', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '20 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%013'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 주문 14: 2개월 1단계-2단계 패키지 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1044000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-014', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111014', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '18 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%014'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1}, {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 1}]'::jsonb
  );

  -- 주문 15: 2개월 2단계-3단계 패키지 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1120000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-015', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111015', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '15 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%015'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1}]'::jsonb
  );

  -- 주문 16: 3개월 풀 패키지 (1-2-3단계)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    1295000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-016', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111016', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '14 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%016'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "해독 한방차 (1박스)", "price": 95000, "quantity": 1}]'::jsonb
  );

  -- 주문 17: 3개월 집중 패키지 (2-2-3단계)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1500000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-017', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111017', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '12 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%017'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (30매)", "price": 300000, "quantity": 1}]'::jsonb
  );

  -- 주문 18: 한방차만 구매 (옵션 없음)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    273000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-018', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111018', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '8 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%018'), v_product_tea_id, '대사촉진 한방차', 89000, 2),
    ((SELECT id FROM orders WHERE order_id LIKE '%018'), (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 1);

  -- 주문 19: 슬림 패치만 대량 구매 (옵션 없음)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    600000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-019', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111019', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '7 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%019'), (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 5);

  -- 주문 20: 1개월 1단계 재구매 (revisit)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-020', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111020', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '5 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%020'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'revisit_no_consult',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  );

  -- 주문 21: 2개월 3단계-3단계 패키지 (고급)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    900000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-021', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111021', NOW() - INTERVAL '1 day', NOW(),
    NOW() - INTERVAL '4 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%021'), (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 주문 22: 복합 주문 - 여러 상품 + 여러 옵션 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    2439000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-022', 'consultation_required',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    NOW() - INTERVAL '1 day'
  );

  -- 1개월 1단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%022'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 2}]'::jsonb
  );

  -- 2개월 2단계-3단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%022'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1}, {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}]'::jsonb
  );

  -- 일반 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%022'), (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 3),
    ((SELECT id FROM orders WHERE order_id LIKE '%022'), (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 2);

  -- 주문 23: 1개월 2단계 대량 (수량 3)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1350000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-023', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111023', NOW() - INTERVAL '1 day', NOW(),
    NOW() - INTERVAL '3 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%023'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 3,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 주문 24: 3개월 3단계 집중 패키지 (3-3-3)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1200000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-024', 'consultation_required',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    NOW() - INTERVAL '12 hours'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%024'), (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 주문 25: 모든 상품 종합 세트
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    3250000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-025', 'consultation_required',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    NOW() - INTERVAL '6 hours'
  );

  -- 3개월 1-2-3단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%025'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1}, {"addon_id": null, "name": "해독 한방차 (1박스)", "price": 95000, "quantity": 1}, {"addon_id": null, "name": "한방 슬림 패치 (10매)", "price": 120000, "quantity": 1}, {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 1}]'::jsonb
  );

  -- 2개월 2-3단계
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%025'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (2박스)", "price": 170000, "quantity": 1}, {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}]'::jsonb
  );

  -- 1개월 3단계
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%025'), (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "요요 방지 가이드북", "price": 25000, "quantity": 1}]'::jsonb
  );

  -- 일반 상품들
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%025'), v_product_tea_id, '대사촉진 한방차', 89000, 2),
    ((SELECT id FROM orders WHERE order_id LIKE '%025'), (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 2);

  -- 포인트 히스토리 추가
  INSERT INTO point_history (user_id, points, type, reason, order_id, created_at)
  VALUES
    (v_user1_id, 10000, 'earn', '회원가입 축하 포인트', NULL, NOW() - INTERVAL '30 days'),
    (v_user1_id, 5000, 'use', '주문 시 포인트 사용', v_order1_id, NOW() - INTERVAL '2 days'),
    (v_user2_id, 3000, 'earn', '첫 구매 감사 포인트', v_order2_id, NOW() - INTERVAL '5 days'),
    (v_user3_id, 15000, 'earn', '이벤트 당첨 포인트', NULL, NOW() - INTERVAL '20 days'),
    (v_user3_id, 15000, 'use', '주문 시 포인트 사용', v_order3_id, NOW() - INTERVAL '10 days');

  -- 관리자 활동 로그 추가
  INSERT INTO admin_activity_logs (
    admin_user_id, action, resource_type, resource_id, details, created_at
  ) VALUES
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'order_status_update', 'order', v_order2_id,
     '{"from": "paid", "to": "shipping", "tracking_number": "123456789012"}'::jsonb,
     NOW() - INTERVAL '1 day'),
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'consultation_complete', 'order', v_order2_id,
     '{"notes": "상담 완료 후 발송 처리"}'::jsonb,
     NOW() - INTERVAL '2 days'),
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'order_status_update', 'order', v_order3_id,
     '{"from": "shipping", "to": "delivered"}'::jsonb,
     NOW() - INTERVAL '1 day'),
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'order_cancel', 'order', v_order5_id,
     '{"reason": "고객 요청", "refund_amount": 520000}'::jsonb,
     NOW() - INTERVAL '3 days');

END $$;

-- 메인 배너 테스트 데이터 (이미지 전용)
INSERT INTO main_banners (image_url, mobile_image_url, device_type, display_order, is_active) VALUES
('https://via.placeholder.com/1440x501?text=Main+Banner+1', 'https://via.placeholder.com/393x153?text=Main+Banner+1+Mobile', 'both', 0, true),
('https://via.placeholder.com/1440x501?text=Main+Banner+2', NULL, 'pc', 1, true),
('https://via.placeholder.com/393x153?text=Main+Banner+Mobile+Only', NULL, 'mobile', 2, true)
ON CONFLICT DO NOTHING;

-- 상품 배너 테스트 데이터 (링크, 기간 포함)
INSERT INTO product_banners (image_url, mobile_image_url, link_url, device_type, display_order, is_active) VALUES
('https://via.placeholder.com/1380x501?text=Product+Banner+1', 'https://via.placeholder.com/378x137?text=Product+Banner+1+Mobile', '/products/diet-stage2', 'both', 0, true),
('https://via.placeholder.com/1380x501?text=Product+Banner+2', NULL, '/category/tea', 'pc', 1, true)
ON CONFLICT DO NOTHING;

COMMIT;
