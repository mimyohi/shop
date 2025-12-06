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
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON COLUMN products.discount_rate IS '할인률 (0-100%, 0이면 할인 없음)';
COMMENT ON COLUMN products.is_new_badge IS 'NEW 뱃지 표시 여부';
COMMENT ON COLUMN products.is_sale_badge IS 'SALE 뱃지 표시 여부';

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_verified_phone
  ON user_profiles(phone)
  WHERE phone_verified = true;

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
  INSERT INTO public.user_profiles (user_id, email, display_name, phone, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    phone_verified = COALESCE(EXCLUDED.phone_verified, user_profiles.phone_verified);

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
-- Phone OTP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON phone_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_otps_verified ON phone_otps(verified);

DROP TRIGGER IF EXISTS trigger_phone_otps_updated_at ON phone_otps;
CREATE TRIGGER trigger_phone_otps_updated_at
  BEFORE UPDATE ON phone_otps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS VOID AS $$
BEGIN
  DELETE FROM phone_otps
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_latest_otp(p_phone VARCHAR)
RETURNS TABLE (
  id UUID,
  phone VARCHAR,
  otp_hash VARCHAR,
  attempts INTEGER,
  verified BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    po.id,
    po.phone,
    po.otp_hash,
    po.attempts,
    po.verified,
    po.expires_at,
    po.created_at
  FROM phone_otps po
  WHERE po.phone = p_phone
    AND po.verified = false
    AND po.expires_at > NOW()
  ORDER BY po.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

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
      'cancelled'
    )),
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
    -- 로그인 사용자: user_id가 자신의 ID이거나 NULL
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR
    -- 비로그인 사용자: user_id가 NULL이어야 함
    (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "orders_delete_own"
  ON orders FOR DELETE
  USING (
    -- 로그인 사용자: 자신의 주문 또는 user_id가 NULL인 주문 (이메일로 확인)
    (auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR (user_id IS NULL AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    ))
    OR
    -- service_role은 모든 주문 삭제 가능
    auth.role() = 'service_role'
  );

-- 주문 상태 업데이트 정책 (결제 완료 등)
CREATE POLICY "orders_update_own"
  ON orders FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR auth.role() = 'service_role'
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
        (auth.uid() IS NOT NULL AND (o.user_id = auth.uid() OR o.user_id IS NULL)) OR
        (auth.uid() IS NULL)
      )
    )
  );

CREATE POLICY "order_items_delete_own"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR (orders.user_id IS NULL AND orders.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        OR auth.role() = 'service_role'
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
        (auth.uid() IS NOT NULL AND (o.user_id = auth.uid() OR o.user_id IS NULL)) OR
        (auth.uid() IS NULL)
      )
    )
  );

