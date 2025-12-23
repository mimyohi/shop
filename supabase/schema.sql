-- ============================================================================
-- Supabase full schema for the shopping service (storefront + admin)
-- Run this script once on a clean project to create every table, function,
-- trigger, policy, and seed that the current codebase expects.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Extensions & helper functions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Admin tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('master', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES admin_users(id),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user_id ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Service Role 전체 접근
CREATE POLICY "admin_users_service_role_all"
  ON admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 로그인을 위한 SELECT 권한 (익명/인증 사용자)
CREATE POLICY "admin_users_select_for_login"
  ON admin_users
  FOR SELECT
  USING (true);

-- Service Role 전체 접근
CREATE POLICY "admin_activity_logs_service_role_all"
  ON admin_activity_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO admin_users (username, email, password_hash, full_name, role)
VALUES (
  'master',
  'master@shopadmin.com',
  '$2b$10$hiy2wlrz27qG1/YbHTllIeLDlCoGlMxifOrOh.KytuiZhZHJlU10i', -- bcrypt for 'admin123'
  'Master Administrator',
  'master'
)
ON CONFLICT (username) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = true;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  discount_rate INTEGER DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  image_url TEXT,
  detail_images JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(100),
  is_visible_on_main BOOLEAN DEFAULT true,
  is_out_of_stock BOOLEAN DEFAULT false,
  is_new_badge BOOLEAN DEFAULT false,
  is_sale_badge BOOLEAN DEFAULT false,
  sale_start_at TIMESTAMPTZ,
  sale_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

COMMENT ON COLUMN products.discount_rate IS '할인률 (0-100%, 0이면 할인 없음)';
COMMENT ON COLUMN products.is_new_badge IS 'NEW 뱃지 표시 여부';
COMMENT ON COLUMN products.is_sale_badge IS 'SALE 뱃지 표시 여부';
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL means the product is active.';

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_visible_on_main) WHERE is_visible_on_main = true;
CREATE INDEX IF NOT EXISTS idx_products_sale_dates ON products(sale_start_at, sale_end_at);
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_products_description_gin ON products USING gin(to_tsvector('simple', description));
CREATE INDEX IF NOT EXISTS idx_products_new_badge ON products(is_new_badge) WHERE is_new_badge = true;
CREATE INDEX IF NOT EXISTS idx_products_sale_badge ON products(is_sale_badge) WHERE is_sale_badge = true;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
  slug_exists BOOLEAN;
BEGIN
  IF NEW.slug IS NULL THEN
    LOOP
      new_slug := generate_product_slug();
      SELECT EXISTS(SELECT 1 FROM products WHERE slug = new_slug) INTO slug_exists;
      IF NOT slug_exists THEN
        NEW.slug := new_slug;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_product_slug ON products;
CREATE TRIGGER trigger_set_product_slug
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_slug();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (is_visible_on_main = true);

CREATE POLICY "products_service_role_all"
  ON products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Product addons (추가상품은 유지)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON COLUMN product_addons.image_url IS '추가상품 이미지 URL (필수)';

CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);

DROP TRIGGER IF EXISTS update_product_addons_updated_at ON product_addons;
CREATE TRIGGER update_product_addons_updated_at
  BEFORE UPDATE ON product_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_addons_select_available"
  ON product_addons FOR SELECT
  USING (is_available = true);

CREATE POLICY "product_addons_service_role_all"
  ON product_addons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Product Options (Group-Option-Type structure)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  slug VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  detail_images JSONB DEFAULT '[]'::jsonb,

  -- 가격 (Group 단위로 설정, Type 선택과 무관)
  price INTEGER NOT NULL CHECK (price >= 0),

  -- 방문 타입별 옵션 사용 여부 플래그
  use_settings_on_first BOOLEAN NOT NULL DEFAULT true,
  use_settings_on_revisit_with_consult BOOLEAN NOT NULL DEFAULT true,
  use_settings_on_revisit_no_consult BOOLEAN NOT NULL DEFAULT true,

  -- 표시 관련
  is_new_badge BOOLEAN DEFAULT false,
  is_sale_badge BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE product_options IS '상품 옵션 (Option-Setting-Type 구조의 최상위)';
