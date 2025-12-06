-- ============================================================================
-- Migration: 상품별 매출 차트 개선을 위한 주문 데이터 업데이트
--
-- 목적: 상품별 옵션 매출 비중이 잘 보이도록 다양한 옵션별 주문 데이터 추가
-- 포함: visit_type (초진/재진), 문진 정보 (order_health_consultation)
-- ============================================================================

-- 1. 기존 주문 데이터 삭제 (테스트 데이터 초기화)
DELETE FROM order_health_consultation;
DELETE FROM order_items;
DELETE FROM orders;

-- 2. 다양한 옵션별 주문 생성 (user_id는 기존 auth.users에서 할당)
DO $$
DECLARE
  v_user_ids UUID[];
  v_user_count INT;
BEGIN
  -- 기존 auth.users에서 user_id 목록 가져오기
  SELECT ARRAY_AGG(id) INTO v_user_ids FROM auth.users;
  v_user_count := array_length(v_user_ids, 1);

  -- 주문 생성
  INSERT INTO orders (order_id, user_id, user_email, user_name, total_amount, status, created_at)
  VALUES
    -- 다이어트 한약 1 주문 (12건)
    ('ORD-2024-001', v_user_ids[1 % v_user_count + 1], 'test1@test.com', '김철수', 920000, 'completed', NOW() - INTERVAL '30 days'),
    ('ORD-2024-002', v_user_ids[2 % v_user_count + 1], 'test2@test.com', '이영희', 920000, 'completed', NOW() - INTERVAL '29 days'),
    ('ORD-2024-003', v_user_ids[3 % v_user_count + 1], 'test3@test.com', '박지수', 920000, 'completed', NOW() - INTERVAL '28 days'),
    ('ORD-2024-004', v_user_ids[4 % v_user_count + 1], 'test4@test.com', '최민호', 920000, 'completed', NOW() - INTERVAL '27 days'),
    ('ORD-2024-005', v_user_ids[5 % v_user_count + 1], 'test5@test.com', '정수진', 920000, 'paid', NOW() - INTERVAL '26 days'),
    ('ORD-2024-006', v_user_ids[6 % v_user_count + 1], 'test6@test.com', '강동원', 900000, 'completed', NOW() - INTERVAL '25 days'),
    ('ORD-2024-007', v_user_ids[7 % v_user_count + 1], 'test7@test.com', '송혜교', 900000, 'completed', NOW() - INTERVAL '24 days'),
    ('ORD-2024-008', v_user_ids[8 % v_user_count + 1], 'test8@test.com', '현빈', 900000, 'paid', NOW() - INTERVAL '23 days'),
    ('ORD-2024-009', v_user_ids[9 % v_user_count + 1], 'test9@test.com', '손예진', 900000, 'completed', NOW() - INTERVAL '22 days'),
    ('ORD-2024-010', v_user_ids[10 % v_user_count + 1], 'test10@test.com', '공유', 900000, 'completed', NOW() - INTERVAL '21 days'),
    ('ORD-2024-011', v_user_ids[11 % v_user_count + 1], 'test11@test.com', '김태리', 900000, 'paid', NOW() - INTERVAL '20 days'),
    ('ORD-2024-012', v_user_ids[12 % v_user_count + 1], 'test12@test.com', '박서준', 900000, 'completed', NOW() - INTERVAL '19 days'),
    -- 다이어트 한약 2 주문 (8건)
    ('ORD-2024-013', v_user_ids[13 % v_user_count + 1], 'test13@test.com', '김고은', 1040000, 'completed', NOW() - INTERVAL '18 days'),
    ('ORD-2024-014', v_user_ids[14 % v_user_count + 1], 'test14@test.com', '이병헌', 1040000, 'completed', NOW() - INTERVAL '17 days'),
    ('ORD-2024-015', v_user_ids[15 % v_user_count + 1], 'test15@test.com', '전지현', 1040000, 'paid', NOW() - INTERVAL '16 days'),
    ('ORD-2024-016', v_user_ids[16 % v_user_count + 1], 'test16@test.com', '조인성', 1040000, 'completed', NOW() - INTERVAL '15 days'),
    ('ORD-2024-017', v_user_ids[17 % v_user_count + 1], 'test17@test.com', '한소희', 1040000, 'completed', NOW() - INTERVAL '14 days'),
    ('ORD-2024-018', v_user_ids[18 % v_user_count + 1], 'test18@test.com', '차은우', 1040000, 'paid', NOW() - INTERVAL '13 days'),
    ('ORD-2024-019', v_user_ids[19 % v_user_count + 1], 'test19@test.com', '수지', 1040000, 'completed', NOW() - INTERVAL '12 days'),
    ('ORD-2024-020', v_user_ids[20 % v_user_count + 1], 'test20@test.com', '이민호', 1040000, 'completed', NOW() - INTERVAL '11 days'),
    -- 다이어트 한약 3 주문 (5건)
    ('ORD-2024-021', v_user_ids[21 % v_user_count + 1], 'test21@test.com', '김수현', 960000, 'completed', NOW() - INTERVAL '10 days'),
    ('ORD-2024-022', v_user_ids[22 % v_user_count + 1], 'test22@test.com', '전도연', 960000, 'paid', NOW() - INTERVAL '9 days'),
    ('ORD-2024-023', v_user_ids[23 % v_user_count + 1], 'test23@test.com', '하정우', 960000, 'completed', NOW() - INTERVAL '8 days'),
    ('ORD-2024-024', v_user_ids[24 % v_user_count + 1], 'test24@test.com', '김혜수', 960000, 'completed', NOW() - INTERVAL '7 days'),
    ('ORD-2024-025', v_user_ids[25 % v_user_count + 1], 'test25@test.com', '송강호', 960000, 'paid', NOW() - INTERVAL '6 days'),
    -- 대사촉진 한방 주문 (5건)
    ('ORD-2024-026', v_user_ids[26 % v_user_count + 1], 'test26@test.com', '이정재', 178000, 'completed', NOW() - INTERVAL '5 days'),
    ('ORD-2024-027', v_user_ids[27 % v_user_count + 1], 'test27@test.com', '정우성', 178000, 'completed', NOW() - INTERVAL '4 days'),
    ('ORD-2024-028', v_user_ids[28 % v_user_count + 1], 'test28@test.com', '황정민', 178000, 'paid', NOW() - INTERVAL '3 days'),
    ('ORD-2024-029', v_user_ids[29 % v_user_count + 1], 'test29@test.com', '조진웅', 178000, 'completed', NOW() - INTERVAL '2 days'),
    ('ORD-2024-030', v_user_ids[30 % v_user_count + 1], 'test30@test.com', '마동석', 178000, 'completed', NOW() - INTERVAL '1 days'),
    -- 해독 한방차 주문 (4건)
    ('ORD-2024-031', v_user_ids[31 % v_user_count + 1], 'test31@test.com', '류준열', 115000, 'completed', NOW() - INTERVAL '30 days'),
    ('ORD-2024-032', v_user_ids[32 % v_user_count + 1], 'test32@test.com', '이동욱', 115000, 'paid', NOW() - INTERVAL '25 days'),
    ('ORD-2024-033', v_user_ids[33 % v_user_count + 1], 'test33@test.com', '조승우', 115000, 'completed', NOW() - INTERVAL '20 days'),
    ('ORD-2024-034', v_user_ids[34 % v_user_count + 1], 'test34@test.com', '유아인', 115000, 'completed', NOW() - INTERVAL '15 days'),
    -- 한방 슬림 패치 주문 (3건)
    ('ORD-2024-035', v_user_ids[35 % v_user_count + 1], 'test35@test.com', '박보검', 120000, 'completed', NOW() - INTERVAL '10 days'),
    ('ORD-2024-036', v_user_ids[36 % v_user_count + 1], 'test36@test.com', '김선호', 120000, 'paid', NOW() - INTERVAL '5 days'),
    ('ORD-2024-037', v_user_ids[37 % v_user_count + 1], 'test37@test.com', '남주혁', 240000, 'completed', NOW() - INTERVAL '3 days');