CREATE POLICY "order_health_consultation_delete_own"
  ON order_health_consultation FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_health_consultation.order_id
      AND (
        orders.user_id = auth.uid()
        OR (orders.user_id IS NULL AND orders.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        OR auth.role() = 'service_role'
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
-- ----------------------------------------------------------------------------

-- 한방 다이어트 제품
INSERT INTO products (slug, name, description, price, image_url, category, is_visible_on_main, detail_images)
VALUES
  ('diet-stage1', '1단계 다이어트 한약', '체질 개선 및 기초 대사 향상을 위한 1단계 맞춤 한약. 건강한 체중 감량의 첫 걸음을 시작하세요.', 450000, 'https://via.placeholder.com/300', '다이어트 한약', true, '[]'::jsonb),
  ('diet-stage2', '2단계 다이어트 한약', '본격적인 체중 감량을 위한 2단계 맞춤 한약. 지방 분해와 식욕 조절에 효과적입니다.', 520000, 'https://via.placeholder.com/300', '다이어트 한약', true, '[]'::jsonb),
  ('diet-stage3', '3단계 다이어트 한약', '목표 체중 달성 및 유지를 위한 3단계 맞춤 한약. 요요 방지와 건강한 체형 유지를 돕습니다.', 480000, 'https://via.placeholder.com/300', '다이어트 한약', true, '[]'::jsonb),
  ('metabolism-tea', '대사촉진 한방차', '신진대사를 촉진하고 체내 노폐물 배출을 돕는 한방차. 하루 2-3회 드시면 좋습니다.', 89000, 'https://via.placeholder.com/300', '한방차', true, '[]'::jsonb),
  ('detox-tea', '해독 한방차', '체내 독소 배출과 부종 완화에 도움을 주는 해독 한방차. 다이어트와 병행하면 효과적입니다.', 95000, 'https://via.placeholder.com/300', '한방차', true, '[]'::jsonb),
  ('slim-patch', '한방 슬림 패치', '국소 부위 지방 분해를 돕는 한방 패치. 복부, 허벅지 등에 부착하여 사용합니다.', 120000, 'https://via.placeholder.com/300', '부가 제품', true, '[]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 한방 다이어트 쿠폰
INSERT INTO coupons (code, name, description, discount_type, discount_value, min_purchase, valid_until, usage_limit)
VALUES
  ('FIRSTDIET10', '첫 다이어트 10% 할인', '첫 한약 구매 시 10% 할인 혜택', 'percentage', 10, 0, NOW() + INTERVAL '90 days', 200),
  ('DIET50000', '5만원 할인 쿠폰', '40만원 이상 한약 구매 시 5만원 할인', 'fixed', 50000, 400000, NOW() + INTERVAL '60 days', 150),
  ('PREMIUM15', '프리미엄 15% 할인', '2단계 이상 한약 구매 시 15% 할인', 'percentage', 15, 500000, NOW() + INTERVAL '90 days', 100),
  ('TEA20000', '한방차 2만원 할인', '한방차 3개 이상 구매 시', 'fixed', 20000, 250000, NOW() + INTERVAL '30 days', 100)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_purchase = EXCLUDED.min_purchase,
  valid_until = EXCLUDED.valid_until,
  usage_limit = EXCLUDED.usage_limit,
  is_active = true;

-- 배송비 설정
INSERT INTO shipping_settings (
  base_shipping_fee,
  free_shipping_threshold,
  jeju_additional_fee,
  mountain_additional_fee,
  is_active
) VALUES (
  3500,
  250000,
  3000,
  5000,
  true
) ON CONFLICT DO NOTHING;

-- 제주 우편번호
INSERT INTO mountain_zipcodes (zipcode, region_name, region_type, additional_fee) VALUES
('63000', '제주시', 'jeju', 3000),
('63001', '제주시', 'jeju', 3000),
('63002', '제주시', 'jeju', 3000),
('63100', '제주시 애월읍', 'jeju', 3000),
('63200', '제주시 한림읍', 'jeju', 3000),
('63300', '제주시 추자면', 'jeju', 3000),
('63357', '제주시 우도면', 'jeju', 3000),
('63500', '서귀포시', 'jeju', 3000),
('63501', '서귀포시', 'jeju', 3000),
('63600', '서귀포시 성산읍', 'jeju', 3000),
('63601', '서귀포시 남원읍', 'jeju', 3000),
('63602', '서귀포시 안덕면', 'jeju', 3000),
('63603', '서귀포시 대정읍', 'jeju', 3000),
('63604', '서귀포시 표선면', 'jeju', 3000)
ON CONFLICT (zipcode) DO NOTHING;

-- 도서산간 우편번호
INSERT INTO mountain_zipcodes (zipcode, region_name, region_type, additional_fee) VALUES
('40200', '울릉군', 'mountain', 5000),
('40205', '울릉군 울릉읍', 'mountain', 5000),
('40240', '울릉군 서면', 'mountain', 5000),
('40260', '울릉군 북면', 'mountain', 5000),
('23100', '옹진군 백령면', 'mountain', 5000),
('23124', '옹진군 대청면', 'mountain', 5000),
('23125', '옹진군 소청면', 'mountain', 5000),
('23116', '옹진군 연평면', 'mountain', 5000),
('53331', '거제시 동부면', 'mountain', 5000),
('58900', '진도군', 'mountain', 5000),
('59100', '완도군', 'mountain', 5000),
('52400', '남해군', 'mountain', 5000),
('59500', '고흥군', 'mountain', 5000)
ON CONFLICT (zipcode) DO NOTHING;

-- 제품 옵션 및 부가상품 (REMOVED)
-- 기존 옵션 구조는 제거되었습니다. Product Options 구조를 사용하세요.

-- ----------------------------------------------------------------------------
-- Product Addons (추가상품) 샘플 데이터
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_stage1_id UUID;
  v_stage2_id UUID;
  v_stage3_id UUID;
  v_tea_id UUID;
BEGIN
  SELECT id INTO v_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_stage3_id FROM products WHERE slug = 'diet-stage3';
  SELECT id INTO v_tea_id FROM products WHERE slug = 'metabolism-tea';

  -- 1단계 한약 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_stage1_id, '대사촉진 한방차 (1박스)', '1단계 한약과 함께 복용하면 효과가 좋습니다', 89000, 'https://via.placeholder.com/200', 1),
  (v_stage1_id, '해독 한방차 (1박스)', '체내 독소 배출에 도움', 95000, 'https://via.placeholder.com/200', 2),
  (v_stage1_id, '한방 슬림 패치 (10매)', '복부 집중 관리', 120000, 'https://via.placeholder.com/200', 3),
  (v_stage1_id, '건강 보조제 세트', '비타민 & 미네랄 복합', 55000, 'https://via.placeholder.com/200', 4)
  ON CONFLICT DO NOTHING;

  -- 2단계 한약 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_stage2_id, '대사촉진 한방차 (2박스)', '2단계 한약 2개월분과 함께', 170000, 'https://via.placeholder.com/200', 1),
  (v_stage2_id, '해독 한방차 (2박스)', '장기 복용 추천', 180000, 'https://via.placeholder.com/200', 2),
  (v_stage2_id, '한방 슬림 패치 (20매)', '집중 관리 패키지', 220000, 'https://via.placeholder.com/200', 3),
  (v_stage2_id, '프리미엄 다이어트 북', '식단 & 운동 가이드', 30000, 'https://via.placeholder.com/200', 4)
  ON CONFLICT DO NOTHING;

  -- 3단계 한약 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_stage3_id, '유지 관리 한방차', '체중 유지에 특화된 한방차', 95000, 'https://via.placeholder.com/200', 1),
  (v_stage3_id, '한방 슬림 패치 (30매)', '3개월 집중 관리', 300000, 'https://via.placeholder.com/200', 2),
  (v_stage3_id, '요요 방지 가이드북', '평생 관리 노하우', 25000, 'https://via.placeholder.com/200', 3)
  ON CONFLICT DO NOTHING;

  -- 한방차 추가상품
  INSERT INTO product_addons (product_id, name, description, price, image_url, display_order) VALUES
  (v_tea_id, '휴대용 티백 케이스', '외출 시 편리한 보관', 15000, 'https://via.placeholder.com/200', 1),
  (v_tea_id, '프리미엄 텀블러', '한방차 전용 보온병', 35000, 'https://via.placeholder.com/200', 2)
  ON CONFLICT DO NOTHING;
