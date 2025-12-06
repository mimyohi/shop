-- ============================================================================
-- Migration: 누락된 문진 데이터 추가
-- Description: 주문 4번과 5번에 문진 정보가 없어서 추가
-- Date: 2025-11-30
-- ============================================================================

BEGIN;

-- 주문 4번의 order_id와 user_id 조회하여 문진 추가
DO $$
DECLARE
  v_order4_id UUID;
  v_user_id UUID;
BEGIN
  -- 주문 4번 찾기 (ORDER-YYYYMMDD-004 패턴)
  SELECT id, user_id INTO v_order4_id, v_user_id
  FROM orders
  WHERE order_id LIKE '%-004'
    AND status = 'pending'
    AND consultation_status = 'chatting_required'
  LIMIT 1;

  -- 이미 문진 데이터가 있는지 확인
  IF v_order4_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM order_health_consultation WHERE order_id = v_order4_id
  ) THEN
    -- 주문 4 문진 정보 추가
    INSERT INTO order_health_consultation (
      order_id, user_id, name, resident_number, phone,
      current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
      target_weight, target_weight_loss_period,
      previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
      occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
      meal_pattern, alcohol_frequency, water_intake,
      diet_approach, preferred_stage, medical_history
    ) VALUES (
      v_order4_id, v_user_id, '김다이어트', '901234-1******', '010-1234-5678',
      165.0, 75.0, 55.0, 78.0, 60.0, '3개월',
      '없음', '없음', '없음',
      '사무직', '9-6시', false, '07:00', '23:00', false,
      '3meals', 'weekly_1_or_less', 'over_1L',
      'sustainable', 'stage1', '특이사항 없음'
    );

    RAISE NOTICE '주문 4번에 문진 정보 추가 완료';
  ELSE
    RAISE NOTICE '주문 4번 문진 정보가 이미 존재하거나 주문을 찾을 수 없음';
  END IF;
END $$;

-- 주문 5번의 order_id와 user_id 조회하여 문진 추가
DO $$
DECLARE
  v_order5_id UUID;
  v_user_id UUID;
BEGIN
  -- 주문 5번 찾기 (ORDER-YYYYMMDD-005 패턴)
  SELECT id, user_id INTO v_order5_id, v_user_id
  FROM orders
  WHERE order_id LIKE '%-005'
    AND status = 'cancelled'
    AND consultation_status = 'cancelled'
  LIMIT 1;

  -- 이미 문진 데이터가 있는지 확인
  IF v_order5_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM order_health_consultation WHERE order_id = v_order5_id
  ) THEN
    -- 주문 5 문진 정보 추가
    INSERT INTO order_health_consultation (
      order_id, user_id, name, resident_number, phone,
      current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
      target_weight, target_weight_loss_period,
      previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
      occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
      meal_pattern, alcohol_frequency, water_intake,
      diet_approach, preferred_stage, medical_history
    ) VALUES (
      v_order5_id, v_user_id, '이건강', '851015-2******', '010-2345-6789',
      170.0, 85.0, 65.0, 90.0, 70.0, '6개월',
      '있음 - 다이어트 약 복용 경험', '없음', '건강기능식품',
      '자영업', '불규칙', true, '08:00', '01:00', true,
      'irregular', 'weekly_2_or_more', '1L_or_less',
      'fast', 'stage2', '고객 요청으로 취소 - 개인 사정'
    );

    RAISE NOTICE '주문 5번에 문진 정보 추가 완료';
  ELSE
    RAISE NOTICE '주문 5번 문진 정보가 이미 존재하거나 주문을 찾을 수 없음';
  END IF;
END $$;

COMMIT;