COMMENT ON COLUMN product_options.product_id IS 'Product와의 1:N 관계 (한 Product에 여러 Option 가능)';
COMMENT ON COLUMN product_options.price IS 'Option 판매 가격 (추가 가격)';
COMMENT ON COLUMN product_options.use_settings_on_first IS '초진일 때 설정 사용 여부';
COMMENT ON COLUMN product_options.use_settings_on_revisit_with_consult IS '재진(상담필요)일 때 설정 사용 여부';
COMMENT ON COLUMN product_options.use_settings_on_revisit_no_consult IS '재진(상담불필요)일 때 설정 사용 여부';

CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_options_slug ON product_options(slug);
CREATE INDEX IF NOT EXISTS idx_product_options_category ON product_options(category);
CREATE INDEX IF NOT EXISTS idx_product_options_display_order ON product_options(display_order);
CREATE INDEX IF NOT EXISTS idx_product_options_price ON product_options(price);

DROP TRIGGER IF EXISTS trigger_set_product_group_slug ON product_options;
CREATE TRIGGER trigger_set_product_group_slug
  BEFORE INSERT ON product_options
  FOR EACH ROW
  EXECUTE FUNCTION set_product_slug();

DROP TRIGGER IF EXISTS trigger_update_product_options_updated_at ON product_options;
CREATE TRIGGER trigger_update_product_options_updated_at
  BEFORE UPDATE ON product_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS product_option_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE product_option_settings IS 'Option 하위의 설정 (예: 1개월차, 2개월차, 3개월차)';

CREATE INDEX IF NOT EXISTS idx_product_option_settings_option_id ON product_option_settings(option_id);
CREATE INDEX IF NOT EXISTS idx_product_option_settings_display_order ON product_option_settings(display_order);

DROP TRIGGER IF EXISTS trigger_update_product_option_settings_updated_at ON product_option_settings;
CREATE TRIGGER trigger_update_product_option_settings_updated_at
  BEFORE UPDATE ON product_option_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS product_option_setting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID NOT NULL REFERENCES product_option_settings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE product_option_setting_types IS 'Setting 하위의 선택 가능한 타입 (가격은 Option 레벨에만 존재)';
COMMENT ON COLUMN product_option_setting_types.name IS 'Type 이름 (예: 1단계, 2단계)';

CREATE INDEX IF NOT EXISTS idx_product_option_setting_types_setting_id ON product_option_setting_types(setting_id);
CREATE INDEX IF NOT EXISTS idx_product_option_setting_types_display_order ON product_option_setting_types(display_order);

DROP TRIGGER IF EXISTS trigger_update_product_option_setting_types_updated_at ON product_option_setting_types;
CREATE TRIGGER trigger_update_product_option_setting_types_updated_at
  BEFORE UPDATE ON product_option_setting_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_setting_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_options_select_public"
  ON product_options FOR SELECT
  USING (true);

CREATE POLICY "product_option_settings_select_all"
  ON product_option_settings FOR SELECT
  USING (true);

CREATE POLICY "product_option_setting_types_select_all"
  ON product_option_setting_types FOR SELECT
  USING (true);

CREATE POLICY "product_options_service_role_all"
  ON product_options FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "product_option_settings_service_role_all"
  ON product_option_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "product_option_setting_types_service_role_all"
  ON product_option_setting_types FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Helper Functions
CREATE OR REPLACE FUNCTION get_option_use_settings(
  p_option_id UUID,
  p_visit_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_use_options BOOLEAN;
BEGIN
  SELECT
    CASE p_visit_type
      WHEN 'first' THEN use_settings_on_first
      WHEN 'revisit_with_consult' THEN use_settings_on_revisit_with_consult
      WHEN 'revisit_no_consult' THEN use_settings_on_revisit_no_consult
      ELSE false
    END INTO v_use_options
  FROM product_options
  WHERE id = p_option_id;

  RETURN COALESCE(v_use_options, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_option_use_settings IS '방문 타입에 따라 Option의 설정 사용 여부를 반환합니다.';

CREATE OR REPLACE FUNCTION get_option_price(p_option_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_price INTEGER;
BEGIN
  SELECT price INTO v_price
  FROM product_options
  WHERE id = p_option_id;

  RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_option_price IS 'Option의 판매 가격을 반환합니다. Type 선택과 무관하게 Option 가격이 적용됩니다.';

-- ----------------------------------------------------------------------------
-- User profiles, shipping, rewards, coupons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  postal_code VARCHAR(20),
  address TEXT NOT NULL,
  address_detail TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);

DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  total_earned INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'use')),
  reason VARCHAR(255) NOT NULL,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at DESC);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  min_purchase INTEGER DEFAULT 0,
  max_discount INTEGER,
  valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);