END $$;

-- ----------------------------------------------------------------------------
-- Product Options 샘플 데이터
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_product_diet UUID;
  v_group_1month UUID;
  v_group_2month UUID;
  v_group_3month UUID;
  v_option_1st UUID;
  v_option_2nd UUID;
  v_option_3rd UUID;
  v_type_stage1 UUID;
  v_type_stage2 UUID;
  v_type_stage3 UUID;
BEGIN
  -- 다이어트 한약 Product ID 조회
  SELECT id INTO v_product_diet FROM products WHERE slug = 'diet-stage1';

  -- 1개월 옵션 생성
  INSERT INTO product_options (
    product_id, slug, name, category, price,
    use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
    display_order, image_url
  ) VALUES (
    v_product_diet, 'pkg-1m', '1개월',
    '다이어트 패키지', 450000,
    false, true, true,
    0, 'https://via.placeholder.com/300'
  ) RETURNING id INTO v_group_1month;

  -- 1개월 옵션 - 1개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_1month, '1개월', 0)
  RETURNING id INTO v_option_1st;

  -- 1개월 setting - 1단계, 2단계, 3단계 types
  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_option_1st, '1단계', 0),
  (v_option_1st, '2단계', 1),
  (v_option_1st, '3단계', 2);

  -- 2개월 옵션 생성
  INSERT INTO product_options (
    product_id, slug, name, category, price,
    use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
    display_order, image_url
  ) VALUES (
    v_product_diet, 'pkg-2m', '2개월',
    '다이어트 패키지', 900000,
    false, true, true,
    1, 'https://via.placeholder.com/300'
  ) RETURNING id INTO v_group_2month;

  -- 2개월 옵션 - 1개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_2month, '1개월', 0)
  RETURNING id INTO v_option_1st;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_option_1st, '1단계', 0),
  (v_option_1st, '2단계', 1),
  (v_option_1st, '3단계', 2);

  -- 2개월 옵션 - 2개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_2month, '2개월', 1)
  RETURNING id INTO v_option_2nd;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_option_2nd, '1단계', 0),
  (v_option_2nd, '2단계', 1),
  (v_option_2nd, '3단계', 2);

  -- 3개월 옵션 생성
  INSERT INTO product_options (
    product_id, slug, name, category, price,
    use_settings_on_first, use_settings_on_revisit_with_consult, use_settings_on_revisit_no_consult,
    display_order, image_url
  ) VALUES (
    v_product_diet, 'pkg-3m', '3개월',
    '다이어트 패키지', 1200000,
    false, true, true,
    2, 'https://via.placeholder.com/300'
  ) RETURNING id INTO v_group_3month;

  -- 3개월 옵션 - 1개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_3month, '1개월', 0)
  RETURNING id INTO v_option_1st;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_option_1st, '1단계', 0),
  (v_option_1st, '2단계', 1),
  (v_option_1st, '3단계', 2);

  -- 3개월 옵션 - 2개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_3month, '2개월', 1)
  RETURNING id INTO v_option_2nd;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_option_2nd, '1단계', 0),
  (v_option_2nd, '2단계', 1),
  (v_option_2nd, '3단계', 2);

  -- 3개월 옵션 - 3개월 setting
  INSERT INTO product_option_settings (option_id, name, display_order)
  VALUES (v_group_3month, '3개월', 2)
  RETURNING id INTO v_option_3rd;

  INSERT INTO product_option_setting_types (setting_id, name, display_order) VALUES
  (v_option_3rd, '1단계', 0),
  (v_option_3rd, '2단계', 1),
  (v_option_3rd, '3단계', 2);

END $$;

-- ----------------------------------------------------------------------------
-- 샘플 사용자 및 주문 데이터
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user1_id UUID := gen_random_uuid();
  v_user2_id UUID := gen_random_uuid();
  v_user3_id UUID := gen_random_uuid();
  v_addr1_id UUID;
  v_addr2_id UUID;
  v_addr3_id UUID;
  v_order1_id UUID;
  v_order2_id UUID;
  v_order3_id UUID;
  v_order4_id UUID;
  v_order5_id UUID;
  v_order6_id UUID;
  v_order7_id UUID;
  v_order8_id UUID;
  v_order9_id UUID;
  v_order10_id UUID;
  v_product_stage1_id UUID;
  v_product_stage2_id UUID;
  v_product_tea_id UUID;
  v_option_1month_id UUID;
  v_option_2month_id UUID;
  v_option_3month_id UUID;
