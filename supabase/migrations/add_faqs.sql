-- FAQ 테이블 추가 마이그레이션
-- 기존 데이터베이스에 FAQ 기능을 추가할 때 사용

-- FAQ 테이블 생성
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);

-- RLS 정책
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_select_policy" ON faqs
  FOR SELECT USING (true);

CREATE POLICY "faqs_insert_policy" ON faqs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "faqs_update_policy" ON faqs
  FOR UPDATE USING (true);

CREATE POLICY "faqs_delete_policy" ON faqs
  FOR DELETE USING (true);

-- FAQ 기본 데이터 (선택사항)
INSERT INTO faqs (question, answer, display_order, is_active) VALUES
('쿠폰을 어떻게 사용하나요?', '주문서 작성 시 쿠폰 적용란에서 보유한 쿠폰을 선택하여 사용하실 수 있습니다. 쿠폰마다 사용 조건(최소 주문금액, 적용 가능 상품 등)이 다를 수 있으니 확인 후 사용해 주세요.', 0, true),
('발급 받은 쿠폰은 어디서 확인할 수 있나요?', '마이페이지 > 쿠폰함에서 보유하신 쿠폰을 확인하실 수 있습니다. 쿠폰의 유효기간과 사용 조건도 함께 확인 가능합니다.', 1, true),
('상품 반품/교환 진행 시, 배송비가 부과되나요?', '고객님의 단순 변심으로 인한 반품/교환 시에는 왕복 배송비(7,000원)가 부과됩니다. 상품 불량이나 오배송의 경우에는 미묘히에서 배송비를 부담합니다.', 2, true),
('주문 내역 조회는 어디서 하나요?', '로그인 후 마이페이지 > 주문 내역에서 확인하실 수 있습니다. 주문 상태, 배송 현황, 결제 정보 등을 조회할 수 있습니다.', 3, true),
('아이디, 비밀번호가 기억이 나지 않습니다.', '로그인 페이지에서 "아이디 찾기" 또는 "비밀번호 찾기"를 이용해 주세요. 가입 시 등록한 휴대폰 번호 또는 이메일을 통해 확인 가능합니다.', 4, true),
('회원정보를 수정하고 싶습니다.', '마이페이지 > 회원정보 수정에서 비밀번호, 연락처, 배송지 등의 정보를 수정하실 수 있습니다.', 5, true),
('회원 탈퇴는 어떻게 하나요?', '마이페이지 > 회원정보 수정 > 회원 탈퇴에서 진행하실 수 있습니다. 탈퇴 시 보유하신 쿠폰, 적립금 등은 모두 소멸되며 복구가 불가능합니다.', 6, true),
('비회원 구매 가능한가요?', '미묘히는 회원 전용 서비스로, 비회원 구매는 지원하지 않습니다. 간단한 회원가입 후 다양한 혜택과 함께 편리하게 쇼핑해 주세요.', 7, true)
ON CONFLICT DO NOTHING;