DROP TRIGGER IF EXISTS update_user_coupons_updated_at ON user_coupons;
CREATE TRIGGER update_user_coupons_updated_at
  BEFORE UPDATE ON user_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS coupon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(coupon_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon_id ON coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_products_product_id ON coupon_products(product_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;

-- user_profiles: 본인 데이터만 조회/수정
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- shipping_addresses: 본인 주소만 관리
CREATE POLICY "shipping_addresses_select_own"
  ON shipping_addresses FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "shipping_addresses_insert_own"
  ON shipping_addresses FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "shipping_addresses_update_own"
  ON shipping_addresses FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "shipping_addresses_delete_own"
  ON shipping_addresses FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- user_points: 본인 포인트만 조회
CREATE POLICY "user_points_select_own"
  ON user_points FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- point_history: 본인 내역만 조회
CREATE POLICY "point_history_select_own"
  ON point_history FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- coupons: 활성화된 쿠폰만 조회
CREATE POLICY "coupons_select_active"
  ON coupons FOR SELECT
  USING (is_active = true);

-- coupon_products: 모든 사용자 조회 가능
CREATE POLICY "coupon_products_select_all"
  ON coupon_products FOR SELECT
  USING (true);

-- user_coupons: 본인 쿠폰만 관리
CREATE POLICY "user_coupons_select_own"
  ON user_coupons FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_coupons_insert_own"
  ON user_coupons FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_coupons_update_own"
  ON user_coupons FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_coupons_delete_own"
  ON user_coupons FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_profiles_service_role_all"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "shipping_addresses_service_role_all"
  ON shipping_addresses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_points_service_role_all"
  ON user_points FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "point_history_service_role_all"
  ON point_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "coupons_service_role_all"
  ON coupons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_coupons_service_role_all"
  ON user_coupons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "coupon_products_service_role_all"
  ON coupon_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_points (user_id, points)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION add_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason VARCHAR(255),
  p_order_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_points
  SET
    points = points + p_points,
    total_earned = total_earned + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO point_history (user_id, points, type, reason, order_id)
  VALUES (p_user_id, p_points, 'earn', p_reason, p_order_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION use_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason VARCHAR(255),
  p_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_points INTEGER;
BEGIN
  SELECT points INTO current_points
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_points < p_points THEN
    RETURN FALSE;
  END IF;

  UPDATE user_points
  SET
    points = points - p_points,
    total_used = total_used + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO point_history (user_id, points, type, reason, order_id)
  VALUES (p_user_id, p_points, 'use', p_reason, p_order_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW coupon_applicable_products AS
SELECT
  c.id AS coupon_id,
  c.code,
  c.name AS coupon_name,
  p.id AS product_id,
  p.name AS product_name,
  p.price,
  p.image_url
FROM coupons c
JOIN coupon_products cp ON c.id = cp.coupon_id
JOIN products p ON cp.product_id = p.id
WHERE c.is_active = true;

CREATE OR REPLACE FUNCTION is_coupon_applicable_to_product(
  p_coupon_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_restrictions BOOLEAN;
  is_applicable BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM coupon_products WHERE coupon_id = p_coupon_id
  ) INTO has_restrictions;

  IF NOT has_restrictions THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM coupon_products
    WHERE coupon_id = p_coupon_id AND product_id = p_product_id
  ) INTO is_applicable;

  RETURN is_applicable;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Phone Utils
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_by_phone(p_phone VARCHAR)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email VARCHAR,
  display_name VARCHAR,
  phone VARCHAR,
  phone_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.user_id,
    up.email,
    up.display_name,
    up.phone,
    up.phone_verified
  FROM user_profiles up
  WHERE up.phone = p_phone
    AND up.phone_verified = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Orders & order items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_phone VARCHAR(50),
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'payment_pending', 'paid', 'preparing', 'shipping', 'delivered', 'completed', 'cancelled')),
  payment_key VARCHAR(255),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  admin_memo TEXT,
  used_points INTEGER DEFAULT 0 CHECK (used_points >= 0),
  user_coupon_id UUID REFERENCES user_coupons(id) ON DELETE SET NULL,
  coupon_discount INTEGER DEFAULT 0 CHECK (coupon_discount >= 0),
  shipping_address_id UUID REFERENCES shipping_addresses(id) ON DELETE SET NULL,
  shipping_name VARCHAR(255),
  shipping_phone VARCHAR(50),
  shipping_postal_code VARCHAR(20),
  shipping_address TEXT,
  shipping_address_detail TEXT,
  shipping_company VARCHAR(100),
  tracking_number VARCHAR(100),
  shipping_message TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  order_memo TEXT,
  assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  handler_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  consultation_status VARCHAR(50) NOT NULL DEFAULT 'chatting_required'
    CHECK (consultation_status IN (
      'chatting_required',
      'consultation_required',
      'on_hold',
      'consultation_completed',
      'shipping_on_hold',
      'shipped',
      'cancelled',
      'expired'
    )),
  -- 현금영수증 관련 필드
  cash_receipt_type VARCHAR(20) CHECK (cash_receipt_type IN ('PERSONAL', 'CORPORATE')),
  cash_receipt_number VARCHAR(20),
  cash_receipt_issued BOOLEAN DEFAULT FALSE,
  cash_receipt_issue_number VARCHAR(50),
  cash_receipt_issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_coupon_id ON orders(user_coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id ON orders(shipping_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_consultation_status ON orders(consultation_status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_admin_id ON orders(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_orders_handler_admin_id ON orders(handler_admin_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_email = current_setting('request.headers', true)::json->>'x-user-email')
  );

CREATE POLICY "orders_insert_authenticated"
  ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL)
  );

CREATE POLICY "orders_service_role_all"
  ON orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  -- Product Addons (추가상품)
  selected_addons JSONB,
  -- Product Options 관련 컬럼
  option_id UUID REFERENCES product_options(id) ON DELETE SET NULL,
  option_name VARCHAR(255),
  option_price INTEGER NOT NULL DEFAULT 0,
  visit_type VARCHAR(50),
  selected_option_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON COLUMN order_items.option_id IS '선택된 상품 옵션 ID (Option-Setting-Type 구조)';
COMMENT ON COLUMN order_items.option_price IS 'Option price snapshot at order time (for accurate revenue tracking)';
COMMENT ON COLUMN order_items.visit_type IS '구매 시 선택한 방문 타입';
COMMENT ON COLUMN order_items.selected_option_settings IS '선택된 Setting 정보 배열 (JSONB)';

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_option_id ON order_items(option_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR
        (auth.uid() IS NULL AND o.user_email = current_setting('request.headers', true)::json->>'x-user-email')
      )
    )
  );

CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR
        (auth.uid() IS NULL)
      )
    )
  );

CREATE POLICY "order_items_service_role_all"
  ON order_items FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Health profiles & consultations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date DATE,
  gender VARCHAR(10),
  height DECIMAL(5, 2),
  weight DECIMAL(5, 2),
  constitution_type VARCHAR(20),
  symptoms JSONB DEFAULT '[]'::jsonb,
  health_conditions JSONB DEFAULT '{}'::jsonb,
  allergies TEXT,
  medications TEXT,
  medical_history TEXT,
  family_history TEXT,
  pulse_diagnosis VARCHAR(100),
  tongue_diagnosis VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id ON user_health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_constitution ON user_health_profiles(constitution_type);

DROP TRIGGER IF EXISTS update_user_health_profiles_updated_at ON user_health_profiles;
CREATE TRIGGER update_user_health_profiles_updated_at
  BEFORE UPDATE ON user_health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_health_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 1) 개인정보
  name TEXT NOT NULL,
  resident_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  -- 2) 기본 신체 정보
  current_height NUMERIC(5,2) NOT NULL,
  current_weight NUMERIC(5,2) NOT NULL,
  min_weight_since_20s NUMERIC(5,2) NOT NULL,
  max_weight_since_20s NUMERIC(5,2) NOT NULL,
  target_weight NUMERIC(5,2) NOT NULL,
  target_weight_loss_period TEXT NOT NULL,
  -- 3) 다이어트 경험
  previous_western_medicine TEXT NOT NULL,
  previous_herbal_medicine TEXT NOT NULL,
  previous_other_medicine TEXT NOT NULL,
  -- 4) 생활 패턴
  occupation TEXT NOT NULL,
  work_hours TEXT NOT NULL,
  has_shift_work BOOLEAN NOT NULL,
  wake_up_time TIME NOT NULL,
  bedtime TIME NOT NULL,
  has_daytime_sleepiness BOOLEAN NOT NULL,
  meal_pattern TEXT NOT NULL CHECK (meal_pattern IN ('1meals', '2meals', '3meals', 'irregular')),
  alcohol_frequency TEXT NOT NULL CHECK (alcohol_frequency IN ('weekly_1_or_less', 'weekly_2_or_more')),
  water_intake TEXT NOT NULL CHECK (water_intake IN ('1L_or_less', 'over_1L')),
  -- 5) 원하는 다이어트 방향
  diet_approach TEXT NOT NULL CHECK (diet_approach IN ('sustainable', 'fast')),
  preferred_stage TEXT NOT NULL CHECK (preferred_stage IN ('stage1', 'stage2', 'stage3')),
  -- 6) 과거 병력 및 복용 약
  medical_history TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_user_health_consultations_user_id ON user_health_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_consultations_name ON user_health_consultations(name);

