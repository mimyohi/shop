-- ============================================================================
-- Banners table migration
-- 기존 DB에 배너 테이블을 추가하기 위한 마이그레이션 스크립트
-- ============================================================================

-- 메인 배너 테이블 (PC/Mobile 구분)
CREATE TABLE IF NOT EXISTS main_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_target VARCHAR(20) DEFAULT '_self' CHECK (link_target IN ('_self', '_blank')),
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('pc', 'mobile', 'both')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE main_banners IS '메인 페이지 상단 배너 (PC/Mobile)';
COMMENT ON COLUMN main_banners.device_type IS 'pc: PC 전용, mobile: 모바일 전용, both: 모두 노출';
COMMENT ON COLUMN main_banners.mobile_image_url IS 'device_type이 both일 때 모바일용 이미지';

CREATE INDEX IF NOT EXISTS idx_main_banners_is_active ON main_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_main_banners_device_type ON main_banners(device_type);
CREATE INDEX IF NOT EXISTS idx_main_banners_display_order ON main_banners(display_order);
CREATE INDEX IF NOT EXISTS idx_main_banners_dates ON main_banners(start_at, end_at);

DROP TRIGGER IF EXISTS trigger_update_main_banners_updated_at ON main_banners;
CREATE TRIGGER trigger_update_main_banners_updated_at
  BEFORE UPDATE ON main_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 상품 배너 테이블 (PC/Mobile 구분)
CREATE TABLE IF NOT EXISTS product_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_target VARCHAR(20) DEFAULT '_self' CHECK (link_target IN ('_self', '_blank')),
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('pc', 'mobile', 'both')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE product_banners IS '상품 섹션 배너 (PC/Mobile)';
COMMENT ON COLUMN product_banners.device_type IS 'pc: PC 전용, mobile: 모바일 전용, both: 모두 노출';
COMMENT ON COLUMN product_banners.mobile_image_url IS 'device_type이 both일 때 모바일용 이미지';

CREATE INDEX IF NOT EXISTS idx_product_banners_is_active ON product_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_product_banners_device_type ON product_banners(device_type);
CREATE INDEX IF NOT EXISTS idx_product_banners_display_order ON product_banners(display_order);
CREATE INDEX IF NOT EXISTS idx_product_banners_dates ON product_banners(start_at, end_at);

DROP TRIGGER IF EXISTS trigger_update_product_banners_updated_at ON product_banners;
CREATE TRIGGER trigger_update_product_banners_updated_at
  BEFORE UPDATE ON product_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE main_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_banners ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 조회 가능 (활성화된 배너만)
CREATE POLICY "main_banners_select_active"
  ON main_banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "product_banners_select_active"
  ON product_banners FOR SELECT
  USING (is_active = true);

-- Service Role 전체 접근
CREATE POLICY "main_banners_service_role_all"
  ON main_banners FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "product_banners_service_role_all"
  ON product_banners FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banner images
CREATE POLICY "Public read access for banner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banner-images');

CREATE POLICY "Service role can manage banner images"
ON storage.objects FOR ALL
USING (bucket_id = 'banner-images' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'service_role');
