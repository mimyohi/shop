-- 배송중(shipping_in_progress)과 배송완료(shipping_completed)를 배송처리(shipped)로 통합
-- 이 마이그레이션은 이미 DB에 적용되었습니다.

-- 1. 기존 check constraint 삭제
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_consultation_status_check;

-- 2. 기존 shipping_in_progress, shipping_completed 데이터를 consultation_completed로 임시 변경
UPDATE orders
SET consultation_status = 'consultation_completed', updated_at = NOW()
WHERE consultation_status IN ('shipping_in_progress', 'shipping_completed');

-- 3. 새로운 check constraint 추가 (shipped 포함, shipping_in_progress/shipping_completed 제거)
ALTER TABLE orders ADD CONSTRAINT orders_consultation_status_check
CHECK (consultation_status::text = ANY (ARRAY[
  'chatting_required',
  'consultation_required',
  'on_hold',
  'consultation_completed',
  'shipping_on_hold',
  'shipped',
  'cancelled',
  'expired'
]::text[]));

-- 참고: 새로운 상태 흐름
-- chatting_required (접수 필요)
-- → consultation_required (상담 필요)
-- → on_hold (보류) 또는 consultation_completed (배송필요/상담완료)
-- → shipping_on_hold (배송보류) 또는 shipped (배송처리)
-- → cancelled (취소)
