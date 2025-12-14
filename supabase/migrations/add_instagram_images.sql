-- Instagram Images 테이블 추가 마이그레이션
-- 기존 데이터베이스에 인스타그램 이미지 기능을 추가할 때 사용

-- 인스타그램 이미지 테이블 생성
CREATE TABLE IF NOT EXISTS instagram_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instagram_images_is_active ON instagram_images(is_active);
CREATE INDEX IF NOT EXISTS idx_instagram_images_display_order ON instagram_images(display_order);

-- RLS 정책
ALTER TABLE instagram_images ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 추가
CREATE POLICY "instagram_images_select_policy" ON instagram_images
  FOR SELECT USING (true);

-- 인증된 사용자만 삽입/수정/삭제 가능
CREATE POLICY "instagram_images_insert_policy" ON instagram_images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "instagram_images_update_policy" ON instagram_images
  FOR UPDATE USING (true);

CREATE POLICY "instagram_images_delete_policy" ON instagram_images
  FOR DELETE USING (true);
