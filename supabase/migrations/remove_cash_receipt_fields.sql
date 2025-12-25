-- 현금영수증 관련 필드 제거
-- 카드/간편 결제에서는 현금영수증이 불필요하므로 제거

-- 인덱스 먼저 삭제
DROP INDEX IF EXISTS idx_orders_cash_receipt_pending;

-- 현금영수증 관련 컬럼 삭제
ALTER TABLE orders DROP COLUMN IF EXISTS cash_receipt_type;
ALTER TABLE orders DROP COLUMN IF EXISTS cash_receipt_number;
ALTER TABLE orders DROP COLUMN IF EXISTS cash_receipt_issued;
ALTER TABLE orders DROP COLUMN IF EXISTS cash_receipt_issue_number;
ALTER TABLE orders DROP COLUMN IF EXISTS cash_receipt_issued_at;