END $$;

-- 3. 다이어트 한약 1 주문 아이템 (옵션별 분포 + visit_type)
INSERT INTO order_items (order_id, product_id, product_name, product_price, option_id, option_name, option_price, quantity, visit_type, selected_addons)
SELECT
  o.id,
  (SELECT id FROM products WHERE name = '다이어트 한약 1'),
  '다이어트 한약 1',
  450000,
  po.id,
  po.name,
  po.price,
  1,
  CASE
    WHEN o.order_id IN ('ORD-2024-001', 'ORD-2024-003', 'ORD-2024-006', 'ORD-2024-010') THEN 'first'
    WHEN o.order_id IN ('ORD-2024-002', 'ORD-2024-007', 'ORD-2024-011') THEN 'revisit_with_consult'
    ELSE 'revisit_no_consult'
  END,
  CASE
    WHEN o.order_id IN ('ORD-2024-001', 'ORD-2024-004')
    THEN '[{"id": "addon1", "name": "슬림 보조제", "price": 50000, "quantity": 1}]'::jsonb
    ELSE '[]'::jsonb
  END
FROM orders o
CROSS JOIN (
  SELECT id, name, price
  FROM product_options
  WHERE product_id = (SELECT id FROM products WHERE name = '다이어트 한약 1')
) po
WHERE
  (o.order_id IN ('ORD-2024-001', 'ORD-2024-002', 'ORD-2024-003', 'ORD-2024-004', 'ORD-2024-005') AND po.name = '패키지 - 1개월')
  OR (o.order_id IN ('ORD-2024-006', 'ORD-2024-007', 'ORD-2024-008', 'ORD-2024-009') AND po.name = '2개월')
  OR (o.order_id IN ('ORD-2024-010', 'ORD-2024-011', 'ORD-2024-012') AND po.name = '3개월');