BEGIN
  -- 제품 ID 조회
  SELECT id INTO v_product_stage1_id FROM products WHERE slug = 'diet-stage1';
  SELECT id INTO v_product_stage2_id FROM products WHERE slug = 'diet-stage2';
  SELECT id INTO v_product_tea_id FROM products WHERE slug = 'metabolism-tea';
  SELECT id INTO v_option_1month_id FROM product_options WHERE name = '1개월' LIMIT 1;
  SELECT id INTO v_option_2month_id FROM product_options WHERE name = '2개월' LIMIT 1;
  SELECT id INTO v_option_3month_id FROM product_options WHERE name = '3개월' LIMIT 1;

  -- auth.users에 테스트 사용자 생성
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data,
    raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
  ) VALUES
    (v_user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test1@example.com', crypt('password123', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"김다이어트"}'::jsonb,
     false, '', ''),
    (v_user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test2@example.com', crypt('password123', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"이건강"}'::jsonb,
     false, '', ''),
    (v_user3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test3@example.com', crypt('password123', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"박체중"}'::jsonb,
     false, '', '')
  ON CONFLICT (id) DO NOTHING;

  -- auth.identities에 identity 생성
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES
    (gen_random_uuid(), v_user1_id::text, v_user1_id,
     format('{"sub":"%s","email":"test1@example.com"}', v_user1_id)::jsonb,
     'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_user2_id::text, v_user2_id,
     format('{"sub":"%s","email":"test2@example.com"}', v_user2_id)::jsonb,
     'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), v_user3_id::text, v_user3_id,
     format('{"sub":"%s","email":"test3@example.com"}', v_user3_id)::jsonb,
     'email', NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- 샘플 사용자 프로필 생성 (auth.users의 trigger가 자동으로 생성하지만 명시적으로 추가)
  INSERT INTO user_profiles (id, user_id, email, display_name, phone, phone_verified, phone_verified_at)
  VALUES
    (gen_random_uuid(), v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678', true, NOW()),
    (gen_random_uuid(), v_user2_id, 'test2@example.com', '이건강', '010-2345-6789', true, NOW()),
    (gen_random_uuid(), v_user3_id, 'test3@example.com', '박체중', '010-3456-7890', true, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- 사용자별 포인트 초기화 (트리거가 이미 생성했으므로 UPDATE)
  UPDATE user_points SET points = 5000, total_earned = 10000, total_used = 5000
  WHERE user_id = v_user1_id;

  UPDATE user_points SET points = 3000, total_earned = 3000, total_used = 0
  WHERE user_id = v_user2_id;

  UPDATE user_points SET points = 0, total_earned = 15000, total_used = 15000
  WHERE user_id = v_user3_id;

  -- 배송지 주소 생성
  INSERT INTO shipping_addresses (user_id, name, recipient, phone, postal_code, address, address_detail, is_default)
  VALUES
    (v_user1_id, '우리집', '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층', true)
    RETURNING id INTO v_addr1_id;

  INSERT INTO shipping_addresses (user_id, name, recipient, phone, postal_code, address, address_detail, is_default)
  VALUES
    (v_user2_id, '회사', '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층', true)
    RETURNING id INTO v_addr2_id;

  INSERT INTO shipping_addresses (user_id, name, recipient, phone, postal_code, address, address_detail, is_default)
  VALUES
    (v_user3_id, '본가', '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층', true)
    RETURNING id INTO v_addr3_id;

  -- 주문 1: 결제 완료 (paid) - 상담 필요 (consultation_required)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1109000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-001', 'consultation_required',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '2 days'
  ) RETURNING id INTO v_order1_id;

  -- 주문 1 항목: 2개월 패키지 (추가상품 포함)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    v_order1_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}]'::jsonb,
    '[
      {"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1},
      {"addon_id": null, "name": "한방 슬림 패치 (10매)", "price": 120000, "quantity": 1}
    ]'::jsonb
  );

  -- 주문 1 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order1_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 60.0, '3개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage1', '특이사항 없음'
  );

  -- 주문 2: 배송 중 (shipping) - 배송 진행 중 (shipped)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at,
    assigned_admin_id, handler_admin_id, handled_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    897000, 'shipping', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-002', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '123456789012', NOW() - INTERVAL '1 day',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_order2_id;

  -- 주문 2 항목: 2단계 한약 + 한방차 2종 + 패치 (추가상품 포함)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES
    (v_order2_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb,
     '[
       {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}
     ]'::jsonb);

  -- 한방차 및 패치는 옵션 없이 추가
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order2_id, v_product_tea_id, '대사촉진 한방차', 89000, 2),
    (v_order2_id, (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 1),
    (v_order2_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 1);

  -- 주문 2 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order2_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 85.0, 65.0, 90.0, 70.0, '6개월',
    '있음 - 다이어트 약 복용 경험', '없음', '건강기능식품',
    '자영업', '불규칙', true, '08:00', '01:00', true,
    'irregular', 'weekly_2_or_more', '1L_or_less',
    'fast', 'stage2', '고혈압 약 복용 중'
  );

  -- 주문 3: 배송 완료 (delivered) - 배송 완료 (shipped)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    assigned_admin_id, handler_admin_id, handled_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    1294000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-003', 'shipped',
    15000, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '987654321098', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '10 days'
  ) RETURNING id INTO v_order3_id;

  -- 주문 3 항목: 3개월 패키지 + 한방차
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order3_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 추가 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order3_id, v_product_tea_id, '대사촉진 한방차', 89000, 1);

  -- 주문 3 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order3_id, v_user3_id, '박체중', '880523-1******', '010-3456-7890',
    175.0, 95.0, 70.0, 100.0, 75.0, '6개월',
    '있음', '있음', '헬스보충제',
    '교대근무', '3교대', true, '06:00', '22:00', true,
    '2meals', 'weekly_2_or_more', '1L_or_less',
    'sustainable', 'stage3', '당뇨 전단계, 지방간'
  );

  -- 주문 4: 결제 대기 (pending) - 채팅 필요 (chatting_required)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    539000, 'pending', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-004', 'chatting_required',
    0,
    NOW() - INTERVAL '1 hour'
  ) RETURNING id INTO v_order4_id;

  -- 주문 4 항목: 1단계 한약 + 한방차
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order4_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  );

  -- 추가 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order4_id, v_product_tea_id, '대사촉진 한방차', 89000, 1);

  -- 주문 4 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order4_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 60.0, '3개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage1', '특이사항 없음'
  );

  -- 주문 5: 취소됨 (cancelled) - 취소됨 (cancelled)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, admin_memo,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    760000, 'cancelled', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-005', 'cancelled',
    0, '고객 요청으로 취소 처리',
    NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_order5_id;

  -- 주문 5 항목: 2단계 한약 + 패치
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    v_order5_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 추가 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order5_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 2);

  -- 주문 5 문진 정보 (취소되었지만 문진은 이미 작성된 상태)
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order5_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 85.0, 65.0, 90.0, 70.0, '6개월',
    '있음 - 다이어트 약 복용 경험', '없음', '건강기능식품',
    '자영업', '불규칙', true, '08:00', '01:00', true,
    'irregular', 'weekly_2_or_more', '1L_or_less',
    'fast', 'stage2', '고객 요청으로 취소 - 개인 사정'
  );

  -- ========================================================================
  -- 주문 6: 여러 옵션 패키지 + 일반 상품 (paid, consultation_required)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    3110000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-006', 'consultation_required',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    NOW() - INTERVAL '3 hours'
  ) RETURNING id INTO v_order6_id;

  -- 주문 6 항목: 2개월 패키지 + 3개월 패키지 + 한방차 2종 + 패치 (추가상품 포함)
  -- 첫 번째 패키지 (2개월) - 추가상품 포함
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES
    (v_order6_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
     '[
       {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 2}
     ]'::jsonb);

  -- 두 번째 패키지 (3개월) - 추가상품 포함
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES
    (v_order6_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
     '[
       {"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1},
       {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}
     ]'::jsonb);

  -- 일반 상품들
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order6_id, v_product_tea_id, '대사촉진 한방차', 89000, 2),
    (v_order6_id, (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 2),
    (v_order6_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 3);

  -- 주문 6 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order6_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
    165.0, 75.0, 55.0, 78.0, 58.0, '6개월',
    '없음', '없음', '없음',
    '사무직', '9-6시', false, '07:00', '23:00', false,
    '3meals', 'weekly_1_or_less', 'over_1L',
    'sustainable', 'stage2', '종합 프로그램 희망'
  );

  -- ========================================================================
  -- 주문 7: 같은 제품의 여러 옵션 (paid, consultation_required)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1800000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-007', 'consultation_required',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    NOW() - INTERVAL '5 hours'
  ) RETURNING id INTO v_order7_id;

  -- 주문 7 항목: 1개월 패키지 2개 + 2개월 패키지 1개
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES
    (v_order7_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb),
    (v_order7_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb),
    (v_order7_id, (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
     '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb);

  -- 주문 7 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order7_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
    170.0, 85.0, 65.0, 90.0, 68.0, '4개월',
    '있음 - 이전 한방 치료 경험', '있음 - 6개월 전', '없음',
    '자영업', '불규칙', true, '08:00', '01:00', true,
    'irregular', 'weekly_2_or_more', '1L_or_less',
    'fast', 'stage2', '재구매 고객 - 이전 효과 우수'
  );

  -- ========================================================================
  -- 주문 8: 대량 주문 (shipping, shipped)
  -- ========================================================================
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at,
    assigned_admin_id, handler_admin_id, handled_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    3500000, 'shipping', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-008', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    'CJ대한통운', '123456789999', NOW() - INTERVAL '2 days',
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    (SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_order8_id;

  -- 주문 8 항목: 3개월 패키지 2개 + 2개월 패키지 1개 + 한방차 다량
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES
    (v_order8_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
     '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "2단계"}]'::jsonb),
    (v_order8_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
     v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'revisit_with_consult',
     '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb),
    (v_order8_id, (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
     v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
     '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb);

  -- 일반 상품들 (대량)
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    (v_order8_id, v_product_tea_id, '대사촉진 한방차', 89000, 5),
    (v_order8_id, (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 5),
    (v_order8_id, (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 10);

  -- 주문 8 문진 정보
  INSERT INTO order_health_consultation (
    order_id, user_id, name, resident_number, phone,
    current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
    target_weight, target_weight_loss_period,
    previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
    occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
    meal_pattern, alcohol_frequency, water_intake,
    diet_approach, preferred_stage, medical_history
  ) VALUES (
    v_order8_id, v_user3_id, '박체중', '880523-1******', '010-3456-7890',
    175.0, 95.0, 70.0, 100.0, 72.0, '8개월',
    '있음 - 장기 관리 프로그램', '있음 - 1년 전부터', '비타민, 유산균',
    '교대근무', '3교대', true, '06:00', '22:00', true,
    '2meals', 'weekly_2_or_more', '1L_or_less',
    'sustainable', 'stage3', 'VIP 고객 - 장기 관리 프로그램'
  );

  -- ========================================================================
  -- 주문 9: 옵션 설정 미완료 주문 (paid, consultation_required)
  -- 상담 필요 -> 상담 완료 전환 시 옵션 설정 필요 테스트용
  -- ========================================================================
  INSERT INTO orders (
      user_id, user_email, user_name, user_phone,
      total_amount, status, order_id, consultation_status,
      used_points, shipping_address_id,
      shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
      created_at
    ) VALUES (
      v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
      450000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-009', 'consultation_required',
      0, v_addr1_id,
      '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
      NOW() - INTERVAL '30 minutes'
    ) RETURNING id INTO v_order9_id;

    -- 주문 9 항목: 1개월 패키지 (옵션 설정 없음 - 테스트용)
    INSERT INTO order_items (
      order_id, product_id, product_name, product_price, quantity,
      option_id, option_name, option_price, visit_type, selected_option_settings
    ) VALUES (
      v_order9_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
      v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
      NULL  -- 옵션 설정 미완료
    );

    -- 주문 9 문진 정보
    INSERT INTO order_health_consultation (
      order_id, user_id, name, resident_number, phone,
      current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
      target_weight, target_weight_loss_period,
      previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
      occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
      meal_pattern, alcohol_frequency, water_intake,
      diet_approach, preferred_stage, medical_history
    ) VALUES (
      v_order9_id, v_user1_id, '김다이어트', '901234-1******', '010-1234-5678',
      165.0, 73.0, 55.0, 78.0, 58.0, '2개월',
      '없음', '없음', '없음',
      '사무직', '9-6시', false, '07:30', '23:30', false,
      '3meals', 'weekly_1_or_less', 'over_1L',
      'sustainable', 'stage1', '옵션 설정 테스트용 - 상담 후 한약 단계 결정 필요'
    );

    -- ========================================================================
    -- 주문 10: 복수 옵션 중 일부만 설정된 주문 (paid, consultation_required)
    -- ========================================================================
    INSERT INTO orders (
      user_id, user_email, user_name, user_phone,
      total_amount, status, order_id, consultation_status,
      used_points, shipping_address_id,
      shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
      created_at
    ) VALUES (
      v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
      1350000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-010', 'consultation_required',
      0, v_addr2_id,
      '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
      NOW() - INTERVAL '45 minutes'
    ) RETURNING id INTO v_order10_id;

    -- 주문 10 항목 1: 1개월 패키지 (설정 완료)
    INSERT INTO order_items (
      order_id, product_id, product_name, product_price, quantity,
      option_id, option_name, option_price, visit_type, selected_option_settings
    ) VALUES (
      v_order10_id, v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
      v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
      '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
    );

    -- 주문 10 항목 2: 2개월 패키지 (설정 미완료 - 테스트용)
    INSERT INTO order_items (
      order_id, product_id, product_name, product_price, quantity,
      option_id, option_name, option_price, visit_type, selected_option_settings
    ) VALUES (
      v_order10_id, v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
      v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
      '[]'::jsonb  -- 빈 배열 - 설정 미완료
    );

    -- 주문 10 문진 정보
    INSERT INTO order_health_consultation (
      order_id, user_id, name, resident_number, phone,
      current_height, current_weight, min_weight_since_20s, max_weight_since_20s,
      target_weight, target_weight_loss_period,
      previous_western_medicine, previous_herbal_medicine, previous_other_medicine,
      occupation, work_hours, has_shift_work, wake_up_time, bedtime, has_daytime_sleepiness,
      meal_pattern, alcohol_frequency, water_intake,
      diet_approach, preferred_stage, medical_history
    ) VALUES (
      v_order10_id, v_user2_id, '이건강', '851015-2******', '010-2345-6789',
      170.0, 82.0, 65.0, 90.0, 68.0, '4개월',
      '있음 - 1년 전 복용 경험', '없음', '오메가3',
      '자영업', '10-8시', false, '09:00', '00:00', false,
      '2meals', 'weekly_1_or_less', 'over_1L',
      'fast', 'stage2', '복수 옵션 테스트용 - 2개월차 패키지 상담 필요'
    );

  -- ========================================================================
  -- 추가 주문 11-25: 옵션별 매출 분석을 위한 다양한 주문 데이터
  -- ========================================================================

  -- 주문 11: 1개월 1단계 패키지
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-011', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111011', NOW() - INTERVAL '20 days', NOW() - INTERVAL '17 days',
    NOW() - INTERVAL '25 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%011'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  );

  -- 주문 12: 1개월 2단계 패키지
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-012', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111012', NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '22 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%012'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 주문 13: 1개월 3단계 패키지
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-013', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111013', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '20 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%013'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 주문 14: 2개월 1단계-2단계 패키지 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1044000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-014', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111014', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '18 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%014'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1}, {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 1}]'::jsonb
  );

  -- 주문 15: 2개월 2단계-3단계 패키지 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1120000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-015', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111015', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '15 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%015'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1}]'::jsonb
  );

  -- 주문 16: 3개월 풀 패키지 (1-2-3단계)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    1295000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-016', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111016', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '14 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%016'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "해독 한방차 (1박스)", "price": 95000, "quantity": 1}]'::jsonb
  );

  -- 주문 17: 3개월 집중 패키지 (2-2-3단계)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1500000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-017', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111017', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '12 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%017'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (30매)", "price": 300000, "quantity": 1}]'::jsonb
  );

  -- 주문 18: 한방차만 구매 (옵션 없음)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    273000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-018', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111018', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '8 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%018'), v_product_tea_id, '대사촉진 한방차', 89000, 2),
    ((SELECT id FROM orders WHERE order_id LIKE '%018'), (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 1);

  -- 주문 19: 슬림 패치만 대량 구매 (옵션 없음)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    600000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-019', 'shipped',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    '우체국택배', '111111111019', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '7 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%019'), (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 5);

  -- 주문 20: 1개월 1단계 재구매 (revisit)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    450000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-020', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111020', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '5 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%020'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'revisit_no_consult',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb
  );

  -- 주문 21: 2개월 3단계-3단계 패키지 (고급)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    900000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-021', 'shipped',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    'CJ대한통운', '111111111021', NOW() - INTERVAL '1 day', NOW(),
    NOW() - INTERVAL '4 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%021'), (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 주문 22: 복합 주문 - 여러 상품 + 여러 옵션 + 추가상품
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    2439000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-022', 'consultation_required',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    NOW() - INTERVAL '1 day'
  );

  -- 1개월 1단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%022'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 2}]'::jsonb
  );

  -- 2개월 2단계-3단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%022'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "한방 슬림 패치 (20매)", "price": 220000, "quantity": 1}, {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}]'::jsonb
  );

  -- 일반 상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%022'), (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 3),
    ((SELECT id FROM orders WHERE order_id LIKE '%022'), (SELECT id FROM products WHERE slug = 'slim-patch'), '한방 슬림 패치', 120000, 2);

  -- 주문 23: 1개월 2단계 대량 (수량 3)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    shipping_company, tracking_number, shipped_at, delivered_at,
    created_at
  ) VALUES (
    v_user1_id, 'test1@example.com', '김다이어트', '010-1234-5678',
    1350000, 'delivered', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-023', 'shipped',
    0, v_addr1_id,
    '김다이어트', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '4층',
    'CJ대한통운', '111111111023', NOW() - INTERVAL '1 day', NOW(),
    NOW() - INTERVAL '3 days'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%023'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 3,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}]'::jsonb
  );

  -- 주문 24: 3개월 3단계 집중 패키지 (3-3-3)
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user2_id, 'test2@example.com', '이건강', '010-2345-6789',
    1200000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-024', 'consultation_required',
    0, v_addr2_id,
    '이건강', '010-2345-6789', '63000', '제주특별자치도 제주시 첨단로 242', '5층',
    NOW() - INTERVAL '12 hours'
  );

  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%024'), (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}, {"setting_name": "2개월차", "type_name": "3단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb
  );

  -- 주문 25: 모든 상품 종합 세트
  INSERT INTO orders (
    user_id, user_email, user_name, user_phone,
    total_amount, status, order_id, consultation_status,
    used_points, shipping_address_id,
    shipping_name, shipping_phone, shipping_postal_code, shipping_address, shipping_address_detail,
    created_at
  ) VALUES (
    v_user3_id, 'test3@example.com', '박체중', '010-3456-7890',
    3250000, 'paid', 'ORDER-' || to_char(NOW(), 'YYYYMMDD') || '-025', 'consultation_required',
    0, v_addr3_id,
    '박체중', '010-3456-7890', '40200', '경상북도 울릉군 울릉읍 도동리 123', '1층',
    NOW() - INTERVAL '6 hours'
  );

  -- 3개월 1-2-3단계 + 추가상품
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%025'), v_product_stage1_id, '1단계 다이어트 한약', 450000, 1,
    v_option_3month_id, '3개월 다이어트 패키지', 1200000, 'first',
    '[{"setting_name": "1개월차", "type_name": "1단계"}, {"setting_name": "2개월차", "type_name": "2단계"}, {"setting_name": "3개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (1박스)", "price": 89000, "quantity": 1}, {"addon_id": null, "name": "해독 한방차 (1박스)", "price": 95000, "quantity": 1}, {"addon_id": null, "name": "한방 슬림 패치 (10매)", "price": 120000, "quantity": 1}, {"addon_id": null, "name": "건강 보조제 세트", "price": 55000, "quantity": 1}]'::jsonb
  );

  -- 2개월 2-3단계
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%025'), v_product_stage2_id, '2단계 다이어트 한약', 520000, 1,
    v_option_2month_id, '2개월 다이어트 패키지', 900000, 'first',
    '[{"setting_name": "1개월차", "type_name": "2단계"}, {"setting_name": "2개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "대사촉진 한방차 (2박스)", "price": 170000, "quantity": 1}, {"addon_id": null, "name": "프리미엄 다이어트 북", "price": 30000, "quantity": 1}]'::jsonb
  );

  -- 1개월 3단계
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity,
    option_id, option_name, option_price, visit_type, selected_option_settings,
    selected_addons
  ) VALUES (
    (SELECT id FROM orders WHERE order_id LIKE '%025'), (SELECT id FROM products WHERE slug = 'diet-stage3'), '3단계 다이어트 한약', 480000, 1,
    v_option_1month_id, '1개월 다이어트 패키지', 450000, 'first',
    '[{"setting_name": "1개월차", "type_name": "3단계"}]'::jsonb,
    '[{"addon_id": null, "name": "요요 방지 가이드북", "price": 25000, "quantity": 1}]'::jsonb
  );

  -- 일반 상품들
  INSERT INTO order_items (
    order_id, product_id, product_name, product_price, quantity
  ) VALUES
    ((SELECT id FROM orders WHERE order_id LIKE '%025'), v_product_tea_id, '대사촉진 한방차', 89000, 2),
    ((SELECT id FROM orders WHERE order_id LIKE '%025'), (SELECT id FROM products WHERE slug = 'detox-tea'), '해독 한방차', 95000, 2);

  -- 포인트 히스토리 추가
  INSERT INTO point_history (user_id, points, type, reason, order_id, created_at)
  VALUES
    (v_user1_id, 10000, 'earn', '회원가입 축하 포인트', NULL, NOW() - INTERVAL '30 days'),
    (v_user1_id, 5000, 'use', '주문 시 포인트 사용', v_order1_id, NOW() - INTERVAL '2 days'),
    (v_user2_id, 3000, 'earn', '첫 구매 감사 포인트', v_order2_id, NOW() - INTERVAL '5 days'),
    (v_user3_id, 15000, 'earn', '이벤트 당첨 포인트', NULL, NOW() - INTERVAL '20 days'),
    (v_user3_id, 15000, 'use', '주문 시 포인트 사용', v_order3_id, NOW() - INTERVAL '10 days');

  -- 관리자 활동 로그 추가
  INSERT INTO admin_activity_logs (
    admin_user_id, action, resource_type, resource_id, details, created_at
  ) VALUES
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'order_status_update', 'order', v_order2_id,
     '{"from": "paid", "to": "shipping", "tracking_number": "123456789012"}'::jsonb,
     NOW() - INTERVAL '1 day'),
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'consultation_complete', 'order', v_order2_id,
     '{"notes": "상담 완료 후 발송 처리"}'::jsonb,
     NOW() - INTERVAL '2 days'),
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'order_status_update', 'order', v_order3_id,
     '{"from": "shipping", "to": "delivered"}'::jsonb,
     NOW() - INTERVAL '1 day'),
    ((SELECT id FROM admin_users WHERE username = 'master' LIMIT 1),
     'order_cancel', 'order', v_order5_id,
     '{"reason": "고객 요청", "refund_amount": 520000}'::jsonb,
     NOW() - INTERVAL '3 days');

