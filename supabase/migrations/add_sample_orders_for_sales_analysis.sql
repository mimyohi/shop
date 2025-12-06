-- ============================================================================
-- 상품별 매출 분석을 위한 추가 주문 데이터 (주문 11-25)
-- 기존 데이터베이스에 추가 주문을 삽입합니다.
-- ============================================================================

DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_user3_id UUID;
  v_addr1_id UUID;
  v_addr2_id UUID;
  v_addr3_id UUID;
  v_product_stage1_id UUID;
  v_product_stage2_id UUID;
  v_product_tea_id UUID;
  v_option_1month_id UUID;
  v_option_2month_id UUID;
  v_option_3month_id UUID;
BEGIN
  -- 기존 사용자 및 주소 ID 조회
  SELECT user_id INTO v_user1_id FROM user_profiles WHERE email = 'test1@example.com' LIMIT 1;
  SELECT user_id INTO v_user2_id FROM user_profiles WHERE email = 'test2@example.com' LIMIT 1;
  SELECT user_id INTO v_user3_id FROM user_profiles WHERE email = 'test3@example.com' LIMIT 1;

  SELECT id INTO v_addr1_id FROM shipping_addresses WHERE user_id = v_user1_id LIMIT 1;
  SELECT id INTO v_addr2_id FROM shipping_addresses WHERE user_id = v_user2_id LIMIT 1;
  SELECT id INTO v_addr3_id FROM shipping_addresses WHERE user_id = v_user3_id LIMIT 1;

  -- 제품 ID 조회
  SELECT id INTO v_product_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';
  SELECT id INTO v_option_1month_id FROM product_options WHERE slug = 'pkg-1m';
  SELECT id INTO v_option_2month_id FROM product_options WHERE slug = 'pkg-2m';
  SELECT id INTO v_option_3month_id FROM product_options WHERE slug = 'pkg-3m';

  -- 사용자가 없으면 종료
  IF v_user1_id IS NULL OR v_user2_id IS NULL OR v_user3_id IS NULL THEN
    RAISE NOTICE 'Required users not found. Skipping order creation.';
    RETURN;
  END IF;

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
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S011', 'shipping_completed',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111011', NOW() - INTERVAL '20 days', NOW() - INTERVAL '17 days',
    NOW() - INTERVAL '25 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  FROM orders WHERE order_id LIKE '%S011'
  ON CONFLICT DO NOTHING;

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
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S012', 'shipping_completed',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111012', NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '22 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  FROM orders WHERE order_id LIKE '%S012'
  ON CONFLICT DO NOTHING;

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
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S013', 'shipping_completed',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111013', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '20 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}]'::jsonb
  FROM orders WHERE order_id LIKE '%S013'
  ON CONFLICT DO NOTHING;

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
    1044000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S014', 'shipping_completed',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111014', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '18 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1}, {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S014'
  ON CONFLICT DO NOTHING;

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
    1120000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S015', 'shipping_completed',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111015', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '15 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S015'
  ON CONFLICT DO NOTHING;

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
    1295000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S016', 'shipping_completed',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111016', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '14 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "해독 한방차 (1박스)", "price": 95000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S016'
  ON CONFLICT DO NOTHING;

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
    1500000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S017', 'shipping_completed',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111017', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '12 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (30매)", "price": 300000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S017'
  ON CONFLICT DO NOTHING;

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
    273000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S018', 'shipping_completed',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111018', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '8 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  )
  SELECT id, v_product_tea_id, '대사촉진 한방차', 89000, 2
  FROM orders WHERE order_id LIKE '%S018'
  ON CONFLICT DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  )
  SELECT o.id, p.id, '해독 한방차', 95000, 1
  FROM orders o, products p
  WHERE o.order_id LIKE '%S018' AND p.slug = 'detox-tea'
  ON CONFLICT DO NOTHING;

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
    600000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S019', 'shipping_completed',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111019', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '7 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  )
  SELECT o.id, p.id, '한방 슬림 패치', 120000, 5
  FROM orders o, products p
  WHERE o.order_id LIKE '%S019' AND p.slug = 'slim-patch'
  ON CONFLICT DO NOTHING;

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
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S020', 'shipping_completed',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111020', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '5 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'revisit_no_consult',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  FROM orders WHERE order_id LIKE '%S020'
  ON CONFLICT DO NOTHING;

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
    900000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S021', 'shipping_completed',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111021', NOW() - INTERVAL '1 day', NOW(),
    NOW() - INTERVAL '4 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT o.id, p.id, '3단계 다이어트 한약', 480000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb
  FROM orders o, products p
  WHERE o.order_id LIKE '%S021' AND p.slug = 'diet-stage3'
  ON CONFLICT DO NOTHING;

  -- 주문 22: 복합 주문 - 여러 상품 + 여러 옵션 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    2439000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S022', 'consultation_required',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    NOW() - INTERVAL '1 day'
  ) ON CONFLICT (order_id) DO NOTHING;

  -- 1개월 1단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 2}]'::jsonb
  FROM orders WHERE order_id LIKE '%S022'
  ON CONFLICT DO NOTHING;

  -- 2개월 2단계-3단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1}, {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S022'
  ON CONFLICT DO NOTHING;

  -- 일반 상품
  INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
  SELECT o.id, p.id, '해독 한방차', 95000, 3
  FROM orders o, products p
  WHERE o.order_id LIKE '%S022' AND p.slug = 'detox-tea'
  ON CONFLICT DO NOTHING;

  INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
  SELECT o.id, p.id, '한방 슬림 패치', 120000, 2
  FROM orders o, products p
  WHERE o.order_id LIKE '%S022' AND p.slug = 'slim-patch'
  ON CONFLICT DO NOTHING;

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
    1350000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S023', 'shipping_completed',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111023', NOW() - INTERVAL '1 day', NOW(),
    NOW() - INTERVAL '3 days'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 3,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  FROM orders WHERE order_id LIKE '%S023'
  ON CONFLICT DO NOTHING;

  -- 주문 24: 3개월 3단계 집중 패키지 (3-3-3)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1200000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S024', 'consultation_required',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    NOW() - INTERVAL '12 hours'
  ) ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  )
  SELECT o.id, p.id, '3단계 다이어트 한약', 480000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb
  FROM orders o, products p
  WHERE o.order_id LIKE '%S024' AND p.slug = 'diet-stage3'
  ON CONFLICT DO NOTHING;

  -- 주문 25: 모든 상품 종합 세트
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    3250000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-S025', 'consultation_required',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    NOW() - INTERVAL '6 hours'
  ) ON CONFLICT (order_id) DO NOTHING;

  -- 3개월 1-2-3단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1}, {"addon_id": null, "name": "해독 한방차 (1박스)", "price": 95000, "quantity": 1}, {"addon_id": null, "name": "한방 슬림 패치 (10매)", "price": 120000, "quantity": 1}, {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S025'
  ON CONFLICT DO NOTHING;

  -- 2개월 2-3단계
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (2박스)", "price": 170000, "quantity": 1}, {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}]'::jsonb
  FROM orders WHERE order_id LIKE '%S025'
  ON CONFLICT DO NOTHING;

  -- 1개월 3단계
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  )
  SELECT o.id, p.id, '3단계 다이어트 한약', 480000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "요요 방지 가이드북", "price": 25000, "quantity": 1}]'::jsonb
  FROM orders o, products p
  WHERE o.order_id LIKE '%S025' AND p.slug = 'diet-stage3'
  ON CONFLICT DO NOTHING;

  -- 일반 상품들
  INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
  SELECT o.id, v_product_tea_id, '대사촉진 한방차', 89000, 2
  FROM orders o WHERE o.order_id LIKE '%S025'
  ON CONFLICT DO NOTHING;

  INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
  SELECT o.id, p.id, '해독 한방차', 95000, 2
  FROM orders o, products p
  WHERE o.order_id LIKE '%S025' AND p.slug = 'detox-tea'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Sample orders for sales analysis have been added successfully.';
END $$;