DROP TRIGGER IF EXISTS update_user_health_consultations_updated_at ON user_health_consultations;
CREATE TRIGGER update_user_health_consultations_updated_at
  BEFORE UPDATE ON user_health_consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_health_consultations IS '사용자 저장 문진 정보 (다이어트/비만 치료 전문)';

CREATE TABLE IF NOT EXISTS order_health_consultation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 1) 개인정보
  name TEXT NOT NULL,
  resident_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  -- 2) 기본 신체 정보
  current_height NUMERIC(5,2) NOT NULL,
  current_weight NUMERIC(5,2) NOT NULL,
  min_weight_since_20s NUMERIC(5,2) NOT NULL,
  max_weight_since_20s NUMERIC(5,2) NOT NULL,
  target_weight NUMERIC(5,2) NOT NULL,
  target_weight_loss_period TEXT NOT NULL,
  -- 3) 다이어트 경험
  previous_western_medicine TEXT NOT NULL,
  previous_herbal_medicine TEXT NOT NULL,
  previous_other_medicine TEXT NOT NULL,
  -- 4) 생활 패턴
  occupation TEXT NOT NULL,
  work_hours TEXT NOT NULL,
  has_shift_work BOOLEAN NOT NULL,
  wake_up_time TIME NOT NULL,
  bedtime TIME NOT NULL,
  has_daytime_sleepiness BOOLEAN NOT NULL,
  meal_pattern TEXT NOT NULL CHECK (meal_pattern IN ('1meals', '2meals', '3meals', 'irregular')),
  alcohol_frequency TEXT NOT NULL CHECK (alcohol_frequency IN ('weekly_1_or_less', 'weekly_2_or_more')),
  water_intake TEXT NOT NULL CHECK (water_intake IN ('1L_or_less', 'over_1L')),
  -- 5) 원하는 다이어트 방향
  diet_approach TEXT NOT NULL CHECK (diet_approach IN ('sustainable', 'fast')),
  preferred_stage TEXT NOT NULL CHECK (preferred_stage IN ('stage1', 'stage2', 'stage3')),
  -- 6) 과거 병력 및 복용 약
  medical_history TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_order_health_consultation_order_id ON order_health_consultation(order_id);
CREATE INDEX IF NOT EXISTS idx_order_health_consultation_user_id ON order_health_consultation(user_id);
CREATE INDEX IF NOT EXISTS idx_order_health_consultation_created_at ON order_health_consultation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_health_consultation_name ON order_health_consultation(name);

COMMENT ON TABLE order_health_consultation IS '주문별 문진 정보 (다이어트/비만 치료 전문)';

