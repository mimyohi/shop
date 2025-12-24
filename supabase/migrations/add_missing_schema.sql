-- ============================================================================
-- 현재 DB에 있지만 full_setup.sql에 없던 스키마 추가
-- 기존 DB에 적용할 필요 없음 (이미 존재함)
-- full_setup.sql과 동기화를 위한 참고용
-- ============================================================================

-- 1) user_profiles에 마케팅 동의 컬럼 추가
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_consent BOOLEAN DEFAULT false;

-- 2) orders에 shipping_fee 컬럼 추가
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_fee INTEGER DEFAULT 0;

-- 3) order_items에 selected_options 컬럼 추가
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS selected_options JSONB;

-- 4) instagram_images 테이블 생성
CREATE TABLE IF NOT EXISTS instagram_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_images_display_order ON instagram_images(display_order);
CREATE INDEX IF NOT EXISTS idx_instagram_images_is_active ON instagram_images(is_active);

ALTER TABLE instagram_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instagram_images_select_active"
  ON instagram_images FOR SELECT
  USING (is_active = true);

CREATE POLICY "instagram_images_service_role_all"
  ON instagram_images FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5) faqs 테이블 생성
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_select_active"
  ON faqs FOR SELECT
  USING (is_active = true);

CREATE POLICY "faqs_service_role_all"
  ON faqs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
