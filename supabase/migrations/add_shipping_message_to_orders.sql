-- orders 테이블에 shipping_message 컬럼 추가
-- 배송 요청 메시지를 저장하기 위한 필드

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_message TEXT;

-- 코멘트 추가
COMMENT ON COLUMN orders.shipping_message IS '배송 요청 메시지';