-- 4. 다이어트 한약 2 주문 아이템 (옵션별 분포 + visit_type)
INSERT INTO order_items (order_id, product_id, product_name, product_price, option_id, option_name, option_price, quantity, visit_type, selected_addons)
SELECT
  o.id,
  (SELECT id FROM products WHERE name = '다이어트 한약 2'),
  '다이어트 한약 2',
  520000,
  po.id,
  po.name,
  po.price,
  1,
  CASE
    WHEN o.order_id IN ('ORD-2024-013', 'ORD-2024-016', 'ORD-2024-019') THEN 'first'
    WHEN o.order_id IN ('ORD-2024-014', 'ORD-2024-017') THEN 'revisit_with_consult'
    ELSE 'revisit_no_consult'
  END,
  CASE
    WHEN o.order_id = 'ORD-2024-013'
    THEN '[{"id": "addon2", "name": "해독 보조제", "price": 30000, "quantity": 2}]'::jsonb
    ELSE '[]'::jsonb
  END
FROM orders o
CROSS JOIN (
  SELECT id, name, price
  FROM product_options
  WHERE product_id = (SELECT id FROM products WHERE name = '다이어트 한약 2')
) po
WHERE
  (o.order_id IN ('ORD-2024-013', 'ORD-2024-014', 'ORD-2024-015') AND po.name = '1개월')
  OR (o.order_id IN ('ORD-2024-016', 'ORD-2024-017', 'ORD-2024-018') AND po.name = '2개월')
  OR (o.order_id IN ('ORD-2024-019', 'ORD-2024-020') AND po.name = '3개월');

-- 5. 다이어트 한약 3 주문 아이템 (옵션별 분포 + visit_type)
INSERT INTO order_items (order_id, product_id, product_name, product_price, option_id, option_name, option_price, quantity, visit_type, selected_addons)
SELECT
  o.id,
  (SELECT id FROM products WHERE name = '다이어트 한약 3'),
  '다이어트 한약 3',
  480000,
  po.id,
  po.name,
  po.price,
  1,
  CASE
    WHEN o.order_id IN ('ORD-2024-021', 'ORD-2024-023') THEN 'first'
    WHEN o.order_id = 'ORD-2024-022' THEN 'revisit_with_consult'
    ELSE 'revisit_no_consult'
  END,
  '[]'::jsonb
