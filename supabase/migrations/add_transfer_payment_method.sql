-- 실시간 계좌이체(TRANSFER) 결제 방법 추가
-- 기존 payment_method CHECK 제약 조건에 TRANSFER 옵션 추가

-- 기존 CHECK 제약 조건 삭제
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- 새로운 CHECK 제약 조건 추가 (TRANSFER 포함)
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('CARD', 'VIRTUAL_ACCOUNT', 'TRANSFER'));

-- 코멘트 업데이트
COMMENT ON COLUMN orders.payment_method IS '결제 방법 (CARD: 카드결제, VIRTUAL_ACCOUNT: 가상계좌, TRANSFER: 실시간 계좌이체)';
