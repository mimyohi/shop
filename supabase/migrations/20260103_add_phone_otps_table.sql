-- phone_otps 테이블 생성
-- OTP 인증을 위한 테이블 (아이디 찾기, 비밀번호 재설정, 전화번호 인증 등에 사용)

CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(50) NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 10),
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE phone_otps IS 'OTP 인증 정보 저장 테이블 (아이디 찾기, 비밀번호 재설정, 회원가입 등)';
COMMENT ON COLUMN phone_otps.phone IS '전화번호 (E.164 형식, 예: +821012345678)';
COMMENT ON COLUMN phone_otps.otp_hash IS 'OTP 해시값 (보안을 위해 평문 저장 안함)';
COMMENT ON COLUMN phone_otps.attempts IS 'OTP 검증 시도 횟수 (최대 10회)';
COMMENT ON COLUMN phone_otps.verified IS 'OTP 검증 완료 여부';
COMMENT ON COLUMN phone_otps.expires_at IS 'OTP 만료 시간 (발송 후 5분)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_verified ON phone_otps(verified);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON phone_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_verified ON phone_otps(phone, verified);

-- RLS 활성화
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;

-- Service Role 전체 접근 권한
CREATE POLICY "phone_otps_service_role_all"
  ON phone_otps FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 만료된 OTP 자동 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM phone_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_otps IS '만료된 OTP 레코드 삭제 (만료 후 1시간 경과)';
