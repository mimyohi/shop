-- ============================================================================
-- user_profiles.email에 UNIQUE 제약만 추가 (기존 DB용)
--
-- 이미 운영 중인 DB에 적용하려면 먼저 20260103_fix_kakao_rejoin_issue.sql을
-- 실행하여 고아 레코드와 중복 이메일을 정리한 후 이 파일을 실행하세요.
-- ============================================================================

BEGIN;

-- 1. user_profiles.email에 UNIQUE 제약 추가
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);

-- 2. 대소문자 구분 없이 검색하기 위한 인덱스 추가
CREATE INDEX idx_user_profiles_email_lower ON user_profiles(LOWER(email));

COMMIT;
