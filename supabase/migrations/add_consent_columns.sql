-- 마케팅 동의 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_consent BOOLEAN DEFAULT false;
