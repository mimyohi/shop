-- 트리거 함수 수정: display_name이 없으면 name, full_name 순으로 확인
-- 카카오 OAuth 사용자는 display_name 대신 name/full_name 필드를 사용하기 때문

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name, phone, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name'
    ),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(
      EXCLUDED.display_name,
      user_profiles.display_name
    ),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    phone_verified = COALESCE(EXCLUDED.phone_verified, user_profiles.phone_verified);

  INSERT INTO public.user_points (user_id, points)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 기존 카카오 사용자들의 display_name을 업데이트 (null인 경우만)
UPDATE user_profiles up
SET display_name = COALESCE(
  u.raw_user_meta_data->>'display_name',
  u.raw_user_meta_data->>'name',
  u.raw_user_meta_data->>'full_name'
)
FROM auth.users u
WHERE up.user_id = u.id
AND up.display_name IS NULL
AND (
  u.raw_user_meta_data->>'display_name' IS NOT NULL
  OR u.raw_user_meta_data->>'name' IS NOT NULL
  OR u.raw_user_meta_data->>'full_name' IS NOT NULL
);