DROP TRIGGER IF EXISTS update_order_health_consultation_updated_at ON order_health_consultation;
CREATE TRIGGER update_order_health_consultation_updated_at
  BEFORE UPDATE ON order_health_consultation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_health_consultation ENABLE ROW LEVEL SECURITY;

-- user_health_profiles: 본인 건강 프로필만 관리
CREATE POLICY "user_health_profiles_select_own"
  ON user_health_profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_health_profiles_insert_own"
  ON user_health_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_health_profiles_update_own"
  ON user_health_profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_health_profiles_delete_own"
  ON user_health_profiles FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- user_health_consultations: 본인 문진만 관리
CREATE POLICY "user_health_consultations_select_own"
  ON user_health_consultations FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_health_consultations_insert_own"
  ON user_health_consultations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_health_consultations_update_own"
  ON user_health_consultations FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "user_health_consultations_delete_own"
  ON user_health_consultations FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- order_health_consultation: 본인 주문의 문진만
CREATE POLICY "order_health_consultation_select_own"
  ON order_health_consultation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_health_consultation.order_id
      AND (
        (auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR
        (auth.uid() IS NULL AND o.user_email = current_setting('request.headers', true)::json->>'x-user-email')
      )
    )
  );

CREATE POLICY "order_health_consultation_insert_own"
  ON order_health_consultation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_health_consultation.order_id
      AND (
        (auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR
        (auth.uid() IS NULL)
      )
    )
  );

CREATE POLICY "user_health_profiles_service_role_all"
  ON user_health_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_health_consultations_service_role_all"
  ON user_health_consultations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "order_health_consultation_service_role_all"
  ON order_health_consultation FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Utility functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE orders
  SET
    consultation_status = 'expired',
    updated_at = NOW()
  WHERE
    consultation_status = 'payment_pending'
    AND created_at < (NOW() - INTERVAL '24 hours')
    AND status = 'pending';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Shipping settings & mountain zipcodes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_shipping_fee INTEGER NOT NULL DEFAULT 3000,
  free_shipping_threshold INTEGER NOT NULL DEFAULT 50000,
  jeju_additional_fee INTEGER NOT NULL DEFAULT 3000,
  mountain_additional_fee INTEGER NOT NULL DEFAULT 5000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mountain_zipcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zipcode VARCHAR(5) NOT NULL UNIQUE,
  region_name VARCHAR(100) NOT NULL,
  region_type VARCHAR(20) NOT NULL,
  additional_fee INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mountain_zipcodes_zipcode ON mountain_zipcodes(zipcode);
CREATE INDEX IF NOT EXISTS idx_mountain_zipcodes_region_type ON mountain_zipcodes(region_type);

ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mountain_zipcodes ENABLE ROW LEVEL SECURITY;

-- shipping_settings: 모두 조회 가능
CREATE POLICY "shipping_settings_select_all"
  ON shipping_settings FOR SELECT
  USING (true);

-- mountain_zipcodes: 모두 조회 가능
CREATE POLICY "mountain_zipcodes_select_all"
  ON mountain_zipcodes FOR SELECT
  USING (true);

CREATE POLICY "shipping_settings_service_role_all"
  ON shipping_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "mountain_zipcodes_service_role_all"
  ON mountain_zipcodes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 배송비 계산 함수
CREATE OR REPLACE FUNCTION calculate_shipping_fee(
  p_order_amount INTEGER,
  p_zipcode VARCHAR(5) DEFAULT NULL
)
RETURNS TABLE(
  base_fee INTEGER,
  regional_fee INTEGER,
  total_fee INTEGER,
  is_free_shipping BOOLEAN,
  region_type VARCHAR(20)
) AS $$
DECLARE
  v_settings RECORD;
  v_mountain RECORD;
  v_base_fee INTEGER := 0;
  v_regional_fee INTEGER := 0;
  v_total_fee INTEGER := 0;
  v_is_free BOOLEAN := false;
  v_region_type VARCHAR(20) := 'normal';
