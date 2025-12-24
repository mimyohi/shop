-- ============================================================================
-- 가상계좌 관련 필드 추가 마이그레이션
-- 실행: psql 또는 Supabase SQL Editor에서 실행
-- ============================================================================

-- orders 테이블에 결제 방법 및 가상계좌 관련 필드 추가
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'CARD'
  CHECK (payment_method IN ('CARD', 'VIRTUAL_ACCOUNT'));

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS virtual_account_bank VARCHAR(50);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS virtual_account_number VARCHAR(50);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS virtual_account_holder VARCHAR(100);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS virtual_account_due_date TIMESTAMPTZ;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS virtual_account_deposited_at TIMESTAMPTZ;

-- 인덱스 추가 (가상계좌 결제 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_virtual_account_due_date ON orders(virtual_account_due_date)
  WHERE payment_method = 'VIRTUAL_ACCOUNT';

-- 코멘트 추가
COMMENT ON COLUMN orders.payment_method IS '결제 방법 (CARD: 카드결제, VIRTUAL_ACCOUNT: 가상계좌)';
COMMENT ON COLUMN orders.virtual_account_bank IS '가상계좌 은행명';
COMMENT ON COLUMN orders.virtual_account_number IS '가상계좌 계좌번호';
COMMENT ON COLUMN orders.virtual_account_holder IS '가상계좌 예금주';
COMMENT ON COLUMN orders.virtual_account_due_date IS '가상계좌 입금 기한';
COMMENT ON COLUMN orders.virtual_account_deposited_at IS '가상계좌 입금 완료 시간';
