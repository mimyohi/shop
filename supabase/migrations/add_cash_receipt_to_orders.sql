-- 현금영수증 관련 필드 추가

-- 1. 현금영수증 유형 (PERSONAL: 소득공제용, CORPORATE: 지출증빙용)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_receipt_type VARCHAR(20)
  CHECK (cash_receipt_type IN ('PERSONAL', 'CORPORATE'));

-- 2. 현금영수증 발급 번호 (휴대폰번호 또는 사업자등록번호)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_receipt_number VARCHAR(20);

-- 3. 현금영수증 발급 여부
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_receipt_issued BOOLEAN DEFAULT FALSE;

-- 4. 현금영수증 국세청 승인번호 (발급 완료 시 저장)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_receipt_issue_number VARCHAR(50);

-- 5. 현금영수증 발급 시각
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_receipt_issued_at TIMESTAMPTZ;

-- 인덱스 추가 (현금영수증 발급 대기 건 조회용)
CREATE INDEX IF NOT EXISTS idx_orders_cash_receipt_pending
  ON orders(cash_receipt_type, cash_receipt_issued)
  WHERE cash_receipt_type IS NOT NULL AND cash_receipt_issued = FALSE;