END $$;

-- 메인 배너 테스트 데이터
INSERT INTO main_banners (title, description, image_url, mobile_image_url, link_url, device_type, display_order, is_active) VALUES
('겨울 다이어트 시즌 OPEN', '지금 시작하면 봄에 자신있게!', 'https://via.placeholder.com/1200x400?text=Winter+Diet+Season', 'https://via.placeholder.com/600x800?text=Winter+Diet+Mobile', '/products/diet-stage1', 'both', 0, true),
('신규 회원 특별 혜택', '첫 구매 시 10% 할인 쿠폰 증정', 'https://via.placeholder.com/1200x400?text=New+Member+Benefits', NULL, '/signup', 'pc', 1, true),
('모바일 전용 이벤트', '앱에서만 받을 수 있는 특별 혜택', 'https://via.placeholder.com/600x800?text=Mobile+Only+Event', NULL, '/app-download', 'mobile', 2, true)
ON CONFLICT DO NOTHING;

-- 상품 배너 테스트 데이터
INSERT INTO product_banners (title, description, image_url, mobile_image_url, link_url, device_type, display_order, is_active) VALUES
('베스트셀러 한약', '가장 많이 선택된 다이어트 한약', 'https://via.placeholder.com/800x300?text=Best+Seller', 'https://via.placeholder.com/400x500?text=Best+Seller+Mobile', '/products/diet-stage2', 'both', 0, true),
('한방차 기획전', '체질에 맞는 한방차 찾기', 'https://via.placeholder.com/800x300?text=Herbal+Tea+Collection', NULL, '/category/tea', 'pc', 1, true)
ON CONFLICT DO NOTHING;

COMMIT;
