-- ----------------------------------------------------------------------------
-- Migration: 주문에 추가 상품 및 Product Addons 추가
-- 설명:
--   1. Product Addons (추가상품) 데이터 생성
--   2. 일부 주문에 한방차, 패치 등의 추가 상품 추가
--   3. 일부 주문 항목에 selected_addons 추가
--   4. 주문 금액 업데이트
-- 날짜: 2025-11-30
-- ----------------------------------------------------------------------------

BEGIN;

-- ============================================================================
-- Step 1: Product Addons 데이터 생성
-- ============================================================================
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

-- ============================================================================
-- Step 2: 주문 항목에 추가 상품 및 selected_addons 추가
-- ============================================================================

-- 주문 1에 selected_addons 추가 및 금액 업데이트
DO $$
DECLARE
  v_order1_id UUID;
  v_order_item_id UUID;
BEGIN
  -- 주문 1 찾기 (2개월 패키지 주문)
  SELECT id INTO v_order1_id FROM orders
  WHERE order_id LIKE 'ORDER-%001'
    AND total_amount = 900000
    AND status = 'paid'
  LIMIT 1;

  IF v_order1_id IS NOT NULL THEN
    -- 2개월 패키지 주문 항목 찾기
    SELECT id INTO v_order_item_id FROM order_items
    WHERE order_id = v_order1_id
      AND option_name = '2개월 다이어트 패키지'
    LIMIT 1;

    -- selected_addons 추가
    IF v_order_item_id IS NOT NULL THEN
      UPDATE order_items
      SET selected_addons = '[
        {"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1},
        {"addon_id": null, "name": "한방 슬림 패치 (10매)", "price": 120000, "quantity": 1}
      ]'::jsonb
      WHERE id = v_order_item_id;
    END IF;

    -- 주문 금액 업데이트 (900000 -> 1109000)
    UPDATE orders SET total_amount = 1109000 WHERE id = v_order1_id;
  END IF;
END $$;

-- 주문 2에 추가 상품 및 selected_addons 추가
DO $$
DECLARE
  v_order2_id UUID;
  v_order_item_id UUID;
  v_product_tea_id UUID;
  v_product_detox_tea_id UUID;
  v_product_patch_id UUID;
BEGIN
  -- 주문 2 찾기 (배송 중인 주문)
  SELECT id INTO v_order2_id FROM orders
  WHERE order_id LIKE 'ORDER-%002'
    AND status = 'shipping'
    AND total_amount IN (523000, 867000)
  LIMIT 1;

  IF v_order2_id IS NOT NULL THEN
    -- 제품 ID 조회
    SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';
    SELECT id INTO v_product_detox_tea_id FROM products WHERE slug = 'detox-tea';
    SELECT id INTO v_product_patch_id FROM products WHERE slug = 'slim-patch';

    -- 1개월 패키지 주문 항목 찾기
    SELECT id INTO v_order_item_id FROM order_items
    WHERE order_id = v_order2_id
      AND option_name = '1개월 다이어트 패키지'
    LIMIT 1;

    -- selected_addons 추가
    IF v_order_item_id IS NOT NULL THEN
      UPDATE order_items
      SET selected_addons = '[
        {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}
      ]'::jsonb
      WHERE id = v_order_item_id
        AND (selected_addons IS NULL OR selected_addons = '[]'::jsonb);
    END IF;

    -- 기존 한방차 수량 업데이트
    UPDATE order_items
    SET quantity = 2
    WHERE order_id = v_order2_id
      AND product_id = v_product_tea_id
      AND quantity = 1;

    -- 추가 상품 삽입 (중복 방지)
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order2_id, v_product_detox_tea_id, '해독 한방차', 95000, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = v_order2_id AND product_id = v_product_detox_tea_id
    );

    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order2_id, v_product_patch_id, '한방 슬림 패치', 120000, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = v_order2_id AND product_id = v_product_patch_id
    );

    -- 주문 금액 업데이트 (523000 -> 897000)
    UPDATE orders SET total_amount = 897000 WHERE id = v_order2_id AND total_amount != 897000;
  END IF;
END $$;

-- 주문 3에 추가 상품 추가
DO $$
DECLARE
  v_order3_id UUID;
  v_product_tea_id UUID;
BEGIN
  -- 주문 3 찾기 (배송 완료된 주문)
  SELECT id INTO v_order3_id FROM orders
  WHERE order_id LIKE 'ORDER-%'
    AND status = 'delivered'
    AND total_amount = 1205000
  LIMIT 1;

  IF v_order3_id IS NOT NULL THEN
    -- 제품 ID 조회
    SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';

    -- 추가 상품 삽입 (중복 방지)
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order3_id, v_product_tea_id, '대사촉진 한방차', 89000, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = v_order3_id AND product_id = v_product_tea_id
    );

    -- 주문 금액 업데이트 (1205000 -> 1294000)
    UPDATE orders SET total_amount = 1294000 WHERE id = v_order3_id;
  END IF;
END $$;

-- 주문 4에 추가 상품 추가
DO $$
DECLARE
  v_order4_id UUID;
  v_product_tea_id UUID;
BEGIN
  -- 주문 4 찾기 (결제 대기 주문)
  SELECT id INTO v_order4_id FROM orders
  WHERE order_id LIKE 'ORDER-%'
    AND status = 'pending'
    AND consultation_status = 'chatting_required'
    AND total_amount = 450000
  LIMIT 1;

  IF v_order4_id IS NOT NULL THEN
    -- 제품 ID 조회
    SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';

    -- 추가 상품 삽입 (중복 방지)
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order4_id, v_product_tea_id, '대사촉진 한방차', 89000, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = v_order4_id AND product_id = v_product_tea_id
    );

    -- 주문 금액 업데이트 (450000 -> 539000)
    UPDATE orders SET total_amount = 539000 WHERE id = v_order4_id;
  END IF;
END $$;

-- 주문 5에 추가 상품 추가
DO $$
DECLARE
  v_order5_id UUID;
  v_product_patch_id UUID;
BEGIN
  -- 주문 5 찾기 (취소된 주문)
  SELECT id INTO v_order5_id FROM orders
  WHERE order_id LIKE 'ORDER-%'
    AND status = 'cancelled'
    AND total_amount = 520000
  LIMIT 1;

  IF v_order5_id IS NOT NULL THEN
    -- 제품 ID 조회
    SELECT id INTO v_product_patch_id FROM products WHERE slug = 'slim-patch';

    -- 추가 상품 삽입 (중복 방지)
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order5_id, v_product_patch_id, '한방 슬림 패치', 120000, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = v_order5_id AND product_id = v_product_patch_id
    );

    -- 주문 금액 업데이트 (520000 -> 760000)
    UPDATE orders SET total_amount = 760000 WHERE id = v_order5_id;
  END IF;
END $$;

COMMIT;