FROM orders o
CROSS JOIN (
  SELECT id, name, price
  FROM product_options
  WHERE product_id = (SELECT id FROM products WHERE name = '다이어트 한약 3')
) po
WHERE
  (o.order_id IN ('ORD-2024-021', 'ORD-2024-022') AND po.name = '1개월')
  OR (o.order_id IN ('ORD-2024-023', 'ORD-2024-024') AND po.name = '2개월')
  OR (o.order_id = 'ORD-2024-025' AND po.name = '3개월');

-- 6. 대사촉진 한방 주문 아이템 (옵션별 분포 + visit_type)
INSERT INTO order_items (order_id, product_id, product_name, product_price, option_id, option_name, option_price, quantity, visit_type, selected_addons)
SELECT
  o.id,
  (SELECT id FROM products WHERE name = '대사촉진 한방'),
  '대사촉진 한방',
  89000,
  po.id,
  po.name,
  po.price,
  1,
  CASE
    WHEN o.order_id IN ('ORD-2024-026', 'ORD-2024-028') THEN 'first'
    WHEN o.order_id = 'ORD-2024-027' THEN 'revisit_with_consult'
    ELSE 'revisit_no_consult'
  END,
  '[]'::jsonb
FROM orders o
CROSS JOIN (
  SELECT id, name, price
  FROM product_options
  WHERE product_id = (SELECT id FROM products WHERE name = '대사촉진 한방')
) po
WHERE
  (o.order_id IN ('ORD-2024-026', 'ORD-2024-027') AND po.name = '1개월')
  OR (o.order_id IN ('ORD-2024-028', 'ORD-2024-029') AND po.name = '2개월')
  OR (o.order_id = 'ORD-2024-030' AND po.name = '3개월');

-- 7. 해독 한방차 주문 아이템 (옵션별 분포 + visit_type)
INSERT INTO order_items (order_id, product_id, product_name, product_price, option_id, option_name, option_price, quantity, visit_type, selected_addons)
SELECT
  o.id,
  (SELECT id FROM products WHERE name = '해독 한방차'),
  '해독 한방차',
  95000,
  po.id,
  po.name,
  po.price,
  1,
  CASE
    WHEN o.order_id IN ('ORD-2024-031', 'ORD-2024-033') THEN 'first'
    ELSE 'revisit_no_consult'
  END,
  '[]'::jsonb
FROM orders o
CROSS JOIN (
  SELECT id, name, price
  FROM product_options
  WHERE product_id = (SELECT id FROM products WHERE name = '해독 한방차')
) po
WHERE
  (o.order_id IN ('ORD-2024-031', 'ORD-2024-032') AND po.name = '채유 패키지 1개월')
  OR (o.order_id IN ('ORD-2024-033', 'ORD-2024-034') AND po.name = '채유 패키지 2개월');

-- 8. 한방 슬림 패치 주문 아이템 (옵션 없음 + visit_type)
INSERT INTO order_items (order_id, product_id, product_name, product_price, option_id, option_name, option_price, quantity, visit_type, selected_addons)
SELECT
  o.id,
  (SELECT id FROM products WHERE name = '한방 슬림 패치'),
  '한방 슬림 패치',
  120000,
  NULL,
  NULL,
  0,
  CASE WHEN o.order_id = 'ORD-2024-037' THEN 2 ELSE 1 END,
  CASE
    WHEN o.order_id = 'ORD-2024-035' THEN 'first'
    ELSE 'revisit_no_consult'
  END,
  '[]'::jsonb
FROM orders o
WHERE o.order_id IN ('ORD-2024-035', 'ORD-2024-036', 'ORD-2024-037');