BEGIN
  -- 배송 설정 조회
  SELECT * INTO v_settings
  FROM shipping_settings
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- 설정이 없으면 기본값 사용
  IF v_settings IS NULL THEN
    v_settings.base_shipping_fee := 3500;
    v_settings.free_shipping_threshold := 250000;
    v_settings.jeju_additional_fee := 3000;
    v_settings.mountain_additional_fee := 5000;
  END IF;

  -- 무료배송 확인
  IF p_order_amount >= v_settings.free_shipping_threshold THEN
    v_is_free := true;
    v_base_fee := 0;
  ELSE
    v_base_fee := v_settings.base_shipping_fee;
  END IF;

  -- 지역별 추가 배송비 확인 (우편번호가 제공된 경우)
  IF p_zipcode IS NOT NULL THEN
    SELECT * INTO v_mountain
    FROM mountain_zipcodes
    WHERE zipcode = p_zipcode
    LIMIT 1;

    IF v_mountain IS NOT NULL THEN
      v_region_type := v_mountain.region_type;
      v_regional_fee := v_mountain.additional_fee;
    END IF;
  END IF;

  -- 총 배송비 계산
  v_total_fee := v_base_fee + v_regional_fee;

  -- 결과 반환
  RETURN QUERY SELECT
    v_base_fee,
    v_regional_fee,
    v_total_fee,
    v_is_free,
    v_region_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_shipping_fee IS '
주문 금액과 우편번호를 기반으로 배송비를 계산합니다.
- 기본 배송비: 3,500원
- 25만원 이상: 무료배송
- 제주: 기본 배송비 + 3,000원 추가
- 도서산간: 기본 배송비 + 5,000원 추가
';

-- ----------------------------------------------------------------------------
-- Storage bucket for product images
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all storage objects" ON storage.objects;

CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Service role can manage all storage objects"
ON storage.objects FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Banner tables
-- ----------------------------------------------------------------------------

-- 메인 배너 테이블 (PC/Mobile 구분) - 이미지 전용
CREATE TABLE IF NOT EXISTS main_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('pc', 'mobile', 'both')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE main_banners IS '메인 페이지 상단 배너 (PC/Mobile) - 이미지 전용';
COMMENT ON COLUMN main_banners.device_type IS 'pc: PC 전용, mobile: 모바일 전용, both: 모두 노출';
COMMENT ON COLUMN main_banners.mobile_image_url IS 'device_type이 both일 때 모바일용 이미지';

CREATE INDEX IF NOT EXISTS idx_main_banners_is_active ON main_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_main_banners_device_type ON main_banners(device_type);
CREATE INDEX IF NOT EXISTS idx_main_banners_display_order ON main_banners(display_order);

DROP TRIGGER IF EXISTS trigger_update_main_banners_updated_at ON main_banners;
CREATE TRIGGER trigger_update_main_banners_updated_at
  BEFORE UPDATE ON main_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 상품 배너 테이블 (PC/Mobile 구분) - 링크, 기간 포함
CREATE TABLE IF NOT EXISTS product_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

COMMENT ON TABLE product_banners IS '상품 섹션 배너 (PC/Mobile) - 링크, 기간 포함';
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
DROP POLICY IF EXISTS "Public read access for banner images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage banner images" ON storage.objects;

CREATE POLICY "Public read access for banner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banner-images');

CREATE POLICY "Service role can manage banner images"
ON storage.objects FOR ALL
USING (bucket_id = 'banner-images' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Home Products (홈 화면 상품 설정)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS home_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(product_id)
);

COMMENT ON TABLE home_products IS '홈 화면에 표시할 상품 설정 (최대 6개)';
COMMENT ON COLUMN home_products.product_id IS '홈에 표시할 상품 ID';
COMMENT ON COLUMN home_products.display_order IS '표시 순서 (0부터 시작)';

CREATE INDEX IF NOT EXISTS idx_home_products_product_id ON home_products(product_id);
CREATE INDEX IF NOT EXISTS idx_home_products_display_order ON home_products(display_order);

DROP TRIGGER IF EXISTS trigger_update_home_products_updated_at ON home_products;
CREATE TRIGGER trigger_update_home_products_updated_at
  BEFORE UPDATE ON home_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE home_products ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 조회 가능
CREATE POLICY "home_products_select_all"
  ON home_products FOR SELECT
  USING (true);

-- Service Role 전체 접근
CREATE POLICY "home_products_service_role_all"
  ON home_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Seed data


COMMIT;