-- 9. 모든 주문에 대해 문진 정보 추가
INSERT INTO order_health_consultation (
  order_id, user_id, name, resident_number, phone,
  current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
  target_weight, target_weight_loss_period,
  previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
  occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
  meal_pattern, alcohol_frequency, water_intake,
  diet_approach, preferred_stage, medical_history
)
SELECT
  o.id,
  o.user_id,
  o.user_name,
  CASE
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY o.id), 2) = 0 THEN '901234-2******'
    ELSE '851234-1******'
  END,
  COALESCE(o.user_phone, '010-' || LPAD((1000 + (ROW_NUMBER() OVER (ORDER BY o.id))::int)::text, 4, '0') || '-' || LPAD((5000 + (ROW_NUMBER() OVER (ORDER BY o.id))::int)::text, 4, '0')),
  160 + (random() * 25)::int,
  55 + (random() * 40)::int,
  50 + (random() * 20)::int,
  70 + (random() * 30)::int,
  50 + (random() * 20)::int,
  CASE WHEN random() < 0.5 THEN '3개월' ELSE '6개월' END,
  CASE WHEN random() < 0.7 THEN '없음' ELSE '과거 다이어트 약 복용' END,
  CASE WHEN random() < 0.8 THEN '없음' ELSE '과거 한방 다이어트 경험' END,
  '없음',
  CASE WHEN random() < 0.4 THEN '사무직' WHEN random() < 0.7 THEN '자영업' ELSE '전문직' END,
  CASE WHEN random() < 0.6 THEN '9-6시' ELSE '불규칙' END,
  random() < 0.2,
  CASE WHEN random() < 0.5 THEN '07:00' ELSE '08:00' END::time,
  CASE WHEN random() < 0.5 THEN '23:00' ELSE '00:00' END::time,
  random() < 0.3,
  CASE WHEN random() < 0.5 THEN '3meals' WHEN random() < 0.8 THEN '2meals' ELSE 'irregular' END,
  CASE WHEN random() < 0.6 THEN 'weekly_1_or_less' ELSE 'weekly_2_or_more' END,
  CASE WHEN random() < 0.4 THEN '1L_or_less' ELSE 'over_1L' END,
  CASE WHEN random() < 0.7 THEN 'sustainable' ELSE 'fast' END,
  CASE WHEN random() < 0.4 THEN 'stage1' WHEN random() < 0.7 THEN 'stage2' ELSE 'stage3' END,
  CASE WHEN random() < 0.7 THEN '특이사항 없음' WHEN random() < 0.9 THEN '고혈압 관리 중' ELSE '당뇨 관리 중' END
FROM orders o;

-- 10. 주문에 배송 정보 추가
UPDATE orders
SET
  user_phone = '010-' || LPAD((1000 + (EXTRACT(EPOCH FROM created_at)::int % 9000))::text, 4, '0') || '-' || LPAD((1000 + (EXTRACT(EPOCH FROM created_at)::int % 8000))::text, 4, '0'),
  shipping_name = user_name,
  shipping_phone = '010-' || LPAD((1000 + (EXTRACT(EPOCH FROM created_at)::int % 9000))::text, 4, '0') || '-' || LPAD((1000 + (EXTRACT(EPOCH FROM created_at)::int % 8000))::text, 4, '0'),
  shipping_postal_code = CASE
    WHEN random() < 0.1 THEN '63000'
    WHEN random() < 0.15 THEN '40200'
    ELSE LPAD((10000 + (random() * 50000)::int)::text, 5, '0')
  END,
  shipping_address = CASE
    WHEN random() < 0.3 THEN '서울특별시 강남구 테헤란로 ' || (1 + (random() * 500)::int)::text
    WHEN random() < 0.5 THEN '서울특별시 서초구 강남대로 ' || (1 + (random() * 400)::int)::text
    WHEN random() < 0.7 THEN '경기도 성남시 분당구 판교로 ' || (1 + (random() * 300)::int)::text
    WHEN random() < 0.85 THEN '부산광역시 해운대구 해운대해변로 ' || (1 + (random() * 200)::int)::text
    ELSE '인천광역시 연수구 송도과학로 ' || (1 + (random() * 100)::int)::text
  END,
  shipping_address_detail = CASE
    WHEN random() < 0.3 THEN (1 + (random() * 30)::int)::text || '층'
    WHEN random() < 0.6 THEN (100 + (random() * 2000)::int)::text || '호'
    ELSE (1 + (random() * 10)::int)::text || '동 ' || (100 + (random() * 1500)::int)::text || '호'
  END,
  shipping_message = CASE
    WHEN random() < 0.3 THEN '문 앞에 놓아주세요'
    WHEN random() < 0.5 THEN '경비실에 맡겨주세요'
    WHEN random() < 0.7 THEN '부재시 연락주세요'
    WHEN random() < 0.85 THEN '벨 누르지 말아주세요'
    ELSE NULL
  END;
